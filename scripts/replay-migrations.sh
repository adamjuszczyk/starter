#!/usr/bin/env bash
# replay-migrations.sh
#
# Replays every file in supabase/migrations, in order, on an empty Supabase
# Postgres (the supabase/postgres image named in supabase/postgres-image: an
# app sets it to its production project's version), and fails on the first
# error. This is the `migration-replay` check
# (.github/workflows/migration-replay.yml); it also runs locally wherever
# Docker runs (Linux / macOS / WSL — not Windows cmd).
#
# Usage:  bash scripts/replay-migrations.sh [--snapshot FILE] [--keep] [--fixture]
#   --snapshot FILE  after a clean replay, write scripts/schema-snapshot.sql's
#                    JSON to FILE. The starter has no such file (it went with
#                    schema compare), so this exits 2 until an app adds one.
#   --keep           leave the container running (for inspection)
#   --fixture        after the app's migrations, also replay the verify-rls
#                    fixture: scripts/verify-rls-fixture/migrations/*.sql in order,
#                    then seed.sql (two auth.users rows and the rows the probes
#                    count). This is verify-rls.mjs's self-test
#                    (scripts/verify-rls-replay.sh --fixture); a fixture file that
#                    fails is exit 1 like any migration.
# Env:    SUPABASE_PG_IMAGE  image to use (default: the first line of
#                            supabase/postgres-image)
#
# Exit:   0 = every migration applied (or none exist and the access list is empty)
#         1 = a migration failed (the file and the error are printed)
#         2 = couldn't run (no Docker, image pull failed, database never came up,
#             no image named, the auth functions didn't apply, there are no
#             migrations while supabase/access.json names tables, or --fixture
#             was given and the fixture's files aren't there)
#
# Before the first migration, scripts/replay-auth-functions.sql is applied as
# supabase_admin: the Auth service's uid(), role(), email() and jwt(), which a
# hosted project has and the image's init script lacks (jwt()) or defines older
# (the other three).
#
# Each migration file runs as role postgres (not a superuser on Supabase, as in
# production) with ON_ERROR_STOP and --single-transaction, the way Supabase
# applies a migration file: inside one transaction.

set -uo pipefail

# The image's version is one file, supabase/postgres-image: production's version
# (`supabase link` writes it to supabase/.temp/postgres-version on Adam's
# machine). The new-app checklist sets it from the app's project; update it when
# Supabase upgrades the project.
IMAGE_FILE="supabase/postgres-image"
MIGRATIONS_DIR="supabase/migrations"
ACCESS_FILE="supabase/access.json"
AUTH_SQL="scripts/replay-auth-functions.sql"
SNAPSHOT_SQL="scripts/schema-snapshot.sql"
FIXTURE_DIR="scripts/verify-rls-fixture"

snapshot=""
keep=0
fixture=0
while [ $# -gt 0 ]; do
  case "$1" in
    --snapshot) snapshot="${2:-}"; shift 2 ;;
    --keep) keep=1; shift ;;
    --fixture) fixture=1; shift ;;
    *) echo "replay-migrations: unknown argument $1" >&2; exit 2 ;;
  esac
done
if [ -n "$snapshot" ] && [ ! -f "$SNAPSHOT_SQL" ]; then
  echo "replay-migrations: $SNAPSHOT_SQL not found." >&2; exit 2
fi

IMAGE="${SUPABASE_PG_IMAGE:-}"
if [ -z "$IMAGE" ] && [ -f "$IMAGE_FILE" ]; then
  IMAGE="$(head -n 1 "$IMAGE_FILE" | tr -d '[:space:]')"
fi
if [ -z "$IMAGE" ]; then
  echo "replay-migrations: no image: $IMAGE_FILE is missing or empty and SUPABASE_PG_IMAGE isn't set (run from the repo root)." >&2; exit 2
fi
if [ ! -f "$AUTH_SQL" ]; then
  echo "replay-migrations: $AUTH_SQL not found (run from the repo root)." >&2; exit 2
fi

# A missing folder would look like a clean replay. Refuse instead. An empty one is
# a clean replay only while the access list is empty too: a list that names tables
# with no migration to create them is a replay that proved nothing.
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "replay-migrations: no $MIGRATIONS_DIR folder here (run from the repo root)." >&2; exit 2
fi
mapfile -t files < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' -printf '%f\n' | LC_ALL=C sort)
if [ "${#files[@]}" -eq 0 ]; then
  if [ ! -f "$ACCESS_FILE" ]; then
    echo "replay-migrations: no .sql files in $MIGRATIONS_DIR, and no $ACCESS_FILE to say whether that is right." >&2; exit 2
  fi
  if [ "$(tr -d '[:space:]' < "$ACCESS_FILE")" != "{}" ]; then
    echo "replay-migrations: $ACCESS_FILE isn't empty ({}), but there are no .sql files in $MIGRATIONS_DIR: nothing creates the tables it names." >&2; exit 2
  fi
fi

# --fixture: its files must be there, or the self-test would run on nothing.
if [ "$fixture" -eq 1 ]; then
  if [ ! -d "$FIXTURE_DIR/migrations" ] || [ ! -f "$FIXTURE_DIR/seed.sql" ]; then
    echo "replay-migrations: --fixture needs $FIXTURE_DIR/migrations/ and $FIXTURE_DIR/seed.sql (run from the repo root)." >&2; exit 2
  fi
  mapfile -t fixture_files < <(cd "$FIXTURE_DIR" && find migrations -maxdepth 1 -type f -name '*.sql' | LC_ALL=C sort)
  if [ "${#fixture_files[@]}" -eq 0 ]; then
    echo "replay-migrations: no .sql files in $FIXTURE_DIR/migrations." >&2; exit 2
  fi
  fixture_migrations="${#fixture_files[@]}"
  fixture_files+=(seed.sql)
fi

if ! docker info >/dev/null 2>&1; then
  echo "replay-migrations: Docker isn't running." >&2; exit 2
fi

name="migration-replay-$$"
cleanup() { if [ "$keep" -eq 0 ]; then docker rm -f "$name" >/dev/null 2>&1 || true; fi; }
trap cleanup EXIT

echo "replay-migrations: image $IMAGE"
if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  docker pull --quiet "$IMAGE" >/dev/null || { echo "replay-migrations: couldn't pull $IMAGE." >&2; exit 2; }
fi
docker run -d --name "$name" -e POSTGRES_PASSWORD=postgres "$IMAGE" >/dev/null \
  || { echo "replay-migrations: couldn't start the container." >&2; exit 2; }

# psql inside the container, over TCP as postgres (password auth, like the platform).
psql_c() { docker exec -i -e PGPASSWORD=postgres "$name" psql -h 127.0.0.1 -U postgres -d postgres -X "$@"; }
# The same as supabase_admin, the image's superuser: only for the auth functions below.
psql_admin() { docker exec -i -e PGPASSWORD=postgres "$name" psql -h 127.0.0.1 -U supabase_admin -d postgres -X "$@"; }

# The image restarts Postgres once after its init scripts; wait until auth.uid()
# exists and the server answers three times in a row, two seconds apart.
ready=0
for _ in $(seq 1 90); do
  if psql_c -tAc "select to_regprocedure('auth.uid()') is not null" 2>/dev/null | grep -qx t; then
    ready=$((ready + 1)); [ "$ready" -ge 3 ] && break
  else
    ready=0
  fi
  sleep 2
done
if [ "$ready" -lt 3 ]; then
  echo "replay-migrations: the database never came up." >&2
  docker logs --tail 30 "$name" >&2 || true
  exit 2
fi
echo "replay-migrations: $(psql_c -tAc 'select version()')"

# The Auth service's functions, before the first migration (see the header).
if ! out=$(psql_admin -q -v ON_ERROR_STOP=1 --single-transaction -f - < "$AUTH_SQL" 2>&1); then
  echo "$out" | sed 's/^/        /' >&2
  echo "replay-migrations: couldn't apply $AUTH_SQL." >&2
  exit 2
fi
echo "replay-migrations: auth functions applied ($AUTH_SQL, as supabase_admin)"

applied=0
for f in "${files[@]}"; do
  if out=$(psql_c -q -v ON_ERROR_STOP=1 --single-transaction -f - < "$MIGRATIONS_DIR/$f" 2>&1); then
    applied=$((applied + 1))
    echo "  ok    $f"
  else
    echo "  FAIL  $f"
    echo "$out" | sed 's/^/        /'
    echo "replay-migrations: FAILED at $f ($applied of ${#files[@]} applied before it)." >&2
    exit 1
  fi
done

# --fixture: the verify-rls fixture, after the app's migrations: its migrations in order, then the seed. Each as
# postgres in one transaction, as above (the seed inserts into auth.users, which postgres may do on the image).
if [ "$fixture" -eq 1 ]; then
  for f in "${fixture_files[@]}"; do
    if out=$(psql_c -q -v ON_ERROR_STOP=1 --single-transaction -f - < "$FIXTURE_DIR/$f" 2>&1); then
      echo "  ok    fixture/$f"
    else
      echo "  FAIL  fixture/$f"
      echo "$out" | sed 's/^/        /'
      echo "replay-migrations: FAILED at the fixture's $f." >&2
      exit 1
    fi
  done
  echo "replay-migrations: fixture applied ($fixture_migrations migration(s) and seed.sql from $FIXTURE_DIR)."
fi

tables=$(psql_c -tAc "select count(*) from pg_tables where schemaname = 'public'")
if [ "${#files[@]}" -eq 0 ]; then
  echo "replay-migrations: OK — 0 of 0 applied, access list empty; public now has $tables tables."
else
  echo "replay-migrations: OK — ${#files[@]} of ${#files[@]} migrations applied; public now has $tables tables."
fi

if [ -n "$snapshot" ]; then
  if ! psql_c -tA -v ON_ERROR_STOP=1 -f - < "$SNAPSHOT_SQL" > "$snapshot"; then
    echo "replay-migrations: snapshot query failed." >&2; exit 2
  fi
  echo "replay-migrations: snapshot written to $snapshot"
fi
if [ "$keep" -eq 1 ]; then echo "replay-migrations: container $name left running (--keep)."; fi
exit 0

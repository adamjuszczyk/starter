#!/usr/bin/env bash
# verify-rls-replay.sh — scripts/verify-rls.mjs on a real replayed Supabase Postgres.
#
# Replays every migration on a real supabase/postgres (scripts/replay-migrations.sh --keep, which applies the Auth
# service's functions first), starts PostgREST on it the way a hosted project runs it, and probes every table in the
# access list as user A, user B and a signed-out visitor. Nobody signs in: scripts/replay-tokens.mjs mints the tokens
# with the secret PostgREST starts with (Decided 13). Shaped on check-embeds-local.sh, with three differences:
#   - PostgREST connects as `authenticator` (its password is set here), not as postgres: on the image that role loads
#     pg-safeupdate, as it does on a hosted project, and the probes run as the role a hosted project runs. The
#     signed-out caller is the real `anon` (PGRST_DB_ANON_ROLE=anon), not a stand-in for it;
#   - it proves that first: the PostgREST sessions belong to authenticator and an authenticator session refuses a bare
#     DELETE (21000, safeupdate). Without that the probes would say nothing about a hosted project;
#   - it hands verify-rls.mjs the catalog (RLS on, the grants, what anon holds) that psql reads, since PostgREST cannot
#     show it.
#
# Usage:  bash scripts/verify-rls-replay.sh [--fixture]
#   --fixture  the self-test: the replay also applies scripts/verify-rls-fixture/ (three tables, one per kind, and two
#              users with rows) and verify-rls.mjs probes those instead of supabase/access.json. Every check must PASS.
#              Without it the app's list is probed; the starter's is empty, which passes. A list with tables needs rows
#              to probe: the app adds supabase/verify-rls-seed.sql (the two test users and a row of each in every
#              table), which is applied after the migrations when the file exists, and only then.
# Needs:  Docker (start dockerd first in this container); node_modules (`npm ci`: verify-rls.mjs imports
#         @supabase/supabase-js); pulls postgrest/postgrest.
# Exit:   0 every check passed (or the list is empty); 1 a leak or a failure, or the session is not authenticator's;
#         2 couldn't run (the replay failed, PostgREST didn't come up, no node_modules).
set -uo pipefail

POSTGREST_IMAGE="${POSTGREST_IMAGE:-postgrest/postgrest:v12.2.3}"
usage="verify-rls-replay: usage: bash scripts/verify-rls-replay.sh [--fixture]"
mode=()
if [ $# -gt 1 ]; then echo "$usage" >&2; exit 2; fi
case "${1:-}" in
  "") ;;
  --fixture) mode=(--fixture) ;;
  *) echo "$usage" >&2; exit 2 ;;
esac

if [ ! -d node_modules/@supabase/supabase-js ]; then
  echo "verify-rls-replay: node_modules/@supabase/supabase-js is missing: run npm ci first (verify-rls.mjs imports it)." >&2; exit 2
fi

tmp=$(mktemp -d "${TMPDIR:-/tmp}/verify-rls.XXXXXX")
out=$(bash scripts/replay-migrations.sh --keep ${mode[@]+"${mode[@]}"} 2>&1) \
  || { echo "$out" | tail -8; echo "verify-rls-replay: replay failed." >&2; rm -rf "$tmp"; exit 2; }
echo "$out"
db=$(echo "$out" | sed -n 's/.*container \(migration-replay-[0-9]*\) left running.*/\1/p')
[ -n "$db" ] || { echo "verify-rls-replay: couldn't find the replay container." >&2; rm -rf "$tmp"; exit 2; }
api="verify-rls-postgrest-$$"
cleanup() { docker rm -f "$api" "$db" >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT

# supabase_admin, the image's superuser, inside the replay container: to set authenticator's password and to read the
# catalog and the sessions.
psql_admin() { docker exec -i -e PGPASSWORD=postgres "$db" psql -h 127.0.0.1 -U supabase_admin -d postgres -X "$@"; }

# The app's rows for the probes (app mode only: the fixture brings its own). An app that has tables adds
# supabase/verify-rls-seed.sql: the two test users (scripts/replay-tokens.mjs's USER_A and USER_B) in auth.users, and at
# least one row of each in every table of the access list. It runs as postgres in one transaction, like a migration,
# after the migrations. With no file there is no seed, and a non-empty list then fails on "0 own rows" (never a pass).
SEED="supabase/verify-rls-seed.sql"
if [ "${#mode[@]}" -eq 0 ] && [ -f "$SEED" ]; then
  if seed_out=$(docker exec -i -e PGPASSWORD=postgres "$db" psql -h 127.0.0.1 -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 --single-transaction -f - < "$SEED" 2>&1); then
    echo "verify-rls-replay: seed applied ($SEED, as postgres)"
  else
    echo "$seed_out" | sed 's/^/        /' >&2
    echo "verify-rls-replay: couldn't apply $SEED." >&2; exit 2
  fi
fi

# A password and a JWT secret for this run only, never printed: the values reach docker and node through the
# environment (`docker run -e NAME`, `NAME=... node`), not through a command line.
rand() { head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
authenticator_pw=$(rand)
jwt_secret=$(rand)
printf "alter role authenticator with password '%s';\n" "$authenticator_pw" \
  | psql_admin -q -v ON_ERROR_STOP=1 -f - >/dev/null \
  || { echo "verify-rls-replay: couldn't set authenticator's password." >&2; exit 2; }

ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$db")
export PGRST_DB_URI="postgres://authenticator:$authenticator_pw@$ip:5432/postgres"
export PGRST_JWT_SECRET="$jwt_secret"
docker run -d --name "$api" \
  -e PGRST_DB_URI -e PGRST_JWT_SECRET \
  -e PGRST_DB_ANON_ROLE=anon -e PGRST_DB_SCHEMAS=public \
  "$POSTGREST_IMAGE" >/dev/null || { echo "verify-rls-replay: couldn't start PostgREST." >&2; exit 2; }
apiip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$api")
for _ in $(seq 1 30); do curl -sf "http://$apiip:3000/" >/dev/null 2>&1 && break; sleep 1; done
curl -sf "http://$apiip:3000/" >/dev/null 2>&1 \
  || { docker logs "$api" 2>&1 | tail -5; echo "verify-rls-replay: PostgREST didn't come up." >&2; exit 2; }

# The proof that this runs as the role a hosted project runs. PostgREST names itself in pg_stat_activity
# (application_name 'PostgREST <version>'): every one of its connections must belong to authenticator. And an
# authenticator session must have pg-safeupdate on (the image sets it for that role alone): a DELETE with no WHERE
# clause is refused with 21000 before any permission is looked at, on a catalog table nobody may touch, in a
# transaction that is rolled back. Connected as postgres, PostgREST gets neither, and the probes below would
# be answering for a role no hosted project uses.
sessions=$(psql_admin -tA -v ON_ERROR_STOP=1 -c \
  "select coalesce(string_agg(distinct usename::text, ',' order by usename::text), '') from pg_stat_activity where application_name like 'PostgREST%'")
if [ -z "$sessions" ]; then
  echo "verify-rls-replay: no PostgREST connection in pg_stat_activity: can't tell which role it runs as." >&2; exit 2
fi
if [ "$sessions" != "authenticator" ]; then
  echo "verify-rls-replay: FAILED: PostgREST's sessions run as $sessions, not authenticator. pg-safeupdate (loaded for authenticator's sessions only) is unset there, and a hosted project runs PostgREST as authenticator." >&2
  exit 1
fi
bare_delete=$(printf 'begin;\n\\set VERBOSITY verbose\ndelete from pg_catalog.pg_database;\nrollback;\n' \
  | PGPASSWORD="$authenticator_pw" docker exec -i -e PGPASSWORD "$db" psql -h 127.0.0.1 -U authenticator -d postgres -X -q 2>&1)
case "$bare_delete" in
  *21000*"DELETE requires a WHERE clause"*)
    echo "verify-rls-replay: PostgREST's sessions run as authenticator; safeupdate is on in its sessions (a bare DELETE answers 21000)." ;;
  *)
    echo "verify-rls-replay: FAILED: an authenticator session did not refuse a bare DELETE with 21000 (safeupdate unset): $bare_delete" >&2
    exit 1 ;;
esac

# The catalog verify-rls.mjs cannot ask PostgREST for: per relation in public, its kind, whether RLS is on
# (pg_class.relrowsecurity), the API roles' grants as listed (information_schema.role_table_grants, which shows
# neither grants to PUBLIC nor column-level ones) and what anon actually holds: has_table_privilege('anon', …) counts a
# grant to PUBLIC and a default privilege the same as one made to anon by name, and has_any_column_privilege finds
# column-level grants. verify-rls.mjs fails an own or a signed-in table on which anon holds anything (Decided 39).
psql_admin -tA -v ON_ERROR_STOP=1 -f - > "$tmp/catalog.json" <<'SQL' \
  || { echo "verify-rls-replay: couldn't read the catalog." >&2; exit 2; }
select coalesce(json_object_agg(r.relname, json_build_object(
         'relkind', r.relkind,
         'rls', r.relrowsecurity,
         'options', r.reloptions,
         'grants', coalesce((
           select json_object_agg(g.grantee, g.privileges)
           from (select grantee::text as grantee, json_agg(privilege_type::text order by privilege_type::text) as privileges
                 from information_schema.role_table_grants
                 where table_schema = 'public' and table_name = r.relname
                   and grantee in ('anon', 'authenticated', 'service_role')
                 group by grantee) g
         ), '{}'::json),
         'anon', coalesce((
           select json_agg(p order by p)
           from unnest(array['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE']) p
           where has_table_privilege('anon', r.oid, p)
         ), '[]'::json),
         'anon_columns', has_any_column_privilege('anon', r.oid, 'SELECT,INSERT,UPDATE,REFERENCES')
                         and not has_table_privilege('anon', r.oid, 'SELECT,INSERT,UPDATE,REFERENCES')
       )), '{}'::json)
from (select c.oid, c.relname::text as relname, c.relkind::text as relkind, c.relrowsecurity, c.reloptions
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')) r;
SQL

RLS_JWT_SECRET="$jwt_secret" node scripts/verify-rls.mjs ${mode[@]+"${mode[@]}"} --local "http://$apiip:3000" --catalog "$tmp/catalog.json"
exit $?

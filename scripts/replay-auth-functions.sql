-- replay-auth-functions.sql
--
-- The Supabase Auth service's helper functions, as the service defines them today. The replay
-- (scripts/replay-migrations.sh) applies this file as supabase_admin, once, before the first migration.
-- Reason: the image's init script defines only older uid(), role() and email() (they read the legacy
-- per-claim settings only, not request.jwt.claims) and no jwt(); a migration that calls auth.jwt()
-- is valid on a hosted project and would fail every replay without it.
--
-- Lifted verbatim from github.com/supabase/auth (branch master, fetched 2026-11-06). The two source
-- migrations are Go templates; their placeholder {{ index .Options "Namespace" }} is written as auth.
-- Nothing else is changed. The Auth service's function bodies move with its versions: this file holds
-- the ones above, and re-lifting it is a deliberate act, never a side effect.

-- Source: supabase/auth, migrations/20220224000811_update_auth_functions.up.sql
--   uid(), role() and email(), reading the claims JSON as well as the legacy settings.
--   sha256 of the source file: 5b72022d73e64a8e474d2122ac42f299bb7ce4d59755cdcc78e72abfe5d47dc0
-- update auth functions

create or replace function auth.uid() 
returns uuid 
language sql stable
as $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() 
returns text 
language sql stable
as $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create or replace function auth.email() 
returns text 
language sql stable
as $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;

-- Source: supabase/auth, migrations/20220531120530_add_auth_jwt_function.up.sql
--   jwt(), and the deprecation comments on uid(), role() and email().
--   sha256 of the source file: 91d2d5e47f19e65a63ec411f6cbb18755ec1792cb4249694dc261ef59cc78a10
-- add auth.jwt function

comment on function auth.uid() is 'Deprecated. Use auth.jwt() -> ''sub'' instead.';
comment on function auth.role() is 'Deprecated. Use auth.jwt() -> ''role'' instead.';
comment on function auth.email() is 'Deprecated. Use auth.jwt() -> ''email'' instead.';

create or replace function auth.jwt()
returns jsonb
language sql stable
as $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;

-- 001_fixture.sql — the self-test fixture of scripts/verify-rls.mjs (chunk 3).
--
-- Three tables, one per kind in supabase/access.json: fx_own (own), fx_shared (signed-in), fx_public (public).
-- `bash scripts/verify-rls-replay.sh --fixture` replays this file and seed.sql after the app's migrations, then
-- proves verify-rls.mjs on them: every probe must PASS here, and each break proof in TASKS.md (chunk 3) edits a scratch
-- copy of this file to make one probe fail. Nothing here is for an app: apps write their own migrations.
-- Written the way a migration of the starter is written (the stack skill's rules): RLS on, the policy each kind
-- needs, every grant spelled out after a `revoke all` (Decided 39).

-- user_id references auth.users on all three: the owner probes ask for the column, and Decided 49 makes a missing
-- column a FAIL (42703), so a fixture without it could not tell the kinds apart.
create table public.fx_own (
  id      bigint generated always as identity primary key,
  user_id uuid   not null references auth.users (id) on delete cascade,
  note    text   not null
);
create table public.fx_shared (
  id      bigint generated always as identity primary key,
  user_id uuid   not null references auth.users (id) on delete cascade,
  note    text   not null
);
create table public.fx_public (
  id      bigint generated always as identity primary key,
  user_id uuid   not null references auth.users (id) on delete cascade,
  note    text   not null
);

alter table public.fx_own    enable row level security;
alter table public.fx_shared enable row level security;
alter table public.fx_public enable row level security;

-- own: only the user who wrote a row sees it (Overload's 002_v2_rls_policies.sql).
create policy "Users access own rows" on public.fx_own
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- signed-in: every signed-in user reads every row; a user writes only rows that are theirs.
create policy "Signed-in users read every row" on public.fx_shared
  for select to authenticated using (true);
create policy "Users insert own rows" on public.fx_shared
  for insert to authenticated with check (user_id = auth.uid());
create policy "Users update own rows" on public.fx_shared
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users delete own rows" on public.fx_shared
  for delete to authenticated using (user_id = auth.uid());

-- public: anyone reads, signed out included.
create policy "Anyone reads every row" on public.fx_public
  for select using (true);

-- Grants. Supabase's default privileges give anon, authenticated and service_role ALL on every new table (the
-- replay shows it), and they are a project setting (`auto_expose_new_tables`): a table that leans on them passes the
-- replay and answers 42501 where they are off. So every table first loses everything, then gets exactly what it
-- needs (Overload's 048, which does the same for a public table). fx_own and fx_shared keep nothing for anon, so a
-- signed-out request is refused (42501) whatever the policies say. Only select is granted because verify-rls.mjs
-- reads and never writes; the write policies above are what a real migration would carry.
revoke all on table public.fx_own, public.fx_shared, public.fx_public from public, anon, authenticated, service_role;
grant select on table public.fx_own    to authenticated;
grant select on table public.fx_shared to authenticated;
grant select on table public.fx_public to anon, authenticated;

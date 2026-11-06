-- seed.sql — the rows of the verify-rls fixture (chunk 3), applied after 001_fixture.sql as postgres.
--
-- Two users, A and B, and in every fixture table two rows for A and one for B. The counts matter: the probes ask for
-- "A sees at least one row of A's" (so an empty table cannot pass), and a leak shows as B counting A's two rows.
-- The two ids are scripts/replay-tokens.mjs's USER_A and USER_B: the tokens it mints carry them as `sub`, and
-- auth.uid() answers them. verify-rls.test.mjs fails if the two files drift apart.

insert into auth.users (id, aud, role, email) values
  ('00000000-0000-4000-8000-00000000000a', 'authenticated', 'authenticated', 'a@verify-rls.invalid'),
  ('00000000-0000-4000-8000-00000000000b', 'authenticated', 'authenticated', 'b@verify-rls.invalid');

insert into public.fx_own (user_id, note) values
  ('00000000-0000-4000-8000-00000000000a', 'own a1'),
  ('00000000-0000-4000-8000-00000000000a', 'own a2'),
  ('00000000-0000-4000-8000-00000000000b', 'own b1');

insert into public.fx_shared (user_id, note) values
  ('00000000-0000-4000-8000-00000000000a', 'shared a1'),
  ('00000000-0000-4000-8000-00000000000a', 'shared a2'),
  ('00000000-0000-4000-8000-00000000000b', 'shared b1');

insert into public.fx_public (user_id, note) values
  ('00000000-0000-4000-8000-00000000000a', 'public a1'),
  ('00000000-0000-4000-8000-00000000000a', 'public a2'),
  ('00000000-0000-4000-8000-00000000000b', 'public b1');

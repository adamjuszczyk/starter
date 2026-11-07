# The longer rules, in Overload's words

The rules `SKILL.md` marks "→ reference.md", which do not fit a sentence. Lifted from Overload's RULES.md (`adamjuszczyk/overload-v2`, commit `8e00877`, read-only at `../overload-v2`): each heading's `L170` is a line of that file, and the quoted text is the rule as Overload wrote it. `[…]` marks words left out: an Overload-only example, a chunk number, a history. Anything not in a quote (the headings, and the notes in italics) is the starter's. A rule here was right for Overload and is lifted, not re-proven; where a note says what the starter does differently, the note is the starter's fact.

Contents: L170 · L171 · L202 · L248 · L252 (with L253) · L305 · L306 · L307 · L316 (with L318, L319, L320) · L321 · L325 · L341 · L383 · L384 · L555 · L394 · L400 · L411.

### L170 · a push is not a deploy

> **A successful push.** `ignoreCommand` once silently skipped a deploy whose last commit was docs-only […]. Confirm a deploy landed at four levels: `vercel ls` (a real build, not a 2 s "Canceled" row), `vercel inspect` on the canonical alias (`Ready`, production), the function list, and a grep of the deployed bundle for new strings (and absence of old ones).

*The starter has no `api/` yet, so no function list; an app that adds one keeps that level. `vercel.json`'s `ignoreCommand` is the starter's own (Decided 22).*

### L171 · green checks, broken deploy

> **typecheck + build + Vitest all green while every API call crashed:** Vite/Vitest bundler resolution tolerates extensionless relative imports; Vercel's Node ESM does not (`ERR_MODULE_NOT_FOUND`). Also a raw env var carrying an invisible character produced a 401 for a valid token. Only a real deploy + call finds these.

*The first half matters the day an app adds `api/`. The second half is why `src/lib/supabase.ts` strips every character outside printable ASCII from the URL and the key.*

### L202 · a fake server refuses in the real shape

> **A fake server that refuses in a shape the real one does not** […].
> - What went wrong: the builder's first […] matched `Key ([…])=` in the error's details, because its unit fake answered that way.
> - What the real server sends: PostgREST under RLS answers `Key is not present in table "[…]".` with no key, so the rule would have matched only through the message.
> - The rule: an error the app reads is matched on what the real server sends, here the constraint's name in `message`. The fake answers in that shape, read once on […] with a write the key refuses (nothing is written).

*The starter reads the real shape on the replay (`scripts/verify-rls-replay.sh` runs PostgREST on it), not on a hosted project.*

### L248 · a named column list fails the whole read

> **A column that is no longer read is left out of a named column list, and a named list fails the whole read when one of its columns is missing** […]: `select('*')` still returns a column the mapper ignores […]; PostgREST answers `400` / `42703` to a list naming a column the database lacks, where `*` simply returned less. A column a migration adds joins such a list only once that migration is live where the code runs, and the list is probed against the real PostgREST (with a made-up-column control) before it ships.

### L252 (with L253) · an upsert writes the columns the payload names

> **A column a full-row upsert must leave alone is left out of the payload, and the write row's type leaves it out too** […]. PostgREST's upsert (`on_conflict` with `resolution=merge-duplicates`) writes only the columns the payload names. So […] leaves […] out, its row typed `Omit<[…]>`.
> - Naming the column directly then fails `npm run typecheck` (TS2353), but a spread such as `...(cond ? { […] } : {})` passes it: only the payload tests catch that […].
> - Prove it with a value stored behind the client's back ([…]): the app loads the row, the API changes the column, the app writes, and the column must still hold the API's value.
>
> […]

### L305 · the image's auth.users is minimal

> **The seed needs GoTrue's auth schema** […]: the `supabase/postgres` image's `auth.users` is minimal (no `email_confirmed_at`, no `auth.identities`) until GoTrue has started once against it, so `seed.sql` cannot run on a bare `replay-migrations.sh` container.

*The starter's replay needs no GoTrue (Decided 13): the fixture's `seed.sql` and an app's `supabase/verify-rls-seed.sql` insert into `auth.users` only the columns the bare image has (`id`, `aud`, `role`, `email`). A seed that needs the full Auth schema, a real sign-in say, needs GoTrue started once, and the next two rules.*

### L306 · when GoTrue is ready

> **GoTrue is ready for the seed only when its log says "GoTrue migrations applied successfully"** […]: `auth.identities` exists before its last columns, so a seed started on a schema probe failed at its identities insert.

### L307 · a local stack with a real Auth service

> **A local stack […]** […]: `bash scripts/replay-migrations.sh --keep`, then GoTrue (`supabase/gotrue:v2.180.0`, sign-ups off) and PostgREST (`postgrest/postgrest:v12.2.3`, `PGRST_DB_MAX_ROWS=1000`) on the Docker bridge behind a small Node gateway[…].

*Overload's recipe, lifted and not re-run by the starter (nothing in it needs the stack until an app wants a real sign-in on the replay).*

### L316 (with L318, L319, L320) · prove a function as the signed-in role

> **A function is proven as the signed-in role, in a session that has pg-safeupdate loaded** […].
> - Connect as `supabase_admin` and `load 'safeupdate'` (the `postgres` role can't load it), and canary it with a bare UPDATE that must be refused.
> - Then `set local role authenticated` with `request.jwt.claim.sub`: the replay image's `auth.uid()` reads only that claim. PostgREST 12 sets `request.jwt.claims`, so a local PostgREST over the replay read every call as "not signed in" until it had Supabase's real `auth.uid()` […].
> - `SET ROLE` doesn't apply a role's own settings (`authenticated`'s `statement_timeout = 8s`): set them per transaction.
> - Without GoTrue ([…]): as `supabase_admin`, replace `auth.uid()` with the hosted definition, `coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid`. Then insert the user into `auth.users (id)`, give `authenticator` a password, and use an HS256 JWT signed with `PGRST_JWT_SECRET` (role `authenticated`, the user's `sub`) as the client's key, behind a small `/rest/v1` gateway in front of PostgREST. The app's own TypeScript runs against it through Vite's SSR loader: a cheaper write-path proof than the full local stack.

*The starter's replay already applies the hosted `auth.uid()`, `role()`, `email()` and `jwt()` before the first migration (`scripts/replay-auth-functions.sql`, Decided 47), and `scripts/verify-rls-replay.sh` runs PostgREST as `authenticator` while `scripts/verify-rls.mjs` mints its callers' tokens with `scripts/replay-tokens.mjs` (Decided 13). What is left to do by hand for a function is the session: `supabase_admin`, `load 'safeupdate'`, the canary, `set local role authenticated`.*

### L321 · a break-proof copy of a function needs the real grants

> **A break-proof copy of a function gets the grants the real one has** […]. A function made in `public` gets Supabase's default EXECUTE grants (anon, authenticated, service_role) besides PUBLIC's; on the replay, […] reads `{postgres, authenticated, service_role}` after its revoke and grant. A copy made in `pg_temp` gets PUBLIC's alone, so a missing revoke can't be told from a present one until the copy is given the same grants. A new Supabase branch has no default privileges, so there […] explicit `grant … to authenticated` is what makes the function callable.

### L325 · a "scoped to the caller" test needs a control that can leak

> **A test that a call is "scoped to the caller" needs a control that can leak** […]. RLS (security invoker) and the function's own `user_id = auth.uid()` predicate each keep […] to the caller's rows. A copy without the predicate still found a stranger's row "not found", and so did a security-definer copy with it; only a definer copy without it changed the stranger's row. Without that last copy, a function that dropped one layer passes every scoped-to-the-caller test.

### L341 · driving a real service-worker update

> **A real service-worker update can be driven […]** […]: 127.0.0.1, Chromium with `--no-proxy-server` and `serviceWorkers: 'allow'`, every Supabase request passed through Node's fetch (writes too, body from `postDataBuffer()`)[…].

### L383 · jsdom drops declarations when it serialises

> **jsdom drops some inline declarations when it serialises, so a […] fixture silently loses them** ([…] reproduced on jsdom 29.1.1): `border: 1px solid var(--x)` followed by a side override (`borderBottom: 0`) keeps only the override (with a literal colour it expands); a `padding` shorthand holding `env()` is dropped whole, while `paddingBottom: calc(… env(…))` set after the shorthand is kept; `-webkit-*` properties are dropped. Write borders as longhands (`borderWidth` / `borderStyle` / `borderColor`), set the exotic longhand after its shorthand, and check the fixture carries every declaration.

### L384 · jsdom drops a border-color shorthand holding var()

> **jsdom also drops a `border-color` shorthand holding `var()` when a side colour follows it** […]. `border-color: var(--accent)` then `border-top-color: …` serialises to the top colour alone, so the fixture draws the other three edges in the default colour[…]. With literal colours the shorthand expands, and a `var()` shorthand with no side after it survives. Write all four side colours as longhands[…].

### L555 · jsdom drops flex: 1 1 0

> **jsdom drops `flex: 1 1 0` from the serialised style: write `1 1 0%`** ([…] reproduced in its review on jsdom 29.1.1, where the style attribute reads null and `1 1 0%` and `1 1 0px` are kept). A […] fixture then loses it: a spacer collapsed in the picture. […] writes `el.innerHTML`, so the element's own style, its padding included, is lost: frame the element in a wrapper[…].

### L394 · prove a double-press guard with two presses in one instant

> **A double-press guard is proven with two presses in one instant** ([…] reproduced in its review): sequential `fireEvent`s let React draw in between, so a guard on the mutation's pending flag passes them; `await act(async () => { form.requestSubmit(); form.requestSubmit() })` tells it from an in-flight ref. Wait for the service mock before counting its calls (`mutateAsync` runs the function a few microtasks later).

### L400 · run the app's TypeScript from a Node script

> **A Node script that runs the app's TypeScript loads it through Vite's SSR loader** […]: `createServer({ root, configFile: false, appType: 'custom', server: { middlewareMode: true, hmr: false, watch: null }, logLevel: 'silent' })`, then `ssrLoadModule('/src/…')`; extensionless and `.js` imports resolve, no build.

### L411 · a screen test uses the app's own queryClient

> **A screen test that must see a write's effect through the real hooks gives `QueryClientProvider` the app's own `queryClient` (`src/lib/queryClient`) and clears it in `afterEach`** ([…] reproduced in its review[…]): the app's hooks import that singleton and invalidate it ([…] none calls `useQueryClient`), so a provider with a client of its own never sees the invalidation. A test that asserts only the writes can keep its own client.

*`src/lib/queryClient.ts` exports the singleton the same way.*

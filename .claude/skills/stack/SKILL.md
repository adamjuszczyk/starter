---
name: stack
description: "Use when writing or changing files under `src/` or `supabase/`, and for no other work. The starter's code conventions, each with its source: data only in service and hook files, tokens and the words file, online-only saving, the access list and RLS, migrations and their checks, the PWA settings, TanStack Query and Zustand, Tailwind, Vite and Vercel, and the traps Overload met on this stack."
---

# The stack

The starter's code conventions, for whoever writes or changes a file under `src/` or `supabase/`. Nothing here is new: every rule is lifted and carries its source.

**Sources.** `SPEC Rule 3` and `SPEC item 4` are SPEC.md's. `Decided 7` is TASKS.md's "Decided". `DECISIONS 59` is DECISIONS.md's. `chunk 5` names a build chunk whose rule has no DECISIONS entry: the header comment of the file it built holds it. `B8` is LEARNINGS.md's. **`L210` is line 210 of Overload's RULES.md** (`adamjuszczyk/overload-v2`, commit `8e00877`, read-only at `../overload-v2`): the general code rules of that file, sorted out for the starter (TASKS.md, appendix); the Overload-only ones are dropped and the offline-queue ones are set aside in NEXT.md. A rule marked **→ reference.md** has its longer text there, in Overload's words. If a rule here and a check's own header disagree, the header is what the check does: read it and say so.

## What enforces what

| What | Checked by | Run by |
|---|---|---|
| Colours, text sizes, radii and shadows only from tokens (SPEC Rule 2) | `scripts/check-tokens.test.mjs` (chunk 5) | `npm run check` |
| Every word on screen from the words file (Rule 2) | `scripts/check-wording.test.mjs` (chunk 5) | `npm run check` |
| No database call in a screen file; no `prototype/` import in `src/` (Rule 4) | `scripts/check-screens-no-db.test.mjs` (chunk 5) | `npm run check` |
| Sign-ups off while any table is `signed-in` (Rule 5) | `scripts/check-signups.mjs` | CI, `npm run check` |
| Every table in the access list, every listed table used (Rule 6) | `scripts/verify-rls-list.test.mjs` | `npm run check` |
| Each table does what its kind says, RLS and grants included | `scripts/verify-rls.mjs` on the replay: `bash scripts/verify-rls-replay.sh` | CI |
| Migration numbers | `node scripts/check-migration-order.mjs origin/main` | CI |
| Migrations apply; existing data is safe | `bash scripts/replay-migrations.sh`; `node scripts/check-migration.mjs origin/main` | CI; a flag goes to Adam |
| Embeds resolve through PostgREST | `bash scripts/check-embeds-local.sh` | CI |
| The built app: service worker, fonts, no lazy chunks | `node scripts/check-build.mjs` after `npm run build` | by hand |
| `vercel.json`'s `ignoreCommand` | `scripts/vercel-ignore.test.mjs` | `npm run check` |
| A skill's trigger | `scripts/check-skills.test.mjs` | `npm run check` |
| Saving needs a connection (Rule 3) | no script: this skill, and the Klienci example in `prototype/` shows it (Decided 36) | the reviewer |

`npm run check` is `node --test "scripts/*.test.mjs"`. CI is `.github/workflows/migration-replay.yml`, on every PR into `main`. Shared scripts are not changed during a build; the one allowed change to a check is an entry in the words check's `ALLOWED` list.

## Data in service and hook files

Screens never talk to the database (SPEC Rule 4, Decided 7). Reads and writes live in service and hook files, because the prototype kit swaps exactly those files and the offline add-on would later slot in behind them.

- A database call (`.from(`, `.rpc(`, `supabase.`) is allowed only in `src/**/*Service.ts`, in hooks (`src/**/use*.ts` and `.tsx`) and in `src/lib/supabase.ts`. Every other file under `src/`, tests included, is a screen file. `useAuth.tsx` reads the session with `supabase.auth`, so hooks in `.tsx` count. (Decided 7)
- A hook file is `use` plus a capital or a digit (`useAuth.tsx`, `useTheme.ts`); `user.ts` and `used.ts` are not hooks and may not call the database. (chunk 5)
- The check reads syntax, so a comment or a string that says `supabase.from('x')` is not a call. It would not catch the client under another name (`const db = supabase`, then `db.auth`), the client handed on without a dot, or a table name computed in a variable: avoid all three. (chunk 5)
- A service throws on a resolved `{ error }` as well as on a network failure: supabase-js resolves with `{ error }`, it does not throw, and the screen needs one path to its lines. `src/features/auth/authService.ts` is the model. (Decided 7)
- Sign-in has three outcomes and never shows the server's raw message alone: `wrong`, `offline`, `failed` (with `t.common.reason` and the server's reason after the line). `wrong` needs `AuthApiError.code === 'invalid_credentials'`, which auth-js sets only when the `x-supabase-api-version` header is readable; a 5xx is `failed` with its reason; no answer at all (a failed fetch, or `navigator.onLine === false`) is `offline`. (Decided 24, DECISIONS 65, chunk 4)
- `src/lib/supabase.ts` strips every character outside printable ASCII from the project URL and key: a value pasted into a hosting dashboard with an invisible character gave a 401 for a valid token (L171, → reference.md).
- A test that fetches mocks `src/lib/supabase`; a script that loads the app's client sets its URL and key explicitly, never from the ambient environment. (L454)

### TanStack Query owns server data, Zustand owns UI state

- TanStack Query owns all Supabase data; Zustand owns UI state only (the toast store, the kit's demo store); never mix them. (L210)
- `today` is never computed at module load: hold it in state, refreshed on `visibilitychange` and at midnight. (L214)
- An awaited mutation that must fail fast offline uses `networkMode: 'always'`: TanStack's default `'online'` pauses it and the `await` hangs. Prove it only with `onlineManager.setOnline(false)`; jsdom reads as online. (L219, L597)
- A read TanStack pauses offline is neither loading nor failed: `fetchStatus === 'paused'` gets a state of its own (offline, with a retry), or the spinner never ends. (L566)
- TanStack keeps a query's data when a later read fails: "no answer when the read fails" holds only before the first success. Test a state built on a failed read with a read that fails after one that answered. (L352)
- Removing a read in front of a write can turn a stale-screen error into a silent orphan write: keep, and test, whatever failure the read gave. (L232)
- A field added to an app type for a new column is optional when hand-built literals of that type predate it; absent reads as null, so every reader treats `undefined` as null, and a test pins it. (L249)
- An input whose omission would silently give plausible numbers is required: no default, refused at run time, and the refusal proven under `tsc`. (L390)
- A pure module's input types are `Pick`s of the app's own types, and its tests build the real types, so typecheck proves the caller's data fits without a cast. (L403)
- A change sent as several requests holds its screen state consistent from before the first request until the cache holds the result, or a read between two draws a half-written state. (L281)
- A change of several requests sends first the one the server can refuse, and every destructive one after it, so a refusal destroys nothing; a cut-short change is finished by repeating it. (L282)
- A save of a draft built from an earlier read reads again first and refuses when the source changed, or a stale draft overwrites another device's edits. (L457)
- Change a cached copy only after `await queryClient.cancelQueries(…)`: a read already in flight, cancelled after the change, puts the old copy back when it settles; test with `cancelQueries` held open. (L600)
- A write followed by a navigation returns its invalidations from `onSuccess`, so the mutation stays pending until the lists are read again; `void` on the promise fails the test. (L501)
- A mutation's `isPending` guards a double tap only if its `onSuccess` or `onSettled` returns the invalidation; otherwise a tap between the answer and the refetch works from old rows. (L584)
- A branch that treats a write as already done (a `23505` race) still refreshes what the screen reads, and is tested by what the screen shows after it. (L568)
- A derived read's key sits under the prefix its sibling is already refreshed by (`[KEY, 'statuses', id]`), so every writer that refreshes the list refreshes it; prove it with a real mutation and a break that moves the key out. (L483)
- When `onMutate` writes the merged value that `mutationFn` then reads, a break in `mutationFn` alone is an equivalent mutant: break the pair together. (L446)
- Two mechanisms that guard one state make each other's break an equivalent mutant: keep one, with a test of its own. (L552)
- Two routes that render one page component keep one instance and its state unless their elements' keys differ; the proof removes both keys against a stateful stand-in. (L500)
- A screen's error state is probed with the refusal in place before a full load of that screen, never after another screen has loaded: a cached answer hides the error. (L634)

## Tokens only

`src/styles/tokens.css` is the one place a colour, a text size, a radius or a shadow is written down (SPEC Rule 2). `global.css` switches Tailwind's own colours, sizes and radii off, so the only named classes are the tokens: `bg-surface`, `bg-accent`, `text-ink`, `text-on-accent`, `border-wire`, `text-sm`, `rounded-md`. Layout widths may be typed in.

- The tokens check fails on a typed-in value: a Tailwind arbitrary value for a colour, text size, radius or shadow (`bg-[#f00]`, `text-[13px]`, `rounded-[6px]`, `shadow-[…]`), an inline `style` whose colour, `fontSize`, `borderRadius` or `boxShadow` is a literal, any hex or colour function in a string, and in a `.css` file a declaration of `font-size`, a colour, `border-radius` or a shadow whose value is not a `var(--…)` or a keyword. A custom property is a definition, not a use. (chunk 5; DECISIONS 66 for the CSS declarations)
- It would not catch a value computed at runtime (`style={{ color: v }}`, `size + 'px'`), a style object built elsewhere, a colour name in a class (`bg-[red]`), the shorthands `border`, `outline` and `font` with a named colour, or a hex inside an SVG file. A screen that draws a colour asserts it at its screen. (chunk 5)
- All colours go through CSS custom properties; no hardcoded hex in a component. (L211)
- Text or an icon on the accent is `var(--on-accent)` (`text-on-accent`), never `--base`; a tint made from the accent (`--accent-muted`, a `color-mix`) is not the accent, so its text stays `--accent`. (L212)
- Theme and accent applied before the first render are proven by a first-paint test, the stored choice read before the first draw: `src/App.test.tsx`, "the theme is applied above everything". (L357, chunk 4)
- The theme is per device: one `localStorage` key `theme`, every access in `try`/`catch`, `system` removes `data-theme` so `tokens.css`'s media query decides. (Decided 23)

## The words file

Every word the app shows comes from `src/i18n/pl.ts` by name (`t.settings.title`), never from a string in a screen (SPEC Rule 2).

- The words are one object whose type is `Words` (`typeof pl`): another language is a second file of the same type, so a missing word fails typecheck. A word that depends on a number or a name is a function (`loadFailed(what)`, `buildLine(version, hash, time)`), and a count uses `plural` from `src/lib/format.ts`. The app's own name is not a word: it is in `app.config.ts`. An app's own words go in its own words file; `src/i18n/pl.ts` holds only the starter's (app, nav, signIn, common, settings). (Decided 9, 19)
- Dates, money, numbers and plurals come from `src/lib/format.ts` (`Intl`, locale `pl-PL`): `formatDate`, `formatDateTime`, `formatMoney`, `formatNumber`, `plural`, `formatPhone`. date-fns is not in the starter (Decided 3). (DECISIONS 55: the locale is in two places, `app.config.ts` and `format.ts`)
- The words check reads every JSX text with a letter in it and every string literal or template piece outside `src/i18n/`. A string passes when it is code-like (one token, no whitespace, not starting with a capital), a query argument, an import or module name, a type, the value of a `className`, `id`, `to`, `type`, … or `data-*` attribute, or made only of punctuation, spaces and digits. `{saving ? 'Zapisywanie…' : 'Zapisz'}`, `confirmLabel="Usuń"` and `toast.show('Zapisano')` all fail. Tests and test support are not scanned. (Decided 10, chunk 5)
- **Class strings:** classes go in `className` (a literal, a ternary or a `+`), or one class per string through `cx()`: `cx('flex', 'gap-2')`. `cx('flex gap-2')` is a words hit, because a string with a space in it handed to a function reads as words. (DECISIONS 64, `src/lib/cx.ts`)
- **`ALLOWED`:** a developer-facing string (a thrown `Error`'s message, a `console.*` message) and a capitalised developer token (`'Escape'`, `'Tab'`, `'PLN'`) each get one entry in the check's `ALLOWED` list, with its reason; a stale entry fails the check. That is the one allowed change to a shared check during a build. (Decided 10, DECISIONS 67, 68)
- It would not catch a word joined at runtime (`${n} klientów`), a one-word lowercase label (`'klient'` reads as code), a word placed under a wrong key, or a developer message that later reaches a screen. (chunk 5)
- The wording check runs on the syntax tree's tokens, not lines, and one lowercase token reads as code: a new one-word lowercase label (one CSS draws in capitals, say) is read by hand. (L624)
- A typed number is matched against a pattern before `parseFloat` (`"5o"` reads 5, `"1e3"` reads 1000): digits with at most one `.` or `,`. (L553)
- Weeks are calendar weeks starting on Monday: an app that cuts weeks passes the first day explicitly (date-fns's `weekStartsOn: 1` if it adds the library; `format.ts` has no week function) and never counts weeks as differences of days. A fixture whose answer turns on a week boundary derives its dates from the weekday, prints them, and pins the Sunday/Monday edge. (L216)

## Saving needs a connection

SPEC Rule 3: offline, Save is off and says why (`common.needsConnection`); nothing is queued. A failed save keeps the form open with everything typed and says so. Lifted from Overload's "Deleting needs a connection". No script enforces it (Decided 36); the Klienci form in `prototype/` (`ClientForm.tsx`) is the pattern, and the first app's first write chunk asserts it.

- Save and Delete are disabled when `!online || saving` (`online` from `useOnlineStatus()`); the footer says `t.common.needsConnection` while offline; the Save button reads `t.common.saving` while it works and the fields are disabled. (SPEC Rule 3)
- A failed save keeps the panel open with every value typed and shows the form's own line (the example's `clientForm.saveFailed`, an `InlineError`). Nothing is written to a queue, a draft or storage. (SPEC Rule 3)
- A save that goes through `useMutation` sets `networkMode: 'always'`, so a press after the connection dropped rejects at once instead of pausing and leaving the form on its "saving" word; the proof uses `onlineManager.setOnline(false)`. (L219, L597)
- The footer's button sits outside the form's `<form>`: it calls the same function as `onSubmit`, and its `disabled` follows the mutation's pending flag. A double press is proven with two presses in one instant, and `isPending` guards a double tap only if `onSuccess` returns the invalidation. (L594, L394, L584; L394 → reference.md)
- After a successful save the invalidations are returned from `onSuccess`, so the panel closes on fresh lists; the saved word is `t.common.saved`. (L501)
- The service throws on `{ error }` (see "Data in service and hook files"), so the failure reaches the hook as a rejection. (Decided 7)

## The access list and the access kinds

`supabase/access.json` is one object, table name to kind (SPEC Rule 6, "Objects stored"): `{ "clients": "own" }`, or `{ "clients": { "kind": "own", "ahead": true } }` for a table created before any code reads it (Decided 41). The starter's list is `{}`: no tables.

| Kind | Who sees what | The policy shape | The grants |
|---|---|---|---|
| `own` | only the user who wrote a row | `for all using (user_id = auth.uid()) with check (user_id = auth.uid())` | `authenticated` only |
| `signed-in` | every signed-in user sees every row; writes only their own | `for select to authenticated using (true)`, and insert, update, delete `to authenticated` with `user_id = auth.uid()` | `authenticated` only |
| `public` | anyone, signed out included | `for select using (true)` | `select` to `anon` and `authenticated` |

Chunk 3's fixture (`scripts/verify-rls-fixture/migrations/001_fixture.sql`) is the model of all three:

```sql
alter table public.t enable row level security;
-- own
create policy "Users access own rows" on public.t
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- signed-in
create policy "Signed-in users read every row" on public.t for select to authenticated using (true);
create policy "Users insert own rows" on public.t for insert to authenticated with check (user_id = auth.uid());
create policy "Users update own rows" on public.t for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users delete own rows" on public.t for delete to authenticated using (user_id = auth.uid());
-- public
create policy "Anyone reads every row" on public.t for select using (true);
-- every kind: nothing by default, then exactly what the table needs
revoke all on table public.t from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.t to authenticated;  -- own, signed-in (the fixture grants select alone: verify-rls only reads)
grant select on table public.t to anon, authenticated;                    -- public
```

**A new table, in one change** (SPEC Rule 6; Decided 39, 41, 49; DECISIONS 61, 63):

1. A migration `supabase/migrations/NNN_name.sql` numbered after the highest on `main`, creating the table. An `own` or a `signed-in` table has a `user_id uuid not null references auth.users (id)` column: verify-rls counts by it (the owner's probe on `own`, the peer's on `signed-in`), and without it the probe answers 42703, a FAIL, never a pass. (Decided 49, which names `own` only; `signed-in` too, chunk 3)
2. In the same file: `enable row level security`, the policies of its kind, then `revoke all … from public, anon, authenticated, service_role` and every grant the table needs, written out. Supabase's default privileges give `anon`, `authenticated` and `service_role` everything on a new table, and they are a project setting (`auto_expose_new_tables`): a migration that leans on them passes the replay and answers 42501 on a project where they are off, and one wrong policy on a table `anon` can read leaks to the public. After the revoke a signed-out request is refused whatever the policies say. Public tables do the same: `revoke all`, then `grant select` to `anon` and `authenticated`. (Decided 39, DECISIONS 63)
3. The key in `supabase/access.json` in the same change, with `"ahead": true` while no `.from()` or embed reads the table; the list test fails once code reads it, until the marker goes. (Decided 41; L244, L245)
4. Rows for the probes: `supabase/verify-rls-seed.sql`, applied after the migrations as `postgres`, holding users A and B (the ids of `scripts/replay-tokens.mjs`) in `auth.users` and at least one row of each in every listed table. Without it a non-empty list fails loudly on "0 own rows". (DECISIONS 61)
5. Run the order check, `bash scripts/replay-migrations.sh`, `bash scripts/check-embeds-local.sh`, `bash scripts/verify-rls-replay.sh` and `npm run check`.

- Every table the app reads or writes is in the list with its kind in the same change; the list test fails until it is, and fails on a listed table nothing uses (unless `ahead`). A `public` table cites the migration that makes it so. (L244)
- A table created before any code uses it is still listed and probed: `ahead` keeps the key alive; the first `.from()` or embed that names it makes the test fail until the marker goes. (L245, Decided 41)
- The list test reads every file under `src/` for a `.from(` with a computed table, tests and comments included: write a mock's `from` with spread arguments, and do not quote the pattern in a comment. A test stand-in that calls `from(variable)` fails it too: call it as a value, `(fake.client.from as (t: string) => …)(table)`. (L458, L562)
- A table used only by an embed or an RPC op counts as used (read from the syntax tree, never a comment or a test); RLS applies to an embed as the caller; the other direction, a table used only that way and missing from the list, is not caught. (L545)
- Sign-ups are off in every app built from the starter (SPEC Rule 5): the owner adds accounts. An app that needs open sign-up turns it on and may then have no `signed-in` tables. `check-signups.mjs` fails when a table is `signed-in` and `[auth] enable_signup` in `supabase/config.toml` is not `false` (a missing key means ON), and when `[auth.email] enable_signup` is `false` whatever the tables. (L374)

## RLS and grants: what verify-rls does

`scripts/verify-rls.mjs` runs on the replay, not on a hosted project (SPEC item 4): PostgREST on the replayed database, connected as `authenticator` as on a hosted project (so pg-safeupdate loads), and three callers whose tokens `scripts/replay-tokens.mjs` mints with PostgREST's own secret: user A, user B and a signed-out visitor (Decided 13). It never writes. Each kind is asked its own questions: `own`, A reads A's rows (1 or more; 0 is a FAIL, because an owner who sees nothing proves nothing), B counts rows that are not B's (0, else a LEAK), a visitor reads 0 rows or is refused; `signed-in`, B counts A's rows (1 or more) and a visitor reads nothing; `public`, a visitor and A both read 1 or more rows. For every kind RLS is on (a view has none, so it needs `security_invoker`), and an `own` or `signed-in` table is held by `anon` for nothing, directly, through PUBLIC or through default privileges (DECISIONS 63).

- **Permission denied on the owner is a FAIL.** A refusal (`42501`) means different things to different probes. Where the caller is expected to read rows (the owner, B on a shared table, anyone on a public one) it is a missing grant, not RLS: "a missing grant can look like a passing RLS check" (SPEC item 4, Decided 14). Where the caller must not read the rows (B on A's, a signed-out visitor) it is a PASS, RLS or a grant doing its job. Any other error is a FAIL: "could not ask" is not "was refused". (Decided 14)
- It reads PostgREST's error code, never the HTTP status: the same refusal is 401 for `anon` and 403 for `authenticated`; a function's custom SQLSTATE comes as 400 and `P0002` as 500. The app reads `error.code` too. (Decided 40, L332)
- The counts are exact counts taken by the server with zero rows fetched, a GET with `limit(0)`, never HEAD (a refused HEAD arrives without its code, so a refusal could not be told from "could not ask"). Counting server-side means no row content reaches the script and PostgREST's `max_rows` cannot hide a leak. (L193, DECISIONS 59)
- A `public` table is also read by a signed-in user, because a signed-in user is not `anon`: the table needs its grant for `authenticated` too. (DECISIONS 60)
- verify-rls reads a revoked anon select (`42501`) as a pass, so a `public` table needs a signed-out read that expects rows, and grants are checked beside RLS. The starter's `public` kind does both. (L334)
- An RLS-blocked `UPDATE` or `DELETE` returns zero rows and no error: that silence is the proof of RLS, not a failure. An anon-key read of RLS-hidden rows answers `[]` whether they exist or not; if unreachable and empty look the same, the read proves nothing, and only a signed-in read can. (L174, L197)
- A new table's RLS matches its access kind; a deviation (select and insert only, a read-only library) is deliberate and documented in the migration. (L228)
- A function is proven as the signed-in role in a session that has pg-safeupdate loaded: connect as `supabase_admin`, `load 'safeupdate'`, canary a bare UPDATE, then `set local role authenticated`. The starter's replay already applies the hosted `auth.uid()`. (L316, → reference.md)
- The replay image's `auth.uid()` reads only `request.jwt.claim.sub`; PostgREST 12 sets `request.jwt.claims`, so a local PostgREST reads every call as signed out until `auth.uid()` is the hosted definition. `scripts/replay-auth-functions.sql` applies it before the first migration. (L318, → reference.md)
- `SET ROLE` does not apply the role's own settings (`authenticated`'s `statement_timeout = 8s`): set them per transaction. (L319, → reference.md)
- Without GoTrue: the hosted `auth.uid()`, a row in `auth.users (id)`, a password for `authenticator`, an HS256 JWT signed with the PostgREST secret (role `authenticated`, `sub`), a `/rest/v1` gateway; the app's TypeScript can run against it through Vite's SSR loader. The starter does the same with minted tokens and a fetch that drops the `/rest/v1` prefix instead of a gateway (`replay-tokens.mjs`, `verify-rls.mjs`, `verify-rls-replay.sh`). (L320, → reference.md)
- A function in `public` gets default EXECUTE grants (anon, authenticated, service_role); a copy made in `pg_temp` gets PUBLIC's only, so a break-proof copy needs the real grants; a new Supabase branch has no default privileges, so explicit grants decide. (L321, → reference.md)
- A "scoped to the caller" test needs a control that can leak: only a security-definer copy without the `user_id = auth.uid()` predicate reaches a stranger's row. (L325, → reference.md)
- The image's `auth.users` is minimal until GoTrue has run once; a seed inserts only the columns it has (`id`, `aud`, `role`, `email`), as the fixture's does. A seed that needs real Auth needs GoTrue started once, ready when its log says "GoTrue migrations applied successfully", and Overload's local-stack recipe (GoTrue `supabase/gotrue:v2.180.0`, PostgREST, a small Node gateway). The starter's replay needs none of it (Decided 13). (L305, L306, L307, → reference.md)
- A green run says nothing about the role PostgREST logged in as: the probes cannot see it, and PostgREST connected as `postgres` would pass every probe. The wrapper's own `pg_stat_activity` check is what catches it. (chunk 3)

## Migrations

Forward-only: an applied migration is never edited. Destructive ones come to Adam, no exception. With no staging, any migration `check-migration` flags comes to Adam too (RULES.md, Escalation).

- **Numbering**: `NNN_name.sql`, three digits, an underscore, a name. Supabase identifies a migration by the digits before the first `_`, compared as text: a reused number is treated as already applied and never runs, and a number at or below the last applied one stops the deploy. Each new file's number is above the highest on `origin/main`; the check prints the next free one. (`check-migration-order.mjs`, chunk 2)
- **`check-migration.mjs`** passes only what cannot alter or remove existing data, by a short list: `create table`, `create type … as enum`, `alter type … add value`, `comment on`, `add column` without a constraint (and without `not null` unless it has a default), a non-unique index, and, on a table the same batch creates, `alter table`, policies, grants, revokes, indexes and inserts. Anything else, anything it does not recognise, and any change to an existing migration is FLAGGED with its reason, and the merge is Adam's. It checks data safety only, not whether a policy is right. A flagged `do` block is named by its first words, not its statements: read it whole. (`migration-rules.mjs`, chunk 2; L538)
- **A `revoke` is safe only on a table the same batch creates**, as a `grant` is: nobody has rights on a new table yet, so nothing is taken away. Decided 39's `revoke all … from public, anon, …` after the `create table` passes (`migration-rules.test.mjs` classifies chunk 3's fixture migration SAFE). The same revoke on a table that already exists is FLAGGED ("revoke on an existing table"), because it can cut off access the app relies on; a revoke naming several tables passes only when every one is created earlier in the batch, and one on a schema, a function or default privileges is flagged as before. (DECISIONS 69, `migration-rules.mjs`)
- **The replay** (`bash scripts/replay-migrations.sh`): an empty `supabase/postgres` at the app's production version (the first line of `supabase/postgres-image`; `SUPABASE_PG_IMAGE` overrides it; a new app sets the file from its project, and updates it when Supabase upgrades the project), the Auth service's functions applied first, then every file in order as `postgres`, each in one transaction, stopping at the first error. `--keep` leaves the container, `--fixture` adds verify-rls's fixture. No migration files is a clean replay only while the access list is empty. It does not load pg-safeupdate (L196).
- **Docker in a session:** how to start `dockerd`, pull through `mirror.gcr.io` and keep it running is in RULES.md "The build loop" ("Environment"). The starter's own facts: the replay image's tag is the first line of `supabase/postgres-image`, and embeds and verify-rls also need `postgrest/postgrest:v12.2.3` pulled and tagged the same way. (CONTEXT.md "Repo facts", Decided 27)
- **Embeds:** a second foreign key between two tables makes an un-hinted embed ambiguous (`PGRST201`); SQL checks cannot see it, `check-embeds-local.sh` can. It runs PostgREST as `postgres`, not `anon`, because own and signed-in tables revoke `anon` and an `anon` probe would fail every valid embed on them (DECISIONS 54). Zero embeds is a pass once the scan has read a file under `src/`. (L187)
- Migrations deploy through the Supabase GitHub link from the default branch; nothing is applied, transported or pasted by hand. (L294)
- A migration that drops a column ships after the code that stops using it: code first, every device updated, then the drop; check every bundle still in use for writes to the column, not only the one the plan names. (L237)
- Apply an additive migration before deploying the code that writes the new columns. (L300)
- Anything that makes a record the only active one (or ends the active one) runs in one transaction, an RPC, under a per-user advisory lock; two client requests can leave two. (L243)
- Prove constraints by violating them (`23514`, `23503`, `23505`, zero rows written); prove `on delete set null` or cascade by really deleting a throwaway parent; prove read-only RLS through the anon-key client. (L295)
- A CHECK passes when its expression is NULL, so a break that drops an `is null or` is an equivalent mutant; a nullable column's constraint proof inserts an explicit NULL. (L296)
- A CHECK can be proven live without writing a row: Postgres tests a table's checks in name order, after RLS's WITH CHECK and before foreign keys, so break it beside an older check whose name sorts after it. (L297)
- A `NOT VALID` constraint applies to new rows only, so it cannot inject a failure on existing ones; confirm the injected error's text appears before reading "nothing persisted" as proof. (L184)
- Postgres `jsonb` does not keep key order: compare with recursively sorted keys. (L164)
- Sibling data-modifying CTEs see one snapshot (an `UPDATE` beside the insert matches zero rows and reports success): write SQL fixtures as sequential statements, a `DO` block with local variables. (L174, L298)
- Production runs pg-safeupdate: a `DELETE` or `UPDATE` without `WHERE` fails through the API and inside functions; use `where true`. It also refuses a bare one inside a migration's `do` block and in a seed, and the plain replay cannot see it: prove a data migration and a seed in a `supabase_admin` session with `load 'safeupdate'` and its canary. (L287, L537)
- An insert through `jsonb_populate_record` gets NULL, not the column's default, for every column its row leaves out: name every NOT NULL column. (L303)
- `ON CONFLICT` on a partial unique index's columns without its predicate is `42P10`; an upsert with no `onConflict` lands on the primary key. (L310)
- `now()` is constant inside one transaction: prove the idempotence of a `now()` mark across committed transactions. (L329)
- A guard trigger is statement-level: a BEFORE ROW trigger whose function returns NULL silently drops every write. (L330)
- When dropping two things, the drop that unlinks runs after the drop that finds by link. (L346)
- `String.replace` reads `$$` in a replacement string as a pattern: SQL built by replacement passes a function (`() => text`), or a function body's `$$` is eaten. (L539)

## PostgREST

- PostgREST's row cap (`max_rows` 1000, `supabase/config.toml`) silently truncates an unbounded read: every list read pages (ordered, `.range()` until a short page) or is bounded. (L193)
- A named column list fails the whole read (`400`, `42703`) when a column is missing, where `select('*')` returns less: leave unread columns out, add a new column only once its migration is live where the code runs, and probe the list with a made-up-column control. (L248, → reference.md)
- PostgREST's upsert writes only the columns the payload names: a column a full-row upsert must leave alone is left out of the payload and of its row type. (L252, → reference.md)
- Naming an excluded column fails typecheck (TS2353) but a spread, `...(cond ? { col } : {})`, passes it: only payload tests catch that, and the proof is a value stored behind the client's back. (L253, → reference.md)
- A one-column change is sent as `update({ col }).eq('id', id)`, never a whole-row upsert, which re-creates a row another device deleted and overwrites its edits. (L256)
- A live schema probe that reads nothing: `GET /rest/v1/<table>?select=<cols>&limit=0` answers `200 []` when every column exists and `400` / `42703` when one does not; add a made-up-column control every time. The starter revokes `anon` on own and signed-in tables, so probe as a role that may read them, as `check-embeds-local.sh` does (DECISIONS 54). (L301)
- A new RPC's name and parameter are provable live: the right shape answers the function's own refusal, a made-up parameter `PGRST202`. (L351)
- PostgREST 12 answers a function's `P0002` with HTTP 500 and a custom SQLSTATE with 400: the app reads `error.code`, never the status. (L332)
- A fake server must refuse in the real shape: under RLS a foreign-key violation reads `Key is not present in table "x".` with no key, so match the constraint's name in `message`, and read the shape once on a real server. (L202, → reference.md)

## PWA: vite-plugin-pwa's settings and why

`vite.config.ts` and `src/features/pwa/` carry their reasons in comments; these are the ones to keep.

- `registerType: 'autoUpdate'` with `injectRegister: false` and, set explicitly, `workbox.skipWaiting: true` and `clientsClaim: true`. vite-plugin-pwa sets those two from `autoUpdate` only when `injectRegister` is `'auto'` or unset; with `false` workbox's own default (false for both) ships a worker that sits in "waiting" while a tab is open, and a new version would be used only once every tab had closed. (chunk 1, `vite.config.ts`)
- Registration is explicit, once, in `App()` through `useServiceWorker` (`virtual:pwa-register/react`, imported only by `pwaRegister.ts`: the virtual module exists in the plugin pipeline, not in Vitest, so tests mock `./pwaRegister`). (chunk 1)
- **`onNeedReload` records and never reloads.** With no handler, vite-plugin-pwa 1.3.0's client reloads the page the moment a new worker activates (`if (onNeedReload) onNeedReload(); else window.location.reload()`), which could interrupt a person mid-edit. The new version is used the next time the app opens; `serviceWorkerRecord()` is kept for an app that adds an update screen. `useServiceWorker.test.tsx` is the standing proof. (Decided 16)
- **No lazy chunks.** The one dynamic import is workbox-window, loaded at start, so an old page that is still open never fetches a chunk the new precache dropped. Do not add `React.lazy` or a route-level `import()`: `check-build.mjs` fails on a dynamic chunk, and an app that needs lazy chunks decides that on purpose and changes the check with it. (Decided 16)
- `globPatterns` names `woff2`, so the bundled fonts are in the precache and the app opens offline with them. (Decided 4)
- `registration.update()` only re-fetches `/sw.js` and compares bytes; it never touches data, so the hourly check and the one on `visibilitychange` do not conflict with `refetchOnWindowFocus: false`. (chunk 1)
- **`node scripts/check-build.mjs` after `npm run build`** asserts on `dist/`: `sw.js` calls `self.skipWaiting()` as an unconditional statement and has no `SKIP_WAITING` listener (B8: the first version was a grep and passed with `skipWaiting` off, because workbox's message listener holds the text), `clientsClaim` runs, every emitted woff2 is in the precache (at least one per family, latin-ext among them), no `fonts.googleapis.com`, and no dynamic chunk but workbox-window. (Decided 16, B8)
- A tab on a stale service worker reproduces old bugs: after a deploy update the registration and reload before testing. (L168)
- A real service-worker update can be driven in Playwright: `127.0.0.1`, Chromium with `--no-proxy-server` and `serviceWorkers: 'allow'`, every Supabase request passed through Node's fetch. (L341, → reference.md)

## Tailwind

`global.css` imports `tailwindcss` with `source("..")`, so Tailwind scans `src/` only: the automatic scan from the repo root also read `prototype/` and the docs, and doubled the CSS (chunk 1). Inside `src/` it builds a rule for every utility-shaped word in every file git does not ignore: tests, fixtures, comments, test titles.

- A bare utility word in a scanned file adds a rule to the production stylesheet. After your last edit, build and compare the stylesheet with the base's, rule by rule and not by file name. (L378)
- A fixture id shaped like a utility (`ps-1`, `pe-2`) builds a rule: give fixture ids a shape no utility has, and never quote such an id in a scanned file. (L378)
- A fixture id that names a grid line (`row-3`) is a utility too. (L379)
- A CSS property name in a committed fixture's inline style makes Tailwind build a utility (`text-wrap`): compare the stylesheet's rules, not only its name. (L355)
- A scanned file that quotes a theme variable by its full name puts it in the built stylesheet (`@theme inline`): build such a name from parts, and compare the stylesheet character by character. (L424)
- A test title or any string counts for Tailwind as much as a comment: a plain English word that is a utility built a rule; reword it and compare stylesheets byte for byte. (L481)

## Vite, Vercel and Recharts

- **`vercel.json`'s `ignoreCommand`** exits 0 (skip the build) when nothing but `*.md`, `prototype/*`, `docs/*` and `.claude/*` changed between the last deployed commit (`VERCEL_GIT_PREVIOUS_SHA`) and `HEAD`; it builds when that variable is unset or the commit is not reachable. It once compared only `HEAD^` with `HEAD`, so a docs-only last commit skipped a push that also held code. `scripts/vercel-ignore.test.mjs` runs the real command in throwaway repos, the only thing that proves it. (Decided 22)
- A push is not a deploy: confirm one with `vercel ls` (a real build, not a 2 s "Canceled" row), `vercel inspect` (Ready, production) and a grep of the deployed bundle for new strings and for the absence of old ones. (L170, → reference.md)
- Vite and Vitest tolerate extensionless relative imports and Vercel's Node ESM does not (`ERR_MODULE_NOT_FOUND`), which matters the day an app adds `api/`; only a real deploy and call finds it. Plain `vite` dev does not serve `api/**`: exercise endpoints on a deployed build or by invoking the handler. (L171, L363)
- A local `dist` hash differs from the deployed one because Vercel inlines its own `VITE_*` values: a mismatch is not a stale deploy. (L180)
- The entry JS differs between any two builds (`__BUILD_TIME__`, `__BUILD_HASH__`): to prove a change ships nothing, compare the stylesheet and vendor chunks byte for byte, the entry only after normalising those two values, and grep the deployed bundle for markers. (L385)
- Editing source during a live browser test triggers a Vite full reload that wipes page state and looks like an app bug. (L182)
- A Node script that runs the app's TypeScript loads it through Vite's SSR loader (`createServer({ middlewareMode: true, hmr: false })`, `ssrLoadModule`): extensionless imports resolve, no build. (L400, → reference.md)
- An esbuild bundle is no import graph (its resolver matches file names without regard to case): walk Vite's Rollup build instead, `write: false`, non-relative imports external, `getModuleInfo(id).importedIds`. (L484)
- **Recharts is not in the starter.** An app that needs charts adds `recharts` to `dependencies` and one line to `manualChunks` in `vite.config.ts`, beside `vendor-react`, `vendor-query` and `vendor-supabase`: `'vendor-charts': ['recharts']`, as Overload's file has it, so the largest dependency is a chunk of its own that changes rarely. A chart's colours are tokens like every other colour: `var(--accent)`, not a hex. (TASKS.md "The stack"; SPEC Rule 2; Overload's `vite.config.ts`)

## Shared components (Panel, ConfirmDialog, forms)

Panel is Overload's `BottomSheet` (Decided 6), and the rules below name Overload's components and props. `src/components/` (chunk 6) is the authority: where a rule names a prop, a role or a marker the component does not have, the component wins and the line is fixed.

Panel, ConfirmDialog and Toast draw through one overlay module (`src/components/overlay.ts`) into the frame's overlay root (`useOverlayRoot()`: the element `WidthRoot` gives `transform: translateZ(0)`), not into `document.body`, so they stay inside the prototype kit's phone frame, and outside a frame they draw nothing. Each carries `data-overlay` (`panel`, `dialog`, `toast`). The one drawn last owns Escape and the Tab ring and takes focus; a toast is passive (no focus, no key, no touch). Panel is `role="dialog"` and ConfirmDialog is `role="alertdialog"`: the component, not Overload, is the authority. The Toast is mounted once, by `AppRoutes`; anything shows a message through `useToastStore`. (chunk 6, DECISIONS 70, chunk 8)

- Something inside a sheet that handles Escape itself calls `preventDefault()` on it, or the sheet (the top one) closes too. (L392)
- A sheet whose list changes length with a filter is `height="tall"` with the filter row in `toolbar`: the content region is the one scroller, so what must stay in view goes in `toolbar` or `footer`. (L393)
- A sheet that awaits a write and then calls back checks it is still mounted, with a ref set true on every effect run: StrictMode reruns effects after cleanup. (L395)
- A footer button sits outside the sheet's `<form>`: it calls the same function as `onSubmit`, and its `disabled` follows the mutation's pending flag. (L594)
- A typed box keeps its half-written text apart from the draft, and every consumer reads the draft with that text settled; none relies on a blur coming first (Safari gives a tapped button no focus). Test a number typed out of bounds, a switch away and back, and what the footer returns. (L427)
- `ConfirmDialog` had no `role="dialog"` in Overload, so a dialog check could not find it; a dialog or banner that prints a name the person typed wraps it (`overflow-wrap: anywhere`) and is checked in Chromium with an 80-letter name. (L502)
- `ConfirmDialog` wraps its title but not its body: a caller that prints a typed name in the body wraps it in a span of its own. (L592)
- A new variant of a shared component leaves the old variant's serialised markup byte for byte as it was; re-captured fixtures are diffed with ids normalised before any is committed. (L580)

## Testing and fixtures

- Run the full `npm run typecheck`, every tsconfig project (app and node), never one project alone: a type-only import can pull browser globals into another project. (L338)
- `tsconfig.app.json` includes the tests and its `lib` is ES2020: an ES2022 API (`Array.prototype.at`) passes Vitest on Node 22 and fails typecheck (TS2550). Run typecheck after writing tests. (L404, chunk 4)
- A type-level test (`@ts-expect-error`) fails only under `npm run typecheck`, never in Vitest: break-prove type rules under `tsc`. (L389)
- `vitest.setup.ts` gives every test file the build's four defines (`__APP_VERSION__`, `__BUILD_HASH__`, `__BUILD_TIME__`, `__APP_CONFIG__`); a file's own `vi.stubGlobal` replaces them, and `version.test.ts` proves the app module itself has no default. (L343, Decided 33)
- jsdom has no `ResizeObserver`: stub it wherever `WidthRoot` mounts. `vi.resetModules()` loads React twice: reset through an export instead. (chunk 4)
- A screen test that must see a write's effect through the real hooks gives `QueryClientProvider` the app's own `queryClient` singleton and clears it in `afterEach`; a test that draws a second world after `cleanup()` clears it too. (L411, L567, → reference.md)
- A test that fetches mocks `src/lib/supabase`. (L454)
- A data hook a page starts to call is mocked in every test file of that page (page tests mock each hook and mount no provider), with a real answer: `[]` is no rows and `undefined` is not read yet. A hook a page starts to call either lives in a component that renders only while its sheet is open, or is mocked in every page test. (L455, L556)
- A mock that returns fixed data whatever it is asked hides which argument the page passed: record the argument and assert it. A stand-in for a sheet or child component calls each function prop with every argument the real caller passes. (L560, L578)
- A screen test that drives several writes has the writer's stand-in append the record and re-renders by hand, or the next row never becomes current. (L582)
- A fake store returns copies of what it holds (`structuredClone`), as the real store does, or an in-memory change reads back as a stored write; a test that seeds a fake async store lets the previous test's pending writes land first (`afterEach` waits a few ticks). (L421, L622)
- A hook test that refetches settles a few ticks before it reads `result.current`: TanStack notifies observers on a later tick. `await queryClient.invalidateQueries()` inside `act` resolves when the cache holds the new data, not when the screen redrew: assert with `findBy…` or `waitFor`. (L627, L585)
- A hook's optimistic patch and its rollback are part of the writer: assert the cache's columns while the write is held and after a refusal, not only the screen after a refetch. (L550)
- An effect that writes is proven line by line: its guard, its key, its clamp and its dependency list are each behaviour, each with a test that fails without it. An effect keyed on a flag that turns on after the first render is proven by rendering without the flag and then with it. (L495, L598)
- A test that moves a page across midnight fakes `Date` alone (`vi.useFakeTimers({ toFake: ['Date'] })`) and dispatches `visibilitychange` with `document.visibilityState` set as an own property. (L496)
- A write an effect starts lands a tick after the `act` that caused it: a reload test settles before it unmounts, or the late write fills the next mount's world. A restored in-memory value is proven through a remount. A `useState` initial value that a late-arrival effect also fills is an equivalent mutant at the screen: pin the effect's path with a value that arrives after the first draw. (L615, L614, L616)
- When a screen module is replaced, every `vi.mock('./OldName')` is renamed: a mock of a path that no longer exists passes silently while the new module loads unmocked. (L621)
- A double-press guard is proven with two presses in one instant, `form.requestSubmit()` twice in one `act`. (L394, → reference.md)
- Vitest 4's JSON reporter gives a timed-out test `Error: STACK_TRACE_ERROR`; a test awaiting a call that waits on a fake-timer cap hangs instead of failing: assert the effect without awaiting it. Vitest's timeout cannot stop a synchronous infinite loop: a break that removes a loop guard must fail an earlier assertion, so test the guard with its dangerous value last. (L340, L405)
- An accessible name built from inline spans has no space between them (`<span>Save</span><span>draft</span>` is named "Savedraft"): match such a control through a helper that reads its text parts. A state word the page draws in two places is queried through a `data-*` attribute of its own, not by text. (L558, L559)
- jsdom drops some inline declarations when it serialises (a `border` shorthand with `var()` plus a side override, a `padding` shorthand holding `env()`, `-webkit-*`), a `border-color` shorthand holding `var()` when a side colour follows it, and `flex: 1 1 0` (write `1 1 0%`): write longhands, put an exotic longhand after its shorthand, frame a captured element in a wrapper, and check the fixture carries every declaration. (L383, L384, L555, → reference.md)
- jsdom lays nothing out: a maximum height, what scrolls and scroll chaining are proven in real Chromium in the app's layout; a real phone stays Adam's. (L386)
- A test that writes a capture fixture captures before it asserts, so a broken rule still writes the fixture the Chromium break measures. (L426)
- psql notices go to stderr: a break runner reads stdout and stderr apart, or a line diff shows changes on a comment-only control. Every Node process in this environment prints `[UNDICI-EHPA] Warning` on stderr (`NODE_USE_ENV_PROXY`): a test asserting a child's stderr filters it or drops the variable. (L358, L380)

## Screenshots, clipping and Playwright

- `document.scrollWidth` passes while an `overflow: hidden` card clips a row: check every element against its nearest clipping ancestor (the kit's `check/clipping.mjs`, chunk 8). (L198)
- `document.scrollWidth` is blind inside a `position: fixed` layer: measure inside every dialog in Chromium, with a wide control that must fail; a long-text probe needs a word with no break opportunity (80 of one letter overflows where a hyphenated 80-character name wraps and passes). (L387)
- A row that scrolls sideways by design asks for it (`overflow-x: auto`, no vertical scrolling), and the clipping check lists it instead of failing it; its own box and its children's text are still measured. (L388)
- On a real screen equal `fr` columns are compared with a tolerance: Chromium lays out in 1/64 px. (L349)
- A Playwright route that intercepts a table waits until no read of it is in flight: a foreground event joins an in-flight read and gets the real row. (L353)
- A full-page capture draws a `position: fixed` bar at the bottom of the first viewport, not at the end of the picture: compare its presence and order, not its height. (L381)
- A screenshot tool's `innerText` dump holds no input's value: a board with typed boxes is held against its picture for the numbers. A downscaled screenshot hides a change like near-white to near-black: read the pixels. (L425, L443)
- A tap that moves no focus is proven in real Chromium by calling the element's own `click()` from script: a real click blurs the focused box first and hides a missing clear. (L431)
- A control whose tap target reaches into a neighbour is hit-tested in real Chromium over every control of every fixture (three points per box, scrolled into view; a control behind a modal layer is exempt); the fix is `z-index` on the overlapping container. (L591)
- Build the branch as production builds it into a folder outside the worktree and serve it through Playwright's `route.fulfill` on a made-up https origin. Chromium launched under the agent proxy sends `127.0.0.1` through it despite a bypass list, and the relay answers 405 to plain HTTP. (L440, L441)

## Checks that passed while wrong

The starter's own, so far (RULES.md's "Checks that lied" points here); Overload's general ones are in the sections above, each with its line.

- A grep for `skipWaiting` in `sw.js` passed with it off: workbox's `SKIP_WAITING` listener holds the text. `check-build.mjs` now needs the unconditional call and no listener. (B8)
- verify-rls's probes cannot see which role PostgREST connected as: only the wrapper's `pg_stat_activity` check catches PostgREST running as `postgres`, which would pass every probe. (chunk 3)
- The embeds probe run as `anon` would have failed every valid embed once Decided 39 revoked `anon`, and only a real run showed it. A decision that changes grants or roles needs every script that runs as that role looked at. (DECISIONS 54, B5)
- A HEAD count cannot read a refusal: verify-rls counts with a GET and `limit(0)`. (DECISIONS 59)

## The environment

- `npm ci` before typecheck, test or build, and the lockfile rule: RULES.md "The build loop" ("Environment"). The starter's own fact: npm 10.9.9 crashes on a fresh resolve (vitest's optional peers), so the lockfile was seeded from Overload's and a dependency is added by hand-splicing its entries. (chunk 1)

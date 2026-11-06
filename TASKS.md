# Starter 0.1 — TASKS

Planned 2026-11-06 in one cloud session (Fable 5.1, max), from `SPEC.md` (specced 2026-11-04/06, verdicts confirmed by
Adam 2026-11-06; two amendments from the spec chat the same day, applied here: the sign-in's three outcomes and the
per-app public-or-private repo), the prototype in `prototype/` (the zip `starter-prototype-src.zip`, unpacked as is,
plus the amendment's two words and Offline sign-in state; its 20 DEMO states
were built and checked in this session at 390 and 1280 px in both themes: no page errors, no clipping; the zip's check
screenshots every state in light and five in dark) and
Overload (`adamjuszczyk/overload-v2`, branch `staging`, commit `8e00877`, 2026-11-02; cloned read-only beside this repo
at `../overload-v2` during planning, and that is where builders clone it too). SPEC decides behaviour; the prototype
decides layout, order and wording; SPEC wins a disagreement. The independent pre-read (a fresh agent on Overload's
`reviewer-data` definition, Opus max, read-only, 2026-11-06 14:16–14:40) returned 28 findings; every one is applied
below or answered in "Decided", and chunk 0 exists because of it.

The build's standing rules (BUILD.md is not in this repo; agents never read it): lift, don't rebuild; technical
decisions are made, written down with one line of reason; chunk types DATA (own fresh reviewer, Opus max) and LIGHT
(two or three built at a time, one batch reviewer, Sonnet high); builders Sonnet at max coding effort; coordinator Opus
medium; the next chunk's builder starts beside a running review when they share no files; no staging: chunks merge to
`main` through squash-merged PRs; the release is the tag `v0.1.0`; Adam's vibe check moves to the first app built from
the starter. Until chunk 9 makes the starter's own, Overload's `.claude/agents/` definitions are the ones to use, with
the brief naming `main` as the base branch and no staging (see "Process notes" at the end).

---

## Estimate

From `scripts/cost-table.md` (Overload, second calibration, 1.2.1): DATA ≈ 1.4 h, ≈ $38, ≈ 3% of the week; LIGHT ≈ 40
min, ≈ $12, ≈ 1%, plus ≈ 40 min of wall time per batch review (its dollars are inside the LIGHT figure); 1% of the week
≈ $11.6 on the meter. Sizes (S/M/L) were not measured apart in 1.2.1, so every chunk carries its type's figure and the
size risk is stated separately. Never a pace from an earlier build.

| # | Chunk | Type · size | Hours | Dollars | Week |
|---|---|---|---|---|---|
| 0 | Repo files: RULES.md's general sections, the record files' headers, check-context-size | LIGHT · S | 0.67 | $12 | 1% |
| 1 | Scaffold: the stack, tokens, fonts, words file, PWA | LIGHT · L | 0.67 | $12 | 1% |
| 2 | Migrations and the replay: supabase/, access list, migration checks, sign-ups check, the CI workflow | LIGHT · M | 0.67 | $12 | 1% |
| 3 | verify-rls on the replay: two users and a visitor, access kinds, grants, the self-test fixture | DATA · L | 1.4 | $38 | 3% |
| 4 | Sign-in, the app frame and Settings | LIGHT · L | 0.67 | $12 | 1% |
| 5 | The code checks: tokens, words, no database in screens, no prototype imports | LIGHT · M | 0.67 | $12 | 1% |
| 6 | Panel, ConfirmDialog, Table, Toast and the list patterns | LIGHT · L | 0.67 | $12 | 1% |
| 7 | Skills: `stack` and `estimate`, with the cost table | LIGHT · M | 0.67 | $12 | 1% |
| 8 | The prototype kit (runs the real screens; Klienci as the worked example) and the `prototype` skill | LIGHT · L | 0.67 | $12 | 1% |
| 9 | Agent definitions, the RULES.md folds, NEXT.md's add-on list | LIGHT · M | 0.67 | $12 | 1% |
| 10 | The new-app checklist page and its markdown record | LIGHT · M | 0.67 | $12 | 1% |
| — | Before the release: screenshot comparison, every script, tests owed, full suite, notes, the tag (one reviewer agent + the coordinator; counted as one LIGHT unit) | — | 0.67 | $12 | 1% |
| | **Sum, sequential: 10 LIGHT chunks + 1 DATA chunk + the release step** | | **8.8 h** | **$170** | **≈ 15%** |

(The per-row shares add to 14%; $170 ÷ $11.6 is 14.7%, hence ≈ 15%.)

**Run time (wall clock), with the next builder beside a review where files allow (schedule below): ≈ 7.1 h of
running**, plus one 30-minute 5-hour-window pause (likely once, see below) and one retry allowance of 0.5 h (one LIGHT
behaviour failure, the usual rate): **≈ 8.1 h; range 7.1–9.3 h.** Three of the four LIGHT batch reviews have a builder
beside them; B3's (the kit, the definitions, the checklist) has none, because the kit is the last code.

**Size risk, stated apart:** four LIGHT L chunks (1, 4, 6, 8) and one DATA L (3). If each runs 30% over its type's
figure: +1.2 h, +$26, +2.2%. Upper bound ≈ 9.3 h, ≈ $196, ≈ 17%. The 30% rule on the first chunk (RULES, stop rules)
re-estimates the whole build if chunk 0 or 1 runs over.

**Where the week and the window stand at the planned start:** the week 8% used, resets Monday 05:00; the 5-hour window
7% used. (Read from the brief's "[week _8% used …; the 5-hour window _7% used]" as 8% and 7%; if a digit is missing
there, only the pause arithmetic shifts, not the chunk figures.)

- **Weekly limit:** 8% + 15% ≈ 23% at the end (≈ 25% at the upper bound). No weekly pause: nowhere near the limit, and
  the week resets Monday 05:00 whatever is left.
- **5-hour windows:** the build spans two windows (≈ 8 h). 1.2.1's one data point: a stop ≈ 1.5 h in with three
  agents running on a window already used that morning, ≈ 30 minutes long. This plan runs three agents (coordinator
  plus two) for most of its length from a window 7% used, so **one 30-minute pause is likely, most probably in the
  stretch 1.6–3.4 h** (chunk 3's review beside chunk 4's build, then B1's review beside chunk 7's build). It is in the
  figure above. The coordinator's hourly scheduled task resumes the build by itself (RULES "The build loop"; L15).
- **Not in the build's figure:** this planning session and the independent pre-read (both done before the build), and
  the first app's vibe check (moved there by SPEC).

**Schedule** (hours from the start; never more than three agents at once: the coordinator plus two; each LIGHT build
≈ 30 min of the 40, each batch review ≈ 40 min, each merge ≈ 5 min; DATA build ≈ 0.8 h, review ≈ 0.5 h):

| From–to | Running | Notes |
|---|---|---|
| 0.0–0.3 | build 0 | one builder; S; the agents of every later chunk read RULES.md |
| 0.3–0.8 | build 1, build 2 (two builders) | share no files (2 touches only `supabase/`, `scripts/`, `.github/`) |
| 0.8–1.5 | B0 review {0, 1, 2}; build 3 beside it | 3 branches off 2's branch, rebases on `main` after 2 merges |
| 1.5–1.6 | merge 0, 1, then 2 | 2 is rebased after 1 merges and its CI re-run before its merge (Decided 43) |
| 1.6–2.1 | 3's review (Opus); build 4 beside it | 4 needs only 1 |
| 2.1–2.2 | merge 3 | |
| 2.2–2.7 | build 5 | kept after 3's review so no more than three agents run |
| 2.7–3.4 | B1 review {4, 5}; build 7 beside it (2.7–3.2) | 7 needs 2, 3 (merged) and this file's appendix |
| 3.4–3.5 | merge 4, then 5 | |
| 3.5–4.0 | build 6 | needs 4 merged |
| 4.0–4.7 | B2 review {6, 7}; build 9 beside it (4.0–4.5), then build 10 (4.5–5.0) | 9 and 10 share no files with 6, 7 |
| 4.7–4.8 | merge 6, then 7 | |
| 4.8–5.5 | build 8 (the kit) | needs 6 merged; 10 finishes at 5.0 |
| 5.5–6.2 | B3 review {8, 9, 10} | no builder beside it |
| 6.2–6.3 | merge 8, 9, then 10 | the checklist page merges last |
| 6.3–7.1 | before the release | one reviewer agent + the coordinator |

---

## Decided

Technical and architecture decisions, each with its one-line reason. The reviewer checks the reason, not the taste.

1. **Chunk 2 is LIGHT, chunk 3 is DATA.** Chunk 2 lifts scripts with their own tests and writes nothing; chunk 3
   replays migrations and writes rows on the replay, and it is the check every later DATA chunk's safety rests on.
2. **The kit (chunk 8) runs the real screens from `src/`, and the frozen prototype's screenshots are the release
   comparison's reference**, taken at the start of chunk 8 from the first commit's `prototype/` (before the kit changes
   it) into `design/0.1/prototype/` at 390 and 1280 px in both themes. Once the kit renders the real screens, nothing
   else records what the prototype looked like.
3. **react-router-dom stays** (Overload's `Nav.tsx` and `App.tsx` route with it; the kit renders the real `AppRoutes`
   under `MemoryRouter`, which is one step further than Overload's kit, whose `prototype/src/App.tsx` assembled a shell
   of its own from real parts with a fake auth that was always signed in); **date-fns goes** (`format.ts` covers dates,
   money, numbers, plurals and the build line's time with `Intl`).
4. **Fonts come from `@fontsource-variable/archivo` and `@fontsource-variable/jetbrains-mono` (5.3.0, OFL-1.1)**, one
   variable face per family split into subset files (Archivo: latin, latin-ext, vietnamese; JetBrains Mono: six;
   Polish letters live in latin-ext), imported in `global.css`; Vite emits the woff2 files hashed and vite-plugin-pwa's
   `globPatterns` already names `woff2`, so the app shell caches them; `check-build.mjs` asserts every emitted woff2 is
   in the precache, at least one per family, latin-ext among them. The font-family names become `'Archivo Variable'`
   and `'JetBrains Mono Variable'` in the `@theme` block.
5. **No `playwright` dependency.** The kit's check uses the environment's Playwright (pre-installed in cloud sessions
   with its own Chromium; on a PC `npx playwright install chromium` once, said in the prototype skill); the zip's
   `clipping.mjs` already falls back to `PLAYWRIGHT_PATH`.
6. **Panel is Overload's `BottomSheet.tsx` whole on phones and a side panel on desktop; its portal target is the
   frame's transformed element, not `document.body`.** `WidthRoot` renders the element that carries the
   `transform: translateZ(0)` (the zip puts it on a child of the measured box) and hands it out through context as the
   overlay root; a `position: fixed` overlay portaled into it stays inside the kit's phone frame (SPEC item 3), and in
   the real app the frame is the window, so nothing changes there. **ConfirmDialog, Toast and Panel share one overlay
   model:** every overlay carries the same `data-overlay` marker, the one drawn last owns Escape and the Tab ring and
   takes focus (Overload's BottomSheet logic, generalized from `[data-bottom-sheet]`), so a delete confirmation over an
   open panel takes Escape and Tab itself instead of closing the panel under it. The kit's check has a PHONE FRAME
   pass that asserts the panel's, the dialog's and the toast's boxes lie inside the frame's box.
7. **Database calls may live only in `src/**/*Service.ts`, `src/**/use*.ts`, `src/**/use*.tsx` and
   `src/lib/supabase.ts`;** every other file under `src/` is a "screen file" for the no-database check (`useAuth.tsx`
   reads the session with `supabase.auth`, so hooks in `.tsx` count). The `.from(` matcher carries Overload's
   `(?<!Array|Buffer)` lookbehind, so `Array.from` in `Table.tsx` is not a hit. Sign-in therefore moves into
   `src/features/auth/authService.ts` (Overload calls `supabase.auth` inside `LoginPage.tsx`), and the service throws
   on a resolved `{ error }` as well as on a network failure, classified as Decided 24 says, so the screen has one path
   to its three lines (supabase-js resolves with `{ error }`; it does not throw).
8. **The build line is a words-file function**, `settings.buildLine(version, hash, time)` →
   "Wersja 0.1.0 · build 3f9c2a1 · 06.11.2026 13:52"; the prototype writes it as literal text, which the words check
   forbids in `src/`.
9. **The app's name leaves the words file.** Name, short name, description, theme colour, icons and locale live in
   `app.config.ts` at the root, read by `vite.config.ts` (manifest, `index.html`) and given to the app as the define
   `__APP_CONFIG__`, read in one place, `src/lib/appConfig.ts`, the way `version.ts` reads `__APP_VERSION__`. One
   place per fact; the words file stays per-language.
10. **The words check reads what Overload's scanner reads:** outside `src/i18n/`, every JSX text with a letter and
    every string literal or template piece is a hit unless it is code-like by Overload's rule (one token, no
    whitespace, not starting with a capital), a query argument, an import or module name, a type, the value of a
    `NON_TEXT_ATTRS` or `data-*` attribute, or punctuation, spaces and digits only (the "·" of the build line). So
    `{saving ? 'Zapisywanie…' : 'Zapisz'}`, `confirmLabel="Usuń"`, `toast.show('Zapisano')` and `{ label: 'Klienci' }`
    all fail, as JSX text does. Developer-facing strings (a thrown `Error`'s message, `console.*`) stay in the rule as
    Overload keeps them, and each gets an `ALLOWED` entry with its reason (the first: `supabase.ts`'s missing-env
    error). Test files are not scanned. The forbidden-word families are empty in the starter; the scanner is proven by
    the lifted call-pattern tests with a stand-in family. What stays uncaught is written in chunk 5.
11. **check-embeds: zero embeds is a pass once at least one source file under `src/` was scanned** (Overload fails on
    zero embeds because it has many; the starter has none, so the files-scanned floor and the lifted unit tests take
    over the "the scan read nothing" guard; a missing `src/` is exit 2, not a pass); live mode and the Adam-id filter
    go (the starter has no project).
12. **replay-migrations.sh: zero migration files is a clean replay when `supabase/access.json` is empty**; tables in the
    list with no migration is exit 2. The image tag lives in one file, `supabase/postgres-image` (env
    `SUPABASE_PG_IMAGE` overrides), default `supabase/postgres:17.6.1.155`, Overload's production tag, the one known to
    replay; the checklist's hand-off sets it from the app's project.
13. **verify-rls on the replay signs two users in with minted tokens**, not Supabase's auth container: HS256 JWTs
    signed with the secret PostgREST starts with (`role`, `sub`, `aud`, `exp`), sent as `Authorization` and `apikey`
    through supabase-js's `global.headers`; the anon key is a third token with `role: anon`. Nothing to pull, no
    passwords, starts clean every run. **Verified in this session** (Facts 1), with two conditions the harness must
    meet: PostgREST connects as `authenticator` (its password set on the replay; `safeupdate` then loads, as on a
    hosted project), and the Auth service's definitions of `auth.uid()`, `auth.role()`, `auth.email()` and
    `auth.jwt()` are applied first, as `supabase_admin`, lifted verbatim from `supabase/auth`'s migrations
    `20220224000811_update_auth_functions.up.sql` and `20220531120530_add_auth_jwt_function.up.sql`. The Postgres
    image ships the 2021 bodies that read the per-claim settings PostgREST removed in 12.0.0, so on the bare image
    `auth.uid()` is always null and every `own` table reads empty for everyone.
14. **verify-rls's permission-denied rule depends on the probe:** a 42501 on the owner's own-rows probe is a FAIL (a
    missing grant), on the foreign-rows and signed-out probes a PASS (RLS or a grant doing its job). SPEC: "a missing
    grant can look like a passing RLS check".
15. **Sign-ups (Fact 3): the dashboard toggle at checklist step 2 is the production control.** The docs source
    (`supabase/supabase`, `apps/docs/content/guides/deployment/branching/github-integration.mdx`) says a production
    deploy applies migrations, functions and buckets only; `[auth]` reaches a persistent branch only when a `[remotes]`
    block names its project id. No `[remotes]` block: it would also push `site_url`, redirect URLs and the rest of
    `[auth]` from the repo onto production on every merge. The sign-ups check guards the declared intent in
    `config.toml`; step 2's Expect box probes the project's `/auth/v1/settings` for `disable_signup: true` and
    `external.email: true`.
16. **PWA (Fact 4): `useServiceWorker.ts` keeps its `onNeedReload` handler (records, never reloads)**, because
    vite-plugin-pwa 1.3.0's client reloads the page the moment a new worker activates (`isUpdate || isExternal`) when
    no handler is given (read in `dist/client/build/react.js`: `if (onNeedReload) onNeedReload(); else
    window.location.reload()`); Overload's `useServiceWorker.test.tsx` is lifted with the hook as the standing proof. **The starter
    has no lazy route chunks** (the one dynamic import is workbox-window, loaded at start), so an old page never
    fetches a chunk the new precache dropped. `scripts/check-build.mjs` (new) asserts on `dist/`: `skipWaiting` and
    `clients.claim` in `sw.js`, every woff2 in the precache manifest, no `fonts.googleapis.com`, no dynamic chunk but
    workbox-window.
17. **Toast = Overload's `toastStore.ts` + the prototype's look**, drawn inside the app frame (Overload draws it fixed
    to the window; the kit's phone frame needs it inside).
18. **The empty, loading and couldn't-load patterns and the phone list rows become components** (`EmptyState`,
    `LoadError`, `ListRows`): SPEC lists them under Components; the prototype has them inline in the example screen,
    which stays in `prototype/`.
19. **The Klienci example's words live in `prototype/src/examples/words.ts`**, and `src/i18n/pl.ts` holds only the
    starter's words (app, nav, signIn, common, settings). App code never imports from `prototype/`, and an app's words
    file should hold the app's words; `prototype/src/i18n/pl.ts` as committed stays the wording record.
20. **`prototype/` uses the root `node_modules`** (Overload's kit has no package.json of its own); the zip's
    `package.json` and `package-lock.json` go when chunk 8 rewires the kit. One lockfile, one install.
21. **One component per file under `src/components/`** (Overload's convention); it also keeps chunks 4 and 6 from
    sharing a file.
22. **`vercel.json`'s `ignoreCommand` also skips pushes that change only `docs/*` or `.claude/*`**, and
    `scripts/vercel-ignore.test.mjs` is lifted (init branch `main`): it runs the real command in throwaway repos, which
    is the only thing that proves it.
23. **The theme is `src/features/settings/useTheme.ts`:** one localStorage key `theme`, every access in try/catch,
    `system` removes `data-theme` so `tokens.css`'s media query decides; applied in `App` above everything, where
    Overload applies its theme.
24. **Sign-in has three outcomes and never shows Supabase's raw message alone** (SPEC "Screens" as amended
    2026-11-06, replacing the first wording). `authService.signIn` classifies the failure and throws it: supabase-js's
    `AuthApiError` for bad credentials → `wrong`; a fetch failure (`AuthRetryableFetchError`, a `TypeError` from
    `fetch`) or `navigator.onLine === false` → `offline`; anything else → `failed` with `error.message` as the reason.
    The screen shows `t.signIn.wrong`, `t.signIn.offline` ("Brak połączenia. Spróbuj ponownie, gdy wróci.") or
    `t.signIn.failed` ("Nie udało się zalogować.") followed by `t.common.reason: <reason>`, the Klienci list's reason
    pattern. No offline strip on the sign-in screen (not in the prototype). The DEMO entry has an Offline state
    (added to `prototype/` with the two words on 2026-11-06, checked clean); `failed` has no DEMO state (the amendment
    names none), chunk 4's test covers it.
25. **Tabs live in `src/shell/tabs.ts`**; the starter has Settings only; `/` and any unknown path go to the first tab
    (Overload's `*` → `/today`).
26. **No Supabase CLI in the repo or the environment:** the replay is Docker + psql in the container, Overload's way.
27. **The replay in cloud sessions runs in the Starter environment** (Adam's answer to Q1, 2026-11-06): agents try
    `mirror.gcr.io` first (Overload's L359), then Docker Hub, where the environment's network secret (a read-only
    Docker Hub token for `auth.docker.io`) lifts the shared anonymous quota; the PR's `migration-replay` run stays the
    second proof, and the only one when both pulls fail, which the builder says in its report instead of skipping (the
    reviewer reads that run the way `reviewer-data.md` reads the Supabase Preview runs).
28. **The RULES.md sort (Fact 5, appendix): 413 lines over every entry from Overload's line 161 on.** The 156
    GENERAL-PROCESS lines fold into the standing sections they belong to (chunk 9, by the appendix's "Proposed folds");
    the 150 GENERAL-CODE lines go to the `stack` skill (chunk 7, by its "Proposed stack-skill outline"); the 34
    OFFLINE-ADDON lines are kept aside in `NEXT.md` under "Offline writing add-on"; the 15 STAGING-RELEASE lines are
    named in `NEXT.md` under "Client-ready build" for that build to lift; the 58 OVERLOAD-ONLY lines are dropped. Each
    carries its source line; the appendix's 20 "Doubtful" entries are the reviewers' checklist for chunks 7 and 9.
29. **Agent definitions read the base branch, the default branch and whether the app has staging from `CONTEXT.md`
    "Repo facts"** (three named lines), never from the definition; until chunk 9, Overload's definitions are used with
    the coordinator's brief overriding `staging`/`master` with `main` and naming no staging check.
30. **Reference screenshots are committed as PNG** (80 files, ≈ 5 MB at the measured ≈ 60 KB each) in
    `design/0.1/prototype/`; Overload keeps its built captures the same way, and a comparison needs the pictures, not
    a rebuild. The checklist's hand-off says what a new app does with `design/0.1/` (keeps it as the design reference
    until its own first prototype replaces it).
31. **The sign-ups check also fails on `[auth.email] enable_signup = false` whatever the tables:** that key turns
    e-mail sign-in off for everyone (Overload, 2026-10-14).
32. **Icons:** three neutral placeholder files (`favicon.svg`, `icon-192.png`, `icon-512.png`, an "S" tile in the
    accent) made once in chunk 1 with a throwaway Playwright render and committed; `app.config.ts` names them and each
    app replaces the files. Overload's `gen-icons.mjs` is dropped (SPEC).
33. **`vitest.setup.ts` stubs all four defines** (`__APP_VERSION__`, `__BUILD_HASH__`, `__BUILD_TIME__`,
    `__APP_CONFIG__`) from `package.json` and `app.config.ts`, Overload's way for the version.
34. **The kit's example data hook subscribes to the query cache** (`useClients` reads what `seed.ts` put under its key
    through a subscription): a disabled query does not re-render on `setQueryData` (Overload L4).
35. **Skill triggers are exact and tested:** each `SKILL.md` description names its trigger (files under `src/` or
    `supabase/`; `prototype/`; the estimate in TASKS.md) and `scripts/check-skills.test.mjs` fails on "always" in any
    description (L9).
36. **The example's own save rule is the kit's demonstration of SPEC Rule 3** (Save off and `needsConnection` offline,
    `saveFailed` keeps the form): nothing in `src/` saves anything, so the rule is enforced by the stack skill and shown
    by the example; the first app's first write chunk asserts it.
37. **Chunk 1's `App` renders only what exists at that point** (providers, the app's name, the build line); chunk 4
    replaces it. A chunk must leave the repo building and deployable, not finished.
38. **`check-context-size.mjs` is lifted as is** (75 KB ceiling).
39. **Own and signed-in tables revoke everything from `anon` in the migration that creates them** (chunk 3's
    fixture does; the stack skill prescribes it). Supabase's default privileges grant all on every new table to
    `anon`, `authenticated` and `service_role` (seen on the replay), so one wrong policy on a table `anon` can read
    leaks to the public; after the revoke the signed-out probe answers 42501, a PASS, whatever the policies say, and a
    `using (true)` mistake reaches signed-in users only. Public tables do what Overload's 048 does: `revoke all`, then
    `grant select` to `anon` and `authenticated` (the default grant is ALL, not select). Every grant a table needs is
    written in its migration, never left to the default privileges: they are a project setting
    (`auto_expose_new_tables`), and a migration that leans on them passes the replay and answers 42501 on a project
    where they are off (Overload's 042 comment).
40. **verify-rls reads PostgREST's error code (`42501`), never the HTTP status:** the same refusal comes back as 401
    for `anon` and 403 for `authenticated` (seen on the replay).
41. **A table created before any code reads it is marked `ahead` in the access list** (`{ "kind": "own", "ahead":
    true }` instead of the bare kind), Overload's `TABLES_AHEAD_OF_THE_APP` kept: the list test demands a migration for
    it and no `.from()`, and fails once a `.from()` appears until the marker goes. Without it SPEC Rule 6 (the key
    comes with the migration) and the "every key is used" test contradict each other for one chunk.
42. **Chunk 0 lifts RULES.md's general sections, the record files' headers and `check-context-size.mjs` first**, not
    chunk 9: their content exists today (Overload RULES.md lines 1–160, Overload's file headers), and every agent
    definition from chunk 1 on tells its agent to read RULES.md's ALWAYS sections. "Pages for me" and the general lines
    of "Standing rules" (credentials, migrations, records, backups, snippets; the SQL-editor line generalized to "a
    database console bypasses RLS") are lifted too: SPEC item 7's list omits them, chunk 10 depends on the first and
    every build on the second.
43. **Chunk 2 is built beside chunk 1 but its embeds check goes green only after chunk 1 merges:** `check-embeds.mjs`
    walks `src/`, which does not exist on `main` until then. Chunk 2's branch is rebased on `main` after chunk 1's
    merge and its CI re-run before its own merge (the batch reviewer's rebase step); until then its PR's embeds step
    is expected red and the report says so.
44. **Chunk 10 copies `findClipped` (twenty lines) out of the kit's `clipping.mjs` with the source named**, instead of
    importing it: importing would make B3's two chunks share a file the kit chunk rewrites.
45. **`WidthRoot` sits at the top of `AppRoutes`, above the signed-in/signed-out switch**, so the sign-in page gets
    the phone layout on a phone (44 px controls); the kit renders `AppRoutes` without a second `WidthRoot`, and an
    `App.test.tsx` case asserts the sign-in page renders inside `[data-layout]`.
46. **Every DEMO entry carries one expectation (a text or an element) that the kit's check asserts after applying the
    state**, so a check that visits 20 states cannot pass with 20 identical screens (the browser check takes over
    what Overload's jsdom smoke tests asserted per state). The three sign-in states that are the page's own
    (`wrong password`, `offline`, `signing in`) are driven by the check: it fills the fields and submits, and the kit's
    fake `authService.signIn` rejects with `wrong` or `offline`, or stays pending, by the DEMO state.
47. **`replay-migrations.sh` applies the Auth service's function definitions before the first migration**, as
    `supabase_admin`: a migration that calls `auth.jwt()` is valid on a hosted project and would otherwise fail every
    replay (the image's init script defines `uid()`, `role()` and `email()` only). The file is chunk 2's.
48. **Chunk 8 may fix layout-only defects its check finds in `src/` components** (a clipped row, a wrapped button) and
    lists each in its report; a behaviour change stays a decision card. The kit is the first real-width look at
    chunks 4 and 6, and a chunk whose Done-when needs a clean check must be allowed to earn it.
49. **Every `own` table has a `user_id` column** (the stack skill's rule; Overload's `NO_USER_ID_COLUMN` fallback is
    not lifted): verify-rls's owner count asks for the column and answers 42703, a FAIL, where it is missing, never a
    pass.

## Questions for Adam

Only what the rule sends to you: what a user sees or does, cost, risk to client data, how hard it is to change later,
or your own manual work. Plain words; each technical term explained once.

**Q1. Docker in cloud sessions: how should the replay run for builders and reviewers?**
What I found (Fact 2): Docker starts in a cloud session, and the Supabase Postgres image pulled and ran here. But
Docker Hub allows 100 anonymous pulls per hour per address, and every cloud session shares one outgoing address: at
13:54 the hour's 100 were used up (the reply said 0 remaining) and the pull failed; at 14:15 it worked. So a builder
or reviewer can hit a wall of up to an hour at any moment, depending on what other sessions pulled. The two other
public mirrors are blocked by the session's network rules. GitHub Actions (the `migration-replay` check that runs on
every PR) is not affected; Overload's has run there for weeks.
- Option A: **CI-only.** Builders and reviewers never run the replay themselves; they push and read the PR's check.
  What it means for you: nothing to set up. For the build: chunk 3's break proofs (ten of them) each cost a push and a
  5-minute CI run instead of seconds, and the DATA reviewer cannot poke at the replayed database by hand; the chunk
  runs longer (≈ +0.5 h) and the proofs are weaker.
- Option B (**recommended**): **a free Docker Hub account of yours, with a read-only access token saved as a network
  secret on the starter's cloud environment** (host `auth.docker.io`, "basic" type: the secure form the session shows;
  the token never enters a chat or a file). Then pulls count against your account's 200 per 6 hours, not the shared
  address. Risk: the token can only pull public images. Also: the "Default" environment is shared by all your repos, so
  the starter gets its own personal environment at setup (the setup step creates it; nothing else changes).
- Option C: run the replay on your PC only (Docker Desktop), as Overload's release sheet does. Not enough for agents.
- Free fallback the agents use first either way: Overload's own rule (RULES.md line 359) pulls the image through
  Google's public mirror `mirror.gcr.io` and tags it; checked here at 15:25: the mirror is reachable through this
  session's proxy (PostgREST's manifest found, an alpine image pulled), but it did not hold the Supabase image's tag
  at that moment (a mirror serves what it has cached), so it is a try, not a guarantee.
**Answer (Adam, 2026-11-06): B.** A free Docker Hub account with a read-only token, saved as a network secret for
`auth.docker.io` on a new personal cloud environment named **Starter**; agents still try `mirror.gcr.io` first.
Applied: Decided 27, "Process notes" (the environment), CONTEXT.md "Repo facts".
What you'd regret if wrong: with A, a verify-rls that was never broken against the real image by a reviewer; with B,
five minutes making an account and a token.

**Q2. Who creates the release tag `v0.1.0`?**
In Overload's environment the git proxy refused a tag push (L31; it refused `v1.2.0` and every branch delete), and the
GitHub tools this session has cannot create tags or releases.
- Option A: you run two commands at the end (`git tag v0.1.0` and `git push origin v0.1.0`), about two minutes, from
  a release note the coordinator writes in `docs/release-0.1.0-notes.md`.
- Option B (**recommended**): setup tries once whether the coordinator can push a tag to this repo (one throwaway tag,
  deleted by you if it lands); if it can, the release is the agents'; if not, A.
What you'd regret: with neither decided, the last step of the build waits on you without warning. SPEC says "no
checklist page for Adam" for this release; option A is two commands, not a page.
**Answer (Adam, 2026-11-06): B.** Setup tries one throwaway tag; if it does not land, Adam runs the two commands
from the release note. Applied: "Before the release", step 5.

**Two to-dos that were yours (repository settings on GitHub, one click each). Done, Adam, 2026-11-06: the repo is a
template and head branches are deleted automatically.** Kept as the record:
- **Mark `adamjuszczyk/starter` as a template repository** (Settings → General → "Template repository"): the
  checklist's step 1 creates every new app "from the starter template", which needs the flag; agents cannot set it.
- **Turn on "Automatically delete head branches"** on this repo (Settings → General): Overload's L31 found agents
  cannot delete branches through the proxy, so 1.2.1's close left 265 merged branches for you; with the setting on,
  each squash-merged chunk branch goes by itself.

Everything else the plan decides itself (above). The two things this list first flagged for the vibe check were
amended by the spec chat on 2026-11-06, word for word in SPEC.md: the sign-in's three outcomes (SPEC "Screens";
Decided 24; the prototype's words and DEMO entry) and the repo public or private per app (SPEC item 8 step 1; chunk
10's step 1). Nothing waits on Adam.

## The three assumptions I am least sure of

1. **Chunk 6 fits a LIGHT chunk.** Adapting Overload's 596-line `BottomSheet.test.tsx` (35 tests) to the frame
   portal and the desktop shape is the biggest single lift in the build; if it runs over, the 30% rule re-estimates,
   and the fallback is to split the Table, Toast and list patterns into their own LIGHT chunk beside it.
2. **Four module swaps are enough for the kit to run the real screens** (`lib/supabase.ts`,
   `features/auth/useAuth.tsx` with `authService.ts`, `hooks/useOnlineStatus.ts`, `features/settings/useTheme.ts`) and
   the Panel's portal-to-frame change keeps Overload's BottomSheet tests meaningful. Chunk 8 is the first time the real
   screens meet the fakes; chunk 6 adapts the 40 lifted tests.
3. **The estimate's start figures and the window pause:** 8% and 7% read from the brief, and "one 30-minute pause,
   likely" from a single data point (1.2.1). The chunk figures don't move with it; the wall time does.

---

## The sweep of SPEC.md

Read whole, against the prototype's source and Overload's files. "C" = two places disagree; "S" = SPEC is silent and
the plan decides (the decision's number in "Decided" where it has one); "O" = screen order.

**Contradictions**
- C1. Item 7 gives RULES.md *empty* "Rules discovered during builds" and "Checks that lied"; item 5 and Fact 5 lift the
  general ones from those sections. Resolved by kind (Decided 28): process rules fold into RULES.md's standing sections,
  code rules go to the `stack` skill, so the two discovered-rule sections start empty as item 7 says.
- C2. Item 3 drops "1.2.1's … smoke tests"; Overload's RULES ("Verification by chunk type") runs the prototype's jsdom
  smoke test at every merge that changes a module the prototype renders (L28). The kit's `check/run.sh` takes that
  role: a real browser opens every DEMO state, asserts the state's expectation (Decided 46) and fails on a page error
  or clipping, which jsdom cannot see (README). Written into RULES.md's lifted section by chunk 9.
- C3. The Screens table says the words are in `prototype/src/i18n/pl.ts` "word for word"; the prototype writes the
  Settings build line as literal JSX and keeps `app.name` in the words file, while item 1 puts the app's name in one
  config file. Same words, two moves (Decided 8, 9).
- C4. Item 2 lifts `BottomSheet.tsx` whole (a portal into `document.body`); item 3 wants overlays inside the app frame
  so the kit's phone frame keeps them. The portal target becomes the frame (Decided 6).
- C5. Item 4's sign-ups check reads `supabase/config.toml`; Fact 3 found the GitHub link does not apply `[auth]` to
  production. The check guards the declared intent; production is the dashboard toggle plus step 2's probe (Decided
  15). Chunk 2's "would not catch" says so in words.
- C6. Item 1 lifts `src/lib/queryClient.ts`; Overload's carries the maintenance `MutationCache` that item 1 drops with
  the gates. Lifted without it.
- C7. "How this build runs" compares screenshots in both themes; the zip's `clipping.mjs` screenshots dark for every
  fourth state only. Chunk 8 screenshots every state in both themes, and the reference set is taken the same way.
- C8. Item 4 lifts `check-embeds-local.sh`, whose Overload comment says "start dockerd first"; Fact 2 found what that
  takes here (`dockerd --iptables=false --ip6tables=false &`; without the two flags it dies on nftables) and that the
  image pull is the real obstacle (Q1).

**Silences**
- S1. check-embeds on an app with no embeds (Decided 11). S2. The replay on zero migrations (Decided 12). S3. The
  verify-rls list tests assume twenty-odd tables and `.from()` calls; the starter has none: the tests assert
  consistency (zero keys ↔ zero `.from()`, zero `create table`) and prove each scanner on fixture sources.
- S4. What a "screen file" is for the no-database check (Decided 7). S5. Where the example's words live (Decided 19).
  S6. `vercel-ignore.test.mjs` is neither lifted nor dropped by SPEC: lifted (Decided 22). S7. `version.ts`'s
  `compareVersions` is unused until required updates: lifted whole with `version.test.ts` (ten lines; lift rule).
- S8. The OFL notice: fontsource ships `LICENSE` in the package and the woff2 metadata carries it; nothing else needed.
- S9. Where the replay's image version lives (Decided 12). S10. The release tag (Q2). S11. Docker in sessions (Q1,
  Decided 27). S12. Playwright (Decided 5). S13. The theme store (Decided 23). S14. Sign-in offline (Decided 24).
  S15. Routing for a one-tab app (Decided 25). S16. Icons (Decided 32).
- S17. "Progress saved where Claude can read it" on the checklist page: as a file opened from disk a page can only use
  the browser's storage; published as an artifact it can use the artifact database. Chunk 10 builds both paths; the
  markdown stays the record.
- S18. Item 4's "Cost table: Overload's second calibration, as BUILD.md's Bootstrap gives it": BUILD.md is outside the
  repo; the table is lifted verbatim from Overload's `scripts/cost-table.md` (chunk 7).
- S19. The lessons the `prototype` skill lifts (L1, L4, L6) are in Overload's `LEARNINGS.md`, read in this session;
  chunk 8 quotes them. S20. `Nav.tsx`'s install prompt and Coach gate: dropped with their features.
- S21. Sign-out: Overload clears the query cache and wipes Dexie; the starter clears the query cache only, and the
  theme stays (a device preference). S22. The loading state before the session is known: Overload's spinner, through
  tokens; the prototype has no such state (a display-only lift, for the first app's vibe check).
- S23. A crash screen (error boundary): not in SPEC, not built; noted in NEXT.md for the client-ready build.
- S24. SPEC item 8 step 1 (amended 2026-11-06): public or private per app; the checklist page says what each means
  (chunk 10); nothing in the build depends on the choice.
- S25. SPEC item 7's RULES.md list omits "Pages for me" (chunk 10's rules) and "Standing rules": both lifted, in chunk
  0 (Decided 42). S26. Nothing marks the starter as a GitHub template repository, which checklist step 1 needs, and
  L31's branch-deletion setting is unaddressed: both are Adam's, one click each ("Questions", the to-dos).
- S27. SPEC Rule 6 gives a table its key with the migration that creates it, and the lifted list test fails on a key
  nothing uses: the `ahead` marker reconciles them (Decided 41). S28. Overlays stacked (the Delete state draws
  ConfirmDialog over an open Panel) are not in SPEC's words, and Overload's two components never stacked: one overlay
  model (Decided 6).

**Screen order (O):** every screen comes after what it needs.
- Sign-in needs the client, fonts, tokens and words (chunk 1), Button/TextField/InlineError, `useAuth` and
  `authService` (chunk 4) → built in chunk 4. The app frame needs `WidthRoot`, `AppShell`, tabs, the router, the
  offline strip and the theme → chunk 4. Settings needs the frame, `useTheme`, `version.ts`, `appConfig.ts`, sign-out
  → chunks 1 and 4.
- The Klienci list (kit example) needs Table, Badge, EmptyState, LoadError, ListRows, Toast, PageHeader, `format.ts`
  and the kit → chunks 4, 6, 8. The Klient form needs Panel, the three fields, ConfirmDialog, InlineError → 4, 6, 8.
  The design system page needs everything → chunk 8.
- Every DEMO state has one owner chunk: Sign-in ×4, New app ×1, Settings ×1 → chunk 4; Klienci ×6, Klient form ×7,
  Design system ×1 → chunk 8 (their components in 4 and 6).

---

## File and folder structure (after chunk 10), and the stack

```
app.config.ts                      name, short name, description, theme colour, background, icons, locale   (1)
index.html                         lang="pl"; title, theme-color and favicon filled from app.config.ts        (1)
package.json                       version 0.1.0; dev, build, preview, typecheck, test, check, proto:check    (1)
vite.config.ts                     the four defines, the PWA settings and their comments, vendor chunks       (1)
vitest.config.ts  vitest.setup.ts  tsconfig.json  tsconfig.app.json  tsconfig.node.json                      (1)
vercel.json  .env.example  .gitignore  .claude/launch.json                                                    (1)
public/favicon.svg  icon-192.png  icon-512.png                                                               (1)
src/main.tsx  App.tsx  vite-env.d.ts                                                                      (1, 4)
src/styles/tokens.css  global.css                                                                             (1)
src/i18n/pl.ts                     the words file and the `Words` type                                        (1)
src/lib/supabase.ts  queryClient.ts  version.ts  appConfig.ts  format.ts  cx.ts  useWide.tsx             (1, 4)
src/hooks/useOnlineStatus.ts       src/features/pwa/pwaRegister.ts  useServiceWorker.ts                      (1)
src/features/auth/useAuth.tsx  authService.ts  LoginPage.tsx                                                 (4)
src/features/settings/SettingsPage.tsx  useTheme.ts                                                          (4)
src/shell/AppShell.tsx  PageHeader.tsx  tabs.ts                                                              (4)
src/components/Button.tsx  fields.tsx  Badge.tsx  OfflineStrip.tsx  InlineError.tsx                          (4)
src/components/Panel.tsx  ConfirmDialog.tsx  Table.tsx  Toast.tsx  EmptyState.tsx  LoadError.tsx  ListRows.tsx (6)
src/features/notifications/toastStore.ts                                                                     (6)
supabase/config.toml  access.json  postgres-image  migrations/.gitkeep  .gitignore                            (2)
scripts/check-build.mjs  vercel-ignore.test.mjs                                                              (1)
scripts/replay-migrations.sh  replay-auth-functions.sql  check-migration-order.mjs (+test)  check-migration.mjs
        migration-rules.mjs (+test)  check-embeds.mjs (+test)  check-embeds-local.sh  check-signups.mjs (+test) (2)
scripts/verify-rls.mjs (+test)  verify-rls-list.test.mjs  verify-rls-replay.sh  replay-tokens.mjs
        verify-rls-fixture/migrations/001_fixture.sql  verify-rls-fixture/access.json  verify-rls-fixture/seed.sql (3)
scripts/check-wording.test.mjs  check-tokens.test.mjs  check-screens-no-db.test.mjs                          (5)
scripts/cost-table.md  check-skills.test.mjs                                                                 (7)
scripts/check-context-size.mjs (0)  check-agents.test.mjs                                                    (9)
scripts/build-checklist-page.mjs (+test)                                                                    (10)
.github/workflows/migration-replay.yml                                                                    (2, 3)
prototype/vite.config.ts  override.mjs  inline.mjs  index.html  tsconfig.json  README.md  check/run.sh  check/clipping.mjs
prototype/src/main.tsx  index.css  App.tsx  demo/DemoMenu.tsx  demo/demoStore.ts  demo/seed.ts
prototype/src/fakes/supabase.ts  useAuth.tsx  authService.ts  useOnlineStatus.ts  useTheme.ts
prototype/src/examples/clients/ClientsScreen.tsx  ClientForm.tsx  useClients.ts  clientsService.fake.ts  fixtures.ts
prototype/src/examples/words.ts  prototype/src/screens/DesignSystem.tsx                                      (8)
design/0.1/prototype/*.png         the frozen prototype's reference screenshots (8); design/0.1/built/ (release)
docs/new-app-checklist.md  docs/new-app-checklist.html (10);  docs/release-0.1.0-notes.md (release)
.claude/agents/builder.md  reviewer-data.md  reviewer-light.md                                               (9)
.claude/skills/stack/SKILL.md  .claude/skills/estimate/SKILL.md (7);  .claude/skills/prototype/SKILL.md     (8)
SPEC.md  TASKS.md  CONTEXT.md  HISTORY.md (the planning commits);  RULES.md  DECISIONS.md  LEARNINGS.md  NEXT.md  (0)
```

Until chunk 8 the committed `prototype/` is the zip as it is (its own `package.json`, `src/components`, `src/shell`,
`src/screens`, `src/styles`); chunk 8 replaces it with the kit above, after the reference screenshots are taken.

**The stack.** Overload's `package.json` minus `@anthropic-ai/sdk`, `date-fns`, `dexie`, `recharts`, `@vercel/node`,
`playwright-core` (and `tsconfig.api.json`); kept: react, react-dom, react-router-dom, @tanstack/react-query,
@supabase/supabase-js, lucide-react, zustand (the toast store, the kit's demo store), tailwindcss and @tailwindcss/vite,
vite, vite-plugin-pwa, vitest, jsdom, @testing-library/react, typescript, the @types. **Additions, with their reason:**
- `@fontsource-variable/archivo` and `@fontsource-variable/jetbrains-mono` (5.3.0, OFL-1.1): the fonts bundled with the
  app instead of loaded from Google (SPEC item 1; Decided 4).
- Nothing else is added. No Supabase CLI, no Playwright package, no lint tool (Overload has none; the checks in
  `scripts/` are the starter's linters).

## Data models (what the starter stores)

No app tables. Accounts are Supabase Auth users, as Supabase holds them.

- **Theme, per device.** `theme: 'system' | 'light' | 'dark'`, default `system`. One `localStorage` key `theme`; read
  once at start and on change, written on change; every access in try/catch (a private window or blocked storage reads
  as `system` and the choice simply does not persist); a value that is not one of the three reads as `system`. Applied
  as `data-theme="light"` or `"dark"` on `<html>`; `system` removes the attribute so `tokens.css`'s
  `prefers-color-scheme` rule decides. Never a table.
- **The table access list,** `supabase/access.json`: one object, keys are the names of every table and view in the
  `public` schema, values are the kind: `"own"` (only the user who wrote a row sees it: Overload's tables),
  `"signed-in"` (every signed-in user of the app sees every row), `"public"` (anyone, signed out included); a table a
  migration creates before any code reads it carries `{ "kind": "<kind>", "ahead": true }` until its first `.from()`
  lands (Decided 41). Empty (`{}`) in the starter. Read by `verify-rls.mjs` (the probes by kind), `verify-rls-list.test.mjs` (every `.from()` name
  in `src/` has a key and every key is used; every `create table`/`create view` in `supabase/migrations/` has a key and
  every key is created by a migration, SPEC Rule 6), and `check-signups.mjs` (a `signed-in` key with sign-ups on fails).
  A table gets its key in the chunk whose migration creates it. The kind `role` is the client-ready build's.
- **The replay's image,** `supabase/postgres-image`: one line, the `supabase/postgres` tag of the app's production
  project; read by `replay-migrations.sh` and the workflow.

---

## Chunks, in build order

Types: DATA writes data or migrates (its own fresh reviewer, Opus max); LIGHT is everything else (built two or three at
a time, one batch review, Sonnet high). Every chunk: one concern; leaves the repo building, testing and deployable;
names the Overload files it lifts; states what its verification would not catch. "Done when" is what the reviewer
reads merge-ready against. Overload paths are relative to `../overload-v2`; prototype paths to this repo's
`prototype/` as committed in the first commit.

### Chunk 0 — Repo files: RULES.md's general sections, the record files' headers, check-context-size

**Goal:** the files every agent reads from chunk 1 on exist with Overload's general content: RULES.md's standing
sections, the four record files with their headers, and the size check that keeps CONTEXT.md readable.
**Type · size:** LIGHT · S. **Batch:** B0 with chunks 1 and 2 (built first, alone; shares no file with them).

**Scope**
- `RULES.md` (Overload's lines 1–160, lifted): Index; Escalation (the general items: anything SPEC is ambiguous or
  silent about, any change beyond the chunk's scope, a failed deploy, a flagged migration without staging, a login
  needed, anything irreversible or spending money, two documents disagreeing, data the check needs not existing, UI
  outside the design system; Overload's Coach, Northstar, SQL-Editor and Adam's-data items dropped); Reviewer rules;
  Verification by chunk type (with C2's kit line: the kit's check at every merge that changes a module it renders);
  Usage; Decision cards; The build loop (the base branch read from CONTEXT.md "Repo facts"; "Where chunks go" written
  for an app without staging and for one with); Staging and Pages for me (lifted as they stand; Decided 42); Standing
  rules (the general lines; "SQL" generalized to "a database console bypasses RLS"); Models (the table);
  "Rules discovered during builds" and "Checks that lied" empty, with one line each saying chunk 9 fills nothing into
  them and the stack skill holds the lifted code rules.
- `DECISIONS.md` (Overload's header: the entry format, "a record, not an inbox"), `LEARNINGS.md` (Overload's header:
  the verdict rule), `NEXT.md` ("Planned, not built" first; empty); `HISTORY.md` exists since the planning session
  (its first entry is that session's record): its header is checked against Overload's, nothing else.
- `scripts/check-context-size.mjs` (Overload's; 75 KB).

**Lifts (Overload):** `RULES.md` (lines 1–160), the headers of `DECISIONS.md`, `LEARNINGS.md`, `NEXT.md`, `HISTORY.md`,
`scripts/check-context-size.mjs`.
**Depends on:** nothing. **Prototype screens:** none.

**Verification**
- `node scripts/check-context-size.mjs` → ok on today's CONTEXT.md; a diff of RULES.md against Overload's lines 1–160
  shows only the named drops and the two generalizations (the reviewer reads it); a grep of RULES.md for
  `meso|Coach|Northstar|v2_|1.2.1|master` is empty. Break: write a 76 KB CONTEXT.md in a scratch copy → the check
  exits 1.
- **Would not catch:** a general rule wrongly dropped as Overload-only (the reviewer's read against the original is
  the only guard); whether agents actually read the file (their reports show it).

**Done when:** the files are in, the grep is clean, the diff reads as described, and `chunk 0 complete` is pushed
with its PR into `main`.

### Chunk 1 — Scaffold: the stack, tokens, fonts, the words file, the PWA

**Goal:** a new app's repo builds, tests, installs as a PWA that opens offline, bundles its fonts, reads its name and
colours from one config file and its version from `package.json`, and shows them.
**Type · size:** LIGHT · L. **Batch:** B0 with chunks 0 and 2.

**Scope**
- Root: `package.json` (version `0.1.0`; the stack above; scripts `dev`, `build` = `tsc -b && vite build`, `preview`,
  `typecheck`, `test` = `vitest run`, `check` = `node --test "scripts/*.test.mjs"`), `vite.config.ts` (the three
  defines and `__APP_CONFIG__`; `resolveBuildHash`, `resolveAppVersion`; `VitePWA` with `registerType: 'autoUpdate'`,
  `injectRegister: false`, `workbox.skipWaiting` and `clientsClaim` **with Overload's comment on why** kept, its last
  sentence rewritten for an app with no update screen; manifest and `includeAssets` from `app.config.ts`; an `appHtml` plugin filling `index.html`'s title,
  theme-color and favicon from the config, Overload's `stagingHtml` without the staging branch; `manualChunks`
  vendor-react, vendor-query, vendor-supabase), `app.config.ts` (new: `name`, `shortName`, `description`,
  `themeColor`, `backgroundColor`, `icons`, `locale`; neutral values: "Starter"), `index.html` (Overload's, `lang="pl"`),
  `tsconfig.json`/`tsconfig.app.json`/`tsconfig.node.json` (Overload's; `app.config.ts` in the node one),
  `vitest.config.ts` and `vitest.setup.ts` (Overload's; the setup stubs the four defines, Decided 33), `vercel.json`
  (Decided 22), `.gitignore`, `.env.example` (two variables), `.claude/launch.json`, `public/` icons (Decided 32).
- `src/main.tsx` (Overload's), `src/vite-env.d.ts` (Overload's, plus `__APP_CONFIG__`), `src/App.tsx` (minimal:
  `QueryClientProvider`, `useServiceWorker()`, the app's name and the build line; Decided 37), `src/lib/supabase.ts`
  (Overload's without `appEnv`), `src/lib/queryClient.ts` (Overload's defaults without the maintenance cache),
  `src/lib/version.ts` + `version.test.ts` (Overload's, whole), `src/lib/appConfig.ts` (new, reads `__APP_CONFIG__`),
  `src/lib/format.ts` (the prototype's, plus `formatDateTime` for the build line) + `format.test.ts` (new),
  `src/i18n/pl.ts` (the prototype's words, word for word, `signIn.offline` and `signIn.failed` included, with Decided
  8, 9 and 19 applied: the example's sections stay in `prototype/`) and its `Words` type,
  `src/features/pwa/pwaRegister.ts` and `useServiceWorker.ts` (Overload's: the record, `onNeedReload` records only,
  the hourly and foreground checks, the bare-registration fallback; the update screen's readers dropped) with
  `useServiceWorker.test.tsx` (Overload's, minus the update-screen cases: the standing proof that `onNeedReload`
  records and never reloads),
  `src/hooks/useOnlineStatus.ts` (Overload's), `src/styles/tokens.css` and `src/styles/global.css` (the prototype's;
  the Google `@import` replaced by the two fontsource imports and the `@theme` font names, Decided 4).
- `scripts/check-build.mjs` (new; Decided 16) and `scripts/vercel-ignore.test.mjs` (Overload's; init branch `main`).
- The Fact 4 run, once, recorded in the report (not a standing script): build A, serve `dist/` on 127.0.0.1, open in
  Playwright, wait for the worker; go offline (`context.setOffline(true)`) and reload: the app opens from the cache
  (the goal's "opens offline"); back online, change one visible word, build B into the same folder, call
  `registration.update()`, wait for the new worker's `activated`; assert a sentinel set on `window` before is still
  there (no reload), no console error; reload; the new word shows.

**Lifts (Overload):** `package.json`, `vite.config.ts`, `index.html`, `tsconfig.json`, `tsconfig.app.json`,
`tsconfig.node.json`, `vitest.config.ts`, `vitest.setup.ts`, `vercel.json`, `.gitignore`, `.env.example`,
`.claude/launch.json`, `src/main.tsx`, `src/vite-env.d.ts`, `src/lib/supabase.ts`, `src/lib/queryClient.ts`,
`src/lib/version.ts`, `src/lib/version.test.ts`, `src/features/pwa/pwaRegister.ts`,
`src/features/pwa/useServiceWorker.ts`, `src/features/pwa/useServiceWorker.test.tsx`, `src/hooks/useOnlineStatus.ts`,
`scripts/vercel-ignore.test.mjs`.
**Lifts (prototype):** `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/format.ts`, `src/i18n/pl.ts`.
**Depends on:** nothing. **Prototype screens:** none (the Settings build line's format only).

**Verification**
- `npm run typecheck`, `npm run build`, `node scripts/check-build.mjs` (dist has `skipWaiting`/`clients.claim` in
  `sw.js`; every emitted woff2 is in the precache manifest, at least one per family and the latin-ext file among
  them; no `fonts.googleapis.com` anywhere; no dynamic chunk but workbox-window), `npm test` (`version.test.ts`,
  `useServiceWorker.test.tsx`, `format.test.ts`: Polish date `06.11.2026`, money `12 480,50 zł`, plural
  one/few/many, `formatDateTime`), `node --test "scripts/*.test.mjs"` (`vercel-ignore`), `npm run dev` opens.
- Break proofs, one per call pattern (`cp` backups, never `git checkout --`): remove `skipWaiting: true` → check-build
  fails on `sw.js`; remove one family's fontsource import → check-build fails on that family's precache entries;
  replace `onNeedReload`'s body with `window.location.reload()` → `useServiceWorker.test.tsx` fails; set
  `"version": "x"` → the build refuses (`resolveAppVersion`); add a `React.lazy` route in a scratch copy → check-build
  fails on the extra chunk; put `.md` in the ignore command's exclusions wrongly → `vercel-ignore.test.mjs` fails.
- The Fact 4 run above, its outcome in the report.
- **Would not catch:** a real Vercel deploy (no project yet; Overload's "Checks that lied" 8 and 9 say only a deploy
  finds ESM and env problems; the first app's checklist step 5 is the first real deploy); the worker's behaviour across
  two real deploys (done once by hand here, not standing); the look of anything (no screens yet).

**Done when:** the commands above are green, the six breaks each failed on the right check and were restored, the
Fact 4 run (offline open, no reload, the next open) is in the report with its outcome, and the commit
`chunk 1 complete` is pushed with its PR into `main`.

### Chunk 2 — Migrations and the replay

**Goal:** `supabase/` exists with sign-ups off and e-mail sign-in on, the access list is there, every migration safety
script from Overload runs green on a repo with no migrations and fails on the right things, the sign-ups check exists,
and `migration-replay` runs on every PR into `main`.
**Type · size:** LIGHT · M (Decided 1). **Batch:** B0 with chunks 0 and 1 (shares no file with them: nothing under `src/`, no
`package.json` change; its tests are node-only).

**Scope**
- `supabase/config.toml` (Overload's; `project_id = "starter"`; `[auth] enable_signup = false`; `[auth.email]
  enable_signup = true` with the one-line comment on the trap; `[db] major_version = 17`; `[db.seed] enabled = false`;
  no `[remotes]`, Decided 15), `supabase/.gitignore` (Overload's), `supabase/migrations/.gitkeep`,
  `supabase/access.json` (`{}`), `supabase/postgres-image` (`supabase/postgres:17.6.1.155`).
- `scripts/replay-migrations.sh` (Overload's; image from the file above; zero files is OK when `access.json` is empty,
  exit 2 when it is not, Decided 12; before the first file it applies `scripts/replay-auth-functions.sql` as
  `supabase_admin`, Decided 47; `--keep` and `--snapshot` kept, the snapshot SQL dropped with schema compare),
  `scripts/replay-auth-functions.sql` (the Auth service's `uid()`, `role()`, `email()` and `jwt()` lifted verbatim
  from `supabase/auth` migrations `20220224000811_update_auth_functions.up.sql` and
  `20220531120530_add_auth_jwt_function.up.sql`, the `{{ Namespace }}` placeholder written as `auth`, each with its
  source named in a comment), `scripts/check-migration-order.mjs` + `.test.mjs` (Overload's; the
  `000_v1_baseline.sql` exemption dropped; base `origin/main`; dotfiles such as `.gitkeep` ignored, which the lifted
  check would flag as "not NNN_name.sql"), `scripts/check-migration.mjs`, `scripts/migration-rules.mjs`,
  `scripts/migration-rules.test.mjs` (Overload's, verbatim: the safe list is the whole point and its tests prove it),
  `scripts/check-embeds.mjs` + `.test.mjs` + `scripts/check-embeds-local.sh` (Overload's; Decided 11: a missing
  `src/` is exit 2, zero embeds with at least one file scanned is a pass; `src` only, no `api`),
  `scripts/check-signups.mjs` + `.test.mjs` (new: parses `config.toml` and `access.json`; fails when any key is
  `signed-in` and `[auth] enable_signup` is not `false` (a missing key means on, Supabase's default); fails when
  `[auth.email] enable_signup` is `false` whatever the tables, Decided 31; `[auth.sms] enable_signup = false` is not
  a hit (a near-miss fixture); passes otherwise; the TOML read is the keys by regex within their sections, no TOML
  dependency), `.github/workflows/migration-replay.yml` (Overload's; `branches: [main]`; the order check, the replay,
  the embeds; chunk 3 adds its steps).

**Lifts (Overload):** `supabase/config.toml`, `supabase/.gitignore`, `scripts/replay-migrations.sh`,
`scripts/check-migration-order.mjs`, `scripts/check-migration-order.test.mjs`, `scripts/check-migration.mjs`,
`scripts/migration-rules.mjs`, `scripts/migration-rules.test.mjs`, `scripts/check-embeds.mjs`,
`scripts/check-embeds.test.mjs`, `scripts/check-embeds-local.sh`, `.github/workflows/migration-replay.yml`.
**Lifts (Supabase Auth, `supabase/auth`):** `migrations/20220224000811_update_auth_functions.up.sql`,
`migrations/20220531120530_add_auth_jwt_function.up.sql`.
**Depends on:** built beside chunk 1 and merged after it; its embeds check needs chunk 1's `src/` (Decided 43).
**Prototype screens:** none.

**Verification**
- `node --test "scripts/*.test.mjs"` green (migration-rules, order, embeds, signups); `node scripts/check-migration.mjs
  origin/main` → "no migration changes", exit 0; `node scripts/check-migration-order.mjs origin/main` → OK with zero
  files (`.gitkeep` ignored); `node scripts/check-signups.mjs` → ok; `node scripts/check-embeds.mjs --list` → on the
  branch, exit 2 "no src/ to scan" (expected until chunk 1 merges), and after the rebase zero embeds, exit 0 (Decided
  43); `bash scripts/replay-migrations.sh` → the auth functions applied, "0 of 0 applied, access list empty" where
  Docker can pull, else the PR's `migration-replay` run read and quoted (Decided 27; the builder starts `dockerd
  --iptables=false --ip6tables=false &` first and reports what the pull answered).
- Break proofs, one per rule: a scratch `access.json` with a `signed-in` key and `enable_signup = true` → check-signups
  fails, and with the `[auth] enable_signup` line deleted → fails too, while `[auth.sms] enable_signup = false` alone
  passes; `[auth.email] enable_signup = false` → fails; a scratch migration with `alter table x drop column y` →
  `classify` flags it (the lifted test); two files sharing `002_` → the order check flags; a scratch `access.json`
  with a key and no migration → the replay exits 2; a scratch migration calling `auth.jwt()` → the replay applies it
  (the functions are there); the workflow: after the rebase on chunk 1's merge, the PR shows a `migration-replay` run
  that ran all three steps and passed on zero migrations.
- **Would not catch:** a migration that is on the safe list but wrong in meaning (the rules check data safety only,
  as Overload's comment says); the image tag's truth until the checklist sets it from the app's project; **production's
  sign-up setting** (Fact 3: `config.toml` does not reach the hosted project; the checklist's step 2 and its probe do);
  the sign-ups rule for an app whose tables are all `own` (then sign-ups on is allowed by SPEC Rule 5 and the check
  stays silent by design); the Auth service's function bodies moving with its versions (the replay applies today's).

**Done when:** the scripts and tests above are green on the branch (the embeds check after the rebase), the breaks
each failed on the right check, the PR's `migration-replay` run passed after the rebase, and `chunk 2 complete` is
pushed with its PR into `main`.

### Chunk 3 — verify-rls on the replay

**Goal:** every table in the access list is checked by its kind against a real replayed Supabase Postgres with two
signed-in users and a signed-out visitor, RLS and grants included, on every PR; the script proves itself on a fixture of
three tables and fails loudly when the list and the code or the migrations disagree.
**Type · size:** DATA · L (Decided 1). Its own reviewer (Opus, max).

**Scope**
- **First proof, Fact 1 as verified in planning (Facts 1):** on the replay, PostgREST connected as `authenticator`
  with a `PGRST_JWT_SECRET`, a token with `role: authenticated` and `sub: <uuid A>` reads the fixture's `own` rows of
  A and not B's, B's token the reverse, the `role: anon` token is refused (42501); and the same probes with the
  harness's auth-functions step skipped read **empty for everyone** (the image's 2021 `auth.uid()`), which the
  "owner sees ≥ 1 own row" rule must report as a FAIL. The builder re-runs both and reports them; a decision card
  only if the real image behaves differently from this session's run.
- `scripts/replay-tokens.mjs` (new; Node `crypto` HS256; `anon`, and one `authenticated` token per user id, `aud`
  `authenticated`, one-hour `exp`), `scripts/verify-rls-replay.sh` (new, from `check-embeds-local.sh`'s shape:
  `replay-migrations.sh --keep` (chunk 2's script, which applies chunk 2's `replay-auth-functions.sql` first; this
  chunk adds its `--fixture` flag, which also replays `scripts/verify-rls-fixture/migrations/` and `seed.sql`); then
  as `supabase_admin` `alter role authenticator with password`; PostgREST from `postgrest/postgrest:v12.2.3`
  connected as `authenticator` with the secret, `PGRST_DB_ANON_ROLE=anon`, `PGRST_DB_SCHEMAS=public`; then
  `verify-rls.mjs` against it; psql queries for "RLS on" (`pg_class.relrowsecurity`) and the grants
  (`information_schema.role_table_grants`) per listed table; a check of its own that `safeupdate` is on in the
  session (the proof it runs as `authenticator`); cleans up).
- `scripts/verify-rls.mjs` (Overload's, generalized): the lists replaced by `supabase/access.json` (the fixture's with
  `--fixture`); the client from URL + anon token + a user's token in `global.headers`; per kind: `own` → as B, a
  head-only server-side count of rows not B's (Overload's count, never fetched rows) must be 0 and as A the own-rows
  count ≥ 1 (the fixture guarantees rows, so "0 rows" cannot pass vacuously); `signed-in` → as B the count of A's rows
  ≥ 1, as anon zero rows or permission denied; `public` → as anon count ≥ 1; every kind: RLS on and the grants as
  Decided 14 (owner's own-rows 42501 = FAIL); FAIL on any other error, exactly Overload's "could not ask ≠ refused";
  `verify-rls.test.mjs` (Overload's `classifyProbe` tests, per kind). `scripts/verify-rls-list.test.mjs` (Overload's
  `verify-rls-tables.test.mjs` and `verify-rls-ahead.test.mjs` as one file: every literal `.from()` in `src/` has a
  key; every key without the `ahead` marker is used by a `.from()` or an embed (Overload's parser: embeds in select
  strings; its `v2_apply_ops` op shapes are not lifted); every key with `ahead` is used by nothing yet and the test
  fails once a `.from()` names it until the marker goes (Decided 41); every `create table`/`create view` in
  `supabase/migrations/` has a key and every key is created there; dynamic `.from(variable)` calls are listed by name
  as Overload lists its two; with everything empty the test asserts zero on all counts and proves the scanners on
  fixture sources, S3).
- `scripts/verify-rls-fixture/`: `migrations/001_fixture.sql` (three tables `fx_own`, `fx_shared`, `fx_public` with
  `user_id references auth.users`, RLS enabled, the policies each kind needs (`own`: `for all using (user_id =
  auth.uid()) with check (…)`, Overload's 002; `signed-in`: `for select to authenticated using (true)` and writes
  with `user_id = auth.uid()`; `public`: `for select using (true)`), `grant select` to `authenticated` and, for
  `fx_public`, to `anon`, after a `revoke all` on every table so no grant is left to the default privileges, and
  `fx_own`/`fx_shared` keep nothing for `anon` (Decided 39)), `access.json` (the three kinds), `seed.sql` (two
  `auth.users` rows A and B, rows for both in each table).
- `.github/workflows/migration-replay.yml` (chunk 2's file, edited here while chunk 2 may still be under review: a
  rebase is expected if B0 changes it): two steps added: `verify-rls-replay.sh --fixture` (the self-test, always)
  and `verify-rls-replay.sh` (the app's list; in the starter "0 tables, list empty, no `.from()` in src", a pass).

**Lifts (Overload):** `scripts/verify-rls.mjs`, `scripts/verify-rls.test.mjs`, `scripts/verify-rls-tables.test.mjs`,
`scripts/verify-rls-ahead.test.mjs`, `scripts/check-embeds-local.sh` (as the shape of the replay wrapper),
`supabase/migrations/002_v2_rls_policies.sql` (the policy shape for `own`), `000_v1_baseline.sql` (the grant lines),
`048_p121_release_state_and_deletes.sql` (the `revoke all` then `grant select` shape for a public table).
**Depends on:** chunk 2 (branches off 2's branch beside B0's review; rebases on `main` after 2 merges; adds files,
and edits two of chunk 2's: the workflow and the replay script's `--fixture` flag).
**Prototype screens:** none.

**Verification (DATA: one break proof per place that writes or decides)**
- `bash scripts/verify-rls-replay.sh --fixture` → 3 tables, every probe PASS, "RLS on" and grants listed; `bash
  scripts/verify-rls-replay.sh` → 0 tables, pass with the empty-list line; `node --test "scripts/*.test.mjs"` green;
  the PR's `migration-replay` run shows both steps green. Where the image cannot be pulled in the session, every proof
  below runs through the PR's run (Decided 27; Q1 says what that costs) and the report says so.
- Break proofs on scratch copies of the fixture (restore from `cp`): (1) `alter table fx_own disable row level
  security` → LEAK on `own` (B's foreign count 2; dropping the policy instead hides every row and gives the owner
  FAIL, which is the other guard); (2) `revoke select on fx_own from authenticated` → the owner probe FAILS with
  42501, never PASS (a `grant` line removed changes nothing: the default privileges stay); (3) give `fx_shared` the
  `own` policy → the `signed-in` probe FAILS (B cannot see A's rows); (4) `using (true)` plus `grant select … to anon`
  on `fx_own` → the signed-out probe LEAKS; (5) `revoke select on fx_public from anon` → FAIL (not a silent pass);
  (6) a key in `access.json` that no migration creates → the list test fails; (7) a `.from('x')` in a scratch
  `src/` file with no key → the list test fails; (8) a wrong JWT secret → every signed-in probe FAIL, none PASS;
  (9) the auth-functions step skipped → the owner probes FAIL on "0 own rows" (never PASS); (10) PostgREST
  connected as `postgres` instead of `authenticator` → the harness's own check fails (`safeupdate` unset in the
  session), because the replay must run as the role a hosted project runs.
- **Would not catch:** the hosted project's actual policies when they differ from the repo's SQL (the replay checks
  the repo; Overload ran verify-rls on staging for the live side, which the client-ready build's staging scripts bring
  back); the Auth service's function bodies moving with its versions (the replay applies today's; the staging check
  will see the real ones); **a migration that leans on the default privileges instead of writing its grants:** it
  passes the replay (the image grants ALL to `anon` and `authenticated` on every new table) and answers 42501 on a
  project where `auto_expose_new_tables` is off (Overload's 042 comment); the stack skill's rule is "every grant in
  the migration"; functions (`security definer` RPCs are not probed; Overload's note on `v2_apply_ops`); grants
  narrower than `select` (insert/update/delete are not probed); column-level privileges; a policy that is right for
  `auth.uid()` but wrong for a future `role` kind.

**Done when:** both replay runs and every test are green, the ten breaks each failed on the right probe and were
restored, the first proof's two runs are in the report, the workflow's two new steps passed on the PR, and
`chunk 3 complete` is pushed with its PR into `main`.

### Chunk 4 — Sign-in, the app frame and Settings

**Goal:** the app a new project opens as: sign in with no "create an account", the frame with the side menu on wide
screens and Overload's tab bar on phones switching at 900 px of the app's own width, the offline strip, Settings with
the account, the theme and the build line; the theme follows the device by default.
**Type · size:** LIGHT · L. **Batch:** B1 with chunk 5.

**Scope**
- `src/components/Button.tsx`, `fields.tsx` (`TextField`, `SelectField`, `TextArea` and the shared label/hint/error
  shell), `Badge.tsx`, `OfflineStrip.tsx`, `InlineError.tsx`, `src/lib/cx.ts` (the prototype's `ui.tsx`, one file per
  component, Decided 21), `src/lib/useWide.tsx` (the prototype's `WidthRoot`, `useWide`, `WIDE_FROM = 900`; the frame
  element also becomes the overlay target chunk 6 uses, through the same context).
- `src/shell/AppShell.tsx` (the prototype's `Shell.tsx`: side menu with the app's name tile, the signed-in line and
  its own Wyloguj się button, wired to `authService.signOut` with the same pending state as Settings'; Overload's
  `Nav.tsx` tab bar: `NavLink`, icon over label, the lit tab in the accent, safe-area padding; labels in sentence
  case; the install prompt and the Coach gate dropped), `src/shell/PageHeader.tsx` (the prototype's),
  `src/shell/tabs.ts` (Decided 25: Settings only).
- `src/features/auth/useAuth.tsx` (Overload's: the context, `getSession`, `onAuthStateChange` clearing the query cache
  on a user change; Dexie's wipe dropped) with Overload's `useAuth.signOut.test.tsx` (sign out first, then clear the
  cache; a user change clears it), `src/features/auth/authService.ts` (new: `signIn(email, password)` and `signOut()`
  around `supabase.auth`; `signIn` classifies a resolved `{ error }` or a thrown fetch failure as `wrong`, `offline`
  or `failed` with the reason and throws it, Decided 7 and 24) with `authService.test.ts` (a bad-credentials
  `{ error }` → `wrong`; a fetch `TypeError` and `navigator.onLine === false` → `offline`; any other `{ error }` →
  `failed` with its message; a success resolves), `src/features/auth/LoginPage.tsx` (the prototype's `SignIn.tsx`
  layout with Overload's submit flow: pending disables, the three lines of Decided 24, never the raw message alone,
  no sign-up control; the tile, the words from `pl.ts`).
- `src/features/settings/useTheme.ts` (Decided 23) and `SettingsPage.tsx` (the prototype's `Settings.tsx`: Account
  row with the e-mail and Wyloguj się, the theme radio group, the build line through `t.settings.buildLine`, Decided 8;
  Overload's `SettingsPage.tsx` ACCOUNT and APPEARANCE sections are the lifted behaviour: sign-out's pending state and
  the theme applied through `<html>`).
- `src/App.tsx` (Overload's shape: `AuthProvider`, `BrowserRouter`, exported `AppRoutes`; `WidthRoot` at the top of
  `AppRoutes`, above everything that follows, Decided 45; the loading spinner through tokens, S22; signed out →
  `LoginPage` on every path; signed in → `AppShell` with the offline strip as its banner (`useOnlineStatus`) → routes
  from `tabs.ts`, `/` and `*` to the first tab; the theme applied above everything).
- Tests (jsdom per file, Overload's docblock way): `LoginPage.test.tsx` (a `wrong` shows `t.signIn.wrong`; an
  `offline` shows `t.signIn.offline`; a `failed` with reason "x" shows `t.signIn.failed` and `Powód: x`; the raw
  message never appears alone; pending disables both fields and the button; no sign-up control exists),
  `AppShell.test.tsx` (`data-layout` is `phone` at 899 and `desktop` at 900 through a stubbed `ResizeObserver` and
  `clientWidth`; the one tab renders; the lit tab carries `aria-current`), `useTheme.test.ts` (writes and reads the
  key; `system` removes `data-theme`; a storage that throws leaves `system` and does not crash),
  `SettingsPage.test.tsx` (the radio writes the theme; the build line reads the four defines; sign-out calls the
  service and shows the pending word), `App.test.tsx` (Overload's shape: signed out shows the sign-in page on `/x`,
  rendered inside `[data-layout]`; signed in `/` goes to `/settings`; `*` too).

**Lifts (Overload):** `src/components/Nav.tsx`, `src/components/Nav.test.tsx` (shape), `src/features/auth/useAuth.tsx`,
`src/features/auth/useAuth.signOut.test.tsx`, `src/features/auth/LoginPage.tsx` (the flow),
`src/features/settings/SettingsPage.tsx` (ACCOUNT, APPEARANCE), `src/App.tsx` (the shell shape, the spinner),
`src/App.test.tsx` (shape).
**Lifts (prototype):** `src/components/ui.tsx`, `src/lib/useWide.tsx`, `src/shell/Shell.tsx`, `src/screens/SignIn.tsx`,
`src/screens/Settings.tsx`.
**Depends on:** chunk 1 (merged). **Prototype screens:** Sign-in (normal, wrong password, offline, signing in); App
frame, new
app (signed in); Settings (normal); each at 390 and 1280 px, light and dark.

**Verification**
- The tests above, one break per call pattern: the error mapping (show the raw message alone → the test fails; map
  `offline` to the wrong-password line → fails), the service (return the `{ error }` instead of throwing →
  `authService.test.ts` fails and the sign-in test shows no line; classify a fetch failure as `wrong` → fails), the
  900 px switch (`WIDE_FROM` 901 → the 900 case fails), the sign-in page outside `WidthRoot` → the `[data-layout]`
  case fails, the theme write (skip the write → fails), the cache clear on sign-out (skip it → the lifted test fails),
  the route redirect.
- `npm run typecheck`, `npm run build`, `node scripts/check-build.mjs`, `npm test`; chunk 5's three checks run on the
  merged tree at the batch review (a hit there is chunk 4's to fix in the rebase, not the check's).
- **Would not catch:** a real Supabase sign-in (no project; the first app's checklist step 5 is the first real one),
  including the exact shape of supabase-js's error objects the classification reads (asserted on fixtures that copy
  supabase-js's own classes); layout at real widths (jsdom has no layout; chunk 8's kit check and the release
  comparison do); safe-area insets on a real phone; the offline strip's timing on a real connection loss.

**Done when:** tests and build green, the nine breaks failed and were restored, and `chunk 4 complete` is pushed
with its PR into `main`.

### Chunk 5 — The code checks: tokens, words, no database in screens, no prototype imports

**Goal:** SPEC Rules 2 and 4 and BUILD.md's Tasks rule 10 become checks: a typed-in colour, text size or radius fails;
a word shown on screen that is not from the words file fails; a database call outside service and hook files fails;
an import from `prototype/` in `src/` fails.
**Type · size:** LIGHT · M. **Batch:** B1 with chunk 4 (built after chunk 3's review ends; shares no file with 4).

**Scope**
- `scripts/check-wording.test.mjs` (Overload's scanner and call-pattern tests lifted; `FAMILIES` empty with the
  starter's note; the call-pattern tests run with a stand-in family so the scanner stays proven; **the words rule**
  per Decided 10, with its own call-pattern tests: every string the scanner reads as words (JSX text with a letter; a
  literal or template piece that is not code-like by Overload's `looksLikeCode`; every text-attribute value) is a hit
  outside `src/i18n/`; passes: punctuation-only text, `{t.x.y}` expressions, `className`, `data-*`, query arguments,
  imports, types, one-token lowercase identifiers; `src/i18n/` and test files not scanned; an `ALLOWED` list with
  reasons, holding the developer-facing messages (`supabase.ts`'s missing-env error, `version.ts`'s refusal) and
  failing on a stale entry).
- `scripts/check-tokens.test.mjs` (new): over `src/**/*.{ts,tsx,css}` except `tokens.css`: Tailwind arbitrary values
  for colour, text size and radius (`bg-[#…]`, `text-[#…]`, `border-[#…]`, `text-[Npx|rem]`, `rounded-[…]`,
  `shadow-[…]`), inline `style` with `color`/`background`/`fontSize`/`borderRadius` literals, any hex, `rgb(`, `hsl(`
  in CSS or TSX; passes: widths, heights, paddings, margins, gaps and percentages ("layout widths may be typed in"),
  `var(--…)`, `env(…)`, `calc(…)`; an `ALLOWED` list with reasons, empty at first.
- `scripts/check-screens-no-db.test.mjs` (new): `.from(` (with Overload's `(?<!Array|Buffer)` lookbehind), `.rpc(`,
  `supabase.` allowed only in files matching Decided 7 (`*Service.ts`, `use*.ts`, `use*.tsx`, `lib/supabase.ts`);
  every other file under `src/` fails; and no `src/` file imports a path containing `prototype/` (Tasks rule 10).
- Each file: fixture call-pattern tests (one source per way a hit can occur, beside the near-misses that must pass:
  `Array.from(…)` in a `.tsx`, `supabase.auth.getSession()` in `useAuth.tsx`, a `confirmLabel={t.a.b}` prop, a
  lowercase one-token id) and a tree test with a "the scan read the tree" guard (at least five scanned files, true
  from chunk 1's tree on).

**Lifts (Overload):** `scripts/check-wording.test.mjs` (the scanner: `scanSourceFull`, `isScanned`, the attribute
lists, `looksLikeCode`, `isQueryArgument`, the call-pattern tests, the ALLOWED mechanism and its "no stale entry" test).
**Depends on:** chunk 1. **Prototype screens:** none.

**Verification**
- `node --test "scripts/*.test.mjs"` green on the branch (chunk 1's tree). Break proofs on scratch copies: plant
  `text-[13px]`, `bg-[#f00]`, `style={{ color: '#f00' }}`, a hex in `global.css` → tokens fails on each; plant JSX
  "Zapisz", `placeholder="Szukaj"`, `{saving ? 'Zapisywanie…' : 'Zapisz'}`, `confirmLabel="Usuń"`,
  `toast.show('Zapisano')` and `{ label: 'Klienci' }` → words fails on each, while `<p>·</p>`, `placeholder={t.a.b}`
  and `kind: 'own'` pass; plant `supabase.from('x')` in a `.tsx` and in `foo.ts` → no-db fails on each, while
  `fooService.ts`, `useFoo.ts`, `useFoo.tsx` and `Array.from(rows)` pass; plant
  `import x from '../../prototype/src/demo/demoStore'` → fails.
- At the batch review: all three on the merged tree with chunk 4 → zero hits.
- **Would not catch:** a colour or word computed at runtime (`style={{ color: v }}`, a word joined from pieces); a
  one-token lowercase Polish word (`'klient'` reads as code by Overload's rule); a word placed in the words file under
  a wrong key (the file is not scanned); a hex inside an SVG file; a table name reaching `.from()` through a variable
  (the list test names dynamic calls); a developer message allowed by `ALLOWED` that later reaches a screen.

**Done when:** the three tests are green, every planted break failed on its check, the batch review ran them on the
merged tree, and `chunk 5 complete` is pushed with its PR into `main`.

### Chunk 6 — Panel, ConfirmDialog, Table, Toast and the list patterns

**Goal:** the overlay and list components every client screen uses, lifted from Overload where Overload has them and
from the prototype otherwise, with Overload's tests adapted.
**Type · size:** LIGHT · L. **Batch:** B2 with chunk 7.

**Scope**
- `src/components/Panel.tsx`: Overload's `BottomSheet.tsx` **whole** (the portal, focus into the sheet and back to the
  opener, the Tab ring, the counted page scroll lock, stacking by document order, Escape to the top sheet only, an
  Escape already handled left alone, `role="dialog"` named by the title, the handle/eyebrow/title/close/content/footer
  frame, `height` and `toolbar`), with its inline style values turned into token classes (the prototype's `overlays.tsx`
  Panel for the look), the portal target from the frame's context (Decided 6), and on wide screens the side panel
  from the right with the same parts in the same order (the prototype). The stacking, Escape, Tab-ring and focus
  logic is lifted into one shared module (`src/components/overlay.ts`: the `data-overlay` marker, "the last drawn
  owns the keys", the counted scroll lock) that Panel, ConfirmDialog and Toast use (Decided 6). `Panel.test.tsx`:
  Overload's `BottomSheet.test.tsx` (35 tests) adapted: "drawn straight into the body" becomes "into the frame's
  overlay root"; a new pair asserting the desktop and phone shapes carry the same parts in order.
- `src/components/ConfirmDialog.tsx` (Overload's props and layout: centred, 380 px at most, the two buttons side by
  side, red when `danger`, `pendingLabel`; tokens; the labels come from the caller, as the prototype's does; drawn
  through the overlay module, so it takes focus, owns Escape (cancel) and keeps Tab inside while it is the top
  overlay) + `ConfirmDialog.test.tsx` (Overload's five tests, plus one that stacks it over an open Panel: Escape
  cancels the dialog and leaves the panel open, Tab stays in the dialog, closing it returns focus to the panel).
- `src/components/Table.tsx` (the prototype's: columns, skeleton rows while `loading`, row click, `aria-busy`, scrolls
  sideways inside its own box) + test; `src/components/Toast.tsx` (the prototype's look, drawn inside the frame) with
  `src/features/notifications/toastStore.ts` (Overload's) + test (shows, clears after 3 s); `EmptyState.tsx`,
  `LoadError.tsx` (InlineError with `t.common.loadFailed(what)` and `t.common.reason`, plus a retry Button),
  `ListRows.tsx` (the phone rows with skeleton rows while loading), from the prototype's `Clients.tsx` states, Decided
  18, each with a small test.

**Lifts (Overload):** `src/components/BottomSheet.tsx`, `src/components/BottomSheet.test.tsx`,
`src/components/ConfirmDialog.tsx`, `src/components/ConfirmDialog.test.tsx`, `src/features/notifications/toastStore.ts`,
`src/features/notifications/Toast.tsx` (the timing).
**Lifts (prototype):** `src/components/overlays.tsx`, `src/components/Table.tsx`, `src/components/ui.tsx` (Toast), the
empty/loading/couldn't-load/row parts of `src/screens/Clients.tsx`.
**Depends on:** chunk 4 (Button, InlineError, `useWide`, the frame context). **Prototype screens:** none directly (the
Klienci and Klient form states exercise every one of these in chunk 8; the Design system page shows them).

**Verification**
- The adapted BottomSheet tests (portal target, focus, scroll lock, stacking, Escape, Tab ring, content taller than the
  screen), ConfirmDialog's five plus the stacked one, Table (six skeleton rows while loading, zero otherwise;
  `onRowClick` gets the row; `aria-busy`), Toast (clears at 3 s with fake timers), EmptyState/LoadError (the reason
  line reads `Nie udało się wczytać: listy klientów. Powód: …`), ListRows; one break per call pattern (the portal
  target → render into `document.body` and watch the frame test fail; the dialog outside the overlay module → the
  stacked test fails on Escape; the scroll lock count; the retry callback). The real-width behaviour inside the phone
  frame is chunk 8's PHONE FRAME pass.
- `npm run typecheck`, `npm run build`, `check-build`, the three code checks from chunk 5 on the branch.
- **Would not catch:** touch behaviour on a real phone; sideways scroll inside the table at real widths (chunk 8's
  clipping check does); the dark theme's look (chunk 8's screenshots and the release comparison do).

**Done when:** every test above is green, the breaks failed and were restored, the chunk 5 checks report zero hits,
and `chunk 6 complete` is pushed with its PR into `main`.

### Chunk 7 — Skills: `stack` and `estimate`, with the cost table

**Goal:** two of the three skills, each with an exact trigger, their content lifted: the stack's conventions and the
estimate's method.
**Type · size:** LIGHT · M. **Batch:** B2 with chunk 6 (built beside B1's review; shares no file with 6).

**Scope**
- `.claude/skills/stack/SKILL.md` (trigger in its description: "when writing or changing files under `src/` or
  `supabase/`", nothing else): data in service and hook files (Decided 7, SPEC Rule 4); tokens only (SPEC Rule 2, the
  tokens check's rules); the words file (functions for counts, the `Words` type, the words check's rules); online-only
  saving (SPEC Rule 3, with the example's pattern); the access kinds and `access.json` (Rule 6; the three policy and
  grant shapes from chunk 3's fixture); migrations (forward-only, destructive ones to Adam, `check-migration`, the
  numbering rule from `check-migration-order`, the replay and its image file, how to start Docker in a session);
  vite-plugin-pwa's settings and why (`onNeedReload`, no lazy chunks, `check-build`); Supabase RLS and grants (the
  verify-rls kinds, "permission denied on the owner is a FAIL"); TanStack Query owns server data, Zustand owns UI state;
  where Recharts fits (an app adds it; the vendor chunk line to add); Vercel's ignore command. Sources: the GENERAL-CODE
  lines of the appendix (each quoted with its RULES.md line) and SPEC's rules; a `reference.md` beside it holds the
  longer lifted rules verbatim when a line does not fit a sentence.
- `.claude/skills/estimate/SKILL.md` (trigger: "when writing the estimate section of TASKS.md"): the method as this
  file's "Estimate" applies it: chunk by chunk from the cost table's type figures, hours, dollars and weekly % per
  chunk, the next builder beside a review where files allow, sizes stated as risk, never a pace, the start state of
  the week and the 5-hour window, a pause only when likely, what is outside the figure; Overload's L13, L16, L18, L19,
  L26, L27, L29 as the reasons.
- `scripts/cost-table.md` (Overload's, verbatim, with a first line saying it is lifted from 1.2.1's close and is
  replaced at this build's close), `scripts/check-skills.test.mjs` (new: every `.claude/skills/*/SKILL.md` has a
  front-matter `description` naming a trigger, none contains "always"/"ALWAYS", Decided 35).

**Lifts (Overload):** `RULES.md` (the GENERAL-CODE lines of the appendix, by line number), `scripts/cost-table.md`,
`LEARNINGS.md` (L13, L16, L18, L19, L26, L27, L29), `scripts/verify-rls.mjs` (the comments on counting server-side and
on permission denied, as the RLS section's wording), `vite.config.ts` (the PWA comment).
**Depends on:** chunks 2 and 3 merged; chunk 5's rules as this file states them (chunk 5 merges before 7 does, in
B1; B2's review checks the skill against the merged checks); this file's appendix. **Prototype screens:** none.

**Verification**
- `node --test "scripts/*.test.mjs"` (check-skills green); break: write "ALWAYS invoke" into a description → fails;
  remove a description → fails. Content: the reviewer checks each rule cites its source line or SPEC item and that no
  Overload-only term (meso, mesocycle, Coach, Northstar, `v2_`, staging account) is in either skill (a grep in the
  report).
- **Would not catch:** whether the skill triggers in a session (only use shows; the first app's build is the test);
  whether a lifted rule is right (it was right for Overload; the sort is the judgement).

**Done when:** the test is green, the two breaks failed, the grep is clean, every rule has a source, and
`chunk 7 complete` is pushed with its PR into `main`.

### Chunk 8 — The prototype kit, and the `prototype` skill

**Goal:** `prototype/` runs the starter's real screens on fake data with Overload's kit (the swap plugin, the cache
seed, the DEMO menu with the phone frame and the "New app" state, the clipping check at both widths and themes),
keeps the Klienci list and form inside `prototype/` as the worked example of a screen on fake data, keeps the frozen
prototype's screenshots as the release reference, and documents itself.
**Type · size:** LIGHT · L. **Batch:** B3 with chunks 9 and 10 (built after B2 merges).

**Scope**
- **First, the reference** (Decided 2): a `git worktree` of the first commit; in its `prototype/`, `npm ci`, the
  updated `check/clipping.mjs` (every state, both themes) and `bash check/run.sh`; the shots copied to
  `design/0.1/prototype/` and committed (20 states × 2 widths × 2 themes = 80 PNG).
- Then the kit: `prototype/vite.config.ts` (Overload's `fakeDataLayer` plugin: `REPO` resolved to its real path (L4),
  `SWAPS` = `lib/supabase.ts` → `fakes/supabase.ts` (the pending proxy), `features/auth/useAuth.tsx` →
  `fakes/useAuth.tsx`, `features/auth/authService.ts` → `fakes/authService.ts` (sign-in resolves, rejects or stays
  pending by the DEMO state), `hooks/useOnlineStatus.ts` → `fakes/useOnlineStatus.ts`, `features/settings/useTheme.ts`
  → `fakes/useTheme.ts` (the demo store's theme); `OVERRIDDEN` empty (L5: each spec chat starts it empty); the `@app`
  alias; the four defines; the single-file build), `prototype/override.mjs`, `inline.mjs`, `index.html`,
  `tsconfig.json` (Overload's), `prototype/src/index.css` (the L6 restatement, importing `../../src/styles/*`),
  `prototype/src/main.tsx` (seed, then render), `prototype/src/App.tsx` (the DEMO button and menu around the real
  `AppRoutes` under `MemoryRouter`; no second `WidthRoot`, `AppRoutes` carries its own (Decided 45); the phone frame =
  the zip's App frame around it; the example screens mounted as extra routes the DEMO menu reaches),
  `demo/DemoMenu.tsx` and `demo/demoStore.ts` (the zip's as amended on 2026-11-06, Overload's lifted: the 20 states,
  THEME, WIDTH → PHONE FRAME, the "New app: what you get" state, the example labels; **each state carries an
  `expect`**, a text or a selector, Decided 46: the wrong-password line, the offline line, nine rows, the empty line, six skeleton rows, the reason line, the offline
  strip, the toast, the form's title, the field error, the saving word, the failed line, the needs-connection line,
  the dialog's title, one tab, the theme radio, the design page's heading),
  `demo/seed.ts` (the Klienci fixture into the real query cache under the example hook's key; `retry: false`),
  `examples/clients/` (the zip's `Clients.tsx` and `ClientForm.tsx` rewired to `src/` components, `useClients.ts`
  subscribing to the cache (Decided 34), `clientsService.fake.ts` whose save resolves, rejects or stays pending by the
  DEMO state, `fixtures.ts`), `examples/words.ts` (Decided 19), `screens/DesignSystem.tsx` (the zip's, rewired),
  `check/run.sh` and `check/clipping.mjs` (the zip's; every state screenshotted in both themes; each state's `expect`
  asserted after it is applied; the three sign-in states (wrong password, offline, signing in) driven by filling
  the fields and submitting; a PHONE FRAME
  pass at the 1280 px viewport with WIDTH → PHONE FRAME on, asserting for the panel, dialog and toast states that the
  overlay's box lies inside the frame's box; `findClipped` moved into `check/clipped.mjs` as a module), `README.md`
  (Overload's, rewritten for the starter: how it works, the commands from the root, "publish only after a clean run and
  look at the screenshots"), the zip's `package.json`/`package-lock.json` removed (Decided 20); root `package.json`
  gains `proto:check`.
- Layout-only fixes in `src/` components that the check finds (a clipped row, a wrapped button at 390 px), each
  listed in the report (Decided 48); a behaviour change stays a decision card.
- `.claude/skills/prototype/SKILL.md` (trigger: "when building or changing anything under `prototype/`"): the README's
  content, L1 (every state checked in a real browser at phone size and both themes before Adam sees it), L4 (the swap
  plugin, the real-path trap, the cache subscription), L6 (the host page's unlayered styles), the check before
  publishing, the example screens' labels ("Example screen, not in the starter"), where the environment's Playwright
  is (Decided 5).

**Lifts (Overload):** `prototype/vite.config.ts`, `prototype/override.mjs`, `prototype/inline.mjs`,
`prototype/src/index.css`, `prototype/src/main.tsx`, `prototype/src/App.tsx` (the DEMO button and menu placement;
not its hand-built shell, Decided 3), `prototype/src/demo/seed.ts`
(the shape), `prototype/src/fakes/supabase.ts`, `prototype/src/fakes/useAuth.tsx`, `prototype/src/fakes/useOnlineStatus.ts`,
`prototype/README.md`, `LEARNINGS.md` (L1, L4, L5, L6).
**Lifts (prototype, the zip):** everything under `prototype/` as committed: `src/demo/*`, `src/screens/Clients.tsx`,
`src/screens/ClientForm.tsx`, `src/screens/DesignSystem.tsx`, `src/App.tsx` (the phone frame), `check/*`, `inline.mjs`.
**Depends on:** chunk 6 merged (Panel, Table, Toast, EmptyState, LoadError, ListRows), chunk 4. **Prototype screens:**
all 20 DEMO states (the kit must show every one, both widths, both themes).

**Verification**
- `npm run proto:check` exits 0: no page errors, no clipping at 390 and 1280 px in light and dark, every state's
  `expect` met, the PHONE FRAME pass green, 80 screenshots in `prototype/check/shots/`, the DEMO menu lists 20
  states and every entry has an `expect` (both asserted in `clipping.mjs`'s output).
- `scripts/check-screens-no-db.test.mjs` (chunk 5) on `src/` still zero (the kit imports from `src/`, never the
  reverse); a new node test `prototype/check/kit.test.mjs`: `prototype/src` holds no copy of a `src/components`,
  `src/shell` or `src/styles` file (the kit renders the real ones), and the swap list names exactly the five modules.
- Break: remove the `lib/supabase.ts` swap → the page throws at load (`supabase.ts` refuses without env), a page
  error the check reports, proving the swap is load-bearing; remove the cache subscription in `useClients` → the
  Full state's `expect` (nine rows) fails; blank one state's `expect` → the kit test fails; move the transform off the
  overlay root in a scratch copy → the PHONE FRAME pass fails on the panel's box.
- The reference set exists: 80 files in `design/0.1/prototype/`, taken from the planning commits' prototype (the commit
  id in the report).
- **Would not catch:** differences from the published page "Starter Prototype" (Adam's reference; the committed source
  is this plan's); behaviour the fakes cannot show (a real sign-in); drift between the real app and the kit outside
  `AppRoutes` (inside it they are the same components under the same `WidthRoot`; outside it the real `App` draws
  nothing, only providers and the service-worker hook).

**Done when:** the check is clean, the kit test and the chunk 5 checks are green, the two breaks failed and were
restored, the reference set is committed, the README and the skill are in, and `chunk 8 complete` is pushed with its
PR into `main`.

### Chunk 9 — Agent definitions and the repo files

**Goal:** the starter's own `.claude/agents/`, RULES.md's folds from the appendix, NEXT.md's add-on list, and the
test that keeps the definitions general. (RULES.md's standing sections and the record files are chunk 0's.)
**Type · size:** LIGHT · M. **Batch:** B3 with chunks 8 and 10 (built beside B2's review; shares no file with 6, 7, 8,
10).

**Scope**
- `.claude/agents/builder.md`, `reviewer-data.md`, `reviewer-light.md` (Overload's, generalized): the build's name,
  the base branch, the default branch and whether the app has staging are read from `CONTEXT.md` "Repo facts" (three
  lines with fixed labels: `Base branch:`, `Default branch:`, `Staging:`), never written into the definition; staging
  steps (the staging check, the smoke, the re-seed) apply only when `Staging: yes`; "1.2.1", `master`, `staging`,
  Overload's script lists (`check-frozen-code`, `check-program-exercise-reads`, `probe-live-columns`,
  `textOnAccent.static.test.ts`, `check-sheet-overflow`, the parity tests) and its file paths dropped; the scripts
  every chunk runs become `node --test "scripts/*.test.mjs"`, `npm run typecheck`, `npm run build`,
  `node scripts/check-build.mjs`, `node scripts/check-context-size.mjs` plus the replay family named in the chunk; a
  screen chunk's captures are the kit's screenshots of the DEMO states it lifts (`npm run proto:check`, the files from
  `prototype/check/shots/` committed to `design/<version>/built/`); the migration step says how to start Docker in a
  session and what to do when the image cannot be pulled (Decided 27); models as the cost table's.
- `RULES.md`: the GENERAL-PROCESS folds from the appendix applied into chunk 0's standing sections (Reviewer rules,
  Verification by chunk type, Usage, Decision cards, The build loop, Escalation), each with its Overload line in a
  trailing "(Overload RULES.md Lnnn)"; "Rules discovered during builds" and "Checks that lied" stay empty.
- `NEXT.md`: after "Planned, not built", "Offline writing add-on: rules kept aside" (the OFFLINE-ADDON lines of the
  appendix) and "Client-ready build" (S23's crash screen, the staging and release sections of Overload's RULES.md
  and the appendix's STAGING-RELEASE lines named as what that build lifts).
- `CONTEXT.md`: checked against the agent definitions' "Repo facts" labels and its size (no edit unless a label is
  missing). `scripts/check-agents.test.mjs` (new: no agent definition names `1.2.1`, `master`, an Overload-only
  script, or a staging step outside a `Staging: yes` condition; each reads its branches from CONTEXT.md's labels,
  which exist).

**Lifts (Overload):** `.claude/agents/builder.md`, `.claude/agents/reviewer-data.md`, `.claude/agents/reviewer-light.md`,
`RULES.md` (the GENERAL-PROCESS and OFFLINE-ADDON lines of the appendix, by line number).
**Depends on:** nothing merged; it applies the same appendix as chunk 7 (B2), so B3's review checks the two agree;
nothing in code. **Prototype screens:** none.

**Verification**
- `node --test "scripts/*.test.mjs"` (check-agents green); breaks: write `master` into `builder.md` → fails; remove
  the `Base branch:` line from CONTEXT.md → fails; add a staging smoke outside the condition → fails. The reviewer
  reads the three definitions end to end against the user's standing rules (this file's head), and each fold in
  RULES.md against its Overload line.
- **Would not catch:** whether the definitions produce good builds (the first app's build shows); a general rule
  wrongly sorted (the appendix's "Doubtful" list is the reviewer's checklist).

**Done when:** the tests are green, the three breaks failed, the reviewer's read found nothing Overload-only, and
`chunk 9 complete` is pushed with its PR into `main`.

### Chunk 10 — The new-app checklist page and its markdown record

**Goal:** the five steps Adam runs by hand for a new app, as a page (Windows cmd commands with copy buttons, an Expect
box and a "Stop if" box per step, tick-boxes with progress saved where Claude can read it) and as markdown in `docs/`.
**Type · size:** LIGHT · M. **Batch:** B3 with chunks 8 and 9 (built beside B2's review, after chunk 9's builder;
merges last).

**Scope**
- `docs/new-app-checklist.md` (the record, in the shape of Overload's `docs/release-1.2.1-run-sheet.md`: the folder
  to run from and timing at the top; per step the cmd commands, Expect, Stop if): (1) GitHub: a new repo from the
  starter template, public or private chosen per app, cloned; the page says what each means (SPEC item 8 step 1 as
  amended 2026-11-06, word for word): GitHub's required checks on a private repo need a paid GitHub plan (about $4 a
  month); a public repo shows the app's code, never its data, to anyone; the demo's spec decides its repo; (2) Supabase: a new project in the app's organization, EU region (it cannot be moved
  later), sign-ups off in the dashboard with e-mail sign-in left on, the first user added; Expect: the project's
  `/auth/v1/settings` (a `curl` with the anon key) shows `"disable_signup":true` and `"external":{"email":true…}`
  (Decided 15); (3) the Supabase → GitHub link on the default branch, so migrations deploy by themselves; Expect: the
  link shows `main` and "migrations"; (4) Vercel: a new project from the repo with `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`; Expect: a Ready deploy; (5) the app opens on its Vercel address and the first account signs
  in; Stop if: the sign-in page shows the wrong-password line or the failed line with its reason. Step 1's Expect box
  says the starter shows "Use this
  template" (the template flag, Adam's to-do) and the new repo has "Automatically delete head branches" on. After
  step 5, the hand-off to agents: the project's Postgres version into `supabase/postgres-image`, `app.config.ts`
  filled, `design/0.1/` kept as the design reference until the app's first prototype replaces it (Decided 30), the
  environment for the app's sessions (Q1's secret), the first build's TASKS. What is on Adam is only what needs
  production access or his consent (RULES "Pages for me").
- `scripts/build-checklist-page.mjs` (new) + `.test.mjs`: renders the markdown to `docs/new-app-checklist.html`:
  every ```cmd block becomes a command box with a copy button (the Clipboard API; a fallback that selects the text),
  "Expect:" and "Stop if:" paragraphs become the two boxes, each step a tick-box; the fields that fill placeholders
  (`<project-ref>`, `<vercel-url>`) are inputs whose value is substituted into the commands on the page. Progress:
  ticks and field values are saved to the artifact database when the page runs as a published artifact
  (`window.claude` present) and to the browser's storage otherwise, every access in try/catch (S17). The page is static
  HTML with tokens inline (the starter's light and dark values), no external resource. The test: every cmd block in
  the markdown appears verbatim in the HTML (copied by script, never retyped: "Pages for me"), every step has both
  boxes, the HTML is regenerated from the markdown (a hand edit to the HTML fails the test).
- A Playwright check in the test: the page at 390 and 1280 px has no element cutting off its content (a copy of the
  kit's `findClipped`, twenty lines, with its source named, Decided 44) and a copy button puts its command on the
  clipboard.

**Lifts (Overload):** `docs/release-1.2.1-run-sheet.md` (the shape: cmd, Expect, Stop if, "never paste a key"),
`RULES.md` "Pages for me" (the rules of the page), `prototype/check/clipping.mjs` (`findClipped`, copied).
**Depends on:** chunks 1, 2 (the facts the steps state: the env variable names, the config file, the image file);
nothing in code. **Prototype screens:** none.

**Verification**
- `node scripts/build-checklist-page.mjs` then `node --test scripts/build-checklist-page.test.mjs` green; breaks: edit
  a command in the HTML by hand → fails; remove a step's "Stop if" in the markdown → fails; the clipping check at
  390 px with a long command → fails until the box scrolls sideways inside itself.
- **Would not catch:** the dashboards' current layout (Supabase's and Vercel's UIs change; the first app's run by Adam
  is the test, and the page is corrected from it); whether the artifact database path works until the coordinator
  first publishes the page (RULES "Pages for me": publish when setup found it can).

**Done when:** the HTML is generated and the tests green, the three breaks failed, the markdown reads end to end as
the five steps with the hand-off, and `chunk 10 complete` is pushed with its PR into `main`.

---

## Before the release (BUILD.md step 5, without staging and without Adam's vibe check)

One reviewer agent (reviewer-light's definition, Sonnet high) and the coordinator; counted as one LIGHT in the
estimate.
1. **Screens against the prototype, by screenshot:** `npm run proto:check` on `main` (the kit renders the real screens)
   → `prototype/check/shots/` (80) against `design/0.1/prototype/` (80), side by side, every state, 390 and 1280 px,
   light and dark; each difference listed with its state and whether SPEC or the prototype decides it. The shots of
   the built screens go to `design/0.1/built/`.
2. **Every script:** `node --test "scripts/*.test.mjs"`, `npm run typecheck`, `npm run build`,
   `node scripts/check-build.mjs`, `node scripts/check-context-size.mjs`, `bash scripts/replay-migrations.sh`,
   `bash scripts/verify-rls-replay.sh --fixture`, `bash scripts/verify-rls-replay.sh`, `bash scripts/check-embeds-local.sh`
   (the Docker ones in the session where the image can be pulled, else read from `main`'s last `migration-replay` run
   and said so).
3. Tests owed cleared in one tests-only run, then one full `npm test`.
4. `docs/release-0.1.0-notes.md`: what the starter holds (the eight items of SPEC), what is not in this version, the
   facts verified and how each came out. HISTORY.md gets the build's record; NEXT.md its leftovers.
5. **The tag `v0.1.0`** with the notes. Adam's answer to Q2 (2026-11-06): setup tries one throwaway tag; if it
   lands, the coordinator pushes `v0.1.0` (and the GitHub Release if the API allows it); if not, Adam runs
   `git tag v0.1.0` and `git push origin v0.1.0` from the release note. The two repository settings (the template
   flag, head-branch deletion) are done (2026-11-06).
6. The close (BUILD.md step 6) is Adam's and the next session's: LEARNINGS verdicts, the cost table's third
   calibration, the retro.

---

## Facts to verify — what happened in this session

1. **Two users signing in on the replay.** *Run here, on the real image* (`supabase/postgres:17.6.1.155`, PostgREST
   `v12.2.3`, both pulled from Docker Hub once the shared quota rolled). What happened, in order:
   - The image's `auth.uid()` and `auth.role()` read the per-claim settings (`request.jwt.claim.sub`), which PostgREST
     removed in 12.0.0 (its CHANGELOG, "Removed db-use-legacy-gucs … All PostgreSQL versions now use GUCs in JSON
     format"); through PostgREST the claims arrived as `request.jwt.claims` JSON and `auth.uid()` was null for A, B
     and the visitor, so an `own` table read empty for everyone (the "owner sees ≥ 1 own row" guard in the plan
     caught it; a zero-rows-only check would have passed). The `signed-in` and `public` kinds, whose policies do not
     call `auth.uid()`, behaved from the start.
   - A hosted project gets its `auth.uid()` from the Auth service's own migrations, not the image: `supabase/auth`
     (cloned read-only) defines `uid()`, `role()`, `email()` in `20220224000811_update_auth_functions.up.sql` and
     `jwt()` in `20220531120530_add_auth_jwt_function.up.sql`, each reading the legacy setting first and the JSON
     claims second. Applied on the replay as `supabase_admin` (the functions belong to `supabase_auth_admin`;
     `postgres` may not replace them), with PostgREST connected as `authenticator` (its password set on the replay;
     `safeupdate=on` in the session, so a bare `DELETE` is refused with 21000, which closes Overload's "replay doesn't
     load pg-safeupdate" for the replay through PostgREST): A read `a1, a2`, B read `b1`; the head-only count of rows
     not B's answered `*/0` and B's total `1`, A's `2`; the visitor got 42501; B's own insert answered 201, B's row
     forged with A's id 403 (`new row violates row-level security policy`); `signed-in`: B read both rows, the visitor
     none; `public`: the visitor read the row. A token with a broken signature answered PGRST301.
   - Supabase's default privileges granted all on every new table to `anon`, `authenticated` and `service_role` at
     creation; after `revoke all … from anon` the signed-out probe on an `own` table answered 42501 (401 for `anon`,
     403 for `authenticated`, same code). Decided 13, 39, 40 and chunk 3 carry all of this; the Auth service's
     definitions may move with its versions, which the client-ready build's staging check will see on the real thing.
   - Overload had found the same (the appendix, lines 318 and 320 of its RULES.md: the replay image's `auth.uid()`
     reads only the legacy claim, and the recipe without GoTrue is the hosted `auth.uid()`, a row in `auth.users`, a
     password for `authenticator`, an HS256 token signed with `PGRST_JWT_SECRET`); the sort surfaced it after the run
     here, so the two agree independently.
2. **Docker in a cloud Claude Code session.** *Run here.* `dockerd` is installed but not running; it starts with
   `dockerd --iptables=false --ip6tables=false &` (the two flags are needed: without them it dies deleting nftables
   rules it cannot own; the bridge network then comes up, containers reach each other and the host reaches them) and
   `docker info` answers; `psql` 16 is installed. Pulls: Docker Hub answered `429 Too Many Requests` with
   `ratelimit-limit: 100;w=3600` and `remaining: 0` for the session's shared outgoing address
   (`docker-ratelimit-source: 160.79.106.140`) at 13:54 UTC, and served both images at 14:15 once the hour rolled;
   the Overload environment's allowed hosts hold no registry (so Docker Hub comes with the package-manager rule, and
   Overload's agents did run the replay); `public.ecr.aws` resolves the manifest but its blob host
   (`d2glxqk2uabbnd.cloudfront.net`) and `ghcr.io`'s (`pkg-containers.githubusercontent.com`) are refused by this
   environment's network policy (`connect_rejected`, 403). The replay itself: the database answers `auth.uid()` 8 s
   after `docker run`. Overload's RULES.md line 359 (the appendix) pulls the image through `mirror.gcr.io` when
   Docker Hub answers 429; checked here at 15:25: the mirror is reachable through the proxy and served PostgREST's
   manifest and an alpine image, but did not hold `supabase/postgres:17.6.1.155` at that moment. **So:** the replay
   family runs in GitHub Actions on every PR regardless; in a cloud session it runs whenever the mirror holds the tag
   or the shared hour's quota has room, and always with a Docker Hub token: Adam's answer to Q1 put one on the Starter
   environment (Decided 27). The builder and reviewer definitions say so (chunk 9).
3. **Where sign-ups are switched off on a hosted project.** *Checked against the docs source* (`supabase.com` is
   outside this session's network; read from `raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/
   guides/deployment/branching/github-integration.mdx` and `…/configuration.mdx`): on a production deploy "new
   migrations are applied", functions and buckets declared in `config.toml` are deployed, and "all other
   configurations, including API, Auth, and seed files, are ignored by default"; the configure step that compares
   `[db]`, `[api]`, `[auth]`, `[storage]`, `[experimental]` "runs only when a `[remotes]` block names that branch's
   project ID". **So** the GitHub link does not switch sign-ups off on the main project; it is a dashboard step, on
   the checklist at step 2 as SPEC has it, with the `/auth/v1/settings` probe as its Expect box (Decided 15). A
   `[remotes]` block would do it from the repo, and would also push `site_url` and the rest of `[auth]`: not taken.
4. **Overload's PWA settings without the update gate.** *Half checked here.* vite-plugin-pwa `^1.3.0` installed in
   scratch and its client read: in `autoUpdate` mode, on the new worker's `activated` with `isUpdate || isExternal`,
   it calls `onNeedReload()` when given and `window.location.reload()` otherwise. So the starter keeps Overload's handler
   (records, never reloads); a new version then installs in the background and is used at the next open, with no
   banner. "No half-updated page" rests on having no lazy chunks: the starter has none but workbox-window, loaded at
   start, and `check-build.mjs` keeps it so. **The behaviour across two builds is run once in chunk 1** (its Fact 4
   run) and recorded.
5. **Which RULES.md rules and "Checks that lied" are general.** *Done here, by a separate agent reading Overload's
   RULES.md whole from line 161 (every section; 377 entries, 413 sort lines):* GENERAL-PROCESS 156, GENERAL-CODE 150,
   OVERLOAD-ONLY 58, OFFLINE-ADDON 34, STAGING-RELEASE 15, each with its source line, a proposed stack-skill outline
   over every GENERAL-CODE line, proposed folds into the standing sections for every GENERAL-PROCESS line, and 20
   doubtful entries with the two classes weighed. The appendix at the end holds it; chunk 7 (the stack skill) and
   chunk 9 (RULES.md's folds, NEXT.md's lists) apply it; the "Doubtful" list is their reviewers' checklist. (The
   agent's caveat: many restatements run past twenty words to keep their key terms.)
6. **Bundled fonts.** *Checked here:* Archivo is "Copyright 2020 The Archivo Project Authors", SIL Open Font License
   1.1 (`google/fonts`, `ofl/archivo/OFL.txt`); JetBrains Mono is "Copyright 2020 The JetBrains Mono Project
   Authors", SIL OFL 1.1 (`JetBrains/JetBrainsMono`, `OFL.txt`); both allow bundling and redistribution with software
   when the notice travels with the font (it does, in the package's `LICENSE` and the woff2 metadata). npm has
   `@fontsource-variable/archivo` and `@fontsource-variable/jetbrains-mono` at 5.3.0, licence `OFL-1.1`. The PWA
   caches them because Overload's `globPatterns` names `woff2` and Vite emits the files into `dist/assets`;
   `check-build.mjs` asserts the manifest lists them (chunk 1).
7. **Tailwind v4 `initial` switches.** *Re-checked here on the prototype's real build* (`npx vite build`, 18.5 KB of
   CSS): no `--color-red-500` (no palette variable at all), no `0.75rem` text size, no `0.375rem` radius; the
   utilities map to the tokens (`.text-sm{font-size:var(--fs-sm)}`, `.rounded-md{border-radius:var(--radius-md)}`).
   Holds as SPEC says. (The prototype's CSS still imports Google Fonts: one `fonts.googleapis` line, allowed there
   only.)

---

## Process notes for the coordinator (what BUILD.md would have said; RULES.md exists from chunk 9)

- **Branches and merges.** Base and default branch: `main`. Builders branch `build/chunk-<N>` off `origin/main` (chunk
  3 off chunk 2's branch, rebased after 2 merges); every chunk merges by a squash-merged PR into `main`, the PR's title
  naming the chunk; never stack branches beyond that one case; nothing is deployed anywhere (no Vercel project; no
  staging). `migration-replay` runs on every PR from chunk 2 on.
- **Agents.** Until chunk 9 merges, Overload's `.claude/agents/builder.md`, `reviewer-data.md` and `reviewer-light.md`
  (from `../overload-v2`, commit `8e00877`) are the definitions, and every brief says: base branch `main`, no staging
  check, no `probe-live-columns`, the scripts to run are the ones this chunk and the merged chunks hold; "1.2.1" and
  `master` in them are Overload's and do not apply; RULES.md's ALWAYS sections are this repo's from chunk 0's merge,
  and for chunk 0's own builder and B0's reviewer they are Overload's RULES.md lines 1–160 in `../overload-v2`. From
  chunk 9 the starter's own.
- **Models and effort.** Coordinator Opus medium; builders Sonnet at the highest coding effort (Opus after two
  behaviour failures); DATA reviewer Opus max, fresh per chunk; LIGHT batch reviewer Sonnet high. Up to three agents
  at once.
- **Batches.** B0 {0, 1, 2}, chunk 3 alone, B1 {4, 5}, B2 {6, 7}, B3 {8, 9, 10}; merges in this file's order (chunk 2
  rebased and its CI re-run after chunk 1's merge, Decided 43); a batch holds only chunks that share no files and
  depend on nothing unmerged; the next builder starts beside a running review when the two share no files (the
  schedule above).
- **Records.** The coordinator writes CONTEXT.md's "Where the build is" line at every merge with the meter's dollars
  and hours against the estimate (the 30% rule after chunk 0 and again after chunk 1, the first L), HISTORY.md's long
  form, DECISIONS.md's cards and tests owed, LEARNINGS.md's lessons (the files exist from chunk 0's merge, B0's
  first; B0's own records go in right after it).
- **Cards and limits.** A decision card for anything SPEC leaves open or a prototype state that contradicts SPEC; a
  push notification for every card and limit stop; the hourly scheduled task that resumes the build after a limit;
  full speed always.
- **The environment.** The build's cloud sessions run in Adam's personal cloud environment **Starter** (made
  2026-11-06, Q1's answer): a read-only Docker Hub token saved as a network secret for `auth.docker.io`; agents try
  `mirror.gcr.io` first, Docker Hub second; the coordinator is started in it and starts every agent from it. The
  planning session ran in the Default environment.
- **The Overload clone.** Read-only, at `../overload-v2`, `git checkout 8e00877`; never pushed to; every lift names
  its file in the chunk's commit message.

---

## Appendix — the sort of Overload's RULES.md (Fact 5)

Written by a separate agent in the planning session (2026-11-06) from `../overload-v2/RULES.md` at commit `8e00877`, lines 161 to the end: every entry of "Checks that lied", the three groups of "Rules discovered during this build", and the later usage, break-proof, turn-count and tests-owed sections. Line numbers are that file's. Chunk 7 takes the GENERAL-CODE lines (the outline below); chunk 9 applies the GENERAL-PROCESS folds and puts the OFFLINE-ADDON and STAGING-RELEASE lines into NEXT.md; OVERLOAD-ONLY lines are dropped. The "Doubtful" entries are the two chunks' reviewers' checklist.

### The sort: Overload's RULES.md (lines 161–658) for the starter

Source: `/home/user/overload-v2/RULES.md` at the lines given; serves `/home/user/starter/SPEC.md` items 5 (stack skill), 7 (RULES.md) and Facts to verify 5.
Line format: `L<line> | CLASS | rule (≤20 words) | why`. A bullet holding several rules has several lines with the same L-number; explanatory sub-bullets are folded into their parent, sub-bullets that are rules of their own (e.g. L253, L313, L318–L320, L440–L443, L465, L533–L536) got their own line. Every top-level entry of the five sections has at least one line (377 entries, 413 lines).

### Counts

| Class | Lines |
|---|---|
| GENERAL-PROCESS | 156 |
| GENERAL-CODE | 150 |
| OVERLOAD-ONLY | 58 |
| OFFLINE-ADDON | 34 |
| STAGING-RELEASE | 15 |
| **Total** | **413** |

### Checks that lied

L163 | GENERAL-PROCESS | A passing suite doesn't prove a refactor; re-run against real data and frozen snapshots. | Verification principle; Coach is only the example.
L164 | GENERAL-CODE | Postgres `jsonb` doesn't keep key order: deep-compare with recursively sorted keys. | Postgres fact for any app on the stack.
L165 | OVERLOAD-ONLY | SQL Editor apply dropped characters: hash and length-check applied text. | SQL Editor hand-apply; starter deploys by GitHub link.
L166 | OVERLOAD-ONLY | SQL Editor page text lags; Monaco `getValue()` is ground truth. | SQL Editor tooling, dropped.
L167 | GENERAL-PROCESS | A browser tool's click can report success without firing: verify the resulting state, never the click. | Live-check rule for any app.
L168 | GENERAL-CODE | A tab on a stale service worker reproduces old bugs: after a deploy update the registration and reload before testing. | PWA/service-worker fact; RELOAD banner is Overload's gate.
L169 | GENERAL-PROCESS | "Server-only code never reaches the client bundle" is verified by construction or a real call, not assumed. | Verification principle; `api/` itself is dropped.
L170 | GENERAL-CODE | A push isn't a deploy: `ignoreCommand` can skip a docs-only commit; confirm with `vercel ls`, `vercel inspect` (Ready, production) and a grep of the deployed bundle. | Vercel + lifted `vercel.json` behaviour.
L171 | GENERAL-CODE | Vite/Vitest tolerate extensionless relative imports, Vercel's Node ESM doesn't (`ERR_MODULE_NOT_FOUND`); an env var with an invisible character gives 401; only a real deploy and call finds these. | Vite/Vercel fact, wherever an app adds `api/`.
L172 | OVERLOAD-ONLY | A Coach Q&A first-turn bug only a real call against the deployed endpoint found. | Coach endpoint; lesson already in L171.
L173 | GENERAL-PROCESS | Tests can pass under a broken implementation (decorative asserts): prove a test by injecting the break it claims to catch. | The break-proof rule itself.
L174 | GENERAL-CODE | Sibling data-modifying CTEs see one snapshot: an `UPDATE` beside an insert matches zero rows and reports success. | Postgres fact for migrations and fixtures.
L174 | GENERAL-CODE | An RLS-blocked `UPDATE`/`DELETE` returns zero rows and no error; that silence is the proof of RLS, not a failure. | RLS/PostgREST fact.
L175 | OVERLOAD-ONLY | The SQL Editor's "creates a table without RLS" dialog on CTE fixtures is a false positive. | SQL Editor tooling, dropped.
L176 | GENERAL-PROCESS | An unscoped query returned another account's rows and a wrong figure: scope every investigation query to one account and recompute. | Escalation 2 / standing SQL rule; any app.
L177 | GENERAL-PROCESS | Never judge a rule harmless from one consumer: audit every consumer before calling a change safe. | Reasoning rule for any review.
L178 | GENERAL-PROCESS | A DDL read is no baseline: "purely additive" is exactly the claim that needs a live before/after count. | Migration verification principle (DATA).
L179 | GENERAL-PROCESS | Parse a tool's or model's output in the process that received it, never retyped. | Handling rule; Coach was the example.
L180 | GENERAL-CODE | A local `dist` hash differs from the deployed one because Vercel inlines its own `VITE_*` values; a mismatch isn't a stale deploy. | Vercel build fact.
L181 | GENERAL-PROCESS | A desktop-width screenshot that looks fine can wrap raggedly at phone width: check the real page at phone width too. | Verification policy: both widths (SPEC item 3).
L182 | GENERAL-CODE | Editing source during a live browser test triggers a Vite full reload that wipes page state and looks like an app bug. | Vite HMR fact.
L183 | GENERAL-PROCESS | Hand-typed fixture dates lie (a "Friday" on a Saturday): derive dates from the weekday, assert it, print the queue not only the verdict. | Fixture rule already in Verification by chunk type.
L184 | GENERAL-PROCESS | An injected failure that never fired reads as a pass: confirm the injected error's text appears before reading "nothing persisted" as proof. | Break-proof control rule.
L184 | GENERAL-CODE | A `NOT VALID` constraint applies to new rows only, so it can't inject a failure on existing ones. | Postgres fact for migrations.
L185 | GENERAL-PROCESS | A preservation check on default values proves nothing: set non-default values first, then prove they survive. | Proof-design rule for any write path.
L186 | GENERAL-PROCESS | One check-run id can hang `in_progress` while a later run passed: read all runs of a check by name on the commit and confirm a deploy by its effect. | PR/CI mechanics for any repo; the probe script is dropped.
L187 | GENERAL-CODE | A second FK between two tables makes a PostgREST embed ambiguous (`PGRST201`); SQL checks can't see it, `check-embeds-local.sh` can. | PostgREST fact; the embeds check is lifted.
L188 | GENERAL-PROCESS | A check scoped to one account rules out only that account's data: say so, and never call a spec gap void on it. | Reasoning rule; Adam's second account is the example.
L189 | GENERAL-PROCESS | A PR's checks count only when its own `pull_request` run passes on the merged tree; a `workflow_dispatch` run on a stacked branch doesn't. | Merge mechanics for any repo.
L190 | GENERAL-PROCESS | "Compared by hand" hides bugs: a parity claim needs an executed comparison. | Verification principle.
L191 | GENERAL-PROCESS | Read a builder's "deliberate scope decisions" as possible regressions; a new grouping or layout keeps every per-item action the item had. | Reviewer rule for any app.
L192 | GENERAL-PROCESS | A compatibility rule proven only in a pure module isn't proven: test it at the layer (hook, screen) that applies it. | Verification-layer rule; D30 is the example.
L193 | GENERAL-CODE | PostgREST's row cap (`max_rows` 1000) silently truncates an unbounded read: every list read pages (ordered, `.range()` until a short page) or is bounded. | PostgREST fact for any data read.
L195 | GENERAL-PROCESS | A test written to a rule's wording can assert the bug: for "only X" test what must be absent, on a fixture where something is already past. | Test-design rule; the week sheet is the example.
L196 | GENERAL-CODE | `migration-replay` green but production refused a function: the replay doesn't load pg-safeupdate, so bare deletes fail only live. | Supabase/pg-safeupdate fact; replay check is lifted.
L197 | GENERAL-CODE | An anon-key read of RLS-hidden rows answers `[]` whether they exist or not; if unreachable and empty look the same the read proves nothing; only a signed-in read can. | RLS fact that shapes every probe.
L198 | GENERAL-CODE | `document.scrollWidth` passes while an `overflow: hidden` card clips a row: check every element against its nearest clipping ancestor. | Clipping-check design; the starter's `clipping.mjs` does this.
L199 | GENERAL-PROCESS | A long-text control is lengthened as the screen prints it (capitals, transforms), beside a no-wrap copy that must fail. | Control-design rule; the sheet script is dropped.
L200 | GENERAL-PROCESS | A break or mutant run in a scratch copy starts with an unmutated control run there; a catch is read by the failing test's name, not "failed > 0". | Break-runner rule for any repo.
L201 | OFFLINE-ADDON | A probe of a queue defect models every foreign key the queued writes carry and every online delete of a record they name. | Sync-queue verification.
L202 | GENERAL-CODE | A fake server must refuse in the real shape: PostgREST under RLS reports an FK violation as `Key is not present in table "x".` with no key, so match the constraint name in `message`; read the shape once on a real server. | PostgREST error-shape fact.
### Rules discovered — Data and architecture

L209 | OVERLOAD-ONLY | Standing UI rule: show only what every set uses; the rest behind a ⋯ menu; an unset feature shows nothing. | Adam's rule for Overload's set rows; prototype decides starter layout.
L210 | GENERAL-CODE | TanStack Query owns all Supabase data; Zustand owns UI state only; never mix. | Stack architecture rule.
L211 | GENERAL-CODE | All colours through CSS custom properties (tokens); no hardcoded hex in components. | Tokens rule; the tokens check enforces it.
L212 | GENERAL-CODE | Text or an icon on the accent uses `var(--on-accent)`, never the base colour; a tint made from the accent isn't the accent. | Token rule for any accent-coloured surface.
L212 | OVERLOAD-ONLY | `textOnAccent.static.test.ts` lists (`REBUILT_SCREENS`, `NOT_REBUILT`, `NOTHING_TO_READ`); Coach keeps `--base`. | 1.2 rebuild scoping.
L213 | OVERLOAD-ONLY | A chunk that changes which files a rebuilt screen loads edits `textOnAccent.static.test.ts`'s lists. | 1.2 rebuild scoping.
L214 | GENERAL-CODE | `today` is never computed at module load: state refreshed on `visibilitychange` and at midnight. | Date handling for any app showing "today".
L215 | OVERLOAD-ONLY | Set logs: `weight` and `reps` nullable when `is_skipped`. | Overload schema.
L216 | GENERAL-CODE | Weeks are Monday-anchored: pass `weekStartsOn: 1` explicitly; never `differenceInWeeks` for calendar weeks. | Polish-calendar date rule; meso numbering is the example.
L216 | GENERAL-PROCESS | A fixture whose verdict turns on a week boundary derives it from its dates, prints it and pins the Sunday/Monday edge. | Fixture-date rule, as L183.
L217 | OVERLOAD-ONLY | Stage-exclusion: drop stages never count as sets except for volume; use `setGroupLogic.ts`. | Overload domain.
L218 | OVERLOAD-ONLY | Dropset write paths pass the parent id from the tap; no inference. | Overload domain.
L219 | OVERLOAD-ONLY | Deleting a dropset head deletes stages first, head last; ADD STAGE disabled mid-delete. | Overload domain.
L219 | GENERAL-CODE | An awaited mutation that must fail fast offline uses `networkMode: 'always'`; TanStack's default `'online'` pauses it and the await hangs. | TanStack fact; starter's "saving needs a connection".
L220 | OVERLOAD-ONLY | e1RM: RIR-adjusted Epley; null RIR skipped; headline a percentage. | Overload domain.
L221 | OVERLOAD-ONLY | Weights stored in kg; unchanged display value returns the stored kg; unit written as a literal. | Overload domain.
L222 | OVERLOAD-ONLY | Compare logged and planned weights in the exercise's display unit. | Overload domain.
L223 | OVERLOAD-ONLY | REVIEW reads a head log's `stage_kind` as the type as done. | Overload domain.
L224 | OVERLOAD-ONLY | REVIEW sees a type change on an undone set only through its `retyped` row. | Overload domain.
L225 | OVERLOAD-ONLY | `EARLIER THIS WEEK` is the shipped label, not a bug. | Overload wording.
L226 | OVERLOAD-ONLY | Plan's SETS / STRUCTURE choice is page-local. | Overload screen.
L227 | OVERLOAD-ONLY | Coach and `api/**` rules live in HISTORY.md; read before any Coach change. | Coach/api dropped.
L228 | GENERAL-CODE | A new table's RLS matches its access kind (`own`: `for all using/with check (user_id = auth.uid())`); any deviation is deliberate and documented in the migration. | RLS rule; access kinds generalize it.
L229 | GENERAL-PROCESS | A bare `select` through any RLS-bypassing path carries an explicit single-user filter, investigation queries included. | Standing SQL rule / Escalation 2.
L230 | OVERLOAD-ONLY | One read path for program exercises; `check-program-exercise-reads.mjs` enforces it. | Dropped script; Overload domain.
L231 | OVERLOAD-ONLY | Carry fields are unread; don't add a reader. | Overload schema.
L232 | GENERAL-CODE | Removing a read in front of a write can turn a stale-screen error into a silent orphan write: keep and test whatever failure the read gave. | Write-path design rule for any app.
L233 | OVERLOAD-ONLY | Deload restore keeps pre-deload sets; writes that change exercises leave the copy stale. | Overload domain.
L234 | OVERLOAD-ONLY | CHANGE THE PROGRAM rewrites a not-started deload session's saved copy. | Overload domain.
L235 | OVERLOAD-ONLY | A program swap inserts a new row and soft-removes the old; `replaces_program_exercise_id` records it. | Overload domain.
L236 | OVERLOAD-ONLY | A week-dependent run changed in 1.1 has its list in its weeks, not its run copy. | Overload domain.
L237 | GENERAL-CODE | A migration that drops a column ships after the code that stops using it: code first, every device updated, then the drop; check every bundle still in use for writes. | Migration ordering rule.
L238 | GENERAL-PROCESS | Break proofs restore from a `cp` backup, never `git checkout --`, which reverts every uncommitted edit. | Break-proof mechanics, already standing.
L238 | GENERAL-PROCESS | A break is one exact replacement that must match once; one that never fired reads as caught. | Break-proof mechanics.
L238 | GENERAL-PROCESS | After a loop of breaks, what is on disk (build, screenshots) is the last break's: rebuild from restored code before reading it. | Break-proof mechanics.
L239 | GENERAL-PROCESS | A reviewer may merge a migration that changes no existing row (adds, replaces a function or view, relaxes a constraint) once replay, embeds check and scratch-copy fingerprint pass; migration first, code after a green deploy; destructive ones stay Adam's. | Escalation boundary for migrations (D29).
L240 | OVERLOAD-ONLY | Workout screen unchanged for plain sessions (D30), superseded by behaviour parity (R4). | Overload screen rule.
L241 | OVERLOAD-ONLY | One workout on several weekdays exists; never convert such a program automatically. | Overload domain (G14).
L242 | GENERAL-PROCESS | Check UI at phone width, not just desktop. | Verification policy: both widths.
L243 | GENERAL-CODE | A write that must leave exactly one active record runs in one transaction (an RPC) under a per-user advisory lock; two client requests can leave two. | SQL function pattern for any app; runs are the example.
L244 | GENERAL-CODE | Every table the app reads or writes goes in the access list (verify-rls) with its kind in the same change; the list test fails until it does; `public` cites the migration that makes it so. | RLS check rule; SPEC rule 6.
L245 | GENERAL-CODE | A table created before any code uses it is still listed and probed (ahead list); the first `.from()` or embed moves it to the used list, the tests fail until it does. | Lifted verify-rls-ahead mechanism.
L246 | OVERLOAD-ONLY | `pending_stages.stage_count` is the total number of drops. | Overload schema.
L247 | OVERLOAD-ONLY | A set's number is its place (`row.number`), never a count of logged sets. | Overload domain.
L248 | GENERAL-CODE | A named column list fails the whole read (`400`/`42703`) when a column is missing, where `select('*')` returns less; drop unread columns from the list; add a new column only once its migration is live, probed against real PostgREST with a made-up-column control. | PostgREST fact for every read.
L249 | GENERAL-CODE | A type field added for a new column is optional when hand-built literals predate it; absent reads as null; every reader treats `undefined` as null, pinned by a test. | TypeScript/data-mapping rule for any app.
L250 | OFFLINE-ADDON | A queued write is "never sent" only when no send started and none failed (`sendStarted` in IndexedDB); cancel only inside the single-flight pass. | Sync-queue rule.
L251 | OFFLINE-ADDON | A queued delete's payload is `{ id }`, sent as `delete().eq('id', id)`, with session and head beside it; every item goes out through `.from(item.table)`. | Sync-queue rule.
L252 | GENERAL-CODE | A column a full-row upsert must leave alone is left out of the payload and its type: PostgREST's upsert (`merge-duplicates`) writes only the columns the payload names. | PostgREST upsert fact.
L253 | GENERAL-CODE | Naming an excluded column fails typecheck (TS2353) but a spread `...(cond ? { col } : {})` passes it: only payload tests catch that. | TypeScript limit; payload tests needed.
L254 | GENERAL-PROCESS | Prove "leaves the column alone" with a value stored behind the client's back: load, change by API, write, the API's value must survive. | Proof design, as L185.
L256 | GENERAL-CODE | A one-column change is sent as `update({ col }).eq('id', id)`, never a whole-row upsert, which re-creates a row another device deleted and overwrites its edits. | PostgREST write rule for multi-device apps.
L256 | OFFLINE-ADDON | A one-column change goes out as a `patch` queue item `{ id, set_number }`, flushed after every earlier write to that log. | Sync-queue item shape.
L258 | OFFLINE-ADDON | A queued row naming a log by cascading FK is refused forever (`23503`) once the queue cancels or deletes that log first; probe every new producer with the record deleted offline, online, and after one failure. | Sync-queue rule.
L259 | OFFLINE-ADDON | A queue item naming another record by cascading FK hangs under it in the never-sent cancel, the order and the online delete. | Sync-queue rule.
L260 | OFFLINE-ADDON | A queued write refused because its record is gone is decided by the FK action: CASCADE drops it, SET NULL sends with null, NO ACTION makes the delete consult the queue. | Sync-queue rule.
L264 | OFFLINE-ADDON | An online delete drops the deleted record's own queued writes once its request went through, and tells a running pass (`removedByCleanup`). | Sync-queue rule.
L268 | OFFLINE-ADDON | A preflight counting what the queue will still send leaves out only a pair the next pass cancels. | Sync-queue rule.
L271 | OFFLINE-ADDON | Sign-out clears every table of the device database (`db.tables`); the test names the tables so a new one is named on purpose. | Dexie rule.
L272 | OFFLINE-ADDON | A write still queued after a pass reads as missing once the screen reads the server again; probe an offline write with its first send failing while reads go through. | Sync-queue rule.
L277 | OFFLINE-ADDON | The workout's session read is the server's rows plus this device's unsent upserts (`readActiveSession`), merging upserts only; a queue that can't be read leaves the server's answer. | Offline read-merge rule.
L279 | OVERLOAD-ONLY | A deload set's logged base weight is the planned exercise's own. | Overload domain.
L280 | OVERLOAD-ONLY | A read of sessions by day window also returns rows moved into it (`moved_to_date`). | Overload domain.
L281 | GENERAL-CODE | A change sent as several requests holds its screen state consistent from before the first request until the cache holds the result, or a read between them draws a half-written state. | Multi-request write rule; `holdChanges` is the example.
L282 | GENERAL-CODE | A change of several requests sends the one the server can refuse first and every destructive one after it, so a refusal destroys nothing; a cut-short change is finished by repeating it. | Write-ordering rule for any app.
L283 | OFFLINE-ADDON | Device-kept state for a record (drafts) is keyed by the record's own id, never by the ordinal its row shows. | Device draft store rule.
L284 | OFFLINE-ADDON | A hook reading IndexedDB draws first and merges what the device held when it answers; writes that depend on it wait for `hydrated`. | Dexie hydration rule.
### Rules discovered — Database / migrations

L287 | GENERAL-CODE | Production runs pg-safeupdate: `DELETE`/`UPDATE` without `WHERE` fails through the API and inside functions; use `where true`. | Supabase default for any project.
L288 | GENERAL-PROCESS | When the `supabase/postgres` image can't be pulled, an apt PostgreSQL stand-in replays migrations for SQL-level checks only; Postgres version and pg-safeupdate stay unproven until CI's replay. | Environment limit of the replay check (Facts to verify 2).
L289 | GENERAL-PROCESS | A migration that changes or removes existing data gets a before/after row count on every table it mentions (target, FK, join), scoped to one user; add-only ones are proven by replay plus scratch-copy fingerprint. | DATA verification / Escalation for destructive migrations.
L290 | GENERAL-PROCESS | A fingerprint that leaves the new column out can't see a default on it: pair it with a count of the column's NULLs and a control that changes one row. | Migration-proof design.
L291 | GENERAL-PROCESS | A before/after count of a written column can net to zero: pair it with an md5 over the written columns, per scope and outside it, with controls that move one row. | Migration-proof design.
L293 | GENERAL-PROCESS | A text test of "reads only the user's rows" checks the filter per select block, not per file. | Static-test design.
L294 | GENERAL-CODE | Migrations deploy through the Supabase GitHub link from the default branch; nothing is applied, transported or pasted by hand. | Migration flow; checklist step 3.
L295 | GENERAL-CODE | Prove constraints by violating them (`23514`, `23503`, `23505`, zero rows); prove `on delete set null`/cascade by deleting a throwaway parent; prove read-only RLS through the anon-key client. | Postgres/RLS proof technique.
L296 | GENERAL-CODE | A `CHECK` passes when its expression is NULL, so `is null or` is an equivalent mutant; a nullable column's constraint proof inserts an explicit NULL. | Postgres fact.
L297 | GENERAL-CODE | A `CHECK` can be proven live without writing a row: Postgres tests a table's checks in name order after RLS and before FKs, so break it beside an older check whose name sorts after it. | Postgres fact.
L298 | GENERAL-CODE | Write SQL fixtures as sequential statements in a `DO` block, never sibling data-modifying CTEs (single snapshot). | Postgres fact for fixtures and migrations.
L299 | GENERAL-PROCESS | Throwaway live data is labelled (`TEST-…`), scoped to one account, deleted in FK-safe order, and its cleanup proven by `count(*)` against the baseline, never by the UI looking empty. | Live-check hygiene; the meso example dropped.
L300 | GENERAL-CODE | Apply an additive migration before deploying code that writes the new columns. | Migration ordering rule.
L301 | GENERAL-CODE | A live schema probe that reads nothing: `GET /rest/v1/<table>?select=<cols>&limit=0` with the anon key answers `200 []` or `400`/`42703`; always add a made-up-column control. | PostgREST probe technique.
L302 | OVERLOAD-ONLY | A done number copied into the plan must fit `v2_week_plan_sets`' CHECKs. | Overload domain.
L303 | GENERAL-CODE | An insert through `jsonb_populate_record` gets NULL, not the column's default, for every column its row leaves out: name every NOT NULL column. | Postgres fact for SQL functions.
L303 | GENERAL-PROCESS | A test's stand-in database mirrors the tables' cascades and set-nulls too, not only their refusals. | Stand-in design (also L418, L554).
L304 | OVERLOAD-ONLY | `probe-live-columns.mjs` takes the spec path. | Dropped script.
L305 | GENERAL-CODE | The `supabase/postgres` image's `auth.users` is minimal until GoTrue has run once, so a seed with users can't run on a bare replay container. | Replay-with-users fact (Facts to verify 1).
L306 | GENERAL-CODE | GoTrue is ready for a seed only when its log says "GoTrue migrations applied successfully"; `auth.identities` exists before its last columns. | Replay-with-users fact.
L307 | GENERAL-CODE | A local stack: replay `--keep`, GoTrue (`supabase/gotrue:v2.180.0`, sign-ups off) and PostgREST (`postgrest/postgrest:v12.2.3`, `PGRST_DB_MAX_ROWS=1000`) behind a small Node gateway on a fake host. | Local-stack recipe; staging-guard part dropped.
L308 | STAGING-RELEASE | A seed's guard pins its own account list; once a newer seed ran, only it or a later one can re-seed. | Staging seed mechanics.
L309 | OVERLOAD-ONLY | A logged warmup may hold no weight or reps; a working set's log may not (`v2_set_logs_check`). | Overload schema.
L310 | GENERAL-CODE | `ON CONFLICT` on a partial unique index's columns without its predicate is `42P10`; an upsert with no `onConflict` lands on the primary key. | Postgres/PostgREST fact.
L310 | OVERLOAD-ONLY | A `v2_session_set_changes` write is the whole row on the row's existing id; partial unique indexes refuse a second row. | Overload schema.
L311 | STAGING-RELEASE | A `Supabase Preview` run can fail at the branch config step before any migration runs; a config failure is a failed deploy; prove the migration live by its effect. | Supabase branching (staging).
L313 | GENERAL-PROCESS | The check-runs API lists only the latest run per name: read every run with `?filter=all` and each run's `.output.summary`, not only its conclusion. | GitHub CI mechanics for any repo.
L316 | GENERAL-CODE | A function is proven as the signed-in role in a session with pg-safeupdate loaded: connect as `supabase_admin`, `load 'safeupdate'`, canary a bare UPDATE, then `set local role authenticated`. | RLS/function proof on the replay.
L318 | GENERAL-CODE | The replay image's `auth.uid()` reads only `request.jwt.claim.sub`; PostgREST 12 sets `request.jwt.claims`, so a local PostgREST reads every call as signed out until `auth.uid()` is the hosted definition. | Replay-with-users fact (Facts to verify 1).
L319 | GENERAL-CODE | `SET ROLE` doesn't apply the role's own settings (`authenticated`'s `statement_timeout = 8s`): set them per transaction. | Postgres fact.
L320 | GENERAL-CODE | Without GoTrue: use the hosted `auth.uid()` definition, insert the user into `auth.users (id)`, give `authenticator` a password, sign an HS256 JWT with `PGRST_JWT_SECRET` (role `authenticated`, `sub`), gateway `/rest/v1` to PostgREST; app TypeScript runs against it through Vite's SSR loader. | Two-users-on-the-replay recipe (Facts to verify 1).
L321 | GENERAL-CODE | A function in `public` gets default EXECUTE grants (anon, authenticated, service_role); a `pg_temp` copy gets PUBLIC's only, so a break-proof copy needs the real grants; a new Supabase branch has no default privileges, so explicit grants decide. | Grants fact.
L322 | OVERLOAD-ONLY | `v2_apply_ops` has no upsert; an insert names every NOT NULL column; a row that may exist is `23505`. | Overload RPC.
L325 | GENERAL-CODE | A "scoped to the caller" test needs a control that can leak: only a security-definer copy without the `user_id = auth.uid()` predicate reaches a stranger's row. | RLS/function proof design.
L326 | OVERLOAD-ONLY | `v2_copy_program` doesn't copy `replaces_program_exercise_id`. | Overload function.
L328 | STAGING-RELEASE | A seed's blanket grants undo a migration's revokes: repeat the revoke in `seed.sql` and read the refusal in the smoke. | Staging seed/smoke.
L329 | GENERAL-CODE | `now()` is constant inside one transaction: idempotence of a `now()` mark is proven across committed transactions. | Postgres fact.
L330 | GENERAL-CODE | A BEFORE ROW trigger whose function returns NULL silently drops every write; a guard trigger is statement-level. | Postgres fact; maintenance mode is the example.
L331 | OVERLOAD-ONLY | A catalog-driven migration reaches Northstar/Atlas tables only production has. | Adam's shared project.
L332 | GENERAL-CODE | PostgREST 12 answers a function's `P0002` with HTTP 500 and a custom SQLSTATE with 400: the app reads `error.code`, never the status. | PostgREST fact.
L333 | STAGING-RELEASE | A re-seed while maintenance is on is refused whole (`OL001`). | Maintenance mode.
L334 | GENERAL-CODE | verify-rls reads a revoked anon select (`42501`) as a pass: a table anon must read needs a signed-out read that expects rows; grants are checked beside RLS. | Source of the starter's `public` kind and grants check.
### Rules discovered — Verification and process

L337 | OFFLINE-ADDON | A live check that fails a write "once" holds the failure until the read under test; reconnect can run two queue passes back to back. | Sync-queue pass behaviour.
L338 | GENERAL-CODE | Run the full `npm run typecheck` (every tsconfig project), never one project alone; a type-only import can pull browser globals into another project. | TypeScript project setup; `api` config is Overload's.
L339 | OFFLINE-ADDON | Queue fixtures are dated at queue time, or they sort before real-now writes in `orderBy('createdAt')`. | Sync-queue fixtures.
L340 | GENERAL-PROCESS | A break runner counts a catch only by a failing assertion; flag timeouts; print each failing test's duration; run breaks with a timeout above the code's longest real-time cap. | Break-runner rule.
L340 | GENERAL-CODE | Vitest 4's JSON reporter gives a timed-out test `Error: STACK_TRACE_ERROR`; a test awaiting a call under a fake-timer cap hangs instead of failing: assert the effect without awaiting it. | Vitest facts.
L341 | GENERAL-CODE | A real service-worker update is drivable in Playwright: `127.0.0.1`, Chromium `--no-proxy-server`, `serviceWorkers: 'allow'`, every Supabase request passed through Node's fetch (bodies from `postDataBuffer()`). | PWA test recipe (Facts to verify 4).
L342 | STAGING-RELEASE | After an update's reload the once-sheet (What's new) opens over the screen: a live tool dismisses it first. | What's new is client-ready.
L342 | OVERLOAD-ONLY | The rest bar draws the jump arrow; "timer stopped" is read from the countdown. | Overload screen.
L343 | GENERAL-CODE | `vitest.setup.ts` gives every test file a default `__APP_VERSION__` (a file's own stub replaces it); `version.test.ts` proves the app module itself has no default. | Lifted vitest.setup/version.ts; frozen files are Overload's.
L344 | GENERAL-PROCESS | A chunk that removes or renames an export under `src/` searches `prototype/src`, then runs the prototype's smoke tests and build; no script looks at it. | Verification at merges (prototype kit).
L345 | OFFLINE-ADDON | A live queue check can put items in the producers' shape straight into IndexedDB while offline and answer POSTs 503 to keep them queued. | Sync-queue live-check technique.
L346 | GENERAL-CODE | When dropping two things, the drop that finds by link runs before the drop that removes the link. | Migration/cleanup ordering.
L347 | GENERAL-PROCESS | `vitest run --changed <base>` is the affected-files census: it follows the import graph where grepping callers misses some. | How Usage's "affected files only" is found.
L348 | GENERAL-PROCESS | To judge a re-captured fixture, capture it on the base tree too: the base's own drift was already stale; only the branch's extra change is the chunk's. | Fixture review rule.
L349 | GENERAL-CODE | On a real screen equal `fr` columns are compared with a tolerance: Chromium lays out in 1/64 px. | Playwright/screenshot fact.
L350 | STAGING-RELEASE | A soft delete leaves the row and the staging smoke counts raw rows: hard-delete throwaway rows by API before the smoke. | Staging smoke.
L351 | GENERAL-CODE | A new RPC's name and parameter are provable live as anon: the right shape answers the function's own refusal, a made-up parameter `PGRST202`. | PostgREST probe technique.
L352 | GENERAL-CODE | TanStack keeps a query's data when a later read fails: a state built on "no answer" is tested with a read that fails after one that answered. | TanStack fact.
L353 | GENERAL-CODE | A Playwright route that intercepts a table waits until no read of it is in flight; a foreground event joins an in-flight read and gets the real row. | Playwright technique.
L354 | STAGING-RELEASE | A fresh browser profile gets the once-sheet over the first signed-in screen; dismiss it before pressing anything. | What's new is client-ready.
L355 | GENERAL-CODE | A CSS property name in a committed fixture's inline style makes Tailwind build a utility (`text-wrap`): compare the stylesheet's rules, not only its name. | Tailwind v4 scanning fact.
L356 | STAGING-RELEASE | The test account is exempt in staging's `v2_app_status`; proving the maintenance trigger takes a non-exempt account. | Maintenance mode / staging.
L357 | GENERAL-CODE | Theme and accent applied before the first render are proven by a first-paint test (the cache seeded before the first draw). | Theme bootstrap test; the gate is Overload's.
L358 | GENERAL-CODE | psql notices go to stderr: a break runner reads stdout and stderr apart, or a line diff shows changes on a comment-only control. | psql fact.
L358 | GENERAL-PROCESS | Every break runner has a comment-only control. | Break-runner rule.
L359 | GENERAL-PROCESS | Docker Hub answers 429 for the replay image here: pull `supabase/postgres:<tag>` through `mirror.gcr.io` and `docker tag` it. | Environment fact for the replay check.
L360 | GENERAL-PROCESS | Live browser verification against real data is a hard gate when a task calls for it; live tests write only with an explicit go-ahead. | Escalation 1 / 17.
L361 | GENERAL-PROCESS | Commands for Adam are Windows cmd; his `>` redirect yields UTF-16, so anything reading his output accepts UTF-16. | Procedure pages for any app.
L361 | GENERAL-PROCESS | Pin the Supabase CLI (`npx --yes supabase@<version>`); `db query --linked` needs login only; never `db dump --dry-run`, it prints the password. | Credential safety with the CLI.
L362 | GENERAL-PROCESS | Dry-run without credentials: from the dev-server tab, dynamic `import()` the compiled modules and call them with the app's own signed-in client; throwaway scripts deleted, `git status` checked. | Escalation 3 technique.
L363 | GENERAL-CODE | Plain `vite` dev doesn't serve `api/**`: exercise endpoints on a deployed build or by invoking the handler directly. | Vite/Vercel fact, where an app adds `api/`.
L363 | GENERAL-PROCESS | Never grep for a deferred live check and call it verified: carry it forward by name. | Reporting rule.
L364 | GENERAL-PROCESS | Adversarial review: independent reviewers per dimension, each finding re-verified against current source; report raw vs confirmed counts; say which findings were adversarially verified. | Reviewer rules.
L365 | GENERAL-PROCESS | Read the current file before editing or citing it; spot-check a subagent's report at its cited lines; report expectations as expectations and outcomes faithfully. | Reviewer rules ("confirmed, not assumed").
L366 | GENERAL-PROCESS | Don't launch a background duplicate of a check already run inline; stop or account for one in flight. | Usage.
L367 | GENERAL-PROCESS | Commit and push only when asked; isolate a standalone commit from unrelated work (`git stash push --keep-index`, isolated typecheck); split unrelated work; byte-diff restored files. | Build-loop git mechanics; CONTEXT.md clause is the coordinator's.
L368 | GENERAL-PROCESS | A rule discovered mid-build is written into RULES.md the same session, not left in a log. | Reviewer rules, already standing.
L369 | GENERAL-PROCESS | A TASKS verification can pass while the build contradicts SPEC's wording: review against SPEC's text in the brief, and put SPEC's exact words in the brief. | Reviewer rules / briefs.
L370 | OVERLOAD-ONLY | The cloud network policy allows the staging hosts and denies production's Vercel domain, `vercel.com`, `supabase.com`. | Adam's project hosts.
L371 | GENERAL-PROCESS | A fresh container has no `node_modules`: `npm ci` before typecheck, test or build. | Environment rule.
L372 | GENERAL-PROCESS | `pkill -f <pattern>` kills the calling shell when the pattern is in its command line; `pgrep -f` matches it too: find the pid with `ps aux | grep "[p]attern"`, wait on a marker file. | Environment rule.
L373 | GENERAL-PROCESS | Seed and fixture rows are shaped the way the app writes them (each column's convention from the writer); check a seed on the real screen, not only by counts. | Fixture/seed rule; replay seeds need it.
L374 | GENERAL-CODE | `config.toml` `[auth.email] enable_signup = false` turns e-mail sign-in off for everyone; sign-ups are `[auth] enable_signup`; a config test guards it. | Supabase config trap; SPEC's sign-ups check.
L375 | STAGING-RELEASE | A new Supabase branch has no default privileges on `public`: tables answer `42501` until the seed grants them. | Supabase branching (staging).
L376 | OFFLINE-ADDON | Anything in front of an offline-capable write is best-effort: `networkMode: 'always'` and a fallback, so the write still happens offline. | Offline write path.
L377 | GENERAL-PROCESS | npm here rewrites the lockfile (drops `libc` fields): never commit it; splice new entries by hand, check the diff is insertions only and the integrity matches `npm view`, then `npm ci` in a fresh checkout. | Dependency workflow in this environment.
L378 | GENERAL-CODE | Tailwind v4 builds the stylesheet from every file git doesn't ignore (tests, scripts, docs): a bare utility word anywhere adds a rule; build after the last edit and compare the stylesheet with the base's. | Tailwind v4 scanning fact.
L378 | GENERAL-CODE | A fixture id shaped like a utility (`ps-1`, `pe-2`) builds a rule: give fixture ids a shape no utility has and never quote such an id in a tracked file. | Tailwind v4 scanning fact.
L379 | GENERAL-CODE | A fixture id that names a grid line (`row-3`) is a utility too. | Tailwind v4 scanning fact.
L380 | GENERAL-CODE | Every Node process here prints `[UNDICI-EHPA] Warning` on stderr (`NODE_USE_ENV_PROXY`): a test asserting a child's stderr filters it or drops the variable. | Test-environment fact.
L381 | GENERAL-CODE | A full-page capture draws a `position: fixed` bar at the bottom of the first viewport, not the picture's end: compare its presence and order, not its height. | Screenshot fact.
L382 | OVERLOAD-ONLY | An app sign-in seeds the 46 default exercises; "empty" means none or exactly those. | Overload domain / staging smoke.
L383 | GENERAL-CODE | jsdom drops some inline declarations when serialising (`border` shorthand with `var()` plus a side override, a `padding` shorthand holding `env()`, `-webkit-*`): write longhands, exotic longhand after its shorthand, check the fixture carries every declaration. | jsdom fixture fact.
L384 | GENERAL-CODE | jsdom drops a `border-color` shorthand holding `var()` when a side colour follows it: write all four sides as longhands. | jsdom fixture fact.
L385 | GENERAL-CODE | The entry JS differs between any two builds (`__BUILD_TIME__`, `__BUILD_HASH__`): to prove a change ships nothing, compare stylesheet and vendor chunks byte for byte, the entry after normalising those, and grep the deployed bundle for markers. | Lifted Vite defines; deploy-proof technique.
L386 | GENERAL-CODE | jsdom lays nothing out: max height, what scrolls and scroll chaining are proven in real Chromium in the app's layout; a real phone stays Adam's. | jsdom/Playwright fact.
L387 | GENERAL-CODE | `document.scrollWidth` is blind inside a `position: fixed` layer: measure inside every dialog in Chromium with a wide control that must fail; a long-text probe needs a word with no break opportunity. | Clipping-check design for overlays.
L388 | GENERAL-CODE | A row that scrolls sideways by design asks for it (`overflow-x: auto`, no vertical scrolling) and the clipping check lists it instead of failing it; its own box and children's text are still measured. | Clipping-check design.
L389 | GENERAL-CODE | A type-level test (`@ts-expect-error`) fails only under `npm run typecheck`, never in Vitest: break-prove type rules under `tsc`. | TypeScript/Vitest fact.
L390 | GENERAL-CODE | An input whose omission would silently give plausible numbers is required: no default, refused at run time, the refusal proven under `tsc`. | API-design rule for pure modules.
L391 | GENERAL-PROCESS | A live tool's write is confirmed by a server-side count as the account, never by the tap or a missing error-text match. | Live-check rule, as L167.
L392 | GENERAL-CODE | Something inside a `BottomSheet` that handles Escape itself calls `preventDefault()`, or the sheet (the top one) closes too. | Lifted BottomSheet contract.
L393 | GENERAL-CODE | A sheet whose list changes length with a filter is `BottomSheet` `height="tall"` with the filter in `toolbar`: the content region is the one scroller, so what must stay in view goes in `toolbar` or `footer`. | Lifted BottomSheet contract.
L394 | GENERAL-CODE | A double-press guard is proven with two presses in one instant (`form.requestSubmit()` twice in one `act`), and the service mock awaited before counting calls. | React/Testing Library technique.
L395 | GENERAL-CODE | A sheet that awaits a write then calls back checks it is still mounted with a ref set true on every effect run; StrictMode reruns effects after cleanup. | React fact for lifted components.
L396 | GENERAL-PROCESS | A `spawnSync` timeout kills only the direct child: run the binary in its own process group (`detached: true`, kill `-pid`) and check `ps` after any sweep; before blaming a full-run timeout, re-run the file alone. | Break-runner/environment rule.
L397 | GENERAL-PROCESS | `setsid` returns at once when it is already a group leader: start a sweep with `setsid -w` and check `ps` before another run on the same files. | Environment rule.
L398 | GENERAL-PROCESS | A parity check that expects a known difference names the exact set of differing columns, both ways; a column that should differ and doesn't is a vacuous pass. | Verification design.
L399 | GENERAL-PROCESS | A comparison fixture must hold something to compare (one row at least), or every test passes on code that returns nothing. | Fixture design; the empty week is the example.
L400 | GENERAL-CODE | A Node script that runs the app's TypeScript loads it through Vite's SSR loader (`createServer({ middlewareMode: true, hmr: false })`, `ssrLoadModule`): extensionless imports resolve, no build. | Vite technique.
L401 | GENERAL-PROCESS | A builder's provisional reading that changes what a number counts or what is written is behaviour, not display: hold it against SPEC's and TASKS' words; two readings are a spec gap (a card), and look where TASKS drops a word SPEC has. | Decision cards / display-only rule.
L402 | OVERLOAD-ONLY | `check-warmup-consumers.mjs` scans named helpers, not `groupByParent`. | Dropped script.
L403 | GENERAL-CODE | A pure module's input types are `Pick`s of the app's own types, and its tests build the real types, so typecheck proves the caller's data fits without a cast. | TypeScript design rule.
L404 | GENERAL-CODE | The app's `lib` is ES2020 and `tsconfig.app.json` includes the tests: an ES2022 API passes Vitest on Node 22 and fails typecheck (TS2550); run typecheck after writing tests. | Lifted tsconfig fact.
L405 | GENERAL-CODE | Vitest's timeout can't stop a synchronous infinite loop: a break that removes a loop guard must fail an earlier assertion; test the guard with its dangerous value last. | Vitest fact.
L405 | GENERAL-PROCESS | A break or mutation run uses its own process group with a wall-clock kill and a memory cap (`NODE_OPTIONS=--max-old-space-size`). | Break-runner rule.
L406 | GENERAL-PROCESS | A pure function's tests also run every input array reversed and require the same output. | Test design for order-independence.
L407 | GENERAL-PROCESS | A write path's output is proven through the reader that draws it: apply the output and read it as the screen will, with a break that leaves part of it out. | Verification design.
L408 | OVERLOAD-ONLY | `resolveRows` takes every state the workout card keeps as input, and its walk keeps that state as the screen does. | Overload workout rules.
L409 | GENERAL-PROCESS | A test about order compares identities (keys), not displayed numbers that are recomputed whatever the order. | Test design.
L410 | GENERAL-PROCESS | After every writer that moves ordinals, check each item's place by identity, not only after the writer the fix was for and not only that numbers read 1..n. | Test design; sets are the example.
L411 | GENERAL-CODE | A screen test that must see a write's effect through the real hooks gives `QueryClientProvider` the app's own `queryClient` singleton and clears it in `afterEach`; hooks invalidate that singleton, not a test's own client. | Lifted queryClient fact.
L412 | OFFLINE-ADDON | A queue's ordering rule is proven with the earlier write failing in the pass that would send the later one; with nothing failing `createdAt` order hides it. | Sync-queue test design.
L413 | OFFLINE-ADDON | A fake IndexedDB that applies a write before its first `await` can't tell an awaited write from one that isn't: land writes on a later tick. | Dexie fake design.
L414 | GENERAL-PROCESS | One value held in two places goes through one rule set, proven by a differential (twin) test after the same operation. | Verification design.
L415 | GENERAL-PROCESS | A comparison proves only the cases its fixtures hold, and a runner that exits 0 either way is read by its last line beside a control that must disagree. | Verification design; parity script dropped.
L416 | GENERAL-PROCESS | A break can survive because a later step decides the same outcome: when a branch's only effect is an intermediate value, pin that value in its own test. | Break-proof design.
L417 | GENERAL-PROCESS | An answer covers only the cases its question held; a case the question didn't hold is read against SPEC as a new one, not inferred. | Decision cards.
L418 | GENERAL-PROCESS | A stand-in for a table proves only the checks it models: replay the same walk as SQL on the real tables, with a control they must refuse. | DATA verification.
L419 | GENERAL-PROCESS | A rule that counts or orders stored rows is tested on the rows earlier steps leave behind (gaps, skipped ones), not only fresh in-order fixtures. | Test design.
L420 | OFFLINE-ADDON | The sync queue's tests run on a fake that models the server (FKs, cascade, call shape, lost replies, later-tick writes); a held request is released in `finally` and `afterEach`. | Sync-queue test harness.
L421 | GENERAL-CODE | A fake store returns copies of what it holds (`structuredClone`), as the real store does, or an in-memory change reads back as a stored write. | Fake design; Dexie is the example.
L422 | GENERAL-PROCESS | A break that survives a named proof is one of several holes: sweep the whole function in a scratch copy, classify every survivor, sweep again after adding tests. | Break-proof method; sweeps now banned, kernel stands.
L423 | GENERAL-PROCESS | An answer reaches as far as its words and the option it took, not the files a note names; read the question before narrowing; a narrowing is a scope decision to read as a regression. | Decision cards.
L424 | GENERAL-CODE | A tracked file that quotes a theme variable by its full name puts it in the built stylesheet (`@theme inline`): build such a name from parts and compare the stylesheet character by character. | Tailwind v4 scanning fact.
L425 | GENERAL-CODE | A screenshot tool's `innerText` dump holds no input's value: a board with typed boxes is held against its picture for the numbers. | Screenshot-dump fact.
L426 | GENERAL-CODE | A test that writes a capture fixture captures before it asserts, so a broken rule still writes the fixture the Chromium break measures. | Capture-fixture rule.
L427 | GENERAL-CODE | A typed box keeps half-written text apart from the committed value and every consumer reads it settled; none relies on a blur coming first (Safari gives a tapped button no focus); test out-of-bounds, switch away and back. | Form-control rule for any app.
L431 | GENERAL-CODE | A tap that moves no focus is proven in real Chromium by calling the element's own `click()` from script; a real click blurs first and hides a missing clear. | Playwright technique.
L432 | GENERAL-PROCESS | A rule "everywhere X, use token Y" is proven by a syntax-tree scan over every file, exceptions listed exactly, a break per shape, a comment-only control; a regex over a line is fooled by comments. | Static-check design (tokens check).
L433 | GENERAL-PROCESS | A colour scan is blind to a swapped ternary, a child on another colour and the accent through a named constant: a screen chunk asserts the drawn colour at its screen, and the reviewer reads computed colours. | Limits of static checks.
L439 | GENERAL-PROCESS | A screen change is checked on the real screens before the merge, by computed style, with the deployed app as the control. | Screen verification (before the release in the starter).
L440 | GENERAL-CODE | Build the branch as production builds it into a folder outside the worktree and serve it through Playwright's `route.fulfill` on a made-up https origin; it then signs in to real data. | Playwright technique.
L441 | GENERAL-CODE | Chromium launched under the agent proxy sends `127.0.0.1` through it despite a bypass list, and the relay answers 405 to plain HTTP. | Playwright/environment fact.
L443 | GENERAL-CODE | A downscaled screenshot hides a change like near-white to near-black: read the pixels. | Screenshot fact.
L444 | GENERAL-PROCESS | A family of similar controls is tested with a table over every member, and a boundary with its first value past it. | Test design.
L445 | GENERAL-PROCESS | A fixture whose render changes on purpose is edited by literal replacement and proved by its parity test; a re-capture differing only by React `useId` keeps the committed file. | Fixture hygiene; `useId` noise already standing.
L446 | GENERAL-CODE | When `onMutate` writes the merged value that `mutationFn` then reads, a break in `mutationFn` alone is an equivalent mutant: break the pair together. | TanStack mutation fact.
L447 | GENERAL-PROCESS | A captured render fixture has no parity test, so a rebase leaves it stale silently: after a rebase re-capture (`CAPTURE_RENDER=1`), restore from a `cp` backup, diff; a colour-only diff keeps a layout fixture valid; never take a picture from a stale one. | Fixture hygiene at merges (L28).
L450 | GENERAL-PROCESS | A TASKS list of the places that read something is a hint, not a census: scan every read shape (property, bracket, destructured, whole object) in the syntax tree; settle "needed or addition" by running the writer and the screen with and without. | Reviewer rules.
L454 | OVERLOAD-ONLY | This environment's `VITE_SUPABASE_*` are production's; staging scripts set `STAGING_*` and run `staging-guard.mjs` first. | Adam's project environment.
L454 | GENERAL-CODE | A test that fetches mocks `src/lib/supabase`; a script that loads the app's client sets its URL and key explicitly, never from the ambient environment. | Test isolation on the stack.
L455 | GENERAL-CODE | A data hook a page starts to call is mocked in every test file of that page (page tests mock each hook and mount no provider), with a real answer: `[]` is no rows, `undefined` is not read yet. | Vitest mocking pattern.
L456 | GENERAL-PROCESS | A screen test that mocks its read service proves nothing about the reads: the service gets its own test against rows that belong elsewhere, and its embeds the embeds check; ask whenever a screen test mocks the reading module. | Reviewer rule.
L457 | GENERAL-CODE | A save of a draft built from an earlier read reads again first and refuses when the source changed, or a stale draft overwrites another device's edits. | Concurrency rule for any multi-user app.
L458 | GENERAL-CODE | The access-list test reads every file under `src/` for a `.from(` with a computed table, tests and comments included: write a mock's `from` with spread arguments, don't quote the pattern in a comment. | Lifted verify-rls-tables test behaviour.
L459 | GENERAL-PROCESS | A capture is checked for the variant and state it shows (read its dump's markers) before it is held against the prototype's board. | Screenshot review rule.
L460 | GENERAL-PROCESS | A test that leaves a field out of a check its spec names is read against SPEC before it is accepted; the module not keeping the value is no reason. | Reviewer rule.
L465 | GENERAL-PROCESS | A value one module writes and only another reads is probed through that reader. | Verification design.
L466 | GENERAL-PROCESS | A rule that takes screen-kept state is also run from the states a screen starts in without it (reload, reopened record, another device): sequence tests add steps that drop that state. | Test design.
L470 | GENERAL-PROCESS | A writer that takes an item's place and a selected container is tested on an item that isn't the last, in a container that isn't the first; a draft-derived walk can't see which item was picked. | Test design.
L474 | GENERAL-PROCESS | A walk that proves which item an edit picked builds its expectation beside each step with plain array operations on a copy, compares whole state each step, and asserts it reached every kind of edit at every place. | Test design.
L475 | GENERAL-PROCESS | A break runner decides by exit code, never by a pattern in test output; check it on a must-catch, a must-survive and a comment-only control; timeout far above the heaviest test; one runner per tree; flag ReferenceError, crash or timeout and re-run alone. | Break-runner rule.
L480 | OVERLOAD-ONLY | "The screens 1.2 rebuilds and their shared components" is proven by module reachability (`moduleGraph.ts`), both ways; Coach stays outside. | 1.2 rebuild scoping.
L481 | GENERAL-CODE | A test title or any string counts for Tailwind as much as a comment: a plain English word that is a utility built a rule; reword it and compare stylesheets byte for byte. | Tailwind v4 scanning fact.
L482 | GENERAL-PROCESS | Two places that state the same number are proven by a twin on one world through their real reads; better, one reads the other's function. | Verification design.
L483 | GENERAL-CODE | A derived read's key can sit under the prefix its sibling is already refreshed by (`[KEY, 'statuses', id]`), so every writer that refreshes the list refreshes it; prove with a real mutation and a break that moves the key out. | TanStack key design.
L484 | GENERAL-CODE | An esbuild bundle is no import graph: its resolver matches file names without regard to case; walk Vite's Rollup build (`write: false`, non-relative imports external, `getModuleInfo().importedIds`). | Vite/esbuild fact.
L485 | GENERAL-PROCESS | A number a rule gives a board's case is held against the board and the full text of every answer about it, options included, before a test pins a different one. | Decision cards / reviewer rule.
L489 | GENERAL-PROCESS | A writer that runs on every draw and depends on state only one device keeps is tested with two devices whose state differs; a tie-break keys on what every device reads. | Test design for device-local state.
L490 | GENERAL-PROCESS | A fallback for rows written before a column existed is run through every writer that rewrites such a row, not only through the reads. | DATA verification.
L491 | GENERAL-PROCESS | A writer that takes its target from what the screen has open is tested with something open other than the default (another week, a clock moved past midnight). | Test design.
L492 | GENERAL-PROCESS | A test file removed with the code it tested is read describe by describe first: one describe may test readers that stay. | Reviewer rule.
L493 | OVERLOAD-ONLY | The `--base` control of a real-screen accent scan is a screen 1.2 doesn't rebuild. | 1.2 rebuild scoping.
L494 | GENERAL-PROCESS | A wording fix is looked for in every test that pins the old text, not only the file a review names, and the whole folder runs before it is called done. | Reviewer/builder rule.
L495 | GENERAL-CODE | An effect that writes is proven line by line: its guard, its key, its clamp and its dependency list are each behaviour, each with a test that fails without it. | React effect rule.
L496 | GENERAL-CODE | A test that moves a page across midnight fakes `Date` alone (`vi.useFakeTimers({ toFake: ['Date'] })`) and dispatches `visibilitychange` with `document.visibilityState` set as an own property. | Vitest/React technique, pairs with L214.
L497 | GENERAL-PROCESS | A fixture gives a joined row values that differ from its parent's, or a mapper reading the wrong one of the two can't be seen. | Fixture design.
L498 | GENERAL-PROCESS | A live-check line that names a screen's words is held against the prototype's frames before it is run: a word shown only after an action means the check is that action. | Reading TASKS checks.
L499 | GENERAL-PROCESS | A tool that presses a write on a real screen waits for the label of the finished direction and a quiet network before closing; a pending label is not a done signal; fingerprint content before and after. | Live-check rule.
L500 | GENERAL-CODE | Two routes that render one page component keep one instance and its state unless their elements' keys differ; the proof removes both keys against a stateful stand-in. | React Router fact for the app frame.
L501 | GENERAL-CODE | A write followed by a navigation returns its invalidations from `onSuccess`, so the mutation stays pending until the lists are read again; `void` on the promise fails the test. | TanStack rule.
L502 | GENERAL-CODE | `ConfirmDialog` has no `role="dialog"` so a dialog check can't find it; a dialog or banner that prints a typed name wraps it (`overflow-wrap: anywhere`) and is checked in Chromium with an 80-letter name. | Lifted ConfirmDialog fact.
L503 | GENERAL-PROCESS | A writer that takes the selected container is pressed on four containers (first, two middle, last) in a world where no two are alike; alike ones hide writes to the right place in the wrong container. | Test design.
L509 | GENERAL-PROCESS | A random walk's "reached every kind at every place" is a floor per (kind, place) pair counted over edits that changed something; refused or no-op edits don't count. | Test design.
L510 | GENERAL-PROCESS | A sweep's catch counts only when a failing assertion caused it; a control "caught" by a timeout or disk full is a flag: re-run alone, print counts, check output for non-assertion errors. | Break-runner rule.
L514 | OVERLOAD-ONLY | `check-sheet-overflow.mjs` measures a `ConfirmDialog` through a scratch copy with `role="dialog"`; the no-wrap copy must fail. | Dropped script.
L518 | GENERAL-PROCESS | Worktrees share one `.git`, so another agent's fetch moves `origin/<base>` under you: diff a branch against `git merge-base origin/<base> HEAD`, never against `origin/<base>`. | Worktree mechanics.
L519 | GENERAL-PROCESS | A full disk during `npm run build` exits 1 and leaves a 0-byte entry JS with a right-looking stylesheet name: remove `dist` and rebuild; check `df -h /` before copying a worktree with `node_modules`. | Environment rule.
L520 | GENERAL-PROCESS | An input a merged module reads from a write a later chunk makes is named in that chunk's TASKS when the module merges; amend TASKS in the merge's docs PR. | Build loop / TASKS upkeep.
L524 | GENERAL-PROCESS | A condition that guards stored values for an input only a later chunk can produce is pinned now, with that input, and logged under tests owed if missing. | Tests owed rule.
L525 | GENERAL-PROCESS | A rule "X changes nothing else" is asserted on every record that stays, not only the ones its words name. | Test design.
L526 | GENERAL-PROCESS | A sweep run with `--bail=1` re-runs without bail every verdict that isn't CAUGHT: the JSON report can miss a failure under bail. | Break-runner rule (Vitest).
L527 | GENERAL-PROCESS | A walk's floor counts the cases of the rule under test, not only the kinds of edit, and the walk is built in phases to reach each case. | Test design.
L528 | GENERAL-PROCESS | "Always" on a small world is an enumeration with an oracle of plain loops; a control that says "X restores the original" is enumerated before it is written. | Test design.
L529 | GENERAL-PROCESS | A data migration is judged against an independent restatement of its rule on generated worlds (floor per case), run twice (second run changes nothing), with a hash of columns it must not write, and by what the user sees; the SQL's counts are never the oracle. | DATA migration verification; rehearse script dropped.
L530 | STAGING-RELEASE | A seed copies its own numbers rather than call a planning function whose rules change; prove by canonical dumps on old and new function. | Staging seed.
L531 | STAGING-RELEASE | A seed's copy keys rows by structure, never by a link column a function writes, and checks its result before it ends (`raise exception` rolls everything back). | Staging seed.
L533 | GENERAL-PROCESS | A check that compares a copy with its source also checks the source is not empty, or "equal" can mean both NULL. | Verification design.
L534 | GENERAL-PROCESS | Prove each clause of a check load-bearing by switching it off together with the mistake it stops. | Verification design.
L536 | STAGING-RELEASE | Signing in to staging is a write (last sign-in, sessions): an agent that may not touch staging hands read-only SELECTs to the person who may. | Staging access.
L537 | GENERAL-CODE | pg-safeupdate refuses a bare `DELETE`/`UPDATE` inside a migration's `do` block and in a seed, and the plain replay can't see it: prove them in a `supabase_admin` session with `load 'safeupdate'` and its canary. | Migration proof on the replay.
L538 | GENERAL-CODE | `check-migration` names a flagged `do` block by its first words, not the statements inside it: read a flagged block whole. | Lifted script behaviour.
L539 | GENERAL-CODE | `String.replace` reads `$$` in a replacement string as a pattern: SQL built by replacement passes a function (`() => text`) or a body's `$$` is eaten. | JS fact for migration/seed scripts.
L540 | GENERAL-PROCESS | For a migration that only replaces a function, "nothing else changed" is a schema diff of replay snapshots before and after the file, not a grep. | DATA verification; compare-schema is dropped, the kernel stands.
L541 | STAGING-RELEASE | A re-seed is confirmed by rows only the intended seed writes, read as the account, before any step depends on it. | Staging re-seed.
L542 | GENERAL-PROCESS | A `dockerd` started as a background task stops at the task's time limit and its containers with it: start it with the longest limit, then `docker start` the kept containers. | Environment rule for the replay.
L543 | GENERAL-PROCESS | A PR whose base moved is updated by merging the base into its branch, never force-pushed; before merging, check the merged tree equals the reviewed patch (md5), re-run every script, wait for the PR's own CI run on the merge commit. | Build loop merge mechanics.
L544 | STAGING-RELEASE | Bump the seed version string with every seed change; keep `select '<version>' as seed_version;` the file's last statement. | Staging seed.
L545 | GENERAL-CODE | A table used only by an embed or an RPC op counts as used in the access-list test (read from the syntax tree, never comments or tests); RLS applies to an embed as the caller; the other direction is still `.from()` only. | Lifted verify-rls-tables behaviour.
L548 | GENERAL-PROCESS | A guard that skips an unchanged write is tested with a value that differs in exactly one compared column, for each column it compares. | Test design.
L549 | GENERAL-PROCESS | A round-trip guard is tested where the conversion loses something; a typed box is tested for every way it commits (Enter and blur). | Test design.
L550 | GENERAL-CODE | A hook's optimistic patch and its rollback are part of the writer: assert the cache's columns while the write is held and after a refusal, not only the screen after a refetch. | TanStack mutation testing.
L551 | GENERAL-PROCESS | An absence test needs a fixture where the thing would appear without the guard. | Test design.
L552 | GENERAL-CODE | Two mechanisms that guard one state make each other's break an equivalent mutant: keep one, with a test of its own. | State-design rule.
L553 | GENERAL-CODE | A typed number is matched against a pattern before `parseFloat` ("5o" reads 5, "1e3" reads 1000): digits with at most one `.` or `,`. | Form/number-format rule for any app.
L554 | GENERAL-PROCESS | A change made of several writes is proven cut short, on a stateful stand-in that models the tables' checks, foreign keys and cascade and can refuse a write. | DATA verification.
L555 | GENERAL-CODE | jsdom drops `flex: 1 1 0` (write `1 1 0%`), and `captureRender` writes `innerHTML`, losing the element's own style: frame the element in a wrapper. | jsdom fixture fact.
L556 | GENERAL-CODE | A hook a page starts to call either lives in a component that renders only while its sheet is open, or is mocked in every page test. | Vitest mocking pattern (extends L455).
L557 | GENERAL-PROCESS | A break runner resolves its output paths to absolute ones: vitest's `--outputFile` is relative to its cwd, the worktree. | Break-runner rule.
L558 | GENERAL-CODE | An accessible name built from inline spans has no space between them ("SESSIONDELOAD"): match such a control through a helper that reads its text parts. | Testing Library fact.
L559 | GENERAL-CODE | A state word the page draws in two places is queried through a `data-*` attribute of its own, not by text. | Testing/markup rule.
L560 | GENERAL-CODE | A mock that returns fixed data whatever it is asked hides which argument the page passed: record the argument and assert it. | Mock design.
L561 | GENERAL-PROCESS | A test file removed with the module it tested is held rule by rule against the replacing module's tests, with a break per rule it pinned. | Reviewer rule (extends L492).
L562 | GENERAL-CODE | The access-list test's computed-table scan also fails a test stand-in that calls `from(variable)`: call it as a value, `(fake.client.from as (t: string) => …)(table)`. | Lifted verify-rls-tables behaviour.
L563 | OVERLOAD-ONLY | `fakeDeloadDb.testutil.ts`'s chain has no `.in`; a test adds it locally. | Overload test utility.
L564 | GENERAL-PROCESS | A guard keyed on one stored value is tested with fixtures where the values it must not read go both ways (longer and shorter, present and empty). | Test design.
L565 | OVERLOAD-ONLY | "This week" in Plan is the open week's own query, never the every-week list's copy. | Overload screen.
L566 | GENERAL-CODE | A read TanStack pauses offline is neither loading nor failed: `fetchStatus === 'paused'` gets a state of its own (offline, TRY AGAIN) or the spinner never ends. | TanStack fact; starter's couldn't-load/offline states.
L567 | GENERAL-CODE | A test that draws a second world after `cleanup()` also clears the app's `queryClient`: the singleton keeps the first world's answers. | Lifted queryClient fact.
L568 | GENERAL-CODE | A branch that treats a write as already done (a `23505` race) still refreshes what the screen reads, and is tested by what the screen shows after it. | Write-path rule.
L569 | OFFLINE-ADDON | A writer an effect runs on every draw is tested through a request that keeps failing while online: flush, invalidate, refetch and re-queue can loop; key it on what is still queued. | Sync-queue effect hazard.
L570 | OVERLOAD-ONLY | A place assigned from the card's list and the logs is tested with the list empty and the logs holding places. | Overload workout rules.
L571 | GENERAL-PROCESS | A break that survives is read as a hole in the tests or an equivalent mutant before a test is written, and the fixture gives the break a different value to show. | Break-proof method.
L572 | GENERAL-PROCESS | A change of the source a screen reads re-captures every fixture of that screen and diffs it before the merge; a fixture fed through a hook nothing reads draws the empty state silently. | Fixture hygiene.
L573 | OVERLOAD-ONLY | A mocked staged head's `SetLog` carries `stageKind`. | Overload fixture.
L574 | OFFLINE-ADDON | The pending-sync and failed-sync markers read different stores, so each has a test with the other state present. | Offline indicator.
L575 | GENERAL-PROCESS | A worktree-isolated agent's shell refuses a command whose text holds the word `source`, and some compound commands with `$`-variables: use Grep/Read tools and run scripts as files. | Environment rule.
L576 | STAGING-RELEASE | A re-seed is checked by the seed's own shapes, read as the account, whenever a function the seed calls changed since the last re-seed. | Staging re-seed.
L577 | GENERAL-PROCESS | A break that survives at the screen can be an equivalent mutant there: name every test file the line matters to, and assert where the line alone does the job. | Break-proof method.
L578 | GENERAL-CODE | A stand-in for a sheet or child component calls each function prop with every argument the real caller passes. | Test stand-in design.
L579 | GENERAL-PROCESS | A re-captured fixture can differ only by random ids (`data-row-key`): put the committed fixture back and re-shoot only where an element really changed. | Fixture hygiene.
L580 | GENERAL-CODE | A new variant of a shared component leaves the old variant's serialised markup byte for byte as it was; re-captured fixtures are diffed with ids normalised before any is committed. | Shared-component rule.
L581 | GENERAL-PROCESS | A screen that routes a call through a rule whose own guard gives the same answer can't show the routing: the proof is the break that removes the guard. | Break-proof method.
L582 | GENERAL-CODE | A screen test that drives several writes has the writer's stand-in append the record and re-renders by hand, or the next row never becomes current. | Test technique.
L583 | OVERLOAD-ONLY | Every open workout row has a LOG button; scope "the LOG" to `[data-current-set]`. | Overload screen.
L584 | GENERAL-CODE | A mutation's `isPending` guards a double tap only if `onSuccess`/`onSettled` returns the invalidation; otherwise a tap between answer and refetch works from old rows. | TanStack rule.
L585 | GENERAL-CODE | `await queryClient.invalidateQueries()` inside `act` resolves when the cache holds the new data, not when the screen redrew: assert with `findBy…`/`waitFor`. | TanStack testing fact.
L586 | GENERAL-PROCESS | A state-transition writer is tested from every starting state to every target, replaying the writes against the table's checks at every prefix, stale-column starts included; picking the current state writes nothing. | Test design.
L591 | GENERAL-CODE | A control whose tap target reaches into a neighbour is hit-tested in real Chromium over every control of every fixture (three points per box, scrolled into view; behind a modal exempt); the fix is `z-index` on the overlapping container. | Hit-test check for screens.
L592 | GENERAL-CODE | `ConfirmDialog` wraps its TITLE but not its BODY: a caller printing a typed name in the body wraps it in a span of its own. | Lifted ConfirmDialog fact.
L593 | OVERLOAD-ONLY | A chunk removing the last user of a `SHARED_COMPONENTS` file edits `textOnAccent.static.test.ts`'s list. | 1.2 rebuild scoping.
L593 | GENERAL-PROCESS | Two chunks editing neighbouring lines of one list conflict at merge: keep both chunks' changes and check the file against both diffs. | Merge mechanics.
L594 | GENERAL-CODE | A `BottomSheet` footer button sits outside the sheet's `<form>`: it calls the same function as `onSubmit`, and its `disabled` follows the mutation's pending flag. | Lifted BottomSheet/Panel form contract.
L595 | GENERAL-PROCESS | A TASKS line that names a function for one of Adam's answers is held against the option he took, not only his words. | Decision cards.
L596 | GENERAL-PROCESS | A rule "this writer reaches only these tables" runs every path of the writer (online and offline) through one table-recording fake. | Absence-test design.
L597 | GENERAL-CODE | `networkMode: 'always'` on a mutation is proven only with TanStack's `onlineManager.setOnline(false)`: jsdom reads as online. | TanStack testing fact.
L598 | GENERAL-CODE | An effect keyed on a flag that turns on after the first render is proven by rendering without the flag and then with it. | React effect testing.
L599 | OVERLOAD-ONLY | `check-sheet-overflow.mjs` finds `role="dialog"` only; an `alertdialog` is measured through a scratch copy. | Dropped script.
L600 | OFFLINE-ADDON | A writer the card awaits offline is a queue producer plus a change of the screen's copy, never a mutation on the default `networkMode`. | Offline write path.
L600 | GENERAL-CODE | Change a cached copy only after `await queryClient.cancelQueries(…)`: a read already in flight, cancelled after the change, puts the old copy back; test with `cancelQueries` held open. | TanStack cache fact.
L601 | GENERAL-PROCESS | A shape or validation check has a refusal case for each of its guards (`typeof`, `=== null` vs `== null` each named by a test). | Test design.
L601 | OFFLINE-ADDON | A hold that applies to one shape of a queue item has the item's other shape as its control. | Sync-queue test design.
L602 | OFFLINE-ADDON | A queue rule is also proven in real Chromium on the real IndexedDB queue against a real server, with one request failed once (`route.fulfill` 503), reading `sync_queue` between steps. | Sync-queue live proof.
L605 | OFFLINE-ADDON | The device's Dexie `set_logs` holds only what this phone wrote or primed: a producer's device update may rightly change nothing. | Dexie cache scope.
L606 | OVERLOAD-ONLY | With the staging session down to its last open set, the smoke's LOG goes to an added set. | Staging smoke specifics.
L608 | GENERAL-PROCESS | A playback test derives the state from what the writer was asked, never from a hand-fed fixture, or a dropped write hides. | Test design.
L610 | OFFLINE-ADDON | A fix that cancels, holds or drops queue items is proven with other records' writes in the same queue, asserting they went in the same pass. | Sync-queue test design.
L611 | OFFLINE-ADDON | A test that says what a queued write is refused with also asserts whether it was tried (`attempts`). | Sync-queue test design.
L612 | OFFLINE-ADDON | A queue rule's real-Chromium proof is a differential on the deployed app: same taps before and after, every non-GET request with status, raw `sync_queue` at each step. | Sync-queue live proof.
L613 | OFFLINE-ADDON | A Dexie version bump is proven on real IndexedDB with both trees' `db.ts`, every table filled as the app fills it, an old tab open, and the old build opening the new file. | Dexie migration proof.
L614 | GENERAL-CODE | A restored in-memory value is proven through a remount: it is invisible while the row that shows it stays mounted. | React testing technique.
L615 | GENERAL-CODE | A write an effect starts lands a tick after the `act` that caused it: a reload test settles before it unmounts, or the late write fills the next mount's world. | React testing fact.
L616 | GENERAL-CODE | A `useState` initial value that a late-arrival effect also fills is an equivalent mutant at the screen: pin the effect's path with a value that arrives after the first draw. | React testing fact.
L617 | OVERLOAD-ONLY | The rows a swap makes are all `added`; a rule needing "the plan is behind it" asks `movedFromPlan`. | Overload workout rules.
L617 | GENERAL-PROCESS | When one reader of a flag is fixed, every reader that decides the same thing is checked for the same assumption. | Review method.
L618 | OVERLOAD-ONLY | A property a drop needs is asked of its head; a drop's own `addedPlace` is null. | Overload domain.
L619 | GENERAL-PROCESS | A break runner that flags every `TypeError` as "not an assertion" reads each failing test's first message line before calling it a miss: the break can cause the TypeError. | Break-runner rule.
L620 | GENERAL-PROCESS | A chunk that changes a rule module updates every test that restates the old rule; the full suite finds them; a walk's oracle takes input from the harness's own record, never the module. | Test upkeep.
L621 | GENERAL-CODE | When a screen module is replaced, every `vi.mock('./OldName')` is renamed: a mock of a path that no longer exists passes silently while the new module loads unmocked. | Vitest fact.
L622 | GENERAL-CODE | A test that seeds a fake async store lets the previous test's pending writes land first (`afterEach` waits a few ticks). | Fake-store testing.
L623 | GENERAL-PROCESS | A UI chunk's stylesheet is compared with its base's rule by rule, not by name: `git archive <base>`, `npm ci`, build, postcss over both, read the delta. | UI verification against Tailwind leakage.
L624 | GENERAL-CODE | The wording check runs on the syntax tree's tokens, not lines, with one lowercase token read as code; skipped tokens are audited by hand once, and a new one-word lowercase label is read by hand. | Lifted check-wording behaviour.
L625 | GENERAL-PROCESS | A branch made with `git checkout -b <branch> origin/<base>` tracks the base, so a bare `git push` pushes there: create with `--no-track` or push with `-u origin <branch>`. | Build loop git mechanics.
L627 | GENERAL-CODE | A hook test that refetches settles a few ticks before reading `result.current`: TanStack notifies observers on a later tick. | TanStack testing fact.
L628 | OVERLOAD-ONLY | A probe of 1.1's queue names logs by queue order; `useLogSet` ignored a given id. | Overload history.
L629 | OFFLINE-ADDON | The queue test server (`queueServer.testutil.ts`) also answers the session read as `fetchSession` makes it. | Sync-queue test harness.
L630 | OFFLINE-ADDON | A read that merges some kinds of queued write is probed with the kinds it leaves out, through a writer that reads its result. | Offline read-merge verification.
L633 | OFFLINE-ADDON | A change to a read the queue feeds is proven by a real-Chromium differential comparing each pass's writes and the raw queue, old build and new. | Offline live proof.
L634 | GENERAL-CODE | A screen's error state is probed with the refusal in place before a full load of that screen, never after another screen loaded: a cached answer hides the error. | TanStack cache fact; couldn't-load states.
### The 1.2 usage rules and later sections

L637 | GENERAL-PROCESS | Quiet test output: `--reporter=dot`, filter long script output to failures and summaries, never paste a full passing log. | Usage, already standing.
L638 | GENERAL-PROCESS | Builders run only the affected test files while working; the full suite and every script once at the end (now: one full suite before the release). | Usage.
L639 | GENERAL-PROCESS | Reviewers read RULES.md's index and ALWAYS sections plus the sections the brief names; from CONTEXT.md only the touched sections and "Where the build is". | Usage.
L640 | GENERAL-PROCESS | Compare screenshots from the text dumps first; open a PNG only where the dump can't settle it. | Usage.
L641 | GENERAL-PROCESS | Never resume a long-running agent; start a fresh one from a short summary file. | Usage, already standing.
L645 | GENERAL-PROCESS | Builders read code narrowly (grep, line ranges, touched files) and batch independent tool calls in one turn. | Usage, already standing.
L646 | GENERAL-PROCESS | Only affected test files while building; break proofs run against the specific test file, never the full suite. | Usage / Verification.
L647 | GENERAL-PROCESS | Keep every command under 5 minutes; split long runs. | Usage, already standing.
L648 | GENERAL-PROCESS | RULES.md keeps a short index; each reviewer brief names the sections the chunk needs. | Usage / briefs.
L649 | GENERAL-PROCESS | Chunk reports carried a cost-weighted total beside the context figure. | Superseded: agents never estimate cost, the coordinator reads the meter.
L652 | GENERAL-PROCESS | No mutation sweeps: DATA chunks one break per place that writes, LIGHT one per call pattern; the reviewer re-runs the builder's breaks and adds one only where a place or pattern has none. | Verification by chunk type, already standing.
L655 | GENERAL-PROCESS | Batch independent reads, edits and checks into as few turns as possible; turn count is the biggest cost driver; DATA reviews stay at full strength. | Usage.
L658 | GENERAL-PROCESS | Missing-proof failures don't go back to the builder: the reviewer merges and logs each missing test under "tests owed" in DECISIONS.md, cleared in one tests-only run before the release; behaviour failures go back. | Build loop stop rules, already standing.

### Proposed stack-skill outline

Every GENERAL-CODE line, grouped under headings a `stack` skill file could use. One extra heading, "Shared components", holds the rules about the lifted BottomSheet/Panel and ConfirmDialog, which none of the suggested headings fits.

#### Data in services and hooks (TanStack Query, Zustand, write paths, types)
- L210 Query owns server data, Zustand UI state · L214 `today` from state refreshed on `visibilitychange`/midnight · L219 `networkMode: 'always'` for an awaited mutation that must fail fast offline · L232 keep the failure a removed read gave · L249 optional field for a new column, `undefined` reads as null · L281 hold screen state across a multi-request change · L282 refusable request first, destructive ones after · L352 Query keeps data when a later read fails · L390 required inputs, no silent defaults · L403 pure modules take `Pick`s of app types · L446 `onMutate` + `mutationFn` merge pairs · L457 re-read before saving a draft, refuse when the source changed · L483 derived keys under the refreshed prefix · L500 one route component instance unless keyed · L501 return invalidations from `onSuccess` · L552 one guard per state · L566 `fetchStatus === 'paused'` is its own state · L568 "already done" branches still refresh · L584 `isPending` guards only with returned invalidation · L600 change a cached copy only after `await cancelQueries` · L634 error states probed before the screen's first load.

#### Tokens
- L211 colours only through tokens · L212 text on the accent uses `--on-accent`; a tint isn't the accent · L357 theme and accent applied before first paint, proven by a first-paint test.

#### Words file and Polish formats
- L216 Monday-anchored weeks, `weekStartsOn: 1` explicit · L553 typed numbers matched against a pattern (digits, one `.` or `,`) before `parseFloat` · L624 the wording check runs on syntax-tree tokens; new one-word lowercase labels are read by hand.

#### Migrations and SQL functions
- L164 `jsonb` key order · L174 sibling data-modifying CTEs see one snapshot · L184 `NOT VALID` injects on new rows only · L196 the replay doesn't load pg-safeupdate · L237 drop a column after the code stops using it · L243 one-active-record writes as an RPC under a per-user advisory lock · L287 pg-safeupdate: `where true` · L294 migrations deploy through the GitHub link, never by hand · L295 prove constraints by violating them · L296 a CHECK passes on NULL · L297 CHECK order lets a live proof write nothing · L298 fixtures as `DO` blocks · L300 additive migration before the code that writes it · L303 `jsonb_populate_record` gives NULL, not defaults · L310 `ON CONFLICT` on a partial index needs its predicate · L329 `now()` is constant per transaction · L330 a BEFORE ROW trigger returning NULL drops the write · L346 drop order: what finds by link first · L537 prove `do` blocks and seeds with safeupdate loaded · L538 `check-migration` names a block by its first words · L539 `$$` in `String.replace`.

#### RLS and grants (and the access list)
- L174 RLS-blocked writes return zero rows, no error · L197 anon-key reads answer `[]` for hidden rows · L228 RLS per access kind, deviations documented · L244 every table in the access list in the same change · L245 tables ahead of the app are listed and probed · L316 prove functions as `authenticated` with safeupdate loaded · L318 replay `auth.uid()` vs PostgREST 12's `request.jwt.claims` · L319 `SET ROLE` skips role settings · L320 two users on the replay without GoTrue: hosted `auth.uid()`, `auth.users` row, HS256 JWT, gateway · L321 default EXECUTE grants; `pg_temp` copies lack them; branches have none · L325 a "scoped to the caller" test needs a leaking control · L334 revoked anon select reads as a pass; `public` tables need a signed-out read expecting rows · L374 `[auth.email] enable_signup` vs `[auth] enable_signup` · L458 the list test scans every `.from(` including tests and comments · L545 embeds and RPC ops count as uses · L562 stand-ins calling `from(variable)` · L305 L306 L307 replay with users: GoTrue schema, readiness log line, local stack recipe.

#### PostgREST
- L187 ambiguous embeds (`PGRST201`), the embeds check · L193 `max_rows` cap: page or bound every list read · L202 FK errors carry the constraint name in `message`, no key · L248 named column lists fail on a missing column · L252 upsert writes only named columns · L253 a spread smuggles a column past typecheck · L256 one-column change = `update().eq('id')`, never whole-row upsert · L301 zero-row schema probe with a made-up-column control · L332 read `error.code`, never HTTP status · L351 prove an RPC's shape live as anon (`PGRST202`).

#### PWA
- L168 a stale service worker reproduces old bugs; update and reload before testing · L341 driving a real service-worker update in Playwright (`serviceWorkers: 'allow'`, `--no-proxy-server`, fetch through Node).

#### Tailwind
- L355 a CSS property name in a fixture builds a utility · L378 Tailwind v4 scans every tracked file; fixture ids shaped like utilities · L379 grid-line ids · L424 a quoted theme variable lands in the stylesheet · L481 test titles and strings count too; compare stylesheets byte for byte.

#### Testing and fixtures (Vitest, jsdom, Testing Library, mocks)
- L338 full typecheck across projects · L340 Vitest 4 `STACK_TRACE_ERROR`, fake-timer hangs · L343 `vitest.setup.ts` default `__APP_VERSION__` · L358 psql notices on stderr · L380 `UNDICI-EHPA` on stderr · L383 L384 L555 jsdom drops shorthands: write longhands, frame captured elements · L386 jsdom lays nothing out · L389 `@ts-expect-error` fails only under `tsc` · L394 double press in one `act` · L404 ES2020 lib catches ES2022 APIs · L405 Vitest can't stop a synchronous loop · L411 L567 the app's `queryClient` singleton in screen tests, cleared between worlds · L421 fakes return copies · L426 capture before asserting · L454 tests that fetch mock `src/lib/supabase` · L455 L556 mock every data hook a page calls, with real-shaped answers · L495 effects that write: guard, key, clamp, deps each tested · L496 fake `Date` alone, dispatch `visibilitychange` · L550 assert the cache during a held write and after a refusal · L558 inline spans join without spaces · L559 `data-*` for state words · L560 mocks record their arguments · L578 stand-ins pass every argument · L582 stand-ins append records and re-render · L585 `invalidateQueries` resolves before the redraw · L597 `onlineManager.setOnline(false)` · L598 render without the flag, then with it · L614 prove restored values through a remount · L615 effect writes land a tick later · L616 late-arrival effects vs `useState` initial values · L621 rename every `vi.mock` of a replaced module · L622 let pending fake-store writes land · L627 settle before reading `result.current`.

#### Vite build and Vercel
- L170 a push isn't a deploy: `vercel ls`/`inspect` and a bundle grep · L171 extensionless imports and invisible env characters only a real deploy finds · L180 local vs deployed hash differ (inlined `VITE_*`) · L182 editing source mid-live-test reloads the page · L363 `vite` dev doesn't serve `api/**` · L385 `__BUILD_TIME__`/`__BUILD_HASH__` make every entry differ; compare stylesheet and vendor chunks · L400 run app TypeScript through Vite's SSR loader · L484 esbuild is no import graph; walk Vite's Rollup build.

#### Screenshots, clipping and Playwright
- L198 check elements against their clipping ancestor, not `scrollWidth` · L349 `fr` columns with a 1/64 px tolerance · L353 wait for no in-flight read before routing a table · L381 fixed bars in full-page captures · L387 `scrollWidth` is blind inside fixed layers; unbreakable long-text probes · L388 rows that scroll sideways by design are listed, not failed · L425 `innerText` dumps hold no input values · L431 `click()` from script for focus-free taps · L440 serve a built branch through `route.fulfill` · L441 Chromium under the agent proxy · L443 read pixels, not downscaled pictures · L591 hit-test every control in Chromium.

#### Shared components (BottomSheet/Panel, ConfirmDialog, forms)
- L392 Escape handlers inside a sheet call `preventDefault()` · L393 filterable lists: `height="tall"`, filter in `toolbar` · L395 mounted-ref set on every effect run (StrictMode) · L427 typed boxes keep unsettled text apart; never rely on blur (Safari) · L502 L592 ConfirmDialog has no `role="dialog"`, wraps the title not the body: wrap typed names · L580 a new variant leaves the old variant's markup byte for byte · L594 a footer button outside the `<form>` calls the submit function and follows the pending flag.

### Proposed folds into RULES.md standing sections

Every GENERAL-PROCESS line, by the standing section of the starter's RULES.md it folds into. Lines marked "standing" already appear there in substance and only need their wording checked.

#### Escalation
- L176 unscoped query → recompute from one account (Escalation 2) · L229 explicit single-user filter on any RLS-bypassing path (standing SQL rule) · L239 which migrations a reviewer may merge, destructive ones stay Adam's · L360 live verification is a hard gate; live writes need a go-ahead (standing 1/17) · L361 Windows cmd for Adam, UTF-16 output · L361 pinned Supabase CLI, never `db dump --dry-run` · L362 dry-run technique without credentials (standing 3).

#### Reviewer rules
- L163 a passing suite proves no refactor · L167 verify state, not clicks · L169 "never in the bundle" verified, not assumed · L177 audit every consumer · L179 parse output where received · L188 one-account checks rule out one account · L190 executed comparisons · L191 scope decisions read as regressions · L363 deferred checks carried by name · L364 adversarial review, raw vs confirmed · L365 confirmed, not assumed; spot-check subagent reports (standing) · L368 rules written the same session (standing) · L369 review against SPEC's words in the brief · L391 live writes confirmed server-side · L450 TASKS read-lists are hints: syntax-tree census · L456 mocked read services prove nothing about reads · L459 captures checked for variant and state · L460 fields left out of a spec'd check read against SPEC · L465 a value read elsewhere is probed through its reader · L492 removed test files read describe by describe · L494 wording fixes in every test, whole folder run · L498 live-check lines held against the prototype's frames · L499 live tools wait for the final state and a quiet network · L561 removed test files held rule by rule against replacements · L617 fix every reader of a flag, not one · L620 rule changes update every restating test; the full suite finds them.

#### Verification by chunk type
- Break proofs: L173 L184 L200 L238 ×3 L340 L358 L396 L397 L405 L416 L422 L475 L510 L524 L526 L557 L571 L577 L581 L619 L646 L652 (standing: one break per writing place / call pattern, `cp` backups, no sweeps).
- Fixtures and captures: L183 L216 L348 L373 L399 L445 L447 L497 L572 L579 L623 (standing: fixture dates from weekdays, `useId` noise, captures re-taken at a batch's last merge).
- Test design: L178 L181 L185 L192 L195 L199 L242 L254 L398 L406 L407 L409 L410 L414 L415 L419 L432 L433 L439 L444 L466 L470 L474 L482 L489 L491 L503 L509 L525 L527 L528 L533 L534 L548 L549 L551 L564 L586 L596 L601 L608 (standing: rules asserted at the call site with fixtures that tell right from wrong source; both widths).
- DATA / migrations: L288 L289 L290 L291 L293 L299 L303 L418 L490 L529 L540 L554 (standing: fingerprint only for migrations touching existing rows; migration proven on the replay as the signed-in role with pg-safeupdate loaded).
- Prototype kit: L344 (standing: prototype smoke at every merge that changes a module it renders).

#### Usage
- L347 `vitest run --changed` as the affected-files census · L366 no duplicate background checks · L637 quiet output (standing) · L638 L646 affected files while building, one full suite before release (standing) · L639 L648 index + ALWAYS + brief's sections (standing) · L640 text dumps before PNGs · L641 never resume agents (standing) · L645 narrow reads, batched calls (standing) · L647 commands under 5 minutes (standing) · L649 cost-weighted totals (superseded: the coordinator reads the meter) · L655 fewest turns; DATA reviews at full strength.

#### Decision cards
- L401 behaviour vs display: two readings are a spec gap, a card · L417 an answer covers only its question's cases · L423 an answer reaches as far as its words and the option taken · L485 a board's number held against every answer's full text · L595 TASKS lines held against the option Adam took.

#### The build loop
- Merges and branches: L186 read every check run, confirm by effect · L189 only the PR's own run on the merged tree counts · L313 `check-runs?filter=all` and `.output.summary` · L367 commit/push only when asked; isolate standalone commits · L518 diff against the merge-base in shared worktrees · L520 later chunks' inputs named in their TASKS at merge · L543 update a moved PR by merging the base, verify the merged tree equals the reviewed patch · L593 list conflicts: keep both chunks · L625 `--no-track` branches or `push -u` · L658 tests owed (standing stop rule).
- Environment: L359 replay image via `mirror.gcr.io` · L371 `npm ci` first · L372 `pkill -f` kills the shell; marker files · L377 npm rewrites the lockfile: splice by hand · L519 `ENOSPC` leaves a 0-byte entry; check `df` · L542 `dockerd` dies with its task's limit · L575 shells refuse the word `source`.

### Doubtful

Entries classified with less confidence; the class given first is the one used above.

- L169 — GENERAL-PROCESS vs OVERLOAD-ONLY: the principle (verify "never in the client bundle" by construction or a real call) is general, but its only subject, `api/**`, is dropped from the starter.
- L171 — GENERAL-CODE vs OVERLOAD-ONLY: Vercel Node ESM import resolution matters only once an app adds `api/`; kept as a stack fact for that day.
- L179 — GENERAL-PROCESS vs OVERLOAD-ONLY: "parse output in the process that received it" is general; the case was Coach's model output (Anthropic SDK dropped).
- L209 — OVERLOAD-ONLY vs GENERAL-PROCESS: the standing UI rule is Adam's for Overload's set rows, but "an unset feature shows nothing: no empty fields or placeholders" reads as a design principle the prototype could adopt.
- L281 — GENERAL-CODE vs OVERLOAD-ONLY: holding screen state across a multi-request change is general, but the starter may prefer one RPC per change, making the rule moot.
- L283 — OFFLINE-ADDON vs GENERAL-CODE: "key device-kept state by the record's id, never by a displayed ordinal" is general advice, but the only such state (drafts) is the offline add-on's.
- L288 — GENERAL-PROCESS vs GENERAL-CODE: the apt-PostgreSQL stand-in for the replay is an environment workaround; SPEC's Facts to verify 2 decides whether it is needed at all.
- L305, L306, L307 — GENERAL-CODE vs STAGING-RELEASE: GoTrue/local-stack facts come from staging seeds, but the starter's verify-rls on the replay with two users (Facts to verify 1) needs exactly them.
- L330 — GENERAL-CODE vs STAGING-RELEASE: the trigger fact is Postgres; its only use was maintenance mode.
- L342 (first line) — STAGING-RELEASE vs OVERLOAD-ONLY: dismissing the after-update sheet is client-ready-build territory, but the sheet's shape is Overload's.
- L346 — GENERAL-CODE vs OVERLOAD-ONLY: "notes before sessions" gives too little context to be sure it is a general drop-ordering rule.
- L357 — GENERAL-CODE vs STAGING-RELEASE: the first-paint test is general; the thing it survived was the update gate, which is deferred.
- L373 — GENERAL-PROCESS vs STAGING-RELEASE: "seed data is written the way the app writes it" came from staging seeds; kept general because replay seeds and fakes need it too.
- L375 — STAGING-RELEASE vs GENERAL-CODE: missing default privileges are a Supabase-branch fact, but the same lesson (grants are not implied) sits in L321.
- L421 — GENERAL-CODE vs OFFLINE-ADDON: "a fake store returns copies" came from the Dexie fake; it holds for any fake (PostgREST stand-ins included).
- L489 — GENERAL-PROCESS vs OFFLINE-ADDON: two-device tests of a writer that depends on device-local state; only the add-on keeps such state today.
- L569 — OFFLINE-ADDON vs GENERAL-CODE: the flush–invalidate–refetch–requeue loop is the queue's, but "an effect that writes on every draw can loop with a failing request" is a general React hazard.
- L596 — GENERAL-PROCESS vs OFFLINE-ADDON: a table-recording fake over every path of a writer is general; the two paths in the case were online and offline.
- L622 — GENERAL-CODE vs OFFLINE-ADDON: waiting for a fake store's pending writes between tests came from the draft store.
- L649 — GENERAL-PROCESS vs OVERLOAD-ONLY: the cost-weighted total in chunk reports is superseded by BUILD.md 2.2 (the coordinator reads the meter), so it folds into Usage only as history.

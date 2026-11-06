# Starter 0.1 — TASKS

Planned 2026-11-06 in one cloud session (Fable 5.1, max), from `SPEC.md` (specced 2026-11-04/06, verdicts confirmed by
Adam 2026-11-06), the prototype in `prototype/` (the zip `starter-prototype-src.zip`, unpacked as is; its 19 DEMO states
were built and screenshotted in this session at 390 and 1280 px in both themes: no page errors, no clipping) and
Overload (`adamjuszczyk/overload-v2`, branch `staging`, commit `8e00877`, 2026-11-02; cloned read-only beside this repo
at `../overload-v2` during planning, and that is where builders clone it too). SPEC decides behaviour; the prototype
decides layout, order and wording; SPEC wins a disagreement.

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
| 1 | Scaffold: the stack, tokens, fonts, words file, PWA | LIGHT · L | 0.67 | $12 | 1% |
| 2 | Migrations and the replay: supabase/, access list, migration checks, sign-ups check, the CI workflow | LIGHT · M | 0.67 | $12 | 1% |
| 3 | verify-rls on the replay: two users and a visitor, access kinds, grants, the self-test fixture | DATA · L | 1.4 | $38 | 3% |
| 4 | Sign-in, the app frame and Settings | LIGHT · L | 0.67 | $12 | 1% |
| 5 | The code checks: tokens, words, no database in screens, no prototype imports | LIGHT · M | 0.67 | $12 | 1% |
| 6 | Panel, ConfirmDialog, Table, Toast and the list patterns | LIGHT · L | 0.67 | $12 | 1% |
| 7 | Skills: `stack` and `estimate`, with the cost table | LIGHT · M | 0.67 | $12 | 1% |
| 8 | The prototype kit (runs the real screens; Klienci as the worked example) and the `prototype` skill | LIGHT · L | 0.67 | $12 | 1% |
| 9 | Agent definitions and the repo files (RULES.md, templates, check-context-size) | LIGHT · M | 0.67 | $12 | 1% |
| 10 | The new-app checklist page and its markdown record | LIGHT · M | 0.67 | $12 | 1% |
| — | Before the release: screenshot comparison, every script, tests owed, full suite, notes, the tag (one reviewer agent + the coordinator; counted as one LIGHT) | — | 0.67 | $12 | 1% |
| | **Sum, sequential** | 9 LIGHT + 1 DATA | **8.1 h** | **$158** | **≈ 14%** |

**Run time (wall clock), with the next builder beside each review where files allow (schedule below): ≈ 6.7 h of
running**, plus one 30-minute 5-hour-window pause (likely once, see below) and one retry allowance of 0.5 h (one LIGHT
behaviour failure, the usual rate): **≈ 7.7 h; range 6.7–8.5 h.** Four LIGHT batch reviews (40 min each) are inside
that wall time because a builder runs beside each.

**Size risk, stated apart:** five L chunks (1, 3, 4, 6, 8). If each runs 30% over its type's figure: +1.2 h, +$30,
+2.5%. Upper bound ≈ 8.5 h, ≈ $190, ≈ 16%. The 30% rule on the first chunk (RULES, stop rules) re-estimates the whole
build if chunk 1 runs over.

**Where the week and the window stand at the planned start:** the week 8% used, resets Monday 05:00; the 5-hour window
7% used. (Read from the brief's "[week _8% used …; the 5-hour window _7% used]" as 8% and 7%; if a digit is missing
there, only the pause arithmetic shifts, not the chunk figures.)

- **Weekly limit:** 8% + 14% ≈ 22% at the end (≈ 25% at the upper bound). No weekly pause: nowhere near the limit, and
  the week resets Monday 05:00 whatever is left.
- **5-hour windows:** the build spans two windows (≈ 7.7 h). 1.2.1's one data point: a stop ≈ 1.5 h in with three
  agents running on a window already used that morning, ≈ 30 minutes long. This plan runs three agents (coordinator
  plus two) for most of its length from a window 7% used, so **one 30-minute pause is likely, most probably in the
  stretch 1.3–3.0 h** (chunk 3's review beside chunk 4's build, then B1's review beside chunk 7's build). It is in the
  figure above. The coordinator's hourly scheduled task resumes the build by itself (RULES "The build loop"; L15).
- **Not in the build's figure:** this planning session and the independent pre-read (both done before the build), and
  the first app's vibe check (moved there by SPEC).

**Schedule** (hours from the start; ≤ 3 agents at once; each LIGHT build ≈ 30 min of the 40, each batch review ≈ 40
min, each merge ≈ 5 min; DATA build ≈ 0.8 h, review ≈ 0.5 h):

| From–to | Running | Notes |
|---|---|---|
| 0.0–0.5 | build 1, build 2 (two builders) | share no files (2 touches only `supabase/`, `scripts/`, `.github/`) |
| 0.5–1.2 | B0 review {1, 2}; build 3 beside it | 3 branches off 2's branch, rebases on `main` after 2 merges |
| 1.2–1.3 | merge 1, then 2 | |
| 1.3–1.8 | 3's review (Opus); build 4 beside it | 4 needs only 1 |
| 1.8–1.9 | merge 3 | |
| 1.9–2.4 | build 5 | kept after 3's review so no more than three agents run |
| 2.3–3.0 | B1 review {4, 5}; build 7 (skills) beside it | 7 needs 2, 3 (merged) and this file's sort |
| 3.0–3.1 | merge 4, then 5 | |
| 3.1–3.6 | build 6 | needs 4 merged |
| 3.6–4.3 | B2 review {6, 7}; build 9 beside it (3.6–4.1), then build 10 (4.1–4.6) | 9 and 10 share no files with 6, 7 |
| 4.3–4.4 | merge 6, then 7 | |
| 4.4–5.1 | build 8 (the kit) | needs 6 merged; 10 finishes at 4.6 |
| 5.1–5.8 | B3 review {8, 9, 10} | |
| 5.8–5.9 | merge 8, 9, then 10 | the checklist page merges last |
| 5.9–6.7 | before the release | one reviewer agent + the coordinator |

---

## Decided

Technical and architecture decisions, each with its one-line reason. The reviewer checks the reason, not the taste.

1. **Chunk 2 is LIGHT, chunk 3 is DATA.** Chunk 2 lifts scripts with their own tests and writes nothing; chunk 3
   replays migrations and writes rows on the replay, and it is the check every later DATA chunk's safety rests on.
2. **The kit (chunk 8) runs the real screens from `src/`, and the frozen prototype's screenshots are the release
   comparison's reference**, taken at the start of chunk 8 from the first commit's `prototype/` (before the kit changes
   it) into `design/0.1/prototype/` at 390 and 1280 px in both themes. Once the kit renders the real screens, nothing
   else records what the prototype looked like.
3. **react-router-dom stays** (Overload's `Nav.tsx` and `App.tsx` route with it; the kit renders `AppRoutes` under
   `MemoryRouter` as Overload's kit does); **date-fns goes** (`format.ts` covers dates, money, numbers, plurals and the
   build line's time with `Intl`).
4. **Fonts come from `@fontsource-variable/archivo` and `@fontsource-variable/jetbrains-mono` (5.3.0, OFL-1.1)**, one
   variable woff2 per family, imported in `global.css`; Vite emits them hashed and vite-plugin-pwa's `globPatterns`
   already names `woff2`, so the app shell caches them. The font-family names become `'Archivo Variable'` and
   `'JetBrains Mono Variable'` in the `@theme` block.
5. **No `playwright` dependency.** The kit's check uses the environment's Playwright (pre-installed in cloud sessions
   with its own Chromium; on a PC `npx playwright install chromium` once, said in the prototype skill); the zip's
   `clipping.mjs` already falls back to `PLAYWRIGHT_PATH`.
6. **Panel is Overload's `BottomSheet.tsx` whole on phones and a side panel on desktop; its portal target is the app
   frame's element (`WidthRoot`, through context), not `document.body`.** The kit's phone frame must keep overlays
   (SPEC item 3), `position: fixed` inside the frame's `transform` stays inside the frame, and in the real app the
   frame is the window, so nothing changes there.
7. **Database calls may live only in `src/**/*Service.ts`, `src/**/use*.ts` and `src/lib/supabase.ts`;** every other
   file under `src/` is a "screen file" for the no-database check. Sign-in therefore moves into
   `src/features/auth/authService.ts` (Overload calls `supabase.auth` inside `LoginPage.tsx`).
8. **The build line is a words-file function**, `settings.buildLine(version, hash, time)` →
   "Wersja 0.1.0 · build 3f9c2a1 · 06.11.2026 13:52"; the prototype writes it as literal text, which the words check
   forbids in `src/`.
9. **The app's name leaves the words file.** Name, short name, description, theme colour, icons and locale live in
   `app.config.ts` at the root, read by `vite.config.ts` (manifest, `index.html`) and given to the app as the define
   `__APP_CONFIG__`, read in one place, `src/lib/appConfig.ts`, the way `version.ts` reads `__APP_VERSION__`. One
   place per fact; the words file stays per-language.
10. **The words check:** outside `src/i18n/`, JSX text that contains a letter and a string literal given to a text
    attribute (placeholder, title, aria-label, alt, label …) fail; JSX text of punctuation, spaces and digits only
    passes (the "·" between build-line parts); test files are not scanned. Same parser as Overload's
    `check-wording.test.mjs`; the forbidden-word families are empty in the starter and the scanner is proven by the
    lifted call-pattern tests with a stand-in family.
11. **check-embeds: zero embeds is a pass** (Overload fails on zero because it has many; the lifted unit tests prove
    the scanner instead); live mode and the Adam-id filter go (the starter has no project).
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
    vite-plugin-pwa 1.3.0's client reloads the page the moment a new worker activates when no handler is given (read
    in `dist/client/build/react.js`: `if (onNeedReload) onNeedReload(); else window.location.reload()`). **The starter
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
24. **Sign-in keeps SPEC's wording as written:** one error line whatever Supabase says (an offline attempt shows it
    too), no offline strip on the sign-in screen (not in the prototype). Listed for the first app's vibe check.
25. **Tabs live in `src/shell/tabs.ts`**; the starter has Settings only; `/` and any unknown path go to the first tab
    (Overload's `*` → `/today`).
26. **No Supabase CLI in the repo or the environment:** the replay is Docker + psql in the container, Overload's way.
27. **Where Docker cannot pull the image (Fact 2), the replay-based checks are proven by the PR's `migration-replay`
    run**, and the reviewer reads that run the way `reviewer-data.md` reads the Supabase Preview runs; the builder
    says so in its report instead of skipping.
28. **The RULES.md sort (Fact 5, appendix):** general process rules fold into the standing sections they belong to;
    general code rules go to the `stack` skill; Overload-only rules are dropped; offline-queue rules are kept aside in
    `NEXT.md` under "Offline writing add-on". Each carries its source line.
29. **Agent definitions read the base branch, the default branch and whether the app has staging from `CONTEXT.md`
    "Repo facts"** (three named lines), never from the definition; until chunk 9, Overload's definitions are used with
    the coordinator's brief overriding `staging`/`master` with `main` and naming no staging check.
30. **Reference screenshots are committed as PNG** (≈ 76 files, ≈ 8 MB) in `design/0.1/prototype/`; Overload keeps its
    built captures the same way, and a comparison needs the pictures, not a rebuild.
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
    `using (true)` mistake reaches signed-in users only. Public tables keep the default select.
40. **verify-rls reads PostgREST's error code (`42501`), never the HTTP status:** the same refusal comes back as 401
    for `anon` and 403 for `authenticated` (seen on the replay).

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
  What it means for you: nothing to set up. For the build: chunk 3's break proofs (seven of them) each cost a push and a
  5-minute CI run instead of seconds, and the DATA reviewer cannot poke at the replayed database by hand; the chunk
  runs longer (≈ +0.5 h) and the proofs are weaker.
- Option B (**recommended**): **a free Docker Hub account of yours, with a read-only access token saved as a network
  secret on the starter's cloud environment** (host `auth.docker.io`, "basic" type: the secure form the session shows;
  the token never enters a chat or a file). Then pulls count against your account's 200 per 6 hours, not the shared
  address. Risk: the token can only pull public images. Also: the "Default" environment is shared by all your repos, so
  the starter gets its own personal environment at setup (the setup step creates it; nothing else changes).
- Option C: run the replay on your PC only (Docker Desktop), as Overload's release sheet does. Not enough for agents.
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

Everything else the plan decides itself (above). Two things SPEC already decided that a user would notice, listed for
the first app's vibe check, not reopened here: an offline sign-in attempt shows "Nieprawidłowy e-mail lub hasło" (SPEC:
one line whatever the message; see Decided 24), and a client app's repo is public (SPEC item 8, step 1; nothing in
this plan depends on it, and the template flow works for a private repo too).

## The three assumptions I am least sure of

1. **Chunk 6 fits a LIGHT chunk.** Adapting Overload's 596-line `BottomSheet.test.tsx` (40 tests) to the frame
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
  role: a real browser opens every DEMO state and fails on a page error or clipping, which jsdom cannot see (README).
  Written into RULES.md's lifted section by chunk 9.
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
- S24. SPEC item 8 step 1 makes a client app's repo public: nothing here depends on it (see the end of "Questions").

**Screen order (O):** every screen comes after what it needs.
- Sign-in needs the client, fonts, tokens and words (chunk 1), Button/TextField/InlineError, `useAuth` and
  `authService` (chunk 4) → built in chunk 4. The app frame needs `WidthRoot`, `AppShell`, tabs, the router, the
  offline strip and the theme → chunk 4. Settings needs the frame, `useTheme`, `version.ts`, `appConfig.ts`, sign-out
  → chunks 1 and 4.
- The Klienci list (kit example) needs Table, Badge, EmptyState, LoadError, ListRows, Toast, PageHeader, `format.ts`
  and the kit → chunks 4, 6, 8. The Klient form needs Panel, the three fields, ConfirmDialog, InlineError → 4, 6, 8.
  The design system page needs everything → chunk 8.
- Every DEMO state has one owner chunk: Sign-in ×3, New app ×1, Settings ×1 → chunk 4; Klienci ×6, Klient form ×7,
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
scripts/replay-migrations.sh  check-migration-order.mjs (+test)  check-migration.mjs  migration-rules.mjs (+test)
        check-embeds.mjs (+test)  check-embeds-local.sh  check-signups.mjs (+test)                           (2)
scripts/verify-rls.mjs (+test)  verify-rls-list.test.mjs  verify-rls-replay.sh  replay-tokens.mjs
        verify-rls-fixture/migrations/001_fixture.sql  verify-rls-fixture/access.json  verify-rls-fixture/seed.sql (3)
scripts/check-wording.test.mjs  check-tokens.test.mjs  check-screens-no-db.test.mjs                          (5)
scripts/cost-table.md  check-skills.test.mjs                                                                 (7)
scripts/check-context-size.mjs  check-agents.test.mjs                                                        (9)
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
SPEC.md  TASKS.md  CONTEXT.md  DECISIONS.md  LEARNINGS.md  NEXT.md  HISTORY.md  RULES.md                     (9)
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
  `"signed-in"` (every signed-in user of the app sees every row), `"public"` (anyone, signed out included). Empty
  (`{}`) in the starter. Read by `verify-rls.mjs` (the probes by kind), `verify-rls-list.test.mjs` (every `.from()` name
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

### Chunk 1 — Scaffold: the stack, tokens, fonts, the words file, the PWA

**Goal:** a new app's repo builds, tests, installs as a PWA that opens offline, bundles its fonts, reads its name and
colours from one config file and its version from `package.json`, and shows them.
**Type · size:** LIGHT · L. **Batch:** B0 with chunk 2.

**Scope**
- Root: `package.json` (version `0.1.0`; the stack above; scripts `dev`, `build` = `tsc -b && vite build`, `preview`,
  `typecheck`, `test` = `vitest run`, `check` = `node --test "scripts/*.test.mjs"`), `vite.config.ts` (the three
  defines and `__APP_CONFIG__`; `resolveBuildHash`, `resolveAppVersion`; `VitePWA` with `registerType: 'autoUpdate'`,
  `injectRegister: false`, `workbox.skipWaiting` and `clientsClaim` **with Overload's comment on why** kept word for
  word; manifest and `includeAssets` from `app.config.ts`; an `appHtml` plugin filling `index.html`'s title,
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
  `src/i18n/pl.ts` (the prototype's words, word for word, with Decided 8 and 9 applied) and its `Words` type,
  `src/features/pwa/pwaRegister.ts` and `useServiceWorker.ts` (Overload's: the record, `onNeedReload` records only,
  the hourly and foreground checks, the bare-registration fallback; the update screen's readers dropped),
  `src/hooks/useOnlineStatus.ts` (Overload's), `src/styles/tokens.css` and `src/styles/global.css` (the prototype's;
  the Google `@import` replaced by the two fontsource imports and the `@theme` font names, Decided 4).
- `scripts/check-build.mjs` (new; Decided 16) and `scripts/vercel-ignore.test.mjs` (Overload's; init branch `main`).
- The Fact 4 run, once, recorded in the report (not a standing script): build A, serve `dist/` on 127.0.0.1, open in
  Playwright, wait for the worker; change one visible word, build B into the same folder, call
  `registration.update()`, wait for the new worker's `activated`; assert a sentinel set on `window` before is still
  there (no reload), no console error; reload; the new word shows.

**Lifts (Overload):** `package.json`, `vite.config.ts`, `index.html`, `tsconfig.json`, `tsconfig.app.json`,
`tsconfig.node.json`, `vitest.config.ts`, `vitest.setup.ts`, `vercel.json`, `.gitignore`, `.env.example`,
`.claude/launch.json`, `src/main.tsx`, `src/vite-env.d.ts`, `src/lib/supabase.ts`, `src/lib/queryClient.ts`,
`src/lib/version.ts`, `src/lib/version.test.ts`, `src/features/pwa/pwaRegister.ts`,
`src/features/pwa/useServiceWorker.ts`, `src/hooks/useOnlineStatus.ts`, `scripts/vercel-ignore.test.mjs`.
**Lifts (prototype):** `src/styles/tokens.css`, `src/styles/global.css`, `src/lib/format.ts`, `src/i18n/pl.ts`.
**Depends on:** nothing. **Prototype screens:** none (the Settings build line's format only).

**Verification**
- `npm run typecheck`, `npm run build`, `node scripts/check-build.mjs` (dist has `skipWaiting`/`clients.claim` in
  `sw.js`, both woff2 files in the precache manifest, no `fonts.googleapis.com` anywhere, no dynamic chunk but
  workbox-window), `npm test` (`version.test.ts`, `format.test.ts`: Polish date `06.11.2026`, money `12 480,50 zł`,
  plural one/few/many, `formatDateTime`), `node --test "scripts/*.test.mjs"` (`vercel-ignore`), `npm run dev` opens.
- Break proofs, one per call pattern (`cp` backups, never `git checkout --`): remove `skipWaiting: true` → check-build
  fails on `sw.js`; remove one fontsource import → check-build fails on the precache; set `"version": "x"` → the build
  refuses (`resolveAppVersion`); add a `React.lazy` route in a scratch copy → check-build fails on the extra chunk;
  put `.md` in the ignore command's exclusions wrongly → `vercel-ignore.test.mjs` fails.
- The Fact 4 run above, its outcome in the report.
- **Would not catch:** a real Vercel deploy (no project yet; Overload's "Checks that lied" 8 and 9 say only a deploy
  finds ESM and env problems; the first app's checklist step 5 is the first real deploy); the worker's behaviour across
  two real deploys (done once by hand here, not standing); the look of anything (no screens yet).

**Done when:** the commands above are green, the five breaks each failed on the right check and were restored, the
Fact 4 run is in the report with its outcome, and the commit `chunk 1 complete` is pushed with its PR into `main`.

### Chunk 2 — Migrations and the replay

**Goal:** `supabase/` exists with sign-ups off and e-mail sign-in on, the access list is there, every migration safety
script from Overload runs green on a repo with no migrations and fails on the right things, the sign-ups check exists,
and `migration-replay` runs on every PR into `main`.
**Type · size:** LIGHT · M (Decided 1). **Batch:** B0 with chunk 1 (shares no file with it: nothing under `src/`, no
`package.json` change; its tests are node-only).

**Scope**
- `supabase/config.toml` (Overload's; `project_id = "starter"`; `[auth] enable_signup = false`; `[auth.email]
  enable_signup = true` with the one-line comment on the trap; `[db] major_version = 17`; `[db.seed] enabled = false`;
  no `[remotes]`, Decided 15), `supabase/.gitignore` (Overload's), `supabase/migrations/.gitkeep`,
  `supabase/access.json` (`{}`), `supabase/postgres-image` (`supabase/postgres:17.6.1.155`).
- `scripts/replay-migrations.sh` (Overload's; image from the file above; zero files is OK when `access.json` is empty,
  exit 2 when it is not, Decided 12; `--keep` and `--snapshot` kept, the snapshot SQL dropped with schema compare),
  `scripts/check-migration-order.mjs` + `.test.mjs` (Overload's; the `000_v1_baseline.sql` exemption dropped; base
  `origin/main`), `scripts/check-migration.mjs`, `scripts/migration-rules.mjs`, `scripts/migration-rules.test.mjs`
  (Overload's, verbatim: the safe list is the whole point and its tests prove it), `scripts/check-embeds.mjs` +
  `.test.mjs` + `scripts/check-embeds-local.sh` (Overload's; Decided 11; `src` only, no `api`),
  `scripts/check-signups.mjs` + `.test.mjs` (new: parses `config.toml` and `access.json`; fails when any key is
  `signed-in` and `[auth] enable_signup` is not `false`; fails when `[auth.email] enable_signup` is `false` whatever the
  tables, Decided 31; passes otherwise; the TOML read is the two keys by regex over the two sections, no TOML
  dependency), `.github/workflows/migration-replay.yml` (Overload's; `branches: [main]`; the order check, the replay,
  the embeds; chunk 3 adds its step).

**Lifts (Overload):** `supabase/config.toml`, `supabase/.gitignore`, `scripts/replay-migrations.sh`,
`scripts/check-migration-order.mjs`, `scripts/check-migration-order.test.mjs`, `scripts/check-migration.mjs`,
`scripts/migration-rules.mjs`, `scripts/migration-rules.test.mjs`, `scripts/check-embeds.mjs`,
`scripts/check-embeds.test.mjs`, `scripts/check-embeds-local.sh`, `.github/workflows/migration-replay.yml`.
**Depends on:** nothing (merges after chunk 1). **Prototype screens:** none.

**Verification**
- `node --test "scripts/*.test.mjs"` green (migration-rules, order, embeds, signups); `node scripts/check-migration.mjs
  origin/main` → "no migration changes", exit 0; `node scripts/check-migration-order.mjs origin/main` → OK with zero
  files; `node scripts/check-signups.mjs` → ok; `node scripts/check-embeds.mjs --list` → zero embeds, exit 0;
  `bash scripts/replay-migrations.sh` → "0 of 0 applied, access list empty" where Docker can pull, else the PR's
  `migration-replay` run read and quoted (Decided 27; the builder starts `dockerd --iptables=false --ip6tables=false &`
  first and reports what the pull answered).
- Break proofs, one per rule: a scratch `access.json` with a `signed-in` key and `enable_signup = true` → check-signups
  fails; `[auth.email] enable_signup = false` → fails; a scratch migration with `alter table x drop column y` →
  `classify` flags it (the lifted test); two files sharing `002_` → the order check flags; a scratch `access.json` with
  a key and no migration → the replay exits 2; the workflow: the PR shows a `migration-replay` run that ran all three
  steps and passed on zero migrations.
- **Would not catch:** a migration that is on the safe list but wrong in meaning (the rules check data safety only,
  as Overload's comment says); the image tag's truth until the checklist sets it from the app's project; **production's
  sign-up setting** (Fact 3: `config.toml` does not reach the hosted project; the checklist's step 2 and its probe do);
  the sign-ups rule for an app whose tables are all `own` (then sign-ups on is allowed by SPEC Rule 5 and the check
  stays silent by design).

**Done when:** the scripts and tests above are green on the branch, the six breaks each failed on the right check, the
PR's `migration-replay` run passed, and `chunk 2 complete` is pushed with its PR into `main`.

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
- `scripts/replay-auth-functions.sql` (the Auth service's `uid()`, `role()`, `email()` and `jwt()` lifted verbatim
  from `supabase/auth` migrations `20220224000811_update_auth_functions.up.sql` and
  `20220531120530_add_auth_jwt_function.up.sql`, the `{{ Namespace }}` placeholder written as `auth`, each with its
  source named in a comment; Decided 13), `scripts/replay-tokens.mjs` (new; Node `crypto` HS256; `anon`, and one
  `authenticated` token per user id, `aud` `authenticated`, one-hour `exp`), `scripts/verify-rls-replay.sh` (new,
  from `check-embeds-local.sh`'s shape: `replay-migrations.sh --keep` (with `--fixture` also replaying
  `scripts/verify-rls-fixture/migrations/` and `seed.sql`); then as `supabase_admin` the auth functions and
  `alter role authenticator with password`; PostgREST from `postgrest/postgrest:v12.2.3` connected as
  `authenticator` with the secret, `PGRST_DB_ANON_ROLE=anon`, `PGRST_DB_SCHEMAS=public`; then `verify-rls.mjs`
  against it; psql queries for "RLS on" (`pg_class.relrowsecurity`) and the grants
  (`information_schema.role_table_grants`) per listed table; cleans up).
- `scripts/verify-rls.mjs` (Overload's, generalized): the lists replaced by `supabase/access.json` (the fixture's with
  `--fixture`); the client from URL + anon token + a user's token in `global.headers`; per kind: `own` → as B, a
  head-only server-side count of rows not B's (Overload's count, never fetched rows) must be 0 and as A the own-rows
  count ≥ 1 (the fixture guarantees rows, so "0 rows" cannot pass vacuously); `signed-in` → as B the count of A's rows
  ≥ 1, as anon zero rows or permission denied; `public` → as anon count ≥ 1; every kind: RLS on and the grants as
  Decided 14 (owner's own-rows 42501 = FAIL); FAIL on any other error, exactly Overload's "could not ask ≠ refused";
  `verify-rls.test.mjs` (Overload's `classifyProbe` tests, per kind). `scripts/verify-rls-list.test.mjs` (Overload's
  `verify-rls-tables.test.mjs` and `verify-rls-ahead.test.mjs` as one file: every literal `.from()` in `src/` has a
  key, every key is used by a `.from()`, an embed or a `.rpc()` (Overload's parser), every `create table`/`create
  view` in `supabase/migrations/` has a key and every key is created there; dynamic `.from(variable)` calls are listed
  by name as Overload lists its two; with everything empty the test asserts zero on all four counts and proves the
  scanners on fixture sources, S3).
- `scripts/verify-rls-fixture/`: `migrations/001_fixture.sql` (three tables `fx_own`, `fx_shared`, `fx_public` with
  `user_id references auth.users`, RLS enabled, the policies each kind needs (`own`: `for all using (user_id =
  auth.uid()) with check (…)`, Overload's 002; `signed-in`: `for select to authenticated using (true)` and writes
  with `user_id = auth.uid()`; `public`: `for select using (true)`), `grant select` to `authenticated` and, for
  `fx_public`, to `anon`, and `revoke all … from anon` on the first two (Decided 39)), `access.json` (the three
  kinds), `seed.sql` (two `auth.users` rows A and B, rows for both in each table).
- `.github/workflows/migration-replay.yml`: two steps added: `verify-rls-replay.sh --fixture` (the self-test, always)
  and `verify-rls-replay.sh` (the app's list; in the starter "0 tables, list empty, no `.from()` in src", a pass).

**Lifts (Overload):** `scripts/verify-rls.mjs`, `scripts/verify-rls.test.mjs`, `scripts/verify-rls-tables.test.mjs`,
`scripts/verify-rls-ahead.test.mjs`, `scripts/check-embeds-local.sh` (as the shape of the replay wrapper),
`supabase/migrations/002_v2_rls_policies.sql` (the policy shape for `own`), `000_v1_baseline.sql` (the grant lines).
**Lifts (Supabase Auth, `supabase/auth`):** `migrations/20220224000811_update_auth_functions.up.sql`,
`migrations/20220531120530_add_auth_jwt_function.up.sql`.
**Depends on:** chunk 2 (branches off 2's branch beside B0's review; rebases on `main` after 2 merges; adds files only).
**Prototype screens:** none.

**Verification (DATA: one break proof per place that writes or decides)**
- `bash scripts/verify-rls-replay.sh --fixture` → 3 tables, every probe PASS, "RLS on" and grants listed; `bash
  scripts/verify-rls-replay.sh` → 0 tables, pass with the empty-list line; `node --test "scripts/*.test.mjs"` green;
  the PR's `migration-replay` run shows both steps green. Where the image cannot be pulled in the session, every proof
  below runs through the PR's run (Decided 27; Q1 says what that costs) and the report says so.
- Break proofs on scratch copies of the fixture (restore from `cp`): (1) drop `fx_own`'s policy → LEAK on `own`;
  (2) remove `grant select … to authenticated` on `fx_own` → the owner probe FAILS, never PASS; (3) give `fx_shared`
  the `own` policy → the `signed-in` probe FAILS (B cannot see A's rows); (4) `using (true)` plus a grant to `anon` on
  `fx_own` → the signed-out probe LEAKS; (5) `fx_public` without its anon grant → FAIL (not a silent pass);
  (6) a key in `access.json` that no migration creates → the list test fails; (7) a `.from('x')` in a scratch
  `src/` file with no key → the list test fails; (8) a wrong JWT secret → every signed-in probe FAIL, none PASS;
  (9) the auth-functions step skipped → the owner probes FAIL on "0 own rows" (never PASS); (10) PostgREST
  connected as `postgres` instead of `authenticator` → the harness's own check fails (`safeupdate` unset in the
  session), because the replay must run as the role a hosted project runs.
- **Would not catch:** the hosted project's actual policies when they differ from the repo's SQL (the replay checks
  the repo; Overload ran verify-rls on staging for the live side, which the client-ready build's staging scripts bring
  back); the Auth service's function bodies moving with its versions (the replay applies today's; the staging check
  will see the real ones); functions (`security definer` RPCs are not probed; Overload's note on `v2_apply_ops`);
  grants narrower than `select` (insert/update/delete are not probed); column-level privileges; a policy that is
  right for `auth.uid()` but wrong for a future `role` kind.

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
- `src/shell/AppShell.tsx` (the prototype's `Shell.tsx`: side menu with the app's name tile and the signed-in line;
  Overload's `Nav.tsx` tab bar: `NavLink`, icon over label, the lit tab in the accent, safe-area padding; labels in
  sentence case; the install prompt and the Coach gate dropped), `src/shell/PageHeader.tsx` (the prototype's),
  `src/shell/tabs.ts` (Decided 25: Settings only).
- `src/features/auth/useAuth.tsx` (Overload's: the context, `getSession`, `onAuthStateChange` clearing the query cache
  on a user change; Dexie's wipe dropped), `src/features/auth/authService.ts` (new: `signIn(email, password)` and
  `signOut()` around `supabase.auth`, Decided 7), `src/features/auth/LoginPage.tsx` (the prototype's `SignIn.tsx`
  layout with Overload's submit flow: pending disables, the error is `t.signIn.wrong` whatever the service threw,
  no sign-up control; the tile, the words from `pl.ts`).
- `src/features/settings/useTheme.ts` (Decided 23) and `SettingsPage.tsx` (the prototype's `Settings.tsx`: Account
  row with the e-mail and Wyloguj się, the theme radio group, the build line through `t.settings.buildLine`, Decided 8;
  Overload's `SettingsPage.tsx` ACCOUNT and APPEARANCE sections are the lifted behaviour: sign-out's pending state and
  the theme applied through `<html>`).
- `src/App.tsx` (Overload's shape: `AuthProvider`, `BrowserRouter`, exported `AppRoutes`; the loading spinner through
  tokens, S22; signed out → `LoginPage` on every path; signed in → `WidthRoot` → `AppShell` with the offline strip as
  its banner (`useOnlineStatus`) → routes from `tabs.ts`, `/` and `*` to the first tab; the theme applied above
  everything).
- Tests (jsdom per file, Overload's docblock way): `LoginPage.test.tsx` (two different thrown messages both show
  `t.signIn.wrong` and never the raw message; pending disables both fields and the button; no sign-up control exists),
  `AppShell.test.tsx` (`data-layout` is `phone` at 899 and `desktop` at 900 through a stubbed `ResizeObserver` and
  `clientWidth`; the one tab renders; the lit tab carries `aria-current`), `useTheme.test.ts` (writes and reads the
  key; `system` removes `data-theme`; a storage that throws leaves `system` and does not crash),
  `SettingsPage.test.tsx` (the radio writes the theme; the build line reads the four defines; sign-out calls the
  service and shows the pending word), `App.test.tsx` (Overload's shape: signed out shows the sign-in page on `/x`;
  signed in `/` goes to `/settings`; `*` too).

**Lifts (Overload):** `src/components/Nav.tsx`, `src/components/Nav.test.tsx` (shape), `src/features/auth/useAuth.tsx`,
`src/features/auth/LoginPage.tsx` (the flow), `src/features/settings/SettingsPage.tsx` (ACCOUNT, APPEARANCE),
`src/App.tsx` (the shell shape, the spinner), `src/App.test.tsx` (shape).
**Lifts (prototype):** `src/components/ui.tsx`, `src/lib/useWide.tsx`, `src/shell/Shell.tsx`, `src/screens/SignIn.tsx`,
`src/screens/Settings.tsx`.
**Depends on:** chunk 1 (merged). **Prototype screens:** Sign-in (normal, wrong password, signing in); App frame, new
app (signed in); Settings (normal); each at 390 and 1280 px, light and dark.

**Verification**
- The tests above, one break per call pattern: the error mapping (show the raw message → the test fails), the 900 px
  switch (`WIDE_FROM` 901 → the 900 case fails), the theme write (skip the write → fails), the route redirect.
- `npm run typecheck`, `npm run build`, `node scripts/check-build.mjs`, `npm test`; chunk 5's three checks run on the
  merged tree at the batch review (a hit there is chunk 4's to fix in the rebase, not the check's).
- **Would not catch:** a real Supabase sign-in (no project; the first app's checklist step 5 is the first real one);
  layout at real widths (jsdom has no layout; chunk 8's kit check and the release comparison do); safe-area insets on a
  real phone; the offline strip's timing on a real connection loss.

**Done when:** tests and build green, the four breaks failed and were restored, and `chunk 4 complete` is pushed with
its PR into `main`.

### Chunk 5 — The code checks: tokens, words, no database in screens, no prototype imports

**Goal:** SPEC Rules 2 and 4 and BUILD.md's Tasks rule 10 become checks: a typed-in colour, text size or radius fails;
a word shown on screen that is not from the words file fails; a database call outside service and hook files fails;
an import from `prototype/` in `src/` fails.
**Type · size:** LIGHT · M. **Batch:** B1 with chunk 4 (built after chunk 3's review ends; shares no file with 4).

**Scope**
- `scripts/check-wording.test.mjs` (Overload's scanner and call-pattern tests lifted; `FAMILIES` empty with the
  starter's note; the call-pattern tests run with a stand-in family so the scanner stays proven; **new rule** per
  Decided 10, with its own call-pattern tests: JSX text with a letter, a literal in a text attribute; passes:
  punctuation-only text, `{t.x.y}` expressions, `className`, `data-*`, query arguments, imports; `src/i18n/` and test
  files not scanned; an `ALLOWED` list with reasons, empty).
- `scripts/check-tokens.test.mjs` (new): over `src/**/*.{ts,tsx,css}` except `tokens.css`: Tailwind arbitrary values
  for colour, text size and radius (`bg-[#…]`, `text-[#…]`, `border-[#…]`, `text-[Npx|rem]`, `rounded-[…]`,
  `shadow-[…]`), inline `style` with `color`/`background`/`fontSize`/`borderRadius` literals, any hex, `rgb(`, `hsl(`
  in CSS or TSX; passes: widths, heights, paddings, margins, gaps ("layout widths may be typed in"), `var(--…)`,
  `env(…)`, `calc(…)`; an `ALLOWED` list with reasons (e.g. `Table.tsx`'s skeleton widths are percentages: layout).
- `scripts/check-screens-no-db.test.mjs` (new): `.from(`, `.rpc(`, `supabase.` allowed only in files matching Decided
  7; every other file under `src/` fails; and no `src/` file imports a path containing `prototype/` (Tasks rule 10).
- Each file: fixture call-pattern tests (one source per way a hit can occur, beside the near-misses that must pass) and
  a tree test with a "the scan read the tree" guard (≥ 5 scanned files on chunk 1's tree; raised to ≥ 20 by chunk 8).

**Lifts (Overload):** `scripts/check-wording.test.mjs` (the scanner: `scanSourceFull`, `isScanned`, the attribute
lists, `looksLikeCode`, `isQueryArgument`, the call-pattern tests, the ALLOWED mechanism and its "no stale entry" test).
**Depends on:** chunk 1. **Prototype screens:** none.

**Verification**
- `node --test "scripts/*.test.mjs"` green on the branch (chunk 1's tree). Break proofs on scratch copies: plant
  `text-[13px]`, `bg-[#f00]`, `style={{ color: '#f00' }}`, a hex in `global.css` → tokens fails on each; plant JSX
  "Zapisz" and `placeholder="Szukaj"` → words fails on each, while `<p>·</p>` and `placeholder={t.a.b}` pass;
  plant `supabase.from('x')` in a `.tsx` and in `foo.ts` → no-db fails on each, while `fooService.ts` and `useFoo.ts`
  pass; plant `import x from '../../prototype/src/demo/demoStore'` → fails.
- At the batch review: all three on the merged tree with chunk 4 → zero hits.
- **Would not catch:** a colour or word computed at runtime (`style={{ color: v }}`, a word joined from pieces); a
  hex inside an SVG file; a table name reaching `.from()` through a variable (the list test names dynamic calls); a
  word in an `aria-label` built by a function outside `src/i18n/` (the function's file is scanned, the call is not).

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
  from the right with the same parts in the same order (the prototype). `Panel.test.tsx`: Overload's
  `BottomSheet.test.tsx` (40 tests) adapted: "drawn straight into the body" becomes "into the frame element"; a new
  pair asserting the desktop and phone shapes carry the same parts in order.
- `src/components/ConfirmDialog.tsx` (Overload's props and layout: centred, 380 px at most, the two buttons side by
  side, red when `danger`, `pendingLabel`; tokens; the labels come from the caller, as the prototype's does) +
  `ConfirmDialog.test.tsx` (Overload's five tests).
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
  screen), ConfirmDialog's five, Table (six skeleton rows while loading, zero otherwise; `onRowClick` gets the row;
  `aria-busy`), Toast (clears at 3 s with fake timers), EmptyState/LoadError (the reason line reads
  `Nie udało się wczytać: listy klientów. Powód: …`), ListRows; one break per call pattern (the portal target →
  render into `document.body` and watch the frame test fail; the scroll lock count; the retry callback).
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
  Overload-only term (meso, run, Coach, Northstar, staging account) is in either skill (a grep in the report).
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
  `design/0.1/prototype/` and committed (19 states × 2 widths × 2 themes = 76 PNG).
- Then the kit: `prototype/vite.config.ts` (Overload's `fakeDataLayer` plugin: `REPO` resolved to its real path (L4),
  `SWAPS` = `lib/supabase.ts` → `fakes/supabase.ts` (the pending proxy), `features/auth/useAuth.tsx` →
  `fakes/useAuth.tsx`, `features/auth/authService.ts` → `fakes/authService.ts` (sign-in resolves or rejects by the
  DEMO state), `hooks/useOnlineStatus.ts` → `fakes/useOnlineStatus.ts`, `features/settings/useTheme.ts` →
  `fakes/useTheme.ts` (the demo store's theme); `OVERRIDDEN` empty (L5: each spec chat starts it empty); the `@app`
  alias; the four defines; the single-file build), `prototype/override.mjs`, `inline.mjs`, `index.html`,
  `tsconfig.json` (Overload's), `prototype/src/index.css` (the L6 restatement, importing `../../src/styles/*`),
  `prototype/src/main.tsx` (seed, then render), `prototype/src/App.tsx` (the DEMO button and menu around the real
  `AppRoutes` under `MemoryRouter`, inside the real `WidthRoot`; the phone frame = the zip's App frame; the example
  screens mounted as extra routes the DEMO menu reaches), `demo/DemoMenu.tsx` and `demo/demoStore.ts` (the zip's,
  Overload's lifted: the 19 states, THEME, WIDTH → PHONE FRAME, the "New app: what you get" state, the example labels),
  `demo/seed.ts` (the Klienci fixture into the real query cache under the example hook's key; `retry: false`),
  `examples/clients/` (the zip's `Clients.tsx` and `ClientForm.tsx` rewired to `src/` components, `useClients.ts`
  subscribing to the cache (Decided 34), `clientsService.fake.ts` whose save resolves, rejects or stays pending by the
  DEMO state, `fixtures.ts`), `examples/words.ts` (Decided 19), `screens/DesignSystem.tsx` (the zip's, rewired),
  `check/run.sh` and `check/clipping.mjs` (the zip's; every state screenshotted in both themes), `README.md`
  (Overload's, rewritten for the starter: how it works, the commands from the root, "publish only after a clean run and
  look at the screenshots"), the zip's `package.json`/`package-lock.json` removed (Decided 20); root `package.json`
  gains `proto:check`.
- `.claude/skills/prototype/SKILL.md` (trigger: "when building or changing anything under `prototype/`"): the README's
  content, L1 (every state checked in a real browser at phone size and both themes before Adam sees it), L4 (the swap
  plugin, the real-path trap, the cache subscription), L6 (the host page's unlayered styles), the check before
  publishing, the example screens' labels ("Example screen, not in the starter"), where the environment's Playwright
  is (Decided 5).

**Lifts (Overload):** `prototype/vite.config.ts`, `prototype/override.mjs`, `prototype/inline.mjs`,
`prototype/src/index.css`, `prototype/src/main.tsx`, `prototype/src/App.tsx` (the shape), `prototype/src/demo/seed.ts`
(the shape), `prototype/src/fakes/supabase.ts`, `prototype/src/fakes/useAuth.tsx`, `prototype/src/fakes/useOnlineStatus.ts`,
`prototype/README.md`, `LEARNINGS.md` (L1, L4, L5, L6).
**Lifts (prototype, the zip):** everything under `prototype/` as committed: `src/demo/*`, `src/screens/Clients.tsx`,
`src/screens/ClientForm.tsx`, `src/screens/DesignSystem.tsx`, `src/App.tsx` (the phone frame), `check/*`, `inline.mjs`.
**Depends on:** chunk 6 merged (Panel, Table, Toast, EmptyState, LoadError, ListRows), chunk 4. **Prototype screens:**
all 19 DEMO states (the kit must show every one, both widths, both themes).

**Verification**
- `npm run proto:check` exits 0: no page errors, no clipping at 390 and 1280 px in light and dark, 76 screenshots in
  `prototype/check/shots/`, the DEMO menu lists 19 states (a count asserted in `clipping.mjs`'s output).
- `scripts/check-screens-no-db.test.mjs` (chunk 5) on `src/` still zero (the kit imports from `src/`, never the
  reverse); a new node test `prototype/check/kit.test.mjs`: `prototype/src` holds no copy of a `src/components`,
  `src/shell` or `src/styles` file (the kit renders the real ones), and the swap list names exactly the five modules.
- Break: remove the `lib/supabase.ts` swap → the kit's build throws Overload's "Missing Supabase env vars" (the real
  client refuses without env), proving the swap is load-bearing; remove the cache subscription in `useClients` → the
  "Saved" state's list stops updating (the DEMO state test catches it by a page error or a missing row).
- The reference set exists: 76 files in `design/0.1/prototype/`, taken from the first commit's prototype (the commit
  id in the report).
- **Would not catch:** differences from the published page "Starter Prototype" (Adam's reference; the committed source
  is this plan's); behaviour the fakes cannot show (a real sign-in); the real app's look drifting from the kit's: by
  construction impossible, they are the same components.

**Done when:** the check is clean, the kit test and the chunk 5 checks are green, the two breaks failed and were
restored, the reference set is committed, the README and the skill are in, and `chunk 8 complete` is pushed with its
PR into `main`.

### Chunk 9 — Agent definitions and the repo files

**Goal:** the starter's own `.claude/agents/` and the repo's record files, with RULES.md's general sections lifted and
the discovered-rule sections empty.
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
- `RULES.md`: Index; Escalation (Overload's general items: SPEC ambiguity, scope, a failed deploy, a flagged migration
  without staging, a login needed, anything irreversible or spending money, two documents disagreeing, data the check
  needs not existing, UI outside the design system; Overload's Coach, Northstar, SQL-Editor and Adam's-data items
  dropped); Reviewer rules; Verification by chunk type (with C2's kit line); Usage; Decision cards; The build loop
  (the base branch from CONTEXT.md; "Where chunks go" written for an app without staging and one with); Models (the
  table); "Rules discovered during builds" and "Checks that lied" empty; the GENERAL-PROCESS folds from the appendix
  applied into the standing sections, each with its Overload line in a trailing "(Overload RULES.md Lnnn)".
- `DECISIONS.md` (Overload's header: the entry format, "a record, not an inbox"), `LEARNINGS.md` (Overload's header:
  the verdict rule), `NEXT.md` ("Planned, not built" first; then "Offline writing add-on: rules kept aside", the
  OFFLINE-ADDON lines of the appendix; then "Client-ready build" with S23's crash screen), `HISTORY.md` (header),
  `CONTEXT.md` (exists since the planning session; this chunk checks its shape against the agent definitions'
  "Repo facts" labels and its size), `scripts/check-context-size.mjs` (Overload's), `scripts/check-agents.test.mjs`
  (new: no agent definition names `1.2.1`, `master`, an Overload-only script, or a staging step outside a
  `Staging: yes` condition; each reads its branches from CONTEXT.md's labels, which exist).

**Lifts (Overload):** `.claude/agents/builder.md`, `.claude/agents/reviewer-data.md`, `.claude/agents/reviewer-light.md`,
`RULES.md` (lines 1–160 and the GENERAL-PROCESS lines of the appendix), `DECISIONS.md` and `LEARNINGS.md` and
`HISTORY.md` and `NEXT.md` (their headers and shape), `CONTEXT.md` (shape), `scripts/check-context-size.mjs`.
**Depends on:** nothing merged; it applies the same appendix as chunk 7 (B2), so B3's review checks the two agree;
nothing in code. **Prototype screens:** none.

**Verification**
- `node scripts/check-context-size.mjs` ok; `node --test "scripts/*.test.mjs"` (check-agents green); breaks: write
  `master` into `builder.md` → fails; remove the `Base branch:` line from CONTEXT.md → fails; add a staging smoke
  outside the condition → fails. The reviewer reads the three definitions end to end against the user's standing rules
  (this file's head) and RULES.md against Overload's lines 1–160.
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
  to run from and timing at the top; per step the cmd commands, Expect, Stop if): (1) GitHub: a new public repo from
  the starter template, cloned; (2) Supabase: a new project in the app's organization, EU region (it cannot be moved
  later), sign-ups off in the dashboard with e-mail sign-in left on, the first user added; Expect: the project's
  `/auth/v1/settings` (a `curl` with the anon key) shows `"disable_signup":true` and `"external":{"email":true…}`
  (Decided 15); (3) the Supabase → GitHub link on the default branch, so migrations deploy by themselves; Expect: the
  link shows `main` and "migrations"; (4) Vercel: a new project from the repo with `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`; Expect: a Ready deploy; (5) the app opens on its Vercel address and the first account signs
  in; Stop if: the sign-in page says the one error line. After step 5, the hand-off to agents: the project's Postgres
  version into `supabase/postgres-image`, `app.config.ts` filled, the environment for the app's sessions (Q1's hosts
  and secret), the first build's TASKS. What is on Adam is only what needs production access or his consent (RULES
  "Pages for me").
- `scripts/build-checklist-page.mjs` (new) + `.test.mjs`: renders the markdown to `docs/new-app-checklist.html`:
  every ```cmd block becomes a command box with a copy button (the Clipboard API; a fallback that selects the text),
  "Expect:" and "Stop if:" paragraphs become the two boxes, each step a tick-box; the fields that fill placeholders
  (`<project-ref>`, `<vercel-url>`) are inputs whose value is substituted into the commands on the page. Progress:
  ticks and field values are saved to the artifact database when the page runs as a published artifact
  (`window.claude` present) and to the browser's storage otherwise, every access in try/catch (S17). The page is static
  HTML with tokens inline (the starter's light and dark values), no external resource. The test: every cmd block in
  the markdown appears verbatim in the HTML (copied by script, never retyped: "Pages for me"), every step has both
  boxes, the HTML is regenerated from the markdown (a hand edit to the HTML fails the test).
- A Playwright check in the test: the page at 390 and 1280 px has no element cutting off its content (the kit's
  `findClipped` reused as a module) and a copy button puts its command on the clipboard.

**Lifts (Overload):** `docs/release-1.2.1-run-sheet.md` (the shape: cmd, Expect, Stop if, "never paste a key"),
`RULES.md` "Pages for me" (the rules of the page), `prototype/check/clipping.mjs` (`findClipped`).
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
   → `prototype/check/shots/` (76) against `design/0.1/prototype/` (76), side by side, every state, 390 and 1280 px,
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
5. **The tag `v0.1.0`** with the notes (Q2 decides who pushes it); the GitHub Release if the API allows it.
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
   after `docker run`. **So:** the replay family runs in GitHub Actions on every PR regardless; in a cloud session it
   runs whenever the shared hour's quota has room, and always with a Docker Hub token (Q1). The builder and reviewer
   definitions say so (chunk 9; Decided 27).
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
   scratch and its client read: in `autoUpdate` mode, on the new worker's `activated` with `isUpdate`, it calls
   `onNeedReload()` when given and `window.location.reload()` otherwise. So the starter keeps Overload's handler
   (records, never reloads); a new version then installs in the background and is used at the next open, with no
   banner. "No half-updated page" rests on having no lazy chunks: the starter has none but workbox-window, loaded at
   start, and `check-build.mjs` keeps it so. **The behaviour across two builds is run once in chunk 1** (its Fact 4
   run) and recorded.
5. **Which RULES.md rules and "Checks that lied" are general.** *Done here:* the appendix at the end sorts every entry
   of Overload's RULES.md from line 161 on into GENERAL-PROCESS, GENERAL-CODE, OFFLINE-ADDON, STAGING-RELEASE and
   OVERLOAD-ONLY, each with its source line; chunk 7 (the stack skill) and chunk 9 (RULES.md's folds, NEXT.md's
   add-on list) apply it; its "Doubtful" list is the reviewer's checklist.
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
  `master` in them are Overload's and do not apply. From chunk 9 the starter's own.
- **Models and effort.** Coordinator Opus medium; builders Sonnet at the highest coding effort (Opus after two
  behaviour failures); DATA reviewer Opus max, fresh per chunk; LIGHT batch reviewer Sonnet high. Up to three agents
  at once.
- **Batches.** B0 {1, 2}, chunk 3 alone, B1 {4, 5}, B2 {6, 7}, B3 {8, 9, 10}; merges in this file's order; a batch
  holds only chunks that share no files and depend on nothing unmerged; the next builder starts beside a running
  review when the two share no files (the schedule above).
- **Records.** The coordinator writes CONTEXT.md's "Where the build is" line at every merge with the meter's dollars
  and hours against the estimate (the 30% rule after chunk 1), HISTORY.md's long form, DECISIONS.md's cards and tests
  owed, LEARNINGS.md's lessons (the files exist from chunk 9; before it, the same records go into CONTEXT.md's
  "Where the build is" and a `docs/build-0.1-record.md` the chunk 9 merge moves into HISTORY.md).
- **Cards and limits.** A decision card for anything SPEC leaves open or a prototype state that contradicts SPEC; a
  push notification for every card and limit stop; the hourly scheduled task that resumes the build after a limit;
  full speed always.
- **The Overload clone.** Read-only, at `../overload-v2`, `git checkout 8e00877`; never pushed to; every lift names
  its file in the chunk's commit message.

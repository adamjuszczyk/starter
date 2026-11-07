# Starter 0.1.0: release notes

The starter is the template repo every new app starts from. It holds the stack, a design system, the prototype kit, the shared scripts, the skills and the agent definitions, already working. It has no business features and no business screens. Everything that exists in Overload is lifted from it (`adamjuszczyk/overload-v2`, commit `8e00877`); only what Overload lacks is new.

## What the starter holds

SPEC.md's eight items, and where each lives.

1. **Stack setup.** Vite, React 19, TypeScript, Tailwind v4, Supabase client, TanStack Query, a PWA that opens offline and updates at the next open (no update banner). App name, icons and colours come from `app.config.ts`. The app frame (side menu from 900 px of the app's own width, bottom tabs below), sign-in with its three failures (wrong, offline, failed) and Settings (theme per device, the build line) are real screens. Fonts are bundled, not loaded from Google. Lives in `src/`, `public/`, `vite.config.ts`, `app.config.ts`, `package.json` (version 0.1.0).
2. **Design system.** Tokens for colours, text sizes, radii, scrim and shadow in `src/styles/tokens.css`, mapped onto Tailwind in `global.css` (Tailwind's own colours, sizes and radii are off, so only token classes exist). Components in `src/components/`: Button, fields, Badge, OfflineStrip, InlineError, Panel, ConfirmDialog, Table, Toast, and the empty, loading and couldn't-load patterns. Every word shown is in the words file `src/i18n/pl.ts` (Polish).
3. **Prototype kit.** `prototype/` runs the real screens on fake data, with the DEMO menu (20 states, phone frame, "New app: what you get"), the Klienci worked example, and a check that opens every state at 390 and 1280 px in both themes (`npm run proto:check`). The 80 reference pictures of the frozen prototype are in `design/0.1/prototype/`; the built ones are in `design/0.1/built/`.
4. **Shared scripts.** `scripts/`: the migration checks (order, safety rules, `check-migration.mjs`), the replay (`replay-migrations.sh`), embeds, verify-rls on the replay with the three-table fixture and the access list `supabase/access.json` (empty), the sign-ups check, the words, tokens and no-database-in-screens checks, the build check, the context-size check, the cost table. CI is `.github/workflows/migration-replay.yml`.
5. **Skills.** `.claude/skills/`: `stack` (the code rules, each with its source), `prototype`, `estimate`. Each has an exact trigger, never "always".
6. **Agent definitions.** `.claude/agents/`: `builder.md`, `reviewer-data.md`, `reviewer-light.md`. The base branch, the default branch and whether the app has staging are read from CONTEXT.md "Repo facts".
7. **Repo files.** `CONTEXT.md`, `DECISIONS.md`, `LEARNINGS.md`, `NEXT.md`, `HISTORY.md`, and `RULES.md` (the general sections, plus every process rule of Overload's, each with its source line).
8. **New-app checklist.** `docs/new-app-checklist.md` (the record) and `docs/new-app-checklist.html` (the page, built by `scripts/build-checklist-page.mjs`): GitHub repo, Supabase project (EU, sign-ups off), the GitHub link, Vercel, the first sign-in.

## What is not in this version

- The client-ready build: staging scripts and skill, the release skill, maintenance mode, required updates, What's new, the iPhone install guide, forgot password, user roles, the environment setup script, user admin, audit log, exports, import, monitoring, backups.
- The offline writing add-on (the Dexie queue, the unsent-changes indicator). Saving needs a connection and nothing is queued.
- Recharts (an app that needs charts adds it).
- BUILD.md's client part, moving Overload or Current onto the starter, the installer demo itself.
- A crash screen (not in SPEC).
- Hosting: no Vercel project and no Supabase project exist for the starter itself. The replay-based checks run in GitHub Actions on every PR.

The leftovers are listed in `NEXT.md` (the offline add-on's rules and the client-ready build's lines, each with its Overload source).

## Facts verified

TASKS.md "Facts to verify", and how each came out.

1. **Two users signing in on the replay.** Works with the hosted project's own `auth.uid()` functions applied to the replay and PostgREST connected as `authenticator`. The image's own `auth.uid()` returned null through PostgREST 12, which the "owner sees at least one row" guard caught. Built into `replay-migrations.sh` and verify-rls.
2. **Docker in a cloud session.** Starts with `dockerd --iptables=false --ip6tables=false`. Docker Hub rate-limited the shared address; `mirror.gcr.io` served both images. Replay checks run in a session when the images can be pulled, and always in CI.
3. **Where sign-ups are switched off.** A dashboard step, not the GitHub link: on a production deploy the link applies migrations but ignores the `[auth]` settings unless a `[remotes]` block names the project. It is step 2 of the checklist, with a probe as its Expect box.
4. **PWA without the update gate.** A new version installs in the background and is used at the next open, with no banner and no reload. Run in chunk 1 (12 of 12 checks, re-run by the reviewer). `check-build.mjs` keeps "no lazy chunks but workbox-window", which is what rules out a half-updated page.
5. **Which RULES.md rules are general.** Done by sorting Overload's 377 entries: 156 process, 150 code, 58 Overload-only, 34 offline add-on, 15 staging and release. The process ones are in RULES.md, the code ones in the `stack` skill, the rest in NEXT.md or dropped.
6. **Bundled fonts.** Archivo and JetBrains Mono are SIL Open Font License 1.1, which allows bundling. `check-build.mjs` asserts the PWA caches them and that no Google font host is in `dist`.
7. **Tailwind v4 `initial` switches.** Hold in the real build: no palette variables, no stock text size or radius, utilities map to the tokens.

What this build found, one line each:

- **54** The embeds check's local PostgREST runs its anon role as `postgres`, because anon is revoked on own and signed-in tables (a probe as anon would fail every valid embed).
- **59** verify-rls counts rows with a GET and `limit(0)`, never HEAD: a refused HEAD reaches supabase-js with no error code, so a correct refusal would read as a failure.
- **61** The app's replay seed for verify-rls is an optional `supabase/verify-rls-seed.sql`; without it a non-empty access list fails loudly.
- **62** The script tests run in CI (`npm run check`), because the list test is the only thing that catches a table the code reads but the access list lacks.
- **63** verify-rls fails an own or signed-in table that `anon` holds any privilege on (default privileges included), since every probe passes behind RLS while only the catalog sees it.
- **69** `migration-rules.mjs` now passes a `revoke` on a table the same batch creates. This loosens a data-safety check (every app's every table has such a revoke); any other revoke is still flagged.

## The release checks (this run)

- The kit's 80 built pictures were compared with the 80 frozen prototype pictures by name, pixel by pixel: every state, 390 and 1280 px, light and dark. Differences are only the rotated "DEMO" tab label's edge pixels (anti-aliasing) in every picture, and 3 edge pixels of the dialog's corner in the two desktop Delete states. No clipping found. The built pictures are in `design/0.1/built/`.
- All scripts, typecheck, build, the build check, the replay, verify-rls (fixture and app), the embeds check, the context-size check and the checklist page check pass; the full vitest suite passes (255 tests) and the script tests pass (290, none skipped, the checklist page's browser tests included).

## Decisions Adam made after the release check (2026-11-07, DECISIONS 77–84)

1. **A sign-out that fails in any way signs out on this device** (chunks 11 and 12): with no connection, a server error or a rate limit, the stored session is removed, supabase-js signs out locally, the cache is cleared and the sign-in screen shows; when the browser reports itself offline the server is not asked at all. Tests with the real client prove no session is left on the device, after a server error too, and that offline sends no request. (supabase-js's `signOut({ scope: 'local' })` alone still asks the server and keeps the session when that fails, so the stored session is removed first: DECISIONS 81–83.)
2. **The app tests run in CI** on every pull request, beside the script tests (DECISIONS 84).
3. **L239's exception** to "every flagged migration is a card" now also needs verify-rls on the replay to pass (RULES.md "Escalation", DECISIONS 78).
4. **Confirmed as built:** the loosened revoke check (DECISIONS 69), desktop table rows opening from the keyboard, Supabase "Automatic branching" off at the checklist's step 3, the checklist and its test in every app made from the template (DECISIONS 79).

## The vibe check

Display-only choices the builders made, for the first app's first look:

- The neutral "S" tile icon in the accent `#2453bd` (its letter comes from `app.config.ts`'s name), splash background `#f5f6f8`, the name "Starter" everywhere.
- The iPhone status-bar style `default` (Overload's `black-translucent` was for a dark app).
- "Wylogowywanie…" while signing out (a new word).
- The failed sign-in line "Nie udało się zalogować. Powód: <reason>." with the server's English reason; no native `required` on the sign-in fields.
- The 15 px base font. iOS Safari zooms inputs below 16 px: raise `--fs-base` to 16 px if it does.
- One wrong-theme flash on a cold start when the chosen theme differs from the device's.
- The offline strip at the top (the prototype's place; Overload had it above the tab bar).
- The Panel's header aligned top with a 40 px close button; Panel and ConfirmDialog on one layer (document order decides), the toast above them.
- The toast at the bottom overlapping the phone tab bar, as the prototype's Saved state shows it.
- A couldn't-load line without a reason shows alone.
- ConfirmDialog's focus starts on the box, so a stray Enter does nothing.

## The tag

Git's proxy refused tag pushes from cloud sessions (CONTEXT.md "Repo facts"), so the release itself is Adam's.

The tag: Adam runs, from the starter's folder:

```
git checkout main
```

```
git pull
```

```
git tag v0.1.0
```

```
git push origin v0.1.0
```

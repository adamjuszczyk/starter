# Starter 0.1 (slim starter) — SPEC

Specced 2026-11-04/06 in Claude Chat, BUILD.md 2.2 step 1. Verdict list confirmed by Adam 2026-11-06.

The prototype is the published page "Starter Prototype" (DEMO tab on the right edge); its source is
`starter-prototype-src.zip`, copied into `prototype/` at setup. **The prototype decides layout, order and wording; this
file decides behaviour and wins any disagreement.**

Two standing rules from Adam for this spec, and for TASKS and the build:

- **Lift, don't rebuild.** Every part that already exists in Overload is lifted from Overload (repo
  `adamjuszczyk/overload-v2`, branch `staging`, as of commit `8e00877`, 2026-11-02). Each item below says where it comes
  from, what gets generalized, what gets dropped, and what is new. Only what Overload doesn't have is designed new.
- **Technical decisions are made, not asked.** Technical and architecture questions are decided by the chat or the
  agent, by BUILD.md's guiding rule and the lift rule, and written down with a one-line reason so a reviewer can check
  it. Only a decision that changes what a user sees or does, cost, risk to client data, how hard it is to change later,
  or Adam's own manual work goes to Adam, in plain words.

---

## Purpose

One template repo every new app starts from, Adam's or a client's, so a new app begins with the stack, a design system,
the prototype kit, the shared scripts, the skills and the agent definitions already working, and a demo can be ready in
a day. Overload 1.2.1 built the standard features first; this build lifts what a new app needs on day one.

Layers (`claude/client-app-technical-topics.md`): the starter is layer 1, the foundation. It holds **no business
features and no business screens**. The first app built from it is the installer demo (product core v0,
`claude/business-offer.md`, "Demo"), which is the starter's first real test. The starter is shaped so the demo starts
straight from it.

**Slim now** means fewer parts, each built properly; the rest is added in its own build. Never built worse.

### Not this version

- **Client-ready build** (before the first client build): staging scripts and the staging skill, the release skill,
  maintenance mode, required updates, What's new, the iPhone install guide, "forgot password", user roles, the
  environment setup script, and the business-app basics (user admin, audit log, exports, import, monitoring, backups).
- **Offline writing add-on**, built only for apps that need it: the Dexie queue, the unsent-changes indicator.
- Recharts (an app that needs charts adds it; the stack skill names it).
- BUILD.md's client part. Moving Overload or Current onto the starter. The installer demo itself.

---

## Objects stored

**No app tables.** The starter ships no tables of its own; the first app's first build adds them. What exists:

- **Accounts:** Supabase Auth users only. Sign-ups are off; accounts are added by the app's owner (rule 5).
- **Theme, per device:** `theme` = `system | light | dark`, default `system`. One `localStorage` key, every access in
  try/catch, never a table. *Reason: a device preference, and it keeps the base free of tables.* (Overload keeps its
  theme in `v2_user_settings`; dropped with the rest of Overload's settings.)
- **The table access list:** one file beside the migrations (`supabase/access.json` or similar, TASKS names it). Every
  table and view the app has, each with one kind:
  - `own`: only the user who wrote a row can see it (Overload's tables).
  - `signed-in`: every signed-in user of the app sees every row (a firm's units, customers, przeglądy in the demo).
  - `public`: anyone sees it, signed out included (Overload's `PUBLIC_BY_DESIGN`).

  Empty in the starter. *Reason: verify-rls checks each table by its kind instead of one rule that is wrong for either
  Overload or a firm's app.* A role kind is added in the client-ready build, with user admin.

---

## Items

### 1. Stack setup

**From Overload:** `package.json` (dependencies and scripts), `vite.config.ts` (the `__APP_VERSION__` and build hash
defines; vite-plugin-pwa with `registerType: 'autoUpdate'`, `injectRegister: false`, `skipWaiting`, `clientsClaim`, and
the comment on why), `tsconfig*.json`, `vitest.config.ts`, `vitest.setup.ts`, `vercel.json` (`ignoreCommand` for
docs-only pushes, the SPA rewrite), `src/lib/supabase.ts`, `src/lib/queryClient.ts`, `src/lib/version.ts`,
`src/features/auth/useAuth.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/pwa/pwaRegister.ts` and
`useServiceWorker.ts`, `src/hooks/useOnlineStatus.ts`, `src/components/Nav.tsx` (as the phone tab bar).

**Generalized:** app name, short name, icons and theme colour come from one app config file, not code. The version
starts at `0.1.0`.

**Dropped:** Dexie (`src/lib/db.ts`, `src/features/offline/`), `api/` and the Anthropic SDK, Coach, Recharts,
`useInstallPrompt` (iPhone guide is the client-ready build), the maintenance and update gates and What's new
(`src/features/release/`, `AfterUpdateSheet`, release notes), Overload's sign-up switch on the sign-in screen,
`date-fns` unless TASKS finds a use the formats file doesn't cover.

**New:**
- **Desktop app frame:** side menu on wide screens; Overload's bottom tab bar on phones. Switches at **900 px of the
  app's own width**, not the window's. *Reason: a tablet held upright gets the phone layout, and the same code works in
  the prototype's phone frame.*
- **Online by default.** Every app opens without a connection (vite-plugin-pwa caches the app shell, as in Overload).
  Data needs a connection. Offline writing is the add-on, not the base. *Reason: Adam's P1 answer.*
- **Updates without the gate:** until the client-ready build adds required updates, a new version installs in the
  background and is used the next time the app opens. *Reason: Overload's PWA settings without its gate code.*
- **Fonts are bundled with the app**, not loaded from Google. *Reason: loading Google Fonts sends every visitor's
  address to Google, which a German court ruled a GDPR breach (LG München, 2022); client apps fall under RODO, and
  bundled fonts also open offline.* (The published prototype page loads them from Google, which only it may.)
- **Polish formats** for dates, numbers and money in one file (`format.ts` in the prototype).
- **Theme follows the device** by default; Light and Dark in Settings.

### 2. Design system

**From Overload:** `src/styles/tokens.css` (token names, one source for every colour, both themes, switchable accent),
`src/styles/global.css` (the mapping of tokens onto Tailwind utilities: `bg-surface`, `text-ink`, `border-wire`…; the
three font roles), `src/components/BottomSheet.tsx` (whole: portal, focus trap, scroll lock, stacking, layout),
`src/components/ConfirmDialog.tsx` (same props and layout), the offline strip from `Nav.tsx`, the error-line pattern
from `LoginPage.tsx`.

**Generalized:** token **values** are neutral placeholders that each app replaces (the prototype's blue accent, Archivo
and JetBrains Mono). Light first, dark under `prefers-color-scheme` and `[data-theme="dark"]` (Overload is dark first).

**Dropped:** Overload's inline `style={{}}` sizes, its monospace capital labels, its pickers (`src/components/pickers/`:
training-specific), `ExercisePickerSheet`.

**New:**
- **Tokens for text sizes, corner radii, the scrim and the panel shadow** (Overload writes sizes in each screen;
  `fontSize: 10` appears 162 times). Values: `prototype/src/styles/tokens.css`.
- **Tailwind's own colours, text sizes and radii are switched off** (`--color-*: initial` etc.), so only token classes
  exist. *Reason: turns "code uses only tokens" into a guarantee.* Typed-in values are caught by the tokens check (item 4).
- **Labels in sentence case;** monospace only for numbers that line up (phones, dates, counts). *Reason: Overload's
  capitals are its look; office users read forms all day.*
- **Components:** Button (primary, secondary, ghost, danger, danger-ghost; 40 px tall on desktop, 44 px on phone),
  TextField, SelectField, TextArea (label over field, hint or error under it), Badge (neutral, ok, warn, danger,
  accent), Table (desktop; skeleton rows while loading; scrolls sideways inside its own box), phone list rows,
  **Panel** (one component: side panel from the right on desktop, Overload's BottomSheet on phone, same parts in the
  same order), ConfirmDialog, OfflineStrip, InlineError, Toast, and the empty, loading and couldn't-load patterns.
- **The words file (Adam's answer B):** every word the app shows lives in one file per language
  (`prototype/src/i18n/pl.ts`). Screens read words by name (`t.clients.title`). Words that depend on a number are
  functions with Polish plural forms. A second language is a file of the same type, so a missing word fails the type
  check. Polish is the starter's language.

### 3. Prototype kit

**From Overload:** all of `prototype/`: the Vite plugin that swaps data hooks for fakes and changed files for marked
copies (`vite.config.ts`, `override.mjs`), fake data seeded into the real query cache, `inline.mjs`, the DEMO menu
(`src/demo/DemoMenu.tsx`, `demoStore.ts`), `check/run.sh` and `check/clipping.mjs`, the unlayered base restatement
(`src/index.css`, lesson L6), the README.

**Generalized:** the kit runs the starter's real screens (sign-in, frame, settings, components). The Klienci list and
form are the kit's **worked example** of a screen on fake data, kept inside `prototype/` only; app code never imports
from `prototype/` (BUILD.md, Tasks rule 10).

**Dropped:** 1.2.1's screens, overrides, fixtures and smoke tests.

**New:**
- The check runs at **phone (390 px) and desktop (1280 px)** width, in both themes. *Reason: desktop screens cut off
  content differently.*
- Screen-reader-only text is skipped by the clipping check (it is clipped on purpose).
- The DEMO menu has a **phone frame** (WIDTH → PHONE FRAME), so the phone layout can be seen on a computer, and a
  **"New app: what you get"** state. Example screens are labelled "Example screen, not in the starter". Overlays draw
  inside the app frame so the phone frame keeps them.

### 4. Shared scripts

**From Overload (`scripts/`):** `check-migration.mjs`, `migration-rules.mjs` and `migration-rules.test.mjs`,
`check-context-size.mjs`, `verify-rls.mjs` with `verify-rls-tables.test.mjs` and `verify-rls-ahead.test.mjs`,
`cost-table.md`, and the migration-replay check: `.github/workflows/migration-replay.yml`, `replay-migrations.sh`,
`check-migration-order.mjs` (and its test), `check-embeds-local.sh` and `check-embeds.mjs`; `check-wording.test.mjs`.

**Generalized:**
- **verify-rls:** the table lists move out of the script into the access list (Objects stored); each table is checked
  by its kind. `own` keeps Overload's server-side count of rows that aren't the test user's (so a row cap can't hide a
  leak). `signed-in`: user B reads A's rows, a signed-out visitor reads nothing. `public`: rows expected for everyone.
  Every kind: RLS on, grants checked (a missing grant can look like a passing RLS check). The list test still fails on
  any table the code uses that isn't listed, and on any listed table nothing uses.
- **verify-rls runs on the replay, not on staging:** two test users sign in on the replayed database. *Reason: no
  Supabase project for the starter (Adam's P2); costs nothing, holds no passwords, starts clean every run.*
- **Wording check:** the forbidden-words list is each app's own (empty in the starter); and words shown on screen must
  come from the words file: JSX text and text attributes in `src/` outside the words file fail. Same parser as
  Overload's.
- **Cost table:** Overload's second calibration (1.2.1), as BUILD.md's Bootstrap gives it.
- **The replay's Postgres image** is a setting each app sets to its production project's version.

**Dropped:** Overload's own checks (frozen code, warmup consumers, program-exercise reads, plan-week parity,
rehearse-046, apply-ops proof, change-program e2e, sheet overflow, probes, release counts, staging scripts, maintenance
trigger and version tests, schema compare, transport-collapse, gen-icons).

**New:**
- **Sign-ups check:** fails if any table is `signed-in` while sign-ups are on in `supabase/config.toml`. *Reason: with
  open sign-up, a stranger could create an account and read a firm's data.* Carries Overload's trap: `[auth.email]
  enable_signup = false` turns e-mail **sign-in** off for everyone (Overload, 2026-10-14); sign-ups are switched off with
  `[auth] enable_signup`.
- **Tokens check:** fails on a typed-in colour, text size or radius in `src/` (`text-[13px]`, `bg-[#f00]`, a hex or
  `rgb()` in a `style`). Layout widths may be typed in.
- **No database in screens:** fails on any `.from(`, `.rpc(` or `supabase.` in a screen file; reads and writes live in
  service and hook files, as in Overload. *Reason: the prototype kit swaps exactly those files, and the offline add-on
  would later slot in behind them.*

### 5. Skills

In `.claude/skills/`, committed. Each with an exact trigger, never "always" (BUILD.md, L9). Content is lifted, not
written fresh:

- **`stack`**: the conventions: data in service and hook files; tokens only; the words file; online-only saving
  (rule 3); the access kinds and the access list; migrations (forward-only, destructive ones to Adam, check-migration);
  vite-plugin-pwa settings; Supabase RLS and grants; where Recharts fits. Sources: Overload's RULES.md "Rules
  discovered during this build" and "Checks that lied", sorted: general ones lifted, Overload-only ones dropped, the
  offline-queue ones kept aside for the add-on. Trigger: writing or changing app code in `src/` or `supabase/`.
- **`prototype`**: how to use the kit: `prototype/README.md`, lessons L1, L4, L6, the check before publishing, the
  example screens' labels. Trigger: building or changing anything in `prototype/`.
- **`estimate`**: BUILD.md's estimate method and the cost table. Trigger: writing the estimate in TASKS.md.

### 6. Agent definitions

**From Overload:** `.claude/agents/builder.md`, `reviewer-data.md`, `reviewer-light.md`, models as BUILD.md's table.

**Generalized:** the build's name, the base branch (`staging` or the default branch) and the default branch's name are
read from `CONTEXT.md`, never written into the definition. Staging steps apply only when `CONTEXT.md` says the app has
staging. **Dropped:** "1.2.1", `master`, Overload's file lists.

### 7. Repo files

`CONTEXT.md`, `DECISIONS.md`, `LEARNINGS.md`, `NEXT.md` (opening with "Planned, not built"), `HISTORY.md`: BUILD.md's
templates, empty. **`RULES.md`** starts with Overload's general sections, lifted: Index, Escalation, Reviewer rules,
Verification by chunk type, Usage, Decision cards, The build loop, Models, and empty "Rules discovered during builds" and
"Checks that lied". Staging and release sections come with the client-ready build. *Reason: setup then only adds what is
specific to the app.*

### 8. New-app checklist page (Adam's answer A)

How a new app gets its accounts, as a **checklist page** (BUILD.md, "Procedures I run by hand"): Windows cmd commands
with copy buttons, an Expect box and a "Stop if" box per step, progress saved where Claude can read it. Its markdown
record lives in the starter's `docs/`. Steps:

1. GitHub: new repo from the starter template, **public or private, chosen per app**. The page says what each
   means: GitHub's required checks on a private repo need a paid GitHub plan (about $4 a month); a public repo shows the
   app's code, never its data, to anyone. (Amended 2026-11-06: the demo and client apps carry the product core, Adam's
   main business asset; the demo's spec decides its repo.)
2. Supabase: new project, **EU region** (it can't be moved later), in the organization the app belongs to; sign-ups off
   (and e-mail sign-in left on); the first user account added.
3. Supabase → GitHub link, so migrations deploy from the default branch by themselves.
4. Vercel: new project from the repo; the Supabase URL and key set as environment variables.
5. Check: the app opens and the first account signs in.

Agents do everything after step 5. *Reason: a script would need keys that can reach every project, Overload's and
clients' real data included; the environment setup script is designed in the client-ready build, with scoped keys.*

---

## Screens

Every screen is in the prototype; open DEMO for its states. Words here only for what the prototype can't show.

| Screen | In the starter | States in DEMO | Empty state |
|---|---|---|---|
| Sign-in | Yes | normal, wrong password, signing in | — (a form) |
| App frame, new app | Yes | signed in | Only the Settings tab, until the first build adds the app's tabs |
| Settings | Yes | normal | Never empty: account, theme, version |
| Klienci list | No: kit example | full, empty, loading, couldn't load, offline, saved | "Nie ma jeszcze klientów." and Dodaj klienta |
| Klient form | No: kit example | new, edit, missing fields, saving, save failed, offline, delete | New starts with empty fields |
| Design system page | No: prototype only | one page | — |

- **Sign-in:** no "create an account". Wrong e-mail or password shows `signIn.wrong`; no connection shows
  `signIn.offline` ("Brak połączenia. Spróbuj ponownie, gdy wróci."); any other failure shows `signIn.failed` with the
  reason, as Overload's sign-in does. Never Supabase's raw message alone. (Amended 2026-11-06: the first wording would
  have told an offline user their password was wrong.)
- **Sign-out** (from Settings and the side menu): when the server can't be reached, the person is signed out on this device
  anyway (supabase-js `signOut` with `scope: 'local'`), the cache is cleared, and the sign-in screen shows. (Amended
  2026-11-07, Adam: on a shared office computer, a sign-out that silently does nothing leaves the next person in
  someone else's account. DECISIONS 77.)
- **Settings:** the build line (version · build hash · build time) stays at the bottom, as in Overload.
- **The words** on these screens are in `prototype/src/i18n/pl.ts`, word for word. The starter has no forbidden words yet.

---

## Rules

1. **Guiding rule** (BUILD.md): the simplest behaviour that never loses or wrongly writes data, even if a rare case
   displays imperfectly.
2. **Code uses only tokens and the words file.** Enforced by the tokens check and the wording check.
3. **Saving needs a connection.** Offline, Save is off and says why (`common.needsConnection`); nothing is queued. A
   failed save keeps the form open with everything typed and says so (`clientForm.saveFailed`). Lifted from Overload's
   "Deleting needs a connection".
4. **Screens never talk to the database.** Reads and writes live in service and hook files.
5. **Sign-ups are off** in every app built from the starter; the owner adds accounts. An app that needs open sign-up
   (Overload, possibly) turns it on and may then have no `signed-in` tables.
6. **Every table is in the access list** with its kind, from the migration that creates it.

---

## How this build runs and finishes

- **No staging.** The starter has no users: chunks merge straight to the default branch (BUILD.md step 4).
- **Before the "release":** agents check the built screens against this prototype by screenshot, at both widths and in
  both themes, and run every script, including verify-rls on the replay.
- **Release = tag `v0.1.0`** with notes. No production, no checklist page for Adam.
- **Adam's vibe check moves to the installer demo**, the starter's first real use.
- **BUILD.md's template** ("Files", "Outside every repo") says the starter sits in the folder beside the repos; it is
  a GitHub template repo, and that folder keeps BUILD.md and the cost table.

---

## Facts to verify

Unknowns about the tools, not choices. TASKS checks each and writes down what it found.

1. **Two users signing in on the replay:** tokens signed with the replayed PostgREST's own secret (role
   `authenticated`, the user's id as `sub`), or Supabase's auth container added to the replay. Which one makes
   `auth.uid()` work for both users.
2. **Docker in a cloud Claude Code session:** Overload's `check-embeds-local.sh` says to start dockerd first. Confirm
   builders and reviewers can run the replay, or name the checks that run only in GitHub Actions.
3. **Where sign-ups are actually switched off on a hosted project:** whether the Supabase GitHub link applies
   `supabase/config.toml`'s `[auth]` section to the main project, or it's a dashboard step (then it's on the checklist
   page, step 2).
4. **Overload's PWA settings without the update gate:** that a new version is picked up at the next open, with no
   RELOAD banner and no half-updated page.
5. **Which RULES.md rules and "Checks that lied" are general:** the sort for RULES.md (item 7) and the stack skill
   (item 5), each with its source line.
6. **Bundled fonts:** Archivo and JetBrains Mono's licences allow bundling (both are SIL Open Font License as far as
   known), and the PWA caches them.
7. **Tailwind v4 `initial` switches** (`--color-*`, `--text-*`, `--radius-*`) behave in the real build as in the
   prototype's: checked in the prototype build, 2026-11-06.

## Left untouched

- **Overload and Current:** nothing in their repos changes in this build.
- **BUILD.md:** unchanged until the retro decides this build's lessons.

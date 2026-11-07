# Starter: the prototype kit

The kit runs the starter's **real screens** from `../src` (the sign-in page, the app frame, Settings, the components) on fake data. The DEMO
tab on the right edge lists every screen and state in SPEC.md ("Screens"), at any width, in either theme, in a phone frame on a computer.
`check/` builds the page and looks at every state in a real browser. Lifted from Overload's kit (its `prototype/`, commit `8e00877`), changed
in one way: Overload's kit built a shell of its own from real parts; this one renders the real `AppRoutes` under a `MemoryRouter`
(TASKS.md, Decided 3).

Builders lift **look and layout** from here, never its data handling (BUILD.md, Tasks rule 10): nothing from `src/demo/`, `src/fakes/` or a
`useDemo` read goes into `../src`. `scripts/check-screens-no-db.test.mjs` fails on a `prototype/` import in `src/`.

## How it works

- `vite.config.ts` swaps real modules for fakes at build time (the `fakeDataLayer` plugin, the list `SWAPS`): a real module listed there is
  replaced wherever it is imported, so the real screens run unchanged. The starter swaps exactly five: `lib/supabase.ts` (a client whose every
  call stays pending), `features/auth/useAuth.tsx` and `authService.ts` (who is signed in; how a sign-in ends), `hooks/useOnlineStatus.ts`
  (the connection) and `features/settings/useTheme.ts` (the theme). The fakes are in `src/fakes/`. `OVERRIDDEN` is empty: it lists real files
  a spec changes, as marked copies in `src/overrides/` (`node prototype/override.mjs <path inside src/>` makes one); each spec chat starts it
  empty, because an override goes stale once its build ships (L5).
- Two trapdoors the plugin has to get right (L4). The repo path is resolved to its **real path** (`fs.realpathSync`): Vite resolves imports to
  real paths, and a swap keyed by a symlinked path silently misses. And a fake that reads the query cache does it through a **subscription**
  (`src/examples/clients/useClients.ts`): a fake that reads once while it renders never hears of data that arrives later.
- `src/main.tsx` puts the fake data into the real query cache (`src/demo/seed.ts`), then renders `src/App.tsx`: the DEMO button and menu
  around the real `AppRoutes` (it carries its own `WidthRoot`; the kit draws no frame of its own, only the box the frame is given: the full
  window, or the phone frame). The kit's alias `virtual:pwa-register/react` → `src/fakes/pwaRegister.ts` is not a swap: it stands in for a
  module the app's own PWA plugin makes up, which `App.tsx` imports and the kit never calls.
- `src/demo/demoStore.ts` is the kit's state (signed in or not, the list's data, online or not, the form's start, a toast, a new app). A
  DEMO state is that state with a few changes (`ENTRIES` in `src/demo/DemoMenu.tsx`); applying one draws the real app afresh, so a state
  never inherits what the last one left on screen. The list's data arrives 30 ms later, as a server's does (`seed.ts`).
- **Every state carries one expectation** (`expect`: a text or a selector, TASKS.md Decided 46). The check asserts it after applying the state,
  so twenty states cannot pass as twenty identical screens. A state without one fails `check/kit.test.mjs`.
- The three sign-in states (wrong password, offline, signing in) are the real page's own: the check fills the fields and presses the button,
  and the fake `authService.signIn` rejects with the real `SignInError`, or stays pending, as the state says.
- The example screens are `src/examples/clients/` (the Klienci list and form) and `src/screens/DesignSystem.tsx`. **They are not in the
  starter** and are labelled so in DEMO ("Example screen, not in the starter"). The kit mounts the example's tab in the real `TABS`
  (`src/shell/tabs.ts`) when the page loads, as a build adds a tab by editing that file; "New app: what you get" takes it out, which is the
  starter as it ships (Settings only). The example's words are `src/examples/words.ts`; `src/i18n/pl.ts` here is the wording record SPEC points to.
- `src/index.css` imports the real styles, restates the base background, colour and font **unlayered** (a page host's own base styles are
  unlayered and beat the app's `@layer base`: L6), and adds `@source "./"`: the real `global.css` makes Tailwind scan `src/` only, so the kit's
  own files need a source of their own.
- The four defines (`__BUILD_HASH__`, `__BUILD_TIME__`, `__APP_VERSION__`, `__APP_CONFIG__`) are given fixed values, so every run draws the
  same build line. The page is one file: `inline.mjs` puts the script, the style (the fonts are inside it) and the HTML together.
- No `package.json` of its own: the kit uses the root `node_modules` (Decided 20).

## Commands (from the repo root)

- `npm run proto:check`: typecheck the kit, run `check/kit.test.mjs`, then `bash prototype/check/run.sh` (build, inline, and the browser check).
  Exit code 0 means: no page error and no request outside the page; no clipped element, no sideways scroll, at 390 and 1280 px in light and
  dark; the menu lists 20 states, each with an `expect`, and every one is met; every panel, dialog and toast lies inside the phone frame at a
  1280 px window; 80 screenshots in `check/shots/` (not committed). It takes about a minute.
- `npx vite prototype`: the kit live, with hot reload.
- `node --test prototype/check/kit.test.mjs`: the kit test alone (no copy of a `src/components`, `src/shell` or `src/styles` file; the swap
  list is the five modules and each real file exists; 20 states, each with an expectation that is not blank).
- `node prototype/override.mjs <path inside src/>`: copy a real file into `src/overrides/`, its imports pointed back at `@app/...`.

**Publish only after a clean run, and look at the screenshots.** The check sees boxes and text, never taste: open the pictures for the states
you changed. The page to publish is `starter-prototype.html` (written by `check/run.sh`, not committed). The check runs again at every merge
that changes a module the kit renders (RULES.md, "Verification by chunk type").

The browser check uses the environment's Playwright, which the repo does not depend on (TASKS.md, Decided 5). A cloud session has it, with
Chromium, where `require('playwright')` finds it. On a PC, install it once (`npm install -g playwright`, then `npx playwright install
chromium`) and, if `require` cannot find it, set `PLAYWRIGHT_PATH` to its `index.js`.

## The frozen reference

`design/0.1/prototype/` holds the 80 screenshots (20 states, 2 widths, 2 themes) of the prototype the spec chat made, taken from commit
`c7ade6e` before this kit replaced it (Decided 2, 30). They are what the release comparison measures the built screens against. A new app keeps
them as its design reference until its own first prototype replaces them. `check/shots/` is named the same way, so the two sets pair by name.

## Starting a new app's prototype

The kit stays between builds (L5). A new app: keeps `vite.config.ts`, `check/`, `src/fakes/` and `src/demo/`; deletes `src/examples/`, the
Klienci entries in `src/demo/DemoMenu.tsx`, the example tab in `src/App.tsx` and (if it wants none) `src/screens/DesignSystem.tsx`; adds the
app's own screens by adding their tabs to the real `src/shell/tabs.ts`, a fake for every hook and service they read through (listed in `SWAPS`
and in `EXPECTED_SWAPS` in `check/kit.test.mjs`), fake data in `src/demo/seed.ts`, and a DEMO state with an `expect` for each state of each
screen (counted in `STATES` in `check/clipping.mjs` and `EXPECTED_STATES` in `check/kit.test.mjs`).

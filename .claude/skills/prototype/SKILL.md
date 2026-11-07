---
name: prototype
description: "Use when building or changing anything under `prototype/`, and for no other work. The prototype kit: the real screens from src/ on fake data (the swap plugin, the cache seed, the DEMO menu with its phone frame, one expectation per state), the browser check that must be clean before anything is published, the example screens' labels, and where the environment's Playwright is."
---

# The prototype kit

`prototype/` runs the starter's **real screens** (`../src`: the sign-in page, the app frame, Settings, the components) on fake data, so a spec can be seen and clicked before it is built, and so the built screens can be compared with it. It is Overload's kit (`adamjuszczyk/overload-v2`, commit `8e00877`, its `prototype/`), with one change: Overload's kit assembled a shell of its own from real parts; this one renders the real `AppRoutes` under a `MemoryRouter` (TASKS.md, Decided 3). The kit's own map, the commands and the reasons are in `prototype/README.md`; this is what to do and what to remember.

**Sources.** `L1`, `L4`, `L5`, `L6` are Overload's LEARNINGS.md lessons (the starter's own are `S…` and `B…`). `Decided 5` and the like are TASKS.md's "Decided"; `SPEC item 3` is SPEC.md's.

## The rules

- **Look and layout come from the prototype, never its data handling** (BUILD.md, Tasks rule 10). Nothing from `prototype/src/demo/`, `src/fakes/` or a `useDemo` read goes into `src/`; `scripts/check-screens-no-db.test.mjs` fails on a `prototype/` import in `src/`. The kit imports from `src/`, never the reverse.
- **The kit renders the real ones.** `prototype/src` holds no copy of a `src/components`, `src/shell` or `src/styles` file (`prototype/check/kit.test.mjs` fails on one, by name or content). The one place a copy of a real file may live is `src/overrides/`, made by `node prototype/override.mjs <path inside src/>` and listed in `OVERRIDDEN` in `vite.config.ts`; each spec chat starts both empty (L5), and an override marks each change with a comment naming the spec's item.
- **Every state is checked in a real browser, at phone size and desktop size, in both themes, before Adam sees it** (L1). jsdom has no layout: the same bug (a card squeezed by a scrolling column, a row cut off) reached Adam twice because the checks only read text. `npm run proto:check` is that check.
- **Every DEMO state carries one expectation**, a text or a selector (`expect` in `ENTRIES`, `prototype/src/demo/DemoMenu.tsx`; Decided 46). The check asserts it after applying the state, so twenty states cannot pass as twenty identical screens. Use the real words (`src/i18n/pl.ts` and the example's), so an edit to a word moves the expectation with it.
- **Example screens are labelled "Example screen, not in the starter"** in DEMO (SPEC item 3), after Adam read the Klienci list as part of every app (S5). The Klienci list and form, and the design-system page, are kit examples: they stay inside `prototype/`; app code never imports from there, and the example's words live in `prototype/src/examples/words.ts` (Decided 19), not in `src/i18n/pl.ts`. A new app deletes them.
- **A prototype for a template shows a "New app: what you get" state:** the Settings tab only, as the starter ships.

## How the kit works, and the traps

- `vite.config.ts`'s `fakeDataLayer` plugin swaps a real module for a fake **wherever it is imported**: `SWAPS` is a path inside `src/` → a file in `prototype/src/fakes/`. The starter swaps exactly five (the Supabase client, `useAuth`, `authService`, `useOnlineStatus`, `useTheme`); an app adds the hooks and services of its own screens, each with a fake, and adds them to `EXPECTED_SWAPS` in the kit test. A fake may import the real module it replaces (the plugin does not swap a fake's own imports): `fakes/authService.ts` re-exports the real `SignInError`, so the sign-in page's `instanceof` holds.
- **Trap 1 (L4): the repo path must be its real path** (`const REPO = fs.realpathSync(...)`). Vite resolves imports to real paths; a swap keyed by a symlinked path never matches, nothing is swapped, and nothing says so. The kit test fails if the `realpathSync` line goes.
- **Trap 2 (L4): a fake hook reads the query cache through a subscription** (`useSyncExternalStore(cache.subscribe, …)`, `prototype/src/examples/clients/useClients.ts`; Decided 34). A fake that reads once while it renders never hears of data that arrives later, and a query nothing fetches does not re-render on `setQueryData` either. The kit makes data arrive after the screen is drawn on purpose (30 ms after a state is applied, `demo/seed.ts`), so every state that shows the list proves the subscription.
- Fake data goes into the **real query cache under the real key** (`demo/seed.ts`, before the first render; `retry: false`), so an app's real hooks read it as they would a server's answer. The fake Supabase client's every call stays pending: an unseeded read shows as loading, which is how a missing fixture shows up.
- **The real `AppRoutes` is drawn without a second frame.** It carries its own `WidthRoot` (Decided 45), which measures the box it is given: the full window, or the phone frame (WIDTH → PHONE FRAME, a 390 px box on a computer). Overlays (Panel, ConfirmDialog, Toast) are drawn into that frame's overlay root, which carries `transform: translateZ(0)`, so they stay inside the phone frame; the check's PHONE FRAME pass asserts it for every state that has one.
- The example's tab is pushed into the **real `TABS`** (`src/shell/tabs.ts`) when the page loads, which is where the real shell reads the app's screens from; "New app: what you get" takes it out. The design-system page is a DEMO-only view of that tab, not a route.
- The kit's alias `virtual:pwa-register/react` → `src/fakes/pwaRegister.ts` is not a swap: the real `App.tsx` imports a module that only the app's own PWA plugin makes up, and the kit never calls it.
- **Trap 3 (L6): the host page's own base styles are unlayered and beat the app's `@layer base`.** Published as a page, the prototype's background stayed light in dark mode. `prototype/src/index.css` restates the base background, colour and font unlayered; keep it. It also adds `@source "./"`: the real `global.css` makes Tailwind scan `src/` only, so the kit's own classes need a source of their own, or they are not built.
- The defines (`__BUILD_HASH__` and the others) are fixed in `vite.config.ts`, and the check runs in Warsaw time, so the build line reads the same in every run ("Wersja 0.1.0 · build 3f9c2a1 · 06.11.2026 13:52").

## The check before publishing

`npm run proto:check` from the repo root (about a minute): it typechecks the kit (`tsc -p prototype/tsconfig.json`), runs `prototype/check/kit.test.mjs`, then `bash prototype/check/run.sh`, which builds the kit, inlines it into one page (`prototype/starter-prototype.html`, not committed) and runs `check/clipping.mjs`. Exit 0 means: no page error and no request for anything outside the page; no clipped element and no sideways scroll at 390 and 1280 px in light and dark; the menu lists 20 states, each with an `expect`, and every one is met; the PHONE FRAME pass is green; 80 screenshots in `prototype/check/shots/`.

- **Publish only after a clean run, and look at the screenshots.** The check sees boxes and text, never taste. Open the pictures of the states you changed. The comparison with the frozen reference (`design/0.1/prototype/`, the 80 pictures of the prototype before the kit replaced it, named the same way as `check/shots/`) is made once, before the release.
- The light pass goes through the states in the menu's order and the dark pass in the reverse order, so a state that only works after the one before it is found.
- **Run it at every merge that changes a module the kit renders** (RULES.md, "Verification by chunk type"; L28: a prototype state drifted when a module it renders was rewritten, and its build did not catch it).
- A layout defect the check finds in a `src/` component is fixed there if it is layout only (a clipped row, a wrapped button), and listed in the chunk's report (TASKS.md, Decided 48); a behaviour change is a decision card.
- When a state is added: an entry in `ENTRIES` (its `patch`, its `at` path, its `expect`), the count in `STATES` (`check/clipping.mjs`) and `EXPECTED_STATES` (`check/kit.test.mjs`), and a value in `base` in `demoStore.ts` if it needs a new fact.

## Where Playwright is

The kit's check uses the environment's Playwright, never a dependency of the repo (Decided 5). A cloud session has it, with its own Chromium, and `require('playwright')` finds it. `clipping.mjs` falls back to `PLAYWRIGHT_PATH` (the path of Playwright's `index.js`) when `require` cannot. On a PC: `npm install -g playwright` and `npx playwright install chromium` once. Chromium launched under the agent proxy sends `127.0.0.1` through it, so the check opens the page from a file (`file://`) and never from a dev server.

# DECISIONS.md

*A record, not an inbox (BUILD.md 2.1, step 3). New decisions are raised as decision cards (RULES.md, "Decision cards") and recorded here as entries once answered; no entry is ever rewritten.*

*Entries use BUILD.md 2.1's format:*
```
## [n] [The ask, one line]
Chunk: [n]   Date: [date]
Recommendation: [one line]
Answer: [Adam's, as given to the coordinator]
Evidence: [short; or a pointer to HISTORY.md]
```
*Answered entries stay, so the same question is never asked twice. "For the release" keeps every flagged migration, one line each.*

## For the release
*(no flagged migration so far)*

## Tests owed
*(missing proof only)*
- Chunk 4, `src/features/auth/authService.test.ts`: a pair that tells the error code from the message: `new AuthApiError('Invalid login credentials', 400, 'validation_failed')` → `failed`; `new AuthApiError('Something else', 400, 'invalid_credentials')` → `wrong` (B1 review: swapping the code check for a message regex kept all 156 tests green). Owed to the release step's tests-owed pass.

## 57 The 30% rule stopped the build after chunk 0, which ran under: continue?
Chunk: 0   Date: 2026-11-06
Recommendation: continue as planned; the re-estimate is ≈ $165 and ≈ 5.5–6.5 h (planned $170, 8.1 h).
Answer: Adam, 22:36: a) continue as planned. To-do 1 (Docker Hub secret as "basic"): Adam does it. To-do 2 (no tag to delete; the release ends with his two commands): noted.
Evidence: CONTEXT.md "Where the build is"; LEARNINGS B9.

## Decided by the coordinator (technical, under Adam's rule of 2026-11-06)
*Technical and architecture questions raised during the build, decided by the coordinator by the guiding rule and the lift rule, each with its one-line reason. Same format; "Answer" names who decided. TASKS.md "Decided" 1–49 are the planning session's; these continue from 50.*

## 50 The meter: get_session has no usage.cost_usd
Chunk: setup   Date: 2026-11-06
Recommendation: dollars from every transcript of the session (coordinator and agents) at API list prices; hours by the wall clock.
Answer: coordinator. Reason: the only figure available; it is the same tokens-times-price a cost meter shows (it is not Adam's bill).
Evidence: CONTEXT.md "Repo facts", setup check.

## 51 Agents are started as general-purpose agents that read their Overload definition first
Chunk: setup   Date: 2026-11-06
Recommendation: model and effort set on each call; the brief's first line names the definition file in the clone; the brief's overrides (`main`, no staging, the clone's path) win.
Answer: coordinator. Reason: definitions copied mid-session are not registered as agent types ("Agent type 'builder' not found").
Evidence: CONTEXT.md "Repo facts".

## 52 RULES.md keeps "Staging" and "Pages for me" from chunk 0
Chunk: 0   Date: 2026-11-06
Recommendation: keep them, as TASKS Decided 42 says; SPEC item 7's "staging and release sections come with the client-ready build" is read as the release and staging-script sections; RULES.md says staging lines apply only to an app with staging.
Answer: coordinator. Reason: Decided 42 settled it in planning; the sections cost nothing to an app without staging and the client-ready build needs them.
Evidence: chunk 0 report, item 3a.

## 53 HISTORY.md keeps newest entry first
Chunk: 0   Date: 2026-11-06
Recommendation: the starter's own header's order (Overload appends oldest first).
Answer: coordinator. Reason: one order per file, the one its header states; the file has one entry.
Evidence: chunk 0 report, item 3d.

## 54 The embeds check's local PostgREST runs its anon role as `postgres`
Chunk: 2   Date: 2026-11-06
Recommendation: `PGRST_DB_ANON_ROLE=postgres` in `check-embeds-local.sh`, with a tripwire test.
Answer: coordinator. Reason: Decided 39 revokes `anon` on own and signed-in tables, so an `anon` probe fails every valid embed on them (401/42501); the probe is `limit=0` on a throwaway replay, and grants are verify-rls's job (which keeps the real `anon`).
Evidence: chunk 2 report; B0 review re-ran it (revoked table OK 200, ambiguous FK still PGRST201).

## 55 The locale stays in two places
Chunk: 1   Date: 2026-11-06
Recommendation: `app.config.ts` `locale` (page and manifest language) and `format.ts` `LOCALE` (formats), each naming the other.
Answer: coordinator. Reason: formats and words change together per market; deriving one from the other puts the config define into every test and the kit.
Evidence: chunk 1 report, card 1.

## 56 The sign-ups check runs in CI
Chunk: 3 (added to its workflow edit)   Date: 2026-11-06
Recommendation: one step `node scripts/check-signups.mjs` in `migration-replay.yml`.
Answer: coordinator. Reason: the B0 review found the check ran only under `npm run check`; a check that guards client data should run on every PR.
Evidence: B0 review, chunk 2.

## 58 verify-rls's CI needs `npm ci`
Chunk: 3   Date: 2026-11-06
Recommendation: a separate `npm ci` step in `migration-replay.yml`.
Answer: coordinator. Reason: verify-rls imports supabase-js; the smallest change.
Evidence: chunk 3 report, card 1.

## 59 verify-rls counts with a GET and `limit(0)`, never HEAD
Chunk: 3   Date: 2026-11-06
Recommendation: `select(col, {count: 'exact'}).limit(0)`: the same server-side exact count, zero rows, the error code intact.
Answer: coordinator. Reason: a refused HEAD reaches supabase-js with no code (status 401, code null), so 42501 can't be read (Decided 40) and every correct refusal would FAIL; measured by builder and reviewer.
Evidence: chunk 3 report, card 2; review `head-vs-limit0`.

## 60 Public tables are also probed as a signed-in user
Chunk: 3   Date: 2026-11-06
Recommendation: keep the extra probe (A reads ≥ 1 row).
Answer: coordinator. Reason: SPEC "rows expected for everyone"; break 11 (select revoked from authenticated) is caught only by it.
Evidence: chunk 3 report, card 4; review.

## 61 The app's replay seed for verify-rls
Chunk: 3 (follow-up before merge)   Date: 2026-11-06
Recommendation: `verify-rls-replay.sh` (app mode) applies an optional `supabase/verify-rls-seed.sql` after the migrations, as postgres, one transaction (users A and B with `replay-tokens.mjs`'s ids, rows per table); without it a non-empty list fails loudly.
Answer: coordinator. Reason: RULES.md forbids changing a shared script during a build, so leaving it to the first app's first DATA chunk would stop that build on a card.
Evidence: chunk 3 review, card A; follow-up 77785a0.

## 62 The script tests run in CI
Chunk: 3 (follow-up)   Date: 2026-11-06
Recommendation: one step `npm run check` after `npm ci` in `migration-replay.yml`.
Answer: coordinator. Reason: `verify-rls-list.test.mjs` (SPEC Rule 6's guard: every table the code reads is in the list) is the only check that catches an unlisted table, which verify-rls itself simply never probes; the same reason as 56.
Evidence: chunk 3 review, card B; 175/175 under a bare environment.

## 63 verify-rls fails an own or signed-in table that `anon` holds any privilege on
Chunk: 3 (follow-up)   Date: 2026-11-06
Recommendation: the catalog reads `has_table_privilege('anon', …)` (direct, PUBLIC and default privileges) and fails such a table; it fails closed without the field.
Answer: coordinator. Reason: Decided 39 enforced mechanically; a migration that leans on the default privileges passes every probe (the policies hide the rows) and only this catches it.
Evidence: chunk 3 review, card C; follow-up break (no `revoke all` → catalog FAIL on fx_own and fx_shared, every probe PASS).

## 64 The words check stays strict on class strings
Chunk: 4   Date: 2026-11-06
Recommendation: classes are written in `className` (literal, ternary or `+`) or one class per string through `cx()`; `cx('a b')` with a multi-word string is a words hit.
Answer: coordinator. Reason: loosening the check for class-like strings would let lowercase multi-word phrases through (Decided 10 as Overload's scanner reads it).
Evidence: chunk 4 report, card 1; B1 review (`cx('flex gap-2')` a hit, `cx('flex','gap-2')` passes).

## 65 Sign-in: no answer is "offline", a server error is "failed"
Chunk: 4   Date: 2026-11-06
Recommendation: `AuthRetryableFetchError` is `offline` only with status 0 (no answer); a 5xx answer is `failed` with its reason.
Answer: coordinator. Reason: SPEC shows offline for "no connection"; a server that answered is connected, and its reason helps.
Evidence: chunk 4 report, card 3; B1 review through the real supabase-js (aborted → offline; 429 → failed with the reason).

## 66 The tokens check also reads CSS declarations
Chunk: 5 (follow-up before review)   Date: 2026-11-06
Recommendation: in `src/**/*.css` except `tokens.css`, `font-size`, the radii, the shadows and the colour properties must be `var(--…)` or a keyword; layout passes.
Answer: coordinator. Reason: SPEC item 4's sentence ("a typed-in colour, text size or radius in `src/`") covers CSS; the scope listed only the Tailwind and inline forms.
Evidence: chunk 5 report, card 1; follow-up 79c077f; B1 review (`font-size: 13px` in CSS a hit).

## 67 Capitalised developer tokens get one ALLOWED entry each
Chunk: 5   Date: 2026-11-06
Recommendation: `'Escape'`, `'Tab'`, `'PLN'` and the like are words-check hits (Decided 10: code-like means not starting with a capital); each gets one ALLOWED entry with its reason.
Answer: coordinator. Reason: the scope fixes the pass classes; an entry is one visible line, a new pass class would hide more than it should.
Evidence: chunk 5 report, card 2.

## 68 ALLOWED entries are the one change to a shared check allowed during a build
Chunk: 5   Date: 2026-11-06
Recommendation: RULES.md "Reviewer rules": a chunk may add an ALLOWED entry, with its reason, to `check-wording.test.mjs` or `check-tokens.test.mjs`; nothing else in a shared script changes during a build.
Answer: coordinator. Reason: chunk 6 needs entries (`'Escape'`, `'Tab'`, the focus-trap selector), and the rule as written would revert them.
Evidence: chunk 5 report, "heads-up for chunk 6".

## 69 A `revoke` on a table the same batch creates is on check-migration's safe list
Chunk: 7 (follow-up before review)   Date: 2026-11-07
Recommendation: `scripts/migration-rules.mjs` passes a `revoke` only when every table it names is created earlier in the same batch; any other revoke stays flagged.
Answer: coordinator. Reason: Decided 39 puts a revoke in every own and signed-in table's migration, and the lifted safe list flagged it, so every app's every table would have stopped on a card; a revoke on a table that did not exist before the batch cannot change existing data or access (the `grant` case's reason). It loosens a data-safety check, so Adam is told at the build's end.
Evidence: chunk 7 report, card 1; follow-up 6815c4e; B2 review (25 adversarial statements: only that case newly passes).

## 70 The Toast is mounted once, by chunk 8
Chunk: 6   Date: 2026-11-07
Recommendation: chunk 8 mounts `<Toast />` once inside `AppRoutes`' `WidthRoot`, with an `App.test` assertion.
Answer: coordinator. Reason: `App.tsx` is chunk 4's, outside chunk 6's scope, and nothing in `src/` shows a toast until a write exists (SPEC Rule 3, Decided 36).
Evidence: chunk 6 report, card 2.

## 71 The kit's example screens enter the real route table at load
Chunk: 8   Date: 2026-11-07
Recommendation: the kit pushes its example tab into the real `TABS` array at load (as a build edits `tabs.ts`) and takes it out for "New app: what you get"; the design-system page is a DEMO-only view inside that tab.
Answer: coordinator. Reason: nothing in `src/` changes and the kit's swap list stays at five (no copy of a `src/shell` file); it fails loudly at load if `tabs.ts` ever freezes the array.
Evidence: chunk 8 report, card 1; B3 review.

## 72 The kit aliases the PWA's virtual module to a no-op
Chunk: 8   Date: 2026-11-07
Recommendation: `virtual:pwa-register/react` is aliased to a no-op in `prototype/vite.config.ts`.
Answer: coordinator. Reason: the module exists only under the app's PWA plugin, so the kit could not resolve `AppRoutes`' import chain; an alias keeps the swap list at five.
Evidence: chunk 8 report, card 2.

## 73 The meter is `get_session`'s `usage.cost_usd` from 01:25
Chunk: 8–9   Date: 2026-11-07
Recommendation: from the first reading at 01:25 the session's own `usage.cost_usd` is the meter; DECISIONS 50's derived figure is kept only for the earlier per-chunk lines (× 0.73 to compare).
Answer: coordinator. Reason: the field the brief named appeared about four hours into the session; at 01:25 it read $111.13 where the derived meter read $152.2, so the derived one overcounted by ≈ 37%.
Evidence: `get_session` at 01:25 and 01:34; CONTEXT.md.

## 74 L239 is the one exception to "every flagged migration is a card"
Chunk: 9   Date: 2026-11-07
Recommendation: as Overload's L239 (Adam's rule, 2026-10-05/10): a flagged migration that changes no existing row is merge-ready with no card once the replay, the embeds check and the reviewer's count-and-fingerprint check pass; a destructive one always comes to Adam.
Answer: coordinator, as built, pending Adam's confirmation at the build's end (it is his own Overload rule, now in a template every app inherits). The B3 reviewer suggests adding "and verify-rls on the replay passes", since replacing a function or view can change access without changing a row.
Evidence: chunk 9 report, card 1; B3 review.

## 75 A branch is brought up to date by merging the base in, by the coordinator
Chunk: 9   Date: 2026-11-07
Recommendation: the definitions say "the coordinator brings it up to date"; RULES.md carries L543 (merge the base into the branch, never force-push).
Answer: coordinator. Reason: a rebase needs a force-push, which the classifier refused in Overload; an agent's run ends at its report, so the reviewer cannot do it between merges (LEARNINGS B7).
Evidence: chunk 9 report, card 2.

## 76 The checklist page's browser tests skip visibly without a browser
Chunk: 10   Date: 2026-11-07
Recommendation: CI (no Playwright) skips the 17 browser tests with the reason shown; reviewers and the release run them with `CHECKLIST_REQUIRE_BROWSER=1`, which fails when the browser is absent.
Answer: coordinator. Reason: adding Playwright to the shared workflow is a dependency for one page; a skip that says so is not a pass, and the reviewer runs it for real.
Evidence: chunk 10 report, card 1; B3 review (29/29, 0 skipped).

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

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
*(missing proof only; none so far)*

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

# RULES.md

## Index
Read this index, then the sections marked ALWAYS, then only the sections your brief names. Sections are in file order. Rules are never pruned; a rule discovered during a build is added the session it is found. The BUILD.md sections are lifted from Overload's RULES.md (`adamjuszczyk/overload-v2`, commit `8e00877`, lines 1–160), which had brought them to **BUILD.md 2.2** (Usage, Verification by chunk type, The build loop, Staging, Pages for me); where they and BUILD.md still disagree, BUILD.md wins. In the lifted lines, "1.2" and the lesson numbers (L15 and so on) are Overload's, kept as provenance.
- **ALWAYS** Escalation — what is brought to Adam, never decided.
- **ALWAYS** Reviewer rules — how a review is done and recorded.
- **ALWAYS** Verification by chunk type — DATA and LIGHT.
- **ALWAYS** Usage — reads, tests, turns, the report's running time (agents never estimate cost; the coordinator reads the meter), limits.
- **ALWAYS** Decision cards — the format a stop takes.
- **ALWAYS** The build loop — roles, where chunks go, the loop, running without Adam, the stop rules (BUILD.md 2.2, step 4, for agents who never read BUILD.md).
- Staging — re-seeds (BUILD.md 2.2, step 5): needed by the coordinator and any agent that writes on staging.
- Pages for me — the pages Adam works from (BUILD.md 2.2, step 5): needed by the coordinator and the release reviewer.
- Standing rules — BUILD.md's standing rules.
- Models — the tiers and efforts per role.
- Checks that lied — checks that passed while wrong; re-seed checks.
- Rules discovered during builds — starts empty: chunk 9 fills nothing into it, and the stack skill holds the lifted code rules.

## Escalation — bring these to Adam, don't decide them
- Anything SPEC.md is ambiguous or silent about.
- Any change beyond the chunk's stated scope.
- A failed staging or production deploy.
- Without staging: any migration check-migration flags.

A stop reaches Adam as a decision card (below), with full reasoning. Overload's 1.2 criteria, lifted without the items that are Overload's alone, still hold (the numbers are Overload's: a gap is an item left out):
Stop and report to Adam (do not route around, do not ask "should I continue without it") when:
1. **Live verification is required and browser tooling is unavailable.** 1.2: the reviewer's browser must load staging and sign in with the test account; probe it before starting the build (`requestAnimationFrame` probe or a real navigation — never assume from a prior session). Same weight as a failing test. Only exception: Adam, in-session, told plainly what won't be verified, overrides it for that step.
3. **A login is needed** (Supabase dashboard, the app). Adam signs in himself; passwords, tokens and session JWTs are never entered, typed, printed or recorded. If a tool or classifier refuses to return a token, stop and ask Adam (he once chose to reconstruct the payload from documented data instead); don't hunt for a workaround, and don't assume last session's extraction technique still works.
4. **Anomalous data:** an investigation turning up real corrupted data broader than known — report, don't push over it.
5. **A found problem meets a deploy gate.** A brief that says "stop and report rather than ship over a problem" is not cleared by fixing it yourself; ask in-session before deploying.
6. **Anything irreversible or spending real money:** deleting or mutating real rows, any write to production for live testing (needs an explicit go-ahead first; the permission classifier may also block a delete — ask again rather than retry).
8. **`node scripts/check-migration.mjs` exits 1 or 2 at the release, or on a hotfix to the default branch:** don't merge; Adam gets one blocking DECISIONS.md decision covering every flagged migration. During a build with staging a flag does **not** stop: merge into staging and log it under "For the release".
9. **Two documents disagree** (cross-references, migration numbers, spec vs shipped label): read the section fresh, report the conflict, don't pick a side silently. Same for a decision the spec leaves open — flag it, don't assume it.
10. **Data the check needs doesn't exist** (for example, no second account): say so plainly. Never fabricate rows or substitute silently to force a run.
13. Any change beyond the chunk's stated scope in TASKS.md.
14. Anything SPEC.md is ambiguous or silent about.
15. **A failed Supabase deploy:** on the staging branch after a schema merge (blocking during the build), or on production at a release or hotfix.
17. Any live check that writes **on production**. On staging, writes as the staging test account are pre-authorised.
19. Any UI that can't be built from the app's existing components and design tokens. Builders never invent a new visual language.

## Reviewer rules
- Verify against the real thing. A passing check proves only what it touched. If unreachable and passing look the same, the check is wrong.
- Never fix before understanding the cause.
- Don't read code to check what a script can check. No script yet: write one, or verify by hand and say so.
- Run every script in scripts/ at every chunk boundary.
- Never write an unconfirmed belief into CONTEXT.md as fact.
- Shared scripts are never changed during a build. A chunk that changes one gets the change reverted before merging. The one exception: an `ALLOWED` entry, with its reason, in `scripts/check-wording.test.mjs` or `scripts/check-tokens.test.mjs` (DECISIONS 68).

Also, from 1.2's reviewer rules (kept):
- Never switch branches in the main checkout while a builder runs or resumes; a reviewer works in its own `git worktree`.
- Commit verification scripts to `scripts/` and run all of them at every chunk boundary, not just this chunk's.
- Escalate with full reasoning, not a verdict and options. Verification proportional to risk: break-prove every place that writes data; one break per call pattern for read-only display wiring; fingerprint the database only for a migration that touches existing rows.
- A migration goes live on staging (merged, its deploy read, the probe green) before the code that needs it; a `check-migration` flag is logged under DECISIONS "For the release", never stopped on during a build with staging.
- At every merge: one line in CONTEXT.md "Where the build is" (and its spend and hours), the long form in HISTORY.md, answered cards and flagged migrations in DECISIONS.md; CONTEXT.md stays under its ceiling and is rewritten at merges only. A rule discovered is written into this file the same session.
- Screens are compared with the prototype once, before the release (BUILD.md step 5, "Before the release"); a chunk's review checks that the captures exist and that the tests prove the wiring. Prototype data handling in a real file fails a review.
- With staging, nothing in the build touches the default branch (CONTEXT.md, "Repo facts"); the release is BUILD.md step 5.

## Verification by chunk type
- DATA: one break proof per place that writes data; staging check; database fingerprint only for migrations touching existing rows.
- LIGHT: one break per call pattern; no per-chunk staging check. At a batch's last merge, the batch's screen captures are re-taken on the merged code and compared with the committed ones (parallel branches can leave a sibling's pictures stale: LEARNINGS L28; React `useId` ids are noise).
- The prototype kit's check runs at every merge that changes a module the kit renders (L28: a prototype state drifted when a module it renders was rewritten; its build didn't catch it).
- No mutation sweeps.

How (1.2's practice, kept): every rule is asserted at the call site or screen that uses it, with fixtures that tell the right data source from the wrong one (the status row vs a cached one, `deleted_at` vs `kind`, the queue's delete vs the server's row, the week in force vs the run copy's schedule); a break proof changes the asserted payload, watches the test fail, and restores from a `cp` backup, never `git checkout --`; a migration is proven on the replay as the signed-in role with pg-safeupdate loaded and by its effect on staging; the reviewer re-runs every break and adds one only where a writer has none; fixture dates are derived from weekdays with the queue printed; a LIGHT chunk writes nothing new (Overload's SPEC, Rules 7), and one that adds a request, a column or a queue item is a DATA question (a decision card); what a chunk's verification would not catch is written in TASKS.md and read by its reviewer.

## Usage
- Commands finish in under 5 minutes.
- Affected test files only, until one full suite before release.
- Narrow reads: grep, line ranges, touched files only.
- Batch tool calls.
- Quiet test output.
- Every chunk report ends with its running time (and its context figure). **Agents never estimate their cost:** their guesses ran about half the real figure (LEARNINGS L26). The coordinator reads the meter (`get_session`, `usage.cost_usd`, which counts every agent it starts) before and after each chunk and records the dollars, the hours and the running totals; the weekly % is meter dollars ÷ the dollars per 1% (`scripts/cost-table.md`), with Adam's usage page at a build's start and end (L18).

Also: a chunk over 2M context stops and reports (a stop rule); reviewers read this file's index and ALWAYS sections plus the sections their brief names, and from CONTEXT.md only the sections the chunk touches plus "Where the build is"; never resume a long-running agent, start a fresh one from a short summary; a usage-limit stop of the coordinator is resumed by its own scheduled task (The build loop, "Running without Adam"), never by Adam.

## Decision cards
The coordinator stops with a decision card: self-contained, in plain words, so Adam can paste it into Chat. One ask per item; decisions and to-dos listed separately, ordered by what they block. Only blocking questions stop the build; non-blocking ones wait and come as one batch at the release. A builder or reviewer raises what it may not decide (Escalation above) in its report, in the same shape, and the coordinator carries it.

```
WAITING ON ADAM — [what it blocks]

Decisions
1. [The ask.] Options: [a / b]. Recommend: [x], because [one line].
   Blocks: [chunk].

To-dos
1. [What to do.] Blocks: [chunk].

Evidence: DECISIONS.md [entry numbers].
```

Adam discusses in Chat and replies to the coordinator with the answers; the coordinator records them in DECISIONS.md (BUILD.md 2.1's entry format, in that file's header) and, when an answer changes behaviour or wording, in SPEC.md. DECISIONS.md is a record, not an inbox.

## The build loop (BUILD.md 2.1, step 4)
**Roles.** The coordinator is the one session Adam starts: it starts every builder and reviewer, merges, keeps one line per chunk, tracks cost, writes decision cards, and never reviews code itself. A builder (`.claude/agents/builder.md`) is one per chunk, fresh: it builds on a branch and reports briefly with its running time. A reviewer is fresh, started by the coordinator after the builder reports: a DATA chunk gets its own full reviewer (`reviewer-data.md`); for LIGHT chunks the coordinator runs the builders for 2–3 of them, then one reviewer (`reviewer-light.md`) checks all their diffs and tests together; a batch holds only chunks that don't depend on each other, and they merge in TASKS.md order. Subagents can't start subagents, so the coordinator does all the starting. Every brief names the exact files and RULES.md sections the agent needs.

**Where chunks go.** The base branch comes from CONTEXT.md, "Repo facts" ("Base branch", "Default branch", "Staging"), never from this file. Without staging (`Staging: no`) the base branch is the default branch: builders branch off it and every chunk merges into it through a squash-merged PR. With staging (`Staging: yes`, an app with real users) the base branch is `staging`: builders branch off `staging`, every chunk merges into `staging` through a squash-merged PR, and nothing touches the default branch until the release. Either way, never stack branches. Anything in this file about staging applies only to an app with staging.

**The loop.** (1) The coordinator reads the meter, then starts the builder with the chunk, the files and the RULES.md sections it needs; the builder ends with a commit beginning `chunk N complete` and a short report with its running time. (2) The coordinator starts the reviewer (or batches LIGHT chunks first; at a batch's last merge the reviewer re-takes the batch's captures on the merged code, L28). **While a review runs, the next chunk's builder starts beside it** when the two share no files (L29). (3) The reviewer checks against the chunk's verification and scope, runs every script, and reports. (4) The coordinator merges (the squash-merged PR; the reviewer reports merge-ready, it never merges), reads the meter, **records the chunk's dollars and hours against the estimate (the 30% rule) and only then starts anything new** (L21), updates CONTEXT.md, and moves on without ending its turn. The coordinator never starts a chunk that has an open question in DECISIONS.md; it builds another chunk meanwhile. After any stop, the coordinator checks the branch for what was already committed and continues from there. The coordinator writes every record (CONTEXT.md's line, the reviewer's report as HISTORY.md's long form, DECISIONS.md's tests owed and flagged migrations, RULES.md's rules discovered, LEARNINGS.md's lessons); builders and reviewers write none of these files.

**Running without Adam.** The build runs until something is waiting on him or the budget is reached; no day or night modes. **Full speed always:** the coordinator doesn't slow down near a usage limit; if Adam wants to keep part of his week, he slows or stops the build himself with a message (L20, L27). He gets one line per chunk, and a summary whenever he messages the coordinator. **A push notification** (`PushNotification`) for every decision card and to-do (its first line), every limit stop ("limit until HH:MM") and the build's end; none for ordinary merges (L22). **Limit stops resume by themselves** (L15): at its start the coordinator creates an hourly scheduled task bound to its own session (`create_trigger`, `initiation: own_followup`, no new session on fire) whose prompt reads `get_session`'s `rate_limit_info` first and ends the turn at once while a limit holds, otherwise continues the build; it deletes the task at the build's end or when it stops on a card. Adam never sends "continue".

**Stop rules.**
- Budget reached: finish the chunk in progress, then stop and ask.
- First chunk off the estimate by more than 30%: re-estimate the whole build and tell Adam before going on.
- A chunk over 2M context: stop and report.
- Behaviour failure: diagnose the cause first, then the same builder retries once with the cause stated. A second behaviour failure comes to Adam. A chunk that failed twice may move to the stronger model.
- Missing proof only (behaviour right): goes on the "tests owed" list (DECISIONS.md), cleared in one tests-only run before the release.
- Display-only choices a builder made are accepted as built and listed for Adam's vibe check.

**When Adam changes his mind mid-build:** it goes into the next-version notes as `later`, unless re-chunking now is cheaper than building the wrong thing; re-chunking means back to TASKS.

**Before the release** (BUILD.md step 5): agents check everything a screenshot or query can decide against SPEC.md and the prototype, including that the built screens match the prototype; tests owed are cleared in one tests-only run, then one full suite; Adam's vibe check on staging (like, dislike, confused; dislikes go to the next version unless one stops the app being used, which gets one fix pass); every non-blocking question comes to him as one batch.

## Staging (BUILD.md 2.2, step 5)
- **Re-seeding is the agents' job,** through the staging scripts, never a paste of Adam's. **Until the starter's staging scripts exist, the coordinator raises a re-seed as a to-do card the moment it's needed** (with a push notification), and the chunk whose staging check needs it waits for it (LEARNINGS L17).
- Staging stays between builds until the starter's scripts can create, seed and delete it (BUILD.md 2.2, Bootstrap).
- A re-seed while maintenance is on is refused whole (`OL001`): maintenance off first.

## Pages for me (BUILD.md 2.2, step 5)
The vibe-check tour, the release checklist and any procedure Adam runs by hand reach him as **pages** (LEARNINGS L30).
- **The markdown in the repo is the record** (`docs/`), written by the agents.
- **The coordinator publishes the page itself** when setup found it can; if it can't, it brings the markdown to the Chat advisor, which builds the page.
- **Commands are copied into the page by script,** never retyped, and the page is checked against the repo's current state (nothing already done shown as still to do).
- **A page that collects Adam's answers or ticks saves them where Claude can read them,** so "check the page" works.
- A procedure page: Windows cmd commands with copy buttons, an Expect box and a "Stop if" box per step, tick-boxes with progress, fields that fill placeholders like commit ids; the folder to run from and any timing constraint at the top. What's on Adam is only what needs production access or his consent.

## Standing rules
BUILD.md 2.1's, for every build:
- **SQL.** A database console bypasses RLS. Every live query filters explicitly to Adam's own user_id. If another user's data appears, stop: that's a query bug. Never store another user's data anywhere persistent.
- **Migrations.** Forward-only. Applied migrations verified against local source. Destructive ones always come to Adam.
- **AI features.** Deterministic work in tested pure functions. The LLM gets judgment only, fed pre-computed data. Real-data dry run before any AI write touching real history.
- **Credentials.** Agents never get production database credentials. Never provision broad access for a narrow one-time task; Adam does the narrow action himself.
- **Records.** Analyses, logs and other records are never deleted by agents, migrations or regenerations. Only the user's own explicit delete removes one.
- **Backups.** Before every release, and before anything destructive.
- **Snippets.** Any code an agent asks Adam to run in a signed-in page is read first: no network calls, storage access or eval.

## Models (BUILD.md 2.1; names and prices in `scripts/cost-table.md`)
| Role | Tier | Effort |
|---|---|---|
| Spec chat and prototype | Opus | high |
| TASKS: sweep, gap pre-read, estimate | Opus (Fable on trial) | max |
| Coordinator | Opus | medium |
| Builder | Sonnet; Opus after two behaviour failures | highest coding |
| DATA reviewer | Opus | max |
| LIGHT batch reviewer | Sonnet | high |
| Bug investigation | Sonnet | high |
| Audits | most capable | max |

## Checks that lied
Starts empty: chunk 9 fills nothing into this section; the stack skill holds the lifted code rules.

## Rules discovered during builds
Starts empty: chunk 9 fills nothing into this section; the stack skill holds the lifted code rules.

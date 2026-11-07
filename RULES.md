# RULES.md

## Index
Read this index, then the sections marked ALWAYS, then only the sections your brief names. Sections are in file order. Rules are never pruned; a rule discovered during a build is added the session it is found. The BUILD.md sections are lifted from Overload's RULES.md (`adamjuszczyk/overload-v2`, commit `8e00877`, lines 1–160), which had brought them to **BUILD.md 2.2** (Usage, Verification by chunk type, The build loop, Staging, Pages for me); where they and BUILD.md still disagree, BUILD.md wins. In the lifted lines, "1.2" and the lesson numbers (L15 and so on) are Overload's, kept as provenance. **The process rules of Overload's later lines** (161–658: its "Checks that lied", its discovered rules, its usage, break-proof, turn-count and tests-owed sections) are folded into the sections below by chunk 9, TASKS.md's appendix being the sort: one bullet per rule, each ending "(Overload RULES.md Lnnn)", the line of that file at the same commit. Its code rules went to the `stack` skill, its offline-queue and staging-release rules to NEXT.md, and the Overload-only ones were dropped.
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

Also, folded from Overload's later rules (the numbers are lines of its RULES.md):
- **An unscoped query** that returned another account's rows gave a wrong figure: scope every investigation query to one account and recompute the conclusion from that account's data. (Overload RULES.md L176)
- **A bare `select` through any path that bypasses RLS** (a database console, a service key, a script) carries an explicit single-user filter, one-off investigation queries included: the SQL rule under "Standing rules". (Overload RULES.md L229)
- **Migrations that need no decision card.** A flagged migration that changes no existing row (it only adds tables, columns, indexes or rows, replaces a function or view, or relaxes a constraint) is reported merge-ready by the reviewer once the replay, the embeds check and the reviewer's scratch-copy check (every existing table's count and fingerprint unchanged) all pass: the one exception to "Without staging: any migration check-migration flags" above. The migration goes first and the code that needs it after a green deploy. A destructive one stays Adam's. (Overload RULES.md L239)
- **Live verification** against real data is a hard gate whenever a task calls for it (item 1); live tests write only with an explicit go-ahead (items 6 and 17). (Overload RULES.md L360)
- **Commands for Adam are for Windows cmd.** His `>` redirect has produced UTF-16 files (PowerShell's), so anything that reads his output accepts UTF-16. (Overload RULES.md L361)
- **The Supabase CLI is pinned** (`npx --yes supabase@<version>`); `db query --linked` goes through the Management API (a login, no database password); never `db dump --dry-run`, it prints the password. (Overload RULES.md L361)
- **Dry run without credentials** (item 3): from the dev-server tab, dynamic `import()` the compiled modules and call them with the app's own already-signed-in client; throwaway scripts are deleted at once, never committed, and `git status` is checked afterwards. (Overload RULES.md L362)

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
- At every merge: one line in CONTEXT.md "Where the build is" (and its spend and hours), the long form in HISTORY.md, answered cards and flagged migrations in DECISIONS.md; CONTEXT.md stays under its ceiling and is rewritten at merges only. A rule discovered is written into this file the same session, not left only in a log (Overload RULES.md L368).
- Screens are compared with the prototype once, before the release (BUILD.md step 5, "Before the release"); a chunk's review checks that the captures exist and that the tests prove the wiring. Prototype data handling in a real file fails a review.
- With staging, nothing in the build touches the default branch (CONTEXT.md, "Repo facts"); the release is BUILD.md step 5.

Also, folded from Overload's later rules (what a check proves and how a review is done):
- A passing suite does not prove a refactor: re-run it against real data and frozen snapshots. (Overload RULES.md L163)
- A browser tool's click can report success without firing: verify the resulting state, never the click. (Overload RULES.md L167)
- A claim that something "never reaches the client bundle" (server-only code, a secret) is verified by construction or by a real call, never assumed. (Overload RULES.md L169)
- Never judge a rule harmless from one consumer: audit every consumer of a rule before calling a change to it safe. (Overload RULES.md L177)
- Parse a tool's or a model's output in the process that received it, never retyped. (Overload RULES.md L179)
- A check scoped to one account describes that account only: say so when ruling a case out, and never call a spec gap void on it. (Overload RULES.md L188)
- "Compared by hand" hides bugs: a parity claim needs an executed comparison. (Overload RULES.md L190)
- Read a builder's "deliberate scope decisions" as possible regressions, not as answers: a new grouping or layout keeps every per-item action the item already had. (Overload RULES.md L191)
- Never grep for a deferred live check and call it verified: carry it forward by name. (Overload RULES.md L363)
- Adversarial review: independent reviewers per dimension, each finding re-verified against the current source; report raw against confirmed counts, fix the confirmed bugs, keep the refuted findings noted, and say which findings got adversarial verification and which were checked by hand. (Overload RULES.md L364)
- Read the current file or section before editing or citing it ("confirmed, not assumed"); a subagent's report is spot-checked at its cited lines before it is written down as fact; report expected results as expectations until checked, and outcomes faithfully. (Overload RULES.md L365)
- A chunk's TASKS verification can pass while the built thing contradicts SPEC's wording: review each chunk against the SPEC text in its brief as well as its verification list, and put SPEC's exact words in the brief. (Overload RULES.md L369)
- A live tool's write is confirmed by a server-side count read as the account, never by the tap or by a missing error-text match. (Overload RULES.md L391)
- A TASKS list of the places that read something is a hint, not a census: check it with a syntax-tree scan of every read shape (property, bracket, destructured, whole object), and settle "needed or an addition" (Escalation: a change beyond scope) by running the writer and the screen with and without the change. (Overload RULES.md L450)
- A screen test that mocks its read service proves nothing about the reads: the service gets its own test against rows that belong elsewhere, and its embeds go through the embeds check. Ask for it whenever a screen test mocks the module that reads. (Overload RULES.md L456)
- A capture is checked for the variant and the state it shows (read the markers of its text dump) before it is held against the prototype's picture, and each drawn state must show what it is named for. (Overload RULES.md L459)
- A test that leaves a field out of a check its spec names is read against SPEC before it is accepted; the module not keeping the value is no reason. (Overload RULES.md L460)
- A value one module writes and only another reads is probed through that reader. (Overload RULES.md L465)
- A test file removed with the code it tested is read describe by describe first: one describe may test readers that stay. (Overload RULES.md L492)
- A wording fix is looked for in every test that pins the old text, not only in the file a review names, and the whole folder runs before it is called done. (Overload RULES.md L494)
- A live-check line that names a screen's words is held against the prototype's frames before it is run: a word shown only after an action means the check is that action. (Overload RULES.md L498)
- A tool that presses a write on a real screen keeps the page open until the finished direction's label is drawn and no request has been in flight for a few seconds (a pending label is not a done signal), and fingerprints the content before and after. (Overload RULES.md L499)
- A test file removed with the module it tested is held rule by rule against the tests of the module that replaces it, with a break for each rule it pinned. (Overload RULES.md L561)
- When one reader of a flag is fixed, every reader that decides the same thing is checked for the same assumption. (Overload RULES.md L617)
- A chunk that changes a rule module updates every test that restates the old rule, and the full suite is what finds them; a walk's oracle takes its input from the harness's own record, never from the module. (Overload RULES.md L620)

## Verification by chunk type
- DATA: one break proof per place that writes data; staging check; database fingerprint only for migrations touching existing rows.
- LIGHT: one break per call pattern; no per-chunk staging check. At a batch's last merge, the batch's screen captures are re-taken on the merged code and compared with the committed ones (parallel branches can leave a sibling's pictures stale: LEARNINGS L28; React `useId` ids are noise).
- The prototype kit's check runs at every merge that changes a module the kit renders (L28: a prototype state drifted when a module it renders was rewritten; its build didn't catch it).
- No mutation sweeps (Adam, 2026-10-26): DATA chunks one break per place that writes data, LIGHT chunks one break per call pattern; the reviewer re-runs the builder's breaks and adds its own only for a place or pattern that has none. (Overload RULES.md L652)

How (1.2's practice, kept): every rule is asserted at the call site or screen that uses it, with fixtures that tell the right data source from the wrong one (the status row vs a cached one, `deleted_at` vs `kind`, the queue's delete vs the server's row, the week in force vs the run copy's schedule); a break proof changes the asserted payload, watches the test fail, and restores from a `cp` backup, never `git checkout --`; a migration is proven on the replay as the signed-in role with pg-safeupdate loaded and by its effect on staging; the reviewer re-runs every break and adds one only where a writer has none; fixture dates are derived from weekdays with the queue printed (a hand-typed "Friday" dated on a Saturday made scenarios fail for a reason the code hadn't caused: Overload RULES.md L183); a LIGHT chunk writes nothing new (Overload's SPEC, Rules 7), and one that adds a request, a column or a queue item is a DATA question (a decision card); what a chunk's verification would not catch is written in TASKS.md and read by its reviewer.

Folded from Overload's later rules, in groups (the standing rules above come first; each rule ends with its line of Overload's RULES.md):

### Break proofs
- A test can pass under a broken implementation (decorative asserts): prove a test by injecting the break it claims to catch. (Overload RULES.md L173)
- Confirm the injected failure fired before reading "nothing persisted" as proof: its error text must appear. (Overload RULES.md L184)
- A break or mutant run in a scratch copy starts with an unmutated control run in that copy, and a catch is read by the failing test's name, never by "failed > 0" (a copy that cannot load its tests fails every file and reads as caught everywhere). (Overload RULES.md L200)
- Restore from a `cp` backup, never `git checkout --` on a file with uncommitted changes: checkout reverts every uncommitted edit, not only the break. A break is one exact replacement that must match once: one that never fired reads as caught. After a loop of breaks, what is on disk (a build, screenshots) is the last break's: rebuild from the restored code before reading it. (Overload RULES.md L238)
- A break runner counts a catch only by a failing assertion: flag timeouts, print each failing test's duration, and run breaks with a test timeout well above the code's longest real-time cap. (Overload RULES.md L340)
- Every break runner has a comment-only control, which must read as unchanged. (Overload RULES.md L358)
- A `spawnSync` timeout kills only the direct child (killing `npx` leaves its vitest and workers running): run the binary itself in its own process group (`detached: true`, kill `-pid`) and check `ps` after any run of breaks; before blaming a full-run timeout on a regression, re-run its file alone. (Overload RULES.md L396)
- `setsid` returns at once when it is already a process-group leader: start a run with `setsid -w` (or the runner's own detached group) and check `ps` before starting a second run on the same files. (Overload RULES.md L397)
- A break run uses its own process group with a wall-clock kill and a memory cap (`NODE_OPTIONS=--max-old-space-size=…`). (Overload RULES.md L405)
- A break can survive because a later step decides the same outcome: when a branch's only effect is an intermediate value, pin that value in a test of its own. (Overload RULES.md L416)
- A break that survives a named proof can be one of several holes in the same function: classify every survivor (an equivalent mutant, defensive code, pre-existing, or a missing proof) and re-break after adding tests; the whole-function sweep this was found by is no longer run (no mutation sweeps). (Overload RULES.md L422)
- A break runner decides by the run's exit code, never by a pattern matched in the test output, and is checked before any verdict is used: on a must-catch, a must-survive and a comment-only control, with a timeout far above the heaviest test and one runner per tree; a ReferenceError, a crash or a timeout is flagged and re-run alone. (Overload RULES.md L475)
- A catch counts only when a failing assertion caused it: a control "caught" by a timeout or a full disk is a flag, neither a catch nor a broken runner: re-run it alone, print the counts and check the output for non-assertion errors. (Overload RULES.md L510)
- A condition that guards stored values for an input only a later chunk can produce is pinned now, with that input; when it isn't, it goes on the "tests owed" list. (Overload RULES.md L524)
- A runner that bails on the first failure (`--bail=1`) re-runs without bail every verdict that isn't CAUGHT: the JSON report can miss a failure under bail. (Overload RULES.md L526)
- A break runner resolves its output paths to absolute ones: vitest's `--outputFile` is relative to vitest's working directory, the worktree, so a relative one writes reports inside the repo. (Overload RULES.md L557)
- A break that survives is read as a hole in the tests or an equivalent mutant before a test is written, and the fixture gives the break a different value to show. (Overload RULES.md L571)
- A break that survives at the screen can be an equivalent mutant there: name every test file the line matters to, and assert where the line alone does the job. (Overload RULES.md L577)
- A screen that routes a call through a rule whose own guard already gives the same answer cannot show the routing: the proof is the break that removes the guard. (Overload RULES.md L581)
- A break runner that flags every `TypeError` as "not an assertion" reads each failing test's first message line before calling the flag a miss: the break can cause the TypeError. (Overload RULES.md L619)
- Break proofs run against the specific test file, never the full suite. (Overload RULES.md L646)

### Fixtures and captures
- A fixture whose verdict turns on a week boundary derives that boundary from its dates, prints it, and pins the Sunday/Monday edge. (Overload RULES.md L216)
- To judge a re-captured fixture, capture it on the base tree too: what the base's own fresh capture changes was already stale, and only what the branch adds beyond it is the chunk's change. (Overload RULES.md L348)
- Seed and fixture rows are shaped the way the app writes them: take each column's convention from the code that writes it, and check a seed on the real screen, not only by counts. (Overload RULES.md L373)
- A comparison fixture must hold something to compare (at least one row), or every test passes on code that returns nothing. (Overload RULES.md L399)
- A fixture whose render changes on purpose is edited by a literal replacement and proved by its own parity test against the real render; a re-capture that differs only by a React `useId` keeps the committed file when the picture is identical byte for byte. (Overload RULES.md L445)
- A captured render fixture has no parity test, so a rebase can leave it stale without a sound: after a rebase re-capture it, restore from a `cp` backup and diff; a colour-only diff keeps a layout fixture valid; never take a picture from a stale fixture. (Overload RULES.md L447)
- A fixture gives a joined row values that differ from its parent's, or a mapper that reads the wrong one of the two cannot be seen. (Overload RULES.md L497)
- A change of the source a screen reads re-captures every fixture of that screen and diffs it before the merge: a fixture fed through a hook nothing reads any more draws the empty state silently. (Overload RULES.md L572)
- A re-captured fixture can also differ only by random ids (`data-row-key`): put the committed fixture back from a copy and re-shoot only where an element really changed. (Overload RULES.md L579)
- A UI chunk's stylesheet is compared with its base's rule by rule, not by name: `git archive <base>` into the scratchpad, `npm ci`, `npm run build`, then postcss over both builds, and read the delta. (Overload RULES.md L623)

### Test design
- Check the real page at phone width as well as desktop width: a desktop screenshot that looks fine can wrap raggedly on a phone. (Overload RULES.md L181, L242)
- A preservation check on default values proves nothing: set non-default values first, then prove they survive. (Overload RULES.md L185)
- A compatibility rule proven only in a pure module is not proven: test it at the layer (hook, screen) that applies it, including the call that maps stored data into the module. (Overload RULES.md L192)
- A test written to a rule's wording can assert the bug: for a rule of the shape "only X", test what must be absent, on a fixture where something is already past (today's own weekday decides what is past). (Overload RULES.md L195)
- A long-text control is lengthened the way the screen prints it (capitals, text transforms), beside a no-wrap copy that must fail. (Overload RULES.md L199)
- Prove that a write leaves a column alone with a value stored behind the client's back: the app loads the row, the API changes the column, the app writes, and the column must still hold the API's value. (Overload RULES.md L254)
- A parity check that expects a known difference names the exact set of differing columns, both ways: a column that should differ and doesn't is a vacuous pass. (Overload RULES.md L398)
- A pure function's tests also run every input array reversed and require the same output. (Overload RULES.md L406)
- A write path's output is proven through the reader that draws it: apply the output and read the result the way the screen will, with a break that leaves part of the output out. (Overload RULES.md L407)
- A test about order compares identities (keys), not displayed numbers that are recomputed whatever the order. (Overload RULES.md L409)
- After every writer that moves ordinals, check each item's place by identity (id, key, index), not only after the writer the fix was for, and not only that the numbers read 1 to n (a swapped order satisfies that). (Overload RULES.md L410)
- One value held in two places goes through one rule set, proven by a differential (twin) test after the same operation. (Overload RULES.md L414)
- A comparison proves only the cases its fixtures hold, and a runner that exits 0 either way is read by its last line, beside a control that must disagree. (Overload RULES.md L415)
- A rule that counts or orders stored rows is tested on the rows earlier steps leave behind (gaps, skipped ones), not only on fresh in-order fixtures. (Overload RULES.md L419)
- A rule of the shape "everywhere X, use token Y" is proven by a syntax-tree scan over every file, with its exceptions listed exactly, a break per shape and a comment-only control: a regex over a line is fooled by a comment that quotes the old pattern. (Overload RULES.md L432)
- A colour scan is blind to a swapped ternary, a child left on another colour beside a converted one, and the accent reached through a named constant: a screen chunk that draws text on the accent asserts the drawn colour at its screen, in each state, and its reviewer reads the computed colours. (Overload RULES.md L433)
- A screen change is checked on the real screens before the merge, by computed style, with the deployed app as the control (the starter has no deployed app: its screens are compared with the prototype once, before the release). (Overload RULES.md L439)
- A family of similar controls is tested with a table over every member, and a boundary with its first value past it. (Overload RULES.md L444)
- A rule that takes state the screen keeps is also run from the states a screen starts in without it (a reload, a reopened record, another device): a sequence test adds steps that drop that state, then goes on. (Overload RULES.md L466)
- A writer that takes an item's place and a selected container is tested on an item that isn't the last, in a container that isn't the first; a walk derived from the draft cannot see which item was picked. (Overload RULES.md L470)
- A walk that must prove which item an edit picked builds its expectation beside each step with plain array operations on a copy, compares the whole state after every step, and asserts it reached every kind of edit at every place. (Overload RULES.md L474)
- Two places that state the same number are proven by a twin on one world, each side through its real reads; better, one reads the other's function. (Overload RULES.md L482)
- A writer that runs whenever a screen draws, and depends on state only one device keeps, is tested with two devices whose state differs; a tie-break it depends on keys on what every device reads (a record's id), never a device's own id. (Overload RULES.md L489)
- A writer that takes its target from what the screen has open is tested with something open other than what the screen opens on (another week, a clock moved past midnight). (Overload RULES.md L491)
- A writer that takes the selected container is pressed on four containers (the first, two in the middle, the last) in a world where no two are alike: alike ones hide a write to the right place in the wrong container. (Overload RULES.md L503)
- A random walk's "reached every kind at every place" is a floor for each (kind, place) pair, counted only over edits that changed something: a refused or no-op edit doesn't count. (Overload RULES.md L509)
- A rule of the shape "X changes nothing else" is asserted on every record that stays, not only on the ones its words name. (Overload RULES.md L525)
- A walk's floor counts the cases of the rule under test, not only the kinds of edit, and the walk is built in phases to reach each case. (Overload RULES.md L527)
- "Always" on a small world is an enumeration with an oracle of plain loops; a control that says "X restores the original" is enumerated before it is written. (Overload RULES.md L528)
- A check that compares a copy with its source also checks that the source is not empty, or "equal" can mean "both NULL". (Overload RULES.md L533)
- Prove each clause of a check load-bearing by switching it off together with the mistake it stops. (Overload RULES.md L534)
- A guard that skips an unchanged write is tested with a value that differs in exactly one compared column, for each column it compares. (Overload RULES.md L548)
- A round-trip guard is tested where the conversion loses something; a typed box is tested for every way it commits (Enter as well as blur). (Overload RULES.md L549)
- An absence test needs a fixture where the thing would appear without the guard. (Overload RULES.md L551)
- A guard keyed on one stored value is tested with fixtures where the values it must not read go both ways (longer and shorter, present and empty). (Overload RULES.md L564)
- A state-transition writer is tested from every starting state to every target, replaying the writes against the table's checks at every prefix (stale-column starts included); picking the current state writes nothing. (Overload RULES.md L586)
- A rule of the shape "this writer reaches only these tables" runs every path of the writer (every mode it can write in) through one table-recording fake. (Overload RULES.md L596)
- A shape or validation check has a refusal case for each of its guards (`typeof`, and `=== null` against `== null`, each named by a test). (Overload RULES.md L601)
- A playback test derives the state from what the writer was asked, never from a hand-fed fixture, or a dropped write hides. (Overload RULES.md L608)

### DATA and migrations
- A DDL read is no baseline: "the migration is purely additive" is exactly the claim that needs a live before/after count. (Overload RULES.md L178)
- When the replay image cannot be pulled (the mirror first, Docker Hub second), a stand-in Postgres (an apt install) replays migrations for SQL-level checks only: the Postgres version and pg-safeupdate stay unproven until the PR's `migration-replay` run, which is then the proof, and the report says so. (Overload RULES.md L288)
- A migration that changes or removes existing data gets a before/after row count on every table the file mentions (target, FK, join), scoped to one user where one exists: before it is merged (merging deploys it) Adam runs and records the counts, and re-counts after, since agents hold no production credentials. An add-only migration is proven by the replay plus the reviewer's scratch-copy count and fingerprint check instead. (Overload RULES.md L289)
- A before/after fingerprint that leaves the new column out cannot see a default on it: pair it with a count of the column's NULLs, and give the fingerprint a control that changes one existing row. (Overload RULES.md L290)
- A before/after count of a column a data migration writes can net to zero: pair it with an md5 over the written columns, per scope and for the rest of the table, with controls that move only a position and only a row outside the scope. (Overload RULES.md L291)
- A text test of "reads only the user's rows" checks the filter per select block (a parenthesised group of its own), not per file: a file-wide count passes when one filter moves into the wrong block. (Overload RULES.md L293)
- Throwaway live data is labelled (`TEST-…`, "throwaway"), scoped to one account, deleted in FK-safe order, and its cleanup is proven by `count(*)` against the baseline, never by the UI looking empty. (Overload RULES.md L299)
- A test's stand-in database mirrors the tables' cascades and set-nulls too, not only their refusals. (Overload RULES.md L303)
- A stand-in for a table proves only the checks it models: replay the same walk as SQL on the real tables (a scratch replay), with a control they must refuse. (Overload RULES.md L418)
- A fallback for rows written before a column existed is run through every writer that rewrites such a row, not only through the reads. (Overload RULES.md L490)
- A data migration is judged against an independent restatement of its rule, on generated worlds with a floor per case, run twice (the second run changes nothing), with a hash of every column it must not write, and by what the user sees; the SQL's own counts are checked against the rule, never used as the oracle. (Overload RULES.md L529)
- For a migration that only replaces a function, "nothing else changed" is a schema diff of replay snapshots before and after the file, not a grep (the starter's replay has no snapshot script: an app that needs this adds one). (Overload RULES.md L540)
- A change made of several writes is proven cut short, on a stateful stand-in that models the tables' checks, foreign keys and cascade and can refuse a write. (Overload RULES.md L554)

### The prototype kit
- A chunk that removes or renames an export under `src/` searches `prototype/src` for it, then runs the kit's check (`npm run proto:check`) and its build: the kit renders the real screens, and no script and no `vitest --changed` run looks at it. (Overload RULES.md L344)

## Usage
- Commands finish in under 5 minutes, so the cache doesn't expire mid-wait; split long runs. (Overload RULES.md L647)
- Affected test files only while building, until one full suite before release; every script in `scripts/` still runs at every chunk boundary. Break proofs run against the specific test file, never the full suite. (Overload RULES.md L638, L646)
- `vitest run --changed origin/<Base branch>` is the census of the affected files: it follows the import graph, where grepping a hook's callers misses some. (Overload RULES.md L347)
- Narrow reads: grep, line ranges, touched files only. (Overload RULES.md L645)
- Batch tool calls: independent reads, edits and checks go into as few turns as possible; the turn count is the biggest cost driver. DATA reviews stay at full strength. (Overload RULES.md L645, L655)
- Quiet test output: run vitest with a quiet reporter that prints failures only (`--reporter=dot`), filter long script output down to its failures and summary lines, and never paste a full passing log. (Overload RULES.md L637)
- Screenshots: compare from the text dumps first; open a PNG only where the text dump can't settle it. (Overload RULES.md L640)
- Don't launch a background duplicate of a check that already ran inline; if one is in flight, stop it or account for it in the next message. (Overload RULES.md L366)
- Every chunk report ends with its running time (and its context figure). **Agents never estimate their cost:** their guesses ran about half the real figure (LEARNINGS L26). The coordinator reads the meter (`get_session`, `usage.cost_usd`, which counts every agent it starts) before and after each chunk and records the dollars, the hours and the running totals; the weekly % is meter dollars ÷ the dollars per 1% (`scripts/cost-table.md`), with Adam's usage page at a build's start and end (L18). (Overload's 1.2 rule asked chunk reports for a cost-weighted total next to the context figure; the meter above supersedes it: Overload RULES.md L649.)

Also: a chunk over 2M context stops and reports (a stop rule); reviewers read this file's index and ALWAYS sections plus the sections their brief names, and from CONTEXT.md only the sections the chunk touches plus "Where the build is" (RULES.md keeps a short index and each brief names the sections its chunk needs: Overload RULES.md L639, L648); never resume a long-running agent, start a fresh one from a short summary (a resumed agent carries its whole earlier run: Overload RULES.md L641); a usage-limit stop of the coordinator is resumed by its own scheduled task (The build loop, "Running without Adam"), never by Adam.

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

Reading readings and answers, folded from Overload's later rules:
- A builder's provisional reading that changes what a number counts, or what is written, is behaviour, not display: hold it against SPEC's and TASKS' exact words; where they can be read two ways it is a spec gap (a decision card, and the chunk is not merged), never a display-only choice. Look where TASKS drops a word SPEC has. (Overload RULES.md L401)
- An answer covers the cases its question held: a case the question didn't hold is read against SPEC as a new one, not inferred. (Overload RULES.md L417)
- An answer reaches as far as its words and the option it took, not only as far as the files a note names: read the question that was answered, options included, before narrowing it; a narrowing is a scope decision, read as a regression. (Overload RULES.md L423)
- A number a rule gives a prototype frame's own case is held against the frame and against the full text of every answer about that case, options included, before a test pins a different one. (Overload RULES.md L485)
- A TASKS line that names a function for one of Adam's answers is held against the option he took, not only against his words. (Overload RULES.md L595)

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
- Missing proof only (behaviour right): goes on the "tests owed" list (DECISIONS.md), cleared in one tests-only run before the release; a missing proof never goes back to the builder, only a behaviour failure does (Overload RULES.md L658).
- Display-only choices a builder made are accepted as built and listed for Adam's vibe check.

**When Adam changes his mind mid-build:** it goes into the next-version notes as `later`, unless re-chunking now is cheaper than building the wrong thing; re-chunking means back to TASKS.

**Before the release** (BUILD.md step 5): agents check everything a screenshot or query can decide against SPEC.md and the prototype, including that the built screens match the prototype; tests owed are cleared in one tests-only run, then one full suite; Adam's vibe check on staging (like, dislike, confused; dislikes go to the next version unless one stops the app being used, which gets one fix pass); every non-blocking question comes to him as one batch.

**Merges and branches** (folded from Overload's later rules):
- One check-run id can hang `in_progress` while a later run on the same commit succeeded: read all runs of a check by name on the commit, and confirm a deploy by its effect. (Overload RULES.md L186)
- A PR's checks count only when the PR's own `pull_request` run passes on the merged tree: a `workflow_dispatch` run on a stacked or retargeted branch doesn't count, and it tested a tree the base will never get. (Overload RULES.md L189)
- The check-runs API lists only the latest run per name: read every run with `gh api repos/<owner>/<repo>/commits/<sha>/check-runs?filter=all`, and each run's `.output.summary` as well as its conclusion. (Overload RULES.md L313)
- Commit and push only when asked (a builder's brief and definition ask for it; an interactive session waits to be asked). Isolate a standalone commit from unrelated uncommitted work with `git stash push --keep-index` plus an isolated typecheck (worktrees share one stash: give the entry a unique message and never run a bare `git stash pop`), split unrelated work into separate commits, and byte-diff restored files rather than trusting a typecheck. (Overload RULES.md L367)
- Worktrees share one `.git`, so another agent's `git fetch` moves `origin/<Base branch>` under a builder or a reviewer: diff a branch against `git merge-base origin/<Base branch> HEAD`, never against `origin/<Base branch>` itself. (Overload RULES.md L518)
- An input a merged module reads from a write a later chunk makes is named in that chunk's TASKS section when the module merges; TASKS.md is amended in the merge's record updates. (Overload RULES.md L520)
- A PR whose base moved is brought up to date by merging the base into its branch and pushing that, never by a force-push. Before merging the PR, check the merged tree against what was reviewed (the diff from the merge-base equal to the builder's patch, by md5; the trees identical where an earlier reviewer rebased locally), re-run every script on it, and wait for the PR's own `migration-replay` run on the merge commit: a squash merge carries only the patch. (Overload RULES.md L543)
- Two chunks that edit neighbouring lines of one list conflict at merge: keep both chunks' changes, and check the file against both chunks' diffs. (Overload RULES.md L593)
- A branch made with `git checkout -b <branch> origin/<Base branch>` tracks the base, so a bare `git push` would push there: create it with `git branch --no-track <branch> origin/<Base branch>`, or push with `git push -u origin <branch>`. (Overload RULES.md L625)

**Environment** (folded from Overload's later rules):
- Docker Hub can answer 429 for the replay image: pull `supabase/postgres:<tag>` through `mirror.gcr.io` and `docker tag` it to the expected name; Docker Hub is the second try, and the PR's `migration-replay` run is the second proof, the only one when both pulls fail. (Overload RULES.md L359)
- A fresh container has no `node_modules`: run `npm ci` before typecheck, test or build. (Overload RULES.md L371)
- `pkill -f <pattern>` kills the calling shell when the pattern is in its own command line (exit 144): find the pid with `ps aux | grep "[p]attern"` and `kill` it. `pgrep -f` matches that shell too, so a wait loop on it never ends: wait on a marker file. (Overload RULES.md L372)
- npm here rewrites the lockfile (it drops the `libc` field of every platform-specific optional package): never commit that lockfile; splice the new entries in by hand, check that the diff is insertions only and that the integrity equals the registry's (`npm view <pkg>@<version> dist.integrity`), and run `npm ci` in a fresh checkout. (Overload RULES.md L377)
- A full disk (`ENOSPC`) during `npm run build` exits 1 and leaves a 0-byte entry JS while the stylesheet's name still reads right: remove `dist` and build again before comparing a bundle; check free space (`df -h /`) before copying a worktree with `node_modules`. (Overload RULES.md L519)
- A `dockerd` started as a background task stops at that task's time limit, and its containers stop with it but keep their data: start it with the longest limit, and after a stop start it again and `docker start` the kept replay containers. (Overload RULES.md L542)
- A worktree-isolated agent's shell refuses a command whose text holds the word `source` (a path, a heredoc, a string) and some compound commands with `$`-variables as program arguments: read such paths with the Grep and Read tools, and keep scripts as files in the scratchpad, run by a plain `node <file>`. (Overload RULES.md L575)

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

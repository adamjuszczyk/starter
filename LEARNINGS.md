# LEARNINGS.md

Lessons about the process, not the app (BUILD.md 2.1, step 6). Each lesson is written the session it happens and gets a verdict at the retro: **changed** (BUILD.md edited, citing the lesson), **rejected** (one-line reason), or **watch** (seen once; stays open until it happens again).

## Lessons from the starter spec chat (2026-11-04/06)
*Put in by the coordinator after chunk 0's merge, as given.*

## S1 BUILD.md's steps 5 and 6 don't fit the starter   status: changed
Stage: spec
What happened: BUILD.md calls the starter "built and tested once, outside any build", but it is being run through
steps 1–6. It has no users, so no staging; no production, so no release checklist; and the vibe check is defined "on
staging". The spec decided: chunks merge to the default branch, the release is a tag, agents compare the built screens
with the prototype, and Adam's vibe check moves to the installer demo.
Possible change: BUILD.md "The starter" says how the starter itself is built and released, and how an app built from
it learns which starter version it has (so existing apps can take the parts they lack).
Verdict: changed (BUILD.md 2.3, "The starter": how it is built and released; every app records `Starter: vX.Y.Z` in CONTEXT.md's Repo facts) (retro 2026-11-07)

## S2 BUILD.md's "The starter" section no longer matches the layer model   status: changed
Stage: spec
What happened: the section lists staging scripts, maintenance mode, required updates, What's new, the install guide,
the unsent-changes indicator and a Dexie offline queue as starter parts. On 2026-11-05 (business chat) the starter
became slim: those moved to a client-ready build or an optional offline add-on. The project instructions still list
Dexie and Recharts in the shared stack.
Possible change: BUILD.md "The starter" follows `claude/client-app-technical-topics.md` (parts 1–7 now, 8–13 in the
client-ready build, 14 as an add-on); the project instructions' stack line drops Dexie and Recharts from the base.
Verdict: changed (BUILD.md 2.3, "The starter": parts 1–7, the client-ready build, the offline add-on; "Outside every repo": the master cost table is this repo's `scripts/cost-table.md`). The project instructions' stack line is Adam's edit. (retro 2026-11-07)

## S3 Technical questions reached Adam, who can't judge them   status: changed
Stage: spec
What happened: the chat asked Adam to choose offline per app or per write, and which table access kinds verify-rls
should know. On 2026-11-06 Adam set a rule: technical and architecture questions are decided by the chat or agent, by
the guiding rule and the lift rule, and written down with a one-line reason; only a decision that changes what a user
sees or does, cost, risk to client data, how hard it is to change later, or his own manual work reaches him, in plain
words, with what each option means for him and his clients, a recommendation, and what he'd regret. BUILD.md disagrees
in two places: TASKS step 5 ("Do not choose for me") and spec move 4 ("No right answer → a default with an override"
assumes Adam picks).
Possible change: write Adam's filter into BUILD.md: the spec moves, TASKS's "Questions for Adam" (technical ones become
"Decided, with reasons"), and the decision cards.
Verdict: changed (BUILD.md 2.3, "Who decides"; spec move 4; TASKS order of work 8 and prompt item 5; RULES.md Escalation; the decision card; the coordinator prompt) (retro 2026-11-07)

## S4 The chat designed parts that already existed in Overload   status: changed
Stage: spec
What happened: before reading the Overload repo, the chat proposed new designs for things Overload already had: local
Supabase in GitHub Actions (Overload's migration-replay already does it), a new rule that screens never call the
database (already Overload's practice), and verify-rls from scratch. Adam then set the rule: anything that exists in
Overload is lifted, with what's generalized and dropped stated per item.
Possible change: BUILD.md step 1 says that when a build reuses an existing app's parts, the spec chat reads that repo
first and maps each item to its source before proposing anything; "For an update, adjust before replacing" covers
lifting too.
Verdict: changed (BUILD.md 2.3, "The lift rule"; step 1 "The discussion", the spec chat prompt, "SPEC.md contains"; TASKS prompt item 1) (retro 2026-11-07)

## S5 A prototype example screen read as part of the product   status: changed
Stage: spec
What happened: the first starter prototype showed a "Klienci" list and form to show the components in use. Adam read
it as every app starting with a clients panel. Nothing on the page said it was an example.
Possible change: BUILD.md's prototype section: any screen that is an example, not part of the build, is labelled so in
DEMO, and a prototype for a template shows a "what you get" state.
Verdict: changed (BUILD.md 2.3, step 1 "The prototype": example screens labelled, a template's prototype opens on "what you get") (retro 2026-11-07)

## S6 A scope change arrived from another chat mid-spec   status: watch
Stage: spec
What happened: two items (P1, P2) had been discussed when the business chat cut the starter to parts 1–7 and answered
P1. Part of that discussion was spent on parts no longer in scope.
Possible change: none yet. If it recurs: a spec chat starts only after the business chat has settled what the build
is for.
Verdict: watch (seen once) (retro 2026-11-07)

## Lessons from the build (Starter 0.1, 2026-11-06)

## B1 The meter the brief names does not exist   status: changed
Stage: setup
What happened: the brief says to read the meter with `get_session`, `usage.cost_usd`; the session's record has no such field (only the 5-hour window's status and context use). The coordinator derives dollars from every transcript at list prices (DECISIONS 50).
Later: `usage.cost_usd` appeared in `get_session` about four hours in (first seen 01:25, $111.13); the derived meter read $152.2 at the same moment, ≈ 37% high, so every per-chunk dollar line before then overstated spend (DECISIONS 73). The 30% stop after chunk 0 was measured on the derived meter; on the real one chunk 0 ran further under.
Possible change: BUILD.md's setup step names a meter that exists in the environment, or tells the setup check to find one and record how it reads; a coordinator re-checks the named field at every merge until it appears.
Verdict: changed (BUILD.md 2.3, "Files", the meter; step 3 setup check; CONTEXT.md's Repo facts get "The meter:") (retro 2026-11-07)

## B2 Agent definitions can't be registered mid-session   status: changed
Stage: setup
What happened: Overload's definitions copied into `~/.claude/agents/` were not picked up ("Agent type 'builder' not found"); every agent is a general-purpose agent told to read its definition file first (DECISIONS 51).
Later the same session (≈ 23:08, 1.75 h in) the session announced the copied definitions as agent types; from chunk 5 on agents are started as `builder`, `reviewer-data`, `reviewer-light`.
Possible change: until a build's own `.claude/agents/` is on the default branch when the coordinator starts, BUILD.md says agents run this way, or the definitions are committed before the coordinator's session begins.
Verdict: changed (BUILD.md 2.3, step 3 setup check: definitions on the default branch before the coordinator starts, else general agents that read their definition first) (retro 2026-11-07)

## B3 The Docker Hub token was saved with the wrong scheme   status: rejected
Stage: setup
What happened: the network secret for `auth.docker.io` is sent as a Bearer header; Docker Hub's token endpoint takes Basic (user:token) and answers 500. The mirror held both images, so nothing blocked. Adam has a to-do (re-save as "basic").
Possible change: the setup step that saves a registry token says "basic" and pulls once through it before the build.
Verdict: rejected: a tool detail, not the process; the new-app checklist (hand-off item 6) already says type `basic` (retro 2026-11-07)

## B4 Tag pushes are still refused by the git proxy   status: changed
Stage: setup
What happened: the throwaway tag `setup-tag-test` was cut off twice ("unexpected disconnect"), as in Overload (L31); the release ends with Adam's two commands.
Possible change: none yet; if it recurs, BUILD.md's release step assumes Adam pushes the tag.
Verdict: changed (BUILD.md 2.3, step 5 "Release": Adam pushes the tag and publishes the Release, checklist step 7; "The starter"). Second time after Overload L31. (retro 2026-11-07)

## B5 Two planned decisions contradicted each other and only a real run showed it   status: changed
Stage: build (chunk 2)
What happened: Decided 39 (revoke everything from `anon` on own and signed-in tables) and the lifted embeds probe (which runs as `anon`) would have failed every valid embed. The builder found it by running the probe on a scratch table; settled as DECISIONS 54.
Possible change: when a plan's decision changes grants or roles, the plan greps every lifted script that runs as that role.
Verdict: changed (BUILD.md 2.3, step 2 order of work 4 "Run what the plan claims", and prompt item 4; with B12, B14, B17) (retro 2026-11-07)

## B6 "Drop these named items" dropped general halves with them   status: changed
Stage: build (chunk 0)
What happened: Overload's Escalation 4 was half Coach, half general ("corrupted data broader than known: report"); the general half and the "AI features" rule went with the named drops. The builder listed both as unsure; the batch reviewer judged them general; the chunk went back once for two lines.
Possible change: a lift scope that drops items says per item whether a general part survives, or the builder's "unsure" list is mandatory reviewer input (it worked here).
Verdict: changed (BUILD.md 2.3, "The lift rule"; chunks' Scope; Roles; RULES.md Reviewer rules: the unsure list is judged item by item) (retro 2026-11-07)

## B7 The reviewer's "rebase between merges" can't run inside one agent run   status: changed
Stage: build (B0)
What happened: reviewer-light's definition has the reviewer rebase between the coordinator's merges, but an agent's run ends at its report, before the merges; the coordinator rebased chunk 2 itself.
Possible change: the definition gives the rebase to the coordinator, or the coordinator resumes the reviewer after its merges.
Verdict: changed (BUILD.md 2.3, step 4 Roles, "The loop", the coordinator prompt: the coordinator rebases; a fresh reviewer re-takes captures after the last merge, as reviewer-light.md already says) (retro 2026-11-07)

## B8 A check passed on the break it was written for   status: rejected
Stage: build (chunk 1)
What happened: `check-build.mjs`'s first `skipWaiting` check was a grep, and it passed with `skipWaiting` off (workbox's `SKIP_WAITING` message listener contains the text). The break proof caught it; the check now needs the unconditional call and no listener.
Possible change: none to BUILD.md (the break proof did its job); kept as a "Checks that lied" candidate for the stack skill.
Verdict: rejected: the break proof did its job; already in the stack skill's "Checks that lied" (retro 2026-11-07)

## B9 The 30% rule stopped the build on an underrun   status: changed
Stage: build (chunk 0)
What happened: chunk 0 (LIGHT · S) carried the LIGHT figure ($12, 0.67 h) because sizes were not measured apart; it ran ≈ $7.6 and ≈ 0.35 h, 37% under on cost, and the rule stopped the build for a re-estimate card though the build as a whole was on its estimate (chunks 1 and 2 were within). Adam answered "continue as planned" six minutes later.
Possible change (Adam, 2026-11-06): stop only when a chunk runs **over** by more than 30%; an underrun is re-estimated and reported in the chunk's line, without stopping. Also: the estimate carries per-size figures once a build has measured them (B0: S ≈ $8, M ≈ $10, L ≈ $13.5).
Verdict: changed (BUILD.md 2.3, step 4 "Stop rules" and the coordinator prompt: only an overrun of more than 30% stops; the estimate uses per-size figures where measured) (retro 2026-11-07)

## B10 A background agent waited 17 minutes on a permission prompt nobody saw   status: changed
Stage: build (chunk 3)
What happened: chunk 3's builder issued `rm node_modules` at 22:51; the call never returned (a permission prompt in a background agent). The coordinator noticed the stale transcript at 23:08, stopped the agent and resumed it with the instruction to skip the step; its committed work was intact.
Possible change: every brief says "don't wait on a permission prompt: work around it inside your worktree or report it" (added from chunk 5 on), and the coordinator checks each running agent's last transcript time at every wake-up.
Verdict: changed (BUILD.md 2.3, RULES.md "Usage": never wait on a permission prompt; step 4 "The loop" and the coordinator prompt: an agent silent for 10 minutes is stopped and resumed) (retro 2026-11-07)

## B11 A DATA review's cards became additions before the merge   status: watch
Stage: build (chunk 3)
What happened: the reviewer found chunk 3 merge-ready and raised three additions (the app's replay seed, the list test in CI, the anon-privilege check); RULES.md forbids changing shared scripts later in a build, so the coordinator had them built on the branch before the merge (7 minutes) and re-reviewed.
Possible change: none yet; if it recurs, TASKS's DATA chunks name the check's use by the first app (its seed) in scope.
Verdict: watch (seen once) (retro 2026-11-07)

## B12 A decision that adds a statement to every migration was never run through the migration check   status: changed
Stage: build (chunk 7)
What happened: TASKS Decided 39 puts a `revoke … from anon` in every own and signed-in table's migration; the lifted `check-migration` safe list had no `revoke` case, so every such migration would have been flagged and sent to Adam. Chunk 3's fixture migration had the revoke and nobody ran it through `check-migration`; chunk 7's builder found it while writing the stack skill. Fixed before merge (DECISIONS 69). B5 again: two planned pieces contradicted each other and only a real run showed it.
Possible change: a plan decision that adds a statement to every migration (or every table, or every screen) is run through every lifted check on the example at plan time; a DATA chunk's fixture migration gets a "passes check-migration" test.
Verdict: changed (BUILD.md 2.3, step 2 "Run what the plan claims", with B5) (retro 2026-11-07)

## B13 `CREATE TABLE IF NOT EXISTS` counts as created by the migration check   status: rejected
Stage: build (B2 review)
What happened: `check-migration` adds a table named in `create table if not exists` to the batch's created set even when the table already exists, so grants, policies, indexes and now revokes on it pass as "a table this batch creates". Pre-existing in Overload's lifted rules, not introduced by this build.
Possible change: none yet; the next build that touches `migration-rules.mjs` treats `if not exists` as not created.
Verdict: rejected for BUILD.md: a bug in one script, not a process lesson; in NEXT.md for the next starter build (shared scripts never change during a build) (retro 2026-11-07)

## B14 "Renders the real screens" did not trace what the real screens import   status: changed
Stage: build (chunk 8)
What happened: the kit's scope listed five swaps without tracing `App.tsx`'s import chain (a PWA module that exists only under the app's own build) or how example screens enter the real route table; both were found only by building (DECISIONS 71, 72). A dev-server-only trap (a fake that re-exports the real module imports itself under the dev server) was found by opening the page, not by the check.
Possible change: a plan that says "renders the real X" lists what X's imports reach and how extra screens join X's routes; the kit's check also loads the dev server once.
Verdict: changed (BUILD.md 2.3, step 2 "Run what the plan claims"); the kit's check loading the dev server once goes to NEXT.md (retro 2026-11-07)

## B15 The brief's boilerplate contradicted a chunk's own scope   status: changed
Stage: build (chunk 9)
What happened: every brief said "don't edit RULES.md, NEXT.md…" while chunk 9's scope was to fold rules into RULES.md and fill NEXT.md (and chunk 0's to create them). The builders read the boilerplate as the record-writing ban and followed the scope; the boilerplate now says "except what the chunk's Scope names".
Possible change: the coordinator's brief template carries that exception from the start.
Verdict: changed (BUILD.md 2.3, the coordinator prompt step 1: a standing line never contradicts the chunk's scope) (retro 2026-11-07)

## B16 The build ran 40–45% under its estimate   status: changed
Stage: release
What happened: the estimate was ≈ 8.1 h of running and ≈ $170 (upper bound 9.3 h, $196). The build ran 21:21–01:55 UTC, ≈ 4.6 h of wall clock including setup, the 6-minute stop and the release, and ended at ≈ $122 on the meter. LIGHT builders took 22–46 min (planned ≈ 30) but batch reviews took 9–11 min (planned ≈ 40), and no 5-hour-window pause came. Every chunk merged on its first or second review; three got follow-ups before merge.
Possible change: the cost table's third calibration (the close) takes this build's per-chunk lines: LIGHT S/M/L and DATA separately, batch reviews at ≈ 10 min, and the meter's figures (the derived ones × 0.73).
Verdict: changed (the cost table's third calibration, now with the week: 19% → 32%, ≈ $11.3 per 1%; BUILD.md 2.3, Bootstrap points to the table; step 6 reads the week at start and end) (retro 2026-11-07)

## B17 A decision named a library call that does not do what it said   status: changed
Stage: build (chunk 11)
What happened: Adam's decision (written from the coordinator's card) named supabase-js `signOut` with `scope: 'local'` as the device sign-out; on the lockfile's version it still asks the server and keeps the session when that fails. The builder probed the real client before building, and the test Adam asked for (a real client, no network, no session left) would have caught it anyway. Fixed by removing the stored session first (DECISIONS 81).
Possible change: a card that names a library call as the mechanism says "probed on the real client" or names the behaviour only; builders probe a named library behaviour before building on it.
Verdict: changed (BUILD.md 2.3, "Run what the plan claims"; RULES.md verification: a library behaviour is probed before building on it; the decision card names behaviour, never a library call) (retro 2026-11-07)

## B18 Release notes have no stated audience   status: changed
Stage: release / close
What happened: the 0.1.0 notes (`docs/release-0.1.0-notes.md`) were written as an agent's build log, with decision numbers, debugging detail, "Decisions Adam made" and "this loosens a data-safety check", and were about to become the public GitHub Release. Adam published a short public summary instead; the notes stay as the internal record.
Possible change: BUILD.md says public notes are written for a reader in plain words, a few lines; the record in `docs/` stays for agents.
Verdict: changed (BUILD.md 2.3, step 5 "Release", Agents before 1: public notes for their reader, the record in `docs/`) (retro 2026-11-07)

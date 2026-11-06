# LEARNINGS.md

Lessons about the process, not the app (BUILD.md 2.1, step 6). Each lesson is written the session it happens and gets a verdict at the retro: **changed** (BUILD.md edited, citing the lesson), **rejected** (one-line reason), or **watch** (seen once; stays open until it happens again).

## Lessons from the starter spec chat (2026-11-04/06)
*Put in by the coordinator after chunk 0's merge, as given.*

## S1 BUILD.md's steps 5 and 6 don't fit the starter   status: open
Stage: spec
What happened: BUILD.md calls the starter "built and tested once, outside any build", but it is being run through
steps 1–6. It has no users, so no staging; no production, so no release checklist; and the vibe check is defined "on
staging". The spec decided: chunks merge to the default branch, the release is a tag, agents compare the built screens
with the prototype, and Adam's vibe check moves to the installer demo.
Possible change: BUILD.md "The starter" says how the starter itself is built and released, and how an app built from
it learns which starter version it has (so existing apps can take the parts they lack).
Verdict:

## S2 BUILD.md's "The starter" section no longer matches the layer model   status: open
Stage: spec
What happened: the section lists staging scripts, maintenance mode, required updates, What's new, the install guide,
the unsent-changes indicator and a Dexie offline queue as starter parts. On 2026-11-05 (business chat) the starter
became slim: those moved to a client-ready build or an optional offline add-on. The project instructions still list
Dexie and Recharts in the shared stack.
Possible change: BUILD.md "The starter" follows `claude/client-app-technical-topics.md` (parts 1–7 now, 8–13 in the
client-ready build, 14 as an add-on); the project instructions' stack line drops Dexie and Recharts from the base.
Verdict:

## S3 Technical questions reached Adam, who can't judge them   status: open
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
Verdict:

## S4 The chat designed parts that already existed in Overload   status: open
Stage: spec
What happened: before reading the Overload repo, the chat proposed new designs for things Overload already had: local
Supabase in GitHub Actions (Overload's migration-replay already does it), a new rule that screens never call the
database (already Overload's practice), and verify-rls from scratch. Adam then set the rule: anything that exists in
Overload is lifted, with what's generalized and dropped stated per item.
Possible change: BUILD.md step 1 says that when a build reuses an existing app's parts, the spec chat reads that repo
first and maps each item to its source before proposing anything; "For an update, adjust before replacing" covers
lifting too.
Verdict:

## S5 A prototype example screen read as part of the product   status: open
Stage: spec
What happened: the first starter prototype showed a "Klienci" list and form to show the components in use. Adam read
it as every app starting with a clients panel. Nothing on the page said it was an example.
Possible change: BUILD.md's prototype section: any screen that is an example, not part of the build, is labelled so in
DEMO, and a prototype for a template shows a "what you get" state.
Verdict:

## S6 A scope change arrived from another chat mid-spec   status: watch
Stage: spec
What happened: two items (P1, P2) had been discussed when the business chat cut the starter to parts 1–7 and answered
P1. Part of that discussion was spent on parts no longer in scope.
Possible change: none yet. If it recurs: a spec chat starts only after the business chat has settled what the build
is for.
Verdict:

## Lessons from the build (Starter 0.1, 2026-11-06)

## B1 The meter the brief names does not exist   status: open
Stage: setup
What happened: the brief says to read the meter with `get_session`, `usage.cost_usd`; the session's record has no such field (only the 5-hour window's status and context use). The coordinator derives dollars from every transcript at list prices (DECISIONS 50).
Possible change: BUILD.md's setup step names a meter that exists in the environment, or tells the setup check to find one and record how it reads.
Verdict:

## B2 Agent definitions can't be registered mid-session   status: open
Stage: setup
What happened: Overload's definitions copied into `~/.claude/agents/` were not picked up ("Agent type 'builder' not found"); every agent is a general-purpose agent told to read its definition file first (DECISIONS 51).
Possible change: until a build's own `.claude/agents/` is on the default branch when the coordinator starts, BUILD.md says agents run this way, or the definitions are committed before the coordinator's session begins.
Verdict:

## B3 The Docker Hub token was saved with the wrong scheme   status: open
Stage: setup
What happened: the network secret for `auth.docker.io` is sent as a Bearer header; Docker Hub's token endpoint takes Basic (user:token) and answers 500. The mirror held both images, so nothing blocked. Adam has a to-do (re-save as "basic").
Possible change: the setup step that saves a registry token says "basic" and pulls once through it before the build.
Verdict:

## B4 Tag pushes are still refused by the git proxy   status: watch
Stage: setup
What happened: the throwaway tag `setup-tag-test` was cut off twice ("unexpected disconnect"), as in Overload (L31); the release ends with Adam's two commands.
Possible change: none yet; if it recurs, BUILD.md's release step assumes Adam pushes the tag.
Verdict:

## B5 Two planned decisions contradicted each other and only a real run showed it   status: open
Stage: build (chunk 2)
What happened: Decided 39 (revoke everything from `anon` on own and signed-in tables) and the lifted embeds probe (which runs as `anon`) would have failed every valid embed. The builder found it by running the probe on a scratch table; settled as DECISIONS 54.
Possible change: when a plan's decision changes grants or roles, the plan greps every lifted script that runs as that role.
Verdict:

## B6 "Drop these named items" dropped general halves with them   status: open
Stage: build (chunk 0)
What happened: Overload's Escalation 4 was half Coach, half general ("corrupted data broader than known: report"); the general half and the "AI features" rule went with the named drops. The builder listed both as unsure; the batch reviewer judged them general; the chunk went back once for two lines.
Possible change: a lift scope that drops items says per item whether a general part survives, or the builder's "unsure" list is mandatory reviewer input (it worked here).
Verdict:

## B7 The reviewer's "rebase between merges" can't run inside one agent run   status: open
Stage: build (B0)
What happened: reviewer-light's definition has the reviewer rebase between the coordinator's merges, but an agent's run ends at its report, before the merges; the coordinator rebased chunk 2 itself.
Possible change: the definition gives the rebase to the coordinator, or the coordinator resumes the reviewer after its merges.
Verdict:

## B8 A check passed on the break it was written for   status: open
Stage: build (chunk 1)
What happened: `check-build.mjs`'s first `skipWaiting` check was a grep, and it passed with `skipWaiting` off (workbox's `SKIP_WAITING` message listener contains the text). The break proof caught it; the check now needs the unconditional call and no listener.
Possible change: none to BUILD.md (the break proof did its job); kept as a "Checks that lied" candidate for the stack skill.
Verdict:

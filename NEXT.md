# NEXT.md — the starter's next-version notes
*Opened with chunk 0, 2026-11-06 (BUILD.md 2.2, step 6). The next brief starts from this file. Later items are notes, never a spec.*

## Planned, not built

### Left over from 0.1 (2026-11-07)
- `check-migration` counts `create table if not exists` as created even when the table exists, so grants, policies, indexes and revokes on it pass (LEARNINGS B13; Overload's, not this build's).
- L239's exception (DECISIONS 74) could add "and verify-rls on the replay passes": a replaced function or view can change access without changing a row. Adam to confirm.
- The tokens check misses CSS shorthands with a named colour or typed size; the no-database check misses the client under an alias (`const db = supabase`). Both written in the checks' headers.
- Desktop Table rows that open from the keyboard show only the browser's default focus outline (no focus style of their own).
- Decided 49 names `own` tables only for the `user_id` column; `signed-in` tables need it too (verify-rls's peer probe counts by it). The stack skill says both.
- The checklist's Windows cmd lines have never run on Windows, and its shared store has never held a real write: Adam's first new app is the test.
- CI (`migration-replay.yml`) runs `npm run check` (the script tests) but not vitest, so every `src/` test, chunk 11's real-client sign-out proof included, runs only under `npm test`: a supabase-js upgrade in an app could break the device sign-out unnoticed until then.
- The cost table's third calibration from this build's figures (LEARNINGS B16), at the close.

## Offline writing add-on: rules kept aside
*Overload's rules for writing offline (its Dexie queue). TASKS.md's appendix sorted them out of Overload's RULES.md as the add-on's (34 lines, class OFFLINE-ADDON), and chunk 9 keeps them here, with Overload's "SPEC rules made standing" line on queued writes, for the day an app takes the add-on. The starter saves online only (SPEC Rule 3: "nothing is queued"), so none of this is built or checked in 0.1. Each line ends with its line of Overload's RULES.md (`adamjuszczyk/overload-v2`, commit `8e00877`). The names (sets, logs, `sync_queue`, `readActiveSession`, `hydrated`, `queueServer.testutil.ts`) are Overload's: the add-on's brief generalizes them.*

**The queue: what a queued write is and how it is sent**
- A queued write is "never sent" only when no send started and none failed (`sendStarted` in IndexedDB); a cancel happens only inside the single-flight pass. (Overload RULES.md L250)
- A queued delete's payload is `{ id }`, sent as `delete().eq('id', id)`, with its session and head beside it; every item goes out through `.from(item.table)`. (Overload RULES.md L251)
- A one-column change goes out as a `patch` queue item (`{ id, set_number }`), flushed after every earlier write to that log. (Overload RULES.md L256)
- A queued row that names a log by a cascading foreign key is refused for good (`23503`) once the queue cancels or deletes that log first: probe every new producer with the record deleted offline, online, and after one failure. (Overload RULES.md L258)
- A queue item that names another record by a cascading foreign key hangs under it in the never-sent cancel, the order and the online delete. (Overload RULES.md L259)
- A queued write refused because its record is gone is decided by the foreign key's action: CASCADE drops it, SET NULL sends it with null, NO ACTION makes the delete consult the queue. (Overload RULES.md L260)
- An online delete drops the deleted record's own queued writes once its request went through, and tells a running pass (`removedByCleanup`). (Overload RULES.md L264)
- A preflight that counts what the queue will still send leaves out only a pair the next pass cancels. (Overload RULES.md L268)
- A write still queued after a pass reads as missing once the screen reads the server again: probe an offline write with its first send failing while reads go through. (Overload RULES.md L272)
- **Queued writes across a version change** (Overload's SPEC 1.2.1 Rules 5, standing since 2026-10-30, chunk 73): queued writes are sent by the version that is running. A release that changes the shape of anything the queue writes also converts the queued writes of the old shape. The old version never sends once the version check has refused it, and never before that check has answered. This needs the client-ready build's version check (required updates) as well as the queue. (Overload RULES.md L147, under "SPEC rules made standing", L146)

**Writing and reading offline**
- Anything in front of an offline-capable write is best-effort: `networkMode: 'always'` and a fallback, so the write still happens offline. (Overload RULES.md L376)
- A writer the screen awaits offline is a queue producer plus a change of the screen's copy, never a mutation on the default `networkMode`. (Overload RULES.md L600)
- The session read is the server's rows plus this device's unsent upserts (`readActiveSession`), merging upserts only; a queue that can't be read leaves the server's answer. (Overload RULES.md L277)
- A read that merges some kinds of queued write is probed with the kinds it leaves out, through a writer that reads its result. (Overload RULES.md L630)
- The pending-sync and the failed-sync markers read different stores, so each has a test with the other state present. (Overload RULES.md L574)

**The device database (Dexie)**
- Sign-out clears every table of the device database (`db.tables`); the test names the tables, so a new one is named on purpose. (Overload RULES.md L271)
- Device-kept state for a record (drafts) is keyed by the record's own id, never by the ordinal its row shows. (Overload RULES.md L283)
- A hook that reads IndexedDB draws first and merges what the device held when it answers; writes that depend on it wait for `hydrated`. (Overload RULES.md L284)
- The device's copy of a table holds only what this phone wrote or primed: a producer's device update may rightly change nothing. (Overload RULES.md L605)
- A Dexie version bump is proven on real IndexedDB with both trees' `db.ts`, every table filled as the app fills it, an old tab open, and the old build opening the new file. (Overload RULES.md L613)

**Proving the queue**
- A probe of a queue defect models every foreign key the queued writes carry and every online delete of a record they name. (Overload RULES.md L201)
- A live check that fails a write "once" holds the failure until the read under test; a reconnect can run two queue passes back to back. (Overload RULES.md L337)
- Queue fixtures are dated at queue time, or they sort before real-now writes in `orderBy('createdAt')`. (Overload RULES.md L339)
- A live queue check can put items in the producers' shape straight into IndexedDB while offline and answer POSTs with 503 to keep them queued. (Overload RULES.md L345)
- A queue's ordering rule is proven with the earlier write failing in the pass that would send the later one: with nothing failing, `createdAt` order hides it. (Overload RULES.md L412)
- A fake IndexedDB that applies a write before its first `await` can't tell an awaited write from one that isn't: land writes on a later tick. (Overload RULES.md L413)
- The sync queue's tests run on a fake that models the server (foreign keys, cascade, call shape, lost replies, later-tick writes); a held request is released in `finally` and `afterEach`. (Overload RULES.md L420)
- A writer that an effect runs on every draw is tested through a request that keeps failing while online: flush, invalidate, refetch and re-queue can loop; key it on what is still queued. (Overload RULES.md L569)
- A hold that applies to one shape of a queue item has the item's other shape as its control. (Overload RULES.md L601)
- A queue rule is also proven in real Chromium on the real IndexedDB queue against a real server, with one request failed once (`route.fulfill` 503), reading `sync_queue` between steps. (Overload RULES.md L602)
- A fix that cancels, holds or drops queue items is proven with other records' writes in the same queue, asserting that they went in the same pass. (Overload RULES.md L610)
- A test that says what a queued write is refused with also asserts whether it was tried (`attempts`). (Overload RULES.md L611)
- A queue rule's real-Chromium proof is a differential on the deployed app: the same taps before and after, every non-GET request with its status, the raw `sync_queue` at each step. (Overload RULES.md L612)
- The queue's test server (`queueServer.testutil.ts`) also answers the session read as `fetchSession` makes it. (Overload RULES.md L629)
- A change to a read the queue feeds is proven by a real-Chromium differential comparing each pass's writes and the raw queue, old build and new. (Overload RULES.md L633)

## Client-ready build
*What the build that makes an app ready for a client's real users will lift. CONTEXT.md "What this is" lists its parts: staging and release scripts, maintenance mode, required updates, What's new, the iPhone install guide, forgot password, user roles, the environment setup script, user admin, the audit log, exports, import, monitoring and backups. Nothing here is built in 0.1: each line names where the material is, with Overload's line (`adamjuszczyk/overload-v2`, commit `8e00877`, RULES.md).*

- **A crash screen** (an error boundary): in no SPEC and not built in 0.1 (TASKS.md, "The sweep of SPEC.md", S23).
- **The staging and release sections of Overload's RULES.md.** The starter's RULES.md already holds generalized copies of "Staging" and "Pages for me" and of the staging lines in "Escalation", "Reviewer rules" and "The build loop"; they apply only to an app with staging (`Staging: yes` in CONTEXT.md "Repo facts"). The client-ready build gives them their scripts and checks the copies against Overload's text:
  - "Staging (BUILD.md 2.2, step 5)", L123–126: re-seeds are the agents' job, through the staging scripts; staging stays between builds until the scripts can create, seed and delete it; a re-seed while maintenance is on is refused whole (`OL001`).
  - "Pages for me", L128–134: the vibe-check tour and the release checklist as pages.
  - The release: Escalation 8, 15 and 17 (L36, L43, L45: a `check-migration` flag at the release or on a hotfix, a failed Supabase deploy, a live check that writes on production); "Reviewer rules" L61 and L64 (a migration live on staging before the code that needs it, a flag logged under DECISIONS "For the release", nothing touching the default branch before the release); "The build loop", "Where chunks go" L105 and "Before the release" L121 (the vibe check on staging, the tests owed cleared in one tests-only run, one full suite); "Standing rules", Backups L143 (before every release and before anything destructive).
- **The appendix's STAGING-RELEASE lines** (TASKS.md, class STAGING-RELEASE, 15 lines), for that build to lift:
  - The seed and the re-seed:
    - A seed's guard pins its own account list; once a newer seed ran, only it or a later one can re-seed. (Overload RULES.md L308)
    - A seed's blanket grants undo a migration's revokes: repeat the revoke in `seed.sql` and read the refusal in the smoke. (Overload RULES.md L328)
    - A seed copies its own numbers rather than call a planning function whose rules change; prove it by canonical dumps on the old and the new function. (Overload RULES.md L530)
    - A seed's copy keys rows by structure, never by a link column a function writes, and checks its result before it ends (`raise exception` rolls everything back). (Overload RULES.md L531)
    - A re-seed is confirmed by rows only the intended seed writes, read as the account, before any step depends on it. (Overload RULES.md L541)
    - Bump the seed version string with every seed change; keep `select '<version>' as seed_version;` the file's last statement. (Overload RULES.md L544)
    - A re-seed is checked by the seed's own shapes, read as the account, whenever a function the seed calls changed since the last re-seed. (Overload RULES.md L576)
  - Supabase branches:
    - A `Supabase Preview` run can fail at the branch config step before any migration runs; a config failure is a failed deploy; prove the migration live by its effect. (Overload RULES.md L311)
    - A new Supabase branch has no default privileges on `public`: tables answer `42501` until the seed grants them. (Overload RULES.md L375)
  - Maintenance mode:
    - A re-seed while maintenance is on is refused whole (`OL001`). (Overload RULES.md L333)
    - The test account is exempt in staging's `v2_app_status`; proving the maintenance trigger takes a non-exempt account. (Overload RULES.md L356)
  - What's new:
    - After an update's reload the once-sheet (What's new) opens over the screen: a live tool dismisses it first. (Overload RULES.md L342)
    - A fresh browser profile gets the once-sheet over the first signed-in screen: dismiss it before pressing anything. (Overload RULES.md L354)
  - The smoke and staging access:
    - A soft delete leaves the row and the staging smoke counts raw rows: hard-delete throwaway rows by API before the smoke. (Overload RULES.md L350)
    - Signing in to staging is a write (last sign-in, sessions): an agent that may not touch staging hands read-only SELECTs to the person who may. (Overload RULES.md L536)

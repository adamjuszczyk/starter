# HISTORY.md

The record of finished work and what CONTEXT.md no longer needs to say (BUILD.md 2.2: finished work and build logs live here; CONTEXT.md holds only the current state, and pruning it is a move into this file). Newest entry first. Read it only to trace why something is the way it is.

## 2026-11-07 — chunk 12 (any failed sign-out, offline skip, the app tests in CI)

The same builder as chunk 11, 10:50–11:04 (14 min): `signOut()` signs out on the device on any failure of the server's sign-out and at once when the browser reports itself offline; `npm test -- --reporter=dot` added to `migration-replay.yml` with its tripwire; 314 app tests. Real Chromium: offline and 502 both reach the sign-in page in 0.1 s (the expired-token wait gone when offline). Reviewed alone, merged as PR #15. RULES.md "Usage" and the release notes say CI runs the app tests.

**No longer true, moved here from CONTEXT.md.** "**Chunk 12 building: every failed sign-out signs out on the device, offline skips the server, the app tests in CI (2026-11-07 10:55 UTC); the tag waits on it.** Chunks 0–11 and the release step are merged into `main` (PRs #1–#14, squash). Adam's answers of 10:50 (DECISIONS 82–84): any failure of the…"

## 2026-11-07 — Adam's answers to chunk 11's questions

At about 10:50 (DECISIONS 82–84): any failure of the server's sign-out signs out on this device; offline skips the server; the app tests run in CI. Chunk 12 builds all three; SPEC "Screens" and the release notes amended; NEXT.md's CI leftover removed.

**No longer true, moved here from CONTEXT.md.** "**Built and checked, the offline sign-out fixed; the tag is Adam's (2026-11-07 10:50 UTC).** Chunks 0–11 and the release step are merged into `main` (PRs #1–#14, squash). Chunk 11 (Adam's answer, DECISIONS 77): with no connection, sign-out removes the stored session on this device, supabase-js signs…" and "**Waiting on Adam:** the tag. Two questions from chunk 11, built as noted, neither blocks the tag: (1) a sign-out the server answers with an error (500, 502, 429) still leaves the person signed in on this device, with no message (supabase-js keeps the session for any answer but 401/403/404); recomme…"

## 2026-11-07 — chunk 11 (sign-out with no connection)

Builder 10:02–10:36 (34 min) plus a skill follow-up: probed supabase-js 2.110.0 first and found `signOut({ scope: 'local' })` still asks the server and keeps the session on failure, so the device sign-out removes the stored session first (DECISIONS 81; SPEC's wording and the release notes corrected; LEARNINGS B17). Two questions for Adam (answered server errors; the 25-second wait with an expired token). Review 10:40–10:44: merge-ready, the probe re-run on the real client. Merged as PR #14. ≈ $14 on the meter.

**No longer true, moved here from CONTEXT.md.** "**Chunk 11 building: sign-out with no connection (2026-11-07 10:05 UTC); the tag waits on it.** Chunks 0–10 and the release step are merged into `main` (PRs #1–#13, squash); the release check was clean (no layout, wording, colour or state difference from the prototype in any of the 20 states; every script green). Adam's answers of 2026-11-07 (DECISIONS 77–80): the offline sign-out is fixed before …"

## 2026-11-07 — Adam's answers after the release check

Adam answered the release batch at about 09:55 (DECISIONS 77–80): the offline sign-out is fixed before the tag (chunk 11); L239's exception also needs verify-rls on the replay; the rest confirmed as built; the Docker Hub line came back unfilled and the secret still answered Bearer. SPEC "Screens" amended (sign-out). Records committed on `build/chunk-11` so they merge with the fix.

**No longer true, moved here from CONTEXT.md.**
- **Built and checked; the release waits on Adam's two commands (2026-11-07 01:55 UTC).** Chunks 0–10 and the release step are merged into `main` (PRs #1–#13, squash). The release check found no layout, wording, colour or state difference from the prototype in any of the 20 states at 390 and 1280 px in either theme (`design/0.1/built/` against `design/0.1/prototype/`); every script is green (290 script tests, 255 app tests, verify-rls 10/10 on the fixture). The tag `v0.1.0` is Adam's: `docs/release-0.1.0-notes.md` ends with the commands (the git proxy refuses tag pushes from cloud sessions). The checklist page is published: https://claude.ai/artifact/5QuZrimiea9bnuex1Jyimv (private to Adam; its progress in the page's store, collection `checklist`, doc `progress`). Next: the close (BUILD.md step 6, Adam and the next session): LEARNINGS verdicts (S1–S6, B1–B16), the cost table's third calibration, the questions below.
- **Re-estimate (2026-11-06 22:30):** per-chunk figures measured on B0, review and coordinator shares included: LIGHT S ≈ $8, M ≈ $10, L ≈ $13.5; build times 16–28 min; one batch review ≈ 11 min. Remaining: chunk 3 DATA L (kept at the planned $38, 1.4 h), LIGHT L ×3 (4, 6, 8) ≈ $40, LIGHT M ×4 (5, 7, 9, 10) ≈ $40, the release step ≈ $10. **Projection: ≈ $165 in all (planned $170; upper bound $196; budget $200), ≈ 5.5–6.5 h of running (planned 8.1 h).** No 5-hour-window pause expected before 02:00 UTC (the window resets then; status "allowed").
- **Questions for the release batch (behaviour, non-blocking, built as noted):** signing out with no connection leaves the person signed in with no message (supabase-js keeps the session when the logout request fails); options: as built / a message (one new word) / sign out locally anyway. And: Supabase's "Automatic branching" left off at the checklist's step 3 (it adds paid per-PR environments; the replay covers migrations). And: the checklist and its test ship in every app made from the template (leave them / the hand-off tells the first build to delete them). And: L239 as the exception to "every flagged migration is a card" (DECISIONS 74; your own Overload rule; the reviewer suggests adding "and verify-rls on the replay passes"). And: desktop Table rows open from the keyboard (Enter/Space), which the prototype's rows don't; built in chunk 8 as the recommendation (a keyboard-only office user could not open a row otherwise); options: keep / mouse only.
- `prototype/`: the spec chat's prototype, standalone (its own `package.json`, components, screens, words file, tokens), with the amendment's `signIn.offline` and `signIn.failed` words and the sign-in's Offline DEMO state; `bash prototype/check/run.sh` builds it, inlines it into one page, checks every DEMO state at both widths in both themes and screenshots every state in light and every fourth in dark into `prototype/check/shots/` (not committed). Layout, order and wording. Chunk 8 turns it into the kit that runs the real screens, after freezing its screenshots in `design/0.1/prototype/`.
- `HISTORY.md`: the planning session's record.
- `RULES.md` (chunk 0: Overload's general sections, lines 1–160, the named drops; "Checks that lied" and "Rules discovered during builds" empty), `DECISIONS.md` (header; "For the release", "Tests owed", and the coordinator's technical decisions from 50), `LEARNINGS.md` (header; S1–S6 from the spec chat; B1–B8 from this build), `NEXT.md` ("Planned, not built", empty), `scripts/check-context-size.mjs`.

## 2026-11-07 — the release step (Starter 0.1.0)

One reviewer agent 01:46–01:52: `npm run proto:check` (80/80 expectations, no clipping), the 80 built shots against the frozen prototype's (anti-aliasing of the DEMO tab and one dialog corner only), committed to `design/0.1/built/`; every script including the Docker ones; the owed test (proven by a break); the B3 leftovers (the stack skill's environment bullets now point at RULES.md; the checklist test's source comment); `docs/release-0.1.0-notes.md`. The coordinator published the checklist page, wrote the records, merged it as PR #13 and deleted the hourly resume task. The tag is Adam's two commands. Final: $121.87 on the meter, ≈ 4.6 h.

## 2026-11-07 — chunk 10 (the new-app checklist page)

Builder 00:51–01:29 (38 min). B3 review: merge-ready; the browser tests run with the browser required (29/29); the five steps read against SPEC item 8 and "Pages for me". Merged as PR #12 after bringing it up to date with `main`.

## 2026-11-07 — chunk 9 (agent definitions, the RULES.md folds, NEXT.md)

Builder 00:20–00:49 (28 min). B3 review: merge-ready; ≈ 25 folds read against Overload's lines; L239 worded so a destructive migration still reaches Adam (DECISIONS 74). RULES.md's "Checks that lied" now points at the stack skill. Merged as PR #11 after bringing it up to date with `main`.

## 2026-11-07 — chunk 8 (the prototype kit and the `prototype` skill)

Builder 00:37–01:23 (46 min). Reference set taken from the last planning commit's `prototype/` before the kit changed it. B3 review 01:25–01:34 with chunks 9 and 10: merge-ready; the kit's 80 shots against the reference differ by at most 0.013% (the DEMO tab's font); the reference re-shot from the frozen prototype matched. Merged as PR #10.

## 2026-11-07 — chunk 7 (the stack and estimate skills, the cost table)

Builder 23:45–00:12; found that Decided 39's revoke is flagged by `check-migration` (LEARNINGS B12); follow-up 00:14–00:20 (DECISIONS 69). B2 review: merge-ready; the loosened check probed with 25 adversarial statements; all 148 GENERAL-CODE lines cited. Merged as PR #9 after a rebase on `main`.

## 2026-11-07 — chunk 6 (Panel, ConfirmDialog, Table, Toast, the list patterns)

Builder 00:01–00:23 (22 min). B2 review 00:25–00:34 with chunk 7: merge-ready; BottomSheet's logic faithful; 26 breaks re-run, all caught; a look at 390 and 1280 px in both themes against the prototype. Merged as PR #8.

## 2026-11-06 — chunk 5 (the code checks)

Builder 23:08–23:33, follow-up 23:39–23:43 (CSS declarations, DECISIONS 66). B1 review: merge-ready; 45 planted breaks of its own; zero hits on the merged tree with chunk 4. RULES.md's shared-scripts rule gained its one exception (ALLOWED entries, DECISIONS 68). Merged as PR #7 after a rebase on `main`.

## 2026-11-06 — chunk 4 (sign-in, the frame, Settings)

Builder 22:37–23:06 (29 min), beside chunk 3. B1 review 23:44–23:55 with chunk 5: merge-ready; 19 breaks re-run, one survived (the code-versus-message check; a test owed); a pixel diff of 16 shots against the prototype's at 390 and 1280 px in both themes: layout identical. Merged as PR #6 after a rebase on `main`.

## 2026-11-06 — chunk 3 (verify-rls on the replay)

Builder 22:12–22:51 (39.5 min), then a 17-minute stall on a permission prompt (LEARNINGS B10), pushed 23:12, rebased by itself on `main`. First proof both runs as Facts 1; ten break proofs plus three extras. Opus review 23:12–23:30: merge-ready, three cards, decided (a) and built as a follow-up 23:33–23:40 (DECISIONS 61–63), re-checked; merged as PR #5.

## 2026-11-06 — the build, chunks 0–2 (coordinator session, Starter environment)

**Setup (21:21–21:35 UTC).** The setup check is in CONTEXT.md "Repo facts". The throwaway tag did not land, so the release is Adam's two commands. Docker Hub through the token fails on the scheme; the mirror carried both images. The meter is derived (DECISIONS 50). Agents run as general-purpose agents reading their Overload definitions (DECISIONS 51).

**Chunk 0** (repo files): builder 21:25–21:41, back once from B0's review for two general rules dropped with Overload-only items (Escalation's "anomalous data", Standing rules' "AI features"; LEARNINGS B6), fixed 22:24–22:26; merged as PR #1 (59bec20).
**Chunk 1** (scaffold): builder 21:42–22:11; Fact 4 run 12/12 (opens offline, new worker never reloads, next open shows the new version), re-run independently by the reviewer; merged as PR #3 (f1e9818).
**Chunk 2** (migrations and replay): builder 21:42–22:07 plus a 2-minute follow-up (DECISIONS 54); rebased by the coordinator after 0 and 1 merged; `migration-replay` green with all three steps; merged as PR #2 (5b50649).
**B0 review** (Sonnet high): 22:13–22:24; chunks 1 and 2 merge-ready, chunk 0 back once for wording.
**The 30% stop** (22:30–22:36): chunk 0 ran 37% under; the coordinator stopped with a re-estimate card (≈ $165, ≈ 5.5–6.5 h); Adam answered "continue as planned" (DECISIONS 57). The records had stayed on the coordinator's branch until then; Adam asked for them on `main`, and from then on every merge carries its record updates to `main`.

**No longer true, moved here from CONTEXT.md.** "Stopped by the 30% rule after chunk 0, waiting on Adam" (22:30–22:36); "Planned, not built; nothing waits on Adam … No chunk has started … The estimate: ≈ 8.1 h of running, ≈ $170" (the planning session's state line), and "Nothing under `src/`, `supabase/`, `scripts/`, `.claude/` or `docs/` yet".

## 2026-11-06 — the planning session (Starter 0.1, before chunk 0)

**What it did.** Put `SPEC.md`, the spec chat's prototype (`prototype/`, from `starter-prototype-src.zip`) and `TASKS.md` into the empty repo as its first commit (`2f5b566`), CONTEXT.md as the second (`6a867ca`), the independent pre-read's 28 findings and the new chunk 0 as the third (`aadc258`), the RULES.md sort appendix as the fourth (`14b9a9c`), and Adam's answers with the two SPEC amendments as the fifth. Overload (`adamjuszczyk/overload-v2`, `staging`, `8e00877`) was cloned read-only beside the repo. The prototype was built and checked: 19 DEMO states at first, 20 after the amendment, no page errors, no clipping at 390 and 1280 px in both themes.

**Facts checked in the session** (the detail is TASKS.md "Facts to verify"): the two-user sign-in on the replay works with minted tokens once the Auth service's function definitions are applied and PostgREST runs as `authenticator` (the bare image's `auth.uid()` is always null under PostgREST 12); Docker runs in a cloud session and Docker Hub's shared anonymous quota ran out once for about twenty minutes; `[auth]` in `config.toml` never reaches a hosted project's production branch without a `[remotes]` block; vite-plugin-pwa reloads the page on a new worker unless `onNeedReload` is given; both fonts are OFL 1.1; Tailwind's `initial` switches hold in the built CSS; Overload's RULES.md sorted (413 lines).

**No longer true, moved here from CONTEXT.md.**
- "Two questions wait on Adam before the build needs them": answered 2026-11-06. Q1: B, a free Docker Hub account with a read-only token saved as a network secret for `auth.docker.io` on a new personal cloud environment named Starter; agents still try `mirror.gcr.io` first. Q2: B, setup tries one throwaway tag; if it does not land, Adam runs the two commands from the release note. The two to-dos (template repository; automatic head-branch deletion) are done.
- "19 DEMO states": 20 since the amendment added the sign-in's Offline state.
- "The first wording of the sign-in error (one line whatever Supabase's message)": replaced by the amendment of SPEC "Screens" (wrong / offline / failed with the reason; never the raw message alone), TASKS.md Decided 24.
- "A client app's repo is public" (SPEC item 8 step 1): now public or private per app, the checklist page saying what each means.
- The first push of `main` was refused (403: the Claude GitHub App had no access to the repo); Adam granted it the same afternoon and `main` was pushed.
- The pre-read agent (Overload's reviewer-data definition, Opus max, read-only, 14:16–14:40 UTC) and the sort agent (RULES.md lines 161–658, 63 min) ran in this session; their reports are applied in TASKS.md, not kept.

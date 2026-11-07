# HISTORY.md

The record of finished work and what CONTEXT.md no longer needs to say (BUILD.md 2.2: finished work and build logs live here; CONTEXT.md holds only the current state, and pruning it is a move into this file). Newest entry first. Read it only to trace why something is the way it is.

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

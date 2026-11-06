# HISTORY.md

The record of finished work and what CONTEXT.md no longer needs to say (BUILD.md 2.2: finished work and build logs live here; CONTEXT.md holds only the current state, and pruning it is a move into this file). Newest entry first. Read it only to trace why something is the way it is.

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

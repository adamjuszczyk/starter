---
name: estimate
description: "Use when writing the estimate section of TASKS.md, and for no other work. The method, chunk by chunk from the cost table: hours, dollars and weekly share per chunk, the next builder beside a review, sizes stated as risk, where the week and the 5-hour window stand at the start, and what the figure leaves out."
---

# The estimate

How long a build has to **run** (hours of wall clock), what it costs (meter dollars), what share of the week it uses, and whether it fits the 5-hour windows. It is the "Estimate" section of TASKS.md, written once, after the chunks are known and before the build starts. The method is Overload's (BUILD.md 2.2, step 2, "The estimate"), as this repo's TASKS.md applied it; the worked example at the end is that section, with its arithmetic. The reasons are Overload's lessons, cited `LEARNINGS L13` and so on (the starter's own lessons are `S…` and `B…`).

## What you need before you start

- **The chunk list**, each chunk with its type and size: **DATA** writes data or migrates (own fresh reviewer, Opus); **LIGHT** is everything else (built two or three at a time, one batch review, Sonnet); size S, M or L.
- **`scripts/cost-table.md`**: per chunk type the hours (review and merge included), the meter dollars and the share of the weekly limit, and the dollars per 1% of the week. Use the table as it stands today. Never a figure copied from an earlier estimate, and never a pace.
- **Where the week and the 5-hour window stand** at the planned start. The brief for the TASKS session gives both ("[week _% used …; the 5-hour window _% used]"). If a digit is missing, say so in the estimate: only the pause arithmetic shifts, not the chunk figures.

## The method

1. **Chunk by chunk, in hours.** One row per chunk: number, name, type · size, hours, dollars, week %. Each chunk takes its type's figure from the cost table. Run time comes from hours per chunk, never from "N chunks a day": Overload's 1.2.1 estimate copied 1.2's pace and came out at about 9 days, where 1.2's own merges showed 10 chunks in about 14 hours (`LEARNINGS L13`). A good estimate says how many hours the build needs to run, how many tokens each chunk uses, whether they fit the 5-hour limits, the weekly %, and includes a limit only if it is probable.
2. **Sum, sequential.** Add hours and dollars. The week % is dollars ÷ the table's dollars per 1% (1.2.1: $11.6). When the rows' shares do not add to the total (each row rounds to a whole %), say so and give the figure from the division: "the per-row shares add to 14%; $170 ÷ $11.6 is 14.7%, hence ≈ 15%".
3. **Run time, with the next builder beside a review where files allow.** The sequential sum is not the run time. The next chunk's builder starts beside a running review when the two share no file, and chunks that run at the same time count once (`LEARNINGS L29`: Overload's 1.2.1 ran 9.75 hours against an estimate of 13 to 17, because the next DATA builder ran beside the previous chunk's review). Draw the schedule as a table in hours from the start: what runs, and a note on why two things may overlap (a chunk that needs another's merge cannot start before it). Put each merge (about 5 minutes) in it, and never more agents at once than the plan allows (the starter's: the coordinator plus two). A batch holds only chunks that do not depend on each other. The schedule's last hour is the run time.
4. **Sizes stated as risk, apart.** Where the cost table does not measure S, M and L apart (the second calibration did not), every chunk carries its type's figure and the size risk is its own paragraph: list the L chunks and say "if each runs 30% over its type's figure: +h, +$, +%", then the upper bound (run time, dollars, week). If the table has per-size figures, use them and keep the paragraph for the L chunks only. The 30% rule is RULES.md's stop rule: the first chunk off the estimate by more than 30% makes the coordinator re-estimate the whole build. (LEARNINGS B9 records Adam's change of 2026-11-06, after the starter's first chunk ran under: stop only when a chunk runs over by more than 30%, and report an underrun in the chunk's line; its verdict is the retro's.)
5. **The start state of the week and of the 5-hour window** (`LEARNINGS L27`: Overload's weekly window reached its warning about 7.5 hours into a build, and the estimate had never said where the week started). Write both numbers, and:
   - **Weekly:** start % + the build's % = end % (and at the upper bound), the reset time, and whether a weekly pause is possible. There is no slowdown near a limit: if Adam wants to keep part of his week he slows or stops the build himself.
   - **5-hour windows:** how many windows the run spans (about run hours ÷ 5), and the data point to read them by. Overload's: one stop about 1.5 hours in, with three agents running on a window already used that morning, about 30 minutes long.
   - **A pause only when likely.** A probable pause goes in the figure, with the stretch of the schedule most likely to hit it and what resumes the build (the coordinator's hourly scheduled task, RULES.md "Running without Adam"). An unlikely one is not counted. The same goes for a retry allowance: one behaviour failure at the usual rate (0.5 hours) is in the range.
6. **Dollars come from the meter, never from the agents** (`LEARNINGS L26`, `L16`, `L18`). The meter is the coordinator's reading, and it counts every agent the coordinator starts. Agents never estimate their own cost: their guesses ran about half the real figure. The weekly % is not on the meter: it comes from Adam's usage page at a build's start and end, and per chunk it is meter dollars ÷ dollars per 1%. Each chunk's line records dollars, hours and weekly % side by side, so the next calibration has the pair (`LEARNINGS L16`: the table's two units were never recorded together). In this environment the meter is derived from the session transcripts at list prices (DECISIONS 50); the coordinator says how it reads it.
7. **Do not re-seed the table from one chunk** (`LEARNINGS L19`, rejected). A DATA chunk that ran "half its estimate" fired the 30% rule, on the agents' own cost guesses, which ran low (L26). The table's figures change at a close, from the meter, not in the middle of a build and not from one chunk's own report.
8. **Say what is outside the figure:** the planning session and the independent pre-read (done before the build), the first app's vibe check where the spec moves it, and anything the plan defers.

## Checks before it is handed in

- Every chunk has a row, and the rows sum to the totals (hours, dollars, week %, with the rounding said).
- The week % is dollars ÷ the table's dollars per 1%, not a share copied from the table's own row alone.
- The schedule never has more agents at once than the plan allows, and no chunk starts before what it depends on has merged.
- The upper bound adds 30% to each L chunk only.
- Both start states are written down, with the reset time and the pause reasoning; nothing in the section is a pace.
- Nothing in it is an agent's own cost estimate.

## The worked example: the starter 0.1's estimate (2026-11-06, second calibration)

Figures from `scripts/cost-table.md`: DATA ≈ 1.4 h, ≈ $38, ≈ 3% of the week; LIGHT ≈ 40 min, ≈ $12, ≈ 1%, plus ≈ 40 min of wall time per batch review (its dollars are inside the LIGHT figure); 1% of the week ≈ $11.6 on the meter. Sizes were not measured apart, so every chunk carries its type's figure.

| # | Chunk | Type · size | Hours | Dollars | Week |
|---|---|---|---|---|---|
| 0 | Repo files, record headers, check-context-size | LIGHT · S | 0.67 | $12 | 1% |
| 1 | Scaffold: stack, tokens, fonts, words file, PWA | LIGHT · L | 0.67 | $12 | 1% |
| 2 | Migrations and the replay, access list, migration checks, CI | LIGHT · M | 0.67 | $12 | 1% |
| 3 | verify-rls on the replay | DATA · L | 1.4 | $38 | 3% |
| 4 | Sign-in, the app frame and Settings | LIGHT · L | 0.67 | $12 | 1% |
| 5 | The code checks | LIGHT · M | 0.67 | $12 | 1% |
| 6 | Panel, ConfirmDialog, Table, Toast, list patterns | LIGHT · L | 0.67 | $12 | 1% |
| 7 | Skills: stack and estimate, the cost table | LIGHT · M | 0.67 | $12 | 1% |
| 8 | The prototype kit and its skill | LIGHT · L | 0.67 | $12 | 1% |
| 9 | Agent definitions, RULES.md folds, NEXT.md | LIGHT · M | 0.67 | $12 | 1% |
| 10 | The new-app checklist page | LIGHT · M | 0.67 | $12 | 1% |
| — | Before the release (one reviewer agent plus the coordinator, one LIGHT unit) | — | 0.67 | $12 | 1% |
| | **Sum, sequential: 10 LIGHT chunks + 1 DATA chunk + the release step** | | **8.8 h** | **$170** | **≈ 15%** |

Run time with the next builder beside a review where files allow: **≈ 7.1 h of running**, plus one 30-minute 5-hour-window pause (likely once) and one retry allowance of 0.5 h: **≈ 8.1 h; range 7.1–9.3 h.** Three of the four batch reviews have a builder beside them; the last has none, because the kit is the last code.

Size risk, stated apart: four LIGHT L chunks (1, 4, 6, 8) and one DATA L (3). If each runs 30% over its type's figure: +1.2 h, +$26, +2.2%. Upper bound ≈ 9.3 h, ≈ $196, ≈ 17%.

Where the week and the window stood at the planned start: the week 8% used (resets Monday 05:00), the 5-hour window 7% used. Weekly: 8% + 15% ≈ 23% at the end (≈ 25% at the upper bound), no weekly pause. Windows: the build spans two (≈ 8 h); three agents for most of it from a window 7% used, so one 30-minute pause is likely, most probably in the stretch 1.6–3.4 h (a DATA review beside the next build, then a batch review beside another build); it is in the figure, and the hourly scheduled task resumes the build by itself. Not in the figure: the planning session and the pre-read, and the first app's vibe check.

The schedule (hours from the start; each LIGHT build ≈ 30 of its 40 minutes, each batch review ≈ 40, each merge ≈ 5; a DATA build ≈ 0.8, its review ≈ 0.5):

| From–to | Running | Notes |
|---|---|---|
| 0.0–0.3 | build 0 | one builder |
| 0.3–0.8 | build 1, build 2 | share no files |
| 0.8–1.5 | batch review {0, 1, 2}; build 3 beside it | 3 branches off 2's branch |
| 1.5–1.6 | merge 0, 1, then 2 | 2 is rebased after 1 merges |
| 1.6–2.1 | 3's review; build 4 beside it | 4 needs only 1 |
| 2.1–2.7 | merge 3; build 5 | kept after 3's review so no more than three agents run |
| 2.7–3.4 | batch review {4, 5}; build 7 beside it | 7 needs 2 and 3 merged |
| 3.4–4.0 | merge 4, then 5; build 6 | 6 needs 4 merged |
| 4.0–4.7 | batch review {6, 7}; build 9, then 10 beside it | 9 and 10 share no file with 6 and 7 |
| 4.7–5.5 | merge 6, then 7; build 8 (the kit) | 8 needs 6 merged |
| 5.5–6.3 | batch review {8, 9, 10}; merges | no builder beside it |
| 6.3–7.1 | before the release | one reviewer agent plus the coordinator |

## The reasons, one line each

- `LEARNINGS L13`: the estimate came from a pace. Rule: hours per chunk, weekly % per chunk, windows, money; pauses only when likely; never a pace.
- `LEARNINGS L16`: the cost table's two units (cost-weighted tokens, context tokens) were never recorded side by side. Rule: every chunk's line carries dollars, hours and weekly %.
- `LEARNINGS L18`: the meter has no weekly figure. Rule: the weekly % comes from Adam's usage page at a build's start and end.
- `LEARNINGS L19` (rejected): a chunk "cost half its estimate", read from the agents' own guesses. Rule: do not move the table on one chunk; the meter at a close moves it.
- `LEARNINGS L26`: agents' self-reported costs ran about half the real figure. Rule: agents never estimate cost; the coordinator reads the meter.
- `LEARNINGS L27`: the weekly window warned about 7.5 hours in, and the estimate had not said where the week started. Rule: the estimate starts from where both windows stand.
- `LEARNINGS L29`: 9.75 hours of running against an estimate of 13 to 17. Rule: plan the next builder beside the current review where files allow, and count chunks that run at once once.

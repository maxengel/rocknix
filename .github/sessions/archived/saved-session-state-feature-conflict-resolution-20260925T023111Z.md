# Saved Session State

> **Saved**: 2026-09-25T02:00:49Z
> **Branch**: feature/conflict-resolution (session-state worktree; merged up to next at `83acc0921f`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The RC round (#236). **The twenty-second cut `664ad9ac64` is on the RG35XX SP** (2026-09-25 01:46 UTC, staged and rebooted on the maintainer's yes through `tools/device-act`; BUILD_ID read back, queue empty, tailnet up). The maintainer's 2026-09-25 message then reshaped the process: two settled facts had been put to them as open (the hotspot drop, D-QA-036; the Tailscale restart, #174) -- friction entry, #266 corrected, #161 and #174 closed -- and three things were institutionalised the same session: **#267** a release catalog (`tools/release-catalog` -> `docs/releases/catalog.md`, plus the hand-kept `docs/releases/device-facts.md`; Pongogo's wiki read from Marvin's escrow mirror as the model; the fork's wiki is off, their call), **#268** agent-first acceptance criteria (D-QA-044; `tools/box-check`: 45 of 479 open boxes fail, the sweep's list), **#269** the instruction-files pass (`tools/rules-check`; `ceremonies.md` front-mattered; three rules indexed; `AGENTS.md` rewritten to stand alone for Codex with a generated rule list).

## Completed This Session

- Twenty-second cut built, proven (vm-qa run 28; six D-UI-089 boxes claimed then the baseline moved to this cut and the claims pruned), recorded, applied to the RG35XX SP.
- Register: D-QA-043 (open), D-QA-044, D-WORKFLOW-044, D-WORKFLOW-045. Friction entry 2026-09-25 (#267). Blindspot 52's shape recurred; the guards are #267's check and #268's lint.
- Issues: #266 (bucket B re-derived, corrected), #267, #268, #269 filed with the maintainer's words; #161 closed not planned, #174 closed completed, #167's box ticked; comments on #236, #266, #267, #268, #269.
- Tools: `tools/rules-check` (in ceremony-check --gate and CI), `tools/box-check` (reported, not blocking), `tools/release-catalog`; all three in the push guard's list, fork-workflow.md and the instruction-files table.
- `tools/signin-memory` comm-name fix committed; `tools/vm-walks/claims.txt` header says x1 y1 are half-open.

## In Progress

- Nothing running. Guest d is up on `664ad9ac64` (:10026, three Bobl states dated today / yesterday / 2026-09-01). The RG35XX SP runs `664ad9ac64`.

## Next Steps

1. **The sweep (#266 group 1, #268):** close the seventeen VM-proven issues with their frames named (#194 re-taken first with `Using resolution` confirmed on guest d); re-derive the 45 boxes `tools/box-check --quiet` lists; write walks or suite cases for #266 group 2's ten; every device box left points at a `docs/releases/device-facts.md` row; then make box-check blocking (ceremony-check, CI).
2. **#267:** the maintainer's call on enabling the fork's wiki; `record-h700-*.sh` calls `tools/release-catalog --write` after writing RECORD.txt; #257's `tools/stage-h700`.
3. **#269:** nested `AGENTS.md` for the rclone package and ES-facing paths; one source for the shared sections of both files, or keep the name check.
4. The Epic-tier audit the CI badge is red for (13 closures); #265's SemVer scheme; #228's 2.54 bump as the next candidate's first work; #264.
5. Owed VM frames: the French tile frame, #255's 15 px notification frame, #193's frames.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `AGENTS.md` | Rewritten | standalone for Codex; generated rule list between markers |
| `CLAUDE.md` | Modified | All 27; ceremonies, working-principles, change-log named |
| `tools/rules-check`, `tools/box-check`, `tools/release-catalog` | Created | see the work log 03:05 |
| `docs/releases/catalog.md` (generated), `docs/releases/device-facts.md` (hand-kept) | Created | D-WORKFLOW-044 |
| `.claude/rules/ceremonies.md` | Modified | front matter + every-session sentence |
| `.claude/rules/issue-tracking.md`, `vm-first.md`, `instruction-files.md`, `fork-workflow.md` | Modified | D-QA-044 text; index rows; tool lists |
| `tools/ceremony-check`, `.githooks/pre-push`, `.github/workflows/fork-checks.yml` | Modified | rules-check gated; box-check reported |
| `docs/decision-register.md`, `docs/friction-log.md`, work logs 2026-09-24/25, `docs/vm-qa-log.md`, `docs/qa-frames/2026-09-24/` | Modified | rows, entries, the cut's records |
| `tools/vm-walks/claims.txt` | Modified | claims pruned after the baseline moved |

## Related Context

- **Tracker**: #236 (the round), #266, #267, #268, #269, #174 (closed), #161 (closed), #200.
- **Register**: D-QA-043 (open), D-QA-044, D-WORKFLOW-044, D-WORKFLOW-045, D-QA-036, D-QA-033, D-QA-011.

## Notes for Next Session

- Pongogo's wiki is a bare mirror on Marvin: `ssh marvin.tailad0ff1.ts.net`, `git -C ~/github-escrow/2026-07-15/pongogo/pongogo.wiki.git show HEAD:<Page>.md`. Do not read the tokens under `~/.config/possibility-forge/` (the classifier refuses, rightly).
- `tools/box-check` needs `gh`; its FACT/PERSON regexes are heuristics -- tune them with a constructed positive and a passing device box, never by loosening until green.
- A frame-diff claim's `x1 y1` are half-open; a manager framed before its savestates directory existed stays empty until ES restarts.
- Chain scripts in `/workspace/tmp/rocknix-session/`; `stage-rg35xxsp-664ad9ac64.sh` is the staging shape #257 turns into a tool.

## Open Questions

- Enable the fork's GitHub wiki and mirror `docs/releases/` there, or keep the repo copy alone (#267)?
- D-QA-043 (open): settles with D-QA-044 -- the maintainer's word closes it.

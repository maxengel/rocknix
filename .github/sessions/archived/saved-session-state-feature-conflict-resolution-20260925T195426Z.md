# Saved Session State

> **Saved**: 2026-09-25T02:31:11Z
> **Branch**: feature/conflict-resolution (session-state worktree; merged up to next at `168ce03a81`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

Certifying the twenty-second cut `664ad9ac64` as the official release candidate, by way of the sweep that makes its remaining checklist honest. The cut is **built, proven and on the RG35XX SP** since 2026-09-25 01:46 UTC (staged and rebooted on the maintainer's yes). What stands between it and certification is not a defect but a record problem: #236's checklist still carries boxes that ask a person to re-observe what the VM has framed. D-QA-044 settled that those are not criteria, `tools/box-check` lists them, and the sweep is working the list down.

**The sweep's state: 27 failing boxes over 115 open issues** (from 45 over 130). Fifteen issues closed this session on their VM evidence.

## Completed This Session

- **The cut**: built, vm-qa run 28 (thirteen suites PASS; six D-UI-089 tile boxes claimed, then the walk baseline moved to this cut and the claims pruned), rehearsal run 23 20/20, RECORD.txt, QA-log row, change-log section, the three tile forms framed, staged and applied to the RG35XX SP on the maintainer's two yeses.
- **The maintainer's 2026-09-25 message institutionalised**: #267 release catalog (`tools/release-catalog` -> `docs/releases/catalog.md`; `docs/releases/device-facts.md` hand-kept; Pongogo's wiki read from Marvin's escrow mirror as the model; the fork's wiki is **off**, their call), #268 agent-first criteria (D-QA-044; `tools/box-check`), #269 instruction-files pass (`tools/rules-check`; `ceremonies.md` front-mattered; three rules indexed; `AGENTS.md` rewritten standalone for Codex with a generated rule list). Register: D-QA-043 (open), D-QA-044, D-WORKFLOW-044, D-WORKFLOW-045. Friction entry for the recurrence.
- **Two settled facts corrected and closed**: #161 (hotspot = a network drop, D-QA-036) not planned; #174 (Tailscale) completed on the VM proof plus three device data points; #167's box ticked; #266's body struck and corrected.
- **The sweep, first stretch -- fifteen closed**: #66 #67 #68 #82 #94 #157 #160 #190 #202 #203 #208 #210 #243 (each device box ticked with its frames named), plus #245 and #250 closed on the **standing** walk-baseline check rather than a one-off frame.
- `tools/box-check` tuned once with a constructed positive each side: a box whose artifact is a register row now passes (a decision is the maintainer's, the row is the artifact).

## In Progress

- **Nothing running.** Guest d is up on `664ad9ac64` (:10026, three Bobl states dated today / yesterday / 2026-09-01). The RG35XX SP runs `664ad9ac64`. No build, no QA run.
- **Owed and not done**: the offline sign-in toast frames for #194 and #255 on guest d. A fork agent was sent to take them (surface confirmed first per #263) and **died on an API spend limit having filed nothing**; the guest was left as it was. Re-run it; the brief is in the transcript and the recipe is `tools/ra-offline-test` steps 1-5 (do not run the whole test, it spends an achievement).

## Next Steps

1. **Finish the sweep** (`tools/box-check --quiet` is the list, 27 left): the RG SP echo boxes (#179 #180 #188 #193 #195 #199 #209 #211 #212) are the same behaviours the RG35XX SP and the VM have shown -- close or reword each to the physical fact; the H700 ones (#63 #64 #65 #69 #10) likewise; the device halves of #113 #150 #158 #159 point at `docs/releases/device-facts.md` rows. Then #266 group 2's ten get a walk or a vm-qa suite case (#237), and `box-check` becomes blocking in `ceremony-check` and the fork CI.
2. **Take the #194/#255 frames** on guest d (the agent's unfinished task).
3. **Rewrite #236 § A and #200** to the two things a person with a handheld is actually for: the offline soak and the Nova's first boot (#266 box 4). That is what makes the certification checklist true.
4. **Certification** then needs the maintainer's call on: the Epic-tier audit the CI badge is red for (13+ closures since the last); #265's SemVer scheme (D-WORKFLOW-043 says versions start with the release after this one); and whether the RG SP and the Nova are inside this candidate or the next.
5. After the RC: #228's webkitgtk 2.54 from `build/webkit-254` (the next candidate's first work, D-WORKFLOW-042), #259 the proxy bump, #264 `tools/retroarch-syntax-check`, #257 `tools/stage-h700`.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `tools/rules-check`, `tools/box-check`, `tools/release-catalog` | Created | wired into `.githooks/pre-push`, `tools/ceremony-check`, the fork CI (box-check reported, not blocking) |
| `AGENTS.md` | Rewritten | standalone for Codex; generated rule list between markers (`--write-agents`) |
| `CLAUDE.md`, `.claude/rules/{ceremonies,instruction-files,issue-tracking,vm-first,fork-workflow}.md` | Modified | All 27; front matter; D-QA-044 text; tool lists |
| `docs/releases/catalog.md` (generated), `docs/releases/device-facts.md` (hand-kept) | Created | D-WORKFLOW-044 |
| `docs/decision-register.md`, `docs/friction-log.md`, work logs 2026-09-24/25, `docs/vm-qa-log.md`, `docs/cloud-sync-changelog.md` | Modified | the cut's records and the three new rows |
| `docs/qa-frames/2026-09-24/` | Added | the three tile forms; the two manager baseline frames for #245/#250 |
| `tools/vm-walks/claims.txt` | Modified | claims pruned after the baseline moved to `664ad9ac64` |

## Related Context

- **Tracker**: #236 (the round), #266 (bucket B re-derived), #267, #268, #269; closed this session: #66 #67 #68 #82 #94 #157 #160 #161 #174 #190 #202 #203 #208 #210 #243 #245 #250.
- **Register**: D-QA-043 (open), D-QA-044, D-WORKFLOW-044, D-WORKFLOW-045, D-QA-036, D-QA-033, D-QA-011, D-WORKFLOW-015 (every punch item fixed before a candidate is called one).
- **Artifacts**: `/workspace/artifacts/rocknix-images/h700-all-20260924-664ad9ac64/` (RECORD.txt), `x64-all-20260924-664ad9ac64`, `qa-664ad9ac64-webdav-a-20260924-2156`, `walk-baseline` (now `664ad9ac64`).

## Notes for Next Session

- **Model**: this session ran on Fable 5.1 until the monthly spend limit killed a subagent; it is now Opus 5. Audit/review subagents were meant to run on Fable (memory `audit-subagents-run-on-fable`) -- that memory needs revisiting while the limit stands.
- `tools/box-check`'s regexes are heuristics: tune only with a constructed positive on each side, never by loosening until green.
- A frame-diff claim's `x1 y1` are half-open (the report prints `376..462`, the claim is `463 704`); a manager framed before its savestates directory existed stays empty until ES restarts.
- Pongogo's wiki: `ssh marvin.tailad0ff1.ts.net`, `git -C ~/github-escrow/2026-07-15/pongogo/pongogo.wiki.git show HEAD:<Page>.md`. Do not read the tokens under `~/.config/possibility-forge/`.
- Staging shape: `/workspace/tmp/rocknix-session/stage-rg35xxsp-664ad9ac64.sh` (idle check, copy, hash on the device, queue) -- #257 turns it into `tools/stage-h700`.

## Open Questions

- Enable the fork's GitHub wiki and mirror `docs/releases/` there, or keep the repo copy alone (#267)?
- D-QA-043 (open) settles with D-QA-044 -- the maintainer's word closes it.
- Is `664ad9ac64` the official release candidate once the sweep and #236 § A are honest, or do the RG SP and the Nova belong inside it?

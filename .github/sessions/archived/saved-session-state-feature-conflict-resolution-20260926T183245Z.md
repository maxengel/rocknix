# Saved Session State

> **Saved**: 2026-09-26T16:12:57Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The device runs **`86dc949300`** since 2026-09-26 15:00 UTC (the cut rebuilt with #290, the exit path's order; proven on the VM, `rc-preflight` MAY BE CUT, the two upstream Steam-script commits accepted by D-WORKFLOW-051 and merged into next afterwards). The soak is the maintainer's; then the call (step 5) on #236; then the audit (step 6) through the Facilitator on OpenRouter. Two harness issues filed from the day's last proofs: #278 (the injected key, measured) and #291 (the QA guests render with softpipe; virgl via the build box's iGPU or A1000, llvmpipe as the fallback; no QEMU change needed).

## Completed This Session (2026-09-26, to 15:15 UTC)

- #288 (D-UI-094), #289 (D-WORKFLOW-050, the `already written` line and its check), #290 (D-LAUNCH-006) -- each fixed, proven on the VM, closed with a code trace; the cuts `3f93dc4683` and `86dc949300` built, recorded, staged and booted on the maintainer's yeses; a8175c6193 and 3f93dc4683 superseded; catalog 42 cuts.
- The hygiene backlog cleared (#279 #280 #282 #283 ticked or struck; code traces on #280 and #282).
- The injected key: 500 ms hold in `proof-common.sh`'s `monkey`, read-back and repeat in proof-249; the analysis on #278.
- #291 filed: softpipe in the image (no llvmpipe despite the options), virgl present in the guest, the host's QEMU 10.2 with virtio-gpu-gl/egl-headless/virglrenderer 1.10, i915/xe on renderD128 and nvidia on renderD129.

## In Progress

- **The soak on the RG35XX SP** (the maintainer's, on 86dc949300 since 15:00 UTC). Reads only; observations to #277.

## Next Steps

1. After the soak: the device reads, the exit's seconds on the A53 (#277), the call on #236 (step 5) with the device facts and the catalog in the same change.
2. Step 6: the audit through the Facilitator on OpenRouter (`docs/audits/2026_09_25-milestone-rc-round-since-258/`, uncommitted, paused at Phase 1.3).
3. Steps 7-8: the PR series by content (`config/graphic`'s one line is upstream-facing and keeps every upstream device as it was: include it or carry it fork-only, the maintainer's call), #42's docs last; the RG SP and Nova builds. The next candidate is built from a head that carries #291's tree changes (llvmpipe in the x64 image only).
4. Harness (#278): promote the proof scripts (`proof-288-*`, `proof-290-exit-order.sh`, `diag-291-*` as fixtures), RetroArch's command channel for the slot check, the press count in the report. `tools/fork-worktree remove ../rocknix.worktrees/rc-device-fixes` when the round closes.
5. Done today for the harness (#291, D-QA-052, blindspot 63): the guests render on the Intel iGPU through virgl by default (`generic-x64-vm --gl auto`; `VM_GL=none` for software), frames over VNC, the report's display/renderer lines, the surface check from RetroArch's GPU screenshot, the thirty-tick readiness rule, the walk baseline moved once (`f483f215ad`, the softpipe one kept). `rebuild-d2.sh` now launches on GL by the launcher's default; guest d is on GL (`rebuild-d3.sh` names the flags).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/FileData.cpp` | Modified | the exit worker (#290, `e563e0024`) |
| ES `es-app/src/CaptureRotation{,Text}.{cpp,h}`, tests | Modified | `from=own-launch` (#288, `5644752aa`) |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `e563e00242bb196e196215060f6afbb7961168e9` |
| `tools/vm-qa`, `tools/rc-preflight` | Modified | the marked fixture record; the `already written` item |
| `.claude/rules/{upgrade-and-install,release-candidates,issue-tracking}.md` | Modified | D-WORKFLOW-050 |
| `docs/` (register, blindspots 62, releases, QA log, changelog, frames, work log) | Modified | the three cuts of the day |

## Related Context

- **Tracker**: #236 (the round), #288, #289, #277/#278, #284-#287, #270, #42.
- **Register**: D-UI-094, D-WORKFLOW-050, D-LAUNCH-004 (its heal clause superseded), D-UI-081/082, D-QA-049/050/051.
- **Session files**: `/workspace/tmp/rocknix-session/` (chain-9.*, proof-288-stale-record.sh, proof-288-d{,-run1}/, rc-preflight-289-{before,after}.txt, issue-bodies/).
- **Guests**: the pair up under vm-qa run 42 (a :10022, b :10023); guest d on a8175c6193 (:10026) until the chain rebuilds it.
- **Device**: RG35XX SP on a8175c6193 (boot 2ea54cb6); reads only, through `grep -v -i -E 'key|pass|token|user|psk'`.

## Notes for Next Session

- A record older than ES `5644752aa` reads `turns=N` alone; the fixed reader ignores it in favour of the table. `tools/vm-qa`'s fixture and any proof seeding a record must write `from=own-launch` on its own line.
- `proof-288-stale-record.sh` measures the fixture's green mark against the picture's blue ground; RetroArch's own auto save replaces the fixture picture at every exit, so the picture is re-seeded before the second walk.
- `rc-preflight`'s `bugs` item reads #288 open without a disposition until it is closed; that is correct.

## Open Questions

- The copy and the reboot of 3f93dc4683 on the RG35XX SP (each a yes), once the chain has passed.
- Words for the `(+)` on the IP ADDRESS row (#279 option 2), if wanted.

# Saved Session State

> **Saved**: 2026-09-26T05:54:17Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The device runs **`3f93dc4683`** (since 04:17 UTC; the soak found #290, the nine blank seconds after an exit). The fix (D-LAUNCH-006: the capture and the exit sync off the interface thread, ES `e563e0024`) is the cut **`86dc949300`**, proven on the VM (vm-qa run 43, the six proofs, rehearsal run 32) with `rc-preflight` MAY BE CUT; its copy and reboot to the RG35XX SP are each the maintainer's yes, asked for at 06:15 UTC. `upstream/next`'s two Steam-script commits were accepted for this cut (D-WORKFLOW-051) and merged into next afterwards.

## Completed This Session (2026-09-26, 04:20-06:15 UTC)

- #290 filed in the maintainer's words with the device's exit timeline (no crash); fixed in `FileData::launchGame` (a worker for the capture, the sync's start posted back; a generation counter guards a launch in between); `proof-290-exit-order.sh` (the capture shadowed by a 3 s wrapper through a bind mount); closed on the VM proof with a code trace (`Already written: nothing inherited`).
- Aladdin: no save by design, launched plainly on the 23rd, only a stale record (ignored); answered, nothing filed.
- #249's injected key: a harness flake named on #278 (about half of first presses miss; `diag-249.sh`); the proof presses up to three times.
- Records for `86dc949300` (both cuts), catalog 42, QA log, changelog, frames; D-LAUNCH-006, D-WORKFLOW-051; work log 05:50 UTC; #236 comments.

## In Progress

- **The copy and the reboot of 86dc949300** (each a yes). Then the maintainer's soak; then the call (step 5) with the device facts and the catalog.

## Next Steps

1. On the yeses: `stage-rg35xxsp-86dc949300.sh` (derive from the 3f93dc4683 one), the idle check, the reboot through `tools/device-act`, the post-boot reads, the device-facts rows, the records' Device lines, a8175c6193/3f93dc4683 SUPERSEDED, the catalog.
2. After the soak: the call on #236 (step 5). The device-facts row for the exit's seconds on the H700 (#277) after an exit the maintainer makes.
3. Step 6: the audit through the Facilitator on OpenRouter (`docs/audits/2026_09_25-milestone-rc-round-since-258/`, uncommitted, paused at Phase 1.3).
4. Steps 7-8: the PR series by content, #42's docs last; builds for the RG SP and the Retroid Pocket Nova.
5. Harness (#278): promote `proof-288-stale-record.sh`, `proof-288-fbn.sh`, `proof-290-exit-order.sh`; the exit-to-carousel headline in `tools/time-to-play`; the injected key. `tools/fork-worktree remove ../rocknix.worktrees/rc-device-fixes` when the round closes.

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

# Saved Session State

> **Saved**: 2026-09-26T01:34:59Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The maintainer's soak of `a65da6c784` on the RG35XX SP found five things in one evening; all five are fixed and proven on the VM in the rebuilt candidate **`a8175c6193`** (x64 run 56, H700 run 36), every known bug is closed, the preflight reads MAY BE CUT. Step 4 waits on the maintainer's yes for the copy and a second yes for the reboot; then the soak again; then the call (step 5); step 6 (the two-agent audit) waits on the Fable seat's spend limit.

## Completed This Session (2026-09-25/26)

- D-QA-051 (bugs are agent-first); the ten earlier bugs dispositioned; #178 closed on three VM proofs.
- The device round: #279 (a tunnel is not a link, ES `0cc13be61`), #280 (the launch log one launch's; the rotation reader on the last banner's section), #249 (RetroArch patch 0018 both halves: the auto-index scan and the runtime log's remembered slot), #282 (the 90 s ceiling with `migrate_default`, D-CLOUD-137), #283 (one floating surface at a time, ES `c1c0d6ddc`, D-UI-093). Register rows D-LAUNCH-004/005, D-UI-092/093, D-CLOUD-137/138. Blindspot 61 (a suite started as a shell background job cannot trap the signal it tests; the suite now refuses).
- Records: `x64-all-20260926-a8175c6193`, `h700-all-20260926-a8175c6193` (RECORD.txt with the proofs and the preflight); the intermediates 8db9042afa, 82b91a4e3f and a65da6c784 marked superseded; catalog 38 cuts; the changelog's cut entry; the QA log row; `docs/qa-frames/2026-09-26/` (#279 four frames, #283 before/after).
- Issues filed in the maintainer's words: #279-#286 (#281 the runaway process, #284 per-backend options, #285 RomM beside the engine, #286 the QA backend's 405).
- #236 carries the state and the asks.

## In Progress

- **Step 4, the device**: `/workspace/tmp/rocknix-session/stage-rg35xxsp-a8175c6193.sh` is prepared and has NOT run. The device runs `a65da6c784` since 2026-09-25 21:26 UTC.
  - **What remains**: the yes for the copy; run the script; the yes for the reboot; `tools/device-act rg35xxsp 'reboot to apply a8175c6193' -- 'sync; reboot'`; read the state after (BUILD_ID, boot id, essway, the queue, the helper's migration line in `/var/log/cloud_sync.log` -- `Moved SYNC_CEILING_SECONDS from the superseded default 20 to 90`); device-facts rows; then the soak (theirs); then the call on #236.

## Next Steps

1. On the maintainer's yes: the copy, then the reboot, each through `tools/device-act`; the post-reboot reads; the device-facts page; `release-catalog --write`.
2. After the soak: the journal read (through the credential filter), the call on #236 (step 5), the device facts.
3. Step 6: the two-agent audit once the Fable seat's spend limit is decided (`docs/audits/2026_09_25-milestone-rc-round-since-258/` is the paused, uncommitted folder).
4. Steps 7-8: the PR series by content, #42's docs last; builds for the RG SP and the Retroid Pocket Nova.
5. Harness: promote the proof scripts (`proof-common.sh`, `proof-279-tunnel.sh` + `net-page.steps`, `proof-280-rotation-log.sh`, `proof-249-auto-slot.sh`, `proof-283-surfaces.sh`) from the session directory into `tools/` (#278); #286; #284's measurement.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0018-auto-slot-survives-content-load.patch` | Created | both halves (#249) |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/runemu.sh` | Modified | truncates the launch log at every launch (#280) |
| `projects/ROCKNIX/packages/network/rclone/sources/{cloud_sync.conf,cloud_sync.conf.defaults,cloud_backup,cloud_restore,cloud_sync_helper}` | Modified | the 90 s ceiling and `migrate_default` (#282) |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `c1c0d6ddc` |
| `tools/last-good-scripts-test` | Modified | case j2; refuses to run with SIGINT ignored |
| `.claude/rules/{generic-x64-vm-testing,rclone-cloud-sync,es-native-ui}.md` | Modified | the ES log is no longer late; the 90 s numbers; D-UI-093; busybox `pgrep -x` |

## Related Context

- **Tracker**: #236 (the round), #277/#278 (open items, harness gaps), #284/#285/#286, #270, #228, #42.
- **Register**: D-QA-049/050/051, D-WORKFLOW-047/048, D-LAUNCH-004/005, D-UI-091/092/093, D-CLOUD-137/138.
- **Session files**: `/workspace/tmp/rocknix-session/` (chain-8.log, the proof scripts and logs, `proof-283-control/` and `proof-283-final/`, issue-bodies/).
- **Guests**: the pair is down (the rehearsal downs it); guest d at 640x480 on a8175c6193 (:10026, pidfile `/tmp/rocknix-qemu-d.pid`).

## Notes for Next Session

- Every guest-a proof starts from a rebooted carousel, sets RetroArch to GL (`vm_gl`), polls RetroArch with `pgrep -f 'retroarc[h] -L'` (busybox `-x` matches argv), and the one-surface proof seeds the remote and the exit-sync toggle before the reboot.
- Start any signal-trapping suite in the foreground or with `setsid -f`, never as a shell `&` job.
- The QA WebDAV backend refuses a same-name replace of a large file with a 405 (#286); the round trip's small files never hit it.
- The feature worktree `rc-device-fixes` is merged into next; `tools/fork-worktree remove` it when the round closes.

## Open Questions

- The copy and the reboot on the RG35XX SP (each a yes).
- The audit seat: raise the OpenRouter limit, Astra's blind pass first, or another Claude model.
- Words for the `(+)` on the IP ADDRESS row (#279 option 2), if wanted.

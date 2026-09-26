# Saved Session State

> **Saved**: 2026-09-26T02:18:01Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, `release-candidates.md`, D-WORKFLOW-047). The candidate rebuilt with the device round's five fixes, **`a8175c6193`**, is proven on the VM (vm-qa run 41, four proofs, rehearsal run 30, the sign-in window), every known bug is closed, the preflight reads MAY BE CUT, and it is **on the RG35XX SP since 2026-09-26 02:15 UTC** (step 4). The soak (D-QA-036) is the maintainer's; then the call (step 5); then the audit (step 6) through the Facilitator on OpenRouter (D-WORKFLOW-049, both seats probed).

## Completed This Session (2026-09-25/26)

- D-QA-051 (bugs are agent-first); the earlier ten bugs dispositioned; #178 closed on three VM proofs.
- The device round, all closed on VM proofs: #279 (a tunnel is not a link, ES `0cc13be61`), #280 (the launch log one launch's; the rotation reader on the last banner's section), #249 (RetroArch patch 0018 both halves), #282 (the 90 s ceiling with `migrate_default`, D-CLOUD-137), #283 (one floating surface at a time, ES `c1c0d6ddc`, D-UI-093). Register rows D-LAUNCH-004/005, D-UI-092/093, D-CLOUD-137/138, D-WORKFLOW-049. Blindspot 61.
- Records: `x64-all-20260926-a8175c6193`, `h700-all-20260926-a8175c6193` (RECORD.txt with the proofs, the preflight, the Device lines); the intermediates and a65da6c784 marked superseded; catalog 38 cuts; the changelog's cut entry; the QA log row; `docs/qa-frames/2026-09-26/` (#279 four frames, #283 before/after); the device-facts rows.
- Routing: council and audit calls through OpenRouter (#287; the key `~/.config/council/env`, sourced first; both seats probed: `anthropic/claude-fable-5.1`, `openai/gpt-6-astra`).
- Issues in the maintainer's words: #279-#287 (#281 the runaway process, #284 per-backend options, #285 RomM beside the engine with the dedicated-server shape, #286 the QA backend's 405, #287 the routing).
- #236 carries the state through step 4.

## In Progress

- **The soak on the RG35XX SP** (the maintainer's). Nothing runs on the device without a per-action yes (D-QA-011/015); reads are free through the credential filter.
  - **What remains**: after the soak, read the device's journal and the sync stamps (`last-sync-exit`, the ceiling in effect), the rotation records healing (`*.rotation` for Dr. Mario/F-Zero/Aladdin turn to 0 on their next exit), any new observation filed in the maintainer's words; the call on #236 (step 5) with the device facts and the catalog in the same change (D-WORKFLOW-046).

## Next Steps

1. After the soak: the reads above, the call on #236, the device-facts page, `release-catalog --write`.
2. Step 6: resume `docs/audits/2026_09_25-milestone-rc-round-since-258/` (paused at Phase 1.3, uncommitted) with both seats through `council-invoke.ts --provider openrouter` (source `~/.config/council/env` first); Phase 0 records the route and the served models.
3. Steps 7-8: the PR series by content in the named buckets (`fork-workflow.md`, D-WORKFLOW-034), #42's docs PR last; builds for the RG SP and the Retroid Pocket Nova (cold, hours; `tools/build-preflight` first), each staged on its own yes.
4. Harness: promote the proof scripts (`/workspace/tmp/rocknix-session/proof-common.sh`, `proof-279-tunnel.sh` + `net-page.steps`, `proof-280-rotation-log.sh`, `proof-249-auto-slot.sh`, `proof-283-surfaces.sh`) into `tools/` (#278); #286 (the WebDAV 405); #284's backlog measurement on the host backends.
5. `tools/fork-worktree remove ../rocknix.worktrees/rc-device-fixes` once the round closes (merged into next).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0018-auto-slot-survives-content-load.patch` | Created | both halves (#249) |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/runemu.sh` | Modified | truncates the launch log at every launch (#280) |
| `projects/ROCKNIX/packages/network/rclone/sources/{cloud_sync.conf,cloud_sync.conf.defaults,cloud_backup,cloud_restore,cloud_sync_helper}` | Modified | the 90 s ceiling and `migrate_default` (#282) |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `c1c0d6ddc` |
| `tools/last-good-scripts-test` | Modified | case j2; refuses to run with SIGINT ignored |
| `.claude/rules/{generic-x64-vm-testing,rclone-cloud-sync,es-native-ui,release-candidates,adversarial-council}.md` | Modified | the ES log no longer late; the 90 s numbers; D-UI-093; busybox `pgrep -x`; OpenRouter routing |

## Related Context

- **Tracker**: #236 (the round), #277/#278 (open items, harness gaps), #284-#287, #270, #228, #42.
- **Register**: D-QA-049/050/051, D-WORKFLOW-047/048/049, D-LAUNCH-004/005, D-UI-091/092/093, D-CLOUD-137/138.
- **Session files**: `/workspace/tmp/rocknix-session/` (chain-8.log, the proof scripts and logs, `proof-283-control/` and `proof-283-final/`, `probe/`, issue-bodies/).
- **Guests**: the pair is down; guest d at 640x480 on a8175c6193 (:10026, pidfile `/tmp/rocknix-qemu-d.pid`).
- **The maintainer's infrastructure direction** (not fork work): a Vultr bare-metal server with attached block storage as the single master for saves, states and ROMs over SFTP; the NAS a one-way mirror; B2 or Dropbox the off-site copy; RomM beside the engine there later (#285).

## Notes for Next Session

- Every guest-a proof starts from a rebooted carousel, sets RetroArch to GL (`vm_gl`), polls RetroArch with `pgrep -f 'retroarc[h] -L'` (busybox `-x` matches argv); the one-surface proof seeds the remote, the exit-sync toggle and a size-jittered payload before the reboot.
- Start any signal-trapping suite in the foreground or with `setsid -f`, never as a shell `&` job (the suite now refuses).
- The QA WebDAV backend refuses a same-name replace of a large file with a 405 (#286).
- An audit or council pass is a Facilitator call with `--provider openrouter`, never an Agent-tool subagent.

## Open Questions

- Words for the `(+)` on the IP ADDRESS row (#279 option 2), if wanted.
- Whether the audit runs before or after the soak's read is the maintainer's order (after, today).

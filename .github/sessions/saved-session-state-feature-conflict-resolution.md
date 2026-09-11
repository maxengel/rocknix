# Saved Session State

> **Saved**: 2026-09-11T09:40:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). **The seven-issue pass from the `88b82d94a7` cycle**, in the order the maintainer agreed ("Let's knock out all seven of these in the order you outlined"): #121, #122, #126 as one small build; #125; #124; #123 and #127.

Done so far: #121 (`8d2f384d1c` + `79729ba204` unit ordering), #122 (`d0a8fd4203`, closed), #126 (`da451aaabe`) -- built as **`9d035dfd57`** and proven on guest c (`x64-all-20260911-9d035dfd57/guest-c-evidence.md`). #123 (ES `882f0dace`) and #127 (`70ca1c6fb9` + ES `cf89a61ec`) built on the issues' own proposals under discretion (D-UI-038, D-CLOUD-091/092; the maintainer's confirmation is the open half), ES pinned at `4e606be4caf4` (`8c1d23652b`), merged to `next` as `757ca87084`.

## In Progress

- **GENERIC_X64 build of `757ca87084`** running from `rocknix.worktrees/generic-x64` (log `scratchpad/build/x64-labels.log`). It carries #121-#127 minus #124.
- **Agent on guest b (10023): #125** walk tooling (`settle`, `wait-for-change`, walks rewritten, `vm-pair up` wait) on branch `feature/walk-tooling` (worktree `rocknix.worktrees/walk-tooling`). Not merged yet.
- **Agent on guest a (10022): #124** the transfer lock outliving a run -- 100-run reproduction, cause, fix, harness assertion, on `feature/lock-outlives-run` (worktree `rocknix.worktrees/lock-outlives-run`). Not merged yet.
- Guest c (10025, vnc 11, `/tmp/rocknix-qemu-*-c.*`) is on `9d035dfd57` with the QA remote seeded; the stale guest d (`e5ed60f3df`, 8 h) was stopped.

## Next Steps

1. When the two agents report: review, merge `feature/walk-tooling` and `feature/lock-outlives-run` into `next` (harness conflicts possible in `tools/cloud-round-trip` with the #126/#127 steps), rebuild x64 (rclone + image only) and **H700**, then `tools/vm-qa <image>` from a fresh pair (it recreates guests a and b -- only after the agents are done), frames for #123 (WebDAV/S3/SFTP forms at 640x480) and #127 (the near-name dialog), tick/close #121 (VM box), #123, #124, #125, #126, #127.
2. QA log row(s) for `9d035dfd57` and the final image; work log; session state; push `next`.
3. **Ask the maintainer** (in the report, not blocking): the #123 words, the #127 dialog/button order and root-level rule -- reversals are one-line edits + a register row.
4. Staging is the maintainer's call, per device (D-QA-008/011); both handhelds were still on `7eb713bbd9`, offline.
5. Then: #120 boxes 3/5/6, #115 last box, #113, #107's two boxes, #42, the older cloud backlog (#47, #75, #45, #50, #33, #34, #12, #14, #43, #51, #54, #55, #29, #7, #93, #27, #79, #88, #102).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/sysutils/powerstate/sources/powerstate.sh` | numeric guard around the battery block; first battery | #121 |
| `projects/ROCKNIX/packages/sysutils/powerstate/system.d/powerstate.service` | `After=userconfig.service` | #121 first-boot awk noise |
| `projects/ROCKNIX/packages/sysutils/systemd/config/sysctl.d/rocknix.conf` | `vm.laptop_mode=5` removed | #122 |
| `projects/ROCKNIX/packages/rocknix/sources/post-update` | deletes `vm.laptop_mode` from the owner's sysctl.d copy | #122 upgrade half |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` | `SETTINGS_OUTCOME`/`SAVES_OUTCOME` summary words; no stamp for a nothing-to-send settings run | #126 |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore` | `near_names` (awk Levenshtein), root-level parent, offer line `create-saves-folder\|<missing>[\|<near>]` | #127 |
| `tools/cloud-round-trip` | #126 step; #127 three checks in the empty-cloud step | |
| `tools/fork-worktree` | sync restores the build's generated doc before the dirty check | blocked two syncs today |
| ES `CloudText.{h,cpp}`, `CloudTextTests.cpp` | `fieldLabel`, `ProtocolLine::args` | #123 #127; 20 cases / 207 assertions |
| ES `GuiMenu.{h,cpp}`, `ThreadedCloudSync.{h,cpp}` | labels via `fieldLabel`; `openCloudFolderEditor`; three-button near-name dialog | |
| `docs/decision-register.md` | D-CLOUD-090/091/092, D-SYS-007/008, D-UI-038 | |
| `docs/cloud-sync-changelog.md`, `docs/work-logs/.../2026_09_11-work_log.md` | two sections; two entries | |

## Related Context

- Standing rules: D-QA-007 (VM first), D-QA-008/011 (ask per device before staging/reboot), D-QA-009, D-QA-012 (quote the maintainer on every out-of-band request -- done on #121-#127), filter `key|password|token|username|psk` on device output, `gh --repo maxengel/rocknix`, `git -C` for the primary checkout, agents told to wait synchronously and use opus.
- `fork-worktree sync` refuses a dirty build worktree; the build itself dirties `documentation/*/SUPPORTED_EMULATORS_AND_CORES.md`. Fixed in the tool (`5409b5b96c`); until a build has run with it, check `git status` in the build worktrees before trusting a sync line.
- Build: from `rocknix.worktrees/generic-x64`, `make docker-GENERIC_X64` with `DOCKER_EXTRA_OPTS` mounting the primary `.git` and `/workspace/cache/rocknix-sources`. A guest by hand: gunzip + `qemu-img convert` + `generic-x64-vm run --headless --daemonize` with its own monitor/serial/pidfile/vnc/ssh-port/mac (guest c recipe in this session).

## Notes for Next Session

- `busybox sed` does not take `\x1b`; strip colour with `tr -d '\033' | sed 's/\[[0-9;]*m//g'` when reading a script's WARN/ERROR lines over ssh.
- `scp` takes `-P` for the port; `-p` is preserve-times and silently makes the port a filename.
- The harness's vocabulary gate applies to the LINK re-runs and refusals (`args.vocabulary`), not to the summary lines; the summary words are asserted by their own steps.

## Open Questions

- #123 words, #127 dialog/button order and root rule: the maintainer's confirmation (built under discretion).
- #121 handheld box, #104 ramoops proof, #117 first-SIGTERM, #113: device-gated, waiting on a handheld being online and the maintainer's yes.

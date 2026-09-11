# Saved Session State

> **Saved**: 2026-09-11T11:20:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). **The seven-issue pass from the `88b82d94a7` cycle**, in the maintainer's order: #121, #122, #126 as one small build; #125; #124; #123 and #127.

State: **six of seven are merged on `next` and built as `af2db4ab09` (x64 + H700)**; #125 (walk tooling) is still with its agent on guest b. #128 (S3 subtitle paragraph) was found while framing and is fixed and closed in the same image. #122 and #128 closed; #121 (VM box), #123, #124, #126, #127 ticked as far as proven, left open for the runner (`tools/vm-qa`) and, for #123/#127, the maintainer's confirmation of the words (D-UI-038, D-CLOUD-091/092).

Images: `9d035dfd57` (#121 #122 #126), `757ca87084` (+#123 #127 +unit ordering), `af2db4ab09` (+#124 +#128), each under `/workspace/artifacts/rocknix-images/x64-all-20260911-<id>/`; H700 `h700-all-20260911-af2db4ab09/` (tar sha `29b86dd598389f2c...`). Guest c (10025, 640x480) was upgraded in place `757ca87084` -> `af2db4ab09` through `.update`: post-update removed a planted `vm.laptop_mode`, the boot after has 0 laptop_mode and 1 powerstate line. Frames for #123, #127, #128 under the images' `shots/640x480/`.

## In Progress

- **Agent on guest b (10023): #125** -- `feature/walk-tooling` (worktree `rocknix.worktrees/walk-tooling`), not merged. Started ~09:00 UTC.
- Guests: a (10022) left clean by the #124 agent; c on `af2db4ab09` at the carousel with the QA remote seeded and `/ROCKNIX/Saves`.

## Next Steps

1. When the #125 agent reports: review, merge `feature/walk-tooling` into `next` (tools only -- no rebuild needed unless it touched packages), then `tools/vm-qa /workspace/artifacts/rocknix-images/x64-all-20260911-af2db4ab09/ROCKNIX-GENERIC_X64.x86_64-20260911.img.gz` from a fresh pair (it recreates guests a and b). Expect the new steps: #126 skipped-phase words, #127 three offer checks, #124 lock assertions.
2. Tick the runner-gated boxes (#126, #127 root-level, #124) and close #121 (VM half; the handheld box stays), #124, #125, #126; #123/#127 close on the maintainer's word.
3. QA log row for `af2db4ab09`; work log; session state; push `next`.
4. Report to the maintainer with the two confirmations (#123 words; #127 dialog/buttons and root rule) and the staging question for `af2db4ab09` (both handhelds were offline on `7eb713bbd9`; per-device yes, D-QA-008/011).
5. Then: #120 boxes 3/5/6, #115 last box, #113, #107's two boxes, #42, the older cloud backlog.

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
| rclone scripts (`65d7cf6c24`, agent) | lock fd closed for children (`main 9>&-`, brace groups), 1 s retry before the refusal | #124, D-CLOUD-093 (renumbered from the agent's 090) |
| ES `CloudText::providerSubtitle` (`229f50ad4`) | a paragraph subtitle becomes the provider's label | #128 |
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

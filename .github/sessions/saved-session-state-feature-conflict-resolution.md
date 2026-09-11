# Saved Session State

> **Saved**: 2026-09-11T23:10:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). The seven-issue pass is done and on the RG35XX SP (`af2db4ab09`, applied on the maintainer's yes). The evening then turned on **process and design**: the device rule (D-QA-015, blindspot 38, `docs/device-testing-policy.md`, `vm-first.md`), the QA cloud matrix (#133, D-QA-017), and the **save-history epic #134** -- one hidden store `Saves/.history/` for the earlier versions of a player's saves (D-CLOUD-095..100) -- which went through a full **council run** (`research/council-runs/2026-09-11-save-history-one-home/`, committed `bfbbc31772`): store-first won 3-2, the consensus round integrated the dissent under the maintainer's steer (time to play, bandwidth, round trips; sync no longer than it must; sanctity the floor), and Step 5 produced tracker text for #134, #22, #23, #25 and two new children. **Nothing from it is applied or built yet**; the maintainer reads `final-issue-draft.md` and settles the thirteen proposals (D-CLOUD-101, open).

## In Progress

- Nothing running. Guests a, b (fresh pair) and c on `af2db4ab09`. RG35XX SP on `af2db4ab09`, clean (the QA files removed on the maintainer's yes; one older set-aside folder of theirs was pruned by the script during the test and is restorable from Dropbox's deleted files -- #130).

## Next Steps

1. **The maintainer reads `final-issue-draft.md`** and answers the P-1..P-13 proposals (the draft's closing section lists what still needs their word). Then apply the tracker text to #134/#22/#23/#25, open the two children (the guard image; the fold), and register the settled rows.
2. **#133** the QA cloud matrix (self-hosted WebDAV/S3/SFTP/SMB/FTP on the VM host; hosted non-Dropbox accounts) -- endorsed as next before the audit.
3. **#129** the code audit (code-auditor methodology).
4. #135 time-to-play cell in the runner; #131 the QA handheld (future).
5. Standing: D-QA-015 -- nothing on a person's device or cloud without a per-action yes; `vm-first.md` -- the VM question in writing before any test.

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
| `tools/vm-qa` (`fcb632d403`, `07977a7910`) | `ensure_remote` / `ensure_fixture` before the walks | the fresh-pair fixture gap |
| `tools/cloud-round-trip` (`45a0d7cb6a`) | empty-endpoint restore: truthful empty (0 + offer) or own code, never a sentinel or bare 0 | D-CLOUD-092 |
| walks tooling (agent, `5650fa8686`..`2e1e2a0bfa`) | `settle`, `wait-for-change`, `wake`, `dismiss-dialogs`; walks rewritten; `suite.txt`; `vm-pair up` waits | #125, D-QA-013/014 |
| ES `CloudText.{h,cpp}`, `CloudTextTests.cpp` | `fieldLabel`, `ProtocolLine::args` | #123 #127; 20 cases / 207 assertions |
| ES `GuiMenu.{h,cpp}`, `ThreadedCloudSync.{h,cpp}` | labels via `fieldLabel`; `openCloudFolderEditor`; three-button near-name dialog | |
| `docs/decision-register.md` | D-CLOUD-090/091/092, D-SYS-007/008, D-UI-038 | |
| `docs/cloud-sync-changelog.md`, `docs/work-logs/.../2026_09_11-work_log.md` | two sections; two entries | |

## Related Context

- Standing rules: D-QA-007 (VM first), D-QA-008/011 (ask per device before staging/reboot), D-QA-009, D-QA-012 (quote the maintainer on every out-of-band request -- done on #121-#127), filter `key|password|token|username|psk` on device output, `gh --repo maxengel/rocknix`, `git -C` for the primary checkout, agents told to wait synchronously and use opus.
- `fork-worktree sync` refuses a dirty build worktree; the build itself dirties `documentation/*/SUPPORTED_EMULATORS_AND_CORES.md`. Fixed in the tool (`5409b5b96c`); until a build has run with it, check `git status` in the build worktrees before trusting a sync line.
- Build: from `rocknix.worktrees/generic-x64`, `make docker-GENERIC_X64` with `DOCKER_EXTRA_OPTS` mounting the primary `.git` and `/workspace/cache/rocknix-sources`. A guest by hand: gunzip + `qemu-img convert` + `generic-x64-vm run --headless --daemonize` with its own monitor/serial/pidfile/vnc/ssh-port/mac (guest c recipe in this session).

## Notes for Next Session

- The runner's walks need a remote AND device ROMs on the guest; the round-trip suite leaves a fresh pair with neither. `vm-qa` seeds both now; if a walk stops at a dialog, read its `NN-stuck-*.png` before blaming the image.
- `pgrep -f '<literal>'` matches the `bash -c` wrapper of the command that carries the literal further down (even with the bracket trick); check a process by name (`pgrep -x make -a | grep docker-`). `docker ps` NAMES are random; grep the IMAGE column.
- `busybox sed` does not take `\x1b`; strip colour with `tr -d '\033' | sed 's/\[[0-9;]*m//g'` when reading a script's WARN/ERROR lines over ssh.
- `scp` takes `-P` for the port; `-p` is preserve-times and silently makes the port a filename.
- The harness's vocabulary gate applies to the LINK re-runs and refusals (`args.vocabulary`), not to the summary lines; the summary words are asserted by their own steps.

## Open Questions

- #123 words, #127 dialog/button order and root rule: the maintainer's confirmation (built under discretion).
- #121 handheld box, #104 ramoops proof, #117 first-SIGTERM, #113: device-gated, waiting on a handheld being online and the maintainer's yes.

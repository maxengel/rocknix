# Saved Session State

> **Saved**: 2026-09-12T02:45:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). **The save-history design is closed out into the tracker** (maintainer, 2026-09-12: "let's get all of this into our issues and create new ones where necessary so we can close out all of this work before we move on to the conflict resolution work"). The council's consensus (store-first, 3-2) was amended by hand under the maintainer's later rulings -- one console at a time (D-CLOUD-102), no lock and serial play assumed by the wizard (D-CLOUD-103), columns as the source with the cursor on the newer version (D-CLOUD-104) -- to **retain-only, retained from the console's own stage** (+1 spawn, +S up per changed save, no download). Applied: #134 rewritten (title, design, build order, E1-E15, time to play as a gate, the maintainer's open list, acceptance); #22 R1-R11; #23, #25, #21, #135; children **#136** (guard image: allowlist first rules, `--delete-excluded`/`--backup-dir` audit, rules-file upgrade) and **#137** (the fold of today's set-aside folders) attached under #134, which sits under #11 with the milestone. Bodies kept under `research/council-runs/2026-09-11-save-history-one-home/applied/`.

Also closed this stretch: #130 (device review; remaining device items moved to #131/#133), #125, #126, #124, #128, #122, #117, #132 (folded).

## In Progress

- Nothing running. Guests a, b, c on `af2db4ab09`. RG35XX SP on `af2db4ab09`, clean. No device or cloud action without a per-action yes (D-QA-015); the VM question in writing first (`vm-first.md`).

## Next Steps

1. **The maintainer's nine open items on #134** ("Decisions still the maintainer's": P-1 fleet-wide setting and what OFF means; P-2 protections order and count range 1-9 vs 3-5; P-3 copy+verify vs move; P-6 the exit path's one bounded fetch; P-10 the heal's words; P-11 the two labels; P-12 the mixed-fleet residual; P-13 the budget after E12; P-4/7/8/9 confirm). Each answer becomes a register row (D-CLOUD-101 is the parking row).
2. **#123 and #127**: all boxes ticked; open only for the maintainer's word on the words/dialog (D-UI-038, D-CLOUD-091/092) -- close on a yes.
3. **#133** the QA cloud matrix (endorsed as next), then **#129** the code audit; then the conflict-resolution build in #134's order (#136 → #137 → #21 → #22 → #23 → #25), with #135's cell before the budget row.
4. Docs still pending on their triggers: `docs/save-manifest-schema.md` rev 3 (`history_keep`, after P-1); `.claude/rules/rclone-cloud-sync.md` budget section (after E12); the public cloud-sync page (#42, with #136/#137); `upgrade-and-install.md` fold paragraph (#137).

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

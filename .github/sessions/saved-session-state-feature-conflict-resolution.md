# Saved Session State

> **Saved**: 2026-09-12T15:15:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). Tonight (2026-09-12): #140, #133, #135, #129 delivered; the audit's three high findings fixed and closed; #123 closed; D-UI-045. **Then the maintainer's calls, built:** FINISH RESTORE PROCESS (D-UI-046); the automatic sync's bounds (D-CLOUD-118/119: `--automatic` on the startup and exit syncs, `RCLONE_SYNC_NET_OPTS` + `SYNC_CEILING_SECONDS`, the rclone() wrapper under `timeout`; stall 321 s -> 21 s, portal 0.9 s, refused 12 s with ten retries -- five retries + `--transfers 1` gives 3.9 s, proposed to the maintainer, Dropbox-gated); listings retry three times (#143 closed; S3's SDK attempts ARE `--low-level-retries`, 230 s at ten); buckets: a folder exists when its parent lists it, `directory_markers` on in the wizard's S3 stanza (#141 closed; D-CLOUD-120, the maintainer's marker idea approved). **The RG SP's log found the readiness defect**: `cloud_net_ready` waited for NetworkManager's "full" and gave up at 60 s while the device had internet; now any connected state settles on a held route (`86a28bab78`). `next` = `eda17b076a`; the tree to build is `c7fba3b8e6`.

## In Progress

- **Runner on `34606305a1`** (conditional wrapper; scripts, lifetime, round-trip 149 s, exit, time-to-play PASS; walks running) -- report `qa-34606305a1-webdav-a-20260912-1456`. `205b80c8cf` passed five suites and failed the round trip only on the always-on wrapper shadowing the harness's lock probe.
- **To build next:** x64 and H700 at `c7fba3b8e6` (parent-listing rule, directory markers, S3 reset fix, budget check) -- the final tree for tonight; runner on it; QA-log rows for 205b80c8cf / 34606305a1 / c7fba3b8e6.
- Guests a, b (pair) on `34606305a1`; guest c on `205b80c8cf`, WebDAV, `/tmp/qa-bin` holds the staged scripts (identical to c7fba3b8e6's). SFTP (9013) and S3 (9012) backends up on the host. RG35XX SP `af2db4ab09` healthy; RG SP `7eb713bbd9` at 192.168.1.177 (ssh config says .175), healthy apart from the readiness defect; both hold the same ten saves. Nothing staged on either.

## Next Steps

1. Runner done -> build x64 `c7fba3b8e6` (both mounts) -> runner (six suites) -> H700 at the same commit (`build/devices` checkout -B) -> file, strings check -> QA-log rows, work log, session state -> report to the maintainer with the staging question for BOTH handhelds (per device; the RG SP first, it is the one that failed).
2. The maintainer's remaining calls: five retries + `--transfers 1` for the automatic sync (Dropbox proof on a handheld, with their yes); #127 texts (the short form is in the build); audit PL-08 (D-INFRA-008 renumber); PL-06 (#139); `GuiMenu:4911` BRING DATA BACK; the `rgsp` ssh alias IP.
3. Then #134's build order: #136 -> #137 -> #21 -> #22 -> #23 -> #25 -> #139.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| rclone `cloud_backup`/`cloud_restore` (`4484eed012`, `34606305a1`) | `--automatic`: rclone() wrapper under `timeout`, `RCLONE_SYNC_NET_OPTS`, `SYNC_CEILING_SECONDS`, why_for 10/124; `RCLONE_LIST_OPTS` three retries | D-CLOUD-118, #143 |
| rclone `cloud_restore` (`50b53b016f`) | `bucket_based`, `bucket_dir_listed`: a bucket folder exists when its parent lists it | #141, D-CLOUD-120 |
| rclone `cloud_remote` (`0a72907787`) | `directory_markers=true` on s3/gcs/azureblob remotes it creates | D-CLOUD-120 |
| rclone `cloud_net_ready` (`86a28bab78`) | any connected state settles on a held route | the RG SP's log |
| rclone `cloud_content_restore` | listings on `RCLONE_LIST_OPTS` | #143 |
| `cloud_sync.conf(.defaults)` | `RCLONE_SYNC_NET_OPTS`, `SYNC_CEILING_SECONDS` | |
| `tools/last-good-scripts-test` cases h, i | the wrapper's ceiling; the readiness shims | |
| `tools/cloud-test-backend` (`26affac4b0`, `0a72907787`) | `caps` bucket=; S3 reset via aws; S3 stanza with markers | |
| `tools/cloud-round-trip` (`34606305a1`, `50b53b016f`) | file fixtures for the empty-cloud step | |
| `tools/time-to-play` (`b391d2172d`) | `over_budget`: the exit sync over 3 s fails | D-CLOUD-119 |
| ES `FileData.cpp`, `main.cpp`, `GuiMenu.cpp` (`88cb4545b`) | `--automatic`; FINISH RESTORE PROCESS | D-UI-046 |
| ES `CloudOffer.{h,cpp}`, `CloudText.{h,cpp}`, `GuiCloudTransfer.cpp`, `ThreadedCloudSync.cpp` (`1b3d94d0d`) | one `>>> ` parser (Unit/Removed), the offer dialog shared, raised by the page on dismissal | #145 |
| ES `GuiMenu.cpp`, `GuiCloudTransfer.cpp` (`db1005101`), `CloudOffer.cpp` (`35618d447`) | strings name real rows; two-level menu path; WI-FI GPIO; short-form dialogs | PL-04/PL-12, D-UI-045 |
| ES `tests/cloud-oauth-lifetime.py` (`317028769`) | doubles gain `name` + `CloudText::providerSubtitle` | #144 |
| rclone `cloud_backup/restore/content_*` (`59b64f85ce`), `tools/last-good-scripts-test` case g | fallback retries 10; the check | #146 |
| `tools/vm-qa` (`01789120f4`) | `lifetime` suite, fail-closed | #144 |
| `tools/pkgcheck` (`81221658b3`) | exits non-zero on FAIL | audit F-08 |
| `tools/fork-worktree` (`80fc560c3a`) | git reads anchored on its own repo | |
| `tools/time-to-play` (`da2c2a2bbc`, `a8f8ef487d`) | `--vm` driver swap; `headline_missing`; settings before the boot; `reboot_guest` | #135, blindspot 39 |
| `tools/cloud-test-backend`, `cloud-round-trip`, `vm-qa` (agent, `a695ba6514`..`fbb3a1f156`) | five backends behind `--backend` | #133 |
| `docs/audits/2026_09_12-milestone-cloud-saves-since-60/` | the audit | #129 |
| `docs/blindspot-register.md` 39; `docs/decision-register.md` D-UI-045, D-QA-018..020 | | |
| ES `CloudText.{h,cpp}` (`1a866ca22`) | `rcloneUnits`, `parseBytes`, `sizeLabel`, `roundSizes` moved in; `liveLine` parser | #140; 29 cases / 280 assertions |
| ES `ThreadedCloudSync.cpp` | card renders `liveLine` facts: `%s OF %s`, NOTHING SENT/RECEIVED/SYNCED YET, `COMPARING SAVES · %d OF %d`; count line no longer drives words or bar | #140 |
| ES `GuiCloudTransfer.cpp` | the three size statics delegate to CloudText | #140 |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` (`a2ee7b9bb2`) | pin `f93acc2a6` | |
| `.claude/rules/player-language.md`, `es-native-ui.md` pointer | D-UI-045 | |
| `.claude/rules/generic-x64-vm-testing.md` | x64 build needs the sources mount too | first build died on it |
| `docs/device-testing-policy.md` | the read filter `key|pass|token|user|psk` | `pass =` slipped a `password` filter |
| `docs/qa-frames/2026-09-12/` | three exit-card frames + README | #140 |
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

- Standing rules: D-QA-007 (VM first), D-QA-008/011 (ask per device before staging/reboot), D-QA-009, D-QA-012 (quote the maintainer on every out-of-band request -- done on #121-#127), filter `grep -v -i -E 'key|pass|token|user|psk'` on any device or guest config output, `gh --repo maxengel/rocknix`, `git -C` for the primary checkout, agents told to wait synchronously and use opus.
- `fork-worktree sync` refuses a dirty build worktree; the build itself dirties `documentation/*/SUPPORTED_EMULATORS_AND_CORES.md`. Fixed in the tool (`5409b5b96c`); until a build has run with it, check `git status` in the build worktrees before trusting a sync line.
- Build: from `rocknix.worktrees/generic-x64`, `make docker-GENERIC_X64` with `DOCKER_EXTRA_OPTS` mounting the primary `.git` and `/workspace/cache/rocknix-sources`. A guest by hand: gunzip + `qemu-img convert` + `generic-x64-vm run --headless --daemonize` with its own monitor/serial/pidfile/vnc/ssh-port/mac (guest c recipe in this session).

## Notes for Next Session

- Launch a game on a guest through EmulationStation's own path without a key walk: `curl -X POST -H 'Content-Type: text/plain' --data /storage/roms/nes/Probe.nes http://127.0.0.1:1234/launch` from inside the guest (`HttpServerThread`, bound to 127.0.0.1) -- it is `ViewController::launch`, so the exit sync runs as after A on the game. `frame-exit-card.sh` in the session scratchpad does launch, `execute_kill`, half-second frames.
- rclone `--progress` into a pipe ends each stats block with no newline; the next block's `Transferred:` glues onto the previous last line. Any reader of that stream splits on the marker (the transfer page always did; the card does since #140).
- The x64 build worktree's `sources/` is a root-owned mount point: always mount `/workspace/cache/rocknix-sources` onto it (rule fixed).
- The runner's walks need a remote AND device ROMs on the guest; the round-trip suite leaves a fresh pair with neither. `vm-qa` seeds both now; if a walk stops at a dialog, read its `NN-stuck-*.png` before blaming the image.
- `pgrep -f '<literal>'` matches the `bash -c` wrapper of the command that carries the literal further down (even with the bracket trick); check a process by name (`pgrep -x make -a | grep docker-`). `docker ps` NAMES are random; grep the IMAGE column.
- `busybox sed` does not take `\x1b`; strip colour with `tr -d '\033' | sed 's/\[[0-9;]*m//g'` when reading a script's WARN/ERROR lines over ssh.
- `scp` takes `-P` for the port; `-p` is preserve-times and silently makes the port a filename.
- The harness's vocabulary gate applies to the LINK re-runs and refusals (`args.vocabulary`), not to the summary lines; the summary words are asserted by their own steps.

## Open Questions

- #127 dialog texts, offered in the short form (D-UI-045): the maintainer's words. #123 done (D-UI-044).
- #121 handheld box, #104 ramoops proof, #117 first-SIGTERM, #113: device-gated, waiting on a handheld being online and the maintainer's yes.

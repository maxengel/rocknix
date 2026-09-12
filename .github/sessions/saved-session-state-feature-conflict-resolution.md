# Saved Session State

> **Saved**: 2026-09-12T13:05:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). The nine save-history decisions are settled (D-CLOUD-105..117, D-UI-040..043); everything is in the tracker (#134 and children). **Tonight (2026-09-12): #140 fixed and closed; #133 the five-backend QA matrix merged (found #141/#142/#143); #135 the time-to-play cell merged and measured (proposed rows on the issue); #129 the milestone audit merged, its three high findings (#144/#145/#146) fixed and closed the same night; #123 closed on the maintainer's word; D-UI-045 (clear, brief, sized to the space) as a rule.** Latest image **`0f89c8f1d4`** (ES `51639dd09`): six runner suites PASS (time-to-play on guest b after the cell's own precondition fix `a8f8ef487d`); frames in `docs/qa-frames/2026-09-12/`. `next` is at `e18c567f82`.

## In Progress

- Nothing running. **H700 `0f89c8f1d4` built** (`h700-all-20260912-0f89c8f1d4/`, tar `4e6a5649db47e466...`, BUILD_ID checked, strings checked, fallback constant 10); **not staged** -- the maintainer's per-device yes (D-QA-015). Build worktrees synced to `next` `e18c567f82`.
- Guests a (Probe.nes, gl, gameexit=1), b, c on `0f89c8f1d4`; guest c on WebDAV, gameexit=1. RG35XX SP on `af2db4ab09`, clean. Older H700 `a2ee7b9bb2` superseded.

## Next Steps

1. Report to the maintainer (done at the end of this session); wait for their calls below.
2. The maintainer's calls, all put to them in player terms: #127 texts (the short form is in the build; theirs replaces it); #135's proposed rows (P-13 3 s; D-CLOUD-111 connect 5 s / stall 5 s with one retry / ceiling 20 s; D-CLOUD-112 within 3x online) and the two findings (stall behind the screensaver; IPv6 default route counts as connectivity); audit PL-05 (one name for the relink page), PL-08 (D-INFRA-008 renumber); #141/#142/#143 behaviour on remotes without "a folder that does not exist yet"; `GuiMenu:4911` BRING DATA BACK under D-UI-045; staging `0f89c8f1d4` H700 on the RG35XX SP.
3. Rule text from the audit's proposals once read: P-01 change the set not the site; P-02 a mechanical check for strings naming rows; P-03 a check nothing invokes is not a guard. Blindspot 39 is written.
4. Then #134's build order: #136 -> #137 -> #21 -> #22 -> #23 -> #25 -> #139, with the bounds (D-CLOUD-111) as the first small piece once the rows are decided.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
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

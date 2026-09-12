# Saved Session State

> **Saved**: 2026-09-12T09:40:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). **The nine save-history decisions are all settled with the maintainer, one at a time** (D-CLOUD-105..108, 114..117, D-UI-043; plus the rulings raised on the way: D-CLOUD-109 a launch waits for a bounded sync, 110 the stage is one cache, 111 the bound watches progress, 112 the offline benchmark, 113 two transfer contracts; D-UI-040 the exit card says syncing (#138), D-UI-041 the offline reminder (#139), D-UI-042 least surprise as a rule file). Everything is in the tracker: #134 (all P-items ticked), #22, #23, #25, #21, #135, #136, #137, #139. `Saves-replaced` design docs superseded; wizard IA rev 6; menu map current.

**`a2ee7b9bb2` (ES `f93acc2a6`, #140 the exit card's live line in the player's words) is built for x64, its binary checked for the six new strings, and framed on guest c: NOTHING SENT YET against the dead port, COMPLETED against the live endpoint (`docs/qa-frames/2026-09-12/`).** **#140 closed**: `tools/vm-qa` passed all four suites on a fresh pair (`qa-a2ee7b9bb2-webdav-a-20260912-0646`). H700 `a2ee7b9bb2` built (tar `cbddc951af027b14...`, strings checked), **not staged**. **#133 merged** (`ac2db6c113`): five backends (webdav 9010, s3 9012, sftp 9013, smb 9014, ftp 9015), `--backend` on the three tools, D-QA-018/019/020; it found #141 (a wrong saves folder reports COMPLETED on a bucket), #142 (FTP: missing dir reads as broken cloud; `--retries 1` lost a file), #143 (a refused S3 endpoint outlives every timeout). Hosted-provider box open on accounts. The maintainer approved #123 (D-UI-044, closed) and set a standing rule for every player-facing string -- clear, brief, sized to the space (D-UI-045, `.claude/rules/player-language.md`).

## In Progress

- **#135 merged** (`e1ddfd7ec2`): `tools/time-to-play`, the `time-to-play` suite in `vm-qa` (default, `--quick`), three QA-log columns. Measured on a quiet host, guest c: UI to game 0.63 s (identical on sftp/webdav/s3); exit sync 1.30 s webdav / 1.43 s sftp / 0.79 s s3; game to game 1.01 s (a launch cancels the sync today, 10/10); startup sync 37 s from reboot on sftp; offline: no route 0.5 s, portal 0.9 s, **refused port 12 s, stalled endpoint 321 s** (30 s timeout x 10 low-level retries; no `--max-duration`; `--contimeout` never fired); the stall's outcome lands behind the screensaver at 300 s. Found: `has_default_route` counts an IPv6 default. **Proposals on #135** (comment 5644731807): P-13 3 s; D-CLOUD-111 connect 5 s, stall 5 s with `--low-level-retries 1`, ceiling `--max-duration 20s`; D-CLOUD-112 within 3x online (~5 s). Awaiting the maintainer.
- **Running:** `vm-qa --skip-up --only time-to-play` on the pair (proves the runner's dispatch, which the agent could not); the **#129 audit** as a subagent (opus) in `rocknix.worktrees/audit-129` on `audit/129`, milestone tier, scope `next@e1ddfd7ec2` + ES `f93acc2a6`, host-only evidence, read-only ssh to guest c at most.
- Guests a, b on `a2ee7b9bb2` (pair); guest c on `a2ee7b9bb2`, WebDAV stanza restored, gameexit=1. RG35XX SP on `af2db4ab09`, clean; H700 `a2ee7b9bb2` built, not staged (D-QA-015).

## Next Steps

1. When the suite run reports: tick #135's first AC if the runner's report carries the numbers; when the audit reports: review its findings, merge `audit/129` into `next`, put the punch list's decisions to the maintainer.
2. The maintainer's calls: #127 texts (short form); #135's proposed rows (P-13, D-CLOUD-111/112) and the two findings (stall behind the screensaver; IPv6 default route); #141/#142/#143 behaviour on remotes without "a folder that does not exist yet"; staging `a2ee7b9bb2` H700 on the RG35XX SP.
3. Then #134's build order: #136 -> #137 -> #21 -> #22 -> #23 -> #25 -> #139, with the bounds (D-CLOUD-111) implemented in the scripts as the first small piece once the rows are decided.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
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

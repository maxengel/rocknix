# Saved Session State

> **Saved**: 2026-09-13T06:15:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). Tonight (2026-09-12): #140, #133, #135, #129 delivered; the audit's three high findings fixed and closed; #123 closed; D-UI-045. **Then the maintainer's calls, built:** FINISH RESTORE PROCESS (D-UI-046); the automatic sync's bounds (D-CLOUD-118/119: `--automatic` on the startup and exit syncs, `RCLONE_SYNC_NET_OPTS` + `SYNC_CEILING_SECONDS`, the rclone() wrapper under `timeout`; stall 321 s -> 21 s, portal 0.9 s, refused 12 s with ten retries -- five retries + `--transfers 1` gives 3.9 s, proposed to the maintainer, Dropbox-gated); listings retry three times (#143 closed; S3's SDK attempts ARE `--low-level-retries`, 230 s at ten); buckets: a folder exists when its parent lists it, `directory_markers` on in the wizard's S3 stanza (#141 closed; D-CLOUD-120, the maintainer's marker idea approved). **The RG SP's log found the readiness defect**: `cloud_net_ready` waited for NetworkManager's "full" and gave up at 60 s while the device had internet; now any connected state settles on a held route (`86a28bab78`). **Staging candidate for both handhelds: `ec12767b26`** (x64 and H700, all seven runner suites PASS -- `qa-ec12767b26-webdav-a-20260912-2132` + `-2136`; H700 tar `701f725cd10467f8...`); carries #148's aligned words (D-UI-049), the #127 texts (D-UI-047), the five-retry baseline (D-CLOUD-121), the RG SP readiness fix, buckets/markers (D-CLOUD-120), the bounded automatic sync (D-CLOUD-118); not staged. #127, #148, #147 closed. Rules reshaped: 24 rule files, `es-ui-style-guide.md` a rule, `es-native-ui.md` split into `es-native-ui.md` / `es-player-text.md` / `es-code-traps.md`, front-matter standard + index (D-WORKFLOW-007..009); open: D-WORKFLOW-010 (rules in the ES repo?). `tools/vocabulary-check` checks back up / backup, save state, Wi-Fi as the runner's `vocabulary` suite. `next` = `115c444901` + the D-WORKFLOW-010 row. **2026-09-13, 00:00-00:20: #45 delivered** (`4fae9fe2e4`, D-CLOUD-008 settled from the open list): the settings archive leaves out anything byte-identical to `/usr/config` and PPSSPP's `assets/` + `PSP/SYSTEM/CACHE/` always; the tar restore skips those two prefixes from any archive; Cheats follow the identity rule. Guest c: 17,317,741 B/187 asset entries -> 9,218 B/16 entries, `ppsspp.ini` byte-identical, an old archive's assets not put back. `last-good-scripts-test` case k (8 checks; 4 fail against `53f390b1e9`). Five of six #45 boxes ticked; the hardware box waits for a build carrying it. **2026-09-13, 00:20-03:55:** #142 delivered and closed (`6c13475947`, D-CLOUD-123: a missing cloud folder is judged by its nearest listable parent; content backup mkdirs first; FTP cells 90/99 -> 100/100; case l). #129 closed: PL-08 re-keyed on the maintainer's call (D-WORKFLOW-013: D-INFRA-008 (2026-09-11) -> D-INFRA-010; `tools/register-check` guards duplicate IDs and dangling citations; D-CLOUD-007 held). #50 delivered (D-NET-002, `d857ba04c9`: the shipped family name becomes `<FAMILY>-<4 hex of the unit id>` once; case m) plus the hostnamed race (`af9295025a`: network-base.service Before= hostnamed and NetworkManager, no `hostnamectl --transient`); D-NET-003 open (mDNS). #93 and #47 closed by frames; #82's VM half ticked (handheld box open). #27 first cut (`c7838165b`) FAILED at 640x480 -- Font::getHeight grows as glyphs load; second cut ES `2088eadb9` (warm the font, `multiLine` on the grid tile text, sheet 0.55, cap 0.50) pinned by `02f368914e`. Blindspot 40 (vm-qa SSHO inherited). `next` = `02f368914e`+docs. Images: `878ec8863b` (all suites PASS but pair-identity, a tool bug); **`02f368914e` built 01:45, runner on it now** (carries #45, #142, #50 + hostnamed fix, #27 v2, uncached marker, ES register comment). Guest d (640x480, ssh :10026, monitor /tmp/rocknix-qemu-monitor-d.sock, rebuilt by `scratchpad/rebuild-d.sh`). **#27 took four cuts** (D-UI-050; the cause: the tile font was scaled twice on a small panel -- `Font::get` scales by 1.31 under 720 px and the menu font was already menu-scaled; `es-code-traps.md` § Three things a font is not) and is **closed** with frames at 640x480 and 1280x800 on **`db6b42c180`** (ES `79fe10878`); **#149** (no help bar under the manager on small panels) filed and closed in the same cut. Runner on `02f368914e`: **8/8 PASS**; runner on `db6b42c180` started 02:09 host. LINK5's re-run for #113 still to do (`vm-qa --skip-up --only link` on the pair once the runner is done). H700 of `db6b42c180` is the next staging candidate.

## In Progress

- **Next on the list:** the runner's report on `db6b42c180` (all suites; pair-identity passed at 02:09); LINK5 alone on the pair (`vm-qa --skip-up --only link`) for #113's VM box; H700 build of `db6b42c180` as the staging candidate replacing `ec12767b26` (`devices/build-dev.sh H700`); vm-qa-log rows for `878ec8863b`, `02f368914e`, `db6b42c180`; then #66/#68/#121 device-gated, #131 (Nova), #42 (docs). Milestone 3 QoL items closed tonight: #45 (VM half), #142, #93, #47, #27, #149; #50 delivered (hardware box open); #82 VM half; #129 closed.
- **The LINK1-7 cells** ran: 74 PASS, LINK5 FAIL (exit 5 after 303 s: the 16.5 MiB archive over `--bwlimit 200k` vs `--timeout 30s`), recorded on #113; #45 shrinks the archive to kilobytes, so LINK5 alone re-runs (`cloud-round-trip --only LINK5` or `vm-qa --skip-up --only link`) once an image carries `4fae9fe2e4`.
- **Milestone 3 "Stable before upstream"** (D-WORKFLOW-011): the hygiene pass closed #90, #91, #107, #76, #92; ticked eighteen boxes elsewhere with evidence; `vm-qa` gains `pair-identity`; `last-good-scripts-test` case j. Three criteria await the maintainer's words (#94 box 3 launch waits/refused vs D-CLOUD-076/109; #51 box 6 "providers we cannot drive"; #7 box 2 "naming the remote"). #73's docs box = #42 = #129 PL-07; #14's REMOTENAME = #33. The QoL list on the milestone: #27 #93 #45 #47 #50 #66 #67 #68 #69 #82 #142 #121 #131 #42.
- Upstream: every PR to `ROCKNIX/distribution:next`, `es` prefix for EmulationStation (D-WORKFLOW-012).
- Guests a, b on `ec12767b26`; guest c on `c90022dc57` (WebDAV restored) with the #45 `backuptool` staged at `/tmp/qa-bin/backuptool` and its `assets/7z.png` restored from `/usr/config` after a fixture marked it. RG35XX SP online (`af2db4ab09`); RG SP offline; the Nova: stable build first (census #88, QA handheld #131), target to be named by the maintainer.

## Next Steps

1. The QoL list in order (remaining): (FTP: missing dir = not there yet; mkdir before the content copy; `--backend ftp` 99/99), #93 + #82 (one ES change, frames), #47 + #27 (frames at 480x320 too), #50 (default hostname per unit; avahi deliberately off?), then the handheld-gated #66/#68/#121. Then one x64 + H700 build carrying everything since `ec12767b26` (#45, the #107 migration, the QoL items), the seven suites plus LINK5, and that becomes the staging candidate in place of `ec12767b26`.
2. Staging `ec12767b26` H700 (`701f725cd10467f8...`) on the RG SP (when back) then the RG35XX SP -- per-device yes; afterwards the Dropbox confirmation of five retries (#107/#113's device half, D-CLOUD-121).
3. #42 (rocknix.org page) before any upstream PR; then the PRs to distribution:next.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `scripts/backuptool` (`4fae9fe2e4`) | identity prune against `/usr/config`; `assets/` + `CACHE/` never travel; `tar -X` skip on restore; comment fixed | #45, D-CLOUD-008 |
| `tools/last-good-scripts-test` (`4fae9fe2e4`) | case k: both sides, fake `/usr/config` via per-subdirectory `/usr` binds | #45 |
| ES `GuiMenu.cpp`, `GuiSaveState.cpp` (`194bb9fa1`) | SAVE STATE x14; RESTORE SETTINGS FIRST; RESTORE SETTINGS FROM THIS DEVICE | #148, D-UI-049 |
| `tools/vocabulary-check` (`8b2eb4fad3`) | save state and Wi-Fi rules | #148 |
| `.claude/rules/` reshaped (agent, `89a80e4f78`..`310d0b0203`) | style guide a rule; es-native-ui split; front matter + index | #147, D-WORKFLOW-007..009 |
| `tools/vocabulary-check` (`fdffd17f25`) | back up / backup as verb / noun over ES strings and script lines; runner suite `vocabulary` | D-UI-047 |
| ES `CloudOffer.cpp`, `GuiMenu.cpp` (`b14a71ffc`) | the #127 texts as chosen; one relink description | D-UI-047 |
| rclone `cloud_restore`, `tools/cloud-round-trip` (`d6cd309b05`) | "Nothing to restore yet ..." | #127 |
| `.claude/rules/*`, `CLAUDE.md`, `AGENTS.md`, `docs/rules-sweep-2026-09-12.md` (agent, `438f14bfff`..`5ca1427ab5`) | the sweep | #147 |
| rclone conf/defaults/fallbacks (`c638f94ef6`) | `RCLONE_SYNC_NET_OPTS` += `--low-level-retries 5 --transfers 1` | D-CLOUD-121 |
| rclone `cloud_sync_helper` (`6539f8ccdd`) | once-only migration of the first-cut automatic bound | upgrade path |
| rclone `cloud_remote`, `cloud_restore` (`0a72907787`, `50b53b016f`) | directory markers on s3/gcs/azureblob; a bucket folder exists when its parent lists it | D-CLOUD-120 |
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

- The Nova's build target (stable build first, D-WORKFLOW-011); D-WORKFLOW-010 (rules in the ES repo?); the three criteria awaiting the maintainer's words (#94 box 3, #51 box 6, #7 box 2).
- #121 handheld box, #104 ramoops proof, #117 first-SIGTERM, #113's Dropbox half, #45's hardware box: device-gated, waiting on a handheld being online and the maintainer's yes.

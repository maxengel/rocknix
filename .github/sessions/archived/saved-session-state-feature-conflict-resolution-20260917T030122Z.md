# Saved Session State

> **Saved**: 2026-09-17T02:25:42Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (f8163247ab, pushed, level with origin); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `63a60bfad` (pushed); ES feature worktree `emulationstation-next.worktrees/delete-async` (`feature/savestate-delete-async`, `9e4e2ab85`, merged); distribution feature worktree `/workspace/repos/rocknix.worktrees/build10-fixes` (`feature/build10-fixes`, merged into next)

## Current Focus

**RC-12 build 10 `0923b9ee9f` is ON THE RG SP since 2026-09-17 02:20 UTC.** Staged 01:48-02:08 on *"The console is online now. You have my permission to copy the new build over."*, rebooted through `tools/device-act` at 02:16:41 on *"You may reboot."*, back in ~80 s (boot `bae3b500`, queue empty, interface / proxy / Tailscale up, `ready=247 pending=0`, charging). A read-only check of the shipped files confirms the ES binary carries the copy record and no manager rescan, and `cloud_capture` carries `--adopt` and `trap '' TERM`. The device went from build 6 straight to build 10: D-CLOUD-130 (the automatic syncs ask), #205 (the instant deletion; the deletion as one unit in the script, D-CLOUD-133), #206 (COPY TO FREE SLOT gated and recorded, D-CLOUD-134), #203's stopped-transfer stamps, #170. **The maintainer's round on the device is next.** Nothing is in flight: no build, no suite, no transfer.

## Completed This Session (2026-09-16 15:13 -> 2026-09-17 02:25 UTC)

- **#205 answered, then fixed.** The manager's DELETE ran two `cloud_capture` scripts synchronously on the interface thread (a third of a second on x86_64, a second on the A53); reproduced through the manager on guest d with a press timer (`press-time.py`); build 9 moved the work to a worker (D-UI-073) and fixed the ghost tile the teardown case found; build 10 put the row and the unlink inside one script that ignores SIGTERM (D-CLOUD-133) after the maintainer asked for the SIGTERM window closed.
- **#206 found and fixed**: no capture mode recorded a manager-made copy; now gated like DELETE and recorded through `--adopt` (D-CLOUD-134).
- **#203's follow-up**: a transfer stopped for a game restamps its parts (`CloudTransferJob::restampStoppedParts`); the row reads `SKIPPED, A GAME WAS STARTED`.
- **#170**: `cheevos_armsx2.sh` tests the file it writes. Not in the H700 image (no ARMSX2 there); its device check belongs to a PS2-capable build.
- **Tests**: ES unit 112 / 1224; `tools/last-good-scripts-test` with section w.; `tools/cloud-round-trip` CAP13 (retire --unlink incl. SIGTERM ignored), CAP14 (adopt), CAP9 brought to D-CLOUD-078; all fourteen PASS on guest b. Nine suites PASSED on builds 8, 9 and 10. Guest d proofs on each build (`proof-9.sh`, `proof-10.sh`, the transfer-page walk).
- **Records**: register D-UI-073, D-CLOUD-132/133/134 (310 IDs); blindspot 45 (a fixture's speed, not the device's); QA rows for builds 8, 9, 10; work logs 2026-09-16 (15:50 -> 23:45) and 2026-09-17 (00:45 -> 02:25); frames under `docs/qa-frames/2026-09-1{6,7}/`; issues #205, #206, #203, #170, #200 updated with builds, proofs, ticks and the device state. Memories extended: `one-proof-at-the-devices-numbers` (speed), `gate-commits-on-the-check` (chains, pkill).
- **Two slips logged** (work log 00:50): a refused merge that the chain ran past (`set -e` in a tool shell; a stray build never filed) and `pkill -f` matching its own shell.

## In Progress

- **The maintainer's round on build 10** (nothing to do until they report): #205 box 1 (no perceptible freeze after YES); #200 section A on build 10 (incl. build 7's launch-over-automatic-sync question and #201 box 5, the Wi-Fi picker between two networks); #170 box 1 belongs to a PS2-capable device. **After their first deletion**, read the device's own `(--retire --unlink, N ms)` line from `/var/log/cloud_sync.log` (read-only, through `tools/device-act`; tmpfs, this boot only) and record it on #205.

## Next Steps

1. Take the maintainer's notes from the device: each -> an issue quoting them (D-QA-012), a branch from `test/qa-integration` / `next`, merge, pin, x64 build, suites, guest d proof, H700, then the staging question (`stage-rgsp-run-0923b9ee9f.sh` and `rgsp-after-reboot.sh` are the templates; the wrapper's artifact directory carries the build date -- check it, the first run of this one named yesterday's and stopped short).
2. #206 box 3: prove the copy's gate on the VM with a sync in flight (guest d pointed at `/GAMES-d` at 8 KB/s, BACK UP SAVES from GAME SETTINGS, then X in the manager -> the refusal).
3. Closures owed on confirmation: #182 (fixed since RC-11 build 2), #175, #183, #181, #178, #177, #174, #169, #160, #121, #113, #102, #50 -- fifteen fixed-awaiting; #79 and #161 are lists; #162 belongs to #173.
4. Earlier follow-ups unchanged: rocknix.org pages (#191/#201, #196, #203) before any upstream PR; #185's round; the audit and RAOfflineProxy upstreaming tasks.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/SaveStateBookkeeper.{h,cpp}`, `SaveStateJobQueue.{h,cpp}`, `tests/unit/SaveStateJobQueueTests.cpp` | Created | the worker (delete via `--retire --unlink`, copy via `--adopt`; joined at exit) over a pure queue with a job kind |
| ES `es-app/src/guis/GuiSaveState.{h,cpp}` | Modified | YES hides the tile and enqueues; X gated and recorded; `update()` polls `completed()` keeping the cursor |
| ES `es-app/src/SaveStateRepository.{h,cpp}` | Modified | `onDisk`: never hands out a state whose file is gone |
| ES `es-app/src/CloudTransferJob.{h,cpp}` | Modified | `restampStoppedParts` |
| ES `es-app/src/main.cpp`, `es-app/CMakeLists.txt`, `es-app/tests/unit/{CMakeLists.txt,README.md}`, `locale/lang/fr/...po` | Modified | shutdown hook; sources listed; two French gate lines |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture` | Modified | `trap '' TERM`; `--unlink` (in finish(), not on rc 2); `--adopt` (copy op; unknown provenance fallback) |
| `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh` | Modified | #170 |
| `tools/last-good-scripts-test`, `tools/cloud-round-trip` | Modified | section w.; CAP13/14; CAP9 |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `63a60bfadc7ae7dcae4b50ba0fdef81433618ef0` (build 10) |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `docs/save-manifest-schema.md`, `docs/vm-qa-log.md`, work logs 09-16/09-17, `docs/qa-frames/2026-09-1{6,7}/` | Modified | rows, blindspot 45, the renumber bullet, three QA rows, frames |

## Related Context

- **Tracker**: #205, #206, #203, #170 (build 10); #200 (the RG SP round); #201/#202/#196 (device halves open); #11 epic.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` -- build 10 staged (01:48-02:08), reboot (02:16:41), RETURNED on `0923b9ee9f` (02:20:39), a read-only binaries check (02:21).
- **Artifacts**: `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260917-0923b9ee9f/` (H700 tar sha `3518b9e34bdf6a3c…`); suites `qa-0923b9ee9f-webdav-a-20260917-0046`; earlier builds 8/9 under `*-20260916-{a4dfd97ca5,e287f9d21a}`.
- **Session scripts** (`/workspace/tmp/rocknix-session/delete-async/`): `chk.sh <files>` (cross-compiler syntax check for the ES worktree), `unit-tests.sh <ES worktree>` (no cmake on this host), `press-time.py` / `keys-fast.py` (guest d timing over the monitor), `proof-9.sh`, `proof-10.sh`, `chain-*.sh` / `build-x64-*.sh` / `suites-*.sh`, `cap-all-guest-b.log`; `../rc11/lib.sh` (guest d helpers: `g`, `gput`, `wake`, `es_restart`); `../stage-rgsp-run-0923b9ee9f.sh`, `../rgsp-after-reboot.sh` (run with `bash`, not executable).

## Notes for Next Session

- **Guest d** (`:10026`) is on **build 10**, English, on the carousel; fixture: Bobl `state1..3` + auto + a leftover `state4` copy (with an entry), Tobu `state3` + auto; cloud config restored (no rclone.conf, `/ROCKNIX/Saves`, no bwlimit); the manifest carries a dozen scratch `retired` rows. Guests a/b are on build 10 from the suites (guest b's `/tmp/qa-bin` gone with the re-image); guest e is up, purpose unknown to this session.
- Pointing guest d at its own QA folder: `tools/cloud-test-backend rclone-conf` -> `/storage/.config/rclone/rclone.conf` (0600), `cloud_sync_helper`, `SAVES_REMOTE="/GAMES-d"`, `--bwlimit 8k` after `--progress` on RCLONEOPTS' first line (a multi-line value). GAME SETTINGS' cloud rows read the stamps even with no remote.
- The transfer-page walk on guest d: START (`ret`, may need a retry) -> down 1 -> A (GAME SETTINGS) -> up x12 lands near MANAGE CLOUD STORAGE (check the frame) -> A -> A (BACK UP TO THE CLOUD, SAVES ticked) -> up, right, A (BACK UP) -> B leaves the page live -> B x3 to the carousel -> A -> A (Bobl's manager) -> A (START NEW GAME) -> the question. After an ES restart guest d sits on the carousel, where X is RANDOM.
- After midnight, yesterday's image filename is gone from `target/` and the artifact directory names carry the date: derive paths with `ls -t`, never bake the date in (the suites' false start and the wrapper's false start were both this).
- The CAP fixtures wipe a guest's saves root: never on guest d; guest b (`:10023`) with the script staged under `/tmp/qa-bin` (`scp`, then `--path-prefix /tmp/qa-bin --only CAP1,...,CAP14`).
- Every device act: idle check, ask by name, `tools/device-act` with `DEVICE_ACT_SSH_OPTS='-o Hostname=100.75.221.73'` (the LAN address does not answer), read the device afterwards; a status read must be side-effect-free; mask values. The ES pin must be pushed before building; build worktrees sync only with no build running; gate every chain step with `|| exit 1`; commits gated on the check; `pkill -f 'pat[n]'`.
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check`, ES_SRC for ES citations); never `cd` into the primary checkout; session state committed from this worktree.

## Open Questions

- The maintainer's feel of the deletion on the RG SP (#205 box 1) and the device's retire ms (read after their first deletion).
- Their Wi-Fi picker result between two networks (#201 box 5) and the rest of #200 section A on build 10.

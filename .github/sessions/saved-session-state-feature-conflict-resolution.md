# Saved Session State

> **Saved**: 2026-09-17T02:21:40Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `63a60bfad` (pushed); ES feature worktree `emulationstation-next.worktrees/delete-async` (`feature/savestate-delete-async`, `9e4e2ab85`, merged); distribution feature worktree `/workspace/repos/rocknix.worktrees/build10-fixes` (`feature/build10-fixes`, merged into next)

## Current Focus

**RC-12 build 10 `0923b9ee9f` is ON THE RG SP** (staged 01:48-02:08 UTC on *"The console is online now. You have my permission to copy the new build over."*, rebooted through `tools/device-act` at 02:16:41 on *"You may reboot."*, back in ~80 s: boot `bae3b500`, queue empty, `ready=247 pending=0`). The device went from build 6 straight to build 10: D-CLOUD-130 (the automatic syncs ask), #205 (instant deletion; the deletion as one unit inside `cloud_capture --retire --unlink`, SIGTERM ignored, D-CLOUD-133), #206 (COPY TO FREE SLOT gated and recorded through `--adopt`, D-CLOUD-134), #203's stopped-transfer stamps, #170. **The maintainer's round is next**: #205 box 1 (no perceptible freeze after YES), #200 section A, #170 box 1 (a PS2 title twice). After their first deletion, read the device's `(--retire --unlink, N ms)` line from `/var/log/cloud_sync.log` (read-only, `tools/device-act`) and record it on #205.

## Completed This Session (2026-09-17 00:00 -> 01:20 UTC)

- Inventory from the tracker: of nineteen open bugs, fifteen fixed-awaiting-confirmation (#182 since RC-11 build 2), two lists (#79, #161), #162 in the RA-offline program; outstanding and in reach: #205's SIGTERM window, #206, #203's stamps, #170. All four in build 10.
- **ES** `9e4e2ab85`: `SaveStateDeleter` -> `SaveStateBookkeeper`, queue with a job kind (`SaveStateJobQueue`), `deleteLater` runs `--retire --unlink` and removes what is left, `recordCopy` runs `--adopt`; X handler gated (French line) and recording; `CloudTransferJob::restampStoppedParts` (a stamp whose mtime >= the job's start rewritten `130 cancelled`). Unit tests 112 / 1224.
- **Distribution** `581f16c550` (+ CAP9 fixture fix): `cloud_capture` `trap '' TERM`, `--unlink` (in finish(), not on rc 2), `--adopt DEST --from SRC --system --rom` (a `copy` op; unknown provenance when the source has no entry; membership by the layout row); `cheevos_armsx2.sh` tests secrets.ini; `tools/last-good-scripts-test` w.; `tools/cloud-round-trip` CAP13 (retire --unlink incl. SIGTERM ignored), CAP14 (adopt), CAP9 to D-CLOUD-078.
- Register D-CLOUD-133/134 (310 IDs); work log 2026-09-17 (00:45, 00:50, 01:15); QA row build 10; frames `docs/qa-frames/2026-09-17/`; issues #205/#206/#203/#170 updated (bodies ticked where the VM proved it).
- Two slips logged: the chain that ran on after a refused merge (`set -e` in a tool shell; gate with `||`), and `pkill -f` matching its own shell. Memory `gate-commits-on-the-check` extended.

## In Progress

- **Build 10 on the RG SP; the maintainer's round.** Each note from the device -> an issue quoting them (D-QA-012), a branch from `test/qa-integration` / `next`, merge, pin, x64 build, suites, guest d proof, H700, then the staging question. `stage-rgsp-run-0923b9ee9f.sh` and `rgsp-after-reboot.sh` are the templates (the wrapper's artifact directory carries the build date: check it before running; the first run of this one named yesterday's and stopped short).

## Next Steps

1. The maintainer's round on build 10: #205 box 1 and the device's `(--retire --unlink, N ms)` line (read after their first deletion); #200 section A; #170 box 1; #201 box 5 (the Wi-Fi picker between two networks).
2. #206 box 3: prove the copy's gate on the VM with a sync in flight (guest d pointed at `/GAMES-d` at 8 KB/s, BACK UP SAVES from GAME SETTINGS, then X in the manager -> the refusal).
3. Closures owed on confirmation: #182 (fixed RC-11 build 2), #175, #183 and the rest of the fixed-awaiting list; #170 box 1 on the device.
4. Earlier follow-ups unchanged: rocknix.org pages before any upstream PR; #185's round; #162 within #173.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `es-app/src/SaveStateBookkeeper.{h,cpp}`, `SaveStateJobQueue.{h,cpp}` | Renamed/Modified | jobs with a kind; delete via `--retire --unlink`, copy via `--adopt` |
| ES `es-app/src/guis/GuiSaveState.cpp`, `CloudTransferJob.{h,cpp}`, `main.cpp`, `locale/lang/fr/...po`, `tests/unit/SaveStateJobQueueTests.cpp` | Modified | the gate + record; restampStoppedParts; two French lines |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture` | Modified | trap '' TERM; --unlink; --adopt; copy op |
| `projects/ROCKNIX/packages/emulators/standalone/armsx2-sa/scripts/cheevos_armsx2.sh` | Modified | #170 |
| `tools/last-good-scripts-test`, `tools/cloud-round-trip` | Modified | section w.; CAP13/14; CAP9 |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `63a60bfadc7ae7dcae4b50ba0fdef81433618ef0` (build 10) |
| `docs/decision-register.md`, `docs/vm-qa-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_17-work_log.md`, `docs/qa-frames/2026-09-17/` | Modified | D-CLOUD-133/134; row; log; 4 frames |

## Related Context

- **Tracker**: #205, #206, #203, #170 (build 10); #200 (the RG SP round); #11 epic.
- **Session scripts** (`/workspace/tmp/rocknix-session/delete-async/`): `chk.sh`, `unit-tests.sh <ES worktree>` (no cmake on this host), `press-time.py`, `keys-fast.py`, `proof-9.sh`, `proof-10.sh`, `chain-*.sh`/`build-x64-*.sh`/`suites-*.sh`, `cap-all-guest-b.log`; `rc11/lib.sh` (guest d helpers).
- **Artifacts**: `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260917-0923b9ee9f/`; suites `qa-0923b9ee9f-webdav-a-20260917-0046`.
- **Device record**: `/workspace/artifacts/rocknix-device-actions.log` -- the last acts: build 10 staged (01:48-02:08 UTC), rebooted (02:16:41), RETURNED on `0923b9ee9f` (02:20:39), a read-only binaries check after.

## Notes for Next Session

- **Guest d** (`:10026`) is on **build 10**, English, on the carousel; fixture: Bobl `state1..3` + auto + a leftover `state4` copy (with an entry), Tobu `state3` + auto; cloud config restored (no rclone.conf, `/ROCKNIX/Saves`, no bwlimit); the manifest carries eleven+ scratch `retired` rows. Guests a/b are on build 10 from the suites; guest b's `/tmp/qa-bin` is gone with the re-image.
- Pointing guest d at its own QA folder: `tools/cloud-test-backend rclone-conf` -> `/storage/.config/rclone/rclone.conf` (0600), `cloud_sync_helper`, `SAVES_REMOTE="/GAMES-d"`, `--bwlimit 8k` after `--progress` in RCLONEOPTS (a multi-line value; edit with a sed on the first line). GAME SETTINGS' cloud rows read the stamps even with no remote.
- The transfer-page walk on guest d: START -> down 1 -> A (GAME SETTINGS) -> up x12 lands near MANAGE CLOUD STORAGE (check the frame) -> A -> A (BACK UP TO THE CLOUD, SAVES ticked) -> up, right, A (BACK UP) -> B leaves the page live -> B x3 to the carousel -> A -> A (Bobl's manager) -> A (START NEW GAME) -> the question.
- After midnight, yesterday's image filename is gone from `target/`: derive the image path with `ls -t`, never bake the date in.
- The CAP fixtures wipe a guest's saves root: never run them on guest d; guest b (`:10023`) with the script staged under `/tmp/qa-bin`.
- Every device act: idle check, ask by name, `tools/device-act`, read the device afterwards; the ES pin must be pushed before building; build worktrees sync only with no build running; gate every chain step with `|| exit 1`; commits gated on the check; `pkill -f 'pat[n]'`.
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check`, ES_SRC for ES citations); never `cd` into the primary checkout.

## Open Questions

- Their feel of the deletion on the device (#205 box 1) and the device's retire ms.
- Their Wi-Fi picker result between two networks (#201 box 5) and the rest of #200 section A on build 10.

# Saved Session State

> **Saved**: 2026-09-22T22:27:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `4af5adf7e0`, pushed to origin)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The round's candidate is the ninth cut `520e1c92ca`** (`h700-all-20260922-520e1c92ca/`, ES pin `d534632d7`), staged on the RG35XX SP (checksum matched 22:07 UTC, nothing applied). It carries #243 and **the fix for #246**: the interface's crash in the maintainer's soak was the after-exit rescan of the SCREENSHOTS folder reloading a list view whose cursor it had just deleted (`rescanIfFolderChanged` -> `clear()` -> `reloadGameListView` reading the freed cursor); reproduced on guest d in the soak's shape (seventh cut died on session 16, eighth on 13 with a backtrace whose faulting PC was in the heap), fixed by `dropGameListView` / `remakeGameListView` around the repopulate, and held for forty sessions. The eighth cut also made the crash handler print a backtrace and die of the signal. **vm-qa run 10 and the upgrade rehearsal are running on the ninth cut** (`chain-246-9.sh`, `vmqa-run10.log`, `upgrade-rehearsal-run10.{log,rc}`, done-marker `chain-246-9.done`); the reboot of the RG35XX SP is asked for after them and is not yet answered.

## Completed This Session (2026-09-22 16:15 – 17:37 UTC, after the previous stash)

- **#243 (D-UI-080, option 1)** -- ES `3b7265f33` (`ImageComponent::setDisplayAspect`; the SAVE STATE MANAGER's grid gives tiles their system's aspect; `DisplayAspect`/`DisplayAspectText` with the 4:3 table and the file-name rule; unit tests), `9f46264a8` (the SCREENSHOTS list is the `imageviewer` platform, not a system named "screenshots"), `4e4ab0647` (the theme's own bound extra takes the aspect: art-book-next hides `md_image` and draws `game-artwork` with `{game:image}`, an `ISimpleGameListView` extra; `DisplayAspect::applyToBoundImages`). Diagnostic cuts `05dc0a829` and `c437fe77f` (log lines, removed in `4e4ab0647`). Distribution pins `5d8bc093c7` (fifth), `2e2773bacf` (sixth), `0f916d52a4`/`8dc8233331` (diagnostic, x64 only), `220585b56b` (seventh). `tools/es-syntax-check --tree` committed.
- **Proof** (guest d, 640x480, `mkpng.py` fixture + `measure-243.py`): manager NES tiles 87x87 (4:3 for 256x240), Game Boy 98x99 as is; SCREENSHOTS list Bobl 167x167 (was 151x189 = 0.80 on every cut before), Ninoid 191x191. Frames `docs/qa-frames/2026-09-22/243-*` + README section. #243 comment with the before/after table; boxes 1 and 2 ticked, box 3 the maintainer's.
- **#244 closed** (docs commit `4af5adf7e0`): the change log's nine missing sections 2026-09-12 → 21 (a survey agent's draft, 49 claims with evidence, spot-checked by grep) and the 2026-09-22 section (#241, #242, #243); two drift lines fixed; rule `.claude/rules/change-log.md` (in `2e2773bacf`).
- **D-QA-037** (the soak's two unlocks count on any core; the maintainer's Dr. Mario question) -- register row, #236 soak lines and comment, work log.
- **#245 filed** (the maintainer's report: vertical arcade thumbnails a quarter turn off): cause in RetroArch's `task_screenshot.c` (no rotation handling; `SET_ROTATION` applied at display only); three options; open decision **D-UI-081** in the register's Open decisions.
- **Rules/memory**: `es-code-traps.md` § "The picture beside a game list is the theme's own extra, not md_image"; memory `es-info-log-needs-debug` (ES logs warnings only; `Debug=true` with essway stopped; `/var/log/es_log.txt` is tmpfs); memory `gate-commits-on-the-check` updated (a `| tail` after the check masked a FAIL and the chain committed and built anyway -- `set -o pipefail`).
- **Artifacts**: `h700-all-20260922-{5d8bc093c7,2e2773bacf,220585b56b}/` with SHA256SUMS + RECORD.txt (the first two marked SUPERSEDED; `f2f23da875`'s record marked superseded by the seventh). The fifth cut's rehearsal was voided (it staged a tar the sixth cut's build was rewriting); vm-qa run 7 (sixth cut) stopped after ten green suites.
- **QA log**: row for the fifth cut (run 6, eleven suites PASSED, `qa-5d8bc093c7-webdav-a-20260922-1623`, 0.89 / 1.43 / 2.01) in `docs/vm-qa-log.md`.

## In Progress

- **vm-qa run 10 + rehearsal on `520e1c92ca`**; then the QA row, the RECORD's proof line, and the reboot question to the maintainer (the keeper is armed on the RG35XX SP since 21:20 UTC with their yes).
- #246 is fixed and proven on the VM; the device half (the maintainer's next offline session on the ninth cut) and #247 (the keeper notes a cut dump as whole) remain.

## Next Steps

1. **The RG35XX SP**: on the maintainer's yes, `tools/device-act rg35xxsp 'reboot to apply 520e1c92ca -- the maintainer said yes' -- 'sync; (sleep 2; reboot) >/dev/null 2>&1 &'`, wait, read BUILD_ID (`520e1c92ca`) and that `/storage/.update` is empty; then the maintainer's word on an NES thumbnail (#243 box 3) and the soak line ticks on #236 (`a-soak`; #161 closes not planned if they agree; #211's device box). On the keeper's yes: `rocknix-corekeep --on` through device-act.
2. #245 / D-UI-081: the maintainer's call. If option 1, a RetroArch patch `0016` rotating the raw capture by the content rotation; the proof is the device (the VM has no arcade ROM).
3. Then the RG SP (D-QA-031) with the same tar; SM8550 for the Nova (#150); the housekeeping list in the previous state.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `a29db7111` → `820852ea7` → `cc2189f47` → `e86f117fc` → `de4584956` → `4217ca838` |
| `tools/es-syntax-check` | Modified | `--tree <worktree>`: a header farm so es-core and es-app header edits check together |
| `docs/cloud-sync-changelog.md` | Modified | nine sections 2026-09-12 → 21; the 2026-09-22 section; rclone 1.75.1; FINISH RESTORE PROCESS |
| `.claude/rules/change-log.md` | Created | the change log is written the day the change lands |
| `.claude/rules/es-code-traps.md` | Modified | the theme-extra trap (+ the log-level note) |
| `docs/decision-register.md` | Modified | D-UI-080, D-QA-037; D-UI-081 open |
| `docs/vm-qa-log.md` | Modified | the fifth cut's row |
| `docs/qa-frames/2026-09-22/243-*.png`, `README.md` | Created/Modified | before/after frames with the ring numbers |
| `docs/work-logs/2026_09-work_logs/2026_09_22-work_log.md` | Modified | four entries (D-QA-037; #243; #245; the theme-extra diagnosis) |
| ES repo (`feature/display-aspect`, merged to `test/qa-integration`) | branch | `main.cpp` (the crash handler), `ViewController.{h,cpp}` (`dropGameListView`/`remakeGameListView`), `SystemData.cpp` (the rescan); `ImageComponent.{h,cpp}`, `GridTileComponent.*`, `ImageGridComponent.h`, `GuiSaveState.cpp`, `DetailedContainer.cpp`, `ISimpleGameListView.cpp`, `DisplayAspect.{h,cpp}`, `DisplayAspectText.{h,cpp}` (new), `CMakeLists.txt`, `DisplayAspectTextTests.cpp` (new) |

## Related Context

- **Tracker**: #243 (box 3 open), #244 (closed), #245 (new, D-UI-081), #246 (fixed in the ninth cut; the device half open), #247 (the keeper's whole/cut note), #79 row 5, #236 (round page: seventh cut, soak read), #211/#161 (soak), #150
- **Register**: D-UI-080, D-QA-037, D-UI-081 (open), D-QA-036, D-QA-031
- **Artifacts**: `h700-all-20260922-220585b56b/` (the candidate); `qa-5d8bc093c7-webdav-a-20260922-1623/`; the seventh cut's run dirs once done
- **Session scripts** (`/workspace/tmp/rocknix-session/`): `repro-246.sh` / `repro-246b.sh <N> <outdir>` (the soak's shape as a loop; needs the guest prepped: Debug, gameexit, proxy enable+scan, keeper on, `/tmp/vd.bak`), `unwind.py`, `chain-246-9.sh`; `mkpng.py`, `seed-243.sh`, `measure-243.py`, `proof-243d.sh <outdir> [systems]` (X = GAME OPTIONS then A = the manager), `proof-243s.sh <outdir>` (`KEEP=1` keeps the guest up; SCREENSHOTS is five right of PICO-8), `chain-243-9.sh`, `build-x64-run22.sh`, `build-h700-run11.sh`, `vmqa-run8.sh`, `record-h700-run11.sh`, `changelog-gap-draft.md` (the survey's draft with evidence comments)

## Notes for Next Session

- **Driving the SCREENSHOTS list on the VM**: `StartupSystem=<name>` in es_settings.cfg with essway stopped lands the carousel on nes/gb/pico-8 but **not** on `imageviewer` (it comes up at PICO-8 although the API lists it visible); from PICO-8 the order is nes, gb, gbc, gba, SCREENSHOTS. `LastSystem` counts only when `StartupSystem` is `lastsystem`. `vm-visual-qa run --outdir` must be absolute.
- **ES diagnostics**: `LOG(LogInfo)` shows nowhere until `Debug=true`; the log is `/var/log/es_log.txt` on the VM (tmpfs -- read it before any reboot) and rotates to `es_log.0.txt` on a restart; on the device `/var/log` persists. busybox `pgrep -x retroarch` never matches `/usr/bin/retroarch`; RetroArch on the VM needs `video_driver = "gl"`.
- **One chain per image.** A chain's tail must not overlap the next chain's x64 build (the rehearsal staged a tar mid-rewrite). The seventh cut's chain waited on the diagnostic chain's done-marker before syncing.
- The RG35XX SP is `rg35xxsp` (192.168.1.81), offline for the soak at the time of writing; `tools/device-act` for every command; the reboot is a question every time.
- Guest d currently holds the seventh cut with the fixtures seeded; the QA cloud was reset before vm-qa run 8.

## Open Questions

- The maintainer's call on #245 / D-UI-081.
- The soak's window and the RG35XX SP coming online (their say).
- `ra-offline` not re-run since the second candidate; run it before the RG SP if wanted (spends a QA achievement).

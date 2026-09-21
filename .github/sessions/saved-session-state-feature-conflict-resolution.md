# Saved Session State

> **Saved**: 2026-09-21T16:15:35Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `a283f504a0`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The RC round for `77e7e97515` (#236, page https://claude.ai/artifact/Uq74wpvRB3SzpZ1oydYEmo) is done on the VM except two boxes, and the candidate is being re-cut.** Section B's last frame (#153, a settings archive cut mid-upload on S3) found the transfer page saying SKIPPED - YOU'RE NOT ONLINE over WHAT MADE IT IS IN YOUR CLOUD for a run the script called "Couldn't finish". Fixed in EmulationStation `7afce37a6` (branch `feature/transfer-cut-outcome`, merged to `test/qa-integration`), pin bumped on `next` (`a283f504a0`), and a warm GENERIC_X64 rebuild (run 11, `/workspace/tmp/rocknix-session/build-x64-run11.{sh,log,rc}`) is running detached. Next: boot guest d on the new image, redo the #153 frame (EN, FR), then the H700 build for the second candidate, then the checklist page and #236 re-cut for the new BUILD_ID.

## Completed This Session (2026-09-21, after the last stash)

- Kitesurf / browser reset: closed out -- RA's web API is read-only, the site's pages sit behind bot protection we do not work around, Kitesurf is a remote browser that would carry the QA password; #240 (under #120), D-QA-035. Hardcore is not a second spend (RAOfflineProxy is casual-only). Tobu's jukebox achievement is behind progress (menu = PLAINS, LOCKED x5, SCORES on a fresh save); gameplay candidates named on #240.
- B boxes proven on the RC (frames under `docs/qa-frames/2026-09-21/`, ticked on the page and in #236): #82 (screenshots list after an API launch and an `execute_kill` exit), #65, #67, #64 (real scrape + no-pair sentence + archive without password rows), #66 (wrong pair, no account). #153 framed EN/FR -> the defect above.
- Findings filed: `GET /emukill` is a no-op on this image (`batocera-es-swissknife` absent) -- #239 body corrected; the RA API still shows 100359 earned 2026-09-14 (a-211 stays blocked on the maintainer's reset).
- Docs on `next`: work log entries (five today), D-QA-035, qa-frames README.

## In Progress

- **GENERIC_X64 run 11** (ES pin `7afce37a6`). A background waiter watches `build-x64-run11.rc`. On rc 0: `bash /workspace/tmp/rocknix-session/rebuild-d.sh` to put guest d on it (check the script names the image by date), then the #153 walk: MAIN MENU > GAME SETTINGS > up x3 (MANAGE CLOUD STORAGE) > BACK UP TO THE CLOUD > chooser (read the toggles from a frame; SETTINGS on, SAVES off) > down x4, right, A > cut the link (`set_link net0 off` on `/tmp/rocknix-qemu-monitor-d.sock`) ~12 s in > frames every 10 s. Expect COULDN'T FINISH / DON'T WORRY, NOTHING CHANGED; FR: N'A PAS PU SE TERMINER, header PARAMÈTRES. Guest d holds the fixture: S3 stanza (`qa-cloud`, throttled MinIO on :9012 via `CLOUD_QA_BWLIMIT=200k`), bucket-prefixed cloud paths (originals in `/storage/.config/cloud_sync.conf.pre-153`), the 12 MiB pad at `/storage/.config/retroarch/link5-padding.bin` (the page packs anew, so the pad must stay), language en_US for the next boot (set fr_FR + reboot for the FR frame).
- Then **H700** (`/workspace/tmp/rocknix-session/build-h700.sh`, make a run4 with the new head), record under `/workspace/artifacts/rocknix-images/h700-rc-<date>-<id>/`, the checklist page and #236 re-cut for the new id, and the RG35XX SP staged with a per-device yes.

## Next Steps

1. Build result -> VM proof of #153 on guest d (EN, FR) -> tick #153's last box with the frames.
2. H700 second candidate; page + #236 updated with the new BUILD_ID; RG35XX SP offer (ask before the reboot).
3. a-211: waits on the maintainer confirming the reset of game 15738 on the QA account (the API is the check).
4. Cleanup on guest d after the proof: remove the pad, restore `cloud_sync.conf.pre-153`, `tools/cloud-test-backend --backend s3 down` then an unthrottled `up` if the round-trip suite needs it.

## Notes for Next Session

- The ES API launches (`POST /launch`); it does not quit -- use the exit hotkey's `execute_kill` (see `tools/ra-offline-test`'s `/tmp/ra-offline-kill`).
- The carousel keeps its position across an API launch/exit; read where you stand from a frame before counting systems.
- `pgrep -fa 'rclon[e] '` still self-matches when the same command line carries `rclone` elsewhere (e.g. a `pkill -x rclone`); the "2 running" after the cut run were the ssh shell.
- `scraper-config.sh` (session dir): each failure mode restores all four ScreenScraper rows first, then breaks one; a reboot after every edit.
- Kitesurf: do not revisit for retroachievements.org (D-QA-035).

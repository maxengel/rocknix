# Saved Session State

> **Saved**: 2026-09-21T23:21:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `6762ced305`, pushed to origin)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The RC round (#236; page https://claude.ai/artifact/Uq74wpvRB3SzpZ1oydYEmo, v7) is on its second candidate `d55169e59e`, which is on the RG35XX SP and proven on the VM. One device box remains, and it is the maintainer's: an offline soak (D-QA-036).** Nothing is in flight: no build, no suite, no waiter. Guests a/b (`:10022/:10023`, the pair, on `d55169e59e` from vm-qa run 2) and d (`:10026`, `d55169e59e`, English, QA RA account set, proxy toggle on) are up and idle.

## Completed This Session (2026-09-21)

- **Second candidate.** #153's frame found the transfer page wrong (SKIPPED over "what made it is in your cloud" for a cut run). ES `7afce37a6` + `d842bbe16` (`feature/transfer-cut-outcome`, merged to `test/qa-integration`), pin `d842bbe16` on `next`. GENERIC_X64 runs 11/13 ok (12 died on an unbraced loop of mine -> `tools/es-syntax-check`, blindspot 49). H700 run 4: `/workspace/artifacts/rocknix-images/h700-all-20260921-d55169e59e/` (tar, DDR3/DDR4 images, SHA256SUMS, RECORD.txt). vm-qa run 2 PASSED (eleven suites, `qa-d55169e59e-webdav-a-20260921-1645`); `ra-offline-test` PASSED (32) after the maintainer reset the QA account (`qa-d55169e59e-ra-offline-d-20260921-1745`). RG35XX SP updated 17:25 UTC with the maintainer's yes; they confirmed the build id.
- **B on the VM, all boxes**: #82, #65, #67, #64, #66, #153 (closed), #211's flush/journal, #166 re-proven. Row for `d55169e59e` in `docs/vm-qa-log.md`; #150's H700 row ticked.
- **Kitesurf / the RA reset**: closed out (#240, D-QA-035): the web API is read-only, the site's pages sit behind bot protection we do not work around, a remote browser would carry the QA password; hardcore is not a second spend (proxy is casual-only); Tobu's jukebox achievement is behind progress. The maintainer reset both games by hand.
- **Stale boxes caught by the maintainer** (blindspot 51, rule in `issue-tracking.md` "Putting a box on a checklist"): #181 was fixed 09-14 and confirmed then (closed; my "panel matter" note withdrawn); #121 was the handheld half of a log-noise fix (closed by inspection on the device); #196's regression box had no code delta (closed on the page). #161 folded into the soak (D-QA-036: a hotspot is not a distinct network case).
- **Tools**: `tools/es-syntax-check` (new, registered); `tools/ra-offline-test` clears `exec.log` and the screen before launching and stops when RetroArch is not running (blindspot 50: run 2 false-passed on a stale log under an open page). `GET /emukill` is a no-op on this image (#239).
- **Registers/logs**: D-QA-035, D-QA-036; blindspots 49, 50, 51; work log `docs/work-logs/2026_09-work_logs/2026_09_21-work_log.md` (many entries); qa-frames README for 2026-09-21; memories `es-syntax-check-before-pin-bump`, `es-api-launch-needs-the-carousel`, `open-box-is-a-claim`.

## In Progress

- **The soak (the maintainer's, D-QA-036)**: hours of play with Wi-Fi off on the RG35XX SP, two achievement unlocks in one FBNeo session (RetroArch keeps running, the second shows a toast), Wi-Fi back on. **Me, when they name the window**: `tools/device-act rg35xxsp` read-only -- `journalctl -b -o short-monotonic` for `status=139/134`, SIGSEGV/SIGABRT/core (#79: a row or not), `raofflineproxy-ctl status`/`flushed` + the RA API for the awards (#211), `CTRL-EVENT-DISCONNECTED|beacon loss|NetworkManager state` lines (#161). Journals may not persist across a power cycle (#104): read soon after.
- Page ticks to mirror into #236 at the start of the next session (`ArtifactData list checks`): the maintainer's `a-soak`, and anything new.

## Next Steps

1. Read the soak's journal when the maintainer gives the window; tick `a-soak` (page) and the #236 soak line; close #161 (not planned, scope named) if no drop showed; add a #79 row only if a crash did.
2. Then the RG SP question (D-QA-031): the RG SP is on build 15 `b245fd12ac` (unfixed RetroArch) and receives nothing until the maintainer says the candidate is confident. Staging path as for the RG35XX SP (`tools/device-act rgsp`, `192.168.1.175`; hash with `DEVICE_ACT_TIMEOUT=900`; ask before the reboot, by name).
3. SM8550 for the Retroid Pocket Nova (#150 rows 13-17, D-QA-028) after the RG SP.
4. #211's two-unlock VM reproduction and #240's second routed achievement (Böbl 111764 / Niñoid 474237, explored in the suite's `--control` shape) -- the longer path, not a gate.
5. Housekeeping: remove the merged ES worktree `~/Development/emulationstation-next.worktrees/transfer-cut-outcome`; `tools/fork-worktree list` to see the state of build worktrees; upstream PR #3359 (cairo) to watch; #228 (webkitgtk 2.54) is the maintainer's decision.

## Key Files Modified (this session, all on `next`)

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `fb6947fb4` -> `7afce37a6` -> `988de6141` -> `d842bbe16` (#153) |
| `tools/es-syntax-check` | Created | ninja's own compile command, `-fsyntax-only`; guard/list/index/`es-native-ui.md` |
| `tools/ra-offline-test` | Modified | clear `exec.log` + `dismiss-dialogs` before launch; early stop when RetroArch absent |
| `.claude/rules/{es-native-ui,issue-tracking,fork-workflow,instruction-files}.md`, `.githooks/pre-push` | Modified | the syntax check as a gate; "Putting a box on a checklist"; tool registration |
| `docs/{decision-register,blindspot-register,vm-qa-log}.md`, `docs/work-logs/2026_09-work_logs/2026_09_21-work_log.md`, `docs/qa-frames/2026-09-21/*` | Modified | D-QA-035/036; blindspots 49-51; row for `d55169e59e`; frames for #82 #64 #65 #66 #67 #153 #211 |
| ES repo (`~/Development/emulationstation-next`) | branch `feature/transfer-cut-outcome`, merged | `GuiCloudTransfer.cpp/.h`: cut-run word, note by files, `unitName` |

## Related Context

- **Tracker**: #236 (round record), #150 (H700/SM8550 rows), #211/#240/#166 (RA offline), #161 (soak-dependent), #237 (suites), #239 (black screen / emukill), #235 epic (upstream the toolkit)
- **Artifacts**: `h700-all-20260921-d55169e59e/`, `qa-d55169e59e-webdav-a-20260921-1645/`, `qa-d55169e59e-ra-offline-d-20260921-1745/`; the first candidate under `h700-rc-20260920-77e7e97515/`
- **Session scripts** (outside the repo, `/workspace/tmp/rocknix-session/`): `build-x64-run1{1,2,3}.sh`, `build-h700-run4.sh`, `vmqa-run2.sh`, `ra-offline-run{2,3}.sh`, `scraper-config.sh`, `tobu-jukebox-stage1.sh`, frames under `frames-d/`

## Notes for Next Session

- An ES `.cpp` edit runs `tools/es-syntax-check <file>` before commit/merge/pin bump; a header edit needs `--with <dir>` or the build.
- `POST /launch` answers 200 under an open page and launches nothing; `GET /emukill` does nothing; quit through `execute_kill`. Put the interface on the carousel and remove `/var/log/exec.log` before a launch-based check.
- The transfer page packs a fresh archive before sending: a cut-upload fixture keeps the pad in place; the chooser page remembers its toggles across reboots (read a frame before pressing A on a switch row).
- Before putting an issue's open box on a list for the maintainer, read the issue to its end and the day's work log (blindspot 51).
- `pgrep -fa` over ssh self-matches when the command line carries the process name elsewhere (e.g. a `pkill -x rclone` in the same line).
- The RG35XX SP is `rg35xxsp` (192.168.1.81) in `~/.ssh/config`; the RG SP is `rgsp` (192.168.1.175). Every device command through `tools/device-act`; the reboot is a question every time.
- QA S3 is back unthrottled; guest d's cloud paths are the defaults again; the QA WebDAV holds the round-trip data.

## Open Questions

- The soak's window (the maintainer's).
- When the maintainer calls the candidate confident: the RG SP (D-QA-031), then the Nova.
- #228 webkitgtk 2.54 (stay on 2.52.6 or one of the two fixes) -- the maintainer's.
- Whether to keep pursuing a second routed achievement for #211's VM reproduction (#240) before the conflict-resolution work resumes.

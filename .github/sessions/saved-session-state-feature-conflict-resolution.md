# Saved Session State

> **Saved**: 2026-09-15T07:21:57Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work lands on `next` in the primary checkout `/workspace/repos/rocknix` -- never `cd` into it, use `git -C`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`, tip `8d5ad005d`, pushed)

## Current Focus

**RC-11 build 2 `a6d032bf5e` is built for x64 and H700, VM-proven, and waits for the maintainer's word to be staged on the RG SP.** It carries everything the maintainer reported since RC-7 plus the older unbuilt items: #196 (save states follow Batocera's route, D-UI-057), #191 (live Wi-Fi SSID line + MANAGE NETWORKS), #193, #195 (D-UI-058), #182, #194, #192, #187 (D-UI-060 pending approval), #177, #178, and #199 (found during the proofs). The nine suites PASSED on both RC-11 builds; guest d's proofs on build 2 passed with the harness hardened twice more. Overnight the maintainer's fully-offline test also completed end to end: achievement 14600 earned with Wi-Fi off on RC-7, queued, flushed at reconnect, on the RetroAchievements profile dated to the offline moment (#167 box 1).

## Completed This Session

- **The first real offline award (RC-7 on the RG SP):** `Achievement 14600: queued_offline` 21:16 EDT, the device off 21:36, back 23:18 with network, `Flush succeeded` 23:18:05, the site's API lists the unlock at 2026-09-15 01:16:37 UTC softcore. #167 box 1 ticked; the reconnect stamp (`last-flush`) restored by the maintainer after I consumed it with `raofflineproxy-ctl flushed` (memory `reads-that-consume`; #173 comment).
- **The save-time question (#195) closed as understood**: the RG SP's clock and zone were right; the AUTO SAVE row was Sunday's file in the 24-hour format; the interface deletes RetroArch's exit auto save after a game played from a numbered slot -- **#196**, decided as parity with Batocera (D-UI-057): `es_savestates.cfg`, `runemu -state_file` -> RetroArch `-e <slot>`, Batocera's patch 001. #197 (slot numbers) closed not planned (D-UI-059). #195 rescoped to the 12-hour clock (D-UI-058). #198 filed (setrootpass unquoted).
- **RC-11:** six Fable subagent branches (ES: `feature/ui-small-fixes-rc11`, `feature/es-logging-rc11`, `feature/network-manage`, `feature/savestates-parity`, `feature/cloud-surfaces-rc11`, `feature/store-only-images`; distribution: `feature/wifictl-saved`, `feature/savestates-parity`, `feature/ra-login-toast`, `feature/store-only-images`) merged; ES unit tests 98 cases; the ES pre-push hook exempts the credential mask's test fixtures (`3ea7316b2`). Build 1 `66bfd20330` and build 2 `a6d032bf5e` (x64 + H700) filed under `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260915-<id>/` with BUILD_INFO; suites `qa-66bfd20330-webdav-a-20260915-0604`, `qa-a6d032bf5e-webdav-a-20260915-0636`.
- **Proofs on guest d (build 2):** fully-offline start + the #194 toast at +3 s; check1; #190 (a) 4.6 s with the address dropped and (b) 1.7 s, each graded by the interface's `ctl summary` call; PL-09 over 200 icon-less games 4.6 s with one ctl call (#199); #196 slot launch (`-e 1`, the quit state kept, no `.bak`; the slot renumbered to 0 by upstream's `renumberSlots`); frames for #195 EN/FR, #193 FR, #191 (four), #182, #190 EN/FR, #199 -- 15 frames in `docs/qa-frames/2026-09-15/` with README (account name redacted where it showed; `rc11/redact-frame.py`).
- **Records:** QA log rows RC-10 (corrected) and RC-11; work log 2026-09-15 entries 00:40 .. 08:20; register D-RA-020/021, D-UI-057 (decided), D-UI-058/059/060; rules: `generic-x64-vm-testing.md` (a game in the foreground; a shell-side setting needs an interface restart; grade the path not the stillness; Wi-Fi off = drop the address), `es-native-ui.md` tier table (#187); `cloud_net_ready` header; `es-menu-map.md`. Issues #190/#191/#193/#194/#195/#196/#199 boxes ticked with evidence; #182/#187/#192/#177/#178 commented; #176 closed.

## In Progress

- **RC-11 build 2 -> the RG SP.** Current state: built, filed, unstaged; the RG SP is on RC-7 `3387cf5da0`, online (SSID mismatch #191 confirmed live). What remains: the maintainer's word to stage (`HOSTOPT='-o Hostname=100.75.221.73 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR' bash /workspace/tmp/rocknix-session/stage-h700.sh rgsp /workspace/artifacts/rocknix-images/h700-all-20260915-a6d032bf5e`, BEGIN/END in the action log), then the reboot as its own question through `tools/device-act`, then `rgsp-after-reboot.sh a6d032bf5e`. Idle check first (game, cloud lock via `flock -n`, scrape).
- **The maintainer's approvals (acceptance after the build, by their word):** #194 wording A (`Logged in as "Name" (offline).`) vs B; #195 padded `02:17 AM` (register example `9:07 AM`) and a literal AM/PM for French; #193's French line wraps onto the bar's row at 640 (shorten or a second text line) and the summary line (D-RA-021); #191's labels; #196's patch 001 and the slot renumbering; #187's hub row until seen (D-UI-060).
- **Guests:** a/b on build 2 (pair), d on build 2 at 640x480 (account in, toggle on, 202 games cached by id, LastSystem gbc, wifictl stub unmounted, ClockMode12 default), e on RC-6 `768a0a9f48` (:10027).

## Next Steps

1. Ask the maintainer to stage RC-11 build 2 on the RG SP (D-QA-011), then the reboot as its own question; after it, their eyes on: the offline summary (#190 box 4), the login toast (#194), the game page lines (#193), the save state manager after a slot session (#196), the network row (#191), the startup card's first step (#192), the reconnect sentence (#173 box 2) -- and the approvals above.
2. Frames still owed: #192's card (needs a guest with a working cloud remote at boot -- the vm-qa fixtures know how), #187's page and row, the English game page (#193), 1280x800 variants, #196's upgrade check (a VM from the previous image with states, updated in place) and START NEW GAME.
3. Follow-ups filed or noted: #198 (setrootpass quoting), #193's French wrap, #199 box 3 (`cache-100.py --icons` run), #190 box 3 (250 games), the `rc6-proofs.sh` check1 shim (move to `/storage/.config/profile.d/`), the PL-07 poller timing (the fixture's scan is too quick), rocknix.org pages for #191 and the save state behaviour, the upstream proposals (#168; Batocera parity needs none).
4. Long-standing: #185 (save sync by manifest, its own round), #186 PL-20 upstream, SM8550 for the Nova after the RG SP round (D-WORKFLOW-020); the maintainer's open calls #178 boxes 2/4, #151 Phase 7, #47, D-RA-006, #173 (e), #161, #177's harder check.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `8d5ad005d…` (RC-11 build 2) |
| `projects/ROCKNIX/packages/ui/emulationstation/config/common/es_savestates.cfg` | Created | Batocera's libretro entry under the name `retroarch` (#196) |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/{runemu.sh,setsettings.sh,wifictl}` | Modified | `-state_file` -> `-e <slot>` (#196); `current/saved/forget` (#191) |
| `projects/ROCKNIX/packages/rocknix/sources/post-update`, `packages/sysutils/systemd/scripts/userconfig-setup` | Modified | seed `es_savestates.cfg` (#196) |
| `projects/ROCKNIX/packages/network/raofflineproxy/patches/011-*.patch`, `012-*.patch` | Created | X-RA-Offline/X-RA-Proxy headers (#194); an image miss answers 404 at once (#199) |
| `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0013-*.patch`, `0014-*.patch` | Created | the offline login toast; the backdrop follows the font (#194) |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_net_ready` | Modified | header names the card's words (#192) |
| `tools/last-good-scripts-test` | Modified | sections u. (wifictl) and v. (save state arguments); predicates 011, 012 |
| `docs/` (QA log, work logs, register, es-menu-map, qa-frames/2026-09-15, audits), `.claude/rules/{generic-x64-vm-testing,es-native-ui}.md` | Modified/Created | all on `next` (tip `44d615edbb` + later docs commits) |
| ES: `SaveState.cpp`, `GuiMenu.cpp`, `TimeUtil.cpp`, `TimeText.*`, `ComponentList.h`, `MultiLineMenuEntry.*`, `SwitchComponent.*`, `GuiRetroAchievements.*`, `GuiGameAchievements.cpp`, `WifiText.*`, `ApiSystem.cpp`, `GuiSettings.cpp`, `ThreadedCloudSync.*`, `CloudText.*`, `CloudTransferJob.*`, `GuiCloudTransfer.*`, `FileData.cpp`, `StringUtil.*`, `Platform.cpp`, `Log.cpp`, `LogPolicy.h`, `WebImageComponent.cpp`, `OfflineProxyUrl.*`, `OfflineAchievementsText.cpp`, `.githooks/pre-push`, `locale/lang/fr/LC_MESSAGES/emulationstation2.po`, `es-app/tests/unit/*` | Modified/Created | on `test/qa-integration` `8d5ad005d` |
| `/workspace/tmp/rocknix-session/` | Created | `rc6/guards.sh` (`no_game`, `menu_open`, `ensure_toggle_on`), `rc11/lib.sh` (frame helpers, `ser`), `rc11/redact-frame.py`, `rc11/frames*.sh`, `rc11/boot-card*.sh`, `rc11/wifictl-stub`, `rc11/filed/`, `rc11/run-*.log`, `build-x64-rc11*.sh`, logs |

## Related Context

- **Tracker**: milestone "Offline RetroAchievements" (#163, #165-#168, #173-#175, #178-#190, #193, #194, #199); #191, #192, #195, #196, #198 outside it; #197 closed; audit #186.
- **Decisions**: D-RA-001..021, D-UI-057..060, D-QA-011/012/015, D-INFRA-011.
- **Device action log**: `/workspace/artifacts/rocknix-device-actions.log`.
- **Upstream**: misantronic/RAOfflineProxy (patches 001-012 candidates; #168); Batocera parity for save states needs nothing sent.

## Notes for Next Session

- **Standing rules that bind:** nothing runs on a person's device without a per-action yes by device name after an idle check (staging asked too; the reboot always its own question; `tools/device-act`); QA guests a/b/d/e may be rebooted freely; **a status read on a device must be side-effect-free** (`raofflineproxy-ctl flushed` consumes the stamp -- `cat last-flush`); mask values and the account's name in every read; the account's name must not enter the repo (frames redacted with `rc11/redact-frame.py`); credentials only via `tools/qa-accounts`; commits `-c user.name="Max Engel" -c user.email="max@awecelot.com"` with the Co-Authored-By and Claude-Session trailers; register append-only; audit/review subagents `model: "fable"`.
- **The session's permission gate refuses remote shell writes** (a `printf > file` over ssh to the RG SP was blocked) -- reads pass; a write on the device needs the maintainer to allow it or to run it.
- **Harness lessons (all in the rule):** a game in the foreground swallows a run; a shell-side `set_setting` is invisible to the running interface (restart it); grade the path by the interface's log line (a dialog also holds still); `set_link off` keeps the address (use `nmcli dev disconnect` over serial); ssh dies with the link (read via `tools/vm-serial`); the first press after an interface restart is swallowed and the `wake` step (`shift`) is SELECT on a list -- verify with a frame; `pgrep -f` self-matches a pattern typed in the same command line (`[x]` the pattern AND avoid the literal in the command).
- **Builds:** x64 via `build-x64-rc11b.sh` pattern (sed the ID), `rm -f .stamps/image/build_target`, one builder per worktree (`pgrep -f 'make docke[r]-'`); H700 via `devices/build-dev.sh H700`; sync worktrees only with no build running; the ES branch must be pushed before the pin (the build clones from GitHub -- `not our ref` otherwise).
- `current-x64-id` = `a6d032bf5e`, `current-x64-img` = build 2's image; guest d's fixtures listed above.

## Open Questions

- The approvals listed under In Progress (#194 A/B, #195 padding and French marker, #193 French line and summary line, #191 labels, #196 patch 001 and renumbering, #187 hub row).
- Stage RC-11 build 2 on the RG SP now, or after the maintainer's morning look at the frames -- ask; never assume.
- #190 box 3 (250 games, 3 s) and #199 box 3 (icons present) -- accept the 200-game 4.6 s host-measured run, or run them.
- The two `next` commits carrying the QA account's name in a frame's title band (2026-09-14): rewrite history or leave -- the maintainer was told, no answer yet.

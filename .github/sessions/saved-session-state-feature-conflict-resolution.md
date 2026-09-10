# Saved Session State

> **Saved**: 2026-09-10T06:07:28Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`)

## Current Focus

Epic #11 (cloud saves). **#105 tranche A is on both handhelds.** H700 `7eb713bbd9` (tar sha `2ead84bc1e6c…`) was staged and both devices rebooted on the maintainer's authorisation (2026-09-10 05:56Z); both are back on it with settings intact, last-good records written, startup sync completed. `next` = `65f3e7e5e7` (code head `7eb713bbd9`, ES `5a3759cde`), pushed. The maintainer's four-item punch list on the devices is next; the RG SP's settings restore was done 2026-09-09 (not pending).

## Completed This Session

- **Tranche A verified on guest d (`c15050c897`)** — transfer page right (`COULDN'T FINISH` / why / `NOTHING WAS SENT. YOUR CLOUD IS AS IT WAS.` / `A TRY AGAIN B CLOSE`; TRY AGAIN re-ran). Five defects found and fixed (work log 2026-09-10, vm-qa-log row):
  1. **Picker scan read a refused cloud as an empty one** (exit 0, every system `NOT YET IN YOUR CLOUD`) — `2266c73245`: rclone's code goes up unless 3; harness step "a scan the cloud refused…" in `run_steps`.
  2. **Rows three lines** (why appended; D-UI-023) — **D-UI-029**: row = `LAST <date> - <outcome>`; the manual rows' dialogs gain `LAST TIME IT COULDN'T FINISH: <why>.` (ES `eb4148ebc`).
  3. **Card had no action row** (audit said `actionLine=true` by default; it is false; **blindspot 35**) — `createAsyncNotificationComponent(true)`. Frame on `854989a639`: third row `NOTHING WAS SENT. YOUR CLOUD IS AS IT WAS. TRY AGAIN: GAME SETTINGS > BACK UP SAVES TO THE CLOUD`.
  4. **`chksysconfig valid()` rejected every real system.cfg** under busybox tr (`[:print:]` read as eight characters; **blindspot 34**): record never refreshed, damaged file reseeded from defaults (#102 again). `f907e7f526`: byte ranges; `tools/last-good-scripts-test` shims the device's busybox applets (sed mv cp tr head wc cut awk) + image's own system.cfg + UTF-8 fixtures; `BASE_REF=c15050c897 … --old` → 7 FAIL, current → PASSED. Verified on guest d (bind-mounted script, then the `854989a639` boot).
  5. **Hostname read at 1.7 s before the repair** (`network-base.service`) — **D-CLOUD-080**: `rocknix-sysconfig.service` (sysinit, after userconfig, before network-base) runs `chksysconfig verify`. Verified: repair 1.75 s, hostname read 1.85 s from the restored file.
  6. **ES file cache hid the stamps** (`Utils::FileSystem::exists` caches a miss under `UseFileCache`): rows read `NOT DONE ON THIS DEVICE YET` after a run, even with stamps planted. ES `b7669c9fa` → `28631cf77` (stamp reader + `rclone.conf` gates pass `enableCache=false`), pin `d3f2431034`, next `c6e4fc3a9c`.
- **es_settings.cfg recovery verified**: torn file + reboot → restored from `.backup`, dialog `YOUR SETTINGS FILE WAS DAMAGED. THE LAST GOOD COPY WAS RESTORED.`
- **#106 filed**: NetworkManager/hostnamed rewrite a hostname carrying a space/underscore (`GENERIC_X64` → `GENERICX64`, at boot and while idle). #102 commented with the boot-order + valid() root cause.
- Docs on next: D-UI-029, D-CLOUD-080, blindspots 34 + 35, changelog ×4 sections, vm-qa-log row, work log entries, rules (es-native-ui: card action row + uncached reads; engineering-practices: the scan as a fail-closed case; upgrade-and-install: device's tools not host's; generic-x64-vm-testing: wake first, always). Commits `d10bd15c2b`, `70c2ca1af1`.
- Earlier this session (see archived state `20260910T03…`): #103 link loss, #98/#99, QoL tranche, #101, #96; `ef43f2ce4b` then `d574edf975` deployed to both handhelds; RG SP incident (#102) restore; tranche A audits + D-CLOUD-077/078/079, D-UI-028.

## In Progress

- Nothing running. Guests: c (10024) and d (10025) on `7eb713bbd9`/`9847876563`, remotes at 9010; WebDAV backend at 200k.

## Next Steps

1. The maintainer tests on the handhelds (the four-item punch list). Devices: RG SP 192.168.1.175 (hostname reads `RGSP`), RG35XX SP 192.168.1.81 (hostname reads `ROCKNIX` this boot -- #106's race, not the build). No reboots without asking (D-QA-008).
2. #106: decide `hostname-mode=none` for NetworkManager and quoting in `network-base-setup`; `userconfig.service` takes ~9 s on H700, which is why NM wins the hostname race -- worth its own look.
3. #105 remaining boxes: `COMPLETED WITH GAPS` on screen (needs a partial-run fixture) and the harness's positive vocabulary match; tranche B (P2/P3); KILL1/2/4/5 on the new scripts; KILL6-9/14/17 not implemented.
4. #104 (persistent journal/logs, watchdog, crash store); open decisions #100, #89, #92, #42.
5. Worktrees left: `row-one-line-pin` (pins), `last-good-harness` (merged; remove with `tools/fork-worktree remove`), ES `row-one-line` (merged).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore` | Modified | `--scan`: non-0/non-3 listing exits with rclone's code, no lines (`2266c73245`) |
| `tools/cloud-round-trip` | Modified | step "a scan the cloud refused exits with rclone's code and lists nothing" |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig` | Modified | `valid()` text test as byte ranges (`f907e7f526`) |
| `projects/ROCKNIX/packages/rocknix/system.d/rocknix-sysconfig.service` | Created | verify at sysinit before network-base (D-CLOUD-080); enabled in package.mk |
| `tools/last-good-scripts-test` | Modified | busybox shims for tr/head/wc/cut/awk; real-file + UTF-8 fixtures; `BASE_REF` overridable |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `28631cf77685cfd1f3346070170bead106d2e584` |
| ES `es-app/src/guis/GuiMenu.cpp` | Modified | `cloudReadLastRun` struct; `cloudLastRunDetail` one line; `cloudLastRunWhy` in three dialogs; uncached exists |
| ES `es-app/src/ThreadedCloudSync.cpp` | Modified | card created with the action row |
| ES `es-app/src/main.cpp` | Modified | `rclone.conf` gate uncached |
| docs + `.claude/rules` | Modified | see Completed |

## Related Context

- **Tracker**: #105 (tranche A), #102 (commented), #106 (new), #104 next, #50 related.
- **Audits**: `docs/audits/2026_09_10-graceful-degradation/` (README, scripts-and-writers, emulationstation-flows, kill-fixtures-design).
- **Artifacts**: `/workspace/artifacts/rocknix-images/x64-all-20260910-854989a639/` (verified except rows/dialog); `x64-all-20260910-c15050c897` (tranche A, superseded); H700 `h700-all-20260909-12fd47e341` HELD.
- **Frames**: `~/.claude/jobs/52255bdf/tmp/shots-e/` (854989a639: card with action row, picker dialog), `shots-e3/01-boot.png` (damaged dialog after boot), `shots-d-*` (c15050c897 findings).

## Notes for Next Session

- `wake.steps` first, always, and start walks from a frame: five idle minutes put the screensaver up; a walk without wake lost its first key and launched a game twice.
- Bind-mounting a script over `/usr/bin/<name>` works on the squashfs (busybox `mountpoint` says "Not a directory" but the mount is live) — the way to test a script fix on a guest before a build.
- ES's `Utils::FileSystem::exists` caches misses; any read of a script-written file needs `exists(path, false)`.
- `tools/fork-worktree sync` skips the build worktree when a build regenerated `documentation/PER_DEVICE_DOCUMENTATION/GENERIC_X64/SUPPORTED_EMULATORS_AND_CORES.md` — `git checkout -- <that file>` first.
- Build command (generic-x64 worktree): `DOCKER_EXTRA_OPTS="-v /workspace/repos/rocknix/.git:/workspace/repos/rocknix/.git -v /workspace/cache/rocknix-sources:/workspace/repos/rocknix.worktrees/generic-x64/sources" make docker-GENERIC_X64`; clear `.stamps/{emulationstation,rclone,rocknix}` and `.stamps/image/build_target` for changed packages.
- A safety flag fired on the "damage two config files over ssh and reboot" VM test command; it was a legitimate VM test (127.0.0.1:10025). Say what a destructive-looking VM step is for in the description.

## Open Questions

- Should the automatic toggles (SYNC SAVES DURING STARTUP / WHEN EXITING) keep any why on the row, or is the card's 5 s plus the stamp enough (D-UI-029 chose the latter; maintainer may overturn)?
- #106: should NetworkManager stop managing the hostname (`hostname-mode=none`), and should HOSTNAME entry validate what `hostnamectl` accepts?
- H700 staging of `c6e4fc3a9c`: needs the maintainer's yes per device (D-QA-011) after the VM pass.

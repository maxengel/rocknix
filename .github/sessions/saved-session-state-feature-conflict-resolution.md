# Saved Session State

> **Saved**: 2026-09-20T03:15:22Z
> **Branch**: feature/conflict-resolution (this worktree; all of the session's work landed on `next` in the primary checkout `/workspace/repos/rocknix`, head `2600de9dde`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

Getting a **clean cold H700 build** of the merged tree so the release candidate can go onto the RG SP and the RG35XX SP (the new dedicated QA handheld, D-QA-027). GENERIC_X64 built and passed vm-qa (10/10 suites green). H700 has failed twice on the arm (32-bit) side: first `libxcb` (evidence lost to a resume — my fault), then `pango`, whose cause IS captured this time: **meson tried to `git clone` a cairo subproject during configure** — `Subproject cairo is buildable: NO`, then a git clone of `master` from the network. That is a wrap-mode/subproject fetch that should be disabled or pointed at the sysroot's cairo; it is almost certainly a consequence of the 148-commit upstream merge (`28e750db32 "standalone: cleanup packages"` already cost five `PKG_ARCH` guards and one `ppsspp-sa` guard).

## Completed This Session

- **#211 root-caused with a core dump**: RetroArch segfault in `video_texture_load_wrap_gl3_mipmap+0xc`, posting thread already in `rc_evaluate_trigger` — `video_thread_loop` dispatched a completed command a second time on a frame wake (`cmd_data.type` is cleared by the poster, not the consumer). **Patch 0015** `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0015-video-thread-wrapper-run-a-command-once.patch` (`e5d14d4220`). `tools/retroarch-wrapper-test` extracts the real functions and fails 1.22.2 (2017/2000), passes the fix (2000/2000). Upstream master already had the same gate (libretro/RetroArch#19577 filed, corrected, closed). #225 filed for the 22 call sites + `font_driver.c` double-free exposure; ES ASan/TSan walk dropped (separate process).
- **Upstream merge** of 148 commits (`7bd7f31312`), four conflicts resolved by hand; then five `PKG_ARCH="aarch64"` guards restored (`1ffec5fd3e`, `2869da3147`), `ppsspp-sa` directory guard (`e424886341`), `webkitgtk` capped at `-j4` (`2f2eecd544`).
- **GENERIC_X64 image** `ROCKNIX-GENERIC_X64.x86_64-20260919.img.gz` from `2f2eecd544`: vm-qa 9 PASS + `menumap` PASS standalone; the one FAIL (PL-33) was a stale test double, fixed (`6558618a59`). Row in `docs/vm-qa-log.md`.
- **RA cache**: `raofflineproxy-refresh` + `raofflineproxy-ctl refresh` (`87d9969bbb`, `609c6a14be`, `901dd7644a`) — refreshes patch **and** unlocks **and** drops the stale `startsession` row (the third row; a stale one told RetroArch two reset achievements were still earned). Patch 014 connection reuse (`b8cc433bdb`, 14.9→38.9 img/s). Patch 013 validate-at-write + `--verify` sweep (`2e1df9d4dc`, `0d74ce702b`).
- **Core keeper** `rocknix-corekeep` ships **inert** (marker `/storage/.config/keep-core-dumps`, survives updates — D-QA-029). RG SP disarmed and hand-staged helpers removed; its #211 dump left on device and copied to `/workspace/artifacts/rocknix-images/crash-211-evidence/2026-09-19/`.
- **Tools**: `build-preflight`, `watch-job`, `ra-candidate-games` (`--check` hashes RA's way — iNES header), `es-menu-map-check`, `retroarch-wrapper-test`; all registered in `.githooks/pre-push` + `fork-workflow.md` + the new tool index in `instruction-files.md`.
- **Fixtures**: Combo Fishing (2026 build), Cookie Clicker (headerless hash matches), MeteoRain — verified by hash in `/workspace/artifacts/rocknix-qa-roms/README.md`. Cookie Clicker's cheap tier is **spent** (flushed); route documented.
- **Rules**: `working-principles.md` (RAMD 12 mapped), `engineering-practices.md` §"A name is not a behaviour", §"A promise is not a mechanism" (+ recorded-is-not-delivered), device-builds memory section + "copy .threads/logs before resuming", vm-testing spin-down, blindspot 46, D-RA-024..027, D-UI-076/077, D-QA-029.
- Issues filed today: #212–#225 (#220 withdrawn, #219/#215/#211/#79 updated).

## In Progress

- **Cold H700 build on the merged tree**
  - **Current state**: run 2 failed at `pango:target` [236/244] during `configure_target`. Thread logs preserved at `/workspace/artifacts/rocknix-images/build-failures/20260919-225431-build-h700-run2/build.ROCKNIX-H700.arm-threads/235.log`. Build root `build.ROCKNIX-H700.arm` and `.aarch64` exist (partial). Watchers exited. **Nothing is running.**
  - **What remains**: fix pango (below), resume, get an image, vm-first isn't possible for H700 — so device.

## Next Steps

1. **Read `235.log` fully** (`grep -n 'cairo\|subproject\|wrap' …`). Fix `pango`'s meson so it does **not** fetch the cairo subproject: likely `PKG_MESON_OPTS_TARGET+=" --wrap-mode=nodownload"` (or `-Dcairo=enabled` with the sysroot's cairo as a dependency — check `packages/*/pango/package.mk` depends on `cairo`). Verify against the pre-merge recipe: `git show pre-merge-2026-09-19:<path>`. **Do not resume on a guess** — read first.
2. **Enumerate, don't fix one at a time**: `git diff pre-merge-2026-09-19 upstream/next -- '**/package.mk' | grep -E '^[-+].*(wrap-mode|PKG_MESON|PKG_ARCH|if \[ -d)'` to catch siblings of the pango/PKG_ARCH/ppsspp class before the next run.
3. Resume: `cd /workspace/tmp/rocknix-session && sed -i 's|build-h700-run2|build-h700-run3|g' build-h700.sh && rm -f build-h700-run3.rc && setsid nohup ./build-h700.sh >/dev/null 2>&1 &` then arm **both** watchers: `tools/watch-job --log …run3.log --rc …run3.rc --pid "$(pgrep -f '^/bin/bash \./build-h700\.sh$')" --status …/build-h700.status --detach` **and** a harness `run_in_background` `until [ -f …run3.rc ]` waiter. Run `tools/build-preflight` first.
4. Also worth asking: whether the `libxcb` failure (run 1, `usr/lib32/libc.so` absent at link time) recurs on a cold build — it passed on resume, cause unknown (logs lost). A second cold H700 build after this one succeeds would settle it.
5. When an H700 image exists: it is the RC candidate. Stage to the RG35XX SP (QA device) first, then RG SP — **ask before each reboot, per device**. Keeper stays off (D-QA-029).
6. Then the maintainer's list: #216 fetch ordering, #223 refresh by recency, #224 REFRESH ACHIEVEMENT STATUS row (ES), #218 pacing curve (ask RA `#coders` first), #214/#215/#219 after the RC.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/emulators/libretro/retroarch/patches/0015-*.patch` | Created | the #211 fix |
| `tools/retroarch-wrapper-test`, `tools/watch-job`, `tools/build-preflight`, `tools/ra-candidate-games`, `tools/es-menu-map-check` | Created | see the tool index in `instruction-files.md` |
| `projects/ROCKNIX/packages/emulators/standalone/{aethersx2-sa,amiberry,bigpemu-sa,drastic-sa,yabasanshiro-sa}/package.mk` | Modified | `PKG_ARCH="aarch64"` restored |
| `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/package.mk` | Modified | directory guard restored |
| `packages/web/webkitgtk/package.mk` | Modified | `-j4` |
| `projects/ROCKNIX/packages/network/raofflineproxy/{sources/raofflineproxy-refresh,sources/raofflineproxy-ctl,patches/013,014}` | Created/Modified | refresh verb, validation, keep-alive |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep` + `…/busybox/sysctl.d/99-coredump.conf` | Created/Modified | inert core keeper |
| `tools/last-good-scripts-test`, `tools/vm-qa` | Modified | PL-33 seam; one suite list |
| `.claude/rules/*` (engineering-practices, working-principles, device-builds, generic-x64-vm-testing, instruction-files, es-native-ui, fork-workflow) | Modified | rules listed above |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `docs/vm-qa-log.md`, `docs/es-menu-map.md`, `docs/work-logs/2026_09-work_logs/2026_09_1{8,9}-work_log.md` | Modified | records |
| `/workspace/tmp/rocknix-session/build-{x64,h700}.sh`, `vmqa-run.sh`, `wipe-build-roots.sh` | Session scripts | outside the repo; archive thread logs on failure |

## Related Context

- **Tracker**: #211 (crash, root cause, dump), #225 (blast radius), #79 (crash list, now four rows), #163 (offline RA epic), #217–#224 (tonight's RA/refresh issues), #104 (evidence/crash store)
- **Upstream**: libretro/RetroArch#19577 (closed: master already fixed), #19517/#19518 (the earlier poster-lock fix)
- **Evidence**: `/workspace/artifacts/rocknix-images/crash-211-evidence/` (both crash sessions + the dump), `/workspace/artifacts/rocknix-images/build-failures/`
- **QA report**: `/workspace/artifacts/rocknix-images/qa-2f2eecd544-webdav-a-20260919-2036/`
- **Device**: RG SP over tailscale `100.75.221.73` (LAN `.175` does not answer); use `DEVICE_ACT_SSH_OPTS='-o Hostname=100.75.221.73' tools/device-act rgsp …`. Running build 15 `b245fd12ac`, keeper OFF, Bubble Bobble achievements 380824/380883 reset and the device agrees.

## Notes for Next Session

- **Six unverified claims in one day** are documented in blindspot 46 and the work log; the pattern is reaching for the plausible explanation when a next step is waiting. The `libxcb` resume erased the evidence — read `235.log` **before** touching the pango build.
- **Watching = the file + the waiter.** `watch-job --detach` records; only a harness `run_in_background` waiter delivers, and it can be reaped under memory pressure (it was, once). Say which are armed. Stop a watcher by the pid in its status file, never `pkill -f` (it killed the issuing shell — exit 144). Anchor `pgrep` patterns: `'^/bin/bash \./build-h700\.sh$'`.
- **Memory, not disk, is the build constraint.** `build-preflight` first; guests are ~2GB each and a build under pressure kills them (guest d was lost that way). All guests are down now. Swap was fully consumed once; `sudo swapoff -a && swapon -a` needs root.
- **Go's module cache is read-only** — `rm -rf` on a build root leaves `.gopath` behind silently; `chmod -R u+w` first and check the directory is absent, not the exit code.
- `.threads/logs/N.log` are **per slot**, reused by a resume. The build scripts now archive them on non-zero exit.
- The ES source checkout `~/Development/emulationstation-next` is on a feature branch; the shipped pin is `fb6947fb4` (`origin/test/qa-integration`). `es-menu-map-check` reads the pin, not the working tree.
- `raofflineproxy-refresh`'s `row_ages` cannot check `achievementsets` (hash-keyed) and says so. `refresh_game_patch` returns the patch body, not a title, despite its annotation.
- `~/.ROCKNIX/qa-accounts` values are never echoed; the RA account name on the maintainer's device is theirs, not the QA account's — mask both in output.

## Open Questions

- Should `rocknix-corekeep` ever default to on? Parked (D-RA-024/D-QA-029): four unreadable crashes argue yes; a core holds the device's credentials.
- D-RA-026: does the static-sets export travel in the settings backup (#219)? Maintainer said images are never a separate choice (D-RA-027); the sets half is open.
- #209 save-state hotkey mode semantics; #104 crash-store test in a few days; whether the `libxcb` relink failure is deterministic on cold arm builds.

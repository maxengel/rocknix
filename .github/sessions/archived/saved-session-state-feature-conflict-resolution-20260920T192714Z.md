# Saved Session State

> **Saved**: 2026-09-20T19:27:14Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `0ea9a4bb78`, pushed to origin)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**H700 run 3 is building the cold aarch64 root** (launched 19:22 from `77e7e97515`, the same BUILD_ID as the x64 image; status `/workspace/tmp/rocknix-session/build-h700.status`, rc `build-h700-run3.rc`, harness waiter armed). The arm side finished 19:25 with pango configured against the sysroot cairo (`cairo found: YES 1.18.4`, no clone) — the exact package that failed run 2. Before that: x64 run 10 built `ROCKNIX-GENERIC_X64.x86_64-20260920.img.gz` at 18:54 and vm-qa PASSED eleven suites 18:56-19:21 (`qa-77e7e97515-webdav-a-20260920-1856`). webkitgtk 2.54.0 failed four warm builds and is held at 2.52.6 for the RC (#228, `# freshness: pinned`). All three QA guests were stopped before the H700 build.

The session's finding stands: pango 1.58 has required cairo >= 1.18 since June, the override pinned 1.17.8, meson cloned cairo master into every image since (#226, blindspot 47). The maintainer ruled fork-introduced packages are current before submission (D-WORKFLOW-024, #227); the sweep and `tools/fork-package-freshness` are done.

## Completed This Session

- **Diagnosis, from artifacts**: x64 image and build-16 H700 SYSTEM both carry `libcairo.so.2 -> libcairo.so.2.11805.5`; pango's `install_pkg` held the files; the only two build-time clones on both roots were pango/cairo and glib/sysprof.
- **Fix**: `1e5b87963a` cairo override -> 1.18.4; `79437a25c0` `--wrap-mode=nodownload` in `scripts/build` (target + host).
- **Freshness sweep** (each checksum from the downloaded tarball): brotli 1.2.0, openjpeg 2.5.4, libtasn1 4.21.0, dmidecode 3.7, ryzenadj 0.19.0, libsoup 3.6.6, ruby 3.3.12, libpsl 0.23.3, glib-networking 2.90.0, webkitgtk 2.54.0 (+ `06016e4bbf`, `ef905ccc2e`, `e39fc7f68a`: `USE_GSTREAMER=OFF`, video/web audio/WebCodecs off, WebDriver off), rclone 1.75.1 (`fd9ef7897a`, verified against SHA256SUMS), raofflineproxy pin -> `4e9bab484e` with libchdr -> `8e7b8bd` (`41f86ec9ba`). Pins annotated `# freshness: pinned -- ...` on zip, rcheevos, libchdr (`747e670271`).
- **Tool**: `tools/fork-package-freshness` (`3834edb658`), registered in `fork-workflow.md`, the tool index, the pre-push guard; proven: full sweep exit 0, brotli held back -> BEHIND exit 1.
- **Records**: #226 (cairo), #227 (freshness rule), D-WORKFLOW-024, blindspot 47, `device-builds.md` "A build that fetches its own dependency", work log 2026-09-20 (four entries), memory `fork-packages-current-before-submission`.
- **Session state** from 03:15 committed here (`20d5dab4d7`; the stash had left it uncommitted).

## In Progress

- **H700 run 3, aarch64 side** — cold root, hours. Poisoned-package sweep if it fails (device-builds.md); copy `.threads/logs` is automatic in `build-h700.sh` on non-zero exit.
- Harness tasks #3 (this build, in progress), #6 (ra-offline suite on guest d, after the build), #4 (handhelds, after #6), #5 (upstream PR + close #226/#227).

## Next Steps

1. **When run 3 lands**: on the cold aarch64 root, `find build.ROCKNIX-H700.aarch64/build -mindepth 4 -maxdepth 4 -path '*/subprojects/*/.git'` must print nothing (the guard's own criterion); extract `SYSTEM` from the tar and `unsquashfs -ll SYSTEM usr/lib | grep libcairo` must show one regular `libcairo.so.2.*` (`.11804.4`); tick both on #226. Record `BUILD_ID`, tar sha256, sizes.
2. **ra-offline suite on guest d** against the x64 image (task #6): bring the pair up on `ROCKNIX-GENERIC_X64.x86_64-20260920.img.gz`, `./tools/vm-qa --skip-up --only ra-offline --guest d`; fixtures per `/workspace/artifacts/rocknix-qa-roms/README.md` (Cookie Clicker's cheap tier is spent); never echo `~/.ROCKNIX/qa-accounts`. Tick or comment the proxy criterion on #227. Stop the guests after.
3. **Handhelds** (task #4): RG35XX SP first, then RG SP (`DEVICE_ACT_SSH_OPTS='-o Hostname=100.75.221.73' tools/device-act rgsp …`); idle check (emulator, `rclon[e]`, `flock -n /var/run/cloud_sync.lock true`, transfer page); stage the one H700 tar per the runbook's update section; **ask before each reboot, per device**; keeper off (D-QA-029).
4. **Upstream PR** (task #5): `pr/cairo-1.18` by content — detached worktree at `upstream/next`, `git checkout next -- projects/ROCKNIX/packages/graphics/cairo/package.mk scripts/build`, one commit, body `/workspace/tmp/rocknix-session/pr-cairo-body.md`; `scripts/build` differs from upstream by exactly the six nodownload lines. Then close #226 and #227 from observed behaviour, and note #228 for the maintainer.
5. Then the maintainer's list: #216, #223, #224, #218, #214/#215/#219.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/graphics/cairo/package.mk` | Modified | 1.18.4, release URL, SPDX licence, `-Dxml` and `ipc_rmid` sed dropped |
| `scripts/build` | Modified | `--wrap-mode=nodownload` in TARGET_ and HOST_MESON_OPTS |
| `packages/{compress/brotli,graphics/openjpeg,security/libtasn1,sysutils/dmidecode,sysutils/ryzenadj,web/libsoup,devel/ruby,web/libpsl,network/glib-networking,web/webkitgtk}/package.mk` | Modified | version + checksum bumps; webkitgtk also `USE_GSTREAMER`/video/web audio/WebCodecs/WebDriver off |
| `projects/ROCKNIX/packages/network/{rclone,raofflineproxy,raofflineproxy-libchdr,raofflineproxy-rcheevos}/package.mk`, `packages/compress/zip/package.mk` | Modified | rclone 1.75.1; proxy pin; pinned annotations |
| `tools/fork-package-freshness` | Created | the D-WORKFLOW-024 check |
| `.claude/rules/{fork-workflow,instruction-files,device-builds}.md`, `.githooks/pre-push` | Modified | tool registration; the meson-fetch lesson |
| `docs/{blindspot-register,decision-register}.md`, `docs/work-logs/2026_09-work_logs/2026_09_20-work_log.md` | Modified/Created | blindspot 47, D-WORKFLOW-024, four entries |
| `/workspace/tmp/rocknix-session/{build-x64.sh,build-h700.sh,vmqa-run.sh,bump-pkg.sh,pr-cairo-body.md,issue-cairo.md,issue-freshness.md}` | Session scripts | outside the repo |

## Related Context

- **Tracker**: #226 (cairo/meson), #227 (freshness rule + sweep), #179 (rcheevos/libchdr pins), #164/#165 (proxy pin), #211/#225 (RetroArch crash, previous session), milestone "Stable before upstream"
- **Evidence**: `/workspace/artifacts/rocknix-images/build-failures/20260920-18{1726,3235,3639}-build-x64-run{6,7,8}/` (webkitgtk thread logs), `…/20260919-225431-build-h700-run2/…/235.log` (pango)
- **Scratch tarballs**: `/home/max/.claude/jobs/d9b03c5e/tmp/bumps/` (every bumped tarball, the proxy archives, extracted webkit cmake) — job-scoped, will vanish
- **Device**: RG SP over tailscale `100.75.221.73`, on build 15 `b245fd12ac` (runs cairo master), keeper OFF

## Notes for Next Session

- **Read the artifact, not the log.** The cairo finding lived in `image/system/usr/lib` and `install_pkg/pango-*`; the build log said DONE throughout. `unsquashfs -ll SYSTEM usr/lib | grep libcairo` on a shipped tar is the check.
- **The subproject a package built is in that package's `install_pkg/`**, so cleaning the library's own package changes nothing; clean the consumer.
- **WebKit 2.54 option graph**: `USE_GSTREAMER` (public, default ON) is what video, Web Audio, WebCodecs and speech synthesis hang off; WebDriver is public default ON. Ask "what sets the thing the error names?", not "which feature sounds like it?".
- **Three fixes on one failure is the stop line** (engineering-practices). webkitgtk has had three; a fourth is a revert to 2.52.6.
- `scripts/clean` run natively did not remove pango's stamps/install tree on the x64 root; `rm -rf .stamps/<p> build/<p>-* install_pkg/<p>-*` did.
- `tools/fork-package-freshness` exits 2 on UNKNOWN by design (dotat.at was down once; it now falls back to GitHub for unifdef). Do not soften the exit code; add a resolver.
- `tools/fork-worktree sync` ignores untracked files (`--untracked-files=no`), so `.H700-done` etc. in `devices` do not block it. Never sync with a `rocknix-build` container up.
- Watchers: `watch-job --detach` writes the status file (mtime is the liveness); a harness `run_in_background` waiter on the `.rc` file delivers the notification. Both were armed for every run today; the waiters returned promptly each time.
- The pango subproject fetch also means **upstream ROCKNIX images carry cairo master**; the upstream PR is the fix for them too.

## Open Questions

- webkitgtk 2.54: option 1 (gst-plugins-bad mpegts + GL in gst-plugins-base), a WebKit patch, or stay on 2.52.x — #228, the maintainer's call.
- Should `webkitgtk`'s now-unused `gstreamer gst-plugins-base` dependency line go? qt6/gst-plugins-good/gst-libav keep gstreamer in the image regardless; left in place.
- Carried over: core keeper default (D-QA-029), static-sets export in the settings backup (#219/D-RA-026), #209 hotkey semantics, whether run 1's libxcb relink failure is deterministic on a cold arm build.

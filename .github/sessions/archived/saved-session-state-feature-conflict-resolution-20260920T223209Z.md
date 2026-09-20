# Saved Session State

> **Saved**: 2026-09-20T22:32:09Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `f7152d84a4`+1 (work log), pushed to origin)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The H700 release candidate `ROCKNIX-H700.aarch64-20260920` (BUILD_ID `77e7e97515`) is staged in the RG35XX SP's update queue and the reboot has been asked of the maintainer, by name.** Nothing else is in flight. Delivered today: #226 (cairo master fetched into every image; fixed with cairo 1.18.4 + meson `--wrap-mode=nodownload`) and #227 (fork-introduced packages current before submission, D-WORKFLOW-024, `tools/fork-package-freshness`), both closed from observed artifacts; upstream PR ROCKNIX/distribution#3359 open; #228 holds WebKit 2.54 (needs video, video needs gstreamer-mpegts and -gl; the 2026-08-30 precedent `64907d0ab8` is on it). Program epic #235 (milestone 5) filed for offering VM QA, tooling and practices upstream, future scope. D-QA-030 (no ra-offline pass for this build), D-QA-031 (RG35XX SP gets RCs; RG SP and Nova wait for a confident RC per build).

## Completed This Session

- **Diagnosis, from artifacts**: x64 image and build-16 H700 SYSTEM both carry `libcairo.so.2 -> libcairo.so.2.11805.5`; pango's `install_pkg` held the files; the only two build-time clones on both roots were pango/cairo and glib/sysprof.
- **Fix**: `1e5b87963a` cairo override -> 1.18.4; `79437a25c0` `--wrap-mode=nodownload` in `scripts/build` (target + host).
- **Freshness sweep** (each checksum from the downloaded tarball): brotli 1.2.0, openjpeg 2.5.4, libtasn1 4.21.0, dmidecode 3.7, ryzenadj 0.19.0, libsoup 3.6.6, ruby 3.3.12, libpsl 0.23.3, glib-networking 2.90.0, webkitgtk 2.54.0 (+ `06016e4bbf`, `ef905ccc2e`, `e39fc7f68a`: `USE_GSTREAMER=OFF`, video/web audio/WebCodecs off, WebDriver off), rclone 1.75.1 (`fd9ef7897a`, verified against SHA256SUMS), raofflineproxy pin -> `4e9bab484e` with libchdr -> `8e7b8bd` (`41f86ec9ba`). Pins annotated `# freshness: pinned -- ...` on zip, rcheevos, libchdr (`747e670271`).
- **Tool**: `tools/fork-package-freshness` (`3834edb658`), registered in `fork-workflow.md`, the tool index, the pre-push guard; proven: full sweep exit 0, brotli held back -> BEHIND exit 1.
- **Records**: #226 (cairo), #227 (freshness rule), D-WORKFLOW-024, blindspot 47, `device-builds.md` "A build that fetches its own dependency", work log 2026-09-20 (four entries), memory `fork-packages-current-before-submission`.
- **Session state** from 03:15 committed here (`20d5dab4d7`; the stash had left it uncommitted).

## In Progress

- **RG35XX SP**: tar staged 22:31 (`/storage/.update/ROCKNIX-H700.aarch64-20260920.tar`, device-side sha256 `4e5f4cb792dc…` matched, boot id `51cbba31…` unchanged). Waiting on the maintainer's yes to reboot. Harness task #4.

## Next Steps

1. **On the maintainer's yes**: `tools/device-act rg35xxsp "reboot to apply 77e7e97515" -- 'sync; reboot'`; then confirm on the device: BUILD_ID `77e7e97515`, `ls /usr/lib/libcairo.so.2.*` = one regular file, `/storage/.update` empty, `rclone version` v1.75.1; record in the work log and close task #4. **Do not** stage to the RG SP or the Nova (D-QA-031).
2. Watch ROCKNIX/distribution#3359 for review; upstream's `AGENTS.md` asks for build artifacts on PRs and the description explains why they are not linked (personal scraper keys in the ES binary).
3. #228 is the maintainer's call (build gst-plugins-bad mpegts + GL in gst-plugins-base; a WebKit patch; or stay on 2.52.x). The recipe carries `# freshness: pinned -- ... (#228)`; the sweep exits 0.
4. Then the maintainer's list: #216, #223, #224, #218, #214/#215/#219; the conflict-resolution feature, with the RG35XX SP as its test device (it may be wiped and fresh-installed then).
5. Epic #235 waits; kickoff is `begin-exploration` (Discovery Epic), #230 wants the council.

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

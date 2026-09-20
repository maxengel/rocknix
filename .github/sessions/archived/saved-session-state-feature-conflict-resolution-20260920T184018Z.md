# Saved Session State

> **Saved**: 2026-09-20T18:40:18Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `e39fc7f68a`, not yet pushed to origin)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**x64 run 9 is compiling webkitgtk 2.54.0** (launched 18:38 from `e39fc7f68a`; status file `/workspace/tmp/rocknix-session/build-x64.status`, rc file `build-x64-run9.rc`, harness waiter armed). When it succeeds: vm-qa over `ROCKNIX-GENERIC_X64.x86_64-20260920.img.gz` (`vmqa-run.sh` already points at it), then the H700 run 3 (`build-h700.sh` already renamed), then the handhelds, then the upstream PR. Runs 6, 7 and 8 each failed inside webkitgtk 2.54 (gstreamer components; WebCodecs holding `USE_GSTREAMER`; WebDriver's log channel) — three fixes on one package. **If run 9 fails in webkitgtk again, do not fix a fourth time: hold webkitgtk at 2.52.6 for the RC and file the 2.54 bump as follow-up.**

The session's finding: the H700 run-2 pango failure was not a merge regression. pango 1.58 has required cairo >= 1.18 since June; the ROCKNIX override pinned 1.17.8; meson cloned cairo master at configure time into every image since (#226, blindspot 47). The maintainer then ruled that fork-introduced packages are current before submission (D-WORKFLOW-024, #227).

## Completed This Session

- **Diagnosis, from artifacts**: x64 image and build-16 H700 SYSTEM both carry `libcairo.so.2 -> libcairo.so.2.11805.5`; pango's `install_pkg` held the files; the only two build-time clones on both roots were pango/cairo and glib/sysprof.
- **Fix**: `1e5b87963a` cairo override -> 1.18.4; `79437a25c0` `--wrap-mode=nodownload` in `scripts/build` (target + host).
- **Freshness sweep** (each checksum from the downloaded tarball): brotli 1.2.0, openjpeg 2.5.4, libtasn1 4.21.0, dmidecode 3.7, ryzenadj 0.19.0, libsoup 3.6.6, ruby 3.3.12, libpsl 0.23.3, glib-networking 2.90.0, webkitgtk 2.54.0 (+ `06016e4bbf`, `ef905ccc2e`, `e39fc7f68a`: `USE_GSTREAMER=OFF`, video/web audio/WebCodecs off, WebDriver off), rclone 1.75.1 (`fd9ef7897a`, verified against SHA256SUMS), raofflineproxy pin -> `4e9bab484e` with libchdr -> `8e7b8bd` (`41f86ec9ba`). Pins annotated `# freshness: pinned -- ...` on zip, rcheevos, libchdr (`747e670271`).
- **Tool**: `tools/fork-package-freshness` (`3834edb658`), registered in `fork-workflow.md`, the tool index, the pre-push guard; proven: full sweep exit 0, brotli held back -> BEHIND exit 1.
- **Records**: #226 (cairo), #227 (freshness rule), D-WORKFLOW-024, blindspot 47, `device-builds.md` "A build that fetches its own dependency", work log 2026-09-20 (four entries), memory `fork-packages-current-before-submission`.
- **Session state** from 03:15 committed here (`20d5dab4d7`; the stash had left it uncommitted).

## In Progress

- **x64 run 9** — webkitgtk at ~7430/8557 at 18:40, past both earlier failure points; configure took 9 s. The image is assembled from `install_pkg/`; pango was cleaned by hand before run 6 so its tree no longer carries cairo 1.18.5; stale sysroot `libcairo*.so.2.11805.5` removed. Poisoned-package sweep run after each failure (found only webkitgtk, plus amiberry/yabasanshiro-sa leftovers once).
- Tasks #1–#5 in the harness task list mirror the pipeline below.

## Next Steps

1. **Read run 9's outcome** from `build-x64-run9.rc` and the status file. On failure in webkitgtk: revert `packages/web/webkitgtk` to 2.52.6 (`git revert` of `c4c813fea4`, `06016e4bbf`, `ef905ccc2e`, `e39fc7f68a`, or one commit restoring the recipe), note it in #227, sweep poisoned packages, clean webkitgtk, sync, relaunch.
2. **On success**: verify the image root (`build.ROCKNIX-GENERIC_X64.x86_64/image/system/usr/lib`): exactly one `libcairo.so.2.*` regular file, `libcairo.so.2 -> libcairo.so.2.11804.4`; `strings` of the webkit2gtk-4.1 library carries 2.54.0; rclone binary reports 1.75.1. Then `cd /workspace/tmp/rocknix-session && setsid nohup ./vmqa-run.sh &` with a waiter on `vmqa.rc`; **no x64 build while vm-qa runs**. Add the row to `docs/vm-qa-log.md`.
3. **H700 run 3**: `tools/build-preflight`, confirm `devices` worktree is at the image's head, `cd /workspace/tmp/rocknix-session && rm -f build-h700-run3.rc && setsid nohup ./build-h700.sh >/dev/null 2>&1 &`, then `tools/watch-job --log …run3.log --rc …run3.rc --pid "$(pgrep -f '^/bin/bash \./build-h700\.sh$')" --status …/build-h700.status --detach` **and** a harness waiter. Afterwards check pango's arm thread log (`cairo found: YES 1.18.4`), `find build.*/build -mindepth 4 -maxdepth 4 -path '*/subprojects/*/.git'` empty on the cold aarch64 root, SYSTEM squashfs libcairo.
4. **Handhelds**: RG35XX SP first, then RG SP; idle check, **ask before each reboot, per device**; keeper off (D-QA-029).
5. **Upstream PR** `pr/cairo-1.18` by content (cairo override + `scripts/build`; body at `/workspace/tmp/rocknix-session/pr-cairo-body.md`); tick and close #226/#227 from observed behaviour; push `next` to origin.
6. Then the maintainer's list: #216, #223, #224, #218, #214/#215/#219.

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

- webkitgtk 2.54.0 for the RC or 2.52.6 — decided by run 9.
- Should `webkitgtk`'s now-unused `gstreamer gst-plugins-base` dependency line go? qt6/gst-plugins-good/gst-libav keep gstreamer in the image regardless; left in place.
- Carried over: core keeper default (D-QA-029), static-sets export in the settings backup (#219/D-RA-026), #209 hotkey semantics, whether run 1's libxcb relink failure is deterministic on a cold arm build.

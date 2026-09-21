# Saved Session State

> **Saved**: 2026-09-20T23:55:15Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `33157b18d0`, pushed to origin)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The RC round for `77e7e97515` is under way on two surfaces: #236 (the record) and its page https://claude.ai/artifact/Uq74wpvRB3SzpZ1oydYEmo (the maintainer's working surface; ticks live in the page's `db`, collection `checks`, one doc per item id, `{done, note, at}`; read them with ArtifactData and mirror into #236).** Section A is the maintainer's, on the RG35XX SP (the RC applied 22:48). Section B, mine, so far: upgrade rehearsal PASS 20/20 (now `tools/vm-upgrade-rehearsal`, proven both ways); closures #131 #184 #175 #183 #47; frames #160 (1280x800) and #94 (the launch-over-sync gate) filed under `docs/qa-frames/2026-09-20/` and ticked. No guest is running; nothing is in flight.

## Completed This Session

- **Diagnosis, from artifacts**: x64 image and build-16 H700 SYSTEM both carry `libcairo.so.2 -> libcairo.so.2.11805.5`; pango's `install_pkg` held the files; the only two build-time clones on both roots were pango/cairo and glib/sysprof.
- **Fix**: `1e5b87963a` cairo override -> 1.18.4; `79437a25c0` `--wrap-mode=nodownload` in `scripts/build` (target + host).
- **Freshness sweep** (each checksum from the downloaded tarball): brotli 1.2.0, openjpeg 2.5.4, libtasn1 4.21.0, dmidecode 3.7, ryzenadj 0.19.0, libsoup 3.6.6, ruby 3.3.12, libpsl 0.23.3, glib-networking 2.90.0, webkitgtk 2.54.0 (+ `06016e4bbf`, `ef905ccc2e`, `e39fc7f68a`: `USE_GSTREAMER=OFF`, video/web audio/WebCodecs off, WebDriver off), rclone 1.75.1 (`fd9ef7897a`, verified against SHA256SUMS), raofflineproxy pin -> `4e9bab484e` with libchdr -> `8e7b8bd` (`41f86ec9ba`). Pins annotated `# freshness: pinned -- ...` on zip, rcheevos, libchdr (`747e670271`).
- **Tool**: `tools/fork-package-freshness` (`3834edb658`), registered in `fork-workflow.md`, the tool index, the pre-push guard; proven: full sweep exit 0, brotli held back -> BEHIND exit 1.
- **Records**: #226 (cairo), #227 (freshness rule), D-WORKFLOW-024, blindspot 47, `device-builds.md` "A build that fetches its own dependency", work log 2026-09-20 (four entries), memory `fork-packages-current-before-submission`.
- **Session state** from 03:15 committed here (`20d5dab4d7`; the stash had left it uncommitted).

## In Progress

- **2026-09-21 00:30, D-QA-032 applied**: the maintainer asked for any EmulationStation change before the other devices' build. Read against the pin `fb6947fb4`: PL-07 (`5a0095455`) and PL-17 (`772d70035`) are already in it; PL-20 was an issue edit (#168). #151 and #186 are closed as delivered (linters and `register-check` PASS), #150's first box ticked. **No new build unless section A finds an ES defect**; `77e7e97515` stands. The page (version 4) and #236 say so; the maintainer is working section A on the RG35XX SP now. Read the page's ticks (`ArtifactData list checks`) first thing next session and mirror them into #236.


- **#236 section B, remaining** (harness task #7):
  - **#153's frame**: a cut S3 upload's outcome sentence on the transfer page, guest d (640x480), EN then FR. Recipe: `CLOUD_QA_BWLIMIT=1M CLOUD_QA_BACKEND=s3 tools/cloud-test-backend up` (throttled); guest d via `bash /workspace/tmp/rocknix-session/rebuild-d.sh` (picks the newest x64 image; ssh :10026, monitor `/tmp/rocknix-qemu-monitor-d.sock`, serial `-d.sock`); rclone.conf from `CLOUD_QA_BACKEND=s3 tools/cloud-test-backend rclone-conf` written over a stdin-open ssh; walks `to-manage-cloud-storage` → `back-up-page` → `tick-settings` → start; cut with `tools/vm-serial` (`ip link set eth0 down`) a few seconds in; frame after the bounded retry ends; read #153's body first for the sentence "the option prescribes" (not found in `cloud_sync.conf.defaults`); then `Language` fr_FR (stop ES, edit, reboot the guest — a *restarted* ES lands on the last game list).
  - #211 box 1 (VM reproduction record + `tools/retroarch-wrapper-test` output); #209 walks (blocked on the maintainer's C decision); punch lists #151 PL-07/PL-17 and #186 PL-20 (+ lint, PL-18 rows, PL-19 bodies) — ES code work, which means a new ES pin and a new image, so the RC would move: raise with the maintainer before starting; #150 rows; #222's last box.
- **#198** is an open bug (unquoted device password), not a frame; it sits in the bug list of the RC write-up.

## Next Steps

1. **Read the page's ticks** (`ArtifactData list checks`) at the start of a session and mirror any of the maintainer's ticks and notes into #236 and the source issues.
2. **#153's frame** per the recipe above, then tick #153 and the `b-frames` doc on the page (set `done: true`).
3. **Ask the maintainer** whether the punch-list items (#151 PL-07/PL-17, #186 PL-20) are RC gates for *this* build — they need ES changes and therefore a new image — or deferred with the reason (D-WORKFLOW-015 says all severities; the milestone allows deliberate deferral).
4. **Then D**: the RG SP question only after A is done and the maintainer says so (D-QA-031). **Then E**: the SM8550 cold build for the Nova.
5. Watch ROCKNIX/distribution#3359; #228 is the maintainer's call; the maintainer's list (#216, #223, #224, #218, #214/#215/#219) after.

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

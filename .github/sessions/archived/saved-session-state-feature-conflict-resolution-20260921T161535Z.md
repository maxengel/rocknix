# Saved Session State

> **Saved**: 2026-09-21T04:16:57Z
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

- **#236 section B on the VM** (harness task #7). Both guests up on the RC: pair a/b (`vm-pair`, 1280x800) and guest d (`bash /workspace/tmp/rocknix-session/rebuild-d.sh`, 640x480, ssh :10026, monitor `/tmp/rocknix-qemu-monitor-d.sock`, serial `-d.sock`). Guest d has the QA RA account, the offline toggle, `RetroachievementsMenuitem` and `ClockMode12` on, three fixture titles cached; guest a is linked to the local WebDAV (`qa-cloud:`), `cloudsaves.startup=1`, seeded saves.
- **Done on the VM** (frames under `docs/qa-frames/2026-09-21/`, ticks on the page and in #236): #190, #193, #194 offline; #189; #68; #160 640x480; #157; #195; #210; #45 (closed), #169/#221 archive read; #94/#203 from the time-to-play frame. Maintainer's own: a-build, a-ssid, a-card-first-step, a-mdns.
- **Blocked**: `ra-offline` (a-211-flush, a-211-journal) -- the QA account has earned the only routed achievement (Tobu 100359, 2026-09-14); needs the maintainer to reset that game's progress on retroachievements.org, or `tools/ra-candidate-games` to route a new title.

## Next Steps

1. **Remaining B walks on guest d** (the walk rules are in `generic-x64-vm-testing.md` § Driving EmulationStation blind): #82 -- launch Böbl (A on NES list, A on START NEW GAME), while in game `scp` a PNG into `/storage/roms/screenshots/`, Esc twice, then the Screenshots list shows it; #196 -- LAUNCH Probe from a slot tile, wait, Esc twice, the manager shows AUTO SAVE with the quit time and the slot still there; #181 -- copy `MeteoRain.gba` to `/storage/roms/gba`, reboot, frame the carousel logos NES vs GBA; #183 -- a boot sampler (`wait 8`, shots every second to 60 s) shows no PLEASE WAIT.
2. **Scraper four** (#64 #66 #67 #65): `tools/qa-accounts 10026 ss`, reboot guest d, MAIN MENU > SCRAPER walks; #66's four sentences need the pair emptied/wrong in the ACCOUNTS rows.
3. **#153** cut S3 upload frame (recipe in the previous state), **#211 box 1** VM record.
4. **Read the page's ticks** each session (`ArtifactData list checks`) and mirror into #236.
5. When B is done and A's five device boxes are the maintainer's: the RG SP question (D-QA-031), then the SM8550 build for the Nova.

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

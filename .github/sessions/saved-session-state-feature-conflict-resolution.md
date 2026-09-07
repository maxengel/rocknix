# Saved Session State

> **Saved**: 2026-09-07T17:30:00Z
> **Branch**: feature/conflict-resolution (worktree; the work itself landed on `next`)
> **Repo**: maxengel/rocknix (+ ES at ~/Development/emulationstation-next, branch feature/cloud-vocabulary → test/qa-integration)

## Current Focus

#11 batch 1: Gates 0 (#35) and 11 (#9) done. **Gate 11's verdict is D-CLOUD-052: the reconciler's own transport (`rclone copy --files-from --ignore-times` per direction) for every pass; bisync not used; D-CLOUD-044 moot.** Scored on the pair, both backends, runner `747a53b578`, record `47eebf20ed` on `next`; #9 closed, mirrored on #22 (body head and R2 edited), #11's child ticked. **Next: task 11, the Gate 12 census** — needs a window from the maintainer (RG35XX SP emulator sessions); the reading script (`find -newer` over the saves tree; PPSSPP/Flycast/Mupen/DuckStation unit table; retained bytes at count 3; sealed bytes per exit) runs over SSH afterwards. Until then: the owed GENERIC_X64 build of `next` (ES `164f8f48d8` folder-refusal dialog, #78's open box; `backuptool`; `cloud_setup`; `--scan` tidy-up), VM frames first, then H700 staged with reboots asked for.

## Completed This Session

- #76 scripts: `--with-media`, `MEDIA_DIRS`/`MEDIA_EXCLUDES` on both `rclone copy` calls, `cloud_content_restore --scan` (union of both sides, six fields, awk `not_in` instead of `comm`). Commits on `next`: `b8773f2224`, `93621cfdbc`, the excludes fix, and ES bumps `744a19e3af`/later to ES `5dd7f7f04`.
- #76 interface (ES `6ce655b32`, `5dd7f7f04`): direction-aware picker, SCRAPED GAME CONTENT switch (`cloudsync.content.media`), entry rows on both transfer pages, hub row removed, `cloudMediaFlag()` on both transfer commands.
- VM run (four GENERIC_X64 images) found and fixed: busybox has no `comm`; `MEDIA_EXCLUDES` unused (blindspot 30); three-line switch row. Criteria 2–6 ticked on #76 from screendumps and the backend's directory.
- Docs on `next` (`d07fe2951a`): changelog "Scraped game content is a switch", blindspot 30, rclone rule paragraph (content flags; what busybox lacks), work log 06:56.
- H700 image `2b2a8d385f` kept at `/workspace/artifacts/rocknix-images/h700-content76-20260906-2b2a8d385f…/` (tar sha256 `7d56feb4…`); staged in the RG35XX SP's `~/.update` after on-device checksum. RG SP: nothing staged — it was running Mario Tennis.

## In Progress

- Task 6 done (see Current Focus). WebDAV: 48 single-device PASS, 43 two-device FAIL by design (37 fixtures + 6 contract); MinIO: 39. The run files of this session are gone with the scratchpad; each fixture's commit message carries its output.
- The VM pair is up (`tools/vm-pair info`; it vanishes with `/tmp` on a host reboot — `vm-pair up <img>`, then put `backuptool` and `cloud_setup` from `next` into `/tmp/qa-bin` on both guests); the backend is back on WebDAV :9010.
- A GENERIC_X64 build of `next` (`5330da7ee5`) is owed: ES `164f8f48d8` (the folder refusal dialog, #78's open box), `backuptool`, `cloud_setup`, the `--scan` tidy-up. VM first (D-QA-007) with a frame of CHANGE CLOUD FOLDER refusing a bad bucket name on MinIO; then H700, staged, reboots asked for (D-QA-008).

## Next Steps (the batch-1 task list, in execution order)

**Gate 0 — #35, the harness (VM, `feature/round-trip-harness` from `next`)**
1. Worktree + session script: boot `088c2bd22e` headless, the QA key over serial, WebDAV up; the harness's own fixtures, not `seed-*`.
2. First checks (futro §2): MinIO reachable from the guest under `CLOUD_QA_BACKEND=s3` (`rclone lsd` from the guest); the allowlist under the scratch root (`savestates/x.state`, `snes/game.srm` pass; `snes/game.srm.json` does not).
3. Baseline run of the harness as it is, on WebDAV: the `PASSED`/`N CHECK(S) FAILED` line and every failing check recorded on #35 — the failures are the repair list.
4. Repairs, each observed: `rclone.conf` restored after a run; old keys read on an old-shaped conf; archive assertions vs `cloud_backup`/`cloud_restore`'s dated names; content fixture under `CONTENT_REMOTE` with an ES-declared system, BIOS travelling; saves steps `--saves-only`, settings step as the tier runs it; D-UI-022 step names; the lock step seen to exit 3; PL-10's unsupported-system branch seen; exit-path steps asserting `--max-age`/`--no-traverse`.
5. Full runs on WebDAV and on MinIO; the final line and listings quoted on #35; Gate 0 boxes ticked on those.
6. ~~Fixtures, each a failing commit first~~ (done 2026-09-07): A1 (two roots against one remote, both changed **after a first pass**), the equal-size case, A2/A3, A8 (torn N64 pair), A9 (delete/renumber/absence/unmount/`rm`), A11 (cloned device id), A12 (legacy `RESTOREPATH`), A14 (manifest step, WebDAV null / MinIO non-null), A5's reader from the second root, the retention ordering kill, #9's contract fixtures runnable with bisync and with `copy --files-from`.
7. ~~Land on `next`; `docs/vm-qa-log.md` row; a micro-retro comment on #35.~~ (done)

**Gate 11 — #9, the bisync spike** — ~~8, 9, 10~~ done 2026-09-07: runner with `--dump`/`moved:`/shape/every-spawn budget; variants `--compare size,modtime,checksum [--download-hash]`; verdict D-CLOUD-052; #9 closed.

**Gate 12 — the census (RG35XX SP, the maintainer's hands)**
11. Ask for a window; the reading script (`find -newer` over the saves tree; PPSSPP/Flycast/Mupen/DuckStation unit table; retained bytes at count 3; sealed bytes per exit) runs over SSH afterwards; feeds #21's unit table and #22's ceiling.

Carried debt: rocknix.org docs PR; #73's on-screen review; the `--scan` BIOS tidy-up rides the next build.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore` | Modified | `--with-media`, `--scan`, `not_in`, excludes on the copy |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup` | Modified | `--with-media`, excludes on the copy |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pinned to ES `5dd7f7f048d9…` |
| ES `es-app/src/guis/GuiMenu.cpp` | Modified | picker per direction, switch, rows, media flag |
| `docs/cloud-sync-changelog.md`, `docs/blindspot-register.md` (30), `.claude/rules/rclone-cloud-sync.md`, work log 2026_09_06 | Modified | see above |

## Related Context

- **Tracker**: #76 (journey milestone, `cloud-saves`), D-CLOUD-048/043, D-UI-023, D-QA-007/008; epic #11 handed off (Step 6) earlier this session.
- **Council run**: `research/council-runs/2026-09-05-conflict-resolution-foundation/` (complete).
- **VM**: headless recipe in `generic-x64-vm-testing.md` + CLAUDE.md; helpers in the session scratchpad (`serialsh.py`, `ppm2png.py`, step files); QEMU pidfile `qemu76.pid`; sockets `/tmp/claude-1000/{m76,s76}.sock`; backend `tools/cloud-test-backend` (WebDAV, `~/.cache/rocknix-cloud-qa/data`).

## Notes for Next Session

- Driving ES over the QEMU monitor: `up` from a page's first row lands on the BACK button (three `up`s from the top of GAME SETTINGS to MANAGE CLOUD STORAGE); START on MAIN MENU closes it; after five idle minutes the first key only wakes the screensaver (send `shift`); keys: start=ret, A=x, B=z.
- `pkill -f` with a bracketed pattern still kills the shell whose command text holds the literal elsewhere — kill by pidfile.
- Busybox on the image: no `comm`, `pgrep -c`, `find -printf`, `ls --time-style`.
- After a compaction, grep for any code-state claim in the summary before building on it (blindspot 30; memory `verify-summary-claims-by-grep`).

## Open Questions

- A window for the Gate 12 census (the maintainer's emulator sessions on the RG35XX SP).
- Close #76/#77 after the maintainer's look at the review build?
- The folder-probe defect issue (filed and closed 2026-09-07) keeps one open box for the ES dialog until a VM frame shows it.
- D-CLOUD-044 (bisync-gap posture) stays parked until the #9 spike.

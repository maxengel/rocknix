# Saved Session State

> **Saved**: 2026-09-06T07:10:55Z
> **Branch**: feature/conflict-resolution (worktree; the work itself landed on `next`)
> **Repo**: maxengel/rocknix (+ ES at ~/Development/emulationstation-next, branch feature/cloud-vocabulary → test/qa-integration)

## Current Focus

#76 (D-CLOUD-048: scraped game content is a switch; SYSTEMS TO BACK UP / SYSTEMS TO RESTORE per direction, verdicts by file name) is built, proven in the VM, and staged on the RG35XX SP. The one open step is the device half of criterion 1, which needs a reboot the maintainer has not yet been asked for at the moment of writing — ask, never assume (D-QA-008).

## Completed This Session

- #76 scripts: `--with-media`, `MEDIA_DIRS`/`MEDIA_EXCLUDES` on both `rclone copy` calls, `cloud_content_restore --scan` (union of both sides, six fields, awk `not_in` instead of `comm`). Commits on `next`: `b8773f2224`, `93621cfdbc`, the excludes fix, and ES bumps `744a19e3af`/later to ES `5dd7f7f04`.
- #76 interface (ES `6ce655b32`, `5dd7f7f04`): direction-aware picker, SCRAPED GAME CONTENT switch (`cloudsync.content.media`), entry rows on both transfer pages, hub row removed, `cloudMediaFlag()` on both transfer commands.
- VM run (four GENERIC_X64 images) found and fixed: busybox has no `comm`; `MEDIA_EXCLUDES` unused (blindspot 30); three-line switch row. Criteria 2–6 ticked on #76 from screendumps and the backend's directory.
- Docs on `next` (`d07fe2951a`): changelog "Scraped game content is a switch", blindspot 30, rclone rule paragraph (content flags; what busybox lacks), work log 06:56.
- H700 image `2b2a8d385f` kept at `/workspace/artifacts/rocknix-images/h700-content76-20260906-2b2a8d385f…/` (tar sha256 `7d56feb4…`); staged in the RG35XX SP's `~/.update` after on-device checksum. RG SP: nothing staged — it was running Mario Tennis.

## In Progress

- #76 criterion 1, device half: RG35XX SP reboot (ask first), then GAME SETTINGS > CLOUD SETTINGS > MANAGE CLOUD STORAGE > BACK UP / RESTORE > SYSTEMS TO … with the switch off should read ON THIS DEVICE / IN YOUR CLOUD across its restored, scraped library.
  - **Current state**: tarball verified in `~/.update`; device idle at last check (no emulator, no cloud process, lock free).
  - **What remains**: the maintainer's yes; then the on-screen check; tick criterion 1; close #76 with the build.

## Next Steps

1. Ask the maintainer before rebooting the RG35XX SP; ask again, separately, before staging/rebooting the RG SP (it was in use).
2. After the device check: tick criterion 1, close #76 `completed` naming `2b2a8d385f` and ES `5dd7f7f04`.
3. Remaining #73 criteria (on-screen review by the maintainer; a real settings restore); round-trip run moved to #35.
4. rocknix.org docs PR for the vocabulary + the switch (hard gate; `docs/cloud-sync-changelog.md` §§ "One vocabulary", "Scraped game content" are the draft).
5. Milestone order: Gate 0 (#35 harness in VM), Gate 11 (#9 bisync spike → D-CLOUD-044), Gate 12 census.

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

- RG35XX SP reboot: yes/no/when (staged, inert until then).
- RG SP: stage when idle? It carries the same tar.
- D-CLOUD-044 (bisync-gap posture) stays parked until the #9 spike.

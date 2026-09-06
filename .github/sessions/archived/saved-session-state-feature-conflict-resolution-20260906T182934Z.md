# Saved Session State

> **Saved**: 2026-09-06T17:19:53Z
> **Branch**: feature/conflict-resolution (worktree; the work itself landed on `next`)
> **Repo**: maxengel/rocknix (+ ES at ~/Development/emulationstation-next, branch feature/cloud-vocabulary → test/qa-integration)

## Current Focus

#77 (D-CLOUD-050: game content is a class on the transfer page; CONTINUE opens the systems page; the game list is game content, D-CLOUD-049) is built as `0803aa195c` (ES `1fff9e904`), proven in the VM (six of seven criteria; the seventh's device half needs the RG35XX SP), and staged on both handhelds. Both reboots are asked for, not taken. Then the switch back to the conflict-resolution milestone: `begin-delivery` on #11, starting at Gate 0 (#35).

## Completed This Session

- #76 scripts: `--with-media`, `MEDIA_DIRS`/`MEDIA_EXCLUDES` on both `rclone copy` calls, `cloud_content_restore --scan` (union of both sides, six fields, awk `not_in` instead of `comm`). Commits on `next`: `b8773f2224`, `93621cfdbc`, the excludes fix, and ES bumps `744a19e3af`/later to ES `5dd7f7f04`.
- #76 interface (ES `6ce655b32`, `5dd7f7f04`): direction-aware picker, SCRAPED GAME CONTENT switch (`cloudsync.content.media`), entry rows on both transfer pages, hub row removed, `cloudMediaFlag()` on both transfer commands.
- VM run (four GENERIC_X64 images) found and fixed: busybox has no `comm`; `MEDIA_EXCLUDES` unused (blindspot 30); three-line switch row. Criteria 2–6 ticked on #76 from screendumps and the backend's directory.
- Docs on `next` (`d07fe2951a`): changelog "Scraped game content is a switch", blindspot 30, rclone rule paragraph (content flags; what busybox lacks), work log 06:56.
- H700 image `2b2a8d385f` kept at `/workspace/artifacts/rocknix-images/h700-content76-20260906-2b2a8d385f…/` (tar sha256 `7d56feb4…`); staged in the RG35XX SP's `~/.update` after on-device checksum. RG SP: nothing staged — it was running Mario Tennis.

## In Progress

- #77 criterion 3, device half: the RG35XX SP's restored, scraped library reading IN YOUR CLOUD / ON THIS DEVICE under ROMS AND BIOS alone. Tar `0803aa195c` (sha256 `7f03abeb…`) verified in `~/.update` on both devices; reboot not yet authorised for either.
- #76 closes with #77 once the maintainer has looked at the screens.

## Next Steps

1. Reboots: only on the maintainer's explicit yes per device; re-check idle first (`runemu.sh`, rclone, the flock).
2. After the RG35XX SP is on `0803aa195c`: `cloud_content_restore --scan` on its library (ROMs mode) — every restored system should read `…|0|0`; the maintainer's screen look; tick #77 criterion 3 and #76 criterion 1; close both naming the build.
3. Shut the VM (`kill $(cat /tmp/rocknix-qemu.pid)`) and `tools/cloud-test-backend down`.
4. `begin-delivery` on #11 → Gate 0 (#35, the harness in the VM), Gate 11 (#9 bisync spike → D-CLOUD-044), Gate 12 census.
5. Carried debt: rocknix.org docs PR (hard gate before any upstream PR; `docs/cloud-sync-changelog.md` §§ "One vocabulary", "Game content is a class of its own" are the draft); #73's remaining on-screen review.

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

- RG35XX SP and RG SP reboots onto `0803aa195c`: yes/no/when (staged, inert until then).
- D-CLOUD-044 (bisync-gap posture) stays parked until the #9 spike.

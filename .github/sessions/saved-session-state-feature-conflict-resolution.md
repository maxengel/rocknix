# Saved Session State

> **Saved**: 2026-09-17T16:39:07Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (b93682e704, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `7fc2466a9` (pushed; **not yet pinned** -- build 15's pin); ES feature worktrees `manager-no-flash` (#207), `card-compare-words` (#208), `french-sweep` (#152), `transfer-compare-words` (#157), all merged; distribution feature worktree `/workspace/repos/rocknix.worktrees/build11-flash` (`feature/build11-flash`, merged into next)

## Current Focus

**Tying the RC's loose ends per the maintainer's 2026-09-17 direction: stage the RC on H700 first, the Nova (SM8550) after; the RG35XX SP becomes the QA handheld (D-QA-027/028).** Build 14 `7c3484140f` (French for every fork string, two menu typos) is proven on the VM: x64 and H700 built, guest d upgraded, nine of ten suites PASSED so far with the walks running (the new `french` suite passes). Two fixes found on build 14's French frames are merged on the ES side and await the pin as **build 15**: the MANAGE CLOUD STORAGE hub row's French line wrapped to a third line (ES `946938dc0`, D-UI-023) and the transfer page said CHECKING where the card says COMPARING (ES `26a770561`, #157 box 2). **In flight**: the build-14 suites on guests a/b (waiter armed) and `proof-15-dirs-fr.sh` on guest d (French card frames through a compare of 300 fresh directories; ~10 min; restores config and English itself). **Nothing has touched the RG SP this session** beyond one read-only log read; staging waits for the maintainer's word, and will name build 15.

## Completed This Session (2026-09-17 02:26 -> 2026-09-17T16:39:07Z)

- **#207** (the flash after a deletion) and **#208** (NOTHING SENT YET between sync stages): filed from the maintainer's words, fixed, proven on the VM (all VM boxes ticked; box 1 of each is the device's), registered D-UI-074, D-UI-075. **#205** closed out on the device (1160 / 970 ms). **#206** all boxes ticked.
- **Closed as delivered**: #162, #164 (the fully-offline Mario Tennis unlock on the RG SP, RC-7, is D-RA-007's shape), #102 (the freeze's follow-ups all landed; no recurrence), #115 (the launch-gate item overtaken by D-CLOUD-130; the last sentence's frame deferred with its reason). #104 stays open for the crash-store test on the RG35XX SP "in several days" (maintainer).
- **Decisions**: D-QA-027 (RG35XX SP = QA handheld, bench device, QA accounts), D-QA-028 (SM8550 after the RC). #131 box 1 ticked.
- **#152 French sweep**: `tools/es-untranslated` (661 fork strings; exit 1 while any lack French; in the pre-push guard, the workflow rule and `tools/vm-qa` as the `french` suite); 492 translations in three batches (`french-sweep/batch{1,2,3}.py` via `po_append.py`); 661 / 661; ES `1c1d5e5d5` -> merge `c4198009d`; pin `7c3484140f` = build 14. Then the hub-row fix and the transfer page's COMPARING (ES `7fc2466a9`, unpinned).
- **Builds** 11 `ea828b286a`, 12 `6c0c13dc4e`, 13 `91cfa8a2b1`, 14 `7c3484140f` (x64 + H700), archived under `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260917-<id>/` with `SHA256SUMS.tar`, `BUILD_INFO.txt`. Suites PASSED on 11, 12, 13; 14's finishing. CAP13/14 PASSED on 12.
- **Records**: QA rows 11-13 (14 pending its suites); work log 02:58 -> 16:40 (thirteen entries); register 314 IDs; frames `207-*`, `206-*`, `208-*`, `152-*`, `157-*`; memory `build-id-is-the-synced-head`.

## In Progress

- **Build-14 suites** (waiter `bodygswfs`): on 'suites done' -> QA row for 14; then **build 15**: pin ES `7fc2466a90c7b74070b50c2ed3069713abee8d87` in `package.mk` on `feature/build11-flash`, commit, merge to next, push, `fork-worktree sync` (docker ps = 0 and `pgrep -af 'tools/vm-q[a]' | grep -vc 'bash -c'` = 0 first -- never a literal `tools/vm-qa` elsewhere on the same command line), chain by the synced HEAD's id (`french-sweep/{build-x64,suites,chain}-<id>.sh` from the 7c3484140f templates), guest d upgrade (`manager-no-flash/upgrade-d.sh <tar> <id>`), the fixed hub row framed in fr_FR (`fr-frames.sh` with its frame names bumped), suites, H700.
- **`proof-15-dirs-fr.sh`** on guest d (waiter `bkw6nrpiu`): the French compare line (COMPARAISON DES SAUVEGARDES · N SUR M) in frames; copy one into `docs/qa-frames/2026-09-17/157-card-comparing-fr-640x480-7c3484140f.png`.
- **#157 box 1's 1280x800 frames**: `vm-pair`'s guests a/b run at 1280x800 -- after the suites, a backup with the directory fixture on guest a (its QA config from the suites; check `rclone.conf` there first), EN then FR, frames every ~0.3 s for the first 20 s.
- **#67 boxes 1-3 on guest d** (English): SYSTEMS INCLUDED -> deselect two -> leave -> reopen from the main menu -> the same two deselected (frame); open the scraper from a game list -> only that system (frame); SCRAPE NOW with the QA ScreenScraper account (`tools/qa-accounts` carries SS_QA_* into a guest) on a scraped system with ALL vs missing-any -- or defer that one to the shim (#156) with the reason. Box 4 is the H700's.

## Next Steps

1. The three items above as their waiters fire; then #152 box 3 (the fixed hub row in fr_FR on build 15) and #157 box 1 ticks; QA rows for 14 and 15; a work-log entry; re-stash.
2. The staging question to the maintainer for **build 15** (H700 tar sha from `h700-all-20260917-<id>/SHA256SUMS.tar`): `QUOTE='<their words>' bash /workspace/tmp/rocknix-session/stage-rgsp-run-<id>.sh` (make it from `stage-rgsp-run-91cfa8a2b1.sh` by sed); the reboot a second question; `rgsp-after-reboot.sh <id>` afterwards.
3. Their round on the RG SP: #207 box 1, #208 box 1, #200 section A, #201 box 5, #152/#67/#157 device boxes. The RG35XX SP once on the bench: #104's crash test, #131 box 2, #167's panel wording.
4. Closures owed on confirmation: #205 (tick the refusal box from #206 box 3), #206, #207, #208, #152, #157, #67; the fifteen fixed-awaiting; rocknix.org pages (#42, #191/#201, #196, #203) before any upstream PR.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `GuiSaveState.{h,cpp}`, `SaveStateBookkeeper.{h,cpp}`, `SaveStateRepository.cpp` | Modified | #207 |
| ES `CloudText.{h,cpp}`, `ThreadedCloudSync.{h,cpp}`, `tests/unit/CloudTextTests.cpp` | Modified | #208 |
| ES `locale/lang/fr/LC_MESSAGES/emulationstation2.po` | Modified | +494 entries (#152), two shortened |
| ES `GuiMenu.cpp` (two typos), `GuiCloudTransfer.cpp` (COMPARING) | Modified | #152, #157 |
| `tools/es-untranslated` | Created | the checker; `.githooks/pre-push`, `fork-workflow.md`, `tools/vm-qa` list it |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `c4198009d8…` (build 14); build 15's pin pending |
| `docs/decision-register.md`, `docs/vm-qa-log.md`, work log 09-17, `docs/qa-frames/2026-09-17/` | Modified | D-UI-074/075, D-QA-027/028; rows 11-13; entries; frames |

## Related Context

- **Tracker**: #207, #208 (device boxes), #152 (box 3), #157 (boxes 1, 3), #67 (boxes 1-4), #104 (the crash test), #131 (box 2), #150 (SM8550 after the RC), #200/#201 (the round), #11 epic.
- **Session scripts**: `/workspace/tmp/rocknix-session/{manager-no-flash,card-compare-words,french-sweep}/` (proofs, chains, `flash-check.py`, `hold.py`, `upgrade-d.sh`, `po_append.py`, batches, `fr-frames.sh`, `chk*.sh`); `../stage-rgsp-run-91cfa8a2b1.sh` (QUOTE-gated template), `../rgsp-after-reboot.sh`, `../stage-h700.sh`.

## Notes for Next Session

- **Guest d** (`:10026`) on build 14, English restored by each proof's cleanup; Bobl `state1..4` + auto (state4 without thumbnail), Probe auto/1/2; stamps scratch. Guests a/b on build 14 from the suites (1280x800). Guest e (`:10027`) is a 640x480 spare on RC-6.
- **Guest d keys**: `x` A, `z` B, `a` Y (SEARCH on the list), `s` X (GAME OPTIONS on the list; COPY in the manager), `ret` START on the list / LAUNCH in the manager, `shift` wakes; manager = A held (`hold.py x 1500`); GAME SETTINGS cloud rows = from the top up 12, down 6/7/8/9 (SYNC / BACK UP / RESTORE / MANAGE); `press_change` for START and GAME SETTINGS (a swallowed press turns the next A into a launch). `set_lang fr_FR` + `es_restart` for French; restore `en_US` after.
- **Fixtures**: an un-removable file = `chattr +i`; a long sync = a 1 KB/s limit **with `--transfers 1`** or one large file (four transfers at 1 KB/s stall rclone's counter and the ceiling ends the run at 36 s, truthfully); a visible compare = 300 one-file directories with names the cloud has not seen; the screensaver blanks at 300 s (a `shift` a minute); frames of a running game carry the RA QA account name and stay local.
- **Harness traps met today**: `cut -c1-260` hid the tails of two long msgids (my appender's list check caught it) and of a directory listing (a "missing" save state that was there -- count, or stat the name); `pgrep -f 'tools/vm-q[a]'` matched its own command line twice (the bracket guards the pattern, not the rest of the line); `strings` splits at an accented byte (grep the `.mo` with `-a`).
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check` with ES_SRC); docs on `feature/build11-flash` then `git -C /workspace/repos/rocknix merge --ff-only` + push; never `cd` into the primary; session state committed from this worktree.

## Open Questions

- Does the maintainer want build 15 staged on the RG SP, and then rebooted (two answers)? Asked once for 13; to be re-asked for 15 with its sha.
- Their confirmations on the device: #207 box 1, #208 box 1, #200 section A, #201 box 5, and the French pages on the panel.

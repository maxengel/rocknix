# Saved Session State

> **Saved**: 2026-09-17T17:18:45Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` and in the ES repo)
> **Repo**: maxengel/rocknix -- primary checkout /workspace/repos/rocknix on `next` (335fc4b042, pushed); ES ~/Development/emulationstation-next, build branch `test/qa-integration` at `7fc2466a9` (pushed; pinned as build 15); ES feature worktrees `manager-no-flash` (#207), `card-compare-words` (#208), `french-sweep` (#152), `transfer-compare-words` (#157), all merged; distribution feature worktree `/workspace/repos/rocknix.worktrees/build11-flash` (`feature/build11-flash`, merged into next)

## Current Focus

**RC-12 build 15 `b245fd12ac` is the build to stage on the RG SP; it waits for the maintainer's word.** It carries everything from today: #207 (the deletion flash), #208 (NOTHING SENT YET), the worker's truthful deletion line, #152 (French for every fork string, the hub row fitting 640x480), #157's page word (COMPARING), two menu typos. Ten suites PASSED on it (`qa-b245fd12ac-webdav-a-20260917-1651`); guest d runs it and framed the French pages right. Builds 11-15 all passed their suites; the RC's tracker is tied up to the device boxes. **In flight**: guest b's 1280x800 card capture (EN then FR, `capture-b.sh` v2, waiter `b5j1ujg8s`) for #157 box 1. **Nothing has touched the RG SP this session** beyond one read-only log read (02:36). The staging question is asked in the session's last message: `QUOTE='<their words>' bash /workspace/tmp/rocknix-session/stage-rgsp-run-b245fd12ac.sh`, then the reboot as a second question, then `bash /workspace/tmp/rocknix-session/rgsp-after-reboot.sh b245fd12ac`.

## Completed This Session (2026-09-17 02:26 -> 2026-09-17T16:39:07Z)

- **#207** (the flash after a deletion) and **#208** (NOTHING SENT YET between sync stages): filed from the maintainer's words, fixed, proven on the VM (all VM boxes ticked; box 1 of each is the device's), registered D-UI-074, D-UI-075. **#205** closed out on the device (1160 / 970 ms). **#206** all boxes ticked.
- **Closed as delivered**: #162, #164 (the fully-offline Mario Tennis unlock on the RG SP, RC-7, is D-RA-007's shape), #102 (the freeze's follow-ups all landed; no recurrence), #115 (the launch-gate item overtaken by D-CLOUD-130; the last sentence's frame deferred with its reason). #104 stays open for the crash-store test on the RG35XX SP "in several days" (maintainer).
- **Decisions**: D-QA-027 (RG35XX SP = QA handheld, bench device, QA accounts), D-QA-028 (SM8550 after the RC). #131 box 1 ticked.
- **#152 French sweep**: `tools/es-untranslated` (661 fork strings; exit 1 while any lack French; in the pre-push guard, the workflow rule and `tools/vm-qa` as the `french` suite); 492 translations in three batches (`french-sweep/batch{1,2,3}.py` via `po_append.py`); 661 / 661; ES `1c1d5e5d5` -> merge `c4198009d`; pin `7c3484140f` = build 14. Then the hub-row fix and the transfer page's COMPARING (ES `7fc2466a9`) = build 15. #152 all three boxes ticked; #157 box 2 ticked; #67 boxes 1-3 ticked (guest d, the QA ScreenScraper account seeded).
- **Builds** 11 `ea828b286a`, 12 `6c0c13dc4e`, 13 `91cfa8a2b1`, 14 `7c3484140f`, 15 `b245fd12ac` (x64 + H700), archived under `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260917-<id>/` with `SHA256SUMS.tar`, `BUILD_INFO.txt`. Suites PASSED on all five (ten on 14 and 15, the `french` suite among them). CAP13/14 PASSED on 12. **Build 15 H700 tar sha `915fc1a0db5cdd002d30fde7bde3adf91bf25812da4473aaad341ac4856bbfad`, 1,304,320,000 bytes.**
- **Records**: QA rows 11-15; work log 02:58 -> 17:20 (sixteen entries); register 314 IDs; frames `207-*`, `206-*`, `208-*` (EN and FR), `152-*` (builds 14 and 15), `157-*`, `67-*`; memory `build-id-is-the-synced-head`.

## In Progress

- **Guest b's 1280x800 capture** (waiter `b5j1ujg8s`; logs `french-sweep/capture-b2-{en,fr}.log`, frames `frames-b2/`): read a compare frame and a bytes frame per language, copy them as `157-card-*-1280x800-b245fd12ac.png`, tick #157 box 1 with the four sizes/languages, commit the docs. The first attempt walked into CONTROLLER SETTINGS (no RETROACHIEVEMENTS row on that guest); v2 has no `down` after START and frames the menu it lands on.
- **The staging question for build 15** -- asked; the maintainer's answer decides the next act.

## Next Steps

1. Relay the maintainer's answer on staging build 15 (the transfer, then the reboot, D-QA-011/D-QA-015); if they report anything else from the device, file it first (D-QA-012), then the cycle: ES branch from `test/qa-integration`, merge, pin on `feature/build11-flash`, merge to next, `fork-worktree sync` with nothing in flight (docker ps = 0; `pgrep -af 'tools/vm-q[a]' | grep -vc 'bash -c'` = 0, no literal `tools/vm-qa` elsewhere on the line), chain by the synced HEAD's id, guest d, suites, H700.
2. Their round on the RG SP: #207 box 1, #208 box 1, #152 (French on the panel), #67 box 4, #157 box 3, #200 section A, #201 box 5. The RG35XX SP once on the bench: #104's crash test, #131 box 2, #167's panel wording.
3. Closures owed on confirmation: #205 (tick the refusal box from #206 box 3), #206, #207, #208, #152, #157, #67; the fifteen fixed-awaiting; then rocknix.org (#42, #191/#201, #196, #203) before any upstream PR; the SM8550 build for the Nova after the RC (D-QA-028).

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| ES `GuiSaveState.{h,cpp}`, `SaveStateBookkeeper.{h,cpp}`, `SaveStateRepository.cpp` | Modified | #207 |
| ES `CloudText.{h,cpp}`, `ThreadedCloudSync.{h,cpp}`, `tests/unit/CloudTextTests.cpp` | Modified | #208 |
| ES `locale/lang/fr/LC_MESSAGES/emulationstation2.po` | Modified | +494 entries (#152), two shortened |
| ES `GuiMenu.cpp` (two typos), `GuiCloudTransfer.cpp` (COMPARING) | Modified | #152, #157 |
| `tools/vm-qa` | Modified | the `french` suite |
| `tools/es-untranslated` | Created | the checker; `.githooks/pre-push`, `fork-workflow.md`, `tools/vm-qa` list it |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `7fc2466a90…` (build 15) |
| `docs/decision-register.md`, `docs/vm-qa-log.md`, work log 09-17, `docs/qa-frames/2026-09-17/` | Modified | D-UI-074/075, D-QA-027/028; rows 11-13; entries; frames |

## Related Context

- **Tracker**: #207, #208 (device boxes), #152 (box 3), #157 (boxes 1, 3), #67 (boxes 1-4), #104 (the crash test), #131 (box 2), #150 (SM8550 after the RC), #200/#201 (the round), #11 epic.
- **Session scripts**: `/workspace/tmp/rocknix-session/{manager-no-flash,card-compare-words,french-sweep}/` (proofs, chains, `flash-check.py`, `hold.py`, `upgrade-d.sh`, `po_append.py`, batches, `fr-frames.sh`, `chk*.sh`); `../stage-rgsp-run-91cfa8a2b1.sh` (QUOTE-gated template), `../rgsp-after-reboot.sh`, `../stage-h700.sh`.

## Notes for Next Session

- **Guest d** (`:10026`) on **build 15**, English; the QA ScreenScraper account sits in its `es_settings.cfg` (`tools/qa-accounts 10026 clear` with ES stopped takes it out); its scraper remembers NES only; Bobl scraped (images); Bobl `state1..4` + auto (state4 without thumbnail), Probe auto/1/2; stamps scratch. Guests a/b on build 15 from the suites (1280x800; no RetroAchievements account there, so the main menu has no RETROACHIEVEMENTS row and GAME SETTINGS is its first row). Guest e (`:10027`) is a 640x480 spare on RC-6.
- **Guest d keys**: `x` A, `z` B, `a` Y (SEARCH on the list), `s` X (GAME OPTIONS on the list; COPY in the manager), `ret` START on the list / LAUNCH in the manager, `shift` wakes; manager = A held (`hold.py x 1500`); GAME SETTINGS cloud rows = from the top up 12, down 6/7/8/9 (SYNC / BACK UP / RESTORE / MANAGE); `press_change` for START and GAME SETTINGS (a swallowed press turns the next A into a launch). `set_lang fr_FR` + `es_restart` for French; restore `en_US` after.
- **Fixtures**: an un-removable file = `chattr +i`; a long sync = a 1 KB/s limit **with `--transfers 1`** or one large file (four transfers at 1 KB/s stall rclone's counter and the ceiling ends the run at 36 s, truthfully); a visible compare = 300 one-file directories with names the cloud has not seen; the screensaver blanks at 300 s (a `shift` a minute); frames of a running game carry the RA QA account name and stay local.
- **Harness traps met today** (all logged 16:40-17:05): a display mask that rewrites the product's `<redacted>` placeholder hides a redaction (count the placeholder on the source before reading a leak); `cut -c1-260` hid the tails of two long msgids (my appender's list check caught it) and of a directory listing (a "missing" save state that was there -- count, or stat the name); `pgrep -f 'tools/vm-q[a]'` matched its own command line twice (the bracket guards the pattern, not the rest of the line); `strings` splits at an accented byte (grep the `.mo` with `-a`).
- Commits: `git -c user.name="Max Engel" -c user.email="max@awecelot.com"`, trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01LkFLXE5GsT1apn8AwrxrGR`; register append-only (`tools/register-check` with ES_SRC); docs on `feature/build11-flash` then `git -C /workspace/repos/rocknix merge --ff-only` + push; never `cd` into the primary; session state committed from this worktree.

## Open Questions

- Does the maintainer want build 15 staged on the RG SP, and then rebooted (two answers)? Asked once for 13; to be re-asked for 15 with its sha.
- Their confirmations on the device: #207 box 1, #208 box 1, #200 section A, #201 box 5, and the French pages on the panel.

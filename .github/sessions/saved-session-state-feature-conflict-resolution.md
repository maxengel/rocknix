# Saved Session State

> **Saved**: 2026-09-24T03:10:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `e5065e18ee` + UNCOMMITTED #252 work: `tools/frame-diff`, `tools/vm-qa`, `tools/vm-walks/{suite.txt,masks.txt,claims.txt,manager.steps,fixtures/,README.md}`, `.githooks/pre-push`, `.claude/rules/{generic-x64-vm-testing,fork-workflow}.md`, `docs/{decision-register,cloud-sync-changelog}.md`, the work log)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

**The seventeenth cut `443028ff7a` is the candidate** (the maintainer: *"Let's go with option two"*, D-UI-084): RetroArch patch `0016-widgets-message-queue-floor.patch` (the message queue never under 14 px) on top of the sixteenth's #209/#198/#247. Built 01:08-01:11 (RetroArch re-patched and rebuilt on both arches), `h700-all-20260924-443028ff7a` with RECORD.txt (VMQA_RESULT placeholder), guest d proof done (14 px: 44 strokes, 16 solid, mean stem 1.19 px; frame `251-toast-10px-vs-14px-4x`). **vm-qa run 23 + the rehearsal are rerunning (`chain-17b.sh`, `vmqa-run23.{log,rc}`, `upgrade-rehearsal-run18.{log,rc}`, `chain-17.done`)** after a false alarm: a stem measurement over a short span read 0 solid and I stopped the first run; the full span read 36% and the floor stays 14. When green: finalize RECORD.txt, the QA row, mark the sixteenth's record superseded, then ask the maintainer for the copy and the reboot (`stage-rg35xxsp-443028ff7a.sh` ready). **Then the rigorous code audit** (the maintainer: *"a full code audit using the code auditor's skill and being very rigorous to make sure comment quality, etc., are all well defined and executed"*) over the work since #186, with the `code-auditor` skill; its punch list fixed at every severity before the candidate is called one (D-WORKFLOW-015/016). **The RG35XX SP runs the fifteenth `aa8d525a8a`.**

Filed tonight: #255 (grid-fit font sizes per panel, the maintainer's idea, with the measurements), #256 (upstream in several PRs: the map; the interface side is coupled through GuiMenu.cpp +5,774 and ApiSystem.cpp +1,458; distribution splits by package).

## Completed This Session (2026-09-23 04:55 -> 05:30 UTC)

<<<<<<< HEAD
- **#250** -- ES `bb79e4fc4` (`GuiSaveState` sets a tile decorator: aspect and turns only for a tile whose entry has a capture; `ImageGridComponent::setTileDecorator`; the grid-wide `setImageDisplayAspect/Rotation` removed). Distribution pin `aa8d525a8a`. Body box 1 corrected and ticked; comment with the arrow table (`issues/250#issuecomment-5789496467`).
- **The arrow reference**: the fifth cut `5d8bc093c7` had already fitted the arrow at 4:3 on an NES game (84x38); every pre-#243 manager frame (09-15 .. 09-21 `77e7e97515`) has it at 54x43, x 55..108, y 306..348, and the fifteenth matches those. The 1,033-pixel difference against the fifth cut's NES frame in `measure-250-aa8d525a8a.txt` is the fifth cut's own distortion, not a regression.
- **Docs** (`b26f214a56` on `next`): `docs/qa-frames/2026-09-23/250-*` five frames + README section; work-log entries 05:05 and 05:20; the change log's #250 line; the 09-22 #245 decision entry that had been left uncommitted.
- **#251 filed** (the sign-in banner's font is RetroArch's message-queue 20 against the achievement banner's 32; options for the maintainer).
=======
**2026-09-08 ~20:40Z — everything landed; deploy candidate building.** Polish (workflow w3rkz039f): ES `b2a2732c3` (sizeLabel; done page run summary; snapshot; separators) → test/qa-integration `7a70af0184`, pinned; vm-walks fix `829e2a8763`. **#86 fixed** (workflow wlwdl5iq4, 2 reviewers, 13 findings applied): `323d96a37e` cloud_device_id, `4f9a53265d` A15, cloud_capture adoption `50fe7fb9c8`, D-CLOUD-068. **next = `50fe7fb9c8`** (#85 ×4 + polish, #21, #86, #84…). **Build chain running** (`scratchpad/build-chain.sh`: x64 → `x64-all-20260908-50fe7fb9c8/`, then H700 → `h700-all-20260908-50fe7fb9c8/`; waiter armed). Then: VM re-check on guest b (done page + sizes) and the capture ES-side procedure on guest a (upgrade in place with the x64-all tar), then verify the H700 image and **ask before deploying** (new build; both handhelds will heal their ids on first run). Upstream `pr/automount-card-wait` ready, PR not opened. #85 follow-ups on the issue (backuptool restore vs chosen archive; oracle; pico-8 scan scoping; whole-run bar design).

**2026-09-08 ~21:20Z — final VM checks: 5/6 pass; fixes in flight.** Guest b (748ffd41b8): sizes whole KB, done page `3 FILES · 2.1 MB BACKED UP` / `NOTHING NEW TO SEND…` (shots `scratchpad/shots-final/`). Guest a: capture ran from the real ES exit path with the toggle off (es_log 387, /proc argv), no-stamp rule held, core_build == shipped pin, manager DELETE → retired row; **fail: emulator exit reached capture as 0** — upstream bug **#90**: `001-functions` `wait_lock()` EXIT trap re-exits runemu.sh with rm's status; **#91**: both VM guests share a MAC → same device id (harness). Also: `--retire` gave the .png sidecar a retired row (vs D-CLOUD-059); stamp lacks emu-exit; MATCH dialog fake decimals; device.json id spelling (follow-up on #86). **Fix workflow wh9bp0us8 running** in `rocknix.worktrees/exit-status` (feature/exit-status) + ES transfer-ux. Then: commit, land, pin, rebuild chain, targeted re-verify (emu-exit=1 through the real path; manifest sha copied to host; sidecar not retired), **then deploy H700 (authorised: "deploy and reboot once all checks pass")**.

**2026-09-08 ~22:25Z — fixes landed: next `61ae10975f`.** Workflow wh9bp0us8 (4 impl + review + fix): `afa175b99b` 001-functions wait_lock trap (#90); `bb0fd2bcad` runemu.sh 137/143→0 (D-LAUNCH-001; **agent-made product decision, surfaced to the maintainer**); `75c7b5eacd` cloud_capture sidecar/stamp + CAP assertions + pair id assertion; `f85a3eea77` vm-pair/generic-x64-vm --mac (#91); ES `ba30956e3`/`621b917eb` match-dialog sizes (the fixer committed+merged ES itself), pin bumped; docs (D-LAUNCH-002 open → **#92**: RetroArch force-quit by hotkey exits 1 like a failed load). **Build chain running from 61ae10975f** (x64 → H700; H700 script's internal sync removed so BUILD_ID = 61ae10975f). **Re-check workflow** on guest a (real exit → `--exit 1`, stamp `emu-exit=1 retroarch/mgba`; sha copy; one retired row, none for .png). **Deploy once green** (authorised). Upstream PR branches to prepare later: automount (ready), wait_lock (#90 message drafted at `scratchpad/f1-commit-msg.txt`).

## Completed This Session (2026-09-05 → 06)

**The council run reached a majority and a consensus plan.**
`research/council-runs/2026-09-05-conflict-resolution-foundation/`:

- Three consecutive 2-2-1 ties (r1, r2, r3), then **r4: `claude-revised_plan-r4.md`
  wins 3-2**, chosen by the three seats that did not write it (its author's
  seat voted for kimi). r4's reviews had reported no architecture left to
  choose between — the vote was for the document a builder is handed.
- **Step 4.5** `revised_approaches/consensus_plan.md`: base adopted whole, the
  four blockers `gpt_vote-r4.md` was conditional on cleared, seven further
  defects fixed, 26 dissent primitives integrated and priced, 7 genuine
  conflicts listed. Sealed (`step4_5.seal.json`), chain and seals verified.
- Recorded and settled: the r3 votes' contradictory claims about the retention
  stores (mistral's rested on two false premises — recorded, tally left as cast).

**Maintainer decisions, all in `docs/decision-register.md`:** D-CLOUD-032
(undo is first-class; one step back; edge cases inform, not drive), -033 (V1
retains, no undo control; #25 is the restore tool, "time machine" over the
wizard's compare surface), -034 (a safeguard's cost is named and earned),
-035 (badge + one entry MANAGE GAME SAVE RESTORES AND CONFLICTS), -036 (**cloud
is the source of truth for discarded copies**; default 3, 1–9; loser verified in
the cloud before the winner replaces it), -037 (unexplained absence is a
two-button question in the wizard), -038 (launch gating extends the shipped
guard in `FileData::launchGame`), -039 (the bisync spike is decisive, upstream
requests for narrow gaps), -040 (RESTOREPATH removed; design intent traced to
the 2025-07 import), D-UI-022 (**the vocabulary**), D-WORKFLOW-003 earlier.

**The vocabulary sweep (#73) — done, ten images.** Sixth–tenth (`7eb021f210`, failed `f72d1f4981`, `3bfa0b4e33`→`7eb021f210` sync-row line, `b6b46e0507` connected page + dialog, `684ce7f16c` match row, `2a460ce125` seven-line transfer page + BIOS with the tier, **`2e33f6b2be` tidy-up gate**) all from the maintainer's screen review. Decisions: D-UI-023 (two lines per row; a description that would make a third moves into the confirmation dialog), D-UI-024 (the seven-line transfer page; scripts announce each system with `>>> unit <system>|<i>|<n>`), D-CLOUD-042 (`Saves-discarded`; split root refused), D-CLOUD-043 (BIOS is not a system; comes with the tier), D-QA-007 (VM first), **D-QA-008 (never reboot without asking — after I rebooted the RG SP during a restore; blindspot 29)**. Issues #74 (fixed, first criterion ticked), #75 (settings-backup picker, under #18). The tidy-up row bug was pre-existing: `runSystemCommand` returns 0 regardless. **The vocabulary sweep (#73) — first image, both devices:** Five images: `7b60fadaec` (sweep), `c78e6dea21` (never deployed), `27d1734555`, failed `f72d1f4981`, **`3bfa0b4e33` (current)**. Kept under `/workspace/artifacts/rocknix-images/`. Screen review added D-UI-023 (two lines per row, never three; a description that would make a third line moves into the confirmation dialog): hub row → MANAGE CLOUD STORAGE over its section names; sync row one line; saves rows keep how they last went; transfer-page tier rows keep what they carry; match row the same; tidy row says settings backups. Issues #74 (cloud-folder change nested settings backups — fixed) and #75 (choose which settings backup to restore, under #18). The RG SP is `rgsp` (192.168.1.175), keyed like `rg35xxsp`; both LPDDR facts confirmed from hardware.

- `docs/cloud-vocabulary-audit.md` — the audit (the "system backup" holds
  settings only; backup names both an artifact and a direction; every backup
  artifact that ever shipped, §7).
- Distribution `24dce33f23`, `b1e8d1f646`, `07296bbe64` (all on `next`):
  keys → `SAVESPATH SETTINGS_BACKUPS SAVES_REMOTE SETTINGS_REMOTE CONTENT_REMOTE`;
  `cloud_sync_helper` migrates once + moves the settings rows' stamps (harness-proved,
  idempotent); RESTOREPATH refused if split; helper runs before `source`;
  archive `<date>-ROCKNIX_SETTINGS.tar.gz`, three old names still read;
  wizard IA rev 5; rules + changelog + live docs renamed.
- EmulationStation `d161afb2b` → merge `2045c4d33c` on `test/qa-integration`
  (pinned): SETTINGS / SAVES tiers, back up / restore verbs, bundle names its
  parts, "cloud library" → ROMs and BIOS, stamps follow, `info["SAVES_REMOTE"]`.
  **Only one** of four `"SYSTEM SETTINGS"` was the cloud tier.
- **Image**: `ROCKNIX-H700.aarch64-20260906-{DDR4,DDR3}.img.gz` + `.tar`,
  BUILD_ID `7b60fadaec`, in `devices/target/` and kept at
  `/workspace/artifacts/rocknix-images/`. Verified in the build root: 5 new
  strings in the ES binary, 0 old; `cloud_backup` has SAVESPATH ×10, BACKUPPATH ×0;
  defaults carry all three new remote keys.
- **Not in that image**: `07296bbe64` (#74 fix) landed after the build started.

**Issues filed:** #71 (a user-edited RCLONEOPTS drops the allowlist — verified),
#73 (the sweep; progress comment posted), #74 (CHANGE CLOUD FOLDER nested the
settings backups inside the saves folder and stranded the ROMs folder — fixed
on `next`, rides the next image). #25 carries the restore tool's shape.
>>>>>>> next

## In Progress

- **The milestone audit** (`docs/audits/2026_09_24-milestone-rc-round-since-186/`): the Fable agent finished Phase 1 (research notes with the mechanical checks: 28/28 pkgcheck, scripts harness PASSED, unit tests 119/1302, register/vocabulary/menumap/untranslated clean, msgfmt clean via the build root, guest d on the tip) and was stopped by the account's monthly spend limit (HTTP 429) at ~02:35 UTC; after the maintainer's `/login` it was resumed by SendMessage at 03:00 with orders to do Phases 1.6-5 itself (no more subagents) and to read `date -u` before each log entry (its earlier stamps ran ahead of the clock). Its Phase 1 leads to expect in the punch list: raofflineproxy 16 commits behind upstream and unpinned (D-WORKFLOW-024); `tools/es-syntax-check --tree` false-positive redefinitions on two RA translation units (same-directory includes); two in-range non-ASCII comment characters (GuiScraperRun.cpp:177, .h:38); three stale "WI-FI SSID row" comments after D-UI-071; the four new tools missing from `instruction-files.md`'s table; the change log's last section headed 2026-09-22 carrying later days; #186's punch index without Phase 7 outcomes; a `cloud_capture --retire --unlink` lead (deletion proceeds when the record fails). When it returns: verify, lint, the Phase 6 issue, resolve at every severity (an eighteenth cut if code changes; VM first), Phase 7 from commands.
- **This worktree's rules were stale** (eleven files behind `next`) for the whole session; merged up to `next` at 03:05 (friction line, #254).
- The RG35XX SP runs the seventeenth `443028ff7a`; the maintainer's boxes on it stand.

## Next Steps

1. On `chain-17.done`: RECORD.txt's VMQA_RESULT; the QA row for `443028ff7a` (runs 32/21, vm-qa 23, rehearsal 18); the sixteenth's RECORD marked superseded; commit/push; ask the maintainer for the copy and the reboot of the RG35XX SP (D-QA-011). On the yes: `stage-rg35xxsp-443028ff7a.sh`, then the reboot through `tools/device-act`; BUILD_ID + empty queue; `tools/frame-diff accept <run23>/walks walk-baseline --build 443028ff7a` once on the device; RECORD, QA row, #236 box, work log.
2. **The code audit** with the `code-auditor` skill (Milestone tier: the work since #186, 2026-09-14 -> the seventeenth cut), comment quality in scope; audit agents on Fable 5.1 (memory `audit-subagents-run-on-fable`); `tools/lint-audit-artifacts` before its Phase 6; the punch list fixed at every severity (D-WORKFLOW-015) and tested on the VM before any device build (D-WORKFLOW-016). Also the retro due ~09-26 and the 2026-W39 summary by 09-29 (`tools/ceremony-check`).
3. **Every session**: `tools/ceremony-check` first; `tools/archaeology <terms>` before anything is called pending; a friction line when something slows; `tools/work-log-index --write` after a log entry. Never edit a shell tool while a run of it is in flight. A stem measurement compares the same text span on every size.
4. The maintainer's device boxes on the seventeenth: #251 (the toast reads), #209 (the save shortcut), #198 (a password with a space), #250, #249, #245, #246, #243; then the RG SP (D-QA-031), the Nova. #252 box 3b; #253's four-week box; #255, #256 later; #42 (docs) before the upstream PRs.

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| `tools/frame-diff` | Created | compare / accept / boxes; stdlib PNG; masks; claims keyed by baseline build |
| `tools/vm-qa` | Modified | `frame-diff` suite; SKIPS; `ensure_manager_fixture`; the cloud reset before seeding |
| `tools/vm-walks/{suite.txt,masks.txt,claims.txt,manager.steps,fixtures/*,README.md}` | Modified/Created | the manager walks; default-pre; the two steering files |
| `.githooks/pre-push`, `.claude/rules/fork-workflow.md` | Modified | `tools/frame-diff` in the fork-only list |
| `.claude/rules/generic-x64-vm-testing.md` | Modified | § "The frames are compared, not only counted (#252)" |
| `docs/decision-register.md` | Modified | D-QA-038 decided; D-RA-006 kept under the open table |
| `docs/cloud-sync-changelog.md` | Modified | #250 and #252 lines |
| `docs/vm-qa-log.md` | Modified | the fifteenth's row; the #252 runs' row |
| `docs/qa-frames/2026-09-23/` | Modified | `250-*` and `252-*` frames + README sections |
| `docs/work-logs/2026_09-work_logs/2026_09_23-work_log.md` | Modified | entries 05:05 .. 18:35 |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `834bf069c` (`aa8d525a8a`) |

## Related Context

- **Tracker**: #250 (box 1 ticked; box 2 the maintainer's), #251 (open, the maintainer's call), #249 (device half open), #248 (done on the device), #245/#246/#243 (device halves), #236 (round page), #247
- **Register**: D-UI-080, D-UI-081, D-UI-082, D-QA-037
- **Artifacts**: `h700-all-20260923-aa8d525a8a/` (candidate), `h700-all-20260923-c0c2d15179/` (staged on the device, to be superseded), `qa-aa8d525a8a-webdav-a-20260923-0506/`
- **Session scripts** (`/workspace/tmp/rocknix-session/`): `chain-250.sh`, `proof-243d.sh <outdir> "fbn nes gb"`, `measure-243.py`, `arrow-bbox.py` (the arrow's box in the START NEW GAME tile; fails on a frame whose first tile is unselected), `compare-region.py a b 8 262 156 436`, `stage-rgsp-aa8d525a8a.sh`, `record-h700-run19.sh` (copies + SHA256SUMS only; RECORD.txt is written by hand)

## Notes for Next Session

- **A must-not-change assertion's "before" is the build before the first change of the series**, not the previous cut: the fifth cut was already wrong for the arrow on 4:3 systems. Pre-#243 manager frames live in `docs/qa-frames/2026-09-1[5-7]/` and `2026-09-21/195-save-state-manager-24h-640x480-77e7e97515.png`.
- `freeslot.svg` is a 612x792 box with a 391x314 arrow; at its own shape the arrow's box is about 1.25:1 (54x43 at 640x480, selected tile).
- The FBNeo system is `fbn`; `arcade` is mame2003_plus. `StartupSystem=<name>` with essway stopped lands the carousel; `imageviewer` is not honoured. ES Info logs need `Debug=true`; `/var/log/es_log.txt` is tmpfs on the VM.
- One chain per image; no x64 build while vm-qa runs; the reboot is a question every time, by device.

## Open Questions

- The transfer and the reboot of the RG35XX SP for the fifteenth (asked 05:50 UTC and again at 16:20; the device is on, on the fourteenth).
- The walk baseline is the fifteenth's own frames (run 20) because the thirteenth's x64 image is gone; said so in BASELINE.txt and on #252.
- #251: which option, if any.

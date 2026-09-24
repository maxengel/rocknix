# Saved Session State

> **Saved**: 2026-09-24T05:00:00Z
> **Branch**: feature/conflict-resolution (this worktree holds only the session state; the work is on `next` in the primary checkout `/workspace/repos/rocknix`, head `e5065e18ee` + UNCOMMITTED #252 work: `tools/frame-diff`, `tools/vm-qa`, `tools/vm-walks/{suite.txt,masks.txt,claims.txt,manager.steps,fixtures/,README.md}`, `.githooks/pre-push`, `.claude/rules/{generic-x64-vm-testing,fork-workflow}.md`, `docs/{decision-register,cloud-sync-changelog}.md`, the work log)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

Closing audit #258's punch list (thirty items, D-WORKFLOW-015: every severity before the candidate is called one). Everything is fixed and committed on `next` (`efb8aec861` code, `d52e3d81c7` tools/record, `6840c8ea6f` bodies, `8f2803a080`, `c8609558d4` rules+tools, `201c94df21` record); the nineteenth cut `c8609558d4` (ES `4fd019f04`: SIGINT through the main loop, the screenshot cache holds the game) is building in `chain-19.sh` (x64 run 34, H700 run 23, guest d rebuild, vm-qa run 25 with the new `fresh` and `wrapper` suites, rehearsal run 20 with the new tool). The eighteenth `a84fce38a6` passed everything (run 24: 13 suites, frame-diff 0, rehearsal 19/19) but its SIGINT path crashed in exit()'s teardown on guest d, hence the nineteenth.

## Completed This Session

- Audit #258 filed and its Phase 6 issue created; #259 filed (the proxy bump after the RC); D-CLOUD-135, D-UI-085, D-RA-028, D-SYS-009, D-WORKFLOW-029/030 rows; the change log's audit section; the QA-log row for `a84fce38a6`; four work-log entries.
- PL-001..PL-030 fixed (see the commits above); guard positives recorded (nodownload, INDEX warning, red CI run 35956388686, wrapper test, archaeology terms, register-check placeholder, es-syntax-check, es-menu-map-check, ceremony-check guard/retro/hygiene, lint index-vs-table, fresh suite FAIL on 443028ff7a).
- Frames filed under `docs/qa-frames/2026-09-24/`: #192 startup card EN/FR (checking, sending, offline-skipped), #203 FR launch question, #252 manager-gb; the `WAITING FOR A NETWORK` line found unreachable (D-CLOUD-072) and recorded on #192.
- Fourteen issue bodies edited under the tick rule; #131/#225 restored byte for byte after the hygiene proof.

## In Progress

- **chain-19** (started 04:56): when `chain-19.built` exists, run `$CLAUDE_JOB_DIR/tmp/proof-019.sh $CLAUDE_JOB_DIR/tmp/screenshot-turn.steps` on guest d (PL-019's synthetic-line proof: the screenshot turns without a restart) and re-run `kill -INT` on guest d (expect a clean quit, `status=130`-ish, no SIGSEGV). When `chain-19.done`: read run 25 (`wrapper` PASS, `frame-diff` 0 against the `443028ff7a` baseline -- or accept the new frames if the audit's changes moved a walked screen), rehearsal run 20 PASS (PL-030's proof with the new tool), record the H700 artifacts (`record-h700-run22.sh` writes `h700-all-<date>-<id>`; write RECORD.txt), mark `h700-all-20260924-a84fce38a6` superseded.
- **Phase 7**: write the `# Phase 7 resolution gate` table into `05-punch-list.md` (30 rows, last cell Resolved/Deferred with commit or command) and the YAML outcomes; `tools/lint-audit-artifacts <folder> --issue 258` exit 0; tick #258's boxes with evidence; close nothing without the maintainer (the RC call is theirs).
- **PL-025 remainder**: #182's 1280x800 dimmed-rows frame (guest b fresh, no cloud, after the chain releases the pair); #193's 1280x800 + online frames need the QA RA account seeded on a 1280x800 guest -- record on the box if not done.
- **Then ask the maintainer** for the copy and the reboot of the nineteenth onto the RG35XX SP (D-QA-011), naming the device; never stage without the yes.

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

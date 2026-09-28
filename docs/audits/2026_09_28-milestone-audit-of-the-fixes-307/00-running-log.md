# Milestone Audit Running Log -- the audit of the fixes (#307 / #308), D-WORKFLOW-057

**Auditor:** Code Auditor skill (milestone tier; the seats are the council's Claude and GPT, D-QA-048)
**Started:** 2026-09-28T04:20:24Z
**Scope:** the eight fix streams' delivered diffs -- the distribution `417dcd8610..next` by the paths each stream owned, EmulationStation `7eae8ed91..c0f4f4da0` split core/application -- against the plans they executed (#307's items with their verdicts and acceptances, #308's rows)
**Spec:** `docs/audits/2026_09_25-milestone-rc-round-since-258/05-punch-list.md` (the acceptances), the streams' briefs and reports

---

## Log Entries

### [Phase 0-1] 04:20 -- folder, packets, dispatch

Eight packets under `seats/`, one per stream: the stream's diff, its plan (the brief it executed, with every item's verdict and acceptance), its harness block (distribution streams) or its unit tests (in the ES diff), its report, and the rule files. Sizes: {"A": {"diff": 160898, "sources": 8}, "B": {"diff": 116050, "sources": 8}, "C": {"diff": 70719, "sources": 8}, "D": {"diff": 103881, "sources": 8}, "F1": {"diff": 122556, "sources": 8}, "F2": {"diff": 93305, "sources": 8}, "E1": {"diff": 201032, "sources": 9}, "E2": {"diff": 273878, "sources": 9}}. Sixteen calls dispatched buffered through the Facilitator on OpenRouter (D-WORKFLOW-049); every packet under 500 KB (the split rule from yesterday's bucket 8). The fix build (chain-86) runs in parallel; the seats read code, the chain runs the QA.

### [Phase 2] 04:25 -- sixteen seat calls running

Two false starts before the calls ran: a dispatch loop the harness refused for an unguarded `rm -f` of a variable path, and manifests whose source paths were relative to the audit folder rather than the repository root (the Facilitator reads paths from the repository; `[FAIL local_config_error] ... could not be read`). Repathed, re-dispatched at 04:24 UTC, all sixteen processes up; a waiter on the rc files. The chain's vm-qa run 68 is in progress beside them (x64 run 86 and H700 run 64 both built; guest d is on the new image and read clean: no Read-only file system lines, the serial unit's condition met, no bootloader directory, no MiniBrowser, zip present, the retired quirk files gone, the rules file whole; the build log's five rotation tables at 852/1923/2543/1642/2180).

### [Phase 2] 04:48 -- the fix build's chain finished; vm-qa run 68 read

chain-86 rc 0 (x64 run 86 03:48-04:02, H700 run 64 04:02-04:21, both kept under 4234be0b6b; the tree is 6f9d43a467 on the rewritten next). vm-qa run 68 (`qa-4234be0b6b-webdav-a-20260928-0422`, 04:22-04:42) NOT A PASS: 12 of 15. scripts FAIL (2) -- the harness's own refusal ("SIGINT is ignored in this process"), a launch defect in `tools/vm-qa`'s `run_suite`, not the streams'; round-trip FAIL (1) -- two steps, both stream A's contract (PL-020's catch-all check applied to a player's own `--filter-from`; `--match --apply` with no check before it, D-CLOUD-141); frame-diff FAIL (1) -- 14 boxes against d72084ccad. proof-298 on guest d 35 PASS, 0 FAIL: the offline achievements' phases hold on the fix build.

### [Phase 2] 05:00 -- the frames judged; vm-qa fixed; the round-trip steps routed

Baseline and new frames read for the five screens. Eleven boxes are the cut's changes and are claimed (`tools/vm-walks/claims.txt`, next 78f147f762): the CHANGE CLOUD FOLDER line (ES 39d5a9d6d, F-ES-14), the transfer footer without a console letter (ES 5a7afc4ca, F-RA-14/F-CS-07), the PICO-8 row for a system whose only file is the 0-byte Splore.png (ES 52ba93160, 8a gpt F-ES-10; the row reads 1 FILE NOT YET IN YOUR CLOUD, the count carrying the line as the code intends). Three boxes are a defect: e98bfda4b reopens the hub after a folder change so the row's line names the new folder, and the reopened page opens at its first row with CHANGE CLOUD FOLDER scrolled off; the walk's next A press opened the back-up page. Orchestrator finding G-E2-O1, routed to stream E2 (least surprise, D-UI-042). vm-qa's scripts launch now execs the harness through python3 with SIGINT reset; proven from a shell background job 04:47-04:51, 844 PASS. Both round-trip steps to stream A with the tool's lines. Records: RECORD.txt for both images, the QA log row (next).

### [Phase 2] 05:05 -- F1 and F2 follow-ups delivered

F2: 19 findings, 14 fixed, 5 withdrawn (claude G-F2-01 the packet gap, as briefed; G-F2-07 F1's commit; G-F2-09 upstream parity; gpt G-F2-02 and G-F2-07 are stream D's files, handed to D), five commits on feature/pl-f2, harness 437 PASS. F1: 18 findings, four commits on feature/pl-f1, harness 447 PASS; claude G-F1-08 withdrawn by the stream (the loopback command cannot be gated on an address that does not exist when the quirk runs; the README note stands for a developers' tool, D-QA-053) -- accepted by the orchestrator: the fix would break UTM's default mode on an assumption nobody here can check. F1's part (a) of G-F1-02 decided the other way (the shipped 640x480 and 0x0 follow the mode with a record present, because RESET RETROARCH CONFIG TO DEFAULT leaves exactly that) -- read, sound, with a test case. Both to merge next; A, B, C, D, E1, E2 still working.

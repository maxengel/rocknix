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

# Research -- the audit of the fixes (#307 / #308)

**Auditor:** Code Auditor skill
**Date:** 2026-09-28
**Subject:** what eight fix streams delivered against the plans this lane wrote from the milestone audit (D-WORKFLOW-054..057)
**Spec:** `../2026_09_25-milestone-rc-round-since-258/05-punch-list.md` (81 items, each with an acceptance), #308's 297 rows, the streams' briefs (`../2026_09_25-milestone-rc-round-since-258/streams/briefs/`) and reports (`streams/reports/`)

---

## Running Notes

### 1.1 The spec is the punch list's acceptance lines

Each item's acceptance names its artifact (a harness case, a unit test, a guest frame or line); the seats judge the diff against the item's verdict (mechanism and lines) and its acceptance, and this lane runs the artifacts the VM can produce on the built image (`proofs-307.md`).

### 1.2 The ranges

Distribution: `417dcd8610..next` after the history rewrite of 2026-09-28 04:0x UTC (the tree is identical to the pre-rewrite head `build/4234be0b6b`). EmulationStation: `7eae8ed91..c0f4f4da0` on `test/qa-integration`, pushed; the pin bumped in `4e858bebe8`'s twin on the rewritten history.

### 1.3 Prior audits

`../2026_09_25-milestone-rc-round-since-258/` is the audit these fixes answer; its verification section holds the verdicts the plans carried. Two of its calls were wrong (F-RS-04 for `cloud_remote`; gpt F-CS-02 missed) and are corrected there.

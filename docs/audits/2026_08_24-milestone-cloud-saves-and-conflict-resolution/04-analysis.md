# Analysis — Cloud Saves + Conflict Resolution

**Auditor:** Code Auditor skill (v1.8, ROCKNIX-adapted)
**Date:** 2026-08-24
**Subject:** cloud-saves scripts + conflict-resolution epic #11
**Spec:** GitHub issues on maxengel/rocknix

---

## Running Notes

## 1. Executive summary

Two epics audited: the cloud-saves work on `feature/cloud-saves` (20 commits,
12 files) and the conflict-resolution epic #11 (#19–#25, design stage).
`backuptool` hardening was excluded by direction.

**The cloud-saves code is in better shape than its tracker.** The
highest-consequence rules hold and were verified by execution rather than
reading: `cloud_restore` still strips `--delete-excluded` (whose absence would
delete a user's entire non-save library on a sync restore), `--verbose` is
stripped from user configs, and a full backup→restore round trip on a live
device returns four fixtures byte-identical, nested paths and spaces included,
with the allowlist holding.

**The failures are in the record, not the runtime.** One of #26's nine ticked
progress items was never functional — content backup downloaded instead of
uploading, shipped that way in four published images, and was ticked with a
commit hash as its evidence. The published rocknix.org documentation still
teaches the SSH-console workflow the wizard was built to replace. And every
conflict-resolution decision taken this week lives in issue comments while the
acceptance criteria in the issue bodies still specify the superseded design.

**The common thread is evidence substitution.** In each case something
authoritative-looking stood in for proof: a commit hash for a behaviour, a
document's existence for its accuracy, a comment for a criterion. The code
held up under adversarial testing; the artifacts that describe the code did
not.

## 2. Acceptance-criteria scorecard

### #26 — fresh-handheld journey (9 ticked items, re-derived)

| AC | Claim | Verdict |
|---|---|---|
| AC-01 | Setup without SSH-console hop | PARTIAL ⚠ (code yes, docs contradict) |
| AC-02 | System settings restore | PARTIAL ⚠ (surfaces verified, reboot cycle not re-run) |
| AC-03 | Content restore | **PASS ✓** (device, isolated) |
| AC-04 | Saves/states/screenshots download | **PASS ✓** (device, byte-identical) |
| AC-05 | Content upload | **FAIL ✗** |
| AC-06 | One-touch RESTORE EVERYTHING | PARTIAL ⚠ |
| AC-07 | One-touch BACK UP EVERYTHING | PARTIAL ⚠ |
| AC-08 | Cloud folder editable from ES | **PASS ✓** |
| AC-09 | Three-class scope descriptions | **PASS ✓** |

**4 PASS / 4 PARTIAL / 1 FAIL — 44% fully verified against 100% ticked.**

### #11 conflict resolution — 36 AC across #19–#25
All **SKIP ○ — not started** (design stage, by intent). Not a finding.

## 3. Risk assessment

| Risk | Severity | Note |
|---|---|---|
| Users following published docs never find the wizard | High | F-02; actively wrong beats missing |
| Conflict wizard built to superseded ACs | High | F-04; wasted implementation, and a screenshot panel that cannot exist for `.srm` |
| Content backup still broken on every shipped image | High | F-01; fixed in `f60ea2b8f8`, unreleased |
| Test suite masks one bug behind another | Medium | F-03 |

## 8. Coverage boundary

**Examined:** the 12 changed files on `feature/cloud-saves`; #26/#33/#34 and
#11/#19–#25 bodies; the three `rclone-cloud-sync` invariants (run); a full
round trip on a live GENERIC_X64 VM; content restore in isolation; the
rocknix.org checkout; the ES seam for all seven `cloud_setup` flags.

**Deliberately NOT examined:** `backuptool` (user-excluded); the ES cloud UI
as a UI (no visual QA run this session); #33 and #34, which are unstarted and
whose ACs are therefore vacuously unmet; the reboot-spanning journey
continuation at runtime.

**Verification depth:** AC-03/04 mechanical on device. AC-08/09 source, both
sides of the seam. AC-01 source plus a docs cross-check. AC-02/06/07 source
only — stated as such rather than inferred upward.

## 10. Quality self-check

| Section | Present |
|---|---|
| Executive summary | ✓ |
| AC scorecard | ✓ |
| Conformance (3 faces) | ✓ (03-retrospective.md) |
| Cross-system interaction | ✓ (03, § 3.5) |
| Risk assessment | ✓ |
| Coverage boundary | ✓ |
| Instruction-file recommendations | ✓ (below) |
| Code-quality assessment | ○ — deliberately thin; the defects found were behavioural and record-keeping, not structural |

## Instruction File Recommendations

### Coverage gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
|---|---|---|
| F-01 | (none) — no rule requires behavioural evidence before ticking an AC | **YES** |
| F-02 | `documentation-accuracy.instructions.md` § hard gate | — (rule exists, not followed) |
| F-03 | (none) | **YES** |
| F-04 | (none) — no rule requires ACs be reconciled when a decision supersedes them | **YES** |

### Codification gaps (needs-new-rule)

| Pattern | Instances | Recommendation |
|---|---|---|
| P-01: an artifact's existence substituted for evidence of its behaviour or accuracy | F-01, F-02, F-04 | **New blindspot-register entry 13, "assumed-done"** — the mirror of entry 1. Plus a line in `issue-tracking.instructions.md`: a checkbox is ticked on observed behaviour, never on a commit hash |
| P-02: decisions recorded where the contract is not | F-04 | **Extend** `issue-tracking.instructions.md`: when a comment supersedes an AC, edit the body in the same action |

## 9. Finding verification (Phase 4.5)

Each Critical/High finding was attacked, not confirmed.

**F-01 — refutation attempted, survives.** Hypothesis: the upload failed
because `CONTENTPATH` was unset (an S3 bucket-path issue, #38), not because
the direction was inverted. Refuted twice: with `CONTENTPATH` correctly set
the original still uploaded nothing, and the *fixed* script under the same
config uploaded all three fixtures. Direct evidence from the originating
commit `5bb6c30984:83-92` — `SRC="${ROOT}${DIR}"` (remote),
`TARGET="${DEST}/${DIR}"` (local), `echo "Restoring … from the cloud"`. The
direction was wrong at birth. **CONFIRMED.**

**F-02 — refutation attempted, survives.** Hypothesis: the wizard is
documented on a page I did not search. Refuted by a site-wide grep for every
shipped surface name (SET UP CLOUD REMOTE, RCLONE SERVICES, CLOUD FOLDER,
CLOUD TOOLS, BACK UP / RESTORE EVERYTHING) — **zero files match**, and only
two files on the entire site mention rclone at all. **CONFIRMED.**

**F-04 — refutation attempted, survives.** Hypothesis: the body was updated
and I read a cache. Refuted — fetched live via `gh issue view`. Second
hypothesis: comments are the contract. Refuted — the `- [ ]` acceptance
criteria live in the body, and the body is what a task list renders from.
**CONFIRMED.**

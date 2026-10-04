# Punch list — guarded host swap helper

Scope: independent Issue410 audit; five confirmed improvements, all resolved.
Zero Critical/High confirmed findings. Installation remains tracked separately.

## PL-001: Bind negative-control evidence to the final test suite

- **Severity:** Medium
- **Category:** Test Gap
- **Source finding:** Anthropic F2
- **Owner area:** build-host maintenance
- **Where:** evidence/negative-memory-guard.log
- **What / why:** Run the final35-test suite normally and against the memory-guard-removed variant; retain hashes and both results.
- **Evidence / acceptance:** final-tests.log:35PASS and final-negative-memory-guard.log:35 tests/2 expected FAIL; retained before/after logs.

## PL-002: Keep the shared lock outside a writable directory

- **Severity:** Low
- **Category:** Interaction Defect
- **Source finding:** Anthropic F3
- **Owner area:** build-host maintenance
- **Where:** tools/host-maintenance/reclaim-swap:17; install:16
- **What / why:** Use root-owned /run directly and reject a writable lock parent before open.
- **Evidence / acceptance:** writable-lock-parent regression refuses and real flock exclusion still passes; retained before/after logs.

## PL-003: Refuse READY when swap is inactive

- **Severity:** Low
- **Category:** Interaction Defect
- **Source finding:** Anthropic F4
- **Owner area:** build-host maintenance
- **Where:** tools/build-preflight:88
- **What / why:** Default and opt-in preflight must report recovery required without activating swap.
- **Evidence / acceptance:** inactive-swap fixture returns1 for both modes, no helper call; retained before/after logs.

## PL-004: Tolerate a process disappearing during observation

- **Severity:** Low
- **Category:** Code Quality
- **Source finding:** Anthropic F6
- **Owner area:** build-host maintenance
- **Where:** tools/host-maintenance/reclaim-swap:87
- **What / why:** Treat ESRCH like ENOENT while retaining fail-closed permission errors.
- **Evidence / acceptance:** ProcessLookupError/FileNotFoundError cases pass, PermissionError still refuses; retained before/after logs.

## PL-005: Continue rollback after one restoration fails

- **Severity:** Low
- **Category:** Code Quality
- **Source finding:** Anthropic F7
- **Owner area:** build-host maintenance
- **Where:** tools/host-maintenance/install:102
- **What / why:** Attempt both restorations and final validation, clean staged rollback files and report incomplete recovery.
- **Evidence / acceptance:** injected policy replacement failure restores old helper, performs fourth validate call and leaves no temp; retained before/after logs.

## Rejected or unconfirmed leads

F1 (High) is refuted by actual host priority -1; F5 timeout claim lacks a
host measurement. Full grading is in04; neither is a disguised deferred defect.

## Pre-existing tracked scope (not punch items)

- #410: administrator installation, root include/permission readback and safe-idle actual recycle/timing.
- #383/#409: running cold image build, VM qualification and remaining release checks.

## Phase 7 resolution gate

| Item | Outcome |
| --- | --- |
| PL-001 | Resolved #410; final35-test negative/PASS receipts and final-source-hashes.json |
| PL-002 | Resolved `8c448fcb35`; before/after regressions and final35-test receipt |
| PL-003 | Resolved `8c448fcb35`; before/after regressions and final35-test receipt |
| PL-004 | Resolved `8c448fcb35`; before/after regressions and final35-test receipt |
| PL-005 | Resolved `8c448fcb35`; before/after regressions and final35-test receipt |

Code existence verified with git log and branch --contains. Receipt files read
directly; no issue or live-installation status is inferred from memory.

## Machine-readable index

```yaml
punch_index:
- id: PL-001
  severity: Medium
  category: Test Gap
  source_finding: F2
  owner_area: build-host maintenance
  where: "evidence/negative-memory-guard.log"
  acceptance: "final-tests.log:35PASS and final-negative-memory-guard.log:35 tests/2 expected FAIL"
  outcome: resolved
- id: PL-002
  severity: Low
  category: Interaction Defect
  source_finding: F3
  owner_area: build-host maintenance
  where: "tools/host-maintenance/reclaim-swap:17; install:16"
  acceptance: "writable-lock-parent regression refuses and real flock exclusion still passes"
  outcome: resolved
- id: PL-003
  severity: Low
  category: Interaction Defect
  source_finding: F4
  owner_area: build-host maintenance
  where: "tools/build-preflight:88"
  acceptance: "inactive-swap fixture returns1 for both modes, no helper call"
  outcome: resolved
- id: PL-004
  severity: Low
  category: Code Quality
  source_finding: F6
  owner_area: build-host maintenance
  where: "tools/host-maintenance/reclaim-swap:87"
  acceptance: "ProcessLookupError/FileNotFoundError cases pass, PermissionError still refuses"
  outcome: resolved
- id: PL-005
  severity: Low
  category: Code Quality
  source_finding: F7
  owner_area: build-host maintenance
  where: "tools/host-maintenance/install:102"
  acceptance: "injected policy replacement failure restores old helper, performs fourth validate call and leaves no temp"
  outcome: resolved
```

Audit tracker: [#411](https://github.com/pixelelated/distribution/issues/411).
Parent [#410](https://github.com/pixelelated/distribution/issues/410) retains host rollout.

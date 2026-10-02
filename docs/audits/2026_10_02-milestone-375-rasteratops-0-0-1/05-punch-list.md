# Punch list — Rasteratops 0.0.1 readiness

**Generated:** 2026-10-02. **Tracker:** [#382](https://github.com/rasteratops/distribution/issues/382). **Source:** [analysis](04-analysis.md), request #375.
**Total:** 6 audit-discovered findings (0 Critical, 2 High, 2 Medium, 2 Low).

The audit is complete; the release is not qualified. Five product findings have
explicit open 0.0.1 follow-ups. The report-quality finding is resolved. A recorded
Deferred outcome closes the audit’s tracking obligation, not the bug or the
release gate. No product code changed during review.

## Instructions for the executing agent

Read the linked source/probes and #365’s table before fixing these. Run the
regression on the unchanged snapshot as a negative control, then fix and verify
on GENERIC_X64. Preserve existing archives, pointers and intentional choices.
The host reproductions are leads for VM regressions, never candidate PASS stamps.
See 04 for the complete ordered build route; do not duplicate tracked scope.

## PL-001: OS-name archive compatibility

- **Severity:** High
- **Category:** Interaction Defect
- **Source finding:** F-01
- **Owner area:** cloud scripts / migration and release identity
- **Where:** `cloud_scan:219; cloud_restore:2125,2143; cloud_backup:2387; backuptool:143–167` (scripts under `projects/ROCKNIX/packages/network/rclone/sources/`; backuptool under `projects/ROCKNIX/packages/rocknix/sources/scripts/`; ES in its separately pinned repository).
- **What / why:** Preserve discovery, restore and retention of old archives across the approved OS rename; use a stable suffix or deliberate compatible readers.
- **Evidence:** archive-identity-probe.log shows the same legacy name selected for ROCKNIX and invisible for RASTERATOPS. Conditional future identity transition, not run101 data loss.
- **Acceptance:** Final branded guest restores its own RC2 cloud/local archive, with selected filename and sentinel hashes retained.
- **Tracking:** [#376](https://github.com/rasteratops/distribution/issues/376). Cross-reader persisted-format change requires the pending branded image and RC2 upgrade proof; remains a 0.0.1 blocker.

## PL-002: Scan the per-device archive directories the writer uses

- **Severity:** High
- **Category:** Interaction Defect
- **Source finding:** G-13
- **Owner area:** cloud scripts / migration and release identity
- **Where:** `cloud_backup:2037; cloud_scan:210; cloud_restore:2020–2098; ES GuiMenu.cpp:4855–4862` (scripts under `projects/ROCKNIX/packages/network/rclone/sources/`; backuptool under `projects/ROCKNIX/packages/rocknix/sources/scripts/`; ES in its separately pinned repository).
- **What / why:** Make opening-scan selection agree with the production writer and restore reader, preserving existing device/legacy selection boundaries.
- **Evidence:** reviewer-archive-path-probe.log: full production scan plus real host rclone1.60.1-DEV yields MINE empty/COUNT0 for writer-shaped archive; identical flat-root control is found.
- **Acceptance:** A production backup on the candidate becomes selectable in the UI and restores the exact archive; current/legacy/healed/foreign-only and flat fixtures are checked.
- **Tracking:** [#381](https://github.com/rasteratops/distribution/issues/381). Changing archive discovery and selection needs a product patch and complete VM backup→scan→restore regression; remains a 0.0.1 blocker.

## PL-003: Keep failed bucket listings distinct from absence

- **Severity:** Medium
- **Category:** Code Quality
- **Source finding:** F-02
- **Owner area:** cloud scripts / migration and release identity
- **Where:** `cloud_backup:809–825,1677–1685; cloud_restore:811–817,1676–1725` (scripts under `projects/ROCKNIX/packages/network/rclone/sources/`; backuptool under `projects/ROCKNIX/packages/rocknix/sources/scripts/`; ES in its separately pinned repository).
- **What / why:** Preserve present/absent/error across bucket predicates and callers; inspect features-query failures too.
- **Evidence:** bucket-unknown-probe.log: lsd0, bucket true, lsf5 becomes an absence offer with exit0; restore sibling source has the same predicate.
- **Acceptance:** Reachable synthetic bucket backup fault and S3 restore fault retain sentinel hashes, report truthfully and retry; ordinary S3 backup fixture is not branch evidence.
- **Tracking:** [#377](https://github.com/rasteratops/distribution/issues/377). Paired production helper/caller fix needs fault-injected VM regression and timing control; remains in 0.0.1.

## PL-004: Preserve settings-only archives across follow and settle

- **Severity:** Medium
- **Category:** Interaction Defect
- **Source finding:** G-02
- **Owner area:** cloud scripts / migration and release identity
- **Where:** `cloud_migrate_layout:814–816,880–882` (scripts under `projects/ROCKNIX/packages/network/rclone/sources/`; backuptool under `projects/ROCKNIX/packages/rocknix/sources/scripts/`; ES in its separately pinned repository).
- **What / why:** Inspect and preserve the independent Backups tier before publishing a new settings pointer. Keep --apply’s existing copying path distinct.
- **Evidence:** reviewer-layout-probe.log: complete script changes SETTINGS_REMOTE without querying or copying the old archives, on follow and settle.
- **Acceptance:** VM settings-only fixtures remain discoverable/restorable after setup and follow, with pointers and archive hashes; late settings writer and custom/kept controls pass.
- **Tracking:** [#379](https://github.com/rasteratops/distribution/issues/379). Requires tier-aware migration behavior and whole-flow VM proofs, beyond the read-only audit; remains in 0.0.1.

## PL-005: Preserve explicit cloud-root content selection

- **Severity:** Low
- **Category:** Interaction Defect
- **Source finding:** G-10
- **Owner area:** cloud scripts / migration and release identity
- **Where:** `cloud_setup:755–763; cloud_migrate_layout:114,819,883,1052,1224–1227` (scripts under `projects/ROCKNIX/packages/network/rclone/sources/`; backuptool under `projects/ROCKNIX/packages/rocknix/sources/scripts/`; ES in its separately pinned repository).
- **What / why:** Distinguish absent CONTENT_REMOTE from a present empty root choice in every migration actor and reconcile conflicting fixtures.
- **Evidence:** reviewer-layout-probe.log: explicit empty root is replaced; named /Mine/ROMs control stays unchanged. Existing seeding test defines empty as a choice.
- **Acceptance:** Missing, empty, derived and custom configurations have consistent join/follow/settle/apply results; candidate scan restores original root sentinel.
- **Tracking:** [#380](https://github.com/rasteratops/distribution/issues/380). Cross-reader config representation change needs migration/VM coverage; tracked in 0.0.1, not silently postponed to another release.

## PL-006: Replace generic partial-criterion explanations

- **Severity:** Low
- **Category:** Documentation Gap
- **Source finding:** A-7
- **Owner area:** audit evidence
- **Where:** `02-forward-audit.md; evidence/criteria.json` (scripts under `projects/ROCKNIX/packages/network/rclone/sources/`; backuptool under `projects/ROCKNIX/packages/rocknix/sources/scripts/`; ES in its separately pinned repository).
- **What / why:** Give every partial entry a specific observed part, missing artifact and source anchor; keep original criterion text and reviewer packets immutable.
- **Evidence:** All 58 originally PARTIAL notes revised; AC349-04/350-05 now FAIL for G-13. JSON and Markdown counts20/56/20/13/14 total123.
- **Acceptance:** All 123 IDs occur once, all 58 revised notes are specific, counts agree, no generic placeholder gap remains.
- **Tracking:** [#375](https://github.com/rasteratops/distribution/issues/375). Resolved in this review; #375 carries the completion receipt.
## Pre-existing tracked scope

- #337/#344 — actual OS identity, archive/adoption compatibility, immutable
  manifest, manual updater and final clean/upgrade/device qualification.
- #363/#365 — startup-card ordering, table/proof promotion, whole-boot cases;
  T17 failed settlement/seeding is now host-reproduced (Low), still owned here.
- #364 — measured59ms extra legacy-root probe cost and retain/remove disposition.
- #366 — main round-trip fixture and stale-literal guard, including comment holes.
- #356 — numbered layout/marker contract and partial content collision coverage.
- #349/#350/#352 — corrected real archive/content selection and asserted frames;
  #351 — provider page/phone/locale evidence; public documentation follow-ups.
- #361/#362 — candidate pin decisions/freshness; dmidecode UNKNOWN unresolved.
- #365 also owns source-only restricted permissions, split pointer writes,
  two old populated roots and marker/content collision cells. None is a newly
  asserted product failure. These tracked items are exempt from this audit’s
  new-item Phase 7 gate, never exempt from release acceptance.

## Machine-readable index

```yaml
punch_index:
- id: PL-001
  severity: High
  category: Interaction Defect
  source_finding: F-01
  owner_area: cloud migration
  where: "cloud_scan:219; cloud_restore:2125,2143; cloud_backup:2387; backuptool:143\u2013167"
  acceptance: "Final branded guest restores its own RC2 cloud/local archive, with selected filename and sentinel hashes retained."
  outcome: deferred:#376
- id: PL-002
  severity: High
  category: Interaction Defect
  source_finding: G-13
  owner_area: cloud migration
  where: "cloud_backup:2037; cloud_scan:210; cloud_restore:2020\u20132098; ES GuiMenu.cpp:4855\u20134862"
  acceptance: "A production backup on the candidate becomes selectable in the UI and restores the exact archive; current/legacy/healed/foreign-only and flat fixtures are checked."
  outcome: deferred:#381
- id: PL-003
  severity: Medium
  category: Code Quality
  source_finding: F-02
  owner_area: cloud migration
  where: "cloud_backup:809\u2013825,1677\u20131685; cloud_restore:811\u2013817,1676\u20131725"
  acceptance: "Reachable synthetic bucket backup fault and S3 restore fault retain sentinel hashes, report truthfully and retry; ordinary S3 backup fixture is not branch evidence."
  outcome: deferred:#377
- id: PL-004
  severity: Medium
  category: Interaction Defect
  source_finding: G-02
  owner_area: cloud migration
  where: "cloud_migrate_layout:814\u2013816,880\u2013882"
  acceptance: "VM settings-only fixtures remain discoverable/restorable after setup and follow, with pointers and archive hashes; late settings writer and custom/kept controls pass."
  outcome: deferred:#379
- id: PL-005
  severity: Low
  category: Interaction Defect
  source_finding: G-10
  owner_area: cloud migration
  where: "cloud_setup:755\u2013763; cloud_migrate_layout:114,819,883,1052,1224\u20131227"
  acceptance: "Missing, empty, derived and custom configurations have consistent join/follow/settle/apply results; candidate scan restores original root sentinel."
  outcome: deferred:#380
- id: PL-006
  severity: Low
  category: Documentation Gap
  source_finding: A-7
  owner_area: audit evidence
  where: "02-forward-audit.md; evidence/criteria.json"
  acceptance: "All 123 IDs occur once, all 58 revised notes are specific, counts agree, no generic placeholder gap remains."
  outcome: resolved
```

## Phase 7 resolution gate

| Item | Outcome | Evidence / reason |
| --- | --- | --- |
| PL-001 | Deferred | #376: Cross-reader persisted-format change requires the pending branded image and RC2 upgrade proof; remains a 0.0.1 blocker. |
| PL-002 | Deferred | #381: Changing archive discovery and selection needs a product patch and complete VM backup→scan→restore regression; remains a 0.0.1 blocker. |
| PL-003 | Deferred | #377: Paired production helper/caller fix needs fault-injected VM regression and timing control; remains in 0.0.1. |
| PL-004 | Deferred | #379: Requires tier-aware migration behavior and whole-flow VM proofs, beyond the read-only audit; remains in 0.0.1. |
| PL-005 | Deferred | #380: Cross-reader config representation change needs migration/VM coverage; tracked in 0.0.1, not silently postponed to another release. |
| PL-006 | Resolved | #375: Resolved in this review; #375 carries the completion receipt. |

Follow-up states and milestone ownership were re-read live before recording
these outcomes; receipts are in evidence/outcome-issues.json. Deferred items
stay OPEN, milestone rasteratops 0.0.1. No release exemption was made.

# Cloud remediation regression baseline (#365, #383)

Production source: d3753beab5 (same product bytes as run101). Host sandbox
with the retained GENERIC_X64 image's rclone1.75.1. Command:
`tools/last-good-scripts-test --cloud-layout --output <retained-directory>`.
Results: 36PASS,22FAIL over58 cases. Each case starts with new cloud, storage,
config, cache and logs. Complete synthetic fixture/transcript directories:
`/tmp/rasteratops-rc-delivery-20261002/baseline-image-tools/`.

The first case calls real cloud_backup, cloud_scan and cloud_restore. Backup
writes the per-device archive; restore retrieves byte-identical contents;
scan MINE is empty. No model claim substitutes for this transaction. The
foreign-only and flat-root controls pass on the old source. OS identity,
legacy/healed device folders, bucket parent faults (each proves injection
fired), settings-only/custom backup tiers, explicit root and timeout/failure
seeding account for the22 red cases. This is expected pre-fix evidence.

Every T01–T25 cell has a named case. T01–T16/T22 currently verify the
classifier and preservation; they are not a claim that all seven actors or
whole boot have passed. The full last-good suite retains the existing direct
backup/restore/control cases. The promoted `tools/vm-cloud-epic` carries the
UI actors and separate T08/T11/T12 boot cases. It needs a qualified guest;
its initial syntax and constructed-failure checks pass. Its actual guest
runs remain step3 acceptance. CasesC/F/G now assert scan facts/stamps as well
as retaining frames; frame interpretation remains part of visual QA.

Negative runner controls:
`tools/cloud-layout-test --inject-failure --output <scratch>` prints the
constructed FAIL and exits1; `tools/vm-cloud-epic --inject-failure --output
<scratch>` does likewise without a guest. No product code has changed yet.

The initial host-rclone1.60 trial is diagnostic only: it lacks the seeding
flag and could falsely pass a no-write assertion. It was replaced with the
image's rclone, and the failed-listing fixtures prove their fault fired.

## Fixed implementation receipts

The full suite (`full-suite-fixed.log`) exited0 with1366PASS/0FAIL/0SKIPPED,
including69 focused cases. Two later fixes address README-only old roots and
propagate failed follow operations; the final `focused-fixed.log` passes72/72.
The old follow-call control fails for the expected swallowed-error assertion.
The discovered-source apply controls fail on old production bytes and pass on
the fixed bytes. The first provider-error attempt allowed a successful parent
listing to prove the target absent; it was corrected to use a populated backup
tier. That diagnostic failure is not the old-code negative control.

Current runner names are `tools/rasteratops-cloud-layout-test` and
`tools/rasteratops-vm-cloud-epic` (D-WORKFLOW-115). The baseline files retain the
commands as originally run. The archive selector is
`rasteratops-settings-archive`. ES fixes are fc465b126 and4ea18b9b6; syntax checks
passed. Candidate VM, timing and visual evidence are still required.

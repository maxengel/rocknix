# Primary checks of Fable blind leads — 2026-10-02

The product snapshot remains run101 b2378d9c33 / ES e108699ea. These checks
occur while the serial refutation call runs; no Phase 5 list exists yet.
The numbered model leads are not themselves evidence.

- G-01: folds into F-01/#376. Production OS-name matchers and exact probe
  already read; conditional future-rename finding remains High, no deletion claim.
- G-02: new Medium source/pointer defect. `cloud_migrate_layout:814–816,880–882`
  changes SETTINGS_REMOTE after testing save files alone. The entire script in
  the existing bwrap layout fixture changes the old Backups pointer without a
  single query for the offered legacy archive. Both follow and settle reproduce;
  `reviewer-layout-probe.{sh,log}`. This is not a VM run or a deleted archive.
  `--apply` is narrower: :1089,1142,1185,1197 checks and relocates backups, so
  do not claim every CREATE IT route strands them. Follow/settle are the defect.
- G-03: new Medium caller error-handling defect. `cloud_setup:739–740` ignores
  failed settlement and :765–775/:790 onward makes folders/READMEs anyway.
  Full production cloud_setup in its C2 filesystem fixture with injected settle
  rc124 and rc1 exits0 and creates GAMES/README.txt; rc0 control creates only
  Rasteratops. `reviewer-settle-probe.{sh,log}`. D-CLOUD-171 allows finishing
  the wizard after failure; it does not require seeding an unsettled old root.
  Keep the last-page continuation while preventing the contradictory writes.
- G-04: parent-listing failure folds into F-02/#377. Re-read restore sibling
  :1655–1725: same ambiguous helper. Features-query failure is a related
  unknown-result lead, not a proven real-provider recreation. S3 bucket-prefix
  fixture exposure must be stated; no claim the stock S3 suite reaches this guard.
- G-05: existing #364/#365/#363. Measured 59ms delta remains; physical-device
  extrapolation is unproven. Benchmark has five samples per root, synthetic
  WebDAV, run101. Do not replace VM-first policy with a mandatory handheld test.
- G-06: existing #361/#362 preflight. Actual freshness command exit2, not an
  absent result interpreted as PASS. Recorded dispositions must control.
- G-07: existing #366. Bare GAMES and guard/comment exclusions need regression
  cases under that issue; 42/0 pair cannot replace the red main round-trip.
- G-08: disagree with defect classification. `superseded_source:73–92`
  explicitly says configured first, then newest among the others; D-CLOUD-169
  joins only when the configured root has no saves. Commit1de43faa25 and
  last-good-scripts-test:13345 preserve a nonempty configured GAMES. A two-old-root
  policy/coverage residual belongs in #365, not a silent newest-root reversal.
- G-09: could not verify as a defect. Aggregate20s is an intended bound distinct
  from per-call maxima; arithmetic alone does not prove a slow-provider failure
  on every open. Fault/timing cases stay with #365/#364; no deadline increase
  from the blind assertion alone.
- G-10: new Low cross-reader defect. `cloud_setup:755–763` and existing test
  :4688–4701 define explicit empty CONTENT_REMOTE as the cloud root; migration
  :819/:883 reads empty as unset. Full-script follow probe rewrites the explicit
  empty value; named custom /Mine/ROMs is retained as a negative control.
  Existing :13292/:13351 tests encode the contrary interpretation, so passing
  counts do not resolve it. Missing key versus explicit empty needs one contract.
- G-11: could not verify supported restricted-bucket scenario from packet.
  Root listings exist, but no tested permission policy establishes regression.
  Retain as coverage boundary / synthetic bucket-policy case, not a product fail.
- G-12: wording largely reconciled under D-CLOUD-164/167 and existing issues.
  YOUR OTHER DEVICES WILL FOLLOW is conditional; record that residual under
  #353/#365 rather than claiming automatic following for a device with old saves.

Minor notes: sequential pointer writes and interruption are untested source
risks (set_pointer:627–640, follow/join/settle); overlapping rc2 for usage/read
failure is diagnostic, not a demonstrated behavior defect; default-root copies
are #356's known migration-contract work. None is silently promoted to a PASS.

Archaeology: `tools/archaeology --no-gh
'settings.only|empty saves|explicit.*root|settle.*fail'` read register, logs,
rules and history; output retained under the session checks directory. Cached
full issue bodies/comments supply the tracker side. G-03 was a source hypothesis
in the primary analysis; the caller fault probe now confirms its narrower form.

The first layout fixture edit inserted a shell case into the wrong place and
failed before production behavior; it was corrected before the retained probe.
All retained probes exit0 when the stated reproduction/control observations
match, not when the product is fixed. They must not be counted as release PASSes.

## Refutation additions and corrections

- A-1 confirmed: --apply separately inspects and relocates Backups; G-02 is
  limited to pointer-only follow/settle (#379), not all CREATE IT flows.
- A-2 agree, narrowed: seed_note:800–803 refuses unreadable folders and config
  parse failure exits at746–752. The retained fault probe only claims a readable
  config with settle rc124/1 followed by successful seeding. Low, existing T17
  under #365; this corrects the preliminary Medium label above.
- A-3 could not verify at runtime: content refusal precedes write_marker
  (:1249–1259), early current-layout repair (:1012–1028) can retry without a
  marker. The unrelated destination is intentionally protected. Collision/
  partial-move recovery remains an explicit #365/#356 cell, not a proved loop.
- A-4 agree, narrowed: planning has listings before its first progress item;
  no measured unacceptable delay or blank UI is shown. Keep under move timing.
- A-5 disagreed with the stale-README alternative: cloud_backup:2037 really
  writes per-device folders, and cloud_restore:2020–2098 reads them first.
  Following this question uncovered G-13 (High), cloud_scan:210 lists only the
  root. Full production scan with real host rclone local-backend listings:
  nested writer-shaped archive yields MINE empty/COUNT0, flat-root control
  yields the archive. reviewer-archive-path-probe.{sh,log}; #381.
  Refutation of G-13: prepare:103–116 does not append a device folder, config
  defaults hold the tier root, device_label only supplies the regex, and actual
  lsf argv has no recursion. The writer always appends the device folder.
  The legacy flat-root success is therefore a control, not a fix. No guest UI
  runtime claim is made; host rclone1.60.1-DEV is recorded and candidate proof owed.
- A-6 agree on host probe and exit2 provenance, but correct benchmark location:
  bench.log starts guest-d BUILD_ID=b2378d9c33 and records guest exit-sync timings.
  It is VM execution driven from the host, not a host-only script model. The
  reply's first-sample warm-up interpretation was not experimentally established.
- A-7 confirmed and resolved: all58 original PARTIAL notes now name an observed
  part and missing proof. Literal criteria stay fixed; packets stay immutable.
  AC-349-04 and AC-350-05 become FAIL due to G-13. JSON and report counts agree.

Further corrections: Fable's general fleet-fallback claim is too broad:
cloud_restore:2020–2098 selects a device/legacy folder before newest-overall
selection within that folder. F-01 still stands, but an arbitrary sibling's
new archive is not automatically selected from the entire fleet. Actual fleet:
two H700 boards plus one Nova (three physical devices), not three plus Nova.
The Setup folderStep defaults true at GuiMenu.cpp:6672 and is consumed at7410–7427,
so the normal setup continuation is reachable; explicit false rebuilds are
separate. G-08 configured-first stays, G-09 has no demonstrated deadline bug,
G-11 restricted permissions and pointer-write interruption remain coverage
boundaries. Source snapshots and saved E frame, not the model's acceptance of
our description, support those judgments.

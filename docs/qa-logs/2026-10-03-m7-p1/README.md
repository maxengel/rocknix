# M7.P1 source evidence — 2026-10-03

Owners: #356/#365 migration, #320 settings recovery, #389 instructions,
#390 marker test doubles. Delivery #383. This is host/source evidence, not
candidate image qualification; the product issues remain open for their VM work.

- Marker controls: **12 FAIL before**, against production scripts at
  `fcd0f20c9a`; all12 pass after. Malformed/future/trailing marker bytes must
  preserve both cloud bytes and configured pointers through apply/follow/settle/seed.
- Retry controls: initial five copy/marker controls gave2 PASS/3 FAIL. Final
  nine copy/delete/marker controls, including boot/scan retry visibility, give
  **9 FAIL before /9 PASS after**. They exercise token refresh, retention of
  every payload, completion marker, repeat stability and a follower without
  the mover's record. Complete command logs, fault firings, pointers and final
  cloud SHA256 maps are retained per case under the before/after directories.
- Focused suite: **93 PASS/0 FAIL**, image rclone1.75.1. Each case has separate
  local cloud/config/cache state in bubblewrap. No personal cloud was used.
- Full host suite: **1,367 indented harness PASS/0 FAIL/0 SKIP**, plus the93
  focused cases. The first run had44 failures: stale C2/LY marker doubles and
  one real missing storage-failure reason. Corrected marker cat/rcat contracts,
  fixture reset and the real error path; the next complete run passes.
- ES migration retry UI: commit `68e8c7da593c2ea4d2c94831183381906b6cd582`;
  image-compiler syntax check and French msgfmt validation pass. Guest frames
  at640x480/Nova resolution in English/French remain required.
- ES settings-record race: final pin `39f8883545537d5274708ea85c4683612078a957`.
  Both new controls fail before; after, **10 cases/119 assertions PASS**.
  The stale-snapshot test deterministically resumes the real record publication
  boundary after a script's locked write; the LockBusy test executes the real
  loader with competing live/temporary/record files. Existing permission and
  failed-live-write recovery cases still pass. Image-compiler check passes.
- Five changed skill entrypoints pass skill-creator quick_validate; every
  local link in them resolves. rules-check and register-check pass. These
  checks validate local routing, not the live milestone queue; the GitHub
  milestone/issue readbacks are retained separately here.

Reproduce focused controls with:

```sh
tools/rasteratops-cloud-layout-test --case T26 --ref fcd0f20c9a --output /tmp/m7-markers-before
tools/rasteratops-cloud-layout-test --case T23-retry --ref fcd0f20c9a --output /tmp/m7-retry-before
tools/rasteratops-cloud-layout-test --output /tmp/m7-after
tools/last-good-scripts-test
```

Use a new output directory each time. Source SHA256 values in source-hashes.json
bind these receipts to the exact scripts/harness. The full test uses transient
fixtures which it removes; its focused suite's results are separately retained
here. The pending M7.P1 work is the actor/predecessor coverage review and promotion
of these cases into the candidate's guest runner; a source pass is not RC status.

The pre-commit scanner required the synthetic OAuth field to be constructed at
runtime, with an angle-bracket placeholder. The final9 retry cases were rerun
with that fixture representation; `retry-fixture-final.log` retains the result.
The broader passing suite predates only this representation change and the
separately tested ES settings fix; no distribution production script changed
between that passing suite and the commit. Source hashes above name the final
committed files.

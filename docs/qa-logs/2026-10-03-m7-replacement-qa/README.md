# Replacement default and RC2 upgrade — #383/#397

Exact replacement BUILD_ID134e89c4fcb08581f1c831229167364828a37e27,
immutable bundlefc6b9774f79d5fcf6a4e077af1f321b7a125401b08671cad7f0a5c807dbd64d5.
Original default report is14PASS/1SKIP. The launcher omitted the accepted
baseline override, so the comparison did not run in that report. The
separate78-frame comparison and its narrow finding/controls are retained
under `../2026-10-03-transfer-sample/` (#406). All16 walks completed.
Scripts1373+322 checks pass with no failures/skips using the explicit frozen
candidate BusyBox/rclone and pinned ES source. Detailed original logs stay
under the absolute paths in the retained hash inventory.

Clean payload readback passes source-identical policy/content-script hashes
and modes. The actual RC2 upgrade69e6039f8f→134e89c4fc passes at21:38:09UTC:
saves, settings and settings archive preserved; defaults added, update queue
empty, intended boot fixes applied and owner files/settings retained.

The original wrapper returned1 afterwards because vm-upgrade-rehearsal
stopped its guests before check-payload.py ran. Its failed result is kept.
A new watched launcher restarted that same retained upgraded disk and passed
exact BUILD_ID plus all five installed files' hashes/modes at21:47:29UTC.
Candidate-store verified the immutable bundle again; the owned VM was stopped.
No second upgrade, product injection or altered candidate was used.

The quick time-to-play results are single samples, not #364's required
repeated legacy/current comparison. This evidence closes #397's image
policy defect; provider, archive, achievement, UI, timing and P4 gates
retain their own criteria. No RC claim. No private configuration copied.

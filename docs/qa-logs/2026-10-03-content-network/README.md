# M7.P3 S3 content interruption — #401 / #402

Can this be done on the VM? Yes. Fresh503e24e10d guests, local S3 fixture.
All-seven run19:35–19:43 ended rc1: seven assertions across three cases.
LINK3/4 wait out the40.7s outage and return0 at70.3/59.0s, stamping success;
these are #401 product failures. Guest route/address disappearance is observed.
Content and retries match bytes, which does not excuse ignoring the outage.
LINK7 completes before a cut can land: #402 is a fixture precondition failure,
not proof of interrupted scan behaviour. Other four cases pass, no S3 skips.

Filtered guest stdout and cloud log captured live while reachable are retained.
The first attempted read timed out during the outage, then a second succeeded;
only the successful1057-line capture is evidence. The suite report, complete
log, terminal recorder and harness hashes preserve actual inputs and result.

Source trace: content scripts call rclone directly using30s I/O timeout and
ten SDK retries; saves/settings apply a progress-sensitive stall guard.
network_gone runs only after an error, so late success bypasses it. D-CLOUD-127
requires bounding inactivity rather than the whole duration of a progressing
manual transfer. No product correction has been applied at this receipt.

## Content correction controls, 20:19 UTC

The new shared content helper measures the five stats high-water counters,
using the configured idle timeout plus the existing six-second grace. It
wraps copy and sync, including game lists and match dry runs; plain listings
keep their separate three-attempt options. Cancellation cleanup is local to
the helper, preserving the scan's own EXIT trap. A failed content copy no
longer starts another game-list transfer before reporting the failure.

`test-content-guard.py` executes each actual copy statement/arguments from
both original and corrected content sources against controlled processes.
Original:12PASS/6FAIL; corrected:18PASS/0FAIL, both with host utilities and
again with candidate BusyBox5e8a9142…dee2f. Controls cover stale counters,
retry totals, sustained byte/listing progress, >3GiB counters, ordinary
failure, cancellation and unavailable guard storage. Only the configured
idle timeout is shortened to1s; the production six-second grace remains.
Raw cases: `/tmp/rasteratops-m7-content-guard-{01,busybox-01}/`. These are
source controls, not replacement-image qualification.

The repaired #402 S3 fixture now proves real interrupted scanning, and finds
one more #401 product issue: its failure sentence does not begin with an
accepted outcome word. It ended nonzero after43.1s, kept stamps unchanged,
and its retry listed every fixture system; the unweakened outcome gate fails.
Source wording correction and rebuilt VM proof remain owed. The full host
suite is still running, with one stale copy-call assertion observed so far.

## Complete host qualification, 20:47:25 UTC

Full rerun under the candidate's exact BusyBox/rclone passes1373 broad and
322 layout checks,0FAIL/0SKIP, rc0. It includes the corrected destination-
before-copy assertion, corrected scan sentence, and six permanent whole-
script inactivity/progress checks. Both prior failures and final inputs/logs
are retained. Replacement-image S3/WebDAV proof and clean/upgrade gates remain.

Tracked log/status copies trim trailing whitespace only. Unchanged raw bytes
remain in the named run owners; `../2026-10-03-guest-matrix/receipt-normalization.json`
records raw and tracked digests for every normalized copy. No verdict changed.

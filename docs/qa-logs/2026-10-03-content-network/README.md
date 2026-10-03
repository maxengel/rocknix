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

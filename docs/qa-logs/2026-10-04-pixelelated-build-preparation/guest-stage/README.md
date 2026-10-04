# Prepared independent guest cloud matrix

Prepared only; no image, guest, backend or QA identity has been created.
Owner: `/workspace/tmp/pixelelated-m7-guest-01`. Refs #383, #409.

Can this be done on the VM? Yes: the existing promoted cloud-epic runner
drives 19 independently reset cases on a fresh 640x480 GENERIC_X64 guest,
using the local synthetic WebDAV service. No personal cloud is used.

Run only after first-stage defaults/actual RC2 adoption and both provider
link matrices pass. The launcher enforces their outer results, the frozen
source and ES pins, its own harness hashes, the candidate manifest and no
existing QEMU. It creates a new 16GiB guest disk and checks installed identity
and the three QA ROM hashes before the matrix. Cleanup waits for the owned
guest to exit via a checked process handle and stops the owned backend.

From the frozen build worktree:

```
tools/watch-build --interval 5 --stall-min 5 --activity-dir /workspace/tmp/pixelelated-m7-guest-01/artifacts --recursive-activity -- /workspace/tmp/pixelelated-m7-guest-01/run.sh <verified-bundle>
```

Capture owner outer.log/outer.rc, supervise at most60s apart and announce
terminal/stall events. No off-session notification is configured.
Preparation syntax/hash checks are not guest qualification evidence.

Host cleanup control: a disposable inert process with the expected QEMU
argument shape stayed alive when supplied a different disk; the exact owned
disk permitted SIGTERM and awaited exit. Both checks passed. This was not a
QEMU VM and does not qualify the image. The argument shape was read from
the frozen generic-x64-vm launcher.

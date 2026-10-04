# Prepared inherited runtime qualification

Prepared only; not executed. Owner:
`/workspace/tmp/pixelelated-m7-runtime-01`. Refs #383, #409.

Can this be done on the VM? Yes: create a COW overlay on the first QA stage's
actual ROCKNIX RC2-upgraded disk. The original archive and settings were
written by RC2, then carried across the update. They are not fabricated
pixelelated archives. Retain and verify the backing disk hash before/after.

The existing archive, alternating timing and identity proofs are rebound to
the exact b137d8c373 build, lowercase paths and frozen sources. Shared helper
code comes from the adjacent hash-bound archive-proof.py, with no dependency
on a mutable historical owner script. Required observations remain inherited
local/cloud recovery bytes; production writer/reader agreement; five timing
samples per layout with the unchanged 30ms median-difference bound and every
sentinel transferred; no implicit migration during timing; retired reporting
and online updater; manual-update URL and exact installed licence bytes.

Requires successful first and guest stages, matching source/ES/candidate and
harness hashes, and no other QEMU. Uses WebDAV9040 and guest d; cleanup waits
for its exact guest process to exit and stops its backend. From frozen tree:

```
tools/watch-build --interval 5 --stall-min 5 --activity-dir /workspace/tmp/pixelelated-m7-runtime-01/artifacts --recursive-activity -- /workspace/tmp/pixelelated-m7-runtime-01/run.sh <verified-bundle>
```

Capture outer.log/outer.rc and supervise at most60s apart. Syntax/hash checks
do not qualify an image. No off-session delivery is configured. This stage
does not replace the remaining pair, localisation, launch/memory, broad image
sweeps or required P4 fixes review.

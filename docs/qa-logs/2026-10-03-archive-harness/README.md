# Archive assertion compatibility — #396

First branded-image QA failed only the archive writer-name assertion in
`round-trip.log:146`: the writer correctly emitted the persisted ROCKNIX
suffix, while the host assertion expected OS_NAME=RASTERATOPS. Product history
(feature dbbbdc73c4, #376) deliberately keeps that suffix so old readers work.
No product bytes or immutable candidate changed.

`test-archive-name.py` extracts and executes the actual assertion AST from a
specified harness source. Frozen503e source:14PASS/2FAIL; current:16PASS/0FAIL.
It proves the old assertion rejects the compatible name and accepts the
incompatible renamed writer on the new display identity. Both display
identities, wrong/missing labels, malformed stamps and wrong suffix/format
are covered. The reader fixture still uses the current display suffix to
exercise both supported reader identities.

Run `python3 docs/qa-logs/2026-10-03-archive-harness/test-archive-name.py
tools/cloud-round-trip` (one command). Full same-image VM rerun passed in81s at18:54UTC. `rerun/` retains
its report, complete assertions, harness hashes and terminal status. Archive
integrity, writer compatibility and installed/pre-label readers all pass.
The first failed run is preserved in `../2026-10-03-m7-qa-01/default/`.

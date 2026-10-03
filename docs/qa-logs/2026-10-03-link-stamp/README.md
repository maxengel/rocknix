# M7.P3 link-loss assertion correction — #398

Can this be done on the VM? Yes. Seven link-loss operations use the disposable
candidate guest and local endpoint, with no personal cloud or device action.

The first all-seven WebDAV run ended 2026-10-03 19:15 UTC, rc1. LINK2/3/4
rejected the valid extended `epoch 69 gaps reason` failure stamp. Production
has emitted these since 50c4b409b7 (#308). Operations returned the expected
network error within their unchanged bound, retained whole files and recovered.
The host parser now validates the numeric timestamp and exit-code prefix while
allowing outcome fields; success and malformed values still fail.

`test-stamp-assertion.py` executes the actual Link.exercise loop: original
7 PASS / 7 FAIL, corrected 14 PASS / 0 FAIL. `initial/` preserves the failed
VM report and terminal recorder. The tool was changed only after the job exited.

LINK5 has the existing D-CLOUD-128 WebDAV/QEMU buffered retry skip; archive
content comparison passes. This is not an unqualified seven-case pass. A fresh
corrected WebDAV run and strict S3 LINK5 evidence remain owed at this receipt.

Corrected actual VM proof: link-03 completed all seven cases at19:34UTC.
LINK2/3/4 now accept real extended rc69 stamps, bounded interruption and
whole-byte retries. Six cases pass; LINK5 retry124 is separately #400,
retained under ../2026-10-03-link-retry/. Do not call the entire report PASS.
Source is published feature052e974e68 / nextd426f7058c.

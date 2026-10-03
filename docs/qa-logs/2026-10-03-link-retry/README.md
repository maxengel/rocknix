# M7.P3 archive retry fixture — #400

Can this be done on the VM? Yes. Disposable503e24e10d guests and local
throttled endpoints; no personal device/cloud involved.

webdav-before-* retains the link-03 report, six passing cases, LINK5 retry124,
terminal recorder and exact harness hashes. Filtered rerun.out shows100%
followed by0% after a retry. Interruption ended69 in29.8s; marker unchanged,
no partial receiving files, archive bytes whole before and after retry.
The full cloud_sync log was requested after cleanup and unavailable; do not
infer evidence from the empty attempted copy in the run directory.

The existing12MiB fixture explicitly documents draining the QEMU buffer
past the unchanged36s product stall bound at200k. Prepared6MiB keeps the
in-flight cut window and requires strict retry/content verdicts without skip.
Actual AST verdict controls old3/6, prepared6/6. VM proof remains owed; the
running original S3 comparison must finish before editing the shared tool.

## Strict corrected VM proof

Actual corrected verdict controls pass6/6; all14 stamp controls remain green.
`webdav-after/` ended19:46UTC rc0, interrupted upload69 at29.5s; `s3-after/`
ended19:49UTC rc0, interruption69 at35.9s. Both observed the missing route
and address, left no partial receiving file, retained whole archive bytes
and an unchanged uploaded marker, then a plain retry returned0 with matching
content. Neither accepted any skip. Six-MiB archives were still in flight
when the real guest interface was cut. Product bounds were unchanged.

All seven WebDAV cases now have passing evidence across the corrected
all-seven run plus this strict LINK5 run. S3 still has separately owned
content failures (#401) and scan precondition gap (#402); do not infer a
complete S3 link or candidate pass from archive success.

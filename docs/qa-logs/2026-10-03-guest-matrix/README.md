# M7.P3 guest migration/recovery matrix — #383 / #404

Can this be done on the VM? Yes. Independently reset cases on a fresh16GiB
GENERIC_X64 guest,640x480 virgl, immutable503e24e10d and pinned ESe6e1e4d0f.
Exact BUILD_ID and three homebrew ROM hashes were checked before the run.
A dedicated generated SSH identity and owned WebDAV endpoint were used.

19:50:14–20:31:24UTC: **19 cases,249PASS,0FAIL; terminal rc0**. Per-case
logs preserve all assertions, including startup ordering, archive selection,
content-root choices, offline boot, interrupted settings restoration, setup
completion, predecessor migration and retry, and malformed/future markers.
All cases reset independently; their existing injected-failure control
remains under the earlier process receipts. No product scripts were injected.

`summary.json` holds each case count. `frames.json` hashes all1,467 frames,
including continuous/boot captures. Full frame bytes remain under
`/workspace/tmp/rasteratops-m7-guest-d-01/artifacts/cloud-epic/`; this record
is screenshot custody, not a claim that every frame has been visually reviewed.
The H keep-folder and L setup-complete frames were opened in this session.
Remaining release UI language/resolution review is separate M7.P3 work.

The old final-report glob says zero although H/A/L actually have5/8/16
numbered walk captures. #404 changes it after the shell exited; actual old/new
report statements against the retained directories give0/3 then3/3 correct
counts. Original logs are preserved. Protocol-only cases legitimately have
no numbered walk captures; a count alone never proves UI quality.

Recorder1157674 and runner1157659 ended normally, and cleanup stopped owned
guest1157712 and WebDAV. Host process inspection confirms they are gone.
Completion was announced in active chat when observed; off-session delivery
is still unconfigured (#395). The original image still requires replacement
for #397/#401 and is not an RC.

Tracked log/status copies trim trailing whitespace only. Unchanged raw bytes
remain in the named run owners; `../2026-10-03-guest-matrix/receipt-normalization.json`
records raw and tracked digests for every normalized copy. No verdict changed.

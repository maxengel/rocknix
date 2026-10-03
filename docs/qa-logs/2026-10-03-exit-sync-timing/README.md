# Replacement exit-sync comparison — #364

Original134e89 VM measurement FAIL: five alternating samples per layout,
after one warmup each, median legacy193ms/current147ms, difference46ms
against the unchanged30ms limit. All ten syncs returned0; migration journal
count stayed unchanged. Same owned WebDAV, upgraded VM and2000-byte changing
save as the earlier benchmark. No parallel VM/build/link job ran. These are
whole-command times measured with the guest clock, not the quick game's
first-frame/exit-stamp timing from the default suite.

The first trace collector returned empty lists: environment logging was
superseded by production options; its anchored matcher also did not strip CR
before matching. The second used an exported function but the production
script defines its own rclone wrapper, so no trace file was produced. Both
failures are retained and do not change the measured timing failure. A
separate temporary-binary-wrapper trace is in progress; it must not be used
as a measured sample. #364 remains open; no criterion was relaxed.


## Controlled before/after result

A stricter repetition spaces writes outside the measured interval by1.15s
for WebDAV's one-second upload-time comparison, and hashes every transferred
save. Original candidate medians277/238ms, difference39ms FAIL. Same VM with
only the exact cloud_backup source bound over the installed file:
258/238ms, difference20ms PASS. Five alternating samples per layout, one
warmup each, independently reset cloud/stamp for each version; no migration
journal activity. Exact hashes are in timing2-artifacts/comparison.json.
No GOMAXPROCS override was used in these measured runs.

The successful separate trace5 sees seven legacy HTTP requests vs five
current requests: a file-type PROPFIND and the actual directory PROPFIND are
the difference. Isolated parent listing takes median32ms; an explicit trailing
slash takes22ms. GOMAXPROCS experiments did not help and were not adopted.
The pinned upstream WebDAV NewFs uses that slash to skip its file-type probe:
https://github.com/rclone/rclone/blob/v1.75.1/backend/webdav/webdav.go#L432
and lines515–533. Both backup and restore presence helpers now use the
explicit directory form; unknown/present/absent semantics and per-run probing
are retained. Full regression and rebuilt-image evidence are still required.

All diagnostic launch failures remain. Trace4's second setup overwrote its
saved binary with its wrapper because BusyBox mountpoint did not identify a
file bind mount. The guest command timed out180s; owned cleanup stopped it.
A proposed PID-checked stop found the guest already gone and changed nothing.
Trace5 initializes once by its saved-file marker and completes rc0. Raw HTTP
headers remain private inside the owned overlay, outside tracked evidence.

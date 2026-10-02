# Concurrent image publication (#168, #361)

Prepared against RAOfflineProxy main
`bdcd229b45e289fdd0d920935887406d7d7b5919`; not submitted upstream yet.
`fix.patch` contains only the Linux fix and its standalone unittest.
The selected source has no CONTRIBUTING file, AGENTS.md or PR template.
The current image-related PR search found no matching open contribution;
#198's connection reuse and #200's sharding are already included in this base.

When a service and a bulk-cache worker fetch the same image, they share
`<target>.tmp`. One writer can rename that file while the other is still
writing it, publishing mixed or incomplete bytes. Give each writer a temp
name containing its PID/thread ID, then atomically replace the target.
This retains current sharding, connection reuse and download scheduling.

The deterministic regression interleaves two writers: upstream produces
`bbbbbbbbAAAAAAAA`, a mixture of their bodies, and fails. The fix produces
one complete writer's body and leaves no temporary files. The regression
and104 upstream queue, award, consent and image tests pass together (105).
Receipts: `docs/qa-logs/2026-10-02-upstream-refresh/`.

Suggested title: `linux: isolate temporary files for concurrent image downloads`

Suggested PR body:

Two workers downloading the same static image share a temporary path. If one
renames it while the other is still writing, the cache can publish mixed
bytes. Give each writer its own temporary path and atomically replace the
finished image.

Adds a deterministic regression that fails on current main and passes with
the fix. Validation:105 tests pass across the caching queue, award parity,
usage consent, image-cache/shutdown and new publication suites.

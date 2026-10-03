# Independent resume proof — #393 / #394

The `watcher_resume_proof` agent received only the repository and the request
to resume read-only. It verified the completed build's rc0, absence of the
builder/watcher/container, immutable candidate-store custody, all 6,606
frozen source hashes, the exact clean ES checkout, and the published
monitoring commits (feature `60b974ef20`, next `1aac875e88`).

It recovered the next work in order: consumed-source inventory, P3 image
qualification, then the approved P4 review. The image remains unqualified.

The first pass found three handoff defects: a terminal status still warned
about heartbeat staleness; the cold-build launch receipt lacked a historical
label; and publication wording lagged delivery. All were corrected.

The read-only retest reported PASS for all three. It verified the terminal
assertions and 28 retained passing watcher controls, matching qualified
tool hashes, and the actual finished/rc0 status at 16:59:43 UTC. Recorder
PID 48573 had exited. Current checkpoint, readiness, live M7 and #383 agreed
on the next work. The final correction commit/push was explicitly pending
at retest time. Neither proof changed state.

## CI on the published automatic runner

At next `1aac875e889a86b8d47d1e2a840fe807c592e315`, the monitoring step in
[fork record checks run 37138685668](https://github.com/rasteratops/distribution/actions/runs/37138685668)
passed both suites. Rules, register, index and acceptance-checkbox checks
also passed. The workflow remained red solely for the existing audit
cadence (15 closures, one day since 2026-10-02 at that observation); the
ceremony result reported zero push refusals. The approved P4 review remains
due after image qualification. This receipt does not claim all CI is green.

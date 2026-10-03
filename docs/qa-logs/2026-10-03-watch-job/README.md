# M7.P3 watcher correction — #393

The old watcher reported stalled at636/642 because the aggregate build log
only receives a package's buffered output when that package completes.
WebKit was still writing .threads/logs/580.log with four active compilers.
The old script's behavior is reproduced by `baseline.log`.

`tools/watch-job --activity-dir DIR` now observes the job's direct *.log
files as well as the main log. The status names the freshest activity source
and its age, keeps overall and package progress separate, and shows that
file's tail. Non-log status files do not count as activity. Suspected stall
means all watched logs are quiet; a linker can still be working. No automatic
kill, restart, source edit or QA continuation is performed by this tool.

## Proof

```
python3 docs/qa-logs/2026-10-03-watch-job/test-watch-job.py tools/watch-job
```

`tests.log`:28 PASS,0 FAIL, covering buffered output, quiet/new logs, live
and stopped heartbeat, successful/failed completion, death without result,
zombie detection, missing output, malformed results, activity scan failure,
detached argument forwarding/startup acknowledgement, invalid configuration
and safe help. A separate old-source run retains the observed false stall.
Syntax check passes. Fixtures use isolated host logs and owned processes;
the GENERIC_X64 build is observed read-only. No device/cloud actions.

## Live replacement

At16:27UTC the old watcher3863200 was verified by its actual command/script,
stopped by exact PID, and replaced with4085803. The builder remains3863117.
The replacement executes the read-only run-owned copy
`/workspace/tmp/rasteratops-m7-cold-01/watch-job-393` and writes the existing
`build.status`, plus `build.status.pid`. It observes the frozen build root's
`.threads/logs`. `live-before.status`, `live-after.status` and
`live-heartbeat.status` prove the transition and subsequent heartbeat.
`live-verification.json` retains exact deployed/repository watcher hashes;
their only difference is the introductory comment clarifying the states.

The executing repository script was not edited. The run-owned copy was
tested first; only after the old interpreter stopped was the repository
copy installed. All6,606 frozen source hashes still match the unchanged
input manifest, distribution503e24e10d. The only tracked build-checkout
delta is the generated GENERIC_X64 emulator-support document; preserve it.

This is a status recorder. Automatic chat notification is **unarmed** in
the current harness; do not claim a waiter or automatic alert exists.
Read the live status and its mtime; more than two30s intervals without a
heartbeat needs investigation unless the recorded state is terminal.
The retained files here are snapshots, not the current heartbeat.

## Automatic future builds — #394

`tools/watch-build` is now the shared default route, installed in five native
entrypoints and the host Docker recipe. Nested scripts reuse a relative run
marker across the mount. Each run holds a worktree lock, retains private
logs and a run-owned watcher, and records an atomic exit code. The monitor
finds package logs as new build roots appear. Build arguments, environment,
exit status and original umask survive. Interactive Docker shells retain
their behavior; builds started inside them are monitored inside the container.

`runner-tests.log`:34 PASS,0 FAIL. This includes direct and make entrypoints,
Docker command transport, removed-hook negative control, failure/startup/
signal/death controls, nesting, worktree exclusivity and original artifact
permissions. `docker-smoke.log`/`.status` prove the same flow in the actual
pinned builder with host and container paths differing. `hooks-tests.log`
passes; fork record CI now executes both control suites on every next push.
`qualified-source-hashes.json` identifies the final tool/entrypoint bytes.
The earlier live-verification record identifies the deployed #393 watcher
before #394 added build-root discovery; it is historical, not a claim that
its bytes equal the final repository tool.

The M7 cold build completed at16:33UTC and its deployed watcher recorded
finished/rc0 at16:34:02UTC (`live-finished.status`). This is also the real
completion control. Its image/update tar checksums and immutable custody
pass; VM qualification remains separate. No monitor job is still running.

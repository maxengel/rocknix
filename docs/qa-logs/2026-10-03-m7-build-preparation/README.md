# M7.P3 cold-build preparation — #383/#344

Prepared, not launched. `build/m7-generic-x64` in
`/workspace/repos/rocknix.worktrees/m7-generic-x64` is a new isolated checkout;
it must advance to the final integrated `next` before freezing. The old warm
root and its generated support document remain intact.

`python3 freeze.py OUTPUT_JSON` refuses dirty trees, a pre-existing branded root,
an unintegrated qualified ES pin, or a remote branch not serving that pin.
It records the full distro/ES/splash commits, actual pinned container identity,
global and WebKit concurrency, and tracked recipe/build-input hashes.
The consumed source/download inventory must also be collected from the build.

`bash build.sh RUN_DIR INPUTS_JSON` rechecks the input bytes, branch, cold-root
absence, nonroot identity and container. It mounts both main.git and the
shared source cache, records PID/start/log/result, and retains thread logs
on failure. It refuses an earlier run directory. Both scripts pass syntax
checks; these are preparation checks, not a build result.

For example, from the final integrated checkout, with an unused run directory:

```sh
mkdir -p /workspace/tmp/rasteratops-m7-cold-01
python3 docs/qa-logs/2026-10-03-m7-build-preparation/freeze.py \
  /workspace/tmp/rasteratops-m7-cold-01/inputs.json
setsid nohup bash docs/qa-logs/2026-10-03-m7-build-preparation/build.sh \
  /workspace/tmp/rasteratops-m7-cold-01 \
  /workspace/tmp/rasteratops-m7-cold-01/inputs.json \
  > /workspace/tmp/rasteratops-m7-cold-01/launcher.log 2>&1 < /dev/null &
```

A manifest already at RUN_DIR/inputs.json is supported without self-copy.
The EXIT trap is installed before PID/start/copy receipt writes. Syntax and
isolated post-validation harness controls pass for same-path success and
copy failure; neither control starts Docker or a build.

The launcher needs an actual host watcher after launch:

```sh
tools/watch-job --log RUN_DIR/build.log --rc RUN_DIR/build.rc \
  --pid PID_FROM_RUN_DIR --status RUN_DIR/build.status --detach
```

Use the watcher's process and current heartbeat as proof that it is watching.
Do not claim a watcher exists before it is started. Input freeze, build and
candidate-store custody remain pending ES publication/pin integration.
Host preflight after stopping owned QA guests: READY, about41GiB RAM available,
8GiB swap unused and1.9TiB disk free. Recheck immediately before launch.

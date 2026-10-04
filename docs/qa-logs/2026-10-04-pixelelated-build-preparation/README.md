# Frozen pixelelated build preparation

Prepared for #409/#383; **not a build or VM qualification result**. At the
recorded preflight on October4,03:30:29UTC, swap had1MB free of8191MB despite
45912MB available RAM. The host action is pending; interactive sudo is not
available to this session. No build/guest/backend is running.

`frozen-inputs.json` records distro b137d8c373, ES c75aa3fa, splash8c71126c,
proxyec60fdd, the actual pulled container digest,24/4 concurrency and the
full manifest's hash. All6,547 regular files and180 symlinks were rechecked;
the frozen checkout is clean and its cold build root does not exist.
`build.sh` is the exact mode0500 launcher retained under
`/workspace/tmp/pixelelated-m7-cold-01/`. It refuses changed inputs, a reused
run/root and a failed memory preflight. The older build root remains intact.

The source batch is published as next b137d8c373 / feature c12c0e1b30. This
preparation changes only evidence and the later QA harness; do not advance
the frozen build checkout for documentation. Tracker JSON files are actual
GET readbacks after updating M7/#409/#383/#361/#386 at03:28UTC.

Once the host has enough free swap, recheck preflight and launch from the
frozen checkout:

```bash
cd /workspace/repos/rocknix.worktrees/m7-pixelelated
tools/build-preflight
tools/watch-build --docker --interval 5 --stall-min 5 -- \
  /workspace/tmp/pixelelated-m7-cold-01/build.sh
```

Capture the outer shell result separately. The launcher records `run.path`;
read that run's `build.status`, `build.log`, detailed activity and terminal
`build.rc` at least every60seconds. The watcher smoke proof is in
`../2026-10-04-pixelelated-ocean/`. Completion/failure delivery works in the
active session; disconnected delivery remains unresolved (#395).

After successful assembly, collect consumed-source/container receipts and
retain image/update bytes with `tools/rasteratops-candidate-store put` using
the exact input manifest. Verify that bundle before and after QA.

`qualify.sh`, `verify-inputs.py` and `check-payload.py` are prepared adaptations
of replacement02's qualification harness. They require the new bundle;
syntax checks pass, but **they have not run against an image**. The run owner
is `/workspace/tmp/pixelelated-m7-qa-01`; its harness checksum file is generated
when these files are installed. The launcher refuses unrelated source or
candidate inputs, an already-used run owner and any preexisting QEMU guest.
It uses the existing15 default suites and the real September29 ROCKNIX RC2
predecessor, followed by installed identity, script, policy and Ocean SVG
hash/mode checks on both clean and upgraded guests. Retain the upgraded disk.

```bash
tools/watch-build --interval 5 --stall-min 5 \
  --activity-dir /workspace/tmp/pixelelated-m7-qa-01/artifacts \
  --recursive-activity -- \
  /workspace/tmp/pixelelated-m7-qa-01/qualify.sh /path/to/verified/bundle
```

This is the first QA stage. Required WebDAV/S3 link cases, reset promoted
guest cases, pair migration, archives,640/1280 EN/FR visuals, timing/memory,
installed proxy and remaining P3 checks follow. The ordinary RA award needs
the outstanding account fixture. P4 independent fixes review and the H700
DDR4 device artifact remain later steps; no RC or device-ready claim follows
from preparing these commands.

The fresh RC diagnostic (`rc-preflight.log`, exit1) passes package freshness,
existing accepted ancestry,23 inherited-state code traces, checkbox checks
and catalog. It still refuses RC designation on eight open bugs:
#320/#327/#352/#353/#366/#384/#391/#392. The P4 audit remains due.
Remote ancestry uses the explicitly reported last-fetched refs; package and
issue checks were live. Device facts were read by hand, not mechanically
passed. None of these outcomes is a VM result.

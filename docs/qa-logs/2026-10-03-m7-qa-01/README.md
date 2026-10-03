# M7.P3 first candidate qualification — #383 / #395

Can this be done on the VM? Yes. The immutable GENERIC_X64 image supplies
software evidence; no physical device or personal cloud is involved.
This directory initially records setup and an in-flight run, not an RC pass.

## Inputs and source custody

Frozen distribution503e24e10dde6a59aa6c631f789b88b89f8e92e1, ES
e6e1e4d0f91e177e182cc05b1cea74991e1cc45b. All6,606 manifest source hashes
and the candidate-store bundle verify before QA. The bundle is
`/workspace/artifacts/rasteratops-candidates/sha256/83751e812351c72fc80a6a3cf418929769158684345cf6dd5f9e0fbcd9877d21`.
The ES QA checkout is clean and exactly the pin.

`source-inventory.py` reads unpack/build stamps and actual cache bytes.
`source-inventory-summary.json` locates the read-only complete inventory:
568 source roots,547 cache inputs,17 local/generated packages, three using
parent sources, one prebuilt rclone. The archive recovery receipt verifies
the ZIP against the frozen recipe checksum and its binary against the
consumed unpacked binary. The recipe had deleted the original ZIP; the
receipt explicitly says this is a verified reconstruction, not that original
file. Publication's corresponding-source/licence work is still separate.
Cbindgen was source-qualified earlier but was not an unpacked consumer in
this image; do not infer consumption merely from its recipe being present.

The first inventory attempts are retained under the live run directory.
Classification excludes old clones beside consumed archives and a different
architecture's cached executable. Bemenu creates an empty `.git` marker;
Git would walk up to the distribution repository, so the inventory now
checks repository ownership before accepting a package's Git identity.

## Monitoring and delivery

32 watcher and35 shared-runner controls pass, including nested QA activity,
real inactivity, death without result, malformed observations and normal
build routing. `monitor-hashes.json` identifies repository and run-owned
copies. The runner's later help/docstring wording is the only deployed-copy
difference. The deliberate exit7 probe under the live run's `probe/` reached
the active host waiter and the retained status recorded finished/rc7.

Actual default run began2026-10-03T18:19:10Z. Owner directory is
`/workspace/tmp/rasteratops-m7-qa-01/`. Retained runner389728 and watcher389734
write `.build-runs/20261003T181910Z-797780a0/`; five-second observations and
five-minute suspected inactivity use this run's nested artifact logs. The
active host execution session33776 is awaited/polled within60s, with suite
failures/stale monitoring/stalls/completion announced in the conversation.
The status file is durable; the active waiter does not alert after a session
disconnects. #395's off-session destination remains open.

## First default suite — in flight at this receipt

Run the unchanged frozen checkout's `tools/vm-qa` with explicit ES_SRC and
RETROARCH_SRC. The run-owned `default-vm-qa.sh` retains all environment values:
VM_PAIR_DIR is the disk-backed `pair/`, CLOUD_QA_STATE is isolated `cloud/`,
ROCKNIX_ARTIFACTS is `artifacts/`, and WALK_BASELINE names the existing
accepted baseline. Cleanup stops the owned guests/endpoint on exit.

Both guests booted503e24e10d with virgl. A read-only frame was black after
idle; the documented inert shift wake showed the carousel. Both frames were
inspected; this was the screensaver, not a rendering failure. Live report:
`artifacts/rocknix-images/qa-503e24e10d-webdav-a-20261003-1819/report.md`.
Read that artifact for the current result. Setup does not close an image
acceptance criterion. Next are RC2 upgrade and the remaining P3 matrix,
then the approved P4 fixes review.

At18:42UTC twelve suites pass. Round-trip has one host-assertion failure,
tracked as #396: the writer deliberately retains ROCKNIX for old-reader
compatibility, while the harness expected the display OS name. Corrected
assertion controls are in `../2026-10-03-archive-harness/`. Visual walks are
still active; the full round-trip rerun waits for owned guests/backend to
be released. The frozen product is unchanged. Fresh read-only resume proof
verified live PIDs, source and candidate hashes, and the milestone order.

## Default run completed; corrected cloud rerun

Finished18:51UTC:14PASS/one host assertion failure; all16 walks and frame
comparison pass. `default/` retains the report, failed assertion and terminal
recorder result. `custody-after-default.log` verifies the same immutable bytes.
The full corrected WebDAV round-trip passed81s at18:54UTC; evidence is
`../2026-10-03-archive-harness/rerun/`. Thus all15 default suites have passing
evidence across the original and corrected run, not a rewritten original
report. Both terminal results were announced proactively in chat.

Read-only identity checks found a separate missing-policy installation gate
(#397). See `../2026-10-03-image-policy/`; a replacement image remains owed.
The RC2 upgrade rehearsal started18:56:05 under the shared watcher and active
waiter71273, owned state `/workspace/tmp/rasteratops-m7-upgrade-01/`. Its
activity log is `/workspace/artifacts/rocknix-images/qa-503e24e10d-upgrade-from-69e6039f8f-20261003-1856/rehearsal.log`.

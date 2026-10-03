# M7.P3 cold engineering build01 — #383/#344

Started2026-10-03T14:02:46Z from distribution
503e24e10dde6a59aa6c631f789b88b89f8e92e1 on build/m7-generic-x64.
Root: `/workspace/repos/rocknix.worktrees/m7-generic-x64/build.RASTERATOPS-GENERIC_X64.x86_64`.
No warm root copied/renamed. This is an engineering build, not an RC.

The full `inputs.json` artifact is retained read-only at
`/workspace/artifacts/rasteratops-build-inputs/m7-cold-01/inputs.json` and in the
live run directory. It records1,608 recipes and6,606 tracked build-input hashes,
full ES/splash/base/container inputs and concurrency. `inputs-summary.json`
retains the same metadata and full-manifest digest in Git. That SHA256 is
24116729b3610411fe5ba89543cf10db98b11cb9ca8afc3cbf0ef61f08640459.
`consumed-container.json` verifies actual digest, nonroot1000:1000 and both
main.git/source-cache mounts. It deliberately omits the environment. The
explicit noncredential override query is empty (`build-controls.txt`);
inherited global options contain comments only and predate this build
(`global-options-metadata.json`), with no active assignments or commands.
Post-build consumed source/download inventory remains owed.

## Historical launch receipt (superseded by completion below)

At launch, live receipts were under `/workspace/tmp/rasteratops-m7-cold-01/`:
`build.log`, `build.pid`, `build.rc`, `build.status`, `build.status.err`.
PID3863117; host watcher3863200 wrote a30s heartbeat and detected completion,
stall or death. `initial-watch-status.txt` is a timestamped snapshot, not the
live heartbeat. Inspect the live file's mtime plus the process in the **host**
namespace; sandbox ps cannot prove a host process absent. No result exists
until exit. The watcher records status; it does not repair failures or run QA.

Do not edit the live launcher or advance its worktree while running. After
success, retain the exact image(s) with `tools/rasteratops-candidate-store`,
verify manifest/digests, then execute the live milestone's P3 matrix. A failed
build preserves `.threads/logs` in the live run's failure-logs directory.
Keep this failed attempt if any; do not overwrite its receipts on a retry.

P3 source selection must be explicit: run the QA tools from the frozen distro
checkout, set RETROARCH_SRC to this RASTERATOPS build root, and set ES_SRC to
a verified clean checkout at the manifest's exact ES commit. The wrapper
helper otherwise searches older warm roots. Existing supported overrides
suffice; a path's name alone does not establish the image's source identity.

The pre-commit credential-shape guard refused two literal tracked patch
filenames in the large inventory. Their values were verified as actual file
SHA256s, not credentials. Full inventory remains unchanged in the read-only
artifact store; Git carries the digest/summary. No scanner exemption or
encoding was used, and the live build manifest was not modified.

## Completion — 2026-10-03 16:33 UTC

All642 tasks and image assembly completed; `build.rc` is0. #393 replaced
only the false-stall watcher with a run-owned copy; it recorded finished/rc0
and exited. Watcher lifecycle proof: `../2026-10-03-watch-job/`.
Both emitted image/update SHA256 checks pass, and immutable custody verifies:
`/workspace/artifacts/rasteratops-candidates/sha256/83751e812351c72fc80a6a3cf418929769158684345cf6dd5f9e0fbcd9877d21`.
`candidate-custody.log` names the bundle. Actual consumed-source inventory
and the full P3 VM matrix remain; this is not an RC designation.

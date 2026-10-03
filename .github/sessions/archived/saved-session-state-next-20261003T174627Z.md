# Saved Session State

## Start here

ROCKNIX is an immutable handheld Linux build system; Rasteratops is this fork.
Read AGENTS.md and every-session `.claude/rules/` from `next` first; compare
feature rules before using them. Then read this checkpoint, live milestone7,
`docs/rasteratops/release-readiness.md`, today's work log and #383/#385.
Read scoped rules before touching their paths. Main checkout stays on `next`.
Use the existing Blitterbot identity; never print or request credentials.

The user asked **"can we proceed with our M7 plan?"** Continue execution,
not another readiness review or status-only response. The comprehensive review
and initial audit are complete. The cold branded engineering image finished16:33UTC on2026-10-03, rc0.
It is retained and checksum-verified; no VM qualification or RC is claimed. Working version remains0.0.1; optional1.0.0 was not selected.

## Binding order and naming — #388/#389

https://github.com/rasteratops/distribution/milestone/7 is **M7: Rasteratops
0.0.1** and holds the current execution order (D-WORKFLOW-139). P0 tracking
complete; P1 source complete; **P2 source gate complete; P3 current: completed image awaiting qualification**;
P3 cold engineering image/qualification; P4 approved independent fixes review;
P5 separately gated release staging/publication. Image-only criteria remain
P3; they require creating the engineering image and do not prohibit it.

`.claude/rules/milestone-phase-naming.md` names planned issues M7.Pn, with
optional Epic/sub-id scope. Issue numbers are references, not priorities.
#383/#344/#354 span phases. Never retitle closed issues or confuse #344's
historical contract section numbers with execution phases. Update the live
body/current-next work on a transition and read it back in the same session.
The current30-rule inventory and ES/splash entrypoints are repaired.

> Saved: 20261003T174627Z. Previous checkpoint: .github/sessions/archived/saved-session-state-next-20261003T170052Z.md.

## Completed source and diagnostic proof

- **P1 migration/recovery**:208 actor/state assignments;1367 broad+322 focused
  host checks PASS. Guest T17/T19/T23/T26 are promoted but need the candidate.
  Source table `docs/rasteratops/cloud-folder-state-table.md`, #365/#356/#320,
  #390/#391/#392. Do not repeat the initial research/audit.
- **#361/#384 proxy**:5866cd9ba784c13771a99c52dd6b6f2acc546842;14 patches
  fuzz0, upstream-supplied014/017 retired. Eight preservation/pacing controls,
  180 upstream tests,1367+322 full host PASS,0 FAIL/0 SKIP. Old cached sign-in,
  images and queued base/subset awards survive. Deliberate preparation125games
  bypasses ordinary100-game budget explicitly. Evidence
  `docs/qa-logs/2026-10-03-proxy-refresh/`, disposition
  `docs/rasteratops/raofflineproxy-refresh.md`. Runtime/upgrade P3 still owed.
- **#362/#386 dependencies**:glslang16.6.0 with matched known_good SPIR-V,
  cbindgen0.29.4,tllist1.1.0 confirmed current, shaderc patch corrected.
  Native coupled shader compilation and locked cbindgen build pass; full
  freshness/pkgchecks pass. libsoup3.8.0/WebKitGTK2.54.1 prepared. Evidence
  `docs/qa-logs/2026-10-03-dependencies/`; actual cold consumers remain P3.
- **#332 LED**:battery writer now respects saved brightness during color
  changes/blinks. Actual three-script fixture before6PASS/8FAIL, after14PASS.
  Actual VM popup reselection now also passes: accepting already-selected RGB
  writes128/white to all eight nodes; reset brightness0 then reselect MID
  restores128 with unchanged settings/channels. Nine assertions, frames,
  logs and hashes in `docs/qa-logs/2026-10-03-led/ui-reselection/`.
  Current LED menu/popup equals diagnostic source. No ES LED edit needed.
  Physical illumination is an open item to test in device-facts, not a
  software closure criterion (D-QA-051). #332 closed from published source
  and VM receipts. No device action performed.
- **#371 push hook**:destination-specific published-history exclusion;
  seven actual scratch-push controls PASS; formerly blocked bbb2c635fe merge
  passes direct hook. **Normal distribution push now PASS**; no bypass. #371 closed from actual
  push/remote readback receipts through featurec5e0b6bfec/next3d58a7f855.
  `docs/qa-logs/2026-10-03-push-hook/`.
- **#367/#368 process**:nine issue-history controls, safe runner help/five
  controls, three-way tool inventories and omission guards PASS. Fresh agent
  retested all six handoff findings PASS. Final resume proof also corrected
  stale readiness prose and a launcher receipt edge case; both retest PASS
  (`docs/qa-logs/2026-10-03-process/final-handoff-proof.md`). Build-container instructions now
  use Makefile's existing digest, not stale latest-tag advice. Evidence
  `docs/qa-logs/2026-10-03-process/`; required local push checks pass. #367
  is delivered/closed. All ES/splash entrypoint commits are published and #368 is closed.

## #310 memory — all strict diagnostic acceptance passes

Cause: software llvmpipe's unload lost Mesa's10MiB rtasm executable arena.
The allocator DSO control retains512000KiB over50 reloads before,0 after;
concurrent allocations and failure recovery pass. Further RSS endurance failed
with trimming alone. LeakSanitizer found ES udev enumeration leaks plus SDL
Wayland display mode-array and Mesa empty virgl-screen-cache leaks. Fixed
all lifetimes, and added two glibc-only trims around renderer teardown/return.
ES fallback udev paths are copied before freeing list storage.

All non-sanitized tests use five warmups, stable ES PID, actual emulator exit,
unchanged limits VmSize<1024KiB and RSS<2048KiB:

| Measured run | VmSize growth | RSS growth | Verdict |
| --- | --- | --- | --- |
| software10, sync off | 0KiB | 532KiB | PASS |
| software50, exit sync on | 0KiB | 364KiB | PASS |
| virgl10, sync off | 0KiB | 60KiB | PASS |

Fifty-run has55 distinct completed success stamps including warmup. Actual
host watcher1871339 observed runner1865694 and retained rc0. All finished.
Sanitizer before1,153,399bytes/14,360allocations; after808bytes/6 single shutdown
allocations, no repeat-per-launch leaks. Do not claim zero sanitizer findings.
Earlier failed controls remain intact; no threshold was relaxed.

Evidence `docs/qa-logs/2026-10-03-launch-memory/README.md`: source/binary hashes,
CSV/status/maps/stamps, sanitizer comparison, actual build/syntax checks,
packaged patch exact-byte/fuzz0 controls and reproducible allocator driver.
Mesa/SDL patches are committed/integrated. Qualified ES commits are now pushed
and the recipe selects full e6e1e4d0f91e177e182cc05b1cea74991e1cc45b. Package
lint passes. #310 is delivered/closed; candidate tests remain P3.

## Source delivery state

Distribution feature commits integrated onto `next` by exact cherry-picks:

| Feature | next | Work |
| --- | --- | --- |
| e2761d15f9 | 409250ebce | proxy |
| e8595345e3 | b4fc2a28cf | dependencies |
| 200a34c2b0 | a3d617ff54 | battery brightness |
| c3f0e88b7c | c3f0c75661 | process/hook/recorder |
| 33faa33c27 | 939e73a1d4 | Mesa/SDL memory cleanup and evidence |

Frozen build source is published next503e24e10dde6a59aa6c631f789b88b89f8e92e1
(feature pin commit3c6ee8e94eee55a69a8ea54c6730e316924c6c6c). Normal hooks and
remote readbacks pass. Later documentation commits must not advance or mutate
the frozen build worktree; its exact source stays503e24e10d. Inspect live
HEAD/status on primary/feature for documentation progress. Integrate exact new
single commits, never the feature's historical merges. Preserve unrelated work.

CI wordlist passes. Record CI initially caught #376 automatically closed by
historical commitf864baac02a5d9c819bbfe71931d3213e29b1ddd's closing keyword.
It is reopened: candidate archive/RC2-upgrade evidence remains P3. The issue
records GitHub's closure event and missing proof; issue-tracking now requires
neutral `Refs #N` until all criteria pass. Hygiene passes after correction.
Closing the delivered issues reaches the existing audit cadence:15 completed since
2026-10-02, limit12. Full ceremony check is red **only for audit due**; push
`--gate` remains0. Keep the approved independent fixes review in P4 after
artifact qualification; do not invent an audit receipt or reset its clock.
The bot cannot rerun Actions via API (403); a normal doc push triggers a new
check. This permission does not prevent normal pushes or issue updates.

ES `/home/max/Development/emulationstation-next.worktrees/cloud-epic`
feature/cloud-epic4f54ec035505b7a47501d298ae2ea3b0f6c7da4b and sibling
qa-integration test/qa-integratione6e1e4d0f91e177e182cc05b1cea74991e1cc45b
are published and clean. Normal pushes and exact remote readbacks pass.
Production source omits diagnostic timing output. The recipe now selects
that full QA hash; pkgcheck passes. Origin is rasteratops/emulationstation.
Dormant ES main checkout remains feature/imageviewer-rescan with local
instruction-only67f92692c; do not move that unrelated branch.

The owner approved the ES pushes, then explicitly approved splash master530b334.
Both are now published. The prior automatic approval rejections are historical,
resolved through named approval; **no ES/splash permission request remains**.
Splash `/tmp/rasteratops-rc-delivery-20261002/splash` is clean at published
530b334d084c76a06d43e010035518c73df8f622. This six-line AGENTS route does not
change product pin7450aa8180ae66684814dd460f31eb502b2abf61. Push/remote/freshness
receipts: `docs/qa-logs/2026-10-03-m7-es-delivery/`. Full freshness rechecked
immediately before input freeze: exit0; all current/inherited/local or coupled
pins with stated reasons. Future release/device/personal-cloud gates remain.

## Notification follow-up — #395

The maintainer requires completion notices, not just status files
(D-WORKFLOW-143). #393/#394 remain completed recorder/routing work; #395 owns
actual delivery and is open. The off-session destination has been asked in
chat but not selected yet. Do not infer email, desktop or GitHub delivery.
Before a long job, name and verify delivery. While active, await/check it
within 60 seconds and announce its terminal result promptly. Until a tested
off-session destination exists, explicitly state the disconnection limit.
No build or QA run is active. Product work remains P3 source inventory and
image qualification, then P4. The first handheld is RG35XX SP/H700 DDR4;
create its own qualified image before any named migration/device action.

## Immediate next actions

1. The build has completed: read `build.rc` (0) and terminal `build.status`
   under `/workspace/tmp/rasteratops-m7-cold-01/`. Builder3863117 and
   watcher4085803 have exited. A terminal status stops its heartbeat normally;
   do not diagnose this as a dead watcher or relaunch the build.
2. #393 watcher correctness and #394 automatic future-build routing are
   delivered with passing controls. Future native/Docker entrypoints use
   `tools/watch-build`; the current image keeps frozen503e. Terminal status
   wording was corrected after the fresh resume proof; final result readback
   at16:59:43UTC used short-lived recorder48573 and explicitly states that
   the heartbeat stops normally. It is no longer running.
3. Verify the retained artifact bundle below. Collect actual consumed-source/
   download inventory, then execute M7.P3 in the live body's order: clean/RC2
   upgrade, full suites and opt-ins, provider/pair/recovery, memory/UI/timing/
   identity/licence proof. Run image QA from the frozen checkout, with the
   explicit ES_SRC/RETROARCH_SRC values below.
4. Run approved P4 fixes review through Facilitator, primary+Fable5.1/xhigh.
   Initial #375/#382 is complete; do not restart it. Resolve findings and
   rebuild/requalify affected product bytes before any RC claim.

## Completed cold engineering build — M7.P3, qualification remains

`/workspace/repos/rocknix.worktrees/m7-generic-x64`, branchbuild/m7-generic-x64,
is frozen at503e24e10dde6a59aa6c631f789b88b89f8e92e1. Cold root
`build.RASTERATOPS-GENERIC_X64.x86_64` was created at14:02UTC. No warm build
root copied or renamed. The launched script is a run-owned immutable copy,
`/workspace/tmp/rasteratops-m7-cold-01/build.sh`, validated against the manifest.

- Run `/workspace/tmp/rasteratops-m7-cold-01/` owns `inputs.json`, `build.start`,
  `build.pid`, `build.log`, `build.rc` (on exit), `build.status`/`.err`.
- BuildPID3863117 finished16:33:39UTC with rc0; watcher4085803 recorded
  finished/rc0 at16:34:02UTC and exited. Old watcher3863200 was replaced
  at16:27UTC under #393 after mistaking buffered package output for inactivity.
  The run-owned `/workspace/tmp/rasteratops-m7-cold-01/watch-job-393` observed
  actual package logs. Its immutable deployed version is retained separately
  from the final shared tool, which also discovers new build roots for #394.
  Controls:28 watcher +34 automatic-runner PASS; actual pinned Docker smoke
  at a different mount path PASS; normal hook controls PASS. Receipts:
  `docs/qa-logs/2026-10-03-watch-job/`.
  Automatic chat notification is unarmed. No automatic QA continuation exists.
- Input SHA25624116729b3610411fe5ba89543cf10db98b11cb9ca8afc3cbf0ef61f08640459;
  1,608 recipes and6,606 tracked build-input hashes. Full read-only manifest:
  `/workspace/artifacts/rasteratops-build-inputs/m7-cold-01/inputs.json` (same
  bytes as live manifest). Git summary/digest and initial receipts:
  `docs/qa-logs/2026-10-03-m7-cold-01/`. Live logs stay in the run directory.
  Git retains a summary because its credential-shape guard rejected two
  ordinary patch filenames in the full inventory; verified as paths/hashes,
  no credential or guard bypass. The frozen build manifest is unchanged.
- Actual containerf68ec6df616a1989b3d8503b3b18e9a9f1c793484faf1373b0652c3d984b592b
  consumes ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39,
  user1000:1000, both main.git/source-cache mounts verified. No explicit
  noncredential source/build override is passed. Mounted global options are
  comments only, hashed with mtime predating build; no active setting omitted.
- Global24jobs, WebKit-j4. Preflight13:56UTC READY:about40GiB available,
  8GiB swap unused,1.9TiB disk free. Frozen upstream remains
  9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6 (D-WORKFLOW-111).
- All6,606 frozen source hashes reverified unchanged after watcher replacement.
  Build HEAD remains503e24e10d. The build has generated one tracked change:
  `documentation/PER_DEVICE_DOCUMENTATION/GENERIC_X64/SUPPORTED_EMULATORS_AND_CORES.md`.
  Preserve it; do not mistake this generated output for an edited build input.
- Engineering image and update tar exist, each about2GiB. Their emitted
  SHA256 files verify against actual bytes. Candidate-store also verified all
  copied bytes in immutable bundle:
  `/workspace/artifacts/rasteratops-candidates/sha256/83751e812351c72fc80a6a3cf418929769158684345cf6dd5f9e0fbcd9877d21`.
  It embeds the full frozen input inventory. Post-build consumed source/
  download inventory and all image QA remain owed. Custody is not an RC claim.

Old `/workspace/repos/rocknix.worktrees/generic-x64`, build/generic-x64b2378d9c33,
retains unrelated generated emulator-support doc and ignored warm diagnostic
Mesa/SDL/ES changes. Preserve them; do not rename/copy warm root into branded
root or mistake diagnostic bytes for frozen product inputs.

All owned diagnostic guests and endpoints are now stopped (host process check):
QEMU1531007/1881003, WebDAV1611685, tunnel1611728. Overlays retained at
`/workspace/tmp/rasteratops-m7-memory/memory.qcow2` and
`/workspace/tmp/rasteratops-m7-ui/ui.qcow2`; backing guest-d is unchanged.
Raw receipts `/tmp/rasteratops-m7-memory/`, LED `/tmp/rasteratops-m7-led-ui/`.
No diagnostic test loop, cold builder or watcher remains active; all ended.
No physical device/personal cloud action occurred. If reusing guests, read command profiles/receipts and
use their owned fixture mounts; credentials must never enter tracked evidence.

For candidate VM QA, run from the frozen build checkout and set
`RETROARCH_SRC=/workspace/repos/rocknix.worktrees/m7-generic-x64/build.RASTERATOPS-GENERIC_X64.x86_64`:
wrapper-test's default still searches old warm roots. Set
`ES_SRC=/home/max/Development/emulationstation-next.worktrees/qa-integration`
only after verifying its clean HEAD is the pinned e6e1e4d0f91e177e182cc05b1cea74991e1cc45b;
if it moved, use a source checkout of that exact pin. Both are existing supported
runner overrides. Compare source identities to the manifest before accepting
host-side suites; keep VM image digest checks separate. No QA has run on the
new engineering image yet.

Candidate evidence required in live M7 P3:15 default VM suites plus link/RA
opt-ins, clean install/RC2 upgrade, WebDAV/S3/pair migration, independently
reset promoted cases, archives/pending awards, sign-in/memory/timing, English
and French640x480/Nova1280x960 UI, identity, secrets, licences/source manifest.
Use `tools/rasteratops-candidate-store` for exact artifact custody and verify
manifest before/after QA. RC2 is under
`/workspace/artifacts/rocknix-images/x64-all-20260929-69e6039f8f/`; run101 under
`/workspace/artifacts/rocknix-images/x64-all-20261002-b2378d9c33/`.

P5 public docs/source bundle/adoption/recovery and device smoke gates remain.
Old fork-publish-release selects dated ROCKNIX assets and undrafts; do not use
it for manifest-bound Rasteratops publication. Publication, handheld actions
and personal-cloud writes retain named authorization. Upstream proxy #168
contribution is prepared but not submitted; acceptance does not hold the build.

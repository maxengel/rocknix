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
and initial audit are complete. No combined branded image exists and no RC
is claimed. Working version remains0.0.1; optional1.0.0 was not selected.

## Binding order and naming — #388/#389

https://github.com/rasteratops/distribution/milestone/7 is **M7: Rasteratops
0.0.1** and holds the current execution order (D-WORKFLOW-139). P0 tracking
complete; P1 source complete; **P2 source gate complete; P3 current: input freeze/cold build**;
P3 cold engineering image/qualification; P4 approved independent fixes review;
P5 separately gated release staging/publication. Image-only criteria remain
P3; they require creating the engineering image and do not prohibit it.

`.claude/rules/milestone-phase-naming.md` names planned issues M7.Pn, with
optional Epic/sub-id scope. Issue numbers are references, not priorities.
#383/#344/#354 span phases. Never retitle closed issues or confuse #344's
historical contract section numbers with execution phases. Update the live
body/current-next work on a transition and read it back in the same session.
The current30-rule inventory and ES/splash entrypoints are repaired.

> Saved: 20261003T135950Z. Previous checkpoint: .github/sessions/archived/saved-session-state-next-20261003T135950Z.md.

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
  is delivered/closed. All ES/splash entrypoint commits are now published;
  #368 can close after this delivery record is integrated.

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
lint passes. #310 closure follows pin integration; candidate tests remain P3.

## Source delivery state

Distribution feature commits integrated onto `next` by exact cherry-picks:

| Feature | next | Work |
| --- | --- | --- |
| e2761d15f9 | 409250ebce | proxy |
| e8595345e3 | b4fc2a28cf | dependencies |
| 200a34c2b0 | a3d617ff54 | battery brightness |
| c3f0e88b7c | c3f0c75661 | process/hook/recorder |
| 33faa33c27 | 939e73a1d4 | Mesa/SDL memory cleanup and evidence |

Distribution source/evidence is published through featurec5e0b6bfecd30be55713fb8685b138eadde45e7e
and next3d58a7f8558a08e0ab1d0cab2e78dc834c6c071a. The normal push passed and
remote hashes matched; no hook bypass. Latest closure receipts/checkpoint/rule
addendum follow in a documentation commit; inspect live HEAD/status rather
than assuming these snapshot hashes are still tips. Integrate exact new
single commits, never the feature's historical merges. Preserve unrelated work.

CI wordlist passes. Record CI initially caught #376 automatically closed by
historical commitf864baac02a5d9c819bbfe71931d3213e29b1ddd's closing keyword.
It is reopened: candidate archive/RC2-upgrade evidence remains P3. The issue
records GitHub's closure event and missing proof; issue-tracking now requires
neutral `Refs #N` until all criteria pass. Hygiene passes after correction.
Closing #332/#367/#371 reaches the existing audit cadence:13 completed since
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

## Immediate next actions

1. Finish integrating/pushing this full ES pin and delivery record using exact
   new commits, not historical feature merges. Close #310 and #368 from their
   already-verified source/VM/entrypoint evidence. Keep candidate criteria P3.
2. Fast-forward build/m7-generic-x64 to the integrated source commit. Recheck
   host preflight, run the retained freeze script, start the cold build and
   its actual host watcher. Record exact source/manifest/PID/log/status in
   live M7 and #383. No build was running at this checkpoint; inspect current
   receipts before launching another. The owner has authorized this work.
3. Qualify the exact artifact and run approved P4 review. Do not restart
   #375/#382. Primary+Fable5.1/xhigh through Facilitator is already authorized.
   Resolve findings, rebuild/requalify changed bytes, then assess RC readiness.

## Cold-build preparation and QA entrypoints

New isolated `/workspace/repos/rocknix.worktrees/m7-generic-x64`, branch
build/m7-generic-x64, currentlyc3f0c75661. No cold build root and no build running.
Prepared reproducible launcher/freeze scripts:
`docs/qa-logs/2026-10-03-m7-build-preparation/` and `/tmp/rasteratops-m7-build/`.
They validate clean branch/commit, qualified ES pin served by remote, all input
hashes, actual pinned container, new `build.RASTERATOPS-GENERIC_X64.x86_64`,
nonroot build, both main.git/source-cache mounts and nonoverwritten receipts.
Syntax checks pass; no actual freeze or build has occurred. A watcher must be
started in the host namespace after the build PID exists; none is running now.

Frozen upstream9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6 (D-WORKFLOW-111).
Container ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39
is available locally and verified by digest. Global24jobs; WebKit-j4 remains
per-package. Build as max, not root. Source cache `/workspace/cache/rocknix-sources`.
Preflight13:56UTC: READY,about40GiB available,8GiB swap unused,1.9TiB disk free.
Recheck before launch. Collect actual consumed sources/download inventory.

Old `/workspace/repos/rocknix.worktrees/generic-x64`, build/generic-x64b2378d9c33,
retains unrelated generated emulator-support doc and ignored warm diagnostic
Mesa/SDL/ES changes. Preserve them; do not rename/copy warm root into branded
root or mistake diagnostic bytes for frozen product inputs.

All owned diagnostic guests and endpoints are now stopped (host process check):
QEMU1531007/1881003, WebDAV1611685, tunnel1611728. Overlays retained at
`/workspace/tmp/rasteratops-m7-memory/memory.qcow2` and
`/workspace/tmp/rasteratops-m7-ui/ui.qcow2`; backing guest-d is unchanged.
Raw receipts `/tmp/rasteratops-m7-memory/`, LED `/tmp/rasteratops-m7-led-ui/`.
No test loop, build or watcher remains active. No physical device/personal
cloud action occurred. If reusing guests, read command profiles/receipts and
use their owned fixture mounts; credentials must never enter tracked evidence.

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

# Research notes — Rasteratops 0.0.1 readiness

**Started:** 2026-10-02T05:54:52+00:00
**Scope:** #375, cloud epic #354, release #344, OS identity #337, root-cause prerequisite #365.
**Stage:** Phase 1 in progress. No readiness verdict yet.

## Sources and boundary

Canonical handoff: `.github/sessions/saved-session-state-next.md` from `next`; decisions D-CLOUD-156 through D-CLOUD-172 and D-WORKFLOW-134. Current bot identity work #373/#374 is complete and is not a release defect. Product identity work #337 is a separate scope.

The review will distinguish executable checks from saved frames, image evidence from newer host harness code, and reproduced defects from untested hypotheses.

## Baseline observations

- Current `next` recipe pins ES `e108699ea313ecd5ec64b4310a4ea665e05ca19f`; cloud ES worktree matches. Run-101 image RECORD names distro `b2378d9c33196f24066f1bcd233e14fa88211001` and that ES pin.
- `feature/identity` remains separate at `c4a4cd188c63921b627d9af84ac081737c910b7e`. A bot rename completed on #374 does not qualify this OS image.
- Cloud worktree `150551138d` has an uncommitted changelog; build worktree has generated emulator documentation. Both preserved.
- Raw evidence roots: `/workspace/artifacts/rocknix-images/qa-b2378d9c33-webdav-a-20261002-0100/`; pair proof `/workspace/tmp/rocknix-session/pair-101.log`; benchmark `/workspace/tmp/rocknix-session/follow-bench-100/bench.log` (despite its directory name, its first line identifies run 101).
- Round-trip starts by assigning `/GAMES`, uploads 0/9; downstream restore/allowlist/recent-save checks consequently do not exercise their intended path. Pair step 5 succeeds; original step 5m expects the forbidden recreation and its dependent checks fail. Tool rewrite `93235f254b` is newer than the image and has no new execution receipt.
- Benchmark raw five samples: earlier 669/325/322/364/317 ms versus current 621/254/253/291/266 ms. Existing 30 ms median-difference criterion is exceeded. This is a legacy-folder cost, not evidence that current-folder exit sync regressed.
- Source: `cloud_scan:153–185` joins, reads state and optionally follows; `cloud_migrate_layout:749–908` owns state/follow/join/settle; `cloud_backup:1674–1687` independently tests old-folder existence on every saves backup; `cloud_restore:1660–1737` distinguishes absent child from absent parent; ES `GuiMenu.cpp:5545–5603` waits for worker completion but does not test outcome-card lifetime.

## Research summary

Planned: retain RC2 storage/machine contracts, move the cloud default under explicit migration, qualify a Rasteratops wordmark/0.0.1 image, then prove manual adoption on RG35XX SP. Product work is #354/#337, release sequence #344. Inherited whole-codebase review is separately #346 for 0.0.2 (D-WORKFLOW-102), upstream PR work parked (D-WORKFLOW-087). D-WORKFLOW-113 defers infrastructure topology/restore-drill work; D-WORKFLOW-126 settles owner recovery for now. Neither should be rediscovered as a fresh approval blocker.

The cloud implementation spans rclone scripts, ES pages/boot worker, test backend and migration pair harness. Its seven actor paths and image results will be checked independently in Phase 2. The phase added state/join/follow/settle verbs but backup/restore retain separate existence predicates. Identity changes must preserve archive readers and update-tar compatibility in addition to labels.

## Prior-audit provenance map

- 2026-09-25 milestone since #258: prior RC changes, widened in its research notes; heterogeneous subsystem packets.
- 2026-09-28 audits of #307 fixes / fix round: eight streams and later fixes; serial review receipts, source packets and model provenance.
- 2026-09-29 audit of #313 fixes: distro `1b0d233657..02546235c1`, ES `87b182fbe..c15c698367`, #315 separately `320d2b2bea..286759eb6d`. These predate cloud epic changes.
- Most recent mini-retro: `docs/work-logs/2026_09-work_logs/2026_09_28-work_log.md:101`; cloud futro `docs/futros/2026-10-01-cloud-epic-354.md` includes #356. Per-AC verdicts from those audits are not copied into this review.

## Tier B coverage

Run 101 walk/frame-diff report has 17 compared frames and zero unclaimed rectangles, on ROCKNIX-named image b2378d9c33. Child-specific frames under `docs/qa-frames/2026-10-01/{351,354}` and `2026-10-02/363` supplement them. Session proof C/F/G frame collection is not executable assertion coverage. The saved E frame is required to assess boot-card ordering; branding frames do not yet qualify a RASTERATOPS image.

## Test substrate correction

KVM/render devices are hidden in the default sandbox but are present and readable/writable in escalated execution. No existing ROCKNIX guests were found. `bwrap --ro-bind / / true` succeeds escalated; the full existing host script suite is running. VM tests need deliberate guest/backend setup, not reuse of stale PIDs. Initial sandbox-only absence is not a host-capability verdict.

## Evidence formatting

Saved excerpts and host-log copies have trailing spaces removed for repository
whitespace checks; source line prefixes, command output content and results are
otherwise preserved. The source commits and original kept-artifact paths above
remain authoritative. No command was rerun to create a different result.

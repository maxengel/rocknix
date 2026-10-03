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
It is retained and checksum-verified. All15 default suites have passing evidence
after a host assertion correction; RC2 upgrade passed. Full P3 and RC status
remain open, including a replacement image for missing policy files (#397). Working version remains0.0.1; optional1.0.0 was not selected.

## Binding order and naming — #388/#389

https://github.com/rasteratops/distribution/milestone/7 is **M7: Rasteratops
0.0.1** and holds the current execution order (D-WORKFLOW-139). P0 tracking
complete; P1 source complete; **P2 source gate complete; P3 current: replacement image for #397/#401; matrix, host and production memory complete**;
P3 cold engineering image/qualification; P4 approved independent fixes review;
P5 separately gated release staging/publication. Image-only criteria remain
P3; they require creating the engineering image and do not prohibit it.

`.claude/rules/milestone-phase-naming.md` names planned issues M7.Pn, with
optional Epic/sub-id scope. Issue numbers are references, not priorities.
#383/#344/#354 span phases. Never retitle closed issues or confuse #344's
historical contract section numbers with execution phases. Update the live
body/current-next work on a transition and read it back in the same session.
The current30-rule inventory and ES/splash entrypoints are repaired.

> Saved: 20261003T210154Z. Previous checkpoint: .github/sessions/archived/saved-session-state-next-20261003T210154Z.md.

## Current replacement build — #397/#401, 2026-10-03 20:59UTC

Published source is feature7f439463b7 / next134e89c4fcb08581f1c831229167364828a37e27.
The dedicated build/m7-generic-x64 was intentionally fast-forwarded to that
published next only after the original6,606 input hashes verified. Its one
generated emulator-support document was copied/hashed and preserved. The
original503e immutable candidate and input inventory remain untouched.

**Replacement build COMPLETE at21:01:38UTC, rc0:** owner
`/workspace/tmp/rasteratops-m7-replacement-01/`; waiter84075 finished,
runner2127103/watcher2127120 exited. All642 tasks and assembled policy/content
byte checks passed. Immutable new bundle:
`/workspace/artifacts/rasteratops-candidates/sha256/fc6b9774f79d5fcf6a4e077af1f321b7a125401b08671cad7f0a5c807dbd64d5/`.
Image SHA25688afd2ac9720bcdf14cde20cc5814733b339be87b76aa3c4a16d3c0439240abc.
Receipts `docs/qa-logs/2026-10-03-m7-replacement-01/`.

**Replacement default/upgrade COMPLETE:**14PASS/1SKIP (the launcher omitted
WALK_BASELINE). The separate78-frame comparison found one live statistics
line at t05; #406 now has a narrow claim, absent/undersized negative controls,
and a passing comparison without changing the baseline. Actual RC2 upgrade
passed21:38:09. Outer waiter43904 returned1 because final payload readback
ran after the rehearsal stopped its guests. Preserve that original failure.
Restarted the same retained upgraded disk under watcher2784310; exact full
BUILD_ID and five policy/content hashes/modes PASS, custody PASS, rc0 at
21:47:29. Guest stopped. Owner `/workspace/tmp/rasteratops-m7-upgrade-readback-01/`;
receipts `docs/qa-logs/2026-10-03-m7-replacement-qa/`.

**Provider qualification COMPLETE:** owner
`/workspace/tmp/rasteratops-m7-replacement-link-01/`, waiter46328 finished.
All7 WebDAV cases PASS477s, all7 S3 PASS463s. Frozen build run
`.build-runs/20261003T214755Z-2b4c865d/` recorded child/watcher rc0 at22:04:52;
candidate custody PASS and a/b guests/endpoints stopped. Outer tool waiter
reported143 despite that record; preserve the discrepancy under#395. A
separate throttled-S3 lifecycle probe at9032 records child/watcher/outer/tool
rc0. Cause remains unproved; do not relabel the original outer result.
Receipts `docs/qa-logs/2026-10-03-replacement-links/`.

**Independent UI capture COMPLETE:** owner
`/workspace/tmp/rasteratops-m7-release-ui-01/`, waiter32800 finished0;
feature run `.build-runs/20261003T215847Z-b2b036ec/`, terminal22:05:29.
Guest-d and WebDAV9030 stopped. First run75889 captured English640 then
failed a PIL import; six retained frames pass direct PNG-header checks.
Continuation captured French640 then EN/FR1280x960 (six frames each).
Offline explanation/cloud hub/tier pages visually reviewed in all four
language/panel combinations; additional game-settings/provider frames
remain to inspect. Site screenshot updated locally on the existing
`/home/max/Development/rocknix.org` docs/cloud-saves-native-wizard branch,
not committed/pushed yet. #327 frames under docs/qa-frames/2026-10-03/327.

**First archive runtime proof COMPLETE:** owner
`/workspace/tmp/rasteratops-m7-archives-01/`, waiter12990 finished0. Frozen
run `.build-runs/20261003T220641Z-d2b9febe/`, terminal22:07:36. Uses new
COW overlay of the actual stopped RC2-upgraded replacement disk at
`/workspace/tmp/rasteratops-m7-replacement-qa-01/pair/vm-a.qcow2`; preserve
that base. Actual inherited archive restored locally and via cloud; original
bytes kept. New production writer→scan→restore and settings-only /ROCKNIX
and /GAMES follow/settle pass. Source and24 assertions in
`docs/qa-logs/2026-10-03-archives-runtime/`. These are partial criteria: setup,
archive selection/retention/revert/UI, explicit content root, S3 denied-listing
and repeated timing remain. No VM currently running. Next extend this
archive proof on its owned overlay; use another immutable launcher and
record outer.rc as well as the watcher. No disconnected alert is configured.

Input manifest SHA2569da8a37468c3b65490cde4c88c8f8e611718ea9e853337fa35ad4cac0aee8315
records6,611 file hashes plus180 raw symlink targets, including root
LICENSE.md/TRADEMARK.md and watcher entrypoints. Read-only copy:
`/workspace/artifacts/rasteratops-build-inputs/m7-replacement-01/inputs.json`.
Same ES/splash/container/global24/WebKit4 inputs. Cached replacement uses
the original cold root, explicitly cleaning rclone and invalidating the
image stamp; no old diagnostic root copied. Actual containerab84957fd9d9,
user1000:1000, expected main.git/source-cache mounts, receipt owner/container.json.
Preflight sees48GiB available/no guests; historical8GiB swap full is recorded.
Only lightweight package/image rebuilding expected, no C++ input changes.

Earlier20:59:30 launcher exited1 before output mutation because Path.readlink
normalized a trailing slash in its comparison. Raw os.readlink comparison
corrects that preflight; original script/log preserved. An earlier inventory
attempt encountered an existing broken symlink; final manifest records all
symlink targets, hashing file contents where present. No source changed.

Next: extend the completed archive proof, then remaining S3 fault, content-root, timing and RA checks. Custody is verified before/after
QA; retain all original failure reports. No RC claim. Do not move this new frozen build HEAD for documentation.
#402/#403/#404/#405 closed from published evidence, live readbacks verified.

## Follow-up preparation (current running state is above)

- The completed provider job: `/workspace/tmp/rasteratops-m7-replacement-link-01/run.sh`
  runs all7 WebDAV then all7 S3 link cases sequentially on retained replacement
  bundlefc6b9774f79d. Separate provider pair/backend owners,200k rate, immutable
  harness.sha256 and shared runner copies prepared. Launch under its runner
  from the frozen build tree with activity-dir owner/artifacts and recursive
  activity; use a new active waiter and record actual PIDs. No parallel pair reset.
- `/workspace/tmp/rasteratops-m7-release-ui-01/` holds a fresh16GiB replacement
  guest-d disk and dedicated QA identity for later EN/FR panel checks. Watched
  preparation completed rc0, disk check PASS at21:22UTC; the capture continuation is now complete as described above.
  Prepare run record in feature `.build-runs/20261003T212206Z-6b089f07/`.
  seed.py asserts full134e89 BUILD_ID and actual homebrew ROM hashes.
- `/tmp/m7-archive-proof.py` is an UNRUN prototype for guest-d production
  archive proof: inherited RC2 local/cloud recovery, writer/scan/restore,
  settings-only follow/settle. Syntax checked only; do not claim its assertions
  pass. It needs a stopped retained RC2-upgraded disk (use a new COW overlay,
  preserve original), SSH identity, and separately owned synthetic WebDAV.
  Removes cached root archives from the selection into a retained subfolder
  before cloud restore, preventing a cached-file false positive. Review actual
  source/arguments and lifecycle setup before running; promote once proven.
- Watcher death/monitor-loss probes completed, both PASS; active conversation
  received the expected failure notices. Receipts `2026-10-03-watch-delivery`.
  Disconnected destination/delivery-failure handling remains #395.

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

Original cold01 source was published next503e24e10dde6a59aa6c631f789b88b89f8e92e1
(feature pin commit3c6ee8e94eee55a69a8ea54c6730e316924c6c6c). The explicit
replacement freeze above advances the dedicated build to published134e89c4fc
for #397/#401. Later documentation commits must not move that new freeze.
Normal hooks and remote readbacks pass; the evidence-only next commit is
7f4b03a167 (feature143f3145e6). Its unpublished next message was amended to
add the issue citation required by the push guard; no force push or source
change. Integrate exact single commits, never historical feature merges.
Preserve unrelated work.

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
The completed guest-d matrix/memory/default/upgrade and completed provider/UI and partial archive QA are detailed here. Product work remains P3 image
qualification and the #397 replacement, then P4; consumed-source inventory is now retained. The first handheld is RG35XX SP/H700 DDR4;
create its own qualified image before any named migration/device action.

## Immediate next actions

1. Continue remaining archive/fault/timing qualification above; the explicit frozen134e89 inputs supersede
   the historical503e build checkout, not the retained503e artifact/evidence.
2. Retain and qualify replacement clean/default, RC2 upgrade and affected
   content/link cases. Remaining archives/pending awards/UI/timing/identity
   gates stay open. RA fixture and off-session notification questions await reply.
3. Run approved P4 fixes review through Facilitator, primary+Fable5.1/xhigh.
   Initial #375/#382 is complete. Resolve findings and rebuild/requalify any
   affected product bytes before an RC claim. P5 remains separately gated.

## Candidate QA — completed matrix/host/memory results (#383 / #395)

Default run ended18:51UTC:14PASS/one host assertion FAIL; all16 walks and
frame comparison pass. #396 corrected the test's expectation: new writer
archives intentionally retain ROCKNIX for old-reader compatibility. Full
corrected WebDAV round-trip passed81s at18:54UTC on the unchanged candidate.
All15 default suites therefore have passing evidence across those two runs.
Do not rewrite the first failed report or infer a new product build.
Evidence: `docs/qa-logs/2026-10-03-m7-qa-01/default/` and
`docs/qa-logs/2026-10-03-archive-harness/rerun/`.

RC2 upgrade passed18:57:43UTC:69e6039f8f ->503e24e10d, byte-identical saves
and states, settings/cloud/backup retained, update queue empty, boot quirks
applied and owner's settings/files kept. Owned pair/backend stopped. Evidence:
`docs/qa-logs/2026-10-03-m7-qa-01/upgrade/`; full artifacts:
`/workspace/artifacts/rocknix-images/qa-503e24e10d-upgrade-from-69e6039f8f-20261003-1856/`.
Run01 waiter33776, corrected waiter66256 and upgrade waiter71273 all finished;
their terminal recorders exited normally. Proactive failure and success
notices were delivered in chat. No disconnected notification is configured.

S3 complete round-trip passed107s at19:00UTC. Pair migration passed42/42
at19:04:37UTC, exercising actual RC2+fresh503e devices, joining existing
cloud data, update then verified migration, second-device follow, missed
step/late old-device writes and provider refusal without changed pointers.
Receipts under the main QA directory's `s3/` and `pair/`. Waiters3351 and
15710 finished; both pairs and endpoints stopped. The pair's output folder
uses the bundle's suffix bcd9877d21 only as a label; actual guest BUILD_IDs
are asserted inside its log. A setup typo's observation path was repaired
through a same-inode log alias; `pair/activity-alias.log` retains the proof.

**Guest matrix COMPLETE at20:31:24UTC:** all19 independently reset640x480
cases pass,249 assertions/0 failures on exact503e24e10d. Owner
`/workspace/tmp/rasteratops-m7-guest-d-01/`; waiter35838 finished rc0,
runner1157659/watcher1157674 and owned guest1157712 have exited. WebDAV
stopped. Case order H A C D B E I J K L F G T08 T11 T12 T17 T19 T23 T26.
Receipts `docs/qa-logs/2026-10-03-guest-matrix/`:19 logs, totals,1467 frame
hashes and retained launch inputs. Frames remain under the owner's artifacts.
Only selected H/L frames visually inspected so far; do not equate all249
assertions with full language/resolution visual qualification.
#404 fixes the old frame-count glob after the harness exited; actual H/A/L
counts5/8/16, before0/3 correct and after3/3. Published in feature7f439463b7 / next134e89c4fc; #404 closed.

**Host regression02 COMPLETE at20:47:25UTC:**1373 broad+322 layout PASS,
0FAIL/0SKIP, terminal rc0. Owner `/workspace/tmp/rasteratops-m7-content-host-02/`,
waiter59057 finished; runner1687483/watcher1687498 exited. Exact retained
source hashes reverified after completion; QA_SYSTEM_ROOT selected the
candidate BusyBox5e8a9142…dee2f and rclone361c27d9…924c. Host01's old
literal-copy assertion failure is retained. Six complete content-script
inactivity/progress checks now run in the standard suite. Receipts:
`docs/qa-logs/2026-10-03-content-network/host-after/`.

**Production memory/sign-in COMPLETE at20:56:03UTC:** owner
`/workspace/tmp/rasteratops-m7-production-memory-01/`; waiter5744 finished rc0,
runner2058906/watcher2058978 and owned guest exited. Virgl10 VmSize0KiB/RSS620KiB;
software10 0/52KiB; software50 exit-sync 0/1228KiB. Five warmups, unchanged
strict1024/2048KiB limits, fixed ES PID and actual exits. All55 sync stamps
unique/successful.30s sign-in page load passes, peak combined RSS292788KiB;
this is not provider authentication/redirect evidence. Prior launcher errors
(--gl software, then absent config directory) occurred after successful phases;
all original logs remain. Receipts: `docs/qa-logs/2026-10-03-production-memory/`.
No parallel guest-d restriction remains from this completed job.

Check every active status/log within60s and announce failures or terminal
results before unrelated work. For process checks use the host namespace
(escalated execution); ordinary sandbox ps cannot see host PIDs. Five-second
recorders and5min suspected-inactivity threshold; no disconnected delivery.

All link jobs are finished. WebDAV link-01 ended19:15 rc1 (#398 stamp parser).
Link-02 failed before suites (#399 isolated identity). Corrected sources are
published: #398 feature052e974e68/nextd426f7058c; #399 featurecb6e792b91/
next031f41beaa. Controls14/14 and3/3 pass; fresh link-03 used a distinct key,
authenticated and exercised all seven cases. Six passed; #400 owned LINK5's
retry124 from an oversized12MiB fixture. Original reports remain retained.

#400 correction is now applied:6MiB archive stays in flight at cut but drains
inside the unchanged36s product ceiling; strict_retry=True forbids skipping
retry or receiving-content checks. Actual AST controls old3/6, current6/6.
Strict real LINK5 passes without any skip on WebDAV19:46UTC (interruption69
in29.5s) and S3 19:49UTC (69 in35.9s), both retry0, whole bytes, no partials
and unchanged upload marker after interruption. All7 WebDAV cases now have
passing evidence across the corrected whole run and strict LINK5 rerun.
Receipts `docs/qa-logs/2026-10-03-link-retry/`; all owned pairs/endpoints stopped.

**Product failure #401:** original full S3 run ended19:43 rc1. LINK3/4
content backup/restore waited out the40.7s outage and returned0 at70.3/59.0s,
stamping success. Route/address loss is observed; content/retries match but
that does not excuse missing inactivity bounds. Content scripts call rclone
directly with30s I/O timeout/ten SDK retries and only probe network after
nonzero return. Saves/settings already have progress-sensitive bounded_rclone.
Fix content inactivity without ending long progressing transfers; inspect
cancellation, partial accounting and sibling listings. A shared progress-sensitive copy/sync guard is published in feature7f439463b7 / next134e89c4fc. Both actual copy-call sets pass18/18
controls after vs12/18 before, including candidate BusyBox; full-script
checks add6/6. It preserves progressing long transfers/cancellation and
fails closed when its guard cannot be created. The real scan
failure sentence is also corrected for the outcome vocabulary. Full host rerun02 passed and source is published; replacement proof remains. Baseline/filtered live guest evidence is retained under
`docs/qa-logs/2026-10-03-content-network/`.
**Fixture #402:** pagination RCLONE_S3_LIST_CHUNK=1 now makes an actual
S3 cut land at20:17:22. The unchanged guest ends1 after43.1s, keeps stamps,
and retries all24 systems/BIOS. Overall rc1: the now-reached failure sentence
violates the outcome vocabulary (#401). That sentence is corrected in published source; real rebuilt proof is owed. Before/after fixture controls6/7
then7/7, including completed-before-cut failing. Owned S3 pair stopped.
#403 corrects host discovery that ignored branded roots, with explicit
QA_SYSTEM_ROOT and fail-closed missing/unusable inputs: old0/8, current8/8.
#405 corrects signin-memory help printing Python imports; both help flags
now show usage, runtime unchanged. These source changes are published; #402/#403/#404/#405 are closed. No memory tool is running.

RA preflight is a pending fixture dependency: live dedicated QA account
already earned Tobu achievement100359; hardcore unearned but current routed
offline test checks ordinary award. User question pending to reset that QA
achievement or configure another QA account privately. Do not reset progress
or claim RA PASS without reply and live availability recheck. No credentials
printed. Receipt `docs/qa-logs/2026-10-03-m7-qa-01/ra-fixture-preflight.json`.
Continue independent tests. No physical device/personal cloud touched.

**Product gate #397:** original503e SYSTEM lacked the fork branding licence
and trademark policy. Published image assembly fix passes4/4 staged controls;
both root files are now in the explicit replacement inventory and installed
byte-identically in assembled134e89 SYSTEM. The replacement bundle is retained;
its clean/upgrade guest readbacks pass exact bytes/modes. Original503e is not qualified by
this new evidence. Preserve both bundles, manifests and generated documentation.

#396 host-only correction is feature96ccdb16e5 / next4f0dcdfcaf, published.
It has16/16 assertion controls (original14/16), and full VM proof above.
This does not change the frozen image or justify redoing unrelated source work.
Current next also retains watcher/runner controls32+35PASS. Off-session
notification #395 remains open, distinct from completed recorder #393/#394.

After replacement qualification: RA opt-in, archives/pending awards,
timing and EN/FR640x480/Nova1280x960 identity/UI. Production memory/page-load passed.
Collect concrete failures, apply qualified fixes to a new image, renew affected
proof, then approved P4. Never start a second pair/reset the active endpoint.

Source inventory:568 unpacked roots,547 cache inputs,17 local/generated,
three parent-source packages, one prebuilt rclone;0 checksum/identity errors.
Rclone ZIP recovery matches both pinned archive and consumed binary. Read-only:
`/workspace/artifacts/rasteratops-build-inputs/m7-cold-01-consumed/7736dfcc2065d979b7cf090e361e430efbd4af1c22dba17a60bbceed611d0b8b/`.
Original manifest/bundle verify unchanged before and after default QA. This
is provenance, not a publication corresponding-source/licence gate pass.

## Completed cold engineering build — M7.P3, qualification remains

`/workspace/repos/rocknix.worktrees/m7-generic-x64`, branchbuild/m7-generic-x64,
was originally frozen at503e24e10dde6a59aa6c631f789b88b89f8e92e1; the replacement
section above records its intentional advance. Cold root
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
  At cold completion HEAD was503e24e10d. That build generated one tracked change:
  `documentation/PER_DEVICE_DOCUMENTATION/GENERIC_X64/SUPPORTED_EMULATORS_AND_CORES.md`.
  Preserve it; do not mistake this generated output for an edited build input.
- Engineering image and update tar exist, each about2GiB. Their emitted
  SHA256 files verify against actual bytes. Candidate-store also verified all
  copied bytes in immutable bundle:
  `/workspace/artifacts/rasteratops-candidates/sha256/83751e812351c72fc80a6a3cf418929769158684345cf6dd5f9e0fbcd9877d21`.
  It embeds the full frozen input inventory. Post-build source/cache inventory is retained below; image QA has default/upgrade PASS evidence; remaining P3 is active. Custody is not an RC claim.

Old `/workspace/repos/rocknix.worktrees/generic-x64`, build/generic-x64b2378d9c33,
retains unrelated generated emulator-support doc and ignored warm diagnostic
Mesa/SDL/ES changes. Preserve them; do not rename/copy warm root into branded
root or mistake diagnostic bytes for frozen product inputs.

All owned diagnostic guests and endpoints are now stopped (host process check):
QEMU1531007/1881003, WebDAV1611685, tunnel1611728. Overlays retained at
`/workspace/tmp/rasteratops-m7-memory/memory.qcow2` and
`/workspace/tmp/rasteratops-m7-ui/ui.qcow2`; backing guest-d is unchanged.
Raw receipts `/tmp/rasteratops-m7-memory/`, LED `/tmp/rasteratops-m7-led-ui/`.
Those old diagnostic jobs and the later production-memory guest have ended.
No physical device/personal cloud action occurred. If reusing guests, read command profiles/receipts and
use their owned fixture mounts; credentials must never enter tracked evidence.

For candidate VM QA, run from the frozen build checkout and set
`RETROARCH_SRC=/workspace/repos/rocknix.worktrees/m7-generic-x64/build.RASTERATOPS-GENERIC_X64.x86_64`:
wrapper-test's default still searches old warm roots. Set
`ES_SRC=/home/max/Development/emulationstation-next.worktrees/qa-integration`
only after verifying its clean HEAD is the pinned e6e1e4d0f91e177e182cc05b1cea74991e1cc45b;
if it moved, use a source checkout of that exact pin. Both are existing supported
runner overrides. Compare source identities to the manifest before accepting
host-side suites; keep VM image digest checks separate. The completed first default QA run used these exact paths.

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

Harness scope clarification: the completed all-suite run used the frozen
checkout plus pinned ES_SRC/RETROARCH_SRC, because it executes host source
suites. Corrected round-trip, S3, completed link runs and the completed guest matrix and completed memory run intentionally
use the feature host harness, with exact retained harness.sha256 checked
before launch, against the unchanged candidate. They run no host source
suites, so those source overrides are unnecessary. Do not rerun an obsolete
assertion merely to obey the older generic frozen-checkout instruction.

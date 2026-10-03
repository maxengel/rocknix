# Saved Session State

## Start here

ROCKNIX is an immutable handheld Linux build system; Rasteratops is this fork.
Read `AGENTS.md`, every-session rules from `.claude/rules/` on `next`, this
checkpoint, `docs/rasteratops/release-readiness.md`, the current work log and
#383/#385 before resuming. Compare feature rules with `next` first. Scoped
rules load before touching their paths. Main checkout stays on `next`.

The owner asked for a comprehensive first-release goals/issues/readiness
review after repeated VM rounds. **The review is documented; the release is
not RC-ready.** No combined branded 0.0.1 image exists. Keep 0.0.1 as working
version; the owner's optional 1.0.0 suggestion did not authorize a rename.
Do not restart the initial audit or treat its completion as product acceptance.

## Current priorities and naming — #388

The binding running order is the GitHub milestone body:
https://github.com/rasteratops/distribution/milestone/7,
now named **M7: Rasteratops 0.0.1**. D-WORKFLOW-139 and the newly adopted
`.claude/rules/milestone-phase-naming.md` make it authoritative. The rules now
number30; the delivery/futro/retro naming references resolve locally.

**Current priority: M7.P2** qualified inputs. P1's source gate now passes:
explicit actor/predecessor coverage, conservative inherited recovery, no-remote
refusal and guest recovery promotion. Image-only acceptance remains P3.
Continue M7.P2 qualified inputs; M7.P3 cold build plus image qualification;
M7.P4 approved independent fixes audit; M7.P5 separately gated release
staging. M7.P0 records the tracking-convention prerequisite #388. Open issue
titles now carry their phase; #383/#344/#354 are milestone-wide umbrellas.
M comes from the milestone name, not GitHub's ordinal; issue numbers are
references, not priority. Closed issue titles and #344's historical contract
section numbers are preserved. See the milestone for their explicit mapping.

When work starts/finishes or priorities change, update current/next work,
phase status and evidence in that body, align affected open titles, and
read back the live result in the same session. Keep this checkpoint and
secondary plans aligned. Image-only criteria remain open until an engineering
build provides their proof; they do not prohibit creating that build.

> Saved: 2026-10-03T05:29:05Z. Branch: feature/conflict-resolution.
> Previous checkpoint: .github/sessions/archived/saved-session-state-next-20261003T052905Z.md.

## Current execution — M7.P2, continue working

The user asked to proceed with M7. **Continue implementation, build and QA;
do not stop at a resume/status response.** No branded image exists. P1 source
is complete (208 actor/state assignments,1367 harness+322 focused PASS),
with guest T17/T19/T23/T26 promoted but unrun. ES source pin39f8883545537d5274708ea85c4683612078a957 is already pushed.

### Source gates now green, uncommitted

- #361/#384: proxy5866cd9ba784c13771a99c52dd6b6f2acc546842,14 patches
  reapply fuzz0, duplicate014/017 retired. Actual old writer preservation,
  indexed/unindexed125-game preparation, retry and429 pacing:8 controls pass.
  Upstream180 pass. Final full host run1367+322 PASS,0 FAIL/0 SKIP, exit0.
  Evidence `docs/qa-logs/2026-10-03-proxy-refresh/` and disposition
  `docs/rasteratops/raofflineproxy-refresh.md`. Source hashes match. Temp
  fresh integration `/tmp/rasteratops-proxy-refresh-20261003/verify-series`;
  predecessor `/tmp/rasteratops-upstream-refresh-20261002/old-sequential`.
  Never use yesterday's conflicted `rebased/` directory.
- #362/#386: glslang16.6.0 with its known_good matched SPIR-V tools/headers,
  cbindgen0.29.4, strict shaderc patch newline correction; native coupled
  glslang/tools/shaderc build and locked cbindgen build pass. Full freshness
  exits0; tllist1.1.0 is current and Codeberg resolver now proves it. Existing
  libsoup3.8.0/WebKit2.54.1 source inputs remain. Evidence
  `docs/qa-logs/2026-10-03-dependencies/`. Cold cross-build/runtime proof owed.
- #371: destination-scoped published-history exclusion fixes the push hook;
  seven local actual-push controls pass, including new credentials/messages,
  removed-at-tip secrets and unrelated-remote history. Real formerly blocked
  bbb2c635fe merge now passes direct hook. **No distribution push yet.**
  Evidence `docs/qa-logs/2026-10-03-push-hook/`. Actual normal push after checks
  is the remaining closing proof; never bypass the hook.
- #367: ceremony-check issue-citation gate and watch-job help implemented.
  Nine constructed histories pass; actual next27 commits pass. Rules state
  exactly what is checked; CI fetches upstream history for exclusion without
  merging it. Evidence `docs/qa-logs/2026-10-03-process/`. Full gate exit0.
- #332: prior LED script tests were incomplete. Battery writer forced255
  after color changes/blinks. New `tools/nova-led-test` exercises actual
  ledcontrol, RGB helper and battery writer: before6 PASS/8 FAIL; after14
  PASS. Saved brightness is respected; explicit custom RGB tuples retain
  their precedence. There are eight addressed RGB devices, not six. Guest
  row reselection and physical illumination are unverified; the former is
  VM work, the latter separately authorized. No ES LED change is needed by
  inspection: OptionListPopup already invokes the callback on reselection.

### #310 active memory investigation — read these receipts first

Owned diagnostic guest (run101, not a candidate):
- overlay `/workspace/tmp/rasteratops-m7-memory/memory.qcow2`, backing
  `/workspace/tmp/rocknix-vm-d/vm-d.qcow2` unchanged. Never modify the backing
  disk while the overlay is in use.
- pidfile `/tmp/ra-m7-memory.pid`, QEMU PID1531007 at checkpoint;
  monitor `/tmp/ra-m7-memory-monitor.sock`, serial `/tmp/ra-m7-memory-serial.sock`,
  SSH10026, VNC5912;640x480 software profile, outbound network restricted.
- key `/tmp/rasteratops-m7-memory/qa-key`, known_hosts in same directory.
  This is QA fixture data only. Startup/exit cloud and achievements disabled.
- Original run101 ES e108699; exact original c0f4f4da also tested via temporary
  bind mount and removed by reboot. Virgl is flat:10 cycles VmSize0/RSS+672KiB.
  Software llvmpipe reproduces+10240KiB/cycle,21 threads stable.
- Matching Mesa build IDd79d57be05ebe410834b6918f5473a10664ea2e4 resolves gdb
  mmap to rtasm_exec_malloc; separate unload trace proves SDL dlcloses Mesa
  each game. Its10MiB rwxp arena was never freed. Packaged patch
  `projects/ROCKNIX/packages/graphics/mesa/patches/001-rtasm-release-executable-heap-on-unload.patch`
  registers teardown and unwinds allocation/atexit failure.50 library reloads
  retain512000KiB before,0 after; three injected initialization failures retry
  without leaks. Patched Mesa built successfully; SHA256
  184f01069fcbc7562b77e8b245bb763c92481161f475d77c6a4c74cb1e2fdad7,
  bound from `/storage/libgallium-m7-fixed.so` onto image library.
- That fixes executable mapping growth, **not yet full acceptance**:
  `patched-software-10` VmSize0/RSS+7060KiB;50 further cycles
  `patched-software-50-control` VmSize+14496/RSS+15780KiB. A late ordinary
  heap jump, not another rwxp arena. Bounded gdb malloc_trim returned1:
  VmSize2216408→2200228, RSS240740→201152KiB, showing freed heap retention.
- **Running now:** `trim-software-10-run2` via tools/es-launch-memory,
  ten cycles/one warmup, same<1024KiB VmSize/<2048KiB RSS limits.
  Log/result `/tmp/rasteratops-m7-memory/trim-software-10-run2.{log,rc}`
  and directory of same name. ES PID70143 at start; verify live.
  Diagnostic ES contains a glibc malloc_trim immediately after window deinit,
  before emulator launch, with stderr microsecond timing. Only the warm build
  source is edited; **the ES feature worktree is still clean**. Diagnostic
  input/output `FileData.{before,trim-diagnostic}.cpp`, `es-trim-build.*`,
  `es-trim.sha256` in the temp directory. Binary bound from
  `/storage/emulationstation-m7-trim`. First attempt failed only because API
  startup wasn't awaited; runner now handles empty startup responses boundedly.
- Warm ignored build sources changed for diagnosis: mesa26.2.2 rtasm source
  and e108699 FileData.cpp in generic-x64 build root. Restore original ES
  source or clean appropriately before candidate builds. This is not a pin.
- Disposable WebDAV endpoint ready for later50-cycle sync proof:
  `/tmp/rasteratops-m7-memory/cloud-backend/`,127.0.0.1:9095, reverse SSH
  tunnel to guest localhost9095 (session34915). QA stanza
  `/tmp/rasteratops-m7-memory/qa-rclone.conf`; not yet installed in guest.
  Configure only this QA endpoint after no-sync run completes. Tool now has
  `--expect-exit-sync`: every cycle needs a distinct completed exit stamp.
  No personal-cloud traffic. Endpoint/tunnel need shutdown after proof.

Diagnostic evidence retained in `docs/qa-logs/2026-10-03-launch-memory/`;
raw per-cycle smaps still under `/tmp/rasteratops-m7-memory/`. No new known
software issue is waived. Do not claim either memory criterion passed yet.

## Immediate next actions

1. Read the active ten-cycle result and trim timing from essway journal.
   If confirmed, port the minimal glibc-only trim to current ES feature source,
   syntax-check/build/test; if not, investigate retained allocations. Mesa's
   actual leak patch is independently reproduced and proven.
2. Complete10/50-cycle VM checks (sync-on to the disposable WebDAV endpoint),
   guest LED reselection proof and #368 entrypoint inventory. Physical LED
   illumination stays a device fact; it does not bar an engineering VM build.
3. Finalize evidence/readmes/changelog/worklog/index and live issue criteria;
   run rules/register/index/ceremony/vocabulary/package checks. Commit logical
   qualified P2 changes, integrate exact hashes onto next, normal pushes for
   #371. Nothing in this P2 batch is committed yet; inspect git status.
4. Freeze exact inputs and start the branded cold build/P3. Complete all
   clean/upgrade/pair/UI/proxy/memory/timing checks, then approved P4 fixes
   review (primary + Fable5.1/xhigh through Facilitator). No repeated approval.

## Authorization and worktrees

Continue regressions → fixes → branded cold build/VM qualification → independent
fixes audit. Publication, personal cloud and physical actions remain separate.
Primary `/workspace/repos/rocknix` stays next. Feature HEAD72d3556c31b0f395bfd7ef1159f8d4504260d2d6;
next38f22a8553 at checkpoint. Integrate exact new single commits by cherry-pick,
never this feature branch's historical merges. Build worktree generic-x64 stays
b2378d9c33 with an unrelated generated emulator-support doc; preserve it before
advancing. No cold RASTERATOPS root exists. Existing Blitterbot credentials
work; never request or print them. Use explicit fork repo with gh.

ES worktree `/home/max/Development/emulationstation-next.worktrees/cloud-epic`
(feature/cloud-epic); QA integration worktree sibling `qa-integration`.
Read its CLAUDE pointer and canonical distribution rules; source changes land
on test/qa-integration and the distribution pin moves only after checks/push.


## Historical readiness review (#385, 2026-10-02)

The source findings below describe that review baseline. #356/#320 are now
fixed in source as recorded above; their VM criteria remain open.

- `docs/rasteratops/release-readiness.md` maps original goals, every open
  milestone issue at review, relevant older issues, actual evidence and the
  ordered route. Source/code inspection plus issue histories, decisions,
  audit receipts and the runs95–101 retro expose the omitted structural work.
- At that review, #356 versioned migration was not implemented: production `fleet_made()`
  accepts any `layout=` prefix, marker failure reports success, tiers can
  commit pointers before a later failure. T23 collision refusal is not a
  successful interrupted retry/fleet proof. Corrected a stale function name
  in `docs/rasteratops/cloud-layout.md`; production code unchanged this review.
- At that review, #320 settings-recovery race remained in pinned ES: recordLastGood after
  loadUnderLock returns, including LockBusy. Added bug label and first-release
  milestone so the bug-only preflight no longer overlooks it. The 2026-10-03 source fix above supersedes this finding.
- Removed five RC2 bug exceptions from `docs/releases/rc-accept.txt`:
  #310/#327/#332/#352/#353. Historical decisions are retained. #310 memory
  growth needs current mapping/10/50-cycle proof; #327/#332 have later source
  work and stale criteria, so revalidate before calling them unfixed.
- Reconciled milestone7 and #383/#344/#365/#356/#354/#337/#378 plus the
  carry-forward issue bodies. Added #361/#362/#265 and carry-forwards to the
  release milestone. #384 now names the proxy refresh, not a frozen-old pin.
- #386 owns remaining freshness reconciliation (glslang, spirv-headers,
  cbindgen, unresolved tllist). #387 separates explicitly later own-telemetry
  design from #357's current image criterion. #378's only remaining general
  version-depth policy is outside milestone7; #383 retains this release's
  already selected and authorized primary + Fable fixes review.
- Full preflight before the gate correction: exit2 (freshness UNKNOWN), bug
  FAIL with9 unaccepted and5 old exceptions. Targeted production bug check
  after correction: exit1,15 open issues requiring fixes/evidence, no waivers.
  Not15 untouched defects. Receipts: docs/qa-logs/2026-10-02-readiness/.
  Full run used --no-fetch --allow-unchecked device-facts; limitations stated.

## Previously completed implementation and current evidence

- Cloud/archive/card/order/default-fixture fixes implemented. Final host suite
  1367 harness PASS/0 FAIL/0 SKIP, plus72 focused cloud cases and23 award
  parity tests: docs/qa-logs/2026-10-02-candidate-preflight/full-host-suite.log.
  It predates the latest source refresh. Five audit product findings
  #376/#377/#379/#380/#381 stay open for candidate evidence.
- #375 initial independent audit and #382 dispositions complete. Verified
  Fable5.1/xhigh blind/refutation receipts are retained. The next external
  audit is of the fixes after image qualification, through Facilitator only.
- OS identity source implemented: RASTERATOPS/0.0.1, wordmark, splash/theme,
  manual updater/no upstream stats, licensing and from-ROCKNIX suffix.
  DISTRO/OSNAME/partition/persisted contracts retain compatibility. Host/source
  identity checks are not a full image sweep or old-logo frame matcher.
- libsoup3.8.0 recipe and verified hash/pkgcheck complete; WebKitGTK2.54.1
  archive/patches prepared. Cold build and runtime sign-in/memory owed.
- RAOfflineProxy recipe still248ce5acae with16 patches. Owner selected current
  upstream bdcd229b45e289fdd0d920935887406d7d7b5919 under D-WORKFLOW-138,
  preserving all functionality and contributing general fixes upstream.
  Eight patches apply; eight need semantic review/rebase. Queue/budget changes
  make unindexed success+queued=True NOT offline-ready; indexed path differs.
  Default preserves whole-library preparation. No new disposition is needed.
- Pristine upstream104 tests pass. One isolated image-publication fix passes
  105, draft/patch at docs/upstream/raofflineproxy/image-publication/ (#168).
  No upstream PR submitted. This does not qualify patched fork integration.
  Temp source: /tmp/rasteratops-upstream-refresh-20261002/. Its rebased/
  experiment contains conflicts: NEVER copy it as the production patch set.
- Source plan: docs/rasteratops/candidate-source-plan.md. Parent-coupled
  rcheevos1433173220a7eaede6a9ed7a18e94117be1821e0 and libchdr
  8e7b8bd32bc676b7e5c6b42fe7d2daca986c4a0d match selected upstream parent.
- Candidate-store helper tested synthetically; no real candidate bundle.
  Old fork-publish-release selects dated ROCKNIX artifacts and undrafts;
  do not use it for the new manifest-bound publication contract.

## Historical entrypoint details (current queue above supersedes these)

Current entrypoints (read the scoped rules before touching them):

- #365 coverage: `docs/rasteratops/cloud-folder-state-table.md`, production
  `cloud_migrate_layout`/`cloud_setup`, `tools/rasteratops-cloud-layout-test`
  and `tools/rasteratops-vm-cloud-epic`. Host T23/T26 assertions exist and pass;
  the guest runner still needs their promotion. Keep actor applicability and
  genuine old-binary limitations explicit; no new per-transfer version probe
  or fleet-wide upgrade prerequisite was introduced.
- #320 has its deterministic source tests in ES
  `es-app/tests/unit/SystemConfTests.cpp`; do not add the same tests again.
  Host has g++ but no CMake. Verified command from the ES checkout:
  `g++ -std=c++17 -pthread -Ies-app/tests/unit/fakes -Ies-core/src -Iexternal es-app/tests/unit/SystemConfTests.cpp es-core/src/SystemConf.cpp es-core/src/utils/AtomicFileUtil.cpp -o /tmp/rasteratops-320-tests`.
  The remaining criterion is a guest race/record-byte proof on the new image.
- Before-fix distribution control remains `--ref fcd0f20c9a`; the runner must
  select image rclone1.75.1, not host1.60. Use a fresh --output directory.
  Results from this session are retained; rerun only for a changed input or
  an unresolved concern, not because a context reset occurred.

1. Complete the explicit #365 actor/predecessor map and guest-case promotion
   for #356/#320. Source fixes and host regressions above are done. Retain
   independent settings/content choices and identify actual predecessor
   partial-state coverage. VM-only criteria stay in P3, with issues open.
2. Complete proxy refresh/preservation #361/#384; reconcile #386 inputs and
   #362; relevant package/host checks. Resolve #310 launch memory and
   #332 software criteria, #371/#367 host workflow gates. The remaining
   #327 frame/docs proof belongs to P3, after the engineering build.
   Diagnostic VM builds are engineering builds, not RCs. Do not rerun an
   unchanged full suite merely to accumulate green runs.
3. Freeze qualified distro/ES/splash/container/source inputs, cold-build
   under build.RASTERATOPS-GENERIC_X64.x86_64 (never rename warm root).
   Container: ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39.
   Adapt /workspace/tmp/rocknix-session/build-x64-run101.sh; replace EVERY
   hardcoded root including failure logs. No cold launcher exists yet.
   Build as max, mount main.git and /workspace/cache/rocknix-sources. Record
   concurrency/source archive inventory/log. Use pidfile/resultfile and
   tools/watch-job in the same host namespace; name the actual watcher.
4. Retain actual candidate by manifest/digest; verify before/after QA. Full
   VM acceptance:15 default suites plus link/RA opt-ins, clean install/RC2
   upgrade, WebDAV/S3/pair, reset promoted cases H,A,C,D,B,E,I,J,K,L,F,G,
   T08,T11,T12, retry/future-marker cases, writer-shaped archives, pending
   subset flush, five-sample #364<=30ms, time-to-play, memory/10/50launch,
   card/wordmark/manual-update frames640x480 and Nova1280x960 in EN/FR.
   Qualify actual sign-in stack; complete image brand/secret/localisation/
   licence/source proofs. Close software issues from their artifacts/traces.
5. Run approved cross-lab fixes audit using code-auditor skill and verified
   Facilitator (primary + Fable5.1/xhigh, two perspectives, not five council
   members). Resolve findings, rebuild/requalify changed product inputs.
6. Prepare manifest-bound draft/source bundle/adoption/recovery/docs; device
   migration/smokes and publication retain their later named-action gates.
   Supported device matrix is in docs/rasteratops/support-matrix.md.

## Jobs, artifacts and remaining cautions

Earlier fresh-agent proof: `docs/qa-logs/2026-10-02-readiness/handoff-proof.md`.
The current fresh-agent proof is retained at
`docs/qa-logs/2026-10-03-m7-p1/handoff-proof.md` under #389/#368.
It recovered the correct next work and verified the key source/receipt claims.
Its two findings are corrected: #327 stays in P3; the guest runner help names
the real executable and all currently accepted cases. #385 is the completed review;
#383 remains active delivery. The kickoff futro already exists at
`docs/futros/2026-10-02-rc-remediation.md`; read it as historical kickoff state.

No build, VM or source test is intentionally running at this checkpoint.
Readiness diagnostics are finished. No distribution push or publication is
claimed. Current review temp: /tmp/rasteratops-readiness-20261002/ (raw issue
snapshots and exact tracker edit scripts). Earlier source/harness temp:
/tmp/rasteratops-rc-delivery-20261002/. Never edit a running shell runner.

- RC2 image: /workspace/artifacts/rocknix-images/x64-all-20260929-69e6039f8f/ROCKNIX-GENERIC_X64.x86_64-20260929.img.gz.
- Run101: /workspace/artifacts/rocknix-images/x64-all-20261002-b2378d9c33/.
  Its green diagnostics do not qualify the new inputs. Source fixes, including the 2026-10-03 migration and settings changes, have
  never run together in a branded candidate.
- Guest d SSH10026/VNC5912, monitor /tmp/rocknix-qemu-monitor-d.sock.
  Read /workspace/tmp/rocknix-session/rebuild-d-plain.sh; replace date-glob
  artifact selection. Synthetic WebDAV9010/S39012; one cloud writer at a time.
- The cloud-epic distribution worktree's held changelog is unrelated user
  work; preserve then reconcile its inaccurate no-folder-check claim.
- Public docs PR/release notes/source inventory are still required. Site is
  a placeholder; infrastructure topology/off-host drill, own telemetry and
  runner replacement/progressive inherited review are explicitly later.
- Current runner inventory API403 is not proof about remote hosts. Hosted
  untrusted workflows and disabled old publication exist; #344 owns remaining
  trigger/isolation or disabled-runner fallback evidence.
- No required owner answer blocks this source work. Version thresholds are
  general policy follow-up #378. Pending optional scan pacing preference
  defaults to preserving existing whole-library preparation, not loss.

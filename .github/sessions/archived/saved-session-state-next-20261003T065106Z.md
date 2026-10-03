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

> Saved: 20261003T055619Z. Branch: feature/conflict-resolution.
> Previous checkpoint: .github/sessions/archived/saved-session-state-next-20261003T055619Z.md.

## Current execution — M7.P2, continue working

The user asked to proceed with M7. **Continue implementation, build and QA;
do not stop at a resume/status response.** No branded image exists. P1 source
is complete (208 actor/state assignments,1367 harness+322 focused PASS),
with guest T17/T19/T23/T26 promoted but unrun. ES source pin39f8883545537d5274708ea85c4683612078a957 is already pushed.

### Qualified source changes and execution gates

- #361/#384: local commit e2761d15f9; proxy5866cd9ba784c13771a99c52dd6b6f2acc546842,14 patches
  reapply fuzz0, duplicate014/017 retired. Actual old writer preservation,
  indexed/unindexed125-game preparation, retry and429 pacing:8 controls pass.
  Upstream180 pass. Final full host run1367+322 PASS,0 FAIL/0 SKIP, exit0.
  Evidence `docs/qa-logs/2026-10-03-proxy-refresh/` and disposition
  `docs/rasteratops/raofflineproxy-refresh.md`. Source hashes match. Temp
  fresh integration `/tmp/rasteratops-proxy-refresh-20261003/verify-series`;
  predecessor `/tmp/rasteratops-upstream-refresh-20261002/old-sequential`.
  Never use yesterday's conflicted `rebased/` directory.
- #362/#386: local commit e8595345e3; glslang16.6.0 with its known_good matched SPIR-V tools/headers,
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
- #332: local commit 200a34c2b0. Prior LED script tests were incomplete. Battery writer forced255
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
  This is QA fixture data only. Startup cloud and achievements are disabled;
  exit sync now uses only the disposable WebDAV endpoint below.
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
- Two-trim diagnostic ES SHA256
  b3dec96550dc6fcb91a4e8ddd830ec8a23ff138bde973293518fd5cd5e3471b7,
  bound from `/storage/emulationstation-m7-two-trims`. Five warmups plus ten
  measured cycles pass: VmSize0, RSS+1916KiB. Fifty measured sync-enabled cycles
  after five warmups: VmSize0, RSS+6808KiB. All exit stamps succeed. This meets
  the original50-cycle VmSize criterion but fails the extra2MiB RSS endurance
  limit; the failed receipt is preserved, not relabelled PASS.
- A same-process50-cycle continuation is running/finishing. Read
  `/tmp/rasteratops-m7-memory/two-trims-sync-50-continuation.{log,rc}` and
  directory `result.json`; host exec session23626, ES PID98482. No limits are
  imposed on that diagnostic continuation; its `passed` field alone is not
  acceptance. Check actual growth. Need determine RSS convergence/retention
  before committing the ES source and freezing the engineering inputs.
- Production ES FileData.cpp has the minimal two glibc-only calls, syntax
  check PASS, but remains UNCOMMITTED and unpinned. Only diagnostic ES carries
  stderr timings. Teardown trim1.076–2.814ms, return trim0.417–1.641ms on VM.
  Evidence now has README, all failed controls and exact diagnostic hashes.
- Warm ignored build sources are changed for diagnosis: mesa26.2.2 rtasm and
  e108699 FileData.cpp in generic-x64 root. Do not treat them as release pins.
  Cold RASTERATOPS build must consume committed source/patches in a new root.
- WebDAV endpoint `/tmp/rasteratops-m7-memory/cloud-backend/`, localhost9095,
  hostPID1611685; reverse SSH PID1611728/session34915 routes guest9095 there.
  Guest has only synthetic QA rclone config and `/M7Memory/{Saves,Backups,Content}`.
  A new success stamp is required per launch. Real settings path comes from
  J_CONF: `/storage/.config/system/configs/system.cfg`. Backups are under
  `/storage/m7-memory-original/`; setup script `prepare-sync.sh` in temp.
  Initial wrong-path setup failure is retained; corrected run2 is the actual
  sync proof. No personal cloud traffic. Shut down endpoint/tunnel after proof.

Diagnostic evidence retained in `docs/qa-logs/2026-10-03-launch-memory/`;
raw per-cycle smaps still under `/tmp/rasteratops-m7-memory/`. No new known
software issue is waived. Diagnostic ten-cycle and fifty-cycle VmSize results do not qualify the final
image; RSS endurance remains unresolved, and #310 remains open.

## Immediate next actions

1. Read the same-PID50-cycle continuation and inspect RSS/allocator retention.
   Finish the source fix qualification; do not hide the extra RSS test failure.
   Then complete guest LED reselection (no physical device action).
2. Finish #368 fresh-agent retest after the six armature fixes, required
   checks, evidence and tracker updates. The hook/process changes are still
   uncommitted. Three source commits above are local and not integrated/pushed.
3. Commit/integrate exact new single hashes onto next, never historical feature
   merges. Push only within authorization; see the explicit review block below.
   A normal distribution push is #371's remaining proof; never bypass the hook.
4. Freeze exact distro/ES/splash/container/source inputs, then cold-build and
   qualify the branded image. Image-only acceptance stays P3 and does not
   prohibit an engineering build. Approved P4 is primary+Fable5.1/xhigh through
   the Facilitator; do not repeat the initial audit or seek that approval again.

## Authorization and worktrees

Continue regressions → fixes → branded cold build/VM qualification → independent
fixes audit. Publication, personal cloud and physical actions remain separate.
Primary `/workspace/repos/rocknix` stays next. Feature HEAD200a34c2b0 (three P2 source commits above72d3556c31);
next38f22a8553 at checkpoint. Integrate exact new single commits by cherry-pick,
never this feature branch's historical merges. Build worktree generic-x64 stays
b2378d9c33 with an unrelated generated emulator-support doc; preserve it before
advancing. No cold RASTERATOPS root exists. Existing Blitterbot credentials
work; never request or print them. Use explicit fork repo with gh.

ES worktree `/home/max/Development/emulationstation-next.worktrees/cloud-epic`
(feature/cloud-epic); QA integration worktree sibling `qa-integration`.
Read its CLAUDE pointer and canonical distribution rules; source changes land
on test/qa-integration and the distribution pin moves only after checks/push.


## Handoff armatures and explicit push review blocks — #368

The six findings from the fresh read-only proof were recorded on #368 before
repair. Feature checkpoint is now a stable pointer; contradictory historical
current-state sections are archived, not repeated here. Tool inventories now
agree and rules-check enforces that agreement; omission controls pass. Broad
runner help/invalid options create no fixtures (five controls pass).

ES entrypoint-only commits: cloud-epic ecf976fd0; qa-integration8276eb0c5;
main checkout `/home/max/Development/emulationstation-next` remains on dormant
feature/imageviewer-rescan with instruction-only67f92692c. All now have
AGENTS/CLAUDE routes to distribution rules, checkpoint and syntax check.
No ES source commit/push was made for the trim. Existing product pin remains
39f8883545537d5274708ea85c4683612078a957.

Splash checkout `/tmp/rasteratops-rc-delivery-20261002/splash`, master530b334:
six-line AGENTS resume route committed locally; product pin7450aa8180ae66684814dd460f31eb502b2abf61 unchanged. Automatic approval review
rejected pushing master as separately gated publication. A concrete user
approval request is pending; elapsed time is not approval. It also rejected
an ES source commit/push command while RSS qualification is unresolved;
that command executed nothing. Continue local proof and prepare a concrete
source commit before a final push approval request; do not bypass rejections.

## Build and qualification entrypoints

- Current source/readiness: `docs/rasteratops/release-readiness.md`,
  `candidate-source-plan.md`, `raofflineproxy-refresh.md`, #383/#344 and M7.
  P1 actor table `docs/rasteratops/cloud-folder-state-table.md`; promoted guest
  cases are in `tools/rasteratops-vm-cloud-epic` (help is safe).
- Frozen upstream9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6 (D-WORKFLOW-111).
  Container ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39.
- Adapt `/workspace/tmp/rocknix-session/build-x64-run101.sh`; replace EVERY
  hardcoded root including failure logs. No cold launcher/root yet. Build as
  max, mount main.git and `/workspace/cache/rocknix-sources`; retain concurrency,
  sources, consumed container digest, pid/result/log and an actual host watcher.
- Build worktree `/workspace/repos/rocknix.worktrees/generic-x64`, build/generic-x64
  b2378d9c33. Preserve its unrelated generated support doc before advancing.
  Warm source diagnostic modifications are not cold build inputs.
- RC2 artifact `/workspace/artifacts/rocknix-images/x64-all-20260929-69e6039f8f/`;
  run101 `/workspace/artifacts/rocknix-images/x64-all-20261002-b2378d9c33/`.
  The guest-d base disk must remain stopped/unchanged under the diagnostic overlay.
- P3:15 default VM suites plus link/RA opt-ins; clean/RC2 upgrade, WebDAV/S3/pair,
  reset promoted cases, writer-shaped archives, pending subset flush, timing,
  10/50 launches, sign-in stack, EN/FR640x480 and Nova1280x960 UI, image identity,
  secrets, licensing and source manifest. See live milestone for exact sequence.
- Public docs/source bundle/adoption/recovery and supported device smoke gates
  remain required in P5. Candidate store is tested synthetically only. Old
  fork-publish-release selects dated ROCKNIX assets and undrafts; do not use it
  for manifest-bound Rasteratops publication. Preserve unrelated cloud-epic
  distribution worktree changelog edits. No physical/personal-cloud action here.

Historical review/entrypoint details are retained in the archived checkpoint
linked at the top. Earlier proof `docs/qa-logs/2026-10-03-m7-p1/handoff-proof.md`
is historical; the current P2 retest belongs under2026-10-03-process.

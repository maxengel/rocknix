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

**Current priority: M7.P1** state/migration/recovery (#365/#356/#320).
Its strict marker, interrupted-retry and settings-record source fixes now pass;
the explicit actor/predecessor map and guest-case promotion remain next.
Then M7.P2 qualified inputs; M7.P3 cold build plus image qualification;
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

> Saved: 2026-10-03T00:46:32Z. Branch: feature/conflict-resolution.
> Previous checkpoint: .github/sessions/archived/saved-session-state-next-20261003T004632Z.md.

## Latest execution — 2026-10-03

The maintainer authorized remaining instruction fixes and continuing M7 toward
the first branded build. **Source work resumed; no new image has been built.**
Do not repeat the initial audit, identity migration, workflow cleanup or fixed
source work below.

- Workflow #389/D-WORKFLOW-140: five delivery/resume/stash skills now reference
  this fork's actual rules; resume reconciles canonical next and the live
  milestone and continues already authorized work without a redundant menu.
  Feature1a2ce256cf → next4b0899328f. Five skill validators/local links, rules,
  register, work-log index and ceremony gate pass.
- Migration #356/#365: complete-byte layout1/layout2 validation, a shared
  marker writer, explicit migration_step_1 and a synchronized local JSON
  recovery record retain original source paths after pointers advance.
  Copy/delete/marker failures remain retryable and visible to scan/boot;
  setup cannot label an unfinished move complete. OAuth token refresh does
  not invalidate the provider/root fingerprint. The record is not a cloud lock.
- Twelve unsupported-marker controls fail before and pass after. Nine final
  copy/delete/marker retry controls fail before and pass after, including
  retained payloads, retry visibility, safe repeat and an independent follower.
  All93 focused cases pass. Full host suite:1,367 harness PASS/0 FAIL/0 SKIP,
  plus those93 cases. #390 repairs C2/LY marker doubles exposed by this change;
  one actual missing storage-failure reason was also corrected.
- ES retry UI68e8c7da5 and settings race fix39f888354 are pushed to the fork's
  test/qa-integration. **Current pin39f8883545537d5274708ea85c4683612078a957**.
  #320 recordLastGood now locks and revalidates the complete current choice
  for both load/save; LockBusy recovery records nothing. Both new controls
  fail before, then all10 cases/119 assertions pass. Image-compiler checks
  and French msgfmt validation pass. Guest race/byte criteria remain open.
- Distribution source/evidence feature**d82d40cc7e** → next**a48029fa50**.
  Exact inputs/receipts: docs/qa-logs/2026-10-03-m7-p1/ and its README.
  A later checkpoint commit does not change product inputs. Both trees were
  clean before this checkpoint. No distribution push claimed (#371 remains).
- Product issues remain open for their image criteria. Source passes do not
  qualify an image. Numbered actor coverage, actual predecessor partial
  states, two-guest/provider recovery and frames are not silently completed.

**Next concrete action:** read the appended execution notes in
`docs/rasteratops/cloud-folder-state-table.md` and `cloud-layout.md`, map the
remaining actor × state/predecessor cells to assertions, and extend the promoted
`tools/rasteratops-vm-cloud-epic` with T23 retry/T26 unsupported-marker cases.
Do not repeat the same unchanged host suite for another green count. Once P1's
source/coverage prerequisites are explicit, advance to the P2 proxy refresh and
qualified dependencies. Image-only acceptance stays open for P3 and does not
forbid creating the engineering build that must provide it.

No build, VM or source-test job is intentionally running. All checks above ended.
Optional version/scan-pacing questions still do not block the authorized route.

## Authorization and worktrees

- #383 retains the approved order: regressions, fixes, combined branded cold
  build/VM qualification, independent other-lab audit of fixes. Continue
  those steps without asking again. No publication, personal-cloud writes
  or physical-device actions are authorized by this scope.
- Main `/workspace/repos/rocknix` stays on `next`. Work here is
  `/workspace/repos/rocknix.worktrees/conflict-resolution`. Current product
  source: feature d82d40cc7e, integrated as next a48029fa50. Later stash commits
  do not change those product inputs; read git log for current HEAD.
  Earlier implementation commits are already integrated: do not repeat them.
- Integrate new feature commits by cherry-pick into next. Do not merge this
  branch's historical merges or push it: #371's hook defect is still open.
- ES: `/home/max/Development/emulationstation-next.worktrees/cloud-epic`,
  39f8883545537d5274708ea85c4683612078a957, pushed to test/qa-integration.
  Splash: 7450aa8180ae66684814dd460f31eb502b2abf61, pushed to fork.
- Build tree `/workspace/repos/rocknix.worktrees/generic-x64`, branch
  build/generic-x64 at b2378d9c33. Previously dirty only with generated docs;
  inspect again and preserve unrelated changes before advancing to next.
- Blitterbot migration #374 is complete. Existing credentials work. Never
  request/print tokens. Process/config reads use the rule's secret filter.
  Use `gh --repo rasteratops/distribution` explicitly. Host jobs are invisible
  in the sandbox PID namespace; inspect/watch in the host namespace.

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

## Next steps, in order

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
   #327/#332 software/evidence criteria, #371/#367 host workflow gates.
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
The current handoff is rechecked under #389 after integration.
It recovered the correct next work and verified the key code/receipt claims;
the entrypoints above incorporate its feedback. #385 is the completed review;
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

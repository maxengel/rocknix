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

> Saved: 2026-10-03T04:35:40Z. Branch: feature/conflict-resolution.
> Previous checkpoint: .github/sessions/archived/saved-session-state-next-20261003T043540Z.md.

## Latest execution — 2026-10-03, M7.P1 source exit

The user asked to proceed with M7. **Continue P2 implementation; do not stop at
another resume/status response.** The live milestone and #383 now name P2 as
current. #365/#356/#391/#392 carry final source evidence while candidate guest,
upgrade and pair criteria stay open. No branded build exists.

- P1 final host run:1,367 harness PASS plus322 focused PASS,0 FAIL/0 SKIP.
  `docs/qa-logs/2026-10-03-m7-coverage/` retains receipts, exact hashes, the208
  actor/state assignments, initial failures and final broad transcript.
- #391: actual RC2/run101 scripts produce inherited partial states. Recovery
  preserves current primary pointers, old live saves/backups, independent
  custom/root content and foreign collision protection. The discarded shelf
  is an optional independent source field in schema1; earlier records still
  load. Initial319 focused passes hid11 broad regressions; the corrected
  boundary passes28 targeted cases and the full suite above.
- #392: missing remote prefixes are refused before a cloud path can be
  interpreted locally. Four writable-local-path controls fail before; all13
  T19 controls pass after. Backup previously wrote locally; restore constructed
  the path but refused later. Do not claim restore copied bytes in that proof.
- Guest T17/T19/T23/T26 live in tools/rasteratops-vm-cloud-epic and its new
  migration-protocol.sh helper: fixture resets, image calls, temporary fault
  shim, retained statuses/hashes, cleanup. Parsing/negative assertion verified;
  **new guest cases have not run**. One follower configuration is not two guests.
- ES is unchanged:39f8883545537d5274708ea85c4683612078a957, already pushed to
  origin/test/qa-integration. Prior10 cases/119 assertions and compiler/French
  checks remain the evidence. No distribution push (#371 remains unresolved).

## P2 work in progress — current proxy

Fresh temporary integration: `/tmp/rasteratops-proxy-refresh-20261003/`.
**The packaged recipe and helpers still use the old proxy.** Do not confuse
this preparation with a shipped refresh.

- Current main verified5866cd9ba784c13771a99c52dd6b6f2acc546842; one commit
  after bdcd229, changing only statistics-page hardware labels. Archive SHA256
  1bc5a88f379c958e958348efd1e5de3edeb8682fe42432b6415f4f29cabc218e.
- `integration/` is a fresh git tree with individually prepared semantic
  patches; generated series in `patches/`.001/002/003/005/007/008/009/010/
  011/012/013/015/016 are rebased;004 now adds an opt-in budgeted=False API
  for the deliberate OS whole-library scanner.014 connection reuse and017
  subset mapping are candidates for retirement after equivalence proof.
  Do not use yesterday's conflicted rebased/ tree.
- `cache-indexed.after` is the temporary integrating helper. Through the
  actual old helper,125 unindexed games reported125 cached but only100
  reached the store. `whole-library-before.log` reproduces it; the prepared
  API/helper correction caches all125 (`whole-library-after.log`). It checks
  queued status, retains upstream queue locks/pacing and persists429 pauses
  for indexed work. Further indexed/unindexed/retry/429/preservation controls
  are required before copying it into the recipe.
-180 upstream award/queue/consent/image/network/refresh tests pass on this
  temporary integration (`upstream-integration-host.log`). A sandboxed attempt
  failed socket/DNS access; the host run passed. Existing fork predicates
  reference retired fetch_static_asset: adapt them to current image APIs while
  preserving validation, redirect, timeout, absence and concurrency assertions.
- #361 records the current head and reproduced readiness error. #384's stale
  backport-only instruction is reconciled with D-WORKFLOW-138. Remaining
  proxy/dependency/source gates are the live milestone's ordered P2 work.

## Authorization and worktrees

Continue regressions → fixes → combined branded cold build/VM qualification →
independent fixes audit without asking again. Publication, personal-cloud and
physical-device actions retain their separate gates. No build, VM or test job
is intentionally running after the completed P1 run.

Primary `/workspace/repos/rocknix` stays on clean `next`. Work here is
feature/conflict-resolution. Integrate only exact new single-commit hashes by
cherry-pick; never merge this feature branch's old historical merges. The prior
clean heads were feature160aaff8f56458dfa7cf579cb7f75bdbd2b12a41 and
next4903e2ef96; this checkpoint accompanies the new P1 source commit. Read git
log for its hash. Build worktree generic-x64 remains b2378d9c33; preserve its
unrelated generated document before advancing. No cold RASTERATOPS root yet.

Blitterbot identity is complete. Existing credentials work; never request/print
them. Use explicit fork repo with gh. Host jobs and watch-job must share the
host PID namespace. The main build requires writable paths outside this
sandbox and uses the already selected container digest recorded below.

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

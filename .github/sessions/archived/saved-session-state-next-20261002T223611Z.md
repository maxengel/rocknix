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

> Saved: 2026-10-02T22:28:33Z. Branch: feature/conflict-resolution.
> Previous detailed checkpoint: .github/sessions/archived/saved-session-state-next-20261002T222833Z.md.

## Authorization and worktrees

- #383 retains the approved order: regressions, fixes, combined branded cold
  build/VM qualification, independent other-lab audit of fixes. Continue
  those steps without asking again. No publication, personal-cloud writes
  or physical-device actions are authorized by this scope.
- Main `/workspace/repos/rocknix` stays on `next`. Work here is
  `/workspace/repos/rocknix.worktrees/conflict-resolution`. Last product
  source: feature fcd0f20c9a, integrated as next df23faff6c. Later review/stash
  commits do not change those product inputs; read git log for current HEAD.
  Earlier implementation commits are already integrated: do not repeat them.
- Integrate new feature commits by cherry-pick into next. Do not merge this
  branch's historical merges or push it: #371's hook defect is still open.
- ES: `/home/max/Development/emulationstation-next.worktrees/cloud-epic`,
  97523542963dcc72e9ea51cfbcd26b735ff28c1f, pushed to test/qa-integration.
  Splash: 7450aa8180ae66684814dd460f31eb502b2abf61, pushed to fork.
- Build tree `/workspace/repos/rocknix.worktrees/generic-x64`, branch
  build/generic-x64 at b2378d9c33. Previously dirty only with generated docs;
  inspect again and preserve unrelated changes before advancing to next.
- Blitterbot migration #374 is complete. Existing credentials work. Never
  request/print tokens. Process/config reads use the rule's secret filter.
  Use `gh --repo rasteratops/distribution` explicitly. Host jobs are invisible
  in the sandbox PID namespace; inspect/watch in the host namespace.

## Completed in this review (#385)

- `docs/rasteratops/release-readiness.md` maps original goals, every open
  milestone issue at review, relevant older issues, actual evidence and the
  ordered route. Source/code inspection plus issue histories, decisions,
  audit receipts and the runs95–101 retro expose the omitted structural work.
- #356 versioned migration is not implemented: production `fleet_made()`
  accepts any `layout=` prefix, marker failure reports success, tiers can
  commit pointers before a later failure. T23 collision refusal is not a
  successful interrupted retry/fleet proof. Corrected a stale function name
  in `docs/rasteratops/cloud-layout.md`; production code unchanged this review.
- #320 settings-recovery race remains in pinned ES: recordLastGood after
  loadUnderLock returns, including LockBusy. Added bug label and first-release
  milestone so the bug-only preflight no longer overlooks it. No fix yet.
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
  1367 harness PASS/0 FAIL/0 SKIP, including72 focused cloud cases and23 award
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

1. Finish state/recovery correctness under #356/#365/#320: supported marker
   versions, numbered steps/journal, failure at tier/marker publication,
   idempotent retry, second-guest follow, deterministic settings interleaving.
   Map applicable actor × T01–T25 cells to actual assertions. Do not pretend
   an unmodified RC2 binary can be taught a future protocol or invent a
   fleet-wide upgrade prerequisite from D-CLOUD-169.
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

No build, VM or source test is intentionally running at this checkpoint.
Readiness diagnostics are finished. No distribution push or publication is
claimed. Current review temp: /tmp/rasteratops-readiness-20261002/ (raw issue
snapshots and exact tracker edit scripts). Earlier source/harness temp:
/tmp/rasteratops-rc-delivery-20261002/. Never edit a running shell runner.

- RC2 image: /workspace/artifacts/rocknix-images/x64-all-20260929-69e6039f8f/ROCKNIX-GENERIC_X64.x86_64-20260929.img.gz.
- Run101: /workspace/artifacts/rocknix-images/x64-all-20261002-b2378d9c33/.
  Its green diagnostics do not qualify the new inputs. Source fixes have
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

# Rasteratops 0.0.1 release readiness

Review: 2026-10-02, #385. Delivery: #383. Release contract: #344; cloud
epic: #354. This assesses the first Rasteratops release, not a renewal of
RC2's exceptions. Keep 0.0.1 as the working version. The owner's offer of
1.0.0 does not change the acceptance criteria or authorize a rename.

**Verdict: not ready to call a build an RC.** No combined branded 0.0.1
image exists yet. Several fixes have strong host evidence, but the cloud
migration contract and proxy refresh need implementation, older known
defects need resolution, and the resulting artifact needs qualification.
Another run of the existing general VM suites alone cannot close these gaps.

## Inputs and evidence checked

| Input | Observed state |
| --- | --- |
| Distribution | Feature `fcd0f20c9a`; content integrated on `next` as `df23faff6c`. Frozen ROCKNIX ancestry remains `9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6` (D-WORKFLOW-111). |
| EmulationStation | `97523542963dcc72e9ea51cfbcd26b735ff28c1f`; cloud ordering and displayed identity changes implemented and pushed. |
| Splash | `7450aa8180ae66684814dd460f31eb502b2abf61`; wordmark source and native render checks exist. |
| Build container | Selected `ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39`; consumption by the cold build is unproven. |
| Host regression suite | Pre-refresh receipt: 1,367 harness PASS, 0 FAIL, 0 SKIPPED; includes 72 focused cloud checks and the 23-test subset-award suite. Predates the libsoup/proxy refresh; not image evidence. |
| Independent initial audit | #375/#382 completed. Verified Fable 5.1/xhigh blind and refutation passes found five product issues. Closing the audit did not close those issues. |
| Latest VM artifact | Run 101 is the older unbranded input set. No cold RASTERATOPS build or 0.0.1 candidate exists. No build/VM job intentionally running at review. |
| Source preflight | Exit 2: package freshness cannot answer; bug gate fails. Used `--no-fetch --allow-unchecked device-facts`: cached refs and unchecked physical facts are explicit limitations. |
| Corrected bug gate | After removing RC2 waivers and exposing #320: 15 open issues, exit 1. This includes implemented fixes awaiting evidence, not 15 untouched defects. |

Receipts: [preflight](../qa-logs/2026-10-02-readiness/rc-preflight.log),
[freshness](../qa-logs/2026-10-02-readiness/freshness.log),
[corrected bug gate](../qa-logs/2026-10-02-readiness/bug-gate-after.log),
[host suite](../qa-logs/2026-10-02-candidate-preflight/full-host-suite.log),
[audit](../audits/2026_10_02-milestone-375-rasteratops-0-0-1/04-analysis.md),
[VM retro](../retros/2026-10-02-cloud-runs-95-101.md).

## Goals, implementation and remaining proof

| First-release goal | Implementation and evidence | Required closure |
| --- | --- | --- |
| Identity with safe RC2 adoption (#337, #344, #359) | OS name/version, ES wordmark, splash/theme, manual updater, reporting disablement, licences and adoption suffix implemented. Persisted/partition contracts retained. | Cold image; identity/update/network/licence readback; clean install and RC2 upgrade; image brand/secret/localisation sweeps with failing controls. |
| Preserve settings backup/restore (#349, #376, #379, #381) | Shared archive discovery reads both suffixes and actual per-device writer folders; writer retains persisted suffix. Independent populated backup tiers survive transitions. Host regressions pass. | Candidate writer→scan→restore, foreign-device disclosure, local archives and upgrade on both providers; resolve inherited recovery race #320. |
| Content restore and sign-in (#350, #351, #352, #380, #362) | Interstitial/chooser/sign-in changes and explicit cloud-root content preservation implemented; libsoup 3.8.0/WebKitGTK 2.54.1 recipes prepared. | Guest UI walks with pointer/byte assertions, English/French frames, HTTP/TLS/redirect and sign-in memory proof on rebuilt stack. |
| Safe, repeatable cloud migration (#353, #354, #356, #365, #377) | Current defaults, join/follow/settle/move, failed-listing distinction and seeding failure propagation implemented. T01–T25 table and host cases exist. | Numbered retryable transitions; strict marker versions; interrupted tier/marker publication recovery; future/malformed markers; second guest follows; actors agree on pointers/bytes. |
| Bounded startup; no surprise old folders (#363, #364, #366) | Preparation precedes startup transfer; dialog waits for actual card lifetime; backup guard uses one listing; fixtures derive defaults. | Whole-boot T08/T11/T12 and fault recovery, card frames, no old-root writes under SKIPPED, five-sample overhead <=30 ms, time-to-play. |
| Offline achievements without lost capability (#361, #384, #168) | Subset backport: 23 parity tests pass on old pin. Current pristine upstream: 104 tests pass. Isolated image-publication contribution: 105 tests pass. | Reconcile every local patch; whole-library preparation; queued never means ready; cached sign-in/games/images and pending base/subset awards survive upgrade/reconnect; host and guest proofs. |
| Stable launch and retained device behaviour (#310, #327, #332) | Memory growth unresolved. Explanation page has RC2 frames/source. Nova LED script has later brightness/default-colour work; original issue text stale. | Current mapping/10/50-cycle proof; approved wrapped paragraphs and docs frame; LED argument/reselection fixture and guest UI proof. Physical illumination is a separate device fact. |
| Reproducible, recoverable release (#344, #265) | Frozen ancestry/container pin and candidate-store helper exist; synthetic store controls pass. | Source inventory, cold log, actual manifest/digests and retained bundle; manifest-bound draft/source publication; mandatory migration and qualified device assets. Old publisher still selects date-named ROCKNIX artifacts: do not invoke it for this release. |
| Release custody (#344) | Blitterbot identity complete (#374); inherited untrusted-event workflows use hosted runners; old CI image publication disabled. | Record actual container consumption/source custody and trigger/isolation or disabled-runner fallback evidence. Bot runner inventory returned 403; absence of a local runner is not remote-host proof. Deferred infrastructure topology is separate. |

## Structural gaps behind the repeated VM rounds

1. **Marker presence is not a version contract (#356).** Production
   `cloud_migrate_layout` calls `fleet_made()`, accepting any first line
   beginning `layout=`. It does not reject malformed/future versions.
   `write_marker()` reports failure but returns success, and completed tiers
   publish pointers before a later tier can fail. T23 proves one safe
   collision refusal, not successful interrupted retry or fleet recovery.
   `cloud_setup` also writes the marker. All writers/readers need the same
   supported-version/retry contract. The numbered dispatcher and durable
   step journal are not implemented.
2. **Saves, backups and content are independent (#365).** The 72 host
   checks include classification checks, not end-to-end execution of every
   actor for every table row. Add an actor × state coverage map; close each
   relevant cell with assertions or an explicit reason it is inapplicable.
   Retain settings-only archives, explicit empty content roots, failures
   before seeding, restricted-prefix access and retry/fleet cases.
3. **The inherited recovery race is still in pinned ES (#320).**
   `SystemConf::loadFromDisk` records last-good state after `loadUnderLock`
   returns, including a lock-busy path. A newer script write can have its
   recovery record replaced by the earlier read. The earlier audit deferred
   this for RC1/RC2; the `audit` label hid it from the bug-only preflight.
   Prove the interleaving with a failing control, fix it, compare guest bytes.
4. **Proxy success no longer always means offline-ready (#361).** The
   upstream unindexed API can return `success` with `queued=True`; the fork
   counts success as cached. The indexed path uses a different API. Reconcile
   the queue/budget boundary with a >100-game fixture before changing the
   pin. Preserve whole-library capability under D-WORKFLOW-138.
5. **Old exceptions leaked into the new gate (#385).** Preflight accepted
   #310/#327/#332/#352/#353 using RC2-era rows. These exceptions are removed
   for the first release; decisions stay in the historical ledger. Bugs
   close from evidence. Preflight's bug count is not a release-scope inventory.

Run 98 passed 15/15 while missing fresh join. Run 100 passed 15/15 while
missing the backup that recreated `/GAMES` under SKIPPED. Run 101 exposed
stale fixtures; correcting pair expectations produced 42/0 on that same
older image. Timing was 59 ms against a 30 ms criterion. These results are
useful diagnostics; they cannot qualify unbuilt bytes or untested transitions.

## Issue inventory and boundaries

Includes all open milestone-7 issues at review and relevant omitted issues.
An unchecked issue is not automatically missing code.

| Issues | Current disposition |
| --- | --- |
| #337, #344 | Identity source substantially implemented; build/custody/adoption/publication criteria open. P0 remains historical evidence. |
| #349, #350, #351, #352 | Interface work exists; candidate restore/chooser/sign-in/interstitial evidence and docs reconciliation owed. |
| #353, #354, #356 | Cloud goals open, including versioned migration. Do not require all three pointers to change when populated/custom tiers are independent. |
| #357 | Disable upstream reporting in this image. Explicitly later own-telemetry design now has separate #387 outside 0.0.1. |
| #359 | Terms decided, source files exist; image licence and release-note agreement remains. |
| #361, #362, #384 | Refresh and runtime preservation remain; dependency issues belong in milestone 7. Old “frozen proxy” wording no longer describes approved direction. |
| #386 | Reconcile the additional freshness findings below, with source/consumer evidence and a final passing diagnostic. |
| #363, #364, #365, #366 | Source/harness fixes exist; actor coverage, promoted guest run, negative controls, card/timing and fixture proofs remain. |
| #367 | Six process criteria delivered; commit→issue guard and watch-job help remain. Host workflow work, not a device feature. |
| #368 | Stash/fresh-agent exercise exist; retain briefing and corrections, reconcile issue criteria and actual next work. |
| #371 | Existing-branch hook re-judges published merge history. Cherry-picking locally avoids it but is not the fix. |
| #376, #377, #379, #380, #381 | Five audit findings have fixes/host evidence; owning candidate criteria remain open. |
| #378 | Routing implemented; initial Fable calls completed. Only automatic version→depth policy remains, so the issue is outside milestone 7. This release already has a selected, authorized other-lab review under #383. |
| #383, #385 | Four-step delivery remains active; this reconciliation updates its source-freeze prerequisites, tracker, gate and handoff. |
| #310, #320, #327, #332 | Carry-forward software/evidence requires current disposition, not RC2 waivers. Expose #320 to bug gate. Do not infer #332's reselect behaviour from callback names. |
| #265 | Resolve actual versioned artifact selection/publication, not only the display number. Keep working 0.0.1. |
| #168 | Contribute general-purpose proxy fixes with receipts; upstream acceptance need not hold a locally qualified fix. |
| #309, #324 | Inspect applicable migration/archive/achievement-proof freshness items during owning work. Do not reopen every deferred audit lead as first-release scope. |

Freshness diagnostic: `glslang` 15.1.0 vs 16.6.0, `spirv-headers` 126
commits behind, `cbindgen` 0.29.2 vs 0.29.4; `tllist` 1.1.0 UNKNOWN
(Codeberg resolver did not answer). Reconcile current sources and consumers;
do not blindly bump incompatible components. RAOfflineProxy's displayed
PINNED reason is stale under D-WORKFLOW-138. Parent-coupled gamescope,
MangoHud and proxy submodules have recorded reasons and move with parents.
Frozen distribution ancestry is separate from package freshness.

Explicitly later: replacement runner and progressive inherited-code review
planning (#336/#339/#346, D-WORKFLOW-102), infrastructure topology/off-host
restore drill (#347/#348/#355, D-WORKFLOW-113), own telemetry, full site beyond
the approved placeholder and trademark registration. No broad rewrite or new
five-seat council is required to resolve these first-release defects.

## Ordered route to an RC

1. **State contract and negative controls:** #356 versions, numbered steps,
   interruption/retry/fleet; #320 recovery lock; #365 actor coverage. A new
   build cannot retroactively teach RC2 to understand future markers. State
   the supported older-build boundary and prove compatible behaviour; do not
   invent a fleet-wide-upgrade prerequisite from D-CLOUD-169.
2. **Qualified source inputs:** #361 proxy preservation, freshness gaps,
   changed-package checks and relevant host suites; #310/#327/#332 software
   evidence and #371/#367 host gates. Diagnostic VM images here are
   engineering builds, not RCs.
3. **Freeze and cold build:** record distro/ES/splash commits, container
   digest, source inventory and concurrency; build under RASTERATOPS. Store
   actual artifacts with manifest/digests, verify before/after QA. Never
   rename a warm root or select a newest-date glob.
4. **Qualify that image:** clean install, RC2 upgrade, 15 default vm-qa
   suites plus required link/RA opt-ins, WebDAV/S3, guest pair, independently
   reset promoted cases and failing controls, future-marker/retry cases,
   writer-shaped archives, pending subset flush, memory/launch/timing,
   boot/card/update/identity frames at 640×480 and Nova's 1280×960 in English
   and French, image sweeps and licence/source evidence. Close software bugs
   with traces and `Already written:` treatment of existing state.
5. **Independent fixes audit:** approved primary plus Fable 5.1/xhigh through
   verified Facilitator. Do not restart #375 or count blind/refutation as
   additional seats. Resolve findings; changed product inputs require rebuild
   and renewed affected evidence before an RC claim.
6. **Release staging:** exact manifest-bound draft/source bundle, release/
   adoption/recovery notes and docs. RG35XX SP migration and other supported
   devices' smoke facts remain named per-action device work; attach only
   qualified assets. Publication remains separately authorized.

Can this be done on the VM? **Yes** for software acceptance, with synthetic
providers and hardware-path fixtures. Actual board boot, boot-medium/migration
and physical LED/panel facts belong in `docs/releases/device-facts.md`.
No personal cloud is needed to prove the state machine or recovery paths.

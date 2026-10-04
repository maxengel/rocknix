# pixelelated 0.0.1 release readiness

Current update: 2026-10-04, #409. Delivery #383; release contract #344;
cloud epic #354. The next RC uses lowercase **pixelelated** and the Tiny5
Duo LCD wordmark (D-WORKFLOW-144/145); the cloud default is `/pixelelated`
(D-CLOUD-174). Version remains 0.0.1. Rasteratops is a character; Blitterbot
is unchanged. The required adoption flow is **ROCKNIX → pixelelated**;
there are no fielded /Rasteratops systems requiring an additional gate.

The [M7 milestone body](https://github.com/pixelelated/distribution/milestone/7)
is the binding running order. **Current: finish #409 source checks, then
freeze/build new pixelelated bytes and qualify clean install plus ROCKNIX
upgrade, followed by remaining P3 release checks and the approved P4 fixes
audit.** See `docs/pixelelated/rename-plan.md` for the classified inventory.

**Verdict: no pixelelated candidate image exists yet, so no RC claim.**
Replacement02 frozen61b64817bf remains successful historical RASTERATOPS
engineering evidence: all15 default suites, actual RC2 upgrade and scoped
installed proxy/cloud/archive/timing/identity checks passed. Preserve those
receipts and artifacts; do not transfer their verdict to renamed bytes.
Remaining source/licence/brand/secret/localisation and ordinary RA fixture
criteria still apply, as do P4 and the separately gated P5 staging work.

The older sections below retain the October2–3 investigations and source
receipts, including names and pins valid at that time.

## Current execution update — 2026-10-03

P1 source coverage is complete:208 actor/state assignments, inherited-state
recovery and missing-remote controls,1,367 host+322 focused checks PASS.
T17/T19/T23/T26 guest cases are promoted for candidate P3 execution. Their
ES migration/settings-lock changes remain included in the current qualified
pin e6e1e4d0f91e177e182cc05b1cea74991e1cc45b.

P2 proxy preservation and current coupled dependencies pass their source
checks. #310 now passes all unchanged diagnostic memory limits: software10,
software50 with exit sync and virgl10 have zero address-space growth and
RSS growth532/364/60KiB. All exit syncs complete. #332 actual LED script tests
and guest menu reselection pass. Process/hook controls and the six armature
retests pass. Receipts are under `docs/qa-logs/2026-10-03-{proxy-refresh,
dependencies,launch-memory,led,process,push-hook}/`.

**Original503e evidence:** the cold engineering build completed642/642 tasks and image
assembly from frozen distribution503e24e10d. The corrected watcher recorded
rc0. Image/update checksums and immutable candidate-store custody pass.
**Original503e qualification:** all15 default suites have passing evidence
on the unchanged candidate:14 passed in the first run; #396 corrected the
host archive-name assertion and the complete round-trip rerun passed81s.
All16 visual walks and frame comparison pass. Source/candidate custody was
verified before and after the default run. RC2 upgrade passed18:57UTC, S3 round-trip passed107s, and mixed-install
pair migration passed42/42 at19:04UTC. All7 WebDAV link cases have passing evidence after host fixes #398/#399 and
strict LINK5 fixture correction #400; the corrected archive interruption/retry
also passes S3 without skips. Full S3 link proof exposed #401: content backup
and restore outwait an outage because they lack the saves/settings progress
stall guard. #402 owns a scan that completed before its cut could land.
The independently reset19-case640x480 guest matrix passed249/0 at20:31UTC.
#402's corrected S3 pagination now proves interruption and retry; its newly
reached failure sentence is included in #401. Focused guard controls pass18/18
on host and candidate BusyBox, and six complete-script checks pass. The full
candidate-binary host rerun passes1373 broad+322 layout checks under #403,
0FAIL/0SKIP; its predecessor's stale assertion failure is retained. #404 corrects recorded frame counts;
#405 corrects sign-in-tool help. Production virgl10 passes (VmSize0KiB,
RSS+620KiB); software10 also passes (0/52KiB). Software50 with exit sync
passes0/1228KiB with55 unique success stamps; sign-in page loading/memory
passes30s, peak total RSS292788KiB (not provider authentication). RA award100359
is already earned; the owner reset/alternate-QA-account question is pending.
Evidence: `docs/qa-logs/2026-10-03-m7-qa-01/` and
`docs/qa-logs/2026-10-03-archive-harness/rerun/`.
**Image gate #397:** original503e SYSTEM lacks the approved branding licence
and trademark policy. The correction passes byte/mode/failure staging controls
and exact assembled134e89 payload checks. The immutable replacement exists;
clean and actual RC2-upgraded guest readbacks now pass exact bytes/modes.
Receipts: `docs/qa-logs/2026-10-03-m7-replacement-qa/`.
**Replacement01 (134e89) completed:** clean/default plus separate78-frame
comparison, actual RC2 upgrade/readbacks, seven WebDAV and seven S3 link cases,
archive24+56 assertions, strict root22, local recovery23 and S3 refusal10.
All24 EN/FR640/1280 frames visually reviewed. #397/#401/#406 closed from their
published proof. Public-site screenshot4f6df54 remains local because GitHub
refused Blitterbot403; #327 remains open for delivery.

**Current replacement02 (61b64817bf):** build completed642tasks23:16:46UTC,
immutable bundle87b8c01d65dc22b4f29049bd0d69307a59c14c16f5223534e95058b2234ca5cd.
Includes directory-probe timing #364, root wording #407 and canonical proxy
account discovery #408. Full source regression1373+322PASS. Installed proxy
proof20, S3 refusal10, root transitions/sentence22 and archive writer/selected
journal8 now PASS. Full default15/15, actual RC2 upgrade and exact clean/upgraded readbacks now
PASS. A COW of the actual upgraded disk passes14 archive,4 timing and11
identity assertions. Installed legacy/current exit-sync medians264/241ms
are23ms apart within30ms, with exact transferred bytes. All guest/backend jobs
stopped. Receipts:2026-10-03-m7-replacement02-qualification and
2026-10-03-m7-final-runtime; previous-artifact evidence retains its scope.

Shared recorder and active session report failures, stalls and completion;
no disconnected delivery destination is configured (#395). RA ordinary award
needs the outstanding QA-account fixture answer. P4's approved primary plus
Fable5.1/xhigh Facilitator fixes review follows completed qualification. Audit
cadence remains due and unwaived; no RC claim. P5 source/licence/publication
and named device-action gates remain distinct.

**Historical review below:** all tables, numbered gaps and diagnostics below
record the2026-10-02 baseline. Their then-open source tasks are superseded by
the current execution update above and live milestone; retain them to explain
why earlier VM rounds were insufficient, not as another current work queue.

## Inputs and evidence checked at the review baseline

| Input | Observed state |
| --- | --- |
| Distribution | Feature `fcd0f20c9a`; content integrated on `next` as `df23faff6c`. Frozen ROCKNIX ancestry remains `9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6` (D-WORKFLOW-111). |
| EmulationStation | `97523542963dcc72e9ea51cfbcd26b735ff28c1f`; cloud ordering and displayed identity changes implemented and pushed. |
| Splash | `7450aa8180ae66684814dd460f31eb502b2abf61`; wordmark source and native render checks exist. |
| Build container | Selected `ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39`; consumption by the cold build is unproven. |
| Host regression suite | Pre-refresh receipt: 1,367 harness PASS, 0 FAIL, 0 SKIPPED, plus 72 focused cloud-case PASS lines and the 23-test subset-award result. Predates the libsoup/proxy refresh; not image evidence. |
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

## Goals, implementation and remaining proof at the review baseline

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

## Structural gaps behind the repeated VM rounds — review baseline

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

## Issue inventory and boundaries at the review baseline

Includes all open milestone-7 issues at review and relevant omitted issues.
An unchecked issue is not automatically missing code.

| Issues | Disposition at review |
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

1. **M7.P1 — State contract and negative controls:** #356 versions, numbered steps,
   interruption/retry/fleet; #320 recovery lock; #365 actor coverage. A new
   build cannot retroactively teach RC2 to understand future markers. State
   the supported older-build boundary and prove compatible behaviour; do not
   invent a fleet-wide-upgrade prerequisite from D-CLOUD-169.
2. **M7.P2 — Qualified source inputs:** #361 proxy preservation, freshness gaps,
   changed-package checks and relevant host suites; #310/#327/#332 software
   evidence and #371/#367 host gates. Diagnostic VM images here are
   engineering builds, not RCs.
3. **M7.P3 — Freeze and cold build:** record distro/ES/splash commits, container
   digest, source inventory and concurrency; build under RASTERATOPS. Store
   actual artifacts with manifest/digests, verify before/after QA. Never
   rename a warm root or select a newest-date glob.
4. **M7.P3 — Qualify that image:** clean install, RC2 upgrade, 15 default vm-qa
   suites plus required link/RA opt-ins, WebDAV/S3, guest pair, independently
   reset promoted cases and failing controls, future-marker/retry cases,
   writer-shaped archives, pending subset flush, memory/launch/timing,
   boot/card/update/identity frames at 640×480 and Nova's 1280×960 in English
   and French, image sweeps and licence/source evidence. Close software bugs
   with traces and `Already written:` treatment of existing state.
5. **M7.P4 — Independent fixes audit:** approved primary plus Fable 5.1/xhigh through
   verified Facilitator. Do not restart #375 or count blind/refutation as
   additional seats. Resolve findings; changed product inputs require rebuild
   and renewed affected evidence before an RC claim.
6. **M7.P5 — Release staging:** exact manifest-bound draft/source bundle, release/
   adoption/recovery notes and docs. RG35XX SP migration and other supported
   devices' smoke facts remain named per-action device work; attach only
   qualified assets. Publication remains separately authorized.

Can this be done on the VM? **Yes** for software acceptance, with synthetic
providers and hardware-path fixtures. Actual board boot, boot-medium/migration
and physical LED/panel facts belong in `docs/releases/device-facts.md`.
No personal cloud is needed to prove the state machine or recovery paths.

Image-only criteria remain open until an engineering build produces their
evidence; they block RC designation, not that build. #344's old P0–P6 labels
are contract sections, explicitly mapped in the milestone body, not M7 phase
numbers. Milestone-wide delivery/release/cloud umbrellas omit P in their titles.

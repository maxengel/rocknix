# Rasteratops 0.0.1 readiness review

**Date:** 2026-10-02. **Punch list:** [#382](https://github.com/rasteratops/distribution/issues/382). **Request:** [#375](https://github.com/rasteratops/distribution/issues/375).
**Baselines:** next `c9625abf7398adbec57139ccc819733c6764b203`; run101 distro
`b2378d9c33196f24066f1bcd233e14fa88211001`; ES
`e108699ea313ecd5ec64b4310a4ea665e05ca19f`; identity branch `c4a4cd188c`.
The cloud scripts in next and run101 are identical. No product fix in this review.
`git merge-base HEAD upstream/next` returns the frozen
`9fd38fa87094d4f0e956d03ac6c660fe4fd5e9d6`; the newer fetched upstream ref
has not moved the candidate base.

## Executive summary

**Not ready to declare a release candidate.** The cloud changes are substantially
implemented and the corrected mixed-installation test now passes **42/42** on the
retained run101 image. The full host script suite freshly passes **1,365 checks,
zero failures or skips**. Run101's main VM report remains **14/15**, with a stale
`/GAMES` round-trip fixture. A separate, real legacy-folder timing regression and
boot-card overlap remain. Several whole-boot state combinations are untested.

Blitterbot's identity migration is complete. The OS identity release is separate:
the inspected branches still build a ROCKNIX/date-versioned image, use the old
splash and update endpoint, and have no qualified combined RASTERATOPS 0.0.1
image. The primary review found two compatibility/error-handling seams:
changing OS_NAME hides RC2 settings archives (F-01), and a failed bucket-parent
listing becomes an absence offer (F-02). Neither implies observed loss of saves. Independent review also established
settings-only pointer abandonment (#379), an explicit content-root overwrite
(#380), and the scan/writer archive-directory mismatch (#381). The latter is
current, before the rename: the scan misses the per-device folders normal
backups use. T17 failed settlement/seeding was reproduced and remains with #365.

Keep the setup/boot/transfer-page settlement design. Finish #365's model-based
proofs, repair the narrowly identified seams, integrate branding and compatibility,
then qualify one frozen image set. Do not buy another iteration by weakening a
red gate or copying a previous image's checkmarks.

## Acceptance-criteria scorecard

`02-forward-audit.md` and `evidence/criteria.json` contain all 123 checkbox entries
from #344/#337/#354 and the reviewed children, including #353's comment-only
criteria. These counts measure the stated artifact requirements at this review;
they are not a percentage of product completion.

| Verdict | Count |
| --- | --- |
| PASS | 20 |
| PARTIAL | 56 |
| FAIL | 20 |
| SKIP | 13 |
| UNTESTABLE | 14 |

The dependent UNTESTABLE entries primarily require the final branded candidate
and manifest, which have not been built. Post-0.0.1 work and superseded Branch A
are explicitly excluded by recorded decisions. No dependent test is called a
product failure merely because its prerequisite is missing.

## What the VM checks have been finding

| Cut / evidence | Classification | What it establishes / next proof |
| --- | --- | --- |
| Run95 / worklog and kept transfer core | Historical product crash | Transfer callback lifetime was repaired in ES 0741cd64a; later image/route evidence replaces that cut. |
| Run96 1acdaf2cce, frame-diff | Harness default drift | Old folder fixtures produced migration rows; later tools derive shipped defaults. |
| Run97 d9493fe339, frames | Product UI plus sample instability | Dimmed SETTINGS inset fixed in ES 551c5a762; phone hidden-confirmation CSS fixed in run98. |
| Run98 64a14539bc, 15/15 main suite | Incomplete coverage | A green main suite did not cover fresh-device join beside an older cloud; run99 added it. |
| Run99 041900bfa7, pair and epic proof | Product join fixed; proof isolation/claim errors | Pair negative control failed as intended; D inherited C's selection. Frame claims were one pixel short. Follow cost 419 vs 147 ms motivated D-CLOUD-170. |
| Run100 cb0b051b72, 15/15 and 39/0 pair | Product defect missed by main suite | Guest-d E found backup creating /GAMES under a SKIPPED card; D repeated inherited state. Timing comparison's unchecked config copy was invalid, not a slow product. |
| Run101 b2378d9c33, round-trip.log:9,16 | Harness fixture; dependent checks unexercised | /GAMES + absent-root guard gives 0/9 upload. Eleven failing assertions are not eleven independent regressions. Fix #366, then rerun on candidate. |
| Run101 original pair 34/5 | Stale expectation | Old 5m demanded forbidden recreation. Current tool 93235f254b rerun here: **42/0**, including absent-root follow (5m) and staged old-writer merge (5n). |
| Run101 follow benchmark | Measured product cost | Five samples each; medians 325/266 ms, delta59 >30 ms. #364 remains. Current-folder exit stamp comparison with RC2 has median1.45 s on both and does not excuse this result. |
| Run101 E saved frame | Visible ordering defect | SKIPPED card overlaps CHECKING YOUR CLOUD; worker completion precedes card disappearance. #363/#365. |
| Run101 C/F/G | Coverage gap | Frames collected, no case assertion calls. Promote/reset/assert under #365. |

Raw roots and test versions are in `01-research-notes.md`; the new pair log is
`/workspace/artifacts/rocknix-images/qa-b2378d9c33-pair-migration-from-69e6039f8f-20261002-0606/pair-migration.log`.
Run101's historical upgrade rehearsal is green. No new image was built here.

## Code quality assessment

Strengths: copy/check/remove verifies before pointer publication and deletion;
the configured remote stays explicit; content pre-tier rows now filter against
known systems; script and UI protocol paths are traceable; the current pair test
distinguishes a missing old folder from a real old writer.

Concerns: separate folder predicates, multiple archive-name readers coupled to
OS_NAME, and ignored settlement failures. The two new confirmed findings are:

- **F-01 — High ([#376](https://github.com/rasteratops/distribution/issues/376)), planned identity transition loses discovery of old settings
  archives.** `cloud_scan:219` only matches `${osn}_SETTINGS`; the exact predicate
  returns MINE for ROCKNIX and empty for RASTERATOPS on the same legacy fixture.
  Siblings: `cloud_restore:2125,2143`, `cloud_backup:2387`, and
  `backuptool:143–167,1459,1463,1827`. Preserve a stable archive identity or read
  both formats deliberately; prove scan, restore, local recovery and retention
  across the rename. This is conditional on the pending rename, not a failure
  observed on current ROCKNIX-named run101.
- **F-02 — Medium ([#377](https://github.com/rasteratops/distribution/issues/377)), failed bucket listing becomes absent.**
  `cloud_backup:819–825,1677–1685` pipes the parent listing into grep and negates
  its result. A synthetic `lsd=0`, bucket=true, `lsf=5` yields an absence offer
  and exit0. This contradicts D-CLOUD-172's unknown-result fallback. The restore
  helper is the sibling to inspect. Preserve present/absent/error separately;
  a reachable synthetic bucket fixture must exercise the backup guard, while S3 can exercise the ungated restore sibling. Ordinary bucket-prefixed S3 backup paths miss the exact superseded-name guard.

Complexity hotspots: migration's join/settle/follow/apply dispatch; the setup
callback's continuation into seeding even after failed scan; archive parsing
across local and cloud restoration. `GuiMenu.cpp` splitting is outside 0.0.1.

Additional confirmed findings from the second opinion and primary follow-up:

- **G-02 — Medium (#379):** follow/settle replaces the settings pointer after
  testing only saves. A populated old Backups tier is never inspected or copied.
  `--apply` already has a separate copying path; the defect is pointer-only flow.
- **G-10 — Low (#380):** an explicit empty content root is a deliberate choice
  to seeding, but migration overwrites it as if the key were absent.
- **G-13 — High (#381):** `cloud_backup:2037` writes per-device archive folders;
  `cloud_scan:210` lists only the flat tier root. The full production scan with
  real host rclone cannot see a writer-shaped archive; the flat-root control works.
- **A-7 — Low, resolved here:** the original PARTIAL notes were generic. All 58
  now identify criterion-specific missing evidence; two become FAIL for G-13.

Full probe outputs and primary verification are in
`evidence/reviewer-lead-verification.md`. They establish the script-level paths;
final-image VM regression is still required. Existing T17 seeding on settlement
failure is reproduced and narrowed to Low under #365, not a duplicate punch item.

## Cornerstone conformance

**Overall: MEDIUM.** The project-conformance tables and interaction audit are in
`03-retrospective.md`. Progress preservation is visible in move ordering and
retained copies. Upgrade compatibility and truthful unknown-state handling still
need the two fixes above. The state table and mini-retro satisfy the requested
step back; executable T-cell coverage and proof promotion do not yet exist.

## Spec fidelity

Aligned: setup-step placement, offline connection offer, one restore/setup page
at a time, copy/verify/delete, explicit current/kept/custom states, scan before
options, per-model settings offer, filtered content listing.

Diverged or stale: “no sync checks” versus backup probe; “after the card” versus
worker lifetime; #356's numbered ladder versus marker-only implementation;
old FROM/CONTINUE/chooser proposals versus D-CLOUD-164/167. #344 still repeats
settled owner/topology/shadow questions. The table documents behavior without
silently reversing D-CLOUD-170–172.

## Missing artifacts

Tracked already: #365 in-tree epic proof and complete cell coverage; #356
cloud-layout design/numbered migration behavior; #337 branded image and wordmark
frames; #344 immutable candidate manifest, source inventory and release proofs;
child public-doc updates. Searches and existing owners are in 03; none is
invented as a fresh duplicate issue.

## Risk assessment

| Risk | Severity | Impact | Mitigation |
| --- | --- | --- | --- |
| F-01 identity/archive coupling | High | Legacy settings invisible during migration/recovery | Compatible reader/writer contract and old/new image fixture |
| G-13 archive-directory mismatch | High | Normal per-device settings backups invisible to scan | Align scan with writer/restore and use a production upload fixture |
| G-02 settings-only migration | Medium | Old archives remain but settings pointer leaves them | Tier-aware follow/settle and restore proof |
| G-10 explicit content root | Low | Deliberate root choice silently replaced | Distinguish missing key from explicit empty |
| F-02 unknown bucket state | Medium | Backup skipped and wrong setup advice after provider failure | Three-way predicate and S3 failure injection |
| T08/T11/T12 startup interactions | High verification priority | Wrong root can win or misleading startup outcome | Whole-boot byte/pointer/outcome cases; currently hypotheses |
| Legacy extra listing | Medium | Per-exit cost contradicts accepted goal | #364 explicit decision and repeated measurement |
| Boot card overlap | Medium | Two surfaces compete; confusing setup | Wait on visibility without reintroducing sync-lock race |
| Final identity/release contract absent | Release blocker | Cannot qualify or publish intended 0.0.1 | Finish #337/#344, then frozen-input proofs |

## Ordered route to a workable build

1. **Finish the model and tests (#365).** Review T01–T19, implement missing actor
   cases and promote the guest proof with per-case reset/nonzero failure. Include
   empty `/GAMES` beside populated `/ROCKNIX`, absent old parent beside current
   fleet, provider failure during settle, and worker-ended/card-still-visible.
2. **Repair the known narrow defects.** #366 derives fixtures from shipped
   defaults and checks old names from `--superseded`; fix F-01/F-02 and the boot
   card seam. Keep current setup-step direction. #364 resolves the extra probe's
   cost explicitly; do not broaden automatic network work.
3. **Integrate actual OS identity (#337/#344).** RASTERATOPS/0.0.1, placeholder
   wordmark, fork-owned splash pin, manual-only updater that makes no upstream
   request, disable upstream statistics, compatible archive identity and
   `-from-ROCKNIX` adoption tar. Keep DISTRO/path/partition contracts. Update
   publication tooling to select frozen semver artifacts, not newest dated files.
4. **Freeze inputs and close preflight.** Refresh rc-accept against D-WORKFLOW-111
   and explicit #361/#362 dispositions. Freshness read here exits2 because
   dmidecode is UNKNOWN; resolve the query/resolver rather than accepting unknown.
   RAOfflineProxy is now 13 commits behind, so do not reuse the old four-commit
   description as a fresh upstream review. Retain runner-disabled fallback until
   P1's trigger/isolation evidence exists; no claim of an active unsafe runner.
5. **One final GENERIC_X64 build and proof chain.** Cold branding build required
   by P2; retain manifest/hash. Clean install, RC2 upgrade with old archives,
   stock-shaped configuration, corrected WebDAV and S3 round-trip, pair migration,
   all main suites, dedicated T-cells, 640x480/French frames, and repeated
   time-to-play/legacy benchmark. Same input hash before and after QA.
6. **Devices and publication follow the proven candidate.** H700 and SM8550 from
   the same input set; mandatory RG35XX SP manual adoption, then device smoke
   facts. All three current devices upgraded before one moves the shared cloud.
   Each device action and eventual release publication retain their own yes.
   D-WORKFLOW-120 is the later per-asset smoke-test rule. RK3566 and upstream
   submission are outside this release.

The independent pass adds priority to the route: fix #381's archive discovery
alongside #376 before trusting any settings-restore frame; cover settings-only
archives (#379) and explicit root choices (#380) in #365. Keep the seeding fault
repair in #365. Corrected AC counts are documented in 02's refutation follow-up.

## Coverage boundary

Examined: source/consumer paths above, run95–101 records, selected raw logs,
saved E frame, complete host script suite, current pair harness on retained
images, instruction/register/menu/vocabulary checks and live freshness inventory.
Host namespace restrictions required escalated execution; KVM works there.

Not exercised: final branded image (not implemented), whole-boot T08/T11/T12,
live Dropbox trust-page before/after, reachable bucket/restore fault probes, device boot
chains, runner-enabled state, whole inherited ROCKNIX codebase (D-WORKFLOW-102).
The unchanged run101 main suite was not rerun to repeat its known fixture failure.
Additional unverified cells: restricted bucket-list permissions, lone-device two
old populated roots, content collision before marker publication, interruption
between sequential pointer writes. These have #365 coverage ownership; none is
called a reproduced product failure. Host probe details/version are explicit.

## Finding verification

| Finding | Severity | Survived refutation? | Check |
| --- | --- | --- | --- |
| F-01 | High | Yes, conditional on approved rename | Exact production matcher run with both OS names; searched all archive consumers for legacy fallback. Local reader remains OS_NAME-specific. No claim that the rename already shipped. |
| F-02 | Medium | Yes for predicate | Exact helper/control block with failed parent list returns absence offer; sibling helper and D-CLOUD-172 fallback read. Real S3 full-script execution remains fix acceptance. |
| G-13 | High | Yes, source/host scope | prepare never appends device folder; writer does; actual scan lsf argv is nonrecursive. Full-script real local-rclone nested/flat controls reproduce the mismatch. Candidate VM UI proof remains owed. |
| Boot card overlap (#363) | Medium | Yes | Opened E frame; mInstance clears before linger; waiter checks worker/job/GUI, not notification. Existing issue, not new punch item. |

## Second opinion

**Selected depth:** independent, two model perspectives: the primary Codex/OpenAI
auditor and one external Anthropic Fable 5.1 reviewer at `xhigh`. The maintainer
identified the primary as Astra 6; no provider receipt attests the harness's exact
model. Lab selection follows D-WORKFLOW-137 (#378), superseding the initial
GPT-only packet choice. This is not a five-seat council run. The Milestone blind
and refutation passes are two calls to the same Fable reviewer.

The maintainer explicitly approved both transfers. Both calls completed through
`tools/council/run invoke --member claude --provider openrouter --prompt-file
second-opinions/<brief> --output second-opinions/<output>` (paths are relative to
this audit folder here; the actual commands used full repository-relative paths).
Facilitator 1.14.0; each output has a sibling `.provenance.json` below. Manual
per-call verification and the installed review-plan checker passed actual model,
effort, outcome, Facilitator attestation and both recorded output hashes. The
council-research-specific lints are absent in this export; its rule's documented
manual fallback was used. Output and receipt bytes are immutable.

| Output | Served model | Effort | Outcome / identity | SHA256 |
| --- | --- | --- | --- | --- |
| claude-fable-5.1-blind.md | anthropic/claude-fable-5.1 | xhigh | success / PASS | `e1fa0466ce06157d978e5879c7549d1b683ad7e6c70097c45203028c95765644` |
| claude-fable-5.1-audit.md | anthropic/claude-fable-5.1 | xhigh | success / PASS | `23b695f113f98473d07daefc6632e14dcb11c6edfd1b60335cd6e3a41eec9fb2` |

The blind call had one HTTP429 then a successful retry; refutation succeeded on
its first attempt. Two perspectives, one external reviewer, two verified calls.
Inputs: `claude-brief-blind.md` and `claude-brief-refutation.md`. The latter adds
missing same-scope source context requested by the blind reader and its reply
verbatim. No product code changed between calls.

| Seat lead | Primary grade | Artifact / disposition |
| --- | --- | --- |
| Blind G-01 / refutation F-01 | confirmed, conditional High | OS-name matcher probe and all named consumers; folds into #376. CLI fallback is limited to the chosen device/legacy folder, not an arbitrary fleet archive. |
| G-02 / A-1 | agree, narrowed; Medium | Full-script layout probe: follow/settle abandons old Backups pointer; --apply copies it. New #379. |
| G-03 / A-2 | agree, re-graded Low | Full cloud_setup fault probe rc124/1 creates GAMES; success control does not. Readable config and successful later writes required. Existing T17/#365. |
| G-04 / F-02 | agree, narrowed; Medium | Exact predicate and restore sibling read; #377 acceptance corrected to reachable backup fixture plus S3 restore. Features-query error is a related unproven branch. |
| G-05 | agree, narrowed | 59ms guest benchmark persists, #364. No proven handheld extrapolation; VM-first policy stands. |
| G-06 | confirmed tracked gap | Freshness exit2, dmidecode UNKNOWN; current #361/#362 dispositions still required. |
| G-07 | confirmed tracked gap | Run101 round-trip0/9 and bare GAMES fixture; #366 owns guard/comment-exclusion cases. |
| G-08 | disagree, with artifact | Configured-first is explicit at cloud_migrate_layout:73–92, D-CLOUD-169, test:13345. Two-old-root lone-device residual stays #365. |
| G-09 | could not verify defect | Overall 20s bound is distinct from per-call maxima; no slow-provider reproduction. Budget/cancellation cases remain #365. |
| G-10 | confirmed Low | Existing root-choice test:4688–4701 versus layout probe rewriting explicit empty. New #380. |
| G-11 | could not verify | Root probe exists, restricted permission policy untested; #365 coverage boundary. |
| G-12 | agree, narrowed | D-CLOUD-164/167 supersede old proposals; conditional other-devices-follow wording stays #353/#365. |
| Minor pointer-write interruption | could not verify | Sequential writes at627–640 and815–885; interruption case recorded under #365. |
| Minor shared exit2 | disagree, with artifact | cloud_scan:124,195; distinct invocation contexts, no demonstrated behavior defect. |
| Minor duplicated defaults | agree, narrowed | Literal roots at script/UI anchors; #356 owns future migration-contract work, no new defect. |
| A-3 marker/content collision | could not verify | :1012–1028,1249–1259 protect unrelated content and can defer marker; recovery-cell proof owed under #365/#356. |
| A-4 silent planning interval | agree, narrowed | Listings precede first unit at1200; no measured unacceptable latency; existing move timing scope. |
| A-5 folder-layout question | confirmed new High G-13 | Writer:2037, restore:2020–2098, scan:210 and real local-rclone probe. README is accurate; scan misses per-device folders. New #381. |
| A-6 provenance | agree, narrowed | Host probes confirmed; benchmark is guest-d execution in saved bench.log, not host-only. Warm-up characterization unproved. |
| A-7 criterion-note quality | confirmed, resolved | All 58 original PARTIAL notes now specific; AC349-04/350-05 regraded FAIL. Packets retain original bytes. |

**Net effect:** five audit-discovered product findings (#376/#377/#379/#380/#381)
plus one report-quality finding resolved in this change. Three product findings
were added by the independent passes and primary follow-up; two initial findings
were corroborated and narrowed. Existing seeding failure was reproduced/regraded,
not duplicated. Every numbered lead, addition and minor note has a disposition;
source-only residuals remain explicit. Detailed checks, refutations and limits:
`evidence/reviewer-lead-verification.md`.

## Instruction file recommendations

Existing rules cover the failures: upgrade-and-install for F-01,
engineering-practices' failed-read/guard discipline for F-02, and UI/least-surprise
for card ordering. Repeated patterns belong in #365/#366's executable guard work.
No additional generic rule or new skill is justified by this review.

## Quality self-check

| Required part | Status |
| --- | --- |
| AC scorecard and exact source entries | Present; counts generated from criteria.json |
| Conformance and cross-system tables | Present in 03 |
| Coverage boundary | Present in 02 and 04 |
| High finding refutation | Present; F-01 conditional trigger stated |
| Independent second opinion | Complete: two verified Fable calls; every lead graded against primary artifacts |
| Instruction recommendations | Present |
| Visual evidence consolidation | Present; E frame opened, C/F/G limits explicit |
| Verdict vocabulary | PASS/PARTIAL/FAIL/SKIP/UNTESTABLE |
| Traceability and reproducibility | Source lines, probes, logs, image IDs and immutable reviewer receipts retained |

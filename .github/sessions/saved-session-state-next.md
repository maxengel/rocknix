# Saved Session State

## Start here

This is a live checkpoint of the authorized four-step Rasteratops0.0.1
remediation, not a release claim or a request to restart the initial audit.
ROCKNIX is the immutable OS build system; Rasteratops is this fork. Read
`AGENTS.md`, the canonical `.claude/rules/` on `next`, this file, the current
work log and #383 before touching source. Older context is archived at
`.github/sessions/archived/saved-session-state-next-20261002T210721Z.md`.

1. The owner approved all four steps in order: executable regression
   coverage, fixes, one combined branded build and VM qualification, then
   the independent audit of the fixes. #383 owns this delivery. Do not ask
   again for those steps or the other-lab review. No publication or physical
   device/personal-cloud action is authorized by that scope.
2. Primary distribution checkout `/workspace/repos/rocknix` stays on `next`.
   Work is in `/workspace/repos/rocknix.worktrees/conflict-resolution`, branch
   `feature/conflict-resolution`. Its historical merges cannot be pushed
   (#371); integrate new commits into `next` by cherry-pick, not by merging
   its old history. The implementation commits are already integrated: `next` is clean at
   f8816b4dc9; feature HEAD is9bcf46924d. Do not cherry-pick them again.
3. Read #383, #365, #337/#344, #361/#362 and #384 through their last comments,
   with `gh --repo rasteratops/distribution ... --json body,comments`.
   #375/#382's initial cross-lab audit is complete. Its five product findings
   remain #376/#377/#379/#380/#381; their implementation is not VM acceptance.
4. The shared temp directory for current scripts and logs is
   `/tmp/rasteratops-rc-delivery-20261002/`. Verify live process ownership;
   saved PIDs are not permission to kill a later process with that number.
   Never edit a shell runner while it is in flight.
5. Bot identity is Blitterbot; migration #374 is complete. Existing local
   Git/SSH/gh credentials work; do not request or print tokens. Configuration
   and process argv reads use `grep -v -i -E 'key|pass|token|user|psk'`.
   Host harness verdicts use the narrower filter in the VM rule so PASS is
   not erased. Explicitly name the fork for every gh operation.

> Saved: 2026-10-02T21:18:56Z. Working branch: feature/conflict-resolution.
> Source changes below are committed and integrated locally; cold build has not started.

## Current focus

Steps1/2 have host regression evidence and committed cloud fixes. Step3 is
preparing refreshed source inputs. The owner answered the #361/#362 question:
use current upstream proxy/libraries while preserving all functionality and
contribute general-purpose improvements back to RAOfflineProxy (#168).
D-WORKFLOW-138 replaces the old pin proposal; do not ask for that disposition
again. See `docs/rasteratops/candidate-source-plan.md`. Current upstream proxy
bdcd229b45 has a bulk queue/budget: the fork's unindexed helper must not count
`queued=True` as ready offline. Eight of sixteen patches apply to the current
source; eight need semantic review/rebase, some already upstream. Downloads
in `/tmp/rasteratops-upstream-refresh-20261002/`; patch applicability and104-test
pristine upstream PASS receipts in `docs/qa-logs/2026-10-02-upstream-refresh/`.
libsoup recipe is now3.8.0, official hash verified, pkgcheck passed; its GLib
minimum2.70 is already satisfied by2.89.3. WebKit remains2.54.1. No new runtime
qualification or cold build yet. First upstream contribution prepared/tested
(105PASS) at `docs/upstream/raofflineproxy/image-publication/`, not submitted.
The optional scan-pacing question is pending; default preserves existing
whole-library preparation. A three-way rebase experiment under the temp
`rebased/` directory has unresolved conflicts and MUST NOT be copied as
production patches. Current shipped proxy recipe/patches are unchanged.
This source-refresh checkpoint follows feature9bcf46924d / next f8816b4dc9;
use git log for its committed/integrated head. No distribution push is claimed.

## Completed and prepared

- Distribution commits on this feature branch, after the content-equivalent
  audit head a3a2f395c4: d3753beab5 (delivery/futro),8a27b0ec92 (negative
  regressions),dbbbdc73c4 (cloud fixes),bd033f8adf (identity/preflight).
  Already cherry-picked into `next` as b2cad5c56f,3b9a62d976,f864baac02,
  3d7c075f63 respectively; product/rule content matches.
- The cloud scripts share device-specific settings archive discovery, read
  both OS suffixes but retain the ROCKNIX writer contract, preserve populated
  settings tiers and explicit empty content roots, propagate settlement/follow
  failure, ignore README-only legacy saves roots, and distinguish failed
  bucket discovery from absence. The backup legacy guard uses one listing.
- Full host suite after fixes:1366PASS/0FAIL/0SKIPPED; final focused suite:
  72PASS/0FAIL. Receipts are committed in
  `docs/qa-logs/2026-10-02-cloud-remediation/`. The original58-case control
  had36PASS/22FAIL on the image's rclone1.75.1. Host rclone1.60 was an invalid
  diagnostic because it lacks a seeding flag.
- New tools: `rasteratops-cloud-layout-test`, `rasteratops-vm-cloud-epic`;
  shipped helper `rasteratops-settings-archive`. The guest runner resets
  each case and has an asserted failing control. Actual guest runs are owed.
- ES source at `/home/max/Development/emulationstation-next.worktrees/cloud-epic`:
  fc465b126 and4ea18b9b6 implement boot preparation before transfer and wait
  for both the worker and the actual outcome-card lifetime. D-CLOUD-173 records
  the30-second preparation ceiling. Identity commit97523542963dcc72e9ea51cfbcd26b735ff28c1f
  adds the displayed name, manual-update row, inert automatic update check,
  wordmark and French translations. Merged and pushed to `test/qa-integration`;
  the matching worktree is `.../qa-integration`. Syntax checks passed.
- Splash source `/tmp/rasteratops-rc-delivery-20261002/splash`, master
  7450aa8180ae66684814dd460f31eb502b2abf61, pushed to rasteratops/splash.
  Tiny5 Duo source/OFL and generated wordmark are retained. Native make and
  in-memory production rendering pass640x480 at0/90/180/270 and1280x960.
  GitHub full-hash archive SHA256 f989e6e1f0e2f5db5350b9e429231a12f572e2ba71652ba68ac4311a7014b490.
- Committed distribution changes pin ES/splash, set DISTRONAME=RASTERATOPS,
  OS_VERSION=0.0.1 and IMAGE_SUFFIX=from-ROCKNIX. DISTRO, OSNAME, partition
  labels, kernel hostname, commands/settings/paths remain RC2-compatible.
  Manual updater and statistics shims are inert; timer symlinks to /dev/null.
  README/LICENSE/TRADEMARK/NAMING and visible installer/cloud strings updated.
- The default theme has its own splash and now selects the same SVG; its
  persisted distribution:rocknix setting stays unchanged. Its splash.xml is
  CRLF, so the patch preserves CRLF; dry-run now passes. French po plus the
  theme displayName are the changed localization entries.
- WebKitGTK2.54.1 released today. Official archive hash and both patch dry-runs
  passed; recipe bumped. GNU/Savannah freshness queries use HTTPS, resolving
  dmidecode's earlier unknown. Previous freshness receipt predates the owner-directed refresh; rerun on its final inputs.
- #384 reproduces subset awards mapped to the base game. Upstream1278ebcd47
  is patch017 against the existing proxy:23 award-parity tests pass after it.
  Image queued-award flush still required. Full suite now invokes these tests.
- New source identity checker passes. Template-only control fails as intended.
  It is not the full image brand sweep or old-logo frame matcher; those remain.
- New `tools/rasteratops-candidate-store` locks, copies atomically to a manifest
  digest directory and verifies artifacts. Synthetic tests prove reuse,
  old-bundle preservation and corruption detection. No real candidate stored.
- Two inherited untrusted-event workflows now use hosted runners; the old
  direct CI-image release workflow is disabled. Bot runner inventory API403;
  local runner process/service search found none, not proof about remote hosts.

## Live jobs and immediate next commands

- Corrected full host suite completed with rc0:1367 harness PASS,0 FAIL,
  0 SKIPPED; all72 focused cloud cases PASS, plus the upstream award-parity
  suite. Receipt: `docs/qa-logs/2026-10-02-candidate-preflight/full-host-suite.log`.
  Temp files `last-good-qualified.{log,rc,status}` retain the raw run. Its
  job1165475 and watcher1200633 are historical now, not processes to stop.
  No test, build or VM job remains intentionally running at this checkpoint.
  Future long-job watchers must run in the same host namespace as the job;
  sandbox ps cannot see the host PID. For cancellation tests reset SIGINT and
  SIGQUIT to SIG_DFL when launching the detached process through Python.
- Historical source preflight at21:05 ended1; `rc-preflight-current.{log,rc}`
  in temp describes dbbbdc73c4 and the old acceptance file, not the current
  tree. Rerun on the final integrated/build tree after disposition changes.
  Freshness0 is not rc-preflight0. Five audit findings had no bug label and
  were omitted by this historical inventory; the labels are now corrected.
- No build or VM is running at this checkpoint. No shell runner is intentionally held in flight; verify before edits.

## Next steps, in order

1. Read the final passing host receipt; do not repeat the suite without a
   relevant source change. The import path and source-cache fixes are complete.
2. The previous implementation inputs are committed/integrated. Finish and
   qualify the proxy refresh before freezing the combined build inputs. Final prior receipts/handoff are already committed
   as9bcf46924d and integrated as f8816b4dc9. Preserve the separate cloud-epic
   worktree's held changelog. The owner selected refresh under D-WORKFLOW-138.
3. Update `docs/releases/rc-accept.txt` against current facts: D-WORKFLOW-111's
   frozen-base row is corrected and the stale proxy acceptance removed; proxy/libsoup
   refresh now needs qualification, not another owner disposition. Each fixed issue needs a code trace and
   Already written line. #384's source trace is posted; add its integrated commit when logging QA.
4. Cold-build GENERIC_X64 under `build.RASTERATOPS-GENERIC_X64.x86_64`.
   Build worktree `/workspace/repos/rocknix.worktrees/generic-x64`, branch
   build/generic-x64 at b2378d9c33196f24066f1bcd233e14fa88211001. Only generated
   documentation was dirty; inspect, restore only that generated file, then
   ff-only to integrated next. Never rename the warm ROCKNIX build root.
   Follow `/workspace/tmp/rocknix-session/build-x64-run101.sh` for mounts,
   replacing the warm-clean step and EVERY hardcoded build-root reference,
   including the failure thread-log collector, and naming this new cold run.
   No cold launcher exists yet. Digest pinned
   in Makefile: ghcr.io/rasteratops/build@sha256:988c0ba586263caeba4be4c03bd16eee055c9d066657951e320087bb8226ee39.
   Build as max, with main.git and `/workspace/cache/rocknix-sources` mounts.
   `tools/build-preflight` was READY:47GB RAM available,1.9TB free, no guests.
   Record actual input commits/digest/concurrency, source archive index and
   log. Launch with pidfile/resultfile and `tools/watch-job`; record the live
   watcher. Candidate storage is local, by digest, and QA writes outside it.
5. Qualify exactly that stored artifact: full `tools/vm-qa` (all15 default suites plus the required opt-in
   link/ra-offline proofs;17 suites are declared),
   RC2 upgrade rehearsal, WebDAV and S3, `tools/cloud-pair-migration`, promoted
   guest proof order H,A,C,D,B,E,I,J,K,L,F,G,T08,T11,T12 with per-case resets,
   time-to-play, #364 five-sample legacy/current overhead<=30ms, startup card
   frames, manual-updates/wordmark frames640x480 English/French and1280x800.
   Add #384's synthetic queued subset-award flush. Run the bumped sign-in
   window proof and memory bound. Freeze brand/secret/localization/source
   inventory evidence; no previous image's result qualifies this one.
6. Only after image checks, run the code-auditor skill on the fixes at the
   approved cross-lab depth. Primary Codex plus Fable5.1 xhigh through the
   Facilitator ONLY, verify-pins and all receipt/identity checks, serial phases.
   Two perspectives, not five council seats. The existing #375 initial review
   is complete and immutable. Fix findings, rebuild/requalify changed bytes.
7. Source and VM evidence close product issues; do not tick VM criteria from
   host logs. Physical-device staging/soak and release publication need their
   later named actions. No candidate claim while known work remains.

## Artifacts, traps and carry-forward work

- RC2 image: `/workspace/artifacts/rocknix-images/x64-all-20260929-69e6039f8f/ROCKNIX-GENERIC_X64.x86_64-20260929.img.gz`.
  Run101 baseline: `/workspace/artifacts/rocknix-images/x64-all-20261002-b2378d9c33/`.
- Guest d: SSH10026, VNC5912, monitor `/tmp/rocknix-qemu-monitor-d.sock`.
  QA key under `${VM_PAIR_DIR:-/tmp/rocknix-vm-pair}/qa-key`.
  Read `/workspace/tmp/rocknix-session/rebuild-d-plain.sh` before using;
  replace its newest-date glob with the exact semver candidate artifact.
  WebDAV9010/S39012; only one writer to the synthetic cloud at a time.
- `tools/rasteratops-vm-cloud-epic` has not been exercised against an image;
  a successful shell syntax/negative control is not proof of its UI walk.
  T23 interrupted content retry and future fleet-marker version handling need
  the #365/#356 evidence. `docs/rasteratops/cloud-layout.md` now records the
  implemented transition and the unfinished numbered/future-version contract.
  D-CLOUD-169 covers fresh/empty joins and mixed roots; it does not require
  fleet-wide upgrades or prove old builds understand a future marker.
- The cloud-epic distro worktree holds an uncommitted changelog whose “no sync
  checks the folder” claim is false. Preserve then reconcile it against the
  final candidate; do not overwrite the owner's held work.
- Public docs PR and release/adoption notes remain required; site itself is
  a placeholder in0.0.1. Corresponding-source inventory is still required;
  off-host backup topology/drill is deferred by D-WORKFLOW-113, not invented.
- #368 documentation gaps and #371 historical push issue are separate work.
  New helpers retain the rasteratops prefix; upstream paths/keys remain stable.
- The identity guard deliberately covers source contracts only. Image-wide
  zero-unclassified brand sweep, injected old-logo frame failure and artifact
  secret sweep remain unqualified. Candidate-store helper uses mode protection
  plus verification; it is not protection against the host owner changing files.

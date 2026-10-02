# Forward audit — Rasteratops 0.0.1
**Phase 2:** independent criteria read, before prior-verdict comparison. Source excerpts and commands are in evidence/. This is a readiness review, not a claim that all future release actions have run.

### AC-344-01: `docs/rasteratops/p0-read.md` exists with one decision per row of the base plan's §2, each citing `path:line`, and its first line answers three questions: does `DISTRO=rasteratops` imply a new directory; do image and asset file names derive from `DISTRO`, `DISTRONAME` or something else; what does `rocknix-update` match on. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md`
**Source:** #344, body checkbox 1.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-02: The sweep report from the base plan's §1.15 command lists every hit in exactly one of four classes (display text; machine identity; persisted paths and network names; boot and storage contracts); every class 2 to 4 hit is marked KEEP, and any non-KEEP carries `path:line`, a reason and a reference to a recorded yes. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-sweep.md and p0-sweep-hits.txt`
**Source:** #344, body checkbox 2.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-03: The updater note records the mechanism, the asset pattern, redirect handling, any distro-name check, draft and pre-release handling, the manual route, and the comparison function's result on `0.0.1` against RC2's version string as a table, and names Branch A (unaided over-the-air) or Branch B (manual adoption). -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-updater.md`
**Source:** #344, body checkbox 3.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-04: `BUILD_ID`'s derivation is quoted with `path:line`, with its timestamp and host dependence stated. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § BUILD_ID`
**Source:** #344, body checkbox 4.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-05: `docs/rasteratops/support-matrix.md` exists with the columns target/arch, physical boards, QA guest, clean install, upgrade, boot medium and boot-chain deltas, recovery method, attachment status; the mandatory migration device is marked. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/support-matrix.md`
**Source:** #344, body checkbox 5.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-06: `df -B1` of the build volume and `du -sb` per existing root are recorded, with the forecast as line items (old roots, new roots, source archives, VM overlays, retained candidates). -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Disk`
**Source:** #344, body checkbox 6.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-07: The per-asset size limit is recorded with its source and date; the ES licence is quoted from the ES tree; the splash repository's owner is recorded; the digest behind the build container's `:latest` is recorded; `DISTRO_SRC` or its equivalent is recorded. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Platform facts`
**Source:** #344, body checkbox 7.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-08: D-WORKFLOW-088 (present in the register; absent from the run's packet) is cited, and Choice 2 of #338 is labelled or struck. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Platform facts`
**Source:** #344, body checkbox 8.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-09: `git log -- distributions/` shows no identity commit and `git tag` shows no `0.0.1`. -- done 2026-09-30, `224b73ea54`: `docs/rasteratops/p0-read.md § Platform facts`
**Source:** #344, body checkbox 9.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Historical P0 artifact requirement, not candidate runtime acceptance. Read named documents and checked they contain the required tables, citations and baseline identifiers. Their later-superseded cloud/device statements are explicitly historical.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-10: The three repositories are transferred and `rocknix-splash` forked; the ES and splash commits are pinned; every recipe URL and `git remote -v` in every worktree shows fork addresses.
**Source:** #344, body checkbox 10.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-11: The bot token's scope inventory (repositories × permissions × expiry) is recorded and an expiry reminder is configured on the mail channel.
**Source:** #344, body checkbox 11.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-12: A workflow grep finds no `pull_request`, `pull_request_target` or `workflow_run` job with `runs-on: self-hosted`; a trigger dry-run from a throwaway fork schedules no self-hosted job.
**Source:** #344, body checkbox 12.

**Verdict:** FAIL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** The PR validation workflow still has pull_request plus self-hosted. This is a configured trigger gap already covered by P1; runner-enabled state was not inspected, so no claim of an active exposed runner.

### AC-344-13: Isolation: `sudo -u runner test -r <path>; echo $?` prints `1` for each secret path; a canary read alerts; `sudo -u runner id` shows no `docker`; `sudo -u runner sudo -l` is empty; `sudo -u runner test -r /var/run/docker.sock` fails; the setuid audit is recorded. If any check fails, the runner is shown disabled.
**Source:** #344, body checkbox 13.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-14: The build container is mirrored under fork control; the build invocation references it by `@sha256:`; `docker inspect` or a build-log line shows that digest consumed.
**Source:** #344, body checkbox 14.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-15: A source-tarball archive index lists every fetched tarball with its hash, in fork-owned storage inside the backup scope.
**Source:** #344, body checkbox 15.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-16: A snapshot ID is recorded; a representative file is restored; the restore-drill log shows the blueprint completing a warm build on a clean host with no secret present.
**Source:** #344, body checkbox 16.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** D-WORKFLOW-113 moves infrastructure snapshot/restore-drill work to #355 after 0.0.1; old P1 blocking wording needs reconciliation.

### AC-344-17: The candidate store path and its `flock` wrapper are in place; the upstream base commit is recorded as frozen.
**Source:** #344, body checkbox 17.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-18: The freeze is in force with the emergency exception written. -- D-WORKFLOW-111, 2026-10-01: `upstream/next` at `9fd38fa870` (fetched 2026-09-29 11:02 UTC); the exception is a security fix for a matrix target, cherry-picked by a register row.
**Source:** #344, body checkbox 18.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Freeze decision and exception are recorded as D-WORKFLOW-111; this review does not merge upstream.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-344-19: A cold `GENERIC_X64` build exits `0` with `DISTRONAME` set and `DISTRO=ROCKNIX` retained (or the split's completed build-and-boot log, if P0 supplied a reason); the build log is archived with the manifest; the concurrency setting is recorded.
**Source:** #344, body checkbox 19.

**Verdict:** FAIL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** A cold branded candidate and its brand/negative-control receipts have not been delivered. Run101 is ROCKNIX-named; no final identity change exists in either inspected branch.

### AC-344-20: The brand sweep reports zero unclassified hits against `NAMING.md` allowlist vN (N recorded); an injected old-logo frame fails the template match (threshold and bounding box recorded).
**Source:** #344, body checkbox 20.

**Verdict:** FAIL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** A cold branded candidate and its brand/negative-control receipts have not been delivered. Run101 is ROCKNIX-named; no final identity change exists in either inspected branch.

### AC-344-21: The localisation reconciliation lists every touched `.po` and `.xml` entry, with no orphan.
**Source:** #344, body checkbox 21.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-22: The secret sweep reports counts only, all zero.
**Source:** #344, body checkbox 22.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-23: `tools/vm-qa` reads PASS bound to a candidate-store hash equal to the manifest hash, before and after the run.
**Source:** #344, body checkbox 23.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-24: The upstream base commit is unchanged since P1.
**Source:** #344, body checkbox 24.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-25: The RC2 guest's early signal is recorded (offered or not offered; the comparison result).
**Source:** #344, body checkbox 25.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-26: A draft release exists with only the X64 asset.
**Source:** #344, body checkbox 26.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-27: The device image is built; the manifest's input block (distribution, ES and splash commits, container digest, source index) is diff-empty against P2's; the per-image `BUILD_ID` and hash are in the manifest and the candidate store.
**Source:** #344, body checkbox 27.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-28: Branch A: `docs/releases/device-facts.md` carries the migration device's row, and its device log shows discover, download, verify, install and boot unaided, with the PASS line "RC2 device, given the fork channel offering 0.0.1, is offered it and applies it"; every row of the base plan's §2.2 table has a result; the version-ordering table is written; the truncated-download, mid-install-interrupt and failed-first-boot cases each end bootable with post-upgrade hashes equal to the pre-upgrade ones.
**Source:** #344, body checkbox 28.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Branch A was rejected; Branch B/manual adoption is accepted by D-WORKFLOW-093 and p0-updater.md.

### AC-344-29: Branch B: `docs/releases/device-facts.md` carries the migration device's row showing the seven-step procedure completed; the fork-aware updater prints "manual update required"; a network capture shows no request to the upstream host; post-upgrade hashes equal the pre-upgrade ones; the fork-to-fork proof is written as the `0.0.2` gate.
**Source:** #344, body checkbox 29.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-30: Every matrix target is built from P2's input set; the requalification check is diff-empty, or the X64 re-run is recorded.
**Source:** #344, body checkbox 30.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-31: Each asset's hash equals its manifest entry; each attached asset is under the recorded per-asset limit.
**Source:** #344, body checkbox 31.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-32: The brand, secret, leak and localisation sweeps are re-run on every image with P2's PASS conditions.
**Source:** #344, body checkbox 32.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-33: The per-SoC boot-artifact matrix is filled (upgrade against clean flash; downgrade safety); any target with a boot-chain delta has its device-facts smoke-test row before attachment.
**Source:** #344, body checkbox 33.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-34: The component inventory file has a disposition per item; the corresponding-source bundle is retrievable and hash-verified.
**Source:** #344, body checkbox 34.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-35: The channel-separation demonstration is recorded: a draft, pre-release or CI candidate is not offered on the stable channel.
**Source:** #344, body checkbox 35.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-36: Attachment follows the rule: Branch A attaches only smoke-tested targets and lists the others as "built, held"; Branch B follows the answer to question 5.
**Source:** #344, body checkbox 36.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-37: The release notes carry the support matrix with per-device verification status, adoption instructions, the trust assumption, recovery, source links, lineage and non-endorsement (not "marks retained"), the cloud compatibility exception, and the redirect dependency.
**Source:** #344, body checkbox 37.

**Verdict:** UNTESTABLE

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Dependent release qualification: no frozen combined RASTERATOPS 0.0.1 image/manifest exists. Do not treat tests on run101 as tests of that image. Build/source/publication work is already #337/#344 scope.

### AC-344-38: The publication yes is recorded in the action log; otherwise the state reads "stopped at immutable candidate".
**Source:** #344, body checkbox 38.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-344-39: Each #341 relaxation the release needs lands with a bidirectional test: the newly permitted pattern passes and the secret and PII fixtures are still blocked.
**Source:** #344, body checkbox 39.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-40: The first merge-cadence run records divergence, patch-refresh and ES conflict numbers.
**Source:** #344, body checkbox 40.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-41: The hosted-QA experiment log records N=10 boot and flow runs, the failure count and the transfer cost, with no timing claims.
**Source:** #344, body checkbox 41.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-42: Redirect-sunset tracking records the fielded devices that have completed one fork-to-fork update.
**Source:** #344, body checkbox 42.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-43: A QA-frame retention policy is written, and a one-sided regression limit for any timing gate.
**Source:** #344, body checkbox 43.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-44: The feasibility proof on `GENERIC_X64` covers display ownership, compositing, focus, controller ownership and lifecycle when either process exits; any command interface is bound to localhost with the address recorded.
**Source:** #344, body checkbox 44.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-45: A background Tier 1 report covers the files Step 0 did not touch; the launch-slice review follows the spike.
**Source:** #344, body checkbox 45.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-46: The bidirectional RetroArch → runner → RetroArch interchange test (saves, states, auto-slot, pending achievements, queue location) passes before #336 Step 1.
**Source:** #344, body checkbox 46.

**Verdict:** SKIP

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Explicit P5/P6 post-0.0.1/background work; D-WORKFLOW-102 places progressive whole-codebase analysis under #346 for 0.0.2. Not an added 0.0.1 blocker.

### AC-344-47: Each row above the owner approves is in `docs/decision-register.md` with its ID, and `tools/register-check` passes.
**Source:** #344, body checkbox 47.

**Verdict:** PASS

**Evidence:** docs/rasteratops/p0-read.md, p0-updater.md and support-matrix.md; distributions/ROCKNIX/options:17 and version:5; Makefile:129–130; .github/workflows/validate-pull-request.yml:3–19; tools/fork-publish-release:19–38; D-WORKFLOW-093/102/111/113/120/123/126.

**Notes / gaps:** Register has the adopted rows and register-check freshly exits 0: 578 IDs. P1 owner questions are not reopened where later decisions settle them.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-337-01: The register row that calls the direction (D-WORKFLOW-081's answer) names the fork's name and the licence terms it keeps (GPL-2 and MIT kept whole; the CC BY-SA attribution line; no ROCKNIX images).
**Source:** #337, body checkbox 1.

**Verdict:** PASS

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** D-WORKFLOW-084 and the retained licence records establish Rasteratops; historical pixelelated wording is superseded.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-337-02: A GENERIC_X64 image boots under the new name with its own splash and logo, `OS_NAME` and the updater's URL read from `/etc/os-release` and the updater's script on guest d (a frame and the two lines filed here).
**Source:** #337, body checkbox 2.

**Verdict:** FAIL

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** Inspected implementation still builds ROCKNIX/date-versioned assets using the old splash; wordmark, new OS identity and migration suffix are remaining #337 implementation.

### AC-337-03: The site builds from the fork's pages under the domain, with the attribution on its front page (the build log's last line filed here).
**Source:** #337, body checkbox 3.

**Verdict:** SKIP

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** A new site is excluded from 0.0.1 by #344 and D-WORKFLOW-098; existing public documentation must still be accurate.

### AC-337-04: A fresh guest on the candidate, signed in to the QA cloud, creates and uses `/Rasteratops/{Saves,Backups,Content}`: `tools/cloud-test-backend ls` after a backup and a saves sync shows the three folders and nothing under `/ROCKNIX`; `grep -rn ROCKNIX projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf*` prints nothing; `tools/vocabulary-check` passes.
**Source:** #337, body checkbox 4.

**Verdict:** PARTIAL

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-337-05: Every `/ROCKNIX` cloud path in the interface and the scripts is listed by the sweep (`docs/rasteratops/p0-sweep-hits.txt`, rule `cloud-path`, 56 lines) and each is changed or marked history in the same commit; the sweep re-run on the candidate's tree lists none as current.
**Source:** #337, body checkbox 5.

**Verdict:** PARTIAL

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-337-06: `DISTRONAME="RASTERATOPS"`: `os-release` reads `OS_NAME="RASTERATOPS"`, the images are `RASTERATOPS-<board>.<arch>-0.0.1.*`, the info page reads `OPERATING SYSTEM: RASTERATOPS` (a 640x480 frame from guest d; `/etc/os-release` from the image's SYSTEM); repositories, packages and hosts stay lowercase `rasteratops`; the cloud folder is `/Rasteratops` (D-CLOUD-158).
**Source:** #337, body checkbox 6.

**Verdict:** FAIL

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** Inspected implementation still builds ROCKNIX/date-versioned assets using the old splash; wordmark, new OS identity and migration suffix are remaining #337 implementation.

### AC-337-07: The migration tar carries the suffix `-from-ROCKNIX` (`IMAGE_SUFFIX`), so its name passes the RC2 init's check (`init:882`): the built name is `RASTERATOPS-H700.aarch64-0.0.1-from-ROCKNIX.tar` and `tools/vm-upgrade-rehearsal` from RC2's image applies it; the suffix is dropped in the build after 0.0.1 (D-WORKFLOW-128).
**Source:** #337, body checkbox 7.

**Verdict:** FAIL

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** Inspected implementation still builds ROCKNIX/date-versioned assets using the old splash; wordmark, new OS identity and migration suffix are remaining #337 implementation.

### AC-337-08: The splash and the theme's logo carry the word mark alone until the icon arrives (D-WORKFLOW-130): the splash frame at boot and the theme's logo frame on guest d show the name in the chosen face and no pictorial mark.
**Source:** #337, body checkbox 8.

**Verdict:** FAIL

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** Inspected implementation still builds ROCKNIX/date-versioned assets using the old splash; wordmark, new OS identity and migration suffix are remaining #337 implementation.

### AC-337-09: The release notes and the site's ssh page say the ssh password is unchanged in 0.0.1 (D-WORKFLOW-129, #358): the notes file's line and the docs PR.
**Source:** #337, body checkbox 9.

**Verdict:** PARTIAL

**Evidence:** distributions/ROCKNIX/options:17; version:5; rocknix-update:10; splash/package.mk:5–9. Identity branch c4a4cd188c still has these old values. D-WORKFLOW-123/127–130; archive-identity-probe.log.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-354-01: The mixed-installation test (`tools/cloud-pair-migration` on `tools/vm-pair`): guest a updated in place from RC2's image with a `/ROCKNIX` cloud, guest b a fresh install on the same QA cloud; at the end both confs read `/Rasteratops/{Saves,Backups,Content}`, a save written on each arrives on the other, nothing was removed from `/ROCKNIX` before its verified copy, a guest that missed its step and wrote into the earlier folder is merged by MOVE (D-CLOUD-168), and the log names each step: its PASS lines, and its negative control on a build without the join (D-CLOUD-169) failing.
**Source:** #354, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** run101 report.md and rehearsal.log; current pair rerun 42/0 at qa-b2378d9c33-pair-migration-from-69e6039f8f-20261002-0606; state table and saved E frame.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-354-02: The rehearsal (`tools/vm-upgrade-rehearsal`) from RC2's x64 image keeps every piece of state across the update (its PASS), and a stock-shaped conf carried across (`/GAMES`, nothing in the cloud) meets the cloud folder step at the boot after rather than a dialog from the startup sync: the startup stamp's `78 no-folder` and the step's CREATE IT offer in 640x480 frames (guest d's epic proof, case E; D-CLOUD-166, D-CLOUD-170).
**Source:** #354, body checkbox 2.

**Verdict:** PARTIAL

**Evidence:** run101 report.md and rehearsal.log; current pair rerun 42/0 at qa-b2378d9c33-pair-migration-from-69e6039f8f-20261002-0606; state table and saved E frame.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-354-03: `tools/vm-qa` on the candidate passes every suite, `frame-diff` against the accepted baseline explains every changed frame by one of the children, `tools/vocabulary-check` and `tools/es-menu-map-check` pass.
**Source:** #354, body checkbox 3.

**Verdict:** FAIL

**Evidence:** run101 report.md and rehearsal.log; current pair rerun 42/0 at qa-b2378d9c33-pair-migration-from-69e6039f8f-20261002-0606; state table and saved E frame.

**Notes / gaps:** Run101 vm-qa is 14/15, round-trip fails. Current pair rerun is green but does not close this suite or qualify a branded candidate.

### AC-354-04: Every string the five children add is approved by the maintainer before the build and lands with its French (D-UI-051); `docs/cloud-sync-changelog.md` carries the changes the day they land (`change-log.md`); the site's cloud-sync page names `/Rasteratops` (`documentation-accuracy.md`, with #42).
**Source:** #354, body checkbox 4.

**Verdict:** PARTIAL

**Evidence:** run101 report.md and rehearsal.log; current pair rerun 42/0 at qa-b2378d9c33-pair-migration-from-69e6039f8f-20261002-0606; state table and saved E frame.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-349-01: On the transfer page, the SETTINGS restore row's line under the label names the device the archive to be restored came from, read from the label in its file name (`backuptool` prints it; the interface reads it): a 640x480 frame from a `tools/vm-walks` walk shows `FROM <device label>, <date>`.
**Source:** #349, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:203–227; cloud_restore:2125; backuptool:157–167; ES GuiMenu.cpp:4848–4861; D-CLOUD-162/164; saved proof case C has frames, no check calls.

**Notes / gaps:** D-CLOUD-164 approved DEVICE, DATE without FROM; do not re-ask that choice. Locale date in saved frame differs from the example. More seriously, OS_NAME-based matcher loses legacy archives after rebranding (F-01).

### AC-349-02: `docs/es-menu-map.md` carries the SETTINGS row's two states, offered with the device and date or dimmed with `NO SETTINGS BACKUP FROM THIS DEVICE YET` (D-UI-039, D-CLOUD-162), and `tools/es-menu-map-check` passes in `tools/vm-qa`'s `menumap` suite. *(Rewritten 2026-10-01: the choice page it named is superseded.)*
**Source:** #349, body checkbox 2.

**Verdict:** PASS

**Evidence:** cloud_scan:203–227; cloud_restore:2125; backuptool:157–167; ES GuiMenu.cpp:4848–4861; D-CLOUD-162/164; saved proof case C has frames, no check calls.

**Notes / gaps:** Menu map includes offered/dimmed states; current es-menu-map-check exits 0: 52 screens, 0 missing. Refutation: searched for missing mapped screens and check reports none.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-349-03: The public page for cloud sync says the SETTINGS row restores this device's own newest backup and is dimmed when the cloud has none from it (docs follow-up with #42, `documentation-accuracy.md`). *(Rewritten 2026-10-01: a restore from another device is not offered.)*
**Source:** #349, body checkbox 3.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:203–227; cloud_restore:2125; backuptool:157–167; ES GuiMenu.cpp:4848–4861; D-CLOUD-162/164; saved proof case C has frames, no check calls.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-349-04: After the scan page (#350), the SETTINGS restore row is offered only when the cloud's Backups folder holds an archive whose label equals this device's `cloud_device_id --label`; with the QA cloud seeded with a foreign label only, guest d's 640x480 frame shows the row dimmed with its reason, and with its own label seeded the row is offered with `FROM <label>, <date>` under it.
**Source:** #349, body checkbox 4.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:203–227; cloud_restore:2125; backuptool:157–167; ES GuiMenu.cpp:4848–4861; D-CLOUD-162/164; saved proof case C has frames, no check calls.

**Notes / gaps:** D-CLOUD-164 approved DEVICE, DATE without FROM; do not re-ask that choice. Locale date in saved frame differs from the example. More seriously, OS_NAME-based matcher loses legacy archives after rebranding (F-01).

### AC-349-05: A restore never takes another device's archive by default: `backuptool` restores the newest archive of this device's label, and its journal line names the label it chose; the foreign-label case on guest d leaves `system.hostname` unchanged.
**Source:** #349, body checkbox 5.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:203–227; cloud_restore:2125; backuptool:157–167; ES GuiMenu.cpp:4848–4861; D-CLOUD-162/164; saved proof case C has frames, no check calls.

**Notes / gaps:** Cloud system-only path selects device label; local backuptool deliberately retains any-device newest behavior. Scope/body must distinguish them. F-01 requires legacy-name compatibility on the final image.

### AC-349-06: The scan page's line reads, while it runs, the words approved for #350 (proposed: `CHECKING WHAT SETTINGS AND CONTENT YOUR CLOUD HAS FOR THIS DEVICE...`), and the outcome vocabulary when it ends (`es-player-text.md`); frames from the walk show both.
**Source:** #349, body checkbox 6.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:203–227; cloud_restore:2125; backuptool:157–167; ES GuiMenu.cpp:4848–4861; D-CLOUD-162/164; saved proof case C has frames, no check calls.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-350-01: Pressing CONTINUE on RESTORE FROM CLOUD opens a page of its own, titled for the comparison, with the live line and CANCEL as the one way out while it runs (D-UI-078); the options page follows when the listing is in. A `tools/vm-walks` frame sequence shows dialog, page, options, and no frame with a card drawn over a dialog.
**Source:** #350, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:153–247; ES GuiMenu.cpp:5400–5433; D-CLOUD-167; vocabulary-check and es-menu-map-check logs.

**Notes / gaps:** D-CLOUD-167 makes scan run on opening, before options; detailed content comparison remains after class selection. Original CONTINUE/full-scan wording is stale, not evidence that the approved flow should be reversed.

### AC-350-02: When the comparison fails (the cloud unreachable: the dead port of `tools/cloud-test-backend`), the page says why in the outcome vocabulary (`COULDN'T FINISH - …`, `es-player-text.md`) and offers TRY AGAIN beside CLOSE; a frame shows it.
**Source:** #350, body checkbox 2.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:153–247; ES GuiMenu.cpp:5400–5433; D-CLOUD-167; vocabulary-check and es-menu-map-check logs.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-350-03: `docs/es-menu-map.md` carries the page (D-UI-039); `tools/es-menu-map-check` passes.
**Source:** #350, body checkbox 3.

**Verdict:** PASS

**Evidence:** cloud_scan:153–247; ES GuiMenu.cpp:5400–5433; D-CLOUD-167; vocabulary-check and es-menu-map-check logs.

**Notes / gaps:** Menu map mechanically covers the scan page: current check exits 0, 0 missing. Searched live ES route and map; both present.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-350-04: The interface edit passes `tools/es-syntax-check` before the pin moves, and `docs/cloud-sync-changelog.md` carries the change the day it lands.
**Source:** #350, body checkbox 4.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:153–247; ES GuiMenu.cpp:5400–5433; D-CLOUD-167; vocabulary-check and es-menu-map-check logs.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-350-05: The scan page runs `cloud_setup --content-location`, the settings-archive listing by label and `cloud_content_restore --scan` before the options page opens; the options page on guest d lists only rows the scan found (a frame per seeded case: settings for this label, settings for a foreign label only, content under `/ROCKNIX/Content`, content nowhere).
**Source:** #350, body checkbox 5.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:153–247; ES GuiMenu.cpp:5400–5433; D-CLOUD-167; vocabulary-check and es-menu-map-check logs.

**Notes / gaps:** D-CLOUD-167 makes scan run on opening, before options; detailed content comparison remains after class selection. Original CONTINUE/full-scan wording is stale, not evidence that the approved flow should be reversed.

### AC-350-06: Its live line says what it is checking in the words approved for it (proposed: `CHECKING WHAT SETTINGS AND CONTENT YOUR CLOUD HAS FOR THIS DEVICE...`); the string and its French land in the same commit (D-UI-051).
**Source:** #350, body checkbox 6.

**Verdict:** PARTIAL

**Evidence:** cloud_scan:153–247; ES GuiMenu.cpp:5400–5433; D-CLOUD-167; vocabulary-check and es-menu-map-check logs.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-351-01: 1: the Close control sits at the bottom of the page, below the note, with at least 2rem of space above it, and a tap asks a confirmation (the safe answer first) before Escape is sent; a 390 px headless-Firefox render shows the placement, and the page's load test (the harness from #330) passes.
**Source:** #351, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** cloud_oauth:646–655,1016; cloud-signin-window.c:430–439; projects/ROCKNIX/filesystem/etc/machine-info; historical frames docs/qa-frames/2026-10-01/351.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-351-02: 2: the state line has at least `.75rem` above and below it in both states (`Checking…`, `Connected.`); the two 390 px renders show it.
**Source:** #351, body checkbox 2.

**Verdict:** PARTIAL

**Evidence:** cloud_oauth:646–655,1016; cloud-signin-window.c:430–439; projects/ROCKNIX/filesystem/etc/machine-info; historical frames docs/qa-frames/2026-10-01/351.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-351-03: 3: every image ships `/etc/machine-info` with `CHASSIS=handset` (D-NET-016; `feature/cloud-epic` 98e1a30362) and the sign-in window sends WebKit's Mobile user agent: on guest d a page that echoes `navigator.userAgent` through the window reads `... Mobile Safari/605.1.15`, and frames of Dropbox's sign-in and trust pages from the window before and after show the touch layout; re-read on the next staging as a frame from the window at the panel's size.
**Source:** #351, body checkbox 3.

**Verdict:** PARTIAL

**Evidence:** cloud_oauth:646–655,1016; cloud-signin-window.c:430–439; projects/ROCKNIX/filesystem/etc/machine-info; historical frames docs/qa-frames/2026-10-01/351.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-351-04: 4: the finishing page carries the shared `STYLE` (the card, the `h1`, the note), reads as a success, and says what happens next; a frame from guest d's window shows it.
**Source:** #351, body checkbox 4.

**Verdict:** PARTIAL

**Evidence:** cloud_oauth:646–655,1016; cloud-signin-window.c:430–439; projects/ROCKNIX/filesystem/etc/machine-info; historical frames docs/qa-frames/2026-10-01/351.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-351-05: Every string added has its French in the same commit where it is an interface string (D-UI-051), and `tools/vocabulary-check` passes on the scripts.
**Source:** #351, body checkbox 5.

**Verdict:** PARTIAL

**Evidence:** cloud_oauth:646–655,1016; cloud-signin-window.c:430–439; projects/ROCKNIX/filesystem/etc/machine-info; historical frames docs/qa-frames/2026-10-01/351.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-352-01: `cloud_content_restore --scan` lists a pre-tier folder only when this device has a folder of that name under `/storage/roms` or the name is a supported system (`legacy_dirs` / `supported_systems`), the same rule `resolve_src` applies; a `tools/cloud-round-trip` case seeds `Photos/` and `Documents/` at the root and the scan's output carries neither line.
**Source:** #352, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** cloud_content_restore:1299–1308; ES GuiMenu.cpp:5206–5279; cloud_setup --content-location; saved proof F/G frame-only coverage; D-CLOUD-156/167.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-352-02: When the content root holds no `ROMs/` and no known system folder, the page says so instead of listing: `YOUR CLOUD HAS NO ROMS OR BIOS FOLDER AT <folder>. CHOOSE THE FOLDER WHERE YOUR CONTENT IS.` (words to the maintainer for approval, `player-language.md`), with a row that opens the folder chooser; a 640x480 frame shows it.
**Source:** #352, body checkbox 2.

**Verdict:** PARTIAL

**Evidence:** cloud_content_restore:1299–1308; ES GuiMenu.cpp:5206–5279; cloud_setup --content-location; saved proof F/G frame-only coverage; D-CLOUD-156/167.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-352-03: A CHOOSE CLOUD FOLDER page (the `GuiFileBrowser` pattern fed by `rclone lsf`, `es-native-ui.md` § Reusable precedents) sets `CONTENT_REMOTE` through `cloud_setup`, and the transfer page re-reads it; the walk's frames show the chosen folder and the journal shows the `Content path` line.
**Source:** #352, body checkbox 3.

**Verdict:** PARTIAL

**Evidence:** cloud_content_restore:1299–1308; ES GuiMenu.cpp:5206–5279; cloud_setup --content-location; saved proof F/G frame-only coverage; D-CLOUD-156/167.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-352-04: With `CONTENT_REMOTE` back at `/ROCKNIX/Content` and the QA cloud seeded with `Photos/` and `Documents/` at its root, CONTENT TO RESTORE on guest d lists only ROM systems and BIOS: the walk's 640x480 frame and the scan's output lines. (The Nova's own listing is re-read on its next staging, as a read, and noted here in a comment.)
**Source:** #352, body checkbox 4.

**Verdict:** PARTIAL

**Evidence:** cloud_content_restore:1299–1308; ES GuiMenu.cpp:5206–5279; cloud_setup --content-location; saved proof F/G frame-only coverage; D-CLOUD-156/167.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-352-05: `docs/es-menu-map.md` carries the chooser (D-UI-039); `tools/es-menu-map-check` and `tools/vocabulary-check` pass; the cloud-sync page on the site says where the content folder is chosen (`documentation-accuracy.md`).
**Source:** #352, body checkbox 5.

**Verdict:** PARTIAL

**Evidence:** cloud_content_restore:1299–1308; ES GuiMenu.cpp:5206–5279; cloud_setup --content-location; saved proof F/G frame-only coverage; D-CLOUD-156/167.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-352-06: When the configured content root holds no `ROMs/` and no known system folder, the scan looks under the cloud root's `/ROCKNIX/Content` (the saves root's parent, `cloud_setup:629-631`) and, finding `ROMs/` or `BIOS/` there, offers that folder first (`YOUR CONTENT IS IN /ROCKNIX/Content. USE IT?` -- words for approval) and writes `CONTENT_REMOTE` on yes; on guest d with `CONTENT_REMOTE=""` and content seeded under `/ROCKNIX/Content`, the frame shows the offer and the journal shows the `Content path` line after it.
**Source:** #352, body checkbox 6.

**Verdict:** PARTIAL

**Evidence:** cloud_content_restore:1299–1308; ES GuiMenu.cpp:5206–5279; cloud_setup --content-location; saved proof F/G frame-only coverage; D-CLOUD-156/167.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-352-07: Only then, with nothing found under either, the chooser opens; a frame shows it with the QA cloud's root folders listed as folders to pick from, never as systems.
**Source:** #352, body checkbox 7.

**Verdict:** PARTIAL

**Evidence:** cloud_content_restore:1299–1308; ES GuiMenu.cpp:5206–5279; cloud_setup --content-location; saved proof F/G frame-only coverage; D-CLOUD-156/167.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-353-01: A carried upstream `/GAMES` (a value no player typed) counts as no folder (D-CLOUD-161). At the end of cloud setup the seeding points it at `/Rasteratops` and makes the three folders without asking (D-CLOUD-169: `tools/last-good-scripts-test`'s `--settle` lines); at boot the cloud folder step offers CREATE IT / CHOOSE A FOLDER / NOT NOW (D-CLOUD-170: guest d's epic proof, case E's frame), and so does a transfer page's scan, where CREATE IT writes the three `/Rasteratops` paths (case B: the conf's three lines and `tools/cloud-test-backend ls`); with a `/GAMES` that holds files the dialog is the move naming `/GAMES` (case B0's frame).
**Source:** #353, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-353-02: An earlier `/ROCKNIX` folder gets one dialog, MOVE first (D-CLOUD-160): MOVE copies, verifies and deletes (the move page's frames on guest d; `tools/cloud-test-backend ls` shows `/Rasteratops` whole and no `/ROCKNIX`; a kill during the copy leaves `/ROCKNIX` intact and a second MOVE completes it); another device on `/ROCKNIX` is re-pointed at its next cloud folder step or transfer-page scan with no dialog (`tools/cloud-pair-migration` step 5's journal line, D-CLOUD-170), one that wrote there first is merged by its MOVE (step 5m, D-CLOUD-168); KEEP USING leaves a device on `/ROCKNIX` for good; NOT NOW asks again at the next boot and the next transfer page.
**Source:** #353, body checkbox 2.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-353-03: The folder is settled by the cloud folder step, at the end of cloud setup and at boot (D-CLOUD-170, #363), never by a sync: with the folder absent the startup and exit syncs end in the card's `SKIPPED - YOUR CLOUD FOLDER ISN'T SET UP YET` pointing at MANAGE CLOUD STORAGE (the startup stamp's `78 no-folder`, D-CLOUD-166), and 640x480 frames show the step at the end of setup (guest d's epic proof, case L) and at boot (cases E and I).
**Source:** #353, body checkbox 3.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-353-04: The offer carries a third choice to pick a different folder (the folder chooser of #352), and its text has no icon or glyph drawn between its two sentences: a 640x480 frame from guest d and, when it is next staged, one from the device.
**Source:** #353, body checkbox 4.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-353-05: The words the offer uses are approved by the maintainer before the build (`player-language.md`): proposed `YOUR CLOUD HAS NO /ROCKNIX/Saves FOLDER YET.` / `CREATE IT`, `CHOOSE A FOLDER`, `NOT NOW`; their French lands in the same commit (D-UI-051).
**Source:** #353, body checkbox 5.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-353-06: The default folder's name (`/ROCKNIX` today, D-WORKFLOW-101; `/Rasteratops` proposed) is a register row on the maintainer's word, with D-WORKFLOW-101's mixed-installation test run before any default changes.
**Source:** #353, body checkbox 6.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-353-07: The move carries `Saves-replaced` (the set-aside of conflict losers beside the saves folder) to `/Rasteratops/Saves-replaced` by the same copy, verify, delete, and nothing of ours remains under the old name afterwards: a `tools/last-good-scripts-test` case seeds a set-aside copy under the old layout and reads it back under the new one with the old folder gone; the round trip on the VM shows the sync's next set-aside landing under `/Rasteratops`.
**Source:** #353, body checkbox 7.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-356-01: `cloud_migrate_layout` runs numbered steps from the marker's version to the build's, each with the move dialog, each copy-verify-delete, each a journal line naming the step; a `tools/cloud-round-trip` case seeds layout 1 and ends at layout 2 with the marker written and nothing lost (hash list before and after).
**Source:** #356, body checkbox 1.

**Verdict:** FAIL

**Evidence:** cloud_migrate_layout:70,896–908,799–825; no numbered dispatch in main:910–1000; rg --files docs/rasteratops and direct read find no cloud-layout.md; issue #356 remains open.

**Notes / gaps:** Marker support is implemented; an ordered version ladder and the promised cloud-layout.md are not. Search trail recorded in evidence/source-review.md. Keep existing #356 open; no duplicate punch item.

### AC-356-02: A second guest on the same cloud takes the new marker at its next check with no dialog (its journal line), and a guest on an older build with a newer marker reads its saves and shows the card's outcome words rather than writing the old layout (a frame).
**Source:** #356, body checkbox 2.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:70,896–908,799–825; no numbered dispatch in main:910–1000; rg --files docs/rasteratops and direct read find no cloud-layout.md; issue #356 remains open.

**Notes / gaps:** New-build pair follow passes; RC2 has no marker-aware path. An old image cannot be retroactively taught this. Reconcile criterion with accepted fleet staging order; do not label it passed.

### AC-356-03: The step for `/GAMES` and `/ROCKNIX` is step 1 and is the one #353 ships; the design note lives in `docs/rasteratops/cloud-layout.md`.
**Source:** #356, body checkbox 3.

**Verdict:** FAIL

**Evidence:** cloud_migrate_layout:70,896–908,799–825; no numbered dispatch in main:910–1000; rg --files docs/rasteratops and direct read find no cloud-layout.md; issue #356 remains open.

**Notes / gaps:** Marker support is implemented; an ordered version ladder and the promised cloud-layout.md are not. Search trail recorded in evidence/source-review.md. Keep existing #356 open; no duplicate punch item.

### AC-363-01: (Ticked on run 100; re-opened 2026-10-02: on run 101 `cloud_backup` lines 832-833 call `cloud_migrate_layout --superseded`, and D-CLOUD-172's listing of the saves folder runs before a backup on an earlier default -- #365's table decides it.) No sync checks the cloud folder: `cloud_backup` and `cloud_restore` carry no call to `cloud_migrate_layout` (`tools/last-good-scripts-test`, its two "runs no folder check before its sync" lines).
**Source:** #363, body checkbox 1.

**Verdict:** FAIL

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Respectively: backup still probes legacy root; 59 ms exceeds 30 ms; saved E frame and worker/card trace contradict after-card ordering. Earlier ticks do not override evidence.

### AC-363-02: (Ticked on run 100 at 16 ms; re-opened 2026-10-02: run 101 reads 325 against 266 ms, 59 ms apart, D-CLOUD-172's listing -- #364, #365.) An exit sync for a guest whose conf still names `/ROCKNIX` costs what one on the current folder costs (the follow benchmark on guest d, five of each, medians within 30 ms).
**Source:** #363, body checkbox 2.

**Verdict:** FAIL

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Respectively: backup still probes legacy root; 59 ms exceeds 30 ms; saved E frame and worker/card trace contradict after-card ordering. Earlier ticks do not override evidence.

### AC-363-03: `cloud_migrate_layout --needs-step` answers with no network: 0 for an earlier default, not kept, with a remote set up; 1 for the current folder, a folder of the player's own, a kept one, or no remote; 2 for a conf it cannot read; rclone never starts (`tools/last-good-scripts-test` section aa, its `--needs-step` lines).
**Source:** #363, body checkbox 3.

**Verdict:** PASS

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Production source traced; full host suite freshly PASSED (1365 PASS, 0 FAIL, 0 SKIP), including sections aa/ab. Cases cover error and negative states as well as happy paths; historical negative runs are separately recorded, not rerun here.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-363-04: `cloud_scan --folder` is the folder item alone -- the join, the state, the quiet follow -- with no archive or root listing, the opening scan's files left as they were, and a refused join ending with its why and no state (section ab, its `--folder` lines).
**Source:** #363, body checkbox 4.

**Verdict:** PASS

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Production source traced; full host suite freshly PASSED (1365 PASS, 0 FAIL, 0 SKIP), including sections aa/ab. Cases cover error and negative states as well as happy paths; historical negative runs are separately recorded, not rerun here.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-363-05: The transfer pages' scan still checks on every open (`tools/last-good-scripts-test` section ab).
**Source:** #363, body checkbox 5.

**Verdict:** PASS

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Production source traced; full host suite freshly PASSED (1365 PASS, 0 FAIL, 0 SKIP), including sections aa/ab. Cases cover error and negative states as well as happy paths; historical negative runs are separately recorded, not rerun here.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-363-06: At the end of cloud setup, for a fresh install whose cloud holds its saves under an earlier folder, the step reads the move before the seeding (`tools/cloud-pair-migration` step 2's lines), and the frames show CHECKING YOUR CLOUD, the MOVE question, then CLOUD SETUP COMPLETE after the answer (`tools/vm-visual-qa` frames at 640x480).
**Source:** #363, body checkbox 6.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-363-07: At boot, for a guest whose conf names an earlier folder it has not kept, with a remote set up, the step comes up after the startup sync's card: CHECKING YOUR CLOUD, then the question; NOT NOW brings it back at the next boot; after MOVE the next boot raises nothing and the journal reads `nothing to settle` (frames at 640x480 and the journal, guest d).
**Source:** #363, body checkbox 7.

**Verdict:** FAIL

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Respectively: backup still probes legacy root; 59 ms exceeds 30 ms; saved E frame and worker/card trace contradict after-card ordering. Earlier ticks do not override evidence.

### AC-363-08: Offline at boot (the guest's link cut on the QEMU monitor), the step asks `FINISH CLOUD SETUP` / `YOU'RE NOT ONLINE. CONNECT TO FINISH SETTING UP YOUR CLOUD FOLDER.` with CONNECT TO WI-FI and NOT NOW (a frame at 640x480).
**Source:** #363, body checkbox 8.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-363-09: With a settings restore's marker and an earlier folder both set at boot (written on guest d, a named stand-in for a restore followed by an update), FINISH RESTORE PROCESS comes first with nothing over it; its FINISH brings the step once the screen is free; its LATER brings neither until the next boot (frames at 640x480).
**Source:** #363, body checkbox 9.

**Verdict:** PARTIAL

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-363-10: `tools/cloud-pair-migration` covers both later cases: the other guest's step follows after the move (step 5), and a guest that missed its step and backed up into the earlier folder has those saves merged by MOVE with nothing left behind (step 5m) -- its PASS lines.
**Source:** #363, body checkbox 10.

**Verdict:** PASS

**Evidence:** cloud_migrate_layout:1277–1284; cloud_scan:153–185; cloud_backup:1674–1687; ES GuiMenu.cpp:5545–5603 and ThreadedCloudSync.cpp:719–735; host suite log; pair 42/0; saved E frame.

**Notes / gaps:** Corrected current pair tool freshly passes 42/0 on RC2/run101; 5m now proves absent-old-root refusal/follow and 5n proves old-writer merge. Input old/new BUILD_IDs differ in raw log; both confs and copied hashes checked.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-364-01: A backup on a carried `/GAMES` the cloud does not hold makes no `/GAMES`, sends nothing, prints `>>> offer create-saves-folder|/GAMES` and ends 0, on a deliberate run and on the exit sync's `--automatic --recent` run. A `/GAMES` the cloud holds is backed up as before, and an absent current folder is still made (`tools/last-good-scripts-test` section ad, its four PASS lines; against the previous commit the first two FAIL).
**Source:** #364, body checkbox 1.

**Verdict:** PASS

**Evidence:** cloud_backup:1674–1687; host section ad four cases; run101 E log/frame; follow-bench-100/bench.log identifies run101, 325 versus 266 ms.

**Notes / gaps:** Whole-script host section ad freshly passes all four cases; absent legacy guard, recent path, present legacy and absent current controls. The predicate error case F-02 is outside those four fixtures and is not covered by this pass.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-364-02: At a boot on a stock-shaped conf with nothing in the cloud, the startup card reads SKIPPED with `78 no-folder`, the QA cloud holds no `/GAMES` afterwards, and the cloud folder step offers CREATE IT (guest d's epic proof, case E: its PASS lines and `tools/cloud-test-backend ls`).
**Source:** #364, body checkbox 2.

**Verdict:** PARTIAL

**Evidence:** cloud_backup:1674–1687; host section ad four cases; run101 E log/frame; follow-bench-100/bench.log identifies run101, 325 versus 266 ms.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-364-03: The cost the listing adds to an exit sync on an earlier folder (59 ms on run 101's follow benchmark, against 16 ms on run 100) is kept with its reason or removed, decided against #365's folder table (D-WORKFLOW-134).
**Source:** #364, body checkbox 3.

**Verdict:** PARTIAL

**Evidence:** cloud_backup:1674–1687; host section ad four cases; run101 E log/frame; follow-bench-100/bench.log identifies run101, 325 versus 266 ms.

**Notes / gaps:** Cost is recorded, but no retain/remove disposition yet; #365 table now supports making that choice. Existing gate stays red.

### AC-365-01: `docs/` carries the cloud folder's state table: each combination of conf state and cloud state, with what each actor does and the code line that does it. A walk of the table against the scripts lists no cell where two actors disagree, or names each disagreement as a decision.
**Source:** #365, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** docs/rasteratops/cloud-folder-state-table.md; docs/retros/2026-10-02-cloud-runs-95-101.md; tools/last-good-scripts-test:13274–13490; /workspace/tmp/rocknix-session/epic-proof-101.sh (case C/F/G have no checks).

**Notes / gaps:** State table now exists with seven actors, T01–T19, lines and explicit disagreements. Unresolved disagreements are named, not silently settled; implementation and full cell coverage remain.

### AC-365-02: `tools/last-good-scripts-test` has one case per table cell and passes. The previous commit fails the cases for the cells this work changed.
**Source:** #365, body checkbox 2.

**Verdict:** FAIL

**Evidence:** docs/rasteratops/cloud-folder-state-table.md; docs/retros/2026-10-02-cloud-runs-95-101.md; tools/last-good-scripts-test:13274–13490; /workspace/tmp/rocknix-session/epic-proof-101.sh (case C/F/G have no checks).

**Notes / gaps:** No executable case index for all T-cells and no in-tree guest epic proof with per-case reset yet. Existing host tests pass but do not prove those additions.

### AC-365-03: The guest-d proof runs from `tools/` with a per-case state reset. Its exit code is non-zero when any check fails, seen once on a constructed failure.
**Source:** #365, body checkbox 3.

**Verdict:** FAIL

**Evidence:** docs/rasteratops/cloud-folder-state-table.md; docs/retros/2026-10-02-cloud-runs-95-101.md; tools/last-good-scripts-test:13274–13490; /workspace/tmp/rocknix-session/epic-proof-101.sh (case C/F/G have no checks).

**Notes / gaps:** No executable case index for all T-cells and no in-tree guest epic proof with per-case reset yet. Existing host tests pass but do not prove those additions.

### AC-365-04: The retro file over runs 95 to 101 names each pattern with its guard, in `tools/`, `.githooks/` or `.claude/rules/`, as `ceremonies.md` asks of a blindspot.
**Source:** #365, body checkbox 4.

**Verdict:** PASS

**Evidence:** docs/rasteratops/cloud-folder-state-table.md; docs/retros/2026-10-02-cloud-runs-95-101.md; tools/last-good-scripts-test:13274–13490; /workspace/tmp/rocknix-session/epic-proof-101.sh (case C/F/G have no checks).

**Notes / gaps:** New retro names each observed pattern, its existing guard home and the concrete remaining tracked correction. Refutation: every adjustment has #365/#366/#363/#364/#354/#344 owner; no phase-complete claim.

**Refutation attempted:** checked the criterion against the named primary artifact and executable guard where available; this pass applies only to the specific artifact requirement or explicitly named run, not later builds.

### AC-366-01: The stale-name check reads the list from `cloud_migrate_layout --superseded` and matches each entry as a whole path component; run against today's `tools/cloud-test-backend` (the bare `/GAMES` at line 806) it FAILs, and that failing run is recorded in the day's work log with its command (`engineering-practices.md` § Guards must fail closed).
**Source:** #366, body checkbox 1.

**Verdict:** FAIL

**Evidence:** tools/cloud-test-backend:799–806; tools/cloud-round-trip:344; tools/last-good-scripts-test:8934–8939; run101 round-trip.log:9,16,181.

**Notes / gaps:** The stale regex still misses bare /GAMES; saves-remote still returns it for WebDAV; latest main suite has 0/9 upload. Product guard behaves as D-CLOUD-172 specifies on that fixture.

### AC-366-02: `tools/cloud-test-backend saves-remote` names, on every backend `tools/cloud-test-backend backends` lists, a folder that `cloud_migrate_layout --superseded` does not list: a check in `tools/last-good-scripts-test` that loops over the backends and PASSes.
**Source:** #366, body checkbox 2.

**Verdict:** FAIL

**Evidence:** tools/cloud-test-backend:799–806; tools/cloud-round-trip:344; tools/last-good-scripts-test:8934–8939; run101 round-trip.log:9,16,181.

**Notes / gaps:** The stale regex still misses bare /GAMES; saves-remote still returns it for WebDAV; latest main suite has 0/9 upload. Product guard behaves as D-CLOUD-172 specifies on that fixture.

### AC-366-03: `tools/vm-qa`'s round-trip suite reads PASS in `report.md` on the first image built after the fix, and its `round-trip.log` names the new folder on the `SAVES_REMOTE` line.
**Source:** #366, body checkbox 3.

**Verdict:** FAIL

**Evidence:** tools/cloud-test-backend:799–806; tools/cloud-round-trip:344; tools/last-good-scripts-test:8934–8939; run101 round-trip.log:9,16,181.

**Notes / gaps:** The stale regex still misses bare /GAMES; saves-remote still returns it for WebDAV; latest main suite has 0/9 upload. Product guard behaves as D-CLOUD-172 specifies on that fixture.

### AC-366-04: The S3 backend still gets a legal bucket name: `tools/cloud-round-trip --backend s3` against a QA guest logs `only 9/9` or no shortfall line for its saves upload.
**Source:** #366, body checkbox 4.

**Verdict:** UNTESTABLE

**Evidence:** tools/cloud-test-backend:799–806; tools/cloud-round-trip:344; tools/last-good-scripts-test:8934–8939; run101 round-trip.log:9,16,181.

**Notes / gaps:** The fixture fix has not been implemented; its post-fix S3 byte proof has not run. Existing backend prefix handling is to be preserved, not assumed proved for the future fix.

### AC-361-01: A register row names the disposition (the pin accepted for 0.0.1, or the refresh), and `tools/fork-package-freshness` exits 0 on the candidate's tree with the recipe's stated reason, cited in the cut's RECORD.txt.
**Source:** #361, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** raofflineproxy/package.mk:19–20; current freshness log PINNED, 13 commits behind (new read); rc-accept.txt still cites prior D-RA-044 bump, not an acceptance of the new caching model divergence.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-361-02: On a refresh: every patch applies or is dropped with its reason in the recipe's comment; `last-good-scripts-test`'s proxy sections and `tools/ra-offline-test` on guest d pass on the built image; the whole-library scan's behaviour (D-RA-012) is stated against the budget.
**Source:** #361, body checkbox 2.

**Verdict:** SKIP

**Evidence:** raofflineproxy/package.mk:19–20; current freshness log PINNED, 13 commits behind (new read); rc-accept.txt still cites prior D-RA-044 bump, not an acceptance of the new caching model divergence.

**Notes / gaps:** Conditional on refresh; no refresh taken in this review. Pin-vs-refresh disposition remains #361.

### AC-362-01: A register row accepts the 3.6 series for 0.0.1 (or the bump is taken), and `tools/fork-package-freshness` exits 0 on the candidate's tree with the recipe's reason, cited in the cut's RECORD.txt.
**Source:** #362, body checkbox 1.

**Verdict:** PARTIAL

**Evidence:** packages/web/libsoup/package.mk:5–6; freshness.log PINNED 3.6.6 versus 3.8.0; rc-accept.txt has no libsoup row.

**Notes / gaps:** Implementation or historical evidence exists at the cited surface, but the complete stated criterion is not independently proven for the final combined candidate. Keep this existing work open; the release route in 04 names the missing proof.

### AC-362-02: When bumped: WebKitGTK rebuilt against 3.8, the sign-in window's frames on guest d (a Dropbox sign-in page in the touch layout, the finishing page) and `tools/signin-memory`'s peak within its bound, before any device.
**Source:** #362, body checkbox 2.

**Verdict:** SKIP

**Evidence:** packages/web/libsoup/package.mk:5–6; freshness.log PINNED 3.6.6 versus 3.8.0; rc-accept.txt has no libsoup row.

**Notes / gaps:** Conditional on bump; no bump taken. Pin-vs-bump disposition remains #362.

### AC-353-C01: The sweep of the old words: `tools/archaeology --reversal /ROCKNIX/Saves` lists every rule, register row and document naming `/ROCKNIX` as the cloud root; each is reworded to `/Rasteratops` or marked as history in the same change as the code, and the command then prints only history (`decision-register.md` § A reversal sweeps its old words).

**Source:** #353 comments.
**Verdict:** PARTIAL
**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.
**Gaps:** Comment-only criterion retained for traceability. State/follow/set-aside code and pair source read; full reversal sweep, real-provider/runtime interruption and final-candidate proof are not all complete.

### AC-353-C02: `cloud_migrate_layout --state` looks for every superseded default's folder in the cloud, not only the configured one: a device configured for `/GAMES` whose cloud holds `/ROCKNIX/Saves` with files reads `STATE=superseded-with-files` with `SOURCE=/ROCKNIX/Saves`, and the move dialog, not the creation, is offered (the Nova's real case: its conf names `/GAMES`, its saves sit in `/ROCKNIX/Saves`); a sandbox check in `tools/last-good-scripts-test` section aa fails against the verb as first written.

**Source:** #353 comments.
**Verdict:** PARTIAL
**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.
**Gaps:** Comment-only criterion retained for traceability. State/follow/set-aside code and pair source read; full reversal sweep, real-provider/runtime interruption and final-candidate proof are not all complete.

### AC-353-C03: `--follow` refuses to re-point a device whose old folder still holds files the new folder lacks: it reads `superseded-with-files` and the move is offered instead; the `tools/cloud-round-trip` move case seeds a save into the old folder after the move and shows the second device offered, not followed, with the save intact.

**Source:** #353 comments.
**Verdict:** PARTIAL
**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.
**Gaps:** Comment-only criterion retained for traceability. State/follow/set-aside code and pair source read; full reversal sweep, real-provider/runtime interruption and final-candidate proof are not all complete.

### AC-353-C04: `Saves-replaced` (the set-aside of conflict losers beside the saves folder) moves with the saves, or the notes say it stays under the old name -- the maintainer's call, asked in the futro's report.

**Source:** #353 comments.
**Verdict:** PARTIAL
**Evidence:** cloud_migrate_layout:749–908,473–622; cloud_scan:153–185; ES GuiMenu.cpp:5308–5433; pair rerun 42/0; last-good-scripts-test sections aa/ab/ad.
**Gaps:** Comment-only criterion retained for traceability. State/follow/set-aside code and pair source read; full reversal sweep, real-provider/runtime interruption and final-candidate proof are not all complete.

## Forward audit summary

| Verdict | Count |
| --- | --- |
| PASS | 20 |
| PARTIAL | 58 |
| FAIL | 18 |
| SKIP | 13 |
| UNTESTABLE | 14 |

**Overall assessment:** FAIL — release readiness. Multiple UNTESTABLE entries share one concrete prerequisite: a combined branded candidate and immutable manifest do not exist. These are downstream work, not inferred product failures.

## Coverage boundary

Examined: current cloud scripts, ES callers/boot/card ordering, release identity consumers, raw run95–101 records/logs, current host suite, current corrected pair test on retained images. Not examined afresh: inherited kernel/emulator source (D-WORKFLOW-102), all physical devices, provider-owned Dropbox trust UI, full final image because it is not built. Host predicate probes are narrower than full-VM reproduction.

## Phase 2.5 — Prior-verdict cross-check

After deriving the criteria judgments above, compared the prior-audit provenance
map in 01 with this scope. September 25/28/29 audits predate cloud epic #354;
none supplies a PASS for the new folder actors, archive rename or combined
0.0.1 candidate. Their fix-round scope remains historical, not repeated wholesale
under this review (D-WORKFLOW-102).

Live issue ticks were also checked against their artifacts. #363's tick for a
step after the startup card is contradicted by run101's E frame and the worker
lifetime code. Its old 5m pair criterion names an obsolete expectation; the
current 5m/5n behavior has fresh 42/0 evidence here. #344's whole-codebase,
Branch A, topology and shadow-arm questions have later register dispositions;
retaining their old prose does not reopen them. The criterion list above is the
literal pre-reconciliation snapshot; issue edits from this review are recorded
separately, not silently substituted into that evidence.

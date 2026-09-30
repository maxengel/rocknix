# Step 3 — Revised approach

You are one council member in the active roster. Revise your Step 1 approach using the injected peer reviews from the other members.

## Anti-self-citation constraint

You are revising PROPOSALS for the technique, not OBSERVATIONS of the run that produced them. Do NOT cite the analyses, peer reviews, or revised plans you've been handed as empirical evidence about the technique itself. The deliberation's value comes from independent reasoning about the technique on its merits; using the run's artifacts as evidence for the technique's claims is circular.

## Injected peer reviews

=== START gemini_peer_review.md ===

# Step 2 — Peer review: independent analyses of the Rasteratops fork plan (#338)

This peer review evaluates the four Step 1 analyses (`claude-analysis.md`, `gpt-analysis.md`, `kimi-analysis.md`, and `muse-analysis.md`). It focuses strictly on the technical merits, evidentiary rigor, and feasibility of the proposals within the constraints of a single maintainer and an assistant operating on the embedded corpus.

---

## 1. Cross-cutting synthesis

The four analyses converge on several essential corrections to issue #338:
1. **Phase A timeline:** "About a day" is an extreme underestimate; cold rebuilds, VM QA, upgrade rehearsal, device flashes, and asset cutovers require several days of compute and verification.
2. **Updater risk:** The update mechanism (`rocknix-update`) is underspecified, described inconsistently across issues (POST endpoint vs. direct GitHub releases scrape), and threatens to silently strand or brick RC2 installations.
3. **Cloud sync data safety:** Altering the `/ROCKNIX` folder default without a proven migration path risks data loss or remote split-brain divergence under `rclone`.
4. **Scope discipline:** The first release (0.0.1) must be strictly pruned; the triceratops art, new site, silent boot (#340), runner rewrite (#336), and deep audit tiers (#339) must be decoupled from the initial identity cutover.

Significant divergences remain across the proposals regarding:
- **0.0.1 target scope:** Whether 0.0.1 must build and qualify all four device images (`claude-analysis.md`, `gpt-analysis.md`, `kimi-analysis.md`) or prove the release machinery first on `GENERIC_X64` alone (`muse-analysis.md`).
- **Roadmap sequencing:** Whether to adhere strictly to D-WORKFLOW-083 by gating `0.1` on audit punch closures, or adopt an unblocked sequence (e.g. `claude-analysis.md` Option B) that delivers the frontend spike (#336 Step 0) while auditing in parallel.
- **Infrastructure priorities:** Whether capacity expansion (second Tiny box) or operational resilience (backup, DR blueprint, runner privilege de-escalation) takes precedence.

---

## 2. Review of `claude-analysis.md`

### Strongest claims
1. **Critical security exposure on `serval` (§2, Risk 1):** Accurately identifies the severe vulnerability of attaching a self-hosted runner to a public repository when the runner host stores GitHub PATs with `Workflows: write`, SSH signing keys, mail credentials, and local `gh` sessions. This is the highest-consequence failure mode in the estate.
2. **Audit packet arithmetic (§1.10 & §2, Risk 5):** Dissects the throughput math in #339. By demonstrating that 121,000 lines at the realised rate (~5,000 lines/packet) yields ~85 packets rather than ~50, it exposes how gating `0.1` on all audit tiers would paralyze the project for months.
3. **Frontend spike / Audit re-sequencing (§3.4, Option B):** Proposes the most sensible scheduling compromise: refining D-WORKFLOW-083 to unblock the #336 Step 0 spike immediately, running Tier 1 in the background over `0.1.x`, and scoping Tier 3 strictly to the launch path prior to Step 1.
4. **Automated divergence budget (§3.5):** Proposes `tools/upstream-merge` with a hard divergence metric (`git diff --stat` split by upstream-owned vs. fork-owned roots). This provides a concrete, measurable control against silent chronic drift.

### Weakest claims
1. **Permanently dropping the internal path rename (§3.3 & §7.7):** Recommending that the code-level rename of upstream-owned paths be recorded as "dropped, not deferred" overreaches. While the merge tax argument is completely sound, recording it as permanently dropped conflicts with D-WORKFLOW-085's explicit statement that it is "wanted and comes later." The appropriate stance is indefinite deferral gated by a measured merge-cost budget, rather than unilateral abandonment.
2. **Hygiene refactoring of EmulationStation in P6 (§3.6):** Advocating that D-WORKFLOW-080(a) (splitting `GuiMenu.cpp` into separate files) be executed as "fork-internal hygiene" before the runner touches ES introduces an unnecessary, high-risk refactoring effort across 42,000+ lines of UI delta. Refactoring upstream-owned files during initial fork stabilization invites acute merge conflicts with future upstream ES patches.
3. **Four-device build requirement for 0.0.1 (§6, P4–P5):** Despite criticizing the plan's optimistic schedule, it retains all four device builds and hardware flashes as mandatory exit gates for 0.0.1. This maintains heavy contention on `serval` and demands substantial maintainer verification time.

### Missing failure modes
1. **Unchecked LibreELEC build engine assumptions (`DISTRO` vs. `PROJECT`):** While noting that `DISTRO` keys build directories, it does not evaluate whether upstream scripts (`scripts/image`, `scripts/build_distro`, `config/path`) assume `DISTRO == PROJECT`. If internal build tools hardcode `distributions/$PROJECT` or `projects/$DISTRO`, building `DISTRO=rasteratops` with `PROJECT=ROCKNIX` breaks immediately.
2. **Disaster recovery vacuum:** Treating the lack of a backup for `serval` as a "Low" risk (§2, Risk 14) overlooks catastrophic loss. Re-provisioning the build environment, re-minting tokens, reconstructing worktrees, and re-fetching gigabytes of cached tarballs from memory would cost weeks.

### Concrete revisions to consider
- Demote D-WORKFLOW-080(a) (`GuiMenu.cpp` split) from the near-term roadmap to an unblocked future task.
- Escalate backup automation and an executable provisioning blueprint to an immediate prerequisite in P1.
- Stage 0.0.1 builds to prove `GENERIC_X64` first before scheduling multi-device cold builds.

---

## 3. Review of `gpt-analysis.md`

### Strongest claims
1. **0.0.1 as a compatibility release (§4.2):** Provides the clearest articulation that 0.0.1 is fundamentally an adoption and state contract problem. Treating the rename as a potential breaking migration for update endpoints, local saves, and cloud remotes is the correct mental model.
2. **Manual adoption fallback (§4.2):** Offers an indispensable release-engineering fallback: if reverse-engineering and validating an automatic OTA update path from ROCKNIX RC2 to Rasteratops 0.0.1 proves too complex or unsafe, 0.0.1 should be published as an explicit manual update rather than deploying an untested endpoint in haste.
3. **Source distribution and licensing boundaries (§2.1 & §4.3):** Accurately points out that hosting a public repository does not automatically satisfy GPL v2 corresponding source requirements for all bundled binary packages and toolchains, and insists on a precise component-by-component notice and source bundle.
4. **Negative testing discipline (§4.4 & §8, Phase 1):** Insists that CI guards and test suites include negative controls (proving they fail when synthetic violations or unauthorized credentials are introduced) rather than accepting bare PASS receipts.

### Weakest claims
1. **Lack of operational sizing and timeline estimates:** The proposal heavily critiques the plan's schedule, yet provides zero time estimates or resource budgets for its own 9-phase lifecycle (Phases 0 through 8). For a solo maintainer, this lack of operational pacing risks unbounded planning paralysis.
2. **Excessive procedural abstraction:** Recommends enterprise-scale artifacts (formal threat models, multi-repository cryptographic release manifests, independent audit boundaries) without adapting them to the realities of a one-person project.
3. **Ambiguity on roadmap conflict resolution:** Identifies the schedule clash between #339 (Tier 3 audit) and #336 (Runner Step 0), but leaves the resolution as an open owner question (Q8) rather than providing a firm architectural recommendation.

### Missing failure modes
1. **Specific runner token exfiltration vector:** Mentions credential separation in general terms, but fails to identify the exact GitHub Actions attack vector where unsolicited PRs on a public repo can run arbitrary code on a self-hosted runner holding a `Workflows: write` token.
2. **Missing splash repository:** Fails to flag that Phase B only accounts for three repositories, missing `rocknix-splash` (which must be independently forked and pinned).
3. **WebKitGTK compiler crash dynamics:** Notes the WebKitGTK thread cap, but does not identify the interaction between system memory contention and per-package link memory (`-j24` link exhaustion).

### Concrete revisions to consider
- Ground the execution plan with concrete time, storage, and concurrency limits tailored to a solo maintainer.
- Adopt a decisive stance on the Audit vs. Runner scheduling dilemma (e.g. endorse `claude-analysis.md` Option B).
- Incorporate specific technical hardening steps for GitHub Actions triggers (`workflow_dispatch` / `push` only, no `pull_request` execution on self-hosted runners).

---

## 4. Review of `kimi-analysis.md`

### Strongest claims
1. **Asset-naming trap in the updater (C2 & R1):** Insightfully warns that if RC2’s updater matches release assets by regular expression or filename prefix (e.g. `ROCKNIX-*.tar`), publishing 0.0.1 under `rasteratops-*.tar` will cause RC2 devices to report "no update found," silently breaking the OTA channel.
2. **Identification of the fourth repository (Phase B gap / Missing #2):** Correctly notes that Phase B lists three repositories to transfer, omitting `rocknix-splash` (which cannot be transferred because the maintainer does not own upstream, and must therefore be forked into the organization).
3. **Achievement state split-brain (C12):** Identifies a subtle runtime hazard in #336: `rc_client` maintains its own internal state machine, while RetroArch uses `rcheevos` with a local proxy. Routing cores individually between RetroArch and the new runner risks splitting state, credentials, and offline unlock queues.
4. **Clarification of organization ownership (C8):** Identifies that `maxengel` and `pixelelated` are the same human, debunking the assumption that two distinct individuals oversee organization-level governance.

### Weakest claims
1. **Overstuffed Phase 0 schedule (§7):** Allocates "1–2 days" for Phase 0, but packs it with transferring two repos, forking splash, setting up org teams, performing a 24-file sweep, auditing variables, hardening Actions, mirroring the build container, triaging 135 upstream issues, writing CONTRIBUTING/PR guides, and ratifying multiple register rows. This scope cannot be completed in two days.
2. **Retaining all four devices in Phase 1 (§7):** Keeps all four physical targets on the critical path for 0.0.1, estimating 2–3 days elapsed on a single build machine. With cold builds taking 24 hours alone, serialised with VM testing, upgrade rehearsals, and physical flashing, this estimate is unrealistic.
3. **Sequencing Runner Step 0 after Tier 1 audit (§7, Phase 4 vs. Phase 5):** Relegates Step 0 of #336 to Phase 5 (after the full Tier 1 audit completes in Phase 4). This repeats the mistake of stalling the project's primary technical motivation behind a massive documentation and audit review.

### Missing failure modes
1. **Mail MCP server unmasked data path:** Mentions mail security rules, but misses the fact that while `~/.local/bin/rasterabot-mail` applies regex redaction, the `hostinger-email` MCP server connects directly to the LLM context without any masking layer.
2. **Divergence metric for upstream merges:** Acknowledges the need for a merge cadence (Phase 6), but establishes no quantitative divergence budget or tooling to prevent `projects/` and `packages/` from diverging uncontrollably.
3. **`serval` build/test disk contention:** Does not account for the fact that running `vm-qa` while compiling `GENERIC_X64` causes disk starvation and image clobbering unless isolated by an explicit mutex or separate root volumes.

### Concrete revisions to consider
- Decouple tracker backlog triage (135 issues) and non-essential administrative tasks from Phase 0.
- Move #336 Step 0 ahead of Tier 1 audit completion.
- Introduce an explicit build/QA lock on `serval` to avoid concurrent disk corruption.

---

## 5. Review of `muse-analysis.md`

### Strongest claims
1. **Pruning 0.0.1 to `GENERIC_X64` only (§3 & P2):** Presents the most effective operational simplification across all four analyses. Qualifying 0.0.1 on `GENERIC_X64` in the VM decouples the release machinery, branding sweep, and update contracts from the complex, time-consuming task of flashing four physical boards. Handhelds follow naturally in subsequent point releases.
2. **Technical risks of the `DISTRO` vs. `PROJECT` split (§1.3):** Provides the deepest architectural critique of LibreELEC build mechanics. Shows that splitting `DISTRO=rasteratops` while retaining `PROJECT=ROCKNIX` has never been tested in this repository and may break path resolution in `config/path`, `scripts/image`, or stamp hashing.
3. **Disaster recovery and blueprint prerequisites (§1.10, R5, & P0):** Emphasizes that purchasing a second Tiny before writing an automated blueprint and backing up `serval` is "buying a second bucket with a hole in the first." Mandates encrypted token backups, source cache mirroring, and provisioning scripts as hard Phase 0 requirements.
4. **Debunking the spot instance poisoning claim (§1.11):** Correctly notes that LibreELEC/ROCKNIX builds are stamp-based and per-package resumable via `clean`/`build`. A killed build does not "poison every package in flight," clarifying that spot instance eviction is a runtime risk rather than an unrecoverable corruption risk.
5. **CI race condition on `serval` (§1.8 & R8):** Highlights that `vm-qa` reads the exact image artifact that `GENERIC_X64` builds overwrite, proving that concurrent build and QA runs on the same box will corrupt test state without an explicit mutex.

### Weakest claims
1. **Fragmented release naming scheme (§3 & P2):** Proposes tagging the initial release as `0.0.1-generic-x64` and releasing handhelds as `0.0.1-h700` or `0.0.2`. Introducing architecture-suffixed release tags disrupts the distribution's release scheme, complicates updater version parsing, and increases release engineering overhead.
2. **Pre-rename documentation overhead (P0):** Requires drafting `docs/rasteratops/release-checklist.md` and `docs/rasteratops/merge-cadence.md` in git before verifying that `DISTRO=rasteratops` actually compiles. Verifying build viability on `GENERIC_X64` should precede drafting formal operational documentation.
3. **Stalling Step 0 behind Tier 1 audit closure (P5/P6):** Like `kimi-analysis.md`, it gates the #336 Step 0 spike on resolving Tier 1 audit punch items. This delays the project's core feature work behind 121,000 lines of audit review.

### Missing failure modes
1. **EmulationStation translation string loss:** Misses the fact that modifying the two player-visible strings in EmulationStation invalidates matching entries across 154,000+ lines of localization files (`claude-analysis.md` 1.13).
2. **MCP mail channel leak:** Identifies mail risk and transcript leaks, but does not distinguish between the script wrapper (which attempts masking) and the raw MCP server (which completely bypasses it).
3. **Register row D-WORKFLOW-088 omission:** Overlooks the fact that row 088 is missing from the supplied decision register table.

### Concrete revisions to consider
- Keep the canonical release tag `v0.0.1` (or `0.0.1`) uniform across all images: build and verify `GENERIC_X64` as the qualification gate, then produce the handheld assets under the same release manifest rather than splitting tag names.
- Adopt `claude-analysis.md`'s recommendation to run the #336 Step 0 spike in parallel with the Tier 1 audit, rather than serializing it behind audit closure.
- Incorporate explicit localization checks for the EmulationStation string replacements.

---

## 6. Synthesis and key decisions for the council

To prepare for Step 3, the council should focus on resolving these primary structural differences:

| Architectural decision | Options across analyses | Trade-off to weigh |
|---|---|---|
| **0.0.1 Build Scope** | A: 4 images (`claude`, `gpt`, `kimi`)<br>B: `GENERIC_X64` first (`muse`) | Full hardware support on day one vs. rapid, low-friction validation of the release and updater machinery. |
| **Audit vs. Runner Sequencing** | A: Audits gate `0.1` (`gpt`, `kimi`, `muse`)<br>B: Step 0 spike now; Tier 1 in background (`claude`) | Strict adherence to D-WORKFLOW-083 vs. delivering the maintainer's primary motivation while keeping review scoped. |
| **`DISTRO` / `PROJECT` Rename** | A: Copy `distributions/` only (`claude`, `gpt`, `kimi`)<br>B: Verify split compilation on x64 first (`muse`) | Preserving internal paths for upstream merges vs. exposing latent path bugs in LibreELEC scripts. |
| **Updater Strategy** | A: Reverse-engineer & patch OTA (`claude`, `kimi`)<br>B: Manual update fallback for 0.0.1 (`gpt`) | Seamless automated player transition vs. eliminating release-day bricking/stranding risks. |
| **Infrastructure Staging** | A: Procure second Tiny box early (`kimi`)<br>B: Automate backup and blueprint first (`muse`, `claude`) | Build/test capacity expansion vs. disaster recovery and host-level security hardening. |

=== END gemini_peer_review.md ===

=== START gpt_peer_review.md ===

# Peer review

I am reviewing the proposed mechanisms, priorities, and acceptance criteria—not treating the council documents or agreement between them as evidence that a technique works. I have not inspected the underlying repositories or runtime configuration in this step; implementation-dependent concerns therefore remain verification tasks, not established defects.

## `claude-analysis.md`

### Strongest claims

- **Separating update discovery from update application is essential.** A manually supplied update tar can prove installation and state preservation without proving that an existing device can discover, select, and download that update. This distinction materially improves the proposed rehearsal.
- **Keeping a cosmetic release off the cloud-data path is well justified.** Retaining an existing storage namespace avoids introducing migration semantics merely to complete a rename.
- **The self-hosted runner threat model identifies a consequential trust boundary.** Any job executing repository-controlled code must be evaluated against the credentials and release authority reachable from that execution environment.
- **Upstream maintenance needs an operational contract.** A cadence, recorded upstream revisions, conflict handling, and regression checks are more useful than an indefinite promise to keep merging.

### Weakest claims

1. **The revised estimates remain more precise than their basis supports.** “Four to six working days is the floor” and “nearer 85 packets” should be conditional planning estimates. Build concurrency, device availability, packet composition, and remediation volume are not sufficiently established to support hard lower bounds.

2. **The divergence rules are too categorical.** Editing an upstream-owned file does not create a conflict on every merge. Conversely, placing a change in a patch directory or override does not eliminate maintenance: patches need application machinery, and copied overrides can silently miss upstream fixes. Growth in upstream-owned diffs is a review signal, not proof that code was put in the wrong place.

3. **The review-gate change needs a stronger safety argument.** Allowing an exploratory step-0 branch before a comprehensive audit is different from releasing `0.1` before relevant existing risks are reviewed. Moving Tier 1 to `0.2` should not also defer known security, state-preservation, or launch-path findings. Requiring a broad `GuiMenu.cpp` refactor first may recreate the delay the proposal is trying to remove.

4. **The brand check overclaims completeness.** Binary-string searches and logo-template matching are useful detectors, not proof of every user-visible path. They also need exceptions for required attribution, compatibility paths, user configuration, and translated content.

### Missing failure modes and concrete revisions

- **Make the RC2 migration gate conditional on the actual shipped client.** If RC2 contacts infrastructure the fork cannot control, an unaided OTA migration cannot be created by changing only the new image. An explicitly supported manual transition can be legitimate; it should then be followed by an end-to-end fork-to-fork update test. Also verify whether RC2 can discover a GitHub pre-release before making that the P3 mechanism.

- **Strengthen runner isolation beyond Unix file permissions.** A runner user with Docker-socket access, privileged containers, shared writable workspaces, or another escalation path may still reach host credentials. Trace indirect entry points through artifacts, caches, privileged workflows, and dispatchable refs—not only `pull_request`.

- **Do not test denial by printing real secrets.** The proposed `sudo -u <runner> cat <token-or-key>` will disclose the secret precisely when isolation is defective. Use non-printing access assertions and synthetic canaries, then test effective privileges.

- **Treat hooks and masking as safeguards, not identity or authorization boundaries.** A pre-commit hook cannot securely distinguish a human from an assistant sharing the same account and signing key. Likewise, mail redaction does not make inbound content trustworthy. Separate execution identities and privileged capabilities where attribution or authorization matters.

- **Correct the P1 repository criterion.** The upstream-owned splash repository must be forked, not transferred. “Each transferred, not recreated” cannot apply uniformly to all four repositories.

- **Allow emergency exceptions to the plumbing freeze.** A WIP restriction should never prevent credential revocation or a necessary security change.

---

## `gemini-analysis.md`

### Strongest claims

- **Boot and storage compatibility deserve explicit attention.** Identity variables can feed filenames, labels, discovery rules, and boot arguments. Preserving these contracts is more important than making every internal identifier match the new brand.
- **VM success is not handheld success.** Target-specific boot chains, graphics drivers, input, audio, and panel behavior need their own evidence.
- **The build container and recovery process are legitimate dependencies to bring under control.** A release should identify its actual build environment and be recoverable without reconstructing undocumented host state.

### Weakest claims

1. **The scope critique misstates several proposals.** The quoted audit gate is before `0.1`, not `0.0.1`. The described runner direction already includes a RetroArch-controlled step 0 and explicitly prohibits copying unlicensed MinUI code. The comparison table should not portray a clone-first runner and comprehensive audit as existing `0.0.1` requirements.

2. **Several technical conclusions are unjustifiably absolute.** Renaming paths or modifying ES rendering does not “permanently sever” upstream merging. A changed container does not make builds “irrecoverably” fail. These are potentially expensive maintenance and recovery problems, not demonstrated impossibilities.

3. **The hosted-runner rejection rests on an invalid universal resource premise.** GitHub-hosted resources vary by runner class, repository visibility, and platform. A 16 GB virtual-disk requirement is not a 16 GB host-RAM requirement. Neither inevitable OOM nor the invalidity of all visual testing follows from the stated numbers. Software-rendered tests can still check some UI behavior, although they do not validate the local GPU path.

4. **Fork-network membership is not an endorsement claim.** A truthful “forked from” relationship is provenance. Detachment may have operational advantages, but the licensing argument does not establish a need for it. Current GitHub search, PR-default, and detachment behavior should be verified rather than treated as fixed platform laws.

5. **The update-manifest rewrite is prescribed before its necessity is established.** Rate limits depend on the actual client, request frequency, caching, and deployment size. A new manifest introduces schema, selection, compatibility, hosting, and authentication responsibilities. It does not automatically solve migration for clients that cannot read it.

### Missing failure modes and concrete revisions

- **Read the boot chain before adding label fallbacks.** A fallback in `distributions/.../config/functions` cannot repair a failure occurring earlier in a bootloader or initramfs. Keeping existing labels may require no migration shim at all.

- **Preserve the known-working container before rebuilding it.** Publishing a freshly rebuilt `:latest` moves the mutable dependency to another registry; it does not pin it. Require an immutable digest in the actual build invocation, with the reconstruction recipe preserved separately.

- **Expand Phase 3 beyond `scp`.** The rehearsal presently bypasses the discovery and version-selection failures that motivate the updater redesign.

- **Replace weak exit criteria with checks of the claimed property.** HTTP 200, an image larger than 1 GB, or the existence of `NAMING.md` does not establish update authenticity, bootability, or compatibility. A “valid image signature” also requires a specified signature format, verification key, and trust path; a checksum is not a signature.

- **Do not filter upstream integration to two directory trees.** Changes in build scripts, configuration, distribution defaults, or supporting infrastructure may be dependencies of hardware fixes. A clean `git merge-tree` result establishes textual mergeability, not functional correctness.

- **Make policy-relaxation tests bidirectional.** Show that newly permitted operations pass **and** that secret, personal-data, and still-required safety violations remain blocked.

- **Correct the release-note template.** “All original ROCKNIX branding and marks are retained” conflicts with replacing those marks. Notices must describe what actually ships, not a blanket licensing narrative.

---

## `kimi-analysis.md`

### Strongest claims

- **The migration dependencies are identified at useful granularity.** ES changes, splash changes, recipe pins, repository addresses, and the final image need a coherent release snapshot.
- **The cloud discussion distinguishes configured state from a default.** An existing user’s selected remote should not be replaced merely because the distribution changes its name.
- **The runner critique reaches beyond launch latency.** Feature loss, an explicit fallback, save-state contracts, and achievement continuity are central product requirements rather than incidental implementation details.
- **The owner’s physical participation is treated as a real scheduling constraint.** This is more actionable than assuming every built target can immediately receive equivalent hardware validation.

### Weakest claims

1. **Save-state portability is overstated.** Using the same core build does not by itself establish frontend interoperability. Containers, compression, metadata, serialization quirks, core options, content identity, and architecture can matter. The proposed path-and-name contract is necessary but insufficient.

2. **The distribution-directory choice is framed too sharply.** Adding a fork-owned identity directory need not violate a rule against renaming inherited internal paths. Editing the original directory does not buy “no” divergence either. One option carries content differences; the other may require manually carrying forward upstream changes. The configuration-loading behavior should decide the tradeoff.

3. **Some predictions become inevitabilities without justification.** Stopping upstream ES merges and vendoring it is a contingency, not an established future event. A threshold for reconsidering integration would be more useful than declaring that day unavoidable.

4. **The non-commercial licensing conclusion is too broad.** Non-commercial restrictions on particular bundled works do not establish that all future donations or monetization are categorically prohibited. The relevant works and proposed uses need separate analysis.

5. **Release artifacts do not necessarily restrict hosted QA to release tags.** Candidate images can be passed through CI artifacts or another authenticated staging mechanism. The important requirement is binding the tested image to the exact candidate revision and digest.

### Missing failure modes and concrete revisions

- **Add the mixed-installation cloud case.** “Upgrades keep `/ROCKNIX`; clean installs create the new folder” can split one player’s devices across two namespaces. Test an existing device alongside a fresh installation using the same account, both roots already present, and provider errors that must not be mistaken for an absent folder. Specify one write authority and non-destructive conflict behavior.

- **Verify state interchange in both directions.** Test RetroArch → runner → RetroArch for save data, save states, Auto-slot behavior, and pending achievement activity. Determine where achievement queues and progress actually live rather than assuming they belong to a particular client.

- **Explicitly amend the complete earlier release gate.** Rescoping Tier 3 alone does not resolve a prior requirement covering all tiers before `0.1`. Distinguish permission to explore from permission to release, and retain handling of known high-severity findings.

- **Do not solve repository grants by defaulting to unlimited future access.** A write team can reduce administration, but its repository scope and the fine-grained token’s repository selection are separate controls. Grant only the required repositories and capabilities.

- **Make the provisioning blueprint role-specific.** Reproducing the toolchain is desirable; copying the control account’s credentials onto every build or QA host is not.

---

## `muse-analysis.md`

### Strongest claims

- **The `DISTRO`/`PROJECT` split is correctly treated as a hypothesis requiring an actual build.** Variable names and architectural conventions are not proof that every consuming script supports the combination.
- **The release is recognized as more than one Git commit.** ES, splash, container, package inputs, and produced artifacts must be connected through a recorded manifest.
- **The cloud critique asks the decisive question: “write which?”** Dual-read language alone does not define migration, conflict resolution, or ownership.
- **Artifact contention and resource contention are distinguished.** More RAM cannot prevent a build from replacing the image being tested. Immutable test inputs and scheduling controls address different failure mechanisms.
- **A restore test is stronger than a backup checkbox.** Recovery needs demonstrated access to the necessary inputs and documented treatment of secrets.

### Weakest claims

1. **Several alleged contradictions are ordinary state transitions.**
   - A 2FA reading changing from false to true later is not inherently contradictory.
   - Choosing a machine before purchasing it is consistent.
   - A gate “before Phase A starts” does not, by itself, prohibit Phase B work or preparatory design.
   
   Require current verification and precise gate scope rather than alleging a breach from chronology alone.

2. **The storage discrepancy may be a unit conversion.** A nominal 4 TB device commonly appears as roughly 3.6 TiB. That is not evidence of 400 GB of unexplained drift. Likewise, different sweep counts need classification before being characterized as omissions.

3. **An x64-only public release is a product-scope change, not merely a scheduling improvement.** It can be sensible as a release candidate, but it delays the handheld outcome. Its suitability depends on the maintainer’s intended benefit and the updater’s multi-target behavior.

4. **The prerequisite list risks recreating the scope problem.** A triage SLA, domain inventory, broad backup program, new documentation hierarchy, and numerous register decisions are not equally necessary before the first identity build. In particular, a no-community posture does not imply a promise to respond within an SLA.

### Missing failure modes and concrete revisions

- **Separate an x64 proving milestone from a public versioning scheme.** Tags such as `0.0.1-generic-x64` introduce prerelease/version-selection semantics. Per-device releases can also cause a “latest release” client to select a release lacking its device asset. Require an explicit selection contract before adopting that train.

- **Move build/test exclusion before the first affected build and QA run.** Introducing the mutex in P4 is too late if P2 already exercises the conflicting paths. Prefer immutable candidate images as well as a resource scheduler.

- **Remove the repository-owner guard as an alternative to trusted execution.** For a pull request against the project, `github.repository_owner` ordinarily identifies the base repository’s owner. It does not establish that the proposed code came from a trusted source.

- **Enforce the container pin rather than merely recording it.** Inspecting the digest behind `:latest` is useful evidence, but subsequent build commands must consume that immutable reference.

- **Keep recovery credentials separate from runner provisioning.** Restoring the entire control account’s secret layout onto a second QA machine would expand the compromise surface.

- **Define permitted old-name occurrences.** Compatibility paths, legal notices, historical records, and user data are not branding failures. A zero-occurrence requirement conflicts with preserving these intentionally.

---

## Additional failure modes the revisions should cover

### Step 0 may require more than a command socket

An ES interface over a running RetroArch process depends on display ownership, compositing, focus, controller ownership, and process lifecycle. Sending pause/save commands does not establish that ES can draw over the game or receive achievement and status events.

The runner proposals should require a small feasibility proof covering those boundaries, including recovery when either process exits unexpectedly. Any network command interface also needs an explicit bind address and access policy; enabling it must not inadvertently expose unauthenticated game-control commands to the LAN.

### Interrupted and misdirected updates

The updater checks should include more than a successful upgrade:

- truncated or corrupted downloads;
- interruption during installation;
- incorrect target or board assets;
- stale or unexpectedly ordered versions;
- a failed first boot;
- a documented recovery route that preserves player data.

A checksum obtained from the same compromised release channel does not authenticate an image. If stronger release authentication is deferred, the remaining trust assumption should be stated rather than hidden behind `.sha256` checks.

### Warm-build and artifact provenance failures

Four builds from one source head can still differ through floating dependencies, dirty worktrees, stale package stamps, or inconsistent container selection. Likewise, a test can pass against an older image accidentally left at a familiar path.

Acceptance criteria should bind each test result to the image digest and recorded inputs. Warm builds need periodic clean-build validation; matching version strings alone does not establish matching environments.

### Licensing needs a component-level release check

A repository’s root licence, a recipe’s licence field, and the terms of everything in an image are different things. MIT/GPL labels are not necessarily contradictory when they describe different components. Conversely, a credit sentence does not discharge all applicable binary-distribution obligations.

Require a release-specific account of the shipped works, retained notices, modified artwork, and corresponding-source delivery obligations. Do not make this an owner preference question when the first task is factual licence inspection.

### Test repetition is not automatically reliability evidence

“One successful run” and “ten successful runs” are different smoke-test samples, not established reliability guarantees. Hosted QA should have a defined supported capability set and an acceptable failure rate.

Performance gates should use controlled, repeated measurements and a **one-sided regression limit**; “within ±10%” can perversely reject an improvement. Finally, inability to reproduce a finding in an x64 VM should not erase a well-supported static, ARM-specific, or security finding. Record its evidence class and uncertainty instead.

=== END gpt_peer_review.md ===

=== START kimi_peer_review.md ===

# Step 2 — Peer review of the four Step 1 analyses

A note on method before the substance: I evaluated each claim against the corpus citations and the internal logic of the analysis making it. Where all four analyses converge, the convergence rests on shared corpus quotes, not on independence — I flag below the places where the whole set could be jointly wrong. Two packet defects (the absent D-WORKFLOW-088, the unlabeled Choice 2) condition everything; only `claude-analysis.md` and `gpt-analysis.md` mark their conclusions as conditional on the first, and only `claude-analysis.md` and `muse-analysis.md` catch the second.

---

## 1. Cross-cutting: convergence, shared blind spots, and the union's schedulability

**Earned convergence** (each analysis cites the same primary text; the reasoning is independently checkable): the Phase A "about a day" estimate; the updater mechanism being unread; hosted-runner QA being an experiment, not a gate; the missing merge cadence; the floating build container; the audit gating the wrong release; the cloud-folder rename being a data-loss tail risk; the absence of backup/disaster recovery; artwork off the critical path.

**Where the set could be jointly wrong:**

- All four trust the corpus's self-reported numbers (build times, line counts, root sizes, the 05:xx comment sequence). Only `gpt-analysis.md` states this as a limitation in its provenance discipline. The merged plan should inherit that discipline, not just its conclusions.
- All four optimize inside the upstream-tracking frame. None seriously prices the alternative (hard-pin to RC2's upstream base, merge rarely, accept stale hardware support) — `muse-analysis.md` R2 comes closest, in one sentence. The frame may be right, but the council has not stress-tested it; it has assumed it.
- The union of the four recommended plans is unschedulable for one maintainer. Each analysis is individually disciplined about scope, but claude's P0–P8 plus gpt's contracts plus muse's P0–P7 plus gemini's phases sum to dozens of gates and at least six workstreams. Only `claude-analysis.md` (the two-front WIP limit, the ten-interventions-in-six-hours measurement) and `gpt-analysis.md` (risk 7) price the process itself. Step 3 must *choose*, not union.
- External-knowledge claims are labeled inconsistently. `claude-analysis.md` and `gpt-analysis.md` hedge family knowledge ("in the LibreELEC family they do; verify"). `gemini-analysis.md` (hosted-runner specs, GitHub Support detachment behavior) and `muse-analysis.md` (KVM availability "has varied by pool") assert externals as fact. House rule for Step 3: label or strike.

**A small but telling inconsistency:** the device set is quoted differently across the analyses — the plan says four; `muse-analysis.md` counts five named targets including the VM; `claude-analysis.md` §4.8's parenthetical reads as four 640×480 panels plus the Nova. The council cannot state the device set from the packet. That is the strongest possible evidence for the support matrix all four demand.

**Genuine disagreements Step 3 must settle (listed, not decided):**

1. Code-level rename: record as dropped (`claude-analysis.md` Q13, `gemini-analysis.md` cut 5) vs "retained for now," permanence explicitly rejected (`gpt-analysis.md` §4.5, `muse-analysis.md`).
2. Cloud folder in 0.0.1: cut entirely (`claude-analysis.md`, `muse-analysis.md`) vs contract-now-migrate-later (`gpt-analysis.md`) vs implement dual-read now (`gemini-analysis.md` Phase 2 action 4 — the outlier, against the corpus's `--delete-excluded` warning).
3. 0.0.1 device scope: publish after four device images (`claude-analysis.md` P4/P5, `gemini-analysis.md` Phase 4) vs GENERIC_X64-only tag with handhelds following (`muse-analysis.md`) vs owner-decided matrix (`gpt-analysis.md` Q1).
4. D-WORKFLOW-083's meaning: refine by register row (`claude-analysis.md` option B) vs Tier-1-only gate (`muse-analysis.md`) vs a loose reading in tension with itself (`gpt-analysis.md`) vs cut from the gate (`gemini-analysis.md`, with a misstatement — see below).
5. #341 placement: first (`gemini-analysis.md` Phase 0) vs after transfers / post-0.0.1 (the other three).
6. BUILD_ID semantics: equal across the four images (`claude-analysis.md` P4, `gemini-analysis.md` Phase 4) vs per-image, tied to one manifest (`gpt-analysis.md` §4.1). If BUILD_ID embeds a timestamp, the first formulation is unpassable.
7. Fork network: `gemini-analysis.md` §1.4 relitigates D-WORKFLOW-086; the other three accept it.

---

## 2. `claude-analysis.md`

**Strongest claims:**

- **Risk 1** is the only fully constructed security finding in the set: public repo + self-hosted runner + `pull_request` trigger → arbitrary code on serval → token with Contents/Workflows write → signed malicious release → updater → fleet. It names the credential inventory with paths and expiry, and the mitigations are cheap. `gpt-analysis.md` has the role-separation frame and `muse-analysis.md` mentions PR-trigger hardening in passing, but neither builds the chain; `gemini-analysis.md` omits the axis.
- **§1.5** converts "rehearse the upgrade" into four named, individually testable failure modes (redirect-following, filename prefix, version compare across the date→0.0.1 scheme change, distro-name check). That is the difference between a gate and a hope.
- **§1.10**'s packet arithmetic checks out (121k/5k ≈ 24, 140k/5k = 28, 185k/5k = 37; ≈89 vs the plan's ~50) and it matters because a release is gated on it.
- **P0** is the only proposal that refuses to estimate before reading the load-bearing unknowns (updater, `config/path`, storage numbers, outbound connections, third-party IDs, ES licence).
- The §1 coda (three self-corrections, one reader) is the best-evidenced support for the correlated-reviewer risk in the set.

**Weakest claims:**

- **§3.6 (the GuiMenu.cpp split as fork hygiene)** asserts a merge-conflict benefit without examining the mechanism. Once the fork moves code out of `GuiMenu.cpp`, every upstream edit to that file becomes a delete/modify conflict or a manual port — the same "you have forked the file" cost `muse-analysis.md` §1.3 uses against the `distributions/` split. As written, §3.6 contradicts the analysis's own risk 2.
- **P7 backgrounds Tier 1 during the step-0 spike**, scheduling a review of launch/control code while step 0 rewrites it.
- **P4's "BUILD_ID equal across the four"** assumes BUILD_ID derives from the tag, not a timestamp; the corpus doesn't say (disagreement #6 above).
- No partition-label coverage (`gemini-analysis.md`'s catch); no secrets-in-image sweep.

**Concrete revisions:** replace §3.6 with a one-bucket trial split plus a trial merge of `upstream/next`, decided by the conflict report; scope background Tier 1 to files step 0 won't touch and review the launch-path slice after the spike; define BUILD_ID's derivation in P0 before gating on it; add partition-label verification and an image-content secret sweep to P0/P2; add a release-asset size check (~2 GB images vs the per-asset limit) to P4.

---

## 3. `gemini-analysis.md`

**Strongest claims:**

- **§4.2 (partition labels / boot contract)** is the only analysis to surface the initramfs/fstab label contract (`boot=LABEL=ROCKNIX`). Right failure class, missed by the other three. But it is asserted from family knowledge; it should be framed the way `claude-analysis.md` frames its DISTRO claim — a named file to read before scheduling, not a prescribed shim.
- **§1.2's ratchet framing** of the deferred rename is the clearest statement of the trap, and cut 5 at least forces the question `claude-analysis.md` puts more carefully as Q13.
- **Risk 2** (the ES fork as its own maintenance surface) is well put and aligns with `gpt-analysis.md`'s merge-ledger proposal.

**Weakest claims:**

- **The security axis is absent** — no runner-trigger attack, no token-scope inventory, no mail-channel risk, no commit-identity guard. The other three rank this at or near the top; for an adversarial critique this is the largest coverage hole.
- **Cut 1 misstates the gate**: D-083 gates *0.1*, not 0.0.1 — "completely blocks shipping 0.0.1" contradicts the analysis's own §1.5, which says 0.1. **Cuts 2–4 attack scope the plan never had** (#336 and #340 were never in 0.0.1; Phase C is labeled an experiment). Only cut 5 engages the plan as written.
- **Risk 8's rate-limit math doesn't bind**: unauthenticated API limits are per-IP, so each device has its own quota; release-asset downloads are not API calls; and the whole risk sits on one branch of the updater-mechanism contradiction the other three flag. §3.2's static-manifest prescription commits to a design before the code is read — the exact sin `claude-analysis.md`'s P0 exists to prevent.
- **§1.4 relitigates a register decision** (D-086) on an unverifiable external claim about GitHub Support detachment, plus a mind-read of what the plan's author "conflated."
- **§1.3's "7 GB / 2 vCPU"** is unlabeled, likely-stale external knowledge; the corpus's own guest-memory figures (two guests at 2 GB, one at 4 GB) make the point without it.
- **Risk 6** ranks a licence risk the plan already closed ("a reference to read, not code to copy") above risks the analysis omits.
- **Phase 2 keeps the cloud dual-path in 0.0.1** — the one change the corpus's sharp-edge warning and the other three analyses argue against in an identity release.
- **Phase 0's #341-first rationale is underargued**: the relaxed policies bind upstream-bound PR flow, which D-087 parked.

**Concrete revisions:** add a security section built from issue-338's own specifics; reframe partition labels as verify-first; recast cuts 2–4 as confirmations of exclusion and aim the cut list at real 0.0.1 scope (cloud dual-path, site, hosted-QA gating); fix the 0.0.1/0.1 misstatement; drop or downgrade risk 8 pending the updater read; reduce §1.4 to an owner question that acknowledges D-086; label external specs; move the cloud work out of Phase 2.

---

## 4. `gpt-analysis.md`

**Strongest claims:**

- **§4.1** is the most load-bearing single insight in the set: a release is a dependency closure, and "the build replaces the image the suites read" is an artifact-isolation defect that a second box does not fix. `claude-analysis.md` and `muse-analysis.md` treat the same symptom as contention only (mutex, second box).
- **§4.2** offers the only degraded-mode option (an explicit manual-adoption 0.0.1) and the only separation of corruption detection from origin authentication — a checksum fetched beside its payload is not a trust boundary.
- **Licence precision**: public-repo ≠ source compliance (catches issue-334's bad inference), the BY-SA vs BY-NC-SA shorthand, new artwork needing its own licence, Tiny5's OFL primary text unverified. The most careful licence work in the set.
- **Provenance discipline**: the only analysis that declines to treat source-reported numbers as reproduced. Its gaps table should be the model for the merged plan.
- **Risk 6** (self-authored evidence becoming its own authority) complements `claude-analysis.md`'s correlated-blind-spots risk; together they are the epistemic case.

**Weakest claims:**

- **The D-083 reading is internally strained**: §2.2/§5 say the row "explicitly allows gradual review through 0.0.x," while §8 Phase 7B re-imposes punch-item resolution before 0.1 "preserving D-WORKFLOW-083." If tiers 2–3 run after 0.1, the gate is vacuous for them; if it isn't vacuous, the deferral is illusory. The analysis never says which.
- **Gates are evidence descriptions, not runnable checks.** Against the run's own standard (agent-verifiable criteria), several exits need a translation pass that `claude-analysis.md`'s command-level exits already provide.
- **The five-role separation table is unstaffable** by one maintainer plus one assistant on one box; it needs a minimum-viable-boundaries version (build / bot / owner).
- **Phase 2 keeps cloud-contract work on the critical path** without stating in one sentence that the migration itself is deferred — it reads as scope creep next to the other two's clean cuts.
- The runner-cost critique stops at "integration hypothesis" where `muse-analysis.md` §1.15 makes the full argument; the runner-trigger attack is covered only generally.

**Concrete revisions:** resolve D-083 explicitly (quote the row, pick a reading, state the consequence for late-found punch items); convert each exit into at least one runnable check; collapse the role table to three enforceable boundaries and add the no-`pull_request`-on-self-hosted rule; state the cloud position in one sentence; add partition-label and secrets-in-image items; adopt or rebut `muse-analysis.md`'s runner-estimate argument.

---

## 5. `muse-analysis.md`

**Strongest claims:**

- **§1.3**: DISTRO≠PROJECT has never been built, and the forked-file port-cost point — the sharpest statement of the rename's hidden recurring cost; it and `claude-analysis.md` §1.3's stamp question are the two halves of one verification.
- **§1.5 and §1.6**: the 2FA checkbox contradiction (with timestamps and the break-glass question) and the 24/110/15 sweep-count discrepancy — unique catches, both closable with one org read and one triaged grep report.
- **§1.11**: corrects the spot-instance rationale (stamp-based builds resume per package; the real cost is eviction at hour 5) while keeping the conclusion — good adversarial discipline.
- **§1.15/§1.16**: the strongest runner-cost critique — the nanoarch/minarch line counts show what "glue" excludes, and `rc_client` via the proxy is a new client against an old shim, not "untouched."
- **R5**: backup before second box, with the restore drill as the second box's provisioning test — the right priority inversion.
- The owner questions (Q7's delegation list, Q8's mail-trigger allowlist, Q15's time-to-play threshold) are the most operationally specific in the set.

**Weakest claims:**

- **The GENERIC_X64-only 0.0.1 is the most aggressive cut in the set and the least argued on product terms.** A VM-only tag of a handheld OS runs on nothing a player holds; the analysis doesn't reckon with what that does to the release note, the updater channel's first real users, or the maintainer's motivation — the scarce resource `claude-analysis.md` risk 5 names. Q2 asks the owner, but the recommendation itself needs the product argument, not only the de-risking argument.
- **The verdict's rhetoric outruns its evidence** ("will either ship still saying ROCKNIX somewhere a player reads, or slip") — the brand-grep gate the analysis itself proposes is the counter to the first horn.
- **The P2 squashfs grep is under-specified** next to `claude-analysis.md`'s brand suite (strings over os-release/ES binary/theme XML, template match, documented allowlist), and its triage list omits the leak classes `gemini-analysis.md` caught (hostname, SMB share, mount points, units).
- No update-authenticity treatment (`gpt-analysis.md`'s signing point); no ES licence discrepancy (`claude-analysis.md` §1.12); external KVM-availability claims unlabeled.

**Concrete revisions:** argue the X64-only cut on product terms or soften it to X64-first with one named handheld fast-follow in the same tag; adopt `claude-analysis.md`'s brand-suite mechanics and add `gemini-analysis.md`'s leak classes to the triage; add origin authentication and the ES licence read to R1 and the P0/P1 exits; label external claims.

---

## 6. Failure modes missing from the union

1. **Secrets in the shipped image.** QA service accounts (RetroAchievements/ScreenScraper test accounts), rclone remotes, any dev material in `/etc` or the `/storage` skeleton. No analysis proposes a pre-publish secret sweep of image contents; `claude-analysis.md`'s brand grep is the nearest vehicle and could carry it.
2. **Release-channel pollution.** Phase C transports CI images as release artifacts on the same Releases surface the updater reads; without draft/pre-release discipline and channel selection, devices can be offered CI builds. The ~2 GB images also sit at the per-asset size limit; nobody checks headroom. `gpt-analysis.md`'s pre-release-isolation test is adjacent but doesn't name the collision.
3. **QA-frame repo bloat.** `docs/qa-frames/` PNGs per release per panel accumulate in every clone forever; no retention or LFS policy anywhere.
4. **Second-rename debris.** The org's second owner still carries the previous identity's name; no analysis sweeps for pixelelated-era strings, accounts, or domains as part of identity completeness. `muse-analysis.md` Q5 is adjacent but doesn't propose the sweep.
5. **Correlated 2FA custody.** The bot's authenticator "lives with the maintainer"; if both owners' 2FA and the bot's secret share one device, the two-owner redundancy has a single point of failure. `muse-analysis.md` asks where codes live; nobody names the device correlation.
6. **Redirect sunset.** The fleet's RC2 updaters depend on GitHub's `maxengel/rocknix` redirect, which dies if the old path is re-registered and doesn't cover every surface (`muse-analysis.md` §1.18). Nobody states the criterion by which the fork stops depending on it.

---

## 7. What this review is not

No ranking, no vote, and no revised plan. The disagreements in §1 — especially the D-083 reading, the cloud-folder disposition, and the 0.0.1 device scope — are the items Step 3 should settle explicitly, with the packet's two gaps (D-088, Choice 2) answered or their answers' absence priced into whatever is decided.

=== END kimi_peer_review.md ===

=== START muse_peer_review.md ===

# Step 2 — Peer review of fork-plan proposals

## Method and constraint

I review `claude-analysis.md`, `gemini-analysis.md`, `gpt-analysis.md`, and `kimi-analysis.md` as **proposals** to be judged on independent engineering merit.

I do **not** treat quotations, measurements, or source characterisations inside those proposals as verified facts about the underlying tree. Where a proposal says "the source says X," I treat that as *the proposal's characterisation to be verified*, and I judge: if that characterisation holds, does the reasoning follow? And does the proposed change hold on first principles for release engineering, embedded distribution maintenance, and single-maintainer operations?

No vote is cast here. No revised plan of my own is offered.

---

## 1. Strongest cross-cutting claims — strong on merits

These recur across proposals and are strong for reasons independent of any quoted line:

**1a. Labour time vs elapsed time for an identity release.**
`claude-analysis.md`, `gemini-analysis.md`, `gpt-analysis.md`, and `kimi-analysis.md` all argue "about a day" cannot cover edits + cold multi-target builds + VM QA + rehearsal + device flashes + owner yeses.

On merits this is strong: a `DISTRO`/version rename that enters the build environment invalidates stamps; four cold roots on one builder serialised with QA that consumes the artifact under test cannot fit in one working day including human gates. The exact floor — 2-3 days vs 4-6 days — remains an estimate, not a measurement, but the direction is correct and the fix all imply is correct: separate agent-labour from elapsed, and put rebuild + QA contention + yes-latency on the critical path.

**1b. The updater is a compatibility contract, not a URL swap.**
`claude-analysis.md`, `gpt-analysis.md`, and `kimi-analysis.md` are strongest here; `gemini-analysis.md` also sees the channel as work but jumps to a solution.

On merits: changing distribution name, version scheme, asset names, and hosting while fielded devices already have state and an old client is a migration. Redirect-following, asset-match pattern, version ordering (`0.0.1` vs date/RC-style), target/arch selection, truncated-download handling, and recovery must be specified and exercised through the real client. "Point at our releases" with no mechanism is not an implementation plan. The proposal to read the client code first and rehearse RC2 finding 0.0.1 unaided is the correct gate shape.

**1c. Hosted KVM as unproven for full visual/timing QA.**
`gemini-analysis.md` makes the resource argument most bluntly; `claude-analysis.md`, `kimi-analysis.md`, and `gpt-analysis.md` add scope limits.

On merits: shared, small, throttling virtual CPUs without a GPU cannot be assumed to reproduce guest-d GL behaviour or stable `time-to-play` numbers, and nested virtualization + multi-GB guests + capture/OCR on a small host is an OOM/flake risk. The correct inference is not necessarily "never" but "scoped experiment with N runs, boot/flow-only signal, timing explicitly not relied on" — which `claude-analysis.md`, `gpt-analysis.md`, and `kimi-analysis.md` get right.

**1d. No merge cadence = no hardware-support strategy.**
All four flag this. On merits: a fork that keeps `upstream/next` for kernels, bootloaders, device trees, and Mesa but names no cadence, owner, gate, or divergence measure will atrophy. The recurring cost dominates year-one cost. Proposals for a fixed rhythm, a worktree merge + gate, and a divergence report split by fork-owned vs upstream-owned roots are directionally correct.

**1e. Unpinned, unowned build container is a supply-chain break.**
All four flag `ghcr.io/rocknix/rocknix-build:latest` or equivalent. On merits: building releases against a floating tag owned by the project just left breaks reproducibility and availability. Mirror + pin by digest under the fork's own registry is correct. Whether that blocks 0.0.1 vs lands immediately after is sequencing, not principle.

**1f. Cloud-folder rename does not belong in an identity release.**
`claude-analysis.md` and `gpt-analysis.md` are clearest; `kimi-analysis.md` would keep it only behind strong gates.

On merits: touching the sync namespace with `rclone` allowlist + `--delete-excluded` sharp edges, plus configured-state on upgraded devices vs new defaults on clean installs, plus conflict when both roots exist, is data-loss asymmetry. Branding does not justify remote-data migration. Keep configured root on upgrade; decide clean-install default separately; never silently merge.

**1g. Public repo + self-hosted runner + broad token needs hardening.**
`claude-analysis.md` is most detailed; `kimi-analysis.md` and `gpt-analysis.md` converge on the same controls.

On merits: a public repository cannot refuse PRs/issues; PR-triggered jobs on a persistent self-hosted builder that also holds org tokens, SSH/signing keys, and mail credentials is arbitrary code adjacent to release authority. Restricting self-hosted triggers to `push` on `next` + `workflow_dispatch`, requiring approval for outside contributors, isolating the runner user from secrets, and inventorying scope/expiry/revocation are cheap, standard controls.

---

## 2. Weakest cross-cutting claims — fragile, overreaching, or underspecified

**2a. "Permanently abandon the code-level rename."**
`gemini-analysis.md` asserts this as permanent architecture; `claude-analysis.md` leans to recording it as dropped while hardware comes from upstream.

On merits this overreaches. The merge-tax argument is real, but permanence forecloses future independence, contradicts the characterised register wish ("wanted ... later") without a measured trial merge, and turns a cost argument into a constitutional rule. `gpt-analysis.md`'s "retained for now" and `kimi-analysis.md`'s explicit owner question are more register-faithful. A durable forward rule — new fork-owned artifacts take the new prefix from day one — achieves most of the benefit without pretending to decide the fork's end state.

**2b. Fork-network detachment as an independence requirement.**
Only `gemini-analysis.md` pushes this hard.

On merits it is weak: a "forked from" banner is not endorsement in the licence sense; default PR base, search indexing, and optics are real annoyances but not release blockers; and detachment via support with full issue/PR preservation is asserted without verifiable procedure. Given the transfer is characterised as already executed, detachment is extra churn with rollback risk. Harden PR defaults and contribution policy instead, and revisit detachment as hygiene, not as a 0.0.1 gate.

**2c. A new update-manifest service inside 0.0.1.**
`gemini-analysis.md` proposes a static JSON manifest on the fork's domain to avoid GitHub API rate limits.

On merits this expands the release it claims to narrow: new DNS/TLS/hosting, availability SLO, cache/invalidation, rollback/withdrawal, and trust design for one maintainer, to fix a rate-limit failure mode that is itself unproven (poll frequency, authenticated vs unauthenticated, conditional requests, asset redirect vs API). The correct order is: read client, try minimal re-point to fork releases if the client already speaks that protocol, and only then design a service — with signing and staging/promotion, as `gpt-analysis.md` sketches.

**2d. Zero-hit brand/residue gates without an allowlist.**
`claude-analysis.md` proposes a mechanical `brand` suite; `kimi-analysis.md` proposes a residue audit with zero player-visible hits.

On merits the impulse is right but the gate as stated is brittle: history, changelogs, attribution, help text, internal unit/script names, and legitimate "fork of ROCKNIX" mentions will contain the old name. Without a versioned allowlist, classifier thresholds, and sampling/coverage limits for frames, the gate is unpassable or gameable. Template-matching a logo across panels needs false-positive/negative handling, not just "PASS."

**2e. Revised-plan day counts that repeat the optimism being critiqued.**
`claude-analysis.md` (P0 half-day, P1 one day), `kimi-analysis.md` (Phase 0 in 1-2 days including 135-issue triage + mirror + hardening + rows), and `gemini-analysis.md` (container + manifest + identity in sequence) all under-specify maintainer latency, approval waits, failure repair, and re-runs. On merits: any plan that demands "labour vs elapsed" of Phase A must apply it to itself.

**2f. Specifics asserted before code inspection.**
Examples: partition-label fallback logic in `gemini-analysis.md`; exact `DISTRO`/`OS_VERSION` stamp-hash behaviour in `claude-analysis.md` and `gemini-analysis.md`; boot-menu/installer/hostname/SMB coverage in `kimi-analysis.md`.

On merits these are plausible for the LibreELEC/JELOS family but remain hypotheses until `scripts/image`, initramfs/fstab, `config/path`, `scripts/build`, and the installer are read. Proposals should frame them as inspection tasks with decision branches, not as prescribed edits.

---

## 3. Missing failure modes — gaps across the set

None of the four adequately closes these. I list them as proposal gaps, not as verified tree facts:

1. **Per-SoC boot-chain migration.** Beyond filesystem labels: bootloader blobs, U-Boot env, `dtb.img` activation traps, SPI/eMMC/SD differences, OTA tar vs full image paths. If 0.0.1 changes boot artifacts, per-board upgrade vs clean-flash behaviour and downgrade safety need a matrix. `claude-analysis.md` notes the H700 trap; `gemini-analysis.md` notes labels; no proposal traces the full chain.

2. **Trust bootstrap for the new channel.** Even with a signed manifest, an RC2 device must newly trust a rasteratops key/endpoint. TOFU, key rotation, compromise recovery, and what a malicious or stale channel can make a device do are undesigned. `gpt-analysis.md` comes closest; `kimi-analysis.md` parks signing beyond `.sha256`.

3. **Version/build identity monotonicity.** How `0.0.1`, `BUILD_ID`, date tags, and pre-releases order; what "equal," "older," and "skip-ahead" (RC2 → 0.0.2) do; whether downgrade is refused, allowed, or unsafe after state migration. All flag version compare; none fully specifies the ordering table.

4. **Runtime dependencies on renamed identifiers.** If scripts, services, shares, or configs key on `DISTRONAME`/`ID`/paths, retaining internal paths helps but display/identity changes can still break parsing. No proposal requires a runtime-reference sweep keyed on the new values, only a player-visible sweep.

5. **Source closure beyond the container.** Submodules, crates/caches, firmware blobs, toolchain downloads, and transitive deps need pinning/SBOM thinking. Container mirroring alone does not make a release reproducible or traceable.

6. **Minimal backup/recovery with RPO/RTO.** `serval` as single point of failure, tokens at `0600` on one box, 2FA/recovery codes, domain/registrar, mail provider, and GitHub org recovery. All mention backup/bus factor; none gives the minimal mechanism: what is the second copy, where secrets live, who renews the 2027 token, how recovery is tested.

7. **Yes-budget and stuck-release handling.** One maintainer's approvals/flashes/purchases/art are the true constraint. No proposal models yeses per week, async vs sync approvals, or what happens if the owner is unavailable mid-qualification with a staged pre-release exposed.

8. **Runner isolation beyond user separation.** User-level denial of `~/.config`/`~/.ssh` reads is necessary but not sufficient for untrusted execution. Ephemeral job VMs/containers, no persistent credentials on the runner, secret scoping per job, and cache poisoning are unaddressed.

9. **Upstream-merge as injection surface.** Mail/issues as instruction surfaces are well flagged by `claude-analysis.md`, `gpt-analysis.md`, and `kimi-analysis.md`, but a blind `upstream/next` merge can also import malicious or breaking prompts/code. Merge review, diff scoping, and signing/verification expectations are missing.

10. **Field observability without telemetry.** With no phone-home, how are update failures, boot regressions on ARM, or cloud-sync breakage detected? Opt-in crash/update logs, redacted diagnostics, and a bounded security-report route that does not create a community are sketched only by `gpt-analysis.md` and need concretion.

11. **Binary-blob and non-commercial inventory.** GPU/firmware blobs, scraper/achievement/cloud client IDs, and the "non-commercial use only" notice imply a shipped-artifact inventory beyond theme/ES licences. `claude-analysis.md` asks for the identity inventory; no proposal makes it a 0.0.1 gate with disposition (replace/permission/turn off).

12. **ARM hardware-in-loop to reduce manual load.** All note VM-only coverage, but none proposes even a minimal rig (serial + HDMI capture + power control) or qemu-system-aarch64 smoke to cut per-release physical yeses. The choice is left as "VM + all flashes" vs "VM + rotating device" without tooling to make rotation safe.

---

## 4. Per-proposal assessment and concrete revisions

### `claude-analysis.md`

**Strongest within:** the updater/redirect/asset/version analysis, the credential/runner hardening checklist, the merge-cadence + divergence-budget proposal, and the Tier-2 triage instinct (patch/override vs edit-in-place). The P0 "read before estimating" shape is correct.

**Weakest within:** P0-P1 elapsed optimism; "dropped, not deferred" overreach; `GuiMenu.cpp` refactor (D-WORKFLOW-080(a)) prescribed before ES merge cost is measured; brand-suite brittleness; `patches/` queue ownership left open.

**Concrete revisions `claude-analysis.md` should consider:**
- Restate P0/P1 in labour vs elapsed with explicit owner-wait and re-run buffers; split "one day then hands off" into must-have-for-0.0.1 vs background.
- Soften the rename rule to: retain upstream-owned paths while tracking upstream, require new fork-owned names to use the new prefix, and require a measured trial merge + cost estimate before any reconsideration — recorded as a refining row, not a permanent drop.
- Justify or defer the `GuiMenu.cpp` split: show why upfront churn in the most merge-sensitive file reduces net conflict, or move it to after the first measured upstream ES merge.
- Harden the `brand` suite: versioned allowlist in `NAMING.md`, `strings`/XML/table checks with explicit patterns, template-match thresholds and negative controls (injected old-logo frames must fail).
- Define Tier-2 patch ownership: refresh on upstream bump, provenance rows, when a patch becomes an override, and who pays the carry cost.
- Add minimal backup/recovery: second copy location, renewal owner for the 2027 token, and a recovery drill receipt.
- Address purchase lead time: if the second Tiny has a discount/window constraint, decouple "order" from "gate" instead of ordering after 0.0.1.

### `gemini-analysis.md`

**Strongest within:** the blunt elapsed-time and RAM/resource critique of hosted runners, the container-mirror imperative, and the insistence that 0.0.1 exclude runner/silent-boot/full-audit scope creep.

**Weakest within:** scope contradiction (narrow release + new manifest service + container build + #341 serialised first); fork-detachment claim; prescriptive partition-label fallback before inspection; outright CUT of hosted QA vs scoped experiment; missing runner/mail/issue hardening; thin exit criteria.

**Concrete revisions `gemini-analysis.md` should consider:**
- Make Phase 1 an inspection branch: read `rocknix-update` + release tooling first; choose minimal re-point if the client already reads releases, and only then spike a manifest service with hosting, SLO, staging/promotion/withdrawal, and signing.
- Downgrade fork detachment from 0.0.1 requirement to optional hygiene: verify the support-detach procedure and issue/PR preservation, weigh already-completed transfer costs, and mitigate PR-base/search concerns by policy.
- Replace the `LABEL` fallback prescription with a code task: read `scripts/image`, fstab/initramfs, and installer paths, then specify keep vs dual-label vs migrate per target.
- Replace CUT of hosted QA with a bounded experiment: boot/flow-only, non-timing, N=10 runs, larger-runner option noted, flake rate filed; never a release gate until demonstrated.
- Re-sequence to unblock value: allow identity work + container pin in parallel with #341 relaxations that are actually needed for the release; move the rest to 0.0.x.
- Add the missing security section: trigger scoping, fork-PR approval, runner-user isolation, token inventory, mail/issue data-vs-instruction rules on all channels.
- Strengthen exits to be revision-pinned: manifest digest, image hashes/`BUILD_ID`s, harness revision, and hash-before/after QA.

### `gpt-analysis.md`

**Strongest within:** release-as-dependency-closure, immutable candidate store vs mutable worktree vs published release, RC2 compatibility contract table, credential-role separation, and the audit-boundary correction (checked-in tree ≠ whole OS + downloaded sources).

**Weakest within:** assurance overhead un-triaged for a four-device hobby fork; manual-adoption fallback underspecified; weekly/fortnightly upstream cadence unsustainable as stated; ES adapter + protocol test suite unbounded; licence work un-prioritised; no schedule/yes-budget.

**Concrete revisions `gpt-analysis.md` should consider:**
- Triage the assurance package into 0.0.1-must vs 0.0.x: minimal manifest (distro + ES + splash commits, container digest, target/version/`BUILD_ID`/hashes, QA IDs), minimal source/notice bundle, and deferred threat-model/SBOM depth.
- Specify manual adoption: exact user steps, backup guidance, updater behaviour when auto-update is unavailable (fork-aware error, not silent ROCKNIX targeting), and recovery tests.
- Right-size upstream cadence: monthly or per-release + security fast-path, freeze during qualification, conflict/repair effort recorded separately for distribution vs ES; promote frequency only if measurements justify it.
- Concretise the ES adapter: location, verb/event set, input/focus/pause ownership, local-only socket constraints, and a minimal step-0 test subset that gates 0.1 vs exhaustive later.
- Prioritise licence triage: which shipped components trigger source obligations vs notice-only, what blocks 0.0.1, and the approved attribution/non-endorsement wording plus new-artwork licence.
- Add elapsed + yes-budget: per-phase owner interventions, device-matrix choices (all vs rotating), and stop conditions that do not strand a staged pre-release.
- Define the minimal public surface that lets the site defer: landing page, install/adopt instructions, support matrix, limitations/recovery, and source/licence links.

### `kimi-analysis.md`

**Strongest within:** migration-tail-before-identity ordering (ES/site transfers, splash fork, recipe re-points before image build), the `distributions/` checkbox-vs-register catch, residue-audit + real-updater rehearsal + cloud both-read gates, and the balanced backlog sequence (0.0.1 → #341 + site → tier-1 + #340 → step-0).

**Weakest within:** Q2 left as pure owner choice without technical recommendation; Phase 0 optimism (notably 135-issue triage); zero-hit residue gate without allowlist; device set built on inference; premature vendoring-condition prescription; version-scheme dependency unhandled.

**Concrete revisions `kimi-analysis.md` should consider:**
- Answer Q2 technically while leaving ratification to the owner: recommend keeping `distributions/ROCKNIX/` with `DISTRONAME` set inside to minimise recurring merge surface, with the rename-as-directory reserved for an explicit later item with measured cost.
- Split Phase 0 into release-blocking tail vs background: transfers + grants + recipe URLs + runner approvals + container pin block 0.0.1; full triage, site DNS, and non-critical rows proceed in parallel.
- Fix the residue gate: explicit allowlist for history/attribution/internal names, classifier + sampling limits for frames, and negative controls.
- Mark the device set as assumption-to-confirm: gate the build matrix on Q3, state fallback behaviour if the set differs, and separate build targets from physical boards proven.
- Replace "write vendoring conditions now" with a metric + trigger: track ES merge conflict/repair cost per merge and review the vendor-vs-track decision when it exceeds a predeclared budget for two merges running.
- Make backup/renewal a mechanism: secret locations, second copy, 2027 renewal reminder via the mail channel just built, and a recovery-path note.
- Decouple 0.0.1 tagging from the unratified version scheme: propose an interim tag/asset convention that does not pre-judge `0.0.x` vs `0.1` semantics.

---

## 5. Reconciliation points for synthesis (no vote)

Step 3 will need explicit resolutions, not quiet picks:

- **Rename finality:** permanent reject vs retained-for-now with forward rule and trial-merge requirement.
- **Review gating:** literal D-WORKFLOW-083 vs refined background/launch-slice gating for step-0 vs full Tier 3 before step-1.
- **Update channel:** minimal re-point vs new manifest/endpoint service, including trust, staging, and withdrawal.
- **Cloud namespace:** keep configured root indefinitely vs dual-read with defined write/conflict behaviour.
- **Second box and hosted QA:** order/measure in parallel without gating 0.0.1, with promotion gates tied to demonstrated coverage.
- **ES strategy:** upfront `GuiMenu.cpp` split vs narrow adapter + measured merge cost vs socket protocol only.

Each resolution should cite the code or measurement that decides it, name the register row that records it, and state what unblocks what — without treating any Step 1 characterisation as already-proven fact.


=== END muse_peer_review.md ===

## Output

Produce a revised approach. Cite reviewers by name when accepting, rejecting, or adapting their critiques. Push back where appropriate. Do not vote yet.

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
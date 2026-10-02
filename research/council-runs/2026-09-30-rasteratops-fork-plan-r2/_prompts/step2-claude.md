# Step 2 — Peer review

You are one council member in the active roster. Review the injected Step 1 analyses from the other members.

## Anti-self-citation constraint

You are critiquing PROPOSALS for the technique, not OBSERVATIONS of the run that produced them. Do NOT cite the analyses, peer reviews, or revised plans you've been handed as empirical evidence about the technique itself. The deliberation's value comes from independent reasoning about the technique on its merits; using the run's artifacts as evidence for the technique's claims is circular.

## Injected analyses

=== START gemini-analysis.md ===

# Adversarial Critique and Technical Roadmap: The Rasteratops Fork Plan (#338)

## 1. Claims and Assumptions That Are Wrong, Unproven, or Contradicted

The plan in `issue-338.md` and its associated issues rests on several flawed technical assumptions, unproven capabilities, and internal contradictions.

### 1.1 The "About a Day of Work Plus Artwork" for Phase A is Physically Impossible
* **The Claim:** `issue-338.md` specifies under *Phase A: the identity, 0.0.1* that the phase will take *"about a day of work plus the artwork"* to produce four bootable device images from a single head, execute VM QA suites, run an upgrade rehearsal from RC2, and publish version 0.0.1.
* **The Evidence:** 
  1. `issue-338.md` (Phase D) explicitly measures that *"a cold build of one device is hours and about 90 GB of root; four devices plus the source cache is about 400 GB."*
  2. In `issue-338.md` (Comment 2026-09-30T00:09:32Z), the assistant admits: *"a cold rebuild of four devices is a day on one box, half on two."*
  3. In `CLAUDE.md` (`846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`), the build architecture relies on `distributions/<DISTRO>/options`. Creating `distributions/rasteratops/` with modified `DISTRONAME`, `OS_VERSION`, and kernel options invalidates package stamps across the build roots.
  4. In `issue-338.md` (Comment 2026-09-30T00:09:32Z): *"today no x64 build may run while vm-qa runs, because the build replaces the image the suites read and starves the guests."*
* **The Reality:** A full four-target build from scratch on a single 24-core machine (`serval`) takes more than 24 hours of raw compute time alone, during which zero VM QA passes can execute without starving the compiler or corrupting artifacts. Claiming Phase A takes "about a day" ignores the verified physical build constraints of the current estate.

### 1.2 The "Brand Rename, Not a Path Rename" (Choice 1) Hides a Fatal Upstream Divergence Trap
* **The Claim:** `issue-338.md` states: *"Renaming the paths and the script names would touch thousands of files and turn every upstream/next merge -- the hardware work the fork keeps -- into a conflict across all of them... The proposal: the player-visible identity changes completely... and the internal paths and script names stay as upstream has them... The maintainer's 'name sweep across the code base' is read as the visible sweep unless they say otherwise."* This is reinforced by D-WORKFLOW-085 (`decision-register-fork-rows.md`, `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`): *"the code-level rename of the internal paths and script names is wanted and comes later, as its own item with the merge cost taken when it is done."*
* **The Evidence & Contradiction:** 
  1. If the code-level rename of internal paths (`projects/ROCKNIX/` and `rocknix-*` scripts) is "wanted and comes later", postponing it guarantees that when it *is* executed, the merge surface with `upstream/next` will be vastly larger, instantly destroying the ability to merge upstream hardware improvements.
  2. Conversely, maintaining a split identity where user-facing strings say "Rasteratops" while scripts remain `rocknix-*` leaks across system interfaces. In `CLAUDE.md`, services, network shares, partition labels, and paths (`/storage/.config/rocknix/`) are deeply intertwined with the upstream name. In `issue-338.md`, the audit counted 3,485 filenames and 1,229 files containing the upstream name. A superficial rename of `/etc/os-release`, 11 script lines, and 2 UI strings leaves hostnames, SMB shares (`\\ROCKNIX`), mount points, and systemd units broadcasting the old identity.
  3. The plan pretends this dual state is an interim compromise, but in reality it creates a technical debt ratchet: you either permanently keep the upstream paths and abandon the "code-level rename", or you execute the code-level rename and permanently sever upstream tracking.

### 1.3 Cloud Runner VM QA (Phase C) is Technically Unviable on Standard Hosted Runners
* **The Claim:** `issue-338.md` (Phase C) proposes: *"The VM suites on hosted runners as an experiment: Ubuntu hosted runners expose `/dev/kvm`, so `tools/vm-qa` can boot the image there if the image arrives as a release artifact (2 GB) and the run fits the six-hour limit; measured once before it is relied on."*
* **The Evidence & Contradiction:**
  1. In `CLAUDE.md`, running VM QA requires strict resource thresholds: *"VM disk must be 16GB+ or first boot breaks in a way that looks like a graphics bug"* and *"the VM suites need two guests at 2 GB and one at 4 GB"* (`issue-338.md`, Comment 2026-09-30T00:16:02Z).
  2. Standard GitHub-hosted `ubuntu-latest` runners provide only 7 GB of total host RAM and 2 vCPUs. Running QEMU with a 4 GB guest allocation, software rasterization (llvmpipe) or nested KVM, screen capture, OCR, and disk operations within a 7 GB host limit will trigger Linux OOM kills (`cc1plus`/QEMU terminations identical to those observed on `serval` in `issue-338.md`).
  3. "Measured once before it is relied on" violates the project's own core verification tenets. A timing-dependent visual QA suite running inside nested virtualization on shared, throttling cloud instances will produce non-deterministic timing flakiness.

### 1.4 Remaining in the GitHub Fork Network Contradicts the Fork's Independence Goals
* **The Claim:** `issue-338.md` (Comment 2026-09-30T05:04:00Z and D-WORKFLOW-086) asserts: *"The repository is `rasteratops/distribution`: transferred from `maxengel/rocknix` into the rasteratops organisation and kept in ROCKNIX's fork network, because a transfer carries the issues... Recommendation stands: transfer, as `rasteratops/distribution`, and stay in the fork network."*
* **The Evidence & Contradiction:**
  1. In `issue-337.md` (`4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`), the maintainer stated: *"I have no interest in a Discord server, managing a community, etc., but I am interested in having a better experience, even if it's mainly just for me... quietly offer an alternative."*
  2. In `LICENSE.md` (`61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`), ROCKNIX branding is CC BY-NC-SA 4.0: *"not in any way that suggests the licensor endorses you or your use."*
  3. When a repository remains inside a GitHub fork network:
     - The repository header perpetually displays `forked from ROCKNIX/distribution`.
     - External users opening PRs will default their base branch to `ROCKNIX/distribution:next`, risking accidental upstream PR submissions that reignite the hostility documented in `issue-335.md` (`7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`, Comment 2026-09-29T23:31:35Z).
     - GitHub does not index code in forks for search unless the fork exceeds the parent's star count.
  4. The claim that leaving the fork network drops issues was conflated with GitHub's UI "Leave fork network" button. Detaching a repository via GitHub Support retains all issues, wiki, releases, and PRs while cleanly severing the fork network relationship.

### 1.5 The Scope of Issue #339 Completely Inverts the Maintainer's Explicit Working Capacity
* **The Claim:** `issue-339.md` (`c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`) and D-WORKFLOW-083 establish a 450,000-line multi-tier adversarial code review, requiring: *"Every punch item resolved through Phase 7 before 0.1, or accepted by a register row."*
* **The Evidence & Contradiction:**
  1. In `issue-335.md` (Comment 2026-09-29T23:24:04Z and D-WORKFLOW-082), the maintainer explicitly stated: *"Really, honestly, don't want to read through everything... I trust our process, so I don't feel the need to manually review our commits, nor do I even have the time."*
  2. The assistant's estimate in `issue-339.md` involves at least 50 audit packets across both seats (approx. 100 LLM council runs). Each punch list item requires a VM proof, a fix, regression verification, and documentation.
  3. Setting an exit criterion that every single punch list item across 121,000 lines of fork code, 140,000 lines of OS scripts, and 185,000 lines of EmulationStation must be resolved or register-accepted before 0.1 creates an unmaintainable administrative bottleneck that directly contradicts the maintainer's available time and direction.

---

## 2. Risk Matrix (Ordered by Expected Cost)

| Rank | Risk Area | Expected Cost | Probability | Severity | Description & Cascading Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Upstream Divergence & Merge Atrophy** | **Critical** | High | Fatal | Upstream `ROCKNIX/distribution` actively touches packages, scripts, and build logic. As Rasteratops modifies `distributions/`, build scripts, RetroArch patches, and UI submodules, git merges from `upstream/next` will encounter escalating merge conflicts. If conflict resolution takes longer than upstream's development cycle, merges will be abandoned, leaving Rasteratops responsible for low-level kernel, bootloader, and SoC bring-up—the exact work the maintainer refused to take on (`issue-336.md`). |
| **2** | **EmulationStation Monolithic Fork Decoupling** | **High** | High | Severe | EmulationStation in `projects/ROCKNIX/packages/ui/emulationstation/` is already diverged by +42,180 lines (`issue-339.md`). The plan in `issue-336.md` proposes intercepting game launches, running a control socket, and drawing in-game UI directly from ES. Transforming ES from a game launcher into an active in-game HUD will touch core rendering loops (`Window.cpp`, `Renderer.cpp`), completely breaking any possibility of rebasing onto upstream ROCKNIX/Batocera ES updates. |
| **3** | **Single Hardware Bottleneck & Estate Deadlock** | **High** | High | Severe | The entire project currently depends on a single physical box (`serval`, 24 cores, 60 GB usable RAM). A single cold build of 4 devices requires ~400 GB and ~24 hours. Because `vm-qa` cannot run while x64 builds are active without memory exhaustion and artifact contention (`issue-338.md`), development is serialized. If `serval`'s NVMe suffers wear-out or a hardware fault, development, testing, and release engineering immediately halt. |
| **4** | **Upgrade Brick Risk & State Disruption** | **High** | Medium | Critical | Handhelds are personal devices containing user save states and configurations (`CLAUDE.md`, `upgrade-and-install.md`). In `issue-338.md`, the plan renames `DISTRONAME` to `rasteratops` and alters `/etc/os-release`. If filesystem labels (`boot=LABEL=ROCKNIX`), mount paths (`/storage/.config/rocknix`), or updater migration hooks fail, an OTA upgrade from RC2 to 0.0.1 will corrupt system mounts, fail to locate kernel roots, or orphan user saves in `/storage`. |
| **5** | **Build Container Supply Chain Dependency** | **Medium** | High | Moderate | `CLAUDE.md` documents that builds use `ghcr.io/rocknix/rocknix-build:latest`. Rasteratops does not control or mirror this container. If ROCKNIX upstream modifies, re-tags, or restricts access to this container, Rasteratops builds will fail immediately and irrecoverably on both local machines and CI runners. |
| **6** | **Unlicensed Code Contamination (`minarch`)** | **Medium** | Medium | Severe | `issue-336.md` identifies `minarch` as the foundation for the proposed headless runner, but explicitly confirms: *"MinUI has no licence file GitHub can find, and code with no licence is all rights reserved by default... minarch is a reference to read, not code to copy."* Using an all-rights-reserved codebase as the structural blueprint for a core C runner under an open-source distribution exposes the project to copyright infringement claims. |
| **7** | **Physical Fleet Regression Divergence** | **Medium** | High | Moderate | The VM test harness (`tools/vm-qa`) tests only `GENERIC_X64`. It cannot catch ARM-specific SoC regressions (Mali GPU drivers, Panfrost on Allwinner H700, Freedreno on Qualcomm SM8550). Because physical testing requires the maintainer's interactive physical verification (`CLAUDE.md`, D-QA-015), physical handheld verification will lag behind rapid VM commits, resulting in releases that boot on QEMU but fail on real panels. |
| **8** | **GitHub API Rate Limits on Device Updaters** | **Low** | Medium | Moderate | Pointing the on-device updater script (`rocknix-update`) directly at the GitHub Releases API for `rasteratops/distribution` exposes handheld users on residential IPs to GitHub's unauthenticated API rate limit (60 requests/hr). When multiple devices poll for updates, requests will fail with HTTP 403 errors. |

---

## 3. What to Change: Phases, Order, Gates, Scope, and Cuts

### 3.1 What Must Be Cut Immediately from Version 0.0.1
1. **CUT the Whole-Codebase Adversarial Review (#339) from the Release Gate:**
   - *Reason:* Imposing a 450,000-line audit and requiring every punch item to be resolved before release completely blocks shipping 0.0.1.
   - *Alternative:* Defer Tier 1 review to a post-release stabilization track. 0.0.1 is defined strictly as RC2 (`69e6039f8f`) with identity changes and regression tests passing.
2. **CUT the Headless Libretro Runner Spike (#336) from 0.0.1:**
   - *Reason:* Designing a new C runner on SDL2/GLES with `rc_client` and socket control is a multi-week systems engineering effort. It belongs in the 0.1.x roadmap, not the 0.0.1 identity release.
3. **CUT the Silent Boot and Shutdown Project (#340) from 0.0.1:**
   - *Reason:* Suppressing kernel output, Plymouth splash transitions, and serial console output introduces major risks to system recovery. In particular, messing with serial output breaks `tools/vm-serial`, the primary debugging conduit for headless VM testing (`CLAUDE.md`).
4. **CUT Cloud Runner VM QA (Phase C):**
   - *Reason:* It is unproven, starved of RAM, and introduces CI flakiness. Keep VM QA entirely on local KVM hardware.
5. **CUT the Intention of a "Later Code-Level Rename":**
   - *Reason:* Reversing D-WORKFLOW-085's assertion that "the code-level rename is wanted and comes later." Make the architectural decision permanent: **internal paths remain `projects/ROCKNIX/` permanently as upstream abstraction wrappers.** We will never execute a code-level path sweep so long as `upstream/next` tracking is maintained.

### 3.2 What Must Be Added to the Scope of 0.0.1
1. **Local Build Container Mirroring:**
   - Rasteratops must immediately build and host its own build container (`ghcr.io/rasteratops/build-box:latest`) pinned from the working Dockerfile, cutting the supply-chain cord to `ghcr.io/rocknix/rocknix-build`.
2. **Static JSON Update Manifest:**
   - Rather than having `rocknix-update` query the GitHub Releases API directly, the build pipeline must generate a lightweight `update-manifest.json` hosted via GitHub Pages or `rasteratops.com` (over the Hostinger infrastructure setup in `issue-338.md`), returning SHA256 hashes and download URLs to avoid rate limits.
3. **Filesystem Label & Partition Migration Safeguard:**
   - The build scripts and updater must explicitly maintain partition label backwards-compatibility (`LABEL=ROCKNIX` and `LABEL=STORAGE`), ensuring that existing RC2 installs do not fail their bootloader initramfs mount phases.
4. **Upstream Policy Relaxation (#341) Executed Before Identity Work:**
   - The upstream restrictions (attribution bans, PR size ceilings, squash-merging single commits) must be relaxed *first* so that development and release tooling are not constrained by ROCKNIX's submission requirements.

---

## 4. What is Missing Entirely from the Plan

1. **Independent Build Container Infrastructure:**
   - The sources acknowledge using `ghcr.io/rocknix/rocknix-build:latest` (`CLAUDE.md`, `issue-334.md`), but have no mechanism or task to fork, build, version, and maintain this container under `rasteratops`. If upstream deletes or alters that image, all local and CI builds break instantly.
2. **Partition Label Compatibility & Storage Boot Contracts:**
   - In LibreELEC/JELOS systems, `/etc/fstab` and initramfs scripts locate system partitions by volume label (`boot=LABEL=ROCKNIX disk=LABEL=STORAGE`). The plan discusses renaming `DISTRONAME` and paths, but never addresses partition volume labels. Changing the label in `scripts/image` breaks bootloaders on existing flashed devices; keeping it requires an explicit compatibility shim.
3. **Explicit Upstream Rebase / Merge Cadence & Conflict Resolution Runbook:**
   - D-WORKFLOW-084 states that `upstream/next` will be merged for hardware work, but provides no operational protocol:
     - What is the merge cadence (weekly, bi-weekly, milestone-based)?
     - How are conflicts in `packages/` or RetroArch patches triaged?
     - What happens if an upstream merge breaks an existing Rasteratops feature?
4. **Decoupling from the GitHub Fork Network:**
   - The plan assumes staying in the fork network is the only way to keep issues, but fails to evaluate contacting GitHub Support to detach the repository while preserving all historical issues, PRs, comments, and assets.
5. **Disaster Recovery and Local Backup Strategy for `serval`:**
   - `serval` holds the local git checkouts, worktrees, 400 GB of build caches, VM images, and developer tooling. There is no automated offsite backup specified for `serval`'s worktrees, build configurations, or local keys (`~/.ssh/rasterabot_ed25519` and `~/.config/rasteratops/`).

---

## 5. Critical Questions Only the Owner Can Answer

The following five questions must be resolved by the repository owner before proceeding:

1. **The Code-Level Rename vs. Upstream Tracking Contract:**
   * *Question:* Do you accept that internal paths (`projects/ROCKNIX/`, `rocknix-*` scripts) will **permanently remain as-is** to preserve upstream hardware merges, formally abandoning the "later code-level rename" envisioned in D-WORKFLOW-085? Or do you insist on eventually renaming all internal code, accepting that doing so will permanently cut off upstream merges and force Rasteratops into total hardware self-sufficiency?
   * *Unblocks:* Determines whether `NAMING.md` establishes an enduring architectural contract or an unstable temporary holding pattern.
2. **Procurement and Timing of the Second Build Machine:**
   * *Question:* Are you ordering the second Lenovo ThinkStation P3 Tiny Gen 2 ($2,000 via your work discount, as discussed in `issue-338.md`) immediately so it can be dedicated as the proving host (`vm-qa`, test suites), or must 0.0.1 be built and verified entirely on `serval`?
   * *Unblocks:* Determines whether Phase D is an immediate prerequisite for multi-device builds or remains a deferred post-0.0.1 decision.
3. **Update Endpoint Architecture:**
   * *Question:* Should device updates query a static `update-manifest.json` hosted on your domain (`rasteratops.com` via Hostinger API) to eliminate GitHub API rate limits, or do you want the updater to query the GitHub Releases API directly despite the risk of rate-limiting on residential IP pools?
   * *Unblocks:* Dictates the updater rewrite in `distributions/rasteratops/` and the release publishing workflow in `tools/fork-publish-release`.
4. **Scope Boundaries for Version 0.0.1:**
   * *Question:* Do you confirm that Version 0.0.1 is **strictly** the proven RC2 code tree (`69e6039f8f`) packaged under the Rasteratops visible identity, with Issue #336 (libretro runner), Issue #339 (adversarial audit), and Issue #340 (silent boot) completely excluded from the 0.0.1 release criteria?
   * *Unblocks:* Prevents scope explosion and defines the exact, achievable boundaries of the 0.0.1 milestone.
5. **Physical Device Flashing Sign-Off for 0.0.1:**
   * *Question:* For the 0.0.1 release, are you prepared to physically flash and test the RG35XX SP (H700) and Retroid Pocket Nova (SM8550) via an explicit interactive session, or do you authorize publishing 0.0.1 on the basis of GENERIC_X64 VM QA passing plus a single physical device smoke test?
   * *Unblocks:* Establishes the physical hardware test matrix required to satisfy the device-testing policy (`CLAUDE.md`, D-QA-015).

---

## 6. Recommended Action Plan: Rigorous, Verifiable Phases

The following revised plan reorganizes the work into sequentially gated phases. Every phase contains machine-verifiable entry and exit criteria.

```
+-----------------------------------------------------------------------+
| Phase 0: Policy Normalization & Secret Scoping (#341)                 |
| (Relax upstream rules, configure rasterabot, unlock rapid iteration)   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 1: Build Container & Update Endpoint Infrastructure             |
| (Mirror build container, deploy update-manifest.json on rasteratops)  |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 2: Visual Identity & Distribution Asset Injection (#337)        |
| (distributions/rasteratops, splash fork, 32x20 logo, Tiny5 Duo wordmark) |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 3: Single-Target GENERIC_X64 VM Proof & Upgrade Rehearsal       |
| (Build X64, boot guest d, verify splash frame, rehearsal from RC2)    |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 4: Full Multi-Device Compilation & Hardware Release Matrix      |
| (Build 4 device images, verify build stamps, physical testing sign-off) |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 5: Tag, Artifact Publication & Release 0.0.1                    |
| (Publish 0.0.1 on GitHub Releases with CC BY-NC-SA attribution)       |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 6: Post-Release Hardening & Upstream Merge Cadence              |
| (Setup 2nd box, schedule upstream sync, execute Tier 1 audit #339)    |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 7: Next-Gen Architecture Spike (Towards 0.1) (#336, #340)       |
| (RetroArch socket HUD, clean-room C runner spike, silent boot sequence) |
+-----------------------------------------------------------------------+
```

---

### Phase 0: Policy Normalization, Tooling Relaxation, and Secret Scoping
* **Intent:** Implement Issue #341 immediately. Remove obsolete upstream contribution restrictions so that development tooling, commit authorship (`rasterabot`), and PR flows operate unimpeded.
* **Entry Criteria:**
  1. `git log -1` on `next` confirms repository is at or ahead of `e7d7b35884` (`issue-338.md`).
  2. `gh auth status` confirms active login as `rasterabot` (`issue-338.md`, Comment 2026-09-30T05:48:07Z).
* **Actions:**
  1. Update `.githooks/pre-push` to drop `pr/*` single-commit enforcement and upstream AI disclosure checks. Retain secret and credential scanning.
  2. Modify `tools/pr-stack-check` to turn reviewable-size violations (1,500 lines) into warnings rather than blocking errors.
  3. Retire `PERSONAL_PATTERNS` checks for `.claude/` and `docs/` inside fork-internal workflows.
  4. Record decision rows relaxing D-WORKFLOW-078, D-WORKFLOW-079, and D-WORKFLOW-071 in `docs/decision-register.md`.
* **Exit Criteria (Agent-Verifiable):**
  - `tools/rules-check` exits `0`.
  - `tools/register-check` exits `0`.
  - Verification run of `.githooks/pre-push` passes against a multi-commit test branch.

---

### Phase 1: Build Container & Update Infrastructure Provisioning
* **Intent:** Sever supply chain dependencies on ROCKNIX build infrastructure and configure an independent update endpoint.
* **Entry Criteria:**
  - Phase 0 exit criteria verified.
  - Access to GitHub container registry (`ghcr.io/rasteratops`) verified via `docker login`.
* **Actions:**
  1. Clone upstream build container definition; build and publish `ghcr.io/rasteratops/build-box:latest`.
  2. Update `Makefile` and `CLAUDE.md` to reference `ghcr.io/rasteratops/build-box:latest`.
  3. Create `packages/tools/rasteratops-update/` or modify `rocknix-update` to fetch updates from `https://updates.rasteratops.com/manifest.json` (or GitHub Pages equivalent) instead of direct GitHub API calls.
  4. Ensure update manifest generator is integrated into `tools/fork-publish-release`.
* **Exit Criteria (Agent-Verifiable):**
  - `docker pull ghcr.io/rasteratops/build-box:latest` completes with valid SHA256 digest.
  - Mock update query against the test manifest returns HTTP 200 with valid image signature.

---

### Phase 2: Visual Identity & Distribution Asset Injection
* **Intent:** Implement Phase A and Issue #337 without renaming internal paths. Create `distributions/rasteratops/` and fork `rocknix-splash`.
* **Entry Criteria:**
  - Phase 1 exit criteria verified.
  - SVG asset for 32x20 logo provided by maintainer, or interim Tiny5 Duo wordmark path data generated (`issue-337.md`, Comment 2026-09-30T01:40:33Z).
* **Actions:**
  1. Fork `ROCKNIX/rocknix-splash` into `rasteratops/splash`. Replace compiled SVG path arrays in `main.c` with the 32x20 logo and Tiny5 Duo wordmark path data. Fix aspect ratio scaling to snap to integer scale factors (6x for 640x480, 12x for 1280x960; `issue-337.md`, Comment 2026-09-30T02:03:12Z).
  2. Create `distributions/rasteratops/`:
     - `options`: Define `DISTRONAME="rasteratops"`, `OS_NAME="Rasteratops"`.
     - `version`: Define `OS_VERSION="0.0.1"`, `DISTRO_VERSION="0.0.1"`.
     - `logos/`: Add SVG and PNG rasteratops logos.
     - `config/functions`: Ensure partition search checks `LABEL=rasteratops` falling back to `LABEL=ROCKNIX`.
  3. Update package recipe `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk` to point `PKG_SITE` and `PKG_URL` to `rasteratops/splash` at the pinned commit hash.
  4. Add `/ROCKNIX` and `/rasteratops` dual-path resolution for cloud saves (`issue-338.md`, D-WORKFLOW-050).
  5. Add `NAMING.md` documenting why internal paths retain `projects/ROCKNIX/` to facilitate upstream hardware merging.
* **Exit Criteria (Agent-Verifiable):**
  - `tools/pkgcheck rocknix-splash` exits `0`.
  - `grep -rn "DISTRONAME" distributions/rasteratops/options` outputs `DISTRONAME="rasteratops"`.
  - `test -f NAMING.md` exits `0`.

---

### Phase 3: Single-Target GENERIC_X64 VM Proof & Upgrade Rehearsal
* **Intent:** Compile the GENERIC_X64 target, verify the boot splash and branding inside QEMU guest d, and validate upgrade persistence from RC2.
* **Entry Criteria:**
  - Phase 2 exit criteria verified.
  - `serval` volume has at least 500 GB free disk space (`df -h /workspace`).
* **Actions:**
  1. Execute clean build of `GENERIC_X64`:
     ```bash
     PROJECT=ROCKNIX DISTRO=rasteratops DEVICE=GENERIC_X64 ARCH=x86_64 ./scripts/image mkimage
     ```
  2. Boot resulting image under `tools/generic-x64-vm` (guest d, 640x480).
  3. Capture visual frames during boot via `tools/vm-visual-qa`. Verify splash screen displays the rasteratops logo and Tiny5 Duo typography.
  4. Query serial console via `tools/vm-serial`:
     - Check `/etc/os-release` reads `NAME="Rasteratops"` and `VERSION="0.0.1"`.
     - Check `systemctl is-system-running` reaches `running` or `degraded`.
  5. **Upgrade Rehearsal:** Spin up a clean VM with RC2 (`69e6039f8f`). Populate `/storage` with sample retroarch save states and custom configs. Deploy 0.0.1 `.tar` update to `~/.update/`. Reboot. Verify all configs, saves, and cloud sync paths persist intact (`upgrade-and-install.md`).
* **Exit Criteria (Agent-Verifiable):**
  - Visual QA frame matching: `docs/qa-frames/0.0.1-boot-splash.png` passes visual comparison with 0 diff on logo coordinates.
  - Command `cat /etc/os-release` over serial matches expected fields.
  - Rehearsal suite output: `tools/test-upgrade-rehearsal` logs `UPGRADE_SUCCESS: PRESERVED_STORAGE=true`.

---

### Phase 4: Full Multi-Device Compilation & Hardware Release Matrix
* **Intent:** Compile all production device targets from the identical git commit and execute physical hardware validation.
* **Entry Criteria:**
  - Phase 3 exit criteria verified.
  - Maintainer confirms availability for physical device smoke testing.
* **Actions:**
  1. Sequentially compile device targets on `serval`:
     - `make docker-H700` (RG35XX SP)
     - `make docker-SM8550` (Retroid Pocket Nova)
     - `make docker-RK3566` (RG353M)
  2. Generate SHA256 checksums for each release image in `target/`.
  3. Interactive Device Testing (per `CLAUDE.md`, D-QA-015):
     - Request explicit maintainer sign-off to flash RG35XX SP (H700) using `docs/device-flashing-runbook.md`.
     - Verify panel display at 640x480, input controls, audio, and save state persistence.
     - Record maintainer confirmation in issue tracker.
* **Exit Criteria (Agent-Verifiable):**
  - All four target images exist in `target/` with valid non-empty sizes (>1 GB) and `.sha256` files.
  - `git log -1 --format=%H` matches across all build metadata stamps.
  - Device test log in issue comments includes maintainer's explicit confirmation for H700 hardware boot.

---

### Phase 5: Tag, Artifact Publication & Release 0.0.1
* **Intent:** Formally publish Version 0.0.1 on GitHub Releases and update the documentation site.
* **Entry Criteria:**
  - Phase 4 exit criteria verified.
  - Maintainer approves release text containing the mandatory CC BY-NC-SA attribution line (`LICENSE.md`, `issue-334.md`).
* **Actions:**
  1. Create annotated git tag `v0.0.1` signed by `rasterabot`.
  2. Execute `tools/fork-publish-release --tag v0.0.1`:
     - Upload 4 OS images and checksums.
     - Include release body stating: *"Rasteratops is an independent distribution for handheld gaming devices, forked from ROCKNIX (itself a fork of JELOS). All original ROCKNIX branding and marks are retained under CC BY-NC-SA 4.0 attribution."*
  3. Update `docs/decision-register.md` marking 0.0.1 shipped.
* **Exit Criteria (Agent-Verifiable):**
  - `gh release view v0.0.1 --repo rasteratops/distribution --json assets` returns 4 image tarballs and 4 checksum files.
  - HTTP check against release download endpoints returns 200 OK.

---

### Phase 6: Post-Release Hardening, Estate Scaling, and Upstream Merge Cadence
* **Intent:** Establish sustainable long-term infrastructure before beginning complex architectural work.
* **Entry Criteria:**
  - Version 0.0.1 successfully published.
* **Actions:**
  1. **Provision Second Build Box:** Commission the second Lenovo ThinkStation P3 Tiny Gen 2. Mirror configuration from `serval`. Dedicate Box 1 to compilation (`make docker-*`) and Box 2 to continuous VM QA (`tools/vm-qa`).
  2. **Upstream Merge Cadence:**
     - Configure a bi-weekly scheduled workflow to fetch `ROCKNIX/distribution:next`.
     - Generate merge-preview diffs filtered strictly to `packages/` and `projects/ROCKNIX/`.
     - Establish a rule: merges must never touch `distributions/rasteratops/`.
  3. **Execute Tier 1 Adversarial Audit (Issue #339):**
     - Run `code-auditor` across the fork's 121,000 lines of original additions.
     - File discovered bugs as 0.0.x punch-list items.
* **Exit Criteria (Agent-Verifiable):**
  - Second build box reachable over SSH, reports identical toolchain versions (`gcc --version`, `docker --version`), and passes `tools/box-check`.
  - Upstream merge test dry-run (`git merge-tree`) executes cleanly against `ROCKNIX/distribution:next`.
  - Audit artifact filed under `docs/audits/` with `tools/lint-audit-artifacts` returning PASS.

---

### Phase 7: Next-Gen Architecture Spike (Towards Version 0.1)
* **Intent:** Address Issues #336 (headless libretro runner) and #340 (silent boot) safely without compromising system stability.
* **Entry Criteria:**
  - Phase 6 complete; Tier 1 audit punch list resolved.
* **Actions:**
  1. **Step 0 of Issue #336 (Safe Path):**
     - Enable RetroArch's network command interface (`network_cmd_enable = true`).
     - Implement ES in-game overlay menu communicating with RetroArch via UDP socket (pause, save, load, exit).
     - Suppress RetroArch native OSD alerts; render cards in ES.
     - Benchmark using `tools/time-to-play` (`issue-336.md`).
  2. **Step 1 of Issue #336 (Runner Spike):**
     - Clean-room implementation of a minimalist C runner using SDL2 + GLES hardware rendering handshake (`nanoarch` BSD-3 model, NOT copying unlicensed `minarch` code).
     - Benchmark against Step 0 baseline.
  3. **Silent Boot Implementation (Issue #340):**
     - Adjust kernel command line (`loglevel=0 quiet vt.global_cursor_default=0 console=tty3`).
     - Keep serial console (`ttyS0`) active for VM QA serial harness (`tools/vm-serial`).
* **Exit Criteria (Agent-Verifiable):**
  - `tools/time-to-play` confirms game start latency is equal to or faster than baseline RC2 (1.05s on VM).
  - VM visual series verifies boot frames remain pure black or splash without console text while `tools/vm-serial` continues to respond.

---

## 7. Comparison of Approaches

| Architectural Dimension | Initial Plan in #338 / #335 | Recommended Plan (This Analysis) | Rationale for Change |
| :--- | :--- | :--- | :--- |
| **0.0.1 Scope** | Visible rename + full codebase audit (#339) + cloud runner KVM experiment + libretro runner spike (#336). | Visible identity + update manifest + container mirroring + single-head multi-device build. | Cuts non-essential R&D from the initial identity release; delivers a stable 0.0.1 within days instead of months. |
| **Code-Level Rename** | Deferred as a "wanted later item" (D-WORKFLOW-085). | **Permanently rejected.** Internal paths remain `projects/ROCKNIX/` indefinitely. | Eliminates the technical debt trap where a future rename permanently severs upstream hardware merges. |
| **CI & VM QA Host** | Experiment with nested KVM on GitHub-hosted Ubuntu runners (Phase C). | Local execution only on `serval`, transitioning to a dedicated 2nd Tiny PC. | Cloud runners lack sufficient RAM (7 GB vs. 16 GB required), causing OOM crashes and timing flakiness. |
| **Upstream Submissions** | Ambivalent dual-prong strategy lingering across #334 and #335. | Single-prong focus on Rasteratops; generic bugfixes upstreamed only when trivial. | Prevents wasted maintainer cycles trying to satisfy ROCKNIX's strict `AGENTS.md` accountability rules. |
| **Libretro UI Architecture** | Rapidly clone `minarch` into an in-process ES runner (#336). | Step 0 (control RetroArch via socket) first; clean-room GLES runner spike second. | Avoids copyright infringement on unlicensed MinUI code; provides immediate UX wins with zero core breakages. |
| **Hardware Fleet QA** | Presumed achievable via quick local VM and device testing. | Strict gating: VM QA automated; physical device flashing gated by explicit interactive sign-offs. | Prevents bricking user handhelds; respects the project's foundational rule that nothing runs on hardware without a "yes." |

---

## Provenance and Citation Summary

The analysis above is grounded in the declared corpus. Specific citations reference:
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md` (`sha256: 371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md` (`sha256: 7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md` (`sha256: 4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md` (`sha256: c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md` (`sha256: 188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md` (`sha256: 433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md` (`sha256: cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md` (`sha256: 7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md` (`sha256: 63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md` (`sha256: 846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md` (`sha256: 61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`)

=== END gemini-analysis.md ===

=== START gpt-analysis.md ===

# Rasteratops fork plan: make 0.0.1 a safe compatibility release

## Recommendation

**Proceed with the fork as decided, but replace the plan’s critical path.** The critical path is not artwork → repository transfers → cloud CI → another build box. It is:

> **Freeze the release lineage → establish the release and migration contracts → change the visible identity → build immutable artifacts → prove clean installation and preservation of existing state → publish.**

D-WORKFLOW-084 defines 0.0.1 as RC2’s tree, `69e6039f8f`, under the fork’s own identity. D-WORKFLOW-085 postpones the code-level rename. D-WORKFLOW-087 parks submissions to ROCKNIX. Those decisions make a narrow release possible; they should be used to prevent the infrastructure and frontend roadmaps from expanding it.[^register]

My principal objections are:

1. **The updater and persistent-state transition are treated as address and naming changes, although they are compatibility changes.**
2. **“Four images from one head” is not a sufficient release identity across the distribution, EmulationStation, splash, build container, and downloaded sources.**
3. **The current account arrangement does not demonstrate separation between automation, building, and release authority.**
4. **The plan understates the continuing cost of the EmulationStation fork and overstates what retaining upstream hardware support makes automatic.**
5. **The proposed audit is a useful repository review, not evidence that the entire operating system has been reviewed.**

Do **not** make 0.0.1 wait for the second box, hosted VM QA, the full three-tier review, silent boot, the new runner, or the internal rename. Conversely, do not publish it merely because the splash and information screen look correct.

This analysis uses the embedded source snapshot. Source-reported measurements and API observations are not measurements I reproduced. Provenance and missing primary evidence are recorded at the end.

---

## 1. Establish the actual starting point

The issue bodies contain proposals subsequently superseded by comments and register rows.

| Area | State supported by the latest embedded record | Planning consequence |
|---|---|---|
| Direction | D-WORKFLOW-084–087 settle the name, independent product, staged rename, transferred distribution repository, and pause on ROCKNIX submissions.[^register] | Do not revive #335’s earlier “primary path” of upstream submissions. |
| Distribution repository | #338’s 05:14 comment reports the transfer to `rasteratops/distribution`, redirects, surviving `FORBIDDEN_PATTERNS`, and the address sweep in `1633cbcac2`.[^338] | Verify the migrated state; do not plan this transfer as future work. |
| Organisation and bot | The issue’s completed checkbox records two owners and required 2FA at 05:51. The 05:48 bot comment establishes that the approved token could post a comment and perform the named reads.[^338] | The earlier 403 and disabled-2FA reports are historical failures, not the final state. Neither does the final comment prove every permission needed by future workflows. |
| Other repositories | Phase B still asks for transfers of EmulationStation and the site; #337 additionally requires a splash fork. Their completed migrations are not evidenced here.[^338][^337] | Maintain a separate status and permissions record for each repository. |
| Hardware | The later decision is a second identically provisioned Tiny with 64 GB and a 4 TB NVMe, explicitly “not started now.” The NUC remains a music server.[^338] | The second box is a capacity project, not available release infrastructure. |
| Frontend | #336 evolves from a minarch-derived 2D proposal to a fresh GLES-capable runner, preceded by RetroArch underneath ES’s interface.[^336] | Use the latest direction, not the issue’s original 2D-only acceptance checklist. |

The register extract is titled “080 to 088,” but contains no D-WORKFLOW-088. No additional decision should be inferred from that heading.[^register]

---

## 2. Claims that are wrong, unproven, or internally inconsistent

### 2.1 Findings affecting 0.0.1

| Finding | Evidence | Assessment and required correction |
|---|---|---|
| **“About a day” describes editing, not delivery.** | #338 calls Phase A “about a day of work plus the artwork,” while requiring four images, VM QA, an RC2 upgrade rehearsal, and device proofs. Its later hardware discussion says a cold four-device rebuild takes a day on one box.[^338] | The estimate omits build scheduling, migration investigation, package invalidation, failure repair, and owner-authorised device work. Estimate those separately. Do not promise a one-day release. |
| **A visible rename is not necessarily confined to display strings.** | #338 includes `DISTRONAME`, `/etc/os-release`, release names, updater addresses, and the cloud folder default. `CLAUDE.md` describes layered configuration beginning with `distributions/<DISTRO>/options`.[^338][^claude] | Those values may also select configuration, identify update targets, or locate persisted data. Classify each occurrence as display text, machine identifier, persisted namespace, attribution, or historical record before changing it. |
| **The updater’s interface is unresolved.** | #334 says the updater reads GitHub releases. #337 says it “asks an update endpoint by POST and follows the address it returns.” #338 merely proposes pointing it at the fork’s releases.[^334][^337][^338] | A release page is not automatically a replacement for a POST service. Inspect the actual shipped client and server contract. URL substitution is not an adequate implementation plan. |
| **“Read both” cloud folders is underspecified.** | Phase A proposes changing the player’s `/ROCKNIX` cloud default and says “read both, D-WORKFLOW-050.” The cited decision’s full text is not embedded.[^338] | Reading both does not define conflict resolution, write destination, coexistence with RC2, or behaviour when both contain different saves. Preserve an upgraded installation’s configured root; do not rename or merge remote data as a branding operation. |
| **A public repository does not establish source-distribution compliance.** | #334 asserts: “The GPL asks for the source of what is distributed (this fork is public, so that is met by existing).” The actual `LICENSE.md` says bundled works retain their respective licences.[^334][^license] | The conclusion does not follow. The release needs a component-by-component source and notice record tied to its binaries. The full relevant licence texts and corresponding-source contents are not embedded. |
| **The branding licence is abbreviated incorrectly in some planning text.** | #337’s acceptance criteria say “CC BY-SA”; #334’s commentary also uses that shorthand. The primary licence explicitly says **CC BY-NC-SA 4.0**.[^337][^334][^license] | Preserve the actual terms wherever licensed upstream material remains. An attribution sentence is not a substitute for all applicable conditions. Independently created artwork needs its own explicit licence; it does not automatically inherit the upstream artwork’s licence. |
| **The storage budget is stale.** | Phase D uses approximately 90 GB per root and 400 GB for four roots plus cache. A later comment gives 110–147 GB per root and a 38 GB source cache. `CLAUDE.md` separately says a first build needs approximately 200 GB.[^338][^claude] | Using the later root figures gives **478–626 GB before retained images and temporary space**. These may describe different build states; measure both steady occupancy and peak working space rather than choosing the convenient estimate. |
| **Splitting QA off the builder does not prove the WebKit cap can be removed.** | #338 records two compiler deaths at 24 threads and a four-thread cap, then suggests a role split lets the cap loosen.[^338] | That is a hypothesis. Preserve the cap until a controlled build records peak memory, swap behaviour, successful completion, and absence of OOM events. |
| **Hosted KVM is an experiment, not a capability already available to rely on.** | Phase C says Ubuntu hosted runners expose `/dev/kvm`, refers to a 2 GB artifact and a six-hour limit, and explicitly requires measuring once.[^338] | No runner configuration, workflow, eligibility rule, device permissions, execution receipt, or full-suite resource measurement is embedded. Benchmark the exact job. One successful VM boot would not establish capacity for the whole QA fleet. |
| **The process documentation disagrees with the process being proposed.** | `CLAUDE.md` says “there is no unit-test suite” and “`tools/pkgcheck` … is the only lint.” #338 lists numerous host checks and VM suites. `CLAUDE.md` still directs user-facing documentation to the upstream site.[^claude][^338] | This is evidence of stale entry-point guidance, not evidence that the tests do not exist. Reconcile the authoritative instructions before delegating the migration. |
| **#341’s guard acceptance criteria contradict its policy table.** | The table retires the personal-paths guard for the fork. The acceptance criteria say the `pr/*` scans keep personal-paths and credential checks.[^341] | Specify the destination-sensitive rule. Fork records and tools may be allowed; credentials must remain forbidden everywhere. Do not equate those categories or enforce safety only on `pr/*`. |
| **The artwork specification has a small but real unresolved detail.** | #337 first reports a 58×6 wordmark, then specifies 57×6 inside a 64×32 composition. It also says the splash consumes compiled path data, not an SVG file.[^337] | Measure the final bitmap, choose integer-aligned placement, and convert the owner’s SVG into the renderer’s supported representation. “Two one-line changes” is not the acceptance test. |

A further concrete omission is visible in the primary licence file itself: its header embeds the upstream logo and links to upstream releases, activity, pull requests, and Discord. A correct identity sweep must distinguish that presentation chrome from the copyright and licence text that must remain intact.[^license]

### 2.2 Findings affecting the roadmap

| Finding | Evidence | Assessment and required correction |
|---|---|---|
| **“Nothing underneath changed” does not prove the proposed ES-owned in-game experience.** | #336’s step 0 claims all cores, achievements, and netplay work immediately because RetroArch remains underneath, while ES draws the pause page and cards over the game.[^336] | The new work still owns focus, input routing, pause semantics, display composition, notification delivery, and process failure. The command socket alone does not demonstrate those behaviours. |
| **The hardware-rendering support claim is not an inventory.** | #336 says every relevant shipped 3D core has a GLES path and Vulkan can wait.[^336] | Verify exact core revisions, build options, required contexts/extensions, target GPUs, and frontend capabilities. A working N64 core does not establish PSP, Dreamcast, hardware PS1, Saturn, or 3DS compatibility. |
| **The latency attribution is unsupported.** | #336 reports 1.05 s to first frame and states display handover is “where the 1.05 s goes”; it also quotes RetroArch CPU-time measurements.[^336] | End-to-end wall time does not identify its causes. CPU time is not interchangeable with elapsed launch latency. Trace the stages before making the in-process bridge’s benefit part of the justification. |
| **`rc_client` does not establish an unchanged achievements integration.** | #336 says the runner supplies memory, HTTP, and a per-frame call, and that the proxy and offline work carry over “untouched.”[^336] | That is an integration hypothesis. Hashing, memory maps, event delivery, credentials, hardcore restrictions, save/load handling, and offline reconciliation need explicit proofs. |
| **The audit is not “the whole OS” merely because it covers the checked-in tree.** | #339 counts checked-in files, treats patches/configurations by provenance, and proposes approximately twenty, twelve-to-fifteen, and fifteen packets for the tiers.[^339] | Downloaded component sources and their transitive dependencies are not thereby reviewed. State the reviewed boundary accurately. Packet completion and line counts are coverage bookkeeping, not behavioural assurance. |
| **The audit and frontend schedules conflict.** | #339 says Tier 3 is read before the libretro work starts. #336 describes step 0 in days. D-WORKFLOW-083 permits the review to proceed gradually over `0.0.x`.[^339][^336][^register] | Either perform the full prerequisite review before step 0, or explicitly replace that dependency with a focused launch/control-boundary review while retaining the wider audit obligation. An agent must not quietly choose the convenient interpretation. |
| **Interval screenshots cannot prove “every frame.”** | #340 asks for capture “at intervals” and a PASS classification proving every frame is black, splash, or interface.[^340] | Sampling can miss transient text. Specify capture coverage and classifier limits; test the classifier against deliberately injected console/cursor frames. Separate OS-owned output from firmware/panel behaviour, as the issue already anticipates. |

---

## 3. Risks ranked by expected cost

This ordering is a qualitative judgement for the first several releases, not a measured probability model. It weighs repeated maintenance cost as well as exceptional damage.

| Rank | Risk and expected cost | Why it ranks here | Principal control |
|---:|---|---|---|
| **1** | **State loss or a broken update path** | The rename directly touches identifiers, release selection, and cloud namespaces on systems with existing state. A bad transition can damage more than the new image.[^338][^337][^claude] | Explicit migration contract, opt-in RC2 adoption, negative update tests, and a demonstrated recovery path. |
| **2** | **Build or release authority compromised through automation** | #338 places the bot’s GitHub/SSH/mail identities on the working box and retains an owner account for privileged calls. The proposed token scope includes workflow writes.[^338] | Separate build, automation, and release identities; keep owner and release secrets away from general build execution; enforce boundaries remotely. |
| **3** | **Recurring upstream and ES integration debt** | The fork already adds roughly 42,180 ES lines, and #336 acknowledges that deeper integration makes upstream interface changes harder to merge.[^339][^336] | Small integration batches, pinned multi-repository releases, a narrow frontend adapter, and measured conflict/repair effort. |
| **4** | **False confidence from incomplete QA coverage** | The sources distinguish VM proof, GPU/device facts, multiple panels, and stateful upgrades, but do not supply a release support matrix. #335 records a dead page script missed for a week.[^337][^claude][^335] | Explicit coverage by target, board, installation state, and backend; negative controls for the tests themselves. |
| **5** | **A release whose licence/source record cannot be defended** | Primary licences differ by component; some referenced frontend/font licences are only reported second-hand; #334 overstates what public git establishes.[^license][^334][^336][^337] | Exact-build source and notice inventory; unresolved rights block use of the affected component or asset. |
| **6** | **Assistant-produced evidence becoming its own authority** | The record includes mistaken RAM assumptions, a false-positive token-access conclusion, and a mail-redaction failure. Each was corrected, but they demonstrate the limits of confident procedural narration.[^338] | Require observable receipts, negative tests, bounded permissions, and explicit owner decisions—not promises or self-authored checkmarks alone. |
| **7** | **Review and feature expansion starving maintenance** | The tiered review, runner, silent boot, policy cleanup, infrastructure, and upstream work are each substantial independent tracks.[^339][^336][^340][^341] | Work-in-progress limits and release-specific acceptance boundaries. |
| **8** | **Buying capacity before identifying the bottleneck** | The hardware discussion moves from RAM to the NUC to a second Tiny; cloud figures are rough estimates, not quotes or duty-cycle measurements.[^338] | Measure queue time, build resource peaks, and QA contention; provision the agreed second box when authorised, without putting it on the release’s critical path. |

The account errors should be interpreted precisely. The mail code exposed in the transcript was reported as already spent. The token-access error was corrected by the later successful comment. These are evidence that the controls needed improvement, not evidence of an ongoing credential compromise.[^338]

---

## 4. The contracts the plan needs

### 4.1 A release is a dependency closure, not one distribution commit

The plan requires “the four images from one head,” while `CLAUDE.md` says ES is a separate repository and #337 introduces a separate splash fork.[^338][^claude][^337]

Every candidate should therefore have one release manifest containing at least:

- Distribution commit and the approved delta from RC2.
- Full ES and splash commits, plus any separately sourced theme/assets.
- Build-container digest and relevant toolchain/build settings.
- Target, architecture, selected device configuration, distribution identity, version, and build date.
- Source revisions/hashes and carried patches sufficient to identify the inputs.
- Per-image `BUILD_ID`, filenames, sizes, and cryptographic hashes.
- The QA report identifiers for those exact artifacts.
- The source/notice bundle associated with those binaries.

These are **proposed required outputs**, not artifacts demonstrated by this corpus.

There must also be a distinction between:

1. a **build worktree**, which is mutable;
2. a **candidate artifact store**, which is immutable;
3. a **published release**, which points only at verified candidates.

The existing restriction against building x64 while QA reads its image is partly a resource problem and partly an artifact-isolation problem: #338 says the build replaces the image the suites consume.[^338] A second computer does not fix an ambiguous artifact contract. Copy or publish a content-identified candidate into a read-only QA location and verify its hash before and after the run.

### 4.2 The RC2 transition needs a compatibility contract

`CLAUDE.md` states the central requirement plainly: “Every build ships onto devices that already have state,” and requires both upgrade and clean-install checks.[^claude]

The release must answer these questions before implementation:

| Surface | Required behaviour for 0.0.1 |
|---|---|
| RC2 adoption | Deliberate opt-in to Rasteratops. Do not assume an already-installed client will discover a new server merely because the new image contains a different URL. |
| Version comparison | Demonstrate how date/RC-style versions compare with `0.0.1`. Test upgrade, equal-version, older-version, and pre-release cases. |
| Device selection | Reject a release for the wrong target or architecture before writing it. Do not rely on a filename substring alone. |
| Update transport | Define the actual endpoint, request/response schema, timeouts, redirects, authenticity boundary, and artifact validation. |
| Interrupted/corrupt download | Leave the installed system and player state recoverable; reject truncated or incorrect data. |
| Cloud namespace | Existing configurations retain their current root. New-install defaults are a separate decision. If both roots exist, never silently choose or merge conflicting saves. |
| Local state | Preserve the agreed settings, account state, game saves, save states, launcher/state-slot contracts, and recovery settings. Use controlled fixtures rather than recording real secrets. |
| Rollback/recovery | Prove the recovery procedure. If state migration makes downgrade unsafe, state that explicitly and provide a tested restore/reinstallation path. |

A `.sha256` file is useful for corruption detection, but a checksum fetched beside its payload is not an independent answer to release-origin compromise. #334 identifies that checksum convention; it does not describe an update authentication design.[^334]

For automatic updates, define that trust boundary. A signed manifest with a separately controlled release key is one reasonable small design. If safely establishing automatic update/adoption is too large for 0.0.1, **make 0.0.1 an explicit manual-adoption release rather than build an unaudited update service in a hurry**. Its updater must still be fork-aware or clearly unavailable—not silently target ROCKNIX.

### 4.3 Licence compliance must follow the actual shipped material

The primary licence supports three important distinctions:

- ROCKNIX original software/scripts are GPL v2.
- Bundled works and modifications retain their own component licences.
- ROCKNIX branding/images are CC BY-NC-SA 4.0.[^license]

Consequently:

1. **Retain software copyright and licence notices.** A visible-name sweep must not rewrite authorship.
2. **Inventory retained upstream artwork separately from code.** Independent branding is the decided product policy; it is not a reason to erase historical attribution.
3. **Record a licence for the owner’s new artwork.**
4. **Verify Tiny5’s actual terms and what is redistributed.** #337 reports OFL 1.1 and distinguishes rendered images from font redistribution; the font’s primary licence is not embedded.[^337]
5. **Resolve ES’s licence discrepancy before any new linkage decision.** #336 reports MIT at the repository root and GPL in the recipe. That report is a gap to investigate, not a basis for declaring all combinations permissible.[^336]
6. **Do not copy minarch while permission is unresolved.** “No licence file GitHub can find” is not a complete licence investigation, but it certainly is not permission to copy. #336’s final comment correctly makes fresh implementation the rule.[^336]
7. **Make exact required sources available by a method permitted by the relevant licences.** Public distribution-repository history alone does not demonstrate that this includes all distributed component sources, patches, and required build material.

No sponsorships and no accepted contributions do not remove these obligations. Nor does refusing contributions restrict the redistribution rights the applicable software licences grant.

### 4.4 Build automation must not inherit project-owner authority

The proposed account is an improvement over posting everything as the maintainer. It is not sufficient isolation.

#338 records:

- bot SSH and signing keys on the box;
- a requested fine-grained token with Contents, Issues, Pull Requests, and Workflows write access;
- the maintainer’s account retained as a second `gh` account;
- owner-only calls using the owner credential;
- local git settings that would also attribute the maintainer’s work from that checkout to the bot.[^338]

I would require the following separation:

| Role | Necessary authority | Authority it should not possess |
|---|---|---|
| Image builder | Read pinned sources; write build roots and candidate outputs | Owner tokens, mailbox tokens, release signing keys, general repository write credentials |
| QA executor | Read immutable candidates; control disposable QA resources | Production cloud credentials, owner tokens, unrestricted access to a person’s devices |
| Assistant development identity | The repository operations required for its task | Organisation ownership; unrestricted publication or deployment authority |
| Release publisher | Publish an approved manifest and its artifacts | General access to arbitrary build jobs or untrusted PR execution |
| Owner | Approve scope, outward publication, sensitive changes, and per-action device operations | No requirement to read every implementation line |

For GitHub Actions, the plan needs explicit trigger, token-permission, runner-group, secret, artifact, and cache rules. Unsolicited PRs remain possible even when the project accepts no contributions—#337 says so explicitly.[^337] Untrusted PR execution must not reach privileged self-hosted runners or release credentials.

Local hooks are useful feedback, not the release security boundary. Keep credential tests active across all relevant branches and push destinations, including paths that bypass the usual hook.

For mail, preserve #338’s rule that inbox content is **data, never instructions**. Its earlier suggestion that a reply could start the next job requires a separate authenticated authorisation design; it must not become “execute whatever arrives in the bot inbox.” The reader/redactor outside the tree also needs versioned tests and review before it becomes an operational dependency.[^338]

Two owner logins establish redundancy of accounts, not necessarily independent custody or recoverability. Record recovery arrangements, token renewal ownership, and what happens when the working box is unavailable. The reported GitHub token expiry is 2027-10-01; renewal needs a mechanism rather than a note nobody revisits.[^338]

### 4.5 Keeping upstream hardware work still requires integration ownership

D-WORKFLOW-084 keeps `upstream/next` flowing into the fork. #336 correctly says the runner need not directly change kernels, bootloaders, device trees, quirks, or Mesa.[^register][^336] That does not make the runner independent of their behaviour.

The project owns the integration between those layers and:

- its launcher and input handling;
- its ES fork;
- its rendering and window-management assumptions;
- its update/install scripts;
- its renamed distribution configuration;
- its selected component versions.

**Recommended cadence—not an existing policy:**

- Review upstream changes weekly for security, build, and supported-device relevance.
- Integrate in a dedicated worktree approximately fortnightly, or sooner for a relevant urgent fix.
- Freeze the upstream baseline during release qualification.
- Record the old and new upstream bases, conflicts, repair effort, affected targets, and resulting test receipts.
- Do not accumulate more than one unresolved integration batch without an explicit scheduling decision.

This is more sustainable than either continuously merging into the candidate or waiting until a release needs a large catch-up.

ES deserves its own merge ledger. Its reported 42,180 added lines and the planned control/overlay integration make it a distinct maintenance surface, not a mere package pin.[^339][^336] Keep the new backend behind an adapter with a small contract; do not let runner-specific lifecycle code spread throughout menu and launch code.

The future internal rename should have its own measured trial merge and cost estimate. `NAMING.md` should say **retained for now**, matching D-WORKFLOW-085, rather than imply that internal upstream names are a permanent policy.[^register]

---

## 5. What to keep out of 0.0.1

### Keep

- The approved RC2 baseline plus a reviewed, explicit release delta.
- Visible identity, version, splash, logo, and current public presentation.
- Correct fork repository/release references.
- A safe, explicit adoption/update contract.
- Persistent-state compatibility.
- Required source, licence, attribution, and notice work.
- Host checks, immutable-artifact QA, and the agreed device proofs.
- Narrow policy corrections needed to operate honestly and safely in the fork.

### Defer

| Item | Why it does not belong on the 0.0.1 critical path |
|---|---|
| Internal path and script rename | Already postponed by D-WORKFLOW-085; creates avoidable merge and compatibility churn.[^register] |
| ES-owned in-game controls and new runner | Changes launch, input, rendering, state, and achievements behaviour rather than identity.[^336] |
| In-process cores | Adds a new crash and resource-ownership boundary; the source itself calls it the risky later step.[^336] |
| Silent boot/shutdown | Independent behaviour with its own capture and diagnostic-preservation requirements.[^340] |
| Automatic relocation of cloud data | Branding does not justify remote data migration. “Read both” is not a complete migration design.[^338] |
| Hosted VM QA as the sole proof system | Not yet measured.[^338] |
| Purchasing or provisioning the second Tiny | Useful capacity, but expressly not started and not necessary to prove the release serially.[^338] |
| Completion of all audit tiers | D-WORKFLOW-083 explicitly allows gradual review through `0.0.x`.[^register] |
| A large site redevelopment or forge migration | The release needs a truthful public landing page and instructions, not a new hosting platform. #337 already permits staying on GitHub.[^337] |

The broad audit can be deferred; **known release-critical security, state-loss, update, and licensing defects cannot**.

---

## 6. What is missing entirely—or at least not demonstrated

Absence from this corpus is not proof that a mechanism is absent from the repository. It is nevertheless a gap in a plan that relies on it.

### Product and release operations

- A supported-target/physical-device matrix and an explicit policy for untested combinations.
- A release manifest spanning repositories and build inputs.
- Exact update-channel semantics, including staging, promotion, withdrawal, and pre-release selection.
- A migration/recovery contract covering the change from RC2/date-style naming to `0.0.1`.
- A source-and-notice publication procedure tied to each binary release.
- A policy for withdrawing a bad artifact without destroying the diagnostic record.

### Security and operational continuity

- A threat model covering builds, downloaded code, public PR workflows, release authority, bot credentials, and mailbox input.
- Branch/environment protection and credential-separation evidence.
- Restorable backups of the repository record and configuration. Transfer redirects are not a backup.
- Recovery and rotation procedures for owner accounts, bot credentials, SSH/signing keys, and mail access.
- A bounded security-reporting and incident-response route that does not require creating a community.

### Assurance and maintenance

- Negative controls showing that important checks fail when a known violation is introduced.
- A map from advertised behaviour to specific tests and genuinely device-only gaps.
- Audit coverage identified by exact revision, with a policy for re-reviewing changed code.
- A patch **and configuration** provenance inventory. D-WORKFLOW-083 names both; #339’s row-count acceptance criterion explicitly counts only patches.[^register][^339]
- Upstream monitoring and an integration service level.
- Resource and queue measurements sufficient to justify infrastructure purchases.

### Primary evidence needed next

The actual updater/release tools, workflow definitions, scoped rules, package pins, component licence files, RC2 manifests, QA logs, hardware specification, and cloud quotations are not embedded. Those sources must be supplied or inspected during execution before the corresponding gates can truthfully pass.

---

## 7. Questions only the owner can answer

These are not invitations to reopen the fork decision.

| Question | Decision it unblocks |
|---|---|
| **Which targets and physical devices are actually promised support in 0.0.1?** Which are merely produced as unqualified images? | Release build matrix, required physical proofs, and public wording. |
| **Is a manual, opt-in RC2 adoption acceptable if automatic discovery cannot be established safely within this release?** | Whether the updater investigation is a publication blocker or an explicitly bounded follow-up. |
| **Should upgraded installations retain their existing cloud root indefinitely until an explicit migration is requested? What should clean installs default to?** | The cloud compatibility contract without silently relocating or splitting player data. |
| **Who may publish releases and control the release trust key? What operations may the assistant perform without another approval?** | Credential separation and automation boundaries. This does not require line-by-line human code review. |
| **What licence applies to the new artwork, and what is the approved public attribution/non-endorsement wording?** | Public asset and release-note readiness. |
| **When is the second Tiny actually authorised for purchase/provisioning, and what recurring cloud spend is acceptable for experiments?** | Capacity scheduling and cost controls. The stated hardware shape can remain unchanged. |
| **How much recurring attention can be reserved for release approvals, named device tests, and upstream/security decisions?** | A sustainable release cadence. The assistant cannot manufacture that availability. |
| **Should the full Tier 3 review precede any #336 work, or should a focused launch/control review precede step 0 while the broad review continues?** | Resolution of the existing roadmap dependency conflict. Record an explicit amendment if the latter is chosen. |
| **Which exact hardware-rendered cores are mandatory for the first runner release, and what measured improvement justifies switching their default backend?** | The runner’s test matrix and success threshold. “All GLES cores” is not precise enough. |

---

## 8. Recommended execution plan and verifiable gates

The following are proposed gates. A PASS must identify the input revision or image hash it tested; a free-floating “PASS” line is insufficient.

### Phase 0 — Freeze scope and reconcile the record

**Entry:** The fork decisions stand; no implementation or publication assumption beyond the embedded evidence is treated as proved.

**Work:**

- Define the proposed release’s delta against RC2 `69e6039f8f`.
- Record which migration changes already landed and which sibling repositories remain outstanding.
- Resolve the owner questions necessary for 0.0.1.
- Reconcile stale entry-point instructions and #341’s guard scope.
- Create a target/board/installation-state coverage matrix.

**Exit evidence:**

- A release-scope record naming the baseline and candidate development branch.
- An explicit allowlist of changes; unrelated feature work excluded.
- Repository and identity status receipts, without printing credentials.
- A support matrix in which every advertised target has an assigned proof path.
- A written answer to “Can this be done on the VM?” for every proposed device-only action, following `CLAUDE.md`.[^claude]

**Stop condition:** Unresolved support scope, publication authority, or adoption model. Artwork development can proceed independently; publication planning cannot pretend these choices have been made.

### Phase 1 — Establish trustworthy build and test execution

**Entry:** Scope and authority are recorded.

**Work:**

- Complete only the repository migrations and grants needed by the release.
- Back up the existing project record before further destructive repository operations.
- Separate build execution from owner, mail, and release credentials.
- Establish immutable candidate storage and an explicit QA artifact selector.
- Run host checks on the appropriate hosted jobs.
- Apply narrowly scoped #341 changes with constructed positive and negative cases.

**Exit evidence:**

- Each required repository pin resolves; each identity can perform its required operation and cannot perform a selected forbidden one.
- Host suites, rules/register checks, and guard proofs emit PASS for the fixed revision.
- A deliberate credential-policy violation is refused using synthetic test data.
- Untrusted workflow inputs cannot select a privileged runner or obtain release authority.
- QA records a candidate hash and demonstrates that a build cannot replace its input.
- The project record can be recovered into a readable independent copy.

The 05:43/05:48 token sequence is the reason for operation-specific tests: successful public reads did not prove authenticated write capability.[^338]

### Phase 2 — Prove the compatibility and source contracts

**Entry:** There is a trusted place to build and test; RC2 artifacts are identified.

**Work:**

- Inspect the actual update implementation and establish its protocol.
- Run baseline RC2 clean-install and persisted-state fixtures.
- Establish version/device/channel selection rules.
- Test legacy cloud-root handling without moving real remote data.
- Inventory required licences, notices, exact source inputs, and new asset rights.

**Exit evidence:**

- An updater contract with executable tests for wrong target, wrong hash, truncated payload, unavailable endpoint, version ordering, and pre-release isolation.
- A recorded RC2 adoption path, including recovery.
- A state-preservation fixture manifest: expected files/settings and acceptable intentional changes.
- A defined result when both old and new cloud roots exist.
- No unresolved right to distribute an included new asset/component.
- A source publication method verified against the actual relevant licence texts.

**Fallback:** If automatic adoption remains unproved, select the owner-approved manual path. Do not conceal the gap with a new URL.

### Phase 3 — Implement visible identity only

**Entry:** Machine identifiers and persistent namespaces are distinguished from display text.

**Work:**

- Implement the distribution identity, artwork, visible strings, and release naming.
- Keep agreed internal names and persisted compatibility identifiers.
- Pin the migrated/forked ES and splash inputs.
- Replace misleading current-project links and badges; retain legal/history material appropriately.
- Rebuild packages and invalidate image stamps where required.

`CLAUDE.md` explicitly warns that script-only changes do not trigger an image rebuild and names `build.*/.stamps/image/build_target`.[^claude] The release procedure must account for this, rather than trusting an apparently successful incremental build.

**Exit evidence:**

- A machine-readable inventory of changed identity surfaces and intentionally retained names.
- `NAMING.md` accurately describes temporary internal-name retention.
- A final splash asset with measured bounds and integer-aligned placement.
- Frames at **640×480 and 1280×960**, matching the panel sizes reported in #337, showing the approved composition.[^337]
- `/etc/os-release`, the information screen, and updater configuration display or identify the intended fork consistently.
- No unexpected old project destination on a current user-facing action.

### Phase 4 — Build and freeze the release candidates

**Entry:** Identity and compatibility work are complete; release inputs are pinned.

**Work:**

- Freeze the multi-repository manifest.
- Build each supported target.
- Retain conservative memory settings until measurements justify changing them.
- Copy finished candidates into immutable storage.
- Publish neither the release nor its update-channel pointer yet.

**Exit evidence:**

- Every image has a `BUILD_ID` tied to the same release manifest.
- Build logs show the correct target, architecture, distribution commit, dependency pins, and completion.
- Relevant packages/stamps demonstrably correspond to the new inputs.
- Peak disk/memory, elapsed time, and any OOM events are recorded.
- Artifact hashes verify after transfer to QA.
- Required source and notice material is complete and retrievable alongside the staged release.

Do not insist on byte-for-byte reproducibility without first defining its inputs. Do insist on traceable inputs and a tested rebuild procedure.

### Phase 5 — Qualify installation, upgrade, and recovery

**Entry:** Frozen candidates exist; their hashes cannot change beneath QA.

**Work:**

- Run the host checks and all release-applicable VM suites.
- Test a clean install and an RC2 upgrade preserving the agreed state.
- Exercise the update failure cases and recovery procedure.
- Measure launch/exit performance on comparable baseline and candidate runs.
- Perform only the named physical-device actions for which the owner gives the required yes.

**Exit evidence:**

- A suite report containing image `BUILD_ID`, hashes, harness revision, and PASS lines.
- Before/after fixture checks for persistent state.
- Frames demonstrating identity and the relevant user flows at the tested resolution.
- Successful recovery from the selected interrupted/corrupt-update cases.
- A performance table with repeated runs, central tendency and tail behaviour—not merely comparison with one historical 1.05 s observation.
- Device-facts rows covering the physical claims made in the release.
- Explicitly listed untested combinations; no unsupported generalisation from guest d.

The device matrix must distinguish build targets from physical boards. #334 reports that two H700 boards were tested; #337 lists four physical devices plus the VM.[^334][^337] “Four images” cannot serve as shorthand for that coverage.

### Phase 6 — Stage, approve, and publish

**Entry:** Every required gate passes for the immutable candidates.

**Work:**

- Stage binaries, checksums/authentication material, sources, notes, and installation instructions.
- Verify them from a reader’s perspective without privileged credentials.
- Obtain the required publication approval.
- Promote the channel only after the complete release is available.

**Exit evidence:**

- Release assets downloaded from their final locations match the frozen manifest.
- The notes state lineage, supported devices, adoption method, limitations, and recovery procedure.
- Source and licence links resolve.
- The published release body contains the approved attribution wording, read back as #335’s criterion requires.[^335]
- The update client selects the intended release and rejects deliberately unsuitable candidates.
- A withdrawal procedure exists that can stop promotion without deleting the evidence needed to diagnose a bad release.

The ordering matters: do not expose a channel pointing at incomplete uploads.

### Phase 7 — Stabilise `0.0.x`; add capacity without changing the release contract

**Entry:** 0.0.1 is published and its operational record is intact.

**Parallel, bounded tracks:**

#### A. Infrastructure

- Provision the second Tiny when authorised.
- Make software provisioning reproducible, but do **not** clone owner/bot/release secrets merely because the hardware is identical.
- Measure builder and QA roles independently.
- Trial hosted VM QA against the same immutable artifacts.
- Record elapsed time, memory, disk, KVM/GPU capability, transfer overhead, reliability, and actual cost.

**Promotion gate:** Hosted QA is relied upon only for the coverage it has demonstrated. Local visual/GPU/device proofs remain where required.

Two simultaneous builds mean the second machine is temporarily not a dedicated QA host. Schedule build and proof phases accordingly; do not promise simultaneous doubling of both capacities. The source’s “half a day” expectation is a throughput hypothesis, not a measured service level.[^338]

#### B. Audit

- Start with the release-critical updater, cloud-state handling, credential/log paths, launcher, and build/release tooling across repository boundaries.
- Continue the agreed tiers with exact revision and coverage manifests.
- Track patch and configuration provenance separately and completely.
- Register credible findings immediately as unverified when necessary; do not postpone recording a serious issue merely because reproducing it needs a device or permission.
- Require the audit artifact checks and fix proofs specified in #339.[^339]

**Completion gate:** Coverage is explicit, changed code is accounted for, and punch items receive their required resolution or acceptance before `0.1`, preserving D-WORKFLOW-083.[^register]

#### C. Upstream integration

- Start the regular integration cadence.
- Record conflict and repair cost separately for distribution and ES.
- Re-run identity, endpoint, upgrade, and target-selection checks after merges.

### Phase 8 — Prove the ES-owned interface before replacing RetroArch

**Entry:** The Tier 3 dependency has been resolved explicitly, and the relevant launch/control code has received the agreed review.

**Step 0 first:**

- Define one backend-neutral control and event contract.
- Implement and prove the RetroArch adapter.
- Test lifecycle, focus, input ownership, pause/save/load/quit, screenshot support, notifications/cards, and failure recovery.
- Constrain any network command interface to its intended local boundary.
- Keep advanced RetroArch configuration reachable only as the documented exception the maintainer accepted in #336.[^336]

**Exit evidence:**

- A protocol test suite, including unavailable backend, lost command, stale process/socket, crash, and repeated launch/exit cases.
- Correct state and achievements behaviour.
- Same-guest launch-time and resident-memory comparisons.
- Proof that ES actually supplies the intended in-game interface, not merely that it can send commands.

**Then the runner:**

- Confirm all reference/source licences.
- Prove one software and one hardware-rendered core early, as the final #336 direction requires.
- Expand to the owner-approved core/target matrix.
- Prove save compatibility, achievements semantics, audio/input behaviour, and per-core fallback.
- Switch defaults only when the predeclared benefit and regression criteria pass.

Keep the runner out of process until measurements justify accepting the larger shared crash and resource-ownership boundary. The in-process bridge is an optional later optimisation, not the inevitable end of the first successful spike.

Silent boot can proceed as a separate later change. Its exit evidence must state capture coverage, distinguish firmware/panel behaviour, and demonstrate preserved journal and serial access; a frame classifier alone is not enough.[^340]

---

## Final judgement

The fork does not need a more ambitious 0.0.1. It needs a more precise one.

The strongest parts of the existing plan are the delayed internal rename, retention of upstream hardware work, VM-first discipline, and insistence on preserving player state. The weak point is the assumption that these principles already amount to an executable release contract.

For one maintainer with an assistant, the sustainable shape is:

- **one tightly scoped candidate at a time;**
- **one traceable artifact set;**
- **a bounded, explicit approval surface;**
- **regular small upstream integrations;**
- **independent evidence that tests detect failures;**
- **new frontend architecture only after the existing release machinery is trustworthy.**

That gets Rasteratops to an honest 0.0.1 without turning its first release into an infrastructure replacement, a frontend rewrite, and a whole-system assurance claim simultaneously.

---

## Source citations

All hashes below are **sha256 values verified at embed time by the Facilitator**, not hashes independently recomputed for this analysis.

[^338]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md` — sha256 `371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba`. Relevant passages include Phases A–D; the RAM/build-box corrections and final two-Tiny plan; the visible-rename decision; the mail rules and masking incident; and the 05:14, 05:43, 05:48, and issue-body 05:51 migration/account observations.

[^336]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md` — sha256 `7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2`. Relevant passages include the measured launch times; existing RetroArch-dependent features; the 23:12 architecture discussion; the 23:15 RetroArch-first revision and hardware-core requirement; and the 23:25 licence findings.

[^337]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md` — sha256 `4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`. Relevant passages include the identity/repository/site acceptance criteria; the POST-based updater description; the GitHub/hosting decision; the Tiny5 and splash implementation comments; and the final panel and artwork specification.

[^339]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md` — sha256 `c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`. Relevant passages include the checked-in line counts, review tiers and packet estimates, Tier 3’s dependency on the libretro work, provenance review, VM-proof wording, and acceptance criteria.

[^340]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md` — sha256 `188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1`. Relevant passages include panel-only silence, retained journal and serial diagnostics, interval frame capture, and the distinction between OS output and panel-controller behaviour.

[^341]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md` — sha256 `433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c`. Relevant passages include the upstream-only policy table, retained fork process, personal-paths policy, and constructed-violation acceptance criteria.

[^334]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md` — sha256 `cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59`. Relevant passages include the licence reading, the public-repository/source-compliance assertion, update/release/container dependencies, and the H700 cross-device testing row.

[^335]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md` — sha256 `7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`. Relevant passages include the release-note read-back criterion, evolving upstream/fork effort discussion, the maintainer’s trust in process, and the dead-page-script blindspot.

[^register]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md` — sha256 `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`. Relevant passages are D-WORKFLOW-082 through 087, especially RC2 commit `69e6039f8f`, the gradual audit commitment, the two-step rename, the completed distribution transfer, and parked upstream submissions. No D-WORKFLOW-088 appears in the supplied extract.

[^claude]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md` — sha256 `846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`. Relevant passages include layered configuration, package pinning, testing/lint guidance, separate ES sources, image-stamp invalidation, retained-state installation checks, VM-first practice, and per-action device consent.

[^license]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md` — sha256 `61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`. Relevant passages are the upstream-branded header, “ROCKNIX Branding,” “ROCKNIX Software,” and “Bundled Works,” including the non-commercial-components notice.

## `corpus.provenance.json`

Inline provenance artifact; no filesystem write, independent file read, or hash computation is claimed.

```json
{
  "corpus_basis": "The full contents of the 11 sources embedded in the request.",
  "verification_basis": "SHA-256 values verified at embed time by the Facilitator and supplied in the source headers.",
  "independent_filesystem_access": false,
  "independent_file_re_read": false,
  "independent_hash_computation": false,
  "source_file_paths": [
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md"
  ],
  "source_file_hashes": [
    "371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba",
    "7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2",
    "4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782",
    "c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a",
    "188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1",
    "433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c",
    "cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59",
    "7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e",
    "63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016",
    "846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677",
    "61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4"
  ],
  "path_hash_alignment": "The two arrays correspond by index in embedded-source order.",
  "gaps_for_orchestrator": [
    {
      "needed_evidence": "Actual updater, release publisher, version-selection logic, and update endpoint contract.",
      "status": "Not embedded.",
      "impact": "Cannot establish that changing the address safely implements adoption, update selection, integrity checks, or recovery."
    },
    {
      "needed_evidence": "Workflow definitions, runner configuration, repository protection settings, credential boundaries, and current operation-specific permission receipts.",
      "status": "Not embedded.",
      "impact": "Cannot verify hosted VM feasibility or isolation of untrusted execution from build and release authority."
    },
    {
      "needed_evidence": "RC2 and candidate artifact manifests, full dependency pins, container digest, build logs, state-migration fixtures, QA receipts, and device coverage matrix.",
      "status": "Not embedded.",
      "impact": "Cannot independently validate release lineage, performance, resource estimates, or claimed test coverage."
    },
    {
      "needed_evidence": "Primary component licence files and notices for the exact distributed versions, including EmulationStation, splash, Tiny5, frontend references, and required corresponding sources.",
      "status": "Not embedded except for the distribution LICENSE.md and quotations in issue records.",
      "impact": "Cannot complete the component-level redistribution and linkage assessment."
    },
    {
      "needed_evidence": "Canonical scoped rules, complete cloud-root compatibility decision D-WORKFLOW-050, audit procedures, and any D-WORKFLOW-088 row.",
      "status": "Not embedded; the supplied register extract contains no D-WORKFLOW-088.",
      "impact": "Cannot assume additional compatibility, audit, or decision requirements beyond those quoted."
    },
    {
      "needed_evidence": "Exact machine memory specification, measured build resource profiles, provisioning blueprint, and current provider quotations with storage and duty-cycle assumptions.",
      "status": "Not embedded.",
      "impact": "Cannot treat RAM compatibility, build-cap relaxation, cloud costs, or two-box throughput as verified."
    },
    {
      "needed_evidence": "Current mail reader/redactor implementation, tests, and authenticated inbound-action design if replies are to trigger jobs.",
      "status": "Not embedded.",
      "impact": "Cannot treat inbox masking or safe job authorisation as established mechanisms."
    }
  ],
  "gap_handling": "Missing evidence is surfaced for follow-up, not represented as inspected content or assigned fabricated paths or hashes. Proposed gates and artifacts are recommendations, not claims of completed execution."
}
```

=== END gpt-analysis.md ===

=== START kimi-analysis.md ===

# Independent analysis: the rasteratops fork plan (#338 and its satellites)

**Council member report — one markdown document, no code changes.**

---

## 0. Corpus, provenance, and gaps

I did not re-read or re-hash any file. The contents above are my read-at-time corpus; the paths and hashes below are transcribed from the Facilitator's per-source embed headers.

`corpus.provenance.json`:

```json
{
  "source_file_paths": [
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md"
  ],
  "source_file_hashes": [
    "371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba",
    "7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2",
    "4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782",
    "c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a",
    "188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1",
    "433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c",
    "cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59",
    "7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e",
    "63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016",
    "846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677",
    "61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4"
  ],
  "hashes_verified_at": "embed time, by the Council Facilitator; not re-computed by this member"
}
```

**Gaps surfaced to the orchestrator** (things the sources cite but the corpus does not contain):

1. **Issue #340's "first comment" does not exist in the embed.** The issue body says *"What exists today is in the first comment (the kernel command line the bootloaders write, where the splash runs and what may draw after it, what shutdown prints)"* (issue-340.md) — no comments follow. Either it exists on GitHub and was not embedded, or it was never written. #340 cannot start without it.
2. **The register excerpt is partial by design** (D-WORKFLOW-080–088 only). The sources cite D-WORKFLOW-050 (the cloud folder's "read both"), D-WORKFLOW-066/071/074/078/079, D-QA-007/012/015/017/044/048, D-UI-022/039/042/045 and D-CLOUD-098; I know these only through the citing passages.
3. **The updater's implementation** (`rocknix-update` and its configuration), the splash renderer's source (`rocknix-splash`'s `main.c`), the workflow files under `.github/workflows/`, `tools/vm-qa`, `tools/time-to-play`, `tools/fork-publish-release`, the EmulationStation fork's tree, and the site checkout are all described but not embedded. Every claim I make about them is from those descriptions, and I say so where it matters.
4. The current addresses of the EmulationStation fork and the site repository are never stated in the corpus (only the upstream names `ROCKNIX/distribution` and `ROCKNIX/emulationstation-next`, and the fork's `maxengel/rocknix`).

---

## 1. Summary judgment

The plan's spine is sound and its evidentiary discipline is unusually high: the name sweep is measured (*"the name is in 3,485 file names and 1,229 files' text"* — issue-338.md, Phase A), the build-box decision is priced against three shapes with the failure mode named (*"memory, not disk, is what fails"* — Phase D), the transfer-over-hard-fork call is reasoned from what each carries (*"the 341 issues and their comments are the paper trail"* — issue-338.md, 05:04), and failures are recorded honestly (the spent launch code printed once, 05:02; the token's 403s, 05:43). I am not asked to re-litigate the fork, the name, the no-community posture, the runner direction, or the upstream-merge strategy, and I do not.

What the plan actually lacks is narrower and more dangerous than its breadth suggests:

- **Phase A's checkboxes omit the critical path they sit on**: the splash repository (a fourth repo, missing from Phase B's list of three), the EmulationStation fork's transfer and pin move (the two interface strings live in ES, so no ES transfer → no renamed image), and above all **the updater**, whose mechanism is described two contradictory ways in the corpus and whose asset-naming contract can silently strand every RC2 device at the moment 0.0.1 renames the assets.
- **Elapsed time is underestimated**: "about a day" of work sits on top of "a cold rebuild of four devices is a day on one box" and "the rename … mean[s] full rebuilds" (the plan's own comments).
- **Several decisions were taken in chat and never written back**: the second flagged choice is never identified; Phase D's decision owes its register row; the attribution sentence's wording owes one (issue-335.md, prong 2); the version scheme is "proposed", never ratified.
- **Nothing sequences the backlog** (#336, #339, #340, #341, the site) against one builder, one QA fleet, and one maintainer's yeses.

The fork's saving grace is that its installed base is four devices and one forgiving user: **0.0.1 is the cheapest moment in the project's life to break the updater, the cloud folder, and the splash — and the plan should be restructured to break them now, deliberately, behind gates, rather than discover them later.**

---

## 2. Claims that are wrong, unproven, or contradicted by the sources

### C1. "About a day of work plus the artwork" understates Phase A by a factor of two to three

The claim: *"## Phase A: the identity, 0.0.1 (about a day of work plus the artwork)"* (issue-338.md).

Against it, from the plan's own comments: *"a cold rebuild of four devices is a day on one box, half on two"* (00:09) and *"the libretro work and the rename each mean full rebuilds"* (00:22). The rename changes `distributions/<name>/options` and `version` (Phase A checkbox), which are sourced into every package's build environment — that is why the rename forces full rebuilds. Phase A's exit requires *"the four images from one head; vm-qa, the rehearsal from RC2 …, the devices on a yes"* — i.e., a day of builds, a vm-qa run, a rehearsal, and four device windows gated on the maintainer's yeses, after the day of work. CLAUDE.md concurs: *"A first build needs ~200GB disk and hours; cached rebuilds take minutes."*

**Verdict:** a day of agent labour is plausible; elapsed time is two to three days on one box, and the artwork is *not* on the critical path at all since *"a plain wordmark stands in until then"* (Phase A). Restate the phase as labour vs. elapsed, or every downstream date inherits the error.

### C2. "The updater pointed at the fork's own releases" is a checkbox with no mechanism behind it

The checkbox (issue-338.md, Phase A) assumes re-pointing is a configuration change. The corpus describes the updater two different ways:

- *"the update server (rocknix-update reads ROCKNIX's GitHub releases; a fork points it at its own)"* (issue-334.md, licence read);
- *"the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there"* (issue-337.md, 23:46).

These are different architectures. If the second is true, the fork owns no endpoint, and a GitHub releases page does not answer POSTs — so the checkbox requires either a service the plan never scopes or a patch to `rocknix-update` the plan never names. #334 itself lists the update server among the things *"the licence does not cover at all, and a standalone fork has to provide for itself."* Furthermore, the rehearsal as described — *"the rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state)"* — proves state retention across an upgrade; it does not state that the update was **offered and applied by the updater itself** (the manual path is `scp`-ing the tar to `~/.update` — CLAUDE.md). And the asset-rename trap: RC2's updater was built against `ROCKNIX`-/`rocknix`-named release assets and the old tag convention; 0.0.1 ships *"under the new tag prefix and name"* (issue-337.md, item 4). If the updater matches assets by name pattern, RC2 devices will not see 0.0.1 at all.

**Verdict:** unproven, and it is the single most important thing to nail before 0.0.1, because the updater is the fork's only channel to its installed base. The mechanism must be read from the tree, documented, and the rehearsal must exercise the real updater end to end (see R1).

### C3. "In exactly this much a player reads" is asserted, not shown — and the list has visible holes

The claim: the name is *"in exactly this much a player reads: `DISTRONAME`, `/etc/os-release`, the info screen, the boot splash, the logo, two interface strings (`ENABLE ROCKNIX SCREENSHOT`, the cloud folder sentence naming `/ROCKNIX`) and eleven printed lines in the scripts"* (issue-338.md, Phase A).

Surfaces a player reads that are not in the list: the GENERIC_X64 **boot menu and installer** (the fork changed `scripts/image`, `scripts/extract`, `scripts/build_distro` for BIOS boot and the installer — issue-334.md, AGENTS table row C), the device's **hostname and SMB share name** as they appear on a network, the serial/SSH greeting, the **release asset filenames** (a downloading player reads them), and whatever the updater prints while updating. Some of these may derive from `DISTRONAME` and be covered transitively; the corpus does not show that derivation.

**Verdict:** probably right, but "exactly" must be proven on the booted 0.0.1 image by a residue audit (every remaining `ROCKNIX` occurrence classified player-visible or internal-path), not trusted from a host-side grep. The audit is cheap; make it a gate.

### C4. The Phase B sweep's completeness is unproven: 24 files expected, 15 swept, recipes never mentioned

- *"24 files under `tools`, `.githooks`, `.claude` and `.github/workflows` name `maxengel/rocknix`, `ROCKNIX/distribution` or `ROCKNIX/emulationstation-next` and change with the transfer"* (issue-338.md, 00:05).
- *"`maxengel/rocknix` becomes `rasteratops/distribution` in 110 files of the tree, of which the `--repo` lines in the tools and rules are the ones that matter; the work logs and register rows are records and keep the old address"* (05:02).
- *"the old address is swept out of the tools' `REPO` constants, the rules, the skills, the push guard's header, the runner's example in `fork-generic-x64.yml` and both agent files (`1633cbcac2`, 15 files; `rules-check` and `register-check` pass)"* (05:14).

Fifteen files were swept; twenty-four were expected to change; the other nine are never classified (true upstream references, which correctly stay, or misses). More importantly, the sweep's scope — *"the tools, the rules, the hooks and the workflows"* (Phase B) — does not include **package recipes**: the EmulationStation package fetches the ES fork (`projects/ROCKNIX/packages/ui/emulationstation/package.mk`, per CLAUDE.md's gotcha) and the splash package pins `ROCKNIX/rocknix-splash` by commit (issue-337.md, 01:38). Redirects keep those fetches working today; a redirect is not an address.

**Verdict:** the record does not prove the sweep complete. Phase B needs an enumeration of the 24, a classification of each, and a recipe-URL pass — all greppable, all cheap.

### C5. "The fork's checks already run there" conflates two different things

Phase C: *"The host-side suites (the script harness, prose, register, box, vocabulary, the page tests, `pr-stack-check`) on GitHub-hosted runners on every push -- the fork's checks already run there."* What the corpus shows running in CI is `fork-checks.yml`, `fork-wordlist.yml` and the "fork record checks" (05:04, 05:14) — not the seven named suites. And `pr-stack-check`'s subject — the upstream PR series — is *"parked, not cancelled"* (D-WORKFLOW-087), with #341 retiring the series map for fork work. Listing it as an every-push CI suite contradicts the parking.

**Verdict:** partly true. The checkbox should name which suites exist as workflows today and which are to be added, and drop or re-scope `pr-stack-check`.

### C6. Phase D's numbers drift between the checkbox and the comments

Checkbox: *"about 90 GB of root; four devices plus the source cache is about 400 GB"* (Phase D). Later: *"a device's build root is 110 to 147 GB, the source cache 38 GB"* (00:24) — i.e., 478–626 GB, not ~400. CLAUDE.md says ~200 GB for a first build. The decision (4 TB NVMe each — 00:25) absorbs the error, so this is immaterial to the outcome; but Phase D's checkbox demands *"the decision as a register row, with the price and the shape"*, and the row should carry the corrected numbers, not the stale ones.

### C7. "Two choices are flagged for the maintainer before the council sits" — only one is ever labelled

The intro (issue-338.md) promises two flagged choices; the body labels only *"Choice 1 (flagged): a brand rename, not a path rename."* The second is never identified (the build-box shape? the cloud provider?). Both were in fact settled in chat — Choice 1 by *"I think the code-level rename can wait"* (01:39 → D-WORKFLOW-085), the build box by *"Then the second Tiny is the purchase"* (00:24) — but a packet that says "two choices" and flags one is a documentation defect, and Phase E promised the council *"the two flagged choices and the numbers."*

### C8. The organisation's "two owners" are one human

*"The `rasteratops` organisation has two owners (…; one owner is a lockout)"* (Phase B). The invitation came *"from @pixelelated"* (05:02) — the maintainer's other identity (#337: *"pixelelated", where I own the domain as well*). The two-owner requirement is met nominally; the recovery value of the lockout account is real; but the record should not read as if two people can approve org-level actions. Related: the corpus asserts *"GitHub's terms allow one machine account per person for automation; this is that account"* (02:08) — true for `rasterabot`; the standing of a second *personal* account (`maxengel` + `pixelelated`) under the same terms is the maintainer's pre-existing situation, not the plan's, but worth one line in the register so it is a known posture rather than an assumption.

### C9. #341 contradicts itself on the personal-paths guard

The table retires the guard *"for the fork's own repositories -- the records and the tools are the project's, in its tree, in the open"*; the acceptance criterion says *"the hook's `pr/*` scans keep only the personal-paths and credential checks the fork still wants."* Which personal-paths checks the fork still wants is defined nowhere. The credential/secret scans must survive in any reading — the launch-code slip (*"the eight-digit code appeared once in the session's transcript. It was spent"* — 05:02) is the fresh proof of why. **Verdict:** resolve explicitly in the relaxation change; do not leave it to the implementer's taste.

### C10. #339's tier-3 ordering is right for the runner and wrong for step 0

*"The libretro work (#336) will change its launch path, so this tier is read before that work starts"* (issue-339.md, tier 3). But #336's step 0 — *"RetroArch with its menu and on-screen text turned off, driven from EmulationStation over its command socket"* — is measured in *"days"* (issue-336.md, 23:15), while tier 3 is 185,000 lines, *"fifteen packets"* a seat. Reading fifteen packets × two seats before a days-long step 0 inverts the value order; step 0 is also the baseline the runner is measured against, so delaying it delays the measurement that justifies the runner. **Verdict:** re-scope — tier 3 gates step 1 (the runner's build-out), not step 0.

### C11. "ES does not know which ran" collides with the fork's own least-surprise law

*"the choice is per core in the launcher, and ES does not know which ran"* (issue-336.md, step 1). The runner deliberately gives up *"rewind … shaders and filters, the rich input remapping"* for routed cores (the same issue's RetroArch-dependency list). A player who uses rewind on a routed core loses it silently the day the routing flips — a direct least-surprise violation (D-UI-042, cited in CLAUDE.md), and a QA problem too: *"Kept behind a per-core switch with RetroArch as the fallback, a merge that breaks the runner costs nothing a player sees"* only works if someone can force the fallback. **Verdict:** the direction is settled and I do not reopen it; but the per-core switch needs a player-visible override row in ES (advanced, defaulting to the runner) before step 1 ships. That is an execution detail and an owner's taste call (Q7).

### C12. "Carry the first three" does not specify the state contract, and the achievement state can split-brain

The fork's work rests on *"the save-state manager (RetroArch's state files, the Auto slot and the launcher's state-file contract)"* and *"the offline achievements (rcheevos inside RetroArch, the proxy in front of it)"* (issue-336.md). The runner must *"carry the first three or the fork's own features stop."* Two things are unspecified: (a) save-state **paths and naming** — state *contents* are the core's own serialize data and are portable across frontends for the same core build, but the paths are the frontend's, so the runner must adopt RetroArch's exact layout or the save-state manager and the Auto slot break per core; (b) **rcheevos state** — the offline-achievement queue and progress live in RetroArch's rcheevos integration; `rc_client` keeps its own state. With per-core routing, a player can end up with two achievement integrations behind one proxy and in-flight offline unlocks stranded on the wrong one. **Verdict:** "carry" must be specified to the level of file paths and state migration, in #336's acceptance criteria, before step 1.

### C13. Phase A's first checkbox contradicts D-WORKFLOW-085 on the `distributions/` directory

The checkbox: *"`distributions/<name>/` with `options` (`DISTRONAME`)…"* — a renamed directory, matching #337's original *"`distributions/ROCKNIX/` becomes `distributions/pixelelated/`"*. The register: *"the visible identity changes whole and the internal paths stay as upstream has them"* (D-WORKFLOW-084's working reading), refined by *"the code-level rename of the internal paths and script names is wanted and comes later"* (D-WORKFLOW-085). The directory is five files (*"options sets `DISTRONAME`, `version` sets `DISTRO_VERSION` and `OS_VERSION`, `logos/rocknix-logo.png`, `kernel_options`, `config/functions`"* — issue-337.md, 23:46), and upstream bumps `distributions/ROCKNIX/version` every release, so renaming it buys a small recurring merge surface; setting `DISTRONAME=rasteratops` inside the existing directory buys none. Both readings are defensible; the checkbox and the register currently disagree, and Phase A cannot start cleanly until the owner picks (Q2).

---

## 3. Risks, ordered by expected cost

Ordering logic: proximity × probability × impact. The first is imminent and gates the fork's first release; the second is the largest cumulative cost over a year.

| # | Risk | Likelihood | Impact | Horizon |
|---|------|-----------|--------|---------|
| R1 | Updater / release channel breaks at the 0.0.1 boundary | Medium | High | Immediate |
| R2 | EmulationStation divergence compounds until merges stop being cheap | Near-certain | High (cumulative) | Months |
| R3 | Player-data continuity in the cloud-folder rename | Low–medium | High | Immediate |
| R4 | Token/runner security: the assistant's Workflow-write token + self-hosted runners on a public repo | Low | High | Standing |
| R5 | Sustainability: one maintainer, four devices, five concurrent workstreams | High | Medium | Standing |
| R6 | Upstream/build-system dependencies: image scripts, the build container, upstream's future | Medium | Medium | Standing |
| R7 | Licence/attribution defects in the 0.0.1 artifacts | Low | Medium | Immediate |
| R8 | Bus factor: one human holds both owner accounts, the 2FA secrets, and the renewals | Low | Total | Standing |
| R9 | Hosted-runner VM QA becomes a flaky gate | Medium | Low | When relied on |
| R10 | Attribution integrity on the shared checkout | Low | Low | Standing |

**R1 — the updater and the release channel.** Everything under C2. The fork's entire installed base is the maintainer's devices, which cuts both ways: the blast radius is small, and this is the cheapest moment to find out. The mitigation is not caution but proof: document the updater's actual mechanism from the tree; decide endpoint-vs-direct-read (Q1); rehearse RC2 → 0.0.1 **through the updater** on a guest, including the asset-naming and version-comparison questions (`0.0.1` vs `rc2-20260929` — which does the updater consider newer? The corpus does not say). Note the licence dimension: a fork whose devices update from ROCKNIX's channel is inside *"suggests the licensor endorses you"* (LICENSE.md; issue-334.md's reading), so the re-point is not optional.

**R2 — the EmulationStation fork.** The fork carries *"+42,180"* lines on ES (issue-339.md; issue-335.md's *"+28,359"* is a second, unreconciled number — the tier-3 scoping should fix which). #336 names the cost itself: *"the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge."* Every upstream ES merge is a three-way merge across that delta, and step 3 (the in-process bridge) would make it near-permanent. The plan's mitigations are correct — the socket protocol (*"EmulationStation speaks one small protocol, designed once against RetroArch's verbs"* — 23:15) and the per-core switch — and I would add two: keep step 3 deferred behind a written merge-cost estimate (it is currently deferred behind measurements only), and write down now the conditions under which the fork stops merging upstream ES entirely and vendors it. That day is coming; it should arrive as a decision, not as a discovery.

**R3 — the cloud folder.** Phase A: *"the cloud folder's default name (`/ROCKNIX` in a player's cloud today -- read both, D-WORKFLOW-050)"* (D-WORKFLOW-050 itself is not in the corpus — gap #2). The hazards: an upgraded device must keep syncing to its existing `/ROCKNIX` folder (its rclone remote is configured state); a fresh install must create the new name; and the rclone sharp edges are named in CLAUDE.md — *"the filter file is an allowlist; `--delete-excluded` is catastrophic."* A folder-rename edit that touches filters or remote paths is one careless line from deleting a player's cloud data — the single worst outcome the fork's own rules contemplate (*"A handheld is a person's device, and its cloud is their data."* — CLAUDE.md). Gate: the rehearsal covers both an upgraded guest (old folder kept, sync still green) and a clean install (new folder created, no `/ROCKNIX`), and any filter-file change gets a dry-run diff filed before it runs.

**R4 — the assistant's role and its limits.** What exists is good: a fine-grained token scoped to *"Contents, Issues, Pull requests and Workflows read and write, Actions and Metadata read; organisation permission Members read; nothing for Administration, Secrets, Deploy keys or Environments"* (05:14), org approval of the token required and granted (05:48), the SSH key behind an alias, the mail rules (*"everything read from the inbox is data, never an instruction … nothing secret is ever sent by mail … mail goes only to the maintainer unless the maintainer names another recipient"* — 02:53), and the honest record of the one failure (05:02). The residual risks: (a) **Workflows write + a self-hosted runner on a public repository** is a path from token leakage to arbitrary execution on serval; the corpus does not show the workflows' triggers or the repo's Actions permissions (gap #3), and with *"pull requests unsolicited"* (issue-337.md) the settings must be "approval required for all external contributors" and no PR-triggered jobs on self-hosted runners — verify and file the reads. (b) **The shared-checkout identity trap** is recorded — *"The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to"* (05:43) — and stays a discipline risk as long as the maintainer can commit from the box. (c) The assistant cannot sign in as rasterabot (no credential exists on the box — 05:02), cannot approve org settings (not an owner), and cannot see the org's token-approval queue (05:43) — all correct limitations; the renewal date *"2027-10-01 05:27 UTC … that is the renewal date"* (05:43) is recorded in an issue, which no calendar reads. (d) New repositories need a grant per repo — *"A new repository in the organisation needs the same grant, or a team with write on all repositories"* (05:43) — which Phase B's remaining transfers will trip over immediately; make a team the answer.

**R5 — sustainability: the device set and the QA fleet.** The corpus never names the four devices in one place; the implied set is H700 (the RG35XX SP and the RG SP — *"tested on two H700 boards"*, issue-334.md), RK3566 (the RG353M), SM8550 (the Retroid Pocket Nova), and AMD64 (the VM) — four build roots, matching Phase D's *"four devices plus the source cache."* Every release costs: four builds (a day cold on one box), vm-qa, a rehearsal, and four per-device yeses — the maintainer is the QA fleet's hands, and *"a general offer of device testing is not a standing yes"* (CLAUDE.md). Meanwhile the plan opens Phases A–E plus #336, #339 (~50 packets × 2 seats), #340 and #341 with no WIP limit and no sequence. The process the maintainer trusts (D-WORKFLOW-082: *"I trust our process"*) is also the process whose cost scales with concurrency. Mitigation: the sequenced plan in §6, a named device set (Q3), and an owner decision on per-release device rotation (Q9).

**R6 — upstream and build-system dependencies.** (a) The fork permanently carries the GENERIC_X64 target inside upstream's build engine (*"`scripts/image`, `scripts/extract`, `scripts/build_distro` changed"* — issue-334.md), so every upstream touch there conflicts; the merge cadence gate must include a GENERIC_X64 build specifically. (b) The build container is *"`ghcr.io/rocknix/rocknix-build` (public, usable, not ours to keep current)"* (issue-334.md) — an unowned, unversioned dependency of every build; mirror and pin it under the org. (c) Upstream's device work is *"upstream's largest continuing contribution and the reason to keep merging `upstream/next` whatever else is decided"* (issue-334.md); if upstream goes private, stalls, or restructures `projects/`, the fork's hardware support freezes at the last merge. The fork supports only devices the maintainer owns, so this is survivable — but the merge cadence (missing entirely, §4) is also the fork's security-update channel, which makes its absence a standing risk, not an inconvenience.

**R7 — licence and attribution at 0.0.1.** The obligations are clear and the plan meets them in intent: GPL-2 / MIT preserved (*"Original software and scripts developed by the ROCKNIX team are licensed under the terms of the GNU GPL Version 2"* — LICENSE.md), the branding's CC BY-NC-SA honoured by replacement rather than reuse, the attribution line on the release (Phase A; the wording owed a register row per issue-335.md prong 2). The residual defects to guard: derived theme assets must carry the ShareAlike notice if they derive from ROCKNIX's artwork; Tiny5's OFL notice must ship with the font files *if the font files themselves are redistributed* in the tree (*"an image rendered with it carries no obligation"* — issue-337.md, 01:38); and *"This distribution includes components licensed for non-commercial use only"* (LICENSE.md) means the struck sponsorships (D-WORKFLOW-081's refinement) are not merely preference — any future monetisation is licence-blocked twice over, which the identity register row should say.

**R8 — bus factor.** Both org owners are one person (C8); the authenticator secrets live with the maintainer (02:08); the tokens live on one box at 0600. The lockout account is the right shape; what is missing is a written recovery path (where the secrets are, what to re-mint) and the renewal reminder. Cheap to fix; total if needed and absent.

**R9 — hosted-runner VM QA.** The experiment is properly hedged (*"measured once before it is relied on"* — Phase C). Two things the hedge doesn't say: hosted runners are 2–4 vCPU shared machines, so **time-to-play numbers measured there are meaningless** against the guest-d baseline (*"1.05 s … 2.03 s"* — issue-336.md) — hosted VM QA can prove boot and flows, never timing; and the *"image arrives as a release artifact (2 GB)"* coupling means these suites can run on release tags, not on every push. Keep it an experiment; never let it gate a release.

**R10 — attribution integrity.** Covered under R4(b); the mitigation is the maintainer committing from elsewhere or overriding identity per command. Already recorded as the known no.

---

## 4. What I would change

**Order.** Phase B is mostly executed already (transfer, sweep, tokens — 05:14), so the orderable remainder is: **finish the migration's mechanical tail first** (ES fork + site transfers, the splash fork, the sweep verification, the recipe re-points, the security settings, the container mirror), **then Phase A**, because Phase A's image build needs the ES fork's new home (the two interface strings are ES source) and the splash fork's pin, and 0.0.1's recipes should point at final addresses rather than redirects. #341 lands immediately after the transfers complete (its gate — *"After the repositories are transferred (#338 Phase B)"* — and D-WORKFLOW-087 both say so). The second box executes in parallel on calendar time and gates nothing. The backlog sequences as: 0.0.1 → #341 + site → tier 1 + #340 as 0.0.x → step 0 as 0.1 (per the proposed version scheme, issue-337.md 23:46), tier 3 before step 1 (re-scoped per C10).

**Gates.** Phase A's exit must add: the updater rehearsal through the real updater (R1); the name-residue audit on the booted image (C3); the cloud-folder both-read proof (R3); time-to-play parity beside RC2's numbers; the attribution/notices checklist (R7). Details in §6.

**Scope — what to cut from 0.0.1:** the animal logo (the wordmark ships; *"a plain wordmark stands in until then"*); the site (Choice 1's "visible identity" lists it, but Phase A's checkboxes do not — make that explicit and defer to 0.0.x); silent boot (#340 → 0.0.x); the runner (#336 → 0.1); the hosted-VM CI experiment; the second box. Nothing else: Phase A is otherwise right-sized, and the updater work is **not** cuttable — it is the difference between a fork and a reskin that still phones home.

**Amendments to the satellite issues:** #336's acceptance criteria gain step 0 as a deliverable with its own gates (it exists only in a comment, 23:15), the state-contract requirement (C12), and the override-row decision (C11); #339's tier 3 re-scoped (C10); #341's sweep extended to CLAUDE.md (which still says *"User-facing behavior changes need a follow-up docs PR to the separate `ROCKNIX/rocknix.org` repo"* — wrong for the fork, whose site is its own) and to the tree's `AGENTS.md`, and the personal-paths tension resolved in writing (C9).

---

## 5. What is missing entirely

1. **The updater's contract, documented**: mechanism (endpoint vs. releases read), asset-naming convention, version comparison, and the hosting decision if an endpoint is needed. The plan's biggest hole (C2/R1).
2. **The fourth repository.** Phase B lists three; the splash is a fourth and cannot be transferred (the maintainer does not own `ROCKNIX/rocknix-splash`) — it must be forked, per issue-337.md 01:38, which #338 never mentions. The sibling naming already anticipates it (*"`rasteratops/splash`"* — 05:02).
3. **The build-container mirror/pin** (R6b).
4. **The Actions/runner security posture** for a public, no-contributors repo with self-hosted runners and a Workflow-write token (R4a).
5. **The owed register rows**: the build-box decision (Phase D's own checkbox), the version scheme (proposed in #337, never ratified), the runner's direction row (#336's acceptance: *"written the session the maintainer calls it"* — D-WORKFLOW-084/087 called it), the attribution sentence's wording (issue-335.md prong 2), the merge cadence, and the personal-paths resolution (C9).
6. **An upstream-merge cadence and its gate** — who merges `upstream/next`, how often, proven by what. The fork's hardware support and its security updates both arrive by this road, and no phase owns it.
7. **The site**: hosting, DNS, and a phase. `rasteratops.com` exists and serves mail (04:39); the site is #337's acceptance criterion and no phase of #338 builds it.
8. **Tracker triage**: 135 open issues (05:14) include the parked upstream programme (#322's stack, #335's prong-1 checkboxes) with no labels saying so; the paper trail (D-QA-012) is only useful if the dead branches are marked.
9. **The second flagged choice** (C7).
10. **#340's current-state comment** (gap #1) — the issue cannot start without it.
11. **A device-support statement** on the release page: which devices 0.0.1 is built for and which it was proven on.
12. **The fresh-box provisioning checklist** made verifiable: the *"build-box blueprint"* (00:25) must include `.githooks` installation (the push guard is local; a clone without it is unguarded) and the token/SSH layout, so the second Tiny is provably identical, not assumed so.
13. **The token-renewal reminder** for 2027-10-01 (R4c) — the mail channel the maintainer just built is the natural mechanism (*"A promise is not a mechanism"* — 02:53).
14. **Image signing beyond `.sha256`** — the current convention authenticates nothing against a compromised release page. Not 0.0.1; worth a parked issue.

---

## 6. Questions only the owner can answer

1. **The updater**: patch `rocknix-update` to read the fork's GitHub releases directly (no service to run), or run a small endpoint (the site? a Vultr box, per your stated preference)? *Unblocks: Phase A's updater checkbox, the rehearsal's design, R1.* (Reading the current mechanism from the tree is agent work; running a service is your cost and provider call.)
2. **`distributions/`**: rename the directory in Phase A (the checkbox's literal reading) or keep `distributions/ROCKNIX/` and set `DISTRONAME=rasteratops` inside it (D-WORKFLOW-085's reading)? *Unblocks: Phase A's first checkbox, NAMING.md, the merge-cost profile.* (C13.)
3. **The device set**: exactly which targets does 0.0.1 build and support — the implied four (H700, RK3566, SM8550, AMD64) — and should the primary build set be trimmed to match? *Unblocks: the build matrix, the release page's support statement, the per-release QA cost.* (R5.)
4. **External issues**: are strangers' bug reports welcome (triaged), or is the tracker the project's own, with `CONTRIBUTING.md` saying so? *Unblocks: Phase B's last checkbox, the mail channel's bug-report promise (02:53), the triage line in the sustainability budget.*
5. **The logo**: ship 0.0.1 with the Tiny5 wordmark now and the triceratops when you draw it? *Unblocks: the release date.* (The plan already allows it; confirm so the artwork stops being a silent dependency.)
6. **The site**: hosted where (GitHub Pages on the org, Hostinger beside the mail, a Vultr box), and is it 0.0.x or 0.1 content? *Unblocks: #337's remaining acceptance criterion and the DNS work.*
7. **The runner's fallback**: when a core routes to the runner, may the player see and override it (an ES row, defaulting to the runner), or must routing stay invisible? *Unblocks: #336 step 1's design and QA's ability to force RetroArch.* (C11.)
8. **The cloud folder**: fresh installs get the new default, upgrades keep their configured `/ROCKNIX` — confirm, and name the new default. *Unblocks: Phase A's cloud checkbox, the rehearsal's cloud case, the release-note wording.* (R3.)
9. **Device QA per release**: every device every release, or VM + one rotating device per 0.0.x with all four at minor-version boundaries? *Unblocks: the sustainable release cost.* This relaxes the current gate, so it is yours alone. (R5.)

---

## 7. The recommended plan

### Phase 0 — finish the migration (the rest of Phase B). Days: 1–2.

**Entry:** this report applied; Q2, Q3, Q4 answered (Q1 may gate Phase 1's end rather than its start).

**Work:** transfer the ES fork and the site repo; fork `ROCKNIX/rocknix-splash` into the org; create a team with write on all org repos for rasterabot (per 05:43's grant lesson); sweep pass two — enumerate the 24 files of the 00:05 comment, classify each (swept / record / true-upstream-reference), and re-point the ES and splash recipe fetch URLs (commit pins unchanged); secrets and variables inventory on all repos; Actions hardening (approval for all external contributors; no PR-triggered jobs on self-hosted runners); mirror `ghcr.io/rocknix/rocknix-build` to the org pinned by digest; `CONTRIBUTING.md` and the PR template per Q4; tracker triage of upstream-era issues; the owed register rows (build box, version scheme, attribution wording, merge cadence).

**Exit (agent-verifiable):** `gh api repos/rasteratops/{emulationstation,<site>,splash>` each return 200; the old addresses redirect (`gh api repos/maxengel/rocknix --jq .full_name` reads `rasteratops/distribution`, and the ES equivalent); the 24-file classification table filed; `grep -rn "maxengel/rocknix" -- tools .githooks .claude .github` filed with every hit justified; the ES and splash packages re-fetch from the new addresses (the fetch logs' URL lines filed); `gh secret list` / `gh variable list` filed; `gh api repos/rasteratops/distribution/actions/permissions` filed showing the approval setting; the mirrored container's digest filed; `tools/box-check` 0 fail, `tools/rules-check` and `tools/register-check` PASS; the register rows' IDs filed.

### Phase 1 — 0.0.1: the visible identity. Days: 2–3 elapsed on one box.

**Entry:** Phase 0 exit; Q1, Q2, Q8 answered. The artwork is **not** an entry condition.

**Work:** the Phase A checkboxes as written, plus: `NAMING.md`; the splash fork's `svg_paths[]` replacement and the two renderer changes (*"the drawing's own box instead of 1284:500, and the scale rounded down to a whole number"* — issue-337.md, 02:03); the ES fork's two strings and the theme's logo text, with both recipe pins moved to the forks' commits; the updater change per Q1; the cloud-folder both-read; the attribution line in README and release notes; OFL/CC notices where files ship.

**Exit (agent-verifiable):** four images from one head — the head commit and the four `BUILD_ID`s filed; guest d boots 0.0.1 with a splash frame at 640×480 whose cells are measurably square (the floor-scale proof), and a 1280×960 composition proof for the Nova's size; `/etc/os-release` and the info screen read the name and `0.0.1` (the lines filed); **the residue audit** — every `ROCKNIX` occurrence on the booted guest (hostname, SMB, os-release, boot menu, installer screens, ES strings, updater output) classified, zero player-visible hits, the table filed; vm-qa full PASS with the suite lines filed; `tools/time-to-play`'s two numbers beside RC2's 1.05 s / 2.03 s on the same guest, no regression beyond noise; **the rehearsal through the real updater** — an RC2 guest is offered and applies 0.0.1, state kept, the cloud remote still on its pre-existing folder, the updater's log filed — plus a clean-install guest whose first boot creates the new folder and no `/ROCKNIX`; the named devices flashed on per-device yeses with a boot frame each; the release drafted with the attribution sentence and the device-support statement, the maintainer's explicit yes, published as `0.0.1`, and `gh release view 0.0.1 --json body` reads the sentence back.

**Cut:** the animal logo, the site, silent boot, the runner, hosted-VM CI, the second box.

### Phase 2 — the fork's own process (#341) and the site. Days: 1–2, overlapping Phase 1's build windows.

**Entry:** Phase 0 exit. **Exit:** #341's acceptance met *and* the CLAUDE.md/AGENTS.md pass done (the `rocknix.org` docs-PR rule re-scoped); the constructed-violation proofs re-run with the still-refusing scans named (the credential scans first); the site builds under `rasteratops.com` with the attribution on its front page, the build log's last line filed; each relaxation with its register row citing the relaxed one.

### Phase 3 — the estate: the second box and the CI topology. Calendar-time, parallel.

**Entry:** the purchase; Phase 0's security settings are a hard entry for registering any runner. **Exit:** the new box builds one device from a clean checkout (the log's last line and the `BUILD_ID` filed) and runs vm-qa to PASS on serval's 0.0.1 image; a four-target cold build split across both boxes with the wall-clock filed beside the one-box day; the hosted-runner VM experiment measured once and its verdict filed (KVM present, runtime, boot-only signal — timing explicitly not relied on); the CI-topology register row.

### Phase 4 — 0.0.x: review tier 1, silent boot, fixes.

**Entry:** 0.0.1 published; #340's current-state comment written. **Exit:** the tier-1 audit folder complete (*"the six phase files, both seats' packets under `second-opinions/`, `tools/lint-audit-artifacts` PASS, and a punch-list issue"* — #339); #340's four acceptance boxes ticked (the frame-series PASS lines for boot, shutdown and restart; the journal-completeness read; the serial answer; the two device-facts rows); each 0.0.x released on Phase 1's gates, including the updater rehearsal from the previous release.

### Phase 5 — 0.1: step 0, then the spike.

**Entry:** tier 1 done; the version scheme ratified; #336's acceptance amended (step 0, the state contract, the override row per Q7). **Exit:** step 0's frames and parity numbers filed (every core kind, achievements and netplay working — #336's own claim for step 0, so the gate is zero feature regression); the spike record with the licences quoted from their trees, including MinUI's absence (*"a reference to read, not code to copy"* — issue-336.md); the three-way time-to-play table (RetroArch today vs. step 0 vs. the runner) on the same guest; the direction register row. Tier 3 completes before step 1's build-out continues.

### Phase 6 — standing: the upstream merge.

Merge `upstream/next` on a fixed rhythm (fortnightly, or on device-relevant change), gated on a GENERIC_X64 build + vm-qa PASS + one ARM build; the full four-target QA only at releases. Recorded as a register row. This is the fork's hardware support and its security channel; it is the one recurring cost that may not slip.

---

*End of report. All citations are to the embedded corpus; where the corpus was silent, I said so rather than extrapolate.*

=== END kimi-analysis.md ===

=== START muse-analysis.md ===

# Rasteratops fork plan (#338): independent adversarial analysis

**Corpus as embedded by the Facilitator. I did not re-read or re-hash files myself.**

| # | path | sha256 (verified at embed time) |
|---|------|--------------------------------|
| 1 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md` | `371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba` |
| 2 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md` | `7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2` |
| 3 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md` | `4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782` |
| 4 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md` | `c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a` |
| 5 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md` | `188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1` |
| 6 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md` | `433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c` |
| 7 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md` | `cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59` |
| 8 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md` | `7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e` |
| 9 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md` | `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016` |
| 10 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md` | `846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677` |
| 11 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md` | `61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4` |

Settled and not re-litigated here: the name `rasteratops`, no community / no contributors / no sponsorships, nothing posted to ROCKNIX for now, EmulationStation as the one interface over a libretro runner, hardware support via upstream merges.

**Verdict in one paragraph:** #338 is a checklist, not a plan. It understates Phase A by 3–5×, leaves the hardest engineering — DISTRO/PROJECT split, updater cutover, EmulationStation-fork coordination, cloud-folder migration, merge cadence — as one-line assertions, violates its own Phase E gate by half-executing Phase B before the council sits, and stacks four full-time workstreams (0.0.1 rename, Tier 1–3 audits, runner spike, silent boot + site) onto one maintainer plus one assistant with no order, no staffing model, and no backup/recovery story. 0.0.1 as written will either ship still saying ROCKNIX somewhere a player reads, or slip while the estate is re-provisioned. Cut it to one bootable, updatable, attributable GENERIC_X64 image and prove the release machinery before touching devices, site, runner, or audit tiers 2–3.

---

## 1. Claims and assumptions that are wrong, unproven, or contradicted

### 1.1 "About a day of work plus the artwork" for Phase A

> `issue-338.md`: "Phase A: the identity, 0.0.1 (about a day of work plus the artwork)"
> `issue-337.md`: "A rename is about a day: a `distributions/<name>/` with the four files and a wordmark, `OS_VERSION` as `0.0.1`, the updater's address, the theme patch's text, then the four images rebuilt from one head, the VM suites and the rehearsal, and the devices on a yes."

Contradicted by the plan's own numbers:

- `issue-338.md` comment: "a cold rebuild of four devices is a day on one box, half on two"
- `issue-338.md` Phase A checkbox: "the four images from one head; vm-qa, the rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state), the devices on a yes."
- `CLAUDE.md`: "A first build needs ~200GB disk and hours; cached rebuilds take minutes."
- `issue-337.md` comment: splash "is a separate ROCKNIX repository (`rocknix-splash`, GPL, a small application pinned by commit in `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk`), so Phase A forks that repository into the organisation, replaces its image with the wordmark, and points the recipe at the fork's commit."

A DISTRO rename is not a cached rebuild. Changing `distributions/<name>/options`, `version`, `kernel_options`, `config/functions`, the splash pin, the ES pin, and the updater URL invalidates the image root at minimum and in practice forces full image rebuilds. Four cold images = one day of compute alone, before vm-qa, before the RC2 rehearsal (which itself is a multi-boot upgrade walk), before any device flash (which per `CLAUDE.md` requires "identify the removable card at run time and exclude every system disk; read the raw image back before touching its filesystem; on H700 a fresh card does not boot until the exact device tree is activated as `/dtb.img`"), and before release notes "in the maintainer's voice."

"About a day" counts the edit, not the proof. Realistic: 3–5 days elapsed on one box even if the first build is green, longer if the DISTRO/PROJECT split (1.3) bites.

### 1.2 "Exactly this much a player reads" is unproven and almost certainly incomplete

> `issue-338.md`: "the name is in 3,485 file names and 1,229 files' text on the upstream-bound roots ... and in exactly this much a player reads: `DISTRONAME`, `/etc/os-release`, the info screen, the boot splash, the logo, two interface strings (`ENABLE ROCKNIX SCREENSHOT`, the cloud folder sentence naming `/ROCKNIX`) and eleven printed lines in the scripts."

No method is given. No grep, no frame walk, no string-table dump from the EmulationStation fork.

Counter-evidence in the same corpus:

- `issue-337.md`: "the device pages' names where they say ROCKNIX", "the theme's logo and the splash", "the update URL the updater reads", "a line in the fork's README and release notes"
- `CLAUDE.md`: "User-facing behavior changes need a follow-up docs PR", vocabulary rules, `es-player-text.md` conventions — the ES fork holds thousands of player-visible strings; the claim that only two mention ROCKNIX has not been shown against `es-app/src` + `es-core/src` (184,891 lines per `issue-339.md`).
- Eleven printed lines in scripts: which scripts? Installer? `rocknix-update`? Evidence collector? First-boot wizard? The plan does not list them. If any error path, help text, or `motd`/`os-release` fallback still prints ROCKNIX, the "player-visible identity changes completely" promise fails.

Until there is a mechanical check — build, boot, dump `/etc/os-release`, screenshot info screen + splash + installer + update error + evidence archive name, grep the squashfs for `ROCKNIX` case-insensitively and triage every hit — "exactly" is an aspiration.

### 1.3 The DISTRO/PROJECT split is assumed to work. It may not.

> `issue-338.md` Choice 1: "the player-visible identity changes completely ... and the internal paths and script names stay as upstream has them"
> `decision-register-fork-rows.md` D-WORKFLOW-084: "the visible identity changes whole and the internal paths stay as upstream has them, so the hardware merges keep working"
> `CLAUDE.md`: "options are sourced in order — `distributions/<DISTRO>/options` → `projects/<PROJECT>/options` → `projects/<PROJECT>/devices/<DEVICE>/options`" and "`distributions/ROCKNIX/` — distro identity (version, options, splash)."

The plan assumes you can add `distributions/rasteratops/` while leaving `projects/ROCKNIX/` untouched and everything builds. That is plausible in LibreELEC-derived systems where DISTRO and PROJECT are distinct variables, but:

- The tree has never been built that way. Every released image to date is DISTRO=ROCKNIX + PROJECT=ROCKNIX. No build log in the corpus proves DISTRO≠PROJECT.
- `Makefile` targets in `CLAUDE.md` are `make docker-RK3588`, `PROJECT=ROCKNIX DEVICE=RK3588` — PROJECT is hardcoded in docs, tools, and likely in `config/path`, `scripts/image`, release directory layout, and `DEVICE_ROOT` reuse. If any script assumes `distributions/$PROJECT` or `projects/$DISTRO`, the split breaks.
- `issue-337.md` originally specified "`distributions/ROCKNIX/` becomes `distributions/pixelelated/`" — a move, not a copy. The plan now implies a copy-and-leave (new dir + old dir stays for merges?). Which files does the build read when both exist? What does `upstream/next` merging do when upstream touches `distributions/ROCKNIX/options` and you ship `distributions/rasteratops/options`? You have forked the file; every upstream distro change is now a manual port. That is the opposite of "merges keep working."

This is the single most load-bearing unproven claim in Phase A. It needs one GENERIC_X64 build log, not an argument.

### 1.4 Cloud folder "read both" is a half-specified migration

> `issue-338.md` Phase A: "the cloud folder's default name (`/ROCKNIX` in a player's cloud today -- read both, D-WORKFLOW-050)"

`CLAUDE.md` warns: "filter file is an allowlist; `--delete-excluded` is catastrophic."

"Read both" sounds safe but specifies nothing:

- Read both, write which? If 0.0.1 writes to `/rasteratops` while still reading `/ROCKNIX`, the player's cloud now has two roots that diverge. If it writes to both, every sync doubles traffic and failure modes. If it migrates (copy + delete), a bug deletes a person's saves.
- What about existing rclone remotes, crypt wrappers, case sensitivity on providers, and the "cloud folder sentence" string that names `/ROCKNIX`? Changing the default without a tested upgrade walk on a populated cloud is how you strand saves.
- The rehearsal "proves the upgrade path keeps a player's ROCKNIX-era state" — does that rehearsal include a populated cloud remote, or only `/storage`? Not stated.

This one line can destroy user data. It does not belong in a "day of work" phase without a dedicated design and a VM proof with a fake provider.

### 1.5 Phase B's org checkbox is self-contradictory on 2FA

> `issue-338.md` Phase B: "Ticked 2026-09-30: owners `maxengel`, `pixelelated`; `two_factor_requirement_enabled` reads `true` (owner read, 05:51 UTC)"
> `issue-338.md` comment 05:43 UTC: "`two_factor_requirement_enabled` still reads `false`, so the checkbox stays open on that one fact."
> Same file, 05:14 UTC: "The organisation's two-factor requirement reads `false`."

Either the requirement was flipped between 05:43 and 05:51 with no comment recording who did it and that `members?filter=2fa_disabled` was empty at that moment, or the tick is premature. The plan also says "one owner is a lockout" but names owners `maxengel` and `pixelelated` without saying which is the lockout, where its recovery codes live, or who `pixelelated` is (maintainer's second login? shared? — `issue-337.md` notes `pixelelated` is a name/domain the maintainer owns).

An org-hardening checkbox that cannot say which account is the break-glass and where its codes are is not done.

### 1.6 Sweep counts disagree: 24 files vs 110 files vs 15 files

> `issue-338.md` comment: "24 files under `tools`, `.githooks`, `.claude` and `.github/workflows` name `maxengel/rocknix`..."
> `issue-338.md` comment 05:02 UTC: "`maxengel/rocknix` becomes `rasteratops/distribution` in 110 files of the tree"
> `issue-338.md` comment 05:14 UTC: "the old address is swept out ... (`1633cbcac2`, 15 files; `rules-check` and `register-check` pass)."

All three can be true only if 15 is the "matters now" subset, 24 is the tooling subset, and 110 includes records that intentionally keep the old address. But the plan's Phase B checkbox says "the sweep of `--repo maxengel/rocknix` and the two upstream names across the tools, the rules, the hooks and the workflows (the count is in the plan's first comment)" — pointing to 24, while the actual commit touched 15. Which 9 were left? Are they `.github/workflows` runner examples, skill docs, or live `REPO=` constants? `rules-check` passing does not prove no live reference remains; it proves the checker’s patterns pass.

Needs: one `grep -R` for `maxengel/rocknix`, `ROCKNIX/distribution`, `ROCKNIX/emulationstation-next` across the tree with each hit triaged as code vs record, filed in the issue. Nine files of drift is how Phase C runs against the wrong repo.

### 1.7 "VM suites on hosted runners" assumes KVM + GPU + disk that hosted runners don't promise

> `issue-338.md` Phase C: "Ubuntu hosted runners expose `/dev/kvm`, so `tools/vm-qa` can boot the image there if the image arrives as a release artifact (2 GB) and the run fits the six-hour limit; measured once before it is relied on."

"Measured once" is the only honest clause. The rest assumes:

- `/dev/kvm` present and usable on `ubuntu-latest` today and tomorrow. GitHub does not guarantee nested virtualization; availability has varied by pool.
- 2 GB artifact transfer is cheap. It is not: upload from self-hosted builder + download to hosted tester on every push, plus retention. At several pushes a day this dominates runtime.
- Six-hour limit is enough. `tools/vm-qa` plus `time-to-play` plus visual walks plus rehearsal may fit, but no timing is cited.
- Most important: `issue-336.md` comment: "the first proof runs on guest d, which draws GL through the host's GPU, so the hardware path is proven on the VM before a device sees it." Hosted runners have no GPU. Any GLES/hardware-render proof run there is llvmpipe or fails. The plan would green-light a software-rendered boot and call it VM proof.
- `CLAUDE.md`: "VM disk must be 16GB+ or first boot breaks in a way that looks like a graphics bug." Hosted runner free disk after toolchains is tight; a 16 GB qcow2 + 2 GB image + logs + container may exhaust it.

Experiment is fine. Relying on it for 0.0.1 gating is not. The local box remains the only trustworthy VM prover until the experiment publishes numbers.

### 1.8 Build-root sizes contradict each other by 60%

> `issue-338.md` Phase D: "about 90 GB of root; four devices plus the source cache is about 400 GB"
> `issue-338.md` comment: "a device's build root is 110 to 147 GB, the source cache 38 GB"
> `CLAUDE.md`: "A first build needs ~200GB disk"

90 GB × 4 + cache ≈ 400 GB. 110–147 GB × 4 + 38 GB = 478–626 GB. 200 GB per `CLAUDE.md` (per device? per estate?) is a third number. The "2 TB is the floor, 4 TB matches serval" order guidance survives anyway, but any costing, any "hosted runner cannot hold a 90 GB build root" argument, and any block-storage sizing built on 90 GB is 20–60% low. Measure `du -sh build.* sources target` per device and write the table down; stop estimating.

### 1.9 "Splitting roles relieves memory pressure" overclaims the webkitgtk fix

> `issue-338.md` comment: "webkitgtk at 24 threads killed `cc1plus` twice on 2026-09-19 and is capped to four threads since"
> Later: "serval builds with its whole 64 GB, which also lets the webkitgtk cap loosen."

Freeing 6–10 GB of QA guests does not prove a 24-thread webkitgtk link fits in 64 GB. The failure was per-package parallelism (`-j24` on a huge C++ link), not total-system contention alone. Loosening the cap without a measured high-water mark (`/usr/bin/time -v`, cgroup peak) risks re-introducing the exact failure the cap fixed. Keep the cap until a build log shows headroom.

### 1.10 "Vultr bare-metal or high-memory instance ... technically fine: KVM, NVMe, no lock-in"

> `issue-338.md` Phase D.

No instance type, no price, no region, no test. Unproven:

- Does Vultr bare metal expose nested KVM for `tools/vm-qa`? Many bare-metal and VPS products do; some do not. No citation.
- NVMe size and endurance for 500 GB of churn per cold cycle? Block-storage IOPS and cost for persistent roots "on demand"? No numbers.
- "No lock-in" ignores the real lock-in: the build-box blueprint (`/workspace` layout, container, source cache, worktrees, tokens, SSH config, mail venv). That blueprint is not written down anywhere in the corpus. Moving providers without it is a rebuild from memory.
- The $300–600/month figure (`issue-338.md` comment: "A cloud box at 128 GB is roughly $300-600 a month kept up") is uncited and already stale against the $2,000 second-Tiny alternative the maintainer can get "through a work program."

Preference for Vultr as an independent provider is legitimate. "Technically fine" is not yet earned.

### 1.11 "A killed build poisons every package in flight" rules out spot — unproven

> `issue-338.md` Phase D: "Spot or preemptible instances are ruled out by the build system itself (a killed build poisons every package in flight)."

LibreELEC-derived build systems are stamp-based and generally resumable per package; `scripts/clean <pkg> && scripts/build <pkg>` exists precisely to recover. A SIGKILL mid-compile can leave a corrupt `PKG_BUILD` dir, but that is one `clean` away from recovery, not "every package in flight." The real argument against spot is elapsed-time risk (a 6-hour cold build evicted at hour 5), not poisoning. State the real argument and price it; don't invent a build-system property.

### 1.12 Phase D is both "not yet a purchase" and already settled

> `issue-338.md` Phase D: "the build box (a decision, not yet a purchase)"
> `issue-338.md` comment: "Then the second Tiny is the purchase, and Phase D's comparison is settled by it"
> Next comment: "Noted as Phase D's shape: two ThinkStation P3 Tiny Gen 2 boxes, identical ... Not started now."

Is Phase D open or decided? If the second Tiny at ~$2,000 with 4 TB NVMe is decided, Phase D's exit is an order date and a provisioning checklist, not "three shapes priced." If it is not decided, the comments should not say "settled." As written the plan can claim both "we haven't spent" and "we've decided" — which means no gate.

### 1.13 Phase E's gate was violated before the council sat

> `issue-338.md` Phase E: "Once A-D are confirmed by the maintainer, the plan goes to the `council` skill as its packet ... and the council's report is applied here before Phase A starts."
> `decision-register-fork-rows.md` D-WORKFLOW-084: "The plan (#338) goes to the council before Phase A starts"

What already happened before any council report:

- Org `rasteratops` created, repo transferred to `rasteratops/distribution`, origin re-pointed, sweep committed as `1633cbcac2`, token minted/approved, SSH key generated, commits signed as `rasterabot` (`e7d7b35884`), 2FA flipped (or not — see 1.5).
- Splash wordmark rendered to `/workspace/tmp/rocknix-session/splash/` with PNG + SVG + path data, splash-fork mechanics "settled," art spec (32×20 grid, 64×32 canvas, whole-number scale) issued to the maintainer.

That is Phase B half-executed and Phase A designed. The gate is retrospective. Name that honestly and re-gate what remains (no `distributions/rasteratops/` commit, no updater flip, no release) rather than pretending the council precedes all work.

### 1.14 "Two flagged choices" — only one is flagged

> `issue-338.md` Phase E: "the plan goes to the `council` skill as its packet with the two flagged choices and the numbers"
> Body: "**Choice 1 (flagged): a brand rename, not a path rename.**"

Choice 2 never appears. Candidates from comments: transfer vs hard fork (already decided as transfer, D-WORKFLOW-086), second Tiny vs cloud (allegedly settled), visible-only vs code-level rename (decided as two steps, D-WORKFLOW-085), repo name `distribution` vs OS name (decided). If Phase E means "brand-vs-path and build-box shape," say so. A council asked to rule on two choices with one named will rule on one.

### 1.15 Runner "three to five thousand lines of C; every one of them glue" understates the product

> `issue-336.md` comment: "Three to five thousand lines of C; every one of them glue between things that already exist."
> Same file: "A runner that replaces RetroArch has to carry the first three or the fork's own features stop" (offline achievements, save-state manager, exit hotkey + cards).

Glue does not implement save-state auto-resume + Auto-slot contract + launcher state-file contract, `rc_client` session + hardcore rules + offline queue via proxy, input remapping parity, audio batching without drift, GLES framebuffer handshake with context loss, per-core options, and a socket protocol that ES drives for pause/save/load/screenshot/quit — plus proofs on VM and RG35XX SP. Nanoarch (~1,000 lines) implements the handshake and almost nothing else; minarch (~2,400 lines) implements software video + states + options and no GL, no achievements, no socket. Adding those is not glue; it is a frontend. "Weeks" for step 1 with both core kinds, plus ES pause page + cards, plus `time-to-play` parity, is optimistic by 2–3× for one assistant-driven stream, even before the H700 GLES quirks (panfrost) and Nova (freedreno) differences the plan waves away as "Mesa."

Step 0 (RetroArch under ES's interface over its command socket) as "days" is the only estimate in #336 I believe, and only if "days" means "driven, not polished."

### 1.16 "Proxy sits unchanged, offline work carries over untouched"

> `issue-336.md` comment: "Our proxy sits at the HTTP layer, so it and the offline work carry over untouched -- the runner's HTTP goes to 127.0.0.1:8080 as RetroArch's does now."

Unproven. `rc_client` (rcheevos, MIT) is not RetroArch's achievement client; its request shapes, retry/backoff, hashing flow, and hardcore semantics differ. The proxy (`RAOfflineProxy`, GPL-3.0-only) was built against RetroArch's traffic. Pointing a new client's HTTP at the same port is not "untouched" — it is a new client against an old shim. Needs a packet capture diff and an offline-queue walk before anyone claims carryover.

### 1.17 "Paths stay, so merges keep working" ignores the files you do fork

Even with internal paths frozen, 0.0.1 forks:

- `distributions/rasteratops/*` (new, but shadows `distributions/ROCKNIX/*` — every upstream distro change is a manual port),
- `rocknix-splash` fork (new repo, new pin),
- EmulationStation fork (new commits for strings/logo, new pin in `package.mk`),
- updater script + URL,
- launcher (per-core routing for #336 step 0, then runner),
- RetroArch patches (still carried until runner replaces them).

`issue-336.md` admits the real cost: "the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge." The plan prices that cost at zero and sets no merge cadence (weekly? per-release? who resolves? what proves a merge?). "Keep merging `upstream/next`" without a cadence and a merge-proof suite is how forks silently drift for six months and then face an unmergeable wall.

### 1.18 Transfer "keeps every link working" overstates redirects

> `issue-338.md` comment: "every old link and git address redirects to the new one, and the remotes are updated anyway" and "the redirect keeps every link working."

GitHub redirects repo URLs and git remotes, but not every surface: pinned `tarball/...` URLs with commit SHAs redirect, but release-asset URLs under `releases/download/` change host path; `gh release view <tag> --repo <old>` follows redirect only if the CLI follows it; badges, container references, and any hardcoded `https://github.com/maxengel/rocknix/.../blob/...` in docs outside the tree (site checkout, forum posts, Discord) may or may not. More important: staying "in the fork network" (`decision-register-fork-rows.md` D-WORKFLOW-086) means the repo header still reads "forked from ROCKNIX/distribution," PRs default upstream, and search ranks it as a fork. That is honest and I endorse keeping the issues, but it is not "every link working" and it is not cost-free for identity.

### 1.19 CONTRIBUTING.md saying "takes no contributions" does not close the intake

> `issue-338.md` Phase B: "`CONTRIBUTING.md` and the PR template say the project takes no contributions; issues stay on; no sponsorship anywhere."
> `issue-337.md`: "a public repository cannot refuse them [unsolicited PRs]; a `CONTRIBUTING.md` says the project takes none and the template says so"

Correct that it cannot refuse them, but the plan stops there. Who closes unsolicited PRs, with what canned reply, within what SLA? Who triages issues when "issues stay on" but "no community, no Discord" means issues are the only inbound? What about security reports (no `SECURITY.md` mentioned), spam, and the self-hosted-runner risk where a malicious PR triggers workflows? "No contributions" is a triage policy, not a file. Without one, the maintainer inherits an unpaid queue.

### 1.20 Version scheme collides with audit gating

> `issue-337.md` comment: "`0.0.1` for this cut, `0.0.x` for fixes on it, `0.1` for the first cut that carries the fork's own direction (#336's step 0)"
> `decision-register-fork-rows.md` D-WORKFLOW-083: "every punch item resolved through Phase 7 or accepted by a row before `0.1`."
> `issue-339.md`: "Every punch item resolved through Phase 7 before `0.1`, or accepted by a register row."

If 0.1 carries step 0 (days of work) but is gated on all punch items from Tier 1 (121k lines) + Tier 2 (140k) + Tier 3 (185k) + provenance table, 0.1 is gated on months of audit, not days of runner. Either step 0 waits for the audit (absurd — step 0 is the fallback that makes the audit safe to schedule), or the audit gate is aspirational. Pick one: gate 0.1 on step 0 + Tier 1 only, and move Tiers 2–3 to 0.2+.

### 1.21 Audit throughput extrapolated from a best case

> `issue-339.md`: "a seat's packet is about 500 KB, roughly 12,000 lines, and the fix-round audit read 40,000 lines in eight packets in an evening" → "About twenty packets a seat" for Tier 1.

Reading is not auditing. Fix-round audits read scoped diffs with fresh context; Tier 1 reads 121k lines of product + QA tooling cold, writes findings, proves each behavioral claim on the VM ("every finding that claims a behaviour is proven on the VM before it is a punch item"), files a punch-list issue, and resolves each through Phase 7. The plan counts packets, not proofs, fixes, re-proofs, or register rows. Twenty packets a seat is ~2.5 "evenings" of reading and 3–6 weeks of audit-to-fix elapsed with one assistant stream. Tiers 2–3 double that. "Gradually over the fork's `0.0.x` releases" is doing a lot of work with no schedule.

---

## 2. Risks, ordered by expected cost

Expected cost = probability × cost if it lands. "Named" means #338 names it as a risk with a mitigation, not merely mentions it.

| Rank | Risk | P | Cost | Expected | Named? |
|------|------|---|------|----------|--------|
| R1 | Updater/release cutover strands or bricks the upgrade path | H | H | **Very high** | No — "updater pointed at the fork's own releases" is a checkbox |
| R2 | No merge cadence → silent drift, then unmergeable wall or missed device/security fixes | H | H | **Very high** | No — "merged on" with no cadence, owner, or proof |
| R3 | 0.0.1 ships saying ROCKNIX somewhere player-visible (incomplete rename / ES+distro skew) | H | M–H | **High** | Partly — counts given, completeness unproven |
| R4 | Cloud-folder migration loses or forks user saves | M | Very high | **High** | No — "read both" with no design |
| R5 | Build estate is one box with no backup/provisioning automation; loss = weeks | M | H | **High** | No — second box discussed, backup never |
| R6 | Device matrix + per-action yeses make 0.0.1 unprovable on hardware in reasonable time | H | M | **High** | Partly — "devices on a yes" with no matrix |
| R7 | Assistant token/SSH/mail compromise or mis-post; impersonation; secret leak | M | H | **High** | Partly — 0600 + masks, but failure already recorded |
| R8 | CI split (hosted + self-hosted) gives red builds or false green (KVM/GPU/disk/artifact) | H | M | **Medium-high** | Partly — "measured once" |
| R9 | Scope collision: rename + audits + runner + silent boot + site compete; nothing lands | H | M | **Medium-high** | No — treated as parallel checkboxes |
| R10 | Licence/attribution gap (CC BY-NC-SA wording, GPL source offer, non-commercial list, OFL notice) forces re-release | M | M–H | **Medium** | Partly — attribution line promised, wording absent |
| R11 | Org/account lockout, token expiry, domain/hosting lapse | L–M | H | **Medium** | Partly — expiry recorded, recovery not |
| R12 | Splash/artwork/spec mismatch across panels (640×480 vs 1280×960, whole-pixel snap) | M | L–M | **Low-medium** | Yes — spec exists, needs proof |

### R1 — Updater and release channel (not named as a risk)

`issue-337.md`: "the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there." `issue-338.md` Phase A: "the updater pointed at the fork's own releases."

What is missing:

- What URL, what POST body, what response shape? Is it GitHub Releases API, a static file, or a ROCKNIX-owned endpoint that must be replaced? No script path, no before/after diff.
- How does a ROCKNIX RC2 device become a rasteratops 0.0.1 device? OTA from ROCKNIX channel (impossible — you don't own it), manual `.update` tar via `scp` + reboot (per `CLAUDE.md`), or reflash? If manual, the "upgrade path keeps ROCKNIX-era state" rehearsal must prove `/storage` + settings + saves + cloud creds survive a channel hop. If reflash, the updater is irrelevant for 0.0.1 and the plan should say so.
- Rollback: if 0.0.1 fails to boot, does the device fall back? Is there a last-good slot? `issue-335.md` mentions "the last-good settings" as a small PR — is that in RC2? Unclear.
- Signing and `.sha256` convention: `issue-334.md` notes "the release page and its `.sha256` convention (the fork has this already, `maxengel/rocknix`'s releases)" — but now the repo is `rasteratops/distribution`; do old `.sha256` URLs redirect? Does the updater verify? What key?
- `gh release view <tag> --repo <the fork> --json body` reading the attribution sentence (`issue-335.md` Prong 2) is a fine check, but no check verifies the updater actually consumed that release on a booted image.

This is the highest expected cost because a wrong updater URL ships a device that can never update again without manual intervention — a silent brick of the fleet.

### R2 — Upstream drift and merge cost (not named)

`decision-register-fork-rows.md` D-WORKFLOW-084: "`upstream/next` is merged on for the hardware work." `issue-336.md`: runner "is a package, a launcher rule and interface pages -- none of it touches a kernel, a bootloader, a device tree, a quirk or Mesa."

True today, misleading tomorrow:

- The fork's overlay is +79,181 lines on distribution roots and +42,180 on ES (`issue-339.md`). Every `upstream/next` merge touches files the fork also touches (launcher, RetroArch recipes, ES `GuiMenu.cpp`/`ApiSystem.cpp` per D-WORKFLOW-080). "Paths stay" does not prevent content conflicts.
- No cadence: weekly merge with `vm-qa`? Per-release merge? Who owns conflicts — assistant proposes, maintainer approves? What proves a merge (build + boot + time-to-play + upgrade rehearsal)? Without this, the rational behavior is to defer merges until a device breaks, at which point the merge is huge.
- Container drift: `issue-334.md`: build container `ghcr.io/rocknix/rocknix-build` is "public, usable, not ours to keep current." If upstream bumps the container (toolchain, sysroot) and the fork doesn't follow, builds diverge silently. If the fork follows, every device rebuilds. No pinning policy.
- ES fork drift is worse: `issue-336.md` admits interface divergence makes upstream ES changes harder to merge. With 42k lines of fork-owned UI, the ES merge is already the expensive one. No ES merge cadence either.

Price this as 0.5–1 day per distribution merge + 1–2 days per ES merge, monthly at minimum, or admit the fork is hard-pinning to RC2's `upstream/next` commit and accepting stale hardware support.

### R3 — Incomplete rename / ES+distro skew

See 1.2–1.3. Additional skew risk: Phase A spans two repos (distribution + ES fork) plus a third (splash fork) with pins:

- `projects/ROCKNIX/packages/ui/emulationstation/package.mk` pins ES by commit (`CLAUDE.md`: "see ... for the extra build steps"; `packages/README.md` rule: "Pin git sources with the full commit hash in `PKG_VERSION`").
- `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk` pins splash by commit.

0.0.1 requires: ES fork commit with new strings/logo → distribution commit bumping ES pin + splash pin + DISTRO + updater → four image builds from that head. If any pin lags, the image boots with mixed identity. The plan lists no pin-update order, no "all pins from one head" check, and no squashfs grep gate.

### R4 — Cloud folder migration (not named as data-loss risk)

See 1.4. Add `CLAUDE.md`'s `--delete-excluded` warning and `issue-335.md`'s sizes (cloud scripts +14,468 lines). A one-line default change in 14k lines of sync logic, unproven against a populated remote, is the highest-severity tail risk in Phase A. Keep `/ROCKNIX` as the default for 0.0.1 and move the rename to a dedicated migration release with a dry-run, a backup, and a rollback. The player never sees the cloud path except in one sentence; the cost of waiting is one string.

### R5 — Single build box, no backup, no provisioning automation

Serval: "24 cores, 60 GB, a 4 TB volume with about 2 TB free" (`issue-338.md` comment), "3.6 TB volume with 2 TB free" (later comment — already inconsistent by 400 GB). Holds: primary checkout + worktrees, 4× build roots (110–147 GB each), 38 GB source cache, kept images, tokens (`~/.config/rasteratops/github-token`, `mail-token`), SSH keys (`~/.ssh/rasterabot_ed25519`), mail venv, splash drafts in `/workspace/tmp/`.

Nowhere does the corpus mention: filesystem snapshots, off-box backup, encrypted token backup, `~/.ssh/config` backup, source-cache mirror, or a build-box blueprint script. The second Tiny is "identically provisioned boxes ... provisioned the same way from the estate's build-box blueprint (`/workspace` on the 4 TB volume, the container, the source cache, the worktree layout)" — but that blueprint does not exist as a file; it is a parenthetical. If serval's NVMe dies, the recovery is: reinstall OS, re-pull container, re-clone, re-download 38 GB of sources (some pinned to commits that may have vanished upstream), re-mint tokens, re-generate SSH keys (invalidating the old ones on GitHub), rebuild four colds. That is a week, not a day.

Second box before backup is buying a second bucket with a hole in the first.

### R6 — Device set and QA fleet vs per-action yeses

Phase A promises "the four images from one head" and "the devices on a yes." Which four? The corpus names RG35XX SP, RG SP, RG353M, Nova, plus GENERIC_X64/VM (`issue-337.md` art spec). That is five. `issue-339.md` Tier 2 says "quirks for the four devices" — same ambiguity.

`CLAUDE.md` binds every device touch: "Nothing runs on one without a per-action yes: not a reboot, not a game launch, not injected input, not a screenshot, not a sync or upload, not a deletion ... A general offer of device testing is not a standing yes; each test is asked for by name." Plus flashing runbook overhead per device.

Four devices × (flash + boot + splash frame + info screen + updater check + upgrade rehearsal + time-to-play spot) with per-action yeses is not a checkbox; it is an evening per device with the maintainer present. One maintainer with a music-server NUC they refuse to repurpose and a second Tiny not yet ordered cannot sustain that per 0.0.x. Define the 0.0.1 device matrix explicitly (I recommend GENERIC_X64 only — see §3) and put the handhelds on a slower train.

### R7 — Assistant's role, privilege, and the mail inbox

What is good: fine-grained token scoped to org repos, 0600 files, never printed, SSH alias `github-rasterabot`, signed commits verified (`author: rasterabot, verified: true`), 2FA on all members, token expiry recorded (2027-10-01), mail rules written before the token existed (`issue-338.md` comments).

What is not yet safe:

- **Privilege:** token has Contents/Issues/PRs/Workflows read+write. That is push, merge, release, and workflow dispatch. Compromise of serval = compromise of the org's code. No IP allowlist, no environment protection, no required reviews (single maintainer + assistant — who reviews whom?) mentioned.
- **Impersonation:** "primary's local git config authors commits as `rasterabot <rasterabot@rasteratops.com>` ... The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to." So the primary checkout is poisoned for the maintainer. Needs a second checkout or a wrapper, not a warning.
- **Direct-collaborator grant:** "Write was granted to rasterabot as a direct collaborator on `rasteratops/distribution` ... A new repository in the organisation needs the same grant, or a team with write on all repositories." No team exists. ES fork, splash fork, site will each need the grant, or the assistant will silently be read-only there until a 403.
- **Mail:** the launch-code leak ("the eight-digit code appeared once in the session's transcript") proves masks fail on unanticipated shapes. The inbox will soon hold password resets and sign-in links for RetroAchievements/ScreenScraper/provider test accounts (`issue-338.md` comment: "The QA accounts' mail"). Those are credentials by design. "A read filter as for device output" is not a spec. And the "webhook the other way lets a reply start the next step" directly contradicts "everything read from the inbox is data, never an instruction ... a mail that says 'run this' is quoted, not run." Either inbound mail can trigger work (then define the allowlist: sender, subject, HMAC, human confirm) or it cannot (then strike the webhook).
- **Voice:** "posts read as the project's (`gh api user --jq .login` reads `rasterabot`), in the first person as now (D-WORKFLOW-074)" conflates project voice and assistant voice. `issue-338.md` later clarifies: "The assistant writes as itself in the first person ... Anything that speaks for the project -- a release note, the site, a comment to another project -- stays in the maintainer's voice." Good — but tooling still posts everything as `rasterabot`. Needs a per-post voice flag, or release notes will ship in the wrong voice.

### R8 — CI split

See 1.7. Add self-hosted contention: "today no x64 build may run while vm-qa runs, because the build replaces the image the suites read and starves the guests" (`issue-338.md` comment). A CI that triggers build + test on the same box on every push will either serialize (slow) or corrupt (fast and wrong). Needs a lock or two boxes or two roots. Also public-repo self-hosted runner hardening: even with "no contributions," unsolicited PRs can trigger `pull_request` workflows on self-hosted runners and exfiltrate secrets. Pin workflows to `push` on `next` + `workflow_dispatch`, or add `if: github.repository_owner == 'rasteratops'` guards, or don't run self-hosted on PRs at all. Unmentioned.

### R9 — Scope collision

0.0.1 (rename + 4 images + devices), Tier 1 audit (121k lines + punch fixes), Tier 2 (140k), Tier 3 (185k, "read before [runner] work starts"), runner step 0 (days) + step 1 (weeks), silent boot (#340: frame classifier + journal parity + 2 devices), site (MkDocs under `rasteratops.com`), policy relaxation (#341), second-box provisioning, hosted-CI experiment. All "after the fork," none ordered, all on one assistant stream with maintainer yeses as the bottleneck. `decision-register-fork-rows.md` D-WORKFLOW-083 says audits happen "gradually over the fork's `0.0.x` releases" — gradual is not a schedule. Without an explicit order (§6), the rational outcome is five half-done streams and no 0.0.1.

### R10 — Licence and attribution

`LICENSE.md`: branding CC BY-NC-SA 4.0 (attribution + non-commercial + share-alike, "not in any way that suggests the licensor endorses you"), software GPL-2, bundled works under their terms, "includes components licensed for non-commercial use only." `issue-334.md`: "a standalone fork that still boots with the ROCKNIX logo, calls itself ROCKNIX and updates from ROCKNIX's release page is inside 'suggests the licensor endorses you'"; clean shape is own name/logo/splash + "a fork of ROCKNIX, itself a fork of JELOS."

Gaps:

- Attribution wording does not exist yet. `issue-335.md` Prong 2 requires "`gh release view <tag> --repo <the fork> --json body` reads the sentence, in the wording the register row that adopts it records" — no such row exists. `issue-338.md` Phase A says "with the attribution line, in the maintainer's voice" — voice without text.
- GPL-2 source offer: public repo at the release tag + pinned submodules + container digest + `PKG_VERSION` full hashes (`CLAUDE.md`) must equal the shipped image. No release checklist verifies `BUILD_ID`, tag, ES pin, splash pin, container digest, and `sources/` manifest are recorded together.
- Non-commercial components: which? If any image includes them, any future monetization (even Patreon "for the work") needs a licence review. `issue-337.md` struck sponsorships, but the maintainer mused "If at some point I wanted a Patreon or something, I could do that." List the components now.
- OFL (Tiny5 Duo): "an image rendered with it carries no obligation" (`issue-337.md`) — but generating `svg_paths[]` from the BDF bitmap and compiling it into GPL splash may be a derivative of the font program, not a rendered image. Keep the OFL notice with the splash fork regardless; it costs one file.
- Headers: `CLAUDE.md`: "Preserve upstream JELOS/LibreELEC copyright headers and add a ROCKNIX line." Fork rule needed: keep JELOS/LibreELEC + ROCKNIX lines, add rasteratops line for modified files. Unwritten.

### R11 — Org, accounts, domain, hosting

Token expiry 2027-10-01 recorded — good. Missing: org recovery codes location, `pixelelated` role (owner? lockout? maintainer's alt?), rasterabot authenticator secret location ("lives with the maintainer" — where? password manager? sealed envelope?), what happens if the maintainer loses the authenticator (lockout owner procedure?), domain `rasteratops.com` registrar/expiry/auto-renew (maintainer's domain per `issue-338.md` 04:39 comment — verified only as mail domain, not ownership/expiry), Hostinger plan limits (mailbox quota? API rate? what happens when trial/welcome period ends?), GitHub PAT policy re-approval on new repos.

Low probability each, high cost when one fires on release day.

### R12 — Splash spec vs panels

Spec is solid (`issue-337.md`: 32×20 animal grid, 57–58×6 wordmark, 64×32 canvas, whole-number scale, 6× on 640×480, 12× on Nova). Risks: wordmark width reported as both 58×6 and 57×6 in adjacent comments (off-by-one = off-center); splash renderer's "hard-coded 1284:500 aspect" + float scale needs the promised two one-line changes (own box + floor to whole number) — uncommitted; Nova is "exactly twice the others" only if 1280×960 panels never scale differently under sway/KMS; backlight flash/vendor logo before kernel is out of OS control (`issue-340.md`). All fixable, all need a frame per panel size, not a PNG preview on a laptop.

---

## 3. What I would change: phases, order, gates, scope; what to cut from 0.0.1

### Order is wrong: harden → prove release machinery → rename → devices → direction

#338 orders A (identity) → B (org/repos) → C (CI) → D (box) → E (council), then implies audits + runner + silent boot follow. That puts the most visible change first and the load-bearing machinery last.

I would run: **estate integrity → release engineering → minimal rename on one image → devices → audits/runner/silent-boot in explicit sequence.** Rationale: you cannot prove a rename without a trustworthy builder, a working updater, and a merge cadence; you cannot sustain devices without a second prover or a reduced matrix.

Concrete changes:

| #338 as written | Change to | Why |
|---|---|---|
| Phase A: 4 images, VM + rehearsal + devices, cloud rename, site implied | **0.0.1 = GENERIC_X64 only**, VM-proven, cloud default unchanged, site deferred | De-risks updater + DISTRO split on the cheapest image; devices follow as 0.0.2+ per-device releases |
| Phase B: transfer 3 repos, sweep, CONTRIBUTING | **Split B into B1 (harden org) → B2 (transfer remaining) → B3 (triage policy)**; create team `rasteratops/build` with write on all repos, grant rasterabot via team, document lockout + recovery codes | Fixes per-repo 403s, lockout ambiguity, unsolicited-PR queue |
| Phase C: hosted suites + VM experiment + self-hosted builds | **Self-hosted only for 0.0.1 gating; hosted experiment explicitly non-gating with published numbers**; add build/test mutex on serval | Prevents false green from GPU-less KVM and build/test corruption |
| Phase D: decision, not purchase | **Decide now (second Tiny is already "settled"), but gate order on backup + blueprint existing**; publish `du` table, order spec, provisioning script | Backup before second box; no blueprint = no order |
| Phase E: council before Phase A | **Acknowledge gate breach; re-gate remaining**: no `distributions/rasteratops/` commit, no updater flip, no `0.0.1` tag until council report applied | Honest gates beat retrospective ones |
| Audits Tiers 1–3 "gradually" + gate 0.1 on all | **Tier 1 only before 0.1; Tiers 2–3 scheduled for 0.2/0.3; provenance table scoped to carried patches first** | Unblocks step 0; matches "gradually" with dates |
| Runner step 0 + step 1 + bridge as one direction | **Step 0 (RetroArch under ES socket) is 0.1; step 1 (fresh runner) is 0.2+ spike with exit criteria; bridge is research, not roadmap** | Prevents 3–5k-line "glue" from swallowing 0.1 |
| Silent boot + site unscheduled | **Both after 0.0.1 devices; site is docs release, not OS release** | They share zero code with rename; sequencing is free |

### Cut from 0.0.1 (move to 0.0.2+ or 0.1+)

1. **Handheld images.** Ship `0.0.1-generic-x64` first. Each handheld becomes `0.0.1-h700`, `0.0.1-nova`, etc., or fold into 0.0.2. Cuts 3 cold builds, 3 flash walks, and 3 panel proofs from the critical path.
2. **Cloud-folder rename.** Keep `/ROCKNIX` default; change only the sentence if it must not say ROCKNIX — better, keep the sentence too and file the migration as its own issue with a dry-run design. Cuts data-loss tail risk.
3. **Site.** `rasteratops.com` MkDocs is independent of the image. Ship when pages are renamed; do not gate the OS on DNS + theme.
4. **Silent boot (#340).** Requires frame classifier + journal parity + 2 devices. Valuable, orthogonal, weeks. 0.2+.
5. **Runner beyond step-0 design.** Step-0 protocol design (socket verbs) can proceed in parallel as a doc; no code lands before 0.0.1 tags.
6. **Audit Tiers 2–3.** Tier 1 punch list is the 0.0.x fix list; Tiers 2–3 start after 0.0.1 devices prove.
7. **Hosted VM CI gating.** Experiment runs, numbers publish, no gate moves until numbers meet thresholds (§6).
8. **Code-level rename.** Already deferred by D-WORKFLOW-085 — keep deferred, and add `NAMING.md` in 0.0.1 so the tree states the split.
9. **Second-box provisioning.** Order can proceed, but 0.0.1 must not wait for it. One box + one image + mutex is enough.

### Keep in 0.0.1 (minimal, provable)

- `distributions/rasteratops/` (options, version `0.0.1`, logo placeholder, kernel_options, config/functions) + `NAMING.md` + header rule.
- Splash fork with Tiny5 Duo wordmark (no animal yet — animal is art, wordmark is identity) + recipe pin + whole-pixel fix.
- ES fork minimal: info screen, theme logo text, two strings (or fewer — prove by squashfs grep), version.
- Updater pointed at `rasteratops/distribution` releases + `.sha256` + attribution line + release notes.
- `/etc/os-release` + `DISTRONAME` + `OS_VERSION` coherent.
- GENERIC_X64 image from one head, vm-qa PASS, upgrade rehearsal from RC2 PASS (storage + settings preserved), frame proof.
- Org hardened, team created, CONTRIBUTING + PR template + SECURITY + triage canned replies.
- Merge cadence + container pin recorded as register rows.

---

## 4. What is missing entirely

1. **Backup and disaster recovery.** No snapshot, off-box copy, token/SSH recovery, source-cache mirror, or restore test. Needs: encrypted backup of `~/.config/rasteratops/`, `~/.ssh/`, org recovery codes, registrar credentials; `rsync`/`restic` of `sources/` + `release/`; restore drill on the second Tiny as its provisioning test.
2. **Release engineering checklist.** No definition of a release: tag format (`0.0.1` vs `v0.0.1` vs `0.0.1-generic-x64`?), `BUILD_ID`/`BUILD_DATE` handling, `TARGET_IMG` manifest, ES/splash/container pins recorded, `.sha256` generation, `gh release view --json body` attribution grep, updater smoke on booted image, rollback story. `tools/fork-publish-release` exists (`issue-337.md`) — its 0.0.1 inputs/outputs are not specified.
3. **Merge cadence and merge proof.** No schedule, owner, conflict policy, or suite. Needs: e.g., "track `upstream/next` monthly, ES fork monthly offset by a week; merge proves with GENERIC_X64 build + boot + vm-qa quick + time-to-play delta <10%."
4. **Container pinning.** `ghcr.io/rocknix/rocknix-build:latest` is floating (`CLAUDE.md`: `make docker-image-pull`). Pin by digest per release, record digest in release notes, define bump procedure. Otherwise "four images from one head" is false — the toolchain is a fifth input.
5. **Device support matrix.** No table of supported devices, kernels, bootloaders, quirks, panel sizes, test owners, and EOL. "Four devices" is not a matrix. Needs one row per device with `DEVICE`, `ARCH`, kernel, quirk files, panel, yes-owner, last-proven release.
6. **Issue/PR triage policy.** No SLA, labels, canned close for unsolicited PRs, security contact, or spam handling. "No contributions" without this is an open queue with no owner.
7. **Licence artifacts.** No attribution sentence text, no non-commercial component list, no GPL source-offer statement, no OFL notice in splash fork, no header rule for new files. All promised, none written.
8. **Domain/DNS/hosting inventory.** `rasteratops.com` ownership, registrar, expiry, auto-renew, DNS host, Hostinger plan/quota/API limits, mailbox retention. Mail as "delivery mechanism for long jobs" needs quota + retention + failure alerts.
9. **Cost and time ledger.** No running table: Tiny #2 ($2,000 + 4 TB NVMe), Hostinger plan, GitHub (free org? Actions minutes? artifact storage?), Vultr if ever, maintainer hours per release. One maintainer + assistant needs a budget to say no with.
10. **Assistant boundaries.** No written delegation: what rasterabot may merge/release without a yes, what needs maintainer approval (releases, updater flips, cloud migrations, device flashes — the last already requires yeses per `CLAUDE.md`, the others don't). "Mail goes only to the maintainer unless the maintainer names another recipient" is a start; code/release authority is missing.
11. **Mail threat model.** No allowlist for inbound triggers (contradiction noted in R7), no retention/deletion policy for credential-bearing mail, no phishing drill, no separation of QA-account mail from human mail (folders? filters?).
12. **Provenance table scope.** `issue-339.md` demands "one row per patch, with the count of rows equal to the count of patch files in the tree" — for 525k lines of patches. No tooling, no owner, no sampling strategy. Needs scoping: carried/forked patches first, upstream-merged by reference.
13. **Time-to-play regression gate.** `time-to-play.md` (D-CLOUD-098 per `CLAUDE.md`) says launch latency is measured on every image. No threshold in #338: is +5% a fail? +100 ms? Without a number, the runner comparison ("1.05 s from press, 2.03 s from exit" per `issue-336.md`) is trivia.
14. **Upgrade vs clean-install matrix.** `CLAUDE.md`: "Before publishing, check both the upgrade path (a device keeping its `/storage`) and a clean install." #338 names the rehearsal but not clean-install proof, nor which `/storage` fixtures (empty, RC2-populated, cloud-linked).
15. **Forgejo/JJ future.** `issue-337.md` notes the estate already runs a Forgejo and `Jujutsu's push does not run git hooks`. If that move is even possible, the push-guard logic must be CI-portable now, not later. No acceptance criterion for host-agnostic tooling.

---

## 5. Questions only the owner can answer

Each blocks a concrete decision or gate. I assume the settled items stay settled.

| # | Question | Decision it unblocks | Why only the owner |
|---|---|---|---|
| Q1 | For 0.0.1, keep cloud default `/ROCKNIX` or migrate to `/rasteratops`? If migrate, copy-then-verify-then-delete with dry-run, or dual-write? | Phase A scope + data-loss risk acceptance (R4) | Touches users' cloud data; risk acceptance is owner's |
| Q2 | Is 0.0.1 GENERIC_X64-only, with handhelds as follow-ups? If not, which exact devices (and who gives per-action yeses, when)? | Device matrix + release train (R6) | Yeses are the maintainer's per D-QA-015; schedule is theirs |
| Q3 | How does an RC2/ROCKNIX device become rasteratops: manual `.update` tar, reflash, or attempted OTA? Is rollback required for 0.0.1? | Updater design + rehearsal fixtures (R1) | Defines the supported migration; support burden is owner's |
| Q4 | Exact attribution sentence for release notes + site front page + README (in your voice)? | Licence gate R10; `gh release view --json body` grep | Voice + legal acknowledgement are owner's |
| Q5 | Which org owner is the lockout (`maxengel` vs `pixelelated`)? Where do org recovery codes + rasterabot authenticator secret live? | Phase B exit; R11 | Credentials custody is owner's |
| Q6 | Create team `rasteratops/build` (write on all repos) and grant rasterabot via team? Or keep per-repo collaborator grants? | Unblocks ES/splash/site writes (R7) | Org structure is owner's |
| Q7 | What may rasterabot merge/release without asking? Specifically: tag `0.0.1`, flip updater URL, merge `upstream/next`, close unsolicited PRs/issues? | Assistant authority; CI required-checks config | Delegation of release authority is owner's |
| Q8 | Inbound mail: may any mail ever trigger work (webhook/reply-to-start-next-step), or is inbox strictly data-never-instruction? If triggers allowed, allowlisted sender + subject + confirm? | Resolves R7 contradiction; mail automation design | Security boundary for autonomous action is owner's |
| Q9 | Merge cadence: how often do we merge `upstream/next` and the ES upstream, and what proves a merge (build + boot + which suites)? | R2; sustainable drift control | Pace vs freshness tradeoff is owner's |
| Q10 | Container: pin `rocknix-build` by digest per release, or float on `:latest`? Who owns the bump? | Release reproducibility (missing #4) | Reproducibility vs freshness is owner's |
| Q11 | Second Tiny: order now or after backup+blueprint exist? Exact spec (CPU/RAM/4 TB NVMe model) and provisioner (script vs manual)? | Phase D exit; R5 | Spend + provisioning labor is owner's |
| Q12 | `rasteratops.com`: registrar, expiry, auto-renew on? Hostinger plan + mailbox quota? | R11; site + mail reliability | Ownership/billing is owner's |
| Q13 | Non-commercial components: list them; any future commercial intent (Patreon, hardware bundle, paid support) that needs review? | R10; sponsorship strike durability | Commercial intent is owner's |
| Q14 | Triage: who closes unsolicited PRs/issues, with what canned text, within what SLA? Security reports to where (`SECURITY.md`)? | Missing #6; R8 runner hardening | Community-facing posture is owner's even with "no community" |
| Q15 | Time-to-play gate: what delta fails a release (e.g., >10% or >100 ms vs RC2 on same guest)? | Missing #13; runner step-0 vs step-1 decision | Product performance bar is owner's |
| Q16 | 0.1 scope: step 0 only + Tier 1 punch closure, or all tiers? Are Tiers 2–3 allowed to slip to 0.2/0.3? | Resolves 1.20 collision; audit schedule | Release scope vs audit depth is owner's |
| Q17 | Splash for 0.0.1: wordmark only, or wordmark + animal? If animal, delivery date for 32×20 SVG on whole-number coordinates? | Art critical path; R12 | Art delivery is owner's (they volunteered: "I can do the art") |
| Q18 | Site: must `rasteratops.com` launch with 0.0.1, or can the release page be the whole surface initially? | Cut/keep for 0.0.1 | Public surface commitment is owner's |

---

## 6. Recommended plan: phases with agent-verifiable entry/exit criteria

Conventions: every exit is a command, file, or measurement an agent can run. `PASS` means the tool's own pass line, not "looked fine." Frames are PNGs at the panel's size (640×480, Nova 1280×960) under `docs/qa-frames/<release>/`. Builds record `BUILD_ID`, tag, container digest, ES pin, splash pin.

### P0 — Estate integrity and release engineering (before any rename commit)

**Entry:** `rasteratops/distribution` exists on `next` at RC2's tree (`69e6039f8f` per D-WORKFLOW-084); serval is the builder.

**Work:**

- Write `docs/rasteratops/release-checklist.md` (tag format, pins, `.sha256`, attribution grep, updater smoke, upgrade + clean-install matrix).
- Write `docs/rasteratops/merge-cadence.md` (distribution monthly, ES monthly offset; merge-proof suite).
- Pin container by digest; record in checklist.
- Backup: encrypted copy of `~/.config/rasteratops/`, `~/.ssh/rasterabot_*`, `~/.ssh/config` snippet; `restic`/`rsync` of `sources/`; org recovery codes location recorded (not the codes).
- `du` table per device root + `sources/` + `target/`; publish in #338.
- Triage policy + `SECURITY.md` + canned replies; workflow hardening for self-hosted runners.

**Exit (all must read true):**

- `cat docs/rasteratops/release-checklist.md docs/rasteratops/merge-cadence.md` exist and are linked from `CONTRIBUTING.md`.
- `docker inspect --format='{{.RepoDigests}}' ghcr.io/rocknix/rocknix-build:latest` digest recorded in checklist for this release line.
- `ls -l ~/.config/rasteratops/github-token ~/.config/rasteratops/mail-token` are `0600`; `gh auth status` shows `rasterabot` active; `ssh -T git@github-rasterabot` answers as `rasterabot`.
- `gh api orgs/rasteratops --jq .two_factor_requirement_enabled` reads `true`; `gh api 'orgs/rasteratops/members?role=admin' --jq 'length'` reads `2`; `gh api 'orgs/rasteratops/members?filter=2fa_disabled' --jq 'length'` (owner token) reads `0`.
- Team exists: `gh api orgs/rasteratops/teams/build --jq .slug` reads `build`; rasterabot membership confirmed; token `push:true` on `rasteratops/distribution` via team (no per-repo collaborator).
- Backup manifest exists off-box (path + timestamp + restore command); `tools/box-check` PASS, `tools/rules-check` PASS, `tools/register-check` PASS.
- Q4, Q5, Q6, Q7, Q9, Q10, Q14 answered as register rows.

### P1 — Org hardening and remaining transfers (B done right)

**Entry:** P0 exit true.

**Work:**

- Transfer or fork ES repo → `rasteratops/emulationstation`, splash → `rasteratops/splash`, site → `rasteratops/rasteratops.org` (transfer if history/issues matter; fork if upstream-owned — record per repo why).
- Grant `build` team write on all; verify rasterabot push on each.
- `CONTRIBUTING.md` + PR template ("takes no contributions" + link to triage policy) + `SECURITY.md` on each repo; disable Sponsorships; verify no `FUNDING.yml`.
- Full `grep -R` triage for `maxengel/rocknix`, `ROCKNIX/distribution`, `ROCKNIX/emulationstation-next`: every hit labeled code (fixed) or record (kept).

**Exit:**

- `gh repo view rasteratops/emulationstation --json nameWithOwner` etc. all resolve; `gh secret list --repo rasteratops/distribution` shows `FORBIDDEN_PATTERNS` (survived transfer).
- `gh api repos/rasteratops/distribution --jq .fork` reads `true` (still in network per D-WORKFLOW-086) and issues count preserved (135 open at transfer per 05:14 comment, ± triage since).
- Grep report filed in #338 with 0 un-triaged live hits; `1633cbcac2`-style sweep commit(s) pushed and `rules-check`/`register-check` PASS.
- Q6 closed.

### P2 — Minimal visible rename, GENERIC_X64 only (the real 0.0.1)

**Entry:** P0–P1 exit true; Q1–Q4, Q17 answered; council report applied (acknowledge P0–P1 already ran).

**Work (one head, one image):**

- `distributions/rasteratops/` (options `DISTRONAME=rasteratops`, version `OS_VERSION=0.0.1`, logo placeholder, kernel_options, config/functions) + `NAMING.md` (visible vs paths, why) + header rule (keep JELOS/LibreELEC + ROCKNIX, add rasteratops on touch).
- Splash fork: wordmark-only `svg_paths[]` (146 `M x y h1 v1 h-1 z` squares per `issue-337.md`), own-box aspect + whole-number floor, recipe pin bumped.
- ES fork minimal: `OS_NAME`/info screen, theme logo text, interface strings found by grep (prove count, don't assume two), version; distribution ES pin bumped.
- Updater URL → `rasteratops/distribution` releases; `.sha256` convention verified; attribution sentence (Q4) in release body + README.
- Cloud default: per Q1; recommended keep `/ROCKNIX` for 0.0.1.
- Build GENERIC_X64 from the head; record `BUILD_ID`, container digest, ES pin, splash pin.

**Exit (0.0.1-generic-x64 gate):**

- `grep -R --exclude-dir=.git -n "ROCKNIX" target/*.img` unpacked squashfs triage: 0 un-triaged player-visible hits (report filed).
- Boot on guest d: `docs/qa-frames/0.0.1-generic-x64/boot-splash-640x480.png` shows wordmark centered; `docs/qa-frames/0.0.1-generic-x64/info-screen-640x480.png` shows `rasteratops` + `0.0.1`.
- `tools/vm-serial -- cat /etc/os-release` reads `NAME=rasteratops` (exact keys per Q4 row) and `VERSION_ID=0.0.1`; updater script `grep -F rasteratops/distribution` true.
- `tools/vm-qa` PASS line filed; upgrade rehearsal from RC2 PASS (storage + settings preserved, fixtures named); clean-install boot PASS.
- `tools/time-to-play` on same guest: press→first-frame and exit→next-first-frame within gate from Q15 vs RC2 numbers (1.05 s / 2.03 s baseline per `issue-336.md`).
- `gh release view 0.0.1-generic-x64 --repo rasteratops/distribution --json body --jq .body | grep -F "<attribution sentence>"` true; `.sha256` asset present; updater smoke on booted image fetched that release (log filed).
- `tools/box-check` 0 fail; `tools/lint-audit-artifacts` N/A (no audit yet).

Tag only when all above are true. This is 0.0.1.

### P3 — Handhelds as follow-ups (0.0.2-train, not 0.0.1)

**Entry:** P2 tagged; Q2 answered with matrix.

**Work per device:** build from P2 head + device delta only; flash per runbook with per-action yeses; splash + info frames at panel size; updater smoke; upgrade + clean-install.

**Exit per device:**

- `docs/qa-frames/<tag>-<device>/splash-<WxH>.png` + `info-<WxH>.png` at 640×480 (H700 boards) or 1280×960 (Nova).
- `tools/vm-qa` device-applicable subset PASS or explicit N/A with reason; device-facts row filed (panel controller pre-kernel behavior named per `issue-340.md` pattern).
- `gh release view <tag> --json body` attribution grep true.

Do not hold GENERIC_X64 0.0.1 for handhelds.

### P4 — Policy relaxation (#341) + CI mutex (parallel with P3, lands before runner code)

**Entry:** P1 exit true; D-WORKFLOW-087 already allows relaxing now.

**Work:** hook `pr/*` scans keep only credential + still-wanted checks; checker drafts scan/count → warnings; `fork-workflow.md` documents fork PR flow (squash-merge, one purpose per PR, issues/tools/IDs citable); build/test mutex on serval (lockfile or separate roots); hosted workflows pinned to `push` on `next` + `workflow_dispatch` with owner guard.

**Exit:**

- `tools/rules-check`, `tools/register-check` PASS; push-guard constructed-violation proofs re-run with still-refuses list filed.
- Mutex proven: concurrent `build` + `vm-qa` invocations serialize (log filed); no `pull_request`-triggered self-hosted job exists (`grep -R "runs-on: self-hosted" .github/workflows` + trigger triage filed).

### P5 — Tier 1 audit only (the 0.0.x fix list)

**Entry:** P2 tagged; Q16 answered (Tier 1 gates 0.1, Tiers 2–3 deferred).

**Work:** `code-auditor` milestone tier, both seats, Tier 1 scope (fork's 121k: cloud scripts, proxy, OS scripts, RetroArch patches, ES pages/cards/tests). Every behavioral finding proven on VM before punch status.

**Exit:**

- `docs/audits/<date>-milestone-whole-codebase-tier-1/` with six phase files + `second-opinions/` packets + `tools/lint-audit-artifacts` PASS + punch-list issue.
- Every punch item resolved through Phase 7 or accepted by register row before 0.1 (per D-WORKFLOW-083, scoped to Tier 1).

### P6 — Runner step 0 for 0.1 (RetroArch under ES socket, days, reversible)

**Entry:** P5 punch closure or explicit deferral rows; Q15 gate set.

**Work:** RetroArch menu/OSD off, `network_cmd_enable` on, ES pause page + cards drive pause/save/load/screenshot/quit over one small protocol; launcher writes RetroArch config as now; RetroArch menu kept reachable from one row for uncovered settings (per `issue-336.md`).

**Exit on same guest:**

- Three 2D cores + one GLES core (e.g., SNES + N64 per `issue-336.md` version-1 note) launch from ES, pause/save/load/quit via ES pages, frames filed.
- `tools/time-to-play` table: step 0 vs RC2 RetroArch, delta within Q15 gate; resident-memory delta recorded.
- Fallback proven: per-core switch to plain RetroArch with 0 player-visible breakage on merge-break simulation (pin rollback test).

0.1 tags on P5 + P6. Fresh runner (step 1) and bridge do not gate 0.1.

### P7 — Experiments and deferred work, explicitly non-gating (order after 0.1)

1. **Hosted VM CI experiment:** publish `/dev/kvm` presence, artifact transfer time for 2 GB, `vm-qa` wall time, disk high-water, GL path (llvmpipe vs fail). Gate moves only if: KVM present 10/10 runs, wall <6 h with margin, disk headroom >20%, and GPU-dependent suites marked N/A-hosted with local-only gating retained.
2. **Second Tiny provisioning:** order per Q11 only after P0 backup exists; provisioning is a script + checklist run, proven by restoring backup + cold-building GENERIC_X64 on the new box while serval runs `vm-qa` (the "one builds, one proves" shape).
3. **Tier 2 → 0.2, Tier 3 → 0.3, provenance table scoped to carried patches first** (count of rows = count of carried patch files, not all 525k lines on day one).
4. **Silent boot (#340):** frame classifier + journal parity + serial check on guest d, then RG35XX SP + Nova rows. 0.2+ candidate.
5. **Site:** MkDocs under `rasteratops.com` with attribution on front page; build log last line filed. Docs release, not OS gate.
6. **Cloud migration (if Q1 deferred):** dry-run + backup + rollback design, proven on fake provider before any default flip.
7. **Fresh runner spike (step 1):** only after P6 numbers + Tier 3 read of launch path; exit is P6-equivalent proofs + `rc_client`-via-proxy packet-diff + offline-queue walk, not "glue done."

---

### What this recommended plan preserves from #338

- Visible-first rename, paths frozen (Choice 1) — kept, but proven with a build log and squashfs grep, and documented in `NAMING.md`.
- Transfer + stay in fork network (D-WORKFLOW-086) — kept; issues are the paper trail.
- Vultr preference / GCP avoidance, GitHub for now with host-agnostic tooling where cheap — kept as preferences, not as unpriced assertions.
- `rasterabot` as machine account with scoped token + SSH + mail — kept, with team grant, voice flag, and inbox trigger rule fixed.
- Time-to-play as the measure, VM-first with reasoned no, per-action yeses, upgrade + clean-install matrix — kept and given numbers.

What it refuses: a one-day 0.0.1 covering four devices, a cloud migration, a site, and an updater flip on an unbacked-up single box with no merge cadence and three audit tiers plus a runner plus silent boot all "gradually" competing for the same stream. That plan does not fail loudly; it fails by shipping a 0.0.1 that still says ROCKNIX in the one place nobody grepped, that cannot update itself, and that nobody can rebuild after a disk failure.


=== END muse-analysis.md ===

## Output

Produce a peer review that identifies the strongest claims, weakest claims, missing failure modes, and concrete revisions each proposal should consider. Do not vote yet, and do not revise your own plan in this step.

Refer to each analysis by its injected filename (e.g. `claude-analysis.md`), never by an invented ordinal like "Analysis 1" — downstream steps inject your review into other members' prompts, and anonymized ordinals have caused members to misidentify which Step 1 position was their own (2026-08-17 q3q4 run, Step 3).

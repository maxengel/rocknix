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
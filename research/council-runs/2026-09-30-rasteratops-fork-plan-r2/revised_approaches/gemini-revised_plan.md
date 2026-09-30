# Step 3 — Revised approach: The disciplined identity release

## 1. Executive review and realignment

My Step 1 analysis correctly identified the physical-boot contract risk of partition labels (`boot=LABEL=ROCKNIX`), the supply-chain hazard of floating upstream build containers, and the necessity of aggressive scope discipline. However, the peer reviews from **Claude**, **GPT**, **Kimi**, and **Muse** demonstrated that my initial proposal suffered from critical mechanical, procedural, and threat-model flaws:

1. **Permanently rejecting the code-level rename was an architectural overreach.** As **Claude**, **GPT**, and **Muse** point out, git’s rename detection (`merge.renameLimit`) handles path renames cleanly; delaying a directory rename does not create a compounding merge tax. Declaring a permanent severance overrules the owner’s intent in `D-WORKFLOW-085` without empirical justification.
2. **Relitigating fork-network detachment was wrong.** As **Claude**, **GPT**, and **Kimi** emphasize, `D-WORKFLOW-086` is a settled owner decision. A "forked from" line is provenance, not endorsement. The operational hazard of pull requests defaulting their base to upstream must be resolved via contributing templates and branch protections, not by severing the network.
3. **Hosted runner capabilities were evaluated on stale premises.** As **Claude** and **GPT** demonstrate, public GitHub-hosted Linux runners provide 4 vCPU / 16 GB RAM and `/dev/kvm`. My conclusion that hosted VM QA is "physically impossible due to 7 GB RAM" was technically incorrect. However, **Muse** and **Claude** are entirely right that hosted runners lack GPUs, meaning all GL rendering falls back to llvmpipe; nested virtualization disk I/O remains a bottleneck; and shared runner timing cannot validate `time-to-play`. Hosted QA should be treated as an unmeasured, non-gating experiment, not an immediate gate.
4. **Scope cuts misidentified existing gates.** As **Claude**, **GPT**, and **Kimi** caught, `D-WORKFLOW-083` gates version **0.1**, not 0.0.1. Furthermore, #336 (RetroArch under ES) and #340 (visual regression classifier) were never scheduled for 0.0.1.
5. **The updater manifest server added unneeded infrastructure.** Prescribing a custom static JSON endpoint before inspecting the client code violated read-first discipline (**GPT**, **Kimi**, **Muse**). The rate-limit justification was overstated (**Claude**); release downloads do not consume unauthenticated REST API limits.
6. **The security axis was completely absent.** My Step 1 proposal omitted runner isolation, PR trigger escalation, credential separation, and webhook attack surfaces (**Claude**, **GPT**, **Kimi**, **Muse**).
7. **Cloud sync dual-path resolution was a dangerous inclusion.** Including dual-path resolution in Phase 2 contradicted the core principle of identity isolation (**Claude**, **GPT**, **Kimi**, **Muse**). Touching the sync namespace with `--delete-excluded` exposes the user to catastrophic save-game loss.
8. **Release notice wording contradicted the trademark rationale.** Suggesting that "ROCKNIX branding and marks are retained under CC BY-NC-SA 4.0 attribution" was legally inverted (**Claude**, **GPT**). The purpose of the rename is to *replace* the marks to avoid implying endorsement.

---

## 2. Core architectural reconciliations

### 2.1 The rename strategy: Retained for now, forward-rule applied
* **Critiques evaluated:** **Claude** (trial merge on throwaway branch), **GPT** ("retained for now", match register), **Muse** (forward rule for new artifacts), **Kimi** (owner choice on directory layout).
* **Position:** Accept **Claude**, **GPT**, and **Muse**; withdraw the permanent rejection of the code-level rename.
* **Mechanism:**
  1. For release 0.0.1, internal filesystem paths remain `distributions/ROCKNIX/` and package paths remain unchanged. Identity strings are updated strictly via `DISTRONAME="Rasteratops"` in distribution options and `/etc/os-release`.
  2. **The Forward Rule (Muse):** Any new fork-owned package, helper script, or configuration added from 0.0.1 onward must use the `rasteratops` naming prefix.
  3. **Measured Trial Merge Gate:** Any future directory-level rename (`distributions/ROCKNIX` → `distributions/rasteratops`) is deferred to post-0.0.1 and strictly gated on a measured trial merge against `upstream/next` on a throwaway branch. If rename conflicts exceed a predefined budget, the directory remains as-is.

### 2.2 Partition labels and persisted paths: The "Display vs. Persisted" boundary
* **Critiques evaluated:** **Claude** (grep before change; keep labels at RC2 values), **GPT** (do not patch boot scripts with fallbacks; keep labels identical), **Kimi** (audit hostname/SMB leaks).
* **Position:** Accept **Claude** and **GPT**; modify my initial partition-label fallback proposal.
* **Mechanism:** Do *not* patch `distributions/.../config/functions` or initramfs scripts with fallback disk-label search logic. In 0.0.1, partition labels and mount contracts are frozen at their RC2 values: `DISTRO_BOOTLABEL="ROCKNIX"` and `DISTRO_DISKLABEL="STORAGE"`. The display name changes to "Rasteratops" in EmulationStation, the boot splash, and `/etc/os-release`, but all filesystem labels, mount points, and internal state paths (`/storage/.config/rocknix`) remain unchanged.

### 2.3 Cloud sync: Complete exclusion from 0.0.1
* **Critiques evaluated:** **Claude**, **GPT**, **Kimi**, **Muse** (unanimous rejection of cloud folder migration in 0.0.1).
* **Position:** Concede entirely. Remove dual-path resolution from 0.0.1.
* **Mechanism:** The cloud sync folder remains `/ROCKNIX` on all upgraded and clean installs. Zero remote namespace creation, zero path migration. Cloud sync namespace changes are deferred to a dedicated minor release with an explicit schema, bidirectional sync testing, and non-destructive conflict handling.

### 2.4 Updater mechanism: Read-first and degraded-mode adoption
* **Critiques evaluated:** **Kimi** (version comparison trap: `rc2-YYYYMMDD` vs `0.0.1`; asset naming regex; POST vs GET), **GPT** (manual-adoption fallback; checksum != signature), **Claude** (rehearse client discovery), **Muse** (minimal re-point before new manifest).
* **Position:** Concede on the static manifest server; adopt read-first inspection and explicit fallback staging.
* **Mechanism:**
  1. **Phase 0 Inspection:** Read `packages/sysutils/rocknix-update` to verify:
     - Does the client query GitHub Releases API or an HTTP endpoint?
     - How does its version comparison rank `0.0.1` relative to `rc2-2024...`?
     - What asset naming patterns and architecture tokens does it match?
  2. **Channel Resolution:** If the RC2 client natively parses GitHub Releases and correctly orders `0.0.1`, configure the release channel URL to point to `rasteratops/rasteratops`.
  3. **Degraded-Mode Adoption Fallback (GPT):** If the RC2 client cannot parse `0.0.1` due to lexical sort bugs or endpoint hardcoding, 0.0.1 is designated an **explicit manual-adoption release** (dropping the `.tar` into `/storage/.update`). The 0.0.1 client is then fixed and verified to point directly to Rasteratops releases for all subsequent updates (`0.0.2+`).

### 2.5 Scope and Sequencing: X64-first proving milestone
* **Critiques evaluated:** **Muse** (GENERIC_X64 first; build log required), **Claude** (x64-first inside Phase A), **GPT** (support matrix vs build targets), **Kimi** (schedule bottleneck on ARM flashes).
* **Pushback against Muse:** **Muse** proposed cutting 0.0.1 to *only* `GENERIC_X64`, releasing handheld images under separate per-device tags (`0.0.1-h700`). I push back against this product-scope fragmentation. A retro-gaming handheld OS that ships its initial tag exclusively for x64 PCs provides zero utility to the handheld user base and complicates version tracking.
* **Adopted compromise:** Sequence **GENERIC_X64 as the proving gate inside Phase 1**. The `DISTRO/PROJECT` separation, build scripts, image generation, and updater rehearsal must pass on x64 before any ARM targets are built. Once proven on x64, build the three ARM targets from the identical head and publish a single unified `0.0.1` tag containing all four images.

---

## 3. Revised execution plan

```
Phase 0: Security Hardening & Source Inspection (Prerequisites)
  ├── 0.1 Runner isolation & workflow trigger restrictions
  ├── 0.2 Build container mirroring & digest pinning
  ├── 0.3 Third-party source archive audit (GPL compliance)
  └── 0.4 Code inspection: updater, boot labels, & identifier sweep
Phase 1: Implementation & X64 Proving Milestone
  ├── 1.1 Upstream repository preparation (fork splash, transfer ES)
  ├── 1.2 Identity rebranding (display text, splash, os-release)
  ├── 1.3 GENERIC_X64 cold build & candidate store isolation
  └── 1.4 VM QA boot verification & RC2→0.0.1 updater rehearsal
Phase 2: Multi-Target Build & 0.0.1 Delivery
  ├── 2.1 Parallel ARM builds (H700, RK3566, SM8550)
  ├── 2.2 Physical device flash & smoke validation
  ├── 2.3 Dependency closure release manifest assembly
  └── 2.4 Publication behind explicit owner confirmation
Phase 3: Post-0.0.1 Roadmap & Audit Integration
  ├── 3.1 Unblock Step 0 spike (RetroArch under ES)
  ├── 3.2 Refine D-WORKFLOW-083 (Tier 1 gates 0.1; Tiers 2–3 iterative)
  └── 3.3 Establish upstream merge cadence & trial-merge gate
```

---

### Phase 0: Security hardening, supply chain, and inspection

*Objective: Secure the execution environment and resolve architectural unknowns before modifying code.*

1. **Self-Hosted Runner Isolation (Claude, GPT):**
   - Configure `.github/workflows/` so that self-hosted runners (`serval`) **never execute on `pull_request` triggers from external forks**. PR workflows run exclusively on ephemeral, unprivileged GitHub-hosted runners.
   - Self-hosted runners execute only on `push` to protected branches (`next`) and manual `workflow_dispatch`.
   - Strip the runner user account of Docker socket access, `sudo` rights, and read access to host credentials (`~/.ssh`, `~/.config/gh`, cloud tokens).
2. **Build Container & Source Mirroring (Claude, GPT, Muse):**
   - Pull the known-working build container `ghcr.io/rocknix/rocknix-build:latest`.
   - Re-tag and push to `ghcr.io/rasteratops/rocknix-build:<immutable-sha256-digest>`.
   - Pin the container reference in build scripts by digest.
   - Identify `DISTRO_SRC` fallback URLs to ensure third-party tarballs are not dependent on upstream ROCKNIX infrastructure, guaranteeing GPL corresponding source availability (**GPT**).
3. **Repository Operational Mitigations (Claude, Muse):**
   - Add `.github/pull_request_template.md` and `CONTRIBUTING.md` warning contributors that this repository is an independent fork and requiring PRs to target `rasteratops:next`.
4. **Read-First Code Inspection (Kimi, GPT, Claude):**
   - **Updater:** Read `packages/sysutils/rocknix-update` to document version-comparison logic, API routes, and asset regexes.
   - **Identifiers & Labels:** Execute an exhaustive grep across `packages/`, `projects/`, `scripts/`, and `config/` for:
     ```bash
     grep -rnE '(DISTRONAME|DISTRO_BOOTLABEL|DISTRO_DISKLABEL|HOSTNAME)' .
     ```
   - Classify all hits into **Display** (safe to rename) vs. **Persisted/System** (must retain RC2 value in 0.0.1).

*Exit Gate Phase 0:*
- [ ] Runner execution policy verified: external PR workflow fails to trigger self-hosted runner.
- [ ] Build container digest pinned and mirrored under `ghcr.io/rasteratops/`.
- [ ] Updater compatibility report completed; migration path (OTA vs manual adoption) selected.
- [ ] Identifier classification table recorded.

---

### Phase 1: Implementation & X64 proving milestone

*Objective: Prove the DISTRO/PROJECT split and upgrade compatibility on x64 before committing ARM compute.*

1. **Repository Topology Setup (Kimi, Claude):**
   - Fork `rocknix-splash` into `rasteratops/splash` (do not attempt transfer; upstream owns it).
   - Transfer `EmulationStation-fcamod` to `rasteratops/EmulationStation-fcamod`.
   - Re-point package recipes in the main distribution tree to the fork-owned repositories.
2. **Identity Implementation (Strict Display-Only):**
   - Update `distributions/ROCKNIX/options`: set `DISTRONAME="Rasteratops"`.
   - Retain `DISTRO_BOOTLABEL="ROCKNIX"` and `DISTRO_DISKLABEL="STORAGE"`.
   - Update UI strings in EmulationStation, splash screen assets, and `/etc/os-release`.
   - Retain `/storage/.config/rocknix` state directory and `/ROCKNIX` cloud sync directory.
3. **GENERIC_X64 Cold Build & Artifact Staging (GPT):**
   - Execute cold clean build of `PROJECT=ROCKNIX ARCH=x86_64 DISTRO=ROCKNIX` (or `DISTRO=rasteratops` if split validates).
   - Capture full build log; verify stamp generation and clean packaging.
   - Stage output artifact to an immutable candidate directory: `/srv/releases/candidates/0.0.1-rc1/`.
4. **X64 Proving Gates (VM QA & Updater Rehearsal):**
   - **Fresh Boot:** Boot image in local QEMU/KVM guest (`guest d`). Verify clean boot to EmulationStation, resolution handling, input response, and display strings.
   - **Brand Residue Audit:** Mount rootfs squashfs and execute brand verification with an explicit allowlist (**Claude**, **Muse**):
     ```bash
     strings usr/bin/emulationstation | grep -i "rocknix" | grep -vFf /path/to/naming-allowlist.txt
     ```
   - **Updater Rehearsal (Claude, Kimi):** Boot an existing RC2 VM guest. Point its updater at the candidate 0.0.1 channel. Verify that:
     1. The update is discovered and evaluated as newer than RC2.
     2. The image downloads, verifies checksum, and unpacks to `/storage/.update`.
     3. On reboot, the system applies the update, boots cleanly, and preserves all user configurations, saves, and partition mounts.

*Exit Gate Phase 1:*
- [ ] GENERIC_X64 image compiles clean from cold state.
- [ ] VM fresh boot passes display and UI audits with zero un-allowlisted "ROCKNIX" residue.
- [ ] RC2 VM guest upgrades to 0.0.1 cleanly with state and data intact.

---

### Phase 2: Multi-target build & 0.0.1 delivery

*Objective: Produce the full target matrix and deliver the 0.0.1 release.*

1. **Multi-Target ARM Builds:**
   - Execute builds for `H700`, `RK3566`, and `SM8550` from the identical Git commit proven in Phase 1.
   - Stage all four images into the immutable candidate store.
2. **Target Validation & Smoke Verification:**
   - Flash each target image to its corresponding physical device (or VM for x64).
   - Verify bootloader execution, kernel init, display initialization, and controller input.
3. **Release Manifest Closure (GPT):**
   - Assemble an immutable release manifest recording:
     - Distribution Git commit SHA.
     - Sub-repository commit SHAs (EmulationStation, splash).
     - Build container digest.
     - SHA256 checksums and `BUILD_ID` for all 4 images.
     - Notice bundle: Attribution of upstream lineage, non-endorsement statement, and licenses of bundled components.
4. **Publication:**
   - Draft GitHub release tagged `0.0.1` on `rasteratops/rasteratops`.
   - Attach the 4 device images, `.sha256` checksums, and release manifest.
   - Publish release strictly after manual, authenticated owner approval.

*Exit Gate Phase 2:*
- [ ] Four images generated from one Git head.
- [ ] Physical handhelds booted successfully on candidate images.
- [ ] Release manifest signed/checksummed and published with accurate attribution text.

---

### Phase 3: Post-0.0.1 roadmap & audit integration

*Objective: Realign ongoing engineering tracks without bottlenecking delivery.*

1. **Unblock Step 0 Spike (RetroArch under ES):**
   - Step 0 (running RetroArch as a background service with ES acting as frontend) is an exploratory architecture spike.
   - Step 0 is **unblocked immediately following 0.0.1** and develops on an isolated spike branch (`feature/es-runner-step0`).
   - The spike requires only basic feasibility validation (window compositing, socket IPC, input focus), not a comprehensive security audit (**GPT**).
2. **Refine D-WORKFLOW-083 (Audit Release Gate):**
   - Formally amend `D-WORKFLOW-083` in the register:
     - **0.0.1:** Released with zero audit gating (pure identity and supply-chain release).
     - **0.1.0 Gate:** Gated strictly on the resolution of **Tier 1** audit punch items (security vulnerabilities, crash bugs, potential data corruption).
     - **0.2.0+ Releases:** Address **Tier 2** (upstream maintenance friction) and **Tier 3** (deep architecture/MinUI runner clean-room audit) punch items incrementally.
3. **Upstream Merge Cadence & Trial-Merge Policy:**
   - Establish a bi-weekly sync check against `upstream/next`.
   - Track upstream diffs using `git diff upstream/next -- distributions/ROCKNIX/`.
   - Maintain a divergence log. If a code-level path rename is formally proposed, it must pass a trial merge with zero unresolvable structural conflicts before adoption.

---

## 4. Synthesis of pushbacks and adaptations

| Peer Reviewer | Evaluated Claim | Determination | Mechanical Justification |
| :--- | :--- | :--- | :--- |
| **Claude** | Grep paths/labels before modifying `DISTRONAME`; keep RC2 values. | **Accepted** | Initramfs and bootloader look for specific labels; keeping labels identical avoids all boot migration shims in 0.0.1. |
| **Claude** | Stale hosted runner specs (public runners have 16 GB RAM / KVM). | **Accepted** | Conceded factually; corrected premise. Hosted runners still disqualified from gating due to GPU/timing absence. |
| **GPT** | Release as dependency closure with immutable candidate store. | **Accepted** | Eliminates worktree/QA image replacement race on the single build box. |
| **GPT** | Checksums do not equal release authentication; provide fallback. | **Accepted** | Fallback to manual adoption protects fleet if OTA parser fails. |
| **Kimi** | Version ordering trap (`rc2-YYYYMMDD` vs `0.0.1`). | **Accepted** | Lexical comparison ranks `0.0.1` older than `rc2-`; must inspect parser before scheduling OTA. |
| **Kimi** | Tier 3 audit gates step 1 (MinUI clean runner), not step 0. | **Accepted** | Step 0 is a process-control spike inside existing code; Tier 3 audit applies to clean-room rewrites. |
| **Muse** | Cut 0.0.1 to GENERIC_X64 only; issue per-device tags later. | **Rejected** | Destroys handheld value proposition and fragments tag scheme. Adapted to: x64-first *proving gate*, followed by unified 4-image tag. |
| **Muse** | DISTRO/PROJECT split has never been compiled; require build log. | **Accepted** | Build log is mandatory exit gate for Phase 1 before ARM compute starts. |
| **All** | Drop custom static manifest server; read client code first. | **Accepted** | Manifest server was premature optimization that created hosting, TLS, and maintenance debt. |
| **All** | Drop cloud folder migration from 0.0.1. | **Accepted** | Avoids `--delete-excluded` save data destruction in an identity release. |
| **All** | Reverse permanent rejection of code-level rename. | **Accepted** | Git rename detection handles path shifts; permanent rejection overreached. Deferred to measured trial merge. |

---

## 5. Minimal owner decisions required to unblock Phase 0

To initiate Phase 0, exactly three decisions are required from the maintainer:

1. **Updater Failure Policy:** If code inspection reveals that the RC2 updater cannot parse `0.0.1` as a newer release, does the owner approve designating 0.0.1 as an explicit manual-adoption release (`.tar` to `/storage/.update`), with automated updates beginning at `0.0.2`?
2. **Cloud Folder Baseline:** Confirm that remote cloud sync remains strictly at `/ROCKNIX` for 0.0.1, with all namespace migration deferred.
3. **Execution Sequence:** Confirm the **x64-first proving gate** (x64 VM boot and upgrade rehearsal pass before initiating ARM target builds).
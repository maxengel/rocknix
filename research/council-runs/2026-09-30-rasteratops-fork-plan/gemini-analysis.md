# Adversarial Critique and Strategic Analysis of the Rasteratops Fork Plan

- **Author:** Council Member (Independent Seat)
- **Subject:** Plan to fork ROCKNIX as Rasteratops ([Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md))
- **Date:** 2026-09-30
- **Corpus Integrity & Provenance Verification:**
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md` (`371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md` (`7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-337.md` (`4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md` (`c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md` (`188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-341.md` (`433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md` (`cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md` (`7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md` (`63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md` (`846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`)
  - `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/LICENSE.md` (`61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`)

---

## Executive Summary

The decision to fork ROCKNIX as **Rasteratops** is settled ([D-WORKFLOW-084](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md)), driven by the irreconcilable impedance mismatch between the maintainer's high-leverage AI-assisted workflow and upstream's review capacity and policies ([Issue #333](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md); [Issue #334](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md)). 

However, the execution plan set out in [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md), combined with the sprawling peripheral commitments in Issues [#336](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md), [#339](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md), and [#340](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md), contains critical structural flaws:
1. **The "surface rename" trap**: It assumes that deferring internal path renames saves work, while failing to account for how LibreELEC/JELOS layered configurations resolve variables like `DISTRONAME` and `PROJECT`. Deferring internal alignment creates a permanent merge tax or a future rebase cliff.
2. **Capital misallocation on hardware**: Spending $2,000 on a second identical 64GB machine leaves the primary compile bottleneck (`webkitgtk` OOM compiler crashes) completely unaddressed on *both* machines, while misjudging current memory market pricing.
3. **Unrealistic hosted runner expectations**: Relying on standard GitHub-hosted runners for nested KVM virtualization and 16GB+ QEMU disk visual regression suites is technically unviable or financially irrational.
4. **Scope explosion before 0.0.1**: The plan attempts to simultaneously manage an OS rebrand, multi-device cold builds, a 450,000-line code review ([Issue #339](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md)), a headless libretro C runner architectural rewrite ([Issue #336](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md)), and silent boot firmware debugging ([Issue #340](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md)).

For a single human maintainer supported by an AI assistant, this is a recipe for operational collapse. Below is an adversarial breakdown of what is broken, what will break, and the lean, sequenced path to a durable 0.0.1.

---

## 1. Claims and Assumptions That Are Wrong, Unproven, or Contradicted

### 1.1 The "Two-Step Rename" Illusion and Build Resolution Breakdown
- **The Plan's Claim:** [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md) (Phase A) and [D-WORKFLOW-085](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md) posit:
  > *"A brand rename, not a path rename. Renaming the paths and the script names would touch thousands of files and turn every `upstream/next` merge -- the hardware work the fork keeps -- into a conflict across all of them... The player-visible identity changes completely... and the internal paths and script names stay as upstream has them."*
  > Maintainer: *"I think the code-level rename can wait. it isn't the top priority. we will want to do it, but not as the top priority."*
- **Contradiction with the Build System:** 
  In [CLAUDE.md](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md), the architecture is documented as:
  > *"Layered config resolution (`config/options`): options are sourced in order — `distributions/<DISTRO>/options` → `projects/<PROJECT>/options` → `projects/<PROJECT>/devices/<DEVICE>/options` → `config/arch.<ARCH>`"*
  > And: *"export PROJECT=ROCKNIX DEVICE=RK3588 ARCH=aarch64"*
  The build system uses `DISTRO` to locate `distributions/<DISTRO>/options`. If `distributions/ROCKNIX/` is renamed or copied to `distributions/rasteratops/`, then `DISTRO=rasteratops` must be passed to every build script, `Makefile` target, and container invocation. 
  However, `PROJECT` remains `ROCKNIX` (pointing to `projects/ROCKNIX/`). In JELOS/LibreELEC derivatives, numerous package overrides, boot scripts, systemd unit templates, and environment scripts hardcode checks like `[ "$DISTRONAME" = "ROCKNIX" ]` or look up paths under `/storage/.config/rocknix` and `/usr/bin/rocknix-*`.
  Leaving 3,485 file names and 1,229 files referencing `ROCKNIX` while changing only `DISTRONAME` will create runtime script breakages where upstream scripts expect `$DISTRONAME` to match their path conventions.
  Furthermore, the plan claims that a full code-level rename can happen "later" with the merge cost taken then. This is backwards: the cost of a path rename increases *exponentially* with every commit merged from `upstream/next`. Doing it later guarantees a permanent divergence cliff where merging upstream becomes impossible without re-resolving thousands of tree-wide path conflicts.

### 1.2 The "KVM on GitHub-Hosted Runners" Assumption
- **The Plan's Claim:** [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md) (Phase C):
  > *"The VM suites on hosted runners as an experiment: Ubuntu hosted runners expose `/dev/kvm`, so `tools/vm-qa` can boot the image there if the image arrives as a release artifact (2 GB) and the run fits the six-hour limit; measured once before it is relied on."*
- **Contradiction with Infrastructure Realities:**
  Standard public GitHub-hosted runners (`ubuntu-latest`, 2 vCPU, 7 GB RAM) do *not* guarantee `/dev/kvm` availability, nor do they provide adequate I/O throughput for nested emulation of full OS images. 
  In [CLAUDE.md](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md), the VM testing constraints are explicit:
  > *"VM disk must be 16GB+ or first boot breaks in a way that looks like a graphics bug... SSH is disabled on a fresh image, so serial is the way in... stop the VM by its pidfile, never by `pkill` pattern."*
  Downloading a 2 GB compressed artifact, decompressing it to a 16 GB sparse image, launching QEMU with software-rendered Mesa/DRM or emulated GLES on a 2-vCPU hosted runner, and executing the visual QA screenshot suites (`tools/vm-visual-qa`) will suffer severe CPU throttling, non-deterministic race conditions on boot timeouts, and high false-positive visual test failures. Counting on hosted runners to take workload off the local machine is an unproven assumption that will burn days of CI debugging.

### 1.3 The $2,000 Memory Fallacy and the Second Build Box Miscalculation
- **The Plan's Claim:** [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md) (Comments at 00:22:52Z and 00:24:15Z):
  > Maintainer: *"with RAM prices being what they are right now, it looks like it'd be about $2,000 to buy 128 gigabytes of RAM. So that might change our calculus slightly for an online build box, but perhaps not... I get pretty substantial discounts on Lenovo computers through a work program, so I could get another version of what we have now for $2,000."*
  > Assistant response: *"Then the second Tiny is the purchase, and Phase D's comparison is settled by it... memory at the standard 64 GB, since the split of roles is what relieves the pressure, not the total."*
- **Contradiction with Technical Evidence:**
  The assistant completely abandoned its own technical diagnosis. In [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md) (Comment 00:09:32Z), the primary bottleneck was identified with precision:
  > *"The one failure the builds have on this box is memory: webkitgtk at 24 threads killed the compiler twice on 2026-09-19 and is capped to four threads since; a QA guest is 2 to 4 GB each and is the first thing a build under pressure kills."*
  If the maintainer buys a second identical ThinkStation P3 Tiny with 64 GB of RAM:
  1. Box 1 *still* has only 60 GB usable RAM.
  2. `webkitgtk` *still* cannot be compiled at 24 threads on Box 1 without killing `cc1plus`. It remains capped to 4 threads, prolonging cold builds indefinitely.
  3. Box 2 (a 24-core Intel Core Ultra 9 285 monster) will sit largely idle running lightweight QEMU VM instances (requiring 2 to 4 GB RAM and 2 cores), which is an absurdly inefficient utilization of compute.
  4. The market price cited ($2,000 for 128 GB RAM) is completely inaccurate for DDR5 SO-DIMMs. A standard non-ECC 96 GB kit (2 x 48 GB DDR5 5600 MT/s SO-DIMM) retails for roughly $250–$350, and 128 GB kits (2 x 64 GB) retail for $450–$650. Even if OEM Lenovo-branded memory was priced at $2,000 in their enterprise configurator, third-party Crucial/Corsair/Kingston SO-DIMMs cost a fraction of that. Buying a $2,000 duplicate machine without fixing the 64 GB memory wall on the primary builder solves the wrong problem.

### 1.4 The Scope Contradiction of Issue #339 (Adversarial Code Review)
- **The Plan's Claim:** [Issue #339](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md) and [D-WORKFLOW-083](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md) plan an adversarial review across three tiers:
  > Tier 1: 121,000 lines written by the fork (~20 packets per seat).
  > Tier 2: 140,000 lines of OS scripts, launcher, recipes, quirks (12–15 packets).
  > Tier 3: 185,000 lines of EmulationStation core/app (15 packets).
  > Total: ~446,000 lines of active code, plus a provenance audit for 525,000 lines of patches.
  > *"Every punch item resolved through Phase 7 before 0.1, or accepted by a register row."*
- **Contradiction with Maintainer Stated Boundaries:**
  In [D-WORKFLOW-082](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md) and [Issue #335](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md) (Comment 23:24:04Z), the maintainer stated categorically:
  > *"Really, honestly, don't want to read through everything. We have a fairly complicated structure in place running here to ensure quality that will only mature in our own CI/CD pipeline: use of VMs, regression testing, and then testing, etc. is likely far more advanced than what they're doing. I trust our process, so I don't feel the need to manually review our commits, nor do I even have the time."*
  And in [Issue #335](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md) (Comment 23:43:11Z):
  > *"there's no way I can review 80,000 lines of code"*
  Gating version 0.1 on the complete triage and remediation of an adversarial audit across 446,000 lines of legacy JELOS/ROCKNIX/Batocera code is in direct opposition to the maintainer's time constraints. It will produce hundreds of historical findings (dead code, shell script antipatterns, race conditions in upstream packages) that neither the maintainer nor the assistant can afford to remediate without destabilizing the working RC2 foundation.

---

## 2. Risk Assessment (Ordered by Expected Cost)

| Rank | Risk | Probability | Severity | Expected Cost | Primary Driver |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Upstream Merge Bankruptcy & Rebase Drift | High | Catastrophic | **Critical** | In-tree package changes, deferred path rename, ES diverge |
| **2** | EmulationStation Architectural Divergence (#336) | High | High | **High** | 42k+ existing diff + socket IPC rewrite in C++ |
| **3** | Updater / State Incompatibility (Bricking Upgrades) | Medium | High | **High** | Transition from `/storage/.update` and `rocknix-update` |
| **4** | Build Infrastructure Asymmetry & Stamp Poisoning | High | Medium | **Medium-High** | Dual 64GB local boxes without unified build cache |
| **5** | Assistant Security Surface & Prompt Injection via Mail | Medium | High | **Medium** | Hostinger Mail MCP integration with push-capable bot |
| **6** | Licensing & Attribution Enforcement | Low | High | **Medium-Low** | CC BY-NC-SA branding compliance, unfree MinUI code |
| **7** | Device QA Fleet Testing Fatigue | High | Low | **Low-Medium** | 4 physical architectures requiring explicit "yes" |

### Detailed Risk Breakdown

#### Risk 1: Upstream Merge Bankruptcy & Rebase Drift
The entire rationale for maintaining a fork rather than writing an OS from scratch is captured in [D-WORKFLOW-084](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md):
> *"`upstream/next` is merged on for the hardware work; nothing more is submitted to ROCKNIX beyond the small generic fixes each project's upstream can read."*

The assumption is that hardware support (kernels, bootloaders, quirks, Mesa, SoC firmware) arrives "for free" via regular merges. 
However, the fork already touches 20 packages under top-level `packages/`, edits `scripts/image`, `scripts/extract`, and `scripts/build_distro`, injects custom kernel configs and device tree patches for H700 ([Issue #334](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md)), and maintains a 42,000-line overlay on EmulationStation.
When upstream ROCKNIX refactors build scripts or updates shared packages, git merges will generate massive merge conflicts. If the fork additionally implements the "deferred" code-level rename ([D-WORKFLOW-085](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md)) or changes the updater/distro structure, future merges will require manual multi-day three-way reconciliations. 
**Outcome:** Within 3 to 6 months, the maintainer will dread upstream merges, fall months behind, and the fork will freeze on an outdated hardware baseline.

#### Risk 2: EmulationStation Architectural Divergence
In [Issue #336](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md), the maintainer desires to eliminate RetroArch's heavy UI:
> *"EmulationStation stays the interface; what changes is the thing under it -- a libretro runner with no interface of its own, which ES launches, talks to and returns from, in place of RetroArch with its whole front end stitched underneath."*

EmulationStation in ROCKNIX is already a complex, multithreaded C++ application ([Issue #339](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md) records 184,891 lines in `es-app` and `es-core`). 
Adding a custom Unix domain control socket, drawing pause menus and achievement cards over active SDL2/GLES surfaces, and handling process lifecycle handovers creates an enormous maintenance surface. 
Upstream ROCKNIX regularly bumps and patches EmulationStation. If Rasteratops deeply alters ES's render loop and launch state machine, every upstream ES bump will be impossible to merge. 
Furthermore, MinUI's `minarch` has **no licence file** ([Issue #336](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md): *"MinUI has no licence file GitHub can find, and code with no licence is all rights reserved by default"*). Rewriting a custom headless runner from scratch on SDL2 and GLES using `nanoarch` as a reference is a multi-month systems programming effort, not a peripheral task.

#### Risk 3: Updater and State Incompatibility (Bricking Existing Devices)
Per [CLAUDE.md](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md):
> *"Every build ships onto devices that already have state. Before publishing, check both the upgrade path (a device keeping its `/storage`) and a clean install — see `upgrade-and-install.md`. A fix that changes what we write does nothing for what is already written."*

In [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md), Phase A includes:
> *"the updater pointed at the fork's own releases... the cloud folder's default name (`/ROCKNIX` in a player's cloud today -- read both, D-WORKFLOW-050)"*

If `rocknix-update` or the system update scripts rely on parsing `/etc/os-release` matching `OS_NAME=ROCKNIX`, or if the release naming convention diverges, an upgrade from RC2 to Rasteratops 0.0.1 could leave devices in an unbootable state or strand them on 0.0.1 unable to see future OTA updates. 

#### Risk 4: Assistant Security Surface & Prompt Injection via Mail Integration
In [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md) (Comments at 02:53:22Z, 04:38:14Z, and 05:43:54Z), an autonomous email integration was wired up:
- Mailbox: `rasterabot@rasteratops.com` via Hostinger Mail API.
- MCP server: `hostinger-email` loaded at user scope on the build machine.
- Git identity: `rasterabot` with direct write access to `rasteratops/distribution` and an active SSH signing key.
- A transcript security failure was already documented: an eight-digit GitHub launch code was printed into the transcript due to raw record dumping.
- The assistant is intended to use this inbox for:
  > *"An inbound channel for evidence... Bug reports the same way, when the fork has readers."*

Connecting an autonomous LLM assistant with direct git commit/push credentials to an open email inbox that processes external bug reports creates an immediate **indirect prompt injection vulnerability**. A maliciously crafted bug report or test payload emailed to `rasterabot@rasteratops.com` could instruct the agent to manipulate git history, alter `.githooks`, exfiltrate secrets via the Mail API, or corrupt release assets.

---

## 3. Recommended Plan Modifications: Scope, Order, and Gating

### 3.1 What Must Be CUT from Version 0.0.1
To prevent 0.0.1 from collapsing under its own weight, the following items must be explicitly cut from the 0.0.1 delivery milestone:

1. **CUT: The 4-Device Release Requirement for 0.0.1.**
   - *Why:* [Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md) Phase A demands: *"the four images from one head; vm-qa, the rehearsal from RC2... the devices on a yes."*
   - Cold-building four target families (GENERIC_X64, H700, RK3566, SM8550) on a 64 GB host takes roughly 24 hours of pure compile time and ~400 GB of disk.
   - 0.0.1 must be gated **only on GENERIC_X64 (VM proof) and ONE physical reference device** (the maintainer's primary handheld, the RG35XX SP). The remaining device images can be built and tagged in subsequent 0.0.x point releases once the distribution pipeline is proven.
2. **CUT: Cloud Runner Hosted VM QA (Phase C).**
   - *Why:* Do not waste hours attempting to get nested KVM and visual QA screenshot tests running reliably on GitHub-hosted runners. Keep VM QA strictly on local hardware.
3. **CUT: The Whole-Codebase Adversarial Audit ([Issue #339](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md)).**
   - *Why:* 0.0.1 is fundamentally RC2 (`69e6039f8f`) under a new brand. RC2 has already been validated through exhaustive visual and functional VM runs. Running a 450,000-line audit now generates noise that will delay the release for months.
4. **CUT: Silent Boot and Shutdown Optimization ([Issue #340](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md)).**
   - *Why:* Suppressing kernel/DRM console text, patching bootloader splashes on Allwinner/Qualcomm, and handling panel controller shutdown flashes requires low-level kernel/bootloader edits. It belongs in a post-0.1 polish milestone.
5. **CUT: The Libretro Runner Replacement ([Issue #336](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md)).**
   - *Why:* 0.0.1 must ship with standard RetroArch as the execution layer. The headless runner spike belongs in an isolated feature branch after 0.0.1 is in player hands.

### 3.2 What Must Be CHANGED in Ordering and Scope
1. **Unify the Brand and Distribution Paths Immediately (Do Not Defer).**
   - Instead of a hybrid state where `distributions/` is renamed but `projects/ROCKNIX/` and script paths remain split, make a clean, automated one-time migration for the distribution options:
     - `distributions/rasteratops/` becomes the canonical distro.
     - Keep `PROJECT=ROCKNIX` explicitly recognized as the hardware board definition directory (matching LibreELEC convention where `PROJECT` is the SoC/board vendor and `DISTRO` is the OS identity).
     - Do not touch internal script names (`rocknix-*`) yet, but document that `DISTRO=rasteratops` is the sole supported distribution target.
2. **Re-evaluate Hardware Investment Before Purchasing a Second Machine.**
   - Prioritize ordering a **96 GB or 128 GB DDR5 SO-DIMM kit for the existing ThinkStation P3 Tiny**. 
   - Relieving the memory pressure directly unlocks 24-thread compilation for `webkitgtk`, cutting hours off every full build, while allowing VM QA guests to run simultaneously without triggering Linux OOM kills.

---

## 4. What Is Missing Entirely from the Plan

1. **Automated Upstream Merge-Conflict Early-Warning System:**
   - The plan states that `upstream/next` will be continuously merged.
   - Missing: A lightweight GitHub Actions scheduled workflow that runs daily, attempts a dry-run merge (`git merge-tree`) of `upstream/next` into `next`, and posts an alert issue the moment upstream commits touch files modified by Rasteratops. Without this, merge conflicts accumulate invisibly until release day.
2. **Distribution Asset Storage and Bandwidth Strategy:**
   - A full release of 4 devices creates ~8 GB of compressed images per tag.
   - If updates are distributed via GitHub Releases, what happens when release assets exceed monthly limits or hit GitHub API rate limits on user handhelds?
   - The plan has no specification for release manifest generation (`update.json` / SHA-256 checks) that `rocknix-update` consumes.
3. **Rollback & Failsafe Recovery Specification:**
   - Handhelds update over Wi-Fi. If a player on RC2 upgrades to 0.0.1 and the image fails during boot (e.g. graphics driver failure or kernel panic), how does the device recover?
   - JELOS/ROCKNIX uses a dual-kernel/initramfs structure or a backup update mechanism in `/storage/.update`. The plan contains zero verification that the Rasteratops rebrand preserves the update fallback mechanism.
4. **Hard Quarantine for the Assistant's Inbound Channels:**
   - There is no architectural boundary between data read by `rasterabot` via Hostinger Mail API and execution contexts in Claude Code.
   - A strict instruction rule must be codified: mail content is strictly unprivileged raw string data; the assistant must never evaluate, execute, or treat mail bodies as instructions.

---

## 5. Questions Only the Maintainer Can Answer

1. **Memory Sourcing vs. Second Machine:**
   - *Context:* High-speed non-ECC 96 GB (2x48 GB) DDR5 SO-DIMM kits are widely available for ~$300, and 128 GB (2x64 GB) kits for ~$550. The $2,000 estimate likely reflected OEM enterprise quotes.
   - *Question:* Are you open to buying an aftermarket 96 GB or 128 GB SO-DIMM kit for the current ThinkStation P3 Tiny to eliminate the compiler memory wall immediately, rather than spending $2,000 on a second identical 64 GB machine that still suffers from compiler memory throttling?
   - *Unblocks:* Phase D hardware procurement and build concurrency architecture.

2. **0.0.1 Device Scope:**
   - *Context:* Cold builds for all 4 device families take significant local compute and require individual manual flashing/testing passes with explicit "yes" permissions.
   - *Question:* Will you approve gating 0.0.1 on GENERIC_X64 (VM QA) and the RG35XX SP (your daily driver), releasing the remaining devices (Nova, RG353M, RG SP) in 0.0.2 once the pipeline and update server are validated?
   - *Unblocks:* Phase A timeline, reducing release turnaround from days to hours.

3. **Upstream Merge Policy When Conflicts Occur:**
   - *Context:* Upstream ROCKNIX may refactor subsystems (like `GuiMenu.cpp` or package build recipes) that collide with our 79,000-line delta.
   - *Question:* If an upstream commit introduces heavy merge conflicts with Rasteratops-specific features, what is your standing policy: spend the days to resolve and maintain parity, or freeze/cherry-pick hardware commits only?
   - *Unblocks:* Upstream synchronization frequency and long-term branching strategy.

4. **Public Exposure and Issue Tracking:**
   - *Context:* You stated you do not want to manage a community or Discord, but want to offer an alternative quietly.
   - *Question:* Do you want GitHub Issues on `rasteratops/distribution` open to the public, or restricted to project members to prevent the repository from becoming an unmanaged support queue?
   - *Unblocks:* Repository settings in Phase B.

---

## 6. Recommended Actionable Plan

Below is the phased execution plan, structured with unambiguous, verifiable entry and exit criteria.

```
+-----------------------------------------------------------------------------------+
|                           RASTERATOPS EXECUTION ROADMAP                            |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 0: Repo Transfer, Account Scoping, & Policy Relaxation                      |
| - Verify org ownership, 2FA, scoped PAT for rasterabot                            |
| - Relax upstream-only policies (#341): PR size ceilings, AI footer stripping      |
| - Gate: tools/rules-check & register-check PASS; PAT write verified               |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 1: Visual Identity & Artwork Integration (VM-First)                         |
| - Fork rocknix-splash -> rasteratops/splash; insert Tiny5 Duo & triceratops SVG   |
| - Create distributions/rasteratops/; configure OS_VERSION=0.0.1                   |
| - Point updater endpoint to rasteratops/distribution/releases                     |
| - Gate: VM guest d boots; framebuffer shows splash; /etc/os-release verified      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 2: Rehearsal & Reference Hardware Validation                                |
| - Build GENERIC_X64 and RG35XX SP images from same commit                         |
| - VM Upgrade Rehearsal: Update RC2 -> 0.0.1; verify state & /ROCKNIX cloud sync   |
| - RG35XX SP hardware test with maintainer "yes"                                   |
| - Gate: Zero data loss on /storage; time-to-play <= 1.05s on VM                   |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 3: Tag & Publish Version 0.0.1                                              |
| - Generate release notes with mandatory CC BY-NC-SA attribution line              |
| - Tag v0.0.1; publish release artifacts (GENERIC_X64 + RG35XX SP) via gh CLI      |
| - Gate: gh release view confirms assets and checksums                             |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 4: Infrastructure & Build Host Optimization                                 |
| - Install memory upgrade on primary build box (96 GB or 128 GB SO-DIMM)           |
| - Remove webkitgtk 4-thread compile limit; verify full 24-thread build            |
| - Setup daily upstream-tracking merge-conflict dry-run workflow                   |
| - Gate: webkitgtk builds clean at -j24 with 0 compiler kills                      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| PHASE 5: Post-0.0.1 Initiatives (Sequenced, Non-Overlapping)                      |
| - 5.1: Build & release remaining device targets (Nova, RG353M) -> v0.0.2          |
| - 5.2: Issue #336 Step 0 (RetroArch headless control socket bridge in ES)         |
| - 5.3: Issue #340 Silent boot sequence optimization                               |
| - 5.4: Issue #339 Tier 1 adversarial audit (fork additions only)                  |
+-----------------------------------------------------------------------------------+
```

---

### Phase 0: Repository Transfer, Account Scoping, and Policy Relaxation
*Goal:* Finalize repository migration and remove policies designed solely for upstream compliance.

- **Entry Criteria:**
  - Repository `rasteratops/distribution` transferred and reachable ([Issue #338](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md)).
  - Account `rasterabot` exists with 2FA enabled.
- **Actions:**
  1. Verify `rasterabot` token permissions: scoped exclusively to `rasteratops` org repositories with contents, issues, pull requests, and workflows write access.
  2. Implement [Issue #341](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-341.md): Update `.githooks/pre-push` to drop upstream PR size ceilings (1,500 lines) and allow assistant commit footers / `Co-Authored-By` lines.
  3. Retire upstream series map (`docs/pr-series/map.txt`).
  4. Harden Mail MCP: Ensure `rasterabot-mail` runs with raw data isolation; mail bodies treated as untrusted strings.
- **Exit Criteria (Agent Verifiable):**
  - `gh api user --jq .login` executed on build box returns `rasterabot`.
  - `gh api orgs/rasteratops --jq .two_factor_requirement_enabled` returns `true`.
  - `tools/rules-check` returns `PASS` (0 errors).
  - `tools/register-check` returns `PASS` (0 errors).

---

### Phase 1: Visual Identity & Artwork Integration (VM-First)
*Goal:* Establish the player-facing Rasteratops identity on the GENERIC_X64 target.

- **Entry Criteria:**
  - Phase 0 exit criteria verified.
  - Maintainer approves the 32x20 pixel-art triceratops SVG and Tiny5 Duo wordmark ([Issue #337](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-337.md)).
- **Actions:**
  1. Fork `ROCKNIX/rocknix-splash` into `rasteratops/splash`. Replace letter paths in `main.c` with the triceratops logo and Tiny5 Duo path data. Implement integer downscaling for 640x480 (scale 6) and 1280x960 (scale 12).
  2. Pin `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk` to the new `rasteratops/splash` commit.
  3. Populate `distributions/rasteratops/` (copying options from `distributions/ROCKNIX/`), setting:
     - `DISTRONAME="rasteratops"`
     - `OS_NAME="rasteratops"`
     - `OS_VERSION="0.0.1"`
     - `UPDATE_URL="https://api.github.com/repos/rasteratops/distribution/releases"`
  4. Build GENERIC_X64 image in Docker (`make docker-AMD64` or native build).
- **Exit Criteria (Agent Verifiable):**
  - Build completes with valid stamp: `build.AMD64/image/.stamps/image/build_target` present.
  - VM headless boot (`generic-x64-vm run --headless`):
    - Frame capture via `tools/vm-visual-qa` confirms splash renders correctly on guest d at 640x480.
    - Serial query `tools/vm-serial "cat /etc/os-release"` returns:
      ```
      NAME=rasteratops
      VERSION=0.0.1
      ID=rasteratops
      ```
    - EmulationStation UI loads to carousel without crash or unhandled font glyphs.

---

### Phase 2: Upgrade Rehearsal & Hardware Reference Proof
*Goal:* Prove that existing player state survives the transition from ROCKNIX RC2 to Rasteratops 0.0.1.

- **Entry Criteria:**
  - Phase 1 VM boot passes.
  - RG35XX SP target builds clean from the same commit.
- **Actions:**
  1. **VM Upgrade Rehearsal:**
     - Boot clean VM on ROCKNIX RC2 image (`69e6039f8f`).
     - Populate mock user state: Wi-Fi credentials, RetroAchievements login token, save states in `/storage/roms/saves/`, and mock rclone cloud sync folder at `/ROCKNIX`.
     - Drop Rasteratops 0.0.1 `.tar` into `/storage/.update` and trigger reboot.
     - Verify: Migration script preserves `/storage`, Wi-Fi reconnects automatically, RetroAchievements tokens remain valid, and rclone sync successfully checks `/ROCKNIX` (D-WORKFLOW-050).
  2. **Performance Baseline:**
     - Run `tools/time-to-play` on the updated VM.
     - Verify interface-to-game launch time is ≤ 1.05s (matching or beating RC2 baseline).
  3. **Physical Hardware Validation (RG35XX SP):**
     - Request explicit maintainer permission ("yes") to flash/update test device.
     - Flash or update RG35XX SP. Verify panel display, audio, controller inputs, and shutdown.
- **Exit Criteria (Agent Verifiable):**
  - VM rehearsal script exits with return code `0` and outputs `UPGRADE_TEST: PASS`.
  - Visual diff of `/storage` pre/post upgrade confirms zero lost state files.
  - Maintainer posts affirmative test confirmation ("yes, hardware verified") for RG35XX SP in issue thread.

---

### Phase 3: Tag and Publish Version 0.0.1
*Goal:* Formally cut and publish the inaugural Rasteratops release.

- **Entry Criteria:**
  - Phase 2 exit criteria passed.
  - Git working tree on `next` is clean.
- **Actions:**
  1. Tag commit with `v0.0.1`.
  2. Construct release notes adhering to CC BY-NC-SA 4.0 legal obligations ([Issue #334](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md), [LICENSE.md](research/council-runs/2026-09-30-rasteratops-fork-plan/sources/LICENSE.md)):
     > *"Rasteratops 0.0.1 is an independent Linux distribution for handheld gaming devices, forked from ROCKNIX (itself a fork of JELOS). All upstream credits and licenses are retained."*
  3. Upload `rasteratops-0.0.1-GENERIC_X64.img.gz` and `rasteratops-0.0.1-RG35XX_SP.img.gz` with respective `.sha256` files using `gh release create`.
- **Exit Criteria (Agent Verifiable):**
  - `gh release view v0.0.1 --repo rasteratops/distribution --json assets --jq '.assets[].name'` lists the release images and sha256 checksum files.
  - Checksum validation: Downloaded release asset SHA-256 matches build target output.

---

### Phase 4: Build Host Infrastructure Optimization
*Goal:* Permanently eliminate the primary compilation bottleneck on the build host.

- **Entry Criteria:**
  - Version 0.0.1 successfully published.
- **Actions:**
  1. Upgrade ThinkStation P3 Tiny RAM from 64 GB to 96 GB or 128 GB using compatible DDR5 SO-DIMMs.
  2. Verify platform recognizes total memory: `free -h` shows ≥ 90 GB available.
  3. Edit `projects/ROCKNIX/packages/` webkitgtk build recipe: remove the 4-thread compilation cap (`MAKEFLAGS=-j4` override).
  4. Perform cold rebuild of `webkitgtk` at full 24 threads.
  5. Setup upstream-tracking cron workflow in `.github/workflows/upstream-sync.yml` to run a daily dry-run merge of `ROCKNIX/distribution:next` and alert on conflict.
- **Exit Criteria (Agent Verifiable):**
  - `PROJECT=ROCKNIX DEVICE=RK3588 ./scripts/build webkitgtk` completes successfully with 24 threads and 0 compiler exit codes.
  - Automated merge-check workflow runs green on GitHub Actions.

---

### Phase 5: Sequenced Roadmap Beyond 0.0.1 (Strictly Non-Overlapping)
Once 0.0.1 is in player hands and the build host is uncapped, execute the deferred initiatives in serial order:

1. **Phase 5.1: Fleet Expansion (Version 0.0.2)**
   - Cold-build and QA the remaining architectures: Retroid Pocket Nova (SM8550), RG353M (RK3566), RG SP (H700).
   - Publish v0.0.2 containing full device coverage.
2. **Phase 5.2: Libretro Foundation Spike (#336 Step 0)**
   - Do NOT rewrite a headless runner yet.
   - Implement Step 0: Enable RetroArch UDP command interface (`network_cmd_enable = true`).
   - Wire EmulationStation to send pause/save/load/quit commands over UDP socket, hiding RetroArch OSD.
   - Measure time-to-play on VM guest d. Record benchmark in `docs/spikes/`.
3. **Phase 5.3: Silent Boot and Clean Shutdown Sequence (#340)**
   - Implement quiet kernel parameters (`quiet loglevel=0 vt.global_cursor_default=0`).
   - Profile boot sequence on guest d using `tools/vm-visual-qa` to verify 100% of frames are black, splash, or ES carousel.
   - Port to RG35XX SP and document panel controller quirks.
4. **Phase 5.4: Tier 1 Code Audit (#339)**
   - Run milestone-tier adversarial audit *exclusively* on the 121,000 lines of fork-written code.
   - Generate punch list for `0.1` stabilization. Defer Tiers 2 and 3 indefinitely.

---

## 7. Comparative Assessment: Current Plan vs. Recommended Plan

| Dimension | Issue #338 Plan | Recommended Council Plan | Net Benefit |
| :--- | :--- | :--- | :--- |
| **0.0.1 Scope** | 4 device builds, cloud CI experiment, brand rename, manual QA passes | GENERIC_X64 + RG35XX SP only; local VM QA proof | Cuts cold build time by 75%; eliminates multi-device testing fatigue |
| **Build Host Strategy** | Buy 2nd identical $2k 64GB machine; keep 4-thread cap on webkitgtk | Upgrade Box 1 to 96GB/128GB SO-DIMM (~$350-$550); uncap to 24 threads | Solves root cause of OOM kills; saves ~$1,500 capital |
| **Cloud Runner CI** | Move VM suites to GitHub-hosted runners with nested KVM | Keep VM suites on local runner; run static/prose checks on hosted CI | Eliminates flaky KVM CI failures and 6-hour timeouts |
| **Upstream Drift** | Assume easy manual merges; defer path renames to a later vague date | Unify distro resolution now; deploy daily automated conflict dry-runs | Prevents surprise merge bankruptcy; detects conflicts within 24h |
| **Code Review (#339)** | Review 446k lines across 3 tiers before 0.1 | Cut Tiers 2 & 3; audit only the fork's 121k lines in Phase 5 | Saves months of low-value review on upstream legacy code |
| **Libretro Runner (#336)**| Attempt custom C runner from scratch based on MinUI/nanoarch | Step 0 first: drive RetroArch via UDP socket; benchmark before rewrite | Delivers unified UI in days without maintaining custom emulator core glue |
| **Security Surface** | Open Hostinger mail MCP directly to autonomous push-capable agent | Treat inbound email as strictly untrusted raw strings; human-in-the-loop | Prevents prompt injection and unauthorized repository modification |

---

## Conclusion

The fork to Rasteratops is the correct strategic choice, freeing the project from upstream's review throttling and policy misalignment. But the path to a successful version 0.0.1 requires radical simplicity. 

By stripping away the hosted KVM experiments, delaying the 450,000-line code audit, solving the build host's physical RAM bottleneck directly, and focusing initial release validation on the VM and a single reference handheld, Rasteratops can ship a stable, verified, legally compliant 0.0.1 in days rather than stalling in months of infrastructure friction.
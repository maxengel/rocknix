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
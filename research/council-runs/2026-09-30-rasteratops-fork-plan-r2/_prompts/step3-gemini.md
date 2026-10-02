# Step 3 — Revised approach

You are one council member in the active roster. Revise your Step 1 approach using the injected peer reviews from the other members.

## Anti-self-citation constraint

You are revising PROPOSALS for the technique, not OBSERVATIONS of the run that produced them. Do NOT cite the analyses, peer reviews, or revised plans you've been handed as empirical evidence about the technique itself. The deliberation's value comes from independent reasoning about the technique on its merits; using the run's artifacts as evidence for the technique's claims is circular.

## Injected peer reviews

=== START claude_peer_review.md ===

# Step 2 — Peer review of the four Step 1 analyses

Scope: I review `gemini-analysis.md`, `gpt-analysis.md`, `kimi-analysis.md`, and `muse-analysis.md` on the merits of what they propose for #338. No vote, no revision of my own plan. Where I assert a fact about GitHub, LibreELEC-derived build systems, or licences, that is my own reasoning, not something drawn from the injected texts.

---

## 1. Where the four converge (and one shared blind spot)

All four land on the same core corrections, which makes them likely robust rather than idiosyncratic:

- "About a day" is an edit estimate, not a delivery estimate; elapsed time is multiples of that once four cold builds, vm-qa, the RC2 rehearsal and per-action device yeses are counted.
- The updater checkbox has no mechanism behind it and is the highest-cost 0.0.1 risk.
- The cloud-folder "read both" is a data-migration decision disguised as a string change.
- `ghcr.io/rocknix/rocknix-build` is an unowned dependency and must be mirrored and pinned by digest.
- Hosted-runner VM QA is unmeasured and must not gate anything until it is.
- There is no upstream merge cadence, and there is no backup/recovery story for the single build box.
- The storage numbers in Phase D are stale (90 GB vs 110–147 GB per root).
- #341 contradicts itself on the personal-paths guard; credential scanning must survive any reading.
- The Tier 3 audit should gate the fresh runner (step 1), not the RetroArch-under-ES step 0.
- #336, #339 and #340 belong outside the 0.0.1 gate.

**Shared blind spot:** all four treat `DISTRONAME` as either display text or "a machine identifier to classify" without naming the concrete mechanism by which it can break upgrades: in LibreELEC-derived trees, `DISTRONAME` (and its lowercase form) is routinely interpolated into *paths and labels* — `/storage/.config/<distroname>/`, the hostname, the SMB share name, `/etc/os-release`, and in some recipes the partition labels via `DISTRO_BOOTLABEL`/`DISTRO_DISKLABEL`. Only `gemini-analysis.md` touches labels; only `kimi-analysis.md` mentions hostname/SMB; only `gpt-analysis.md` asks for the classification. None says the simple thing: **grep every use of `DISTRONAME`, `DISTRO_BOOTLABEL`, `DISTRO_DISKLABEL` and `HOSTNAME` in `packages/`, `projects/`, `scripts/` and `config/` before the value changes, and for 0.0.1 keep every persisted path and label at its RC2 value regardless of what the display string says.** The rehearsal would catch a moved config directory, but catching it by rehearsal is a day lost; catching it by grep is ten minutes.

---

## 2. The disagreements that matter

**A. Device scope of 0.0.1.** `muse-analysis.md` cuts 0.0.1 to GENERIC_X64 only, with per-device tags following. `gemini-analysis.md` and `kimi-analysis.md` keep four images from one head. `gpt-analysis.md` makes the support matrix an owner question. On the merits: the two load-bearing unknowns — the DISTRO/PROJECT split building at all, and the updater's behaviour across the RC2→0.0.1 version boundary — are both proven on x64 before any ARM build is worth starting, so *x64-first inside Phase A* is correct regardless of where the tag lands. `gemini-analysis.md` already sequences this (its Phase 3 before Phase 4); `kimi-analysis.md` does not and should. Whether the tag `0.0.1` waits for handhelds is a version-scheme question the owner already half-answered in #337; `muse-analysis.md` proposes per-device tags (`0.0.1-generic-x64`, `0.0.1-h700`) without flagging that this rewrites the proposed scheme. It should be an owner question, not a plan default.

**B. The code-level rename.** `gemini-analysis.md` recommends *permanently rejecting* it and overwriting D-WORKFLOW-085. `gpt-analysis.md` says `NAMING.md` should read "retained for now" to match the register. `gpt-analysis.md` is right on process and `gemini-analysis.md` is wrong on mechanics: the merge tax of a path rename does not grow with delay in any way that makes "later" worse than "now" — it is a constant per-merge cost from the day it lands, and git's rename detection (with `merge.renameLimit` raised) handles a directory move far better than "permanently sever" implies. The correct framing is a *measured trial merge* after a rename on a throwaway branch, which `gpt-analysis.md` proposes and `gemini-analysis.md` does not.

**C. Fork network.** `gemini-analysis.md` argues for detaching; `muse-analysis.md` endorses staying; D-WORKFLOW-086 has decided. `gemini-analysis.md` is factually right that detaching (via support or the self-service "leave fork network" path) does *not* drop issues — the "issues" argument only ever applied to hard-forking into a fresh repository — and it is right that new PRs against a fork default their base to the parent, which is a real hazard given the documented upstream hostility. But those are inputs to a settled owner decision, not a contradiction of the fork's goals. The useful residue: add a repository-level mitigation for the PR-base default (PR template warning, CONTRIBUTING line) rather than reopen the decision.

**D. The `distributions/` directory.** `kimi-analysis.md` (C13) frames new-directory vs. `DISTRONAME` inside the existing directory as an owner choice; `muse-analysis.md` (1.3) frames the DISTRO≠PROJECT split as unproven and demands a build log. Both are right and they compose: the choice cannot be made well until one x64 build with `DISTRO=rasteratops PROJECT=ROCKNIX` has completed. `muse-analysis.md` overstates the merge cost of the new directory ("every upstream distro change is a manual port" — five files, mostly version bumps; the fork changes `version` anyway so that file conflicts under either choice). `kimi-analysis.md` has the proportion right. A merge-cadence check (`git diff upstream/next -- distributions/ROCKNIX/` after each merge) makes the port mechanical.

**E. Process weight before the first commit.** `gpt-analysis.md` and `muse-analysis.md` front-load contracts, backups, credential separation and seven-plus owner answers before any rename commit. `kimi-analysis.md` argues the installed base is four devices and one forgiving user, so 0.0.1 is the cheapest moment to break things deliberately behind gates. `kimi-analysis.md`'s framing is the more useful strategic insight, with one carve-out: "forgiving user" does not extend to `--delete-excluded`-class cloud data loss, which is the maintainer's own saves. Cheap-to-break applies to the updater and the splash; it does not apply to the cloud folder or `/storage`.

**F. Hosted runners.** `gemini-analysis.md` says technically unviable (7 GB RAM, 2 vCPU). That specification is stale for public repositories: standard Linux hosted runners on public repos are 4 vCPU / 16 GB RAM / ~14 GB SSD, and `/dev/kvm` is documented as available on Ubuntu runners. The *binding* constraints are the ones `muse-analysis.md` names — no GPU (so any GL proof is llvmpipe), ~14 GB free disk against a 2 GB image plus a qcow2 that must be sparse, and artifact transfer per push. `gpt-analysis.md` and `kimi-analysis.md` take the correct stance: measure the exact job once; `kimi-analysis.md` adds the right nuance that timing numbers from shared runners are meaningless against guest d.

---

## 3. Per-analysis review

### `gemini-analysis.md`

**Strongest claims**
- **Partition labels.** The only analysis to name `boot=LABEL=ROCKNIX disk=LABEL=STORAGE`. The kernel command line and the labels are written at install time; an upgrade replaces `KERNEL` and `SYSTEM` but does not relabel partitions, so a new image whose init expects a new label will not find its root on an upgraded device. This is a concrete, high-severity, unnamed failure mode in #338.
- **Container mirroring before identity work** is correctly placed as a prerequisite rather than a nice-to-have.
- **Static update manifest** is a reasonable design that sidesteps the POST-endpoint-vs-releases-read ambiguity the other three struggle with, though its stated motivation (rate limits) is weaker than its real benefit (a stable contract the fork owns).

**Weakest claims**
- 1.1: "more than 24 hours of raw compute" and "physically impossible" — the plan's own figure is "a day on one box"; the critique inflates it without evidence. The valid point (edit ≠ delivery) does not need the inflation.
- 1.2 and Cut 5: the "debt ratchet" argument is mechanically wrong (see §2B) and the recommendation overwrites a register row the owner wrote.
- 1.3: stale runner specs (see §2F). The conclusion "cut cloud VM QA" is defensible; the premises are not.
- 1.4: re-litigates D-WORKFLOW-086 as a "contradiction" when it is a trade-off already accepted.
- Risk 6 (minarch contamination): the source already resolves this ("a reference to read, not code to copy"); presenting a mitigated risk as open inflates the matrix. Also, reading unlicensed code for *structure* is not infringement; copying is.
- Risk 8 (rate limits): 60 unauthenticated requests/hour *per IP*; a device checking once at boot will not hit it unless behind a large shared NAT. Real but low.
- Phase 5 release text: *"All original ROCKNIX branding and marks are retained under CC BY-NC-SA 4.0 attribution"* — this is the opposite of the plan and of the licence reading. The whole point of the visible rename is that ROCKNIX branding is **replaced**, because retaining it is inside "suggests the licensor endorses you." The attribution sentence should state lineage, not retention of marks.
- Phase 3 exit "0 diff on logo coordinates" is a brittle gate for a rendered frame; a tolerance or a structural check (cell squareness, bounding box) is more honest.

**Missing failure modes**
- The updater's version comparison across `rc2-<date>` → `0.0.1` (see `kimi-analysis.md` C2, `gpt-analysis.md` §4.2).
- The ES fork transfer as a prerequisite for the image (the interface strings live in ES).
- The splash as a fourth repository that must be forked, not transferred.
- Build/test contention on serval (the build replaces the image vm-qa reads).
- Cloud-folder migration design beyond "dual-path resolution."
- The Phase E gate having been half-executed (the plan's own sequencing).

**Concrete revisions**
1. Replace "cut the later code-level rename" with "gate it on a measured trial merge," and leave `NAMING.md` aligned with D-WORKFLOW-085.
2. Correct the runner specification; convert 1.3 from "unviable" to "unmeasured; GPU-less; disk-bound."
3. Fix the release-body wording to state lineage and non-endorsement, not retained marks.
4. For labels: recommend *keeping* `DISTRO_BOOTLABEL`/`DISTRO_DISKLABEL` at their RC2 values in 0.0.1 (the boot partition's label is visible to a player who mounts the card on a PC, but a relabel belongs to a clean-install-only later release with init accepting both), rather than the fallback-search patch in `config/functions`.
5. Drop Risk 6 or restate it as "verify the spike record quotes every reference's licence from its tree."

### `gpt-analysis.md`

**Strongest claims**
- **A release is a dependency closure.** The release-manifest list (distribution commit, ES commit, splash commit, container digest, source revisions, per-image `BUILD_ID`, QA report IDs, notice bundle) is the most complete statement of what "four images from one head" actually requires, and it exposes that "one head" is currently one of at least four inputs.
- **Immutable candidate store vs. mutable worktree** structurally solves the build-replaces-QA-image problem that a second box only papers over.
- **The compatibility contract table** (version comparison, device selection by more than filename, interrupted download, cloud namespace, rollback) is the right shape for the updater work, and "make 0.0.1 a manual-adoption release rather than build an unaudited update service in a hurry" is the correct fallback.
- **GPL source compliance ≠ public repository.** Correct and under-appreciated: binary distribution under GPLv2 requires the *corresponding source* of what shipped — including the exact third-party tarballs the build fetched — not just the fork's own history.
- **Interval screenshots cannot prove "every frame"** for #340; the classifier needs injected-fault negative controls.
- Reads the 2FA timeline correctly as progression rather than contradiction (contrast `muse-analysis.md` 1.5).

**Weakest claims**
- Length and abstraction. Much of §4 is general release-engineering doctrine (signed manifests, separate release keys, five-role privilege tables) applied to a fleet of four devices owned by one person. The analysis acknowledges this in places ("if too large... manual adoption") but the plan in §8 still has eight phases and three parallel tracks. It risks being the "unmaintainable administrative bottleneck" that `gemini-analysis.md` warns of, just relocated from the audit to release engineering.
- Declines to estimate. "Estimate those separately" is honest but leaves the owner with no number to plan against; `kimi-analysis.md`'s "two to three days elapsed" and `muse-analysis.md`'s "3–5 days" are at least falsifiable.
- The credential-separation table is correct in principle but does not say what the *minimum* separation is for 0.0.1 on one box. Without that, the plan reads as "do not proceed until an enterprise-grade split exists."
- Does not engage `kimi-analysis.md`'s "cheapest moment to break" argument; the compatibility contract is presented as if the installed base were public.

**Missing failure modes**
- Partition labels (`gemini-analysis.md`).
- The splash as a fourth repository; the ES transfer as a Phase A prerequisite (`kimi-analysis.md`).
- The per-repository collaborator grant that will 403 on every new repository until a team exists (`kimi-analysis.md`, `muse-analysis.md`).
- The **sources mirror**: the same class of unowned dependency as the container. LibreELEC-derived builds fall back to a distribution-configured source mirror when upstream tarball URLs die; if that mirror is ROCKNIX's, the fork's builds *and* its GPL compliance both depend on it. `gpt-analysis.md` is closest to this (it lists "downloaded sources" in the manifest) and should name it.
- The Phase E gate breach (`muse-analysis.md`).

**Concrete revisions**
1. Add a "minimum viable separation for one box" paragraph: bot token and mail token in separate files with separate purposes; owner token not on the box; release publish behind a per-release owner yes. That is achievable in an afternoon and is enough for a four-device fleet.
2. Name the sources mirror as a supply-chain and compliance dependency; recommend `DISTRO_SRC` (or its equivalent) point at fork-owned storage, or at minimum an archive of the exact tarballs per release.
3. Collapse Phases 0–2 into one "contracts" phase with a stated elapsed budget, or state explicitly which contract items are 0.0.1 blockers versus 0.0.2 debts.
4. Adopt x64-first sequencing inside the build phase explicitly.
5. Give one number for elapsed Phase A time, even if bracketed.

### `kimi-analysis.md`

**Strongest claims**
- **The updater's two descriptions** (reads GitHub releases vs. POSTs to an endpoint) and the **asset-naming/tag-prefix trap** are the sharpest statements of the highest-cost risk. The question "does the updater consider `0.0.1` newer than `rc2-20260929`?" is exactly the right question; a lexical or numeric comparison would rank `0.0.1` *older*, so the RC2 fleet may never be offered 0.0.1 at all.
- **The ES fork transfer sits on Phase A's critical path** because the two interface strings are ES source; **the splash is a fourth repository** that must be forked. Both are ordering facts #338 misses and no other analysis states as clearly.
- **C10 (Tier 3 gates step 1, not step 0)** and **C11/C12** (per-core routing invisible to the player violates least-surprise; save-state *paths* and rcheevos offline-queue can split-brain across two frontends behind one proxy) are the deepest reads of #336 in the set.
- **The sweep arithmetic** (24 expected, 15 swept, 9 unclassified) and **redirect ≠ address** for recipe URLs.
- The strategic framing — installed base of four devices makes 0.0.1 the cheapest moment to break the updater, cloud default and splash *deliberately* — is the most useful single sentence across all four analyses.
- Corpus discipline: noticing that #340's referenced "first comment" does not exist in the embed.

**Weakest claims**
- C8 undersells a real risk. If `pixelelated` is a second *personal* account rather than a machine account, the lockout safeguard itself rests on an account that GitHub's terms do not permit; a suspension would remove the recovery path precisely when it is needed. This deserves a risk row, not "one line in the register." The remedy is either a trusted second human as owner or documented reliance on GitHub's org-recovery process.
- The recommended Phase 1 keeps "four images from one head" and four device flashes on per-action yeses without an x64-first checkpoint; the analysis's own C1 arithmetic argues for that checkpoint.
- "Two to three days elapsed" is more honest than the plan but still counts no time for the device yeses it acknowledges as gating.
- Q9 (device rotation) is correctly the owner's, but the recommended plan should carry a default (e.g., VM + one device per 0.0.x, all four at minor boundaries) so the owner is choosing between two concrete shapes.

**Missing failure modes**
- Partition labels.
- Filesystem-level backup of serval (R8 covers accounts and tokens, not the 4 TB of state; a blueprint is not a backup).
- The build/test mutex (`muse-analysis.md` R8) — kimi's Phase 1 runs vm-qa and builds on the same box in sequence without naming the contention.
- The Phase E gate breach.
- The 0.1 gate collision (D-WORKFLOW-083's "every punch item ... before 0.1" across all tiers vs. step 0 being 0.1) — kimi resolves it implicitly by sequencing but should name the amendment the register needs.
- GPL corresponding-source hosting (`gpt-analysis.md`).

**Concrete revisions**
1. Promote C8 to a risk row; propose the remedy.
2. Insert an x64-only build-and-boot checkpoint in Phase 1 before the three ARM builds start; make the updater rehearsal on guest d the gate for starting them.
3. Add serval backup to Phase 0 (it is a `restic`/`rsync` job, not a project) and a build/vm-qa lockfile.
4. Name the D-WORKFLOW-083 amendment explicitly in Phase 4/5 ("Tier 1 punch items before 0.1; Tiers 2–3 before 0.2/0.3").
5. Extend the residue audit to persisted paths and labels, not just strings a player reads.

### `muse-analysis.md`

**Strongest claims**
- **1.3: the DISTRO/PROJECT split has never been built.** The most load-bearing unproven assumption in Phase A, and the analysis correctly demands one build log rather than an argument. This should be the *first* exit criterion of any revised Phase A.
- **1.13: the Phase E gate was breached before the council sat.** Not an accusation — a sequencing fact — and the remedy (re-gate what remains: no `distributions/rasteratops/` commit, no updater flip, no tag) is exactly right.
- **1.11: "a killed build poisons every package in flight" is not a build-system property.** Stamp-based builds recover per package with a `clean`; the real argument against spot is elapsed-time exposure. Precise and correct.
- **R5: backup before second box — "a second bucket with a hole in the first."** The clearest ordering argument in the set.
- **R7: the mail-webhook contradiction** ("a reply starts the next step" vs. "inbox content is data, never instructions") — a genuine design fault that needs an allowlist-plus-confirm or a strike.
- **1.7: hosted runners have no GPU**, so any GL proof there is llvmpipe — the best version of the hosted-runner critique.
- **1.16: rc_client against a proxy built from RetroArch's traffic** needs a packet diff, not an assertion of "untouched."
- **1.21: reading is not auditing.** Packet counts measure reading; punch-list resolution with VM proofs is the cost.
- Missing #13 (time-to-play needs a numeric threshold) and #15 (Jujutsu push bypasses git hooks, so the push guard must live in CI) are sharp niche catches.

**Weakest claims**
- 1.5 reads the 2FA record as "self-contradictory." A comment at 05:43 saying `false` and an issue-body edit at 05:51 saying `true` is a progression, not a contradiction. The defensible residue is narrower: no record of who flipped it or whether `members?filter=2fa_disabled` was empty at that moment.
- R1 "silent brick of the fleet." A wrong updater URL means no auto-update; the manual `.update` tar path — which the analysis itself cites — still works. High cost, but not a brick; the language inflates.
- 1.3's merge-cost claim for the new `distributions/` directory ("every upstream distro change is a manual port") overstates a five-file surface that mostly changes at version bumps (see §2D).
- The x64-only 0.0.1 with per-device tags rewrites the proposed version scheme without flagging it as an owner decision (see §2A). The de-risking argument is sound; the tag scheme is not the analysis's to set.
- R6 counts "five" devices by adding the VM to four handhelds; the corpus's "four images/four roots" is consistent with H700 (two boards), RK3566, SM8550, GENERIC_X64. The correct fix is `gpt-analysis.md`'s matrix distinguishing build targets from physical boards, not a recount.
- P0 requires seven owner answers before the first rename commit — the same front-loading the analysis criticises in the audit tiers. Some (Q4 attribution wording, Q10 container pin) can land during Phase A rather than before it.
- The P2 exit gate depends on Q15 (a threshold the owner has not set) — a circular gate.
- 1.18: repository redirects on GitHub do cover `releases/download/` paths under the old name; the things that genuinely do not redirect are `ghcr.io` package namespaces and third-party embeds. The hedge ("may or may not") is fair; the examples are partly wrong.

**Missing failure modes**
- Partition labels.
- GPL corresponding source for third-party tarballs and the sources mirror (the analysis's GPL item covers the fork's own tree and pins, not fetched sources).
- The ToS fragility of a second personal account as lockout owner.
- The ES fork transfer as a prerequisite for the image — the analysis lists the ES pin but does not say the transfer must precede the build.
- The Tier-3/step-0 nuance is handled via 1.20, but the save-state path and rcheevos split-brain risks (`kimi-analysis.md` C12) are not.

**Concrete revisions**
1. Reframe 1.5 as a record gap, not a contradiction.
2. Replace "silent brick" with "fleet loses auto-update; manual path remains" and keep it at rank 1 on cost.
3. Present per-device tags as an owner question with the x64-first *proof* as the plan default; the tag can still be `0.0.1` covering four images built after the x64 proofs pass.
4. Trim P0 to the owner answers that actually block a commit (cloud default, device matrix, updater mechanism); move wording, pin policy and thresholds into Phase A's exit.
5. Add the sources mirror to Missing #4 alongside the container.

---

## 4. Failure modes none of the four covers adequately

1. **`DISTRONAME` as a path/label generator** — see §1. Grep before change; keep persisted paths and labels at RC2 values in 0.0.1.
2. **The sources mirror** as a second unowned dependency and as the GPL corresponding-source problem in concrete form.
3. **The lockout owner's ToS standing** — raised lightly by `kimi-analysis.md`, absent elsewhere.
4. **Version comparison direction** — raised by `kimi-analysis.md` and `gpt-analysis.md` but not carried into any recommended gate as a specific test: "RC2 guest, given a fork channel offering `0.0.1`, is offered it and applies it" must be an explicit PASS line, with the comparison function's behaviour on the old date-style string documented.
5. **PR-base default in the fork network** — raised by `gemini-analysis.md` and `muse-analysis.md` as an argument about the network decision; neither converts it into the cheap mitigation (PR template warning) that survives the decision as made.
6. **Maintainer time as the binding constraint on every recommended plan.** All four plans are assistant-executable in labour terms and owner-gated in elapsed terms (device yeses, release yeses, register rows, owner questions). Only `gpt-analysis.md` asks how much recurring attention is available; none of the four prices its own plan in owner-hours per release. Whatever synthesis emerges should carry that number, because it is the one that decides whether four-device releases are sustainable at 0.0.x cadence.

---

## 5. Notes for synthesis (not a vote)

- The most defensible spine is: `muse-analysis.md`'s x64-first proof and gate re-statement, `kimi-analysis.md`'s critical-path ordering (ES/splash repositories and updater mechanism before the rename commit) and "cheapest moment to break" framing, `gpt-analysis.md`'s release manifest and immutable candidate store, and `gemini-analysis.md`'s partition-label and container-mirror items.
- The claims to drop: `gemini-analysis.md`'s permanent rejection of the code-level rename and its fork-network re-litigation; `muse-analysis.md`'s 2FA "contradiction" and per-device tag scheme as a default; `gemini-analysis.md`'s hosted-runner RAM figures.
- The owner questions that actually block a first commit reduce to three across all four analyses: the updater mechanism and adoption model; the cloud default and migration stance; the 0.0.1 device/tag scope. Everything else can be answered during Phase A or recorded as a debt.

=== END claude_peer_review.md ===

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

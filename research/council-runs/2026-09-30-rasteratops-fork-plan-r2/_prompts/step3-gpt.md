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

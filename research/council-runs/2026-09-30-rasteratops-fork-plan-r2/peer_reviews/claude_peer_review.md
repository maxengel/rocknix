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
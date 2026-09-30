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
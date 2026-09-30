# Step 4 — Peer vote

You are one council member in the active roster. Vote on the injected revised plans from the other members.

## Anti-self-citation constraint

You are voting on PROPOSALS for the technique, not OBSERVATIONS of the run that produced them. Do NOT cite the analyses, peer reviews, or revised plans you've been handed as empirical evidence about the technique itself. The deliberation's value comes from independent reasoning about the technique on its merits; using the run's artifacts as evidence for the technique's claims is circular.

## Injected revised plans

=== START claude-revised_plan.md ===

# Step 3 — Revised approach (claude)

## 0. What this revision does

I am revising my Step 1 analysis of #338. Four reviewers (gemini, gpt, kimi, muse) converged on three defects in my proposal — the `GuiMenu.cpp` split, the "dropped, not deferred" rename ruling, and the optimism of my own P0/P1 estimates — and on two omissions: disaster recovery rated Low, and a four-device publish gate that keeps every flash on the critical path. I accept most of that. I push back on the X64-only release, on treating manual adoption as an alternative to updater work rather than a branch of it, and on a few places where reviewers asked for more machinery than one maintainer can carry.

Three house rules I adopt for the rest of this document, because kimi and gpt are right that the Step 1 set (mine included) applied them inconsistently:

1. **External knowledge is labelled.** Anything I know about the LibreELEC build family, GitHub Actions, or `rclone` that I did not read in the corpus is marked *(family knowledge — verify)*.
2. **Corpus numbers are inputs, not measurements.** Build times, line counts, root sizes, and my own Step 1 intervention count are single samples from the source; estimates built on them are conditional.
3. **Labour ≠ elapsed ≠ yeses.** Every phase below states all three. A plan that criticises "about a day" and then writes "half a day" for its own first phase has learned nothing (muse §2e).

---

## 1. Corrections I accept

**1.1 Drop the `GuiMenu.cpp` split from the near-term plan** (gemini, kimi, muse, gpt). Kimi states the defect precisely: once the fork moves code out of a file upstream continues to edit, every upstream change to that file becomes a delete/modify conflict or a manual port. That is exactly the forked-file cost I used against the `distributions/` copy. §3.6 contradicted my own Risk 2. Revised position: **no refactor of upstream-owned ES files before the first measured upstream ES merge.** If step 0 of #336 needs a hook into ES, it goes in as a narrow adapter — a new fork-owned source file plus the minimum number of call sites in existing files. D-WORKFLOW-080(a) becomes an unblocked backlog item whose trigger is a measured merge, not an aspiration. I adopt kimi's shape for any future reconsideration: one bucket split on a branch, trial merge of `upstream/next`, decision from the conflict report.

**1.2 Replace "dropped, not deferred" with a refining row that names a trigger** (gemini, gpt, kimi, muse). The merge-tax argument stands; the constitutional ruling was overreach. But gemini's original ratchet concern is also real — "later" with no trigger is a drop wearing a deferral's clothes. So the row states: (a) upstream-owned paths are retained while the fork tracks upstream; (b) every *new* fork-owned artifact takes the `rasteratops` prefix from day one; (c) the code-level rename is reconsidered only on a trial-merge cost report, and is *automatically* reconsidered if the fork skips two consecutive merge cadences or decides to pin (see §2.4). This is a refinement of D-WORKFLOW-085, not a reversal.

**1.3 Restate estimates as conditional ranges with labour/elapsed/yeses** (gpt, muse). "Four to six working days is the floor" was more precise than its basis. The revised table is in §4. The controlling variables are named: cold-build time per target, whether `vm-qa` and the build can be isolated, and owner latency.

**1.4 Promote backup and recovery from Risk 14 (Low) to a P1 prerequisite** (gemini, muse). Loss of `serval` means re-provisioning a build host, re-minting tokens, reconstructing worktrees and the source cache from memory. That is weeks, and it can happen on any day. Minimal mechanism, not a programme: (a) an encrypted second copy of the secret layout (`~/.config/gh`, signing key, mail credentials, `rclone.conf`, runner registration) to a location that is not `serval`; (b) a `serval-blueprint.sh` that reproduces the toolchain and worktrees on a clean host *without* any secret; (c) a restore drill that runs the blueprint and confirms a warm build starts. Per gpt and muse: the blueprint is **role-specific** — a QA or build host never receives the control account's credentials. That also settles the second-Tiny question (§2.5): its provisioning *is* the restore drill.

**1.5 Fix the isolation test so it cannot print a secret** (gpt). `sudo -u <runner> cat <token>` discloses the token exactly when isolation has failed. Replace with `sudo -u <runner> test -r <path>; echo $?` expecting `1`, a synthetic canary file at each secret location with an alert on read, and an effective-privilege audit: `id`, `groups`, `sudo -l`, membership of `docker`, readability of `/var/run/docker.sock`, and any `setuid` binaries the runner can reach. Gpt and muse are right that Unix file permissions are necessary and not sufficient; if the runner user can reach the Docker socket, the file mode on `~/.ssh` is irrelevant.

**1.6 Correct the P1 repository criterion** (gpt, kimi). Three repositories transfer; `rocknix-splash` is upstream-owned and must be **forked** into the org and pinned. "Each transferred, not recreated" applies to three of four.

**1.7 Add an emergency exception to the plumbing freeze** (gpt). Credential revocation and security changes are never blocked by a WIP limit. The exception is recorded, not silently taken.

**1.8 Harden the `brand` suite into a gated sweep with an allowlist** (gpt, muse, kimi, gemini). Zero-hit is unpassable: attribution, licence notices, compatibility paths, history, and translated content legitimately contain the old name. Revised design: (a) `NAMING.md` carries a versioned allowlist of permitted occurrences with a reason each; (b) `strings` over `os-release`, the ES binary, theme XML, unit files, and the `/storage` skeleton, filtered against the allowlist, must return zero *unclassified* hits; (c) template matching over QA frames has stated thresholds and a **negative control** — a frame with the old logo injected must fail; (d) the same pass carries kimi's **secret sweep** (test accounts, `rclone` remotes, any dev material in `/etc` or the skeleton) and gemini's leak classes (hostname, SMB share name, mount points, unit names). One image walk, four classifications: brand-visible, brand-internal, secret, allowed.

**1.9 Define `BUILD_ID` before gating on it** (kimi). If `BUILD_ID` embeds a timestamp, "equal across four images" can never pass. P0 reads its derivation. The manifest binds each image to its own `BUILD_ID` and hash; cross-image consistency is asserted on the *inputs* (distro commit, ES commit, splash commit, container digest), not on `BUILD_ID` equality.

**1.10 Re-scope background Tier 1 so it does not review code being rewritten** (kimi, gpt). Background Tier 1 during the step-0 spike covers only files step 0 will not touch. The launch/control slice is reviewed after the spike stabilises, before step 1. And per gpt: **known findings of security, state-preservation, or launch-path class block 0.1 regardless of tier.** Permission to explore on a branch is not permission to release.

**1.11 Treat divergence as a review signal, not a verdict** (gpt). A growing upstream-owned diff is a prompt to look, not proof of misplacement; a `patches/` directory has its own carry cost (refresh on every upstream bump, silent drift when an override misses an upstream fix). The upstream-merge tool reports two numbers: upstream-owned diff size and patch-refresh effort per merge. Both are inputs to the pin-or-track review (§2.4). Muse's ownership question is answered in the register: the maintainer of record for `patches/` is the fork; a patch that has needed manual refresh three merges running becomes a candidate for either upstreaming or an override, decided at cadence review.

**1.12 Move build/QA exclusion before the first affected build** (gpt). My P4 mutex was too late if P2 exercises both paths. More importantly, gpt's framing is the right one: the primary control is an **immutable candidate image** — `vm-qa` reads a hashed copy in a candidate store, never the build's output path — with a lock as the secondary control against resource starvation. Two different failure mechanisms, two controls.

**1.13 Add the boot-chain read and the runtime-reference sweep to P0** (kimi, muse, gpt). I had no partition-label coverage. But I agree with gpt against gemini's prescription: a fallback in `distributions/.../config/functions` cannot repair a failure that occurs earlier in the initramfs or bootloader. So these are **inspection tasks with decision branches**: read `scripts/image`, the initramfs, fstab generation, the installer, and every consumer of `DISTRO`/`DISTRONAME`/`ID`/`LABEL`; for each, record keep / dual / migrate per target. Keeping existing labels may need no shim at all. Muse's runtime-reference sweep — grep the tree for consumers of the *renamed* values, not just player-visible strings — joins this read.

**1.14 Release-channel discipline** (kimi, gpt). No CI image is ever published as a Release asset; CI images travel as Actions artifacts or through the candidate store. Releases start as drafts, are promoted to pre-release for the RC2 discovery rehearsal only if the P0 read shows RC2 ignores pre-releases, and become full releases only at publish. Add kimi's headroom check: each asset's size against the per-asset limit *(platform knowledge — verify the current limit)*.

**1.15 State the trust assumption of the update channel instead of hiding it** (gpt, muse). A `.sha256` fetched beside its payload detects corruption; it does not authenticate origin. For 0.0.1 the trust anchor is TLS to GitHub plus control of the org account. That is written down in the release notes and the register as the assumption, with signing designed as a slot (key custody, rotation, what a compromised channel can make a device do) for 0.0.x — not silently omitted.

**1.16 Step 0 needs a feasibility proof, not a socket** (gpt). Display ownership, compositing, focus, controller ownership, and process lifecycle (either side dying) are the questions; a pause command over a network socket answers none of them. The step-0 spike's first deliverable is that proof on `GENERIC_X64`, and any command interface binds to localhost only with the bind address stated.

**1.17 Redirect sunset, 2FA custody, and the second owner's old-identity debris** (kimi). Three small items I missed. The plan names the criterion for no longer depending on GitHub's `maxengel/rocknix` redirect: every fielded device has completed one fork-to-fork update. The 2FA question asks the owner one thing: whether both org owners' authenticators and the bot's secret share one physical device. And the identity sweep includes the previous identity's strings, accounts, and domains.

---

## 2. Where I push back

**2.1 X64-only public 0.0.1** (gemini endorsing muse; kimi asking for the product case). I accept muse's *ordering* and reject the *release*. On merits: if the RC2 updater selects "latest release" and matches assets by device, an X64-only public tag either yields "no update" on every handheld (harmless but proves nothing about the channel) or, if matching is looser, offers a wrong asset. Either way the first real users of the channel — the owner's handhelds — learn nothing or get hurt. And kimi's product point stands: a handheld OS release that runs only in a VM is not a release of the product. Gemini's critique of my four-device gate is also fair, though: four cold builds serialised with four flashes on one box, each flash a yes, is the contention and yes-budget problem. Revised gate, which is neither of the two options in gemini's table:

- **Qualification order:** `GENERIC_X64` first, as a draft. This proves the `DISTRO` split compiles, the brand sweep passes, and the release machinery works before any device build is scheduled.
- **Publish gate:** all four device images built from **one manifest**; VM QA passed on X64; **one** physical handheld upgraded from its real RC2 install through the real update path (or the documented manual path, §2.2) with saves and configured cloud root intact; remaining devices flashed by owner choice before publish *or* marked in the release notes as "built from the same manifest, not yet device-verified," with a stated 0.0.2 verification date.
- **Tag:** one canonical `0.0.1` across all assets. Per gpt and gemini, architecture-suffixed tags invent version-selection semantics the client does not have.

That converts four mandatory flashes into one mandatory and three owner-scheduled, without publishing an image no player can hold. The one mandatory flash is the migration test that matters most — an actual RC2 device, not a VM. Kimi's device-set inconsistency stands: the support matrix is a P0 deliverable and the gate counts whatever the matrix says.

**2.2 Manual adoption is a branch, not an alternative** (gpt). Gpt is right that if RC2 talks to infrastructure the fork cannot control, no change to the new image creates an unaided OTA path, and an explicit manual transition is legitimate. I disagree only with the framing that this removes updater work from 0.0.1. The P0 read of `rocknix-update` splits P3 into two branches:

- **Branch A — RC2 can discover fork releases with a minimal re-point.** Gate is the unaided OTA rehearsal I already proposed, with the four named failure modes (redirect-following, asset-name match, version ordering across the date→`0.0.1` scheme change, distro-name check) plus gpt's interrupted-update cases (truncated download, interruption mid-install, wrong target asset, failed first boot with data-preserving recovery).
- **Branch B — it cannot.** 0.0.1 ships as a documented manual update with exact steps, backup guidance, and a **fork-aware updater** that reports "manual update required" rather than silently querying a ROCKNIX endpoint. The fork-to-fork OTA path (`0.0.1 → 0.0.2`) must then be proven before `0.0.2` is published.

Either branch requires reading the client and writing a version-ordering table (muse's missing mode #3): what "equal," "older," "skip-ahead," and "downgrade" do. I reject gemini's manifest service for 0.0.1 for the reasons muse gives: it enlarges the release to fix a rate-limit failure that is unproven and, if the client polls per device, may not bind at all *(rate limits are per-IP for unauthenticated calls and asset downloads are not API calls — platform knowledge, verify)*.

**2.3 Enterprise assurance artifacts** (gpt's original, per gemini and muse). Gpt's release-as-dependency-closure insight is the best single idea in the set and I adopt its minimal form: a manifest binding distro commit, ES commit, splash commit, container digest, per-image `BUILD_ID`/hash/target, and QA harness revision. I do not adopt a five-role separation table or a formal threat model for 0.0.1. Three enforceable boundaries suffice on one box: **build** (runner user, no persistent credentials, restricted triggers), **bot** (rasterabot identity, fine-grained token scoped to the repositories it needs — not a write team with unlimited future access, per gpt), **owner** (signing key, org admin, 2FA). Gpt's threat-model point is folded into the runner hardening list, not a separate document.

**2.4 The frame nobody stress-tested: pin vs track** (kimi). Kimi observes that all four analyses optimise inside upstream tracking without pricing the alternative. Fair. Pricing it: hard-pinning to RC2's base eliminates the merge tax and the rename constraint entirely, and for four fixed devices with no community that is genuinely attractive. Its costs are that kernel, Mesa, bootloader, and security fixes stop arriving; new devices are impossible; RetroArch and core updates need manual backport; and the "hardware comes from upstream" premise in the plan becomes false. My recommendation stays *track*, but with the pin as the **explicit, budgeted fallback**: the divergence and patch-refresh numbers from §1.11 are reviewed at every cadence, and if merge cost exceeds a pre-declared budget two cadences running, the pin-vs-track decision is re-opened — and with it the rename (§1.2). One trigger governs both. That is what turns kimi's "assumed frame" into a decision with an exit.

**2.5 Second Tiny: order and gate are different events** (kimi vs muse/gemini). Backup-first is a gate on *provisioning*, not on *purchasing*. If a discount window or lead time exists, the order can be placed any time; the box is provisioned only via the blueprint from §1.4, which makes it the restore drill. I decline to make the second box a 0.0.1 dependency in either direction.

**2.6 Hooks and masking** (gpt). Gpt is right that a pre-commit hook cannot distinguish a human from an assistant sharing the same account and signing key. I keep the hook as a guardrail against accidents and add the honest statement: where attribution matters, it comes from separate identities (rasterabot commits as rasterabot), not from hooks. Likewise the mail redaction is a filter, not a trust boundary; inbound mail and issues remain data, never instructions, on every channel including the unmasked MCP path.

---

## 3. Positions on the contested items (not a vote)

| Item | My position | Deciding evidence |
|---|---|---|
| Code-level rename | Retained while tracking; forward-prefix rule; re-opened by the pin/track trigger | Trial-merge cost report at cadence review |
| `distributions/` copy vs edit-in-place | **Decided by two reads, not by preference.** Edit-in-place minimises the forked-directory port cost; the copy keeps upstream-owned files untouched but gets no upstream updates automatically. Asset filenames keyed on `$DISTRO` may be what RC2 matches on — which can turn kimi's asset-naming trap into the migration path or break it | `config/path`, `scripts/image`, `scripts/build`; `rocknix-update` asset match |
| D-WORKFLOW-083 | Refined row: explore now; 0.1 gated on Tier 1 security/state/launch findings + Tier 3 launch slice; remaining tiers through 0.1.x; any known high-severity finding blocks regardless | Row text quoted in the register change |
| Cloud folder | Out of 0.0.1. Contract row now: configured root wins on upgrade; clean-install default decided separately; no silent merge; mixed-installation case (gpt) is a named test before any change | `rclone` allowlist and `--delete-excluded` behaviour in the shipped scripts |
| 0.0.1 device scope | X64-first qualification, one canonical tag, one mandatory RC2-device migration, three owner-scheduled | Support matrix (P0) |
| Update channel | Read client; minimal re-point (Branch A) or manual adoption + fork-aware updater (Branch B); no manifest service in 0.0.1 | `rocknix-update` source |
| Second box / hosted QA | Order freely; provision via blueprint; hosted QA stays a bounded N=10 boot/flow experiment with no timing claims and never a gate until its failure rate is known | Experiment log |
| ES strategy | Narrow adapter; no upstream-file refactor before first measured ES merge | Conflict report of first merge |

---

## 4. Revised plan: labour, elapsed, yeses

Estimates are conditional. Controlling unknowns: cold-build time per target (corpus reports ~24 h for a cold root — one sample), whether `vm-qa` and builds can be isolated, and owner latency. My Step 1 intervention count is one sample; I plan for one owner touchpoint per working day and treat anything faster as luck.

| Phase | Content | Labour | Elapsed (est.) | Owner yeses |
|---|---|---|---|---|
| **P0 Read** | `rocknix-update`; `config/path`, `scripts/image`, `scripts/build`, initramfs/fstab/installer; `BUILD_ID` derivation; every consumer of `DISTRO`/`DISTRONAME`/`ID`/`LABEL`; ES licence text; outbound connections and third-party IDs; support matrix; storage numbers; D-088 and Choice 2 resolved or their absence priced. Output: decision branches for §3 | 1–1.5 days | 2–3 days | 2 (matrix; Choice 2) |
| **P1 Plumbing** | Three transfers + splash fork; recipe URLs re-pointed; runner triggers restricted to `push` on `next` + `workflow_dispatch`, no `pull_request` on self-hosted; runner user isolation with §1.5 tests; token scope/expiry inventory; container mirrored **and consumed by digest** in the build invocation (gpt); encrypted secret copy + blueprint + restore drill; candidate store for immutable images; freeze with emergency exception. Backlog triage, site DNS, CONTRIBUTING move to background | 2 days | 3–5 days | 3–4 (org settings; token mint; backup location) |
| **P2 Identity on X64** | Identity edits per P0 branch; cold `GENERIC_X64` build with `DISTRO=rasteratops` (or DISTRONAME-only per branch); brand/secret/leak sweep with allowlist; ES string change with localization check (gemini's catch — the two strings' entries across the `.po`/`.xml` set must be updated or the fallback verified); VM QA from candidate store; draft release | 1 day | 2–3 days (one cold build + reruns) | 1 |
| **P3 Migration contract** | Branch A: unaided RC2→0.0.1 OTA rehearsal covering the four discovery modes + interrupted-update cases, on one physical handheld with real state. Branch B: manual-adoption doc, fork-aware updater, same physical rehearsal by hand. Version-ordering table written either way | 1–1.5 days | 2–3 days | 2 (device in hand; go/no-go) |
| **P4 Device images** | Remaining three targets built from the P2 manifest; per-SoC boot-artifact matrix from P0 read (upgrade vs clean flash, downgrade safety); asset size check; release notes stating verification status per device; publish | 1 day | 3–4 days (serialised cold builds) | 1–4 (one flash mandatory; three optional) |
| **P5 Post-0.0.1 background** | #341 relaxations *that the release actually needs* with bidirectional tests (gpt: newly permitted passes **and** secret/PII still blocked); merge cadence + divergence tool first run; hosted-QA experiment; redirect-sunset tracking; minimal public surface (install/adopt, matrix, recovery, source/licence) so the site defers | ongoing | — | as needed |
| **P6 Step 0 + scoped review** | Step-0 feasibility proof (§1.16) on a branch; background Tier 1 on non-launch files; launch-slice review after spike; 0.1 gate per §3 | — | — | — |

**Total for 0.0.1:** roughly 6–8 labour days, **12–18 elapsed days** at one yes per day, 9–13 yeses. The elapsed number is dominated by four serialised cold builds and owner latency, not by agent labour — which is the point I was making about "about a day" and now apply to myself.

**Explicitly not in 0.0.1:** cloud folder change, triceratops art, new site, #340, #336 beyond the feasibility spike, `GuiMenu.cpp` split, manifest service, image signing (slot designed, not implemented), SBOM depth beyond the manifest, ARM hardware-in-the-loop rig, observability. Muse's missing modes #5, #10, #12 are backlog with owners, not gates.

---

## 5. Exit criteria as runnable checks, bound to revisions

Every check records the manifest digest it ran against.

- **P0:** a written decision for each §3 row citing the file and line read; support matrix in `docs/rasteratops/`; `BUILD_ID` derivation quoted.
- **P1:** `sudo -u runner test -r <each secret path>` returns 1 for all; canary read produces alert; `sudo -u runner id` shows no `docker`/`sudo`; workflow files contain no `pull_request` trigger targeting `runs-on: self-hosted`; build invocation references the container by `@sha256:` digest; restore drill log shows blueprint completed a warm build on a clean host with no secret present.
- **P2:** build exits 0 with the identity variables set; brand sweep returns zero unclassified hits against allowlist vN; negative control frame **fails** template match; localization check shows no orphaned old-string entries; `vm-qa` passed against a candidate-store hash equal to the manifest hash, before and after the run.
- **P3:** device log shows the RC2 client discovering, downloading, verifying, installing, and booting 0.0.1 unaided (Branch A) or the documented manual path completing (Branch B); post-boot `rclone` config and save directory hashes equal pre-upgrade; truncated-download and mid-install-interrupt cases recover to a bootable state with data intact.
- **P4:** four assets in one draft release, all under the asset size limit, each with hash matching manifest; release notes list per-device verification status; the pre-publish sweep re-run on all four images; redirect dependency recorded.

---

## 6. Register rows to write

1. Refine D-WORKFLOW-085: retain upstream-owned paths while tracking; new-artifact prefix rule; reconsideration trigger tied to the pin/track review.
2. Refine D-WORKFLOW-083: quote the row; explore-now / release-gated-on-findings reading; consequence for late findings.
3. New: merge cadence, divergence + patch-refresh metrics, budget, and the pin-vs-track fallback trigger.
4. New: cloud namespace contract (configured root wins; no silent merge; mixed-installation test before any default change).
5. New: update-channel trust assumption for 0.0.1 and the signing slot.
6. New: runner trust boundary (triggers, isolation, three enforceable roles).
7. New: release publication discipline (drafts, no CI images on Releases, candidate store).
8. Resolve or explicitly price the absent D-WORKFLOW-088 and the unlabeled Choice 2.

---

## 7. Owner questions (reduced to those with no technical answer)

1. Which devices are in the support matrix, and which one is the mandatory P3 migration device?
2. If the P0 read lands on Branch B, is a manual-adoption 0.0.1 acceptable, or does the owner prefer to hold 0.0.1 until fork-to-fork OTA is proven and skip the RC2 hop entirely?
3. Do both owners' authenticators and the bot's secret live on one physical device?
4. Where does the encrypted second copy of secrets live, and who receives the token-renewal reminder?
5. Three optional flashes before publish, or "built, not device-verified" in the notes with a 0.0.2 date?

---

## 8. Left for the council

I have not settled, and do not vote on here: whether the council accepts a staged publish gate (one mandatory device) as the compromise between the four-device and X64-only positions; whether the pin/track trigger should also govern the rename or whether those remain separate rows; and whether Branch B, if it materialises, should ship at all as `0.0.1` or wait. Each of those turns on the P0 reads, which is the one thing every reviewer and I now agree the plan must do before estimating anything else.

=== END claude-revised_plan.md ===

=== START gemini-revised_plan.md ===

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

=== END gemini-revised_plan.md ===

=== START gpt-revised_plan.md ===

# Revised approach — #338

I would narrow my earlier proposal to **an x64-first identity-and-adoption release**, supported by a small release manifest and enforceable one-box safety boundaries—not a new release-engineering platform.

I accept **Claude, Gemini, and Muse’s** criticism that my previous assurance package was too large for a single maintainer. I retain immutable candidates and dependency recording because they solve concrete problems: QA must test the bytes eventually published, and a distribution commit alone does not identify all its inputs.

**Evidence boundary:** I have not inspected the primary tree or reproduced its measurements here. Paths, configuration variables, account states, resource figures, and decision-record summaries below are inspection targets or planning assumptions—not findings established by the reviews.

## 1. Scope and decisions

### Keep 0.0.1 small

Include:

- Player-visible identity changes.
- Fork-controlled, pinned release inputs.
- A tested adoption path from RC2.
- Qualification of the explicitly supported target/board matrix.
- Required source, notices, installation, and recovery information.

Exclude:

- Cloud-folder migration or dual-read behaviour.
- A new update-manifest service.
- Internal path renaming beyond what the chosen build configuration requires.
- Runner replacement, silent-boot work, full audit completion, artwork commissioning, and a new website.
- Hosted QA or a second build machine as prerequisites.

### Three owner choices, with recommendations

These block behavioural cutovers, **not inspection, backup, or throwaway-branch experiments**.

| Choice | My recommendation |
|---|---|
| Adoption model | Manual adoption unless a minimal automatic transition passes the actual RC2-client rehearsal. |
| Cloud namespace | Preserve RC2’s configured namespace and clean-install default for 0.0.1. Document the old name as a compatibility exception. |
| Release scope | Keep the intended canonical release tag and supported target set, subject to an explicit matrix distinguishing images from physical boards. Prove x64 first. |

I accept **Claude and Muse’s x64-first checkpoint**, but reject x64-only publication as the default. **Gemini’s** operational argument for that cut is useful, but a handheld distribution’s first release should not silently become VM-only. Reduced publication scope remains an owner decision. I would not introduce architecture-suffixed tags.

## 2. Prepare the release without creating an administrative project

### Inspect the load-bearing code first

Locate and read:

- The actual updater, release-selection logic, and installer/update application path.
- `config/path`, image generation, relevant build/stamp logic, and distribution configuration.
- Initramfs, boot configuration, partition-label handling, and generated persistent paths.
- ES and splash recipes, their source pins, and branding/localization inputs.

A starting search—not a complete audit—is:

```sh
rg -n 'DISTRONAME|DISTRO_BOOTLABEL|DISTRO_DISKLABEL|HOSTNAME|DISTRO_SRC' \
  packages projects scripts config distributions
```

Follow derived values into generated files and runtime consumers. Classify each use as:

1. Display text.
2. Machine-readable identity.
3. Persisted path or network name.
4. Boot/storage contract.

I accept **Claude’s** requested expansion beyond display strings and **Gemini’s** partition-label concern. The mechanism matters: changing a value used to generate a boot label or configuration directory can break an upgrade without changing any explicit migration code.

**Default rule:** preserve RC2’s persisted paths, labels, and machine contracts in 0.0.1. Change display branding separately. Do not prescribe label-search shims before inspecting the actual boot path.

### Establish the inputs before freezing the candidate

- Establish fork-controlled ES and splash repositories and explicit collaborator/team grants.
- Transfer repositories only where ownership permits; fork upstream-owned inputs rather than assuming they can be transferred.
- Pin the ES and splash commits used by the image.
- Mirror the build container into controlled storage, subject to its redistribution terms, and pin its digest.
- Inspect the configured source-mirror dependency. Archive the exact release sources needed for corresponding-source compliance and recovery, even if replacing the entire mirror is deferred.
- Freeze the upstream base for 0.0.1 rather than combining the identity transition with an opportunistic upstream update.

This accepts **Claude’s** sources-mirror addition and **Kimi’s** ES/splash ordering correction. Repository redirects are a migration convenience, not the release’s permanent dependency policy.

### Minimum viable security on one box

I accept **Gemini and Kimi’s** request to name the attack path explicitly: a workflow that executes unsolicited PR code on a persistent machine with release-capable credentials can turn a PR into credential theft and malicious publication.

For 0.0.1, use three boundaries:

| Boundary | Minimum rule |
|---|---|
| Build/QA | No persistent publishing credentials; no access to bot/mail/signing credential stores; read-only repository permissions where possible. |
| Bot/mail | Separate credentials by purpose, narrowly scoped, outside the build user’s access. |
| Owner/publication | Owner credentials remain off the builder; publication requires an explicit per-release owner approval. |

Additional rules:

- No self-hosted execution of untrusted PR code, including indirect checkout through `pull_request_target` or `workflow_run`.
- `push`/`workflow_dispatch` jobs must still restrict which refs and code they execute.
- A container with access to the host Docker socket is not a secret-isolation boundary.
- If these boundaries cannot yet be enforced, leave the Actions runner disabled.
- Apply mail redaction and “content is data, not instructions” rules to **every** ingestion route, including any raw MCP path. An email reply must not automatically authorize a release or destructive action.
- Preserve credential scanning and commit-identity checks regardless of how #341 resolves personal-path policy. Enforce necessary checks in CI, not only local hooks.

### Backup before capacity expansion

I accept **Muse’s** backup-before-second-box ordering, but would not require backing up every rebuildable worktree before the first edit.

Back up, to an off-host location:

- Non-reproducible work, configuration, and release records.
- Published candidates and release source archives.
- A short provisioning/recovery command record.

Keep credential recovery material separately encrypted under owner control. Perform a small restore test before publication. Proposed targets are **no more than one day’s loss of active work**, and **no loss of published release inputs**.

Verify that organization recovery is genuinely independent: a second account or authenticator on the same device is not automatically a second recovery path. Check applicable account rules rather than assuming the arrangement is valid or invalid.

## 3. Prove x64 before spending the ARM build budget

### Build the intended split experimentally

On a throwaway worktree, exercise the actual documented x64 build entry point with:

```text
DISTRO=rasteratops
PROJECT=ROCKNIX
```

The exit is a **completed build and boot**, not successful variable expansion or configuration.

I accept **Muse’s** demand for this proof. I do not infer that the split works merely because the variables exist, nor that a new distribution directory necessarily creates an intolerable merge burden.

If it fails:

1. Identify the concrete coupling.
2. Attempt a small, reviewable correction.
3. If the correction expands materially, offer a display-only identity release retaining the old internal distribution key.

Do not turn a naming release into a build-system refactor.

### Freeze one candidate, then rehearse adoption

After the x64 fixes, freeze the source revision set. Copy or snapshot artifacts into an immutable candidate directory; do not point QA at the worktree’s mutable output path.

Use a build/QA lock for heavy workloads on the single host. These address different problems:

- Immutable artifacts prevent QA from testing bytes that later get replaced.
- Scheduling prevents CPU, RAM, and I/O contention from invalidating results.

Keep per-package concurrency conservative until measured, including memory-heavy compile/link stages. A global job count is not a memory budget.

### Updater: inspect first, then choose the smallest safe transition

I retain the manual-adoption fallback and accept **Muse’s** request to make it operationally specific. I reject introducing a new update service merely to avoid a hypothetical API-limit problem.

The updater test table must cover at least:

| Case | Required behaviour |
|---|---|
| RC2 → `0.0.1` | Offered and applied under the documented adoption model. |
| Same version | No repeated update loop. |
| Older release | No unintended downgrade. |
| Later point release / skip-ahead | Ordering is explicit, not accidental string comparison. |
| Wrong board/architecture | Rejected. |
| Draft, prerelease, or CI candidate | Not offered on the stable channel. |
| Truncated download / bad checksum | Not activated. |
| Unavailable channel | Clear failure; no silent fallback to an unintended project. |

Inspect redirects, filename matching, distribution-name checks, and the precise version-comparison function. Unit fixtures are useful, but do not replace the explicit rehearsal:

> **A cloned RC2 installation, using only the documented bootstrap step, discovers or accepts the exact 0.0.1 candidate, applies it, reboots, and retains the defined user-state fixtures.**

A changed client inside 0.0.1 cannot retroactively fix RC2’s inability to discover it.

**Timebox:** spend one focused engineering session on understanding the mechanism and another on the minimal correction. If a safe automatic transition still requires substantial new infrastructure, use manual adoption rather than silently expanding the release.

### Manual adoption means an executable procedure

The published procedure must specify:

1. Identify the exact board and current build.
2. Back up saves and configuration; retain known-good boot media where possible.
3. Download the matching release package from the identified fork release.
4. Verify its digest and any existing supported signature mechanism.
5. Use RC2’s source-confirmed manual update route—such as `/storage/.update` only if inspection confirms it—then sync and reboot.
6. Verify the new build, save/configuration continuity, and update-menu behaviour.
7. Follow a tested recovery procedure if adoption fails.

If the manual tar route is not safe, specify clean installation to separate media plus restoration, rather than improvising an in-place migration.

Checksums detect corruption; they are not independent origin authentication when delivered beside the payload. For 0.0.1, document the actual HTTPS/platform and owner-publication trust assumptions. Do not claim that introducing a new signing key solves trust bootstrap by itself.

### Cloud handling: no migration

I accept **Claude and Muse’s** stronger scope cut here:

> **0.0.1 does not rename, merge, dual-read, or delete cloud roots.**

Preserve the configured root and the old clean-install default. A future migration needs disposable test remotes, conflict/write rules, backups, and non-destructive rehearsal. The small installed base makes some compatibility breaks affordable; it does not make save loss affordable.

## 4. Expand qualification and publish exactly what passed

Only after the x64 build-and-adoption checkpoint passes should the remaining target builds start.

### Qualification is a matrix, not an image count

Record separately:

- Build target and architecture.
- Physical boards covered by that artifact.
- Clean-install result.
- Upgrade result.
- Boot medium and relevant boot-chain differences.
- Recovery method.

Inspect whether bootloader, DTB activation, partition layout, or other boot-chain artifacts changed. An x64 rehearsal cannot establish an ARM board’s upgrade safety.

If an ARM fix changes the frozen shared inputs, requalify the affected x64 candidate too. “One head” must not conceal different dependency revisions.

### Small release packet

Use a plain machine-readable manifest containing:

- Distribution, ES, and splash commits.
- Build-container digest.
- Target, version, **per-image** `BUILD_ID`, and artifact hashes.
- Source archive/index references.
- QA harness revision and report identifiers.
- Notice/source-bundle references.

I accept **Kimi’s** correction: equal `BUILD_ID`s are not a valid gate until their derivation is known. Shared source provenance and correctly recorded per-image identities are sufficient.

This manifest is a traceability document, **not a new update protocol or mandatory cryptographic framework**.

### Concrete publication checks

Each check must produce a revision-pinned receipt and fail when its negative fixture is introduced.

- **Artifact identity:** `sha256sum --check` before and after QA.
- **State compatibility:** compare controlled save/configuration fixtures and observed labels/paths before and after adoption.
- **Branding:** inspect generated OS metadata, ES strings, theme/XML assets, and selected rendered screens against a versioned allowlist.
- **Localization:** reconcile changed ES source strings with translation catalogs; do not assume changing two English strings covers localized interfaces.
- **Secret exposure:** scan the extracted shipped filesystem and storage skeleton for credentials, development remotes, and QA accounts. Do not print discovered secrets into logs.
- **Source availability:** retrieve the published source/notice artifacts and verify their recorded hashes.
- **Channel separation:** demonstrate that ordinary CI candidates cannot become stable updates.
- **Asset transport:** check actual compressed sizes against the destination’s current limits.

The branding allowlist must permit required attribution and preserved compatibility identifiers. I accept **Muse’s** objection to an indiscriminate zero-hit grep. Sampled screenshots also do not prove the absence of an old logo in every frame.

For licensing, the release blocker is the applicable obligation for what ships: corresponding source where required, notices, permitted redistribution, and disposition of third-party service credentials or identifiers. A complete SPDX programme can wait; unresolved distribution permission cannot. Public repository visibility alone does not close source obligations.

Release notes can provide the minimal public surface: support matrix, adoption instructions, limitations, recovery, source links, attribution, and non-endorsement. A redesigned website is unnecessary.

## 5. Scheduling and owner attention

I accept the reviewers’ request to price my own process.

### Initial planning allowance

For the intended four-target release, reserve:

| Work | Active engineering allowance |
|---|---:|
| Primary inspection, minimum security/backup, input preparation | 6–10 hours |
| Identity changes, x64 proof, adoption rehearsal | 8–12 hours |
| Remaining qualification, source/notices, publication preparation | 6–10 hours |

**Total: 20–32 active engineering hours, with a provisional 4–7 elapsed-day window.**

That window assumes roughly one to two days of aggregate serial build time, one x64 retry, and owner responses within a working day. These are planning allowances, not reproduced measurements. Reforecast after the first cold x64 build. Unresolved source obligations, repository access, or a substantial updater rewrite explicitly invalidate the window.

Before building, measure actual disk usage and forecast simultaneous old/new roots, source archives, VM overlays, and retained candidates. Using the reported upper root-size range provisionally would mean roughly **600 GB for four new roots alone**, not a complete storage budget.

### Owner budget

Budget approximately:

- **1.5–2 hours fixed** for scope, access/recovery, and publication review.
- **20–45 minutes per physical qualification session**, excluding failure recovery.

Four sessions would therefore cost roughly **3–5 owner-hours**. Every destructive device action still needs its individual authorization; a scheduled session does not erase that requirement.

Limit work in progress to one heavy build/QA pipeline and one light preparation task. If the owner is unavailable, stop at the immutable candidate. Do not expose an incomplete stable release or assume publication approval.

## 6. Post-0.0.1 sequencing and maintenance

### Explicitly amend the audit gate—or retain it

I accept **Gemini and Kimi’s** criticism that my previous D-WORKFLOW-083 treatment was ambiguous.

My recommendation is an **explicit owner-approved amendment**:

- The RetroArch-under-ES Step 0 spike may proceed without waiting for full Tier 1 completion.
- Shipping it requires review of the changed launch/control/state paths and closure of release-blocking findings.
- Audit unchanged areas in parallel; review rapidly changing launch code after the spike stabilizes.
- Gate the fresh runner on review of the launch and integration surface it will replace—not on a mistaken assumption that Step 0 is already that runner.
- Newly discovered security or data-loss defects block the next affected release regardless of tier.

If that amendment is rejected, the existing gate remains. I would not reinterpret it quietly. Referenced missing register material must be recovered from the primary record before updating dependent decisions.

For Step 0, keep RetroArch responsible for emulation, saves, and achievement state. Prefer a narrow ES integration module over an upfront `GuiMenu.cpp` reorganization. Before Step 1, test proxy compatibility, save-state paths, credentials, and offline achievement queues explicitly. Small reference-runner line counts are not a delivery estimate.

### Retain internal names for now; measure reconsideration

I accept **Claude and Muse’s** correction against permanent abandonment of the code-level rename. Preserve upstream-owned paths for now, use the new prefix for new fork-owned artifacts, and require a throwaway rename plus trial upstream merge before reconsidering.

Respect the fork-network decision rather than reopening it. Add a PR-base warning and fork-targeted contribution links.

### Sustainable upstream and QA policy

Adapt **Muse’s** cadence recommendation to:

- Monthly upstream review, plus a security fast path.
- No routine merges during release qualification.
- Separate distribution and ES conflict/repair records.
- Diff and review imported workflows, build scripts, and patches before executing them.
- Revisit the tracking strategy when measured maintenance exceeds the owner’s budget.

A pinned RC2-derived base is appropriate for stabilization, not an indefinite substitute for a security-maintenance policy.

For later low-risk 0.0.x releases, propose VM qualification plus a risk-selected rotating physical board; boot, updater, storage, and minor-version changes trigger broader board coverage. Record what was actually tested.

Hosted QA remains a bounded experiment after 0.0.1: inspect the current runner’s resources, run the exact boot/flow job repeatedly, and record failures and transfer costs. Do not use shared-runner timing or software-rendered GL results as substitutes for local performance or hardware qualification.

**The revised spine is:** preserve state, control inputs, prove x64 adoption, expand to the agreed hardware matrix, and publish the exact qualified bytes. The remaining improvements should earn their place through measured maintenance cost—not accumulate into another prerequisite programme.

=== END gpt-revised_plan.md ===

=== START muse-revised_plan.md ===

# Step 3 — Revised approach (Muse)

I am revising my Step 1 proposal on the merits, using the four peer critiques as prompts to re-check, not as evidence that anything works. Where I accept, adapt, or reject a critique I name the reviewer and give an independent technical reason.

## A. Corrections to my prior claims

**1.5 2FA: contradiction -> record gap.** Claude and GPT both note a 05:43 `false` followed by a 05:51 `true` is a progression, not a contradiction. I accept. On the merits, the checkbox state can legitimately flip during setup; what is missing is who flipped it and whether `members?filter=2fa_disabled` was empty at that moment. Revised finding: record gap plus break-glass question, not self-contradiction.

**R1 "silent brick" -> "fleet loses auto-update."** Claude argues a wrong updater URL strands OTA but leaves the manual `.update` tar path intact. I accept. On the merits, bricking requires loss of both paths; losing discovery/selection/download while manual install still works is high-cost but not a brick. I keep it at rank 1 on cost and add GPT's and Kimi's extensions below.

**1.3 merge-cost overstatement.** Claude notes my "every upstream distro change is a manual port" overstates a five-file surface that mostly moves at version bumps, and the fork changes `version` anyway. I accept. On the merits, the recurring cost is real but bounded: content diff under either choice, plus forward-port checks if I add a new directory. I retain the load-bearing part — DISTRO≠PROJECT has never been built and needs one build log — and drop the inflation.

**R6 device count.** Claude notes four images/roots is consistent with H700 (two boards), RK3566, SM8550, GENERIC_X64, and my "five" double-counts the VM. I accept. On the merits, the packet never states build-targets vs physical boards vs VM guests distinctly. Revised requirement, following GPT's matrix point and Kimi's observation that the council cannot state the device set from the packet: a support matrix distinguishing build target, physical board, and QA guest before any tag.

**1.18 redirects.** Claude corrects me: GitHub repository redirects do cover `releases/download/` under the old name; what does not redirect is `ghcr.io` namespaces and third-party embeds. I accept. On the merits, the redirect is a repository path feature, not a registry or external-embed feature. I revise the examples accordingly and, following Kimi, add an explicit sunset criterion for depending on `maxengel/rocknix` at all.

**Storage numbers.** GPT notes a nominal 4 TB device appearing as ~3.6 TiB is expected decimal-vs-binary reporting, not 400 GB of drift. I accept. On the merits, vendors sell TB, `df` reports TiB. I convert the finding to a verification check (`df -B1`, `du` per root) rather than a drift allegation. Same discipline for sweep counts: GPT is right that 24/110/15 needs classification before calling anything an omission. I keep my demand for one triaged grep report, reframed as classification, not accusation.

**P0 front-loading.** Claude, GPT, and Gemini all argue seven owner answers plus docs/backup/sweep before the first rename commit recreates the scope problem I criticize elsewhere. I accept in part. On the merits, only three answers actually block a commit: cloud default, device/tag matrix, updater mechanism and adoption model. Wording, pin policy, thresholds, and full blueprint move into Phase A exits or post-0.0.1. I push back only on backup scope — see §F.

**P2 circular gate.** Claude notes my P2 exit depends on Q15, a threshold the owner has not set. I accept. On the merits, a gate cannot depend on an unset parameter. Revised: propose a default time-to-play threshold plus a one-sided regression limit in P0, owner confirms or replaces, P2 measures against it. GPT's point stands: "within ±10%" perversely rejects improvements; use an upper regression bound with controlled repeats.

**Per-device tags as default.** Claude, Gemini, GPT, and Kimi all reject `0.0.1-generic-x64`, `0.0.1-h700` as a plan default: it rewrites the proposed version scheme, complicates updater selection, and a "latest release" client can select a release lacking its asset. I accept. On the merits, tag scheme is a product and updater-contract decision, not a scheduling shortcut. Revised default: x64-first *proof*, single `0.0.1` tag covering images built after that proof passes. Per-device tags become an owner question with an explicit selection contract required before adoption. I retain x64-only only as an owner-approved fallback if ARM blocks — see §F.

**Mutex timing and artifact isolation.** GPT notes introducing the build/test mutex in P4 is too late if P2 already exercises the conflicting paths, and that immutable inputs plus a scheduler address different failures than RAM. I accept. On the merits, more RAM cannot stop a build overwriting the image QA is reading. Revised: lockfile plus immutable candidate store from the first build onward. I adopt GPT's dependency-closure framing: a release is distribution commit + ES commit + splash commit + container digest + source revisions + per-image BUILD_ID/digest + QA IDs + notice bundle.

**Container pin.** GPT distinguishes inspecting the digest behind `:latest` from enforcing it. I accept. On the merits, evidence without enforcement drifts on the next pull. Revised: subsequent build invocations must consume the immutable digest; the reconstruction recipe is preserved separately.

**Repository-owner guard.** GPT notes `github.repository_owner` on a PR against the project identifies the base owner, not trusted provenance. I accept. On the merits, it cannot distinguish trusted code from untrusted. Revised: no `pull_request` execution on self-hosted runners, `push`/`workflow_dispatch` on protected refs only, plus the runner-threat mitigations below. I also accept GPT's test hygiene: no `sudo -u <runner> cat <secret>`; use non-printing access assertions and synthetic canaries.

**Recovery vs provisioning separation.** GPT warns against restoring the full control-account secret layout onto a second QA host. I accept. On the merits, reproducing the toolchain is desirable; copying owner credentials everywhere expands compromise surface. Revised: role-specific blueprint — build/QA hosts get build inputs only; owner/bot secrets stay segregated.

**Zero old-name occurrences.** GPT notes compatibility paths, legal notices, history, and user data are not branding failures. I accept. On the merits, a zero-occurrence rule conflicts with preserving those intentionally. Revised: brand suite with documented allowlist.

**External-knowledge labeling.** Kimi notes I assert KVM/runner behavior as fact; Claude corrects my runner figures toward 4 vCPU / 16 GB / ~14 GB SSD with `/dev/kvm` documented on public repos. I accept both the correction and the discipline. Revised stance, verify-first: the binding constraints for this workload are no GPU (any GL proof is llvmpipe), ~14 GB free disk against a 2 GB image plus sparse qcow2, and artifact transfer per push. Measure the exact job once; do not gate on hosted QA until measured. I adopt Kimi's house rule: label externals or strike them.

**Rhetoric.** Kimi notes my verdict ("will either ship still saying ROCKNIX somewhere, or slip") outruns its evidence when I also propose the grep gate that counters the first horn. I accept and soften the verdict to conditional risks with gates.

## B. Missing failure modes I am adding

**DISTRONAME as path/label generator + partition labels.** Claude identifies the shared blind spot and Gemini surfaces `boot=LABEL=ROCKNIX disk=LABEL=STORAGE`. I accept. On the merits, in this family `DISTRONAME` and its lowercase form are routinely interpolated into `/storage/.config/<name>/`, hostname, SMB share, `/etc/os-release`, and boot labels via `DISTRO_BOOTLABEL`/`DISTRO_DISKLABEL`; an upgrade replaces KERNEL/SYSTEM but does not relabel partitions. Ten minutes of grep beats a day lost to rehearsal. Revised P0: `grep -R` for `DISTRONAME`, `DISTRO_BOOTLABEL`, `DISTRO_DISKLABEL`, `HOSTNAME` across `packages/`, `projects/`, `scripts/`, `config/`; read the bootloader/initramfs path before any shim; for 0.0.1 keep every persisted path and label at RC2 values regardless of display string. A relabel belongs to a later clean-install release with init accepting both.

**Sources mirror + GPL corresponding source.** Claude and GPT note the container is only half the supply chain; a distribution-configured source mirror plus fetched tarballs underpin both builds and GPLv2 binary-distribution compliance. I accept. On the merits, a public fork history is not the corresponding source of shipped binaries. Revised: name `DISTRO_SRC` (or equivalent) in P0, mirror or archive exact tarballs per release, and require a component-level release check — root licence, recipe fields, and shipped works are different things.

**Version-comparison direction as an explicit gate.** Kimi asks whether `0.0.1` compares newer than `rc2-20260929`; GPT and Claude carry it into gates. I accept. On the merits, a lexical/numeric compare can rank `0.0.1` older, so the RC2 fleet may never be offered the release. Revised P3 PASS line: "RC2 guest, given a fork channel offering `0.0.1`, is offered it and applies it," with the comparison function's behavior on date-style strings documented, plus asset-naming/prefix, redirect-following, and distro-name checks.

**Update authenticity and interrupted updates.** GPT separates corruption detection from origin authentication and lists truncated/corrupted downloads, interruption mid-install, wrong-target assets, stale ordering, failed first boot, and documented recovery preserving player data. I accept. On the merits, a checksum fetched beside its payload does not authenticate origin. Revised: state the trust assumption explicitly if signing is deferred; do not present `.sha256` as a signature.

**ES transfer on the critical path + splash as fourth repo.** Kimi states this most clearly. I accept. On the merits, the two interface strings live in ES source and the splash lives in its own repo the fork does not own. Revised: ES transfer precedes the image build; splash is forked, not transferred. My prior "transferred, not recreated" criterion is corrected per GPT.

**ES licence read + l10n loss.** Claude flags the ES licence discrepancy; Gemini flags 154k+ lines of localization invalidated by two string changes. I accept both. On the merits, the pin is meaningless without knowing what licence governs the pinned tree, and a source-string change orphans translations. Revised P0/P2: record ES licence from its tree and add an l10n check to the brand suite.

**Second personal account ToS standing.** Kimi flags `pixelelated` as possibly a second personal account rather than a machine account. I accept promotion from one line to a risk row. On the merits, if the lockout safeguard rests on an account type the platform does not permit for that use, suspension removes recovery exactly when needed. Remedy: trusted second human as owner or documented reliance on org-recovery, plus a 2FA custody record.

**Correlated 2FA custody, second-rename debris, redirect sunset.** Kimi lists these as union-missing. I accept. On the merits: if both owners' 2FA and the bot secret share one device, two-owner redundancy has a single point of failure; pixelelated-era strings/accounts/domains are identity incompleteness if unswept; RC2 updaters depending on a redirect that dies on re-registration need a stop-depending criterion. All three enter P0/P1/P4.

**Secrets in the shipped image.** Kimi notes no analysis sweeps image contents for QA accounts, rclone remotes, or dev material. I accept. On the merits, a brand grep does not catch credentials. Revised: pre-publish secret sweep of image contents alongside the brand suite.

**Release-channel pollution + asset size.** Kimi notes Phase C transports CI images as Releases on the same surface the updater reads, and ~2 GB images sit near per-asset limits. I accept. On the merits, without draft/pre-release discipline and channel selection, devices can be offered CI builds. Revised P4: draft/pre-release discipline, channel selection test, and a size-headroom check.

**PR-base default mitigation.** Claude and Gemini note new PRs against a fork default their base to the parent. I accept the cheap mitigation while leaving D-WORKFLOW-086 settled: PR template warning plus CONTRIBUTING line. On the merits, this addresses the hazard without relitigating the decision.

**Step 0 feasibility beyond a command socket.** GPT notes ES-over-RetroArch depends on display ownership, compositing, focus, controller ownership, lifecycle, and recovery when either side exits, plus bind address/access policy for any network interface. I accept. On the merits, pause/save commands do not prove drawing, input, or event flow. Revised: small feasibility proof covering those boundaries before Step 1.

**Runner split-brain.** Kimi flags save-state paths and rcheevos offline-queue splitting across two frontends behind one proxy, and per-core routing violating least-surprise. I accept as an addition to my `rc_client`-via-proxy packet-diff point. On the merits, same core build does not establish frontend interchange; containers, compression, metadata, options, content identity, and queue location matter. Revised: bidirectional RetroArch→runner→RetroArch interchange tests.

**Warm-build provenance.** GPT notes four builds from one head can still differ via floating deps, dirty worktrees, stale stamps, or inconsistent containers, and a test can pass against a stale image at a familiar path. I accept. On the merits, matching version strings do not establish matching environments. Revised: bind every test result to image digest plus recorded inputs; periodic clean-build validation.

**QA-frame bloat.** Kimi notes per-release PNGs accumulate in every clone. I accept as post-0.0.1 debt with a retention/LFS policy, not a 0.0.1 blocker. On the merits, it is real but does not affect the identity cutover.

**D-WORKFLOW-088 absent.** Gemini catches that row 088 is missing from the register table; Kimi notes packet defects condition everything. I accept — I missed it. I mark conclusions conditional on the gap, as Claude and GPT do, and require the row be supplied or struck.

**Maintainer time as binding constraint.** Claude notes all plans are assistant-executable but owner-gated, and none prices owner-hours per release. I accept. On the merits, device yeses, release yeses, and register rows decide whether four-device 0.0.x cadence is sustainable. Revised plan carries an explicit owner-hours budget.

## C. Scope and sequencing decisions

**x64-first proof, single tag default.** I adapt to all four reviewers: P2 proves `DISTRO=rasteratops PROJECT=ROCKNIX` (or the new-directory variant — see next) on GENERIC_X64 and boots it in the VM before any ARM build starts. Default tag remains `0.0.1` covering all images built after that proof. This preserves my de-risking argument while fixing the version-scheme overreach.

**`distributions/` choice decided by build, not argument.** Claude composes Kimi's owner-choice framing with my unproven-split finding: the choice cannot be made well until one x64 build completes. I accept. On the merits, `config/path`, `scripts/image`, and stamp hashing either tolerate the split or they do not; only a log settles it. Revised: trial the new `distributions/rasteratops/` directory on a throwaway branch first; if path resolution breaks, fall back per P0 reads. Add a mechanical merge-cadence check (`git diff upstream/next -- distributions/ROCKNIX/`) either way.

**Cloud folder: cut code in 0.0.1, keep contract shape as deferred design.** Kimi lists cut-entirely vs contract-now vs dual-read-now; Gemini is the outlier for dual-read-now against the `--delete-excluded` warning. I maintain my cut-entirely for code: on the merits, 0.0.1 is an identity release and the installed base's own saves must not ride a migration invented in a hurry. I adapt GPT's compatibility table (version compare, device selection beyond filename, interrupted download, cloud namespace, rollback) as the deferred design artifact, with one sentence stating migration itself is deferred. I accept Claude's carve-out to Kimi's "cheapest moment to break" framing: cheap-to-break applies to updater and splash, not to cloud folder or `/storage`. I also accept GPT/Kimi's mixed-installation case as a required test whenever migration is attempted.

**Updater: manual-adoption default with OTA as a gated stretch.** GPT offers the only degraded mode; Claude and Kimi detail why OTA is highest-cost. I adapt: 0.0.1 ships as explicit manual adoption unless P3's discovery/selection/download rehearsal passes end-to-end, followed by a fork-to-fork update test. On the merits, a manually supplied tar proves installation without proving discovery; only the full chain proves OTA.

**Audit vs runner: parallel spike, gated merge/release.** Gemini and Claude would unblock #336 Step 0 immediately; GPT warns against deferring known security/state/launch findings; Kimi notes backgrounding Tier 1 while Step 0 rewrites launch code reviews moving code. I adapt to a scoped parallel: allow the Step 0 spike now on a branch; gate its merge and any `0.1` release on Tier 1 punch closure for the launch/control slice plus known high-severity items; gate #336 Step 1 on the Tier 3 launch-path slice, not Step 0. This requires an explicit D-WORKFLOW-083 amendment: "Tier 1 punch items before 0.1; Tiers 2–3 before 0.2/0.3 except the Tier 3 launch-path slice before Step 1." On the merits, this distinguishes permission to explore from permission to release.

**#341 placement.** I reject Gemini's #341-first: Kimi is right its relaxed policies bind upstream-bound PR flow which D-087 parked, so the rationale is underargued. Revised: credential scanning survives any reading of the personal-paths guard (per Claude) and runs early; full policy relaxation follows 0.0.1.

**Code-level rename stays "retained for now."** I reject Claude-analysis/Gemini's permanent-drop framing and maintain GPT's and my register-aligned stance. Claude the reviewer supports this on mechanics: the merge tax is a constant per-merge cost once it lands, and rename detection with raised `merge.renameLimit` handles a directory move better than "permanently sever" implies. Revised: indefinite deferral gated by a measured trial merge on a throwaway branch after the rename, not unilateral abandonment. This leaves D-WORKFLOW-085 intact.

**Fork network stays settled.** I reject Gemini's relitigation of D-WORKFLOW-086 and keep the decision, adding only the PR-base mitigation above.

**Infrastructure: minimal backup before first build, full blueprint later.** I adapt GPT's scoping and Kimi's sizing: a `restic`/`rsync` snapshot plus token/2FA inventory and a build/QA lockfile are a P0/P1 job, not a project; the executable provisioning blueprint and restore drill on the second box follow. On the merits, the single box holds tokens, worktrees, and gigabytes of caches; losing it costs weeks.

## D. Revised plan with runnable exits

**P0 — Read before commit (½ day + 3 owner answers).**
Reads: updater client code; `config/path`, `scripts/image`, `scripts/build_distro` for DISTRO/PROJECT assumptions; DISTRONAME/BOOTLABEL/DISKLABEL/HOSTNAME grep; bootloader/initramfs label contract; ES licence + string locations; splash repo identity; container digest + `DISTRO_SRC`/mirror; `df`/`du`; outbound connections; third-party IDs; BUILD_ID derivation; asset-size headroom; D-088/Choice-2 gaps.
Owner blockers only: (1) cloud default and migration stance, (2) device matrix and tag scope, (3) updater mechanism and adoption model.
Exits: `grep -R` report with persisted-path/label keep-list; one-paragraph updater mechanism note or "manual default"; BUILD_ID derivation stated; no `distributions/rasteratops/` commit, no updater flip, no tag.

**P1 — Supply chain and repo surgery (½–1 day).**
Mirror and pin container by digest and enforce it in build invocations; archive/mirror sources; transfer the two owned repos, fork splash; create minimal team scope (required repos/capabilities only); harden triggers (no `pull_request` on self-hosted); add PR-template/CONTRIBUTING base warning; take minimal backup + custody record; create immutable candidate store and lockfile (`flock` around build vs vm-qa); set minimum separation (bot and mail tokens in separate files, owner token off box, release publish behind per-release owner yes).
Exits: `docker inspect`/build-log shows digest pin consumed; `git remote -v` shows fork addresses; trigger dry-run proves PRs do not execute on self-hosted; backup snapshot ID recorded.

**P2 — x64 proof (1–2 days elapsed).**
One cold GENERIC_X64 build from the trial identity commit; boot in guest; brand suite (strings over `os-release`/ES binary/theme XML, logo template match with tolerance/bounding-box not "0 diff," hostname/SMB/mount/unit leak classes, documented allowlist) plus secret sweep and l10n check. No ARM starts until P2 passes.
Exits: build log archived with manifest closure; VM boot PASS bound to image digest; brand/secret/l10n reports attached.

**P3 — Updater and migration rehearsal (½–1 day).**
RC2→0.0.1 discovery/selection/download/install test with version-compare documented; asset-prefix, redirect, and distro-name checks; interrupted/corrupted/wrong-target/stale/failed-first-boot cases with documented recovery preserving player data; cloud unchanged in code. If any OTA leg fails unsafely, 0.0.1 ships manual plus a fork-to-fork update test.
Exits: explicit PASS line for "RC2 guest offered 0.0.1 and applies it" or a recorded manual-adoption decision with recovery doc.

**P4 — ARM and release (1–2 days elapsed + device yeses).**
Three ARM builds from the same manifest closure into the immutable store; VM QA where applicable; flashes per matrix; draft/pre-release discipline and channel-selection test; size check; release notes stating lineage and non-endorsement (not retained marks); component licence + corresponding-source bundle.
Exits: per-image digests + QA IDs in one manifest; device yeses recorded; owner release yes; elapsed estimate stated as bracketed and conditional, with owner-hours tallied (my planning figure: 3–5 days elapsed on one box including cold builds and rehearsal, plus 2–4 owner-hours for flashes/yeses — falsifiable, not a floor).

**P5 — Post-0.0.1 debts.**
D-083 amendment row; Step 0 branch work with launch-slice review after the spike; full blueprint + restore drill using the second box as its provisioning test; `tools/upstream-merge` divergence budget split by upstream- vs fork-owned roots; #341 relaxation, Tier 2–3 audits, #340, site, art.

## E. Deferred owner inputs (not P0 blockers)

Attribution wording, container rebuild policy, time-to-play numeric default confirmation, mail-trigger allowlist, delegation list, per-device tag train (only if the fallback is invoked), QA-frame retention/LFS, second-human owner vs org-recovery choice.

## F. Explicit pushbacks

- **On GPT's gate-scope point:** I narrow my "Phase E gate breached" language to "half-executed gate, re-gate the remainder" — preparatory design and transfers are not a breach — but I maintain the substance with Claude: no identity commit, updater flip, or tag until P0/P1 exits pass. On the merits, the gate text scopes to Phase A starts, and those three actions are Phase A effects.
- **On permanent rename rejection (Gemini, Claude-analysis):** I reject. On the merits and per register fidelity, "retained for now" plus a measured trial merge preserves optionality at constant per-merge cost; permanent severance is mechanically wrong and overwrites D-WORKFLOW-085.
- **On x64-only having no product value (Kimi):** I soften the default but retain x64-only as a legitimate owner-approved fallback. On the merits, with a four-device fleet the release machinery, brand sweep, and update contracts proven on x64 have standalone value, and Kimi's own cheapest-moment logic favors proving them before risking handheld flashes.
- **On backup minimalism (GPT):** I push back narrowly. On the merits, token inventory plus one snapshot is an afternoon and removes a weeks-to-recover tail risk on a single 4 TB host; only the full automated blueprint defers.
- **On estimate precision (Claude-analysis):** I side with GPT and Kimi over hard floors. On the merits, build concurrency, device availability, and remediation volume are unverified source-reported numbers. I give a bracketed figure marked conditional and inherit GPT's provenance discipline.

=== END muse-revised_plan.md ===

## Output

Choose exactly one winning member and explain why that plan is strongest. You may not vote for yourself. Include dissent notes when another plan contains an important primitive the winner does not fully absorb.

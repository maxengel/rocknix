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
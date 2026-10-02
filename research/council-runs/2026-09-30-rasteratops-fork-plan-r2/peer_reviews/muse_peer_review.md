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

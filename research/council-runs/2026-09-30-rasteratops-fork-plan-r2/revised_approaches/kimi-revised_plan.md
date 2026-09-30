# Step 3 — Revised approach (kimi)

I wrote `kimi-analysis.md`. The four reviews above are the inputs to this revision. Where I accept a critique I restate the reasoning in my own terms — reviewer agreement is attribution, not evidence; each change below stands or falls on the engineering merit.

---

## 1. What survives review unchanged

The spine holds, and I keep it:

- **The updater is the highest-cost 0.0.1 risk.** Two inconsistent descriptions in the corpus (releases scrape vs. POST endpoint), an asset-naming trap (an RC2 client matching `ROCKNIX-*.tar` will never see `rasteratops-*.tar`), and a version-ordering question (`0.0.1` vs. `rc2-<date>`) that decides whether the RC2 fleet is offered the new release at all. A rename that changes distribution name, version scheme, asset names, and hosting in one step is a migration; migrations are rehearsed or they strand devices. gemini, gpt, and claude all converged on this, and the reasoning is independent of any of us.
- **The migration tail precedes the identity commit.** The two player-visible strings are ES source, so the ES fork transfer is on Phase A's critical path; the splash is a fourth repository that must be forked, not transferred. muse validated the ordering; nobody contradicted it.
- **C10:** Tier 3 gates the fresh-runner step 1, not the RetroArch-under-ES step 0.
- **"Cheapest moment to break":** four devices and one forgiving user make 0.0.1 the cheapest moment to deliberately break the updater, cloud default, and splash behind gates. claude endorsed the framing with one carve-out, which I accept in §2.6.

## 2. Corrections I accept

### 2.1 Phase 0 was overstuffed — split blocking tail from background (gemini, muse)

gemini is right: two transfers, a splash fork, org teams, a 24-file sweep, a variable audit, Actions hardening, a container mirror, 135-issue triage, CONTRIBUTING, and register rows do not fit in 1–2 days, and most of it doesn't block a commit. Revised split:

**Blocking:** repo transfers + splash fork; scoped collaborator grants (gpt's correction: no default unlimited future access — grant only required repositories and capabilities, team scope separate from token repository selection); runner trigger hardening (`push` on `next` + `workflow_dispatch` only, approval for outside contributors); container mirror + digest pin; **serval backup** — claude is right that my R8 covered tokens but not the 4 TB of state, and a blueprint is not a backup. This is a `restic` job plus an encrypted token export, with muse's mechanism: named second copy, 2027 token renewal reminder via the mail channel, one recovery-drill receipt. Plus the DISTRONAME grep (§2.4) and three owner questions (§2.7).

**Background:** 135-issue triage, CONTRIBUTING/PR guides, site DNS, non-blocking register rows.

### 2.2 x64-first checkpoint inside Phase 1 (claude; muse-analysis's 1.3)

claude's revision is correct and I accept it without residue: the two load-bearing unknowns — the `DISTRO≠PROJECT` split building at all, and updater behaviour across the RC2→0.0.1 boundary — are both provable on x64 before any ARM build is worth starting. My Phase 1 kept four builds with no checkpoint, contradicting my own C1 arithmetic. Revised:

1. One `GENERIC_X64` build with `DISTRO=rasteratops PROJECT=ROCKNIX`; the build log is the first exit criterion and the gate for Q2 (§2.5).
2. Boot in VM; run the identity sweep.
3. Updater rehearsal on guest d: RC2 image, fork channel offering `0.0.1`, explicit PASS line "is offered it and applies it" (claude), comparison-function behaviour on the old date-style string documented. Extended per gpt: truncated download, interruption mid-install, wrong-board asset, stale/out-of-order versions, failed first boot, recovery route preserving player data. A checksum from the same channel is not authentication; the remaining trust assumption is stated, not hidden.
4. Only then the three ARM builds.

### 2.3 Build/test contention and provenance (gemini, claude, gpt, muse)

All four flagged that vm-qa reads the image the build overwrites; I missed it. Adopted: gpt's immutable candidate store (QA binds to a digest, never a mutable worktree path) plus a build/QA lockfile. Also gpt's warm-build provenance point: every test receipt records image digest + input revisions, with periodic clean-build validation — matching version strings don't establish matching environments.

### 2.4 DISTRONAME is a path/label generator, not a string (claude; gemini-analysis's partition labels)

The most valuable correction to my plan. My residue audit covered strings a player reads, not persisted state. Accepted:

- Before any value changes: grep every use of `DISTRONAME` (and lowercase), `DISTRO_BOOTLABEL`, `DISTRO_DISKLABEL`, and `HOSTNAME` across `packages/`, `projects/`, `scripts/`, `config/`.
- For 0.0.1, every persisted path and label stays at its RC2 value regardless of the display string: `/storage/.config/<distroname>/`, hostname, SMB share, `/etc/os-release` fields, partition labels. The kernel command line and labels are written at install time; an upgrade replaces `KERNEL` and `SYSTEM` but does not relabel partitions — a new image whose init expects a new label won't find root on an upgraded device. Relabeling belongs to a later clean-install-only release with init accepting both.
- Per muse's 2f, applied to myself: the specific consumers (`scripts/image`, initramfs/fstab, installer) are inspection tasks with decision branches, not prescribed edits. The grep comes first.

### 2.5 Q2 gets a technical recommendation, gated on the build log (muse, gpt)

muse is right that leaving Q2 as a pure owner choice was a cop-out; gpt is right that my framing was too sharp (a fork-owned directory needn't violate the no-rename rule; editing in place doesn't buy zero divergence either). Revised: **recommend keeping `distributions/ROCKNIX/` with `DISTRONAME=rasteratops` set inside** — minimal recurring merge surface (five files, mostly version bumps; claude's proportion over muse-analysis's "every upstream change is a manual port"). Conditional on the §2.2 build log proving the split; if `config/path`/`scripts/image` break, fall back to `DISTRO=ROCKNIX` with display-only changes for 0.0.1. Owner ratifies; the plan no longer pretends there's nothing to recommend.

### 2.6 Cloud: the mixed-installation case (gpt) and the carve-out (claude)

gpt's case is real and I missed it: "upgrades keep `/ROCKNIX`; clean installs create the new folder" splits one player's devices across two namespaces. Accepted: upgrades keep the configured root; clean-install default is an owner question with `/ROCKNIX` as the safe default; test matrix covers existing device + fresh install on one account, both roots present, provider errors not mistaken for an absent folder, one write authority, non-destructive conflicts. And claude's carve-out to my own framing is now explicit: cheap-to-break applies to the updater and the splash — **not** to the cloud folder or `/storage`. `--delete-excluded`-class loss of the maintainer's own saves is not covered by a forgiving user.

### 2.7 Owner questions reduced to three blockers (claude)

claude's distillation is right. Phase 0 gates on exactly: **(1)** updater mechanism and adoption model (with gpt's manual-adoption release as the declared fallback, not a failure); **(2)** cloud default and migration stance; **(3)** 0.0.1 device/tag scope. Everything else lands during Phase A or becomes recorded debt. Q9 now carries a default per claude: VM + one rotating device per 0.0.x, all four at minor boundaries.

### 2.8 Smaller accepted corrections

- **C8 promoted to a risk row** (claude): if `pixelelated` is a second personal account, the lockout safeguard rests on ToS-fragile ground; suspension removes the recovery path when needed. Remedy: trusted second human as org owner, or documented reliance on GitHub's org-recovery process.
- **D-WORKFLOW-083 amendment named** (claude, gpt): an explicit register row — Tier 1 punch items before 0.1; Tiers 2–3 before 0.2/0.3 — not an implicit resolution by sequencing.
- **Step 0 unblocked** (gemini, claude): my Phase 4→5 sequencing stalled the project's primary motivation behind 121k lines of audit. Step 0 spikes on a branch in parallel with Tier 1 over 0.1.x; C10 stands for step 1. gpt's safety condition accepted: exploring on a branch is not releasing; known security/state/launch-path findings still gate any release.
- **Step 0 feasibility scope** (gpt): a command socket isn't enough — display ownership, compositing, focus, controller ownership, lifecycle, recovery when either process exits; any network command interface gets an explicit bind address and access policy so we don't expose unauthenticated game control to the LAN.
- **Save-state contract reframed** (gpt): same core build is necessary but not sufficient — containers, compression, metadata, core options, content identity, architecture all matter. C12 becomes a both-directions test: RetroArch → runner → RetroArch for saves, states, Auto-slot, and pending achievements, establishing where the rcheevos queue actually lives. (Partial pushback: my split-brain risk — two frontends behind one proxy with divergent queues — stands independent of portability; gpt's test subsumes both.)
- **Vendoring → metric + trigger** (muse, gpt): drop "write vendoring conditions now." Track ES merge conflict/repair cost per merge; revisit vendor-vs-track when it exceeds a predeclared budget for two consecutive merges.
- **Licensing narrowed** (gpt): a non-commercial notice on particular bundled works doesn't categorically prohibit all future monetization. Replace my broad conclusion with a component-level shipped-artifact inventory (muse): firmware/GPU blobs, scraper/achievement/cloud client IDs, theme/ES licences, disposition per item. Add GPL corresponding-source hosting (gpt, claude): the exact fetched tarballs, not just fork history.
- **Sources mirror named** (claude, gpt): same class of unowned dependency as the container, and the GPL compliance mechanism. `DISTRO_SRC` or equivalent points at fork-owned storage, or we archive per-release tarballs.
- **Residue gate gets an allowlist** (muse, gpt): zero-hit is unpassable without exceptions for history, attribution, compatibility paths, user config, and translations. Versioned allowlist in `NAMING.md`; negative controls (injected old-name frames must fail). And per gemini: the two ES string changes invalidate matching entries across the localization files — the sweep includes locale files or accepts English fallback explicitly.
- **Mail MCP unmasked path** (gemini): the redaction wrapper covers the script; the `hostinger-email` MCP connects raw. Assistant mail access goes through the redacting path only, and inbound mail is data, never instructions — any "reply starts the next step" design needs allowlist-plus-confirm or it's struck (muse's R7).
- **Hosted QA unblocked from tags** (gpt): candidates pass via CI artifacts or authenticated staging; the requirement is binding the tested image to the exact digest.
- **PR-base default** (claude): PR template warning + CONTRIBUTING line. D-WORKFLOW-086 stays settled.
- **Upstream-merge as injection surface** (muse): merge review with diff scoping folds into the cadence row, alongside gemini's requested divergence metric — `git diff --stat` split by fork-owned vs. upstream-owned roots per merge.
- **Interim tag convention** (muse): the tag is `0.0.1`, uniform across images, not pre-judging the unratified version scheme.
- **Phase E re-gate** (muse-analysis's 1.13): the gate was half-executed before we sat. Re-gate what remains: no `distributions/` commit, no updater flip, no tag until the blocking tail is done.
- **One-sided regression limits** (gpt) for any timing gate in the #340 work.

## 3. Where I push back

**Against per-device release tags (muse-analysis; with claude and gemini).** x64-first is a proof gate, not a release split. `0.0.1-generic-x64` / `0.0.1-h700` rewrites the proposed version scheme, complicates updater parsing, and — gpt's addition — can make a "latest release" client select a release lacking its device asset. One `0.0.1` tag covering four images built after the x64 proofs pass. If the owner wants x64-only as a *product* decision, that's blocking question 3, not a plan default.

**Against front-loading the full contract apparatus (gpt-analysis, muse-analysis's P0).** claude's §2E states my position better than I did. The right altitude is gpt's own minimum-viable separation: bot token and mail token in separate files with separate purposes, owner token not on the box, release publish behind a per-release owner yes — an afternoon, not a prerequisite program. I adopt that minimum and reject the eight-phase contract-first shape for a four-device fleet, with the §2.6 carve-out explicit. Relatedly, on rename finality (muse's reconciliation list): I side with gpt's "retained for now" over gemini-analysis's permanent rejection — forward rule (new fork-owned artifacts take the new prefix from day one) plus a measured trial merge before any reconsideration, recorded as a refining row against D-WORKFLOW-085, not an overwrite.

**Against the manifest-service jump (gemini-analysis).** I keep read-the-client-first and re-point minimally if the client already speaks GitHub releases. A new static manifest service adds DNS/TLS/hosting/SLO/withdrawal design to a release that's already too big, to fix a rate-limit failure mode unproven at four devices polling at boot (60 unauthenticated requests/hour per IP). If re-pointing fails, the fallback is gpt's manual-adoption release — not a new service.

**On my own elapsed estimate.** claude is right that "two to three days" counted no yes-latency. But claude is also right that gemini-analysis's "physically impossible" inflated in the other direction; I won't overcorrect. Honest brackets: labour ≈ 1.5–2 assistant-days; elapsed ≈ 4–7 days dominated by four cold builds serialised with QA on one box, the rehearsal, and owner yeses; **owner time ≈ 3–5 hours for 0.0.1** (three decisions, four flashes, two release yeses). Planning brackets, not measurements — gpt's false-precision caution accepted.

## 4. Revised plan

- **Phase 0 — migration tail + hardening.** Blocking tail per §2.1 (~1 day labour; elapsed set by the three owner answers). Background items proceed in parallel.
- **Phase 1 — x64 proof.** Per §2.2: one build, VM boot, sweep with allowlist, guest-d rehearsal with the full interruption matrix. Candidate store + lockfile in force.
- **Phase 2 — ARM images + release.** Three ARM builds from the same head; minimal release manifest (distribution/ES/splash commits, container digest, per-image `BUILD_ID` + hashes, QA report IDs); single `0.0.1` tag; release notes state lineage and non-endorsement — not "marks retained" (claude's wording correction, adopted as the rule); owner flashes per the Q9 default.
- **Phase 3 — 0.1 line.** #341 relaxations needed for release + minimal site; Tier 1 in background with Step 0 spiking in parallel under the named D-WORKFLOW-083 amendment; merge cadence monthly + security fast-path (gpt's right-sizing over my original), divergence budget and ES merge-cost metric reported per merge.
- **Later.** Tier 3 launch-slice gates step 1; #340 with negative controls and one-sided limits; hosted-runner experiment scoped boot/flow-only, N=10, never a gate until demonstrated (muse's bounded experiment over gemini-analysis's CUT); minimal ARM hardware-in-loop (serial + power control) priced against the rotation default; field observability limited to local update logs and a bounded security-report route — no telemetry.

## 5. Open for synthesis

- The rehearsal design has two branches (releases-scrape vs. POST endpoint) until `rocknix-update` is read; the manual-adoption fallback is priced either way.
- The DISTRONAME grep may surface consumers none of us named; keep-at-RC2-values holds regardless.
- Owner-hours per release is the number that decides whether 0.0.x cadence is sustainable; my bracket is 3–5 for 0.0.1, and the merged plan should be judged against it.

No vote cast.
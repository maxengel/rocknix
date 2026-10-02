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
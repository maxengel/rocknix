# Rasteratops fork plan (#338): independent adversarial analysis

**Corpus as embedded by the Facilitator. I did not re-read or re-hash files myself.**

| # | path | sha256 (verified at embed time) |
|---|------|--------------------------------|
| 1 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md` | `371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba` |
| 2 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md` | `7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2` |
| 3 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md` | `4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782` |
| 4 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md` | `c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a` |
| 5 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md` | `188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1` |
| 6 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md` | `433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c` |
| 7 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md` | `cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59` |
| 8 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md` | `7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e` |
| 9 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md` | `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016` |
| 10 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md` | `846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677` |
| 11 | `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md` | `61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4` |

Settled and not re-litigated here: the name `rasteratops`, no community / no contributors / no sponsorships, nothing posted to ROCKNIX for now, EmulationStation as the one interface over a libretro runner, hardware support via upstream merges.

**Verdict in one paragraph:** #338 is a checklist, not a plan. It understates Phase A by 3–5×, leaves the hardest engineering — DISTRO/PROJECT split, updater cutover, EmulationStation-fork coordination, cloud-folder migration, merge cadence — as one-line assertions, violates its own Phase E gate by half-executing Phase B before the council sits, and stacks four full-time workstreams (0.0.1 rename, Tier 1–3 audits, runner spike, silent boot + site) onto one maintainer plus one assistant with no order, no staffing model, and no backup/recovery story. 0.0.1 as written will either ship still saying ROCKNIX somewhere a player reads, or slip while the estate is re-provisioned. Cut it to one bootable, updatable, attributable GENERIC_X64 image and prove the release machinery before touching devices, site, runner, or audit tiers 2–3.

---

## 1. Claims and assumptions that are wrong, unproven, or contradicted

### 1.1 "About a day of work plus the artwork" for Phase A

> `issue-338.md`: "Phase A: the identity, 0.0.1 (about a day of work plus the artwork)"
> `issue-337.md`: "A rename is about a day: a `distributions/<name>/` with the four files and a wordmark, `OS_VERSION` as `0.0.1`, the updater's address, the theme patch's text, then the four images rebuilt from one head, the VM suites and the rehearsal, and the devices on a yes."

Contradicted by the plan's own numbers:

- `issue-338.md` comment: "a cold rebuild of four devices is a day on one box, half on two"
- `issue-338.md` Phase A checkbox: "the four images from one head; vm-qa, the rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state), the devices on a yes."
- `CLAUDE.md`: "A first build needs ~200GB disk and hours; cached rebuilds take minutes."
- `issue-337.md` comment: splash "is a separate ROCKNIX repository (`rocknix-splash`, GPL, a small application pinned by commit in `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk`), so Phase A forks that repository into the organisation, replaces its image with the wordmark, and points the recipe at the fork's commit."

A DISTRO rename is not a cached rebuild. Changing `distributions/<name>/options`, `version`, `kernel_options`, `config/functions`, the splash pin, the ES pin, and the updater URL invalidates the image root at minimum and in practice forces full image rebuilds. Four cold images = one day of compute alone, before vm-qa, before the RC2 rehearsal (which itself is a multi-boot upgrade walk), before any device flash (which per `CLAUDE.md` requires "identify the removable card at run time and exclude every system disk; read the raw image back before touching its filesystem; on H700 a fresh card does not boot until the exact device tree is activated as `/dtb.img`"), and before release notes "in the maintainer's voice."

"About a day" counts the edit, not the proof. Realistic: 3–5 days elapsed on one box even if the first build is green, longer if the DISTRO/PROJECT split (1.3) bites.

### 1.2 "Exactly this much a player reads" is unproven and almost certainly incomplete

> `issue-338.md`: "the name is in 3,485 file names and 1,229 files' text on the upstream-bound roots ... and in exactly this much a player reads: `DISTRONAME`, `/etc/os-release`, the info screen, the boot splash, the logo, two interface strings (`ENABLE ROCKNIX SCREENSHOT`, the cloud folder sentence naming `/ROCKNIX`) and eleven printed lines in the scripts."

No method is given. No grep, no frame walk, no string-table dump from the EmulationStation fork.

Counter-evidence in the same corpus:

- `issue-337.md`: "the device pages' names where they say ROCKNIX", "the theme's logo and the splash", "the update URL the updater reads", "a line in the fork's README and release notes"
- `CLAUDE.md`: "User-facing behavior changes need a follow-up docs PR", vocabulary rules, `es-player-text.md` conventions — the ES fork holds thousands of player-visible strings; the claim that only two mention ROCKNIX has not been shown against `es-app/src` + `es-core/src` (184,891 lines per `issue-339.md`).
- Eleven printed lines in scripts: which scripts? Installer? `rocknix-update`? Evidence collector? First-boot wizard? The plan does not list them. If any error path, help text, or `motd`/`os-release` fallback still prints ROCKNIX, the "player-visible identity changes completely" promise fails.

Until there is a mechanical check — build, boot, dump `/etc/os-release`, screenshot info screen + splash + installer + update error + evidence archive name, grep the squashfs for `ROCKNIX` case-insensitively and triage every hit — "exactly" is an aspiration.

### 1.3 The DISTRO/PROJECT split is assumed to work. It may not.

> `issue-338.md` Choice 1: "the player-visible identity changes completely ... and the internal paths and script names stay as upstream has them"
> `decision-register-fork-rows.md` D-WORKFLOW-084: "the visible identity changes whole and the internal paths stay as upstream has them, so the hardware merges keep working"
> `CLAUDE.md`: "options are sourced in order — `distributions/<DISTRO>/options` → `projects/<PROJECT>/options` → `projects/<PROJECT>/devices/<DEVICE>/options`" and "`distributions/ROCKNIX/` — distro identity (version, options, splash)."

The plan assumes you can add `distributions/rasteratops/` while leaving `projects/ROCKNIX/` untouched and everything builds. That is plausible in LibreELEC-derived systems where DISTRO and PROJECT are distinct variables, but:

- The tree has never been built that way. Every released image to date is DISTRO=ROCKNIX + PROJECT=ROCKNIX. No build log in the corpus proves DISTRO≠PROJECT.
- `Makefile` targets in `CLAUDE.md` are `make docker-RK3588`, `PROJECT=ROCKNIX DEVICE=RK3588` — PROJECT is hardcoded in docs, tools, and likely in `config/path`, `scripts/image`, release directory layout, and `DEVICE_ROOT` reuse. If any script assumes `distributions/$PROJECT` or `projects/$DISTRO`, the split breaks.
- `issue-337.md` originally specified "`distributions/ROCKNIX/` becomes `distributions/pixelelated/`" — a move, not a copy. The plan now implies a copy-and-leave (new dir + old dir stays for merges?). Which files does the build read when both exist? What does `upstream/next` merging do when upstream touches `distributions/ROCKNIX/options` and you ship `distributions/rasteratops/options`? You have forked the file; every upstream distro change is now a manual port. That is the opposite of "merges keep working."

This is the single most load-bearing unproven claim in Phase A. It needs one GENERIC_X64 build log, not an argument.

### 1.4 Cloud folder "read both" is a half-specified migration

> `issue-338.md` Phase A: "the cloud folder's default name (`/ROCKNIX` in a player's cloud today -- read both, D-WORKFLOW-050)"

`CLAUDE.md` warns: "filter file is an allowlist; `--delete-excluded` is catastrophic."

"Read both" sounds safe but specifies nothing:

- Read both, write which? If 0.0.1 writes to `/rasteratops` while still reading `/ROCKNIX`, the player's cloud now has two roots that diverge. If it writes to both, every sync doubles traffic and failure modes. If it migrates (copy + delete), a bug deletes a person's saves.
- What about existing rclone remotes, crypt wrappers, case sensitivity on providers, and the "cloud folder sentence" string that names `/ROCKNIX`? Changing the default without a tested upgrade walk on a populated cloud is how you strand saves.
- The rehearsal "proves the upgrade path keeps a player's ROCKNIX-era state" — does that rehearsal include a populated cloud remote, or only `/storage`? Not stated.

This one line can destroy user data. It does not belong in a "day of work" phase without a dedicated design and a VM proof with a fake provider.

### 1.5 Phase B's org checkbox is self-contradictory on 2FA

> `issue-338.md` Phase B: "Ticked 2026-09-30: owners `maxengel`, `pixelelated`; `two_factor_requirement_enabled` reads `true` (owner read, 05:51 UTC)"
> `issue-338.md` comment 05:43 UTC: "`two_factor_requirement_enabled` still reads `false`, so the checkbox stays open on that one fact."
> Same file, 05:14 UTC: "The organisation's two-factor requirement reads `false`."

Either the requirement was flipped between 05:43 and 05:51 with no comment recording who did it and that `members?filter=2fa_disabled` was empty at that moment, or the tick is premature. The plan also says "one owner is a lockout" but names owners `maxengel` and `pixelelated` without saying which is the lockout, where its recovery codes live, or who `pixelelated` is (maintainer's second login? shared? — `issue-337.md` notes `pixelelated` is a name/domain the maintainer owns).

An org-hardening checkbox that cannot say which account is the break-glass and where its codes are is not done.

### 1.6 Sweep counts disagree: 24 files vs 110 files vs 15 files

> `issue-338.md` comment: "24 files under `tools`, `.githooks`, `.claude` and `.github/workflows` name `maxengel/rocknix`..."
> `issue-338.md` comment 05:02 UTC: "`maxengel/rocknix` becomes `rasteratops/distribution` in 110 files of the tree"
> `issue-338.md` comment 05:14 UTC: "the old address is swept out ... (`1633cbcac2`, 15 files; `rules-check` and `register-check` pass)."

All three can be true only if 15 is the "matters now" subset, 24 is the tooling subset, and 110 includes records that intentionally keep the old address. But the plan's Phase B checkbox says "the sweep of `--repo maxengel/rocknix` and the two upstream names across the tools, the rules, the hooks and the workflows (the count is in the plan's first comment)" — pointing to 24, while the actual commit touched 15. Which 9 were left? Are they `.github/workflows` runner examples, skill docs, or live `REPO=` constants? `rules-check` passing does not prove no live reference remains; it proves the checker’s patterns pass.

Needs: one `grep -R` for `maxengel/rocknix`, `ROCKNIX/distribution`, `ROCKNIX/emulationstation-next` across the tree with each hit triaged as code vs record, filed in the issue. Nine files of drift is how Phase C runs against the wrong repo.

### 1.7 "VM suites on hosted runners" assumes KVM + GPU + disk that hosted runners don't promise

> `issue-338.md` Phase C: "Ubuntu hosted runners expose `/dev/kvm`, so `tools/vm-qa` can boot the image there if the image arrives as a release artifact (2 GB) and the run fits the six-hour limit; measured once before it is relied on."

"Measured once" is the only honest clause. The rest assumes:

- `/dev/kvm` present and usable on `ubuntu-latest` today and tomorrow. GitHub does not guarantee nested virtualization; availability has varied by pool.
- 2 GB artifact transfer is cheap. It is not: upload from self-hosted builder + download to hosted tester on every push, plus retention. At several pushes a day this dominates runtime.
- Six-hour limit is enough. `tools/vm-qa` plus `time-to-play` plus visual walks plus rehearsal may fit, but no timing is cited.
- Most important: `issue-336.md` comment: "the first proof runs on guest d, which draws GL through the host's GPU, so the hardware path is proven on the VM before a device sees it." Hosted runners have no GPU. Any GLES/hardware-render proof run there is llvmpipe or fails. The plan would green-light a software-rendered boot and call it VM proof.
- `CLAUDE.md`: "VM disk must be 16GB+ or first boot breaks in a way that looks like a graphics bug." Hosted runner free disk after toolchains is tight; a 16 GB qcow2 + 2 GB image + logs + container may exhaust it.

Experiment is fine. Relying on it for 0.0.1 gating is not. The local box remains the only trustworthy VM prover until the experiment publishes numbers.

### 1.8 Build-root sizes contradict each other by 60%

> `issue-338.md` Phase D: "about 90 GB of root; four devices plus the source cache is about 400 GB"
> `issue-338.md` comment: "a device's build root is 110 to 147 GB, the source cache 38 GB"
> `CLAUDE.md`: "A first build needs ~200GB disk"

90 GB × 4 + cache ≈ 400 GB. 110–147 GB × 4 + 38 GB = 478–626 GB. 200 GB per `CLAUDE.md` (per device? per estate?) is a third number. The "2 TB is the floor, 4 TB matches serval" order guidance survives anyway, but any costing, any "hosted runner cannot hold a 90 GB build root" argument, and any block-storage sizing built on 90 GB is 20–60% low. Measure `du -sh build.* sources target` per device and write the table down; stop estimating.

### 1.9 "Splitting roles relieves memory pressure" overclaims the webkitgtk fix

> `issue-338.md` comment: "webkitgtk at 24 threads killed `cc1plus` twice on 2026-09-19 and is capped to four threads since"
> Later: "serval builds with its whole 64 GB, which also lets the webkitgtk cap loosen."

Freeing 6–10 GB of QA guests does not prove a 24-thread webkitgtk link fits in 64 GB. The failure was per-package parallelism (`-j24` on a huge C++ link), not total-system contention alone. Loosening the cap without a measured high-water mark (`/usr/bin/time -v`, cgroup peak) risks re-introducing the exact failure the cap fixed. Keep the cap until a build log shows headroom.

### 1.10 "Vultr bare-metal or high-memory instance ... technically fine: KVM, NVMe, no lock-in"

> `issue-338.md` Phase D.

No instance type, no price, no region, no test. Unproven:

- Does Vultr bare metal expose nested KVM for `tools/vm-qa`? Many bare-metal and VPS products do; some do not. No citation.
- NVMe size and endurance for 500 GB of churn per cold cycle? Block-storage IOPS and cost for persistent roots "on demand"? No numbers.
- "No lock-in" ignores the real lock-in: the build-box blueprint (`/workspace` layout, container, source cache, worktrees, tokens, SSH config, mail venv). That blueprint is not written down anywhere in the corpus. Moving providers without it is a rebuild from memory.
- The $300–600/month figure (`issue-338.md` comment: "A cloud box at 128 GB is roughly $300-600 a month kept up") is uncited and already stale against the $2,000 second-Tiny alternative the maintainer can get "through a work program."

Preference for Vultr as an independent provider is legitimate. "Technically fine" is not yet earned.

### 1.11 "A killed build poisons every package in flight" rules out spot — unproven

> `issue-338.md` Phase D: "Spot or preemptible instances are ruled out by the build system itself (a killed build poisons every package in flight)."

LibreELEC-derived build systems are stamp-based and generally resumable per package; `scripts/clean <pkg> && scripts/build <pkg>` exists precisely to recover. A SIGKILL mid-compile can leave a corrupt `PKG_BUILD` dir, but that is one `clean` away from recovery, not "every package in flight." The real argument against spot is elapsed-time risk (a 6-hour cold build evicted at hour 5), not poisoning. State the real argument and price it; don't invent a build-system property.

### 1.12 Phase D is both "not yet a purchase" and already settled

> `issue-338.md` Phase D: "the build box (a decision, not yet a purchase)"
> `issue-338.md` comment: "Then the second Tiny is the purchase, and Phase D's comparison is settled by it"
> Next comment: "Noted as Phase D's shape: two ThinkStation P3 Tiny Gen 2 boxes, identical ... Not started now."

Is Phase D open or decided? If the second Tiny at ~$2,000 with 4 TB NVMe is decided, Phase D's exit is an order date and a provisioning checklist, not "three shapes priced." If it is not decided, the comments should not say "settled." As written the plan can claim both "we haven't spent" and "we've decided" — which means no gate.

### 1.13 Phase E's gate was violated before the council sat

> `issue-338.md` Phase E: "Once A-D are confirmed by the maintainer, the plan goes to the `council` skill as its packet ... and the council's report is applied here before Phase A starts."
> `decision-register-fork-rows.md` D-WORKFLOW-084: "The plan (#338) goes to the council before Phase A starts"

What already happened before any council report:

- Org `rasteratops` created, repo transferred to `rasteratops/distribution`, origin re-pointed, sweep committed as `1633cbcac2`, token minted/approved, SSH key generated, commits signed as `rasterabot` (`e7d7b35884`), 2FA flipped (or not — see 1.5).
- Splash wordmark rendered to `/workspace/tmp/rocknix-session/splash/` with PNG + SVG + path data, splash-fork mechanics "settled," art spec (32×20 grid, 64×32 canvas, whole-number scale) issued to the maintainer.

That is Phase B half-executed and Phase A designed. The gate is retrospective. Name that honestly and re-gate what remains (no `distributions/rasteratops/` commit, no updater flip, no release) rather than pretending the council precedes all work.

### 1.14 "Two flagged choices" — only one is flagged

> `issue-338.md` Phase E: "the plan goes to the `council` skill as its packet with the two flagged choices and the numbers"
> Body: "**Choice 1 (flagged): a brand rename, not a path rename.**"

Choice 2 never appears. Candidates from comments: transfer vs hard fork (already decided as transfer, D-WORKFLOW-086), second Tiny vs cloud (allegedly settled), visible-only vs code-level rename (decided as two steps, D-WORKFLOW-085), repo name `distribution` vs OS name (decided). If Phase E means "brand-vs-path and build-box shape," say so. A council asked to rule on two choices with one named will rule on one.

### 1.15 Runner "three to five thousand lines of C; every one of them glue" understates the product

> `issue-336.md` comment: "Three to five thousand lines of C; every one of them glue between things that already exist."
> Same file: "A runner that replaces RetroArch has to carry the first three or the fork's own features stop" (offline achievements, save-state manager, exit hotkey + cards).

Glue does not implement save-state auto-resume + Auto-slot contract + launcher state-file contract, `rc_client` session + hardcore rules + offline queue via proxy, input remapping parity, audio batching without drift, GLES framebuffer handshake with context loss, per-core options, and a socket protocol that ES drives for pause/save/load/screenshot/quit — plus proofs on VM and RG35XX SP. Nanoarch (~1,000 lines) implements the handshake and almost nothing else; minarch (~2,400 lines) implements software video + states + options and no GL, no achievements, no socket. Adding those is not glue; it is a frontend. "Weeks" for step 1 with both core kinds, plus ES pause page + cards, plus `time-to-play` parity, is optimistic by 2–3× for one assistant-driven stream, even before the H700 GLES quirks (panfrost) and Nova (freedreno) differences the plan waves away as "Mesa."

Step 0 (RetroArch under ES's interface over its command socket) as "days" is the only estimate in #336 I believe, and only if "days" means "driven, not polished."

### 1.16 "Proxy sits unchanged, offline work carries over untouched"

> `issue-336.md` comment: "Our proxy sits at the HTTP layer, so it and the offline work carry over untouched -- the runner's HTTP goes to 127.0.0.1:8080 as RetroArch's does now."

Unproven. `rc_client` (rcheevos, MIT) is not RetroArch's achievement client; its request shapes, retry/backoff, hashing flow, and hardcore semantics differ. The proxy (`RAOfflineProxy`, GPL-3.0-only) was built against RetroArch's traffic. Pointing a new client's HTTP at the same port is not "untouched" — it is a new client against an old shim. Needs a packet capture diff and an offline-queue walk before anyone claims carryover.

### 1.17 "Paths stay, so merges keep working" ignores the files you do fork

Even with internal paths frozen, 0.0.1 forks:

- `distributions/rasteratops/*` (new, but shadows `distributions/ROCKNIX/*` — every upstream distro change is a manual port),
- `rocknix-splash` fork (new repo, new pin),
- EmulationStation fork (new commits for strings/logo, new pin in `package.mk`),
- updater script + URL,
- launcher (per-core routing for #336 step 0, then runner),
- RetroArch patches (still carried until runner replaces them).

`issue-336.md` admits the real cost: "the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge." The plan prices that cost at zero and sets no merge cadence (weekly? per-release? who resolves? what proves a merge?). "Keep merging `upstream/next`" without a cadence and a merge-proof suite is how forks silently drift for six months and then face an unmergeable wall.

### 1.18 Transfer "keeps every link working" overstates redirects

> `issue-338.md` comment: "every old link and git address redirects to the new one, and the remotes are updated anyway" and "the redirect keeps every link working."

GitHub redirects repo URLs and git remotes, but not every surface: pinned `tarball/...` URLs with commit SHAs redirect, but release-asset URLs under `releases/download/` change host path; `gh release view <tag> --repo <old>` follows redirect only if the CLI follows it; badges, container references, and any hardcoded `https://github.com/maxengel/rocknix/.../blob/...` in docs outside the tree (site checkout, forum posts, Discord) may or may not. More important: staying "in the fork network" (`decision-register-fork-rows.md` D-WORKFLOW-086) means the repo header still reads "forked from ROCKNIX/distribution," PRs default upstream, and search ranks it as a fork. That is honest and I endorse keeping the issues, but it is not "every link working" and it is not cost-free for identity.

### 1.19 CONTRIBUTING.md saying "takes no contributions" does not close the intake

> `issue-338.md` Phase B: "`CONTRIBUTING.md` and the PR template say the project takes no contributions; issues stay on; no sponsorship anywhere."
> `issue-337.md`: "a public repository cannot refuse them [unsolicited PRs]; a `CONTRIBUTING.md` says the project takes none and the template says so"

Correct that it cannot refuse them, but the plan stops there. Who closes unsolicited PRs, with what canned reply, within what SLA? Who triages issues when "issues stay on" but "no community, no Discord" means issues are the only inbound? What about security reports (no `SECURITY.md` mentioned), spam, and the self-hosted-runner risk where a malicious PR triggers workflows? "No contributions" is a triage policy, not a file. Without one, the maintainer inherits an unpaid queue.

### 1.20 Version scheme collides with audit gating

> `issue-337.md` comment: "`0.0.1` for this cut, `0.0.x` for fixes on it, `0.1` for the first cut that carries the fork's own direction (#336's step 0)"
> `decision-register-fork-rows.md` D-WORKFLOW-083: "every punch item resolved through Phase 7 or accepted by a row before `0.1`."
> `issue-339.md`: "Every punch item resolved through Phase 7 before `0.1`, or accepted by a register row."

If 0.1 carries step 0 (days of work) but is gated on all punch items from Tier 1 (121k lines) + Tier 2 (140k) + Tier 3 (185k) + provenance table, 0.1 is gated on months of audit, not days of runner. Either step 0 waits for the audit (absurd — step 0 is the fallback that makes the audit safe to schedule), or the audit gate is aspirational. Pick one: gate 0.1 on step 0 + Tier 1 only, and move Tiers 2–3 to 0.2+.

### 1.21 Audit throughput extrapolated from a best case

> `issue-339.md`: "a seat's packet is about 500 KB, roughly 12,000 lines, and the fix-round audit read 40,000 lines in eight packets in an evening" → "About twenty packets a seat" for Tier 1.

Reading is not auditing. Fix-round audits read scoped diffs with fresh context; Tier 1 reads 121k lines of product + QA tooling cold, writes findings, proves each behavioral claim on the VM ("every finding that claims a behaviour is proven on the VM before it is a punch item"), files a punch-list issue, and resolves each through Phase 7. The plan counts packets, not proofs, fixes, re-proofs, or register rows. Twenty packets a seat is ~2.5 "evenings" of reading and 3–6 weeks of audit-to-fix elapsed with one assistant stream. Tiers 2–3 double that. "Gradually over the fork's `0.0.x` releases" is doing a lot of work with no schedule.

---

## 2. Risks, ordered by expected cost

Expected cost = probability × cost if it lands. "Named" means #338 names it as a risk with a mitigation, not merely mentions it.

| Rank | Risk | P | Cost | Expected | Named? |
|------|------|---|------|----------|--------|
| R1 | Updater/release cutover strands or bricks the upgrade path | H | H | **Very high** | No — "updater pointed at the fork's own releases" is a checkbox |
| R2 | No merge cadence → silent drift, then unmergeable wall or missed device/security fixes | H | H | **Very high** | No — "merged on" with no cadence, owner, or proof |
| R3 | 0.0.1 ships saying ROCKNIX somewhere player-visible (incomplete rename / ES+distro skew) | H | M–H | **High** | Partly — counts given, completeness unproven |
| R4 | Cloud-folder migration loses or forks user saves | M | Very high | **High** | No — "read both" with no design |
| R5 | Build estate is one box with no backup/provisioning automation; loss = weeks | M | H | **High** | No — second box discussed, backup never |
| R6 | Device matrix + per-action yeses make 0.0.1 unprovable on hardware in reasonable time | H | M | **High** | Partly — "devices on a yes" with no matrix |
| R7 | Assistant token/SSH/mail compromise or mis-post; impersonation; secret leak | M | H | **High** | Partly — 0600 + masks, but failure already recorded |
| R8 | CI split (hosted + self-hosted) gives red builds or false green (KVM/GPU/disk/artifact) | H | M | **Medium-high** | Partly — "measured once" |
| R9 | Scope collision: rename + audits + runner + silent boot + site compete; nothing lands | H | M | **Medium-high** | No — treated as parallel checkboxes |
| R10 | Licence/attribution gap (CC BY-NC-SA wording, GPL source offer, non-commercial list, OFL notice) forces re-release | M | M–H | **Medium** | Partly — attribution line promised, wording absent |
| R11 | Org/account lockout, token expiry, domain/hosting lapse | L–M | H | **Medium** | Partly — expiry recorded, recovery not |
| R12 | Splash/artwork/spec mismatch across panels (640×480 vs 1280×960, whole-pixel snap) | M | L–M | **Low-medium** | Yes — spec exists, needs proof |

### R1 — Updater and release channel (not named as a risk)

`issue-337.md`: "the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there." `issue-338.md` Phase A: "the updater pointed at the fork's own releases."

What is missing:

- What URL, what POST body, what response shape? Is it GitHub Releases API, a static file, or a ROCKNIX-owned endpoint that must be replaced? No script path, no before/after diff.
- How does a ROCKNIX RC2 device become a rasteratops 0.0.1 device? OTA from ROCKNIX channel (impossible — you don't own it), manual `.update` tar via `scp` + reboot (per `CLAUDE.md`), or reflash? If manual, the "upgrade path keeps ROCKNIX-era state" rehearsal must prove `/storage` + settings + saves + cloud creds survive a channel hop. If reflash, the updater is irrelevant for 0.0.1 and the plan should say so.
- Rollback: if 0.0.1 fails to boot, does the device fall back? Is there a last-good slot? `issue-335.md` mentions "the last-good settings" as a small PR — is that in RC2? Unclear.
- Signing and `.sha256` convention: `issue-334.md` notes "the release page and its `.sha256` convention (the fork has this already, `maxengel/rocknix`'s releases)" — but now the repo is `rasteratops/distribution`; do old `.sha256` URLs redirect? Does the updater verify? What key?
- `gh release view <tag> --repo <the fork> --json body` reading the attribution sentence (`issue-335.md` Prong 2) is a fine check, but no check verifies the updater actually consumed that release on a booted image.

This is the highest expected cost because a wrong updater URL ships a device that can never update again without manual intervention — a silent brick of the fleet.

### R2 — Upstream drift and merge cost (not named)

`decision-register-fork-rows.md` D-WORKFLOW-084: "`upstream/next` is merged on for the hardware work." `issue-336.md`: runner "is a package, a launcher rule and interface pages -- none of it touches a kernel, a bootloader, a device tree, a quirk or Mesa."

True today, misleading tomorrow:

- The fork's overlay is +79,181 lines on distribution roots and +42,180 on ES (`issue-339.md`). Every `upstream/next` merge touches files the fork also touches (launcher, RetroArch recipes, ES `GuiMenu.cpp`/`ApiSystem.cpp` per D-WORKFLOW-080). "Paths stay" does not prevent content conflicts.
- No cadence: weekly merge with `vm-qa`? Per-release merge? Who owns conflicts — assistant proposes, maintainer approves? What proves a merge (build + boot + time-to-play + upgrade rehearsal)? Without this, the rational behavior is to defer merges until a device breaks, at which point the merge is huge.
- Container drift: `issue-334.md`: build container `ghcr.io/rocknix/rocknix-build` is "public, usable, not ours to keep current." If upstream bumps the container (toolchain, sysroot) and the fork doesn't follow, builds diverge silently. If the fork follows, every device rebuilds. No pinning policy.
- ES fork drift is worse: `issue-336.md` admits interface divergence makes upstream ES changes harder to merge. With 42k lines of fork-owned UI, the ES merge is already the expensive one. No ES merge cadence either.

Price this as 0.5–1 day per distribution merge + 1–2 days per ES merge, monthly at minimum, or admit the fork is hard-pinning to RC2's `upstream/next` commit and accepting stale hardware support.

### R3 — Incomplete rename / ES+distro skew

See 1.2–1.3. Additional skew risk: Phase A spans two repos (distribution + ES fork) plus a third (splash fork) with pins:

- `projects/ROCKNIX/packages/ui/emulationstation/package.mk` pins ES by commit (`CLAUDE.md`: "see ... for the extra build steps"; `packages/README.md` rule: "Pin git sources with the full commit hash in `PKG_VERSION`").
- `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk` pins splash by commit.

0.0.1 requires: ES fork commit with new strings/logo → distribution commit bumping ES pin + splash pin + DISTRO + updater → four image builds from that head. If any pin lags, the image boots with mixed identity. The plan lists no pin-update order, no "all pins from one head" check, and no squashfs grep gate.

### R4 — Cloud folder migration (not named as data-loss risk)

See 1.4. Add `CLAUDE.md`'s `--delete-excluded` warning and `issue-335.md`'s sizes (cloud scripts +14,468 lines). A one-line default change in 14k lines of sync logic, unproven against a populated remote, is the highest-severity tail risk in Phase A. Keep `/ROCKNIX` as the default for 0.0.1 and move the rename to a dedicated migration release with a dry-run, a backup, and a rollback. The player never sees the cloud path except in one sentence; the cost of waiting is one string.

### R5 — Single build box, no backup, no provisioning automation

Serval: "24 cores, 60 GB, a 4 TB volume with about 2 TB free" (`issue-338.md` comment), "3.6 TB volume with 2 TB free" (later comment — already inconsistent by 400 GB). Holds: primary checkout + worktrees, 4× build roots (110–147 GB each), 38 GB source cache, kept images, tokens (`~/.config/rasteratops/github-token`, `mail-token`), SSH keys (`~/.ssh/rasterabot_ed25519`), mail venv, splash drafts in `/workspace/tmp/`.

Nowhere does the corpus mention: filesystem snapshots, off-box backup, encrypted token backup, `~/.ssh/config` backup, source-cache mirror, or a build-box blueprint script. The second Tiny is "identically provisioned boxes ... provisioned the same way from the estate's build-box blueprint (`/workspace` on the 4 TB volume, the container, the source cache, the worktree layout)" — but that blueprint does not exist as a file; it is a parenthetical. If serval's NVMe dies, the recovery is: reinstall OS, re-pull container, re-clone, re-download 38 GB of sources (some pinned to commits that may have vanished upstream), re-mint tokens, re-generate SSH keys (invalidating the old ones on GitHub), rebuild four colds. That is a week, not a day.

Second box before backup is buying a second bucket with a hole in the first.

### R6 — Device set and QA fleet vs per-action yeses

Phase A promises "the four images from one head" and "the devices on a yes." Which four? The corpus names RG35XX SP, RG SP, RG353M, Nova, plus GENERIC_X64/VM (`issue-337.md` art spec). That is five. `issue-339.md` Tier 2 says "quirks for the four devices" — same ambiguity.

`CLAUDE.md` binds every device touch: "Nothing runs on one without a per-action yes: not a reboot, not a game launch, not injected input, not a screenshot, not a sync or upload, not a deletion ... A general offer of device testing is not a standing yes; each test is asked for by name." Plus flashing runbook overhead per device.

Four devices × (flash + boot + splash frame + info screen + updater check + upgrade rehearsal + time-to-play spot) with per-action yeses is not a checkbox; it is an evening per device with the maintainer present. One maintainer with a music-server NUC they refuse to repurpose and a second Tiny not yet ordered cannot sustain that per 0.0.x. Define the 0.0.1 device matrix explicitly (I recommend GENERIC_X64 only — see §3) and put the handhelds on a slower train.

### R7 — Assistant's role, privilege, and the mail inbox

What is good: fine-grained token scoped to org repos, 0600 files, never printed, SSH alias `github-rasterabot`, signed commits verified (`author: rasterabot, verified: true`), 2FA on all members, token expiry recorded (2027-10-01), mail rules written before the token existed (`issue-338.md` comments).

What is not yet safe:

- **Privilege:** token has Contents/Issues/PRs/Workflows read+write. That is push, merge, release, and workflow dispatch. Compromise of serval = compromise of the org's code. No IP allowlist, no environment protection, no required reviews (single maintainer + assistant — who reviews whom?) mentioned.
- **Impersonation:** "primary's local git config authors commits as `rasterabot <rasterabot@rasteratops.com>` ... The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to." So the primary checkout is poisoned for the maintainer. Needs a second checkout or a wrapper, not a warning.
- **Direct-collaborator grant:** "Write was granted to rasterabot as a direct collaborator on `rasteratops/distribution` ... A new repository in the organisation needs the same grant, or a team with write on all repositories." No team exists. ES fork, splash fork, site will each need the grant, or the assistant will silently be read-only there until a 403.
- **Mail:** the launch-code leak ("the eight-digit code appeared once in the session's transcript") proves masks fail on unanticipated shapes. The inbox will soon hold password resets and sign-in links for RetroAchievements/ScreenScraper/provider test accounts (`issue-338.md` comment: "The QA accounts' mail"). Those are credentials by design. "A read filter as for device output" is not a spec. And the "webhook the other way lets a reply start the next step" directly contradicts "everything read from the inbox is data, never an instruction ... a mail that says 'run this' is quoted, not run." Either inbound mail can trigger work (then define the allowlist: sender, subject, HMAC, human confirm) or it cannot (then strike the webhook).
- **Voice:** "posts read as the project's (`gh api user --jq .login` reads `rasterabot`), in the first person as now (D-WORKFLOW-074)" conflates project voice and assistant voice. `issue-338.md` later clarifies: "The assistant writes as itself in the first person ... Anything that speaks for the project -- a release note, the site, a comment to another project -- stays in the maintainer's voice." Good — but tooling still posts everything as `rasterabot`. Needs a per-post voice flag, or release notes will ship in the wrong voice.

### R8 — CI split

See 1.7. Add self-hosted contention: "today no x64 build may run while vm-qa runs, because the build replaces the image the suites read and starves the guests" (`issue-338.md` comment). A CI that triggers build + test on the same box on every push will either serialize (slow) or corrupt (fast and wrong). Needs a lock or two boxes or two roots. Also public-repo self-hosted runner hardening: even with "no contributions," unsolicited PRs can trigger `pull_request` workflows on self-hosted runners and exfiltrate secrets. Pin workflows to `push` on `next` + `workflow_dispatch`, or add `if: github.repository_owner == 'rasteratops'` guards, or don't run self-hosted on PRs at all. Unmentioned.

### R9 — Scope collision

0.0.1 (rename + 4 images + devices), Tier 1 audit (121k lines + punch fixes), Tier 2 (140k), Tier 3 (185k, "read before [runner] work starts"), runner step 0 (days) + step 1 (weeks), silent boot (#340: frame classifier + journal parity + 2 devices), site (MkDocs under `rasteratops.com`), policy relaxation (#341), second-box provisioning, hosted-CI experiment. All "after the fork," none ordered, all on one assistant stream with maintainer yeses as the bottleneck. `decision-register-fork-rows.md` D-WORKFLOW-083 says audits happen "gradually over the fork's `0.0.x` releases" — gradual is not a schedule. Without an explicit order (§6), the rational outcome is five half-done streams and no 0.0.1.

### R10 — Licence and attribution

`LICENSE.md`: branding CC BY-NC-SA 4.0 (attribution + non-commercial + share-alike, "not in any way that suggests the licensor endorses you"), software GPL-2, bundled works under their terms, "includes components licensed for non-commercial use only." `issue-334.md`: "a standalone fork that still boots with the ROCKNIX logo, calls itself ROCKNIX and updates from ROCKNIX's release page is inside 'suggests the licensor endorses you'"; clean shape is own name/logo/splash + "a fork of ROCKNIX, itself a fork of JELOS."

Gaps:

- Attribution wording does not exist yet. `issue-335.md` Prong 2 requires "`gh release view <tag> --repo <the fork> --json body` reads the sentence, in the wording the register row that adopts it records" — no such row exists. `issue-338.md` Phase A says "with the attribution line, in the maintainer's voice" — voice without text.
- GPL-2 source offer: public repo at the release tag + pinned submodules + container digest + `PKG_VERSION` full hashes (`CLAUDE.md`) must equal the shipped image. No release checklist verifies `BUILD_ID`, tag, ES pin, splash pin, container digest, and `sources/` manifest are recorded together.
- Non-commercial components: which? If any image includes them, any future monetization (even Patreon "for the work") needs a licence review. `issue-337.md` struck sponsorships, but the maintainer mused "If at some point I wanted a Patreon or something, I could do that." List the components now.
- OFL (Tiny5 Duo): "an image rendered with it carries no obligation" (`issue-337.md`) — but generating `svg_paths[]` from the BDF bitmap and compiling it into GPL splash may be a derivative of the font program, not a rendered image. Keep the OFL notice with the splash fork regardless; it costs one file.
- Headers: `CLAUDE.md`: "Preserve upstream JELOS/LibreELEC copyright headers and add a ROCKNIX line." Fork rule needed: keep JELOS/LibreELEC + ROCKNIX lines, add rasteratops line for modified files. Unwritten.

### R11 — Org, accounts, domain, hosting

Token expiry 2027-10-01 recorded — good. Missing: org recovery codes location, `pixelelated` role (owner? lockout? maintainer's alt?), rasterabot authenticator secret location ("lives with the maintainer" — where? password manager? sealed envelope?), what happens if the maintainer loses the authenticator (lockout owner procedure?), domain `rasteratops.com` registrar/expiry/auto-renew (maintainer's domain per `issue-338.md` 04:39 comment — verified only as mail domain, not ownership/expiry), Hostinger plan limits (mailbox quota? API rate? what happens when trial/welcome period ends?), GitHub PAT policy re-approval on new repos.

Low probability each, high cost when one fires on release day.

### R12 — Splash spec vs panels

Spec is solid (`issue-337.md`: 32×20 animal grid, 57–58×6 wordmark, 64×32 canvas, whole-number scale, 6× on 640×480, 12× on Nova). Risks: wordmark width reported as both 58×6 and 57×6 in adjacent comments (off-by-one = off-center); splash renderer's "hard-coded 1284:500 aspect" + float scale needs the promised two one-line changes (own box + floor to whole number) — uncommitted; Nova is "exactly twice the others" only if 1280×960 panels never scale differently under sway/KMS; backlight flash/vendor logo before kernel is out of OS control (`issue-340.md`). All fixable, all need a frame per panel size, not a PNG preview on a laptop.

---

## 3. What I would change: phases, order, gates, scope; what to cut from 0.0.1

### Order is wrong: harden → prove release machinery → rename → devices → direction

#338 orders A (identity) → B (org/repos) → C (CI) → D (box) → E (council), then implies audits + runner + silent boot follow. That puts the most visible change first and the load-bearing machinery last.

I would run: **estate integrity → release engineering → minimal rename on one image → devices → audits/runner/silent-boot in explicit sequence.** Rationale: you cannot prove a rename without a trustworthy builder, a working updater, and a merge cadence; you cannot sustain devices without a second prover or a reduced matrix.

Concrete changes:

| #338 as written | Change to | Why |
|---|---|---|
| Phase A: 4 images, VM + rehearsal + devices, cloud rename, site implied | **0.0.1 = GENERIC_X64 only**, VM-proven, cloud default unchanged, site deferred | De-risks updater + DISTRO split on the cheapest image; devices follow as 0.0.2+ per-device releases |
| Phase B: transfer 3 repos, sweep, CONTRIBUTING | **Split B into B1 (harden org) → B2 (transfer remaining) → B3 (triage policy)**; create team `rasteratops/build` with write on all repos, grant rasterabot via team, document lockout + recovery codes | Fixes per-repo 403s, lockout ambiguity, unsolicited-PR queue |
| Phase C: hosted suites + VM experiment + self-hosted builds | **Self-hosted only for 0.0.1 gating; hosted experiment explicitly non-gating with published numbers**; add build/test mutex on serval | Prevents false green from GPU-less KVM and build/test corruption |
| Phase D: decision, not purchase | **Decide now (second Tiny is already "settled"), but gate order on backup + blueprint existing**; publish `du` table, order spec, provisioning script | Backup before second box; no blueprint = no order |
| Phase E: council before Phase A | **Acknowledge gate breach; re-gate remaining**: no `distributions/rasteratops/` commit, no updater flip, no `0.0.1` tag until council report applied | Honest gates beat retrospective ones |
| Audits Tiers 1–3 "gradually" + gate 0.1 on all | **Tier 1 only before 0.1; Tiers 2–3 scheduled for 0.2/0.3; provenance table scoped to carried patches first** | Unblocks step 0; matches "gradually" with dates |
| Runner step 0 + step 1 + bridge as one direction | **Step 0 (RetroArch under ES socket) is 0.1; step 1 (fresh runner) is 0.2+ spike with exit criteria; bridge is research, not roadmap** | Prevents 3–5k-line "glue" from swallowing 0.1 |
| Silent boot + site unscheduled | **Both after 0.0.1 devices; site is docs release, not OS release** | They share zero code with rename; sequencing is free |

### Cut from 0.0.1 (move to 0.0.2+ or 0.1+)

1. **Handheld images.** Ship `0.0.1-generic-x64` first. Each handheld becomes `0.0.1-h700`, `0.0.1-nova`, etc., or fold into 0.0.2. Cuts 3 cold builds, 3 flash walks, and 3 panel proofs from the critical path.
2. **Cloud-folder rename.** Keep `/ROCKNIX` default; change only the sentence if it must not say ROCKNIX — better, keep the sentence too and file the migration as its own issue with a dry-run design. Cuts data-loss tail risk.
3. **Site.** `rasteratops.com` MkDocs is independent of the image. Ship when pages are renamed; do not gate the OS on DNS + theme.
4. **Silent boot (#340).** Requires frame classifier + journal parity + 2 devices. Valuable, orthogonal, weeks. 0.2+.
5. **Runner beyond step-0 design.** Step-0 protocol design (socket verbs) can proceed in parallel as a doc; no code lands before 0.0.1 tags.
6. **Audit Tiers 2–3.** Tier 1 punch list is the 0.0.x fix list; Tiers 2–3 start after 0.0.1 devices prove.
7. **Hosted VM CI gating.** Experiment runs, numbers publish, no gate moves until numbers meet thresholds (§6).
8. **Code-level rename.** Already deferred by D-WORKFLOW-085 — keep deferred, and add `NAMING.md` in 0.0.1 so the tree states the split.
9. **Second-box provisioning.** Order can proceed, but 0.0.1 must not wait for it. One box + one image + mutex is enough.

### Keep in 0.0.1 (minimal, provable)

- `distributions/rasteratops/` (options, version `0.0.1`, logo placeholder, kernel_options, config/functions) + `NAMING.md` + header rule.
- Splash fork with Tiny5 Duo wordmark (no animal yet — animal is art, wordmark is identity) + recipe pin + whole-pixel fix.
- ES fork minimal: info screen, theme logo text, two strings (or fewer — prove by squashfs grep), version.
- Updater pointed at `rasteratops/distribution` releases + `.sha256` + attribution line + release notes.
- `/etc/os-release` + `DISTRONAME` + `OS_VERSION` coherent.
- GENERIC_X64 image from one head, vm-qa PASS, upgrade rehearsal from RC2 PASS (storage + settings preserved), frame proof.
- Org hardened, team created, CONTRIBUTING + PR template + SECURITY + triage canned replies.
- Merge cadence + container pin recorded as register rows.

---

## 4. What is missing entirely

1. **Backup and disaster recovery.** No snapshot, off-box copy, token/SSH recovery, source-cache mirror, or restore test. Needs: encrypted backup of `~/.config/rasteratops/`, `~/.ssh/`, org recovery codes, registrar credentials; `rsync`/`restic` of `sources/` + `release/`; restore drill on the second Tiny as its provisioning test.
2. **Release engineering checklist.** No definition of a release: tag format (`0.0.1` vs `v0.0.1` vs `0.0.1-generic-x64`?), `BUILD_ID`/`BUILD_DATE` handling, `TARGET_IMG` manifest, ES/splash/container pins recorded, `.sha256` generation, `gh release view --json body` attribution grep, updater smoke on booted image, rollback story. `tools/fork-publish-release` exists (`issue-337.md`) — its 0.0.1 inputs/outputs are not specified.
3. **Merge cadence and merge proof.** No schedule, owner, conflict policy, or suite. Needs: e.g., "track `upstream/next` monthly, ES fork monthly offset by a week; merge proves with GENERIC_X64 build + boot + vm-qa quick + time-to-play delta <10%."
4. **Container pinning.** `ghcr.io/rocknix/rocknix-build:latest` is floating (`CLAUDE.md`: `make docker-image-pull`). Pin by digest per release, record digest in release notes, define bump procedure. Otherwise "four images from one head" is false — the toolchain is a fifth input.
5. **Device support matrix.** No table of supported devices, kernels, bootloaders, quirks, panel sizes, test owners, and EOL. "Four devices" is not a matrix. Needs one row per device with `DEVICE`, `ARCH`, kernel, quirk files, panel, yes-owner, last-proven release.
6. **Issue/PR triage policy.** No SLA, labels, canned close for unsolicited PRs, security contact, or spam handling. "No contributions" without this is an open queue with no owner.
7. **Licence artifacts.** No attribution sentence text, no non-commercial component list, no GPL source-offer statement, no OFL notice in splash fork, no header rule for new files. All promised, none written.
8. **Domain/DNS/hosting inventory.** `rasteratops.com` ownership, registrar, expiry, auto-renew, DNS host, Hostinger plan/quota/API limits, mailbox retention. Mail as "delivery mechanism for long jobs" needs quota + retention + failure alerts.
9. **Cost and time ledger.** No running table: Tiny #2 ($2,000 + 4 TB NVMe), Hostinger plan, GitHub (free org? Actions minutes? artifact storage?), Vultr if ever, maintainer hours per release. One maintainer + assistant needs a budget to say no with.
10. **Assistant boundaries.** No written delegation: what rasterabot may merge/release without a yes, what needs maintainer approval (releases, updater flips, cloud migrations, device flashes — the last already requires yeses per `CLAUDE.md`, the others don't). "Mail goes only to the maintainer unless the maintainer names another recipient" is a start; code/release authority is missing.
11. **Mail threat model.** No allowlist for inbound triggers (contradiction noted in R7), no retention/deletion policy for credential-bearing mail, no phishing drill, no separation of QA-account mail from human mail (folders? filters?).
12. **Provenance table scope.** `issue-339.md` demands "one row per patch, with the count of rows equal to the count of patch files in the tree" — for 525k lines of patches. No tooling, no owner, no sampling strategy. Needs scoping: carried/forked patches first, upstream-merged by reference.
13. **Time-to-play regression gate.** `time-to-play.md` (D-CLOUD-098 per `CLAUDE.md`) says launch latency is measured on every image. No threshold in #338: is +5% a fail? +100 ms? Without a number, the runner comparison ("1.05 s from press, 2.03 s from exit" per `issue-336.md`) is trivia.
14. **Upgrade vs clean-install matrix.** `CLAUDE.md`: "Before publishing, check both the upgrade path (a device keeping its `/storage`) and a clean install." #338 names the rehearsal but not clean-install proof, nor which `/storage` fixtures (empty, RC2-populated, cloud-linked).
15. **Forgejo/JJ future.** `issue-337.md` notes the estate already runs a Forgejo and `Jujutsu's push does not run git hooks`. If that move is even possible, the push-guard logic must be CI-portable now, not later. No acceptance criterion for host-agnostic tooling.

---

## 5. Questions only the owner can answer

Each blocks a concrete decision or gate. I assume the settled items stay settled.

| # | Question | Decision it unblocks | Why only the owner |
|---|---|---|---|
| Q1 | For 0.0.1, keep cloud default `/ROCKNIX` or migrate to `/rasteratops`? If migrate, copy-then-verify-then-delete with dry-run, or dual-write? | Phase A scope + data-loss risk acceptance (R4) | Touches users' cloud data; risk acceptance is owner's |
| Q2 | Is 0.0.1 GENERIC_X64-only, with handhelds as follow-ups? If not, which exact devices (and who gives per-action yeses, when)? | Device matrix + release train (R6) | Yeses are the maintainer's per D-QA-015; schedule is theirs |
| Q3 | How does an RC2/ROCKNIX device become rasteratops: manual `.update` tar, reflash, or attempted OTA? Is rollback required for 0.0.1? | Updater design + rehearsal fixtures (R1) | Defines the supported migration; support burden is owner's |
| Q4 | Exact attribution sentence for release notes + site front page + README (in your voice)? | Licence gate R10; `gh release view --json body` grep | Voice + legal acknowledgement are owner's |
| Q5 | Which org owner is the lockout (`maxengel` vs `pixelelated`)? Where do org recovery codes + rasterabot authenticator secret live? | Phase B exit; R11 | Credentials custody is owner's |
| Q6 | Create team `rasteratops/build` (write on all repos) and grant rasterabot via team? Or keep per-repo collaborator grants? | Unblocks ES/splash/site writes (R7) | Org structure is owner's |
| Q7 | What may rasterabot merge/release without asking? Specifically: tag `0.0.1`, flip updater URL, merge `upstream/next`, close unsolicited PRs/issues? | Assistant authority; CI required-checks config | Delegation of release authority is owner's |
| Q8 | Inbound mail: may any mail ever trigger work (webhook/reply-to-start-next-step), or is inbox strictly data-never-instruction? If triggers allowed, allowlisted sender + subject + confirm? | Resolves R7 contradiction; mail automation design | Security boundary for autonomous action is owner's |
| Q9 | Merge cadence: how often do we merge `upstream/next` and the ES upstream, and what proves a merge (build + boot + which suites)? | R2; sustainable drift control | Pace vs freshness tradeoff is owner's |
| Q10 | Container: pin `rocknix-build` by digest per release, or float on `:latest`? Who owns the bump? | Release reproducibility (missing #4) | Reproducibility vs freshness is owner's |
| Q11 | Second Tiny: order now or after backup+blueprint exist? Exact spec (CPU/RAM/4 TB NVMe model) and provisioner (script vs manual)? | Phase D exit; R5 | Spend + provisioning labor is owner's |
| Q12 | `rasteratops.com`: registrar, expiry, auto-renew on? Hostinger plan + mailbox quota? | R11; site + mail reliability | Ownership/billing is owner's |
| Q13 | Non-commercial components: list them; any future commercial intent (Patreon, hardware bundle, paid support) that needs review? | R10; sponsorship strike durability | Commercial intent is owner's |
| Q14 | Triage: who closes unsolicited PRs/issues, with what canned text, within what SLA? Security reports to where (`SECURITY.md`)? | Missing #6; R8 runner hardening | Community-facing posture is owner's even with "no community" |
| Q15 | Time-to-play gate: what delta fails a release (e.g., >10% or >100 ms vs RC2 on same guest)? | Missing #13; runner step-0 vs step-1 decision | Product performance bar is owner's |
| Q16 | 0.1 scope: step 0 only + Tier 1 punch closure, or all tiers? Are Tiers 2–3 allowed to slip to 0.2/0.3? | Resolves 1.20 collision; audit schedule | Release scope vs audit depth is owner's |
| Q17 | Splash for 0.0.1: wordmark only, or wordmark + animal? If animal, delivery date for 32×20 SVG on whole-number coordinates? | Art critical path; R12 | Art delivery is owner's (they volunteered: "I can do the art") |
| Q18 | Site: must `rasteratops.com` launch with 0.0.1, or can the release page be the whole surface initially? | Cut/keep for 0.0.1 | Public surface commitment is owner's |

---

## 6. Recommended plan: phases with agent-verifiable entry/exit criteria

Conventions: every exit is a command, file, or measurement an agent can run. `PASS` means the tool's own pass line, not "looked fine." Frames are PNGs at the panel's size (640×480, Nova 1280×960) under `docs/qa-frames/<release>/`. Builds record `BUILD_ID`, tag, container digest, ES pin, splash pin.

### P0 — Estate integrity and release engineering (before any rename commit)

**Entry:** `rasteratops/distribution` exists on `next` at RC2's tree (`69e6039f8f` per D-WORKFLOW-084); serval is the builder.

**Work:**

- Write `docs/rasteratops/release-checklist.md` (tag format, pins, `.sha256`, attribution grep, updater smoke, upgrade + clean-install matrix).
- Write `docs/rasteratops/merge-cadence.md` (distribution monthly, ES monthly offset; merge-proof suite).
- Pin container by digest; record in checklist.
- Backup: encrypted copy of `~/.config/rasteratops/`, `~/.ssh/rasterabot_*`, `~/.ssh/config` snippet; `restic`/`rsync` of `sources/`; org recovery codes location recorded (not the codes).
- `du` table per device root + `sources/` + `target/`; publish in #338.
- Triage policy + `SECURITY.md` + canned replies; workflow hardening for self-hosted runners.

**Exit (all must read true):**

- `cat docs/rasteratops/release-checklist.md docs/rasteratops/merge-cadence.md` exist and are linked from `CONTRIBUTING.md`.
- `docker inspect --format='{{.RepoDigests}}' ghcr.io/rocknix/rocknix-build:latest` digest recorded in checklist for this release line.
- `ls -l ~/.config/rasteratops/github-token ~/.config/rasteratops/mail-token` are `0600`; `gh auth status` shows `rasterabot` active; `ssh -T git@github-rasterabot` answers as `rasterabot`.
- `gh api orgs/rasteratops --jq .two_factor_requirement_enabled` reads `true`; `gh api 'orgs/rasteratops/members?role=admin' --jq 'length'` reads `2`; `gh api 'orgs/rasteratops/members?filter=2fa_disabled' --jq 'length'` (owner token) reads `0`.
- Team exists: `gh api orgs/rasteratops/teams/build --jq .slug` reads `build`; rasterabot membership confirmed; token `push:true` on `rasteratops/distribution` via team (no per-repo collaborator).
- Backup manifest exists off-box (path + timestamp + restore command); `tools/box-check` PASS, `tools/rules-check` PASS, `tools/register-check` PASS.
- Q4, Q5, Q6, Q7, Q9, Q10, Q14 answered as register rows.

### P1 — Org hardening and remaining transfers (B done right)

**Entry:** P0 exit true.

**Work:**

- Transfer or fork ES repo → `rasteratops/emulationstation`, splash → `rasteratops/splash`, site → `rasteratops/rasteratops.org` (transfer if history/issues matter; fork if upstream-owned — record per repo why).
- Grant `build` team write on all; verify rasterabot push on each.
- `CONTRIBUTING.md` + PR template ("takes no contributions" + link to triage policy) + `SECURITY.md` on each repo; disable Sponsorships; verify no `FUNDING.yml`.
- Full `grep -R` triage for `maxengel/rocknix`, `ROCKNIX/distribution`, `ROCKNIX/emulationstation-next`: every hit labeled code (fixed) or record (kept).

**Exit:**

- `gh repo view rasteratops/emulationstation --json nameWithOwner` etc. all resolve; `gh secret list --repo rasteratops/distribution` shows `FORBIDDEN_PATTERNS` (survived transfer).
- `gh api repos/rasteratops/distribution --jq .fork` reads `true` (still in network per D-WORKFLOW-086) and issues count preserved (135 open at transfer per 05:14 comment, ± triage since).
- Grep report filed in #338 with 0 un-triaged live hits; `1633cbcac2`-style sweep commit(s) pushed and `rules-check`/`register-check` PASS.
- Q6 closed.

### P2 — Minimal visible rename, GENERIC_X64 only (the real 0.0.1)

**Entry:** P0–P1 exit true; Q1–Q4, Q17 answered; council report applied (acknowledge P0–P1 already ran).

**Work (one head, one image):**

- `distributions/rasteratops/` (options `DISTRONAME=rasteratops`, version `OS_VERSION=0.0.1`, logo placeholder, kernel_options, config/functions) + `NAMING.md` (visible vs paths, why) + header rule (keep JELOS/LibreELEC + ROCKNIX, add rasteratops on touch).
- Splash fork: wordmark-only `svg_paths[]` (146 `M x y h1 v1 h-1 z` squares per `issue-337.md`), own-box aspect + whole-number floor, recipe pin bumped.
- ES fork minimal: `OS_NAME`/info screen, theme logo text, interface strings found by grep (prove count, don't assume two), version; distribution ES pin bumped.
- Updater URL → `rasteratops/distribution` releases; `.sha256` convention verified; attribution sentence (Q4) in release body + README.
- Cloud default: per Q1; recommended keep `/ROCKNIX` for 0.0.1.
- Build GENERIC_X64 from the head; record `BUILD_ID`, container digest, ES pin, splash pin.

**Exit (0.0.1-generic-x64 gate):**

- `grep -R --exclude-dir=.git -n "ROCKNIX" target/*.img` unpacked squashfs triage: 0 un-triaged player-visible hits (report filed).
- Boot on guest d: `docs/qa-frames/0.0.1-generic-x64/boot-splash-640x480.png` shows wordmark centered; `docs/qa-frames/0.0.1-generic-x64/info-screen-640x480.png` shows `rasteratops` + `0.0.1`.
- `tools/vm-serial -- cat /etc/os-release` reads `NAME=rasteratops` (exact keys per Q4 row) and `VERSION_ID=0.0.1`; updater script `grep -F rasteratops/distribution` true.
- `tools/vm-qa` PASS line filed; upgrade rehearsal from RC2 PASS (storage + settings preserved, fixtures named); clean-install boot PASS.
- `tools/time-to-play` on same guest: press→first-frame and exit→next-first-frame within gate from Q15 vs RC2 numbers (1.05 s / 2.03 s baseline per `issue-336.md`).
- `gh release view 0.0.1-generic-x64 --repo rasteratops/distribution --json body --jq .body | grep -F "<attribution sentence>"` true; `.sha256` asset present; updater smoke on booted image fetched that release (log filed).
- `tools/box-check` 0 fail; `tools/lint-audit-artifacts` N/A (no audit yet).

Tag only when all above are true. This is 0.0.1.

### P3 — Handhelds as follow-ups (0.0.2-train, not 0.0.1)

**Entry:** P2 tagged; Q2 answered with matrix.

**Work per device:** build from P2 head + device delta only; flash per runbook with per-action yeses; splash + info frames at panel size; updater smoke; upgrade + clean-install.

**Exit per device:**

- `docs/qa-frames/<tag>-<device>/splash-<WxH>.png` + `info-<WxH>.png` at 640×480 (H700 boards) or 1280×960 (Nova).
- `tools/vm-qa` device-applicable subset PASS or explicit N/A with reason; device-facts row filed (panel controller pre-kernel behavior named per `issue-340.md` pattern).
- `gh release view <tag> --json body` attribution grep true.

Do not hold GENERIC_X64 0.0.1 for handhelds.

### P4 — Policy relaxation (#341) + CI mutex (parallel with P3, lands before runner code)

**Entry:** P1 exit true; D-WORKFLOW-087 already allows relaxing now.

**Work:** hook `pr/*` scans keep only credential + still-wanted checks; checker drafts scan/count → warnings; `fork-workflow.md` documents fork PR flow (squash-merge, one purpose per PR, issues/tools/IDs citable); build/test mutex on serval (lockfile or separate roots); hosted workflows pinned to `push` on `next` + `workflow_dispatch` with owner guard.

**Exit:**

- `tools/rules-check`, `tools/register-check` PASS; push-guard constructed-violation proofs re-run with still-refuses list filed.
- Mutex proven: concurrent `build` + `vm-qa` invocations serialize (log filed); no `pull_request`-triggered self-hosted job exists (`grep -R "runs-on: self-hosted" .github/workflows` + trigger triage filed).

### P5 — Tier 1 audit only (the 0.0.x fix list)

**Entry:** P2 tagged; Q16 answered (Tier 1 gates 0.1, Tiers 2–3 deferred).

**Work:** `code-auditor` milestone tier, both seats, Tier 1 scope (fork's 121k: cloud scripts, proxy, OS scripts, RetroArch patches, ES pages/cards/tests). Every behavioral finding proven on VM before punch status.

**Exit:**

- `docs/audits/<date>-milestone-whole-codebase-tier-1/` with six phase files + `second-opinions/` packets + `tools/lint-audit-artifacts` PASS + punch-list issue.
- Every punch item resolved through Phase 7 or accepted by register row before 0.1 (per D-WORKFLOW-083, scoped to Tier 1).

### P6 — Runner step 0 for 0.1 (RetroArch under ES socket, days, reversible)

**Entry:** P5 punch closure or explicit deferral rows; Q15 gate set.

**Work:** RetroArch menu/OSD off, `network_cmd_enable` on, ES pause page + cards drive pause/save/load/screenshot/quit over one small protocol; launcher writes RetroArch config as now; RetroArch menu kept reachable from one row for uncovered settings (per `issue-336.md`).

**Exit on same guest:**

- Three 2D cores + one GLES core (e.g., SNES + N64 per `issue-336.md` version-1 note) launch from ES, pause/save/load/quit via ES pages, frames filed.
- `tools/time-to-play` table: step 0 vs RC2 RetroArch, delta within Q15 gate; resident-memory delta recorded.
- Fallback proven: per-core switch to plain RetroArch with 0 player-visible breakage on merge-break simulation (pin rollback test).

0.1 tags on P5 + P6. Fresh runner (step 1) and bridge do not gate 0.1.

### P7 — Experiments and deferred work, explicitly non-gating (order after 0.1)

1. **Hosted VM CI experiment:** publish `/dev/kvm` presence, artifact transfer time for 2 GB, `vm-qa` wall time, disk high-water, GL path (llvmpipe vs fail). Gate moves only if: KVM present 10/10 runs, wall <6 h with margin, disk headroom >20%, and GPU-dependent suites marked N/A-hosted with local-only gating retained.
2. **Second Tiny provisioning:** order per Q11 only after P0 backup exists; provisioning is a script + checklist run, proven by restoring backup + cold-building GENERIC_X64 on the new box while serval runs `vm-qa` (the "one builds, one proves" shape).
3. **Tier 2 → 0.2, Tier 3 → 0.3, provenance table scoped to carried patches first** (count of rows = count of carried patch files, not all 525k lines on day one).
4. **Silent boot (#340):** frame classifier + journal parity + serial check on guest d, then RG35XX SP + Nova rows. 0.2+ candidate.
5. **Site:** MkDocs under `rasteratops.com` with attribution on front page; build log last line filed. Docs release, not OS gate.
6. **Cloud migration (if Q1 deferred):** dry-run + backup + rollback design, proven on fake provider before any default flip.
7. **Fresh runner spike (step 1):** only after P6 numbers + Tier 3 read of launch path; exit is P6-equivalent proofs + `rc_client`-via-proxy packet-diff + offline-queue walk, not "glue done."

---

### What this recommended plan preserves from #338

- Visible-first rename, paths frozen (Choice 1) — kept, but proven with a build log and squashfs grep, and documented in `NAMING.md`.
- Transfer + stay in fork network (D-WORKFLOW-086) — kept; issues are the paper trail.
- Vultr preference / GCP avoidance, GitHub for now with host-agnostic tooling where cheap — kept as preferences, not as unpriced assertions.
- `rasterabot` as machine account with scoped token + SSH + mail — kept, with team grant, voice flag, and inbox trigger rule fixed.
- Time-to-play as the measure, VM-first with reasoned no, per-action yeses, upgrade + clean-install matrix — kept and given numbers.

What it refuses: a one-day 0.0.1 covering four devices, a cloud migration, a site, and an updater flip on an unbacked-up single box with no merge cadence and three audit tiers plus a runner plus silent boot all "gradually" competing for the same stream. That plan does not fail loudly; it fails by shipping a 0.0.1 that still says ROCKNIX in the one place nobody grepped, that cannot update itself, and that nobody can rebuild after a disk failure.

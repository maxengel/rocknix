# Council Analysis, Step 1: The Rasteratops Fork Plan (#338) — Independent Adversarial Review

## 0. Corpus, Provenance, and Limits

I have no filesystem access. I treat the 11 files embedded by the Council Facilitator (`council-facilitator@1.14.0`) as my read-at-time corpus. I did **not** re-read or re-hash the files myself. The paths and `sha256 (verified at embed time)` values below are the Facilitator-computed values from the per-source headers. My `corpus.provenance.json` equivalents are `source_file_paths[]` and `source_file_hashes[]` as listed here.

| # | `path` (declared) | `sha256 (verified at embed time)` | bytes |
|---|---|---|---|
| S1 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md` | `371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba` | 35728 |
| S2 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md` | `7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2` | 15846 |
| S3 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-337.md` | `4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782` | 13885 |
| S4 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md` | `c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a` | 3947 |
| S5 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md` | `188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1` | 2216 |
| S6 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-341.md` | `433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c` | 3582 |
| S7 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md` | `cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59` | 13531 |
| S8 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md` | `7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e` | 16121 |
| S9 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md` | `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016` | 9262 |
| S10 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md` | `846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677` | 13092 |
| S11 | `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/LICENSE.md` | `61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4` | 2503 |

**Settled and not re-litigated** per the brief: the name rasteratops; no community, no contributors, no sponsorships; nothing posted to ROCKNIX for now; EmulationStation as the one interface over a libretro runner (S2); hardware support taken from upstream merges rather than done here. I critique *how* to get there, not *whether*.

**Gap I must surface:** S5 (`issue-340.md`) says:

> "**What exists today** is in the first comment (the kernel command line the bootloaders write, where the splash runs and what may draw after it, what shutdown prints)."

No comments were embedded for S5. I cannot verify the silent-boot starting point. I do not fabricate it. Every claim about silent-boot cost in this review is therefore marked unproven for lack of that baseline.

No other source I needed was missing.

### Verdict in one paragraph

The direction is right and the day's execution on org, transfer, and bot account is impressive. The *plan as written* cannot be executed as written: Phase A is not a day; Phase B is half-done and miscounted; Phase C's hosted-runner VM story is unproven and almost certainly false at the stated sizes; Phase D's decision is already made in comments but not recorded as the plan requires; Phase E's gate was already violated; the updater, merge cadence, ES/splash/site/container strategy, backup, and licence-compliance checklist are missing; and #336, #339, #340 together are an order of magnitude more work than one maintainer plus one assistant can carry in parallel with 0.0.1. Cut 0.0.1 to identity-minimal + release-channel-proven, finish B properly, defer everything else behind explicit gates.

---

## 1. Claims and Assumptions That Are Wrong, Unproven, or Contradicted

I cite the passage, then the contradicting evidence. All quotes verbatim.

### 1.1 "About a day of work plus the artwork" for Phase A

**Claim (S1):**

> "Phase A: the identity, 0.0.1 (about a day of work plus the artwork)"

**Why it is wrong:** The same source measures the work as larger than a day by its own numbers:

- S1: *"Measured 2026-09-30: the name is in 3,485 file names and 1,229 files' text on the upstream-bound roots (paths under `projects/ROCKNIX/`, scripts named `rocknix-*`, units, quirks)"*
- S1 Phase A checkbox: *"`distributions/<name>/` with `options` (`DISTRONAME`), `version` (`OS_VERSION=0.0.1`), the logo, `kernel_options`, `config/functions`; the boot splash and the theme's logo text as the fork's own artwork ... the two interface strings and the eleven script lines; the cloud folder's default name ... the updater pointed at the fork's own releases."*
- S1 Phase A proof: *"A GENERIC_X64 image boots under the name with its splash (a frame on guest d), `/etc/os-release` and the info screen read it; the four images from one head; vm-qa, the rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state), the devices on a yes."*
- S3 makes the same "about a day" claim and then lists the same multi-day tail: *"then the four images rebuilt from one head, the VM suites and the rehearsal, and the devices on a yes."* (S3, comment 2026-09-29T23:46:56Z)

S1's own build timing contradicts "a day":

- S1, comment 2026-09-30T00:09:32Z: *"a cold rebuild of four devices is a day on one box, half on two"*
- S1, same comment: *"today no x64 build may run while vm-qa runs, because the build replaces the image the suites read and starves the guests."*

Four cold builds (required after a `distributions/<name>/` + splash-pin + theme change — see S10: *"Script-only changes (e.g. `scripts/mkimage`) do **not** trigger an image rebuild — delete `build.*/.stamps/image/build_target` first."* — identity changes are worse, they invalidate version stamps) plus vm-qa plus rehearsal plus per-action device yeses (S10: *"Nothing runs on one without a per-action yes: not a reboot, not a game launch, not injected input, not a screenshot, not a sync or upload, not a deletion"*) cannot fit in a day even before artwork iteration. The splash alone requires a new repo fork (S3, comment 2026-09-30T01:38:52Z: *"Phase A forks that repository into the organisation, replaces its image with the wordmark, and points the recipe at the fork's commit."*) plus the renderer's two one-line fixes (S3, comment 2026-09-30T02:03:12Z).

**Impact:** 0.0.1 scheduling, maintainer expectations, and Phase E gating all rest on this estimate. Replace with 3–5 days minimum (art + fork + 4 builds + VM + rehearsal + device yeses), longer if the updater endpoint is new.

### 1.2 "The player-visible identity changes completely" with 2 strings + 11 lines

**Claim (S1):**

> "The proposal: the player-visible identity changes completely (the name, the splash, the logo, the version, the strings, the release names, the site, the updater's address), and the internal paths and script names stay as upstream has them, with a `NAMING.md` that says so and why."

> "and in exactly this much a player reads: `DISTRONAME`, `/etc/os-release`, the info screen, the boot splash, the logo, two interface strings (`ENABLE ROCKNIX SCREENSHOT`, the cloud folder sentence naming `/ROCKNIX`) and eleven printed lines in the scripts."

**Why it is unproven and almost certainly incomplete:**

1. No inventory is filed. "Two" and "eleven" are asserted without file:line lists. S10's vocabulary and player-language rules show how many surfaces carry words: *"Clarity, then brevity, then sized to the space for every string a player reads"* (S10). A player who opens a terminal, reads a log, lists `/storage`, pairs Bluetooth, joins Wi-Fi, or triggers `rocknix-evidence` (S1, comment 2026-09-30T02:53:22Z) will read `projects/ROCKNIX/`, `rocknix-*`, units, quirks, hostnames, SSIDs, update URLs. "Completely" is false by the plan's own admission that paths stay.
2. S3's earlier definition of the rename is broader: *"`distributions/ROCKNIX/` becomes `distributions/pixelelated/` (the options file's `DISTRONAME`, `OS_NAME`, the version), the update URL the updater reads pointed at the fork's own releases, the theme's logo and the splash replaced ... the device pages' names where they say ROCKNIX"* (S3). Device pages are not in S1's "exactly this much" list.
3. S10's layered config shows identity is not one file: *"options are sourced in order — `distributions/<DISTRO>/options` → `projects/<PROJECT>/options` → `projects/<PROJECT>/devices/<DEVICE>/options` → `config/arch.<ARCH>` — each layer overriding the last."* Changing `distributions/<name>/` without auditing `projects/ROCKNIX/` overrides, `filesystem/` overlays, bootloader configs, and `package.mk` `PKG_VERSION` pins that embed `ROCKNIX` in URLs is unproven.
4. Cloud folder: S1 says *"the cloud folder's default name (`/ROCKNIX` in a player's cloud today -- read both, D-WORKFLOW-050)"*. "Read both" is a design, not a proof. S10 warns: *"**Every build ships onto devices that already have state.** Before publishing, check both the upgrade path (a device keeping its `/storage`) and a clean install ... A fix that changes what we *write* does nothing for what is already written."* No migration matrix is filed.

**Impact:** 0.0.1 will boot with the new splash and still say ROCKNIX in a dozen places the plan did not count. That is both a licence risk (S11, see §2.3) and a least-surprise violation (S2, comment 2026-09-29T23:07:50Z citing D-UI-042).

### 1.3 "Two choices are flagged" — only one is

**Claim (S1, header):**

> "Two choices are flagged for the maintainer before the council sits."

**Evidence:** Only *"Choice 1 (flagged): a brand rename, not a path rename."* appears in S1. No Choice 2 is labeled. S1 Phase E repeats: *"the plan goes to the `council` skill as its packet with the two flagged choices and the numbers"*.

**Why it matters:** The missing second choice is presumably the code-level rename timing (later settled by S9 D-WORKFLOW-085: *"The rename is done in two steps, the visible identity first"*) or the transfer-vs-hard-fork (later settled by S1 comments 2026-09-30T05:02–05:14Z and S9 D-WORKFLOW-086), or the build-box shape (later settled in comments as second Tiny). A council packet that promises two flagged choices and delivers one cannot gate Phase A. The plan is stale relative to its own comments.

### 1.4 Phase B sweep: 24 vs 110 vs 15 files — all three cannot be the sweep

- S1, comment 2026-09-30T00:05:06Z: *"**Phase B's sweep, counted:** 24 files under `tools`, `.githooks`, `.claude` and `.github/workflows` name `maxengel/rocknix`, `ROCKNIX/distribution` or `ROCKNIX/emulationstation-next` and change with the transfer"*
- S1, comment 2026-09-30T05:02:07Z: *"The sweep afterwards is one token: `maxengel/rocknix` becomes `rasteratops/distribution` in 110 files of the tree, of which the `--repo` lines in the tools and rules are the ones that matter; the work logs and register rows are records and keep the old address."*
- S1, comment 2026-09-30T05:14:09Z: *"the old address is swept out of the tools' `REPO` constants, the rules, the skills, the push guard's header, the runner's example in `fork-generic-x64.yml` and both agent files (`1633cbcac2`, 15 files; `rules-check` and `register-check` pass)."*

These are three different denominators (24 scoped files, 110 whole-tree hits, 15 committed files). The plan never reconciles them, never lists the 24, never proves the 110 minus records equals 15. S9 D-WORKFLOW-086 records: *"the tools, rules, skills and guards name the new address, and the records (patch headers, the change log, audits, logs, this register) keep the old one, which redirects."* That is the right rule, but without a filed `grep -r` before/after, the claim *"the address sweep"* is done is unproven. The push guard, `issue-tracking.md`'s *"always `--repo maxengel/rocknix`"* (S1, comment 00:05:06Z), and S10's *"always `gh --repo rasteratops/distribution`"*(S10, now updated) are exactly the kind of scattered constants that survive a 15-file sweep.

### 1.5 "The three repositories transferred" — one transferred, fourth uncounted

**Claim (S1 Phase B):**

> "The three repositories transferred, not recreated ... this one (as `<org>/distribution` or the fork's own name), the EmulationStation fork, the site."

**Evidence of status:**

- S1, comment 2026-09-30T05:14:09Z: *"Read from the API after the move: the repository is `rasteratops/distribution`, still a fork of ROCKNIX/distribution, default branch `next`, 135 open issues; `maxengel/rocknix` redirects to it."* Only distribution is confirmed.
- No comment confirms ES fork or site transfer. S9 D-WORKFLOW-086 only settles: *"The fork's repository is `rasteratops/distribution`: transferred from `maxengel/rocknix`"*.
- S3 adds a fourth repo the "three" omits: *"The splash itself is a separate ROCKNIX repository (`rocknix-splash`, GPL, a small application pinned by commit in `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk`), so Phase A forks that repository into the organisation"* (S3, comment 2026-09-30T01:38:52Z). S1's sibling list in the 05:02 comment (*"`rasteratops/emulationstation`, `rasteratops/splash`, `rasteratops/rasteratops.org`"*) confirms four, not three.
- S7 adds a fifth dependency the plan never counts as a repo: *"the build container `ghcr.io/rocknix/rocknix-build` (public, usable, not ours to keep current)"* (S7, comment 2026-09-29T22:57:02Z). S10 confirms: *"make docker-image-pull # pull ghcr.io/rocknix/rocknix-build:latest"* (S10).

**Impact:** Phase B's exit criterion is false. 0.0.1 cannot be "from one head" (S1 Phase A) if ES pin, splash pin, and container digest float across orgs.

### 1.6 Org 2FA and `rasterabot` identity — contradictory and confused

**Claim (S1 Phase B header, ticked):**

> "Ticked 2026-09-30: owners `maxengel`, `pixelelated`; `two_factor_requirement_enabled` reads `true` (owner read, 05:51 UTC); `gh api user --jq .login` reads `rasterabot`; the token approved by the organisation (comment of 2026-09-30)."

**Contradicting passages in the same file:**

- S1, comment 2026-09-30T05:14:09Z: *"The organisation's two-factor requirement reads `false`."*
- S1, comment 2026-09-30T05:43:54Z: *"The organisation's requirement is still off; with every member already on it, switching it on now removes nobody."* and *"**The organisation checkbox above:** two owners, true (`maxengel`, `pixelelated`); `gh api user --jq .login` reads `rasterabot`, true; `two_factor_requirement_enabled` still reads `false`, so the checkbox stays open on that one fact."*

Either the 05:51 UTC read happened after the 05:43 comment (then the header tick is prematurely optimistic in a plan that should be append-only) or the reads disagree. An agent cannot verify Phase B exit without a fresh read.

Deeper confusion — whose account is `rasterabot`?

- S1 Phase B checkbox: *"a token for the project account `rasterabot`"*
- S1, comment 2026-09-30T02:08:29Z: *"**Yes, and it is the cleanest of the three accounts** (the maintainer's, the project's, the assistant's)"* — three distinct accounts.
- S1, comment 2026-09-30T02:09:14Z: *"Taken as the assistant's account name for Phase B"*
- S1, comment 2026-09-30T05:43:54Z: *"`gh` now holds rasterabot as its active account and maxengel second, so every tool that calls `gh` posts as the project's account"*

`rasterabot` cannot be both "the assistant's" (for true-by-construction attribution: *"A commit, comment or PR made by the assistant is visibly the assistant's"* — S1, comment 02:08:29Z) and "the project's" (for *"posts read as the project's"* — S1 Phase B). If release notes, site, and outward messages go out as `rasterabot`, attribution is false by construction. If they go out as maintainer/project, the tooling change (*"one token on the box"* — S1, comment 02:08:29Z) is insufficient; two identities need two tokens and a voice rule per surface. S6 preserves *"the first person singular in what is published"* (S6) and S1 cites *"in the first person as now (D-WORKFLOW-074)"* — first-person-singular from two authors under one login is incoherent.

The token saga further undermines "approved":

- S1, comment 05:43:54Z: *"The token first read the repository as **pull-only**: an organisation member's default permission is read, and a fine-grained token cannot exceed the account's own access. Write was granted to rasterabot as a direct collaborator on `rasteratops/distribution` with the owner account (`PUT collaborators/rasterabot permission=push`, 204); the token then reads `push: true`. A new repository in the organisation needs the same grant, or a team with write on all repositories."*
- Same comment, minutes later: *"**Correction, minutes later (05:43 UTC): the token has no access to the organisation's repository yet.** Posting this comment as rasterabot answered `403 Resource not accessible by personal access token`"*
- S1, comment 05:48:07Z: *"Token check, 2026-09-30T05:48Z: the organisation approved rasterabot's fine-grained token (expires 2027-10-01)."*

Direct-collaborator grants do not scale to four repos, and PAT approval is an org-policy step the plan did not name. The plan's single-token story is unproven for the estate.

### 1.7 Hosted-runner CI: "already run there" and "/dev/kvm" experiment

**Claims (S1 Phase C):**

> "The host-side suites (the script harness, prose, register, box, vocabulary, the page tests, `pr-stack-check`) on GitHub-hosted runners on every push -- the fork's checks already run there."

> "The VM suites on hosted runners as an experiment: Ubuntu hosted runners expose `/dev/kvm`, so `tools/vm-qa` can boot the image there if the image arrives as a release artifact (2 GB) and the run fits the six-hour limit; measured once before it is relied on."

**Why unproven:**

- "Already run there" cites `.github/workflows/fork-checks.yml` (S3, comment 2026-09-29T23:28:18Z: *"the CI (`.github/workflows/fork-checks.yml` is GitHub Actions..."*). No run URL, no suite list, no PASS line is filed in S1 to prove all seven suites run there. S10 lists no unit-test suite: *"there is **no unit-test suite**. `tools/pkgcheck <package>` is the only lint"* (S10). The fork's suites are bespoke shell; hosted runners need their deps, fonts, and `gh` auth.
- `/dev/kvm` on GitHub-hosted runners is not a guarantee; it varies by image and virtualization nesting, and the plan cites no measurement. Even if present:
  - S10: *"VM disk must be 16GB+ or first boot breaks in a way that looks like a graphics bug"* (S10). 16 GB guest + 2 GB artifact + runner OS + tools exceeds the ~14 GB free on a standard hosted runner.
  - S1's own QA shape needs *"two guests at 2 GB and one at 4 GB"* (S1, comment 2026-09-30T00:16:02Z) plus *"guest d, which draws GL through the host's GPU"* (S2, comment 2026-09-29T23:15:43Z). Hosted runners have no GPU; guest-d GL proofs cannot run there.
  - Six-hour limit is wall-clock per job, but S1's VM suites plus artifact download plus `tools/time-to-play` (S2) plus frame classification (S5) have no timing filed.
- The plan hedges with *"measured once before it is relied on"* — correct, but then Phase C cannot be a 0.0.1 dependency. It is currently sequenced as if it were.

### 1.8 Build-box numbers: 90 GB vs 110–147 GB vs ~200 GB

- S1 Phase D: *"a cold build of one device is hours and about 90 GB of root; four devices plus the source cache is about 400 GB"*
- S1, comment 2026-09-30T00:24:15Z: *"a device's build root is 110 to 147 GB, the source cache 38 GB, the kept images a few GB each -- 2 TB is the floor, 4 TB matches serval"*
- S10: *"A first build needs ~200GB disk and hours; cached rebuilds take minutes."*

90 GB, 110–147 GB, and ~200 GB cannot all size the same purchase. The difference is whether "root" means `build.*` alone, plus `sources/`, `target/`, `release/`, container layers, and ccache. S1's Vultr sizing (*"a Vultr bare-metal or high-memory instance kept up (the maintainer's preference, and technically fine: KVM, NVMe, no lock-in)"* — S1 Phase D) is therefore unpriced against an undefined denominator. The only firm numbers are serval's today: *"24 cores, 60 GB, a 4 TB volume with about 2 TB free"* (S1, comment 00:05:06Z) and *"64 GiB installed (60 GB usable, 38 GB free at the time of reading), 8 GB of swap, a 3.6 TB volume with 2 TB free"* (S1, comment 00:09:32Z).

Similarly, memory: *"More RAM (to 128 GB) removes the only limit the box has"* (S1, comment 00:09:32Z) was written before the slot discovery (*"the box has **two** memory slots and both are in use (2 x 32 GB ...)"* — S1, comment 00:12:21Z) and the Tiny correction (*"the two 32 GB modules are **DDR5 SO-DIMMs** (262-pin)"* — S1, comment 00:19:36Z) and the $2,000 price (*"it looks like it'd be about $2,000 to buy 128 gigabytes of RAM"* — S1, comment 00:22:52Z, maintainer words). The plan's Phase D checkbox still asks for *"Three shapes priced against that"* as if none of this had been decided, while the comments declare *"Then the second Tiny is the purchase, and Phase D's comparison is settled by it"* (S1, comment 00:24:15Z). The plan is stale; the decision has no register row with price and shape as Phase D requires (*"The decision as a register row, with the price and the shape."* — S1).

### 1.9 Updater "pointed at the fork's own releases" — no endpoint, no version rule

S1 Phase A: *"the updater pointed at the fork's own releases."*

S3 defines what that means and shows it is not trivial:

- S3, comment 2026-09-29T23:46:56Z: *"the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there"*
- S7: *"the update server (`rocknix-update` reads ROCKNIX's GitHub releases; a fork points it at its own), the release page and its `.sha256` convention (the fork has this already, `maxengel/rocknix`'s releases)"* (S7, comment 2026-09-29T22:57:02Z)

Missing: endpoint URL, POST body, version comparison (`OS_VERSION=0.0.1` vs `rc2-20260929` vs date-stamped file names — S3 proposes *"`0.0.1` for this cut, `0.0.x` for fixes on it, `0.1` for the first cut that carries the fork's own direction (#336's step 0), so the number says what the build is rather than when it was made -- the date stays in the file names as now."* — S3, comment 23:46:56Z), downgrade/rollback policy, `.sha256` generation, and what happens to a device on ROCKNIX-era `next` that polls the new endpoint. S1's proof — *"the rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state)"* (S1 Phase A) — rehearses RC2→RC2, not ROCKNIX→rasteratops across a `DISTRONAME` change. Unproven.

### 1.10 Splash wordmark: 58×6 vs 57×6, and "no obligation" OFL reading

- S3, comment 2026-09-30T01:40:33Z: *"rasteratops in Tiny5 Duo from the font's own BDF bitmap, 58 x 6 font pixels, scaled nine times to 522 x 54 on a 640 x 480 black canvas"*
- S3, comment 2026-09-30T02:03:12Z: *"The wordmark is not drawn: rasteratops comes from Tiny5 Duo's own bitmap, 57 x 6 cells, generated."*

58 vs 57 is a one-cell discrepancy in the artifact that becomes *"the splash's one path (146 `M x y h1 v1 h-1 z` squares in a 58 x 6 box, generated and kept beside the preview)"* (S3, comment 01:40:33Z). An agent cannot verify the splash without knowing which width is canonical.

Licence: S3, comment 01:38:52Z: *"Tiny5 (gissio), a family of 5-pixel fonts under the SIL Open Font License 1.1 ... the OFL asks only that the font files keep their notice when redistributed, and an image rendered with it carries no obligation."* That reading assumes rendering, not embedding. Phase A embeds derived path data compiled into `main.c` (`svg_paths[]` — S3, comment 01:40:33Z). Whether 146 squares traced from BDF bitmaps are a rendering or a derivative font file is unproven in the sources and needs a row, not an assertion. The safe move (ship OFL notice + source BDF reference in the splash fork) costs nothing and is not in the plan.

The splash mechanics themselves contradict "plain wordmark stands in":

- S3, comment 01:40:33Z: *"The splash application (`ROCKNIX/rocknix-splash`) draws no image file: its logo is SVG path data compiled into `main.c` (`svg_paths[]`, seven letter paths, four red and three grey) rendered by its own parser, which understands M, L, H, V, Z and cubic curves, and scales the drawing to the panel."*

A "plain wordmark" still requires forking, replacing `svg_paths[]`, fixing *"the drawing's own box instead of 1284:500, and the scale rounded down to a whole number"* (S3, comment 02:03:12Z), moving the recipe pin, and rebuilding all devices. That is not a stand-in; it is the splash fork.

### 1.11 Runner: "3–5k lines of glue," proxy "untouched," Step 0 "days"

**Claims (S2):**

- S2, comment 2026-09-29T23:12:09Z: *"Three to five thousand lines of C; every one of them glue between things that already exist."*
- Same comment: *"Our proxy sits at the HTTP layer, so it and the offline work carry over untouched -- the runner's HTTP goes to 127.0.0.1:8080 as RetroArch's does now."*
- S2, comment 2026-09-29T23:15:43Z: *"step 0, RetroArch under our interface, days"*

**Why unproven:**

1. 3–5k lines must cover: SDL2+GLES context, software texture upload, `RETRO_ENVIRONMENT_SET_HW_RENDER` framebuffer handshake with *"a way to look up GL functions, and two callbacks for when the context is made and lost"* (S2, comment 23:12:09Z), minarch's state/option handling, `rc_client` integration (*"the runner gives it a way to read the core's memory (the core exposes it), a way to send HTTP, and a call per frame"* — S2, same comment), Unix socket protocol (pause/save/load/screenshot/quit), audio, input, per-core launcher routing, ES pause page + cards, and proofs. S8 sizes comparable product work: *"the cloud scripts +14,468, the proxy package +5,183, the OS scripts +3,702, the RetroArch patches +1,244, the interface +28,359. Comments are a third to two fifths of the scripts"* (S8, comment 2026-09-29T23:20:53Z). A 3–5k estimate with no file breakdown, no core list beyond *"a SNES core and the N64 core"* (S2, comment 23:15:43Z), and no input/audio design is a guess.
2. Proxy "untouched" assumes `rc_client`'s HTTP shapes match RetroArch's rcheevos integration byte-for-byte behind `127.0.0.1:8080`. S2 lists what the fork rests on in RetroArch today: *"The offline achievements (rcheevos inside RetroArch, the proxy in front of it), the save-state manager (RetroArch's state files, the Auto slot and the launcher's state-file contract), the exit hotkey and the cards (RetroArch's exit and the stamps around it)"* (S2). None of those contracts is quoted. `rc_client` is *"an API made for frontends"* (S2, comment 23:12:09Z) — a different API means different request timing, retry, and hashing. Unproven until a packet capture is filed.
3. Step 0 "days" assumes RetroArch's UDP command interface (*"a UDP socket that takes pause, save, load, quit; `network_cmd_enable` is `false` in the shipped config"* — S2, comment 23:12:09Z) plus *"our pause page and cards drawn over the game"* (S2, comment 23:15:43Z). S2 never explains how ES draws over a separate RetroArch process under sway on GLES. Two fullscreen SDL2/GLES clients compositing is not "driving over a socket"; it is a display-server design. Without that design, "days" is unproven, and the fallback (*"RetroArch's menu kept reachable from one row for the settings we have no page for"* — S2, comment 23:15:43Z) reintroduces the disjointedness the maintainer hates: *"It has always felt disjointed to me that you're using EmulationStation to enter a game and then using libretro once you're inside the game, but have to maneuver it via RetroArch."* (S2, comment 2026-09-29T23:07:50Z).

Licence constraint tightens this: S2, comment 2026-09-29T23:25:02Z: *"**MinUI has no licence file GitHub can find**, and code with no licence is all rights reserved by default -- so minarch is a reference to read, not code to copy"*. The runner is *"written fresh either way"* — correct, but that makes 3–5k *new* lines, not glue, with no test suite (S10: no unit-test suite).

### 1.12 Review tiers: packet math and "first act" scheduling

**Claim (S4):**

> "(the `code-auditor` skill at milestone tier with both council seats, as the fix-round audits ran; a seat's packet is about 500 KB, roughly 12,000 lines, and the fix-round audit read 40,000 lines in eight packets in an evening)"

> "1. **Tier 1: what the fork wrote** -- the 121,000 lines above. ... About twenty packets a seat."

121,000 ÷ 12,000 ≈ 10 packets, not 20. Either packets are 6k lines in practice, or "twenty" double-counts both seats, or the estimate includes re-reads. No derivation is filed. Similarly Tier 2 (*"about 140,000 lines ... Twelve to fifteen packets"* — S4) and Tier 3 (*"the 185,000 lines ... Fifteen packets"* — S4) imply ~10–12k lines/packet, consistent with 10 for Tier 1, not 20. The schedule built on "eight packets in an evening" assumes the fix-round pace (narrow scope, warm context) scales to whole-codebase scope (cold context, cross-file taint, VM proofs per finding: *"every finding that claims a behaviour is proven on the VM before it is a punch item."* — S4). Unproven.

S9 D-WORKFLOW-083 refines: *"The whole codebase is reviewed adversarially, in tiers, gradually over the fork's `0.0.x` releases"* (S9). S4 requires: *"Every punch item resolved through Phase 7 before `0.1`, or accepted by a register row."* (S4). "Gradually" plus "every punch item before 0.1" plus *"the libretro work (#336) will change its launch path, so this tier is read before that work starts."* (S4 Tier 3) creates a deadlock: Tier 3 must precede #336, #336 Step 0 is *"the first cut that carries the fork's own direction (#336's step 0)"* for 0.1 (S3, comment 23:46:56Z), and all punch items must clear before 0.1. The plan sequences none of this.

### 1.13 Silent boot acceptance without a baseline

S5 requires:

> "A frame series of a full boot on guest d (from the first frame to the carousel) in which every frame is black, the splash or the interface -- a script that captures at intervals and a check that classifies each frame, its PASS line filed here with the series under `docs/qa-frames/`."

But S5's starting point — *"the kernel command line the bootloaders write, where the splash runs and what may draw after it, what shutdown prints"* — is in the missing first comment (see §0). Without it, no agent can know whether silence needs `quiet loglevel=0 vt.global_cursor_default=0`, Plymouth ordering, `getty` masking, or kernel rebuilds. S5 also requires: *"The journal of that boot is as complete as before (the same units, the same kernel lines), read after the boot; the serial console still answers `tools/vm-serial`."* Silence on panel with full journal + serial is the right goal, but the classifier ("black, splash, or interface") has no tolerance for dithering, cursor blink, or compositor fade. Unproven as automatable.

### 1.14 Policy relaxation assumes PRs still matter with no contributors

S6 proposes after migration:

> "the fork squash-merges its own PRs; the rule becomes 'one purpose per PR', which is quality, and the count is no longer refused"

But S1 Phase B requires: *"`CONTRIBUTING.md` and the PR template say the project takes no contributions; issues stay on; no sponsorship anywhere."* (S1) and S3 notes: *"a public repository cannot refuse them [PRs]; a `CONTRIBUTING.md` says the project takes none and the template says so"* (S3). With one maintainer + one assistant, "PRs" are either assistant→maintainer handoffs (then squash-merge ceremony is overhead; direct pushes to `next` with the register + work logs already provide the paper trail per S10) or unsolicited public PRs (then the template must refuse them, not describe flow). S6 keeps *"the register, the work logs, the blindspots, the ceremonies, the suites, the proofs, the first person singular ... Those are the process the maintainer trusts (D-WORKFLOW-082)."* (S6) — correct — but does not say who reviews the assistant's PRs. S9 D-WORKFLOW-082 settles: *"The fork's quality is its process -- the VM, the suites, the regression checks, the audits -- not the maintainer's line-by-line reading, and nothing is submitted anywhere under a rule that requires the latter."* (S9). A PR flow that requires maintainer review contradicts D-WORKFLOW-082; a PR flow that does not is just a branch naming convention. The plan needs to say which.

### 1.15 Licence: "honest under the licence anyway" and "in the maintainer's voice"

- S1, comment 2026-09-30T05:02:07Z: *"the 'forked from' line stays, which is honest under the licence anyway."*
- S1 Phase A: *"`0.0.1` published on the fork's release page with the attribution line, in the maintainer's voice."*

The fork-network line is GitHub UI, not a licence obligation. Honesty under S11 comes from:

- S11: *"Original software and scripts developed by the ROCKNIX team are licensed under the terms of the [GNU GPL Version 2]"* + *"Modifications to bundled software and scripts by the ROCKNIX team are licensed under the terms of the software being modified."*
- S11: *"ROCKNIX branding and images are licensed under a [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License]"* with *"Attribution: You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use."* + *"NonCommercial: You may not use the material for commercial purposes."* + *"ShareAlike: If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original."*
- S11: *"This distribution includes components licensed for non-commercial use only."*

"Maintainer's voice" cannot satisfy "provide a link to the license, and indicate if changes were made." No attribution text is drafted in any source. S7's read (*"The fork's own rule of preserving every upstream header and adding a line is the same obligation."* — S7, comment 22:57:02Z) conflicts with S10's rule (*"Preserve upstream JELOS/LibreELEC copyright headers and add a ROCKNIX line"* — S10): after the fork, does a touched file carry JELOS + ROCKNIX + rasteratops lines? Undecided. And S3's acceptance says *"the CC BY-SA attribution line"* (S3) while S11 and S7 say CC BY-**NC**-SA — dropping NC is a licence misstatement in an acceptance criterion.

The non-commercial tail matters because the maintainer mused: *"If at some point I wanted a Patreon or something, I could do that."* (S3, quoting maintainer). S3 records the strike: *"Let's strike that concept: no sponsorships here."* (S3). But "no sponsorships" does not erase *"components licensed for non-commercial use only"* (S11) if images are ever sold, bundled with paid hardware, or monetized via Patreon-exclusive builds. The plan names no component list, no commercial-use guard.

### 1.16 Phase E gate already violated

S1 Phase E:

> "Once A-D are confirmed by the maintainer, the plan goes to the `council` skill as its packet with the two flagged choices and the numbers, and the council's report is applied here before Phase A starts."

Evidence of violation:

- Phase B executed before council: org `rasteratops` id 335817768 created 2026-09-30T01:35:28Z, user `rasterabot` id 335883270 created 2026-09-30T04:42:17Z, transfer to `rasteratops/distribution` confirmed 05:14 UTC, token approved 05:48 UTC (all S1, comments 05:02–05:48Z).
- Phase A started before council: *"The interim wordmark is rendered (`/workspace/tmp/rocknix-session/splash/`, not in the tree until Phase A)"* (S3, comment 01:40:33Z) plus two triceratops drafts (S3, comment 01:41:48Z) plus art spec (S3, comment 02:03:12Z).
- Phase D decided before council: *"Then the second Tiny is the purchase, and Phase D's comparison is settled by it"* (S1, comment 00:24:15Z).

This is not blame — the maintainer said *"rasteratops it is. let me grab the GitHub org."* (S3, comment 2026-09-30T01:33:25Z, recorded as S9 D-WORKFLOW-084) and momentum is good. But a plan whose central gate ("council's report is applied here before Phase A starts") is already false cannot be followed. Rewrite the gate to match reality: council gates 0.0.1 *release*, not Phase A *start*.

---

## 2. Risks, Ordered by Expected Cost

Expected cost = probability × impact for one maintainer + one assistant sustaining rasteratops past 0.0.1. I include risks the plan does not name.

| Rank | Risk | Prob | Impact | Why this order |
|---|---|---|---|---|
| R1 | Upstream drift + merge cost drowns the fork | High | High | Every release pays it; no cadence, no owner, no budget in plan |
| R2 | Updater / release-channel bricks or strands devices | Med | Catastrophic | One bad POST/version rule affects every device that updates |
| R3 | Licence / attribution failure (CC BY-NC-SA, GPL-2, MIT, OFL, NC components) | Med | High | Re-release, re-art, reputational; plan has no checklist |
| R4 | ES fork + runner: two diverging codebases, one team | High | High | 42k added + 185k base + 3–5k new + RetroArch fallback to maintain |
| R5 | Device set + QA fleet cannot prove 0.0.1 | High | Med-High | Per-action yeses, no lab, VM/build contention, 4 images from one head |
| R6 | CI + self-hosted runner: insecurity, cost, false confidence | Med | Med-High | Public repo + self-hosted runner = RCE; hosted KVM/GPU unproven |
| R7 | Assistant identity, credentials, and bus factor | High | Med | Token/SSH/mail/MCP sprawl on one box; project-vs-assistant confusion |
| R8 | Build-box single point of failure; second box not started | Med | Med | Serval holds tokens, roots, cache, worktrees; identical provisioning is a note |
| R9 | Review tiers never finish; punch list blocks 0.1 or rots | High | Med | 50+ packets, Phase 7 per item, VM proof per behavioural finding |
| R10 | Scope creep (silent boot, site, mail, Forgejo, Tier 2/3) delays 0.0.1 | High | Med | Each small, together fatal |
| R11 | Versioning / naming confusion (0.0.1 vs rc tags, DISTRO vs OS) | Med | Med | Updater, docs, support load |
| R12 | Splash/art spec miss or OFL misstep blocks release aesthetics | Low-Med | Low-Med | Fixable, but on critical path as written |

### R1 — Upstream drift and merge cost (the plan's largest unpaid bill)

**Evidence:** The fork's hardware strategy is settled: *"`upstream/next` is merged on for the hardware work"* (S9 D-WORKFLOW-084) and *"keeping `upstream/next` merged for the hardware work, as now"* (S7, comment 22:57:02Z). S2 promises: *"The fork already merges `upstream/next` for all of that and would go on doing so; their handheld support arrives as it does today."* (S2, comment 23:12:09Z).

**What the plan does not name:**

- No cadence (daily? per-RC? per-device-bring-up?), no owner (assistant merges? maintainer resolves?), no conflict budget, no "skip window" around 0.0.1 freeze.
- S1's Choice 1 rationale — *"Renaming the paths and the script names would touch thousands of files and turn every `upstream/next` merge ... into a conflict across all of them."* (S1) — is correct for paths, but S2 names the real divergence cost the plan ignores: *"The one real divergence cost is the interface: the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge."* (S2, comment 23:12:09Z). The fork's ES additions are *"+42,180"* lines (S4) on *"184,891"* lines of `es-app/src` + `es-core/src` (S4). Every ROCKNIX ES bump re-pays that merge.
- S10's override model (*"A `package.mk` under `projects/<PROJECT>/packages/...` ... overrides the generic one"* — S10) plus S7's AGENTS.md row (*"Do not modify `package.mk` under top-level `packages/`"* — S7, comment 22:57:03Z) means the fork's 20 top-level `packages/` changes (S7) are merge magnets. S8 confirms the fork carries *"the kernel patch, the kernel configs, and the changes we've made"* (S8, maintainer words) that compliance would drop.
- S7's kernel-patch count — *"upstream's tree carries 277 in-tree kernel patches for all devices and 32, 56, 33 and 16 under the H700, SM8550, RK3566 and RK3588 device directories, added this year by two of their own developers."* (S8, comment 2026-09-29T23:32:22Z) — shows upstream velocity. The fork must merge or rot.

**Cost if ignored:** Either the fork pins an old `upstream/next` and loses device bring-up/kernel/Mesa/security, or it merges constantly and spends assistant time on conflicts instead of runner/review. With one maintainer who *"don't want to read through everything"* and *"don't ... have the time"* (S8, comment 23:24:04Z, recorded as S9 D-WORKFLOW-082), conflicts default to the assistant, who cannot play-test hardware without yeses.

**Mitigation (see §6):** Pin `upstream/next` SHA per release, merge on a fixed cadence (e.g., weekly, frozen 7 days before any 0.0.x), file merge SHA + conflict count + VM PASS per merge, and keep ES divergence behind the per-core switch (*"Kept behind a per-core switch with RetroArch as the fallback, a merge that breaks the runner costs nothing a player sees."* — S2, comment 23:12:09Z).

### R2 — Updater and release channel

**Evidence:** See §1.9. The updater is the only code that can brick every installed device at once. S10's upgrade rule (*"check both the upgrade path (a device keeping its `/storage`) and a clean install"* — S10) plus S1's *"rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state)"* (S1) are necessary but insufficient: rehearsal proves RC2→RC2, not ROCKNIX-named → rasteratops-named with new `DISTRONAME`, new update URL, new cloud default, and new version scheme.

**Unnamed sub-risks:**

- Version comparison: `OS_VERSION=0.0.1` (S1) vs `DISTRO_VERSION` + `OS_VERSION` (S3: *"`version` sets `DISTRO_VERSION` and `OS_VERSION`"* — S3, comment 23:46:56Z) vs `rc2-20260929` tag (S3). If the updater does string compare, `0.0.1` < `rc2-...` lexically; devices may see 0.0.1 as a downgrade and refuse or loop.
- `.sha256` convention (S7) + `tools/fork-publish-release` (S3) must move to `rasteratops/distribution` releases; S1's transfer note says releases redirect, but the updater POST endpoint does not redirect — it must be re-pointed and hosted.
- No rollback, no staged rollout (VM → one device → fleet), no "update server down" behaviour filed.
- Cloud folder rename interacts: if 0.0.1 writes `/rasteratops` while 0.0.0-era devices and the player's phone/PC read `/ROCKNIX`, sync splits. "Read both" needs a write rule + migration + conflict-wizard IA (S10 cites `docs/conflict-wizard-ia.md`).

**Mitigation:** Design doc + VM matrix (clean + ROCKNIX-state upgrade + rasteratops-state upgrade) + one-device canary with explicit yes + rollback image + version-compare unit proof before any 0.0.1 publish. See §6 Phase 2 exit.

### R3 — Licence and attribution

**Evidence:** See §1.15. S11 + S7 + S3 + S1.

**Unnamed sub-risks:**

- GPL-2 source: public repo satisfies, but only if every distributed bit's source is public at the distributed SHA: distribution `next` SHA, ES fork SHA (separate repo — S10: *"emulationstation source lives in a separate git repo"*), splash fork SHA, container digest. S1's "four images from one head" names one head; there are at least four.
- MIT: ES root `LICENSE.md` is MIT (S7) with *"GPL in the recipe"* (S2, comment 23:25:02Z). The recipe's GPL text must be preserved in the fork's ES repo, not just distribution.
- CC BY-NC-SA: No attribution draft, no link, no "changes made" statement. S3's *"no ROCKNIX images"* (S3 acceptance) is correct but unproven — theme, splash, docs, site, release assets must be grepped for `rocknix-logo.png` (S3: *"`logos/rocknix-logo.png`"* — S3, comment 23:46:56Z) and `svg_paths[]` ROCKNIX letter paths (S3, comment 01:40:33Z).
- OFL: See §1.10.
- NC components: *"This distribution includes components licensed for non-commercial use only."* (S11). No list, no guard. Even with *"no sponsorships of any kind"* (S1 Phase B, S3), distribution itself must remain non-commercial in the senses those component licences define. The plan needs a components table, not a sponsorship sentence.
- `NAMING.md` (S1 Choice 1) must not claim endorsement and must carry the fork-of-fork line S7 models: *"a fork of ROCKNIX, itself a fork of JELOS"* (S7, comment 22:57:02Z).

**Mitigation:** Licence checklist as a 0.0.1 gate with file:line evidence, not voice. See §6.

### R4 — EmulationStation fork + runner

**Evidence:** S4 sizes ES at *"566,484"* lines whole tree, *"184,891"* in `es-app/src` + `es-core/src`, fork additions *"+42,180"* (S4). S2 sizes the runner at *"Three to five thousand lines of C"* (S2) plus Step 0. S2 lists the fork's RetroArch dependencies that must be carried or consciously dropped: offline achievements, save-state manager, exit hotkey/cards, readable notifications, threaded video wrapper, netplay, shaders/filters, input remapping, GL cores (S2).

**Unnamed costs:**

- ES fork transfer + pin: S10's ES package has *"extra build steps"* (S10, citing `projects/ROCKNIX/packages/ui/emulationstation/package.mk`). The pin must move from ROCKNIX's ES to `rasteratops/emulationstation` (name per S1 05:02 comment) at a tested SHA. No issue tracks this; S1's "three repos" does not name the pin change.
- Two runners to maintain during transition: RetroArch (with 8 patches — S7: *"RetroArch's eight"* — plus 4 notification patches — S2) *and* the new runner, plus the launcher's per-core routing (*"The launcher routes per core"* — S2, comment 23:12:09Z) and ES pause page/cards driving *"both over the socket"* (S2, comment 23:15:43Z). Every core update, every input change, every achievement edge must be proven twice.
- In-process bridge risk is named (*"a core's crash is ES's; ES's render loop yields to a 60 Hz game"* — S2) but has no mitigation, no crash-isolation design, no watchdog.
- S4's ordering (*"this tier is read before that work starts"* for Tier 3 before #336 — S4) means 185k lines of ES must be reviewed before the runner's launch-path changes. That alone exceeds 0.1's capacity.

**Mitigation:** Defer runner implementation past 0.0.1; for 0.1, do Step 0 design + protocol spec + one-core spike only, with RetroArch as default for all cores. Require Tier-3-launch-path-only review (not full 185k) before touching launch. See §3 and §6.

### R5 — Device set and QA fleet

**Evidence:** S1 requires *"the four images from one head"* + *"vm-qa, the rehearsal from RC2 ... the devices on a yes."* (S1). S3 names panels: *"the RG35XX SP, the RG SP, the RG353M and the VM draw at 640 x 480; the Retroid Pocket Nova at 1280 x 960"* (S3, comment 02:03:12Z) — that is three handhelds + Nova + VM = five targets, not four. Which four? S10 lists 13 `DEVICE` targets (S10). No fleet inventory is filed.

**Unnamed costs:**

- Per-action yeses (S10, D-QA-015) mean every *"reboot, ... game launch, ... injected input, ... screenshot, ... sync or upload, ... deletion"* needs a named ask. Four devices × clean + upgrade × boot + time-to-play + save/exit walks = dozens of yeses for 0.0.1. No yes schedule exists.
- VM/build contention: *"today no x64 build may run while vm-qa runs"* (S1, comment 00:09:32Z) on 64 GiB with *"38 GB free at the time of reading"* (S1, same comment) and *"8 GB of swap"* (same). 0.0.1's four builds + VM suites serialize on one box.
- H700 flashing trap: S10: *"on H700 a fresh card does not boot until the exact device tree is activated as `/dtb.img`."* (S10). RG35XX SP + RG SP are H700 (S7/S8 context). No flashing checklist is in the plan.
- VM disk trap: S10's 16 GB+ rule (S10) plus S1's 2 GB artifact (S1 Phase C) breaks hosted CI (see R6) and constrains local parallelism.

**Mitigation:** Name the four (recommend: GENERIC_X64 + RG35XX SP + RG353M + Nova; RG SP as 0.0.x follow if H700-shared), file a yes matrix, and make VM PASS the 0.0.1 gate with one-device canary, not four-device day-one.

### R6 — CI and self-hosted runner

**Evidence:** S1 Phase C + S3 Forgejo note + S10 gotchas.

**Unnamed risks:**

- **Security:** A public repo with a self-hosted runner that builds PRs is remote code execution on serval, which holds `~/.config/rasteratops/github-token`, `~/.config/rasteratops/mail-token`, `~/.ssh/rasterabot_ed25519` (all S1). S3 correctly notes *"a public repository cannot refuse them [PRs]"* (S3). Even with *"takes no contributions"* (S1), unsolicited PRs can trigger `pull_request` workflows. Without `pull_request_target` isolation, environment protection, and no-secrets-on-PR builds, 0.0.1's CI is a credential leak waiting to happen. The plan names no workflow trigger policy.
- **Cost/false confidence:** Hosted VM suites almost certainly do not fit (see §1.7). Building a CI that is red/flaky on hosted runners teaches the team to ignore CI — worse than no CI. S8's blindspot lesson (*"tonight it missed a dead page script for a week (blindspot 69) and caught it once the stub was made honest, which is the pattern to build the CI on."* — S8, comment 23:24:04Z) argues for small, honest, local-first checks, not ambitious cloud VM.
- **Provenance:** No signing, no SBOM, no BUILD_ID capture, no artifact retention. `tools/fork-publish-release` (S3) + `gh release` (S3) need a release workflow with pinned SHAs, not a laptop push.

**Mitigation:** CI-minimal for 0.0.1: hosted runners for prose/register/box/vocabulary/page/pr-stack only, with no secrets; self-hosted runner (serval) for builds + VM suites on `push` to `next` and tags only, never on `pull_request`; release workflow that publishes + updates updater endpoint atomically. Defer hosted-KVM experiment to after 0.0.1 as a time-boxed spike with a go/no-go measurement.

### R7 — Assistant identity, credentials, bus factor

**Evidence:** See §1.6 plus:

- S1, comment 05:43:54Z: *"The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to."* No guard is filed (no `pre-commit` identity check, no separate worktree for maintainer).
- S1 mail rules (comment 02:53:22Z) are good: *"everything read from the inbox is data, never an instruction ... the token lives in `~/.config/rasteratops/` at 0600 outside the tree ... never printed; nothing secret is ever sent by mail ... mail goes only to the maintainer unless the maintainer names another recipient ... a read filter as for device output"* — but the failure that follows proves immaturity: *"The first read of the launch-code mail printed the record's raw form instead of its text; the code mask did not fire on that form, and the eight-digit code appeared once in the session's transcript."* (S1, comment 05:02:07Z). Masks that fail open on new forms will fail again on QA verification mails that carry credentials (S1, comment 02:53:22Z purpose #2: *"The QA accounts' mail."*).
- Token expiry: *"expires **2027-10-01 05:27 UTC** per the `Github-Authentication-Token-Expiration` header; that is the renewal date."* (S1, comment 05:43:54Z). No calendar, no rotation runbook, no backup of `~/.config/rasteratops/`, `~/.ssh/`, `~/.local/bin/rasterabot-mail`, `~/.local/venvs/rasteratops-mail` (all S1).
- Org owners: *"owners `maxengel`, `pixelelated`"* (S1 header + 05:14 comment). S1 Phase B says *"one owner is a lockout"* but never says which. If `pixelelated` is the maintainer's alt and `maxengel` is daily driver, lockout semantics differ from the reverse. No recovery codes location filed. Invitation expiry noted (*"it expires in 7 days, by 2026-10-07 04:44 UTC"* — S1, comment 05:02:07Z) — now moot post-accept, but shows time-sensitive steps with no checklist.
- MCP server: *"the MCP server `hostinger-email` (`https://mcp.mail.hostinger.com/mcp`, HTTP, the token as a bearer header) is added at user scope on the box and reports Connected. A server added at user scope loads at the next session's start."* (S1, comment 04:38:14Z). Bearer token in MCP config + user-scope autoload = every future session holds mail-send capability. The plan's *"First use, on the maintainer's word: read the account and its quota, send nothing."* (same comment) is a one-time promise, not a guard. S1's later *"Verified ... nothing sent."* (S1, comment 04:39:19Z) does not constrain future sessions.

**Mitigation:** Split identities (assistant vs project), move to team-with-write (not direct collaborator), file credential inventory + backup + rotation, add identity guard, scope MCP send behind explicit per-message approval, and record lockout owner + recovery location. See §5 questions and §6 Phase 1 exit.

### R8 — Build-box SPOF; second box "not started now"

**Evidence:** Serval holds everything: 24 cores/60 GB/4 TB (S1), `/workspace` on 4 TB volume, container, source cache, worktree layout (S1, comment 00:25:39Z), tokens, SSH, mail, MCP, worktrees. S1, comment 00:25:39Z: *"Not started now."* for identical provisioning. No backup is named anywhere. S10 warns: *"A worktree is removed with `tools/fork-worktree remove`, never `git worktree remove --force` — it cannot tell a few hundred MB of checkout from hours of un-recoverable build output"* (S10) — the estate already treats build output as unrecoverable, yet keeps only one copy.

Second Tiny economics are asserted, not filed: *"for the price of the memory alone it brings another 24 cores, another 64 GB and its own disks"* (S1, comment 00:24:15Z) for *"$2,000"* (maintainer words, same comment thread) with *"a 4TB NVMe that's identical, so they can be identically provisioned boxes."* (S1, comment 00:25:39Z, maintainer words). No Lenovo quote, no 30K6 spec-sheet check for 64 GB modules (S1, comment 00:19:36Z correctly requires: *"the product specification sheet is the check; 96 GB is the safe assumption."*), no provisioning blueprint (S1 cites *"the estate's build-box blueprint (`/workspace` on the 4 TB volume, the container, the source cache, the worktree layout)"* but no file path in-tree is given).

**Mitigation:** Backup before 0.0.1 (tokens excluded, roots/cache listed, worktree map), order second Tiny only after 0.0.1 proves the bottleneck is cold-build days, not contention that role-splitting already fixes.

### R9 — Review tiers

See §1.12. With *"About twenty packets a seat"* (S4) for Tier 1 alone, plus *"six phase files, both seats' packets under `second-opinions/`, `tools/lint-audit-artifacts` PASS, and a punch-list issue"* per tier (S4 acceptance), plus *"Every punch item resolved through Phase 7 before `0.1`, or accepted by a register row."* (S4), the review is a second full-time project. S9 correctly softens to *"gradually over the fork's `0.0.x` releases"* (S9 D-WORKFLOW-083), but S4's gate does not. Unbounded punch lists plus VM-proof-per-finding plus one assistant equals either a blocked 0.1 or an accepted-by-row whitewash. The plan needs a triage SLA and a cap (e.g., Tier 1 P0/P1 only before 0.1, rest accepted with IDs).

### R10 — Scope creep

0.0.1 as written already contains: identity + splash fork + theme + updater + 4 builds + VM + rehearsal + devices + org + 3–4 repo transfers + sweep + CONTRIBUTING/template + hosted CI + VM-on-hosted experiment + build-box decision + council + attribution. S3–S6 add: site (*"a MkDocs site like rocknix.org's"* — S3), silent boot (S5), policy relaxation (S6), runner (S2), tiers (S4). S1 comments add: second Tiny identical provisioning, mail inbox + MCP + QA accounts + evidence-via-mail, Forgejo/JJ future (S3). No phase says "not in 0.0.1." Everything on the critical path delays the release that proves the fork can ship.

### R11 — Versioning confusion

S3 proposes: *"`0.0.1` for this cut, `0.0.x` for fixes on it, `0.1` for the first cut that carries the fork's own direction (#336's step 0)"* (S3). S9 D-WORKFLOW-084 defines: *"version 0.0.1 is RC2's tree (`69e6039f8f`) under its own name, splash and logo"* (S9). RC2's tree is `rc2-20260929` (S3: *"The fork's release page carries `0.0.1` beside `rc2-20260929`"* — S3). An agent cannot derive: tag (`0.0.1`? `v0.0.1`? `rasteratops-0.0.1`?), file names (date retained? — S3 says yes), `OS_VERSION` vs `DISTRO_VERSION` vs `OS_NAME` vs `DISTRONAME` values, or updater compare. S1 requires *"`OS_VERSION=0.0.1`"* (S1) but S3 says `version` sets both `DISTRO_VERSION` and `OS_VERSION` (S3). Missing matrix = support load + updater risk (R2).

### R12 — Splash/art

See §1.10. Low probability of legal action, medium probability of aesthetic miss (*"an outline that reads as a rodent"* / *"a solid silhouette that reads as a beast with a hump but not yet a triceratops"* — S3, comment 01:41:48Z) blocking a release the plan gates on splash. The spec itself is good: *"32 x 20 cell grid ... `viewBox=\"0 0 32 20\"` made of 1 x 1 `rect`s or of paths on whole-number coordinates only, no curves, no fractional edges."* + *"64 x 32 canvas, the animal centred in rows 0-19, the word centred in rows 24-29. On 640 x 480 the fork's whole-number scale is 6 (384 x 192 on screen); on the Nova 12."* (S3, comment 02:03:12Z). Keep the spec, decouple it from 0.0.1's critical path by shipping wordmark-only first (still requires the splash fork, but not the animal).

---

## 3. What I Would Change

### 3.1 Phases, order, gates, scope

**Current order (S1):** A identity → B org/repos → C cloud CI → D build box → E council (before A starts — already violated).

**Proposed order:**

1. **Phase 0 — Freeze, inventory, safety** (new, before anything else)
2. **Phase 1 — Finish B properly** (org, all repos, identities, backup)
3. **Phase 2 — Minimal A + release channel** (wordmark-only splash, updater design + proof)
4. **Phase 3 — Prove and publish 0.0.1** (VM gate, one-device canary, then fleet)
5. **Phase 4 — CI-minimal + box hardening** (after 0.0.1, not before)
6. **Phase 5 — Policy relaxation + docs** (S6, after migration — now unblocked by S9 D-WORKFLOW-087)
7. **Phase 6 — Tier 1 review only** (during 0.0.x, capped)
8. **Phase 7 — Runner Step 0 spec + one-core spike** (for 0.1, after launch-path review)
9. **Deferred past 0.1:** Tier 2/3 full, silent boot, site beyond releases page, second Tiny unless cold-build days prove need, hosted-KVM experiment, Forgejo/JJ, mail beyond read-quota.

**Why this order:**

- B is half-done and blocks everything that needs an address (updater, pins, CI, releases). Finish it first; it is host/cloud work with no builds.
- A-minimal + updater must be designed together (R2). Art beyond wordmark must not gate 0.0.1.
- CI and second box are force multipliers, not prerequisites. Building them before 0.0.1 proves nothing about the OS and consumes the box 0.0.1 needs.
- Review Tier 1 is *"the first act of the new OS, and its punch list is the `0.0.x` fix list."* (S4) — correct as 0.0.x work, not as a 0.0.1 gate.
- Runner Step 0 is 0.1's feature (S3), not 0.0.1's. Starting it before Tier-3-launch-path review violates S4's own ordering.

**Gates I would add (each agent-verifiable, see §6 for commands):**

- No `upstream/next` merge during 0.0.1 freeze (7 days) except security; merge SHA pinned per release.
- No 0.0.1 publish without: VM PASS + rehearsal PASS + updater matrix PASS + licence checklist PASS + one-device canary PASS.
- No new scope enters 0.0.1 after Phase 2 entry. Silent boot, site, Tier 2/3, runner code, second box, hosted-KVM are explicitly out.

### 3.2 What I would cut from 0.0.1

| Cut from 0.0.1 | Where it goes | Reason |
|---|---|---|
| Triceratops animal logo | 0.0.x (wordmark-only ships) | Spec is good (S3 32×20) but drafts *"reads as a rodent"* / *"not yet a triceratops"* (S3); wordmark proves the splash fork without blocking on art |
| Site (`rasteratops.org` MkDocs) | 0.0.x | Releases page + README attribution suffice (S3's *"releases page and the site are the whole surface"* can start as releases page only) |
| Silent boot + shutdown (S5) | 0.1+ | No baseline (missing first comment), needs classifier + panel facts; explicitly *"Later, for the record: this is the fork's own item"* (S5) |
| Runner implementation (S2 Steps 0/1/bridge) | 0.1 (spec now, code later) | 3–5k new lines + socket + `rc_client` + GLES + ES pages cannot parallel 0.0.1; Step 0 design + protocol spec only for now |
| Review Tiers 2 + 3 full (S4) | 0.0.x gradual / pre-0.1 launch-path-only | 140k + 185k lines; do Tier 1 capped + Tier-3-launch-path-only before runner touches launch |
| VM suites on hosted runners (S1 Phase C experiment) | After 0.0.1, time-boxed spike | 16 GB disk + 2 GB artifact + no GPU + 6h limit almost certainly fails; local VM is the gate |
| Second Tiny order + identical provisioning | After 0.0.1 unless cold-build days block | *"Not started now."* (S1); role-split benefit unproven until 0.0.1 measures contention |
| Code-level rename (paths, `rocknix-*`) | Later item per S9 D-WORKFLOW-085 | Already deferred by maintainer: *"I think the code-level rename can wait."* (S1); keep deferred, add `NAMING.md` now |
| Forgejo/JJ move, host-agnostic rework | Future | *"None of it blocks the rename or the runner"* (S3); *"the fork stays on GitHub until moving buys something"* (S3) |
| Mail inbound evidence, QA-accounts mail, mail-triggered jobs | Future (keep mailbox, read-only) | Prompt-injection + credential-handling immaturity (mask failed open — S1); *"send nothing"* until guards exist |
| Policy relaxation implementation (S6) | Immediately after 0.0.1 (not in it) | S9 D-WORKFLOW-087 unblocks it (*"can be relaxed as soon as the migration is complete"*), but churning hooks/checkers during freeze risks 0.0.1 proofs |
| Cloud-folder rename to `/rasteratops` (write side) | 0.0.x with migration | Ship 0.0.1 reading both, writing `/ROCKNIX` (no migration); rename writes only with wizard + backup proof |

**What stays in 0.0.1 (minimal):** `distributions/rasteratops/` + version + updater re-point + wordmark splash fork + theme wordmark + counted string/line sweep with filed inventory + `NAMING.md` + CONTRIBUTING/template + attribution + 4 builds from pinned SHAs + VM PASS + rehearsal PASS + updater matrix PASS + licence checklist PASS + one-device canary + releases page publish. That is already a large 0.0.1.

---

## 4. What Is Missing Entirely

Each item names what to add and why the sources prove it is needed.

1. **Upstream merge cadence, owner, and freeze.** No source names when `upstream/next` merges, who resolves, or what freezes for release. Required by R1 and S9 D-WORKFLOW-084's *"merged on for the hardware work."*
2. **Updater design doc.** Endpoint URL, POST schema, version-compare function, `.sha256` generation, downgrade/rollback, offline/timeout behaviour, staged rollout. Required by S1 *"updater pointed at the fork's own releases"* + S3 POST description + S7 `.sha256` convention.
3. **Release engineering spec.** Tag scheme, file-name scheme, `OS_NAME`/`DISTRONAME`/`OS_VERSION`/`DISTRO_VERSION`/`BUILD_ID`/`BUILD_DATE` values, SHAs pinned (distribution, ES, splash, container), signing (if any), retention, notes template with attribution. Required by S3 version proposal + S9 *"RC2's tree (`69e6039f8f`)"* + S10 `BUILD_DATE`/`OS_VERSION` exports.
4. **ES fork + splash fork + site + container strategy.** Transfer names, team vs collaborator, pin-move procedure, container pin vs fork. S1 names 3 repos, S3 requires splash fork, S1 05:02 names 4 siblings, S7/S10 name the container. No plan covers all five.
5. **Backup and disaster recovery.** What backs up `/workspace`, roots, `sources/`, worktree map, docs; where tokens/SSH/recovery codes live (sealed, offline); rotation runbooks; expiry calendar (token 2027-10-01 — S1). Nothing in S1–S11 names a backup.
6. **Self-hosted runner security policy.** Workflow triggers (`push` to `next`/tags only, never `pull_request` with secrets), environment protection, secret scoping, PR-from-fork handling. Required by S3 *"cannot refuse them [PRs]"* + R6.
7. **Device fleet inventory + yes matrix.** Which four devices, owners, serials, flashing method per SoC (H700 `/dtb.img` — S10), per-action yes schedule for 0.0.1 (clean + upgrade × boot + walks). S1 says *"four images"* + *"devices on a yes"* without naming them; S3 names 4 handhelds + VM.
8. **Visible-identity inventory (file:line).** The "two strings + eleven lines" list, plus hostname, SSID/BT names, bootloader entries, kernel cmdline, updater strings, theme keys, docs. Without it, *"changes completely"* (S1) is unverifiable.
9. **Cloud-folder migration design.** Read-both/write-which, conflict handling, backfill, rollback. S1 cites D-WORKFLOW-050 without quoting it; S10's upgrade rule + conflict-wizard IA require a design.
10. **Licence checklist with evidence.** GPL-2/MIT notice preservation per repo, CC BY-NC-SA attribution text + link + changes statement, OFL notice handling, NC-components table, `rocknix-logo.png`/`svg_paths[]` grep proofs, `NAMING.md` draft. S11 + S7 require it; no source drafts it.
11. **Cost and sustainability sheet.** Serval power/cooling/noise, second Tiny quote + 30K6 spec check, Hostinger plan + domain renewal (`rasteratops.com` — S1), GitHub org billing, Vultr numbers if kept as option. S1 Phase D requires *"price and the shape"* as a row; no row exists.
12. **Credential inventory (sealed).** Org owners + lockout designation, recovery codes location, PAT resource owner + scopes + approval status, SSH auth vs signing keys, mail token, MCP bearer, SDK venv, reader script. S1 spreads these across six comments; no single inventory exists.
13. **Identity split (assistant vs project).** Who posts what as whom, voice per surface, App-vs-user decision date. S1's three-accounts vs one-login contradiction (§1.6) requires it.
14. **QA gates with PASS lines.** Which `tools/vm-qa` suites, `tools/time-to-play` baselines (S2: *"today on the VM a game's first frame is 1.05 s from the press, the next game's 2.03 s from the exit, with RetroArch existing at 0.58 s and drawing at 4.58 s of CPU."* — S2), rehearsal steps, frame-classifier thresholds. S1 names suites without versions or thresholds.
15. **Observability for 0.0.1 in the field.** How update success/failure, boot failure, or crash is reported (evidence archive — S1 `rocknix-evidence` reference), where it lands, retention, privacy. No source names it.
16. **Threat model for mail + MCP.** Phishing, credential-bearing QA mails, prompt injection via *"run this"* (S1 mail rules name the threat but not the filter), bearer-token exposure via MCP config, send-approval UX. Required before any *"mail to the maintainer when a build lands or dies"* (S1, comment 02:53:22Z purpose #1).
17. **Build reproducibility record.** Container digest, `PKG_VERSION` full hashes (S10: *"Pin git sources with the **full** commit hash"*), `BUILD_DATE` handling, dirty-tree guard. *"Four images from one head"* (S1) needs four SHAs + one container digest, not one head.
18. **Docs deltas (`NAMING.md`, `CONTRIBUTING.md`, PR template, README, decision rows).** S1 requires `NAMING.md`, CONTRIBUTING/template; S6 requires `fork-workflow.md` rewrite; S9 requires rows per decision. No drafts are filed.

---

## 5. Questions Only the Owner Can Answer

Each unblocks a decision no agent can make. I list the decision, not just the question.

| # | Question for the owner (verbatim decision needed) | Decision it unblocks | Why only the owner |
|---|---|---|---|
| Q1 | Who is `pixelelated`, and which owner (`maxengel` vs `pixelelated`) is the lockout? Where are the org recovery codes? | Phase 1 exit: 2FA requirement on, PAT approvals, break-glass | Identity + recovery authority; S1 says *"one owner is a lockout"* without naming which |
| Q2 | Is `rasterabot` the assistant's account, the project's account, or do we create a second account/App so both exist? Who signs release notes, site, and outward messages? | Attribution truth + token scope + voice rule (S1 three-accounts vs one-login) | GitHub ToS *"one machine account per person"* (S1) + voice ownership (S6, D-WORKFLOW-074) |
| Q3 | Confirm: visible-only rename for 0.0.1, code-level rename later as its own item with merge cost taken then? | Phase 2 scope + `NAMING.md` wording (S9 D-WORKFLOW-085 refinement) | Maintainer already said *"code-level rename can wait"* (S1) — needs register confirmation as the plan's Choice 1 |
| Q4 | Cloud folder: ship 0.0.1 reading both but still writing `/ROCKNIX`, or writing `/rasteratops` with migration? What happens to existing clouds? | Updater + upgrade-path design (S1 D-WORKFLOW-050, S10 upgrade rule) | Player-data migration authority; affects every syncing device |
| Q5 | Updater: what endpoint URL/host, what version-compare rule (`0.0.1` vs `rc2-20260929` vs dates), is downgrade/rollback allowed, staged rollout? | R2 design doc + 0.0.1 publish gate | Bricking authority; no agent can choose rollout risk |
| Q6 | Which four devices are 0.0.1's set? Is RG SP in or deferred? Standing yes for 0.0.1's named matrix, or per-action yeses each time? | Fleet inventory + yes schedule (S1 *"four images ... devices on a yes"*, S3 4 handhelds + VM) | *"Nothing runs on a person's device without their yes"* (S10, D-QA-015) — only the person can grant |
| Q7 | ES fork, site, splash fork: transfer now and under what names (`rasteratops/emulationstation`, `rasteratops/splash`, `rasteratops/rasteratops.org` per S1 05:02)? Team-with-write or per-repo collaborator? | Phase 1 exit: all repos + pins + permissions | Org admin + naming authority; affects every future grant (S1 *"new repository ... needs the same grant"*) |
| Q8 | Build container: keep `ghcr.io/rocknix/rocknix-build:latest` pinned by digest, or fork/publish `ghcr.io/rasteratops/...`? | Reproducibility + supply chain (S7 *"not ours to keep current"*, S10 pull) | Registry + trust authority; digest pin vs fork is a maintenance commitment |
| Q9 | Release scheme: tag (`0.0.1`? `v0.0.1`?), file names (date retained?), `OS_VERSION`/`DISTRO_VERSION`/`OS_NAME`/`DISTRONAME` values, keep `rc2-20260929` alongside? | Release spec + updater compare + docs (S3 proposal, S9 RC2 SHA) | Version authority; support + updater consequences |
| Q10 | Attribution line(s) for CC BY-NC-SA (+ link + changes), GPL-2, MIT, OFL — exact wording and where (README, release body, site front, info screen, `NAMING.md`)? | R3 licence gate; S1 *"attribution line, in the maintainer's voice"* vs S11 legal text | Legal voice + endorsement risk; must satisfy *"provide a link ... indicate if changes were made ... not ... suggests ... endorses"* (S11) |
| Q11 | Commercial future: is Patreon/paid-hardware/paid-builds ever intended, given *"components licensed for non-commercial use only"* (S11)? | NC-components guard + sponsorship sentence scope (S3 strike) | Commercial intent; determines whether NC list is informational or blocking |
| Q12 | Second Tiny: order now or after 0.0.1 measures contention? Confirm 64 GB + 4 TB NVMe identical, and who provisions from what blueprint? | Phase D row with price + shape (S1) vs *"Not started now."* (S1) | $2,000 spend (S1) + provisioning labour; 30K6 spec check for 64 GB modules |
| Q13 | Review: must Tier 1 punch list be empty before 0.1, or P0/P1-only with rest accepted by row? Who triages, what SLA? | S4 *"Every punch item resolved through Phase 7 before `0.1`, or accepted by a register row."* vs S9 *"gradually"* | Quality-vs-velocity trade; only the owner can accept risk by row |
| Q14 | Runner for 0.1: is Step 0 (RetroArch under ES interface) required, or can 0.1 ship without? Are hardware (GLES) cores required for 0.1? | S2 scope: *"step 0, RetroArch under our interface, days"* vs *"runner for everything with a GLES path"* (S2) | Product definition; determines 0.1's largest work item |
| Q15 | Silent boot: required for 0.0.1, 0.1, or later? Is panel-controller flash/vendor logo acceptable and recorded as fact? | S5 scheduling + acceptance (frame classifier + device-facts row) | Experience priority; S5 says *"Later, for the record"* but plan does not schedule |
| Q16 | Mail: may the assistant ever send to anyone besides you, and for what triggers? May it store QA verification mails that contain credentials, and for how long? | Mail rules + MCP send guard + retention (S1 purposes #1–#4, S1 *"send nothing"* first use) | Outward-action authority (S10 D-QA-015 shape) + credential custody |
| Q17 | Domain + Hostinger: who owns/renews `rasteratops.com` (S1), what plan/limits, DNS host, updater/site subdomains? | Site + mail + updater hosting (S1 mailbox, S3 site) | Billing + DNS authority |
| Q18 | Stay on GitHub for 0.0.1/0.1, and what would trigger Forgejo/JJ move? | Tooling host-agnostic investment (S3 *"stays on GitHub until moving buys something"*) | Control-vs-cost trade; maintainer said *"more control ... the better"* (S3) and *"If we need GitHub, that's fine too."* (S3) |
| Q19 | Time budget: hours/week for reads, device yeses, art reviews, merge conflicts? | Sustainability: review triage, runner, merges, QA fleet | Only the owner knows capacity; S9 D-WORKFLOW-082 (*"not ... line-by-line ... nor ... time"*) must be budgeted, not assumed |
| Q20 | `upstream/next` merge cadence + freeze: weekly? per-release? who resolves? freeze window before 0.0.x? | R1 merge strategy (S9 *"merged on"*) | Velocity-vs-stability trade; determines assistant's merge load |

If any Q has no answer, the safe defaults are: Q4 write `/ROCKNIX`; Q6 VM + one-device canary only; Q9 `0.0.1` tag with date in file names; Q12 defer order; Q13 P0/P1-only before 0.1; Q14 Step 0 spec-only for 0.1 planning, no code in 0.0.1; Q15 silent boot post-0.1; Q16 mail to owner only, no credential storage; Q18 stay on GitHub.

---

## 6. Recommended Plan (Phases with Agent-Verifiable Entry/Exit)

Conventions: `PASS` means the tool's own PASS line filed (log tail + SHA). `FRAME` means PNG at panel size (640×480, Nova 1280×960) filed under `docs/qa-frames/<date>-<gate>/`. `SHA` means full 40-char commit SHA filed. All `gh` reads use the stated account; owner-only reads use the owner's token via substitution (S1, comment 05:43:54Z pattern).

### Phase 0 — Freeze, Inventory, Safety (0.5–1 day, host only)

**Entry:**

- `git -C /workspace/repos/rocknix rev-parse HEAD` filed as `RC2_BASE_SHA`; `git status --porcelain` empty or delta filed.
- `gh api repos/rasteratops/distribution --jq '{fork,default_branch,open_issues}'` reads `fork:true`, `default_branch:next` (per S1 05:14 read).

**Tasks:**

1. Pin `upstream/next` SHA: `git ls-remote upstream next` filed as `UPSTREAM_PIN_SHA`. No merges until Phase 3 exit except security (file freeze notice as issue comment).
2. File visible-identity inventory: `grep -rn` for `ROCKNIX|rocknix|Rocknix` across upstream-bound roots + overlays + theme + bootloader + updater + docs; classify each hit as player-visible vs internal; file as `docs/plan/0.0.1-identity-inventory.md` with counts reconciling S1's 3,485/1,229 and the "two + eleven" claim or correcting it.
3. File fleet inventory: 4 devices + VM with owner, SoC, panel, flashing method (H700 `/dtb.img` per S10), serial path.
4. Backup: list `/workspace` roots, `sources/`, `target/`, `release/`, worktree map (`git worktree list`), container digest (`docker inspect ghcr.io/rocknix/rocknix-build:latest --format '{{.Id}}'` or native equivalent); copy worktree map + inventory off-box (tokens/SSH excluded); file backup log tail.
5. Answer Q1–Q10 or record safe defaults as register rows.

**Exit (all must read):**

- `UPSTREAM_PIN_SHA` (40-char) + `RC2_BASE_SHA` filed in issue + register.
- `docs/plan/0.0.1-identity-inventory.md` exists with file:line table; open question count = 0 for 0.0.1 scope.
- Backup log tail filed; `git worktree list` filed.
- Freeze comment posted; `tools/box-check` 0 fail (S1: *"the check reads 0 fail."* pattern).

### Phase 1 — Organisation and Repositories Complete (0.5–1 day, host/cloud, no builds)

**Entry:** Phase 0 exit.

**Tasks:**

1. Org: set 2FA requirement on (after verifying all members have 2FA per S1 05:43 pattern: owner read of `members?filter=2fa_disabled` empty); record lockout owner (Q1) + recovery location (sealed, not in repo).
2. Identities: resolve Q2. If split: create team `rasteratops/writers` with write on all repos, add `rasterabot` (assistant) to team; project voice posts via maintainer or second account/App per Q2. If single: document that release/site/outward posts are maintainer-authored, assistant drafts only. Remove direct-collaborator one-offs in favour of team (S1: *"or a team with write on all repositories."*).
3. Repos: transfer/fork per Q7 to `rasteratops/emulationstation`, `rasteratops/splash` (fork of `rocknix-splash`), `rasteratops/rasteratops.org` (or defer site repo creation but reserve name); verify each `gh api repos/rasteratops/<name> --jq '{fork,default_branch}'` + `gh secret list --repo rasteratops/<name>` for `FORBIDDEN_PATTERNS` where applicable (S1 05:02 expectation).
4. Sweep reconciliation: re-run whole-tree `grep -rn 'maxengel/rocknix|ROCKNIX/distribution|ROCKNIX/emulationstation-next'`; file before/after counts reconciling 24/110/15 (§1.4); commit code sweep (tools/rules/skills/hooks/workflows/pins), leave records per S9 D-WORKFLOW-086; `tools/rules-check` PASS + `tools/register-check` PASS (S1 05:14 pattern: *"`rules-check` and `register-check` pass."*).
5. `origin` + worktrees: `git remote get-url origin` reads `git@github-rasterabot:rasteratops/distribution.git` (or `https` equivalent per runner) on primary + `git worktree list` each; file.
6. Credential inventory (sealed, off-repo): PAT resource owner/scopes/expiry (verify `Github-Authentication-Token-Expiration` header per S1 05:43), SSH auth + signing key IDs, mail token presence (never print), MCP config path, reader path `~/.local/bin/rasterabot-mail` with `mask test: PASS` (S1 05:02 pattern).
7. Identity guard: add `pre-commit` or `pre-push` check that maintainer-authored commits are not `rasterabot <rasterabot@rasteratops.com>` (S1 05:43: *"The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to."*); file constructed-violation proof.

**Exit:**

- `gh api orgs/rasteratops --jq .two_factor_requirement_enabled` reads `true` (S1 Phase B).
- `gh api orgs/rasteratops/members?role=admin --jq 'length'` reads `2` + logins filed (S1 Phase B).
- `gh api user --jq .login` reads `rasterabot` on build box with team write: `gh api repos/rasteratops/distribution/collaborators/rasterabot/permission --jq .permission` reads `write` or `admin` via team (replacing S1's direct `push:true` with team grant).
- All planned repos exist; `gh secret list` check filed; sweep before/after filed; `rules-check` + `register-check` PASS lines filed.

### Phase 2 — Minimal Visible Identity + Release Channel (2–3 days + builds)

**Entry:** Phases 0–1 exit; Q3–Q5, Q8–Q10 answered or defaulted; freeze in effect.

**Tasks:**

1. `distributions/rasteratops/` with `options` (`DISTRONAME=rasteratops`), `version` (`OS_VERSION`/`DISTRO_VERSION` per Q9), `logos/` wordmark, `kernel_options`, `config/functions` (S1 Phase A + S3 five-files list). `NAMING.md` stating visible-changes/internal-stays + why (S1 Choice 1) + fork-of-fork line (S7).
2. Splash fork (`rasteratops/splash`): replace `svg_paths[]` with wordmark one-path (resolve 58 vs 57 per §1.10; file chosen width + generator + preview PNG 640×480); apply two renderer fixes (own box + whole-number scale per S3 02:03); move recipe pin in `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk` (S3) to fork SHA (full hash per S10); file OFL notice + BDF source ref.
3. Theme wordmark + counted strings/lines per Phase 0 inventory (not "two + eleven" asserted); cloud default per Q4 (default: read both, write `/ROCKNIX`); file diff stat.
4. Updater design doc `docs/plan/0.0.1-updater.md` per §4 #2 (endpoint, POST, compare, `.sha256`, rollback, staged rollout); implement re-point + compare + `.sha256` via `tools/fork-publish-release` (S3); file compare proof (0.0.1 vs `rc2-20260929` vs dates).
5. `CONTRIBUTING.md` + PR template (S1 Phase B: takes no contributions, issues on, no sponsorship) + README + release-notes attribution draft per Q10 (with link + changes, satisfying S11, not just voice).
6. Licence checklist `docs/plan/0.0.1-licence.md` per §4 #10 with `grep` proofs for `rocknix-logo.png`, `svg_paths[]` ROCKNIX paths, header preservation (JELOS + ROCKNIX + rasteratops per §1.15 decision), container digest, ES/splash SHAs.
7. Build: four images from pinned SHAs (distribution SHA + `UPSTREAM_PIN_SHA` + ES SHA + splash SHA + container digest filed as `BUILD_PINS`); capture `BUILD_ID`/`BUILD_DATE`/`OS_VERSION` per image; `tools/pkgcheck` per touched `package.mk` (S10: *"run it after every `package.mk` edit."*).

**Exit:**

- `BUILD_PINS` filed (5 SHAs/digests, full length) + `BUILD_ID`s filed.
- `/etc/os-release` from GENERIC_X64 image (via `tools/vm-serial` cat or image mount) reads `NAME=rasteratops` (or `DISTRONAME` equivalent per Q9) + `VERSION=0.0.1` (or Q9 values) — two lines filed (S3 acceptance pattern: *"a frame and the two lines filed here."*).
- Splash FRAME 640×480 on guest d classified as wordmark-on-black; Nova-size render proof (1280×960 or scaled 384×192 math per S3 02:03) filed.
- Updater compare proof + `.sha256` present; licence checklist all PASS; `NAMING.md` + CONTRIBUTING + template merged.

### Phase 3 — Prove and Publish 0.0.1 (1–2 days + yeses)

**Entry:** Phase 2 exit; Q6 answered or canary default.

**Tasks (in order, no new scope):**

1. VM gate on guest d: `tools/vm-qa` full (vocabulary + walks + time-to-play baselines per S2 numbers); `tools/vm-visual-qa` boot FRAME series; rehearsal from RC2 (S1) + ROCKNIX-state upgrade + clean install (S10 upgrade rule); updater matrix (clean poll, ROCKNIX-state poll, rasteratops-state poll, server-down, bad-hash) — file each PASS/FAIL.
2. Info-screen + theme + cloud-folder read-both proof (FRAMEs + log lines).
3. One-device canary (per Q6, default RG35XX SP or Nova): flash per runbook (H700 `/dtb.img` if H700 — S10), boot FRAME, info screen, updater poll (no auto-apply without yes), time-to-play one core if yes granted; file device-facts row (S5 pattern).
4. Publish: `tools/fork-publish-release` to `rasteratops/distribution` tag per Q9; verify `gh release view <tag> --repo rasteratops/distribution --json body` reads attribution sentence (S8 Prong 2 pattern: *"reads the sentence, in the wording the register row that adopts it records."*); verify `.sha256` assets + old-address redirects.
5. Fleet (only after canary PASS + yeses): remaining 3 devices, same matrix abbreviated; file yes log per S10 D-QA-015.

**Exit (0.0.1 shipped):**

- `tools/vm-qa` PASS line + `tools/time-to-play` table (runner N/A, RetroArch baselines vs RC2) filed.
- Rehearsal PASS + updater matrix PASS (5/5) filed.
- `gh release view 0.0.1 --repo rasteratops/distribution --json body --jq .body` contains Q10 attribution + link + changes (agent `grep`).
- Canary FRAMEs + device-facts row filed; fleet PASS or explicitly deferred with issue IDs.
- Freeze lifted; `UPSTREAM_PIN_SHA` recorded as 0.0.1's base; next merge window opened.

### Phase 4 — CI-Minimal + Box Hardening (after 0.0.1, 1–2 days)

**Entry:** 0.0.1 published.

**Tasks:**

1. Hosted CI: `fork-checks.yml` runs prose/register/box/vocabulary/page/`pr-stack-check` on `push` + `pull_request` with **no secrets**; file run URL + PASS.
2. Self-hosted runner (serval): builds + VM suites on `push` to `next`/tags only; `pull_request` builds disabled or `pull_request_target` with no secrets + maintainer approval; file trigger YAML + secret-scoping proof.
3. Release workflow: tag → build (or reuse Phase 2 images) → publish → updater endpoint atomic update → `gh release view` verify; file run URL.
4. Box: backup cron (excluding secrets) + restore test (worktree map + one root listing); `webkitgtk` cap review (S1 4-thread cap) with memory measurement; file.
5. Hosted-KVM spike (time-boxed, 4h): attempt `tools/vm-qa` boot on hosted runner with 2 GB artifact; file go/no-go (expected no-go per §1.7; if no-go, close as documented, keep local VM as gate).

**Exit:**

- Hosted run PASS URL filed; self-hosted run PASS on `next` filed; release dry-run PASS filed.
- Backup log + restore proof filed; KVM spike decision filed.

### Phase 5 — Policy Relaxation + Docs (0.5 day, after migration)

**Entry:** Phase 3 exit (migration complete per S6: *"After the repositories are transferred (#338 Phase B)"* + S9 D-WORKFLOW-087: *"can be relaxed as soon as the migration is complete"*).

**Tasks:** Implement S6 table row-by-row with register rows citing relaxed rows (S6 acceptance): hook `pr/*` scans keep only fork-wanted checks, checker drafts/count become warnings, skill PR section splits other-projects vs fork, `fork-workflow.md` describes fork PR flow (assistant→`next` direct or PR-per-purpose per Q2 decision).

**Exit:**

- `tools/rules-check`, `tools/register-check`, push-guard constructed-violation proofs PASS with still-refused list named (S6 acceptance verbatim).

### Phase 6 — Tier 1 Review Only, Capped (during 0.0.x, parallel with 0.1 planning)

**Entry:** Phase 5 exit; Q13 answered or P0/P1 default.

**Tasks:** S4 Tier 1 (*"the fork's own 121,000 lines"* — S4) with `code-auditor` milestone tier + both seats (S4, S9 D-WORKFLOW-083); file `docs/audits/<date>-milestone-whole-codebase-tier-1/` with six phase files + `second-opinions/` + `tools/lint-audit-artifacts` PASS (S4 acceptance); triage to P0/P1/P2; VM-proof per behavioural finding (S4).

**Exit:**

- Tier-1 audit folder PASS + punch-list issue filed; P0/P1 resolved through Phase 7 or accepted by row before 0.1 (S4 gate narrowed per Q13); P2 accepted with IDs for 0.0.x.

### Phase 7 — Runner Step 0 Spec + One-Core Spike (for 0.1, after launch-path review)

**Entry:** Tier-3-launch-path-only review PASS (subset of S4 Tier 3: launcher + ES launch + RetroArch config/socket paths only, not full 185k) + Q14 answered.

**Tasks:**

1. Protocol spec `docs/spikes/<date>-runner-protocol.md`: verbs (pause/save/load/screenshot/quit), transport (Unix socket for runner, UDP for RetroArch baseline per S2), ES overlay/compositor design under sway (the missing Step-0 design from §1.11), fallback matrix per core.
2. Spike per S4-like acceptance adapted from S2: *"spike record under `docs/spikes/` with minarch's and Ludo's licences quoted from their trees and a line per feature the fork's work needs (achievements, states, exit, cards), saying which the runner has, gains or loses."* (S2) + GENERIC_X64 build with runner launching **one 2D core + one GLES core** (S2 version-1 requirement: *"first two cores ... one of each (a SNES core and the N64 core)"* — S2) + save/exit walks (FRAMEs) + `tools/time-to-play` table runner vs RetroArch on same guest (S2).
3. `rc_client` proxy proof: packet capture showing runner→`127.0.0.1:8080` shapes vs RetroArch's; file equivalence or delta + proxy change.

**Exit:**

- Spec + spike record + FRAMEs + time-to-play table filed in #336; register row for direction (S2 acceptance: *"The register row for the direction ... written the session the maintainer calls it."*); go/no-go for full Step 1 (weeks) as 0.1's feature.

### Deferred Past 0.1 (explicitly out, with home)

- Full Tier 2 (140k) + Tier 3 (185k) + patches-provenance table (*"one row per patch, with the count of rows equal to the count of patch files"* — S4): gradual over 0.0.x/0.1.x per S9 D-WORKFLOW-083, not gating 0.1 beyond P0/P1 + launch-path.
- Silent boot (S5): needs baseline comment + classifier + panel facts; schedule after runner default stabilizes (boot path changes otherwise).
- Site full (S3 MkDocs): releases page suffices until 0.1.
- Second Tiny (S1): order only if Phase 2–3 measure cold-build days as blocker after role-split; otherwise defer.
- Code-level rename (S9 D-WORKFLOW-085): own item with merge-cost budget, after 0.1.
- Forgejo/JJ, mail automation, QA-mail vault: future with threat models.

---

### Dependency Map (what the plan leaves implicit)

- Visible rename → `NAMING.md` → code rename later (S1 Choice 1 → S9 D-WORKFLOW-085): code rename must budget a full `upstream/next` rebase + ES re-pin + 4 rebuilds + VM; do not start before 0.1.
- `upstream/next` merges → hardware support (S9 D-WORKFLOW-084): pin per release, weekly cadence, freeze before 0.0.x; ES merges cost more than distribution merges (S2 divergence warning).
- Hosted CI ↔ local box (S1 Phase C/D): hosted for prose-only, local for builds/VM; hosted-KVM is experiment, not gate.
- Second box ↔ review ↔ runner (S1/S4/S2): second box helps only cold-build parallelism; review and runner need assistant time, not cores — do not buy hardware to fix scheduling.
- Tier 3 → runner (S4): full Tier 3 before runner deadlocks 0.1; narrow to launch-path-only, defer rest.
- Updater ↔ versioning ↔ cloud folder (S1/S3/S10): one design doc covers all three; no 0.0.1 without it.

---

**Bottom line:** Ship a smaller, proven 0.0.1 that the updater cannot brick and the licences cannot unship, finish the org/repos/identities properly, and put the runner, silent boot, full reviews, site, and second box behind gates the owner controls. The fork's quality is its process (S9 D-WORKFLOW-082: *"The fork's quality is its process -- the VM, the suites, the regression checks, the audits -- not the maintainer's line-by-line reading"*). Make 0.0.1 prove that process on one release before asking it to carry five projects at once.

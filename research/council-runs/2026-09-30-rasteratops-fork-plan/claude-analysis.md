# Council seat — independent analysis of the plan to fork ROCKNIX as rasteratops (#338)

## 0. Scope, sources, and two gaps in the corpus

I read the eleven embedded sources in full. Everything below cites them by path. Two things I needed were not in the corpus and I record them rather than paper over them:

1. **D-WORKFLOW-088 is not in the register excerpt.** The file `decision-register-fork-rows.md` is titled "D-WORKFLOW-080 to 088" and the brief says the same, but the table contains rows 080 through 087 only. If an 088 exists (a plausible candidate is a row on the assistant's account or the mail channel), it was made after this run's plan was frozen and I have not read it. Surface to the orchestrator.
2. **The plan's "two flagged choices" are one.** `issue-338.md` says *"Two choices are flagged for the maintainer before the council sits"* and Phase E says the packet carries *"the two flagged choices and the numbers"*, but only *"Choice 1 (flagged): a brand rename, not a path rename"* is labelled anywhere in the issue or its comments. I treat Phase D's shape (which cloud, or a second local box) as the de facto second choice, because the maintainer's opening message frames it as one; but the plan as written does not say so, and the packet promised the council something it does not contain.

The settled decisions (D-WORKFLOW-084 to 087) are taken as given. What follows is about the plan that gets from RC2's tree to 0.0.1 and beyond.

---

## 1. Claims and assumptions that are wrong, unproven, or contradicted by the sources

| # | Claim in the plan | Where | What the sources actually support | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Phase A is *"about a day of work plus the artwork"* | `issue-338.md`, Phase A heading; `issue-337.md` 23:46: *"A rename is about a day"* | Phase A's own checkboxes require: a fork of `rocknix-splash` with two renderer changes and a generated path (`issue-337.md` 02:03, 01:40); a change to two strings in the **separate** EmulationStation repository (`issue-338.md`: *"two interface strings"*; CLAUDE.md: *"`emulationstation` source lives in a separate git repo"*), which means an ES rebuild and a pin bump; a theme patch; *"the four images from one head"*; vm-qa; the RC2 rehearsal; devices *"on a yes"*; a release note in the maintainer's voice. A cold build of four devices alone *"is a day on one box"* (`issue-338.md` 00:09). | **Underestimated by at least a factor of three**, before the artwork and the yeses. |
| 2 | `distributions/<name>/` is part of a *brand* rename that leaves *"the internal paths and script names ... as upstream has them"* | `issue-338.md`, Choice 1 | `distributions/<DISTRO>/options` is the first layer of config resolution (CLAUDE.md: *"options are sourced in order — `distributions/<DISTRO>/options` → ..."*), and `config/path` defines the build system's paths (CLAUDE.md: *"`config/path` sets `TARGET_IMG=$ROOT/target`"*). The build outputs are `build.*/` (CLAUDE.md). Nowhere in the plan is it checked whether `DISTRO` names the build root, the image file name, or the release directory. In the LibreELEC lineage this system descends from (CLAUDE.md: *"built on the LibreELEC/CoreELEC cross-compilation system"*), the build directory is conventionally named by distro and device. | **Unproven and load-bearing.** If `DISTRO` names the build root, every device's first Phase A build is cold, and *"warm rebuilds are minutes"* does not apply to 0.0.1. If it names the image file, `tools/fork-publish-release` and the updater's expectations change too. One `grep DISTRO config/path scripts/image` settles it and must precede any estimate. |
| 3 | The player-visible surface is *"exactly this much a player reads"*: DISTRONAME, os-release, info screen, splash, logo, two interface strings, eleven printed lines | `issue-338.md`, Phase A | The measurement is a literal-string count on *"the upstream-bound roots"* of the distribution tree. It cannot see (a) the EmulationStation fork's translations — 154,087 lines of them (`issue-339.md`) — where *"ENABLE ROCKNIX SCREENSHOT"* exists once per locale; (b) names composed at run time from `DISTRONAME` and shown by other protocols (the hostname a router lists, a network file share's name, a Bluetooth name) — the product has Wi-Fi and networking pages (CLAUDE.md, `issue-335.md`); (c) the ES theme repository. | **Overclaimed.** "Exactly" is a count of one tree; the surfaces a player meets are in three repositories and on the network. |
| 4 | Phase D: *"a cold build of one device is hours and about 90 GB of root; four devices plus the source cache is about 400 GB"* | `issue-338.md`, Phase D | The same issue, 00:24: *"a device's build root is 110 to 147 GB, the source cache 38 GB ... 2 TB is the floor"*. 4 × 147 + 38 ≈ 626 GB, not 400. CLAUDE.md: *"A first build needs ~200GB disk"*. | **Contradicted within the issue.** The Phase D checkbox must be corrected to the later numbers before anything is priced. |
| 5 | The `--repo` sweep is *"24 files"* | `issue-338.md` 00:05 | 05:02: *"110 files of the tree"*; 05:14: the sweep actually landed in *"15 files"* (`1633cbcac2`). | Three counts for one task. The checkbox's referent (*"the count is in the plan's first comment"*) is the stale one. |
| 6 | `rasterabot` is *"the project account"*, so *"posts read as the project's"* | `issue-338.md`, Phase B checkbox | 02:08: three accounts are distinguished — *"the maintainer's, the project's, the assistant's"* — and rasterabot is *the assistant's*: *"A commit, comment or PR made by the assistant is visibly the assistant's"*; *"Anything that speaks for the project — a release note ... goes out under the maintainer's or the project's account"*. But no separate project account was created (members: *"maxengel, pixelelated, rasterabot"*, 05:14), and `gh` now holds *"rasterabot as its active account"* (05:43). | **Contradicted.** `tools/fork-publish-release` uses `gh release` (`issue-337.md` 23:28); as things stand, 0.0.1's release note *"in the maintainer's voice"* would be published by the assistant's account, which the 02:08 comment says must not happen. Decide, and make the tool pick the account. |
| 7 | The assistant's token scopes and revocation are clean: *"revoked without touching anyone else's"* | `issue-338.md` 02:08 | 05:43: *"owner-only calls use the owner's token in a substitution"*; 05:14 and 05:43 show collaborator grants made *"with the owner account"* from the box. The maintainer's token is still on the box. | **Half true.** The box holds both identities. The scoping benefit exists only once the owner's token is removed from the box (or confined to a step the maintainer runs). |
| 8 | Phase E: the council sits *"before Phase A starts"* and *"Once A-D are confirmed by the maintainer"* | `issue-338.md`, Phase E | Phase B was executed in full on 2026-09-30 (transfer, token, key, mail) before any sitting; Phase D was settled in a comment (*"the second Tiny is the purchase"*, 00:24). | The plan's own gate order was not the order taken. Not fatal — B was the reversible part — but it means the plan's gates are aspirations unless something enforces them. |
| 9 | *"version 0.0.1 is RC2's tree (`69e6039f8f`)"* | `decision-register-fork-rows.md`, D-WORKFLOW-084 | Phase A produces a new head (new `distributions/`, splash pin, theme patch, strings). `next` has already moved (`1633cbcac2`, `e7d7b35884`). | Imprecise. 0.0.1 is RC2's tree *plus* the identity; the register should say which BUILD_ID it is once it exists. |
| 10 | The tier-1 review is *"about twenty packets a seat"* at *"roughly 12,000 lines"* a packet | `issue-339.md` | 121,000 / 12,000 ≈ 10. Tiers 2 and 3 use the 12,000 figure consistently (*"twelve to fifteen"*, *"fifteen"*). The historical density is lower: *"the fix-round audit read 40,000 lines in eight packets"* = 5,000 lines a packet, at which the three tiers are ≈ 24 + 28 + 37 ≈ 90 packets a seat, ≈ 180 for both. | **The programme is sized at two incompatible densities.** At the proven density it is roughly twice what the issue implies and every finding still needs a VM proof. |
| 11 | *"Every 3D core ROCKNIX ships that matters ... has a GLES path"* | `issue-336.md` 23:12 | Asserted, not measured. The same comment says the Vulkan interface waits *"until a core we want has no GLES path"*. | Unproven per core. It decides whether the runner's version-1 scope holds; it is a table to make, core by core, not a sentence. |
| 12 | The wordmark is *"58 x 6 font pixels"* | `issue-337.md` 01:40 | The specification two hours later: *"57 x 6 cells"* (02:03). | One of the two numbers is wrong; the generated path decides it. Small, but the spec is what the maintainer draws against. |
| 13 | The site repository is `rasteratops/rasteratops.org` | `issue-338.md` 05:02 | The domain the maintainer owns is `rasteratops.com` (`issue-338.md` 04:39: *"The maintainer's domain is `rasteratops.com`"*). | Name the repository after the domain that exists. |
| 14 | The updater *"reads ROCKNIX's GitHub releases"* | `issue-334.md` | `issue-337.md` 23:46: *"the updater asks an update endpoint by POST and follows the address it returns"*. | Two descriptions of one mechanism. If the second is right, pointing it at *"the fork's own releases"* is not enough: something must answer the POST. See risk R2. |

---

## 2. Risks, ordered by expected cost

Expected cost is my judgement of probability times what it costs when it lands, for one maintainer and an assistant. The plan names none of R1–R5 as risks; it names parts of R6 and R8 as tasks.

### R1. Upstream drift with no cadence, and the EmulationStation merge in particular — high, recurring

The reason to remain a fork is *"keeping `upstream/next` merged for the hardware work"* (`issue-334.md`), and the plan says the fork *"would go on doing so"* (`issue-336.md` 23:12). It never says **when**, **who decides**, or **what a merge must pass**. Meanwhile the fork's divergence is not small: +79,181 lines on the distribution roots and +42,180 on ES (`issue-339.md`), eight RetroArch patches that rebase on every RetroArch bump (`issue-334.md`), and the GENERIC_X64 target that changes `scripts/image`, `scripts/extract` and `scripts/build_distro` (`issue-334.md`) — the fork's most important QA tool lives in the files upstream forbids changing, so every upstream touch of the image scripts is a conflict in the VM-first process itself.

The ES fork is the worst of it and the plan barely mentions it beyond "transfer it". `issue-336.md` says it plainly: *"the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge."* The runner direction (#336) increases exactly this divergence. And the ES pin currently points at a branch named `test/qa-integration` (`issue-339.md`) — a test branch name is the production interface.

Every merge costs a build, the suites, and device yeses; skipping merges loses the hardware work that justifies staying a fork. **Expected cost: a build day plus a QA cycle per merge, indefinitely; or the slow loss of the fork's reason to exist.** Mitigation is a cadence and a gate (see §3.2) and a decision on ES: track upstream ES continuously, or freeze and cherry-pick.

### R2. The update channel and release artifacts — medium probability, very high impact

This is the failure a player of an immutable OS actually feels: a device that cannot update, or updates to the wrong thing.

- The mechanism is unsettled (Claim 14). If the updater POSTs to an endpoint (`issue-337.md`), the fork needs a service that answers, which is infrastructure the plan does not budget — Phase D is a build box, not a web service.
- The version scheme changes shape: RC2 was `rc2-20260929`; 0.0.1 is `OS_VERSION=0.0.1` with *"the date stays in the file names as now"* (`issue-337.md` 23:46). Whether an RC2 device's updater compares versions, dates or tags, and whether it will *offer* 0.0.1, is unproven. The planned rehearsal *"proves the upgrade path keeps a player's ROCKNIX-era state"* (`issue-338.md`) — that is a `.update` drop; it does not prove discovery through the updater's own path.
- Phase C assumes *"the image arrives as a release artifact (2 GB)"*. GitHub's per-asset ceiling for release assets is 2 GiB (outside the corpus; confirm against GitHub's documentation). The fork is at the ceiling today; one added package crosses it and the release page stops being the channel.
- The old address redirects (`issue-338.md` 05:14), so RC2 devices still reach the releases page; but a changed tag scheme can break a parser the redirect cannot fix.

**Mitigation:** an update-discovery proof from an RC2 guest is a Phase A exit criterion (§6), and the release tool asserts asset size before publishing.

### R3. Phase A's hidden costs, chiefly whether `DISTRO` names the build root — high probability, medium cost

Claim 2 above. If `DISTRO` names `build.*`, Phase A's first build of each device is cold: *"a cold rebuild of four devices is a day on one box"* (`issue-338.md` 00:09), and the estimate "about a day" was for edits alone. A second consequence follows: the plan's copy of `distributions/ROCKNIX/kernel_options` and `config/functions` into `distributions/rasteratops/` (`issue-338.md`, Phase A) is a fork by copy. Upstream's later edits to those files land in a directory the fork no longer reads, silently. No check is proposed.

**Mitigation:** either keep `distributions/ROCKNIX/` and change its *contents* (which is what "brand rename, not path rename" actually says), or copy and add a merge-time diff between the two directories to `tools/box-check` or a rules check.

### R4. The review programme's size, and the gate it puts on 0.1 — high probability, high opportunity cost

D-WORKFLOW-083 and `issue-339.md` gate 0.1 on *"Every punch item resolved through Phase 7 before `0.1`, or accepted by a register row"*, and `issue-339.md` says tier 3 *"is read before that work starts"* (the runner). At the proven packet density (Claim 10) that is ~90 packets a seat before the fork's first product step, plus a VM proof per finding. Two further problems the plan does not name:

- **The reviewer is the author.** D-WORKFLOW-082 removed the maintainer's reading; upstream's review is gone with D-WORKFLOW-087; no contributors by decision. The code-auditor seats and the writer are the same assistant. `issue-335.md` records the pattern: *"tonight it missed a dead page script for a week (blindspot 69) and caught it once the stub was made honest"*. Self-review catches what the process makes visible; correlated blind spots are the residual, and nothing in the plan measures them.
- **Tier 2 fixes are merge debt.** *"Findings here are the fork's to fix now, since there is no longer anyone to send them to"* (`issue-339.md`) fixes upstream-owned OS scripts, launcher, recipes and quirks in place — the very files R1 merges — and contradicts D-WORKFLOW-082/084's carve-out for *"small generic fixes each project's upstream can read"* (the developers *"have taken the maintainer's PRs before"*, `issue-335.md` 23:31; D-WORKFLOW-087 parks submissions *"for now"*, not forever).

**Mitigation:** re-scope tier 3 to the launch path the runner touches; carry tier 2 fixes as patches/overrides with an upstream-offer list; put a mechanical check behind every class of finding so the process, not a re-read, catches the next one.

### R5. A self-hosted runner on a public repository, and the assistant's token with `Workflows` write — low probability, very high impact

The repository is public (`issue-338.md` 05:02: *"public, a fork"*) and *"a public repository cannot refuse"* pull requests (`issue-337.md`). A self-hosted runner is already registered for it (`issue-338.md` 05:14: *"the runner's example in `fork-generic-x64.yml`"*; Phase C: *"a self-hosted runner (serval today ...)"*). GitHub's own guidance is not to use self-hosted runners with public repositories, because a workflow triggered by an outside pull request can execute on the runner's host (outside the corpus; GitHub's Actions security hardening documentation). The runner is the maintainer's build box on the maintainer's network.

Separately, rasterabot's token has *"Workflows read and write"* (`issue-338.md` 05:14). That lets the assistant's account change what runs on the maintainer's hardware, and D-WORKFLOW-082 means no human reads those changes. This is a deliberate trade — the assistant is the operator — but the plan grants it without saying so.

**Mitigation:** organisation Actions settings requiring approval for all outside collaborators; the self-hosted workflow restricted to `push` on `next` and `workflow_dispatch`, never `pull_request`/`pull_request_target` with a checkout; a branch protection or CODEOWNERS entry for `.github/workflows/**` that the owner alone can satisfy (a small, bounded exception to D-WORKFLOW-082 that protects the box rather than the code).

### R6. What one maintainer's yeses can carry — high probability, medium cost

The maintainer is the only gate that cannot be automated: per-action yeses on devices (CLAUDE.md: *"Nothing runs on one without a per-action yes"*), artwork (`issue-337.md` 02:03), purchases (Phase D), owner-only GitHub actions (five separate owner interventions on 2026-09-30 in `issue-338.md`), and reading reports. The plan opens, in one day: 0.0.1, three repository transfers, CI on hosted runners, a VM-on-hosted-runner experiment, a second box, a three-tier review, a runner spike, silent boot, policy relaxation, a site, a mail channel, and upstream merges. `issue-335.md` sizes the runner alone at *"weeks"*.

**Expected cost:** stalls at the maintainer's inbox, or device tests skipped for lack of a yes. Mitigation is a work-in-progress limit (§7).

### R7. The cloud folder rename splits a player's sync — medium, medium

Phase A changes *"the cloud folder's default name (`/ROCKNIX` in a player's cloud today — read both, D-WORKFLOW-050)"*. Reading both does not settle writing: a fresh install writing to a new folder and an upgraded device keeping `/ROCKNIX` means one player's two devices sync to two places. The folder is the player's data, not the brand; least surprise (D-UI-042, CLAUDE.md) says leave it. **Cut from 0.0.1.**

### R8. Licence, attribution, and infrastructure the fork still borrows — low legal risk, medium operational

- **The fork's own licence statement is absent.** `LICENSE.md` says *"Original software and scripts developed by the ROCKNIX team are licensed under the terms of the GNU GPL Version 2"*. Nothing in the plan adds the sentence that says what rasteratops' own ~121,000 lines are under, or what licence its wordmark and logo carry. Without it the fork's artwork is all-rights-reserved by default — the same trap `issue-336.md` records for MinUI (*"code with no licence is all rights reserved by default"*).
- **The GPL source obligation is met by existing** (`issue-334.md`) only while the pinned upstream sources exist. Keep the `sources/` cache (38 GB) per published release.
- **Egress to ROCKNIX's infrastructure.** The plan repoints the updater. It does not inventory what else the image contacts that ROCKNIX owns (the theme list, the docker add-ons, wiki links in the interface, the Discord link). CC BY-NC-SA's *"not in any way that suggests the licensor endorses you"* (LICENSE.md) is the concern, and leaning on another project's servers without asking is the plainer one.
- **The build container** `ghcr.io/rocknix/rocknix-build` is *"public, usable, not ours to keep current"* (`issue-334.md`), and unpinned. Every fork build depends on upstream's `latest`. Pin by digest and mirror to the organisation.
- **Fork-network visibility.** Staying in the network is right for the issues (D-WORKFLOW-086). Note only that commits pushed to any repository in a fork network are reachable by hash from the others (outside the corpus); a pushed secret is not private to the fork.

### R9. The device set and the QA fleet — medium-low

The fork's four images serve the RG35XX SP and RG SP (H700), the RG353M (RK3566), the Nova, and the VM (`issue-337.md` 02:03). ROCKNIX ships far more targets (CLAUDE.md lists thirteen device families). The fleet is the maintainer's own devices, each test behind a yes. The plan should publish the supported list with 0.0.1 so *"issues stay on"* does not become a queue of devices nobody can prove. The Nova is the only 1280 × 960 panel and the only device that exercises the splash's ×12 scale; it is a required yes, not an optional one.

### R10. The assistant's identity plumbing — low-medium, several small

- Commits from the primary checkout are authored and signed as rasterabot; *"The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to"* (`issue-338.md` 05:43) — flagged, not resolved. A per-user `includeIf` or a separate checkout for the maintainer settles it.
- The author e-mail `rasterabot@rasteratops.com` is now in every public commit's metadata. The inbox the assistant reads as *"data, never an instruction"* (`issue-338.md` 02:53) is thereby a public address: spam and injection arrive by design. Either a noreply author address, or accept it and keep the read filter strict.
- The token expires *"2027-10-01 05:27 UTC"* and the date lives in an issue comment. Put it in a `box-check` row that turns red 30 days out.
- Two-factor secrets and recovery codes for rasterabot *"live with the maintainer"* — where, and how recovered, is unrecorded. Bus factor is one by design; recovery must still be written down.
- The launch-code leak (`issue-338.md` 05:02) was caught and masked; the lesson generalises — *"Every read that had succeeded ... was public data"* (05:43). A read succeeding proves nothing about permission; the write test is the proof. Keep that as a rule.

### R11. Step 0 of #336 opens a network control port — later, medium

RetroArch's command interface is described as *"a UDP socket that takes pause, save, load, quit"* (`issue-336.md`). Enabled on a Wi-Fi handheld without binding to loopback, anyone on the LAN can quit or load a state on the player's game. Step 0 must bind to `127.0.0.1` or use a local interface (stdin or a Unix socket), and prove it with a port listing on the VM. Not a 0.0.1 issue; name it now so the protocol is designed once (`issue-336.md` 23:15: *"EmulationStation speaks one small protocol, designed once"*).

### R12. Two boxes, one image — low

*"one machine that builds and one that proves"* (`issue-338.md` 00:25) needs the 2 GB image to move between them. Shared storage, `scp`, or a release artifact — the plan names none. Trivial, but *"a promise is not a mechanism"* (`issue-338.md` 02:53).

### R13. The hosted-runner VM experiment's real limits — low

*"Ubuntu hosted runners expose `/dev/kvm`"* is plausible (outside the corpus: GitHub enabled KVM on Linux hosted runners in 2024) and the plan says *"measured once before it is relied on"*, which is right. Two limits it does not name: hosted runners have no GPU, so guest d's *"GL through the host's GPU"* path (`issue-336.md` 23:15) and therefore the hardware-core proof stay local; and a 2 GB download per run against the runner's disk and the six-hour limit is a cost per push, not once.

---

## 3. What I would change

### 3.1 Phases and order

The plan's phases are fine as buckets and wrong as an order, because it lets everything start at once and puts the council after the reversible work. My order:

| Step | Content | Why here |
| --- | --- | --- |
| 0 | **Harden what B already did** (§2 R5, R10): Actions settings, runner triggers, team-based write, commit identity split, token-expiry row, recovery record, `fork-publish-release` account choice | Cheap, all reversible, and every later push runs through it |
| A0 | **Inventory before edits**: what `DISTRO` drives; every ROCKNIX-owned endpoint the image contacts; every player-visible name across three repositories and the network | Turns Phase A's estimate from a guess into a list |
| A | **0.0.1: the visible identity, minimal** (§3.3) | The maintainer's stated goal; the one thing the licence makes non-optional (`issue-334.md`) |
| M1 | **First upstream merge after 0.0.1**, measured | Establishes the merge cost with the new `distributions/` layout and sets the cadence (R1) |
| #341 | **Relax the upstream-only policies** | Removes friction from every later PR; cheap; depends only on B |
| T1 | **Tier-1 review of the fork's own code → 0.0.2** | The first real act of the new OS; the punch list is the `0.0.x` list (`issue-339.md`) |
| B′ | ES fork and splash fork in the organisation on a `next`-style branch; site repository | Needed before ES work; not before 0.0.1 |
| S0 | **#336 step 0** (RetroArch under ES over a *local* command channel) **→ 0.1**, after a launch-path slice of tier 3 | The fork's direction, in days not weeks (`issue-335.md`) |
| D | **Second box** when the first cold-build day arrives (possibly at A if Claim 2 resolves badly) | Decision is made (`issue-338.md` 00:24); provisioning waits for need |
| T2, #340 | Tier 2 gradually as patches/overrides; silent boot | After the direction is set; both touch upstream-owned files |
| C′ | VM suites on hosted runners, measured once | An experiment, never on the critical path |

### 3.2 Gates

The plan has checkboxes; it has almost no *gates* (a condition that stops the next step). I would add four:

1. **The merge gate.** Upstream `next` is merged at each `0.0.x` cut or every four weeks, whichever is first; a merge is accepted only when the VM suites pass and the devices whose kernel, bootloader, DT or quirks the merge touched have been booted on a yes. A merge that conflicts in more than N files (N set by M1's measurement) opens an issue before it is resolved, so the divergence is seen rather than absorbed.
2. **The update-discovery gate.** No release is published until a guest running the previous release discovers and installs the new one through the updater's own path, not a `.update` drop.
3. **The egress gate.** No release is published while the image contacts a ROCKNIX-owned host the fork has not chosen to depend on (a DNS log of a boot and menu walk on the VM, filed with the release).
4. **The maintainer-hours gate.** Each phase states the maintainer's own hours (yeses, artwork, approvals) before it starts; a phase that needs more than the maintainer has that fortnight waits.

### 3.3 Scope: what to cut from 0.0.1, and what to add

**Cut:**

| Item | Where the plan has it | Why cut |
| --- | --- | --- |
| The cloud folder rename | Phase A, `issue-338.md` | Player data, not brand; splits a fleet's sync (R7) |
| The pixel triceratops | `issue-337.md` 02:03 | The wordmark *"stands in until then"* (`issue-338.md`); do not block a release on artwork the maintainer has not finished |
| The site | Phase A's attribution and `issue-337.md` item 3 | The release page carries the attribution; the site is 0.0.2's |
| The VM-on-hosted-runner experiment | Phase C | An experiment with no bearing on 0.0.1 |
| The second box's provisioning | Phase D | Unless A0 shows a forced cold build; then it moves to A |
| Copying `kernel_options` and `config/functions` into a new directory | Phase A | Fork-by-copy (R3); change the contents of the existing directory or add the diff check |
| Translated forms of the two interface strings | implied by Phase A | Only if the fork ships English alone (owner question Q6); otherwise they are in scope and the estimate grows |

**Add:**

- A licence and credits statement for the fork's own work and artwork (`LICENSE.md`, README) — the one legal thing the plan forgot (R8).
- The `DISTRO` check and the egress inventory (A0).
- The updater-discovery rehearsal (gate 2).
- The published device list.
- Pinning the build container by digest.
- The release tool asserting each asset is under the platform's size ceiling.

---

## 4. What is missing entirely

1. **A cadence and a gate for merging upstream** (R1). The plan's largest recurring cost has no schedule, no owner, no acceptance test.
2. **A decision on the EmulationStation fork's relationship to upstream ES.** Track continuously, or freeze and cherry-pick; a production branch name; the pin's URL after transfer. The plan says only "transfer it".
3. **The update service.** If the updater POSTs to an endpoint (`issue-337.md`), who answers, on what host, with what uptime, and what the device does when it is down.
4. **The fork's own licence statement** and the artwork's licence (R8).
5. **An egress inventory** of the image's network contacts.
6. **Security settings for the organisation's Actions** and the self-hosted runner (R5).
7. **A team or standing grant for rasterabot's write access.** Today it is a per-repository collaborator grant made by hand (`issue-338.md` 05:43: *"A new repository in the organisation needs the same grant"*).
8. **Recovery:** where rasterabot's 2FA secret and recovery codes are, and how the box is rebuilt from the blueprint if serval dies (Phase D mentions *"the estate's build-box blueprint"* but 0.0.1 does not depend on it being current).
9. **A definition of "supported"** for 0.0.1: which devices, which locales, which cloud providers; what an issue from a player with a fifth device gets.
10. **A rollback story:** a device on 0.0.1 that must go back to RC2 or to ROCKNIX proper — is it an update or a reflash, and does the runbook say so.
11. **The measurement of correlated blind spots** in an author-reviews-author process (R4): at minimum, a count of findings later proved wrong or missed, kept as the review's own quality number.
12. **Per-core GLES support table** for #336 (Claim 11).
13. **The ES locales' count of the two strings** (Claim 3).
14. **The second flagged choice** (§0).

---

## 5. Questions only the owner can answer

| # | Question | What it unblocks |
| --- | --- | --- |
| Q1 | Does `distributions/ROCKNIX/` stay and change its contents, or does a `distributions/rasteratops/` replace it — and if `DISTRO` names the build root, is a cold rebuild of four devices acceptable for 0.0.1? | Phase A's estimate; whether Phase D's second box moves forward to A |
| Q2 | Who publishes a release: the maintainer's account (the project's voice) or rasterabot (the operator)? | `tools/fork-publish-release`'s account; the `gh` active-account arrangement (Claim 6) |
| Q3 | Does the maintainer's token stay on the box for owner-only substitutions, or do owner steps become the maintainer's own ceremony? | The scoping claim (Claim 7); R5's blast radius |
| Q4 | What licence do the fork's own code and artwork carry — GPL-2 for the code by inheritance, and for the wordmark and logo, CC BY-NC-SA as upstream does, or something else? | The `LICENSE.md` and README additions in 0.0.1 |
| Q5 | Upstream merge cadence: at each `0.0.x`, monthly, or on upstream releases only — and does the ES fork track upstream ES or freeze? | Gate 1; the ES fork's branch plan |
| Q6 | Which locales does 0.0.1 claim? | Whether the two interface strings are 2 edits or 2 × locales |
| Q7 | Is the cloud folder name part of the brand (rename) or the player's data (leave)? | R7; the D-WORKFLOW-050 interaction |
| Q8 | Is a self-hosted runner on a public repository acceptable with the hardening in R5, or does the image workflow become `workflow_dispatch`-only run by the assistant? | Phase C's shape; how the second box joins CI |
| Q9 | Should the assistant's account be allowed to change `.github/workflows/**` without an owner's review, given D-WORKFLOW-082? | R5; a possible CODEOWNERS rule |
| Q10 | How much of the maintainer's own time per fortnight is available for yeses, artwork and owner actions? | Gate 4 and the WIP limit (§7) |
| Q11 | Is tier 3 of #339 a hard precondition for #336 step 0, or is a launch-path slice enough? | Whether 0.1 is a quarter away or a fortnight |
| Q12 | If the updater is endpoint-based: will the fork run a service, or is the updater changed to read the releases page directly? | R2; whether infrastructure beyond the build box exists |
| Q13 | Which devices does 0.0.1 publicly support, and what does the release note say to owners of others? | The device list; the issue template |

---

## 6. Recommended plan, with entry and exit criteria an agent can verify

Each exit criterion names an artifact: a frame at the panel's size, a `BUILD_ID`, a suite's PASS line, a stamp, a measurement, or an API read.

### Step 0 — Harden the plumbing Phase B created

**Entry:** the transfer is complete (`issue-338.md` 05:14).
**Exit:**
- `gh api repos/rasteratops/distribution/actions/permissions` and the organisation's Actions settings read: approval required for all outside collaborators; the self-hosted workflow's `on:` block contains no `pull_request`/`pull_request_target`.
- rasterabot's write comes from a team with write on all repositories (`gh api orgs/rasteratops/teams/<team>/repos` lists `distribution`), not a per-repo grant.
- A `box-check` row reads the token's expiry (`2027-10-01`) and fails within 30 days of it.
- `git config --show-origin user.name` in the primary checkout resolves to rasterabot only under the assistant's user or a named `includeIf`; a test commit made as the maintainer does not sign as rasterabot.
- `tools/fork-publish-release --dry-run` prints which `gh` account it will publish with, and it matches Q2's answer.
- A recovery record for rasterabot (location of 2FA secret and codes) exists outside the tree, cited by path in an issue comment without contents.

### Step A0 — Inventory before edits

**Entry:** Step 0 done.
**Exit:**
- A comment on #338 quoting the lines in `config/path`, `scripts/image` and `scripts/build_distro` where `DISTRO` appears, and stating whether it names the build root, the image file name and the release directory (Q1 answered from evidence).
- A DNS/connection log of a fresh RC2 boot and a full menu walk on guest d, listing every external host contacted, with each marked *fork-owned / third-party / ROCKNIX-owned*.
- A table of every player-visible name: the distribution tree's list from `issue-338.md`, plus the ES fork (source strings and each locale), the theme, and what the VM presents as hostname, share name and any Bluetooth/mDNS name (read with the VM's own tools over `tools/vm-serial`).
- The per-core GLES table for #336 started (not needed for A, but it costs a session and de-risks 0.1).

### Step A — 0.0.1, the visible identity

**Entry:** A0 filed; the maintainer has approved the interim wordmark (`issue-337.md` 01:40); Q1, Q2, Q4, Q6, Q7 answered as register rows.
**Work:** `DISTRONAME`, `OS_VERSION=0.0.1`, os-release, info screen, the splash fork's `svg_paths[]` and two renderer lines, the theme's logo text, the two English strings (and locales per Q6), the eleven script lines, the updater's address, `LICENSE.md`/README statements, the container pinned by digest, the device list in the release note.
**Exit:**
- A frame from guest d at 640 × 480 showing the splash with the wordmark at whole-pixel scale 6 (384 × 192 on screen per `issue-337.md` 02:03), filed under `docs/qa-frames/`.
- `/etc/os-release` and the info screen read the name and `0.0.1` (the two lines filed, read over `tools/vm-serial`).
- Four images from one head with the same `BUILD_ID`, filed.
- `tools/vm-qa` PASS lines for every suite on the 0.0.1 x64 image.
- **Update discovery:** a guest booted from the RC2 image discovers 0.0.1 through the updater's own path and installs it; `/storage` state (a save, a setting, the cloud configuration) survives; the same on a clean install. Both proofs filed.
- Egress: the A0 log repeated on 0.0.1 shows no ROCKNIX-owned host except any the register has explicitly accepted.
- Every player-visible name in A0's table reads rasteratops on the VM (the ones that need a device are marked for the device pass).
- Devices on a yes: the RG35XX SP (H700, 640 × 480) and the Nova (SM8550, 1280 × 960, scale 12) at minimum — a frame from each panel, and the update-from-RC2 path once on a device.
- Release published; `gh release view 0.0.1 --repo rasteratops/distribution --json body` contains the attribution sentence in the wording the register row records; every asset under the platform's size ceiling, `.sha256` beside each; the publishing account is Q2's.
- A register row records the `BUILD_ID` as 0.0.1 (correcting D-WORKFLOW-084's `69e6039f8f` reading).

### Step M1 — The first upstream merge, measured

**Entry:** 0.0.1 published.
**Exit:**
- `git merge upstream/next` on a worktree; the count of conflicting files, split by upstream-owned / fork-owned / `scripts/image`-family, filed as a comment.
- Suites PASS on the merged x64 image; devices booted on a yes where the merge touched their kernel/bootloader/DT/quirks (the list of touched device files filed first).
- If `distributions/` was copied (Q1): a `diff distributions/ROCKNIX distributions/rasteratops` read filed, and the check added to `tools/box-check` or `rules-check`.
- A register row sets the cadence and the conflict threshold N from this measurement (gate 1).

### Step #341 — Relax the upstream-only policies

**Entry:** M1 done (so the relaxed guard is proven on a real merge).
**Exit:** the criteria `issue-341.md` already states: `tools/rules-check`, `tools/register-check` and the push guard's constructed violations re-run, with the ones that still refuse named; each relaxation a register row citing the row it relaxes.

### Step T1 — Tier 1 review → 0.0.2

**Entry:** #341 done; packet density fixed at the proven 5,000 lines (Claim 10) and the packet count written down before the first packet.
**Exit:** `docs/audits/<date>-milestone-whole-codebase-tier-1/` complete, `tools/lint-audit-artifacts` PASS; a punch-list issue; each punch item's VM proof filed; a mechanical check added for each *class* of finding (a learning that is a procedure becomes a tool, CLAUDE.md); 0.0.2 published by Step A's exit criteria; the audit's own quality number (findings later contradicted or missed) started.

### Step B′ — The remaining repositories

**Entry:** any time after Step 0; required before S0.
**Exit:** the ES fork and the splash fork in the organisation, each on a production-named branch, each pin in its `package.mk` a full commit hash at the organisation's URL (CLAUDE.md: *"Pin git sources with the full commit hash"*); the site repository named for the domain that exists (`rasteratops.com`); `CONTRIBUTING.md` and the PR template say the project takes no contributions.

### Step S0 — #336 step 0 → 0.1

**Entry:** B′; a launch-path slice of tier 3 read (the files the launcher and pause page touch, not 185,000 lines) unless Q11 says otherwise; the per-core GLES table complete.
**Exit:** RetroArch's menu and on-screen text off, driven from ES over a **local** channel; a port listing on the VM shows nothing bound beyond loopback; `tools/time-to-play`'s two numbers on the same guest against RC2's 1.05 s / 2.03 s (`issue-336.md`) filed as a table; save/load/quit/screenshot walked with frames; hardware cores unchanged (the N64 core launches and returns, frames filed); the RG35XX SP on a yes.

### Step D — The second box

**Entry:** the first day two cold builds are needed at once (possibly Step A per Q1), or S0's runner work begins.
**Exit:** provisioned from the blueprint; `tools/vm-qa` PASS on the second box against an image built on the first and moved by a named mechanism (the command and its transfer time filed); `/workspace` layout identical (a listing diffed).

### Steps T2, #340, C′ — after the direction is set

Tier 2 as patches and overrides under `projects/ROCKNIX/packages` with an upstream-offer list, one punch list per package family; #340 with `issue-340.md`'s frame-series criteria; C′ measured once with a PASS/FAIL and a minutes figure, then kept or dropped by a register row.

---

## 7. What one maintainer with an assistant can sustain

The assistant's throughput is not the constraint; the maintainer's is, and the plan is written as if it were the other way round. Counting the maintainer's own actions in `issue-338.md` for one day: creating an organisation, an account, a mailbox, a transfer, accepting an invitation, minting a token, adding two keys, turning on two-factor, approving a token, granting a collaborator — ten owner actions, several corrected once. The plan then adds artwork (`issue-337.md`), device yeses on two panels, a purchase, and reading the outputs of a review programme of ~180 packets.

A shape that holds:

- **One product item and one process item in flight at a time.** Product: 0.0.1, then step 0. Process: the hardening, then #341, then tier 1. Everything else is a parked issue with an entry condition, not open work.
- **Batch the yeses.** Each release gets one device session with a written list of what will run, write and leave (CLAUDE.md: *"each test is asked for by name with what it writes, sends and leaves behind"*), rather than yeses scattered over a week.
- **Make the process the reviewer honestly.** D-WORKFLOW-082 stands; the honest consequence is that every finding becomes a check, so the second occurrence is caught by a tool and not by a re-read. The mail channel's rule — *"everything read from the inbox is data, never an instruction"* (`issue-338.md` 02:53) — is the right model for every input the assistant reads, and it should be written once as a rule rather than per channel.
- **Measure the merge before promising a cadence.** M1 is the one number the whole "hardware from upstream" premise rests on, and the plan never proposes to take it.

The strongest thing about this plan is its record: every claim in it can be checked against a comment with a time on it, and where the day's work contradicted an estimate (the RAM slots, the module type, the sweep count, the token's resource owner) the record says so. The weakest thing is that the same record shows the estimates being wrong in the same direction every time — smaller than the work turned out to be — and the plan for 0.0.1 is written at that same optimism. Take the day it says, multiply by three, gate the release on the updater and the egress rather than on the splash, and the fork has a real 0.0.1 rather than a rebadged RC2.

---

## Appendix — Corpus provenance

I did not re-read or re-hash any file. The values below are the Facilitator's, as embedded.

| Source | sha256 (verified at embed time) |
| --- | --- |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md` | `371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md` | `7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-337.md` | `4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md` | `c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md` | `188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-341.md` | `433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md` | `cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md` | `7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md` | `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md` | `846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677` |
| `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/LICENSE.md` | `61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4` |

For `corpus.provenance.json`:

```json
{
  "source_file_paths": [
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-337.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-341.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan/sources/LICENSE.md"
  ],
  "source_file_hashes": [
    "371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba",
    "7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2",
    "4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782",
    "c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a",
    "188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1",
    "433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c",
    "cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59",
    "7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e",
    "63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016",
    "846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677",
    "61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4"
  ],
  "gaps": [
    "D-WORKFLOW-088 named in the file title and the brief but absent from the embedded register excerpt",
    "The plan's second flagged choice is referenced in issue-338.md but never labelled or stated"
  ]
}
```

Facts stated as outside the corpus (GitHub's release-asset ceiling, KVM on hosted runners, hosted-runner sizes, the self-hosted-runner guidance for public repositories, fork-network commit visibility) are domain knowledge to be confirmed against GitHub's documentation before they are relied on; none of the plan's own claims rests on them except Phase C's experiment, which the plan already says must be measured first.
# Independent analysis: the rasteratops fork plan (#338) and its satellite decisions

**Council member analysis, 2026-09-30.** Scope per the brief: the fork itself is settled (D-WORKFLOW-084 to 087) and is not re-litigated here. What follows examines the plan that gets from RC2's tree to 0.0.1 and beyond.

---

## 0. Provenance and corpus gaps

`corpus.provenance.json`:

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
  ]
}
```

I did not re-read or re-hash these files; the hashes above are the Facilitator's embed-time values, recorded as instructed.

**Referenced but not embedded — gaps that bear on findings below:**

1. **issue-340.md's first comment.** The body says *"What exists today is in the first comment (the kernel command line the bootloaders write, where the splash runs and what may draw after it, what shutdown prints)"* — no comments were embedded for #340. The entire technical baseline for the silent-boot work is absent from the corpus.
2. **D-WORKFLOW-050**, cited in #338 Phase A as governing the cloud-folder decision ("read both, D-WORKFLOW-050"). Its text is not in the register excerpt (which covers 080–087).
3. **D-WORKFLOW-088.** The excerpt is titled "The decision register's rows on the fork (D-WORKFLOW-080 to 088), verbatim" but contains no 088 row. Either it does not exist or it was omitted; the orchestrator should confirm which.
4. **The updater's implementation** (`rocknix-update`). Described two different ways in two sources (see C8 below); the source itself is not embedded. This is the crux of the largest risk below.
5. **The EmulationStation fork's repository address and the `package.mk` source URL** (`projects/ROCKNIX/packages/ui/emulationstation/package.mk`, per CLAUDE.md). Not in the corpus; material to the sweep finding (M2).
6. **Upstream's `AGENTS.md`** (quoted extensively in issue-334.md but not embedded), the `rocknix-splash` repository tree, the MinUI/Ludo/nanoarch trees (licences quoted in issue-336.md), and the site checkout. Acceptable for this analysis since the sources quote the load-bearing passages, but noted for completeness.

---

## 1. Position in brief

The plan's *shape* is right: identity first and visible-only (Choice 1, ratified as D-WORKFLOW-085); transfer rather than hard fork (D-WORKFLOW-086, correctly reasoned — the issue tracker is the paper trail); a second local box over cloud at today's RAM prices; step 0 (RetroArch driven from EmulationStation) before the runner; measurements before commitments. The register discipline, the per-action device yeses, and the honest recording of the day's one credential-handling failure (issue-338.md, 05:02 comment) are a process worth keeping.

Its weaknesses are specific and fixable: **the update path across the rename is under-specified and is the only player-facing liveness dependency in the plan; Phase A silently spans three repositories, two of which do not yet exist in the organisation, and is under-scheduled by roughly 3×; several decisions taken in the comment thread never reached the register the project's own rules require; and #336's acceptance criteria are stale relative to its own comment thread.** None of these touches the decision to fork. All of them are cheap now and expensive after 0.0.1 ships.

---

## 2. Claims that are wrong, unproven, or contradicted by the sources

**C1. "Phase A: the identity, 0.0.1 (about a day of work plus the artwork)" is under-scheduled by roughly 3×.**
The phase's own exit requires four images from one head, vm-qa, the RC2 rehearsal, and device passes. The plan's own comment thread says *"a cold rebuild of four devices is a day on one box, half on two"* (issue-338.md, comment of 00:09). The identity edits touch the distro layer, and CLAUDE.md warns that *"Script-only changes (e.g. `scripts/mkimage`) do **not** trigger an image rebuild — delete `build.*/.stamps/image/build_target` first"* — the safe reading is that the four 0.0.1 proof builds are cold or near-cold, so the build day is not avoidable through warm-cache luck. Add vm-qa, the rehearsal, and per-device yeses, and Phase A's realistic floor is **3–4 days on one box**: one of edits, one of builds, one-plus of proof. The estimate matters because an unrealistic "about a day" invites shipping under-tested to meet it. Say the real number on the issue.

**C2. Phase A's first checkbox spans three repositories; Phase B delivers one.**
The checkbox (issue-338.md, Phase A) includes *"the two interface strings"* — `ENABLE ROCKNIX SCREENSHOT` and the cloud-folder sentence — which live in the EmulationStation fork, *"a separate git repo"* (CLAUDE.md), requiring an ES commit plus a `package.mk` pin bump. The boot splash is *"a separate ROCKNIX repository (`rocknix-splash`…)"* which *"Phase A forks … into the organisation"* (issue-337.md, comment of 01:38). Yet Phase B transfers *"the three repositories … this one …, the EmulationStation fork, the site"* (issue-338.md, Phase B), and of those, only the distribution is recorded as transferred (issue-338.md, comment of 05:14: *"the repository is `rasteratops/distribution`"*). The splash repository is a **fourth** org repo that appears in no phase's list. As written, Phase A cannot complete its first checkbox today. The ordering fix is in §4.

**C3. Phase D's numbers are contradicted by the plan's own later measurement.**
Phase D's checkbox says *"a cold build of one device is hours and about 90 GB of root; four devices plus the source cache is about 400 GB"* (issue-338.md). The comment of 00:24 says *"a device's build root is 110 to 147 GB, the source cache 38 GB"* — i.e. 478–626 GB, not ~400. CLAUDE.md's *"A first build needs ~200GB disk"* corroborates the larger figure for one device. The decision reached (a second Tiny with 4 TB) is unaffected, but Phase D's checkbox demands *"the decision as a register row, with the price and the shape"* — and the register excerpt contains no such row (decision-register-fork-rows.md carries 080–087 only). The decision exists only in issue comments, contrary to CLAUDE.md's *"Decisions go in `docs/decision-register.md` the same session they are made."*

**C4. "Two choices are flagged for the maintainer before the council sits" — the body flags one.**
The intro (issue-338.md) promises two; the body labels only *"Choice 1 (flagged): a brand rename, not a path rename."* The second is presumably Phase D's shape ("a decision, not yet a purchase"), which the comment thread then settled (*"Then the second Tiny is the purchase"*, 00:24) without the register row. A plan that goes to a council as its packet should not require the council to infer which choices were flagged.

**C5. "…and in exactly this much a player reads" is an unproven completeness claim with a stated scope that excludes a whole repository.**
The measurement (issue-338.md, Phase A) counts the name *"on the upstream-bound roots (paths under `projects/ROCKNIX/`, scripts named `rocknix-*`, units, quirks)"* — the distribution tree. The two interface strings named are the fork's *own additions* to the ES tree; upstream ROCKNIX's ES fork may carry its own ROCKNIX-branded strings, and that tree is outside the count. Strings composed at runtime and strings embedded in carried patches (the fork carries eight RetroArch patches and four notification patches — issue-336.md) are not greppable the same way. The enumeration is a good start; the test that actually proves "a player reads none of it" is a rendered-frame audit of the booted 0.0.1 image — exactly the classifier shape #340 already specifies (*"every frame is black, the splash or the interface"* — issue-340.md). Borrow it for the rename: every screen a player can reach reads rasteratops or reads nothing.

**C6. #336's acceptance criteria are stale relative to its own comment thread.**
The issue's criteria require *"the runner launching at least three 2D cores"* (issue-336.md). The later comments redefine step 1: *"the first two cores through the runner are one of each (a SNES core and the N64 core), so the handshake is exercised from the first build"* (comment of 23:15), and add a step 0 — RetroArch driven from ES over its command socket — that the maintainer endorsed (*"If we can use the RetroArch existing interface for configuration… we could make that decision later, I assume"*, answered with *"yes, and it improves the plan. Step 0 becomes…"*). Neither step 0 nor the hardware handshake appears in the criteria. Before the spike starts, the criteria must say what the plan now says, or the spike's definition of done will argue with its own issue.

**C7. The interface's size is stated three ways.**
*"+28,359"* (issue-335.md, comment of 23:20), *"41,496 insertions"* (decision-register-fork-rows.md, D-WORKFLOW-080), *"+42,180"* (issue-339.md). Different bases and dates explain the drift, but #339 sizes Tier 1's packets from one of them; the tier plan should restate its basis so the packet count means something.

**C8. The updater's mechanism is described two incompatible ways, and the plan's checkbox assumes the cheap one.**
issue-334.md: *"the update server (`rocknix-update` reads ROCKNIX's GitHub releases; a fork points it at its own)"*. issue-337.md: *"the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there."* Reading GitHub releases is a client change; POSTing to an endpoint that returns an address implies a **service someone must run forever**, or a client patch to bypass it. These differ by an order of magnitude in work and in ongoing obligation, and Phase A's one-line checkbox (*"the updater pointed at the fork's own releases"*) does not say which world the fork lives in. See R1.

**C9. Minor record inconsistencies worth repairing.**
(a) Phase B's first checkbox is ticked with *"`two_factor_requirement_enabled` reads `true` (owner read, 05:51 UTC)"* while the 05:43 comment says it *"still reads `false`, so the checkbox stays open on that one fact"* — the flip between 05:43 and 05:51 is recorded nowhere but the tick note; thin, for a project whose paper trail is the point (D-QA-012). (b) The interim wordmark is *"58 x 6 font pixels"* in one comment and *"57 x 6 cells"* in the next (issue-337.md, 01:40 vs 02:03) — pin the real number in the splash fork's README. (c) CLAUDE.md still instructs *"User-facing behavior changes need a follow-up docs PR to the separate `ROCKNIX/rocknix.org` repo"* — post-fork, docs go to the fork's own site; the address sweep (commit `1633cbcac2`) updated the remotes but not this upstream-era instruction. #341's rewrite of `fork-workflow.md` should catch it.

---

## 3. Risks, ordered by expected cost

| # | Risk | Expected cost | Named in the plan? |
|---|------|---------------|--------------------|
| R1 | The update path across the rename: offer path, version comparison, compatibility strings, and what RC2's shipped updater points at **today** | **High** — player-facing, time-sensitive, under-specified | Partially (one checkbox) |
| R2 | The EmulationStation fork as a second, unmanaged upstream relationship | High and compounding | Partially (#336 names the cost; no cadence or owner) |
| R3 | Phase A schedule/scope optimism → slippage or an under-tested first release under the new name | Medium-high | No (the estimate is asserted, not examined) |
| R4 | The runner's feature-carry: states, exit, cards, achievements; RC2-era save states as player data; step 0's UDP command socket | Medium-high, well-mitigated by the plan's own shape | Yes, mostly |
| R5 | Operational single-points: one box until delivery, one token, one key, no branch protection, the unresolved commit-misattribution flag | Medium | Partially |
| R6 | Review capacity (#339) crowding out direction work (#336), or vice versa | Medium | No explicit order exists |
| R7 | Licence/attribution residuals | Low if the acceptance checks run mechanically | Yes |
| R8 | Hosted-runner VM QA unknowns, and a release-channel collision | Low-medium | Yes, hedged |
| R9 | Build-container dependency (upstream-controlled image) | Low | No |
| R10 | Deepening GitHub dependence against the maintainer's stated ambivalence | Low | Yes (issue-337.md) |

**R1 — the updater and release channel.** This is the plan's soft underbelly. Three layered problems:

- **Mechanism unknown** (C8). If RC2's updater POSTs to a ROCKNIX-operated endpoint, then *no fork release will ever be offered to an RC2 install* — the endpoint has no reason to name a foreign fork's build — and 0.0.1 reaches existing players only by manual `.update` or reflash. If it reads GitHub releases, the org redirect probably carries it — *probably*, because it depends on redirect-following and on the version-comparison logic accepting `0.0.1` as newer than `rc2-20260929`. A date-based comparison reads `0.0.1` as ancient.
- **The reverse hazard is live today.** The repoint is a Phase A *to-do* (issue-338.md; issue-337.md lists *"the update URL the updater reads pointed at the fork's own releases"* as not yet done). Until 0.0.1 ships, every RC1/RC2 install's updater points wherever upstream's does. If that is ROCKNIX's release channel, an RC2 player who accepts an offer updates *out of the fork* — the exact outcome CLAUDE.md's upgrade rule exists to prevent (*"Every build ships onto devices that already have state… check both the upgrade path … and a clean install"*). What RC2's updater actually points at is readable in an hour and should be read **this week**, not in Phase A.
- **The named proof tests the wrong half.** *"The rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state)"* (issue-338.md, Phase A) proves state preservation. It does not prove the updater *offers* 0.0.1 to an RC2 install, nor that the update path's compatibility strings (whatever the tar/image identifies itself by — and the sources do not say whether that is `DISTRO`, `PROJECT`, `DISTRONAME`, or device) still match after the rename. The rehearsal must exercise the real offer path end to end, and the rename's shape (see §4, item 3) must be chosen *after* the compatibility strings are read.

**R2 — the EmulationStation fork.** The fork's value concentrates in ES (+42,180 lines, issue-339.md) and #336 will deepen it: *"the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge"* (issue-336.md, comment of 23:12). The distribution side has a stated merge policy (*"`upstream/next` is merged on for the hardware work"* — D-WORKFLOW-084) and Choice 1 keeps it cheap. The ES side has **no stated merge cadence, no owner, and no equivalent of Choice 1**. Every interface change is also a two-repo dance (ES commit + distribution pin bump), which Phase A already demonstrates (C2). The mitigation #336 names — *"kept behind a per-core switch with RetroArch as the fallback, a merge that breaks the runner costs nothing a player sees"* — is correct and should be elevated from a comment to a design rule with a register row.

**R3 — schedule.** Covered as C1. The added risk: 0.0.1 is the first artifact under the new name; if the "about a day" estimate pressures anyone into trimming the rehearsal or the device passes, the fork's founding release ships on less proof than RC2 had. The fix is calendar honesty, not heroics.

**R4 — the runner.** The plan is admirably honest here: *"A runner that replaces RetroArch has to carry the first three or the fork's own features stop"* (issue-336.md) — the first three being the offline achievements, the save-state manager, and the exit hotkey/cards. Two sharpenings: (a) *"the launcher's state-file contract"* is RetroArch's state format; players have RC2-era Auto-slot states, so the runner must read/write RetroArch-compatible states **or** the launcher must remember which runner made each state's core — otherwise existing states silently strand when a core flips runners. This is player data, the same class as the cloud folder. (b) Step 0 turns on RetroArch's command interface — *"`network_cmd_enable` is `false` in the shipped config"* (issue-336.md) — a UDP socket that takes pause/save/load/quit on a network-connected handheld. It is off by default for a reason; the bind address must be verified as localhost-only (or replaced with a Unix socket) as a named gate, not discovered later.

**R5 — operational single-points.** The assistant's token is org-wide by design (*"all of its repositories (the siblings come later without a new token)"* — issue-338.md, 05:14) and expires 2027-10-01 (recorded — good; calendar it). The 05:43 comment flags that *"the maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to"* — and no resolution is recorded. And nothing enforces the fork's own quality bar mechanically on the new org: D-WORKFLOW-082 says the process *is* the quality bar, yet `next` has no recorded branch protection or required checks. One maintainer does not make checks pointless; it makes them the only second reader.

**R6 — review vs. direction.** #339 queues ~121k + ~140k + ~185k lines of adversarial review; #336 queues weeks of runner work; both want the same evenings. D-WORKFLOW-083 says the review is *"gradually over the fork's `0.0.x` releases"*; #339's prose calls Tier 1 *"the first act of the new OS"* while its own acceptance criterion gates **0.1**, not 0.0.1 (*"Every punch item resolved through Phase 7 before `0.1`"*). The criteria govern; say so on #339 so nobody reads the rhetoric as a 0.0.1 gate.

**R7 — licence/attribution.** The reads are sound (issue-334.md; LICENSE.md: branding *"CC BY-NC-SA 4.0"*, *"not in any way that suggests the licensor endorses you"*; software GPL-2; ES MIT). No sponsorships (struck by the maintainer) keeps NonCommercial clean. MinUI's missing licence is handled correctly (*"a reference to read, not code to copy"* — issue-336.md). Residuals: keep the ES MIT notice in anything copied; keep the attribution sentence on the release page *and* the site front page (already acceptance criteria in #335/#337 — run them mechanically); remember *"This distribution includes components licensed for non-commercial use only"* (LICENSE.md) constrains any future monetisation, not just sponsorship.

**R8 — hosted-runner VM QA.** Properly hedged (*"measured once before it is relied on"* — issue-338.md, Phase C). Two unnamed constraints: disk headroom (a 2 GB artifact plus CLAUDE.md's *"VM disk must be 16GB+"* floor, on a hosted runner's modest disk), and a **release-channel collision**: if the image *"arrives as a release artifact"* on the player-facing release page and the updater reads that page (one of the two described mechanisms), CI builds could be offered to players. Use Actions artifacts, never releases, for CI images.

**R9 — build container.** *"the build container `ghcr.io/rocknix/rocknix-build` (public, usable, not ours to keep current)"* (issue-334.md). 0.0.1's reproducibility rests on an upstream-controlled image. Pin it by digest for the release and name who bumps it.

**R10 — GitHub dependence.** The maintainer *"doesn't even love GitHub"* and would consider Forgejo (issue-337.md, 23:28). Every month of Actions workflows, `gh` tooling, and release-page coupling raises a future move's cost. Settled for now (*"If we need GitHub, that's fine too"*); just keep the tooling host-agnostic where cheap, as #337 already says.

---

## 4. What I would change

**Order.** Finish Phase B *completely* before Phase A's first commit — all **four** repositories (distribution, ES fork, site, **and the splash fork**, which no phase currently lists), the rasterabot write grants on each (*"A new repository in the organisation needs the same grant, or a team with write on all repositories"* — issue-338.md, 05:43; make the team once), the per-repo secrets check, and the sweep of the ES and site old addresses (see M2). Phase A's checkbox already depends on the ES and splash repos (C2); the plan's phase order hides its own dependency.

**Phase A's first task is the updater, not the artwork.** Read `rocknix-update` and what RC2's image actually ships; write down which of the two described mechanisms is true (C8); read the version-comparison and compatibility strings. This one read determines the rename's shape, the rehearsal's design, and whether RC2 players need an interim warning. It is a day of reading that de-risks the entire release.

**The distro directory: change contents, not the path — unless the updater read says otherwise.** Phase A's checkbox and #337 both rename `distributions/ROCKNIX/` → `distributions/<name>/`. Choice 1's own logic argues the other way for this one directory:

| | (a) Rename the directory (the plan) | (b) Keep the path, change the five files' contents |
|---|---|---|
| Player-visible identity | Full | Full — everything visible reads `DISTRONAME`/`OS_NAME`, not the directory |
| Upstream merge behaviour | Git rename detection applies upstream's recurring `version` bump to the renamed file — potentially a **silent clobber** of `OS_VERSION=0.0.1` every merge | A **visible conflict** every merge, resolved "ours" — annoying, loud, and safe |
| Update-path compatibility | Every string derived from `DISTRO` changes at once, including any the updater matches on | Only the strings the five files set change |
| Consistency with Choice 1 | Exception carved out | Choice 1 taken to its conclusion |

The five files are known (issue-337.md: *"`options` sets `DISTRONAME`, `version` sets `DISTRO_VERSION` and `OS_VERSION`, `logos/rocknix-logo.png`, `kernel_options`, `config/functions`"*). If the updater read shows nothing matches on `DISTRO`, (a) is acceptable **with** a `merge=ours` on the version file; until that read, (b) is the default-safe option. Either way, the version-file merge strategy belongs in `NAMING.md`.

**Gates.** Add to Phase A's exit: the updater offer-path rehearsal (R1); the rendered-frame identity audit (C5); the artifact-filename check (with `PROJECT=ROCKNIX` kept, verify the published image names don't embarrass the release page — the sources don't say how image names are composed, so verify); and a tested-devices line in the release notes. Add to Phase 0: branch protection on `next` with the host-side suites as required checks (R5).

**Scope — what I would cut from 0.0.1:**

1. **The cloud-folder default change.** Keep `/ROCKNIX`. D-WORKFLOW-084 pins 0.0.1 as *"RC2's tree (`69e6039f8f`) under its own name, splash and logo"* — a change to where a player's backups live is not identity, it is data-layout, and it splits every existing player's cloud history for zero panel-visible gain. Defer to the code-level-rename item (D-WORKFLOW-085's later item). If it ever happens, *then* dual-read.
2. **The animal logo as a gate.** The plan already allows the wordmark to stand in; make that explicit so art never blocks a release.
3. **The site.** It is #337's acceptance criterion but not Phase A's; let it trail to the 0.0.x window.
4. **Any ES change beyond the two strings and the pin bump.**
5. **The hosted-VM experiment as any kind of gate** — it is a parallel measurement, and its result should be filed either way.
6. **Tier 1 of #339 as a 0.0.1 gate** — RC2's tree already passed RC2's QA; the review's value is identical if it lands in 0.0.x, which is what #339's own acceptance criterion says.

**Estimates.** Restate Phase A as ~3–4 days on one box (C1), and note that until the second box arrives, builds and vm-qa serialise on serval (*"today no x64 build may run while vm-qa runs"* — issue-338.md, 00:09).

**Housekeeping.** Write the Phase D register row (C3); update #336's acceptance criteria (C6); give the parked PR stack (#322) a decision date — *"parked, not cancelled"* (D-WORKFLOW-087) has a half-life, since upstream drift raises the resubmission cost monthly; schedule the three generic fixes (RetroArch's two bugs and the notification sizing, RAOfflineProxy's patches, the H616 ramoops change — D-WORKFLOW-082) before they rot; resolve or record the maintainer-commit-misattribution flag (R5); pin the container digest (R9).

---

## 5. What is missing entirely

- **M1. The updater read and the offer-path rehearsal** (R1/C8) — the single largest gap; detailed above.
- **M2. The ES and site old-address sweep.** The counted sweep covers *"24 files under `tools`, `.githooks`, `.claude` and `.github/workflows`"* naming `maxengel/rocknix`, `ROCKNIX/distribution` or `ROCKNIX/emulationstation-next` (issue-338.md, first comment), and 15 were changed (`1633cbcac2`, 05:14). The ES fork's own old address appears nowhere in the count — yet `package.mk` fetches ES from somewhere (CLAUDE.md points to `projects/ROCKNIX/packages/ui/emulationstation/package.mk`, outside the swept directories). Either the tree doesn't name it (then how does the build fetch the fork's ES?) or the count missed it. Verify and repoint deliberately; redirects are a courtesy, not a plan.
- **M3. The splash repository in Phase B's repo list** (C2).
- **M4. Branch protection / required checks on `next`** (R5).
- **M5. The Phase D register row** (C3) — and a check on the absent D-WORKFLOW-088 (gap 3).
- **M6. The version-file merge strategy** (§4, table).
- **M7. The build-container digest pin** (R9).
- **M8. An upstream merge cadence for *both* upstreams** — distribution *and* ES (R2) — each merge as a PR so the checks run, with vm-qa when a merge touches the launch path, the update path, or a device kernel.
- **M9. The parked stack's decision date and the generic fixes' schedule** (§4).
- **M10. #340's technical baseline** — its first comment is absent from the corpus (gap 1), and its VM criterion (*"from the first frame QEMU hands us … every frame is black, the splash or the interface"*) has an unexamined wrinkle: a BIOS-booted VM (GENERIC_X64's BIOS boot is the fork's own addition, per issue-334.md's table) draws firmware output before the kernel, which is neither black, splash, nor interface. Define the classifier's window (from kernel handoff) or suppress firmware output, before the criterion fails on its first run for the wrong reason.
- **M11. The runner's state-compatibility decision and step 0's bind-address gate** (R4).
- **M12. The artifact-filename identity check and the tested-devices line** on the release page (the release page is public; a stranger with an untested device should read what the fork actually builds and tests — four targets: H700, RK3566, SM8550, AMD64, covering five panels).
- **M13. Site hosting and DNS** — `rasteratops.com` currently serves mail (issue-338.md, 04:39); where the MkDocs site lives is unnamed.
- **M14. A player-recovery note** (reflash/rollback) on the release page, and a security contact (the rasterabot inbox is the natural one, under its already-written rules).
- **M15. Estate DR, one line**: two identical boxes in one location; the records survive because they are pushed, the roots are rebuildable, the tokens re-mintable — say so once and move on.

---

## 6. Questions only the owner can answer

1. **The cloud folder:** keep `/ROCKNIX` as the default (my recommendation) or rename with dual-read? — *Unblocks Phase A's cloud checkbox and 0.0.1's scope.* (D-WORKFLOW-050's text is not in my corpus; the answer should cite it.)
2. **The version scheme:** ratify `0.0.1` / `0.0.x` / `0.1` (proposed in issue-337.md, 23:46, never rowed)? — *Unblocks the release tooling and the updater's comparison check.*
3. **The parked stack (#322):** a review date, or formally cancelled? — *Unblocks whether rebase effort is ever budgeted.*
4. **The second Tiny:** ordered? ETA? — *Unblocks Phase 2; until it arrives, Phase 1's builds and QA serialise on serval, which is part of the real 0.0.1 date.*
5. **If the updater read shows RC2 pointing upstream today:** do you want an interim note to RC2 players not to accept an upstream offer? — *Unblocks player-safety communication before 0.0.1.* (The read is the assistant's; the communication is yours.)
6. **If the updater needs a fork-run endpoint:** are you willing to operate a small service indefinitely, or should 0.0.1 patch the client to read the release page directly? — *Unblocks the updater checkbox's shape.*
7. **Do you ever commit from the build box's primary checkout?** — *Unblocks the fix for the misattribution flag (issue-338.md, 05:43): a per-checkout identity, or a recorded "I never commit there."*
8. **The 0.0.1 device pass:** #340 names the RG35XX SP and the Nova; do the RG SP and the RG353M get device yeses for 0.0.1, or does the H700 image's proof on one panel suffice for both? — *Unblocks Phase A's "the devices on a yes."*
9. **Inbound issues from strangers** (issues stay on; no community): triaged by the assistant in the project's voice, or left alone? — *Unblocks `CONTRIBUTING.md` and the issue templates.*

---

## 7. Recommended plan

**Phase 0 — Close the migration** (host work, ~1 day). *Entry:* this analysis applied to #338. *Work:* transfer the ES fork and the site; create the splash fork; repoint `package.mk`'s ES source; sweep the ES/site old addresses; one team with org-wide write for rasterabot; per-repo secrets check; branch protection on `next` requiring the host-side suites; #341's relaxation with its per-row register entries; the Phase D register row; calendar 2027-10-01. *Exit (agent-verifiable):* `gh api repos/rasteratops/{distribution,<es>,<site>,splash}` each read the transfer and redirect; `gh api repos/.../collaborators/rasterabot/permission` reads `push: true` on each; `gh secret list` per repo; grep for the old addresses outside records reads zero; `gh api .../branches/next/protection` reads the required checks; `tools/rules-check` / `tools/register-check` PASS lines and the push guard's constructed-violation proofs filed; the new register row IDs.

**Phase 1 — 0.0.1, the identity** (~3–4 days on one box). *Entry:* Phase 0 exit; the updater mechanism read and written down (M1); the (a)/(b) directory decision made on that read (§4). *Work:* the five identity files; the splash fork with the wordmark path and the two renderer one-liners (issue-337.md, 02:03), pin bumped; the theme's logo text; the two ES strings + ES pin bump; the eleven script lines; the updater repoint with the version-comparison check; `NAMING.md` including the version-file merge strategy and the kept `/ROCKNIX`; the attribution line; the container digest pinned. *Cut:* the cloud-folder change; the animal logo as a gate; the site. *Exit:* a guest-d frame at 640×480 showing the splash and one of the carousel; `/etc/os-release` and the info screen read rasteratops / 0.0.1 (lines filed via `tools/vm-serial`); the rendered-frame identity audit clean; `tools/vm-qa` PASS; **the RC2→0.0.1 rehearsal PASS through the updater's real offer path** (offer appears, tar installs, `/storage` intact, cloud folder still reads `/ROCKNIX`) — not only the `scp` to `.update` path; four images from one head with BUILD_IDs filed; `gh release view --json assets` reads artifact names the fork can stand behind; `gh release view --json body` reads the attribution sentence; the release names the tested devices; per-device yeses filed.

**Phase 2 — the estate** (parallel; gated on delivery). *Work:* provision the second Tiny from the blueprint; split builder/prover roles; runner labels; the hosted-VM experiment measured once. *Exit:* a device build on serval concurrent with vm-qa on the prover, both PASS, filed; the experiment's minutes/disk/result filed either way.

**Phase 3 — 0.0.x hardening.** *Work:* #339 Tier 1 (both seats; `tools/lint-audit-artifacts` PASS; punch-list issue); punch items fixed or rowed; #340 silent boot with the classifier window defined (M10) — boot, shutdown and restart series PASS, journal complete, serial answers; the site live with attribution (build log's last line filed); the three generic fixes sent under the kept outbound rules. *Exit:* per-item PASS lines, links, and row IDs.

**Phase 4 — 0.1, the direction.** *Entry:* #339 Tier 3 read (*"this tier is read before that work starts"* — issue-339.md) and Tier 1 punch items resolved or rowed (its own acceptance criterion). *Work:* #336 step 0 — RetroArch under ES's pages over the command channel, with the localhost bind-address gate filed (R4), the protocol designed once, the RetroArch menu reachable from one row; measurements beside the filed baseline (*"1.05 s … 2.03 s … 0.58 s … 4.58 s of CPU"* — issue-336.md); then step 1 with both core kinds from the first build, `rc_client`, the same socket protocol, and the state-contract decision made (R4). *Exit for 0.1:* step 0 shipped with frames and the two numbers; step 1's per-core default flips only if its measurements beat step 0's on the same guest — the plan's own rule, *"the in-process bridge only if the numbers say so,"* extended one step earlier.

**Phase 5 — cadence** (ongoing). Named merge cadence for both upstreams, each merge a PR; vm-qa on merges touching the launch path, update path, or a device kernel; the #322 decision date; the token renewal; the container-bump policy; tiers 2–3 continuing in the background.

---

*End of analysis. All material claims above cite the embedded sources by path and passage; the provenance block in §0 records the Facilitator's embed-time hashes, and the gaps I could not close from the corpus are listed there rather than papered over.*
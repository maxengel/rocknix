# Step 2 — Peer review

You are one council member in the active roster. Review the injected Step 1 analyses from the other members.

## Anti-self-citation constraint

You are critiquing PROPOSALS for the technique, not OBSERVATIONS of the run that produced them. Do NOT cite the analyses, peer reviews, or revised plans you've been handed as empirical evidence about the technique itself. The deliberation's value comes from independent reasoning about the technique on its merits; using the run's artifacts as evidence for the technique's claims is circular.

## Injected analyses

=== START claude-analysis.md ===

# Council seat — independent analysis of the rasteratops fork plan (#338)

## 0. Corpus, provenance and two gaps in the packet

I read the eleven embedded sources in full. Two things about the packet itself before the analysis, because they bear on it:

1. **D-WORKFLOW-088 is not in the corpus.** The orchestrator brief and the file's own title (`decision-register-fork-rows.md`: "The decision register's rows on the fork (D-WORKFLOW-080 to 088), verbatim") promise rows 080 to 088; the embedded table carries 080 through 087 only. I do not know what 088 decides and I have not guessed. If 088 fixes something below (a merge cadence, a release-branch model, the review order), this analysis should be read against it. Surface to the orchestrator.
2. **The plan says two choices are flagged and labels one.** `issue-338.md`: *"Two choices are flagged for the maintainer before the council sits."* Only *"Choice 1 (flagged): a brand rename, not a path rename"* is marked; nothing is labelled Choice 2. The maintainer confirmed Phases A–D over the day without a second choice ever being put as one. Whatever it was (I suspect the cloud box's provider and shape, Phase D), it has been decided by default. That is a small procedural defect with a real consequence: the council was told to critique two flagged choices and can find one.

Provenance for this seat is recorded in §8.

---

## 1. Claims in the plan that are wrong, unproven or contradicted by the sources

| # | Claim in the plan | Evidence against it | Consequence |
| --- | --- | --- | --- |
| 1.1 | Phase A is *"about a day of work plus the artwork"* (`issue-338.md`, Phase A header; also `issue-335.md`: *"The fork's own identity (#337) is a day of work"*). | The same issue, three hours later: *"the libretro work and the rename each mean full rebuilds"* and *"a cold rebuild of four devices is a day on one box, half on two"* (`issue-338.md`, comment 00:09:32). Also: *"today no x64 build may run while vm-qa runs, because the build replaces the image the suites read and starves the guests"* (same comment), so the builds and the VM suites serialise. Also the splash is *"a separate ROCKNIX repository (`rocknix-splash`, GPL …) so Phase A forks that repository into the organisation"* (`issue-337.md`, 01:38:52) with *"two one-line changes"* to its scaler (`issue-337.md`, 02:03:12), and the two interface strings live in the EmulationStation fork, which means an ES rebuild and a pin bump. And the record of the day: the plan was opened at 00:04 and the last comment landed at 05:48, and every hour of it went to the organisation, the account, the mail, the token, the transfer and three corrections — not one to the rename. | The honest figure is a day of edits, a day of cold builds (serialised with QA), the rehearsal, four device flashes on four separate yeses, plus artwork. Four to six working days is the floor; "a day" is the edit time only. Every later estimate in the plan inherits this optimism. |
| 1.2 | Phase D's numbers: *"a cold build of one device is hours and about 90 GB of root; four devices plus the source cache is about 400 GB"* (`issue-338.md`, Phase D). | The same issue's own later reading: *"a device's build root is 110 to 147 GB, the source cache 38 GB"* (`issue-338.md`, 00:24:15). Four roots at 110–147 GB plus 38 GB is 478–626 GB, not 400. `CLAUDE.md` gives a third number: *"A first build needs ~200GB disk and hours."* | Three figures for one quantity in one packet. The plan's Phase D storage sizing ("2 TB is the floor") still holds, but a plan whose first checkbox is *"The numbers written down"* has written them down three ways. Fix the row before it becomes a register row. |
| 1.3 | The rename is a *"brand rename, not a path rename"* that leaves *"the internal paths and script names … as upstream has them"* so merges keep working. | The plan itself adds `distributions/<name>/` (Phase A, first checkbox). `CLAUDE.md`: *"Layered config resolution (`config/options`): options are sourced in order — `distributions/<DISTRO>/options` → …"*. `DISTRO` is therefore a path component that the build engine keys on, and the plan changes it. What is *not in the corpus* and must be verified before Phase A is scheduled: whether `DISTRO` (and `OS_VERSION`) participate in the build directory's name and in package stamp hashes in `config/path` and `scripts/build`. In the LibreELEC family they do; if they do here, the new distribution name means a cold build root per device (the 00:09 comment already concedes *"the rename … mean[s] full rebuilds"*), and a moved root does not work because the toolchain bakes absolute paths. Also the default `DISTRO` is set in an upstream file (`config/options` or the `Makefile`), which is one upstream line the fork now owns. | Not a contradiction of the *choice* (which is right) but of its advertised cost: the visible rename is not zero-merge-cost and not zero-rebuild-cost. Both are small and one-off; say so. |
| 1.4 | *"the updater pointed at the fork's own releases"* (`issue-338.md`, Phase A) — a configuration change. | Three incompatible descriptions of the mechanism: `issue-334.md`: *"`rocknix-update` reads ROCKNIX's GitHub releases; a fork points it at its own"*; `issue-337.md` (23:46): *"the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there"*. If the second is true, the fork needs a **server** that answers a POST, or a code change to the updater — neither is a URL edit. | The updater is the one piece of 0.0.1 that touches every fielded device; the plan does not know how it works. Reading `rocknix-update` on the tree is a fifteen-minute task that must precede the estimate. |
| 1.5 | The RC2 → 0.0.1 upgrade path is covered by *"the rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state)"* (`issue-338.md`, Phase A). | The rehearsal as described proves *state* survives. It does not name the four ways the update *channel* can break at the rename: (a) an RC2 device asks `maxengel/rocknix`, which now *redirects* (`issue-338.md`, 05:14: *"`maxengel/rocknix` redirects to it"*) — does the updater follow a 301? (b) the release file names change prefix (`DISTRONAME`) and version scheme (`OS_VERSION=0.0.1` against `rc2-20260929`); does the updater's match or compare accept it? (c) `issue-337.md` says *"the date stays in the file names as now"* while `issue-338.md` sets `OS_VERSION=0.0.1` — which is in the file name? (d) does the update mechanism itself check that the tar's distribution name matches the running one (`CLAUDE.md`: *"Deploy … by `scp`-ing the image tar to `root@<host>:~/.update`"*)? | A rehearsal that starts from RC2 as built and lets the RC2 updater find 0.0.1 *by itself* is the proof. A rehearsal with the URL hand-pointed proves less than it claims. |
| 1.6 | *"version 0.0.1 is RC2's tree (`69e6039f8f`) under its own name, splash and logo"* (D-WORKFLOW-084). | Phase A adds behaviour to the sync path: *"the cloud folder's default name (`/ROCKNIX` in a player's cloud today -- read both, D-WORKFLOW-050)"*. "Read both" is new code on the data path the fork's own instruction file calls sharp (`CLAUDE.md`: *"filter file is an allowlist; `--delete-excluded` is catastrophic"*). | 0.0.1 as planned is not RC2 plus identity; it is RC2 plus identity plus a cloud-folder migration. Either cut the migration (my recommendation, §3) or stop calling 0.0.1 "RC2's tree". |
| 1.7 | *"The three repositories transferred"* (`issue-338.md`, Phase B). | `issue-337.md` (01:38) adds a fourth: the `rocknix-splash` fork. And the transferred one is only the first: *"the EmulationStation fork, the site"* remain unticked. Each new repository also needs the write grant the token could not carry: *"A new repository in the organisation needs the same grant, or a team with write on all repositories"* (`issue-338.md`, 05:43). | Four repositories, three grants still to make, and the ES fork's pin (`projects/ROCKNIX/packages/ui/emulationstation/package.mk`) must point at an org address before the 0.0.1 recipe is honest. |
| 1.8 | Phase C: *"Ubuntu hosted runners expose `/dev/kvm`, so `tools/vm-qa` can boot the image there … measured once before it is relied on."* | `issue-336.md`: *"the first proof runs on guest d, which draws GL through the host's GPU"*. A hosted runner has no GPU; guest d's GL path either runs on software rendering or not at all, and every timing suite (`time-to-play`, D-CLOUD-098) on a shared hosted runner measures the runner, not the image. | The experiment's scope must be written before it is run: the non-visual, non-timing suites only. "Measured once" is also not a reliability claim; one green run tells you nothing about flakiness. |
| 1.9 | #339 Tier 2: *"Findings here are the fork's to fix now, since there is no longer anyone to send them to."* | D-WORKFLOW-084 keeps *"`upstream/next` … merged on for the hardware work"* and D-WORKFLOW-087 parks upstream posts *"for now"*, not forever. Every in-place fix to one of the *"about 140,000 lines of shell and recipes"* upstream wrote is a permanent merge conflict on a file upstream still edits — exactly the cost Choice 1 was written to avoid. | The plan avoids touching upstream paths for the *name* and proposes touching them at scale for *findings*. Internally inconsistent. Tier-2 findings need a triage rule (§3). |
| 1.10 | #339's packet arithmetic: *"a seat's packet is about 500 KB, roughly 12,000 lines"* and Tier 1 is *"About twenty packets a seat"* for 121,000 lines. | 121,000 / 12,000 ≈ 10. The twenty comes from the realised rate (*"the fix-round audit read 40,000 lines in eight packets"* = 5,000 lines a packet). Tiers 2 and 3 are then 28 and 37 packets at that rate, not 12–15 and 15. | The whole review is nearer 85 packets a seat than 50. At eight an evening (the realised rate), that is ten evenings a seat, before fixes. It matters because D-WORKFLOW-083 gates `0.1` on it. |
| 1.11 | The interim wordmark is *"58 x 6 font pixels"* (`issue-337.md`, 01:40) and *"57 x 6 cells"* (`issue-337.md`, 02:03). | Same issue, forty minutes apart. | Trivial, except that the composition (*"a 64 x 32 canvas … the word centred in rows 24-29"*) is specified in cells and a one-cell error is a visibly off-centre word at scale 6. The generated path is the truth; the prose should follow it. |
| 1.12 | The licence line 0.0.1 will carry: *"GPL-2 and MIT kept whole"* (`issue-337.md`, acceptance criteria). | `issue-336.md` (23:25): *"EmulationStation's fork MIT at its root with GPL in the recipe"*. The fork does not currently know which licence its own EmulationStation carries. | A release note that states a licence the recipe contradicts is the kind of small untruth the fork's prose rules exist to catch. Resolve before the note is written. |
| 1.13 | The EmulationStation string sweep is two strings. | `issue-339.md`: the ES fork carries *"translations 154,087"* lines. A changed msgid loses that string's translations in every other language until re-translated. | Small; but "two strings" is two strings in English only. |

One more observation belongs here because it is about the *reliability of the plan's facts* rather than any single fact. In six hours the record corrects itself three times on hardware and account facts: the memory modules were *"full-size DDR5 desktop modules (288 pins)"* at 00:16 and *"DDR5 SO-DIMMs (262-pin)"* at 00:19 (*"the comment above … was wrong"*); a comment presented as rasterabot's first post was in fact posted by the owner after a `403` (*"This comment is posted with the owner account so the record lands today"*, 05:43); a checkbox was ticked and its 2FA fact read `false` at 05:43 and `true` at 05:51. All three corrections are honest and prompt, which is to the process's credit. But they were caught by the same author re-reading, and after the fork there is no other reader. That is the structural fact of this plan (§2, risk 6).

---

## 2. Risks, ordered by expected cost

Expected cost is probability times what it costs when it lands, over the first year of the fork. The plan names some of these; most of the top five it does not.

### Risk 1 — The build box is a public repository's self-hosted runner and holds every credential the project has

**Named by the plan:** no.

The box `serval` runs the image builds as a self-hosted runner (`issue-338.md`, Phase C: *"The image builds stay on a self-hosted runner (serval today …)"*; 05:14: *"the runner's example in `fork-generic-x64.yml`"*). The same box holds, at `~/.config/rasteratops/`, the rasterabot GitHub token (write to Contents, Issues, Pull requests and Workflows, expiring 2027-10-01), the Hostinger mail token (read *and* send), the `rasterabot_ed25519` key that both authenticates and *signs* commits (*"`gpg.format ssh`, `commit.gpgsign true`"*, 05:43), and the maintainer's own `gh` login as the second account (*"`gh` now holds rasterabot as its active account and maxengel second"*). The repository is public and *"a public repository cannot refuse"* pull requests (`issue-337.md`).

A workflow that runs on the self-hosted runner for a `pull_request` from a stranger's fork is arbitrary code on serval. GitHub's own guidance is that self-hosted runners belong on private repositories for this reason. The plan mentions neither the trigger scope of `fork-generic-x64.yml` nor the runner's user isolation. The impact chain is the worst in the packet: a token that can publish a release is a token that can push a malicious image to every fielded device through the updater the fork is about to point at its own releases. Probability is low today (no readers); impact is total; and the exposure is permanent and growing (issues on, mail in, a webhook proposed — see risk 4).

**Cost if it lands:** the credentials, the record's integrity (signed commits as `verified: true` from an attacker), and the devices. **Mitigation is cheap:** self-hosted jobs on `push` to `next` and `workflow_dispatch` only, never on `pull_request`; the runner as its own user with no read on `~/.config/rasteratops/` or `~/.ssh`; the repository's Actions setting "require approval for all outside collaborators"; an inventory row per token with scope, location, expiry and revocation command.

### Risk 2 — No merge cadence, no merge gate, and a divergence that only grows

**Named by the plan:** only as a principle (*"the hardware work the fork keeps"*).

The fork's whole hardware story is *"`upstream/next` is merged on for the hardware work"* (D-WORKFLOW-084). The plan names no cadence, no owner, no gate, no measure. Meanwhile three things the plan *does* propose increase the merge surface: the runner work, whose *"one real divergence cost is the interface: the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge"* (`issue-336.md`, 23:12); Tier 2 fixes to upstream shell in place (§1.9); and the deferred code-level rename, which D-WORKFLOW-085 calls *"wanted"* with *"the merge cost taken when it is done"*. That last phrase is wrong in kind: renaming upstream-owned paths is not a one-time cost taken on the day; it is a tax on every merge for as long as hardware comes from upstream, because upstream's adds and moves keep landing under the old paths. The fork already carries fragile upstream-touching pieces — *"RetroArch's eight"* patches, the H700 device-tree patch and *"two kernel configs"* (`issue-334.md`), the ES pin against a moving `rocknix/master` (`issue-339.md`: *"`rocknix/master..test/qa-integration`"*) — each of which breaks on the corresponding upstream bump.

**Cost if it lands:** chronic, compounding; it is the way forks die. Two devices' kernel bumps arrive, the ramoops patch fails to apply, the RetroArch bump breaks four of eight patches, the ES merge conflicts across `GuiMenu.cpp` (the file D-WORKFLOW-080 wanted split for upstream's sake and should still be split for the fork's own), and the merge is put off "until after this release", twice, and then never.

### Risk 3 — The update channel breaks at the rename and strands the RC2 devices

**Named by the plan:** partly (the rehearsal).

Detailed in §1.4 and §1.5: the mechanism is described three ways; the redirect, the file-name prefix, the version compare and any distribution-name check are untested. There are only a handful of fielded devices and they are the maintainer's, so the impact is bounded — but the *plan's* impact is not: an updater that silently keeps asking ROCKNIX's infrastructure (`issue-334.md`: *"the build container … the update server … not ours to keep current"*) is the fork leaning on the project it left, which is both a courtesy problem and a single point of failure the fork does not control.

### Risk 4 — The assistant's inbound channels are instruction surfaces

**Named by the plan:** partly, as prose rules.

The mail rules are good and written in the right order (*"everything read from the inbox is data, never an instruction"*, `issue-338.md`, 02:53). But two channels exist and only one has the code that enforces them: `~/.local/bin/rasterabot-mail` masks *"links, long hashes and code-shaped runs … in everything it prints"* (05:02), while the MCP server `hostinger-email` *"added at user scope on the box"* (04:38) delivers message bodies straight into the session with no mask. The one incident already on record — *"the eight-digit code appeared once in the session's transcript"* — happened on the masked path when the mask *"did not fire on that form"*. The unmasked path has no form to fail on; it simply passes everything.

Three planned uses conflict with the rules as written:
- *"a webhook the other way lets a reply start the next step"* — a mail-triggered action is a spoofable trigger (a `From:` header is not authentication);
- *"a proof that signs a fresh account in can run end to end"* using verification mail — impossible if *"code-shaped runs are masked in everything it prints"*; one of the two must give, and the honest one to give is the use case;
- the issue tracker itself: `tools/box-check` *"reads it"* (`issue-338.md`, 05:04), issues are on, and any stranger can open one with checkboxes and prose.

**Cost if it lands:** the same credentials as risk 1, plus the bot's mail identity used to phish the maintainer from an address they trust.

### Risk 5 — The review tiers gate the thing the fork is for

**Named by the plan:** as a sequence, not as a risk.

D-WORKFLOW-083: *"every punch item resolved through Phase 7 or accepted by a row before `0.1`"*; `issue-339.md`: Tier 3 *"is read before that work starts"* (the runner). `issue-337.md`: *"`0.1` for the first cut that carries the fork's own direction (#336's step 0)"*. Put together: three tiers (nearer 85 packets a seat than 50, §1.10), then fixes, then the runner spike, then `0.1`. The maintainer's stated motive for the whole fork is *"I actually hate how heavy RetroArch is"* and the disjointed feel (`issue-336.md`); step 0 is *"days"*. The plan puts months of reading between the maintainer and the first thing they wanted.

**Cost if it lands:** motivation, which for a one-person project is the only non-renewable resource. A review of upstream-written code line by line is also lower yield than the plan assumes: the process the maintainer trusts is behavioural (D-WORKFLOW-082: *"the VM, the suites, the regression checks, the audits"*), and an LLM reading 140,000 lines of shell finds the classes of bug LLMs find.

### Risk 6 — The last external reviewer is gone, and the reviewer that replaces it shares the author's blind spots

**Named by the plan:** no.

Before the fork, ROCKNIX's developers were the only humans who ever read the code (`issue-335.md`: *"the code is read by the fork's audits, not line by line by the maintainer"*). After the fork, the `code-auditor` seats are the same kind of model as the author. Correlated blind spots are the risk: what the author did not see, the reviewer is likelier not to see. The day's record (§1, last paragraph) shows the author's factual error rate on external facts is non-trivial and self-corrected. The plan should say what the *uncorrelated* checks are: the suites, the maintainer's play-tests, the frames, the measurements — and should keep growing those rather than the packet count.

### Risk 7 — Licence and attribution leftovers

**Named by the plan:** the headline items, yes; the leftovers, no.

The non-optional item is right: *"not in any way that suggests the licensor endorses you or your use"* (`LICENSE.md`; `issue-334.md`). The plan's sweep is the counted player-visible set. Three leftovers are not in it:
- `/etc/os-release` has more than a name: `HOME_URL`, `SUPPORT_URL`, `BUG_REPORT_URL`. If they still point at rocknix.org or the Discord (`LICENSE.md`'s header carries the Discord badge), the fork routes its bugs to ROCKNIX, which is the endorsement problem in its most practical form.
- The theme: the plan changes *"the theme's logo text"*. Whether the theme ships other ROCKNIX-branded images (backgrounds, system art, the info screen's assets) is not read anywhere in the corpus. If any CC BY-NC-SA image remains in the shipped image, the release page's attribution line must credit *and link the licence*, not just say "a fork of ROCKNIX".
- The ES fork's licence (§1.12).

Cost is low at hobby scale but it is the one obligation the plan itself says is *"not optional"*.

### Risk 8 — Third-party identities the fork inherits without noticing

**Named by the plan:** no. **Verifiability from the corpus:** none; this is a question, not a finding.

Images of this family typically ship a scraper developer identity (EmulationStation's ScreenScraper `devid`), a RetroAchievements client identity, and cloud OAuth client identifiers inside `rclone` or the cloud scripts. If 0.0.1 presents itself to those services as ROCKNIX's build, the fork uses upstream's quotas and reputation under a new name. The runner work makes this sharper: `rc_client` inside a new frontend (`issue-336.md`) is a *new client* to RetroAchievements, whose hardcore mode is tied to approved clients. The proxy's offline achievements are already on that edge. An inventory of every embedded key and identifier, done once, decides what the fork replaces, keeps by permission, or turns off.

### Risk 9 — The build container and other upstream infrastructure

`CLAUDE.md`: *"make docker-image-pull # pull ghcr.io/rocknix/rocknix-build:latest"*; `issue-334.md`: *"public, usable, not ours to keep current"*. Pulling `latest` from a project the fork has left is a build that changes under the fork's feet or stops. Mirror by digest into `ghcr.io/rasteratops/`. Same for anything the fork's tools fetch from ROCKNIX-owned hosts.

### Risk 10 — The device set and the QA fleet are the maintainer's time

Every device test is a per-action yes (`CLAUDE.md`: *"Nothing runs on one without a per-action yes … each test is asked for by name with what it writes, sends and leaves behind"*), and a flash is a runbook with a known trap (*"on H700 a fresh card does not boot until the exact device tree is activated as `/dtb.img`"*). Four devices per release is four flashes and a dozen yeses. The fleet is also the support matrix by default: the plan builds *"the four images"*; ROCKNIX supports fourteen-odd SoCs (`CLAUDE.md`'s target list). The release page should say which four, once, so nobody with another device expects one.

### Risk 11 — Two boxes that drift

Phase D's shape is *"two ThinkStation P3 Tiny Gen 2 boxes, identical … provisioned the same way from the estate's build-box blueprint"*. Nothing in the corpus shows the blueprint exists as code. Two hand-provisioned boxes are two different boxes within a month. The purchase is decided; its *timing* and its *provisioning as a script* are open.

### Risk 12 — Misattributed, signed commits

`issue-338.md`, 05:43: the primary checkout authors and signs as rasterabot and *"The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to"* — said no to, with no mechanism. A `pre-commit` hook that refuses when the committing user is not the assistant's session, or the maintainer never committing from that checkout, is the mechanism. Cheap, and it protects the one thing the bot account was created for: attribution *"true by construction"* (02:08).

### Risk 13 — Hosted-runner VM suites give false confidence

§1.8. Low cost because the plan calls it an experiment; the risk is only that a green run on a GPU-less shared runner is read as a proof of the image.

### Risk 14 — One box, no backup named

`/workspace` on the 4 TB volume holds the roots (rebuildable in a day), the source cache (rebuildable), the tokens (re-mintable) and the worktrees. Nothing irreplaceable if the tree is pushed — the frames live under `docs/qa-frames/` in git. Low, but a sentence saying "the box is rebuildable from the blueprint in a day; nothing on it is the only copy" should be true and checked.

---

## 3. What I would change

### 3.1 The one structural change: 0.0.1 is identity only, and everything else moves behind it

The plan's own Phase E says the council's report is applied *"before Phase A starts"* — but Phase B and D were substantially executed during the day the plan was written. That is fine; it means the open question is not A–E but **the shape of 0.0.1 and what queues behind it.** My answer: make 0.0.1 the smallest true statement — RC2's proven tree, with the ROCKNIX identity removed and the fork's put in its place — and prove exactly two things about it: it boots as itself with no ROCKNIX mark on any screen, and an RC2 device finds it and upgrades to it unaided.

### 3.2 Cut from 0.0.1

| Item | Plan's position | My position | Reason |
| --- | --- | --- | --- |
| The pixel triceratops | *"a plain wordmark stands in until then"* | Ship with the Tiny5 Duo wordmark; the animal is 0.0.x | The art is the maintainer's time (the two drafts *"read[] as a rodent"*, *"not yet a triceratops"*); it must never gate a build. |
| The cloud folder rename (`/ROCKNIX` → the fork's, *"read both"*) | In Phase A | Cut. Keep `/ROCKNIX` as the folder name in 0.0.1. | New code on the sync path, inside a release meant to be "RC2 under its own name" (§1.6). Least surprise (`CLAUDE.md`, D-UI-042) argues *for* leaving a player's cloud folder where they left it. Rename with a proven migration in 0.0.x if ever. |
| The site | Phase A/#337 item 3 | 0.0.x. The release page is the whole surface for 0.0.1. | The pages exist under the old name; a MkDocs build, the domain, hosting and an attribution front page are a day the identity does not need. |
| Hosted-runner VM suites | Phase C, *"as an experiment"* | After 0.0.1; scoped to non-visual, non-timing suites | §1.8. |
| The second box | Phase D, decided | Order after 0.0.1's cold-build count is known, and only with the provisioning blueprint as a script that the second box proves | §2 risk 11; the purchase is settled, its timing is not. |
| Mail beyond reading | 02:53's four uses | Read-only until the rules are code on *both* channels; no webhook trigger; drop the verification-code use | §2 risk 4. |
| The eleven printed script lines in upstream-owned scripts | Phase A | Keep only where the script is fork-owned; leave upstream's lines | Each is a merge conflict for a line a player sees once in a log. |

### 3.3 Add to 0.0.1

- **A brand check that is mechanical.** The fork already has `tools/vm-visual-qa`, `tools/vm-walks/`, and a `FORBIDDEN_PATTERNS` secret for `fork-wordlist.yml`. A `brand` suite: (a) `strings` over the image's `/etc/os-release`, the ES binary's string table and the theme's XML for `ROCKNIX`/`rocknix.org`/the Discord address, allowing an explicit list of internal names (units, script paths) that `NAMING.md` documents; (b) the walk's frames checked for the old logo (a template match against `rocknix-logo.png` at each panel size is enough). PASS is the exit criterion, not an eyeball.
- **The updater read.** One paragraph, from the code, saying what `rocknix-update` asks, of whom, how it picks a file and compares a version, and whether it follows redirects. Before the estimate.
- **`/etc/os-release` complete**: `NAME`, `PRETTY_NAME`, `HOME_URL`, `SUPPORT_URL`, `BUG_REPORT_URL`, `VERSION`, `BUILD_ID`; decide `ID` deliberately (scripts may switch on it).
- **`NAMING.md` with a forward rule**, not only a backward one: upstream-owned names stay; *every new fork-owned artifact takes the `rasteratops-` prefix from day one*, so the later code-level rename — if it ever happens — touches inherited names only. And I would go further than D-WORKFLOW-085: recommend that the code-level rename of *upstream-owned* paths be recorded as **dropped, not deferred**, for as long as hardware comes from upstream. The maintainer said it is wanted; the register should carry the permanent-tax reasoning next to that wish so the day it is reconsidered, the cost is in front of them.

### 3.4 Reorder the review and the runner

| Option | Sequence | Cost | Yield |
| --- | --- | --- | --- |
| A (the plan, D-083 read literally) | Tier 1 → Tier 2 → Tier 3 → fix all → #336 step 0 → `0.1` | ~85 packets a seat plus fixes before any runner work; months | Complete, but the fork's reason for existing waits behind it |
| B | #336 step 0 spike (days) → `0.1` → Tier 1 in background over 0.1.x → Tier 3 *scoped to the launch path* before step 1 → Tier 2 by triage | Step 0 unblocked immediately; Tier 3 shrinks from 185,000 lines to the launcher, `ApiSystem`, the pause/exit path (thousands) | Delivers the felt change first; reads the code the runner touches, when it touches it |
| C | Tier 1 only, then step 0, then the rest | ~24 packets first | Compromise; still delays the spike by weeks for a review of code the spike does not change |

I recommend **B**. It needs one refinement of D-WORKFLOW-083 by a later row (the register is append-only and *"a later row refines … by citing"*): the gate *"before `0.1`"* becomes "Tier 1 before `0.2`; Tier 3's launch-path slice before #336 step 1; Tier 2 by triage". The review's value is real; its position as a gate on `0.1` is the plan's worst ordering.

**Tier-2 triage rule** (to resolve §1.9): a finding in upstream-written code is (i) a security or data-loss bug → fixed in the fork as the *smallest patch*, kept in a `patches/` directory of its own with its origin, and filed upstream the day D-WORKFLOW-087 lifts; (ii) a behaviour the fork wants different → an override under `projects/ROCKNIX/packages/` (the model `CLAUDE.md` describes), never an edit in place; (iii) anything else → a row in the provenance table and no change. The divergence stays flat.

### 3.5 Establish the merge cadence as a phase, with a gate

Nothing here is settled by the register and it is the fork's largest recurring cost. Proposal: merge `upstream/next` at every ROCKNIX release tag or monthly, whichever is sooner, and always before a fork release. The gate: the four images build warm from the merged head; `vm-qa` PASS; `time-to-play` within ±10 % of the previous release's two numbers; the eight RetroArch patches and the ES pin apply without fuzz; the H700 device-tree patch applies; the `brand` suite PASS (upstream will keep adding ROCKNIX strings). The tool: `tools/upstream-merge` that does the merge in a worktree, runs the gate, and prints a **divergence report** — `git diff --stat upstream/next...next` split into fork-owned roots (allowed to grow) and upstream-owned roots (budgeted, ideally shrinking). That number goes in the work log every merge. When it grows on the upstream-owned side, someone wrote in the wrong place.

### 3.6 EmulationStation: do D-WORKFLOW-080 (a) anyway

The register's option (a) — *"move each bucket's code out of `GuiMenu.cpp` into files of its own first (a mechanical refactor that is itself one reviewable PR)"* — was proposed for upstream's reviewers. The reason survives the fork: `GuiMenu.cpp` is where every upstream ES merge will conflict, and the runner's pause page and cards will land in ES. Do the refactor before step 0's ES work, as fork-internal hygiene, and record the row.

---

## 4. What is missing entirely

1. **A merge cadence, gate and divergence budget** (§3.5). The largest recurring cost has no line in the plan.
2. **A release-branch model.** `issue-337.md` proposes *"`0.0.x` for fixes on it"*, and `next` keeps merging upstream. Fixes for 0.0.x while `next` has moved need either a `release/0.0` branch or the discipline of "no upstream merge until 0.1". Not decided anywhere; the tag scheme (`v0.0.1`?) and what `BUILD_ID` reads are not written.
3. **A security posture for the box, the runner and the channels** (§2 risks 1, 4, 12): token inventory with expiry and revocation; runner isolation; workflow triggers; the MCP mail channel's mask or removal; the commit-identity guard; a note that 2FA enforcement is now on and stays on.
4. **A third-party identity inventory** (§2 risk 8) and an outbound-connection capture: one boot and one update check on guest d with the guest's traffic captured, listing every host the image talks to; any ROCKNIX-owned host is a finding.
5. **The build container pinned and mirrored** (§2 risk 9).
6. **The provisioning blueprint as code** for the second box, with the second box's first job as its proof (§2 risk 11).
7. **An instruction-file sweep that is not player-visible but is the assistant's truth.** `CLAUDE.md` opens *"ROCKNIX is an immutable Linux distribution"* and still says *"User-facing behavior changes need a follow-up docs PR to the separate `ROCKNIX/rocknix.org` repo"*, which D-WORKFLOW-087 makes wrong. The rules the assistant loads every session should describe the project it now works on; #341's scope is the PR policies, not this. Add it.
8. **A definition of "supported device"** for the release page: the four in hand, by name, with panel sizes (the four at 640 × 480, the Nova at 1280 × 960, `issue-337.md`).
9. **A WIP limit.** The plan and its siblings open at least twelve fronts (identity, artwork, cold builds, the rehearsal, four repositories, CI, the CI experiment, the second box, three review tiers, #336, #340, #341, the site, the mail integration, the merge cadence, 135 open issues). One maintainer's *attention* — yeses, approvals, purchases, art — is the constraint the assistant cannot parallelise. The record shows roughly ten maintainer interventions in six hours for Phase B alone. Two fronts open at once is the sustainable number; the plan should say which two.
10. **What "done" means for the assistant's own operational work.** Phase B consumed the plan's first day and produced three corrections; the plan has no exit criterion for "the plumbing is finished and we stop touching it." Propose: after the ES fork, splash fork and site transfer and the four write grants, no organisation, token or mail change for the rest of 0.0.1.

---

## 5. Questions only the owner can answer

| # | Question | Decision it unblocks |
| --- | --- | --- |
| Q1 | Does 0.0.1 ship with the Tiny5 Duo wordmark, or wait for the triceratops? | Phase A's publish date; whether art is on the critical path at all. |
| Q2 | Keep `/ROCKNIX` as the cloud folder name in 0.0.1, or rename now with the two-name read? | Whether 0.0.1 changes the sync path (§1.6, §3.2). |
| Q3 | Which four devices are 0.0.1's supported set, and will each be available for a flash and a yes in the release week? | The release page's device list; the A3 gate's schedule. |
| Q4 | Release branches (`release/0.0` for fixes while `next` merges upstream), or single branch with no upstream merge until 0.1? | The merge cadence's start date and the 0.0.x fix path. |
| Q5 | Merge cadence: every ROCKNIX release tag, monthly, or before each fork release only? And what breakage is acceptable at a merge (e.g. a device's kernel bump breaking the ramoops patch: fix, drop, or hold the merge)? | `tools/upstream-merge`'s gate and the divergence budget (§3.5). |
| Q6 | Order: #336 step 0 spike first and `0.1` on it, with Tier 1 in the background (option B) — or the review tiers before `0.1` as D-083 reads? | The refining register row; what `0.1` contains. |
| Q7 | Self-hosted runner hardening: no `pull_request` jobs on serval, runner as an isolated user, outside-collaborator approval on — accepted? | Phase C's workflow edits; whether Phase C is safe to keep. |
| Q8 | Second Tiny: order now, or after 0.0.1's cold-build count is known? And is the provisioning blueprint to be written as a script first? | Phase D's timing and its exit criterion. |
| Q9 | The bot's mail: read-only until the rules are enforced by code on both channels, no mail-triggered actions, the MCP server removed or masked? | The mail integration's scope; risk 4. |
| Q10 | Will the maintainer ever commit from the box's primary checkout? | Whether the commit-identity guard is a hook or a rule. |
| Q11 | The EmulationStation fork's licence: what does the fork state — MIT (root) or GPL (recipe)? Who reads the recipe's history to find out? | The 0.0.1 release note's licence sentence. |
| Q12 | Third-party identities (scraper developer ID, RetroAchievements client identity, cloud OAuth clients): replace, ask upstream's permission to keep, or turn off — once the inventory exists? | The inventory's disposition; #336's RA path. |
| Q13 | The code-level rename of upstream-owned paths: record as dropped while hardware comes from upstream, or keep "deferred" on the register? | `NAMING.md`'s forward rule; the divergence budget's meaning. |
| Q14 | What was Choice 2? | Whether a decision was taken without being presented. |

---

## 6. Recommended plan, with criteria an agent can verify

Each phase has an entry criterion (what must be true to start) and exit criteria (what an agent reads to call it done). Everything on the VM first; devices only on the named yes (`CLAUDE.md`, D-QA-015).

### P0 — Read before estimating (half a day)

*Entry:* now.
*Exit:*
- A comment on #338 quoting `rocknix-update`'s request (method, host, path), its file-name match, its version compare, and whether it follows redirects — from the code, with the file and line.
- A comment quoting `config/path` and `scripts/build` on whether `DISTRO` and `OS_VERSION` enter the build directory name or stamp hashes; the expected rebuild cost per device written as a number.
- The Phase D numbers reconciled to one set (root per device, cache, images) in the plan body, with the 00:24 measurement as the source.
- The outbound-connection capture: one boot and one update check on guest d, `tcpdump` on the guest, the list of hosts filed; ROCKNIX-owned hosts marked.
- The third-party identity inventory: `grep` for developer IDs, client IDs and user agents across the image's ES config, `rclone` config and the cloud and proxy scripts; one table.
- The ES fork's licence read from the repository root and the recipe's history; one sentence.

### P1 — Plumbing closed (one day, then hands off)

*Entry:* P0 filed.
*Exit:*
- `gh api orgs/rasteratops/repos --jq '.[].name'` lists `distribution`, `emulationstation`, `splash` (the `rocknix-splash` fork) and the site; each transferred, not recreated (issue counts match the source repositories).
- For each: `gh api repos/rasteratops/<repo>/collaborators/rasterabot/permission --jq .permission` reads `write` (or a team with write on all repositories exists).
- `gh api orgs/rasteratops --jq .two_factor_requirement_enabled` reads `true` (recorded at 05:51 UTC; re-read).
- `~/.config/rasteratops/TOKENS.md` (or the register) lists each token: scope, file, mode `0600`, expiry (`2027-10-01 05:27 UTC` for the GitHub token), revocation command.
- `fork-generic-x64.yml` and any self-hosted workflow have `on:` restricted to `push` (branch `next`) and `workflow_dispatch`; no `pull_request` job targets `self-hosted`; the repository's Actions fork-PR setting requires approval. Filed as the workflow's diff and a screenshot-free API read of the setting where GitHub exposes it.
- The runner runs as a user that cannot read `~/.config/rasteratops/` or `~/.ssh/rasterabot_ed25519`: `sudo -u <runner> cat` on each returns `Permission denied`, quoted.
- The MCP server `hostinger-email` removed from user scope, or its output routed through the same mask; `rasterabot-mail`'s `mask test: PASS` re-run.
- A `pre-commit` hook (or the equivalent) refuses a commit authored `rasterabot` when the committing session is not the assistant's; its constructed refusal quoted.
- The build container pinned by digest and mirrored: `docker image inspect --format '{{index .RepoDigests 0}}'` reads a `ghcr.io/rasteratops/...@sha256:` reference; `make docker-image-pull` reads from it.
- After this phase: a register row saying no organisation, token or mail change until 0.0.1 ships.

### P2 — Identity on the VM (two to three days including the cold x64 build)

*Entry:* P1 exit; the Tiny5 Duo wordmark path generated (cell count recorded from the generator, resolving 57 vs 58).
*Exit:*
- `distributions/rasteratops/` exists with `options`, `version` (`OS_VERSION=0.0.1`), `kernel_options`, `config/functions`, the logo; `distributions/ROCKNIX/` untouched (`git diff upstream/next -- distributions/ROCKNIX/` empty).
- `NAMING.md` present with the backward rule (upstream names stay) and the forward rule (new fork-owned artifacts take the new prefix).
- The splash fork's commit pinned in `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk` at an `rasteratops/splash` address; its two scaler changes in the fork's diff.
- The ES fork's pin at an `rasteratops/emulationstation` address; the two strings changed; ES built.
- A GENERIC_X64 image boots on guest d: a frame of the splash at 640 × 480 showing the wordmark at whole-pixel scale 6 (384 × 192 on screen), filed under `docs/qa-frames/`; `cat /etc/os-release` over `tools/vm-serial` shows `NAME`, `PRETTY_NAME`, `VERSION=0.0.1`, `BUILD_ID`, and `HOME_URL`/`SUPPORT_URL`/`BUG_REPORT_URL` on the fork's domain, quoted; the info screen's frame filed.
- The `brand` suite PASS: no `ROCKNIX`, `rocknix.org` or Discord address in `/etc/os-release`, the ES string table or the theme XML outside `NAMING.md`'s allowlist; no template match of `rocknix-logo.png` in any walk frame.
- `tools/vm-qa` full run PASS on the image; the `vocabulary` suite PASS.
- Time to play on the image within ±10 % of RC2's `1.05 s` / `2.03 s` (`issue-336.md`), filed.
- If Q2 is "keep": `grep -rn 'ROCKNIX' <cloud scripts>` shows the folder default unchanged and the diff touches no sync-path file.

### P3 — The upgrade channel, proven end to end on the VM (one day)

*Entry:* P2 exit; 0.0.1 published as a **pre-release** on `rasteratops/distribution` with the RC2-era file-name pattern *and* the new one if P0 found the updater matches by name.
*Exit:*
- A guest booted from RC2's GENERIC_X64 image (`rc2-20260929`) with fixture state (settings, one game save, the cloud folder configured) runs the updater **unaided**: its log shows the request to the old address, the redirect (if any) followed, the 0.0.1 artifact found, downloaded and applied; filed.
- After reboot, `/etc/os-release` reads `VERSION=0.0.1` and the fixture state is intact (`tools/vm-qa`'s rehearsal PASS line).
- A clean install of 0.0.1 on a fresh 16 GB+ disk boots to the carousel (frame filed) — `CLAUDE.md`'s "both paths".
- The update check from 0.0.1 itself finds nothing newer and asks *only* the fork's host (capture filed).

### P4 — The four device images (one to two days of builds, serialised with P3)

*Entry:* P3 exit.
*Exit:*
- Four images from one head: `git rev-parse HEAD` recorded; each image's `/etc/os-release` `BUILD_ID` equal across the four (read from the image files, not a device).
- `.sha256` beside each; `tools/fork-publish-release` dry run shows the tag, the four assets and the note.
- The release note in the maintainer's voice with: what the fork is (*a fork of ROCKNIX, itself a fork of JELOS*), the credits kept, the licence sentence resolved by Q11, the supported device list (Q3), the panel sizes, and — only if P2's brand suite allowlist retains any CC BY-NC-SA image — the attribution with the licence link.

### P5 — Devices on a yes (the maintainer's week)

*Entry:* P4 exit; a per-device yes naming the flash, the upgrade path tested (RC2 → 0.0.1 on one device, clean flash on another) and what it leaves behind.
*Exit:*
- Per device: a photograph or capture of the splash at the panel's size (the Nova's at scale 12, 768 × 384); `/etc/os-release` read over serial or SSH; one game launched and exited; the device-facts row.
- On at least one H700 device, the RC2 → 0.0.1 update taken *through the device's own updater*, its log quoted.
- Then `0.0.1` published (not pre-release): `gh release view v0.0.1 --repo rasteratops/distribution --json body` reads the attribution sentence in the register's wording.

### P6 — The merge cadence, established once before the fork moves (two days)

*Entry:* 0.0.1 published; Q4/Q5 answered.
*Exit:*
- `tools/upstream-merge` exists: merges `upstream/next` into a worktree, runs the gate (four warm builds, `vm-qa` PASS, time-to-play within ±10 %, the eight RetroArch patches and the ES pin and the H700 DT patch apply, `brand` PASS), prints the divergence report split by fork-owned/upstream-owned roots.
- The first merge after 0.0.1 done with it; the report's numbers in the work log; a register row fixing the cadence and the budget.
- D-WORKFLOW-080 (a) executed on the ES fork as fork-internal hygiene: `GuiMenu.cpp`'s bucket code in files of their own, `git diff --stat` of the mechanical move filed, ES built, `vm-qa` PASS.

### P7 — #336 step 0 spike → 0.1 (days), review Tier 1 in the background

*Entry:* P6 exit; Q6 answered as option B (or the register row refining D-083).
*Exit (step 0):*
- RetroArch with menu and on-screen text off, `network_cmd_enable` on, driven from EmulationStation over its command socket: pause, save, load, screenshot, quit each walked on guest d (frames filed); the pause page and a card drawn in ES's look over a running game (frame filed).
- `tools/time-to-play` on the same guest: the two numbers for step 0 beside RC2's, in a table on #336.
- The protocol ES speaks written down in one page, so the runner implements the same verbs later.
- `0.1` cut from that head with the same P2–P5 gates.
*Exit (Tier 1, background):* `docs/audits/<date>-milestone-whole-codebase-tier-1/` with the six phase files and `tools/lint-audit-artifacts` PASS; the punch list filed as `0.1.x` items; no gate on `0.1`.

### P8 — The rest, in this order, each with the same shape

1. **#340 silent boot** (independent, visible, cheap): the frame series on guest d with every frame classified black/splash/interface, its PASS line; the journal unchanged.
2. **#341 policy relaxation**: after P1's transfers; `tools/rules-check`, `tools/register-check` and the push guard's constructed violations re-run and the still-refusing ones named. Include the instruction-file sweep (§4.7): `CLAUDE.md`'s first line and the rocknix.org docs rule corrected.
3. **The site** (0.0.x): MkDocs build's last line filed; front page carries the attribution.
4. **Tier 3, launch-path slice**, then **#336 step 1** (the runner, weeks) proven against step 0's two numbers on the same guest.
5. **Phase D's second box**: the blueprint as a script; the second box provisioned by it; its first job a GENERIC_X64 build whose `vm-qa` PASSes on the first box — that is the exit criterion for "identical".
6. **Phase C's hosted VM experiment**: scoped to the non-visual, non-timing suites; ten runs, not one, before any workflow depends on it; flake rate recorded.
7. **Tier 2 by triage** (§3.4), the provenance table for patches (one row per patch file; row count equal to file count, `issue-339.md`'s own criterion).
8. **The triceratops**, whenever the maintainer draws it: a 32 × 20 SVG on whole-number coordinates per `issue-337.md`'s specification; it drops into the same path as the wordmark.

### What one maintainer with an assistant can sustain

The record shows the assistant can drive a phase like P1 in a day *if* the maintainer is present for roughly ten interventions; it shows the assistant's estimates leave out rebuilds, repositories and its own operational churn; and it shows the maintainer's scarce inputs are yeses, approvals, art and purchases. So: two open fronts at a time, of which at most one needs the maintainer's hands that week; a fork release no oftener than the merge cadence; and the divergence report as the monthly number that says whether the fork is still cheap to keep. If that number climbs on the upstream-owned side for two merges running, stop and read `NAMING.md`'s forward rule again.

---

## 7. Summary of disagreements with the plan

1. Phase A is four to six days, not one; the plan's own comments say so.
2. 0.0.1 should be RC2 plus identity and nothing on the sync path; cut the cloud-folder rename, the site, the animal.
3. The update channel is the untested piece; prove it with RC2 finding 0.0.1 unaided, including the redirect.
4. The box is a public repository's runner holding every credential; harden before any more channels are added.
5. The review tiers must not gate `0.1`; run #336 step 0 first and Tier 1 in the background (a register row refining D-WORKFLOW-083).
6. Tier-2 findings in upstream code are patches or overrides, never edits in place.
7. A merge cadence with a gate and a divergence budget is the missing phase; the code-level rename of upstream paths should be recorded as dropped while hardware comes from upstream.
8. D-WORKFLOW-080 (a) is fork hygiene and should be done before the runner touches EmulationStation.

---

## 8. Provenance

```json
{
  "council_run": "2026-09-30-rasteratops-fork-plan-r2",
  "facilitator": "council-facilitator@1.14.0",
  "reader": "council member (this seat)",
  "read_mode": "embedded corpus; no filesystem access; hashes are the Facilitator's, verified at embed time, not re-computed by this seat",
  "source_file_paths": [
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md"
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
    "D-WORKFLOW-088 is named by the brief and by decision-register-fork-rows.md's title but is not present in the embedded table (rows 080-087 only); not read, not inferred.",
    "issue-338.md announces two flagged choices and labels only Choice 1; Choice 2 is not identifiable from the corpus.",
    "Not in the corpus and asserted here only as things to verify: the updater's actual mechanism (rocknix-update source), whether DISTRO/OS_VERSION key the build directory or stamps (config/path, scripts/build), the theme's shipped artwork, the third-party identifiers embedded in the image, the trigger scope of fork-generic-x64.yml, and the runner's user isolation."
  ]
}
```

=== END claude-analysis.md ===

=== START gemini-analysis.md ===

# Adversarial Critique and Technical Roadmap: The Rasteratops Fork Plan (#338)

## 1. Claims and Assumptions That Are Wrong, Unproven, or Contradicted

The plan in `issue-338.md` and its associated issues rests on several flawed technical assumptions, unproven capabilities, and internal contradictions.

### 1.1 The "About a Day of Work Plus Artwork" for Phase A is Physically Impossible
* **The Claim:** `issue-338.md` specifies under *Phase A: the identity, 0.0.1* that the phase will take *"about a day of work plus the artwork"* to produce four bootable device images from a single head, execute VM QA suites, run an upgrade rehearsal from RC2, and publish version 0.0.1.
* **The Evidence:** 
  1. `issue-338.md` (Phase D) explicitly measures that *"a cold build of one device is hours and about 90 GB of root; four devices plus the source cache is about 400 GB."*
  2. In `issue-338.md` (Comment 2026-09-30T00:09:32Z), the assistant admits: *"a cold rebuild of four devices is a day on one box, half on two."*
  3. In `CLAUDE.md` (`846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`), the build architecture relies on `distributions/<DISTRO>/options`. Creating `distributions/rasteratops/` with modified `DISTRONAME`, `OS_VERSION`, and kernel options invalidates package stamps across the build roots.
  4. In `issue-338.md` (Comment 2026-09-30T00:09:32Z): *"today no x64 build may run while vm-qa runs, because the build replaces the image the suites read and starves the guests."*
* **The Reality:** A full four-target build from scratch on a single 24-core machine (`serval`) takes more than 24 hours of raw compute time alone, during which zero VM QA passes can execute without starving the compiler or corrupting artifacts. Claiming Phase A takes "about a day" ignores the verified physical build constraints of the current estate.

### 1.2 The "Brand Rename, Not a Path Rename" (Choice 1) Hides a Fatal Upstream Divergence Trap
* **The Claim:** `issue-338.md` states: *"Renaming the paths and the script names would touch thousands of files and turn every upstream/next merge -- the hardware work the fork keeps -- into a conflict across all of them... The proposal: the player-visible identity changes completely... and the internal paths and script names stay as upstream has them... The maintainer's 'name sweep across the code base' is read as the visible sweep unless they say otherwise."* This is reinforced by D-WORKFLOW-085 (`decision-register-fork-rows.md`, `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`): *"the code-level rename of the internal paths and script names is wanted and comes later, as its own item with the merge cost taken when it is done."*
* **The Evidence & Contradiction:** 
  1. If the code-level rename of internal paths (`projects/ROCKNIX/` and `rocknix-*` scripts) is "wanted and comes later", postponing it guarantees that when it *is* executed, the merge surface with `upstream/next` will be vastly larger, instantly destroying the ability to merge upstream hardware improvements.
  2. Conversely, maintaining a split identity where user-facing strings say "Rasteratops" while scripts remain `rocknix-*` leaks across system interfaces. In `CLAUDE.md`, services, network shares, partition labels, and paths (`/storage/.config/rocknix/`) are deeply intertwined with the upstream name. In `issue-338.md`, the audit counted 3,485 filenames and 1,229 files containing the upstream name. A superficial rename of `/etc/os-release`, 11 script lines, and 2 UI strings leaves hostnames, SMB shares (`\\ROCKNIX`), mount points, and systemd units broadcasting the old identity.
  3. The plan pretends this dual state is an interim compromise, but in reality it creates a technical debt ratchet: you either permanently keep the upstream paths and abandon the "code-level rename", or you execute the code-level rename and permanently sever upstream tracking.

### 1.3 Cloud Runner VM QA (Phase C) is Technically Unviable on Standard Hosted Runners
* **The Claim:** `issue-338.md` (Phase C) proposes: *"The VM suites on hosted runners as an experiment: Ubuntu hosted runners expose `/dev/kvm`, so `tools/vm-qa` can boot the image there if the image arrives as a release artifact (2 GB) and the run fits the six-hour limit; measured once before it is relied on."*
* **The Evidence & Contradiction:**
  1. In `CLAUDE.md`, running VM QA requires strict resource thresholds: *"VM disk must be 16GB+ or first boot breaks in a way that looks like a graphics bug"* and *"the VM suites need two guests at 2 GB and one at 4 GB"* (`issue-338.md`, Comment 2026-09-30T00:16:02Z).
  2. Standard GitHub-hosted `ubuntu-latest` runners provide only 7 GB of total host RAM and 2 vCPUs. Running QEMU with a 4 GB guest allocation, software rasterization (llvmpipe) or nested KVM, screen capture, OCR, and disk operations within a 7 GB host limit will trigger Linux OOM kills (`cc1plus`/QEMU terminations identical to those observed on `serval` in `issue-338.md`).
  3. "Measured once before it is relied on" violates the project's own core verification tenets. A timing-dependent visual QA suite running inside nested virtualization on shared, throttling cloud instances will produce non-deterministic timing flakiness.

### 1.4 Remaining in the GitHub Fork Network Contradicts the Fork's Independence Goals
* **The Claim:** `issue-338.md` (Comment 2026-09-30T05:04:00Z and D-WORKFLOW-086) asserts: *"The repository is `rasteratops/distribution`: transferred from `maxengel/rocknix` into the rasteratops organisation and kept in ROCKNIX's fork network, because a transfer carries the issues... Recommendation stands: transfer, as `rasteratops/distribution`, and stay in the fork network."*
* **The Evidence & Contradiction:**
  1. In `issue-337.md` (`4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`), the maintainer stated: *"I have no interest in a Discord server, managing a community, etc., but I am interested in having a better experience, even if it's mainly just for me... quietly offer an alternative."*
  2. In `LICENSE.md` (`61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`), ROCKNIX branding is CC BY-NC-SA 4.0: *"not in any way that suggests the licensor endorses you or your use."*
  3. When a repository remains inside a GitHub fork network:
     - The repository header perpetually displays `forked from ROCKNIX/distribution`.
     - External users opening PRs will default their base branch to `ROCKNIX/distribution:next`, risking accidental upstream PR submissions that reignite the hostility documented in `issue-335.md` (`7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`, Comment 2026-09-29T23:31:35Z).
     - GitHub does not index code in forks for search unless the fork exceeds the parent's star count.
  4. The claim that leaving the fork network drops issues was conflated with GitHub's UI "Leave fork network" button. Detaching a repository via GitHub Support retains all issues, wiki, releases, and PRs while cleanly severing the fork network relationship.

### 1.5 The Scope of Issue #339 Completely Inverts the Maintainer's Explicit Working Capacity
* **The Claim:** `issue-339.md` (`c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`) and D-WORKFLOW-083 establish a 450,000-line multi-tier adversarial code review, requiring: *"Every punch item resolved through Phase 7 before 0.1, or accepted by a register row."*
* **The Evidence & Contradiction:**
  1. In `issue-335.md` (Comment 2026-09-29T23:24:04Z and D-WORKFLOW-082), the maintainer explicitly stated: *"Really, honestly, don't want to read through everything... I trust our process, so I don't feel the need to manually review our commits, nor do I even have the time."*
  2. The assistant's estimate in `issue-339.md` involves at least 50 audit packets across both seats (approx. 100 LLM council runs). Each punch list item requires a VM proof, a fix, regression verification, and documentation.
  3. Setting an exit criterion that every single punch list item across 121,000 lines of fork code, 140,000 lines of OS scripts, and 185,000 lines of EmulationStation must be resolved or register-accepted before 0.1 creates an unmaintainable administrative bottleneck that directly contradicts the maintainer's available time and direction.

---

## 2. Risk Matrix (Ordered by Expected Cost)

| Rank | Risk Area | Expected Cost | Probability | Severity | Description & Cascading Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Upstream Divergence & Merge Atrophy** | **Critical** | High | Fatal | Upstream `ROCKNIX/distribution` actively touches packages, scripts, and build logic. As Rasteratops modifies `distributions/`, build scripts, RetroArch patches, and UI submodules, git merges from `upstream/next` will encounter escalating merge conflicts. If conflict resolution takes longer than upstream's development cycle, merges will be abandoned, leaving Rasteratops responsible for low-level kernel, bootloader, and SoC bring-up—the exact work the maintainer refused to take on (`issue-336.md`). |
| **2** | **EmulationStation Monolithic Fork Decoupling** | **High** | High | Severe | EmulationStation in `projects/ROCKNIX/packages/ui/emulationstation/` is already diverged by +42,180 lines (`issue-339.md`). The plan in `issue-336.md` proposes intercepting game launches, running a control socket, and drawing in-game UI directly from ES. Transforming ES from a game launcher into an active in-game HUD will touch core rendering loops (`Window.cpp`, `Renderer.cpp`), completely breaking any possibility of rebasing onto upstream ROCKNIX/Batocera ES updates. |
| **3** | **Single Hardware Bottleneck & Estate Deadlock** | **High** | High | Severe | The entire project currently depends on a single physical box (`serval`, 24 cores, 60 GB usable RAM). A single cold build of 4 devices requires ~400 GB and ~24 hours. Because `vm-qa` cannot run while x64 builds are active without memory exhaustion and artifact contention (`issue-338.md`), development is serialized. If `serval`'s NVMe suffers wear-out or a hardware fault, development, testing, and release engineering immediately halt. |
| **4** | **Upgrade Brick Risk & State Disruption** | **High** | Medium | Critical | Handhelds are personal devices containing user save states and configurations (`CLAUDE.md`, `upgrade-and-install.md`). In `issue-338.md`, the plan renames `DISTRONAME` to `rasteratops` and alters `/etc/os-release`. If filesystem labels (`boot=LABEL=ROCKNIX`), mount paths (`/storage/.config/rocknix`), or updater migration hooks fail, an OTA upgrade from RC2 to 0.0.1 will corrupt system mounts, fail to locate kernel roots, or orphan user saves in `/storage`. |
| **5** | **Build Container Supply Chain Dependency** | **Medium** | High | Moderate | `CLAUDE.md` documents that builds use `ghcr.io/rocknix/rocknix-build:latest`. Rasteratops does not control or mirror this container. If ROCKNIX upstream modifies, re-tags, or restricts access to this container, Rasteratops builds will fail immediately and irrecoverably on both local machines and CI runners. |
| **6** | **Unlicensed Code Contamination (`minarch`)** | **Medium** | Medium | Severe | `issue-336.md` identifies `minarch` as the foundation for the proposed headless runner, but explicitly confirms: *"MinUI has no licence file GitHub can find, and code with no licence is all rights reserved by default... minarch is a reference to read, not code to copy."* Using an all-rights-reserved codebase as the structural blueprint for a core C runner under an open-source distribution exposes the project to copyright infringement claims. |
| **7** | **Physical Fleet Regression Divergence** | **Medium** | High | Moderate | The VM test harness (`tools/vm-qa`) tests only `GENERIC_X64`. It cannot catch ARM-specific SoC regressions (Mali GPU drivers, Panfrost on Allwinner H700, Freedreno on Qualcomm SM8550). Because physical testing requires the maintainer's interactive physical verification (`CLAUDE.md`, D-QA-015), physical handheld verification will lag behind rapid VM commits, resulting in releases that boot on QEMU but fail on real panels. |
| **8** | **GitHub API Rate Limits on Device Updaters** | **Low** | Medium | Moderate | Pointing the on-device updater script (`rocknix-update`) directly at the GitHub Releases API for `rasteratops/distribution` exposes handheld users on residential IPs to GitHub's unauthenticated API rate limit (60 requests/hr). When multiple devices poll for updates, requests will fail with HTTP 403 errors. |

---

## 3. What to Change: Phases, Order, Gates, Scope, and Cuts

### 3.1 What Must Be Cut Immediately from Version 0.0.1
1. **CUT the Whole-Codebase Adversarial Review (#339) from the Release Gate:**
   - *Reason:* Imposing a 450,000-line audit and requiring every punch item to be resolved before release completely blocks shipping 0.0.1.
   - *Alternative:* Defer Tier 1 review to a post-release stabilization track. 0.0.1 is defined strictly as RC2 (`69e6039f8f`) with identity changes and regression tests passing.
2. **CUT the Headless Libretro Runner Spike (#336) from 0.0.1:**
   - *Reason:* Designing a new C runner on SDL2/GLES with `rc_client` and socket control is a multi-week systems engineering effort. It belongs in the 0.1.x roadmap, not the 0.0.1 identity release.
3. **CUT the Silent Boot and Shutdown Project (#340) from 0.0.1:**
   - *Reason:* Suppressing kernel output, Plymouth splash transitions, and serial console output introduces major risks to system recovery. In particular, messing with serial output breaks `tools/vm-serial`, the primary debugging conduit for headless VM testing (`CLAUDE.md`).
4. **CUT Cloud Runner VM QA (Phase C):**
   - *Reason:* It is unproven, starved of RAM, and introduces CI flakiness. Keep VM QA entirely on local KVM hardware.
5. **CUT the Intention of a "Later Code-Level Rename":**
   - *Reason:* Reversing D-WORKFLOW-085's assertion that "the code-level rename is wanted and comes later." Make the architectural decision permanent: **internal paths remain `projects/ROCKNIX/` permanently as upstream abstraction wrappers.** We will never execute a code-level path sweep so long as `upstream/next` tracking is maintained.

### 3.2 What Must Be Added to the Scope of 0.0.1
1. **Local Build Container Mirroring:**
   - Rasteratops must immediately build and host its own build container (`ghcr.io/rasteratops/build-box:latest`) pinned from the working Dockerfile, cutting the supply-chain cord to `ghcr.io/rocknix/rocknix-build`.
2. **Static JSON Update Manifest:**
   - Rather than having `rocknix-update` query the GitHub Releases API directly, the build pipeline must generate a lightweight `update-manifest.json` hosted via GitHub Pages or `rasteratops.com` (over the Hostinger infrastructure setup in `issue-338.md`), returning SHA256 hashes and download URLs to avoid rate limits.
3. **Filesystem Label & Partition Migration Safeguard:**
   - The build scripts and updater must explicitly maintain partition label backwards-compatibility (`LABEL=ROCKNIX` and `LABEL=STORAGE`), ensuring that existing RC2 installs do not fail their bootloader initramfs mount phases.
4. **Upstream Policy Relaxation (#341) Executed Before Identity Work:**
   - The upstream restrictions (attribution bans, PR size ceilings, squash-merging single commits) must be relaxed *first* so that development and release tooling are not constrained by ROCKNIX's submission requirements.

---

## 4. What is Missing Entirely from the Plan

1. **Independent Build Container Infrastructure:**
   - The sources acknowledge using `ghcr.io/rocknix/rocknix-build:latest` (`CLAUDE.md`, `issue-334.md`), but have no mechanism or task to fork, build, version, and maintain this container under `rasteratops`. If upstream deletes or alters that image, all local and CI builds break instantly.
2. **Partition Label Compatibility & Storage Boot Contracts:**
   - In LibreELEC/JELOS systems, `/etc/fstab` and initramfs scripts locate system partitions by volume label (`boot=LABEL=ROCKNIX disk=LABEL=STORAGE`). The plan discusses renaming `DISTRONAME` and paths, but never addresses partition volume labels. Changing the label in `scripts/image` breaks bootloaders on existing flashed devices; keeping it requires an explicit compatibility shim.
3. **Explicit Upstream Rebase / Merge Cadence & Conflict Resolution Runbook:**
   - D-WORKFLOW-084 states that `upstream/next` will be merged for hardware work, but provides no operational protocol:
     - What is the merge cadence (weekly, bi-weekly, milestone-based)?
     - How are conflicts in `packages/` or RetroArch patches triaged?
     - What happens if an upstream merge breaks an existing Rasteratops feature?
4. **Decoupling from the GitHub Fork Network:**
   - The plan assumes staying in the fork network is the only way to keep issues, but fails to evaluate contacting GitHub Support to detach the repository while preserving all historical issues, PRs, comments, and assets.
5. **Disaster Recovery and Local Backup Strategy for `serval`:**
   - `serval` holds the local git checkouts, worktrees, 400 GB of build caches, VM images, and developer tooling. There is no automated offsite backup specified for `serval`'s worktrees, build configurations, or local keys (`~/.ssh/rasterabot_ed25519` and `~/.config/rasteratops/`).

---

## 5. Critical Questions Only the Owner Can Answer

The following five questions must be resolved by the repository owner before proceeding:

1. **The Code-Level Rename vs. Upstream Tracking Contract:**
   * *Question:* Do you accept that internal paths (`projects/ROCKNIX/`, `rocknix-*` scripts) will **permanently remain as-is** to preserve upstream hardware merges, formally abandoning the "later code-level rename" envisioned in D-WORKFLOW-085? Or do you insist on eventually renaming all internal code, accepting that doing so will permanently cut off upstream merges and force Rasteratops into total hardware self-sufficiency?
   * *Unblocks:* Determines whether `NAMING.md` establishes an enduring architectural contract or an unstable temporary holding pattern.
2. **Procurement and Timing of the Second Build Machine:**
   * *Question:* Are you ordering the second Lenovo ThinkStation P3 Tiny Gen 2 ($2,000 via your work discount, as discussed in `issue-338.md`) immediately so it can be dedicated as the proving host (`vm-qa`, test suites), or must 0.0.1 be built and verified entirely on `serval`?
   * *Unblocks:* Determines whether Phase D is an immediate prerequisite for multi-device builds or remains a deferred post-0.0.1 decision.
3. **Update Endpoint Architecture:**
   * *Question:* Should device updates query a static `update-manifest.json` hosted on your domain (`rasteratops.com` via Hostinger API) to eliminate GitHub API rate limits, or do you want the updater to query the GitHub Releases API directly despite the risk of rate-limiting on residential IP pools?
   * *Unblocks:* Dictates the updater rewrite in `distributions/rasteratops/` and the release publishing workflow in `tools/fork-publish-release`.
4. **Scope Boundaries for Version 0.0.1:**
   * *Question:* Do you confirm that Version 0.0.1 is **strictly** the proven RC2 code tree (`69e6039f8f`) packaged under the Rasteratops visible identity, with Issue #336 (libretro runner), Issue #339 (adversarial audit), and Issue #340 (silent boot) completely excluded from the 0.0.1 release criteria?
   * *Unblocks:* Prevents scope explosion and defines the exact, achievable boundaries of the 0.0.1 milestone.
5. **Physical Device Flashing Sign-Off for 0.0.1:**
   * *Question:* For the 0.0.1 release, are you prepared to physically flash and test the RG35XX SP (H700) and Retroid Pocket Nova (SM8550) via an explicit interactive session, or do you authorize publishing 0.0.1 on the basis of GENERIC_X64 VM QA passing plus a single physical device smoke test?
   * *Unblocks:* Establishes the physical hardware test matrix required to satisfy the device-testing policy (`CLAUDE.md`, D-QA-015).

---

## 6. Recommended Action Plan: Rigorous, Verifiable Phases

The following revised plan reorganizes the work into sequentially gated phases. Every phase contains machine-verifiable entry and exit criteria.

```
+-----------------------------------------------------------------------+
| Phase 0: Policy Normalization & Secret Scoping (#341)                 |
| (Relax upstream rules, configure rasterabot, unlock rapid iteration)   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 1: Build Container & Update Endpoint Infrastructure             |
| (Mirror build container, deploy update-manifest.json on rasteratops)  |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 2: Visual Identity & Distribution Asset Injection (#337)        |
| (distributions/rasteratops, splash fork, 32x20 logo, Tiny5 Duo wordmark) |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 3: Single-Target GENERIC_X64 VM Proof & Upgrade Rehearsal       |
| (Build X64, boot guest d, verify splash frame, rehearsal from RC2)    |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 4: Full Multi-Device Compilation & Hardware Release Matrix      |
| (Build 4 device images, verify build stamps, physical testing sign-off) |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 5: Tag, Artifact Publication & Release 0.0.1                    |
| (Publish 0.0.1 on GitHub Releases with CC BY-NC-SA attribution)       |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 6: Post-Release Hardening & Upstream Merge Cadence              |
| (Setup 2nd box, schedule upstream sync, execute Tier 1 audit #339)    |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
| Phase 7: Next-Gen Architecture Spike (Towards 0.1) (#336, #340)       |
| (RetroArch socket HUD, clean-room C runner spike, silent boot sequence) |
+-----------------------------------------------------------------------+
```

---

### Phase 0: Policy Normalization, Tooling Relaxation, and Secret Scoping
* **Intent:** Implement Issue #341 immediately. Remove obsolete upstream contribution restrictions so that development tooling, commit authorship (`rasterabot`), and PR flows operate unimpeded.
* **Entry Criteria:**
  1. `git log -1` on `next` confirms repository is at or ahead of `e7d7b35884` (`issue-338.md`).
  2. `gh auth status` confirms active login as `rasterabot` (`issue-338.md`, Comment 2026-09-30T05:48:07Z).
* **Actions:**
  1. Update `.githooks/pre-push` to drop `pr/*` single-commit enforcement and upstream AI disclosure checks. Retain secret and credential scanning.
  2. Modify `tools/pr-stack-check` to turn reviewable-size violations (1,500 lines) into warnings rather than blocking errors.
  3. Retire `PERSONAL_PATTERNS` checks for `.claude/` and `docs/` inside fork-internal workflows.
  4. Record decision rows relaxing D-WORKFLOW-078, D-WORKFLOW-079, and D-WORKFLOW-071 in `docs/decision-register.md`.
* **Exit Criteria (Agent-Verifiable):**
  - `tools/rules-check` exits `0`.
  - `tools/register-check` exits `0`.
  - Verification run of `.githooks/pre-push` passes against a multi-commit test branch.

---

### Phase 1: Build Container & Update Infrastructure Provisioning
* **Intent:** Sever supply chain dependencies on ROCKNIX build infrastructure and configure an independent update endpoint.
* **Entry Criteria:**
  - Phase 0 exit criteria verified.
  - Access to GitHub container registry (`ghcr.io/rasteratops`) verified via `docker login`.
* **Actions:**
  1. Clone upstream build container definition; build and publish `ghcr.io/rasteratops/build-box:latest`.
  2. Update `Makefile` and `CLAUDE.md` to reference `ghcr.io/rasteratops/build-box:latest`.
  3. Create `packages/tools/rasteratops-update/` or modify `rocknix-update` to fetch updates from `https://updates.rasteratops.com/manifest.json` (or GitHub Pages equivalent) instead of direct GitHub API calls.
  4. Ensure update manifest generator is integrated into `tools/fork-publish-release`.
* **Exit Criteria (Agent-Verifiable):**
  - `docker pull ghcr.io/rasteratops/build-box:latest` completes with valid SHA256 digest.
  - Mock update query against the test manifest returns HTTP 200 with valid image signature.

---

### Phase 2: Visual Identity & Distribution Asset Injection
* **Intent:** Implement Phase A and Issue #337 without renaming internal paths. Create `distributions/rasteratops/` and fork `rocknix-splash`.
* **Entry Criteria:**
  - Phase 1 exit criteria verified.
  - SVG asset for 32x20 logo provided by maintainer, or interim Tiny5 Duo wordmark path data generated (`issue-337.md`, Comment 2026-09-30T01:40:33Z).
* **Actions:**
  1. Fork `ROCKNIX/rocknix-splash` into `rasteratops/splash`. Replace compiled SVG path arrays in `main.c` with the 32x20 logo and Tiny5 Duo wordmark path data. Fix aspect ratio scaling to snap to integer scale factors (6x for 640x480, 12x for 1280x960; `issue-337.md`, Comment 2026-09-30T02:03:12Z).
  2. Create `distributions/rasteratops/`:
     - `options`: Define `DISTRONAME="rasteratops"`, `OS_NAME="Rasteratops"`.
     - `version`: Define `OS_VERSION="0.0.1"`, `DISTRO_VERSION="0.0.1"`.
     - `logos/`: Add SVG and PNG rasteratops logos.
     - `config/functions`: Ensure partition search checks `LABEL=rasteratops` falling back to `LABEL=ROCKNIX`.
  3. Update package recipe `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk` to point `PKG_SITE` and `PKG_URL` to `rasteratops/splash` at the pinned commit hash.
  4. Add `/ROCKNIX` and `/rasteratops` dual-path resolution for cloud saves (`issue-338.md`, D-WORKFLOW-050).
  5. Add `NAMING.md` documenting why internal paths retain `projects/ROCKNIX/` to facilitate upstream hardware merging.
* **Exit Criteria (Agent-Verifiable):**
  - `tools/pkgcheck rocknix-splash` exits `0`.
  - `grep -rn "DISTRONAME" distributions/rasteratops/options` outputs `DISTRONAME="rasteratops"`.
  - `test -f NAMING.md` exits `0`.

---

### Phase 3: Single-Target GENERIC_X64 VM Proof & Upgrade Rehearsal
* **Intent:** Compile the GENERIC_X64 target, verify the boot splash and branding inside QEMU guest d, and validate upgrade persistence from RC2.
* **Entry Criteria:**
  - Phase 2 exit criteria verified.
  - `serval` volume has at least 500 GB free disk space (`df -h /workspace`).
* **Actions:**
  1. Execute clean build of `GENERIC_X64`:
     ```bash
     PROJECT=ROCKNIX DISTRO=rasteratops DEVICE=GENERIC_X64 ARCH=x86_64 ./scripts/image mkimage
     ```
  2. Boot resulting image under `tools/generic-x64-vm` (guest d, 640x480).
  3. Capture visual frames during boot via `tools/vm-visual-qa`. Verify splash screen displays the rasteratops logo and Tiny5 Duo typography.
  4. Query serial console via `tools/vm-serial`:
     - Check `/etc/os-release` reads `NAME="Rasteratops"` and `VERSION="0.0.1"`.
     - Check `systemctl is-system-running` reaches `running` or `degraded`.
  5. **Upgrade Rehearsal:** Spin up a clean VM with RC2 (`69e6039f8f`). Populate `/storage` with sample retroarch save states and custom configs. Deploy 0.0.1 `.tar` update to `~/.update/`. Reboot. Verify all configs, saves, and cloud sync paths persist intact (`upgrade-and-install.md`).
* **Exit Criteria (Agent-Verifiable):**
  - Visual QA frame matching: `docs/qa-frames/0.0.1-boot-splash.png` passes visual comparison with 0 diff on logo coordinates.
  - Command `cat /etc/os-release` over serial matches expected fields.
  - Rehearsal suite output: `tools/test-upgrade-rehearsal` logs `UPGRADE_SUCCESS: PRESERVED_STORAGE=true`.

---

### Phase 4: Full Multi-Device Compilation & Hardware Release Matrix
* **Intent:** Compile all production device targets from the identical git commit and execute physical hardware validation.
* **Entry Criteria:**
  - Phase 3 exit criteria verified.
  - Maintainer confirms availability for physical device smoke testing.
* **Actions:**
  1. Sequentially compile device targets on `serval`:
     - `make docker-H700` (RG35XX SP)
     - `make docker-SM8550` (Retroid Pocket Nova)
     - `make docker-RK3566` (RG353M)
  2. Generate SHA256 checksums for each release image in `target/`.
  3. Interactive Device Testing (per `CLAUDE.md`, D-QA-015):
     - Request explicit maintainer sign-off to flash RG35XX SP (H700) using `docs/device-flashing-runbook.md`.
     - Verify panel display at 640x480, input controls, audio, and save state persistence.
     - Record maintainer confirmation in issue tracker.
* **Exit Criteria (Agent-Verifiable):**
  - All four target images exist in `target/` with valid non-empty sizes (>1 GB) and `.sha256` files.
  - `git log -1 --format=%H` matches across all build metadata stamps.
  - Device test log in issue comments includes maintainer's explicit confirmation for H700 hardware boot.

---

### Phase 5: Tag, Artifact Publication & Release 0.0.1
* **Intent:** Formally publish Version 0.0.1 on GitHub Releases and update the documentation site.
* **Entry Criteria:**
  - Phase 4 exit criteria verified.
  - Maintainer approves release text containing the mandatory CC BY-NC-SA attribution line (`LICENSE.md`, `issue-334.md`).
* **Actions:**
  1. Create annotated git tag `v0.0.1` signed by `rasterabot`.
  2. Execute `tools/fork-publish-release --tag v0.0.1`:
     - Upload 4 OS images and checksums.
     - Include release body stating: *"Rasteratops is an independent distribution for handheld gaming devices, forked from ROCKNIX (itself a fork of JELOS). All original ROCKNIX branding and marks are retained under CC BY-NC-SA 4.0 attribution."*
  3. Update `docs/decision-register.md` marking 0.0.1 shipped.
* **Exit Criteria (Agent-Verifiable):**
  - `gh release view v0.0.1 --repo rasteratops/distribution --json assets` returns 4 image tarballs and 4 checksum files.
  - HTTP check against release download endpoints returns 200 OK.

---

### Phase 6: Post-Release Hardening, Estate Scaling, and Upstream Merge Cadence
* **Intent:** Establish sustainable long-term infrastructure before beginning complex architectural work.
* **Entry Criteria:**
  - Version 0.0.1 successfully published.
* **Actions:**
  1. **Provision Second Build Box:** Commission the second Lenovo ThinkStation P3 Tiny Gen 2. Mirror configuration from `serval`. Dedicate Box 1 to compilation (`make docker-*`) and Box 2 to continuous VM QA (`tools/vm-qa`).
  2. **Upstream Merge Cadence:**
     - Configure a bi-weekly scheduled workflow to fetch `ROCKNIX/distribution:next`.
     - Generate merge-preview diffs filtered strictly to `packages/` and `projects/ROCKNIX/`.
     - Establish a rule: merges must never touch `distributions/rasteratops/`.
  3. **Execute Tier 1 Adversarial Audit (Issue #339):**
     - Run `code-auditor` across the fork's 121,000 lines of original additions.
     - File discovered bugs as 0.0.x punch-list items.
* **Exit Criteria (Agent-Verifiable):**
  - Second build box reachable over SSH, reports identical toolchain versions (`gcc --version`, `docker --version`), and passes `tools/box-check`.
  - Upstream merge test dry-run (`git merge-tree`) executes cleanly against `ROCKNIX/distribution:next`.
  - Audit artifact filed under `docs/audits/` with `tools/lint-audit-artifacts` returning PASS.

---

### Phase 7: Next-Gen Architecture Spike (Towards Version 0.1)
* **Intent:** Address Issues #336 (headless libretro runner) and #340 (silent boot) safely without compromising system stability.
* **Entry Criteria:**
  - Phase 6 complete; Tier 1 audit punch list resolved.
* **Actions:**
  1. **Step 0 of Issue #336 (Safe Path):**
     - Enable RetroArch's network command interface (`network_cmd_enable = true`).
     - Implement ES in-game overlay menu communicating with RetroArch via UDP socket (pause, save, load, exit).
     - Suppress RetroArch native OSD alerts; render cards in ES.
     - Benchmark using `tools/time-to-play` (`issue-336.md`).
  2. **Step 1 of Issue #336 (Runner Spike):**
     - Clean-room implementation of a minimalist C runner using SDL2 + GLES hardware rendering handshake (`nanoarch` BSD-3 model, NOT copying unlicensed `minarch` code).
     - Benchmark against Step 0 baseline.
  3. **Silent Boot Implementation (Issue #340):**
     - Adjust kernel command line (`loglevel=0 quiet vt.global_cursor_default=0 console=tty3`).
     - Keep serial console (`ttyS0`) active for VM QA serial harness (`tools/vm-serial`).
* **Exit Criteria (Agent-Verifiable):**
  - `tools/time-to-play` confirms game start latency is equal to or faster than baseline RC2 (1.05s on VM).
  - VM visual series verifies boot frames remain pure black or splash without console text while `tools/vm-serial` continues to respond.

---

## 7. Comparison of Approaches

| Architectural Dimension | Initial Plan in #338 / #335 | Recommended Plan (This Analysis) | Rationale for Change |
| :--- | :--- | :--- | :--- |
| **0.0.1 Scope** | Visible rename + full codebase audit (#339) + cloud runner KVM experiment + libretro runner spike (#336). | Visible identity + update manifest + container mirroring + single-head multi-device build. | Cuts non-essential R&D from the initial identity release; delivers a stable 0.0.1 within days instead of months. |
| **Code-Level Rename** | Deferred as a "wanted later item" (D-WORKFLOW-085). | **Permanently rejected.** Internal paths remain `projects/ROCKNIX/` indefinitely. | Eliminates the technical debt trap where a future rename permanently severs upstream hardware merges. |
| **CI & VM QA Host** | Experiment with nested KVM on GitHub-hosted Ubuntu runners (Phase C). | Local execution only on `serval`, transitioning to a dedicated 2nd Tiny PC. | Cloud runners lack sufficient RAM (7 GB vs. 16 GB required), causing OOM crashes and timing flakiness. |
| **Upstream Submissions** | Ambivalent dual-prong strategy lingering across #334 and #335. | Single-prong focus on Rasteratops; generic bugfixes upstreamed only when trivial. | Prevents wasted maintainer cycles trying to satisfy ROCKNIX's strict `AGENTS.md` accountability rules. |
| **Libretro UI Architecture** | Rapidly clone `minarch` into an in-process ES runner (#336). | Step 0 (control RetroArch via socket) first; clean-room GLES runner spike second. | Avoids copyright infringement on unlicensed MinUI code; provides immediate UX wins with zero core breakages. |
| **Hardware Fleet QA** | Presumed achievable via quick local VM and device testing. | Strict gating: VM QA automated; physical device flashing gated by explicit interactive sign-offs. | Prevents bricking user handhelds; respects the project's foundational rule that nothing runs on hardware without a "yes." |

---

## Provenance and Citation Summary

The analysis above is grounded in the declared corpus. Specific citations reference:
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md` (`sha256: 371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md` (`sha256: 7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md` (`sha256: 4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md` (`sha256: c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md` (`sha256: 188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md` (`sha256: 433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md` (`sha256: cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md` (`sha256: 7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md` (`sha256: 63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md` (`sha256: 846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`)
- `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md` (`sha256: 61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`)

=== END gemini-analysis.md ===

=== START gpt-analysis.md ===

# Rasteratops fork plan: make 0.0.1 a safe compatibility release

## Recommendation

**Proceed with the fork as decided, but replace the plan’s critical path.** The critical path is not artwork → repository transfers → cloud CI → another build box. It is:

> **Freeze the release lineage → establish the release and migration contracts → change the visible identity → build immutable artifacts → prove clean installation and preservation of existing state → publish.**

D-WORKFLOW-084 defines 0.0.1 as RC2’s tree, `69e6039f8f`, under the fork’s own identity. D-WORKFLOW-085 postpones the code-level rename. D-WORKFLOW-087 parks submissions to ROCKNIX. Those decisions make a narrow release possible; they should be used to prevent the infrastructure and frontend roadmaps from expanding it.[^register]

My principal objections are:

1. **The updater and persistent-state transition are treated as address and naming changes, although they are compatibility changes.**
2. **“Four images from one head” is not a sufficient release identity across the distribution, EmulationStation, splash, build container, and downloaded sources.**
3. **The current account arrangement does not demonstrate separation between automation, building, and release authority.**
4. **The plan understates the continuing cost of the EmulationStation fork and overstates what retaining upstream hardware support makes automatic.**
5. **The proposed audit is a useful repository review, not evidence that the entire operating system has been reviewed.**

Do **not** make 0.0.1 wait for the second box, hosted VM QA, the full three-tier review, silent boot, the new runner, or the internal rename. Conversely, do not publish it merely because the splash and information screen look correct.

This analysis uses the embedded source snapshot. Source-reported measurements and API observations are not measurements I reproduced. Provenance and missing primary evidence are recorded at the end.

---

## 1. Establish the actual starting point

The issue bodies contain proposals subsequently superseded by comments and register rows.

| Area | State supported by the latest embedded record | Planning consequence |
|---|---|---|
| Direction | D-WORKFLOW-084–087 settle the name, independent product, staged rename, transferred distribution repository, and pause on ROCKNIX submissions.[^register] | Do not revive #335’s earlier “primary path” of upstream submissions. |
| Distribution repository | #338’s 05:14 comment reports the transfer to `rasteratops/distribution`, redirects, surviving `FORBIDDEN_PATTERNS`, and the address sweep in `1633cbcac2`.[^338] | Verify the migrated state; do not plan this transfer as future work. |
| Organisation and bot | The issue’s completed checkbox records two owners and required 2FA at 05:51. The 05:48 bot comment establishes that the approved token could post a comment and perform the named reads.[^338] | The earlier 403 and disabled-2FA reports are historical failures, not the final state. Neither does the final comment prove every permission needed by future workflows. |
| Other repositories | Phase B still asks for transfers of EmulationStation and the site; #337 additionally requires a splash fork. Their completed migrations are not evidenced here.[^338][^337] | Maintain a separate status and permissions record for each repository. |
| Hardware | The later decision is a second identically provisioned Tiny with 64 GB and a 4 TB NVMe, explicitly “not started now.” The NUC remains a music server.[^338] | The second box is a capacity project, not available release infrastructure. |
| Frontend | #336 evolves from a minarch-derived 2D proposal to a fresh GLES-capable runner, preceded by RetroArch underneath ES’s interface.[^336] | Use the latest direction, not the issue’s original 2D-only acceptance checklist. |

The register extract is titled “080 to 088,” but contains no D-WORKFLOW-088. No additional decision should be inferred from that heading.[^register]

---

## 2. Claims that are wrong, unproven, or internally inconsistent

### 2.1 Findings affecting 0.0.1

| Finding | Evidence | Assessment and required correction |
|---|---|---|
| **“About a day” describes editing, not delivery.** | #338 calls Phase A “about a day of work plus the artwork,” while requiring four images, VM QA, an RC2 upgrade rehearsal, and device proofs. Its later hardware discussion says a cold four-device rebuild takes a day on one box.[^338] | The estimate omits build scheduling, migration investigation, package invalidation, failure repair, and owner-authorised device work. Estimate those separately. Do not promise a one-day release. |
| **A visible rename is not necessarily confined to display strings.** | #338 includes `DISTRONAME`, `/etc/os-release`, release names, updater addresses, and the cloud folder default. `CLAUDE.md` describes layered configuration beginning with `distributions/<DISTRO>/options`.[^338][^claude] | Those values may also select configuration, identify update targets, or locate persisted data. Classify each occurrence as display text, machine identifier, persisted namespace, attribution, or historical record before changing it. |
| **The updater’s interface is unresolved.** | #334 says the updater reads GitHub releases. #337 says it “asks an update endpoint by POST and follows the address it returns.” #338 merely proposes pointing it at the fork’s releases.[^334][^337][^338] | A release page is not automatically a replacement for a POST service. Inspect the actual shipped client and server contract. URL substitution is not an adequate implementation plan. |
| **“Read both” cloud folders is underspecified.** | Phase A proposes changing the player’s `/ROCKNIX` cloud default and says “read both, D-WORKFLOW-050.” The cited decision’s full text is not embedded.[^338] | Reading both does not define conflict resolution, write destination, coexistence with RC2, or behaviour when both contain different saves. Preserve an upgraded installation’s configured root; do not rename or merge remote data as a branding operation. |
| **A public repository does not establish source-distribution compliance.** | #334 asserts: “The GPL asks for the source of what is distributed (this fork is public, so that is met by existing).” The actual `LICENSE.md` says bundled works retain their respective licences.[^334][^license] | The conclusion does not follow. The release needs a component-by-component source and notice record tied to its binaries. The full relevant licence texts and corresponding-source contents are not embedded. |
| **The branding licence is abbreviated incorrectly in some planning text.** | #337’s acceptance criteria say “CC BY-SA”; #334’s commentary also uses that shorthand. The primary licence explicitly says **CC BY-NC-SA 4.0**.[^337][^334][^license] | Preserve the actual terms wherever licensed upstream material remains. An attribution sentence is not a substitute for all applicable conditions. Independently created artwork needs its own explicit licence; it does not automatically inherit the upstream artwork’s licence. |
| **The storage budget is stale.** | Phase D uses approximately 90 GB per root and 400 GB for four roots plus cache. A later comment gives 110–147 GB per root and a 38 GB source cache. `CLAUDE.md` separately says a first build needs approximately 200 GB.[^338][^claude] | Using the later root figures gives **478–626 GB before retained images and temporary space**. These may describe different build states; measure both steady occupancy and peak working space rather than choosing the convenient estimate. |
| **Splitting QA off the builder does not prove the WebKit cap can be removed.** | #338 records two compiler deaths at 24 threads and a four-thread cap, then suggests a role split lets the cap loosen.[^338] | That is a hypothesis. Preserve the cap until a controlled build records peak memory, swap behaviour, successful completion, and absence of OOM events. |
| **Hosted KVM is an experiment, not a capability already available to rely on.** | Phase C says Ubuntu hosted runners expose `/dev/kvm`, refers to a 2 GB artifact and a six-hour limit, and explicitly requires measuring once.[^338] | No runner configuration, workflow, eligibility rule, device permissions, execution receipt, or full-suite resource measurement is embedded. Benchmark the exact job. One successful VM boot would not establish capacity for the whole QA fleet. |
| **The process documentation disagrees with the process being proposed.** | `CLAUDE.md` says “there is no unit-test suite” and “`tools/pkgcheck` … is the only lint.” #338 lists numerous host checks and VM suites. `CLAUDE.md` still directs user-facing documentation to the upstream site.[^claude][^338] | This is evidence of stale entry-point guidance, not evidence that the tests do not exist. Reconcile the authoritative instructions before delegating the migration. |
| **#341’s guard acceptance criteria contradict its policy table.** | The table retires the personal-paths guard for the fork. The acceptance criteria say the `pr/*` scans keep personal-paths and credential checks.[^341] | Specify the destination-sensitive rule. Fork records and tools may be allowed; credentials must remain forbidden everywhere. Do not equate those categories or enforce safety only on `pr/*`. |
| **The artwork specification has a small but real unresolved detail.** | #337 first reports a 58×6 wordmark, then specifies 57×6 inside a 64×32 composition. It also says the splash consumes compiled path data, not an SVG file.[^337] | Measure the final bitmap, choose integer-aligned placement, and convert the owner’s SVG into the renderer’s supported representation. “Two one-line changes” is not the acceptance test. |

A further concrete omission is visible in the primary licence file itself: its header embeds the upstream logo and links to upstream releases, activity, pull requests, and Discord. A correct identity sweep must distinguish that presentation chrome from the copyright and licence text that must remain intact.[^license]

### 2.2 Findings affecting the roadmap

| Finding | Evidence | Assessment and required correction |
|---|---|---|
| **“Nothing underneath changed” does not prove the proposed ES-owned in-game experience.** | #336’s step 0 claims all cores, achievements, and netplay work immediately because RetroArch remains underneath, while ES draws the pause page and cards over the game.[^336] | The new work still owns focus, input routing, pause semantics, display composition, notification delivery, and process failure. The command socket alone does not demonstrate those behaviours. |
| **The hardware-rendering support claim is not an inventory.** | #336 says every relevant shipped 3D core has a GLES path and Vulkan can wait.[^336] | Verify exact core revisions, build options, required contexts/extensions, target GPUs, and frontend capabilities. A working N64 core does not establish PSP, Dreamcast, hardware PS1, Saturn, or 3DS compatibility. |
| **The latency attribution is unsupported.** | #336 reports 1.05 s to first frame and states display handover is “where the 1.05 s goes”; it also quotes RetroArch CPU-time measurements.[^336] | End-to-end wall time does not identify its causes. CPU time is not interchangeable with elapsed launch latency. Trace the stages before making the in-process bridge’s benefit part of the justification. |
| **`rc_client` does not establish an unchanged achievements integration.** | #336 says the runner supplies memory, HTTP, and a per-frame call, and that the proxy and offline work carry over “untouched.”[^336] | That is an integration hypothesis. Hashing, memory maps, event delivery, credentials, hardcore restrictions, save/load handling, and offline reconciliation need explicit proofs. |
| **The audit is not “the whole OS” merely because it covers the checked-in tree.** | #339 counts checked-in files, treats patches/configurations by provenance, and proposes approximately twenty, twelve-to-fifteen, and fifteen packets for the tiers.[^339] | Downloaded component sources and their transitive dependencies are not thereby reviewed. State the reviewed boundary accurately. Packet completion and line counts are coverage bookkeeping, not behavioural assurance. |
| **The audit and frontend schedules conflict.** | #339 says Tier 3 is read before the libretro work starts. #336 describes step 0 in days. D-WORKFLOW-083 permits the review to proceed gradually over `0.0.x`.[^339][^336][^register] | Either perform the full prerequisite review before step 0, or explicitly replace that dependency with a focused launch/control-boundary review while retaining the wider audit obligation. An agent must not quietly choose the convenient interpretation. |
| **Interval screenshots cannot prove “every frame.”** | #340 asks for capture “at intervals” and a PASS classification proving every frame is black, splash, or interface.[^340] | Sampling can miss transient text. Specify capture coverage and classifier limits; test the classifier against deliberately injected console/cursor frames. Separate OS-owned output from firmware/panel behaviour, as the issue already anticipates. |

---

## 3. Risks ranked by expected cost

This ordering is a qualitative judgement for the first several releases, not a measured probability model. It weighs repeated maintenance cost as well as exceptional damage.

| Rank | Risk and expected cost | Why it ranks here | Principal control |
|---:|---|---|---|
| **1** | **State loss or a broken update path** | The rename directly touches identifiers, release selection, and cloud namespaces on systems with existing state. A bad transition can damage more than the new image.[^338][^337][^claude] | Explicit migration contract, opt-in RC2 adoption, negative update tests, and a demonstrated recovery path. |
| **2** | **Build or release authority compromised through automation** | #338 places the bot’s GitHub/SSH/mail identities on the working box and retains an owner account for privileged calls. The proposed token scope includes workflow writes.[^338] | Separate build, automation, and release identities; keep owner and release secrets away from general build execution; enforce boundaries remotely. |
| **3** | **Recurring upstream and ES integration debt** | The fork already adds roughly 42,180 ES lines, and #336 acknowledges that deeper integration makes upstream interface changes harder to merge.[^339][^336] | Small integration batches, pinned multi-repository releases, a narrow frontend adapter, and measured conflict/repair effort. |
| **4** | **False confidence from incomplete QA coverage** | The sources distinguish VM proof, GPU/device facts, multiple panels, and stateful upgrades, but do not supply a release support matrix. #335 records a dead page script missed for a week.[^337][^claude][^335] | Explicit coverage by target, board, installation state, and backend; negative controls for the tests themselves. |
| **5** | **A release whose licence/source record cannot be defended** | Primary licences differ by component; some referenced frontend/font licences are only reported second-hand; #334 overstates what public git establishes.[^license][^334][^336][^337] | Exact-build source and notice inventory; unresolved rights block use of the affected component or asset. |
| **6** | **Assistant-produced evidence becoming its own authority** | The record includes mistaken RAM assumptions, a false-positive token-access conclusion, and a mail-redaction failure. Each was corrected, but they demonstrate the limits of confident procedural narration.[^338] | Require observable receipts, negative tests, bounded permissions, and explicit owner decisions—not promises or self-authored checkmarks alone. |
| **7** | **Review and feature expansion starving maintenance** | The tiered review, runner, silent boot, policy cleanup, infrastructure, and upstream work are each substantial independent tracks.[^339][^336][^340][^341] | Work-in-progress limits and release-specific acceptance boundaries. |
| **8** | **Buying capacity before identifying the bottleneck** | The hardware discussion moves from RAM to the NUC to a second Tiny; cloud figures are rough estimates, not quotes or duty-cycle measurements.[^338] | Measure queue time, build resource peaks, and QA contention; provision the agreed second box when authorised, without putting it on the release’s critical path. |

The account errors should be interpreted precisely. The mail code exposed in the transcript was reported as already spent. The token-access error was corrected by the later successful comment. These are evidence that the controls needed improvement, not evidence of an ongoing credential compromise.[^338]

---

## 4. The contracts the plan needs

### 4.1 A release is a dependency closure, not one distribution commit

The plan requires “the four images from one head,” while `CLAUDE.md` says ES is a separate repository and #337 introduces a separate splash fork.[^338][^claude][^337]

Every candidate should therefore have one release manifest containing at least:

- Distribution commit and the approved delta from RC2.
- Full ES and splash commits, plus any separately sourced theme/assets.
- Build-container digest and relevant toolchain/build settings.
- Target, architecture, selected device configuration, distribution identity, version, and build date.
- Source revisions/hashes and carried patches sufficient to identify the inputs.
- Per-image `BUILD_ID`, filenames, sizes, and cryptographic hashes.
- The QA report identifiers for those exact artifacts.
- The source/notice bundle associated with those binaries.

These are **proposed required outputs**, not artifacts demonstrated by this corpus.

There must also be a distinction between:

1. a **build worktree**, which is mutable;
2. a **candidate artifact store**, which is immutable;
3. a **published release**, which points only at verified candidates.

The existing restriction against building x64 while QA reads its image is partly a resource problem and partly an artifact-isolation problem: #338 says the build replaces the image the suites consume.[^338] A second computer does not fix an ambiguous artifact contract. Copy or publish a content-identified candidate into a read-only QA location and verify its hash before and after the run.

### 4.2 The RC2 transition needs a compatibility contract

`CLAUDE.md` states the central requirement plainly: “Every build ships onto devices that already have state,” and requires both upgrade and clean-install checks.[^claude]

The release must answer these questions before implementation:

| Surface | Required behaviour for 0.0.1 |
|---|---|
| RC2 adoption | Deliberate opt-in to Rasteratops. Do not assume an already-installed client will discover a new server merely because the new image contains a different URL. |
| Version comparison | Demonstrate how date/RC-style versions compare with `0.0.1`. Test upgrade, equal-version, older-version, and pre-release cases. |
| Device selection | Reject a release for the wrong target or architecture before writing it. Do not rely on a filename substring alone. |
| Update transport | Define the actual endpoint, request/response schema, timeouts, redirects, authenticity boundary, and artifact validation. |
| Interrupted/corrupt download | Leave the installed system and player state recoverable; reject truncated or incorrect data. |
| Cloud namespace | Existing configurations retain their current root. New-install defaults are a separate decision. If both roots exist, never silently choose or merge conflicting saves. |
| Local state | Preserve the agreed settings, account state, game saves, save states, launcher/state-slot contracts, and recovery settings. Use controlled fixtures rather than recording real secrets. |
| Rollback/recovery | Prove the recovery procedure. If state migration makes downgrade unsafe, state that explicitly and provide a tested restore/reinstallation path. |

A `.sha256` file is useful for corruption detection, but a checksum fetched beside its payload is not an independent answer to release-origin compromise. #334 identifies that checksum convention; it does not describe an update authentication design.[^334]

For automatic updates, define that trust boundary. A signed manifest with a separately controlled release key is one reasonable small design. If safely establishing automatic update/adoption is too large for 0.0.1, **make 0.0.1 an explicit manual-adoption release rather than build an unaudited update service in a hurry**. Its updater must still be fork-aware or clearly unavailable—not silently target ROCKNIX.

### 4.3 Licence compliance must follow the actual shipped material

The primary licence supports three important distinctions:

- ROCKNIX original software/scripts are GPL v2.
- Bundled works and modifications retain their own component licences.
- ROCKNIX branding/images are CC BY-NC-SA 4.0.[^license]

Consequently:

1. **Retain software copyright and licence notices.** A visible-name sweep must not rewrite authorship.
2. **Inventory retained upstream artwork separately from code.** Independent branding is the decided product policy; it is not a reason to erase historical attribution.
3. **Record a licence for the owner’s new artwork.**
4. **Verify Tiny5’s actual terms and what is redistributed.** #337 reports OFL 1.1 and distinguishes rendered images from font redistribution; the font’s primary licence is not embedded.[^337]
5. **Resolve ES’s licence discrepancy before any new linkage decision.** #336 reports MIT at the repository root and GPL in the recipe. That report is a gap to investigate, not a basis for declaring all combinations permissible.[^336]
6. **Do not copy minarch while permission is unresolved.** “No licence file GitHub can find” is not a complete licence investigation, but it certainly is not permission to copy. #336’s final comment correctly makes fresh implementation the rule.[^336]
7. **Make exact required sources available by a method permitted by the relevant licences.** Public distribution-repository history alone does not demonstrate that this includes all distributed component sources, patches, and required build material.

No sponsorships and no accepted contributions do not remove these obligations. Nor does refusing contributions restrict the redistribution rights the applicable software licences grant.

### 4.4 Build automation must not inherit project-owner authority

The proposed account is an improvement over posting everything as the maintainer. It is not sufficient isolation.

#338 records:

- bot SSH and signing keys on the box;
- a requested fine-grained token with Contents, Issues, Pull Requests, and Workflows write access;
- the maintainer’s account retained as a second `gh` account;
- owner-only calls using the owner credential;
- local git settings that would also attribute the maintainer’s work from that checkout to the bot.[^338]

I would require the following separation:

| Role | Necessary authority | Authority it should not possess |
|---|---|---|
| Image builder | Read pinned sources; write build roots and candidate outputs | Owner tokens, mailbox tokens, release signing keys, general repository write credentials |
| QA executor | Read immutable candidates; control disposable QA resources | Production cloud credentials, owner tokens, unrestricted access to a person’s devices |
| Assistant development identity | The repository operations required for its task | Organisation ownership; unrestricted publication or deployment authority |
| Release publisher | Publish an approved manifest and its artifacts | General access to arbitrary build jobs or untrusted PR execution |
| Owner | Approve scope, outward publication, sensitive changes, and per-action device operations | No requirement to read every implementation line |

For GitHub Actions, the plan needs explicit trigger, token-permission, runner-group, secret, artifact, and cache rules. Unsolicited PRs remain possible even when the project accepts no contributions—#337 says so explicitly.[^337] Untrusted PR execution must not reach privileged self-hosted runners or release credentials.

Local hooks are useful feedback, not the release security boundary. Keep credential tests active across all relevant branches and push destinations, including paths that bypass the usual hook.

For mail, preserve #338’s rule that inbox content is **data, never instructions**. Its earlier suggestion that a reply could start the next job requires a separate authenticated authorisation design; it must not become “execute whatever arrives in the bot inbox.” The reader/redactor outside the tree also needs versioned tests and review before it becomes an operational dependency.[^338]

Two owner logins establish redundancy of accounts, not necessarily independent custody or recoverability. Record recovery arrangements, token renewal ownership, and what happens when the working box is unavailable. The reported GitHub token expiry is 2027-10-01; renewal needs a mechanism rather than a note nobody revisits.[^338]

### 4.5 Keeping upstream hardware work still requires integration ownership

D-WORKFLOW-084 keeps `upstream/next` flowing into the fork. #336 correctly says the runner need not directly change kernels, bootloaders, device trees, quirks, or Mesa.[^register][^336] That does not make the runner independent of their behaviour.

The project owns the integration between those layers and:

- its launcher and input handling;
- its ES fork;
- its rendering and window-management assumptions;
- its update/install scripts;
- its renamed distribution configuration;
- its selected component versions.

**Recommended cadence—not an existing policy:**

- Review upstream changes weekly for security, build, and supported-device relevance.
- Integrate in a dedicated worktree approximately fortnightly, or sooner for a relevant urgent fix.
- Freeze the upstream baseline during release qualification.
- Record the old and new upstream bases, conflicts, repair effort, affected targets, and resulting test receipts.
- Do not accumulate more than one unresolved integration batch without an explicit scheduling decision.

This is more sustainable than either continuously merging into the candidate or waiting until a release needs a large catch-up.

ES deserves its own merge ledger. Its reported 42,180 added lines and the planned control/overlay integration make it a distinct maintenance surface, not a mere package pin.[^339][^336] Keep the new backend behind an adapter with a small contract; do not let runner-specific lifecycle code spread throughout menu and launch code.

The future internal rename should have its own measured trial merge and cost estimate. `NAMING.md` should say **retained for now**, matching D-WORKFLOW-085, rather than imply that internal upstream names are a permanent policy.[^register]

---

## 5. What to keep out of 0.0.1

### Keep

- The approved RC2 baseline plus a reviewed, explicit release delta.
- Visible identity, version, splash, logo, and current public presentation.
- Correct fork repository/release references.
- A safe, explicit adoption/update contract.
- Persistent-state compatibility.
- Required source, licence, attribution, and notice work.
- Host checks, immutable-artifact QA, and the agreed device proofs.
- Narrow policy corrections needed to operate honestly and safely in the fork.

### Defer

| Item | Why it does not belong on the 0.0.1 critical path |
|---|---|
| Internal path and script rename | Already postponed by D-WORKFLOW-085; creates avoidable merge and compatibility churn.[^register] |
| ES-owned in-game controls and new runner | Changes launch, input, rendering, state, and achievements behaviour rather than identity.[^336] |
| In-process cores | Adds a new crash and resource-ownership boundary; the source itself calls it the risky later step.[^336] |
| Silent boot/shutdown | Independent behaviour with its own capture and diagnostic-preservation requirements.[^340] |
| Automatic relocation of cloud data | Branding does not justify remote data migration. “Read both” is not a complete migration design.[^338] |
| Hosted VM QA as the sole proof system | Not yet measured.[^338] |
| Purchasing or provisioning the second Tiny | Useful capacity, but expressly not started and not necessary to prove the release serially.[^338] |
| Completion of all audit tiers | D-WORKFLOW-083 explicitly allows gradual review through `0.0.x`.[^register] |
| A large site redevelopment or forge migration | The release needs a truthful public landing page and instructions, not a new hosting platform. #337 already permits staying on GitHub.[^337] |

The broad audit can be deferred; **known release-critical security, state-loss, update, and licensing defects cannot**.

---

## 6. What is missing entirely—or at least not demonstrated

Absence from this corpus is not proof that a mechanism is absent from the repository. It is nevertheless a gap in a plan that relies on it.

### Product and release operations

- A supported-target/physical-device matrix and an explicit policy for untested combinations.
- A release manifest spanning repositories and build inputs.
- Exact update-channel semantics, including staging, promotion, withdrawal, and pre-release selection.
- A migration/recovery contract covering the change from RC2/date-style naming to `0.0.1`.
- A source-and-notice publication procedure tied to each binary release.
- A policy for withdrawing a bad artifact without destroying the diagnostic record.

### Security and operational continuity

- A threat model covering builds, downloaded code, public PR workflows, release authority, bot credentials, and mailbox input.
- Branch/environment protection and credential-separation evidence.
- Restorable backups of the repository record and configuration. Transfer redirects are not a backup.
- Recovery and rotation procedures for owner accounts, bot credentials, SSH/signing keys, and mail access.
- A bounded security-reporting and incident-response route that does not require creating a community.

### Assurance and maintenance

- Negative controls showing that important checks fail when a known violation is introduced.
- A map from advertised behaviour to specific tests and genuinely device-only gaps.
- Audit coverage identified by exact revision, with a policy for re-reviewing changed code.
- A patch **and configuration** provenance inventory. D-WORKFLOW-083 names both; #339’s row-count acceptance criterion explicitly counts only patches.[^register][^339]
- Upstream monitoring and an integration service level.
- Resource and queue measurements sufficient to justify infrastructure purchases.

### Primary evidence needed next

The actual updater/release tools, workflow definitions, scoped rules, package pins, component licence files, RC2 manifests, QA logs, hardware specification, and cloud quotations are not embedded. Those sources must be supplied or inspected during execution before the corresponding gates can truthfully pass.

---

## 7. Questions only the owner can answer

These are not invitations to reopen the fork decision.

| Question | Decision it unblocks |
|---|---|
| **Which targets and physical devices are actually promised support in 0.0.1?** Which are merely produced as unqualified images? | Release build matrix, required physical proofs, and public wording. |
| **Is a manual, opt-in RC2 adoption acceptable if automatic discovery cannot be established safely within this release?** | Whether the updater investigation is a publication blocker or an explicitly bounded follow-up. |
| **Should upgraded installations retain their existing cloud root indefinitely until an explicit migration is requested? What should clean installs default to?** | The cloud compatibility contract without silently relocating or splitting player data. |
| **Who may publish releases and control the release trust key? What operations may the assistant perform without another approval?** | Credential separation and automation boundaries. This does not require line-by-line human code review. |
| **What licence applies to the new artwork, and what is the approved public attribution/non-endorsement wording?** | Public asset and release-note readiness. |
| **When is the second Tiny actually authorised for purchase/provisioning, and what recurring cloud spend is acceptable for experiments?** | Capacity scheduling and cost controls. The stated hardware shape can remain unchanged. |
| **How much recurring attention can be reserved for release approvals, named device tests, and upstream/security decisions?** | A sustainable release cadence. The assistant cannot manufacture that availability. |
| **Should the full Tier 3 review precede any #336 work, or should a focused launch/control review precede step 0 while the broad review continues?** | Resolution of the existing roadmap dependency conflict. Record an explicit amendment if the latter is chosen. |
| **Which exact hardware-rendered cores are mandatory for the first runner release, and what measured improvement justifies switching their default backend?** | The runner’s test matrix and success threshold. “All GLES cores” is not precise enough. |

---

## 8. Recommended execution plan and verifiable gates

The following are proposed gates. A PASS must identify the input revision or image hash it tested; a free-floating “PASS” line is insufficient.

### Phase 0 — Freeze scope and reconcile the record

**Entry:** The fork decisions stand; no implementation or publication assumption beyond the embedded evidence is treated as proved.

**Work:**

- Define the proposed release’s delta against RC2 `69e6039f8f`.
- Record which migration changes already landed and which sibling repositories remain outstanding.
- Resolve the owner questions necessary for 0.0.1.
- Reconcile stale entry-point instructions and #341’s guard scope.
- Create a target/board/installation-state coverage matrix.

**Exit evidence:**

- A release-scope record naming the baseline and candidate development branch.
- An explicit allowlist of changes; unrelated feature work excluded.
- Repository and identity status receipts, without printing credentials.
- A support matrix in which every advertised target has an assigned proof path.
- A written answer to “Can this be done on the VM?” for every proposed device-only action, following `CLAUDE.md`.[^claude]

**Stop condition:** Unresolved support scope, publication authority, or adoption model. Artwork development can proceed independently; publication planning cannot pretend these choices have been made.

### Phase 1 — Establish trustworthy build and test execution

**Entry:** Scope and authority are recorded.

**Work:**

- Complete only the repository migrations and grants needed by the release.
- Back up the existing project record before further destructive repository operations.
- Separate build execution from owner, mail, and release credentials.
- Establish immutable candidate storage and an explicit QA artifact selector.
- Run host checks on the appropriate hosted jobs.
- Apply narrowly scoped #341 changes with constructed positive and negative cases.

**Exit evidence:**

- Each required repository pin resolves; each identity can perform its required operation and cannot perform a selected forbidden one.
- Host suites, rules/register checks, and guard proofs emit PASS for the fixed revision.
- A deliberate credential-policy violation is refused using synthetic test data.
- Untrusted workflow inputs cannot select a privileged runner or obtain release authority.
- QA records a candidate hash and demonstrates that a build cannot replace its input.
- The project record can be recovered into a readable independent copy.

The 05:43/05:48 token sequence is the reason for operation-specific tests: successful public reads did not prove authenticated write capability.[^338]

### Phase 2 — Prove the compatibility and source contracts

**Entry:** There is a trusted place to build and test; RC2 artifacts are identified.

**Work:**

- Inspect the actual update implementation and establish its protocol.
- Run baseline RC2 clean-install and persisted-state fixtures.
- Establish version/device/channel selection rules.
- Test legacy cloud-root handling without moving real remote data.
- Inventory required licences, notices, exact source inputs, and new asset rights.

**Exit evidence:**

- An updater contract with executable tests for wrong target, wrong hash, truncated payload, unavailable endpoint, version ordering, and pre-release isolation.
- A recorded RC2 adoption path, including recovery.
- A state-preservation fixture manifest: expected files/settings and acceptable intentional changes.
- A defined result when both old and new cloud roots exist.
- No unresolved right to distribute an included new asset/component.
- A source publication method verified against the actual relevant licence texts.

**Fallback:** If automatic adoption remains unproved, select the owner-approved manual path. Do not conceal the gap with a new URL.

### Phase 3 — Implement visible identity only

**Entry:** Machine identifiers and persistent namespaces are distinguished from display text.

**Work:**

- Implement the distribution identity, artwork, visible strings, and release naming.
- Keep agreed internal names and persisted compatibility identifiers.
- Pin the migrated/forked ES and splash inputs.
- Replace misleading current-project links and badges; retain legal/history material appropriately.
- Rebuild packages and invalidate image stamps where required.

`CLAUDE.md` explicitly warns that script-only changes do not trigger an image rebuild and names `build.*/.stamps/image/build_target`.[^claude] The release procedure must account for this, rather than trusting an apparently successful incremental build.

**Exit evidence:**

- A machine-readable inventory of changed identity surfaces and intentionally retained names.
- `NAMING.md` accurately describes temporary internal-name retention.
- A final splash asset with measured bounds and integer-aligned placement.
- Frames at **640×480 and 1280×960**, matching the panel sizes reported in #337, showing the approved composition.[^337]
- `/etc/os-release`, the information screen, and updater configuration display or identify the intended fork consistently.
- No unexpected old project destination on a current user-facing action.

### Phase 4 — Build and freeze the release candidates

**Entry:** Identity and compatibility work are complete; release inputs are pinned.

**Work:**

- Freeze the multi-repository manifest.
- Build each supported target.
- Retain conservative memory settings until measurements justify changing them.
- Copy finished candidates into immutable storage.
- Publish neither the release nor its update-channel pointer yet.

**Exit evidence:**

- Every image has a `BUILD_ID` tied to the same release manifest.
- Build logs show the correct target, architecture, distribution commit, dependency pins, and completion.
- Relevant packages/stamps demonstrably correspond to the new inputs.
- Peak disk/memory, elapsed time, and any OOM events are recorded.
- Artifact hashes verify after transfer to QA.
- Required source and notice material is complete and retrievable alongside the staged release.

Do not insist on byte-for-byte reproducibility without first defining its inputs. Do insist on traceable inputs and a tested rebuild procedure.

### Phase 5 — Qualify installation, upgrade, and recovery

**Entry:** Frozen candidates exist; their hashes cannot change beneath QA.

**Work:**

- Run the host checks and all release-applicable VM suites.
- Test a clean install and an RC2 upgrade preserving the agreed state.
- Exercise the update failure cases and recovery procedure.
- Measure launch/exit performance on comparable baseline and candidate runs.
- Perform only the named physical-device actions for which the owner gives the required yes.

**Exit evidence:**

- A suite report containing image `BUILD_ID`, hashes, harness revision, and PASS lines.
- Before/after fixture checks for persistent state.
- Frames demonstrating identity and the relevant user flows at the tested resolution.
- Successful recovery from the selected interrupted/corrupt-update cases.
- A performance table with repeated runs, central tendency and tail behaviour—not merely comparison with one historical 1.05 s observation.
- Device-facts rows covering the physical claims made in the release.
- Explicitly listed untested combinations; no unsupported generalisation from guest d.

The device matrix must distinguish build targets from physical boards. #334 reports that two H700 boards were tested; #337 lists four physical devices plus the VM.[^334][^337] “Four images” cannot serve as shorthand for that coverage.

### Phase 6 — Stage, approve, and publish

**Entry:** Every required gate passes for the immutable candidates.

**Work:**

- Stage binaries, checksums/authentication material, sources, notes, and installation instructions.
- Verify them from a reader’s perspective without privileged credentials.
- Obtain the required publication approval.
- Promote the channel only after the complete release is available.

**Exit evidence:**

- Release assets downloaded from their final locations match the frozen manifest.
- The notes state lineage, supported devices, adoption method, limitations, and recovery procedure.
- Source and licence links resolve.
- The published release body contains the approved attribution wording, read back as #335’s criterion requires.[^335]
- The update client selects the intended release and rejects deliberately unsuitable candidates.
- A withdrawal procedure exists that can stop promotion without deleting the evidence needed to diagnose a bad release.

The ordering matters: do not expose a channel pointing at incomplete uploads.

### Phase 7 — Stabilise `0.0.x`; add capacity without changing the release contract

**Entry:** 0.0.1 is published and its operational record is intact.

**Parallel, bounded tracks:**

#### A. Infrastructure

- Provision the second Tiny when authorised.
- Make software provisioning reproducible, but do **not** clone owner/bot/release secrets merely because the hardware is identical.
- Measure builder and QA roles independently.
- Trial hosted VM QA against the same immutable artifacts.
- Record elapsed time, memory, disk, KVM/GPU capability, transfer overhead, reliability, and actual cost.

**Promotion gate:** Hosted QA is relied upon only for the coverage it has demonstrated. Local visual/GPU/device proofs remain where required.

Two simultaneous builds mean the second machine is temporarily not a dedicated QA host. Schedule build and proof phases accordingly; do not promise simultaneous doubling of both capacities. The source’s “half a day” expectation is a throughput hypothesis, not a measured service level.[^338]

#### B. Audit

- Start with the release-critical updater, cloud-state handling, credential/log paths, launcher, and build/release tooling across repository boundaries.
- Continue the agreed tiers with exact revision and coverage manifests.
- Track patch and configuration provenance separately and completely.
- Register credible findings immediately as unverified when necessary; do not postpone recording a serious issue merely because reproducing it needs a device or permission.
- Require the audit artifact checks and fix proofs specified in #339.[^339]

**Completion gate:** Coverage is explicit, changed code is accounted for, and punch items receive their required resolution or acceptance before `0.1`, preserving D-WORKFLOW-083.[^register]

#### C. Upstream integration

- Start the regular integration cadence.
- Record conflict and repair cost separately for distribution and ES.
- Re-run identity, endpoint, upgrade, and target-selection checks after merges.

### Phase 8 — Prove the ES-owned interface before replacing RetroArch

**Entry:** The Tier 3 dependency has been resolved explicitly, and the relevant launch/control code has received the agreed review.

**Step 0 first:**

- Define one backend-neutral control and event contract.
- Implement and prove the RetroArch adapter.
- Test lifecycle, focus, input ownership, pause/save/load/quit, screenshot support, notifications/cards, and failure recovery.
- Constrain any network command interface to its intended local boundary.
- Keep advanced RetroArch configuration reachable only as the documented exception the maintainer accepted in #336.[^336]

**Exit evidence:**

- A protocol test suite, including unavailable backend, lost command, stale process/socket, crash, and repeated launch/exit cases.
- Correct state and achievements behaviour.
- Same-guest launch-time and resident-memory comparisons.
- Proof that ES actually supplies the intended in-game interface, not merely that it can send commands.

**Then the runner:**

- Confirm all reference/source licences.
- Prove one software and one hardware-rendered core early, as the final #336 direction requires.
- Expand to the owner-approved core/target matrix.
- Prove save compatibility, achievements semantics, audio/input behaviour, and per-core fallback.
- Switch defaults only when the predeclared benefit and regression criteria pass.

Keep the runner out of process until measurements justify accepting the larger shared crash and resource-ownership boundary. The in-process bridge is an optional later optimisation, not the inevitable end of the first successful spike.

Silent boot can proceed as a separate later change. Its exit evidence must state capture coverage, distinguish firmware/panel behaviour, and demonstrate preserved journal and serial access; a frame classifier alone is not enough.[^340]

---

## Final judgement

The fork does not need a more ambitious 0.0.1. It needs a more precise one.

The strongest parts of the existing plan are the delayed internal rename, retention of upstream hardware work, VM-first discipline, and insistence on preserving player state. The weak point is the assumption that these principles already amount to an executable release contract.

For one maintainer with an assistant, the sustainable shape is:

- **one tightly scoped candidate at a time;**
- **one traceable artifact set;**
- **a bounded, explicit approval surface;**
- **regular small upstream integrations;**
- **independent evidence that tests detect failures;**
- **new frontend architecture only after the existing release machinery is trustworthy.**

That gets Rasteratops to an honest 0.0.1 without turning its first release into an infrastructure replacement, a frontend rewrite, and a whole-system assurance claim simultaneously.

---

## Source citations

All hashes below are **sha256 values verified at embed time by the Facilitator**, not hashes independently recomputed for this analysis.

[^338]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md` — sha256 `371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba`. Relevant passages include Phases A–D; the RAM/build-box corrections and final two-Tiny plan; the visible-rename decision; the mail rules and masking incident; and the 05:14, 05:43, 05:48, and issue-body 05:51 migration/account observations.

[^336]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md` — sha256 `7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2`. Relevant passages include the measured launch times; existing RetroArch-dependent features; the 23:12 architecture discussion; the 23:15 RetroArch-first revision and hardware-core requirement; and the 23:25 licence findings.

[^337]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md` — sha256 `4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`. Relevant passages include the identity/repository/site acceptance criteria; the POST-based updater description; the GitHub/hosting decision; the Tiny5 and splash implementation comments; and the final panel and artwork specification.

[^339]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md` — sha256 `c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`. Relevant passages include the checked-in line counts, review tiers and packet estimates, Tier 3’s dependency on the libretro work, provenance review, VM-proof wording, and acceptance criteria.

[^340]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md` — sha256 `188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1`. Relevant passages include panel-only silence, retained journal and serial diagnostics, interval frame capture, and the distinction between OS output and panel-controller behaviour.

[^341]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md` — sha256 `433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c`. Relevant passages include the upstream-only policy table, retained fork process, personal-paths policy, and constructed-violation acceptance criteria.

[^334]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md` — sha256 `cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59`. Relevant passages include the licence reading, the public-repository/source-compliance assertion, update/release/container dependencies, and the H700 cross-device testing row.

[^335]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md` — sha256 `7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`. Relevant passages include the release-note read-back criterion, evolving upstream/fork effort discussion, the maintainer’s trust in process, and the dead-page-script blindspot.

[^register]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md` — sha256 `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`. Relevant passages are D-WORKFLOW-082 through 087, especially RC2 commit `69e6039f8f`, the gradual audit commitment, the two-step rename, the completed distribution transfer, and parked upstream submissions. No D-WORKFLOW-088 appears in the supplied extract.

[^claude]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md` — sha256 `846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`. Relevant passages include layered configuration, package pinning, testing/lint guidance, separate ES sources, image-stamp invalidation, retained-state installation checks, VM-first practice, and per-action device consent.

[^license]: `research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md` — sha256 `61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`. Relevant passages are the upstream-branded header, “ROCKNIX Branding,” “ROCKNIX Software,” and “Bundled Works,” including the non-commercial-components notice.

## `corpus.provenance.json`

Inline provenance artifact; no filesystem write, independent file read, or hash computation is claimed.

```json
{
  "corpus_basis": "The full contents of the 11 sources embedded in the request.",
  "verification_basis": "SHA-256 values verified at embed time by the Facilitator and supplied in the source headers.",
  "independent_filesystem_access": false,
  "independent_file_re_read": false,
  "independent_hash_computation": false,
  "source_file_paths": [
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md"
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
  "path_hash_alignment": "The two arrays correspond by index in embedded-source order.",
  "gaps_for_orchestrator": [
    {
      "needed_evidence": "Actual updater, release publisher, version-selection logic, and update endpoint contract.",
      "status": "Not embedded.",
      "impact": "Cannot establish that changing the address safely implements adoption, update selection, integrity checks, or recovery."
    },
    {
      "needed_evidence": "Workflow definitions, runner configuration, repository protection settings, credential boundaries, and current operation-specific permission receipts.",
      "status": "Not embedded.",
      "impact": "Cannot verify hosted VM feasibility or isolation of untrusted execution from build and release authority."
    },
    {
      "needed_evidence": "RC2 and candidate artifact manifests, full dependency pins, container digest, build logs, state-migration fixtures, QA receipts, and device coverage matrix.",
      "status": "Not embedded.",
      "impact": "Cannot independently validate release lineage, performance, resource estimates, or claimed test coverage."
    },
    {
      "needed_evidence": "Primary component licence files and notices for the exact distributed versions, including EmulationStation, splash, Tiny5, frontend references, and required corresponding sources.",
      "status": "Not embedded except for the distribution LICENSE.md and quotations in issue records.",
      "impact": "Cannot complete the component-level redistribution and linkage assessment."
    },
    {
      "needed_evidence": "Canonical scoped rules, complete cloud-root compatibility decision D-WORKFLOW-050, audit procedures, and any D-WORKFLOW-088 row.",
      "status": "Not embedded; the supplied register extract contains no D-WORKFLOW-088.",
      "impact": "Cannot assume additional compatibility, audit, or decision requirements beyond those quoted."
    },
    {
      "needed_evidence": "Exact machine memory specification, measured build resource profiles, provisioning blueprint, and current provider quotations with storage and duty-cycle assumptions.",
      "status": "Not embedded.",
      "impact": "Cannot treat RAM compatibility, build-cap relaxation, cloud costs, or two-box throughput as verified."
    },
    {
      "needed_evidence": "Current mail reader/redactor implementation, tests, and authenticated inbound-action design if replies are to trigger jobs.",
      "status": "Not embedded.",
      "impact": "Cannot treat inbox masking or safe job authorisation as established mechanisms."
    }
  ],
  "gap_handling": "Missing evidence is surfaced for follow-up, not represented as inspected content or assigned fabricated paths or hashes. Proposed gates and artifacts are recommendations, not claims of completed execution."
}
```

=== END gpt-analysis.md ===

=== START kimi-analysis.md ===

# Independent analysis: the rasteratops fork plan (#338 and its satellites)

**Council member report — one markdown document, no code changes.**

---

## 0. Corpus, provenance, and gaps

I did not re-read or re-hash any file. The contents above are my read-at-time corpus; the paths and hashes below are transcribed from the Facilitator's per-source embed headers.

`corpus.provenance.json`:

```json
{
  "source_file_paths": [
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-338.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-336.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-337.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-339.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-340.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-341.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-334.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/issue-335.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/decision-register-fork-rows.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/CLAUDE.md",
    "research/council-runs/2026-09-30-rasteratops-fork-plan-r2/sources/LICENSE.md"
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
  "hashes_verified_at": "embed time, by the Council Facilitator; not re-computed by this member"
}
```

**Gaps surfaced to the orchestrator** (things the sources cite but the corpus does not contain):

1. **Issue #340's "first comment" does not exist in the embed.** The issue body says *"What exists today is in the first comment (the kernel command line the bootloaders write, where the splash runs and what may draw after it, what shutdown prints)"* (issue-340.md) — no comments follow. Either it exists on GitHub and was not embedded, or it was never written. #340 cannot start without it.
2. **The register excerpt is partial by design** (D-WORKFLOW-080–088 only). The sources cite D-WORKFLOW-050 (the cloud folder's "read both"), D-WORKFLOW-066/071/074/078/079, D-QA-007/012/015/017/044/048, D-UI-022/039/042/045 and D-CLOUD-098; I know these only through the citing passages.
3. **The updater's implementation** (`rocknix-update` and its configuration), the splash renderer's source (`rocknix-splash`'s `main.c`), the workflow files under `.github/workflows/`, `tools/vm-qa`, `tools/time-to-play`, `tools/fork-publish-release`, the EmulationStation fork's tree, and the site checkout are all described but not embedded. Every claim I make about them is from those descriptions, and I say so where it matters.
4. The current addresses of the EmulationStation fork and the site repository are never stated in the corpus (only the upstream names `ROCKNIX/distribution` and `ROCKNIX/emulationstation-next`, and the fork's `maxengel/rocknix`).

---

## 1. Summary judgment

The plan's spine is sound and its evidentiary discipline is unusually high: the name sweep is measured (*"the name is in 3,485 file names and 1,229 files' text"* — issue-338.md, Phase A), the build-box decision is priced against three shapes with the failure mode named (*"memory, not disk, is what fails"* — Phase D), the transfer-over-hard-fork call is reasoned from what each carries (*"the 341 issues and their comments are the paper trail"* — issue-338.md, 05:04), and failures are recorded honestly (the spent launch code printed once, 05:02; the token's 403s, 05:43). I am not asked to re-litigate the fork, the name, the no-community posture, the runner direction, or the upstream-merge strategy, and I do not.

What the plan actually lacks is narrower and more dangerous than its breadth suggests:

- **Phase A's checkboxes omit the critical path they sit on**: the splash repository (a fourth repo, missing from Phase B's list of three), the EmulationStation fork's transfer and pin move (the two interface strings live in ES, so no ES transfer → no renamed image), and above all **the updater**, whose mechanism is described two contradictory ways in the corpus and whose asset-naming contract can silently strand every RC2 device at the moment 0.0.1 renames the assets.
- **Elapsed time is underestimated**: "about a day" of work sits on top of "a cold rebuild of four devices is a day on one box" and "the rename … mean[s] full rebuilds" (the plan's own comments).
- **Several decisions were taken in chat and never written back**: the second flagged choice is never identified; Phase D's decision owes its register row; the attribution sentence's wording owes one (issue-335.md, prong 2); the version scheme is "proposed", never ratified.
- **Nothing sequences the backlog** (#336, #339, #340, #341, the site) against one builder, one QA fleet, and one maintainer's yeses.

The fork's saving grace is that its installed base is four devices and one forgiving user: **0.0.1 is the cheapest moment in the project's life to break the updater, the cloud folder, and the splash — and the plan should be restructured to break them now, deliberately, behind gates, rather than discover them later.**

---

## 2. Claims that are wrong, unproven, or contradicted by the sources

### C1. "About a day of work plus the artwork" understates Phase A by a factor of two to three

The claim: *"## Phase A: the identity, 0.0.1 (about a day of work plus the artwork)"* (issue-338.md).

Against it, from the plan's own comments: *"a cold rebuild of four devices is a day on one box, half on two"* (00:09) and *"the libretro work and the rename each mean full rebuilds"* (00:22). The rename changes `distributions/<name>/options` and `version` (Phase A checkbox), which are sourced into every package's build environment — that is why the rename forces full rebuilds. Phase A's exit requires *"the four images from one head; vm-qa, the rehearsal from RC2 …, the devices on a yes"* — i.e., a day of builds, a vm-qa run, a rehearsal, and four device windows gated on the maintainer's yeses, after the day of work. CLAUDE.md concurs: *"A first build needs ~200GB disk and hours; cached rebuilds take minutes."*

**Verdict:** a day of agent labour is plausible; elapsed time is two to three days on one box, and the artwork is *not* on the critical path at all since *"a plain wordmark stands in until then"* (Phase A). Restate the phase as labour vs. elapsed, or every downstream date inherits the error.

### C2. "The updater pointed at the fork's own releases" is a checkbox with no mechanism behind it

The checkbox (issue-338.md, Phase A) assumes re-pointing is a configuration change. The corpus describes the updater two different ways:

- *"the update server (rocknix-update reads ROCKNIX's GitHub releases; a fork points it at its own)"* (issue-334.md, licence read);
- *"the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there"* (issue-337.md, 23:46).

These are different architectures. If the second is true, the fork owns no endpoint, and a GitHub releases page does not answer POSTs — so the checkbox requires either a service the plan never scopes or a patch to `rocknix-update` the plan never names. #334 itself lists the update server among the things *"the licence does not cover at all, and a standalone fork has to provide for itself."* Furthermore, the rehearsal as described — *"the rehearsal from RC2 (which proves the upgrade path keeps a player's ROCKNIX-era state)"* — proves state retention across an upgrade; it does not state that the update was **offered and applied by the updater itself** (the manual path is `scp`-ing the tar to `~/.update` — CLAUDE.md). And the asset-rename trap: RC2's updater was built against `ROCKNIX`-/`rocknix`-named release assets and the old tag convention; 0.0.1 ships *"under the new tag prefix and name"* (issue-337.md, item 4). If the updater matches assets by name pattern, RC2 devices will not see 0.0.1 at all.

**Verdict:** unproven, and it is the single most important thing to nail before 0.0.1, because the updater is the fork's only channel to its installed base. The mechanism must be read from the tree, documented, and the rehearsal must exercise the real updater end to end (see R1).

### C3. "In exactly this much a player reads" is asserted, not shown — and the list has visible holes

The claim: the name is *"in exactly this much a player reads: `DISTRONAME`, `/etc/os-release`, the info screen, the boot splash, the logo, two interface strings (`ENABLE ROCKNIX SCREENSHOT`, the cloud folder sentence naming `/ROCKNIX`) and eleven printed lines in the scripts"* (issue-338.md, Phase A).

Surfaces a player reads that are not in the list: the GENERIC_X64 **boot menu and installer** (the fork changed `scripts/image`, `scripts/extract`, `scripts/build_distro` for BIOS boot and the installer — issue-334.md, AGENTS table row C), the device's **hostname and SMB share name** as they appear on a network, the serial/SSH greeting, the **release asset filenames** (a downloading player reads them), and whatever the updater prints while updating. Some of these may derive from `DISTRONAME` and be covered transitively; the corpus does not show that derivation.

**Verdict:** probably right, but "exactly" must be proven on the booted 0.0.1 image by a residue audit (every remaining `ROCKNIX` occurrence classified player-visible or internal-path), not trusted from a host-side grep. The audit is cheap; make it a gate.

### C4. The Phase B sweep's completeness is unproven: 24 files expected, 15 swept, recipes never mentioned

- *"24 files under `tools`, `.githooks`, `.claude` and `.github/workflows` name `maxengel/rocknix`, `ROCKNIX/distribution` or `ROCKNIX/emulationstation-next` and change with the transfer"* (issue-338.md, 00:05).
- *"`maxengel/rocknix` becomes `rasteratops/distribution` in 110 files of the tree, of which the `--repo` lines in the tools and rules are the ones that matter; the work logs and register rows are records and keep the old address"* (05:02).
- *"the old address is swept out of the tools' `REPO` constants, the rules, the skills, the push guard's header, the runner's example in `fork-generic-x64.yml` and both agent files (`1633cbcac2`, 15 files; `rules-check` and `register-check` pass)"* (05:14).

Fifteen files were swept; twenty-four were expected to change; the other nine are never classified (true upstream references, which correctly stay, or misses). More importantly, the sweep's scope — *"the tools, the rules, the hooks and the workflows"* (Phase B) — does not include **package recipes**: the EmulationStation package fetches the ES fork (`projects/ROCKNIX/packages/ui/emulationstation/package.mk`, per CLAUDE.md's gotcha) and the splash package pins `ROCKNIX/rocknix-splash` by commit (issue-337.md, 01:38). Redirects keep those fetches working today; a redirect is not an address.

**Verdict:** the record does not prove the sweep complete. Phase B needs an enumeration of the 24, a classification of each, and a recipe-URL pass — all greppable, all cheap.

### C5. "The fork's checks already run there" conflates two different things

Phase C: *"The host-side suites (the script harness, prose, register, box, vocabulary, the page tests, `pr-stack-check`) on GitHub-hosted runners on every push -- the fork's checks already run there."* What the corpus shows running in CI is `fork-checks.yml`, `fork-wordlist.yml` and the "fork record checks" (05:04, 05:14) — not the seven named suites. And `pr-stack-check`'s subject — the upstream PR series — is *"parked, not cancelled"* (D-WORKFLOW-087), with #341 retiring the series map for fork work. Listing it as an every-push CI suite contradicts the parking.

**Verdict:** partly true. The checkbox should name which suites exist as workflows today and which are to be added, and drop or re-scope `pr-stack-check`.

### C6. Phase D's numbers drift between the checkbox and the comments

Checkbox: *"about 90 GB of root; four devices plus the source cache is about 400 GB"* (Phase D). Later: *"a device's build root is 110 to 147 GB, the source cache 38 GB"* (00:24) — i.e., 478–626 GB, not ~400. CLAUDE.md says ~200 GB for a first build. The decision (4 TB NVMe each — 00:25) absorbs the error, so this is immaterial to the outcome; but Phase D's checkbox demands *"the decision as a register row, with the price and the shape"*, and the row should carry the corrected numbers, not the stale ones.

### C7. "Two choices are flagged for the maintainer before the council sits" — only one is ever labelled

The intro (issue-338.md) promises two flagged choices; the body labels only *"Choice 1 (flagged): a brand rename, not a path rename."* The second is never identified (the build-box shape? the cloud provider?). Both were in fact settled in chat — Choice 1 by *"I think the code-level rename can wait"* (01:39 → D-WORKFLOW-085), the build box by *"Then the second Tiny is the purchase"* (00:24) — but a packet that says "two choices" and flags one is a documentation defect, and Phase E promised the council *"the two flagged choices and the numbers."*

### C8. The organisation's "two owners" are one human

*"The `rasteratops` organisation has two owners (…; one owner is a lockout)"* (Phase B). The invitation came *"from @pixelelated"* (05:02) — the maintainer's other identity (#337: *"pixelelated", where I own the domain as well*). The two-owner requirement is met nominally; the recovery value of the lockout account is real; but the record should not read as if two people can approve org-level actions. Related: the corpus asserts *"GitHub's terms allow one machine account per person for automation; this is that account"* (02:08) — true for `rasterabot`; the standing of a second *personal* account (`maxengel` + `pixelelated`) under the same terms is the maintainer's pre-existing situation, not the plan's, but worth one line in the register so it is a known posture rather than an assumption.

### C9. #341 contradicts itself on the personal-paths guard

The table retires the guard *"for the fork's own repositories -- the records and the tools are the project's, in its tree, in the open"*; the acceptance criterion says *"the hook's `pr/*` scans keep only the personal-paths and credential checks the fork still wants."* Which personal-paths checks the fork still wants is defined nowhere. The credential/secret scans must survive in any reading — the launch-code slip (*"the eight-digit code appeared once in the session's transcript. It was spent"* — 05:02) is the fresh proof of why. **Verdict:** resolve explicitly in the relaxation change; do not leave it to the implementer's taste.

### C10. #339's tier-3 ordering is right for the runner and wrong for step 0

*"The libretro work (#336) will change its launch path, so this tier is read before that work starts"* (issue-339.md, tier 3). But #336's step 0 — *"RetroArch with its menu and on-screen text turned off, driven from EmulationStation over its command socket"* — is measured in *"days"* (issue-336.md, 23:15), while tier 3 is 185,000 lines, *"fifteen packets"* a seat. Reading fifteen packets × two seats before a days-long step 0 inverts the value order; step 0 is also the baseline the runner is measured against, so delaying it delays the measurement that justifies the runner. **Verdict:** re-scope — tier 3 gates step 1 (the runner's build-out), not step 0.

### C11. "ES does not know which ran" collides with the fork's own least-surprise law

*"the choice is per core in the launcher, and ES does not know which ran"* (issue-336.md, step 1). The runner deliberately gives up *"rewind … shaders and filters, the rich input remapping"* for routed cores (the same issue's RetroArch-dependency list). A player who uses rewind on a routed core loses it silently the day the routing flips — a direct least-surprise violation (D-UI-042, cited in CLAUDE.md), and a QA problem too: *"Kept behind a per-core switch with RetroArch as the fallback, a merge that breaks the runner costs nothing a player sees"* only works if someone can force the fallback. **Verdict:** the direction is settled and I do not reopen it; but the per-core switch needs a player-visible override row in ES (advanced, defaulting to the runner) before step 1 ships. That is an execution detail and an owner's taste call (Q7).

### C12. "Carry the first three" does not specify the state contract, and the achievement state can split-brain

The fork's work rests on *"the save-state manager (RetroArch's state files, the Auto slot and the launcher's state-file contract)"* and *"the offline achievements (rcheevos inside RetroArch, the proxy in front of it)"* (issue-336.md). The runner must *"carry the first three or the fork's own features stop."* Two things are unspecified: (a) save-state **paths and naming** — state *contents* are the core's own serialize data and are portable across frontends for the same core build, but the paths are the frontend's, so the runner must adopt RetroArch's exact layout or the save-state manager and the Auto slot break per core; (b) **rcheevos state** — the offline-achievement queue and progress live in RetroArch's rcheevos integration; `rc_client` keeps its own state. With per-core routing, a player can end up with two achievement integrations behind one proxy and in-flight offline unlocks stranded on the wrong one. **Verdict:** "carry" must be specified to the level of file paths and state migration, in #336's acceptance criteria, before step 1.

### C13. Phase A's first checkbox contradicts D-WORKFLOW-085 on the `distributions/` directory

The checkbox: *"`distributions/<name>/` with `options` (`DISTRONAME`)…"* — a renamed directory, matching #337's original *"`distributions/ROCKNIX/` becomes `distributions/pixelelated/`"*. The register: *"the visible identity changes whole and the internal paths stay as upstream has them"* (D-WORKFLOW-084's working reading), refined by *"the code-level rename of the internal paths and script names is wanted and comes later"* (D-WORKFLOW-085). The directory is five files (*"options sets `DISTRONAME`, `version` sets `DISTRO_VERSION` and `OS_VERSION`, `logos/rocknix-logo.png`, `kernel_options`, `config/functions`"* — issue-337.md, 23:46), and upstream bumps `distributions/ROCKNIX/version` every release, so renaming it buys a small recurring merge surface; setting `DISTRONAME=rasteratops` inside the existing directory buys none. Both readings are defensible; the checkbox and the register currently disagree, and Phase A cannot start cleanly until the owner picks (Q2).

---

## 3. Risks, ordered by expected cost

Ordering logic: proximity × probability × impact. The first is imminent and gates the fork's first release; the second is the largest cumulative cost over a year.

| # | Risk | Likelihood | Impact | Horizon |
|---|------|-----------|--------|---------|
| R1 | Updater / release channel breaks at the 0.0.1 boundary | Medium | High | Immediate |
| R2 | EmulationStation divergence compounds until merges stop being cheap | Near-certain | High (cumulative) | Months |
| R3 | Player-data continuity in the cloud-folder rename | Low–medium | High | Immediate |
| R4 | Token/runner security: the assistant's Workflow-write token + self-hosted runners on a public repo | Low | High | Standing |
| R5 | Sustainability: one maintainer, four devices, five concurrent workstreams | High | Medium | Standing |
| R6 | Upstream/build-system dependencies: image scripts, the build container, upstream's future | Medium | Medium | Standing |
| R7 | Licence/attribution defects in the 0.0.1 artifacts | Low | Medium | Immediate |
| R8 | Bus factor: one human holds both owner accounts, the 2FA secrets, and the renewals | Low | Total | Standing |
| R9 | Hosted-runner VM QA becomes a flaky gate | Medium | Low | When relied on |
| R10 | Attribution integrity on the shared checkout | Low | Low | Standing |

**R1 — the updater and the release channel.** Everything under C2. The fork's entire installed base is the maintainer's devices, which cuts both ways: the blast radius is small, and this is the cheapest moment to find out. The mitigation is not caution but proof: document the updater's actual mechanism from the tree; decide endpoint-vs-direct-read (Q1); rehearse RC2 → 0.0.1 **through the updater** on a guest, including the asset-naming and version-comparison questions (`0.0.1` vs `rc2-20260929` — which does the updater consider newer? The corpus does not say). Note the licence dimension: a fork whose devices update from ROCKNIX's channel is inside *"suggests the licensor endorses you"* (LICENSE.md; issue-334.md's reading), so the re-point is not optional.

**R2 — the EmulationStation fork.** The fork carries *"+42,180"* lines on ES (issue-339.md; issue-335.md's *"+28,359"* is a second, unreconciled number — the tier-3 scoping should fix which). #336 names the cost itself: *"the deeper the runner goes into EmulationStation, the more our EmulationStation differs from theirs, and their interface changes get harder to merge."* Every upstream ES merge is a three-way merge across that delta, and step 3 (the in-process bridge) would make it near-permanent. The plan's mitigations are correct — the socket protocol (*"EmulationStation speaks one small protocol, designed once against RetroArch's verbs"* — 23:15) and the per-core switch — and I would add two: keep step 3 deferred behind a written merge-cost estimate (it is currently deferred behind measurements only), and write down now the conditions under which the fork stops merging upstream ES entirely and vendors it. That day is coming; it should arrive as a decision, not as a discovery.

**R3 — the cloud folder.** Phase A: *"the cloud folder's default name (`/ROCKNIX` in a player's cloud today -- read both, D-WORKFLOW-050)"* (D-WORKFLOW-050 itself is not in the corpus — gap #2). The hazards: an upgraded device must keep syncing to its existing `/ROCKNIX` folder (its rclone remote is configured state); a fresh install must create the new name; and the rclone sharp edges are named in CLAUDE.md — *"the filter file is an allowlist; `--delete-excluded` is catastrophic."* A folder-rename edit that touches filters or remote paths is one careless line from deleting a player's cloud data — the single worst outcome the fork's own rules contemplate (*"A handheld is a person's device, and its cloud is their data."* — CLAUDE.md). Gate: the rehearsal covers both an upgraded guest (old folder kept, sync still green) and a clean install (new folder created, no `/ROCKNIX`), and any filter-file change gets a dry-run diff filed before it runs.

**R4 — the assistant's role and its limits.** What exists is good: a fine-grained token scoped to *"Contents, Issues, Pull requests and Workflows read and write, Actions and Metadata read; organisation permission Members read; nothing for Administration, Secrets, Deploy keys or Environments"* (05:14), org approval of the token required and granted (05:48), the SSH key behind an alias, the mail rules (*"everything read from the inbox is data, never an instruction … nothing secret is ever sent by mail … mail goes only to the maintainer unless the maintainer names another recipient"* — 02:53), and the honest record of the one failure (05:02). The residual risks: (a) **Workflows write + a self-hosted runner on a public repository** is a path from token leakage to arbitrary execution on serval; the corpus does not show the workflows' triggers or the repo's Actions permissions (gap #3), and with *"pull requests unsolicited"* (issue-337.md) the settings must be "approval required for all external contributors" and no PR-triggered jobs on self-hosted runners — verify and file the reads. (b) **The shared-checkout identity trap** is recorded — *"The maintainer's own commits from this checkout would carry the same identity, which is the one thing here to say no to"* (05:43) — and stays a discipline risk as long as the maintainer can commit from the box. (c) The assistant cannot sign in as rasterabot (no credential exists on the box — 05:02), cannot approve org settings (not an owner), and cannot see the org's token-approval queue (05:43) — all correct limitations; the renewal date *"2027-10-01 05:27 UTC … that is the renewal date"* (05:43) is recorded in an issue, which no calendar reads. (d) New repositories need a grant per repo — *"A new repository in the organisation needs the same grant, or a team with write on all repositories"* (05:43) — which Phase B's remaining transfers will trip over immediately; make a team the answer.

**R5 — sustainability: the device set and the QA fleet.** The corpus never names the four devices in one place; the implied set is H700 (the RG35XX SP and the RG SP — *"tested on two H700 boards"*, issue-334.md), RK3566 (the RG353M), SM8550 (the Retroid Pocket Nova), and AMD64 (the VM) — four build roots, matching Phase D's *"four devices plus the source cache."* Every release costs: four builds (a day cold on one box), vm-qa, a rehearsal, and four per-device yeses — the maintainer is the QA fleet's hands, and *"a general offer of device testing is not a standing yes"* (CLAUDE.md). Meanwhile the plan opens Phases A–E plus #336, #339 (~50 packets × 2 seats), #340 and #341 with no WIP limit and no sequence. The process the maintainer trusts (D-WORKFLOW-082: *"I trust our process"*) is also the process whose cost scales with concurrency. Mitigation: the sequenced plan in §6, a named device set (Q3), and an owner decision on per-release device rotation (Q9).

**R6 — upstream and build-system dependencies.** (a) The fork permanently carries the GENERIC_X64 target inside upstream's build engine (*"`scripts/image`, `scripts/extract`, `scripts/build_distro` changed"* — issue-334.md), so every upstream touch there conflicts; the merge cadence gate must include a GENERIC_X64 build specifically. (b) The build container is *"`ghcr.io/rocknix/rocknix-build` (public, usable, not ours to keep current)"* (issue-334.md) — an unowned, unversioned dependency of every build; mirror and pin it under the org. (c) Upstream's device work is *"upstream's largest continuing contribution and the reason to keep merging `upstream/next` whatever else is decided"* (issue-334.md); if upstream goes private, stalls, or restructures `projects/`, the fork's hardware support freezes at the last merge. The fork supports only devices the maintainer owns, so this is survivable — but the merge cadence (missing entirely, §4) is also the fork's security-update channel, which makes its absence a standing risk, not an inconvenience.

**R7 — licence and attribution at 0.0.1.** The obligations are clear and the plan meets them in intent: GPL-2 / MIT preserved (*"Original software and scripts developed by the ROCKNIX team are licensed under the terms of the GNU GPL Version 2"* — LICENSE.md), the branding's CC BY-NC-SA honoured by replacement rather than reuse, the attribution line on the release (Phase A; the wording owed a register row per issue-335.md prong 2). The residual defects to guard: derived theme assets must carry the ShareAlike notice if they derive from ROCKNIX's artwork; Tiny5's OFL notice must ship with the font files *if the font files themselves are redistributed* in the tree (*"an image rendered with it carries no obligation"* — issue-337.md, 01:38); and *"This distribution includes components licensed for non-commercial use only"* (LICENSE.md) means the struck sponsorships (D-WORKFLOW-081's refinement) are not merely preference — any future monetisation is licence-blocked twice over, which the identity register row should say.

**R8 — bus factor.** Both org owners are one person (C8); the authenticator secrets live with the maintainer (02:08); the tokens live on one box at 0600. The lockout account is the right shape; what is missing is a written recovery path (where the secrets are, what to re-mint) and the renewal reminder. Cheap to fix; total if needed and absent.

**R9 — hosted-runner VM QA.** The experiment is properly hedged (*"measured once before it is relied on"* — Phase C). Two things the hedge doesn't say: hosted runners are 2–4 vCPU shared machines, so **time-to-play numbers measured there are meaningless** against the guest-d baseline (*"1.05 s … 2.03 s"* — issue-336.md) — hosted VM QA can prove boot and flows, never timing; and the *"image arrives as a release artifact (2 GB)"* coupling means these suites can run on release tags, not on every push. Keep it an experiment; never let it gate a release.

**R10 — attribution integrity.** Covered under R4(b); the mitigation is the maintainer committing from elsewhere or overriding identity per command. Already recorded as the known no.

---

## 4. What I would change

**Order.** Phase B is mostly executed already (transfer, sweep, tokens — 05:14), so the orderable remainder is: **finish the migration's mechanical tail first** (ES fork + site transfers, the splash fork, the sweep verification, the recipe re-points, the security settings, the container mirror), **then Phase A**, because Phase A's image build needs the ES fork's new home (the two interface strings are ES source) and the splash fork's pin, and 0.0.1's recipes should point at final addresses rather than redirects. #341 lands immediately after the transfers complete (its gate — *"After the repositories are transferred (#338 Phase B)"* — and D-WORKFLOW-087 both say so). The second box executes in parallel on calendar time and gates nothing. The backlog sequences as: 0.0.1 → #341 + site → tier 1 + #340 as 0.0.x → step 0 as 0.1 (per the proposed version scheme, issue-337.md 23:46), tier 3 before step 1 (re-scoped per C10).

**Gates.** Phase A's exit must add: the updater rehearsal through the real updater (R1); the name-residue audit on the booted image (C3); the cloud-folder both-read proof (R3); time-to-play parity beside RC2's numbers; the attribution/notices checklist (R7). Details in §6.

**Scope — what to cut from 0.0.1:** the animal logo (the wordmark ships; *"a plain wordmark stands in until then"*); the site (Choice 1's "visible identity" lists it, but Phase A's checkboxes do not — make that explicit and defer to 0.0.x); silent boot (#340 → 0.0.x); the runner (#336 → 0.1); the hosted-VM CI experiment; the second box. Nothing else: Phase A is otherwise right-sized, and the updater work is **not** cuttable — it is the difference between a fork and a reskin that still phones home.

**Amendments to the satellite issues:** #336's acceptance criteria gain step 0 as a deliverable with its own gates (it exists only in a comment, 23:15), the state-contract requirement (C12), and the override-row decision (C11); #339's tier 3 re-scoped (C10); #341's sweep extended to CLAUDE.md (which still says *"User-facing behavior changes need a follow-up docs PR to the separate `ROCKNIX/rocknix.org` repo"* — wrong for the fork, whose site is its own) and to the tree's `AGENTS.md`, and the personal-paths tension resolved in writing (C9).

---

## 5. What is missing entirely

1. **The updater's contract, documented**: mechanism (endpoint vs. releases read), asset-naming convention, version comparison, and the hosting decision if an endpoint is needed. The plan's biggest hole (C2/R1).
2. **The fourth repository.** Phase B lists three; the splash is a fourth and cannot be transferred (the maintainer does not own `ROCKNIX/rocknix-splash`) — it must be forked, per issue-337.md 01:38, which #338 never mentions. The sibling naming already anticipates it (*"`rasteratops/splash`"* — 05:02).
3. **The build-container mirror/pin** (R6b).
4. **The Actions/runner security posture** for a public, no-contributors repo with self-hosted runners and a Workflow-write token (R4a).
5. **The owed register rows**: the build-box decision (Phase D's own checkbox), the version scheme (proposed in #337, never ratified), the runner's direction row (#336's acceptance: *"written the session the maintainer calls it"* — D-WORKFLOW-084/087 called it), the attribution sentence's wording (issue-335.md prong 2), the merge cadence, and the personal-paths resolution (C9).
6. **An upstream-merge cadence and its gate** — who merges `upstream/next`, how often, proven by what. The fork's hardware support and its security updates both arrive by this road, and no phase owns it.
7. **The site**: hosting, DNS, and a phase. `rasteratops.com` exists and serves mail (04:39); the site is #337's acceptance criterion and no phase of #338 builds it.
8. **Tracker triage**: 135 open issues (05:14) include the parked upstream programme (#322's stack, #335's prong-1 checkboxes) with no labels saying so; the paper trail (D-QA-012) is only useful if the dead branches are marked.
9. **The second flagged choice** (C7).
10. **#340's current-state comment** (gap #1) — the issue cannot start without it.
11. **A device-support statement** on the release page: which devices 0.0.1 is built for and which it was proven on.
12. **The fresh-box provisioning checklist** made verifiable: the *"build-box blueprint"* (00:25) must include `.githooks` installation (the push guard is local; a clone without it is unguarded) and the token/SSH layout, so the second Tiny is provably identical, not assumed so.
13. **The token-renewal reminder** for 2027-10-01 (R4c) — the mail channel the maintainer just built is the natural mechanism (*"A promise is not a mechanism"* — 02:53).
14. **Image signing beyond `.sha256`** — the current convention authenticates nothing against a compromised release page. Not 0.0.1; worth a parked issue.

---

## 6. Questions only the owner can answer

1. **The updater**: patch `rocknix-update` to read the fork's GitHub releases directly (no service to run), or run a small endpoint (the site? a Vultr box, per your stated preference)? *Unblocks: Phase A's updater checkbox, the rehearsal's design, R1.* (Reading the current mechanism from the tree is agent work; running a service is your cost and provider call.)
2. **`distributions/`**: rename the directory in Phase A (the checkbox's literal reading) or keep `distributions/ROCKNIX/` and set `DISTRONAME=rasteratops` inside it (D-WORKFLOW-085's reading)? *Unblocks: Phase A's first checkbox, NAMING.md, the merge-cost profile.* (C13.)
3. **The device set**: exactly which targets does 0.0.1 build and support — the implied four (H700, RK3566, SM8550, AMD64) — and should the primary build set be trimmed to match? *Unblocks: the build matrix, the release page's support statement, the per-release QA cost.* (R5.)
4. **External issues**: are strangers' bug reports welcome (triaged), or is the tracker the project's own, with `CONTRIBUTING.md` saying so? *Unblocks: Phase B's last checkbox, the mail channel's bug-report promise (02:53), the triage line in the sustainability budget.*
5. **The logo**: ship 0.0.1 with the Tiny5 wordmark now and the triceratops when you draw it? *Unblocks: the release date.* (The plan already allows it; confirm so the artwork stops being a silent dependency.)
6. **The site**: hosted where (GitHub Pages on the org, Hostinger beside the mail, a Vultr box), and is it 0.0.x or 0.1 content? *Unblocks: #337's remaining acceptance criterion and the DNS work.*
7. **The runner's fallback**: when a core routes to the runner, may the player see and override it (an ES row, defaulting to the runner), or must routing stay invisible? *Unblocks: #336 step 1's design and QA's ability to force RetroArch.* (C11.)
8. **The cloud folder**: fresh installs get the new default, upgrades keep their configured `/ROCKNIX` — confirm, and name the new default. *Unblocks: Phase A's cloud checkbox, the rehearsal's cloud case, the release-note wording.* (R3.)
9. **Device QA per release**: every device every release, or VM + one rotating device per 0.0.x with all four at minor-version boundaries? *Unblocks: the sustainable release cost.* This relaxes the current gate, so it is yours alone. (R5.)

---

## 7. The recommended plan

### Phase 0 — finish the migration (the rest of Phase B). Days: 1–2.

**Entry:** this report applied; Q2, Q3, Q4 answered (Q1 may gate Phase 1's end rather than its start).

**Work:** transfer the ES fork and the site repo; fork `ROCKNIX/rocknix-splash` into the org; create a team with write on all org repos for rasterabot (per 05:43's grant lesson); sweep pass two — enumerate the 24 files of the 00:05 comment, classify each (swept / record / true-upstream-reference), and re-point the ES and splash recipe fetch URLs (commit pins unchanged); secrets and variables inventory on all repos; Actions hardening (approval for all external contributors; no PR-triggered jobs on self-hosted runners); mirror `ghcr.io/rocknix/rocknix-build` to the org pinned by digest; `CONTRIBUTING.md` and the PR template per Q4; tracker triage of upstream-era issues; the owed register rows (build box, version scheme, attribution wording, merge cadence).

**Exit (agent-verifiable):** `gh api repos/rasteratops/{emulationstation,<site>,splash>` each return 200; the old addresses redirect (`gh api repos/maxengel/rocknix --jq .full_name` reads `rasteratops/distribution`, and the ES equivalent); the 24-file classification table filed; `grep -rn "maxengel/rocknix" -- tools .githooks .claude .github` filed with every hit justified; the ES and splash packages re-fetch from the new addresses (the fetch logs' URL lines filed); `gh secret list` / `gh variable list` filed; `gh api repos/rasteratops/distribution/actions/permissions` filed showing the approval setting; the mirrored container's digest filed; `tools/box-check` 0 fail, `tools/rules-check` and `tools/register-check` PASS; the register rows' IDs filed.

### Phase 1 — 0.0.1: the visible identity. Days: 2–3 elapsed on one box.

**Entry:** Phase 0 exit; Q1, Q2, Q8 answered. The artwork is **not** an entry condition.

**Work:** the Phase A checkboxes as written, plus: `NAMING.md`; the splash fork's `svg_paths[]` replacement and the two renderer changes (*"the drawing's own box instead of 1284:500, and the scale rounded down to a whole number"* — issue-337.md, 02:03); the ES fork's two strings and the theme's logo text, with both recipe pins moved to the forks' commits; the updater change per Q1; the cloud-folder both-read; the attribution line in README and release notes; OFL/CC notices where files ship.

**Exit (agent-verifiable):** four images from one head — the head commit and the four `BUILD_ID`s filed; guest d boots 0.0.1 with a splash frame at 640×480 whose cells are measurably square (the floor-scale proof), and a 1280×960 composition proof for the Nova's size; `/etc/os-release` and the info screen read the name and `0.0.1` (the lines filed); **the residue audit** — every `ROCKNIX` occurrence on the booted guest (hostname, SMB, os-release, boot menu, installer screens, ES strings, updater output) classified, zero player-visible hits, the table filed; vm-qa full PASS with the suite lines filed; `tools/time-to-play`'s two numbers beside RC2's 1.05 s / 2.03 s on the same guest, no regression beyond noise; **the rehearsal through the real updater** — an RC2 guest is offered and applies 0.0.1, state kept, the cloud remote still on its pre-existing folder, the updater's log filed — plus a clean-install guest whose first boot creates the new folder and no `/ROCKNIX`; the named devices flashed on per-device yeses with a boot frame each; the release drafted with the attribution sentence and the device-support statement, the maintainer's explicit yes, published as `0.0.1`, and `gh release view 0.0.1 --json body` reads the sentence back.

**Cut:** the animal logo, the site, silent boot, the runner, hosted-VM CI, the second box.

### Phase 2 — the fork's own process (#341) and the site. Days: 1–2, overlapping Phase 1's build windows.

**Entry:** Phase 0 exit. **Exit:** #341's acceptance met *and* the CLAUDE.md/AGENTS.md pass done (the `rocknix.org` docs-PR rule re-scoped); the constructed-violation proofs re-run with the still-refusing scans named (the credential scans first); the site builds under `rasteratops.com` with the attribution on its front page, the build log's last line filed; each relaxation with its register row citing the relaxed one.

### Phase 3 — the estate: the second box and the CI topology. Calendar-time, parallel.

**Entry:** the purchase; Phase 0's security settings are a hard entry for registering any runner. **Exit:** the new box builds one device from a clean checkout (the log's last line and the `BUILD_ID` filed) and runs vm-qa to PASS on serval's 0.0.1 image; a four-target cold build split across both boxes with the wall-clock filed beside the one-box day; the hosted-runner VM experiment measured once and its verdict filed (KVM present, runtime, boot-only signal — timing explicitly not relied on); the CI-topology register row.

### Phase 4 — 0.0.x: review tier 1, silent boot, fixes.

**Entry:** 0.0.1 published; #340's current-state comment written. **Exit:** the tier-1 audit folder complete (*"the six phase files, both seats' packets under `second-opinions/`, `tools/lint-audit-artifacts` PASS, and a punch-list issue"* — #339); #340's four acceptance boxes ticked (the frame-series PASS lines for boot, shutdown and restart; the journal-completeness read; the serial answer; the two device-facts rows); each 0.0.x released on Phase 1's gates, including the updater rehearsal from the previous release.

### Phase 5 — 0.1: step 0, then the spike.

**Entry:** tier 1 done; the version scheme ratified; #336's acceptance amended (step 0, the state contract, the override row per Q7). **Exit:** step 0's frames and parity numbers filed (every core kind, achievements and netplay working — #336's own claim for step 0, so the gate is zero feature regression); the spike record with the licences quoted from their trees, including MinUI's absence (*"a reference to read, not code to copy"* — issue-336.md); the three-way time-to-play table (RetroArch today vs. step 0 vs. the runner) on the same guest; the direction register row. Tier 3 completes before step 1's build-out continues.

### Phase 6 — standing: the upstream merge.

Merge `upstream/next` on a fixed rhythm (fortnightly, or on device-relevant change), gated on a GENERIC_X64 build + vm-qa PASS + one ARM build; the full four-target QA only at releases. Recorded as a register row. This is the fork's hardware support and its security channel; it is the one recurring cost that may not slip.

---

*End of report. All citations are to the embedded corpus; where the corpus was silent, I said so rather than extrapolate.*

=== END kimi-analysis.md ===

## Output

Produce a peer review that identifies the strongest claims, weakest claims, missing failure modes, and concrete revisions each proposal should consider. Do not vote yet, and do not revise your own plan in this step.

Refer to each analysis by its injected filename (e.g. `claude-analysis.md`), never by an invented ordinal like "Analysis 1" — downstream steps inject your review into other members' prompts, and anonymized ordinals have caused members to misidentify which Step 1 position was their own (2026-08-17 q3q4 run, Step 3).

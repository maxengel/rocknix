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
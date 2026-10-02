# rasteratops 0.0.1: a bounded, recoverable release—not a cosmetic rename

## Recommendation

The fork is decided. The remaining question is how to make its first release trustworthy without simultaneously taking on a new frontend, a new CI estate, and a new operating model.

**I would define 0.0.1 as RC2’s product behavior under rasteratops’s identity, with a controlled release channel and a proven state-preserving upgrade.** I would not accept “new artwork, a name sweep, and about a day” as the release estimate. That describes some implementation work, not the compatibility, licensing, build, and release verification surrounding it. The plan itself requires four images, VM suites, an RC2 upgrade rehearsal, and consented device tests. [^s01]

My principal changes are:

1. Finish the repository and authority boundaries before release automation expands.
2. Treat the updater and saved cloud namespace as compatibility interfaces, not branding strings.
3. Identify every release artifact by its complete source and build manifest—not merely “one head.”
4. Separate immutable QA inputs from mutable build outputs now; do not wait for the second box.
5. Keep hosted VM QA experimental until its actual coverage and resource requirements are measured.
6. Conduct a targeted release-boundary audit before 0.0.1, while retaining the gradual whole-codebase review.
7. Keep the runner, silent boot, broad internal rename, and infrastructure purchases off 0.0.1’s critical path.

**Evidence boundary:** this analysis uses the supplied embedded texts. It does not establish the present state of GitHub, the checkouts, the machines, or any executable. The source hashes are the Facilitator’s values, verified at embed time; I have not independently re-read or re-hashed files. Proposed gates below are requirements, not claims that corresponding checks already exist or have passed.

---

## 1. Establish the current baseline before revising the plan

Several original checkboxes have been overtaken by later decisions and recorded actions.

| Area | Latest position supported by the embedded record | Planning consequence |
|---|---|---|
| Direction | D-WORKFLOW-084 names rasteratops; D-WORKFLOW-085 makes the internal rename later work; D-WORKFLOW-087 parks ROCKNIX submissions. | Do not revive the earlier two-prong submission plan or make upstream acceptance a dependency. |
| Distribution repository | The 05:14 comment records the transfer to `rasteratops/distribution`, updated remotes, and the operational address sweep. | Reconcile and verify the completed migration; do not plan to recreate it. |
| Organization and bot access | The 05:48 comment demonstrates a token-authenticated write. The issue’s updated organization checkbox records two owners and required two-factor sign-in at 05:51. | Earlier token failures and disabled two-factor enforcement are historical, not current blockers. |
| Other repositories | The packet does not record completion of the EmulationStation and site transfers. The splash needs its own fork and recipe pin. | Phase B is partly complete, not wholly complete. |
| Build estate | The second matching Tiny and 4 TB NVMe are the recorded intended shape, explicitly “not started now.” The NUC remains a music server. | No release dependency on an unpurchased machine; no further proposal to repurpose the NUC. |
| Product baseline | D-WORKFLOW-084 names RC2’s tree, `69e6039f8f`; subsequent migration commits are also recorded. | Define the precise permitted delta from RC2 rather than assuming the current branch is exactly RC2. |

These conclusions follow from the later comments in #338 and the refining decision rows, not from the older issue bodies. [^s01][^s09]

---

## 2. Claims that are wrong, overstated, or not yet proven

| Claim or assumption | Evidence and assessment | Required correction |
|---|---|---|
| **A public fork automatically satisfies the GPL’s source obligations.** | #334 says: “this fork is public, so that is met by existing.” The actual `LICENSE.md` says bundled components retain their respective licenses. Public build recipes and patches do not, by themselves, demonstrate that recipients can obtain all required corresponding source for the binaries shipped. [^s07][^s11] | Make source compliance an explicit release deliverable. Inventory the shipped components, exact sources, modifications, notices, and applicable delivery obligations. This is not a finding that the current release violates a license; it is a finding that the stated compliance proof is insufficient. |
| **The inherited artwork terms are simply CC BY-SA.** | #334 and #337 sometimes abbreviate the obligation that way. The embedded primary license explicitly says **CC BY-NC-SA 4.0**. [^s07][^s03][^s11] | Correct the shorthand. Preserve applicable notices and restrictions; separately license the new independent artwork. “A fork of ROCKNIX, itself a fork of JELOS” is useful ancestry, not a substitute for every component’s notices. |
| **A fork necessarily breaches the endorsement condition merely by displaying an upstream logo.** | #334 treats this categorically. The primary license permits sharing and adaptation subject to conditions, including not suggesting endorsement. It does not state that every display automatically implies endorsement. [^s07][^s11] | Keep the settled choice of independent identity, but use accurate legal reasoning. Do not turn that choice into an unsupported claim that every historical upstream image or name must be erased. |
| **The updater can point interchangeably at an endpoint or a release page.** | #337 says the updater **POSTs to an endpoint and follows the address returned**. #338 describes pointing it at the fork’s releases. Those are not necessarily interchangeable protocols. [^s03][^s01] | Read and test the actual request, response, version selection, device matching, and download verification contract. A URL substitution is not an updater migration proof. |
| **The visible rename is isolated from build behavior.** | `CLAUDE.md` says distribution options are sourced before project and device options. Moving to `distributions/<name>/` therefore changes a build-configuration input even while `PROJECT=ROCKNIX` and internal names remain. [^s10] | Verify the final resolved configuration and emitted artifacts. Check defaults, image names, update matching, and cache/stamp invalidation—not just the new options file. |
| **Renaming internal paths would make every upstream merge conflict across all affected files.** | #338 uses that strong formulation. The measured path count demonstrates a large change surface, not a guaranteed conflict in every file on every merge. [^s01] | Keep the rename deferred under D-WORKFLOW-085, but measure its eventual merge cost with representative upstream merges rather than relying on an absolute claim. |
| **Four roots plus cache require about 400 GB.** | Phase D starts with roughly 90 GB per root. The later 00:24 comment gives **110–147 GB per root** and **38 GB of source cache**. Four such roots plus that cache imply **478–626 GB**, before images, VM disks, additional worktrees, and staging. This is arithmetic planning capacity, not a fresh measurement. [^s01] | Replace the stale estimate with measured per-target usage and an explicit headroom policy. |
| **Separating QA from serval makes unrestricted compiler parallelism safe.** | The record shows `webkitgtk` killed compiler processes at 24 threads on the existing machine. A second identical machine still leaves each individual build on approximately the same usable memory. [^s01] | Retain the conservative cap until isolated-build peak memory is measured. Two 64 GB machines are not a 128 GB address space for one build. |
| **A second machine will approximately halve the four-device rebuild day.** | #338 presents this as the benefit of the second box, but supplies no per-target timing or critical-path measurements. [^s01] | Treat it as a hypothesis. Measure build-time imbalance, cache preparation, disk pressure, thermal behavior, and the loss of QA capacity when both machines build. |
| **Hosted KVM implies hosted VM-QA equivalence.** | #338 proposes `/dev/kvm`, a 2 GB image download, and the six-hour limit. #336’s hardware-core proof specifically requires guest d’s graphics path through the host GPU. [^s01][^s02] | Qualify hosted suites individually. KVM availability is not proof of suitable graphics, enough memory for the guest fleet, or equivalent visual coverage. |
| **A headless frontend is mostly a few thousand lines of glue.** | #336 estimates 3,000–5,000 C lines and says every line is glue. The same issue identifies save-state contracts, achievements, input, graphics contexts, cards, and fallback behavior as requirements. [^s02] | Estimate by verified capabilities and failure cases, not line count. These boundaries are where lifecycle and compatibility bugs occur. |
| **The achievement proxy carries over “untouched,” and fallback means a broken runner costs nothing a player sees.** | Both are assertions in #336, not demonstrated results. A common HTTP destination does not prove equivalent hashing, memory mapping, hardcore behavior, offline replay, save-state compatibility, or exit behavior. [^s02] | Require a feature-and-state compatibility matrix. A common control protocol can hide process selection; it cannot eliminate differences in backend capabilities. |
| **The complete review can be estimated from additions and packet throughput.** | #339’s counts are additions and broad source-tree totals, with overlapping tiers and exclusions. They do not establish coverage of changed existing code, deleted checks, final patched sources, or downloaded components. [^s04] | Track review coverage by exact source revision and final integration context. Treat packet throughput as scheduling information, not evidence of completeness. |
| **Interval screenshots can prove that every displayed frame is black, splash, or interface.** | #340 asks for interval capture and an “every frame” acceptance claim. Unsampled flashes remain possible, and capture starts only when QEMU supplies frames. [^s05] | Bound the claim to the observed interval and capture coverage. Use continuous capture where feasible and separately document pre-OS panel behavior. |
| **The repository instructions already describe the fork’s operating model accurately.** | `CLAUDE.md` says “there is no unit-test suite,” “the only lint” is `pkgcheck`, and user-facing changes need a docs PR to ROCKNIX’s site. That conflicts with the recorded test estate and current fork direction. [^s10][^s01][^s09] | Update operative instructions before further automation. Preserve historical records; correct current guidance. |
| **#341 unambiguously defines the remaining guards.** | Its table retires the personal-paths guard for the fork, while its acceptance text says scans retain “the personal-paths and credential checks the fork still wants.” [^s06] | Write an explicit allowed/denied matrix by destination and action. Keep credential protection universal; do not accidentally retain upstream-only restrictions or accidentally remove security checks. |

Two additional small inconsistencies deserve correction rather than propagation: #337 gives the generated wordmark as both 58 and 57 cells wide; and the decision-register excerpt advertises rows through 088 but contains no D-WORKFLOW-088. Neither should be silently “resolved” by invention. [^s03][^s09]

---

## 3. Risks, ordered by expected cost

This ranking is my qualitative judgment of recurring burden multiplied by damage and recovery effort for a very small project. It is not a measured probability model. A lower-ranked legal or security problem can still block publication.

| Rank | Risk | Why its expected cost is high | Primary control |
|---:|---|---|---|
| **1** | **Upstream drift, especially the EmulationStation fork** | The fork intends to keep importing hardware work while independently changing launch behavior and interface internals. #336 itself identifies deeper ES integration as the real divergence cost. This burden recurs indefinitely. [^s02][^s09] | Separate upstream intake branches, immutable pins, a scheduled integration cadence, a maintained fork-delta map, and a narrow backend interface. |
| **2** | **Upgrade, updater, and cloud-namespace mistakes damaging player state** | The rename crosses an existing `/storage`, a legacy cloud folder, old release tags, and an updater contract. These are exercised by existing users, not merely by clean installations. [^s01][^s03][^s10] | Keep existing state authoritative; use explicit migration rules, failure tests, immutable release artifacts, and rehearsed recovery. |
| **3** | **Automation authority escaping its intended boundary** | The setup retains an owner account alongside rasterabot, grants workflow-writing capability, uses SSH separately from the token, and gives the assistant a mailbox. The record already contains a raw-code masking failure and an incorrect access inference. [^s01] | Separate execution identities and credentials; untrusted CI never touches release authority; sensitive promotion is owner-approved and auditable. |
| **4** | **False confidence from an incomplete QA fleet or correlated tests** | x64 VM success is not ARM GPU or bootloader success. The process has already missed a dead page script because a stub was insufficiently honest. [^s02][^s08][^s10] | Explicit coverage matrices, real-script integration tests, immutable test inputs, negative tests, and narrowly scoped physical confirmation. |
| **5** | **License and source-delivery omissions** | The distribution is a collection of differently licensed works; branding, font output, frontend code, patches, and binary source obligations are distinct questions. Current summaries conflate some of them. [^s11][^s07][^s02][^s03] | A release-specific license/source inventory and artifact-level checks, not a generic “GPL and MIT” sentence. |
| **6** | **Review and feature work exceeding the maintainer’s sustainable capacity** | #339 alone estimates about 47–50 packets per review pass across its three tiers, before fixes and re-review. #336 adds a substantial new compatibility surface. Neither workload is removed by buying compute. [^s04][^s02] | A small active-work limit, an explicit audit budget, and no feature deadline that silently overrides the audit gates. |
| **7** | **Build-state corruption and resource contention** | OOM events are recorded; the plan says interrupted builds poison in-flight packages; builds can replace the image that QA is reading. Avoiding spot instances solves only one source of interruption. [^s01] | Resource limits, root/job ownership, interruption recovery, content-addressed QA copies, and disk/memory monitoring. |
| **8** | **Loss of repository history or release infrastructure availability** | The issue tracker is part of the project’s decision and proof system. Git redirects are not backups, and the build container remains an upstream-hosted dependency. [^s01][^s07] | Backups of non-git metadata, restore exercises, pinned build dependencies, and a minimal operating surface. |

### 3.1 Hardware support arriving upstream is not hardware integration becoming free

Keeping `upstream/next` does avoid becoming a hardware bring-up team. It does not guarantee that kernel, Mesa, emulator, launcher, and ES changes arrive as independently interchangeable pieces.

I would establish:

- **Weekly upstream triage**, distinguishing security fixes, selected-device fixes, and unrelated changes.
- **A scheduled integration batch**, initially every two weeks, with its cadence adjusted from actual merge and QA cost.
- **A release freeze** during candidate qualification, with only reviewed release fixes admitted.
- **An urgent path** for security or selected-device regressions rather than waiting for the next feature release.
- **Separate distribution and ES intake records.** A distribution merge must not silently replace the fork’s ES pin.
- **A fork-delta ledger:** purpose, owner, upstream origin where applicable, affected targets, conflict history, and retirement condition.

The cadence is a recommendation, not a source fact. Its purpose is to avoid both perpetual integration churn and a months-old divergence cliff. The dependency it manages is explicit in D-WORKFLOW-084 and #336. [^s09][^s02]

The later internal rename should have its own compatibility and merge rehearsal. It should not coincide with a major upstream import or a frontend-backend change. D-WORKFLOW-085 says the rename is wanted later; it does not require mixing that risk into unrelated work. [^s09]

### 3.2 The updater is a release safety boundary

The release-channel plan needs answers to questions that a splash proof cannot answer:

- How does `0.0.1` compare with the RC2/date-based scheme?
- How are historical ROCKNIX-branded RC releases excluded from the new channel’s selection?
- How is the correct target selected when filenames and visible names change?
- What happens on a partial download, wrong target, malformed response, insufficient space, or unavailable endpoint?
- What authenticates the downloaded object?
- What can be rolled back after `/storage` or a cloud namespace has changed?

A checksum downloaded from the same compromised location as an image establishes consistency, not independent authenticity. The project needs a documented trust model; signed metadata is one option, not something the packet demonstrates already exists. The concrete implementation must be assessed from the missing updater and publishing code. The need follows from #337’s POST-based protocol and `CLAUDE.md`’s warning that every build reaches devices with existing state. [^s03][^s10]

**My 0.0.1 default:** retain the existing manual installation/update route after rehearsal. A network update check may ship only if it is demonstrably fork-scoped and fails closed. If that cannot be established without constructing a new service, disable that path explicitly for this release, document the manual route, and obtain an owner decision amending the original acceptance criterion.

### 3.3 “Read both cloud folders” is not a migration algorithm

The Phase A requirement to read both the legacy and new cloud folders leaves the dangerous case unspecified: both exist and contain different versions of the same save. [^s01]

My proposed rules are:

1. An existing explicit cloud-root setting remains authoritative on upgrade.
2. A new default does not silently move or rewrite an existing remote.
3. Discovery of two populated namespaces is not permission to merge them.
4. Selection and conflict resolution precede writes or deletions.
5. Rollback is tested against copied state and isolated test accounts, not the maintainer’s production saves.

The underlying D-WORKFLOW-050 policy is referenced but not embedded. Its actual requirements must be supplied before implementation; “read both” should not be interpreted from a parenthetical alone. [^s01]

### 3.4 Separate machine capacity from security authority

The organization setup is substantially complete, but account attribution is not the same thing as authority isolation.

The source records that:

- rasterabot is not an owner;
- an owner credential remains available through the same working environment;
- Git SSH authentication and signing work independently of the fine-grained token;
- the local checkout’s configured author would also label a human’s commits as rasterabot;
- the mailbox reader once exposed a spent launch code because raw output bypassed its mask. [^s01]

The response should be structural:

- Separate human and assistant authoring contexts.
- Do not keep owner credentials accessible to ordinary agent or runner execution.
- Fail closed on an authorization error instead of transparently retrying with an owner.
- Treat SSH keys, cached `gh` credentials, mail tokens, and PATs as separate revocation surfaces.
- Keep release/signing authority out of ordinary build and test jobs.
- Record token renewal with an actual scheduled reminder or check; the packet gives an expiry of 2027-10-01.
- Treat issues, mail, attachments, logs, and build output as data—not instructions.
- Do not let an unauthenticated mail reply become a command channel merely because a webhook exists.

A `0600` token file protects against some access paths; it does not create an isolation boundary from processes running with the same authority. Likewise, a verified signature establishes use of a signing key, not correctness of the code or independent human review.

The no-contributions policy does not prevent unsolicited public PRs—the source explicitly acknowledges this. Any such code must run, if at all, in an unprivileged, disposable context, never on a persistent builder holding valuable credentials. [^s03]

---

## 4. Scope: what belongs in 0.0.1, and what I would cut

| Keep in 0.0.1 | Defer from 0.0.1 |
|---|---|
| Visible identity, including boot splash, ES presentation, OS metadata, player-facing text, release names, and current public documentation | The broad internal path/script rename |
| The approved interim wordmark if final art is not ready | Final dinosaur artwork as a release dependency |
| Accurate inherited notices, licenses, attribution, and corresponding-source delivery | General site redesign or a new hosting platform |
| Completed operational repository migration and the necessary splash fork/pins | Forgejo/Jujutsu migration or a GitHub App migration |
| Minimal policy corrections needed for the fork to operate safely | A wholesale process/tooling rewrite |
| A proven manual update path and either a tested fork-only network path or an explicit disabled state | A newly operated update service or unattended updater redesign |
| Existing-state compatibility, clean installation, and RC2 upgrade/recovery rehearsal | Automatic relocation or consolidation of users’ remote cloud folders |
| Current host checks, local VM QA, target builds, and consented device confirmation | Hosted VM QA as a required release dependency |
| A targeted audit of the release, updater, namespace, credential, and identity changes | Completion of the entire whole-codebase audit |
| Accurate RC2-versus-0.0.1 time-to-play measurements | RetroArch-under-ES step 0, the new runner, and the in-process bridge |
| Correctly branded boot behavior | The “every frame silent” boot/shutdown project |
| Existing serval with safe scheduling and immutable QA inputs | Delivery of the second box or any cloud build purchase |

This scope preserves D-WORKFLOW-084/085’s release intent, D-WORKFLOW-083’s gradual audit, and #340’s explicitly future-facing request. It does not discard the deferred work. [^s09][^s05]

### Artwork implementation needs a real proof

#337 says the splash compiles SVG path data into `main.c`; it does not simply load an arbitrary SVG. The final supplied asset therefore needs conversion and renderer validation. The proposed 64×32 composition and whole-pixel scaling should be checked at **640×480 and 1280×960**, not merely approved in a source SVG viewer. Resolve the 57-versus-58-cell wordmark discrepancy from the actual generated geometry. [^s03]

The current `LICENSE.md` also contains an upstream logo hotlink, release badges, and a Discord badge. Updating current presentation is legitimate; deleting the inherited legal text or historical attribution is not the same operation. [^s11]

---

## 5. What is missing from the packet

These are evidence gaps, not claims that the project has no such files or practices.

| Missing evidence or decision | Why it matters |
|---|---|
| **A release bill of materials**: exact distribution, ES, splash, source, patch, configuration, and build-environment identities | “Four images from one head” does not identify the complete software delivered. |
| **The actual updater and publisher implementations and an RC2 response/artifact example** | The endpoint-versus-release-page question cannot be settled from prose. |
| **An explicit four-image and device-support matrix** | The packet names several devices and “four images” but does not provide an unambiguous release contract covering target, hardware revision, boot mode, and required proof. |
| **Actual workflow definitions and runner trust boundaries** | A list of suites does not show triggers, permissions, cache trust, secret exposure, or whether untrusted code can reach self-hosted machines. |
| **Recovery procedures for interrupted persistent builds** | Local power loss, OOM, cancellation, and disk exhaustion remain even without spot instances. |
| **Issue/release metadata backups and a restore procedure** | Git alone does not preserve the paper trail on which the operating process depends. |
| **Primary licenses for the relevant frontend sources, site content, font files, and new artwork** | The packet includes secondary license readings, including an ES root/recipe discrepancy and unresolved MinUI permission. |
| **A vulnerability intake and urgent-release policy** | No community or sponsorships does not remove the need to receive and act on a serious security report. A minimal private channel is enough. |
| **A durable job lifecycle** | Builds and proofs need recorded queued/running/failed/completed states that survive sessions. Notification delivery is useful, but not a substitute for authoritative job state. |
| **A maintenance budget and work-in-progress limit** | The plan contains more parallel responsibilities than one maintainer and one assistant can safely make active at once. |
| **Artifact privacy and QA-content rules** | Frames, logs, test ROMs/BIOS, copied saves, and account fixtures need an explicit publication boundary. |
| **Canonical scoped rules and runbooks referenced by `CLAUDE.md`** | Their contents cannot be assumed when changing builds, flashing devices, migration semantics, or publishing behavior. |
| **D-WORKFLOW-088** | It is advertised by the register excerpt’s heading but absent. No conclusion here relies on it. |

The orchestrator should supply the implementation and primary-license material before converting this review into executable release gates. In particular, the updater, release publisher, CI workflows, RC2 manifests, and applicable scoped rules are needed before release approval—not merely for later documentation. [^s01][^s02][^s03][^s09][^s10]

---

## 6. Questions only the owner can answer

These questions concern authority, support promises, and trade-offs. An agent can gather measurements; it cannot legitimately choose the owner’s tolerance for loss, cost, or publication.

| Question | Decision it unblocks | My recommendation |
|---|---|---|
| **Which exact targets and physical devices will 0.0.1 claim to support, and which can receive consented validation?** | The release matrix and hardware gates | Advertise only the explicitly qualified set. Distinguish built, VM-tested, and device-tested rather than blending them. |
| **May 0.0.1 ship with manual updates and an explicitly disabled network update path if the current protocol cannot be safely retargeted within scope?** | Whether updater infrastructure blocks the release | Yes, if the manual path is rehearsed and the limitation is plainly documented. Never silently retain upstream updates. |
| **When both cloud namespaces exist, who or what chooses the authoritative one?** | Safe dual-read behavior and recovery | Preserve explicit existing configuration; require a deliberate choice for ambiguous discovery. |
| **What license is granted for the new independent artwork, and which artifact is approved for this release?** | Redistribution of the new assets | Ship the already proposed interim wordmark if necessary; do not wait for final art. |
| **Who may promote a candidate to a public release, and may automation change its own workflow or release authority?** | Protected refs, environment approvals, and publisher credentials | Automation prepares evidence and artifacts; the owner approves promotion. Sensitive authority changes require a separate owner action. |
| **Are the two owner accounts independently recoverable?** | Whether the organization has real lockout resilience | Test recovery custody, not just the count of owner logins. Do not assume two usernames mean two independent recovery paths. |
| **When, if at all, should the recorded second-box purchase happen?** | Infrastructure scheduling | After measuring the first release cycle’s bottleneck. The hardware choice is recorded; its arrival need not block 0.0.1. |
| **What recurring time and money budget is available for upstream intake, audits, compute, and release qualification?** | Sustainable cadence and active-work limit | Initially allow one product change plus one bounded maintenance/audit task; avoid concurrent runner, rename, and CI replatforming projects. |
| **Should #339’s full interface-review-before-runner-work rule stand, or be explicitly amended to permit an isolated spike after a targeted review?** | The honest start date of #336 | Keep the existing gate unless a written amendment defines the narrower spike, its isolation, and the remaining review obligation. |
| **What private security-report channel and response commitment are acceptable?** | Minimal safety operations without creating a community | One owned channel and a modest, explicit commitment—not a forum or support organization. |

The settled choices—name, fork, no contributors, no sponsorships, no ROCKNIX posting for now, and ES as the interface—do not need another vote. [^s09][^s03]

---

## 7. Recommended execution plan

Every phase should leave an evidence bundle identifying the tested source revision, relevant dependency pins, artifact digest, build identifier, environment, command or procedure, exit status, and any unexecuted cases. A bare `PASS` without those associations is not sufficient.

The artifact descriptions below are proposed requirements. They are not invented existing files or tools.

### Phase 0 — Reconcile the record and freeze the release contract

**Entry:** the current embedded decisions; no assumption that an unchecked issue box accurately describes current state.

**Work**

- Reconcile completed migration work with the checklist.
- Resolve the full RC2 commit and identify all subsequent changes intended for 0.0.1.
- Record the exact release targets and the distinction between VM and device qualification.
- Establish the accepted update route, cloud-namespace rules, recovery scope, and performance comparison method.
- Correct active instructions that still direct work upstream or deny the existence of the test estate.
- Separate historical records from operational strings that should change.

**Exit evidence**

- A bounded RC2-to-candidate change list.
- A release matrix with no ambiguous “four devices” shorthand.
- An explicit list of excluded work.
- Updated decision rows for newly chosen policies.
- Passing rules/register checks against the revised operative guidance.

**Gate:** no product feature work enters the candidate merely because it was already on `next`.

This phase makes D-WORKFLOW-084’s RC2 baseline and D-WORKFLOW-087’s single-prong direction executable. [^s09][^s10]

### Phase 1 — Complete repository custody and constrain authority

**Entry:** Phase 0’s repository and publication contract.

**Work**

- Verify the distribution transfer’s retained records and operational remotes.
- Complete the ES and site migrations where still necessary; create the splash fork.
- Verify account permissions separately for every repository. The source explicitly shows that a token scoped to all repositories did not itself grant the account write access.
- Back up git refs and relevant non-git metadata.
- Isolate owner credentials from ordinary assistant and runner execution.
- Define the destination-aware guard matrix for #341.
- Publish the no-contributions/no-sponsorship policy without treating it as a CI security control.

**Exit evidence**

- Repository IDs, refs, issue/release metadata summaries, and redirect checks.
- Positive and negative permission tests: permitted repository operations succeed; owner-only operations remain unavailable to normal automation.
- An authorized bot write attributed to rasterabot, without owner fallback.
- Constructed guard tests showing allowed fork records, refused credentials, and refused unintended upstream destinations.
- Renewal and recovery mechanisms with an owner and a scheduled trigger.

**Gate:** adding a repository must not silently require an owner-token workaround.

The final record already demonstrates that access must be tested by the intended operation, not inferred from successful public reads or SSH pushes. [^s01][^s06]

### Phase 2 — Implement the bounded identity and compatibility changes

**Entry:** custody established; updater implementation, license sources, and relevant rules available.

**Work**

- Change the visible identity while retaining the internal compatibility surface specified by D-WORKFLOW-085.
- Select the new distribution configuration explicitly and verify the final values after layered overrides.
- Pin the forked splash and ES sources.
- Update current release/site presentation and player-facing text without rewriting history or copyright ownership.
- Implement the fork-only updater behavior or the approved disabled state.
- Preserve existing cloud-root configuration; implement only the approved discovery/conflict semantics.
- Review this release’s high-risk delta: update handling, namespace handling, artifact selection, secrets, and release permissions.
- Build the license/source-delivery inventory.

**Exit evidence**

- A player-visible identity inventory, with every intended surface accounted for.
- A documented exception list for legacy internal names and persistent compatibility paths.
- Rendered artwork at both required panel sizes, with the generated dimensions and asset identity recorded.
- A license/source inventory tied to the actual candidate inputs.
- Negative update and cloud-namespace tests demonstrating refusal before destructive action.

**Gate:** neither a branding change nor a default change may silently migrate existing remote data.

The new splash’s compiled-path format and distribution-option layering make these real integration changes, not merely text substitutions. [^s03][^s10]

### Phase 3 — Build immutable candidates and prove artifact identity

**Entry:** the bounded candidate is frozen and its release-boundary review is complete.

**Work**

- Pin the build environment by immutable identity rather than relying on `latest`.
- Build every selected target from the same release manifest.
- Handle image/package stamp invalidation explicitly. `CLAUDE.md` warns that script-only changes do not necessarily trigger a new image.
- Retain conservative parallelism until measurements justify increasing it.
- Copy completed artifacts into immutable QA storage.
- Make QA consume a specific artifact digest, not a changing `target/` filename.
- Run the host suites and capture their actual case execution.

**Exit evidence**

For each target:

- Source and dependency manifest.
- Build identifier—its existing `BUILD_ID` where available, otherwise an explicit manifest identifier.
- Image metadata demonstrating the intended identity and version.
- Image and update-artifact digests.
- Successful build logs and evidence that the intended image was regenerated.
- Wall time, peak memory, disk usage, and source/cache usage.
- Host-suite results with case counts, skips, and exit statuses.
- A check that replacing a mutable build output cannot alter an in-progress QA input.

**Gate:** no release or VM test reads a file that another build can replace.

This solves the recorded build/QA artifact race before a second machine exists. More memory alone would not solve it. [^s01][^s10]

### Phase 4 — Prove installation, upgrade, failure, and recovery

**Entry:** immutable, identified artifacts from Phase 3.

**Work**

- Test a clean installation and RC2-to-0.0.1 upgrade on isolated VM state.
- Exercise existing settings, saves, save states, achievements/proxy state, and cloud configuration.
- Use fixtures or isolated accounts for remote-write tests.
- Test update failures before accepting successful update behavior.
- Rehearse recovery of both the OS and the retained state; distinguish binary rollback from state rollback.
- Measure time to play against RC2 under a written, repeatable method.
- Request physical tests individually, stating what each writes, sends, and leaves behind.

**Exit evidence**

- Guest-d frames at the relevant panel sizes showing splash, interface identity, and info screen.
- `/etc/os-release` values and updater configuration tied to the tested image.
- VM suite results tied to the candidate digest and build identifier.
- A clean-install and upgrade state comparison with explained differences.
- Failure-test results for wrong target, malformed response, incomplete download, bad digest, unavailable service, and insufficient space, as applicable to the implementation.
- A recovery transcript from copied state.
- Time-to-play results including repeated-run variation—not merely one favorable sample.
- A device matrix recording consent, artifact identity, result, and any untested physical fact.

**Gate:** “builds successfully” and “boots on x64” are never substituted for hardware qualification.

H700 flashing must follow the actual runbook, including runtime disk identification and device-tree requirements. Those procedures are referenced in `CLAUDE.md` but not embedded here, so they must be loaded before such work. [^s10]

### Phase 5 — Promote exactly the qualified candidate

**Entry:** all required matrix cells pass or carry an explicit owner-approved limitation; no unresolved release-blocking finding.

**Work**

- Stage the release and verify downloads from the addresses users will actually receive.
- Publish the required source materials, notices, checksums, and build/source manifest.
- Verify release selection does not confuse historical RC tags with the new channel.
- Publish accurate ancestry, support scope, update instructions, known limitations, and recovery instructions.
- Obtain owner approval of the release text and promotion.
- Retain RC2 and the candidate evidence; do not replace already-qualified binaries with a new build under the same identity.

**Exit evidence**

- Downloaded release assets match the qualified digests.
- The published release body contains the approved attribution and limitation statements.
- The site and update instructions resolve to the intended release.
- The network updater either selects only the intended target/channel or demonstrably remains disabled.
- A post-publication check uses the published asset, not a convenient local copy.

**Gate:** any rebuilt binary is a new candidate and repeats the affected qualification.

This extends the existing release-note read-back criterion into an artifact read-back criterion. [^s01][^s08]

### Phase 6 — Establish the sustainable maintenance loop

**Entry:** 0.0.1 is published and its first recovery/maintenance cycle is understood.

This phase has three bounded work streams, not three simultaneous transformations.

#### A. Upstream intake and audit coverage

- Run the scheduled upstream triage and integration cycle.
- Conduct #339’s tiers with exact source-revision coverage.
- Include modified and deleted logic, not just additions.
- Record static findings immediately; distinguish demonstrated, suspected, and unconfirmed behavior. VM reproduction is valuable evidence, not a reason to omit a serious suspected defect from tracking.
- For patch/config provenance, require unique identified entries, not merely a matching row count.
- Include origin, applicable license, reason carried, affected targets, applied base, validation, and retirement condition.
- Preserve the rule that punch items are resolved or individually accepted by a register row before 0.1.

#339’s “every behavioral finding proven on the VM before it is a punch item” should be refined to avoid a dangerous reporting gap. Some faults are established statically; others require hardware or conditions the VM cannot reproduce. [^s04][^s09]

#### B. Hosted VM experiment

Measure, on the exact runner label:

- KVM availability and usability;
- CPU, memory, disk, and graphics capabilities;
- download, expansion, boot, test, and upload time;
- coverage versus local execution;
- behavior across fresh repeated jobs;
- total cost, artifact retention, and failure handling.

Promote only the suites actually demonstrated. Keep graphics- or hardware-specific coverage local where necessary. A passing subset must remain visibly a subset. [^s01][^s02]

#### C. Second-box introduction, if purchased

Provision the same software baseline but **not cloned machine identities or private keys**. Keep immutable artifact transfer between builders and QA. Measure a split-role day and a two-builder day.

Before increasing parallelism, prove:

- bounded memory use;
- no artifact races;
- safe interruption recovery;
- available QA capacity;
- sufficient disk headroom.

The intended hardware is already recorded. What remains is a measured operational benefit, not another round of speculative RAM advice. [^s01]

### Phase 7 — Establish the unified-interface baseline, then evaluate the runner

**Entry:** the interface-review gate in #339 has been met, or a precise owner-approved sequencing amendment exists. Relevant state, launch, control, and achievement findings are resolved.

#### Step 7A: prove RetroArch under the ES interface

Before writing a replacement backend, demonstrate:

- ES can present the intended in-game UI while a game is running;
- focus, input ownership, graphics presentation, pause, resume, and exit work correctly;
- command verbs actually exist and behave as expected in the pinned RetroArch build;
- advanced configuration remains reachable as the owner allowed;
- unsupported commands and lost processes fail safely.

A command socket does not by itself prove that ES can render, receive input, and manage lifecycle correctly over the running game. That is the first technical spike, not a detail to discover after the runner exists. [^s02]

#### Step 7B: prototype the backend behind a versioned adapter

- Start with one software core and one GLES hardware core, as the later #336 direction requires.
- Copy only code with established permission. The packet does not establish a MinUI license grant.
- Specify request identity, acknowledgments, timeouts, process death, capability discovery, and save-operation completion.
- Verify achievements, hardcore behavior, offline replay, SRAM, save-state compatibility, autosave, cards, and exit semantics.
- Route by required capabilities, not just “has a GLES path.”
- Test fallback with existing state; launching RetroArch after a failed new backend must not overwrite or invalidate that state.
- Compare time to play, total relevant process memory, frame pacing, and failure behavior under matched settings and repeated trials.

The claim that every important shipped hardware core has a usable GLES path must become a per-core, per-target table, not a general assurance from the issue. [^s02]

**Exit gate for product adoption:** demonstrated player benefit, preserved required behavior, and a state-safe fallback. Startup improvement alone is insufficient.

**The in-process bridge remains a later, separate decision.** #336 already recognizes that it turns a core crash into an ES crash. A successful out-of-process runner is evidence to consider that trade-off, not automatic authorization to accept it. [^s02]

### Later independent work: internal rename and silent boot

These remain valid backlog items, but each gets its own compatibility surface and proof.

- **Internal rename:** persistent paths, service names, script callers, package resolution, aliases where necessary, and representative upstream merge rehearsals.
- **Silent boot:** a bounded observation window, suitable capture coverage, retained kernel/journal/serial diagnostics, recovery accessibility, and explicit facts about pre-kernel panel behavior.

Neither should be combined with a major backend switch or hardware import merely to make a release feel more complete. [^s09][^s05]

---

## 8. Bottom line

The plan’s largest underestimate is not compiler time. It is the continuing integration obligation created by owning the release while importing hardware support and deeply modifying EmulationStation.

The right first release is deliberately narrow:

> **The same product users already tested in RC2, recognizably rasteratops, obtainable from rasteratops, upgradeable without losing their state, and recoverable when something fails.**

The runner and infrastructure work can then be evaluated against a stable release contract. Without that contract, every later improvement changes both the product and the evidence needed to trust it.

---

## Corpus provenance and source citations

The following is the content to record as `corpus.provenance.json`. It is included in this Markdown document rather than represented as a file written to a filesystem.

```json
{
  "corpus_basis": "The 11 verbatim source texts embedded in the request.",
  "verification_basis": "SHA-256 values supplied by the Council Facilitator and verified at embed time. No filesystem reads or independent hashing were performed for this analysis.",
  "source_file_hash_algorithm": "sha256",
  "source_file_hashes_order": "Positionally aligned with source_file_paths.",
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
  "missing_sources": [
    "Actual updater and release-publisher implementations, protocol examples, and update-selection tests were not embedded.",
    "RC2 release manifests, complete source revisions, artifact identities, and the exact release-target matrix were not embedded.",
    "Actual CI workflow definitions, runner configuration, protection rules, and execution-permission boundaries were not embedded.",
    "Canonical scoped rules and operational runbooks referenced by CLAUDE.md, including the policy behind D-WORKFLOW-050, were not embedded.",
    "Primary licenses for the relevant EmulationStation, MinUI, nanoarch, rcheevos, Ludo, RetroArch, proxy, splash, font, and site sources were not embedded; issue comments supply secondary readings.",
    "The proposed new artwork's final artifact and license grant were not embedded.",
    "Measured build profiles, a current machine inventory, provisioning and interruption-recovery procedures, and infrastructure quotations were not embedded.",
    "Backup, restore, security-intake, and durable job-lifecycle evidence was not embedded.",
    "D-WORKFLOW-088 is advertised by the register excerpt heading but is absent from its embedded contents."
  ],
  "gap_handling": "These gaps are surfaced to the orchestrator in the analysis. No missing source paths, contents, or hashes are invented. Implementation-dependent recommendations remain proposed gates pending the necessary evidence."
}
```

[^s01]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-338.md` — sha256 **verified at embed time**: `371261538281f86d19a0deb9e637da703db5f9677e97f33bb1baa27954ccddba`. Cited passages include Phases A–D; the 00:09–00:25 hardware discussion and corrections; the 01:39 rename decision; the mailbox rules and disclosure correction; and the 05:14–05:48 migration/authentication record plus the updated 05:51 organization checkbox.

[^s02]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-336.md` — sha256 **verified at embed time**: `7ddf924f551e044df83c7ffcc7e90237cca557cf676bc2bf16933843eabda1e2`. Cited passages include “What the fork’s own work rests on in RetroArch today”; the 23:12 graphics, proxy, fallback, and divergence claims; the 23:15 step-0 and hardware-core revision; and the 23:25 license reading.

[^s03]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-337.md` — sha256 **verified at embed time**: `4b9ce0ef8f414f55352a50a113790b37e60fd2e97edefc5b32f34279fa383782`. Cited passages include the repository/contribution policy; the 23:46 POST-based updater and version proposal; the 01:33 name decision; and the 01:38–02:03 font, compiled splash geometry, and panel specification.

[^s04]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-339.md` — sha256 **verified at embed time**: `c3df6520498d2d1e36e0ffb609618bd59f84c297473c5754bdfa9e6b81b0e29a`. Cited passages include the line-count table, tier definitions and packet estimates, interface-review dependency, VM-proof condition, and provenance/punch-list acceptance criteria.

[^s05]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-340.md` — sha256 **verified at embed time**: `188308712ac7085575e22835c7789bd9ca41acb73312878eff7876c4735046a1`. Cited passages include the future-facing request, panel-only silence requirement, interval-frame acceptance criterion, preserved journal/serial requirement, and physical panel qualification.

[^s06]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-341.md` — sha256 **verified at embed time**: `433468efd2e0f43229d20b533b496e896684725fe8862438b57b5d7d4d52db0c`. Cited passages include the upstream-only policy table, the retained fork process, and the acceptance text concerning personal-paths and credential checks.

[^s07]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-334.md` — sha256 **verified at embed time**: `cb87fd678c7a84b3533606859e1ab3325e6a60411a25fb4545e824bf6bb5ff59`. Cited passages include the 22:57 software/branding license assessment, the claim that public-source existence meets the GPL obligation, and the discussion of upstream-hosted build and update infrastructure.

[^s08]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/issue-335.md` — sha256 **verified at embed time**: `7ab450e3524b52e9d52524db1077a505a202520ccb90142b67f70290bf75854e`. Cited passages include the release-note read-back criterion; the 23:20 effort comparison; and the 23:24 process-trust decision and dead-page-script testing failure. Earlier submission proposals are treated as superseded by the later decision rows.

[^s09]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/decision-register-fork-rows.md` — sha256 **verified at embed time**: `63bdbd5aa333618c1200e205f54420735cfcfde64c4d1ad733b8a8f4daf72016`. Cited passages are D-WORKFLOW-082 through 087 and the excerpt’s append-only refinement rule. D-WORKFLOW-088 is not present.

[^s10]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/CLAUDE.md` — sha256 **verified at embed time**: `846142f891e03b01d7f4f4cfd4459e0b9ab16f4bc3b0e0d45b1f5f53191a1677`. Cited passages include layered configuration, build commands, the testing/lint statement, fork workflow, image-stamp behavior, time-to-play, upgrade/install, VM-first, per-action device consent, and flashing/runbook requirements.

[^s11]: `research/council-runs/2026-09-30-rasteratops-fork-plan/sources/LICENSE.md` — sha256 **verified at embed time**: `61a24be2b0bc521542d0fa0a22f3452242609fd7570d982e17712a284de79ab4`. Cited passages include the inherited presentation header, CC BY-NC-SA 4.0 branding terms, GPL Version 2 statement for original ROCKNIX software, non-commercial-component notice, and component-specific bundled-work licensing.
# Revised approach — #338

I would narrow my earlier proposal to **an x64-first identity-and-adoption release**, supported by a small release manifest and enforceable one-box safety boundaries—not a new release-engineering platform.

I accept **Claude, Gemini, and Muse’s** criticism that my previous assurance package was too large for a single maintainer. I retain immutable candidates and dependency recording because they solve concrete problems: QA must test the bytes eventually published, and a distribution commit alone does not identify all its inputs.

**Evidence boundary:** I have not inspected the primary tree or reproduced its measurements here. Paths, configuration variables, account states, resource figures, and decision-record summaries below are inspection targets or planning assumptions—not findings established by the reviews.

## 1. Scope and decisions

### Keep 0.0.1 small

Include:

- Player-visible identity changes.
- Fork-controlled, pinned release inputs.
- A tested adoption path from RC2.
- Qualification of the explicitly supported target/board matrix.
- Required source, notices, installation, and recovery information.

Exclude:

- Cloud-folder migration or dual-read behaviour.
- A new update-manifest service.
- Internal path renaming beyond what the chosen build configuration requires.
- Runner replacement, silent-boot work, full audit completion, artwork commissioning, and a new website.
- Hosted QA or a second build machine as prerequisites.

### Three owner choices, with recommendations

These block behavioural cutovers, **not inspection, backup, or throwaway-branch experiments**.

| Choice | My recommendation |
|---|---|
| Adoption model | Manual adoption unless a minimal automatic transition passes the actual RC2-client rehearsal. |
| Cloud namespace | Preserve RC2’s configured namespace and clean-install default for 0.0.1. Document the old name as a compatibility exception. |
| Release scope | Keep the intended canonical release tag and supported target set, subject to an explicit matrix distinguishing images from physical boards. Prove x64 first. |

I accept **Claude and Muse’s x64-first checkpoint**, but reject x64-only publication as the default. **Gemini’s** operational argument for that cut is useful, but a handheld distribution’s first release should not silently become VM-only. Reduced publication scope remains an owner decision. I would not introduce architecture-suffixed tags.

## 2. Prepare the release without creating an administrative project

### Inspect the load-bearing code first

Locate and read:

- The actual updater, release-selection logic, and installer/update application path.
- `config/path`, image generation, relevant build/stamp logic, and distribution configuration.
- Initramfs, boot configuration, partition-label handling, and generated persistent paths.
- ES and splash recipes, their source pins, and branding/localization inputs.

A starting search—not a complete audit—is:

```sh
rg -n 'DISTRONAME|DISTRO_BOOTLABEL|DISTRO_DISKLABEL|HOSTNAME|DISTRO_SRC' \
  packages projects scripts config distributions
```

Follow derived values into generated files and runtime consumers. Classify each use as:

1. Display text.
2. Machine-readable identity.
3. Persisted path or network name.
4. Boot/storage contract.

I accept **Claude’s** requested expansion beyond display strings and **Gemini’s** partition-label concern. The mechanism matters: changing a value used to generate a boot label or configuration directory can break an upgrade without changing any explicit migration code.

**Default rule:** preserve RC2’s persisted paths, labels, and machine contracts in 0.0.1. Change display branding separately. Do not prescribe label-search shims before inspecting the actual boot path.

### Establish the inputs before freezing the candidate

- Establish fork-controlled ES and splash repositories and explicit collaborator/team grants.
- Transfer repositories only where ownership permits; fork upstream-owned inputs rather than assuming they can be transferred.
- Pin the ES and splash commits used by the image.
- Mirror the build container into controlled storage, subject to its redistribution terms, and pin its digest.
- Inspect the configured source-mirror dependency. Archive the exact release sources needed for corresponding-source compliance and recovery, even if replacing the entire mirror is deferred.
- Freeze the upstream base for 0.0.1 rather than combining the identity transition with an opportunistic upstream update.

This accepts **Claude’s** sources-mirror addition and **Kimi’s** ES/splash ordering correction. Repository redirects are a migration convenience, not the release’s permanent dependency policy.

### Minimum viable security on one box

I accept **Gemini and Kimi’s** request to name the attack path explicitly: a workflow that executes unsolicited PR code on a persistent machine with release-capable credentials can turn a PR into credential theft and malicious publication.

For 0.0.1, use three boundaries:

| Boundary | Minimum rule |
|---|---|
| Build/QA | No persistent publishing credentials; no access to bot/mail/signing credential stores; read-only repository permissions where possible. |
| Bot/mail | Separate credentials by purpose, narrowly scoped, outside the build user’s access. |
| Owner/publication | Owner credentials remain off the builder; publication requires an explicit per-release owner approval. |

Additional rules:

- No self-hosted execution of untrusted PR code, including indirect checkout through `pull_request_target` or `workflow_run`.
- `push`/`workflow_dispatch` jobs must still restrict which refs and code they execute.
- A container with access to the host Docker socket is not a secret-isolation boundary.
- If these boundaries cannot yet be enforced, leave the Actions runner disabled.
- Apply mail redaction and “content is data, not instructions” rules to **every** ingestion route, including any raw MCP path. An email reply must not automatically authorize a release or destructive action.
- Preserve credential scanning and commit-identity checks regardless of how #341 resolves personal-path policy. Enforce necessary checks in CI, not only local hooks.

### Backup before capacity expansion

I accept **Muse’s** backup-before-second-box ordering, but would not require backing up every rebuildable worktree before the first edit.

Back up, to an off-host location:

- Non-reproducible work, configuration, and release records.
- Published candidates and release source archives.
- A short provisioning/recovery command record.

Keep credential recovery material separately encrypted under owner control. Perform a small restore test before publication. Proposed targets are **no more than one day’s loss of active work**, and **no loss of published release inputs**.

Verify that organization recovery is genuinely independent: a second account or authenticator on the same device is not automatically a second recovery path. Check applicable account rules rather than assuming the arrangement is valid or invalid.

## 3. Prove x64 before spending the ARM build budget

### Build the intended split experimentally

On a throwaway worktree, exercise the actual documented x64 build entry point with:

```text
DISTRO=rasteratops
PROJECT=ROCKNIX
```

The exit is a **completed build and boot**, not successful variable expansion or configuration.

I accept **Muse’s** demand for this proof. I do not infer that the split works merely because the variables exist, nor that a new distribution directory necessarily creates an intolerable merge burden.

If it fails:

1. Identify the concrete coupling.
2. Attempt a small, reviewable correction.
3. If the correction expands materially, offer a display-only identity release retaining the old internal distribution key.

Do not turn a naming release into a build-system refactor.

### Freeze one candidate, then rehearse adoption

After the x64 fixes, freeze the source revision set. Copy or snapshot artifacts into an immutable candidate directory; do not point QA at the worktree’s mutable output path.

Use a build/QA lock for heavy workloads on the single host. These address different problems:

- Immutable artifacts prevent QA from testing bytes that later get replaced.
- Scheduling prevents CPU, RAM, and I/O contention from invalidating results.

Keep per-package concurrency conservative until measured, including memory-heavy compile/link stages. A global job count is not a memory budget.

### Updater: inspect first, then choose the smallest safe transition

I retain the manual-adoption fallback and accept **Muse’s** request to make it operationally specific. I reject introducing a new update service merely to avoid a hypothetical API-limit problem.

The updater test table must cover at least:

| Case | Required behaviour |
|---|---|
| RC2 → `0.0.1` | Offered and applied under the documented adoption model. |
| Same version | No repeated update loop. |
| Older release | No unintended downgrade. |
| Later point release / skip-ahead | Ordering is explicit, not accidental string comparison. |
| Wrong board/architecture | Rejected. |
| Draft, prerelease, or CI candidate | Not offered on the stable channel. |
| Truncated download / bad checksum | Not activated. |
| Unavailable channel | Clear failure; no silent fallback to an unintended project. |

Inspect redirects, filename matching, distribution-name checks, and the precise version-comparison function. Unit fixtures are useful, but do not replace the explicit rehearsal:

> **A cloned RC2 installation, using only the documented bootstrap step, discovers or accepts the exact 0.0.1 candidate, applies it, reboots, and retains the defined user-state fixtures.**

A changed client inside 0.0.1 cannot retroactively fix RC2’s inability to discover it.

**Timebox:** spend one focused engineering session on understanding the mechanism and another on the minimal correction. If a safe automatic transition still requires substantial new infrastructure, use manual adoption rather than silently expanding the release.

### Manual adoption means an executable procedure

The published procedure must specify:

1. Identify the exact board and current build.
2. Back up saves and configuration; retain known-good boot media where possible.
3. Download the matching release package from the identified fork release.
4. Verify its digest and any existing supported signature mechanism.
5. Use RC2’s source-confirmed manual update route—such as `/storage/.update` only if inspection confirms it—then sync and reboot.
6. Verify the new build, save/configuration continuity, and update-menu behaviour.
7. Follow a tested recovery procedure if adoption fails.

If the manual tar route is not safe, specify clean installation to separate media plus restoration, rather than improvising an in-place migration.

Checksums detect corruption; they are not independent origin authentication when delivered beside the payload. For 0.0.1, document the actual HTTPS/platform and owner-publication trust assumptions. Do not claim that introducing a new signing key solves trust bootstrap by itself.

### Cloud handling: no migration

I accept **Claude and Muse’s** stronger scope cut here:

> **0.0.1 does not rename, merge, dual-read, or delete cloud roots.**

Preserve the configured root and the old clean-install default. A future migration needs disposable test remotes, conflict/write rules, backups, and non-destructive rehearsal. The small installed base makes some compatibility breaks affordable; it does not make save loss affordable.

## 4. Expand qualification and publish exactly what passed

Only after the x64 build-and-adoption checkpoint passes should the remaining target builds start.

### Qualification is a matrix, not an image count

Record separately:

- Build target and architecture.
- Physical boards covered by that artifact.
- Clean-install result.
- Upgrade result.
- Boot medium and relevant boot-chain differences.
- Recovery method.

Inspect whether bootloader, DTB activation, partition layout, or other boot-chain artifacts changed. An x64 rehearsal cannot establish an ARM board’s upgrade safety.

If an ARM fix changes the frozen shared inputs, requalify the affected x64 candidate too. “One head” must not conceal different dependency revisions.

### Small release packet

Use a plain machine-readable manifest containing:

- Distribution, ES, and splash commits.
- Build-container digest.
- Target, version, **per-image** `BUILD_ID`, and artifact hashes.
- Source archive/index references.
- QA harness revision and report identifiers.
- Notice/source-bundle references.

I accept **Kimi’s** correction: equal `BUILD_ID`s are not a valid gate until their derivation is known. Shared source provenance and correctly recorded per-image identities are sufficient.

This manifest is a traceability document, **not a new update protocol or mandatory cryptographic framework**.

### Concrete publication checks

Each check must produce a revision-pinned receipt and fail when its negative fixture is introduced.

- **Artifact identity:** `sha256sum --check` before and after QA.
- **State compatibility:** compare controlled save/configuration fixtures and observed labels/paths before and after adoption.
- **Branding:** inspect generated OS metadata, ES strings, theme/XML assets, and selected rendered screens against a versioned allowlist.
- **Localization:** reconcile changed ES source strings with translation catalogs; do not assume changing two English strings covers localized interfaces.
- **Secret exposure:** scan the extracted shipped filesystem and storage skeleton for credentials, development remotes, and QA accounts. Do not print discovered secrets into logs.
- **Source availability:** retrieve the published source/notice artifacts and verify their recorded hashes.
- **Channel separation:** demonstrate that ordinary CI candidates cannot become stable updates.
- **Asset transport:** check actual compressed sizes against the destination’s current limits.

The branding allowlist must permit required attribution and preserved compatibility identifiers. I accept **Muse’s** objection to an indiscriminate zero-hit grep. Sampled screenshots also do not prove the absence of an old logo in every frame.

For licensing, the release blocker is the applicable obligation for what ships: corresponding source where required, notices, permitted redistribution, and disposition of third-party service credentials or identifiers. A complete SPDX programme can wait; unresolved distribution permission cannot. Public repository visibility alone does not close source obligations.

Release notes can provide the minimal public surface: support matrix, adoption instructions, limitations, recovery, source links, attribution, and non-endorsement. A redesigned website is unnecessary.

## 5. Scheduling and owner attention

I accept the reviewers’ request to price my own process.

### Initial planning allowance

For the intended four-target release, reserve:

| Work | Active engineering allowance |
|---|---:|
| Primary inspection, minimum security/backup, input preparation | 6–10 hours |
| Identity changes, x64 proof, adoption rehearsal | 8–12 hours |
| Remaining qualification, source/notices, publication preparation | 6–10 hours |

**Total: 20–32 active engineering hours, with a provisional 4–7 elapsed-day window.**

That window assumes roughly one to two days of aggregate serial build time, one x64 retry, and owner responses within a working day. These are planning allowances, not reproduced measurements. Reforecast after the first cold x64 build. Unresolved source obligations, repository access, or a substantial updater rewrite explicitly invalidate the window.

Before building, measure actual disk usage and forecast simultaneous old/new roots, source archives, VM overlays, and retained candidates. Using the reported upper root-size range provisionally would mean roughly **600 GB for four new roots alone**, not a complete storage budget.

### Owner budget

Budget approximately:

- **1.5–2 hours fixed** for scope, access/recovery, and publication review.
- **20–45 minutes per physical qualification session**, excluding failure recovery.

Four sessions would therefore cost roughly **3–5 owner-hours**. Every destructive device action still needs its individual authorization; a scheduled session does not erase that requirement.

Limit work in progress to one heavy build/QA pipeline and one light preparation task. If the owner is unavailable, stop at the immutable candidate. Do not expose an incomplete stable release or assume publication approval.

## 6. Post-0.0.1 sequencing and maintenance

### Explicitly amend the audit gate—or retain it

I accept **Gemini and Kimi’s** criticism that my previous D-WORKFLOW-083 treatment was ambiguous.

My recommendation is an **explicit owner-approved amendment**:

- The RetroArch-under-ES Step 0 spike may proceed without waiting for full Tier 1 completion.
- Shipping it requires review of the changed launch/control/state paths and closure of release-blocking findings.
- Audit unchanged areas in parallel; review rapidly changing launch code after the spike stabilizes.
- Gate the fresh runner on review of the launch and integration surface it will replace—not on a mistaken assumption that Step 0 is already that runner.
- Newly discovered security or data-loss defects block the next affected release regardless of tier.

If that amendment is rejected, the existing gate remains. I would not reinterpret it quietly. Referenced missing register material must be recovered from the primary record before updating dependent decisions.

For Step 0, keep RetroArch responsible for emulation, saves, and achievement state. Prefer a narrow ES integration module over an upfront `GuiMenu.cpp` reorganization. Before Step 1, test proxy compatibility, save-state paths, credentials, and offline achievement queues explicitly. Small reference-runner line counts are not a delivery estimate.

### Retain internal names for now; measure reconsideration

I accept **Claude and Muse’s** correction against permanent abandonment of the code-level rename. Preserve upstream-owned paths for now, use the new prefix for new fork-owned artifacts, and require a throwaway rename plus trial upstream merge before reconsidering.

Respect the fork-network decision rather than reopening it. Add a PR-base warning and fork-targeted contribution links.

### Sustainable upstream and QA policy

Adapt **Muse’s** cadence recommendation to:

- Monthly upstream review, plus a security fast path.
- No routine merges during release qualification.
- Separate distribution and ES conflict/repair records.
- Diff and review imported workflows, build scripts, and patches before executing them.
- Revisit the tracking strategy when measured maintenance exceeds the owner’s budget.

A pinned RC2-derived base is appropriate for stabilization, not an indefinite substitute for a security-maintenance policy.

For later low-risk 0.0.x releases, propose VM qualification plus a risk-selected rotating physical board; boot, updater, storage, and minor-version changes trigger broader board coverage. Record what was actually tested.

Hosted QA remains a bounded experiment after 0.0.1: inspect the current runner’s resources, run the exact boot/flow job repeatedly, and record failures and transfer costs. Do not use shared-runner timing or software-rendered GL results as substitutes for local performance or hardware qualification.

**The revised spine is:** preserve state, control inputs, prove x64 adoption, expand to the agreed hardware matrix, and publish the exact qualified bytes. The remaining improvements should earn their place through measured maintenance cost—not accumulate into another prerequisite programme.
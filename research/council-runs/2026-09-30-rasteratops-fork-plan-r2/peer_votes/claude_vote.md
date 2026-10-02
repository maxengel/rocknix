# Vote: **GPT**

## Why GPT's plan is strongest

I'm judging each plan as a proposal for how to ship a fork-identity release from one build box, for four boards, by one maintainer — and asking which plan a maintainer could actually follow without either stranding devices or turning a rename into a platform project.

**1. Every branch has a declared fallback and a stopping rule.** This is the property that matters most for a one-person project, and GPT's plan has it at every fork in the road: if the `DISTRO≠PROJECT` build fails → identify the coupling, attempt a small fix, else ship display-only under the old distribution key; if the RC2-client rehearsal fails → manual adoption with an *executable* seven-step procedure, not an aspiration; if the credential boundaries can't be enforced → the Actions runner stays disabled; if the owner is unavailable → stop at the immutable candidate, never expose a half-release. A plan that names its degraded modes in advance is one that won't improvise a migration at 2 a.m.

**2. It identifies the correct failure mechanism for the rename.** The four-class taxonomy (display text / machine-readable identity / persisted path or network name / boot-storage contract) is the right way to read a `DISTRONAME` grep. The insight that a derived value can break an upgrade "without changing any explicit migration code" is exactly why the default must be *preserve every RC2 contract in 0.0.1* — and GPT correctly refuses to prescribe label-search shims before the boot path has been read.

**3. The updater treatment is the most complete and the most honest.** The test table covers same-version loops, unintended downgrade, skip-ahead ordering, wrong board, draft/prerelease leakage, truncated download, and unavailable channel. It distinguishes unit fixtures from the one rehearsal that actually matters (a cloned RC2 install, using only the documented bootstrap step, is offered and applies the exact candidate). And it states the thing that kills wishful thinking: a fixed client *inside* 0.0.1 cannot retroactively teach RC2 to discover it. The timebox (one session to understand, one to fix minimally, then manual) is what keeps this from swallowing the release.

**4. Security is scoped to what one box can enforce.** It names the attack path (PR code on a persistent machine with publishing credentials → credential theft → malicious publish), sets three boundaries with minimum rules, catches the indirect checkout routes (`pull_request_target`, `workflow_run`), states that a Docker-socket container is not a secret boundary, and applies "content is data, not instructions" to *every* mail ingestion route. None of that is an eight-phase program; it's an afternoon plus discipline.

**5. Backup precedes capacity expansion, with a restore test.** Concrete loss targets (≤1 day of active work, zero loss of published release inputs) and a check that org recovery is genuinely independent — a second account on the same device is not a second recovery path.

**6. Qualification is a matrix, and "one head" is not allowed to hide different inputs.** The rule that an ARM fix touching frozen shared inputs requalifies the x64 candidate too closes a real hole in the "build four from one commit" story.

**7. Publication checks each carry a negative fixture.** Artifact identity, state compatibility, branding against a versioned allowlist, l10n reconciliation, secret exposure without logging the secret, source availability, channel separation, asset transport limits — and each check must fail when its negative fixture is introduced. Licensing is narrowed to what actually ships.

**8. It prices its own process** in engineering hours, owner hours per qualification session, a WIP limit, and a disk forecast, and labels all of these as planning allowances to be reforecast after the first cold build.

**9. It freezes the upstream base** rather than combining the identity cutover with an opportunistic upstream merge — a small rule that prevents a very common way identity releases become stabilization releases.

**10. It does not quietly reinterpret the audit gate.** Explicit owner-approved amendment or the existing gate stands.

## Where GPT is weakest

- It is policy-shaped rather than runbook-shaped. The repository-topology ordering (ES fork controlled *before* the image build, because the two player-visible strings live in ES source; splash forked, not transferred) is present but underemphasized relative to its position on the critical path.
- The "~600 GB for four new roots" figure is speculative even when flagged; it should be a `du` inspection task, not a number.
- The default is to *try* the `DISTRO=rasteratops` split and fall back to display-only. On the merits I think that's inverted: for an identity release, retaining `DISTRO=ROCKNIX` and changing `DISTRONAME` inside the existing directory is the strictly smaller change with the smaller recurring merge surface, and the split has no concrete 0.0.1 payoff. Display-only should be the default; the split should be the opt-in throwaway experiment. (Gemini and Kimi land closer to this; Kimi's §2.2/§2.5 is internally muddled on it, since `DISTRO=rasteratops` implies a new directory.)

## Dissent notes — primitives the winner does not fully absorb

**From Muse:**
- *Runnable exits with receipts.* Muse's phase exits are artifacts, not assertions: a `docker inspect`/build-log line showing the pinned digest was actually consumed, a trigger dry-run proving PRs don't reach the self-hosted runner, a recorded backup snapshot ID, a VM boot PASS *bound to an image digest*, the explicit PASS sentence "RC2 guest offered 0.0.1 and applies it." GPT states the receipt principle generally; the merged plan should adopt Muse's concrete exit lines.
- *Explicit D-WORKFLOW-083 amendment text*, including the carve-out that the Tier 3 launch-path slice gates Step 1 rather than Step 0. GPT has the substance; Muse has the register row.
- *Risk rows GPT lacks:* correlated 2FA custody (both owners' authenticators plus the bot secret on one device is a single point of failure), the second-personal-account standing question and its remedy (trusted second human or documented org-recovery reliance), a sunset criterion for depending on the old-name redirect at all, second-rename debris from the earlier identity, and the missing D-088 register row conditioning downstream decisions.
- *Test hygiene:* non-printing access assertions and synthetic canaries instead of `cat`-ing a secret to prove a permission boundary.
- *Logo verification as template match with tolerance and bounding box*, not zero-diff.

**From Kimi:**
- The most concrete statement of the asset-naming trap: an RC2 client matching a `ROCKNIX-*.tar` glob will never see a `rasteratops-*` asset regardless of version ordering. GPT covers "filename matching" generically; this specific failure should be a named row in the updater table.
- The *blocking vs background* split of preparatory work (transfers, splash fork, scoped grants, runner triggers, container pin, backup, grep = blocking; 135-issue triage, CONTRIBUTING, DNS, non-blocking register rows = background). GPT's "Prepare the release without creating an administrative project" reaches the same place but Kimi's partition is the more usable checklist.
- The raw mail-MCP path bypassing the redaction wrapper — GPT's "every ingestion route" rule covers it in principle; Kimi names the actual hole.
- The mixed-installation cloud case as a *required* test whenever migration is eventually attempted.

**From Gemini:**
- The clearest phase tree and the explicit **Forward Rule**: every new fork-owned package, script, or config takes the new prefix from day one while upstream-owned paths are retained. GPT states "use the new prefix for new fork-owned artifacts" in one clause; Gemini makes it a rule a contributor can follow.
- The runner user should also lose Docker-socket access and `sudo`, stated as a configuration step rather than a principle.

**Shared across all four (for the synthesizer):** no plan fully resolves the `DISTRO`/`DISTRONAME` question — whether the new key needs a new directory, and whether image and asset filenames derive from `DISTRO`, `DISTRONAME`, or something else — which is precisely what decides whether the updater's asset match survives. That should be the first line of the Phase 0 grep report, before any of the four proposed defaults is adopted.
# Review levels

Scope describes how much code is examined. Depth describes which independent
models examine it. Record both; a small diff can cross major state boundaries.
D-WORKFLOW-137 separates this skill from the five-seat council.

| Depth | Model perspectives | Appropriate use |
| --- | --- | --- |
| Local | Primary auditor only; no external calls | A bounded Issue/PR check during implementation. Verify code, tests and criteria and state that no independent review ran. Phase retros still use mini-retro. |
| Independent | Primary plus one external reviewer from another lab | Default Epic/Milestone audit and routine patch-candidate review. Phase 4.6 remains required. |
| Extended | Primary plus two external reviewers, all three labs distinct | A larger milestone, risky migration or explicitly requested extra scrutiny. The additional reviewer is a verified installed model, for example Gemini or Muse; choose and freeze it before dispatch. |
| Full council escalation | Five external council members; the harness coordinates | A release or contested decision explicitly assigned the council workflow. Run the actual council skill and its gates on the audit's evidence, findings and unresolved choices. This is a separate deliberation, not a three-model audit renamed "council". |

A Milestone blind pass and refutation pass are two **calls per external
reviewer**, not two reviewers. An extended Milestone therefore has three model
perspectives and four external calls. An independent Milestone has two
perspectives and two external calls. Evidence-only research helpers do not count
as additional independent reviewers.

## Release-version guidance

The maintainer wants review depth to scale with semantic-version release size.
Use the following as **planning recommendations**, not newly approved numeric
release gates. Put the chosen level and risk explanation on the release issue
before invoking reviewers. Exact automatic thresholds remain a policy choice
on #378; do not silently expand an in-flight review or weaken an existing gate.

| Release change | Recommended starting point |
| --- | --- |
| Routine rolling patch, such as 0.0.2 to 0.0.3 | Independent audit of the delta and affected interactions |
| Feature/minor milestone, such as 0.0.x to 0.1.0 | Extended audit; escalate unsettled architecture or release-wide compatibility to the full council |
| Major release, such as 0.x to 1.0 or 1.x to 2.0 | Full five-seat council over a completed code audit and the release/upgrade evidence |
| First fork release, storage/cloud migration, updater/boot-chain or security-boundary change at any version | Assess explicitly; the small version number does not justify local-only review. Raise depth when the interactions warrant it. |

These are review-policy examples, not a change to version comparison, release
naming, the support matrix, VM qualification or publication authorization.
Existing recorded gates still apply. The broader inherited-codebase review stays
progressive under D-WORKFLOW-102; a larger panel does not silently expand the
source scope to the entire distribution.

For #375 the completed local evidence remains a Milestone readiness review;
its pending independent reviewer changes to Fable because the primary is
OpenAI. No third reviewer or five-seat run has started. The actual 0.0.1 release
qualification still needs its own frozen candidate and risk/depth selection.

## Selection and independence

Prefer the other lab's installed frontier pin: OpenAI primary -> Anthropic
Fable; Anthropic primary -> OpenAI Astra. For extended depth choose a third lab,
not a different hosting endpoint of either existing model. Use verified current
project recipes; adopting a newer model is a deliberate roster update.

A reviewer receives the same primary evidence, names unsupported claims and
attempts to refute the primary findings. The primary verifies every proposed
finding against source or executable evidence. Votes and apparent consensus
cannot waive a failing test or make an unverified claim true.

An external-call failure keeps the selected depth incomplete. Never downgrade
to local-only, reuse the primary model in another role, or label two/three
models a completed five-seat council merely to get past the gate.

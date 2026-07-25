---
name: code-auditor
description: Rigorous multi-pass code auditor that independently verifies spec conformance, acceptance-criteria completion, cornerstone (grounding-rubric) alignment, cross-system interaction safety, and code quality. Runs at Epic and Milestone boundaries; the phase-tier scoped audit (spot checks, ~30 min) lives in the `mini-retro` skill and its findings feed this skill. Use when the user says "audit this work", "audit the milestone", "verify X is done", "is this really complete", "check for gaps", "run a code audit", "produce a punch list", or when a feature/epic/milestone is claimed complete and needs adversarial verification before merge or deploy. Produces dated audit artifacts (running log at milestone tier, research, forward audit, retrospective, analysis, punch list with machine-readable index) plus a GitHub issue with the prioritized punch list.
license: Apache-2.0
metadata:
  execution: serial
  version: 1.7.0
  origin: 'Imported from birdwork-preflight .claude/skills/code-auditor; adapted for scaffold (bedrock→cornerstone; foreign refs softened). v1.7 platform-probe evidence floor adapted 2026-07-10 from birdwork/birdwork@e0ff051.'
---

# Code Auditor

Rigorous, independent, adversarial verification of completed work. **Not** a helpful code reviewer offering feedback — a second engineer independently proving that work was completed correctly, completely, and in conformance with the plan.

**Assume nothing is done until proven done.**

## Execution discipline — SERIAL (hard gate)

This skill is **stage-gated**: every stage consumes the *settled* output of the stage
before it. Run stages **strictly in order, under ONE orchestrator, never in parallel**
— fanning stages out to concurrent agents/sessions voids the guarantees (origin:
2026-07-08, an agent parallelized a code-auditor run). In-stage sub-agents are allowed
only where a stage explicitly says so. Swarm rule: while this skill is active on a
scope, other agents pause mutations on that scope until it completes
([serial-execution-gates](../../../.github/instructions/serial-execution-gates.instructions.md)).

## Scope tiers

This skill operates at two of the three retro+audit tiers. The third
(Phase-tier) lives in the `mini-retro` skill as a lightweight
scoped-audit step and feeds upward into this skill.

| Tier          | Audit surface                                 | Skill                            | Artifact                                |
| ------------- | --------------------------------------------- | -------------------------------- | --------------------------------------- |
| **Phase**     | 5 spot checks inline in each phase retro      | `mini-retro` (Step 2.5)          | Retro comment § "Scoped audit findings" |
| **Epic**      | Full 6-phase methodology over Epic scope      | **this skill** (Epic scope)      | `logs/audits/YYYY_MM_DD-epic-*/`        |
| **Milestone** | Full 6-phase methodology over Milestone scope | **this skill** (Milestone scope) | `logs/audits/YYYY_MM_DD-milestone-*/`   |

**Tier posture differs by scope.** Epic and Milestone tiers consume
lower-tier findings differently — and the difference is intentional:

| Tier          | Posture toward prior audits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Why                                                                                                                                                                                                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Epic**      | **Consolidating, with a spot re-verification quota.** Reads every phase retro's scoped-audit section as a primary input and builds on those findings; adds Epic-level cross-cutting analysis (interaction defects between phases, four-surface parity, missing artifacts, spec drift across the Epic). Before consolidating, re-derive at least 2 randomly-chosen consolidated PASS findings from primary sources; if either disagrees with the retro, the trust posture is void for that retro and its findings are fully re-derived. | An Epic is small enough that re-deriving every phase finding is wasteful — but un-sampled trust is how tracker-state evidence creeps in. The quota verifies the feed without redoing it.                                                                                                                        |
| **Milestone** | **Primarily independent re-audit, prior audits as ONE input.** Re-derives findings from spec + code + git history with the full milestone in view. Reads prior Epic audits and phase retros to (a) verify their findings still hold, (b) catch gaps they missed, (c) surface cross-Epic patterns.                                                                                                                                                                                                                                      | A Milestone is large enough that the end-to-end view sees things no per-phase audit could (cross-Epic interaction defects, drift between Epics, capability gaps, accumulated tech debt). The lower-tier audits are valuable corroboration but not substitutes for fresh adversarial verification at full scope. |

**Milestone-tier independence rules:**

- Phase 2 (Forward audit) re-evaluates every spec acceptance criterion
  from primary sources (spec text + code + tests). It does **not**
  copy verdicts from prior audits — and to make that real rather than
  aspirational, prior per-AC verdicts are **sequestered**: Phase 1.5
  builds a provenance/coverage map WITHOUT transcribing PASS/FAIL
  verdicts, and prior verdicts are opened only in Phase 2.5, AFTER
  the independent verdict for that criterion is already written to
  `02-forward-audit.md` (the document-as-you-go cadence makes the
  ordering auditable). If they disagree, document both verdicts and
  reason about why (the prior audit may have been wrong, or the code
  may have regressed since) — disagreement is a finding, not an
  error. Where feasible, run Milestone audits in a fresh session that
  did not implement the work being audited.
- Phase 3 (Retrospective) explicitly looks for **cross-Epic
  interaction defects, drift, and capability gaps** that no
  single-Epic audit could see. This is the milestone tier's primary
  value-add over consolidation.
- Prior audits feed Phase 1 (Research) — not as gospel, but as a
  **provenance map**: who audited what, what they found, what
  they deferred. Use this to know where extra adversarial scrutiny
  is warranted (e.g., "prior audit returned all-PASS in 30 minutes
  on a 500-line PR — re-verify carefully").
- Prior-audit punch-list items still open at Milestone close-out
  must be tracked and either (a) verified resolved by code, (b)
  carried into the Milestone punch list, or (c) explicitly marked
  deferred-to-next-milestone with rationale.

**Tier B (design-review) findings — only if the repo has a design-review /
visual-QA process.** scaffold has none today, so skip this unless one is
present. Where present: phase retros record Tier B verdicts and any deferred
visual-QA items; both Epic and Milestone audits aggregate them into a single
visual-QA section of `04-analysis.md` and roll remaining blocker/major/deferred
items into `05-punch-list.md`. Do **not** re-run page-scale design reviews from
scratch at either tier — but at Milestone tier, do run fresh reviews for any UI
surface that gained material changes after its phase's retro signed off, AND for
any cross-page flow that wasn't reviewable at phase scope.

This means: Phase-tier scoped audits ARE required inputs (don't redo
them at Epic tier). Epic audits ARE inputs at Milestone tier — but the
Milestone audit has its own primary lens and produces findings the
lower tiers structurally couldn't.

## Evidence floor (all tiers)

Three hard rules apply to every verdict at every tier:

1. **Tracker state is never sole evidence.** Issue state, checked AC
   boxes, and retro summaries may corroborate but can never be the
   ONLY evidence for a PASS — every PASS cites at least one primary
   artifact (file:line, executed command output, or commit diff).
   "The issue is closed" is the banned anti-pattern, not evidence.
2. **Mechanical evidence outranks reading.** Where an AC is enforced
   by an existing mechanical check (a vitest suite, `npm run check`,
   `scripts/lint-public-surface-parity.ts`, `kno:validate`,
   `validate-tier-parity.sh`, …), RUN the enforcing command and
   record exit status + counts in the criterion entry. Reading the
   lint's source is insufficient when the lint itself can be run.
   **Platform claims are mechanically checkable:** when a verdict depends
   on a possibility.space API, route, MCP surface, or verb, RUN
   `node scripts/pspace-probe.mjs verb <path> <METHOD> --api <api-name>`
   with the exact verb. Treat manifest evidence as API-advertisement-only and
   the MCP phase as protocol evidence only (initialize, `tools/list`,
   `tools/call`). Catalog content is a **human-inspection lead, never machine
   evidence** for presence, absence, or verb support; the helper reports
   `comparison=manual-required`. The runtime exact-verb result is authoritative.
   A prior probe summary or transcript is insufficient; the auditor re-runs the
   probe and records statuses + request IDs.
3. **Subagent output is a LEAD, never EVIDENCE.** Per scaffold's development
   principles ("Verify sub-agent outputs against primary artifacts" — cornerstone
   ORC-5): every fact that supports a verdict must be re-read directly from the
   primary artifact before the verdict is written. Fan out subagents for research;
   verify their leads yourself. For platform findings, verification means the
   orchestrator runs the exact-verb, multi-surface probe itself.

## When to use

Trigger on any of:

- "Audit this milestone / epic / issue / feature"
- "Verify X is done" / "Is this really complete?"
- "Check for gaps" / "produce a punch list"
- Before merging a feature branch that implements a product spec
- After a complex multi-session implementation to ensure nothing was lost
- When the user suspects work was claimed as done but wasn't fully completed
- Pre-deploy verification for high-risk changes
- Scope drift detection on an in-flight issue chain
- End of Epic (default — consolidates phase-retro scoped audits and
  adds Epic-level cross-cutting analysis)
- End of Milestone (default — primarily independent re-audit at full
  milestone scope; uses prior audits as one input among many to
  verify and to focus extra scrutiny where prior coverage was thin)

**Not** for per-phase audits — those live in `mini-retro` Step 2.5
(see `mini-retro/references/scoped-audit.md`). If you find yourself
tempted to invoke this skill at every phase boundary, the scoped
audit is what you actually want.

## Critical protocol: document-as-you-go

**NEVER batch analysis without writing findings to disk between each step.**

| Why                                                   | What happens if skipped                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Context windows compact — unwritten findings are gone | Audit restarts from zero on compaction                            |
| Audits must be reproducible                           | No trace of what was examined, when, or why a verdict was reached |
| The notes are the deliverable                         | Opinions without evidence don't satisfy an audit                  |

**The cadence:** `READ source → WRITE finding → REPEAT`. If you read something and don't immediately write your observation, you are violating the protocol.

## Audit lifecycle (phases 0–7)

Execute in order. Phases 0–5 each produce or extend an output file;
phases 6–7 close the loop into the tracker.

| Phase | Name                            | Output                                | Detail                                                     |
| ----- | ------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| 0     | Setup                           | `00-running-log.md` (milestones only) | Phase 0 below                                              |
| 1     | Research                        | `01-research-notes.md`                | [`references/phases.md` § Phase 1](references/phases.md)   |
| 2     | Forward audit                   | `02-forward-audit.md`                 | [`references/phases.md` § Phase 2](references/phases.md)   |
| 2.5   | Verdict cross-check (Milestone) | appended to `02-forward-audit.md`     | [`references/phases.md` § Phase 2.5](references/phases.md) |
| 3     | Retrospective                   | `03-retrospective.md`                 | [`references/phases.md` § Phase 3](references/phases.md)   |
| 4     | Synthesis                       | `04-analysis.md`                      | [`references/phases.md` § Phase 4](references/phases.md)   |
| 4.5   | Finding verification            | appended to `04-analysis.md`          | [`references/phases.md` § Phase 4.5](references/phases.md) |
| 5     | Punch list                      | `05-punch-list.md` (+ YAML index)     | [`references/phases.md` § Phase 5](references/phases.md)   |
| 6     | Punch-list issue                | GitHub issue (`audit`, `punch-list`)  | Phase 6 below                                              |
| 7     | Resolution gate                 | recorded outcome per item             | Phase 7 below                                              |

Before Phase 6, if the repo provides an artifact-contract lint (e.g. a
`lint-audit-artifacts` script), run it over the audit folder. scaffold has none
today, so verify the artifact contract (required files, mandatory sections,
verdict vocabulary, punch-index schema) manually.

**Load [`references/phases.md`](references/phases.md) before executing each phase.** It contains the full procedure, criterion-entry format, evidence-source mapping, and checkpoint summaries. The SKILL.md body is the shape; `phases.md` is the spec.

---

## Phase 0 — Setup

Create the dated audit folder before any analysis:

```
logs/audits/YYYY_MM_DD-{scope}-{item-name}/
├── 00-running-log.md           ← milestones only (append-only flight recorder)
├── 01-research-notes.md
├── 02-forward-audit.md
├── 03-retrospective.md
├── 04-analysis.md
└── 05-punch-list.md
```

### Naming convention

- `{scope}` — one of `milestone`, `epic`, `issue`
- `{item-name}` — kebab-case descriptor with ID

| Scope     | Example                                            |
| --------- | -------------------------------------------------- |
| Milestone | `2026_04_22-milestone-41-design-patterns-adoption` |
| Epic      | `2026_04_22-epic-platform-capability-system`       |
| Issue     | `2026_04_22-issue-1634-troubleshooting-animation`  |

Create `logs/audits/` if missing.

### Milestone audits: running log is mandatory

**When `{scope}` is `milestone`, you MUST also create `00-running-log.md` at the start of Phase 0 and append after every meaningful action.**

Why:

- Milestone audits span multiple epics, many issues, dozens of commits — context compaction is nearly guaranteed
- Phase files (01–05) organise by phase; a single chronological log preserves connective tissue across phases
- If the audit "crashes" (compaction, interrupt), the running log is what gets recovered and resumed

**Running log format** (append-only, newest at bottom):

```markdown
# Milestone Audit Running Log — [Milestone Name]

**Auditor:** Code Auditor skill
**Started:** YYYY-MM-DD HH:MM
**Scope:** Milestone N — [title], Epic(s) #NNN, Issues #XXX–#YYY
**Spec:** [path(s)]

---

## Log Entries

### [Phase N.M] HH:MM — Short descriptor

[What was read/examined]
[Key finding, with file/line reference]
[Verdict or next step]
```

Entries are short (3–10 lines). Depth goes in the phase files; the log's value is **continuity**. Treat it as a flight recorder.

### Phase file header (apply to every phase file)

```markdown
# [Phase Name] — [Item Being Audited]

**Auditor:** Code Auditor skill
**Date:** YYYY-MM-DD
**Subject:** [Issue/Milestone/Spec being audited]
**Spec:** [Path to the driving spec]

---

## Running Notes
```

---

## Tool usage rules

| Tool                                       | Guidance                                                                                                                                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GitHub reads** (issues, PRs, milestones) | Prefer the GitHub MCP issue/search tools (names vary by runtime — `mcp__github__*` in Claude Code, `mcp_github_*` in Copilot). Avoid `gh` CLI for list/search — bulk output has destabilised agent runners in this repo. |
| **`gh` CLI for writes**                    | Acceptable for `gh issue create` (body-file), `gh label create`, `gh milestone create` — single-record writes. **Always use `--body-file`**, never heredoc (per repo `agent-terminal-safety` instructions).              |
| **`gh` CLI list/search fallback**          | If MCP is unavailable, bound output: `--limit N --json <fields>` or pipe through `\| head`.                                                                                                                              |
| **Git history**                            | `git log --oneline`, `git diff --stat`, `git show <sha>` — standard. Filter by date, path, author.                                                                                                                       |
| **Terminal operations**                    | Never delegate `git`, `npm`, `gh` to subagents — subagents do not inherit terminal access. Run directly.                                                                                                                 |
| **Subagent tool**                          | Useful for parallel read-only investigation. Not for terminal ops. Subagent output is a LEAD, never EVIDENCE — re-read every verdict-supporting fact from the primary artifact yourself (see Evidence floor rule 3).     |

---

## Verdict vocabulary (used in Phase 2 forward audit)

Every acceptance criterion gets one of:

| Verdict          | Meaning                                                    |
| ---------------- | ---------------------------------------------------------- |
| **PASS ✓**       | Criterion fully met with evidence                          |
| **PARTIAL ⚠**    | Criterion partially met, gaps identified                   |
| **FAIL ✗**       | Criterion not met                                          |
| **SKIP ○**       | Criterion explicitly deferred or descoped (document where) |
| **UNTESTABLE ?** | Cannot verify (explain why)                                |

Each verdict entry must include: evidence (file:line), notes, and gaps (if PARTIAL or FAIL).

See [`references/templates.md`](references/templates.md) for the full criterion-entry format.

---

## Cornerstone conformance (applied in Phase 3)

Every audit grounds the work against scaffold's **cornerstone** rubric. Run the conformance face — [`cornerstone-conformance.md`](../../../docs/architecture/cornerstone-conformance.md) — marking each relevant row ✓/⚠/✗/·:

- **Doctrine (PD + DOC-1…10)** — the prime directive + ten guiding principles
- **Accepted-ADR conformance** — does the work respect every Accepted ADR?
- **Development principles (QE / SEC / OPS / MET / REV / ORC / SCO)** — the engineering baseline
- **Capability authoring (conditional)** — `.kno` REQ/PRO rules apply only when authoring a Capability against the Platform Capability spec

Cornerstone evaluation is not a rubber stamp. Each row is individually evaluated for relevance and conformance; the authorities (doctrine + Accepted ADRs + development-principles) win if the table drifts.

---

## Cross-system interaction audit (Phase 3, step 3.5)

**Catches interaction defects** — where two subsystems each work correctly in isolation but fail at their intersection. These are the most dangerous class of bugs because single-subsystem testing cannot find them.

For each subsystem touched:

1. **Identify interacting subsystems** — what shares state, resources, or timing? Consult the repo's shared-state register if one exists (scaffold's canonical conventions live in `.github/instructions/`; there is no separate shared-state register yet).
2. **Check for runtime-state assumptions** — config reloads that destroy in-memory state, container restarts that reset ephemeral data, deploys that run multiple instances simultaneously, background tasks (pollers, crons) that conflict across instances.
3. **Verify intersection testing** — was the combination specifically tested? Not "A works" and "B works", but "A works while B is also happening."
4. **Check knowledge propagation** — did the implementer consult docs in the **interacting** subsystem, not just the one changed?

Common risky pairs are in [`references/phases.md` § Phase 3.5 interaction table](references/phases.md).

---

## Build-vs-adopt verification (Phase 3, step 3.5.5)

Verifies the **adopt / extend / contribute-before-build** discipline (doctrine
§1 pSpace-first; development-principles "Prefer adopt / extend / contribute
before building"). **Applies only if the repo maintains a build-vs-adopt
register** — scaffold does not yet, so treat this as advisory until one exists.
The phase-tier honor check (`mini-retro` scoped-audit, if present) verifies one
phase; this step adversarially verifies the whole scope — both that the question
was **answered** and that the answer was **honored**. (Numbered 3.5.5 to slot
between the cross-system audit and `references/phases.md` § 3.6 "What's missing?".)

For every spec / Epic in the audit scope that shipped net-new platform
behavior, a new integration/surface, or a new primitive:

1. **Answered?** The spec carries a `## Build-vs-Adopt` section and a
   corresponding row exists in the repo's build-vs-adopt register. A governing
   spec with neither → FAIL finding (punch-list item: backfill the answer).
   Specs predating the register get a PARTIAL with a backfill note, not
   a FAIL.
2. **Honored?** Compare recorded path vs. shipped reality across the
   scope's commits:
   - **Adopt** recorded but bespoke code shipped → FAIL.
   - **Build** recorded without the required adoption survey (named
     standards evaluated + disqualifying gaps) → FAIL.
   - **Extend** recorded but the upstream gap was never filed → PARTIAL.
   - Mid-scope reversal without a new register row → PARTIAL (append
     the row; rows are append-only).
3. **Theatre check.** A scope where every answer is "build" with thin
   rationale is a signal the question is being performed, not asked —
   flag it in the synthesis report even if each row technically passes.

Findings land in the Phase 4 synthesis report and the Phase 5 punch
list like any other conformance finding. Evidence-floor rules apply:
the register row and spec section are read directly, never trusted
from a retro summary.

---

## Output artifacts

### Phase 4 — Synthesis report

`04-analysis.md` is the authoritative audit report. Structure:

1. Executive summary (2–3 paragraphs)
2. Acceptance-criteria scorecard (table with verdicts + pass rate)
3. Code-quality assessment (strengths, concerns, complexity hotspots)
4. Cornerstone conformance (overall + findings)
5. Spec fidelity (aligned vs diverged, impact per divergence)
6. Missing artifacts (tests, docs, schemas, etc.)
7. Risk assessment (severity × impact × mitigation)
8. Coverage boundary (what was examined vs deliberately NOT examined, verification depth per AC, audit dimensions not exercised)
9. Finding verification (Phase 4.5 — refutation results for every Critical/High finding)
10. Quality self-check (recorded table — one row per mandatory section, present/absent-with-reason; silent section-dropping becomes visible drift)

Full structure in [`references/templates.md`](references/templates.md).

### Phase 5 — Punch list

`05-punch-list.md` is the actionable remediation plan — ordered by priority, each item discrete enough for another engineer or agent to execute.

Each item declares (unified schema — also emitted as the machine-readable
YAML index, see `references/templates.md`):

- **Severity** (Critical / High / Medium / Low) — first-class field on the item
- **Category** (Acceptance Criteria Gap / Cornerstone Violation / Interaction Defect / Spec Drift / Missing Artifact / Code Quality / Test Gap / Documentation Gap / Improvement)
- **Source finding** (reference to AC-NN or Phase 3 finding)
- **Owner area** — the subsystem/team surface the fix belongs to
- **What** — precise description of fix
- **Where** — file paths and line numbers
- **Why** — criterion / principle / risk addressed
- **Evidence** — for Critical/High: a reproduction probe (command + expected vs actual)
- **Acceptance** — how to verify the fix is complete

**Punch-list items are audit-DISCOVERED defects and gaps only.** Work that
already lives in an open tracked issue goes into a separate "Pre-existing
tracked scope" cross-reference section (issue links, no PL numbers) that is
explicitly EXEMPT from the Phase 7 resolution gate — restating open
milestone scope as punch items either inflates the begin-delivery Step 1.6
gate or trains agents to blanket-defer, eroding it.

Category → typical priority mapping is in [`references/templates.md`](references/templates.md).

### Phase 6 — Create GitHub punch-list issue (mandatory)

After presenting the punch list to the user, create a GitHub issue with the executive summary, acceptance-criteria scorecard, and full prioritised punch list as a task checklist. This tracker issue is mandatory even when the punch list has zero open items; in that case, create the issue with the resolved/withdrawn/deferred outcomes recorded and close it as completed.

Issue shape:

- Title: `Audit: [Item Name] — [N] findings ([X] critical, [Y] high)`
- Labels: `audit`, `punch-list`, plus relevant epic labels
- Body from `05-punch-list.md` plus the executive summary and acceptance-criteria scorecard. Prefer GitHub MCP issue tools when available; if using `gh`, write the body to a file and pass it via `--body-file` (not heredoc).
- Linked to the original milestone/issues being audited

If labels don't exist, create them first (`gh label create <name> --color <hex>`).

Back-link the issue number/URL from `04-analysis.md` and `05-punch-list.md` before closing out the audit.

### Phase 7 — Resolution gate (mandatory before next phase begins)

**The audit cycle is not complete until every punch-list item has a recorded
outcome.** This is a hard gate: the next phase (or next Epic/Milestone) MUST
NOT begin while punch-list items are in limbo. Picked up via `begin-delivery`
Step 1.6.

For each item in `05-punch-list.md`, one of three outcomes is required:

| Outcome           | What it requires                                                                                                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **(a) Resolved**  | The fix landed (commit hash recorded in the audit issue task list or in the punch-list file). Verifies the Acceptance criterion stated in the item.                                                                                                                        |
| **(b) Deferred**  | An explicit follow-up issue exists with priority, owner/milestone, and a one-line rationale for the deferral. The Phase 6 audit issue's task list is updated to reference it. Deferrals are allowed but must be **named** — silent rollover into the next phase is banned. |
| **(c) Withdrawn** | The finding was reconsidered and the team explicitly decided no action is needed. A short note in the audit issue records who decided and why. (Rare. Use sparingly.)                                                                                                      |

**Default pattern: resolve in the same session.** Most punch-list items are
small administrative cleanups or codification edits and should land before
the next phase begins. Only escalate to (b) Deferred when the fix is
genuinely larger than the audit cycle can absorb (a real PR, a
cross-service migration, etc.) — and even then, file the follow-up issue
**in the same session** so it cannot evaporate.

**Anti-patterns** (banned):

- Advancing to the next Epic / next phase while the audit's punch-list
  items are open and unaddressed. The `begin-delivery` skill's Step 1.6 will
  refuse to proceed.
- Closing the audit issue with checkboxes unticked. The Phase 6 audit
  issue stays open until every item is (a)/(b)/(c) and the checkbox is
  ticked accordingly.
- Treating P3 items as auto-deferred. P3 items are usually <15min admin
  cleanups; resolve them in-session by default.

The "complete phase → audit → resolve → begin next phase" loop is the
canonical phase-progression pattern (see the repo's delivery/phase conventions —
e.g. `.github/instructions/github-delivery-workflow.instructions.md` — if present).

---

## Instruction-Recommendations Mode

> **Mode invoked by:** a repo's product-spec audit phase (if the repo uses product specs), or explicit user request ("audit with instruction recommendations", "what instruction files would have prevented this").

When invoked in this mode, the auditor adds a dedicated section to `04-analysis.md` titled **"Instruction File Recommendations"** that surfaces two categories of finding:

| Category                                | What the auditor surfaces                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Coverage gap** — would-have-prevented | For each Phase 2/3 finding, identify the existing instruction file (if any) whose rule, if followed, would have prevented the finding. Format: `Finding F-NN → would have been caught by .github/instructions/{file}.instructions.md § {section}` (scaffold's canonical instruction home; no generated mirrors). If a finding maps to no existing instruction file, mark it **"Uncovered"**. |
| **Codification gap** — needs-new-rule   | For each pattern that recurs across 3+ findings AND has no existing instruction file home, recommend either (a) extending an existing instruction file or (b) creating a new one. Format: `Pattern P-NN: {description} (3+ instances). Recommendation: {extend                                                                                                                                                                                    | new file} {target path} § {proposed section}`. Apply the 3+ instances rule — a pattern recurring across 3+ findings (not a one-off) warrants a codified rule. |

### Output format

Append to `04-analysis.md` after the Risk Assessment section:

```markdown
## Instruction File Recommendations

### Coverage Gaps (would-have-prevented)

| Finding | Would have been caught by                                                       | Uncovered? |
| ------- | ------------------------------------------------------------------------------- | ---------- |
| F-01    | `.github/instructions/{rule-file}.instructions.md` § "{relevant section}"       | —          |
| F-02    | `.github/instructions/{rule-file}.instructions.md` § "{relevant section}"       | —          |
| F-03    | (none)                                                                          | **YES**    |

### Codification Gaps (needs-new-rule)

| Pattern             | Instances              | Recommendation                                                                                                              |
| ------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| P-01: {description} | F-03, F-07, F-12       | **Extend** `.github/instructions/{file}.instructions.md` with new "{Section Name}" subsection covering: {bullet list of rule content} |
| P-02: {description} | F-04, F-09, F-15, F-22 | **New file** `.github/instructions/{proposed-name}.instructions.md` covering: {scope} |

### Recommended Action Sequence

1. {ordered list of edits the closing agent should make}
```

### Handoff to Phase Z.6

The auditor MUST NOT make instruction-file edits itself in this mode — recommendations are inputs to Phase Z.6 (instruction-file updates), where the closing agent applies them. The auditor's deliverable is the recommendation list with sufficient detail that Z.6 can be executed without re-running the audit.

### When to skip

Skip this mode when the audit scope is a single issue or PR (the 3+ instances rule cannot be evaluated meaningfully at that scope). Always run it for milestone-scope and epic-scope audits — its presence is a row in the recorded quality self-check, so omission is visible drift (adherence had silently decayed to zero between 2026-05-22 and 2026-06-10).

---

## Anti-patterns

Full list in [`references/anti-patterns.md`](references/anti-patterns.md). Top offenders:

- **Rubber-stamping** — marking PASS without reading code
- **Assuming completion** — "issue is closed so it must be done"
- **Summarising without evidence** — "looks good" with no file references
- **Batching notes** — reading 10 files then writing one summary
- **Being helpful instead of accurate** — softening findings to avoid conflict
- **Skipping cornerstone** — "this is just a small change"
- **Inventing acceptance criteria** — audit STATED criteria; suggest additions in punch list
- **Tracker-state-only PASS** — issue closed / box checked is corroboration, never sole evidence
- **Verdict from subagent summary** — subagent output is a lead; re-read the primary artifact
- **Delegating terminal ops to subagents** — they don't inherit terminal access
- **Unbounded `gh` output** — always pass `--limit N --json <fields>`

---

## Quality standards for audit artifacts

All output files (00–05) must meet the standards below — and the self-check
against them is RECORDED as a table in `04-analysis.md` (see
`references/templates.md` § Quality self-check), so a skipped check is
visible instead of silent:

| Standard           | Requirement                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| **Traceability**   | Every finding links to a source (spec section, issue number, file path) |
| **Evidence-based** | No finding without evidence — file paths, line numbers, git commits     |
| **Reproducible**   | Another engineer reading the audit could verify every finding           |
| **Actionable**     | Punch list items specific enough to implement without ambiguity         |
| **Complete**       | Every stated acceptance criterion evaluated — none silently skipped     |

---

## Inputs to gather at the start

| Input                            | Source                                         | How to find                                                                                            |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **The spec**                     | `docs/planning/{feature}/`                     | User provides or search by feature name                                                                |
| **The issues**                   | GitHub Issues/Milestones                       | Search by milestone, labels, issue numbers                                                             |
| **The code changes**             | Git history                                    | `git log`, `git diff --stat`, file changes                                                             |
| **The acceptance criteria**      | Issue bodies + spec phases                     | Read issue bodies and spec validation gates                                                            |
| **Phase retros (scoped audits)** | Each phase's retro comment / spec § Mini Retro | Per-Phase scoped-audit findings are first-class input; read every one before starting Phase 1 research |
| **Prior Epic audits**            | `logs/audits/` (for Milestone scope)           | Grep by epic label, milestone number                                                                   |
| **Cornerstone rubric**           | `docs/architecture/cornerstone-conformance.md` | The single derived conformance reference (doctrine + Accepted ADRs + development-principles)            |
| **Relevant instruction files**   | `.github/instructions/` (canonical)            | Match by file paths touched                                                                            |

## Reference files

- [`references/phases.md`](references/phases.md) — the authoritative phase 0–7 procedure with criterion-entry format and step-by-step checks
- [`cornerstone-conformance.md`](../../../docs/architecture/cornerstone-conformance.md) — the cornerstone conformance face (doctrine + Accepted-ADR + development-principles rows)
- [`references/templates.md`](references/templates.md) — all output templates (criterion entry, analysis report, punch list items)
- [`references/anti-patterns.md`](references/anti-patterns.md) — the full anti-patterns table + quality standards

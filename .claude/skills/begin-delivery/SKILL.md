---
name: begin-delivery
description: Orchestrate the start of an Execution Epic — work with pre-defined outcomes that decomposes into actionable tasks (feature ship, refactor, fix, migration, integration, cleanup). Retrieves prior phase retros, invokes the futro skill for anticipatory analysis, loads granular tasks into the todo system, and runs an execution pre-flight checklist. Use when the user says "begin next phase", "start phase N", "move to phase X", "phase kickoff", "start the next epic", "begin delivery", or when a phase's completion retro just finished and the next Execution Epic is ready. Do NOT use for Discovery Epics whose execution is a single invocation of a methodology skill (e.g. `code-auditor` in fresh-audit mode) — use a Discovery-Epic kickoff path (e.g. `begin-exploration`) instead. Assumes a Milestone → Phased Epics → Issues structure (GitHub by default). Pairs with mini-retro (predecessor) and futro (delegate).
license: Apache-2.0
metadata:
  execution: serial
  version: 3.2.0
  origin: 'Imported from birdwork-preflight .claude/skills/begin-delivery; adapted for scaffold (bedrock→cornerstone; foreign refs softened).'
---

# Begin Delivery

Transition into the next Execution Epic of an active Milestone. Enforces the
"look back AND look forward before moving forward" discipline: every phase
kickoff consumes the prior phase's retro AND runs a futro BEFORE loading
tasks.

## Execution discipline — SERIAL (hard gate)

This skill is **stage-gated**: every stage consumes the *settled* output of the stage
before it. Run stages **strictly in order, under ONE orchestrator, never in parallel**
— fanning stages out to concurrent agents/sessions voids the guarantees (origin:
2026-07-08, an agent parallelized a code-auditor run). In-stage sub-agents are allowed
only where a stage explicitly says so. Swarm rule: while this skill is active on a
scope, other agents pause mutations on that scope until it completes
([serial-execution-gates](../../../.github/instructions/serial-execution-gates.instructions.md)).

## When to use

- User asks to "begin next phase", "start the next phase", "kick off phase X", "begin delivery"
- The previous phase has just completed its retro and the next Execution Epic is ready
- The Milestone is just starting (first phase) — skill still applies with
  the spec in place of a prior retro
- An Execution Epic is being decomposed into granular tasks for execution
- The Epic's outcomes are **pre-defined** (ship feature X, fix bug Y, refactor Z, sweep N call sites, migrate M call sites)

## When NOT to use

Use a Discovery-Epic kickoff path (e.g. a `begin-exploration` skill, if present)
instead when the Epic's execution is a single invocation of a substantive
methodology skill that produces **emergent** outcomes:

- A research-then-deliberate trial / re-run (e.g. a `council-research` skill, if present)
- A deliberation on a contested decision with corpus already in hand (e.g. a `council` skill, if present)
- A [`code-auditor`](../code-auditor/SKILL.md) fresh audit at Epic / Milestone close
- A DS-scale design review (e.g. a `design-reviewer` skill, if present)

The contamination paths that justify the split (from M64.P1.5 E6 #2952):

| `begin-delivery` ceremony                                 | Why it contaminates Discovery work                                                                                                                                                                                             |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Step 2 — futro question 4                                 | Pre-mortem + simulation + blindspot check load adversarial framing into the orchestrator BEFORE invoking the methodology. Violates a research-synthesis skill's hard "no adversarial framing in clinical synthesis" invariant. |
| Step 2 — futro question 5                                 | Pre-named investigations embed the orchestrator's hypotheses into the Phase-1 prompt — the exact bias multi-model parallel research is engineered to avoid.                                                                    |
| Step 3 — task decomposition                               | Pre-decomposes outcomes that should EMERGE from the methodology; pre-judges what the substantive skill produces.                                                                                                               |
| Step 4 — pre-flight (cornerstone conformance, plan each step) | Presumes a plan to validate; surfaces hypotheses rather than a neutral substrate check.                                                                                                                                        |

If the Epic's outcomes are emergent (what does R2 say? which substrate wins? what does the deliberation decide?) — that's Discovery, not Delivery. Use the Discovery-Epic kickoff path (e.g. `begin-exploration`, if present).

## Role: orchestrator

This skill is a **thin orchestrator**. The real methodology lives elsewhere:

- **mini-retro skill** — methodology for what the PRIOR phase wrote
  (reflective; see [`mini-retro`](../mini-retro/SKILL.md))
- **futro skill** — methodology for what THIS phase should look at before
  starting (anticipatory; see [`futro`](../futro/SKILL.md))
- **begin-delivery** (this skill) — sequences those two + loads tasks +
  runs pre-flight
- **(optional) notification skill** — kickoff announcement after futro
  readiness, if the repo ships one (e.g. a `work-start-notice` skill)

The chain:

```
Phase N code-complete
   │
   ▼
mini-retro skill  ──  writes retro; propagates adjustments
   │
   ▼  (minutes to days may pass)
   │
Phase N+1 kickoff
   │
   ▼
begin-delivery skill (this skill) — orchestrator
   │
   ├──  Step 1: retrieve prior retro(s)
   │
   ├──  Step 1.5: Epic/Milestone boundary check  ──→  if prior phase closed an Epic
   │                                                  or Milestone, invoke `code-auditor`
   │                                                  skill at that scope BEFORE futro
   │
   ├──  Step 1.6: Punch-list resolution gate  ──→  resolve / defer-with-issue / withdraw
   │                                              every audit punch-list item BEFORE futro
   │
   ├──  Step 1.7: Prior-work grounding  ──→  inventory what's already DONE in the
   │                                         Milestone; no upcoming AC may assume-undone
   │
   ├──  Step 2: invoke futro skill  ──→  revises plan, opens investigations, flags blindspots
   │
  ├──  Step 2.5: optionally invoke a kickoff-notice skill (if present)
  │
  ├──  Step 3: load granular tasks into the todo system
   │
   └──  Step 4: execution pre-flight checklist
   │
   ▼
Phase N+1 execution
```

## Prerequisites

- An active Milestone with phased Epics and issues (GitHub, Jira, Linear, etc.)
- The previous phase is complete with a mini-retro posted (or this is the
  first phase, in which case Step 1 loads the spec instead)
- A spec / plan document exists for the feature (e.g.
  `docs/planning/<feature>/<feature>-spec.md`)

If the repo has a delivery / issue-workflow governance doc (in scaffold,
[`github-delivery-workflow.instructions.md`](../../../.github/instructions/github-delivery-workflow.instructions.md)),
it takes precedence over this skill for per-issue protocol.

## Tooling

For GitHub-backed workflows, prefer the GitHub MCP tools
(`mcp_github_issue_read`, `mcp_github_issue_write`,
`mcp_github_search_issues`, `mcp_github_list_issues`). Avoid the `gh`
CLI for list/search operations — bulk output has destabilised agent
runners. `gh` for single-record writes is fine when MCP doesn't cover
the operation.

For other trackers, use whatever API / MCP is available and apply the
same steps conceptually.

## Workflow

### Step 1 — Retrieve prior retro(s)

Find the mini-retro that closed the previous phase (if one exists).
Candidate locations:

- Comment on the parent Epic / umbrella issue (most common —
  `mcp_github_issue_read` + `get_comments`)
- Section in the spec document (`### Mini Retro: Phase N`)
- Dedicated retro issue (if the Milestone uses one)
- Commit message of the phase's last commit

**Retrieve any retro addenda too.** A phase that produced substantial
work after its retro was posted (emergent remediation, a reframing, a
discovered-failure chain) records it as a **retro addendum** — a follow-up
comment titled `Mini-Retro Addendum: …` on the same Epic issue, or an
`#### Addendum (…)` subsection beneath the spec retro (see the
`mini-retro` skill, § Retro addenda). The addendum carries the
phase's MOST RECENT learning and is easy to miss because it post-dates
the retro. Scan all comments after the retro, not just the retro itself.

**Important:** a Mini Retro (as of `mini-retro` v2.0.0) includes a
**§ Scoped audit findings** subsection — read this carefully. It
contains the five phase-tier audit spot-check verdicts + findings
and often surfaces drift that the four retro questions understate.
The futro (Step 2) consumes these findings as first-class input.

Expected output of Step 1: either

- "Prior retro loaded from {location} — summary: {two sentences on the
  retro's key findings and adjustments}{, plus N addenda: … if any}" — or
- "No prior retro found" (proceed, but note it; running a phase kickoff
  without the prior retro means flying blind on carry-forward learnings)

If a retro should exist but doesn't, **pause and ask the user whether to
run the `mini-retro` skill first** before proceeding.

### Step 1.5 — Epic / Milestone boundary check (auto-invoke `code-auditor`)

Before running the futro, check whether the phase that just closed was the
**last phase of an Epic** or the **last Epic of a Milestone**. If so, the
upward-tier audit is now due and `begin-delivery` is responsible for invoking it
— do not silently skip past the boundary.

| Boundary just crossed                | Required action                                                        | Skill scope     | Artifact location                          |
| ------------------------------------ | ---------------------------------------------------------------------- | --------------- | ------------------------------------------ |
| Last phase of an Epic completed      | Invoke `code-auditor` skill at **Epic** scope                          | Epic            | `logs/audits/YYYY_MM_DD-epic-{name}/`      |
| Last Epic of a Milestone completed   | Invoke `code-auditor` skill at **Milestone** scope                     | Milestone       | `logs/audits/YYYY_MM_DD-milestone-{name}/` |
| Mid-Epic phase boundary (most cases) | None — phase-tier scoped audit already ran inside the prior mini-retro | (skip Step 1.5) | (none)                                     |

**Detection signals (any one is sufficient):**

- The Epic/Milestone tracker (GitHub Issue) is in `state: closed` or has all sub-issues closed
- The prior mini-retro's § "Practice adjustments" section flags Epic/Milestone close-out
- The user's kickoff prompt explicitly names a NEW Epic / Milestone (not the next phase of the current Epic)
- The spec's phase index shows the prior phase was the terminal phase of its Epic

**Procedure:**

1. State explicitly: "Boundary detected — prior phase closed {Epic|Milestone} {name}. Per `begin-delivery` Step 1.5, the `code-auditor` skill must run at {scope} scope before kickoff."
2. Pause and confirm with the user before invoking. Do not auto-spend tokens on a multi-pass audit without acknowledgement — but do **not** advance to Step 2 if the user defers; instead, record the deferral in the kickoff comment and flag it as a known carry-forward risk.
3. If approved, invoke `code-auditor` per its `SKILL.md`. Wait for completion.
4. Read the resulting punch list (`logs/audits/.../05-punch-list.md`). Any P0/P1 items become **inputs to the futro in Step 2** — they directly inform what the next phase must address before its own scope.
5. Open follow-up issues for punch-list items per the repo's delivery-workflow governance (in scaffold, `github-delivery-workflow.instructions.md`).

**If Step 1.5 is skipped under user deferral**, the futro in Step 2 must
include an explicit "deferred upward-tier audit" entry in its blindspot
register section, and the next mini-retro is on the hook to re-evaluate
whether the audit is still safe to defer.

This step exists because forgetting to run an Epic- or Milestone-tier audit
is a documented failure pattern: phase-tier scoped audits cover each
phase individually but cannot see cross-phase interaction defects, and once
the next phase begins consuming context, retroactively running the Epic
audit becomes much more expensive. Bookend it here.

### Step 1.6 — Punch-list resolution gate

If Step 1.5 produced (or there already exists) an open audit punch-list
issue from the prior Epic / Milestone, **the next phase MUST NOT begin
until every punch-list item is resolved, explicitly deferred with a
follow-up issue, or explicitly withdrawn.** This is the canonical
phase-progression pattern:

```
complete phase  →  audit  →  create punch-list issue  →  resolve all items  →  begin-delivery next
```

**Procedure:**

1. Locate the audit's Phase 6 GitHub issue (typically labelled `audit`,
   `punch-list`). If the audit just ran in Step 1.5, the issue should
   already be filed; if it isn't, file it now per `code-auditor` Phase 6.
2. Read the issue's task checklist. For each item, classify the current
   outcome:
   - **Resolved** — the fix has landed (commit recorded; box ticked)
   - **Deferred** — a follow-up issue exists with priority + owner + rationale, and the audit-issue checkbox references it
   - **Withdrawn** — explicit note in the audit issue records who decided and why
   - **Open** — none of the above
3. If any item is **Open**, state to the user:
   > "Punch-list issue #N has open items — per `begin-delivery` Step 1.6, these must be resolved (or explicitly deferred / withdrawn) before this phase begins. Default is to fix them in-session before continuing."
4. Default action: **fix the open items first**, in priority order, before advancing to Step 2 (futro). Most punch-list items are small administrative cleanups, codification edits, or doc additions and complete in a single session.
5. Only advance past Step 1.6 with open items when the user **explicitly approves** the deferral and the deferred items have follow-up issues filed in the same session. Record the approved deferrals in the futro's blindspot register entries.
6. Once every item has a recorded outcome, close the audit punch-list issue (Phase 6 issue) before proceeding.

**Anti-patterns** (banned):

- Silently advancing to the next phase while the punch-list issue has unchecked boxes
- "We'll come back to that one" without filing a follow-up issue
- Treating P3 items as auto-deferred — they are usually <15min admin cleanups; resolve them in-session by default
- Closing the audit punch-list issue with items unresolved

Phase-tier scoped-audit findings (from the prior `mini-retro` § "Scoped
audit findings") are NOT gated here — they flow into Step 2's futro as
adjustments to the next phase's plan. Step 1.6's gate applies only to
the Epic / Milestone audit's punch list, where deferred items risk
disappearing across the boundary.

### Step 1.7 — Prior-work grounding (guard against "assumed-undone")

> **Named discipline (ratified 2026-06-09):** "prior-work grounding." The
> failure it prevents is **assumed-undone** — an agent treating work as
> not-yet-done when it was in fact already completed earlier in the same
> Milestone (a different phase, a sibling Epic, a closed issue). Agent memory is
> not durable; the tracker is. This step reads the tracker's done-state so the
> upcoming phase is grounded in actual progress, not assumption.

Steps 1–1.6 looked at the **prior phase** (its retro, its audit, its punch
list). This step widens the lens to the **whole Milestone's completed work**,
because the most expensive amnesia is re-deriving or re-planning something a
sibling Epic already shipped.

Lightweight inline procedure — no separate artifact; findings feed the Step 2
futro:

1. **Inventory done-state.** List the Milestone's **closed** issues and, for
   each relevant to the upcoming phase, its landed deliverable (commit SHA,
   doc path, schema, endpoint). `mcp_github_search_issues` with
   `milestone:"<name>" state:closed`, plus `git log` for the deliverables.
2. **Assumed-undone scan.** For every AC about to enter execution, ask: _does
   this AC assume something is still to-do that is actually already done?_
   Check the upcoming issue bodies against the done-state inventory. Pay
   special attention to AC0-style "dependency verification" bullets — they are
   where an assume-undone error does the most damage.
3. **Reconcile before the futro.** If an AC (or issue body) assumes work that
   is already complete, **edit it now** — strike or rewrite the AC, reference
   the completing commit/issue, and note the reconciliation in a one-line
   comment on the issue. Do not let the stale assumption travel into the futro
   or the task list.
4. **Surface to the user** if the reconciliation materially changes the phase's
   scope (e.g. several ACs were already satisfied by earlier work).

Expected output: either "Prior-work grounding clean — no upcoming AC assumes
already-completed work" or a short list of reconciled ACs / issues with their
completing-work references. The Step 2 futro consumes this as a question-1
input; it **complements** the futro's substrate-precondition check (that check
verifies what EXISTS in the target environment — this verifies what WORK IS
DONE in the Milestone).

This step exists because "an agent assumed work hadn't been done that had been
done" is a documented failure. Reading the Milestone's done-state at
kickoff is the cheapest place to catch it — far cheaper than discovering
mid-execution that the phase's premise was stale. Pairs with a plan-time
AC0 preflight (if the repo uses product specs) and the close-time
completion breadcrumb (`mini-retro` skill Step 5).

### Step 2 — Invoke the `futro` skill

Delegate the anticipatory work to the [`futro`](../futro/SKILL.md) skill.

**Skipping the futro is allowed in exactly one case:** the prior phase
pre-dated the `futro` skill's adoption in the current Milestone (i.e.
the skill landed mid-Milestone and Phase N−1 didn't get one). In every
other case the futro is mandatory. Specifically, the following are NOT
valid reasons to skip:

- "This phase is small" — small phases produce small futros, not no futros
- "We already know what's coming" — known knowns are quadrant 1; the
  futro is for quadrants 2–4
- "The retro covered it" — retro is reflective; futro is anticipatory
- "We're behind schedule" — schedule pressure is the strongest signal
  that a futro is needed, not that it can be skipped

If you believe a skip is justified, **state the reason explicitly to
the user and ask for approval before proceeding to Step 3.** Silent
skips are banned (origin: M26 P1 mini-retro 2026-05-08, where the
skill's mid-milestone adoption produced an implicit skip that was only
caught retrospectively).

Feed the futro skill the inputs:

- Prior retro from Step 1 (if any)
- Spec document / parent epic body
- Sub-issue bodies for the phase about to begin
- Blindspot register if the project maintains one (conventionally under
  `docs/`)

The futro skill produces:

- A futro comment on the Epic (and/or a `### Futro: Phase N` section in
  the spec)
- Revised sub-issue bodies — plan adjustments applied
- Investigation tasks (for known unknowns) opened or recorded
- Blindspot register entries (if any new ones surfaced)
- A clear "ready to proceed" or "pause — investigations open" signal

Do NOT proceed to Step 3 until the futro signals ready. If investigations
are open, either resolve them inline or (with explicit user approval)
document the decision to proceed without resolving and move on.

### Step 2.5 — Optional work-start notice (if a notification skill is present)

If the user wants a kickoff notice and the repo ships a notification skill
(e.g. a `work-start-notice` skill), invoke it after the futro has updated
the issue context and before loading the granular task list.

Pass the canonical work container to that skill:

- Epic work → the parent Epic issue number
- Epic sub-issue → the parent Epic issue number, not the child
- Standalone issue → that issue number
- Milestone phase row → the primary Epic for the row

The delegated skill owns dry-run-first behavior, post approval, dispatch,
and verification. Do not post work-start notices directly from local shell
commands with a webhook URL.

### Step 3 — Load granular tasks

For the phase about to begin:

1. **Read every issue** in the Epic completely — body (potentially revised
   by Step 2), acceptance criteria, dependencies, linked issues, any
   comments containing revisions
2. **Decompose each issue** into granular, actionable tasks
3. **Identify cross-issue dependencies** — which tasks block others?
   Order accordingly.
4. **Load ALL tasks** into the agent's todo system (`manage_todo_list`,
   `todos`, or equivalent) in execution order
5. **Present the task list to the user** for confirmation before proceeding

#### Upfront sub-issue decomposition with bracketed audits

**Rule:** Every Epic's sub-issues are drafted **upfront** at Epic creation with full bodies, ACs, and dependencies. The freshness problem that lazy-drafting tried to avoid (stale import lists, dated inventory, drift between body and live state) is solved by **two bracketed audit checkpoints** at each batch start, surrounding the futro.

**Supersedes** the 2026-05-11 lazy-drafting rule (this skill, v2.3.0). That rule traded forward visibility, context-resume safety, and dependency-graph clarity for the single benefit of "no stale content" — a trade the bracketed-audit cadence now achieves without the costs.

**Per-batch flow:**

```
Pre-futro audit  →  Futro  →  Post-futro audit  →  Execute
   (~10 min)              (Step 2 of this skill)    (~10 min)        (Step 4 onward)
```

**Pre-futro audit checklist** (run before invoking the `futro` skill at Step 2):

- [ ] **Live-state reconciliation** — re-query live state (Azure, DB, OpenBao, etc.) and reconcile against the sub-issue body. Update import command lists, inventory counts, drift assumptions.
- [ ] **AC verifiability** — each AC must still be checkable. If tooling has changed or an artifact no longer exists, fix the AC now.
- [ ] **Dependency check** — every issue this one depends on still exists, still scopes as expected, still ships before this batch.
- [ ] **Scope discipline** — diff the body against the Epic's decomposition table. Anything new or missing? Surface to user before proceeding — never silently re-scope.
- [ ] **Cross-batch interaction** — has a prior batch's outcome (Δ in plan, KU resolution, scope change) altered what this batch needs to do?
- [ ] **Record** findings as a comment on the sub-issue titled `Pre-futro audit — <date>`.

**Post-futro audit checklist** (run after futro completes, before loading tasks at Step 3):

- [ ] **Futro adjustments applied** — every adjustment the futro produced is reflected in the sub-issue body, in dependency issues, or in a follow-up issue. None silently dropped.
- [ ] **No scope creep** — body still matches Epic decomposition (modulo any deltas the user explicitly accepted in the futro).
- [ ] **Investigation completeness** — every investigation the futro opened is either resolved or has a tracked issue.
- [ ] **Carry-forward adjustments applied** — adjustments from the prior batch's mini-retro have been honored in this batch's plan.
- [ ] **Record** sign-off as a comment on the sub-issue titled `Post-futro audit — <date>` with green-light explicit.

**Why upfront wins:**

| Concern                         | Lazy-drafting (deprecated) | Upfront + bracketed audits         |
| ------------------------------- | -------------------------- | ---------------------------------- |
| Stale import / inventory data   | Don't draft yet            | Refresh at pre-futro audit         |
| Drift between plan & live state | Avoid the gap              | Measure it explicitly, twice       |
| Forward visibility              | Epic body prose only       | All N sub-issues tracked as issues |
| Context-resume safety           | Fragile (re-read Epic)     | Robust (sub-issue tree IS the map) |
| Cross-issue dependencies        | Invisible until drafted    | Visible from kickoff               |
| Audit trail for shape changes   | None                       | Two timestamped checkpoints        |

**Cost:** ~20 min/batch for the two audits. Worst case (everything stable): two short sign-off comments. Best case: catches drift that would have wasted hours mid-execution.

**Epic body MUST still carry** (used as scaffolding for the upfront-drafted bodies, not as a substitute for them):

1. **Per-batch unknowns table** — the things each batch must resolve from live state. The pre-futro audit is where the agent resolves the row for its batch.
2. **Sub-issue body template** — so bodies stay consistent in shape across batches.

**Retrofitting an existing Epic** that was started under the lazy-drafting rule:

1. Read the Epic body's decomposition.
2. Create thin stubs for every not-yet-filed sub-issue with: title, batch number, link to Epic, "DRAFT — pre-futro audit pending" placeholder body.
3. Link each stub under the Epic via `mcp_github_sub_issue_write method=add` (serial, never parallel).
4. For the **next** batch to execute, run the pre-futro audit checklist to expand its stub into a full body before proceeding to Step 2.
5. For later batches, expand their bodies at their respective batch starts.

**Origin:** 2026-05-12 mid-Epic #2635 process review. The lazy-drafting rule caused demonstrable context-resume disorientation (agent lost the Epic's sub-issue enumeration because future sub-issues did not exist as tracked artifacts). The Epic body promising "we'll get to G2.4" is structurally weaker than 5 issues existing with the right titles and parent link.

Task granularity guidance:

| Good task                                                    | Too coarse                 |
| ------------------------------------------------------------ | -------------------------- |
| "Implement auth adapter interface (#381)"                    | "Work on auth"             |
| "Add `/users/:id/export` endpoint with ZIP response (#402)"  | "Build the export feature" |
| "Migrate 3 call sites in `api/users/` to new auth interface" | "Update callers"           |
| "Read cornerstone doc X and note implications for issue #410" | "Review docs"              |

Each task should:

- Be completable in a single focused session
- Map to a verifiable outcome (not "work on X" but "implement X that does Y")
- Include issue references in parentheses
- Include non-code tasks when needed (reading specs, updating issue bodies,
  writing an ADR, resolving a futro investigation)

### Step 4 — Execution pre-flight

Before marking any task in-progress, confirm the execution discipline with
the user (or silently follow it if the repo's `.instructions.md` already
codifies it):

- [ ] Critical and foundational — the implications are far-reaching
- [ ] Conformance to project's cornerstone / foundational documents — pause
      and escalate on risk of divergence, conflict, or contradiction
- [ ] Plan each step before starting it (don't need to share the plan,
      but must think it through)
- [ ] Move slowly, deliberately, thoughtfully, iteratively, completely —
      quality over speed
- [ ] **Substrate-precondition check (HARD GATE)** — for every sub-issue
      about to enter execution, enumerate the substrate primitives its
      ACs presuppose (auth flow, federation broker / IdP, capability
      runtime, schema column, well-known endpoint, queue, role, env
      var, third-party API, etc.) and verify each one **actually
      exists in the target environment** by direct inspection — not
      by trusting the issue body. Issue bodies authored at planning
      time often encode roadmap-or-elsewhere substrate as if present.
      Examples of valid checks: `kcadm get realms/<r> --fields
identityProviders`; `psql -c '\d table'` for column presence;
      `curl /.well-known/<doc>` for discovery surface;
      `grep -rn '<capability>' <capabilities-source-dir>`. If any
      precondition is absent or roadmap, **pause execution**, post a
      rescope/deferral comment on the sub-issue, and surface to the
      user. Do not let the gap travel into the granular task list.
      (Origin: blindspot-register § "Substrate-precondition assumption
      inherited from issue body".)
- [ ] Per-issue micro-retro is mandatory — two goals:
  1. Revise previously completed work if learning reveals corrections
     are needed
  2. Revise remaining work (future issues) so their scope/ACs reflect
     the new reality
- [ ] Pause if questions arise — don't assume
- [ ] Pause if diverging — scope expansion or foundational tension → escalate
- [ ] Mark work complete as it is completed — don't batch completions
- [ ] Ask before committing — no commits without explicit user approval
- [ ] Treat hard gates as hard gates — if a prerequisite must complete
      before downstream work, don't proceed until it has actually succeeded
      and been validated
- [ ] Instrument gates — long-running gated work needs telemetry/alerting
      so retries and failures are observable
- [ ] **Visual-QA obligation (UI-touching phases; if a design-review /
      visual-QA process is present)** — if any planned task modifies
      user-facing UI (page templates, components, styles, auth-UI theme,
      projections to visible content), the agent owns visual verification
      via the repo's design-review process (e.g. a `design-reviewer`
      skill, if present) in page-scale mode against staging (default) or
      the next-best target. BLOCKER/MAJOR findings are fixed before
      code-complete; MINOR/COSMETIC findings flow into the phase
      mini-retro's §3 discoveries. Do **not** delegate page-scale visual
      review to the user — human gating is reserved for real-data
      correctness, brand "feel" / taste, or auth/multi-tenant contexts
      the agent cannot synthesize. The phase's mini-retro Step 2.5
      Check 6 verifies this artifact exists at retro time.

Then proceed with task 1 and continue through the list following the
project's issue workflow.

## Notes

- **This skill is Milestone-driven phased-Epic work applicable to any
  project using that structure** — not just the project it originated in.
- **Step 2 (the futro) is the most important substantive work** — it
  prevents drift between planning and reality. Skipping it means the
  phase executes on stale assumptions or misses foreseeable risks.
- **The granular task list in Step 3** is a contract for the phase's
  scope. If tasks appear that weren't in the plan, they need either
  a revised issue or explicit user approval.
- **Midpoint checkpoint issues** (if the Milestone uses them, e.g.
  ★-marked issues) should be noted and triggered at the right point
  during execution, not treated as regular tasks.
- **First phase of a Milestone:** Step 1 returns "no prior retro"; the
  futro in Step 2 runs against the spec + any pre-execution context
  (research spikes, ADRs) instead of an upstream retro.

## Change log

- **3.2.0 (2026-06-09)** — Added Step 1.7 (Prior-work grounding) between
  the Step 1.6 punch-list gate and the Step 2 futro. A lightweight inline
  scan of the Milestone's closed-issue done-state (deliverable SHAs / doc
  paths) plus an "assumed-undone" check on every upcoming AC, so the phase
  is grounded in actual cross-Epic progress rather than the prior phase's
  retro alone. Reconciliation (edit the stale AC, reference the completing
  work) happens before the futro consumes the plan. Codifies the
  **prior-work grounding** discipline / **assumed-undone**
  failure name (ratified 2026-06-09). Defense-in-depth with the
  plan-time AC0 preflight (if the repo uses product specs) and the
  close-time completion breadcrumb (`mini-retro` skill Step 5). Origin:
  2026-06-09 user report of an agent assuming intra-Milestone work was
  undone when it was already complete. `begin-delivery` invokes the
  kickoff notice hook after the futro signals ready and before granular
  task loading; a Discovery-Epic kickoff path (e.g. `begin-exploration`,
  if present) carries its own neutral post-substrate-verification hook.
- **3.0.0 (2026-05-21, M64.P1.5 E6 #2952)** — Renamed from `begin-phase`
  to `begin-delivery`; scope made Execution-Epic-explicit in the
  description. New "When NOT to use" section points at a Discovery-Epic
  kickoff path (e.g. `begin-exploration`, if present) for Discovery Epics
  (where the execution is a single invocation of a substantive methodology
  skill: `code-auditor` in fresh-audit mode, or research / deliberation /
  design-review skills if present). Rationale: this skill's ceremony (futro Q4 + Q5, task
  decomposition, plan-and-validate pre-flight) systematically contaminates
  Discovery work by pre-loading adversarial framing, pre-naming
  investigations, and pre-judging emergent outcomes. Splitting along
  the execution-vs-discovery axis preserves the Execution discipline
  here while letting Discovery work be orchestrated cleanly elsewhere.
  Behavior unchanged for the Execution case; the rename is breaking only
  because invocation by old name (`@begin-phase`) no longer resolves.
- **2.5.0 (2026-05-12)** — Introduced "Upfront sub-issue decomposition
  with bracketed audits" — full sub-issue bodies at Epic kickoff,
  freshness guaranteed by pre-futro + post-futro audit checkpoints per
  batch (replacing an earlier lazy-drafting approach that was never
  merged). Origin: 2026-05-12 mid-Epic #2635 process review.
- **2.4.0 (2026-05-12, Epic #2647 / S1 #2648 unwind)** — Added the
  substrate-preconditions hard gate to Step 4 pre-flight. Sub-issue
  ACs frequently presuppose substrate primitives (federation brokers,
  capability runtimes, schema columns, well-known endpoints) that
  exist in the roadmap or in a sibling environment but **not** in the
  target environment. The pre-flight now requires direct inspection
  of each presupposed primitive before granular tasks load, with
  pause-and-rescope as the prescribed response when a precondition is
  absent. Pairs with futro v1.1.0 Step-1 substrate inventory and the
  blindspot-register entry "Substrate-precondition assumption
  inherited from issue body".
- **2.3.0 (2026-05-11)** — Added Step 1.6 (Punch-list resolution gate).
  Next phase MUST NOT begin until the prior Epic/Milestone audit's
  punch-list items are each resolved, deferred-with-follow-up-issue, or
  explicitly withdrawn. Codifies the canonical phase-progression pattern
  `complete phase → audit → resolve → begin next` and pairs with
  `code-auditor` Phase 7.
- **2.2.0 (2026-05-10, #2630)** — Added Step 1.5 (Epic/Milestone boundary check)
  that auto-invokes the `code-auditor` skill at Epic or Milestone scope
  before the futro runs. Prevents the documented failure pattern
  where upward-tier audits get silently skipped when the next phase
  begins. Pairs with the `code-auditor`-as-skill-first model.
- **2.1.0 (2026-05-04, #2390)** — Added the visual-QA obligation to
  the Step 4 pre-flight checklist for UI-touching phases (applies only
  where a design-review / visual-QA process is present). Pairs with
  Check 6 in the `mini-retro` scoped audit.
- **2.0.0 (2026-04-23)** — Separated anticipatory work into the dedicated
  `futro` skill. Previous Step 1 ("Retrospective review of future issues")
  was conceptually a futro, not a retro — renamed and extracted. This
  skill is now a thin orchestrator; the methodology lives in `futro` and
  `mini-retro`.
- **1.0.0** — Initial conversion from `.github/prompts/begin-phase.prompt.md`.

## Repo-specific integrations

- **scaffold**:
  - [`github-delivery-workflow.instructions.md`](../../../.github/instructions/github-delivery-workflow.instructions.md) governs issue / PR protocol — this skill defers to it; phase / Epic naming lives in [`milestone-phase-naming.instructions.md`](../../../.github/instructions/milestone-phase-naming.instructions.md)
  - The `mini-retro` skill — produces what Step 1 retrieves
  - The `futro` skill — invoked by Step 2
  - Grounding (doctrine + Accepted ADRs + development principles) lives in [`cornerstone-conformance.md`](../../../docs/architecture/cornerstone-conformance.md)
- **Other repos**: if similar instruction files exist, defer to them. If
  not, the pre-flight checklist in Step 4 is a reasonable default.

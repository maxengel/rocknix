---
name: futro
description: 'Run a forward-looking retrospective ("futro") before starting a phase, epic, or significant chunk of work. Anticipatory counterpart to mini-retro — uses "what if?" thought experiments and agent-execution simulation to identify traps BEFORE execution begins. Produces revised plans, investigation tasks, and flagged blindspots. Structured around Rumsfeld''s four quadrants (known/unknown knowns and unknowns) and five questions; question 4 ("what could we be missing?") is the heart of the practice. Use when the user says "futro this", "think ahead", "what are we missing", "pre-mortem this", "what if…", "before we start…", or when a phase kickoff has just retrieved a prior retro and is about to transition to execution. Pairs with mini-retro (reflective) and is invoked by begin-delivery at Execution-Epic kickoff. Note — a Discovery-Epic kickoff (e.g. begin-exploration) deliberately does NOT invoke it.'
license: Apache-2.0
metadata:
  execution: serial
  version: 1.5.0
  origin: 'Imported from birdwork-preflight .claude/skills/futro; adapted for scaffold (bedrock→cornerstone; foreign refs softened). v1.5 platform-probe mandate adapted 2026-07-10 from birdwork/birdwork@e0ff051.'
---

# Futro

Run a structured forward-looking retrospective at a work boundary. Produces
anticipatory learnings, not a ceremony.

## Execution discipline — SERIAL (hard gate)

This skill is **stage-gated**: every stage consumes the *settled* output of the stage
before it. Run stages **strictly in order, under ONE orchestrator, never in parallel**
— fanning stages out to concurrent agents/sessions voids the guarantees (origin:
2026-07-08, an agent parallelized a code-auditor run). In-stage sub-agents are allowed
only where a stage explicitly says so. Swarm rule: while this skill is active on a
scope, other agents pause mutations on that scope until it completes
([serial-execution-gates](../../../.github/instructions/serial-execution-gates.instructions.md)).

## When to use

Run when any of these is true:

- A phase inside a product spec is about to begin
- An Epic umbrella is about to have its first sub-issue started
- Work is about to start on a sub-issue with complex upstream dependencies
  or a history of surprises
- You're context-switching to work you haven't touched recently
- The user says "futro", "futro this", "think ahead on this", "what are we
  missing", "pre-mortem this", "before we start…"
- You're running `begin-delivery` — this skill is invoked as its second step (NOT a Discovery-Epic kickoff — Discovery Epics skip the futro)

**Do NOT skip it** because "we just ran a retro." The retro tells you what
happened. This skill tells you what's coming. Both lenses are required.

## When NOT to use

- Single-file fixes with no upstream / downstream dependencies
- Dependency bumps, lint fixes, purely mechanical work
- When you've just completed a near-identical task and the plan is genuinely
  boilerplate

## Prerequisites

- A plan exists — a spec document, epic body, sub-issue body, or at minimum
  a clear statement of what you're about to do
- Upstream retro available (optional but strongly preferred) — if the
  previous phase produced a `mini-retro`, load it as input
- Tracker access — to post the futro artifact + edit affected issue bodies
- File access — to update spec documents if the work is spec-driven

If you're a fresh-context agent running a futro without memory of prior
work, **read first**:

- Any referenced upstream retros (issue comments, spec sections)
- The spec / epic / issue body
- Recent commits touching related files (`git log --oneline -30 -- <path>`)
- The project's blindspot register if one exists (see § Blindspot register)

## Tooling

For GitHub-backed work, prefer MCP tools (`mcp_github_issue_read`,
`mcp_github_issue_write`, `mcp_github_add_issue_comment`,
`mcp_github_search_issues`, `mcp_github_list_issues`). The `gh` CLI also
works; always bound list/search output.

For pattern analysis (question 3), `git log`, `grep`, and reading related
past issues are the primary tools.

## Conceptual frame: Rumsfeld's four quadrants

A futro is structured around what we know and don't know about the work
about to begin:

| Quadrant             | What it contains                            | Technique                                                             |
| -------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| **Known knowns**     | The plan; stated assumptions                | Explicit assumption surfacing                                         |
| **Known unknowns**   | Specific questions we haven't answered      | Investigation / research spike                                        |
| **Unknown knowns**   | Patterns from prior work we haven't named   | Pattern analysis against repo / past phases                           |
| **Unknown unknowns** | Things we literally have no visibility into | **Agent-execution simulation** (primary), pre-mortem, blindspot check |

The goal is to move work **out of the unknown-unknowns quadrant** (where
it's highest-risk) into known-unknowns (knowable, investigable) or known-
knowns (understood), before execution starts. The workhorse for this move
is agent-execution simulation — the "what if?" thought experiment
documented in question 4.

## The procedure

### Step 1 — Gather inputs

Before answering any of the five questions, gather:

- The **plan** — spec section, epic body, sub-issue bodies in scope
- The **upstream retro**, if one exists — `mcp_github_issue_read` on the
  parent epic + `get_comments` for any retro comments; `git log --oneline
--grep="Mini Retro\|retro:" <branch>..HEAD`
- **Any retro addenda** — a phase that produced substantial work after
  its retro records it as a `Mini-Retro Addendum: …` follow-up comment
  (or an `#### Addendum (…)` spec subsection); see the `mini-retro` skill,
  § Retro addenda. The addendum carries
  the upstream phase's MOST RECENT learning and post-dates the retro,
  so scan all comments after the retro, not just the retro itself
- The upstream retro's **§ Scoped audit findings** subsection (as of
  `mini-retro` v2.0.0) — treat this as first-class input for
  question 4. Scoped-audit findings frequently name interaction
  pairs, cornerstone patterns, or AC-drift specifics that the four retro
  questions summarize loosely
- **Similar past work** — prior phases' retros, closely-related closed
  issues, grep for analogous patterns in the codebase
- The project's **blindspot register** if one exists (this skill ships a
  starter template at `references/blindspot-register.md`)

**Verification mandates at futro authoring time:**

- **PE-authoring grep mandate** (P5+P7+P8 retros) — every PE that
  cites code-as-implementation patterns (counts of matches, file
  paths, line numbers) MUST include the `grep` command + its actual
  output as cited evidence inside the futro. Transcribed counts have
  bitten futros (P7 PE7 cited "5 hits" when 4 was the truth; P8 PE9
  inherited a typo from a prior runbook).
- **Schema-`required[]`-enumeration mandate** (P6+P7+P8 retros) — any
  PE asserting conformance to schema X must enumerate every field in
  `spec.schema.required[X]` literally, not paraphrase. See blindspot
  register § "Schema-`required[]`-enumeration miss" for the canonical
  pattern.
- **Commit-hash citation discipline** (P8 retro Practice adjustment 3)
  — any commit-hash citation in the futro must be re-verified by
  `git log --oneline | grep <hash>` evidence at writing time, not
  transcribed from previous documents. PE9's `ef33b877` typo
  inherited from a P7-era runbook citation; the typo propagated
  through the futro until execution-time verification caught it.
  Same family as the PE-authoring grep mandate at the commit-hash
  layer.
- **Artifact-inspection mandate** (#2545 Phase B AD11) — any futro
  proposing to **operate on** an artifact (state file, snapshot, dump,
  config, lockfile, generated bundle) MUST inspect that artifact's
  current shape before drafting adjustments. Minimum inspection:
  size (`wc -c`, `ls -la`), modification time, and — for state-bearing
  files — a content sanity check (`tofu state list`, `psql -c \dt`,
  `jq '. | keys'`, etc.). Adjustments drafted from the plan's
  description of the artifact, rather than the artifact itself, are a
  recurring source of phantom-requirement futro adjustments. AD6 of
  #2545 proposed a "zero-diff `tofu plan` gate" against a 0-byte state
  file; one `wc -c` would have prevented it.
- **Pairing-coherence probe mandate** (E253 retro Practice adjustment,
  2026-07-22; deferred PL-04 of audit #203) — when a plan consumes a
  MULTI-ENDPOINT platform surface (e.g. OIDC discovery + token +
  userinfo; publish + install; mint + verify), per-endpoint existence
  probes (a row of 200s) are INSUFFICIENT: the E253 login work burned
  4 debugging loops on endpoints that each answered 200 but rejected
  each other's artifacts (discovery advertised endpoints whose tokens
  userinfo refused — pspace#3281). The futro's probe plan MUST include
  at least one END-TO-END transaction across the paired endpoints
  (e.g. mint a token via the discovery doc's token endpoint, then
  spend it at the paired verification endpoint), not per-endpoint
  200s alone. If the full transaction cannot run pre-execution, name
  that explicitly as an accepted unknown in question 2.
- **Platform-substrate probe mandate** (scaffold#246; Birdwork BS-5) —
  any substrate precondition that names a possibility.space API, route, MCP
  surface, or platform verb MUST cite a fresh transcript from
  `node scripts/pspace-probe.mjs verb <path> <METHOD> --api <api-name>`
  (the helper can derive a candidate name for tenant routes, but an explicit
  catalog name is stronger). The probe must use the **exact verb** the design
  depends on. The manifest is API-advertisement-only. The MCP phase proves only
  initialize → `tools/list` → `tools/call` protocol success; catalog content is a
  **human-inspection lead, never machine evidence** for API/route presence,
  absence, or verb support. The helper always reports catalog comparison as
  `manual-required`. The exact runtime verb is authoritative for method
  support/absence; GET does not prove POST/PUT/DELETE. A sub-agent's
  platform finding is a **lead only**: the futro orchestrator re-runs the
  probe before the finding enters the futro or changes the plan. Never
  promote a prior summary, raw 404, raw MCP 406, or single catalog result
  into a substrate fact.
- **Heading-convention pre-grep mandate** (M64 P1.5 E2/E3/E5/E4
  retros — 4 consecutive futros without an MD001 retry after
  adoption) — before authoring a new futro (or any markdown artifact)
  in a domain that already has sibling artifacts, capture the
  prior siblings' heading convention with
  `grep -nE '^#+ ' <prior-sibling>.md`. Match it. The first M64
  P1.5 futro (E2) failed markdownlint MD001 because it used
  `### N. ...` (H3) when the project convention visible in
  `docs/planning/m55-platform-contract-surface/futro-e2371-phase2-kickoff.md`
  was `## N — ...` (H2 em-dash). E3 adopted the pre-grep and the
  next four futros (E3/E5/E4 + the early M64 substrate work)
  committed first-attempt with no MD001 retry. **Promoted from the
  E4 retro's threshold-met note.** Two seconds of grep prevents the
  re-stage-and-retry cycle that prettier + markdownlint impose on
  the first commit of every cluster's first futro.
- **Base-divergence check for versioned / changelog artifacts** — when
  the work will author a **monotonic version number, sequential
  identifier, or changelog entry** on a shared artifact (an ADR's
  sequential number, a Capability `.kno` schema version, any file with a
  `> **Version:**` header or a changelog the project lints for
  provable-truth), the Step-1 inputs MUST include a divergence check
  against the integration target: `git fetch origin main` then
  compare the artifact's version / number on the branch vs. on
  `origin/main`. A version number is a **claim about history** — if the
  branch's base is stale, `main` may have independently authored the same
  version (or ADR number) for a different change, and the collision is
  invisible until landing (or until a provable-truth lint flips WARN→FAIL
  on commit). The futro's question-1 assumption list MUST state the
  branch's base freshness explicitly ("this branch is N commits
  behind `origin/main`; the latest ADR / version on `main` is …"), not
  assume it. **Origin:** a sibling project authored a new version of a
  shared versioned doc on a branch hundreds of commits behind `main`,
  where `main` had independently shipped the same version — caught only
  at the post-close landing review, not by the kickoff futro (whose
  substrate check verified the files _existed_ but never checked _base
  divergence_). In the origin project this was later enforced by a
  changelog-collision lint; scaffold has no such gate yet, so this
  mandate makes the futro surface it _anticipatorily_ so the collision
  is designed around, not discovered at landing.

Don't fabricate from memory. A futro written without reading the plan is
worse than no futro — it produces false confidence. A futro written
without inspecting the artifacts the plan operates on is the same
failure one layer down.

### Step 2 — Answer the five questions

Every futro has exactly these five sections. Do not invent new ones; the
structure is what makes futros cross-searchable for future agents.

**1. What do we know and what are we assuming?**
State the plan in your own words (or quote it). Then state the
assumptions the plan relies on that are NOT in the plan text. If an
assumption feels obvious, it especially belongs in this list —
obvious-feeling assumptions are where plans break silently.

**Substrate-precondition sub-question (mandatory).** Before moving on,
explicitly answer: _"What does this work assume EXISTS in the running
target environment, and have we verified it?"_ Enumerate every
substrate primitive the ACs presuppose — auth flow, federation broker
/ IdP, capability runtime, schema column, well-known endpoint, queue,
role, env var, third-party API, deployed adapter, etc. For each, name
the verification evidence (`kcadm get realms/<r>`, `psql \d`, `curl
/.well-known/<doc>`, `grep -rn <capability> <source-dir>`, `gh api …`). An
unverified substrate assumption is the highest-frequency cause of
"sub-issues that decompose cleanly but cannot execute." See
blindspot-register § "Substrate-precondition assumption inherited
from issue body" for the canonical instance (Epic #2647 / S1 #2648).
For possibility.space surfaces, generic existence evidence is insufficient:
cite the verb-matched, multi-surface probe transcript required above.

**Build-vs-adopt re-validation sub-question (when applicable).** If the
spec or Epic governing this work carries a `## Build-vs-Adopt` answer (or
the question is live under doctrine §1 pSpace-first + development-
principles' *Prefer adopt / extend / contribute before building from
scratch*), re-validate it against current reality. Standards move: a
Build answer from six months ago may be an Adopt today, and an Adopt
target may have been abandoned upstream. If the answer drifted, adjust
the plan before execution and record the drift — append a NEW row to the
repo's build-vs-adopt register if it keeps one (append-only; never edit
the original row), otherwise capture it as an ADR. Skip with a one-line
note when no governing answer exists (pure ops/bugfix scope).

**2. What known unknowns need investigation?**
Questions you know you have not answered. Each becomes either:

- An investigation task (spike, read, ask) to run before execution
- A documented "proceeding without this answer because {rationale}"

**3. What patterns from prior work apply that we haven't named?**
Positive pattern-matching. Have we done something structurally similar
in this project before? What worked in that instance? What didn't?
Cite specific commits, phases, issues. Prior Mini Retros are a rich
source.

**4. What could we be missing?**
The hidden-risk question. Apply four techniques, in order of primacy.
The first is the workhorse; the others complement it.

- **Agent-execution simulation** _(primary)_ — the "what if?" thought
  experiment. Pick a specific agent archetype (fresh AI agent with
  only the issue body; future-you two weeks from now; a parallel-
  channel agent; a colleague) and walk their execution forward step
  by step. At each decision point, ask: "What if they interpret X as
  Y instead of Z? What if they skip this step? What if the state
  they encounter differs from what we expect?" The value isn't in
  the mental walkthrough — it's in naming the decision points where
  a real agent will trip. See `references/techniques.md` § 1 for the
  "what if?" scaffolding library.

- **Pre-mortem** — imagine the work failed in 1 month and produced a
  broken outcome. What's the most likely failure mode? What would
  the post-incident review say we should have seen coming? Where
  simulation walks forward from the plan, pre-mortem works backward
  from a broken outcome — they surface different classes of risk.

- **Blindspot check** — consult the project's blindspot register.
  For each blindspot listed, ask: "Does this work trigger the
  pattern?" Be honest. Also: are there new patterns surfacing here
  that deserve register entries?

- **Honesty check on the simulation** — if simulation returned
  nothing, pick a different agent archetype and run again. The most
  common failure mode of a futro is simulating too gracefully.

**5. What adjustments or investigations must happen BEFORE execution?**
The output. Based on 1–4, what concrete actions come out of this
futro?

- Plan edits (spec section revised, sub-issue AC added, phase
  reordered)
- Investigation tasks (spike issues opened, or todo list entries)
- Documented unresolved assumptions (we're proceeding without this
  answer because…)
- New blindspot entries (if the futro surfaced a systematic weakness
  not in the register yet)

**AC-authoring discipline — the literal-grep trap** (M64 P1.5 E3
AC #2, E4 AC-F2 — promoted at 2 instances per the E4 retro's
threshold). Any AC the futro adds that asserts "OLD framing X is
gone" via a literal substring grep MUST be refined at futro-
authoring time to distinguish the OLD framing from LEGITIMATE-
new-context usage of the same tokens. The trap: a sweep-and-replace
Epic writes an AC like `grep -c "three models|trio process" file = 0`,
but the rewritten file legitimately says "the other **three models**"
(3 peers in the 4-roster) and references "the **trio process**" in
its migration-history section. The literal AC is impossible to
satisfy; the semantic intent IS satisfied. Refining at verification
time corrupts the audit trail (the AC reads as "refined to pass"
post-hoc). Refining at futro authoring time is honest. **Mechanical
test:** for every AC of the form `grep -c '<OLD-tokens>' <file> = 0`,
ask: "Does the rewritten file contain ANY legitimate usage of those
tokens — in migration history, in cross-references to predecessor
work, in proper-noun framings (capability names, agent names) that
happen to overlap the OLD framing?" If yes, write the AC as a
regex that captures only the OLD framing
(e.g. `grep -cE "of three models|the .trio process."`), and cite
in the AC body which legitimate prose is being excluded.

If the plan holds as-is, state "No adjustments needed" explicitly.
Empty section is not an answer.

See `references/template.md` in this skill's folder for the output artifact
frame. See `references/techniques.md` for deeper guidance on simulation,
pre-mortem, and pattern analysis.

### Step 3 — Be specific

Bullets beat paragraphs. Names, file paths, issue numbers, commit shas
beat hand-waving.

| ❌ Vague                             | ✓ Specific                                                                                                                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "We need to think about concurrency" | "Known unknown: does `pg_advisory_xact_lock` release if the connection is killed mid-txn? (investigation: read postgres docs + write a probe test)"                           |
| "Similar to what we did before"      | "Pattern: matches the pspace-api/secrets lifecycle work (commit `a3b1c`); applied FNV hashing + sorted lock order there too"                                                  |
| "Might be tricky"                    | "Blindspot check: we systematically underestimate migration work (register entry #2); this touches installed_capabilities + external_capability_endpoints — factor 1.5× time" |

### Step 4 — Write the artifact(s)

The futro has two homes (same pattern as mini-retro):

1. **In the spec document** (if the work is spec-driven) — populate the
   `### Futro: Phase N` placeholder at the start of the phase section
2. **As a comment on the Epic / umbrella issue** — what future agents and
   the user will read when context-switching to execution

Write both. Use the template at `references/template.md` as the frame.

### Step 5 — Propagate adjustments immediately

Futro without propagation is half-done. For each adjustment in question 5:

1. **Edit affected issue / spec sections on the tracker** — don't defer
2. **Open investigation tasks** — add to the agent's todo list AND file
   on the tracker if they'll persist beyond the current session
3. **Update the blindspot register** if a new blindspot was discovered
4. **Document unresolved assumptions** in the spec or epic comment so
   they stay visible to whoever executes the plan

**Commit-ordering rule (P8 retro Practice adjustment 2):**

If the work has any executable phase (any task that produces a code
commit), the futro spec edit + Epic comment MUST be committed BEFORE
the first task-execution commit. P8 demonstrated the consequence of
NOT doing this: T1-T4 task commits landed before the futro commit, so
`git log --oneline` reads as if T1-T4 happened with no futro context.
The futro is the FIRST commit of a phase; subsequent task commits
reference it.

Implication for `begin-delivery` orchestration: Step 2 (futro) MUST
include a commit step. Don't pass execution-control to Step 3 (load
tasks) until the futro commit is in the history.

### Step 6 — Close out

- Confirm the futro comment has been posted and the spec updated
- Verify all flagged investigations either have tasks or a documented
  "proceeding without" decision
- Announce readiness for execution

Only then does execution begin.

## Blindspot register

A project that runs futros regularly benefits from a **blindspot register**:
a living document that accumulates systematic weaknesses identified across
phases.

Each futro's question 4 consults the register. Each futro that surfaces a
NEW blindspot adds an entry.

A starter template lives at `references/blindspot-register.md` in this
skill's folder. Copy it to your project's docs directory (e.g. under
`docs/`) when your first futro surfaces a blindspot worth cataloguing.

## Notes

- **This is a discovery practice, not a code practice.** It produces prose
  - issue edits + investigation tasks. Its value is in the discipline of
    the five questions + the explicit propagation step, not in any specific
    tool invocation.
- **Honesty beats polish.** A futro that reports "we're probably going to
  underestimate the migration again" is worth more than one that buries
  the risk in euphemism. If the answer to question 4 is genuinely "we're
  confident we see everything," that's either true and boring, or it's a
  sign you haven't simulated hard enough.
- **Futro volume matters.** Once a project has run several futros, the
  upstream retros + blindspot register become significant inputs. Early
  futros will lean heavily on the spec + pattern analysis; later ones
  get the advantage of accumulated learning.
- **Pairs with `mini-retro`.** The retro produces what this skill consumes.
  If no retro exists (first phase of a project, or the prior phase skipped
  its retro), proceed anyway — but note the absence in question 1.
- **Invoked by `begin-delivery`.** When running `begin-delivery` for an
  Execution-Epic kickoff, this skill is the methodology for `begin-delivery`'s
  futro step. A Discovery-Epic kickoff (e.g. `begin-exploration`, if present)
  deliberately does NOT invoke a futro — the anticipatory ceremony's Q4/Q5
  contaminate the substantive methodology that IS the Discovery execution.
- **Proportional planning.** Scale the futro to the work — a small reversible
  change gets a short futro; over-planning is itself an anti-pattern.
- **Rule of three.** If the same risk or blindspot has surfaced three times
  across futros, it is a systematic weakness — promote it to the blindspot
  register, don't just re-note it.

## Repo-specific integrations

- **scaffold:**
  - The reflective counterpart is the `mini-retro` skill — it ensures the
    prior phase's learnings feed this futro.
  - Delivery, issue/PR, and review conventions live in
    [`github-delivery-workflow.instructions.md`](../../../.github/instructions/github-delivery-workflow.instructions.md);
    phase / Epic naming in
    [`milestone-phase-naming.instructions.md`](../../../.github/instructions/milestone-phase-naming.instructions.md).
  - Grounding rows (doctrine + Accepted ADRs + development principles) for
    question 4 live in
    [`cornerstone-conformance.md`](../../../docs/architecture/cornerstone-conformance.md).
  - Prior retros accumulate as issue comments on Epic umbrellas; discover
    via `gh api repos/{owner}/{repo}/issues/{number}/comments --paginate -q '.[] | {author: .user.login, body: .body[0:300]}'`.
  - Blindspot register (when created) conventionally lives under `docs/`.

- **Other repos:** if a similar instruction file exists, defer to it.
  Otherwise, the five-question structure is a reasonable default.

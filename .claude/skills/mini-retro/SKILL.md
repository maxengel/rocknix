---
name: mini-retro
description: Run a structured phase/epic retrospective at the end of a meaningful chunk of work. Produces a four-question retro (what worked, what was hard, what we discovered, what adjustments are needed), a lightweight scoped audit (Step 2.5 — spot checks enumerated in references/scoped-audit.md, including a UI-review check for UI-touching phases if a design-review/visual-QA process is present), and a practice-adjustments subsection. Posts it to the tracker and propagates learnings to downstream issues. Use when the user says "mini retro", "end of phase retro", "wrap up this phase", "retro this work", or when a phase/epic has just completed its code work and is about to transition to the next. Reflective counterpart to the `futro` skill (anticipatory). `begin-delivery` (Execution Epics) orchestrates this retro at Epic close (as does `begin-exploration` for Discovery Epics, if present) — reflective ceremonies don't bias outcomes the way anticipatory ones do, so this skill is shared.
license: Apache-2.0
metadata:
  execution: serial
  version: 2.7.0
  origin: Imported from birdwork-preflight .claude/skills/mini-retro; adapted for scaffold (bedrock→cornerstone; foreign refs softened).
---

# Mini Retro

Run a structured retrospective at a phase boundary. Produces forward-propagating
learnings, not a ceremony.

## Execution discipline — SERIAL (hard gate)

This skill is **stage-gated**: every stage consumes the *settled* output of the stage
before it. Run stages **strictly in order, under ONE orchestrator, never in parallel**
— fanning stages out to concurrent agents/sessions voids the guarantees (origin:
2026-07-08, an agent parallelized a code-auditor run). In-stage sub-agents are allowed
only where a stage explicitly says so. Swarm rule: while this skill is active on a
scope, other agents pause mutations on that scope until it completes
([serial-execution-gates](../../../.claude/rules/serial-execution-gates.md)).

## Core principle: retros are actionable artifacts

Every finding MUST produce at least one of: a code change already made, an
issue body / AC edit, a new follow-up issue, a doc / runbook edit, a skill /
instruction edit, or a tracker comment that redirects in-flight work.

A finding without an artifact is a finding the next agent will not act on.
This applies in both directions:

- **Improve the work just done** — defects, partial ACs, and pre-existing
  bugs surfaced during the phase become commits, issue edits, or follow-up
  issues filed in the **same session**. "Defer to later" is only valid with
  a tracked issue link (per development-principles' *Discovered failure =
  explicit work*).
- **Improve future work** — process gaps, prediction miscalibration, and
  skill blindspots surfaced in §4 adjustments and § Practice adjustments
  become **edits to this skill, the `futro` skill, the `code-auditor`
  skill, or related instruction files** — in the same session, not later.

If a retro finishes and nothing in the codebase, tracker, or skills has
changed as a result, the retro has not actually run. Step 5 below is the
enforcement step.

## Scope tiers

Retros nest recursively. Each tier consumes findings from the tier below,
so nothing is audited from scratch at higher levels.

| Tier          | Trigger                                    | Artifact location                        | Audit intensity                                           | Timebox |
| ------------- | ------------------------------------------ | ---------------------------------------- | --------------------------------------------------------- | ------- |
| **Phase**     | End of each phase inside an Epic           | Inline in retro (tracker comment + spec) | Scoped audit (spot checks incl. a UI review for UI, if present — Step 2.5) | ~30 min |
| **Epic**      | End of Epic (all phases code-complete)     | `logs/audits/YYYY_MM_DD-epic-*/` + retro | Full `code-auditor` skill, Epic scope                     | ~2–4 hr |
| **Milestone** | End of Milestone (all Epics code-complete) | `logs/audits/YYYY_MM_DD-milestone-*/`    | Full `code-auditor` skill, Milestone scope                | ~4–8 hr |
| **Project**   | Long-pause resume, re-architecture, chapter boundary | `docs/retrospective/` dated set | `retro-sweep` skill (three-movement sweep; experimental) | ~1 day  |

This skill covers the **Phase** tier. For **Epic** and **Milestone** tiers,
defer to the `code-auditor` skill; this skill's output still applies
(each phase retro is an input to the next tier's audit). For the
**Project** tier (portfolio-wide, counterfactual), defer to the
[`retro-sweep`](../retro-sweep/SKILL.md) skill — it composes this skill's
Step 2/3 methodology at milestone grain.

## When to use

Run when any of these is true:

- A phase inside a product spec has been marked code-complete
- An Epic umbrella has had its last sub-issue closed (run the Phase-tier
  retro for the final phase; the Epic-tier audit runs separately via
  `code-auditor`)
- A multi-commit feature branch is ready for PR and has taught you things
- Work is about to be handed off to another agent / session
- The user says "mini retro", "phase retro", "wrap this up", "retro this work"

**Do NOT skip it** because "we'll remember what we learned." You will not, and
the next agent certainly won't.

## When NOT to use

- Single-issue fixes with no learning content
- Pure dependency bumps / mechanical lint fixes
- Mid-phase (per-issue micro retros are separate — see the repo's
  issue-workflow instruction if it has one, otherwise do them inline as a
  commit-message postscript)

## Prerequisites

- The work being retro'd is **code-complete** — tests green (or any failures
  documented as pre-existing), commits landed, branch in a sharable state
- You have access to:
  - The commit history for the phase (`git log --oneline <phase-start>..HEAD`)
  - The Epic / spec / milestone document for context
  - The tracker (GitHub issues via MCP, Jira, Linear, etc.) for posting

If you're a fresh-context agent without memory of the phase's work, **read
commits and file diffs first**. Writing a retro from nothing is not acceptable.

## Tooling

For GitHub-backed work, prefer the GitHub MCP tools
(`mcp_github_add_issue_comment`, `mcp_github_issue_read`,
`mcp_github_issue_write`). The `gh` CLI also works; always bound list/search
output with `--limit N --json <fields>`.

For other trackers, apply the same pattern conceptually.

## The procedure

### Step 1 — Gather evidence

Before writing anything, reconstruct what the phase actually did:

```bash
# Commits on this branch since it diverged
git log --oneline <base-branch>..HEAD

# File changes per commit
for sha in $(git log --reverse --format=%h <base>..HEAD); do
  echo "=== $sha ==="
  git show --stat $sha | head -20 | tail -12
done

# Test delta (if the repo has a test suite)
# Run the tests and note pass count before / after, or check CI status
```

Also read:

- The Epic / umbrella issue body
- The spec document's phase section (if there is one)
- Recent comments on sub-issues (they often contain findings worth surfacing)
- **The prior 3–5 phase retros from the same Epic / Milestone**, scanning specifically for "this fooled us once" notes, scoped-audit FAIL/PARTIAL findings, and recurring discoveries. These are the seed material for new blindspot-register entries — most high-value blindspot entries come from harvesting two or more prior retros' surprises into a named pattern, not from inventing them at retro-time. (Origin: Possibility Collaboration v1 Phase 11.7 retro — 3 substantive blindspot entries all came from walking Phases 5–10 retros.)

### Step 2 — Answer the four questions

Every retro has exactly these four sections. Do not invent new ones.

**1. What worked well?** — Patterns, tools, sequencing, artifacts that were
genuinely effective. Reinforce them for future phases.

**2. What was harder than expected?** — Friction, unexpected complexity,
miscalibrated estimates, tooling failures, process gaps. Future agents look
here to avoid the same pitfalls.

**3. What did we discover?** — New information not available during planning.
Technical discoveries, requirement clarifications, pre-existing issues
surfaced by the work, scope gaps uncovered. **Findings from Step 2.5
(scoped audit) feed this section.**

**4. What adjustments are needed?** — Based on 1–3, specific changes to
remaining phases / issues. Options:

| Adjustment Type   | When to Apply                                             |
| ----------------- | --------------------------------------------------------- |
| **Reorder tasks** | Dependency discovered that changes optimal sequencing     |
| **Add tasks**     | Gap identified that the remaining plan doesn't cover      |
| **Remove tasks**  | Work in this phase made a future task unnecessary         |
| **Modify tasks**  | Approach needs to change based on what was learned        |
| **Adjust scope**  | Phase revealed scope is too large or too small            |
| **No changes**    | Plan holds — **explicitly** state "No adjustments needed" |

"No adjustments needed" is a valid answer. An empty section is not.

**Friction signals are prevention triggers.** Anything that slowed you down — a confusing doc, a missing guard, a repeated manual step — is a signal; capture it under Q2, not just as venting. Apply the **rule of three**: when the same lesson surfaces a third time, promote it from a recurring retro note to a durable instruction or lint (eliminate the *category*), rather than recording it a fourth time.

A canonical template lives at `references/template.md` in this skill's folder
(view it if you need a starting frame).

### Step 2.5 — Scoped audit (spot checks; see references/scoped-audit.md)

After Step 1 (evidence gathering) and Step 2 (writing the four
questions), run a lightweight **scoped audit** before committing the
retro. The scoped audit is a 30-minute adversarial check that catches
defects the four questions don't naturally surface — AC-bullet
drift, cornerstone violations, interaction defects, futro-prediction
drift, pre-existing test failures, and (for UI work) visual / a11y /
token-conformance defects a design review would catch if a
design-review / visual-QA process is present.

Full procedure in [`references/scoped-audit.md`](references/scoped-audit.md).
Summary:

1. **AC conformance scan** — every AC bullet has commit evidence.
   For phases that **remove a code path / schema / surface**
   (migration, anti-resurrection, deprecation), also run the
   **Migration AC pre-flight**: audit each AC for whether its failure
   mode still exists in the post-migration system, and post an AC
   reconciliation comment **before** the closeout comment listing any
   bullets supplanted or made structurally impossible by the
   migration (with the replacing mechanism named inline). See the
   scoped-audit reference for the full procedure.
2. **Cornerstone spot-check** — ~5 repo-specific pattern checks against new files
3. **Interaction-defect scan** — any shared-state pairs that weren't combo-tested? (Shared state includes cross-layer pairs: **network ACLs** between compute resources and firewalled data-plane resources count, not just in-process state like Postgres × cache. See `references/scoped-audit.md` Check 3.)
4. **Futro prediction verification** — ratio of confirmed predictions; flag low calibration
5. **Housekeeping scan** — full-suite test run; classify any failures
6. **UI-review artifact (only if a design-review / visual-QA process is
   present)** — when the phase touched UI: confirm the design review ran
   (page-scale mode) against the affected route(s), all BLOCKER/MAJOR
   findings were resolved before code-complete, and the artifact path +
   environment are linked from the closing comment / retro. MINOR/COSMETIC
   findings get appended to the retro's §3 discoveries (track every
   deferral as an issue, per development-principles' *Discovered failure =
   explicit work*). Skip with an explicit "no UI surface touched" note if
   the phase was purely backend / docs / tooling (scaffold today is docs +
   bootstrap scripts, so this is usually a skip).
7. **Harness self-coverage scan** — if the phase shipped a new lint /
   pre-flight / test harness / deploy gate, does it cover the failure
   modes encountered while landing it?
8. **Documentation & glossary freshness** — the completion-ceremony
   counterpart to the kickoff-time cornerstone/substrate checks. Just as
   `begin-delivery` runs cornerstone + substrate checks when work _starts_,
   the retro runs a documentation update when work _completes_. Verify:
   (a) any **new or changed platform proper noun** the phase introduced
   (a new schema name, primitive, principle, surface, role, capability
   kind) has a **glossary entry** (if the repo maintains a glossary) — or a
   follow-up issue to add it; (b) any doc the phase made **stale**
   (architecture docs, runbooks, READMEs, instruction files describing the
   changed surface) is updated in the same session or has a tracked
   follow-up; (c) for schema / Capability-`.kno` phases, the relevant
   catalog and changelog surfaces are reconciled. A new noun that ships
   without a glossary entry is a polysemy waiting to happen. Skip with an
   explicit "no new proper nouns / no docs made stale" note for pure
   bugfix / tooling phases. Findings → §4 adjustments (or a follow-up issue
   per development-principles' *Discovered failure = explicit work*).
9. **Build-vs-adopt honor check (if the repo records build-vs-adopt
   answers)** — scaffold's doctrine §1 (pSpace-first, with an escape
   hatch) and development-principles' *Prefer adopt / extend / contribute
   before building* are the governing rule. Did the phase honor the
   build/adopt answer its spec / Epic recorded? A spec that said **adopt**
   but shipped bespoke code is a FAIL; a **build** path whose adoption
   survey (named standards + disqualifying gaps) was never documented is a
   FAIL; an **extend** path whose upstream gap-filing never happened is
   PARTIAL (file it now or track it). If the answer materially changed
   mid-phase, record the reversal (append, don't edit). Skip with a
   one-line note for pure bugfix / docs / mechanical-migration phases, or
   when no build-vs-adopt answer was recorded.

Each check produces a verdict (PASS / PARTIAL / FAIL / SKIP /
UNTESTABLE) + optional finding. Findings feed the retro's Step 2
sections (usually §3 discoveries or §4 adjustments); pre-existing
failures go to a dedicated § housekeeping.

**Scope boundary:** the scoped audit is the **Phase-tier** audit.
For Epic and Milestone audits, defer to the `code-auditor` skill —
that skill produces dated `logs/audits/` folders and multi-file
artifacts. The scoped audit lives inline in the retro.

**Skip the scoped audit only if:**

- Single-commit fix with no new files and no new behaviour
- Pure mechanical refactor (no semantic change)
- The full `code-auditor` skill is about to run anyway (final phase
  before PZ)

For all other phases, run the checks.

**Delegate (don't skip) when an Epic-tier audit already covers this scope.**
If the `code-auditor` skill has already produced a dated artifact under
`logs/audits/` whose scope subsumes this phase's delta (same branch, same
time window, same files), an individual check MAY delegate to a specific
row or section of that artifact instead of re-deriving. Requirements:

1. The audit artifact path AND the specific row/section MUST be cited
   inline in the check's verdict line (e.g. `PASS ✓ — see
logs/audits/2026_05_14-epic-m22.../03-retrospective.md § Cornerstone
Conformance row 3`).
2. The audit artifact MUST be on the same branch HEAD (no new commits
   since it ran that change the check's evidence).
3. Delegation applies per-check, not blanket. Checks whose scope is
   strictly the phase delta (e.g. AC conformance for sub-issues this
   phase closed) should still be run inline.

Delegation is the right move when an Epic-tier audit ran AT the phase
boundary (e.g. final phase of an Epic produces both the phase retro
and the Epic audit in the same session). Re-deriving the same cornerstone
conformance table or interaction-defect scan duplicates work without
adding adversarial value. Origin: M22 FOUND-P4 (#2510, 2026-05-14).

### Step 3 — Be specific

Bullet points beat paragraphs. File paths + issue numbers + commit shas beat
hand-waving. Examples from well-written retros:

| ❌ Vague                     | ✓ Specific                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| "Testing went well"          | "Drift-guard tests (`X.test.ts`) caught Y class of regressions cheaply (< 150 LoC each)"                     |
| "Some pre-existing failures" | "`capability-agent-cards.test.ts:296` + `route-kno-sync.test.ts` broken on `main` pre-session"               |
| "Should fix the lockfile"    | "`vite@8.0.8` pin in `services/pspace-api/package-lock.json` — file opens as issue #XXXX"                    |
| "Good tests"                 | "23 cartesian test cases covered internal lifecycle × verdict and external status × circuit × consumer-kind" |

If you find yourself writing "it went well" or "no major issues", you haven't
looked hard enough at what was harder than expected.

### Step 4 — Write the artifact(s)

The retro has two homes:

1. **In the spec document** (if the work is driven by a spec in
   `docs/planning/<feature>/<feature>-spec.md` or similar) — replace the
   `### Mini Retro: Phase N` placeholder with the populated retro
2. **As a comment on the Epic / umbrella issue** — this is what the next
   phase's kickoff will read

Write both. Spec is the long-term archive; issue comment is operational.

Format on GitHub (adapt for other trackers):

```markdown
## Mini Retro: <scope>

**Completed:** <date>
**Scope of this retro:** <which sub-issues / commits / files were in scope>

**Branch:** `<branch>` (<N> commits).
**Delta:** <quantified change — test count, LOC, endpoints, whatever's measurable>

### What worked well

- <bullet>

### What was harder than expected

- <bullet>

### Discoveries that affect future <phases / issues>

- <bullet>

### Adjustments to remaining <phases / issues>

- <bullet> OR "No adjustments needed."

### Scoped audit findings (Step 2.5)

<Optional. See `references/scoped-audit.md`. Each check gets one line:>

- **AC conformance:** PASS / PARTIAL / FAIL — <finding, if any>
- **Cornerstone spot-check:** PASS / PARTIAL / FAIL — <finding, if any>
- **Interaction-defect scan:** PASS / PARTIAL / UNTESTABLE — <finding>
- **Futro prediction verification:** N/M confirmed (X%) — <table if useful>
- **Housekeeping (full-suite scan):** PASS / PARTIAL / FAIL — <classification>
- **Harness self-coverage:** PASS / PARTIAL / FAIL / SKIP — <finding, if any>

### Practice adjustments

<Optional. Use when the scoped audit, retro process, or chaining revealed
a gap in the mini-retro / futro / begin-delivery / code-auditor skills
(or `begin-exploration`, if present)
themselves. Examples: "Check 2's ESM spot-check produced no findings
this phase AND the last two — candidate for retirement." OR "Scoped
audit surfaced an interaction defect the futro missed; the futro
skill's § 4 agent-simulation should include a 'dual-write coordination'
archetype." Empty is acceptable; don't invent adjustments.>

- <practice-level observation>

### Housekeeping items (not blocking <next phase>)

- <bullet — optional; for pre-existing issues surfaced but out of scope>

### Code-verifiable state

| Sub-issue | Module | Tests   |
| --------- | ------ | ------- |
| <N>       | <file> | <delta> |

---

**Phase code-complete. Ready for <next phase> kickoff — suggest running `begin-delivery` (Execution Epic) next, or `begin-exploration` (Discovery Epic) if present. `begin-delivery` retrieves this retro, invokes `futro` for anticipatory analysis, then loads tasks; a Discovery-Epic kickoff retrieves this retro, verifies substrate prereqs, then invokes the substantive methodology directly.**
```

### Step 5 — Propagate forward

Retro without propagation is half-done. Apply the **actionable artifact**
principle from the top of this skill: every finding listed in steps 2,
2.5, and the practice-adjustments subsection must produce a concrete
artifact in this step. For each adjustment in section 4 and each finding
in the scoped audit:

1. **Edit the affected issue bodies** on the tracker (add a note, revise
   acceptance criteria, reorder, etc.) — don't just mention them in the retro
2. **Post a short comment** on each affected issue referencing this retro and
   explaining what changed
3. **File new follow-up issues** for every deferred AC, every found-failure,
   every "we should fix this later" — same session, with a link from this
   retro to the new issue and from the new issue back to this retro
4. **Edit skills / instructions** if § Practice adjustments surfaced a process
   gap. This is the feedback loop that improves future retros. Same session
   as the retro — not "later."
5. **Update the milestone / spec body** if task ordering changed
6. **Update the spec document** if ACs or phase scope changed

**Completion breadcrumb (prior-work grounding — ratified 2026-06-09).** Beyond
propagating _adjustments_, leave a forward trail of
what this phase **completed**, so a later agent cannot "assume-undone" work that
is in fact done. For each downstream issue whose ACs depend on, overlap, or
presuppose what this phase shipped:

- Edit the downstream issue to **reference the completed work as done** — name
  the delivering commit SHA / doc path / schema / endpoint, and where an AC0
  "dependency verification" bullet exists, tick or annotate it with that
  evidence.
- This is the close-time half of the discipline `begin-delivery` Step 1.7
  enforces at kickoff: the tracker is the durable memory; the retro writes
  done-state forward, the kickoff reads it back. A downstream issue that still
  reads "build X" after X shipped is an assumed-undone trap for the next agent.

Same actionable-artifact bar as the rest of Step 5: a real edit on the
downstream issue, not a mention in this retro.

Same-session is non-negotiable for items 1–4. If something genuinely cannot
be done in-session (e.g. requires user approval to file the issue), leave
an explicit follow-up task in the todo list AND name the gate so it doesn't
fall through.

### Step 6 — Close out

- Close the Mini Retro issue on the tracker (if the milestone uses one)
- Mark the phase complete in any status tracker
- Announce readiness for next phase to the user

### Step 7 — Retro addenda (post-retro emergent work)

If, **after** this retro is posted, the phase produces substantial
additional work — emergent remediation from a pre-merge review, a
reframing the user prompts, a found-failure chain, a new durable
artifact promoted from a post-retro learning — the retro is now stale.
Post a **retro addendum** rather than editing the retro in place or
writing a fresh retro:

- **Home:** the same home(s) as the original retro, linking back to it.
  Issue-comment milestones → a follow-up comment titled
  `Mini-Retro Addendum: <phase> <reason>` on the same Epic issue
  (commenting on a closed issue is fine — no reopen needed).
  Spec-doc milestones → an `#### Addendum (YYYY-MM-DD): <reason>`
  subsection beneath the original `### Mini Retro: Phase N`.
- **Content:** the same four-question lens applied to the post-retro
  work, plus a "why an addendum" line (what changed after the retro),
  plus a promotion table mapping each learning to its durable artifact
  (commit / instruction / skill / blindspot / issue) per the
  actionable-artifacts rule.
- **Bar:** only for work that produces or should produce a durable
  artifact — not trivia. Same bar as the retro itself.

The full rule (when / where / why-addendum-not-the-alternatives / how
it gets read) is captured in Step 7 below. Addenda are retrieved at the
same event-triggered points as the retro itself — `begin-delivery`
Step 1, the `futro` skill Step 1, and this skill's own Step 1
"read prior 3–5 phase retros" (and a Discovery-Epic kickoff's Step 1,
if `begin-exploration` is present).

## Notes

- **This is a process skill, not a code skill.** It produces prose artifacts
  and issue edits. The value is in the discipline of the four questions +
  the scoped audit + the propagation step, not any specific tool invocation.
- **Every retro should be searchable by future agents.** The four-section
  structure (plus scoped audit and practice adjustments) is what makes
  cross-retro search work — don't deviate.
- **Feeds the `futro` skill, invoked by `begin-delivery`.** An Execution
  Epic's kickoff (`begin-delivery`) retrieves this retro and passes it —
  including the scoped audit findings — to the `futro` skill as a primary
  input. A Discovery Epic's kickoff (`begin-exploration`, if present)
  retrieves this retro too but feeds it directly into substrate-prereq
  verification and methodology invocation — the futro step is
  intentionally absent there.
  The retro is reflective; the futro is anticipatory; both are required.
- **Consumed by the `code-auditor` skill at Epic / Milestone boundaries.**
  Every phase retro's scoped-audit section is input for the Epic-tier
  audit; every Epic audit plus every phase retro is input for the
  Milestone-tier audit. Higher tiers consolidate, don't re-run from
  scratch.
- **Honesty is more useful than polish.** A retro that reports "estimate was
  off by 2x because we didn't account for X" is worth more than one that
  buries the miscalibration in euphemism.
- **Skill self-improvement happens inside the retro.** The § "Practice
  adjustments" subsection is where patterns of defects NOT caught by
  the scoped audit, or patterns of futro predictions that repeatedly
  over/under-scope, get surfaced. Periodic skill revisions should
  promote consistently-useful checks and retire consistently-empty
  ones. The skill evolves from within its own use.

## Chaining with `futro`, `begin-delivery`, `code-auditor` (and `begin-exploration`, if present)

The Mini Retro produces output that both the `futro` skill and the
`code-auditor` skill consume. `begin-delivery` orchestrates the retro →
futro → next-Execution-phase handoff; a Discovery-Epic kickoff
(`begin-exploration`, if present) orchestrates
the retro → substrate verification → methodology invocation handoff
(no futro). `code-auditor` runs at Epic and
Milestone boundaries and consolidates findings from every phase
retro's scoped-audit section.

The full chain:

```
Phase N code-complete
   │
   ▼
mini-retro skill (this skill)
   │  Step 1: gather evidence
   │  Step 2: answer four questions
   │  Step 2.5: run scoped audit (spot checks — see references/scoped-audit.md)
   │  Step 3–6: write artifacts + propagate forward
   │  writes: spec § retro, Epic issue comment, adjusted downstream issues
   │
   ▼  (minutes to days may pass — retros are durable artifacts)
   │
Phase N+1 kickoff
   │
   ▼
begin-delivery skill (orchestrator)   [begin-exploration for Discovery Epics, if present]
   │
   ├──→  retrieves this retro from the tracker / spec
   │
   ├──→  invokes futro skill (anticipatory analysis)
   │         ├─ reads this retro as input
   │         ├─ reads the scoped-audit findings as input
   │         └─ writes futro: plan adjustments, investigations, blindspots
   │
   ├──→  loads granular tasks
   │
   └──→  execution pre-flight
   │
   ▼
Phase N+1 execution … (repeat) … last phase of Epic
   │
   ▼
code-auditor skill (Epic tier)
   │  Reads every phase retro's scoped-audit findings as input
   │  Runs the full 6-phase methodology (research / forward audit /
   │  retrospective / analysis / punch list)
   │  Writes to `logs/audits/YYYY_MM_DD-epic-*/`
   │
   ▼
Epic next → next Milestone phase … (recurse one level up) …
   │
   ▼
code-auditor skill (Milestone tier)
   │  Reads every Epic audit + every phase retro as input
   │  Writes to `logs/audits/YYYY_MM_DD-milestone-*/`
```

**Practice-adjustments feedback loop** (recursive improvement):

```
Phase N retro § Practice adjustments
         │
         │  "Check 2 produced no findings for 3 consecutive phases — retire"
         │  "Futro missed dual-write coordination pattern — add archetype"
         │
         ▼
Skill file revision (mini-retro SKILL.md, futro SKILL.md,
code-auditor SKILL.md, references/*)
         │
         ▼
Phase N+1 retro uses improved skills
```

Three things to note:

1. **Retro, futro, and scoped audit are three different practices.**
   The retro is reflective (looks back at completed work); the futro
   is anticipatory (looks forward at upcoming work); the scoped
   audit is adversarial (proves work was done correctly). All three
   are required for a phase. See the `futro` skill and
   `references/scoped-audit.md`.
2. **Future agents: read the retro first.** When arriving at a phase
   with a Mini Retro available, read it as your primary context
   source — INCLUDING the scoped audit findings. The `futro` skill
   uses both; you should too.
3. **Skill improvement is built into the chain.** The § "Practice
   adjustments" subsection of every retro is where the retro /
   futro / code-auditor skills themselves get refined. Treat it
   seriously — an empty subsection is fine, but a consistently-empty
   subsection across many retros suggests nobody's looking for skill
   gaps.

## Repo-specific integrations

- **scaffold:**
  - This skill is the procedure; scaffold has no separate `mini-retro`
    instruction file. Issue / PR / Epic delivery conventions live in
    [`github-delivery-workflow.instructions.md`](../../../.claude/rules/github-delivery-workflow.md);
    phase / Epic / milestone naming in
    [`milestone-phase-naming.instructions.md`](../../../.claude/rules/milestone-phase-naming.md).
  - Spec documents embed retro placeholders per phase only if the repo uses
    product specs (scaffold does not today).
  - The scoped audit grounds against
    [`cornerstone-conformance.md`](../../../docs/architecture/cornerstone-conformance.md)
    (see `references/scoped-audit.md` Check 2).

- **Other repos:** if a similar instruction file exists, defer to it. If not,
  the four-question structure in Step 2 is a reasonable default.

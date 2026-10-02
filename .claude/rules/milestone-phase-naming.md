---
description: "Milestone bodies hold the current ordered priorities; milestone/phase prefixes identify planned work independently of issue chronology. Read before creating, moving or renaming milestone work."
paths:
  - "**"
---

# Milestone order and issue naming

The milestone **description/body is the running execution plan**: current
priority, ordered phases, work within each phase, dependencies, status and
observable exit gates. An issue number is a link/identity, not its priority.
This rule loads every session because tracker work often precedes file edits.
D-WORKFLOW-139, #388.

## Sources of truth

- A named milestone uses `M{N}: {title}`, for example
  `M7: Rasteratops 0.0.1`. Read `M` from that **name**, never from the GitHub
  ordinal/URL. The explicit initial assignment of M7 is recorded in
  D-WORKFLOW-139; another host's ordinal must not rename it.
- Its body holds the binding ordered phase chain. Each phase names its
  outcome, current state, linked work and exit evidence. Mark the current
  priority and the next concrete action near the top. List explicitly later
  work separately. A phase-less milestone says it is phase-less.
- An Epic body lists its children in execution order. The milestone orders
  phases; the Epic orders the work within its scope. Neither is ordered by
  issue creation date or by the issue list's default sort.
- When body, title, saved session or a secondary plan disagree, reconcile
  them against the decisions/evidence and update the milestone and affected
  **open** titles in the same session. A summary/comment alone is not the fix.

Update the milestone body when work starts/finishes, a dependency or priority
changes, a retro/audit changes the route, an issue moves phases, or a session
hands off unfinished work. State the next unblocked action and retain the
reason/decision for a changed order. Re-read the live milestone and affected
issues after writes; do not claim an update from a prepared local file alone.

For releases, distinguish **source/build readiness**, **candidate image
qualification**, **RC designation**, and **publication**. Image-verification
criteria require an engineering build before they can close. They block the
RC claim until proved, not creation of the image needed for the proof.

## Title format

```text
M{N}[.P{phase}] [E{epicIssueNumber}[/{subId}]]: {description}
```

The space before `E` is present only when Epic scope is used; `:` immediately
follows the last prefix token and is followed by one space.

| Token | Meaning |
| --- | --- |
| `M7` | Canonical milestone identifier from its name |
| `.P1` | Phase declared in the milestone body; P0 is an optional gating pre-phase |
| `E354` | Optional reference to the owning Epic issue, not a priority or sequence number |
| `/H1` | Optional stable sub-id within that Epic; letter identifies kind of work |

Examples:

```text
M7.P1: Make cloud layout migrations repeatable
M7.P2: Preserve offline achievements through the proxy refresh
M7.P3: Qualify settings archives on the candidate
M7.P1 E354/H1: Reject unsupported layout markers
M7: Deliver and qualify Rasteratops 0.0.1
```

The last form is also allowed for an explicitly documented **milestone-wide
umbrella** spanning phases; it must not hide an unplaced actionable issue.
Omit P for a genuinely phase-less milestone. Optional E/sub-id scope does not
require creating or re-parenting Epics merely to decorate titles. An Epic's
own title has no `/subId`; existing real child relationships are preserved.

Sub-id letters are a closed set: **B** decisions/policy, **S** shipped surface,
**O** observability, **H** correctness/hardening, **R** refactor, **C** cutover,
**T** verification, **D** documentation, **I** infrastructure, **G** design/UI.
Numbers are sequential within each letter inside the Epic. **P is reserved**
for phases. A new letter requires a recorded decision.

## Reactive and unplaced work

Work not slotted into a milestone phase uses one of:
`Bug:`, `Incident:`, `Audit:`, `Ops:`, `Standing:`, `Backlog:`.
Once scheduled, replace the kind-tag with the M/P prefix; keep its labels
(a scheduled bug remains labelled `bug`). Standing work is not a fake P0.

## Moves, stability and adoption

- Phases start at P1; use P0 only for real pre-phase gates. Keep phase IDs
  stable once declared. An inserted phase may use a decimal such as P3.5;
  its name must appear in the milestone body. Do not renumber just to sort.
- Re-parenting changes the optional Epic/sub-id scope to the new parent's
  allocation. Update both Epic bodies and the open title, with a comment on
  the move. Preserve the issue's identity and evidence.
- **Never retitle closed issues.** They are historical records.
- New/moved planned work follows this rule. The initial retrofit covers all
  open M7 issues; other existing milestones are reconciled when adopted for
  active work, not bulk-renamed without reviewing their phase plans.
- M7.P1–P4 are the current remaining RC path; M7.P5 is later release staging.
  The older council contract's P0–P6 headings in #344 retain their original
  meaning. Cite those as `#344 contract P2`, for example. The milestone body
  maps the contract to execution phases; do not silently equate their numbers.

## Provenance and enforcement

Adapted from scaffold's `milestone-phase-naming.instructions.md`, whose
M/P/E convention and open-only retrofit were refined estate-wide on
2026-07-19. Read on 2026-10-02 at scaffold HEAD
`20c0a77dfa8654c1687375a7ae2f62b1d6e32fe5`; source SHA256
`d018af2b7b266978aed15563122c53eb136ddf96f914eaa7678893341e027fcb`.
The existing begin-delivery, futro and mini-retro references now resolve here.
The separate scaffold Forgejo workflow is not imported into this GitHub fork.

Local adaptations: explicit milestone-wide umbrellas, decimal-phase syntax,
phased adoption of old milestones, current/next/exit evidence in the body,
and separation of engineering-build and RC gates. These preserve this
project's release and issue-closing rules.

`tools/rules-check` checks routing/index presence, not live GitHub ordering.
Live body/title consistency requires readback; no automatic live naming gate
is claimed. The first adoption's before/after map and readback are retained
under `docs/qa-logs/2026-10-02-milestone-order/`.

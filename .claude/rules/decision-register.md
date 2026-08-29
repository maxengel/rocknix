---
description: "The append-only ledger of maintainer and operational decisions — when to write a row, when to read one, and why a settled choice should be cited rather than re-argued."
paths:
  - "**"
---

# The decision register

`docs/decision-register.md` is the single lookup table for decisions that shape
the work: maintainer calls, forks resolved during execution, assumptions
invalidated and replaced. It exists because those otherwise live in issue
comments, commit messages and chat, where the next session cannot find them —
so they get re-derived, contradicted, or quietly re-decided.

## The contract

- **Append-only.** A reversal or refinement is a **new row citing the old ID**.
  Never edit or delete a decided row; the history is the point.
- **One row per decision**: date, stable ID (`D-<AREA>-<n>`), the decision in a
  sentence or two with the operative choice in bold, and refs — the issue,
  commit, or comment where it was made or is evidenced.
- **Two sections.** `Decided` is the table; `Open decisions` holds real
  questions with a named home, so parked is not the same as forgotten. When an
  open one is settled it moves down as a row, keeping its ID.
- **Cite by ID.** Issue bodies, plans and work logs reference `D-CLOUD-003`
  rather than restating the argument.

## Write a row when

1. **The maintainer makes a call** — in chat or a thread. "We register no OAuth
   clients" is a decision; it was made once and should never be argued twice.
2. **A fork is resolved during execution** — two workable paths, one taken, even
   under granted discretion.
3. **A standing assumption is invalidated** and its replacement settles.
4. **A decision reverses an earlier one** — new row, cite the old ID.
5. **A genuine question is parked** — `Open decisions`, with its home issue.

Write it **in the same session the decision happens**. Deferred capture is how
these registers die.

Not register material: routine implementation choices with no fork, and plain
facts about what happened — those are work-log material.

## Read it when

- **Starting a chunk of work** — scan for rows touching the scope and treat them
  as binding unless the maintainer reopens them.
- **Before contradicting anything that looks settled.** If a row covers it, cite
  the ID and move on rather than re-deriving the argument.
- **At the end of a session** — sweep for decisions that were made and never
  written down.

## The other ledgers

| File | Holds |
| --- | --- |
| `docs/decision-register.md` | Decisions and open questions — this one |
| `docs/work-logs/` | The dated narrative; the register indexes it, never replaces it |
| `docs/blindspot-register.md` | Systematic weaknesses this project has committed |
| `.claude/rules/` | Durable practice, where a decision generalises into a rule |

A decision that generalises gets both: a row here, and a rule where the practice
belongs.

(Adapted from `decision-register.instructions.md` in the scaffold estate,
<https://forge.possibility.space/scaffold/scaffold>. Their ADR tier is dropped —
this project has no `docs/architecture/adr/`, and a decision big enough to want
one can carry its reasoning in the row.)

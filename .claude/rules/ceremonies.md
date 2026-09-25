---
description: "Which ceremony is owed and when -- a friction entry's issue, a mini-retro, the weekly and monthly summaries, the work-log index, the register lint, a blindspot's guard, a code audit, a futro -- as a state machine tools/ceremony-check reads from the record; what a missing one refuses (D-WORKFLOW-028, D-QA-040)."
---

# The ceremonies are a state machine, and a tool turns it

*No `paths:` glob, so this file loads every session: a ceremony is owed by the
calendar and the record, not by the file being edited.*

The skills that look back and forward -- `mini-retro`, `futro`,
`begin-delivery`, `code-auditor`, `council` -- ran at phase boundaries
through 2026-09-14 and not once in the nine days of release-candidate cuts
that followed, during which blindspots 47-52 were written. A ceremony tied
to a boundary never fires when the work has none. So the cadence is read
from the record by `tools/ceremony-check`, refused by the push guard when a
cheap artifact is missing, and kept red in the fork's CI while a long one is
owed (D-WORKFLOW-028; the numbers are D-QA-040, the maintainer's call).

Maintainer, 2026-09-23: *"Do we need to build this into our CI workflow
itself so that we're running some of these processes as state machines that
are mandatory, as opposed to things that are just optional?"* Yes.

## The states, their markers, and what each one costs when missed

| Ceremony | Marker the tool reads | Cadence (D-QA-040) | When overdue |
| --- | --- | --- | --- |
| Friction entry | a line in `docs/friction-log.md` with `issue: #N` or `guard` | an issue or a guard within 3 days of the line | **refuses a push of next** |
| Mini-retro (phase tier) | `docs/retros/<date>-<scope>.md`, or a work-log heading that says retro | every 5 active days, grace 2 | refuses a push |
| Weekly summary | `docs/work-logs/<yyyy_mm>-work_logs/<yyyy>-W<ww>-summary.md` | by the Tuesday after the week | refuses a push |
| Monthly summary | `docs/work-logs/<yyyy_mm>-work_logs/SUMMARY.md` | by the 3rd of the next month | refuses a push |
| Work-log index | `tools/work-log-index --check` | with every log entry | refuses a push |
| Register lint | `tools/register-check` | always | refuses a push |
| Blindspot guard | an entry from 52 on names a `tools/…`, `.githooks/…` or `.claude/rules/…` that exists | with the entry | refuses a push |
| Code audit (epic/milestone tier) | an issue titled `Audit:` / `Code audit`, or `docs/audits/<date>-*/` | after 12 completed closures or 14 days | **CI red**, the push goes through |
| Futro | `docs/futros/<date>-<scope>.md`, or a work-log heading that says futro | within 3 days of a new `epic` issue | CI red |
| Open checkboxes agent-verifiable | `tools/box-check`: no open `- [ ]` names a person or a device without a physical fact (D-QA-044) | always | CI red -- the fix is a tracker edit, as with issue hygiene |

The split is deliberate: a friction line, a retro, a summary and an index are
minutes, so a missing one stops the push until it is written; an audit is
hours, so it stops the badge, not the fix that is in hand. If a cheap gate is
ever bypassed with `--no-verify`, that is the friction entry to write.

The clock starts 2026-09-21. Nothing before it is demanded; a backlog nobody
can pay at once is how a gate gets switched off.

## The timescales (Pongogo's layers, adapted)

- **The day**: `docs/work-logs/<yyyy_mm>-work_logs/<yyyy_mm_dd>-work_log.md`,
  a timestamped entry per thing learned or decided, appended as it happens
  (`learning-capture.md`). The heading names the issue and the thing, since
  `tools/archaeology` finds entries by their words.
- **The index**: `tools/work-log-index --write` after an entry;
  `docs/work-logs/INDEX.md` lists every entry under its day, ISO week and
  month, so a month reads in a minute.
- **The week**: the retro writes `<yyyy>-W<ww>-summary.md` beside the day
  files -- what landed, what was hard, what changed in the rules, the
  blindspots added, the issues opened and closed -- from the index and the
  friction log, not from memory.
- **The month**: `SUMMARY.md` in the month's directory, from the weeklies:
  the arc, the decisions (by ID), the blindspots, what the next month starts
  with.
- **The registers** (`docs/decision-register.md`, `docs/blindspot-register.md`)
  and the rules are where a lesson becomes durable; the logs are where it is
  found. `tools/archaeology` reads all of them.

## What a blindspot entry owes

From entry 52 on, an entry names its guard -- the tool, hook, rule or suite
that now catches the shape -- in backticks, and the guard exists in the tree
when the entry is committed. An entry that ends in "be more careful" is not
an entry; `working-principles.md` says a rule broken twice moves up a stage,
and the stage above "written" is "audited". If no tool can catch it, the
entry says so in those words, and that sentence is the guard the check
accepts as honest.

## What a friction entry is

One line, the moment the work slowed: what slowed it, what would have
caught it, and the issue or guard. The mini-retro's second question ("what
was harder than expected?") is answered from this file. An entry without an
issue expires in three days and refuses the next push, which is the point:
a friction nobody owns is a blindspot in waiting. Filing the issue follows
D-QA-012 (the maintainer's words quoted, the same session).

## Running it

```bash
tools/ceremony-check          # the full report; exit 1 when anything is overdue
tools/ceremony-check --gate   # what the push guard runs
tools/archaeology <terms>     # before anything is called pending or new
tools/work-log-index --write  # after a work-log entry
```

The fork CI (`.github/workflows/fork-checks.yml`) runs the index check, the
register lint and `ceremony-check` on every push of `next` and daily, so a
ceremony owed shows as a red badge until its artifact exists. `fork-*`
workflows never reach an upstream PR (`fork-workflow.md`).

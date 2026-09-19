---
description: "The principles this project works by, and where each one is actually enforced. A map, not a restatement — every row points at the rule that does the work."
paths:
  - "**"
---

# Working principles, and where each is enforced

Adapted 2026-09-19 from the RAMD playbook (Awecelot Playbook v1, twelve
principles) at the maintainer's request. **Ten of the twelve already existed
here under our own names**, discovered by reading the rules rather than
recalling them. This file is the index: one line each, pointing at the rule
that does the work. It deliberately does not restate those rules — a second
copy is a second thing to drift.

Two were genuinely missing and are written out below. One is not adopted, with
the reason.

| Principle | What it means here | Where it lives |
| --- | --- | --- |
| **Evidence over opinion** | A claim about behaviour cites an artifact: a file's bytes, a row's timestamp, a process, a frame. | `engineering-practices.md` §*Verify the artifact, not the report*, §*A name is not a behaviour*; `issue-tracking.md` §*Ticking an acceptance criterion* |
| **Explicit over implicit** | A decision that is not written down will be re-argued; a lesson not logged is lost. | `decision-register.md`, `learning-capture.md` |
| **Preservation over deletion** | Mark superseded, don't erase. A decided row is never edited; a duplicate is never removed until its unique behaviours are listed. | `decision-register.md` (append-only), `engineering-practices.md` §*Before deleting a duplicate*, `worktrees.md` (`fork-worktree remove` refuses build output) |
| **Read, don't recall** | Rules are read from `next` in the current session, not remembered. See the pre-flight section below, which is new. | `instruction-files.md`, and **§Pre-flight** below |
| **Completion ≠ closure** | Delivered is not closed: the criterion is ticked from observed behaviour, the register and log are written, the issue is closed with the evidence named. | `issue-tracking.md` (closing discipline), `learning-capture.md` |
| **Urgency increases rigour** | **New.** See below. | **§Under pressure** below |
| **A promise is not a mechanism** | **New.** Report the running state and name what watches it, or say nothing is watching. | `engineering-practices.md` §*A promise is not a mechanism* |
| **Categorical prevention** | Fixing the instance is half; the other half is the guard that would have caught it, plus a blindspot entry. | `engineering-practices.md` §*A failure you find is yours to fix*, `docs/blindspot-register.md` |
| **Fail loudly / fail closed** | A check that cannot run has not passed, and the safe branch is the one a broken check falls into. | `engineering-practices.md` §*Guards must fail closed* |
| **Fix immediately, never defer** | The session that finds a defect fixes it, or says plainly that it did not and why. | `engineering-practices.md` §*A failure you find is yours to fix* |
| **Analysis before action** | Check design intent before "fixing" what looks wrong; stop and re-read after three fixes on one failure. | `engineering-practices.md` §*Verify design intent*, §*Stop after three fixes* |
| **Sustainability over speed** | The devices belong to a person who may be using them; an evening is a real cost. Ask before the reboot, every time. | `engineering-practices.md` §*Never reboot… without asking*, `vm-first.md` |
| **Creation over destruction** | *Not adopted* — see below. | — |

## Under pressure, do more checking, not less

**New, 2026-09-19.** Nothing in this corpus said it, and the day it was written
had four claims made without evidence, in one subsystem, while moving fast
towards a release candidate.

The pull is real: an RC is close, a build takes hours, a device is online for a
short window, the maintainer is waiting. The instinct is to trim — skip the
artifact check, quote the function name, trust the summary table, answer from
memory. Every one of today's four errors was that trim, and each cost more than
the check would have: an issue filed on a false premise and withdrawn, a claim
about the refresh corrected in front of the maintainer, a crash history
misread, and a helper that reported success while doing half its job.

So, when the pressure is on:

- **The artifact check is the last thing to drop, not the first.** It is
  usually seconds: one `stat`, one row's timestamp, one `grep` of the file the
  claim is about.
- **Say what you did not check.** "I have not confirmed this on the device" is
  a useful sentence; silence in its place is a claim.
- **A deadline is a reason to narrow scope, never to lower the standard of
  evidence for what remains.** Ship less, proved; not more, asserted.
- **The cost lands on somebody else.** A wrong claim sends the maintainer to
  reset achievements, power on a handheld, or plan a build around something
  that was never true.

## Pre-flight: read the rules the work touches, in this session

**New, 2026-09-19**, strengthening *read, don't recall*. `instruction-files.md`
says which copy to read and that a stale worktree lies; it does not say to read
before starting.

Before a chunk of work in an area you have not touched this session:

1. **Name the rules that apply** — the area's own (`rclone-cloud-sync.md`,
   `es-native-ui.md`, `device-builds.md`…) plus the ones that apply to
   everything (`engineering-practices.md`, `upgrade-and-install.md`).
2. **Open them.** The session's earlier summary of a rule is not the rule, and
   a rule quoted from memory has been wrong here before.
3. **Check the registers for the scope** — `docs/decision-register.md` for rows
   that already settle it, `docs/blindspot-register.md` for the failure this
   project has already committed here.
4. **Say which ones you read** when the work is reported. A rule consulted and
   a rule assumed produce identical-looking output, and only one of them is
   evidence.

## Enforcement depth: writing the rule is stage one of five

The playbook's most useful import. A rule progresses: **written** → **routed**
(loads when the area is touched) → **evidenced** (the session states it read
it) → **audited** (a tool checks the outcome) → **self-examining** (the rule
asks the reader to check their own compliance).

Most of ours sit at written-and-routed, which is where decay happens: D-UI-039
asked for the menu map to be updated in the same change and lost 30 screens in
a month. What holds is audited: `tools/pkgcheck`, `tools/register-check`,
`tools/es-menu-map-check`, `tools/vm-qa`'s suites, `.githooks/pre-push`.

**So when a rule is broken twice, do not rewrite it — move it up a stage.** Ask
what tool would have caught it. If no tool can, say so in the rule, because an
unenforceable rule that claims enforcement is worse than an honest one.

## Not adopted

- **Creation over destruction** (prefer generative work, avoid combat
  metaphors, preserve the possibility space). It is a cultural stance for an
  estate that builds products; this fork's equivalent instincts are already
  covered by *preservation over deletion* and by the habit of declaring what we
  deliberately do not do — `docs/es-menu-map.md`'s `## Not mapped` section is
  that idea in its useful form. Adopting the rest would add words without
  changing a decision.

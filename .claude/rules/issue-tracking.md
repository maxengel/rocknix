---
description: "Where to file issues / tracking lists for this working copy, and how they are structured."
paths:
  - "**"
---

# Issue tracking

Track all issues, punch lists, and TODO tracking on the **fork**, never on the upstream
project:

- **File issues on `rasteratops/distribution`** (the fork). Issues are enabled there.
- **Do not file on `ROCKNIX/distribution`** (upstream). Upstream has Issues disabled, and
  tracking work belongs on the fork regardless.
- With `gh`, always pass `--repo rasteratops/distribution` explicitly — the repo's `gh` default is
  the upstream remote, so omitting it would target the wrong place.
- If issues are ever unavailable, fall back to a gitignored Markdown checklist in the
  working copy rather than filing upstream.

Example:

```bash
gh issue create --repo rasteratops/distribution --title "..." --body-file notes.md
```

## Structure: Milestone → Epic → Issue (established 2026-08-18)

- **Milestones** carry a program's acceptance test in their description (e.g.
  *Cloud Saves: Fresh Handheld Journey*, *Cloud Saves: Visual Conflict Resolution*).
  Every issue that must land for that test to pass gets the milestone; QOL/backlog
  items stay milestone-less. The body also holds the **current ordered execution
  plan**: current/next work, phase dependencies, status and exit evidence. Update
  it in the same session when priorities or phase state change (D-WORKFLOW-139).
- **Names carry placement, not chronology.** Follow
  [`milestone-phase-naming.md`](milestone-phase-naming.md): `M7.P1: ...`, with
  optional Epic/sub-id scope. M comes from the milestone's name; P comes from
  its body. Reconcile affected open titles when work moves; closed titles stay
  historical. Issue numbers remain references, not the work queue.
- **Epics** are ordinary issues labeled `epic` that own a scope (e.g. #18 backuptool,
  #26 journey, #15 native ES, #11 conflict resolution). Children are attached as real
  **GitHub sub-issues** (`gh api -X POST repos/.../issues/<epic>/sub_issues -F
  sub_issue_id=<REST id>` — the *id*, not the number), and the epic body maps its
  phases to child issue numbers.
- **Every actionable issue carries an "Acceptance criteria" checklist** — observable
  behavior, not implementation steps. QA/exit-test issues state their procedure.
- **Program labels** group a workstream across milestones (e.g. `cloud-saves`).
- **Closing discipline**: deliver → close `completed` with a comment naming the
  commits/build; consolidate → close `not planned` with a comment naming where the
  scope went. Never leave a delivered issue open or close one silently.
- **A bug is closed as completed only with its `Already written:` line** in
  its code trace -- what the code before the fix had left on devices and in
  their clouds, and how the fix treats it (D-WORKFLOW-050,
  `upgrade-and-install.md`); `tools/rc-preflight` reads the closed ones too.

## Every out-of-band request gets an issue, the same session (D-QA-012)

Maintainer, 2026-09-08: *"with all these pieces of feedback I'm giving you, we
should create issues to cover them. With prior items in the past, it's
important to make sure that we're creating issues to capture these out-of-band
requests I'm giving, so we have the right paper trail of what we've been
doing."*

So: a request, observation, or concern the maintainer raises in conversation --
a UI nit seen on a device, a "we should also...", a question that turns into
work -- is filed on the fork **in the same session it is raised**, before or
alongside the work, not after. The body quotes the maintainer's words
verbatim (they are the requirement; a paraphrase drifts), states what exists
today, and carries acceptance criteria. Several small items raised together
may share one issue with one section each, as #85 does. A concern that is
really a requirement on existing work is still recorded where it lands
(register row, issue body edit) **and** made findable: if it lives only in a
register row or a comment, file the issue and point both ways.

The paper trail is the point. A register row says what was decided; the
issue says what was asked, by whom, in what words, and whether it was done.

## No work without an issue (D-WORKFLOW-132)

Maintainer, 2026-10-02: *"We should make sure everything we need to do is
logged as issues. We shouldn't be doing work if there's not a corresponding
issue. We should be logging our friction and experience in our friction log.
We should be using our instruction files to dictate how we run a work log. We
should be following our process and protocols as outlined in those
instruction files. We should be stopping to modify them when necessary. I feel
like we're drifting away from process."*

D-QA-012 puts every out-of-band request into an issue. This widens it to every
piece of work: a fix, a proof, a test or tool change, a rule change, a build
cut for a purpose. The issue exists **before** the work starts; the commits
and the work-log heading name it; the outcome is reported on it. Work found in
the middle of other work -- a fixture gone stale, a check that missed a
shape -- gets its own issue the moment it is found, before the fix, however
small the fix (#366 was filed before its fix for exactly that reason). A
session about to start something with no issue stops and files one; a session
that finds it has been working without one files it and says so in the issue.

The rest of the maintainer's list already has a home, and the drift was in
practice, not in the text: friction is a line the moment the work slows
(`ceremonies.md`), a learning is a work-log entry headed by its issue
(`learning-capture.md`), a procedure becomes a tool (`learning-capture.md`
§ 3), and a rule broken twice moves up a stage (`working-principles.md`).
On 2026-10-02 the friction log had no line for five slowdowns of the night
before, the proofs that gate a candidate lived as session scripts outside the
tree, and the session had loaded 17 of the 29 rules stale from a worktree 813
commits behind `next` (#367).

**What the tool checks.** `tools/ceremony-check` has a blocking `issues` line:
fork commits on `next` made after the policy's adoption in `bf121ce876` must
cite `#N` in their subject or body, including merge commits. It excludes
upstream history and older feature commits inherited by a later merge; it
fails closed when required history is missing. `--issues-only` runs this
check by itself. The fork CI fetches upstream's history for that comparison;
this does not merge or advance the distribution's frozen ancestry (#367).

**What no tool checks yet.** A citation does not prove that its issue existed
before the work or owns that work. Logging friction when it happens, recording
the VM question before a test, and amending a rule when practice moves still
depend on following these instructions. A green ceremony check proves only
its named predicates.

## A criterion is agent-first (D-QA-044)

Maintainer, 2026-09-25: *"our instruction files and processes should be driven
by agent-first acceptance criteria, and so human testing and feedback should
become what dictates work streams and issues. The validation of that needs to
be structured in a way that can be agentically verified."*

So every `- [ ]` is written so an agent can tick it, and names the artifact
that does: a frame at the panel's size, a suite's PASS line, a stamp, a
journal line, a measurement. A person's observation on a handheld is the
*source* of an issue (D-QA-012: filed the same session, their words quoted),
never the *check* that closes one. A checkbox that says "the maintainer's
word", "your yes" or "on the H700" is a criterion only when it also names the
physical fact the VM cannot have (`vm-first.md`'s list) -- and then it points
at that fact's row in `docs/releases/device-facts.md`, so "have we checked
this?" is a lookup. `tools/box-check` reads every open issue and fails a
checkbox that names a person or a device without a fact; on 2026-09-25, its
first run, 46 of 479 open checkboxes did, which is the sweep #268 works down.
It also notes an open checkbox on an issue a decided register row cites: the
row may have settled what the checkbox still asks (the hotspot drop and the
Tailscale restart were put to the maintainer as open on 2026-09-25 with their
rows a week old), so the checkbox is re-derived against the row before it is
put to anyone. The same day the sweep reached 0, a decision ID cited in
passing stopped counting as a fact, and a failing checkbox began to keep the
fork CI red. D-QA-043, the same question put from the VM's side on
2026-09-24 (is a frame at the panel's size the observation?), is answered by
this rule.

## Say checkbox, not box (D-QA-045)

Maintainer, 2026-09-25, after a briefing counted "27 failing boxes" and "the
RG SP boxes": *"When you say a box, check, or boxes, do you mean VMs?"* and
*"please make a note to refer to them as checkboxes or open items to verify or
something. Just calling them the box is very confusing because that could mean
a compute box."*

So an unticked `- [ ]` is a **checkbox**, or an **open item to verify**, in
everything the maintainer reads: a briefing, a report, an issue comment, a
tool's output, these files. *Box* already means a machine here --
`device-builds.md` has the build box running out of RAM -- and it reached the
briefing from these files' own shorthand. The checker keeps its name,
`tools/box-check`, because a name is an identifier (as `wifi.key` keeps its
spelling, `es-player-text.md`); the first time a report names it, it says
what it is: the checkbox checker.

## An issue that proposes a test says where it runs

Before a test, proof or measurement is run, the issue carries the line
"Can this be done on the VM? Yes -- how / No -- what only a device can show"
(`vm-first.md`). A device run without that line in its issue is out of process.

## Ticking an acceptance criterion

A checkbox records an observed behaviour, never an artifact. "Commit `abc123`
exists" and "the file is there" are corroboration; they are not evidence that
the thing works — see blindspot 13, where nine ticked items included one
feature that had never once functioned and shipped broken in four images.

- Where a mechanical check exists (`tools/pkgcheck`, `tools/cloud-round-trip`,
  a device build), run it and cite its output in the issue.
- When a comment supersedes an acceptance criterion, **edit the body in the
  same action**. The `- [ ]` list is the contract an implementer builds from;
  a decision that lives only in comments will be missed.
- One false tick voids the list. Re-derive the siblings rather than assuming
  the rest are sound.

## Putting a checkbox on a checklist

An open `- [ ]` is a claim that the work is undone, made when the checkbox
was written. Before it goes on a round's checklist or a page somebody else
works from, read the issue to its last comment, the work log of the day it
was filed, and the pin -- two of nine device checkboxes on the 2026-09-21
round were already done or never issues (blindspot 51). Write the checkbox as
the observation somebody will make, not as the issue's title, and drop any
line that cannot be traced to an issue.

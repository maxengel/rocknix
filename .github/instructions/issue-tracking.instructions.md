---
description: "Where to file issues / tracking lists for this working copy, and how they are structured."
applyTo: "**"
---

# Issue tracking

Track all issues, punch lists, and TODO tracking on the **fork**, never on the upstream
project:

- **File issues on `maxengel/rocknix`** (the fork). Issues are enabled there.
- **Do not file on `ROCKNIX/distribution`** (upstream). Upstream has Issues disabled, and
  tracking work belongs on the fork regardless.
- With `gh`, always pass `--repo maxengel/rocknix` explicitly — the repo's `gh` default is
  the upstream remote, so omitting it would target the wrong place.
- If issues are ever unavailable, fall back to a gitignored Markdown checklist in the
  working copy rather than filing upstream.

Example:

```bash
gh issue create --repo maxengel/rocknix --title "..." --body-file notes.md
```

## Structure: Milestone → Epic → Issue (established 2026-08-18)

- **Milestones** carry a program's acceptance test in their description (e.g.
  *Cloud Saves: Fresh Handheld Journey*, *Cloud Saves: Visual Conflict Resolution*).
  Every issue that must land for that test to pass gets the milestone; QOL/backlog
  items stay milestone-less.
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

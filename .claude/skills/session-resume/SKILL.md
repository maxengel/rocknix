---
name: session-resume
description: Resume work from a previously saved session-stash snapshot. Use when the user says "resume work", "pick up where I left off", "continue the session", "load the last handoff", "what was I doing", or at the start of a new context/agent session where a saved state file exists. Pair with session-stash.
license: Apache-2.0
metadata:
  version: 1.3.0
  origin: Converted from .github/prompts/resume-work.prompt.md (an external prompt library). v1.2.0 (2026-06-13) — when the current branch is not `main`, the fallback file search ignores the inherited `saved-session-state-main.md`, which is branch-creation cruft (session-stash removes it on first stash there), not a real handoff for this branch.
---

# Session Resume

Load the canonical session state, reconcile it with current evidence and the live milestone queue, briefly report the next action, and continue the authorized work.

## When to resume

- User explicitly asks ("resume work", "continue", "load last session")
- A fresh agent/context window is starting and a `saved-session-state-*.md` file exists
- Before picking up any task on a branch that was recently stashed

## Workflow

### Step 1 — Locate the state file

Default path: `.github/sessions/saved-session-state-{branch}.md` where `{branch}` is the current git branch (with `/` → `-`).

**In this repository (D-WORKFLOW-133):** the canonical stash is `.github/sessions/saved-session-state-next.md` on `next`, and a working branch's own file is a pointer to it. Read the canonical one; from a worktree that has not merged `next` since, `git show next:.github/sessions/saved-session-state-next.md`.

If not found, try in this order:

1. Any `.github/sessions/saved-session-state-*.md` — if multiple, list them and let the user pick. **When the current branch is not `main`, ignore `saved-session-state-main.md`**: on a feature branch it is almost always inherited at branch creation, not a handoff for this branch (session-stash removes it on first stash there).
2. Repo-specific conventions (`sessions/`, `handoff/`, `.agent-state/`)
3. If nothing exists, inform the user and offer to help them scope the next task from scratch

### Step 2 — Validate the environment

Before trusting the saved state, check:

| Check                                                              | Action if mismatch                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| Current git branch matches `Branch:` in the state file             | Warn, but proceed. Note the divergence in the briefing.     |
| Files listed in "Key Files Modified" still exist                   | Flag any missing. Assume git history has the explanation.   |
| Age of the state file (`stat` the file, compare with current time) | Report its age; verify live sources on every resume.      |
| Working tree is clean (no unrelated in-flight changes)             | Surface anything unexpected before resuming.                |
| The worktree's rules are `next`'s (`git diff --quiet next -- .claude CLAUDE.md AGENTS.md`), in this repository | Read the rules from `next` before trusting a stale copy; integrate only by the worktree's recorded safe strategy: a session loads the rules of the worktree it starts in (#367). |
| Issue tracker state (if referenced) has not diverged               | Re-query the tracker and note what changed since the stash. |

For the tracker check, read the live milestone body and owning issues, including later comments. Resolve current/next work using [`milestone-phase-naming.md`](../../rules/milestone-phase-naming.md); issue numbers and checkpoint age are not priority. If the tracker is unreachable, state that limitation and continue independent authorized work from the last verified plan.

For API access: use whatever API the repo uses. For GitHub repos, prefer the GitHub MCP tools (`mcp_github_search_issues`, `mcp_github_issue_read`). Avoid `gh` CLI list/search for bulk queries — it has destabilised agent runners.

### Step 3 — Produce the briefing

Present a short, scannable summary. Do **not** dump the whole state file verbatim unless the user asks. Template:

```markdown
## Resuming Session

- **Saved**: <timestamp from file>
- **Current**: <now>
- **Branch**: <current> (<same as saved | ⚠ different from saved>)
- **Age**: <e.g. "4 hours ago">

### Where we left off

<1–3 line paraphrase of the "Current Focus" section>

### Immediate next steps

1. <first priority from the saved "Next Steps">
2. <second priority>

### What changed since the stash

- <anything the tracker / git log reveals that the saved file didn't know about>
- Ground this mechanically — run `git log --oneline --since="<Saved timestamp>"` (or `<last-known-commit>..HEAD`) and re-query the tracker; do not reconstruct from memory

### Quick context you'll want

- <1–3 of the most useful items from "Notes for Next Session">

### Open questions

- <any unresolved questions from the saved state>
```

### Step 4 — Continue the work stream

When the user asks to resume or continue, execute the next unblocked action
already authorized. Do not end with a menu or ask for another "continue".
Preserve the objective, constraints, completed work and valid approvals across
sessions; a status question or context reset does not restart delivery.
Ask only for missing information or an action-specific approval that is
actually required. Continue independent work while awaiting an answer.
A request to report status alone does not authorize a new work stream.

Reconcile the live milestone and checkpoint after meaningful progress or a
changed dependency. Record the issue, worktree, actual evidence, current/next
action and any running job's PID/result/watcher. Distinguish source readiness,
image qualification, RC designation and publication. Follow the recorded
integration strategy; never merge historical feature history merely to refresh
instructions. Do not repeat already integrated commits or completed ceremonies.

## Staleness

At every resume, compare the snapshot with git, job artifacts and the live
tracker. Its timestamp describes when it was written, not its authority.
Recover missing context from those sources before asking the user to reconstruct
it. The canonical milestone orders work; the snapshot supplies execution detail.

## Production-operations hardgate

**Session-state "Next Steps" lists are drafts, not authoritative procedures.** Before executing any production-infrastructure operation from a resumed plan (`tofu apply`/`import`, deploy, DB migration on prod, secret rotation, DNS change, container restart on prod, Caddy/Keycloak op), run a five-step grounding: name the operation, find the canonical procedure (the repo's runbook / ADR / design doc), read it end-to-end, triangulate against current reality, and read the design-intent comments in the code being acted upon. The saved state may have missed gates or gone stale — this applies at ANY staleness tier, including `< 1 h`.

## When the file is malformed or incomplete

If the snapshot lacks enough information to continue safely, reconstruct it
from git, the live milestone, owning issues and job artifacts. Repository-specific
headings such as "Start here" and "Current priorities" are valid; do not reject
them for differing from this skill's example. State unresolved gaps, ask only
where they affect the next action, and refresh the canonical checkpoint once
reconciled.

---
name: session-resume
description: Resume work from a previously saved session-stash snapshot. Use when the user says "resume work", "pick up where I left off", "continue the session", "load the last handoff", "what was I doing", or at the start of a new context/agent session where a saved state file exists. Pair with session-stash.
license: Apache-2.0
metadata:
  version: 1.2.0
  origin: Converted from .github/prompts/resume-work.prompt.md (possibility-space). v1.2.0 (2026-06-13) — when the current branch is not `main`, the fallback file search ignores the inherited `saved-session-state-main.md`, which is branch-creation cruft (session-stash removes it on first stash there), not a real handoff for this branch.
---

# Session Resume

Load a previously saved session state file, validate it against the current environment, and present a short resumption briefing to the user.

## When to resume

- User explicitly asks ("resume work", "continue", "load last session")
- A fresh agent/context window is starting and a `saved-session-state-*.md` file exists
- Before picking up any task on a branch that was recently stashed

## Workflow

### Step 1 — Locate the state file

Default path: `.github/sessions/saved-session-state-{branch}.md` where `{branch}` is the current git branch (with `/` → `-`).

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
| Age of the state file (`stat` the file, compare with current time) | If >24 h, prefer live tracker data over stale summary.      |
| Working tree is clean (no unrelated in-flight changes)             | Surface anything unexpected before resuming.                |
| Issue tracker state (if referenced) has not diverged               | Re-query the tracker and note what changed since the stash. |

For the tracker check: use whatever API the repo uses. For GitHub repos, prefer the GitHub MCP tools (`mcp_github_search_issues`, `mcp_github_issue_read`). Avoid `gh` CLI list/search for bulk queries — it has destabilised agent runners.

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

### Step 4 — Offer options

End the briefing with a short menu so the user can steer:

- **Continue** → Start executing step 1 of "Immediate next steps"
- **Show full saved state** → Print the complete state file
- **Start fresh** → Archive the state file to `.github/sessions/archived/` and begin a new plan
- **Refresh from tracker** → Re-query the issue tracker and rebuild the next-step list from live data

Wait for the user's choice before proceeding with substantive work.

## Staleness heuristic

- `< 1 h`: treat saved state as authoritative
- `1–24 h`: trust focus/next-steps, re-verify tracker state
- `> 24 h`: trust focus as historical context only; rebuild the next-step list from live tracker data and recent commits

## Production-operations hardgate

**Session-state "Next Steps" lists are drafts, not authoritative procedures.** Before executing any production-infrastructure operation from a resumed plan (`tofu apply`/`import`, deploy, DB migration on prod, secret rotation, DNS change, container restart on prod, Caddy/Keycloak op), run a five-step grounding: name the operation, find the canonical procedure (the repo's runbook / ADR / design doc), read it end-to-end, triangulate against current reality, and read the design-intent comments in the code being acted upon. The saved state may have missed gates or gone stale — this applies at ANY staleness tier, including `< 1 h`.

## When the file is malformed or incomplete

If the saved file is missing required sections (`Current Focus`, `Next Steps`) or looks corrupted:

1. Don't guess
2. Show the user what was found and what's missing
3. Offer to reconstruct from `git log`, recent commits, and open issues
4. Suggest re-stashing with the `session-stash` skill once you're back on track, so the next resume is clean

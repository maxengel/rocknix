---
name: session-stash
description: Save a structured snapshot of the current work session so another agent (or the same agent in a new context window) can resume without losing state. Use when the user says "stash this work", "save my progress", "we're running low on context", "let's wrap up the session", "hand this off", "pause for the day", before switching branches mid-task, or any time a session is about to end with work in flight. Pair with session-resume.
license: Apache-2.0
metadata:
  version: 1.2.0
  origin: Converted from .github/prompts/stash-work.prompt.md (possibility-space). v1.2.0 (2026-06-13) adds the "Shed inherited `main` state on feature branches" rule — feature branches inherit `main`'s tracked `saved-session-state-main.md` at creation and never shed it, producing a guaranteed stale/conflicting copy (observed live — an inherited copy forced a stash to switch branches). The shed is scoped to the `main` file only; dormant foreign-branch files are left alone to avoid silently propagating deletions to `main` on merge.
---

# Session Stash

Produce a single Markdown file that captures enough state — focus, progress, next steps, file deltas, open questions — that another agent can load it and continue work immediately.

## When to stash

- User explicitly asks ("stash work", "save session", "pause here")
- Context window is close to full
- Switching to a different task, branch, or repo
- End of a work day / handoff to another contributor
- Before a risky operation that might invalidate the current mental model

## Output location

Default path: `.github/sessions/saved-session-state-{branch}.md`

- `{branch}` = current git branch, sanitised to filesystem-safe characters (replace `/` with `-`)
- Create the `.github/sessions/` directory if it does not exist
- If the file already exists, you MUST move the old copy to `.github/sessions/archived/saved-session-state-{branch}-{timestamp}.md` before overwriting — this is the most-skipped step; silently overwriting destroys the prior handoff

If the repo has a different convention (look for an existing `sessions/`, `handoff/`, or `.agent-state/` directory), prefer that.

### Shed inherited `main` state on feature branches

Canonical state files are **tracked**, so every branch cut from `main` inherits `main`'s `saved-session-state-main.md` at creation — and `main` keeps editing its copy each session, so the inherited one is immediately stale and a guaranteed modify/delete merge snag. When stashing on a branch **other than `main`**, before writing the new file:

- If `.github/sessions/saved-session-state-main.md` exists, `git rm` it — it is branch-creation cruft this branch never owns. Note the removal in the Step 3 summary so it rides the user-approved stash commit. On merge back to `main` this surfaces as a modify/delete conflict — never a silent loss — because `main` holds a newer copy.
- Do **not** auto-remove other branches' dormant `saved-session-state-<other>.md` files (or the legacy no-suffix `saved-session-state.md`). They are harmless here, and deleting them would propagate **silently** to `main` on merge — `main` never touched them, so git raises no conflict — wiping its handoff archive. If they clutter, list them and let the user choose.

Each branch then carries only its own `saved-session-state-{branch}.md` plus its own `archived/` history.

## Workflow

### Step 1 — Gather ground truth

Collect from the live environment, not the conversation:

1. **Current timestamp** — run `date -u +%Y-%m-%dT%H:%M:%SZ`; never guess the date
2. **Current git branch** — `git rev-parse --abbrev-ref HEAD`
3. **Working tree state**:
   - `git status --short` (staged / unstaged / untracked)
   - `git diff --stat` (size of unstaged changes)
   - `git log --oneline -n 10` (recent commits on this branch)
4. **Modified files** — cross-reference `git status` with files mentioned in conversation
5. **Issue tracker context** (if applicable):
   - If the repo uses GitHub issues/milestones: prefer the GitHub MCP tools (`mcp_github_search_issues`, `mcp_github_list_issues`, `mcp_github_issue_read`). Avoid `gh` CLI for list/search operations — bulk output can destabilise some agent runners.
   - If it uses another tracker (Jira, Linear, Plane): use whatever MCP / API is available, or skip this step and note it
   - Identify the active Milestone/Epic/Sprint from branch name or conversation
6. **Active spec / plan doc** — look for `docs/planning/<feature>/*-spec.md`, `specs/`, `RFCs/`, or similar; note the relevant path

### Step 2 — Write the state file

Use this exact template. Omit sections that genuinely have no content (do not leave empty placeholders).

```markdown
# Saved Session State

> **Saved**: <ISO-8601 timestamp>
> **Branch**: <git branch>
> **Repo**: <repo name or remote URL>

## Current Focus

<1–3 sentences: what the session was actively working on at the moment it stopped>

## Completed This Session

- <concrete deliverable with file path or commit ref>
- <another>

## In Progress

- <task that was started but not finished>
  - **Current state**: <where it stands>
  - **What remains**: <concrete next step>

## Next Steps

1. <highest-priority next action — concrete and immediate>
2. <following action>
3. <blocker, decision, or question the next agent should resolve first>

## Key Files Modified

| File            | Change   | Notes                  |
| --------------- | -------- | ---------------------- |
| `path/to/file`  | Created  | <1-line purpose>       |
| `path/to/other` | Modified | <what changed and why> |
| `path/to/gone`  | Deleted  | <why>                  |

## Related Context

- **Spec / plan**: `<path>` or `<URL>`
- **Tracker**: <milestone/epic/sprint name, issue numbers>
- **Diagrams / designs**: `<paths>`
- **External refs**: <links to docs, decisions, or upstream issues>

## Notes for Next Session

<free-form: gotchas, half-formed hypotheses, commands that were useful, env quirks, anything a fresh agent would need to know that isn't obvious from the code>

## Open Questions

- <question the next agent should resolve with the user>
- <decision that was deferred>
```

### Step 3 — Show a summary and confirm

After writing the file:

1. Print a 3–5 line summary of what was saved
2. Show the path
3. Remind the user they can resume with the `session-resume` skill
4. Ask (do not assume) whether to commit the state file. If the user confirms, commit it yourself — this is an explicitly user-approved commit — with message:

   ```text
   chore: stash work session <timestamp>
   ```

   If the user declines, leave the file uncommitted and say so in the summary.

## Field-level guidance

### "Current Focus"

Write it as if the next agent has zero context. A good focus line tells them _what problem they are solving right now_, not what sub-problem they are solving or what file they are editing. Example:

> Bad: "Editing `auth-adapter.ts` line 142."
> Good: "Refactoring auth adapter to use the new `AuthProvider` interface so we can swap Keycloak for a test double. Partway through — interface is defined, adapter is ~50% migrated."

### "Next Steps"

Ordered, concrete, verifiable. Each step should be something the next agent can unambiguously execute:

> Bad: "Continue the refactor."
> Good: "Finish migrating `createUser()` in `auth-adapter.ts` to the new interface (lines 140–180), then update the 3 call sites in `api/users/`."

### "Notes for Next Session"

This is where you write things that are obvious in your head but would take hours to re-derive — failed approaches, non-obvious gotchas, why a particular library was chosen, the incantation that unsticks a flaky test.

## Anti-patterns

| Avoid                                                       | Because                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| Dumping raw `git diff` into the state file                  | Not human-readable; re-derive with `git` at resume time |
| Copy-pasting the whole conversation                         | Bloat; signal gets lost                                 |
| "Everything is fine" / vague status                         | Indistinguishable from doing no work — be specific      |
| Writing next steps as "continue working"                    | Non-actionable — decompose into concrete steps          |
| Forgetting to archive the previous state before overwriting | Loses handoff history                                   |
| Committing the state file without user approval             | User may not want session state in repo history         |

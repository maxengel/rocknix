# Saved Session State

> **Saved**: 2026-10-02T02:15:03Z
> **Branch**: `feature/conflict-resolution` (a pointer; D-WORKFLOW-133)
> **Repo**: rasteratops/distribution

## Current Focus

This branch's session state is the canonical stash on `next`: `.github/sessions/saved-session-state-next.md`. It holds the work in flight, what is running, the next commands, and a walk-through for an agent new to the project. One copy, so nothing drifts.

## Next Steps

1. Read the canonical stash from `next`: `git show next:.github/sessions/saved-session-state-next.md` (in the primary checkout, `/workspace/repos/rocknix`, it is the file itself).
2. If this worktree's rules differ from `next`'s (`git diff --quiet next -- .claude CLAUDE.md AGENTS.md || echo STALE`), merge `next` in before reading any rule: a session loads the rules of the worktree it starts in (#367).

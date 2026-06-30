---
description: "How to develop on the fork and open clean PRs upstream without leaking personal artifacts."
applyTo: "**"
---

# Fork workflow & merging up to upstream

This is a fork (`origin` = `maxengel/rocknix`) of `upstream` = `ROCKNIX/distribution`.
The goal: keep personal artifacts in the fork, but open **clean** upstream PRs that contain
only the feature work.

## Branch model

- **`upstream/next`** — upstream's integration branch and the PR target. Treat as clean.
- **`next`** — the fork's daily/integration branch = `upstream/next` + a *personal overlay*
  (instruction files, `plans/`, shared-copilot-knowledge). This is where personal commits
  live and what `origin/next` tracks. It is **never** the source of an upstream PR.
- **`feature/<name>`** — a unit of upstream work, branched from `next` so your instruction
  files are present while you (and Copilot) work. Contains **only** feature commits.
- **`pr/<name>`** — the throwaway branch you actually push for a PR (see below).

**Personal paths** (must never reach an upstream PR):
`.github/copilot-instructions.md`, `.github/instructions/`,
`.github/shared-copilot-knowledge/`, `.githooks/`, `tmp/shared-copilot-knowledge/`,
`compare-prompt-versions.sh`, `docs/`, `plans/`.
These are disjoint from feature paths (`packages/`, `projects/`, `config/`, `scripts/`,
`tools/`), so feature commits never touch them.

## Per-feature flow

```bash
git fetch upstream
git worktree add ../rocknix.worktrees/<name> -b feature/<name> next   # see worktrees.instructions.md
#   …develop; commit only feature paths…

# When ready to open the PR, build a clean branch automatically:
git fetch upstream
git switch -c pr/<name> feature/<name>
git rebase --onto upstream/next next pr/<name>              # keeps ONLY feature commits
git push -u origin pr/<name>
gh pr create --repo ROCKNIX/distribution --base next --head maxengel:pr/<name>
```

Why `git rebase --onto upstream/next next pr/<name>` works: it replays exactly the commits
in `next..pr/<name>` (your feature commits) onto clean `upstream/next`. Everything inherited
from `next` — i.e. every personal commit — is excluded by construction. This **replaces
manual cherry-pick selection** with one deterministic command: you can't accidentally
include a personal commit or drop a feature one.

`feature/<name>` stays intact (still based on `next`) for continued work; `pr/<name>` is
disposable — rebuild it the same way to refresh against upstream.

## Safety net: pre-push guard

`.githooks/pre-push` blocks pushing any `pr/*` branch that still differs from `upstream/next`
in a personal path (e.g. you forgot to rebase). Enable it once per clone / new worktree:

```bash
git config core.hooksPath .githooks
```

Only `pr/*` branches are guarded; pushing `next` or `feature/*` is unaffected.

## When to merge up

- One self-contained change per PR, scoped like the commit convention
  (`<package>` or `<DEVICE> - <subsystem>`); don't bundle unrelated work.
- The change builds for at least one target device.
- `pr/<name>` is rebased on current `upstream/next` (fetch first) to minimize conflicts.
- Never include personal/infra paths (the guard enforces this).

## Keep `next` synced

Periodically refresh the fork's daily branch so feature branches start from current code:

```bash
git fetch upstream
git switch next
git merge --ff-only upstream/next    # or: git rebase upstream/next  (re-applies personal overlay)
git push origin next
```

---
description: "How to develop on the fork and open clean PRs upstream without leaking personal artifacts."
paths:
  - "**"
---

# Fork workflow & merging up to upstream

This is a fork (`origin` = `maxengel/rocknix`) of `upstream` = `ROCKNIX/distribution`.
The goal: keep personal artifacts in the fork, but open **clean** upstream PRs that contain
only the feature work.

## Branch model

- **`upstream/next`** — upstream's integration branch and the PR target. Treat as clean.
- **`next`** — the fork's daily/integration branch = `upstream/next` + a *personal overlay*
  (`.claude/`, `docs/`, `plans/`, fork-only tools). This is where personal commits
  live and what `origin/next` tracks. It is **never** the source of an upstream PR.
- **`feature/<name>`** — a unit of upstream work, branched from `next` so the rules are
  present while you work. Contains **only** feature commits.
- **`pr/<name>`** — the throwaway branch you actually push for a PR (see below).

**Personal paths** (must never reach an upstream PR). This list and `PERSONAL_PATTERNS`
in `.githooks/pre-push` are the same list; change one and change the other.

- **Agent context** — `.claude/`, `CLAUDE.md`, `AGENTS.md`, `.githooks/`,
  `.github/sessions/`, `.github/workflows/fork-*`
- **Personal writing** — `docs/`, `plans/`
- **Fork-only tools** — `tools/fork-publish-release`, `tools/cloud-test-backend`,
  `tools/cloud-round-trip`, `tools/lint-audit-artifacts`, `tools/vm-visual-qa`
- **Copilot-era leftovers** — `.github/copilot-instructions.md`, `.github/instructions/`,
  `.github/shared-copilot-knowledge/`, `tmp/shared-copilot-knowledge/`,
  `compare-prompt-versions.sh`. Retired from `next`, but branches and worktrees cut
  before the retirement still contain them, so the guard still watches for them.

`tools/` is **not** disjoint from the feature areas — most of it is upstream's, and only
the five entries above are ours. That is why fork-only tools are enumerated rather than
matched by prefix, and why a new one has to be added to the guard by hand. The guard
warns about any `next`-only file outside `packages/` and `projects/` that it does not
recognise; that warning is the reminder.

## Per-feature flow

```bash
git fetch upstream
git worktree add ../rocknix.worktrees/<name> -b feature/<name> next   # see worktrees.md
#   …develop; commit only feature paths…

# When ready to open the PR, build a clean branch automatically:
git fetch upstream
git switch -c pr/<name> feature/<name>
git rebase --onto upstream/next next pr/<name>              # keeps ONLY feature commits
git reset --soft upstream/next && git commit                # SQUASH: one commit for review
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

**Squash policy (dev-team preference, 2026-07-23):** upstream PRs must present **one
commit** — the ROCKNIX team squash-merges and reviewers want a single commit to check.
After the `--onto` rebase, squash the branch (`git reset --soft upstream/next &&
git commit`) with a message that summarizes the whole change (scoped like the commit
convention). Keep the granular history on `feature/<name>`; only `pr/<name>` is squashed.

**Upstream CI validates the commit message** (`validate-pull-request.yml`, learned from
PR #3055): the title must match `^[a-zA-Z0-9_*./-]+:[[:space:]].+$` — i.e. `package: text`
with **no spaces before the colon** (`rclone - cloud-sync: …` and `SM8250 - linux - …`
styles FAIL). Also enforced: title ≤ 72 chars, blank line between title and body, body
lines ≤ 72 chars, and no merge commits in the PR.

## Safety net: pre-push guard

`.githooks/pre-push` blocks pushing any `pr/*` branch that still differs from `upstream/next`
in a personal path (e.g. you forgot to rebase). Enable it once per clone — the setting is
shared by every worktree, so it does not need repeating per worktree:

```bash
git config core.hooksPath "$(git rev-parse --show-toplevel)/.githooks"
```

**The absolute path is the point.** A relative `core.hooksPath=.githooks` resolves against
whichever working tree you push from, and a correctly built `pr/*` branch contains no
`.githooks/` — excluding it is what the `--onto` rebase is for. Check that branch out in a
worktree and the hook file is simply absent, so git runs no hook and the guard silently
does not apply. The better the PR branch, the less the guard exists. Pointing at the main
checkout by absolute path pins the hook to something every branch can see.

Only `pr/*` branches are guarded; pushing `next` or `feature/*` is unaffected.

The guard also enforces the **console-first content rule** on `pr/*` branches: added
lines in product-surface scripts (`projects/ROCKNIX/packages/network/rclone/sources/`,
`projects/ROCKNIX/packages/rocknix/sources/scripts/`) must not mention QEMU/VMs,
user-mode networking, port forwards, or loopback QA addresses.

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

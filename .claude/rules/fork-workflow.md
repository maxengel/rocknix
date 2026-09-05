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
  (`.claude/`, `docs/`, `plans/`, fork-only tools) + **every merged feature**. This is what
  `origin/next` tracks, what gets built, and the single place to look for the current state
  of the work. It is **never pushed** upstream, but it *is* what upstream PRs are cut
  **from** — by path, see below.
- **`feature/<name>`** — a unit of upstream work, branched from `next` so the rules are
  present while you work. Contains **only** feature commits, and is **merged back into
  `next`** when it is ready to integrate. Do not leave finished work stranded on a feature
  branch: `next` is what gets built and QA'd, so anything not merged is not being tested.
- **`pr/<name>`** — the throwaway branch you actually push for a PR (see below).

**Personal paths** (must never reach an upstream PR). This list and `PERSONAL_PATTERNS`
in `.githooks/pre-push` are the same list; change one and change the other.

- **Agent context** — `.claude/`, `CLAUDE.md`, `AGENTS.md`, `.githooks/`,
  `.github/sessions/`, `.github/workflows/fork-*`
- **Personal writing** — `docs/`, `plans/`
- **Fork-only tools** — `tools/fork-publish-release`, `tools/cloud-test-backend`,
  `tools/cloud-round-trip`, `tools/lint-audit-artifacts`, `tools/vm-visual-qa`,
  `tools/fork-worktree`
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
#   …then merge into next, so everything integrates and builds in one place…

# When ready to open the PR, build a clean branch from the CONTENT on next:
git fetch upstream
git worktree add --detach ../rocknix.worktrees/pr-<name> upstream/next
cd ../rocknix.worktrees/pr-<name>
git switch -c pr/<name>
git checkout next -- <the feature paths>                    # e.g. projects/ROCKNIX/packages/network/rclone/
git commit                                                  # ONE commit, message per CI rules below
git push -u origin pr/<name>
gh pr create --repo ROCKNIX/distribution --base next --head maxengel:pr/<name>
```

**Why by content and not by commit.** The old recipe was
`git rebase --onto upstream/next next pr/<name>`, which replays exactly the commits in
`next..pr/<name>`. That works only while the feature commits are *outside* `next`. Once a
feature is merged into `next` — which is where it has to go to be integrated, built and QA'd
alongside everything else — those commits are in the exclusion set, `next..pr/<name>` is
empty, and the recipe silently produces a PR branch containing nothing at all. It fails
quietly, which is the worst way for it to fail.

Selecting by content sidesteps the question entirely. It does not care whether the commits
live on a feature branch, on `next`, or both, and it cannot pick up a personal commit
because personal paths are never in the path list. The trade — losing the granular history
on the PR branch — costs nothing, because upstream squashes to one commit anyway (below).

**State the paths explicitly.** `git checkout next -- <paths>` is the whole safety
mechanism: whatever you name is what ships. Name package/project directories, never `.` and
never a personal path. The pre-push guard is the backstop, not the plan.

`pr/<name>` is disposable — rebuild it the same way to refresh against upstream. Delete the
throwaway worktree afterwards (`git worktree remove`).

**Squash policy (dev-team preference, 2026-07-23):** upstream PRs must present **one
commit** — the ROCKNIX team squash-merges and reviewers want a single commit to check. The
content recipe produces exactly one commit by construction. Keep the granular history on
`next`; only `pr/<name>` is a single commit.

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

The guard also scans **every** pushed branch — not only `pr/*` — for lines
shaped like credentials (`SECRET_PATTERNS` in the hook: a ScreenScraper
`devpassword=` with a real value, a RetroAchievements `&y=KEY`, GitHub/AWS/Slack
token formats, private-key blocks, `TOKEN=`/`PASSWORD=` with a long literal).
Placeholders in `<angle brackets>` never match, so documentation passes and a
pasted secret does not. GitHub's own push protection is on for both public
repos but knows only its catalogue of token formats, which is why the hook
carries the two this fork actually handles.

**Check the hook can run at all.** `ls "$(git config core.hooksPath)"` must list
`pre-push`. A `core.hooksPath` naming a directory that no longer exists runs
nothing and says nothing — that was the state for a day after the 2026-09-04
move to `/workspace` (blindspot 26). `tools/fork-worktree list` and `sync` now
warn when the path is unset, relative, or missing.

## Keep `next` synced

Periodically refresh the fork's daily branch so feature branches start from current code:

```bash
git fetch upstream
git switch next
git merge --ff-only upstream/next    # or: git rebase upstream/next  (re-applies personal overlay)
git push origin next
```

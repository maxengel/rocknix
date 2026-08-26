---
description: "Convention for creating, placing, and managing git worktrees in this fork"
paths:
  - "**"
---

# Git Worktrees

Place every worktree in the **sibling** directory `../rocknix.worktrees/`, one subdirectory
per branch, named after the branch leaf. That directory lives next to the primary checkout
(outside the repo tree), so it never needs gitignoring.

The **primary checkout** `~/Development/rocknix` stays a reflection of the canonical branch —
here that is **`next`**, the fork's integration branch (this repo has **no `main`**; `origin`
and `upstream` both default to `next`). Do feature work in worktrees, not the primary checkout.

```
Development/
├── rocknix/                    # primary checkout — stays on next (the "main" reflection)
└── rocknix.worktrees/
    ├── rclone-cleanup/         # branch: feature/rclone-cleanup
    └── <name>/                 # branch: feature/<name>
```

The worktree directory leaf is the branch name **minus the `feature/` prefix** (the prefix
carries a slash, so it can't be a directory leaf). Branches still use the `feature/<name>`
convention required by the fork workflow (see `fork-workflow.md`).

## Removing a worktree

**Use `tools/fork-worktree remove`, not `git worktree remove`.**

Worktrees here are not interchangeable. A feature worktree is a few hundred MB
of checkout that a clone can rebuild in seconds. A build worktree holds
`build.ROCKNIX-<DEVICE>.<ARCH>` directories, `sources/` and `target/` — hours of
compilation each, none of it in git, none of it recoverable. `git worktree
remove --force` cannot tell those apart, and `--force` is precisely the flag you
reach for when the first attempt complains.

It is also not atomic. Told to force-remove a worktree holding hundreds of GB,
git has been observed to unregister it and leave the contents behind: a
directory that is no longer a worktree, with orphaned build roots, reported only
as a non-zero exit. In a loop over several worktrees that exit scrolls past.

```bash
./tools/fork-worktree list                        # what each one is holding
./tools/fork-worktree remove <path>               # refuses if build output is present
./tools/fork-worktree remove <path> --preserve <dir>
./tools/fork-worktree remove <path> --force       # only after it has told you what dies
./tools/fork-worktree repair <path>               # re-register an orphaned directory
```

`repair` exists because git's own `worktree repair` cannot help once the admin
directory under `.git/worktrees/` has been pruned — it re-creates the worktree in
place and carries every untracked file back.

**Never remove the worktree you are standing in.** The shell's working directory
vanishes mid-command and everything afterwards fails for an unrelated-looking
reason. Detach it instead (`git switch --detach`) if you only need its branch
freed; the tool refuses this case outright.

## Create a worktree + branch from next

Always branch from the latest `next` — fetch first so the personal overlay (instruction
files, `plans/`, work logs) is present while you work:

```bash
# run from the primary checkout
git fetch upstream
git switch next && git merge --ff-only upstream/next   # keep next current (optional)
git worktree add ../rocknix.worktrees/<name> -b feature/<name> next
```

To resume an **existing** feature branch in a worktree, omit `-b`:

```bash
git worktree add ../rocknix.worktrees/<name> feature/<name>
```

## Manage worktrees

```bash
git worktree list                                       # show all worktrees
git worktree remove ../rocknix.worktrees/<name>         # delete when finished
git worktree prune                                      # clean up stale entries
```

## Rules

1. **One worktree per branch**, under `../rocknix.worktrees/`, named after the branch leaf.
2. **Branch from `next`** (fetched fresh) unless a task explicitly requires another base —
   `next` carries the personal overlay, so instructions are present while you work.
3. **Keep the primary checkout on `next`** (the "main" reflection); do feature work in worktrees.
4. **Keep worktrees as siblings** — never nest one inside the primary checkout.
5. **Remove with `git worktree remove`** (not `rm -rf`) so git metadata stays consistent.
6. Opening a clean upstream PR from a worktree still follows `fork-workflow.md`
   (`pr/<name>` built via `git rebase --onto upstream/next next pr/<name>`).

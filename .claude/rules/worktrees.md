---
description: "Convention for creating, placing, and managing git worktrees in this fork"
paths:
  - "**"
---

# Git Worktrees

Place every worktree in the **sibling** directory `../rocknix.worktrees/`, one subdirectory
per branch, named after the branch leaf. That directory lives next to the primary checkout
(outside the repo tree), so it never needs gitignoring.

The **primary checkout** `/workspace/repos/rocknix` stays a reflection of the canonical branch —
here that is **`next`**, the fork's integration branch (this repo has **no `main`**; `origin`
and `upstream` both default to `next`). Do feature work in worktrees, not the primary checkout.

```
/workspace/repos/                 # serval's dedicated build volume; see device-builds.md
├── rocknix/                    # primary checkout — stays on next (the "main" reflection)
└── rocknix.worktrees/
    ├── rclone-cleanup/         # branch: feature/rclone-cleanup
    └── <name>/                 # branch: feature/<name>
```

The worktree directory leaf is the branch name **minus the `feature/` prefix** (the prefix
carries a slash, so it can't be a directory leaf). Branches still use the `feature/<name>`
convention required by the fork workflow (see `fork-workflow.md`).

## Build worktrees are on `build/*` branches, never detached

`scripts/image` writes `BUILD_BRANCH="$(git branch --show-current)"` into
`/etc/os-release`, and `rocknix-info` shows it to the player as
`BUILD ID: cb50b45 (test/qa-integration)`. On a detached HEAD that command
returns **empty**, so an image built from a detached worktree ships with a blank
branch field and an empty parenthetical on the device's info screen. Detached is
fine for reading; it is not fine for building.

Git will not check out the same branch in two worktrees, and the primary
checkout holds `next`. So each build worktree gets its own branch named after
its directory — `build/devices`, `build/generic-x64` — which keeps
`BUILD_BRANCH` populated and says which checkout produced an image.

A branch does not follow `next` on its own any more than a detached HEAD does:

```bash
./tools/fork-worktree sync     # fast-forward every build/* worktree to next
```

It touches only `build/*` branches, skips a worktree with uncommitted changes
rather than overwriting it, and is fast-forward-only — a build branch someone
committed on has diverged, and quietly rewriting it would lose that work.

**Never sync a worktree with a build in flight.** `calculate_stamp` hashes each
package directory *when that package is reached*, so a fast-forward under a
running build makes every package after that moment build from the new tree
and every package before it from the old — a mixed image, with no error and a
`BUILD_ID` that names only one of the two. It happened on 2026-09-04: `rclone`
(seq 632) picked up commits landed mid-build while the other 660 packages did
not. Benign that time because the late commits touched only `rclone`; the next
time it will not be. Check `docker ps` for a `rocknix-build` container before
running `sync`, and if one is up, wait.

It deliberately takes **no target argument**. It walks every build worktree at
once, so an arbitrary ref moves all of them together; while this function was
being tested, a throwaway commit was fast-forwarded onto two real build
checkouts exactly that way, and went unnoticed because the test only read the
output line it expected. `next` is the only ref worth following here.

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

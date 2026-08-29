---
description: "Where the canonical rules live and how they load; how to tell a stale worktree copy from the current one."
paths:
  - "**"
---

# Where the rules live, and which copy you are reading

Every rule in this directory loads automatically: those with a `paths:` glob
when a matching file enters context, those without one at session start. There
is no second copy — `.github/instructions/` was a Copilot convention and is
gone, along with Copilot.

Other tools in use here read the same files: Crush can be pointed at this
folder with `global-context-path`, and it already discovers `.claude/skills`.
Crush loads the folder recursively and does **not** honour `paths:`, so every
rule reaches it every session — a rule that is noise there is noise always.

**Seeing `.github/instructions/` means you are in a stale worktree.** That
directory no longer exists on `next`. Several worktrees were cut before it was
retired and still carry it on disk, so its presence is a reliable signal that
the rules around you predate the move — not that a second copy exists.

**Read rules and skills from `next`, not from a feature worktree.** A branch
cut from an older base silently lacks anything added since. This has bitten
twice: ES work proceeded in a worktree missing `es-native-ui`, and a code audit
loaded a stale copy of its own skill and would have graded the work against a
rubric that no longer existed.

```bash
diff -q <file> <(git -C /home/max/Development/rocknix show next:<file>)
```

**When a rule earns its place, write it down.** `docs/blindspot-register.md`
holds failure modes this project has actually committed — consult it before
calling something greenfield, and add to it when a new one surfaces.
`docs/decision-register.md` holds settled decisions; cite a row by ID rather
than re-arguing the choice, and add one the same session a decision is made.

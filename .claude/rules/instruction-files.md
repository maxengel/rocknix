# Where the rules live, and which copy you are reading

Canonical prose lives in `.github/instructions/*.instructions.md`. Those files
carry an `applyTo:` glob, which is a **Copilot** mechanism — Claude Code does
not act on it, so those files only reach you if you go and read them. The files
in this directory are what load automatically; they are pointers plus the rules
that must never be missed.

**Read instruction files and skills from `next`, not from a feature worktree.**
A branch cut from an older base silently lacks anything added since. This has
bitten twice: ES work proceeded in a worktree missing `es-native-ui`, and a
code audit loaded a stale copy of its own skill and would have graded the work
against a rubric that no longer existed.

```bash
diff -q <file> <(git -C /home/max/Development/rocknix show next:<file>)
```

**When a rule earns its place, write it down.** `docs/blindspot-register.md`
holds failure modes this project has actually committed — consult it before
calling something greenfield, and add to it when a new one surfaces.

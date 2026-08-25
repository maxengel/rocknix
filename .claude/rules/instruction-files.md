# Where the rules live, and which copy you are reading

Every rule in this directory loads automatically: those with a `paths:` glob
when a matching file enters context, those without one at session start. There
is no second copy — `.github/instructions/` was a Copilot convention and is
gone, along with Copilot.

Other tools in use here read the same files: Crush can be pointed at this
folder with `global-context-path`, and it already discovers `.claude/skills`.

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

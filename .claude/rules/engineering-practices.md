---
description: "General engineering practices for this codebase (high-signal; add only durable, generalizable rules)."
paths:
  - "**"
---

# Engineering practices

High-signal, generalizable practices. Add entries only when a learning clearly generalizes
beyond one task (see `learning-capture.md`).

## Verify design intent before "fixing" an apparent bug

Before changing code that looks wrong, confirm it isn't intentional:

- **Read the history.** `git log -S<symbol>` / `git log -p -- <file>` and the original commit
  often reveal intent (or that a variable is dead/leftover).
- **Check the guards around it.** A dangerous-looking call may be gated by a default, a mode,
  or a filter that makes it safe in practice.
- **Map the full blast radius.** Understand what a flag/filter actually affects before assuming
  impact (e.g. allowlist vs denylist semantics).
- **Prefer a question over a silent rewrite** when intent is ambiguous — confirm with the
  maintainer rather than changing deliberate behavior.

**Case study:** restore-side `--delete-excluded` in the rclone cloud-sync scripts looked like
data loss, but was gated by the default `RESTOREMETHOD=copy` (delete is a no-op for `copy`),
and `RESTORE_RCLONEOPTS` turned out to be dead code. Checking the original ROCKNIX commit
settled intent, and the maintainer's input reframed it from "bug" to a design question — a
silent "fix" would have changed intended behavior.

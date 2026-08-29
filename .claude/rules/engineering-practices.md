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

## Verify the artifact, not the report

Check what was *produced* — the file written, the bytes transferred, the
process still running — not what the software *said about itself*. Software
reports success from inside its own assumptions; the artifact does not.

Three cases from this project, all of which reported success:

- `cloud_restore` filtered on `backup/*.zip` when the archive sits at the
  transfer root. It matched nothing, transferred nothing, exited 0 and
  printed SUCCESS. It shipped in four images that way.
- A provider form discarded the vendor the player chose, because the value
  was written by a `save()` that runs at page close while the action read it
  earlier. It reported "configured and working" — truthfully, since WebDAV
  tolerates an empty vendor. Only `cat rclone.conf` showed the choice gone.
  On Sharepoint that is the wrong protocol dialect.
- A backup "succeeded" for months on devices with no `zip` binary in the
  image, because the restore path uses busybox `unzip`, which was present.

The corollary for UIs: **an action that returns you to a previous screen has
not necessarily mis-fired — the process may have died.** EmulationStation
abort()ed on an assert, its supervisor restarted it, and the display fell
back to the game carousel. That is indistinguishable from a mis-aimed
keypress. Three attempts and a rewrite of the input handling went by before
anyone ran `ps`; `journalctl` had `status=134/n/a` (SIGABRT) the whole time.
When a UI step does not do what you expect, confirm the process is still
alive before re-driving the input.

An end-to-end test that passes tells you the pipeline ran. It does not tell
you the pipeline was correct.

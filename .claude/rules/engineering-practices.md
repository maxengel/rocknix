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

## A failure you find is yours to fix

Finding a defect creates an obligation to deal with it, not merely to record
it. Filing an issue is how the work is tracked; it is not how the work is
discharged. "Not caused by this change" and "was already broken" describe
provenance, not priority — the failure is now known, and shipping past a known
failure is a decision someone has to make deliberately rather than by default.

Two habits follow.

**Fix it in the session that found it, or say plainly that you did not.** A
finding buried in a comment while the work moves on is indistinguishable, later,
from a finding nobody had. If it genuinely must wait — the fix needs a design
decision, or it is far outside the current scope — put the reason in the issue
and name it in the handover, so the choice to defer is visible and someone
else's to overturn.

**Then close the hole that let it through.** Every real defect is also a
statement about the tests: something passed that should not have. Add the case
before moving on, and make it fail against the unfixed code if you still can.

`cloud_backup` reported a successful upload while sending nothing, because the
remote offered neither modtimes nor hashes and rclone compared by size (#53).
`tools/cloud-round-trip` already exercised that phase — it wrote an archive,
backed it up, restored it, and compared hashes — and it passed throughout,
because it reset the remote first. Every upload it tested was a first upload,
and a first upload always transfers. The gap was not the assertion but the
scenario: a comparison that wrongly concludes "already there" needs something
to already be there. The regression case is a second backup, of an archive
changed but the same size.

Assertions that only hold because nothing had happened yet are the ones to
distrust — see also *Verify the artifact, not the report*.

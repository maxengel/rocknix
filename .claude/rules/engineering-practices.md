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

## Guards must fail closed

A check that cannot run has not passed. Three defects in one day's work shared
this shape, and all three were invisible because the failure mode was silence.
A fourth, later, had the same shape and the opposite outcome:

- A pipeline's status is its **last** command's. `if ! producer | consumer`
  tests the consumer, so a producer that exits 1 — an unreadable input, a full
  disk — is discarded and the guard never fires. `backuptool` wrote short
  archives and announced them as successes.
- An **unquoted** list expanded into a command's arguments. A member name with
  a space split into two names that did not exist, the tool errored into
  `2>/dev/null`, and those members went unscanned — a *credential* scan
  quietly checking less than it claimed.
- **`ls A B` exits non-zero when either glob is unmatched.** Gating on it meant
  that once only one archive format was present — the normal state after a
  format change — the whole verification block was skipped, disabling the guard
  added for a shipped data-loss bug.
- **A check that reads a fixed position in another tool's output.** Verifying
  a Dropbox merge with `rclone check ... | tail -1 | grep -q "0 differences
  found"` looked exact, and matched nothing: rclone prints `N matching files`
  last, and the differences line second to last. This one happened to fail in
  the safe direction — it kept every directory it could not confirm, so the
  cost was a re-run rather than 489 MiB — and that is the whole argument for
  the rule. Grep the output, not a line of it, and let the safe branch be the
  one a broken check falls into.

Each reads as a reasonable check. Each defaults to "proceed" when its own
machinery breaks, which in a subsystem whose signature failure is *reporting
success while doing nothing* is precisely backwards. (The fourth defaulted to
"stop", which is what the rule asks for and why it cost nothing.)

So:

- **Prefer a positive assertion over the absence of an error.** Collect what
  exists and check the count, rather than branching on a command's exit status
  that also means "one of your arguments was empty".
- **`set -o pipefail`** (a subshell keeps it local) wherever a pipeline's first
  stage can fail.
- **Quote every expansion** that becomes another command's arguments, or pass
  the list some other way.
- **Prove the guard fires.** Construct the violation it exists to catch and
  watch it fail, then fix it and watch it pass. A guard with no observed
  positive is a guard with no evidence — the same rule blindspot 14 states for
  hooks, applied to checks inside a script.

An assertion that cannot fail is not evidence. Ask what input would produce a
FAIL; if you cannot name one, the check proves nothing.

Two more shapes, the fourth and fifth instances of blindspot 22 (a probe
that cannot report absence), promoted here on 2026-09-06:

- **A missing tool is a failing guard.** `comm … | wc -l` on the image's
  busybox — which has no `comm` — read 0, and 0 meant "nothing differs".
  A count built on a command that may not exist must fail loudly when it
  does not (`command -v` first), and any script that reaches for a
  coreutils name runs on the VM before the host's answer is believed
  (`generic-x64-vm-testing.md` § What the guest's busybox lacks).
- **A kill by pattern reaches the shell that runs it.** `pkill -f
  'vm76[.]qcow2'` killed its own shell because the same command text held
  the literal in an `rm` three lines down, and `bash -c` carries the whole
  script in its argv. Long-lived processes get a pidfile; a kill goes by
  PID; when a pattern is unavoidable, filter the hits by
  `/proc/<pid>/comm` before signalling.

## Before deleting a duplicate, diff its behaviours, not its purpose

"These two do the same job" is a claim about purpose. Deletion acts on
behaviour, and the two are rarely identical. Blindspot 23 was committed three
times in one day, which is the rule-of-three threshold for turning a retro note
into a rule:

- The GAME SETTINGS save rows were removed as duplicates of the transfer flow.
  They carried per-operation last-run stamps the flow never shows for saves
  alone.
- The NETWORK SETTINGS cloud group went with them, and `CHANGE CLOUD FOLDER`
  was reproduced nowhere.
- The game-end OS hook was replaced by an in-ES call so the sync would be
  visible. The hook's `pgrep` guard against a concurrent sync was not carried
  across, and a sync at boot plus a game exit put two rclone writers on one
  remote.

Each survivor genuinely could do the job. Each casualty had a property only it
had — state it reported, a row only it offered, a guard only it held.

So, before removing anything as redundant, write down what the *doomed* copy
does that the *survivor* does not: every side effect, guard, stamp, setting it
reads, and place it is reachable from. If the list is empty, say so
explicitly. If it is not, each item is either re-homed on the survivor or
deliberately dropped with the reason recorded. The survivor's ability to
perform the operation is never the test; the test is whether anything the
casualty *protected* or *reported* still is.

## Stop after three fixes on the same failure

Three sequential fix-commits on one failure without resolving it means stop:
re-read the source from the top and question the model, because you are
probably fixing the wrong layer. Each successive patch feels like progress and
narrows attention onto the last symptom, which is exactly when the actual cause
stops being examined.

2026-08-29, in one stretch: a chosen list value never reached the config; the
fix for that called `getSelected()` when nothing was selected and abort()ed
EmulationStation; the fix for *that* read `BACKUPFILE`, which belongs to
`backuptool` and is unset in `cloud_backup`; and its replacement read
`OS_NAME`, which is also empty there. Two of the four were the same mistake —
assuming a variable existed — and thirty seconds reading the top of the script
would have shown both. The third patch was the signal to go and read.

Afterwards, ask where it could have been caught earlier and add that guard.
`tools/cloud-round-trip` covered the failing phase and passed anyway, because
it reset the remote first and only ever tested a first upload. Eliminating the
category is part of the fix, not follow-up work.

(Adapted from `incident-response.instructions.md` in the scaffold estate —
<https://forge.possibility.space/scaffold/scaffold>.)

## Never reboot, update, or power-cycle a device without asking

Maintainer, 2026-09-06, after a session pushed an image and rebooted a handheld
while a restore was running on it: *"you just rebooted my device without
asking. We need a rule that says that you should never reboot my device without
asking."* Binding, with no standing authorisation: permission to build, to push
a file, or to "get the new build onto the devices" is not permission to reboot.
Each reboot is asked for, at the moment it would happen, naming the device.

- **A device belongs to a person, and that person may be using it.** An idle
  check is a prerequisite to asking, not a substitute for it. It was a
  prerequisite that failed here: it looked for a running emulator and nothing
  else, and a cloud restore was running.
- **The idle check covers everything that would be interrupted**: an emulator,
  a cloud transfer (`rclone`, `cloud_backup`, `cloud_restore`,
  `cloud_content_*`, the lock at `/var/run/cloud_sync.lock` — **an `flock`, so
  test it with `flock -n /var/run/cloud_sync.lock true`; the file's existence
  means nothing, it stays behind after every run** — the transfer page in
  EmulationStation), a scrape, an update already staged. Use a pattern
  the checking shell cannot match itself: `rclon[e]`, never a zero-width tail
  like `cloud_content_[a-z]*`, which matches its own literal in the shell's
  argv and reported two phantom transfers on 2026-09-06. When a count is not
  zero, list the processes before believing it.
- **Ask before the transfer too, not only the reboot** (maintainer,
  2026-09-07, D-QA-011: *"Why wouldn't you just ask me if it's okay to
  transfer? I thought that was our policy. It's fine if you're waiting for it
  to be idle, but you might as well just ask."*). Copying the update tarball
  into `~/.update` changes nothing until the next boot, but it is a gigabyte
  over the device's Wi-Fi and a write to somebody's card, so it is a
  question — one that can be answered once for a batch ("stage on both when
  idle"), unlike the reboot. Waiting for idle is a courtesy on top of the
  answer, never a substitute for asking. No automatic waiter stages a
  device on its own.
- **A queue of deployments is a queue of questions.** Five images in a night
  do not earn a standing yes; the fifth reboot is asked for like the first.

Recovery from the case that produced this rule: `cloud_restore` and
`cloud_content_restore` are `rclone copy`, which writes each file to a
temporary name and renames on completion and never deletes, so an interrupted
run leaves no partial files and re-running it completes it.

## If the VM can test it, the VM tests it first

Maintainer, 2026-09-06: *"if we can test something on the VM, we should test on
the VM and certainly test it first there."* Binding. The GENERIC_X64 image
(`generic-x64-vm-testing.md`) runs the same busybox, the same scripts, the same
EmulationStation binary and the same QA cloud backends as a handheld, and it
costs nothing to break. A handheld is where a mistake becomes somebody's
evening, and where the only evidence is over a wifi link to a device that may
be in use.

So, before anything touches a device:

- **Ask what the VM cannot prove**, and write the answer down. It cannot prove
  boot-loader selection on a given board, a real panel's rendering, a real
  provider's behaviour, or anything that depends on the device having history
  the VM lacks — and the last of those is answered by booting the VM from the
  *previous* image and creating that history, per `upgrade-and-install.md`.
  Everything else it can prove, and proves first.
- **The VM run is the evidence; the device run is the confirmation.** A device
  check that finds something the VM did not is a gap in the VM fixtures to
  close, not a reason to keep testing on devices.
- **Never stage state on a device the VM could have staged.** Editing a live
  config to provoke a refusal is exactly the kind of test the VM exists for.

The case that produced the rule: the vocabulary sweep (#73) was verified on two
handhelds first — the migration, a refusal path, an archive rename — and every
one of those could have run in the VM, where the same busybox helper, the same
scripts and `tools/cloud-test-backend` were sitting ready. The devices were
faster only because they already carried a previous image's state, which the
VM's upgrade recipe reproduces in minutes.

## An ask to the user is a decision, not an errand

Before handing over a command to run, establish that the session genuinely
cannot do it. A request is appropriate when what is needed is a *decision* —
approval, a credential only they hold, an action on hardware you cannot reach.
It is not appropriate as a way to skip finding the channel.

The tell is when the same problem gets solved without help shortly afterwards.
On 2026-08-28 the user was asked to run `ssh-copy-id` against a handheld; the
identical problem on a VM was solved minutes later by writing
`authorized_keys` over the serial console. The handheld had no serial console,
so the ask was legitimate — but that was never said, and the reasoning was
never done.

So: exhaust what the session can reach first, and when a channel really is
missing, name it. "There is no way to provision a key to a device from a
session without an existing login" is a useful finding; "please run this" is
not. Note also that `!`-prefixed commands run **non-interactively** — anything
needing a password or a prompt has to happen in the user's own terminal, and
that is worth saying rather than letting the command fail in front of them.

(Adapted from `operator-asks.instructions.md` in the same estate.)

## Fail gracefully: do what you can, keep the last good state, say how to recover

Maintainer, 2026-09-10 (D-CLOUD-077): *"I think failure is okay. We just need
to make sure that we degrade gracefully. If something fails, we need to have a
recovery process and a user notification process. It's easy to say, 'We
weren't able to upload. Please try again.'"* Binding for every operation a
player can start or that starts on their behalf.

- **A failure ends, and ends soon.** Bounded timeouts everywhere a network or
  a disk can stall (D-CLOUD-075); a run that cannot finish says so within a
  known time rather than holding a card, a gate, or a screen.
- **The last known good state stays in place.** Prefer operations that are
  atomic per unit (rclone's temp-and-rename, `mv` over a written temp file,
  markers written only after the bytes are confirmed) so an interrupted run
  leaves the previous file, not a partial one, and a re-run completes it.
  Where partial success is possible, it is reported as partial.
- **The message is for the player, not the developer.** What did not happen,
  in their words (`WE COULDN'T FINISH BACKING UP YOUR SAVES. WHAT DID ARRIVE
  IS IN YOUR CLOUD; THE REST IS AS IT WAS.`), then how to recover (`TRY AGAIN
  WHEN YOU'RE BACK ONLINE.`). Never a log path, an exit code, or a `logger`
  hint on a handheld's screen; the log is for us and we read it over SSH.
- **The retry is in reach.** The surface that reported the failure offers it:
  a button on the page, the row on the card's outcome line, a re-run that is
  safe because the state was kept.
- **Silence is the worst failure.** A scan that fails and shows an empty cloud,
  a run that exits 0 after moving nothing, a card that fades with no outcome:
  each is a lie by omission (blindspot 13 and 33 are both this shape).

Audit of the existing surfaces against this: #105.

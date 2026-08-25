---
description: "Every change ships onto devices that already have state. Check the upgrade path and the clean-install path before a build goes out."
paths:
  - "**"
---

# Upgrade and clean install

ROCKNIX is an immutable OS that people **update in place**, keeping `/storage`.
So every change lands on two populated devices at once: one that has been
running the previous version, and one flashed fresh. A change that only works on
the machine it was developed on is not finished.

**Run this before publishing a build**, not after a tester finds the gap.

## The two questions

For every change in the build, answer both:

1. **Upgrade** — a device running the previous version updates to this one,
   keeping its `/storage`. What does it already have that this change did not
   anticipate: an older config file, an artifact written by the old code, a
   setting under a name we stopped using, a marker file nobody consumes any more?
2. **Clean install** — a freshly flashed device with no `/storage` history. What
   does this change assume exists that only exists because a previous version
   created it?

## What to check, by kind of change

| Changed | Ask |
|---|---|
| A config option | Is it in **both** `*.conf` and `*.conf.defaults` (with the `DEFAULT_` prefix)? `cloud_sync_helper` only appends what is missing, so an option absent from defaults never reaches an upgraded device. |
| An **artifact format** (archive, manifest, save layout) | Can the new code still read what the old code wrote? This is the one that bites — see below. |
| A settings key | Does the old key still exist on upgraded devices? Renaming a key silently resets everyone's preference. |
| A script's flags or output | Anything parsing it — hooks, ES, other scripts — may still be the old version until its own package rebuilds. |
| A marker/sentinel file | Is there still a consumer? An orphaned marker sits forever; a missing one silently disables a flow. |
| A menu entry that moved | Nothing persists, but check two things. Does a *second* path to the same operation now exist? Two entries doing almost the same thing is how someone gets a backup missing what they assumed was in it. And does any **string still name the old path**? Grep the old menu names: help text, error messages and post-restore advice hard-code them, and a message that sends someone to a menu that no longer holds anything is a dead end at the moment they most need the instruction. |
| A file the OS provides (symlink, seeded config) | Does the change assume it is a regular file? |

## Fixing forward is not enough

The trap worth naming, because it already caught us: **a fix that changes what
we write does nothing for what is already written.**

`358eb53d3f` stopped backups from capturing the contents of symlinked paths. It
did not help any backup already on a device or in someone's cloud — those still
held a regular file where the device has a symlink, and busybox unzip aborts the
whole restore when it meets one. Fixed forward, still broken backward, and the
broken ones were everybody's. The restore side needed its own fix
(`02297b9c07`).

So when a format changes, ask separately:

- Does new code read **old** data? (compatibility)
- Does old code read **new** data? (a downgrade, or a device that has not updated yet)
- Does anything need to be **migrated**, and can that migration be interrupted?

## An upgrade should be invisible

Before deciding a change needs a migration, or a prompt, or a release note, ask
whether the code can simply handle both shapes. In that order:

1. **Read both, write the new one.** The old layout keeps working, new writes
   land in the new place, and the data migrates itself as it is touched. Nobody
   is told anything because nothing happened to them.
2. **Ask, only if step 1 genuinely cannot work** — the shapes are
   irreconcilable, or the choice is really the owner's to make.
3. **A release note is never a mitigation.** It is a record for people who go
   looking, not a control. Assume it is unread.

**A prompt is a failure mode, not a solution.** Asking somebody about a setting
they never chose and have never heard of is only marginally better than the
breakage it replaces — they still have to form an opinion about our internals
to get back to playing a game.

The case that produced this rule: `CONTENTPATH` was a new config key, so an
upgraded device looked in a location it had never used and showed an empty
content list. The first design detected the situation and offered to fix it.
The better one made restore read both locations while backup writes only to the
new one (`c3994ef4cb`) — the library migrates itself the next time it is backed
up, and there is nothing to explain, prompt about, or document. The prompt-based
version was most of a day's work that turned out to be unnecessary.

Applies past config keys: file formats, marker names, menu locations, directory
layouts. If a device that upgrades and a device that is freshly flashed can both
be made to just work, that is the answer, and everything else is a fallback.

## Migrations

If a migration is genuinely needed:

- **Non-destructive first.** Copy and verify before removing anything. A
  migration killed halfway must leave the device working, not stranded between
  two layouts.
- **Attribute honestly.** Do not stamp existing data with metadata you have not
  verified — inventing authoritative-looking wrong data is worse than leaving it
  unknown. `unknown` must be a value the consumer handles.
- **Idempotent.** It will run twice. That must be harmless.
- **Prefer additive.** Writing new data in the new shape while still reading the
  old shape avoids a migration entirely, and cannot be interrupted destructively.

### Migrating data that lives in someone's cloud

The rules above still apply; these are the ways a remote migration is harder
than a local one, and each has cost somebody their data somewhere.

- **Copy, verify, then delete — never `rclone move`.** `move` deletes as it
  goes, so an interruption leaves the library split across two locations with
  no record of which files went where. Copy the whole set, verify it, and only
  then remove the original.
- **Verify means comparing content, not trusting an exit code.** `rclone check`
  compares hashes; a zero exit from the transfer itself only says the command
  ended. A partial batch can exit clean.
- **Interruption is the normal case, not the exception.** A handheld drops off
  wifi mid-transfer as a matter of course, where a local migration is only
  interrupted by power loss. Design for resumption, and make a second run
  harmless.
- **Never move what you did not put there.** `/storage/roms` belongs to us; a
  cloud folder is shared with the owner's own files. Act only on paths the
  device can account for — `cloud_setup --content-location` reports the
  directories this device actually has locally, and deliberately ignores the
  rest. A migration that swept up somebody's photos because they sat in the
  same folder would be unforgivable and entirely avoidable.
- **Ask first, and let "leave it alone" be the default.** Cloud layout is
  usually cosmetic; the risk of moving is not. If the tidier layout cannot
  justify the failure mode, offer the no-op resolution and stop there.
- **Another device may be syncing at the same time.** One player, many devices
  is this project's model, so a migration cannot assume it is the only writer.

## Verify on a device, not on the host

Host tools are not the tools on the device, and the difference hides real
failures. Info-ZIP on a desktop silently replaces a symlink and returns success;
busybox on the device refuses and aborts. The bug was invisible until it ran on
the target.

The cheap way to cover both paths, per
[`generic-x64-vm-testing`](generic-x64-vm-testing.instructions.md):

- **Clean install** — boot the built image in a fresh VM.
- **Upgrade** — boot a VM from the *previous* image, use it enough to create
  state (a backup, a config change, a save), then update it in place and confirm
  that state still works.

`tools/vm-visual-qa` drives both headlessly.

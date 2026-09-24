# Device testing policy

**Decided:** D-QA-008 (never reboot without asking, 2026-09-06), D-QA-011 (ask before
staging each build), D-QA-015 (every action on a device or in its cloud is asked for by
name, 2026-09-11). **Open:** D-QA-016 (a dedicated QA handheld and accounts, #131).
The practice text lives in `.claude/rules/engineering-practices.md` under "Never reboot,
update, or power-cycle a device without asking" and "Nothing runs on a person's device
without their yes"; blindspots 26 and 38 record how each rule was learnt.

## The first question

**Can this be done on the VM?** Written down, with the answer, before any device run is
proposed. Only a "no" with a reason -- a real panel, a real board's memory or GPU, a
battery -- moves a test off the VM; "a real provider" is not such a reason, because the
VM host can run WebDAV, S3, SFTP, SMB and FTP backends of its own and a VM guest can sign
in to a hosted QA account (D-QA-017, #133).  Provider coverage is deliberately
not Dropbox-shaped: the maintainer uses Dropbox, and QA does not optimise for one
person's provider (D-QA-017).

## The one sentence

The handhelds on this LAN belong to a person who may be using them, and the cloud they
sync to holds that person's production data. **Nothing runs on either without that
person's yes, given per action, at the moment it would happen.**

## What is an action

Anything that changes what the device is doing or what it holds, or what the cloud holds:

- a reboot, a power-cycle, applying a staged update;
- launching a game or any emulator, sending input to the pad, opening menus;
- taking a screenshot (it uses the compositor and shows what is on screen);
- writing under `/storage` -- a ROM, a save, a probe file, a config edit;
- running any cloud script, or rclone, against the configured remote: a sync, a backup,
  a restore, an upload, a listing that is not read-only, a deletion, a `--backup-dir`
  move;
- anything that triggers one of the above indirectly on a configured device -- the
  game-exit sync fires on every emulator exit, the startup sync on every boot.

## What is not

Reading: `journalctl`, `/var/log`, a config line, a stamp, `ls`, `rclone lsf`/`lsl`, a
checksum of a file already there. Staging a tarball under `~/.update` is inert and
allowed (D-QA-011); the reboot that applies it is the question. Every read is still
named in the report, and credentials are filtered out of anything read back.

## How to ask

One message, one question, before the action, naming: the device; what will happen on its
screen; what will be written, sent, moved or deleted, and where; what the action leaves
behind afterwards -- **including what the device's own automation will do in response**;
and why the VM could not answer it. Then wait. A yes to one action is a yes to that
action; a yes to a category ("test the forms", "anything that requires device testing")
is a yes to be asked again for each member of it.

## The VM first, always

`engineering-practices.md` § "If the VM can test it, the VM tests it first" (D-QA-007).
The GENERIC_X64 pair, the QA WebDAV endpoint (`tools/cloud-test-backend`) and the runner
(`tools/vm-qa`) exist so that no proof needs a person's device or data. A device run is a
confirmation of something the VM cannot reach -- a real panel, a real board, a real
provider -- and is scoped to exactly that.

## Reading a device's output

Reading is not an action, but what is read lands in a transcript. A device's
`system.cfg`, its `rclone.conf`, the output of `get_setting` and anything
piped back over SSH can carry a sign-in. So every read of those goes through
a filter, and the filter is wider than the word *password*: rclone writes
`pass =`, `user =`, `token =`, `key =`; the network writes `psk`.

```bash
grep -v -i -E 'key|pass|token|user|psk'
```

A line the filter drops is a line nobody needed to see; a line it lets
through with a secret in it is a transcript to scrub. The same filter applies
to the QA guests, whose endpoint credentials are throwaway but whose config
files have the same shape (2026-09-12: `pass =` slipped a filter written as
`password`).

## When it went wrong

2026-09-06: a handheld rebooted mid-restore without a question (blindspot 26 → D-QA-008).
2026-09-11: on "anything else that requires device testing", a session ran the exit test
four times (seven RetroArch launches), drove the menus, and uploaded, replaced and deleted
a QA save in the maintainer's Dropbox, without a further question; the maintainer met the
files in Dropbox first (blindspot 38 → D-QA-015). Cleanup of those files was itself asked
for and done only on a yes.

---
description: "What a handheld keeps across a power cycle, what to capture first when one misbehaves, and how the hang-to-reboot path works."
paths:
  - "projects/ROCKNIX/packages/sysutils/**"
  - "projects/ROCKNIX/packages/rocknix/**"
  - "projects/ROCKNIX/devices/*/linux/**"
  - "projects/ROCKNIX/devices/*/patches/linux/**"
  - "docs/**"
---

# Evidence on a handheld

The RG SP froze during a startup sync on 2026-09-09 and the forced power-off
that followed erased every log that could have said why (#102). Nothing
could be learned, and the same power-off truncated two config files. Since
#104 a device keeps its evidence, and a hang ends itself. This is what is
where, and what to do first.

## What survives what

| Thing | Where it lives | Survives a reboot | Survives a power cut | Survives a re-flash |
| --- | --- | --- | --- | --- |
| The journal (all boots, 64M cap) | `/storage/.cache/log/journal/` (bound over `/var/log`) | yes | yes, minus the last minute of low-priority lines | no |
| Kernel log of the *previous* boot | in the journal: `journalctl -k -b -1` | yes | yes | no |
| A panic or hang's stack trace | ramoops at boot, copied to `/storage/.cache/log/pstore/` | yes | **only if the reset was warm** (watchdog, panic); a cold power cut clears RAM | no |
| `es_log.txt` and its four predecessors | `/var/log/es_log.{,0,1,2,3}.txt` | yes | yes | no |
| `cloud_sync.log` (trimmed past 1 MiB) | `/var/log/cloud_sync.log` | yes | yes | no |
| Device-state pages, ring of five, every 5 min | `/storage/.cache/log/evidence/state.N.txt` | yes | yes | no |
| The sync stamps | `/storage/.cache/cloud_sync/` | yes | yes | no |
| `system.cfg`'s last known good copy | `system.cfg.backup` (D-CLOUD-078) | yes | yes | no |
| Anything under `/tmp`, `/run`, `/var` outside `/var/log` | RAM | no | no | no |

`/var/log` is a bind mount of `/storage/.cache/log` (upstream's
`var-log.mount`, switched on by D-SYS-001). Creating
`/storage/.cache/volatile-log` turns it, and the state snapshots, back off.

## When a device misbehaves: first, before anything else

**Before any of it: the device is a person's, and every action on it or in its
cloud is asked for by name first (D-QA-015, `docs/device-testing-policy.md`).
Reading the journal, the stamps and the config is free; a reboot, a launch, a
sync, a screenshot or a deletion is a question.**

```
rocknix-evidence collect
```

One archive under `/storage/.cache/log/evidence/`, with the previous boot's
journal and kernel log, any pstore dump, the ES and cloud logs, the state
snapshots, and the config files **by size only**. Copy it off the device;
read `summary.txt`, then `journal-previous-boot.txt`, then `pstore/`. Do
this before a second reboot, before re-running anything, and before touching
a config file -- each of those is another boot of journal and one more
chance for the interesting one to be rotated out.

If SSH is gone and the screen is static, wait a minute before reaching for
the power button: a kernel that has stopped scheduling is reset by the
watchdog within 15 s, a soft lockup panics after 20 s, a task stuck in the
kernel after 120 s, and the kernel reboots ten seconds after a panic. A
device that comes back on its own has left its trace; one that had to be
power-cycled has left everything except the trace.

What the journal cannot tell you is answered by the snapshot pages: memory
and pressure, temperature, what was running, whether a sync held the lock.

## The hang-to-reboot path, and what it is not

- `RuntimeWatchdogSec=15s`: PID 1 pings the SoC watchdog every 7.5 s. 15 s
  because the Allwinner watchdog counts to 16 at most; systemd asks for
  what it can get and a longer figure is refused outright (D-SYS-002).
- `RebootWatchdogSec=off`, on purpose: the same cap would reset a device in
  the middle of a slow sync to the card at shutdown, which is the corruption
  all this exists to prevent. A hung shutdown behaves as it always did.
- `kernel.softlockup_panic=1`, `kernel.hung_task_panic=1`, `kernel.panic=10`
  (`/usr/lib/sysctl.d/hang-policy.conf`, D-SYS-003). `panic_on_oops` stays 0:
  an oops that does not take the machine down is in the journal, and the
  player keeps their session.
- ramoops: 1 MiB at `0x4F000000` on every H700 board, from the SoC dtsi
  (D-SYS-004). 512 KiB of console log, four 128 KiB dumps.

**It catches a kernel that has stopped, not a program that has.** An
EmulationStation that is alive and unresponsive, an emulator that will not
exit, a sync that never ends -- none of those stall PID 1 or the scheduler,
and none reboot the device. They are what the snapshot pages and the ES log
are for, and a userspace watchdog is an open question (D-SYS-006).

## Testing it on the VM

The GENERIC_X64 profile carries QEMU's `i6300esb` watchdog with
`-action watchdog=reset`, and its kernel has pstore over UEFI variables, so
every part of this except H700 DRAM retention is provable on the VM
(`generic-x64-vm-testing.md`, "Crash and hang recipes"). A device proof of
ramoops -- `echo c > /proc/sysrq-trigger` on a handheld -- is a deliberate
crash of somebody's device and needs their yes, by name (D-QA-008).

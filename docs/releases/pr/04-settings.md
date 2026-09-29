Title: rocknix: the last good settings file, and backups that never carry a sign-in

A `system.cfg` cut short by a power loss reset a device to defaults: it was backed up at every clean shutdown with whatever it held, so the truncated file replaced its own good copy. `chksysconfig` now writes `system.cfg.backup` only from a file that has just been checked, and verify at boot takes the live file, then the record, then the defaults, saying which. A shell writer never completes a cut file. `backuptool` writes `tar.gz` archives whole and renamed, holds back every Wi-Fi, account and cloud credential and refuses an archive in which a sign-in is still found, and restore keeps a way back; an interrupted restore is undone at the next boot. On-device backup and restore had reported success while writing short archives and aborting on the first symlink.

**What it carries.** `chksysconfig` and its unit, the boot autostart, `profile.d/001-functions` and `userconfig-setup` (the shared settings functions), `backuptool`, `run`, `factoryreset` and `rocknix-update` (a status returned, a download kept as `.part` until its checksum matches), `setrootpass` (an empty password refused), `automount`, the post-update hooks, and the shipped `system.cfg`, which also carries the keys later PRs read (the RetroAchievements switches, the cloud toggles); a device without those features ignores them.

**How it was tested.** `tools/last-good-scripts-test` runs every shell path under the image's own busybox with the image's own files as fixtures (1,257 cases pass); the upgrade rehearsal boots the previous image in a VM, seeds a player's state, updates in place and checks every piece survived (20 of 20); a truncated `system.cfg` was constructed and the record restored it. On an RG35XX SP, the case that produced the rule (#102) does not recur.

**What it does not touch.** Which files a backup holds is `backuptool.conf`'s, read as text and never sourced; the cloud tiers are the cloud PRs'.

**Kernel, bootloader or device tree.** None.

**Depends on.** PR 3 (`rocknix/package.mk` installs chksysconfig's unit there).

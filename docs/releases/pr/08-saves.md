Title: rclone: saves synced on their own, every save recorded, content tiers

Saves sync at startup and after every game, bounded (a busybox `timeout` at 90 s, a stall watched through a fifo) and visible (a card that ends COMPLETED, COULDN'T FINISH with a why, or SKIPPED for no network or a game started); a launch waits for a sync it can see instead of cancelling it. Every game exit is recorded in a per-device manifest by `cloud_capture`, each save version by the hash of its bytes and the emulator, core and device that wrote it, taken from a staged copy and never the live file; the boot pass re-hashes what the manifest claims and adopts nothing. What a transfer replaces is set aside for one cycle. ROMs and BIOS and the scraper's content back up and restore a system at a time, copy-only, and one action matches the device to the cloud after showing what it would delete. On a WebDAV server that compares by size alone, a save that changed but kept its size now moves (`--update` against the upload time). The launcher's `-state_file` contract lets the save-state manager and RetroArch agree on which state a launch loads.

**What it carries.** `cloud_backup`, `cloud_restore`, `cloud_capture`, `cloud_content_backup`, `cloud_content_restore`, `cloud_sync_helper`, `cloud_saves_root`, `cloud_migrate_layout`, `cloud_log_scrub` (credentials earlier builds logged, masked once), the configuration and its defaults, the allowlist (databases excluded first, the standalone N64 saves included), the boot autostart, `runemu.sh` (the platform and save-state flags by argument; the exit status returned), `input_sense` (the exit hotkey's press marked), `es_savestates.cfg`, and three RetroArch patches: one poster at a time on the threaded video wrapper, a posted command run once, the Auto slot kept across a content load.

**How it was tested.** `tools/cloud-round-trip` on the x86_64 VM against the host's own WebDAV, S3, SFTP, SMB and FTP backends, with the link cut at seven points mid-run; the size-only step with a two-second wait; the capture's own harness under the image's busybox; the upgrade rehearsal from the previous image; on an RG35XX SP the maintainer's play, offline and back. The stamps every card reads are in `docs/technical-appendix-cloud-sync-and-offline-achievements.md` on the fork.

**What it does not touch.** The provider setup (PR 7); the pages (the interface PR).

**Kernel, bootloader or device tree.** None.

**Depends on.** PR 7 (rclone's recipe installs these scripts) and PR 6 (`setsettings.sh`).

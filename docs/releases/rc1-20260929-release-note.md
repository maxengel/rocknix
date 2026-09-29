The first release candidate of the fork's cloud sync, offline achievements and Wi-Fi work, for anyone with an RG35XX SP, an RG SP, a Retroid Pocket Nova or an RG353M who wants to try it before it goes upstream.

### What's new

- Cloud storage is set up on the device itself: pick a provider from the list, sign in on the device or with your phone, and the connection is kept only once your provider answers.
- Everything cloud lives in one place, `Game Settings` > `Manage Cloud Storage`: back up, restore, the saves toggles and the storage setup, each row saying how it last went.
- Saves sync on their own at startup and after every game, in a few seconds, with a card at the top of the screen that says how it went; offline, the card says so and it tries again next time.
- Backing up or restoring ROMs, BIOS, game content and settings runs on a page of its own that stays until you've read the outcome, and `Cancel` is the way out while it runs.
- Offline achievements (beta): scan your games once while online, earn casual achievements without a connection, and they're sent to your account the next time you're online.
- The Wi-Fi picker lists the networks around you, remembers the ones you join, and `Manage Saved Networks` forgets them; the password is typed where the network is chosen.

### What's fixed

- A save that changed but kept its size now reaches a plain WebDAV server; before, it never moved again after its first upload while the card read COMPLETED.
- A settings backup never carries a Wi-Fi password or an account sign-in, and restoring one onto a device walks you through entering them again.
- A settings file cut short by a power loss no longer resets the device to defaults: the last good copy is kept and put back.

### What to know

- Turning offline achievements on turns hardcore mode off; it's casual achievements only while the beta lasts.

### Devices and how to install

- **RG35XX SP and RG SP (H700)**: flash `ROCKNIX-H700.aarch64-20260929-DDR4.img.gz` for an RG35XX SP and `-DDR3.img.gz` for an RG SP (those are the two we have; if yours doesn't boot on one, it's the other), then copy your device tree as the [H700 page](https://rocknix.org/configure/h700-installation/) says. To update in place, copy `ROCKNIX-H700.aarch64-20260929.tar` to `/storage/.update` and reboot.
- **Retroid Pocket Nova (SM8550)**: `ROCKNIX-SM8550.aarch64-20260929.img.gz`, or the `.tar` in `/storage/.update`.
- **RG353M (RK3566)**: flash `ROCKNIX-RK3566.aarch64-20260929-Generic.img.gz` (its bootloader detects the RG353 boards; the `-Specific` image names a device tree for boards it cannot detect), or the `.tar` in `/storage/.update`.

Each file has a `.sha256` beside it.

<details><summary>Built from, tested on</summary>

Two heads. The H700 images are build `8dd6765af0` (fork `next` at that commit; EmulationStation `014f82685`; upstream `next` at `6b344ab54d` and ROCKNIX's EmulationStation master at `cada856d8` underneath). The SM8550 and RK3566 images come from `5b5005879e`, which adds only the round's records, its documentation, and build fixes for two packages those devices ship and the H700 does not: mangohud and gamescope, whose meson subprojects now come from pinned sources instead of a download at configure (D-WORKFLOW-069, D-WORKFLOW-070).

What was run on `8dd6765af0`, on the GENERIC_X64 VM: vm-qa run 72 (fourteen suites; the cloud round trip's size-only step in run 72b after a two-second wait was added to the test), the proofs' run 5 with its 5b and 5c re-runs (37 scripts, 220 checks PASS, 3 FAIL: the `E1-pl069` pair, #310, and one line of `F2-widgets`, #324), the upgrade rehearsal from `d39ccdfff3` (RESULT PASS), the offline-achievements test 31 of 32. The H700 tar was staged on an RG35XX SP at 05:47 UTC on 2026-09-29 and the interface came up; the play-through is in progress. The H700 image choice was read from the DRAM regulator on 2026-09-05: `vdd-dram` at 1.1 V on the RG35XX SP (LPDDR4, the DDR4 image) and 1.2 V on the RG SP (LPDDR3, the DDR3 image); the one update tar carries both bootloaders and picks by the running board. The SM8550 and RK3566 images are built and checksummed and have not run on a device yet.

Issues: #236 (the round), #321 (this release), #322 (the upstream series), #323 (the documentation). The change log is `docs/cloud-sync-changelog.md` on the fork.

</details>

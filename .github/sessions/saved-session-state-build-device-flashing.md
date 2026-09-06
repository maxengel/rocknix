# Saved Session State — device flashing

Saved: 2026-09-05T23:01:00Z
Worktree: `/workspace/repos/rocknix.worktrees/device-flashing`
Branch: `build/device-flashing` at `bba8620e0b`

## Current focus

The maintainer rebooted the RG35XX SP and asked to confirm it runs v7, then
prepare to flash the separate RG SP. The RG35XX SP verification is complete,
and the RG SP's 32 GB `int` card has been flashed and read back successfully.
The RG SP booted from it, completed first-boot storage expansion, and passed
running build, device-tree, and TF2 mount verification.

The follow-up was a v7 cloud-setup regression found on that RG SP.
`GAME SETTINGS > CLOUD SETTINGS > ALL CLOUD SETTINGS AND SERVICES > CLOUD
STORAGE SETUP > CONNECT OR REPAIR CLOUD STORAGE` opens the old SSH/computer
wizard, so a first remote only offers `ON YOUR COMPUTER` even though the same
binary contains the native `WITH MY PHONE` flow.

The routing fix was built as v8. Selecting `WITH MY PHONE` then crashed ES on
the RG SP. The separate page-lifetime correction is now integrated, published,
and built as v9; the full H700 build and artifact checks passed. Both handhelds
were verified running v8 with empty update queues before transfer. The v9
shared update is now staged on both RG35XX SP (`192.168.1.81`, DDR4) and RG SP
(`192.168.1.175`, DDR3); both device-side checksums passed. No reboot was issued.
Installation and real-device UI checks remain pending until reboot. Details
and artifact hashes are below.

Before flashing, the maintainer booted the RG SP's supplied stock firmware so
its RAM could be identified. It came online at `192.168.1.175`; the stock
firmware's SSH server was
enabled and accepted its documented default `root` / `root` login.

## Verified RG SP state and RAM type

- Stock OS: Ubuntu 22.04, vendor kernel `4.9.170`, built 2026-06-24.
- Device-tree model: `sun50iw9`; compatible: `allwinner,h616` and
  `arm,sun50iw9p1`; `/proc/meminfo` reports 996480 kB.
- Stock boot medium: 16 GB card at `/dev/mmcblk0`; its first partition starts
  at sector 73728, leaving the vendor boot chain in the unpartitioned prefix.
- Copied the first 16 MiB into temporary storage and verified identical
  SHA-256 on the device and host:
  `cc666083de5d9d8dee45f435db7feac450ebf44bccc586f09cf8f8c6383a2cd1`.
- Both vendor boot0 copies (`eGON.BT0` at byte offsets 8192 and 262144) carry
  H616/H700 DRAM parameter word 1 = `7`. The primary bytes at offset 8192
  decode to DRAM clock 672 and DRAM type 7. Allwinner boot0 identifies type
  7 as **LPDDR3** (type 8 is LPDDR4).

Therefore this physical RG SP requires the ROCKNIX **DDR3** flash image.
The temporary device copy was removed; SSH was closed. The stock card was
only read.

## Initial verified RG35XX SP state (v7)

Read over the existing `rg35xxsp` SSH profile (`192.168.1.81`):

- Model: `Anbernic RG35XX SP`.
- Device tree: `sun50i-h700-anbernic-rg35xx-sp`.
- OS version: `20260905`; target: `H700.aarch64`.
- Build: `394a3d536a26fbc2e6a74620fec98f5568e52780`, branch `build/devices`.
- `/storage/.update/` is empty.
- DRAM regulator: `1100000` microvolts (DDR4 per the H700 updater).
  This measurement belongs to the RG35XX SP, not the separate RG SP.

This is v7: the seventh H700 build described in the 2026-09-05 work log at
08:15 UTC. It adds RetroAchievements WEB API KEY entry (#68) and the tools
artwork fix (#69), carrying the earlier scraper and sync changes.

The SSH profile already sets `StrictHostKeyChecking no` and
`UserKnownHostsFile /dev/null`. The earlier strict-check override prevented
the status read. Using the existing profile succeeded; no SSH settings were
changed. Inside this sandbox use `-F /home/max/.ssh/config` to avoid the
system SSH configuration ownership error, and request network escalation.

## Verified original local artifacts (v7)

Directory: `/workspace/artifacts/rocknix-images/`. The build worktree's
`target/` now contains v9; these retained parent-level files remain v7.
Checksums recomputed successfully:

| Artifact | SHA-256 |
| --- | --- |
| `ROCKNIX-H700.aarch64-20260905-DDR3.img.gz` | `880caca777acb271eb9838ffa6ad3d8698c51c8d4c5cc3a5dbe0b0e05b5c2d69` |
| `ROCKNIX-H700.aarch64-20260905-DDR4.img.gz` | `63df8f6f282ea84b1c64e7174eac208bb6a22964203b963aecdc17c86d49ba12` |
| `ROCKNIX-H700.aarch64-20260905.tar` | `5c55346f9b5272004407fc4a88c45775111b0d09af164c6078f525cd4e4a8c27` |

The update tar contains `sun50i-h700-anbernic-rg-sp.dtb`. The build staging
tree contains it too, and its `etc/os-release` matches v7. The flash images'
checksums pass.

The selected DDR3 image was decompressed to temporary storage and inspected:

- Uncompressed SHA-256:
  `7dbb6ebf1377cee61c0ad268dbb47a71c1e1f94427b27a6aa4c93deba8bfc6d9`.
- Its FAT filesystem contains `sun50i-h700-anbernic-rg-sp.dtb`; SHA-256:
  `2fc2e8e2aecc29d280f55bf7d131bb251a29e8b353af8b7c56af019c20a7d230`.
- The embedded `SYSTEM` matches its recorded MD5 and reports v7 build ID
  `394a3d536a26fbc2e6a74620fec98f5568e52780`.
- Its extlinux config applies the DDR3 overlay.

## Verified RG SP card flash

The 32 GB card appeared in the USB reader as `/dev/sdb`, a removable
31,914,983,424-byte disk. Its stable reader-slot link was
`/dev/disk/by-id/usb-Generic_MassStorageClass_000000001621-0:1`; it had no
mounted partitions. The reader's other slot appeared as an empty 0-byte
`/dev/sda` device.

Wrote 2,198,863,872 bytes from the verified DDR3 gzip stream and flushed the
device. Reading exactly that byte count back from the card produced SHA-256
`7dbb6ebf1377cee61c0ad268dbb47a71c1e1f94427b27a6aa4c93deba8bfc6d9`,
identical to the verified uncompressed image. The flash is complete.

After the full-image readback, refreshed the partition table and inspected the
2 GiB FAT boot partition. As expected for a fresh H700 image, it contained all
device trees but no active `dtb.img`. Copied
`device_trees/sun50i-h700-anbernic-rg-sp.dtb` to `/dtb.img`, flushed and
unmounted it, then remounted read-only. The active file matches the source
SHA-256 `2fc2e8e2aecc29d280f55bf7d131bb251a29e8b353af8b7c56af019c20a7d230`.
The extlinux configuration points to `/dtb.img` and applies the DDR3 overlay.

The RG SP subsequently booted this card. When returned to the reader, TF1 was
31,914,983,424 bytes with a 2 GiB FAT `ROCKNIX` partition and a 29,750,722,560-
byte ext4 `STORAGE` partition. The storage filesystem reported 28 GiB usable,
206 MiB used, and no `.please_resize_me` marker. This proves first-boot
expansion completed; TF1 does not need to be rebuilt.

## Prepared RG SP external games card

The intended 128 GB TF2 card appeared as a removable 127,865,454,592-byte
disk. It still held a 15-partition Android layout (`security`, `uboot`,
`trust`, `recovery`, `super`, swap, and an F2FS `userdata` partition), which
the current ROCKNIX games-card discovery cannot adopt as normal external
storage.

After exact-size, removable, and unmounted checks, erased that layout and
created one GPT partition spanning 127,863,357,440 bytes. It is ext4, labelled
`GAMES`, UUID `81083868-e5de-4ad4-a90b-b44106893d1f`. A read-only `e2fsck`
completed all five passes without errors. ROCKNIX should create the external
ROM directories when this card next boots in TF2.

The current build defaults to `system.merged.storage=0`. In that mode TF2 is
the active games/ROM card while TF1 continues to provide ROCKNIX and base
`/storage`. A fresh TF1 build is unnecessary. Merged storage is optional and,
if enabled, combines ROM directories from both cards through overlayfs; ext4
on TF2 supports it.

## Verified running RG SP and TF2 layout

The RG SP came online at `192.168.1.175` with SSH enabled. It reports ROCKNIX
`20260905`, build ID `394a3d536a26fbc2e6a74620fec98f5568e52780`, model
`Anbernic RG-SP`, and device tree `sun50i-h700-anbernic-rg-sp`.

The live storage identities and paths are correct:

- `/dev/mmcblk0p1`: FAT `ROCKNIX`, UUID `FEF2-6516`;
- `/dev/mmcblk0p2`: ext4 `STORAGE`, mounted at `/storage`;
- `/dev/mmcblk1p1`: ext4 `GAMES`, UUID
  `81083868-e5de-4ad4-a90b-b44106893d1f`, mounted at
  `/storage/games-external`;
- `/storage/games-external`, `/storage/games-external/roms`, and
  `/storage/roms` have the same filesystem device ID, while internal paths
  remain on TF1; and
- ROCKNIX created 128 top-level ROM-system directories on TF2.

A follow-up comparison confirmed TF1's
`/storage/games-internal/roms` scaffold exists but has zero child directories;
TF2 and the active `/storage/roms` each expose the same 128. Nothing removed
the TF1 directories: the card was only mounted read-only after its first boot.
The directory generator populated the active external ROM target.

The maintainer clarified that both cards were inserted for the initial
power-on: ROCKNIX TF1 plus TF2, which was believed empty but still contained
the Android layout. The retained `/flash/fs-resize.log` shows that the initial
power-on detected `.please_resize_me`, selected the special
`fs-resize.target`, expanded `/dev/mmcblk0p2` to 7,263,360 4K blocks,
regenerated UUIDs, synced, and forced a reboot. That target does not run
`rocknix-automount.service`, so it ignored TF2 for games-directory purposes.
Both cards remained present for the following normal boot, when the Android
TF2 partitions became candidates for external storage. If TF2 is absent on a
later normal boot, the automounter can bind and populate the internal target
instead.

A temporary non-recursive bind view of TF1 confirmed that its normally hidden
`games-external` mountpoint also has no `roms` child, so the old boot did not
write the directory tree anywhere on TF1. The original Android TF2 had two
eligible ext4 partitions (`cache` and `metadata`) alongside its unsupported
F2FS `userdata`. The automounter enumerates supported partitions but checks the
8 GiB minimum against their parent disk, so it could have selected one of those
small ext4 partitions and populated it during the first normal boot. Those
partitions were erased before their contents were inspected, so this is the
most likely explanation rather than a provable historical observation.

The retained automount journal showing `/dev/mmcblk1p1`, external ROM-tree
creation, and the `/storage/roms` bind is from the later verified boot after
TF2 had been reformatted as the single ext4 `GAMES` partition. It proves the
current layout, not which partition the earlier Android-card boot selected.

Saved settings are `system.automount=1`, `system.merged.storage=0`, and
`system.merged.device=external`. The automount journal records discovery and
filesystem checking of `/dev/mmcblk1p1`, creation of the external ROM path,
and the bind mount to `/storage/roms`.

## Flashing runbook

The repeatable fresh-card procedure now lives at
`docs/device-flashing-runbook.md` and is linked from the canonical
`.claude/rules/device-builds.md` install section. It covers new-image intake,
physical board-variant evidence, run-time card identification, raw write and
full readback, optional device-specific `/dtb.img` activation, first boot, and
the records required when adding an image or device. Root `AGENTS.md` contains
a direct flashing warning and pointer so Codex sessions discover the runbook.

For this RG SP/H700 path, all routine OS and boot firmware updates are owned by
ROCKNIX. `projects/ROCKNIX/devices/H700/bootloader/update.sh` refreshes DTBs and
overlays, selects the running model's `dtb.img`, detects DDR voltage, and writes
the matching U-Boot/SPL to the SD boot disk. No separate RG SP controller-
firmware updater or Anbernic-package prerequisite exists in the current tree.
The supplied stock card remains unchanged recovery/reference media.

Anbernic's current update page lists only
`RGSP-V1.0.1-EN16GB-260624`, matching the June 24 stock system this unit already
booted. Its product specification says the system storage is a 16 GB TF/microSD
card with dual TF slots, so the vendor's “firmware” item is the full stock card
image rather than a separate layer installed inside the handheld. Re-evaluate
only if a future vendor notice explicitly names persistent MCU/controller
firmware.

## Cloud setup regression and merged fix

The v7 image pins `maxengel/emulationstation-next` branch
`test/qa-integration` at `0f83d5153bc9b2583a5023a1bd3bf332e6b8a0ac`.
That source contains both setup implementations:

- `GuiMenu::openCloudAddRemote` is the intended native provider list and
  offers `WITH THE ON-SCREEN KEYBOARD` or `WITH MY PHONE` for OAuth providers.
- `GuiMenu::openCloudSetup` is the legacy SSH wizard. It remains necessary
  for crypt and union remotes, other advanced rclone configuration, and
  repair cases the native form cannot express. Its intended entry is
  `USE A COMPUTER INSTEAD` inside the native page.

Commit `483b270e` added the consolidated cloud hub but wired `CONNECT OR
REPAIR CLOUD STORAGE` directly to `openCloudSetup`, reversing D-UI-005. Two
other setup invitations also still called that legacy function. The staged
H700 EmulationStation binary contains `WITH MY PHONE`, `ON YOUR COMPUTER`, and
`USE A COMPUTER INSTEAD`; the phone backend was compiled but unreachable from
the normal first-remote path.

EmulationStation branch `fix/cloud-setup-entry` at commit
`c5443dd0` changes all three user-facing setup invitations to
`openCloudAddRemote`. The only remaining calls to `openCloudSetup` are the
explicit `USE A COMPUTER INSTEAD` row and the legacy wizard's own refresh
after a setting change. It was published and merged into `test/qa-integration`
as `3590093e4e676a8e8aea4d3274598317c7e2cfb0`. ROCKNIX commit
`1a44c12397fee4460408722642c78270f802912f` advances the package pin to that
merge. That v8 pin was merged into `next` and published to `origin/next`; the
v9 pin below now supersedes it. The flashing/runbook/session documentation
edits remain uncommitted in this checkout.

## Verified v8 artifacts and staged updates

The full `make docker-H700` build completed at 20:53 UTC. Package lint passed.
Retained v8 artifacts, build notes, and `verification.json` live in:

`/workspace/artifacts/rocknix-images/h700-v8-20260905-1a44c12397/`

The files at the parent artifact-directory level remain v7. Both versions
share the `20260905` filename/date, so use the build ID and checksums.

| Artifact | SHA-256 |
| --- | --- |
| `ROCKNIX-H700.aarch64-20260905-DDR3.img.gz` | `391e44423e19bce3549d5cdc7747c7e01946d2bb288ff53be4290481ca9396bb` |
| `ROCKNIX-H700.aarch64-20260905-DDR4.img.gz` | `b8523764d2f4862e37f2cf81b67912e34b6f2cd111ad5090bc19356cba1dbc66` |
| `ROCKNIX-H700.aarch64-20260905.tar` | `3a3deed4a9acc0975aeb9d17b3fef62a3375b9235854c61f83b834dc4d948178` |

Both raw images are 2,198,863,872 bytes. Their gzip CRCs, embedded bootloader
bytes, correct DDR3-only overlay, both SP device trees, and identical SYSTEM
were checked directly. The update tar's SYSTEM matches those images and its
recorded MD5. It reports build ID `1a44c12397fee4460408722642c78270f802912f`.
Packaged EmulationStation SHA-256 is
`95259a25a0bb048e752bc6534d19bb8fb3c2412ee0d950346c25b0f8d9b79faf`;
the build log and source confirm all three corrected menu callbacks compiled.

Before staging, both devices still reported v7 and the same old ES hash
`4c6c6bffda637084bc86fd5ecc94594f226890d124552118eec0ca7100eef538`.
Both had empty update queues, sufficient space, and functioning provider lists.
Live DRAM voltages were 1.1 V on the RG35XX SP and 1.2 V on the RG SP.

The shared tar was uploaded outside each update queue, checked by SHA-256 on
the device, then moved into
`/storage/.update/ROCKNIX-H700.aarch64-20260905.tar` and synced. Both device-side
hash checks passed. Neither device was rebooted by the agent. The maintainer's
subsequent RG SP reboot and v8 installation were verified during the crash
investigation below.

## RG SP phone-choice crash and integrated v9 fix

Read-only SSH inspection at 21:26 UTC confirmed the RG SP runs v8 build
`1a44c12397fee4460408722642c78270f802912f`, ES SHA-256
`95259a25a0bb048e752bc6534d19bb8fb3c2412ee0d950346c25b0f8d9b79faf`, correct
RG SP model/DTB, and an empty update queue. The relevant timeline is in the
device's EDT timezone:

- 17:23:31: `/var/log/cloud_sync.log` records Dropbox sign-in starting.
- 17:23:36: `/var/log/es_log.0.txt` and the `essway.service` journal record
  `Interrupt signal SIGSEGV received`, followed by exit status 139.
- 17:23:39: systemd restarts `essway.service` (restart counter 1), explaining
  the return to the main menu.
- No `window.log`, browser-open marker, or phone-keyboard marker existed.
  The browser had not launched; this failed during the menu transition.

`cloudOAuthPresentChoice` presents the input-choice page with
`cloudSetupPresent(window, s, prev)`, which deletes the provider page `prev`.
Both choice callbacks incorrectly retain `prev` and hand it to the next page,
which closes it again. `GuiSettings::close()` calls `save()` then `delete this`.
This is a use-after-free affecting both phone and on-screen keyboard choices.
No original core is available (`core_pattern` is `|/bin/false`); the exact
source-level mechanism was reproduced separately, not read from a device core.

ES commit `d3fb11623c6e44c049bef04ed4499cf816448d77` on
`fix/cloud-oauth-page-lifetime` makes both callbacks capture and pass the
current input-choice page `s`, replacing the dangling `prev`. There are four
code-line changes and an explanatory comment. It is merged into
`test/qa-integration` at `58c199318ca78975d405a21b6e608ab432dbf892`;
both branches are published to `maxengel/emulationstation-next`.

The regression is retained as `tests/cloud-oauth-lifetime.py` in the ES repo
(checkout `/tmp/emulationstation-next-v7`). It extracts the actual C++ choice
and page-presentation functions into a small lifecycle harness. Rendering and
the sign-in page's network work are test doubles. With the shipped v8 source,
AddressSanitizer reports `heap-use-after-free` for both keyboard choices;
with the fix, phone, on-screen keyboard, no-browser, and failed-start cases
all pass, including returning from sign-in to the cloud hub. The full H700
build has now passed too; a real-device transition check remains pending
until v9 is installed.

Raw read-only log capture is kept privately under `/tmp/rgsp-cloud-crash/`.
It may contain session URLs; do not publish it. The temporary SSH password
helper was removed after the original inspection, recreated for this
authorized transfer, then removed again after staging completed.

## Verified v9 artifacts and staged updates

ROCKNIX commit `bba8620e0b0a40ea40cf460c3af573d515c7ee19` pins ES to
`58c199318ca78975d405a21b6e608ab432dbf892`. It is published on `origin/next`
and `origin/feature/cloud-oauth-page-lifetime`, and present in `build/devices`
and this session checkout. The package-only feature worktree is
`/workspace/repos/rocknix.worktrees/cloud-oauth-page-lifetime`.

Package lint and the full `make docker-H700` build passed. Build completed at
22:45 UTC; embedded BUILD_DATE is `Sat Sep 5 22:43:41 UTC 2026` and branch is
`build/devices`. Retained artifacts, checksums, README, and `verification.json`:

`/workspace/artifacts/rocknix-images/h700-v9-20260905-bba8620e0b/`

| Artifact | SHA-256 |
| --- | --- |
| `ROCKNIX-H700.aarch64-20260905-DDR3.img.gz` | `627a3debdee61b66c5bb44b48ba611dca006d40f9fe35726a3522a35ee606eb5` |
| `ROCKNIX-H700.aarch64-20260905-DDR4.img.gz` | `92dfa3cba64a7be7c722f7228c76e40dbc3b66dcbb590070dd81e84764a66e7b` |
| `ROCKNIX-H700.aarch64-20260905.tar` | `164d28aa7f80e52aeb618e672af4194d585f7570fe676ef312096ebc68eb46be` |

Both raw images are 2,198,863,872 bytes. Gzip CRCs, embedded RAM-specific
bootloaders, DDR3-only overlay, both SP DTBs, update SYSTEM MD5, and identical
SYSTEM contents across all three artifacts passed inspection. SYSTEM reports
the new build ID and ES SHA-256
`bbb268b492991f8e046bc092efef5e94d0716138338623b67afeb5edca936344`.
The compiled `GuiMenu.cpp` matches the reviewed integration source. All three
checksum files also passed after copying to the retained artifact directory.

Both devices were verified on v8 before transfer: build ID `1a44c12397`, ES
hash `95259a25a0bb048e752bc6534d19bb8fb3c2412ee0d950346c25b0f8d9b79faf`,
correct model/DTB, empty update queue, sufficient space, and available cloud
helpers/providers. RG35XX SP has 1.1 V DRAM and internal ROM storage; RG SP has
1.2 V DRAM with `/storage/roms` on the 128 GB TF2 `GAMES` filesystem.

Transfers used `/tmp/stage-h700-v9.sh` and the retained update archive. Both
uploaded outside `.update`, passed the device-side SHA-256 check, and moved
the complete tar into
`/storage/.update/ROCKNIX-H700.aarch64-20260905.tar`, then synced. Both scripts
exited successfully and reported `STAGED` with the expected update hash.
Staging was confirmed at 23:01 UTC. Neither handheld was rebooted by the agent;
the installed v9 build and real-device sign-in transitions remain unverified.

## Next steps

1. Reboot both devices to install v9, then confirm BUILD_ID `bba8620e0b`, the
   expected ES hash, model/DTB, RAM voltage, storage mounts, and empty queues.
2. Verify the cloud setup flow from its normal entry on both devices.
   Exercise both phone and on-screen keyboard transitions without ES
   restarting, and check the explicit computer fallback.
3. Keep the supplied 16 GB stock card intact as the recovery path.
4. Copy game content to `/storage/roms`; it now writes to TF2.
5. Install the dedicated handheld SSH public key later if passwordless bench
   access is desired. The fresh card currently accepts the configured ROCKNIX
   root password but does not contain that key.

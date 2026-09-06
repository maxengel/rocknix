# Physical-device image flashing runbook

Use this for every fresh ROCKNIX card written for the maintainer's devices. It
turns a built or downloaded image into a booted, identified device and records
enough evidence to repeat the result. For devices already running ROCKNIX, use
the in-place update procedure below and `.claude/rules/device-builds.md`.

The destructive boundary is the raw-card write. Everything before it should
make the image, target card, and device variant concrete. Everything after it
should verify the bytes and the running device.

## Know who owns each update

For the RG SP and other H700 devices, routine firmware and OS maintenance comes
through ROCKNIX. The ROCKNIX system or update package supplies the kernel,
kernel-loaded hardware firmware, device trees, overlays, and bootloader files.
The H700 update script selects the running model's DTB, detects the DDR voltage,
and writes the matching U-Boot/SPL to the same SD boot disk. The current H700
tree contains no separate RG SP MCU or other onboard-firmware updater that
requires an Anbernic package.

Anbernic uses “firmware” for its complete stock system images. Its RG SP update
is listed as `RGSP-V1.0.1-EN16GB-260624` on Anbernic's own
[download page](https://win.anbernic.com/download/751.html) and
[system-update page](https://anbernic.com/pages/system-update) (both accessed
2026-09-05); the `16GB` in that name is the stock system-storage size, and the
unit itself carries two TF/microSD slots (TF1 boot + TF2 games, as this bench
uses). That package is therefore the replacement image for the stock boot card,
not a second firmware layer that must be installed beneath ROCKNIX. The
maintainer's unit shipped with and booted that same stock system before its
LPDDR3 boot media was inspected.

Keep the supplied Anbernic card unchanged as recovery media and as evidence
about the physical unit. Do not apply an Anbernic stock update to a ROCKNIX
card: it is a different OS and boot layout, not a prerequisite layer beneath
ROCKNIX.

This conclusion is device-family specific. When adding a new device, inspect
its `projects/ROCKNIX/devices/<target>/bootloader/update.sh` and record:

- where its bootloader lives and what the ROCKNIX updater writes;
- how its active device tree and overlays are selected;
- whether firmware files are loaded by the ROCKNIX kernel or flashed into a
  persistent controller; and
- whether the vendor documents a hardware-level updater ROCKNIX does not carry.

Only the last case creates a possible vendor-firmware prerequisite. Record the
exact component and vendor procedure rather than saying the whole handheld
needs “vendor firmware.” If Anbernic later documents a persistent MCU, power,
display, radio, or controller update, investigate that named component and use
the preserved stock card if its updater requires the stock OS. A new stock
system image by itself is not evidence of such an update.

## Updating devices already running ROCKNIX

One H700 build produces DDR3 and DDR4 fresh-card images plus one shared update
`.tar`. The maintainer's RG35XX SP uses the DDR4 flash image; the separate RG SP
uses DDR3. Both use the same update tar: H700's `bootloader/update.sh` reads the
running device-tree ID and DRAM regulator voltage, selects the matching
bootloader, and activates the model's `/dtb.img`. Manual DTB activation is for
the fresh-card procedure, not this update path. Updating preserves `/storage`
and the TF2 games filesystem.

1. Record the source/build ID and full checksums of all three artifacts. Two
   builds on the same day can have identical filenames and `OS_VERSION`.
   Retain them in distinct version/build-ID directories, such as
   `h700-v8-20260905-1a44c12397`, so an older verified image remains identifiable.
2. Verify the running model, device-tree ID, RAM voltage, available `/storage`
   space, and existing `/storage/.update` contents before transfer. Investigate
   an existing update rather than silently replacing it.
3. Inspect the update's packaged `SYSTEM` for the expected build ID and changed
   binary. Check that both H700 bootloaders and the target DTBs are present.
   When retaining fresh-card variants too, verify their bootloader bytes,
   overlay selection, and that they carry the same `SYSTEM` as the update tar.
4. Upload the tar under a temporary name outside `/storage/.update`, for
   example `/storage/.cache/<image>.tar.part`. Verify its SHA-256 **on the
   device**, then move it into `/storage/.update/<image>.tar` and sync. This
   keeps incomplete transfers out of the boot-time updater's queue.
5. Record the update as **staged** until the device reboots and applies it.
   After reboot, confirm the new `BUILD_ID`, model/DTB, RAM voltage, expected
   storage mounts, changed binary hash, and an empty update queue. A successful
   transfer does not prove an update has been installed.
6. Exercise the changed feature from its normal menu entry. For the v8/v9 cloud
   fixes, follow `GAME SETTINGS > CLOUD SETTINGS > ALL CLOUD SETTINGS AND
   SERVICES > CLOUD STORAGE SETUP > CONNECT OR REPAIR CLOUD STORAGE`; select
   an OAuth provider, then select each of `WITH MY PHONE` and
   `WITH THE ON-SCREEN KEYBOARD` in separate attempts. Confirm both reach the
   sign-in page and can return to the cloud hub without restarting ES. A row
   appearing does not prove its callback works. Inspect the ES log and
   `essway.service` restart count if a transition returns to the main menu.
   The explicit
   `USE A COMPUTER INSTEAD` fallback should still open SSH setup.

## Record before touching a card

Create or update the branch session file in `.github/sessions/` with:

| Field | Required value |
|---|---|
| Physical device | Exact model and which bench unit, if more than one exists |
| Build | Source commit/build ID, branch, target, and date |
| Image | Absolute path and compressed SHA-256 |
| Board variant | DDR/panel/boot variant and the physical evidence for it |
| Intended card | Capacity and role (`int`, `ext`, recovery, or disposable QA) |
| Device tree | Whether manual activation is required; source filename and hash |

Do not turn one unit's DDR or panel result into a model-wide mapping. Record it
as “maintainer's unit” until published evidence establishes that all revisions
are identical.

## 1. Intake and verify a new image

Images built here normally come from `target/`; retained images live under
`/workspace/artifacts/rocknix-images/`. Keep the complete filename, including
date and board variant. Never silently replace a retained file with another
build under the same name.

Set the image and its expected published or build-time checksum:

```bash
IMAGE=/absolute/path/ROCKNIX-TARGET.aarch64-YYYYMMDD-VARIANT.img.gz
IMAGE_SHA256=EXPECTED_COMPRESSED_SHA256
```

Verify the compressed artifact, gzip stream, raw byte count, and raw hash:

```bash
set -o pipefail
printf '%s  %s\n' "$IMAGE_SHA256" "$IMAGE" | sha256sum -c -
gzip -t -- "$IMAGE"
IMAGE_BYTES=$(gzip -dc -- "$IMAGE" | wc -c)
IMAGE_RAW_SHA256=$(gzip -dc -- "$IMAGE" | sha256sum | awk '{print $1}')
printf 'raw bytes=%s raw sha256=%s\n' "$IMAGE_BYTES" "$IMAGE_RAW_SHA256"
```

Record both raw values. They are the readback boundary after flashing. Inspect
the image or update archive before the write and confirm it contains the target
device tree and reports the intended build ID. A filename is not evidence of
its contents.

## 2. Settle the physical board variant

Choose DDR, panel, or boot variants from the physical device or its supplied
boot media. Never infer them from the marketing model alone.

For an H700 device already running ROCKNIX, the updater's regulator check is:

```bash
for regulator in /sys/class/regulator/regulator.*/; do
  if [ "$(cat "$regulator/name" 2>/dev/null)" = vdd-dram ]; then
    cat "$regulator/microvolts"
  fi
done
```

- `1200000` selects the DDR3 image.
- `1100000` selects the DDR4 image.

Stock firmware may not expose that regulator. Use a documented hardware source
or inspect the supplied boot chain, as was done for the RG SP; keep the stock
card read-only. If the evidence is still ambiguous, stop before flashing.

Update the `Our devices` table in `.claude/rules/device-builds.md` with the
unit-specific result and its evidence.

## 3. Identify the target card at run time

Capture the disks before insertion, insert only the intended card, then capture
them again:

```bash
lsblk -dpno NAME,SIZE,MODEL,TRAN,RM,RO,TYPE
```

The target must be the newly appeared removable disk, with the expected
capacity and transport. Inspect its partitions and mounts:

```bash
lsblk -p -o NAME,MAJ:MIN,SIZE,TYPE,FSTYPE,LABEL,UUID,MOUNTPOINTS,MODEL,TRAN,RM,RO
```

Set its stable link and pin the observations:

```bash
TARGET=/dev/disk/by-id/OBSERVED_LINK
RESOLVED_TARGET=$(readlink -f -- "$TARGET")
TARGET_BYTES=$(lsblk -bdno SIZE "$RESOLVED_TARGET")   # reads sysfs; no privilege
printf 'target=%s resolved=%s bytes=%s\n' \
  "$TARGET" "$RESOLVED_TARGET" "$TARGET_BYTES"
```

A USB reader's `by-id` link may identify the reader slot rather than the card.
It protects against `/dev/sdX` renumbering during this insertion; it does not
prove that the right card is in the slot. Pair it with the before/after result,
exact byte size, removable flag, and the card's observed partition layout.

Before writing:

1. Confirm the target is removable and writable (`RM=1`, `RO=0`).
2. Confirm none of it or its child partitions is mounted. Unmount any listed
   partition, then rerun `lsblk` until every target mountpoint is blank.
3. Compare it with the devices backing `/`, `/boot`, and `/boot/efi`; refuse
   any system disk, LVM physical volume, or ambiguous target.
4. Confirm the maintainer identified this card as disposable or intended for
   the fresh install. Preserve supplied stock media as the recovery path.

Never write a `/dev/sdX` name copied from an earlier session or another host.
These commands make the system-disk comparison visible:

```bash
findmnt -no SOURCE,TARGET /
findmnt -no SOURCE,TARGET /boot 2>/dev/null || true
findmnt -no SOURCE,TARGET /boot/efi 2>/dev/null || true
lsblk -s -p -o NAME,SIZE,TYPE,FSTYPE,LABEL,MOUNTPOINTS "$RESOLVED_TARGET"
```

## 4. Flash and verify the raw bytes

Immediately before the write, resolve the stable link again and require the
same path and exact size:

```bash
test "$(readlink -f -- "$TARGET")" = "$RESOLVED_TARGET"
test "$(lsblk -bdno SIZE "$RESOLVED_TARGET")" = "$TARGET_BYTES"
```

With shell pipeline failure enabled, write and flush the image:

```bash
set -o pipefail
gzip -dc -- "$IMAGE" |
  sudo dd of="$RESOLVED_TARGET" bs=4M iflag=fullblock conv=fsync status=progress
sync
```

Raw-device permission belongs at this step. If the agent cannot use `sudo`, the
maintainer can execute the exact reviewed command, or an already-authorized
local container can receive only the pinned block device. Never request or
transmit an administrator password through chat.

On serval, the maintainer account has Docker-group access but no passwordless
`sudo`, so every step that needs the raw device runs in a container given
**only that one pinned device**. Build the image once — plain `ubuntu:24.04`
lacks `sfdisk`, `mtools` and `e2fsprogs`, which §5 and §6 need:

```bash
docker build -t rocknix-flash:local - <<'DOCKERFILE'
FROM ubuntu:24.04
RUN apt-get -qq update \
 && DEBIAN_FRONTEND=noninteractive apt-get -qq install -y --no-install-recommends \
      fdisk mtools e2fsprogs util-linux gzip coreutils \
 && rm -rf /var/lib/apt/lists/*
DOCKERFILE
```

Write and flush the image through it, passing only the card (`:rw`) and the
image (read-only):

```bash
docker run --rm \
  --device "$RESOLVED_TARGET:/dev/target:rw" \
  --mount "type=bind,src=$IMAGE,dst=/image.gz,readonly" \
  --env EXPECTED_IMAGE_SHA256="$IMAGE_SHA256" \
  --env EXPECTED_TARGET_BYTES="$TARGET_BYTES" \
  rocknix-flash:local /bin/bash -lc '
    set -euo pipefail
    printf "%s  /image.gz\n" "$EXPECTED_IMAGE_SHA256" | sha256sum -c -
    test "$(blockdev --getsize64 /dev/target)" = "$EXPECTED_TARGET_BYTES"
    gzip -dc /image.gz |
      dd of=/dev/target bs=4M iflag=fullblock conv=fsync status=progress
    sync
  '
```

Docker-group access is root-equivalent. Use this only after the same target
review as the `sudo dd` path, and never expose all of `/dev` or use
`--privileged`. The `--device` form is the whole safety mechanism: the container
can touch that one card and nothing else. The readback (below), the DTB
activation (§5), and the TF2 formatting (§6) reuse `rocknix-flash:local` the
same way.

Before changing anything on the boot filesystem, read back exactly the image's
raw byte count and compare it with the raw image hash:

```bash
READBACK_SHA256=$(
  sudo head -c "$IMAGE_BYTES" "$RESOLVED_TARGET" |
    sha256sum | awk '{print $1}'
)
test "$READBACK_SHA256" = "$IMAGE_RAW_SHA256"
printf 'readback sha256=%s\n' "$READBACK_SHA256"
```

On serval, read it back through the pinned container (device read-only):

```bash
docker run --rm \
  --device "$RESOLVED_TARGET:/dev/target:ro" \
  --env IMAGE_BYTES="$IMAGE_BYTES" --env IMAGE_RAW_SHA256="$IMAGE_RAW_SHA256" \
  rocknix-flash:local /bin/sh -c '
    set -eu
    got=$(head -c "$IMAGE_BYTES" /dev/target | sha256sum | cut -d" " -f1)
    test "$got" = "$IMAGE_RAW_SHA256"
    printf "readback sha256=%s\n" "$got"
  '
```

This full comparison happens before a manual `dtb.img` copy because that copy
intentionally changes bytes inside the flashed filesystem.

## 5. Activate a device tree when the platform requires it

Refresh the partition table only after the raw readback passes:

```bash
sudo blockdev --rereadpt "$RESOLVED_TARGET"
udevadm settle
lsblk -p -o NAME,SIZE,TYPE,FSTYPE,LABEL,UUID,MOUNTPOINTS "$RESOLVED_TARGET"
```

Rereading the partition table is a kernel operation, so on serval this is the
one place to reach for a single capability — `--cap-add SYS_ADMIN` on a
container given only this device — or, more simply, to remove and reinsert the
card, which makes the kernel pick up the new table with no privilege at all.

If the kernel refuses to reread it, safely remove and reinsert the card, then
repeat the full target-identification step. Identify the boot partition by its
filesystem and label, not by assuming it is partition 1. A current H700 image
uses a FAT partition labelled `ROCKNIX`.

First mount the boot filesystem read-only and inspect it. Manual device-tree
activation applies only when all of these are true:

- the device's exact DTB exists under `device_trees/`;
- the boot configuration points to `/dtb.img`;
- no image build step writes `/dtb.img` itself, so the installer must — on H700,
  `projects/ROCKNIX/bootloader/mkimage` copies `device_trees/` into the boot
  filesystem but never creates `dtb.img`; only the in-place `update.sh` does; and
- the existing `/dtb.img` is absent or is not already the verified target DTB.

On H700 this is a boot precondition, not a nicety: extlinux carries an explicit
`FDT /dtb.img`, and u-boot skips any label whose named FDT cannot be loaded
(`Skipping <label> for failure retrieving FDT`, u-boot `boot/pxe_utils.c`). A
fresh card with no `/dtb.img` does not boot at all.

For such a device, mount the boot filesystem read-write and copy the verified
source file to the root as `dtb.img`, leaving the source intact:

```bash
BOOT_PART=/dev/OBSERVED_ROCKNIX_BOOT_PARTITION
MOUNT_POINT=$(mktemp -d)
DEVICE_DTB=device_trees/EXACT_DEVICE_TREE.dtb

sudo mount -o rw "$BOOT_PART" "$MOUNT_POINT"
SOURCE_DTB_SHA256=$(sudo sha256sum "$MOUNT_POINT/$DEVICE_DTB" | awk '{print $1}')
sudo cp "$MOUNT_POINT/$DEVICE_DTB" "$MOUNT_POINT/dtb.img"
sudo sync -f "$MOUNT_POINT"
ACTIVE_DTB_SHA256=$(sudo sha256sum "$MOUNT_POINT/dtb.img" | awk '{print $1}')
test "$ACTIVE_DTB_SHA256" = "$SOURCE_DTB_SHA256"
sudo umount "$MOUNT_POINT"
rmdir "$MOUNT_POINT"
```

If a command fails after the mount succeeds, unmount the filesystem before
retrying or removing the card.

On serval, activate `dtb.img` without mounting at all: `mtools` edits the FAT
boot partition through the pinned partition node, and the FAT is that
partition's own filesystem (offset 0 of `${BOOT_PART}`), so no loop device or
mount is involved. This is the sequence used for the RG SP, with `DEVICE_DTB`
set as above:

```bash
docker run --rm \
  --device "$BOOT_PART:/dev/boot:rw" \
  --env DEVICE_DTB="$DEVICE_DTB" \
  rocknix-flash:local /bin/sh -c '
    set -eu
    mcopy -i /dev/boot "::/$DEVICE_DTB" /tmp/src.dtb
    src=$(sha256sum /tmp/src.dtb | cut -d" " -f1)
    mcopy -o -i /dev/boot /tmp/src.dtb ::/dtb.img
    active=$(mcopy -i /dev/boot ::/dtb.img - | sha256sum | cut -d" " -f1)
    test "$active" = "$src"
    printf "active dtb.img sha256=%s\n" "$active"
    mtype -i /dev/boot ::/extlinux/extlinux.conf | grep -E "FDT|OVERLAYS"
  '
```

Remount read-only once and verify the active hash persisted. Also check the
actual extlinux configuration:

- `FDT /dtb.img` points to the file just selected;
- every declared `FDTOVERLAYS` file exists; and
- the overlay set matches the DDR variant: a DDR3 image declares the ddr3
  overlay, a DDR4 image declares none, so a DDR3 overlay on a DDR4 card — or the
  reverse — is a mismatch to stop on.

Unmount and flush before removing the card. Finding the correct file in
`device_trees/` is preparation; verifying `/dtb.img` after an unmount is the
completion evidence.

## 6. Prepare an optional TF2 games card

TF2 is independent media. ROCKNIX does not resize or initialize it during the
TF1 first-boot expansion. A blank, unformatted card is not enough: create a
partition and filesystem before expecting the automounter to use it.

Identify TF2 with the same removable-device, exact-size, mount, and system-disk
checks used for a system-card flash. If it contains an old Android or handheld
image, remove the entire old partition table rather than formatting one of its
existing `cache` or `userdata` partitions. A simple games card should have one
partition spanning the usable card. The current discovery loop enumerates
supported filesystems by partition but applies its 8 GiB size guard to the
parent disk. A large Android-formatted card can therefore expose a tiny ext4
`cache` or `metadata` partition as a games-storage candidate.

The current automounter recognizes ext4, btrfs, FAT/exFAT, and NTFS — its match
on `fat` also catches an exFAT card, and it loads the `exfat` module for it. Use
ext4 unless the card must also be writable on a system without ext4 support.
Ext4 and btrfs support ROCKNIX's optional merged-storage overlay; FAT, exFAT and
NTFS cause the automounter to disable that overlay. F2FS is not discovered as a
games filesystem by the current script.

For an empty card, create one full-size ext4 partition with a distinct label
such as `GAMES`. Do not reuse `ROCKNIX` or `STORAGE`, which identify TF1's boot
and persistent partitions. For example, after resolving and rechecking the
exact target:

```bash
sudo parted -s "$RESOLVED_TARGET" mklabel gpt
sudo parted -s "$RESOLVED_TARGET" -a optimal \
  mkpart primary ext4 1MiB 100%
sudo partprobe "$RESOLVED_TARGET"
udevadm settle
# The single child that just appeared. Do not hard-code p1 vs 1; read it back:
OBSERVED_PARTITION=$(lsblk -pnro NAME "$RESOLVED_TARGET" | sed -n 2p)
lsblk -p -o NAME,SIZE,FSTYPE,LABEL "$OBSERVED_PARTITION"
sudo mkfs.ext4 -F -L GAMES -T ext4 -m 0 "$OBSERVED_PARTITION"
sudo sync
sudo e2fsck -fn "$OBSERVED_PARTITION"
```

This erases the selected card. Re-list the whole partition table immediately
before `mklabel`; do not infer the target name from a prior insertion.

On serval, do it in two pinned-container passes with a card reinsertion between
them: writing the table and realizing its partition node are separate steps, and
only the second needs the kernel. First write the GPT to the card — no kernel
reread, so no capability (`sfdisk --no-reread --no-tell-kernel`):

```bash
printf 'label: gpt\nstart=2048, name=GAMES\n' > /tmp/games.sfdisk
docker run --rm --device "$RESOLVED_TARGET:/dev/target:rw" \
  --mount "type=bind,src=/tmp/games.sfdisk,dst=/games.sfdisk,readonly" \
  rocknix-flash:local /bin/sh -c 'sfdisk --no-reread --no-tell-kernel /dev/target < /games.sfdisk'
```

Remove and reinsert the card so the kernel sees the new partition, then
re-identify it (§3) and format the **partition** node in a second container
given only that node:

```bash
docker run --rm --device "$OBSERVED_PARTITION:/dev/target:rw" \
  rocknix-flash:local /bin/sh -c '
    set -eu
    mkfs.ext4 -F -L GAMES -m 0 /dev/target
    sync
    e2fsck -fn /dev/target
  '
```

With the default `system.merged.storage=0`, TF1 remains the ROCKNIX and base
`/storage` card while `/storage/roms` uses TF2 when it is present. Enable merged
storage only when ROM directories from both cards should appear together.
That overlay requires ext4 or btrfs on TF2. System-directory creation follows
the active `/storage/roms` mount: when TF2 is the external target, expect the
populated tree under `/storage/games-external/roms`. TF1 may retain only the
empty `/storage/games-internal/roms` scaffold; this does not indicate data was
removed.

## 7. First boot and running-device verification

1. Power the handheld off and insert the prepared system card. Keep its stock
   card aside and unchanged.
2. For the first verification boot, leave an optional `ext` games card out so
   storage discovery cannot obscure a system-card failure.
3. Let first-boot expansion and its automatic reboot complete without
   interruption.
4. Read `/etc/os-release`, `/proc/device-tree/model`, and the platform's device
   tree identifier. Confirm the build ID, target, model, and empty update queue.
5. Recheck any runtime hardware signal used to choose the image variant.
6. Power off, add the `ext` card, boot again, and confirm it is the active game
   storage before copying content.

The first power-on is a dedicated resize boot, not a normal ROCKNIX session.
While `/storage/.please_resize_me` exists, init selects `fs-resize.target`;
that target expands TF1 and forces a reboot without starting
`rocknix-automount.service`. ROM-system directories are first populated during
the following normal `rocknix.target` boot. Leave TF2 out through that normal
boot if the internal card should receive a populated ROM tree before TF2 is
introduced. If TF2 is present then, the active external tree is populated and
TF1 may retain only its empty scaffold.

A successful image write is not a successful device install. The running model
and build ID close the procedure.

## 8. Close the record

After the boot verification:

- update `.claude/rules/device-builds.md` when a new physical device or verified
  hardware variant joins the bench;
- update the branch session file with image hashes, target byte size, DTB source
  and hash, running build ID, and remaining work;
- append the observed result to the dated work log; and
- retain the image and checksum under `/workspace/artifacts/rocknix-images/`
  when it is a bench baseline.

When adding a new device, explicitly record whether it needs manual
`device_trees/<model>.dtb` to `/dtb.img` activation. When adding a new image for
an existing device, also record who owns bootloader, device-tree, and any
persistent-controller updates. Re-run every artifact and card check; prior
success does not identify the new bytes or the card currently in the reader.

The 2026-09-05 RG SP entry in
`docs/work-logs/2026_09-work_logs/2026_09_05-work_log.md` is the first complete
worked record: LPDDR3 from both stock boot0 copies, DDR3 image, full raw
readback, RG SP DTB activation, persistent hash verification, TF1 expansion,
TF2 formatting, and live verification that `/storage/roms` uses the 128 GB
external card.

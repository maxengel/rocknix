---
description: "How to build-test and QA the GENERIC_X64 (x86_64) VM image locally in QEMU/KVM."
applyTo: "projects/ROCKNIX/devices/GENERIC_X64/**,projects/ROCKNIX/packages/**,scripts/mkimage,scripts/image"
---

# GENERIC_X64 local VM QA

GENERIC_X64 is the x86_64 VM/QA target (fork issue #16): boot the image in QEMU so devs can
test features (e.g. EmulationStation) without flashing hardware. The bare-metal x64 path and
its concessions (llvmpipe vs hw GL, skipped cores) are tracked separately in issue #17.

## Build

Detached build from the worktree (the `.git` mount is **required** — a worktree's `.git` is a
file pointing outside the mounted dir, and `scripts/image` runs `git rev-parse`):

```bash
make docker-GENERIC_X64 \
  DOCKER_EXTRA_OPTS='-v /home/max/Development/rocknix/.git:/home/max/Development/rocknix/.git'
```

Image lands at `target/ROCKNIX-GENERIC_X64.x86_64-<date>.img.gz`. To re-image after a
scripts/only change (e.g. `mkimage`), remove `build.*/.stamps/image/build_target` first —
scripts aren't in a package deephash so the image won't rebuild otherwise.

## Boot in QEMU

Needs OVMF **split** firmware with a writable VARS copy, and `-vga virtio` (sway needs a DRM
device). KVM is required for a timely full boot to ES (TCG `-cpu max` boots but is far too
slow for two boots + resize + ES).

```bash
cp /usr/share/OVMF/OVMF_VARS_4M.fd ./OVMF_VARS_test.fd            # writable copy
sg kvm -c 'qemu-system-x86_64 -enable-kvm -cpu host -smp 4 -m 4096 -machine q35 \
  -drive if=pflash,unit=0,readonly=on,file=/usr/share/OVMF/OVMF_CODE_4M.fd \
  -drive if=pflash,unit=1,format=raw,file=./OVMF_VARS_test.fd \
  -drive file=target/ROCKNIX-GENERIC_X64.x86_64-<date>.img,format=raw,if=virtio \
  -vga virtio -vnc :2 -nic user,model=virtio-net-pci,hostfwd=tcp:127.0.0.1:10022-:22 \
  -monitor unix:/tmp/qmon.sock,server,nowait -serial file:/tmp/serial.log -display none'
```

First boot resizes storage and reboots; the second boot is the real one.

## Give the VM enough disk, or the UI silently breaks (16GB+)

The raw `.img` ships a tiny (~33MB) `STORAGE` partition that **resizes to fill its disk on
first boot** — but a bare `.img` is only ~4GB (`SYSTEM_SIZE=4096` + a small storage tail), so
on a ~4GB disk storage stays ~33MB and hits **100% full**. The first-boot
`rsync /usr/config → /storage/.config` then fails with **ENOSPC** and copies **0** of ES's 144
resource files, so ES can't resolve its `:/` resources (blur shader, `ubuntu_condensed.ttf`,
help icons). The result is a *rendering* ES with a **broken main menu** — no dimmed/blurred
background, wrong fonts, missing help-button glyphs — which looks like a graphics/compositor
bug but is **purely out-of-space**. Real hardware never hits this (storage resizes to fill the
whole SD card *before* the rsync).

Confirm from the serial shell: `df -h /storage` shows `100%`, and
`journalctl | grep -i "no space"` shows `rsync: ... No space left on device`.

- **Fix:** run on a **16GB+ disk**. `mkimage` now also emits a **sparse 16GB `.qcow2`**
  (`VM_IMAGE_SIZE` in `projects/ROCKNIX/devices/GENERIC_X64/options`) so a 1-click boot has
  room — first-boot resize gives ~12GB `STORAGE` and every resource populates. For a bare
  `.img`, grow the disk (`qemu-img resize <disk> 16G`, or a ≥16GB target) **before** first boot.
- **Don't** chase weston / Mesa / `glBlitFramebuffer` for a missing menu dim — that is a red
  herring downstream of the missing `:/shaders/blur.glsl`. The compositor never changes ES's
  own Mesa GL context, so weston vs sway is irrelevant here.

## KVM access (important gotcha)

`setfacl -m u:max:rw /dev/kvm` grants access but **logind resets it** on session changes, so it
breaks between boots. The durable fix is group membership + `sg`:

```bash
sudo usermod -aG kvm <user>     # once (persistent)
sg kvm -c '<qemu command>'      # picks up the group with no re-login
```

## Inspect a headless VM

- **Screenshot** (verify the UI without a display): QEMU monitor `screendump`
  `printf 'screendump /tmp/es.ppm\n' | socat - UNIX-CONNECT:/tmp/qmon.sock` (or a tiny
  Python `AF_UNIX` client). Convert PPM→PNG with stdlib `zlib`/`struct` if no image tools.
  Needs a display backend that commits the scanout — use `-vnc :N` (a bare `-display none`
  captures all-black). Drive input with the monitor: `sendkey ret` opens the ES main menu.
- **Reliable in-guest shell over serial** (prefer this — SSH can reset mid-handshake with
  `kex_exchange_identification: Connection reset`): GENERIC_X64 ships
  `serial-debug-shell.service` (autologin root `/bin/sh` on `ttyS0`). Boot with
  `-serial unix:/tmp/serialsh.sock,server,nowait`, then drive it from a tiny `AF_UNIX` client
  — send `stty -echo` first to quiet echo, and wrap commands in unique `BEG`/`END` markers
  since the boot console shares `ttyS0`. This is the channel that found the disk-size bug.
- **Live logs over SSH**: default login is `root` / `rocknix`; `PermitRootLogin yes`. No
  `sshpass` on the host — use `SSH_ASKPASS=<script-echoing-pw> SSH_ASKPASS_REQUIRE=force
  setsid -w ssh -p 10022 root@127.0.0.1 …`. ES logs to tmpfs `/var/log/es_log.txt`,
  sway to `/var/log/sway.log`.
- **Offline logs** (VM off): `dd if=IMG of=/tmp/p2.ext4 bs=512 skip=<part2 start sector>`
  then `debugfs -R "cat /.config/emulationstation/es_settings.cfg" /tmp/p2.ext4` (toolchain
  `debugfs`/`mtools` are under `build.*/toolchain/bin`). Handy because `/var/log` is lost on
  shutdown; `/storage` (partition 2, ext4, label `STORAGE`) persists.

## Debug order

When ES fails, check the layer below before blaming the app: read `sway.log` first — an ES
"wayland not available"/renderer abort is usually sway having failed to find a GPU
(`/dev/dri/cardN`), not an ES bug. See `engineering-practices.instructions.md`.

## Won't boot in UTM / a VM → check the disk logical sector size (4K vs 512)

The image's GPT + ESP FAT are laid out for **512-byte** sectors. OVMF/UTM firmware **cannot
UEFI-boot a disk exposed with 4096-byte logical sectors** — it misreads the 512b GPT (sees
only the protective MBR), finds no ESP, and drops to the UEFI interactive shell. Symptom in
the shell: `map` shows only `BLK0`/`BLK1`, **no `FS0:`**; firmware prints
`BdsDxe: failed to load ... Not Found` → PXE.

- The image is **not** at fault — it boots in every 512b firmware/bus (Ubuntu OVMF, upstream
  EDK2, qemu's own `edk2-x86_64-code.fd`; virtio and SATA). Don't "fix" the image.
- **Fix is VM-side:** present the boot disk as **512-byte sectors** (UTM: use a VirtIO/SATA
  drive, not a 4K disk). A shipped VM artifact (`.utm`/OVA) must bake in a 512b disk config.
- **Reproduce locally** with UTM's exact firmware:
  `curl -L .../pc-bios/edk2-x86_64-code.fd.bz2` (+ `edk2-i386-vars.fd.bz2`) from the qemu repo,
  then `-device virtio-blk-pci,drive=d0,logical_block_size=4096,physical_block_size=4096` →
  reproduces the shell drop; drop the two block-size args (→ 512b) → boots.
- **Container format is irrelevant** to this: raw/qcow2/vdi/vmdk all decode to identical disk
  bytes; only the *sector size the VM presents* and the machine config matter. "Shareable dev
  image" = an appliance that carries machine config (`.utm` bundle for UTM, OVA for
  VirtualBox/VMware), not a bare disk — a bare disk still needs correct UEFI + 512b setup.

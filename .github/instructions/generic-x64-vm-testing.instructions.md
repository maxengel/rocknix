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

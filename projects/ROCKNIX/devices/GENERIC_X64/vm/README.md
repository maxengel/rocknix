# GENERIC_X64 canonical VM profile

`profile.json` is the source of truth for the guest-visible VM hardware used by
Linux/QEMU and macOS/UTM:

- Q35 + UEFI
- Haswell-v4 CPU (x86-64-v3 compatible), 4 vCPUs, 8 GiB RAM
- 16 GiB VirtIO disk with explicit 512-byte logical and physical sectors
- `virtio-gpu-gl-pci`, `virtio-net-pci`, Intel HDA, USB 3, and serial console

The host acceleration differs by necessity: Linux uses KVM when available,
while an x86_64 guest on Apple silicon uses QEMU TCG. The fixed CPU model and
devices keep the guest-visible environment equivalent.

Print or run the Linux QEMU command:

```bash
projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm \
  qemu-args target/ROCKNIX-GENERIC_X64.x86_64-<date>.qcow2

projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm \
  run target/ROCKNIX-GENERIC_X64.x86_64-<date>.qcow2
```

Generate the UTM bundle:

```bash
projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm utm \
  target/ROCKNIX-GENERIC_X64.x86_64-<date>.qcow2 \
  --output target/ROCKNIX-GENERIC_X64.x86_64-<date>.utm.zip
```

Unzip the result on macOS and double-click `ROCKNIX-GENERIC_X64.utm`. UTM
creates its writable UEFI variable store on first launch.

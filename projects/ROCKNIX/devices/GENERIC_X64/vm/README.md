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

## Networking

The UTM bundle uses **Shared (NAT)** networking by default — it boots
everywhere, and guest services stay reachable through the host (cloud setup
GUI on host port 15572; phones can use `http://<mac-ip>:15572`). For full
hardware parity (QR codes scanning verbatim, the VM joining your LAN with its
own address), switch the VM's network mode to **Bridged** in UTM's settings —
one click, but macOS vmnet bridging can fail on some Wi-Fi networks, which is
why it is not the default.

The Linux launcher uses QEMU user-mode networking: service forwards (cloud
setup GUI, host port 15572) are reachable from the LAN via the host's IP;
SSH stays on 127.0.0.1:10022 unless `--net lan` is given; `--net bridged`
joins the LAN directly if the host has a bridge configured.

### Troubleshooting: bridged mode hangs forever (UTM)

If switching the VM to Bridged makes it spin indefinitely, check the unified
log for `SWIFT TASK CONTINUATION MISUSE: start(launcher:interface:)` from UTM:
that means macOS's vmnet layer never finished creating the bridge and UTM is
awaiting it forever. Set the bridged interface explicitly (usually `en0`),
update UTM, and if it still hangs your Mac/network refuses vmnet bridging -
use the default NAT mode and open `http://<mac-ip>:15572` from the phone
instead.

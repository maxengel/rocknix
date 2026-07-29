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

The UTM bundle uses **Emulated VLAN (NAT)** networking by default — it boots
everywhere, and SSH stays reachable through the host on 127.0.0.1:10022. For
full hardware parity (the VM joining your LAN with its own address), switch
the VM's network mode to **Bridged** in UTM's settings — one click, but macOS
vmnet bridging can fail on some Wi-Fi networks, which is why it is not the
default.

The Linux launcher uses QEMU user-mode networking: SSH stays on
127.0.0.1:10022 unless `--net lan` is given; `--net bridged` joins the LAN
directly if the host has a bridge configured.

### Cloud setup in the VM

Cloud setup runs `rclone config` over SSH. On real hardware the setup screen
shows `ssh root@<device-ip>`; behind the VM's NAT forward that address is
unreachable, so both launchers inject the correct loopback command via fw_cfg
(`opt/org.rocknix.cloud_ssh`), and the `095-cloud-ssh` quirk publishes it to
`/storage/.config/cloud_setup_ssh`. It is a fixed string — the forward always
binds 127.0.0.1:10022 — so it is identical on every host platform (Linux,
macOS, Windows/WSL2 QEMU) and nothing needs detecting or editing:

```
ssh -L 53682:localhost:53682 -p 10022 root@127.0.0.1
```

The `-L` tunnel carries rclone's OAuth sign-in page (guest port 53682) to the
browser of the machine running SSH, so the full `rclone config` auto flow
works from the host. Bridged VMs omit the injection: the guest is on the LAN
under its own address, and the screen correctly shows it.

Manual fallback: write a full SSH command into
`/storage/.config/cloud_setup_ssh` in the guest.

### Troubleshooting: bridged mode hangs forever (UTM)

If switching the VM to Bridged makes it spin indefinitely, check the unified
log for `SWIFT TASK CONTINUATION MISUSE: start(launcher:interface:)` from UTM:
that means macOS's vmnet layer never finished creating the bridge and UTM is
awaiting it forever. Set the bridged interface explicitly (usually `en0`),
update UTM, and if it still hangs your Mac/network refuses vmnet bridging -
use the default Emulated VLAN mode.

Tester-confirmed workaround: in UTM's network settings, selecting the
**Default (private)** host network instead of a physical interface lets the
VM start reliably. Note that this is vmnet's host/shared network, not a true
LAN bridge - and UTM only applies port forwards (including the SSH forward
cloud setup depends on) in **Emulated VLAN** mode, the shipped default, not
in the vmnet host-network modes. Bridged confirmed broken on one test Mac on
both UTM 4.7.5 stable and the current beta.

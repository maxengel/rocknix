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

### Making the setup QR code scannable from a phone

Behind a port forward the guest has no way to know the host address a phone
must reach, so the cloud setup screen would show the guest's own unreachable
NAT address (10.0.2.x). Something on the **host** has to supply its address —
the guest cannot discover it from inside (user-mode NAT exposes the host only
as the 10.0.2.2 alias). Per platform:

- **Linux**: automatic. The launcher detects the host's LAN address and
  injects it via fw_cfg on every boot. Nothing to do.
- **macOS (UTM)**: double-click `set-up-phone-qr.command`, shipped in the
  bundle zip next to the `.utm`. It detects the Mac's LAN address and writes
  it into the VM's settings; re-run it whenever the Mac changes networks
  (quit the VM first). First run needs right-click > Open — the script is an
  unsigned download, so Gatekeeper blocks a plain double-click.
- **Windows**: untested. Running the image via QEMU under WSL2 with the Linux
  launcher should behave like Linux with one caveat: the launcher will detect
  the WSL VM's internal address, and reaching forwards from the LAN
  additionally needs Windows-side port proxying (`netsh interface portproxy`)
  or WSL2 mirrored networking mode. To be designed when a Windows tester
  appears.

Manual fallback (any platform): edit the VM's QEMU arguments and replace the
value after `name=opt/org.rocknix.cloud_url,string=` with
`http://<host-lan-ip>:15572`, or write the full URL into
`/storage/.config/cloud_setup_url` in the guest.

Until a valid address is supplied, the shipped placeholder (`EDIT-ME-…`) is
rejected on purpose and the guest falls back to showing its own address.
Bridged bundles omit the argument entirely: the guest is on the LAN under its
own address, so nothing needs rewriting.

### Troubleshooting: bridged mode hangs forever (UTM)

If switching the VM to Bridged makes it spin indefinitely, check the unified
log for `SWIFT TASK CONTINUATION MISUSE: start(launcher:interface:)` from UTM:
that means macOS's vmnet layer never finished creating the bridge and UTM is
awaiting it forever. Set the bridged interface explicitly (usually `en0`),
update UTM, and if it still hangs your Mac/network refuses vmnet bridging -
use the default NAT mode and open `http://<mac-ip>:15572` from the phone
instead.

Tester-confirmed workaround: in UTM's network settings, selecting the
**Default (private)** host network instead of a physical interface lets the
VM start reliably. Note that this is vmnet's host/shared network, not a true
LAN bridge - check the address on the ROCKNIX setup screen: if it is not in
your LAN's subnet, phones still need `http://<mac-ip>:15572` - and note that
UTM only applies port forwards in **Emulated VLAN** mode (the shipped
default), not in the vmnet host-network modes. Bridged confirmed broken on
one test Mac on both UTM 4.7.5 stable and the current beta.

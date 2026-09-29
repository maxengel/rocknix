Title: rocknix: saved Wi-Fi networks, and a device name mDNS answers to

NETWORK SETTINGS reads the truth from NetworkManager instead of a setting that could disagree with it: WI-FI NETWORK names the network in use, the picker lists what is around with the ones you have joined marked SAVED and the current one CONNECTED, a saved network is joined with the key NetworkManager holds or forgotten, and MANAGE SAVED NETWORKS lists everything kept. `wifictl` gains `current`, `saved`, `join` and `forget`, keeps a typed key in the network's profile, brings a saved profile up as it is, and never deletes one to reconnect. `system.hostname` owns the device's name, NetworkManager leaves it alone, and the mDNS responder comes up after the device has its name, so `<name>.local` answers.

**What it carries.** `wifictl`, `NetworkManager.conf`, avahi's unit and recipe, `network-base-setup` and its unit, and `099-networkservices` (its state reset before each daemon fragment).

**How it was tested.** Three harness cases for the saved-first connect under the image's busybox; the picker's press on a saved network proven on the VM with a stand-in `wifictl` (CONNECT, FORGET and CANCEL, the forget made once, the list re-read); the hostname proven with two names on two guests. On an RG35XX SP the maintainer forgot a saved network from MANAGE SAVED NETWORKS.

**What it does not touch.** The AP and netplay paths still use iwctl on the interface; Bluetooth.

**Kernel, bootloader or device tree.** None.

**Depends on.** PR 4 (the settings functions).

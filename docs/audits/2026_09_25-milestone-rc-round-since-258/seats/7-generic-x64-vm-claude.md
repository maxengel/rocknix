# Audit — bucket 7-generic-x64-vm (GENERIC_X64 VM device)

## Summary

The bucket adds a GENERIC_X64 device to the distribution: build options, a Linux 6.15.6 config, an in-place syslinux/GRUB bootloader updater, a serial root-shell unit in the device filesystem overlay, two unrelated sets of boot-time quirk scripts, per-emulator default configs, a no-op `video_sense`, and a Python QEMU launcher / UTM bundle generator with its README and profile. The VM tooling is internally consistent with `profile.json` and with the kernel config (virtio-blk/net/gpu, `CONFIG_FW_CFG_SYSFS=y`, `CONFIG_I6300ESB_WDT=y` are all present), and the projects-tree quirks that the tooling relies on (`095-cloud-ssh`, `092-retroarch-surface`) exist. The device-side material is where the defects are. `bootloader/update.sh` copies the image's raw `ldlinux.sys` and its `syslinux.cfg`/`grub.cfg` templates over the boot partition on every update, which breaks BIOS boot and discards whatever the installer wrote into the boot configs. The device overlay ships an unauthenticated root `/bin/sh` on ttyS0 whose kernel-cmdline condition is always satisfied by `EXTRA_CMDLINE`, on a device that declares `INSTALLER_SUPPORT="yes"`. Seven quirk scripts sit in a second tree, `packages/hardware/quirks/platforms/GENERIC_X64/`, which is not the location the packaging rule names, has no `package.mk` in the diff, conflicts with the projects-tree `090-ui_service`, and contains systemd rewrites (hostnamed replaced by a oneshot, a dbus↔hostnamed ordering loop, `mitigations=off`, `RuntimeWatchdogSec=0`) that must not ship whether or not the tree is installed. The emulator configs are copies from other devices and carry those devices' hardware identifiers; `095-cloud-ssh` deletes or overwrites the manual override the README tells testers to write.

## Findings

### F-VM-01: `update.sh` copies the unpatched `ldlinux.sys` over a live syslinux install
- **Severity:** Critical
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh:17-19`
  `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh:5-6`
  `projects/ROCKNIX/devices/GENERIC_X64/options:23,79`
- **What:** On every in-place update the script `cp`s `ldlinux.sys` from `usr/share/bootloader` onto the FAT root. syslinux's BIOS boot sector records the sector list of `ldlinux.sys`, and `ldlinux.sys` itself carries a sector table and checksum that only the syslinux installer fills in. A plain copy of the distribution file replaces a patched, located file with an unpatched one and leaves the boot sector pointing wherever it pointed before.
- **Failure scenario:** A GENERIC_X64 install on a legacy-BIOS PC (the script header names "syslinux BIOS" as a supported path and `options:79` enables the installer) applies an update. Reboot stops at the syslinux first stage ("Boot error" or a hang) — device unbootable until `syslinux --install` is run from other media.
- **Evidence:** `for f in ldlinux.c32 ldlinux.sys libcom32.c32 libutil.c32; do [ -f "$BL/$f" ] && ... cp "$BL/$f" "$BOOT_ROOT/"` (lines 17-19). Refutation attempted: looked for `syslinux --install`/`-U`, `extlinux`, or any boot-sector rewrite after the copy — none; looked for a guard excluding `ldlinux.sys` when a BIOS install is detected — none. The mechanism (installer-patched `ldlinux.sys`) is syslinux behaviour, not in the packet; whether `usr/share/bootloader/ldlinux.sys` exists in the built image (the copy is guarded by `-f`) is also outside the packet.
- **Fix:** Drop `ldlinux.sys` from the loop and, if a BIOS install is present (`-f "$BOOT_ROOT/ldlinux.sys"`), run the syslinux installer against the boot device; or update only the `.c32` modules and `bootx64.efi` as the UEFI path does.
- **Confidence:** medium — the copy is unambiguous in the diff; exposure depends on `ldlinux.sys` being shipped and on BIOS installs existing, neither visible here.

### F-VM-02: `update.sh` overwrites the installed `syslinux.cfg` and `grub.cfg` with the image's templates
- **Severity:** High
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh:20,27`
  `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh:34`
- **What:** The boot configs on `/flash` are written at install/image time with the boot and storage device identification for that disk (and any owner edits). The updater replaces both with whatever the SYSTEM image carries at `usr/share/bootloader/{syslinux.cfg,grub.cfg}`, unconditionally, with no `sed` to carry the existing `APPEND`/`boot=`/`disk=` values across.
- **Failure scenario:** An installed disk whose boot cfg names its partitions by UUID updates; the copied template (contents outside the packet) either carries placeholders or generic labels. Next boot the init cannot find SYSTEM/STORAGE. If the template happens to match every install, the copy still discards any per-install change (e.g. a `console=` or `nomodeset` an owner added to boot a real GPU) silently, and the script then reports success via `echo "UPDATE" > /storage/.boot.hint` (line 34) regardless of what was copied.
- **Evidence:** `[ -f "$BL/syslinux.cfg" ] && ... cp "$BL/syslinux.cfg" "$BOOT_ROOT/"` (20); `[ -f "$BL/grub.cfg" ] && ... cp "$BL/grub.cfg" "$BOOT_ROOT/EFI/BOOT/"` (27). Refutation attempted: looked for extraction of the existing `APPEND` line, a `diff` guard, or a backup of the old cfg — none. The template contents and the installer that writes the flash cfg are outside the packet, so the "unbootable" branch is unproven; the "discards edits and reports UPDATE" branch is proven.
- **Fix:** Do not copy configs on update; if a config change must ship, patch the existing file in place (preserve `APPEND`), keep a `.bak`, and only then write the hint. Note that `tools/vm-upgrade-rehearsal` (referenced in `upgrade-and-install.md`) runs UEFI on the VM only — it does not exercise the BIOS path or a non-template cfg.
- **Confidence:** medium — the overwrite is proven; severity would rise to Critical if `usr/share/bootloader/syslinux.cfg` carries `@BOOT_UUID@`-style placeholders.

### F-VM-03: Unauthenticated root shell on ttyS0 shipped in the device filesystem overlay
- **Severity:** High
- **Category:** Security
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/filesystem/usr/lib/systemd/system/serial-debug-shell.service:9-10,16,22,29`
  `projects/ROCKNIX/devices/GENERIC_X64/options:67,79`
- **What:** The unit runs `/bin/sh` as root bound to `/dev/ttyS0` with no login. Its only gate is `ConditionKernelCommandLine=|console=ttyS0,115200`, and `EXTRA_CMDLINE="console=ttyS0,115200 console=tty0"` puts exactly that on every GENERIC_X64 boot, VM or installed disk.
- **Failure scenario:** GENERIC_X64 installed to a PC or thin client with a COM header (options:79 enables installation). Anyone with a serial cable gets a root shell on `/storage` with no password. On the QA host, the same shell is on a fixed unix socket (`/tmp/rocknix-qemu-serial.sock`, see F-VM-14) readable by anyone who can reach `/tmp`.
- **Evidence:** `ConditionKernelCommandLine=|console=ttyS0,115200` (10), `ExecStart=/bin/sh` (16), `TTYPath=/dev/ttyS0` (22), `WantedBy=rocknix.target` (29). Refutation attempted: looked for a second condition (`ConditionVirtualization=`, a build-time `QA` flag, `ConditionPathExists=/sys/firmware/qemu_fw_cfg`) — none; looked for the enabling `rocknix.target.wants/` symlink or a preset in the diff — none, so whether the unit is active is outside the packet. If it is not enabled, the launcher comment at `generic-x64-vm:131-133` ("so a script can hold a root shell in the guest") is false instead.
- **Fix:** Add `ConditionVirtualization=qemu` (or `ConditionPathExists=/sys/firmware/qemu_fw_cfg`) and gate the unit's installation on a QA build variable; never ship it in the overlay of an installer-capable device.
- **Confidence:** medium — the unit's content is proven; whether it is enabled in the image is not visible.

### F-VM-04: A second, orphaned quirk tree conflicts with the installed one and carries harmful systemd rewrites
- **Severity:** High
- **Category:** Build/packaging
- **Where:** `packages/hardware/quirks/platforms/GENERIC_X64/001-virtualization-setup:1,11-16,19-24` (mode 100644)
  `packages/hardware/quirks/platforms/GENERIC_X64/090-ui_service:10`
  `packages/hardware/quirks/platforms/GENERIC_X64/091-systemd-fixes:14,45,48`
  `packages/hardware/quirks/platforms/GENERIC_X64/092-journald-config:9-11`
  `packages/hardware/quirks/platforms/GENERIC_X64/093-rocknix-service-fixes:49-53,65-69,75`
  `packages/hardware/quirks/platforms/GENERIC_X64/094-core-systemd-fixes:14-25`
  `packages/hardware/quirks/platforms/GENERIC_X64/095-kernel-early-boot-fixes:10-19,66,70`
  `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/090-ui_service:6-7`
- **What:** `packaging-and-patches.md` places quirks under `projects/ROCKNIX/packages/hardware/quirks/`. The diff adds a parallel tree under top-level `packages/hardware/quirks/platforms/GENERIC_X64/` with no `package.mk` to install it, and its `090-ui_service` contradicts the projects copy. The seven scripts are stacked, unreconciled attempts at the same problem: three overlapping `journald.conf.d` files with conflicting values, drop-ins written to two different roots (`/storage/.config/systemd/system/` in 091 vs `/etc/systemd/system/` in 093/094), and writes into the read-only image (`/etc/tmpfiles.d`, `/etc/sysctl.d`, `/etc/kernel`, `/etc/systemd/system.conf.d`).
- **Failure scenario:** If the tree is not installed (most likely): dead code with a `mitigations=off` line goes upstream and a reader cannot tell which `090-ui_service` is real. If it is installed and `/etc/systemd/system` is writable: 094 replaces `systemd-hostnamed.service` with `Type=oneshot / ExecStart=/bin/true` (094:19-20) while 093's drop-in on the same unit sets `Restart=always` (093:75) — systemd refuses to load a oneshot with `Restart=always`, so `hostnamectl`/hostname1 fails; 093 also orders `dbus.service` `After=systemd-hostnamed.service` (093:52) and `systemd-hostnamed` `After=dbus.service` (093:68) — a loop whenever both are in one transaction; 091 sets `DefaultDependencies=false` on `dbus.service` (091:48). 095 writes `RuntimeWatchdogSec=0` (095:70), which would defeat the watchdog the launcher adds for systemd to arm (`generic-x64-vm:296-301`), and `DefaultLimitNOFILE=4096` (095:66), lowering the hard fd limit for every service.
- **Evidence:** packages `090-ui_service:10` is a bare `UI_SERVICE="sway.service"` in a bash script that writes nothing; projects `090-ui_service:6-7` writes `UI_SERVICE="sway.service essway.service"` to `/storage/.config/profile.d/090-ui_service`; `001-virtualization-setup:14` writes a third value, `UI_SERVICE="sway.service"`, to `profile.d/001-virtualization`. `001` is mode 100644 while its siblings are 100755. `001:23` writes a tmpfiles line for `/proc/sys/kernel/sched_migration_cost_ns`, which does not exist on the 6.15.6 kernel the config declares (`linux.x86_64.conf:3`). `095:10` creates `/etc/kernel` but `095:12` writes into `/etc/kernel/cmdline.d/`, which is never created, and nothing in a syslinux/GRUB boot reads that directory. Refutation attempted: searched the diff for a `package.mk`, `PKG_DIR` reference, or any path mentioning `packages/hardware/quirks` — none; searched for a consumer of `SYSTEM_SERVICE_DEPS`, `UI_SERVICE_AFTER`, `DISPLAY_DRIVER`, `VIRTUALIZED` (written by 091 and 001) — none in the packet. The README (`vm/README.md:67`) names `095-cloud-ssh`, which exists only in the projects tree, so the tooling is written against the projects tree.
- **Fix:** Delete `packages/hardware/quirks/platforms/GENERIC_X64/` entirely. Anything in it that is actually needed is re-authored in the projects tree, writes only under `/storage/.config`, and states which unit or consumer reads each value.
- **Confidence:** high on the conflict and on the internal contradictions; medium on the tree being uninstalled (the quirks `package.mk` is outside the packet).

### F-VM-05: `095-cloud-ssh` destroys the documented manual override every boot; the UTM bundle injects the port regardless of the network mode the tester selects
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh:22-28`
  `projects/ROCKNIX/devices/GENERIC_X64/vm/README.md:81-82,93-98`
  `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm` (`utm_config()`, `"QEMU": {"AdditionalArguments": ...}` and `"PortForward"`)
  `projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json:30`
- **What:** The quirk writes `/storage/.config/cloud_setup_ssh` when fw_cfg supplies a port and `rm -f`s it otherwise. Both branches replace whatever is there, so the "manual fallback" the README documents (write a full SSH command into that file) lasts until the next boot. Separately, the UTM bundle decides at generation time from `profile.json` (`"mode": "Emulated"`) to bake `-fw_cfg ...cloud_ssh_port` into `AdditionalArguments`; UTM's network mode is a per-VM setting the tester changes later, and the README itself says port forwards apply only in Emulated mode.
- **Failure scenario:** README:93-98 tells testers whose bridged mode hangs to select "Default (private)" host network. In that mode the fw_cfg string is still present, so the quirk writes `ssh -L ... -p 10022 root@127.0.0.1`; UTM applies no forward, so the shown command is refused, and the guest's reachable vmnet address is hidden from the screen. The tester follows README:81-82, writes the correct command by hand, reboots — the quirk overwrites it again. On a bridged VM or installed hardware the same file is `rm -f`'d each boot.
- **Evidence:** `echo "ssh -L 53682:localhost:53682 -p ${PORT} root@127.0.0.1" > "${TARGET}"` (25) / `rm -f "${TARGET}"` (27) with no check for an existing hand-written file; README:81-82 "Manual fallback: write a full SSH command into `/storage/.config/cloud_setup_ssh` in the guest"; README:96-98 "UTM only applies port forwards ... in **Emulated VLAN** mode ... not in the vmnet host-network modes". Refutation attempted: looked for a marker distinguishing quirk-written from hand-written content (a comment line, a sibling `.auto` file) — none; looked for the quirk reading the guest's actual network mode — it reads only fw_cfg.
- **Fix:** Write the assembled command to a separate file (e.g. `cloud_setup_ssh.auto`) and let the consumer prefer the hand-written one; or tag the quirk's line (`# generated by 095-cloud-ssh`) and only replace/remove files carrying the tag. For UTM, either drop the fw_cfg injection from the bundle or have the quirk verify reachability (it cannot from inside the guest) — at minimum the README must stop promising a fallback that does not survive a reboot.
- **Confidence:** high — every step is in the diff.

### F-VM-06: `qemu-args` ("print the command") unlinks the running VM's monitor and serial sockets and creates the OVMF vars file
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:114-115,160-161,202,625-627`
- **What:** `qemu_command()` performs side effects — `shutil.copyfile(vars_template, vars_path)`, `serial.unlink(missing_ok=True)`, `monitor.unlink(missing_ok=True)` — and `main()` calls it for both `run` and `qemu-args`. The README presents `qemu-args` as a way to "Print ... the Linux QEMU command".
- **Failure scenario:** A headless VM is running with the default `/tmp/rocknix-qemu-monitor.sock` and `/tmp/rocknix-qemu-serial.sock`. An operator runs `generic-x64-vm qemu-args --headless <disk>` to inspect the command. Both socket paths are removed from the filesystem; the harness can no longer connect for screendumps or the root shell, and the VM keeps running with no way to stop it except the pidfile.
- **Evidence:** lines 160-161 `serial = Path(args.serial).resolve()` / `serial.unlink(missing_ok=True)`; line 202 `monitor.unlink(missing_ok=True)`; lines 625-627 `command = qemu_command(profile, args)` then `if args.command == "qemu-args": print(shlex.join(command))`. Refutation attempted: looked for a dry-run flag or a branch skipping the unlinks when printing — none.
- **Fix:** Move the unlinks and the vars copy out of `qemu_command()` into the `run` branch (immediately before `os.execv`), or pass a `dry_run` flag.
- **Confidence:** high.

### F-VM-07: `097-disable-rescue-completely` masks rescue/emergency on every boot, writes into the read-only image, and leaves masks behind for future builds
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/097-disable-rescue-completely:6,11-14,17,20,29,33,42`
- **What:** Four `systemctl mask` calls run at every boot (each triggers a manager reload), then stub target files are written to `/lib/systemd/system/` — on an immutable image that write fails, and even if it succeeded the mask in `/etc` shadows it. The stubs alias themselves (`Alias=rescue.target` inside `rescue.target`). The stated reason, "Prevents hardcoded path issues", names no path.
- **Failure scenario:** A boot where `local-fs.target` or `sysinit.target` fails: systemd's `OnFailure=emergency.target` hits a masked unit, logs one line and stops; the machine sits with no shell and no message. The serial debug shell (F-VM-03) is `WantedBy=rocknix.target` and `After=rocknix-automount.service`, so it does not start either — the QA VM's own failure-diagnosis path is removed by the quirk meant to stabilise it. If `/etc/systemd/system` resolves into `/storage/.config` (outside the packet), the masks persist on the device after this quirk is later removed upstream — the "orphaned marker" case `upgrade-and-install.md` names.
- **Evidence:** `systemctl mask rescue.target` … `systemctl mask emergency.service` (11-14); `cat <<EOF >/lib/systemd/system/rescue.target` (20); `[Install] Alias=rescue.target` (28-29). Refutation attempted: looked for an unmask path, a check that the masks already exist, or a description of the "hardcoded path" — none; `upgrade-and-install.md` states ROCKNIX is immutable, and nothing in the diff makes `/lib` writable.
- **Fix:** Remove the quirk. If rescue/emergency genuinely must not run, ship a proper drop-in in the quirks package (build time, in `/usr/lib/systemd/system/*.d/`) with the reason recorded, and make the debug shell `DefaultDependencies=no` so a failed boot still has one.
- **Confidence:** high on what the script does; medium on the persisted-mask branch.

### F-VM-08: Emulator configs are copies from other devices and carry those devices' hardware identifiers
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/cemu-sa/config/GENERIC_X64/settings.xml:56,95`
  `projects/ROCKNIX/packages/emulators/standalone/rpcs3-sa/config/GENERIC_X64/config.yml:126,169`
  `projects/ROCKNIX/packages/emulators/standalone/xemu-sa/config/GENERIC_X64/xemu.toml:7`
  `projects/ROCKNIX/packages/emulators/standalone/mupen64plus-sa/mupen64plus-sa-core/config/GENERIC_X64/mupen64plus.cfg:175` (`name = "rg552_joypad"`)
  `projects/ROCKNIX/packages/emulators/standalone/dolphin-sa/config/GENERIC_X64/Dolphin.ini:152`
  `projects/ROCKNIX/packages/emulators/standalone/supermodel-sa/config/GENERIC_X64/Supermodel.ini` (`; Retroid Pocket Button Mapping`; `;Playable on pi but more slower down than srally2`)
  `projects/ROCKNIX/packages/apps/m8c/config/GENERIC_X64/Anbernic RG CubeXX.ini`, `Anbernic RG34XX.ini`, `Anbernic RG40XX H.ini`
- **What:** The defaults name specific hardware that a GENERIC_X64 machine does not have: Cemu's audio sink is a PCI 04:00.6 AMD ACP device, RPCS3's audio device is an ARM `platform/sound` card and its Vulkan adapter is `Turnip Adreno (TM) 650`, xemu's `port1` is an SDL GUID spelling "Retroid Poc", mupen64plus names the RG552 joypad, Dolphin carries another install's analytics ID, m8c ships INIs named after Anbernic gamepads.
- **Failure scenario:** First Cemu launch on the VM (intel-hda) or on an Intel PC: `alsa_output.pci-0000_04_00.6.analog-stereo` does not exist; the configured TV audio device is missing, so Cemu plays through whatever it falls back to or nothing, with no visible error. RPCS3 same for `alsa_output._sys_devices_platform_sound_sound_card0.HiFi__Speaker__sink`. xemu binds port 1 to a controller GUID that will never be plugged in, so the shipped default is "no controller".
- **Evidence:** `<TVDevice>alsa_output.pci-0000_04_00.6.analog-stereo</TVDevice>` (settings.xml:95); `Adapter: Turnip Adreno (TM) 650` (config.yml:126); `Audio Device: alsa_output._sys_devices_platform_sound_sound_card0.HiFi__Speaker__sink` (config.yml:169); `port1 = '0000f353526574726f696420506f6300'` (xemu.toml:7); `ID = 5082f0c30a7e422b1220107f69d6c108` (Dolphin.ini:152). Refutation attempted: looked for a first-boot script in the diff that rewrites these device names for the detected hardware — none in this bucket; looked for the configs being symlinks to a canonical x86 device — they are regular files.
- **Fix:** Start from empty/default device fields (Cemu `<TVDevice></TVDevice>`, RPCS3 `Audio Device: Default`, no Vulkan `Adapter`, xemu `port1 = ''`), drop the analytics ID, and either remove the Anbernic-named m8c INIs or explain which controller name they match on this device.
- **Confidence:** high on the content; medium on each emulator's fallback behaviour (outside the packet).

### F-VM-09: `mupen64plus.cfg` has a foreign section header spliced into `[Input-SDL-Control1]`
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/emulators/standalone/mupen64plus-sa/mupen64plus-sa-core/config/GENERIC_X64/mupen64plus.cfg:188-213` (the block beginning `# Digital button configuration mappings` / `; Retroid Pocket Gamepad - default.ini` / `[Retroid Pocket Gamepad]`)
- **What:** Immediately after `# Digital button configuration mappings` in `[Input-SDL-Control1]`, an `InputAutoCfg.ini`-style block (`[Retroid Pocket Gamepad]`, unquoted `button(14)` values, `AnalogDeadzone = 0,0`) is pasted in. In mupen64plus's INI parser a `[` line opens a new section, so every `DPad`/`Start`/`Z Trig`/`X Axis`/`Y Axis` key lands in a section named `Retroid Pocket Gamepad` and `[Input-SDL-Control1]` has no button or axis mappings at all.
- **Failure scenario:** Controller whose SDL name has no `InputAutoCfg.ini` entry (a USB pad passed through to the VM, or any pad on a PC): `mode = 2` auto-config finds nothing, the manual mappings that should back it are in the wrong section → no N64 controls. Even with a matching pad, the file is a corrupted paste that any later edit will propagate.
- **Evidence:** the block `; Retroid Pocket Gamepad - default.ini` → `[Retroid Pocket Gamepad]` → `DPad R = button(14)` … `Y Axis = axis(1-,1+)` followed by `[Input-SDL-Control2]`, whose keys are quoted (`DPad R = ""`) as the core cfg requires. Refutation attempted: looked for a second `[Input-SDL-Control1]` block or quoted mappings elsewhere for Control1 — none.
- **Fix:** Remove the pasted block; put the Retroid mapping in the input plugin's `InputAutoCfg.ini` if it is wanted, and give Control1 either empty quoted keys like Control2 or a real quoted mapping.
- **Confidence:** high on the file content; medium on runtime effect under `mode = 2` (plugin behaviour outside the packet). Line numbers are counted from the hunk start; the quoted text identifies the block.

### F-VM-10: `092-retroarch-surface` cannot follow a mode change and picks an arbitrary connector
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/092-retroarch-surface:21,25-27`
  `projects/ROCKNIX/devices/GENERIC_X64/vm/README.md:25-34`
- **What:** The quirk rewrites `video_fullscreen_x/y` only while they still read `0|640` / `0|480`. Its own earlier write (`1280`/`800`) does not match, so a disk booted once at 1280x800 keeps that surface size when booted later at another mode. `MODE` is the first line of the concatenated `modes` files of every connector, alphabetically, not the connector sway is driving; `1920x1080i` passes the `case` and yields `H="1080i"`. The `upgrade-and-install.md` "Already written" question is answered for the shipped `0` but not for the quirk's own prior writes.
- **Failure scenario:** README:31-34 recommends `--res 640x480` "to check a handheld panel's look on the VM first". A QA disk previously booted at the 1280x800 default has `video_fullscreen_x = "1280"`; booted at 640x480, the grep fails, RetroArch draws a 1280x800 surface that sway scales down to 640x480 — the reverse of the artefact the quirk exists to remove, on the exact workflow the README advertises. On a PC with eDP plus a disconnected `DP-1` listing modes, the DP-1 mode is chosen.
- **Evidence:** `MODE="$(cat /sys/class/drm/card*-*/modes 2>/dev/null | head -1)"` (21); `grep -qE '^video_fullscreen_x = "(0|640)"$'` (26); `grep -qE '^video_fullscreen_y = "(0|480)"$'` (27). Refutation attempted: looked for a marker recording the last applied mode, a comparison against the current value, or a connector `status`/`enabled` filter — none.
- **Fix:** Record the mode the quirk applied (e.g. `/storage/.config/retroarch/.fullscreen_mode`) and rewrite when the current mode differs from the recorded one, leaving values that match neither shipped nor recorded alone; select the connector with `status == connected` (and `enabled`), and strip a trailing `i`. Whether `retroarch.cfg` is seeded before the quirks run, and whether it is ever a symlink (rule: "Does the change assume it is a regular file?" — `sed -i` replaces a symlink), is outside the packet.
- **Confidence:** medium — the code paths are proven; the multi-connector case depends on hardware not in the packet.

### F-VM-11: Emulator defaults select Vulkan on a device that declares no Vulkan driver
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/options:30,36-38`
  `projects/ROCKNIX/packages/emulators/standalone/dolphin-sa/config/GENERIC_X64/Dolphin.ini:129`
  `projects/ROCKNIX/packages/emulators/standalone/xemu-sa/config/GENERIC_X64/xemu.toml:10`
  `projects/ROCKNIX/packages/emulators/standalone/cemu-sa/config/GENERIC_X64/settings.xml:55`
  `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:235-236`
- **What:** `GRAPHIC_DRIVERS="virtio vmware"` and `VULKAN="vulkan-loader vulkan-headers"` name a loader and headers but no ICD; the launcher creates `virtio-gpu-gl-pci` without `venus=on`, so the guest has no Vulkan-capable virtio device either. Dolphin (`GFXBackend = Vulkan`), xemu (`renderer = 'VULKAN'`) and Cemu (`<api>1</api>`) default to Vulkan.
- **Failure scenario:** First launch of a GameCube title on the VM: Dolphin's Vulkan backend finds no physical device and errors; xemu refuses to start without a Vulkan device. The options file's own comment says llvmpipe GL is "the reliable fallback in any VM" — the shipped emulator defaults do not use it.
- **Evidence:** options:30 `GRAPHIC_DRIVERS="virtio vmware"`; options:38 `VULKAN="vulkan-loader vulkan-headers"`; options:36 "re-enabled for x86_64 with proper Mesa configuration" — no Mesa configuration appears in the packet. Refutation attempted: looked for a lavapipe/`swrast` Vulkan entry, `venus=on` in the launcher, or an `MESA_*`/`VK_ICD` override — none. The Mesa `package.mk`'s mapping of `LLVM_SUPPORT`/`GRAPHIC_DRIVERS` to `vulkan-drivers` is outside the packet and could add lavapipe.
- **Fix:** Default these three to OpenGL for GENERIC_X64 (consistent with RPCS3's `Renderer: OpenGL`), or state in `options` which Vulkan driver is built and why software Vulkan is preferred to virgl GL.
- **Confidence:** medium — the absence of an ICD in the packet is certain; its absence in the built image is not.

### F-VM-12: `options` contradicts itself on iris/LLVM and silently requires x86-64-v3 for a "Generic x86_64" installer target
- **Severity:** Low
- **Category:** Documentation
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/options:11,17,26-30,72-73,75-76,79`
- **What:** Line 28 says iris "is intentionally omitted"; line 72 says LLVM is enabled "for iris graphics driver compute shaders". Line 75 disables swap "for virtualized environments" while line 79 enables installation to real disks. `TARGET_CPU="x86-64-v3"` (11) with `HW_CPU="Generic x86_64"` (17) means any pre-Haswell / pre-Excavator PC gets `SIGILL` in the first AVX2 instruction, with nothing in the device naming or docs saying so.
- **Failure scenario:** none demonstrated for the comments; for the CPU baseline: an owner installs "Generic x86_64" on an Ivy Bridge box, boot reaches userspace and the first v3-compiled binary dies with Illegal instruction.
- **Evidence:** quoted lines above. Refutation attempted: looked for a CPU check in the installer path or a note in README — none in the packet.
- **Fix:** Fix the two comments; either lower to `x86-64-v2` or rename/document the requirement (the VM profile's `Haswell-v4` is fine either way).
- **Confidence:** high on the text; the SIGILL scenario is standard toolchain behaviour.

### F-VM-13: Kernel config carries debug/tracing costs and a leftover built-in command line
- **Severity:** Low
- **Category:** Convention
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/linux/linux.x86_64.conf` (`CONFIG_CMDLINE="root=/dev/sda1 init=/sbin/init usbcore.autosuspend=-1"`, `CONFIG_IRQSOFF_TRACER=y`, `CONFIG_TRACE_IRQFLAGS=y`, `CONFIG_PM_DEBUG=y`, `CONFIG_PM_TEST_SUSPEND=y`, `CONFIG_X86_DEBUG_FPU=y`, `CONFIG_FW_LOADER_DEBUG=y`, `CONFIG_DRM_I915=y`, `CONFIG_DRM_AMDGPU=y`, `CONFIG_DRM_RADEON=y`)
- **What:** `root=/dev/sda1` names a disk the VM profile does not present (virtio-blk is `/dev/vda`); it is inert behind the initramfs `/init` but misleading. `IRQSOFF_TRACER`/`TRACE_IRQFLAGS`/`X86_DEBUG_FPU` add per-interrupt and per-context-switch overhead on a target whose comments already complain about frame drops. Intel/AMD KMS drivers are built in (not modules) for hardware that `options:30` gives no Mesa driver for.
- **Failure scenario:** none demonstrated; performance and image size only.
- **Evidence:** the config lines named. Refutation attempted: looked for a comment or `options` line justifying tracing on this device — none.
- **Fix:** Drop `root=`/`init=` from `CONFIG_CMDLINE`, disable the tracers and PM/FPU debug for release images (keep `FUNCTION_TRACER` if the harness uses ftrace), make the GPU drivers modules.
- **Confidence:** medium — whether these mirror upstream's Generic x86 config is outside the packet.

### F-VM-14: Launcher hygiene — shared `/tmp` paths, always-LAN extra forwards, late validation
- **Severity:** Low
- **Category:** Security
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:183,249` and `add_qemu_options()` (`--monitor` default `/tmp/rocknix-qemu-monitor.sock`, `--serial` default `/tmp/rocknix-qemu-serial.sock`, `--pidfile` default `/tmp/rocknix-qemu.pid`, `--ssh-port` with `type=int` only), `find_ovmf()` calls at 91-108
- **What:** Fixed, world-readable `/tmp` names for the monitor (full VM control) and the serial root shell, unlinked without ownership checks; `svc_bind = "0.0.0.0"` for `extra_forwards` regardless of `--net user` (the profile has none today, so the `user` help text is true only by accident); `--ssh-port` is not range-checked though `mac_address()`'s docstring gives exactly that reason for validating early; OVMF code and vars are chosen from independent candidate lists, so a 4M `OVMF_CODE_4M.fd` can be paired with a 2M `OVMF_VARS.fd`.
- **Failure scenario:** Multi-user build host: another user's stale `/tmp/rocknix-qemu-monitor.sock` is unlinked, or a pre-created symlink at that path is followed by QEMU. Two-VM runs per the README need three extra flags, not one.
- **Evidence:** `svc_bind = "0.0.0.0"` (183); `f",hostfwd=tcp:{svc_bind}:..."` (249); the three `/tmp/...` defaults; `parser.add_argument("--ssh-port", type=int, default=None, ...)`. Refutation attempted: looked for `tempfile`/`$XDG_RUNTIME_DIR` use or an ownership check before unlink — none.
- **Fix:** Default the sockets and pidfile under `$XDG_RUNTIME_DIR` (fall back to a `mkdtemp` under `/tmp`), bind extra forwards with `ssh_bind`, range-check `--ssh-port`, and pair OVMF code/vars from the same directory.
- **Confidence:** high.

### F-VM-15: Header, licence and reference hygiene
- **Severity:** Low
- **Category:** Convention
- **Where:** `packages/hardware/quirks/platforms/GENERIC_X64/001-virtualization-setup:3,26` (2024; no trailing newline; mode 100644)
  `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/097-disable-rescue-completely:3,45` (2024; no trailing newline)
  `projects/ROCKNIX/devices/GENERIC_X64/filesystem/usr/lib/systemd/system/serial-debug-shell.service:1-5` (no SPDX/copyright)
  `projects/ROCKNIX/packages/sysutils/system-utils/sources/devices/GENERIC_X64/video_sense:3-4`
  `projects/ROCKNIX/devices/GENERIC_X64/vm/README.md:29,` `generic-x64-vm:144,174,198,298`, `092-retroarch-surface:13`, `options:29`
- **What:** Fork-authored 2026 files carry `Copyright (C) 2024 ROCKNIX`; the unit file has no header; licences alternate between `GPL-2.0` and `GPL-2.0-or-later` within one bucket; code comments cite fork issue numbers (`#16`, `#91`, `#97`, `#104`, `#251`, `#263`, `#291`, `D-QA-007`) and `H700` that mean nothing to an upstream reader.
- **Failure scenario:** none demonstrated.
- **Evidence:** the lines named. Refutation attempted: n/a.
- **Fix:** Normalise headers to the repository's SPDX convention with correct years; replace issue numbers with the fact they point to.
- **Confidence:** high.

### F-VM-16: Handheld performance caps and fixed resolutions copied into GENERIC_X64 defaults
- **Severity:** Low
- **Category:** Correctness
- **Where:** `rpcs3-sa/config/GENERIC_X64/config.yml:72-73,75,79-80,112` (`Resolution: 720x480`, `Frame limit: 30`, `Shader Precision: Low`, `Write Color Buffers: true`, `Resolution Scale: 50`)
  `flycast-sa/config/GENERIC_X64/emu.cfg:21-23` (`fullscreen = yes`, `height = 1080`, `width = 1920`)
  `supermodel-sa/config/GENERIC_X64/Supermodel.ini` (`XResolution = 1920`, `YResolution = 1080`)
  `mupen64plus.cfg` `[Video-General]` (`ScreenWidth = 1280`, `ScreenHeight = 960`, `Fullscreen = True`)
- **What:** Defaults tuned for an ARM handheld (half-resolution PS3 at 30 fps, `Write Color Buffers` on) and fixed 1920x1080 / 1280x960 output sizes on a device whose default display is 1280x800 (`README.md:25`) and whose recommended check mode is 640x480.
- **Failure scenario:** mupen64plus fullscreen at 1280x960 on a 1280x800 output — the mode does not exist; SDL substitutes or fails depending on the backend.
- **Evidence:** the quoted lines. Refutation attempted: looked for a per-boot resolution rewrite covering these emulators as `092-retroarch-surface` does for RetroArch — none.
- **Fix:** Remove fixed sizes (let fullscreen use the current mode) and reset RPCS3 to its defaults for an x86 target.
- **Confidence:** high on content; medium on each emulator's mode-fallback behaviour.

## Upstream fit

- **Orphan quirk tree.** `packages/hardware/quirks/platforms/GENERIC_X64/` (7 files) is outside the location `packaging-and-patches.md` names, has no `package.mk`, and duplicates/contradicts the projects tree. A maintainer will ask which one is real and reject both until reconciled (F-VM-04).
- **Root shell in a shipped overlay.** `serial-debug-shell.service` cannot go into `devices/GENERIC_X64/filesystem/` for an installer-capable device (F-VM-03). QA-only material belongs behind a build variable.
- **Boot-policy changes without justification.** `097-disable-rescue-completely` masks emergency mode with a one-line reason that names no path (F-VM-07); the dead tree's `mitigations=off` and `RuntimeWatchdogSec=0` would be refused on sight.
- **Bootloader updater diverges from the Generic x86 pattern.** Copying `ldlinux.sys` and the cfg templates on update (F-VM-01/02) is the kind of change a maintainer will want compared line-by-line against the existing x86 `update.sh` before accepting a new device that claims BIOS support.
- **Per-device emulator configs are foreign copies.** PCI sink names, an Adreno adapter, a Retroid controller GUID, an RG552 joypad name, another install's Dolphin analytics ID, Anbernic-named m8c INIs and "Playable on pi" comments (F-VM-08/09/16). Upstream will expect either genuine GENERIC_X64 defaults or symlinks to a canonical x86 device's configs.
- **Host tooling inside the device overlay.** A 637-line Python launcher, a UTM bundle generator and a tester README under `projects/ROCKNIX/devices/GENERIC_X64/vm/` is host-side QA tooling in a build-input directory; upstream would likely ask for it under `tools/` or a separate repository, and for the README to lose the tester anecdotes ("Bridged confirmed broken on one test Mac on both UTM 4.7.5 stable and the current beta").
- **Fork-local references.** Issue numbers and `D-QA-007` in comments (F-VM-15); `options:29` "see issue #16".
- **Headers.** `Copyright (C) 2024` on 2026 work, a unit file with no SPDX, mixed `GPL-2.0`/`GPL-2.0-or-later`, one non-executable quirk, two files without trailing newlines.
- **CPU baseline.** `x86-64-v3` for a target named "Generic x86_64" needs a stated rationale (F-VM-12).
- **Kernel config.** Debug tracers and built-in GPU drivers with no Mesa counterpart will be questioned (F-VM-13).
- **Nine symlinks to `InputPlumber`.** Reasonable if those directories exist in each package; the maintainer will check that GENERIC_X64 with `ROCKNIX_JOYPAD="no"` is actually an InputPlumber device.

## Coverage boundary

Not judgeable from this packet; each changes a verdict above if it turns out differently:

- **The quirks `package.mk`** (`projects/ROCKNIX/packages/hardware/quirks/`): which platform directory is installed, whether scripts are executed (exec bit matters) or sourced, and where in boot they run relative to DRM probe and `retroarch.cfg` seeding (F-VM-04, F-VM-10).
- **`usr/share/bootloader/{ldlinux.sys,syslinux.cfg,grub.cfg}` contents** and the installer/`mkimage` that writes the flash configs; whether init runs `update.sh` and what consumes `/storage/.boot.hint` (F-VM-01/02).
- **Whether `/etc/systemd/system` resolves into `/storage/.config/system.d`** — decides whether `systemctl mask` persists and whether the dead tree's `/etc/systemd/system/*` writes would land (F-VM-04, F-VM-07).
- **What enables `serial-debug-shell.service`** (a `rocknix.target.wants/` symlink, a preset, or nothing) (F-VM-03).
- **The nine `InputPlumber` target directories** and whether they carry `GamecubeControllerProfiles`, `WiiControllerProfiles`, `Hotkeys.ini`.
- **Mesa `package.mk`**: how `GRAPHIC_DRIVERS="virtio vmware"`, `LLVM_SUPPORT`, `VULKAN_SUPPORT` map to gallium/vulkan drivers (lavapipe or not) (F-VM-11).
- **Consumers** of `UI_SERVICE`, `UI_SHADER`, `cloud_setup_ssh`, `SYSTEM_SERVICE_DEPS`, `UI_SERVICE_AFTER`, `DISPLAY_DRIVER`, `VIRTUALIZED`, and the `log` function `video_sense` calls.
- **`/etc/systemd/system.conf` in the image**: the `RuntimeWatchdogSec` value the launcher comment assumes (line 296-301).
- **`tools/vm-upgrade-rehearsal`, `tools/vm-qa`, `tools/last-good-scripts-test`**: whether any of them runs `update.sh`, boots BIOS, or exercises `092-retroarch-surface`/`095-cloud-ssh` under the image's busybox as `upgrade-and-install.md` requires.
- **UTM's config.plist schema** for the values emitted by `utm_config()` (`virtio-gpu-gl-pci` display hardware, `Emulated` mode, `AdditionalArguments` tokenisation).
- **The device package list** — which of the standalone emulators whose configs are added are built for GENERIC_X64 at all.
- **Runtime.** Nothing here was executed; every finding is static.
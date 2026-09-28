Orchestrator alert: the launcher has a direct data-loss path. `qemu-args` calls code that unlinks the monitor path without checking whether it is the input disk; supplying the disk as `--monitor` therefore deletes it before any VM starts. This follows from the embedded code; I have not executed a test.

# Summary

This bucket adds the GENERIC_X64 device, its kernel configuration, boot and service quirks, emulator defaults, and QEMU/UTM tooling. It should not be submitted upstream unchanged. The launcher can delete the input disk while merely printing QEMU arguments because command construction unconditionally unlinks caller-selected paths. The bootloader updater does not check remount or copy failures and can report success after an incomplete update. The RetroArch surface adjustment writes persistent dimensions that it subsequently treats as user overrides, breaking resolution changes on reused QA guests. This is a static review of the embedded corpus; image contents, quirk activation, and runtime behavior were not independently tested.

All code locations below are repository-relative locations within **S1**. Sources **S1–S4**, their declared paths, and their Facilitator-verified hashes are recorded in `corpus.provenance.json` under Coverage boundary.

# Findings

### F-VM-01: Printing QEMU arguments can delete the input disk
- **Severity:** Critical
- **Category:** Data loss
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:155–166`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:196–202`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:619–630`
- **What:** `qemu_command()` unconditionally unlinks the resolved monitor path and, for headless operation, the serial path. This function also runs for `qemu-args`, and neither path is checked against the disk, other input files, or an active socket.
- **Failure scenario:** For an existing valid qcow2 path `D`, invoke `qemu-args D --monitor D`: disk validation and inspection succeed, then `monitor.unlink()` deletes `D` before the command is printed. Ordinary command printing can also unlink a running guest’s default monitor socket; resolving a pre-existing symlink before unlinking exposes its target to deletion.
- **Evidence:** The body contains `serial.unlink(missing_ok=True)` and `monitor.unlink(missing_ok=True)`. `main()` calls `qemu_command(profile, args)` before checking whether to print or execute. Refutation checked: there is no file-type, symlink, ownership, active-listener, or input-path collision check.
- **Fix:** Make command construction side-effect free. Create control endpoints only during execution, in a private per-instance directory; reject collisions with inputs and refuse existing endpoints unless their ownership, type, and inactivity are established without following an attacker-controlled symlink.
- **Confidence:** high — the deletion follows directly from the supplied control flow; no QEMU execution is required.

### F-VM-02: Bootloader update failures fall through to a success marker
- **Severity:** High
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh:14–34`
- **What:** The standalone script checks neither remount results nor copy results and overwrites live bootloader files directly. Its final operation writes `UPDATE` to `/storage/.boot.hint`, so preceding failures can be concealed by a successful final exit status.
- **Failure scenario:** A read-only or full boot partition causes copies to fail, but the script continues and writes the update hint. A failed copy after truncating an existing EFI loader can leave a partial boot file without retaining a recoverable previous version.
- **Evidence:** `mount -o remount,rw`, each `cp`, and `mount -o remount,ro` are unchecked; the last line is `echo "UPDATE" > /storage/.boot.hint`. Refutation checked: the `[ -f ... ]` guards test source existence, not successful installation; there is no rollback, verification, or error aggregation.
- **Fix:** Explicitly fail on remount and installation errors, preserve recoverable boot files, verify replacements, and restore mount state on failure. Write the success hint only after the complete update succeeds. Do not rely on an unseen caller’s shell options.
- **Confidence:** high — the standalone execution path is explicit; the parent updater’s behavior is outside the packet.

### F-VM-03: Automatically chosen RetroArch dimensions become permanent after the first boot
- **Severity:** High
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/092-retroarch-surface:16–30`
- **What:** The quirk only replaces width values of `0` or `640` and height values of `0` or `480`. Once it writes another mode, later executions cannot distinguish those generated values from deliberate user settings.
- **Failure scenario:** Boot a guest with `640x480` defaults at `1280x800`; the quirk writes `1280x800`. Reuse that storage with `--res 640x480`: neither value matches the migration guards, so RetroArch keeps the old surface size. Independently modifying the two dimensions can also produce a mixed custom/generated pair.
- **Evidence:** The two guards are `'^video_fullscreen_x = "(0|640)"$'` and `'^video_fullscreen_y = "(0|480)"$'`. Refutation checked: there is no last-generated-value record, ownership marker, or pairwise update. S3’s “Already written” rule applies to the values this quirk itself leaves behind.
- **Fix:** Track explicit user overrides separately from generated dimensions, update generated dimensions as a pair, and handle previously generated values without inventing their provenance. Add a persisted-storage rehearsal that changes resolution between boots.
- **Confidence:** high — the two-boot failure follows directly from the matching and replacement rules.

### F-VM-04: The generated D-Bus and hostnamed ordering contains a cycle
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `packages/hardware/quirks/platforms/GENERIC_X64/093-rocknix-service-fixes:49–69`
- **What:** The generated D-Bus drop-in orders D-Bus after hostnamed, while the generated hostnamed drop-in orders hostnamed after D-Bus. A transaction containing both services cannot satisfy that ordering.
- **Failure scenario:** An image applies this quirk and queues both services for startup; systemd must reject or break the cyclic transaction rather than start both in the prescribed order.
- **Evidence:** D-Bus receives `After=systemd-journald.service systemd-hostnamed.service`; hostnamed receives `After=systemd-journald.service dbus.service` and `Requisite=dbus.service`. Refutation checked: the script does not remove either edge or make them mutually exclusive.
- **Fix:** Remove the D-Bus dependency on hostnamed. Establish one-directional ordering from D-Bus to its consumers, and validate the complete emitted unit graph using the image’s systemd.
- **Confidence:** medium — the contradictory definitions are explicit, but installation and activation of this quirk tree are outside the packet.

### F-VM-05: The hostnamed replacement inherits an invalid restart policy
- **Severity:** High
- **Category:** Correctness
- **Where:**
  - `packages/hardware/quirks/platforms/GENERIC_X64/093-rocknix-service-fixes:65–85`
  - `packages/hardware/quirks/platforms/GENERIC_X64/094-core-systemd-fixes:13–25`
- **What:** Script `093` creates a hostnamed drop-in with `Restart=always`; script `094` replaces the main unit with `Type=oneshot` without removing that drop-in. Systemd does not permit `Restart=always` for a oneshot service.
- **Failure scenario:** Execute these quirks in their numbered order and load hostnamed: the replacement and retained drop-in combine into an invalid service definition.
- **Evidence:** The files emit `Restart=always` and `Type=oneshot` respectively. Refutation checked: `094` contains neither drop-in cleanup nor a replacement restart policy. Its “masked” comment is not an actual mask and does not prevent drop-in merging.
- **Fix:** Remove the incompatible override and decide whether hostnamed is genuinely supported or deliberately unavailable. Do not substitute an apparently successful `/bin/true` service for a functioning hostname service.
- **Confidence:** medium — the merge defect is explicit if both scripts run; actual quirk selection and execution are not embedded.

### F-VM-06: Hardware quirks are split across conflicting package trees
- **Severity:** Medium
- **Category:** Convention
- **Where:**
  - `packages/hardware/quirks/platforms/GENERIC_X64/001-virtualization-setup:1–26`
  - `packages/hardware/quirks/platforms/GENERIC_X64/090-ui_service:1–10`
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/090-ui_service:1–8`
- **What:** Seven new quirks are placed under `packages/hardware/quirks/`, contrary to S4’s prescribed project-specific location. The two trees also contain different implementations of `090-ui_service`, so package selection affects which UI services are configured.
- **Failure scenario:** none demonstrated for the placement convention; the owning recipe and runner are outside the packet.
- **Evidence:** S4, “Generating patches,” says hardware quirks belong under `projects/ROCKNIX/packages/hardware/quirks/`. One `090` only assigns `UI_SERVICE="sway.service"`; the other writes a persistent profile containing `UI_SERVICE="sway.service essway.service"`. Refutation checked: no installation or precedence rule is included to reconcile them.
- **Fix:** Keep one canonical, tested implementation in the prescribed tree and remove obsolete alternatives. Account for generated `/storage` overrides if earlier builds installed them; deleting source files alone does not remove inherited state.
- **Confidence:** high — the placement violation and conflicting implementations are visible; runtime selection remains unknown.

### F-VM-07: Rescue masks defeat the replacement targets
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/097-disable-rescue-completely:10–43`
- **What:** The script masks both recovery targets and services, then writes vendor-location replacement targets that cannot override those masks. The replacements also contain no transition to `default.target`, despite comments claiming that behavior.
- **Failure scenario:** After the quirk runs, a failure requests `emergency.target` or an operator requests `rescue.target`; the masked target cannot start. The written stub neither restores recovery nor continues to the normal target.
- **Evidence:** The script issues four `systemctl mask` commands before writing `/lib/systemd/system/rescue.target` and `emergency.target`. Their only required target is `sysinit.target`. Refutation checked: there is no unmask operation or dependency on `default.target`.
- **Fix:** Repair the actual recovery-path problem instead of masking recovery wholesale. Supply a usable recovery path that does not depend on successful `/storage` mounting.
- **Confidence:** high — mask precedence and the emitted target contents determine the described result.

### F-VM-08: The kernel-command-line fragment’s parent directory is not created
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `packages/hardware/quirks/platforms/GENERIC_X64/095-kernel-early-boot-fixes:9–19`
  - `packages/hardware/quirks/platforms/GENERIC_X64/095-kernel-early-boot-fixes:74`
- **What:** The script creates `/etc/kernel` but writes into `/etc/kernel/cmdline.d` without creating that directory. On a clean filesystem lacking the latter, the redirection fails; normal standalone execution nevertheless reaches the success message.
- **Failure scenario:** Run the script with no pre-existing `/etc/kernel/cmdline.d`: no command-line fragment is written, but the script reports that kernel and early-boot fixes were applied.
- **Evidence:** `mkdir -p /etc/kernel` is followed by `cat <<EOF >/etc/kernel/cmdline.d/10-generic-x64.conf`. Refutation checked: there is no creation of the nested directory or write-result check. A bootloader consumer of this fragment is also not shown.
- **Fix:** Remove the fragment if unused, or create its actual destination and integrate it into the real bootloader-generation path. Report failures rather than relying on state left by another package.
- **Confidence:** high — the failure is deterministic for the stated clean-filesystem input; another package’s directory creation is unverified.

### F-VM-09: Advertised DRM modes are mistaken for the selected display mode
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/092-retroarch-surface:20–27`
- **What:** The resolution probe takes the first advertised mode from a glob of every connector’s `modes` file. It does not identify the selected output or its configured mode.
- **Failure scenario:** An output advertises `1280x800` first but is configured to display `640x480`, or another connector precedes the intended output; the quirk writes dimensions for the wrong mode into RetroArch.
- **Evidence:** `MODE="$(cat /sys/class/drm/card*-*/modes 2>/dev/null | head -1)"` supplies both dimensions. Refutation checked: there is no output selection, connection-status check, or current-mode query.
- **Fix:** Obtain the configured mode of the selected output after display configuration is available, rather than treating the first supported mode as authoritative.
- **Confidence:** high — the probe reads a supported-mode list, not selected-mode state.

### F-VM-10: The cloud SSH quirk deletes the documented manual override
- **Severity:** Medium
- **Category:** Upgrade path
- **Where:**
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh:14–28`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/README.md:81–82`
- **What:** The README recommends manually writing `cloud_setup_ssh`, but the quirk overwrites that same file whenever fw_cfg supplies a port and deletes it otherwise. There is no distinction between generated state and an owner’s override.
- **Failure scenario:** A user writes the documented fallback command for a bridged or specially forwarded guest. On the next quirk execution, absent fw_cfg causes the command to be deleted; present fw_cfg replaces it with the generated loopback command.
- **Evidence:** The valid-port branch redirects directly to `${TARGET}`; the other branch executes `rm -f "${TARGET}"`. Refutation checked: there is no provenance marker or separate manual override.
- **Fix:** Store generated connection information separately and give an explicit manual override precedence. Clean up only artifacts the quirk can identify as its own.
- **Confidence:** high — both destructive branches and the conflicting documentation are present.

### F-VM-11: UTM packaging accepts qcow2 files whose backing data is not bundled
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:456–489`
- **What:** `build_utm()` checks qcow2 format and virtual size, then archives the input file verbatim. It does not flatten or reject backing-file dependencies.
- **Failure scenario:** Pass a 16 GiB qcow2 overlay backed by another local image. Bundle creation succeeds, but the archive contains only the overlay; after transfer to another host, the referenced backing image is absent and the guest disk cannot be opened.
- **Evidence:** Validation examines `info["format"]` and `info["virtual-size"]`; packaging uses `archive.write(disk, ...)`. Refutation checked: there is no backing-chain validation, conversion, or inclusion of dependent files.
- **Fix:** Produce a standalone qcow2 from a consistent source before packaging, or reject inputs with backing files or external data dependencies. Verify the resulting archive without access to the original source directory.
- **Confidence:** high — the accepted input and omitted dependency follow from the complete function.

### F-VM-12: Concurrent UTM builds can publish another process’s unfinished archive
- **Severity:** Medium
- **Category:** Concurrency
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:477–495`
- **What:** Every build for the same output uses the same adjacent `.tmp` pathname and unlinks it before opening. Atomic replacement does not protect publication when the temporary pathname belongs to another writer.
- **Failure scenario:** Build A opens the temporary archive. Build B unlinks it and opens a replacement at the same name. When A finishes, its `os.replace()` publishes B’s still-open archive and A reports success; B later finds its temporary pathname missing.
- **Evidence:** `temporary_output = output.with_suffix(...)`, `temporary_output.unlink(...)`, and `os.replace(temporary_output, output)` use a shared deterministic name. Refutation checked: the private `TemporaryDirectory` holds only `config.plist`, not the archive.
- **Fix:** Create a unique temporary archive in the output filesystem and publish only that file. Serialize competing writes to the same destination if both jobs must receive meaningful success guarantees.
- **Confidence:** high — the interleaving follows directly from the pathname operations.

### F-VM-13: QEMU option strings do not escape commas in file paths
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:218–231`
- **What:** Disk and firmware paths are interpolated directly into QEMU’s comma-delimited `-drive` option syntax. Python argument separation and `shlex.join()` do not escape that inner syntax.
- **Failure scenario:** A valid image or firmware file resides in a directory containing a comma. Filesystem checks and `qemu-img info` succeed, but QEMU parses part of the path as another option and fails to open the intended file.
- **Evidence:** The generated arguments contain `file={code}`, `file={vars_path}`, and `file={disk}` without QEMU-level escaping. Refutation checked: there is no structured block-device representation or key-value escaping helper.
- **Fix:** Use a structured QEMU block-device interface or correctly escape values for QEMU’s option grammar. Apply the same discipline to other structured arguments containing paths.
- **Confidence:** high — the accepted path characters conflict with the generated option encoding.

### F-VM-14: Automatic acceleration selection mistakes ARM KVM for x86 KVM
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:117–124`
- **What:** Automatic selection chooses KVM solely from accessibility of `/dev/kvm`. That does not establish that KVM can accelerate this x86_64 guest.
- **Failure scenario:** Run the launcher on an ARM64 Linux host with accessible ARM KVM and `qemu-system-x86_64` installed for emulation. It selects `-accel kvm` instead of TCG, and the guest cannot start through that accelerator.
- **Evidence:** `accel = "kvm" if os.access("/dev/kvm", ...) else "tcg,thread=multi"`. Refutation checked: there is no host-architecture or QEMU-accelerator compatibility check. The manual `--accel` override does not correct automatic selection.
- **Fix:** Select KVM only when host architecture and the invoked QEMU support acceleration of the requested guest; otherwise use TCG.
- **Confidence:** high — KVM device accessibility is insufficient for cross-architecture acceleration.

### F-VM-15: Linux launches do not enforce the canonical disk capacity
- **Severity:** Medium
- **Category:** Test gap
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json:14–20`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:43–53`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:117–124`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:222–231`
- **What:** `load_profile()` validates the capacity declared in JSON, not the supplied disk’s capacity. The Linux launcher obtains the real image information but uses only its format, unlike UTM packaging.
- **Failure scenario:** Supply an otherwise valid 8 GiB qcow2: the Linux QA guest runs with 8 GiB despite the canonical profile specifying 16 GiB, while the UTM builder rejects the same input. Storage-sensitive tests consequently run under different capacity contracts.
- **Evidence:** The profile declares `17179869184`; the Linux command references `disk_info['format']` but never validates `disk_info["virtual-size"]`. Refutation checked: no resize or capacity enforcement occurs elsewhere in the launch function.
- **Fix:** Share actual-image capacity validation between launch and packaging, and reject or explicitly prepare nonconforming images before QA.
- **Confidence:** high — the asymmetry is explicit in the two code paths.

### F-VM-16: Switching a generated UTM bundle to Bridged retains the NAT SSH advertisement
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json:28–38`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:389–412`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/README.md:49–54`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/README.md:76–79`
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh:14–28`
- **What:** The NAT fw_cfg advertisement is baked into the generated bundle’s `AdditionalArguments`, based on the profile’s mode at packaging time. Changing the bundle’s network mode does not change the guest-side logic, which trusts that advertisement alone.
- **Failure scenario:** Generate the shipped Emulated-mode bundle, then change its network mode to Bridged while retaining its generated additional arguments—the documented one-setting change. The forward disappears, but the guest still writes the command targeting `127.0.0.1:10022`.
- **Evidence:** The generated `-fw_cfg ... string=10022` is omitted only when `utm_config()` runs with `network["mode"] == "Bridged"`. Refutation checked: the guest quirk has no actual-network-mode check, and the README’s bridge-switch instructions do not remove the static advertisement.
- **Fix:** Make the mode transition update both networking and the advertised connection information, or provide a supported mode-specific bundle/configuration mechanism. Test changing an already-generated bundle, not just generating one from a different profile.
- **Confidence:** high — the mismatched configuration state is explicit; UTM UI execution was not tested.

### F-VM-17: Normal console selection is the only gate on an unauthenticated root shell
- **Severity:** Medium
- **Category:** Security
- **Where:**
  - `projects/ROCKNIX/devices/GENERIC_X64/filesystem/usr/lib/systemd/system/serial-debug-shell.service:6–29`
  - `projects/ROCKNIX/devices/GENERIC_X64/options:66–67`
- **What:** An enabled instance of this unit starts `/bin/sh` as root without authentication, and its conditions are satisfied by the ordinary shipped kernel command line. There is no separate debug-only opt-in.
- **Failure scenario:** Enable or pull in the shipped unit during a normal GENERIC_X64 boot; anyone able to access that serial console receives a root shell rather than a login prompt.
- **Evidence:** The service has `ExecStart=/bin/sh`, no non-root `User=`, and console conditions matching the default `EXTRA_CMDLINE="console=ttyS0,115200 console=tty0"`. Refutation checked: there is no dedicated debug flag. `[Install]` alone does not prove that the image enables it.
- **Fix:** Keep this in an explicitly designated QA image or require a distinct debug opt-in. Selecting a logging console should not itself authorize a root shell.
- **Confidence:** medium — the access behavior and matching conditions are explicit; actual service enablement is outside the packet.

### F-VM-18: The supplied watchdog policy contradicts the claimed VM recovery behavior
- **Severity:** Medium
- **Category:** Test gap
- **Where:**
  - `packages/hardware/quirks/platforms/GENERIC_X64/095-kernel-early-boot-fixes:59–72`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:296–302`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm:389–424`
- **What:** The Linux launcher adds an i6300esb watchdog on the stated assumption that systemd arms it, while the GENERIC_X64 manager configuration explicitly sets `RuntimeWatchdogSec=0`. The UTM builder also makes no corresponding watchdog request.
- **Failure scenario:** If the supplied manager override is effective, the watchdog remains unarmed and a guest stall does not exercise the claimed hardware-reset recovery. A UTM run cannot be assumed to test the same watchdog setup.
- **Evidence:** The launcher comment says “systemd arms it,” followed by `-device i6300esb`; the quirk writes `RuntimeWatchdogSec=0`. Refutation checked: no affirmative GENERIC_X64 arming policy or equivalent UTM device request appears in S1.
- **Fix:** Establish an intentional, effective watchdog policy and represent the device in the shared profile if parity is required. Prove arming and reset behavior on the resulting image and both supported launch paths.
- **Confidence:** medium — the configuration contradiction is explicit; final manager precedence and runtime arming are outside the packet.

### F-VM-19: Generic emulator defaults retain hardware-specific device selections
- **Severity:** Medium
- **Category:** Build/packaging
- **Where:**
  - `projects/ROCKNIX/packages/emulators/standalone/cemu-sa/config/GENERIC_X64/settings.xml:86–98`
  - `projects/ROCKNIX/packages/emulators/standalone/rpcs3-sa/config/GENERIC_X64/config.yml:@@ -0,0 +1,244 @@ (Video.Vulkan and Audio)`
  - `projects/ROCKNIX/packages/emulators/standalone/xemu-sa/config/GENERIC_X64/xemu.toml:6–7`
  - `projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json:40–48`
- **What:** Factory defaults pin particular physical-device audio sinks, an Adreno Vulkan adapter, and a controller GUID rather than portable generic selections. These choices do not establish usable defaults for the canonical Intel-HDA VM and its supplied input devices.
- **Failure scenario:** If the launchers preserve these selections and the emulator does not fall back, the VM requests a nonexistent audio endpoint or controller instead of its available device. The actual fallback behavior is outside the packet; runtime failure is not demonstrated.
- **Evidence:** Cemu selects `alsa_output.pci-0000_04_00.6.analog-stereo`; RPCS3 names `Turnip Adreno (TM) 650` and a platform `HiFi__Speaker__sink`; xemu pins `port1` to a literal GUID. Refutation checked: no shown launcher resolves or replaces these selections, but those consumers are not embedded.
- **Fix:** Use appropriate auto/default selections and verify the actual seeded configuration through the emulator launchers. Handle already-seeded configurations without overwriting genuine owner choices.
- **Confidence:** medium — the hardware-specific state is explicit; package selection, launch-time rewriting, and emulator fallback require additional evidence.

# Upstream fit

- **Separate the QA target from general x86 support claims.** The options explicitly describe a software-rendered VM QA target but also enable disk installation and ship a broad physical-hardware kernel configuration. An upstream submission needs a clear support boundary, including the x86-64-v3 CPU requirement and which emulator/rendering paths are actually supported.
- **Remove the accumulated service-fix experiments.** Opposing D-Bus dependencies, a fake hostnamed service, arbitrary service memory caps, overlapping journald configurations, and masked recovery targets are not a coherent platform policy. The comments’ diagnosis of a systemd/D-Bus incompatibility is not supported by a build configuration or runtime evidence in this packet.
- **Do not ship blanket security changes as “stability” tuning.** The attempted kernel fragment includes `mitigations=off`; the serial unit exposes an authentication-free root shell when enabled. Their presence needs an explicit QA-only boundary, not ordinary release defaults.
- **Normalize copied emulator configurations.** Besides the device selections in F-VM-19, the files retain Retroid and `rg552_joypad` references and device-specific tuning. Those are not credentials, but they are evidence that the proposed generic defaults need a deliberate portability review.
- **Consolidate packaging and retain upgrade ownership.** Use the prescribed project quirk tree, document execution timing, and inventory persistent files generated by earlier versions. Removing a quirk from an immutable image does not remove its previously generated `/storage` files.
- **Complete provenance and integration evidence.** The new serial service lacks the SPDX/copyright header used by the added scripts. The large generated kernel configuration needs its producing kernel/build context. No changed `package.mk` appears in this packet, so the package late-binding rule is not itself a finding against device `options`.
- **Limit commit-hygiene conclusions to the evidence.** The diff exposes overlapping implementations worth consolidating, but it does not contain commit messages or authorship history. Those cannot be assessed here.

# Coverage boundary

The following gaps are surfaced to the orchestrator; none should be interpreted as a pass:

1. **Quirk installation and execution:** The owning recipe, runner, precedence between the two trees, execution versus sourcing, service enablement, and invocation timing are not embedded. In particular, F-VM-04, F-VM-05, and F-VM-18 identify defects in supplied definitions, not an observed boot failure.
2. **Effective image configuration:** Base systemd units, systemd version, additional drop-ins, writable filesystem mappings, profile initialization, and initial RetroArch configuration are outside the packet. Comments about what an image “ships” are not substitutes for those artifacts.
3. **Bootloader correctness beyond the shown updater:** The producer and installer of `ldlinux.sys`, generated GRUB/syslinux configurations, actual partition layout, and updater caller are absent. This packet cannot establish whether copying the supplied BIOS files is a valid installation operation or whether generated configurations retain device identifiers.
4. **Upgrade evidence:** This is a diff against the upstream merge base, not the previous installed fork release. Previous images, inherited-state inventories, and clean-install/upgrade rehearsal outputs are absent. S3 names `tools/vm-qa` and `tools/vm-upgrade-rehearsal`, but their implementations and results were not embedded.
5. **Graphics, emulators, and host compatibility:** Mesa/Vulkan packaging, emulator launch-time configuration rewriting, referenced InputPlumber targets, QEMU/OVMF versions, and UTM runtime behavior require additional sources or execution. The performance numbers in launcher comments are not independently verified test evidence.
6. **Repository-wide conformance:** Only the three supplied standards documents were available. The matching instruction inventory, blindspot register, and additional VM-testing rules referenced by S3 were not embedded. Full project-conformance sign-off is therefore incomplete.

Priority verification is: non-destructive launcher path handling; bootloader failure injection; persisted-storage resolution changes; validation of emitted systemd units; self-contained and concurrent UTM packaging; and cloud setup after changing an existing UTM bundle’s network mode. Guest-side shell behavior must be checked with the image’s tools, as S3 requires.

## `corpus.provenance.json`

The following is the payload for the orchestrator to record; no filesystem artifact was written by this auditor. Array entries correspond in order to S1, S2, S3, and S4.

```json
{
  "seat": "7-generic-x64-vm",
  "read_basis": "Embedded source text supplied in the prompt",
  "filesystem_access": false,
  "independent_file_reads": false,
  "independent_hash_computation": false,
  "hash_verification": "sha256 values verified at embed time by the Council Facilitator; recorded here without recomputation",
  "facilitator_manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "source_aliases": [
    "S1",
    "S2",
    "S3",
    "S4"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/7-generic-x64-vm.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/packaging-and-patches.md"
  ],
  "source_file_hashes": [
    "5288072065091b6e4505bfef50dbb2e34ec851ef845a43bb9ab94f39638dd32c",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746"
  ],
  "runtime_tests_performed": [],
  "missing_sources": [
    {
      "description": "Quirk owning recipe, runner, precedence, execution timing, and service-enable integration were not embedded.",
      "path": null,
      "sha256": null
    },
    {
      "description": "Effective image filesystem mappings, base systemd units and version, additional overrides, and initial configuration artifacts were not embedded.",
      "path": null,
      "sha256": null
    },
    {
      "description": "Bootloader production and installation code, generated boot configurations, and updater caller were not embedded.",
      "path": null,
      "sha256": null
    },
    {
      "description": "Previous release images, inherited-state inventories, and clean-install or upgrade rehearsal evidence were not embedded.",
      "path": null,
      "sha256": null
    },
    {
      "description": "Graphics and emulator packaging, configuration consumers, referenced controller targets, and QEMU/OVMF/UTM runtime evidence were not embedded.",
      "path": null,
      "sha256": null
    },
    {
      "description": "Repository-wide matching instructions, blindspot register, and additional VM-testing rules referenced by the supplied standards were not embedded.",
      "path": null,
      "sha256": null
    }
  ],
  "gap_status": "Surfaced to the orchestrator in Coverage boundary; no missing paths, hashes, or contents inferred."
}
```
# Stream F1 report: GENERIC_X64, the QA device (audit #307 / #308)

Branch `feature/pl-f1` in `/workspace/repos/rocknix.worktrees/pl-f1`, cut from `next` at `417dcd8610`. Nothing was pushed, built, booted or run on a guest.

```
$ git log --oneline 417dcd8610..HEAD
6d036d2239 GENERIC_X64: options say what the device builds
ff46b38037 GENERIC_X64: 095-cloud-ssh keeps a command written by hand
a5a03bd9fa GENERIC_X64: RetroArch's surface follows the guest's mode, on gl
63e00689c8 generic-x64-vm: check what a launch and a UTM bundle are given
d3912bdcb9 generic-x64-vm: qemu-args prints and touches nothing
ce355c2a73 GENERIC_X64: remove the bootloader updater that copies nothing
08fdaffe55 GENERIC_X64: start the serial root shell only on a virtual machine
24ceb9e15a quirks: retire the GENERIC_X64 quirks that write into the image
b19fb29733 quirks: remove the GENERIC_X64 quirk tree nothing installs
```

Every commit has the `Co-Authored-By: Claude Opus 5.5` trailer (9 of 9), a `package: text` title of 72 characters or fewer (checked against the CI regex), the item IDs, the test case, and an `Already written:` line.

## Harness

- `tools/last-good-scripts-test` (the whole file, on the branch head): **`PASSED`, rc 0, 428 PASS lines**. The baseline on `417dcd8610` was `PASSED` with 386; F1 adds 42. Logs are in `/workspace/tmp/rocknix-session/streams/F1/full.log` and `baseline.log`.
- `BASE_REF=417dcd8610 tools/last-good-scripts-test --old`: **`26 CHECK(S) FAILED`, and all 26 are inside the F1 block**. No check before the block fails. Log: `old-base.log`.
- F1's cases sit in one block at the end of the file, headed `# ---- audit #307, stream F1 ----`, just before the summary line. There are eight sections, F1a to F1h. Each script runs as the image runs it: under bash (the image's `/bin/sh`), with the image's busybox for sed, tr, head and the other applets, inside bwrap. The fixture `/etc` is built from the links the systemd and kmod recipes make into `/storage`, and `/usr` is read-only, as it is on a guest.
- Not caused by F1: a plain `tools/last-good-scripts-test --old`, with the default `BASE_REF=1d1503180d`, exits 2 at section s (`cannot read .../rocknix-evidence at 1d1503180d`). That happens before the F1 block is reached. F1's own cases tolerate files that did not exist yet at an older `BASE_REF`.

## Punch items

### PL-019: quirk scripts write to a read-only `/etc` (resolved, `24ceb9e15a`)

**Fix**
- Removed all twelve scripts: QEMU device quirks 091 to 101 (including `092-vm-service-fixes`) and the platform quirk `097-disable-rescue-completely`. That second one had to go too, because its `/lib` writes and masks also break the acceptance.
- `001-device_config` stays.
- None of the removed scripts' `/storage` writes is proven to be needed. The first full boot of a fresh guest, which is the boot every vm-qa run uses, happens before those files exist.

**Test F1a** (one boot's quirk pass, run the way autostart runs it)
- FAIL on `417dcd8610`:
  - `the quirk pass writes into the read-only image: 51 'Read-only file system' lines`
  - `the pass says 110 line(s) on the journal`
  - `the pass leaves /storage files that change later boots: ./.config/modules-load.d/x64-virtual-modules.conf ./.config/sysctl.d/10-generic-x64.conf ./.config/system.d/emergency.service ...`
- PASS now: 0 `Read-only file system` lines, nothing on the journal, and no boot-changing file left behind.

**Already written: migrated**
- On a guest, the removed scripts had written 20 files into `/storage`: 3 `tmpfiles.d` rules (including PL-042's), a `sysctl.d` file, a `modules-load.d` list, a `.conf` in `udev.rules.d`, 9 drop-ins under `/storage/.config/systemd/system`, a `profile.d` file, and 4 masks in `/storage/.config/system.d`.
- Two new quirks remove them by name:
  - `devices/QEMU Standard PC (Q35 + ICH9, 2009)/091-retired-vm-fixes`
  - `platforms/GENERIC_X64/097-retired-rescue-masks`, which removes a mask only when it is a link to `/dev/null`.
- **Test F1b** builds its fixture by running the pre-fix pass from `417dcd8610` on a fresh `/storage`, next to files that belong to the owner.
  - FAIL on `417dcd8610`: `still on /storage after a boot: ./.config/modules-load.d/x64-virtual-modules.conf ./.config/profile.d/091-generic-x64-services ...`
  - PASS now: all 20 files are removed, the owner's files and the owner's own mask stay, and a second boot changes nothing.
- `tools/vm-upgrade-rehearsal` now seeds four of those files and the emergency mask, then checks after the update that they are gone and the owner's file is kept. Syntax-checked with `bash -n`; **not run**.

**Integrator must prove**
- On the new image: `journalctl -b | grep -c 'Read-only file system'` reads 0, and vm-qa passes every suite.
- Also watch this: `emergency.target` can be reached again. That is every other ROCKNIX device's behaviour, but a guest whose local filesystems fail will now stop instead of carrying on.

### PL-022: orphan quirk tree (resolved, `b19fb29733`)

- `git rm -r packages/hardware/quirks/platforms/GENERIC_X64`. That was all `packages/hardware/` held.
- **Test F1c:**
  - FAIL on `417dcd8610`: `a quirk tree no recipe installs: 7 file(s)`
  - PASS now.
- `tools/pkgcheck quirks`: rc 0, no FAIL or WARN lines.
- **Already written:** nothing is inherited, because no build ever installed this tree.
- **Integrator:** the guest's installed quirk set is unchanged by this commit. The only changes to it come from PL-019 and the two retired-file quirks.

### PL-023: root shell on ttyS0 (resolved, `08fdaffe55`)

- Added `ConditionVirtualization=vm` to the unit. It has no `|`, so it must hold in addition to one of the `|console=ttyS0` conditions.
- Added an SPDX header and a D-QA-053 header explaining why the unit is there.
- Found and fixed on the way: `IgnoreOnIsolate=yes` sat under `[Service]`, where systemd ignores it. The host's `systemd-analyze verify` reported `Unknown key 'IgnoreOnIsolate' in section [Service]`. It is now under `[Unit]`, and verify reports nothing for the unit.
- **Test F1d:**
  - FAIL on `417dcd8610`: `serial-debug-shell.service has no plain ConditionVirtualization=vm`, plus the header and `IgnoreOnIsolate` checks.
  - PASS now.
- The register row the item asks for already exists: **D-QA-053**.
- **Already written:** nothing is inherited. The unit and its enabling link live in the image.
- **Integrator:** check that `systemctl show serial-debug-shell.service -p ConditionResult` reads `yes` on a guest.

### PL-033: `qemu-args` unlinks sockets (resolved, `d3912bdcb9`)

- `qemu_command()` now only reads and checks. A new `prepare_run()`, called only by `run` just before `execv`, does two things:
  - clears the socket paths, but removes only an actual socket;
  - makes the vars store from its template.
- A disk or other file passed as `--monitor` is now refused, not deleted.
- **Test F1f:** the launcher runs in bwrap with its own `/tmp`, and QEMU is a shim that only records the command it was given.
  - FAIL on `417dcd8610`: `qemu-args (rc 0): monitor socket REMOVED, serial socket REMOVED, vars file CREATED` and `run --monitor <a qcow2> (rc 0): the file DELETED, QEMU started`
  - PASS now. `run` still clears stale sockets and makes the vars file; that check passes on both trees.
- **Already written:** nothing is inherited; the launcher keeps no state.

### PL-034: generated RetroArch dimensions become the player's (resolved, `a5a03bd9fa`)

- **Implemented differently from the item's text.** The item asked for "a per-device overlay the launcher reads". None exists: runemu passes `--config retroarch.cfg --appendconfig /tmp/.retroarch.cfg`, and setsettings rebuilds that append file on every launch. Both files are stream B's.
- I used the seats' own verdict instead: mark the generated values so a later boot can tell them apart from a player's.
  - The quirk writes a record, `.fullscreen-surface`, next to the cfg.
  - It follows the guest's mode only while the values are its own: the shipped values, the recorded values, or an earlier build's unrecorded write (the guest's current mode, or QEMU's 1280x800).
  - Any other value is left alone.
- **Test F1g:**
  - FAIL on `417dcd8610`: `1280x800 boot: 1280x800; the same guest at 640x480: 1280x800`, and `the earlier builds' 1280x800 stayed 1280x800 at 640x480`
  - PASS now. A 1024x768 set by hand is kept at both modes, and a second boot changes no byte.
- **Already written: migrated.** Unrecorded values from an earlier build are recognised and follow the mode from the next boot.
- `tools/vm-upgrade-rehearsal` seeds a hand-set 1024x768 and checks it survives the update. **Not run.**
- **Integrator:**
  - On a kept guest re-run at `--res 640x480`, check that `video_fullscreen_x/y` follow the mode.
  - Run the rehearsal and check its new lines.

### PL-042: tmpfiles rules put regular files at socket paths (resolved in `24ceb9e15a`)

- These rules came from 098 and 099 and went through `/etc/tmpfiles.d`, which is a link into `/storage`, so they were active on every later boot.
- The scripts are removed, and 091-retired-vm-fixes removes the rules already written.

### PL-073: bootloader updater copies nothing (resolved, `ce355c2a73`)

- `update.sh` is deleted. The SYSTEM squashfs at `7911c53bb4` holds `usr/share/bootloader/update.sh` and nothing else (checked with `unsquashfs -l`).
- Nothing else depends on it:
  - init skips a missing updater and writes `/storage/.boot.hint` itself;
  - the installer's x86_64 path runs `syslinux -i`;
  - `find_file_path` finds no other `update.sh` for this device.
- **Test F1e:**
  - FAIL on `417dcd8610`: `the bootloader updater copied nothing to /flash (the image ships it alone in /usr/share/bootloader) and wrote 'UPDATE' to the boot hint all the same`
  - PASS now, including the check that init still writes the hint.
- **Already written:** nothing is inherited.
- **Integrator:** the rocknix package's stamp does not hash `devices/GENERIC_X64/bootloader`. A warm build root keeps the old copy unless rocknix rebuilds. Stream B's edits under `projects/ROCKNIX/packages/rocknix` will trigger that; otherwise run `scripts/clean rocknix`. Then check that `unsquashfs -l SYSTEM` has no `usr/share/bootloader/update.sh`.

## Sweep rows (#308), 29 of 29

| packet / seat / id | outcome |
| --- | --- |
| 6 claude F-RW-04 | **Withdrawn.** 640x480 is deliberate (#263, D-QA-042). The ARM leftovers (armhf buildbot URL, `pcsx_rearmed_neon_*`, `emuelec_exit_to_kodi`) are in all 15 device profiles, upstream's AMD64 included, so they are upstream's convention. The core updater is hidden (`menu_show_core_updater = "false"`). The upstream-fit point does not apply: D-QA-053 keeps GENERIC_X64 out of the PR series. The one default only GENERIC_X64 had wrong, `video_driver = "vulkan"`, is fixed under F-VM-11. |
| 7 claude F-VM-05 | **Fixed** `ff46b38037` (test F1h; FAIL on the old tree: `the hand-written 'ssh -p 2222 root@192.168.64.5' became 'ssh -L ... -p 10022 root@127.0.0.1' with the port and '(no file)' without`) |
| 7 claude F-VM-06 | Duplicate of PL-033, `d3912bdcb9` |
| 7 claude F-VM-07 | **Fixed** `24ceb9e15a` (script removed; masks already written are removed by 097-retired-rescue-masks) |
| 7 claude F-VM-08 | **Partly refuted, partly open.** Cemu, RPCS3, xemu, Dolphin and Supermodel are not in the GENERIC_X64 SYSTEM (`7911c53bb4`), so no guest reads those configs. Installed and outside F1's list: `mupen64plus-sa-core/config/GENERIC_X64/mupen64plus.cfg`, which carries `name = "rg552_joypad"` (line 175) and a pasted Retroid block (lines 189-213), and the Anbernic-named m8c INIs, which are inert on a VM. My list names only the RetroArch profile, and F2 disclaims GENERIC_X64. **Needs an owner.** |
| 7 claude F-VM-10 | **Fixed** `a5a03bd9fa` (F1g; FAIL on the old tree: `with a disconnected DP-1 before the connected output: 1920x1080`, `1920x1080i gave 1920x1080i`) |
| 7 claude F-VM-11 | **Fixed in part.** RetroArch's profile now ships `gl`, and a cfg still naming `vulkan` is moved to `gl` when the image has no Vulkan driver (`a5a03bd9fa`; FAIL on the old tree: `no ICD: video_driver = "vulkan"`). The options comment is corrected (`6d036d2239`; the SYSTEM has libvulkan and no ICD). The Dolphin, xemu and Cemu Vulkan defaults are refuted for this image: none of the three is in the SYSTEM. |
| 7 claude F-VM-12 | **Fixed** `6d036d2239` (comments only, no test possible) |
| 7 claude F-VM-13 | **Withdrawn.** 8 of the 10 kernel config lines match upstream AMD64's config exactly. `X86_DEBUG_FPU` and `PM_TEST_SUSPEND` are debug options on a developer tool (D-QA-053). The `root=` and `init=` in `CONFIG_CMDLINE` are ignored: init's argument parser (busybox `init:1169-1200`) has no case for either, and every guest boots. |
| 7 claude F-VM-14 | **Fixed in part:** only-a-socket removal (`d3912bdcb9`); the `--ssh-port` range check and paired OVMF files (`63e00689c8`). **Withdrawn:** the `/tmp` default paths (vm-serial, vm-pair, vm-visual-qa, cloud-round-trip and the rule all name them; single-user host; a start now refuses anything there that is not a socket). **Withdrawn:** `svc_bind` (`extra_forwards` has been `[]` since `8aff89df53`; the 0.0.0.0 bind was deliberate, `7cacffe063`). |
| 7 claude F-VM-15 | **Fixed in part:** the unit's header (`08fdaffe55`); the files with 2024 headers are removed (`b19fb29733`, `24ceb9e15a`). **Withdrawn:** `video_sense` lives under `system-utils`, not in F1's list. Fork issue references and years are fork-only text; GENERIC_X64 stays out of the PR series (D-QA-053, #256). |
| 7 claude F-VM-16 | **Partly refuted, partly open.** RPCS3 and Supermodel are not in the SYSTEM. Installed and outside F1's list: `flycast-sa/config/GENERIC_X64/emu.cfg` (lines 21-23: `fullscreen = yes`, 1920x1080) and `mupen64plus.cfg` `[Video-General]` (1280x960, `Fullscreen = True`). **Needs an owner.** |
| 9 claude F-EM-14 | **Withdrawn.** The shared recipes (mupen64plus-lr, GLideN64, ppsspp-sa) are stream F2's files. The upstream-fit question belongs to #256: D-QA-053 keeps GENERIC_X64 out of the PR series. |
| 10 gpt F-PB-14 | **Fixed** `24ceb9e15a` (script removed; the `.conf` it left in `udev.rules.d` is removed by name) |
| 10 gpt F-PB-22 | **Fixed** `24ceb9e15a` (never written, because `/etc` is read-only; script removed) |
| 10 gpt F-PB-25 | **Withdrawn.** `projects/ROCKNIX/packages/virtual/emulators/package.mk` is stream F2's file. |
| 7 gpt F-VM-06 | Duplicate of PL-022, `b19fb29733` |
| 7 gpt F-VM-07 | **Fixed** `24ceb9e15a` |
| 7 gpt F-VM-08 | **Fixed by removal:** the orphan copy in `b19fb29733`, the installed copy in `24ceb9e15a` |
| 7 gpt F-VM-09 | **Fixed** `a5a03bd9fa` (uses the connected output's preferred mode). The "configured mode" part is refuted: sway has not started when the quirk runs, so no configured mode exists yet. |
| 7 gpt F-VM-10 | **Fixed** `ff46b38037` |
| 7 gpt F-VM-11 | **Fixed** `63e00689c8` (FAIL on the old tree: `overlay rc 0, bundle MADE; data-file rc 0, bundle MADE`) |
| 7 gpt F-VM-12 | **Fixed** `63e00689c8` (FAIL on the old tree: `<output>.tmp: 'GONE'`) |
| 7 gpt F-VM-13 | **Fixed** `63e00689c8` (commas doubled; the FAIL showed a bare `a,b` in the option strings) |
| 7 gpt F-VM-14 | **Fixed** `63e00689c8` (FAIL on the old tree: `aarch64 with /dev/kvm: accel=kvm`) |
| 7 gpt F-VM-15 | **Fixed** `63e00689c8` (FAIL on the old tree: `a 1 GiB disk (rc 0)` printed a command) |
| 7 gpt F-VM-16 | **Fixed in the READMEs** `ff46b38037`. The guest cannot see UTM's network mode, so the vm README and the bundle's quick start now say to remove the two `-fw_cfg` entries when switching mode. A command written by hand now survives boots. |
| 7 gpt F-VM-17 | Duplicate of PL-023, `08fdaffe55` |
| 7 gpt F-VM-19 | **Refuted for the image.** Cemu, RPCS3 and xemu are not in the GENERIC_X64 SYSTEM (`7911c53bb4`: no binary, no config). The files are also outside F1's list. |

## What I could not do, and decisions I made

- **Nothing was run on a VM.** PL-019's journal count, vm-qa, PL-023's `ConditionResult`, PL-034 on a guest, and the two new `tools/vm-upgrade-rehearsal` blocks are all the integrator's. The rehearsal edits are checked with `bash -n` only.
- **I ran `generic-x64-vm`'s print and bundle verbs**, which the brief lists under "do not run". I did it only inside the harness, in bwrap with a private `/tmp`, with QEMU replaced by a shim that records the command it is given. No guest could be reached and no VM was started. Running them was the only way to watch PL-033 fail against the real file.
- **I edited `tools/vm-upgrade-rehearsal`.** PL-034's acceptance names it, and D-WORKFLOW-050 says a "migrated" answer must add its seed there. I added PL-019's seed on the same basis.
- **Two rows keep open parts that need an owner:** claude F-VM-08 and F-VM-16. They sit in three installed files: the `config/GENERIC_X64` files of mupen64plus-sa, flycast-sa and m8c (the m8c ones are inert on a VM). These are outside F1's list and F2 disclaims them. The exact lines are in the table above.
- **Stale comments for the integrator's sweep (audit #258 P-01).** `tools/time-to-play:1057` and `tools/ra-offline-test:280` still say the image ships `video_driver = "vulkan"`. That is history now, and neither file is F1's.
- **Rebuild costs for the integrator.** The change under `retroarch/sources/GENERIC_X64` rebuilds RetroArch. The quirks package rebuilds on its own. The options comment change rebuilds nothing, because device options are not hashed into package stamps.

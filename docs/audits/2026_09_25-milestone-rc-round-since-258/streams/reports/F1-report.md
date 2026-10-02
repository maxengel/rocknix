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

## Follow-up (after the merge at f0f263b8cc): the orphaned configs, PL-076 and the stale comments

Three more commits on `feature/pl-f1`, on top of `6d036d2239`:
```
85e4856b7e tools: say the GENERIC_X64 profile ships gl now
9fd73da845 retroarch: drop the x64 profile's dead armhf core-updater URL
7c8ba04368 GENERIC_X64: emulator configs name no handheld's hardware
```

**Harness:** `tools/last-good-scripts-test` on the branch head reads `PASSED`, rc 0, with 432 PASS lines (4 new). `BASE_REF=417dcd8610 ... --old` reads `30 CHECK(S) FAILED`, all of them inside the F1 block. The new checks are F1i (the three configs) and F1j (PL-076).

- **mupen64plus.cfg, claude F-VM-08: fixed in `7c8ba04368`.**
  - My edit **starts from stream F2's `f72a5d1fdf` on `feature/pl-f2`** (`git show feature/pl-f2:<path>`), which moved Control1's mappings back into their section. My only change is the one line `name = "rg552_joypad"` becoming `name = ""`, so the two branches merge without a conflict.
  - Why `""` is correct: the section is mode 2 (fully automatic). The pinned input-sdl source compares the stored name only in mode 1 (`src/config.c:438-439`), and writes `""` itself when it finds no pad (`:713`).
  - FAIL before: `mupen64plus's Control1: name = "rg552_joypad"`. PASS after.
- **mupen64plus.cfg, claude F-VM-16: withdrawn.** `start_mupen64plus.sh` passes `--set Video-General[ScreenWidth/ScreenHeight]` from `fbwidth`/`fbheight` on every launch (lines 94-110), so the stored 1280x960 is never used.
- **flycast emu.cfg, claude F-VM-16: fixed in `7c8ba04368`.**
  - `width = 1920` and `height = 1080` are removed; `fullscreen = yes` stays.
  - The numbers never sized the fullscreen window. This build has USE_GLES off (per the build root's CMakeCache), so fullscreen is `SDL_WINDOW_FULLSCREEN_DESKTOP` (`core/sdl/sdl.cpp:836`), which takes the output's size.
  - FAIL before: `flycast's [window]: height = 1080 width = 1920`. PASS after.
- **m8c, claude F-VM-08: the finding's lines are real, and the files were dead. Fixed in `7c8ba04368`.**
  - `M8C.sh` picks `/usr/config/m8c/${QUIRK_DEVICE}.ini`, and no x86_64 machine reports an Anbernic model, so the three Anbernic INIs (one file and two links) are removed. `config.ini` stays.
  - FAIL before: `m8c's GENERIC_X64 config: Anbernic RG CubeXX.ini|Anbernic RG34XX.ini|Anbernic RG40XX H.ini|config.ini|`. PASS after.
- **Already written for the three configs: nothing to migrate.** A guest may hold a copy of each under `/storage`:
  - `/storage/.config/mupen64plus/mupen64plus.cfg` (copied once, when absent). Its stored name is ignored in mode 2, and the plugin rewrites it.
  - `/storage/.config/flycast/emu.cfg` (copied once, with the folder). Flycast rewrites `[window]` from its own state on every exit (`sdl.cpp:993-998`).
  - `/storage/.local/share/m8c/config.ini`. On an x86_64 machine it was always the shipped `config.ini`.
- `tools/pkgcheck` returned rc 0 for mupen64plus-sa-core, flycast-sa and m8c.
- **With this, the open parts of claude F-VM-08 and F-VM-16 are closed.** F-VM-08 is fixed (mupen64plus name, m8c); the rest of it is refuted, because Cemu, RPCS3, xemu, Dolphin and Supermodel are not in the SYSTEM. F-VM-16 is fixed (flycast), withdrawn for the mupen64plus video values (the launcher overrides them), and refuted for RPCS3 and Supermodel.
- **PL-076: resolved in `9fd73da845`.**
  - The line `core_updater_buildbot_url = "...armhf/latest/"` is deleted. The build root's RetroArch reads only `core_updater_buildbot_cores_url` (`""` here) and `core_updater_buildbot_assets_url` (`configuration.c:1683-1684`).
  - FAIL before: `the GENERIC_X64 profile still carries core_updater_buildbot_url = ...`. PASS after.
  - `tools/pkgcheck retroarch`: rc 0.
  - Already written: nothing on a device changes. A guest's copy of `retroarch.cfg` is not rewritten, and RetroArch ignores the key there too.
  - This supersedes the buildbot part of my F-RW-04 withdrawal for GENERIC_X64. The other 14 device profiles are unchanged.
- **Stale comments: fixed in `85e4856b7e`, comments only.**
  - `tools/ra-offline-test` (the old line 280) and `tools/time-to-play` (the old line 1057) now say that the profile ships gl since `a5a03bd9fa`, that `092-retroarch-surface` moves a cfg still on vulkan to gl while the image has no Vulkan driver, and why the swap stays.
  - Checks: `bash -n` on ra-offline-test and a Python parse of time-to-play both pass. I removed the `__pycache__` that a `py_compile` left behind.
  - Other lines that say "the QEMU guest has no Vulkan" (`time-to-play:1001`, `emulator-exit-test:33`) are still true and were left alone.

Nothing was pushed, and no guest was run.

## Follow-up 2: the audit of the fixes (`docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1-gpt.md` and `F1-claude.md`)

Four more commits on `feature/pl-f1`, on top of `85e4856b7e`:
```
4e0078cc44 GENERIC_X64: 095-cloud-ssh records first and takes no guessed command
afe32f0afd GENERIC_X64: 092-retroarch-surface records before it writes
9f2ed34919 generic-x64-vm: refuse a linked socket and a foreign vars store
16ae2219ca quirks: the GENERIC_X64 take-backs remove exact names, once
```

**Test results**
- `tools/last-good-scripts-test` on the branch head: **`PASSED`, rc 0, 447 PASS lines** (432 before this follow-up; 15 new or revised checks).
- `BASE_REF=417dcd8610 ... --old`: `38 CHECK(S) FAILED`, all of them inside the F1 block (0 before it).
- Each fix below was written test-first. The "before" lines were seen on the branch before its commit.

The two seats number their findings independently. **gpt** refers to `F1-gpt.md` and **claude** to `F1-claude.md`.

### GPT seat

- **G-F1-01 (fixed, `9f2ed34919`): a `--monitor` symlink led to another guest's socket being removed.**
  - Cause: the socket paths were resolved before the symlink check, so the check never saw the link.
  - Fix: they are now made absolute without being resolved, and a symlink at a socket path is refused.
  - Before: `run --monitor <a link to another socket> (rc 0): the other guest's socket REMOVED, QEMU started`. After: PASS.
- **G-F1-02 (fixed with an explicit rule, `afe32f0afd`): RetroArch values without a record were attributed wrongly.**
  - Values with no record are now taken only when they are exactly the size this boot writes. Anything else is left, because an earlier build's write cannot be told apart from a hand-set pair; setting both values to 0 hands them back.
  - Before: `an unrecorded 1280x800 became 640x480 at 640x480`. After: left, and an unrecorded 1280x800 met at a 1280x800 boot is taken and then follows the mode.
  - **Part (a), decided the other way on purpose:** the shipped 640x480 and 0x0 keep following even when a record exists. That is exactly what the cfg looks like after RESET RETROARCH CONFIG TO DEFAULT: `factoryreset:75` replaces `retroarch.cfg` and leaves the record next to it. Either value on another mode is the #263 scaling the quirk exists to end. A test case documents this.
- **G-F1-03 (fixed, `4e0078cc44`): a tester's own loopback SSH command was overwritten or deleted.**
  - With no record, the file is now taken only when it is exactly the command this boot writes.
  - Before: `the tester's '-p 2222 root@127.0.0.1' became '...-p 10022...' with port 10022 and '(no file)' without`. After: PASS.
  - Stated cost: an earlier build's unrecorded command, met on a different port or with no port at all, is left in place.
- **G-F1-04 (fixed, `afe32f0afd` and `4e0078cc44`): a boot cut short between two writes stopped the automatic following for good.**
  - Both quirks now record the old value and the new one before changing the file, read the change back, and only then record the new value alone.
  - Proven by shims that kill the quirk right after the file is written.
  - Before, surface: `killed after the cfg write: 1024x768; the next boot at 1280x800: 1024x768`. Before, SSH: `the next boot with no port: '...-p 10023...'`. After: PASS for both.
  - A record in its first format (from `a5a03bd9fa`) is still read.
- **G-F1-05 (fixed, `9f2ed34919`): an existing vars store from another firmware build was used as it was.**
  - A vars store whose size differs from its template's is now refused, named, and kept; the error says to move it aside so the next start makes a new one. A store that matches is kept, since it holds the guest's UEFI settings.
  - Before: `a 128 KiB store with a 528 KiB template: rc 0`. After: PASS.
- **G-F1-06 (fixed, `9f2ed34919`): the UTM bundle ignored the caller's umask.**
  - It now gets mode `0666 & ~umask`.
  - Before: `under umask 077 (rc 0): mode 644`. After: 600.
- **G-F1-07 (fixed, `4e0078cc44`): a six-digit fw_cfg port was cut to five digits.**
  - A port is now 1 to 5 digits within 1-65535; anything else counts as no port.
  - Before: `fw_cfg 100000 gave: ssh -L ... -p 10000 ...`. After: PASS.
- **G-F1-08 (fixed, `9f2ed34919`): the "no leftover temporary" check could never fail.**
  - The check now lists with `ls -A` and a pattern that starts with the dot. A planted `.partial` file shows the check can fail.
  - A new case makes the archive write fail (the quick-start file is missing) and checks that nothing is published or left behind.
- **G-F1-09 (fixed, `16ae2219ca`): the take-back removed paths no retired script ever wrote.**
  - It now removes exactly the 16 paths the retired scripts wrote, where it used to try 3 names in each of 6 drop-in directories.
  - Before: `an owner's file was taken: ... weston.service.d: No such file or directory`. After: the owner's `weston.service.d/10-generic-x64.conf` stays.
- The seat's "not embedded" notes are the coordinator's and need no action here.

### Claude seat

- **G-F1-01 (withdrawn): "the follow-up claims are not in the packet".** The packet was cut before the follow-up landed. The commits are on the branch: `git show --stat 7c8ba04368` lists the three removed m8c files, `flycast-sa/.../emu.cfg` and `mupen64plus.cfg`. F1i and F1j are in the F1 block and pass in the 447.
- **G-F1-02 (withdrawn): "fixes reach past the stream's declared ownership".**
  - The emulator configs and the two tool comments were assigned to F1 by the coordinator's follow-up message.
  - The VirtualBox `091-vbox-graphics` deletion is not F1's: it is `bccbf54cd4` on `feature/pl-f2`, and `git merge-base --is-ancestor bccbf54cd4 feature/pl-f1` is false. The packet's diff range picked it up from `next`.
  - The mupen64plus merge risk is covered: my edit started from F2's `f72a5d1fdf` and changes one line.
- **G-F1-03 (surface ownership, parts a-e):**
  - (a) Decided as above: shipped values follow even when a record exists, stated in the script.
  - (b) and (c) Fixed: values with no record are taken only when they equal this boot's size.
  - (d) Fixed: the ICD probe also reads `/usr/local/share/vulkan/icd.d` and root's own loader directories under `/storage`. Before: `with an ICD in root's own loader directory: video_driver = "gl"`. The vulkan-to-gl rewrite still runs every boot, because vulkan cannot draw without an ICD.
  - (e) Left as designed: a restored cfg from before the record existed stays as somebody's.
- **G-F1-04: fixed**, the same finding as gpt G-F1-08.
- **G-F1-05 (fixed, `16ae2219ca`): the take-back ran every boot, forever.**
  - Each take-back now runs until its files are gone, says on the journal what it removed, and then stops for good (a stamp under `/storage/.cache`).
  - Before: `the owner's emergency.target mask was removed by a later boot` and `the take-back boot's journal: ''`. After: PASS.
  - Stated gap: a downgrade to a build with the old quirks writes the files again, and after that they stay. Removing the stamp takes them back once more.
  - `tools/vm-upgrade-rehearsal`'s seed now also removes the stamps, so a rehearsal from an image that already has this fix still models a guest that ran the old quirks.
- **G-F1-06: fixed**, the same finding as gpt G-F1-07.
- **G-F1-07 (fixed, `16ae2219ca`): the second-boot check compared names, not bytes.** It now compares every file's bytes and every link's target, and the second boot must also say nothing on the journal.
- **G-F1-08 (withdrawn, with the decision stated): the UTM Bridged-mode fix is documentation only.**
  - The proposed mechanism would drop the loopback command when the guest's address is not on QEMU's user-network subnet (10.0.2.0/24).
  - That address does not exist when the quirk runs: autostart runs before the network is up. Waiting for it in the background would add machinery to the boot path.
  - The rule also depends on UTM's emulated mode handing out 10.0.2.x, which cannot be checked on this host (no UTM). If it doesn't, the shipped default mode breaks for every UTM tester.
  - The README note stays as the answer for a developer tool (D-QA-053). The integrator may overturn this.
- **G-F1-09 (fixed, `16ae2219ca`): the rehearsal's wait for autostart could run out silently.**
  - The line the wait looks for exists: `autostart:95` writes `Autostart complete...` to `/var/log/boot.log`.
  - A wait that runs out is now a FAIL of its own, before the take-back is read.
  - `bash -n` only; the rehearsal was not run.

### Already written, and what I could not do

- **Already written:**
  - Take-back: migrated, now exactly once per guest.
  - Surface and SSH records: read both formats. The record's first format is still read, and an earlier build's unrecorded value is taken only when it is this boot's own.
  - Launcher: no state on the host is inherited, and a mismatched vars store is left where it is, with the error.
- **Not done:** no guest was run and nothing was pushed. The rehearsal changes are syntax-checked only.

# Audit of the fix round — packet F1 (second seat)

Corpus: the ten sources embedded above, cited by path and the facilitator's sha256. `rclone-cloud-sync.md` was named in the brief and not embedded; F1 touches no cloud script, so no verdict below depends on it. Everything quoted is from `F1.diff` (sha256 `20dd8cac…`) unless another file is named. The diff carries no line numbers; I cite by file path, hunk header where one exists, and the quoted line.

---

## 1. Punch items (criterion: the acceptance text in `F1.items.md`)

### PL-019 — **holds in part** (the mechanism holds and the take-back is complete against the deleted writers; the guest half of the acceptance is not in the packet)

- **Deletions.** Twelve device scripts under `quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/` (091-systemd-fixes, 092-journald-config, 092-vm-service-fixes, 093, 094, 095, 096, 097-systemd-security-overrides, 098, 099, 100, 101) and the platform `097-disable-rescue-completely` — all `deleted file mode 100755`. No surviving quirk in the diff writes under `/etc` or `/usr`: `091-retired-vm-fixes` only `rm -f`/`rmdir`s under `C=/storage/.config` and writes `STAMP=/storage/.cache/retired-vm-fixes`; `097-retired-rescue-masks` the same under `/storage/.config/system.d` and `/storage/.cache`; `092-retroarch-surface` and `095-cloud-ssh` write under `/storage/.config`.
- **Take-back completeness (my cross-check, not the report's).** I read every write in the twelve deleted device scripts and matched those that reach `/storage` — directly, or through the four `/etc` links the harness fixture asserts (`tmpfiles.d`, `sysctl.d`, `udev/rules.d`, `modules-load.d`) — against the 16-entry `set --` list in `091-retired-vm-fixes`: 092-journald-config → `tmpfiles.d/10-generic-x64-journald.conf`; 098 → `tmpfiles.d/20-x64-fd-improvements.conf`; 099 → `tmpfiles.d/30-x64-mount-points.conf`; 095 → `sysctl.d/10-generic-x64.conf`; 101 → `modules-load.d/x64-virtual-modules.conf` and `udev.rules.d/90-x64-virtual-devices.conf`; 091-systemd-fixes → five drop-ins + `profile.d/091-generic-x64-services`; 092-vm-service-fixes → `smbd/nmbd .service.d/10-vm-config.conf`, `weston.service.d/10-vm-config.conf`, `dbus.service.d/20-vm-enhanced.conf`. All 16 present; the four masks are `097-retired-rescue-masks`'s. Every other destination (`/etc/systemd/system`, `/etc/systemd/journald.conf.d`, `/etc/systemd/system.conf.d`, `/etc/dbus-1/system.d`, `/etc/kernel`, `/usr/lib/...`) is read-only on the guest per the plan's guest-d evidence (`mkdir: can't create directory '/etc/systemd/journald.conf.d': Read-only file system`, `F1.plan.md` PL-019 details).
- **Harness.** F1a asserts `grep -c 'Read-only file system'` = 0, `[ ! -s a.journal ]`, and no new file under the listed boot-changing directories; the fixture's `/etc` is generated from the recipes' `ln -sf` lines (`sed -n 's#^ *ln -sf …'` on systemd's and kmod's `package.mk`) and asserts the four links exist, so a recipe change moves the fixture rather than silently passing. The report's before-lines (51 RO lines / 110 journal lines / leftover files) are consistent with the deleted scripts' content.
- **Not in the packet:** `journalctl -b | grep -c 'Read-only file system'` on a guest; vm-qa PASS. Also see Coverage: whether autostart's quirk pass runs on the first (resize) boot decides whether vm-qa's fresh guests ever booted *with* the `/storage`-side tmpfiles/sysctl/modules files — the report's "none of the removed scripts' `/storage` writes is proven to be needed" rests on that ordering.

### PL-022 — **holds** (by the diff; `pkgcheck` output not in the packet)
- Seven files under `packages/hardware/quirks/platforms/GENERIC_X64/` deleted. F1c lists the tree at `BASE_REF` under `--old` and `git ls-files`+`find` otherwise, filters `package.mk`, and fails on any residue unless a `package.mk` exists (i.e. the tree became a real recipe). No `package.mk` is in the diff, so `tools/pkgcheck quirks` is moot here; the report's "rc 0" is a claim.

### PL-023 — **holds in part**
- The unit gains `ConditionVirtualization=vm` (no `|`) beside the two kept `ConditionKernelCommandLine=|console=ttyS0…` lines — systemd's semantics (all non-triggering conditions AND at least one triggering condition) match the header's explanation. `IgnoreOnIsolate=yes` moves from `[Service]` to `[Unit]`, where systemd reads it. F1d uses `grep -qx` and an awk that prints the section of every occurrence (two occurrences would fail the `= "[Unit]"` test).
- Not in the packet: `ConditionResult=yes` on a guest; the D-QA-053 register row's text (the plan's title already cites D-QA-053 as an existing decision).

### PL-033 — **holds**
- `qemu_command()` is read-only: the old `serial.unlink(missing_ok=True)` and `monitor.unlink(missing_ok=True)` lines are removed from it (`generic-x64-vm @@ -157,9 +258,7 @@` and `@@ -199,7 +298,6 @@`); `prepare_run()` (claim sockets, copy vars) is called only in `main()`'s non-`qemu-args` branch immediately before `os.execv` (`@@ -626,12 +769,13 @@`). `claim_socket_path()` refuses a symlink (`S_ISLNK`) and anything not `S_ISSOCK`; `run_paths()` uses `os.path.abspath`, not `resolve()`, for the two socket paths. F1f binds real sockets and asserts they survive `qemu-args`; the report's before-line (`monitor socket REMOVED, serial socket REMOVED, vars file CREATED`) is what the old code did.

### PL-034 — **holds in part**
- Mechanism (a record beside the cfg, not the item's "per-device overlay"): `092-retroarch-surface @@ -13,18 +13,98 @@` — `RECORD=/storage/.config/retroarch/.fullscreen-surface`, the `OURS` chain (recorded / shipped 0|640 × 0|480 / no record and `SIZE = WANT`), `record "${SIZE}" "${WANT}"` *before* the `sed -i`, read-back, then `record "${WANT}"`. F1g covers mode change both ways, a hand-set 1024x768 kept, connector selection, the interlaced suffix, the unrecorded cases, the reset case, the kill-between-writes case, both record formats, and a no-change second boot. The rehearsal seeds a hand-set 1024x768 and asserts it survives.
- What is missing: (i) by design the branch `{ X = 0 || X = 640 } && { Y = 0 || Y = 480 }` claims those values even with a record present, so a player who hand-sets `640x480` or `0x0` on another mode is rewritten — "the player's cfg unchanged" is proven only for values outside that set; (ii) nothing ran on a guest and the rehearsal is syntax-checked only; (iii) the report's first PL-034 section says unrecorded values equal to "the guest's current mode, or QEMU's 1280x800" are taken — the diff's rule is narrower (`[ ! -f RECORD ] && [ SIZE = WANT ]`); the follow-up section describes what the diff does.

### PL-042 — **holds**
- 098 and 099 are deleted; the two rules already on guests (`tmpfiles.d/20-x64-fd-improvements.conf` with `f /run/dbus/system_bus_socket …`, `tmpfiles.d/30-x64-mount-points.conf` with `d /run/systemd/journal/socket …`) are named in the take-back list.

### PL-073 — **holds** (the acceptance's second branch)
- `devices/GENERIC_X64/bootloader/update.sh` deleted. The other behaviours of the deleted script (remount rw/ro, `sync`) were no-ops without files to copy; the UPDATE hint's continued writing rests on `busybox/scripts/init`, outside the diff — F1e greps it for `update_bootloader() {`, the `-f …/update.sh` guard, and `echo "UPDATE" >/storage/.boot.hint` on the line after the call. The report's integrator note (the rocknix stamp does not hash the bootloader directory) cannot be checked here.

### PL-076 — **holds**
- `-core_updater_buildbot_url = "http://buildbot.libretro.com/nightly/linux/armhf/latest/"` removed from `retroarch/sources/GENERIC_X64/retroarch.cfg`; F1j asserts its absence.

---

## 2. The first audit's findings (`F1.findings.md`) against the follow-up hunks

| seat / id | verdict | evidence in the diff |
|---|---|---|
| claude G-F1-01 | **withdrawal holds** (for this packet) | The follow-up commits are in this diff: the three m8c deletions, `flycast-sa/config/GENERIC_X64/emu.cfg` (`-height = 1080`, `-width = 1920`), `mupen64plus.cfg` (`name = ""`), the F1i/F1j harness sections. |
| claude G-F1-02 | **withdrawal holds as far as the packet shows** | No VirtualBox `091-vbox-graphics` hunk exists in this diff, consistent with "not F1's". The emulator-config and tool-comment edits *are* in the diff; the coordinator's assignment is outside the packet. The mupen64plus hunk from base shows the Retroid-block removal too, i.e. F2's change carried in F1's file copy — see Seams. |
| claude G-F1-03 (a–e) | **answered in part, by design** | (b),(c): `elif [ ! -f "${RECORD}" ] && [ "${SIZE}" = "${WANT}" ]` is the only no-record claim. (d): the ICD loop now reads `/usr/local/share/vulkan/icd.d`, `/storage/.local/share/vulkan/icd.d`, `/storage/.config/vulkan/icd.d`. (a) and (e) left as stated in the script's header comment. See G2-F1-02 for the probe's remaining gap. |
| claude G-F1-04 | **answered** | `f1_partials() { ls -A "${F1V}" \| grep -E "^\.${1//./\\.}\..*\.partial\$"; }`, proven able to see a planted `.probe.zip.leaked.partial`, plus the failed-write case (`vm-noreadme`). |
| claude G-F1-05 | **answered in part** | The stamp bounds it to once (`[ -e "${STAMP}" ] && exit 0` … stamp written only when none of the names remain). Attribution is still impossible for a mask that predates the new build; the script says so and speaks on the journal. Downgrade gap stated. |
| claude G-F1-06 | **answered** (residual: G2-F1-01) | `case "${#RAW}" in 1\|2\|3\|4\|5) [ "${RAW}" -ge 1 ] && [ "${RAW}" -le 65535 ] && PORT="${RAW}" ;; esac`. |
| claude G-F1-07 | **answered** | `f1_state` hashes every file and reads every link target; `cmp -s` plus `[ ! -s "${F1}/b.twice.journal" ]`. |
| claude G-F1-08 | **withdrawal cannot be refuted from the packet** | The reason (no guest address at quirk time; UTM's subnet unverifiable) is outside the diff. The rule the seat cited (`upgrade-and-install.md` § "A release note is never a mitigation") is written for players; this is a developer README under D-QA-053. The 095 fix does add a mechanism a tester can use (a hand-written command now survives). |
| claude G-F1-09 | **answered** (see G2-F1-03) | `check "autostart finished before the take-back is read …" "$AUTOSTARTED" "yes"` precedes the take-back read. |
| gpt G-F1-01 | **answered** | `run_paths()`: `Path(os.path.abspath(args.monitor))`, `Path(os.path.abspath(args.serial))`; `claim_socket_path()`: `os.lstat` → `stat.S_ISLNK` → `ValueError`. F1f's link case. |
| gpt G-F1-02 | **answered in part** (part (a) decided) | The `OURS` chain as above; (a) `640x480`/`0x0` follow even with a record — stated in the header comment and the report. |
| gpt G-F1-03 | **answered** | `ours()`: with a record, `grep -qxF -- "${LINE}" "${RECORD}"`; without, `[ "${LINE}" = "${CMD}" ]`. F1h cases `b`, `c`, `e`. |
| gpt G-F1-04 | **answered** | 092: `record "${SIZE}" "${WANT}" \|\| exit 0` before `sed -i`, read-back `[ "$(value …)x$(value …)" = "${WANT}" ] \|\| exit 0`, then `record "${WANT}"`. 095: `record "$(cat "${TARGET}")" "${CMD}" \|\| exit 0` before `echo … > "${TARGET}.new" && mv`. The `killsed`/`killmv` shims make the interruption real (they `kill -9 "${PPID}"` after the in-place write of exactly the target file). |
| gpt G-F1-05 | **answered** | `if vars_path.exists() and vars_path.stat().st_size != vars_template.stat().st_size: raise ValueError(...)` in `qemu_command`; F1f's 131072-vs-540672 case, matching store accepted. |
| gpt G-F1-06 | **answered** | `umask = os.umask(0); os.umask(umask); os.chmod(temporary_output, 0o666 & ~umask)`; F1f's umask-077 case expects 600. |
| gpt G-F1-07 | **answered** (residual: G2-F1-01) | As claude G-F1-06; F1h's `100000` case expects no file. |
| gpt G-F1-08 | **answered** | As claude G-F1-04. |
| gpt G-F1-09 | **answered** | Exactly 16 names in `set --`; `rmdir` (not `rm -r`) on the six drop-in directories; F1b's owner file `weston.service.d/10-generic-x64.conf` — a name no retired writer produced — must survive. |

---

## 3. Findings of my own

### G2-F1-01: `095-cloud-ssh` still normalises a non-digit fw_cfg value into a different port
- **Severity:** Low
- **Category:** Guards must fail closed / a comment is not a behaviour
- **Where:** `quirks/platforms/GENERIC_X64/095-cloud-ssh @@ -9,23 +9,68 @@`: `RAW=$(tr -cd '0-9' < "${FWCFG}")` followed by the 1–5 digit `case`.
- **What:** The fix bounds the *count* of digits but first deletes every non-digit byte. The script's own comment says "anything else on fw_cfg is no port at all, never a shortened one"; `tr -cd` still shortens by deletion.
- **Failure scenario:** a hand-edited UTM `-fw_cfg` entry (the README now tells testers to edit those entries) carrying `1x0022` or `1 0022` → `RAW=10022` → a loopback command for a port nobody forwarded is written to the cloud-setup screen. The launcher's own path is safe (`tcp_port` validates before injection).
- **Evidence:** the `tr -cd` line survives from the pre-fix script (`-  PORT=$(tr -cd '0-9' < "${FWCFG}")`). What would have refuted it: stripping only a trailing newline/NUL and requiring the remainder to be all digits; not present.

### G2-F1-02: the Vulkan ICD probe does not read every place the loader reads, and the vulkan→gl rewrite runs every boot
- **Severity:** Low
- **Category:** Configuration ownership / incomplete guard
- **Where:** `092-retroarch-surface @@ -13,18 +13,98 @@`, the `for f in /usr/share/vulkan/icd.d/*.json /usr/local/share/vulkan/icd.d/*.json /etc/vulkan/icd.d/*.json /storage/.local/share/vulkan/icd.d/*.json /storage/.config/vulkan/icd.d/*.json` loop and the unconditional `sed -i 's/^video_driver = "vulkan"$/video_driver = "gl"/'`.
- **What:** The loader also reads `/usr/local/etc/vulkan/icd.d`, `/etc/xdg/vulkan/icd.d` (default `XDG_CONFIG_DIRS`) and honours `VK_ICD_FILENAMES` / `VK_DRIVER_FILES`. A developer who provides a driver by env var from a `/storage/.config/profile.d/*` file (the documented way to reach the interface's environment on this image) has a working `vulkan` line rewritten to `gl` on every boot, with no record and no way to opt out.
- **Failure scenario:** `/storage/.config/profile.d/99-vk` exports `VK_DRIVER_FILES=/storage/vk/my_icd.json`; RetroArch draws with Vulkan; the next boot's quirk finds no ICD in its five globs and rewrites the driver.
- **Evidence:** the five globs above; nothing in the script reads an environment variable or `/etc/xdg`. The report's claude G-F1-03(d) row says the probe "also reads … root's own loader directories", which is true and not exhaustive.

### G2-F1-03: the rehearsal's readiness wait may be satisfied by the previous boot's line
- **Severity:** Low (cannot tell from the packet; the failure direction is a spurious FAIL, not a false PASS)
- **Category:** Test adequacy / a check that may not be able to fail
- **Where:** `tools/vm-upgrade-rehearsal @@ -98,6 +123,16 @@`: `for i in $(seq 1 30); do ssha 'grep -q "Autostart complete" /var/log/boot.log && echo done' …`.
- **What:** `generic-x64-vm-testing.md` § "Inspect a headless VM" says `/var/log` is `/storage/.cache/log` bind-mounted and survives a reboot. If autostart appends to `boot.log` rather than truncating it, the *old* image's `Autostart complete` line is present the moment SSH answers after the update, the wait returns `yes` on the first iteration, and the "autostart finished" check added for claude G-F1-09 cannot fail. The take-back read that follows may then run before the new autostart has finished.
- **Failure scenario:** the new boot's autostart is still running at the first `ssha`; the wait passes on the stale line; `ls $RETIRED | wc -l` reads 4; the run FAILs "retired quirk files taken back" on a build that would have passed ten seconds later.
- **Evidence:** the wait reads `/var/log/boot.log` with no boot-scoping (no `journalctl -b`, no uptime/boot_id check, no truncation assumption stated). What would settle it: `autostart`'s opening of `boot.log` (`>` vs `>>`), outside the diff. The rehearsal was not run (report: `bash -n` only).

### G2-F1-04: `run` still removes a *live* guest's monitor and serial sockets; only the type is checked
- **Severity:** Low (pre-existing; kept, not introduced)
- **Category:** Host-state protection
- **Where:** `generic-x64-vm`, `claim_socket_path()` and `prepare_run()`; `vm/README.md` ("`run` clears a previous QEMU's monitor and serial sockets").
- **What:** A socket is unlinked whether stale or bound by a running QEMU; the pidfile the launcher already writes (`-pidfile`) is not consulted. The fix narrowed the blast radius from "anything at the path" to "a socket at the path", which is what PL-033 asked, but a second `run` on the default paths while a guest is up still detaches that guest from `tools/vm-serial` and the monitor.
- **Failure scenario:** `vm-pair` guest a is up on the defaults; someone runs `generic-x64-vm run <other.qcow2>` without `--monitor/--serial`; QEMU's image lock refuses the second guest's disk, but a's sockets are already gone.
- **Evidence:** `if not stat.S_ISSOCK(mode): raise …; path.unlink()` — no liveness test; the old code's `unlink(missing_ok=True)` had none either.

### G2-F1-05: `092-retroarch-surface` now requires `status = connected`; the old script did not
- **Severity:** Low (cannot tell)
- **Category:** Regression risk in a fix
- **Where:** `092-retroarch-surface`: `[ "$(cat "${c}/status" 2>/dev/null)" = connected ] || continue`.
- **What:** The pre-fix script took the first line of every connector's `modes` (`cat /sys/class/drm/card*-*/modes | head -1`). The fix, rightly, skips disconnected connectors — but if a headless guest's virtio connector ever reports `unknown` rather than `connected`, the quirk now exits at `*) exit 0 ;;` and the surface is not sized at all, where the old one sized it.
- **Failure scenario:** a `--gl none --headless` guest whose `card0-Virtual-1/status` reads `unknown`; RetroArch draws the #263 scaled picture on every boot.
- **Evidence:** the fixture writes `connected` (`f1_sys`); no guest's `status` file appears in the packet.

### G2-F1-06: the take-back's header and the report miscount the retired set
- **Severity:** Low
- **Category:** Documentation accuracy (a summary is not the source)
- **Where:** `091-retired-vm-fixes` header: "this directory held eleven more scripts (091 to 101)"; `F1.report.md` PL-019: "Removed all twelve scripts: QEMU device quirks 091 to 101 (including `092-vm-service-fixes`) and the platform quirk".
- **What:** The diff deletes twelve device scripts (two are numbered 092) plus one platform script — thirteen. The take-back *list* is unaffected (it was derived per path; see PL-019 above), so this is a comment/report slip, but it is the kind of count a future reader would trust.
- **Evidence:** count the `deleted file mode 100755` hunks under `devices/QEMU Standard PC …/`.

### G2-F1-07: the stamps freeze the migration's scope on every guest's first boot
- **Severity:** Low
- **Category:** Migration design (stated limit, worth the integrator's eye)
- **Where:** `091-retired-vm-fixes` and `097-retired-rescue-masks`: `[ -e "${STAMP}" ] && exit 0` … `mkdir -p "${STAMP%/*}" && echo … > "${STAMP}"`.
- **What:** On a guest with nothing to take back — every fresh guest — the stamp is written on the first boot. Any leftover discovered later cannot be added to the list for already-stamped guests without a new stamp name. The downgrade gap ("writes them again, and they then stay") is stated in both scripts.
- **Failure scenario:** a 17th path is found after release; adding it to `set --` changes nothing on any guest that has booted the release once.
- **Evidence:** the stamp test is the first line after the header; the list is fixed.

### G2-F1-08: the interruption shims fall back to the host's GNU tools unless `/lgst/busybox` exists
- **Severity:** Low (cannot tell)
- **Category:** Harness fidelity
- **Where:** `tools/last-good-scripts-test`, F1g `killsed/sed` and F1h `killmv/mv`: `if [ -x /lgst/busybox ]; then /lgst/busybox sed "$@"; else /usr/bin/sed "$@"; fi`.
- **What:** Nothing in the F1 block binds `/lgst`; the block's busybox binding is `F1BB=(--ro-bind "${TMP}/bbin" /bbin --ro-bind "${BB_HOST}" "${BB}")`. If `/lgst` is not a convention the harness header establishes, the two kill cases run under GNU `sed -i`/`mv`, not the image's busybox — a fidelity gap in exactly the cases that model an interrupted in-place write.
- **Evidence:** `/lgst` appears only inside the two shims in this diff. What would settle it: the harness header (outside the packet).

### G2-F1-09: the new vars-size refusal reaches automation that keeps a vars store beside a re-made disk
- **Severity:** Low (a refusal with a message, but on an unattended runner)
- **Category:** Seam / behaviour change for callers
- **Where:** `generic-x64-vm`, the `ValueError` in `qemu_command` on `vars_path.stat().st_size != vars_template.stat().st_size`; `run_paths()` default `disk.with_name(f"{disk.stem}.ovmf-vars.fd")`.
- **What:** `generic-x64-vm-testing.md` says `vm-pair up` begins with `rm -f "$DIR"/vm-*.qcow2` — a glob that does not match `vm-a.ovmf-vars.fd`. A host OVMF upgrade that changes the template's size turns the next `vm-pair up` (and so `vm-qa`) into a refusal that needs a manual move-aside, where before the guest started (possibly on a mismatched store).
- **Failure scenario:** the build host's OVMF moves from a 2 MiB to a 4 MiB vars layout; `tools/vm-qa` exits at `up` with "made for another OVMF build" until someone deletes two files by hand.
- **Evidence:** the size check has no "rebuild if the disk is newer than the store" path; whether `vm-pair` removes the vars files is outside the diff.

---

## 4. Sweep rows (`F1.report.md` § "Sweep rows")

Fixed rows checked against the diff:
- **gpt F-VM-13 (commas):** `qemu_opt()` doubles commas; applied to `file={qemu_opt(code)}`, `file={qemu_opt(vars_path)}`, the disk `file=`, `-monitor unix:{qemu_opt(monitor)}`, the serial `unix:{qemu_opt(serial)}`. F1f's `a,b` directory case. ✓
- **gpt F-VM-14 (ARM KVM):** `auto_accel()` requires `platform.machine()` in `x86_64/amd64` before `/dev/kvm`; F1f's probe patches `platform.machine`. ✓
- **gpt F-VM-15 (disk floor):** `if disk_info["virtual-size"] < profile["disk"]["virtual_size_bytes"]: raise ValueError(...)` in `qemu_command`, so `qemu-args` and `run` both refuse; F1f's 1 GiB case. ✓
- **gpt F-VM-11 (backing/data file):** `build_utm` refuses on `full-backing-filename`/`backing-filename` and on `format-specific.data.data-file`; F1f makes an overlay and a `data_file=` qcow2. ✓
- **gpt F-VM-12 (concurrent builds):** `tempfile.mkstemp(dir=output.parent, prefix=f".{output.name}.", suffix=".partial")`, `os.replace`, cleanup on `BaseException`; F1f plants another build's `bundle.zip.tmp` and asserts it survives. ✓
- **claude F-VM-10 / gpt F-VM-09 (connector):** connected-only loop, `MODE="${MODE%i}"`, `case "${W}${H}" in *[!0-9]*) exit 0`; F1g's disconnected-DP-1 and `1920x1080i` cases. ✓
- **gpt F-PB-14 (udev `.conf`):** 101 deleted; `udev.rules.d/90-x64-virtual-devices.conf` in the take-back list. ✓
- **claude F-VM-05 / gpt F-VM-10 (cloud-ssh override):** `ours()` as above. ✓
- **claude F-VM-08 / F-VM-16 (emulator configs):** `name = ""` under `[Input-SDL-Control1]`; flycast `[window]` keeps `fullscreen = yes` and loses `height/width`; three Anbernic m8c INIs deleted (one file, two `mode 120000` links). ✓ The *reasons* (mode-2 input-sdl, SDL desktop fullscreen, `QUIRK_DEVICE` selection) cite sources outside the packet.
- **claude F-VM-14 (partial):** `tcp_port` on `--ssh-port`; `OVMF_PAIRS`/`find_ovmf_pair`. ✓

Withdrawn rows I can judge from the packet:
- **claude F-EM-14, gpt F-PB-25, claude F-VM-15 (video_sense part):** the plan's ownership list (`F1.plan.md` § "The files you own") does not include the shared emulator recipes, `virtual/emulators/package.mk`, or `system-utils`; the withdrawal-by-ownership holds.
- **claude F-RW-04:** the buildbot part is superseded by PL-076's removal in this diff; the rest (640x480 deliberate, D-QA-042) is a register citation I cannot check here.
- **claude F-VM-13, gpt F-VM-19, gpt F-VM-09's "configured mode" part, claude F-VM-14's `/tmp`/`svc_bind` parts:** the refuting facts (kernel config, SYSTEM contents at `7911c53bb4`, sway's start order, `extra_forwards` history) are outside the packet; not judged.
- **gpt F-VM-16 → claude G-F1-08:** see § 2.

---

## 5. Seams

- **Shared harness (`tools/last-good-scripts-test`).** F1 appends one block before the summary line and depends on `check`, `src_of`, `TMP`, `ROOT`, `OLD`, `BASE_REF`, `BB`, `BB_HOST` defined above it; all F1 names are prefixed `f1_`/`F1`. The block hard-codes `F1_PREV=417dcd8610` and fails *closed* if that commit is unreadable (`the earlier builds' pass wrote nothing -- the fixture proves nothing`) — a suite red for a history reason, not a tree reason, but honest.
- **`retroarch.cfg` ↔ stream B's `runemu`/`setsettings` append file.** F1's driver and surface fixes assume `/tmp/.retroarch.cfg` (the `--appendconfig`) does not set `video_driver` or `video_fullscreen_x/y` for GENERIC_X64; the report says both files are B's and the observed guest behaviour (RetroArch exiting on `vulkan`) is consistent with that. Not visible here.
- **`mupen64plus.cfg` ↔ stream F2 (`f72a5d1fdf`).** The F1 hunk from base shows both F2's Retroid-block removal and F1's one-line `name = ""`; identical removals merge cleanly, and the report says F1 started from F2's file. If F2's final content differs from what F1 copied, `next` will conflict.
- **`tools/ra-offline-test`, `tools/time-to-play`.** Comment-only hunks; they still swap the driver to gl for a run and restore the guest's line, which now is gl — no contract change.
- **`tools/vm-upgrade-rehearsal`.** Other streams add seeds to the same file; F1's two seed blocks sit before "stage … and reboot guest a" and its checks after "update queue empty". The seeds remove the stamps by the same names the scripts write (`retired-vm-fixes`, `retired-rescue-masks`) — reader and writer agree.
- **`generic-x64-vm run` ↔ `vm-pair`/`vm-qa`/`vm-serial`.** Callers now meet four new refusals (pair from one directory, disk under 16 GiB, symlink or non-socket at a socket path, mismatched vars store). Each refuses before touching anything, which is the right direction; G2-F1-09 names the one likely to fire unattended.
- **`serial-debug-shell.service` ↔ `tools/vm-serial`.** The console conditions are kept and the VM condition is met on every QEMU/UTM guest; the channel is unchanged for the QA fleet.
- **`cloud_setup_ssh` ↔ the interface's cloud-setup screen.** The file's shape (one line, a full ssh command) is unchanged; only who may rewrite it changed.
- **`092`'s rule (a) ↔ `factoryreset`/`backuptool`.** The record beside the cfg is meant to survive a RetroArch reset and travel with a settings backup; both behaviours are outside the diff.

---

## 6. Coverage boundary (not judged, not guessed)

- Anything on a guest or device: PL-019's journal count and vm-qa; PL-023's `ConditionResult`; PL-034 on a kept guest; the two rehearsal blocks (syntax-checked only per the report).
- `docs/decision-register.md` (D-QA-052/053) — not embedded.
- The systemd recipe's patch 0001 (unit directory `/storage/.config/system.d`) and the systemd/kmod `package.mk` `ln -sf` lines — the fixture is generated from them; the take-back's correctness on a real guest depends on them.
- `autostart`: execution order (platform then device), stderr routing to the journal, whether the pass runs on the resize boot, whether `boot.log` is truncated (G2-F1-03).
- `busybox/scripts/init` (`update_bootloader`, the hint) — grepped by F1e, not in the packet.
- `find_ovmf`, `qemu_img_info`, `load_profile`, `add_qemu_options` defaults, `main()`'s `utm` dispatch, `VM_DIR` — context lines only.
- `factoryreset`, `backuptool`'s handling of `.fullscreen-surface`, `setsettings`' append file, `M8C.sh`, input-sdl and flycast sources — the report's reasoning cites them; none is embedded.
- Whether a headless virtio connector reports `connected` (G2-F1-05); whether `vm-pair` removes `*.ovmf-vars.fd` (G2-F1-09); whether `/lgst/busybox` is a harness convention (G2-F1-08).
- The report's PASS counts (428 → 432 → 447) and `pkgcheck` outputs — claims without artifacts in the packet.

---

## corpus.provenance.json

```json
{
  "seat": "F1-second-seat",
  "read_timestamp_utc": "2026-09-28T13:57:25Z",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F1.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F1.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F1.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F1.items.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F1.plan.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/generic-x64-vm-testing.md"
  ],
  "source_file_hashes": [
    "20dd8cac22032c699c145532be10c8bb56e9471b9d5870052be0688b8c051fab",
    "43c9c09e2f5b5df38c22b28d4b97cbabc80c3d1b830a0dc8d8841d5acbd549b2",
    "cfafcc1f3969e18eba9b001c8667e5c0f153a3b5eeee94e2c5670d2f6a31b61d",
    "dae933636e1651a3d62b2bac5a89d2b316182444306c134bc69f91ee8a2dbb2d",
    "21f9ebbae6912c3b7aaa038b58830b4050a95c46ad7e9da31c973b24cc73ddb1",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "9ae148998b481417b86d6b84f03dfff94ac47d8f1159edb2c6c17f5e7c350202"
  ],
  "not_embedded": [".claude/rules/rclone-cloud-sync.md (named in the brief; not needed: F1 touches no cloud script)"],
  "hashes_source": "facilitator, verified at embed time; not re-hashed by this seat"
}
```
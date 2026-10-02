# Council seat review — stream F1 (GENERIC_X64), audit #307 / #308

## Corpus provenance (as embedded; not re-read or re-hashed by me)

`source_file_paths[]` / `source_file_hashes[]`:

1. `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.diff` — `2f6b7afb593f97fb6702d2098e96ec2f13fc652b1f58e63b5586bc33183159ec`
2. `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.harness.txt` — `bbe23df86b7480986345a754a7179dce6ada39fbbae946c35a09e3fa852969f7`
3. `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.plan.md` — `21f9ebbae6912c3b7aaa038b58830b4050a95c46ad7e9da31c973b24cc73ddb1`
4. `docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.report.md` — `50af740143d112297e6df93a0c99203d33b86a85613c21ccd4b5b3d5f0cd2e83`
5. `.claude/rules/engineering-practices.md` — `d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a`
6. `.claude/rules/upgrade-and-install.md` — `de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995`
7. `.claude/rules/packaging-and-patches.md` — `2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746`
8. `.claude/rules/es-player-text.md` — `554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7`

Not in the packet, and needed for some claims below: `tools/last-good-scripts-test` beyond the embedded F1 block (the report's F1i/F1j cases), `projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json`, `find_ovmf()`/`qemu_img_info()` in `generic-x64-vm` (outside the hunks), busybox `init`, the systemd/kmod `package.mk` link lines, `docs/decision-register.md` (D-QA-053), any m8c config path. Each is named where it matters.

The diff has no line numbers; I cite by file + hunk header + quoted line so each citation is one visit to one file.

---

## 1. Per punch item

### PL-019 — QEMU quirks write to a read-only `/etc`
**Verdict: holds in part** (the code does what the verdict named; the acceptance itself is on a guest and is not in the packet).

- Mechanism named: delete the `/etc` writers 091–101. Diff: all twelve QEMU device scripts are `deleted file mode 100755` (`091-systemd-fixes`, `092-journald-config`, `092-vm-service-fixes`, `093-…`, `094-…`, `095-…`, `096-…`, `097-…`, `098-…`, `099-…`, `100-…`, `101-…`), plus the platform `097-disable-rescue-completely` (the plan's guest evidence puts the journal's `Read-only file system` lines 20 and 33 on that script's `cat … >/lib/systemd/system/…`).
- Already-written take-back: new `…/QEMU Standard PC (Q35 + ICH9, 2009)/091-retired-vm-fixes` (`@@ -0,0 +1,35 @@`) removes by name exactly the union of what the deleted scripts wrote through the `/etc→/storage` links or directly under `/storage`: 3 tmpfiles (`10-generic-x64-journald.conf` from 092, `20-x64-fd-improvements.conf` from 098, `30-x64-mount-points.conf` from 099), `sysctl.d/10-generic-x64.conf` (095), `modules-load.d/x64-virtual-modules.conf` (101), `udev.rules.d/90-x64-virtual-devices.conf` (101), `profile.d/091-generic-x64-services` (091), and the nine drop-ins under `.config/systemd/system` (091's five `10-generic-x64.conf`; 092-vm's three `10-vm-config.conf` and dbus `20-vm-enhanced.conf`). I reconciled that list against every `cat <<EOF >` in the deleted scripts; nothing under `/storage` is missed **provided** the only `/etc` links are `tmpfiles.d`, `sysctl.d`, `udev/rules.d`, `modules-load.d` (the four the harness asserts, F1a's fixture line `[ -L "${F1ETC}/tmpfiles.d" ] && …`). If `journald.conf.d` or `system.conf.d` were also links, 092/093/094/095/098's journald files and 095's `system.conf.d/10-generic-x64.conf` would be under `/storage` and not taken back — the harness fixture, built from the recipes' actual `ln -sf` lines, would have caught that in F1b, and the report's "20 files" count matches an `/etc` where they are not links. Cannot confirm from the packet.
- Masks: new `platforms/GENERIC_X64/097-retired-rescue-masks` (`@@ -0,0 +1,20 @@`) removes `/dev/null` links under the four names.
- Harness: F1a asserts `0 'Read-only file system' lines`, empty journal, no new boot-changing files; F1b builds its fixture by running the `417dcd8610` pass and asserts each written file is gone and the owner's four planted files (incl. a mask `mine.service`) stay. Both FAIL-lines the report quotes are the kind those checks emit.
- Acceptance not in packet: `journalctl -b | grep -c` on a guest and "vm-qa all suites PASS" — the report states nothing ran on a VM.

### PL-022 — orphan quirk tree
**Verdict: holds.** Seven `deleted file mode` entries under `packages/hardware/quirks/platforms/GENERIC_X64/` (`001-virtualization-setup` … `095-kernel-early-boot-fixes`). F1c asserts the path is empty of non-`package.mk` files; on `--old` it lists 7. `tools/pkgcheck quirks` output is a report claim only.

### PL-023 — root shell on ttyS0
**Verdict: holds for the unit file; guest result and register row cannot be told from the packet.**

- `serial-debug-shell.service` hunk `@@ -1,13 +1,26 @@` adds `ConditionVirtualization=vm` beside the two `ConditionKernelCommandLine=|console=ttyS0…` lines (correct systemd semantics: the non-`|` condition ANDs with the `|` group). It also moves `IgnoreOnIsolate=yes` into `[Unit]` (`@@ -23,7 +36,6 @@` removes it from `[Service]`); `IgnoreOnIsolate=` is a `[Unit]` key, so this is a correct fix the item did not ask for and F1d covers (`awk … /^IgnoreOnIsolate=/{print sec}` = `[Unit]`).
- F1d: `grep -qx 'ConditionVirtualization=vm'`, console conditions kept, SPDX + `D-QA-053` in the header — each fails on the old unit.
- Acceptance's `ConditionResult=yes` on the guest: not run. "The register row exists": the report says D-QA-053; the plan's own title cites D-QA-053 as an existing decision, but the row's text is not in the packet.
- Note for the integrator (not a defect): with `IgnoreOnIsolate` now effective and `emergency.target` unmasked (PL-019), a failing boot on a VM isolates emergency with the serial shell surviving it — a behaviour combination nobody has seen on a guest.

### PL-033 — `qemu-args` unlinks sockets
**Verdict: holds.**

- `@@ -157,9 +242,7 @@` removes `serial.unlink(missing_ok=True)`; `@@ -199,7 +282,6 @@` removes `monitor.unlink(missing_ok=True)`; the vars-store `shutil.copyfile` leaves `qemu_command()` and lands in `prepare_run()` (`@@ -79,51 +81,134 @@`), which `main()` calls only in the non-`qemu-args` branch immediately before `os.execv` (`@@ -626,12 +749,13 @@`).
- `claim_socket_path()` uses `os.lstat` + `stat.S_ISSOCK` and raises `ValueError` for anything else, so the gpt seat's disk-as-`--monitor` input is refused and the file kept.
- F1f: real sockets planted, `qemu-args` run, `[ -S m.sock ] && [ -S s.sock ] && [ ! -e vars.fd ]`; fails on the old tree by construction. A separate check keeps `run`'s stale-socket clearing (a regression guard; it passes on both trees, which the block is honest about).

### PL-034 — generated RetroArch dimensions become the player's
**Verdict: holds in part.**

- The item's text says "write them to the per-device overlay the launcher reads"; the stream instead implemented the seats' verdict ("mark generated values … a marker file") and says why (no such overlay exists; the append file is stream B's). The diff (`092-retroarch-surface @@ -13,18 +13,73 @@`) writes `RECORD="/storage/.config/retroarch/.fullscreen-surface"` atomically (`> "${RECORD}.new" && mv`) and rewrites `video_fullscreen_x/y` only when `OURS=yes` (recorded, shipped `0|640`/`0|480`, or — with no record — the current mode or `1280x800`).
- Acceptance clause 1 ("after a resolution change on the guest the values follow"): F1g proves it in the fixture (1280x800 → 640x480 → 1280x800; the old code fails the second step, as the report's FAIL line shows).
- Acceptance clause 2 ("`vm-upgrade-rehearsal` asserts the player's cfg unchanged"): the rehearsal (`@@ -71,6 +71,29 @@`, `@@ -98,6 +121,12 @@`) asserts a hand-set `1024x768` is kept **and** that `video_driver` moved `vulkan`→`gl`. So the player's cfg is deliberately *changed* in one key by the same quirk (see G-F1-03). The rehearsal was not run (`bash -n` only).
- Gaps in the ownership heuristics: G-F1-03.

### PL-042 — tmpfiles rules at socket paths
**Verdict: holds.** 098 and 099 are deleted; `091-retired-vm-fixes` removes `tmpfiles.d/20-x64-fd-improvements.conf` and `30-x64-mount-points.conf` by name, so a guest that already has them stops applying them from its second boot on the new image (the first boot still runs `systemd-tmpfiles-setup` before the quirk pass — same as every earlier boot, not a regression).

### PL-073 — bootloader updater copies nothing
**Verdict: holds** (by the "script is gone" arm). `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh` is `deleted file mode 100755`. F1e's old-tree branch proves the copy-nothing/hint-written defect; on the new tree the `else` branch is reached only when the file is absent. The companion assertion that `init` skips a missing `update.sh` and writes the hint itself greps `busybox/scripts/init`, which is outside the diff — I cannot confirm those lines, only that the check looks for them.

---

## 2. Findings

### G-F1-01: The report's follow-up claims are not in the packet
- **Severity:** Medium
- **Category:** Evidence / packet coherence
- **Where:** `F1.report.md` § "Follow-up (after the merge at f0f263b8cc)"; `F1.harness.txt` (ends at F1h); `F1.diff` hunks `retroarch.cfg @@ -111,7 +111,6 @@`, `flycast … emu.cfg @@ -19,5 +19,3 @@`, `mupen64plus.cfg @@ -172,7 +172,7 @@` and `@@ -186,12 +186,6 @@`
- **What:** The report claims commits `7c8ba04368`, `9fd73da845`, `85e4856b7e` with new harness sections F1i (three emulator configs) and F1j (PL-076) and a PASS count of 432. The embedded harness block has no F1i/F1j (428-era). The diff *does* carry the retroarch `core_updater_buildbot_url` removal, the flycast `height/width` removal and the mupen64plus `name = ""` + Retroid-block removal — with no test case in the packet for any of them — and does **not** carry the m8c change the report describes ("the three Anbernic INIs (one file and two links) are removed"). No `m8c` path appears anywhere in the diff.
- **Failure scenario:** An integrator reads the report's "fixed, F1i FAIL-then-PASS" and merges the emulator-config edits believing they are covered; the coverage exists only if a later harness revision is in the branch. The m8c claim may describe a commit that did not land or landed outside the diffed paths.
- **Evidence:** searched the diff for `m8c`, `Anbernic`, `F1i`, `F1j` — none; the harness's last section header is `# F1h.`; the report's own harness line says F1i/F1j "are the new checks".

### G-F1-02: Fixes reach past the stream's declared ownership
- **Severity:** Medium
- **Category:** Scope / process (plan § "The files you own … If a fix genuinely needs a file outside this list, do not touch it")
- **Where:** `F1.diff`: `…/mupen64plus-sa-core/config/GENERIC_X64/mupen64plus.cfg`, `…/flycast-sa/config/GENERIC_X64/emu.cfg`, `tools/ra-offline-test @@ -277,12 +277,15 @@`, `tools/time-to-play @@ -1054,11 +1054,14 @@`, and `…/quirks/devices/innotek GmbH VirtualBox/091-vbox-graphics` (`deleted file mode 100644 index e69de29bb2…`)
- **What:** The plan grants `emulators/**/sources/GENERIC_X64/` (RetroArch), not `config/GENERIC_X64/`; `tools/vm-*` only where a row names one; and the QEMU and GENERIC_X64 quirk dirs, not the VirtualBox one. The report self-declares the first four ("outside F1's list") and says the mupen64plus edit was based on stream F2's `f72a5d1fdf` to merge cleanly; it never mentions the VirtualBox deletion (an empty blob, so no behaviour change, but an unrecorded edit outside the lane).
- **Failure scenario:** The mupen64plus hunk removes 25 lines around Control1; if F2's branch differs from what the report assumed, the merge conflicts or, worse, resolves silently to one side and drops F2's Control1 restructuring or F1's `name = ""`.
- **Evidence:** the diff's mupen64plus hunk `@@ -186,12 +186,6 @@` deletes the `[Retroid Pocket Gamepad]` block that sat between `AnalogPeak` and `DPad R`; whether that matches F2's file is not checkable here.

### G-F1-03: `092-retroarch-surface`'s ownership heuristics claim some hand-set values and strand some earlier writes
- **Severity:** Low
- **Category:** Upgrade path (`upgrade-and-install.md` § Every fix answers what was already written) / correctness
- **Where:** `092-retroarch-surface @@ -13,18 +13,73 @@`, the `OURS=` chain and the `ICD` block
- **What:** (a) A hand-set `640x480` (or `0x0`) on any guest is "the shipped values" and is rewritten to the mode at every boot — same as the old code, but now documented as "left alone" for anything set by somebody. (b) With no record, a hand-set value equal to the connected output's preferred mode is claimed, recorded, and thereafter follows mode changes. (c) An earlier build's write at any `--res` other than `640x480`/`1280x800` (e.g. a kept guest last run at `1024x768` on the old image, first booted on the new image at another mode) is treated as the player's and stays — the original PL-034 bug persists for that guest; the report's "unrecorded values from an earlier build are recognised" is true of two values only. (d) The `vulkan`→`gl` rewrite is unconditional and every-boot; the ICD probe reads only `/usr/share/vulkan/icd.d` and `/etc/vulkan/icd.d`, not the loader's per-user dirs. (e) Once a record exists the third branch is dead, so a settings restore that brings back a pre-record cfg carrying the old quirk's `1280x800` is left as the player's.
- **Failure scenario:** (c) is the realistic one: a developer who kept a guest at `--res 1024x768` across the upgrade and re-runs at `--res 1280x800` keeps a `1024x768` surface until they set `640x480` by hand.
- **Evidence:** harness F1g tests hand-set `1024x768` kept, unrecorded `1280x800` followed, unrecorded `1024x768` left — the last is exactly case (c) asserted as desired, so the trade-off is deliberate; nothing in the packet tests (a), (b) or (e). The comment in the diff names "the guest's mode, or QEMU's default 1280x800" as the only recognised earlier writes.

### G-F1-04: The "leaves no temporary of its own" assertion cannot see the temporary
- **Severity:** Low
- **Category:** Guards must fail closed (harness)
- **Where:** `F1.harness.txt` F1f, the F-VM-12 check: `[ -z "$(ls "${F1V}" | grep -E '^bundle\.zip\..+' | grep -v '^bundle\.zip\.tmp$')" ]`; `generic-x64-vm @@ -479,19 +576,32 @@` `tempfile.mkstemp(dir=output.parent, prefix=f".{output.name}.", suffix=".partial")`
- **What:** The temporary is named `.bundle.zip.<rand>.partial` — a dotfile — and `ls` without `-A` never lists it, so the clause is vacuous whatever the launcher leaves behind.
- **Failure scenario:** A future change that drops the `except BaseException: unlink` would still pass this check.
- **Evidence:** the other two clauses (planted `<output>.tmp` untouched; the zip's namelist) are real and fail on the old tree; this third clause has no input that makes it fail.

### G-F1-05: The take-back quirks cannot attribute, and never expire
- **Severity:** Low
- **Category:** Upgrade path (§ Migrations: "Never move what you did not put there")
- **Where:** `097-retired-rescue-masks @@ -0,0 +1,20 @@` (`[ -L … ] && [ "$(readlink …)" = /dev/null ] && rm -f`); `091-retired-vm-fixes @@ -0,0 +1,35 @@` (`rm -f` by name, `rmdir "${C}/systemd/system" "${C}/systemd"`)
- **What:** Both run on every boot forever. Any `/dev/null` link under `rescue.target`/`emergency.target`/`rescue.service`/`emergency.service` is removed — a mask is a mask, so a developer's own `systemctl mask emergency.target` on a GENERIC_X64 install is undone at the next boot, permanently. Likewise a file an owner writes under one of the seven retired names. The comment "a unit of somebody's own under one of these names is theirs" holds only for a non-mask unit.
- **Failure scenario:** A developer masks `emergency.target` on a hardware install to get the pre-fix behaviour back; it comes back unmasked every boot with nothing in the journal to say why.
- **Evidence:** F1b's owner-mask fixture is `mine.service`, not one of the four names; no case covers an owner's mask under those names.

### G-F1-06: `095-cloud-ssh` truncates an over-long port rather than refusing it
- **Severity:** Low
- **Category:** Guards must fail closed
- **Where:** `095-cloud-ssh @@ -9,22 +9,49 @@`: `PORT=$(tr -cd '0-9' < "${FWCFG}" | head -c 5)`
- **What:** A fw_cfg value of six or more digits becomes its first five — `100000` → `10000`, then passes `-ge 1 -le 65535` and is written into the screen's command as a plausible port. The launcher now validates its own `--ssh-port` (`tcp_port`), but a UTM bundle's `-fw_cfg` string is editable by hand.
- **Failure scenario:** Wrong port shown on the cloud-setup screen with no error anywhere.
- **Evidence:** the old code had no truncation (`tr -cd '0-9'` then the range test would reject `100000`); the new line introduces it. No harness case feeds an out-of-range fw_cfg value.

### G-F1-07: "A second boot changes nothing" compares names, not bytes
- **Severity:** Low
- **Category:** Harness fidelity
- **Where:** `F1.harness.txt` F1b: `( cd "${F1}/b" && find . \( -type f -o -type l \) | LC_ALL=C sort ) | cmp -s - "${F1}/b.once"`
- **What:** The listing is of paths; a second pass that rewrote a file's contents (e.g. `retroarch.cfg`, `cloud_setup_ssh`) would pass. F1g and F1h do check bytes for their own quirks, so the gap is only for the full-pass claim.
- **Evidence:** the same harness uses `sha256sum` for the byte checks in F1g/F1h and not here.

### G-F1-08: gpt F-VM-16 is closed by documentation where a mechanism exists
- **Severity:** Low
- **Category:** Mitigation by note (`upgrade-and-install.md` § "A release note is never a mitigation")
- **Where:** `vm/README.md @@ -75,11 +83,18 @@`, `utm-bundle-readme.txt @@ -26,7 +26,9 @@`; report row "7 gpt F-VM-16"
- **What:** The report's reason, "the guest cannot see UTM's network mode", is stronger than the facts: the guest can see its own address, and QEMU's user-mode network hands out `10.0.2.x`; a bridged/vmnet guest does not. `095-cloud-ssh` could suppress the loopback command when the guest's address is not on the SLIRP subnet. The delivered fix is two README sentences telling the tester to delete two `-fw_cfg` entries.
- **Failure scenario:** A tester switches the bundle to Bridged, does not read the note, and follows a `127.0.0.1:10022` command that goes nowhere.
- **Evidence:** nothing in the diff changes what the guest does with the injected port in bridged mode; the README text itself says "the screen keeps showing the loopback command, which does not reach the guest there".

### G-F1-09: The rehearsal's readiness wait depends on a line the packet cannot show
- **Severity:** Low
- **Category:** Harness fidelity (fails closed, but noisily)
- **Where:** `tools/vm-upgrade-rehearsal @@ -98,6 +121,12 @@`: `for i in $(seq 1 30); do ssha 'grep -q "Autostart complete" /var/log/boot.log && echo done' …`
- **What:** Whether `boot.log` ever carries `Autostart complete` is outside the packet. If it does not, the loop runs its 30 iterations (~60 s plus ssh time) and the three new checks then run regardless; if the quirk pass is still going, the "taken back" check reads the files before removal and reports a FAIL that is the fixture's, not the image's.
- **Evidence:** the loop's exit is only the string or the count; there is no assertion that the string was seen.

---

## 3. Sweep rows

### Fixed rows spot-checked against the diff (all confirmed present)

1. **claude F-VM-05 / gpt F-VM-10** (`095-cloud-ssh`): `ours()` (record match, or — without a record — one line matching the generated pattern) gates both the write and the `rm -f`; writes are `.new` + `mv`. F1h's five scenarios each map to a branch; the hand-written case fails on the old tree as the report quotes. Correct.
2. **gpt F-VM-13** (commas): `qemu_opt()` applied to `code`, `vars_path`, the disk `file=`, `-monitor` and the serial `unix:` (hunks `@@ -216,13 +298,13 @@`, `@@ -264,7 +346,7 @@`, `@@ -157,9 +242,7 @@`); the 107-byte socket check still measures the unescaped path. Correct.
3. **gpt F-VM-14** (ARM KVM): `auto_accel()` requires `platform.machine()` in `x86_64/amd64` before `/dev/kvm` access. F1f's probe monkeypatches both and fails on the old tree (`accel=kvm` on aarch64). Correct.
4. **gpt F-VM-15** (disk floor): `if disk_info["virtual-size"] < profile["disk"]["virtual_size_bytes"]: raise ValueError` in `qemu_command`, so both `qemu-args` and `run` refuse; the message hardcodes "16 GiB"/"16G" alongside the profile number (cosmetic drift if the profile ever changes).
5. **gpt F-VM-11** (backing/data-file): `full-backing-filename`/`backing-filename` and `format-specific.data.data-file` refused in `build_utm` (`@@ -463,6 +545,21 @@`). The key path matches `qemu-img info --output=json`'s shape; `qemu_img_info()` itself is outside the diff.
6. **gpt F-VM-12** (concurrent UTM builds): `mkstemp` beside the output, `os.replace`, unlink on `BaseException`. Correct in the code; the harness's third clause is vacuous (G-F1-04).
7. **claude F-VM-14**: `--ssh-port` `type=tcp_port` (`@@ -544,7 +654,7 @@`, `@@ -588,6 +698,19 @@`); `find_ovmf_pair()` refuses a lone flag that is not a known pair's and refuses an auto-pick unless both files of one pair exist (`OVMF_PAIRS`). Behaviour change worth knowing: `--ovmf-code /custom/CODE.fd` alone used to work with auto vars and now errors unless `--ovmf-vars-template` is also given — the README's new paragraph says so.
8. **claude F-VM-11 / F-VM-12** (RetroArch driver, options): `retroarch.cfg @@ -765,7 +764,7 @@` ships `gl`; `092` moves a `vulkan` cfg to `gl` when no ICD; `options` comments now say `VULKAN=` is loader+headers only and no `GRAPHIC_DRIVERS` entry is a Vulkan driver. Comments only in `options`; unverifiable references to `Haswell-v4` and `8 GiB` in `profile.json`.
9. **claude/gpt F-VM-07, gpt F-PB-14, gpt F-PB-22, gpt F-VM-08**: all resolved by deletion in the diff; the udev `.conf` and the masks are in the take-back scripts by name.
10. **claude F-VM-10 / gpt F-VM-09**: `092` iterates connectors, requires `status = connected`, strips a trailing `i`; F1g's disconnected-DP-1 and `1920x1080i` cases fail on the old tree by construction.

### Withdrawn rows I can judge from the packet

- **claude F-RW-04** — withdrawn as upstream convention, then partly superseded by PL-076 (the armhf URL is removed in the diff). The "all 15 device profiles" claim is not checkable here; the withdrawal of the 640x480 default is consistent with the plan's D-QA-042 reference.
- **claude F-VM-14 (shared `/tmp` defaults)** — the reason ("a start now refuses anything there that is not a socket") does not cover the finding's live case: two `run`s with default paths, and the second unlinks the first's *live* monitor socket, since `claim_socket_path` cannot tell live from stale. Pre-existing and documented in the README, so not a regression, but the withdrawal is weaker than stated.
- **claude F-VM-13, F-EM-14, gpt F-PB-25, gpt F-VM-19, claude F-VM-08/16 "not in the SYSTEM"** — rest on files or an image listing outside the packet; the "not F1's file" reasons are consistent with the plan's ownership list.
- **gpt F-VM-09's "configured mode" half** — refuted on the grounds sway has not started when the quirk runs; consistent with the quirk's comment, not provable here.

---

## 4. Coverage boundary

Could not judge from this packet, stated plainly:

- **Anything on a guest or device**: PL-019's journal count and vm-qa; PL-023's `ConditionResult`; PL-034 on a kept guest; the two `vm-upgrade-rehearsal` blocks (syntax-checked only); the combined effect of unmasking `emergency.target` + effective `IgnoreOnIsolate` on a failing VM boot.
- **The `/etc` link set** the systemd and kmod recipes install (whether `journald.conf.d`/`system.conf.d` are links) — the harness derives it from `package.mk` at run time; the take-back list is complete only for the four links the harness asserts.
- **`find_ovmf()` and `qemu_img_info()`** — outside the hunks. In particular whether `qemu_img_info` passes `-U`/`--force-share`: if not, `qemu-args` on a running guest's disk may fail on the image lock, so the README's "safe beside a running guest" would mean "harmless" rather than "prints".
- **`profile.json`** (`virtual_size_bytes`, `memory_mib`, CPU model) — the disk-floor and options comments reference it.
- **busybox `init`** (`update_bootloader`, the boot hint) — F1e greps it; not in the diff.
- **`backuptool`'s include list** — whether `.config/retroarch/.fullscreen-surface` and `.config/.cloud_setup_ssh.generated` travel with a settings backup, as the `092` comment asserts.
- **Consumers of the deleted `profile.d/091-generic-x64-services` variables** (`SYSTEM_SERVICE_DEPS`, `UI_SERVICE_AFTER`, `UI_SERVICE_WANTS`) — the report argues from the fresh-boot shape that none is needed; § "Before deleting a duplicate, diff its behaviours" asks for the consumer list and none is given.
- **Stream F2's `f72a5d1fdf`** (the mupen64plus base the report says it started from) and the m8c commit — neither in the packet (G-F1-01, G-F1-02).
- **`docs/decision-register.md` D-QA-053** — cited by the plan and the report; text not embedded.
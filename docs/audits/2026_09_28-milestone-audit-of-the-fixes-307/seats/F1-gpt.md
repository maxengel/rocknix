# F1 audit: corrections and integration evidence still needed

I reviewed the embedded packet only. I did not execute tests, inspect a filesystem, boot a guest, or recompute hashes. The failure scenarios below are derived from the supplied code, not claimed reproductions.

References **[S1]–[S8]** identify the declared source paths and embed-verified hashes recorded in `corpus.provenance.json` below. Changed-file paths and hunk headers identify locations **within [S1]**, not independently read files.

The main deletions and the `qemu-args`/`run` separation are visible and substantially address their original defects. The weakest parts are ownership inference for persistent configuration, interrupted configuration/record updates, and several launcher-hardening edge cases. The report’s VM-dependent acceptances remain unverified.

## 1. Per-punch-item verdicts

Contract: [S3]. Report assertions in [S4] are not execution evidence.

### PL-019 — **holds in part**

[S1] deletes the QEMU device writers `091-systemd-fixes` through `101-virtualization-fixes`, including both `092` files, and deletes the platform’s `097-disable-rescue-completely`. The two new cleanup scripts explicitly remove persistent remnants:

- `devices/QEMU Standard PC (Q35 + ICH9, 2009)/091-retired-vm-fixes`, hunk `@@ -0,0 +1,35 @@`;
- `platforms/GENERIC_X64/097-retired-rescue-masks`, hunk `@@ -0,0 +1,20 @@`.

That is the requested removal mechanism rather than an attempted repair of nonexistent runtime units. However, the drop-in cleanup is broader than the demonstrated legacy footprint: **G-F1-09**. F1a/F1b in [S2] model the intended removal, but no new-image journal or `vm-qa` results are embedded. The zero-error journal and all-suite acceptance cannot be closed here.

### PL-022 — **holds in part**

[S1] deletes all seven listed files under `packages/hardware/quirks/platforms/GENERIC_X64/`, exactly the requested source-tree removal.

F1c in [S2] checks for the orphan tree. The installing recipe and actual `pkgcheck` output are not embedded, so “installed set unchanged” and `pkgcheck` success remain unverified rather than confirmed from the report.

### PL-023 — **holds in part**

In `serial-debug-shell.service`, hunk `@@ -1,13 +1,26 @@`, [S1] adds the non-trigger condition:

```ini
ConditionVirtualization=vm
```

It retains the `|console=ttyS0` alternatives and correctly moves `IgnoreOnIsolate=yes` into `[Unit]`. These are the named mechanisms.

The actual D-QA-053 register row and guest `ConditionResult=yes` are not embedded. F1d checks source text, not systemd’s runtime evaluation. Those acceptance receipts remain outstanding.

### PL-033 — **holds for the named read-only-verb defect**

In `generic-x64-vm`, [S1] removes socket unlinking and vars-file creation from command construction. Hunk `@@ -626,12 +749,13 @@` calls `prepare_run()` only in the `run` branch, after the `qemu-args` printing branch.

F1f in [S2] meaningfully checks preservation of socket paths and absence of a newly created vars file. This addresses the original destructive print operation. The additional claim that `run` refuses symlinks does **not** hold: **G-F1-01**.

### PL-034 — **holds in part**

In `092-retroarch-surface`, hunk `@@ -13,18 +13,73 @@`, [S1] adds `.fullscreen-surface` and follows dimensions matching the record. This implements the detailed verdict’s marker alternative, though not the plan’s literal per-device append-overlay proposal.

Ordinary recorded mode changes are covered by F1g. Ownership is nevertheless misclassified in several cases, and interrupted writes can permanently stop automatic following: **G-F1-02** and **G-F1-04**.

The rehearsal checks selected configuration lines, not an unchanged complete player configuration, and no execution of the new rehearsal is embedded.

### PL-042 — **holds at source level**

[S1] removes `098-dbus-fd-improvements` and `099-mount-configuration-fixes`, including the offending `f /run/dbus/system_bus_socket` and `d /run/systemd/journal/socket` rules. The new retirement script removes their persistent `tmpfiles.d` files by name.

This satisfies “gone with the quirk set.” Whether already-applied effects remain during the first upgraded boot is a runtime boundary, not established by the sandbox fixture.

### PL-073 — **holds for the selected deletion alternative**

[S1] deletes `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh`, hunk `@@ -1,34 +0,0 @@`. That meets the acceptance’s explicit “or the script is gone” branch.

F1e contains checks for init’s missing-updater handling and independent boot-hint write, but init itself and an execution receipt are not embedded. The final built image must still demonstrate that the updater is absent, particularly given [S4]’s warm-build warning.

**Supplemental PL-076:** although not a punch item in [S3], its source change is visible: [S1] removes `core_updater_buildbot_url` from the GENERIC_X64 RetroArch profile. The claimed F1j test and the RetroArch consumer establishing that the key is ignored are not supplied.

## 2. Findings

### G-F1-01: Socket-path resolution bypasses the promised symlink refusal

- **Severity:** Medium
- **Category:** Guards fail closed / host-state protection
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm`, [S1], hunk `@@ -79,51 +81,134 @@`, `run_paths()` and `claim_socket_path()`.
- **What:** `claim_socket_path()` says it refuses symlinks, but its callers have already resolved them:
  ```python
  serial = Path(args.serial).resolve() if args.headless else None
  return vars_path, Path(args.monitor).resolve(), serial
  ```
  Consequently, `os.lstat(path)` examines the resolved target, not the supplied symlink.
- **Failure scenario:** `--monitor` names a symlink to another guest’s live monitor socket. The resolved target is a socket, so `path.unlink()` removes that other guest’s monitor pathname. The original symlink remains dangling. This does not kill existing connections, but prevents new connections through that pathname.
- **Evidence:** No check of the unresolved final path component appears before `.resolve()`. F1f tests a regular qcow2 at the monitor path, not a symlink to a socket. Validate the supplied path before following its final component, and add the symlink case.

### G-F1-02: RetroArch still mistakes dimension values for ownership

- **Severity:** Medium
- **Category:** Upgrade path / preservation of owner settings
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/092-retroarch-surface`, [S1], hunk `@@ -13,18 +13,73 @@`, the `OURS` decision.
- **What:** A mismatch with an existing ownership record does not protect an owner’s edit. The subsequent shipped-value branch accepts `0|640` and `0|480` even when a record exists.
- **Failure scenario:** The record says `1280x800`. The owner changes the configuration to `640x480`, then boots at `1280x800`. The record comparison fails, but the shipped-value branch sets `OURS=yes` and overwrites the edit.
  
  Markerless migration has the opposite ambiguity too: a hand-set `1280x800` is adopted as generated, while an old quirk-generated `1920x1080` is not adopted if the first updated boot uses `640x480`.
- **Evidence:** The shipped-value branch has no “record absent” condition. The markerless branch recognizes only the current mode or `1280x800`; the deleted implementation could generate any matching numeric mode. F1g tests a hand-set `1024x768` and legacy-generated `1280x800`, leaving these collisions untested. [S6] explicitly requires honest attribution of existing state.

### G-F1-03: Canonical-looking manual SSH overrides are still overwritten or deleted

- **Severity:** Medium
- **Category:** Configuration ownership / incomplete fix
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh`, [S1], hunk `@@ -9,22 +9,49 @@`, `ours()`.
- **What:** With no record, ownership is inferred from a command’s shape:
  ```sh
  grep -Eq '^ssh -L 53682:localhost:53682 -p [0-9]+ root@127\.0\.0\.1$' "${TARGET}"
  ```
  That shape is also a valid manually supplied command.
- **Failure scenario:** A tester using their own host-side forward writes:
  ```text
  ssh -L 53682:localhost:53682 -p 2222 root@127.0.0.1
  ```
  No record exists. With no fw_cfg port, the next boot deletes the manual file; with a supplied port, it replaces the command.
- **Evidence:** The README now promises persistence for a manually written full SSH command without excluding this form. F1h’s manual fixture uses `root@192.168.64.5`, so it cannot expose the collision. No independent ownership signal distinguishes a new manual command from legacy generated text. Separate generated state from the manual override, or otherwise resolve this ambiguity explicitly.

### G-F1-04: Interrupted writes can permanently detach generated state from its record

- **Severity:** Medium
- **Category:** Migration interruption / last-known-good state
- **Where:** [S1]:
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/092-retroarch-surface`, hunk `@@ -13,18 +13,73 @@`;
  - `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh`, hunk `@@ -9,22 +9,49 @@`.
- **What:** Both scripts publish the configuration and its ownership record separately. Neither write path provides recovery for interruption between them. Record publication is also not gated on confirmed success of the preceding configuration update.
- **Failure scenario:** SSH target and record initially contain port `10022`. A boot changes the target to `10023`, then stops before updating the record. Future boots see a mismatch, classify the generated target as manual, and leave the stale command even after the forward disappears.
  
  RetroArch similarly becomes stuck after its cfg changes to a non-shipped size while its old record remains.
- **Evidence:** SSH’s target `echo … && mv …` is followed by an independent record block. RetroArch’s `sed -i` is followed by an independently written record. No pending transition or recovery state is shown. F1g/F1h exercise uninterrupted runs only. Per [S5]/[S6], test interruption between publications and failed configuration writes; checking each individual rename is insufficient.

### G-F1-05: Existing OVMF vars bypass the new firmware-pair protection

- **Severity:** Medium
- **Category:** Already-written state / incomplete guard
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm`, [S1], hunks `@@ -79,51 +81,134 @@` and `@@ -216,13 +298,13 @@`.
- **What:** `find_ovmf_pair()` pairs the code image with a template, but `prepare_run()` preserves any existing vars file without a compatibility check:
  ```python
  if not vars_path.exists():
      shutil.copyfile(vars_template, vars_path)
  ```
  QEMU then receives that existing file as writable pflash.
- **Failure scenario:** The old independent searches created a vars store from the wrong firmware family. The developer supplies or installs a correct pair to remedy the problem. The new launcher selects the corrected template but silently keeps using the inherited incompatible store.
- **Evidence:** The changed preparation path contains neither validation nor a recovery/refusal path for an existing store. F1f’s firmware probes explicitly remove `probe-vars.fd`, excluding this case. A paired-template test therefore does not prove a paired running configuration. Preserve legitimate firmware state, but detect incompatible inherited state and provide a safe recovery path rather than blindly replacing it.

### G-F1-06: UTM publication overrides a restrictive umask

- **Severity:** Medium
- **Category:** Security / archive permissions
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm`, [S1], hunk `@@ -479,19 +576,32 @@`.
- **What:** The new publication path unconditionally executes:
  ```python
  os.chmod(temporary_output, 0o644)
  ```
  This discards the caller’s restrictive file-creation policy before replacing the output.
- **Failure scenario:** A developer bundles a populated guest under `umask 077` in a directory other accounts can traverse. The resulting archive has mode `0644`, despite the caller expecting private output. Replacing an existing private archive also replaces its permissions.
- **Evidence:** The former `ZipFile(..., "w")` creation used normal creation permissions subject to umask; the new explicit chmod overrides that restriction. No option or permission-preservation check is shown. F1f checks archive member names, not output permissions. This is a permissions regression, not a claim that any particular credentials were exposed.

### G-F1-07: Port truncation converts invalid input into a different valid endpoint

- **Severity:** Low
- **Category:** Input validation / fail-open normalization
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh`, [S1], hunk `@@ -9,22 +9,49 @@`.
- **What:** The new `head -c 5` truncates before range validation:
  ```sh
  PORT=$(tr -cd '0-9' < "${FWCFG}" | head -c 5)
  ```
- **Failure scenario:** fw_cfg contains `100000`. The script converts it to `10000`, accepts it, and advertises port `10000` instead of rejecting the supplied value.
- **Evidence:** The bounds check sees only the truncated token. No original-length check appears. F1h tests `10022`, `10023`, and absence, not overlong values. The launcher’s new argparse check does not validate fw_cfg supplied through other QEMU/UTM argument paths. Reject an invalid complete token rather than changing its meaning.

### G-F1-08: The UTM temporary-file assertion cannot see the new temporary files

- **Severity:** Low
- **Category:** Test adequacy / false assurance
- **Where:** [S2], F1f’s UTM publication check in the embedded `tools/last-good-scripts-test` block; corresponding implementation in [S1], `build_utm()`, hunk `@@ -479,19 +576,32 @@`.
- **What:** The implementation creates hidden names such as `.bundle.zip.<random>.partial`, but the “no temporary of its own” assertion uses:
  ```sh
  ls "${F1V}" | grep -E '^bundle\.zip\..+' | grep -v '^bundle\.zip\.tmp$'
  ```
- **Failure scenario:** A `.bundle.zip.leaked.partial` file remains. `ls` omits it, and the regex would reject its leading dot anyway. The cleanup assertion passes.
- **Evidence:** The implementation’s prefix is `f".{output.name}."`; neither `ls -A` nor a matching hidden-file pattern appears in this assertion. The separate `<output>.tmp` preservation check remains meaningful; the temporary-leak claim does not. Add a constructed leftover and a failed archive-write case to prove sensitivity.

### G-F1-09: Retirement cleanup removes more drop-in names than the demonstrated legacy writers produced

- **Severity:** Low
- **Category:** Migration scope / owner-file preservation
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/091-retired-vm-fixes`, [S1], hunk `@@ -0,0 +1,35 @@`.
- **What:** The loop applies three filenames to each of six units: eighteen deletion targets. The embedded old writers account for nine combinations, not that Cartesian product.
- **Failure scenario:** An owner has `weston.service.d/10-generic-x64.conf`. The supplied old scripts wrote Weston’s `10-vm-config.conf`, not that file, but the new cleanup deletes it anyway.
- **Evidence:** The old `091-systemd-fixes` and `092-vm-service-fixes` contents are available in their deletion hunks. No producer for the additional nine combinations appears there. The new script promises that other files are untouched, while F1b’s owner fixtures do not cover these extra deletion targets. Use the exact demonstrated path list, or verify ownership before deleting additional names.

## 3. Sweep spot-checks

These assessments concern visible mechanisms, not claimed test executions.

| Reported fixed row(s) | Assessment against the diff |
|---|---|
| **7 / gpt / F-VM-11** — dependent qcow2 bundles | **Mechanism holds.** [S1], `@@ -463,6 +545,21 @@`, rejects both backing-file fields and qcow2 external data files before archive creation. F1f constructs both types of input. |
| **7 / gpt / F-VM-12** — concurrent archive publication | **Core mechanism holds.** Unique `mkstemp` output beside the destination followed by `os.replace` removes the fixed-name collision. Permission regression and inadequate leak assertion remain: G-F1-06/08. |
| **7 / gpt / F-VM-13** — commas in QEMU paths | **Transformation is visible.** `qemu_opt()` doubles commas for the changed drive and socket strings. F1f checks emitted text only; actual QEMU interpretation, especially legacy `unix:` monitor/serial syntax, is not proven by the shim. |
| **7 / gpt / F-VM-14** — ARM KVM | **Mechanism holds.** `auto_accel()` requires `x86_64`/`amd64` as well as accessible `/dev/kvm`; otherwise it returns TCG. The module probe exercises both architectures. |
| **7 / gpt / F-VM-15** — Linux disk floor | **Mechanism holds.** `qemu_command()` compares virtual size against the profile before run preparation and rejects undersized disks. The actual profile is not embedded. |
| **7 / claude / F-VM-14** — launcher hygiene | **Partial.** Explicit SSH-port range validation and paired template selection are visible. Socket-symlink and inherited-vars cases remain: G-F1-01/05. |
| **7 / claude / F-VM-10** and **7 / gpt / F-VM-09** — display selection | **Connected-output/interlace changes hold.** The quirk skips disconnected connectors and strips the trailing `i`. Ownership and interruption problems remain: G-F1-02/04. |
| **7 / claude / F-VM-11** — Vulkan default | **RetroArch source change holds.** [S1] changes the shipped driver to `gl`; the quirk migrates `vulkan` when the two searched ICD directories contain no JSON. Actual image driver contents and other emulators’ absence are not independently established. |
| **7 / claude / F-VM-05** and **7 / gpt / F-VM-10** — manual SSH command | **Partial.** Nonmatching commands are preserved, but valid manual commands matching the legacy shape are not: G-F1-03. |
| **7 / gpt / F-VM-16** — UTM switched to Bridged | **Documentation mitigation only.** The README explicitly says the stale injection remains until the tester removes it. The diff does not make mode changes automatically safe. Closing this as an operational workaround requires an explicit decision; it is not a behavioral repair. |
| Follow-up **7 / claude / F-VM-08 and F-VM-16** | [S1] visibly blanks the Mupen controller name, removes the stray Retroid section header, and removes Flycast’s fixed width/height. The reported m8c deletions and F1i checks are absent from this packet. |

### Withdrawals

- **Duplicate/removal dispositions** for the orphan tree, rescue writer, and deleted kernel-fragment writer are supported by the deletion hunks.
- **Shared-recipe rows F-EM-14 and F-PB-25:** the ownership boundary in [S3] supports handing them outside F1. It does not establish that another stream resolved them.
- **“Not in SYSTEM” withdrawals** for Cemu, RPCS3, xemu, Dolphin, and Supermodel cannot be confirmed without the image inventory and relevant packaging evidence.
- **F-RW-04’s upstream-convention justification** cannot be checked against fourteen other profiles or upstream AMD64 from this packet. Its armhf-key portion is visibly superseded by the follow-up deletion.
- **F-VM-13’s kernel-command-line withdrawal** is unproven here. Neither the kernel configuration nor its command-line handling is embedded. An absence of `root=`/`init=` handling in a userspace parser would not, by itself, settle their earlier interpretation.
- **Fixed `/tmp` paths:** references from other tools explain compatibility pressure, not exclusive ownership of those paths. The supplied material does not establish a runtime guard against another live socket using a default path.

I found no separate player-outcome vocabulary defect in the added text. The new launcher diagnostics are developer CLI text in the QA-tool scope established by [S3], not cloud-operation outcomes governed by [S8].

## 4. Coverage boundary and requests to the orchestrator

1. **No execution receipts are embedded.** [S4] reports PASS counts and old-tree failures; [S2] supplies test source, not those observations. I cannot validate execution success, ordering of test-first work, busybox selection, or `pkgcheck` results. This distinction follows [S5] and [S7].
2. **The follow-up packet is incomplete.** [S4] reports F1i/F1j and 432 PASS lines, but [S2] ends at F1h. The reported m8c changes are not present in [S1]. Obtain those exact follow-up hunks and checks before accepting those closures.
3. **Build and boot acceptance remain open.** Obtain the built-image inventory, new-guest journal, `vm-qa` results, serial unit condition result, and upgrade-rehearsal results. The sandbox does not prove first-upgraded-boot systemd state, including already-applied tmpfiles/sysctl effects or cached masks.
4. **Important consumers are outside the supplied hunks.** These include the complete launcher helpers/profile, init and bootloader lookup, package recipes, RetroArch launch/configuration consumers, and the emulator source used to justify withdrawals. Their behavior is not certified here.
5. **Marker backup/restore behavior is unproven.** Placing a hidden record beside a cfg does not itself prove that the settings backup carries and restores both. The relevant backup implementation or an archive/restore artifact is needed.
6. **D-QA-053 is referenced, not supplied.** The actual decision-register row is needed to complete PL-023’s register acceptance.

## 5. `corpus.provenance.json`

The three source arrays below correspond by index. Hashes are the Facilitator’s **verified-at-embed-time** values; they were not recomputed by this auditor.

```json
{
  "corpus_access": "Embedded prompt contents only; no filesystem access",
  "hash_algorithm": "sha256",
  "hash_authority": "Council Facilitator, verified at embed time; not independently recomputed by this auditor",
  "manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.harness.txt",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/F1.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "2f6b7afb593f97fb6702d2098e96ec2f13fc652b1f58e63b5586bc33183159ec",
    "bbe23df86b7480986345a754a7179dce6ada39fbbae946c35a09e3fa852969f7",
    "21f9ebbae6912c3b7aaa038b58830b4050a95c46ad7e9da31c973b24cc73ddb1",
    "50af740143d112297e6df93a0c99203d33b86a85613c21ccd4b5b3d5f0cd2e83",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7"
  ],
  "independent_execution_performed": false,
  "missing_sources_or_artifacts": [
    "F1i and F1j harness sections described in S4",
    "m8c follow-up changes described in S4 but absent from S1",
    "Raw harness, old-tree, pkgcheck, and systemd verification execution receipts",
    "Built-image inventories and VM clean-install and upgrade acceptance artifacts",
    "Complete launcher helpers and profile, package recipes, init and bootloader lookup consumers",
    "RetroArch and standalone-emulator consumers cited to justify report withdrawals",
    "Settings backup and restore evidence showing ownership records travel with their configurations",
    "The actual D-QA-053 row in docs/decision-register.md"
  ]
}
```
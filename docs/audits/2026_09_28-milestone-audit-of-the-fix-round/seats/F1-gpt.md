# F1 audit — whole fix round

**Verdict: F1 is not ready for unconditional acceptance closure.** The diff fixes several concrete defects, including `qemu-args` mutation, leaf-symlink removal, restrictive-umask handling, and the record/write interruption window. It still has counterexamples involving configuration ownership, one-time retirement markers, and socket cleanup.

I identify **four Medium findings and two Low findings** below.

This is a static review of the embedded corpus. I did not access files, recompute hashes, or execute tests. The reported **447 PASS lines** and **38 old-tree failures** are the stream’s claims, not independently observed results. [S2]

**Citation convention:** `[S1]` through `[S10]` identify the exact declared paths and Facilitator-verified embed-time SHA-256 values in `corpus.provenance.json` at the end. Target-file paths and hunk headers locate evidence *inside* S1; they are not claims of separately reading those files.

## 1. Punch-item verdicts

Acceptance criteria are from S4. “Holds” below is a verdict about the visible mechanism, not a claim that a candidate image passed runtime testing.

| Item | Verdict | Evidence and remaining boundary |
|---|---|---|
| **PL-019** | **Holds in part** | S1 deletes the retired QEMU writers and `097-disable-rescue-completely`. The two new retirement scripts remove inherited files and masks. The F1a/F1b harness cases exercise a read-only-image fixture and inherited `/storage` state. However, the required **guest journal count and all-suite VM PASS are absent**; S2 explicitly delegates them. Retirement also has the counterexamples in G2-F1-01/02. Locators: new `091-retired-vm-fixes`, `@@ -0,0 +1,59 @@`; new `097-retired-rescue-masks`, `@@ -0,0 +1,35 @@`; harness F1a/F1b. [S1, S2] |
| **PL-022** | **Holds in part** | All seven files under `packages/hardware/quirks/platforms/GENERIC_X64/` are deleted. That satisfies the source-tree deletion. The recipe establishing that this tree was uninstalled is not embedded, and the `pkgcheck` result is reported rather than supplied as output. The installed-set claim must be considered specifically for this orphan-tree deletion, not for F1 as a whole, which deliberately changes installed quirks. [S1, S2] |
| **PL-023** | **Holds in part** | `serial-debug-shell.service`, `@@ -1,13 +1,26 @@`, adds plain `ConditionVirtualization=vm` alongside the trigger console conditions. `IgnoreOnIsolate=yes` moves into `[Unit]`. The mechanism is visible. The required guest `ConditionResult=yes` and the actual D-QA-053 register row are not embedded; mentioning D-QA-053 in a comment does not establish the register entry. [S1] |
| **PL-033** | **Holds** | In `generic-x64-vm`, the shown socket deletion and vars creation move into `prepare_run()`. At `@@ -626,12 +769,13 @@`, `qemu-args` only prints; only the `else` branch calls `prepare_run()`. The old serial and monitor unlink calls are removed from command construction. F1f checks that printing leaves socket nodes and creates no vars file. This resolves the named print-verb mutation; it does not make `run` cleanup safe for live sockets—G2-F1-04. [S1] |
| **PL-034** | **Holds in part** | `092-retroarch-surface`, `@@ -13,18 +13,98 @@`, records generated sizes and follows subsequent modes for recorded values. F1g exercises repeated mode changes and a hand-set `1024x768`. But equality still grants ownership to some hand-set values; an unrecorded old size first encountered at a different mode is deliberately stranded. See G2-F1-03. The rehearsal asserts the fullscreen pair and the intended driver change, not whole-file identity, and was not run. [S1, S2] |
| **PL-042** | **Holds** | The deleted `098-dbus-fd-improvements` and `099-mount-configuration-fixes` contain the offending `f /run/dbus/system_bus_socket` and directory-at-journal-socket rules. Their inherited configuration filenames are explicitly listed in `091-retired-vm-fixes`. The source-generation defect is removed. Reintroduced inherited state can nevertheless escape cleanup after a completed migration—G2-F1-01. [S1] |
| **PL-073** | **Holds** | `projects/ROCKNIX/devices/GENERIC_X64/bootloader/update.sh`, `@@ -1,34 +0,0 @@`, is deleted, satisfying the permitted deletion alternative. F1e additionally checks the init-source contract. The assembled SYSTEM still needs inspection: S2 warns that a warm build can retain the old installed copy unless the owning package rebuilds. [S1, S2] |
| **PL-076** | **Holds** | The GENERIC_X64 RetroArch profile, `@@ -111,7 +111,6 @@`, deletes `core_updater_buildbot_url = ".../armhf/latest/"`. F1j checks its absence. The broader claim that the pinned RetroArch ignores that key is not independently established by this packet, but deletion of the named line is. [S1] |

## 2. Review of the first audit’s findings

The two seats’ IDs are independent. These verdicts assess the claimed answers listed in S3, against S1—not against the report’s status labels.

### Claude-seat findings

| Finding | Verdict | What the current diff establishes |
|---|---|---|
| **G-F1-01 — packet coherence** | **Answered** | The current packet contains the m8c deletions, flycast/mupen edits, and harness sections **F1i/F1j**. The earlier omission no longer applies to this packet. This does not independently verify the reported test totals. [S1, harness `@@ -3011,4 +3011,608 @@`] |
| **G-F1-02 — ownership/scope** | **Answered in part** | No VirtualBox `091-vbox-graphics` deletion appears in this diff. The emulator-config and tool-comment edits do appear. The claimed coordinator reassignment and F2 ancestry are not embedded, so authorization and merge history cannot be adjudicated from the original plan plus this report alone. [S1, S2, S5] |
| **G-F1-03 — surface ownership, parts a–e** | **Answered in part** | The no-record heuristic is narrower, and the ICD probe now includes `/usr/local/share` and root’s loader directories. The shipped-value exception remains unconditional; matching-current-mode values are still adopted without provenance. The report acknowledges leaving other unrecorded/restored values alone. G2-F1-03 remains applicable. [S1, `092-retroarch-surface`, `@@ -13,18 +13,98 @@`] |
| **G-F1-04 — invisible temporary files** | **Answered** | `f1_partials()` uses `ls -A` and a dot-leading pattern. A planted `.probe.zip.leaked.partial` proves visibility. The failed-archive case also checks for leftovers. [S1, harness F1f] |
| **G-F1-05 — attribution and perpetual take-back** | **Answered in part** | Stamps stop repeated cleanup after completion, and stderr messages record removals. That resolves perpetual removal of masks made afterward. It does **not** establish ownership on the first cleanup, and the stamps introduce the rollback/reappearance gap in G2-F1-01. [S1, new retirement-script hunks] |
| **G-F1-06 — truncated port** | **Answered for the named truncation** | The `head -c 5` behavior is gone; six digits such as `100000` are rejected by the length check. Filtering invalid characters into a different valid port remains—G2-F1-05. [S1, `095-cloud-ssh`, `@@ -9,23 +9,68 @@`] |
| **G-F1-07 — names-only second-boot comparison** | **Answered** | `f1_state()` records file-content hashes and symlink targets, and F1b compares that state across the next pass while also requiring an empty journal. The assertion no longer compares names alone. [S1, harness F1b] |
| **G-F1-08 — documentation-only UTM mitigation** | **Answered in part** | The README now explicitly says a switched bundle retains its `-fw_cfg` entries and displays a non-working loopback command until the tester removes them. That documents the failure; it does not correct it automatically. The claimed boot-order reason for rejecting a mechanism is outside the diff. Accepting the withdrawal therefore remains an orchestrator decision, not a demonstrated technical closure. [S1, VM README `@@ -75,11 +86,18 @@`; S2] |
| **G-F1-09 — rehearsal readiness** | **Answered in part** | The new `AUTOSTARTED=no`/`yes` variable and `check ... "$AUTOSTARTED" "yes"` make an exhausted wait fail. The producer of `Autostart complete` and the boot-log reset/lifetime are not embedded, so this packet cannot establish that a matching line necessarily belongs to the new boot. [S1, rehearsal `@@ -98,6 +123,16 @@`] |

### GPT-seat findings

| Finding | Verdict | What the current diff establishes |
|---|---|---|
| **G-F1-01 — resolved socket symlink** | **Answered** | Socket paths use `Path(os.path.abspath(...))`, not `resolve()`, and `claim_socket_path()` uses `os.lstat()` before rejecting a leaf symlink. The new fixture supplies a symlink to another socket and requires both to remain. [S1, launcher `@@ -79,51 +81,150 @@`; harness F1f] |
| **G-F1-02 — dimensions mistaken for ownership** | **Answered in part** | The unconditional adoption of an unrecorded old QEMU-sized value at a different current mode is gone. Adoption by current-value equality and the shipped-value exception remain. Documentation of that choice does not satisfy preservation of all hand-set dimensions. See G2-F1-03. [S1, surface hunk] |
| **G-F1-03 — canonical-looking manual SSH override** | **Answered in part** | An unrecorded command on a different port is now preserved. But an unrecorded manual command equal to this boot’s generated command is adopted, then can be replaced/deleted on a later boot. That is still a canonical-looking manual override counterexample. See G2-F1-03. [S1, SSH hunk, `ours()`] |
| **G-F1-04 — interruption between record and value** | **Answered** | Both scripts write a record recognizing **old and new** values before changing the target, then narrow it after read-back. The kill shims exercise interruption after target publication. This addresses the visible process-interruption window; it is not a hard-power-loss durability proof. [S1, surface/SSH hunks; harness F1g/F1h] |
| **G-F1-05 — existing foreign vars store** | **Answered for the demonstrated size mismatch** | `qemu_command()` refuses an existing vars store whose size differs from the selected template, names it, and leaves it untouched. The test covers a 128 KiB store against a 528 KiB template and a matching-sized store. Size is not proof of firmware-build identity, but the reported mismatch case is covered. [S1, launcher `@@ -79,51 +81,150 @@`] |
| **G-F1-06 — archive ignores umask** | **Answered** | Publication uses `os.chmod(temporary_output, 0o666 & ~umask)`. F1f includes `umask 077` and expects mode `600`. [S1, launcher `@@ -479,19 +592,36 @@`] |
| **G-F1-07 — port normalization by truncation** | **Answered for the named truncation** | The six-digit case is rejected instead of cut to five. The remaining destructive normalization is separately identified in G2-F1-05. [S1, SSH hunk; harness F1h] |
| **G-F1-08 — temporary-file assertion** | **Answered** | Same demonstrated correction as Claude G-F1-04: dotfiles are visible, a planted positive exists, and an archive-write exception is exercised. [S1, harness F1f] |
| **G-F1-09 — overly broad drop-in deletion** | **Answered** | The directory/name cross-product is replaced by sixteen explicit paths. F1b plants `weston.service.d/10-generic-x64.conf`, a name the retired writers did not create, and requires it to survive. This closes the overbroad-name issue, not the same-name ownership issue in G2-F1-02. [S1, `091-retired-vm-fixes`, `@@ -0,0 +1,59 @@`; harness F1b] |

## 3. Findings

The scenarios below are derived from the visible code; they were not executed during this review.

### G2-F1-01: One-time stamps strand retired state after a rollback

- **Severity:** Medium
- **Category:** Newly introduced migration regression / already-written state
- **Where:**  
  `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/091-retired-vm-fixes`, `@@ -0,0 +1,59 @@`;  
  `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/097-retired-rescue-masks`, `@@ -0,0 +1,35 @@`.
- **What:** Both migrations stop solely because a completion stamp exists. They never inspect whether retired state has subsequently returned.
- **Failure scenario:** A guest runs the fixed build, completes cleanup, and receives both stamps. It then boots an older build whose quirks recreate the old files/masks, and returns to the fixed build while keeping `/storage`. Both new scripts exit before inspecting those artifacts. The retired rules and rescue masks remain indefinitely. Reintroducing old settings while retaining the stamps has the same shape.
- **Evidence:** Both complete new scripts begin with `[ -e "${STAMP}" ] && exit 0`. The deleted legacy scripts show the writers that can put the state back. There is no build-transition check, artifact fingerprint, or stamp invalidation before this return. The rehearsal explicitly removes both stamps before seeding, so it cannot detect this sequence. S2 acknowledges the downgrade limitation and prescribes manual stamp removal; that is a recovery instruction, not automatic migration handling. [S1; S2, Follow-up 2; S7, “Fixing forward is not enough”]
- **Correction/test:** Add a completed-migration → old-state-reintroduced → fixed-build case **without deleting the stamps**. Either implement a safe repeat-migration policy or obtain an explicit restriction on supported rollback/restore histories before treating the migration as complete.

### G2-F1-02: The first take-back still deletes owner-modified files

- **Severity:** Medium
- **Category:** Migration attribution / configuration loss
- **Where:**  
  `projects/ROCKNIX/packages/hardware/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/091-retired-vm-fixes`, `@@ -0,0 +1,59 @@`;  
  `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/097-retired-rescue-masks`, `@@ -0,0 +1,35 @@`.
- **What:** Exact filenames bound the cleanup’s scope, but do not establish that the present contents still belong to the retired writer. The first run deletes any existing file at a listed path. The mask migration likewise cannot distinguish an owner’s pre-existing `/dev/null` mask from a generated one.
- **Failure scenario:** Before the first fixed boot, an owner edits `/storage/.config/tmpfiles.d/20-x64-fd-improvements.conf` to contain their own rules. No retirement stamp exists. The migration removes the entire file, without preserving its changed contents. An owner-created `emergency.target` mask present before the first take-back is also removed.
- **Evidence:** The file loop performs only an existence check before `rm -f "${C}/${f}"`. `masked()` checks only the link type and `/dev/null` target. I found no comparison with legacy contents, retained copy, or other provenance check in either complete new script. F1b tests owner files at **different** names and a mask created **after** the stamp; neither tests this case. [S1; S7, “Migrations”]
- **Correction/test:** Test a changed file at an exact retired filename and an owner mask present before cleanup. Preserve or quarantine unverified contents rather than equating a historical pathname with present ownership.

### G2-F1-03: Matching a generated value is still treated as ownership

- **Severity:** Medium
- **Category:** Incomplete ownership fix / preservation of manual settings
- **Where:**  
  `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/092-retroarch-surface`, `@@ -13,18 +13,98 @@`;  
  `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh`, `@@ -9,23 +9,68 @@`.
- **What:** Both scripts create authoritative ownership records from equality with a value they would generate. Making no change on the adoption boot does not make future overwrites safe.
- **Failure scenario:**
  1. A tester intentionally sets an unrecorded `1280x800` RetroArch surface. The first fixed boot is also `1280x800`, so the script records ownership. A later `640x480` boot overwrites the tester’s setting.
  2. With an existing record for `1280x800`, the tester explicitly sets `640x480`; the shipped-value branch overrides it anyway. The implementation also admits mixed pairs `640x0` and `0x480`, beyond the comment’s two named pairs.
  3. A tester’s manual SSH override exactly equals the command for the current injected port. It acquires a generated record. A later boot without that injection deletes it—even if the tester still maintains that endpoint through their own forwarding.
- **Evidence:** Surface adoption uses `[ ! -f "${RECORD}" ] && [ "${SIZE}" = "${WANT}" ]`; its shipped-value branch independently accepts each axis from `{0,640}` and `{0,480}`. SSH ownership without a record is `[ -n "${CMD}" ] && [ "${LINE}" = "${CMD}" ]`, after which the matching command is recorded. No independent provenance or explicit adoption decision is required. Several tests expressly bless this adoption, rather than proving preservation of manual-but-equal values. [S1, F1g/F1h]
- **Correction/test:** Preserve unknown ownership or introduce an explicit automatic/manual ownership mechanism. A separate generated overlay, as the original PL-034 plan proposed, would avoid using the player’s value as the ownership signal. This is not a request to guess old intent more cleverly; the current information cannot establish it. [S5, PL-034; S7, “Attribute honestly”]

### G2-F1-04: Socket cleanup assumes every socket is stale

- **Severity:** Medium
- **Category:** Incomplete host-state protection / destructive preparation
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm`, `@@ -79,51 +81,150 @@`, `claim_socket_path()` and `prepare_run()`.
- **What:** The type guard protects files and leaf symlinks, but a socket node is not evidence that its owner has exited. Cleanup also mutates the monitor path before validating the serial path.
- **Failure scenario:** Guest A is running with monitor socket `A.sock`. A launch for another valid disk is given `--monitor A.sock`. Cleanup removes A’s live socket pathname, breaking new connections to A’s monitor. In a headless preparation where the subsequent serial path is a regular file, cleanup then raises an error: the new guest does not start, but A’s monitor pathname has already been removed.
- **Evidence:** After `stat.S_ISSOCK(mode)`, the next action is unconditional `path.unlink()`. `prepare_run()` calls `claim_socket_path()` sequentially for monitor and serial, before vars creation. There is no owner/liveness check or all-path validation phase in these functions. The fixtures created by `f1_sock()` bind and close immediately; they are stale nodes, so they do not test the live-owner distinction. Multiple concurrent guests are an explicit use case in S10. [S1, harness F1f; S10]
- **Correction/test:** Establish ownership/staleness before cleanup and validate all preparation inputs before unlinking anything. Add an isolated fixture with an active socket owner, plus a launch rejected on its second path, and require the first pathname to survive.

### G2-F1-05: fw_cfg validation still accepts corrupted port strings

- **Severity:** Low
- **Category:** Fail-open input normalization
- **Where:** `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-ssh`, `@@ -9,23 +9,68 @@`, the `RAW`/`PORT` block.
- **What:** Validation applies to a digit-filtered derivative, not to the supplied port token. Non-digits are silently removed and can produce a different valid endpoint.
- **Failure scenario:** fw_cfg contains `10x022` or `-2222`. The script advertises port `10022` or `2222`, respectively, rather than treating the input as invalid. A recorded automatic command can consequently be replaced with an endpoint the input did not validly specify.
- **Evidence:** `RAW=$(tr -cd '0-9' < "${FWCFG}")` executes before the length/range checks. The adjacent comment promises that “anything else” is no port, but no check rejects removed non-digit bytes. F1h covers `100000`, not a token whose invalid characters disappear. [S1]
- **Correction/test:** Remove only protocol-defined terminators, then validate the entire remaining token. Add negative cases containing a sign, an embedded letter, and separated digit groups. [S6, “Guards must fail closed”]

### G2-F1-06: The UTM refusal test can pass without its fixture

- **Severity:** Low
- **Category:** Harness false assurance / unchecked setup failure
- **Where:** `tools/last-good-scripts-test`, `@@ -3011,4 +3011,608 @@`, F1f’s backing-file/external-data-file UTM checks.
- **What:** The setup does not assert successful creation or inspect the dependency metadata. The test then accepts any nonzero launcher result with no output archive.
- **Failure scenario:** The host’s `qemu-img create -o data_file=...` fails, leaving no `datafile.qcow2`. `utm` rejects the missing input, and the test reports success for the external-data-file guard. It would still pass if that guard were removed, provided the overlay guard remained intact.
- **Evidence:** Both dependency-bearing `qemu-img create` calls discard output and have no checked result. The assertion is only nonzero `F1_U1`/`F1_U2` plus absent output files; it checks neither fixture metadata nor the reason for refusal. I found no positive fixture assertion between creation and invocation. [S1]
- **Correction/test:** Assert creation success, verify `qemu-img info` contains the expected backing/data-file property, and require the corresponding refusal message. A setup failure must fail the test as setup failure. [S6, “Guards must fail closed”]

## 4. Sweep spot-checks

The following checks cover more than the required five fixed rows.

| Sweep row | Diff-based assessment |
|---|---|
| **Claude F-VM-08 — copied handheld configuration** | The mupen Control1 name changes to `""`; the pasted Retroid section header/settings are removed; the three Anbernic m8c files are deleted. These edits are visible, and F1i checks the name and remaining m8c filenames. The claimed pinned-plugin semantics and absence of other emulators from SYSTEM require external artifacts. [S1, mupen/m8c hunks] |
| **Claude F-VM-10 / GPT F-VM-09 — connector/mode selection** | The script requires `status=connected`, selects that connector’s first mode, and strips a terminal `i`. F1g covers a disconnected first connector and interlacing. This proves the new selection rule, not that every compositor configuration will select the same mode. [S1, surface hunk] |
| **Claude F-VM-11 — Vulkan default** | The shipped profile changes to `gl`; the quirk conditionally migrates a `vulkan` line when no ICD JSON exists in the listed directories. This mechanism is present. Actual image contents and a launch without a test-side driver override are not supplied. [S1, RetroArch `@@ -765,7 +764,7 @@`; surface hunk] |
| **Claude F-VM-16 — flycast resolution** | The `height` and `width` lines are deleted while `fullscreen = yes` stays. F1i checks that shape. The USE_GLES/CMakeCache and SDL behavior cited to justify it are not embedded. [S1, flycast `@@ -19,5 +19,3 @@`] |
| **GPT F-VM-11 — dependent qcow2 bundle** | `build_utm()` rejects backing filenames and `format-specific.data.data-file` before creating the output. The code change is present; its negative tests have G2-F1-06’s setup weakness. [S1, launcher `@@ -463,6 +561,21 @@`] |
| **GPT F-VM-12 — concurrent archive publication** | A unique same-directory `mkstemp` replaces the shared `.tmp` name, with publication after closing the ZIP and cleanup on exceptions. The old shared-name collision is removed by the mechanism. [S1, launcher `@@ -479,19 +592,36 @@`] |
| **GPT F-VM-13 — commas in paths** | `qemu_opt()` doubles commas in the shown disk, firmware, monitor, and serial option strings. The test checks those strings. It does not exercise a real QEMU parser, so actual interpretation—particularly legacy character-device syntax—remains a runtime boundary, not an established defect. [S1, launcher option-string hunks] |
| **GPT F-VM-14 — ARM KVM** | `auto_accel()` requires `platform.machine()` to be `x86_64` or `amd64` as well as accessible `/dev/kvm`. The probe tests ARM versus x86. The stated architecture-selection defect is addressed. [S1, launcher `@@ -79,51 +81,150 @@`] |
| **GPT F-VM-15 — minimum disk capacity** | Linux command construction checks `virtual-size` against the profile threshold before `prepare_run()`. The 1 GiB negative case checks a refusal mentioning 16 GiB. The actual profile file is not embedded separately. [S1] |
| **GPT F-VM-16 — switching UTM networking** | This remains a documentation-only disposition. The README explicitly acknowledges that the generated command stays wrong after switching modes. Manual override preservation is improved, subject to G2-F1-03. [S1, README hunks] |

### Withdrawals that can be assessed

- **Shared `/tmp` socket paths:** retaining conventional paths may be intentional, but “single-user host” does not establish that a socket is stale. The packet’s VM rule describes multiple guests. The type-only protection does not settle live-socket collisions. [S2, S10; G2-F1-04]
- **Rows delegated to F2/shared recipes:** no edits to those recipes appear in F1’s diff. That supports the absence of an F1 implementation, not proof that the delegated rows were closed elsewhere. [S1, S2, S5]
- **Other emulators absent from SYSTEM:** the packet contains no image inventory, so the Cemu/RPCS3/xemu/Dolphin/Supermodel absence-based refutations cannot be verified. [S2]
- **mupen video dimensions overridden by its launcher:** the launcher implementation is not embedded; the withdrawal cannot be verified. [S2]
- **Kernel-debug options/upstream equivalence:** neither the relevant full kernel configuration nor its upstream comparator is embedded. [S2]
- **F-RW-04:** the later removal of the dead armhf URL is visible and supersedes that portion of the earlier withdrawal. Claims about conventions in fourteen other profiles, and the cited decision-register rows, remain outside the corpus. [S1, S2]

## 5. Seams with other work

### Shared harness

F1 uses prefixed helpers and adds one block before the existing final summary, consistent with the plan. It nevertheless relies on an unembedded preamble: `check`, `src_of`, BusyBox bindings, `OLD`, `BASE_REF`, and prerequisite handling. The full integrated harness and execution logs are needed to substantiate the final total. G2-F1-06 is visible within F1 regardless of that integration. [S1, S5]

### F1/F2 mupen configuration

The final hunk removes the stray Retroid section so its mappings remain under Control1, and changes the stored controller name. Those are compatible changes in the presented result. The claimed F2 ancestry cannot be checked here. F1i checks the name, **not the location of the mapping keys**, so the integrated regression case should cover both. [S1, S2]

### Generated records, backups, and reset

The surface and SSH records are placed beside their configurations, which supports the intended “restore value and ownership together” design. But archive membership rules and the reset implementation are not embedded. The report’s assertion that reset replaces the cfg but leaves its record is a claim about an external writer. These contracts matter directly to adoption, restored settings, and retirement-stamp behavior. [S1, S2, S7]

### Launcher, fw_cfg, and the cloud screen

The launcher’s CLI parser now bounds TCP ports. The guest’s parser does not enforce the same token language because it deletes non-digits. UTM network mode remains separate from the fixed fw_cfg advertisement. The cloud-screen consumer is not embedded, so this review does not establish its treatment of absent, multiline, or stale overrides. [S1; G2-F1-03/05]

### Immutable image and systemd

The cleanup assumes specific `/etc` links and `/storage/.config/system.d` as the patched unit directory. The harness derives links from recipes but substitutes a `systemctl` shim. That is useful isolation, not proof of the assembled image’s unit search path or reload behavior after mask removal. [S1]

### Bootloader deletion and package rebuilding

Source deletion must actually remove the installed file. S2 explicitly identifies the warm-build stamp seam; the diff supplies no build artifact proving removal. This is an integrator check under the artifact-verification and packaging rules. [S2, S6, S9]

### Player-facing text

I found no newly introduced cloud outcome token in this diff requiring an interface-side vocabulary change. The new path-bearing diagnostics are host/developer-tool errors, and the retirement messages go to stderr for the journal. I do not infer a broader UI vocabulary change from them. [S1, S8]

## 6. Coverage boundary and requests to the orchestrator

The following are **not established by the packet**:

1. **Candidate-image acceptance:** the zero read-only-write journal count, full VM suite results, serial condition result, resolution changes on a kept guest, and the upgrade rehearsal.
2. **Build artifacts:** deletion of the installed updater, actual ICD inventory, installed quirk set, and emulator inventory.
3. **External contracts:** full autostart/log lifecycle, compositor mode selection, patched systemd unit search/reload behavior, init implementation, reset behavior, backup membership, and cloud-screen override consumption.
4. **Unchanged launcher helpers and actual profile:** notably `qemu_img_info()` and the firmware/profile inputs beyond the changed hunks.
5. **Runtime fidelity:** real QEMU interpretation of escaped options, real OVMF boot compatibility, UTM network behavior, and hard-power-loss durability of the two-file record protocols.
6. **Process evidence:** coordinator reassignment, F2 history, raw harness/pkgcheck logs, and the referenced decision-register entries.

The first-delivery plan deliberately reserved VM work for the integrator; lack of that work is therefore **not itself a stream misconduct finding**. It is still missing acceptance evidence. [S5]

**Requested disposition:** address or explicitly adjudicate G2-F1-01 through G2-F1-04, tighten the two Low guards/tests, and attach the missing integrated-image evidence before recording unconditional closure.

## 7. `corpus.provenance.json`

Inline artifact contents only; no file was written. The three source arrays below are parallel and identify every citation used above.

```json
{
  "review_scope": "Stream F1 whole-fix-round static audit",
  "access_mode": "embedded_read_at_time_corpus",
  "source_hash_algorithm": "sha256",
  "source_hash_verification": "Verified at embed time by the Council Facilitator; not independently recomputed by this auditor.",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "independent_filesystem_reads": false,
  "independent_hash_computation": false,
  "tests_executed_by_auditor": false,
  "artifact_delivery": "Inline response only; no filesystem writes.",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10"
  ],
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
  "missing_sources_and_evidence": [
    {
      "path": "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F1.manifest.json",
      "status": "Referenced by the Facilitator but its contents were not embedded."
    },
    {
      "path": "docs/decision-register.md",
      "status": "Not embedded; referenced decision entries and their exact scope could not be checked."
    },
    {
      "path": ".claude/rules/rclone-cloud-sync.md",
      "status": "Referenced by the brief and plan but not embedded; no broader cloud-contract compliance verdict was made."
    },
    {
      "path": "projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json",
      "status": "Not embedded as a source file; references and test usage are visible, but the full profile is not."
    },
    {
      "path": "projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm",
      "status": "Only diff hunks embedded; unchanged helpers were not independently available."
    },
    {
      "path": "tools/last-good-scripts-test",
      "status": "Only diff context and the added F1 block embedded; shared preamble and integrated execution logs unavailable."
    },
    {
      "path": "tools/vm-upgrade-rehearsal",
      "status": "Only changed hunks embedded; no execution result supplied."
    },
    {
      "path": "projects/ROCKNIX/packages/sysutils/systemd/package.mk",
      "status": "Referenced by the harness but not embedded; assembled links and patched unit-search behavior unavailable."
    },
    {
      "path": "projects/ROCKNIX/packages/sysutils/kmod/package.mk",
      "status": "Referenced by the harness but not embedded."
    },
    {
      "path": "projects/ROCKNIX/packages/sysutils/busybox/scripts/init",
      "status": "Referenced by a harness assertion but not embedded as source."
    },
    {
      "description": "Full autostart, compositor, reset, backup-membership, and cloud-screen consumer implementations",
      "status": "Not embedded; no additional paths or hashes inferred."
    },
    {
      "description": "Coordinator reassignment, F2 history/diff, raw harness and pkgcheck logs, candidate SYSTEM inventory, VM acceptance output, and power-cut evidence",
      "status": "Not embedded; gaps surfaced to the orchestrator in this review."
    }
  ]
}
```
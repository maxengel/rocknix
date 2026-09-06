# Forward Audit — device-flashing runbook and rule updates

**Auditor:** Code Auditor skill
**Date:** 2026-09-06
**Subject:** Uncommitted documentation set in worktree `build/device-flashing` (see 01-research-notes.md § Subject)
**Spec:** The artifacts' own stated requirements and factual claims (no driving issue)

---

## Running Notes

Criteria are the claims the artifacts make about themselves and about the tree. Evidence is cited to primary artifacts; the session file and work log are treated as corroboration only.

### AC-02: Image intake verifies the compressed hash, gzip stream, raw byte count, and raw hash with executable commands

**Source:** runbook §1 (lines 115–136); work log 19:29 "verify compressed and raw image hashes and byte count"
**Verdict:** PASS ✓

**Evidence:**
- `docs/device-flashing-runbook.md:124–131` — `sha256sum -c`, `gzip -t`, `gzip -dc | wc -c`, `gzip -dc | sha256sum` under `set -o pipefail`.
- Command evidence: `bash -n` on all 14 fenced blocks → syntax OK. Equivalent run on the retained v9 DDR3 image: `gzip -dc` produced 2,198,863,872 bytes, raw sha256 `ca33682cbffb…` — equal to `verification.json` `variants.DDR3.raw_sha256` and `raw_bytes`. `sha256sum -c` over all six retained `.sha256` files → `OK`, exit 0.

**Refutation attempted:** Looked for a step that would pass without the artifact being what it claims — the block requires the *published* hash to be set by hand (`IMAGE_SHA256=EXPECTED…`), so a mistyped value fails closed at `sha256sum -c`; `pipefail` is set before the pipelines so a failing `gzip -dc` is not masked by `wc`/`sha256sum`. Nothing found.

**Notes:** The "record both raw values" instruction is what makes §4's readback a real comparison rather than a tautology.

---

### AC-03: The board-variant regulator check matches the H700 updater, including the µV → image mapping

**Source:** runbook §2 (lines 143–158); `device-builds.md` table rows
**Verdict:** PASS ✓

**Evidence:**
- `projects/ROCKNIX/devices/H700/bootloader/update.sh:35–46` — regulator named `vdd-dram`; `1200000` → `H700_DDR3_…`, `1100000` → `H700_DDR4_…`.
- Runbook lines 146–154 reproduce the loop (POSIX `[ = ]` for the script's `[[ == ]]`) and the mapping.
- Live: `ssh rg35xxsp` regulator read → `1100000` (DDR4), agreeing with the table row and with the DDR4 image the device runs.

**Refutation attempted:** Checked the mapping was not inverted (script lines 42–46 vs runbook 153–154) and that no other regulator name is consulted anywhere (`grep -rn vdd-dram projects/` → only `update.sh`). Nothing found.

---

### AC-04: The target card is identified at run time — before/after listing, removable flag, exact size, stable link, no mounts, system-disk exclusion — and no device path is copied from an earlier session

**Source:** runbook §3 (lines 163–212); work log 19:29; blindspot 25
**Verdict:** PASS ✓

**Evidence:**
- Runbook lines 168–186 (`lsblk` before/after, `by-id` link, `readlink -f`, `blockdev --getsize64`), 194–202 (RM/RO, mounts, `/`, `/boot`, `/boot/efi` comparison, maintainer confirmation), 204 ("Never write a `/dev/sdX` name copied from an earlier session or another host").
- `grep -nE '/dev/(sd[a-z]|nvme|mmcblk)' docs/device-flashing-runbook.md` → no literal device path appears in any command; only placeholders (`OBSERVED_LINK`, `OBSERVED_ROCKNIX_BOOT_PARTITION`).
- Line 189–192 explicitly limits what a reader-slot `by-id` link proves.

**Refutation attempted:** Searched for a command that would act on an unpinned name (a bare `/dev/sdX` or `$TARGET` used without `readlink -f`) — every destructive command uses `$RESOLVED_TARGET`, re-resolved at §4 lines 220–221 immediately before the write. Nothing found.

---

### AC-05: The raw write is followed by a full byte readback before any filesystem is modified; the serval container path exposes only the pinned device and read-only image, never `--privileged` or all of `/dev`

**Source:** runbook §4 (lines 214–278); work log 19:29
**Verdict:** PARTIAL ⚠

**Evidence:**
- Lines 226–231 (`gzip -dc | dd … conv=fsync` under `pipefail`), 269–274 (readback of exactly `$IMAGE_BYTES` compared to `$IMAGE_RAW_SHA256`), 277–278 (readback precedes the `dtb.img` copy).
- Lines 244–258 container: `--device "$RESOLVED_TARGET:/dev/target:rw"`, image bind-mounted `readonly`, `set -euo pipefail`, in-container hash and size assertions before `dd`. Lines 261–263 forbid `--privileged` and an all-`/dev` bind.
- Environment claims verified on serval: `sudo -n true` → "interactive authentication is required"; user in group `docker`; `docker image inspect ubuntu:24.04` succeeds.

**Refutation attempted:** Looked for a path where the write proceeds without the size/hash gates — the container script gates both before `dd`; the host path re-checks path and size at lines 220–221. Looked for a way the readback could pass trivially — it compares to the raw hash computed in §1, not to itself.

**Gaps:**
- On serval — the machine the runbook names as its worked example — `sudo` is unavailable, and the container equivalent is given **only for the write** (lines 244–258). The readback (line 270 `sudo head -c`), `blockdev --getsize64` (line 184), `blockdev --rereadpt` (line 285), the mount/copy in §5, and every command in §6 use `sudo`. As written, a serval operator cannot complete §4–§6 from the runbook. `grep -n sudo` → 20 sites.
- Unprivileged alternatives exist for some (`lsblk -bdno SIZE` for size) and container equivalents for the rest; neither is documented.

---

### AC-06: A fresh H700 image ships `device_trees/` with no `/dtb.img`, extlinux points to `/dtb.img`, declared overlays exist and agree with the DDR variant, and activation is therefore required before first boot

**Source:** runbook §5 (lines 280–333); `device-builds.md` install section ("Presence in `device_trees/` alone does not make a card bootable when extlinux points to `/dtb.img`")
**Verdict:** PASS ✓

**Evidence:**
- Retained v9 DDR3 image read directly (`gzip -dc` → `sfdisk -d` → `dd` partition 1 → `7z l`): MBR, p1 type `c` at sector 32768 size 4194304 (2 GiB FAT); root holds `KERNEL`, `SYSTEM`, `device_trees/`, `overlays/`, `extlinux/`; **`dtb.img` count at root = 0**; `device_trees/sun50i-h700-anbernic-rg-sp.dtb` present (49,851 bytes); `overlays/sun50i-h700-anbernic-rg35xx-2024-ddr3.dtbo` present; `extlinux/extlinux.conf` = `FDT /dtb.img` + `FDTOVERLAYS /overlays/sun50i-h700-anbernic-rg35xx-2024-ddr3.dtbo`.
- `projects/ROCKNIX/bootloader/mkimage:87–89` copies `device_trees/`; nothing in the image build writes `dtb.img`; the only writer in the tree is `update.sh:31` (`grep -rn 'dtb\.img'`).
- `build.ROCKNIX-H700.aarch64/build/u-boot-DDR3-v2026.01/boot/pxe_utils.c:754–758` — an explicit `FDT` that fails to load makes u-boot print `Skipping <label> for failure retrieving FDT` and not boot the label. So the requirement is not a convention but a boot precondition.
- v8 `verification.json`: DDR4 extlinux has **no** `FDTOVERLAYS` line; DDR3 has the ddr3 overlay.

**Refutation attempted:** Looked for any fallback that would boot a card without `dtb.img` (u-boot control DTB `CONFIG_DEFAULT_DEVICE_TREE=…rg35xx-2024`, a boot.scr, an H700-specific `3rdparty/bootloader/extlinux`) — none applies under an explicit `FDT` directive, and no custom extlinux dir exists for H700. Nothing found.

**Notes:** Two wording weaknesses (not failures): line 300 "the platform/image expects the installer to select that file" does not name the mechanism, and line 329 "a DDR overlay agrees with the selected DDR image" reads as if every variant declares one — the DDR4 image declares none, which is the correct state.

---

### AC-07: TF2 games-card claims — the automounter recognises ext4, btrfs, FAT, NTFS and not F2FS; the 8 GiB guard reads the parent disk; `ROCKNIX`/`STORAGE` labels are reserved; merged storage defaults off and needs ext4/btrfs on TF2

**Source:** runbook §6 (lines 335–382)
**Verdict:** PARTIAL ⚠

**Evidence:**
- `projects/ROCKNIX/packages/rocknix/sources/scripts/automount:187` — `awk '/ext4/ || /btrfs/ || /fat/ || /ntfs/'` over `blkid`; F2FS is not matched (claim correct).
- `:189–197` — `ROOTDEV` strips `p[0-9].*`; `SIZE` is the parent's `/proc/partitions` entry; `<= 8388608` KiB (claim correct for `mmcblk` devices — the handheld case).
- `:126–142`, `:52–69` — overlay only for ext4/btrfs and only when `system.merged.storage=1`; `system.cfg:186 system.merged.storage=0`, `:179 system.automount=1`.
- `:101–108` `create_game_dirs` after `start_ms` → directories land under the active `/storage/roms` (matches lines 378–382).
- Kernel cmdline `disk=LABEL=STORAGE boot=LABEL=ROCKNIX` (image extlinux) grounds the label caution at lines 356–358.

**Refutation attempted:** Checked whether any listed type is *not* recognised (all four are) and whether any unlisted type *is*: `/fat/` also matches `TYPE="exfat"`, and `load_modules` (`:111`) loads `exfat` explicitly — **exFAT is discoverable and disables the overlay like FAT/NTFS**, but the runbook lists it nowhere.

**Gaps:**
- exFAT omitted from lines 351–354.
- `$OBSERVED_PARTITION` (lines 367, 369) is used but never assigned or explained; every other variable in the runbook is (digit-tolerant grep over definitions and `--env` injections).
- All §6 commands use `sudo` (see AC-05 gap).

---

### AC-08: The first power-on is a resize-only boot that does not start the automounter; ROM directories are populated on the following normal boot

**Source:** runbook §7 (lines 398–405); session file; work log 20:16
**Verdict:** PASS ✓

**Evidence:**
- `projects/ROCKNIX/packages/sysutils/busybox/scripts/init:1360–1361` — `.please_resize_me` → `--unit=fs-resize.target`.
- `system.d/fs-resize.target` — `Requires=fs-resize.service` only, `AllowIsolate=yes`; `rocknix-automount.service` is `WantedBy=rocknix.target` and is not pulled in.
- `scripts/fs-resize:13–74` — logs to `/flash/fs-resize.log`, `parted resizepart … 100%`, `e2fsck`, `resize2fs`, `tune2fs -U random`, `sync`, `reboot -f`.
- `automount:160, 207` additionally refuse to mount while the marker exists.

**Refutation attempted:** Looked for any unit under `fs-resize.target` that could create ROM directories (`create_game_dirs` lives only in `automount`, invoked by `rocknix-automount.service`). Nothing found.

---

### AC-09: One H700 update tar serves both RAM variants; the updater selects bootloader by voltage and DTB by `rocknix-dt-id`; staging outside `.update` then moving keeps partial files out of the queue

**Source:** runbook "Updating devices already running ROCKNIX" (lines 51–89); `device-builds.md` install section lines 339–344
**Verdict:** PASS ✓

**Evidence:**
- `update.sh:26–31` (DT_ID → `dtb.img`), `:34–57` (voltage → `UBOOT_BIN`, `dd … seek=8`), `:13` (`BOOT_DISK` derived from the booted partition — SD card, not internal storage).
- `init:34–35, 871` — the updater takes `ls "${UPDATE_DIR}"/*.tar | head -n 1` from `/storage/.update`; anything named `*.tar` there is consumed, which is exactly why staging elsewhere then `mv` (same filesystem, atomic rename) is right.
- Retained artifacts: one `.tar` beside two `.img.gz` per build; `sha256sum -c` OK.
- **Live (RG35XX SP):** `sha256sum /storage/.update/ROCKNIX-H700.aarch64-20260905.tar` → `164d28aa7f80…` = the v9 tar; running `BUILD_ID=1a44c12397…` (v8). The session file's "v9 staged, not rebooted" holds at audit time for this device.

**Refutation attempted:** Checked whether `.tar.part` inside `.update` would be safe anyway (it would not match `*.tar`, but the runbook does not rely on that). Checked v8 and v9 tars are distinguishable — both are 1,302,999,040 bytes, so only the hash distinguishes them, which is what the runbook (line 61–64) and the device-side check require.

---

### AC-10: No separate RG SP MCU/controller firmware updater or vendor-package prerequisite exists in the current H700 tree

**Source:** runbook "Know who owns each update" (lines 12–49); session file
**Verdict:** PASS ✓ (repo claim); UNTESTABLE ? (vendor-site claims)

**Evidence (search trail for the negative claim):**
- `ls -R projects/ROCKNIX/devices/H700/` → `bootloader/update.sh` is the only updater script; `config/kernel-firmware.dat`, DTS files, three u-boot packages.
- `projects/ROCKNIX/devices/H700/options:37,63` → `UBOOT_FIRMWARE+=" atf"`, `FIRMWARE=""`.
- `grep -rliE '\bmcu\b|controller.*firmware|firmware.*(flash|updat)'` over the H700 device dir and Anbernic quirk dirs → a PWM kernel patch, the kernel config, RG Vita Pro LED scripts (different family).
- `projects/ROCKNIX/packages/hardware/quirks/platforms/H700/` (14 entries) → `grep -rliE '\bmcu\b|firmware'` → none. No `hardware/quirks/devices/` entry exists for RG35XX SP or RG-SP.
- Packages gated on `H700` mentioning firmware/flash → `linux`, `atf` (ARM Trusted Firmware, part of the u-boot image written by the same `dd`).
- Proximate-work reconstruction: no commit on `next` since 2026-09-01 touches `projects/ROCKNIX/devices/H700/` beyond the DTS set (`git log --since=2026-09-01 -- projects/ROCKNIX/devices/H700` — see 03-retrospective.md).

**Refutation attempted:** Searched for anything that would flash a persistent controller (an `i2c`/`spi` flasher, a `*-fw` package, a udev rule invoking a firmware loader for a non-kernel target) — nothing beyond kernel-loaded firmware.

**Notes:** The vendor-side claims (package name `RGSP-V1.0.1-EN16GB-260624`, "16 GB TF/microSD" system storage) name their source generically ("Anbernic's System Update page", "the product specification") but cite **no URL and no access date**. They cannot be re-derived from the repo, and blindspot 18 asks that a physical-world claim name a checkable source.

---

### AC-11: The `Our devices` rows for RG35XX SP and RG SP state the measured variant, attribute it to the maintainer's unit with evidence and date, and do not generalise to the model

**Source:** `device-builds.md` diff lines 22–23; runbook lines 104–106, 160–161
**Verdict:** PASS ✓

**Evidence:**
- Diff: RG35XX SP "maintainer's unit is LPDDR4 … (`vdd-dram` = 1.1 V, verified 2026-09-05)"; RG SP "maintainer's unit is LPDDR3 … (stock boot0 `dram_type = 7`, then ROCKNIX `vdd-dram` = 1.2 V, verified 2026-09-05)".
- RG35XX SP: live regulator read `1100000` this session.
- RG SP: `u-boot-DDR3-v2026.01/arch/arm/include/asm/arch-sunxi/dram_sun50i_h616.h:21–24` — `DDR3 = 3, DDR4, LPDDR3 = 7, LPDDR4` — grounds "dram_type 7 = LPDDR3" in the shipped bootloader source. The 1.2 V reading and the boot0 bytes are recorded in the work log (18:51, 21:07, 23:01) and cannot be re-measured from this session (no SSH key for the RG SP).

**Refutation attempted:** Looked for a model-wide generalisation ("RG SP is DDR3") — both rows say "maintainer's unit", and runbook lines 104–106 forbid the generalisation explicitly. Checked the pair against #44's own hypothesis: the issue predicted that a differing pair "settles the design question"; the pair differs.

**Notes:** Coverage boundary: the RG SP value is corroborated (enum + a DDR3 image that booted and identified as `Anbernic RG-SP`, per the log), not re-derived live. The DTS model string is `Anbernic RG-SP` (`sun50i-h700-anbernic-rg-sp.dts:10`); the table writes "RG SP". Cosmetic.

---

### AC-12: The `es-native-ui.md` addition is accurate — `cloudSetupPresent` closes `prev`, `GuiSettings::close()` deletes the page, both OAuth choices captured the deleted page, and `tests/cloud-oauth-lifetime.py` exists at the pinned commit

**Source:** `es-native-ui.md` diff lines 184–190
**Verdict:** PASS ✓

**Evidence:**
- ES `GuiMenu.cpp:5071–5083` (`pushGui(s); if (prev) prev->close();`), `GuiSettings.cpp:72–80` (`delete this`).
- `git show d3fb1162`: both lambdas change `prev` → `s` in capture and in the `cloudOAuthShowSignIn` call; `tests/cloud-oauth-lifetime.py` added (151 lines). `58c19931` is the merge of that branch and is the `PKG_VERSION` in `projects/ROCKNIX/packages/ui/emulationstation/package.mk:5`.
- **Mechanical:** harness on fixed source → 4× PASS, exit 0; on pre-fix source → `FAIL phone`, `FAIL keyboard` (`heap-use-after-free`), exit 1.

**Refutation attempted:** Ran the check against the code it is meant to catch and watched it fail; ran it against the fix and watched it pass. Looked for a third choice callback that still captured `prev` (`grep -n 'prev, ready' GuiMenu.cpp` → none remain).

---

### AC-13: Blindspot row 29's claims — the 2026-09-03 hub commit wired `CONNECT OR REPAIR CLOUD STORAGE` to the legacy wizard, the phone backend was compiled but unreachable, and the fix re-routed every user-facing entry

**Source:** `docs/blindspot-register.md` diff (row 29)
**Verdict:** PASS ✓

**Evidence:**
- `git log -1 483b270e` → 2026-09-03; its diff adds the row with `[window] { GuiMenu::openCloudSetup(window); }`.
- Call-site count (grep, per the call-site rule): `openCloudSetup(` callers now = 2 (`GuiMenu.cpp:6337` `USE A COMPUTER INSTEAD`; `:6391` the wizard's folder-editor refresh); `openCloudAddRemote(` callers = 3 (`:4102`, `:4386`, `:4930`).
- `WITH MY PHONE` present in source (×1); v8 `verification.json` records the ES binary hash the session says contained the string.

**Refutation attempted:** Looked for a fourth user-facing entry still calling the wizard — only the two named remain. Nothing found.

---

### AC-14: The session file records every field the runbook requires before touching a card, and its state claims are true

**Source:** runbook "Record before touching a card" table (lines 93–102); `.github/sessions/saved-session-state-build-device-flashing.md`
**Verdict:** PASS ✓ (RG35XX SP claims live-verified; RG SP claims not probe-able)

**Evidence:**
- Fields: physical device (RG SP, maintainer's unit; lines 9–13, 35–50), build (`394a3d…`, `build/devices`, H700, 2026-09-05; 60–61), image path + compressed hash (76–86), board variant + evidence (35–50), intended card (32 GB `int`; 102–113), device tree (manual activation; filename + hash; 116–121). All present.
- Live: RG35XX SP `BUILD_ID=1a44c12397` (v8), ES sha256 `95259a25…` (v8), `/storage/.update/…tar` sha256 `164d28aa…` (v9), regulator `1100000` — every claim in lines 371–383 that concerns this device holds.

**Refutation attempted:** Compared the file's hashes against `sha256sum -c` of the retained artifacts (all match) and against the device (matches). Looked for a claim of *installation* rather than staging — the file says "staged … No reboot was issued" (line 382–383) and "remain unverified", which is the honest state.

**Notes:** The file names `/tmp/rgsp-cloud-crash/` and `/tmp/emulationstation-next-v7` as holding evidence and the shipped ES source; `/tmp` on serval is a 31 GB tmpfs. The ES commits are on the remote, so nothing is lost, but the only local copy at the pin is volatile (see 03 § What's missing).

---

### AC-15: Learnings were captured per `learning-capture.md` — timestamped work-log entries appended, rule files updated where generalisable

**Source:** `.claude/rules/learning-capture.md`
**Verdict:** PASS ✓

**Evidence:**
- `git diff` hunk `@@ -685,3 +685,386 @@` on `2026_09_05-work_log.md`: additions only, 13 entries headed `## HH:MM UTC — …` (18:24 → 23:01).
- Generalised: `device-builds.md` (install section, table), `es-native-ui.md` (page-lifetime rule), blindspot row 29, `AGENTS.md` pointer.

**Refutation attempted:** Checked for an overwritten or reordered earlier entry (none; the hunk starts at the old EOF) and for a lesson in the log with no rule home (the serval container path and the "private bench list" decision have no rule or register row — carried to AC-16/Phase 3 as a decision-register gap, not a learning-capture one).

---

### AC-16: The menu path and labels the runbook's update step 6 names exist in the pinned ES source

**Source:** runbook lines 80–89
**Verdict:** PASS ✓

**Evidence:** `grep -F` over `es-app/src/**/*.cpp` at `58c19931`: `CLOUD SETTINGS`, `ALL CLOUD SETTINGS AND SERVICES`, `CLOUD STORAGE SETUP`, `CONNECT OR REPAIR CLOUD STORAGE`, `WITH MY PHONE`, `WITH THE ON-SCREEN KEYBOARD`, `USE A COMPUTER INSTEAD` all present.

**Refutation attempted:** Looked for a renamed label (each string matched verbatim, uppercase). The page-to-page nesting was not traced; string presence only — recorded in the coverage boundary.

---

### AC-01: The runbook is discoverable from the canonical install section and from the agent entry file

**Source:** work log 19:29 ("linked it from the canonical install section in `.claude/rules/device-builds.md` … Added a direct pointer to root `AGENTS.md`")
**Verdict:** PASS ✓

**Evidence:**
- `grep -rn 'device-flashing-runbook' --include='*.md' .` → `AGENTS.md:58` (Subsystem quick warnings bullet), `.claude/rules/device-builds.md:328` (Installing on the device), plus the session file and work log.
- `docs/` is flat (`ls docs/` → 13 files + `audits/`, `work-logs/`); the runbook's location follows the existing convention (no `docs/runbooks/` here).

**Refutation attempted:** Checked the two parallel entry files. `CLAUDE.md` — which carries the same rclone/VM "sharp edges" warnings AGENTS.md carries — has no flashing mention (`grep -in flash CLAUDE.md` → none). AGENTS.md says it exists "for agents that read it instead of this file", so a Claude session reading only `CLAUDE.md` gets the rule via `device-builds.md` (loads every session) but not the quick warning. Parity gap, not a discoverability failure.

---

## Forward Audit Summary

| Verdict      | Count | Criteria |
| ------------ | ----- | -------- |
| PASS ✓       | 13    | AC-01, AC-02, AC-03, AC-04, AC-06, AC-08, AC-09, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16 |
| PARTIAL ⚠    | 2     | AC-05 (serval path documented only for the write), AC-07 (exFAT omitted; `OBSERVED_PARTITION` undefined) |
| FAIL ✗       | 0     | — |
| SKIP ○       | 0     | — |
| UNTESTABLE ? | 1 (sub-claim) | AC-10's vendor-site assertions (no URL cited; repo claim itself PASS) |

**Overall Assessment:** PASS WITH FINDINGS. Every factual claim the documents make about the tree, the images, and the reachable device was re-derived from a primary artifact and held. The findings are completeness gaps in the runbook (serval executability, one undefined placeholder, one omitted filesystem) and process gaps around the work (uncommitted, register rows and #44 not updated) — the latter are Phase 3 findings.

## Coverage Boundary

**Examined:**
- Runtime-probed: RG35XX SP (`ssh rg35xxsp`, read-only) — os-release, `rocknix-dt-id`, ES binary hash, update-queue contents and hash, `vdd-dram` regulator (AC-03, AC-09, AC-11, AC-14).
- Test-run: `tests/cloud-oauth-lifetime.py` on fixed and pre-fix ES source (AC-12); `sha256sum -c` on six retained checksum files (AC-02, AC-14); `bash -n` on 14 runbook blocks (AC-02..AC-07); direct FAT-partition read of the retained v9 DDR3 image via `sfdisk`/`dd`/`7z` (AC-06).
- Code-read: `update.sh`, `mkimage`, `automount`, `init`, `fs-resize{,.target,.service}`, `system.cfg`, u-boot `pxe_utils.c` and `dram_sun50i_h616.h`, the three H700 u-boot recipes, ES `GuiMenu.cpp`/`GuiSettings.cpp` at `58c19931`, commits `483b270e`/`c5443dd0`/`d3fb1162`, issue #44 and its comment.

**Deliberately not examined:**
- The RG SP (192.168.1.175): no SSH key or profile; its temporary password helper was removed. Its v8/v9 state, 1.2 V reading, and the boot0 `dram_type` bytes are taken from the work log and corroborated (u-boot enum; a DDR3 image that booted and identified as `Anbernic RG-SP`), not re-measured.
- The vendor web pages behind the `RGSP-V1.0.1-EN16GB-260624` and "16 GB TF/microSD" claims — no URL is cited to fetch.
- The ES menu nesting behind the documented path — string presence only.
- The committed ES fixes and ROCKNIX pin bumps as *code* (on `next`, outside this diff) — audited only where the documents make claims about them.

**Dimensions not exercised:** executing the runbook end-to-end against a card (no removable card attached to the build host at audit time; the procedure is destructive by design); the v9 post-reboot UI verification the session lists as next steps (the devices have not been rebooted — a maintainer action).

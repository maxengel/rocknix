# Research Notes — device-flashing runbook and rule updates

**Auditor:** Code Auditor skill
**Date:** 2026-09-06
**Subject:** Uncommitted work in worktree `build/device-flashing` (branch at `bba8620e0b` == `next`): `docs/device-flashing-runbook.md` (new), `.github/sessions/saved-session-state-build-device-flashing.md` (new), edits to `.claude/rules/device-builds.md`, `.claude/rules/es-native-ui.md`, `AGENTS.md`, `docs/blindspot-register.md` (row 29), `docs/work-logs/2026_09-work_logs/2026_09_05-work_log.md` (+383 lines)
**Spec:** No GitHub issue drives this work. The spec is the artifacts' own stated claims: the runbook's procedure requirements (work log 19:29 UTC enumerates them), the factual assertions the rule edits make about the tree and the bench units, and the session file's state claims.
**Tier:** Issue (one workstream, one worktree, no epic boundary crossed). Instruction-Recommendations mode skipped per SKILL.md tier rule. No running log required at this tier.

---

## Running Notes

### 0.1 Skill currency

`diff -q` of SKILL.md, phases.md, templates.md, anti-patterns.md against `next` on the primary checkout: all identical. Rubric is current.

### 0.2 Scope derivation

- `git log next..HEAD` is empty; `git merge-base HEAD next` == HEAD == `bba8620e0b`. Nothing on this branch is committed beyond `next`.
- `git status --short`: 5 modified tracked files, 2 untracked. `git diff --stat`: 420 insertions, 8 deletions.
- The related *code* (ES routing fix `3590093e`, page-lifetime fix `58c19931`, ROCKNIX pins `1a44c12397`, `bba8620e0b`) is already on `next` and is NOT in this diff. It is audited here only where the documentation makes claims about it (blindspot row 29, es-native-ui.md addition, runbook step 6).

### 1.1 Spec (the artifacts' own claims), enumerated

The work log entry at 19:29 UTC states what the runbook "now requires". Together with the factual assertions in the rule edits and the session file, these are the acceptance criteria audited in Phase 2 (AC-01..AC-16). No criteria beyond what the artifacts themselves assert are invented.

### 1.2 Issues

No issue number is cited anywhere in the diff for the flashing work. Search of `maxengel/rocknix` pending (below). Issues cited in passing: #10, #19 (savestate compatibility, unchanged text), #68/#69 (v7 contents), D-UI-005.

### 1.3 Git history

- Branch `build/device-flashing` at `bba8620e0b` == `next`. Diff is working-tree only.
- Related committed history on `next` (not in this diff, referenced by the docs): `1a44c12397` (ES pin → `3590093e`, routing fix), `bba8620e0b` (ES pin → `58c19931`, page-lifetime fix). ES `package.mk` on this tree: `PKG_VERSION="58c199318ca78975d405a21b6e608ab432dbf892"`, branch `test/qa-integration`, site `maxengel/emulationstation-next`.
- Worktrees: `devices` (build/devices, holds `build.ROCKNIX-H700.aarch64`), `cloud-oauth-page-lifetime`, `cloud-setup-entry`, `generic-x64`, `conflict-resolution`.

### 1.4 Doctrine in scope

All `.claude/rules/*.md` in this repo carry `paths: ["**"]` (verified by header grep) — every rule is in scope. Rules read from `next` (the diff shows this worktree's copies differ from `next` only by the edits under audit; the skill files are identical). Highest-relevance rules: `device-builds.md`, `upgrade-and-install.md`, `engineering-practices.md` (verify the artifact; guards fail closed; ask = decision), `decision-register.md`, `learning-capture.md`, `worktrees.md`, `fork-workflow.md` (personal paths), `es-native-ui.md`, `documentation-accuracy.md`, `issue-tracking.md`.

Blindspot register on `next`: rows 1–28. Row 29 is added by this diff. Rows with direct bearing: 18 (physical-world claims need a source), 25 (device path written before hardware existed), 13 (assumed-done), 6 (consumed artifact checked too late), 2 (same-tag republish), 20 (edit in one worktree, build in another), 1 (assumed-undone).

Decision register: D-UI-005 (2026-08-29, one cloud entry; wizard as `USE A COMPUTER INSTEAD`), D-INFRA-002 (2026-09-04, destructive disk work lives in a runbook + guarded script, run on the target). **No row records the 2026-09-05 19:16 maintainer clarification** that the documentation target is the private owned-device list rather than a public guide, and **no row records the serval sudo-vs-Docker raw-device choice** (runbook §4). Both are candidates under `decision-register.md` § "Write a row when" (1: maintainer call; 2: fork resolved during execution). Grep: `grep -nE 'flash|runbook|owned-device|private' docs/decision-register.md` → only D-INFRA-002 and unrelated D-INFRA-006/007 (credential privacy).

### 1.5 Primary artifacts located

| Claim area | Primary artifact |
| --- | --- |
| H700 updater: DTB by `rocknix-dt-id`, bootloader by `vdd-dram` µV | `projects/ROCKNIX/devices/H700/bootloader/update.sh` — read in full: lines 26–32 (DT_ID → `dtb.img`), 35–49 (`vdd-dram`; `1200000`→`H700_DDR3_…`, `1100000`→`H700_DDR4_…`), 55 (`dd … bs=1K seek=8` = byte 8192) |
| Image layout, `FDT`, `FDTOVERLAYS`, `device_trees/` | `projects/ROCKNIX/bootloader/mkimage` (lines 26, 54, 77, 88 hit) — to read |
| Automounter: fs types, 8 GiB guard, merged overlay | `projects/ROCKNIX/packages/rocknix/sources/scripts/automount` — to read |
| Resize boot | `projects/ROCKNIX/packages/sysutils/busybox/{scripts/init,scripts/fs-resize,system.d/fs-resize.target,system.d/fs-resize.service}` — to read |
| Settings defaults | `projects/ROCKNIX/packages/rocknix/config/system/configs/system.cfg` — to read |
| ES claims | ES checkouts: `/home/max/Development/emulationstation-next`, `…/emulationstation-next.worktrees`, `/tmp/emulationstation-next-v7`; pin `58c19931` |
| Retained artifacts | `/workspace/artifacts/rocknix-images/h700-v8-20260905-1a44c12397/`, `…/h700-v9-20260905-bba8620e0b/` — both present with `.sha256` files, `README.md`, `verification.json` |

Observation while reading `update.sh`: the runbook's regulator loop (§2) is a faithful POSIX rewrite of lines 35–40; the µV→variant mapping (§2 bullets) matches lines 42–46 exactly.

### 1.5.1 Primary artifacts read (document-as-you-go)

**`projects/ROCKNIX/bootloader/mkimage`** (113 lines): H700 falls in the `*` case of `mkimage_dtb` (line 87–89) — `mcopy -s device_trees ::` copies the directory; nothing writes `dtb.img`. `mkimage_extlinux` (32–61) emits `${fdt_type} /$(get_fdt)` and, only when `get_fdt_overlays` is non-empty, `FDTOVERLAYS /overlays/…` (52–56). H700 u-boot is written at `bs=1K seek=8` (line 21) — same offset the updater rewrites (`update.sh:55`).

**`projects/ROCKNIX/packages/rocknix/sources/scripts/automount`** (243 lines):
- Discovery (187): `blkid | awk '/ext4/ || /btrfs/ || /fat/ || /ntfs/'` over `mmcblk[0-9] sd[a-z] nvme…`. `/fat/` also matches `TYPE="exfat"` and `load_modules` (111) loads `exfat` — **exFAT is discoverable too; the runbook lists only "ext4, btrfs, FAT, and NTFS"**. F2FS is not matched (runbook claim correct).
- Size guard (189–197): `ROOTDEV` strips `p[0-9].*` so for `mmcblkNpM` it is the parent disk and `SIZE` is the parent's `/proc/partitions` entry; `<= 8388608` KiB = 8 GiB. Runbook's "applies its 8 GiB size guard to the parent disk" is correct for the handheld's mmcblk devices (for `sdX` the sed leaves the partition name — irrelevant on device).
- `.please_resize_me` guard (160, 207): automount skips mounting while the marker exists.
- Overlay (126–142, 52–69): ext4/btrfs → `.ms_supported`; else `.ms_unsupported` and bind-mount only. Merged overlay only when `system.merged.storage=1`. Matches runbook §6.
- `system.merged.device` (25–29): set to `external` when unset and an external card is found. Matches session claim.
- `create_game_dirs` (101–108) runs `systemd-tmpfiles --create /usr/config/system-dirs.conf` **after** `start_ms`, i.e. into whatever is bound at `/storage/roms`. Matches runbook §6 last paragraph and session's "128 dirs on TF2" explanation.
- No label check anywhere; the runbook's `ROCKNIX`/`STORAGE` caution is grounded in the kernel cmdline instead (`boot=LABEL=ROCKNIX disk=LABEL=STORAGE`, see verification.json extlinux).

**Resize boot**: `busybox/scripts/init:1360` selects `--unit=fs-resize.target` when `/sysroot/storage/.please_resize_me` exists. `fs-resize.target` `Requires=fs-resize.service` only; `rocknix-automount.service` is `WantedBy=rocknix.target` — so it does not run under the resize target. `scripts/fs-resize` logs to `/flash/fs-resize.log`, runs `parted resizepart … 100%`, `e2fsck`, `resize2fs`, `tune2fs -U random`, `fatlabel`, `sync`, `reboot -f`. All runbook §7 and session claims about the resize boot hold.

**Defaults**: `system.cfg:179 system.automount=1`, `:186 system.merged.storage=0`.

**u-boot**: `u-boot-DDR3` → `anbernic_rg35xx_h700_lpddr3_defconfig`; `u-boot-DDR4` → `…lpddr4_defconfig`; installed as `H700_${PKG_SUBDEVICE}_u-boot-sunxi-with-spl.bin`. Extracted source `build.ROCKNIX-H700.aarch64/build/u-boot-DDR3-v2026.01/arch/arm/include/asm/arch-sunxi/dram_sun50i_h616.h:21-24`: `DDR3 = 3, DDR4, LPDDR3 = 7, LPDDR4` — **dram_type 7 = LPDDR3, 8 = LPDDR4** is grounded in the shipped u-boot source.

**Retained artifacts** (mechanical): `sha256sum -c` on all six `.sha256` files under `h700-v8-…` and `h700-v9-…` → `OK`, exit 0. Hashes equal those in the session file and work log tables. v8 `verification.json`: `raw_bytes 2198863872`, extlinux `FDT /dtb.img`, DDR3 carries `FDTOVERLAYS /overlays/sun50i-h700-anbernic-rg35xx-2024-ddr3.dtbo`, DDR4 carries none.

**Device probe (read-only, RG35XX SP via `ssh -F /home/max/.ssh/config rg35xxsp`)**: `BUILD_ID=1a44c12397…` (v8), `dtid=sun50i-h700-anbernic-rg35xx-sp`, `/usr/bin/emulationstation` sha256 `95259a25…` (v8), `/storage/.update/ROCKNIX-H700.aarch64-20260905.tar` present at 1302999040 bytes. **The session file's "v9 staged, not rebooted" is still true for this device at audit time.**

**ES checkouts**: `/tmp/emulationstation-next-v7` is at `58c19931` (`test/qa-integration`) and contains `483b270e`. The durable clone `/home/max/Development/emulationstation-next` is at `0f83d515` (the v7 pin) and does **not** contain `58c19931` — the only local copy of the shipped ES source sits in `/tmp`.

**Fork issues**: search "device flashing runbook RG SP dtb.img fresh card H700" → one hit, **#44** "H700: nothing tells a downloader whether their board is DDR3 or DDR4" (open, `enhancement`, updated 2026-08-27). No issue tracks the runbook itself.

**H700 firmware-updater search trail (AC-10)**: `ls projects/ROCKNIX/devices/H700/` → `bootloader/update.sh` is the only updater; `grep -rliE 'mcu|controller.*firmware|firmware.*(flash|updat)'` over the H700 device dir and Anbernic quirk dirs → only a PWM kernel patch, the kernel config, and RG Vita Pro LED scripts. Widened trail recorded in Phase 2.

### 1.5.2 ES repository claims (checkout `/tmp/emulationstation-next-v7` @ `58c19931`, `test/qa-integration`)

- `git log --oneline -6`: `58c19931` merge of `fix/cloud-oauth-page-lifetime`; `d3fb1162` (2026-09-05) "Cloud: replace the live page after choosing a keyboard"; `3590093e` merge of `fix/cloud-setup-entry`; `c5443dd0` "Cloud: restore native setup as the front door"; `0f83d515` (v7 pin).
- `483b270e` is dated **2026-09-03**, "Cloud: one page, and the last run where the decision is made". Its diff adds `CONNECT OR REPAIR CLOUD STORAGE` wired to `[window] { GuiMenu::openCloudSetup(window); }` (diff line 293–296). Blindspot row 29's attribution is exact.
- Call sites now (`grep -rn 'openCloudSetup('`): definition `GuiMenu.cpp:6342`, header, **`:6337` = the `USE A COMPUTER INSTEAD` row**, **`:6391` = the wizard's own folder-editor refresh**. Exactly the two the docs claim. `openCloudAddRemote(` callers: `:4102`, `:4386`, `:4930` — **three**, matching "all three user-facing setup invitations" (call-site count verified by grep).
- Strings present (`grep -F --include=*.cpp`): `CONNECT OR REPAIR CLOUD STORAGE`×2, `WITH MY PHONE`×1, `WITH THE ON-SCREEN KEYBOARD`×1, `USE A COMPUTER INSTEAD`×1, `ALL CLOUD SETTINGS AND SERVICES`×4, `CLOUD STORAGE SETUP`×1, `"CLOUD SETTINGS"`×1, `ON YOUR COMPUTER`×2. (Nesting of the menu path was not traced page-by-page — string existence only.)
- `cloudSetupPresent` (`GuiMenu.cpp:5071–5083`): `window->pushGui(s); if (prev) prev->close();`. `GuiSettings::close()` (`GuiSettings.cpp:72–80`): `save(); … delete this;`. The `es-native-ui.md` addition is accurate.
- Fix `d3fb1162`: `GuiMenu.cpp` +6/−4 (two lambdas capture `s` instead of `prev`, two `cloudOAuthShowSignIn(…, s, …)` calls, one comment) plus `tests/cloud-oauth-lifetime.py` (+151). Matches "four code-line changes and an explanatory comment".
- **Mechanical check run**: `python3 tests/cloud-oauth-lifetime.py` on the fixed source → `PASS phone / PASS keyboard / PASS no-browser / PASS failed-start`, exit 0. Against the **pre-fix** v8 source (`git show 3590093e:es-app/src/guis/GuiMenu.cpp`) → `FAIL phone`, `FAIL keyboard` with `AddressSanitizer: heap-use-after-free`, exit 1. The check has an observed positive; it is evidence, not a tautology.
- Remote (`git ls-remote origin`): `test/qa-integration`=`58c19931`, `fix/cloud-oauth-page-lifetime`=`d3fb1162`, `fix/cloud-setup-entry`=`c5443dd0` — all published as claimed.

### 1.5.3 Boot mechanism behind "activation is required"

`build.ROCKNIX-H700.aarch64/build/u-boot-DDR3-v2026.01/boot/pxe_utils.c:748–758`: when a label carries an explicit `FDT` and the file cannot be loaded, u-boot prints `Skipping <label> for failure retrieving FDT` and does not boot that label. `CONFIG_DEFAULT_DEVICE_TREE="allwinner/sun50i-h700-anbernic-rg35xx-2024"` is u-boot's control DTB but is never used as a fallback under an explicit `FDT` directive. Only `update.sh:31` ever writes `dtb.img` (`grep -rn 'dtb\.img'` over the H700 device dir, rocknix scripts, bootloader helpers, busybox init). So a fresh H700 card with no `/dtb.img` does not boot at all — the runbook's requirement is correct, and stronger than its wording ("the platform/image expects the installer to select that file").

### 1.5.4 Other checks

- Update consumer: `busybox/scripts/init:34-35` `UPDATE_ROOT=/storage/.update`; `:871` `UPDATE_TAR=$(ls -1 "${UPDATE_DIR}"/*.tar | head -n 1)`. A partial file named `*.tar` inside `.update` would be consumed; the runbook's stage-outside-then-`mv` (same filesystem, atomic rename) is the right design.
- `essway.service` exists: `projects/ROCKNIX/packages/ui/emulationstation/system.d/essway.service`.
- serval: `sudo -n true` → "interactive authentication is required" (no passwordless sudo); user is in group `docker`; `docker image inspect ubuntu:24.04` succeeds. All three runbook §4 environment claims hold.
- Runbook shell blocks: 14 fenced `bash` blocks extracted, `bash -n` passes on all. `shellcheck` not installed. Variable audit (digit-tolerant): every `$VAR` used is assigned or `--env`-injected except **`OBSERVED_PARTITION`** (used at runbook lines 367, 369; never assigned or explained).
- Labels: `distributions/ROCKNIX/options:202-203` `DISTRO_BOOTLABEL="ROCKNIX"`, `DISTRO_DISKLABEL="STORAGE"`; kernel cmdline in the built image `boot=LABEL=ROCKNIX disk=LABEL=STORAGE`.
- H700 firmware-updater trail (negative claim, AC-10): `projects/ROCKNIX/devices/H700/{options,config,bootloader}` → `FIRMWARE=""`, only `UBOOT_FIRMWARE+=" atf"`; `hardware/quirks/platforms/H700/` (14 entries, `grep -rliE '\bmcu\b|firmware'` → none); no `hardware/quirks/devices/` entry exists for RG35XX SP or RG-SP at all (the 16 Anbernic quirk dirs are RK/other families); packages gated on `H700` mentioning firmware/flash → `linux`, `atf` only. No vendor-controller updater exists in the tree.
- Issue **#44** body: options (document / single image / both), AC includes release notes + rocknix.org; "Verification available: … RG35xx SP and an RG-SP … RAM types to be confirmed by the regulator check … if they differ, that pair validates a single-image fix directly." Its one comment (2026-08-27) records RG35XX SP = `1100000` DDR4 and **RG-SP: pending**, with "If the RG-SP reads 1200000 (DDR3), that settles the design question." This session measured RG-SP = 1.2 V DDR3 (and boot0 `dram_type=7`). **Nothing in the diff or on #44 carries that answer to the issue.**
- SSH: only `rg35xxsp` (192.168.1.81) has a profile in `~/.ssh/config`; the RG SP (192.168.1.175) has no key and its temporary password helper was removed → RG SP device state is not probe-able from this session without the user's terminal.

### 1.6 Research Summary

- **Planned:** flash the maintainer's RG SP with the correct H700 variant, verify it, and capture a repeatable fresh-card procedure; along the way a v7 cloud-setup routing regression and a v8 crash were fixed in ES (code on `next`, outside this diff).
- **Issues:** none drive the runbook. #44 is the open tracker for the H700 DDR3/DDR4 problem and is directly answered by this session's measurement.
- **Changed:** 7 documentation/rule files, all uncommitted on a `build/*` branch worktree.
- **Constraints:** all rules apply (`paths: **`); blindspots 18, 25, 27, 13, 1, 20 most relevant; decision-register "same session" contract; personal-path rules (all changed paths are personal).
- **Red flags:** (1) the work has no durable home — uncommitted, on a build branch, invisible to every other session; (2) #44's pending data point was answered and not propagated; (3) two decisions from the session are absent from the register; (4) the runbook's serval path covers only the `dd` step while §3/§4-readback/§5/§6 use `sudo` the machine does not have; (5) `OBSERVED_PARTITION` undefined; (6) exFAT omitted from the automounter's recognised types; (7) the only local copy of the shipped ES source is in `/tmp`.

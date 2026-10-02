# P0: the identity sweep report (#344, base plan §1.15, 2026-09-30)

The base plan's command, run on `next` at `51f78ac5b4` from the tree root:

```sh
rg -n 'DISTRO(NAME)?\b|DISTRO_BOOTLABEL|DISTRO_DISKLABEL|HOSTNAME|DISTRO_SRC|distroname|rocknix' \
  packages projects scripts config distributions
```

It is case-sensitive and matches **841** lines. The word a player reads is `ROCKNIX` in capitals, which that command never matches, so the report classifies the **case-insensitive superset, 2,415 lines** (`grep -rn -i -E`, the same pattern), of which 278 are in `patches/` files. Every line is in `p0-sweep-hits.txt` beside this file with its class, its mark, the rule that classified it and a note; that file is the artifact the checkbox names, and this page is its summary. The classifier is a rule list applied to the file content (never to the path prefix), with 58 hand overrides for the lines the rules cannot tell apart; a hit lands in exactly one class.

## The four classes (base plan §1.5)

| Class | KEEP | CHANGE | NON-KEEP | Total |
| --- | ---: | ---: | ---: | ---: |
| 1 display text | 1185 | 138 | 0 | 1323 |
| 2 machine-readable identity | 561 | 0 | 0 | 561 |
| 3 persisted path or network name | 392 | 0 | 1 | 393 |
| 4 boot or storage contract | 138 | 0 | 0 | 138 |
| all | 2276 | 138 | 1 | 2415 |

**Every class 2, 3 and 4 hit is KEEP, except one**: `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-update:10` (`ENDPOINT_URL="https://update.rocknix.org"`), class 3 NON-KEEP because Branch B's fork-aware updater never queries ROCKNIX's endpoint (base plan §2.2); the recorded yes is **D-WORKFLOW-093** (manual adoption accepted; a re-point only if the read found it a low lift, and the read found nothing of ours to point at -- `p0-updater.md`). The exact replacement is P4's.

Class 1 marks: **KEEP** is a licence notice, a developer comment, a package description, a unit `Description=`, QA-host tooling text or a vendor string baked into a third-party build (unchanged in 0.0.1 because each costs that package's rebuild); **CHANGE** is text a player, an installer or a console reads; **CHANGE via DISTRONAME** is the mechanism itself -- the `@DISTRONAME@` placeholders, the `sed` lines that fill them and the `${OS_NAME}` reads -- which change when `distributions/ROCKNIX/options:17` does.

## By rule

| Rule | Class | Lines | What it matches |
| --- | --- | ---: | --- |
| `attribution` | 1 | 898 | copyright and SPDX lines, `(https://github.com/ROCKNIX)`, `MODULE_AUTHOR` |
| `name` | 2 | 338 | package, script, unit, driver and device names; `ROCKNIX_*` variables; build identifiers |
| `patch-text` | 1 | 121 | subject, origin and marker lines inside `patches/` files |
| `other-tree` | 2 | 120 | another distribution's or project's tree (LibreELEC, LEIoT, NXP, RPi, Amlogic, the add-ons); not built for any target of ours |
| `hostname-mechanism` | 3 | 120 | lowercase `hostname` in third-party sources and build options: the mechanism, not the name (superset only) |
| `devicetree` | 4 | 103 | device-tree compatibles and nodes, the ABL artifacts |
| `runtime-path` | 3 | 93 | paths on the device (`/usr/lib/rocknix`, `/run/rocknix/…`, `/usr/share/rocknix/…`, `/.rocknix-unpack`) |
| `comment` | 1 | 77 | developer comments |
| `gamelist-tools` | 1 | 75 | the Tools list a player sees in the interface (`misc/modules/sources/gamelist.xml`) |
| `tree-path` | 2 | 67 | paths inside this tree (`projects/ROCKNIX`, `distributions/ROCKNIX`, `packages/rocknix`, `build.${DISTRO}-…`) |
| `cloud-path` | 3 | 56 | the cloud root and its folders (D-WORKFLOW-101) |
| `hostname` | 3 | 46 | the `HOSTNAME` variable and its defaults |
| `settings-key` | 3 | 39 | `rocknix.*` keys in `system.cfg` |
| `qa-host-text` | 1 | 33 | the VM runner, its readme and profile (QA host only) |
| `meta-desc` | 1 | 31 | package descriptions, unit descriptions, tool help |
| `distroname-display` | 1 | 30 | `@DISTRONAME@`, `${DISTRONAME}`, `${OS_NAME}` in messages and the lines that substitute them |
| `label` | 4 | 29 | partition labels and the kernel command line naming them |
| `url` | 3 | 25 | ROCKNIX's site, organisation and mirrors |
| `override` | 1 | 23 | hand-classified lines (the four `DISTRONAME` consumers that are not display, the endpoints, the labels, the literals in the installer) |
| `residual` | 1 | 21 | reviewed by hand, no rule matched: third-party text mentioning a distro |
| `fwcfg-key` | 2 | 21 | a QEMU `fw_cfg` key and the project `config.xml` root |
| `override` | 2 | 15 | hand-classified lines (the four `DISTRONAME` consumers that are not display, the endpoints, the labels, the literals in the installer) |
| `visible-literal` | 1 | 14 | a literal `ROCKNIX` in a message, a dialog or a title |
| `override` | 3 | 14 | hand-classified lines (the four `DISTRONAME` consumers that are not display, the endpoints, the labels, the literals in the installer) |
| `override` | 4 | 6 | hand-classified lines (the four `DISTRONAME` consumers that are not display, the endpoints, the labels, the literals in the installer) |

## Class 1 CHANGE: every player-visible line, by file

The set #337's identity change works from (the interface's own strings are listed in `p0-read.md`; they live in the other tree). `via DISTRONAME` lines change by editing `distributions/ROCKNIX/options:17`; the rest are literals that become the placeholder or the new name.

- `projects/ROCKNIX/packages/misc/modules/sources/gamelist.xml` -- 75 lines: 6, 7, 8, 19, 20, 41, 42, 43, 44, 54, 67, 68, 79, 80, 91, 92, 127, 128, 151, 152, 163, 164, 176, 177, 189, 190, 201, 202, 213, 214, 225, 226, 237, 238, 249, 250, 261, 262, 273, 274, 285, 286, 297, 298, 309, 310, 321, 322, 333, 334, 345, 346, 357, 358, 369, 370, 381, 382, 393, 394, 405, 406, 417, 418, 429, 430, 441, 442, 453, 454, 465, 466, 478, 489, 490 (the Tools list a player sees in the interface (name, description, developer, publisher, the install script's name and path change together))
- `packages/tools/installer/scripts/installer` -- 9 lines: 284, 286, 328, 387, 389, 398, 435, 456, 485 (text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time)
- `projects/ROCKNIX/packages/tools/installer/scripts/installer` -- 7 lines: 374, 450, 452, 461, 495, 509, 538 (a literal in the project's installer where the generic one carries @DISTRONAME@ (the recipe's sed finds nothing here))
- `distributions/ROCKNIX/options:11`: `GIT_ORGANIZATION="ROCKNIX"` -- GIT_ORGANIZATION="ROCKNIX" -> written to os-release; the fork's organisation (a display fact nothing parses)
- `distributions/ROCKNIX/options:17` (via DISTRONAME): `DISTRONAME="ROCKNIX"` -- DISTRONAME="ROCKNIX" is the one line the display rename edits (base plan 1.3)
- `distributions/ROCKNIX/options:26`: `HOME_URL="https://rocknix.org"` -- HOME_URL: the fork's site (D-WORKFLOW-097/099: a placeholder page)
- `distributions/ROCKNIX/options:29`: `WIKI_URL="https://rocknix.org"` -- WIKI_URL: as HOME_URL
- `distributions/ROCKNIX/options:32`: `BUG_REPORT_URL="https://rocknix.org"` -- BUG_REPORT_URL: as HOME_URL
- `projects/ROCKNIX/packages/rocknix/sources/scripts/installtointernal:171`: `echo "Creating ROCKNIX partition #$RK_NUM (${RK_START_MB}MiB–${RK_END_MB}MiB)..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/packages/rocknix/sources/scripts/installtointernal:210`: `echo "Copying flash files to ROCKNIX..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/packages/rocknix/sources/scripts/installtointernal:252`: `echo "  ROCKNIX : ${RK_PART_DEV} (${rk_sz} GB)"` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/packages/rocknix/sources/scripts/installtointernal:255`: `echo "ROCKNIX Installation to internal UFS was successful. You can now reboot and remove y` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `packages/sysutils/busybox/package.mk:111` (via DISTRONAME): `sed -e "s/@DISTRONAME@-@OS_VERSION@/${DISTRONAME}-${OS_VERSION}/g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `packages/sysutils/busybox/package.mk:121` (via DISTRONAME): `sed -e "s/@DISTRONAME@/${DISTRONAME}/g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `packages/sysutils/busybox/package.mk:194` (via DISTRONAME): `sed -e "s/@DISTRONAME@/${DISTRONAME}/g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `scripts/image:203` (via DISTRONAME): `sed -e "s%@DISTRONAME@%${DISTRONAME}%g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `scripts/image:375` (via DISTRONAME): `sed -e "s%@DISTRONAME@%${DISTRONAME}%g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `scripts/image:385` (via DISTRONAME): `sed -e "s%@DISTRONAME@%${DISTRONAME}%g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `config/functions:848` (via DISTRONAME): `path_err_msg+="\n Please use another directory (for example your \$HOME) to build ${DISTRO` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `config/functions:1828` (via DISTRONAME): `printf -v preamble "%s Dashboard (%s) - %d of %d jobs completed, %s elapsed" "${DISTRONAME` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `config/show_config:9` (via DISTRONAME): `config_message+="\n Configuration for ${DISTRONAME} "` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `config/show_config:159` (via DISTRONAME): `config_message+="\n End Configuration for ${DISTRONAME}"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `packages/sysutils/busybox/scripts/init:391` (via DISTRONAME): `echo "Please re-install @DISTRONAME@"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `packages/sysutils/busybox/scripts/init:650` (via DISTRONAME): `echo "Please do not reboot or turn off your @DISTRONAME@ device!"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `projects/ROCKNIX/bootloader/install:7`: `echo "install: building ROCKNIX bootloader for ${DEVICE} (${BOOTLOADER}) ..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/bootloader/install:80`: `echo "install: ROCKNIX bootloader installation completed for ${BOOTLOADER}"` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:721`: `<title>ROCKNIX cloud sign-in</title>` -- the phone sign-in page's title
- `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth:1013`: `state.textContent = "This page stopped working. Reload it; if it happens again, tell the R` -- 'tell the ROCKNIX team' on the phone page
- `projects/ROCKNIX/packages/sysutils/busybox/package.mk:137` (via DISTRONAME): `sed -e "s/@DISTRONAME@/${DISTRONAME}/g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `projects/ROCKNIX/packages/sysutils/busybox/package.mk:237` (via DISTRONAME): `sed -e "s/@DISTRONAME@/${DISTRONAME}/g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `projects/ROCKNIX/packages/sysutils/busybox/scripts/init:625` (via DISTRONAME): `echo "Please re-install @DISTRONAME@"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `projects/ROCKNIX/packages/sysutils/busybox/scripts/init:885` (via DISTRONAME): `echo "Unsupported operating system update.  Please only use @DISTRONAME@ update packages w` -- the refusal message
- `config/options:27`: `export PROJECT="${PROJECT:-ROCKNIX}"` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `packages/sysutils/busybox/scripts/fs-resize:62` (via DISTRONAME): `echo "Please do not reboot or turn off your @DISTRONAME@ device!"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `packages/tools/installer/package.mk:23` (via DISTRONAME): `sed -e "s/@DISTRONAME@/${DISTRONAME}/g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `projects/ROCKNIX/bootloader/mkimage:109`: `echo "image: copying ROCKNIX ABL..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/devices/SM4450/bootloader/update.sh:21`: `echo "Updating ROCKNIX ABL on SD..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/devices/SM6115/bootloader/update.sh:21`: `echo "Updating ROCKNIX ABL on SD..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/devices/SM8250/bootloader/update.sh:21`: `echo "Updating ROCKNIX ABL on SD..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/devices/SM8550/bootloader/update.sh:21`: `echo "Updating ROCKNIX ABL on SD..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/devices/SM8650/bootloader/update.sh:21`: `echo "Updating ROCKNIX ABL on SD..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/devices/SM8750/bootloader/update.sh:21`: `echo "Updating ROCKNIX ABL on SD..."` -- a literal ROCKNIX in text a player reads (an echo, a dialog, a title)
- `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:839` (via DISTRONAME): `echo -e "\e[32m=> ${OS_NAME:-ROCKNIX} CLOUD SETUP\e[0m"` -- the console banner reads ${OS_NAME}
- `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-es-thebezelproject:24`: `readonly TITLE="the BezelProject for ROCKNIX"` -- a dialog title
- `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-memory-manager:151`: `echo "--- ROCKNIX Memory Manager Status ---"` -- a console status header
- `projects/ROCKNIX/packages/sysutils/busybox/scripts/fs-resize:59` (via DISTRONAME): `echo "Please do not reboot or turn off your @DISTRONAME@ device!"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `projects/ROCKNIX/packages/tools/installer/package.mk:16` (via DISTRONAME): `sed -e "s/@DISTRONAME@/${DISTRONAME}/g" \` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `projects/ROCKNIX/packages/ui/emulationstation/package.mk:97`: `<manufacturer>ROCKNIX</manufacturer>` -- the Tools system's manufacturer in the base-only es_systems.cfg (not on our images: EMULATION_DEVICE=yes)
- `scripts/build_compat:69` (via DISTRONAME): `IMAGE_NAME="${DISTRONAME}-${TARGET_VERSION}"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time
- `scripts/checkdeps:254` (via DISTRONAME): `echo "**** This system lacks the following tools needed to build ${DISTRONAME} ****"` -- text a player or an installer reads, substituted from DISTRONAME/OS_NAME at build or at run time

## Class 2 to 4: the families kept, one representative each

- class 2, `fwcfg-key` (21 lines), e.g. `distributions/ROCKNIX/config/functions:218`: `SUBDEVICES=$(xmlstarlet sel -t -m "//rocknix/${DEVICE}/*[@mkimage_options]" -v "` -- a QEMU fw_cfg key or the project config.xml's root element
- class 2, `name` (338 lines), e.g. `config/options:30`: `if [ "${PROJECT}" = "ROCKNIX" -a -z "${DEVICE}" ]; then` -- a package, script, unit, driver, device or variable name; a build identifier
- class 2, `other-tree` (120 lines), e.g. `config/noobs/os.json:2`: `"name": "@DISTRONAME@_@PROJECT@",` -- another distribution's or project's tree; not built for any target of ours
- class 2, `override` (15 lines), e.g. `config/path:19`: `BUILD=${BUILD_ROOT}/${BUILD_BASE}.${DISTRONAME}-${DEVICE:-$PROJECT}.${TARGET_ARC` -- the build root's name derives from DISTRONAME: build.${DISTRONAME}-<device>.<arch>; a changed DISTRONAME renames every root (warm roots must be moved or rebuilt cold; the stamps do not hash it)
- class 2, `tree-path` (67 lines), e.g. `config/functions:856`: `if [ -z "${DISTRO}" -o ! -d "${DISTRO_DIR}/${DISTRO}" ]; then` -- a path inside this tree (projects/ROCKNIX, distributions/ROCKNIX, packages/rocknix), retained by the plan's 1.3
- class 3, `cloud-path` (56 lines), e.g. `distributions/ROCKNIX/options:186`: `DISTRO_MIRROR="https://github.com/ROCKNIX/distribution-sources/releases/download` -- the cloud root and its folders (D-WORKFLOW-101: unchanged in 0.0.1)
- class 3, `hostname` (46 lines), e.g. `packages/sysutils/busybox/config/busybox-init.conf:891`: `# CONFIG_HOSTNAME is not set` -- the hostname variable or its default
- class 3, `hostname-mechanism` (120 lines), e.g. `packages/sysutils/busybox/package.mk:141`: `# create /etc/hostname` -- hostname handling in a third-party source or a build option: the mechanism, not the name (matched only by the case-insensitive superset)
- class 3, `override` (14 lines), e.g. `packages/linux/package.mk:131`: `# set default hostname based on ${DISTRONAME}` -- comment for the line below
- class 3, `runtime-path` (93 lines), e.g. `config/options:133`: `if [ -f "${ROOT}/.rocknix/options" ]; then` -- a path on the device or in a shipped file
- class 3, `settings-key` (39 lines), e.g. `projects/ROCKNIX/packages/apps/mangohud/sources/mangohud_set:30`: `MANGOHUD_INIT_STATE=$(get_setting "rocknix.mangohud.state")` -- a persisted settings key in system.cfg (renaming one resets a preference on upgrade)
- class 3, `url` (25 lines), e.g. `projects/ROCKNIX/devices/RK3326/packages/u-boot/config/overlays/README.txt:6`: `See https://rocknix.org/devices/unbranded/game-console-r35s-r36s/#new-displays-r` -- a network name (ROCKNIX's site, organisation or mirror); the two endpoints are handled by overrides
- class 4, `devicetree` (103 lines), e.g. `projects/ROCKNIX/bootloader/install:54`: `# rocknix_abl binary in. There is nothing under /usr/share for this` -- a device-tree compatible, node or bootloader artifact the boot chain matches on
- class 4, `label` (29 lines), e.g. `distributions/ROCKNIX/config/functions:359`: `linux /KERNEL boot=LABEL=${DISTRO_BOOTLABEL} disk=LABEL=${DISTRO_DISKLABEL} grub` -- a partition label or the kernel command line that names it
- class 4, `override` (6 lines), e.g. `distributions/ROCKNIX/options:202`: `DISTRO_BOOTLABEL="ROCKNIX"` -- DISTRO_BOOTLABEL=ROCKNIX: the boot partition label and kernel cmdline boot=LABEL= on every card and internal install

## The four `DISTRONAME` consumers that are not display text

- class 2 KEEP, `config/path:19`: `BUILD=${BUILD_ROOT}/${BUILD_BASE}.${DISTRONAME}-${DEVICE:-$PROJECT}.${TARGET_ARC` -- the build root's name derives from DISTRONAME: build.${DISTRONAME}-<device>.<arch>; a changed DISTRONAME renames every root (warm roots must be moved or rebuilt cold; the stamps do not hash it)
- class 3 KEEP, `projects/ROCKNIX/packages/linux/package.mk:160`: `${PKG_BUILD}/scripts/config --set-str CONFIG_DEFAULT_HOSTNAME "${DISTRONAME}"` -- as packages/linux/package.mk:132 (the override recipe repeats it)
- class 2 KEEP, `scripts/image:100`: `IMAGE_NAME="${DISTRONAME}-${DISTRO_ARCH}-${OS_VERSION}"` -- IMAGE_NAME = ${DISTRONAME}-<device>.<arch>-${OS_VERSION}: the asset names derive from DISTRONAME; the RC2 init accepts only an update file whose name contains its own DISTRONAME (init:882), so the RC2 -> 0.0.1 tar must carry ROCKNIX in its file name (IMAGE_SUFFIX or a renamed copy); see p0-updater.md
- class 4 KEEP, `projects/ROCKNIX/packages/sysutils/busybox/scripts/init:882`: `echo "${UPDATE_TAR} ${UPDATE_IMG} ${UPDATE_IMG_GZ}" 2>&1 | grep @DISTRONAME@ 2>&` -- the RC2 device's only distro-name check: the update file's NAME must contain @DISTRONAME@ or the update is refused and the device reboots

## Questions the sweep leaves for the owner

- `rocknix-report-stats:10` (`https://stats.rocknix.org`, run five minutes after every boot by `rocknix-report-stats.timer`): a 0.0.1 device would report itself into ROCKNIX's install statistics. KEEP until a yes; the change is the timer's `WantedBy=` line.
- `samba/config/smb.conf:11` (`server string = ROCKNIX`), `umtprd.conf:18,22` and `init:567` (USB and MTP strings), `dsperate.ini` nicknames, `dolphin-sa` and `xwayland` vendor strings: names a PC or a peer sees; KEEP in 0.0.1, a later sweep if wanted.
- `misc/modules/sources/gamelist.xml` (75 lines): the Tools list's `<developer>` and `<publisher>` read ROCKNIX and the install tool is `Install ROCKNIX.sh` (its path, `:40`, and its picture `images/install-rocknix.svg`, `:49`, change together with the name, `:41`); whether the fork keeps ROCKNIX as the *developer* of tools it did not write is an attribution call.

Excluded on purpose: the interface tree (128 lines, read in `p0-read.md`), `docs/`, `.claude/`, `tools/` and `research/` (the fork's own records, outside the shipped image), and the theme's logo text (#337).

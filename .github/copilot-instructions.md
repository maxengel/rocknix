# ROCKNIX Copilot Instructions

ROCKNIX is an **immutable Linux distribution for handheld gaming devices**, forked from
JELOS and built on the LibreELEC/CoreELEC cross-compilation build system. There is no
"application" to run here — the repository is a *build system* that cross-compiles a
complete OS image (kernel, bootloader, emulators, and userland) for a given device/arch.

## Build & development commands

The build is driven by three variables: `PROJECT` (default `ROCKNIX`), `DEVICE`
(default `SM8250`), and `ARCH` (default `aarch64`). Supported devices: `RK3588`,
`RK3566`, `RK3326`, `RK3399`, `S922X`, `SM8250`, `SM8550`, `H700`, `SDM845`, `AMD64`.

**Prerequisites & expectations:** builds are "built to order" — only enough OS to boot and
run emulators/ports is compiled. A single-device build needs ~200GB free (full `make world`
~1TB) and a **stable internet connection** (hundreds of source packages are downloaded; a
download failure often surfaces as a *misleading* build error). The first build can take
~10 hours; cached rebuilds take minutes. The reference host is Ubuntu 22.04 (matches the
`Dockerfile`). Branches: `main` (stable) and `dev` (newest/unstable).

**Docker is the recommended way to build** (host needs only Docker/Podman + Bash). The
`make docker-%` target wires Docker up to call the equivalent native `make` target:

```bash
make docker-image-pull          # pull ghcr.io/rocknix/rocknix-build:latest
make docker-RK3588              # full image build for a device (runs `make RK3588` in container)
make docker-shell               # interactive shell in the build container
PACKAGE=retroarch make docker-package   # build a single package in the container
```

Native (non-Docker) equivalents — run from a path **without spaces** and **never as root**:

```bash
make RK3588                                              # build a device image (see Makefile per-device targets)
make world                                               # build the primary device set
PROJECT=ROCKNIX DEVICE=RK3588 ARCH=aarch64 ./scripts/build_distro   # what `make RK3588` calls
./scripts/build <package>          # build ONE package (e.g. ./scripts/build retroarch)
./scripts/clean <package>          # clean ONE package so it rebuilds
make package PACKAGE=<name>         # build a single package
make package-clean PACKAGE=<name>  # clean a single package
make kconfig-menuconfig-RK3588     # edit a device's kernel config
scripts/checkdeps                  # verify host build dependencies
```

There is no unit-test suite. The relevant "lint" is **`tools/pkgcheck <package>`**, which
validates `package.mk` files (late-binding violations, duplicate/misspelled functions,
brace placement). Run it after editing any `package.mk`.

### Iterating on changes

The fastest dev loop is to rebuild one package inside the build container rather than a
whole image. Export the same `PROJECT`/`DEVICE`/`ARCH` you build with, then clean + build:

```bash
make docker-shell                                  # omit this line + `exit` when building natively
export PROJECT=ROCKNIX DEVICE=RK3588 ARCH=aarch64
./scripts/clean busybox && ./scripts/build busybox
exit
```

To produce a fresh, flashable image after a change, clean/build/install the package then
re-run `mkimage` (much faster than a from-scratch build):

```bash
export OS_VERSION=$(date +%Y%m%d) BUILD_DATE=$(date)
./scripts/clean emulationstation && ./scripts/build emulationstation
./scripts/install emulationstation && ./scripts/image mkimage
```

`emulationstation` source lives in a **separate git repo**, so its package build needs the
extra steps documented in `projects/ROCKNIX/packages/ui/emulationstation/package.mk`.

Built images land in `release/ROCKNIX-<DEVICE>.<ARCH>-<timestamp>.tar`. You can flash the
SD card, or push to a networked device via the in-place updater (preserves ES/emulator
settings): `scp` the release tar to `root@<host>:~/.update`, then reboot the device.

### Creating patches

Patches in a package's `patches/` directory are auto-applied after unpack; scope them per
device with `patches/<DEVICE>/`. Generate them from `sources/`:

```bash
# non-git source: keep a pristine .orig copy, edit, then diff
diff -rupN pkg pkg.orig > ../../packages/<group>/<pkg>/patches/<DEVICE>/001-mychange.patch
# git source: edit the checkout, then
git diff > ../../packages/<group>/<pkg>/patches/005-mychange.patch
```

Kernel quirks (e.g. panel rotation via `drm_panel_orientation_quirks.c` with DMI matching)
ship as patches under `packages/linux/patches/<DEVICE>/`; hardware/device quirks live under
`projects/ROCKNIX/packages/hardware/quirks/`. Don't break hotkey standards.

## High-level architecture

**Layered config resolution** (`config/options`): for every build, options are sourced in
order — `distributions/<DISTRO>/options` → `projects/<PROJECT>/options` →
`projects/<PROJECT>/devices/<DEVICE>/options` → `config/arch.<ARCH>`. Each layer can
override the previous, so device-specific knobs (CPU flags, kernel target, bootloader,
GPU/Mali family) live in the device `options` file.

**Directory roles:**
- `packages/` — generic, cross-project package definitions, grouped by function (`audio`,
  `emulation`, `network`, `linux`, `graphics`, `python`, ...). Every package is a directory
  containing a `package.mk`.
- `projects/<PROJECT>/` — SoC/vendor families (`ROCKNIX`, `Rockchip`, `Amlogic`,
  `Qualcomm`, `Allwinner`, `Samsung`, `NXP`, `RPi`, `Generic`, `ARM`). Hold
  `devices/<DEVICE>/options`, project/device-scoped package overrides, `patches/`,
  `filesystem/` overlays, and `bootloader/`.
- `distributions/<DISTRO>/` — distro identity (`version`, `options`, splash images).
- `config/` — global build options, per-arch defaults (`arch.aarch64`, etc.), toolchain
  helper functions.
- `scripts/` — the build engine (`build_distro`, `build`, `clean`, `image`, `install`).
- `tools/` — developer helpers (`pkgcheck`, `distro-tool`, `adjust_kernel_config`).
- `documentation/PER_DEVICE_DOCUMENTATION/<DEVICE>/` — generated per-device emulator/core
  support lists.

**Package override model:** a `package.mk` under `projects/<PROJECT>/packages/...` or
`projects/<PROJECT>/devices/<DEVICE>/...` overrides the generic one of the same name in
`packages/`. `DEVICE_ROOT` lets one device reuse another's build root (see `build_distro`).

**Build outputs (all gitignored):** `build.ROCKNIX-<DEVICE>.<ARCH>/` (work dir),
`sources/` (downloaded tarballs/git), `release/` and `target/` (image artifacts).

## Package (`package.mk`) conventions

`package.mk` is the LibreELEC build-recipe format. **`packages/readme.md` is the
authoritative reference**; `packages/packages.mk.template` is the starting point for new
packages (`packages/packages.mk.addon_template` for Kodi addons). Key points:

- Start with the SPDX header and copyright lines; **preserve upstream JELOS/LibreELEC
  credits** and add a ROCKNIX copyright line (the project is a fork — licensing/credits
  must be retained).
- Required vars: `PKG_NAME` (lowercase), `PKG_VERSION` (use the **full** git hash when
  pinning to git), `PKG_SHA256`, `PKG_LICENSE`, `PKG_SITE`, `PKG_URL`, `PKG_LONGDESC`,
  plus `PKG_DEPENDS_TARGET` (and `_HOST`/`_INIT`/`_BOOTSTRAP` as needed). Set
  `PKG_TOOLCHAIN` when auto-detection (meson/cmake/configure/make) is wrong; use
  `PKG_TOOLCHAIN="manual"` to fully hand-write build steps.
- **Late-binding rule (enforced by `pkgcheck`):** toolchain/path variables such as `CC`,
  `CFLAGS`, `LDFLAGS`, `PKG_BUILD`, `TARGET_*`, `PKG_CONFIG*` only exist *after* the package
  loads, so reference them **only inside functions** (`configure_package`,
  `pre_configure_target`, `pre_make_target`, etc.), never at global scope.
- Customize the build via `pre_*`/`post_*` hook functions (e.g. `post_makeinstall_target`)
  rather than replacing core build functions, so the package survives build-system updates.
- Branch per device inside a recipe with `case ${DEVICE} in ... esac` (see
  `projects/ROCKNIX/packages/emulators/standalone/dolphin-sa/package.mk`).
- Patches in a package's `patches/` dir are auto-applied after unpack; add extra patch
  sets via `PKG_PATCH_DIRS`.
- Install into the standard `usr/lib`, `usr/bin`, ... layout in the install dir; top-level
  hidden dirs (e.g. `.noinstall`) are excluded from the final image.

**Emulators:** libretro cores are named `*-lr` (`packages/emulation/libretro-*` and
`projects/ROCKNIX/packages/emulators/libretro/`); standalone emulators are named `*-sa`
(`projects/ROCKNIX/packages/emulators/standalone/`).

## Commit conventions

Match the existing history (this repo does **not** use Conventional Commits). Messages are
scoped by package or device, e.g.:

```
azahar-sa - bump to AZAHAR_PLUS_2123_2_A
SM8250 - linux - enable ntsync
emulationstation: bump package
wine - bump to 10.16
```

Use `<package>` or `<DEVICE> - <subsystem>` as the scope; version updates are typically
phrased as `bump to <version>`.

## Note on `.github/shared-copilot-knowledge/`

That directory is a **generic, externally-distributed** knowledge base ("Local
modifications will be overwritten") and is **not** ROCKNIX-specific. Prefer this file and
`packages/readme.md` for ROCKNIX guidance; treat the shared knowledge as general
background only.

## Scoped instruction files

Topic-specific guidance lives in `.github/instructions/*.instructions.md` (each with an
`applyTo` glob):
- `fork-workflow.instructions.md` — branch model and how to open clean upstream PRs from the
  fork without leaking personal artifacts (the `git rebase --onto upstream/next next pr/<name>`
  flow + the `.githooks/pre-push` guard).
- `rclone-cloud-sync.instructions.md` — the rclone cloud backup/restore subsystem under
  `projects/ROCKNIX/packages/network/rclone/`.
- `issue-tracking.instructions.md` — file issues/tracking on the fork (`maxengel/rocknix`),
  never upstream.
- `learning-capture.instructions.md` — when storing a memory, also consider an instruction-file
  abstraction and append a timestamped entry to the dated `docs/work-logs/` log.

## Further reading

- `packages/readme.md` — authoritative `package.mk` reference.
- Official contributor guides: <https://rocknix.org/contribute/> — build, modify, packages,
  and quirks. (Conceptually authoritative, but some paths there target upstream's layout;
  many components in this repo live under `projects/ROCKNIX/packages/…`.)

---
description: "Writing a package.mk and generating patches: the required fields, the templates, and how patches are produced and scoped."
paths:
  - "packages/**"
  - "projects/**"
---

# Packaging & patches

`packages/readme.md` is the authoritative `package.mk` reference and wins any
disagreement with this file. What follows is the working subset — the parts
that come up every time and the ones that are easy to get wrong.

## Starting a package

Copy `packages/packages.mk.template` (or `packages/packages.mk.addon_template`
for a Kodi addon) rather than an adjacent recipe, which may carry overrides you
do not want.

Open with the SPDX header and the copyright lines. **Preserve the upstream
JELOS/LibreELEC credits and add a ROCKNIX line** — this is a fork, and the
licensing depends on those being kept.

Required: `PKG_NAME` (lowercase), `PKG_VERSION`, `PKG_SHA256`, `PKG_LICENSE`,
`PKG_SITE`, `PKG_URL`, `PKG_LONGDESC`, and `PKG_DEPENDS_TARGET` (plus
`_HOST` / `_INIT` / `_BOOTSTRAP` where the package needs them).

Pin a git source with the **full** commit hash in `PKG_VERSION`. An abbreviated
hash works locally and then fails for someone else once the object count grows.

Set `PKG_TOOLCHAIN` when autodetection (meson/cmake/configure/make) guesses
wrong; `PKG_TOOLCHAIN="manual"` hands you the build steps entirely.

**Late binding is enforced by `tools/pkgcheck`.** `CC`, `CFLAGS`, `LDFLAGS`,
`PKG_BUILD`, `TARGET_*` and `PKG_CONFIG*` do not exist until after the package
is sourced, so reference them only inside functions — never at global scope.

Prefer `pre_*` / `post_*` hooks (`post_makeinstall_target`, …) over replacing a
core build function, so the recipe survives build-system updates. Branch per
device inside the recipe with `case ${DEVICE} in … esac`; see
`projects/ROCKNIX/packages/emulators/standalone/dolphin-sa/package.mk`.

Install into the normal `usr/lib`, `usr/bin`, … layout. Top-level hidden
directories such as `.noinstall` are dropped from the final image.

Run `tools/pkgcheck <package>` after every `package.mk` edit. It is the only
lint in the repo; the real test is that the package builds.

## Generating patches

Patches in a package's `patches/` directory apply automatically after unpack.
Scope one to a device with `patches/<DEVICE>/`, and add further patch sets with
`PKG_PATCH_DIRS`.

```bash
# non-git source: keep a pristine .orig alongside, edit, then diff
diff -rupN pkg.orig pkg > ../../packages/<group>/<pkg>/patches/<DEVICE>/001-mychange.patch

# git source: edit the checkout, then
git diff > ../../packages/<group>/<pkg>/patches/005-mychange.patch
```

Kernel patches live under `packages/linux/patches/<DEVICE>/` — that is where a
panel-rotation quirk in `drm_panel_orientation_quirks.c` belongs. Hardware and
device quirks go under `projects/ROCKNIX/packages/hardware/quirks/`.

Changing a quirk can move a button. **Do not break the hotkey standards** —
they are muscle memory on a handheld, and a silent remap reads as a broken
device rather than a changed default.

## Naming

Libretro cores are `*-lr` (`packages/emulation/libretro-*`,
`projects/ROCKNIX/packages/emulators/libretro/`); standalone emulators are
`*-sa` (`projects/ROCKNIX/packages/emulators/standalone/`).

## Where things land

Build work happens in `build.ROCKNIX-<DEVICE>.<ARCH>/`, downloads in
`sources/`, and images in `target/ROCKNIX-<DEVICE>.<ARCH>-<timestamp>.tar` —
all gitignored. Generated per-device core/emulator support lists live in
`documentation/PER_DEVICE_DOCUMENTATION/<DEVICE>/`.

Official contributor guides: <https://rocknix.org/contribute/>. Conceptually
sound, but some paths there follow upstream's layout, while many components in
this repo live under `projects/ROCKNIX/packages/…`.

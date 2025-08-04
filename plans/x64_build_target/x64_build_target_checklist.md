# Checklist: x64 Build Target Discovery

This checklist is based on semantic search and codebase review. It lists files and scripts that define or reference architectures, build targets, devices, or toolchains, and will need review or updates for x64 support.

## Core Configs
- [ ] config/arch.x86_64 (review, may need to clone for x64 or update logic)
- [ ] config/arch.i686 (reference for legacy x86 logic)
- [ ] config/path (TARGET_NAME, TARGET_ARCH, etc.)
- [ ] config/show_config (display logic for arch)

## Makefile
- [ ] Makefile (add new device/arch, update AMD64 logic, add X64/GENERIC_X64)

## Scripts
- [ ] scripts/build
- [ ] scripts/build_distro
- [ ] scripts/build_compat
- [ ] scripts/genbuildplan.py (PROJECT/DEVICE/ARCH logic)
- [ ] scripts/uboot_helper (device lists)

## Device Definitions
- [ ] projects/ROCKNIX/devices/ (add new device folder, e.g., X64/GENERIC_X64)
- [ ] projects/ROCKNIX/devices/X64/options (create new options file for x64)

## Packages & Toolchain
- [ ] packages/lang/gcc/package.mk (target logic)
- [ ] packages/lang/llvm/package.mk (target logic)
- [ ] packages/tools/syslinux/package.mk (PKG_ARCH)
- [ ] projects/ROCKNIX/packages/x11/driver/xf86-video-nvidia/package.mk (PKG_ARCH)
- [ ] projects/ROCKNIX/packages/multimedia/libvpx/package.mk (ARCH logic)
- [ ] projects/ROCKNIX/packages/multimedia/aom/package.mk (ARCH logic)

## Docker/CI
- [ ] Dockerfile (x86_64 logic, symlinks, qemu, etc.)
- [ ] tools/docker/*/Dockerfile (cross-arch logic)

## Documentation
- [ ] README.md (add x64 target info)
- [ ] tools/docker/README.md (update for x64)
- [ ] Any device/platform docs referencing AMD64/i686

---
Add or update this checklist as new files/logic are discovered during implementation.

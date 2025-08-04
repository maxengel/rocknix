# Build Target Planning: x64 Pseudo-Cross-Compile

## Project Management Approach
This document uses an evolving, phased checklist approach. Each phase of the build target implementation is broken down into actionable tasks. As work progresses, new items can be added, completed items checked off, and the plan refined. This ensures transparency, adaptability, and clear progress tracking for contributors.

## Goal
Create a new build target for x64 systems. This will be a pseudo-cross-compile, building from an x64 environment to an x64 architecture.

## Initial Steps

## Phase 1: Analysis & Planning
- [x] Review existing build targets and architecture support (e.g., config/arch.x86_64, config/arch.aarch64)
- [x] Identify scripts, Makefile entries, and configuration files that define build targets and toolchains
- [x] Document pseudo-cross-compile logic for x64-to-x64
- [x] Gather requirements for Dockerfile/CI/CD changes

## Next Actions

## Phase 2: Discovery & Checklist Building
- [x] Use semantic search to identify all places where architectures and build targets are defined or referenced
- [x] Draft a checklist of files and scripts to update for x64 support
- [x] Document the process and any caveats for pseudo-cross-compiling x64 on x64

---
This file will be updated as planning progresses.

## Context: AMD64 Deprecation & x64 Target Restoration
The previous build target `AMD64` is deprecated in the new build system. Attempts to build with `DEVICE=AMD64` and `ARCH=i686` fail, as `AMD64` is not a valid device and `i686` is 32-bit x86, not x64. The new x64 target should:

- Define a new device (e.g., `X64` or `GENERIC_X64`) for the `ROCKNIX` project
- Ensure the device is recognized as valid in the build system
- Set `ARCH=x86_64` for true x64 support
- Update scripts, Makefile, and configs to support this device/arch
- Use pseudo-cross-compile logic (x64-to-x64)

## Checklist for x64 Build Target Implementation

## Phase 3: Implementation
- [ ] Add new device definition (e.g., `X64` or `GENERIC_X64`) in device lists and configs
- [ ] Update `Makefile` to support new device and set `ARCH=x86_64`
- [ ] Add or update config files (e.g., `config/arch.x64`)
- [ ] Update build scripts (`scripts/build`, `scripts/build_distro`, etc.) to recognize new device/arch
- [ ] Update package `.mk` files to include x64 logic where needed
- [ ] Update toolchain setup for x64 pseudo-cross-compile
- [ ] Update Dockerfile/CI scripts if needed
- [ ] Remove leftovers from previous x86_64 and 32-bit i686 builds/configs as encountered
- [ ] Document the process and any caveats

## Principles & Additional Tasks
- All changes must be non-intrusive and must not impact the build system for other architectures or contributors.
- Remove leftovers from previous x86_64 and 32-bit i686 builds/configs as encountered.
- Target only 64-bit x86_64 (not 32-bit i686).
- Test and validate that other architectures (ARM, aarch64, etc.) build successfully after changes.

## Phase 4: Validation & Testing
- [ ] Test and validate that other architectures (ARM, aarch64, etc.) build successfully after changes
- [ ] Review with contributors to ensure no regressions

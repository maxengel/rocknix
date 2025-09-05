# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build System Overview

ROCKNIX uses a complex Buildroot-based system that cross-compiles Linux distributions for various handheld gaming devices and architectures.

### Key Architecture Components

- **projects/**: Device-specific configurations organized by SoC family (Allwinner, Amlogic, ARM, Intel, NXP, Qualcomm, Rockchip)
- **packages/**: Package definitions with build scripts (package.mk files)
- **distributions/**: Top-level distribution configurations
- **scripts/**: Core build automation scripts
- **config/**: Global configuration files

Each project contains:
- Device-specific options and configurations
- Kernel patches and configurations
- Bootloader configurations
- Custom filesystem overlays

## Essential Commands

### Building
```bash
# Build all supported devices
make world

# Build specific device (native)
make GENERIC_X64
make RK3588
make SM8250

# Build using Docker (recommended)
make docker-GENERIC_X64
make docker-RK3588

# Build individual package
make package PACKAGE=<package_name>

# Clean package
make package-clean PACKAGE=<package_name>
```

### Docker Build Environment
```bash
# Build Docker image
make docker-image-build

# Pull latest Docker image
make docker-image-pull

# Interactive Docker shell
make docker-shell
```

### System Operations
```bash
# Generate system image
make system

# Generate release
make release

# Clean builds
make clean

# Complete clean (removes all build artifacts)
make distclean
```

### Kernel Configuration
```bash
# Interactive kernel config for device
make kconfig-menuconfig-GENERIC_X64

# Update kernel config with defaults
make kconfig-olddefconfig-GENERIC_X64
```

## Development Guidelines

### Core Principles (from .github/copilot-instructions.md)
1. **Measure twice, cut once** - Always analyze thoroughly before implementing
2. **Root cause analysis** - Find underlying issues, not symptoms
3. **Study existing patterns** - Don't reinvent working solutions
4. **Avoid piecemeal fixes** - Solve dependencies rather than removing them
5. **Maintain portability** - Consider multi-architecture implications
6. **Preserve build system integrity** - Avoid manual builds or workarounds that bypass the dockerized build environment; ensure all changes work cleanly in fresh containers and don't impact other build targets

### Build Target Development
- Study existing working architectures (ARM, aarch64) when implementing new targets
- Understand complete dependency chains before making changes
- Use Docker builds for consistency: `make docker-DEVICE`
- Validate builds across supported architectures

### Package Development
- Package definitions use `package.mk` files with specific variables
- Patches go in `packages/<category>/<package>/patches/`
- Follow cross-compilation best practices
- Test package builds individually before system builds

### Device/Platform Support
- Each SoC family has its own project directory structure
- Device options files define build parameters
- Kernel configurations are device-specific
- Bootloader configurations vary by platform

## File Structure Patterns

### Package Structure
```
packages/<category>/<package>/
├── package.mk          # Build definition
├── patches/           # Source patches
└── config/           # Package-specific configs
```

### Project Structure
```
projects/<SoC_FAMILY>/
├── devices/<DEVICE>/
│   ├── options       # Device build options
│   └── patches/      # Device-specific patches
├── linux/            # Kernel configurations
├── bootloader/       # Bootloader scripts
└── filesystem/       # Custom overlay files
```

## Testing and Validation

### Build Validation
- Always test builds in Docker environment
- Validate cross-compilation for target architecture
- Test both individual packages and full system builds
- Use phased approach for complex changes

### Device Testing
- QEMU testing available for GENERIC_X64: `./test_qemu.sh`
- Hardware testing required for ARM-based devices
- Validate boot process and core functionality

## Common Issues

### Build Problems
- Use `make clean` for package-specific issues
- Use `make distclean` for persistent build problems
- Check Docker environment for consistent builds
- Verify package dependencies are correctly defined

### Cross-Compilation
- Ensure proper toolchain selection in package.mk
- Check architecture-specific patches apply correctly
- Validate library dependencies for target architecture

## Repository Workflow

- Main development branch: `next`
- Current working branch: `x64-build-fix`
- Use standard Git workflow with descriptive commit messages
- Test changes thoroughly before submitting
- Follow project's Code of Conduct and contribution guidelines

## Important Notes

- This is a community-driven project focused on handheld gaming devices
- Build system is optimized for reproducible, portable builds
- Docker environment ensures consistent build results across development machines
- Legacy code and historical decisions may affect current build logic
- Always consult with maintainers for significant architectural changes
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Guidelines

- Avoid sycophancy and needless positivity when it isn't warranted
- Provide direct, objective feedback on build progress and failures
- Focus on technical accuracy over encouraging language
- Avoid excessive superlatives like "Perfect!", "Excellent!", "You're absolutely right!" - state facts directly

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
# IMPORTANT: Run builds in foreground to monitor progress
# NEVER use background execution for builds - always monitor output directly
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
7. **100% Build Completion Required** - CANNOT skip any packages; must achieve complete build success
8. **Multi-Architecture Awareness** - x64 changes must not impact other build targets (ARM, aarch64, etc.)
9. **GPU/iGPU Focus** - Improve GPU and integrated GPU support, targeting QEMU and VirtualBox environments
10. **Community Portability** - Maintain build system usability for other developers
11. **Docker-Only Build Requirement** - All builds MUST complete successfully using ONLY the Docker-based build system (`make docker-DEVICE`). NEVER use local/native build methods (`make package`, etc.) to complete builds as this violates portability goals. Any developer should be able to pull the latest environment and achieve 100% build success via Docker alone.

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

### GENERIC_X64 Specific Considerations
- **Pseudo-Cross-Compilation**: GENERIC_X64 performs pseudo-cross-compilation since we're building on x64 for an x64 target. This means the host and target architectures are the same, which can simplify some build processes but may also cause unique issues not seen in true cross-compilation scenarios.
- **Build Target Isolation**: Always ensure that any changes made for GENERIC_X64 are properly isolated from other build targets through appropriate conditional logic in package.mk files. Use device-specific or architecture-specific conditionals to prevent changes from affecting ARM, aarch64, or other architectures.
- **Host/Target Build Separation**: Even though host and target are the same architecture, the build system still maintains separate host and target build phases. Some packages may need both host tools and target binaries.

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
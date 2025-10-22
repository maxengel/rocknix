# ROCKNIX VirtualBox Installation Guide

This guide explains how to test ROCKNIX in VirtualBox with persistent storage, mimicking the installation experience on physical hardware.

## Overview

ROCKNIX includes a built-in installer that allows you to install the system to a disk. We provide two approaches for testing this in VirtualBox:

1. **Two-Disk Approach** (`test_virtualbox_installer.sh`) - Separate installer and target disks
2. **Single-Disk Approach** (`test_virtualbox_singledisk.sh`) - Combined disk with extra space

## Prerequisites

- VirtualBox installed on your system
- A built ROCKNIX image (run `make docker-GENERIC_X64` to build)
- At least 8GB RAM and 4 CPU cores available for the VM

## Approach 1: Two-Disk Installation (Recommended)

This approach most closely mimics installing from a USB stick to internal storage on a handheld device.

### Setup

```bash
./test_virtualbox_installer.sh
```

This script creates a VM with:
- **Port 0 (Primary)**: Empty 32GB target disk for installation
- **Port 1 (Secondary)**: Read-only installer disk with ROCKNIX

### Installation Process

1. The VM boots from the installer disk (Port 1)
2. The ROCKNIX installer menu appears
3. Select "Install ROCKNIX" from the menu
4. Choose the 32GB target disk when prompted
5. Confirm the installation (WARNING: This will wipe the target disk)
6. Wait for installation to complete (typically 5-10 minutes)
7. When installation completes, **DO NOT reboot immediately**

### Post-Installation

After installation completes, you have two options:

#### Option A: Remove Installer Disk (Clean Boot)

```bash
VBoxManage storageattach "ROCKNIX-Test" --storagectl SATA --port 1 --device 0 --medium none
```

Then reboot the VM. It will boot directly from the installed system.

#### Option B: Keep Installer Disk (Recovery Option)

Simply reboot. The VM will prefer booting from Port 0 (installed system). The installer disk remains available as a recovery option if needed.

### Advantages
- Clean separation between installer and installed system
- Can easily reset by recreating the target disk
- Installer disk is immutable (can't be accidentally modified)
- Matches physical hardware workflow

## Approach 2: Single-Disk Installation

This approach mimics devices where the installer and installation target are on the same physical storage.

### Setup

```bash
./test_virtualbox_singledisk.sh
```

This script creates a VM with:
- A single 64GB disk containing the installer image + extra unpartitioned space

### Installation Process

1. The VM boots from the installer partition on the disk
2. The ROCKNIX installer menu appears
3. Select "Install ROCKNIX" from the menu
4. The installer should detect the unpartitioned space on the same disk
5. Choose the available space for installation
6. Confirm and wait for installation to complete
7. Reboot when prompted

### Post-Installation

After rebooting, the system automatically boots from the installed partition. The installer partition remains on the disk but is no longer the default boot option.

### Advantages
- More closely mimics handheld device storage
- No need to detach disks after installation
- Persistent installation on a single storage device

## VM Configuration

Both scripts create VMs with the following specifications:

- **Memory**: 8GB RAM
- **CPUs**: 4 cores
- **Video Memory**: 128MB
- **Graphics**: VMSVGA with 3D acceleration
- **Storage**: SATA AHCI controller
- **Network**: NAT (for internet connectivity)
- **Audio**: Disabled
- **USB**: Disabled

You can modify these settings in the scripts or via VBoxManage after creation.

## Troubleshooting

### Installer doesn't detect the target disk

If the installer doesn't see the target disk:
1. Check that the disk is attached in VirtualBox settings
2. Verify the disk is not mounted in the host system
3. Try rebooting the VM

### Installation fails or hangs

1. Check the installation log within the installer menu
2. Verify you have enough disk space (at least 2GB required)
3. Ensure the target disk is completely empty

### VM won't boot after installation

If using the two-disk approach:
1. Verify the target disk is on Port 0 (primary boot device)
2. Try detaching the installer disk if still attached
3. Check VirtualBox boot order settings

If using the single-disk approach:
1. The bootloader should automatically prefer the installed system
2. If it boots to installer, the installation may have failed
3. Check installation logs and retry

### Can't find the ROCKNIX image

The scripts look for `target/ROCKNIX-GENERIC_X64.x86_64-20251006.img`. If your build created a different filename:
1. Update the `IMG_FILE` variable in the script
2. Or create a symlink to the expected filename

## Modifying VM Settings

After the initial setup, you can modify VM settings:

```bash
# Increase RAM to 16GB
VBoxManage modifyvm "ROCKNIX-Test" --memory 16384

# Increase CPUs to 8
VBoxManage modifyvm "ROCKNIX-Test" --cpus 8

# Enable USB 3.0
VBoxManage modifyvm "ROCKNIX-Test" --usbxhci on
```

## Expanding the Target Disk

If you need more space on the target disk:

```bash
# Power off the VM first
VBoxManage controlvm "ROCKNIX-Test" poweroff

# Resize the disk (example: expand to 64GB)
VBoxManage modifymedium disk target/ROCKNIX-TARGET-DISK.vdi --resize 65536

# Boot the VM and use a partition tool to expand the storage partition
```

## Comparison with QEMU Testing

The existing `test_qemu.sh` script boots directly from the raw image without installation. This is useful for quick testing but doesn't provide persistence across reboots.

The VirtualBox installation approaches provide:
- Persistent storage (changes survive reboots)
- True installation workflow testing
- More realistic user experience
- Ability to test upgrade paths

Use QEMU for quick development testing, and VirtualBox with installation for integration testing and user experience validation.

## Advanced: Manual VirtualBox Setup

If you prefer manual setup or need custom configuration:

1. Create a VM manually in VirtualBox GUI
2. Add SATA controller
3. Convert ROCKNIX image: `VBoxManage convertfromraw target/*.img target/installer.vdi`
4. Create target disk: `VBoxManage createmedium disk --filename target/target.vdi --size 32768`
5. Attach both disks to the VM
6. Boot and follow installation process

## Cleaning Up

To completely remove a test VM:

```bash
# Two-disk approach
VBoxManage unregistervm "ROCKNIX-Test" --delete
rm -f target/ROCKNIX-INSTALLER.vdi target/ROCKNIX-TARGET-DISK.vdi

# Single-disk approach
VBoxManage unregistervm "ROCKNIX-Test-SingleDisk" --delete
rm -f target/ROCKNIX-COMBINED.vdi
```

## Next Steps

After successful installation:
- Test the installed system's functionality
- Verify persistence (files saved survive reboot)
- Test system updates/upgrades
- Test game imports and emulator configuration
- Validate network connectivity
- Test USB passthrough (if enabled)

## Contributing

If you encounter issues with the VirtualBox testing workflow:
1. Check the installation logs
2. Report issues on GitHub with logs attached
3. Include your VirtualBox version and host OS details

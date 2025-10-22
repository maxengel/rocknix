# ROCKNIX Installer Improvements for GENERIC_X64

## Overview
This document describes improvements made to the ROCKNIX installer for the GENERIC_X64 target, addressing issues discovered during VirtualBox testing.

## Problems Discovered

### 1. Silent Failure During File Copy
**Problem**: During installation, the KERNEL and SYSTEM files were not being copied to the target disk, but the installation appeared to complete successfully.

**Root Cause**: Commands executed within the `{ ... } | whiptail --gauge` progress bar block do not properly report errors. If a `cp` command fails, the error is not visible to the user.

**Evidence**: 
- Examined target disk showed empty FAT16 partition (all zeros)
- Installation log only showed diagnostic output, no copy errors
- Whiptail progress bar reported 100% completion even though no data was copied

### 2. Storage Partition Not Initialized
**Problem**: The storage partition (ext4) was only mounted if `BACKUP_UNPACK=1` (i.e., only when restoring backup files).

**Consequence**: Systems without backup files had an empty storage partition with no `.please_resize_me` marker to trigger automatic resizing on first boot.

### 3. Logs Inaccessible After Installation
**Problem**: Installation logs were written to `/flash/logs/` (the installer disk), making them inaccessible after the installer disk is removed.

## Solutions Implemented

### Commit: "installer: Add installation log persistence and error reporting"

#### 1. Always Mount Storage Partition
**Change**: Storage partition is now always mounted, regardless of `BACKUP_UNPACK` setting.

**Benefit**: Enables consistent log writing and preparation of storage partition.

**Code**:
```bash
# Previously: only mounted if BACKUP_UNPACK=1
# Now: always mounted to save logs and create marker
msg_progress_install "88" "Saving installation log to target disk"
mkdir -p $TMPDIR/part2 >> $LOGFILE 2>&1
mount -t ext4 ${INSTALL_DEVICE}${PART2} $TMPDIR/part2 >> $LOGFILE 2>&1
```

#### 2. Create `.please_resize_me` Marker
**Change**: On every installation, create `/storage/.please_resize_me` to trigger automatic partition resizing on first boot.

**Benefit**: Matches ROCKNIX standard behavior seen in other architectures (ARM, aarch64). First boot automatically resizes the ext4 storage partition to fill available disk space.

**Related Code**: 
- `fs-resize` service in `busybox/scripts/fs-resize`
- `fs-resize.target` triggered on boot when marker exists

**Code**:
```bash
# Create the resize marker for first boot
touch $TMPDIR/part2/.please_resize_me >> $LOGFILE 2>&1
```

#### 3. Persistent Installation Logs
**Change**: Save installation logs to the target disk at `/.rocknix-installer-logs/`.

**Benefit**: Logs persist on the installed system and are accessible after removing the installer disk. Can be examined by mounting the target disk or booting the installed system.

**Code**:
```bash
# Save installation log to target disk for external access
mkdir -p $TMPDIR/part2/.rocknix-installer-logs >> $LOGFILE 2>&1
cp $LOGFILE $TMPDIR/part2/.rocknix-installer-logs/$(date +%Y%m%d%H%M%S).log >> $LOGFILE 2>&1
```

#### 4. Explicit Error Reporting for Critical Operations
**Change**: Added error checking and diagnostic output for KERNEL and SYSTEM copy operations.

**Benefit**: If file copy fails, the log now contains:
- Explicit SUCCESS/FAILED messages
- Directory listing of `/flash/` if copy fails
- Disk space information (`du`, `df`) to diagnose space issues

**Code**:
```bash
msg_progress_install "60" "Installing Kernel"
if cp "/flash/$IMAGE_KERNEL" $TMPDIR/part1/KERNEL >> $LOGFILE 2>&1; then
  echo "Kernel copy: SUCCESS" >> $LOGFILE
else
  echo "Kernel copy: FAILED - file not found or copy error: /flash/$IMAGE_KERNEL" >> $LOGFILE
  ls -la /flash/ >> $LOGFILE 2>&1
fi
```

## Post-Installation Log Access Methods

### Method 1: Mount Target Disk (After Installation)
```bash
# Convert VDI to RAW format
VBoxManage clonehd target/ROCKNIX-TARGET-DISK.vdi /tmp/target-raw.raw --format RAW

# Mount the storage partition
sudo mount -o loop,offset=$((8396800 * 512)) /tmp/target-raw.raw /mnt/target
ls /mnt/target/.rocknix-installer-logs/
```

### Method 2: Boot Installed System and Access Logs
```bash
# After booting the installed system
ls /storage/.rocknix-installer-logs/
cat /storage/.rocknix-installer-logs/*.log
```

### Method 3: Mount Installer Disk (Before Removal)
```bash
# If logs still needed on installer disk
ls /mnt/rocknix-installer/logs/
```

## Related Improvements

### Package: iwd
**Commit**: Earlier in build (already committed)

**Fix**: Added systemd to `PKG_DEPENDS_TARGET` and disabled `--enable-systemd-service` to align with ROCKNIX service management where systemd files are handled via post-install hooks.

**Result**: Resolved "systemd unit directory not found" configure error during GENERIC_X64 builds.

## Testing Recommendations

1. **Build Test**: `make docker-GENERIC_X64` (completed successfully - 640/640 packages)
2. **Installation Test**: Run installer with these changes to verify:
   - Logs appear in `/.rocknix-installer-logs/`
   - `.please_resize_me` is created on storage partition
   - Storage partition resizes on first boot
   - Error messages appear in logs if copy operations fail
3. **Log Access**: After installation, mount target disk and verify logs are readable

## Architecture Notes

**ROCKNIX Storage Architecture**:
- **System Partition** (FAT16): Boot files, KERNEL, SYSTEM squashfs image
- **Storage Partition** (ext4): User data, configs, resizable on first boot
- **Resize Marker**: `.please_resize_me` triggers automatic ext4 resize via `fs-resize` service
- **Boot Process**: `init` checks for marker and launches `fs-resize.target` before starting main system

This installer now follows the same pattern as other ROCKNIX architectures.

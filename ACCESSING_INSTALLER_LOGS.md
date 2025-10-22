# Accessing ROCKNIX Installation Logs from Outside VirtualBox

## Overview
With the installer improvements, installation logs are now saved to the target disk at `/.rocknix-installer-logs/`, making them accessible without VirtualBox.

## Methods to Access Logs

### Method 1: Mount Target Disk from Host (Easiest)

**Prerequisites**:
- Completed installation with VirtualBox VM shutdown
- Target disk VDI file: `target/ROCKNIX-TARGET-DISK.vdi`

**Steps**:

1. **Convert VDI to raw format** (if not already done):
   ```bash
   cd /home/max/Development/rocknix
   VBoxManage clonehd target/ROCKNIX-TARGET-DISK.vdi /tmp/rocknix-target.raw --format RAW
   ```

2. **Check partition layout**:
   ```bash
   sudo fdisk -l /tmp/rocknix-target.raw
   ```
   
   Expected output:
   ```
   Device                      Boot   Start      End  Sectors Size Id Type
   /tmp/rocknix-target.raw1    *       8192  8396799        4G  e W95 FAT16 (LBA)
   /tmp/rocknix-target.raw2         8396800       28G 83 Linux
   ```

3. **Attach to loop device**:
   ```bash
   sudo losetup -f /tmp/rocknix-target.raw
   # Will output: /dev/loopX (e.g., /dev/loop6)
   ```

4. **Create mount points and mount partitions**:
   ```bash
   sudo mkdir -p /mnt/rocknix-system /mnt/rocknix-storage
   
   # Assuming /dev/loop6 was returned from losetup
   sudo mount -t vfat /dev/loop6p1 /mnt/rocknix-system
   sudo mount -t ext4 /dev/loop6p2 /mnt/rocknix-storage
   ```

5. **Access installation logs**:
   ```bash
   ls -la /mnt/rocknix-storage/.rocknix-installer-logs/
   cat /mnt/rocknix-storage/.rocknix-installer-logs/*.log
   ```

6. **Check for resize marker**:
   ```bash
   ls -la /mnt/rocknix-storage/.please_resize_me
   # Should exist if installation was successful
   ```

7. **Cleanup**:
   ```bash
   sudo umount /mnt/rocknix-system /mnt/rocknix-storage
   sudo losetup -d /dev/loop6
   ```

### Method 2: Boot Installed System and Access Logs

**Prerequisites**:
- Installed system already booted on target disk
- System has completed first boot with partition resize

**Steps**:

1. **Access logs via console/SSH**:
   ```bash
   ls /storage/.rocknix-installer-logs/
   cat /storage/.rocknix-installer-logs/*.log
   ```

2. **Check if resize was completed**:
   ```bash
   df -h /storage
   # Should show full partition size (e.g., 28G)
   
   ls -la /storage/.please_resize_me
   # Should NOT exist (deleted after first resize)
   ```

### Method 3: Extract Logs via VirtualBox (Before Shutdown)

**Prerequisites**:
- Installation still running or VM not yet powered off
- VirtualBox console still accessible

**Steps**:

1. **In the VM console after installation**:
   ```bash
   # If you can access a terminal before shutdown:
   cp /storage/.rocknix-installer-logs/*.log /tmp/
   # Then exit and use Method 1 to retrieve from /tmp on installed disk
   ```

## Troubleshooting

### Logs Directory Not Found

**Symptom**: `/mnt/rocknix-storage/.rocknix-installer-logs/` doesn't exist

**Possible Causes**:
1. Installation failed before storage partition mount
2. Directory creation failed due to permissions
3. Storage partition mount failed

**Investigation**:
```bash
# Check if storage partition is properly formatted
sudo e2fsck -n /dev/loop6p2

# Try forcing mount with verbose output
sudo mount -v -t ext4 /dev/loop6p2 /mnt/rocknix-storage

# Check filesystem contents
sudo ls -R /mnt/rocknix-storage/ | head -50
```

### Partition Mount Fails

**Symptom**: "Device /dev/loop6p2 does not exist"

**Solution**: kpartx may not have created partition devices. Use offset-based mount:

```bash
# Calculate partition 2 offset: (8396800 sectors * 512 bytes/sector)
OFFSET=$((8396800 * 512))

# Mount using offset
sudo mount -o loop,offset=$OFFSET -t ext4 /tmp/rocknix-target.raw /mnt/rocknix-storage
```

### Cannot Create Loop Device

**Symptom**: "Could not find free loop device"

**Solution**: Increase loop device capacity or cleanup existing devices

```bash
# Check existing loop devices
sudo losetup -a

# Release specific loop device
sudo losetup -d /dev/loop6

# Reload with more devices (if needed)
sudo modprobe loop max_part=8
```

## Log Content Examples

### Successful Installation Log
```
ROCKNIX Installer - ... started at:
...
# System status diagnostics
...
UUID_SYSTEM : 2210-0757
UUID_STORAGE: 34359cbd-a9d7-4407-a8a2-a82fe44b521d
...
Kernel copy: SUCCESS
System copy: SUCCESS
Setup bootloader with boot label = System and disk label = Storage
```

### Failed Installation Log
```
...
Kernel copy: FAILED - file not found or copy error: /flash/KERNEL
# /flash listing
# Disk space information (du, df)
...
```

## Automated Script

Save this as `extract-rocknix-logs.sh`:

```bash
#!/bin/bash

ROCKNIX_DIR="/home/max/Development/rocknix"
VDI_FILE="$ROCKNIX_DIR/target/ROCKNIX-TARGET-DISK.vdi"
RAW_FILE="/tmp/rocknix-target-logs.raw"
MOUNT_DIR="/tmp/rocknix-mount"

echo "=== ROCKNIX Installation Log Extractor ==="
echo ""

# Check if VDI exists
if [ ! -f "$VDI_FILE" ]; then
    echo "Error: VDI not found: $VDI_FILE"
    exit 1
fi

# Convert to RAW
echo "Converting VDI to RAW format..."
VBoxManage clonehd "$VDI_FILE" "$RAW_FILE" --format RAW 2>&1 | grep -v "^0%\|^10%\|^20%\|^30%\|^40%\|^50%\|^60%\|^70%\|^80%\|^90%"

# Attach to loop
echo "Attaching to loop device..."
LOOP_DEV=$(sudo losetup -f /tmp/rocknix-target-logs.raw | grep -oE '/dev/loop[0-9]+')
echo "Using loop device: $LOOP_DEV"

# Create mount directory
mkdir -p "$MOUNT_DIR"

# Mount storage partition
echo "Mounting storage partition..."
OFFSET=$((8396800 * 512))
sudo mount -o loop,offset=$OFFSET -t ext4 "$RAW_FILE" "$MOUNT_DIR" 2>/dev/null

if [ -d "$MOUNT_DIR/.rocknix-installer-logs" ]; then
    echo ""
    echo "=== Installation Logs ==="
    echo ""
    sudo ls -la "$MOUNT_DIR/.rocknix-installer-logs/"
    echo ""
    echo "=== Log Content ==="
    echo ""
    sudo cat "$MOUNT_DIR"/.rocknix-installer-logs/*.log
else
    echo "No logs found in $MOUNT_DIR/.rocknix-installer-logs/"
fi

# Cleanup
echo ""
echo "Cleaning up..."
sudo umount "$MOUNT_DIR"
sudo losetup -d "$LOOP_DEV"
rm -rf "$MOUNT_DIR"
rm -f "$RAW_FILE"

echo "Done!"
```

**Usage**:
```bash
chmod +x extract-rocknix-logs.sh
./extract-rocknix-logs.sh
```

## Summary

With these methods, you can easily access ROCKNIX installation logs from outside VirtualBox for debugging and analysis. The logs include:
- System diagnostics (disk layout, UUIDs, mounts)
- Installation progress and status for each step
- Error messages and file listings if copy operations fail
- Disk space information for troubleshooting

Choose the method that best fits your workflow:
- **Method 1**: Good for post-installation analysis on the build machine
- **Method 2**: Good when you want to boot the installed system and verify everything
- **Method 3**: Quick checks before shutdown
- **Script**: Automated extraction if you do this frequently

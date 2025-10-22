#!/bin/bash
# ROCKNIX VirtualBox Test with Installation Support
#
# This script sets up a VirtualBox VM with:
# 1. The ROCKNIX installer image (as a removable disk)
# 2. An empty target disk for installation
#
# After installation completes, detach the installer disk and reboot
# to boot from the installed system.

set -e

cd /home/max/Development/rocknix

VM_NAME="ROCKNIX-Test"
INSTALLER_VDI="target/ROCKNIX-INSTALLER.vdi"
TARGET_VDI="target/ROCKNIX-TARGET-DISK.vdi"
TARGET_SIZE_GB=32  # Size of the installation target disk

echo "==================================="
echo "ROCKNIX VirtualBox Installation VM"
echo "==================================="
echo ""

# Find the most recent ROCKNIX image (compressed or uncompressed)
IMG_GZ_FILE=$(ls -t target/ROCKNIX-GENERIC_X64.x86_64-*.img.gz 2>/dev/null | head -1)
IMG_FILE="${IMG_GZ_FILE%.gz}"

if [ -z "$IMG_GZ_FILE" ] && [ -z "$(ls -t target/ROCKNIX-GENERIC_X64.x86_64-*.img 2>/dev/null | head -1)" ]; then
    echo "Error: No ROCKNIX images found in target/"
    echo "Please build ROCKNIX first with: make docker-GENERIC_X64"
    exit 1
fi

# Use uncompressed image if it exists and is newer, otherwise find most recent .img
if [ -z "$IMG_GZ_FILE" ]; then
    IMG_FILE=$(ls -t target/ROCKNIX-GENERIC_X64.x86_64-*.img 2>/dev/null | head -1)
fi

# Decompress if needed
if [ ! -f "$IMG_FILE" ] && [ -f "$IMG_GZ_FILE" ]; then
    echo "Decompressing ROCKNIX image: $(basename $IMG_GZ_FILE)"
    gunzip -k "$IMG_GZ_FILE"
fi

if [ ! -f "$IMG_FILE" ]; then
    echo "Error: Failed to find or decompress ROCKNIX image"
    exit 1
fi

echo "Using image: $(basename $IMG_FILE)"

# Remove existing VM if it exists
echo "Cleaning up existing VM (if any)..."
VBoxManage unregistervm "$VM_NAME" --delete 2>/dev/null || true
rm -f "$INSTALLER_VDI" "$TARGET_VDI"

# Convert raw image to VDI for the installer
echo "Converting installer image to VDI format..."
VBoxManage convertfromraw "$IMG_FILE" "$INSTALLER_VDI" --format VDI

# Make the installer disk writethrough (changes discarded on reset)
echo "Setting installer disk to writethrough mode..."
VBoxManage modifymedium disk "$INSTALLER_VDI" --type writethrough

# Create empty target disk for installation
echo "Creating target disk ($TARGET_SIZE_GB GB) for installation..."
VBoxManage createmedium disk --filename "$TARGET_VDI" --size $((TARGET_SIZE_GB * 1024)) --format VDI

# Create VM
echo "Creating VM..."
VBoxManage createvm --name "$VM_NAME" --ostype "Linux_64" --register

# Configure VM with optimal settings for ROCKNIX
echo "Configuring VM..."
VBoxManage modifyvm "$VM_NAME" \
    --memory 8192 \
    --cpus 4 \
    --vram 128 \
    --graphicscontroller vmsvga \
    --accelerate3d on \
    --boot1 disk \
    --boot2 none \
    --boot3 none \
    --boot4 none \
    --audio none \
    --usb off \
    --nic1 nat

# Add SATA storage controller
echo "Adding storage controller..."
VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci --portcount 2

# Attach installer disk - SATA Port 0 (boots first)
echo "Attaching installer disk (SATA Port 0)..."
VBoxManage storageattach "$VM_NAME" \
    --storagectl "SATA" \
    --port 0 \
    --device 0 \
    --type hdd \
    --medium "$INSTALLER_VDI"

# Attach target disk (for installation) - SATA Port 1 (available for installation)
echo "Attaching target disk (SATA Port 1)..."
VBoxManage storageattach "$VM_NAME" \
    --storagectl "SATA" \
    --port 1 \
    --device 0 \
    --type hdd \
    --medium "$TARGET_VDI"

# Get absolute paths for display
INSTALLER_VDI_ABS=$(readlink -f "$INSTALLER_VDI")
TARGET_VDI_ABS=$(readlink -f "$TARGET_VDI")

echo ""
echo "==================================="
echo "VM Setup Complete!"
echo "==================================="
echo ""
echo "VM Name: $VM_NAME"
echo "Target Disk: $TARGET_VDI_ABS ($TARGET_SIZE_GB GB)"
echo "Installer Disk: $INSTALLER_VDI_ABS (read-only)"
echo ""
echo "INSTALLATION INSTRUCTIONS:"
echo "------------------------"
echo "1. The VM will boot from the installer disk (Port 0)"
echo "2. Select 'installer' from the boot menu"
echo "3. Follow the ROCKNIX installer prompts"
echo "4. Install to the available disk (should show as ~${TARGET_SIZE_GB}GB)"
echo "5. After installation completes, power off the VM"
echo "6. Swap the boot order so the installed system boots first:"
echo ""
echo "   VBoxManage storageattach \"$VM_NAME\" --storagectl SATA --port 0 --device 0 --medium \"$TARGET_VDI_ABS\""
echo "   VBoxManage storageattach \"$VM_NAME\" --storagectl SATA --port 1 --device 0 --medium \"$INSTALLER_VDI_ABS\""
echo ""
echo "7. Or simply detach the installer disk:"
echo ""
echo "   VBoxManage storageattach \"$VM_NAME\" --storagectl SATA --port 0 --device 0 --medium \"$TARGET_VDI_ABS\""
echo "   VBoxManage storageattach \"$VM_NAME\" --storagectl SATA --port 1 --device 0 --medium none"
echo ""
echo "8. Then start the VM to boot from the installed system"
echo ""
echo "Starting VM..."
VBoxManage startvm "$VM_NAME"

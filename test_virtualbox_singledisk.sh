#!/bin/bash
# ROCKNIX VirtualBox Test - Single Disk Approach
#
# This script creates a VM with a single large disk that contains:
# - The ROCKNIX installer image (copied to the disk)
# - Extra space for persistent installation
#
# This mimics the experience of installing to a handheld device where
# the installer and installed system share the same storage.

set -e

cd /home/max/Development/rocknix

VM_NAME="ROCKNIX-Test-SingleDisk"
COMBINED_VDI="target/ROCKNIX-COMBINED.vdi"
DISK_SIZE_GB=64  # Total disk size (installer + installation space)

echo "==================================="
echo "ROCKNIX VirtualBox Single-Disk VM"
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

# Get the size of the installer image in bytes
IMG_SIZE=$(stat -c%s "$IMG_FILE")
IMG_SIZE_MB=$((IMG_SIZE / 1024 / 1024))
echo "Installer image size: ${IMG_SIZE_MB}MB"

# Calculate required disk size (installer + extra space for installation)
REQUIRED_SIZE_MB=$((IMG_SIZE_MB + (DISK_SIZE_GB * 1024)))

# Remove existing VM if it exists
echo "Cleaning up existing VM (if any)..."
VBoxManage unregistervm "$VM_NAME" --delete 2>/dev/null || true
rm -f "$COMBINED_VDI"

# Create a larger disk that can hold the installer + installation
echo "Creating combined disk (${DISK_SIZE_GB}GB)..."
VBoxManage createmedium disk --filename "$COMBINED_VDI" --size $((DISK_SIZE_GB * 1024)) --format VDI

# Copy the installer image to the VDI
# Note: This requires converting and copying the raw image data
echo "Converting installer image to VDI and expanding for installation space..."
VBoxManage convertfromraw "$IMG_FILE" "${COMBINED_VDI}.tmp" --format VDI
VBoxManage clonemedium disk "${COMBINED_VDI}.tmp" "$COMBINED_VDI" --format VDI
rm -f "${COMBINED_VDI}.tmp"

# Resize the disk to include extra space
echo "Expanding disk to ${DISK_SIZE_GB}GB for installation..."
VBoxManage modifymedium disk "$COMBINED_VDI" --resize $((DISK_SIZE_GB * 1024))

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
VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci --portcount 1

# Attach the combined disk
echo "Attaching combined disk..."
VBoxManage storageattach "$VM_NAME" \
    --storagectl "SATA" \
    --port 0 \
    --device 0 \
    --type hdd \
    --medium "$COMBINED_VDI"

# Get absolute path for display
COMBINED_VDI_ABS=$(readlink -f "$COMBINED_VDI")

echo ""
echo "==================================="
echo "VM Setup Complete!"
echo "==================================="
echo ""
echo "VM Name: $VM_NAME"
echo "Disk: $COMBINED_VDI_ABS (${DISK_SIZE_GB}GB)"
echo ""
echo "INSTALLATION INSTRUCTIONS:"
echo "------------------------"
echo "1. The VM will boot from the installer in the disk"
echo "2. Use the ROCKNIX installer to install to the available unpartitioned space"
echo "3. The installer should detect the unused space on the same disk"
echo "4. After installation, the system will boot from the installed partition"
echo ""
echo "NOTE: This approach provides a persistent installation without needing"
echo "to detach any disks. The system behaves like a physical handheld device."
echo ""
echo "Starting VM..."
VBoxManage startvm "$VM_NAME"

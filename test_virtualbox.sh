#!/bin/bash
# VirtualBox test for ROCKNIX

cd /home/max/Development/rocknix

VM_NAME="ROCKNIX-Test"
IMG_FILE="target/ROCKNIX-GENERIC_X64.x86_64-20251006.img"
VDI_FILE="target/ROCKNIX-GENERIC_X64.x86_64-20251006.vdi"

echo "Setting up VirtualBox VM for ROCKNIX..."

# Remove existing VM if it exists
VBoxManage unregistervm "$VM_NAME" --delete 2>/dev/null || true

# Convert raw image to VDI if needed
if [ ! -f "$VDI_FILE" ] || [ "$IMG_FILE" -nt "$VDI_FILE" ]; then
    echo "Converting raw image to VDI format..."
    rm -f "$VDI_FILE"
    VBoxManage convertfromraw "$IMG_FILE" "$VDI_FILE" --format VDI
fi

# Create VM
echo "Creating VM..."
VBoxManage createvm --name "$VM_NAME" --ostype "Linux_64" --register

# Configure VM
echo "Configuring VM..."
VBoxManage modifyvm "$VM_NAME" \
    --memory 8192 \
    --cpus 4 \
    --vram 128 \
    --graphicscontroller vmsvga \
    --accelerate3d on \
    --boot1 disk \
    --audio none \
    --usb off \
    --nic1 nat

# Add storage controller
VBoxManage storagectl "$VM_NAME" --name "SATA" --add sata --controller IntelAhci --portcount 1

# Attach disk
VBoxManage storageattach "$VM_NAME" \
    --storagectl "SATA" \
    --port 0 \
    --device 0 \
    --type hdd \
    --medium "$VDI_FILE"

echo "Starting VM..."
VBoxManage startvm "$VM_NAME"

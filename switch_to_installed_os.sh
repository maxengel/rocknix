#!/bin/bash
# Switch VirtualBox VM to boot from installed OS instead of installer

set -e

cd /home/max/Development/rocknix

VM_NAME="ROCKNIX-Test"
INSTALLER_VDI="target/ROCKNIX-INSTALLER.vdi"
TARGET_VDI="target/ROCKNIX-TARGET-DISK.vdi"

echo "Switching $VM_NAME to boot from installed OS..."

# Get absolute paths
INSTALLER_VDI_ABS=$(readlink -f "$INSTALLER_VDI")
TARGET_VDI_ABS=$(readlink -f "$TARGET_VDI")

# Check if VM exists
if ! VBoxManage showvminfo "$VM_NAME" &>/dev/null; then
    echo "Error: VM '$VM_NAME' not found"
    exit 1
fi

# Power off VM if running
VM_STATE=$(VBoxManage showvminfo "$VM_NAME" --machinereadable | grep "^VMState=" | cut -d'"' -f2)
if [ "$VM_STATE" != "poweroff" ]; then
    echo "Powering off VM..."
    VBoxManage controlvm "$VM_NAME" poweroff 2>/dev/null || true
    sleep 3
fi

# Detach both disks
echo "Reconfiguring boot order..."
VBoxManage storageattach "$VM_NAME" --storagectl SATA --port 0 --device 0 --medium none 2>/dev/null || true
VBoxManage storageattach "$VM_NAME" --storagectl SATA --port 1 --device 0 --medium none 2>/dev/null || true

# Attach target disk to Port 0 (boots first)
echo "Attaching installed OS disk to Port 0..."
VBoxManage storageattach "$VM_NAME" \
    --storagectl SATA \
    --port 0 \
    --device 0 \
    --type hdd \
    --medium "$TARGET_VDI_ABS"

echo ""
echo "Boot order updated successfully!"
echo "Target disk (installed OS) is now on Port 0 and will boot first."
echo ""
echo "Starting VM..."
VBoxManage startvm "$VM_NAME"

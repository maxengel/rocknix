#!/bin/bash
# ROCKNIX QEMU Test Script
# Optimized for GENERIC_X64 testing

set -e

ROCKNIX_IMG="target/ROCKNIX-GENERIC_X64.x86_64-20251002.img"
QEMU_LOG="/tmp/rocknix-qemu-serial.log"

if [ ! -f "$ROCKNIX_IMG" ]; then
    echo "Error: ROCKNIX image not found: $ROCKNIX_IMG"
    exit 1
fi

echo "Starting ROCKNIX in QEMU..."
echo "Serial log: $QEMU_LOG"
echo "Use Ctrl+A, X to quit QEMU"

# Clean up any existing QEMU processes
pkill -f qemu-system-x86_64 2>/dev/null || true

# Start QEMU with proper virtio support for ROCKNIX
# Ensure graphics drivers match the system configuration
qemu-system-x86_64 \
    -machine q35,accel=kvm:tcg \
    -cpu max \
    -m 4G \
    -smp 4 \
    -drive file="$ROCKNIX_IMG",format=raw,if=virtio \
    -netdev user,id=net0 \
    -device virtio-net-pci,netdev=net0 \
    -device virtio-gpu-pci \
    -device virtio-keyboard-pci \
    -device virtio-mouse-pci \
    -display gtk,show-cursor=on \
    -audio driver=none \
    -serial stdio \
    -boot menu=on

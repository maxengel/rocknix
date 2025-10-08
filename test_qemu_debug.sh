#!/bin/bash
# ROCKNIX QEMU Debug Script
# Simplified configuration for debugging

set -e

ROCKNIX_IMG="target/ROCKNIX-GENERIC_X64.x86_64-20250925.img"
QEMU_LOG="/tmp/rocknix-qemu-debug.log"

if [ ! -f "$ROCKNIX_IMG" ]; then
    echo "Error: ROCKNIX image not found: $ROCKNIX_IMG"
    exit 1
fi

echo "Starting ROCKNIX in QEMU (debug mode)..."
echo "Debug log: $QEMU_LOG"
echo "Use Ctrl+A, X to quit QEMU"

# Clean up any existing QEMU processes
pkill -f qemu-system-x86_64 2>/dev/null || true

# Simple QEMU configuration for debugging
qemu-system-x86_64 \
    -machine pc-i440fx-2.12 \
    -cpu qemu64 \
    -m 2G \
    -smp 2 \
    -drive file="$ROCKNIX_IMG",format=raw,if=ide \
    -vga cirrus \
    -display gtk \
    -no-reboot \
    -serial file:"$QEMU_LOG" \
    -monitor stdio
#!/bin/bash
# Simple QEMU test for ROCKNIX

cd /home/max/Development/rocknix

echo "Testing ROCKNIX image with QEMU..."

qemu-system-x86_64 \
    -machine q35 \
    -cpu host \
    -enable-kvm \
    -m 8G \
    -smp 4 \
    -drive file=target/ROCKNIX-GENERIC_X64.x86_64-20251006.img,format=raw,if=virtio \
    -device virtio-gpu-pci \
    -display gtk,show-cursor=on \
    -netdev user,id=net0 \
    -device virtio-net-pci,netdev=net0 \
    -serial stdio
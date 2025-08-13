#!/bin/bash

# Fix priority number conflicts across all x64 devices
# This script renumbers the 095+ files to ensure sequential execution

cd "/home/max/Development/rocknix"

# Find all device directories with priority conflicts
devices=$(find projects/ROCKNIX/packages/hardware/quirks/devices -maxdepth 1 -type d -name "*" | grep -v "/devices$")

for device_dir in $devices; do
    if [[ -f "$device_dir/095-plymouth-communication-fixes" && -f "$device_dir/095-kernel-early-boot-fixes" ]]; then
        echo "Fixing priority conflicts in: $(basename "$device_dir")"
        
        # Rename Plymouth fixes from 095 to 096
        if [[ -f "$device_dir/095-plymouth-communication-fixes" ]]; then
            mv "$device_dir/095-plymouth-communication-fixes" "$device_dir/096-plymouth-communication-fixes"
            echo "  Renamed 095-plymouth-communication-fixes to 096"
        fi
        
        # Rename subsequent files to maintain order
        if [[ -f "$device_dir/096-systemd-security-overrides" ]]; then
            mv "$device_dir/096-systemd-security-overrides" "$device_dir/097-systemd-security-overrides"
            echo "  Renamed 096-systemd-security-overrides to 097"
        fi
        
        if [[ -f "$device_dir/097-dbus-fd-improvements" ]]; then
            mv "$device_dir/097-dbus-fd-improvements" "$device_dir/098-dbus-fd-improvements"
            echo "  Renamed 097-dbus-fd-improvements to 098"
        fi
        
        if [[ -f "$device_dir/098-mount-configuration-fixes" ]]; then
            mv "$device_dir/098-mount-configuration-fixes" "$device_dir/099-mount-configuration-fixes"
            echo "  Renamed 098-mount-configuration-fixes to 099"
        fi
        
        if [[ -f "$device_dir/099-service-lifecycle-coordination" ]]; then
            mv "$device_dir/099-service-lifecycle-coordination" "$device_dir/100-service-lifecycle-coordination"
            echo "  Renamed 099-service-lifecycle-coordination to 100"
        fi
        
        if [[ -f "$device_dir/100-virtualization-fixes" ]]; then
            mv "$device_dir/100-virtualization-fixes" "$device_dir/101-virtualization-fixes"
            echo "  Renamed 100-virtualization-fixes to 101"
        fi
        
        echo "  Priority conflicts fixed for $(basename "$device_dir")"
        echo ""
    fi
done

echo "All priority conflicts have been resolved!"

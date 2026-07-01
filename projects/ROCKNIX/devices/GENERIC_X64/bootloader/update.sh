#!/bin/sh
# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)
#
# In-place bootloader update for GENERIC_X64 (syslinux BIOS + GRUB UEFI on a
# FAT/ESP boot partition). Every copy is guarded so a missing file is a no-op.

[ -z "$SYSTEM_ROOT" ] && SYSTEM_ROOT=""
[ -z "$BOOT_ROOT" ] && BOOT_ROOT="/flash"

BL="$SYSTEM_ROOT/usr/share/bootloader"

# mount $BOOT_ROOT rw
mount -o remount,rw "$BOOT_ROOT"

# syslinux (BIOS) support files at the FAT root
for f in ldlinux.c32 ldlinux.sys libcom32.c32 libutil.c32; do
  [ -f "$BL/$f" ] && echo "Updating $f..." && cp "$BL/$f" "$BOOT_ROOT/"
done
[ -f "$BL/syslinux.cfg" ] && echo "Updating syslinux.cfg..." && cp "$BL/syslinux.cfg" "$BOOT_ROOT/"

# GRUB/syslinux UEFI loader + config on the ESP
if [ -f "$BL/bootx64.efi" ] || [ -f "$BL/ldlinux.e64" ] || [ -f "$BL/grub.cfg" ]; then
  mkdir -p "$BOOT_ROOT/EFI/BOOT"
  [ -f "$BL/bootx64.efi" ] && echo "Updating UEFI loader..." && cp "$BL/bootx64.efi" "$BOOT_ROOT/EFI/BOOT/"
  [ -f "$BL/ldlinux.e64" ] && cp "$BL/ldlinux.e64" "$BOOT_ROOT/EFI/BOOT/"
  [ -f "$BL/grub.cfg" ] && echo "Updating grub.cfg..." && cp "$BL/grub.cfg" "$BOOT_ROOT/EFI/BOOT/"
fi

# mount $BOOT_ROOT ro
sync
mount -o remount,ro "$BOOT_ROOT"

echo "UPDATE" > /storage/.boot.hint

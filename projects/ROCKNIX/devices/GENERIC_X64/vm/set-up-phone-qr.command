#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 ROCKNIX (https://github.com/ROCKNIX)

# Makes the cloud-setup QR code scannable from a phone: detects this Mac's
# LAN address and writes it into the VM bundle, so the guest advertises an
# address phones can actually reach (the guest sits behind a port forward
# and cannot discover it on its own). Double-click to run; safe to re-run
# any time the Mac's address changes. Quit the VM in UTM first.
#
# Placeholders (@FWCFG_NAME@, @HOST_PORT@) are filled in at build time from
# the canonical VM profile.

set -euo pipefail

FWCFG_NAME="@FWCFG_NAME@"
HOST_PORT="@HOST_PORT@"

HERE="$(cd "$(dirname "$0")" && pwd)"

fail() {
    echo
    echo "ERROR: $1" >&2
    echo
    read -r -p "Press Return to close." _
    exit 1
}

# Find the VM bundle next to this script (or one level down after unzip).
CONFIG=""
for candidate in "${HERE}"/*.utm/config.plist "${HERE}"/*/*.utm/config.plist; do
    if [ -f "${candidate}" ]; then
        CONFIG="${candidate}"
        break
    fi
done
[ -n "${CONFIG}" ] || fail "No .utm bundle found next to this script.
Keep this file in the same folder as the ROCKNIX .utm bundle."

# The Mac's LAN address: the address of the interface holding the default
# route (Wi-Fi or Ethernet), which is what a phone on the same network sees.
IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
[ -n "${IFACE}" ] || fail "No network connection detected. Join a network first."
MAC_IP=$(ipconfig getifaddr "${IFACE}" 2>/dev/null || true)
[ -n "${MAC_IP}" ] || fail "Could not read this Mac's address on ${IFACE}."

URL="http://${MAC_IP}:${HOST_PORT}"

grep -q "name=${FWCFG_NAME}," "${CONFIG}" \
    || fail "This bundle does not carry the advertised-address setting.
Download a current ROCKNIX GENERIC_X64 build."

# The value lives in an XML plist, in the argument
#   name=<fwcfg>,string=<url>
# Rewrite whatever follows string= (placeholder or an older address).
sed -i '' -E \
    "s|(name=${FWCFG_NAME},string=)[^<]*|\\1${URL}|" \
    "${CONFIG}"
plutil -lint "${CONFIG}" >/dev/null || fail "The VM settings file failed validation after editing."

echo
echo "Done. The VM will advertise: ${URL}"
echo
echo "Start (or restart) the VM in UTM, open Cloud Setup on the ROCKNIX"
echo "screen, and the QR code will point your phone at this Mac."
echo
echo "Re-run this any time the Mac's network address changes."
echo
read -r -p "Press Return to close." _

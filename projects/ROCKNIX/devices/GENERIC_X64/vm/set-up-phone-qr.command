#!/bin/bash
# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026 ROCKNIX (https://github.com/ROCKNIX)

# Makes the cloud-setup QR code scannable from a phone: detects this Mac's
# LAN address and writes it into the VM's settings, so the guest advertises
# an address phones can actually reach (the guest sits behind a port forward
# and cannot discover it on its own). Double-click to run; re-run any time
# the Mac changes networks.
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

# UTM holds VM settings in memory and writes them back to disk when it
# quits, silently undoing any edit made while it is open. Editing behind
# its back is guaranteed to be lost, so refuse outright.
if pgrep -x UTM >/dev/null 2>&1; then
    fail "UTM is running. Quit UTM completely (Cmd-Q, not just stopping
the VM), then run this again."
fi

# The Mac's LAN address: the address of the interface holding the default
# route (Wi-Fi or Ethernet), which is what a phone on the same network sees.
IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
[ -n "${IFACE}" ] || fail "No network connection detected. Join a network first."
MAC_IP=$(ipconfig getifaddr "${IFACE}" 2>/dev/null || true)
[ -n "${MAC_IP}" ] || fail "Could not read this Mac's address on ${IFACE}."

URL="http://${MAC_IP}:${HOST_PORT}"

# Update every copy of the VM that carries the advertised-address setting:
# the bundle next to this script (fresh unzip) and any copy in UTM's own
# library (UTM keeps one there once the VM has been imported). Updating
# only the unzipped copy while UTM runs another is how addresses go stale.
FOUND=0
for candidate in \
    "${HERE}"/*.utm/config.plist \
    "${HERE}"/*/*.utm/config.plist \
    "${HOME}"/Library/Containers/com.utmapp.UTM/Data/Documents/*.utm/config.plist; do
    [ -f "${candidate}" ] || continue
    grep -q "name=${FWCFG_NAME}," "${candidate}" || continue
    FOUND=1
    OLD=$(sed -nE "s|.*name=${FWCFG_NAME},string=([^<]*).*|\\1|p" "${candidate}" | head -1)
    sed -i '' -E \
        "s|(name=${FWCFG_NAME},string=)[^<]*|\\1${URL}|" \
        "${candidate}"
    plutil -lint "${candidate}" >/dev/null \
        || fail "The VM settings file failed validation after editing:
${candidate}"
    echo "Updated: ${candidate}"
    if [ "${OLD}" = "${URL}" ]; then
        echo "  (address unchanged: ${URL})"
    else
        echo "  was: ${OLD:-<empty>}"
        echo "  now: ${URL}"
    fi
done

[ "${FOUND}" = 1 ] || fail "No ROCKNIX VM with the advertised-address setting
was found next to this script or in UTM's library. Keep this file in the
same folder as the ROCKNIX .utm bundle, or download a current build."

echo
echo "Done. The VM will advertise: ${URL}"
echo
echo "Start the VM in UTM and open Cloud Setup on the ROCKNIX screen -"
echo "the QR code now points your phone at this Mac."
echo
echo "If the phone asks for a username and password, they are shown on"
echo "the ROCKNIX screen next to the QR code."
echo
echo "Re-run this any time the Mac's network address changes."
echo
read -r -p "Press Return to close." _

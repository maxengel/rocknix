# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="raofflineproxy"
# Pinned by full commit (packages/README.md): main at 2026-09-12, nineteen
# commits past v1.13.0-alpha1, none of them touching what ROCKNIX runs
# except one muOS revert-path fix; APP_VERSION still reads 1.13.0-alpha1
# (docs/ra-offline/2026_09_13-phase-1-design-note.md, fork #164).
PKG_VERSION="64d03d30633ca6e7719c26d732cef3c97dedcc27"
PKG_SHA256="49b135cdf89d75ef33fe85ffa6d361bfca03e7012d8bd88fe43a476735206abd"
# GPLv3 text with no "or any later version" grant in the sources.
PKG_LICENSE="GPL-3.0-only"
PKG_SITE="https://github.com/misantronic/RAOfflineProxy"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
# Python3 is the interpreter, and its host build carries the compileall that
# python_compile runs; the service itself is stdlib-only (argparse, sqlite3,
# ssl, hmac, http, socketserver, ...), all of it in the image's lib-dynload.
PKG_DEPENDS_TARGET="toolchain Python3"
PKG_LONGDESC="RAOfflineProxy: a loopback proxy between the emulators and retroachievements.org that caches game data and queues casual awards earned without a connection, and sends them when one returns. Approved by RetroAchievements.org; casual (softcore) achievements only."
PKG_TOOLCHAIN="manual"

# OFFLINE RETROACHIEVEMENTS (fork #163/#165, D-RA-001, D-RA-002).
#
# What ships is the service and nothing around it: linux/raofflineproxy as a
# Python module in the image's site-packages, byte-compiled like the stdlib
# (the image carries .pyc only and the root filesystem is read-only, so
# uncompiled sources would recompile at every start), a systemd unit gated on
# the same kind of marker avahi and sshd use, and raofflineproxy-ctl, the
# fork's launcher that EmulationStation's toggle drives. Not shipped: the
# self-extracting bundle, the pygame menu and its SDL driver matrix, the
# Tools entry, the boot hook, and the upstream config patchers -- on ROCKNIX
# setsettings.sh rebuilds RetroArch's cheevos keys from system.cfg at every
# launch, so the OS owns the launch-time config and points the emulators at
# the proxy itself (setsettings.sh set_cheevos, cheevos_ppsspp.sh).

makeinstall_target() {
  local SITE="${INSTALL}/usr/lib/${PKG_PYTHON_VERSION}/site-packages"
  mkdir -p "${SITE}"
  cp -r "${PKG_BUILD}/linux/raofflineproxy" "${SITE}/raofflineproxy"
  rm -rf "${SITE}/raofflineproxy/__pycache__"
  # The SDL menu's fonts and donation QR images. menu_sdl.py only names the
  # paths at import; nothing on this image draws that menu.
  rm -rf "${SITE}/raofflineproxy/assets"
  rm -f "${SITE}"/raofflineproxy/font-mono*.ttf
  python_compile "${SITE}/raofflineproxy"

  mkdir -p "${INSTALL}/usr/bin"
  cp "${PKG_DIR}/sources/raofflineproxy-ctl" "${INSTALL}/usr/bin/raofflineproxy-ctl"
  chmod 0755 "${INSTALL}/usr/bin/raofflineproxy-ctl"
}

post_install() {
  # Enabled in the image; the unit's ConditionPathExists on
  # /storage/.cache/services/raofflineproxy.conf is the off-switch, and
  # raofflineproxy-ctl (and, at boot, /usr/lib/autostart/daemons) owns that
  # marker.
  enable_service raofflineproxy.service
}

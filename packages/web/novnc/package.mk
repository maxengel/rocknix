# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="novnc"
PKG_VERSION="1.6.0"
PKG_SHA256="5066103959ef4e9b10f37e5a148627360dd8414e4cf8a7db92bdbd022e728aaa"
PKG_LICENSE="MPL-2.0"
PKG_SITE="https://novnc.com/"
PKG_URL="https://github.com/novnc/noVNC/archive/refs/tags/v${PKG_VERSION}.tar.gz"
PKG_SOURCE_NAME="novnc-${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="noVNC: a VNC client that runs in a browser. Served by cloud_oauth so a phone can drive the sign-in window running on this device."
PKG_TOOLCHAIN="manual"

makeinstall_target() {
  # Static assets only -- no build step, and nothing here executes on the
  # device. The tests, CI config, docs and utility scripts in the tarball are
  # not shipped; what remains is what the browser loads.
  mkdir -p ${INSTALL}/usr/share/novnc
  cp -a app core vendor vnc.html ${INSTALL}/usr/share/novnc/
}

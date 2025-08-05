# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2025 ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="ryzenadj"
PKG_VERSION="0.17.0"
PKG_SHA256="45d29c4f41fdc35ae055b68e51fe5b78ef89c62f8e39d5a7b17f8d5c8e2e8e7f"
PKG_ARCH="x86_64"
PKG_LICENSE="LGPL-3.0"
PKG_SITE="https://github.com/FlyGoat/RyzenAdj"
PKG_URL="https://github.com/FlyGoat/RyzenAdj/archive/v${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain pciutils"
PKG_SECTION="sysutils"
PKG_SHORTDESC="ryzenadj: Adjust power management settings for Ryzen APUs"
PKG_LONGDESC="ryzenadj: Tool for adjusting power management settings for Ryzen Mobile Processors, including TDP, temperature limits, and performance profiles."
PKG_TOOLCHAIN="cmake"

PKG_CMAKE_OPTS_TARGET="-DCMAKE_BUILD_TYPE=Release"

makeinstall_target() {
  mkdir -p ${INSTALL}/usr/bin
  cp ${PKG_BUILD}/build/ryzenadj ${INSTALL}/usr/bin/
}

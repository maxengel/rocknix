# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2025 ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="ryzenadj"
PKG_VERSION="0.17.0"
PKG_SHA256="848ac9d86ff65d30f5e2c8600aac2613f0f10003b0d6f0e516a54761d7345d44"
PKG_ARCH="x86_64"
PKG_LICENSE="LGPL-3.0"
PKG_SITE="https://github.com/FlyGoat/RyzenAdj"
PKG_URL="https://github.com/FlyGoat/RyzenAdj/archive/v${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain pciutils systemd"
PKG_SECTION="sysutils"
PKG_SHORTDESC="ryzenadj: Adjust power management settings for Ryzen APUs"
PKG_LONGDESC="ryzenadj: Tool for adjusting power management settings for Ryzen Mobile Processors, including TDP, temperature limits, and performance profiles."
PKG_TOOLCHAIN="cmake"

PKG_CMAKE_OPTS_TARGET="-DCMAKE_BUILD_TYPE=Release
                       -DBUILD_SHARED_LIBS=OFF
                       -DCMAKE_EXE_LINKER_FLAGS='-ludev'"

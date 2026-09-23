# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="mame2003-plus-lr"
PKG_VERSION="a045126dad33d70ce555e7e7fe22a69d3a1efcc7"
PKG_SHA256="0b1661fb1c7d19746bd0e5d76fa10beccc5338328928e79ec620a4253a3216c4"
PKG_LICENSE="MAME"
PKG_SITE="https://github.com/libretro/mame2003-plus-libretro"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="MAME - Multiple Arcade Machine Emulator"

makeinstall_target() {
  mkdir -p ${INSTALL}/usr/lib/libretro
    cp -a mame2003_plus_libretro.so ${INSTALL}/usr/lib/libretro

  # The quarter turns this core asks the display for, per game, from the
  # driver table in the source this build compiles (fork #248, D-UI-082):
  # EmulationStation turns a game's captures by it when no session has
  # recorded the rotation yet, so what is already on a device is right the
  # moment the build is. The generator mirrors the core's own mapping.
  mkdir -p ${INSTALL}/usr/config/emulationstation/rotation
  python3 ${PKG_DIR}/../rotation-table-mame.py ${PKG_BUILD} src/drivers > ${INSTALL}/usr/config/emulationstation/rotation/mame2003_plus.txt
  echo "USING: mame2003_plus rotation table: $(wc -l < ${INSTALL}/usr/config/emulationstation/rotation/mame2003_plus.txt) games with a turn"
}

# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="fbalpha2012-lr"
PKG_VERSION="0ce31536bef3162fe7e69ff5f555334ec4913cef"
PKG_SHA256="6825b86c65887fc92ba02c07059d8225113bcca7764dab84ce21da18954c33af"
PKG_LICENSE="Non-commercial"
PKG_SITE="https://github.com/libretro/fbalpha2012"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="Port of Final Burn Alpha 2012 to Libretro"
PKG_TOOLCHAIN="make"

PKG_MAKE_OPTS_TARGET="-C svn-current/trunk -f makefile.libretro"

makeinstall_target() {
  mkdir -p ${INSTALL}/usr/lib/libretro
    cp -a svn-current/trunk/fbalpha2012_libretro.so ${INSTALL}/usr/lib/libretro

  # The quarter turns this core asks the display for, per game, from the
  # driver table in the source this build compiles (fork #248, D-UI-082):
  # EmulationStation turns a game's captures by it when no session has
  # recorded the rotation yet, so what is already on a device is right the
  # moment the build is. The generator mirrors the core's own mapping.
  mkdir -p ${INSTALL}/usr/config/emulationstation/rotation
  python3 ${PKG_DIR}/../rotation-table-fba.py ${PKG_BUILD}/svn-current/trunk > ${INSTALL}/usr/config/emulationstation/rotation/fbalpha2012.txt
  echo "USING: fbalpha2012 rotation table: $(wc -l < ${INSTALL}/usr/config/emulationstation/rotation/fbalpha2012.txt) games with a turn"
}

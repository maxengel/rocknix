# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="fbneo-lr"
PKG_VERSION="f3b774987e009d07f1322ebc4910532ed5b8c808"
PKG_SHA256="48e35bf75aa76200fb2bc64fa12d25606e0b7ebe3dcc41c37a641c33f93601d5"
PKG_LICENSE="Non-commercial"
PKG_SITE="https://github.com/libretro/FBNeo"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="Port of Final Burn Neo to Libretro (v0.2.97.38)."
PKG_TOOLCHAIN="make"

PKG_MAKE_OPTS_TARGET=" -C ../src/burner/libretro USE_CYCLONE=0 profile=performance"

if [[ "${TARGET_FPU}" =~ "neon" ]]; then
  PKG_MAKE_OPTS_TARGET+=" HAVE_NEON=1"
fi

post_unpack() {
  sed -i "s|LDFLAGS += -static-libgcc -static-libstdc++|LDFLAGS += -static-libgcc|" ${PKG_BUILD}/src/burner/libretro/Makefile
}

makeinstall_target() {
  mkdir -p ${INSTALL}/usr/lib/libretro
    cp -a ${PKG_BUILD}/src/burner/libretro/fbneo_libretro.so ${INSTALL}/usr/lib/libretro

  # The quarter turns the core asks the display for, per game, read from the
  # driver flags in the source this build compiles (fork #248, D-UI-081).
  # EmulationStation turns a game's save-state thumbnails and screenshots by
  # it when no session has recorded the rotation yet -- the captures already
  # on a device are right the moment the build is. The generator mirrors
  # libretro.cpp's mapping with the Vertical mode option off.
  mkdir -p ${INSTALL}/usr/config/emulationstation/rotation
  python3 ${PKG_DIR}/scripts/rotation-table.py ${PKG_BUILD} > ${INSTALL}/usr/config/emulationstation/rotation/fbneo.txt
  echo "USING: fbneo rotation table: $(wc -l < ${INSTALL}/usr/config/emulationstation/rotation/fbneo.txt) games with a turn"
}

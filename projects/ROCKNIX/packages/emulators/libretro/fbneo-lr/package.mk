# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="fbneo-lr"
PKG_VERSION="f3b774987e009d07f1322ebc4910532ed5b8c808"
PKG_SHA256="48e35bf75aa76200fb2bc64fa12d25606e0b7ebe3dcc41c37a641c33f93601d5"
PKG_LICENSE="Non-commercial"
PKG_SITE="https://github.com/libretro/FBNeo"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
# Python3:host for the rotation-table generator the install step runs
# (audit #258 PL-018): the interpreter the build's PATH finds, not whatever
# the container happens to carry.
PKG_DEPENDS_TARGET="toolchain Python3:host"
PKG_LONGDESC="Port of Final Burn Neo to Libretro (v0.2.97.38)."
PKG_TOOLCHAIN="make"

PKG_MAKE_OPTS_TARGET=" -C ../src/burner/libretro USE_CYCLONE=0 profile=performance"

if [[ "${TARGET_FPU}" =~ "neon" ]]; then
  PKG_MAKE_OPTS_TARGET+=" HAVE_NEON=1"
fi

post_unpack() {
  sed -i "s|LDFLAGS += -static-libgcc -static-libstdc++|LDFLAGS += -static-libgcc|" ${PKG_BUILD}/src/burner/libretro/Makefile
}

# The generated table has to have found the drivers: a generator pointed at
# the wrong directory writes an empty file and the build went green with it
# (audit #258 PL-018). The five tables carried 853 to 2544 rows on 2026-09-24;
# under 100 is a wrong path, not a smaller core. The generators live one
# directory up, shared by the fba cores and by the mame cores, so a change
# to one is a change to every table it writes -- and does not move this
# package's stamp (calculate_stamp hashes PKG_DIR alone), so clean these
# packages by hand after editing a generator.
rotation_table_check() {
  local table="${INSTALL}/usr/config/emulationstation/rotation/${1}.txt" rows
  rows=$(wc -l < "${table}")
  echo "USING: ${1} rotation table: ${rows} games with a turn"
  [ "${rows}" -ge 100 ] || die "rotation table ${1}.txt has ${rows} rows -- the generator found no drivers; check the source path handed to it"
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
  python3 ${PKG_DIR}/../rotation-table-fba.py ${PKG_BUILD} > ${INSTALL}/usr/config/emulationstation/rotation/fbneo.txt
  rotation_table_check fbneo
}

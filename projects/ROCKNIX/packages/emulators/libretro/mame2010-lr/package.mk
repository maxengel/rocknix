# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="mame2010-lr"
PKG_VERSION="484456818393505dd4367e6e4c116c573c04a1ec"
PKG_SHA256="2c00d52864e1ae4b0eb3335de89f29b1a8ebfe173c9e6910b302e379e92594a8"
PKG_LICENSE="MAME"
PKG_SITE="https://github.com/libretro/mame2010-libretro"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
# Python3:host for the rotation-table generator the install step runs
# (audit #258 PL-018): the interpreter the build's PATH finds, not whatever
# the container happens to carry.
PKG_DEPENDS_TARGET="toolchain Python3:host"
PKG_LONGDESC="Late 2010 version of MAME (0.139) for libretro. Compatible with MAME 0.139 romsets."

make_target() {
  if [ "${ARCH}" == "arm" ]; then
    make PLATCFLAGS="${CFLAGS}" PTR64=0 ARM_ENABLED=1 LCPU=arm
  elif [ "${ARCH}" == "i386" ]; then
    make PLATCFLAGS="${CFLAGS}" PTR64=0 ARM_ENABLED=0 LCPU=x86
  elif [ "${ARCH}" == "x86_64" ]; then
    make PLATCFLAGS="${CFLAGS}" PTR64=1 ARM_ENABLED=0 LCPU=x86_64
  elif [ "${ARCH}" == "aarch64" ]; then
    make PLATCFLAGS="${CFLAGS}" PTR64=1 ARM_ENABLED=1 LCPU=arm64
  fi
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
    cp -a mame2010_libretro.so ${INSTALL}/usr/lib/libretro

  # The quarter turns this core asks the display for, per game, from the
  # driver table in the source this build compiles (fork #248, D-UI-082):
  # EmulationStation turns a game's captures by it when no session has
  # recorded the rotation yet, so what is already on a device is right the
  # moment the build is. The generator mirrors the core's own mapping.
  mkdir -p ${INSTALL}/usr/config/emulationstation/rotation
  python3 ${PKG_DIR}/../rotation-table-mame.py ${PKG_BUILD} src/mame/drivers > ${INSTALL}/usr/config/emulationstation/rotation/mame2010.txt
  rotation_table_check mame2010
}

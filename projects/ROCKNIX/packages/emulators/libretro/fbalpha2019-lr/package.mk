# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="fbalpha2019-lr"
PKG_VERSION="0581797db6fdffd826086b053ced4b6b29bb6678"
PKG_SHA256="96812000a349e413d63bc5ef04ab7a330bb0b4194047c048ed6ec549b8274936"
PKG_LICENSE="Non-commercial"
PKG_SITE="https://github.com/libretro/fbalpha"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
# Python3:host for the rotation-table generator the install step runs
# (audit #258 PL-018): the interpreter the build's PATH finds, not whatever
# the container happens to carry.
PKG_DEPENDS_TARGET="toolchain Python3:host"
PKG_LONGDESC="Port of Final Burn Alpha to Libretro (v0.2.97.44)."
PKG_TOOLCHAIN="make"

PKG_MAKE_OPTS_TARGET="-f makefile.libretro"

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
    cp -a ${PKG_DIR}/fbalpha2019_libretro.info ${INSTALL}/usr/lib/libretro
    cp -a fbalpha_libretro.so ${INSTALL}/usr/lib/libretro/fbalpha2019_libretro.so

  # The quarter turns this core asks the display for, per game, from the
  # driver table in the source this build compiles (fork #248, D-UI-082):
  # EmulationStation turns a game's captures by it when no session has
  # recorded the rotation yet, so what is already on a device is right the
  # moment the build is. The generator mirrors the core's own mapping.
  mkdir -p ${INSTALL}/usr/config/emulationstation/rotation
  python3 ${PKG_DIR}/../rotation-table-fba.py ${PKG_BUILD} > ${INSTALL}/usr/config/emulationstation/rotation/fbalpha2019.txt
  rotation_table_check fbalpha2019
}

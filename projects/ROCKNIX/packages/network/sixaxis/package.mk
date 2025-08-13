# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2019-present Shanti Gilbert (https://github.com/shantigilbert)
# Copyright (C) 2023 JELOS (https://github.com/JustEnoughLinuxOS)

PKG_NAME="sixaxis"
PKG_VERSION="f53b0ca28c35ebd71b54190f33eadcb8c3267186"
PKG_LICENSE="GPL"
PKG_SITE="https://github.com/RetroPie/sixaxis"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="sixaxis helper service "
PKG_TOOLCHAIN="make"


makeinstall_target() {
  mkdir -p ${INSTALL}/usr/bin
    cp sixaxis-helper.sh ${INSTALL}/usr/bin/sixaxis-helper.sh
    cp bins/sixaxis-timeout ${INSTALL}/usr/bin/sixaxis-timeout
}

post_install() {
  # Do not enable the bare template without an instance; this causes systemd warnings.
  # Users or udev rules should start specific instances (e.g., sixaxis@hci0.service).
  :
}


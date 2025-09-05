# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2009-2016 Stephan Raue (stephan@openelec.tv)
# Copyright (C) 2018-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="libpciaccess"
PKG_VERSION="0.17"
PKG_SHA256="74283ba3c974913029e7a547496a29145b07ec51732bbb5b5c58d5025ad95b73"
PKG_LICENSE="OSS"
PKG_SITE="https://freedesktop.org"
PKG_URL="https://xorg.freedesktop.org/archive/individual/lib/${PKG_NAME}-${PKG_VERSION}.tar.xz"
# Enable host build for x86_64 (needed for libdrm host build on GENERIC_X64)
PKG_DEPENDS_HOST="toolchain:host util-macros:host zlib:host"
PKG_DEPENDS_TARGET="toolchain util-macros zlib"
PKG_LONGDESC="X.org libpciaccess library."
PKG_TOOLCHAIN="autotools"

# Configure host build for x86_64 targets
if [ "${TARGET_ARCH}" = "x86_64" ]; then
  PKG_CONFIGURE_OPTS_HOST="ac_cv_header_asm_mtrr_h=set \
                           --with-pciids-path=/usr/share \
                           --with-zlib "
fi

PKG_CONFIGURE_OPTS_TARGET="ac_cv_header_asm_mtrr_h=set \
                           --with-pciids-path=/usr/share \
                           --with-zlib "

pre_configure_host() {
  if [ "${TARGET_ARCH}" = "x86_64" ]; then
    CFLAGS+=" -D_LARGEFILE64_SOURCE"
  fi
}

pre_configure_target() {
  CFLAGS+=" -D_LARGEFILE64_SOURCE"
}

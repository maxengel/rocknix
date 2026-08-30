# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="libpsl"
PKG_VERSION="0.21.5"
PKG_SHA256="1dcc9ceae8b128f3c0b3f654decd0e1e891afc6ff81098f227ef260449dae208"
PKG_LICENSE="MIT"
PKG_SITE="https://github.com/rockdaboot/libpsl"
PKG_URL="https://github.com/rockdaboot/libpsl/releases/download/${PKG_VERSION}/${PKG_NAME}-${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain icu"
PKG_LONGDESC="Public Suffix List library, used by libsoup to scope cookies to registrable domains."

pre_configure_target() {
  # ICU rather than libidn2: it is already in the tree and in the image,
  # and libidn2 would drag in libunistring, which is not.
  PKG_MESON_OPTS_TARGET="-Druntime=libicu \
                         -Dbuiltin=true \
                         -Ddocs=false \
                         -Dtests=false"
}

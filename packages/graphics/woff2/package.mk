# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="woff2"
PKG_VERSION="1.0.2"
PKG_SHA256="add272bb09e6384a4833ffca4896350fdb16e0ca22df68c0384773c67a175594"
PKG_LICENSE="MIT"
PKG_SITE="https://github.com/google/woff2"
PKG_URL="https://github.com/google/woff2/archive/v${PKG_VERSION}/${PKG_NAME}-${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain brotli"
PKG_LONGDESC="WOFF2 web font decoder, required by WebKit for downloadable fonts."
PKG_TOOLCHAIN="cmake"

PKG_CMAKE_OPTS_TARGET="-DBUILD_SHARED_LIBS=ON \
                       -DCANONICAL_PREFIXES=ON"

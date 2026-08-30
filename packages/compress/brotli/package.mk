# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="brotli"
PKG_VERSION="1.1.0"
PKG_SHA256="e720a6ca29428b803f4ad165371771f5398faba397edf6778837a18599ea13ff"
PKG_LICENSE="MIT"
PKG_SITE="https://github.com/google/brotli"
PKG_URL="https://github.com/google/brotli/archive/v${PKG_VERSION}/${PKG_NAME}-${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="Brotli compression, required by woff2 to decode web fonts."
PKG_TOOLCHAIN="cmake"

PKG_CMAKE_OPTS_TARGET="-DBUILD_SHARED_LIBS=ON \
                       -DBROTLI_DISABLE_TESTS=ON"

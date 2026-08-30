# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="openjpeg"
PKG_VERSION="2.5.3"
PKG_SHA256="368fe0468228e767433c9ebdea82ad9d801a3ad1e4234421f352c8b06e7aa707"
PKG_LICENSE="BSD-2-Clause"
PKG_SITE="https://www.openjpeg.org/"
PKG_URL="https://github.com/uclouvain/openjpeg/archive/v${PKG_VERSION}/${PKG_NAME}-${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain zlib libpng tiff"
PKG_LONGDESC="JPEG 2000 codec; WebKit decodes JPEG 2000 images with it."
PKG_TOOLCHAIN="cmake"

PKG_CMAKE_OPTS_TARGET="-DBUILD_SHARED_LIBS=ON \
                       -DBUILD_STATIC_LIBS=OFF \
                       -DBUILD_CODEC=OFF \
                       -DBUILD_DOC=OFF \
                       -DBUILD_TESTING=OFF"

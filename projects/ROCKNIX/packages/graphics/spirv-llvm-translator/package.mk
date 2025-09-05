# SPDX-License-Identifier: GPL-2.0-only
# Copyright (C) 2024-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="spirv-llvm-translator"
PKG_VERSION="19.1.10"
PKG_SHA256="c829a6090b7ea9cdebaa5d3dbad0972f75bccb46d09b2fe02db17afd7cf4eff2"
PKG_LICENSE="LLVM"
PKG_SITE="https://github.com/KhronosGroup/SPIRV-LLVM-Translator"
PKG_DEPENDS_HOST="toolchain:host llvm:host"
PKG_URL="https://github.com/KhronosGroup/SPIRV-LLVM-Translator/archive/v${PKG_VERSION}.tar.gz"
PKG_LONGDESC="SPIRV-LLVM-Translator"
PKG_TOOLCHAIN="cmake"

PKG_CMAKE_OPTS_HOST="-DLLVM_EXTERNAL_SPIRV_HEADERS_SOURCE_DIR=${SYSROOT_PREFIX}/usr/include/spirv \
                     -DLLVM_SPIRV_BUILD_EXTERNAL=ON \
                     -DLLVM_BUILD_TOOLS=OFF"

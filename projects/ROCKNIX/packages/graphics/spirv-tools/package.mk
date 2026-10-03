# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2021-present Frank Hartung (supervisedthinking (@) gmail.com)
# Copyright (C) 2021-present Team LibreELEC (https://libreelec.tv)
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="spirv-tools"
# The SPIRV-Tools pkg_version needs to match the compatible (known_good) glslang pkg_version.
# https://raw.githubusercontent.com/KhronosGroup/glslang/${PKG_VERSION}/known_good.json
# When updating glslang pkg_version please update to the known_good spirv-tools pkg_version.
# freshness: pinned -- follows glslang16.6.0 known_good.json; SPIRV-Tools DEPS names the same headers (#386)
PKG_VERSION="ef96ed763b43b59b33b31b362f09a02b729fa1c9"
PKG_SHA256="82c62146083fd558735a3171cf97cfc47903ca7d368482e87f94bd44883c0f00"
PKG_LICENSE="Apache-2.0"
PKG_SITE="https://github.com/KhronosGroup/SPIRV-Tools"
PKG_URL="https://github.com/KhronosGroup/SPIRV-Tools/archive/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_HOST="toolchain:host"
PKG_DEPENDS_TARGET="toolchain"
PKG_DEPENDS_UNPACK="spirv-headers"
PKG_LONGDESC="The SPIR-V Tools project provides an API and commands for processing SPIR-V modules."

PKG_CMAKE_OPTS_HOST="-DSPIRV_SKIP_TESTS=ON"
PKG_CMAKE_OPTS_TARGET="-DSPIRV_SKIP_TESTS=ON \
                       -DSPIRV_SKIP_EXECUTABLES=ON \
                       -DBUILD_SHARED_LIBS=ON"

post_unpack() {
  mkdir -p ${PKG_BUILD}/external/spirv-headers
    tar --strip-components=1 \
      -xf "${SOURCES}/spirv-headers/spirv-headers-$(get_pkg_version spirv-headers).tar.gz" \
      -C "${PKG_BUILD}/external/spirv-headers"
}

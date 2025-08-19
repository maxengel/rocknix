# SPDX-License-Identifier: GPL-2.0-only
# Copyright (C) 2024-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="libclc"
PKG_VERSION="$(get_pkg_version llvm)"
PKG_LICENSE="Apache-2.0"
PKG_URL=""
PKG_DEPENDS_HOST="toolchain:host llvm:host spirv-tools spirv-tools:host"
PKG_DEPENDS_TARGET="toolchain llvm spirv-tools"
PKG_LONGDESC="Low-Level Virtual Machine (LLVM) is a compiler infrastructure."
PKG_DEPENDS_UNPACK+=" llvm"
PKG_PATCH_DIRS+=" $(get_pkg_directory llvm)/patches"
PKG_TOOLCHAIN="cmake"

unpack() {
  mkdir -p ${PKG_BUILD}
  tar --strip-components=1 -xf ${SOURCES}/llvm/llvm-${PKG_VERSION}.tar.xz -C ${PKG_BUILD}
}

pre_configure() {
  PKG_CMAKE_SCRIPT="${PKG_BUILD}/libclc/CMakeLists.txt"
}

pre_configure_host() {
  LIBCLC_TARGETS_TO_BUILD="spirv64-mesa3d-,spirv32-mesa3d-"

  mkdir -p "${PKG_BUILD}/.${HOST_NAME}"
  cd ${PKG_BUILD}/.${HOST_NAME}
  PKG_CMAKE_OPTS_HOST="-DLIBCLC_TARGETS_TO_BUILD=${LIBCLC_TARGETS_TO_BUILD}"
}

pre_configure_target() {
  LIBCLC_TARGETS_TO_BUILD="spirv64-mesa3d-,spirv32-mesa3d-"

  mkdir -p "${PKG_BUILD}/.${TARGET_NAME}"
  cd ${PKG_BUILD}/.${TARGET_NAME}
  
  # Always use TOOLCHAIN-provided LLVM tools (clang, llvm-as/link/opt) so CMake finds them
  PKG_CMAKE_OPTS_TARGET="-DLIBCLC_TARGETS_TO_BUILD=${LIBCLC_TARGETS_TO_BUILD}
                         -DLIBCLC_CUSTOM_LLVM_TOOLS_BINARY_DIR=${TOOLCHAIN}/bin"
  # Provide LLVM_DIR hint for non-x86_64 where we build host LLVM
  if [ "${TARGET_ARCH}" != "x86_64" ]; then
    PKG_CMAKE_OPTS_TARGET+=" -DLLVM_DIR=${TOOLCHAIN}/lib/cmake/llvm"
  fi
}

# NOTE: Cross-compiling libclc tries to build the prepare_builtins host tool
# for the target architecture and link against host LLVM, which fails.
# We don't need to build libclc for target: the bitcode and headers produced
# by the host build are architecture-independent and can be staged into the
# target sysroot. To avoid the cross-link error, skip the target build and
# just install host-produced artifacts into SYSROOT.
make_target() {
  : # no-op; use host-built libclc artifacts
}

makeinstall_target() {
  # Source (host-installed) paths (host installs into TOOLCHAIN prefix)
  local HOST_PREFIX="${TOOLCHAIN}"
  local HOST_DATADIR="${HOST_PREFIX}/share"
  local HOST_INCLUDEDIR="${HOST_PREFIX}/include"

  # Destination (target sysroot) paths
  local TGT_PREFIX="${SYSROOT_PREFIX}/usr"
  local TGT_DATADIR="${TGT_PREFIX}/share"
  local TGT_INCLUDEDIR="${TGT_PREFIX}/include"

  mkdir -p "${TGT_DATADIR}/clc" "${TGT_INCLUDEDIR}" "${TGT_DATADIR}/pkgconfig"

  # Copy bitcode libraries and includes from host into target sysroot
  if [ -d "${HOST_DATADIR}/clc" ]; then
    cp -a "${HOST_DATADIR}/clc/." "${TGT_DATADIR}/clc/"
  fi
  if [ -d "${HOST_INCLUDEDIR}/clc" ]; then
    cp -a "${HOST_INCLUDEDIR}/clc" "${TGT_INCLUDEDIR}/"
  fi
  # pkg-config file is useful for consumers
  if [ -f "${HOST_DATADIR}/pkgconfig/libclc.pc" ]; then
    cp -a "${HOST_DATADIR}/pkgconfig/libclc.pc" "${TGT_DATADIR}/pkgconfig/"
  fi
}

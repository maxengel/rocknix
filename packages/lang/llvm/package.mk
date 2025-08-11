# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2009-2016 Stephan Raue (stephan@openelec.tv)
# Copyright (C) 2018-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="llvm"
PKG_VERSION="20.1.8"
PKG_SHA256="6898f963c8e938981e6c4a302e83ec5beb4630147c7311183cf61069af16333d"
PKG_LICENSE="Apache-2.0"
PKG_SITE="http://llvm.org/"
PKG_URL="https://github.com/llvm/llvm-project/releases/download/llvmorg-${PKG_VERSION}/llvm-project-${PKG_VERSION/-/}.src.tar.xz"
PKG_DEPENDS_HOST="toolchain:host"
PKG_DEPENDS_TARGET="toolchain llvm:host zlib"
PKG_LONGDESC="Low-Level Virtual Machine (LLVM) is a compiler infrastructure."
PKG_TOOLCHAIN="cmake"

PKG_CMAKE_OPTS_COMMON="-DLLVM_INCLUDE_TOOLS=ON \
                       -DLLVM_BUILD_TOOLS=OFF \
                       -DLLVM_BUILD_UTILS=OFF \
                       -DLLVM_BUILD_EXAMPLES=OFF \
                       -DLLVM_INCLUDE_EXAMPLES=OFF \
                       -DLLVM_BUILD_TESTS=OFF \
                       -DLLVM_INCLUDE_TESTS=OFF \
                       -DLLVM_BUILD_BENCHMARKS=OFF \
                       -DLLVM_INCLUDE_BENCHMARKS=OFF \
                       -DLLVM_BUILD_DOCS=OFF \
                       -DLLVM_INCLUDE_DOCS=OFF \
                       -DLLVM_ENABLE_DOXYGEN=OFF \
                       -DLLVM_ENABLE_SPHINX=OFF \
                       -DLLVM_ENABLE_OCAMLDOC=OFF \
                       -DLLVM_ENABLE_BINDINGS=OFF \
                       -DLLVM_ENABLE_ASSERTIONS=OFF \
                       -DLLVM_ENABLE_WERROR=OFF \
                       -DLLVM_ENABLE_ZLIB=OFF \
                       -DLLVM_ENABLE_ZSTD=OFF \
                       -DLLVM_ENABLE_LIBXML2=OFF \
                       -DLLVM_BUILD_LLVM_DYLIB=ON \
                       -DLLVM_LINK_LLVM_DYLIB=ON \
                       -DLLVM_OPTIMIZED_TABLEGEN=ON \
                       -DLLVM_APPEND_VC_REV=OFF \
                       -DLLVM_ENABLE_RTTI=ON \
                       -DLLVM_ENABLE_UNWIND_TABLES=OFF \
                       -DLLVM_ENABLE_Z3_SOLVER=OFF \
                       -DCMAKE_SKIP_RPATH=ON"

if listcontains "${GRAPHIC_DRIVERS}" "(iris|panfrost)"; then
  PKG_DEPENDS_UNPACK="spirv-headers spirv-llvm-translator"
  PKG_CMAKE_OPTS_COMMON+=" -DLLVM_SPIRV_INCLUDE_TESTS=OFF"
fi

post_unpack() {
  if listcontains "${GRAPHIC_DRIVERS}" "(iris|panfrost)"; then
    mkdir -p "${PKG_BUILD}"/llvm/projects/{SPIRV-Headers,SPIRV-LLVM-Translator}
      tar --strip-components=1 \
        -xf "${SOURCES}/spirv-headers/spirv-headers-$(get_pkg_version spirv-headers).tar.gz" \
        -C "${PKG_BUILD}/llvm/projects/SPIRV-Headers"
      tar --strip-components=1 \
        -xf "${SOURCES}/spirv-llvm-translator/spirv-llvm-translator-$(get_pkg_version spirv-llvm-translator).tar.gz" \
        -C "${PKG_BUILD}/llvm/projects/SPIRV-LLVM-Translator"
  fi
}

pre_configure() {
  PKG_CMAKE_SCRIPT=${PKG_BUILD}/llvm/CMakeLists.txt
}

pre_configure_host() {
  case "${MACHINE_HARDWARE_NAME}" in
    "aarch64")
      LLVM_BUILD_TARGETS="AArch64"
      ;;
    "arm")
      LLVM_BUILD_TARGETS="ARM"
      ;;
    "x86_64")
      LLVM_BUILD_TARGETS="X86"
      ;;
  esac

  case "${TARGET_ARCH}" in
    "aarch64")
      LLVM_BUILD_TARGETS+="\;AArch64"
      ;;
    "arm")
      LLVM_BUILD_TARGETS+="\;ARM"
      ;;
    "x86_64")
      LLVM_BUILD_TARGETS+="\;X86\;AMDGPU"
      ;;
  esac

  mkdir -p ${PKG_BUILD}/.${HOST_NAME}
  cd ${PKG_BUILD}/.${HOST_NAME}
  
  # For x86_64, use minimal build configuration and rely on system tools
  if [ "${TARGET_ARCH}" = "x86_64" ]; then
echo "DEBUG: Using x86_64 LLVM configuration"
    PKG_CMAKE_OPTS_HOST="${PKG_CMAKE_OPTS_COMMON} \
                         -DCMAKE_BINARY_DIR=${PKG_BUILD}/.${HOST_NAME} \
                         -DLLVM_ENABLE_PROJECTS='' \
                         -DLLVM_TARGETS_TO_BUILD=${LLVM_BUILD_TARGETS} \
                         -DLLVM_INCLUDE_TOOLS=OFF \
                         -DLLVM_BUILD_TOOLS=OFF \
                         -DLLVM_OPTIMIZED_TABLEGEN=OFF"
  else
    PKG_CMAKE_OPTS_HOST="${PKG_CMAKE_OPTS_COMMON} \
                         -DCMAKE_BINARY_DIR=${PKG_BUILD}/.${HOST_NAME} \
                         -DLLVM_NATIVE_BUILD=${PKG_BUILD}/.${HOST_NAME}/native \
                         -DLLVM_ENABLE_PROJECTS='clang' \
                         -DCLANG_LINK_CLANG_DYLIB=ON \
                         -DLLVM_BUILD_TOOLS=ON \
                         -DLLVM_TARGETS_TO_BUILD=${LLVM_BUILD_TARGETS}"
  fi
}

post_make_host() {
  # For x86_64, skip host build and use system tools
  if [ "${TARGET_ARCH}" = "x86_64" ]; then
echo "DEBUG: Using x86_64 LLVM configuration"
    return 0
  fi

  ninja ${NINJA_OPTS} llvm-config llvm-objcopy llvm-tblgen clang llvm-as llvm-link opt

  if listcontains "${GRAPHIC_DRIVERS}" "(iris|panfrost)"; then
    ninja ${NINJA_OPTS} llvm-spirv
  fi
}

post_makeinstall_host() {
  # Create a test file to verify function execution
  echo "post_makeinstall_host was called with TARGET_ARCH='${TARGET_ARCH}'" > /tmp/llvm_debug.log
  
  # For x86_64, use system LLVM tools instead of building them
  if [ "${TARGET_ARCH}" = "x86_64" ]; then
    echo "x86_64 condition matched" >> /tmp/llvm_debug.log
    mkdir -p ${TOOLCHAIN}/bin
    # Create symlinks to system LLVM tools
    ln -sf /usr/bin/llvm-config-15 ${TOOLCHAIN}/bin/llvm-config
    ln -sf /usr/bin/llvm-objcopy-15 ${TOOLCHAIN}/bin/llvm-objcopy
    ln -sf /usr/bin/llvm-tblgen-15 ${TOOLCHAIN}/bin/llvm-tblgen
    ln -sf /usr/bin/clang-15 ${TOOLCHAIN}/bin/clang
    ln -sf /usr/bin/llvm-as-15 ${TOOLCHAIN}/bin/llvm-as
    ln -sf /usr/bin/llvm-link-15 ${TOOLCHAIN}/bin/llvm-link
    ln -sf /usr/bin/opt-15 ${TOOLCHAIN}/bin/opt
    
    # Set up the sysroot with system Clang libraries and headers
    mkdir -p ${SYSROOT_PREFIX}/usr/lib
    mkdir -p ${SYSROOT_PREFIX}/usr/include
    
    # Copy system Clang libraries to sysroot (using correct paths from container)
    cp -a /usr/lib/llvm-15/lib/libclangBasic.a ${SYSROOT_PREFIX}/usr/lib/
    cp -a /usr/lib/llvm-15/lib/libclang-cpp.so* ${SYSROOT_PREFIX}/usr/lib/
    cp -a /usr/lib/x86_64-linux-gnu/libclang-15.so* ${SYSROOT_PREFIX}/usr/lib/
    
    # Copy Clang headers to sysroot
    if [ -d /usr/lib/llvm-15/lib/clang ]; then
      cp -a /usr/lib/llvm-15/lib/clang ${SYSROOT_PREFIX}/usr/include/
    fi
    
    # Create pkg-config files in the sysroot
    mkdir -p ${SYSROOT_PREFIX}/usr/lib/pkgconfig
    cat > ${SYSROOT_PREFIX}/usr/lib/pkgconfig/clang.pc << EOF
prefix=\${pcfiledir}/../..
exec_prefix=\${prefix}
libdir=\${prefix}/lib
includedir=\${prefix}/include

Name: Clang
Description: Clang compiler library
Version: 15.0.0
Libs: -L\${libdir} -lclangBasic
Cflags: -I\${includedir}
EOF

    cat > ${SYSROOT_PREFIX}/usr/lib/pkgconfig/clang-cpp.pc << EOF
prefix=\${pcfiledir}/../..
exec_prefix=\${prefix}
libdir=\${prefix}/lib
includedir=\${prefix}/include

Name: Clang C++
Description: Clang C++ compiler library
Version: 15.0.0
Libs: -L\${libdir} -lclang-cpp
Cflags: -I\${includedir}
EOF
    
    if listcontains "${GRAPHIC_DRIVERS}" "(iris|panfrost)"; then
      ln -sf /usr/bin/llvm-spirv-15 ${TOOLCHAIN}/bin/llvm-spirv
    fi
    echo "x86_64 configuration completed" >> /tmp/llvm_debug.log
    return 0
  fi

  echo "Not x86_64, using standard LLVM installation" >> /tmp/llvm_debug.log
  mkdir -p ${TOOLCHAIN}/bin
    cp -a bin/llvm-config ${TOOLCHAIN}/bin
    cp -a bin/llvm-objcopy ${TOOLCHAIN}/bin
    cp -a bin/llvm-tblgen ${TOOLCHAIN}/bin
    cp -a bin/clang ${TOOLCHAIN}/bin
    cp -a bin/llvm-as ${TOOLCHAIN}/bin
    cp -a bin/llvm-link ${TOOLCHAIN}/bin
    cp -a bin/opt ${TOOLCHAIN}/bin

  if listcontains "${GRAPHIC_DRIVERS}" "(iris|panfrost)"; then
    cp -a bin/llvm-spirv "${TOOLCHAIN}/bin"
  fi
  echo "Standard LLVM installation completed" >> /tmp/llvm_debug.log
}

pre_configure_target() {
  mkdir -p ${PKG_BUILD}/.${TARGET_NAME}
  cd ${PKG_BUILD}/.${TARGET_NAME}
  
  # For x86_64, set up Clang libraries before target build
  if [ "${TARGET_ARCH}" = "x86_64" ]; then
echo "DEBUG: Using x86_64 LLVM configuration"
    # Set up the sysroot with system Clang libraries and headers
    mkdir -p ${SYSROOT_PREFIX}/usr/lib
    mkdir -p ${SYSROOT_PREFIX}/usr/include
    
    # Copy system Clang libraries to sysroot (using correct paths from container)
    cp -a /usr/lib/llvm-15/lib/libclangBasic.a ${SYSROOT_PREFIX}/usr/lib/
    cp -a /usr/lib/llvm-15/lib/libclang-cpp.so* ${SYSROOT_PREFIX}/usr/lib/
    cp -a /usr/lib/x86_64-linux-gnu/libclang-15.so* ${SYSROOT_PREFIX}/usr/lib/
    
    # Copy Clang headers to sysroot
    if [ -d /usr/lib/llvm-15/lib/clang ]; then
      cp -a /usr/lib/llvm-15/lib/clang ${SYSROOT_PREFIX}/usr/include/
    fi
    
    # Create pkg-config files in the sysroot
    mkdir -p ${SYSROOT_PREFIX}/usr/lib/pkgconfig
    cat > ${SYSROOT_PREFIX}/usr/lib/pkgconfig/clang.pc << EOF
prefix=\${pcfiledir}/../..
exec_prefix=\${prefix}
libdir=\${prefix}/lib
includedir=\${prefix}/include

Name: Clang
Description: Clang compiler library
Version: 15.0.0
Libs: -L\${libdir} -lclangBasic
Cflags: -I\${includedir}
EOF

    cat > ${SYSROOT_PREFIX}/usr/lib/pkgconfig/clang-cpp.pc << EOF
prefix=\${pcfiledir}/../..
exec_prefix=\${prefix}
libdir=\${prefix}/lib
includedir=\${prefix}/include

Name: Clang C++
Description: Clang C++ compiler library
Version: 15.0.0
Libs: -L\${libdir} -lclang-cpp
Cflags: -I\${includedir}
EOF

    PKG_CMAKE_OPTS_TARGET="${PKG_CMAKE_OPTS_COMMON} \
                           -DCMAKE_BINARY_DIR=${PKG_BUILD}/.${TARGET_NAME} \
                           -DCMAKE_CROSSCOMPILING=ON \
                           -DLLVM_ENABLE_PROJECTS='' \
                           -DLLVM_TARGETS_TO_BUILD=X86\;AMDGPU \
                           -DLLVM_TARGET_ARCH="${TARGET_ARCH}" \
                           -DLLVM_TABLEGEN=/usr/bin/llvm-tblgen-15 \
                           -DLLVM_CONFIG_PATH=/usr/bin/llvm-config-15 \
                           -DCLANG_TABLEGEN=/usr/bin/clang-tblgen-15"
  else
    PKG_CMAKE_OPTS_TARGET="${PKG_CMAKE_OPTS_COMMON} \
                           -DCMAKE_BINARY_DIR=${PKG_BUILD}/.${TARGET_NAME} \
                           -DLLVM_NATIVE_BUILD=${PKG_BUILD}/.${TARGET_NAME}/native \
                           -DCMAKE_CROSSCOMPILING=ON \
                           -DLLVM_ENABLE_PROJECTS='' \
                           -DLLVM_TARGETS_TO_BUILD=AMDGPU \
                           -DLLVM_TARGET_ARCH="${TARGET_ARCH}" \
                           -DLLVM_TABLEGEN=${TOOLCHAIN}/bin/llvm-tblgen"
  fi
}

post_makeinstall_target() {
  mkdir -p ${SYSROOT_PREFIX}/usr/bin
    cp -a ${TOOLCHAIN}/bin/llvm-config ${SYSROOT_PREFIX}/usr/bin

  rm -rf ${INSTALL}/usr/bin
  rm -rf ${INSTALL}/usr/lib/LLVMHello.so
  rm -rf ${INSTALL}/usr/lib/libLTO.so
  rm -rf ${INSTALL}/usr/share
}

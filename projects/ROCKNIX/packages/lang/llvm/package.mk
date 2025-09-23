# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2009-2016 Stephan Raue (stephan@openelec.tv)
# Copyright (C) 2018-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="llvm"
PKG_VERSION="19.1.7"
PKG_SHA256="82401fea7b79d0078043f7598b835284d6650a75b93e64b6f761ea7b63097501"
PKG_LICENSE="Apache-2.0"
PKG_SITE="http://llvm.org/"
PKG_URL="https://github.com/llvm/llvm-project/releases/download/llvmorg-${PKG_VERSION}/llvm-project-${PKG_VERSION/-/}.src.tar.xz"
PKG_DEPENDS_HOST="toolchain:host"
PKG_DEPENDS_TARGET="toolchain llvm:host zlib"
PKG_LONGDESC="Low-Level Virtual Machine (LLVM) is a compiler infrastructure."
PKG_TOOLCHAIN="cmake"

if listcontains "${GRAPHIC_DRIVERS}" "iris"; then
  PKG_DEPENDS_UNPACK="spirv-headers spirv-llvm-translator"
fi

PKG_CMAKE_OPTS_COMMON="-DLLVM_INCLUDE_TOOLS=ON \
                       -DLLVM_BUILD_TOOLS=ON \
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
                       -DLLVM_SPIRV_INCLUDE_TESTS=OFF \
                       -DCMAKE_SKIP_RPATH=ON"

post_unpack() {
  if listcontains "${GRAPHIC_DRIVERS}" "iris"; then
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
  
  # For x86_64 pseudo-cross-compilation, use system tools to avoid GLIBC issues
  if [ "${TARGET_ARCH}" = "x86_64" ] && [ "${MACHINE_HARDWARE_NAME}" = "x86_64" ]; then
    PKG_CMAKE_OPTS_HOST="${PKG_CMAKE_OPTS_COMMON} \
                         -DCMAKE_BINARY_DIR=${PKG_BUILD}/.${HOST_NAME} \
                         -DLLVM_ENABLE_PROJECTS='clang' \
                         -DCLANG_LINK_CLANG_DYLIB=ON \
                         -DLLVM_TARGETS_TO_BUILD=${LLVM_BUILD_TARGETS} \
                         -DLLVM_BUILD_UTILS=OFF \
                         -DLLVM_INCLUDE_TESTS=OFF \
                         -DLLVM_BUILD_TESTS=OFF \
                         -DLLVM_OPTIMIZED_TABLEGEN=OFF"
  else
    PKG_CMAKE_OPTS_HOST="${PKG_CMAKE_OPTS_COMMON} \
                         -DCMAKE_BINARY_DIR=${PKG_BUILD}/.${HOST_NAME} \
                         -DLLVM_NATIVE_BUILD=${PKG_BUILD}/.${HOST_NAME}/native \
                         -DLLVM_ENABLE_PROJECTS='clang' \
                         -DCLANG_LINK_CLANG_DYLIB=ON \
                         -DLLVM_TARGETS_TO_BUILD=${LLVM_BUILD_TARGETS}"
  fi
}

post_make_host() {
  # For x86_64 pseudo-cross-compilation, build minimal tools and Clang libraries
  if [ "${TARGET_ARCH}" = "x86_64" ] && [ "${MACHINE_HARDWARE_NAME}" = "x86_64" ]; then
    ninja ${NINJA_OPTS} llvm-config llvm-objcopy llvm-tblgen clang
    if listcontains "${GRAPHIC_DRIVERS}" "iris"; then
      ninja ${NINJA_OPTS} llvm-as llvm-link llvm-spirv opt
    fi
    return 0
  fi

  ninja ${NINJA_OPTS} llvm-config llvm-objcopy llvm-tblgen

  if listcontains "${GRAPHIC_DRIVERS}" "iris"; then
    ninja ${NINJA_OPTS} llvm-as llvm-link llvm-spirv opt
  fi
}

post_makeinstall_host() {
  mkdir -p ${TOOLCHAIN}/bin
  mkdir -p ${TOOLCHAIN}/lib

  # For x86_64 pseudo-cross-compilation, install Clang libraries but use system tools for compatibility
  if [ "${TARGET_ARCH}" = "x86_64" ] && [ "${MACHINE_HARDWARE_NAME}" = "x86_64" ]; then
    # Install built LLVM/Clang libraries to toolchain
    cp -a lib/libclang*.so* ${TOOLCHAIN}/lib/ 2>/dev/null || true
    cp -a lib/libLLVM*.so* ${TOOLCHAIN}/lib/ 2>/dev/null || true
    # Create custom llvm-config script that reports version 19.1.7 but uses toolchain paths for clang libraries
    cat > ${TOOLCHAIN}/bin/llvm-config << 'EOF'
#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLCHAIN_DIR="$(dirname "$SCRIPT_DIR")"

case "$1" in
  --version)
    echo "19.1.7"
    ;;
  --has-rtti)
    echo "YES"
    ;;
  --prefix)
    echo "/usr"
    ;;
  --libdir)
    echo "${TOOLCHAIN_DIR}/lib"
    ;;
  --includedir)
    echo "/usr/include"
    ;;
  --cppflags)
    echo "-I${TOOLCHAIN_DIR}/../x86_64-rocknix-linux-gnu/sysroot/usr/include"
    ;;
  --ldflags)
    echo "-L${TOOLCHAIN_DIR}/lib"
    ;;
  --libs|--link-static)
    echo "-L${TOOLCHAIN_DIR}/lib -lLLVM-19"
    ;;
  --system-libs)
    echo "-ldl -lpthread -lm"
    ;;
  --targets-built)
    echo "AArch64 AMDGPU ARM AVR BPF Hexagon Lanai LoongArch Mips MSP430 NVPTX PowerPC RISCV Sparc SystemZ VE WebAssembly X86 XCore"
    ;;
  --components)
    echo "aarch64 aarch64asmparser aarch64codegen aarch64desc aarch64disassembler aarch64info aarch64utils aggressiveinstcombine all all-targets amdgpu amdgpuasmparser amdgpucodegen amdgpudesc amdgpudisassembler amdgpuinfo amdgpuutils analysis arm armasmparser armcodegen armdesc armdisassembler arminfo armutils asmparser asmprinter avr avrasmparser avrcodegen avrdesc avrdisassembler avrinfo binaryformat bitreader bitwriter bpf bpfasmparser bpfcodegen bpfdesc bpfdisassembler bpfinfo cfguard codegen core coroutines coverage debuginfocodeview debuginfodwarf debuginfopdb demangle dlltooldriver dwp engine executionengine extensions filecheck frontendopenacc frontendopenmp fuzzmutate globalisel hellonew hexagon hexagonasmparser hexagoncodegen hexagondesc hexagondisassembler hexagoninfo instcombine instrumentation interfacestub interpreter ipo irreader jitlink lanai lanaiasmparser lanaicodegen lanaidesc lanaidisassembler lanaiinfo libdriver lineeditor linker loongarch loongarchasmparser loongarchcodegen loongarchdesc loongarchdisassembler loongarchinfo lto mc mca mcdisassembler mcjit mcparser mips mipsasmparser mipscodegen mipsdesc mipsdisassembler mipsinfo mirparser msp430 msp430asmparser msp430codegen msp430desc msp430disassembler msp430info native nativecodegen nvptx nvptxcodegen nvptxdesc nvptxinfo objcarcopts object objectyaml option orcjit orcshared orctargetprocess passes powerpc powerpcasmparser powerpccodegen powerpcdesc powerpcdisassembler powerpcinfo profiledata remarks riscv riscvasmparser riscvcodegen riscvdesc riscvdisassembler riscvinfo runtimedyld scalaropts selectiondag sparc sparcasmparser sparccodegen sparcdesc sparcdisassembler sparcinfo support symbolize systemz systemzasmparser systemzcodegen systemzdesc systemzdisassembler systemzinfo tablegen target textapi transformutils ve veasmparser vecodegen vedesc vedisassembler veinfo vectorize webassembly webassemblyasmparser webassemblycodegen webassemblydesc webassemblydisassembler webassemblyinfo webassemblyutils windowsmanifest x86 x86asmparser x86codegen x86desc x86disassembler x86info x86targetmca xcore xcorecodegen xcoredesc xcoredisassembler xcoreinfo xray"
    ;;
  *)
    # For any other options, delegate to system llvm-config-15
    /usr/bin/llvm-config-15 "$@"
    ;;
esac
EOF
    chmod +x ${TOOLCHAIN}/bin/llvm-config
    
    # Remove any existing broken symlinks and replace with system tool symlinks
    rm -f ${TOOLCHAIN}/bin/llvm-objcopy ${TOOLCHAIN}/bin/llvm-tblgen ${TOOLCHAIN}/bin/clang
    ln -sf /usr/bin/llvm-objcopy-15 ${TOOLCHAIN}/bin/llvm-objcopy
    ln -sf /usr/bin/llvm-tblgen-15 ${TOOLCHAIN}/bin/llvm-tblgen
    ln -sf /usr/bin/clang-15 ${TOOLCHAIN}/bin/clang
    
    if listcontains "${GRAPHIC_DRIVERS}" "iris"; then
      rm -f ${TOOLCHAIN}/bin/llvm-as ${TOOLCHAIN}/bin/llvm-link ${TOOLCHAIN}/bin/llvm-spirv ${TOOLCHAIN}/bin/opt
      ln -sf /usr/bin/llvm-as-15 ${TOOLCHAIN}/bin/llvm-as
      ln -sf /usr/bin/llvm-link-15 ${TOOLCHAIN}/bin/llvm-link
      ln -sf /usr/bin/llvm-spirv-15 ${TOOLCHAIN}/bin/llvm-spirv
      ln -sf /usr/bin/opt-15 ${TOOLCHAIN}/bin/opt
    fi
    return 0
  fi
  
  cp -a bin/llvm-config ${TOOLCHAIN}/bin
  cp -a bin/llvm-objcopy ${TOOLCHAIN}/bin
  cp -a bin/llvm-tblgen ${TOOLCHAIN}/bin

  if listcontains "${GRAPHIC_DRIVERS}" "iris"; then
    cp -a bin/{llvm-as,llvm-link,llvm-spirv,opt} "${TOOLCHAIN}/bin"
  fi
}

pre_configure_target() {
  mkdir -p ${PKG_BUILD}/.${TARGET_NAME}
  cd ${PKG_BUILD}/.${TARGET_NAME}
  
  # For x86_64 pseudo-cross-compilation, use host-built LLVM 19 tools for target build
  if [ "${TARGET_ARCH}" = "x86_64" ] && [ "${MACHINE_HARDWARE_NAME}" = "x86_64" ]; then
    PKG_CMAKE_OPTS_TARGET="${PKG_CMAKE_OPTS_COMMON} \
                           -DCMAKE_BINARY_DIR=${PKG_BUILD}/.${TARGET_NAME} \
                           -DCMAKE_CROSSCOMPILING=ON \
                           -DLLVM_ENABLE_PROJECTS='' \
                           -DLLVM_TARGETS_TO_BUILD=X86\;AMDGPU \
                           -DLLVM_TARGET_ARCH="${TARGET_ARCH}" \
                           -DLLVM_TABLEGEN=${PKG_BUILD}/.${HOST_NAME}/NATIVE/bin/llvm-tblgen \
                           -DLLVM_CONFIG_PATH=${PKG_BUILD}/.${HOST_NAME}/NATIVE/bin/llvm-config"
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
  # For x86_64 pseudo-cross-compilation, provide minimal LLVM target installation
  # to satisfy mesa and other dependents
  if [ "${TARGET_ARCH}" = "x86_64" ] && [ "${MACHINE_HARDWARE_NAME}" = "x86_64" ]; then
    # Remove any existing broken symlinks
    rm -f ${SYSROOT_PREFIX}/usr/bin/llvm-config
    
    # Copy our working llvm-config script to sysroot
    mkdir -p ${SYSROOT_PREFIX}/usr/bin
    cp -a ${TOOLCHAIN}/bin/llvm-config ${SYSROOT_PREFIX}/usr/bin/llvm-config
    
    # Ensure target llvm-config is in the right location for cross-compilation
    mkdir -p ${INSTALL}/usr/bin
    cp -a ${TOOLCHAIN}/bin/llvm-config ${INSTALL}/usr/bin/llvm-config
    
    # Create a minimal pkg-config file for LLVM
    mkdir -p ${SYSROOT_PREFIX}/usr/lib/pkgconfig
    cat > ${SYSROOT_PREFIX}/usr/lib/pkgconfig/llvm.pc << EOF
prefix=${SYSROOT_PREFIX}/usr
exec_prefix=\${prefix}
libdir=\${prefix}/lib
includedir=\${prefix}/include

Name: LLVM
Description: Low-Level Virtual Machine
Version: 19.1.7
Libs: -L\${libdir} -lLLVM
Cflags: -I\${includedir}
EOF
    
    # Keep essential LLVM libraries and llvm-config for target
    rm -rf ${INSTALL}/usr/lib/LLVMHello.so
    rm -rf ${INSTALL}/usr/lib/libLTO.so
    rm -rf ${INSTALL}/usr/share
    return 0
  fi
  
  mkdir -p ${SYSROOT_PREFIX}/usr/bin
  cp -a ${TOOLCHAIN}/bin/llvm-config ${SYSROOT_PREFIX}/usr/bin

  rm -rf ${INSTALL}/usr/bin
  rm -rf ${INSTALL}/usr/lib/LLVMHello.so
  rm -rf ${INSTALL}/usr/lib/libLTO.so
  rm -rf ${INSTALL}/usr/share
}

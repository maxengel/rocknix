# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2009-2016 Stephan Raue (stephan@openelec.tv)
# Copyright (C) 2018-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="mesa"
PKG_VERSION="25.1.5"
PKG_SHA256="3c4f6b10ff6ee950d0ec6ea733cc6e6d34c569454e3d39a9b276de9115a3b363"
PKG_LICENSE="OSS"
PKG_SITE="http://www.mesa3d.org/"
PKG_URL="https://mesa.freedesktop.org/archive/mesa-${PKG_VERSION}.tar.xz"
PKG_DEPENDS_HOST="toolchain:host expat:host libdrm:host Mako:host pyyaml:host spirv-tools:host"
PKG_DEPENDS_TARGET="toolchain expat libdrm Mako:host pyyaml:host"
PKG_LONGDESC="Mesa is a 3-D graphics library with an API."

get_graphicdrivers

if [ "${DEVICE}" = "Dragonboard" ]; then
  PKG_DEPENDS_TARGET+=" libarchive libxml2 lua54"
fi

PKG_MESON_OPTS_HOST="-Dglvnd=disabled \
                     -Dgallium-drivers=iris \
                     -Dgallium-vdpau=disabled \
                     -Dplatforms= \
                     -Dglx=disabled \
                     -Dvulkan-drivers= \
                     -Dshared-llvm=disabled \
                     -Dmesa-clc=disabled \
                     -Dtools=panfrost"

PKG_MESON_OPTS_TARGET="-Dgallium-drivers=${GALLIUM_DRIVERS// /,} \
                       -Dgallium-extra-hud=false \
                       -Dgallium-rusticl=false \
                       -Dshader-cache=enabled \
                       -Dopengl=true \
                       -Dgbm=enabled \
                       -Degl=enabled \
                       -Dvalgrind=disabled \
                       -Dlibunwind=disabled \
                       -Dlmsensors=disabled \
                       -Dbuild-tests=false \
                       -Ddraw-use-llvm=false \
                       -Dmicrosoft-clc=disabled"

if [ "${DISPLAYSERVER}" = "x11" ]; then
  PKG_DEPENDS_TARGET+=" xorgproto libXext libXdamage libXfixes libXxf86vm libxcb libX11 libxshmfence libXrandr"
  export X11_INCLUDES=
  PKG_MESON_OPTS_TARGET+=" -Dplatforms=x11 \
                           -Dglx=dri"
elif [ "${DISPLAYSERVER}" = "wl" ]; then
  PKG_DEPENDS_TARGET+=" wayland wayland-protocols"
  PKG_MESON_OPTS_TARGET+=" -Dplatforms=wayland \
                           -Dglx=disabled"
else
  PKG_MESON_OPTS_TARGET+=" -Dplatforms="" \
                           -Dglx=disabled"
fi

if listcontains "${GRAPHIC_DRIVERS}" "etnaviv"; then
  PKG_DEPENDS_TARGET+=" pycparser:host"
fi

if listcontains "${GRAPHIC_DRIVERS}" "(iris|panfrost)"; then
  if [ "${USE_REUSABLE}" = "yes" ]; then
    PKG_DEPENDS_TARGET+=" mesa-reusable"
  elif [ "${TARGET_ARCH}" = "x86_64" ]; then
    # For x86_64, use system Mesa tools to avoid LLVM host build issues
    PKG_MESON_OPTS_TARGET+=" -Dmesa-clc=disabled -Dprecomp-compiler=disabled"
  else
    PKG_DEPENDS_TARGET+=" mesa:host"
    PKG_MESON_OPTS_TARGET+=" -Dmesa-clc=system -Dprecomp-compiler=system"
  fi
fi

if listcontains "${GRAPHIC_DRIVERS}" "(nvidia|nvidia-ng)" ||
              [ "${OPENGL_SUPPORT}" = "yes" -a "${DISPLAYSERVER}" != "x11" ]; then
  PKG_DEPENDS_TARGET+=" libglvnd"
  PKG_MESON_OPTS_TARGET+=" -Dglvnd=enabled"
else
  PKG_MESON_OPTS_TARGET+=" -Dglvnd=disabled"
fi

if [ "${LLVM_SUPPORT}" = "yes" ]; then
  PKG_DEPENDS_TARGET+=" elfutils llvm"
  PKG_MESON_OPTS_TARGET+=" -Dllvm=enabled"
else
  PKG_MESON_OPTS_TARGET+=" -Dllvm=disabled"
fi

if [ "${VDPAU_SUPPORT}" = "yes" -a "${DISPLAYSERVER}" = "x11" ]; then
  PKG_DEPENDS_TARGET+=" libvdpau"
  PKG_MESON_OPTS_TARGET+=" -Dgallium-vdpau=enabled"
else
  PKG_MESON_OPTS_TARGET+=" -Dgallium-vdpau=disabled"
fi

if [ "${VAAPI_SUPPORT}" = "yes" ] && listcontains "${GRAPHIC_DRIVERS}" "(r600|radeonsi)"; then
  PKG_DEPENDS_TARGET+=" libva"
  PKG_MESON_OPTS_TARGET+=" -Dgallium-va=enabled \
                           -Dvideo-codecs=vc1dec,h264dec,h264enc,h265dec,h265enc,av1dec,av1enc,vp9dec"
else
  PKG_MESON_OPTS_TARGET+=" -Dgallium-va=disabled"
fi

if listcontains "${GRAPHIC_DRIVERS}" "vmware"; then
  PKG_MESON_OPTS_TARGET+=" -Dgallium-xa=enabled"
else
  PKG_MESON_OPTS_TARGET+=" -Dgallium-xa=disabled"
fi

if [ "${OPENGLES_SUPPORT}" = "yes" ]; then
  PKG_MESON_OPTS_TARGET+=" -Dgles1=disabled -Dgles2=enabled"
else
  PKG_MESON_OPTS_TARGET+=" -Dgles1=disabled -Dgles2=disabled"
fi

if [ "${VULKAN_SUPPORT}" = "yes" ]; then
  PKG_DEPENDS_TARGET+=" ${VULKAN} vulkan-tools ply:host"
  PKG_MESON_OPTS_TARGET+=" -Dvulkan-drivers=${VULKAN_DRIVERS_MESA// /,}"
else
  PKG_MESON_OPTS_TARGET+=" -Dvulkan-drivers="
fi

pre_configure_target() {
  # Create debug file to verify function is called
  echo "Mesa pre_configure_target called at $(date)" > /tmp/mesa_debug.log
  echo "TARGET_ARCH: ${TARGET_ARCH}" >> /tmp/mesa_debug.log
  echo "GRAPHIC_DRIVERS: ${GRAPHIC_DRIVERS}" >> /tmp/mesa_debug.log
  
  # For x86_64, copy system Clang libraries to sysroot for Mesa
  if [ "${TARGET_ARCH}" = "x86_64" ]; then
    echo "Setting up Clang libraries for Mesa x86_64 build" >> /tmp/mesa_debug.log
    
    # Set up the sysroot with system Clang libraries and headers
    mkdir -p ${SYSROOT_PREFIX}/usr/lib
    mkdir -p ${SYSROOT_PREFIX}/usr/include
    
    # Copy system Clang libraries to sysroot (using correct paths from container)
    cp -a /usr/lib/llvm-15/lib/libclangBasic.a ${SYSROOT_PREFIX}/usr/lib/ 2>> /tmp/mesa_debug.log || true
    cp -a /usr/lib/llvm-15/lib/libclang-cpp.so* ${SYSROOT_PREFIX}/usr/lib/ 2>> /tmp/mesa_debug.log || true
    cp -a /usr/lib/x86_64-linux-gnu/libclang-15.so* ${SYSROOT_PREFIX}/usr/lib/ 2>> /tmp/mesa_debug.log || true
    
    # Copy Clang headers to sysroot
    if [ -d /usr/lib/llvm-15/lib/clang ]; then
      cp -a /usr/lib/llvm-15/lib/clang ${SYSROOT_PREFIX}/usr/include/ 2>> /tmp/mesa_debug.log || true
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

    echo "Clang libraries setup completed for Mesa"
  fi
}

makeinstall_host() {
  host_files="src/compiler/clc/mesa_clc src/compiler/spirv/vtn_bindgen2 src/panfrost/clc/panfrost_compile"

  if listcontains "${BUILD_REUSABLE}" "(all|mesa:host)"; then
    # Build the reusable mesa:host for both local and to be added to a GitHub release
    strip ${host_files}
    upx --lzma ${host_files}

    REUSABLE_SOURCES="${SOURCES}/mesa-reusable"
    MESA_HOST="mesa-reusable-${OS_VERSION}-${PKG_VERSION}"
    REUSABLE_SOURCE_NAME=${MESA_HOST}-${MACHINE_HARDWARE_NAME}.tar

    mkdir -p "${TARGET_IMG}"

    tar cf ${TARGET_IMG}/${REUSABLE_SOURCE_NAME} --transform='s|.*/||' ${host_files}
    sha256sum ${TARGET_IMG}/${REUSABLE_SOURCE_NAME} | \
      cut -d" " -f1 >${TARGET_IMG}/${REUSABLE_SOURCE_NAME}.sha256

    if listcontains "${BUILD_REUSABLE}" "save-local"; then
      mkdir -p "${REUSABLE_SOURCES}"
      cp -p ${TARGET_IMG}/${REUSABLE_SOURCE_NAME} ${REUSABLE_SOURCES}
      cp -p ${TARGET_IMG}/${REUSABLE_SOURCE_NAME}.sha256 ${REUSABLE_SOURCES}
      echo "save-local" >${REUSABLE_SOURCES}/${REUSABLE_SOURCE_NAME}.url
    fi
  fi

  mkdir -p "${TOOLCHAIN}/bin"
    cp -a ${host_files} "${TOOLCHAIN}/bin"
}

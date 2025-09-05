# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2009-2016 Stephan Raue (stephan@openelec.tv)
# Copyright (C) 2018-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="mesa"
PKG_LICENSE="OSS"
PKG_SITE="http://www.mesa3d.org/"
PKG_DEPENDS_HOST="toolchain:host llvm:host libclc:host spirv-tools:host libdrm:host \
                  wayland-protocols:host libX11:host libXext:host \
                  libXfixes:host libxshmfence:host libXxf86vm:host xrandr:host glslang:host"
PKG_DEPENDS_TARGET="toolchain expat libdrm libclc Mako:host pyyaml:host"
PKG_LONGDESC="Mesa is a 3-D graphics library with an API."
PKG_TOOLCHAIN="meson"
PKG_PATCH_DIRS+=" ${DEVICE}"

post_unpack() {
  # Remove upper version limit for LLVMSPIRVLib to allow 19.x versions
  sed -i "s/'< @0@\.@1@'\.format(chosen_llvm_version_major, chosen_llvm_version_minor + 1),$/]/g" ${PKG_BUILD}/meson.build
}
PKG_VERSION="25.2.2"
PKG_URL="https://gitlab.freedesktop.org/mesa/mesa/-/archive/mesa-${PKG_VERSION}/mesa-mesa-${PKG_VERSION}.tar.gz"

if listcontains "${GRAPHIC_DRIVERS}" "panfrost"; then
  PKG_DEPENDS_TARGET+=" mesa:host"
fi

# For x86_64 with iris driver, we also need mesa:host for intel-clc tools
if listcontains "${GRAPHIC_DRIVERS}" "iris" && [ "${TARGET_ARCH}" = "x86_64" ]; then
  PKG_DEPENDS_TARGET+=" mesa:host"
fi

get_graphicdrivers

pre_configure_host() {
# Host gets built for panfrost and for x86_64 iris (intel-clc tools)
PKG_MESON_OPTS_HOST+=" ${MESA_LIBS_PATH_OPTS}  \
                       -Dgallium-drivers=${GALLIUM_DRIVERS// /,} \
                       -Dvulkan-drivers=${VULKAN_DRIVERS_MESA// /,}"
}

PKG_MESON_OPTS_TARGET=" ${MESA_LIBS_PATH_OPTS} \
                       -Dgallium-drivers=${GALLIUM_DRIVERS// /,} \
                       -Dgallium-extra-hud=false \
                       -Dshader-cache=enabled \
                       -Dshared-glapi=enabled \
                       -Dopengl=true \
                       -Dgbm=enabled \
                       -Degl=enabled \
                       -Dlibunwind=disabled \
                       -Dlmsensors=disabled \
                       -Dbuild-tests=false \
                       -Dgallium-rusticl=true"

if listcontains "${GRAPHIC_DRIVERS}" "panfrost"; then
  # These options require that we have built mesa host as specified above
  PKG_MESON_OPTS_TARGET+=" -Dmesa-clc=system \
                           -Dprecomp-compiler=system"
fi

# For x86_64 with iris driver, use system mesa-clc from mesa:host
if listcontains "${GRAPHIC_DRIVERS}" "iris" && [ "${TARGET_ARCH}" = "x86_64" ]; then
  PKG_MESON_OPTS_TARGET+=" -Dmesa-clc=system"
fi

if [ "${DISPLAYSERVER}" = "x11" ]; then
  PKG_DEPENDS_TARGET+=" xorgproto libXext libXdamage libXfixes libXxf86vm libxcb libX11 libxshmfence libXrandr libglvnd glfw"
  export X11_INCLUDES=
  PKG_MESON_OPTS_TARGET+="	-Dplatforms=x11 \
				-Dglx=dri \
				-Dglvnd=enabled"
elif [ "${DISPLAYSERVER}" = "wl" ]; then
  PKG_DEPENDS_TARGET+=" wayland wayland-protocols libglvnd glfw"
  PKG_MESON_OPTS_TARGET+=" 	-Dplatforms=wayland,x11 \
				-Dglx=dri \
				-Dglvnd=enabled"
  PKG_DEPENDS_TARGET+=" xorgproto libXext libXdamage libXfixes libXxf86vm libxcb libX11 libxshmfence libXrandr libglvnd"
  export X11_INCLUDES=
else
  PKG_MESON_OPTS_TARGET+="	-Dplatforms="" \
				-Dgallium-nine=false \
				-Dglx=disabled \
				-Dglvnd=disabled"
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
                           -Dvideo-codecs=vc1dec,h264dec,h264enc,h265dec,h265enc"
else
  PKG_MESON_OPTS_TARGET+=" -Dgallium-va=disabled"
fi

if [ "${OPENGLES_SUPPORT}" = "yes" ]; then
  PKG_MESON_OPTS_TARGET+=" -Dgles1=enabled -Dgles2=enabled"
else
  PKG_MESON_OPTS_TARGET+=" -Dgles1=disabled -Dgles2=disabled"
fi

if [ "${VULKAN_SUPPORT}" = "yes" ]; then
  PKG_DEPENDS_TARGET+=" ${VULKAN} vulkan-tools"
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
    
    echo "Completed Clang library setup for Mesa" >> /tmp/mesa_debug.log
    
  # For x86_64 pseudo-cross-compile, build mesa:host to provide required tools
  # This avoids SPIRV cross-compilation issues while keeping all functionality
  if [ "${TARGET_ARCH}" = "x86_64" ]; then
    echo "Adding mesa:host dependency for x86_64 pseudo-cross-compile" >> /tmp/mesa_debug.log
  fi
  fi
}

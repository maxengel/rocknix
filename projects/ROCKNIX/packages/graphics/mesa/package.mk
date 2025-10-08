# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2009-2016 Stephan Raue (stephan@openelec.tv)
# Copyright (C) 2018-present Team LibreELEC (https://libreelec.tv)

PKG_NAME="mesa"
PKG_LICENSE="OSS"
PKG_SITE="http://www.mesa3d.org/"
PKG_DEPENDS_HOST="toolchain:host llvm:host spirv-tools:host libdrm:host \
                  wayland-protocols:host libX11:host libXext:host \
                  libXfixes:host libxshmfence:host libXxf86vm:host xrandr:host glslang:host libclc:host"
PKG_DEPENDS_TARGET="toolchain expat libdrm Mako:host pyyaml:host"
PKG_LONGDESC="Mesa is a 3-D graphics library with an API."
PKG_TOOLCHAIN="meson"

PKG_PATCH_DIRS+=" ${DEVICE}"

post_unpack() {
  # Remove upper version limit for LLVMSPIRVLib to allow 19.x versions
  sed -i "s/'< @0@\.@1@'\.format(chosen_llvm_version_major, chosen_llvm_version_minor + 1) \]/]/g" ${PKG_BUILD}/meson.build
}
PKG_VERSION="25.2.2"
PKG_URL="https://gitlab.freedesktop.org/mesa/mesa/-/archive/mesa-${PKG_VERSION}/mesa-mesa-${PKG_VERSION}.tar.gz"

if listcontains "${GRAPHIC_DRIVERS}" "panfrost"; then
  PKG_DEPENDS_TARGET+=" mesa:host"
fi

# For GENERIC_X64, we need host tools as well
# Note: libclc:host is now included in PKG_DEPENDS_HOST for mesa-clc support

# For x86_64, disable OpenCL components to avoid cross-compilation issues
if [ "${TARGET_ARCH}" = "x86_64" ] && [ "${MACHINE_HARDWARE_NAME}" = "x86_64" ]; then
  MESA_X86_64_NATIVE="yes"
fi

get_graphicdrivers

pre_configure_target() {
  # For GENERIC_X64, set up proper paths for clang libraries and mesa tools
  if [ "${MESA_X86_64_NATIVE}" = "yes" ]; then
    # Create symlinks to clang libraries so meson can find them in the expected sysroot location
    SYSROOT_LIB="${SYSROOT_PREFIX}/usr/lib"
    SYSROOT_BIN="${SYSROOT_PREFIX}/usr/bin"
    mkdir -p "${SYSROOT_LIB}" "${SYSROOT_BIN}"

    # Symlink the clang libraries from host toolchain to sysroot
    for lib in ${TOOLCHAIN}/lib/libclang*.{a,so,so.*}; do
      if [ -f "$lib" ]; then
        ln -sf "$lib" "${SYSROOT_LIB}/$(basename $lib)"
      fi
    done

    # Symlink mesa tools from host build to make them available for target build
    MESA_HOST_BUILD="${PKG_BUILD}/.x86_64-linux-gnu"
    if [ -f "${MESA_HOST_BUILD}/src/compiler/clc/mesa_clc" ]; then
      ln -sf "${MESA_HOST_BUILD}/src/compiler/clc/mesa_clc" "${SYSROOT_BIN}/mesa_clc"
      chmod +x "${SYSROOT_BIN}/mesa_clc"
    fi
    if [ -f "${MESA_HOST_BUILD}/src/compiler/spirv/vtn_bindgen2" ]; then
      ln -sf "${MESA_HOST_BUILD}/src/compiler/spirv/vtn_bindgen2" "${SYSROOT_BIN}/vtn_bindgen2"
      chmod +x "${SYSROOT_BIN}/vtn_bindgen2"
    fi

    # For pseudo-cross-compilation, replace target python3 with working toolchain python3
    # since target python3 can't execute due to library dependencies
    if [ -f "${TOOLCHAIN}/bin/python3" ]; then
      ln -sf "${TOOLCHAIN}/bin/python3" "${SYSROOT_BIN}/python3"
    fi

    # Ensure the sysroot bin is in PATH for tool discovery
    export PATH="${SYSROOT_BIN}:${PATH}"
  fi
}

pre_configure_host() {
# Host gets built for panfrost and for x86_64 iris (intel-clc tools)
PKG_MESON_OPTS_HOST+=" ${MESA_LIBS_PATH_OPTS}  \
                       -Dgallium-drivers=${GALLIUM_DRIVERS// /,} \
                       -Dvulkan-drivers=${VULKAN_DRIVERS_MESA// /,} \
                       -Dmesa-clc=auto \
                       -Dgallium-rusticl=false \
                       -Dmicrosoft-clc=disabled \
                       -Dprecomp-compiler=system"
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
                       -Dbuild-tests=false"


if listcontains "${GRAPHIC_DRIVERS}" "panfrost" && [ "${TARGET_ARCH}" != "x86_64" ]; then
  # These options require that we have built mesa host as specified above
  PKG_DEPENDS_TARGET+=" libclc"
  PKG_MESON_OPTS_TARGET+=" -Dmesa-clc=system \
                           -Dprecomp-compiler=system"
elif [ "${MESA_X86_64_NATIVE}" = "yes" ]; then
  # For x86_64 pseudo-cross-compilation, enable full driver support
  # Need to build mesa:host first to provide required tools
  PKG_DEPENDS_TARGET+=" libclc mesa:host"
  PKG_MESON_OPTS_TARGET+=" -Dgallium-rusticl=false \
                           -Dmesa-clc=system \
                           -Dprecomp-compiler=system"
else
  # For non-panfrost builds, disable rusticl and other OpenCL components
  PKG_DEPENDS_TARGET+=" libclc"
  PKG_MESON_OPTS_TARGET+=" -Dgallium-rusticl=false"
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




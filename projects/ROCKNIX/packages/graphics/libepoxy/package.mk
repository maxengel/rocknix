# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2009-2016 Stephan Raue (stephan@openelec.tv)
# Copyright (C) 2018 Team LibreELEC (https://libreelec.tv)
# Copyright (C) 2018-present Team CoreELEC (https://coreelec.org)

# libepoxy (actually) needs to be built shared, to avoid
# (EE) Failed to load /usr/lib/xorg/modules/libglamoregl.so:
# /usr/lib/xorg/modules/libglamoregl.so: undefined symbol: epoxy_eglCreateImageKHR
# in Xorg.log

PKG_NAME="libepoxy"
PKG_VERSION="1.5.10"
PKG_LICENSE="GPL"
PKG_SITE="https://github.com/anholt/libepoxy"
PKG_URL="${PKG_SITE}/archive/refs/tags/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="Epoxy is a library for handling OpenGL function pointer management for you."

if [ "${OPENGL}" != "no" ]; then
  PKG_DEPENDS_TARGET+=" ${OPENGL}"
fi

if [ "${OPENGLES}" != "no" ]; then
  PKG_DEPENDS_TARGET+=" ${OPENGLES}"
fi

# Enable GLX for x86_64 desktop builds
if [ "${TARGET_ARCH}" = "x86_64" ] && [ "${DEVICE}" = "GENERIC_X64" ]; then
  PKG_MESON_OPTS_TARGET="-Dglx=yes"
elif [ "${DISPLAYSERVER}" != "x11" ] && \
     [ "${DISPLAYSERVER}" != "wl" ]; then
  PKG_MESON_OPTS_TARGET="-Dglx=no"
fi

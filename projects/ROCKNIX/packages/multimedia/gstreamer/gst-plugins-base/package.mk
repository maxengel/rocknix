# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2024-present ROCKNIX (https://github.com/ROCKNIX)

. ${ROOT}/packages/multimedia/gstreamer/gst-plugins-base/package.mk

pre_configure_target() {
  PKG_MESON_OPTS_TARGET="-Dgl=enabled \
                         -Dadder=disabled \
                         -Dapp=disabled \
                         -Daudioconvert=disabled \
                         -Daudiomixer=disabled \
                         -Daudiorate=disabled \
                         -Daudioresample=disabled \
                         -Daudiotestsrc=disabled \
                         -Dcompositor=disabled \
                         -Dencoding=disabled \
                         -Dgio=disabled \
                         -Dgio-typefinder=disabled \
                         -Doverlaycomposition=disabled \
                         -Dpbtypes=disabled \
                         -Dplayback=disabled \
                         -Drawparse=enabled \
                         -Dsubparse=enabled \
                         -Dtcp=disabled \
                         -Dtypefind=disabled \
                         -Dvideoconvertscale=disabled \
                         -Dvideorate=disabled \
                         -Dvideotestsrc=disabled \
                         -Dvolume=disabled \
                         -Dalsa=disabled \
                         -Dcdparanoia=disabled \
                         -Dlibvisual=disabled \
                         -Dogg=disabled \
                         -Dopus=disabled \
                         -Dpango=disabled \
                         -Dtheora=disabled \
                         -Dtremor=disabled \
                         -Dvorbis=disabled \
                         -Dx11=disabled \
                         -Dxshm=disabled \
                         -Dxi=disabled \
                         -Dxvideo=disabled \
                         -Dexamples=disabled \
                         -Dtests=disabled \
                         -Dtools=disabled \
                         -Dintrospection=disabled \
                         -Dnls=disabled \
                         -Dorc=disabled \
                         -Dglib_debug=disabled \
                         -Dglib_assert=false \
                         -Dglib_checks=false \
                         -Dpackage-name=gst-plugins-base \
                         -Dpackage-origin=LibreELEC.tv \
                         -Ddoc=disabled"
}

pre_make_target() {
  # Fix an upstream graphene bug: graphene-config.h(.meson) has a stray '#' in
  # "#    #define GRAPHENE_USE_AVX", an invalid directive that only compiles when
  # __AVX__ is defined (x86_64 / x86-64-v3). gst-plugins-base builds graphene as a
  # bundled subproject, so correct the header the generator emits.
  find ${PKG_BUILD} \( -name 'graphene-config.h' -o -name 'graphene-config.h.meson' \) \
    -exec sed -i 's/#\([[:space:]]*\)#define GRAPHENE_USE_AVX/#\1define GRAPHENE_USE_AVX/' {} +
}

post_makeinstall_target() {
  # clean up
  safe_remove ${SYSROOT_PREFIX}/usr/include/GL
  safe_remove ${INSTALL}/usr/include
  safe_remove ${INSTALL}/usr/lib/pkgconfig
  safe_remove ${INSTALL}/usr/share
}

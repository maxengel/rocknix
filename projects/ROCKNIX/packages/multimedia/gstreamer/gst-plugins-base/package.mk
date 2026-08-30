# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

. ${ROOT}/packages/multimedia/gstreamer/gst-plugins-base/package.mk

# Upstream throws the whole install away -- this package exists there only to
# populate the sysroot so other things can link. That works right up until
# something links it and then has to *run*: WebKit pulls in libgstapp, audio,
# video, tag, pbutils, allocators and fft, and without them
# cloud-signin-window dies at load with "cannot open shared object file".
#
# So keep the shared libraries and nothing else. The plugins, headers,
# pkg-config files and tools stay build-time only, as before.
# WebKit builds its media pipeline out of appsrc/appsink, and upstream
# disables that plugin because nothing else in the image wanted it. Without
# it WebKit asks the registry for "appsink", gets NULL, and segfaults
# dereferencing it -- taking the whole web process down a second after every
# page load, which presents as keystrokes not reaching the page rather than
# as anything to do with media.
#
# Restated in full rather than patched: the generic recipe builds this string
# from scratch inside pre_configure_target, so a substitution at global scope
# is overwritten before configure sees it, and there is no configure hook to
# chain onto. Only -Dapp differs from upstream; keep the rest in step when
# rebasing.
pre_configure_target() {
  PKG_MESON_OPTS_TARGET="-Dgl=disabled \
                         -Dadder=disabled \
                         -Dapp=enabled \
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

post_makeinstall_target() {
  local keep="${PKG_BUILD}/.rocknix-keep"
  rm -rf "${keep}" && mkdir -p "${keep}/lib" "${keep}/plugins"
  cp -a ${INSTALL}/usr/lib/libgst*.so* "${keep}/lib"/ 2>/dev/null || true
  # The plugins as well as the libraries. Shipping only the libraries looks
  # like it works -- everything links, WebKit starts -- and then WebKit asks
  # the registry for the "appsink" element, gets NULL because the plugin that
  # provides it was never installed, and segfaults calling g_object_set on
  # it. The whole web process dies a second after every page load, which
  # presents as keystrokes not arriving rather than as anything to do with
  # media.
  cp -a ${INSTALL}/usr/lib/gstreamer-1.0/*.so "${keep}/plugins"/ 2>/dev/null || true
  safe_remove ${INSTALL}
  mkdir -p ${INSTALL}/usr/lib/gstreamer-1.0
  cp -a "${keep}/lib"/. ${INSTALL}/usr/lib/ 2>/dev/null || true
  cp -a "${keep}/plugins"/. ${INSTALL}/usr/lib/gstreamer-1.0/ 2>/dev/null || true
  rm -rf "${keep}"
}

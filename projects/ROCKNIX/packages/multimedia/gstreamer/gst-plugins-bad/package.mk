# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

. ${ROOT}/packages/multimedia/gstreamer/gst-plugins-bad/package.mk

# Upstream builds this for nothing in our images and throws every library
# away. webkitgtk 2.54 links gstreamer-mpegts -- the library, not the
# demuxer plugin -- as a hard requirement of the video it cannot build
# without (fork #228, D-WORKFLOW-038), so this override turns the mpegts
# pieces on and keeps their library, and nothing else changes: the option
# string is upstream's with the two mpegts lines flipped, read out of the
# generic recipe because it builds the string inside pre_configure_target
# and there is no hook to chain onto.
pre_configure_target() {
  PKG_MESON_OPTS_TARGET="$(sed -n '/PKG_MESON_OPTS_TARGET="/,/"$/p' ${ROOT}/packages/multimedia/gstreamer/gst-plugins-bad/package.mk \
    | sed -e 's/^ *PKG_MESON_OPTS_TARGET="//' -e 's/"$//' -e 's/\\$//' \
    | sed -e 's/-Dmpegtsdemux=disabled/-Dmpegtsdemux=enabled/' -e 's/-Dmpegtsmux=disabled/-Dmpegtsmux=enabled/' \
    | tr '\n' ' ')"
}

post_makeinstall_target() {
  local keep="${PKG_BUILD}/.rocknix-keep"
  rm -rf "${keep}" && mkdir -p "${keep}/lib"
  cp -a ${INSTALL}/usr/lib/libgstmpegts-1.0.so* "${keep}/lib"/ 2>/dev/null || true
  safe_remove ${INSTALL}
  mkdir -p ${INSTALL}/usr/lib
  cp -a "${keep}/lib"/. ${INSTALL}/usr/lib/ 2>/dev/null || true
  rm -rf "${keep}"
}

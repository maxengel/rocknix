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
post_makeinstall_target() {
  local keep="${PKG_BUILD}/.rocknix-keep"
  rm -rf "${keep}" && mkdir -p "${keep}"
  cp -a ${INSTALL}/usr/lib/libgst*.so* "${keep}"/ 2>/dev/null || true
  safe_remove ${INSTALL}
  mkdir -p ${INSTALL}/usr/lib
  cp -a "${keep}"/. ${INSTALL}/usr/lib/ 2>/dev/null || true
  rm -rf "${keep}"
}

# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

. ${ROOT}/packages/addons/addon-depends/externalhelper-depends/neatvnc/package.mk

# noVNC talks WebSocket, not raw RFB, and neatvnc only compiles its WebSocket
# transport when nettle/hogweed/gmp are present -- the upstream recipe turns
# nettle off because the addon it was written for had no browser client. All
# three libraries already ship in the image, so this costs nothing and saves
# carrying websockify and a Python bridge alongside.
PKG_DEPENDS_TARGET+=" nettle gmp"
PKG_MESON_OPTS_TARGET="${PKG_MESON_OPTS_TARGET/-Dnettle=disabled/-Dnettle=enabled}"

# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="raofflineproxy-libchdr"
# The commit RAOfflineProxy pins as its third_party/libchdr submodule at the
# proxy's own pinned commit (64d03d30, fork #165), read the same way as
# raofflineproxy-rcheevos. The proxy's tarball carries the submodule as an
# empty directory; these sources (libchdr and the miniz, lzma and zstd
# decoders it vendors under deps/) are compiled by raofflineproxy's recipe
# into libraproxy_rchash.so so a CHD disc image hashes the way RetroArch
# hashes it (fork #179). Source only: nothing here is built or installed on
# its own.
PKG_VERSION="970a0ce060c0aa1012b1eebba1433c9a9e8ac8b9"
PKG_SHA256="6b7a04ae29ad497dcae4a0f918b289df7df95eea6dd2deed8c420b2ee2c481cd"
PKG_LICENSE="BSD-3-Clause"
PKG_SITE="https://github.com/rtissera/libchdr"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="libchdr, at the commit RAOfflineProxy pins: the CHD reader the proxy's ROM scan hashes disc images through."
PKG_TOOLCHAIN="manual"

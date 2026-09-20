# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="raofflineproxy-rcheevos"
# The commit RAOfflineProxy pins as its third_party/rcheevos submodule at the
# proxy's own pinned commit (64d03d30, fork #165): read from the repository's
# tree with `gh api repos/misantronic/RAOfflineProxy/contents/third_party`.
# GitHub's tarball of the proxy carries the submodule as an empty directory,
# so the sources that rc_hash is built from come in through this package and
# are compiled by raofflineproxy's own recipe into libraproxy_rchash.so, the
# library the client's ROM hashing loads (fork #179). Source only: nothing
# here is built or installed on its own.
# freshness: pinned -- follows the third_party/rcheevos submodule commit RAOfflineProxy names (fork #179)
PKG_VERSION="2ad0b8672f68a48148620164510b963039e49eb1"
PKG_SHA256="b8e3e834d15c327085154315c49dea85b081ad48592ba1740f323ac953e1bfec"
PKG_LICENSE="MIT"
PKG_SITE="https://github.com/RetroAchievements/rcheevos"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="rcheevos, at the commit RAOfflineProxy pins: the RetroAchievements hashing (rc_hash) that the proxy's ROM scan is built from."
PKG_TOOLCHAIN="manual"

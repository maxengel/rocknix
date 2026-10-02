# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="libsoup"
PKG_VERSION="3.8.0"
PKG_SHA256="bbf08fa3e03a88c31a3d27a0d87cb422e9490f2d08e149211103df6d638a2238"
PKG_LICENSE="LGPL-2.1-or-later"
PKG_SITE="https://libsoup.gnome.org/"
PKG_URL="https://download.gnome.org/sources/${PKG_NAME}/${PKG_VERSION:0:3}/${PKG_NAME}-${PKG_VERSION}.tar.xz"
PKG_DEPENDS_TARGET="toolchain glib libpsl libxml2 nghttp2 sqlite"
PKG_LONGDESC="HTTP client/server library for GNOME; WebKit's network backend."

pre_configure_target() {
  # No introspection, docs or tests in an image build; brotli, ntlm and
  # sysprof are all optional and unused by the WebKit network process.
  # Keep 3.8's new optional zstd decoder explicit, independent of which
  # other packages happen to have populated the shared sysroot (#362).
  PKG_MESON_OPTS_TARGET="-Dintrospection=disabled \
                         -Dvapi=disabled \
                         -Ddocs=disabled \
                         -Dtests=false \
                         -Dsysprof=disabled \
                         -Dntlm=disabled \
                         -Dbrotli=disabled \
                         -Dzstd=disabled \
                         -Dgssapi=disabled \
                         -Dtls_check=false"
}

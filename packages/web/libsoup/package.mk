# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="libsoup"
PKG_VERSION="3.6.5"
PKG_SHA256="6891765aac3e949017945c3eaebd8cc8216df772456dc9f460976fbdb7ada234"
PKG_LICENSE="LGPL-2.1-or-later"
PKG_SITE="https://libsoup.gnome.org/"
PKG_URL="https://download.gnome.org/sources/${PKG_NAME}/${PKG_VERSION:0:3}/${PKG_NAME}-${PKG_VERSION}.tar.xz"
PKG_DEPENDS_TARGET="toolchain glib libpsl libxml2 nghttp2 sqlite"
PKG_LONGDESC="HTTP client/server library for GNOME; WebKit's network backend."

pre_configure_target() {
  # No introspection, docs or tests in an image build; brotli, ntlm and
  # sysprof are all optional and unused by the WebKit network process.
  PKG_MESON_OPTS_TARGET="-Dintrospection=disabled \
                         -Dvapi=disabled \
                         -Ddocs=disabled \
                         -Dtests=false \
                         -Dsysprof=disabled \
                         -Dntlm=disabled \
                         -Dbrotli=disabled \
                         -Dgssapi=disabled \
                         -Dtls_check=false"
}

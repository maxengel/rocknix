# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="ruby"
PKG_VERSION="3.3.6"
PKG_SHA256="540975969d1af42190d26ff629bc93b1c3f4bffff4ab253e245e125085e66266"
PKG_LICENSE="BSD-2-Clause"
PKG_SITE="https://www.ruby-lang.org/"
PKG_URL="https://cache.ruby-lang.org/pub/ruby/${PKG_VERSION:0:3}/${PKG_NAME}-${PKG_VERSION}.tar.xz"
PKG_DEPENDS_HOST="toolchain zlib:host libyaml:host"
PKG_LONGDESC="Ruby interpreter. Host-only: JavaScriptCore's bytecode generator is written in Ruby, so WebKit cannot be built without it."
PKG_TOOLCHAIN="autotools"

# Only the interpreter is wanted -- no docs, no extensions we will never load,
# and nothing installed onto the device: this never leaves the build host.
PKG_CONFIGURE_OPTS_HOST="--disable-install-doc \
                         --disable-install-rdoc \
                         --disable-install-capi \
                         --without-gmp \
                         --with-out-ext=openssl,readline,curses,dbm,gdbm,fiddle,pty,syslog \
                         --disable-jit-support"

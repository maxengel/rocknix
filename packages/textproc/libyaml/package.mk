# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="libyaml"
PKG_VERSION="0.2.5"
PKG_SHA256="c642ae9b75fee120b2d96c712538bd2cf283228d2337df2cf2988e3c02678ef4"
PKG_LICENSE="MIT"
PKG_SITE="https://github.com/yaml/libyaml"
PKG_URL="https://github.com/yaml/libyaml/releases/download/${PKG_VERSION}/yaml-${PKG_VERSION}.tar.gz"
PKG_SOURCE_NAME="yaml-${PKG_VERSION}.tar.gz"
PKG_DEPENDS_HOST="toolchain"
PKG_LONGDESC="YAML parser. Host-only: Ruby 3.2 unbundled libyaml, so without it psych does not build and WebKit's GenerateSettings.rb cannot require 'yaml'."
PKG_TOOLCHAIN="autotools"

PKG_CONFIGURE_OPTS_HOST="--disable-static --enable-shared"

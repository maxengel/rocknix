# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="webkitgtk"
PKG_VERSION="2.52.6"
PKG_SHA256="179a2ea3f8f6edd4be7f31fdc55afc57bd0729f1fba648c61d4181539ac116fc"
PKG_LICENSE="LGPL-2.1-or-later AND BSD-2-Clause"
PKG_SITE="https://webkitgtk.org/"
PKG_URL="https://webkitgtk.org/releases/${PKG_NAME}-${PKG_VERSION}.tar.xz"
PKG_DEPENDS_TARGET="toolchain ruby:host unifdef:host \
                    glib gtk3 cairo harfbuzz harfbuzz-icu icu libsoup libxml2 libxslt sqlite \
                    libjpeg-turbo libpng libwebp openjpeg woff2 brotli \
                    libgcrypt libtasn1 zlib freetype fontconfig \
                    libepoxy wayland wayland-protocols libdrm mesa \
                    at-spi2-atk gstreamer gst-plugins-base"
PKG_LONGDESC="WebKit rendering engine, GTK port. Present for one job: showing a cloud provider's sign-in page on the device, so the OAuth redirect to localhost lands where rclone is listening instead of on somebody's phone."
PKG_TOOLCHAIN="cmake"

pre_configure_target() {
  # A sign-in window, not a web browser. Everything switched off below is
  # either a dependency we do not ship (spellcheck/enchant, the bubblewrap
  # sandbox and its dbus proxy) or surface we have no use for on a handheld
  # that opens exactly one page. Introspection and docs are build-host
  # artifacts that never reach the image.
  PKG_CMAKE_OPTS_TARGET="-DPORT=GTK \
                         -DUSE_GTK4=OFF \
                         -DUSE_SOUP2=OFF \
                         -DENABLE_WAYLAND_TARGET=ON \
                         -DENABLE_X11_TARGET=OFF \
                         -DENABLE_MINIBROWSER=ON \
                         -DENABLE_INTROSPECTION=OFF \
                         -DENABLE_DOCUMENTATION=OFF \
                         -DENABLE_SPELLCHECK=OFF \
                         -DENABLE_SPEECH_SYNTHESIS=OFF \
                         -DUSE_FLITE=OFF \
                         -DENABLE_ENCRYPTED_MEDIA=OFF \
                         -DENABLE_THUNDER=OFF \
                         -DENABLE_BUBBLEWRAP_SANDBOX=OFF \
                         -DENABLE_JOURNALD_LOG=OFF \
                         -DENABLE_GAMEPAD=OFF \
                         -DENABLE_VIDEO=OFF \
                         -DENABLE_WEB_AUDIO=OFF \
                         -DENABLE_MEDIA_SOURCE=OFF \
                         -DENABLE_MEDIA_STREAM=OFF \
                         -DENABLE_MEDIA_RECORDER=OFF \
                         -DUSE_GSTREAMER_GL=OFF \
                         -DUSE_GSTREAMER_WEBRTC=OFF \
                         -DENABLE_WEB_RTC=OFF \
                         -DENABLE_WEBGL=OFF \
                         -DUSE_LIBSECRET=OFF \
                         -DUSE_LIBBACKTRACE=OFF \
                         -DUSE_AVIF=OFF \
                         -DUSE_JPEGXL=OFF \
                         -DUSE_LCMS=OFF \
                         -DUSE_LIBHYPHEN=OFF \
                         -DENABLE_SAMPLING_PROFILER=OFF \
                         -DCMAKE_BUILD_TYPE=Release"
}

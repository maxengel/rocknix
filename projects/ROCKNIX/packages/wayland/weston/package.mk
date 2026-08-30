# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

. ${ROOT}/packages/wayland/weston/package.mk

# Weston is here for one thing: hosting the sign-in window so a cloud
# provider's OAuth redirect to localhost lands on this device rather than on
# somebody's phone, where nothing is listening.
#
# The VNC backend rather than DRM, deliberately. It never touches the display,
# so EmulationStation keeps running and keeps its hold on KMS -- the player
# looks at the handheld for the address and does the typing on their phone.
PKG_DEPENDS_TARGET+=" neatvnc aml"

PKG_MESON_OPTS_TARGET="${PKG_MESON_OPTS_TARGET/-Dbackend-vnc=false/-Dbackend-vnc=true}"
PKG_MESON_OPTS_TARGET="${PKG_MESON_OPTS_TARGET/-Dshell-kiosk=false/-Dshell-kiosk=true}"

# The generic recipe enables weston.service, which would run a compositor from
# boot on a device whose whole UI is EmulationStation on bare KMS. Nothing
# here starts until somebody opens cloud setup; cloud_oauth launches it and
# tears it down, which is what keeps the idle cost of all this at zero.
post_install() {
  :
}

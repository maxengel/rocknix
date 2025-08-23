# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2023 JELOS (https://github.com/JustEnoughLinuxOS)

PKG_NAME="gamesupport"
PKG_LICENSE="GPLv2"
PKG_SITE="https://rocknix.org"
PKG_SECTION="virtual"
PKG_LONGDESC="Game support software metapackage."

<<<<<<< HEAD
PKG_GAMESUPPORT="sixaxis rocknix-hotkey jstest-sdl gamecontrollerdb sdljoytest sdltouchtest control-gen mangohud"

# rocknix-touchscreen-keyboard requires sway
[[ "${WINDOWMANAGER}" = "swaywm-env" ]] && PKG_GAMESUPPORT+=" rocknix-touchscreen-keyboard"
=======
PKG_GAMESUPPORT="sixaxis rocknix-hotkey jstest-sdl gamecontrollerdb sdljoytest sdltouchtest control-gen"

# Add touchscreen keyboard for devices that need it, exclude for desktop/x64
case "${DEVICE}" in
  GENERIC_X64)
    # Desktop/laptop systems typically use physical keyboards
    ;;
  *)
    PKG_GAMESUPPORT="${PKG_GAMESUPPORT} rocknix-touchscreen-keyboard"
    ;;
esac
>>>>>>> 6f841f7b19 (Add initial configuration options for GENERIC_X64 device)

PKG_DEPENDS_TARGET="${PKG_GAMESUPPORT}"


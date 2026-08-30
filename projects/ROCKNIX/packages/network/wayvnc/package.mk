# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

. ${ROOT}/packages/addons/addon-depends/externalhelper-depends/wayvnc/package.mk

# The upstream recipe carries PKG_BUILD_FLAGS="-sysroot" because it was built
# for an addon rather than for the image. This one ships: cloud_oauth starts it
# against a headless sway so a provider's sign-in page can be driven from a
# phone, and stops it when the sign-in ends.
unset PKG_BUILD_FLAGS

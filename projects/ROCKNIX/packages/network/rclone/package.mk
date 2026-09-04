# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2021-present Xargon (https://github.com/XargonWan)
# Copyright (C) 2023 JELOS (https://github.com/JustEnoughLinuxOS)
# Copyright (C) 2025 ROCKNIX Team (https://github.com/ROCKNIX)

PKG_NAME="rclone"
PKG_VERSION="1.75.0"
# Python3 is the interpreter for cloud_remote. A shipped script's tools are
# real dependencies even though nothing links against them: upstream deleted
# packages/compress/zip in a3d0ad0430, nothing referenced it, and backuptool
# lost its archiver silently for months.
# webkitgtk is here because cloud_oauth needs a browser on the device: a
# provider's OAuth redirect goes to localhost, so it only lands somewhere
# useful if the browser is on the same machine as rclone's authorize listener.
# glib-networking is what gives that browser TLS at all.
PKG_DEPENDS_TARGET="toolchain fuse rsync qrencode Python3 \
                    webkitgtk cloud-signin-window glib-networking"
PKG_LONGDESC="rsync for cloud storage"
PKG_TOOLCHAIN="manual"

# Pinned per arch, and pinned to OUR version.
#
# Upstream added PKG_SHA256 for 1.71.0 in e0a68c95bd while this fork is on
# 1.75.0, so a rebase would bring in a hash that cannot match what we download.
# Setting the right ones here makes that merge a no-op instead of a build
# failure whose message names a checksum and not the version behind it.
#
# Verified two ways: against downloads.rclone.org/v1.75.0/SHA256SUMS and by
# hashing the artifact independently. (The binary inside does not match the one
# on a device -- the build strips it, 78315682 -> 78256016 bytes.)
case ${ARCH} in
    aarch64)
      RCLONE_ARCH="arm64"
      PKG_SHA256="d0ad88ba4c8e285b7c9efa591e0ab643280a91741e13c27f3a9c0957ccfa5203"
    ;;
    *)
      RCLONE_ARCH="amd64"
      PKG_SHA256="aa2804e08f48250e71009c727124b6341cd0288465804a9a09d14663cabafbaa"
    ;;
esac

PKG_URL="https://downloads.rclone.org/v${PKG_VERSION}/rclone-v${PKG_VERSION}-linux-${RCLONE_ARCH}.zip"
PKG_RCLONE="rclone-v${PKG_VERSION}-linux-${RCLONE_ARCH}/rclone"

unpack() {
  # Create build directory
  mkdir -p ${PKG_BUILD}
  # Rename the downloaded zip to include architecture for better tracking
  mv ${SOURCES}/rclone/rclone-${PKG_VERSION}.zip ${SOURCES}/rclone/rclone-${PKG_VERSION}-${RCLONE_ARCH}.zip
  # Extract the binary package to the build directory
  unzip ${SOURCES}/rclone/rclone-${PKG_VERSION}-${RCLONE_ARCH}.zip -d ${PKG_BUILD}/
  # Remove downloaded zip files to conserve space
  rm -f ${SOURCES}/rclone/rclone-${PKG_VERSION}*
}

makeinstall_target() {
  mkdir -p ${INSTALL}/usr/bin/
  mkdir -p ${INSTALL}/usr/config/
  cp cloud_backup ${INSTALL}/usr/bin/
  cp cloud_restore ${INSTALL}/usr/bin/
  cp cloud_sync_helper ${INSTALL}/usr/bin/
  cp cloud_setup ${INSTALL}/usr/bin/
  cp cloud_remote ${INSTALL}/usr/bin/
  cp cloud_device_id ${INSTALL}/usr/bin/
  cp cloud_migrate_layout ${INSTALL}/usr/bin/
  cp cloud_oauth ${INSTALL}/usr/bin/
  cp cloud_content_restore ${INSTALL}/usr/bin/
  cp cloud_content_backup ${INSTALL}/usr/bin/
  cp cloud_sync_cleanup_duplicates.sh ${INSTALL}/usr/bin/
  # No game-end event hook. EmulationStation runs the save sync itself now
  # (FileData::launchGame), so it can show the result on the progress card
  # instead of backgrounding the work into /dev/null where nobody could tell
  # whether it had happened. The hook had no caller but ES, and leaving it
  # installed would start a second concurrent cloud_backup on the same remote.
  cp ${PKG_BUILD}/${PKG_RCLONE} ${INSTALL}/usr/bin/
  chmod 0755 ${INSTALL}/usr/bin/*
  cp cloud_sync-rules.txt ${INSTALL}/usr/config/
  cp cloud_sync.conf ${INSTALL}/usr/config/
  cp cloud_sync.conf.defaults ${INSTALL}/usr/config/
  cp cloud_sync-rules.txt.defaults ${INSTALL}/usr/config/
  chmod 755 ${INSTALL}/usr/bin/rclone
  # No TOOLS entries for cloud backup and restore.
  #
  # These symlinked the scripts into the tools list, so running one dropped
  # the player into a fullscreen console. That was the parity stopgap while
  # cloud sync had no native surface; EmulationStation now has the whole flow
  # -- direction, the three data classes, progress and the last result -- so
  # the console route is a second, worse way to do the same thing, and two
  # paths to one operation is how somebody ends up with a backup missing what
  # they assumed was in it.
}

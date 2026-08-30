# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2021-present Xargon (https://github.com/XargonWan)
# Copyright (C) 2023 JELOS (https://github.com/JustEnoughLinuxOS)
# Copyright (C) 2025 ROCKNIX Team (https://github.com/ROCKNIX)

PKG_NAME="rclone"
PKG_VERSION="1.74.4"
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

case ${ARCH} in
    aarch64)
      RCLONE_ARCH="arm64"
    ;;
    *)
      RCLONE_ARCH="amd64"
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
  cp cloud_oauth ${INSTALL}/usr/bin/
  cp cloud_content_restore ${INSTALL}/usr/bin/
  cp cloud_content_backup ${INSTALL}/usr/bin/
  cp cloud_sync_cleanup_duplicates.sh ${INSTALL}/usr/bin/
  mkdir -p ${INSTALL}/usr/bin/scripts/game-end
  cp cloud_saves_gameend.sh ${INSTALL}/usr/bin/scripts/game-end/
  chmod 0755 ${INSTALL}/usr/bin/scripts/game-end/cloud_saves_gameend.sh
  cp ${PKG_BUILD}/${PKG_RCLONE} ${INSTALL}/usr/bin/
  chmod 0755 ${INSTALL}/usr/bin/*
  cp cloud_sync-rules.txt ${INSTALL}/usr/config/
  cp cloud_sync.conf ${INSTALL}/usr/config/
  cp cloud_sync.conf.defaults ${INSTALL}/usr/config/
  cp cloud_sync-rules.txt.defaults ${INSTALL}/usr/config/
  chmod 755 ${INSTALL}/usr/bin/rclone
  mkdir -p ${INSTALL}/usr/config/modules
  ln -sf /usr/bin/cloud_backup ${INSTALL}/usr/config/modules/cloud_backup.sh
  ln -sf /usr/bin/cloud_restore ${INSTALL}/usr/config/modules/cloud_restore.sh
}

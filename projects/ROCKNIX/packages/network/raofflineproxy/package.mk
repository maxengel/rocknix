# SPDX-License-Identifier: GPL-2.0-or-later
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

PKG_NAME="raofflineproxy"
# Pinned by full commit (packages/README.md): main at 2026-09-23 (fork #259).
# Since the previous pin (4e9bab48, 2026-09-20) the Linux side refreshes only
# the games played in the last seven days (59b167c), keeps every cached
# game's rows until the game is deleted rather than evicting them after sixty
# days (59b167c, e25b276), caches gameid lookups, and moves the rcheevos
# submodule to 1433173 (095867d; raofflineproxy-rcheevos follows it). libchdr
# is unchanged at 8e7b8bd. Patch 005 kept its exception boundary and dropped
# its bound on the pass; 006 retired, upstream now does more than it did
# (D-RA-029). APP_VERSION still reads 1.13.0-alpha1.
PKG_VERSION="0711f0b9b61e8cd75011200c518792605332f7b0"
PKG_SHA256="56a6f1e9d4dbf5bebc55c2907a143a1a0f1cd434a3e2c28dd1015afc00f128c4"
# GPLv3 text with no "or any later version" grant in the sources.
PKG_LICENSE="GPL-3.0-only"
PKG_SITE="https://github.com/misantronic/RAOfflineProxy"
PKG_URL="${PKG_SITE}/archive/${PKG_VERSION}.tar.gz"
# Python3 is the interpreter, and its host build carries the compileall that
# python_compile runs; the service itself is stdlib-only (argparse, sqlite3,
# ssl, hmac, http, socketserver, ...), all of it in the image's lib-dynload.
# raofflineproxy-rcheevos and raofflineproxy-libchdr are the two submodules
# the proxy's tarball leaves empty, pinned to the commits it names; make_target
# below compiles them with the glue into libraproxy_rchash.so (fork #179).
PKG_DEPENDS_TARGET="toolchain Python3 raofflineproxy-rcheevos raofflineproxy-libchdr"
PKG_LONGDESC="RAOfflineProxy: a loopback proxy between the emulators and retroachievements.org that caches game data and queues casual awards earned without a connection, and sends them when one returns. Approved by RetroAchievements.org; casual (softcore) achievements only."
PKG_TOOLCHAIN="manual"
PKG_BUILD_FLAGS="+pic"

# OFFLINE RETROACHIEVEMENTS (fork #163/#165, D-RA-001, D-RA-002).
#
# What ships is the service and nothing around it: linux/raofflineproxy as a
# Python module in the image's site-packages, byte-compiled like the stdlib
# (the image carries .pyc only and the root filesystem is read-only, so
# uncompiled sources would recompile at every start), a systemd unit gated on
# the same kind of marker avahi and sshd use, and raofflineproxy-ctl, the
# fork's launcher that EmulationStation's toggle drives. Not shipped: the
# self-extracting bundle, the pygame menu and its SDL driver matrix, the
# Tools entry, the boot hook, and the upstream config patchers -- on ROCKNIX
# setsettings.sh rebuilds RetroArch's cheevos keys from system.cfg at every
# launch, so the OS owns the launch-time config and points the emulators at
# the proxy itself (setsettings.sh set_cheevos, cheevos_ppsspp.sh).
#
# SCAN GAMES FOR OFFLINE ACHIEVEMENTS (fork #179, D-RA-010) adds the one
# native piece the client needs and the tarball does not carry built (and,
# since fork #184 / D-RA-013, raofflineproxy-cache-indexed, which caches a
# game the interface's own index identified without hashing it again):
# libraproxy_rchash.so, rcheevos' rc_hash with the libchdr CHD reader and the
# LZMA SDK 7z reader behind one C entry point (third_party/rcheevos_glue),
# which rom_hashing.py loads through ctypes to identify a ROM the way
# RetroArch does. Without it every ROM the scan looks at fails to hash. The
# recipe is upstream's linux/build_rchash.sh -- the same defines, the same
# source list -- run with the target compiler instead of zig, and the two
# submodule trees come from the raofflineproxy-rcheevos and
# raofflineproxy-libchdr packages. Checked against the QA ROMs before it
# went in: the library hashes the NES fixture to a49d6f153d642026643a162b6df7af99,
# the hash RetroArch itself logged for it (#179 evidence, 2026-09-14).

make_target() {
  local RC="$(get_build_dir raofflineproxy-rcheevos)"
  local CHDR="$(get_build_dir raofflineproxy-libchdr)"
  local GLUE="${PKG_BUILD}/third_party/rcheevos_glue"
  local LZMA_SDK="${PKG_BUILD}/third_party/lzma-sdk"
  mkdir -p "${PKG_BUILD}/.${TARGET_NAME}"
  ${CC} ${CFLAGS} ${LDFLAGS} -shared -Os -fPIC \
    -DRC_HASH_NO_ENCRYPTED \
    -DZ7_PPMD_SUPPORT \
    -DWANT_RAW_DATA_SECTOR=1 \
    -DWANT_SUBCODE=1 \
    -DVERIFY_BLOCK_CRC=1 \
    -I"${RC}/include" -I"${RC}/src" -I"${RC}/src/rhash" \
    -I"${GLUE}" -I"${GLUE}/shim" \
    -I"${CHDR}/include" -I"${CHDR}/src" \
    -I"${CHDR}/deps/miniz-3.1.2" -I"${CHDR}/deps/lzma-26.02/include" -I"${CHDR}/deps/zstd-1.5.7" \
    -I"${LZMA_SDK}" \
    -o "${PKG_BUILD}/.${TARGET_NAME}/libraproxy_rchash.so" \
    "${RC}/src/rhash/hash.c" \
    "${RC}/src/rhash/hash_rom.c" \
    "${RC}/src/rhash/hash_disc.c" \
    "${RC}/src/rhash/hash_zip.c" \
    "${RC}/src/rhash/cdreader.c" \
    "${RC}/src/rhash/md5.c" \
    "${RC}/src/rc_compat.c" \
    "${GLUE}/chd_stream.c" \
    "${GLUE}/cdfs_chd.c" \
    "${GLUE}/cdfs_pbp.c" \
    "${GLUE}/strl_compat.c" \
    "${GLUE}/sevenzip.c" \
    "${GLUE}/rchash_glue.c" \
    "${CHDR}/src/libchdr_bitstream.c" \
    "${CHDR}/src/libchdr_cdrom.c" \
    "${CHDR}/src/libchdr_chd.c" \
    "${CHDR}/src/libchdr_codec_avhuff.c" \
    "${CHDR}/src/libchdr_codec_cdfl.c" \
    "${CHDR}/src/libchdr_codec_cdlz.c" \
    "${CHDR}/src/libchdr_codec_cdzl.c" \
    "${CHDR}/src/libchdr_codec_cdzs.c" \
    "${CHDR}/src/libchdr_codec_flac.c" \
    "${CHDR}/src/libchdr_codec_huff.c" \
    "${CHDR}/src/libchdr_codec_lzma.c" \
    "${CHDR}/src/libchdr_codec_zlib.c" \
    "${CHDR}/src/libchdr_codec_zstd.c" \
    "${CHDR}/src/libchdr_flac.c" \
    "${CHDR}/src/libchdr_huffman.c" \
    "${CHDR}/deps/miniz-3.1.2/miniz.c" \
    "${CHDR}/deps/lzma-26.02/src/LzmaDec.c" \
    "${CHDR}/deps/zstd-1.5.7/zstddeclib.c" \
    "${LZMA_SDK}"/*.c
}

makeinstall_target() {
  local SITE="${INSTALL}/usr/lib/${PKG_PYTHON_VERSION}/site-packages"
  mkdir -p "${SITE}"
  cp -r "${PKG_BUILD}/linux/raofflineproxy" "${SITE}/raofflineproxy"
  rm -rf "${SITE}/raofflineproxy/__pycache__"
  # The SDL menu's fonts and donation QR images. menu_sdl.py only names the
  # paths at import; nothing on this image draws that menu.
  rm -rf "${SITE}/raofflineproxy/assets"
  rm -f "${SITE}"/raofflineproxy/font-mono*.ttf
  python_compile "${SITE}/raofflineproxy"

  mkdir -p "${INSTALL}/usr/bin"
  cp "${PKG_DIR}/sources/raofflineproxy-ctl" "${INSTALL}/usr/bin/raofflineproxy-ctl"
  chmod 0755 "${INSTALL}/usr/bin/raofflineproxy-ctl"
  # The scan's worker (fork #184, D-RA-013): caches a game the interface's
  # index already identified from its id and hash, and hands the rest to the
  # client's own hashing path. The ctl looks for it beside itself.
  cp "${PKG_DIR}/sources/raofflineproxy-cache-indexed" "${INSTALL}/usr/bin/raofflineproxy-cache-indexed"
  chmod 0755 "${INSTALL}/usr/bin/raofflineproxy-cache-indexed"

  # The images of what is cached, fetched until none is missing (#212): the
  # same action as caching the achievements, run at the end of a scan and a
  # top-up and available on its own as `raofflineproxy-ctl images`.
  cp "${PKG_DIR}/sources/raofflineproxy-cache-images" "${INSTALL}/usr/bin/raofflineproxy-cache-images"
  chmod 0755 "${INSTALL}/usr/bin/raofflineproxy-cache-images"
  cp "${PKG_DIR}/sources/raofflineproxy-refresh" "${INSTALL}/usr/bin/raofflineproxy-refresh"
  chmod 0755 "${INSTALL}/usr/bin/raofflineproxy-refresh"

  # /usr/lib is the first system path rom_hashing.py's loader tries after the
  # module's own directory.
  mkdir -p "${INSTALL}/usr/lib"
  cp "${PKG_BUILD}/.${TARGET_NAME}/libraproxy_rchash.so" "${INSTALL}/usr/lib/libraproxy_rchash.so"
  chmod 0644 "${INSTALL}/usr/lib/libraproxy_rchash.so"
}

post_install() {
  # Enabled in the image; the unit's ConditionPathExists on
  # /storage/.cache/services/raofflineproxy.conf is the off-switch, and
  # raofflineproxy-ctl (and, at boot, /usr/lib/autostart/daemons) owns that
  # marker.
  enable_service raofflineproxy.service
}

#!/bin/bash
# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2026-present ROCKNIX (https://github.com/ROCKNIX)

# EmulationStation game-end event hook: back up saves to the cloud when
# enabled (Network Settings > Cloud Saves > Sync When Exiting A Game).
# Installed to /usr/bin/scripts/game-end/, one of the directories
# EmulationStation scans for event scripts.

. /etc/profile

[ "$(get_setting cloudsaves.gameexit)" = "1" ] || exit 0

# Skip when a cloud sync is already running (e.g. launched from Tools)
pgrep -f '/usr/bin/cloud_(backup|restore)' >/dev/null && exit 0

/usr/bin/cloud_backup --yes >/dev/null 2>&1 &

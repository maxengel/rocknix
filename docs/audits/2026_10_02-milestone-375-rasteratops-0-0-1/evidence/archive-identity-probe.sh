#!/bin/bash
set -eu
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
label=GENERIC-X64
printf '%s\n' 2026_10_01-120000-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz > "$OUT/archives"
for osn in ROCKNIX RASTERATOPS; do
    mine=$(grep -E "^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-${label}-${osn}_SETTINGS\.tar\.gz$" "${OUT}/archives" | sort | tail -1)
printf 'OS_NAME=%s MINE=%s\n' "$osn" "${mine:-<empty>}"
done

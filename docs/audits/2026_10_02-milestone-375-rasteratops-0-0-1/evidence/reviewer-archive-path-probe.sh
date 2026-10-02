#!/bin/bash
# Host-only full production cloud_scan with real rclone local-backend listings.
# Reuses the existing SC fixture's UI sibling stubs; no network or user cloud.
set -uo pipefail
ROOT=$(git rev-parse --show-toplevel)
TMP=$(mktemp -d /tmp/audit375-scan.XXXXXX)
trap 'rm -rf "$TMP"' EXIT
src_of() { cp "$ROOT/$1" "$2"; }
SC="${TMP}/sc"; mkdir -p "${SC}/shim" "${SC}/rec" "${SC}/repo" "${SC}/storage/.config" "${SC}/storage/.cache"
src_of "projects/ROCKNIX/packages/network/rclone/sources/cloud_scan" "${SC}/repo/cloud_scan"
printf 'export PATH=/shim:/usr/bin:/bin\n' > "${SC}/profile"
printf 'SAVESPATH="/storage/roms"\nSAVES_REMOTE="/Rasteratops/Saves"\nSETTINGS_REMOTE="/Rasteratops/Backups"\nCONTENT_REMOTE="/Rasteratops/Content"\n' > "${SC}/storage/.config/cloud_sync.conf"
printf '#!/bin/sh\necho "logger $*" >> /rec/log\n' > "${SC}/shim/logger"
printf '#!/bin/sh\n[ -e /rec/noroute ] || echo "default via 10.0.2.2 dev eth0"\n' > "${SC}/shim/ip"
printf '#!/bin/sh\ncase "$1" in --label) echo QA;; esac\n' > "${SC}/repo/cloud_device_id"
cat > "${SC}/repo/cloud_migrate_layout" <<'EOR'
#!/bin/sh
printf '%s\n' "$*" >> /rec/argv
case "$1" in
  --state) if [ -e /rec/superseded ] && [ ! -e /rec/followed ]; then printf 'SAVES=/ROCKNIX/Saves\nCURRENT=/Rasteratops/Saves\nCURRENT_EXISTS=1\nSTATE=superseded-empty\n'
           else printf 'SAVES=/Rasteratops/Saves\nCURRENT=/Rasteratops/Saves\nCURRENT_EXISTS=1\nSTATE=current\n'; fi; exit 0 ;;
  --follow) touch /rec/followed; exit 0 ;;
  --join) if [ -e /rec/join-fail ]; then exit 5; elif [ -e /rec/join-timeout ]; then exit 124; elif [ -e /rec/join ]; then touch /rec/joined; exit 0; else exit 3; fi ;;
esac
exit 1
EOR
printf '#!/bin/sh\nprintf "%%s\\n" "$*" >> /rec/argv\ncase "$1" in --content-location) printf "CONTENT_REMOTE=/Rasteratops/Content\\nSTATE=ok\\n"; exit 0;; esac\nexit 1\n' > "${SC}/repo/cloud_setup"
cat > "${SC}/repo/cloud_content_restore" <<'EOR'
#!/bin/sh
printf '%s\n' "$*" >> /rec/argv
case "$1" in
  --scan) [ -e /rec/scan-fail ] && { echo "Your cloud couldn't be read. Try again." >&2; exit 5; }; printf 'gb|100|1|50|1|0|50|0\nbios|10|1|10|0|0|0|0\n'; exit 0 ;;
  --systems) echo gb; exit 0 ;;
esac
exit 1
EOR
cat > "${SC}/shim/rclone" <<'EOR'
#!/bin/sh
printf '%s\n' "$*" >> /rec/argv
case "$1" in
  listremotes) [ -e /rec/noremote ] || echo "qa:" ;;
  lsf) case "$*" in *--dirs-only*) printf 'Rasteratops/\nPhotos/\n' ;;
            *) printf '2026_09_01-000000-QA-ROCKNIX_SETTINGS.tar.gz\n2026_09_20-000000-Other-ROCKNIX_SETTINGS.tar.gz\n2026_09_10-000000-QA-ROCKNIX_SETTINGS.tar.gz\nROCKNIX_BACKUP.zip\n' ;; esac ;;
esac
exit 0
EOR
chmod +x "${SC}/shim"/* "${SC}/repo"/*
sc_run() { SCRC=$( ( setsid -w bwrap --die-with-parent --tmpfs / --ro-bind /usr /usr --symlink usr/bin /bin --symlink usr/lib /lib --symlink usr/lib64 /lib64 \
      --ro-bind /etc /etc --ro-bind "${SC}/profile" /etc/profile --ro-bind "${SC}/shim" /shim --bind "${SC}/rec" /rec --ro-bind "${SC}/repo" /repo \
      --dev /dev --proc /proc --tmpfs /tmp --bind "${SC}/storage" /storage \
      bash /repo/cloud_scan "$@" > "${SC}/out" 2>&1; echo $? ) 2>/dev/null ); }
sc_out() { tr '\n' '|' < "${SC}/out" | cut -c1-200; }
SCO="${SC}/storage/.cache/cloud_sync/scan"

cat > "$SC/shim/rclone" <<'EOS'
#!/bin/bash
printf '%s\n' "$*" >> /rec/argv
if [ "$1" = listremotes ]; then echo qa:; exit 0; fi
args=()
for a in "$@"; do
 case "$a" in qa:*) rel="${a#qa:}"; a=":local:/rec/cloud/${rel#/}" ;; esac
 args+=("$a")
done
exec /usr/bin/rclone "${args[@]}"
EOS
chmod +x "$SC/shim/rclone"
printf 'export PATH=/shim:/usr/bin:/bin\nexport OS_NAME=ROCKNIX\n' > "$SC/profile"
archive=2026_10_01-120000-QA-ROCKNIX_SETTINGS.tar.gz
mkdir -p "$SC/rec/cloud/Rasteratops/Backups/QA-deadbeef01"
printf 'synthetic archive sentinel\n' > "$SC/rec/cloud/Rasteratops/Backups/QA-deadbeef01/$archive"
rclone version | head -1
sc_run
echo "case=production_device_subfolder rc=$SCRC"
cat "$SCO/settings"
grep '^lsf' "$SC/rec/argv"
failed=0
if [ "$SCRC" = 0 ] && grep -qx 'MINE=' "$SCO/settings" && grep -qx 'COUNT=0' "$SCO/settings"; then echo 'REPRO: writer-shaped per-device archive is invisible to opening scan'; else failed=1; fi
cp "$SC/rec/cloud/Rasteratops/Backups/QA-deadbeef01/$archive" "$SC/rec/cloud/Rasteratops/Backups/$archive"
sc_run
echo "case=legacy_flat_root_control rc=$SCRC"
cat "$SCO/settings"
if [ "$SCRC" = 0 ] && grep -qx "MINE=$archive" "$SCO/settings"; then echo 'CONTROL: the same archive at the flat legacy root is found'; else failed=1; fi
exit "$failed"

#!/bin/bash
# Host-only reproduction for blind G-02/G-10; not VM acceptance.
# Runs the complete frozen production script in bwrap with the existing
# last-good-scripts-test layout fixture, extended to offer a settings archive.
set -uo pipefail
ROOT=$(git rev-parse --show-toplevel)
TMP=$(mktemp -d /tmp/audit375-layout.XXXXXX)
trap 'rm -rf "$TMP"' EXIT
src_of() { cp "$ROOT/$1" "$2"; }
LY="${TMP}/ly"; mkdir -p "${LY}/shim" "${LY}/rec" "${LY}/repo" "${LY}/storage/.config"
src_of "projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout" "${LY}/repo/cloud_migrate_layout"
printf 'export PATH=/shim:/usr/bin:/bin\n' > "${LY}/profile"
printf '#!/bin/sh\necho "logger $*" >> /rec/log\n' > "${LY}/shim/logger"
cat > "${LY}/shim/rclone" <<'EOR'
#!/bin/sh
printf '%s\n' "$*" >> /rec/argv
cmd="$1"; shift
path=""; for a in "$@"; do case "$a" in qa:*) path="$a";; esac; done
case "$cmd" in
  listremotes) echo "qa:" ;;
  lsd) exit 0 ;;
  backend) echo '{"Hashes":["md5"],"CaseInsensitive":false}' ;;
  lsf)
    # fail-rocknix: every listing under /ROCKNIX fails as a provider error does
    # (exit 1), and the root lists ROCKNIX/, so the walk that tells a missing
    # folder from a broken one reads it as broken
    [ -e /rec/fail-rocknix ] && case "$path" in qa:/ROCKNIX*) exit 1 ;; esac
    case "$path" in
      qa:/GAMES/*|qa:/GAMES) [ -e /rec/games-files ] && echo "snes/a.srm" ;;
      qa:/ROCKNIX/Saves/*|qa:/ROCKNIX/Saves) [ -e /rec/rocknix-files ] && echo "snes/a.srm" ;;
      qa:/ROCKNIX/Saves-replaced/*|qa:/ROCKNIX/Saves-replaced) [ -e /rec/replaced-files ] && echo "2026_09_01-000000/gb/L.srm" ;;
      qa:/Rasteratops/Saves/*|qa:/Rasteratops/Saves)
        # cur-readme: the seeding's folder, holding only its README
        if [ -e /rec/cur-exists ]; then echo "snes/"
        elif [ -e /rec/cur-readme ]; then case " $* " in *" /README.txt "*) ;; *) echo "README.txt" ;; esac; fi ;;
      qa:/Rasteratops|qa:/Rasteratops/) { [ -e /rec/cur-exists ] || [ -e /rec/cur-readme ]; } && echo "Saves/" ;;
      qa:|qa:/) echo "Other/"; [ -e /rec/fail-rocknix ] && echo "ROCKNIX/" ;;
    esac ;;
  cat) [ -e /rec/marker ] && echo "layout=2" ;;
  rcat) cat > /rec/rcat ;;
  check)
    # --differ F / --missing-on-dst F: the merge reads these files; the shim
    # writes them -- a differing name when told, else empty
    prev=""; for a in "$@"; do case "$prev" in --differ) if [ -e /rec/differ ]; then echo "snes/a.srm" > "$a"; else : > "$a"; fi ;; --missing-on-dst) : > "$a" ;; esac; prev="$a"; done
    if [ -e /rec/check-clean ]; then echo "0 differences found"; exit 0; else echo "1 differences found"; exit 1; fi ;;
  copy|delete|rmdirs|copyto|purge) exit 0 ;;
esac
exit 0
EOR
chmod +x "${LY}/shim"/*
ly_run() { # <conf text> <verb>: stdout in ${LY}/out, exit in LYRC
  printf '%s\n' "$1" > "${LY}/storage/.config/cloud_sync.conf"
  LYRC=$( ( setsid -w bwrap --die-with-parent --tmpfs / --ro-bind /usr /usr --symlink usr/bin /bin --symlink usr/lib /lib --symlink usr/lib64 /lib64 \
      --ro-bind /etc /etc --ro-bind "${LY}/profile" /etc/profile --ro-bind "${LY}/shim" /shim --bind "${LY}/rec" /rec --ro-bind "${LY}/repo" /repo \
      --dev /dev --proc /proc --tmpfs /tmp --tmpfs /var --dir /var/run --bind "${LY}/storage" /storage \
      bash /repo/cloud_migrate_layout "$2" > "${LY}/out" 2>&1; echo $? ) 2>/dev/null )
}
ly_conf() { printf 'SAVESPATH="/storage/roms"\nSETTINGS_BACKUPS="/storage/roms/backup"\nSAVES_REMOTE="%s"\nSETTINGS_REMOTE="%s"\nCONTENT_REMOTE="%s"\nRCLONE_NET_OPTS=""\n' "$1" "$2" "$3"; }
ly_out() { tr '\n' '|' < "${LY}/out" | cut -c1-240; }

# The fixture can answer an old Backups query, should production issue one.
sed -i '/^    case "$path" in/a\      qa:/ROCKNIX/Backups/*|qa:/ROCKNIX/Backups) cat /rec/legacy-archives ;;' "$LY/shim/rclone"
reset_case() {
    rm -f "$LY"/rec/*
    echo '2026_10_01-120000-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz' > "$LY/rec/legacy-archives"
}
report() {
    echo "case=$1 rc=$LYRC"
    cat "$LY/out"
    grep -E '^(SAVES|SETTINGS|CONTENT)_REMOTE=' "$LY/storage/.config/cloud_sync.conf"
    echo "legacy_archive=$(cat "$LY/rec/legacy-archives")"
    echo "backups_queries=$(grep -cE '^lsf .*ROCKNIX/Backups' "$LY/rec/argv" || true)"
    echo "copy_or_delete_calls=$(grep -cE '^(copy|delete|purge|move) ' "$LY/rec/argv" || true)"
}
failed=0
reset_case; touch "$LY/rec/cur-exists"
ly_run "$(ly_conf /ROCKNIX/Saves /ROCKNIX/Backups /ROCKNIX/Content)" --follow
report settings_only_follow
if [ "$LYRC" = 0 ] && grep -qx 'SETTINGS_REMOTE="/Rasteratops/Backups"' "$LY/storage/.config/cloud_sync.conf" && ! grep -qE '^lsf .*ROCKNIX/Backups' "$LY/rec/argv"; then echo 'REPRO: old settings pointer replaced without inspecting its archives'; else failed=1; fi
reset_case
ly_run "$(ly_conf /ROCKNIX/Saves /ROCKNIX/Backups /ROCKNIX/Content)" --settle
report settings_only_settle
if [ "$LYRC" = 0 ] && grep -qx 'SETTINGS_REMOTE="/Rasteratops/Backups"' "$LY/storage/.config/cloud_sync.conf"; then echo 'REPRO: settle also replaces the old settings pointer'; else failed=1; fi
reset_case; touch "$LY/rec/cur-exists"
ly_run "$(ly_conf /ROCKNIX/Saves /ROCKNIX/Backups '')" --follow
report explicit_root_follow
if [ "$LYRC" = 0 ] && grep -qx 'CONTENT_REMOTE="/Rasteratops/Content"' "$LY/storage/.config/cloud_sync.conf"; then echo 'REPRO: explicit empty content root replaced with current Content folder'; else failed=1; fi
reset_case; touch "$LY/rec/cur-exists"
ly_run "$(ly_conf /ROCKNIX/Saves /ROCKNIX/Backups /Mine/ROMs)" --follow
report custom_content_control
if [ "$LYRC" = 0 ] && grep -qx 'CONTENT_REMOTE="/Mine/ROMs"' "$LY/storage/.config/cloud_sync.conf"; then echo 'CONTROL: named custom content choice retained'; else failed=1; fi
exit "$failed"

#!/bin/bash
# Host-only fault injection, blind G-03. Complete production cloud_setup;
# existing C2 filesystem fixture, with a bounded settle failure injected.
set -uo pipefail
ROOT=$(git rev-parse --show-toplevel)
TMP=$(mktemp -d /tmp/audit375-seed.XXXXXX)
trap 'rm -rf "$TMP"' EXIT
RCLONE_REL=projects/ROCKNIX/packages/network/rclone/sources
CS="$TMP/C"; C1="$CS/c1"; mkdir -p "$C1/repo"
CSPATH=/shim:/usr/bin:/bin
CSBB=()
cp "$ROOT/$RCLONE_REL/cloud_setup" "$C1/repo/"
cat > "$C1/repo/cloud_migrate_layout" <<'EOS'
#!/bin/bash
case "$1" in
 --superseded) printf '/GAMES\n/ROCKNIX/Saves\n'; exit 0 ;;
 --settle)
    code=$(cat /run/settle-rc)
    if [ "$code" = 0 ]; then
      sed -i -e 's|^SAVES_REMOTE=.*|SAVES_REMOTE="/Rasteratops/Saves"|' -e 's|^SETTINGS_REMOTE=.*|SETTINGS_REMOTE="/Rasteratops/Backups"|' /storage/.config/cloud_sync.conf
    fi
    exit "$code" ;;
esac
EOS
chmod +x "$C1/repo/cloud_migrate_layout"
C2="${CS}/c2"; mkdir -p "${C2}/shim" "${C2}/storage/.config" "${C2}/cloud" "${C2}/rec" "${C2}/run"
printf '#!/bin/sh\nexit 0\n' > "${C2}/shim/logger"
cat > "${C2}/shim/rclone" <<'EOR'
#!/bin/bash
printf '%s\n' "$*" >> /rec/argv
mode=$(cat /run/mode 2>/dev/null); fail=$(cat /run/fail-lsf 2>/dev/null)
p=""; files=0; dirs=0; markers=0; ignore=0; src=""; rec=0
for a in "$@"; do
    case "$a" in
        qa:*) p="$a" ;;
        -R) rec=1 ;;
        --files-only) files=1 ;; --dirs-only) dirs=1 ;;
        --s3-directory-markers) markers=1 ;; --ignore-existing) ignore=1 ;;
        /*) src="$a" ;;
    esac
done
rel="${p#qa:}"; rel="${rel#/}"; rel="${rel%/}"; target="/cloud/${rel}"
case "$1" in
  listremotes) echo "qa:" ;;
  mkdir)
    if [ "${mode}" = bucket ] && [ "${markers}" -eq 0 ]; then exit 0; fi
    mkdir -p "${target}" ;;
  lsf)
    [ -n "${fail}" ] && { echo 'ERROR : Failed to lsf: connection reset' >&2; exit 1; }
    if [ -f "${target}" ]; then basename "${target}"; exit 0; fi
    if [ -d "${target}" ] && [ "${rec}" -eq 1 ] && [ "${files}" -eq 1 ]; then
        (cd "${target}" && find . -type f | sed 's|^\./||'); exit 0
    fi
    if [ -d "${target}" ]; then
        for e in "${target}"/*; do
            [ -e "$e" ] || continue
            if [ -d "$e" ]; then [ "${files}" -eq 1 ] || echo "$(basename "$e")/"
            else [ "${dirs}" -eq 1 ] || basename "$e"; fi
        done
        exit 0
    fi
    [ "${mode}" = bucket ] && exit 0
    echo 'ERROR : directory not found' >&2; exit 3 ;;
  copyto)
    [ "${ignore}" -eq 1 ] && [ -e "${target}" ] && exit 0
    mkdir -p "$(dirname "${target}")" && cp "${src}" "${target}" ;;
  *) exit 0 ;;
esac
EOR
chmod +x "${C2}/shim"/*
printf 'export PATH=%s\n' "${CSPATH}" > "${C2}/profile"
CONF2="${C2}/storage/.config/cloud_sync.conf"
c2() { # <args...>: cloud_setup against the cloud in C2/cloud; output to C2/out, rc in RC
    RC=$( ( bwrap --die-with-parent --tmpfs / --ro-bind /usr /usr \
        --symlink usr/bin /bin --symlink usr/lib /lib --symlink usr/lib64 /lib64 \
        --ro-bind /etc /etc --ro-bind "${C2}/profile" /etc/profile "${CSBB[@]}" \
        --ro-bind "${C2}/shim" /shim --ro-bind "${C1}/repo" /repo --bind "${C2}/storage" /storage \
        --bind "${C2}/cloud" /cloud --bind "${C2}/rec" /rec --ro-bind "${C2}/run" /run \
        --dev /dev --proc /proc --tmpfs /tmp --tmpfs /var --dir /var/log \
        bash /repo/cloud_setup "$@" > "${C2}/out" 2>&1; echo $? ) 2>/dev/null )
}
c2reset() { # <path|bucket> [fail]: an empty cloud, the shipped config
    rm -rf "${C2}/cloud"/* "${C2}/rec/argv"; echo "$1" > "${C2}/run/mode"
    if [ -n "${2:-}" ]; then echo 1 > "${C2}/run/fail-lsf"; else rm -f "${C2}/run/fail-lsf"; fi
    cp "${ROOT}/${RCLONE_REL}/cloud_sync.conf" "${CONF2}"
}
readmes() { (cd "${C2}/cloud" && find . -name README.txt | sort | tr '\n' ' '); }

failed=0
for code in 124 1 0; do
 c2reset path
 sed -i -e 's|^SAVES_REMOTE=.*|SAVES_REMOTE="/GAMES"|' -e 's|^SETTINGS_REMOTE=.*|SETTINGS_REMOTE="/GAMES/backup"|' "$CONF2"
 echo "$code" > "$C2/run/settle-rc"
 c2 --seed-folders
 echo "injected_settle_rc=$code cloud_setup_rc=$RC"
 grep '^SAVES_REMOTE=' "$CONF2"
 echo "readmes=$(readmes)"
 if [ "$code" != 0 ]; then
  if [ -f "$C2/cloud/GAMES/README.txt" ]; then echo 'REPRO: failed settlement still creates and seeds /GAMES'; else failed=1; fi
 else
  if [ ! -e "$C2/cloud/GAMES" ] && [ -f "$C2/cloud/Rasteratops/Saves/README.txt" ]; then echo 'CONTROL: successful settlement seeds only current layout'; else failed=1; fi
 fi
done
exit "$failed"

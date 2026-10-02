#!/bin/bash
# Extracted production helper and decision block; synthetic provider answers only.
REMOTENAME=qa:
SAVES_REMOTE=/ROCKNIX/Saves
RCLONE_LIST_OPTS=()
RCLONE_PROBE_OPTS=()
rclone() { case "$1" in lsd) return 0;; lsf) return 5;; *) return 99;; esac; }
bucket_based() { return 0; }
log_message() { :; }
bucket_dir_listed() {
    local path="${1%/}" parent name
    name="${path##*/}"
    [ -n "${name}" ] || return 0
    parent="${path%/*}"
    rclone lsf --dirs-only "${REMOTENAME}${parent}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null | grep -qx "${name}/"
}
probe() {

        local saves_folder="${SAVES_REMOTE%/}" list_rc
        rclone lsd "${REMOTENAME}${saves_folder}" "${RCLONE_PROBE_OPTS[@]}" >/dev/null 2>&1; list_rc=$?
        if [ ${list_rc} -eq 0 ] && bucket_based && ! bucket_dir_listed "${saves_folder}"; then
            list_rc=3
        fi
        if [ ${list_rc} -eq 3 ]; then
            log_message "saves folder ${SAVES_REMOTE} is a default an earlier version shipped, and the cloud has none; a backup does not make it (D-CLOUD-172)" "false"
            log_message "Nothing backed up: your cloud has no ${saves_folder} folder yet." "true"
            echo ">>> offer create-saves-folder|${saves_folder}"
            return 0
        fi
echo BACKUP_CONTINUES
}
probe

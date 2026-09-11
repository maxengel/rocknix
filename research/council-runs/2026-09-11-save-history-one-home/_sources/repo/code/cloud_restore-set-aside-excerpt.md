# cloud_restore -- the local set-aside on restore, as shipped

```bash
# holds the cloud lock, so no other transfer is writing under the tree.
sweep_partials() {
    [ -d "$1" ] || return 0
    find "$1" -type f -name '*.????????.partial' -exec rm -f {} \; 2>/dev/null
}

# Keep only the newest stamp folder under a local --backup-dir root: the
# replaced files of the run that just completed are the one record kept.
prune_replaced_local() {
    local root="$1" d
    [ -d "${root}" ] || return 0
    ls -1d "${root}"/*/ 2>/dev/null | sort -r | tail -n +2 | while read -r d; do
        rm -rf "${d}"
    done
}

# PART 1: Game saves restore function
# Restores game saves from cloud storage
restore_game_saves() {
    WHY_SAID=0
    log_message "====================================" "true"
    log_message "RESTORING YOUR GAME SAVES" "true"
    echo ">>> unit SAVES||"
    log_message "====================================" "true"
    
    log_message "Starting restore from ${REMOTENAME}${SAVES_REMOTE} to ${SAVESPATH}" "false"
# ...
    if [ "${backup_rel}" != "${SETTINGS_BACKUPS}" ]; then
        all_opts+=("--exclude=${backup_rel}/**")
    fi

    # What a restore overwrites is kept for one cycle. rclone moves each
    # file it would replace into --backup-dir, in its own hierarchy, before
    # writing the new one. The manual RESTORE SAVES row passes no --update,
    # so a newer local save can be replaced by an older cloud copy, and
    # until 2026-09-10 nothing kept the loser -- D-CLOUD-078's named gap
    # (#22's reconciler is the full answer; this is the cheap form). Under
    # /storage/.cache: the internal card, outside the saves tree, so it never
    # overlaps the destination and never enters a backup. One folder per
    # run; after a run that completed, every folder but the newest goes, so
    # there is one record at rest (D-CLOUD-078 (3)).
    local replaced_root="/storage/.cache/cloud_sync/replaced"
    all_opts+=("--backup-dir=${replaced_root}/$(date +%Y_%m_%d-%H%M%S)")

    # Check if the rclone version supports the terminal width flag
    if rclone help | grep -q progress-terminal-width; then
        all_opts+=("--progress-terminal-width=80")
    fi
```

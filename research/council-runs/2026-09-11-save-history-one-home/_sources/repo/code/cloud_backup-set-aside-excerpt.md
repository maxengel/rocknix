# cloud_backup -- the set-aside (--backup-dir) and its pruning, as shipped in af2db4ab09

```bash
    
    return $rclone_exit_code
}

# Keep only the newest stamp folder under the remote --backup-dir root. Names
# are stamps, so sorting them is ordering them by age; the root not existing
# (nothing replaced yet) lists nothing and nothing happens.
prune_replaced_remote() {
    local root="$1" d
    rclone lsf --dirs-only "${root}/" "${RCLONE_NET_OPTS_ARRAY[@]}" 2>/dev/null \
        | tr -d '/' | grep . | sort -r | tail -n +2 | while read -r d; do
        [ -n "${d}" ] || continue
        log_message "removing replaced-saves folder ${root}/${d} (superseded)" "false"
        rclone purge "${root}/${d}" "${RCLONE_NET_OPTS_ARRAY[@]}" 2>/dev/null \
            || log_message "could not remove ${root}/${d}" "false" "WARN"
    done
}

# PART 1: Game saves backup function
# Backs up game saves to cloud storage
backup_game_saves() {
# ...
    # Tuesday take away".
    #
    # In copy mode as well, since 2026-09-10. copy never deletes, but it does
    # replace: a cloud save overwritten by this device's copy -- with a wrong
    # clock, an older one -- had no kept version (D-CLOUD-078's named gap,
    # #105). rclone moves each file it would replace into --backup-dir before
    # writing the new one, so the previous cloud copy survives one cycle.
    # A sibling of SAVES_REMOTE, never inside it: rclone refuses a
    # --backup-dir that overlaps the destination, and the same reasoning
    # already applies to SETTINGS_REMOTE. One folder per run; after a full
    # run that completed, every folder but the newest is removed, so there
    # is one record at rest (D-CLOUD-078 (3)). The folder is shared by every
    # device using the saves folder, so "one cycle" is one cycle of whichever
    # device ran last.
    local replaced_root="${SAVES_REMOTE%/}-replaced"
    all_opts+=("--backup-dir=${REMOTENAME}${replaced_root}/$(date +%Y_%m_%d-%H%M%S)")
    log_message "anything replaced (or, in sync mode, removed) in the cloud goes to ${replaced_root}" "false"

    # Check if the rclone version supports the terminal width flag

    # Execute rclone with enhanced error handling
    execute_rclone_with_error_handling \
        "${BACKUPMETHOD}" \
        "${SAVESPATH}/" \
        "${REMOTENAME}${SAVES_REMOTE}/" \
        "${all_opts[@]}"

    BACKUP_STATUS=$?
    # A failed transfer says why. The network gone ends the run as 69 here;
    # anything else falls through to report_rclone_error with rclone's code.
    # Every run, not only --recent: the pre-run probe above proves the remote
    # was there when the run started, and #101 is about the link that goes
    # away after that.
    if [ $BACKUP_STATUS -ne 0 ] && [ $BACKUP_STATUS -ne 9 ]; then
        network_lost_during_run "$BACKUP_STATUS" "the saves backup"
    fi

    # The card the saves folder is on must still be the one the transfer
    # started on. A bind that landed mid-run means part of the run went to
    # the other card: a failed run, and not one to record. A good run
    # records the card, so the next transfer has something to compare.
    local root_note=""
    if [ -x "${saves_root_tool}" ]; then
        if ! root_note=$("${saves_root_tool}" record "${saves_root_id}"); then
            BACKUP_STATUS=1
        fi
    fi

    # Report the result with detailed error information
    if [ -n "${root_note}" ]; then
        relay_refusal "${root_note}"
    else
        report_rclone_error $BACKUP_STATUS "Backing up your saves"
    fi

    # The replaced files of the run that just completed are the one record
    # kept; older stamp folders go. Not on a --recent run: a remote round
    # trip the game-exit sync should not pay (the next full pass trims).
    if [ "${RECENT}" -eq 0 ] && { [ $BACKUP_STATUS -eq 0 ] || [ $BACKUP_STATUS -eq 9 ]; }; then
        prune_replaced_remote "${REMOTENAME}${replaced_root}"
    fi

    # RSYNCRMDIR: after a successful backup, remove orphaned empty directories on
    # the remote (--leave-root keeps the sync root itself). Exit code 9 means
    # "success, no files transferred", so tidy on that too.
    # Not on a --recent run: tidying is a full-pass job, and a remote round
```

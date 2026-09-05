# Rclone Bisync Feature Planning

## Objective
Build a bidirectional sync tool for game saves, savestates, and savestate thumbnails using rclone bisync, extending the current cloud backup/restore scripts.

## Key Requirements

## Implementation Plan: `cloud_sync` Bisync Tool

### Phase 1: Foundation & Setup
- [ ] Create initial `cloud_sync` script with header, SPDX, and copyright
- [ ] Set up global variables (SCRIPT_NAME, LOG_FILE, START_TIME)
- [ ] Implement centralized logging function (severity levels, color output)
- [ ] Load controller config if available
- [ ] Implement controller/keyboard input functions (reuse/extend from backup/restore)
- [ ] Implement config loading (source `cloud_sync.conf`, call `cloud_sync_helper`, handle duplicates)

### Phase 2: Bisync Command & Core Logic
- [ ] Implement rclone bisync command builder (options, filters, dry-run support)
- [ ] Add preview mode (`--dry-run`) with summary output
- [ ] Integrate exclusion/filter logic (game saves, savestates, thumbnails, per-core rules)
- [ ] Implement error handling/reporting for bisync exit codes
- [ ] Log all bisync operations and errors

### Phase 3: Conflict Handling & UI
- [ ] Implement automatic conflict resolution (newer file wins)
- [ ] Add controller-friendly UI for conflict preview (show file details, allow proceed/cancel)
- [ ] Plan for future manual conflict resolution (per-conflict selection, metadata display)
- [ ] Display error messages and limitations via controller/keyboard UI

### Phase 4: Integration & Edge Cases
- [ ] Integrate with existing config, rules, and helper scripts
- [ ] Handle per-core savestate compatibility (detect core type, prevent overwrites)
- [ ] Ensure safe handling of lock files, interruptions, excessive deletes
- [ ] Create/restore empty directories as needed

### Phase 5: Testing & Validation
- [ ] Test basic bisync operation (manual sync, preview, exclusions)
- [ ] Test conflict scenarios (automatic resolution, preview, error messaging)
- [ ] Validate logging and error reporting
- [ ] Test controller/keyboard UI flow

### Phase 6: Documentation & Wiki Update
- [ ] Document usage, config options, and workflow in the official ROCKNIX wiki
- [ ] Add troubleshooting, limitations, and best practices
- [ ] Link to rclone bisync documentation for advanced users

## Initial Steps
1. Review current backup/restore logic for file selection and exclusions
2. Identify rclone bisync options and limitations
3. Design user flow for bidirectional sync (controller/keyboard)
4. Plan for conflict detection and resolution (e.g., newer file wins, manual choice)
5. Integrate with existing config and rules

## Open Questions
- How to handle conflicts (automatic/manual)?
- Should sync be scheduled or only manual?
- How to preview changes before sync?
- What additional config is needed?
- What should the workflow be once manual conflict resolution is supported?
  - Should we deal with conflicts as they arise during sync?
  - Or always start with a dry run, then sync uncontested files, and finally prompt the user to review and resolve conflicts?
  - Or: dry run > review conflicts > sync uncontested files?

## Next Actions
- Draft CLI and UI flow
- Prototype bisync command and test basic sync
- Plan integration with config and rules
- Document edge cases and error handling

---
## General Issues to Tackle

1. **Conflict Resolution**
   - Initial implementation may resolve conflicts automatically (e.g., newer file wins).
   - Future versions should allow users to choose between local or cloud versions for each conflict.

2. **Supporting Savestates from Different Emulator Cores**
   - Savestates from different cores are likely incompatible.
   - Need logic to detect core type and prevent overwriting incompatible savestates.

3. **Integrating Conflict Resolution and Per-Core Savestate Handling**
   - Extend backup and restore scripts to support these features.
   - Ensure consistent handling across all sync operations.

4. **UI Exploration**
   - Investigate building a user interface for sync and conflict management.
   - Options include integration with EmulationStation or a custom GUI (e.g., Sway/Wayland).

---
Add notes, ideas, and todos below as we proceed.

## Script Planning: Structure and Approach

### Script Structure & Main Functions
- Configuration Loading:
  - Source config from cloud_sync.conf and apply defaults as in backup/restore scripts.
  - Integrate with cloud_sync_helper for config/rules updates.
- Controller Input & UI:
  - Use controller/keyboard input functions for interactive prompts and conflict resolution.
  - Menu/confirmation logic modeled after backup/restore scripts.
- Logging & Error Handling:
  - Centralized logging function with severity levels and color output.
  - Consistent error reporting and exit codes.
- Bisync Execution:
  - Build bisync command with options for filters, conflict resolution, and safety features.
  - Preview changes with --dry-run before actual sync.
- Conflict Handling:
  - Initial: automatic (e.g., --conflict-resolve newer).
  - Future: interactive choice via controller UI.
- Per-Core Savestate Support:
  - Detect emulator core type and apply exclusions/filters to prevent incompatible overwrites.
- Integration Points:
  - Use helper scripts for config/rules management.
  - Extend backup/restore logic for bidirectional sync.
  - Share filter files and exclusion logic.

### Error Handling & Logging
- Log all bisync operations and errors to a central log file.
- Use rclone bisync exit codes for status reporting.
- Handle lock files and interruptions robustly (see --resilient, --recover, --max-lock).

### Error Messaging and Limitations Handling
- Clearly message the user when:
  - A sync conflict occurs (show file details, offer resolution options if possible)
  - The chosen backend is not supported by bisync (list supported backends)
  - Any limitation is encountered (e.g., missing modtime/checksum support, empty directory handling, rename issues, case sensitivity)
  - Bisync aborts due to excessive deletes (`--max-delete`), lock files, or other safety features
  - Filters or config changes require a `--resync` run
- Use controller/keyboard UI to display error messages and prompt for user action
- Log all error conditions with severity and context for troubleshooting
- Reference the "Limitations" section in documentation for backend-specific and operational caveats
- Consider adding a help/info screen in the UI summarizing bisync limitations and best practices

### Initial Bisync Command Prototype
rclone bisync "${LOCAL_SYNC_PATH}" "${REMOTE_SYNC_PATH}" \
  --filters-file "/storage/.config/cloud_sync-rules.txt" \
  --conflict-resolve newer \
  --conflict-loser num \
  --conflict-suffix conflict \
  --create-empty-src-dirs \
  --check-access \
  --max-delete 50 \
  --log-file "/var/log/cloud_sync.log" \
  --dry-run -v

Adjust options for actual run (remove --dry-run, tune conflict resolution, etc.)

### Answers to Open Questions

1. **Conflict Handling**
   - v1: Automatic resolution based on the more recent save (modification time).
   - v2: Manual resolution with user choice. For this, display metadata such as:
     - Thumbnail (if available)
     - Last modified date
     - Creation date (if possible)
     - Emulator core (if detectable)
     - System/platform
     - Any other relevant details (e.g., file size, save name)
   - Interim phase: Preview changes (dry run), allow user to proceed or cancel. Future: step through changes game-by-game, then allow per-conflict selection.

2. **Sync Scheduling**
   - Sync will be manual only in v1.
   - Future: Optionally run on system launch (with network), or after game closes.

3. **Conflict Handling Phases**
   - Phase 1: Automatic resolution (newer file wins)
   - Phase 2: Preview changes (dry run), user can proceed or cancel
   - Phase 3: Step through changes by game, allow user to select which version to keep on conflict

4. **Additional Configs**
   - New config options may be needed for:
     - Conflict resolution mode (auto/manual/preview)
     - Metadata display preferences
     - Sync triggers (manual, on launch, on game close)
     - Per-core savestate handling rules
     - UI/notification preferences

### Documentation & Wiki Updates
- Update the official ROCKNIX wiki to include:
  - Overview of the bisync tool and its purpose
  - Step-by-step usage instructions
  - Configuration options and examples
  - Conflict resolution workflow (automatic, preview, manual)
  - Supported backends and limitations
  - Troubleshooting and error messages
  - Integration with controller UI and game save workflows
  - Best practices and safety tips
- Ensure documentation is kept up-to-date as features evolve
- Link to rclone bisync documentation for advanced users

### Next Steps
- Draft CLI and controller UI flow for bisync script.
- Prototype bisync command and test basic sync with game saves/savestates.
- Plan integration with config, rules, and helper scripts.
- Document edge cases and error handling strategies.

---

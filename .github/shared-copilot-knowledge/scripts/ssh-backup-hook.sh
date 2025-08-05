#!/bin/bash
# SSH-Based Copilot Instructions Backup Hook
# This hook backs up untracked instruction files directly to a remote Git repository
#
# Version: 1.2.0
# Last Updated: 2025-08-05

set -e

# Repository context
REPO_NAME="$(basename "$(git rev-parse --show-toplevel)")"
BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
HOSTNAME="$(hostname)"

# Check if we're in the shared-copilot-knowledge repository
if [ "$REPO_NAME" = "shared-copilot-knowledge" ]; then
    echo "[pre-commit] Running in shared-copilot-knowledge repository - backup not needed"
    exit 0
fi

# Configuration - Update these values for your setup
BACKUP_REPO_URL="git@github.com:maxengel/shared-copilot-knowledge.git"
BACKUP_REPO_HTTPS="https://github.com/maxengel/shared-copilot-knowledge.git"  # Fallback URL

BACKUP_BRANCH="auto-backup/${REPO_NAME}/${BRANCH_NAME}/${HOSTNAME}"

# Source directory for instruction files
SRC_DIR="$(git rev-parse --show-toplevel)/.github"

# Check if there are any instruction files to backup
# Use a function to check for instruction files with proper glob handling
has_instruction_files() {
    # Check for root-level instruction files
    if ls "$SRC_DIR"/*.instructions.md >/dev/null 2>&1; then
        return 0
    fi

    # Check for copilot-instructions.md
    if [ -f "$SRC_DIR/copilot-instructions.md" ]; then
        return 0
    fi

    # Check for instructions directory with files
    if [ -d "$SRC_DIR/instructions" ] && ls "$SRC_DIR/instructions"/*.instructions.md >/dev/null 2>&1; then
        return 0
    fi

    return 1
}

# Function to check for shared knowledge updates
check_shared_knowledge_updates() {
    if [ -f ".github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh" ]; then
        echo "[pre-commit] Checking for shared knowledge updates..."
        if ! .github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh | grep -q "✅ All shared knowledge components are up to date!"; then
            echo "[pre-commit] ⚠️  Shared knowledge updates available!"
            echo "[pre-commit] Run: .github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh"
            echo "[pre-commit] Consider updating before committing."
        else
            echo "[pre-commit] ✅ Shared knowledge is up to date."
        fi
    fi
}

# Check for shared knowledge updates first
check_shared_knowledge_updates

if ! has_instruction_files; then
    echo "[pre-commit] No instruction files found - skipping backup."
    exit 0
fi

# Function to attempt SSH backup
backup_via_ssh() {
    local temp_dir=$(mktemp -d)
    local success=false

    # Cleanup function
    cleanup() {
        rm -rf "$temp_dir"
    }
    trap cleanup EXIT

    echo "[pre-commit] Attempting SSH-based backup..."

    # Clone backup repository
    cd "$temp_dir"
    if git clone --depth 1 "$BACKUP_REPO_URL" backup-repo 2>/dev/null; then
        cd backup-repo

        # Configure git if needed
        git config user.email "copilot-backup@$(hostname)" 2>/dev/null || true
        git config user.name "Copilot Backup Bot" 2>/dev/null || true

        # Create/checkout main branch (not backup branch)
        git checkout master 2>/dev/null || git checkout main 2>/dev/null

        # Create target directory structure
        local target_dir="backups/${REPO_NAME}/${BRANCH_NAME}/${HOSTNAME}"
        mkdir -p "$target_dir"

        # Copy instruction files
        local files_copied=0

        # Copy root-level instruction files
        if ls "$SRC_DIR"/*.instructions.md >/dev/null 2>&1; then
            cp "$SRC_DIR"/*.instructions.md "$target_dir"/
            files_copied=$((files_copied + 1))
        fi

        if [ -f "$SRC_DIR/copilot-instructions.md" ]; then
            cp "$SRC_DIR/copilot-instructions.md" "$target_dir"/
            files_copied=$((files_copied + 1))
        fi

        # Copy instructions from .github/instructions/
        if [ -d "$SRC_DIR/instructions" ] && ls "$SRC_DIR/instructions"/*.instructions.md >/dev/null 2>&1; then
            cp "$SRC_DIR/instructions"/*.instructions.md "$target_dir"/
            files_copied=$((files_copied + 1))
        fi

        if [ $files_copied -eq 0 ]; then
            echo "[pre-commit] No instruction files found to backup."
            return 0
        fi

        # Add timestamp file for tracking
        echo "Backup created: $(date)" > "$target_dir/.backup-timestamp"
        echo "Source: ${REPO_NAME}/${BRANCH_NAME}" >> "$target_dir/.backup-timestamp"
        echo "Hostname: ${HOSTNAME}" >> "$target_dir/.backup-timestamp"

        # Commit changes
        git add .
        if git diff --staged --quiet; then
            echo "[pre-commit] No changes to backup."
        else
            local commit_msg="Auto-backup: ${REPO_NAME}/${BRANCH_NAME} from ${HOSTNAME}

Backup timestamp: $(date)
Files backed up from: $(git rev-parse --show-toplevel)
Branch: ${BRANCH_NAME}
Commit: $(git rev-parse HEAD)

Includes: instruction files (.github/*.instructions.md, .github/instructions/*.instructions.md)
          copilot config (copilot-instructions.md)"

            git commit -m "$commit_msg"

            # Push to remote main branch
            if git push origin master 2>/dev/null || git push origin main 2>/dev/null; then
                echo "[pre-commit] ✓ Instructions backed up successfully via SSH"
                success=true
            else
                echo "[pre-commit] ✗ Failed to push backup to remote repository"
                return 1
            fi
        fi
    else
        echo "[pre-commit] ✗ Failed to clone backup repository via SSH"
        return 1
    fi

    return 0
}

# Function to attempt HTTPS fallback
backup_via_https() {
    echo "[pre-commit] Attempting HTTPS fallback..."
    # Note: HTTPS would require a personal access token
    # This is a placeholder for future implementation
    echo "[pre-commit] HTTPS backup not yet implemented"
    return 1
}

# Function to fall back to local backup
backup_locally() {
    echo "[pre-commit] Falling back to local backup..."

    local local_backup_dir="$HOME/.copilot-backups/${REPO_NAME}/${BRANCH_NAME}/${HOSTNAME}"
    mkdir -p "$local_backup_dir"

    # Copy files locally
    cp "$SRC_DIR"/*.instructions.md "$local_backup_dir"/ 2>/dev/null || true
    cp "$SRC_DIR"/copilot-instructions.md "$local_backup_dir"/ 2>/dev/null || true

    if [ -d "$SRC_DIR/instructions" ]; then
        cp "$SRC_DIR/instructions"/*.instructions.md "$local_backup_dir"/ 2>/dev/null || true
    fi

    echo "Backup created: $(date)" > "$local_backup_dir/.backup-timestamp"
    echo "[pre-commit] ✓ Instructions backed up locally to: $local_backup_dir"
}

# Main backup logic with fallbacks
if backup_via_ssh; then
    echo "[pre-commit] Remote backup completed successfully"
elif backup_via_https; then
    echo "[pre-commit] HTTPS backup completed successfully"
else
    echo "[pre-commit] Remote backup failed, using local fallback"
    backup_locally
fi

# Always exit successfully to not block commits
exit 0

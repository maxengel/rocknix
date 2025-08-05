#!/bin/bash
# Universal Shared Knowledge Version Comparison Script
# Version: 1.0.0
# Last Updated: 2025-08-05

echo "=== Shared Knowledge Version Comparison ==="
echo "Comparing all shared knowledge components (instructions, prompts, scripts)"
echo

# Function to extract version from file header
get_file_version() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Check for YAML front matter version (prompts/instructions)
        version=$(grep "^version:" "$file" | cut -d'"' -f2 2>/dev/null)
        if [[ -n "$version" ]]; then
            echo "$version"
            return
        fi

        # Check for comment-based version (scripts)
        version=$(grep "^# Version:" "$file" | cut -d' ' -f3 2>/dev/null)
        if [[ -n "$version" ]]; then
            echo "$version"
            return
        fi
    fi
    echo "unknown"
}

# Function to get last updated date
get_last_updated() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # Check for YAML front matter or comment-based date
        updated=$(grep -E "^(last_updated:|# Last Updated:)" "$file" | cut -d' ' -f3- 2>/dev/null | tr -d '"')
        if [[ -n "$updated" ]]; then
            echo "$updated"
            return
        fi
    fi
    echo "unknown"
}

# Function to compare directory contents
compare_directory() {
    local category="$1"
    local shared_dir="$2"
    local active_dir="$3"
    local file_pattern="$4"

    echo "=== $category ==="

    if [[ ! -d "$shared_dir" ]]; then
        echo "❌ No shared $category found at $shared_dir"
        return
    fi

    local files_found=false
    local changes_found=false

    for file in "$shared_dir"/$file_pattern; do
        if [[ -f "$file" ]]; then
            files_found=true
            filename=$(basename "$file")
            shared_version=$(get_file_version "$file")
            shared_updated=$(get_last_updated "$file")

            echo "📄 $filename:"

            if [[ -f "$active_dir/$filename" ]]; then
                current_version=$(get_file_version "$active_dir/$filename")
                current_updated=$(get_last_updated "$active_dir/$filename")

                echo "   Current: $current_version ($current_updated)"
                echo "   Available: $shared_version ($shared_updated)"

                if [[ "$shared_version" != "$current_version" ]] || [[ "$shared_updated" != "$current_updated" ]]; then
                    echo "   ⚠️  Changes detected!"
                    changes_found=true
                else
                    echo "   ✅ Up to date"
                fi
            else
                echo "   🆕 New file (version: $shared_version, updated: $shared_updated)"
                changes_found=true
            fi
            echo
        fi
    done

    if [[ "$files_found" = false ]]; then
        echo "   No $category files found"
        echo
    fi

    return $([ "$changes_found" = true ] && echo 0 || echo 1)
}

# Check if shared knowledge directory exists
if [[ ! -d ".github/shared-copilot-knowledge" ]]; then
    echo "❌ No shared knowledge found at .github/shared-copilot-knowledge/"
    echo "   Run the distribution workflow to get the latest shared knowledge first."
    exit 1
fi

echo "Checking shared knowledge components..."
echo

# Track if any changes are found
any_changes=false

# Compare Instructions
if compare_directory "Instructions" ".github/shared-copilot-knowledge/instructions" ".github/instructions" "*.instructions.md"; then
    any_changes=true
fi

# Compare Prompts
if compare_directory "Prompts" ".github/shared-copilot-knowledge/prompts" ".github/prompts" "*.prompt.md"; then
    any_changes=true
fi

# Compare Scripts
if compare_directory "Scripts" ".github/shared-copilot-knowledge/scripts" ".github/scripts" "*.sh"; then
    any_changes=true
fi

# Summary and deployment instructions
echo "=== Summary ==="
if [[ "$any_changes" = true ]]; then
    echo "⚠️  Updates available in shared knowledge components"
    echo
    echo "=== Deployment Options ==="
    echo "To update instructions:"
    echo "   cp .github/shared-copilot-knowledge/instructions/*.instructions.md .github/instructions/"
    echo
    echo "To update prompts:"
    echo "   cp .github/shared-copilot-knowledge/prompts/*.prompt.md .github/prompts/"
    echo
    echo "To update scripts:"
    echo "   cp .github/shared-copilot-knowledge/scripts/*.sh .github/scripts/"
    echo "   chmod +x .github/scripts/*.sh"
    echo
    echo "To compare specific files:"
    echo "   diff .github/[category]/[filename] .github/shared-copilot-knowledge/[category]/[filename]"
    echo
    echo "To backup current files before updating:"
    echo "   cp -r .github/instructions .github/instructions.backup.$(date +%Y%m%d) 2>/dev/null || true"
    echo "   cp -r .github/prompts .github/prompts.backup.$(date +%Y%m%d) 2>/dev/null || true"
    echo "   cp -r .github/scripts .github/scripts.backup.$(date +%Y%m%d) 2>/dev/null || true"
else
    echo "✅ All shared knowledge components are up to date!"
fi

#!/bin/bash
#!/bin/bash
# Setup Script for Shared Copilot Knowledge
# Deploys shared knowledge files to project repositories
#
# Version: 1.2.0
# Last Updated: 2025-08-05
# This script sets up shared knowledge components and configures the repository
#
# Version: 1.0.0
# Last Updated: 2025-08-05

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Repository root
REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo -e "${BLUE}🚀 Setting up Shared Copilot Knowledge${NC}"
echo "Repository: $(basename "$REPO_ROOT")"
echo

# Function to create directory if it doesn't exist
ensure_directory() {
    local dir="$1"
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "${GREEN}✓${NC} Created directory: $dir"
    else
        echo -e "${YELLOW}ℹ${NC} Directory exists: $dir"
    fi
}

# Function to copy and set permissions for files
deploy_file() {
    local source="$1"
    local dest="$2"
    local make_executable="$3"

    if [ -f "$source" ]; then
        cp "$source" "$dest"
        if [ "$make_executable" = "true" ]; then
            chmod +x "$dest"
            echo -e "${GREEN}✓${NC} Deployed executable: $(basename "$dest")"
        else
            echo -e "${GREEN}✓${NC} Deployed file: $(basename "$dest")"
        fi
    else
        echo -e "${RED}✗${NC} Source file not found: $source"
        return 1
    fi
}

# Function to backup existing files
backup_existing() {
    local file="$1"
    if [ -f "$file" ]; then
        local backup_name="${file}.backup.$(date +%Y%m%d-%H%M%S)"
        cp "$file" "$backup_name"
        echo -e "${YELLOW}📦${NC} Backed up existing file: $(basename "$file") → $(basename "$backup_name")"
    fi
}

# Check if shared knowledge directory exists
if [ ! -d ".github/shared-copilot-knowledge" ]; then
    echo -e "${RED}❌ No shared knowledge found at .github/shared-copilot-knowledge/${NC}"
    echo "   This script should be run after the shared knowledge has been distributed."
    echo "   Contact your repository administrator to enable shared knowledge distribution."
    exit 1
fi

echo "Step 1: Setting up directory structure..."

# Ensure target directories exist
ensure_directory ".github/instructions"
ensure_directory ".github/prompts"
ensure_directory ".github/scripts"

echo
echo "Step 2: Deploying instruction files..."

# Deploy instructions (with backup)
if ls .github/shared-copilot-knowledge/instructions/*.instructions.md >/dev/null 2>&1; then
    for file in .github/shared-copilot-knowledge/instructions/*.instructions.md; do
        filename=$(basename "$file")
        dest_file=".github/instructions/$filename"
        backup_existing "$dest_file"
        deploy_file "$file" "$dest_file" false
    done
else
    echo -e "${YELLOW}ℹ${NC} No instruction files found to deploy"
fi

# Deploy copilot-instructions.md (special handling)
if [ -f ".github/shared-copilot-knowledge/instructions/copilot-instructions.md" ]; then
    backup_existing ".github/copilot-instructions.md"
    deploy_file ".github/shared-copilot-knowledge/instructions/copilot-instructions.md" ".github/copilot-instructions.md" false
fi

echo
echo "Step 3: Deploying prompt files..."

# Deploy prompts (with backup)
if ls .github/shared-copilot-knowledge/prompts/*.prompt.md >/dev/null 2>&1; then
    for file in .github/shared-copilot-knowledge/prompts/*.prompt.md; do
        filename=$(basename "$file")
        dest_file=".github/prompts/$filename"
        backup_existing "$dest_file"
        deploy_file "$file" "$dest_file" false
    done
else
    echo -e "${YELLOW}ℹ${NC} No prompt files found to deploy"
fi

echo
echo "Step 4: Setting up pre-commit hook..."

# Check if pre-commit is already configured
if [ -f ".pre-commit-config.yaml" ]; then
    echo -e "${YELLOW}ℹ${NC} Pre-commit configuration exists"
    if grep -q "ssh-backup-hook.sh" .pre-commit-config.yaml; then
        echo -e "${GREEN}✓${NC} SSH backup hook already configured"
    else
        echo -e "${YELLOW}⚠${NC} Pre-commit configured but no SSH backup hook found"
        echo "   Consider adding the backup hook to your .pre-commit-config.yaml"
        echo "   Reference: .github/shared-copilot-knowledge/scripts/pre-commit-template.yaml"
    fi
else
    echo -e "${BLUE}📝${NC} Creating pre-commit configuration from template..."
    if [ -f ".github/shared-copilot-knowledge/scripts/pre-commit-template.yaml" ]; then
        cp .github/shared-copilot-knowledge/scripts/pre-commit-template.yaml .pre-commit-config.yaml
        echo -e "${GREEN}✓${NC} Created .pre-commit-config.yaml from shared template"
    else
        # Fallback minimal configuration - references scripts in shared knowledge directory
        cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: local
    hooks:
      - id: copilot-backup
        name: Backup Copilot Instructions
        entry: .github/shared-copilot-knowledge/scripts/ssh-backup-hook.sh
        language: system
        always_run: true
        pass_filenames: false
        stages: [pre-commit]
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
EOF
        echo -e "${GREEN}✓${NC} Created basic .pre-commit-config.yaml with backup hook"
    fi
fi

# Install pre-commit hooks if pre-commit is available
if command -v pre-commit >/dev/null 2>&1; then
    echo -e "${BLUE}🔧${NC} Installing pre-commit hooks..."
    pre-commit install
    echo -e "${GREEN}✓${NC} Pre-commit hooks installed"
else
    echo -e "${YELLOW}⚠${NC} pre-commit not found. Install with: pip install pre-commit"
    echo "   Then run: pre-commit install"
fi

echo
echo "Step 5: Verification..."

# Check for shared knowledge directory and scripts
if [ -d ".github/shared-copilot-knowledge" ]; then
    echo -e "${GREEN}✓${NC} Shared knowledge directory exists"

    # Ensure shared knowledge scripts are executable
    if ls .github/shared-copilot-knowledge/scripts/*.sh >/dev/null 2>&1; then
        for script in .github/shared-copilot-knowledge/scripts/*.sh; do
            if [ -f "$script" ] && [ -x "$script" ]; then
                echo -e "${GREEN}✓${NC} Executable: $(basename "$script")"
            elif [ -f "$script" ]; then
                echo -e "${YELLOW}⚠${NC} Making executable: $(basename "$script")"
                chmod +x "$script"
                echo -e "${GREEN}✓${NC} Fixed permissions: $(basename "$script")"
            fi
        done
    fi
else
    echo -e "${RED}✗${NC} Shared knowledge directory not found"
fi

# Check for version comparison tool
if [ -f ".github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh" ]; then
    echo -e "${GREEN}✓${NC} Version comparison tool available"
    chmod +x .github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh
else
    echo -e "${YELLOW}⚠${NC} Version comparison tool not found"
fi

echo
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo
echo "Next steps:"
echo "1. Review deployed files in .github/instructions/ and .github/prompts/"
echo "2. Test the pre-commit hook: git add . && git commit -m 'test'"
echo "3. Check for shared knowledge updates: .github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh"
echo "4. Customize deployed files as needed for your project"
echo
echo "Backup files created with timestamp suffix can be removed once you're satisfied with the setup."
echo
echo -e "${BLUE}📚 Documentation:${NC}"
echo "- Shared knowledge files: .github/shared-copilot-knowledge/ (scripts stay here)"
echo "- Project-specific files: .github/instructions/, .github/prompts/"
echo "- Version comparison: .github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh"

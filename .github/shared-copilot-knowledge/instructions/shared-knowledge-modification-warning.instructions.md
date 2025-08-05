---
description: "Warning about modifying distributed shared knowledge files."
applyTo: "**/.github/shared-copilot-knowledge/**"
---

# 🚨 WARNING: Do Not Modify Shared Knowledge Files

## Critical Notice

**DO NOT modify any files in `.github/shared-copilot-knowledge/`**

These files are automatically distributed from the central repository and any local modifications will be:
- **Overwritten** by the next distribution update
- **Cause merge conflicts** during git operations  
- **Break the synchronization** with the central knowledge base

## What These Files Are

- **Instructions**: Shared best practices and standards
- **Prompts**: Reusable workflow prompts for Copilot
- **Scripts**: Utility scripts like pre-commit hooks and comparison tools

## If You Need Changes

### For Project-Specific Customizations
Create files in your project's `.github/` directory instead:
- `.github/instructions/project-specific.instructions.md`
- `.github/prompts/custom-workflow.prompt.md`
- `.github/scripts/custom-tool.sh`

### For Shared Knowledge Improvements
Submit changes to the central repository:
1. Clone `maxengel/shared-copilot-knowledge`
2. Make changes to files in `shared-copilot-knowledge/`
3. Submit a pull request
4. Changes will be distributed to all projects automatically

## Recovery from Modifications

If you've accidentally modified shared knowledge files:

```bash
# Stash local changes
git stash

# Pull latest from your branch
git pull origin [your-branch]

# Review stashed changes
git stash show -p

# If changes are project-specific, move them to appropriate project directories
# If changes should be shared, submit them to the central repository
```

## Automatic Distribution

The shared knowledge system uses:
- **GitHub Actions** for automatic distribution
- **rsync with --delete** for perfect synchronization
- **Version tracking** for change management

This ensures all projects stay synchronized with the latest shared knowledge while maintaining their project-specific customizations.

---

*This warning is part of the shared knowledge distribution system.*

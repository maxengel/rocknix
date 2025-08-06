---
description: "Integration guidance for shared knowledge in repositories with existing pre-commit workflows."
applyTo: "**/.github/shared-copilot-knowledge/**"
version: "1.0.0"
---

# Shared Knowledge Integration with Existing Pre-commit Workflows

## Problem: Timestamp Hook Conflicts

When shared knowledge files are distributed to repositories with existing timestamp management hooks, conflicts can occur:

```
timestamp management.......................................................Failed
- hook id: update-timestamps
- exit code: 1
- files were modified by this hook

Fixed timestamp in .github/shared-copilot-knowledge/instructions/...
```

## Solution: Exclude Shared Knowledge Files

Shared knowledge files should be excluded from local timestamp processing since they are managed centrally.

### For Repositories with Timestamp Management

Add these exclusions to your timestamp management configuration:

```bash
# Exclude shared knowledge files (managed centrally)
.github/shared-copilot-knowledge/**
.github/shared-copilot-knowledge/instructions/*.instructions.md
.github/shared-copilot-knowledge/prompts/*.prompt.md
.github/shared-copilot-knowledge/scripts/*
```

### Common Exclusion Patterns

If your repository uses timestamp exclusion files (e.g., `.timestamp_exclusions`), add:

```
# Shared knowledge files (managed centrally)
.github/shared-copilot-knowledge/
```

### Pre-commit Hook Configuration

If using custom timestamp hooks, ensure they skip shared knowledge directories:

```bash
# In your timestamp update script
if [[ "$file" == *".github/shared-copilot-knowledge/"* ]]; then
    continue  # Skip shared knowledge files
fi
```

## Root Cause

Shared knowledge files are:
- **Centrally managed** with their own timestamp updates
- **Automatically distributed** via GitHub Actions
- **Version controlled** with semantic versioning

Local timestamp processing creates conflicts and should be avoided.

## Prevention

### For New Repositories

The setup script should detect existing timestamp management and add appropriate exclusions automatically.

### For Existing Repositories

After deploying shared knowledge, manually add exclusions to existing timestamp management systems.

## Implementation Status

**Current**: Manual exclusion required
**Planned**: Automatic detection and exclusion in setup script v1.3.0

---

*Created August 05, 2025 to address timestamp hook integration issues.*

*Last updated: August 05, 2025*

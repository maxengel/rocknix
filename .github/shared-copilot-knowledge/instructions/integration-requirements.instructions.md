---
description: "Critical requirements for integrating shared Copilot knowledge into new repositories."
applyTo: "**"
---

# Shared Knowledge Integration Requirements

## Critical Pre-commit Exclusions

**MANDATORY:** When integrating shared Copilot knowledge into any repository, you **MUST** exclude the shared knowledge directory from ALL pre-commit hooks to prevent processing conflicts.

### Required Exclude Pattern
Add this exclude pattern to every hook in `.pre-commit-config.yaml`:

```yaml
exclude: '^\.github/shared-copilot-knowledge/'
```

### Example Configuration
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
        exclude: '^\.github/shared-copilot-knowledge/'
      - id: end-of-file-fixer
        exclude: '^\.github/shared-copilot-knowledge/'
      - id: check-yaml
        exclude: '^\.github/shared-copilot-knowledge/'

  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.37.0
    hooks:
      - id: markdownlint
        exclude: '^\.github/shared-copilot-knowledge/'
```

### File Types That Must Be Excluded
- **All formatting hooks**: markdownlint, prettier, black, etc.
- **All linting hooks**: flake8, eslint, shellcheck, etc.
- **All timestamp hooks**: any custom timestamp management
- **All whitespace hooks**: trailing-whitespace, end-of-file-fixer
- **All file checking hooks**: check-yaml, check-json, etc.

## Integration Process

### Automated Setup
```bash
# Use the provided setup script
.github/shared-copilot-knowledge/scripts/setup-shared-copilot-knowledge.sh
```

### Manual Verification
After setup, verify integration:

1. **Check exclude patterns are applied:**
   ```bash
   grep -n "exclude.*shared-copilot-knowledge" .pre-commit-config.yaml
   ```

2. **Test pre-commit runs cleanly:**
   ```bash
   pre-commit run --all-files
   ```

3. **Verify no shared knowledge files are processed:**
   ```bash
   # Should show no matches in shared knowledge directory
   pre-commit run trailing-whitespace --files .github/shared-copilot-knowledge/instructions/*.md
   ```

## Troubleshooting

### Pre-commit Conflicts
If you see errors like "files were modified by this hook" for shared knowledge files:

1. **Add exclude patterns immediately:**
   ```yaml
   exclude: '^\.github/shared-copilot-knowledge/'
   ```

2. **Temporarily comment out problematic repository targets** in GitHub Actions

3. **Verify all hooks have exclude patterns applied**

### Repository-Specific Solutions
- **Hub repositories**: No exclusions needed (they control the shared knowledge)
- **Spoke repositories**: Must exclude shared knowledge from ALL hooks
- **Hybrid repositories**: Exclude shared knowledge, process project-specific files

## Machine-Readable Checklist

For automated agents integrating shared knowledge:

- [ ] ✅ Add `exclude: '^\.github/shared-copilot-knowledge/'` to ALL hooks
- [ ] ✅ Run setup script for initial deployment
- [ ] ✅ Test pre-commit configuration with `pre-commit run --all-files`
- [ ] ✅ Verify no shared knowledge files are modified by hooks
- [ ] ✅ Confirm backup and version checking scripts work
- [ ] ✅ Document any project-specific exclusions needed

## Error Prevention

### Common Mistakes
- ❌ Forgetting to exclude shared knowledge from timestamp hooks
- ❌ Not applying excludes to formatting hooks (markdownlint, prettier)
- ❌ Missing excludes on file checking hooks (check-yaml, etc.)
- ❌ Applying hooks to shared knowledge in CI/CD pipelines

### Best Practices
- ✅ Always use the exclude pattern on ALL hooks
- ✅ Test integration thoroughly before deploying
- ✅ Document any custom exclusions needed for project
- ✅ Use provided scripts for setup and version checking

---

*Critical integration requirement - failure to exclude shared knowledge from pre-commit hooks will cause processing conflicts.*

*Last updated: August 05, 2025*

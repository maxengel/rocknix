---
description: "Version tracking standards for shared knowledge components."
applyTo: "**"
version: "1.0.0"
last_updated: "2025-08-05"
---

# Version Tracking Standards

## Overview

All shared knowledge components (instructions, prompts, scripts) should include version tracking to enable change management and notification systems.

## Version Format

Use semantic versioning (SemVer) format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes that require user action
- **MINOR**: New features or significant improvements
- **PATCH**: Bug fixes and minor improvements

## Implementation by File Type

### Instruction Files (.instructions.md)

Add to YAML front matter:
```yaml
---
description: "File description"
applyTo: "**"
version: "1.0.0"
last_updated: "2025-08-05"
---
```

### Prompt Files (.prompt.md)

Add to YAML front matter:
```yaml
---
description: "Prompt description"
mode: agent
version: "1.0.0"
last_updated: "2025-08-05"
---
```

### Script Files (.sh)

Add as header comments:
```bash
#!/bin/bash
# Script Description
# Version: 1.0.0
# Last Updated: 2025-08-05
```

## Version Comparison Tools

### Universal Comparison
Run comprehensive comparison of all shared knowledge:
```bash
.github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh
```

### Prompt-Only Comparison
Run prompt-specific comparison:
```bash
.github/shared-copilot-knowledge/scripts/compare-prompt-versions.sh
```

## Change Management Workflow

### When Updating Shared Knowledge

1. **Increment version** according to change type:
   - Bug fix: `1.0.0` → `1.0.1`
   - New feature: `1.0.1` → `1.1.0`
   - Breaking change: `1.1.0` → `2.0.0`

2. **Update last_updated** date to current date

3. **Document changes** in commit message and relevant documentation

4. **Test changes** before distribution

### When Receiving Updates

1. **Run version comparison** to see available updates
2. **Review changes** using diff tools
3. **Backup current versions** before updating
4. **Deploy selectively** based on project needs
5. **Test functionality** after deployment

## Automation Integration

### GitHub Actions
- Version tracking enables automated change detection
- Commit messages include version information
- Distribution workflow tracks version changes

### Pre-commit Hooks
- Version comparison can be integrated into pre-commit workflows
- Automatic backup includes version metadata
- Local version tracking for audit trails

## Best Practices

### Version Increment Guidelines
- **Always increment** when making any changes
- **Use descriptive commit messages** that explain version changes
- **Tag releases** for major version changes
- **Maintain changelog** for significant updates

### Distribution Considerations
- **Test in development** before distributing to all repositories
- **Communicate breaking changes** clearly to users
- **Provide migration guides** for major version upgrades
- **Maintain backward compatibility** when possible

### Monitoring and Maintenance
- **Regularly audit** version consistency across repositories
- **Monitor adoption** of new versions
- **Deprecate old versions** with sufficient notice
- **Clean up** unused or obsolete components

## Related Tools

- `compare-shared-knowledge-versions.sh` - Universal version comparison
- `compare-prompt-versions.sh` - Prompt-specific comparison
- GitHub Actions workflows for automated distribution
- Pre-commit hooks for version tracking and backup

---

*Part of the shared knowledge version tracking system. Follow these standards for all shared knowledge components.*

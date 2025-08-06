---
description: "Step 1: Review shared knowledge and apply it to your project context."
mode: agent
version: "1.0.0"
---
# Step 1: Review and Apply Shared Knowledge

Review the shared knowledge provided by the central hub and apply it to your specific project context.

## Purpose
This prompt helps you understand and contextualize the shared knowledge that has been synthesized from across the ecosystem and apply it effectively to your project.

## Steps

1. **Review Shared Knowledge**: Examine `shared-copilot-knowledge/instructions/` for relevant guidance
2. **Assess Project Context**: Identify which shared practices apply to your project type, language, and frameworks
3. **Check for Updates**: Use version comparison to ensure you have the latest shared knowledge
4. **Identify Gaps**: Determine what project-specific instructions you need beyond shared knowledge

## Focus Areas
- **Language-specific practices**: Apply shared programming standards to your project languages
- **Framework patterns**: Adapt shared patterns to your specific frameworks
- **Tool integration**: Configure shared tool recommendations for your environment
- **Workflow optimization**: Implement shared workflow improvements in your context

## Next Step
When complete, run `step_2-customize-project-instructions` to create project-specific implementations.

## Commands to Get Started
```bash
# Check for shared knowledge updates
.github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh

# List available shared instructions
ls shared-copilot-knowledge/instructions/*.instructions.md

# Review current project instructions
ls .github/instructions/*.instructions.md
```

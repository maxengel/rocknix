---
description: "Step 2: Customize project instructions based on shared knowledge guidance."
mode: agent
---
# Step 2: Customize Project Instructions

Create or update project-specific instruction files based on shared knowledge guidance and your project's unique requirements.

## Purpose
Apply the shared knowledge from the central hub to your specific project context, creating customized instructions that benefit from ecosystem learnings while addressing your unique needs.

## Core Customization Tasks

### 1. Create Project-Specific Instructions
- Review shared knowledge patterns and adapt them for your project
- Create instruction files in `.github/instructions/` for project-specific guidance
- Reference shared knowledge files where appropriate
- Focus on project-specific implementations of shared patterns

### 2. Contextualize Shared Practices
- Adapt shared programming standards to your specific languages and frameworks
- Customize tool configurations based on shared recommendations
- Implement shared workflow patterns in your project's context
- Create project-specific examples using shared principles

### 3. Bridge Gaps Between Shared and Project-Specific
- Identify areas where shared knowledge needs project-specific implementation
- Create transition guides for applying shared patterns to your codebase
- Document project-specific exceptions or extensions to shared guidance
- Maintain clear relationships between shared and project instructions

## File Organization
- **Shared knowledge**: Reference `.github/shared-copilot-knowledge/instructions/` (read-only)
- **Project instructions**: Create/update `.github/instructions/` (your customizations)
- **Main config**: Update `.github/copilot-instructions.md` if needed

## Quality Guidelines
- **Reference, don't duplicate**: Link to shared knowledge rather than copying
- **Project-focused**: Keep instructions specific to your project's needs
- **Clear relationships**: Document how project instructions relate to shared knowledge
- **Maintainable**: Ensure instructions can evolve with both project and shared knowledge updates

## Commands to Help
```bash
# Compare your instructions with shared knowledge
.github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh

# List shared instruction topics for reference
ls .github/shared-copilot-knowledge/instructions/

# Review your current project instructions
ls .github/instructions/
```

## Success Criteria
- Project benefits from shared ecosystem knowledge
- Instructions are contextually relevant to your project
- Clear separation between shared and project-specific guidance
- Project can receive shared knowledge updates without conflicts
- **Modular**: Organize into focused, reusable instruction files
- **Cross-Referenced**: Link to related instruction files appropriately

## Completion
After completing these updates, the shared knowledge base should be improved and ready for use in distributed repositories. This completes the distributed workflow for maintaining and improving shared Copilot knowledge.

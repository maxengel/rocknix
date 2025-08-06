# Shared Copilot Knowledge Prompts (For Spoke Repositories)

This directory contains prompt files that are distributed to spoke repositories to help them apply shared knowledge from the central hub to their specific project context.

## Purpose

These prompts help spoke repositories:
- **Apply synthesized knowledge** from the central hub to their project
- **Customize shared practices** for their specific needs
- **Bridge shared and project-specific** instruction files
- **Benefit from ecosystem learnings** without direct access to raw backup data

## Workflow Overview

### Step 1: Review Shared Knowledge
**File**: `step_1-review-shared-knowledge.prompt.md`
- Review shared knowledge distributed from the central hub
- Assess relevance to your project context
- Identify areas for project-specific customization

### Step 2: Customize Project Instructions
**File**: `step_2-customize-project-instructions.prompt.md`
- Create project-specific instruction files based on shared guidance
- Adapt shared patterns to your project's languages and frameworks
- Bridge gaps between shared knowledge and project needs

## Key Principles

- **No backup analysis**: Spokes work with synthesized knowledge, not raw backup data
- **Reference, don't duplicate**: Link to shared knowledge rather than copying it
- **Project-focused**: Customize shared practices for your specific context
- **Maintainable**: Ensure your customizations can evolve with shared knowledge updates

## Hub vs Spoke Responsibilities

- **Hub**: Analyzes all backup data, synthesizes patterns, distributes knowledge
- **Spoke** (this context): Applies synthesized knowledge to project-specific needs

## Usage

Run these prompts to apply shared knowledge to your project:

1. **Review First**: Use Step 1 to understand available shared knowledge
2. **Customize Second**: Run Step 2 to create project-specific implementations
3. **Maintain Regularly**: Re-run when shared knowledge updates are available

## Files Created

- **Project Instructions**: `.github/instructions/*.instructions.md` (your customizations)
- **Updated Config**: `.github/copilot-instructions.md` (if project-specific changes needed)

## Version Management

Use the version comparison script to stay current:
```bash
.github/shared-copilot-knowledge/scripts/compare-shared-knowledge-versions.sh
```

These prompts work with:
- **Backup System**: SSH hooks and GitHub Actions that collect instruction files
- **Distribution System**: GitHub Actions workflow that pushes updates to target repositories
- **Version Control**: Tracked changes and timestamps for all updates

---

*Last updated: August 5, 2025*

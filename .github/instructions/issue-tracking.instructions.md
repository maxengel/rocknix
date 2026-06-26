---
description: "Where to file issues / tracking lists for this working copy."
applyTo: "**"
---

# Issue tracking

Track all issues, punch lists, and TODO tracking on the **fork**, never on the upstream
project:

- **File issues on `maxengel/rocknix`** (the fork). Issues are enabled there.
- **Do not file on `ROCKNIX/distribution`** (upstream). Upstream has Issues disabled, and
  tracking work belongs on the fork regardless.
- With `gh`, always pass `--repo maxengel/rocknix` explicitly — the repo's `gh` default is
  the upstream remote, so omitting it would target the wrong place.
- If issues are ever unavailable, fall back to a gitignored Markdown checklist in the
  working copy rather than filing upstream.

Example:

```bash
gh issue create --repo maxengel/rocknix --title "..." --body-file notes.md
```

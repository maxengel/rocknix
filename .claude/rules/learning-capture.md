---
description: "Capture-learning loop: when storing a memory, also consider an instruction-file abstraction and append to the dated work log."
paths:
  - "**"
---

# Learning capture

**What "memory" means here:** a *memory* is the agent's own persistent store — for Claude
Code, a file under `~/.claude/projects/<project>/memory/` indexed by `MEMORY.md` and
surfaced at session start. It lives **outside the repo** and is per-machine and per-agent,
so it is not a durable project record and nobody else will ever read it. The repo's durable
records are the **rules** in `.claude/rules/` (for generalizable practices) and the **dated
work logs** (below). There is intentionally **no separate "memories" file** in the repo.

A memory alone is therefore never enough. Whenever a learning is worth remembering, also do
**both** of the following:

## 1. Abstract into a generalized instruction file (if applicable)

Ask whether the learning generalizes beyond the immediate task into a reusable development
practice. If so, add or update a focused file under `.claude/rules/*.md`
(with `description` + `paths:` front matter). Only do this for genuinely generalizable
practices — skip one-off, task-specific facts.

## 2. Log it in the dated work log

Append a timestamped entry to the day's work log:

- Path: `docs/work-logs/<yyyy_mm>-work_logs/<yyyy_mm_dd>-work_log.md`
  (e.g. `docs/work-logs/2026_06-work_logs/2026_06_27-work_log.md`).
- Create the month directory and/or day file if they don't exist.
- A day file holds **multiple** entries; head each with a timestamp
  (e.g. `## 19:04 UTC — <title>`). **Append, don't overwrite.**
- Keep entries concise: what was learned/decided, why, and any follow-ups (issue links).

## Notes

- These work logs and the personal instruction files are **personal artifacts** — they live on
  the fork's `next` branch and are kept out of upstream PRs (see `fork-workflow.md`;
  the whole `docs/` directory is in the pre-push guard's personal paths).

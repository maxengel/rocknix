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
- Then `tools/work-log-index --write`. `docs/work-logs/INDEX.md` is the
  day/week/month table of contents over the day files -- the view the
  maintainer asked for on 2026-09-23 (*"so we know what's happened a day, a
  week, a month"*) -- and the push guard warns when a log changes without it.
  `tools/archaeology` reads the entries themselves, so the log is only as
  findable as its headings are specific: a heading names the issue and the
  thing decided, not "progress".

## 3. Make it executable, if it was a procedure

A learning that is a *procedure* — a boot recipe, a fixture, a sequence of
keys, a wait loop, a check — goes into a tool, a flag, or a step file, not
only into prose. Prose has to be found and read at the right moment; a flag
cannot be skipped by not reading it. The VM cycle of 2026-09-06 turned five
such learnings into `generic-x64-vm --headless`, `tools/vm-serial`,
`cloud-test-backend seed-content`/`seed-device`, and `tools/vm-walks/`; the
ritual is `generic-x64-vm-testing.md` § "After every VM cycle", and the
per-cycle ledger is `docs/vm-qa-log.md`.

## 4. Leave a stash a new agent can resume from (D-WORKFLOW-133)

Maintainer, 2026-10-02: *"I'd like us, after you've caught up with this, to
stash our work and create the stash files so that an agent who has not seen
this project before can get up to speed and resume work. I want us to go
through the exercise of being detailed and walking a new agent through what
they need in order to pick up where you currently are, and make sure we have
all of the armatures in place to support that."*

- **One canonical stash, on `next`:** `.github/sessions/saved-session-state-next.md`,
  written with the `session-stash` skill, the previous copy archived under
  `.github/sessions/archived/`. A working branch's own
  `saved-session-state-<branch>.md` is a pointer to it, so a session started
  anywhere reaches the same file, and `CLAUDE.md` and `AGENTS.md` name it near
  their tops. Until 2026-10-02 the copy on `next` was from July.
- **Written for a stranger.** It opens with *Start here*: what the project is,
  what to read and in what order, the rules that bind, the machine's paths,
  where the credentials live (never their values). Then the skill's sections:
  each item in flight with its issue, branch and worktree; each running
  process with its pid and status file; the next commands; what waits on the
  maintainer.
- **Proven, not assumed.** An agent with no context is given only the
  repository and asked to resume. Its briefing is compared with the truth, and
  each place it went wrong is fixed in the stash, a rule or a tool, then
  tested again (#368).
- **Check the rules you loaded.** A session loads the rules of the worktree it
  starts in: `git diff --quiet next -- .claude CLAUDE.md AGENTS.md || echo STALE`,
  and a stale feature worktree reads the rules from `next` before trusting
  them. Integrate by the recorded worktree strategy; do not merge unrelated
  historical feature commits merely to update rules. On
  2026-10-02 the session's own worktree had 17 of 29 rules stale (#367).

## Notes

- These work logs and the personal instruction files are **personal artifacts** — they live on
  the fork's `next` branch and are kept out of upstream PRs (see `fork-workflow.md`;
  the whole `docs/` directory is in the pre-push guard's personal paths).

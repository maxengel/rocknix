# Saved Session State

> **Saved**: 2026-09-13T05:55:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`; ES upstream branch is `master`)

## Current Focus

Epic #11 (cloud saves), milestone 3 "Stable before upstream". Today (2026-09-13, UTC night): #45 VM half, #142 (closed), #93, #47, #27, #149 (closed), #129 (closed), #50 delivered (router/LAN boxes open), #82 VM half, #113 VM half, #66/#67/#68/#69 VM boxes all ticked. Decisions D-CLOUD-008, D-CLOUD-123, D-NET-002/003, D-UI-050/051, D-WORKFLOW-010/013/014, D-QA-016 written; register 232 IDs, `tools/register-check` clean; blindspots 40, 41.

## In Progress (running in the background right now)

- **Milestone-tier code audit** of everything since #129 (rocknix `next` 53f390b1e9..59103cd9cb; ES 52012829c..3466b36af), one orchestrator subagent pinned to **Fable 5.1 at xhigh** (the maintainer's requirement: never Opus for this), writing `docs/audits/2026_09_13-milestone-stable-before-upstream/` and creating the punch-list issue ("Code audit of the milestone work since #129", label cloud-saves). An earlier Opus-pinned launch was stopped in Phase 2 and its folder deleted before this one started.
- **Two second opinions through the council Facilitator** (spend approved by the maintainer): Claude seat `anthropic/claude-fable-5.1` at xhigh and GPT seat `openai/gpt-6-astra` at max, over the self-contained brief `scratchpad/audit-brief-gpt-6-astra.md` (method + rules + decisions + criteria + full diffs, ~55k tokens, checked to carry no credential values). Outputs: `scratchpad/second-opinions/{claude-fable-5.1,gpt-6-astra}-audit.md` + provenance. The audit orchestrator waits for them before Phase 4 and reconciles them into 04-analysis.md ("Second opinions") and the punch list. Existing `OPENROUTER_API_KEY` in `~/.config/council/env` reaches both; no new key.
- **Runner for x64 `519f40aa0c`** (`scratchpad/vm-qa-519f40aa0c.log`): scripts, lifetime, vocabulary, pair-identity, round-trip, exit, time-to-play PASS; walks in progress. Its H700 twin **BUILD OK** (BUILD_ID `59103cd9cb`, the docs commit the devices worktree synced to), copied to `/workspace/artifacts/rocknix-images/h700-all-20260913-59103cd9cb/` (checksums to finish). When walks passes: vm-qa-log row for 519f40aa0c, then it is the staging candidate. Previous candidates kept: H700 `3ecef54574` (= x64 947072a988, eight suites PASS), `a8b2feafcc`, `1de2e1179d`, `db6b42c180`.
- Guests a (:10022), b (:10023), d (:10026, 640x480, disk `/workspace/tmp/rocknix-vm-d/vm-d.qcow2`) up; credentials cleared from a and b (`tools/qa-accounts 1002x clear`).

## Next Steps

1. Read the audit's return and the seats' findings; fix the high findings in this session (a failure you find is yours to fix); Phase 7 is the maintainer's gate.
2. Staging on the RG SP and the RG35XX SP (per-device yes, D-QA-015), then the device halves: #45, #50 (two names on the router, `.local` from a laptop), #82, #113 (Dropbox), #121, the H700 boxes of #66/#67/#68/#69; #69's upstream theme PR needs the maintainer's yes; #131 accounts half.
3. French for the fork strings beyond the 14 (D-UI-051 follow-up); #42 (rocknix.org page) last before any upstream PR (D-WORKFLOW-014); PRs to `ROCKNIX/distribution:next`, `es` prefix for EmulationStation.

## Standing rules that bind this work

- Nothing runs on a person's device or cloud without a per-action yes; QA guests a/b/d may be rebooted freely; guest/device reads filtered `grep -v -i -E 'key|pass|token|user|psk'`.
- Credentials live only in `~/.ROCKNIX/qa-accounts` (0600) and reach guests only via `tools/qa-accounts` (prints names only); ScreenScraper developer pair is the public `jelos`/`jelos`; never print values or ask for them in chat.
- Every out-of-band request becomes a fork issue quoting the maintainer (D-QA-012); issues only on `maxengel/rocknix`.
- Never `cd` into the primary checkout (`git -C`); commits `-c user.name="Max Engel" -c user.email="max@awecelot.com"` ending with the Co-Authored-By and Claude-Session lines; docs on `next` in the primary; register append-only (clerical re-key exception D-WORKFLOW-013).
- x64 build: both Docker mounts (`.git` and `/workspace/cache/rocknix-sources`) and `rm -f build.ROCKNIX-GENERIC_X64.x86_64/.stamps/image/build_target` first; H700 via `devices/build-dev.sh H700` after `tools/fork-worktree sync` (never during a build). Long runs `setsid nohup ... & disown`, polled from the foreground; watchers anchor on the interpreter, never the command's literal. One image conversion at a time on `/tmp` (31 GB tmpfs); guest d's disk lives in `/workspace/tmp` because `vm-pair up` wipes `vm-*` in its own dir.
- Subagent briefs say "wait with synchronous sleep/poll loops, return only when done"; **audit/review subagents run on Fable 5.1 (`model: "fable"`), never Opus**; adversarial or second-opinion work goes through the council Facilitator (`tools/council/run invoke`), never a direct provider call.
- Fork-only tools go in `PERSONAL_PATTERNS` (`.githooks/pre-push`) and `fork-workflow.md`'s list (`register-check`, `qa-accounts` added today).

## Key Files Touched Today

- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool` (prune + `-X` restore skip); `packages/network/rclone/sources/{cloud_content_restore,cloud_setup,cloud_content_backup}` (absent_not_broken, mkdir-first); `packages/sysutils/systemd/scripts/network-base-setup` + `system.d/network-base.service`; `packages/network/avahi/{package.mk,system.d/avahi-daemon.service}`; `projects/ROCKNIX/packages/ui/emulationstation/package.mk` (pin `3466b36af7`).
- `tools/{last-good-scripts-test,vm-qa,cloud-round-trip,register-check,qa-accounts}`, `.githooks/pre-push`.
- ES: `es-app/src/guis/GuiSaveState.{cpp,h}`, `es-core/src/components/GridTileComponent.{cpp,h}`, `es-app/src/guis/GuiMenu.cpp`, `es-app/src/scrapers/ScreenScraper.cpp`, `locale/lang/fr/LC_MESSAGES/emulationstation2.po`, `CLAUDE.md`, `.githooks/pre-push`.
- Docs: decision/blindspot registers, `docs/vm-qa-log.md`, `docs/qa-frames/2026-09-13/`, `docs/work-logs/2026_09-work_logs/2026_09_13-work_log.md`; rules `es-code-traps.md`, `generic-x64-vm-testing.md`, `es-player-text.md`, `decision-register.md`, `fork-workflow.md`.

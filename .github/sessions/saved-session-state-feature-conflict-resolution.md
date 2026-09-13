# Saved Session State

> **Saved**: 2026-09-13T16:05:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`; ES upstream branch is `master`)

## Current Focus

Epic #11 (cloud saves), milestone 3 "Stable before upstream". Today (2026-09-13, UTC night): #45 VM half, #142 (closed), #93, #47, #27, #149 (closed), #129 (closed), #50 delivered (router/LAN boxes open), #82 VM half, #113 VM half, #66/#67/#68/#69 VM boxes all ticked. Decisions D-CLOUD-008, D-CLOUD-123, D-NET-002/003, D-UI-050/051, D-WORKFLOW-010/013/014, D-QA-016 written; register 232 IDs, `tools/register-check` clean; blindspots 40, 41.

## In Progress (running in the background right now)

- **Proofs agent on guest d (Fable)** for image `4d7eb1f303` (ES `44bcc4d51d`): #154 delete-and-reboot, #153 LINK5 on throttled S3 at 40 s and 120 s plus one WebDAV cell (then s3 back unthrottled), #169 archive without the planted token (QA RA account via `tools/qa-accounts 10026 ra`, cleared after), #160 frames at Extra Large EN/FR. It ticks the observed boxes itself. When it returns: **warm SM8550 rebuild** from the tested `next` (`git -C devices merge --ff-only next` by hand, then `devices/build-dev.sh SM8550`; no runner during it) -> artifacts `sm8550-20260913-<id>/`; the Nova takes it in place when reachable (Tailscale coming). H700 rebuild from the same `next` for the handhelds' next round (per-device yes).
- **`4d7eb1f303` runner: nine suites PASS on an idle host**, timings 0.87 / 1.42 / 1.51 s (the 1e5a2818e8 row's doubled numbers were the SM8550 build's load). Rows for 1e5a2818e8 and 4d7eb1f303 in `docs/vm-qa-log.md`.
- **Landed today after the audit:** #157 card (D-UI-052 option 1; 21 frames; boxes 1-2; box 3 needs a 1280x800 French frame on the new image, box 5 the H700 boot), #160 (measured header; frames pending at Extra Large), #153 (D-CLOUD-126/127 stall ceiling; `Completed.` line), #154 (D-NET-009), #169 (eight token files held back or blanked; scanner names `Token =`), #155 done, #164 phase-1 note (`docs/ra-offline/2026_09_13-phase-1-design-note.md`; D-RA-002 proposals on the issue). SM8550 `6e1de9e09f` built cold (3 h 38 min), artifacts kept, predates all of the above.
- **Open for the maintainer:** D-RA-002 (hardcore stance, token cache, RetroArch alone or with PPSSPP) on #164; #151 Phase 7 close; #47 look; #161 journal when a device is reachable over Tailscale; the device round on the H700s and the Nova.
- **Issues filed today from the maintainer's notes:** #155 #156 #157 #158 #159 #160 #161 #162 #163 (+#164-#168 phases) #169 #170 #171 (CI on the VMs + tui-test, D-QA-024). Milestone 4 "Offline RetroAchievements"; worktree `ra-offline`.
- Guests a/b on `4d7eb1f303` (runner), d on `4d7eb1f303` (proofs). S3 endpoint may be throttled while the proofs run; the agent restores it.
## Next Steps

1. Proofs return -> tick/close; SM8550 warm rebuild -> artifacts; H700 rebuild from the same next; then the device round over Tailscale (each action a question); #157 box 3 French 1280x800 frame; #151 close is the maintainer's.
2. #150 / D-QA-023: `tools/fork-worktree sync` (no build running), `devices/build-dev.sh H700` from the `next` that carries the fixes; artifacts under `h700-all-<date>-<BUILD_ID>/`; then `build-dev.sh SM8550` (cold, hours) sequentially after it; the Nova row is in device-builds.md.
3. Staging on the RG SP and the RG35XX SP (per-device yes, D-QA-015), then the device halves: #45, #50 (two names on the router, `.local` from a laptop), #82, #113 (Dropbox), #121, the H700 boxes of #66/#67/#68/#69, PL-04's two fresh flashes; #69's upstream theme PR needs the maintainer's yes; #131 accounts half; SM8550 on the Pocket Nova only after that round.
4. #152 French follow-up; #42 (rocknix.org page) last before any upstream PR (D-WORKFLOW-014); PRs to `ROCKNIX/distribution:next`, `es` prefix for EmulationStation.
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

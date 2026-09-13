# Saved Session State

> **Saved**: 2026-09-13T14:50:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`; ES upstream branch is `master`)

## Current Focus

Epic #11 (cloud saves), milestone 3 "Stable before upstream". Today (2026-09-13, UTC night): #45 VM half, #142 (closed), #93, #47, #27, #149 (closed), #129 (closed), #50 delivered (router/LAN boxes open), #82 VM half, #113 VM half, #66/#67/#68/#69 VM boxes all ticked. Decisions D-CLOUD-008, D-CLOUD-123, D-NET-002/003, D-UI-050/051, D-WORKFLOW-010/013/014, D-QA-016 written; register 232 IDs, `tools/register-check` clean; blindspots 40, 41.

## In Progress (running in the background right now)

- **Streams (all Fable 5.1):** #153/#154 script fixes in `sync-bounds` (D-CLOUD-126: deliberate path's timeout ceiling + summary-line wording; D-NET-009: empty `system.hostname=` on delete); #157 sync-card frames on guest d then guest a (image `1e5a2818e8`, ES `3a121f0152` -- phase-aware bar landed, pin `1e5a2818e8`); #160 fix in the ES worktree (`GuiGameAchievements::render` bar by measurement, French for the page); #164 phase-1 design note in `/workspace/repos/rocknix.worktrees/ra-offline` (`feature/ra-offline`). When they land: pin bump(s), one x64 build, runner, frames, then the device round -- and #153's LINK5 on throttled s3 + #154's delete-and-reboot on a guest.
- **Runner on `1e5a2818e8`**: eight suites PASS, walks in flight (`scratchpad/vm-qa-1e5a2818e8.log`). **SM8550 cold build** from `6e1de9e09f` at fex-emu (seq 703/727; `scratchpad/build-sm8550-6e1de9e09f.log`); when OK: artifacts to `sm8550-20260913-6e1de9e09f/`; it predates #157/#160 -- propose a warm rebuild before the Nova is staged (in place through `/storage/.update`; the Nova runs a fresh ROCKNIX). NEVER run `tools/fork-worktree sync` while it builds; fast-forward `generic-x64` by hand (`git -C <wt> merge --ff-only next`); check running builds with `pgrep -f 'make docker-[A-Z]'`, not `docker ps | grep rocknix-build` (containers have random names).
- **Milestone 4 "Offline RetroAchievements"** (D-RA-001 settled; D-RA-002 open: hardcore stance, token cache vs D-INFRA-010, RetroArch alone or with PPSSPP): epic #163 with phases #164-#168; #162 (lost award, `!RA!` badge) on it too. Worktree `ra-offline` on `feature/ra-offline`. Runs in parallel with conflict resolution.
- **H700 `0b1a1d4db0`** on both handhelds (verified). Maintainer travelling; devices off the LAN; Tailscale access coming -- then #161 (Wi-Fi drop: association vs path) from the journal, and the device round: #45, #50 LAN boxes, #82, #113 Dropbox, #121, #66-#69 H700 boxes, PL-04 flashes, #160 look, #157 card.
- Other issues filed today from the maintainer's notes: #155 (done), #156 (shim), #157 (D-UI-052, option 1 built), #158 (captive portals, D-NET-007), #159 (remember/forget Wi-Fi, D-NET-008), #160, #161, #162, #163; #151 awaits the maintainer's Phase 7 close; #47 awaits their look.
- Guests a/b on `1e5a2818e8` (runner), d on `1e5a2818e8` (frames agent may leave its QA remote + fixtures).
## Next Steps

1. Land the four streams; one x64 image with #157/#160/#153/#154; runner; frames; SM8550 artifacts + warm rebuild proposal; then the Nova and the H700 device round over Tailscale (each action a question).
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

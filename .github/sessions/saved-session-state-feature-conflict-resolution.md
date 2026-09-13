# Saved Session State

> **Saved**: 2026-09-13T17:10:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`; ES upstream branch is `master`)

## Current Focus

Epic #11 (cloud saves), milestone 3 "Stable before upstream". Today (2026-09-13, UTC night): #45 VM half, #142 (closed), #93, #47, #27, #149 (closed), #129 (closed), #50 delivered (router/LAN boxes open), #82 VM half, #113 VM half, #66/#67/#68/#69 VM boxes all ticked. Decisions D-CLOUD-008, D-CLOUD-123, D-NET-002/003, D-UI-050/051, D-WORKFLOW-010/013/014, D-QA-016 written; register 232 IDs, `tools/register-check` clean; blindspots 40, 41.

## In Progress (running in the background right now)

- **#153 stream (Fable), resumed after it returned early with its suites in the background:** defect 1 (the outcome sentence glued to rclone's killed progress line -- a newline after the stall kill) and defect 2 (WebDAV re-run hits the stall ceiling on the slirp stale-PUT artifact -- harness tolerance or a bounded retry, recorded as D-CLOUD-128). Lands on `next` from `feature/sync-bounds`. THEN: x64 build (pin `582404e0bf` already carries ES `b6eb26980a` = #160 second half: MenuComponent aligns the RA headers left under full-screen menus, beside/below decided from the drawn alignment) via `git -C generic-x64 merge --ff-only next` + `scratchpad/build-x64.sh` (edit the ID line; rm the image stamp) -> runner `tools/vm-qa <img>` -> proofs agent on d (LINK5 s3 throttled x2 + WebDAV cell; #160 frames DEFAULT + Extra Large + the summary page; #169 restore half on b after the runner) -> SM8550 warm rebuild (`git -C devices merge --ff-only next`; `build-dev.sh SM8550`; artifacts `sm8550-20260913-<id>/`) -> H700 rebuild the same way -> staging over Tailscale when the maintainer says the devices are reachable (per-device yes).
- Proofs on d for `4d7eb1f303` done: #154 proven (3 boxes), #169 guest half (boxes 1,2,4; restore half owed), #153 bounds held but two defects (above), #160 Extra Large right, DEFAULT overlapped (fixed in `b6eb26980a`, to frame). `4d7eb1f303` runner: nine PASS on an idle host (0.87/1.42/1.51 s).
- SM8550 `6e1de9e09f` cold build done and copied (predates today's fixes). Both H700 handhelds on `0b1a1d4db0`.
- **Maintainer's calls today:** D-WORKFLOW-018 three drops (cloud sync -> offline RA -> conflict resolution); D-RA-001/002 (milestone 4, system-wide toggle, hardcore off with a sentence, per-core parked #172, contribute back); D-QA-024 (CI on the VMs, #171; tui-test to evaluate); D-UI-052 (#157 option 1, built); D-CLOUD-126/127, D-NET-009 built; D-NET-007/008 future (#158/#159). Open for them: #151 Phase 7 close, #47 look, #161 journal over Tailscale, D-RA-002 boxes on #164 (settled -- tick when phase 2 reflects it).
- Guests a/b on `4d7eb1f303`, d on `4d7eb1f303` clean (S3 unthrottled; WebDAV throttled as the runner expects).
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

# Saved Session State

> **Saved**: 2026-09-13T11:50:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`; ES upstream branch is `master`)

## Current Focus

Epic #11 (cloud saves), milestone 3 "Stable before upstream". Today (2026-09-13, UTC night): #45 VM half, #142 (closed), #93, #47, #27, #149 (closed), #129 (closed), #50 delivered (router/LAN boxes open), #82 VM half, #113 VM half, #66/#67/#68/#69 VM boxes all ticked. Decisions D-CLOUD-008, D-CLOUD-123, D-NET-002/003, D-UI-050/051, D-WORKFLOW-010/013/014, D-QA-016 written; register 232 IDs, `tools/register-check` clean; blindspots 40, 41.

## In Progress (running in the background right now)

- **SM8550 cold build** for the Retroid Pocket Nova, `devices/build-dev.sh SM8550` from `6e1de9e09f`, started 11:37 UTC (`scratchpad/build-sm8550-6e1de9e09f.log`; hours; ~90 GB). When OK: artifacts to `/workspace/artifacts/rocknix-images/sm8550-20260913-<BUILD_ID>/` with checksums; the Nova is staged only with the maintainer's yes and only after they say whether it already runs ROCKNIX (in-place `.update` tar) or needs a first install (a different procedure -- read upstream's SM8550 documentation first); `device-builds.md` has the Nova row; #150 carries the criteria.
- **H700 `0b1a1d4db0` is on both handhelds** (D-WORKFLOW-017; each reboot asked and given): RG35XX SP (`rg35xxsp`, 192.168.1.81; off the network since ~11:35 UTC) and RG SP (`rgsp`, now 192.168.1.177 -- ssh config still says .175, use `-o Hostname=192.168.1.177`) verified per the runbook: BUILD_ID, model, DRAM voltage (1.10 V / 1.20 V), empty queue, mounts, new ES strings, avahi ordered, typed names kept, boot logs on #150. Artifacts `h700-all-20260913-0b1a1d4db0/`.
- **#151**: 16 Resolved; PL-07/PL-17 Resolved in code, Deferred to #156 for frames (D-WORKFLOW-017); Phase 7 table + lint done; the close is the maintainer's. #155 done. Side issues #153, #154, #156, #152 open for the maintainer.
- Next device round (each action a question, D-QA-015): the device halves of #45 (archive size + ini round trip on hardware), #50 (two names on the router, `.local` from a laptop), #82, #113 (Dropbox), #121, the H700 boxes of #66/#67/#68/#69, PL-04's two fresh flashes (#150 criterion), #69's upstream theme PR (maintainer's yes), #131 accounts half.
- Guests a/b/d on `0f4e4829a8`, clean. Staging script `scratchpad/stage-h700.sh <host>` (HOSTOPT env for an address override) does the runbook's upload-verify-move.
## Next Steps

1. SM8550 build result -> artifacts; ask the maintainer how the Nova takes an image; the device round above on the two H700 handhelds; the maintainer closes #151 (Phase 7) and looks at #47.
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

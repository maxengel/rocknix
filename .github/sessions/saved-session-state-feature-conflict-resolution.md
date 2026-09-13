# Saved Session State

> **Saved**: 2026-09-13T08:55:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`; ES upstream branch is `master`)

## Current Focus

Epic #11 (cloud saves), milestone 3 "Stable before upstream". Today (2026-09-13, UTC night): #45 VM half, #142 (closed), #93, #47, #27, #149 (closed), #129 (closed), #50 delivered (router/LAN boxes open), #82 VM half, #113 VM half, #66/#67/#68/#69 VM boxes all ticked. Decisions D-CLOUD-008, D-CLOUD-123, D-NET-002/003, D-UI-050/051, D-WORKFLOW-010/013/014, D-QA-016 written; register 232 IDs, `tools/register-check` clean; blindspots 40, 41.

## In Progress (running in the background right now)

- **#151 punch list, VM-complete except two halves.** Ticked with evidence: PL-01..06, 08..16, 18 and the register-rows box. x64 `d32f47a947` (ES `51edcf728c`) passed all nine runner suites (`qa-d32f47a947-webdav-a-20260913-0743`; vm-qa-log row `295e2854e0`); pair proofs done (20/20 boots publish the right mDNS name; cross-unit restore renames; legacy zip leaves PPSSPP assets); frames on guest d (`4aab4cc817`). Not ticked: PL-07 (offline half framed; the probe-unknown sentence cannot be reached on the VM: every IO failure hits the `REQ_IO_ERROR` guard first, and the HTTPS API needs a TLS shim -- #156) and PL-17 (helpSize equal at 640x480; 1280x800 measurement running on guest a; the fourteen status frames need #156). Phase 7 table in `05-punch-list.md` still says Deferred for every row -- rewrite to Resolved with commits/frames, PL-07/PL-17 Deferred to #156 for their frame halves, then `tools/lint-audit-artifacts <folder> --issue 151`.
- **#155 (found by the frames): NETWORK SETTINGS > FINISH RESTORE PROCESS row is three lines at 640x480; eight restore-page strings have no French.** ES fix agent (Fable) running in `~/Development/emulationstation-next.worktrees/qa-integration`; then: pin bump in `projects/ROCKNIX/packages/ui/emulationstation/package.mk`, `tools/fork-worktree sync`, x64 build (`scratchpad/build-x64.sh`, edit the ID line; `rm -f .stamps/image/build_target` first), full runner (`tools/vm-qa <img>`), rebuild guest d (`scratchpad/rebuild-d.sh`) and frame the row + the French page, tick #155.
- **D-WORKFLOW-016 (maintainer): no device build until every punch-list item is complete and VM-tested.** An H700 build started early from `96284d5544` was killed at 540/663; `systemd` cleared from `build.ROCKNIX-H700.aarch64`; `.H700-*` markers removed. Then per #150/D-QA-023: H700 first (`devices/build-dev.sh H700` after `tools/fork-worktree sync`), artifacts to `h700-all-<date>-<BUILD_ID>/`, SM8550 only after H700 finishes.
- Side findings filed, not blocking unless the maintainer says so: #153 (S3 deliberate backup unbounded on link loss; three options), #154 (`set_setting system.hostname default` vs `chksysconfig`'s sentinel), #156 (HTTPS shim for the scraper status frames). #152 French follow-up; #47 reopened then boxes 2-5 ticked (closes with the maintainer's look); #66 box 3 reworded and ticked.
- Guests: a/b on d32f47a947 (b carries a's other settings from the PL-02 restore; a holds its archive + a PRE_RESTORE snapshot); d on d32f47a947 at 640x480, clean, `en_US`.
## Next Steps

1. Finish #151: Phase 7 outcomes table + lint; #155 fixed, built, run, framed; the maintainer decides on the two #156 halves (amend or wait) and closes #151 (Phase 7 is theirs).
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

# Saved Session State

> **Saved**: 2026-09-14T19:05:00Z
> **Branch**: `feature/conflict-resolution` (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the work itself lands on `next`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution) + EmulationStation at `~/Development/emulationstation-next` (build branch `test/qa-integration`, worktree `~/Development/emulationstation-next.worktrees/qa-integration`)

## Current Focus

Epic #11, milestones "Stable before upstream" and "Offline RetroAchievements". The release candidates of 2026-09-14: RC-5 `b3189ba85f` on the RG SP; RC-6 `768a0a9f48` VM-proven but for the startup index; **RC-7 `3387cf5da0`** (ES `9842a0083` = RC-6 + `fix/startup-index` for #183) built at 18:50 UTC and being proven on the VM; its H700 build started 18:54 UTC.

## In Progress
- **RC-6 `768a0a9f48`** (ES `ae9c7d56b` = `feature/round-notes-rc5` merged): nine suites PASS (`qa-768a0a9f48-webdav-a-20260914-1655`); on guest d: fully-offline 0 FAIL, #179 parts 1+2 0 FAIL, the page frames EN/FR, PL-07, PL-27 (shim), PL-24, PL-09/26 (fail-fast half), #180 box 3; on e: #174 PASS (one press). Frames + README in `docs/qa-frames/2026-09-14/` (`*768a0a9f48*`); QA log row; work log 19:05 UTC; rule `generic-x64-vm-testing.md` (essway/profile.d, pgrep -c, settle dead band, blocked-thread press); D-RA-018; docs commit `15d4bfe442` on `next`. Issues: #186 PL-07/24/26/27 ticked (27/33), #184 boxes 1/2/3a/4/5a/6 + merge, #180 box 3, #183 box 2, #179 box 2. H700 RC-6 tar filed at `h700-all-20260914-768a0a9f48` -- NOT staged (superseded).
- **#183's cause:** `SystemData::loadConfig` started the startup indexes only with the splash screen's window; `main` passes it only for the splash; ROCKNIX runs `--no-splash` -> INDEX NEW GAMES AT STARTUP never ran on any ROCKNIX device. Fix ES `fix/startup-index` `cce9ab12a` (startIndexesAtStart from main when no splash; again at link-up until the hash library came; WARNING when it did not; daily stamp only when it did) merged `9842a0083`; pin bump `3387cf5da0` (RC-7).
- **RC-7 `3387cf5da0` running:** vm-qa on the pair (`vm-qa-3387cf5da0.log`); `rc7-run.sh` -> `rc6-proofs.sh 3387cf5da0 <img> rebuild fully check1 walk index indexes` on guest d (`rc7/run-1-3387cf5da0.log`): rebuild PASS, fully 0 FAIL; check1/walk/index/indexes pending. Then `rc6-pl09.sh` (100 cached games, summary timing), phases `181`, `upgrade` (RC-5 image -> RC-7 tar). H700 RC-7: `h700/build-h700-3387cf5da0.log`.
- **Harness for RC-7 phases:** `check1` installs pads (16), the (useless) emustation drop-in, LogLevel debug; the shim now goes via `/storage/.config/profile.d/099-qa-shim` (installed by hand on the RC-6 guest; RC-7's d is fresh -- pl27 not needed again). `index` phase: `systemctl stop essway`, strips Tobu's id from the gbc gamelist, plants `recovery/gbc/Tobu Tobu Girl Deluxe.xml` (hash, no id, parentHash=size), copies Ninoid, reboots online -> expects hasher lines, `topup indexed pass: cached=1 indexed=1`, ids 4902 15738 31199, the PL-08 line, then `game-options.steps` frame (VIEW THIS GAME'S ACHIEVEMENTS for Tobu).
- **RG SP is on RC-5 `b3189ba85f`.** RC-7's H700 tar goes to it only on the maintainer's word (D-QA-011/015; ask before staging, reboot as a question via `tools/device-act`).
- Guests: a/b pair on `3387cf5da0` (vm-qa), d on `3387cf5da0` (proofs), e on `768a0a9f48` (`:10027`, after the #174 proof; `tailscale.up=1`).
- Session scripts in `/workspace/tmp/rocknix-session/`: `build-x64.sh` (ID line), `rc6-proofs.sh` (phases: rebuild fully check1 walk shim pl07 pl27 check2 index indexes offline pl24 fr e174 181 upgrade), `rc6-pl09.sh`, `rc6/steps/*.steps`, `rc6/cache-100.py`, `rc7-run.sh`, `es-syntax-check` (ES_W=), `179/ra-scan-check-{1,2}.sh` (SKIP_NINO=1), `174-toggle.steps` (one press), `stage-h700.sh`, `upgrade-d.sh`, `fully-offline-check.sh`, `prove-174.sh`.

## Next Steps

1. RC-7 VM: read `rc7/run-1-*.log` (index phase = PL-06/PL-08/#183 box 1; `indexes` = GAME INDEXES rows frame); then `rc6-pl09.sh 3387cf5da0 100`, phases `181`, `upgrade`; nine suites' report. Frames -> `docs/qa-frames/2026-09-14/` (+README), QA log row RC-7, work log; tick #186 PL-06/08/09/10, #183 boxes 1/3, #184 3b/5b + "every note has a frame"; upstream-worthy: the `--no-splash` gate is an upstream ES bug (note on #168's list).
2. H700 RC-7 tar: verify inside the SYSTEM squashfs (BUILD_ID, the new ES strings), file at `h700-all-20260914-3387cf5da0` with BUILD_INFO; **ask the maintainer before staging on the RG SP**; `stage-h700.sh` on a yes; reboot only on a yes via `tools/device-act`.
3. Device round on the RG SP after RC-7: the maintainer's two offline tests (turn OFFLINE ACHIEVEMENTS on + scan first), #174 battery restart, #181 look, #157/#160, #45/#50/#82/#113/#121, #66-#69, PL-04; close proven issues naming the build.
4. Upstream to misantronic/RAOfflineProxy (#168, D-RA-016) on the maintainer's go; #185, #187, #182; SM8550 for the Nova after the RG SP round (D-WORKFLOW-020).
5. Maintainer's open calls: #178, #151 Phase 7, #47, D-RA-006, #173 (e), #161, #177.

## Standing rules that bind this work

- Nothing runs on a person's device or cloud without a per-action yes by device name after an idle check (D-QA-015); ask before staging each build (D-QA-011); QA guests a/b/d/e may be rebooted freely; guest/device reads mask values (`sed` on passw/token/key values and the y=/t=/p= query fields) and replace the QA account's name; the account name stays out of the repo (crop frames that show the USERNAME row).
- Credentials live only in `~/.ROCKNIX/qa-accounts` (0600) and reach guests only via `tools/qa-accounts` (prints names only); never print values or ask for them.
- Every out-of-band request becomes a fork issue quoting the maintainer (D-QA-012); issues only on `maxengel/rocknix`.
- Never `cd` into the primary checkout (`git -C`); commits `-c user.name="Max Engel" -c user.email="max@awecelot.com"` ending with the Co-Authored-By and Claude-Session lines; docs on `next` in the primary; register append-only (`tools/register-check`).
- One builder per build worktree: subagents deliver branches, the integrator builds; check `pgrep -f 'make docker-[A-Z]' | grep -v -w $$` before `fork-worktree sync`; x64 build via `build-x64.sh` after `rm -f .stamps/image/build_target`; H700 via `devices/build-dev.sh H700`.
- Subagent briefs say "wait with synchronous sleep/poll loops, return only when done"; audit/review subagents run on Fable 5.1 (`model: "fable"`), never Opus.
- A harness zero is a harness claim first: confirm from a second channel (journal, rotated log, config) before grading a FAIL; busybox `pgrep` has no `-c`; the interface runs under `essway.service`.

## Key Files Touched Today

- ES (`test/qa-integration` `9842a0083`): `feature/round-notes-rc5` (17 commits), `fix/startup-index` (`SystemData.{h,cpp}`, `main.cpp`, `NetworkThread.cpp`, `ThreadedHasher.{h,cpp}`).
- Distribution `next` (`3387cf5da0` + docs `15d4bfe442`): `projects/ROCKNIX/packages/ui/emulationstation/package.mk` (pin), `docs/vm-qa-log.md`, `docs/decision-register.md` (D-RA-018), `docs/work-logs/2026_09-work_logs/2026_09_14-work_log.md`, `docs/qa-frames/2026-09-14/` (+23 frames), `.claude/rules/generic-x64-vm-testing.md`.
- Artifacts: `/workspace/artifacts/rocknix-images/{x64-all-20260914-768a0a9f48,h700-all-20260914-768a0a9f48,x64-all-20260914-3387cf5da0}/` (+ BUILD_INFO.txt each); QA reports `qa-768a0a9f48-webdav-a-20260914-1655`.

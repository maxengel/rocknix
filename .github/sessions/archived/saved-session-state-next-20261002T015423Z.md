# Saved Session State

> **Saved**: 2026-10-02T01:54:23Z (one proof was still running; see In Progress)
> **Branch**: `next`. This file is the canonical stash (D-WORKFLOW-133); a working branch's own `saved-session-state-<branch>.md` points here. The work itself is on `feature/cloud-epic` (worktree `/workspace/repos/rocknix.worktrees/cloud-epic`, level with `next` at `bf121ce876` plus one uncommitted file) and on the EmulationStation fork's `feature/cloud-epic` (`~/Development/emulationstation-next.worktrees/cloud-epic` at `e108699ea`, merged into `test/qa-integration`, which the distribution pins).
> **Repo**: `rasteratops/distribution` (remote `origin`; `upstream` is `ROCKNIX/distribution`). The interface is `rasteratops/emulationstation`.

## Start here (if this project is new to you)

1. **What this is.** rasteratops is a fork of ROCKNIX, an immutable Linux distribution for handheld game consoles. The repository is a build system that cross-compiles a whole OS image per device. There is no app to run and no unit-test suite: the proofs are images booted as QEMU guests ("the VM"). Version 0.0.1 of the fork is being prepared (#344). The program in flight is the cloud epic, #354: cloud saves under a new default folder `/Rasteratops`, the migrations from the folders earlier versions used (`/GAMES`, `/ROCKNIX`), scan-first restore, and a "cloud folder step" that settles the folder at setup and at boot.
2. **Read, in this order.** `CLAUDE.md` (it loads by itself); the every-session rules in `.claude/rules/`, from `next`. If you started in a worktree, first check that its rules are `next`'s: `git diff --quiet next -- .claude CLAUDE.md AGENTS.md || echo STALE` (a session loads the rules of the worktree it starts in; on 2026-10-02 one was 813 commits behind, #367). Then this file. Then the issues below, each read to its last comment. Then the newest work log, `docs/work-logs/2026_10-work_logs/2026_10_02-work_log.md`. Then the decision rows the work cites: D-CLOUD-156 to D-CLOUD-172 and D-WORKFLOW-132 to D-WORKFLOW-134 in `docs/decision-register.md`.
3. **How work runs here (each binding).** No work without an issue that owns it: file it first, quoting the maintainer's words when they asked (D-WORKFLOW-132, `issue-tracking.md`). A decision becomes a register row the same session (`decision-register.md`; `tools/register-check` after). Friction is a line in `docs/friction-log.md` the moment work slows, with its issue or guard. A learning is a timestamped entry in the day's work log, headed by its issue, then `tools/work-log-index --write`. Before any test, the issue carries "Can this be done on the VM?" and its answer (`vm-first.md`). A checkbox is ticked from an artifact (a suite's PASS line, a frame, a log line), never from a claim. Nothing runs on a person's device without a yes for that action. `tools/ceremony-check` before pushing `next`; the push guard runs it too.
4. **The machine.** This host is serval. Primary checkout `/workspace/repos/rocknix` (stays on `next`); worktrees `/workspace/repos/rocknix.worktrees/<name>`; the EmulationStation checkout `~/Development/emulationstation-next` and its worktrees; kept images `/workspace/artifacts/rocknix-images`; session scripts and their logs `/workspace/tmp/rocknix-session`; the source cache `/workspace/cache/rocknix-sources`.
5. **Credentials (never print one).** GitHub as `rasterabot`: `export GH_TOKEN=$(cat ~/.config/rasteratops/github-token)` and always `--repo rasteratops/distribution`. Mail: `~/.local/bin/rasterabot-mail` reads the inbox with `~/.config/rasteratops/mail-token`. OpenRouter (the council and audits only): `. ~/.config/council/env`. QA accounts: `~/.ROCKNIX/qa-accounts`, carried into a guest by `tools/qa-accounts`. Pipe every read of a guest's or device's config through `grep -v -i -E 'key|pass|token|user|psk'`.
6. **Words and commits.** An unticked `- [ ]` is a "checkbox", never a "box" (D-QA-045). A list of banned words lives in `~/.config/rocknix/forbidden-terms` and is never written anywhere: check any text with `tools/forbidden-terms-check --stdin`. Nothing bound for upstream names an assistant. Commits end with the attribution lines your harness gives you; never `--no-verify`, never a bare `git stash`; never edit a bash script while it runs; stop a process by its pid, never with `pkill -f` on a pattern your own shell carries.

## Current Focus

The cloud folder question inside the cloud epic (#354). D-CLOUD-170 (#363) replaced a folder check before every sync with a cloud folder step, at the end of the setup wizard and at boot. D-CLOUD-172 (#364) stopped a backup from making an absent folder that is an earlier default. Run 101 (`b2378d9c33`) carries both and is being proven. On 2026-10-02 the maintainer asked for a step back: no more folder code changes until one table of the folder's states, and what each script and screen does in each, exists and the open failures are classified against it, then the mini-retro (#365, D-WORKFLOW-134). The same night: the work had drifted from process (#367, D-WORKFLOW-132), and this handoff was asked for (#368, D-WORKFLOW-133).

## Completed This Session (2026-10-01 to 02)

- D-CLOUD-170 (#363): the step in EmulationStation `e108699ea` (`GuiMenu.cpp` `cloudFolderStep`, `armCloudFolderStep`; `main.cpp`), `cloud_migrate_layout --needs-step`, `cloud_scan --folder`, the follow check removed from `cloud_backup` and `cloud_restore`, the pin bumped. Runs 96 to 100 proven (`docs/vm-qa-log.md`, the 10-01 and 10-02 work logs).
- D-CLOUD-172 (#364, with its code trace): run 101 built from `b2378d9c33`, kept at `/workspace/artifacts/rocknix-images/x64-all-20261002-b2378d9c33/`.
- `tools/time-to-play`: the conf copy fixed (`a4617bfd4a`); the wrong diagnosis corrected in the 10-02 work log.
- `tools/cloud-pair-migration` steps 5m and 5n rewritten for D-CLOUD-172 (`93235f254b`, on `next`; not yet re-run).
- Filed: #364, #365, #366 (the round-trip's `/GAMES` fixture), #367 (process), #368 (this handoff), #369 (parked upstream fixes). Rows D-WORKFLOW-132 to 134. `issue-tracking.md` § No work without an issue. Seven friction lines. The inventory of work in flight: https://github.com/rasteratops/distribution/issues/367#issuecomment-5944098009
- `feature/conflict-resolution` (the worktree this session started in) has `next` merged in (`79585f5841`), so a session started there loads current rules.

## In Progress

- **Run 101's proof chain, step 6 of 6: guest d's proof with the step's cases.**
  - Running since 01:35 UTC: `bash /workspace/tmp/rocknix-session/chain-101.sh`, pid 2144044, recorded by `tools/watch-job` (pid 2144478) to `/workspace/tmp/rocknix-session/chain-101.status`. When it ends, `chain-101.done` appears and `chain-101.out` ends with `chain done`. The proof's own log is `epic-proof-101.log`, its rc `epic-proof-101.rc`, its frames under `/workspace/tmp/rocknix-session/proofs-307/frames/`.
  - At 01:54: 26 PASS, 0 FAIL. Cases H, A, D, B0, B, E (D-CLOUD-172: no `/GAMES` made at boot), I (the step at boot) and J (offline) done; K, L, F and G to come.
  - Earlier steps: the pair test's negative control FAILED as designed (rc 1); the pair test 34 PASS, 5 FAIL (step 5m, rewritten since); `tools/vm-qa` 14 of 15 suites (round-trip FAIL, #366: the fixture, not the product); the upgrade rehearsal from RC2 PASS; the exit-sync comparison on guest d equal (stamp median 1.45 s on RC2 and on run 101); the follow benchmark FAILED, 59 ms (D-CLOUD-172's listing; on #364).
  - What remains: read the end; tick #363's end-of-setup checkbox from case L's frames if they show CHECKING YOUR CLOUD; #364's checkboxes; RECORD.txt beside run 101's image; `docs/vm-qa-log.md` rows for runs 100 and 101; then the change log's section, which waits uncommitted on `feature/cloud-epic` (`docs/cloud-sync-changelog.md`): case E has now passed, but its bullet "No sync checks the folder any more" is not true of run 101 (D-CLOUD-172 lists the saves folder before a backup on an earlier default, the benchmark's 59 ms), so the section is revised against run 101 before it is committed (`.claude/rules/change-log.md`: claims checked against the build).
- **The step back (#365).** The reading is done: the folder is decided in `cloud_migrate_layout` (eight modes), `cloud_scan`'s `read_folder`, `cloud_setup --seed-folders`, `cloud_backup`, `cloud_restore`, four places in EmulationStation, and the test fixtures (the 01:47 entry in the 10-02 work log lists them). The table is not written yet. Two cases found by reading, **not run**: a device on `/ROCKNIX/Saves` after another device moved and the old root is gone (the startup sync's restore half may read COULDN'T FINISH before the step follows), and a carried `/GAMES` that exists but is empty while the saves are in `/ROCKNIX/Saves` (the startup sync's backup may write into `/GAMES` before the step, which would then offer the move from there). The boot step waits for the startup sync, so the sync acts on a folder nobody has settled yet; case E came from that ordering.
- **#367 follow-on:** build the `issues` line in `tools/ceremony-check` (fails on a fork commit on `next` after `bf121ce876` that cites no `#N`); say in `tools/watch-job`'s usage what `--pid` and `--pattern` take.
- **#368:** this file, then an agent new to the project is given only the repository and asked to resume; every place it goes wrong is fixed.

## Next Steps

1. Read the chain's end: `cat /workspace/tmp/rocknix-session/chain-101.out` and `grep -E 'PASS|FAIL' /workspace/tmp/rocknix-session/epic-proof-101.log`. Post the numbers on #363 and #364, tick what they prove, write RECORD.txt and the vm-qa-log rows, revise and commit the change log's section.
2. Write the folder state table for #365 under `docs/`, the open failures classified against it. No folder code changes before it (D-WORKFLOW-134).
3. Run the mini-retro (the `mini-retro` skill) on the cloud epic; `tools/ceremony-check` has it at 4 of 5 active days.
4. Then #366 (the fixture and the check reading `cloud_migrate_layout --superseded`), #367's follow-on, and the pair test re-run on run 101.
5. Waiting on the maintainer: the libsoup pin (#362; the next candidate's step 0 fails until it is decided), D-CLOUD-168's merge put for confirmation (#353, #354), the settings row's wording (#349), the device facts read on the devices (#270), #344's P1 items.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` | Modified | follow check removed (D-CLOUD-170); the earlier-default guard before the connectivity test (D-CLOUD-172) |
| `.../rclone/sources/cloud_restore` | Modified | follow check removed |
| `.../rclone/sources/cloud_migrate_layout` | Modified | `--needs-step` (no network) |
| `.../rclone/sources/cloud_scan` | Modified | `read_folder()`, `--folder` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | `PKG_VERSION` `e108699ea` |
| `tools/last-good-scripts-test` | Modified | sections aa, ab, ad (the folder cases) |
| `tools/time-to-play`, `tools/cloud-pair-migration` | Modified | the conf copy checked; steps 5m and 5n |
| `.claude/rules/issue-tracking.md` | Modified | § No work without an issue |
| `docs/decision-register.md`, `docs/friction-log.md`, `docs/work-logs/2026_10-work_logs/*` | Modified | rows, friction, the night's entries |
| `docs/cloud-sync-changelog.md` | Modified, **uncommitted** on `feature/cloud-epic` | the step's section; revise its no-check bullet against run 101, then commit |

## Related Context

- **Plan**: #344 (0.0.1, the council's plan). The epic's futro: `docs/futros/2026-10-01-cloud-epic-354.md`.
- **Tracker**: milestone "rasteratops 0.0.1"; epic #354 with #349 to #353, #363, #364; #365 (the step back) with #366 under it; #367, #368, #369.
- **Rows**: D-CLOUD-156 to D-CLOUD-172 (the cloud epic); D-WORKFLOW-084 (the fork), 087 (nothing to ROCKNIX's `next` for now), 091 (time is never a planning factor), 109 (the council is the five seats only), 132 to 134.
- **Interface law**: `docs/es-menu-map.md` (the step's paragraph), `docs/conflict-wizard-ia.md`. Frames of the step: `docs/qa-frames/2026-10-02/363/`.

## Notes for Next Session

- **Guest d** (640x480, the proofs' guest): `ssh -i /tmp/rocknix-vm-pair/qa-key -p 10026 root@127.0.0.1`; VNC 127.0.0.1:5912; monitor socket `/tmp/rocknix-qemu-monitor-d.sock`; pidfile `/tmp/rocknix-qemu-d.pid`. Rebuilt from the newest image in `generic-x64/target/` by `/workspace/tmp/rocknix-session/rebuild-d-plain.sh`. The proofs drive it through `proofs-307/common.sh` (`G_` for ssh, `walk`/`steps` for keys, `shot` for frames; Info logs need `debug_reboot`).
- **The QA cloud**: `tools/cloud-test-backend` (WebDAV on :9010, data under `~/.cache/rocknix-cloud-qa/data`). One writer per QA cloud folder: run the proofs one at a time.
- **Building a GENERIC_X64 image**: in `/workspace/repos/rocknix.worktrees/generic-x64` (branch `build/generic-x64`): with no build running, `git -C <that worktree> merge --ff-only next`, then the pattern in `/workspace/tmp/rocknix-session/build-x64-run101.sh` (clean `rocknix`, then `make docker-GENERIC_X64` with the `.git` and sources mounts). BUILD_ID is that worktree's HEAD. Keep each image under `/workspace/artifacts/rocknix-images/x64-all-<date>-<id>/`.
- **An EmulationStation change**: edit in its `cloud-epic` worktree, `tools/es-syntax-check --tree <worktree> <absolute .cpp path>` before committing, merge into `test/qa-integration`, push to `origin` (rasteratops/emulationstation), bump `PKG_VERSION`.
- **The checks**: `tools/last-good-scripts-test` (on the host, the scripts under the image's busybox); `tools/vm-qa <img.gz>` (fifteen suites on a fresh guest); `tools/cloud-pair-migration <old img> <new img> <new tar>`; `tools/vm-upgrade-rehearsal`; `tools/time-to-play`.
- **Long jobs**: start them detached (`setsid nohup`); `$!` after setsid is not the job's pid, so find it with `pgrep -f '^bash /path/script\.sh$'`. Record them with `tools/watch-job --detach --log <log> --rc <rc> --pid <pid>` (`--pattern` is a regex for the log's progress line, not a process match), and also wait for the rc file so the result is delivered to you.
- **Memory**: `~/.claude/projects/-workspace-repos-rocknix/memory/` (MEMORY.md loads by itself) holds about sixty lessons from earlier sessions. Treat them as leads; the rules and the registers are the record.
- **Session scripts outside the tree**: the proofs that gate a candidate (`epic-proof-101.sh`, `pair-negative-100.sh`, `follow-bench-100.sh`) live only in `/workspace/tmp/rocknix-session/`. Moving them into `tools/` is #365's second pattern.

## Open Questions

- Should the cloud folder step run before the startup sync rather than after it? This came out of the step back's reading (case E's ordering); it has not been put to the maintainer, and belongs to #365's table.
- The four questions waiting on the maintainer in Next Steps, item 5.

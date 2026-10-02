# Saved Session State

> **Saved**: 2026-10-02T02:15:03Z. The session that wrote this stopped right after: nothing it started is still running. Anything that changed after this time was done by someone else.
> **Branch**: `next`. This file is the canonical stash (D-WORKFLOW-133). A working branch's own `saved-session-state-<branch>.md` points here. The work is on `feature/cloud-epic` (worktree `/workspace/repos/rocknix.worktrees/cloud-epic`, at `150551138d`; one file deliberately uncommitted, see In Progress) and on the EmulationStation fork's `feature/cloud-epic` (`~/Development/emulationstation-next.worktrees/cloud-epic` at `e108699ea`, merged into `test/qa-integration`, which the distribution pins).
> **Repo**: `rasteratops/distribution` (remote `origin`; `upstream` is `ROCKNIX/distribution`). The interface is `rasteratops/emulationstation`.

> **Update, 2026-10-02 05:19 UTC**: the Blitterbot migration (#374, D-WORKFLOW-136) is complete for local Git, SSH, mail and MCP integration. The maintainer confirmed the new GitHub email; old commits remain attributed and verified. Local `next` now includes the selected session records and council-instruction update (#372, D-WORKFLOW-135), so the cloud worktree above is behind those instruction/documentation changes. Its held changelog, image/QA artifacts and #365 next step are unchanged; merge the current instructions before resuming there. The branding-name correction remains on `feature/identity` at `c4a4cd188c` with #337. Nothing was pushed.

## Start here (if this project is new to you)

0. **Check what you loaded.** The `CLAUDE.md` in your context should contain a paragraph that begins "Resuming work, or new to the project?". If it does not, your instructions are older than this file: read `CLAUDE.md` and `.claude/rules/*.md` from disk (or `git show next:<path>`) before trusting any of them. If you started in a worktree, also run `git diff --quiet next -- .claude CLAUDE.md AGENTS.md || echo STALE`; a stale feature worktree merges `next` first (#367).
1. **What this is.** rasteratops is a fork of ROCKNIX, an immutable Linux distribution for handheld game consoles. The repository is a build system that cross-compiles a whole OS image per device. There is no app to run and no unit-test suite; proofs run on images booted as QEMU guests ("the VM"). Version 0.0.1 of the fork is being prepared (#344). The program in flight is the cloud epic, #354: cloud saves under a new default folder, `/Rasteratops`; migrations from the folders earlier versions used (`/GAMES`, `/ROCKNIX`); scan-first restore; and a "cloud folder step" that settles the folder at setup and at boot.
2. **Read, in this order.** `CLAUDE.md`; the rules in `.claude/rules/`, the every-session ones first (`instruction-files.md` indexes all 29); this file; then the issues below, each read to its last comment (`gh issue view N --repo rasteratops/distribution --json body,comments`; plain `--comments` has printed nothing here with exit 0); then the newest work log, `docs/work-logs/2026_10-work_logs/2026_10_02-work_log.md`; then the decision rows the work cites, D-CLOUD-156 to D-CLOUD-172 and D-WORKFLOW-132 to D-WORKFLOW-134 in `docs/decision-register.md`.
3. **How work runs here (each binding).** No work without an issue that owns it: file it first, quoting the maintainer's words when they asked (D-WORKFLOW-132, `issue-tracking.md`). A decision becomes a register row the same session (`decision-register.md`; `tools/register-check` after). Friction is a line in `docs/friction-log.md` the moment work slows, with its issue or guard. A learning is a timestamped entry in the day's work log, headed by its issue, then `tools/work-log-index --write`. Before any test, the issue carries "Can this be done on the VM?" and its answer (`vm-first.md`). A checkbox is ticked from an artifact, never a claim, and when a later change makes a ticked checkbox false it is re-opened with the reason (`issue-tracking.md`). Nothing runs on a person's device without a yes for that action. `tools/ceremony-check` before pushing `next`; the push guard runs it too.
4. **The machine.** This host is serval. Primary checkout `/workspace/repos/rocknix` (stays on `next`); worktrees `/workspace/repos/rocknix.worktrees/<name>`; the EmulationStation checkout `~/Development/emulationstation-next` and its worktrees; kept images `/workspace/artifacts/rocknix-images`; session scripts and their logs `/workspace/tmp/rocknix-session`; the source cache `/workspace/cache/rocknix-sources`.
5. **Credentials (never print one).** `gh` is already signed in as `blitterbot` (renamed account ID 335883270, D-WORKFLOW-136); to be explicit, `export GH_TOKEN=$(cat ~/.config/rasteratops/github-token)`. Always pass `--repo rasteratops/distribution`. Use `gh` with `--json` here, even though the `session-resume` skill prefers MCP tools. Mail: `~/.local/bin/blitterbot-mail` with `~/.config/rasteratops/mail-token` (0600), validated against `blitterbot@rasteratops.com`; the Hostinger MCP authorization uses the same credential. The old `rasterabot-mail` command wraps the new reader, and the maintainer retained the old email address as an alias (#374). GitHub CLI labels, project remotes and the `github-blitterbot` SSH alias use Blitterbot; `github-rasterabot` remains a compatibility alias. Distribution and ES use repository-local bot author/signing settings. Commits use `blitterbot@rasteratops.com`, confirmed verified on GitHub by the maintainer on 2026-10-02. Historical commits retain their original addresses and remain attributed to the same account. OpenRouter, for the council and audits only: `. ~/.config/council/env`. QA accounts: `~/.ROCKNIX/qa-accounts`, carried into a guest by `tools/qa-accounts`. Pipe every read of a config, and every **process listing** (`ps`, `pgrep -af`), through `grep -v -i -E 'key|pass|token|user|psk'`. The QA WebDAV server carries its fixture password on its command line.
6. **Words and commits.** An unticked `- [ ]` is a "checkbox", never a "box" (D-QA-045). A list of banned words lives in `~/.config/rocknix/forbidden-terms` and is never written anywhere: check any text with `tools/forbidden-terms-check --stdin`. Nothing bound for upstream names an assistant. Commits end with the attribution lines your harness gives you. Never `--no-verify`, never a bare `git stash`, never edit a bash script while it runs. Stop a process by its pid, never with `pkill -f` on a pattern your own shell carries.

## Current Focus

The cloud folder question inside the cloud epic (#354), paused for a step back. D-CLOUD-170 (#363) replaced a folder check before every sync with a cloud folder step at the end of the setup wizard and at boot. D-CLOUD-172 (#364) stopped a backup from making an absent folder that is an earlier default. Run 101 (`b2378d9c33`) carries both and is proven: guest d's proof 34 PASS, 0 FAIL. On 2026-10-02 the maintainer asked for a step back (#365, D-WORKFLOW-134). No more folder code changes until one table exists of the folder's states and what each script and screen does in each, the open failures are classified against it, and the mini-retro has run. The same night: the work had drifted from process (#367, D-WORKFLOW-132), and this handoff was asked for (#368, D-WORKFLOW-133).

## Completed This Session (2026-10-01 to 02)

- D-CLOUD-170 (#363): the step in EmulationStation `e108699ea` (`GuiMenu.cpp` `cloudFolderStep`, `armCloudFolderStep`; `main.cpp`), `cloud_migrate_layout --needs-step`, `cloud_scan --folder`, the follow check removed from `cloud_backup` and `cloud_restore`, and the pin bumped. Runs 96 to 100 proven.
- D-CLOUD-172 (#364, with its code trace). Run 101 built and proven, kept at `/workspace/artifacts/rocknix-images/x64-all-20261002-b2378d9c33/` with its `RECORD.txt`:
  - guest d's proof 34 PASS, 0 FAIL (cases H, A, D, B0, B, E, I, J, K, L; C, F and G record frames only);
  - the pair test 34 PASS, 5 FAIL (step 5m, rewritten since in `93235f254b`, not re-run);
  - vm-qa 14 of 15 suites (the round-trip, #366);
  - the rehearsal from RC2 PASS;
  - the exit-sync stamp level with RC2 (median 1.45 s);
  - the follow benchmark 59 ms apart (#364).
- Records: the `docs/vm-qa-log.md` row for runs 100 and 101, and frames with a README under `docs/qa-frames/2026-10-02/363/`. #363 re-derived on run 101: two ticks re-opened because run 101 contradicts them, and the end-of-setup checkbox ticked. #364's two checkboxes ticked, plus a new one for the 59 ms. #370 closed.
- `tools/time-to-play`: the conf copy fixed (`a4617bfd4a`).
- Filed: #364 to #371. Rows D-WORKFLOW-132 to 134. `issue-tracking.md` § No work without an issue. `learning-capture.md` § 4. This file and its pointers. `CLAUDE.md` and `AGENTS.md` point here. The inventory of work in flight: https://github.com/rasteratops/distribution/issues/367#issuecomment-5944098009
- An agent with no context was given only the repository and asked to resume (#368). Its gaps are folded into this file; the dispositions are on #368.

## In Progress

Nothing is running. Left up on purpose for the next proofs:

- **Guest d**: QEMU pid 2583579, pidfile `/tmp/rocknix-qemu-d.pid`. Stop it with `kill $(cat /tmp/rocknix-qemu-d.pid)`.
- **The QA WebDAV server**: pid 868108. Stop it with `tools/cloud-test-backend down`.

Open threads:

- **The step back (#365).** The reading is done; the 01:47 entry in the 10-02 work log lists every place the folder is decided. The table is not written yet.
  - #365's body still heads its plan "Proposed, for the maintainer's yes"; D-WORKFLOW-134 has since decided the step back itself, so edit the heading.
  - Two cases found by reading and **not run**:
    - A device on `/ROCKNIX/Saves` after another device moved, with the old root gone: the startup sync's restore half may read COULDN'T FINISH before the step follows.
    - A carried `/GAMES` that exists but is empty while the saves are in `/ROCKNIX/Saves`: the startup sync's backup may write into `/GAMES` before the step, which would then offer the move from there.
  - The boot step waits for the startup sync by design: D-CLOUD-171 (2), because a move asked beside the startup sync was refused as A SYNC IS ALREADY RUNNING. So the sync acts on a folder nobody has settled yet. Case E came from that ordering.
  - Run 101's frame `E-run101-skipped-card-over-the-step.png` shows the startup card's outcome still drawn over the step's scan page.
- **The held change-log section** (`docs/cloud-sync-changelog.md`, uncommitted on `feature/cloud-epic`, #363). Both its heading ("... and no sync checks it") and its bullet "No sync checks the folder any more" are untrue of run 101, so revise both against run 101 before committing (`.claude/rules/change-log.md`).
- **#367 follow-on**: an `issues` line in `tools/ceremony-check` (it fails on a fork commit on `next` after `bf121ce876` that cites no `#N`), and `tools/watch-job`'s usage line (what `--pid` and `--pattern` take).
- **#368's armature findings, not yet fixed**:
  - `.claude/rules/fork-workflow.md` line 62 still says `--head maxengel:pr/<name>`; the fork is `rasteratops/distribution`, whose parent is `ROCKNIX/distribution`.
  - `.claude/rules/device-builds.md` lines 498 to 505 name the `maxengel` EmulationStation forks; check their current state before changing them.
  - `engineering-practices.md`'s read filter does not yet name process listings.
  - The EmulationStation repository's pointer `CLAUDE.md` still opens by naming ROCKNIX.
  - `rasteratops/splash` has no instruction files.
- **#371**: `feature/conflict-resolution` cannot be pushed. Its merges of `next` (`79585f5841`, `bbb2c635fe`) stay local until the push hook stops re-judging history `next` already published.

## Next Steps

1. Write the folder state table for #365 under `docs/`, the open failures classified against it, citing D-CLOUD-171 (2) for the ordering. Change no folder code before it (D-WORKFLOW-134).
2. Run the mini-retro on the cloud epic with the `mini-retro` skill; `tools/ceremony-check` read it at 4 of 5 active days on 2026-10-02.
3. Then: #366 (the round-trip fixture, and the stale-name check reading `cloud_migrate_layout --superseded`), the pair test re-run on run 101, the change-log revision, #367's follow-on, #371, and #368's armature findings.
4. Waiting on the maintainer:
   - **The libsoup pin (#362).** The next candidate's step 0 fails until it is decided.
   - **D-CLOUD-168's merge**, put to them to confirm or reverse on #353 (2026-10-01 15:41).
   - **#349's settings line**, which exists in three versions: shipped `GENERIC X64, 09/30/2026`; the criterion's `FROM <label>, <date>`; and D-CLOUD-164's approved `<DEVICE>, <DATE>`, with `30 SEP 2026`.
   - **Also**: the device facts read on the devices (#270), #344's P1 items, and #369 (parked).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` | Modified | follow check removed (D-CLOUD-170); the earlier-default guard before the connectivity test (D-CLOUD-172, lines 830-842) |
| `.../rclone/sources/cloud_restore` | Modified | follow check removed |
| `.../rclone/sources/cloud_migrate_layout` | Modified | `--needs-step` (no network) |
| `.../rclone/sources/cloud_scan` | Modified | `read_folder()`, `--folder` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | `PKG_VERSION` `e108699ea` |
| `tools/last-good-scripts-test` | Modified | sections aa, ab, ad (the folder cases) |
| `tools/time-to-play`, `tools/cloud-pair-migration`, `tools/rules-check` | Modified | the conf copy checked; steps 5m and 5n; the count in either case |
| `.claude/rules/issue-tracking.md`, `.claude/rules/learning-capture.md`, `CLAUDE.md`, `AGENTS.md`, the two session skills | Modified | no work without an issue; the stash for a new agent |
| `docs/decision-register.md`, `docs/friction-log.md`, `docs/vm-qa-log.md`, `docs/work-logs/2026_10-work_logs/*`, `docs/qa-frames/2026-10-02/363/` | Modified | rows, friction, runs 100 and 101, the night's entries, frames |
| `docs/cloud-sync-changelog.md` | Modified, **uncommitted** on `feature/cloud-epic` | the step's section; revise its heading and no-check bullet against run 101, then commit |

## Related Context

- **Plan**: #344 (0.0.1, the council's plan). The epic's futro: `docs/futros/2026-10-01-cloud-epic-354.md`.
- **Tracker**: milestone "rasteratops 0.0.1"; epic #354 with #349 to #353, #363 and #364; #365 (the step back) with #366 under it; #367; #368 with #370 (closed) and #371 under it; #369.
- **Rows**: D-CLOUD-156 to D-CLOUD-172 (the cloud epic); D-WORKFLOW-084 (the fork), 087 (nothing to ROCKNIX's `next` for now), 091 (time is never a planning factor), 109 (the council is the five seats only), 132 to 134.
- **Interface law**: `docs/es-menu-map.md` (the step's paragraph), `docs/conflict-wizard-ia.md`. Frames of the step: `docs/qa-frames/2026-10-02/363/`.

## Notes for Next Session

- **Guest d** (640x480, the proofs' guest):
  - ssh: `ssh -i /tmp/rocknix-vm-pair/qa-key -p 10026 root@127.0.0.1`; VNC 127.0.0.1:5912; monitor socket `/tmp/rocknix-qemu-monitor-d.sock`.
  - It is rebuilt from the newest image in `generic-x64/target/` by `/workspace/tmp/rocknix-session/rebuild-d-plain.sh`.
  - The proofs drive it through `/workspace/tmp/rocknix-session/proofs-307/common.sh`: `G_` for ssh, `walk`/`steps` for keys, `shot` for frames. Info logs need `debug_reboot`.
- **The QA cloud**: `tools/cloud-test-backend` (WebDAV on :9010, data under `~/.cache/rocknix-cloud-qa/data`). One writer per QA cloud folder, so run the proofs one at a time.
- **Building a GENERIC_X64 image** in `/workspace/repos/rocknix.worktrees/generic-x64` (branch `build/generic-x64`), with no build running:
  1. Discard the doc the last build rewrote: `git -C <worktree> checkout -- documentation/`. It is dirty there now (`generic-x64-vm-testing.md`).
  2. `git -C <worktree> merge --ff-only next`.
  3. Follow `/workspace/tmp/rocknix-session/build-x64-run101.sh`: clean `rocknix`, then `make docker-GENERIC_X64` with the `.git` and sources mounts.
  BUILD_ID is that worktree's HEAD. Keep each image under `/workspace/artifacts/rocknix-images/x64-all-<date>-<id>/` with a `RECORD.txt`.
- **An EmulationStation change**: edit in its `cloud-epic` worktree; run `tools/es-syntax-check --tree <worktree> <absolute .cpp path>` before committing; merge into `test/qa-integration`; push to `origin` (rasteratops/emulationstation); bump `PKG_VERSION`.
- **The checks**:
  - `tools/last-good-scripts-test`: on the host, the scripts under the image's busybox.
  - `tools/vm-qa <img.gz>`: fifteen suites on a fresh guest.
  - `tools/cloud-pair-migration <old img> <new img> <new tar>`.
  - `tools/vm-upgrade-rehearsal`, `tools/time-to-play`.
  - To count a proof's results, grep the two-space forms `'  PASS  '` and `'  FAIL  '`, or read its `=== done:` line. A plain `grep -c FAIL` also counts that summary line.
- **Long jobs**: start them detached (`setsid nohup`). `$!` after setsid is not the job's pid; find it with `pgrep -f '^bash /path/script\.sh$'`. Record them with `tools/watch-job --detach --log <log> --rc <rc> --pid <pid>`; `--pattern` is a regex for the log's progress line, not a process match. Also wait on the rc file so the result is delivered.
- **Memory**: `~/.claude/projects/-workspace-repos-rocknix/memory/` (MEMORY.md loads by itself for a session under `/workspace/repos/rocknix`) holds about sixty lessons. Treat them as leads; the rules and registers are the record.
- **Session scripts outside the tree**: the proofs that gate a candidate (`epic-proof-101.sh`, `pair-negative-100.sh`, `follow-bench-100.sh`) live only in `/workspace/tmp/rocknix-session/`. Moving them into `tools/` is #365's second pattern.
- **Testing a stash**: a subagent inherits the instructions its parent session loaded at start, so it can carry rules older than the disk. Only a fresh session reads `CLAUDE.md` from disk. The first test (#368) was a subagent; the maintainer's fresh session is the second.

## Open Questions

- Should the cloud folder step come before the startup sync? Reversing D-CLOUD-171 (2) needs a new row and an answer to its reason, the lock the sync holds. It belongs to #365's table and has not been put to the maintainer.
- The questions waiting on the maintainer, in Next Steps item 4.

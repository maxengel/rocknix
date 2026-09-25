# Saved Session State

> **Saved**: 2026-09-25T19:54:26Z
> **Branch**: feature/conflict-resolution (session worktree; every record commit went to `next` in the primary checkout, which is 27 commits ahead of this branch -- merge `next` here first)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution); EmulationStation at /home/max/Development/emulationstation-next (`test/qa-integration` = `698f3956b0`)

## Current Focus

The conflict-resolution round's release candidate, made by the procedure in `.claude/rules/release-candidates.md` (D-WORKFLOW-047, the maintainer's order D-QA-049). The build is `c939df737a` (x64 `x64-all-20260925-c939df737a`, H700 `h700-all-20260925-c939df737a`): every VM proof is green and the preflight reads `MAY BE CUT (unchecked by tool: device facts)`. The next step is the device (step 4): the copy of the H700 tar to the RG35XX SP and its reboot, each on the maintainer's yes, which has been asked for and not yet given; then the soak; then the call (step 5); then the two-agent upstream audit (step 6, Fable 5.1 and GPT-6 Astra through OpenRouter); then the PR series and the test-device builds (steps 7-8).

## Completed This Session

- Step 0/1: ROCKNIX `upstream/next` (56 commits) and ES `rocknix/master` (66) merged; the clean baseline `e506fcd8e5` built and green (vm-qa run 29 + time-to-play run 32, rehearsal). Two tool defects fixed on the way: `tools/es-untranslated` counted upstream's own strings as ours; `tools/time-to-play` read another launch's surface line and passed a sync with no cloud (blindspots 55, 56).
- Step 2: RAOfflineProxy `0711f0b` + rcheevos `1433173` (D-RA-029; #259 closed); webkitgtk 2.54.0 -- the "fourth wall" was a stale precompiled header from ccache (blindspot 58), and the sign-in window's DMABuf renderer is off (D-WORKFLOW-048): 283 MB against 275 on 2.52.6, loads at 1 GB. `tools/signin-memory` fixed to fail a page that never loads (blindspot 59).
- `tools/rc-preflight` (#271 closed): one verdict per item, findings accepted only by `docs/releases/rc-accept.txt` lines citing a decided row; an accepted bug must carry a "Code trace" comment (#273, D-QA-012).
- The maintainer's code-trace requirement (#273): four Fable agents traced all twelve open bugs; five fixes found incomplete by a sibling and one issue's cause wrong -- all fixed (`e07a5db069`, ES `698f3956b0`) and proven (harness 373/0; four-phase guard positives in the work log). D-QA-050 records the dispositions; #198, #221, #274, #272 closed; #275 filed (netplay quoting, upstream, the maintainer's call).
- The rebuilt candidate `c939df737a`: vm-qa run 35 all fifteen suites; rehearsal run 25 from `664ad9ac64`; ra-offline run 36 PASSED 32/32 after the maintainer reset the QA account; RECORD.txt for both images, catalog, vm-qa-log rows, #236 comment with the preflight verdict.
- Blindspots 55-60; D-RA-029, D-UI-091, D-WORKFLOW-048, D-QA-050; `release-candidates.md` step 0 names the trace; `device-builds.md` gains the stale-PCH rule and the preflight requirement; `vm-walks/README.md` says how a walk leaves a game (#239's checkbox).

## In Progress

- Step 4, the device
  - **Current state**: `/workspace/tmp/rocknix-session/stage-rg35xxsp-c939df737a.sh` is written (copy to `/storage/.update-staging`, hash on the device, move into `/storage/.update`; no reboot) and NOT run. The maintainer has been asked for the copy and the reboot; no yes yet. The device runs `664ad9ac64` (staged 2026-09-25 01:36-01:41 UTC).
  - **What remains**: on the yes -- run the stage script, then ask for the reboot by name, then `docs/releases/device-facts.md` and the H700 RECORD.txt's Device line, the soak (D-QA-036), its journal read.

## Next Steps

1. Wait for the maintainer's yes for the copy (then `stage-rg35xxsp-c939df737a.sh`) and, separately, the reboot (D-QA-011). Nothing on the device without it.
2. After the soak: the call on #236 (step 5), citing the preflight line, the soak's read, the device facts updated (D-WORKFLOW-046).
3. Step 6: the code-auditor skill at milestone tier over everything going upstream (the distribution's diff against `upstream/next`, the ES fork's against `rocknix/master`), by Fable 5.1 and GPT-6 Astra through the council Facilitator (`tools/council/run invoke --member gpt|claude`); the ceremony check already reads the audit overdue (CI red). The paused scoped audit's notes are in `/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/` (untracked).
4. Step 7: the PR series by content (`fork-workflow.md`, D-WORKFLOW-034), rocknix.org docs last (#42); the theme fix PR with a before screenshot; builds for the RG SP and the Retroid Pocket Nova (D-QA-023/028), each staged on its own yes.
5. Follow-ups filed or noted: #270 (catalog/device-facts tooling; the catalog shows no preflight column), #275 (netplay quoting, the maintainer's call), #239's HideWindow lead, the RetroArch patches' duplicate `0011-` prefix, `cloud-test-backend`'s refuse-then-accept mode (#113's VM checkbox).

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `tools/rc-preflight` | Created | the step-0 check; the code-trace requirement |
| `tools/time-to-play`, `tools/vm-qa`, `tools/es-untranslated`, `tools/signin-memory`, `tools/last-good-scripts-test` | Modified | blindspots 55, 56, 59, 60 and the traces' cases (sections f, k, l, w); vm-qa's `quoting` suite |
| `projects/ROCKNIX/packages/network/raofflineproxy/*` | Modified | the bump; 005 reduced, 006 retired; `raofflineproxy-refresh` follows upstream's scope |
| `packages/web/webkitgtk`, `projects/ROCKNIX/packages/multimedia/gstreamer/*`, `projects/ROCKNIX/packages/network/cloud-signin-window/sources/cloud-signin-window.c` | Modified | 2.54.0 with GStreamer GL and mpegts; the DMABuf renderer off |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`, `.../network/rclone/sources/cloud_setup`, `.../armsx2-sa/scripts/cheevos_armsx2.sh` | Modified | the traces' fixes (`e07a5db069`) |
| ES `es-app/src/guis/GuiMenu.cpp`, `tests/credential-quoting.py` | Modified | the third setrootpass caller and the CLOUD FOLDER quoted; the operand sweep |
| `docs/decision-register.md`, `docs/blindspot-register.md`, `docs/releases/rc-accept.txt`, `docs/releases/catalog.md`, `docs/vm-qa-log.md`, `docs/work-logs/2026_09-work_logs/2026_09_25-work_log.md` | Modified | the day's record |
| `.claude/rules/release-candidates.md` | Created | the SOP (D-WORKFLOW-047), step 0 with the preflight and the trace |

## Related Context

- **Tracker**: #236 (the round), #273 (the code traces), #259/#228 (the bumps, closed/open), #270, #275; the twelve traced bugs each carry a "Code trace" comment dated 2026-09-25.
- **Images**: `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260925-c939df737a/RECORD.txt`; QA reports `qa-c939df737a-*`.
- **Session files**: `/workspace/tmp/rocknix-session/` (chains, logs, the stage script, the issue-body backups under `issue-bodies/`).

## Notes for Next Session

- The harness bind-mounts a copy of busybox now; before `e07a5db069` a concurrent image step could pull the build root's file away mid-run (that was #272's real cause).
- The QA guests: a/b (vm-pair, :10022/:10023) are up on `c939df737a`; guest d (:10026, 640x480, 8 GB) is on `c939df737a` with the RA QA account signed in through the proxy. Stop a guest by its pidfile (`/tmp/rocknix-qemu-<x>.pid`) or the monitor's `quit`, never by pattern.
- `AskUserQuestion` blocked for ~5 hours today; runs started before it drifted in wall time. Ask in text where a plain answer will do.
- The x64 and devices build worktrees are on `build/*` at `c939df737a`; `build/webkit-254`, `build/webkit-254-h700`, `build/proxy-bump` are throwaway branches that can go; feature worktrees `raofflineproxy-bump`, `webkitgtk-254`, `rc-trace-fixes`, `backup-leak-scan` are merged and removable with `tools/fork-worktree remove`.
- The credential read filter (`grep -v -i -E 'key|pass|token|user|psk'`) on every device/guest read; the QA account name never in a filed frame.

## Open Questions

- The device: the maintainer's yes for the copy and for the reboot of `c939df737a` on the RG35XX SP (asked 2026-09-25 evening).
- #275: does the netplay lane open (quote NICKNAME/PORT) or ship as upstream has it?
- The pre-push credential scan's narrowing to skip upstream's commits was denied as a security weakening; whether to narrow it is the maintainer's.
- Whether the catalog should carry the preflight verdict as a column (#270).

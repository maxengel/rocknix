# Saved Session State

> **Saved**: 2026-09-25T21:29:14Z
> **Branch**: feature/conflict-resolution (worktree `/workspace/repos/rocknix.worktrees/conflict-resolution`; the record lives on `next` in `/workspace/repos/rocknix`, pushed to `origin/next` at `154d722392`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

The release-candidate round (D-QA-049, the SOP `release-candidates.md`, D-WORKFLOW-047) has its **final candidate `a65da6c784`** built, proven on the VM and recorded. Steps 0-3 are done and step 4 has begun: a65da6c784 is on the RG35XX SP since 2026-09-25 21:26 UTC (the maintainer's yes for the copy and the reboot, both through the action log); the soak (D-QA-036) is the maintainer's play, its journal read afterwards. Step 6 (the two-agent upstream audit) waits on their decision about the Fable 5.1 seat's spend limit.

## Completed This Session

- Bugs-are-agent-first policy written as `.claude/rules/bugs-are-agent-first.md` (D-QA-051); labels `bug` / `open item to test` / `keep an eye on`; `tools/rc-preflight` counts only `bug`-labelled open issues and requires a code-trace comment; `docs/releases/rc-accept.txt` now carries package lines only.
- Every bug the round knew is closed: #178 (three VM proofs: a WARNING in the file within 5-12 ms via `curl --interface 127.0.0.2`, ten reboots kept it in `es_log.0.txt`, the journal carries it), #239 (ES `eacbc0b72`, HideWindow default), #249, #275 (ES `3d17b2fd6c`), #50/#113/#169/#170/#177 as open items (#277) with harness gaps (#278), #79 keep-an-eye-on; #276 closed with the table.
- Final images: `x64-all-20260925-a65da6c784`, `h700-all-20260925-a65da6c784` with RECORD.txt; c939df737a pair SUPERSEDED; 865cb1bb8b pair recorded as never proven; catalog 32 cuts; vm-qa-log row; work log (`docs/work-logs/2026_09-work_logs/2026_09_25-work_log.md`, entries through 21:20 UTC).
- Proofs on a65da6c784: vm-qa run 37 all fifteen suites (quoting 10/10, scripts 374/374, frame-diff identical to the 664ad9ac64 baseline), rehearsal run 26 20/20, sign-in window 283 MB; preflight `MAY BE CUT (unchecked by tool: device facts)`.
- `generic-x64-vm-testing.md` corrected: the ES log is no longer late (since ES `469441d4d`), `/var/log` is `/storage/.cache/log` bind-mounted, the unit is `essway`.
- #236 carries the final-candidate comment with the two asks.

## In Progress

- **Step 4, the device**: staged 21:17-21:21 UTC (hash verified on the device), rebooted 21:21:53 UTC (boot id b16fc9f6 -> fde0ae20), back on a65da6c784 at 21:26 UTC with the interface up, the queue empty, tailscaled up. Device-facts rows, RECORD Device lines, catalog and #236 updated.
  - **What remains**: the soak (the maintainer plays offline for hours, then Wi-Fi back); afterwards read `journalctl` on the device through the credential filter (the exit syncs, the proxy's flush, the save state captures), the sign-in window's memory on the handheld's GPU path (#228; ask by name before any action that is not a read), then the call (step 5) as a #236 comment with the device facts and the catalog updated in the same change (D-WORKFLOW-046).
- **Step 6, the audit**: `docs/audits/2026_09_25-milestone-rc-round-since-258/` is an untracked, paused audit folder (Phase 1.3) in the primary checkout; the Fable seat returned HTTP 429 (monthly spend limit). Do not commit it until the audit runs.

## Next Steps

1. After the soak: read the device's journal (through the credential filter) and the stamps; put any device-only measurement to the maintainer by name; the call on #236 (step 5); device-facts rows for what the soak showed; `release-catalog --write`.
2. Nothing on the device without a per-action yes: no game launch, no sync, no reboot (D-QA-011/015).
3. The audit (step 6) once the seat decision is made; `ceremony-check` reads it overdue (53 closures since 2026-09-24).
4. The PR series by content in the named buckets (`fork-workflow.md`, D-WORKFLOW-034), #42's docs PR last; builds for the RG SP and the Retroid Pocket Nova (cold build, ~90 GB, hours; `tools/build-preflight` first); each staged on its own yes.
5. #278's five harness gaps and #277's open items are the community's and the harness's follow-ups; #228 stays open on the device GPU-path number; #270 the catalog's preflight column.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `.claude/rules/bugs-are-agent-first.md` | Created | D-QA-051 verbatim, the three classes, rules 1-6 |
| `.claude/rules/generic-x64-vm-testing.md` | Modified | the ES log passage rewritten for the present |
| `tools/rc-preflight` | Created | step 0's check; `--allow-unchecked device-facts` |
| `docs/releases/rc-accept.txt` | Modified | package lines only |
| `docs/releases/catalog.md`, `docs/vm-qa-log.md` | Modified | the a65da6c784 cut |
| `/workspace/artifacts/rocknix-images/{x64,h700}-all-20260925-a65da6c784/RECORD.txt` | Created | outside the repo |

## Related Context

- **Tracker**: #236 (the round), #273 (code traces), #276 (closed), #277 (open items to test), #278 (harness gaps), #270, #228, #42.
- **Register**: D-QA-049 (the plan), D-QA-050, D-QA-051, D-WORKFLOW-047, D-WORKFLOW-048, D-RA-029, D-UI-091.
- **Session files**: `/workspace/tmp/rocknix-session/` (chain-4.log/.rc/.status, proof-178b/c logs, build scripts run52/run32, vmqa-run37, issue-bodies/).
- **Guests**: pair a/b on a65da6c784 (vm-qa's), guest d at 640x480 on a65da6c784 (:10026, pidfile `/tmp/rocknix-qemu-d.pid`); stop by pidfile or monitor, never by pattern.

## Notes for Next Session

- The credential read filter (`grep -v -i -E 'key|pass|token|user|psk'`) drops a line reading `RESULT PASS`; read rc files, or spell verdicts so they cannot match.
- `fork-worktree sync` skips a worktree with uncommitted changes; the build regenerates `documentation/PER_DEVICE_DOCUMENTATION/GENERIC_X64/SUPPORTED_EMULATORS_AND_CORES.md` in generic-x64 -- discard it (`git checkout --`) before syncing.
- The ra-offline suite cannot be re-run until the QA account's Potato-tan Secret is reset again ("progress reset" was the maintainer's word for it).
- ES `HideWindow` was the VM's black-screen cause (#239); `docs/qa-frames/2026-09-25/` holds the before/after frames.
- The build worktrees and the primary are all at `a65da6c784`/`154d722392`; nothing is building.

## Open Questions

- After the soak, the maintainer's read of the play (the source of any new issue, D-QA-012).
- The audit seat: raise the OpenRouter limit, Astra's blind pass first, or another Claude model.

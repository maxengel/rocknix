# Saved Session State

> **Saved**: 2026-09-05T01:54:16Z
> **Branch**: `build/rclone-cleanup` @ `1ed140ce2a` (== `next`, `feature/conflict-resolution`, `build/devices`, `build/generic-x64`, `feature/fast-exit-sync`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution); ES: emulationstation-next `test/qa-integration` @ `ba5cbe9fe` (pinned)

## Current Focus

**Handoff to the conflict-resolution worktree.** This session ran in the old
`~/Development/rocknix.worktrees/rclone-cleanup` checkout instead of the
`/workspace` one the previous stash pointed at, and stayed here because the
maintainer kept raising device findings worth fixing first. All of it is
committed and pushed. The next session opens in
`/workspace/repos/rocknix.worktrees/conflict-resolution` (branch
`feature/conflict-resolution`, at `1ed140ce2a`) and resumes `begin-delivery`
for milestone **"Cloud Saves: Visual Conflict Resolution"** at **Step 2 — the
futro**. Steps 1 through 1.7 were done on 2026-09-04.

Two H700 images were built tonight; the second supersedes the first and is in
the device's `/storage/.update/`, hash-verified, **not yet rebooted into**:

```
target/ROCKNIX-H700.aarch64-20260905.tar   (built 01:42 UTC from 4ff06e737d)
sha256 777dd10962276d93b605345f55cfb48d72bd220aabd4b7d9dfae30e1be81f416
copy:  /workspace/artifacts/rocknix-images/
```

## Completed This Session (since the 2026-09-04 21:03Z stash)

- **The four open questions closed.** D-INFRA-003/004/005 (serval's wired
  outage was a failed ethernet cable, replaced 23:25Z; hub inventory back on
  .53, both addresses' host keys pinned after byte-comparison with serval's
  `/etc/ssh/*.pub`; lorry `2199a91`, `3a55949`, `2a7ee94`, **unpushed**).
  D-QA-003/004 (no ScreenScraper dev id for fork builds; Skraper on a PC is
  the interim route; Skraper 1.4.1 has no CLI — verified against the archive).
  D-CLOUD-027 (conflict-wizard audit log in `/storage/.cache/log/`, because
  `/var` is tmpfs and `/var/log` binds to that dir only in debug mode).
  D-UI-018 (hub SAVE DATA tick and the GAME SETTINGS save rows both stay).
- **Fast exit sync (D-CLOUD-028).** `cloud_backup --recent` (time window from
  the last successful stamp + 600 s, `--no-traverse`, copy forced, no mkdir
  probe, no rmdirs tidy), exit 4 = no default route decided with `ip route`
  in 0.14 s, `pause` no-op under `--yes`, remote name from `rclone.conf`. ES
  exit hook runs `--yes --saves-only --recent`; card shows `Checks:` as
  "COMPARING SAVE FILES WITH THE CLOUD n / m"; exit 4 → SKIPPED. Measured on
  the H700: nothing changed 18 s → 5.3 s; one new save ~10 s; no network 0.14 s.
  Three regression steps in `tools/cloud-round-trip` (still never run, #35).
- **BIOS CHECK rebuilt (D-UI-019).** One page, every system, ordered by what
  needs doing (problems first, games-first among them, complete collapsed),
  per-system drill-down; `rocknix-systems --all` emits PRESENT lines (default
  output byte-identical; launch warning untouched); UNTESTED gets the warning
  triangle. Menu entries read BIOS CHECK. ES `871a2a81f` merged `ba5cbe9fe`.
- **Issues.** #63 filed (tab strips on five remaining screens); #27 got the
  maintainer's spec and acceptance criteria; #42 got the docs follow-up for
  `--recent` and exit 4.
- **Docs.** Register rows D-INFRA-003/004/005, D-QA-003/004, D-CLOUD-027/028,
  D-UI-018/019; `rclone-cloud-sync.md` gained *The game-exit sync* section;
  changelog *Game saves* bullet; IA doc audit-log question settled; work logs
  for 2026-09-04 (four entries) and 2026-09-05 (five entries).

## In Progress

- Nothing in flight. Both builds finished; the second image is on the device
  awaiting the maintainer's reboot.

## Next Steps

1. **Open Claude Code in `/workspace/repos/rocknix.worktrees/conflict-resolution`** and run `session-resume` (it will list this file under the fallback, since the branch names differ).
2. **From there, retire this worktree**: `./tools/fork-worktree remove /home/max/Development/rocknix.worktrees/rclone-cleanup` (no build output; identical to `next`), then `git branch -d build/rclone-cleanup`, then `sudo rm -rf /home/max/Development/rocknix.worktrees` (root-owned 56 KB leftover under `devices/` from a Docker build). Optionally also remove the merged `fast-exit-sync` rocknix worktree and the merged ES worktrees `fast-exit-sync` and `bios-tabs`.
3. **After the maintainer reboots the H700**, confirm `BUILD_ID` is `4ff06e737d`, then observe: BIOS CHECK opens with NDS (4 DSi files missing) and PSX (1 missing, 2 unverified) at the top and Dreamcast / Game Gear / GB family as ALL PRESENT below; a press on a system opens its file list; exit a game → card reads "COMPARING SAVE FILES WITH THE CLOUD" and finishes in ~5 s; Wi-Fi off + exit a game → "SKIPPED - NO NETWORK CONNECTION" at once; exit a game during the boot sync → SKIPPED (still unobserved from the 09-04 list). Screenshots for #63/#27 baselines while there.
4. **`begin-delivery` Step 2 — the futro** for the milestone with the #26 retro as input. Known inputs unchanged: `cloud_device_id` is the identity for #20/#21; slot identity (#24) is critical-path; #22 must use `take_cloud_lock` and must not let bisync rename savestate losers; #9 is a hard dependency of #22; #19 runs on the bench. New input: the audit log lives at `/storage/.cache/log/cloud_audit.log` (D-CLOUD-027) and whether rev 4's SQLite index survives beside it is #20's call; the game-exit sync is where conflict detection will hook in and it now runs `--recent`.
5. **Run `tools/cloud-round-trip` on a VM** (#35) before building the wizard — it carries every deferred criterion plus tonight's three recent-sync steps and has never executed.
6. Post-futro: Step 3 load tasks, Step 4 pre-flight (substrate: `rclone bisync` in 1.75.0; `getNextFreeSlot()`/`copyToSlot()` in the pinned ES).

## Key Files Modified (this session)

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` | Modified | `--recent`, exit 4, `pause`, `first_remote`, no probe/tidy on recent, dead terminal-width probe removed (`8c623d3573`) |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-systems` | Modified | `--all` mode, `BiosStatus.PRESENT`, `quietWhenEmpty` (`c842bbd31d`) |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pinned `ba5cbe9fe` (`4ff06e737d`); intermediate pin `d831eecbb` would not have compiled |
| `tools/cloud-round-trip` | Modified | + three `--recent` steps (`ef4eb48bde`) |
| `.claude/rules/rclone-cloud-sync.md` | Modified | + *The game-exit sync* section |
| `docs/decision-register.md` | Modified | nine rows; D-UI-018 moved from Open to Decided |
| `docs/cloud-sync-changelog.md`, `docs/es-menu-map.md`, `docs/conflict-wizard-ia.md` | Modified | exit-sync bullet; exit 4 beside exit 3; audit-log question settled |
| `docs/work-logs/2026_09-work_logs/2026_09_0{4,5}-work_log.md` | Modified/Created | nine entries across the two days |
| **ES** `FileData.cpp`, `ThreadedCloudSync.cpp` | Modified | `--saves-only --recent`; checks-line wording; exit 4 (`bc199045a`) |
| **ES** `GuiBios.cpp/.h`, `ApiSystem.cpp/.h`, `GuiMenu.cpp` | Rewritten/Modified | one-list BIOS CHECK, `getBiosInformations(system, all)`, entry renamed (`871a2a81f`) |
| **lorry** `fleet/personal/inventory/hosts.yml` | Modified | serval on .53 (wired), corrected history; 3 commits unpushed on the hub |

## Related Context

- **Tracker:** milestone "Cloud Saves: Visual Conflict Resolution" — #11 epic, #19–#25, 9 open / 0 closed, unchanged tonight. New/updated: #63 (tab strips), #27 (spec), #42 (docs follow-up), #35 (round-trip owes a run). Retro: #26 comment.
- **`begin-delivery` state:** Steps 1–1.7 ✓ (2026-09-04); **Step 2 futro — next.**
- **Design:** `docs/conflict-wizard-ia.md` rev 4, `docs/es-menu-map.md`, `docs/es-ui-style-guide.md`, `docs/savestate-compat-test.md`.
- **Hub:** `ssh maxs-mac-mini`; lorry at `~/Development/boxlet-app` **on the mini** (not on serval); converge from `fleet/` with `-K`.
- **Logs:** `/workspace/artifacts/h700-fast-exit-sync.log` (00:47 build), `/workspace/artifacts/h700-bios-check.log` (01:42 build).

## Notes for Next Session

- **Syntax-check ES before every bump.** The H700 cross g++ plus the flags from `build.ROCKNIX-H700.aarch64/build/emulationstation-*/.aarch64-rocknix-linux-gnu/compile_commands.json` with `-fsyntax-only` and the worktree's `es-core/src`/`es-app/src` first on the include path takes seconds and caught an error a pinned commit would have failed the build with. Recipe is in the 2026-09-05 work log.
- **Check the diff landed before trusting a measurement of it.** Two patch scripts aborted on an anchor before writing; the device then re-timed the previous script and it read as the new one.
- **Replacing a tar in `/storage/.update/`**: copy as a dot-prefixed `.part`, verify the hash on the device, `mv` over the old name. The updater's `*.tar` glob never sees the partial and the swap is atomic.
- **Starting rclone costs ~1 s on the A53** (`rclone version`: 997 ms). Any per-run design that spawns it twice has already spent two seconds.
- `fork-worktree sync` skips `build/devices` after a build because the build rewrites `documentation/PER_DEVICE_DOCUMENTATION/H700/SUPPORTED_EMULATORS_AND_CORES.md`; `git checkout -- documentation/` there first.
- `/var/log` is tmpfs on a shipped device; nothing written there survives a reboot unless `debugging` or `/storage/.cache/debug.rocknix`. The device kept tonight's `cloud_sync.log` only because it had not rebooted.
- The H700 is `ssh rg35xxsp` (192.168.1.81); it powers off between sessions — "no route to host" means off, not asleep.
- `saved-session-state-next.md` left alone on purpose (belongs to `next`).

## Open Questions

- **Push lorry** (3 commits ahead on the hub) — maintainer's call.
- **ScreenScraper developer id** for fork builds — deferred (D-QA-003); Skraper meanwhile (D-QA-004).
- **Slot identity across devices** (#24) — before the manifest schema (#20). **Audit-log format** (text vs rev 4's SQLite index) — #20.

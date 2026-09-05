# Saved Session State

> **Saved**: 2026-09-04T21:03:10Z
> **Branch**: `build/rclone-cleanup` @ `d64b174bd3` (== `next`, `build/devices`, `build/generic-x64`, `feature/conflict-resolution`)
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution); ES: emulationstation-next `test/qa-integration` @ `1868061ee7`

## Current Focus

**This session ends here so the working directory can move.** Everything is
committed and pushed; nothing is half-edited. The next session opens in
`/workspace/repos/rocknix.worktrees/conflict-resolution` (branch
`feature/conflict-resolution`, cut from `next`, at `d64b174bd3`) and resumes
`begin-delivery` for milestone **"Cloud Saves: Visual Conflict Resolution"**
at **Step 2 — the futro**. Steps 1 through 1.7 are done (see Related Context).

The clean post-merge H700 build passed (kernel 7.2, `/usr/lib32` intact), the
incremental rebuild layered tonight's fixes, and the resulting image is
consistent with `3624e2e329`:

```
target/ROCKNIX-H700.aarch64-20260904.tar
sha256 233b50f09a38036cc4e7f786e713e972b100e1dc1b6c78198fe692854c232415
copy:  /workspace/artifacts/rocknix-images/
```

Transferred to the H700 (`rg35xxsp`, 192.168.1.81) at `/storage/.update/` and
**verified: device-side sha256 equals the hash above** (21:05Z). Not yet
rebooted into — that is the maintainer's action.

## Completed This Session (since the 15:21Z stash)

- **Ansible hub live.** `maxs-mac-mini` → serval verified with `ansible -m ping`. Fixed serval's stale inventory IP (.53 → .246) and pinned serval's real host keys on the hub. Built in the archived `boxlet` repo first (push rejected); ported to **lorry** (`~/Development/boxlet-app`, remote `forge…/boxlet/lorry.git`), the live successor: `fleet/roles/workspace`, `fleet/blueprints/build-box.yml`, `build_hosts` group, `docs/runbooks/00-workspace-disk.md`, `fleet/scripts/workspace-disk-setup.sh`. lorry commits `705cf94`, `9af4354`, `be718ff`.
- **4 TB volume at `/workspace`** (D-INFRA-001/002). Operator ran the guarded script; Blueprint converged (`/workspace is 3667G`). Build tree relocated: `/workspace/repos/{rocknix,rocknix.worktrees}`, cache `/workspace/cache/rocknix-sources` (38 GB, byte-verified), images `/workspace/artifacts/rocknix-images`. Root disk 36 GB → 734 GB free. Nothing regenerable was copied; the SM8550/RK3326 images and untracked `build-*.sh` were rescued.
- **Near-miss owned and closed structurally.** Instructions named `/dev/nvme1n1`; the new drive enumerated first and that became the boot disk. Not run. `fork-newdrive --identify`, `workspace-disk-setup.sh` auto-select-or-refuse. Blindspot 25.
- **Three cold-build defects.** `lib32→lib` symlink race + 736/783 sysroot symlinks rewritten absolute (#62, upstream); `libyaml` missing `PKG_DEPENDS_HOST` (fixed `071fef34ed`); 15 poisoned packages cleared on resume.
- **Phase mini-retro** posted on #26, pointer on #11. Scoped audit found and fixed three defects: **no cross-caller lock** (boot sync × game-exit sync × menu → two rclone writers; `take_cloud_lock` in all four scripts, exit 3 = SKIPPED in both ES surfaces, `b9ea9f3fe8` + ES `1868061ee7`); **`cloud_migrate_layout` still used `rclone move`** while the changelog claimed otherwise (#57 fixed: `relocate()`/`resumable()`); **`es-menu-map.md` stale since Aug 23** (rewritten). Closed #56, #57, #58, #59, #61 on observed behaviour; eleven unobserved criteria routed to #35 by name.
- **Rule of three → rule.** Blindspot 23 hit three times today; promoted to `engineering-practices.md` (*Before deleting a duplicate, diff its behaviours*) and a `futro` archetype.
- **Registers:** D-CLOUD-024 (wizard ships in this drop), 025 (#19 runs on the bench), 026 (migration copies, supersedes 016), D-INFRA-001/002; blindspots 23 (annotated), 24, 25.
- **Changelog** at `docs/cloud-sync-changelog.md` — running list, claims-document header, not to be posted until the drop is complete. Conflict wizard under "Not in this change" — **to be moved when built**.
- **Mixed-image hazard** found and written down (`worktrees.md`): `fork-worktree sync` under a running build makes later packages build from the new tree. Never sync while `docker ps` shows `rocknix-build`.

## In Progress

- Nothing in flight. The image is on the device and verified; the reboot to
  apply it is the maintainer's.

## Next Steps

1. **Restart Claude Code in `/workspace/repos/rocknix.worktrees/conflict-resolution`.** Then `session-resume`.
2. **Remove the old worktree** this session ran from: `git -C /workspace/repos/rocknix worktree remove ~/Development/rocknix.worktrees/rclone-cleanup` (identical to `next`; nothing unique). Then `sudo rm -rf ~/Development/rocknix.worktrees` — two root-owned dirs (56 KB) from a Docker build are all that's left there. Optionally `sudo systemctl daemon-reload` (fstab hint; cosmetic until reboot).
3. **After the maintainer reboots, confirm** `BUILD_ID` is `3624e2e329`, then exercise: exit a game during the boot sync → card should say SKIPPED; `MATCH THIS DEVICE TO THE CLOUD` preview should show `megadrive|remove|52`.
4. **`begin-delivery` Step 2 — run the `futro`** for the milestone with the #26 retro as input. Its known inputs: `cloud_device_id` is the identity for #20/#21; slot identity (#24) is critical-path; #22 must use `take_cloud_lock` and must not let bisync rename savestate losers; #9 (bisync) is a hard dependency of #22; #19 is runnable on the bench (H700 ×2, RK3326, RK3566, SM8550) and its answer may make #23's badge a convenience rather than a safeguard.
5. **Run `tools/cloud-round-trip` on a VM** (#35) before building the wizard on the same scripts — it has never executed and now carries every deferred criterion.
6. Post-futro: Step 3 load tasks, Step 4 pre-flight (substrate check: `rclone bisync` availability in 1.75.0; `getNextFreeSlot()`/`copyToSlot()` in the pinned ES).

## Key Files Modified (since 15:21Z)

| File | Change | Notes |
| --- | --- | --- |
| `…/rclone/sources/cloud_backup`, `cloud_restore`, `cloud_content_backup`, `cloud_content_restore` | Modified | `take_cloud_lock()` (flock -n, `/var/run/cloud_sync.lock`, exit 3); content_restore also locks `--match --apply` |
| `…/rclone/sources/cloud_migrate_layout` | Modified | `relocate()` copy→check→purge; `resumable()`; zero `rclone move` (#57) |
| `packages/addons/addon-depends/rsyslog-depends/libyaml/package.mk` | Modified | `PKG_DEPENDS_HOST="ccache:host"` |
| `projects/ROCKNIX/packages/ui/emulationstation/package.mk` | Modified | pin `1868061ee7` |
| `tools/fork-newdrive` | Modified | `--identify`, refuses system disks, `/workspace` defaults |
| `tools/cloud-round-trip` | Modified | + lock-contention step |
| `.claude/rules/device-builds.md`, `worktrees.md`, `instruction-files.md`, `generic-x64-vm-testing.md` | Modified | `/workspace` paths; metadata-only rebuild note; late-binding-in-merge; sync-under-build hazard |
| `.claude/rules/engineering-practices.md` | Modified | + *Before deleting a duplicate, diff its behaviours* |
| `.claude/rules/documentation-accuracy.md` | Modified | + `CONTENTPATH`, seven scripts, #42 named |
| `.claude/skills/futro/SKILL.md` | Modified | + replaced-mechanism archetype |
| `docs/es-menu-map.md` | Modified | rewritten to the tree as built |
| `docs/cloud-sync-changelog.md` | Created | running list; claims header |
| `docs/decision-register.md`, `docs/blindspot-register.md`, work log | Modified | rows/entries above |
| `.github/sessions/archived/…-20260904T152108Z.md` | Moved | prior state, archived |
| **ES** `FileData.cpp`, `ThreadedCloudSync.cpp`, `GuiCloudTransfer.cpp`, `GuiMenu.cpp`, `GuiBios.cpp` | Modified | game-exit sync in ES; SKIPPED; match row; save rows restored; CHANGE CLOUD FOLDER |
| **lorry** `fleet/roles/workspace`, `fleet/blueprints/build-box.yml`, `fleet/personal/inventory/hosts.yml`, `fleet/scripts/workspace-disk-setup.sh`, `docs/runbooks/00-workspace-disk.md` | Created/Modified | the hub side |

## Related Context

- **Tracker:** milestone "Cloud Saves: Visual Conflict Resolution" — #11 epic, #19–#25, 9 open / 0 closed, breadcrumbs left on #19/#20/#21/#22/#24. Retro: #26 comment. Deferred criteria ledger: #35. Upstream build defects: #62. Docs drift: #42.
- **`begin-delivery` state:** Step 1 (no prior retro → ran `mini-retro`) ✓; 1.5 (no Epic close-out audit due) ✓; 1.6 (#60 closed) ✓; 1.7 (grounding: `cloud_device_id`, #19 protocol written) ✓; **Step 2 futro — next.**
- **Design:** `docs/conflict-wizard-ia.md` rev 4 (wireframes linked inside), `docs/es-menu-map.md`, `docs/es-ui-style-guide.md`, `docs/savestate-compat-test.md`.
- **Hub:** `ssh maxs-mac-mini` (key `~/.ssh/ansible_hub_ed25519`); lorry at `~/Development/boxlet-app`; converge from `fleet/` with `-K`.
- **Logs:** `/workspace/artifacts/h700-clean-build3.log`, `h700-incremental.log`.

## Notes for Next Session

- **Read `.claude/rules/` from `next`**, not from memory — three rules and a skill changed tonight.
- **`fork-worktree sync` is not safe under a running build.** `docker ps` first.
- **Background watchers get killed under the harness's memory heuristic** (it reads "free", not "available"). Use `Monitor` with a bounded script, or short foreground polls.
- **busybox:** no `find -newermt`, no `-printf`, no `date -d "8 hours ago"`; `pgrep -f` matches its own watcher (bracket the pattern); never silence a probe's stderr.
- **rclone piped progress format** is documented in `rclone-cloud-sync.md`; `--progress-terminal-width` does not exist in 1.75.0.
- **`SOURCES_DIR=/workspace/cache/rocknix-sources`** for native builds; the docker recipe bind-mounts it (`build-dev.sh` in the devices worktree, untracked, also kept in `/workspace/artifacts/rocknix-build-scripts/`).
- **Device access:** `ssh rg35xxsp`; `/var/log` is tmpfs.
- The changelog is a running list — add to it as each conflict-milestone piece lands; nothing posted until the drop is complete (maintainer, 2026-09-04).
- `saved-session-state-next.md` left alone on purpose (belongs to `next`; this branch equals `next`, so deleting it here would propagate silently).

## Open Questions

- **Hub's BACK UP / RESTORE `SAVE DATA` tick** overlaps the three restored save rows in GAME SETTINGS. Leave or remove — asked twice, unanswered.
- **Scraper route** while ScreenScraper is compiled out of fork builds (no `SCREENSCRAPER_DEV_LOGIN`): official-release round trip, PC scraper, or IGDB now / re-scrape later.
- **Audit log** (conflict wizard): location, retention, visible or support-only.
- **Slot identity across devices** (#24) — must be decided before the manifest schema (#20).
- **Router reservation for serval** (192.168.1.246) — offered by the maintainer; makes the Ansible bootstrap address durable.

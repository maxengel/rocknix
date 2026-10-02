# Saved Session State

> **Saved**: 2026-07-27T22:15:39Z
> **Branch**: next
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

Cloud saves + backup/restore program. All feature code is written, compile/build
verified, and pushed; the gate is the maintainer's **fresh-handheld round-trip QA**
(issue #26) in the QEMU/UTM image. Two user-raised improvements were being
discussed when the session ended (see Open Questions) — neither is implemented.

## Completed This Session

- **rclone cleanup shipped upstream**: PR ROCKNIX/distribution#3055 (squashed,
  rebased, commit-style green) + docs PR ROCKNIX/rocknix.org#176. Closed fork
  issues #5 and #6.
- **Cloud Saves feature set** (`feature/cloud-saves` @ `88bb93a225`): headless
  flags (`--yes/--method/--update/--system-only/--saves-only`), startup +
  game-exit sync hooks, `cloud_setup` (rclone web GUI + QR, auto-login token,
  advertised-URL override), `cloud_content_backup`/`cloud_content_restore`,
  rclone bumped to 1.74.4, new `qrencode` package.
- **backuptool baseline** (`feature/backuptool-baseline` @ `233d38ba9f`):
  integrity-checked restore that actually reboots, error reporting, ES-config
  symlink safety, secret stripping (wifi/root/RA/netplay/ScreenScraper),
  archive rotation, restore marker.
- **EmulationStation** (fork `maxengel/emulationstation-next`): CLOUD TOOLS
  group in Game Settings (`feature/cloud-sync-menu` @ `1ac36314b`),
  truthful backup/restore dialogs + cloud entries + FINISH RESTORE SETUP
  password page + journey continuation (`feature/backup-restore-dialogs` @
  `bd39c8971`), background sync via `ThreadedCloudSync` with live output.
- **QA infrastructure** (`feature/generic-x64`): VM profile v3 (NAT default,
  per-bundle UUID/MAC, debug logging), `--net lan|bridged`, launcher→guest
  host-IP injection via fw_cfg + `095-cloud-url` quirk, README troubleshooting.
- **Process/docs**: `AGENTS.md`, `es-native-ui.instructions.md`, console-first
  rule + pre-push content guard, squash policy + upstream CI commit rules,
  six agent skills added under `.claude/skills/`.
- **Planning**: conflict-resolution milestone with epic #11 and tasks #19–#25,
  plan at `plans/conflict-resolution/vita-style-conflict-resolution.md`;
  journey epic #26; QoL issue #27.

## In Progress

- **Issue #26 round-trip QA** (the gate for everything else)
  - **Current state**: image published and booting; UTM networking resolved
    (Emulated VLAN + forward). Maintainer began testing `cloud_setup`.
  - **What remains**: run setup → Restore Everything → play → Back Up
    Everything → repeat on a second fresh disk; report defects.

- **Two improvements requested at session end** (nothing written yet)
  - **UTM-side QR override**: make the `.utm` bundle advertise a reachable
    host address like the Linux launcher does (fw_cfg injection is
    launcher-only today), while non-VM targets keep showing the handheld's
    own IP.
  - **Double password prompt**: `cloud_setup` sets `--rc-user/--rc-pass`
    (basic auth) *and* the rclone web GUI then asks again. Question is
    whether to drop our basic-auth layer and rely solely on rclone's own
    auth wall.

## Next Steps

1. Wait for / act on maintainer's #26 round-trip results; fix defects on the
   existing feature branches.
2. Implement the two open items above once decided (see Open Questions).
3. Get the `bugfix` label applied to PR #3055 (release freeze) — only remaining
   check failure; then merge, and rebase the stacked branches.
4. Assemble the remaining upstream PRs in order: cloud-saves → backuptool →
   the two ES PRs (+ paired rocknix.org docs branches already prepared).
5. Start the conflict-resolution milestone at #19/#20.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup` | Created | QR + web GUI setup; honors `/storage/.config/cloud_setup_url` override |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_{backup,restore}` | Created | Explicit ROM/BIOS transfer, copy-only |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_{backup,restore}` | Modified | Headless flags, phase selection, safety fixes |
| `projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves` | Created | Boot-time bidirectional sync when enabled |
| `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool` | Modified | Full baseline rewrite |
| `packages/sysutils/qrencode/package.mk` | Created | QR generation for cloud setup |
| `projects/ROCKNIX/devices/GENERIC_X64/vm/{generic-x64-vm,profile.json,README.md}` | Modified | VM profile v3, net modes, fw_cfg injection, troubleshooting |
| `projects/ROCKNIX/packages/hardware/quirks/platforms/GENERIC_X64/095-cloud-url` | Created | Publishes advertised URL from fw_cfg |
| `es-app/src/guis/GuiMenu.cpp`, `es-app/src/main.cpp`, `es-app/src/ThreadedCloudSync.*` | Modified/Created | ES cloud + backup UX (separate repo) |

## Related Context

- **Plan**: `plans/conflict-resolution/vita-style-conflict-resolution.md`
- **Instructions**: `.github/instructions/{rclone-cloud-sync,es-native-ui,fork-workflow,documentation-accuracy}.instructions.md`
- **Work logs**: `docs/work-logs/2026_07-work_logs/2026_07_2{3,4,5,6}-work_log.md`
- **Tracker**: fork issues #26 (journey epic), #18 (backuptool), #15 (native ES),
  #11 + #19–#25 (conflict-resolution milestone), #27 (label wrap QoL)
- **Upstream**: ROCKNIX/distribution#3055, ROCKNIX/rocknix.org#176
- **QA build**: https://github.com/maxengel/rocknix/releases/tag/dev-generic_x64-20260726

## Notes for Next Session

- **Worktrees**: `rclone-cleanup` → `feature/cloud-saves`; `backuptool-baseline`;
  `generic-x64` → `test/qa-generic-x64` (owns the big build cache — always build
  there). All trees clean at stash time.
- **QA branches are throwaway**: `test/qa-integration` (both repos) and
  `test/qa-generic-x64` carry an ES package pin to the fork — never PR them.
- **Build loop**: from the generic-x64 worktree,
  `make docker-GENERIC_X64 DOCKER_EXTRA_OPTS='-v /home/max/Development/rocknix/.git:/home/max/Development/rocknix/.git'`;
  delete `build.*/.stamps/image/build_target` when only scripts changed;
  publish with `tools/fork-publish-release GENERIC_X64 prerelease`.
- **Console-first rule is enforced mechanically** by `.githooks/pre-push`:
  no QEMU/VM/port-forward wording in product scripts on `pr/*` branches.
- **Upstream CI** requires `package: text` commit titles (no spaces before the
  colon), ≤72 chars, blank line before body, body lines ≤72, no merges.
- **Agent-tooling gotcha**: quoted bash heredocs strip backslashes — build C++
  replacement strings with `chr(92)` when patching via python.
- **UTM matrix**: bridged hangs (vmnet continuation leak, 4.7.5 + beta);
  "Default (private)" boots but disables port forwards; **Emulated VLAN** is
  the supported QA path (`http://<mac-ip>:15572`).

## Open Questions

- **UTM QR advertisement**: how should the `.utm` bundle learn a reachable host
  address (no launcher runs on macOS)? Options: bake a first-boot prompt, ship
  a helper script the tester runs once, detect the vmnet gateway
  (`192.168.64.1`) and assume the host, or leave it manual via
  `/storage/.config/cloud_setup_url`.
- **Single auth wall**: drop `--rc-user/--rc-pass` basic auth from
  `cloud_setup` and rely on rclone's own web-GUI login? Need to confirm the
  GUI's auth is a real gate (not just a UI form over an open API) before
  removing the HTTP-level protection.

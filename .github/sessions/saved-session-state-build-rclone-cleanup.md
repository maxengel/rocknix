# Saved Session State

> **Saved**: 2026-09-04T15:21:08Z
> **Branch**: `build/rclone-cleanup`
> **Repo**: maxengel/rocknix (fork of ROCKNIX/distribution)

## Current Focus

Cloud-sync work is feature-complete for this round and **built into an image already
sitting on the test device**. The session ended waiting on hardware: a Samsung 990 PRO
4 TB has arrived and is about to be fitted, and the post-upstream-merge rebuild is
deliberately deferred until it is in, because the primary disk has 37 GB free against
598 GB of now-stale build roots.

Nothing is half-edited. Working tree is clean, everything is pushed, and
`next == build/devices == build/generic-x64 == build/rclone-cleanup == 51f5c58d56`.

## Completed This Session

Eight reported UI/UX items, plus what investigating them uncovered:

- **Transfer status page** (`GuiCloudTransfer`) now reports rate, bytes, ETA and the
  file being moved. Three separate causes, all silent: `BusyComponent::onSizeChanged`
  returns at zero size and the page never gave it one; rclone ends each `--progress`
  redraw *without* a newline so the next `Transferred:` is glued on; `--stats-one-line`
  discarded the per-file block. Parser written against bytes captured off the device.
- **Removed the drawn borders** from `AsyncNotificationComponent` and the transfer page
  (D-UI-016) — they made a RetroAchievements sync look like another app's widget.
- **Game-exit save sync moved into ES** (`FileData::launchGame` → `ThreadedCloudSync`),
  replacing a silent OS hook that backgrounded output to `/dev/null`.
- **Last-run times** follow the system locale and `ClockMode12`.
- **BIOS page** distinguishes "nothing missing" from "nothing on this tab".
- **`cloud_content_restore --match`** (#61) — the third content action, with UI in the
  cloud hub. Previews, confirms, then runs in the transfer page.
- **gamelist.xml** rides its own `--update` pass so the freshest list wins.
- **Dropbox conflicted copies cleaned** — 21 directories merged and removed on both
  sides, 0 kept, 970 files preserved. `CONFLICT_EXCLUDES` stops it recurring.
- **Upstream merge**, 133 commits, base 2026-08-18. Six conflicts, all resolved.
- **rclone `PKG_SHA256`** pinned for 1.75.0 and proven by a build.

Bugs found that were **not** in the reported list:

- `--match` ran with **no save exclusions at all** — the arrays were defined below the
  case statement that calls them, so bash expanded them to nothing. A preview listed
  `Mega Man & Bass (USA).srm` among files it would delete. (blindspot 24)
- `gamelist.xml` was in the deletion set for every system — the *only* deletion several
  systems had.
- `ppsspp-lr`'s x86_64 flag strip referenced `${PKG_BUILD}` at file scope, so it had
  been editing `/CMakeLists.txt` and **had never once worked**.
- A multi-tier transfer reported success when an earlier tier failed (`A ; B ; C`
  returns C's status).

Regression: three save rows were removed as "duplicates" and had to be restored, along
with `CHANGE CLOUD FOLDER` which went silently with the Network Settings group.
(blindspot 23, D-UI-017)

## In Progress

- **New 4 TB NVMe install**
  - **Current state**: drive in hand, not yet fitted. `tools/fork-newdrive` written,
    tested for syntax, registered in the pre-push guard.
  - **What remains**: user fits it in a free Gen4 M.2 2280 slot, partitions and
    formats, then the tool does the rest.
- **Post-merge rebuild**
  - **Current state**: deferred by choice. All build roots are stale.
  - **What remains**: rebuild H700 on the new drive; RK3566 and SM8550 still parked.

## Next Steps

1. **User fits the drive**, then:
   `sudo parted /dev/nvme1n1 mklabel gpt && sudo parted -a optimal /dev/nvme1n1 mkpart primary ext4 0% 100% && sudo mkfs.ext4 -L rocknix-build /dev/nvme1n1p1`
2. Run `./tools/fork-newdrive /dev/nvme1n1p1` — fstab by UUID, mount, `worktree prune`,
   re-create the three build worktrees, copy only `sources/` (38 GB). It stops before
   deleting the old tree; verify, then `sudo rm -rf ~/Development/rocknix.worktrees.old`
   to reclaim ~598 GB.
3. `make docker-image-pull` **before** the first build — `DOCKER_IMAGE` is `:latest` and
   a cached image can be months old (`device-builds.md`).
4. Rebuild H700 from clean (`build-dev.sh H700`, recreate it — it is untracked and lives
   in the old tree). Kernel moves 7.1.2 → 7.2, so this is a long build.
5. Verify the image, ship, and have the user test `MATCH THIS DEVICE TO THE CLOUD`
   against the real `megadrive|remove|52|53193852` case.
6. Resolve the two open questions below before more UI churn.

## Key Files Modified

| File | Change | Notes |
| --- | --- | --- |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore` | Modified | `--match` / `--match --apply`; `METADATA_EXCLUDES`; exclude arrays lifted above the case statement; gamelist `--update` pass |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup` | Modified | `--list-sizes`; `content_files()`/`content_bytes()`; `CONFLICT_EXCLUDES`; gamelist pass |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`, `cloud_restore` | Modified | `--stats 1s` replaces `--stats-one-line` |
| `projects/ROCKNIX/packages/network/rclone/sources/cloud_saves_gameend.sh` | Deleted | ES owns the game-exit sync now |
| `projects/ROCKNIX/packages/network/rclone/package.mk` | Modified | `PKG_SHA256` for 1.75.0, both arches; game-end hook install removed |
| `projects/ROCKNIX/packages/linux/package.mk` | Modified | merge: H700 → 7.2, `GENERIC_X64` added to the `RK3326\|AMD64` arm |
| `projects/ROCKNIX/packages/emulators/libretro/ppsspp-lr/package.mk` | Modified | merge: upstream Wayland block kept; fork's x86_64 strip moved into `post_unpack()` |
| `scripts/mkimage` | Modified | merge: took upstream's removal of the `bootia32.efi` copy |
| `tools/fork-newdrive` | Created | move build worktrees to a new disk without migrating build roots |
| `tools/cloud-round-trip` | Modified | 2 new steps: sync-conflict artifacts, gamelist newest-wins |
| `.githooks/pre-push` | Modified | `tools/fork-newdrive` added to `PERSONAL_PATTERNS` |
| `docs/blindspot-register.md` | Modified | entries 23 and 24 |
| `docs/decision-register.md` | Modified | D-UI-015/016/017, D-CLOUD-022/023 |
| `.claude/rules/device-builds.md` | Modified | metadata-only changes rebuild everything; late binding in a merge |
| `.claude/rules/rclone-cloud-sync.md` | Modified | rclone's piped progress format |
| `.claude/rules/engineering-practices.md` | Modified | 4th "guards must fail closed" case |

**EmulationStation** (separate repo, `~/Development/emulationstation-next`):
`GuiCloudTransfer.{h,cpp}`, `GuiMenu.cpp`, `GuiBios.cpp`, `FileData.cpp`,
`AsyncNotificationComponent.cpp`. Branch `feature/cloud-setup-polish`, merged to
`test/qa-integration` at `11de9e22c`, which is what `package.mk` pins.

## Related Context

- **Tracker**: #61 (match action — backend + UI landed, round-trip coverage outstanding),
  #60 (audit), #59, #58, #57, #56
- **Registers**: `docs/decision-register.md`, `docs/blindspot-register.md`
- **Work log**: `docs/work-logs/2026_09-work_logs/2026_09_04-work_log.md`
- **Rules**: `.claude/rules/rclone-cloud-sync.md`, `device-builds.md`, `es-native-ui.md`
- **Safety tags**: `backup/devices-pre-sync-20260904`,
  `backup/generic-x64-pre-sync-20260904` — the build branches' pre-reset state

## Notes for Next Session

**The image already on the device is pre-merge and that is intentional.**
`/storage/.update/ROCKNIX-H700.aarch64-20260904.tar`, sha256
`253fb81cc0f95a175cd39854c6dced0976c485fc19cebddb4b0a1685cc111340`, verified on both
ends. It carries every feature from this session on kernel 7.1.2. The user had not
rebooted to apply it when the session ended. Do not rebuild just to "catch it up" —
that costs hours and changes the kernel underneath a test in progress.

**Device access**: `ssh rg35xxsp` (192.168.1.81), H700 / RG35XX SP. Root, no password.
`/var/log` is tmpfs — it clears on reboot, so evidence of a failed background job
disappears with it.

**busybox, not GNU.** `find` has no `-newermt` and no `-printf`; `date -d "8 hours ago"`
fails. Using either with `2>/dev/null` produces a confident wrong answer — this cost a
false statement to the user this session. Use `-mmin`, and never silence stderr on a
probe.

**Verifying an rclone claim**: run the same command by hand and compare. That is what
caught the empty-exclusions bug — the script said 1 deletion, the hand-run said 0, and
the gap was the finding.

**Build system**: `calculate_stamp` hashes the package *directory*, so upstream's
`PKG_SHA256` sweep across 220 recipes invalidates all of them. 446 `package.mk` files
changed in the merge; effectively nothing in any build root is still valid.

**Do not migrate build roots to the new drive.** They are all stale. `sources/` (38 GB,
content-addressed) is the only thing worth copying — `fork-newdrive` already does
exactly this.

**`tools/cloud-round-trip` has still never been executed.** It has grown several steps
this session that are correct by construction and untested by running. It needs a device
it can be destructive against — a GENERIC_X64 VM, not the handheld, which would mean
adding a second rclone remote and changing what `rclone listremotes | head -1` returns
for real use.

**ScreenScraper**: absent from our builds because `SCREENSCRAPER_DEV_LOGIN` is a
build-time define supplied from CI secrets, and it is a *developer* credential, not the
user's paid account. `scripts/get_env` dumps every exported var into `.env`
(gitignored), so `export SCREENSCRAPER_DEV_LOGIN='devid=…&devpassword=…'` before a build
is all that is needed if a devid is ever obtained. IGDB and ArcadeDB *are* compiled in.

**`saved-session-state-next.md` was left alone.** It belongs to `next`, this branch is
currently identical to `next`, and deleting it here would propagate silently.

## Open Questions

- **The hub's BACK UP / RESTORE flow keeps a `SAVE DATA` tick** that overlaps the three
  restored save rows in Game Settings. Leave it (a backup that cannot include saves is
  strange) or drop it so saves live in exactly one place? Asked twice, not yet answered,
  and the reason it is still open is that two menu reversals already happened today.
- **Which scraper route** the user wants: scrape on an official ROCKNIX release then
  update back (genuine ScreenScraper art, `/storage` survives both hops); scrape from a
  computer with Skyscraper/Skraper; or use IGDB now and re-scrape later.
- **Separate filesystem vs extending the LVM volume group** for the new drive.
  `fork-newdrive` assumes a separate filesystem mounted at
  `~/Development/rocknix.worktrees`; extending `/` would need no path changes but spans
  one filesystem across two disks.

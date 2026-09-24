# Research Notes — Milestone "Stable before upstream", the work since audit #129

**Auditor:** Code Auditor skill (Claude Fable 5.1, `xhigh`)
**Date:** 2026-09-13
**Subject:** Distribution `next` `53f390b1e9..59103cd9cb` (`projects/`, `packages/`, `tools/`, `.githooks/`); EmulationStation `test/qa-integration` `52012829cf..3466b36af7`; issues #45 #142 #50 #93 #47 #27 #149 #66 #67 #68 #69 #82 #113 #129
**Spec:** the issue bodies on `maxengel/rocknix`; `docs/decision-register.md` rows D-CLOUD-008, D-CLOUD-123, D-NET-002, D-NET-003, D-UI-050, D-UI-051, D-WORKFLOW-010/013/014, D-QA-016

---

## Running Notes

### 1.1 The spec, as it exists

There is no planning document. The specification is the acceptance-criteria checklists in the fourteen issue bodies, and the register rows that record what was decided while implementing them. Both were read in full from the tracker (`gh issue view --json`, saved to the session scratchpad) and from `next`.

### 1.2 Issues — state and acceptance-criteria inventory

| Issue | State | Ticked / total | Unticked boxes (verbatim, shortened) |
| --- | --- | --- | --- |
| #45 backuptool pruning | OPEN | 5/6 | "The same on hardware … once a build carrying `4fae9fe2e4` is staged" |
| #142 FTP absent-not-broken | CLOSED completed | 4/4 | — |
| #50 per-unit hostname | OPEN | 5/7 | "Two same-family handhelds … reachable by their names (the router's view)"; "`<name>.local` resolves from a laptop on the LAN" |
| #93 help bar after delete | CLOSED completed | 2/2 | — |
| #47 FINISH RESTORE page | **CLOSED completed** | **1/5** | descriptions on every row; the icon distinguishes not-set from problem; LATER says where; reviewed on a small panel |
| #27 tile labels | CLOSED completed | 2/2 | — |
| #149 help bar at 640x480 | CLOSED completed | 2/2 | — |
| #66 ScreenScraper messages | OPEN | 5/6 | "Both cases observed on the H700" |
| #67 scraper filters persist | OPEN | 4/8 | two systems deselected survive; opened from a game list; SCRAPE NOW uses the shown values; H700 |
| #68 RA web API key | OPEN | 5/6 | "Observed on the H700" |
| #69 theme tools icons | OPEN | 4/6 | H700; patch offered upstream |
| #82 screenshots list | OPEN | 3/4 | "Then on a handheld" |
| #113 retry bound | OPEN | 3/4 | Dropbox on the maintainer's device |
| #129 prior audit | CLOSED completed | 3/3 (+10/12 punch items) | PL-06, PL-07 open |

Red flag at the inventory stage: **#47 is closed with four of five boxes unticked.** Its closing comment (per the work log 03:50) says "#47 closed" on the strength of the FINISH RESTORE PROCESS page at boot — neutral icons, one line under each row, LATER KEEPS THIS LIST. If the page does all four, the body was not updated when it closed (issue-tracking.md: a decision that lives only in comments will be missed; blindspot 27). If it does not, the close is wrong. Phase 2 re-derives all five from the ES source, not from the frames alone.

### 1.3 Git history — what changed

**Distribution, 19 commits touching the four scope directories** (52 commits in the range overall; the rest are `docs/` and register commits, outside the frozen code scope but read as evidence):

```
519f40aa0c emulationstation: bump package (#66, the no-account case)
55c991d5a4 tools/qa-accounts: the ScreenScraper lines travel over stdin and the report reads the file back
c7634bcbda tools/qa-accounts: a ScreenScraper developer pair alone is enough
1864d92eb0 tools/qa-accounts: a QA test account goes from ~/.ROCKNIX/qa-accounts into a guest, and nowhere else
947072a988 emulationstation: bump package (#66, #68 in French)
62c6cd66d0 emulationstation: bump package (#66, every ScreenScraper status named)
697aa68e29 emulationstation: bump package (#66)
e76bafe860 avahi: the mDNS responder is on, after the device has its name (#50, D-NET-003)
cc2a9bfd3a cloud-round-trip: under the WebDAV stale-PUT lock the post-re-run match is skipped too (#113)
bedc51992d cloud-round-trip: LINK5 pads the settings archive so the cut can land (#113, #45)
db6b42c180 emulationstation: bump package (#27, fourth cut)
5776ede212 emulationstation: bump package (#27, third cut)
02f368914e emulationstation: bump package (#27, #47)
af9295025a network-base: the written name survives hostnamed; vm-qa proves two names (#50)
d857ba04c9 network-base-setup: the shipped device name becomes this unit's own (#50)
b1fdf555ad docs: D-WORKFLOW-013 -- the duplicate D-INFRA-008 re-keyed; tools/register-check guards the register (#129 PL-08)
878ec8863b emulationstation: bump package (#93, #27)
6c13475947 rclone: a missing cloud folder is judged by its parent, not rclone's exit code (#142)
4fae9fe2e4 backuptool: shipped content does not travel (#45)
```

Files (546 insertions, 19 deletions): `.githooks/pre-push` (+2), `avahi/package.mk` and `avahi-daemon.service`, `rclone/sources/cloud_content_backup` (+11), `cloud_content_restore` (+39), `cloud_setup` (+41), `rocknix/sources/scripts/backuptool` (+67/−?), `systemd/scripts/network-base-setup` (+38), `system.d/network-base.service` (+9), `ui/emulationstation/package.mk` (7 pin bumps), `tools/cloud-round-trip` (+25), `tools/last-good-scripts-test` (+140), `tools/qa-accounts` (new, 84), `tools/register-check` (new, 71), `tools/vm-qa` (+22).

**EmulationStation, 24 commits (10 merges + 14 substantive)** on `test/qa-integration`, 9 files, 373 insertions, 15 deletions: `GuiSaveState.cpp/.h` (+123), `ScreenScraper.cpp` (+72), `GuiMenu.cpp` (+12), `GridTileComponent.cpp/.h` (+13), `locale/lang/fr/…po` (+45), `CLAUDE.md` (new, 46), `.githooks/pre-push` (new, 75).

Surprising omission checked at 1.2: no theme patch in the distribution range although the prompt names one. To verify in 1.3b below.

### 1.3b The theme patch is outside the range

`git log -- projects/ROCKNIX/packages/ui/themes/es-theme-art-book-next/` → `638eedc5b3 2026-09-05 es-theme-art-book-next: the tools system always shows its image`; `git merge-base --is-ancestor 638eedc5b3 53f390b1e9` → true. The patch `patches/001-tools-always-show-image.patch` predates the scope by eight days, as do #67's and #68's ES commits (`3e7195eb9`, `2bdb5d0e7`, per the 09:10 work-log entry: "three were built on the 5th and never pressed"). **What this range did for #67/#68/#69 is press them** — VM frames and ticks — so the audit of those three is an audit of whether the ticks are observations, and of the code as it stands on `next`/`test/qa-integration` (readable, not in the diff). Recorded so the scorecard does not credit this range with code it did not write.

### 1.3c First reading of the distribution diff — leads, not verdicts

Read in full: `backuptool`, `cloud_content_backup`, `cloud_content_restore`, `cloud_setup`, `network-base-setup`, `network-base.service`, `avahi/package.mk`, `avahi-daemon.service`, `emulationstation/package.mk`, `.githooks/pre-push`.

**backuptool (`4fae9fe2e4`)**
- L1. Identity prune uses `cmp -s /usr/config/<rel> <file>`. `cmp` is not a busybox default applet on every config. If the image lacks it, `cmp -s` exits 127, nothing is pruned, and the archive is silently 16 MB again — blindspot 16's shape (a runtime dependency with no build-time signal). The 9 KB measured on guest c says x64 has it; **check the H700 image tree and busybox config** before crediting the hardware path.
- L2. `grep -v -F -f REGENERABLE` is a fixed-string *substring* match; the comment says "prefix matches". Harmless in practice (the strings begin `/storage/.config/`), inaccurate as written.
- L3. Restore: `tar -xzf … -X SKIP` with `storage/.config/ppsspp/assets/*`. Busybox `tar -X` and its pattern semantics (does `*` cross `/`, are members stored without the leading slash) must be proven under the image's busybox — read case k for whether it runs the image's tar.
- L4. `RC_TAR=$?; rm -f "${SKIP}"; (exit ${RC_TAR})` — the exit status is re-raised in a subshell for whatever follows; **read the lines after the `if/else`** to confirm something consumes `$?` there.
- L5. D-CLOUD-008 says "a restore skips those two prefixes from **any** archive". The diff touches only the tar branch; the zip branch (archives written before the tar switch) lost its `SKIP=""` initialisation and nothing else. **Does the zip branch skip `ppsspp/assets`?** If not, the row over-claims for the oldest archives — the ones on devices flashed before 2026-08-26.
- L6. The empty-list guard (`[ ! -s FILELIST ]`) runs after the prune — correct order; a device whose every config file is a shipped seed gets the "nothing to back up" path, which needs a look at what the player is told.

**rclone scripts (`6c13475947`)**
- L7. `absent_not_broken` walks from the leaf to the root; a root that will not list → 1 (broken); a level that lists and lacks the name → 0 (absent). Traced by hand on `qa-cloud:/QA/Content/ROMs` — correct. On a **bucket remote whose bucket does not exist**, root lists buckets and lacks the name → "not there yet"; `cloud_setup` guards this with `rclone backend features … BucketBased`, `cloud_content_restore`'s scan does not. Consequence: a scan against a non-existent bucket reads as an empty cloud rather than a fault. Note for Phase 3 (not the everyday case; the setter refuses such a name).
- L8. `cloud_setup` now declares `readonly -a RCLONE_LIST_OPTS=(…)`. If `cloud_sync_helper` (sourced?) also defines it, bash refuses the second assignment when either is readonly. **grep both.**
- L9. `cloud_content_backup` uses `"${RCLONE_LIST_OPTS[@]}"` in the new `rclone mkdir`. Is it defined in that script (blindspot 24: a definition below its consumer, or absent — an unset array expands to nothing and the mkdir simply runs unbounded)? **grep.**
- L10. The mkdir's own failure is swallowed (`2>/dev/null`, status unchecked) "left to the copy to report" — acceptable by design if the copy still fails loudly; note.

**network-base (`d857ba04c9`, `af9295025a`)**
- L11. `FAMILY` is read from `/etc/os-release` `HW_DEVICE=`; the shipped `system.hostname` is `@DEVICENAME@` → `${DEVICE}` (`rocknix/package.mk:85`). **Are `HW_DEVICE` and `DEVICE` the same string for every device**, including `DEVICE_ROOT` devices? If they differ anywhere the shipped default is never recognised there and that family keeps colliding.
- L12. `cloud_device_id` lives in the rclone package; `network-base-setup` lives in systemd's. Is the rclone package unconditional in every image? What does `cloud_device_id` need at `network-base.service` time (DefaultDependencies=no, After=local-fs.target)? An id it cannot compute → `UNIT` empty → no rename **and no log line** (the `if [ -n "${UNIT}" ]` has no else) — a silent no-op on exactly the failure that matters.
- L13. `UNIT=$(printf '%s' "${UNIT_ID##*-}" | tr -cd 'a-f0-9' | cut -c1-4)` — busybox `tr -cd` with a range and busybox `cut`: both shimmed in case m? (blindspot 34).
- L14. The unit now orders `Before=systemd-hostnamed.service NetworkManager.service`; `hostnamectl` and `avahi-set-host-name` are gone. A player renaming the device at runtime (NETWORK SETTINGS) — did anything rely on `hostnamectl --transient` for the *live* change, or was it always boot-only? Check the ES rename path and `network-base-setup`'s other callers.
- L15. Upgrade path: a device carrying `system.hostname=H700` is renamed at first boot of the new image (D-NET-002 states it). A player who *typed* their family name as the hostname is renamed too — stated as impossible in the row; recorded as an assumption, not a defect.
- L16. `set_setting system.hostname` at boot writes `system.cfg` inside the window `chksysconfig`'s boot-time verify/backup (blindspot 34) may be reading it. Interaction for Phase 3.5.

**avahi (`e76bafe860`)**
- L17. `ConditionPathExists=/storage/.cache/services/avahi.conf`; D-NET-003 says `avahi.disabled` still turns it off. **Read `avahi-defaults` to confirm the `.disabled` marker suppresses `avahi.conf`**, and grep ES for an avahi toggle that may now do something it never did.
- L18. `After=network.target network-base.service avahi-defaults.service`, default dependencies on → starts in the normal phase, after network-base's early oneshot. Sound.

**pre-push** — two entries added (`tools/register-check`, `tools/qa-accounts`). fork-workflow.md's personal-paths list must name both (audit #129 PL-11 was this list disagreeing). **grep next's copy.**

**ES pin** — `PKG_VERSION` ends at `3466b36af7`, the ES scope's upper bound. Consistent.

### 1.3d Leads resolved or sharpened by the second read (tools, ES, cross-checks)

Resolved against primary sources:
- L4 → `backuptool:576-577` `RC_TAR=$?; rm -f SKIP; (exit ${RC_TAR})` is the last command of the `then` branch, and `backuptool:602` `if [ $? -ne 0 ]` follows the `fi` — `$?` is the tar's status. Sound.
- L8 → `cloud_setup:35` sources only `/etc/profile`; no other `RCLONE_LIST_OPTS` in it. No readonly collision.
- L9 → `cloud_content_backup:131` declares `RCLONE_LIST_OPTS` above its use at `:564`. Defined, bounded.
- L11 → `scripts/image:163` `HW_DEVICE="${DEVICE}"` and `rocknix/package.mk:90` substitutes `${DEVICE}` for `@DEVICENAME@`: the same string for every device. The family comparison holds everywhere.
- The two personal-path lists agree (`fork-workflow.md:33` names `tools/register-check`, `tools/qa-accounts`; `.githooks/pre-push` PERSONAL_PATTERNS has both).

Sharpened or new:
- **L5 confirmed as a gap to grade.** `backuptool:578-600`, the zip branch: `SKIP` collects only entries that are live symlinks (`[ -L "/${ENTRY}" ]`); `ppsspp/assets/*` and `PSP/SYSTEM/CACHE/*` are never added. D-CLOUD-008's "a restore skips those two prefixes from **any** archive" is true for tar archives only. Population affected: zip archives, i.e. those written by images from before `912193b34e` (2026-08-26) — and since `zip` was missing from every image built after upstream's January deletion (blindspot 16), the zip archives that exist are from images built before that. Small population, real over-claim.
- **L12 sharpened into the range's most consequential lead.** `network-base-setup` now runs `cloud_device_id` at ~3 s into boot (`network-base.service`: `DefaultDependencies=no`, `After=local-fs.target …`), on the **first boot of a fresh device** — a moment at which the id file does not exist yet. `cloud_device_id:generate_id` falls back from `ethtool -P` (needs the adapter's driver bound and the interface present) to `/etc/machine-id` (a symlink into `/storage`, "generated on first boot") to the literal `unknown`, and `main` **writes whatever it got** (`write_id`) — "the stored value wins afterwards". Before this range the first caller was a cloud action, minutes into a boot with the network up. If on a handheld the wifi module (SDIO) is not yet bound at 3 s, the identity is seeded from machine-id (or `unknown`) and is permanent: the reflash-stability property (D-CLOUD, `cloud_device_id` header) is lost, the hostname suffix differs after a reflash, and in the `unknown` case every such device shares one cloud folder — the #86 collision class. **Needs evidence:** H700 wifi driver built-in or module; machine-id availability at that point; a guest's journal in monotonic time; `ethtool -P` on virtio.
- **L17 sharpened.** `avahi-defaults.service` has `ConditionPathExists=!…/avahi.conf` and `!…/avahi.disabled` and merely copies the default `avahi.conf`; `avahi-daemon.service` conditions on `avahi.conf` existing. `avahi-defaults` has been enabled since the fork's first commit, so **every device that has booted already has `avahi.conf`** — and on such a device `avahi.disabled` does nothing (it only stops the copy that has already happened). D-NET-003's "`/storage/.cache/services/avahi.disabled` still turns it off" holds only for a device that has never booted. Check whether ES or a script offers a service toggle that removes `avahi.conf`.
- L19. `register-check` matches citations with `D-(CLOUD|UI|QA|WORKFLOW|INFRA|SYS|LAUNCH|NET)-[0-9]{3}` — an enumerated area list and exactly three digits. A row in a new area, or the thousandth row, is never checked for dangling citations (fail-open for those). Low.
- L20. `qa-accounts clear` runs `set_setting $k default` — verify what `set_setting … default` does in `001-functions`; the header says "take both back out".
- L21. `ScreenScraper.cpp:screenScraperFailureMessage` — the account-missing check (`ScreenScraperUser`/`ScreenScraperPass` empty) sits after the status switch, so a 429/430 with no account still gets the status line; the pair probe is fail-closed (`REQ_SUCCESS && body starts "<?xml"`). Remaining checks: HttpReq enum names; the tab names the strings cite (SCRAPER > OPTIONS, SCRAPER > ACCOUNTS) exist as `_()` labels; the French cites the tabs as the French UI names them; every `.po` msgid matches a source string byte for byte; no non-ASCII in the comments before `_()` (es-code-traps).
- L22. `GuiSaveState` constructor calls `helpRowPerc(sheetHeight)`, which reads `mTheme` behind an `!= nullptr` guard — confirm `mTheme` is a `shared_ptr` (null before assignment) and not a raw pointer. Confirm `Window::renderHelpPromptsEarly` makes `Window::render` skip its own draw, and `updateHelpPrompts()` is a no-op off the top page.
- L23. `GuiMenu.cpp` reads `.restore-finish-pending` uncached at two gates. Are there other `exists()` readers of that marker still cached (#129's "change the set, not the site")?
- L24. **#47 closed with four boxes open.** The frames for it were taken on guest b (1280x800) — README — while the fifth box asks for a small panel, and blindspot 41 (written the same day) says a UI frame is read at the handheld's size before it is called done. Read `openRestoreRelink()` and the closing comment.
- L25. ES `CLAUDE.md` says the checks "all run from the distribution checkout" and lists `python3 tests/cloud-oauth-lifetime.py`, which lives in and runs from the ES checkout; ES `.githooks/pre-push:5` says "must not differ from upstream/next" where the code compares `upstream/master`. Doc nits. Verify `core.hooksPath` in the ES clone resolves to a directory holding `pre-push` (blindspot 26).
- L26. `systemd-resolved` logged "using system hostname 'ROCKNIX'" at 1.87 s, before the write at 3.2 s, and a raw write to `/proc/sys/kernel/hostname` sends no hostname1 signal. If LLMNR is on in `resolved.conf`, every device may answer `ROCKNIX` over LLMNR for the whole boot. Check the shipped `resolved.conf`.
- L27. The `.po` names "SCRAPEUR > OPTIONS" / "SCRAPEUR > COMPTES"; one msgid says "UNDER OPTIONS" where its siblings say "UNDER SCRAPER > OPTIONS" (#129 PL-12's "menu path written two ways" shape).

### 1.3e Mechanical checks run (host), and what the guests showed (read-only)

| Check | Command | Result |
| --- | --- | --- |
| Scripts suite | `tools/last-good-scripts-test` | **PASSED**, exit 0, 14.7 s; cases k (8 checks), l (11), m (9) all PASS on the current tree |
| Guards fire? | `BASE_REF=53f390b1e9 tools/last-good-scripts-test --old` | exit 1: **case k fails 4 checks** against the pre-range `backuptool` (seeds travel, assets travel, no log line, the asset overwritten on restore). **Cases l and m print no FAIL** — `--old` swaps in old copies only of the files the earlier cases fetch (`:93`, `:342`, `:422`); case l lifts `absent_not_broken` from `${ROOT}/${RCLONE_REL}` and case m copies `${ROOT}/${NBS_REL}`, both the *current* tree. The tool cannot show those two guards firing (lead L28) |
| Register | `ES_SRC=~/Development/emulationstation-next.worktrees/qa-integration tools/register-check` | exit 0: "233 IDs, each once; every citation in the live documents names a row" |
| Vocabulary | `tools/vocabulary-check` | exit 0: 132 strings judged, 0 wrong, 1 allowlisted (upstream's BACKUP USER DATA) |
| Recipes | `tools/pkgcheck avahi\|systemd\|emulationstation\|rclone\|rocknix` | exit 0 each |
| Syntax | `bash -n` on the 10 touched shell files + ES `pre-push`; `python3 -m py_compile` on `cloud-round-trip`, `vocabulary-check`, `lint-audit-artifacts` | all ok |
| Image trees | `ls image/system/usr/bin/{cmp,tar,tr,cut}` on H700 (`59103cd9cb`) and x64 (`519f40aa0c`) | all busybox links; `ethtool` at `/usr/sbin`; `cloud_device_id` present. L1 resolved: `cmp` is on the device |
| French msgids | script: the 14 fork msgids in `locale/lang/fr` vs `_("…")` in `es-app`/`es-core` | 14/14 match byte for byte |
| Non-ASCII comments | `grep -cP '[^\x00-\x7F]'` on the five changed ES sources | 0 in `ScreenScraper.cpp`, `GuiSaveState.cpp`, `GridTileComponent.*`; 29 lines in `GuiMenu.cpp`, none in this range's hunks (pre-existing string literals; every image today built) |
| ES hook | `git -C ~/Development/emulationstation-next config core.hooksPath`; `ls` of it | absolute path to the qa-integration worktree's `.githooks`, lists `pre-push`. Blindspot 26 satisfied |

**Guests a/b/d (`:10022`/`:10023`/`:10026`), all on `519f40aa0c`, read-only, output filtered:**

- Hostnames `GENERIC-X64-15ca` / `-0964` / `-474c`; id files `GENERIC-X64-15ca35b6b4` / `-0964eed643` / `-474cbdb64c`, mtime 05:35 UTC (this image's first boot). `ethtool -P eth0` reports a permanent address on virtio, and **`md5("<MAC>|unknown")[0:10]` equals each guest's suffix** — the ids were seeded from the adapter at network-base time on the VM. (Says nothing about a handheld's SDIO wifi at that moment; L12 stays open.)
- `machine-id.service` finished at 1.7 s, before `network-base.service` on all three — the machine-id fallback is at least available.
- **The hostnamed ordering holds on all three**: `network-base.service` finished before `systemd-hostnamed.service` started (a: 1.83 < 2.03 s; b: 2.80 < 2.84; d: 2.10 < 2.38). D-NET-002's hostname half is in place.
- **The avahi ordering does not hold.** On guest b `avahi-daemon.service` started at **1.777 s** and logged `Server startup complete. Host name is ROCKNIX.local` at 2.762 s; `network-base.service` started at 2.761 s and wrote `GENERIC-X64-0964` at 2.794 s. The daemon is publishing **`ROCKNIX.local`** for a device whose name is `GENERIC-X64-0964`, and nothing corrects it (`avahi-set-host-name` was removed). On a and d the race was won (a: avahi started 1.85 s after network-base finished at 1.83; d: avahi started 2.04 s, network-base finished 2.10 s, and the daemon read the name during its startup, completing at 3.60 s). No ordering cycle logged.
- **Why: the shipped unit is not the fork's.** `systemctl show avahi-daemon.service -p After` on every guest: `basic.target avahi-daemon.socket system.slice systemd-journald.socket dbus.socket sysinit.target` — **no `network-base.service`**, `TriggeredBy=avahi-daemon.socket`, no `ConditionPathExists`. The x64 image tree confirms it: `image/system/usr/lib/systemd/system/avahi-daemon.service` is **avahi's stock unit** (`Requires=avahi-daemon.socket`, `Type=dbus`, `WantedBy=multi-user.target`), not `projects/ROCKNIX/packages/network/avahi/system.d/avahi-daemon.service`. The fork's edit (`After=… network-base.service`, `Requires=avahi-defaults.service`, `ConditionPathExists=…/avahi.conf`) never reaches the image. Case m's check "the mDNS responder is enabled and orders after network-base" greps the **source** file and passes. Lead L29 — to confirm against the H700 tree and both `package.mk` files.

### 1.3f The avahi root cause, pinned

`scripts/install:72-150` copies a package's `system.d/*.*` into `${INSTALL}` (the image tree) **first**, and `scripts/install:157-` then extracts the package's own `${PKG_INSTALL}` (what `make install` produced) **over it**. Upstream's generic recipe (`packages/network/avahi/package.mk:83`, since `3baf91e87d` 2021-01-19) runs `rm -rf ${INSTALL}/usr/lib/systemd` in `post_makeinstall_target` so avahi's stock units never reach that tarball. The fork's override (`projects/ROCKNIX/packages/network/avahi/package.mk`) is a copy of the generic recipe **minus that line** (`diff`: `83d82 < rm -rf ${INSTALL}/usr/lib/systemd`), so avahi's stock `avahi-daemon.service` and `avahi-daemon.socket` are extracted after the fork's `system.d/avahi-daemon.service` and replace it. `avahi-defaults.service` survives because stock avahi ships no file of that name. Both image trees (x64 `519f40aa0c`, H700 `59103cd9cb`) hold the stock unit; no `avahi-daemon.service.d/` drop-in exists.

Consequences, all in the shipped image: no `After=network-base.service`; no `ConditionPathExists=/storage/.cache/services/avahi.conf` (the daemon runs unconditionally, so neither `avahi.disabled` nor removing `avahi.conf` turns it off); `Requires=avahi-daemon.socket` with socket activation; `WantedBy=multi-user.target` (enable_service read the stock unit's Install section — the `dbus-org.freedesktop.Avahi.service` alias symlink in the tree is the stock unit's). The fork's file has been dead since `9f1fab30f6` — harmless while the service was disabled; `e76bafe860` enabled the service and edited the dead file.

### 1.4 Rules in scope

Every rule under `.claude/rules/` with `paths: "**"` loads for this scope; those with narrower globs that match a changed path: `rclone-cloud-sync.md` (rclone sources, `backuptool`, `cloud-round-trip`, `last-good-scripts-test`), `handheld-evidence.md` (`sysutils/**`, `rocknix/**`, `docs/**`), `packaging-and-patches.md` (`projects/**`), `generic-x64-vm-testing.md` (`projects/ROCKNIX/packages/**`, `tools/vm-qa`, `tools/cloud-test-backend`, `docs/vm-qa-log.md`). Read from `next` in full for Phase 3: `engineering-practices.md`, `upgrade-and-install.md`, `rclone-cloud-sync.md`, `es-native-ui.md`, `es-player-text.md`, `es-code-traps.md`, `es-ui-style-guide.md` (rows/text/glyphs/buttons/gating), `player-language.md`, `issue-tracking.md`, `decision-register.md`, `fork-workflow.md`, `device-builds.md`, `worktrees.md`, `instruction-files.md`, `documentation-accuracy.md`, `learning-capture.md`, `adversarial-council.md`. Also `docs/blindspot-register.md` (41 entries) — the highest-yield face.

Invariants restated for this scope: preserve player progress over recency (no change here touches the conflict rule); backups carry no secrets (`backuptool:377` strips `.key|.password|.token`, and #68's `global.retroachievements.key` falls under it); the sync filter is an allowlist and `--delete-excluded` is restore-side poison (untouched); every change lands on populated devices (upgrade path *and* clean install — the two-face check for `backuptool`'s restore, `network-base-setup`'s rename, and avahi's `avahi.conf`).

### 1.5 Prior-audit provenance map (verdicts sequestered)

| Prior audit | Scope | Who / when | Coverage and trust signal | Carried items |
| --- | --- | --- | --- | --- |
| #129, `docs/audits/2026_09_12-milestone-cloud-saves-since-60/` | ROCKNIX `e98fdd84f7..e1ddfd7ec2`, ES `00a258f9d7..f93acc2a6` | code-auditor, fresh session, 2026-09-12 | Milestone tier; 38 decidable ACs, 17 UNTESTABLE on a host (no guest); 14 findings, 3 High all seam defects; `lint-audit-artifacts --issue 129` re-run today: PASS | PL-06 (an exit sync ES declines to start reports nothing) and PL-07 (rocknix.org docs, #42 OPEN) still unticked on #129; the three High issues #144/#145/#146 are CLOSED |
| #60, `docs/audits/2026_09_03-milestone-cloud-sync-tiers/` | earlier | — | consumed by #129 | none directly |
| Phase-tier retros | none exist for this range — the work log is the nearest thing (13 entries on 2026-09-13) | — | Every fix on 2026-09-13 was framed on the VM the same hour; #27 needed four cuts, each caught at 640x480, none at 1280x800 (blindspot 41) | — |

Per-AC verdicts from #129 are not transcribed here. None of #129's ACs overlaps this range's issues except through PL-06/PL-07 (tracked scope) and PL-08 (resolved by `b1fdf555ad`, which this audit checks as D-WORKFLOW-013).

**Where extra scrutiny is warranted**, from the map and the day's pattern: (a) every #50/D-NET-003 claim about *ordering at boot* was proven on one guest and one boot — races are exactly what one observation cannot prove; (b) #47 was closed by comment with four boxes open and frames at 1280x800 on the day the 640x480 rule was written; (c) case m grades the mDNS ordering by grepping the source unit file; (d) #67/#68/#69 were "built on the 5th and never pressed" — the ticks are this range's only contribution and must be observations, not readings of the code.

### Tier B coverage

The repo has a visual-QA process (`tools/vm-visual-qa`, `docs/qa-frames/`). Frames attached to this range: 33 PNGs under `docs/qa-frames/2026-09-13/`, 16 described in its README, the other 17 named only from issue bodies (#66, #67, #68, #69 frames). Routes covered: the save state manager at 640x480 and 1280x800 (#27/#93/#149), FINISH RESTORE PROCESS at 1280x800 only (#47), SCREENSHOTS list (#82), scraper tab/reopen/fresh (#67), RetroAchievements pages (#68), Tools artwork modes at 640x480 (#69), ScreenScraper dialogs in English and French at 640x480 (#66). No frame of FINISH RESTORE PROCESS at 640x480. No frame at all for #45, #142, #50, #113 (script-side; their evidence is logs and suite output).

### 1.6 Research Summary

- **Planned:** fourteen issues' acceptance checklists plus ten register rows: prune the settings archive (#45), read a missing FTP folder as absent and mkdir before the content copy (#142), per-unit hostname surviving hostnamed and the mDNS responder on (#50), the save state manager's help bar and tile labels at 640x480 (#93/#27/#149), the FINISH RESTORE page's four confusions (#47), ScreenScraper failures named in English and French (#66, D-UI-051), pressing #67/#68/#69/#82 on the VM, LINK5's fixture under the retry bound (#113), the register guarded (#129 PL-08 → D-WORKFLOW-013), the ES fork's rules pointer and guard (D-WORKFLOW-010).
- **Changed:** 15 distribution files (+546/−19) across five packages and five tools; 9 ES files (+373/−15). #67/#68/#69/#82's code predates the range.
- **Constraints:** the invariants above; blindspots 10 (fix forward), 13 (assumed-done), 14/26 (guards with no observed positive; guards bound to a path), 20 (built something other than what was edited), 24 (definition below consumer), 27 (supersession in a comment), 34 (proven under the host's tools), 40, 41.
- **Red flags found in research, to grade in Phase 2/3:** (1) the shipped avahi unit is the stock one — D-NET-003's ordering and off-switch are not in the image, and guest b is publishing the wrong name; (2) `cloud_device_id` now first runs at ~2 s of first boot from a unit with no adapter guarantee, and stores what it gets; (3) D-CLOUD-008 over-claims "any archive" (zip branch); (4) #47 closed with 4/5 boxes open and no small-panel frame; (5) `--old` mode cannot show cases l and m firing; (6) `register-check`'s citation pattern is an enumerated area list; (7) #113's ticks say the numbers are in the QA log — checked below.

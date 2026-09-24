# Retrospective Audit — Milestone "Stable before upstream", the work since audit #129

**Auditor:** Code Auditor skill (Claude Fable 5.1, `xhigh`)
**Date:** 2026-09-13
**Subject:** the same scope as `02-forward-audit.md`, read backwards: what the range built as a whole, what it repeats from the blindspot register, where two subsystems meet, and what should exist but does not
**Spec:** the issue bodies; `docs/decision-register.md`; `.claude/rules/*.md` from `next`; `docs/blindspot-register.md`

---

## Running Notes

## 3.1 Architectural coherence

**A coherent range, with one dead file edited as if it were live.** The nineteen distribution commits and fourteen ES commits each do one thing, and the things fit: the settings archive is pruned on the way out and skipped on the way in (`backuptool`); a missing cloud folder is judged by its parent in the two scripts that ask (`cloud_content_restore`, `cloud_setup`) and created before it is written to (`cloud_content_backup`); the device gets a name and, in the same boot, the daemon that should publish it; the save state manager's geometry is computed once in a shared helper (`helpRowPerc`) so layout and label arithmetic agree; the scraper's failure text is a single function with one probe. The tools grew with the code: cases k, l, m; the pair-identity suite's two names; `register-check`; `qa-accounts`.

Coherence findings:

- **Dead code, edited.** `projects/ROCKNIX/packages/network/avahi/system.d/avahi-daemon.service` has never been the file the image ships (01 § 1.3f). `e76bafe860` added three ordering lines and a comment to it, and `avahi/package.mk`'s new comment describes that ordering as a fact. The recipe's real change — `enable_service avahi-daemon.service` — enabled avahi's **stock** unit. Blindspot 20's shape (built something other than what was edited), on a unit file rather than a source tree.
- **Deliberate duplication, enforced.** `absent_not_broken` exists twice, byte-identical (`cloud_content_restore:325`, `cloud_setup:141`); `RCLONE_LIST_OPTS` is declared `readonly` in five scripts. The scripts share nothing but `/etc/profile`, so this is the house pattern, and case l pins the two copies together (`diff -q`). Acceptable; the cost is that a future edit to one must remember the other, and the check is what remembers.
- **A cross-package call with no declared dependency.** `network-base-setup` (systemd package) calls `cloud_device_id` (rclone package). `systemd/package.mk:11` declares no dependency on it; the tool reaches every image through `virtual/image`'s `PKG_SYNC="synctools"` → `rclone`. Functionally present everywhere ROCKNIX builds; undeclared where the call is made (blindspot 16's shape, without the failure — yet). A missing tool is swallowed by `2>/dev/null` and an `if` with no `else`, so the rename would silently not happen.
- **A string-typed tri-state.** `GridTextProperties::multiLine` is a `std::string` compared to `"true"`/`"false"`, everything else meaning AUTO (`GridTileComponent.h:108-115`). Unusual, documented in place, and it lets a theme omit the property. Fine.
- **Comments that are the design record.** The range's comments are long and accurate (the `backuptool` prune rationale, `absent_not_broken`'s walk, `GuiSaveState`'s three font facts). The one that is wrong is the avahi recipe's ("the unit orders after it").

## 3.2 Project conformance

### Face 1 — instruction files (from `next`)

| Rule | Relevance | Finding |
| --- | --- | --- |
| `engineering-practices.md` § Verify the artifact, not the report | high | ✗ The mDNS ordering was verified from the **source** unit file (case m check 8) and one boot's journal; the shipped unit differs and a second guest shows the failure. |
| § Guards must fail closed | high | ⚠ `network-base-setup:28-34`: an id that yields no hex leaves the family name with no log line — a silent no-rename. ✓ `absent_not_broken` returns *broken* on an unlistable root; the pair probe is fail-closed (`<?xml` required); `qa-accounts` reads the file back. |
| § A failure you find is yours to fix | high | ✓ #149 and the marker cache were found on the way and fixed the same hour; LINK5's broken premise fixed the same night. |
| § Before deleting a duplicate, diff its behaviours | high | ✗ `avahi-set-host-name` was removed as redundant with the daemon reading the name at start. The removed call carried the one property the survivor lacks: it ran **after the write**. On the shipped ordering that property was the whole fix. Blindspot 23's third shape. |
| § Never reboot a device without asking; § If the VM can test it | high | ✓ No handheld touched; every fix framed on the VM first. |
| § Stop after three fixes on the same failure | medium | ✓ #27's fourth cut stopped and read `Font::get`; the cause (double scaling) was found by reading, and written into `es-code-traps.md`. |
| `upgrade-and-install.md` | high | ✓ `backuptool` fixes the restore side for archives already written (tar); ✓ the rename is its own upgrade path (D-NET-002); ✓ #67's keys read their old hard-coded values as defaults. ⚠ zip archives not covered (AC-45-4). ⚠ avahi: every upgraded device has `avahi.conf`, so the daemon starts — intended — but the documented way to turn it off does not exist on any device that has booted. |
| `rclone-cloud-sync.md` § listings carry three retries; § bucket remotes | high | ✓ `RCLONE_LIST_OPTS` on every new listing and on the mkdir; ✓ the setter defers to the provider on buckets. ⚠ "Run a change against more than WebDAV whenever it touches existence checks": #142 ran FTP and WebDAV; the scan's new bucket behaviour (a missing bucket lists as absent at the root and reads as an empty cloud) was not run on MinIO. |
| § Two phases, filter roots; § `--saves-only` | — | · untouched |
| `es-native-ui.md` § tabbed pages, spacing, tiers | medium | ✓ the manager's help bar drawn into the row its layout reserves; confirmations YES-first. |
| `es-ui-style-guide.md` § Rows, Text, Glyphs, Gating | high | ✓ glyph pair (check-circle / empty circle, no triangle); ✓ dim-don't-hide on the cloud row with its description; ✓ LATER left, FINISH right, only FINISH consumes. ⚠ action rows with `multiLine=true` wrap into three-line rows (see face 3, D-UI-023). |
| `es-player-text.md` § Conventions, § Two lines per row, § D-UI-051 | high | ✓ `vocabulary-check` 0 wrong; ✓ every named menu path exists; ✓ 14 msgids byte-identical, French in the file's own style. ✗ `openRestoreRelink` rows at three lines (1280x800 frame). ⚠ `--` as a dash in a player string. ⚠ one string says `UNDER OPTIONS` beside siblings that say `SCRAPER > OPTIONS`. |
| `es-code-traps.md` | high | ✓ ASCII comments (0 non-ASCII in the changed hunks); ✓ uncached `exists()` on the marker; ✓ the three font facts written down the day they were learned; ✓ `renderHelpPromptsEarly`. |
| `player-language.md` | high | ✓ the ScreenScraper lines are two sentences and fit 640x480 (frame). ⚠ #47's descriptions were written long and not cut (step 2), and not sized to the smallest panel (step 3). |
| `issue-tracking.md` § Closing discipline, § Ticking a criterion | high | ✗ #47 closed with 4 of 5 boxes unticked; the closing comment supersedes the body (blindspot 27). ⚠ #113's ticks name the QA log as the home of a number it does not hold. ⚠ #50 box 6 ticked on a mechanism not in the image. ✓ #93/#27/#149/#142 closed with commits and frames; #45/#50/#66-#69/#82 left open with honest unticked boxes. |
| `decision-register.md` | high | ✓ every decision of the day has a row, written the same session (10 rows). ⚠ D-NET-003 records a mechanism the image does not carry; D-CLOUD-008 says "any archive". Both want a new row citing the old ID, never an edit. |
| `documentation-accuracy.md` | medium | ⚠ Five user-visible changes (per-unit device name, `.local` answering, persisted scraper filters, the WEB API KEY row, the ScreenScraper messages) with no rocknix.org change — deliberately last (D-WORKFLOW-014, #42 OPEN on the milestone). Consistent with the decision; the list for #42 grows by five. |
| `fork-workflow.md` | medium | ✓ `PERSONAL_PATTERNS` and the prose list both carry the two new tools; ✓ pin bumps follow merges. ⚠ ES `pre-push:5` says `upstream/next`, the code uses `upstream/master`. |
| `device-builds.md` | medium | ✓ H700 built, not staged (D-QA-015); the pin moved seven times, each after the merge it names. |
| `packaging-and-patches.md` | high | ✓ `pkgcheck` clean on the five packages. ✗ the avahi override is a copy of the generic recipe minus one line that matters (`rm -rf ${INSTALL}/usr/lib/systemd`) — recipe drift with a shipped consequence. |
| `generic-x64-vm-testing.md` | medium | ✓ `SSHO` declared in `vm-qa` (blindspot 40); the pair-identity suite's new assertion says what it proves and what an old image does. |
| `handheld-evidence.md` | medium | ✓ journals read in monotonic time (work log 02:40, and this audit). |
| `least-surprise.md` | medium | ✗ A device that answers `ROCKNIX.local` on one boot and `GENERIC-X64-0964.local` on the next is the opposite of "the same way every time". |
| `time-to-play.md` | low | ✓ nothing on the launch or exit path changed; `network-base-setup` gained one `cloud_device_id` (an `ethtool` and an `md5sum`) per boot on the shipped-name path only. |
| `vm-first.md` | high | ✓ every issue body answers "can this be done on the VM?"; the H700 boxes are named as the only ones left. |
| `learning-capture.md`, `instruction-files.md`, `worktrees.md`, `adversarial-council.md` | low | ✓ work log (13 entries), `es-code-traps.md` extended, blindspots 40 and 41 added; rules read from `next`; two Facilitator seats used for the second opinion (Phase 4). |

### Face 2 — the blindspot register (does the work repeat it?)

| # | Blindspot | Repeated? | Where |
| --- | --- | --- | --- |
| 1 | assumed-undone | ✓ guarded | #67/#68/#69 were read first and found built on the 5th; the session pressed rather than rebuilt (work log 09:10) |
| 6 | verifying a consumed artifact too late | ✓ guarded | the marker cache was found by planting the marker and looking inside the window |
| 7, 10 | archive/symlink; fixing forward only | ⚠ half | tar restore fixed backward; zip restore not (AC-45-4) |
| 13 | assumed-done | ✗ repeated | #50 box 6: a tick on one boot's race outcome and a source-file grep; #113 boxes 1/4 cite a record that lacks the number; #47's comment claims "empty circle when not" from the code |
| 14 | a guard with no observed positive | ⚠ | `--old` cannot make cases l/m fail (their scripts come from the current tree); `register-check` **did** fire on its first run (D-CLOUD-007) — and on this audit's scratch copy |
| 16 | runtime dependency with no build-time signal | ⚠ | `cloud_device_id` called from the systemd package without a declared dependency; `cmp` checked and present |
| 20 | built something other than what was edited | ✗ repeated | the avahi unit |
| 22 | a probe that cannot report absence | ✓ guarded | `absent_not_broken` reports absent **and** broken; case l proves both (`ROOT_DOWN`) |
| 23 | deduplicating by deleting | ✗ repeated | `avahi-set-host-name` removed; its "after the write" property not carried |
| 24 | definition below consumer | ✓ | `RCLONE_LIST_OPTS:131` above `:564` |
| 26 | guard bound to a moved path | ✓ | ES `core.hooksPath` absolute and present; the pointer says to `ls` it |
| 27 | supersession in a comment | ✗ repeated | #47 |
| 31 | a harness agreeing with itself | ⚠ | case m check 8 compares the source to the source; the LINK5 lock SKIP cannot fail on WebDAV (documented as such) |
| 33 | sentinel codes | ✓ | the scan maps a 501-shaped 1 to rclone's own 3, which every reader already understands as "not found" |
| 34 | proven under the host's tools | ⚠ | case k's `tar -X` is the host's GNU tar (`tar` is not in the shim list); busybox `-X` was proven on guest c by hand, not by the suite |
| 36 | one backend mistaken for the contract | ⚠ | #142 was found by the FTP cell and fixed against FTP; the bucket path of the new scan branch was not run |
| 39, 40 | a suite passing over dashes / on the caller's shell | ✓ guarded | `SSHO` declared; pair-identity fails on an old image with the collision named |
| 41 | verified at a size no handheld has | ✗ repeated (once) | #47 closed on 1280x800 frames the same day; #27/#149/#66/#69 were framed at 640x480 |

### Face 3 — project invariants

- **Preserve player progress above all.** Nothing in the range touches the conflict rule or the saves allowlist. The content backup's `mkdir` creates a folder, never deletes. ✓
- **Backups carry no secrets.** `backuptool:377` strips `.key|.password|.token`; #68's `global.retroachievements.key` falls under it; `qa-accounts` prints names only. ✓ — with one QA-tool caveat: `qa-accounts:47` passes the RetroAchievements password and key **as ssh's remote command** (argv), visible in `ps` on both ends while it runs; the ScreenScraper half was moved to stdin for a quoting reason and the RA half was not (D-INFRA-010's "a credential never crosses a script boundary", on a fork-only tool). ⚠
- **The filter is an allowlist; `--delete-excluded` is restore-side poison.** Untouched. ✓
- **Every change lands on populated devices.** `backuptool` tar: both faces ✓, zip ⚠; hostname: both faces ✓ (D-NET-002 states the upgrade path); avahi: upgraded devices start the daemon (intended) and cannot turn it off as documented ⚠; #67 keys ✓; #47 marker gate uncached ✓ (a restore after boot now shows the row).
- **Two lines per row, never three (D-UI-023)** — a player-text invariant by the maintainer's word: ✗ on the FINISH RESTORE page.

## 3.3 Spec fidelity

| Issue / row | Spec said | Built | Divergence |
| --- | --- | --- | --- |
| #45 | exclude `assets/**` and `CACHE/**`; keep `ppsspp.ini`/`controls.ini`; decide Cheats | identity rule + the two prefixes; Cheats by identity (D-CLOUD-008) | none on the backup side; the row's "any archive" restore claim is tar-only |
| #142 | not-yet vs broken by something other than the exit code; create before copy | `absent_not_broken`; `rclone mkdir` first | none |
| #50 | per-unit name; "worth confirming whether [mDNS off] is deliberate before changing it" | rename at boot; maintainer's call to enable; ordering edited on a dead file | the ordering and off-switch D-NET-003 describes are not in the image |
| #93 | refresh prompts after the rebuild | `updateHelpPrompts()` in `loadGrid` | none |
| #47 | neutral not-set glyph; a description per row; gate on a configured remote; LATER says where | all four, plus the uncached marker | descriptions exceed the two-line rule; small-panel review skipped; body not updated |
| #27 | wrap on overflow, no `.po` change | forced wrap, font scale fixed, date fitted, sheet 0.55 | none; the approach grew (four cuts) and D-UI-050 records why |
| #149 | draw the prompts early | `render()` → `renderHelpPromptsEarly` | none |
| #66 | probe `systemesListe.php` body on 401/403; English text naming the credential and the tab | as proposed, plus every documented status named, plus a no-account early return, plus French | the early return means "wrong pair, no account" names the account, where the criterion says "any account, or none" names the pair — a defensible ordering, unrecorded in the body |
| #68 | key stored as `global.retroachievements.apikey` | `global.retroachievements.key` everywhere | the issue's proposed key name differs from the shipped one; harmless, the body is what a reader builds from |
| #113 | bound the retries; record the numbers in the QA log | bounded (D-CLOUD-118/121, earlier); LINK5's premise restored | the 303 s figure is not in the QA log |
| D-WORKFLOW-010 | a pointer and a guard in the ES fork | both, hook path absolute | two doc nits in the pointer and the hook header |
| D-WORKFLOW-013 | rekey in place; a tool that refuses duplicates and dangling citations | done; fires | the citation pattern's area list and three-digit width |

## 3.4 Platform architecture conformance

| Check | Relevance | Finding |
| --- | --- | --- |
| Reference implementation (tenant zero) | · | not a platform; n/a |
| Schema-before-code | · | no schema in scope (the save-manifest schema is untouched) |
| Dogfooding gate | ✓ | every change ran on the GENERIC_X64 pair before an H700 image was built; the H700 image is built and **not staged**, awaiting the per-device yes |
| API-first | · | no API surface in scope |

## 3.5 Cross-system interaction audit

### Interaction: `network-base-setup` (systemd) × `cloud_device_id` (rclone) — the device identity

**State shared:** `/storage/.config/cloud_sync-device-id`, written once and then authoritative ("the stored value wins").
**Wipe risk:** none of deletion; the risk is *creation at the wrong moment*: the first boot of a fresh device now generates the id at ~2 s, from a unit with `DefaultDependencies=no` and no ordering on any network device. `generate_id` falls from `ethtool -P` to `/etc/machine-id` to `unknown`, and `main` stores whichever it reached.
**Test coverage:** PARTIAL — on three GENERIC_X64 guests the id is `md5(<MAC>|unknown)` (adapter-derived, virtio is early); no handheld boot journal exists that places `wlan0` relative to `network-base.service`.
**Finding:** **risky.** On the VM safe; on a handheld with an SDIO wifi (H700 `CONFIG_RTW88_8821CS=y`, firmware from the rootfs) the identity's seed depends on a race the code does not check. machine-id on H700 is itself hardware-derived (`sunxi-sid`), so the fallback id is stable — but it is a *different* stable id from the MAC hash, so which one a device gets depends on boot timing, and a reflash may land on the other. The reflash-stability the `cloud_device_id` header promises, and D-NET-002's "a reflash gives the same name", both rest on this.

### Interaction: `network-base-setup` × `chksysconfig` / `set_setting` — `system.cfg` at boot

**State shared:** `/storage/.config/system/configs/system.cfg` and its last-good record.
**Wipe risk:** a boot-time write inside the window `chksysconfig verify` reads.
**Test coverage:** TESTED indirectly — `network-base.service` is `After=userconfig.service` (where the verify runs); `set_setting` is a single rename (case c); case m runs the whole script against a fixture `system.cfg`.
**Finding:** safe. The rename lands after the verify and before EmulationStation reads the setting; the shutdown-time backup records the new name.

### Interaction: `avahi-daemon` × `network-base-setup` × `systemd-hostnamed` × `systemd-resolved` — who reads the name, and when

**State shared:** the kernel hostname (`/proc/sys/kernel/hostname`), written once by `network-base-setup`.
**Wipe risk:** a reader that caches the pre-write value for the session.
**Test coverage:** TESTED on three guests, read-only, in monotonic time.
**Finding:** three readers, three behaviours. `systemd-hostnamed` — **safe**: ordered `Before=` by the shipped `network-base.service`, started after the write on all three guests. `systemd-resolved` — **safe by its own design**: it started at 1.66 s with `ROCKNIX` and logged `System hostname changed to 'GENERIC-X64-0964'` at 2.796 s (it watches the kernel name), so LLMNR (`+LLMNR` in `resolvectl status`) answers the right name; lead L26 closed. `avahi-daemon` — **broken as shipped**: no ordering, no re-read, and the one call that re-published (`avahi-set-host-name`) removed; on guest b it holds `ROCKNIX.local` for the session.

### Interaction: `backuptool`'s identity prune × `factoryreset` / an emulator bump — what "shipped" means over time

**State shared:** `/storage/.config/<rel>` seeded once from `/usr/config/<rel>`; `/usr/config` moves with every image.
**Wipe risk:** none; a mis-classification risk. A seed the player never edited but which the image has since changed (`ppsspp.ini` v1 on the card, v2 in `/usr/config`) differs from its counterpart and **travels** as if edited; restored onto a fresh device it replaces the v2 seed. The identity rule cannot tell "edited" from "stale seed"; a list of paths could not either.
**Test coverage:** UNTESTED for the stale-seed case (case k's seeds are identical or edited).
**Finding:** safe by intent (a stale seed is still the player's tree as they had it), noted as the rule's known limit; no action.

### Interaction: #45's prune × `cloud-round-trip` LINK5 — a fixture whose premise was a defect

**State shared:** the size of the settings archive.
**Finding:** **found and fixed in the range** (`bedc51992d`): the cut could no longer land once the archive shrank; the pad states the premise. A good example of the seam being seen before it was reported.

### Interaction: `GuiSaveState::render` (early help) × `GuiMsgBox` on top (the delete confirmation)

**State shared:** `Window::mRenderedHelpPrompts` per frame; the help bar's one slot.
**Finding:** safe for the manager; the dialog on top gets no bar at 640x480 (the manager is no longer top and `Window::render` draws none for a third page under full-screen menus). Pre-existing for every dialog on a small panel; not this range's regression; noted.

### Interaction: `tools/qa-accounts` × EmulationStation's `es_settings.cfg` writer

**State shared:** `/storage/.config/emulationstation/es_settings.cfg`.
**Wipe risk:** ES rewrites the file when its settings change; a rewrite between the tool's write and the reboot would drop the injected lines while the tool has already reported success.
**Test coverage:** TESTED by outcome — the frames show the account in use after the reboot.
**Finding:** safe in practice; the tool's "reboot the guest" instruction is the mitigation. A QA tool, fork-only.

### Interaction: `screenScraperFailureMessage`'s probe × the UI thread

**State shared:** the UI thread. `getThreadCount` is called from `ThreadedScraper::start` (`ThreadedScraper.cpp:269`), which runs on the UI thread when SCRAPE NOW is pressed; the failure function adds a second synchronous `HttpReq::wait()` after the first.
**Finding:** safe in kind (the original already blocked), doubled in the worst case (a network that accepts and never answers holds the interface for two timeouts). Low; noted.

### Interaction: `avahi-defaults.service` × `avahi-daemon.service` × `/storage/.cache/services/`

**State shared:** `avahi.conf` / `avahi.disabled` markers.
**Finding:** on the **shipped** unit neither marker is read at all (no `ConditionPathExists`), so the daemon cannot be turned off by the documented path; on the **fork's** unit `.disabled` only stops a copy that every booted device has already made. Either way D-NET-003's off-switch sentence describes nothing a player can do. ES has no avahi toggle (`grep -i avahi es-app/src`: 0).

## 3.6 What's missing?

Each negative claim carries its search.

| Missing | Search run | Proximate work that could have added it |
| --- | --- | --- |
| A frame of FINISH RESTORE PROCESS at 640x480 | `ls docs/qa-frames/2026-09-13/ \| grep finish` → 3 files, all guest b 1280x800 (README rows 5-7) | guest d (640x480) was up for #27 the same hour; not used for #47 |
| A frame showing the not-set glyph (empty circle) | README and #47's comment: every frame shows check-circles (the guest was online with a root password) | none |
| An H700 boot journal placing `wlan0` against `network-base.service` in monotonic time | `grep -rn -E 'wlan0\|rtw88\|8821' docs/ --include=*.md` with timestamps → 0 | #104's evidence work captured journals for other questions |
| A check that reads the **built** unit files | `grep -c 'image/system/usr/lib/systemd' tools/last-good-scripts-test` → 0; `grep -ci avahi tools/vm-qa` → 0 | case m's checks 8-9 read the source; the busybox shim already knows the build root's path |
| A `pair-identity` assertion that the published mDNS name equals the kernel hostname | as above (0 avahi mentions in `vm-qa`) | the suite gained two names this range |
| `--old` coverage for cases l and m | `tools/last-good-scripts-test:342`, `:422` fetch old copies for d/e only; l lifts from `${ROOT}`, m copies `${ROOT}/${NBS_REL}` | the header (`:60`) claims only "a, b, c, k FAIL" — honest, but l/m's guards have no positive in the tool |
| A zip-branch case in case k | `sed -n '/^echo "  k\./,/^echo "  l\./p' … \| grep -c unzip` → 0 | case k was written for the tar path (the only path a current image writes) |
| An issue for D-UI-051's follow-up (French for the rest of the fork's strings) | `gh issue list --state open --search French --limit 5` → #66, #64 only | the row says "a follow-up"; nothing tracks it |
| rocknix.org text for the five user-visible changes | #42 OPEN; D-WORKFLOW-014 says last | by decision; the list on #42 must grow by: per-unit device name, `.local`, scraper filters kept, WEB API KEY row, ScreenScraper messages |
| A `.d/` drop-in or recipe line shipping the fork's avahi ordering | image trees: `avahi-daemon.service.d/` absent on both; recipe `diff` shows the missing `rm -rf` | the fix is one line in `avahi/package.mk` |
| A body edit on #47 matching its close | body 1/5 ticked; comment 01:47 covers 4 | issue-tracking.md's same-action rule |

Present and correct, checked because they were easy to assume missing: the four systemd `.d/` drop-ins ship (`systemd-resolved.service.d/override.conf` etc. present in the x64 tree — my first sweep looked one directory too shallow); the two personal-path lists agree; `register-check` fired on its first real run (D-CLOUD-007) and on a constructed duplicate here.

## 3.6.5 Audit-prescription verification — defect shapes, every site

**Shape A — a unit file the build does not ship, edited as if it did.**
Grep for the shape, not the symbol: every `projects/ROCKNIX/packages/**/system.d/*` compared byte-for-byte with the x64 and H700 image trees; every override recipe with a `system.d/` checked for upstream's `rm -rf ${INSTALL}/usr/lib/systemd`.

| Occurrence | Verdict | Classification |
| --- | --- | --- |
| Site: `avahi/system.d/avahi-daemon.service` — DIFFERS from both trees; override recipe lacks the `rm` the generic has | FAIL as shipped | FIX-NOW (one recipe line; then the unit ships) |
| Siblings: every other fork `system.d` unit present in the trees — byte-identical (the `.d/` drop-ins included) | PASS | SAFE-AS-TESTED |
| Adjacent: overrides whose generic removes upstream units — `connman` has the `rm` in both; no other case | PASS | SAFE-AS-TESTED |
| Adjacent (class): a mechanical check that a package's `system.d` files equal the image's | absent | FILE-FOLLOWUP (a `tools/` sweep, or a line in `last-good-scripts-test` when a build root is present) |

**Shape B — a check that grades the source where the artifact is what ships.**

| Occurrence | Verdict | Classification |
| --- | --- | --- |
| Site: case m check 8 (`^After=.*network-base\.service` in the **source** avahi unit) | passes over a shipped unit that lacks it | FIX-NOW (read the build root's unit when present, as the busybox shim does) |
| Sibling: case m check 9 (`^Before=` in the source `network-base.service`) — shipped correctly, same shape | PASS by luck of the recipe | FIX-NOW with check 8 |
| Sibling: case l "cloud_setup carries the identical function" — a script is its own artifact | PASS | BY-DESIGN |
| Adjacent: `vm-qa` pair-identity reads the **guest** (`hostname`, the setting) — the right shape | PASS | BY-DESIGN; extend with the avahi name |

**Shape C — a restore-side skip applied to one archive kind.**

| Occurrence | Verdict | Classification |
| --- | --- | --- |
| Site: tar branch `-X` (`backuptool:574-577`) | PASS | done |
| Sibling: zip branch (`:578-600`) — symlink entries only | FAIL for pre-2026-08-26 archives | FIX-NOW (`-x` the two prefixes) |
| Adjacent: D-CLOUD-008's "any archive" | over-claims | FIX-NOW (a new row citing D-CLOUD-008) |

**Shape D — a tick or a row that cites a record which does not hold the fact.**

| Occurrence | Verdict | Classification |
| --- | --- | --- |
| #50 box 6 ("ordered after the naming script") | the image disagrees | FIX-NOW (untick or reword; reopen) |
| #113 boxes 1 and 4 (`docs/vm-qa-log.md` "2026-09-10 rows for `e73efbc8e0`"; "records both numbers") | no such row; 303 s absent | FIX-NOW (one QA-log sentence, or the tick reworded) |
| #47 closing comment ("empty circle when not") | read from code, unobserved | FIX-NOW with the 640x480 frame (a guest without wifi shows it) |
| D-NET-003 (ordering, off-switch) | not as shipped | FIX-NOW (new row) |

**Shape E — a first call moved to a context that cannot guarantee its input, and the result stored.**

| Occurrence | Verdict | Classification |
| --- | --- | --- |
| Site: `network-base-setup:28` → `cloud_device_id` at ~2 s, `DefaultDependencies=no` | risky on a handheld; safe on the VM | FIX-NOW or FILE-FOLLOWUP — a design choice (defer the rename to a unit after the adapter, or give `cloud_device_id` a mode that never writes a fallback id) |
| Sibling: the same script's `set_setting` (needs `/storage`) | `After=local-fs.target` | SAFE-AS-TESTED |
| Adjacent: every other `cloud_device_id` caller (`cloud_backup`, `cloud_restore`, `cloud_content_*`, `backuptool --label`) | run with the network up, or `--label` (no write) | BY-DESIGN |

**Shape F — a row a player cannot see through to three lines.**

| Occurrence | Verdict | Classification |
| --- | --- | --- |
| Site: `openRestoreRelink` DEVICE PASSWORD and LATER KEEPS THIS LIST — three lines at 1280x800 (frame) | FAIL (D-UI-023) | FIX-NOW (cut the descriptions, or move the LATER sentence to a confirmation) |
| Siblings: the page's WI-FI PASSWORD and CHECK CONNECTION descriptions — one line at 1280x800, unframed at 640x480 | UNKNOWN | FIX-NOW with the 640x480 frame |
| Adjacent: 12 other `addWithDescription(…, false, true)` action rows in fork `GuiMenu.cpp` (grep count) | unframed here at 640x480 | FILE-FOLLOWUP (a 640x480 pass over the fork's pages — #47-5 generalised) |

## 3.7 Retrospective Summary

### Architectural Assessment
Sound in every subsystem it touches, with the changes small, single-purpose and accompanied by their checks. One file was edited that the build never ships, and the recipe that should have shipped it drifted from upstream by one line years ago; the range enabled the service and inherited the drift.

### Cornerstone Alignment
**MEDIUM.** The engineering rules that bit are the project's own, written from earlier failures: verify the artifact (20, 34), diff a duplicate's behaviours before deleting it (23), tick on observation (13), edit the body with the comment (27), frame at 640x480 (41). Each was repeated once in this range, and each repetition sits on the #50/#47 pair. Everything else — fail-closed probes, the credential strip, the upgrade path, the French, the vocabulary, the fonts — conforms, and the mechanical checks are green.

### Cross-System Interactions
Nine seams examined. Two are risky or broken: the identity seeded at boot (untestable here, design-level), and avahi publishing a stale name (observed on a guest). One was found and fixed inside the range (LINK5's premise). The rest are safe, two of them by the good fortune of `systemd-resolved` watching the kernel name and of ES not rewriting `es_settings.cfg` before a reboot.

### Spec Drift
Small and documented except at #50/D-NET-003 (a mechanism recorded that the image does not carry) and D-CLOUD-008 ("any archive"). #66's no-account ordering and #68's key name differ from the issue text without a body edit.

### Missing Artifacts
Eleven, listed in 3.6 with their searches. The ones that decide something: a 640x480 frame of the FINISH RESTORE page, an H700 monotonic journal for the identity question, a check that reads the built unit, and an issue for D-UI-051's follow-up.

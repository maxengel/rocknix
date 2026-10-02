# Rasteratops 0.0.1 — second reader, blind pass

Scope held to the packet: cloud-root migration scripts at `c9625abf` / image `b2378d9c33`, ES `e108699ea`, the four observed outputs, and the criteria list. Kernels/emulators not touched (D-WORKFLOW-102). Verdicts are mine alone.

**Classes used:** **CPD** = current product defect in the packet's code; **CFI** = conditional on the future identity flip (OS_NAME→RASTERATOPS), not live on `next`; **TOW** = existing tracked open work; **UNP** = unproven critical interaction the packet cannot settle.

## Summary table

| ID | Sev | Class | One line |
|---|---|---|---|
| G-01 | High | CFI | Settings-archive identity is keyed on `OS_NAME` in five places; the flip orphans every pre-0.0.1 archive (dims the SETTINGS row, breaks "newest of this device", breaks on-device `backuptool` globs). |
| G-02 | Medium | CPD | `superseded-empty` is judged on save files only, but follow/settle/CREATE IT re-point `SETTINGS_REMOTE` with no copy — a Backups tier with archives and an empty saves folder is stranded and the row then reads "NO SETTINGS BACKUP FROM THIS DEVICE YET". |
| G-03 | Medium | CPD | `cloud_setup --seed-folders` seeds the carried superseded folder (README included) whenever `--settle` cannot answer; this recreates the exact fault the settle was added for. |
| G-04 | Medium | CPD (low exposure) | `cloud_backup`'s bucket branch reads "parent listing failed" as "folder absent" (skip, exit 0, card says no folder) and caches a failed features query as "not a bucket" (then creates the superseded folder). Comment promises otherwise. |
| G-05 | Low–Med | TOW | Exit-sync cost: guard narrowed to pass; `--recent` promise broken on an earlier default; 59 ms is an x86 number, the script's own handheld estimate is ~1 s per rclone start. |
| G-06 | Low | TOW | Freshness log: no exit status, one UNKNOWN, reasons that say "pending" — AC-361-01/362-01 not met by this log. |
| G-07 | Low | TOW | `tools/cloud-test-backend:806` bare `/GAMES` → run 101 round-trip 0/9; main suite not PASS; stale-literal guard has holes. |
| G-08 | Low | CPD | `superseded_source` checks the configured folder first, contrary to the "newest first" rationale; a conf on `/GAMES` with files in both defaults moves `/GAMES` and never surfaces `/ROCKNIX/Saves` from that device. |
| G-09 | Low | CPD | Aggregate `timeout 20` on `--join` is smaller than the per-call bounds it wraps (15 s connect, up to ~5 rclone starts); a slow but working cloud yields "YOUR CLOUD STOPPED ANSWERING" on every open. |
| G-10 | Low | CPD | `CONTENT_REMOTE=""` means "cloud root" in `cloud_setup` but "never set" in `cloud_migrate_layout`; join/follow/settle overwrite a deliberate root choice. |
| G-11 | Low | UNP | Transfer pages are now gated on a root listing (`rclone lsd remote:`) that `cloud_restore` never needed; restricted bucket credentials are not exercised. |
| G-12 | Low | CPD/UNP | Player-facing strings in code differ from the AC-proposed words; AC-353-05's proposed text is itself an old-word hit. |

---

## G-01 — Archive identity keyed on `OS_NAME` (High, CFI)

**Code.**
- `cloud_scan:83-88` `os_name()`; `:219` `MINE` regex `-${label}-${osn}_SETTINGS\.tar\.gz$`.
- `cloud_restore:1503-1508`; `:2125` same regex; `:2143` `made_by` parse on `-${osn}_`; `:2136-2149` fallback to newest-overall when `mine` is empty.
- `cloud_backup:2384-2387` retention's `mine`.
- `backuptool:143-144` archive names `…-${OS_NAME}_SETTINGS.tar.gz` / `${OS_NAME}_BACKUP.zip`; `:157-167` `newest_backup()` globs on `${OS_NAME}`; the comment at `:152-156` says the design is safe *because* the suffix never changes.
- `GuiMenu.cpp:4855-4862` dims the SETTINGS row whenever `MINE` is empty.

**Evidence in packet.** `archive-identity-probe.log`: same listing, `OS_NAME=ROCKNIX → MINE=2026_10_01-120000-GENERIC-X64-ROCKNIX_SETTINGS.tar.gz`; `OS_NAME=RASTERATOPS → MINE=<empty>`. This is a local probe, not a VM run; the code reading alone carries the finding.

**Trigger.** Any device that wrote archives before the flip (the mandatory migration device, the Nova, every RC2 user) boots 0.0.1 with `OS_NAME="RASTERATOPS"` (AC-337-06):
1. RESTORE FROM CLOUD → SETTINGS row dimmed "NO SETTINGS BACKUP FROM THIS DEVICE YET" although its archive sits in `/Rasteratops/Backups` (moved there by #353). AC-349-02/04 pass only if the fixture is seeded with the *new* suffix; the realistic case (the device's own history) fails.
2. `cloud_restore --yes` (the journey prompt at `main.cpp:1108`, CLI) takes the newest archive overall (`:2136`), which in a shared Backups folder can be another device's — the thing AC-349-05 says never happens by default — and journals a labelled archive as "made before backups were named after the device" (`:2143-2145`).
3. On-device "restore newest backup" (`backuptool:159-161`) cannot see pre-upgrade local archives. Downgrade (AC-344-33) mirrors all of this in the other direction.
4. Retention (`cloud_backup:2390-2391`) leaves the old-suffix archives alone forever — fail-closed, so no deletion risk; noted for completeness.

**Why it matters for the plan.** The cut's stated rule is "persisted contracts retained except cloud root". The archive file name is a persisted contract, and it carries `OS_NAME`. Either the suffix must come from a constant that does not flip (`DISTRO`, or a literal), or every matcher must accept both suffixes. The packet shows neither. `pair-rerun.log` ran on ROCKNIX-named images and checks file presence only ("PASS 4: the settings backups are at /Rasteratops/Backups"), so a branded re-run of that tool would not catch it. This is the strongest reason the "whole branded-image qualification does not exist" gap is material.

## G-02 — Backups tier stranded when the saves folder is empty (Medium, CPD)

**Code.** `has_files` (`cloud_migrate_layout:372-377`) excludes `/backup/**` and `/Backups/**` — correct for deciding where *saves* are (`:356-366`). But that answer is reused as "nothing in this layout":
- `layout_state:769-771` → `superseded-empty`; `GuiMenu.cpp:5365-5375` then offers CREATE IT with "YOUR CLOUD HAS NO /Rasteratops FOLDER YET" — nothing names the archives.
- `layout_follow:814-816` re-points `SETTINGS_REMOTE` ("Nothing is copied or removed here", `:796`).
- `layout_settle:880-882` re-points `SETTINGS_REMOTE`; `cloud_setup:739,753-754` then seeds an empty new Backups.
- `cloud_scan:208-227` lists the new (empty) Backups → `MINE=` empty → `GuiMenu.cpp:4858-4861` dims the row.

**Trigger.** Conf names `/GAMES` or `/ROCKNIX/Saves`; cloud holds `/GAMES/backup/*.tar.gz` or `/ROCKNIX/Backups/*.tar.gz` and no save files (settings-only user; saves never synced). Paths: (a) wizard done step (`GuiMenu.cpp:5465-5473`, `createEmpty=false` → seed → `--settle`): certain, no copy; (b) boot step CREATE IT (`:5383`): `--apply` first — whether `--apply`'s plan relocates a non-empty Backups tier when saves are empty lives in lines 1001-1264, **not in the packet**; then `--seed-folders --settle`; (c) `cloud_scan:175-181` `--follow` after another device created `/Rasteratops`. Content tier is re-pointed the same way but #352's `found-elsewhere` (`GuiMenu.cpp:5211`) looks under `/ROCKNIX/Content` only (not `/GAMES/Content`); Backups has no such fallback.

**Severity.** Nothing deleted; archives stay in the old folder; recovery is CHOOSE A FOLDER back, which no screen suggests. Not a pair-test cell (step 1 seeds saves and settings together). Belongs in AC-365-01's table as "saves empty / Backups non-empty".

## G-03 — Seeding a superseded folder when settle cannot answer (Medium, CPD)

**Code.** `cloud_setup:739-740` runs `timeout 30 … --settle` and uses the result only for a log line; `:746-775` seeds from the unchanged pointers; `:784-788` already has the right guard (`--superseded | grep -qFx "${SAVES%/}"`) but applies it to the marker only, not the mkdir loop; `seed_note` (`:790+`, not shown) writes READMEs (`:714, 770-771`). `cloud_migrate_layout:864-871` describes exactly this fault ("Seeding the carried /GAMES itself put a README there, which every later check read as saves") — `has_files` does not exclude README; only `layout_join:842` does, and only for `NEW_SAVES`. `GuiMenu.cpp:5472,5479-5480`: in the Setup place a failed or closed scan page *proceeds to the seeding* (`abandon = finish`).

**Trigger.** Device with a carried superseded conf reaches the wizard's done step (re-linking a remote; the Nova shape) while the cloud is slow enough that settle (root probe + features + up to five listings, each allowed 15 s connect) exceeds 30 s, or `/storage` is not writable (rc 1/2). Seeding then makes `/GAMES{,/savefiles,/savestates,/screenshots}` + README(s). The next `--state` reads `superseded-with-files SOURCE=/GAMES` (configured folder wins, `:85`), MOVE moves the junk, the device becomes `current`, and real saves in `/ROCKNIX/Saves` are never surfaced from it (G-08 compounds). The comment at `:736` ("A settle that could not answer changes nothing") claims a safety the code does not provide.

## G-04 — Bucket branch: unanswerable ≠ absent (Medium, CPD, low exposure)

**Code.** `cloud_backup:1676-1686`. `bucket_dir_listed` (`:819-825`) returns 1 for "parent listing failed" and "name not listed" alike → `list_rc=3` → offer line, `return 0` → on an automatic run the card reads SKIPPED - YOUR CLOUD FOLDER ISN'T SET UP YET (`ThreadedCloudSync.cpp:492-494,524-528`) and nothing is sent; no error surfaces. `bucket_based` (`:809-818`) caches a failed `rclone backend features` as `0` (unbounded, no `RCLONE_LIST_OPTS`; cf. `cloud_migrate_layout:952`, which bounds it and calls it "a round trip", while `cloud_restore:1675` calls it "local" — one comment is wrong) → on a real bucket an absent prefix lists clean (`lsd` 0) → backup proceeds → `mkdir` creates the superseded folder, the thing D-CLOUD-172 forbids. The comment at `:1671-1673` ("a listing that cannot answer leaves the backup as it was") is not what the branch does. Contrast `cloud_migrate_layout:315-348` (`absent_not_broken`/`list_or_stop`), which the same project wrote after being bitten by "a provider error taken for absence" (`:73-80`).

**Evidence.** `bucket-unknown-probe.log` (`>>> offer create-saves-folder|/ROCKNIX/Saves`, `exit=0`) is consistent with the first branch or with a plain path-backend `lsd`=3; the packet shows neither the probe's command nor its environment, so I cannot say which. It is not a VM run.

**Exposure.** The superseded names are literal `/GAMES` and `/ROCKNIX/Saves`, which are illegal bucket names on S3/GCS/B2 (`cloud-test-backend:799-806`); the QA harness prefixes the bucket, so `superseded_saves_setting`'s whole-string compare (`:836`) never fires there — this branch is unexercised by AC-366-04 and both suites. Swift or a path-style MinIO with a top-level `GAMES` container reaches it.

## G-05 — Exit-sync cost and the narrowed guard (Low–Med, TOW: #364/#365, D-WORKFLOW-134)

- AC-363-01 text: "no call to `cloud_migrate_layout`". Test `last-good-scripts-test:13391` enumerates `follow|join|settle|apply|state` and so passes with `--superseded` at `cloud_backup:832-837`. Either reword the criterion to D-CLOUD-172's allowance or restore the test; a guard that enumerates forbidden verbs also misses `--check`/`--keep`/`--needs-step`.
- `cloud_backup:1674` runs before the `--recent` short-circuit (`:1700-1713`), so the promise at `:1695-1699` ("the remote is never touched at all") no longer holds on an earlier default.
- The 59 ms delta is one rclone start on guest d (x86). The script's own estimate (`:1695-1696`) is "a second on a handheld" per start; on a bucket the branch costs up to three (features, lsd, lsf). AC-364-03's keep/remove decision should be made against the device number, and the saved benchmark does not state backend or N.

## G-06 — Freshness log (Low, TOW: #361/#362)

`freshness.log` has no exit line; `dmidecode … UNKNOWN: no resolver` — whether UNKNOWN fails the tool is not shown, and AC-361-01/362-01 require exit 0. `raofflineproxy`'s reason reads "pending the maintainer's disposition on fork #361" — by its own words the register row AC-361-01 asks for does not exist yet. `libsoup`'s reason says it "moves with the next WebKitGTK bump" while `webkitgtk` reads CURRENT 2.54.0; tidy in the #362 row.

## G-07 — Run 101 round-trip (Low, TOW: #366)

`cloud-test-backend:806` returns bare `/GAMES`; with D-CLOUD-172 the backup prints the offer and sends nothing → 0/9. Main suite 14/15 means AC-344-23, AC-354-03 and AC-366-03 are not met on run 101; the 42/0 pair re-run is a different tool and does not cover the round-trip. Guard holes: `last-good-scripts-test:8937`'s pattern requires `(ROCKNIX|GAMES)/(Saves|…)` (AC-366-01 already says so) and its `.*# ` exclusion drops any live literal that has a trailing comment.

## G-08 — Source selection order (Low, CPD)

`superseded_source:85` takes the configured folder when it has files; `earlier_source:89-92` justifies "newest first" only for the other folders. A conf on `/GAMES` with files in both `/GAMES` and `/ROCKNIX/Saves` is offered MOVE from `/GAMES`; after it the device is `current` and never asks about `/ROCKNIX/Saves`. A sibling still on `/ROCKNIX` recovers it (pair 5n); a lone device does not. Not an AC cell (AC-353-C02 covers the empty-`/GAMES` case only).

## G-09 — Timeout arithmetic (Low, CPD)

`cloud_scan:163` wraps `--join` in `timeout 20`; inside it `main` runs the root probe and features (`cloud_migrate_layout:939,952`) plus up to three `has_files` listings, each bounded at `--contimeout 15s --timeout 30s --low-level-retries 3`. A slow, working cloud trips 124 → `why_for_rc` "YOUR CLOUD STOPPED ANSWERING" on every transfer-page open and every boot step. Same shape at `cloud_setup:739` (`timeout 30`, feeds G-03).

## G-10 — `CONTENT_REMOTE=""` (Low, CPD)

`cloud_setup:755-763` (#308 F-RS-20): an empty value *with the line present* means "the cloud's root". `cloud_migrate_layout:114, 819, 883`: `[ -z "${content}" ]` means "never set" and re-points to `<layout>/Content`. AC-352-06 uses `""` in the second sense. One reader must win.

## G-11 — Root-listing dependency (Low, UNP)

The transfer pages and the boot step now depend on `rclone lsd remote:` (`cloud_migrate_layout:938-941`, PL-027) and `rclone lsf remote:` (`cloud_scan:238`); `cloud_restore:1712` only ever needed the parent. Bucket credentials without list-all-buckets rights would turn every open into "SOMETHING WENT WRONG". Not exercised by the QA backends shown.

## G-12 — Words (Low)

`GuiMenu.cpp:5226` "YOUR CLOUD HAS NO ROMS OR BIOS AT %s … CHOOSE THE FOLDER WHERE YOUR GAMES ARE?" vs AC-352-02's proposal; `:5375` names the root `/Rasteratops` while AC-353-05 proposes `/ROCKNIX/Saves` — that proposal is itself a hit for AC-353-C01's reversal sweep. `:5330` "YOUR OTHER DEVICES WILL FOLLOW" is true only for devices with nothing in the old folder (`layout_follow:810-814`); the others get a MOVE question. Approval records (AC-354-04) decide these.

---

## Minor notes, no ID
- `--join/--follow/--settle` write three pointers in sequence (`:856-858, 815-821, 881-885`) outside the cloud lock and under an external `timeout`; a kill between writes leaves a split conf. Window is milliseconds; the next scan's read-back catches most shapes.
- `cloud_scan` exits 2 both for usage (`:195`) and for an unreadable conf via `stop_on` (`:124`); cosmetic.
- Three copies of the default root exist (`cloud_migrate_layout:57-59`, `cloud_setup:753-762`, `GuiMenu.cpp:5321`); #356's next layout change must touch all three.

## What the packet cannot establish
1. **Anything about the branded image.** All VM evidence (pair-rerun image names, the update tar in step 3) is ROCKNIX-named. AC-337-02/06/07/08, `init:882`'s match on `-from-ROCKNIX`, the updater's comparison of `0.0.1` against a date string (AC-344-03/25) and AC-354-02 on the branded tar are all unshown. G-01 is the concrete reason this matters.
2. **Omitted code** the findings lean on: `cloud_migrate_layout` 1-54, 126-314, 646-748, 1001-1264 (the `--apply` plan, `conf_value`, `same_folder`, `clean_path`, `derived_content`, `check_clean`, `take_cloud_lock`); `cloud_setup`'s `seed_note`; `CloudOffer`; `cloudScanFacts`; `ThreadedCloudSync`'s `mOffer` handling (whether a restore's offer line survives a backup that then created the current folder — the run-100 card shape for `/Rasteratops/Saves`); the `.layout` version comparison AC-356-02 relies on; the `Saves-replaced` relocation (AC-353-07/C04).
3. **Provenance of the two probes.** Neither log carries a command, host or image; treat both as local model/sandbox output, not guest-d runs.
4. **The benchmark's conditions** (backend, N, image) behind 325/266 ms.
5. **AC-353-C02's Nova case** is a sandbox check by its own text; no VM run of "conf `/GAMES`, saves in `/ROCKNIX/Saves`" is in the packet.
6. **Whether `tools/fork-package-freshness` exits 0** on this tree.

## What the packet does establish
`pair-rerun.log` (timestamps, image names, 42/0, `RESULT PASS` with a log path) reads as a genuine VM pair run of the cloud-root migration on ROCKNIX-named images: join, move, follow, missed-step offer, merge of a late write, and the dead-endpoint negative control all behave as the code says for the shapes where the saves folder holds files. None of the cells in G-02, G-03, G-04, G-08 is among them, and no cell exercises the archive identity under G-01. One uncertainty here is not proof of data loss: in every finding above the old bytes remain in the cloud; the exposures are silent skips, unreachable archives, and a dialog that does not say what it will do.
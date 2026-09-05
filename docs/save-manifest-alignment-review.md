# Save manifest — alignment review against all cloud-sync work (2026-09-05)

Requested by the maintainer on signing off the manifest shape (D-CLOUD-031):
check `docs/save-manifest-schema.md` rev 1 against everything cloud-sync has
decided, shipped and planned, before capture (#21) is built. No council skill
exists in this repo; this is a direct review over the whole corpus, and it is
written to be re-run — every row names what it was checked against.

**Corpus:** decision register rows D-CLOUD-001…031, D-UI-001…021, D-QA-001…006;
all 40 `cloud-saves` issues (19 closed, 21 open) plus #5, #6, #38, #41;
`.claude/rules/rclone-cloud-sync.md`; `docs/cloud-sync-changelog.md`;
`docs/audits/2026_08_24-…/05-punch-list.md` and `2026_09_03-…/05-punch-list.md`;
`plans/bisync/rclone-bisync-planning.md` (branch `rclone-bisync-beta`);
`tools/cloud-round-trip` (23 steps); ES `SaveStateConfigFile.cpp`,
`SaveStateRepository.cpp`, `FileData.cpp`; the RG35XX SP on image `6d03d93946`.

**Verdict:** the schema is aligned with every decided row and every shipped
behaviour. Seven items need action, none of them in the schema itself: two are
issue bodies that predate the schema, three are constraints the neighbours must
carry, two are pre-existing gaps the review made visible. Listed in §3.

## 1. Against the decisions

| Row | What it decides | Schema | Verdict |
|---|---|---|---|
| D-CLOUD-003 | `rclone.conf` stays out of backups | manifest holds no credentials, no remote names, no tokens; `remote_hash` is a content hash | aligned |
| D-CLOUD-005 | the system-backup upload decides on content, not remote metadata | `sha256` is the identity; `remote_hash`/`mtime` are shortcuts, never the decision (§2, §6) | aligned, same principle |
| D-CLOUD-009 | per-device identity seeded from the permanent hardware address, stored value wins | `device.id` = `cloud_device_id`; no second identity | aligned (grounding on #20, #21) |
| D-CLOUD-014 / 015 | a backup never deletes by default; `sync` archives into a dated sibling | compaction (D-CLOUD-030) deletes a *duplicate* only after hash re-verification and logs it; nothing else in the schema deletes | aligned; the one deletion is by construction lossless |
| D-CLOUD-016 / 026 | migrations copy, verify, delete; never `move`; act only on paths we wrote | `savestates/.rocknix/` is a path we write; a layout change (#10) keys entries by path so it is a re-key, and the file rewrite is temp-and-rename | aligned |
| D-CLOUD-017 | key savestates by core; core build as data in a per-device manifest; existing states `unknown`; game saves excluded from namespacing | `core`, `core_build` as data; `unknown` first-class; **game saves are in the manifest but not namespaced** — the manifest describes them, the layout does not segregate them | aligned; D-CLOUD-031 refines the file name only |
| D-CLOUD-018 / 019 / 020 | content layout `ROMs/`+`BIOS/`; content membership is an allowlist; three tiers by size and cadence | manifest lives inside the **saves** tier only: under `savestates/` (saves tier), never under `CONTENTPATH`, never in `backuptool`'s archive (`/storage/.config/*`; `/storage/.cache` and `/storage/roms` are not archived — verified in `backuptool` DEFAULT) | aligned |
| D-CLOUD-022 | another client's conflicted copy is never moved by us | a `…(conflicted copy)` file has no manifest entry and is `unknown`; the wizard must not offer it as a version — **constraint for #22** (§3.5) | aligned with a note |
| D-CLOUD-024 | the wizard ships in this drop | schema is the wizard's data; no deferral | aligned |
| D-CLOUD-025 | #19 runs before the badge is a safeguard | `core_build` carries the comparison either way; the badge's severity is #23's, not the schema's | aligned |
| D-CLOUD-027 | audit log at `/storage/.cache/log/cloud_audit.log`, append-only text | lineage beyond one step lives there (§2); `agreed.json` is separate and is state, not a log | aligned |
| D-CLOUD-028 | the exit sync pushes only what changed, by time window, spawning rclone once | the manifest write adds a hash per changed file (tens of KB, `sha256sum` local) and one small upload; **budget: no extra rclone spawn** — the manifest rides in the same `--recent` pass because it is under `savestates/` and newer than the stamp | aligned; #21 must not add a second rclone run (§3.3) |
| D-CLOUD-029 | write paths stay as shipped until #22 | schema does not touch them | aligned |
| D-CLOUD-030 | identity = sha256 of stored bytes; duplicates compacted after re-verification | §1 | is the schema |
| D-CLOUD-031 | one JSON per device under `savestates/.rocknix/`; agreement record local | §5 | is the schema |
| D-UI-017 / 018 / 020 | save rows stay with their own stamps; hub ticks remembered | `agreed.json` and the manifest do not replace the stamps in `/storage/.cache/cloud_sync/`; they sit beside them | aligned |
| D-QA-001 / 002 | nothing upstream without a hardware run; QA backend on loopback | the WebDAV QA backend has **no hashes and no modtimes** (#53), so `remote_hash` is `null` there and `mtime` is unusable — the schema's fallback (size + sha256 after download) is the path the suite will exercise | aligned; the suite must run both remotes (§3.6) |

Rows not touching the schema: D-CLOUD-001/002/004/010–013 (OAuth and setup), D-CLOUD-021/023 (archive format, `--match`), D-UI-001–016, D-QA-003–006.

## 2. Against the issues

**Closed — does the schema respect what they fixed?**

| Issue | Fix | Check |
|---|---|---|
| #5 cleanup | restore never `--delete-excluded`; single remote; `RSYNCRMDIR` | nothing in the schema is a filter or an option; the manifest is a file the existing allowlist already carries |
| #8 exit sync (now in ES) | one path, in ES, visible | capture hooks the same point (`FileData.cpp:836`) — **#21 body already corrected** to say so |
| #13 / #18 P1–P4, #30, #31, #32 | backup is secrets-free and verified; re-link wizard; leak audit | manifest carries nothing the leak scan (`password|token|stream_key|\.key`) would match; `agreed.json` is under `/storage/.cache` and never archived |
| #46 | `setrootpass` after restore | unrelated |
| #49 | per-device backup folder, stable id | reused, not re-derived |
| #53 | size-only comparison masked a changed archive | the manifest never compares by size alone; `size` is a pre-check, `sha256` decides (§6) — the same lesson, applied |
| #56 seeding, #57 migration, #58 tar, #59 picker, #61 `--match` | folder seeding; copy-verify-delete; tar archives; content picker; the only deleting content action | `savestates/.rocknix/` is not seeded (it appears with the first manifest); `--match` acts on the **content** tier and can never reach `savestates/` — verified: content sync is `ROMs/`+`BIOS/`, an allowlist of ES systems, and `- /**/*.state*`-class saves are excluded from it by #56's fix ("content sync was carrying save files") |
| #38 | `GAMES` is not a legal bucket name | `.rocknix` and `manifest-<id>.json` are legal object keys on S3/B2; dot-prefixed *directories* are fine because bucket remotes have no directories — but see §3.6 |
| #60 / #41 audits | PL items resolved or deferred to #42/#35 | nothing open touches manifests; #41 PL-03 (reconcile #23 with IA rev 4) is what made the wizard's data needs concrete |

**Open and planned — does the schema serve them, and do their bodies still fit?**

| Issue | Plan | Check |
|---|---|---|
| #7 liveness + boot/shutdown sync | boot sync exists (`autostart/102-cloud-saves`), shutdown does not | the boot pair is `copy --update` both ways (blindspot 28) and its liveness check is still `ping google.com`, which the rule file calls wrong in both directions — **pre-existing gap, not the schema's** (§3.7). A shutdown push would be another writer: it goes through `take_cloud_lock` and, once #22 lands, through the agreement record |
| #9 bisync | the beta plan's Phase 3 says **"automatic conflict resolution (newer file wins)"** and `--conflict-resolve newer` | **contradicts #11's cardinal rule and the IA doc**; the futro's #22 ACs already forbid it, but #9's own body and plan do not say so — **body edit** (§3.1) |
| #10 per-core namespacing | directories by core (D-CLOUD-017) | entries keyed by path, `core` as a field, so the layout change is a re-key. Found on the way: **no `es_savestates.cfg` ships anywhere** — not in the ES repo, not in the rocknix tree, not on the device; ES uses its compiled defaults (`directory = "{{system}}"`, `Paths.cpp:83` hard-codes `/storage/roms/savestates`). #10 has to *create* that file, not edit it — **#10 open item sharpened** (§3.2) |
| #12 directory chooser, #28 sync paths, #33 REMOTENAME | `SYNCPATH` and the remote are user-chosen | entry keys are relative to the sync root, so a `SYNCPATH` change moves nothing; the manifest names no remote. `BACKUPPATH` and `RESTOREPATH` are both `/storage/roms` by default and **the schema assumes they stay equal** — if a player set them apart, "relative to the sync root" is two roots. Documented assumption (§3.4) |
| #14 QOL (lock, `--yes`, log rotation) | lock and `--yes` shipped; rotation partly (#14 open) | the manifest is written under the lock's holder; the audit log rotates in-script (D-CLOUD-027) |
| #15 native ES, #37 sync from the savestate manager | L3: conflict dialog; #37: a SYNC tile in `GuiSaveState`, and its comment names #24's COPY TO FREE SLOT as how cross-device states arrive and "tiles already render `emulator: core` per slot, so origin badging has a place" | the schema's `device.label`, `core`, `core_build` per entry are exactly what a tile badge needs; **#37 should read the manifest, not re-derive** — noted on #37 (§3.5) |
| #19 compat matrix | same-chipset control, then cross-chipset | `core_build` + `device.family` per entry are the two axes the protocol varies |
| #21 capture | hook, fields, backfill, allowlist | body already carries the futro's ACs; **adds:** the core-pins file, told-not-discovered, and no second rclone spawn (§3.3) |
| #22 detection | last-synced state, classification, JSON, no transfer for divergent | `agreed.json` is the last-synced state; §3's table is the classification; the JSON the wizard consumes is a projection of two manifests plus the verdict — **#22 must also treat a file with no entry on either side as `unknown`-both, which is still "never agreed → ask"** |
| #23 wizard | metadata per side: date · time · device + model · core + version; screenshot or glyph; no size, no play time | every field present; `size` exists in the schema but the wizard **does not show it** (rev 3 decision) — schema field ≠ UI field, stated in #23 already |
| #24 merge | KEEP BOTH via `getNextFreeSlot`/`copyToSlot`; identity | identity done (D-CLOUD-030); a merged copy is a new entry with `replaces = null` and its origin in the audit log |
| #25 snapshots | pre-change copies, rollback | §8: allowlist rule must precede `+ /savestates/**` — **#25 body lacks it** (§3.1) |
| #26 journey, #34 full snapshot, #35 round-trip | restore everything → play → back up; two-VM exit test | a fresh handheld restoring from the cloud receives every other device's manifest and none of its own; every local file it then writes gets an entry from its first game exit — the "existing saves stay `unknown`" rule is the fresh-handheld case working as intended. #35's fixtures (`saves/game1.srm`, `savestates/game1.state`) are exactly the two kinds; **it has no manifest step yet** (§3.6) |
| #45 archive trim, #47 restore page, #51 native setup, #52 rclone.conf held back, #29 OAuth upstream | unrelated to save metadata | no interaction |

## 3. Actions

1. **Issue bodies to edit (blindspot 27, again):** #9 — strike "newer file wins" and `--conflict-resolve newer` from scope; detection reports, the wizard decides, `--conflict-loser` never renames a savestate (cite #22's ACs, #11's rule). #25 — add the allowlist rule `- /savestates/.snapshots/**` ahead of `+ /savestates/**`, with the reason (first match wins).
2. **#10 sharpened:** there is no `es_savestates.cfg` to edit; ES runs on compiled defaults and `Paths.cpp:83` hard-codes the root. Per-core directories mean shipping a config file *and* pointing RetroArch's `savestate_directory` (`setsettings.sh:811`, `${SNAPSHOTS}/${PLATFORM}`) at the same place. Two consumers, one layout.
3. **#21 constraints added:** (a) the core-pins file `/usr/share/rocknix/core-pins` emitted at image build from `LIBRETRO_CORES` × `get_pkg_version`; (b) ES passes emulator and core on the command line; (c) the manifest write happens *before* `cloud_backup --recent` in the same exit path and adds **no rclone spawn** — the file is under `savestates/`, newer than the stamp, and rides the existing `--max-age` window (D-CLOUD-028's budget: one spawn, ~1 s).
4. **Documented assumption:** `BACKUPPATH == RESTOREPATH`. True by default and in every shipped flow; a player who sets them apart has two sync roots, and entry keys are relative to one. `cloud_sync_helper` could warn; not worth more than a line in the schema until somebody does it.
5. **#22 / #37 constraints:** a Dropbox "conflicted copy" or Syncthing `.sync-conflict-` file (D-CLOUD-022) is never a version the wizard offers — it has no entry and stays where it is. #37's tile reads `device.label`, `core`, `core_build` from the manifests for its badge rather than re-deriving them.
6. **#35 gains a manifest step**, written before #21 lands so it fails first: plant a state, run the exit path, assert `savestates/.rocknix/manifest-<id>.json` reaches the remote with an entry whose `sha256` equals the planted file's, `remote_hash` is `null` on the WebDAV backend (no hashes) and non-null on S3 (MinIO offers md5) — the suite already runs both backends (`CLOUD_QA_BACKEND=s3`), which is what makes the fallback path testable. Also assert the manifest is **absent from the content tier** after `cloud_content_backup`.
7. **Pre-existing gap, surfaced not caused:** `autostart/102-cloud-saves` still gates the boot sync on `ping -c1 google.com`, which the subsystem rule names as wrong in both directions ("reachability means the remote, not the internet"; `cloud_setup --check` is the primitive, per #37's note). Belongs to #7. Filed there, not fixed here.

## 4. What was checked and found clean

- No decided row is contradicted (all 31 D-CLOUD, 21 D-UI, 6 D-QA read).
- No closed issue's fix is undone by writing a file under `savestates/`.
- The manifest can never enter the content tier or the system-backup archive.
- The manifest carries no secret and matches nothing the leak scan greps for.
- The schema needs no change to survive #10's layout, #12/#28/#33's path and remote choices, or #25's snapshots.
- The bisync plan's "newer wins" is the only planned item in direct conflict with the milestone's rule, and it is in a body, not in code.

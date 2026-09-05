# Revised approach — the foundation I would build

## 1. Executive summary

I would build from `claude-revised_plan-r2.md` as the editing baseline, with the following amendments:

1. **Retention store** — add the discard sidecar of §1.2 from `kimi_peer_review-r3.md` to satisfy the maintainer’s “time machine” requirement.
2. **Deletion propagation** — adopt `gpt-revised_plan-r2.md`’s version-specific retirement records for explicit deletes, conditional on the ES delete hook existing.
3. **Exit path** — keep `claude-revised_plan-r2.md`’s fresh evidence before upload, but add `gemini-revised_plan-r2.md`’s deferral as the measured fallback if the hashless download exceeds the budget.
4. **Split roots** — adopt `gpt-revised_plan-r2.md`’s one-way import destination for `BACKUPPATH ≠ RESTOREPATH`.
5. **LAN reachability** — adopt `gemini-revised_plan-r2.md`’s probe for LAN-only remotes.
6. **Manifest transport** — keep `claude-revised_plan-r2.md`’s manifest-last commit, but drop spawn A if Gate 6 measurement says so.
7. **Schema amendment** — use `mistral-revised_plan-r2.md`’s inline-JSON form for the D-CLOUD-031 refinement, with the content errors corrected.
8. **Recovery route** — move `gpt-revised_plan-r2.md`’s “minimal native recovery route” to the separate restore-tool issue as its seed.

The result is `claude-revised_plan-r2.md`’s architecture with `gpt-revised_plan-r2.md`’s deletion semantics, the maintainer’s retention contract, and every number still gated on hardware.

---

## 2. Identity, lineage, and agreement

### 2.1 Identity

- **A save version is the sha256 of its stored bytes** (D-CLOUD-030). Slot and file name are attributes.
- **Duplicates are compacted after re-verification** (D-CLOUD-030): the higher-numbered copy is removed, only after both files are re-read and the hashes found equal, and the removal is written to the audit log.
- **The thumbnail is not part of the identity** (schema §1). It travels with the state by path; `copyToSlot` already moves both (S38).

### 2.2 Lineage

- **Per device, per path**: the current hash and the hash it replaced at that path on this device (`replaces`), with when, which device, which core and core build.
- **Agreement, per device, per path**: the hash this device last uploaded or downloaded for that path — the last version both sides agreed on, *A*. Kept locally under `/storage/.cache/cloud_sync/`, never synced (schema §2).

### 2.3 Agreement on verified equality

- **Establish agreement on verified equality as well as transfer** (gpt §4.1). The signed schema never writes agreement on verified equality (S03 §9); the first change to any save on a device upgraded to the engine then classifies as “never agreed → ask” (S03 §3). This is an upgrade that is not invisible (S11).
- **Write agreement if absent** (kimi §4.3). A device that upgrades with L = C for every file and no agreement must not prompt on the first change.

### 2.4 Conflict test

Per path, with *L* the local hash, *C* the cloud’s, *A* the agreed one:

| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|---|---|---|---|---|---|
| equal | — | — | — | identical | nothing |
| differ | yes | equal | differ | cloud changed | download, no prompt |
| differ | yes | differ | equal | device changed | upload, no prompt |
| differ | yes | differ | differ | **divergent** | wizard |
| differ | no | — | — | **divergent** (never agreed) | wizard — conservative |
| only one side has it | — | — | — | one-way | transfer, no prompt |

Refinements:
- **A move is not a conflict.** Same hash under a new path is a *move*: no conflict, no new version.
- **Never agreed means ask.** Two pre-existing copies with different content and no shared history are exactly the case the player must decide; there is no recency to fall back on (S01).
- **Auto states are the commonest conflict.** `game.state.auto` is written at exit wherever RetroArch’s auto-save is enabled, so two devices playing the same game diverge on it every session. The wizard should expect this pair most often and make it the fastest decision on the page.

---

## 3. Manifest shape

### 3.1 Shape

- **One JSON file per device at `savestates/.rocknix/manifest-<device-id>.json`** (D-CLOUD-031, refining D-CLOUD-017). Each device writes only its own; readers take the union.
- **Describes in-game saves as well as states** by path relative to the sync root. The allowlist passes nothing beside an in-game save except the save itself (S32), and XML is excluded outside `savestates/` (S31).
- **The local agreement record is kept unsynced** under `/storage/.cache/cloud_sync/agreed.json`, same entry shape minus provenance, one per path, holding the hash this device last uploaded or downloaded (schema §2).

### 3.2 Fields

Top level:

| Field | Type | Meaning |
|---|---|---|
| `schema` | int | `1`. Readers refuse a higher number and treat a missing one as `0` (pre-schema). |
| `device.id` | string | `cloud_device_id` — stable, seeded from the permanent hardware address (D-CLOUD-009). |
| `device.label` | string | `cloud_device_id --label`, folder-safe (`Anbernic-RG35XX-SP`). |
| `device.model` | string | `/proc/device-tree/model`, for display (`Anbernic RG35XX SP`). |
| `device.family` | string | `HW_DEVICE` from `/etc/os-release` (`H700`). |
| `device.os_version` | string | `OS_VERSION` from `/etc/os-release`. |
| `generated_at` | string | UTC, ISO 8601, when this file was last written. |
| `entries` | object | path → entry, path relative to the sync root (`/storage/roms`). |

Per entry:

| Field | Type | Meaning |
|---|---|---|
| `kind` | `"state"` \| `"auto"` \| `"save"` \| `"container"` | numbered savestate; the `.state.auto` resume point; an in-game save (`.srm`, `.sav`, memcard, …); a shared container (VMU, memcard set). |
| `sha256` | string | **The identity of this version** (D-CLOUD-030): sha256 of the bytes as stored — compressed for a state (`savestate_file_compression = "true"`; files begin `#RZIPv`), raw for a save. |
| `size` | int | bytes as stored. A cheap pre-check before hashing, never a substitute for it. |
| `mtime` | string | the file’s modification time, UTC ISO 8601 (ext4 here; second resolution). What rclone compares by; recorded so a listing can be matched without a download. |
| `captured_at` | string | UTC ISO 8601, when this entry was written. |
| `captured_local` | string | the same instant in the device’s local time with offset (`2026-09-05T01:32:46-04:00`) — the wizard shows local time, and the offset is what makes two devices’ local times comparable. |
| `clock_synced` | bool | `timedatectl show -p NTPSynchronized` at capture. A device that booted without a network has a wrong clock; the wizard says so rather than trusting the time. |
| `system` | string | ES system name (`gba`). |
| `rom` | string \| null | the ROM file name with extension, from ES’s game path. For a state this is what `{{romfilename}}` stood for; it is recorded rather than re-derived so a rename of the state cannot detach it from its game. `null` for a container. |
| `emulator` | string | ES’s resolved emulator (`retroarch`, `duckstation`, …). |
| `core` | string | the libretro core name (`mgba`); for a standalone emulator, the emulator name again. Never empty (ES does the same in `SaveStateConfig::getDirectory`). |
| `core_build` | string | our own `PKG_VERSION` pin for that core’s package (D-CLOUD-017), or `"unknown"`. The thing two devices compare to know whether a state will load (#19). |
| `core_display_version` | string \| null | `display_version` from `/usr/lib/libretro/<core>_libretro.info` (`1.61` for snes9x), for humans; never compared. |
| `slot` | int \| null | attribute, not identity. `0` for `game.state`, `n` for `game.staten`; `null` for `auto` and `save`. |
| `screenshot` | string \| null | remote-relative path of the PNG (`savestates/gba/X.state1.png`), so the wizard can fetch the cloud side’s picture with one small copy and never has to derive it from the state’s name. `null` for a save — never a substitute image (S02). |
| `replaces` | string \| null | the sha256 this version replaced at this path on this device, or `null` for the first version seen. One step of lineage; the audit log holds the rest (schema §2). |
| `remote_hash` | object \| null | `{"type": "dropbox", "value": "…"}` as reported by `rclone lsjson --hash` after the upload that carried this version; `null` until then. Lets a later listing say "the cloud still holds this version" without a download. Backend-specific by construction (Dropbox offers only its own type; WebDAV none), so it is only ever compared against a listing of the same remote. |

Rules the fields obey:
- **Absent is not zero.** A field that could not be determined is `null` or `"unknown"`, never `0` or `""`. `clock_synced: false` and `core_build: "unknown"` are values the wizard renders, not errors (S21 thread; `upgrade-and-install.md`).
- **Nothing stamps a file it did not write.** An entry is written by the device that produced the save, at the moment it is produced. A file with no entry anywhere is `unknown` in every provenance field and still has a hash, computed locally, so the conflict test (schema §3) works for it.
- **A move is an update to the key, not a new entry.** After ES renumbers, the capture step finds the same hash under a new path and moves the entry; `replaces` and `captured_at` are unchanged.

### 3.3 Schema amendment

Refine D-CLOUD-031 with the following inline-JSON amendment (mistral’s form, content corrected):

```json
{
  "schema": 1,
  "device": {
    "id": "ROCKNIX-ee5013fc56",
    "label": "Anbernic-RG35XX-SP",
    "model": "Anbernic RG35XX SP",
    "family": "H700",
    "os_version": "20260905"
  },
  "generated_at": "2026-09-05T15:37:28Z",
  "entries": {
    "savestates/gba/Mega Man & Bass (USA).state1": {
      "kind": "state",
      "sha256": "…64 hex…",
      "size": 50816,
      "mtime": "2025-07-29T05:09:49Z",
      "captured_at": "2025-07-29T05:09:50Z",
      "captured_local": "2025-07-29T01:09:50-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Mega Man & Bass (USA).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": 1,
      "screenshot": "savestates/gba/Mega Man & Bass (USA).state1.png",
      "replaces": null,
      "remote_hash": { "type": "dropbox", "value": "…" }
    },
    "savestates/gba/Advance Wars (USA) (Rev 1).state.auto": {
      "kind": "auto",
      "sha256": "…",
      "size": 43011,
      "mtime": "2025-07-29T04:51:38Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Advance Wars (USA) (Rev 1).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": null,
      "screenshot": "savestates/gba/Advance Wars (USA) (Rev 1).state.auto.png",
      "replaces": "…the previous auto state's sha256…",
      "remote_hash": null
    },
    "gba/Advance Wars (USA) (Rev 1).srm": {
      "kind": "save",
      "sha256": "…",
      "size": 65536,
      "mtime": "2025-07-29T04:51:39Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "gba",
      "rom": "Advance Wars (USA) (Rev 1).gba",
      "emulator": "retroarch",
      "core": "mgba",
      "core_build": "e31759b24e7…",
      "core_display_version": "0.11-dev",
      "slot": null,
      "screenshot": null,
      "replaces": "…",
      "remote_hash": null
    },
    "dc/shared/savefiles/": {
      "kind": "container",
      "sha256": "…",
      "size": 131072,
      "mtime": "2025-07-29T04:51:39Z",
      "captured_at": "2025-07-29T04:51:40Z",
      "captured_local": "2025-07-29T00:51:40-04:00",
      "clock_synced": true,
      "system": "dc",
      "rom": null,
      "emulator": "flycast",
      "core": "flycast",
      "core_build": "…",
      "core_display_version": "…",
      "slot": null,
      "screenshot": null,
      "replaces": "…",
      "remote_hash": null
    }
  }
}
```

---

## 4. Detection

### 4.1 Detector

- **The detector is our own three-way classifier, not bisync.** Bisync is demoted to a candidate transport; the spike has not run (S01).
- **The detector never runs `--resync` on its own** (S05 futro AC (b)); use `--recover` and `--resilient`.
- **The bisync workdir stays at its default `/storage/.cache/rclone/bisync`** (persistent, `HOME=/storage`) and is named in the script so a future change of `HOME` cannot move it under `/var` (S05 futro AC (d)).

### 4.2 Classification

- **Complete member-map comparison** (claude §2.3.1, kimi §4.3, gpt §4.2). A unit is a map of path → hash over its complete member set. If any member differs, the unit differs; if the member set differs, the unit differs.
- **A thumbnail anomaly is not a progress fork when the state bytes are identical.** D-CLOUD-030 expressly excludes the thumbnail from version identity (S03 §1).
- **A retirement for X encounters Y at a relevant path → conflict or stale operation; never treat the record as permission to remove Y** (gpt §4.3). A stale retirement record cannot remove a path’s later occupant.

### 4.3 Exit path

- **Fresh evidence before upload** (claude §2.5.2, gpt §5.2). The exit path reads cloud evidence for the changed units before uploading. On a hash backend: `lsjson --hash` scoped to the changed paths. On a hashless backend: manifest claims plus download-and-hash.
- **Defer hashless verification if it exceeds the budget** (gemini §4.2). If the download-and-hash exceeds 5 seconds, defer verification to the boot/menu full pass, leaving the exit push as a fast-path upload only. The card must say “waiting” rather than “safe in the cloud”.
- **Spawn A: compute the backend hash locally** (claude §2.5.2 step 4). `rclone hashsum <type>` or busybox `md5sum` on md5 backends, so the *next* exit push for the same game can confirm C = A without a listing. Without it, a second changed session before any full pass defers.
- **Spawn count:** 0 idle, 3–4 changed (claude §2.5.2). The idle path needs no network answer at all; the changed path is measured at Gate 6.

### 4.4 Boot sync

- **Boot sync under ES’s scheduling** (all four). The race with a live session is necessary (S35, S41); nothing embedded says when ES is up relative to the network or how `autostart/102-cloud-saves` hands off. That handoff is a gap to name (§9).
- **Queue-and-badge for unattended passes** (all four). IA rev 4 says “a sync that reports conflicts opens the wizard” (S02); all four queue for boot/exit. This is an IA rev 5 item.

---

## 5. Resolution

### 5.1 Wizard

- **Cloud is always the left column** (S02 rev 3).
- **KEEP LEFT / KEEP RIGHT / KEEP BOTH** (S02 rev 2). KEEP BOTH is savestates only via ES’s own `getNextFreeSlot()`; in-game saves are shown disabled with a reason.
- **KEEP BOTH on an auto-state conflict uses a deterministic rule** (claude §2.3.3, gpt §7.1 criterion 7, mistral §1.3). The device’s resume point stays at `.state.auto`; the cloud copy becomes a numbered state with its PNG. The done page names where the cloud copy went.
- **Nothing transfers until COMPLETE** (S02). The walkthrough is reversible right up to the end; quitting partway leaves both sides exactly as they were.
- **Non-conflicting files are applied before the walkthrough starts** (S02). This is what makes the slot choice safe. Once every cloud-only file has been downloaded, free-on-device and free-on-both are the same thing, and a merge cannot pick a slot the cloud is already using.
- **The done page names each discarded copy per game** (S02 rev 4 AC). The audit line for it is written *before* the apply step deletes anything.

### 5.2 Settings

- **Review decisions before applying** — off by default; turns the summary from a step everyone pays for into one the careful can opt into.
- **Keep discarded saves** — on by default; retains the losing copy so a choice can be undone. A **count selector** sets how many to keep, and stays visible but unselectable while the toggle is off (dim, don’t hide — the capability should be discoverable before it is enabled). The fixed count is also the retention rule, so discarded copies cannot grow without bound on card storage.

---

## 6. Retention and recovery

### 6.1 Retention store

- **Discard store at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>`** (claude §2.4.1). PNG travels with the state (S03 §4).
- **Sidecar per retained copy** (`<sha256>.json` beside it), written *before* the destructive step, carrying:
  - the copy’s manifest entry verbatim (kind, sha256, system, rom, slot, `origin`/device, core, core_build, captured_at/local, clock_synced, screenshot path + sha256);
  - `reason` ∈ {`conflict-loser`, `superseded-by-download`, `compaction`, `es-delete`};
  - `winner` = {side, path, sha256, device};
  - the run/transaction id;
  - the wizard’s decision text.
- **Retention count is per save unit** (gpt §2). A global count of 3 across the whole store would be consumed by three routine one-way downloads of unrelated games; the primary case — “I picked the wrong side for *this* game” — would be gone.
- **Transaction preimages and unresolved candidates are exempt from the count** (gpt §6.3, §8). A retention sweep must not evict the only copy of an unreviewed head.
- **The store’s home is not settled by “outside the sync tree”** (gpt §1.2). The IA doc’s own convention is that `.cache` contents *self-invalidate* (`repo/docs/conflict-wizard-ia.md` [V]); without this sentence, some future cleanup will correctly-by-convention delete the discard store. Decide the store’s home alongside its shape.

### 6.2 Recovery tool

- **The restore tool is a separate issue** (maintainer decision). It is the wizard’s own compare-and-choose surface pointed at a game’s retained past versions, reached from outside the moment of resolution.
- **Move `gpt-revised_plan-r2.md`’s “minimal native recovery route” to the new issue as its seed.** The design work is not wasted — it is the tool’s shape.

---

## 7. Deletion propagation

### 7.1 Explicit deletes

- **Version-specific retirement records** (gpt §4.3). An observed ES delete or move produces a receipt naming the exact version; a detached card produces no record → fail closed; a deliberate delete produces one → propagates.
- **Receipts are propagated as copy-verify-delete into a dated sibling** (D-CLOUD-026). The sibling is a dated directory under the sync root, never inside it (D-CLOUD-014).
- **The delete hook is the one load-bearing hook** (D1). ES’s delete path is the proposed home of explicit-delete retirement records. If the hook does not exist, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships.

### 7.2 Compaction

- **Direct remote compaction** (claude §2.3.2). After a renumber uploads `state3 = H`, the cloud holds `state3` and `state5` with equal hashes; retiring the cloud’s higher slot by copy-verify-delete into the sibling terminates the loop with no journal at all.
- **The renumber signature is also inferable by hash.** The hash agreement says was at slot k is now at slot k−1.

---

## 8. Adapter over ES’s slot primitives

### 8.1 Defects

- **`getNextFreeSlot()` returns −99 for an auto-only repository** (S37). The auto state sits in the vector with slot −1, the 99999→0 scan finds nothing.
- **`copyToSlot()` returns true whatever `renameFile`/`copyFile` did** (S38). The function executes `Utils::FileSystem::renameFile(...)` or `copyFile(...)` and unconditionally hits `return true;` at the end without checking their success.
- **`makeStateFilename(fullPath = true)` derives the destination from the source’s parent** (S38). A staged cloud state’s copy would land in the stage directory.

### 8.2 Adapter contract

- **Compute destinations from the config templates itself.**
- **Allocate from `firstslot` for an auto-only repository.**
- **Distinguish:**
  - auto-only, supported repository: use its valid first numbered slot;
  - unsupported/disabled repository: refuse;
  - unexpected allocator failure: refuse.

---

## 9. Gaps surfaced to the orchestrator

- `GuiSaveState.cpp` — the delete path is now the proposed home of explicit-delete retirement records (D1).
- `SaveState.h`/`SaveStateRepository.h` — default arguments.
- `Paths.cpp`, `setsettings.sh` — RetroArch `savestate_directory`, `savestate_auto_save`.
- rclone 1.75.0 documentation or source for `--backup-dir` with `copy`, `lsjson --files-from`, `hashsum` on local paths, Dropbox hash type on local files.
- `docs/es-ui-style-guide.md`.
- Current issue bodies with edited ACs.
- Executed hardware, backend, interruption, compatibility, retention-reader, and round-trip results.

---

## 10. What should not be built

- A native undo surface in the resolution flow (gpt §8, §13) — descoped by the maintainer.
- Cross-device resolution receipts synced through manifests (gpt §4.4) — V2; the ordinary outcome is correct and retained (D5).
- The KEEP BOTH auto sub-choice (kimi §4.4 amendment 3) — one more press the maintainer has said not to add (D3).
- Move-observation hooks justified by `replaces` fidelity (kimi §4.1) — keep the delete hook for receipts; treat the move hook as optional (D4).
- `--include`-based manifest transport (gemini §2.5) — a silent no-op transfer per S09; use `--files-from` (D7).
- A probe replacing `ip route` (gemini §4 item 4) — contradicts D-CLOUD-028 (D8).
- Per-file “any member divergent” unit classification (gemini §2.1) — misses the disjoint-member fork (D1).
- “Conservative resurrection” of compacted duplicates (mistral §1.4) — does not converge (D4).
- Withdrawing D-CLOUD-029 by assertion (mistral §2) — the row stands; the maintainer’s toggle posture is compatible with it and needs no row.
- A SQLite index — all four agree; say so on #20 and close the question.
- A generation counter that does more than fail closed on a same-ID manifest fork (gpt §3.3) — a cloned card is an edge case; warn and refuse (kimi §4.1 rule 5) is enough.
- Anything that reads a retention count as permission to evict an unreviewed head — every plan’s store must exempt transaction preimages and pending candidates (gpt says it; the others must).

---

## 11. Decision register amendments

### D-CLOUD-031-A (refines D-CLOUD-031)

**The save manifest is one JSON file per device at `savestates/.rocknix/manifest-<device-id>.json`, describing in-game saves as well as states by path relative to the sync root; the local agreement record is kept unsynced under `/storage/.cache/cloud_sync/agreed.json`.** Refines D-CLOUD-031. Forced by the allowlist: nothing beside an in-game save syncs, and XML is excluded outside `savestates/`. The manifest carries `kind: "container"` for shared VMU/memcard units, with `rom: null`.

### D-CLOUD-031-B (refines D-CLOUD-031)

**Establish agreement on verified equality as well as transfer.** The signed schema never writes agreement on verified equality (S03 §9); the first change to any save on a device upgraded to the engine then classifies as “never agreed → ask” (S03 §3). This is an upgrade that is not invisible (S11). Write agreement if absent (kimi §4.3).

### D-CLOUD-030-A (refines D-CLOUD-030)

**After a sync, two slots of one game holding the same hash are compacted: the higher slot is removed, only after both files are re-read and the hashes found equal, and the removal is written to the audit log. Propagate as moves into dated siblings, capped per run.** Refines D-CLOUD-030. Direct remote compaction converges without any receipt.

### D-CLOUD-029-A (refines D-CLOUD-029)

**The game-exit sync reads cloud evidence for changed units before uploading.** The exit path reads cloud evidence for the changed units before uploading. On a hash backend: `lsjson --hash` scoped to the changed paths. On a hashless backend: manifest claims plus download-and-hash. Defer hashless verification if it exceeds the budget, leaving the exit push as a fast-path upload only. The card must say “waiting” rather than “safe in the cloud”.

### D-CLOUD-027-A (refines D-CLOUD-027)

**The discard store is at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>`, with a `<sha256>.json` sidecar per retained copy carrying the full comparison context.** The store’s home is not settled by “outside the sync tree”; decide it alongside the sidecar shape. Retention count is per save unit, with exemptions for transaction preimages and unresolved candidates.

### D-CLOUD-024-A (refines D-CLOUD-024)

**The wizard ships in the same feature drop as the cloud-sync revamp, with retention ON by default bounded by a count, and no undo control in V1.** The restore tool is a separate issue shaped as the wizard’s compare-and-choose pointed at retained versions.

---

## 12. What the amendments cost

- **`gpt-revised_plan-r2.md`** — Low. Delete “minimal native recovery” from §8 and §13; move §4.4’s resolution receipts and the “completed resolution” operation record to “may follow later”; keep the move/delete/compaction operation records (they are convergence, not lineage). Its store is the closest to the reader requirement; it owes one sentence: the frozen plan’s per-unit record is *retained beside the copies*, not disposed of on completion.
- **`claude-revised_plan-r2.md`** — Low. Add the discard sidecar (§1.2 from kimi); re-justify deletion propagation (§2, D1); its done-page sentence already exists via the futro ACs it carries.
- **`kimi-revised_plan-r2.md`** — Medium. Drop the KEEP BOTH auto sub-choice (D3). Add the discard sidecar; the `origin` data it needs is already in hand at discard time. Narrow the ops journal’s justification to deletion receipts (D4) — the `replaces`-fidelity argument is lineage depth the maintainer has set aside. Separately from the amendments, its exit pass fails the futro’s #22 AC (a) (D2).
- **`gemini-revised_plan-r2.md`** — Moderate. Add the discard sidecar; its “capped per run” on retirement propagation (§3, D-CLOUD-030-A) must be clarified — if the cap *drops* records it reintroduces non-convergence; `gpt-revised_plan-r2.md` §4.3’s rule is the right one: reaching a control-state limit stops mutation rather than silently discarding correctness state.
- **`mistral-revised_plan-r2.md`** — Moderate–high. Add the discard sidecar; correct the four errors in §4.4 before its content is safe to lift anywhere.
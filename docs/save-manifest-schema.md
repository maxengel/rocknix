# Save manifest — identity, lineage, and schema (#20, #24)

**Rev 1, 2026-09-05.** Section 1 is the identity decision #24 asked for
(**D-CLOUD-030**, decided). Sections 2–4 follow from it. Sections 5–8 are the
shape and the fields (#20; proposed as D-CLOUD-031, awaiting sign-off), with
worked examples from the RG35XX SP. Section 9 is what other issues must supply.
Nothing here is built.

Companion to [conflict-wizard-ia.md](conflict-wizard-ia.md) (what the player
sees) and to the futro of 2026-09-05 in
[`plans/conflict-resolution/`](../plans/conflict-resolution/vita-style-conflict-resolution.md)
(what was verified before this was written).

## 1. A save version is identified by its content hash

**Decided (D-CLOUD-030):** the identity of a save version is the **sha256 of
the file's bytes as stored** — the compressed savestate (`savestate_file_compression
= "true"` on the device) or the raw in-game save. **The slot number and the
file name are attributes** of where a version currently sits on one device,
not its identity.

Why this and not the slot:

- **Renumbering is a rename.** ES calls `renumberSlots()` after every savestate
  deletion, and it moves files with `copyToSlot(slot, move = true)`. The bytes
  do not change, so the hash does not change; the slot does. Sync sees a
  delete and a create; the hash sees one version that moved. Slot numbers are
  therefore not stable across devices (#24), and a hash is.
- **It is the same on every side.** A remote's native hash type varies by
  backend (Dropbox's own, S3's md5, none at all on WebDAV); sha256 computed by
  us at capture compares sidecar to sidecar regardless of where the file is.
- **It is cheap.** States on the device are tens of KB (`mslug.state1`:
  28,408 B; its thumbnail 47,687 B); `sha256sum` is busybox-present.

Consequences the rest of the design inherits:

- **Moved versus changed.** Same hash under a new path is a *move*: no
  conflict, no new version. A new hash at a path is a *new version*.
- **A slot mismatch is not a conflict.** The same hash sitting in slot 1 on
  the device and slot 2 in the cloud is one version in two places.
- **Duplicates are compacted.** A renumber on one side followed by a sync can
  leave one game with the same hash in two slots (one extra copy per affected
  state per divergent renumber; with today's copy-only sync, also the deleted
  state coming back). **Rule (D-CLOUD-030):** after a sync, the higher-numbered
  copy is removed, only after both files are re-read and the hashes found
  equal, and the removal is written to the audit log. The player is already
  asked to resolve real conflicts; a duplicate is nothing to decide and must
  not pile up beside them. Distinct from *keep discarded saves*, which retains
  deliberately chosen losers up to a count.
- **The thumbnail is not part of the identity.** `{{romfilename}}.state{{slot}}.png`
  travels with its state by path; `copyToSlot` already moves both.

## 2. Lineage and agreement

Identity says *which* version; two more records say *how it got here* and
*what both sides last held*.

- **Lineage, per device, per path**: the current hash and the hash it
  replaced at that path on this device (`replaces`), with when, which device,
  which core and core build. This is what the per-device manifest records
  (D-CLOUD-017's shape: each device writes only its own file, readers take the
  union). Overwriting slot 1 produces a new hash whose `replaces` is the old
  one; renumbering produces the same hash at a new path and no new entry in
  the chain.
- **Agreement, per device, per path**: the hash this device last **uploaded
  or downloaded** for that path — the last version both sides agreed on, *A*.
  Kept **locally and never synced** (under `/storage/.cache/cloud_sync/`, the
  directory the stamps already use), because it is one device's memory of a
  conversation, not shared truth.
- **The cloud's current version, without downloading**: list the remote with
  `rclone lsjson --hash` and match its native hash against the remote hashes
  the manifests recorded at upload time; the matching entry gives the sha256.
  Where the backend offers no hash (the QA WebDAV), size and modtime from the
  manifest entry are the hint, and sha256 after download is the confirmation.
  A listing that answers nothing is *unknown*, never "no conflict"
  (blindspot 22).

## 3. The conflict test

Per path, with *L* the local hash, *C* the cloud's, *A* the agreed one:

| L vs C | A known? | L vs A | C vs A | Verdict | Action |
|---|---|---|---|---|---|
| equal | — | — | — | identical | nothing |
| differ | yes | equal | differ | cloud changed | download, no prompt |
| differ | yes | differ | equal | device changed | upload, no prompt |
| differ | yes | differ | differ | **divergent** | wizard |
| differ | no | — | — | **divergent** (never agreed) | wizard — conservative |
| only one side has it | — | — | — | one-way | transfer, no prompt |

This is the IA doc's table (cloud-only down, device-only up, same nothing,
changed-on-both ask) made mechanical. Two refinements:

- **A move is not a conflict.** A state renumbered on one side appears as
  "device-only at the new path" plus "cloud-only at the old path"; when the
  two hashes are equal it is one version that moved, and the rule in #24 says
  which path wins.
- **Never agreed means ask.** Two pre-existing copies with different content
  and no shared history are exactly the case the player must decide; there is
  no recency to fall back on, and this is the milestone's rule (#11).

## 4. Special cases

- **Auto states are the commonest conflict.** `game.state.auto` is written at
  exit wherever RetroArch's auto-save is enabled (`mspacman.state.auto` exists
  on the device), so two devices playing the same game diverge on it every
  session. The wizard (#23) should expect this pair most often and make it
  the fastest decision on the page — it is the "resume where I left off"
  choice — and the manifest should mark the kind (`auto`) so the wizard can
  label it as a resume point rather than a numbered slot.
- **In-game saves have no lineage inside a session.** RetroArch flushes SRAM
  every 10 s (`autosave_interval = "10"` on the device) and at exit; capture
  runs after exit, so the hash it records is the session's final state.
- **`unknown` has an identity but no provenance.** A file with no manifest
  entry (written before this existed, or by another sync client) still gets a
  hash computed locally, so the conflict test works; its device, core and
  build are `unknown` and are shown as such. Nothing stamps a file it did not
  write (#10, #20 threads; `upgrade-and-install.md`).
- **The losing copy's thumbnail goes with it.** Whatever *keep discarded saves*
  retains or removes, it does so for the pair.

## 5. Shape: one file per device, under `savestates/`, covering every save

**Proposed (D-CLOUD-031, refines D-CLOUD-017):**

```
<sync root>/savestates/.rocknix/manifest-<device-id>.json
```

- **One file per device, each device writes only its own.** Several handhelds
  write the same cloud folder; a shared file is a write conflict by
  construction (D-CLOUD-017). Readers take the union of every
  `manifest-*.json` they can see.
- **Under `savestates/`, whatever it describes.** The sync allowlist passes
  anything under `savestates/` and nothing beside an in-game save except the
  save itself (futro fixture, 2026-09-05: `gba/game.srm.json` is excluded by
  `- /**`), and `- /**/*.xml` rules XML out everywhere else. So the file that
  describes `gba/Advance Wars (USA) (Rev 1).srm` lives under `savestates/`
  and names the save by its path relative to the sync root. D-CLOUD-017's
  `states-<id>.json` becomes `manifest-<id>.json` because it is no longer
  only about states.
- **JSON**, not XML: the allowlist, `jq` on the device (`/usr/bin/jq`), and
  the precedent of `cloud_backup`'s `device.json`. Written whole, to a
  temporary name and renamed into place, so a reader never sees a torn file.
- **Entries keyed by path**, one per file, so "the entry for this path" is a
  lookup and the union of two devices' manifests is a merge of maps.
- **The local agreement record is a separate file and never synced**:
  `/storage/.cache/cloud_sync/agreed.json`, same entry shape minus provenance,
  one per path, holding the hash this device last uploaded or downloaded (§2).

Size: about 400 bytes per entry; the device here has ~50 saves and states,
so ~20 KB. Trivial to sync on every game exit.

## 6. Fields

Top level:

| Field | Type | Meaning |
|---|---|---|
| `schema` | int | `1`. Readers refuse a higher number and treat a missing one as `0` (pre-schema). |
| `device.id` | string | `cloud_device_id` — stable, seeded from the permanent hardware address (#49). |
| `device.label` | string | `cloud_device_id --label`, folder-safe (`Anbernic-RG35XX-SP`). |
| `device.model` | string | `/proc/device-tree/model`, for display (`Anbernic RG35XX SP`). |
| `device.family` | string | `HW_DEVICE` from `/etc/os-release` (`H700`). |
| `device.os_version` | string | `OS_VERSION` from `/etc/os-release`. |
| `generated_at` | string | UTC, ISO 8601, when this file was last written. |
| `entries` | object | path → entry, path relative to the sync root (`/storage/roms`). |

Per entry:

| Field | Type | Meaning |
|---|---|---|
| `kind` | `"state"` \| `"auto"` \| `"save"` | numbered savestate; the `.state.auto` resume point; an in-game save (`.srm`, `.sav`, memcard, …). |
| `sha256` | string | **The identity of this version** (D-CLOUD-030): sha256 of the bytes as stored — compressed for a state (`savestate_file_compression = "true"`; files begin `#RZIPv`), raw for a save. |
| `size` | int | bytes as stored. A cheap pre-check before hashing, never a substitute for it. |
| `mtime` | string | the file's modification time, UTC ISO 8601 (ext4 here; second resolution). What rclone compares by; recorded so a listing can be matched without a download. |
| `captured_at` | string | UTC ISO 8601, when this entry was written. |
| `captured_local` | string | the same instant in the device's local time with offset (`2026-09-05T01:32:46-04:00`) — the wizard shows local time, and the offset is what makes two devices' local times comparable. |
| `clock_synced` | bool | `timedatectl show -p NTPSynchronized` at capture. A device that booted without a network has a wrong clock; the wizard says so rather than trusting the time. |
| `system` | string | ES system name (`gba`). |
| `rom` | string | the ROM file name with extension, from ES's game path. For a state this is what `{{romfilename}}` stood for; it is recorded rather than re-derived so a rename of the state cannot detach it from its game. |
| `emulator` | string | ES's resolved emulator (`retroarch`, `duckstation`, …). |
| `core` | string | the libretro core name (`mgba`); for a standalone emulator, the emulator name again. Never empty (ES does the same in `SaveStateConfig::getDirectory`). |
| `core_build` | string | our own `PKG_VERSION` pin for that core's package (D-CLOUD-017), or `"unknown"`. The thing two devices compare to know whether a state will load (#19). See §9. |
| `core_display_version` | string \| null | `display_version` from `/usr/lib/libretro/<core>_libretro.info` (`1.61` for snes9x), for humans; never compared. |
| `slot` | int \| null | attribute, not identity. `0` for `game.state`, `n` for `game.staten`; `null` for `auto` and `save`. |
| `screenshot` | string \| null | remote-relative path of the PNG (`savestates/gba/X.state1.png`), so the wizard can fetch the cloud side's picture with one small copy and never has to derive it from the state's name. `null` for a save — never a substitute image (#23). |
| `replaces` | string \| null | the sha256 this version replaced at this path on this device, or `null` for the first version seen. One step of lineage; the audit log holds the rest (§2). |
| `remote_hash` | object \| null | `{"type": "dropbox", "value": "…"}` as reported by `rclone lsjson --hash` after the upload that carried this version; `null` until then. Lets a later listing say "the cloud still holds this version" without a download. Backend-specific by construction (Dropbox offers only its own type; WebDAV none), so it is only ever compared against a listing of the same remote. |

Rules the fields obey:

- **Absent is not zero.** A field that could not be determined is `null` or
  `"unknown"`, never `0` or `""`. `clock_synced: false` and
  `core_build: "unknown"` are values the wizard renders, not errors (#21
  thread; `upgrade-and-install.md`).
- **Nothing stamps a file it did not write.** An entry is written by the
  device that produced the save, at the moment it is produced. A file with
  no entry anywhere is `unknown` in every provenance field and still has a
  hash, computed locally, so the conflict test (§3) works for it.
- **A move is an update to the key, not a new entry.** After ES renumbers,
  the capture step finds the same hash under a new path and moves the entry;
  `replaces` and `captured_at` are unchanged.

## 7. Examples (from the RG35XX SP, 2026-09-05)

`savestates/.rocknix/manifest-ROCKNIX-ee5013fc56.json`:

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
    }
  }
}
```

The same three files sit on the cloud today with Dropbox's own hash type
(`rclone lsjson --hash`, 2026-09-05: `"Hashes":{"dropbox":"1f91…"}`) and
modification times equal to the device's, which is what `mtime` is for.

`/storage/.cache/cloud_sync/agreed.json` (local, never synced):

```json
{
  "schema": 1,
  "entries": {
    "gba/Advance Wars (USA) (Rev 1).srm": {
      "sha256": "…",
      "remote_hash": { "type": "dropbox", "value": "…" },
      "at": "2026-09-05T15:40:02Z",
      "direction": "up"
    }
  }
}
```

## 8. What the schema does not preclude (V2, #25)

- A snapshot is a copy of a file whose entry has a `kind`, a `sha256` and a
  `replaces`; the audit log records why it was taken. No field is reserved
  because none is needed: a snapshot directory's own manifest uses this
  schema unchanged.
- **The snapshot directory must be excluded from the sync allowlist
  explicitly**, and the rule must come *before* `+ /savestates/**`, because
  rclone filters take the first match: `- /savestates/.snapshots/**`. The IA
  doc's "excluded from the sync allowlist" is a requirement on #25, not a
  property the layout has on its own. Verified the hazard's shape today —
  anything under `savestates/` syncs unless a rule ahead of that line stops
  it.

## 9. What other issues must supply

- **#21 — the core pins file.** `core_build` is our `PKG_VERSION` pin and
  nothing on the device carries it: `/usr/lib/libretro/*.info` exists (the
  2026-09-01 note on #10 that ROCKNIX ships none is wrong) but holds
  libretro-super's `display_version`. The image build knows every pin
  (`config/functions` `get_pkg_version`, and `virtual/emulators` holds
  `LIBRETRO_CORES`); emit `/usr/share/rocknix/core-pins` at image build, one
  line per core package: `<package> <PKG_VERSION>`. The capture step maps
  core name → package (`mgba` → `mgba-lr`, `genesis_plus_gx` →
  `genesis-plus-gx-lr`; the exceptions need a small table, which is #21's to
  write) and records `"unknown"` when the map has no answer.
- **#21 — capture at game exit, told rather than discovering.** ES knows the
  game, `getEmulator(true)` and `getCore(true)` at the point where it starts
  the exit sync (`FileData.cpp:836`); it passes them on the command line so
  the capture step never has to reverse-engineer which core wrote a state.
  Standalone emulators pass their own name as `core`.
- **#22 — the agreement record** (§2, §7) is written by the transfer that
  moves a version, in both directions, keyed by path.
- **#25 — the allowlist rule for snapshots** (§8), ahead of the `savestates`
  line.
- **#10 — whether `savestates/<system>/<core>/` becomes the layout** changes
  nothing here: the entry key is a path relative to the sync root, whatever
  the layout; `system` and `core` are recorded as fields, not parsed out of
  the path.

## Open

- **D-CLOUD-031** — the shape in §5 (one JSON per device under
  `savestates/.rocknix/`, covering in-game saves as well; agreement record
  local and unsynced). Awaiting the maintainer's sign-off, which is #20's
  acceptance gate.

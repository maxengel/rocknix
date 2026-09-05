# Save manifest — identity, lineage, and schema (#20, #24)

**Rev 0, 2026-09-05.** Section 1 is the identity decision #24 asked for
(**D-CLOUD-030, decided by the maintainer 2026-09-05**). Sections 2–4 follow
from it. Section 5 lists what rev 1 — the shape and the field list, #20 — must
decide, with the constraints already established. Nothing here is built.

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

## 5. What rev 1 must decide (shape and fields, #20)

Constraints already established, cited so they are not re-derived:

- **Shape**: D-CLOUD-017's per-device file, `savestates/.rocknix/states-<device-id>.json`,
  each device writing only its own. Extend it to in-game saves as well,
  because a sidecar beside an `.srm` **does not sync** (futro fixture,
  2026-09-05: `snes/game.srm.json` excluded; anything under `savestates/`
  passes) and `- /**/*.xml` excludes XML everywhere outside `savestates/`.
  Name to settle: the file is no longer only about states.
- **Fields per entry** (draft): `path`, `kind` (`state` | `auto` | `save`),
  `sha256`, `size`, `mtime`, `remote_hash` `{type, value}` (recorded after
  upload), `captured_at` (UTC), `device_id`, `device_label` (both from
  `cloud_device_id`), `system`, `rom`, `emulator`, `core`, `core_build`,
  `slot` (attribute), `replaces`, `screenshot` (remote-relative path or
  `null`; never a substitute image), `schema`. Absent must be
  distinguishable from empty or zero (#21 thread).
- **`core_build` is not on the device today.** `PKG_VERSION` of the core's
  package is the right value (D-CLOUD-017) and nothing ships it. The device
  *does* carry `/usr/lib/libretro/*.info` — contrary to the note on #10 that
  ROCKNIX ships none — but those hold libretro-super's `display_version`, not
  our pin. **#21 gains a task: emit a core-pins file at image build** (one
  line per core: name, `PKG_VERSION`), read at capture.
- **ES knows the emulator and core at exit** (`FileData::getEmulator()`,
  `getCore()`; the exit sync is started from `FileData::launchGame`), so the
  capture step can be told rather than left to discover.
- **The agreement record and any index live outside the synced tree**; the
  allowlist already excludes `*.db*` and `*.sqlite*` as a backstop.

## Open

- **Rev 1 name and field list** (§5, #20). D-CLOUD-030 (identity and
  duplicate compaction) is decided, §1.

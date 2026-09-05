author:	maxengel
association:	owner
edited:	false
status:	none
--
Direction confirmation (2026-08-18): the storage model should be a **metadata file living in each save directory alongside the saves** — exactly this issue's sidecar manifest. Two additions to the field list from today's discussion:

1. **Architecture** — the field list has core name+version but not the CPU arch. Cross-device savestate safety keys on **core × core-version × arch** (an aarch64 state restored into an x86_64 core of the same version is still suspect); the manifest must record all three so #10's namespacing and #22's detection can both key off it. Add: `arch` (e.g. `aarch64`, `x86_64`) and consider the chipset question from #10 (arch is likely sufficient granularity — chipset differences within an arch rarely change state layout; document the decision).
2. **Format**: prefer **one XML file per save directory** (e.g. `cloud_sync-meta.xml` with one entry per save/state file) over per-file sidecars — fewer files to sync, atomic to rewrite, and XML matches the ES ecosystem (gamelist.xml precedent, ES already ships pugixml). Per-file JSON sidecars remain the fallback if per-directory write contention (multiple emulators writing one system dir) proves real. Decide here with a short rationale either way.

Interaction to design for: the manifest file itself must ride the sync allowlist (`cloud_sync-rules.txt`) so metadata travels with the saves — and the conflict engine (#22) must treat manifest-vs-save mismatches (save synced, manifest stale) as a detectable state, not corruption.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
Design session on #10 (2026-08-19) settled two things that constrain this schema:

**The device field must be the build family, not the CPU architecture.** ROCKNIX compiles per device and the ARM targets differ materially — H700 is cortex-a53 with crypto-neon, RK3566 is cortex-a55 *without* the crypto extension, RK3588 is cortex-a76.cortex-a55. Record `HW_DEVICE` adjusted for `DEVICE_ROOT` (devices sharing a build root are binary-identical and must not fragment), plus the raw identifier for debugging.

**Manifests are the fine-grained record, not the transport key.** rclone filters on paths, not file contents, so a manifest cannot drive "sync only compatible" without a pre-pass that reads every file. The current lean on #10 is a remote-side filename suffix carrying the coarse build-family key, with this manifest carrying what a filename cannot: core name, core version, OS version, timestamps, screenshot reference. Design the schema so the coarse key is *derivable* from it, so the two never disagree.

**Attribution must happen at write time.** Stamping unstamped files at sync time re-creates the false-attribution problem — a state pulled from another device would be stamped locally as ours. Better to leave pre-manifest files permanently `unknown` than to guess. Practical consequence: the writer is likely the game-exit hook (`cloud_saves_gameend.sh`, already shipping), and states written before a hard power-off will legitimately never be stamped, so `unknown` needs to be a first-class value the rules engine handles rather than an error.

Also relevant to the schema's scope: **game saves are excluded from all of this** (portable across builds; never namespaced or filtered). Only savestates carry compatibility metadata.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Answering "define fallback" with what the device actually does

Verified on a running build (details and the round-trip evidence in #23):

- **Savestates** — `savestate_thumbnail_enable = "true"` ships enabled, so a PNG sits beside every savestate, including auto-slots (`game.state.auto.png`). They already sync under the current allowlist, so the manifest can reference a path that will genuinely be there on both sides.
- **Battery saves** — no thumbnail exists. RetroArch does not produce one, so `screenshot` has no honest value to hold for a `.srm`.

### Recommended fallback: none, explicitly

Make the field nullable and let the UI render a save without an image, rather than substituting a different picture. Reusing that game's latest savestate thumbnail for a `.srm` panel is the tempting option and the dangerous one: the player is choosing *by* the picture, so an image that is not of that save will drive wrong choices precisely where a wrong choice costs progress.

If a substitute is ever wanted, it should be a distinct field (`illustration` vs `screenshot`) so the UI cannot accidentally treat one as the other, and so a later reader can tell which it got.

### One more thing the schema should carry

The wizard renders the **cloud** side too, so it needs to fetch that side's thumbnail without pulling the savestate itself - the state can be megabytes, the PNG is small. Storing the thumbnail as its own remote-relative path (not derived by string-munging the savestate path) keeps that a single cheap `rclone copy`, and survives any future change to how states are named or compressed. Note `savestate_file_compression = "true"` is also on, so the state and its thumbnail already differ in more than extension.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Hashes for identity, and where the history database must *not* live

Checked on a device (rclone 1.74.4, sqlite3 and libsqlite3 both present).

### Hashes do solve stable identity

A content hash is unchanged by a rename, so the delete-plus-create that sync sees when ES renumbers slots (#24) can be recognised as the same save moving position. That closes the problem slot numbers created.

**Getting the cloud side is cheap.** `rclone lsjson --hash` returns hashes straight from the remote's metadata — no download:

```
{"Path":"game.state1","Size":5,"Hashes":{"md5":"..."}}
```

One listing call covers a whole directory.

**But the hash type is backend-dependent.** S3 gives md5; Dropbox uses its own `dropbox` hash; others differ. So do not treat the remote's hash as the identity — **store our own hash in the sidecar** (sha256, computed at capture) and compare sidecar to sidecar. The remote's native hash is still useful as a cheap "has this changed at all" shortcut, but it cannot be compared across backends or against a local sha256.

**And a hash identifies a version, not a lineage.** Modify a save and the hash changes completely, so hashes alone cannot say that v2 descends from v1. That link is what a history record provides — the hash is the identity of each version, the history is the thread between them.

### The database must not be in the synced tree

Verified: a `.db` placed under `savestates/` **syncs today**, and so does its `-wal` sidecar — `+ /savestates/**` catches everything in the directory.

```
GAMES/savestates/.history.db
GAMES/savestates/.history.db-wal
```

That is the one file we cannot afford to sync:

- Two devices both writing history makes **the database itself a conflict** — and it is the one file a player has no way to resolve by hand.
- rclone replaces files wholesale, so "resolving" it means one device's entire history overwrites the other's.
- A database copied mid-write is torn. The `-wal` above makes it worse: synced without its matching WAL, or with a stale one, SQLite can lose recent writes or refuse to open it.

### Suggested shape

- **Truth lives in per-save sidecars** that sync — small, text, independently resolvable, one per save.
- **SQLite is a local index built from those sidecars** — fast queries, never synced, and rebuildable by rescanning if lost or corrupted.
- Add `*.db`, `*.db-wal`, `*.db-shm`, `*.sqlite` as **explicit exclusions** in `cloud_sync-rules.txt`, so a database placed in a save directory — by us or by an emulator — cannot sync by accident.

Happy to make that filter change now if wanted; it is a small companion to whatever this issue settles on.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Prior-work grounding (retro on #26, 2026-09-04):** device identity is already solved — `cloud_device_id` (from #49) yields a stable id seeded from the permanent hardware address, stored value wins, survives a reflash; `cloud_device_id --label` gives the devicetree model for display. The manifest's `device` fields **reuse these**; do not define a second identity. Open design question that blocks this schema: slot numbers are not stable across devices (#24) — the manifest must key a savestate on something other than its slot.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Pre-futro audit — 2026-09-05.** Live state: `cloud_device_id` and `--label` shipped; allowlist excludes `*.db*`/`*.sqlite*` (the 2026-08-24 suggestion was applied); savestates compressed and flat per system on the device. Drift found: the body predated D-CLOUD-017 and three comments proposed three manifest shapes (blindspot 27). **Post-futro audit — 2026-09-05.** Body gained *Constraints settled since*, including the allowlist fixture result. Green light: this is the first design task of the batch, after #24's identity call.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Schema rev 1 for sign-off (Task 2 of the batch, 2026-09-05) — `docs/save-manifest-schema.md`

**Shape (proposed D-CLOUD-031, refining D-CLOUD-017):** one JSON per device at `savestates/.rocknix/manifest-<device-id>.json`, each device writing only its own, readers taking the union. It describes **in-game saves as well as states**, by path relative to the sync root, because the allowlist passes nothing beside a `.srm` and excludes XML outside `savestates/` (fixture on the device). The local agreement record — the hash this device last uploaded or downloaded per path — is a separate file under `/storage/.cache/cloud_sync/`, never synced.

**Per entry:** `kind` (state / auto / save), `sha256` (the identity, D-CLOUD-030), `size`, `mtime`, `captured_at` (UTC), `captured_local` (with offset), `clock_synced` (so a device that booted without a network is not trusted for time), `system`, `rom`, `emulator`, `core`, `core_build` (our `PKG_VERSION` pin or `"unknown"`), `core_display_version`, `slot` (attribute, null for auto and save), `screenshot` (remote-relative path or null — never a substitute image), `replaces` (one step of lineage), `remote_hash` (backend type + value after upload). Rules: absent is `null`/`"unknown"`, never zero; nothing stamps a file it did not write; a move updates the key, not the entry.

**Worked examples** from this device's own `Mega Man & Bass (USA).state1`, `Advance Wars (USA) (Rev 1).state.auto` and `.srm`, matched against the Dropbox listing (`rclone lsjson --hash`: type `dropbox`, mtimes equal to the device's).

**Two findings for the neighbours:**
- `core_build` is not on the device. `/usr/lib/libretro/*.info` **does** ship (the 2026-09-01 note on #10 said none) but carries libretro-super's `display_version`, not our pin. #21 must emit a core-pins file at image build (`get_pkg_version` exists in `config/functions`; `virtual/emulators` has the core list) and map core name → package.
- #25's snapshot directory must be excluded by a rule placed **before** `+ /savestates/**` — rclone filters take the first match, so "excluded from the allowlist" is a requirement, not a property of the layout.

Acceptance on this issue is your sign-off. Say yes, or what to change.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
Delivered and signed off (maintainer, 2026-09-05). The field list above maps to `docs/save-manifest-schema.md` rev 1: identity → §6 `system`/`rom` (+ `sha256` as the version identity, D-CLOUD-030); timestamps → `captured_at` / `captured_local` / `mtime` / `clock_synced`; device → `device.*` from `cloud_device_id`; emulator → `emulator` / `core` / `core_build` / `core_display_version`; screenshot → `screenshot` (remote-relative or null, never a substitute); kind → `kind` + `slot` as attribute; schema version → `schema`; snapshot readiness → §8 (no reserved field needed; the allowlist rule is on #25). Shape: D-CLOUD-031. Examples in §7 from the RG35XX SP's own files.

The maintainer's amendment — check the approach against all prior and planned cloud-sync work — is `docs/save-manifest-alignment-review.md` (`3108cadf49`): aligned with every decided row and shipped fix; seven actions propagated to #9, #25, #10, #21, #35, #22, #37 and #7, none of them changes to the schema.

Commits: `81c7e6402b` (rev 0, identity), `e1c41da297` (rev 1, shape and fields), `cd894a80a5` (sign-off), `3108cadf49` (review).
--

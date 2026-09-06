Depends on the schema (`docs/save-manifest-schema.md` rev 1, D-CLOUD-030/031) and adds rev 2 to it. Preceded by **Gate 12** (the unit table) and by Gate 0.

**What changed.** Capture no longer rides "the same `--recent` pass" (that pass is replaced by #22's reconciler); it is a step of its own, on every exit, with no rclone spawn. Sidecar-beside-the-save is dead (nothing beside an `.srm` passes the allowlist — fixture on the RG35XX SP, `docs/save-manifest-alignment-review.md`). The manifest's cloud path is unchanged (D-CLOUD-031); its local working copy leaves the saves tree.

### Requirements

- **R3 — schema rev 2, additive to D-CLOUD-031.** Per entry: `unit` (which game-save the file belongs to, from the unit table), `producer` (when the file was imported from another device, that device's id), `published_at`, `pub` (the publication this version arrived in: `<device-id>:<counter>`). Top level: `units` (the members each unit declares — what makes a torn publication detectable) and a bounded `retired` list (deletions this device made: hash, path, the `pub` it retires, when). Agreement is written only on verified equality and records `verified_by` (`remote-hash` · `size+mtime` · `download-sha256`). Manifests are read as a **claim set**: any device's claim about a path is a claim, and the cloud head is what the listing says (I5). The own manifest lives at `/storage/.cache/cloud_sync/manifest-<id>.json` and is published to `savestates/.rocknix/manifest-<id>.json` as a decided transfer; foreign manifests are cached under `/storage/.cache/cloud_sync/manifests/`, never written into the tree. The `schema` integer stays `1`: no cloud has received rev 1, and rev 2 only adds. **Never rewrite an unchanged manifest** (I8) — its mtime is what would otherwise churn every exit.
- **R5 (capture half).** Capture runs on **every** exit — toggle off, no network, lock held, emulator crashed — because a file written and not recorded is exactly what the classifier cannot explain later. The emulator and core recorded are the ones **frozen at command construction** (`SaveState::setupSaveState` may rewrite `-emulator`/`-core` via `_changeCommandlineArgument`; `FileData::getCore(true)`/`getEmulator(true)` re-resolve and are not the answer). ES passes `--system --rom --emulator --core` and the unit context on the command line; capture infers nothing.
- **Sealing is an independent copy (B1).** A changed member is copied into `/storage/.cache/cloud_sync/stage/` and hashed there; never hard-linked (a hard link shares the inode; an emulator flushing in place would change bytes already hashed). Cost: a few megabytes of SD writes per changed save per exit; paid because the alternative pushes bytes that are not the bytes that were hashed (D-CLOUD-034). Gate 12 records the actual bytes.
- **Changed set at exit** = size or mtime differs from the last captured entry; an equal-size, equal-mtime byte change is caught by a full pass, which hashes (A2).
- **The core-pins file (I15; `docs/save-manifest-schema.md` §9).** `/usr/share/rocknix/core-pins`, one line per core package `<package> <PKG_VERSION>`, emitted at image build from `LIBRETRO_CORES` × `get_pkg_version`; capture maps core name → package with a small exception table and records `"unknown"` when it has no answer. `/usr/lib/libretro/*.info` carries libretro-super's `display_version` and is recorded as `core_display_version`, never compared.
- Written whole to a temporary name, renamed into place; a reader never sees a torn file.
- **No rclone spawn.** Capture does not touch the network. The push is #22's. Capture takes **no lock**: ES holds the session lock around the whole launch, including capture (#22 R6).
- Nothing stamps a file it did not write; `unknown` is a value the wizard renders (`.claude/rules/upgrade-and-install.md`).
- Device fields come from `cloud_device_id` / `--label` (D-CLOUD-009).

### Acceptance

- [ ] Exit a game with the toggle off, again with the network down, again while a boot pass holds the lock: the manifest entry for the changed save exists each time, with `sha256` equal to `sha256sum` of the file on disk.
- [ ] Launch a state whose config is not the game's active core: the recorded `core` is the one on RetroArch's command line, not the game's default.
- [ ] A save flushed by the emulator during the seal window: the pushed bytes' hash equals the recorded hash (the independent copy); a hard-linked variant is shown to fail this.
- [ ] Exit with nothing changed: the manifest's mtime does not change.
- [ ] `core_build` equals the `PKG_VERSION` pin for the core's package on the same image; a core absent from the map records `"unknown"`, and the wizard shows it as such.
- [ ] A14: the manifest reaches the remote under `savestates/.rocknix/` with `remote_hash` null on WebDAV and non-null on MinIO, and is absent from the ROMs-and-BIOS tier after `cloud_content_backup` (#35).
- [ ] An N64 game's `.eep` and `.mpk` (and every standalone layout Gate 12 lists) appear as one `unit` with both members declared.
- [ ] Rev 2 is written into `docs/save-manifest-schema.md` and noted on #20, with the SQLite index closed as *not built* (D-CLOUD-027 leaves it to the schema; nothing needs it).

**Does not build**: no sidecars beside saves, no play-time fields, no second exit-path spawn, no lock in capture, no stamping of `unknown` files, no ancestry beyond `replaces`.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*

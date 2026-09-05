# Council problem statement — the foundation for cloud-save conflict resolution in ROCKNIX

**Convened:** 2026-09-05, from the `feature/conflict-resolution` worktree of the
maxengel/rocknix fork, at the start of milestone *Cloud Saves: Visual Conflict
Resolution* (epic #11; children #19–#25, #10; #9 is a dependency).
**Asked by:** the maintainer, on signing off the manifest schema (D-CLOUD-031).

## What we want from you

Judge whether the foundational approach below is the best one we could build
on — grounded in what this project has already shipped and decided, in where
rclone `bisync` is and is heading, and in the two devices in the maintainer's
hands — and if it is not, say what is. Specifically:

1. **The architecture, end to end**: detection, identity and lineage,
   presentation and resolution, merge, safety and rollback, and the migration
   path off today's shipped write paths. Endorse, amend, or replace each part.
   Where you disagree with a decided row in the register, cite its ID and give
   the argument that should reopen it; a decided row is binding unless reopened.
2. **Known unknowns**: for each one in §4, a resolution plan — what to measure,
   on which device, before which build step.
3. **Unknown unknowns**: what this design, this corpus, and this team have not
   seen. Name the failure and the cheapest experiment that would expose it.
4. **What must be proven on hardware before any of it is built**, in order.

Output shape: a thorough written analysis. No code. Cite the source documents
by path and the decisions by ID.

## The constraints that are not up for debate

- **Preserve player progress above all. Conflict handling never defaults to
  recency.** A newer file can hold less progress than an older one from
  another device. Default to non-destructive; never auto-delete the loser
  (epic #11's cardinal rule; `rclone-cloud-sync.md` § What gets synced).
- **Console-first.** A handheld, a controller, at most a phone. No browser on
  the device, no computer in the loop except where technically unavoidable.
- **Immutable OS, mutable `/storage`.** Every change lands on devices that
  already have state; an upgrade must be invisible — read both shapes, write
  the new one, never prompt about internals (`upgrade-and-install.md`).
- **rclone is the only transport**, one remote, 69 backends whose hashes and
  modtimes vary (Dropbox: own hash type; the QA WebDAV: none, size-only).
  busybox userland on the device; bash scripts; EmulationStation (C++) is the
  UI; no daemon beyond systemd units.
- **Budget**: starting rclone costs ~1 s on an A53; the game-exit sync is
  ~5 s when nothing changed and is watched by a player who just exited a game.
- **Guards fail closed; verify the artifact, not the report** — this
  subsystem's signature failure has been reporting success while doing nothing
  (`engineering-practices.md`).
- **One player, many devices, never concurrent** is the model; nothing
  enforces it across devices.

## The approach as it stands (what you are judging)

Decided (register IDs in brackets):

- **Identity** — a save version is the sha256 of its stored bytes; slot and
  file name are attributes, because ES renumbers slots by moving files
  [D-CLOUD-030]. Duplicates left by a renumber-then-sync are compacted after
  hash re-verification, logged.
- **Manifest** — one JSON per device at `savestates/.rocknix/manifest-<id>.json`,
  each device writes only its own, readers take the union; describes in-game
  saves as well as states by path relative to the sync root; the local
  agreement record (the hash last uploaded/downloaded per path) is unsynced
  [D-CLOUD-031, refining D-CLOUD-017]. Fields in `docs/save-manifest-schema.md` §6.
- **Namespace** — savestates by core, with the core *build pin* as data in
  the manifest, not in the directory name; game saves are one shared pool
  [D-CLOUD-017]. Existing states are `unknown` and consumers handle it.
- **Detection** — `rclone bisync` (1.75.0) with its default
  `--conflict-resolve none` reports; we resolve; bisync never renames a
  savestate loser (its suffix breaks the `{{romfilename}}.state{{slot}}`
  pattern ES matches); the detector never runs `--resync` on its own; every
  caller takes the one cloud lock [#22 ACs; #9 dependency].
- **Presentation** — a walkthrough, system by system then game by game; cloud
  always the left column; savestate screenshot or in-game-save glyph; date,
  time, device + model, core + build per side; no file size, no play time;
  KEEP LEFT / KEEP RIGHT / KEEP BOTH; KEEP BOTH is savestates only via ES's own
  `getNextFreeSlot()`; nothing transfers until COMPLETE; quitting discards;
  *keep discarded saves* (off by default, with a count) is the escape hatch,
  not deferral [`docs/conflict-wizard-ia.md` rev 4].
- **Audit** — append-only text at `/storage/.cache/log/cloud_audit.log`
  [D-CLOUD-027].
- **Today's write paths stay as shipped until #22 replaces them** — and they
  are newest-wins: boot and menu run `copy --update` down then up; the
  game-exit `--recent` upload is `copy` with no `--update` [D-CLOUD-029;
  blindspot 28]. The maintainer is the only user until the feature exists.
- **Compatibility** — `#19`'s bench protocol runs before the wizard's badge is
  designed as a safeguard or a convenience [D-CLOUD-025]; the three handheld
  families are all ARMv8-A aarch64 with globally pinned cores, so the badge
  may be a convenience.
- **Snapshots and rollback (#25)** are V2, planned so nothing precludes them.

## Known unknowns (from the 2026-09-05 futro and the alignment review)

1. Is chipset a compatibility axis at all, and is a failed savestate load
   loud or silent? (#19; decides the badge's severity.)
2. bisync against a real remote with compressed savestates (`#RZIPv`), a
   device-side rename, a genuine both-sides change, and an interrupted run:
   what does its listing state look like, and do `--recover`/`--resilient`
   avoid a `--resync`? Does bisync's own agreement state duplicate or conflict
   with our agreement record?
3. The auto state (`game.state.auto`) is written on every exit; two devices
   diverge on it every session. Is it the commonest conflict, and should the
   wizard treat it as a resume-point decision rather than a numbered slot?
4. KEEP BOTH's "next free slot" is safe only if every cloud-only state was
   downloaded before the wizard opened. Is the pre-pass gate sufficient, and
   what happens when it is interrupted?
5. No `es_savestates.cfg` ships; ES runs on compiled defaults and hard-codes
   the savestates root. Per-core directories (#10) mean creating one and
   moving RetroArch's `savestate_directory` with it — two consumers, one
   layout.
6. The core build pin is not on the device; #21 must emit it at image build
   and ES must pass emulator and core at game exit.
7. `BACKUPPATH == RESTOREPATH` is assumed.
8. Standalone emulators' save layouts (PPSSPP by game ID, Dreamcast shared
   VMU, N64 `.eep/.mpk`, PSX memcards) — the manifest keys by file path; how
   does a conflict in a multi-file save present?
9. The smallest panel is 480×320 (RG351M); side-by-side thumbnails may not be
   recognisable there.
10. Two devices online at once is not enforced; the lock is per device.
11. The round-trip suite (`tools/cloud-round-trip`, 24 steps) has never run;
    a GENERIC_X64 image now exists for it.

## What the sources contain

The reading list embeds, verbatim: the repo's agent guide and the four
rules that govern this subsystem; the wizard IA; the manifest schema and its
alignment review against all prior work; the futro (inside the plan file);
the decision and blindspot registers; the bench protocol; the changelog (a
claims document); the shipped scripts (`cloud_backup`, `cloud_restore`,
`cloud_sync_helper`, the allowlist, the config, `cloud_device_id`, the boot
sync); the relevant EmulationStation sources (savestate repository, save
state, savestate config, the game-exit path, the sync card); the bisync
planning note from the `rclone-bisync-beta` branch; and the bodies of #11,
#9, #10, #19, #20, #21, #22, #23, #24, #25, #35, #37 with their comment
threads. Prior council outputs are excluded by rule.

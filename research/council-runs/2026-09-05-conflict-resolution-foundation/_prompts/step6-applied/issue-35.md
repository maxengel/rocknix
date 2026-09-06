Child of #26; also the venue of Gates 0, 1, 2, 5, 6 and the fixtures every other gate reuses. `tools/cloud-round-trip` has **never executed**.

### Gate 0 — repair, then run, on WebDAV and MinIO

- [ ] The harness writes `rclone.conf` and restores the device's own afterwards; a device it has finished with has the remote it started with.
- [ ] Its archive assertions match the dated uploader and restorer (`cloud_backup` `backup_system_files`, `cloud_restore` `restore_system_files`): the settings archive lands under the device's folder with a leading date, and the newest of either format is what a restore picks.
- [ ] Its content fixture is a directory ES declares as a system (D-CLOUD-019) and the harness names it under the new key `CONTENT_REMOTE`.
- [ ] It reads the new config keys (`SAVESPATH`, `SETTINGS_BACKUPS`, `SAVES_REMOTE`, `SETTINGS_REMOTE`, `CONTENT_REMOTE`) and the old ones on an image that has not renamed them (D-UI-022 read-old-if-new-absent).
- [ ] Every existing step passes end to end; PL-10's `unsupported system` branch is observed producing output; the lock step exits 3 and stamps nothing; the exit-path steps assert `--max-age`/`--no-traverse` **until** #22 cuts over, then assert zero spawns on an idle exit (A10).
- [ ] Step names use D-UI-022's words (`settings archive`, `saves`, `ROMs and BIOS`).

### Fixtures for #11 (each written before the code it tests, and seen to fail first — `.claude/rules/engineering-practices.md` *A failure you find is yours to fix*)

- [ ] **A1** two roots against one remote, both changed since agreement: run the boot pair, the three saves rows' commands, the hub's commands and the exit push from each: as shipped this **fails** (blindspot 28); after #22, neither copy is overwritten and one conflict is reported.
- [ ] **A2, A3** as on #22.
- [ ] **A8** a torn unit (one member of an N64 `.eep`/`.mpk` pair) published and left: no root installs the mixed set; the hold clears when the second member lands.
- [ ] **A9** delete and renumber on one root; sync repeatedly on the other; restore a retired hash from the store; unmount one root and run: the pass refuses; remove one file with `rm`: a question is queued and nothing moves.
- [ ] **A11** a cloned `cloud_sync-device-id` on the second root refuses with `duplicate-device-id`.
- [ ] **A12** a config carrying a legacy `RESTOREPATH` unlike `BACKUPPATH`: migrated, warned, nothing touched.
- [ ] **A14** the manifest step: plant a state and a `.srm`, run the exit path, assert `savestates/.rocknix/manifest-<id>.json` on the remote with `sha256` equal to the planted bytes, `remote_hash` null on WebDAV and non-null on MinIO; then run `cloud_content_backup` and assert the manifest is absent from the ROMs-and-BIOS tier.
- [ ] **A5's reader** runs against the MinIO store from the second root.
- [ ] The retention ordering: kill the apply between the loser's verification and the winner's replacement; the loser is in the store, the head is unchanged.
- [ ] #9's contract fixtures (multi-file unit, hashless backend, external resolution with no `--resync`, interruption, renumber, unmounted root) are runnable from here with bisync and with the reconciler's own transport, so Gate 11 scores both.

**Vocabulary and keys**: the harness's own strings and the `CONF` keys it edits follow D-UI-022 and the new key names; `RESTOREPATH` appears only in the A12 fixture.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*

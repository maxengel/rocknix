author:	maxengel
association:	owner
edited:	false
status:	none
--
`tools/cloud-round-trip` gained six steps on 2026-09-03 (audit [#60](https://github.com/maxengel/rocknix/issues/60)), all running against the disposable WebDAV bucket:

- a save file inside a content directory must **not** reach the content tier, while the ROM beside it must — the blindspot 21 regression test
- every ES `<path>` outside `/storage/roms` must appear in the system backup — the complement, which found four orphaned paths
- the newest archive is a `.tar.gz` and passes `tar -tzf`
- a selection of one system excludes a second that also has content
- a cloud directory for a system this device cannot run is flagged `0`
- seeding twice reports the folders present and clobbers no README

None of these has executed yet. Audit **PL-10** is deferred here: the `unsupported system` branch of `--scan` has never produced output, and the fixture that would produce it now exists in the harness but has not been run.

The boundary assertion was verified able to fail (without the excludes a dry run copies `Some Game.srm` alongside `Some Game.rom`; with them, only the ROM) — but that is the assertion, not the harness end to end.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## Also covers: running `tools/cloud-round-trip` for the first time

Picking up audit #60's **PL-10** deferral, which pointed at "the VM pass"
without naming an issue.

`tools/cloud-round-trip` has **never been executed**. It has grown steadily and
every step in it is correct by construction and unverified by running:

- PL-10's own case — the `unsupported system` branch of `cloud_content_restore --scan`, which has never produced output
- a save file inside a content directory must not reach the content tier (blindspot 21)
- every ES system path is carried by exactly one tier
- the system backup is a tar archive, and both formats are discoverable
- content transfers honour the system selection
- seeding is idempotent and never clobbers an existing note
- a sync-conflict artifact moves in neither direction (D-CLOUD-022)
- gamelist.xml syncs newest-first, and only in its own pass

It needs a device it can be destructive against — a GENERIC_X64 VM, not the
handheld, since pointing it at a configured device would add a second rclone
remote and change what `rclone listremotes | head -1` returns for real use.

### Additional acceptance criteria

- [ ] `tools/cloud-round-trip` runs end-to-end against the QA backend on a VM, and every step passes.
- [ ] Any step that fails is either fixed or filed as its own issue and linked here.
- [ ] PL-10's `unsupported system` branch is observed producing output (not merely exercised).
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
## More criteria routed here by the 2026-09-04 phase retro

Closing #56, #57, #58, #59 and #61 as delivered left these behavioural criteria unobserved; every one is a round-trip step (written, never run) or needs one:

- [ ] #56 — re-seeding changes nothing; nothing outside the three paths is touched; a saves sync / content restore does not pull `README.txt`; `BACKUPMETHOD=sync` leaves the READMEs
- [ ] #58 — an existing `.zip` still restores; retention and newest-archive selection treat both formats correctly
- [ ] #59 — the `unsupported system` branch of `--scan` produces output (PL-10); an empty library shows NOTHING FOUND
- [ ] #61 — the full `--match` step set
- [ ] #57 — **new step needed:** pre-copy a subset of a source folder to its destination, run `cloud_migrate_layout --apply`, expect completion with no duplicates and the source removed
- [ ] the lock: a second sync while one runs exits 3 with the message and writes no stamp (step added in `b9ea9f3fe8`)
--

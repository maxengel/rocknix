# Save history: fold the set-aside folders into `.history/` -- no earlier version lost, no question asked

Child of #134. The history store (`<SAVES_REMOTE>/.history/`, D-CLOUD-095) is one home; two older homes exist on devices and in people's clouds today, and their contents are somebody's only earlier version of a save. This issue carries them across, per file, copy-verify-retire, and takes the old folders away when they are empty. It runs from the cutover image onward and asks the player nothing.

## What devices hold today

- **In the cloud, `<SAVES_REMOTE>-replaced/<stamp>/<path>`** -- written by rclone `--backup-dir` on every backup (D-CLOUD-014); a stamp holds each cloud copy a backup replaced **and, in sync mode, each one it removed**; stamps are `date +%Y_%m_%d-%H%M%S` in the device's local zone; every stamp but the newest is purged after a full run that completed (#105), and the folder is shared by every device using that cloud folder.
- **On the device, `/storage/.cache/cloud_sync/replaced/<stamp>/<path>`** -- written on every restore. Because the manual RESTORE SAVES FROM THE CLOUD row passes no `--update`, this folder **can hold the only copy of a newer local save that an older cloud copy replaced**.
- `Saves-discarded/` never shipped (D-CLOUD-042's location is superseded by D-CLOUD-095); there is nothing to migrate from it.

## The rule

A standing job on every **full pass** of the reconciler -- never the exit sync, never the launch path -- from the cutover image onward, until both folders are empty and the last old image is retired. **No player is ever asked anything**: everything it does is logged, and the card reports nothing about it beyond the pass's own outcome. A prompt about our internals is a failure mode (`.claude/rules/upgrade-and-install.md`).

## Per file: copy, verify, record, retire

1. **Hash** the source: on hashed backends, the backend hash mapped through the manifests (#22 R4); on hashless backends, fetch-to-hash within a per-pass budget -- files beyond the budget wait for the next pass, untouched.
2. **Skip and retire** if a complete entry in `.history/` already holds that version for that path: confirm the entry is complete, then delete that one source file.
3. Otherwise **copy** it -- server-side where E3 shows the backend can, else through the device -- into `.history/<unit>/<seq>/<sha256>`.
4. **Record** (`record.json`, written last): `reason: legacy`; `legacy_source` (the stamp path); `legacy_event: unknown` -- a stamp cannot say whether the file was replaced or removed, and inventing an authoritative-looking answer is worse than leaving it unknown; `producer: unknown`; `legacy_time: <the stamp as written>`, zone unknown; `time_trusted: false`; `imported_at`; `imported_by`; `complete: false` unless the unit table says every member is present. A `legacy` entry ages from `imported_at` by the importer's clock, trust-gated, so a hundred-day-old stamp is not deleted on arrival.
5. **Receipt**: an idempotent local record (source path + hash -> destination `<seq>`); a lost receipt is re-derived from the listing's digests.
6. **Verify** the record; then **delete that one source file**, and only if its listing entry (size, hash) still matches what was imported -- a late write from an old image is left for the next pass. A stamp directory is never purged wholesale; it is removed when it is empty.

**Path-aware repair.** A source found at `<stamp>/.history/<unit>/<seq>/<name>` is a store member that an old image displaced: if the original entry's record exists and lists that hash, it goes back to its place; otherwise it becomes a new `legacy` entry.

**The device folder**, per file: hash locally; if the current save or a complete entry already holds that version for that path, delete the local file; otherwise upload it as `legacy` (`imported_by: <this device>`, producer unknown), verify, record, delete.

## The mixed-version boundary

Release order: (i) the guard image (#136); (ii) the writer image (#22 R1); (iii) old images retired. Under the shipped allowlist as it reads, a content-addressed store member matches no include and falls through to `- /**`, so a device still on `af2db4ab09` neither restores it nor mirrors it away -- E1 confirms that rather than assuming it.

Two configurations remain exposed: a user-named filter whose includes reach `.history/`, and `--delete-excluded` with `BACKUPMETHOD=sync`. In those, two old-image sync-mode runs with no new-image pass between them can let `prune_replaced_remote` delete a stamp holding displaced members before this fold repairs them. Under retain-only (D-CLOUD-102) the material at risk is the displaced versions the store holds and the one-time `legacy` retain made at the cutover; the mitigations are the release order above and this standing fold. That residual is **for the maintainer to accept or reject** (P-12 of D-CLOUD-101), not accepted here.

## Retirement

When both folders have been empty for one full pass on every device that has passed since the writer image, the empty roots are removed, and the row for each in #22's replaced-mechanism inventory is closed.

## Acceptance criteria

Venue for every item: the GENERIC_X64 pair against the self-hosted WebDAV and SFTP backends of #133. Nothing runs on a handheld and nothing in a person's cloud (D-QA-007, D-QA-015, D-QA-017).

- [ ] **E10.** Over fixtures holding partial multi-file stamps, sync-mode deletions, unique local-cache copies, duplicate basenames across systems, a stamp that changes during the import, hashless stamps over the per-pass budget, and oversized imports, with the pass interrupted after every copy, record, receipt and removal: a second run changes nothing a first run already did, no source file is removed unless a complete entry of its version exists, and every import carries `reason: legacy`, the right `complete`, `time_trusted: false`, and survives the pass it arrived in. *(VM pair, WebDAV + SFTP)*
- [ ] A unique local-cache copy -- a newer save that an older cloud copy replaced -- is a complete `legacy` entry in `.history/` before the local file is removed, and #25's test reader offers it from the second guest. *(VM pair, WebDAV)*
- [ ] A displaced store member found under a stamp is back at its original `<seq>` when that entry's record lists it, and a new `legacy` entry when it does not; the stamp directory is removed only once it is empty. *(VM pair, WebDAV)*
- [ ] A source file that changes under an old image between the hash and the delete is still there after the pass, and is imported on the next one. *(VM pair, WebDAV)*
- [ ] No prompt, dialog or card line about the fold appears on either guest at any point in the whole fixture run. *(frames from `tools/vm-visual-qa` across the run)*
- [ ] With both folders empty on both guests, the next full pass removes the empty roots and the log says it did. *(VM pair, WebDAV + SFTP)*
- [ ] With the fold running on one guest while the other is on the shipped image, nothing under `.history/` is lost in the two exposed configurations named above, or the loss is recorded and reported to P-12. *(VM pair, WebDAV)*

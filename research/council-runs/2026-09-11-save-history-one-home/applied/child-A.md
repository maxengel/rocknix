# Save history: the guard image -- exclude `.history/` and the README before any writer exists

Child of #134. Ships **one image before** #22's cutover, so that no shipped writer on any device that has taken this image can restore `<SAVES_REMOTE>/.history/` down to a device, mirror it away with a `sync`, or delete it through `--delete-excluded`. It widens nothing, so D-CLOUD-097 stands: a filter rule is not a widening of `Saves-replaced/`. There is no writer of the store in this image; the store may not exist yet. This is the first of the three release steps the fold depends on (#137): guard image, then the writer image (#22 R1), then old images retired.

## What lands

- **`cloud_sync-rules.txt`**: `- /.history/**` and `- /README.md` as the **first two rules**, ahead of every include. `- /savestates/.snapshots/**` is *not* added here: it belonged to #22 R2 and is dropped there once the cutover inventory confirms it has no writer.
- **`cloud_sync_helper`**, once per device, with a log line for each action: strips `--delete-excluded` from `RCLONEOPTS`; adds the two guard lines to a user-**edited** copy of the shipped rules file; leaves a user-**named** filter file alone (D-CLOUD-088, refined by P-8 of D-CLOUD-101). The header comment of `cloud_sync-rules.txt` says why the two rules are first.
- **The audit**, recorded in this issue before it closes: the full `cloud_backup`, `cloud_restore`, the layout migrator and MATCH THIS DEVICE TO THE CLOUD, read for `--delete-excluded`, for every `--backup-dir` target, and for the call paths that reach them. The complete scripts were not in the council's corpus, so this is a reading task with its result written down, not an assumption.

## Acceptance criteria

Venue for every item: the GENERIC_X64 pair against the self-hosted WebDAV backend of #133. Nothing runs on a handheld and nothing in a person's cloud (D-QA-007, D-QA-015, D-QA-017).

- [ ] **E1.** Against a seeded `Saves/README.md` and a seeded `Saves/.history/` holding content-addressed members, the **shipped** image `af2db4ab09` runs a copy backup, a sync backup, a restore and MATCH: what each one transfers, moves or deletes under those paths is recorded, and `README.md` is not written to the device. The same runs on the **guard** image transfer, move and delete nothing under them, and no README reaches the device. *(VM pair, WebDAV)*
- [ ] **E1 (broad filter).** With a user filter carrying `+ /**`, the same four runs on the shipped image record what is lost; after the guard image the same runs touch nothing under `.history/` or `README.md`. *(VM pair, WebDAV)*
- [ ] **E2.** With `--delete-excluded` forced into `RCLONEOPTS`, copy and sync modes: on the shipped image the outcome is recorded, including whether `--backup-dir` caught the deletion; on the guard image the helper's log line shows it stripped, the flag appears in no rclone process, and every file under `.history/` is present afterwards. *(VM pair, WebDAV)*
- [ ] **E15 (edited rules file).** Upgrade a device whose `cloud_sync-rules.txt` the player had edited: the two guard lines are present at the top afterwards, the player's own lines are unchanged, and the helper logged what it added. *(VM guest)*
- [ ] **E15 (user-named filter).** Upgrade a device using a filter file of its own name: that file is byte-identical afterwards, and the log says which rules file the helper wrote instead. *(VM guest)*
- [ ] The audit above is written into this issue: every `--delete-excluded` and `--backup-dir` occurrence in the four scripts, with the call path that reaches it and what the guard image does about it. *(reading task; result in the issue before it closes)*

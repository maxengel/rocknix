# Decision register

The lookup table for decisions that shape the work but live nowhere findable —
maintainer calls, resolved forks, invalidated assumptions. Without this they sit
in issue comments and chat, and the next session re-derives, contradicts, or
quietly re-decides them.

**Append-only.** A reversal is a new row citing the old ID; never edit or delete
a decided row. Cite rows by ID (`D-…`) rather than re-arguing the choice.

See `.claude/rules/decision-register.md` for when to write and read rows.
This is the index of decisions; `docs/work-logs/` is the narrative,
`docs/blindspot-register.md` the catalogue of weaknesses.

## Decided

| ID | Date | Decision | Refs |
| --- | --- | --- | --- |
| D-CLOUD-001 | 2026-08-28 | **ROCKNIX registers no OAuth client credentials of any kind.** Players supply their own; we make the flow around them painless. An unverified Google app caps at 100 users and expires refresh tokens after 7 days, and rclone is retiring its shared Drive client during 2026 — so a shipped client is a support burden that fails at 100 users and re-breaks annually. | [#51 comment](https://github.com/maxengel/rocknix/issues/51), [#29 comment](https://github.com/maxengel/rocknix/issues/29) |
| D-CLOUD-002 | 2026-08-28 | **Native provider setup is the front door; the SSH wizard is the fallback.** 53 of rclone's 69 backends need no browser, so a form covers them; the 16 that do are listed separately and clearly labelled rather than discovered three screens in. | #51 |
| D-CLOUD-003 | 2026-08-28 | **`rclone.conf` stays out of backups.** A restored device re-runs setup rather than carrying live OAuth tokens through someone's cloud storage. Cheap now that setup is a native page; it was only ever a punishment because setup was hard. | #52 |
| D-CLOUD-004 | 2026-08-28 | **A device with an existing remote is never silently migrated.** Google's device flow is restricted to `drive.file`, so moving an existing user to a ROCKNIX client id would make their cloud files invisible and re-upload duplicates. New setups only. | #51, rclone/rclone#6871 |
| D-CLOUD-005 | 2026-08-29 | **The system-backup upload decides on content, not on the remote's metadata.** A marker records what was last actually uploaded; a differing archive is forced past rclone's comparison. Uploading unconditionally is not available — the game-exit hook runs a full backup on every quit. | #53, `3cbe680764` |
| D-UI-001 | 2026-08-28 | **Mask any field rclone marks `IsPassword` *or* `Sensitive`, with the value visible on opening the row.** Neither flag alone is a correct rule: `sftp.host` is Sensitive, and `s3.secret_access_key` is Sensitive but not IsPassword — so masking either one alone hides a hostname or exposes a secret key. | `675790e8c` |
| D-UI-002 | 2026-08-28 | **Providers are named by us, not by rclone.** rclone's descriptions are written for its documentation and truncate mid-word in a handheld menu. | `675790e8c` |
| D-QA-001 | 2026-08-28 | **Nothing goes upstream until an end-to-end run passes on hardware.** VM verification gates the device build; the device build gates P2. | maintainer, 2026-08-28 |
| D-QA-002 | 2026-08-29 | **The QA WebDAV backend stays bound to loopback.** It holds a test credential; exposing it on the LAN to reach a physical device is not worth it — use a VM, which reaches the host at `10.0.2.2`. | `tools/cloud-test-backend` |
| D-CLOUD-009 | 2026-08-29 | **The per-device cloud identity is seeded from the permanent hardware address, hashed, and stored in `/storage/.config`.** Supersedes the machine-id-only derivation in the first cut of #49. `ethtool -P` reports the address burned into the adapter, so MAC randomisation is irrelevant; hashing keeps a network identifier out of the cloud path; storing it means a wifi-module swap does not strand the backups and the file can be edited to adopt another device's folder. Chosen because a player's "my device" is the handheld, not the installation — so a reflash must find its own backups. | `cloud_device_id`, supersedes part of `b132442778` |
| D-WORKFLOW-001 | 2026-08-29 | **Local build logs are never committed.** A `git add -A` in a build worktree put a 206 MB log into history and GitHub rejected the push; `/build-*.log` and `/publish.log` are now ignored. | `746b6dc3f6`, `4e46985442` |
| D-WORKFLOW-002 | 2026-08-29 | **Adopt from the scaffold estate only where a local failure earned it.** Two of its 41 instruction cards were taken; `git-safety` was rejected because its headline advice (stash before destructive ops) is the one thing this environment forbids, the stash stack being shared across worktrees. | `a371bb77f8` |

## Open decisions

| ID | Question | Home |
| --- | --- | --- |
| D-CLOUD-007 | **Which OAuth transport for each provider once P2 starts** — device flow (Drive, OneDrive) vs PKCE with a pasted code (Dropbox), and whether the Dropbox listener is worth the LAN surface it adds. | #51 |
| D-CLOUD-008 | **Does the 17 MB archive get trimmed?** It is almost entirely OS-shipped PPSSPP assets, which is what makes size collisions ordinary rather than rare. Shrinking it narrows the #53 window but does not close it. | #45 |

---
description: "Keep user-facing behavior and the public rocknix.org docs in sync; don't let code and docs drift."
paths:
  - "**"
---

# Documentation accuracy (public rocknix.org docs)

When you change **user-facing behavior** — config variables, defaults, flags, tool names,
menu entries, or workflows — update the matching public documentation in the **same change**
(or open a docs follow-up and link it). Code and the published docs must not drift.

**Hard gate (maintainer rule, 2026-07-23):** never push code/functionality changes without
the corresponding rocknix.org site update. An upstream feature PR is not ready to open
until the matching `ROCKNIX/rocknix.org` docs change is prepared alongside it — documentation
must always reflect the latest work.

## Where the public docs live

The website is a **separate repository**, `ROCKNIX/rocknix.org` (MkDocs Material, default
branch `main`); pages are Markdown under `docs/…`. They are **not** in this distribution repo,
so a docs update is a **separate PR to that repo** (`docs/configure/<page>.md`, etc.).

## Cloud-sync — worked example

Page: `docs/configure/cloud-sync.md` → <https://rocknix.org/configure/cloud-sync/>. It must
stay consistent with the cloud-sync source of truth in **this** repo:

- `projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf` and
  `cloud_sync.conf.defaults` — the documented variables/defaults and semantics: `BACKUPPATH`,
  `RESTOREPATH`, `SYNCPATH`, `BACKUPFOLDER`, `SYNCPATH_BACKUP`, `RCLONEOPTS`,
  `BACKUPMETHOD`/`RESTOREMETHOD` (`sync` mirrors+deletes vs `copy` non-destructive),
  `BACKUPFILE_*_OPTION`, `RSYNCRMDIR`, `LOG_LEVEL`, and **`CONTENTPATH`** (the
  content tier's cloud root; `ROMs/` and `BIOS/` live under it — D-CLOUD-018).
- the scripts `cloud_backup`, `cloud_restore`, `cloud_sync_helper`, and the ones
  added since: `cloud_setup`, `cloud_remote`, `cloud_oauth`, `cloud_device_id`,
  `cloud_content_backup`, `cloud_content_restore` (including `--match`, the
  only content action that deletes — D-CLOUD-023), `cloud_migrate_layout`.
  `rclonectl` is gone (#6).

When you touch any of those, re-check the page for: renamed/removed/added variables, changed
defaults, changed `sync`/`copy` semantics, new/removed tools, and the single-remote assumption
(`rclone listremotes | head -1`).

## Don't let known drift grow

- **The public page still teaches the SSH `rclone config` workflow** that the
  native wizard replaced. Tracked as #42 (audit #60's PL-06); it is the docs
  half of the upstream PR and blocks it (hard gate above).
- `RSYNCRMDIR` is now **implemented** (2026-07-23, issue #5 finding #3) — docs and code
  agree. `rclonectl` was **removed** the same day (issue #6): if the site still mentions
  mount/unmount, that's drift to fix on the docs side. `LOG_LEVEL` remains under-documented.
- Resolve drift by fixing **either** the code or the docs — never by ignoring it. Track docs
  gaps on the fork (see `issue-tracking.md`).

## Cross-references

- `rclone-cloud-sync.md` — the cloud-sync subsystem itself.
- `fork-workflow.md` — PR hygiene (applies to `ROCKNIX/rocknix.org` PRs too).

# Council problem statement -- one home for the earlier versions of a player's saves

**Convened:** 2026-09-11, from the maxengel/rocknix fork (`next` at `19ba2e03a3`), by the
maintainer's direction: *"I think we need to be crisp about what we're changing in the
council-derived plan and can take it and put it through another council run if
necessary. ... I don't care about the OpenRouter cost or the time, so if we think it's worth
it to do a council run, we should do it."*
**Context:** the 2026-09-05 council produced the plan of record for epic #11 (cloud-save
conflict resolution; children #21–#25). This run judges a **delta** to that plan, not the
plan itself.

## What we want from you

The plan of record keeps the losing side of a resolved conflict in a cloud store,
`<SAVES_REMOTE>-discarded/`, with a `record.json` per copy (#22 R9, D-CLOUD-036). The
shipped scripts separately set aside every cloud copy a backup overwrites, through
rclone's `--backup-dir`, in `<SAVES_REMOTE>-replaced/<stamp>/`, pruned to the newest run.
On 2026-09-11 the maintainer met that second folder for the first time and ruled: two
homes for two events is confusing; house earlier versions inside the saves folder, hidden
but declared in a README, named clearly, kept simple for the player, with settings nested
rather than stacked. The delta that follows from that ruling is `repo/docs/save-history-plan-delta.md`;
the reasoning is `repo/docs/save-history-gap-analysis.md`; the decisions already taken are
D-CLOUD-094..100 in `repo/docs/decision-register-excerpt.md`.

**Judge the delta.** Specifically:

1. **Does the delta weaken any property the plan of record relies on?** Take each
   changed row of the delta table in turn -- the store's location inside the saves folder,
   writing to it on every overwriting publish (decided or not) with retain-before-publish,
   the `reason` field, save states and auto-states included, the three bounds (per-save
   count 3–5, 90 days, 256 MiB total, never a game's only copy), auto-heal of a suspect
   save, retiring `--backup-dir`, nesting the settings -- and **endorse, amend, or
   replace** it. Where a decided register row stands in the way, cite its ID and give the
   argument that should reopen it.
2. **Concrete failure modes and ordering hazards.** Retain-before-publish under an
   interrupted run (power loss, link loss, SIGKILL at each point); two devices publishing
   to the store at once; the store's README inside a folder that `sync` mode mirrors and
   that the allowlist governs; a `.history/` path against rclone's `--backup-dir`
   overlap rule and against every writer that still exists before the reconciler owns
   them all (R1); the pruning bounds racing a publish; a device restoring `.history/` by
   accident; provider differences (Dropbox has no MD5 and keeps its own 30-day versions;
   WebDAV/SFTP/SMB keep nothing).
3. **What it costs the time to play** (D-CLOUD-098, #135): interface → a game's first
   frame; one game's exit → the next game's first frame. Name what the delta adds to the
   launch path and to the exit sync, in round trips and in seconds on a handheld's Wi-Fi,
   and what would keep it off the launch path.
4. **Migration.** Devices already hold `Saves-replaced/` folders and a local
   `.cache/cloud_sync/replaced/`; the plan of record has not shipped `-discarded/`. Say
   how the transition should run so that no earlier version is lost and no player is asked
   a question about our internals (`upgrade-and-install.md`'s rule: read both, write the
   new one; a prompt is a failure mode).
5. **A simpler shape, if one exists**, that meets the maintainer's constraints -- one home,
   inside the saves folder, hidden but declared, one vocabulary, no stacking of settings,
   the accidental overwrite of a save state recoverable -- and beats the delta on
   simplicity, safety or time to play. If the delta is already the simplest, say so.

Output shape: a thorough written analysis. No code. Cite the corpus by path and the
decisions by ID. Distinguish what the corpus shows from what you infer.

## Constraints that are not up for debate

- The maintainer's rulings of 2026-09-11 (D-CLOUD-095..100, D-UI-039, D-QA-015/017) and
  the plan of record's decided rows (D-CLOUD-030..053) are binding unless your argument
  reopens one by ID.
- A backup never deletes by default (D-CLOUD-014). The reconciler is the only writer of
  the saves tree once #22 lands (R1). The cloud is the store's home (D-CLOUD-036).
- The player is on a 3.5-inch, 640x480 handheld; rows are a label and at most one line
  (D-UI-023); the vocabulary is D-UI-022's.
- Nothing is tested on a person's device or in a person's cloud account (D-QA-015); the
  GENERIC_X64 VM and self-hosted backends answer everything they can (D-QA-007/017).
- No code in this deliberation.

## The corpus

`00-problem-statement.md` (this commission); `repo/docs/save-history-plan-delta.md`;
`repo/docs/save-history-gap-analysis.md`; `repo/docs/decision-register-excerpt.md`;
`repo/docs/es-menu-map.md`; `repo/rules/time-to-play.md`;
`repo/rules/es-native-ui-excerpt.md`; `repo/code/cloud_backup-set-aside-excerpt.md`;
`repo/code/cloud_restore-set-aside-excerpt.md`; `repo/code/cloud_sync-rules.txt` (the
allowlist as shipped); `issues/22.md` (the reconciler, R1–R9), `issues/23.md` (the wizard
and its retention settings), `issues/25.md` (the restore tool), `issues/134.md` (this
epic), `issues/135.md` (time to play), `issues/131.md` (a QA handheld), `issues/133.md`
(the QA cloud matrix).

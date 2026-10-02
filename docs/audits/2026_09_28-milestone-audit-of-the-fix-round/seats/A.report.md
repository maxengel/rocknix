# Stream A report: the cloud scripts (audit #307 / #308)

**Branch:** `feature/pl-a` in `/workspace/repos/rocknix.worktrees/pl-a`. It is cut from `next` at `417dcd8610` and has 39 commits. Nothing has been pushed or merged, and no image was built.

**Harness:** `./tools/last-good-scripts-test` → `PASSED`, 508 PASS lines, 0 FAIL (rc 0). The baseline before this stream was 387.

**The stream A block:** everything I added is one block at the end of the harness, headed `# ---- audit #307, stream A ----`. It holds 122 checks, labelled A1 to A30.
- It runs each script whole in bwrap against a copy of the image's **rclone v1.75.1**, over an alias remote. The image's busybox 1.36.1 supplies the applets.
- A shim in front of rclone records every argv. It can also fail a call, kill the run's process group at the n-th matching call, run a command after a call, make a call hang, or report "no hashes".
- Against the base scripts: `BASE_REF=417dcd8610 tools/last-good-scripts-test --old` → **94 CHECK(S) FAILED**. All 94 are in the stream A block; every other section passes on that base. The 28 checks that pass on base are positive-path checks, or checks that prove a fixture did what it should.
- `tools/cloud-capture-stamp-test` → PASSED.
- `tools/cloud-round-trip` gained two assertions (below). It parses, but it runs only on the VM, so I did **not** run it.
- No `package.mk` was edited, so `pkgcheck` was not needed.

```
fd6878278a cloud_backup: a growing listing is progress to the stall ceiling
f987fccf2f cloud_backup: the automatic ceiling covers the probe and ends the run
50c4b409b7 cloud_content_restore: a network cut after files moved is no skip
3de1e95bb4 cloud_content_backup: nothing to send is a run that completed
bf0a2ed712 cloud_content_restore: the scan and the transfer describe one file set
ff2bdc65a6 cloud_content_backup: N64 .fla saves belong to the saves tier
258b5eca38 cloud_content_restore: a match reports what it removed, not its plan
852bb49dcf cloud_saves_root: a record that did not land fails; good runs record
4826d2717d cloud_backup: a saves folder at the root backs up without --backup-dir
70013303be cloud_restore: an undated legacy archive does not outrank a dated one
3677b6f132 cloud_restore: the settings folder's listing carries the listing bound
19c46ab164 cloud_sync_helper: move the first-cut sync bound to today's in one run
bd3dfebd29 cloud_sync_helper: a run with nothing to change writes nothing
ef9af12134 cloud_sync_helper: rules that never took effect stay inert on upgrade
9e0332b0c3 cloud_sync.conf: say copy is the default, and ship no stripped flag
688a0f9261 cloud_backup: a command written into cloud_sync.conf never runs
0a1472852a cloud_sync_helper: no content folder inside a top-level saves folder
a0bf7216ec cloud_restore: walk for partial files only when one may have been left
dfa306d735 cloud_restore: no console pauses under --yes, and cloud_backup's shape
9f564e1733 cloud_content_restore: --selected with BIOS alone is a selection
774c2e48bf cloud_backup: a zip that fails unzip -t is not whole
62b5431c54 cloud_content_backup: a game list that did not move fails its unit
470c9dad3f cloud_capture: adopt inherits only within the game, and says 3 for none
2f6c7dca35 cloud_capture: keep a set-aside manifest until a good one replaces it
16c10ac9ca cloud_capture: bound the clock query on the game-exit path
3fee07b875 cloud_capture: commit under a lock of its own, and spare fresh seals
c42dfb0c40 cloud_capture: --retire takes saves-folder paths only, unlinks those
5a5e47c78e cloud_content_restore: --set-systems takes system folder names only
8053ee7334 cloud_backup: a saves phase that moved nothing does not hide a failure
9c4d9ed1b9 cloud_migrate_layout: bound every call, take the lock, check by content
42948809d1 cloud_migrate_layout: a content move that fails fails the run
fcc16f7ae7 cloud_migrate_layout: delete only the files copied and checked
f9e801ac74 cloud_migrate_layout: write each pointer as its tier lands
c77a26d57f cloud_migrate_layout: move the backups first, and not inside Saves
7d684b868b cloud_migrate_layout: a listing that fails stops the migration
734665a9e0 cloud_backup: keep the replaced folder and archive this run wrote
0451642fc6 cloud_sync_helper: install only a whole rules file, refuse a cut one
7a8b6cdcd9 cloud_content_restore: --all restores every system and BIOS
aead63cee5 cloud_content_restore: hold --match --apply to the preview's plan
```

Nine titles were reworded before this report to bring them under 72 characters. I did that with `git filter-branch --msg-filter` on the unpushed range; the tree hash is identical before and after. Every commit carries a finding id, an `Already written:` line and the Co-Authored-By trailer.

## Punch items

Every item is **resolved**. Each FAIL line below was seen on `417dcd8610` (or on the commit before the fix, where it says so). Each PASS was seen on the branch.

### PL-001 — `--match --apply` enforces the preview; a failed listing plans nothing (`aead63cee5`)
- **Case:** A1, 8 checks. 7 fail on base, for example:
  - `FAIL  rc 0; plan lines: gb|sync|1|3 nes|remove|1|2 ; plan file: none -- a failed listing read as an absent system`
  - `FAIL  N.nes: DELETED; rc 0 ... -- apply recomputed the plan instead of enforcing the preview`
  - `FAIL  B.gb gone, C.gb gone; rc 0 -- apply counted again and let --max-delete follow`
- **After:** 8/8 PASS. On apply, `gb` runs with `--max-delete 1`, which is the preview's count.
- **Fix:**
  - The listing's exit status is read apart from its emptiness: 0 or 3/4 means absent, anything else goes through `absent_not_broken`. A system that cannot be read is never planned.
  - The preview writes `/storage/.cache/cloud_sync/content-match-plan`. Apply reads it and uses it up.
  - Apply refuses a system that is missing from the plan, whose verb changed, or whose count grew.
- **Already written:** nothing. Earlier builds wrote no plan. An apply with no plan is refused, and pressing MATCH again reruns the preview.
- **VM:** walk MATCH preview → YES in ES to confirm the plan file flows through the unchanged ES commands.

### PL-012 — `--all` restores ROMs and BIOS, and the media excludes are anchored (`7a8b6cdcd9`)
- **Case:** A2, 7 checks. 5 fail on base:
  - `FAIL  bios on the device: (none?); ... Restored everything.`
  - `FAIL  nes/images/N.png was restored`
  - `FAIL  units: >>> unit everything|1|1`
  - A failed ROMs listing still restored.
  - An empty cloud gave rc 3.
- **After:** 7/7 PASS.
- **Two decisions:**
  - An empty cloud (no ROMs and no BIOS) is now "Nothing to restore", exit 0. It used to be exit 3.
  - The older layouts' root folders are restored only when ES declares them as systems, or the device already holds them. This keeps the owner's own folders out.
- **`tools/cloud-round-trip`:** new step "--all restores every system and BIOS, each a unit of its own". It plants a BIOS file and asserts it arrives on the device. **Integrator must run it on the VM.**
- **Already written:** nothing. A device the old `--all` restored has no BIOS from it; the next `--all` or `--selected` brings it.
- **Sibling row the coordinator added — BIOS alone under `--selected` (`9f564e1733`, A11, 3 checks):**
  - Base: `FAIL  rc 1; bios.bin missing; out: You haven't picked any systems for this device.` After: 3/3 PASS.
  - The empty-selection check now runs after BIOS is added.
  - **Already written:** a placeholder `bios` line in the selection reads as BIOS wanted — one unit, from `BIOS/`, never `ROMs/bios`.
  - **#308 row:** recorded as "5-cloud-sync-and-saves gpt F-CS-15's script half", as the coordinator named it. In the seat file, gpt F-CS-15 is actually the save-state lock finding (E1's).

### PL-020 — a cut rules file is never installed; the saves scripts refuse one (`0451642fc6`, with #308 claude F-CS-06)
- **Case:** A3, 7 checks. 5 fail on base:
  - `FAIL  the live rules file now ends: '# or refuse to open. ...' -- a cut candidate was renamed over the allowlist`
  - `FAIL  the .bak was replaced by the cut file: '^- /\*\*' matched '- /**/*.db'`
  - `FAIL  A.gb in the cloud: YES; rc 0; ... Completed.`
  - `FAIL  B.gb on the device: YES`
- **After:** 7/7 PASS.
- **Already written:** a rules file an earlier build installed cut short is rebuilt whole by the helper on the next run. The saves scripts refuse it only where the helper cannot run.

### PL-021 — pruning keeps this run's replaced folder and archive (`734665a9e0`, with #308 claude F-CS-10)
- **Case:** A4, 5 checks. 4 fail on base:
  - `FAIL  rc 0; replaced root holds: ./2099_01_01-000000/gb/Z.srm ; the run's own folder was pruned`
  - The upload is past `KEEP` (2097–2099 archives kept instead).
  - `prune_replaced_local` also pruned the run's own folder on the device.
- **After:** 5/5 PASS.
- When this run replaced nothing, the newest-by-name folder is kept, as before.
- **Already written:** existing folders and archives are pruned by the new rule on the next run that writes its own.

### PL-025 — the migration moves the backups first, and not into Saves (`c77a26d57f`)
- **Case:** A5, 3 checks. 2 fail on base: `FAIL  under Saves: ... ROCKNIX/Saves/Content/ROMs/gb/A.gb ... ROCKNIX/Saves/backup/QA-deadbeef01/...`. After: 3/3 PASS.
- **Already written:** a cloud an earlier build migrated this way keeps `Saves/backup` and `Saves/Content`. They are not moved back, and the allowlist keeps them out of the saves sync.

### PL-026 — each pointer is written as its tier lands; each tier resumes against its own source (`f9e801ac74`)
- **Case:** A5, 2 checks. Both fail on base: `FAIL  second run rc 3 ...` and `FAIL  rc 4; ... REFUSING`.
  - On the PL-025 commit alone: `FAIL  second run rc 4; ... REFUSING: qa:/ROCKNIX/Backups already exists.`
- **After:** PASS. A migration killed with SIGKILL at its second copy is finished by the next run (rc 0).
- I found my first cut's `Already written:` claim false by testing it, and amended the commit. A tier whose source is empty now only moves its pointer.
- **Already written:** a device an earlier build left moved but not repointed is repointed on its next run (tested).

### PL-027 — a failed listing stops the migration (`7d684b868b`)
- **Case:** A5, 2 checks. Both fail on base: `FAIL  pointers now '/ROCKNIX/Saves /ROCKNIX/Backups /ROCKNIX/Content'; rc 0 ... Done.` After: 2/2 PASS.
- **Already written:** a device an earlier build repointed with nothing copied is **not** detected. The next check sees the current layout.

### PL-028 — saves returning 9 does not hide a failed settings phase (`8053ee7334`, with #308 claude F-CS-16)
- **Case:** A6. Base: `FAIL  exit 9, stamp '9', outcome 'Completed.'`, for both `cloud_backup` and `cloud_restore`.
- **After:** PASS. Exit 5, stamp 5, "Couldn't finish".
- **`tools/cloud-round-trip`:** the settings phase now asserts exit 0 and `Completed.` (VM).
- **Already written:** a 9 stamped over a failure stays until that tier's next run.

### PL-030 (script half) — `--set-systems` takes system folder names only (`5a5e47c78e`)
- **Case:** A7, 11 checks. 9 fail on base, for example:
  - `FAIL  rc 0; selection now: gb a$(touch /tmp/x)b`
  - `FAIL  rc 0; selection now: nes cwd-marker roms` (the `*` glob was expanded)
- **After:** 11/11 PASS.
- **Already written:** `selected_systems`, in both content scripts, reads past any line that is not a valid folder name.
- **Not mine:** the C++ quoting is stream E2's.

### PL-052 — `--retire` takes saves-folder paths only (`c42dfb0c40`)
- **Case:** A8. Base: `FAIL  working directory's file: DELETED; saves folder's: kept; rc 0`. After: 2/2 PASS.
- **Already written:** nothing. The only caller passes absolute paths.

### PL-053 — the migration deletes only the files it copied and checked (`fcc16f7ae7`)
- **Case:** A5. Base and the PL-026 commit: `FAIL  LATE.srm is gone: the old folder was purged after a point-in-time check`. After: PASS.
- The fix uses `--files-from-raw`.
- **Already written:** nothing.

### PL-066 — a failed game-list pass fails its unit (`62b5431c54`)
- **Case:** A9. Base: `FAIL  exit 0, stamp '0'; ... ERROR : injected failure 5|Restored nes.`, in both content scripts. After: 4/4 PASS.
- **Already written:** 0 stamps written over a failed game list stay until that tier's next run.

### PL-067 — the capture commits under a lock (`3fee07b875`)
- **Case:** A8. 2 fail on base:
  - `FAIL  took 1s ... -- the commit ran beside another capture's`
  - `FAIL  the fresh seal was collected`
- **After:** PASS. The capture waited 4 s against a 4 s lock holder.
- **Design:**
  - The lock is `/storage/.cache/cloud_sync/.capture.lock`, held for the check, rename, GC and stamp. It is never the transfer lock.
  - The wait is bounded at 5 s. After that the capture falls back to the old detection alone.
  - GC spares any seal changed in the last 10 minutes.
- **Already written:** nothing.
- **VM:** run the proof on the image's busybox `flock`.

### PL-070 — a zip that fails `unzip -t` is not whole (`774c2e48bf`)
- **Case:** A10. Base: `FAIL  the damaged zip passed: unzip -t failed and unzip -l listed it`. After: 3/3 PASS.
- **Measured:** busybox 1.36.1 `unzip -t` exits 0 on a STORED member with damaged bytes (it checks no CRC). It does catch a damaged deflated stream, so the fixture uses a deflated member. This limit is written into the code comment.
- **Already written:** archives already sent stay until retention removes them.

### PL-071 — a failed content move fails the migration (`42948809d1`)
- **Case:** A5. Base: `FAIL  rc 0; ... main said Done. over migrate_content's failure`. After: PASS (rc 5).
- New why lines, printed under `--apply` only: `THE NEW FOLDER ALREADY HAS FILES IN IT` for a refusal, `SOME FILES DIDN'T FINISH` for a failure.
- **Already written:** nothing new.

### PL-015 (script half, the coordinator's row from stream C) (`0a1472852a`)
- **Case:** A14. 2 fail on base:
  - `FAIL  CONTENT_REMOTE="/GAMES/Content"; log: ...Derived CONTENT_REMOTE from SAVES_REMOTE /GAMES`
  - The backup's nesting warning never fired.
- **After:** 4/4 PASS.
- **Fix:**
  - A top-level saves folder gets `CONTENT_REMOTE=""` (the remote root, where its ROMs already were) and a WARN log line.
  - `cloud_backup` warns on either tier nested inside the saves folder. It always logs; it shows on screen only on deliberate runs.
- **Already written:** an existing `/GAMES/Content` is read as it stands, warned about, and never rewritten (tested).

### PL-051 (script half, the coordinator's row from stream C) (`688a0f9261`)
- **Case:** A15. Base, all 4 fail: `FAIL  ran it: YES; rc 0; ... Completed.` for `cloud_backup` and `cloud_restore`, and `FAIL  ran it: YES` for both content scripts.
- **After:** 4/4 PASS.
- **Fix:**
  - `conf_valid` (identical in the helper, backup and restore) refuses `$(` or a backtick on any non-comment line, and refuses `$`, backtick, backslash or control characters in the five folder values.
  - The content scripts no longer source the conf; they read the values they need as text.
- **Result:** the saves scripts exit 1 with `>>> why YOUR CLOUD SYNC SETTINGS COULDN'T BE READ`. ES renders that as COULDN'T FINISH. The script's last console line is the existing load_config refusal sentence, not a new outcome sentence.
- The shipped conf and a conf built from the defaults both still pass, under busybox awk too.
- **Already written:** this is the already-written case itself: a conf an earlier build wrote with a command in it.

## Sweep rows (#308, 26 rows, plus the 2 the coordinator added)

| seat | id | outcome |
|---|---|---|
| claude | F-CS-04 | **fixed** `dfa306d735` (A12: 9 s → 1 s; SKIPPED lines; no `listremotes`) |
| claude | F-CS-06 | **fixed** in `0451642fc6` (PL-020; the A3 `.bak` check) |
| claude | F-CS-08 | **fixed** `a0bf7216ec` (A13; `restore-tree-clean` record; first run on the build sweeps) |
| claude | F-CS-10 | **fixed** in `734665a9e0` (PL-021) |
| claude | F-CS-11 | **fixed** `ef9af12134` (A17; one-shot marker keeps upstream's below-catch-all rules as `# inert:`) |
| claude | F-CS-12 | **withdrawn**: the refusal is decided. D-CLOUD-042 ("refuse is the cleanest", the maintainer) and D-CLOUD-040. The seat's fix is the migration that was rejected. The gap — the remedy needs a shell — is a question for the maintainer. |
| claude | F-CS-16 | **fixed** in `8053ee7334` (PL-028) |
| claude | F-CS-17 | **fixed**: dead warning in `0a1472852a`, comments and shipped `--delete-excluded` in `9e0332b0c3` (A16) |
| claude | F-CS-18 | **fixed** `bd3dfebd29` (A18: inode, mtime and size unchanged, no `.bak`) |
| claude | F-CS-20 | **fixed** `16c10ac9ca` (A8: 30 s → 2 s). **Needs `-s KILL`**: the script's `trap '' TERM` is inherited, so a plain `timeout` did not work — my first attempt with it still took 30 s. |
| claude | F-CS-21 | **fixed** `3677b6f132` (A20) |
| claude | F-CS-22 | **withdrawn**: D-CLOUD-079 decides that the helper's `.bak` copies are removed after the next successful run. A last-known-good copy of the conf kept at rest would need a new register row. |
| claude | F-CS-23 | **fixed** `9c4d9ed1b9` (A5, 4 checks; quoting via `c77a26d57f`). Its case also exposed a gap in my PL-025 commit (the at-root test lacked the nested-content exclude), fixed in the same commit. |
| claude | F-CS-24 | **fixed** `50c4b409b7` (A28; stamps `69 gaps YOU WENT OFFLINE PART-WAY THROUGH`, which ES's `parseLastRun` already reads as COULDN'T FINISH) |
| claude | F-CS-25 | **fixed** `4826d2717d` (A22; measured: rclone 1.75.1 exit 7 "destination and parameter to --backup-dir mustn't overlap") |
| claude | F-CS-27 | **withdrawn**: `package.mk` is not in my files (the packages stream, F2), and the package split is upstream fit for PR-prep #256 |
| gpt | F-CS-20 | **fixed** `852bb49dcf` (A23; `record --no-write` after a failed transfer; new why `COULDN'T RECORD WHICH CARD YOUR SAVES ARE ON`) |
| gpt | F-CS-21 | **fixed** `2f6c7dca35` (A8) |
| gpt | F-CS-22 | **fixed** `470c9dad3f` (A8: unit `gb:Other` → `gb:Game`; rc 0 → 3) |
| gpt | F-CS-26 | **fixed**, script half, `258b5eca38` (A24: `>>> removed 2|7` → `1|3`, counted from rclone's own "Deleted" lines). The page's recovery wording belongs to an ES stream. |
| gpt | F-CS-28 | **withdrawn**: decided. D-CLOUD-072 ("no route means no wait") and D-CLOUD-136 (69 at once with no default route). Widening the test to any route trades away the D-CLOUD-112 offline benchmark on devices with Tailscale or ZeroTier routes. Recommend an Open decision row. |
| gpt | F-CS-29 | **fixed** `19c46ab164` (A19) |
| gpt | F-CS-30 | **fixed** `bf0a2ed712` (A26: bios 0/1, dc 1/0, scummvm 0/1 → all 0/0) |
| gpt | F-CS-34 | **fixed in part** `f987fccf2f` (A29: 31 s → 3 s; nothing is started past the deadline; the ceiling's own why). **Open:** a stall ceiling on the content transfers. Those run on the CANCEL page (D-UI-078), and porting `bounded_rclone` to them should get its own proof. |
| gpt | F-CS-35 | **fixed** `70013303be` (A21) |
| gpt | F-CS-37 | **fixed** `9e0332b0c3` (A16) |
| claude | F-CS-15 (coordinator's row) | **fixed** `3de1e95bb4` (A27: rc 1 → 0 and stamp 0; no why line). **Already written:** an old rc-1 stamp is read as it stands. |
| gpt | F-CS-15 script half (coordinator's name for BIOS alone) | **fixed** `9f564e1733` (see PL-012) |

**Two findings no brief carried, fixed because they are in my files:**
- **gpt F-CS-02** (Critical: a match could delete N64 `.fla` saves). Fixed in `ff2bdc65a6`, A25. Base: `FAIL  plan 'n64|remove|2|15'; Game.fla DELETED`.
- **claude F-CS-13** (a listing read as a stall). Fixed in `fd6878278a`, A30. Base: `FAIL  rc 124 after 4s`.

Both fell through #307 and #308 — the forward audit tabled them and no punch or sweep row took them.

## For the integrator (VM or device)
- **Run `tools/cloud-round-trip`** for the new `--all`/BIOS step and the settings-outcome assertion.
- **Walk the ES MATCH flow**, preview → YES, to confirm the plan file.
- **Run the migration** against WebDAV and S3 (`cloud-test-backend`). This exercises the hashless `--download` check, `--files-from-raw` and rmdirs on a bucket.
- **Run the upgrade rehearsal** for:
  - the rules one-shot (`.cloud_sync-rules-user-first-applied` marker);
  - `conf_valid` against real device confs;
  - `CONTENT_REMOTE=""` for a `/GAMES` config.
- **Pinned upgrade behaviour:** a device's first restore on this build sweeps for partials once.
- **New why sentences for ES and docs:** `SOMETHING CHANGED SINCE YOU CHECKED`, `COULDN'T RECORD WHICH CARD YOUR SAVES ARE ON`, `THE NEW FOLDER ALREADY HAS FILES IN IT`, and the stamp why `YOU WENT OFFLINE PART-WAY THROUGH`.
  - `CloudTextTests`' protocol table still cites `>>> unit everything`.
  - `es-player-text.md`'s why list needs the new sentences, and French is needed wherever ES translates them.
- **`rclone-cloud-sync.md` is stale against this branch** (not my files):
  - "`--delete-excluded` is safe on backup … cloud_backup now warns when the two are nested"
  - `RCLONEOPTS` shipping the flag
  - capture's detection-only writers
  - the sweep behaviour
  - the `CONTENT_REMOTE` derivation

## What I could not do
- Run anything on the VM or a device (out of scope for this brief). Because of that, the `cloud-round-trip` additions are **unrun**.
- gpt F-CS-34 part 3, the content-transfer stall ceiling, stays **open** for the reason in the table.
- The ES halves (PL-030 quoting, F-CS-26 wording) and all docs and rules updates are outside my files.
- Busybox `unzip -t` cannot see damage to a STORED member's bytes. This residual is documented in the code.
- The harness's own default `--old` base (`1d1503180d`) already exits 2 at section s ("cannot read … rocknix-evidence"), before it reaches my block. That is a pre-existing state and not caused by this branch.

## Follow-up 2 — the audit of the fixes (seats A-gpt, A-claude) and vm-qa run 68

Branch `feature/pl-a`, 23 commits on top of `fd6878278a`, HEAD `32aa3a0c65`. Every commit carries the item, the finding, the test and an `Already written:` line, with the Co-Authored-By trailer. Every title is under 72 characters. Nothing was pushed. The pre-commit hook from `next` ran on each commit.

For every fix, the case went into my block first (A31–A50) and was seen to FAIL on the unfixed script before the fix, then PASS. The FAIL lines are in `streams/A/evidence.txt`.

**Rules and registers read this session:**
- `engineering-practices`, `upgrade-and-install`, `es-player-text`, `player-language`, `least-surprise`, `time-to-play`, `vm-first`, `working-principles`, `decision-register`.
- Register rows D-CLOUD-102/103/104, 118/119/121, 136/137 and 122.
- ES's `CloudText.cpp` (`parseLastRun`, `whySentences`) and `GuiMenu.cpp`'s match calls, from the GENERIC_X64 build root.
- I did not re-read `rclone-cloud-sync.md` this session.

### Suite
- `tools/last-good-scripts-test`, the whole file: **559 PASS, 0 FAIL, exit 0** at HEAD `32aa3a0c65`, and the same at `e402e41453`.
  - The stream A block alone is 173 checks.
  - The run was from a copy of the harness with ROOT pinned (`streams/A/run-full.sh`); its log is `streams/A/full-h.log`.
- `tools/cloud-capture-stamp-test`: PASSED.
- `tools/vocabulary-check` over the cloud scripts: 155 judged, 0 wrong.

### The four the GPT seat filed High

| Finding | Outcome | Commit | Case and FAIL-before |
|---|---|---|---|
| G-A-01: `relocate`/`resumable` substring "0 differences found" and the exit status ignored | **Fixed.** `check_clean` requires exit 0 and a count of exactly zero. | `91231adf43` | A31. Ten saves changed between copy and check: FAIL rc 0, all ten deleted and the pointer moved. A new folder holding ten other versions of the same names: FAIL rc 0, the other library's `S3.srm` overwritten. After the fix: rc 5 with all kept, and rc 4 refused. |
| G-A-02: `set_pointer` unchecked, delete regardless | **Fixed.** The pointer is read back. `relocate` returns 2 before anything is removed, and every caller stops (5). The player line is new, with why `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` (proposed). | `79c2f15725` | A32. Settings folder read-only: FAIL rc 0, every old folder emptied, all pointers left on them. |
| G-A-05: `conf_valid`'s continuation branch | **Fixed.** `conf_valid` is now a grammar, one text in all three copies: blank / comment / `KEY=value`. The value is double-quoted (no backtick; a backslash only as the line's last character; `$` only as `$NAME`/`${NAME}`), single-quoted on one line, or a bare word, with nothing after it but blanks and a comment. | `d5f24b05aa` | A33. Seven shapes, each first shown to run its command when sourced: the seat's counterexample, `"; cmd`, bare `;`, single-quoted `;`, an escaped backslash closing the quote, `&&`, and `${W@P}` (runs what another value spells out, with no `$(` anywhere). All seven passed the old validator in all three copies, and the counterexample ran through `cloud_backup`. The shipped conf, a fresh device's conf, and hand edits (comment, single quotes, number, empty, `${NAME}` append) still pass. |
| G-A-09: root saves folder, no record, said only in the log | **Fixed as the coordinator asked.** The console says "Your saves folder is your cloud's top folder, so no replaced cloud saves are kept." and a completed run ends "Completed. " + the same sentence, which the round-trip's outcome gate still accepts. **The register is to carry the exception** (rclone refuses any `--backup-dir` on that remote). | `3c10446acb` | A36. FAIL: only "Completed.". |

### vm-qa run 68's two round-trip failures

**1. "an edited RCLONEOPTS without --filter-from still keeps the allowlist", last check.**
- **Cause:** PL-020's catch-all test was applied to every `--filter-from`, including the player's own.
- **Fix:** the test now applies to `/storage/.config/cloud_sync-rules.txt` only (`MANAGED_RULES`, compared after `readlink -f`). A named file is used as written, and the log says so. Commit `72ea073ca8`.
- **Case A34:** the player's file with no catch-all. The backup sends the save and keeps the excluded file home; the restore leaves it in the cloud. The managed file without its catch-all is still refused. The first two FAILed with rc 1 ("couldn't be read").
- **`tools/cloud-round-trip` needs no change for this step**: it asserts exactly this contract.

**2. "content transfers honour the system selection".**
- **Contract decided:** `--apply` is the second half of a check, as ES runs it (`GuiMenu.cpp`: `--match`, then the confirmation, then `--match --apply`). So:
  - **The tool changed** (`18dae2347e`): the step runs `--match` first and requires both exits 0.
  - **The script's planless-apply why** is now `CHECK WHAT WOULD CHANGE FIRST` (proposed words). It was `SOMETHING CHANGED SINCE YOU CHECKED`, which stays for a real change.
- **Case A35:**
  - An apply with no preview says check first. This FAILed on the old why.
  - The round-trip's own sequence (gb plus a ghost system, checked first) announces ITEM 1 OF 2 and ITEM 2 OF 2 and "Nothing to remove from ghost-never-a-system". This passes on either script: it guards the tool's new sequence.
- **Not run on a guest:** the brief forbids ssh to any guest. Both round-trip steps are untested there until the integrator's vm-qa run.

### Every other finding

**GPT seat**

| Finding | Outcome |
|---|---|
| **G-A-03** (newer version at a listed name deleted) | **Withdrawn, recorded as a residual.** D-CLOUD-102 (maintainer, 2026-09-12): *"sync is never happening between two boxes or consoles at the same time"*. The seat's scenario is two consoles writing one save during a tidy the player started. rclone offers no version-conditional delete on these remotes. A per-file `rclone move` compare narrows the window, but on a size-only remote it would still delete a same-size newer save. PL-053's fix covers the new-name case exactly because the file list makes it free. **For the coordinator:** `upgrade-and-install.md`'s "Another device may be syncing at the same time" predates D-CLOUD-102 (`336fad373a`, 2026-08-25) and says the opposite. |
| **G-A-04** (capture commits after the lock times out) | **Fixed** (`b251bf6021`). A run that cannot get the lock does not commit. An exit, `--rescan`, `--retire` or `--adopt` re-runs once, as it does on losing to another writer; a second failure, or a `--full`, records `lock-busy`. That run's stamp line is not written, which `LOCK_BUSY` makes explicit, so the lifted-`finish()` stamp test still passes. **Time to play:** unchanged with the lock free. Against a commit holding it more than 5 s, the exit capture waits about 10 s instead of 5 s and then racing. A42 FAILed: rc 0, manifest written unlocked. |
| **G-A-06** (= claude G-A-02, `conf_get`) | **Fixed** (`7f3a3eaaca`, corrected by `32aa3a0c65`). The content scripts now read the forms `source` reads: double-quoted, single-quoted or bare, with an optional trailing comment. A line they cannot read is refused rather than read as the root. Against the old reader, A39 FAILed three ways: the trailing comment and the `; echo` line sent the ROMs to the cloud's root, and the single-quoted value sent them to a path with its quotes in it. **Of two lines the first counts.** `7f3a3eaaca` took the last; `32aa3a0c65` takes the first, which is what the old reader and the migration's `conf_value` did. Every ES-started saves run is `--yes`, which runs the duplicate cleanup, and the cleanup keeps the first. So Claude's first-versus-last half is **withdrawn**: the saves scripts run with the first line. |
| **G-A-07** (= claude G-A-03, `--all` fallback listings) | **Fixed** (`1fa2a26a16`). `all_listing` reads the flat root and the legacy root fail-closed. BIOS is read from the content root's own listing. A40 FAILed: rc 0, stamp 0, "Nothing to restore". |
| **G-A-08** (+ claude G-A-13, content progress) | **Fixed** (`b7ffaf0e15`). Progress is what rclone logged moving since the unit began (Copied, Moved, Deleted), whatever the unit's result. A match counts its sync's copies too. A43 FAILed on all three shapes: a bare 69 over a ROM that arrived, in both restore and backup; and "69 gaps" over a unit that moved nothing. |
| **G-A-10** (nested `gamelist.xml`) | **Fixed** (`26e6c7bb40`). The name counts at any depth as game content, in both content scripts' `content_files` and in `cloud_content_filter`. A41 FAILed: row `scummvm\|61\|1\|10`, and no row under game content. |
| **G-A-11** (= claude G-A-10, `backend features` unbounded) | **Fixed** (`cc61218a6d`). The call carries `RCLONE_LIST_OPTS`, and A5's bound check no longer excepts it. A38 FAILed. No hanging-query case: the shim's hang is a sleeping process that no rclone flag bounds. The bound is the same argv check every other call is held to. Claude's note that `take_cloud_lock` uses `>` is **withdrawn**: every cloud script opens the lock that way, and nothing is stored in the file. |
| **G-A-12** (migration "Both folders are as they were") | **Fixed** (`ef93a127ba`, together with claude G-A-11's first half). A37 FAILed 3/3. |

**Claude seat**

| Finding | Outcome |
|---|---|
| **G-A-01** (automatic runs stamp a bare 69 after moving files) | **Fixed** (`f1d1657b24`). The automatic branch of the rclone wrapper, and `execute_rclone_with_error_handling`'s stderr, are read for moved-file lines. A44 FAILed: stamp "69". |
| **G-A-02** | See GPT G-A-06. |
| **G-A-03** | See GPT G-A-07. |
| **G-A-04** (round-trip assertion strips no colour; `run_rc` defined?) | **Fixed** (`4eb42166e3`). The step uses the gate's own `last_player_line`. `run_rc` exists (`tools/cloud-round-trip:1830`), so that doubt is refuted. A50 puts the tool's reader to this sandbox's real `--system-only` output, plain and coloured. The old filter gives False on the coloured line and True on the plain one, which is the run's real shape, so this is robustness rather than a false result seen. |
| **G-A-05** (the `gaps` why has spaces) | **Withdrawn.** `CloudText.cpp` `parseLastRun`: for one of its own tokens (`gaps` is in `isOutcomeToken`), `for (size_t i = ours ? 3 : 2; …) why += " " + parts[i]`. ES's own unit test asserts `parseLastRun("1789000000 1 gaps NES DID NOT FINISH").why == "NES DID NOT FINISH"`. |
| **G-A-06** (the plan's epoch is unread; a same-count substitution passes) | **Withdrawn, recorded as a residual.** The seat itself calls it "a residual to record, not a defect": `--max-delete` is a count. ES never applies without the preview it just showed. A cancelled preview's plan is removed by the next preview, and an apply spends its plan. |
| **G-A-07** (the partial marker ignores content-restore leftovers) | **Fixed** (`4dbd3a5dc8`). The content restore and match apply take the tree-clean record down while they write, sweep a failed unit's folder, and give the record back only when they end by themselves. rclone's `*.????????.partial` is excluded from every content count and transfer. A49 FAILed 2/2. A completed content restore still leaves the record, so F-CS-08's saving is kept. |
| **G-A-08** (nesting warning for `SAVES_REMOTE="/"`) | **Fixed** (`2ae07161bb`). Skipped for either spelling of the root. A46 FAILed. |
| **G-A-09** | **Shape (b) fixed** (`f6a94ba8f0`): an automatic `--system-only` probe the ceiling ended now says THE CLOUD TOOK TOO LONG, not CHECK YOUR SIGN-IN. A45 FAILed 2/2. **Shape (a) withdrawn**: a failure in the ceiling's last second is reported as YOUR CLOUD STOPPED ANSWERING or as the no-network skip, and both are true of that moment. |
| **G-A-11** | **First half fixed** (`ef93a127ba`): the tier is named in words, not by its key. **Second half withdrawn**: the tidy makes no sign-in probe, the page's why is YOUR CLOUD STOPPED ANSWERING, and being offline is the common case. |
| **G-A-12** (restore's saves path lost the sign-in wording) | **Withdrawn.** The saves restore now has `cloud_backup`'s shape (F-CS-04). Both saves paths report a mid-run refusal through `network_lost_during_run`, whose console line still says "You may need to sign in again". Making the two agree was F-CS-04's point (least surprise). |
| **G-A-13** | See GPT G-A-08. |
| **G-A-14** (raw `source` after the duplicate cleanup) | **Fixed** (`2447ff320f`). The rewritten conf is checked. If the cleanup fails or leaves an invalid file, the copy from before it goes back and the run continues. A47 overlays a stand-in cleanup at `/usr/bin` (`sa_run` gained `SA_EXTRA`). It FAILed 2/2: the command ran. |
| **G-A-15** (two harness checks) | **Fixed** (`33f1f54f76`). |

### Found while working, and fixed
- **The duplicate cleanup tore repeated multi-line values** (`0fa4c6c196`). A repeated backslash-continued `RCLONEOPTS` lost its first line and left the rest as bare lines, producing a conf that does not parse. A48 FAILed. `A48`'s end-to-end half runs the real cleanup overlaid at `/usr/bin`.
- **GPT coverage note 3** (`e402e41453`). The sandbox now runs the image's busybox `cp`, `mv`, `rm`, `mkdir`, `cat`, `date`, `ls`, `readlink`, `uniq`, `basename`, `dirname`, `touch`, `chmod`, `ln` and `xargs`. grep, sort and timeout are real binaries on the image. All 173 A checks pass.

### Found, not fixed
**A migration whose verification failed cannot be resumed by the next run.**
- The new folder then holds copies that differ from the source. `resumable` (every destination file present and identical in the source) refuses it as "already exists", and the player must clear the new folder by hand.
- This predates this stream; G-A-01's fix makes the refusal exact rather than lucky.
- Telling a stale copy of our own file from another library's version of the same name needs a record, kept on the device, of what the run copied. That is a design change beyond these findings, and it is left to the coordinator.

### New words for ES and the docs (proposed; not in my files)
**Why sentences.** ES's `whySentences()` must gain these, with French, or the card shows them in English. `CloudTextTests`' emitter table fails on a why a script prints that is not in that table.
- `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` (the migration's pointer write).
- `CHECK WHAT WOULD CHANGE FIRST` (a planless match apply).

**Console lines:**
- "Your saves folder is your cloud's top folder, so no replaced cloud saves are kept."
- "Couldn't save the new folder in this device's settings. It still uses the old one, and nothing was removed from it."
- "Couldn't clean up the duplicate settings, so they were left as they were."
- "Couldn't finish: the cloud took too long. It'll try again next time."
- The migration's copy and verify lines.
- "Now using … for your saves / settings backups / ROMs, BIOS, and game content."

**ES (stream E2's lane).** TRY AGAIN after a match apply re-runs `--match --apply`, which is now refused with CHECK WHAT WOULD CHANGE FIRST. The retry should re-run the preview (GPT coverage note 5).

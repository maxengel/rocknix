# Council seat review — Stream A (cloud scripts), audit #307 / #308

Corpus: the eight embedded sources, cited by path and the sha256 the Facilitator recorded. I did not re-read or re-hash anything. All line references are to hunks in `seats/A.diff` (`5649c169…dde263`) unless another source is named.

---

## 1. Per punch item

**PL-001 — `--match --apply` enforces the preview; a failed listing plans nothing.** **Holds.**
- `cloud_content_restore` `@@ -556,24 +593,58 @@`: `listing=$(rclone lsf "${src}" ...); lrc=$?` then `case "${lrc}" in 0|3|4) ;; *) if absent_not_broken ... else ... printf '%s|fail|%s|0\n' ... return 0`. The dry run and `rclone size` also read `lrc` and emit `fail`. A failed listing is never `remove`.
- `@@ -586,15 +657,73 @@`: `match_plan_write` (temp+`mv -f`, header `plan <epoch>`), `match_plan_of`.
- `@@ -636,6 +765,27 @@`: apply reads the plan, `rm -f "${MATCH_PLAN}"` (spent), refuses with `SOMETHING CHANGED SINCE YOU CHECKED` when empty; preview starts by removing any plan.
- `@@ -660,22 +810,62 @@`: `if [ -z "${pverb}" ] || [ "${verb}" != "${pverb}" ] || ! [ "${files}" -le "${pfiles:-0}" ]` → refuse; then `files="${pfiles}"`, which is what `--max-delete "${files}"` receives in both the `remove` and `sync` branches.
- Harness A1 (`A.harness.txt`) tests all eight shapes. The acceptance names `remove`→`sync`; A1 tests `sync`→`remove`; the code refuses any verb change symmetrically. Residual: G-A-06.

**PL-012 — `--all` restores ROMs and BIOS, media filters anchored.** **Holds** (round-trip step unrun).
- `@@ -1042,7 +1282,56 @@`: `ALL_ROMS=$(rclone lsf --dirs-only "${ROOT}ROMs/" ...); all_rc=$?` fail-closed; each system becomes a unit, so `MEDIA_EXCLUDES` anchor at `ROMs/<sys>`; BIOS added `if [ "${MEDIA_MODE}" != only ] && exists_remote "${ROOT}BIOS"`. Empty → `record_outcome content-restore 0; exit 0` (the report states this decision).
- A2 checks BIOS subfolders, `nes/images/N.png` left behind, per-unit `>>> unit` lines, `Photos` untouched, a failed ROMs listing.
- `tools/cloud-round-trip` `@@ -1202,6 +1211,38 @@` adds the BIOS assertion; the report says it is unrun. Residual: the two fallback-layout listings are fail-open (G-A-03).

**PL-020 — cut rules file never installed; consumers check the catch-all.** **Holds.**
- `cloud_sync_helper` `@@ -24,6 +24,16 @@` `rules_whole() { [ -s "$1" ] && grep -qx -- '- /\*\*' "$1"; }` (anchored, whole line). `@@ -87,8 +109,15 @@`/`@@ -98,19 +127,66 @@`: every write tracked in `built`, `if [ "${built}" != 1 ] || ! rules_whole "${rules}.new"; then rm -f ...; return 1`. The default-copy branch is also checked.
- `cloud_backup` `@@ -1345,6 +1451,30 @@` and `cloud_restore` `@@ -1436,6 +1554,30 @@`: walk `all_opts` for `--filter-from`/`=` forms, `rules_whole` each, `say_why "YOUR CLOUD SYNC SETTINGS COULDN'T BE READ"; return 1`.
- A3's cutting `cat` shim and the consumer cases are discriminating.

**PL-021 — pruning pins this run's folder and archive.** **Holds.**
- `cloud_backup` `@@ -1220,13 +1314,25 @@`: `prune_replaced_remote root pinned` — `if [ -n "${pinned}" ] && printf ... | grep -qxF -- "${pinned}"; then doomed=$(... grep -vxF -- "${pinned}")`; call site `@@ -1474,8 +1627,8 @@` passes `replaced_stamp`. Retention `@@ -1902,7 +2056,16 @@`: `others=$(... grep -vxF -f <(printf '%s\n' "${uploaded_names[@]}"))`, `left=$(( keep - ${#uploaded_names[@]} ))`. `cloud_restore` `@@ -1266,16 +1358,42 @@` `prune_replaced_local root pinned`.
- Residual, stated in the comment: a run that replaced nothing wrote no folder and falls back to newest-by-name, so a clock-ahead sibling still purges this device's *previous* record early. Within acceptance.

**PL-025 — backups first, not into Saves.** **Holds.**
- `cloud_migrate_layout` `@@ -55,11 +152,21 @@` `SAVES_EXCLUDES=(--exclude '/backup/**' --exclude '/Backups/**')`; `@@ -249,34 +428,67 @@` appends `--exclude "/${nested#...}/**"` for a nested settings or content tier; `@@ -285,39 +497,55 @@` moves backups before saves and passes `"${SAVES_EXCLUDES[@]}"` to the saves `relocate`. A5 asserts nothing under `Saves/backup` or `Saves/Content`.

**PL-026 — pointer per tier as it lands; resume per tier.** **Holds.**
- `relocate` `@@ -96,26 +205,75 @@`: `set_pointer "${key}" "${dst#*:}"` after the check passes and *before* the delete. Refusals `@@ -249,34 +428,67 @@`: backups judged by `resumable "${remote}${backups}" "${remote}${NEW_BACKUPS}"`, saves by `resumable "${remote}${saves_src}" "${remote}${NEW_SAVES}"`; a tier whose pointer already names the new folder is skipped; an empty source moves only its pointer.
- A5's kill (`'^copy ' 2`) fires at the second copy *call*, i.e. between the moves; the mid-copy partial-destination resume path (`exists && resumable`) is in the code but not exercised.

**PL-027 — failed listing stops the migration.** **Holds.**
- `@@ -44,9 +44,106 @@`: `list_or_stop` reads `rc`, `3|4` → absent, else `absent_not_broken` else `unreadable` (exits); `has_entries`/`has_files`/`exists` all route through it; `@@ -193,6 +357,21 @@` probes the root with `rclone lsd "${remote}" "${RCLONE_LIST_OPTS[@]}"` first. A5 dead-endpoint case asserts pointers unchanged.

**PL-028 — saves 9 does not hide a failed settings phase.** **Holds.**
- `cloud_backup` `@@ -1969,8 +2134,15 @@` and `cloud_restore` `@@ -1849,21 +2024,28 @@`: `case "${overall}" in 0|9) overall=${..._SYSTEM_STATUS} ;; esac`. A6 covers both scripts and asserts the saves phase really returned 9. Round-trip assertion unrun (G-A-04).

**PL-030 (script half) — `--set-systems` takes folder names only.** **Holds.**
- `cloud_content_restore` `@@ -998,29 +1213,54 @@`: `set -f; read -r -a local_names <<< "$*"; set +f`, `[[ "${_n}" =~ ^[A-Za-z0-9_][A-Za-z0-9._-]*$ ]] || exit 1` before anything is written; `selected_systems` in both content scripts filters with the same class (`@@ -351,9 +376,13 @@`, `@@ -355,9 +386,13 @@`). Stricter than the item (no leading `.`/`-`), explained in the comment. A7.

**PL-052 — `--retire` relative argument refused.** **Holds.**
- `cloud_capture` `@@ -406,13 +450,16 @@`: `case "${p}" in "${ROOT}/"*) ...;; *) return 1 ;; esac`; `@@ -422,10 +469,12 @@`: `RETIRE_ACCEPTED+=("${ROOT}/${_rel}")`. A8.

**PL-053 — delete by verified list.** **Holds.**
- `relocate` `@@ -96,26 +205,75 @@`: one listing → `list`; `copy --files-from-raw`, `check --files-from-raw --one-way`, `delete --files-from-raw` then `rmdirs`. A5's `/ctl/post` plants `LATE.srm` after the check and asserts it survives. Inherent residual (not the item's): a listed file *rewritten* by another device between check and delete is still lost.

**PL-066 — game-list pass failure folded.** **Holds.**
- `cloud_content_backup` `@@ -562,19 +599,32 @@`, `cloud_content_restore` `@@ -1090,19 +1379,32 @@`: `GL_RC=$?; case "${RC}" in 0|9) case "${GL_RC}" in 0|9) ;; *) RC=${GL_RC} ;; esac ;; esac`. A9.

**PL-067 — commit under a lock.** **Holds.**
- `cloud_capture` `@@ -192,6 +199,37 @@` `capture_lock` (fd 8, `flock -n`, 50×0.1 s then fall back to detection, logged); `@@ -1470,6 +1535,9 @@` before the inode check; `@@ -212,6 +250,8 @@` in `finish`; `@@ -1482,6 +1550,7 @@` released before the re-exec. Also spares seals with ctime < 600 s (`@@ -1508,11 +1577,21 @@`). A8 proves the wait against a foreign holder, not two real captures; detection still arbitrates.

**PL-070 — `unzip -t` stands where supported.** **Holds.**
- `cloud_backup` `@@ -642,16 +661,50 @@`: `unzip_can_test` probes once for `invalid option|unrecognized option|illegal option|unknown option`; `archive_whole` then runs `-t` alone or `-l` alone, never `-t || -l`. A10 under the image's busybox unzip. Documented residual: STORED-member CRCs unchecked by busybox 1.36.1.

**PL-071 — `migrate_content` failure propagated.** **Holds.**
- `@@ -285,39 +497,55 @@`: `migrate_content ... || content_rc=$?` … `return "${content_rc}"`; `@@ -159,6 +317,7 @@`/`@@ -166,10 +325,13 @@` add `>>> why` lines under `--apply`. A5 PL-071 case.

**PL-015 (script half, coordinator's row).** **Holds.**
- `cloud_sync_helper` `@@ -287,13 +377,28 @@`: `if [ "${parent}" = "/" ]; then value='""'` with a WARN; `cloud_backup` `@@ -1089,22 +1174,31 @@` warns for `SETTINGS_REMOTE` and `CONTENT_REMOTE` nested in `SAVES_REMOTE`, on screen only when `AUTOMATIC` is 0. A14. Side effect: G-A-08.

**PL-051 (script half, coordinator's row).** **Holds, with a residual.**
- `conf_valid` in helper/backup/restore (`@@ -122,13 +198,29 @@`, `@@ -877,19 +938,43 @@`, `@@ -939,19 +1005,43 @@`): `$(`/backtick refused on any non-comment line, `[$\`\\]` and `[[:cntrl:]]` refused in the five folder values. Content scripts `@@ -97,7 +97,22 @@`/`@@ -98,7 +100,22 @@` read by `sed`, never `source`. A15. Residual: G-A-14 (one raw `source` left in `cloud_restore`; capture/saves_root unknown).

---

## 2. Findings about the fixes

### G-A-01: F-CS-24 is fixed for deliberate runs only; the automatic syncs still stamp a bare 69 after moving files
- **Severity:** Medium
- **Category:** Outcome vocabulary / report overstates
- **Where:** `cloud_backup` `@@ -331,7 +342,15 @@` (the `rclone()` wrapper's `AUTOMATIC` branch runs `command timeout ... rclone` directly), `@@ -319,6 +325,11 @@` (`RCLONE_MOVED=1` set only inside `bounded_rclone`), `@@ -642,16 +661,50 @@` (`record_last_run`, comment: "Known for the deliberate runs, whose rclone reports its counts through the stall ceiling's trace"); mirrored in `cloud_restore` `@@ -313,7 +329,15 @@`, `@@ -301,6 +312,11 @@`, `@@ -673,6 +707,14 @@`.
- **What:** `RCLONE_MOVED` is derived from the stall ceiling's trace, which only deliberate runs produce. An `--automatic` run never enters `bounded_rclone`, so `RCLONE_MOVED` stays 0 and the stamp is `<epoch> 69`.
- **Failure scenario:** The sync after a game (the case the finding was filed about — "the rows read as SKIPPED") sends two saves, the link drops, the run exits 69; the row under the toggle reads SKIPPED, NO NETWORK over files that did go up.
- **Evidence:** The diff's own comment admits the limit; `A.report.md` lists claude F-CS-24 as "**fixed**" with no qualifier; harness A28 exercises `cloud_content_restore` and a deliberate `cloud_backup --yes` only — no `--automatic` case. I looked for any `RCLONE_MOVED` assignment reachable from the automatic branch and found none.

### G-A-02: `conf_get` reads an unparseable `CONTENT_REMOTE` line as the remote root
- **Severity:** Medium
- **Category:** Guards fail closed
- **Where:** `cloud_content_backup` `@@ -97,7 +97,22 @@`, `cloud_content_restore` `@@ -98,7 +100,22 @@`: `sed -n "s/^$1=\"\{0,1\}\([^\"]*\)\"\{0,1\}\$/\1/p" ... | head -1`.
- **What:** The pattern requires the whole line to be exactly `KEY=value` or `KEY="value"`. A trailing space, a trailing `# comment`, a CR, or a value with a `"` inside makes it match nothing, and `CONTENT_REMOTE` becomes `""` — the remote root — with no refusal. `source` tolerated all of those. Only the `[\$\`\\]`/`[[:cntrl:]]` case refuses; "present but unreadable" is silently the root. `head -1` also takes the first duplicate where `source` took the last, so a conf the duplicates-cleanup has not yet touched can give the content scripts a different folder than the saves scripts.
- **Failure scenario:** A hand-edited conf carries `CONTENT_REMOTE="/ROCKNIX/Content" # ROMs live here`. The next content backup uploads into the root; `--match` finds no `ROMs/<sys>` at the root, plans `remove` for every system, and the preview truthfully announces removals the player then agrees to.
- **Evidence:** The regex as written; `cloud_migrate_layout`'s `conf_value` (`grep -m1 | cut -d'"' -f2`) is the tolerant reader beside it. Harness A15 tests only the injection refusal; no case gives `conf_get` a well-formed-but-decorated line.

### G-A-03: `--all`'s two fallback-layout listings discard rclone's exit
- **Severity:** Medium
- **Category:** Guards fail closed (the F-CS-01/PL-027 class, reintroduced in the fix for PL-012)
- **Where:** `cloud_content_restore` `@@ -1042,7 +1282,56 @@`, the `mapfile -t DIRS < <( ... )` block: `rclone lsf --dirs-only "${ROOT}" ... 2>/dev/null | sed ... | grep -vxE 'ROMs|BIOS' | grep -Fxf ...` and `rclone lsf --dirs-only "${LEGACY_ROOT}" ... 2>/dev/null | sed ... | grep -Fxf <(legacy_dirs)`.
- **What:** Only the `ROMs/` listing has `all_rc` read. The flat-layout and legacy-root listings are inside a pipeline in a process substitution with `2>/dev/null`; a failure is an empty contribution.
- **Failure scenario:** A cloud still on the flat layout (systems beside `ROMs/`, or under `LEGACY_ROOT`) hits a transient error on that one listing during the journey's first restore. `--all` restores BIOS only, or prints "Nothing to restore: your cloud has no ROMs or BIOS files yet." and stamps `0`.
- **Evidence:** Harness A2 fails only `qa:/ROCKNIX/Content/ROMs/`; nothing fails the root or legacy listing. The comment above the block says "The ROMs listing is read fail-closed" and is silent on the other two.

### G-A-04: the new `tools/cloud-round-trip` outcome assertion compares a raw console line and is unrun
- **Severity:** Medium (cannot tell — likely a false FAIL, not a false PASS)
- **Category:** Verify the artifact / unproven test
- **Where:** `tools/cloud-round-trip` `@@ -720,12 +720,19 @@`: `last_sb = [l for l in out_sb.splitlines() if ... not l.strip().startswith("=")]` and `last_sb[-1].strip().endswith("Completed.")`; `rc_sb, out_sb = run_rc(dev, ...)`.
- **What:** The harness's own readers (`sa_outcome`, `sa_tail`, A12's `sed 's/\x1b\[[0-9;]*m//g'` before `^Settings backup:`) strip ANSI escapes before matching these same lines, which is evidence the scripts colour them; the round-trip filter and `endswith` do not strip. If the outcome line ends in a reset, or the `====` rule starts with a colour code, the check fails regardless of behaviour. Whether `run_rc` exists in the tool is outside the diff.
- **Failure scenario:** The integrator runs the round-trip on the VM and gets a FAIL on a run that did end `Completed.`; or, if `run_rc` is undefined, a `NameError` before the assertion.
- **Evidence:** The two new assertions here and at `@@ -741,8 +748,10 @@`; `A.report.md`: "It parses, but it runs only on the VM, so I did **not** run it." No FAIL-then-PASS exists for these.

### G-A-05: the `gaps` why is written with spaces where every other stamp why is one underscored token
- **Severity:** Low
- **Category:** Stamp format / player text
- **Where:** `cloud_backup` `@@ -642,16 +661,50 @@` (`why=" gaps YOU WENT OFFLINE PART-WAY THROUGH"` beside `why=" $(printf '%s' "${LAST_WHY}" | tr ' ' '_')"` five lines above); `cloud_content_backup` `@@ -201,11 +216,20 @@`, `cloud_content_restore` `@@ -207,12 +224,26 @@` (`write_stamp ... "$(date +%s) ${EXIT_NO_NETWORK} gaps YOU WENT OFFLINE PART-WAY THROUGH"`).
- **What:** `es-player-text.md` (`554225c6…`): "The stamp's third field is the why sentence as one token, spaces as underscores." The new stamp is `<epoch> 69 gaps YOU WENT OFFLINE PART-WAY THROUGH` — five tokens after `gaps`.
- **Failure scenario:** A reader that takes the token after `gaps` as the why shows `COULDN'T FINISH, YOU` on the row.
- **Evidence:** `CloudText::parseLastRun` is outside the packet; harness A28 asserts only `grep -q '^69 gaps .'`. What would settle it: the parser's handling of the tokens after `gaps`.

### G-A-06: the match plan has a timestamp nobody reads, and a same-count substitution passes
- **Severity:** Low
- **Category:** Guard weaker than its comment
- **Where:** `cloud_content_restore` `@@ -586,15 +657,73 @@` (`printf 'plan %s\n' "$(date +%s)"`), `@@ -636,6 +765,27 @@` (`head -1 ... | grep -q '^plan [0-9][0-9]*$'` — the epoch is never compared), `@@ -660,22 +810,62 @@` (`! [ "${files}" -le "${pfiles:-0}" ]`).
- **What:** The comment says "a ROM added since ... is not what the player agreed to" and "each apply stands on the preview that immediately led to it". The code holds the verb and an upper bound on the count, not the file set or the age.
- **Failure scenario:** Preview plans `gb|sync|1` (B.gb). The player deletes B.gb and copies in C.gb; apply counts 1 ≤ 1, passes `--max-delete 1`, and removes C.gb, never previewed.
- **Evidence:** A1 tests only the count-grew direction. `--max-delete` is inherently a count, so this is a residual to record, not a defect in the mechanism the item asked for.

### G-A-07: the partial-file marker asserts a tree-wide property that only `cloud_restore` maintains
- **Severity:** Low
- **Category:** Before deleting a duplicate, diff its behaviours
- **Where:** `cloud_restore` `@@ -1266,16 +1358,42 @@` (`PARTIALS_CLEAN=/storage/.cache/cloud_sync/restore-tree-clean`), `@@ -1486,9 +1633,13 @@` (sweep only when `tree_was_clean -eq 0` or the transfer failed).
- **What:** The unconditional sweep also cleaned `<name>.<8>.partial` left under `/storage/roms` by other writers into the same tree — a cut `cloud_content_restore` writes there with rclone's default partial suffix. The marker now says "clean" after a saves transfer completed, whatever a content restore left.
- **Failure scenario:** A content restore is killed mid-file; `Game.nes.a1b2c3d4.partial` stays; the next startup sync finds the marker and walks nothing; the next content backup's `content_files` find has no `.partial` exclusion and sends it as content.
- **Evidence:** The comment's premise — "what can have left one is a transfer that failed, or one that never got to say it finished" — is true of this script's transfer only. A13 plants a partial and asserts it is *not* swept after a clean run, which is the intended saving and the residual at once.

### G-A-08: the nested-folder warning fires on every deliberate run when `SAVES_REMOTE="/"`, and not for `""`
- **Severity:** Low
- **Category:** Player text / consistency with F-CS-25
- **Where:** `cloud_backup` `@@ -1089,22 +1174,31 @@`: `[ -n "${nested_val}" ] && [ -n "${SAVES_REMOTE}" ] || continue` then `case "${nested_val%/}/" in "${SAVES_REMOTE%/}/"?*)`. With `SAVES_REMOTE="/"` the pattern is `/?*`, which every folder matches.
- **What:** F-CS-25 (`@@ -1430,9 +1560,24 @@`) treats `""` and `"/"` as the same root; this warning skips `""` and fires for `"/"`, logging `SETTINGS_REMOTE=/Backups is inside SAVES_REMOTE=/` and telling the player TIDY UP YOUR CLOUD FOLDERS will move it out.
- **Failure scenario:** Harness A22's exact config (`SAVES_REMOTE="/"`, `SETTINGS_REMOTE="/Backups"`) on a real device: a WARN on screen on every BACK UP SAVES TO THE CLOUD press.
- **Evidence:** A22 asserts rc, the cloud's bytes and a log line about the replaced folder; it does not grep the output for the nesting sentence, so the noise is unobserved.

### G-A-09: past the automatic deadline every wrapped `rclone` returns 124, and callers other than `network_lost_during_run`'s 124/10 branch read that as the cloud's answer
- **Severity:** Low
- **Category:** Wording of a bounded failure (F-CS-34 residual)
- **Where:** `cloud_backup` `@@ -331,7 +342,15 @@` (wrapper `return 124`), `@@ -862,6 +915,14 @@` (exempts only `rc = 124 || 10` before the `rclone lsd` probe); `cloud_restore` `@@ -879,7 +937,7 @@` shows `check_internet` reading a failed `rclone lsd` plus a working ping as `COULDN'T REACH YOUR CLOUD - CHECK YOUR SIGN-IN`.
- **What:** Two shapes. (a) A transfer that fails with rclone's own code (5, 7) in the last second of the ceiling: `network_lost_during_run` skips the exemption, its probe is not started and returns 124, and the elided tail decides the wording from a probe that never ran. (b) In A29's own first case (`--automatic --system-only`, probe hung), the wrapper's 124 reaches `check_internet`, whose visible branch words it as a sign-in problem, not the ceiling's; the check asserts only `DT -le 12 && RC -ne 0`.
- **Failure scenario:** A startup sync whose cloud times out at the edge of 90 s reports YOU'RE NOT ONLINE or CHECK YOUR SIGN-IN where THE CLOUD TOOK TOO LONG is true.
- **Evidence:** The exemption list in the diff; the lines of `network_lost_during_run` between the probe and `clean_exit "${EXIT_NO_NETWORK}"` are elided, so (a) is *cannot tell* — the third A29 check (`THE CLOUD TOOK TOO LONG`) is on the `--saves-only` run where the transfer itself returned 124.

### G-A-10: `cloud_migrate_layout` still makes one unbounded call, and the harness's bound check whitelists it
- **Severity:** Low
- **Category:** Bounded timeouts (F-CS-23 residual)
- **Where:** `cloud_migrate_layout` `@@ -193,6 +357,21 @@`: `rclone backend features "${remote}" 2>/dev/null | tr -d ' \t\n' | grep -q '"Hashes":\["'` — no `RCLONE_LIST_OPTS`. Harness A5: `unbounded=$(grep -vE '^(listremotes|backend features|version)' ...)`.
- **What:** `backend features` creates the Fs, which on several backends is a network round trip; it runs after the root probe succeeded, so the exposure is a cloud that answers `lsd` and then stalls. The check that certifies "every rclone call ... carries a bound" was written around the exception.
- **Evidence:** The `2>/dev/null` pipeline as quoted; the failure direction is safe (`CHECK_OPTS=(--download)` when the grep fails). Also noted: `take_cloud_lock` opens the shared lock with `>` (truncate) where the capture lock in the same diff deliberately uses `>>` "so taking it never truncates anything" — whether anything is stored in `/var/run/cloud_sync.lock` is outside the packet.

### G-A-11: a config key name on the tidy page's console, and an offline assumption in the migration's stop sentence
- **Severity:** Low
- **Category:** Player text (`es-player-text.md` § Conventions: no developer concepts)
- **Where:** `cloud_migrate_layout` `@@ -96,26 +205,75 @@` `set_pointer`: `say "Now using ${2} for ${1}."` → `Now using /ROCKNIX/Saves for SAVES_REMOTE.`; `@@ -44,9 +44,106 @@` `unreadable`: "Couldn't read your cloud, so nothing more was changed. Try again when you're online." for any non-3/4 listing failure.
- **What:** The first prints an internal identifier to a surface the `>>> why` lines show is player-facing; the second presumes the network for a failure that may be a refused sign-in.
- **Evidence:** The two `say` lines as quoted; the surrounding older lines already print remote paths, so the surface's register was not raised by this stream, but the key name is new.

### G-A-12: `cloud_restore`'s saves path drops `check_internet`, and with it the sign-in wording for a deliberate saves restore
- **Severity:** Low (cannot tell the resulting why)
- **Category:** Fix reaches past its item (F-CS-04)
- **Where:** `cloud_restore` `@@ -1801,12 +1969,17 @@`: `[ "${SYSTEM_ONLY}" -eq 1 ] && check_internet`; `@@ -879,7 +937,7 @@` shows the dropped branch's why.
- **What:** Under "cloud_backup's shape", RESTORE SAVES FROM THE CLOUD with an expired token no longer reaches `COULDN'T REACH YOUR CLOUD - CHECK YOUR SIGN-IN`; the wording now comes from `network_lost_during_run`, whose tail is elided in the diff.
- **Evidence:** A12 asserts time, SKIPPED lines and no `listremotes`; no case runs a saves restore against a remote that refuses auth. What would settle it: the lines of `network_lost_during_run` after the failed probe, and whether they distinguish "internet up, cloud refuses" from "offline".

### G-A-13: the content backup's gaps stamp is an untested path, and PROGRESS_MADE counts a unit that moved nothing
- **Severity:** Low
- **Category:** Unproven fix
- **Where:** `cloud_content_backup` `@@ -201,11 +216,20 @@` (`write_stamp ...` — not defined anywhere in this script's diff) and `@@ -586,6 +636,7 @@` (`PROGRESS_MADE=1` in the `else` of `if [ ${RC} -ne 0 ] && [ ${RC} -ne 9 ]`, i.e. also for RC 9); same 9-counting in `cloud_content_restore` `@@ -1114,6 +1416,7 @@`.
- **What:** A28 proves the restore's stamp (so `write_stamp` exists there) and `cloud_backup`'s; no case cuts a content *backup* after a unit landed. And a unit that returned 9 ("nothing needed moving") sets PROGRESS_MADE, so a run whose only completed unit moved nothing stamps `PART-WAY THROUGH` — COULDN'T FINISH over an untouched cloud, the inverse of the finding.
- **Evidence:** The three A28 sub-cases as listed in `A.harness.txt`; `write_stamp`'s definition in `cloud_content_backup` is outside the diff.

### G-A-14: PL-051 leaves one raw `source` of the live conf in `cloud_restore`, and two readers of `SAVESPATH` are unaccounted for
- **Severity:** Low
- **Category:** Guard incomplete
- **Where:** `cloud_restore` `@@ -1038,13 +1128,13 @@`, context lines: after `/usr/bin/cloud_sync_cleanup_duplicates.sh "$conf_file"` → `# Reload config after cleanup` → `source /storage/.config/cloud_sync.conf`, with no `conf_valid` between.
- **What:** The file was validated before the cleanup ran; the cleanup rewrote it; the rewritten file is sourced unchecked. The path is interactive (the player answered Yes), so the window is the cleanup script's own output. `cloud_capture` and `cloud_saves_root` read `SAVESPATH` (harness fixtures write it for them); how they read it is outside the diff.
- **Evidence:** The context lines quoted; `A.report.md` names `conf_valid` in "the helper, backup and restore" and `conf_get` in the two content scripts, and no other reader.

### G-A-15: two harness weaknesses
- **Severity:** Low
- **Category:** A test that can pass for the wrong reason
- **Where:** `A.harness.txt` A8, "a stage seal placed moments ago ... survives another capture's GC": `[ -f ... ]` with no `RC` check on the second `cp_exit`; A28's third case: `printf '%s	%s\n'` with a literal tab and newline inside the format.
- **What:** If the second capture aborts before its GC, the planted seal survives and the check passes; the fix's presence is not what is asserted. The second is cosmetic (works in bash).
- **Evidence:** Compare A13's second check, which guards the same shape with `&& [ "${RC}" -eq 0 ]`.

---

## 3. Sweep rows

**Spot-checked against the diff (fixed as claimed):**
- claude F-CS-08 — `cloud_restore` `@@ -1266,16 +1358,42 @@`, `@@ -1470,14 +1612,19 @@`, `@@ -1486,9 +1633,13 @@`; `find ... -exec rm -f {} +`. Present; residual G-A-07.
- claude F-CS-11 — `cloud_sync_helper` `@@ -66,11 +63,36 @@`: `marker=/storage/.config/.cloud_sync-rules-user-first-applied`, `"- /**") past_catch_all=1`, `# inert: ` re-emission; marker touched only after the rename lands (`@@ -98,19 +127,66 @@`). Present; A17 discriminates.
- claude F-CS-18 — `cmp -s "${rules}.new" "${rules}"` and `cmp -s "${work}" "${conf}"` (`@@ -98,19 +127,66 @@`, `@@ -303,12 +408,22 @@`); `--verbose` sed gated by `grep -qE -- '--verbose|-v '` (`@@ -353,7 +468,10 @@`). Present.
- claude F-CS-21 — `cloud_backup` `@@ -1819,7 +1972,8 @@` (`rclone size ... "${RCLONE_LIST_OPTS[@]}"`), `cloud_restore` `@@ -1535,7 +1694,10 @@` (`rclone ls "${REMOTENAME}${SETTINGS_REMOTE}/" "${RCLONE_LIST_OPTS[@]}"`, also now quoted). Present.
- claude F-CS-20 — `cloud_capture` `@@ -734,8 +787,14 @@`: `timeout -s KILL 2 timedatectl ...`. Present; the report's `-s KILL` reasoning matches the header's `trap '' TERM` remark.
- gpt F-CS-20 — `cloud_saves_root` `@@ -82,11 +87,18 @@` (`write_record` returns 1 on failure), `@@ -153,18 +165,36 @@` (`--no-write`, exit 1 with `>>> why COULDN'T RECORD WHICH CARD YOUR SAVES ARE ON`); callers `cloud_backup` `@@ -1457,10 +1602,18 @@`, `cloud_restore` `@@ -1500,10 +1651,18 @@` record only on `0|9`. Present.
- gpt F-CS-22 — `cloud_capture` `@@ -569,6 +618,10 @@` (`finish 3 "adopt-not-a-member"`), `@@ -1290,7 +1349,13 @@` (`&& [ "${E_UNIT[${_srcrel}]}" = "${UNIT}" ]`). Present.
- gpt F-CS-29 — `cloud_sync_helper` `@@ -421,14 +539,18 @@`: `--max-duration 90s` written directly. Present.
- gpt F-CS-35 — `cloud_restore` `@@ -1712,7 +1874,13 @@`: `grep -E '^[0-9]{4}_[0-9]{2}_[0-9]{2}-[0-9]{6}-' | sort | tail -1` then fallback. Present.
- gpt F-CS-34 — the report says "fixed in part" and names the open half (a stall ceiling on the content transfers); the diff matches that description (`rclone()` 124, `main` reordering in both saves scripts, the 124/10 exemption). Honest; residual G-A-09.
- claude F-CS-24 — present but overstated: G-A-01.

**Withdrawn rows:**
- claude F-CS-27 (`package.mk`) — **holds** from the packet: `A.plan.md`'s "The files you own" list does not include `package.mk`.
- claude F-CS-12 (D-CLOUD-042/040), claude F-CS-22 (D-CLOUD-079), gpt F-CS-28 (D-CLOUD-072/136/112) — each withdrawal names specific register rows; the register is not in the packet, so **cannot judge**. The reasons are of the kind the plan asked for ("refuted with the line that refutes it") and each proposes where the question goes (the maintainer; an Open row), which is the honest shape.
- The report itself flags that the coordinator's "gpt F-CS-15 script half" label names a different gpt finding in the seat file; the work under it (BIOS alone under `--selected`, `9f564e1733`, A11) is in the diff at `@@ -998,29 +1213,54 @@`.

---

## 4. Coverage boundary

Not judgeable from this packet:
- Callees outside the diff that decide behaviour I cite: `why_for`, `say_why`, `record_outcome`, `write_stamp` (content backup), `log_message`'s colouring and console gating, `network_gone`, `absent_not_broken` in `cloud_content_restore`, `supported_systems`/`legacy_dirs`/`remote_for`/`derived_content`, `execute_rclone_with_error_handling`, the elided middle of `network_lost_during_run`, `cloud_sync_cleanup_duplicates.sh`, and how `cloud_capture`/`cloud_saves_root` read `SAVESPATH`.
- Whether `mine` in the settings retention (`@@ -1902,7 +2056,16 @@`) is newest-first; the new code inherits the old ordering assumption.
- `CloudText::parseLastRun`'s reading of `69 gaps <multi-word why>` (G-A-05) and of the changed `>>> removed` meaning.
- Runtime under the device's own applets for the new externals the harness ran with the host's: `timeout -s KILL` (not in the harness's busybox `nbin` list), `grep -vxF -f <(…)`/`grep -Fxf <(…)` (grep is host grep in the sandbox), `sed -i` in `set_pointer`.
- `tools/cloud-round-trip`: unrun; `run_rc`, `unit_protocol`, `cbefore`, `stage` at the new step's position are outside the diff (G-A-04).
- The report's "94 CHECK(S) FAILED on `417dcd8610`" and "508 PASS" are claims; the harness text shows which checks are discriminating by construction, and I have marked the ones that are not (G-A-15) — the count itself is not verifiable here.
- Two real captures racing (PL-067 is proven against a foreign lock holder), a migration copy cut mid-file (PL-026's `resumable` path), and a real hashless remote (`--download`) are for the integrator's VM list, which the report already names.
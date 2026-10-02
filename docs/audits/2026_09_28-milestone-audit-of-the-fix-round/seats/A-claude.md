# Audit of the fix round — packet A (the cloud scripts), second seat

Corpus: the eight embedded sources, cited by path and the sha256 the Facilitator recorded at embed time. Nothing was re-read or re-hashed here. Where a callee, a register row, or a runtime is outside the diff I say so.

---

## 1. Punch items (`seats/A.items.md`, sha `e35f9a98…`) against `seats/A.diff` (sha `48bf7f7d…`)

| Item | Verdict | Mechanism in the diff (hunk) / what is missing |
|---|---|---|
| **PL-001** | **holds** | `cloud_content_restore` `@@ -556,24 +641,58 @@`: `match_plan_one` reads `lsf`'s exit apart from its emptiness (`0\|3\|4` absent, else `absent_not_broken`, else `sys\|fail\|rc\|0`). `@@ -586,15 +705,90 @@`: the preview writes `content-match-plan`; `@@ -636,6 +830,34 @@`: apply reads and `rm -f`s it. `@@ -660,22 +882,62 @@`: `[ "${verb}" != "${pverb}" ] \|\| ! [ "${files}" -le "${pfiles:-0}" ]` refuses, then `files="${pfiles}"` feeds `--max-delete "${files}"`. Harness A1 constructs the failed listing (5), the verb change (sync→absent) and asserts `--max-delete 1` in the recorded argv. Residual, not a defect of the item: the plan carries no file names and no selection/mode key (see G-A-06 and G2-A findings). |
| **PL-012** | **holds** (round-trip half unrun) | `@@ -1042,7 +1361,68 @@`: `--all` enumerates `ROMs/`, the flat and legacy roots (filtered to known systems), adds `bios` from the content root's own listing; `>>> unit` per system. `tools/cloud-round-trip @@ -1202,6 +1214,38 @@` plants a BIOS file and asserts `dev.sha(bdest) == sha(bios_body)`. The report says the round-trip was not run on a guest. |
| **PL-015** | **holds in part** | Acceptance names `cloud_setup` (refuse `/`, or derive `/ROCKNIX/Settings` beside `/ROCKNIX/Saves`). This packet has only the helper half: `cloud_sync_helper @@ -287,13 +428,28 @@` writes `CONTENT_REMOTE=""` for a top-level saves folder (not a derived sibling — the acceptance's "derived paths beside" is not what this half does), plus `cloud_backup @@ -1089,22 +1288,35 @@` warns for either tier nested in the saves folder. `cloud_setup` is not in the diff. |
| **PL-020** | **holds** | Helper `@@ -87,8 +109,15 @@`/`@@ -98,43 +127,157 @@`: every append is `\|\| built=0`, `rules_whole "${rules}.new"` before the rename, `.bak` only from a whole file (`rules_whole` is `grep -qx -- '- /\*\*'`, anchored both ends — the F-CS-06 fix). Consumers: `cloud_backup @@ -1345,6 +1572,42 @@`, `cloud_restore` `@@ -1436,6 +1665,42 @@` refuse the *managed* file without the line and `say_why "YOUR CLOUD SYNC SETTINGS COULDN'T BE READ"`, `return 1`. A3 and A34 exercise both the refusal and the player's-own-file exemption. |
| **PL-021** | **holds** | `cloud_backup @@ -1220,13 +1435,25 @@` `prune_replaced_remote root pinned`: if the run's stamp is listed, `doomed = names − pinned`, else newest-by-name as before. `@@ -1902,7 +2194,16 @@`: `others` excludes `uploaded_names`, `left = keep − #uploaded`. `cloud_restore @@ -1266,16 +1469,42 @@` `prune_replaced_local root pinned`. A4 seeds `2099_…` folders/archives. |
| **PL-025** | **holds** | `cloud_migrate_layout @@ -285,39 +555,55 @@`: backups relocated first; `@@ -249,34 +486,67 @@`: nested tiers appended to `SAVES_EXCLUDES` relative to `saves_src`; `relocate` (`@@ -96,26 +217,112 @@`) lists with those filters and copies/checks/deletes only the list. A5 asserts nothing under `Saves/backup` or `Saves/Content`. |
| **PL-026** | **holds** | `relocate` calls `set_pointer` per tier after the check and before the delete; `@@ -249,34 +486,67 @@` compares each destination with its own source (`resumable backups NEW_BACKUPS`, `resumable saves_src NEW_SAVES`), and a tier whose pointer already names the new folder is skipped by `[ "${backups}" != "${NEW_BACKUPS}" ]` / `[ "${saves}" != "${NEW_SAVES}" ]`. A5 kills at the second `copy` and re-runs. (But see **G2-A-01**: the equality is a raw string compare.) |
| **PL-027** | **holds** | `@@ -44,9 +44,106 @@`: `list_or_stop` (0 → listed; 3/4 or `absent_not_broken` → empty; else `unreadable` exits), `has_entries`/`has_files`/`exists` all go through it; `@@ -193,6 +411,25 @@` probes the root first. A5: dead endpoint → pointers unchanged, rc≠0. |
| **PL-028** | **holds** (round-trip half unrun) | `cloud_backup @@ -1969,8 +2272,15 @@`, `cloud_restore @@ -1849,21 +2147,28 @@`: `case "${overall}" in 0\|9) overall=…SYSTEM_STATUS`. `tools/cloud-round-trip @@ -720,12 +720,22 @@` asserts `rc_sb == 0 and last_sb == "Completed."`. A6 constructs saves 9 + `copyto` failing 5. |
| **PL-030** | **holds** (script half) | `cloud_content_restore @@ -998,29 +1292,54 @@`: `set -f; read -r -a local_names <<< "$*"`, each name held to `^[A-Za-z0-9_][A-Za-z0-9._-]*$`, refused whole with exit 1; `selected_systems` in both content scripts (`@@ -351,9 +427,13 @@`, `@@ -355,9 +433,13 @@`) reads past a bad line. A7 covers `$( )`, backtick, `*`, `..`, `-rf`, `"`, `;`. The guest half (C++ quoting, `/tmp/x` absent on the guest) is not in this packet. |
| **PL-051** | **holds in part** | Acceptance: "a path with `&` round-trips" through the setup's `sed` — that test is not in this diff (cloud_setup, stream C). This packet has the script half: `conf_valid` as a grammar (`cloud_backup @@ -877,25 +978,102 @@`, identical in `cloud_restore` and the helper) and the content scripts reading `CONTENT_REMOTE`/`RCLONE_NET_OPTS` as text (`conf_get`, `cloud_content_backup @@ -97,7 +97,55 @@`). A `&` inside a double-quoted value does pass `dq()` (only backtick, mid-line backslash and a bad `$` are refused). A15 proves `$(touch …)` in `SAVES_REMOTE` runs nothing in four scripts. |
| **PL-052** | **holds** | `cloud_capture @@ -406,13 +467,16 @@`: `retire_rel` returns 1 for anything not `"${ROOT}/"*`; `@@ -422,10 +486,12 @@` unlinks `"${ROOT}/${_rel}"`, never the argument. A8 runs from a working directory holding the same relative path. |
| **PL-053** | **holds** | `relocate`: one `list_or_stop -R --files-only` into `${list}`; `copy`, `check` and `delete` all take `--files-from-raw "${list}"`. A5's `post` hook writes `LATE.srm` after the check; it survives. |
| **PL-066** | **holds** | Both content scripts (`cloud_content_backup @@ -562,20 +651,36 @@`, `cloud_content_restore @@ -1090,21 +1471,40 @@`): `GL_RC=$?` folded into `RC` by the `0\|9` rule. A9. |
| **PL-067** | **holds** | `cloud_capture @@ -192,6 +204,42 @@` `capture_lock` (fd 8, `flock -n`, 50×0.1 s), taken at `@@ -1470,6 +1552,20 @@` before the `LIVE0` check and held through rename, GC and `finish`'s stamp (`@@ -212,19 +260,32 @@`). The acceptance's "two captures serialise" is proven with a synthetic `flock` holder (A8, A42), not with two real captures — the mechanism is the same lock either way. |
| **PL-070** | **holds** | `cloud_backup @@ -642,16 +681,50 @@`: `unzip_can_test` probes once; `archive_whole` runs `unzip -t` alone when it can, `-l` only when it cannot. A10 lists the damaged zip first (proving the case is the finding's) then asserts `-t` refuses it. Residual written into the code: busybox `-t` cannot see a damaged STORED member. |
| **PL-071** | **holds** | `cloud_migrate_layout @@ -166,10 +374,18 @@`, `@@ -285,39 +555,55 @@`: `content_rc` propagated, `return "${content_rc}"` before "Done.", with `>>> why` lines under `--apply`. A5. |
| **PL-079** | **holds** | `*.fla` added to `SAVE_EXCLUDES` in both content scripts, to `content_files`' `find` predicate and to `cloud_content_filter`'s extension list (`@@ -502,11 +589,13 @@`, `@@ -446,11 +528,13 @@`, `@@ -828,18 +1108,32 @@`). A25 plans `n64\|remove\|1\|4` and keeps `Game.fla`. |
| **PL-080** | **holds** | `progress_mark` parses `Listed N` from the `Checks:` line into a fifth column; `advance_mark` loops `0 1 2 3 4`; `high="0 0 0 0 0"` (`cloud_backup @@ -211,9 +216,10 @@`, `@@ -221,8 +227,8 @@`, `@@ -244,7 +250,7 @@`; same in `cloud_restore`). A30 lifts `bounded_rclone` against a shim that lists for 8 s under a 3 s ceiling. |

---

## 2. The first audit's findings (`seats/A.findings.md`, sha `85cd4cd9…`) — is the claimed answer what the diff shows?

**Claude seat**

- **G-A-01** (automatic bare 69) — **answered.** `cloud_backup @@ -327,12 +338,40 @@`: the `AUTOMATIC` branch takes `log0` before the call and `logged_moved "${log0}" && RCLONE_MOVED=1` after; `@@ -1206,6 +1418,9 @@` reads the stderr file. Note that the stderr-site call passes the *post-run* size as its offset, so its `LOG_FILE` half can never match — it lives off the wrapper's read and the stderr file (see G2-A-08 for the residual where neither carries the lines).
- **G-A-02** (conf_get reads unreadable as `""`) — **answered** for the shapes named: `conf_get` (`cloud_content_backup @@ -97,7 +97,55 @@`) takes dq/sq/bare with a trailing comment or CR and exits 2 on anything else; `CONTENT_REMOTE=$(conf_get …) || refuse`. The first-versus-last withdrawal rests on "every ES-started saves run is `--yes`, which runs the duplicate cleanup, which keeps the first" — the `cleanup_choice` under `--yes` is outside the diff, so **cannot tell** whether a saves run ever runs with the last line while the content scripts use the first; the cleanup does keep the first (`cloud_sync_cleanup_duplicates.sh @@ -14,6 +20,8 @@`).
- **G-A-03** (`--all` fallback listings) — **answered.** `all_listing` at `@@ -1042,7 +1361,68 @@` is used for all three listings and BIOS comes from the root's own listing.
- **G-A-04** (round-trip ANSI / `run_rc`) — **answered as far as the packet reaches.** `tools/cloud-round-trip @@ -720,12 +720,22 @@` calls `last_player_line(out_sb)`; that function is outside the diff. A50 feeds the tool's reader a coloured `Completed.` and asserts `'Completed.'` — a check that would fail if the reader did not strip.
- **G-A-05** (`gaps` why with spaces) — **withdrawal cannot be judged from the packet.** The mechanism it leans on (`CloudText::parseLastRun` joining tokens after `gaps`) is not here. What is here: `record_last_run` writes every other why through `tr ' ' '_'` and the `gaps` why unconverted (`@@ -642,16 +681,50 @@`), and `es-player-text.md` (sha `c401103e…`) both says "the stamp's third field is the why sentence as one token, spaces as underscores" and lists "the stamp why `YOU WENT OFFLINE PART-WAY THROUGH` … stamped `69 gaps`". The rule contradicts itself; ES decides. See seam §5.2.
- **G-A-06** (plan epoch unread; same-count substitution) — **withdrawal holds as a residual, and the diff confirms the residual:** `@@ -636,6 +830,34 @@` only `grep -q '^plan [0-9][0-9]*$'` then `tail -n +2`; the plan holds `sys|verb|files|bytes`, no names. A file removed and another added between preview and apply is deleted unpreviewed. Also unrecorded: which systems/mode the preview ran under.
- **G-A-07** (partial marker vs content restore) — **answered** for the two writers named: `tree_record_take`/`give`, `sweep_partials` on a failed unit and a failed match sync, `*.????????.partial` excluded everywhere (`cloud_content_restore @@ -586,15 +705,90 @@`, `@@ -1064,6 +1444,7 @@`, `@@ -1090,21 +1471,40 @@`). A third writer into `SAVESPATH` — the settings restore into `SETTINGS_BACKUPS=/storage/roms/backup` — is not in the diff; **cannot tell** whether it sweeps its own folder (G2-A-07).
- **G-A-08** (root nesting warning) — **answered.** `[ -n "${SAVES_REMOTE%/}" ] || continue` skips `""` and `/` alike (`@@ -1089,22 +1288,35 @@`).
- **G-A-09** (124 wording) — **answered in part as claimed.** Shape (b): `check_internet @@ -803,11 +882,25 @@` reports a 124 probe as the ceiling. Shape (a): withdrawn as "both whys true of that moment" — holds for a genuine rclone failure near the deadline. It does not cover a **137** (GNU `timeout -k`'s KILL exit), which is neither 124 nor 10 and therefore probes with a wrapper that now returns 124 unrun and falls into the offline branch (G2-A-09; whether rclone yields to TERM within 3 s is outside the packet).
- **G-A-10** (`backend features` unbounded) — **answered.** `rclone backend features "${remote}" "${RCLONE_LIST_OPTS[@]}"` (`@@ -193,6 +411,25 @@`); A5's `grep -vE '^(listremotes|version)' | grep -v -- '--low-level-retries'` no longer excepts it. The `take_cloud_lock` `>` aside: `exec 9>"${CLOUD_SYNC_LOCK}"` truncates a file nothing is stored in; the flock is on the inode — withdrawal holds.
- **G-A-11** (config key in player text) — **answered in part as claimed:** `tier_words` (`@@ -96,26 +217,112 @@`). `unreadable`'s "Try again when you're online." still assumes offline; withdrawn with a reason ("being offline is the common case") that is a judgment, not refuted by the diff.
- **G-A-12** — **withdrawal cannot be judged:** the sentence relied on ("You may need to sign in again" in `network_lost_during_run`) is outside the hunks shown.
- **G-A-13** — **answered** with gpt G-A-08 (`moved_since` per unit, `cloud_content_backup @@ -201,11 +249,34 @@`, `@@ -562,20 +651,36 @@`).
- **G-A-14** (raw `source` after cleanup; two `SAVESPATH` readers) — **answered in part.** The re-`source` is guarded (`cloud_backup @@ -973,12 +1151,33 @@`, `cloud_restore @@ -1035,16 +1212,37 @@`: `conf_valid` after the cleanup, the pre-cleanup copy put back on failure). The "two readers of `SAVESPATH`" half is not addressed anywhere visible in the diff (`cloud_saves_root`'s `saves_path` and `cloud_capture`'s `ROOT` are outside the hunks).
- **G-A-15** — **answered.** A8's seal check is now `[ "${RC}" -eq 0 ] && [ -f seal ]`; A28's third case prints the stamp.

**GPT seat**

- **G-A-01** — **answered.** `check_clean` requires `$1 -eq 0` and `(^|[^0-9])0 differences found` (`@@ -75,11 +182,25 @@`), used by both `relocate` and `resumable`. A31 constructs exactly ten differences.
- **G-A-02** — **answered.** `set_pointer` reads the value back with `conf_value` and returns 1; `relocate` returns 2 *before* `rclone delete` (`@@ -96,26 +217,112 @@`); every caller stops on it.
- **G-A-03** — **withdrawn as a residual; the reason is supported by the packet's rule text** (`upgrade-and-install.md` sha `d79a1084…` § "The model is one player, one console at a time (D-CLOUD-102…)", rewritten 2026-09-28). The residual is real in the diff: `rclone delete --files-from-raw` removes whatever version stands at a listed name at delete time.
- **G-A-04** — **answered.** `@@ -1470,6 +1552,20 @@`: no lock → `rm TMP`, re-run once (not `--full`), else `finish 1 "lock-busy"`; `finish` writes no stamp when `LOCK_BUSY=1` (`@@ -212,19 +260,32 @@`). Note the `|| [ "${LOCK_BUSY:-0}" != 1 ]` arm is reachable only when `capture_lock` is undefined (the lifted-`finish` test), since every failure path sets `LOCK_BUSY=1` — as the comment says.
- **G-A-05** — **answered.** `conf_valid` (`@@ -877,25 +978,102 @@`) refuses a mid-line backslash, a backtick, any `$` but `$NAME`/`${NAME}`, anything after a value but blanks and `#…`, and `$(`/backtick in single quotes; `${W@P}` fails the `^\{[A-Za-z_][A-Za-z0-9_]*\}` match. A33 first proves each of the seven fixtures runs its command when sourced. See G2-A-05 for the upgrade side.
- **G-A-06** — **answered** (with the first-versus-last caveat above).
- **G-A-07** — **answered.**
- **G-A-08** — **answered.** `moved_since`, `match_count`'s `PROGRESS_MADE`; A43 covers "moved then cut" for both scripts and "moved nothing then cut" for the skip.
- **G-A-09** — **answered as the coordinator asked**: the console line and `Completed. ${REPLACED_NOT_KEPT_LINE}` (`cloud_backup @@ -727,6 +800,10 @@`, `@@ -1430,9 +1693,29 @@`). The register row that is to carry the exception is not in the packet.
- **G-A-10** — **answered.** `-name gamelist.xml` at any depth in `content_files`; `f == "gamelist.xml"` in `cloud_content_filter`; A41.
- **G-A-11** — **answered.**
- **G-A-12** — **answered.** New sentences in `relocate` (`@@ -96,26 +217,112 @@`); A37.

---

## 3. Findings of this seat

### G2-A-01: A tier whose pointer already names its destination under another spelling is copied onto itself, verified, and its files deleted
- **Severity:** High (conditional on two things outside the diff; see Evidence)
- **Category:** Deletion before its precondition is read exactly / string compare where a path compare was meant
- **Where:** `cloud_migrate_layout` `@@ -249,34 +486,67 @@` (`[ "${saves}" != "${NEW_SAVES}" ]`, `resumable`), `@@ -96,26 +217,112 @@` (`relocate`), `@@ -285,39 +555,55 @@`
- **What:** The PL-026 guards that skip a landed tier compare the conf's raw string with the constant (`/ROCKNIX/Saves`). `SAVES_REMOTE="/ROCKNIX/Saves/"` (trailing slash) or `"ROCKNIX/Saves"` (no leading slash) is not equal, so the tier is treated as unmoved: `has_files qa:/ROCKNIX/Saves//` is true, `exists qa:/ROCKNIX/Saves` is true, `resumable` runs `rclone check dst src --one-way` on a folder against itself and is clean, so nothing is refused; `relocate qa:/ROCKNIX/Saves/ qa:/ROCKNIX/Saves` then lists the folder, runs `rclone copy` with source and destination the same root, `rclone check` (clean), `set_pointer` (succeeds), and `rclone delete "${src}" --files-from-raw "${list}"` — the whole saves folder.
- **Failure scenario:** a conf written with a trailing slash by a hand edit or an older setup, TIDY UP YOUR CLOUD FOLDERS pressed: the page says "Now using /ROCKNIX/Saves for your saves." and every save in the cloud is gone.
- **Evidence:** the raw compares are the only gate between the two folders being the same; `relocate` has no `src == dst` refusal. Two things I could not read: (1) rclone's behaviour for `copy X X` — to my knowledge it logs "Nothing to do as source and destination are the same" and exits 0, which is what makes the chain complete; (2) the unshown lines of `main` between `backups=$(conf_value …)` and the nested loop, which may short-circuit an already-current layout — if they compare the same raw strings they do not help. The base script had the same shape with `rclone purge`, so this is not introduced by the fix, but the fix added the guards that were meant to close it and they read strings, not paths. A normalising compare (`${x%/}`, a leading slash) and a `relocate` that refuses equal roots after normalisation would close it; harness A5 has no case with a differently-spelled landed pointer.

### G2-A-02: A run cut between the saves pointer landing and the content move orphans the content folder for good
- **Severity:** Medium
- **Category:** Migration not resumable at every cut point
- **Where:** `cloud_migrate_layout` `@@ -285,39 +555,55 @@` (`[ "${content}" = "$(derived_content "${saves}")" ]`)
- **What:** `migrate_content` runs only when `CONTENT_REMOTE` equals what the helper would derive from the *current* `SAVES_REMOTE`. PL-026 now writes `SAVES_REMOTE=/ROCKNIX/Saves` as the saves land, before the content moves. A cut after that write (the saves delete, the `rmdirs`, the seconds between) leaves `CONTENT_REMOTE=/GAMES/Content`; the next run derives `/ROCKNIX/Content` from `/ROCKNIX/Saves`, sees no match, and says "Leaving CONTENT_REMOTE at /GAMES/Content -- it is not a path this migration set." The ROMs stay under the old root and the tidy reports Done.
- **Failure scenario:** kill at the third `copy` (content) instead of A5's second; re-run: rc 0, content untouched, pointer untouched.
- **Evidence:** the compare uses `saves` read at run start; `derived_content` is outside the diff but is documented in the hunk as `<parent>/Content` of the saves folder. The base had the same window (pointers were written before `migrate_content` too), but PL-026 widened it to include the saves delete and `rmdirs`. A5's kill case is `^copy` nth 2 only. Comparing `content` against the derivation from the *original* saves folder as well would close it.

### G2-A-03: One run, two words — the card reads SKIPPED (exit 69) while the row reads COULDN'T FINISH (`69 gaps`)
- **Severity:** Medium
- **Category:** Outcome vocabulary / least surprise across two surfaces
- **Where:** `cloud_backup` `@@ -642,16 +681,50 @@` (`record_last_run`), `@@ -862,6 +955,14 @@` (`clean_exit "${EXIT_NO_NETWORK}"`); `cloud_content_backup @@ -201,11 +249,34 @@`; `cloud_content_restore @@ -207,12 +257,40 @@`
- **What:** The fix keeps the exit at 69 ("the exit stays 69") and changes only the stamp. `es-player-text.md` § Outcome vocabulary maps 69 to `SKIPPED - YOU'RE NOT ONLINE` on the card and the page; the row is the only reader of the stamp. So the automatic sync's card (ThreadedCloudSync reads the exit) says SKIPPED at the moment, and the row under the toggle says COULDN'T FINISH, YOU WENT OFFLINE PART-WAY THROUGH afterwards, for the same run that moved files. The rule says a run "passes or fails" and the same run must read the same on every surface.
- **Failure scenario:** game exit, saves go up, link drops mid-phase: card `SKIPPED - YOU'RE NOT ONLINE`; later, GAME SETTINGS row `COULDN'T FINISH, YOU WENT OFFLINE PART-WAY THROUGH`.
- **Evidence:** no `>>> why` is printed on the 69 path in the hunks shown; ES's readers are outside the packet, but the rule's table is in it and maps 69 → SKIPPED unconditionally. Whether `parseLastRun` reads `gaps` first is the stream's claim (see §5.2).

### G2-A-04: Two why sentences the scripts print are outside the vocabulary register in the packet, and one registered sentence is reused for a different failure
- **Severity:** Medium
- **Category:** Player-visible word outside the outcome vocabulary
- **Where:** `cloud_content_restore @@ -636,6 +830,34 @@` (`say_why "CHECK WHAT WOULD CHANGE FIRST"`); `cloud_migrate_layout @@ -96,26 +217,112 @@` (`>>> why YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED`), `@@ -166,10 +374,18 @@` (`>>> why SOME FILES DIDN'T FINISH` for any content-move failure)
- **What:** `es-player-text.md` (sha `c401103e…`) lists the #307 additions — `SOMETHING CHANGED SINCE YOU CHECKED`, `COULDN'T RECORD WHICH CARD YOUR SAVES ARE ON`, `THE NEW FOLDER ALREADY HAS FILES IN IT`, `YOU WENT OFFLINE PART-WAY THROUGH` — and not `CHECK WHAT WOULD CHANGE FIRST` or `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED`. The report itself says ES's `whySentences()`/`CloudTextTests` table must gain them or the card shows English and the emitter test fails. `SOME FILES DIDN'T FINISH` is registered "for rclone 6" and is printed here for a copy that failed for any reason.
- **Failure scenario:** the tidy's pointer write fails on a French device: the card shows an untranslated sentence; `CloudTextTests`' emitter table fails on the new why.
- **Evidence:** the rule file's list is in the packet; the ES side is not. This is the seam the report flags as "proposed"; it is recorded here so it is not lost.

### G2-A-05: The stricter `conf_valid` has no answer for confs the old validator accepted
- **Severity:** Medium
- **Category:** Upgrade — "Already written" not answered (`upgrade-and-install.md` § Every fix answers what was already written)
- **Where:** `cloud_backup @@ -877,25 +978,102 @@`, the same in `cloud_restore` and `cloud_sync_helper @@ -98,43 +127,157 @@`
- **What:** The grammar refuses shapes bash accepts and the previous `conf_valid` passed: an escaped quote in a double-quoted value (`--exclude \"*.tmp\"`), a double-quoted value continued onto a second line without a trailing backslash, an indented or `export`ed assignment, a `$1`/`$$`/`$@`. A device with such a conf is refused on every run after the upgrade; the fallback `.bak` was taken by the old helper from the same file, so it is refused too; the helper's `update_cloud_sync_config` returns 1 on it and never repairs it. The report's G-A-05 row lists five hand-edit shapes that still pass and no line for the shapes that stop passing.
- **Failure scenario:** `RCLONEOPTS="--progress --exclude \"*.bak\""` on an upgraded handheld: every sync ends YOUR CLOUD SYNC SETTINGS COULDN'T BE READ until the player sets up cloud storage again (whether setup rewrites the whole file is outside the packet).
- **Evidence:** `dq()`: `if (c == "\\") { if (i == n) return 0; bad() }`; `if (!match(s, /^[A-Za-z_][A-Za-z0-9_]*=/)) bad()`. The refusal is the right side to err on for the security half; the missing piece is the `Already written:` line and a repair path.

### G2-A-06: The commit lock is held for the whole `--full` tail, not "milliseconds", and an exit capture that loses twice records nothing
- **Severity:** Medium
- **Category:** Time to play / lock hold time vs the waiter's bound
- **Where:** `cloud_capture @@ -1470,6 +1552,20 @@` (lock taken), `@@ -1508,11 +1605,21 @@` (GC under it), `@@ -212,19 +260,32 @@` (`finish` under it); no `capture_unlock` between rename and exit
- **What:** The header says a commit "holds it for milliseconds". After the rename the same process walks `"${STAGE}"/*` with a `stat -c %Z` per seal, runs `du -sk`, and writes the stamp, all still holding fd 8. On a stage of thousands of seals on a slow card that is seconds. The synchronous exit capture waits 5 s, re-execs (re-sealing every member), waits 5 s more, then `finish 1 "lock-busy"` with no stamp and no record of the session's saves — up to ~10 s added to the game-exit path plus a re-seal, and D-UI-093's "COULDN'T RECORD THIS SESSION'S SAVES" toast over a boot `--full` that is merely slow.
- **Failure scenario:** boot `--full` on a device with a large stage; the first game exits within its GC window.
- **Evidence:** A8 and A42 use holders of 4 s and 25 s, not a `--full` over a large stage, so the hold time is unmeasured. Releasing the lock after the stamp and before the GC, or bounding the GC's walk, would narrow it; whether the GC can run outside the lock without re-opening PL-067 (a seal another capture just placed) is a design question — the ten-minute ctime sparing already protects that case.

### G2-A-07: The `restore-tree-clean` record's "tree" property is not maintained by the settings-phase restore
- **Severity:** Low
- **Category:** Marker whose writers disagree on its property
- **Where:** `cloud_restore @@ -1266,16 +1469,42 @@` (`PARTIALS_CLEAN` "the tree under it holds no leftover"), `@@ -1486,9 +1756,13 @@`
- **What:** The marker is taken down only around the saves transfer (and, since G-A-07, the content restore and match). `restore_system_files` downloads the archive into `SETTINGS_BACKUPS`, which is `/storage/roms/backup` — under `SAVESPATH`. A `--system-only` restore cut mid-download can leave `backup/<archive>.<8>.partial` with the record still saying clean, so the next saves restore does not walk.
- **Failure scenario:** as stated; the leftover is then excluded from the content transfers by the new `*.????????.partial` exclude, so it is inert rather than uploaded — which is why this is Low.
- **Evidence:** the settings-phase code is not in the diff; the old comment said `sweep_partials` was "called after each phase's transfer", and I cannot see whether the settings phase still sweeps its own folder unconditionally. Cannot tell; recorded for one visit to `restore_system_files`.

### G2-A-08: The moved-file signal for RCLONE_MOVED has a hole when neither the trace nor LOG_FILE nor stderr carries rclone's lines
- **Severity:** Low
- **Category:** Guard weaker than its comment
- **Where:** `cloud_backup @@ -1206,6 +1418,9 @@` (`logged_moved "$(stat -c %s "${LOG_FILE}" …)" "$stderr_file"`), `@@ -319,6 +325,11 @@`
- **What:** At the stderr site the offset is the *current* size, so `[ "${now}" -gt "$1" ]` is false and only the stderr file is read — by design. The deliberate run's signal is then `bounded_rclone`'s trace (needs `--progress` on stdout) or stderr (needs no `--log-file`). A player whose `RCLONEOPTS` names a `--log-file` other than `/var/log/cloud_sync.log`, or drops `--progress`, gets a bare 69 over saves that went up — the F-CS-24 shape again for that configuration. Also, the "Nowhere to trace through" fallback in `bounded_rclone` never sets `RCLONE_MOVED`.
- **Evidence:** the three sources and their conditions are all in the hunks; none covers a foreign log file.

### G2-A-09: `timeout -k 3`'s KILL exit (137) is a third ceiling shape the 124/10 exemption does not cover
- **Severity:** Low
- **Category:** Wording of a bounded failure (F-CS-34 / claude G-A-09 residual)
- **Where:** `cloud_backup @@ -327,12 +338,40 @@` (`command timeout -k 3 "${left}" rclone …`), `@@ -862,6 +955,14 @@`
- **What:** GNU `timeout` documents 137 when it had to send KILL. An rclone that does not exit on TERM within 3 s returns 137 to `network_lost_during_run`, which is not 124/10, so it probes `rclone lsd` through the wrapper — now past the deadline, so 124 unrun — and falls through to the offline branch (`EXIT_NO_NETWORK`). The true cause is the ceiling.
- **Evidence:** the exemption lists exactly `124` and `10`. Whether rclone yields to TERM within 3 s is outside the packet; the withdrawal's "both whys true of that moment" does not describe this case.

### G2-A-10: `check_clean` accepts a check that compared sizes only ("N hashes could not be checked")
- **Severity:** Low
- **Category:** Verification exactness
- **Where:** `cloud_migrate_layout @@ -75,11 +182,25 @@`, `@@ -193,6 +411,25 @@`
- **What:** `--download` is chosen per remote from `backend features`; a remote that advertises hashes but lacks one for a given object (an S3 multipart object written by another tool) makes `rclone check` fall back to size and still print `0 differences found` with exit 0. `check_clean` reads that as verified and the source is deleted.
- **Evidence:** the regex and the exit test only; no test for the "hashes could not be checked" notice. Low because the migration verifies files rclone itself uploaded, which carry their MD5 as metadata on S3.

### G2-A-11: The managed-rules identity test compares a canonical path with a literal
- **Severity:** Low
- **Category:** Guard weaker than intended
- **Where:** `cloud_backup @@ -1345,6 +1572,42 @@`, `cloud_restore` `@@ -1436,6 +1665,42 @@`
- **What:** `readlink -f "${named}"` is compared with the literal `/storage/.config/cloud_sync-rules.txt`. If `/storage/.config` were itself reached through a symlink, the managed file would resolve elsewhere and be treated as the player's own — unchecked. On the image `/storage/.config` is a real directory, so this is a hardening note: canonicalise both sides.

### G2-A-12: `--all` under `--media-only` says the cloud has "no ROMs or BIOS files" when it has BIOS
- **Severity:** Low
- **Category:** Player text truthfulness
- **Where:** `cloud_content_restore @@ -1042,7 +1361,68 @@`
- **What:** BIOS is (rightly) not added under game content alone; with no systems listed the sentence "Nothing to restore: your cloud has no ROMs or BIOS files yet." is printed and stamped completed although BIOS exists. Under that mode the true sentence is about game content.

### G2-A-13: Two `Already written:` answers name states with no recovery
- **Severity:** Low (recorded so the orchestrator can decide)
- **Category:** Upgrade — honest but open
- **Where:** `seats/A.report.md` PL-025 ("keeps `Saves/backup` and `Saves/Content`… not moved back") and PL-027 ("a device an earlier build repointed with nothing copied is **not** detected")
- **What:** A cloud the earlier migration tidied has its ROMs under `Saves/Content/…` and `CONTENT_REMOTE` at an empty `/ROCKNIX/Content`; the content pages show an empty cloud and nothing in the diff moves them. A device the earlier PL-027 bug repointed is syncing to an empty folder with its saves orphaned under the old root; the next `--check` sees the current layout and offers nothing. Both are stated plainly in the report; neither has a mechanism.

### G2-A-14: The `>>> unit` count of `--all` changes shape with no reader named
- **Severity:** Low
- **Category:** Seam / stale test
- **Where:** `cloud_content_restore @@ -1042,7 +1361,68 @@`; report: "`CloudTextTests`' protocol table still cites `>>> unit everything`"
- **What:** `--all` now announces one unit per system plus `bios`. The page's counter (D-UI-024) handles N units; the ES unit test table names the old single unit. Outside the packet; recorded as a seam to close on the ES side.

---

## 4. Sweep rows (`seats/A.report.md`, sha `32172a2d…`)

Spot-checked against the diff (eight):

1. **claude F-CS-04** — `pause()` `[ "${ASSUME_YES}" -eq 1 ] || sleep`, every `sleep` in `cloud_restore`'s paths replaced (`@@ -325,6 +369,16 @@`, `@@ -1817,6 +2113,7 @@` etc.), `first_remote` from `rclone.conf`, `check_internet` only under `SYSTEM_ONLY`, `SAVES_OUTCOME`/`SETTINGS_OUTCOME` in the summary. **Present.**
2. **claude F-CS-08** — `PARTIALS_CLEAN` taken down before, sweep only when it was absent or the transfer failed, written back after (`@@ -1470,14 +1735,19 @@`, `@@ -1486,9 +1756,13 @@`). **Present** (G2-A-07 caveat).
3. **claude F-CS-18** — `cmp -s "${rules}.new" "${rules}"` and `cmp -s "${work}" "${conf}"` before any rename or `.bak`; `--verbose` `sed -i` gated on `grep -qE -- '--verbose|-v '` (`cloud_sync_helper @@ -98,43 +127,157 @@`, `@@ -303,12 +459,22 @@`, `@@ -353,7 +519,10 @@`). **Present.**
4. **claude F-CS-20** — `timeout -s KILL 2 timedatectl` (`cloud_capture @@ -734,8 +804,14 @@`). **Present.**
5. **claude F-CS-25** — `case "${SAVES_REMOTE}" in ""|"/") replaced_root=""` and the prune guarded by `[ -n "${replaced_root}" ]` (`cloud_backup @@ -1430,9 +1693,29 @@`, `@@ -1474,8 +1765,8 @@`). **Present.**
6. **gpt F-CS-20** — `write_record` returns 0/1, `record … --no-write`, callers record only on 0|9 and `--no-write` otherwise (`cloud_saves_root @@ -82,11 +87,18 @@`, `@@ -153,18 +165,36 @@`; `cloud_backup @@ -1457,10 +1740,18 @@`). **Present.**
7. **gpt F-CS-30** — `cloud_content_filter` rewritten (save folders at any depth incl. `shared/savefiles`, root README only, partials), `--exclude "/README.txt"` on both transfers, BIOS listing drops only `^[0-9]*|README\.txt$` (`cloud_content_restore @@ -828,18 +1108,32 @@`, `@@ -904,7 +1198,7 @@`). **Present.**
8. **gpt F-CS-34 (in part)** — `if [ "${left}" -lt 1 ]; then … return 124` and `load_config` before `check_internet` in both scripts (`cloud_backup @@ -327,12 +338,40 @@`, `@@ -1924,10 +2225,12 @@`). **Present as described**; the content-transfer ceiling is open, as the report says.

Withdrawn rows judgeable from the packet: **claude G-A-06** (residual confirmed in the diff — above); **gpt G-A-03** (the rewritten D-CLOUD-102 text is in `upgrade-and-install.md`); **claude G-A-10's `>` aside** (holds). Not judgeable here: **claude F-CS-12** (D-CLOUD-042), **gpt F-CS-28** (D-CLOUD-072/136), **claude F-CS-22** (D-CLOUD-079), **claude G-A-05** (ES's parser), **claude G-A-12** (the sign-in sentence) — none of those artefacts is in the packet. **claude F-CS-27** (package.mk) — correctly not this stream's file.

Report accuracy notes: the report's PL-067 section says "After [5 s] the capture falls back to the old detection alone" — that describes the *first* delivery; the follow-up (`b251bf6021`, `@@ -1470,6 +1552,20 @@`) reverses it and the later table says so. A reader who stops at the first section gets the wrong mechanism. The `--all` "empty cloud gave rc 3" behaviour change to rc 0 is a decision the report names; the acceptance text does not cover it.

---

## 5. Seams

1. **Outcome words read by the interface.** The scripts now print `CHECK WHAT WOULD CHANGE FIRST`, `YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED`, `SOMETHING CHANGED SINCE YOU CHECKED`, `COULDN'T RECORD WHICH CARD YOUR SAVES ARE ON`, `THE NEW FOLDER ALREADY HAS FILES IN IT`. The rule file in the packet registers the last three and not the first two (G2-A-04). `Completed. Your saves folder is your cloud's top folder, …` is a two-sentence outcome line; the report says the LINK gate accepts it — the gate is outside the packet. ES's TRY AGAIN for a match: the rule file (§ Recover) already says the page offers none and points at the row (D-CLOUD-141), while the report says E2's TRY AGAIN still re-runs `--match --apply` — the two statements cannot both be current; one visit to `GuiCloudTransfer` settles it.
2. **The stamp and its readers.** The scripts write `<epoch> 69 gaps YOU WENT OFFLINE PART-WAY THROUGH` (spaces) and, for every other why, one underscored token. The row's reader (`parseLastRun`) must read `gaps` before the code and join the tail; the card reads the exit (69 → SKIPPED). The diff keeps both sides' inputs unchanged except the stamp, so the surfaces disagree for the same run (G2-A-03).
3. **The match plan contract.** Preview writes `/storage/.cache/cloud_sync/content-match-plan`; apply spends it. ES must run `--match` before every `--match --apply`, including on retry. The round-trip was changed to do so (`@@ -1478,11 +1522,17 @@`); the ES page is outside the packet.
4. **The `>>> unit` protocol.** `--all` now emits one unit per system plus `bios`; `--selected` unchanged; the ES unit-test table cites `>>> unit everything` (G2-A-14).
5. **`cloud_capture` exit codes.** `--adopt` now returns 3 for "not a member"; its caller (the save-state manager) must read 3 as "not recorded", not as rclone's not-found — capture is not rclone, but the reader is outside the packet.
6. **The transfer lock.** `cloud_migrate_layout --apply` now takes `/var/run/cloud_sync.lock` and exits 75 with the same skip sentence the other scripts use; ES's tidy page must treat 75 as the others do. `cloud_capture` still never takes it (its own `.capture.lock` is separate) — consistent with the rclone rule.
7. **The `restore-tree-clean` record** is shared by `cloud_restore` (writer/reader) and `cloud_content_restore` (take/give): same path, same semantics in both hunks. The settings phase is the unaccounted third writer (G2-A-07).
8. **The shared harness.** The A block is one appended hunk relying on `check`, `src_of`, `RCLONE_REL`, `BB`/`BB_HOST`, `TMP`, `ROOT` from the file's head (outside the hunk). Its sandbox binds the host's `/usr`; A47/A48 overlay `/usr/bin` for the cleanup script — other cases that reach `/usr/bin/cloud_sync_cleanup_duplicates.sh` (a `--yes` run over a conf with duplicates) would fail with "command not found" in this sandbox; none of the fixtures has duplicates except A47/A48, so the block does not hit it.
9. **`cloud_sync.conf` shipped vs on device.** Removing `--delete-excluded` from `RCLONEOPTS` reaches only fresh installs (the helper appends missing keys, never edits present ones); upgraded devices keep the flag and rely on the strip in both scripts — the strip in `cloud_backup` is outside the diff and asserted by the rule file and the F-CS-17 finding text, not by a hunk here.

---

## 6. Coverage boundary

Outside the diff and therefore not judged: every ES reader (`parseLastRun`, `whySentences`, `GuiCloudTransfer`, `ThreadedCloudSync`, the picker's handling of a `--set-systems` refusal); `tools/cloud-round-trip`'s `last_player_line`, `run_rc`, `unit_protocol` and the variables the new step uses; in the scripts, `record_outcome`, `resolve_src`/`remote_for`, `legacy_dirs`, `supported_systems`, `METADATA_EXCLUDES`, `derived_content`, `old_root` and the unshown lines of `cloud_migrate_layout`'s `main`, `why_for`, `network_gone`, `check_network_link`, `clean_exit`, the pre-existing `conf_valid` call sites and `.bak` fallback in `load_config`, the `cleanup_choice` under `--yes`, `E_UNIT`'s population in `cloud_capture`, `restore_system_files`' own sweep, the strip of `--delete-excluded` in `cloud_backup`. Runtime behaviours relied on but not in the packet: rclone's same-root `copy`, `rclone check`'s "hashes could not be checked" path, whether rclone yields to SIGTERM within `timeout -k 3`'s grace, busybox `unzip -t`'s CRC behaviour (the stream measured it), busybox `readlink -f` on a missing path. Register rows the report cites (D-CLOUD-042, -072, -079, -102, -136, -141, -142, -143; the pending root-`--backup-dir` exception row) — only D-CLOUD-102's text appears in the packet, in `upgrade-and-install.md`. Nothing here ran on a VM or a device; the two round-trip additions are unrun, as the report says.
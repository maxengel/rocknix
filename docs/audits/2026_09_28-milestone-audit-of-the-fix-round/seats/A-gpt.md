# Packet A — second audit

**Disposition: not cleared for the release candidate.** Most named acceptance mechanisms are present, but two High-severity defects remain in the follow-up guards:

1. `conf_valid` still accepts a configuration line that executes a command when sourced.
2. Failure while making the pre-cleanup safety copy can replace the valid configuration with that failed, partial copy.

I also found wrong-destination, plan-consumption, timeout-reporting, and marker problems below.

This is a **static review of the eight embedded sources**. I did not access files, recalculate hashes, or run tests. The report’s PASS counts remain the stream’s claims; I inspected the supplied test code.

## Evidence notation

- **[D]** `A.diff`
- **[R]** `A.report.md`
- **[F]** `A.findings.md`
- **[I]** `A.items.md`
- **[E]** `engineering-practices.md`
- **[U]** `upgrade-and-install.md`
- **[T]** `es-player-text.md`
- **[C]** `rclone-cloud-sync.md`

These abbreviations identify the **declared paths and facilitator-verified hashes** recorded in `corpus.provenance.json` below.

Within [D], script basenames refer to `projects/ROCKNIX/packages/network/rclone/sources/`. Hunk coordinates are those printed in the supplied diff. Tests A1–A50 are in `tools/last-good-scripts-test`, hunk `@@ -3011,4 +3011,1615 @@`.

---

## 1. Punch-item verdicts

“**Holds**” here means the diff contains the mechanism required by the named acceptance criterion—not that I independently observed its runtime result.

| Item | Verdict | Mechanism and evidence |
|---|---|---|
| **PL-001** | **holds for the stated listing, verb, and count criteria** | `match_plan_one` captures `lrc` separately from listing contents and emits `fail` when absence cannot be established. Apply rejects a changed verb or increased count, then sets `files="${pfiles}"` for `--max-delete`. [D, `cloud_content_restore`, `@@ -556,24 +641,58 @@`, `@@ -660,22 +882,62 @@`; A1.] The separate one-use-plan defect is G2-A-04. |
| **PL-012** | **holds** | `--all` enumerates systems and explicitly adds `bios` when the content-root listing contains `BIOS/`. The transfer loop operates per directory. The round-trip addition asserts the BIOS file’s hash and its unit announcement. [D, `cloud_content_restore`, `@@ -1042,7 +1361,68 @@`; `tools/cloud-round-trip`, `@@ -1202,6 +1214,38 @@`; A2.] The journey/VM execution is not supplied. |
| **PL-015** | **cannot tell from the packet** | The acceptance concerns `cloud_setup --set-saves-remote /` and its derived paths. That setter is not in [D]. The visible helper change avoids deriving `/GAMES/Content` for a top-level saves folder; the backup warns about existing nesting. Those do not establish the setter’s acceptance. [D, `cloud_sync_helper`, `@@ -287,13 +428,28 @@`; `cloud_backup`, `@@ -1089,22 +1288,35 @@`; A14.] |
| **PL-020** | **holds** | `rules_whole` uses an exact catch-all line. A candidate whose build failed or lacks that line is removed rather than installed. Both saves consumers refuse an incomplete managed allowlist. The player’s separately named filter remains theirs. [D, `cloud_sync_helper`, `@@ -98,43 +127,157 @@`; `cloud_backup`, `@@ -1345,6 +1572,42 @@`; `cloud_restore`, `@@ -1436,6 +1665,42 @@`; A3/A34.] |
| **PL-021** | **holds** | Remote and local pruning pin the current run’s folder by name. Settings retention excludes `uploaded_names` from the candidates removed and subtracts their count from the remaining allowance. [D, `cloud_backup`, `@@ -1220,13 +1435,25 @@`, `@@ -1902,7 +2194,16 @@`; `cloud_restore`, `@@ -1266,16 +1469,42 @@`; A4.] |
| **PL-025** | **holds for the seeded migration** | Root-anchored backup exclusions and dynamically nested-tier exclusions travel into the saves relocation. Backups move first. [D, `cloud_migrate_layout`, `@@ -55,11 +152,21 @@`, `@@ -249,34 +486,67 @@`, `@@ -285,39 +555,55 @@`; A5.] This does not repair already-misplaced `Saves/backup` or `Saves/Content`; see the upgrade boundary below. |
| **PL-026** | **holds for interruption between moves** | `relocate` verifies, writes and reads back that tier’s pointer, and only then deletes the source files. Main skips tiers whose pointer already names the destination and compares backups against their own source. [D, `cloud_migrate_layout`, `@@ -96,26 +217,112 @@`, `@@ -249,34 +486,67 @@`, `@@ -285,39 +555,55 @@`; A5/A32.] Failed verification followed by retry remains a separately acknowledged limitation. |
| **PL-027** | **holds** | `list_or_stop` distinguishes absence from an unreadable listing; `unreadable` exits. Main also refuses to proceed when the root reachability probe fails. [D, `cloud_migrate_layout`, `@@ -44,9 +44,106 @@`, `@@ -193,6 +411,25 @@`; A5.] |
| **PL-028** | **holds** | Both overall-result aggregators now replace a saves result of `0` **or `9`** with the settings result. The round-trip checks the settings backup’s exit and final outcome. [D, `cloud_backup`, `@@ -1969,8 +2272,15 @@`; `cloud_restore`, `@@ -1849,21 +2147,28 @@`; `tools/cloud-round-trip`, `@@ -720,12 +720,22 @@`; A6/A50.] |
| **PL-030** | **holds in part** | The script rejects names outside its system-name grammar and filters inherited invalid selection lines. A7 includes command-substitution and glob inputs. The cloud-picker-to-shell C++ path and the required guest observation are absent. [D, `cloud_content_restore`, `@@ -998,29 +1292,54 @@`; both `selected_systems` changes; A7.] |
| **PL-051** | **cannot tell from the packet for the stated `&` round-trip** | The path-writing setter and an exposed `&` round-trip fixture are not supplied. Reading configurations without executing them is a related mechanism, not the stated acceptance. Moreover, its saves-side validator still has G2-A-01. [I; D, the three `conf_valid` changes and A15/A33/A39.] |
| **PL-052** | **holds** | `retire_rel` now rejects every argument not starting with `"${ROOT}/"`, and accepted unlink paths are rebuilt from the relative result. [D, `cloud_capture`, `@@ -406,13 +467,16 @@`, `@@ -422,10 +486,12 @@`; A8.] This is a lexical-path result, not proof of symlink containment. |
| **PL-053** | **holds for a newly added filename** | One listing becomes a `--files-from-raw` input shared by copy, check, and delete. A name added after that listing is not deleted; `rmdirs` removes only empty directories. [D, `cloud_migrate_layout`, `@@ -96,26 +217,112 @@`; A5.] Same-name concurrent replacement remains outside the expressly stated one-console model. |
| **PL-066** | **holds** | Both content scripts capture `GL_RC` and replace an otherwise successful unit result with the game-list failure. The former `|| true` is gone. [D, `cloud_content_backup`, `@@ -562,20 +651,36 @@`; `cloud_content_restore`, `@@ -1090,21 +1471,40 @@`; A9.] |
| **PL-067** | **holds for commit exclusion** | The commit path must acquire the capture lock before the live-manifest check. Failure discards the candidate and retries once or fails; it no longer commits unlocked. [D, `cloud_capture`, `@@ -192,6 +204,42 @@`, `@@ -1470,6 +1552,20 @@`; A8/A42.] The fixtures use an external lock holder, not two complete competing captures. |
| **PL-070** | **holds for the demonstrated damaged deflated ZIP** | A failed supported `unzip -t` is no longer rescued by a successful listing. A10 constructs a damaged compressed stream whose directory still lists. [D, `cloud_backup`, `@@ -642,16 +681,50 @@`; A10.] The documented STORED-member/CRC limitation means this is not a universal integrity guarantee. |
| **PL-071** | **holds** | Main captures `migrate_content`’s failure in `content_rc` and returns it instead of announcing overall completion. [D, `cloud_migrate_layout`, `@@ -285,39 +555,55 @@`; A5.] |
| **PL-079** | **holds** | `.fla` is added to both transfer exclusion arrays, local content counting, and cloud-side counting. Match uses those save exclusions. A25 asserts that the ROM is removed and the flash save survives. [D, `cloud_content_backup`, `@@ -502,11 +589,13 @@`; `cloud_content_restore`, `@@ -446,11 +528,13 @@`, `cloud_content_filter` change; A25.] |
| **PL-080** | **holds in part as worded** | `Listed N` is now a fifth progress dimension and A30 exercises a growing listing beyond a short stall bound. However, A30 invokes `bounded_rclone` directly: it proves the **deliberate** stall ceiling, not the item’s stated automatic-run behavior. The automatic branch still uses its elapsed-time deadline. [D, both `progress_mark`/`advance_mark` changes; A30; C, “Both runs are bounded”.] |

---

## 2. Review of every first-audit finding

### Claude findings

| Finding | Verdict on the claimed answer | Evidence / qualification |
|---|---|---|
| **G-A-01** | **answered** | Both automatic wrappers inspect newly appended moved-file log lines; `execute_rclone_with_error_handling` also checks captured stderr. A44 includes an automatic transfer followed by network loss and a no-change counterpart. [D, both `rclone()` / `logged_moved` additions; A44.] |
| **G-A-02** | **answered in part** | Trailing comments, quoted values, and malformed suffixes receive explicit handling. But valid shell assignments with indentation or `export` disappear as “absent,” producing the root: G2-A-03. The first-value rationale is also narrower than all supported execution paths: the visible saves code retains a “No or cancelled” duplicate-cleanup branch. [D, both `conf_get` additions; A39; saves `load_config` cleanup hunks.] |
| **G-A-03** | **answered** | `all_listing` now checks each relevant enumeration, including the flat and legacy roots; BIOS comes from the checked content-root listing. [D, `cloud_content_restore`, `@@ -1042,7 +1361,68 @@`; A40.] |
| **G-A-04** | **answered in part** | The assertion now delegates to `last_player_line`, and A50 exercises the helper with plain and colored output. The helper’s implementation and an actual guest run are not embedded, so the color-handling/runtime claim cannot be independently completed here. [D, `tools/cloud-round-trip`, `@@ -720,12 +720,22 @@`; A50.] |
| **G-A-05** | **answered in part; withdrawal not independently verified** | The scripts visibly emit space-separated `69 gaps ...`. [T] recognizes the `gaps` protocol, but the claimed `parseLastRun` implementation and its unit test are supplied only as quotations in [R], not as reader artifacts. The format agreement is an ES seam still to verify. |
| **G-A-06** | **answered in part** | The diff indeed implements a verb/count contract, not a per-filename contract; the timestamp remains unread. Treating same-count substitutions as an explicit residual is consistent with that implementation. But the “apply spends its plan” premise is not unconditional: G2-A-04. ES’s “just shown” behavior is outside this packet. [D, match-plan helpers and apply gate.] |
| **G-A-07** | **answered in part** | Content restore and match now participate in the marker, and partials are excluded from counts/transfers. That closes the demonstrated cut-content-run path. It does not establish that a completed sweep succeeded before certifying the tree: G2-A-06. [D, `tree_record_take/give`, `sweep_partials`, partial exclusions; A49.] |
| **G-A-08** | **answered** | `[ -n "${SAVES_REMOTE%/}" ]` suppresses nesting warnings for both `""` and `/`. [D, `cloud_backup`, `@@ -1089,22 +1288,35 @@`; A46.] |
| **G-A-09** | **answered in part** | A timed-out `lsd` probe gets the ceiling wording. A timed-out or refused-to-start `listremotes` still loses its status and falls through to the old explanation: G2-A-05. A45 hangs only `lsd`. [D, both `check_internet` changes; A45.] |
| **G-A-10** | **answered** | The backend-features query now receives `RCLONE_LIST_OPTS`; A5 no longer exempts it and A38 checks its arguments. The lock-file truncation aside identifies no stored payload damaged by `>`. [D, `cloud_migrate_layout`, `@@ -193,6 +411,25 @@`; A5/A38.] |
| **G-A-11** | **answered in part; withdrawal does not hold for the recovery-text half** | `tier_words` fixes the config-key wording. But `list_or_stop` sends online access/refusal failures to `unreadable`, which still says “Try again when you’re online.” A successful root probe followed by a denied tier listing is a concrete counterexample to that recovery advice. “Common case” does not establish that the advice fits the other admitted failures. [D, `list_or_stop`, `unreadable`, `tier_words`.] |
| **G-A-12** | **answered in part** | Backup/restore main paths visibly agree about the settings-only reachability probe. The claimed retained “You may need to sign in again” sentence in the saves failure path is outside the displayed function context. The structural withdrawal is supported; that wording claim is not independently established. [D, both `main()` changes; R, follow-up withdrawal.] |
| **G-A-13** | **answered** | Progress is based on actual moved-file log lines rather than a completed unit. A43 includes content backup, partial progress within a failed unit, and a no-op first unit. [D, both `moved_since` additions and unit-loop calls; A43.] |
| **G-A-14** | **answered in part** | The rewritten configuration is checked before re-sourcing. However, the new recovery branch can install a failed safety copy: G2-A-02; the validator also has G2-A-01. The two additional `SAVESPATH` reader implementations mentioned in the original finding are not exposed sufficiently to close that part. [D, both duplicate-cleanup hunks; A47.] |
| **G-A-15** | **answered** | A8 now requires `RC=0` on the seal-survival capture; the fixture changes the state before that capture. The A28 command format is explicit. [D, A8/A28.] |

### GPT findings

| Finding | Verdict on the claimed answer | Evidence / qualification |
|---|---|---|
| **G-A-01** | **answered** | `check_clean` first requires exit 0, then searches for zero differences with a non-digit/start boundary. Both verification callers use it. The ten-difference case can no longer pass by substring alone. [D, `cloud_migrate_layout`, `@@ -75,11 +182,25 @@`, `relocate`, `resumable`; A31.] |
| **G-A-02** | **answered for deletion ordering** | `set_pointer` reads the value back; `relocate` returns 2 on failure before reaching `rclone delete`. Callers stop. This establishes the stated source-deletion guard, not general rollback of a malformed configuration write. [D, `cloud_migrate_layout`, `@@ -96,26 +217,112 @@`; A32.] |
| **G-A-03** | **answered by a supported withdrawal** | [U, “Migrating data that lives in someone’s cloud”] now explicitly states the one-player/one-console model and says no other device writes that folder during migration. The filename-list implementation still does not protect a concurrently changed version; that residual is real but outside this stated model. |
| **G-A-04** | **answered** | Lock failure now discards `TMP`, retries only once where allowed, and finishes nonzero. `LOCK_BUSY` prevents the unlocked stamp update too. [D, `cloud_capture`, `@@ -1470,6 +1552,20 @@`, `finish`; A42.] |
| **G-A-05** | **answered in part** | The original continuation and suffix counterexamples are rejected by the new grammar. The broader non-execution claim remains false because its comment grammar differs from Bash’s: G2-A-01. [D, all three `conf_valid` replacements; A33.] |
| **G-A-06** | **answered in part** | The specifically cited trailing-comment form is repaired. Valid assignment forms can still silently become the root: G2-A-03. [D, both `conf_get` functions; A39.] |
| **G-A-07** | **answered** | Checked enumeration now covers modern, flat, and legacy locations, with failure stopping the run. [D, `all_listing` and all its calls; A40.] |
| **G-A-08** | **answered** | Both scripts inspect actual transfer log entries even when the unit fails; match also recognizes successful copies from its separate log. [D, `moved_since`, unit-loop calls, `match_count`; A43.] |
| **G-A-09** | **answered in part** | The warning and completed-outcome suffix exist. The backup still omits the recovery record for root destinations. The current approving register row and UI presentation are not embedded; a warning alone does not establish approval of the safety exception. [D, `cloud_backup`, `@@ -1430,9 +1693,29 @@`, `run_outcome_line`; A36; R, proposed register exception.] |
| **G-A-10** | **answered** | Both local counters use `-name gamelist.xml`; the cloud counter treats that filename as game content at any depth. [D, both `content_files` changes and `cloud_content_filter`; A41.] |
| **G-A-11** | **answered for the identified missing bound** | The features query carries the listing options and its argument check is no longer exempted. This is an argv proof, not an observed stalled-backend timing proof. [D, `cloud_migrate_layout`, `@@ -193,6 +411,25 @@`; A38.] |
| **G-A-12** | **answered** | Copy failure now distinguishes unchanged source files from a partially populated destination. Verification failure promises only that nothing was removed from the old folder. [D, `relocate`, `@@ -96,26 +217,112 @@`; A37.] |

---

## 3. New findings

### G2-A-01: The configuration validator accepts an executable “comment”

- **Severity:** High
- **Category:** Fail-open configuration validation / shell execution
- **Where:** [D], `conf_valid` in:
  - `cloud_backup`, `@@ -877,25 +978,102 @@`
  - `cloud_restore`, `@@ -939,25 +1039,102 @@`
  - `cloud_sync_helper`, `@@ -98,43 +127,157 @@`
- **What:** The validator accepts carriage return as whitespace introducing a trailing comment. Bash does **not** treat carriage return as a shell word separator. Text the validator classifies as a comment can therefore remain part of an assignment word and execute command substitution when sourced.
- **Failure scenario:** Add this physical line to an otherwise valid configuration, with `<CR>` representing one actual `0x0d` byte:
  ```text
  EXTRA="x"<CR>#$(touch /ctl/pwned)
  ```
  `bash -n` accepts the syntax. The AWK validator accepts the suffix as whitespace plus a comment. On sourcing, the `#` is inside the assignment word, not at the beginning of a shell comment, and `touch` executes.
- **Evidence:** The new guard is:
  ```awk
  function rest(s, i) {
      if (substr(s, i) !~ /^([ \t\r]+(#.*)?)?$/) bad()
  }
  ```
  The quoted value parser stops before that suffix. `whole()` inspects the parsed value, not the purported comment. I looked for a subsequent check rejecting non-Bash separators before `#`; none appears in the supplied grammar. A33 tests seven executable shapes but not this control-character/comment boundary.

This is a static counterexample, not an execution I performed. It requires a regression test against **all three** validator copies. It directly violates [E, “Guards must fail closed”] and the claimed non-executing configuration contract in [C].

### G2-A-02: A failed safety copy can overwrite the valid configuration

- **Severity:** High
- **Category:** Recovery regression / last-known-good state destroyed
- **Where:** [D], duplicate-cleanup recovery in:
  - `cloud_backup`, `@@ -973,12 +1151,33 @@`
  - `cloud_restore`, `@@ -1035,16 +1212,37 @@`
- **What:** The fallback does not distinguish “the backup completed, then cleanup failed” from “making the backup itself failed.” A nonempty partial backup qualifies for restoration.
- **Failure scenario:** The live configuration is valid and contains duplicate keys. `/storage` fills while `cp` writes `.pre-cleanup.$$`, leaving a nonempty truncated prefix and returning nonzero. The duplicate-cleanup command is not run. Nevertheless, the `elif` renames the truncated prefix over the untouched valid configuration and reports that the earlier copy was restored.
- **Evidence:**
  ```bash
  if cp -f "${conf_file}" "${pre_cleanup}" 2>/dev/null \
     && /usr/bin/cloud_sync_cleanup_duplicates.sh "$conf_file" \
     && conf_valid "${conf_file}"; then
      ...
  elif [ -s "${pre_cleanup}" ] && mv -f "${pre_cleanup}" "${conf_file}"; then
      ...
  ```
  `-s` establishes only nonemptiness. No successful-copy flag or `conf_valid "${pre_cleanup}"` gates the replacement. A47 injects failure **after a successful safety copy** and therefore cannot catch this branch.

The safety-copy failure should leave the live file untouched. A useful regression injects a `cp` that writes a prefix and fails, then asserts that the live file remains byte-identical and cleanup was never invoked. [E, “Fail gracefully”; U, “Fixing forward is not enough”.]

### G2-A-03: Unrecognized valid assignments silently redirect content to the cloud root

- **Severity:** Medium
- **Category:** Upgrade compatibility / fail-open destination parsing
- **Where:** [D], `conf_get` in:
  - `cloud_content_backup`, `@@ -97,7 +97,55 @@`
  - `cloud_content_restore`, `@@ -98,7 +100,55 @@`
- **What:** The reader recognizes only a key at byte zero immediately followed by `=`. Other valid shell assignment forms are treated as an absent setting, not an unreadable setting. Absence selects the remote root.
- **Failure scenario:** An existing configuration contains either:
  ```bash
    CONTENT_REMOTE="/ROCKNIX/Content"
  ```
  or:
  ```bash
  export CONTENT_REMOTE="/ROCKNIX/Content"
  ```
  The former `source` reads the intended folder. The new reader finds no matching line, returns success with no value, and the content operation uses the remote root instead. A backup can therefore write outside the chosen content prefix.
- **Evidence:**
  ```awk
  index($0, k "=") == 1 { ... }
  END { if (found && !firstok) exit 2; if (found) print first }
  ```
  With `found == 0`, the function succeeds. Consequently, this guard does not fire:
  ```bash
  if ! CONTENT_REMOTE=$(conf_get CONTENT_REMOTE); then
      ... exit 1
  fi
  ```
  The subsequent character check also accepts the empty value. A39 covers comments, single quotes, duplicates, and a malformed suffix—but not assignment prefixes.

Supporting these forms is one option; explicitly refusing them is another. Silently converting an existing destination into the root is not fail-closed. [U, “Read both, write the new one”; E, “Guards must fail closed”.]

### G2-A-04: Apply proceeds even when it cannot consume its preview plan

- **Severity:** Medium
- **Category:** Persistent-state guard / repeatable destructive authorization
- **Where:** [D], `cloud_content_restore`, `match_run`, `@@ -636,6 +830,34 @@`
- **What:** Apply reads the plan, attempts to remove it, and ignores removal failure. The advertised one-use authorization is therefore optional when the cache cannot be modified.
- **Failure scenario:** A preview authorizes removal of `B.gb`. The cache containing `content-match-plan` becomes read-only while the ROM card remains writable—a possible split on a two-card device. Apply reads the plan, fails to unlink it, and removes `B.gb`. A new local-only `C.gb` is then added. A second `--match --apply`, without a new preview, reads the surviving plan and can remove `C.gb` under the same verb/count allowance.
- **Evidence:**
  ```bash
  MATCH_PLAN_TEXT=$(tail -n +2 "${MATCH_PLAN}")
  ...
  rm -f "${MATCH_PLAN}" 2>/dev/null
  if [ -z "${MATCH_PLAN_TEXT}" ]; then
      ... return 1
  fi
  ```
  Only empty plan text prevents execution; unsuccessful consumption does not. I looked for a successful unlink/claim check before the unit loop and found none in the added gate. A1’s second-apply test assumes unlink succeeds.

This is distinct from the accepted same-count residual **within one apply**. It permits repeated applies on one preview, defeating the lifecycle used to justify that residual. Failure to claim or spend the plan should prevent destructive calls.

### G2-A-05: Timeout status is still lost during reachability remote selection

- **Severity:** Low
- **Category:** Incorrect failure attribution / incomplete timeout fix
- **Where:** [D], `check_internet` in:
  - `cloud_backup`, `@@ -803,11 +882,25 @@`
  - `cloud_restore`, `@@ -869,17 +947,31 @@`
- **What:** The new ceiling-specific branch observes only the `lsd` result. `listremotes` can return the wrapper’s 124, but its pipeline loses that status and leaves `probe_rc=1`.
- **Failure scenario:** An automatic settings-only run reaches `check_internet` after its deadline, or its wrapped `listremotes` is ended by the deadline. The remote name is empty, so no `lsd` runs. Internet ping succeeds. The run reports the sign-in/reachability explanation rather than the known ceiling expiration.
- **Evidence:**
  ```bash
  local remote probe_rc=1
  remote=$(rclone listremotes 2>/dev/null | head -1)
  if [ -n "${remote}" ]; then
      rclone lsd ...; probe_rc=$?
      ...
  fi
  ...
  [ "${probe_rc}" -eq 124 ]
  ```
  The wrapper explicitly returns 124 without starting commands after the deadline. Neither its status nor `PIPESTATUS` is captured here. A45 injects a hang only for `^lsd qa: `, leaving this path untested.

### G2-A-06: A failed partial-file sweep can certify the tree as clean

- **Severity:** Low
- **Category:** Marker invariant / failure hidden by cleanup
- **Where:** [D]:
  - `cloud_restore`, `@@ -1486,9 +1756,13 @@`
  - `cloud_content_restore`, added `sweep_partials` / `tree_record_give` and the calls before normal completion
- **What:** Marker creation is not conditioned on successful cleanup. The optimization can persist a false “no leftovers” assertion and suppress later sweeps.
- **Failure scenario:** The ROM card is read-only and contains a partial file from an interrupted transfer, while the internal cache remains writable. Restore fails; the sweep cannot remove the partial; nevertheless, `restore-tree-clean` is written. Once the same card is writable again, a successful saves restore sees the marker and skips the sweep, leaving the old partial indefinitely.
- **Evidence:**
  ```bash
  sweep_partials "${SAVESPATH}"
  ...
  : > "${PARTIALS_CLEAN}" 2>/dev/null
  ```
  The sweep result is not tested. The content path similarly sweeps a failed unit and later calls `tree_record_give` without requiring successful removal. A13/A49 cover failed or killed transfers, not a failed cleanup.

The new content exclusions reduce the consequence: I am **not** claiming that this leftover is still uploaded as content. The demonstrated defect is a false persistent marker and missed cleanup. [E, “The last known good state is a record, kept on purpose”.]

### G2-A-07: The no-change helper path still writes to persistent storage

- **Severity:** Low
- **Category:** Hot-path write regression / test overstates guarantee
- **Where:** [D], `cloud_sync_helper`, `@@ -87,8 +109,15 @@`, `@@ -98,43 +127,157 @@`; A18
- **What:** The optimization preserves the live rules file and its backup, but it does not implement the stated “a run with nothing to change writes nothing” behavior.
- **Failure scenario:** Run the helper on a settled configuration after each game. It builds the complete `${rules}.new` beside the live file under `/storage`, then removes it after comparison. It also updates the persistent migration marker’s timestamp on every no-change run.
- **Evidence:**
  ```bash
  : > "${rules}.new" && built=1
  ...
  cat /usr/config/cloud_sync-rules.txt.defaults >> "${rules}.new"
  ...
  if cmp -s "${rules}.new" "${rules}"; then
      rm -f "${rules}.new"
      touch "${marker}" 2>/dev/null
      return 0
  fi
  ```
  A18 inspects the live configuration/rules inode, mtime, size, and backup existence. It does not inspect marker changes or candidate-file writes, so it passes despite them.

The narrower improvement is real. The zero-write claim is not; at minimum, an existing one-shot marker should not be touched repeatedly.

---

## 4. Sweep-row spot checks

I checked more than the required five claimed fixes:

| Sweep row | Result against the diff |
|---|---|
| **claude F-CS-04** | `pause()` replaces unconditional sleeps, `first_remote()` is added, and skipped-phase summary overrides exist. [D, `cloud_restore`; A12.] **Mechanism holds.** |
| **claude F-CS-06** | The helper’s catch-all test is anchored to the entire line. [D, `rules_whole`; A3.] **Holds.** |
| **claude F-CS-08** | Conditional sweeping and the persistent clean marker exist. [D, `cloud_restore`; A13.] **Incomplete invariant: G2-A-06.** |
| **claude F-CS-11** | First-merge rules below the catch-all become `# inert:` comments; subsequent user additions are promoted. [D, `update_cloud_sync_rules`; A17.] **Upgrade mechanism holds for the seeded case.** |
| **claude F-CS-18** | Unchanged live config/rules and their backups are no longer replaced. [D, comparison branches; A18.] **Narrow result holds; “writes nothing” does not: G2-A-07.** |
| **claude F-CS-20** | The clock query is `timeout -s KILL 2 timedatectl ...`. [D, `cloud_capture`; A8.] **The stated bound mechanism is present.** |
| **claude F-CS-21** | Settings restore’s `ls` and backup’s archive `size` use `RCLONE_LIST_OPTS`. [D, corresponding settings hunks; A20.] **Holds.** |
| **claude F-CS-24** | Deliberate stats and automatic/content moved-file logs can set the `gaps` stamp. [D, movement tracking; A28/A43/A44.] **Producer mechanism holds; reader seam remains unverified here.** |
| **gpt F-CS-20** | Successful saves phases record the card; unsuccessful ones use `record ... --no-write`. Write failures return nonzero. [D, both saves phases and `cloud_saves_root`; A23.] **Holds.** |
| **gpt F-CS-29** | The oldest automatic option string is rewritten directly to the 90-second form. [D, helper’s final migration; A19.] **Holds for successful writes.** |
| **gpt F-CS-30** | Local/remote counting and transfer filters align on root README files, nested save directories, and game lists. [D, content counters and exclusions; A26/A41.] **The named drift is addressed.** |
| **gpt F-CS-34** | The deadline is initialized before the settings-only probe; wrapped calls do not start after it. [D, wrappers/main; A29.] **Partial, as reported:** content stall ceilings remain open; G2-A-05 adds a wording gap. |
| **gpt F-CS-35** | Dated archives are selected before the undated fallback. [D, `restore_system_files`; A21.] **Holds.** |

### Withdrawn sweep rows

- **claude F-CS-12:** **Cannot judge the cited decision.** D-CLOUD-040/042 and the relevant refusal implementation are not embedded. A report’s reference to a rejected design is not enough to reconstruct that decision.
- **claude F-CS-22:** **Cannot judge the specific D-CLOUD-079 withdrawal.** The current decision row is missing. The general last-known-good rule alone does not settle the intended lifetime of these particular `.bak` files.
- **claude F-CS-27:** **Out-of-packet routing is supported, not substantive resolution.** No recipe changes are shown. This may belong to F2/PR preparation, but assigning another owner does not establish that the finding is withdrawn on its merits.
- **gpt F-CS-28:** **The stated design withdrawal is supported by [C].** Its game-exit section explicitly defines no default route as immediate exit 69. That is evidence of the chosen behavior, not proof that it recognizes every usable LAN-only route.

---

## 5. Cross-stream seams

### Script outcomes → ES cards, pages, rows, and French

The producer changes are visible; the reader changes are not.

- `69 gaps YOU WENT OFFLINE PART-WAY THROUGH` requires readers to distinguish partial progress from an ordinary 69 skip.
- A live command still exits 69. Correct menu-stamp parsing alone does not prove that the running card/page reports partial progress correctly.
- `>>> removed` now reports actual deletions; the receiving page must not describe those files as recoverable from the cloud.
- The latest two proposed whys—`YOUR CLOUD SYNC SETTINGS COULDN'T BE SAVED` and `CHECK WHAT WOULD CHANGE FIRST`—need reader-table/test/French agreement. Their implementations are outside [D]; they are not included in [T]’s displayed why list.

**Result:** producer-side changes are inspectable; end-to-end agreement is not cleared from this packet. [D; T, “Outcome vocabulary”; R, “New words”.]

### Match retry → preview-plan lifecycle

[T] now documents **no direct TRY AGAIN for match apply**, with recovery pointing back to the row that previews again. That is consistent with a consumed plan and appears to supersede the report’s earlier “retry the same apply” concern as a policy statement.

The ES implementation is not embedded. Separately, G2-A-04 means the producer does not reliably enforce consumption when removal fails.

### Root saves folder → recovery policy and visible warning

The exception still removes `--backup-dir`. The new notice is console prose and an outcome-line suffix; it is not a new `>>>` marker or distinct stamp.

[C, “What rclone’s stats block looks like on a pipe”] says cards receive protocol markers rather than console prose. Therefore this diff alone does **not** establish that an automatic-sync card tells the player about lost replacement protection. The approving register row and actual interface behavior are required.

### Configuration setter → all readers

The setting writer must agree with:

- the restricted saves-side `conf_valid` grammar;
- content-side `conf_get`;
- duplicate cleanup’s first-value policy;
- migration’s existing `conf_value` reader.

Only parts of that chain are exposed. PL-015 and PL-051’s `cloud_setup` acceptances cannot be closed here. G2-A-01/G2-A-03 demonstrate that the visible readers are not yet consistently fail-closed.

### Capture lock, transfer lock, and clean-tree marker

- Capture correctly uses a separate lock, preserving independence from the transfer flock.
- Migration apply now uses the transfer lock.
- Saves restore, content restore, and match apply now participate in the clean-tree marker.

The capture tests use a synthetic holder; they do not demonstrate two complete capture producers racing through sealing, publication, retry, and GC. Nor does the packet establish an inventory of every other writer to the marked tree. G2-A-06 invalidates the marker even among the visible participants.

### Shared test harness and installed artifact

The appended tests have useful artifact assertions and explicit fault injection. But the harness can fall back to host rclone, and the actual binary/applications selected by the reported run require its log to verify. Other streams’ edits to the shared harness are not in this packet.

No installed-image or package artifact is provided to prove the scripts, the updated `cloud_saves_root` CLI, ES readers, and translations ship together.

### Other suggested seams

Proxy stamps, `wifictl` picker output, and the settings-lock implementation are not exposed here. I make no agreement claim about them.

---

## 6. Coverage boundary and unresolved release evidence

### Not independently established

1. **Runtime results:** No test was run by this auditor. The cited full-run logs and FAIL-before evidence are not embedded.
2. **Guest/backend behavior:** The new round-trip steps, ES MATCH journey, upgrade rehearsal, and migration on WebDAV/S3 are not demonstrated by supplied runtime artifacts. [C] expressly requires more than one backend for these classes of change.
3. **Unchanged code:** A unified diff does not expose complete implementations of several readers, helpers, traps, and callers, including the ES parsers, `last_player_line`, and substantial unchanged script context.
4. **Decision approval:** The root-backup recovery exception and several cited withdrawal decisions cannot be verified without their current register rows.
5. **Full concurrent-capture correctness:** Commit exclusion is visible. Delayed sealing/publication and the ten-minute GC grace need a true competing-producer proof; I have not treated the grace period as proof of indefinite protection.

### Already-written state still needs explicit closure

The report itself leaves several inherited states unrepaired:

- earlier migrations’ `Saves/backup` and `Saves/Content`;
- configurations repointed to the new layout while the data was never copied;
- old success stamps written over failures.

Those are **acknowledged limitations**, not upgrade-parity mechanisms. No corresponding repair/read-both implementation or upgrade-rehearsal evidence is exposed here. Under [U, “Every fix answers what was already written”], they need an explicit disposition rather than an inference from the forward tests passing.

The report also explicitly leaves **migration retry after a verification mismatch** and **content-transfer stall ceilings** unresolved. They should remain visible release decisions, not disappear into the opening “every item is resolved” summary.

### Immediate review gates

Before clearing packet A:

- close G2-A-01 and G2-A-02 with fault cases that fail on this diff;
- close the wrong-root parsing and unspent-plan paths;
- obtain the ES/decision artifacts needed for the protocol and safety-exception seams;
- retain the acknowledged upgrade and runtime gaps in the release decision.

---

## `corpus.provenance.json`

The following is the provenance-file content; I have not written a file. The three parallel arrays associate each citation ID with its declared source path and the **SHA-256 verified by the Council Facilitator at embed time**.

```json
{
  "corpus_kind": "embedded_read_at_time",
  "facilitator": "Council Facilitator — council-facilitator@1.2.0",
  "manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "hash_verification": {
    "performed_by": "Council Facilitator",
    "performed_at": "embed time",
    "auditor_re_read_files": false,
    "auditor_re_hashed_files": false
  },
  "auditor_filesystem_access": false,
  "auditor_runtime_tests_performed": false,
  "source_ids": [
    "D",
    "R",
    "F",
    "I",
    "E",
    "U",
    "T",
    "C"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/A.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/A.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/A.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/A.items.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/rclone-cloud-sync.md"
  ],
  "source_file_hashes": [
    "48bf7f7d8744d6e21be5d7427f814878a53c91fda3945c9d8c898c4ae906f13b",
    "32172a2d6301464aa7bd09778f816ed1fb0944f972236ad0570b0ac3d207b6a8",
    "85cd4cd9be75084dfa00ea1b83c03fbed777f0c85dc5fcc2fbded7b324ab5c6b",
    "e35f9a9835e0f8f6fc2c49c45bcd5f7b7e6b9b0873b73763001ab494677cda7b",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "62478bddb5b706a91f7d9f6900eeffc46b06a6aacdcfc0d554ba17465035001c"
  ],
  "source_scope_note": "D is an embedded unified diff. Target files named inside it were not independently read as complete files.",
  "missing_sources_needed_for_remaining_judgments": [
    {
      "description": "Complete cloud_setup setter implementation and the guest evidence for PL-015, PL-030, and PL-051.",
      "embedded": false
    },
    {
      "description": "Current EmulationStation outcome/stamp readers, match retry implementation, protocol tests, and French translations.",
      "embedded": false
    },
    {
      "description": "Current decision-register rows approving the root-level backup recovery exception and supporting the unresolved withdrawal claims.",
      "embedded": false
    },
    {
      "description": "Full harness logs and FAIL-before evidence referenced by the stream report.",
      "embedded": false
    },
    {
      "description": "VM round-trip, multi-backend migration, upgrade-rehearsal, and installed-image evidence for the integrated fix round.",
      "embedded": false
    },
    {
      "description": "Complete unchanged caller/helper implementations and other streams' changes at the identified seams.",
      "embedded": false
    }
  ],
  "missing_source_hashes_fabricated": false
}
```
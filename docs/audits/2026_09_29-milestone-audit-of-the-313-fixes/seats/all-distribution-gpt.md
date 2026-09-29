# Distribution audit — #313

## Result and evidence limits

**Keep this review open.** Two source-level findings warrant immediate reproduction before candidate closure:

- **G3-D-01:** the configuration grammar accepts an escaped expression that Bash evaluates through an integer special variable.
- **G3-D-04:** `sort_settings` can install a partial result after its producer or sorter fails.

I inspected only the embedded corpus. **No commands, tests, builds, filesystem reads, or hashes were performed.** All counterexamples below are source-derived unless explicitly marked as unresolved.

Citation keys `[D]`, `[AC]`, `[EP]`, `[UP]`, `[AP]`, and `[RC]` resolve to the exact source paths and Facilitator-supplied hashes in `corpus.provenance.json` below. Code paths and hunk references identify members of `[D]`, not separately supplied full source files.

The acceptance text requires regression cases and, for several items, candidate-specific runtime artifacts. Those artifacts are not embedded. This leaves more than five proof clauses unverifiable here; **that is a corpus gap for the orchestrator, not evidence that the tests were omitted.**

## 1. Per-item verdicts

**T** means the required regression test, execution result, or other proof artifact is not embedded. “Holds in part” distinguishes a supported source mechanism from unverified acceptance clauses; it is not full acceptance closure.

Cloud-script basenames below refer to `projects/ROCKNIX/packages/network/rclone/sources/`. `backuptool` and `chksysconfig` refer to `projects/ROCKNIX/packages/rocknix/sources/scripts/`. Hunk numbers are the new-side starting numbers shown in `[D]`.

| Item | Verdict | Mechanism and remaining boundary |
|---|---|---|
| **PL-001** | **holds in part** | `cloud_migrate_layout` cleans pointers, compares absolute folder keys, refuses `..`, and refuses same-folder relocation. Destination-under-source exclusion also addresses interrupted relocation. Hunks **+44, +311, +504, +543**. The comparison mechanism meets the normalization purpose without rewriting an already-current pointer. Trailing-slash fixture and unchanged proof run 2: **T**. |
| **PL-002** | **holds in part** | All five named readers reject control characters other than tabs before interpreting comments or assignments; trailing whitespace no longer includes CR. `conf_valid` hunks **+1046 / +1107 / +250**, content-reader hunks **+113 / +116**. The stated CR defect is addressed. Tests: **T**. The broader “nothing executes” invariant still fails at **G3-D-01**. |
| **PL-003** | **holds in part** | `backuptool`, hunk **+27**, replaces sourcing with `conf_text_value`, reads the first assignment, and retains the new-name/legacy-name fallback. The shown reader does not execute configuration text. Canary execution test: **T**. |
| **PL-004** | **holds in part** | `cloud_backup` **+1189** and `cloud_restore` **+1250** require successful `cp`, byte equality, and validation of the copy before cleanup can start. A failed copy is removed rather than restored over the live file. Both failure-injection cases: **T**. |
| **PL-005** | **holds in part** | `001-functions`, **+80**, adds the requested flag-form `passflag` trigger. This closes the argument-mode bypass for `--pass`, `--RA_Pass`, and equivalent suffixes. The complete downstream redactor and required masking cases are not supplied: **T**. |
| **PL-006** | **holds in part** | `backuptool` introduces checked `tmp_file` and checks list writes/counts before treating a selection as empty. Relevant hunks: **+222, +577, +802, +1453, +1649**. `to_log` uses 125 for failure to obtain its temporary, avoiding grep’s “no match” status. Required mktemp, append, final-write, and genuinely-empty cases: **T**. |
| **PL-007** | **holds in part** | `RESTORE_CONTROL` and the backups directory are excluded from backup collection; shared `SKIPS` protects both extraction formats and includes the particular snapshot. Hunks **+743, +885, +1623**. The fresh-marker/snapshot extraction case is **T**. Raw archive-name aliases versus extraction exclusion matching remain unverified. |
| **PL-008** | **holds in part** | `CREDENTIAL_KEYS`, `backuptool` **+413**, now permits whitespace after an opening double quote before requiring a nonblank value. The specified leading-whitespace password reaches the key scan. Refusal case: **T**. |
| **PL-009** | **holds in part** | `cloud_setup::syncpath_problem`, **+310**, rejects empty, `.` and `..` components before sibling checks and constructs a usable suggestion. `/Mine/Backups/.` enters this refusal. Required case: **T**. |
| **PL-010** | **outside the packet** | The EmulationStation `StringUtil::maskValueEnd` implementation and doctest are not supplied. The package pin is not implementation evidence. |
| **PL-011** | **outside the packet** | Neither repository’s hook implementation or constructed scanner-failure tests is embedded. |
| **PL-012** | **outside the packet** | Hook exemptions, `.gitignore`, and hook tests are outside the supplied distribution diff. |
| **PL-013** | **outside the packet** | As directed for this documentation item. The supplied current `[EP]` does contain the delimiter-only capture and fake-secret proof instruction, but the change and `rules-check` result are not in this diff. |
| **PL-014** | **holds in part** | New `cloud_log_scrub` is installed and called synchronously before the autostart capture pass. It processes persistent cloud/ES log families and records completion per family. New-file hunk **+1,197**, package **+72**, autostart **+15**. Planted-line proof and Already-written trace: **T**. Truncated quoted lines need the follow-up in **G3-D-09**. |
| **PL-015** | **holds in part** | The five readers recognize Bash’s double-quote escapes; validators and callers add shape-only diagnostics. Same reader hunks as PL-002. Required accepted/refused cases: **T**. Accepting escapes while sourcing arbitrary variable names creates **G3-D-01**; folder-reader agreement is also incomplete at **G3-D-02**. |
| **PL-016** | **holds in part** | `chksysconfig`, **+141**, defers an ordinary/legacy under-ROMs recovery when the mount table is unreadable. However, the new `roms-mounted=no` branch bypasses that uncertainty check: **G3-D-07**. Required missing-table case: **T**. |
| **PL-017** | **holds in part** | `backuptool`, **+1782**, chooses an unused suffixed name, uses `mv -n`, and confirms that the source disappeared and destination exists. Existing destination symlinks also count as collisions. Two-ZIP survival case: **T**. |
| **PL-018** | **outside the packet** | `AtomicFileUtil` and the two recovery cases belong to the EmulationStation packet. |
| **PL-019** | **outside the packet** | The BIOS-only UI path, app-unit case, and 640×480 frame are absent. |
| **PL-020** | **holds in part** | Both generators use the same three-state arm/taken tracking. `#elif 0` stays dead; `#elif 1` after a dead arm becomes live; subsequent arms are excluded once a branch is necessarily taken. Hunks **+14** in both generators. Four fixtures and five-table regeneration results: **T**. |
| **PL-021** | **holds in part** | `cloud_setup::conf_get`, **+105**, now retains the first assignment, matching the shown content readers and the stated cleanup contract. Duplicate-reader proof: **T**. Agreement on unreadable forms is incomplete: **G3-D-02**. |
| **PL-022** | **holds in part** | `backuptool`, **+455**, combines the whole ZIP read with per-stored-member CRC comparison; **+1418** refuses ZIP restoration without `crc32`. This avoids substituting POSIX `cksum`. Healthy/damaged, stored/deflated cases on the image’s BusyBox: **T**. |
| **PL-023** | **outside the packet** | Harness verdict counting and the hidden-tarball run are not embedded. |
| **PL-024** | **outside the packet** | `tools/vm-upgrade-rehearsal` and its stale-boot-line case are absent. |
| **PL-025** | **outside the packet** | The `vm-qa` exec wrapper and signal-disposition output are absent. |
| **PL-026** | **outside the packet** | The pre-commit matcher and filename fixture are absent. |
| **PL-027** | **outside the packet** | `es-player-text.md` and `rules-check` output are not embedded. |
| **PL-028** | **holds in part** | `archive_members` no longer filters ZIP listings down to `storage/`; `foreign_member` is checked before extraction. `backuptool` **+455 / +1453**. The stated foreign-file path is refused by the shown mechanism. Tar/ZIP refusal proofs: **T**. This does not establish complete archive-type or path-alias safety. |
| **PL-029** | **outside the packet** | This is a proof deliverable, not a code change. No candidate upgrade log, migration listings, proof-run inventory, or physical Wi-Fi evidence is supplied. |
| **PL-030** | **outside the packet** | `SaveStateBookkeeper::runCopy`, its guard, and its app-unit case are absent. |
| **PL-031** | **holds in part** | `added_count` publishes `unknown` rather than cache operations after a failed nonzero-cache measurement; scan, top-up, cancellation, and stamp-writing paths use it. `raofflineproxy-ctl` **+1043, +1068, +1783, +2011, +2355**. Failure-injection proof: **T**. The interface parser half is outside the packet. |
| **PL-032** | **holds in part** | `write_owned` checks session ownership and allowed predecessor status under the state lock; waiting writes require `starting`; late sign-in publication can be refused. `cloud_oauth` **+135, +537, +1850, +2231, +2357, +2426**. Full callback/marker paths and required cases are absent. Failed cleanup still leaves an unanswered side effect: **G3-D-06**. |
| **PL-033** | **holds in part** | The ctl/PPSSPP comments name the proposed IPv4-only binding evidence: `TCPServer`’s `AF_INET`, `boot.py` sockets, and the default host. Those upstream implementation lines and the claimed namespace test are not embedded. A comment naming evidence is not verification of that evidence. |
| **PL-034** | **holds in part** | `cloud_capture` carries the original start time through retry and checks its 100-second exit bound before and after obtaining the commit lock. Hunks **+137, +204, +1591**. The blocked-capture/released-launch proof, full lock implementation, and interface gate are absent. The new batched cleanup has **G3-D-05**. |

All 34 acceptance items are accounted for. `[AC, AP]`

## 2. Findings

### G3-D-01: Escaped dollars reopen execution through Bash arithmetic variables

- **Severity:** High
- **Category:** Configuration executed; validation fails open
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`, `conf_valid`, hunk `@@ -1026,35 +1046,42 @@`; identical relevant logic in `cloud_restore`, **+1107**, and `cloud_sync_helper`, **+250**. `[D]`
- **What:** The grammar permits arbitrary assignment names and now permits `\$` inside double quotes. Bash integer special variables perform arithmetic evaluation on their assigned values. Quoting the initial assignment does not prevent that secondary evaluation.
- **Failure scenario:** Add this line to an otherwise valid configuration:
  ```bash
  RANDOM="BASH_VERSINFO[\$(printf x > /tmp/qa-conf-ran)0]"
  ```
  The validator accepts the variable name and escaped dollar. When sourced, Bash’s arithmetic evaluation of `RANDOM` evaluates the array subscript and executes the command substitution. The canary file is the proposed observable result; **this was not executed here**.
- **Evidence:** `dq()` accepts backslash followed by `$` and skips both characters. The key check accepts `RANDOM`. `whole()` applies the additional dollar/backslash prohibition only to the five folder keys. I checked the proposed defenses: syntax checking does not evaluate this assignment, and the folder restriction does not apply. The corpus identifies these three validators as guards for sourcing configuration. `[D, AC: PL-002, RC: D-CLOUD-142]`
- **Fix:** Do not source arbitrary-name assignments. Parse into an allowlisted set of application configuration variables, excluding shell special/arithmetic targets. Preserve safe escaped text in option values rather than solving this by indiscriminately rejecting the PL-015 escape forms. Add the canary through each actual source path.
- **Confidence:** High by source and Bash-language analysis; not executed.

### G3-D-02: The configuration readers still disagree on usable folder settings

- **Severity:** Medium
- **Category:** Unreadable configuration treated as absence; reader disagreement
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup`, `conf_get`, **+113**; `cloud_content_restore`, **+116**; `cloud_setup`, **+105** and `--status`, **+470**. `[D]`
- **What:** The `other` regex recognizes only selected alternate assignment spellings. An unrecognized spelling can still return successful absence. Separately, decoding escapes does not give all callers the same folder-value validation.
- **Failure scenario:**
  1. A configuration contains:
     ```bash
     export -- CONTENT_REMOTE="/Mine/Content"
     ```
     `conf_valid` refuses that line. All three text readers miss it: it neither starts with `CONTENT_REMOTE=` nor matches the alternate-form regex. They return success with an empty value, which the content contract interprets as the remote root.
  2. A folder value containing an escaped dollar is decoded by `conf_get`. The content scripts’ subsequent `case` refuses the resulting dollar, but `cloud_setup --status` prints the successfully returned value. It can therefore name a folder that the saves validator refuses.
- **Evidence:** The optional flag group is `([ \t]+-[A-Za-z]+)*`; it cannot consume `--`. With no `found`, `other`, or control-character flag, `END` exits successfully and prints nothing. I checked the expanded detection for indentation, declarations and `+=`; none catches `export --`. For the second case, the shown setup status caller checks only `conf_get`’s status, whereas the content caller additionally rejects dollar/backtick/backslash characters. `[D]`
- **Fix:** Validate the agreed configuration grammar before interpreting absence, and apply one key-specific plain-folder rule to every reader. Do not keep extending a list of alternate shell spellings as a substitute for validating the file.
- **Confidence:** High for the parser results and status disagreement. No transfer was run.

### G3-D-03: Failure to obtain the marker lock restores the check/unlink race

- **Severity:** Medium
- **Category:** Concurrency; notification lost
- **Where:** `projects/ROCKNIX/packages/network/raofflineproxy/sources/raofflineproxy-ctl`, `pending_lock`, `write_index_pending`, and `ack_index_pending`, hunk `@@ -1996,9 +2094,51 @@`. `[D]`
- **What:** A writer that cannot obtain the lock still replaces `INDEX_PENDING`. That writer is not serialized with the acknowledger’s token check and unlink.
- **Failure scenario:** An acknowledger holds the lock and reads token A, then is delayed before `rm`. A writer exhausts its lock attempts and, as permitted by the new fallback, renames token B over the marker. The acknowledger resumes and removes B. The newer index notification is lost.
- **Evidence:** `write_index_pending` explicitly continues after `pending_lock` fails. `ack_index_pending` performs `cat` and `rm` as separate operations, relying on all writers taking the lock. I checked the normal locked path: it closes the race, but the fallback removes that guarantee. A process pause longer than the retry window is sufficient; no malformed token is required.
- **Fix:** Preserve notification delivery without an unlocked replacement of the shared marker. Options include uniquely named notification files acknowledged by identity, or a separate durable deferred-write record that the acknowledger cannot remove. Propagate failure if the notification cannot be preserved.
- **Confidence:** High; source-derived interleaving.

### G3-D-04: `sort_settings` installs output without checking the producing pipeline

- **Severity:** High
- **Category:** Last-good state replaced by a partial result
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`, `sort_settings`, hunk `@@ -391,8 +459,10 @@`. `[D]`
- **What:** The pipeline’s status is not a condition of the rename. The later test checks only that the temporary is nonempty and contains a hostname.
- **Failure scenario:** A valid live configuration contains a hostname and additional settings. `settings_base` emits the hostname, then fails while reading the remainder; alternatively, the sorter writes that prefix and fails. The temporary remains nonempty and contains the hostname, so `mv` installs the incomplete file and drops the remaining settings.
- **Evidence:**
  ```bash
  settings_base | grep '^[a-z0-9]' | sort >"${J_CONF}.tmp"
  if [ -s "${J_CONF}.tmp" ] && grep -q '^system\.hostname=' "${J_CONF}.tmp"
  ```
  There is no status gate connecting these statements. I checked the neighboring writers: `write_setting_line`, `del_setting`, and `set_settings` use a local `pipefail` pipeline whose success gates the rename. That protection was not carried into `sort_settings`. Merely enabling `pipefail` is insufficient if the resulting failure status is then ignored.
- **Fix:** Gate validation and rename on successful completion of a local `pipefail` pipeline. On any producer/filter/sorter failure, remove the temporary and leave the live file unchanged. Add a producer that emits a valid-looking prefix and then fails.
- **Confidence:** High; no execution needed to establish the discarded status.

### G3-D-05: The batched seal removal lacks the argument-size fallback

- **Severity:** Medium
- **Category:** Regression in garbage collection; storage accumulation
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture`, `stage_times` and `_gone` removal, hunk `@@ -1610,17 +1655,32 @@`. `[D]`
- **What:** The new code handles an oversized argument list for `stat`, but not for the equally batched `rm`.
- **Failure scenario:** The stage contains enough old, unreferenced seals that their paths exceed the process argument-size limit. `stat` returns 126 and the `find ... -exec` fallback successfully lists them. They all enter `_gone`. The single `rm -f "${_gone[@]}"` then fails before execution with the same size problem, leaving all those seals behind.
- **Evidence:** Only `stage_times` has a 126 fallback. Removal is one command with no batching, status check, or fallback; its diagnostics are discarded. I checked whether later code retries removal: the next shown operation measures stage size with `du`, not another cleanup.
- **Fix:** Remove in bounded batches or use a suitable `find -exec ... +`/bounded argument-list mechanism. Handle failure explicitly rather than silently retaining an unbounded obsolete stage.
- **Confidence:** High for the oversized-stage failure. Downstream pressure handling is outside the shown hunk.

### G3-D-06: Late OAuth cleanup reports removal without checking it

- **Severity:** Medium
- **Category:** Unverified rollback; state/artifact disagreement
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_oauth`, `_create_remote_locked`, hunk `@@ -502,11 +537,37 @@`. `[D]`
- **What:** When terminal-state or ownership gating refuses publication, the code invokes `rclone config delete`, ignores its result, and logs that the remote was removed.
- **Failure scenario:** Creation succeeds while the sign-in is waiting. The player closes the attempt before publication. `write_owned` correctly refuses. Deletion then fails—for example, the configuration cannot be rewritten. The method returns `CLOSED_EARLY`, the log says the remote was removed, but the remote remains and a later sign-in can be refused as already configured.
- **Evidence:** The `subprocess.run(... config delete ...)` result is discarded. There is no following existence check. I checked `_CREATE_LOCK` and the collector join: serialization and waiting do not establish that deletion succeeded.
- **Fix:** Check and verify cleanup. If it cannot complete, retain a recoverable cleanup record or stage creation so a refused publication does not leave an installed remote. Report the unresolved artifact honestly without reopening the closed sign-in.
- **Confidence:** High; the failed-delete branch has an unconditional false success statement.

### G3-D-07: `roms-mounted=no` bypasses uncertainty about the current tree

- **Severity:** Medium
- **Category:** Recovery targets a pathname without establishing its filesystem
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig`, `finish_restore`, hunk `@@ -127,31 +141,48 @@`; producer in `backuptool`, **+1570**. `[D]`
- **What:** “Not mounted when the restore ran” is treated as permission to proceed irrespective of whether the path is mounted now—or whether the current mount table can be read.
- **Failure scenario:** A restore runs while `/storage/roms` is an ordinary directory and records `roms-mounted=no`. On the next boot a card is mounted there, or the table is unreadable and its state is unknown. If the relevant parent directory exists, the shown gate does not defer. It selects the current pathname even though the restore’s files may be underneath that mount.
- **Evidence:**
  ```bash
  [ "${was}" = "no" ] && return 1
  ```
  precedes the current-mount check. The snapshot branch also handles `no:*` using only parent-directory existence. I checked the PL-016 fix: unknown mount state defers the other branches, but not this one. The later restore/removal implementation is not embedded, so I am not claiming an observed wrong-card deletion.
- **Fix:** Distinguish “previously unmounted and still unmounted” from “previously unmounted but now mounted/unknown.” Defer on unknown state; address the original underlying tree explicitly before recovery when a new mount hides it.
- **Confidence:** High for the bypass; resulting filesystem mutations require the complete recovery path and a boot test.

### G3-D-08: Socket cleanup can unlink a socket replaced after its check

- **Severity:** Medium
- **Category:** Time-of-check/time-of-use race
- **Where:** `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm`, `stale_socket` and `prepare_run`, hunk `@@ -152,31 +154,65 @@`. `[D]`
- **What:** The cleanup list retains pathnames, not verified socket identities. Checks can be separated from unlinking by another socket’s grace period.
- **Failure scenario:** Start A checks a stale monitor socket, then waits for its serial socket to stop answering. Start B, using the same monitor pathname but another serial path, removes the stale monitor and starts listening there. A’s serial check finishes; A unlinks B’s now-live monitor socket.
- **Evidence:** `stale_socket` returns only a Boolean. `prepare_run` later executes `sock.unlink(missing_ok=True)` without verifying identity or liveness again. I checked the all-path preflight: it prevents partial cleanup after a detected refusal, but does not serialize replacement during the preflight.
- **Fix:** Serialize cooperating starts by the socket paths through cleanup and QEMU binding, and verify identity before removing a previously observed object. A second `lstat` alone should not be described as making this atomic.
- **Confidence:** High for the local race; no concurrent guest test was run.

### G3-D-09: The truncated-log fallback destroys quoted-value boundaries

- **Severity:** Medium
- **Category:** Redaction correctness; unresolved residual exposure
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_log_scrub`, `SCRUB_SED` and the `first_pass | redact_credentials` pipeline, new-file hunk `@@ -0,0 +1,197 @@`. `[D]`
- **What:** For a config-command line cut before its `failed (...)` suffix, the fallback masks a `key=value` only through the first space—even when that space is inside quotes.
- **Failure scenario:** A planted truncated line ending with:
  ```text
  [cloud_remote] rclone config create qa webdav pass="front tailpiece"
  ```
  becomes, after the first pass:
  ```text
  [cloud_remote] rclone config create qa webdav pass=<redacted> tailpiece"
  ```
  The residual word has lost its credential-key/quote context. **No end-to-end disclosure is demonstrated here:** the remainder of the shared redactor is not embedded.
- **Evidence:** The fallback is `s/ ([A-Za-z0-9_.-]+)=[^ ]*/ \1=<redacted>/g`, and it runs before the common filter. The embedded quoted-value redaction patterns cannot match the original range once its opening quote has been removed. I checked the complete-failure-line rule and the ES rule: those remove whole output ranges and do not produce this particular intermediate result.
- **Fix:** For incomplete historical command records, redact the argument tail conservatively, or preserve quoting until a credential-aware parser processes it. Prove the final installed pipeline with quoted values containing spaces and a missing failure suffix before recording the family as scrubbed.
- **Confidence:** High for the malformed intermediate output; medium for final exposure pending the missing filter body.

## 3. Seams and inherited state

| Seam | Assessment |
|---|---|
| **Cloud configuration across A, B and C** | First-assignment selection now agrees for ordinary assignments. The safety-copy logic also agrees between backup and restore. The shared contract still breaks on arithmetic-special assignments and alternate/unusable folder spellings: **G3-D-01/02**. |
| **`001-functions`: locking, recovery and Wi-Fi pairs** | `ln -T` prevents a directory from being accepted as the lock destination. `set_settings` writes the SSID/key pair in one locked rename, improving both join and forget. `settings_base` is connected to ordinary, delete and batch writers with pipeline checks, but not safely to sorting: **G3-D-04**. |
| **Backuptool lists, marks and extraction** | Checked temporaries, write counts, common restore-control exclusions, and shared tar/ZIP skip construction fit together in the shown code. The member-name verifier and extraction tools still need a joint test for aliases such as `./storage/...`, repeated separators, and member types. The packet does not establish their complete write-set agreement. |
| **Backuptool versus boot recovery** | New marks carry `roms-mounted=...`; old marks remain on the conservative waiting path. The new `no` exception mistakes historical mount absence for current path identity: **G3-D-07**. |
| **Persistent logs and common redaction** | Installation and boot ordering are shown; per-family stamps support devices that already ran the earlier cloud-only scrub. The truncated-line transformation requires the full-filter proof in **G3-D-09**. A stamp cannot compensate for an inadequately scrubbed file. |
| **Capture age gate and capture lock** | The retry carries the original timestamp; the two shown guards reject an over-age exit capture. The interface’s 120-second gate and full publication path are absent. The stage optimization independently regresses oversized cleanup: **G3-D-05**. |
| **Proxy readiness, stamps and pending notifications** | Both shown `head_game_id` implementations agree textually. Failed nonzero-cache measurements become `unknown`; the interface’s interpretation is not supplied. The notification lock’s fallback defeats its own serialization: **G3-D-03**. |
| **OAuth state, remote configuration, browser and phone** | Session IDs and predecessor-state checks strengthen state ownership. Field records add a loading/open distinction and are cleared on resets/page transitions. Full asynchronous callback and marker behavior is outside the diff; remote rollback is already unverified in the shown code: **G3-D-06**. |
| **VM cleanup and inherited artifacts** | After the initial stamp, retired VM files are selected by recorded bytes rather than name alone; matching reintroduced files can re-arm rescue-mask cleanup. The historical file bodies needed to verify the embedded expected hashes are absent. The host socket cleanup has **G3-D-08**. |
| **Other fork changes** | GStreamer checks now require the loader’s exact sonames to resolve before and after pruning. The rotation lexer changes protect quoted driver text and numeric separators, but generated tables are absent. RetroArch’s entry-identity approach requires the unembedded config-library lifetime/replacement behavior; its added header explicitly distinguishes the newer unproven implementation from earlier guest runs. |

These seams were judged against fail-closed checks, artifact-based success, and preservation of inherited state—not comments asserting those properties. `[EP, UP, RC]`

## 4. Refutations attempted by source tracing

These were **not executed tests**.

- A failed nonempty pre-cleanup copy no longer reaches the put-back branch: successful copy, comparison and validation are prerequisites.
- CR before a comment or after a value is rejected before comment/assignment handling in all five named readers.
- The original `--pass` fast-path bypass is closed by `passflag`; this does not establish every downstream quoted-value case.
- `/Mine/Backups/.`, `..` components and repeated separators enter the new folder refusal before sibling derivation.
- The new conditional stack keeps `#if 0 / #elif 0` dead and makes `#if 0 / #elif 1` live; a necessarily taken branch suppresses following alternatives.
- An empty failed measurement with nonzero cached work produces `unknown`, not the cache-operation count.
- A failed checked temporary or counted list write cannot use the newly guarded empty-selection path as evidence that nothing needed protection.
- A same-named upstream-era ZIP or symlink prevents use of that destination; `mv -n` success alone is no longer accepted as proof of movement.
- A stale OAuth session ID cannot pass the new owner check; a waiting write cannot overwrite an already failed session through the shown guarded transition.
- A dangling required GStreamer soname fails `-f`; a similarly prefixed filename is no longer sufficient.
- After the retirement stamp, a changed regular VM-quirk file does not match the recorded digest and is retained by the shown branch.

## 5. Coverage boundary and orchestrator gaps

1. **No runtime proof is supplied.** Regression fixtures, failing-before results, target BusyBox runs, generated rotation-table comparisons, candidate upgrade records, screenshots, and `proofs-307` outputs remain unverified.
2. **The diff is not the full implementation.** Important missing surrounding code includes the complete common redactor, restore/revert implementation, OAuth collectors/callbacks/cancellation paths, capture lock/publication helpers, and relevant archive matching helpers.
3. **EmulationStation is a pin here.** Its five named implementation areas, `added=unknown` handling, and capture gate cannot be inferred from the package version.
4. **Hooks and QA tools are outside this path-scoped packet.** Their items are outside, not silently passed.
5. **Upstream changes were noted, not audited:** batteryplus options, kernel-config ordering, Linux packaging, ABL metadata, image dependency changes, and the RAOfflineProxy author-head bump/submodule commentary/patch-offset update. Local ctl changes were reviewed. The pinned proxy’s actual IPv4 binding code was not supplied.
6. **RetroArch proof transfer is not established.** The patch header says the load-entry revision had not yet run on a guest. No later artifact is embedded to supersede that statement.
7. **The rule’s #315 transport description is not implementation evidence.** Its described helper and transport changes are not shown in this diff and were not verified.
8. **The blindspot register and Already-written trace records are absent.** The embedded rules require them, but references to their entries are not the records themselves.
9. **Physical facts remain physical:** Wi-Fi adapter behavior, board boot behavior, real panels and provider-specific OAuth cannot be certified from this corpus. No person’s device was accessed.

### `corpus.provenance.json`

The following is supplied as artifact content; no file was written.

```json
{
  "packet": "all-distribution",
  "review_mode": "Static review of the six embedded sources only",
  "filesystem_access": false,
  "tests_executed": false,
  "independent_file_reads": false,
  "independent_hashing": false,
  "hash_status": "All sha256 values below were verified at embed time by the Council Facilitator and were not recalculated by this auditor.",
  "facilitator_read_timestamp_utc": "2026-09-29T00:18:21Z",
  "source_keys": [
    "D",
    "AC",
    "EP",
    "UP",
    "AP",
    "RC"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/all-distribution.diff",
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/items.md",
    "/workspace/repos/rocknix/.claude/rules/engineering-practices.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/rclone-cloud-sync.md"
  ],
  "source_file_hashes": [
    "eb6d91402aee1bb1f0999cbc76abb5ac43d4ed8b55e7a275bc599d9c2c654f0f",
    "7017bd2d9f3927d24c85f19a21069dd5fe118dee79b732b8b9042c49a488ac97",
    "9a41f84b4bf10534f5e8d1de3c165acafb6937807d98e84017b024076b23bdcd",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "81fbe525fa15c58b4a319b634df16e7ef84492fffeee7ccc97aea381fcc896bd"
  ],
  "missing_sources_and_artifacts": [
    {
      "material": "Regression fixtures and execution outputs required by the acceptance text",
      "impact": "Source mechanisms can be assessed, but full acceptance closure cannot be independently established."
    },
    {
      "material": "Candidate upgrade logs, cloud migration before-and-after listings, proofs-307 outputs, frames, and physical Wi-Fi evidence",
      "impact": "PL-029 and runtime-dependent clauses remain outside this corpus."
    },
    {
      "material": "EmulationStation implementation and tests behind the package pin",
      "impact": "Interface items, unknown-count parsing, and capture-gate behavior cannot be verified."
    },
    {
      "material": "Hook implementations, hook tests, QA tool changes, and rules-check output",
      "impact": "The corresponding tooling and documentation-change items are outside the supplied diff."
    },
    {
      "material": "Unchanged portions of changed source files, particularly the full redactor, recovery implementation, OAuth callbacks, capture helpers, and archive matching helpers",
      "impact": "End-to-end conclusions depending on those callees are explicitly limited."
    },
    {
      "material": "Pinned proxy binding implementation, RetroArch configuration-library implementation, and historical retired-quirk file bodies",
      "impact": "Binding claims, entry-identity assumptions, and expected historical digest values are not independently verified."
    },
    {
      "material": "Blindspot register and Already-written code-trace records",
      "impact": "Full project-conformance and inherited-state proof review is incomplete."
    }
  ],
  "orchestrator_escalation": "Reproduce G3-D-01 and G3-D-04 first, resolve the other source findings, and join this review with the missing primary proof artifacts before closing acceptance."
}
```
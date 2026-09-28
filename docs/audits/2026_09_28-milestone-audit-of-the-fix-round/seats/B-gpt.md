# Packet B — second-round audit

**Recommendation: keep packet B open.** The diff contains substantial, well-targeted fixes, but there are remaining credential-publication and restore-safety defects, including regressions introduced by the fixes. The most important new findings are **G2-B-01, G2-B-02, and G2-B-04 through G2-B-07**.

This is a **static review of the embedded corpus**. I did not access a filesystem, recompute hashes, execute tests, or inspect a running image. The report’s “504 PASS / 0 FAIL” is a reported result, not a result independently reproduced here.

## Citation convention

`[D]`, `[R]`, `[F]`, `[I]`, `[E]`, `[U]`, `[T]`, and `[C]` identify the eight supplied sources, in that order. Their **declared paths and Facilitator-verified embed-time hashes** are recorded together in `corpus.provenance.json` below.

Within `[D]`:

- Bare script names mean files under `projects/ROCKNIX/packages/rocknix/sources/scripts/`.
- `001-functions` means `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`.
- `H` means `tools/last-good-scripts-test`.
- `H/y1`–`H/y4` refer to the named sections in the added hunk `@@ -3011,4 +3033,1123 @@`.

Hunk coordinates below are copied from the embedded diff; they are not reconstructed current-file line numbers.

---

## 1. Punch-item verdicts

The acceptance text in **[I]** is the criterion. “Holds” here establishes the visible mechanism and relevant written assertions, not an independently observed test run.

| Item | Verdict | Evidence and limit |
|---|---|---|
| **PL-003** | **Holds in part** | `join_wifi` reads the PSK using `--escape no` and checks the read before writing. `H/y2` asserts the `:`/`\` round-trip. The acceptance also requires a guest read-back; that evidence is not embedded. `[D, wifictl, @@ -249,18 +330,59 @@]` |
| **PL-004** | **Holds** | `COMPRESSLOCATIONS=("${LOCATIONS[@]}")`, the quoted location loop, and the line-by-line theme collection preserve spaces. `H/y1` checks both `my games/` and `My Theme`. `[D, backuptool, @@ -185,35 +266,271 @@; @@ -286,16 +642,100 @@]` |
| **PL-005** | **Holds for the specified detected-credential case** | `credential_lines` runs before archive creation; a positive count removes staging and returns 5. The caller fails instead of continuing the upload chain. `H/y1` checks the refusal and unchanged previous archive. This does not establish that all populated credentials are detected: see G2-B-07. `[D, backuptool, @@ -508,22 +1019,89 @@; @@ -780,16 +1504,26 @@]` |
| **PL-006** | **Holds for the specified case** | The key scan uses `grep -ciE`, and the pattern includes `password`, `privatekey`, and `clientsecret`. The capitalized-key fixtures are substantive. The quoted-value hole in G2-B-07 remains. `[D, backuptool, @@ -185,35 +266,271 @@]` |
| **PL-007** | **Holds in part** | `snapshot_members` operates on incoming members rather than `LOCATIONS`; the fixture checks an existing file outside the device’s selection and deletion of a newly created file. However, the snapshot deliberately skips members the extractor still applies, and snapshot-list failures can remove protection entirely. See G2-B-04/G2-B-05. `[D, backuptool, @@ -185,35 +266,271 @@; @@ -611,54 +1208,135 @@]` |
| **PL-008** | **Holds** | The configured backup directory is canonicalized as `OWN`, excluded during traversal, and removed from broader selections by a checked filter. The custom-folder-inside-`.config` fixture tests the acceptance directly. `[D, backuptool, @@ -286,16 +642,100 @@]` |
| **PL-009** | **Holds in part** | A tar collection failure returns 2, and only 4 means “nothing exists here.” That fixes the unreadable-file fixture. But failed construction of the snapshot worklist can still return 4; see G2-B-04. `[D, backuptool, snapshot_members in @@ -185,35 +266,271 @@; restore case in @@ -611,54 +1208,135 @@]` |
| **PL-010** | **Holds** | `DEVICEONLY` is included in both tar and ZIP exclusions; backup also holds back the identity files. The ZIP fixture asserts that the device’s `rclone.conf` and ID remain unchanged. `[D, backuptool, @@ -254,6 +571,41 @@; @@ -666,15 +1344,17 @@; @@ -689,42 +1369,47 @@]` |
| **PL-011** | **Holds for an actual write refusal** | `write_setting_line` returns 0 only after `awk && mv`; cleanup is followed by `return 1`. `set_setting` saves and returns that status after releasing the lock. The fixture models an unwritable **directory**, not merely a file with its write bit cleared. `[D, 001-functions, @@ -237,18 +331,31 @@; @@ -332,10 +447,13 @@]` |
| **PL-031** | **Holds** | Activation specifies `ifname "${WIFI_DEV}"`, and success requires `wifi_dev_connection` to return the requested profile on that adapter. `H/y2` models two adapters and checks the activation command and resulting adapter state. `[D, wifictl, @@ -249,18 +330,59 @@]` |
| **PL-035** | **Holds for the stated cases** | An empty sourced list selects `DEFAULT`; existing locations are canonicalized before exact-path credential policy and exclusions. The `/.` fixture checks the archived bytes for the planted key. `[D, backuptool, @@ -185,35 +266,271 @@; @@ -286,16 +642,100 @@]` |
| **PL-036** | **Holds for the stated cases** | ZIP names use the remainder of the listing line, and consumers use `IFS= read -r`. Sanitizer failures and `keep_meta` failures feed `SANITISE_RC`. The spaced-symlink and failing-sanitizer fixtures exercise both mechanisms. `[D, backuptool, @@ -185,35 +266,271 @@; @@ -478,8 +983,12 @@; @@ -689,42 +1369,47 @@]` |
| **PL-037** | **Holds in part** | A seed manifest records pruned defaults; restore adds their targets to snapshot coverage and copies the image’s defaults back. The normal fixture is meaningful. Reading that manifest is nevertheless unchecked, so a failed read can report a completed restore without resetting the edited file. See G2-B-09. `[D, backuptool, @@ -332,15 +772,17 @@; @@ -611,54 +1208,135 @@; @@ -689,42 +1369,47 @@]` |
| **PL-038** | **Holds for the supplied extant-path fixture** | An existing canonical location outside `/storage` sets `OUTSIDE` and returns 6 before writing. `H/y1` creates `/flash/x` and checks the refusal. Note the narrower implementation: nonexistent locations are skipped before this validation. `[D, backuptool, @@ -286,16 +642,100 @@]` |
| **PL-039** | **Holds for an unwritable mark path** | The write, `mv -fT`, first-line read-back, and line-count check are preconditions of extraction. The added directory-at-mark-path fixture also checks that nothing was moved inside that directory. Subsequent overwrite by an incoming archive remains possible: G2-B-06. `[D, backuptool, @@ -611,54 +1208,135 @@]` |
| **PL-040** | **Holds** | The unquoted-value alternative accepts leading `&`/`;`, and the fixture separately checks that the following URL parameter survives. `[D, 001-functions, @@ -72,11 +82,15 @@; H/y3]` |
| **PL-041** | **Holds in part** | PID publication by hard link and re-read/removal under `<lock>.reap` address the demonstrated shell race. The missing-tool fallbacks retain the old unsafe behavior; a directory destination also defeats the new acquisition logic, G2-B-03. The required ES contender test and peer implementation are absent. `[D, 001-functions, @@ -154,11 +168,62 @@; @@ -208,17 +288,31 @@; H/y3]` |
| **PL-044** | **Holds in part** | `restore_default` now checks removal before copying, and the stuck-directory fixture is meaningful. But `remove_checked` mistakes a dangling symlink for absence, allowing the copy after failed removal; see G2-B-14. `[D, factoryreset, @@ -39,10 +39,21 @@; @@ -52,7 +63,11 @@]` |
| **PL-045** | **Holds in part** | With a readable mount table, the mount-table predicate correctly distinguishes an unmounted directory from a same-filesystem bind mount. The unreadable-table fallback reinstates the original unsafe directory test; see G2-B-08. `[D, chksysconfig, @@ -106,18 +106,96 @@]` |
| **PL-046** | **Holds for the stated failed-move case** | `FILTERED` increments only after successful `mv`. A failed replacement causes removal, and a raw original that remains makes filtering fail and prevents archiving. Both branches have assertions. `[D, rocknix-evidence, @@ -100,22 +100,47 @@; @@ -181,16 +218,32 @@]` |
| **PL-064** | **Holds in part** | The boot path promotes a usable `.tmp` only when live and backup are unusable, preserves it on promotion failure, and avoids reseeding through it. The ES load/unit-test half and the complete `valid` implementation are not embedded. `[D, chksysconfig, @@ -126,14 +204,36 @@; @@ -146,6 +246,11 @@]` |
| **PL-077** | **Holds in part** | Two **successful sequential** runs in the same clock second receive different names; both backup and evidence fixtures assert two archives. Concurrent runs are deliberately refused, not both completed. Thus the literal “two concurrent runs leave two archives” interpretation is not met; that acceptance/decision distinction needs explicit closure. `[D, backuptool, @@ -136,6 +169,48 @@; @@ -752,20 +1437,59 @@; rocknix-evidence, @@ -141,9 +166,21 @@; @@ -181,16 +218,32 @@]` |

---

## 2. Follow-up review of every first-audit finding

The claims being assessed are from **[F]** and **[R]**. “Answered” below is scoped to that finding; it does not erase a different defect introduced beside the fix.

### Claude findings

| Finding | Verdict | Diff evidence |
|---|---|---|
| **G-B-01** | **Answered** | The `.backup/.bak/.tmp/.old` copies of stripped or held-back files join `SECRETLIST`; the scan also recognizes backup/config-suffix extensions. `H/y1` checks the archived bytes, not only names. `[D, backuptool, @@ -417,15 +872,37 @@; @@ -185,35 +266,271 @@]` |
| **G-B-02** | **Answered** | `unset SETTINGS_BACKUPS BACKUPFOLDER` makes the legacy fallback reachable. The new sourcing mechanism introduces G2-B-01. `[D, backuptool, @@ -22,11 +26,25 @@]` |
| **G-B-03** | **Answered** | `(^\|[^A-Za-z0-9])sk-` excludes the reported internal `mask-` match; the theme fixture checks a clean backup. `[D, backuptool, CREDENTIAL_TOKENS in @@ -185,35 +266,271 @@]` |
| **G-B-04** | **Answered in part** | Reading mount-table field 2 fixes same-filesystem bind detection, and there are bind fixtures. But inability to read the table falls back to the unsafe directory predicate; see G2-B-08. `[D, chksysconfig, @@ -106,18 +106,96 @@]` |
| **G-B-05** | **Withdrawal does not hold as a correctness closure** | The comment now acknowledges same-boot reuse, which is an improvement. But PID-space size is not an elapsed-time bound, and the code still waits as long as the unrelated reused-PID process lives. This is a proposed risk acceptance, not a refutation. The claimed target `pid_max` is not independently evidenced by an embedded configuration artifact. `[D, 001-functions, @@ -154,11 +168,62 @@]` |
| **G-B-06** | **Answered** | Remaining files **or dangling links** increment `bad`; only zero produces `reverted`. The dangling-link failure fixture exercises this distinction. `[D, chksysconfig, @@ -106,18 +106,96 @@]` |
| **G-B-07** | **Answered for the reported unnecessary forks** | `pass"?[[:space:]]*[=:]` stops `passed`/`bypass` text entering sed. It also introduces the credential bypass in G2-B-02. `[D, 001-functions, @@ -58,12 +64,16 @@]` |
| **G-B-08** | **Answered by a meaningful added assertion** | The mark-path-is-a-directory fixture requires the original file to remain and the directory to remain empty. Removing `-T` would violate the latter assertion. Actual execution under the claimed image binary remains a report claim. `[D, backuptool, @@ -611,54 +1208,135 @@; H/y1, audit G-B-08]` |
| **G-B-09** | **Answered** | `grep -qxF "storage/.config/${REL}" "${MEMBERS}" && continue` gives an actual archive member precedence over a stale seed declaration. `[D, backuptool, @@ -611,54 +1208,135 @@]` |
| **G-B-10** | **Answered** | A failed traversal or grep error makes `credential_lines` return nonzero; its caller refuses publication. Separate walk/read-failure fixtures exist. `[D, backuptool, @@ -185,35 +266,271 @@; @@ -508,22 +1019,89 @@]` |
| **G-B-11** | **Answered for deletion by the trim** | Moving into `archive/upstream-era/` removes these files from the visible one-level trim globs. However, that migration can overwrite an existing quarantine file: G2-B-10. `[D, backuptool, @@ -752,20 +1437,59 @@; @@ -552,11 +1130,20 @@]` |
| **G-B-12** | **Answered for the named default directories** | The checked exclusion filter explicitly removes `/storage/.cache/log/cores/` and `/storage/.cache/log/evidence/`. `[D, backuptool, @@ -286,16 +642,100 @@]` |
| **G-B-13** | **Answered for a failed reap** | Unsuccessful reaps are counted, delayed, and fail after five attempts. The read-only stale-lock fixture tests the reported spin. This does not bound a blocking `flock` call or the accepted live-PID wait. `[D, 001-functions, @@ -208,17 +288,31 @@]` |
| **G-B-14** | **Answered in part / withdrawal not fully verifiable** | The visible caller returns 1 for an empty/nonmatching successful result, so “no saved networks” is not automatically exit 2. The complete `saved_wifi` implementation is not embedded, so the stronger claim that **every** nonzero result means NetworkManager did not answer cannot be established here. `[D, wifictl, @@ -221,15 +266,50 @@]` |
| **G-B-15** | **Answered** | Collection takes a nonblocking folder lock before sweeping `.collect.*`; each new collection gets a private staging directory. `[D, rocknix-evidence, @@ -141,9 +166,21 @@]` |

### GPT findings

| Finding | Verdict | Diff evidence |
|---|---|---|
| **G-B-01** | **Answered for the member-lister failure** | `archive_members` preserves tar status and uses ZIP `pipefail`; restore checks its result before snapshot/extraction. The new failure hole is inside snapshot-list construction, G2-B-04. `[D, backuptool, @@ -185,35 +266,271 @@; @@ -611,54 +1208,135 @@]` |
| **G-B-02** | **Answered for tar-listing failure** | `listed_files` explicitly refuses a failed `tar -tzf` before counting; both callers test the helper’s status. The fixture makes tar print names and then fail. `[D, backuptool, @@ -185,35 +266,271 @@; @@ -508,22 +1019,89 @@]` |
| **G-B-03** | **Answered** | Failed traversal and grep errors cannot return a clean scan count, and the caller refuses publication. `[D, backuptool, credential_lines and its caller, same hunks above]` |
| **G-B-04** | **Answered** | The exclusion filter’s `awk`, count operations, and final move are in a checked failure condition returning 2. It no longer intentionally retains the unfiltered list after a failed filter. `[D, backuptool, @@ -286,16 +642,100 @@]` |
| **G-B-05** | **Answered** | Boot recovery distinguishes successful deletion from surviving files/links before writing `reverted`. `[D, chksysconfig, @@ -106,18 +106,96 @@]` |
| **G-B-06** | **Answered for failed migration** | The upstream-ZIP move occurs before `write_archive`; failed `mkdir` or `mv` ends the backup. Success of an overwriting move is a separate problem, G2-B-10. `[D, backuptool, @@ -752,20 +1437,59 @@]` |
| **G-B-07** | **Answered** | The filtering traversal is materialized and checked; a failed traversal returns 1, and `collect` does not archive after filtering failure. `[D, rocknix-evidence, @@ -100,22 +100,47 @@; @@ -181,16 +218,32 @@]` |
| **G-B-08** | **Answered in part** | Created-file paths now participate in mount readiness, including new-files-only recovery. The unreadable-table fallback still permits acting on an unmounted underlying directory, G2-B-08. `[D, chksysconfig, @@ -106,18 +106,96 @@]` |
| **G-B-09** | **Answered** | Both configuration names are unset before evaluating the legacy fallback. `[D, backuptool, @@ -22,11 +26,25 @@]` |
| **G-B-10** | **Answered by the visible control flow** | Failed promotion sets `kept_tmp`; that branch does not delete the temporary and suppresses reseeding through it. The complete pre-existing `restore` helper is outside the shown hunks. `[D, chksysconfig, @@ -126,14 +204,36 @@; @@ -146,6 +246,11 @@]` |
| **G-B-11** | **Answered for false `forgotten` after a refused clear** | Both setting clears are checked before profile deletion, and the SSID read is checked. A failed clear returns before `echo "forgotten"`. Compensating writes after later failure remain unchecked, and join has related unchecked persistence, G2-B-11. `[D, wifictl, @@ -221,15 +266,50 @@]` |
| **G-B-12** | **Withdrawal does not hold as a correctness closure** | Same reason as Claude G-B-05: a larger PID namespace reduces frequency but does not identify the lock owner or bound a reused-PID wait. `[D, 001-functions, @@ -154,11 +168,62 @@]` |
| **G-B-13** | **Answered** | `keep_meta` returns the chained `stat`, `chmod`, and `touch` result; callers set `SANITISE_RC` on failure. `[D, backuptool, @@ -185,35 +266,271 @@; sanitizer hunks beginning @@ -464,8 +967,10 @@]` |
| **G-B-14** | **Answered for dump serialization** | `LOCKED` must equal 1 before any dump is kept. The new refusal branch leaves an unbounded note-only path, G2-B-12. `[D, rocknix-corekeep, @@ -139,6 +154,32 @@; @@ -152,6 +193,12 @@]` |
| **G-B-15** | **Answered in part** | The sandbox wrapper wiring and banner probes are present. They are conditional on `BB`, whose discovery/provenance is outside the embedded hunks; the actual probe output and target binary are not embedded. The wiring is reviewable, the claimed execution fidelity is not independently established. `[D, H/y4, P7M/bb, p7ev, p7ck, and both G-B-15 probes]` |
| **G-B-16** | **Answered in part** | The named inner `sed`, `grep`, `mkdir`, and `cp` calls now use `to_log`. Staging `mkdir` calls and shell redirections still bypass it, G2-B-13. `[D, backuptool, @@ -464,8 +967,10 @@; @@ -689,42 +1369,47 @@]` |

---

## 3. New findings

These are source-derived failure scenarios, **not experiments I executed**.

### G2-B-01: Reading the backup-folder setting now executes `cloud_sync.conf`

- **Severity:** High
- **Category:** Regression; cross-stream configuration/security contract
- **Where:** `backuptool`, `[D]`, `@@ -22,11 +26,25 @@`.
- **What:** The new reader executes the configuration as shell before validating the resulting path. This contradicts the current rule that `cloud_sync.conf` is never sourced with a command in it.
- **Failure scenario:** A retained configuration contains a normal folder assignment followed by a shell command that writes `/storage/.config/probe`. Starting either backup or restore executes that command with backuptool’s privileges. A later fallback to the standard folder does not undo the side effect.
- **Evidence:** The reader contains `. /storage/.config/cloud_sync.conf >/dev/null 2>&1`; the subsequent `case "${_configured}"` validates only the resulting string. No command-rejecting guard appears in this read. `[C, “What the audit’s fixes changed …”, D-CLOUD-142]` explicitly says commands in this file must not be sourced. A cloud-side validator is not embedded and cannot be presumed to have run before backuptool.

### G2-B-02: The tightened redaction fast path leaks `--pass` arguments

- **Severity:** High
- **Category:** Regression; credential redaction
- **Where:** `001-functions`, `[D]`, `@@ -58,12 +64,16 @@` and `@@ -72,11 +82,15 @@`.
- **What:** The stream-mode sed now recognizes keys ending in `pass`, including command-line flags, but the argument-mode fast-path detector recognizes `pass` only before `=` or `:`.
- **Failure scenario:** `redact_credentials 'launcher --pass qa-value'` takes the fast path and prints the credential unchanged. The same applies to `--RA_Pass qa-value`. These inputs contain neither a `words` match nor a `passkey` match.
- **Evidence:** The new detector is `local passkey='pass"?[[:space:]]*[=:]'`. The sed path explicitly supports `(--?${key})[[:space:]]+...`, while `key` includes `[A-Za-z0-9_.-]*pass`. I looked for a corresponding flag-shaped trigger in `words`, `passkey`, or `marks`; none is present. The new tests cover `Pass=` and innocuous prose, not this argument/stream discrepancy.

### G2-B-03: A directory at the settings-lock path makes every contender acquire it

- **Severity:** Medium
- **Category:** Regression; mutual exclusion
- **Where:** `001-functions`, `[D]`, `@@ -154,11 +168,62 @@`.
- **What:** `ln source destination` treats an existing destination directory as a place to create a link. Its success is therefore not proof that the lock pathname was acquired.
- **Failure scenario:** `${J_CONF_LOCK}` is a directory. Two shells with different PIDs each create their PID file, then successfully link it **inside** that directory. Both set `took=1` and enter the settings writer, sharing `${J_CONF}.tmp` without exclusion.
- **Evidence:** Acquisition is `ln "${J_CONF_LOCK}.$$" "${J_CONF_LOCK}" ... && took=1`, followed by unconditional acceptance of nonempty `took`. There is no directory-rejecting operation or read-back establishing that the lock pathname itself is the newly published PID file. The stale-lock race fixture uses a regular file and does not cover this state.

### G2-B-04: Failure to create the snapshot worklist means “nothing to protect”

- **Severity:** High
- **Category:** Restore safety; guard fails open
- **Where:** `backuptool`, `[D]`, `snapshot_members` in `@@ -185,35 +266,271 @@`; its caller in `@@ -611,54 +1208,135 @@`.
- **What:** Member-list verification was fixed, but construction of the snapshot’s own `KEEP` and `NEWLIST` files remains unchecked.
- **Failure scenario:** Supply a valid member list naming existing settings, and make the `mktemp` inside `snapshot_members` fail once. `KEEP` becomes empty; appends fail; `[ ! -s "${KEEP}" ]` succeeds; the function returns 4. Restore clears `SNAPSHOT` and can extract over existing settings without a snapshot or marker. A later extraction failure can then say the settings are unchanged.
- **Evidence:** `KEEP=$(mktemp)`, `: > "${NEWLIST}"`, and the `printf ... >> "${KEEP}"` operations are unchecked. The empty-worklist branch returns 4 regardless of how the list became empty. There is no successful-list-construction prerequisite before that return. This is the same fail-open class as the original member-lister finding, at the next stage of the pipeline.

### G2-B-05: Extraction applies members that rollback deliberately excludes

- **Severity:** High
- **Category:** Restore/rollback write-set mismatch; legacy compatibility
- **Where:** `backuptool`, `[D]`, `snapshot_members` in `@@ -185,35 +266,271 @@`; extraction in `@@ -666,15 +1344,17 @@` and `@@ -689,42 +1369,47 @@`.
- **What:** Snapshot protection is narrower than the actual extraction operation.
- **Failure scenario:** A legacy ZIP or tar contains an existing `/tmp/kept-before-restore` file as `tmp/kept-before-restore`, alongside normal settings. The snapshot skips that member, but extraction into `/` applies it. If extraction subsequently fails, rollback does not restore that file and can still report “YOUR SETTINGS ARE UNCHANGED.” Legacy directory entries also fall outside the snapshot’s metadata coverage.
- **Evidence:** `snapshot_members` accepts only `storage/*`, explicitly skips `storage/*/`, and protects only live regular files/symlinks. The extractors instead run against the entire archive with an exclusion list: `tar ... -C / -X "${SKIP}"` or `unzip ... -d / -x ...`. No validation rejects unprotected members, and no inclusion list confines extraction to the protected set. ZIP member enumeration itself filters out non-`storage/` entries without preventing their extraction.

### G2-B-06: An incoming archive can overwrite the recovery marker protecting its extraction

- **Severity:** High
- **Category:** Restore control metadata; interrupted-operation recovery
- **Where:** `backuptool`, `[D]`, `@@ -611,54 +1208,135 @@`, `@@ -666,15 +1344,17 @@`, and `@@ -689,42 +1369,47 @@`.
- **What:** The marker is verified before extraction, but it is not protected from extraction.
- **Failure scenario:** An otherwise valid archive contains `storage/.config/.restore-in-progress`, for example a stale marker captured by an earlier broad backup. Restore writes and verifies its fresh marker, then extracts the archived marker over it. Kill the restore before final cleanup. Boot recovery now reads the archived marker, not the fresh snapshot/new-file record, and may fail to recover the interrupted restore despite the correct snapshot still existing.
- **Evidence:** `RESTORE_MARK` is written before extraction. Both complete `SKIP` constructions exclude `SEEDLIST`, credentials, and live symlinks, but not `RESTORE_MARK`. The marker is a regular file when `LINKS` is built, so the symlink rule does not protect it. I found no member validation excluding this control pathname.

### G2-B-07: A quoted password beginning with whitespace passes the credential scan

- **Severity:** High
- **Category:** Residual credential-publication defect
- **Where:** `backuptool`, `[D]`, `CREDENTIAL_KEYS` in `@@ -185,35 +266,271 @@`.
- **What:** The key-pattern test mistakes a populated quoted value whose first character is whitespace for a non-match.
- **Failure scenario:** A custom selection includes an ordinary `.ini` containing `password = " leading-text"`. It is not a specially sanitized file. The key scan does not match; the value contains no fixed-format token; the backup can publish the file unchanged.
- **Evidence:** The value suffix is `[[:space:]]*"?[^"[:space:]]+`. After consuming the opening quote, it requires a non-whitespace character immediately. It cannot consume the leading space inside the quotes. I looked for a second quoted-value parser or value-aware emptiness check; none is present. The existing positive fixtures do not exercise leading whitespace inside quotes.

### G2-B-08: Unknown mount readiness falls back to the predicate that caused PL-045

- **Severity:** Medium
- **Category:** Follow-up regression; recovery guard fails open
- **Where:** `chksysconfig`, `[D]`, `@@ -106,18 +106,96 @@`; `H/y4`, the `PROC_MOUNTS=/nonexistent` fixture.
- **What:** When the mount table cannot be read, an existing underlying directory is treated as sufficient evidence that recovery can act on the ROMs tree.
- **Failure scenario:** `/storage/roms/backup` exists on the internal filesystem, the external/bind ROMs mount is not yet present, and the mount table is unreadable. A new-files-only marker is processed against the underlying directory and reported reverted, although the files on the later-mounted card were never removed.
- **Evidence:** In `under_roms`, an empty `mounted` value falls back to `[ -d "$(dirname "${1}")" ]`, returning “not pending” when the directory exists. That is exactly the directory/mount distinction described by PL-045. The added unreadable-table test actually expects the marker to be consumed and `reverted` to be written. Logging the uncertainty does not make the destructive decision safe. `[E, “Guards must fail closed”]`

### G2-B-09: A failed seed-manifest read still permits a successful restore

- **Severity:** Medium
- **Category:** Artifact verification; partial restore reported as complete
- **Where:** `backuptool`, `[D]`, `@@ -611,54 +1208,135 @@`.
- **What:** The seed manifest has its own unchecked extraction pipeline, outside the newly checked archive-member listing.
- **Failure scenario:** Whole-archive validation and listing succeed, but the subsequent `tar -xzOf` for `.backuptool-seeds` fails or returns only part of the manifest. The remaining extraction succeeds. Omitted seed targets are not reset, so an edited `es_settings.cfg` can remain while the restore completes successfully.
- **Evidence:** The `case "${ARCHIVE_KIND}" ... esac | while ... done > "${SEEDS}"` pipeline is neither checked nor run under `pipefail`. Appending the derived paths with `sed ... >> "${MEMBERS}"` is also unchecked. I looked for a failure branch before `snapshot_members`; none is present. The existing seed fixture covers a complete manifest, not a failed manifest read.

### G2-B-10: The non-destructive legacy-archive migration overwrites quarantine collisions

- **Severity:** Medium
- **Category:** Follow-up regression; upgrade data preservation
- **Where:** `backuptool`, `[D]`, `@@ -752,20 +1437,59 @@`.
- **What:** Moving old ZIPs out of the uploader’s root avoids trimming them, but can replace an older retained ZIP with the same basename.
- **Failure scenario:** `archive/upstream-era/ARCHIVED_ROCKNIX_BACKUP-20-01-01_00_00_00.zip` already contains archive A. The root later contains a different archive B under that same name. The next backup silently overwrites A while migrating B.
- **Evidence:** The migration uses `mv -f "${OLD}" "${ARCHIVEFOLDER}/upstream-era/"`. There is no identity comparison, collision-safe name allocation, or refusal when a different destination already exists. The four-archive fixture uses distinct names and therefore cannot expose this overwrite. `[U, “Migrations: Non-destructive first”]`

### G2-B-11: Joining still updates the SSID/key pair through unchecked independent writes

- **Severity:** Medium
- **Category:** Residual persistence correctness; settings-writer seam
- **Where:** `wifictl`, `[D]`, `@@ -249,18 +330,59 @@`; related compensating writes in `@@ -221,15 +266,50 @@`.
- **What:** Read failures now preserve the pair, but persistence failures do not. PL-011 made settings-write failure observable; join does not use that result.
- **Failure scenario:** The device joins B and reads B’s SSID/key correctly. Writing `wifi.ssid=B` succeeds, then writing B’s key fails. The stored state now pairs B’s SSID with A’s old key, while the function returns `joined`. A later settings-driven connection uses that inconsistent pair.
- **Evidence:** `set_setting wifi.ssid "${ssid}"` and `set_setting wifi.key "${psk}"` are unguarded, followed by `pin_wifi`, `echo "joined"`, and `return 0`. The output can truthfully describe the current connection, but the persistence contract has failed without being reported. The settings shim has a failure switch; the new join fixtures do not exercise a failure between the two writes. Forget’s compensating writes are likewise unchecked.

### G2-B-12: Lock refusal bypasses the core-note ring limit

- **Severity:** Low
- **Category:** Follow-up regression; bounded storage
- **Where:** `rocknix-corekeep`, `[D]`, `@@ -139,6 +154,32 @@` and `@@ -152,6 +193,12 @@`.
- **What:** The new no-lock branch correctly refuses a dump but writes a note and exits without pruning.
- **Failure scenario:** The cores directory is writable but `flock` repeatedly fails or is unavailable. Every crash leaves another `.txt` note; none reaches `prune_ring`, so `CORE_KEEP` no longer bounds this failure path.
- **Evidence:** Note creation precedes `if [ "${LOCKED}" -ne 1 ]; then ... exit 0`. There is no prune in that branch, despite the ring comment saying it runs on every way out. The new test checks one refused dump, not repeated note-only crashes.

### G2-B-13: Shell redirections and staging-directory errors still reach the player

- **Severity:** Low
- **Category:** Incomplete player-text/error-routing fix
- **Where:** `backuptool`, `[D]`, `@@ -441,22 +918,48 @@` and sanitizer hunks beginning `@@ -464,8 +967,10 @@`.
- **What:** `to_log` only captures stderr after the function is entered. It cannot capture failures of redirections performed by its caller.
- **Failure scenario:** Space exhaustion prevents creating a sanitizer’s staging directory or opening its destination file. The console prints a raw `mkdir` or shell error containing the storage path before the intended player sentence.
- **Evidence:** The staging `mkdir -p` calls are unwrapped, and calls such as `to_log sed ... > "${STAGING}/storage/.config/system/configs/system.cfg"` place the output redirection outside `to_log`. The failing-sed fixture tests an error emitted **inside** the invoked command, not failure to establish its output. This leaves the reported G-B-16 sweep incomplete. `[T, outcome vocabulary; E, player-facing failure messages]`

### G2-B-14: A dangling destination symlink is mistaken for successful removal

- **Severity:** Low
- **Category:** Incomplete reset precondition
- **Where:** `factoryreset`, `[D]`, `@@ -39,10 +39,21 @@` and `@@ -52,7 +63,11 @@`.
- **What:** `remove_checked` checks the referent’s existence rather than whether the pathname itself remains.
- **Failure scenario:** The reset destination is a dangling symlink and `rm -rf` fails to remove it. `[ ! -e "${1}" ]` nevertheless succeeds, so `restore_default` reaches `cp` with the destination still present.
- **Evidence:** The entire postcondition is `[ ! -e "${1}" ]`; it lacks the `-L` check used correctly in this same diff’s recovery code. A failed-removal fixture with a dangling link would refute the claimed “failing rm does not reach cp” guarantee. The current fixture uses a surviving directory.

---

## 4. Sweep spot-checks

The following are checks against mechanisms and assertions in `[D]`, not acceptance of the report’s run results.

| Reported fixed row | Assessment |
|---|---|
| **Claude F-BR-08 / GPT F-BR-15** — protect the active pre-restore copy from trimming | **Mechanism holds:** `trim_archive "${SNAPSHOT}"` excludes that exact path before sorting/counting. The future-dated-old-archives fixture exercises the clock-order problem. `[D, backuptool, @@ -552,11 +1130,20 @@]` |
| **Claude F-BR-09** — stage on storage, not RAM | **Mechanism holds:** `mktemp -d "${STAGING_PREFIX}XXXXXX"` uses `/storage/.cache`; the scan reads that tree rather than extracting a second copy. The fixture records directory-creation calls. `[D, backuptool, @@ -441,22 +918,48 @@]` |
| **Claude F-BR-13** — wildcard for every held-back token directory | **Mechanism holds:** the loop builds one `"${D#/}*"` entry per directory. The ZIP fixture adds a second directory and checks both remain absent. `[D, backuptool, @@ -254,6 +571,41 @@]` |
| **GPT F-BR-14** — ZIP payload verification | **Mechanism holds:** `unzip -l && unzip -p` checks payload reading before snapshotting. The fixture corrupts payload bytes while retaining the central directory. Target CRC behavior still needs the reported runtime evidence. `[D, backuptool, archive_ok in @@ -185,35 +266,271 @@]` |
| **GPT F-BR-16** — preserve sanitized-file modes, omit invented directories | **Mechanism holds:** `keep_meta` checks mode/time operations, and the final tar list is `find storage -type f`. The fixture checks mode 0600 and absence of directory members. This fixes new archives, not directory metadata in legacy restores. `[D, backuptool, @@ -508,22 +1019,89 @@]` |
| **GPT F-BR-19** — backup consisting only of sanitized files | **Mechanism holds:** the collector pipeline runs only for a nonempty `SENDLIST`; sanitizer output supplies the member. `[D, backuptool, @@ -441,22 +918,48 @@]` |
| **Claude F-WF-05** — unescape scan names | **Mechanism holds:** the scan now passes through `nm_unescape` before sorting; the fixture distinguishes `Cafe: Guest` from the escaped spelling. `[D, wifictl, @@ -63,12 +68,17 @@]` |
| **Claude F-WF-06 / GPT F-WF-04** — tab in a profile name | **Mechanism holds:** `saved_state` removes only the final tab/state suffix and compares the full remaining name through the environment. `[D, wifictl, @@ -186,6 +196,17 @@]` |
| **GPT F-PB-15** — core ring by time, including refused notes | **Mostly holds:** pruning keys from the right-hand epoch field and includes `.txt` notes. The newly introduced lock-refusal path escapes that bound, G2-B-12. `[D, rocknix-corekeep, @@ -139,6 +154,32 @@]` |
| **GPT F-PB-17** — save-state arguments from argv | **Mechanism holds:** the parser takes the argument following the flag, rather than a substring of the joined ROM command. The misleading-ROM-name fixtures can distinguish old/new implementations. `[D, runemu.sh, @@ -193,38 +197,33 @@]` |
| **Claude F-PB-13** — exclude the disk underlying `/storage` | **Mechanism holds for the modeled device names:** partition ancestry is resolved through sysfs, and the fixtures cover `sda2`, internal MMC, and an additional MMC disk. Aliased/mapper mount sources are not established by these fixtures. `[D, automount, @@ -187,8 +187,20 @@]` |

### Withdrawn or deferred sweep rows

- **F-PB-07:** The visible `awk && mv` control flow would stop on an awk error. The claimed image-awk probes and the full existing test contract are not embedded. “A mid-read EIO could not be constructed” is a coverage limit, not proof that every read failure is safe.
- **F-PB-08, PID-reuse portion:** The original tmpfs rationale does not hold. The revised explanation acknowledges rather than eliminates the issue; explicit risk acceptance is needed, as discussed above.
- **F-PB-10, ANSI stripping:** **Cannot judge.** The cited interface consumer is not embedded.
- **F-PB-14, watchdog:** Routing outside stream B is reasonable ownership handling, **not a technical refutation**. The configuration and SoC behavior are not in this packet.
- **F-PB-17, periodic snapshots:** The report names design intent and scheduling controls, but their source artifacts and performance evidence are not embedded. I cannot either sustain or overturn that withdrawal from this packet.
- **F-WF-04, `WIFI_DEV` guard:** **Cannot independently judge.** The report cites pre-existing lines omitted by the diff.
- **F-WF-09, absence of tests:** The broad “there are no tests” claim is refuted by the visible modifications to existing section u and the added whole-script y2 fixtures. This does not prove exhaustive coverage.
- **F-WF-10, fork references:** The row-label correction is visible. Leaving references for PR preparation is an explicit deferral, not completion of that part.
- **F-BR-12(d), moving `>>> why`:** Deferring a unilateral descriptor change is justified. `[T]` defines these lines as a consumer protocol, and the consumer is outside this packet. A coordinated change would be needed.
- **F-CS-09, installed post-update caller:** **Cannot judge.** Neither the installed caller nor installation recipe is embedded.
- **F-VM-18:** Routing to F1 is an ownership disposition only. Its technical merits remain outside this review.

---

## 5. Seams and integration obligations

| Seam | What must agree | What this packet establishes |
|---|---|---|
| **Settings lock: shell ↔ ES PidLock** | Same PID representation, lock pathname, reaper pathname, serialization, and release ownership rules. | The shell comments and implementation name the expected `.reap` contract. The ES implementation/unit test is absent. Missing-tool degradation and G2-B-03 prevent treating the shell side as unconditionally safe. |
| **`wifictl saved --ssid` ↔ picker** | Three escaped fields; the picker displays/matches SSIDs but sends the **profile name** to join/forget; unflagged two-column output remains supported. | The producer and its assertions are present. The picker’s parser and invocation change are not. The report explicitly says the ES side must switch once it understands the new shape. |
| **Settings writer ↔ Wi-Fi operations** | A failed persistent write must not leave a silently inconsistent SSID/key pair. | `set_setting` now exposes failure; forget consumes some of those failures, join does not. G2-B-11 is a concrete remaining seam defect. |
| **Backuptool ↔ cloud configuration reader** | Configuration must have consistent value semantics and must not execute commands under D-CLOUD-142. | Legacy-name fallback is repaired, but backuptool’s new dot-source contradicts `[C]`. Actual cloud reader/validator code is absent. G2-B-01 requires cross-stream reconciliation. |
| **Backuptool outcomes ↔ interface/transfer chain** | A refusal must stop the settings upload, and `>>> why` must become the intended outcome rather than raw protocol text. | Backuptool returns nonzero on the visible refusals. The actual `&&` composition, UI parser, localization, and display fit are not embedded. The new words appear among the proposed outcomes in `[T]`; vocabulary approval is not a rendered-frame proof. |
| **Restore writer ↔ boot recovery** | First-line snapshot plus `+<path>` entries must describe exactly what extraction may change. | The two new implementations agree on the basic format. G2-B-04/G2-B-05/G2-B-06/G2-B-08 break the protection around that format. The removed old consumer code also shows that an older image ignores new-file removals: “reads line 1” is not full downgrade recovery compatibility. |
| **Backup publication ↔ existing local/cloud archives** | Old credential-bearing archives must not become newly uploadable merely because the new backup is clean. | The report explicitly leaves previously written archives unchanged, and the diff specially relocates `ARCHIVED_*.zip`. The uploader implementation and an upgrade fixture with multiple old root archives are absent. The report’s “Already written” disclosure is not by itself proof that re-publication is prevented. |
| **Shared harness ↔ merged release tree** | Other streams must retain the f/k refusal-test restructuring, u shim changes, and y block. | Those changes are visible and generally strengthen assertions. The final merged harness, raw logs, and image-applet provenance are not embedded, so no merged-suite result is certified here. |

The PID-only-lock decision and downgrade-marker limitation should be recorded as deliberate compatibility/risk decisions if retained; they should not be described as defects disproved by this packet.

---

## 6. Coverage boundary and requests to the orchestrator

The following gaps prevent broader closure:

1. **Complete changed-script contents:** the diff omits relevant existing helpers and control flow, including `saved_wifi`, `get_setting`, `valid`, `restore`, and part of archive rotation.
2. **ES peer code and tests:** PidLock/AtomicFileUtil, the picker’s new three-field parser, maintenance outcome parsing, and the PL-064 load test.
3. **Cloud peer code:** current configuration validation, settings upload/restore selectors, and actual command composition after a backuptool refusal.
4. **Execution artifacts:** raw current/before-fix logs, `BB`/`BB_HOST` discovery and provenance, the actual target BusyBox binary, and `tools/wait-lock-test`.
5. **Integrated runtime proofs explicitly owed by the report:** guest PSK read-back, real NetworkManager renamed-profile output, real boot mount ordering, interrupted restore including new files, lived-in clean backup acceptance, and upgrade rehearsal with a usable `.tmp`.
6. **UI evidence:** English/French consumption of the new outcomes and measured 640×480 frames.
7. **Power-loss durability:** kill/fault-injection fixtures do not establish durability ordering across snapshot, marker, and live-tree writes under actual power loss.

**Orchestrator handoff:** recheck the numbered findings against the complete current files, add the corresponding negative fixtures, and supply the missing peer/runtime artifacts before marking these cross-stream obligations closed. Nothing in this response claims those checks have already run.

---

## `corpus.provenance.json`

The following is the provenance artifact’s content; I have not written it to a filesystem.

```json
{
  "packet": "B",
  "review_mode": "Static review of the embedded read-at-time corpus",
  "source_hash_algorithm": "sha256",
  "hash_verification_actor": "Council Facilitator",
  "hash_verification_basis": "Values declared as verified at embed time in the supplied source headers",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "reviewer_filesystem_access": false,
  "reviewer_re_read_source_files": false,
  "reviewer_recomputed_source_hashes": false,
  "reviewer_executed_tests": [],
  "citation_key_to_source_index": {
    "D": 0,
    "R": 1,
    "F": 2,
    "I": 3,
    "E": 4,
    "U": 5,
    "T": 6,
    "C": 7
  },
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B.items.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/rclone-cloud-sync.md"
  ],
  "source_file_hashes": [
    "ce7a0298ce2ae629427e243535c9c7183bc0a501f885e538325ff0f81440c140",
    "06984c781d54277555cc9bf8464279a79a7c7ca9c4582b0a21ba0cd798a8e126",
    "f03480bf2a5c951f3f5190b12c3eb2a3e7cab391423595d4e50ce1c97efcdff7",
    "979221ee3b4dc5723c27fddf02aac38365b734720a524830033d06f8bf62f5dc",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "62478bddb5b706a91f7d9f6900eeffc46b06a6aacdcfc0d554ba17465035001c"
  ],
  "missing_sources_and_evidence": [
    "Complete changed-script contents, including existing helpers and control flow omitted by the diff",
    "EmulationStation lock implementation and contender tests",
    "EmulationStation Wi-Fi picker parser and invocation for saved --ssid",
    "EmulationStation maintenance outcome consumers, localization, and PL-064 load test",
    "Current cloud configuration validators, settings upload/restore implementation, and interface command composition",
    "Raw reported test logs and the complete target-applet discovery/provenance setup",
    "The target BusyBox artifact and the unchanged wait-lock-test source/results",
    "Final merged multi-stream harness and release-tree execution evidence",
    "Guest, upgrade, boot-order, power-loss, and rendered UI evidence identified in the coverage boundary"
  ],
  "gap_handling": "Missing material was not assigned invented paths, hashes, or contents. Gaps are surfaced to the orchestrator in this audit."
}
```
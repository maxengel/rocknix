## Summary

The patch forces recent uploads on selected WebDAV remotes and otherwise compares local modification time with cloud upload time. The brief’s rclone v1.75.1 dry runs support the ordinary two-second-separated case, but not the assertion that every recent candidate is newer than the cloud. I would hold the candidate for two rollback scenarios: replaying an untouched save from the recent window, and restoring stale cloud bytes over inherited pre-NTP progress. The detector can also read another remote’s vendor when a name contains a dot. Two test assertions need stronger oracles. This is a static review of the embedded corpus; no filesystem reads, hashing, or test execution were performed.

Citations S1–S4 map to the declared paths and Facilitator-verified hashes in the provenance block below.

## Findings

### F-SS-01: The recent window can replay untouched saves over newer cloud progress
- **Severity:** High
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`: hunks `@@ -1703,6 +1730,7 @@` and `@@ -1712,6 +1740,28 @@` (S1).
- **What:** The recent filter is not a verified change set: it includes files from ten minutes **before** the last successful backup. Sending every candidate with `--ignore-times` can replace newer cloud progress with an unchanged local save.
- **Failure scenario:** On an affected WebDAV remote, A successfully backs up game X at 12:00; X’s local mtime is 11:59. The player next uses B, which uploads further X progress at 12:03. A remains running, and the player exits a different game on A at 12:04. The calculated cutoff is 11:50, so A’s untouched X qualifies and overwrites B’s newer cloud head. This requires neither concurrent play nor a wrong clock.
- **Evidence:** The code computes `local age=$(( now - stamp_epoch + 600 ))`, then adds `--ignore-times` whenever that window is active. The supplied v1.75.1 trace establishes unconditional transfer under that flag. **Refutation attempted:** `--backup-dir` retains the displaced cloud copy, but does not prevent the live save from regressing; the replacement mechanism is not a newer-cloud guard. Nothing in the added branch establishes that a candidate changed since its previous upload or checks whether another device advanced it. S2’s progress-preservation rule makes that distinction material.
- **Fix:** Revise A: use B’s guarded comparison for recent candidates while retaining `--max-age`, `--no-traverse`, and copy semantics, or require an actual changed/conflict-checked set before bypassing comparison. Add the sequential two-device case above and require the newer cloud head to remain active. Removing the ten-minute overlap alone does not establish which device changed a file last.
- **Confidence:** high — the counterexample follows from the window arithmetic and the supplied v1.75.1 flag behavior.

### F-SS-02: Startup after upgrade can replace progress left only in an old-dated local save
- **Severity:** High
- **Category:** Upgrade path
- **Where:**  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore`: hunk `@@ -1786,6 +1813,20 @@` (S1).  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`: hunk `@@ -1712,6 +1740,28 @@` (S1).
- **What:** The accepted limitation says an old-dated save may remain unuploaded. The receive-first startup sequence has a stronger consequence: the new restore comparison can replace that save with the stale cloud content the previous bug left behind.
- **Failure scenario:** WebDAV holds version P0, uploaded in 2026. An older image leaves a same-size, further-progress version P1 locally with a pre-NTP mtime in 1970; size-only comparison never uploaded it. After an in-place update, startup restore runs first. The cloud upload time is newer, so P0 replaces the working P1; the following backup no longer sends P1.
- **Evidence:** Restore now appends `--update` and `--modify-window 1s`. The brief’s v1.75.1 observation explicitly says restore transfers when the cloud upload time is later than the local mtime, and the brief specifies receive-before-send startup ordering. S3’s “Every fix answers what was already written” rule applies directly to this inherited state. **Refutation attempted:** The existing `--backup-dir=${replaced_root}/${replaced_stamp}` preserves a rescue copy, so irreversible loss is not demonstrated. It does not preserve P1 as the active save. This finding is the additional receive-side rollback, not a restatement of the accepted backup omission.
- **Fix:** Make the accepted clock limitation non-destructive on automatic receive: an existing save with an untrusted timestamp must not be replaced solely because a cloud upload timestamp is later. Keep the local save active and stage the incoming candidate separately until safe reconciliation is possible. Add an upgrade fixture containing divergent, same-size cloud/local bytes and a pre-NTP local mtime; assert the working progress survives startup, not merely that an archive exists.
- **Confidence:** high — the stated startup order and demonstrated v1.75.1 comparison produce this outcome without relying on an untested one-second boundary.

### F-SS-03: Dotted remote names can read another section’s vendor
- **Severity:** Medium
- **Category:** Correctness
- **Where:**  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`: hunk `@@ -483,6 +483,32 @@` (S1).  
  `projects/ROCKNIX/packages/network/rclone/sources/cloud_restore`: hunk `@@ -926,6 +926,33 @@` (S1).
- **What:** The name validator permits `.`, but the section lookup interpolates it unescaped into a sed regular expression. A missing key in the requested section can consequently be supplied by another matching section.
- **Failure scenario:** Consider these relevant config lines, with connection details omitted:

  ```ini
  [qa.prod]
  type = webdav

  [unrelated]
  type = dropbox

  [qaxprod]
  type = webdav
  vendor = owncloud
  ```

  For `remote_compares_by_size "qa.prod:"`, the type read finds `webdav`. The vendor read also matches `[qaxprod]`, returns `owncloud`, and incorrectly disables the workaround for the first remote, whose omitted vendor should select it.
- **Evidence:** The whitelist contains `A-Za-z0-9_.-`, while both reads use the range `"/^\[${remote}\]/,/^\[/"` and select the first extracted value with `head -1`. **Refutation attempted:** The literal closing bracket prevents `[qa]` from matching `[qa-cloud]`, but does not neutralize the dot inside a name. S315’s ordinary section-name tests do not exercise this collision.
- **Fix:** Match section names literally, or escape every admitted regex metacharacter, and confine key extraction to the requested section. Add the fixture above and require `qa.prod:` to return true while `qaxprod:` returns false.
- **Confidence:** high — this is a direct consequence of the shown sed expressions; no rclone execution is needed to establish the parser error.

### F-SS-04: Round-trip read-back can select a replacement copy instead of the live save
- **Severity:** Low
- **Category:** Test gap
- **Where:**  
  `tools/cloud-round-trip`: hunk `@@ -1417,11 +1417,18 @@` (S1).
- **What:** The new read-back identifies an object by suffix and then takes the first match. That does not establish that the bytes came from the live saves folder.
- **Failure scenario:** A listing contains both `…/Saves-replaced/<stamp>/savestates/recent-probe.state` with the old bytes and `…/Saves/savestates/recent-probe.state` with `RECENT`. If the replacement is listed first, a successful upload fails this assertion. A non-live matching object containing `RECENT` can likewise satisfy the byte comparison without establishing the live object’s contents.
- **Evidence:** The selection uses `.endswith("savestates/recent-probe.state")`, followed by `backend_bytes(paths[0])`. S2 documents the sibling replacement tree, and the backup hunk explicitly relies on keeping replaced cloud copies. **Refutation attempted:** The new `got is None` branch correctly rejects an unreadable result, but does not resolve multiple matching paths. No live-root restriction or uniqueness check appears in the changed selection.
- **Fix:** Resolve the exact live object using the configured saves root and backend prefix. Reject unexpected or ambiguous candidates rather than taking the first suffix match. Test a listing containing both live and replacement paths.
- **Confidence:** high for the selector flaw — actual listing order was not observed and is not assumed.

### F-SS-05: Unaffected-remote assertions accept an absent transfer command
- **Severity:** Low
- **Category:** Test gap
- **Where:**  
  `tools/last-good-scripts-test`: hunk `@@ -12801,6 +12801,89 @@`, S315’s Nextcloud manual-restore and Dropbox deliberate-backup assertions (S1).
- **What:** These assertions test only that flags are absent. An empty recorded command satisfies them, so the individual checks can certify an unchanged command shape without observing a saves transfer.
- **Failure scenario:** `sz_copy` returns no line and `c=""`. Both negated `sz_has` calls succeed, and the following `check $?` reports success for that assertion.
- **Evidence:** The predicate is `! sz_has "${c}" '--update' && ! sz_has "${c}" '--modify-window'`. `${RC}` is included in the failure message, not in the predicate. **Refutation attempted:** Other S315 rows require positive flags and therefore reject empty commands; these two do not. The full `sa_run` implementation is not embedded, so this is not a claim that every such failure necessarily leaves the entire harness green.
- **Fix:** First require a successful script exit and a nonempty saves-transfer command with the expected roots; only then check forbidden flags. Add an empty-argv regression for these assertions.
- **Confidence:** high — the individual predicates’ empty-input behavior is visible directly.

## Refutations

- `[qa]` does not accidentally match `[qa-cloud]`: the section pattern requires the closing bracket immediately after `qa`; ordinary later-section lookup also has an explicit next-header boundary (S1).
- A single trailing colon is removed, and the shown `qa;rm`-style name is rejected before sed runs; the demonstrated name defect is regex matching, not shell-command execution (S1).
- Plain CRLF and trailing value whitespace are accommodated by the unanchored header ending and `tr -d '[:space:]'`; this is a static trace, not a BusyBox execution result (S1).
- An omitted vendor selects the workaround, as required for the wizard case; an unreadable config returns false rather than enabling guessed flags (S1).
- Other types and the explicitly excluded vendor strings bypass the new branches, preserving the manual restore’s existing flag shape when detection is correct (S1).
- Both B branches avoid adding a second **exact** `--update` token when one is already present; alternate spellings and custom option combinations remain unverified (S1).
- A missing successful-backup stamp does not trigger an unconditional full-tree upload: `recent_window` remains zero and selects B. The recent path also retains its copy-forcing behavior (S1).
- A normally dated inherited local save newer than the stale cloud upload is kept on receive and sent on backup under the comparison demonstrated in the brief; F-SS-02 concerns the untrusted-timestamp case.
- Immediate destruction of every version is not established: replacement-copy protection remains. The High findings concern automatic rollback of the active save or cloud head, despite that recovery protection (S1, S2).

## Coverage boundary

**Needed from the orchestrator before release sign-off:**

- **Complete controllers and test helpers.** Only hunks are embedded. Full option assembly and execution, custom `RCLONEOPTS`, full-pass `BACKUPMETHOD=sync`, effective config selection, replacement retention, and the surrounding round-trip isolation cannot be certified from them.
- **Primary rclone v1.75.1 behavior evidence.** The vendor capability list—especially `fastmail`—is asserted but not independently established here. Native config handling of inline comments, indentation and overrides also needs its parser or target observations. The two-second dry runs do not establish behavior at the one-second boundary, with future-dated files, or with server/device clock disagreement.
- **Target execution and inherited-state proofs.** S2 references `proofs-307/X-size-same.sh`, but its contents and results are not embedded. Actual-byte tests, an unaffected-backend run, clean-install coverage, and an upgrade seeded with stale same-size cloud data are still needed. S2 requires more than WebDAV for comparison changes; S3 requires device-tool and upgrade verification.
- **Blindspot-register conformance.** S4 requires it, but the register was not embedded. No complete conformance verdict is claimed.

The inline brief’s measurements are attributed evidence, not commands executed by this reviewer. The missing artifacts have not been assigned invented paths or hashes.

**Content for `corpus.provenance.json`** — not written to disk. S1–S4 correspond, in order, to the parallel path and hash arrays.

```json
{
  "source_access": "Embedded contents only; no filesystem access",
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; values copied from the source headers, not independently recomputed",
  "manifest_read_timestamp_utc": "2026-09-29T00:13:31Z",
  "source_citation_order": [
    "S1",
    "S2",
    "S3",
    "S4"
  ],
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_29-issue-315-size-only-fix/seats/315-size-only.diff",
    "/workspace/repos/rocknix/.claude/rules/rclone-cloud-sync.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md"
  ],
  "source_file_hashes": [
    "c6ae1519abd31188cd2d9259aafa12365ee51514e9c341c433d935119e4d98ed",
    "81fbe525fa15c58b4a319b634df16e7ef84492fffeee7ccc97aea381fcc896bd",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678"
  ],
  "additional_context": "Inline orchestrator brief, including attributed rclone v1.75.1 dry-run observations; not a separately embedded source file",
  "execution_performed": false,
  "missing_sources": [
    "Complete cloud_backup and cloud_restore controllers, full harness helpers, and round-trip/backend helper implementations; only relevant diff hunks were embedded",
    "Primary rclone v1.75.1 WebDAV capability, configuration-parser and comparison evidence, including Fastmail",
    "Referenced byte-level proof contents and execution results, target backend matrix results, clean-install results, and inherited-state upgrade results",
    "Project blindspot register required for complete conformance review"
  ]
}
```
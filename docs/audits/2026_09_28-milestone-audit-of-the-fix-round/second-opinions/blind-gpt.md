### S-01: Migration can treat its destination as a source to delete
- **Severity:** High
- **Where:** Packet[^packet], G2-A-01 (claude, A); O-1 and O-2.
- **What:** Raw string comparisons do not establish that source and destination are different directories. Successful verification and pointer read-back do not protect against copying a directory onto itself.
- **Failure scenario:** `SAVES_REMOTE="/ROCKNIX/Saves/"` is treated as unmoved. If rclone accepts the same-directory copy and check, source deletion targets the destination’s files.
- **Evidence:** The packet reports nine raw comparisons and no `src == dst` refusal in the inspected beginning of `relocate`. It explicitly says the same-directory copy was **not run**. A demonstrated guard or abort before deletion for this spelling would refute the loss scenario.

### S-02: A carriage return lets executable text pass as a configuration comment
- **Severity:** High
- **Where:** Packet[^packet], G2-A-01 (gpt, A); §3.6.5.
- **What:** The validator and bash disagree about where a comment begins. Syntax checking does not resolve that disagreement.
- **Failure scenario:** `EXTRA="x"<CR>#$(cmd)` passes validation, then executes the substitution when sourced.
- **Evidence:** `rest()` accepts `[ \t\r]` before `#`; the packet reports that `bash -n` accepts the line. The prescription search identifies five copies, including both content scripts. Rejection of this input before sourcing at every affected consumer would refute the finding.

### S-03: A failed safety copy can replace the intact configuration
- **Severity:** High
- **Where:** Packet[^packet], G2-A-02 (gpt, A).
- **What:** The recovery branch treats a non-empty temporary copy as a valid backup even when the copy operation itself failed.
- **Failure scenario:** A full card leaves a truncated `.pre-cleanup.$$`. The fallback moves it over the still-valid configuration.
- **Evidence:** The quoted structure is `if cp ... && cleanup && conf_valid; then ... elif [ -s "${pre_cleanup}" ] && mv ...`. Both backup and restore contain it. A prerequisite proving that the safety copy completed and is valid before restoration would refute this path.

### S-04: Reading the backup-folder setting executes unvalidated configuration
- **Severity:** High
- **Where:** Packet[^packet], G2-B-01 (gpt, B).
- **What:** `backuptool` sources `cloud_sync.conf` merely to obtain a setting. The subshell does not contain filesystem or other command side effects.
- **Failure scenario:** A configuration containing a command executes it during backup initialization, before the resulting folder string is checked.
- **Evidence:** The packet quotes `. /storage/.config/cloud_sync.conf` inside `_configured=$(...)` and states that this reader has no validator gate. A data-only parser, or a demonstrated safe validation gate before execution, would refute the finding.

### S-05: Snapshot worklist failures are mistaken for “nothing to protect”
- **Severity:** High
- **Where:** Packet[^packet], G2-B-04 (gpt, B); §3.6.5.
- **What:** Failure to construct the snapshot member list can produce the same return value as a legitimately empty list.
- **Failure scenario:** `mktemp` or an append fails. Restore receives return 4 and extracts without protecting existing files.
- **Evidence:** `KEEP=$(mktemp)` and the appends are unchecked; `[ ! -s "${KEEP}" ]` returns 4 regardless of why the list is empty. The broader search also identifies unchecked temporary creation elsewhere. Demonstrated abortion before extraction on creation and append failures would refute this finding.

### S-06: Extraction writes members outside the snapshot’s coverage
- **Severity:** High
- **Where:** Packet[^packet], G2-B-05 (gpt, B).
- **What:** Snapshot enumeration and extraction use different archive-member boundaries.
- **Failure scenario:** A foreign or legacy archive contains `tmp/...`. Extraction writes it under `/`, but rollback has no corresponding protected member.
- **Evidence:** `archive_members` filters `^storage/`; extraction uses `tar -xzf ... -C / -X "${SKIP}"`, with an equivalent unrestricted unzip operation. A pre-extraction rejection of outside members, or snapshot coverage matching every extracted member, would refute the finding.

### S-07: An archive can overwrite its own recovery controls
- **Severity:** High
- **Where:** Packet[^packet], G2-B-06 (gpt, B); §3.6.5.
- **What:** Writing and checking the restore marker before extraction is insufficient when extraction can overwrite that marker or the snapshot it names.
- **Failure scenario:** An older broad archive contains `storage/.config/.restore-in-progress`. Extraction replaces the fresh recovery record with stale contents, defeating subsequent rollback.
- **Evidence:** The marker is written before extraction but absent from the skip list. The prescription check identifies the snapshot’s own path as another unprotected control. Enforced exclusion or rejection of both controls in every extraction format would refute this finding.

### S-08: The target BusyBox accepts a damaged stored ZIP member
- **Severity:** Medium
- **Where:** Packet[^packet], BS-3; PL-070.
- **What:** Neither of the tested BusyBox operations establishes ZIP integrity for stored members.
- **Failure scenario:** A damaged stored member passes validation and is accepted as a usable archive.
- **Evidence:** The packet reports the image’s BusyBox 1.36.1 returning 0 for both `unzip -t` and `unzip -p` on the damaged stored member. Deflated-member failures do not cover this case. A target-image verification path that rejects that stored-member corruption would refute the finding.

### S-09: Quoted credentials beginning with whitespace evade the publication scan
- **Severity:** High
- **Where:** Packet[^packet], G2-B-07 (gpt, B); O-4.
- **What:** Failing closed on scanner errors does not prevent false negatives in the credential pattern.
- **Failure scenario:** A custom included configuration contains `password = " leading-text"` and is published because its credential is not recognized.
- **Evidence:** The recorded probe containing that line and `password = "plain"` returns a count of 1; the leading-space line does not match. A publication guard that detects this exact value form and prevents archive publication would refute the finding.

### S-10: Flag-form passwords bypass the shell redactor
- **Severity:** High
- **Where:** Packet[^packet], G2-B-02 (gpt, B).
- **What:** The fast-path detector recognizes fewer credential forms than the redactor is intended to handle.
- **Failure scenario:** A command containing `--pass value` or `--RA_Pass value` is logged through this helper without masking its password.
- **Evidence:** The recorded calls return `launcher --pass qa-value` and `x --RA_Pass qa-value` unchanged, while `pass=qa-value` is masked. Passing those flag forms through the actual logging path with complete masking would refute the finding.

### S-11: An escaped inner quote exposes the remainder of a password
- **Severity:** High
- **Where:** Packet[^packet], G2-E-core-01 (gpt, E-core).
- **What:** The enclosing-quote parser tests an inner closing quote before handling its escape.
- **Failure scenario:** Redacting `sh -c 'tool --password "front\" back"'` leaves `back` outside the masked range.
- **Evidence:** The packet places `if (c == inner) inner = 0` before the relevant backslash handling; the earlier double-quote escape applies only to a double-quoted enclosure. A parser trace or test showing the entire password masked under this single-quoted enclosure would refute the finding.

### S-12: Previously logged cloud passwords remain persistent
- **Severity:** High
- **Where:** Packet[^packet], BS-1; PL-074.
- **What:** Removing secret-bearing output from future log messages does not remove credentials already stored on upgraded devices.
- **Failure scenario:** A device that previously encountered a failed remote creation retains the plaintext password in `cloud_sync.log`.
- **Evidence:** `/var/log` is bound to persistent `/storage/.cache/log`; the change removes future rclone output, and the packet reports no existing-log scrub. Demonstrated remediation of previously written affected lines would refute the residual exposure.

### S-13: Dot components bypass cloud-tier separation
- **Severity:** High
- **Where:** Packet[^packet], G2-C-04 (gpt, C); O-16.
- **What:** The collision check operates on path spellings rather than their normalized locations. O-16’s claim that the collision set is complete is therefore unsupported.
- **Failure scenario:** `/Mine/Backups/.` is accepted as the saves folder, while derived backups and content become children of that same folder.
- **Evidence:** The recorded call returns 0, and the packet gives the derived `/Mine/Backups/Backups` and `/Mine/Backups/Content` paths. Normalization followed by separation checks—or rejection of dot components—before deriving siblings would refute this finding.

### S-14: Credential-hook inspection errors permit the operation
- **Severity:** High
- **Where:** Packet[^packet], G2-E-tests-01 / G2-I-02; §3.6.5.
- **What:** The hooks erase the distinction between “no secret found” and “the inspection failed.”
- **Failure scenario:** An invalid pattern or unavailable pipeline tool prevents scanning, but a credential-bearing commit or push is permitted.
- **Evidence:** With a valid pattern, the recorded scratch test refuses the commit; with `SECRET_PATTERNS='['`, grep and sed report errors and the hook exits 0. The search finds the pattern in both repositories’ hooks. Explicit failure propagation, tested separately from a legitimate no-match result, would refute the finding.

### S-15: Audit-packet filenames provide an unchecked credential-scan bypass
- **Severity:** High
- **Where:** Packet[^packet], G2-I-01.
- **What:** The exemption trusts a path name as proof that its contents have already been scanned.
- **Failure scenario:** A packet contains work from an unpushed branch, or receives an appended credential-bearing line, and is then committed and pushed without inspection.
- **Evidence:** Both hooks skip `docs/audits/*/seats/*.diff`; nothing verifies the comment’s asserted provenance. That this audit’s branches were merged does not validate the general exemption. Content-bound proof of prior inspection, or removal of the exemption, would refute the finding.

### S-16: Configuration readers disagree about duplicated keys
- **Severity:** Medium
- **Where:** Packet[^packet], BS-2.
- **What:** Setup reads the last assignment, while automatic cleanup preserves the first. Cleanup can therefore change the effective setting that setup displayed.
- **Failure scenario:** The hub names one cloud folder, then the next automatic operation cleans the file and uses another.
- **Evidence:** `conf_get` uses `tail -n 1`; the cleanup script explicitly keeps “only the first occurrence.” Consistent duplicate semantics, or rejection before either consumer uses the file, would refute this finding.

### S-17: The hardened grammar rejects a valid option form without a shown compatibility decision
- **Severity:** Medium — compatibility gap
- **Where:** Packet[^packet], G2-A-05 (claude, A); O-3.
- **What:** The new validator rejects an otherwise valid shell assignment used to express quoted rclone options. The packet does not establish whether that form was intentionally unsupported or how existing configurations are handled.
- **Failure scenario:** A hand-edited configuration with `RCLONEOPTS="--exclude \"*.tmp\" --progress"` can no longer be used.
- **Evidence:** The recorded `conf_valid` result is 1; shipped defaults do not contain this form. A documented pre-existing restriction, or demonstrated safe migration preserving the intended options, would resolve the compatibility finding.

### S-18: An unreadable mount table makes rollback fail open
- **Severity:** Medium
- **Where:** Packet[^packet], G2-B-08 (gpt, B); O-5; PL-045.
- **What:** The fallback treats an existing parent directory as sufficient to stop waiting for the real mount.
- **Failure scenario:** The mount table cannot be read and the unmounted backing directory exists. Revert can proceed against the wrong filesystem and consume recovery state prematurely.
- **Evidence:** The quoted fallback is `[ -d "$(dirname ...)" ] || return 0; return 1`, interpreted in the packet as “not waiting” when the parent exists. A fail-closed unreadable-table path that preserves the marker would refute this finding.

### S-19: Moving an upstream-era archive can overwrite an older archive
- **Severity:** Medium
- **Where:** Packet[^packet], G2-B-10 (gpt, B).
- **What:** The move permits replacement by basename rather than preserving both archives or reporting a collision.
- **Failure scenario:** `upstream-era/` already contains an older ZIP with the same name as `${OLD}`. The move destroys the older copy.
- **Evidence:** The inspected operation is `mv -f "${OLD}" "${ARCHIVEFOLDER}/upstream-era/"`. A preceding collision guard, or a demonstrated unique-destination invariant, would refute this scenario.

### S-20: Recovery’s fallback does not enforce the computed whole-record condition
- **Severity:** Medium
- **Where:** Packet[^packet], G2-E-core-04 (gpt, E-core); O-12.
- **What:** The inspected fallback selects a backup on usability rather than the separately computed completeness condition.
- **Failure scenario:** When recovery reaches that branch, a truncated backup containing plausible key-values can be selected as the recovery base.
- **Evidence:** The packet reports `backupWhole` computed at the quoted line 308, but selection at line 370 uses `backupOk && isUsableKeyValues(backup)`. An earlier dominating completeness check, or a test proving partial backups cannot reach this selection, would refute the finding.

### S-21: Save-state COPY remains outside the transfer lock
- **Severity:** Medium
- **Where:** Packet[^packet], G2-E-app-01 (claude, E-app); PL-068.
- **What:** The inspected lock protection belongs to DELETE, not `runCopy`. Demonstrating DELETE refusal does not establish COPY safety.
- **Failure scenario:** A shell-started cloud transfer overlaps a save-state copy, so the copy observes or modifies files while the transfer is active.
- **Evidence:** The packet identifies `runCopy` after the delete’s lock logic and says it takes no lock and cannot wait on `transferGone`. A shared guard protecting COPY’s complete operation would refute the finding.

### S-22: The BIOS-only journey branch ignores selection-record failure
- **Severity:** Medium
- **Where:** Packet[^packet], G2-E-app-02 (claude) / G2-E-app-03 (gpt); O-7.
- **What:** A branch that ignores the selection write’s result is not covered by O-7’s checked-record assurance.
- **Failure scenario:** The record cannot be saved, but the branch invokes completion. A later resume cannot rely on the selection having been recorded.
- **Evidence:** The packet’s read of `GuiMenu.cpp:4211-4215` says it writes the selection, ignores the result and calls `onDone()`. A checked failure path preventing completion would refute this finding; the packet does not demonstrate the later resume consequence.

### S-23: Generator preprocessing treats false `#elif` branches as live
- **Severity:** Medium
- **Where:** Packet[^packet], G2-F2-01 (gpt, F2).
- **What:** Both generators’ preprocessing logic ignores the `#elif` expression when no earlier branch was taken.
- **Failure scenario:** Under `#if 0` followed by `#elif 0`, definitions from dead code enter generated rotation data.
- **Evidence:** The quoted assignment is `stack[-1] = 'gone' if stack[-1] in ('one','gone') else 'live'`. Correct expression evaluation, or an enforced input restriction excluding this shape, would refute the finding. No shipped-core failure is demonstrated.

### S-24: A failed readiness comparison is not shown to fail the caller
- **Severity:** Medium — error-propagation gap
- **Where:** Packet[^packet], G2-D-02 (gpt, D); O-14.
- **What:** O-14 establishes a helper failure on an unreadable comparison, not an end-to-end failure. The caller read leaves a reported fallback to cache-operation counts unresolved.
- **Failure scenario:** Readiness comparison fails, but the displayed “made ready” count comes from cache operations instead.
- **Evidence:** The packet reports `ADDED`/`MADE` assignments inside `&&` chains at the two quoted call sites and alleges operation-count substitution. A checked caller failure branch that aborts or reports the count as unknown would refute this scenario.

### S-25: Attempt ownership alone does not make cancellation final
- **Severity:** Medium — state-transition gap
- **Where:** Packet[^packet], G2-C-03 (gpt, C); O-8.
- **What:** Preventing an old attempt from writing over a new attempt does not prevent a late success from changing a closed state belonging to the same attempt.
- **Failure scenario:** The user closes the current attempt as collection finishes. A same-attempt `signed-in` write can undo the terminal state.
- **Evidence:** The inspected success call is `write_owned(self.attempt, status="signed-in")`; the packet explicitly identifies “a close without a new attempt” as the gap. A terminal-state check, or guaranteed attempt invalidation on close, would refute this scenario.

### S-26: The listener predicate rejects a potentially reachable dual-stack listener
- **Severity:** Medium — conditional defect
- **Where:** Packet[^packet], O-15.
- **What:** Rejecting `::` is not equivalent to rejecting listeners unreachable through IPv4 loopback.
- **Failure scenario:** The proxy listens on `::` with `bindv6only=0`. PPSSPP can reach it through `127.0.0.1`, but the predicate reports no suitable listener.
- **Evidence:** O-15 explicitly identifies this kernel behavior and asks whether the proxy ever binds `::`. Its actual bind implementation is not embedded. An enforced IPv4-only bind invariant would make the shipping scenario inapplicable; otherwise a reachability-aware predicate is needed.

### S-27: The age-based capture escape has no shown save-consistency proof
- **Severity:** Medium — safety gap
- **Where:** Packet[^packet], O-6; §3.5, capture gate × capture lock.
- **What:** The demonstrated bounded refusal does not establish that a capture older than 120 seconds is finished or unable to write.
- **Failure scenario:** A capture waits on A’s lock past the age threshold. A relaunch is allowed, then the capture acquires the lock while the game is modifying saves.
- **Evidence:** O-6 says an old capture “stops holding launches”; the interaction audit explicitly leaves a capture blocked on A’s lock untested. Proven termination, a shorter enforced capture deadline, or safe cancellation before release would refute this scenario.

### S-28: The harness can print PASSED with required checks skipped
- **Severity:** Medium
- **Where:** Packet[^packet], BS-4.
- **What:** The summary distinguishes failures from successes but does not distinguish completed verification from missing prerequisites.
- **Failure scenario:** A host lacks pinned tarballs, skips the affected checks and still reports `PASSED`.
- **Evidence:** The final verdict tests only `FAIL == 0`; the packet identifies 23 D skip branches and one C branch. It also reports **zero skips in run 69**, so this does not invalidate that run. A verdict that accounts for required skipped checks would refute the finding.

### S-29: The upgrade rehearsal can accept the previous boot’s completion
- **Severity:** Medium
- **Where:** Packet[^packet], BS-5.
- **What:** The wait condition has no demonstrated current-boot boundary.
- **Failure scenario:** Autostart never completes after the tested boot, but a persistent “Autostart complete” line from an earlier boot satisfies the wait immediately.
- **Evidence:** The rehearsal searches `/var/log/boot.log`; autostart appends to that persistent file and does not truncate it. A boot identifier, saved read offset or equivalent current-run boundary would refute the finding.

### S-30: Named integration proofs are missing for the candidate
- **Severity:** Medium — verification gap
- **Where:** Packet[^packet], §§3.5–3.6.
- **What:** The packet does not support treating clean-image and harness results as proof of the kept-device upgrade and remaining endpoint-dependent journeys.
- **Failure scenario:** A defect specific to retained `/storage` state, a real WebDAV migration or a real Wi-Fi interface remains undiscovered.
- **Evidence:** The packet reports no upgrade rehearsal on `1b0d233657`, migration proof in harness cases rather than on a guest, missing E1/E2 follow-up proofs and the runner’s “3 NOT RUN.” Wi-Fi used a stand-in without an adapter. Candidate-specific artifacts covering those scenarios would close the gap.

### S-31: The documented redaction example prints the secret back
- **Severity:** Medium
- **Where:** Packet[^packet], G2-I-10; §3.6.5.
- **What:** The example captures the credential value and then reinserts that entire capture before appending stars.
- **Failure scenario:** A developer follows the rule’s example and publishes a log that still contains the original secret.
- **Evidence:** The quoted replacement is `\1***`, while group 1 includes `[^ ]*`, the value. Correcting session memory or the proof runner does not correct the rule. A documented expression and test showing the original value absent would refute this finding.

## Acceptance checks not reached by the supplied reads

The packet supplies no acceptance-specific demonstration for the following named checks; a whole-suite `PASSED` does not identify their individual outcomes. Shared items are listed once.

- **A:** PL-012, PL-020, PL-021, PL-025, PL-027, PL-028, PL-051, PL-052, PL-066, PL-067, PL-071, PL-079, PL-080.
- **B:** PL-003, PL-004, PL-006, PL-010, PL-011, PL-031, PL-035, PL-036, PL-037, PL-038, PL-040, PL-044, PL-046, PL-077.
- **C:** PL-016, PL-017, PL-018, PL-047, PL-048, PL-049, PL-050.
- **D:** PL-055, PL-058.
- **E1/E2:** PL-014, PL-054, PL-056, PL-062, PL-063, PL-065, PL-069, PL-072, PL-075, PL-078.
- **F1/F2:** PL-002, PL-019, PL-022, PL-023, PL-032, PL-033, PL-034, PL-042, PL-043, PL-073, PL-076.

Other items have relevant **partial** reads without their specified acceptance scenario—for example, PL-015’s root path, PL-053’s late-added file, PL-060’s failed image pass and PL-064’s whole `.tmp` with no backup. These are evidence limitations, not assertions that the tests or fixes do not exist.[^packet]

[^packet]: `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/second-opinions/blind-packet.md` — sha256 `94f565b7f7d32483acf85d2fda695ea53b00ed6062ff5e13090abc7a9752d7d4` (**verified at embed time** by the Council Facilitator).

## `corpus.provenance.json`

```json
{
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/second-opinions/blind-packet.md"
  ],
  "source_file_hashes": [
    "94f565b7f7d32483acf85d2fda695ea53b00ed6062ff5e13090abc7a9752d7d4"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; not independently recomputed by this reviewer.",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T15:06:15Z",
  "read_basis": "Embedded source text only. No filesystem access, independent file re-reading, re-hashing, or command execution.",
  "gaps_for_orchestrator": [
    "The proxy's actual bind implementation or enforced bind configuration is not embedded; it is needed to resolve S-26's shipping applicability.",
    "The supported configuration-syntax contract and compatibility decision are not embedded; they are needed to resolve S-17.",
    "The packet reports missing candidate upgrade, guest migration, and E1/E2 follow-up proofs. Their artifacts are not embedded.",
    "The brief refers to 81 acceptance items, but the embedded criteria contain 80 distinct identifiers, PL-001 through PL-080. Reconcile the inventory or supply the additional acceptance text.",
    "No paths, hashes, or contents have been invented for missing material."
  ]
}
```
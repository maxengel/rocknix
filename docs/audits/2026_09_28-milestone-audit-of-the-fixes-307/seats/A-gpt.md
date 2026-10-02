# Stream A audit — changes required

The targeted fixes are mostly present, but the packet does **not** support an unqualified “every item resolved.” The most important remaining problems are destructive migration guards, unchecked pointer writes, capture commits proceeding without their lock, and a config validator that still permits executable shell text.

This is a **static review of the embedded diff and harness**, not an execution report. I inspected the supplied hunks and assertions; I did not run tests, access files, or independently verify the report’s PASS counts.

Citations **[D], [H], [P], [R], [E], [U], [K], [T]** identify the exact embedded paths and Facilitator-verified hashes recorded in `corpus.provenance.json` below. Hunk headers are taken directly from the diff.

## 1. Per-punch verdicts

“**Holds**” below concerns the specified acceptance mechanism visible in the packet; it is not certification of a complete image or UI flow.

| Item | Verdict and evidence |
|---|---|
| **PL-001** | **Holds for the backend acceptance.** `match_plan_one` captures the listing status separately; the preview writes a plan; apply reads and consumes it, rejects changed verbs or increased counts, and supplies the preview’s count to `--max-delete`. See `cloud_content_restore`, hunks `@@ -556,24 +593,58 @@`, `@@ -586,15 +657,73 @@`, `@@ -636,6 +765,27 @@`, and `@@ -660,22 +810,62 @@`. A1 checks failed listings, changed verbs, count growth, missing plans, and reuse. Its changed-verb fixture tests **sync → remove**, rather than the acceptance’s **remove → sync**, but the inequality in the code covers both. UI retry integration remains unverified. [D; H, A1; P, PL-001] |
| **PL-012** | **Holds in part.** `--all` now enumerates systems and adds BIOS, giving each transfer the correct filter root. However, only the canonical ROMs enumeration is checked for failure; the added legacy enumerations can fail silently and produce a successful incomplete or empty restore. See **G-A-07** and `@@ -1042,7 +1282,56 @@`. The round-trip assertions were added, but no execution artifact is embedded. [D; H, A2; P, PL-012] |
| **PL-020** | **Holds for the specified truncated-defaults case.** The helper checks the defaults append and requires the exact catch-all before installation. Both saves consumers check supplied rules files using `grep -qx -- '- /\*\*'`. See `cloud_sync_helper`, hunks `@@ -87,8 +109,15 @@` and `@@ -98,19 +127,66 @@`; backup `@@ -1345,6 +1451,30 @@`; restore `@@ -1436,6 +1554,30 @@`. A3 checks the resulting files and transferred artifacts, not just messages. [D; H, A3; P, PL-020] |
| **PL-021** | **Holds for clock-skew retention.** Remote and local replacement pruning pin this run’s directory; archive retention excludes `uploaded_names` before counting older archives. See backup `@@ -1220,13 +1314,25 @@`, `@@ -1902,7 +2056,16 @@`; restore `@@ -1266,16 +1358,42 @@`. A4 seeds future-dated competitors and checks that the replaced bytes survive. [D; H, A4; P, PL-021] |
| **PL-025** | **Holds for the forward nesting acceptance.** The same exclusions govern saves discovery and the relocation file list, and backups move first. See migration `@@ -55,11 +152,21 @@`, `@@ -249,34 +428,67 @@`, and `@@ -285,39 +497,55 @@`. A5 checks all tier destinations and absence of nested copies. Repair/read compatibility for clouds already mis-migrated is not established; see the coverage boundary. [D; H, A5; P, PL-025] |
| **PL-026** | **Holds in part.** Each destination is compared with its own source, and pointer writes occur before source deletion. But pointer-write **success** is not required before deletion. The intended checkpoint can therefore fail while the migration proceeds. See **G-A-02**, migration `@@ -96,26 +205,75 @@`. A5’s kill-between-copies test does not exercise a failed config write. [D; H, A5; P, PL-026] |
| **PL-027** | **Holds for new listing failures.** `list_or_stop` distinguishes listed, absent, and unreadable states; the root probe stops the migration before presence checks on failure. See migration `@@ -44,9 +44,106 @@` and `@@ -193,6 +357,21 @@`. A5 checks unchanged pointers and retained source files. Already-repointed, unmoved clouds are a separate unresolved upgrade-evidence gap. [D; H, A5; P, PL-027] |
| **PL-028** | **Holds.** Both main functions now fold the settings result into an overall saves result of `0` **or** `9`. See backup `@@ -1969,8 +2134,15 @@` and restore `@@ -1849,21 +2024,28 @@`. A6 checks exit, stamp, outcome text, and that the saves phase actually returned 9. [D; H, A6; P, PL-028] |
| **PL-030** | **Holds for the script half.** `--set-systems` validates all parsed names before writing; both content readers discard invalid old selection lines. See restore `@@ -998,29 +1213,54 @@`, backup `@@ -351,9 +376,13 @@`. A7 checks refusal and unchanged selection contents. The C++ shell-quoting half is not embedded and cannot be certified here. [D; H, A7; P, PL-030] |
| **PL-052** | **Holds for the relative-argument defect.** `retire_rel` rejects anything not beginning with `${ROOT}/`, and accepted unlink paths are rebuilt from root plus relative path. See capture `@@ -406,13 +450,16 @@` and `@@ -422,10 +469,12 @@`. A8 distinguishes the cwd file from the saves-root file. This is lexical containment, not proof against symlink traversal. [D; H, A8; P, PL-052] |
| **PL-053** | **Holds in part.** Copy, check, and deletion share a filename list, so a newly added **pathname** survives. That does not protect a newer version written to an already-listed pathname after verification. See **G-A-03**. A5 tests only the new-name case. [D, migration `@@ -96,26 +205,75 @@`; H, A5; P, PL-053] |
| **PL-066** | **Holds for status propagation.** A failed game-list pass replaces a successful/no-transfer main-pass result in both directions. See backup `@@ -562,19 +599,32 @@` and restore `@@ -1090,19 +1379,32 @@`. A9 verifies that the ROM can arrive while the unit correctly fails. The resulting partial-progress/offline stamp still has a gap, **G-A-08**. [D; H, A9; P, PL-066] |
| **PL-067** | **Holds in part.** The commit and stamp attempt to acquire a capture-specific lock, but continue after acquisition failure or the five-second timeout. Consequently serialization is not guaranteed. See **G-A-04**. A8’s four-second holder stays inside the successful-acquisition case. [D; H, A8; P, PL-067] |
| **PL-070** | **Holds for the named fallback defect.** A failed supported `unzip -t` is no longer rescued by `unzip -l`. See backup `@@ -642,16 +661,50 @@`. A10 exercises that distinction. This is not a general integrity guarantee: the supplied report explicitly acknowledges BusyBox’s lack of CRC checking. [D; H, A10; R, PL-070; P, PL-070] |
| **PL-071** | **Holds for propagation of `migrate_content`’s result.** Main captures `content_rc`, reports the incomplete tier, and returns the failure rather than printing “Done.” See migration `@@ -285,39 +497,55 @@`. A5 checks nonzero exit and unchanged content pointer. Migration verification and persistence failures identified below remain separate defects. [D; H, A5; P, PL-071] |

### Additional coordinator items represented in the delivery

These appear in the delivered diff/report, although they are not separate punch headings in the embedded A plan.

- **PL-015 — holds for the described script change.** The helper writes an empty content root for an upgraded top-level `/GAMES` saves path; existing derived values are not rewritten; backup warns about either nested tier. See helper `@@ -287,13 +377,28 @@`, backup `@@ -1089,22 +1174,31 @@`, and A14. The setup-side restrictions are outside this packet. [D; H; R]
- **PL-051 — holds in part.** The tested command-substitution forms are rejected, and content scripts no longer source the config. The broader non-execution guarantee is false, and the replacement text parser changes some valid existing configurations silently. See **G-A-05** and **G-A-06**. [D; H, A15; R]

## 2. Findings

### G-A-01: Migration can accept failed verification as “zero differences”

- **Severity:** High
- **Category:** Fail-open verification / data loss
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout`, hunks `@@ -96,26 +205,75 @@` and `@@ -127,7 +285,7 @@`.
- **What:** Both `relocate` and `resumable` ignore the exit status of `rclone check` and use an unbounded substring match:
  ```sh
  out=$(rclone check ...)
  ... | grep -q "0 differences found"
  ```
  The string `10 differences found` also matches.
- **Failure scenario:** Ten source files change after copying but before verification. Verification reports ten differences and fails. The substring guard nevertheless accepts it; relocation updates the pointer and deletes the listed source files, leaving the nonmatching destination copies.
- **Evidence:** The complete shown relocation proceeds from this text test to `set_pointer` and `rclone delete`. Neither shown function requires a successful check status or an exact numeric result. A5 contains no failing-check fixture whose output still matches this substring. This is a **surviving guard defect**, not a newly introduced grep expression. Require successful verification and test nonzero results containing both `10 differences found` and a misleading zero-difference line. [D; H, A5; E, “Guards must fail closed”]

### G-A-02: Pointer-write failure does not stop source deletion

- **Severity:** High
- **Category:** Recoverability / unchecked persistent state
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout`, hunk `@@ -96,26 +205,75 @@`, `set_pointer` and its caller in `relocate`.
- **What:** `set_pointer` does not check `sed -i` or append success; it proceeds to “Now using…”. `relocate` does not check its return before deleting the source.
- **Failure scenario:** Cloud copying and verification succeed, but `/storage/.config` is full or read-only. The pointer stays at the old path, while the old cloud files are deleted. The device is again pointed at an emptied location—the state PL-026 was meant to prevent.
- **Evidence:** The sequence is:
  ```sh
  set_pointer "${key}" "${dst#*:}"
  say "Removing the old ${what} folder..."
  ... rclone delete "${src}" ...
  ```
  No successful-write gate or read-back of the installed pointer appears between them. A5 tests process interruption with writable configuration, not failed pointer persistence. The source must remain until the pointer has demonstrably landed, and a failed write must propagate. [D; H, A5; E; U, “Migrations”]

### G-A-03: The migration’s filename snapshot does not protect newer versions

- **Severity:** Medium
- **Category:** Concurrent-writer data loss
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout`, hunk `@@ -96,26 +205,75 @@`.
- **What:** `--files-from-raw` constrains deletion by **name**, not by the version that was copied and verified.
- **Failure scenario:** After successful verification of `savefiles/gb/A.srm`, another device writes a newer `A.srm` into the old layout. The deletion list still names that path, so the migration deletes the newer version. Its destination contains only the earlier version, absent independent provider history.
- **Evidence:** The persisted list contains paths; deletion receives that list without a conditional version check. The added `/var/run/cloud_sync.lock` is device-local, not exclusion of another device’s writer. A5 adds `LATE.srm`, a previously unlisted name, and therefore cannot catch this case. Add a post-check **replacement of an existing listed file**. A safe resolution must address remote version identity or retention, not merely add another non-atomic check. [D; H, A5; U, “Another device may be syncing at the same time”]

### G-A-04: Capture deliberately commits after failing to acquire its lock

- **Severity:** Medium
- **Category:** Concurrency / fail-open guard
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_capture`, hunks `@@ -192,6 +199,37 @@`, `@@ -212,6 +250,8 @@`, and `@@ -1470,6 +1535,9 @@`.
- **What:** `capture_lock` returns failure after five seconds, or on open failure. Both the commit path and `finish` call it without checking the result.
- **Failure scenario:** A slow capture holds the lock through GC or storage delays. Two waiting captures time out and proceed under detection alone; both can observe the same manifest identity before either renames. One commit can overwrite the other, and stamp updates are again racing.
- **Evidence:** The timeout branch explicitly closes fd 8 and returns 1; the call sites are bare `capture_lock` followed by the protected operations. There is no fail-closed branch. A8’s holder lasts four seconds, so it proves waiting but not timeout safety or two-capture serialization. Acquisition failure must prevent publication/GC or trigger a bounded retry—not authorize the unlocked operation. [D; H, A8; E]

### G-A-05: `conf_valid` is still not a non-executing config validator

- **Severity:** High
- **Category:** Shell execution from configuration
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`, `cloud_restore`, and `cloud_sync_helper`; respective hunks `@@ -877,19 +938,43 @@`, `@@ -939,19 +1005,43 @@`, and `@@ -122,13 +198,29 @@`.
- **What:** Rejecting `$(` and backticks does not exclude executable shell syntax. In particular, the continuation branch bypasses subsequent shape checks with `next`.
- **Failure scenario:** An otherwise valid config contains:
  ```sh
  RCLONEOPTS="--progress \
  "; touch /ctl/pwned; : ""
  ```
  This is valid Bash. Neither line contains the forbidden substitution forms. The first establishes continuation; the second passes the shown continuation branch. Sourcing it executes `touch`.
- **Evidence:** The decisive branch is:
  ```awk
  cont { if ($0 ~ /\$\(|`/) exit 1; cont = ($0 ~ /\\$/); next }
  ```
  Thus the counterexample does not depend on unseen fallthrough validation. A15 checks only substitution/backtick payloads. This refutes the patch’s stated “nothing in it runs when it is sourced” guarantee; it is not a claim that an embedded UI generates this exact payload. Treat configuration as data, or enforce a grammar that cannot contain commands. [D; H, A15; E]

### G-A-06: The new content config parser silently changes valid existing paths

- **Severity:** Medium
- **Category:** Upgrade compatibility / wrong destination
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup`, hunk `@@ -97,7 +97,22 @@`; `cloud_content_restore`, hunk `@@ -98,7 +100,22 @@`.
- **What:** `conf_get` accepts only an entire line matching its restricted optional-double-quote pattern. It does not distinguish an absent key from a present value it cannot parse.
- **Failure scenario:** An existing valid Bash configuration contains:
  ```sh
  CONTENT_REMOTE="/ROCKNIX/Content" # chosen folder
  ```
  Previously sourcing read `/ROCKNIX/Content`. The new regex emits nothing, leaving `CONTENT_REMOTE=""`, which means the remote root. A backup can now write to a different namespace. Single-quoted values also lose their former shell interpretation: the quote characters are retained as data.
- **Evidence:** The regex ends immediately after the optional closing quote, and only the extracted value—not whether parsing succeeded—is validated. An empty value is expressly supported as the remote-root configuration. A15 tests unsafe substitutions, not safe legacy syntax. Support the existing safe forms or refuse an unparseable present key explicitly; do not silently reinterpret it as missing. [D; H, A15; U, “Read both, write the new one”]

### G-A-07: `--all` still reads failed legacy enumerations as an empty cloud

- **Severity:** Medium
- **Category:** Fail-open discovery / false completion
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore`, hunk `@@ -1042,7 +1282,56 @@`.
- **What:** `ALL_ROMS` has a checked status, but the subsequent `${ROOT}` and `${LEGACY_ROOT}` directory listings run inside pipelines/process substitution whose failures are not propagated.
- **Failure scenario:** The canonical `ROMs/` folder is genuinely absent, and a known system exists in a supported older layout. That older-layout listing fails transiently. Enumeration produces no systems, BIOS is absent, and the new branch records success with “Nothing to restore”.
- **Evidence:** The two fallback `rclone lsf` calls feed `sed`, `grep`, and `sort` into `mapfile`; neither status is captured. Empty `DIRS` then calls `record_outcome content-restore 0`. A2 injects failure only into the canonical ROMs listing. Every discovery source needed to declare “all” complete must distinguish absence from inability to read. [D; H, A2; E]

### G-A-08: Partial transfers within the first unit still stamp a bare offline skip

- **Severity:** Medium
- **Category:** Outcome correctness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_backup` and `cloud_content_restore`; backup hunks `@@ -201,11 +216,20 @@`, `@@ -562,19 +599,32 @@`, `@@ -586,6 +636,7 @@`; corresponding restore progress and transfer hunks.
- **What:** `PROGRESS_MADE` becomes 1 only after the **whole unit** succeeds. It does not record files already moved by a subsequently failed unit.
- **Failure scenario:** The first unit’s main copy transfers ROMs successfully. Its game-list pass then loses the network. PL-066 now correctly makes the unit fail, but `stop_no_network` still sees zero progress and writes a bare 69. The row consequently says skipped despite files having arrived. A single main copy that transfers some files before failing has the same problem.
- **Evidence:** Assignment to `PROGRESS_MADE=1` is in the successful-unit branch after failure handling. Conversely, a no-transfer success can set it even when nothing moved. A28 tests progress in an earlier completed unit; A9 already supplies the “main copy succeeded, game-list failed” half of the missing combined fixture. Progress must reflect transferred/deleted artifacts, not merely unit completion. [D; H, A9/A28; T, outcome vocabulary]

### G-A-09: Root-level backup now overwrites without the required recovery record

- **Severity:** High
- **Category:** Data protection / unapproved safety exception
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`, hunk `@@ -1430,9 +1560,24 @@`.
- **What:** For `SAVES_REMOTE=""` or `/`, the fix removes `--backup-dir` and continues. It resolves the overlap failure by abandoning the one-cycle record, with only a non-console warning.
- **Failure scenario:** Such a backup replaces the cloud’s differing save with this device’s copy. The replaced version is not preserved by this implementation, so the protection supplied to other layouts is absent precisely when it could be needed.
- **Evidence:** The branch clears `replaced_root`, adds no backup directory, and logs with console output `"false"`. A22 verifies replacement and the warning, but never verifies preservation of the old bytes. No alternative recovery store or approved exception is in the packet. This conflicts with the supplied last-known-good rule; an orchestrator-supplied decision could settle whether an exception was authorized. Otherwise retain recovery protection or refuse with an actionable explanation rather than silently weakening it. [D; H, A22; E, last-known-good state]

### G-A-10: Nested game lists still make scan and transfer describe different sets

- **Severity:** Medium
- **Category:** Counting / tier consistency
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore`, hunk `@@ -836,10 +1048,13 @@`, together with `@@ -1090,19 +1379,32 @@`.
- **What:** Cloud filtering recognizes a game list as game content only when `n == 2`, i.e. directly under the system. Transfers exclude `**/gamelist.xml` from the ROMs pass at every depth.
- **Failure scenario:** The cloud contains `scummvm/title/gamelist.xml`, where `title` is not a media directory. In ROMs-only mode the transfer leaves it behind, but the cloud scan counts it as ROM content. A restore can therefore still be followed by a “different” scan.
- **Evidence:** The classification remains:
  ```awk
  game = (n > 2 && seg[2] ~ dirs) || (n == 2 && f == "gamelist.xml")
  ```
  while the transfer explicitly excludes both root and nested game lists. A26 tests nested README and save-folder cases, not a nested game list. The all-depth transfer rule must also govern counting. [D; H, A26; T, tier definitions]

### G-A-11: The added backend-features query bypasses the migration’s bounds

- **Severity:** Medium
- **Category:** Bounded failure / incomplete test guard
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout`, hunk `@@ -193,6 +357,21 @@`.
- **What:** The new `rclone backend features "${remote}"` call receives neither the listing options nor the transfer options, and no enclosing production deadline is visible in the packet.
- **Failure scenario:** The feature query stalls. The migration waits there before it can choose its safe `--download` fallback, outside the bounds added to its other cloud calls.
- **Evidence:** The call is a bare pipeline into `tr` and `grep`. A5’s “every rclone call … carries a bound” assertion expressly excludes `backend features`, along with `listremotes` and `version`. That exclusion cannot prove the added query bounded. Apply the appropriate bound and add a hanging-query test. Which real backends can stall during this query requires provider/runtime verification; the missing supplied bound is directly visible. [D; H, A5; E, “A failure ends, and ends soon”]

### G-A-12: Migration failure text incorrectly promises unchanged destinations

- **Severity:** Low
- **Category:** Player-facing truthfulness
- **Where:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_migrate_layout`, hunk `@@ -96,26 +205,75 @@`.
- **What:** Both copy-failure and verification-failure messages say “Both folders are as they were.”
- **Failure scenario:** A copy completes some files and then fails, or copying succeeds but verification fails. The destination has changed, although the source has not been removed.
- **Evidence:** The messages follow copying, and the failure branches remove only the temporary list; no rollback restores the destination’s previous state. A5’s injected copy failure occurs before the copy runs, so it cannot expose the misleading partial-copy sentence. Say that the old files were kept and some files may already be in the new folder. [D; H, A5; E, graceful failure; T, truthful partial outcomes]

## 3. Sweep spot-checks

These are independent checks of the shown mechanisms, not acceptance of the report’s runtime claims.

| Sweep row | Static result |
|---|---|
| **claude F-CS-04** | **Holds for the visible changes.** `pause` suppresses console sleeps under `--yes`; `first_remote` avoids the normal `listremotes` start; skipped-phase summaries are explicit. A12 covers these paths. [D, `cloud_restore`; H, A12] |
| **claude F-CS-08** | The clean-marker mechanism does avoid the repeated clean-to-clean sweep, as A13 checks. Failure of the sweep itself is not tested by that fixture; it should not be described as comprehensive cleanup verification. [D, restore `@@ -1266,16 +1358,42 @@`, `@@ -1486,9 +1633,13 @@`; H, A13] |
| **claude F-CS-11** | **Holds for the upgrade fixture.** Before the marker exists, rules below the exact catch-all are retained as inert comments; later additions can be promoted. A17 checks both generations. [D, helper `@@ -66,11 +63,36 @@`; H, A17] |
| **claude F-CS-18** | **Holds narrowly for the live files and `.bak`s.** `cmp` avoids replacing settled files. “Writes nothing” is too broad: candidate files are still written, and the rules marker is touched on the equal-content path. A18 checks live inode/mtime/size and backups, not total flash writes. [D, helper comparison branches; H, A18; R] |
| **claude F-CS-20** | The clock query visibly uses `timeout -s KILL 2`, addressing inherited ignored TERM. A8 tests the timeout scenario, but the target-tool coverage limitation below applies. [D, capture `@@ -734,8 +787,14 @@`; H, A8] |
| **claude F-CS-21** | **Holds.** The two settings listing/size calls now use `RCLONE_LIST_OPTS`; A20 distinguishes those from configured transfer options. [D; H, A20] |
| **claude F-CS-23** | **Holds in part.** Locking, option arrays, and hashless `--download` selection are present. Verification/persistence defects and the unbounded feature query remain: **G-A-01–03, G-A-11**. [D; H, A5] |
| **claude F-CS-24** | **Holds in part.** Earlier completed-unit progress is represented, but within-unit progress is not: **G-A-08**. [D; H, A28] |
| **claude F-CS-25** | The overlap workaround is implemented, but its loss of recovery protection needs resolution: **G-A-09**. [D; H, A22] |
| **gpt F-CS-20** | **Holds for the shown fix.** Failed record writes now return failure; failed transfers use `--no-write`. A23 checks absence/presence of the actual record. [D, `cloud_saves_root` and callers; H, A23] |
| **gpt F-CS-21 / F-CS-22** | **Hold for the named cases.** Quarantine cleanup requires a valid replacement manifest; adoption requires the same unit; empty adoption returns 3. A8 checks the relevant manifest artifacts and result. [D, `cloud_capture`; H, A8] |
| **gpt F-CS-26** | **Holds for actual deletion counts in the supplied case.** `match_count` uses Deleted log entries and pre-listed sizes rather than preview totals. A24 deliberately makes one deletion fail. ES recovery wording is not supplied. [D; H, A24] |
| **gpt F-CS-29 / F-CS-35** | **Hold for the targeted cases.** The first-cut options migration writes 90 seconds directly; archive fallback prefers dated names. [D; H, A19/A21] |
| **gpt F-CS-30** | **Holds in part.** The README/save-directory corrections are present; nested game-list inconsistency remains, **G-A-10**. [D; H, A26] |
| **gpt F-CS-34** | **Partial, as the report acknowledges.** The visible automatic wrapper refuses calls after the deadline, and the settings-only probe is moved after deadline initialization. Content-transfer stall ceilings remain open. A29 is not proof of bounds for every command or every script. [D; H, A29; R] |

The additional `.fla` exclusion fix is present in the relevant transfer/counting predicates and A25 checks preservation of the save. The `Listed` progress dimension is present in both saves wrappers; A30 is a constructed progress-stream test, not a measurement of a real large remote listing. [D; H, A25/A30]

### Withdrawals

- **claude F-CS-12:** **Cannot judge the policy justification.** The report invokes D-CLOUD-042 and D-CLOUD-040, but the decision-register rows and full original finding are not embedded. [P; R]
- **claude F-CS-22:** **Cannot judge the claimed intentional `.bak` lifetime.** D-CLOUD-079 is not supplied. The report’s statement is not sufficient to establish an exception to the supplied last-known-good rule. [R; E]
- **claude F-CS-27:** **The stream-ownership reason holds.** `package.mk` is excluded by A’s ownership list. That is a handoff, not proof that the dependency issue is resolved; the recipe and F2 delivery are absent. No recipe edit in A means no A-specific `pkgcheck` obligation arose. [P; D; K]
- **gpt F-CS-28:** **Cannot judge the decision-based withdrawal.** D-CLOUD-072 and D-CLOUD-136 are not embedded. The LAN/default-route tradeoff needs those actual decisions, not the report’s characterization of them. [P; R]

## 4. Coverage boundary and integration gates

1. **Only diff hunks, not complete post-change scripts, are supplied.** Full discovery helpers, portions of config loading, migration main’s earlier branches, and several outcome/cleanup callees are outside the packet. Their behavior must not be inferred from names or comments.

2. **The reported run totals are not independently established.** The report says 508 PASS lines and 94 baseline failures. The embedded harness lets me inspect assertions, not reproduce or authenticate those runs. The complete harness prefix, raw runs, binary provenance, and `cloud-capture-stamp-test` contents are absent. [H; R]

3. **The sandbox is not an image execution proof.** It mounts the host `/usr` and supplies BusyBox wrappers for a selected applet list. That list omits, among others, `cp`, `mv`, and `timeout`; these calls therefore use host tools in the shown sandbox setup. This particularly limits the target proof for atomic-file operations and the new timeout invocation. The upgrade rule explicitly calls for the device’s implementations, including `cp` and `mv`. [H, sandbox setup; U, target-tool verification]

4. **Already-written migration damage remains an explicit gate.**
   - Archives/content left under `Saves/backup` and `Saves/Content`.
   - Pointers advanced by an old failed listing while files remained in the old locations.

   A5 tests the different state “files moved to the correct destinations, pointers not updated.” It does not test these two damaged states. The report acknowledges leaving the first in place and not detecting the second. The packet supplies no new repair or demonstrated legacy reader for them. Full readers or upgrade fixtures are needed before claiming parity for those users. [D; H, A5; R, PL-025/027; U]

5. **ES integration cannot be signed off here.** Missing evidence includes shell quoting, stamp parsing, French strings, per-unit protocol consumers, and MATCH preview/apply/retry behavior. In particular, apply consumes its plan before operating, while the supplied UI rule describes TRY AGAIN as re-running the same command. A retry must obtain a fresh preview rather than repeatedly invoke a now-planless apply. This is an integration question, not a claim that the unseen ES implementation is unchanged. [D; T]

6. **Provider behavior is not proven by the alias remote.** WebDAV/S3 verification, directory markers, cleanup, interrupted operations, and concurrent remote writers need provider-backed fixtures. The report’s requested VM round-trip and upgrade rehearsals remain unproven in this packet. [H; R]

7. **Missing governing sources:** `docs/decision-register.md` and `.claude/rules/rclone-cloud-sync.md` were referenced by the plan but not embedded. They are needed for the policy withdrawals and any proposed recovery-record exception. No path/hash has been fabricated for an unseen ES implementation or run artifact.

## 5. `corpus.provenance.json`

The arrays below are positional: each citation key corresponds to the path and SHA-256 at the same index. Hashes are the values **verified by the Facilitator at embed time**, not hashes computed by this review.

```json
{
  "access_mode": "embedded read-at-time corpus only",
  "filesystem_access": false,
  "independent_rehash_performed": false,
  "test_execution_performed": false,
  "hash_algorithm": "sha256",
  "hash_verification": "Verified by the Council Facilitator at embed time; values copied from the supplied source headers.",
  "declared_manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "citation_keys": [
    "D",
    "H",
    "P",
    "R",
    "E",
    "U",
    "K",
    "T"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/A.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/A.harness.txt",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/A.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/A.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "5649c169c83ab366312c7c21512265e6690f8efbcb1853dffde3e826e3dde263",
    "f0a61f9193e43b250fa41a2c562f953182d4d50e3f02f32e5a55a7683508fe9b",
    "70d70f2f955926210863deaa8dee50d9d1c4abc68e5dc38bccd7534b6c2cb97a",
    "98bd201f30609aff2ed26ffcf95feb766ee03d712cdef0c978be8620af178e3f",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7"
  ],
  "review_scope": "All embedded A.diff hunks, their related harness assertions, the plan, the report as claims, and the four embedded rule files.",
  "missing_sources": [
    {
      "path": "docs/decision-register.md",
      "status": "Not embedded; no hash supplied.",
      "needed_for": "Independent validation of decision-based withdrawals and any exception to last-known-good recovery requirements."
    },
    {
      "path": ".claude/rules/rclone-cloud-sync.md",
      "status": "Not embedded; no hash supplied.",
      "needed_for": "Subsystem-specific constraints referenced by the plan."
    },
    {
      "description": "Complete post-change scripts and complete harness outside the supplied hunks/block.",
      "status": "Not embedded as complete files.",
      "needed_for": "Unshown callees, earlier guards, target-tool selection, and upgrade-reader behavior."
    },
    {
      "description": "Raw test runs, VM/provider results, image binary provenance, and upgrade-rehearsal artifacts.",
      "status": "Not embedded.",
      "needed_for": "Independent runtime acceptance and verification of reported totals."
    },
    {
      "description": "EmulationStation consumers, retry flow, quoting changes, and locale changes.",
      "status": "Not embedded; no standalone source paths or hashes supplied for these implementations.",
      "needed_for": "Cross-component and player-facing integration acceptance."
    }
  ]
}
```
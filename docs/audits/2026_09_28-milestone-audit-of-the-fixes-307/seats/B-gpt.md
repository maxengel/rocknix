# Stream B audit — request changes

The normal-path fixes are largely visible in the diff, but **“every punch item resolved” is not supported**. Several safety checks still fail open: unsuccessful enumeration can become “nothing to protect,” unsuccessful verification can become “verified,” and boot rollback can announce success while files remain.

This is a **static review of the embedded corpus**. I inspected the supplied diff and harness assertions; I did not run tests, access files, recompute hashes, or independently verify the report’s PASS counts. Failure scenarios below are proposed reproductions, not experiments I performed.

Citations `[D]`, `[H]`, `[P]`, `[R]`, `[E]`, `[U]`, `[K]`, and `[T]` resolve to the exact declared paths and Facilitator-verified SHA-256 values in `corpus.provenance.json` below. Hunk coordinates are copied from `[D]`; they are not invented whole-file line numbers.

## 1. Per-punch verdicts

“**Holds**” means the supplied code implements the specified acceptance mechanism—not that device execution has been independently established.

| Item | Verdict | Diff evidence |
|---|---|---|
| **PL-003** | **Holds** | `wifictl`, hunk `@@ -249,18 +283,59 @@`: the PSK read uses `--escape no`; successful PSK and SSID reads gate settings updates. Failed reads no longer become an empty key. Actual guest round-trip remains unverified here. |
| **PL-004** | **Holds** | `backuptool`, hunks `@@ -185,35 +263,224 @@`, `@@ -286,16 +592,86 @@`, and `@@ -509,21 +934,80 @@`: quoted array copies, `find "${CANON}"`, checked walk status, and `STAGED` versus `SENT + SANITISED` implement the space-path and collection-count acceptance. Archive verification has a separate defect, **G-B-02**. |
| **PL-005** | **Holds in part** | `write_archive` now checks credentials before creating the publishable archive and returns 5 on a positive result. But inability to complete the scan can still permit publication: **G-B-03**. |
| **PL-006** | **Holds** | `backuptool`, hunk `@@ -185,35 +263,224 @@`: `grep -ciE "${CREDENTIAL_KEYS}"` handles case-insensitive keys; the token scan covers the additional specified formats. Translation-directory exclusions replace the earlier case-based exemption. This does not resolve scan-execution failures. |
| **PL-007** | **Holds in part** | `snapshot_members` uses incoming members rather than `LOCATIONS`; `NEWLIST`, the marker’s `+<path>` records, and `revert_restore` cover newly created files. Failed incoming enumeration, failed snapshot verification, and boot cleanup handling remain unsafe: **G-B-01, G-B-02, G-B-05, G-B-08**. |
| **PL-008** | **Holds in part** | `backuptool`, hunk `@@ -286,16 +592,86 @@`: direct selections inside `OWN` are skipped, and broader selections are filtered. The broader-selection filter’s failure is not a refusal: **G-B-04**. |
| **PL-009** | **Holds in part** | `snapshot_members` distinguishes return 4 from errors 2/3, and restore aborts on the latter. However, a failed incoming-member listing can still produce return 4; failed snapshot listing can still produce return 0: **G-B-01, G-B-02**. |
| **PL-010** | **Holds** | `DEVICEONLY` names the cloud config and both identity records; both tar and ZIP exclusion lists include it. Backup hold-back also adds the identity records. See hunks `@@ -254,6 +521,41 @@`, `@@ -382,6 +764,15 @@`, and both extraction hunks. |
| **PL-011** | **Holds** | `001-functions`, hunks `@@ -237,18 +300,31 @@` and `@@ -332,10 +416,13 @@`: `awk && mv` gates success, failure explicitly returns 1, and `set_setting` returns the saved writer status after releasing the lock. Some changed callers still ignore that status: **G-B-11**. |
| **PL-031** | **Holds** | `wifictl`, hunk `@@ -249,18 +283,59 @@`: activation includes `ifname "${WIFI_DEV}"`, and `wifi_dev_connection` must name the requested profile before `joined`. Two-adapter execution is not demonstrated by this packet. |
| **PL-035** | **Holds** | Empty sourced selections fall back to `DEFAULT`; existing selected paths are canonicalized before membership checks. See the quoted-array and canonical-walk hunks in `backuptool`. |
| **PL-036** | **Holds in part** | ZIP names are recovered with `substr(...)` and consumed with `IFS= read -r`; sanitizing `sed`/`grep` results are inspected. But failure of the member-list producer itself remains unchecked: **G-B-01**. |
| **PL-037** | **Holds** | `SEEDED` records pruned paths, the archive carries `SEEDLIST`, restore adds eligible seed targets to the snapshot members, and copies the current image’s seeds afterward. Old archives without that manifest remain readable; they cannot recover omission information they never recorded. |
| **PL-038** | **Holds** | `backuptool`, hunk `@@ -286,16 +592,86 @@`: an existing canonical location outside `/storage` sets `OUTSIDE` and returns 6; the backup dispatcher prints the specified refusal. This covers the plan’s `/flash/x` acceptance fixture. |
| **PL-039** | **Holds** | `backuptool`, hunk `@@ -611,54 +1114,124 @@`: marker creation, `mv -fT`, first-line read-back, and line-count verification are prerequisites to extraction when a protection record exists. **G-B-01** can incorrectly prevent such a record from being required. |
| **PL-040** | **Holds** | `001-functions`, hunk `@@ -72,11 +78,15 @@`: the unquoted-value alternative now consumes leading `&`/`;`, while retaining a delimiter for subsequent URL parameters. |
| **PL-041** | **Holds in part** | PID-before-publication via `ln` and serialized reaping via `.reap` address the supplied two-shell race when those tools work. The fallback deliberately restores the old unsafe behavior; the same-boot PID-reuse dismissal is false: **G-B-12**. The C++ half is not embedded. |
| **PL-044** | **Holds** | `factoryreset`, hunk `@@ -52,7 +63,11 @@`: failure of `remove_checked` returns before `cp -rf`. The PortMaster unpacked directory receives the same gate. |
| **PL-045** | **Holds in part** | A nonempty snapshot path under the ROMs root now requires `mountpoint -q`. The new marker form with only created-file paths bypasses that check: **G-B-08**. |
| **PL-046** | **Holds in part** | `filter_tree` counts a replacement only after successful `mv`, removes failed files, and rejects an unremovable raw file. It still ignores failure to enumerate the files requiring filtering: **G-B-07**. |
| **PL-077** | **Holds** | Backup/restore operations sharing a backup directory are serialized by directory `flock`; occupied current backup names advance the timestamp. Evidence uses private `mktemp` staging and non-clobbering `ln` publication. These implement the stated two-run acceptance. |

All verdicts above are against `[P]`, using code in `[D]` and assertions in `[H]`, not the outcome claims in `[R]`.

**Additional delivered work — PL-064:** nominal rescue of the sole good `.tmp` is present, but a failed promotion can delete that sole good copy: **G-B-10**.

## 2. Findings

### G-B-01: A failed member listing can still mean “nothing to protect”

- **Severity:** High
- **Category:** Guards fail closed / restore safety
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; hunks `@@ -185,35 +263,224 @@` and `@@ -611,54 +1114,124 @@`.
- **What:** Restore does not check whether `archive_members` successfully produced the input to `snapshot_members`.
- **Failure scenario:** The initial integrity check succeeds, but the subsequent member listing fails or is incomplete. Existing live files absent from that listing receive no snapshot. An empty listing becomes return 4, allowing restore to proceed without a snapshot or marker.
- **Evidence:** The caller executes `archive_members "${BACKUPFILE}" > "${MEMBERS}"` without a failure branch. `snapshot_members` returns 4 when `KEEP` is empty. The ZIP implementation also uses `unzip -l ... | awk ...` without preserving the producer’s failure. The supplied PL-009 test makes a **live file** unreadable; it does not make this enumeration fail. `[D][H]`

### G-B-02: Matching member counts override tar verification failures

- **Severity:** High
- **Category:** Artifact verification / data integrity
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; `snapshot_members` in hunk `@@ -185,35 +263,224 @@`; archive verification in `@@ -509,21 +934,80 @@`.
- **What:** Both verification paths count listing output without checking that `tar -tzf` completed successfully.
- **Failure scenario:** A damaged archive emits every member name and then fails while reading a payload or compressed-stream ending. The count matches, and the pre-restore snapshot is renamed into place and accepted.
- **Evidence:** Both paths use `LISTED=$(tar -tzf ... 2>/dev/null | grep -vc '/$')`. In the complete new `snapshot_members` function, a matching count proceeds directly to `mv` and return 0. In `write_archive`, this replaces the previous explicit `|| ! tar -tzf ...` failure test. A count assertion must supplement—not replace—the producer’s successful completion. No supplied case injects a listing that prints the expected names and then fails. `[D][H][E]`

### G-B-03: The credential scan fails open when it cannot complete

- **Severity:** High
- **Category:** Credentials / guards fail closed
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; `credential_lines` in hunk `@@ -185,35 +263,224 @@`; its caller in `@@ -509,21 +934,80 @@`.
- **What:** Scan failure has no distinct failure result that blocks publication.
- **Failure scenario:** The scan’s `find ... -print0` fails before producing its list, while the staged files remain readable to the later archiver. The loop visits nothing, prints `0`, and publication proceeds.
- **Evidence:** Enumeration occurs through process substitution: `done < <(find "${TREE}" -type f -print0)`. Its status is not read. The function ends with `echo "${TOTAL}"`; the caller tests only whether that text is greater than zero. Individual `grep` errors are also not distinguished from scan outcomes. The supplied tests exercise credential matches and nonmatches, not inability to scan. `[D][H]`

### G-B-04: Failure of the backup-directory exclusion leaves the original list usable

- **Severity:** High
- **Category:** Credentials / exclusion enforcement
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; hunk `@@ -286,16 +592,86 @@`.
- **What:** The exclusion protecting credential-bearing pre-restore archives is not fail-closed.
- **Failure scenario:** With `LOCATIONS=(/storage/roms)`, the walk includes `backup/archive/*PRE_RESTORE*.tar.gz`. The exclusion `awk` cannot write its temporary. The original file list survives, and collection can archive those compressed snapshots.
- **Evidence:** The filtering operation is `awk ... > "${FILELIST}.own" && mv ...`, followed by an unconditional “left out” log inside the branch. Neither failure causes return 2/6. The preceding `OWNED=$(... awk ... | wc -l)` also loses the producer’s error. The later credential scanner does not recursively inspect compressed archives. The supplied broad-selection tests cover successful filtering only. `[D][H]`

### G-B-05: Boot rollback writes “reverted” even when created files remain

- **Severity:** High
- **Category:** False success / recovery correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig`; hunk `@@ -106,17 +106,51 @@ finish_restore()`.
- **What:** The new cleanup failure counter never controls the result.
- **Failure scenario:** A file created by the interrupted restore remains after its removal attempt. Boot still records a successful revert.
- **Evidence:** After `rm -f`, the code increments `bad` when the path exists, but then unconditionally executes `echo reverted > "${said}"`. Only the diagnostic arithmetic uses `bad`. There is no `bad == 0` success gate in the branch. The existence test also misses a surviving dangling symlink, unlike `revert_restore`, which tests `-L` as well. The supplied boot cases test successful deletion only. Marker cleanup beyond this hunk is not needed to establish the false success indication. `[D][H]`

### G-B-06: Failed migration of an old ZIP does not stop a successful backup

- **Severity:** High
- **Category:** Upgrade path / credentials
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; hunk `@@ -808,65 +1411,29 @@`.
- **What:** The new migration may leave an old credential-bearing ZIP at the cloud-eligible root while the backup still succeeds.
- **Failure scenario:** The backup root is writable, but moving into `archive/` fails. The newly produced backup succeeds, and the old `ARCHIVED_*.zip` remains at the root for the settings upload described in the plan.
- **Evidence:** `mv ... && logger ...` is followed by unconditional `ROTATED_OLD=1`; no refusal or quarantine branch follows a failed move. Execution reaches `sync` and the success notes. The added fixture verifies only a successful move. The actual uploader is not embedded, but the root eligibility and `backuptool backup && cloud_backup --system-only` dependency are explicitly part of the packet’s contract. `[D][H][P][U]`

### G-B-07: Evidence can archive files omitted by a failed filtering traversal

- **Severity:** High
- **Category:** Credentials / evidence integrity
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-evidence`; hunks `@@ -100,22 +100,39 @@` and `@@ -181,16 +205,32 @@`.
- **What:** The new precomputed filtering list is used without verifying that its creation succeeded.
- **Failure scenario:** `mktemp` creates the empty list, but writing the list fails—for example, `/tmp` runs out of space while the evidence archive’s destination still has room. Only listed files are filtered; unlisted raw files remain in the tree later archived wholesale.
- **Evidence:** `find "$1" -type f -print0 > "${list}"` has no checked result. `RAW` counts only failures encountered inside the loop, so it can remain zero for an incomplete traversal. `collect` then archives the whole `${name}` tree. Because `filter_tree` is invoked as an `if` condition, relying on shell errexit would not supply the missing guard inside it. The tests inject `mv`/`rm` failures, not traversal/list-write failure. `[D][H]`

### G-B-08: A new-files-only rollback bypasses mount readiness

- **Severity:** Medium
- **Category:** Boot ordering / restore correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig`; hunk `@@ -106,17 +106,51 @@ finish_restore()`.
- **What:** Mount deferral examines the snapshot path only, although the new marker format can validly have no snapshot.
- **Failure scenario:** An interrupted restore on a fresh device has an empty first marker line and `+/storage/roms/...` entries. At sysinit, ROMs are not mounted yet. Cleanup removes—or observes absence in—the internal directory beneath the future mount, then records `reverted`; files on the subsequently mounted card remain.
- **Evidence:** All pending-mount logic is inside `if [ -n "${snap}" ]`. The later success condition expressly accepts `[ -z "${snap}" ] && [ "${created}" -gt 0 ]`. The new-only fixture uses an internal `.config` path; the mount fixture uses a nonempty snapshot. Their combination is not tested. `[D][H]`

### G-B-09: Initializing `SETTINGS_BACKUPS` disables the legacy fallback

- **Severity:** Medium
- **Category:** Regression / upgrade compatibility
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; hunk `@@ -22,11 +26,22 @@`.
- **What:** A configuration containing only the supported legacy `BACKUPFOLDER` is no longer honored.
- **Failure scenario:** An unmigrated config contains `BACKUPFOLDER="/storage/roms/custom-backups"` and no `SETTINGS_BACKUPS`. Backup and restore use `/storage/roms/backup` instead.
- **Evidence:** The parent first sets `SETTINGS_BACKUPS="/storage/roms/backup"`. The sourcing subshell inherits that nonempty value, so `${SETTINGS_BACKUPS:-${BACKUPFOLDER:-}}` never selects `BACKUPFOLDER` in this case. The removed sed implementation explicitly attempted the legacy fallback. The new fixture covers an unresolved `CONTENTPATH` reference, not a legacy-only configuration. `[D][H]`

### G-B-10: Failed promotion deletes the sole usable `.tmp`

- **Severity:** Medium
- **Category:** Last-known-good preservation
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/chksysconfig`; hunk `@@ -133,7 +167,21 @@ verify()`.
- **What:** The added rescue retains the temporary only when its promotion succeeds.
- **Failure scenario:** Live `system.cfg` and `.backup` are invalid, `.tmp` is valid, and replacing the live path fails while unlinking `.tmp` remains possible. The next statement removes the only usable settings copy.
- **Evidence:** `mv -f "${CFG}.tmp" "${CFG}"` is part of the rescue condition, but `rm -f "${CFG}.tmp"` runs afterward regardless of why that condition failed. No branch preserves a valid temporary after failed promotion. The two new tests cover successful promotion and a good backup winning, not rename failure. `[D][H][U]`

### G-B-11: Forget does not handle refusal to erase the settings-held credentials

- **Severity:** Medium
- **Category:** Persistence correctness / truthful outcome
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl`; hunk `@@ -221,15 +239,30 @@`.
- **What:** The newly added settings deletions do not inspect the failure statuses PL-011 now supplies.
- **Failure scenario:** NetworkManager deletes the profile, but one or both settings writes fail. The stored SSID/key can survive for a settings-driven reconnect. The shown function has no failure branch before `forgotten`.
- **Evidence:** Both `set_setting wifi.ssid default` and `set_setting wifi.key default` are unchecked, followed by `echo "forgotten"` and return 0. The preliminary SSID read is also unchecked, so an unsuccessful lookup can prevent matching a renamed profile’s stored SSID. The harness replaces `set_setting` with a successful table-editing stub; it never tests persistence refusal. Full-script error-policy context should be checked when reproducing the exact exit behavior. `[D][H]`

### G-B-12: Tmpfs does not eliminate same-boot PID reuse

- **Severity:** Medium
- **Category:** Concurrency / incorrect withdrawal rationale
- **Where:** `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`; hunks `@@ -154,11 +164,50 @@` and `@@ -208,18 +271,18 @@`.
- **What:** The PID-reuse half of the finding was dismissed on an invalid premise.
- **Failure scenario:** A holder dies without removing its lock. Before a later settings operation, its PID is assigned to an unrelated long-running process during the same boot. `kill -0` treats that process as the lock holder and prevents reaping.
- **Evidence:** The stored identity remains only `$$`; reaping still uses `kill -0 "${now}"`. There is no process-start identity. The new comment and report say tmpfs makes PID reuse irrelevant, but tmpfs only removes state across boots—not reuse within a boot. The stale-lock test uses a deliberately nonexistent PID and therefore cannot refute this scenario. `[D][H][R]`

### G-B-13: Metadata preservation errors are deliberately returned as success

- **Severity:** Medium
- **Category:** Artifact metadata / guards fail closed
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; `keep_meta` in hunk `@@ -185,35 +263,224 @@`, with sanitizing callers in subsequent hunks.
- **What:** The metadata fix does not ensure that the original mode or timestamp was retained.
- **Failure scenario:** Sanitization succeeds, but `stat`, `chmod`, or `touch -r` fails. The copy can retain staging metadata, yet the archive is accepted as preserving the file’s metadata.
- **Evidence:** Both operations suppress errors, and `keep_meta` unconditionally returns 0. Callers do not incorporate its outcome into `SANITISE_RC`; file-count checks cannot detect metadata differences. The supplied test checks the normal 0600 case only. `[D][H]`

### G-B-14: Core-handler serialization is not a required precondition

- **Severity:** Medium
- **Category:** Resource bounds / concurrency
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/rocknix-corekeep`; hunk `@@ -139,6 +154,27 @@`.
- **What:** The free-space-floor repair is conditional on successfully obtaining the directory lock, but the added code has no explicit refusal path when it cannot do so.
- **Failure scenario:** The no-`flock` fallback permits two handlers to pass separate free-space checks and write simultaneously—the original F-PB-21 failure.
- **Evidence:** The entire gate is `exec 8<"${CORE_DIR}" && { command -v flock ... && flock 8; }`, with no subsequent ownership assertion. The new comment expressly permits a device without `flock` to continue. The supplied concurrency fixture assumes an available, successful lock. Either the tool/lock must be mandatory or the claimed concurrent space guarantee must be narrowed and approved. `[D][H][K]`

### G-B-15: Evidence and most core tests do not use the claimed target applets

- **Severity:** Medium
- **Category:** Test fidelity / proof coverage
- **Where:** `tools/last-good-scripts-test`, supplied block `[H]`, section y4, `p7ev` and `p7ck`.
- **What:** The block’s header overstates target-tool coverage.
- **Failure scenario:** Host behavior passes while the image’s `find`, `mktemp`, `ln`, `tar`, `awk`, or other applet behaves differently.
- **Evidence:** `p7ev` does not bind/use `P7MBB` and sets `PATH` to `/shim:/usr/bin:/bin`; its `mv` and `rm` wrappers explicitly execute `/usr/bin/...`. `p7ck` puts `/p7bb` on PATH with a target `head` wrapper, but omits `/bbin`, despite mounting it. Thus the evidence path and most core-helper commands use host tools. This is visible even when `BB` is available; it is not speculation that the optional BusyBox selection was empty. `[H][U]`

### G-B-16: Raw tool errors still bypass the player-facing error wrapper

- **Severity:** Low
- **Category:** Player text / incomplete sweep fix
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; seed restoration in hunk `@@ -689,42 +1264,47 @@`, and sanitizing writes including `@@ -465,7 +882,9 @@`.
- **What:** `to_log` fixes tar/unzip stderr, not all newly relevant failing commands.
- **Failure scenario:** Restoring a seeded file fails in `mkdir` or `cp`, or a sanitizer reports a read/write error. The console receives tool names and filesystem paths before the player-facing failure sentence.
- **Evidence:** Seed restoration invokes `mkdir -p ... && cp -f ...` without stderr redirection or `to_log`. The sanitizing `sed` call likewise leaves stderr attached. The added player-text test injects a **tar** error only. The new why sentences themselves are allowed by `[T]`; this finding concerns raw diagnostics bypassing them. `[D][H][T]`

## 3. Sweep spot-checks

These are checks against code, not acceptance of the report’s “fixed” labels. Duplicate punch-item rows inherit the verdicts above.

| Reported-fixed row | Spot-check result |
|---|---|
| **Claude F-BR-07** — old root ZIPs | **Partial:** migration exists, but failure does not stop the backup: **G-B-06**. |
| **Claude F-BR-08 / GPT F-BR-15** — trimming the active snapshot | **Holds:** `trim_archive "${SNAPSHOT}"` and `KEEP=... awk '$0 != ENVIRON["KEEP"]'` remove the protected path before retention selection. `[D]`, hunk `@@ -552,11 +1036,20 @@`. |
| **Claude F-BR-09** — duplicate RAM staging | **Holds:** staging moves under `/storage/.cache/backuptool-staging.*`; the scan reads that tree instead of extracting a second copy. Target memory/space behavior remains a runtime proof. |
| **Claude F-BR-13** — wildcard only on last folder | **Holds:** the explicit loop builds one `"${D#/}*"` entry per directory. The supplied modified-list ZIP fixture actually exercises two directories. `[D][H]` |
| **GPT F-BR-13** — tar flattening OS symlinks | **Holds for live leaf symlinks:** `LINKS` is built from whole member names, escaped by `glob_literal`, and added to both extraction branches. Ancestor symlinks and arbitrary archive member types are not covered by that check. |
| **GPT F-BR-14** — ZIP integrity fallback | **Holds as an implementation change:** `unzip -l && unzip -p` replaces the failed-test-or-successful-listing construction. `[H]` contains an actual payload-corruption fixture, although its execution and target CRC behavior were not independently observed. |
| **GPT F-BR-16** — metadata | **Partial:** file-only member lists avoid synthetic directory metadata; metadata-copy failure remains accepted: **G-B-13**. |
| **Claude F-BR-18** — configured backup folder | **Partial/regression:** shell expansion is added, but legacy-only `BACKUPFOLDER` is ignored: **G-B-09**. |
| **Claude F-BR-19** — invisible sleeps | **Holds for the changed calls:** failure and backup-success pauses now require `[ -t 1 ]`. |
| **GPT F-PB-15 / added F-PB-20** — core retention and interface cap | **Holds in the visible mechanisms:** retention sorts the timestamp field from note filenames, includes note-only crashes, and the interface cap recognizes `%E` and the truncated comm. Target-tool coverage is narrower than claimed: **G-B-15**. |
| **GPT F-PB-21** — concurrent core floor | **Partial:** normal serialization exists; fallback/error enforcement is incomplete: **G-B-14**. |
| **GPT F-PB-17 / E2 launch finding** — arguments | **Holds:** save-state values come from argument boundaries; platform comes from the first `-P...` argument after the ROM. The supplied filename and nickname fixtures address the removed string-slicing defects. |
| **Claude F-PB-13** — internal `sdXN` disk | **Holds for the specified layouts:** sysfs partition ancestry replaces suffix stripping. The harness supplies `sda2`, `mmcblk0p2`, and an external `mmcblk1`. |
| **Claude F-WF-05 / F-WF-06, GPT F-WF-04** | **Hold:** scan output is unescaped; saved-state parsing splits at the last tab and uses the environment for literal name matching. |
| **Claude F-WF-12 / GPT F-WF-03** | **Script half holds:** `wifi.ssid` receives the queried SSID rather than the profile name. The picker’s matching behavior is outside this packet. |
| **Claude F-WF-01 / GPT F-WF-07** | **Partial:** nominal settings cleanup is present, but refusal to persist it is unhandled: **G-B-11**. |
| **Claude F-BR-12(e) / GPT F-BR-20** | **Partial:** tar/unzip diagnostics are wrapped; other failing commands still reach the screen: **G-B-16**. |

### Withdrawals and partial withdrawals

| Row | Assessment of the report’s reason |
|---|---|
| **Claude F-PB-07** — settings writer input failures | The visible `awk && mv` supports refusing an `awk` failure. The claimed target experiments, the full baseline section-c contract, and mid-read error behavior are not embedded. **The complete withdrawal cannot be confirmed.** I would not add the proposed hostname guard solely from this packet either. |
| **Claude F-PB-08, PID-reuse portion** | **Reason does not hold.** Same-boot reuse is possible regardless of tmpfs: **G-B-12**. |
| **Claude F-PB-10** — ANSI removal | **Cannot tell.** `maintenancePlainLine` and its caller are not embedded. The report’s cited ES location is a pointer, not evidence available here. |
| **Claude F-PB-14** — watchdog/suspend | The ownership explanation is consistent with the plan’s restricted file list. **Out of scope is not resolution.** The device-policy and per-SoC suspend question must remain routed to another owner. |
| **Claude F-PB-17** — evidence timer cost | **Cannot confirm design/performance withdrawal.** The timer, service scheduling settings, opt-out implementation, and cited evidence document are not embedded. No hitch proof is supplied either. |
| **Claude F-WF-04** — device initialization/wait | **Cannot tell.** The cited file-scope assignment and no-device exit are outside the supplied hunks. An assignment alone would not establish initialization timing. |
| **Claude F-WF-09** — missing subcommand tests | `[H]` unquestionably adds script-level tests. The claim that the earlier section u already covered them cannot be checked without that section. |
| **Claude F-WF-10, fork references** | Leaving upstream-preparation prose to another pass is an explicit scope deferral, not a functional repair. The stale row-name change is visible. |
| **Claude F-BR-12(d)** — moving protocol output | Keeping `>>> why` is consistent with `[T]`, which explicitly defines it as the interface protocol. A descriptor change needs the unembedded consumer; deferral is reasonable. |
| **Claude F-CS-09** — post-update migration | **Cannot tell.** Neither the installed post-update implementation nor its installation/call chain is embedded. |
| **GPT F-VM-18** — VM watchdog policy | The F1 ownership routing agrees with the plan. **The technical issue remains unreviewed here**, rather than refuted. |

## 4. Coverage boundary and orchestrator gaps

The following sources or evidence are needed but were **not embedded**. No paths or hashes have been invented for them.

1. **Full post-fix script context.** Unchanged headers, dispatchers, helper implementations, pruning logic, and final marker cleanup are not all present in a unified diff. In particular, the exact caller-level exit behavior of unchecked Wi-Fi writes should be checked in the full script.
2. **Complete harness and execution artifacts.** The baseline sections, harness setup, image-app selection, and raw before/after logs are missing. The report’s `468 PASS / 0 FAIL` remains a claim. Guard cases that pass on the old code are legitimate negative/regression guards, but are not themselves FAIL-before evidence.
3. **Cross-repository consumers.** The C++ `PidLock`, Wi-Fi picker, ANSI cleanup, maintenance outcome parsing, and translations are absent. The report cannot establish their compatibility by itself.
4. **Cloud publication and migration consumers.** The actual `cloud_backup`, configuration migration helper, and installed post-update chain are absent. This prevents certification that all old credential-bearing local archives are excluded from subsequent uploads.
5. **Archive extraction scope.** The visible snapshot helper skips non-`storage/*` and dot-component members, while the visible extraction commands unpack the archive at `/` using exclusions rather than that validated member list. A pre-existing whole-archive validation outside the hunks could settle this. **The orchestrator should obtain the full restore path before accepting the claim that the snapshot covers everything extraction can modify.**
6. **Target runtime proofs.** Needed cases include failed listing after a successful initial integrity check; failed scanner/exclusion traversal; boot cleanup failure; a new-files-only marker targeting an unmounted ROMs volume; and failed `.tmp` promotion. The normal PSK and two-adapter proofs, actual boot ordering, and power-loss durability are also not established here.
7. **Packaging and presentation.** No recipe/app inventory is supplied to verify dependencies and options such as `flock`, `mountpoint`, and `mv -T`. No French catalog or 640×480 frames are supplied. The named new why strings are explicitly present in `[T]`’s permitted vocabulary, but presentation and localization cannot be certified.

**Recommended disposition:** retain the normal-path repairs, but reopen the fail-closed and recovery items identified above. Require artifact assertions for the added failure cases and run the evidence/core fixtures under the actual target applets before closing stream B.

## 5. `corpus.provenance.json`

The arrays below are parallel and in embedded-source order. Hashes are the Facilitator’s **verified-at-embed-time** values, not independently recomputed values.

```json
{
  "corpus_name": "Council Facilitator — council-facilitator@1.2.0",
  "source_ids": ["D", "H", "P", "R", "E", "U", "K", "T"],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.harness.txt",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.plan.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fixes-307/seats/B.report.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "ff93e2eb0be81284ddfc2a55046714964b0d35a21b97123f73f38f941f234cd9",
    "864318fea93c963da4bee809ed00e842572da117ae2571f39489714889799b9f",
    "ae55a7b1e51f40a0253859915d191ef93d5825f0fb63778ec0a7ec2f9d526fff",
    "012187faf38cffce61b43c3012129058062e2270ccc4ee2437d40edce91b1e27",
    "d6f88a6f4cd9c61b0e6ef728625c6a1cec9dc6f58e1db578cf0987f10f870c1a",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746",
    "554225c68e627a3bde8969a77f177aea14f5bcd85b0bcc740631d402a5f1f7a7"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified by the Council Facilitator at embed time; not independently recomputed by this auditor.",
  "manifest_read_timestamp_utc": "2026-09-28T04:20:24Z",
  "access_mode": "Embedded text only; no filesystem access.",
  "review_method": "Static review of supplied diff hunks, harness assertions, plan, report claims, and rules.",
  "tests_executed_by_auditor": false,
  "files_created_by_auditor": false,
  "missing_sources_and_evidence": [
    "Full post-fix script bodies and unchanged control-flow context outside the supplied hunks.",
    "Complete tools/last-good-scripts-test setup and baseline sections, plus raw test execution logs.",
    "The ES PidLock implementation and shared-lock integration tests.",
    "The ES Wi-Fi picker, maintenance protocol consumers, and ANSI cleanup implementation.",
    "Cloud publication, configuration migration, and installed post-update implementations.",
    "Target applet inventory and owning package dependency declarations.",
    "VM and device execution evidence, including boot-order and power-loss recovery proofs.",
    "French localization changes and rendered player-facing frames.",
    "Documents and decision-register entries cited by withdrawn findings but not embedded."
  ]
}
```
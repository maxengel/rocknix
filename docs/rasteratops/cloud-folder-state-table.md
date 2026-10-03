# Cloud folder states and actors

Review baseline: distribution `b2378d9c33` (run 101), scripts at the original audit baseline;
EmulationStation `e108699ea`. Written for #365 and #375, 2026-10-02.
The table preserves the audited baseline. Implemented changes and their receipts
are recorded below; guest qualification is a separate result.
D-CLOUD-170 through D-CLOUD-172 remain in force (D-WORKFLOW-134).

## State dimensions

`C` is the configured saves folder. `N` is `/Rasteratops/Saves`. `E` is either
earlier default, `/GAMES` or `/ROCKNIX/Saves`. `O` is a player-chosen folder.
`K` means `LAYOUT_KEEP` equals `C`. A remote can be absent, empty, contain files,
or be unreadable. **Empty and absent differ:** backup checks existence; layout
selection checks files. A failed listing is a separate state, never evidence of
absence. The fleet marker and current folder's presence are independent facts.

`has_files` excludes nested backup folders, but only the current-folder join test
explicitly excludes `README.txt` (`cloud_migrate_layout:371–376,842`). A note in
an earlier folder can therefore change its classification. With two earlier
folders populated, the configured folder wins, otherwise the newer default wins
(`:82–101`). The table groups equivalent cases, rather than assuming every
combination of these dimensions behaves differently.

## Actors and source anchors

All script paths below are under `projects/ROCKNIX/packages/network/rclone/sources/`.
ES paths are under `es-app/src/` in the separate EmulationStation repository.

| Actor | What it reads and changes |
| --- | --- |
| Wizard | ES `guis/GuiMenu.cpp:5455–5481,7410–7427`: folder scan and MOVE question, then seeding on every exit. `cloud_setup:728–788`: `--settle`, reread pointers, mkdir/notes/marker. No empty-folder question here (D-CLOUD-171). |
| Transfer pages | `cloud_scan:153–185`: join → state → possible follow → state. ES `GuiMenu.cpp:5308–5433`: offer MOVE or CREATE; backup may make absent current folder, restore asks. |
| Boot step | `cloud_migrate_layout:1277–1284`: local eligibility for E, not K, configured remote. ES `main.cpp:1115–1124`, `GuiMenu.cpp:5545–5603`: after startup worker, network wait, free carousel/list, no game/job. |
| Startup restore | `cloud_restore:1657–1737`: inspect C; absent child with readable parent offers creation; absent parent fails. No join/follow. |
| Startup backup | `cloud_backup:830–838,1674–1712`: if C is E, extra existence probe; absent E offers creation and sends nothing. Otherwise mkdir/copy. ES `main.cpp:679–684` runs this even when restore failed. |
| Exit sync | Same backup predicate before `--recent` copy; does not settle pointers. |
| Saves rows | ES `GuiMenu.cpp:6576–6604`: direct restore/backup scripts, or their composition; does not pass through transfer-page scan. |

## Decision table

Abbreviations: **scan** = join/state/follow above; **offer** = protocol offer to the
caller, not a script opening a dialog; **write C** = backup to the configured path;
**read C** = restore from it. Startup/exit offers become SKIPPED cards. Saves rows
use their deliberate-run presenter. Presence results assume successful listings.

| Cell | Config/cloud facts | Wizard | Transfer-page scan | Boot step | Startup restore | Startup backup | Exit sync | Saves rows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | N contains saves | Seed N | Current; options | Ineligible | Read N | Write N | Write N | Read/write N |
| T02 | N absent/empty; no E files | Seed N | Current; restore offers if absent | Ineligible | Offer if parent exists; fail if not | Make/write N | Copy may make N | Same direct rules |
| T03 | N empty/absent; E holds files | Join E, ask MOVE, then seed resulting pointers | Join E, ask MOVE | Initially ineligible on N | Reads initial N | Writes initial N | Writes initial N | Reads/writes initial N |
| T04 | E holds files, N absent | Ask MOVE/KEEP/NOT NOW; seed result | Same offer | Eligible; scan after startup | Read E | Write E, extra probe | Write E, extra probe | Read/write E |
| T05 | E holds files, N present with fleet marker | Offer MOVE; merge on consent | Same | Same after startup | Read E | Write E | Write E | Read/write E |
| T06 | E holds files, N populated without fleet marker | MOVE offered; apply may refuse unrelated target | Same | Same after startup | Read E | Write E | Write E | Read/write E |
| T07 | E absent; no earlier files, N absent, parent present | Settle to N and seed | CREATE IT | Eligible; CREATE after startup | Offer; no restore | Offer; no write | Offer; no write | Offer; no write |
| T08 | E absent; no earlier files, N absent, parent absent | Settle to N and seed | CREATE IT if cloud root readable | Eligible; CREATE after startup | Fails missing parent | Offer; no write | Offer; no write | Restore fails; backup offers |
| T09 | E exists empty; no earlier files, N absent | Settle to N and seed | CREATE IT | Eligible, but observes state after startup | Empty restore | Writes E; can turn T09 into T04 | Same | Same direct rules |
| T10 | E absent; other E holds files | Join populated E and offer MOVE | Same | Eligible; scan after startup | Offer/fail according to parent | Offer, no write | Offer, no write | Same direct rules |
| T11 | E exists empty; other E holds files | Join populated E and offer MOVE | Same if scan happens first | Startup can populate C before scan | Empty restore | Writes C; can make configured E win | Same | Same direct rules |
| T12 | E absent/empty; no other E files; N present | Scan follows N, seed N | Follow N; options | Eligible; follow after startup | Offer/fail if E absent; empty if present | Absent: no write; empty: writes E | Same | Same direct rules |
| T13 | K=E, E present | Preserve/seed E | Kept; options | Ineligible | Read E | Write E, extra probe | Same | Same |
| T14 | K=E, E absent | Preserve/seed E | Kept; no layout offer | Ineligible | Offer/fail by parent | Offer, no write | Offer, no write | Same direct rules; deliberate recovery needed |
| T15 | O present | Preserve/seed O | Own; options | Ineligible | Read O | Write O | Write O | Same |
| T16 | O absent | Seed O | Own; options | Ineligible | Offer/fail by parent | Make/write O | Copy may make O | Same |
| T17 | Unreadable cloud / no route | Scan reports error; dismissal still reaches seeding | Join/state errors stop opening scan | Offline asks connection; online error stays on scan page | Refusal/error | Existing fallback policy tries backup on inconclusive probe | Same within automatic deadline | Refusal/error |
| T18 | Bucket C listing succeeds, parent listing fails | Layout reader reports failed read | Same | Same | Bucket helper cannot distinguish absence/error | Helper converts failure to absence; offers and skips | Same | Same helper behavior |
| T19 | No linked remote / unreadable config | Setup/link or report unreadable | Setup or error | No step; config error is not settlement | Existing setup/config refusal | Same | Same | Same |
| T20 | E saves empty, old Backups holds archives | Settle can abandon settings pointer (#379) | Follow can abandon settings pointer | CREATE IT uses --apply and copies backups; scan-follow does not | Saves path sees empty; settings restore still uses old pointer until scan | Settings writes old tier independently | Saves-only rules unchanged | Same independent tier behavior |
| T21 | Explicit CONTENT_REMOTE empty = cloud root | Settlement can replace chosen root (#380) | Join/follow can replace chosen root | Same scan transition | Saves do not decide content | Saves do not decide content | Same | Same |
| T22 | Both old defaults hold saves; lone device | Configured root wins | Configured root wins | Same after startup | Read configured root | Write configured root | Same | Same; other old root is a coverage residual |
| T23 | Unmarked current Content conflicts with old content | Apply may leave saves/backups current and content refused | Same on move | Same | Normal configured paths | Normal configured paths | Same | Marker/retry/fleet recovery needs a cell; not reproduced |
| T24 | Normal per-device settings archive, no flat archive | Writer seeds/writes per-device folder | cloud_scan root listing misses it (#381) | Folder scan itself does not list archives | Settings restore knows device folders | Settings writer appends device id | Saves-only path | Saves rows not the settings scan |
| T25 | Bucket permissions allow selected prefix but not root listing | Root-probe behavior unverified | Root probe may refuse scan | Same online scan | Parent probes differ | Existing direct behavior | Same | Permission fixture owed; no regression claimed |

Orthogonal rules: a named custom content pointer is retained during follow/settle, but explicit empty cloud-root selection is overwritten (#380);
settings and content are separate tiers. A restore-finish marker gates the boot
page; FINISH arms it and LATER postpones it. Kid/kiosk mode excludes it. Locks
serialize transfer/move on one device, not across the fleet. A current folder
with no files can join an older one even when a marker exists. The marker is not
a distributed lock or a complete numbered migration engine (#356).

## Disagreements and disposition

| Cells / seam | Existing decision or required work |
| --- | --- |
| T03 direct actors bypass join | D-CLOUD-169 explicitly excludes a device linked outside the wizard and syncing before opening a transfer page. Preserve that recorded boundary; verify ordinary wizard/boot routes. |
| T08/T12 restore errors before follow | Existing #365 hypothesis: reproduce whole boot with old parent absent and fleet present. Do not reverse D-CLOUD-171's lock ordering without testing the replacement. |
| T09/T11 empty exists vs absent | Existing #365 hypothesis: startup can write into an empty `/GAMES` before scan discovers saves in `/ROCKNIX/Saves`. Needs whole-boot fixture with distinguishable bytes in both roots. |
| T13/T14 kept old folder | D-CLOUD-172 does not exempt kept folders; boot eligibility does. Record recovery and cost cases in #365's suite before changing either policy. |
| T17 settle failure | `cloud_setup:739–740` deliberately ignores unsuccessful `--settle` and continues. Host production caller probe now reproduces rc124/rc1 followed by successful seeding of GAMES. #365 must prevent those writes while retaining D-CLOUD-171’s wizard continuation and prove recovery on the VM. |
| T18 bucket failure | New #375 finding: source-predicate probe returns an absence offer after parent `lsf` exit 5. Repair the helper's three-way result and its backup/restore callers; prove backup behavior in a reachable synthetic bucket fixture and the ungated restore sibling on S3 (#377); ordinary bucket-prefixed S3 backup paths do not enter the literal old-root guard. |
| Worker ended vs card gone | `ThreadedCloudSync.cpp:719–735` clears its instance before 1.5/5 s card linger; the boot waiter only checks the instance. Saved run-101 E frame shows the overlap. Track under #363/#365. |
| Extra per-sync probe | D-CLOUD-172 guard costs 59 ms in saved benchmark; D-CLOUD-170's 30 ms criterion remains red. #364 must resolve against this table, not weaken the test silently. |
| T20 settings-only | #379: preserve old archives through pointer-only follow/settle; --apply already copies the tier. Host probe is not VM qualification. |
| T21 explicit content root | #380: distinguish missing key from an explicit empty value, including existing contradictory tests. |
| T22/T23/T25 | #365 coverage residuals; configured-first stays, unrelated current content stays protected, no restricted-permission regression claimed without a fixture. |
| T24 archive directory contract | #381: scan must discover the same writer-shaped archive the restore reader can use; current flat-root fixture is insufficient. |

## Test matrix contract

#365 is not closed by this document. Each T-cell needs a named executable case,
explicit initial config/cloud state and before/after pointer and byte assertions.
Combine T08/T11/T12 with startup ordering and outcome-card lifetime. Combine T17/T18
with path and bucket backends, including a provider failure after a successful
first read. Run direct saves rows as well as transfer pages. The guest proof must
reset each case, fail its process on any failed assertion, and demonstrate that
with a deliberately failing fixture. C/F/G screenshots alone are not such cases.

Recommended implementation direction: retain setup/boot/transfer settlement,
centralize the result vocabulary (present/empty/absent/unknown; permitted writer),
and explicitly suppress or defer automatic writes while settlement is pending.
This last behavior is a proposal requiring reconciliation with D-CLOUD-171/172,
not an already-approved change. Do not add a broader per-sync network scan.

## Remediation under #383 (2026-10-02)

`tools/rasteratops-cloud-layout-test` is the host regression runner. Every invocation uses
whole production scripts, real image rclone1.75.1, independent config/cloud/cache
fixtures, and saved command transcripts, pointer snapshots and synthetic bytes.
`--ref` supplies the old production scripts without changing the assertions.
The baseline58 cases failed22 assertions; the first fixed67 cases passed67.
The additional apply/discovered-source tests pass2 and fail2 against the baseline.
These results are host evidence, not acceptance of a candidate image.

| Cells/seam | Implemented change | Executable coverage / remaining proof |
| --- | --- | --- |
| T01–T16, T22 | Existing classification, kept/custom boundaries and configured-first precedence retained | Named classification cases assert unchanged pointers and bytes; direct script and UI image runs remain qualification work. |
| T08/T11/T12 | ES startup calls the existing folder scan before its transfer pair on eligible legacy configurations; the dialog remains after the worker | `tools/rasteratops-vm-cloud-epic --case T08`, T11, T12 construct distinct old/fleet/local bytes and capture boot frames; not yet run on the new image. |
| T17 | Seeding stops when settlement fails or times out; no mkdir, README or marker follows | `T17-seed-timeout`, `T17-seed-failed`, `T17-unreadable`; failed provider image cases still required. |
| T18 | Bucket parent discovery has present/absent/unknown outcomes; unknown never creates an absence offer | Both production scripts with failed parent listings (codes3/4/5/7) and failed features read; S3 image proof remains required. |
| T20 | Pointer-only transitions keep populated or custom backup tiers; discovery of another saves source preserves the independent backup tier before applying the move | follow/settle/default/custom and apply/discovered-source cases verify archive bytes at the resulting pointer; guest upgrade proof still required. |
| T21 | Only an omitted CONTENT_REMOTE is unset; an explicit empty value remains the cloud root | join/follow/settle/apply × omitted/root/derived/custom cases; root sentinel bytes unchanged. The older contradictory fixture now explicitly omits the key. |
| T23 | Existing tier-by-tier completion is retained; a later content collision refuses without overwriting unrelated bytes | Content-collision case records the partially advanced pointers. Retry/fleet image recovery remains required. |
| T24 | Scan and restore share device-folder discovery; archive readers accept both display identities; new local archives retain the persisted ROCKNIX suffix | production writer→scan→restore, current/legacy/healed/flat/foreign folders, local restore and pre-restore snapshots under the renamed OS. |
| T25 | Folder-only scan does not require cloud-root listing | Restricted-prefix host case; provider permissions still need image coverage. |
| Card lifetime | Boot dialog waits for Window's actual async notification list to empty, including linger/fade | ES compile check passed; guest E frame sequence must prove no overlap. |
| #364 cost | Backup determines earlier-folder presence with one parent listing, retaining inconclusive-read fallback | Five-sample guest benchmark still required; the30ms criterion is unchanged. |

The promoted guest runner resets each lettered case and exits nonzero on any
failed assertion. C/F/G include fact assertions, and B explicitly checks that
creation preserves a chosen cloud-root content location. A constructed failure
has demonstrated exit1. No cell is marked image-qualified by these host results.

## M7.P1 migration controls (2026-10-03)

T23 now has named `T23-retry-*` cases for each tier's copy and source deletion,
plus marker publication. The assertions retain payloads, expose pending work to
`--needs-step` and `cloud_scan --folder`, complete retry, verify repeat stability,
and follow from a separate configuration with no mover record. The original
collision case remains; it does not grant permission to overwrite foreign content.

**T26: unsupported layout marker.** `T26-marker-{malformed,future,trailing}-*`
exercises apply, follow, settle and wizard seeding, requiring byte-for-byte cloud
and pointer preservation. Exact supported versions are read once at the shared
transition boundary. Direct-transfer actors retain their existing routing; this
entry does not claim a complete actor × state image proof. The candidate's boot,
transfer-page and retry-dialog frames and real provider/upgrade runs remain open.

See `cloud-layout.md` for the local recovery record, numbered step and actual
predecessor compatibility boundary. Host receipts: `../qa-logs/2026-10-03-m7-p1/`.

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

## Executable actor coverage — M7.P1 continuation (2026-10-03)

The historical table above records the reviewed baseline. This map describes
current source and **host coverage**, not a candidate image. List the actual
case names without running anything:

```sh
tools/last-good-scripts-test --cloud-layout --list
tools/last-good-scripts-test --cloud-layout --case T23-predecessor --output /tmp/new-proof-directory
```

`Axx/actor` below is the executable `Txx-actor-actor`. The eight suffixes are
`wizard`, `transfer`, `boot`, `startup-restore`, `startup-backup`, `exit`,
`saves-restore` and `saves-backup`; splitting the two saves-row verbs preserves
the original seven actors. Each case constructs its own config, remote bytes,
local progress and cache. `actor_case` checks the independently specified
pointer result, preserves every pre-existing cloud payload, verifies exact
restored/uploaded bytes and absent-folder offers, and asserts that a direct
saves call never changes pointers. Wizard cases decline MOVE then finish
seeding; MOVE itself is exercised by T23 and the separate apply controls.

Boot/startup cases run the local eligibility gate and conditional folder scan
before the relevant transfer half, matching pinned ES main.cpp's startup
command. They do not prove that ES schedules it correctly: whole-image boot
cases T08/T11/T12 and the card-order frames still provide that P3 evidence.
`transfer` is the shared folder scan; T24's writer-shaped archive cases also
exercise the full scan and restore reader.

| Cell | Wizard | Transfer | Boot | Startup restore | Startup backup | Exit sync | Saves rows |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | A01/wizard | A01/transfer | A01/boot | A01/startup-restore | A01/startup-backup | A01/exit | A01/saves-restore + saves-backup |
| T02 | A02/wizard | A02/transfer | A02/boot | A02/startup-restore | A02/startup-backup | A02/exit | A02/saves-restore + saves-backup |
| T03 | A03/wizard | A03/transfer | A03/boot | A03/startup-restore | A03/startup-backup | A03/exit | A03/saves-restore + saves-backup |
| T04 | A04/wizard | A04/transfer | A04/boot | A04/startup-restore | A04/startup-backup | A04/exit | A04/saves-restore + saves-backup |
| T05 | A05/wizard | A05/transfer | A05/boot | A05/startup-restore | A05/startup-backup | A05/exit | A05/saves-restore + saves-backup |
| T06 | A06/wizard | A06/transfer | A06/boot | A06/startup-restore | A06/startup-backup | A06/exit | A06/saves-restore + saves-backup |
| T07 | A07/wizard | A07/transfer | A07/boot | A07/startup-restore | A07/startup-backup | A07/exit | A07/saves-restore + saves-backup |
| T08 | A08/wizard | A08/transfer | A08/boot | A08/startup-restore | A08/startup-backup | A08/exit | A08/saves-restore + saves-backup |
| T09 | A09/wizard | A09/transfer | A09/boot | A09/startup-restore | A09/startup-backup | A09/exit | A09/saves-restore + saves-backup |
| T10 | A10/wizard | A10/transfer | A10/boot | A10/startup-restore | A10/startup-backup | A10/exit | A10/saves-restore + saves-backup |
| T11 | A11/wizard | A11/transfer | A11/boot | A11/startup-restore | A11/startup-backup | A11/exit | A11/saves-restore + saves-backup |
| T12 | A12/wizard | A12/transfer | A12/boot | A12/startup-restore | A12/startup-backup | A12/exit | A12/saves-restore + saves-backup |
| T13 | A13/wizard | A13/transfer | A13/boot | A13/startup-restore | A13/startup-backup | A13/exit | A13/saves-restore + saves-backup |
| T14 | A14/wizard | A14/transfer | A14/boot | A14/startup-restore | A14/startup-backup | A14/exit | A14/saves-restore + saves-backup |
| T15 | A15/wizard | A15/transfer | A15/boot | A15/startup-restore | A15/startup-backup | A15/exit | A15/saves-restore + saves-backup |
| T16 | A16/wizard | A16/transfer | A16/boot | A16/startup-restore | A16/startup-backup | A16/exit | A16/saves-restore + saves-backup |
| T17 | A17/wizard | A17/transfer | A17/boot | A17/startup-restore | A17/startup-backup | A17/exit | A17/saves-restore + saves-backup |
| T18 | A18/wizard | A18/transfer | A18/boot | A18/startup-restore | A18/startup-backup | A18/exit | A18/saves-restore + saves-backup |
| T19 | A19/wizard | A19/transfer | A19/boot | A19/startup-restore | A19/startup-backup | A19/exit | A19/saves-restore + saves-backup |
| T20 | A20/wizard | A20/transfer | A20/boot | A20/startup-restore | A20/startup-backup | A20/exit | A20/saves-restore + saves-backup |
| T21 | A21/wizard | A21/transfer | A21/boot | A21/startup-restore | A21/startup-backup | A21/exit | A21/saves-restore + saves-backup |
| T22 | A22/wizard | A22/transfer | A22/boot | A22/startup-restore | A22/startup-backup | A22/exit | A22/saves-restore + saves-backup |
| T24 | A24/wizard | A24/transfer | A24/boot | A24/startup-restore | A24/startup-backup | A24/exit | A24/saves-restore + saves-backup |
| T25 | A25/wizard | A25/transfer | A25/boot | A25/startup-restore | A25/startup-backup | A25/exit | A25/saves-restore + saves-backup |
| T23 | R/seed refusal | R/pending state | R/local eligibility | R/automatic restore | R/automatic backup | R/recent backup | R/direct restore + backup |
| T26 | marker-*-seed | marker-*-scan | eligible legacy gate + refused scan | same preflight refusal | same preflight refusal | direct-exit | direct-saves-restore + direct-saves-backup |

- **T17:** `failure_actor` fails provider reads/writes, verifies a nonzero
  outcome and no changed pointers/bytes. The two `T17-seed-*` controls also
  distinguish a failed settlement from a successful one; the wizard can
  finish without seeding. Follow-call and second-read failures have separate
  controls. This does not equate an inaccessible cloud with an empty one.
- **T18:** the direct transfer actors exercise their exact flags with the
  bucket helper's failed parent listing. The wizard/transfer/boot cases
  assert that their own classifier reads the selected folder without asking
  that helper's parent-listing question. They preserve the selected path and
  payloads. Permission failure on the selected folder is T17, not a false
  assumption that the two actors call the same predicate.
- **T19:** all actors handle no linked remote. An ineligible boot is asserted
  to do nothing. `T19-local-path-*` additionally proves that neither transfer
  script treats a writable local path as cloud storage when discovery is empty
  or fails (#392). Existing empty config files are included.
- **T20:** actor cases retain independently populated settings bytes and the
  old settings pointer through folder preparation. `T20-{follow,settle}-*`
  cover both old defaults and a custom settings path; apply/discovered-source
  cases cover the copying route. Saves-only actors never transfer archives.
- **T21:** actor cases preserve the explicit empty content root and its game
  bytes. The join/follow/settle/apply × missing/root/derived/custom controls
  cover the other independent choices. Direct saves actors do not interpret
  content selection; their assertions establish that it remains unchanged.
- **T22:** each actor uses distinguishable payloads in both earlier defaults;
  the configured root wins, and the other root's bytes remain intact.
- **T23 / R:** every `T23-retry-*` fixture (four copy failures, four source
  deletion failures, marker publication) runs the pending-state checks,
  wizard refusal and all five direct/automatic transfer variants before
  retry. Each asserts unchanged cloud bytes and pointers while pending, then
  complete payload recovery, repeat stability and a separate follower config.
  `T23-content-collision` retains the refusal of unmarked foreign content.
- **T24:** actor cases contain a valid per-device settings archive beside
  saves and assert its bytes are untouched. The full production backup →
  scan → restore round trip and current/legacy/healed/flat/foreign archive
  selection cases provide the settings-reader assertions. Archive *selection*
  is inapplicable to the boot folder check and saves-only actors: neither
  reads that tier, and the archive-preservation assertion proves isolation.
- **T25:** the fixture denies cloud-root `lsf` enumeration while selected
  folders are readable. Folder preparation/direct transfers keep working;
  the full scan's content chooser reports its denied root enumeration and
  changes no cloud bytes/pointers. This is the precise permission exercised,
  not a claim that a provider denying every root operation is supported.
  Actual S3 policy/prefix behavior remains candidate qualification.
- **T26:** `T26-marker-{malformed,future,trailing}-{apply,follow,settle,join,state,seed,scan}`
  refuse unsupported transitions and preserve exact marker/pointer/payload
  bytes. Boot eligibility is local and does not read a remote marker; an
  eligible startup stops at that refused scan. Direct saves/exit calls retain
  their documented configured-path routing (D-CLOUD-169/170), proved by the
  three `T26-direct-*` controls. They do not migrate or overwrite the marker.

There is no unassigned actor/state cell in this map. Inapplicable *sub-actions*
are identified above rather than marking whole actors inapplicable: a boot
that is locally ineligible and a saves call that ignores archives are both
executed and asserted. Native UI ordering/presentation, real provider behavior,
paired guests and upgrade application remain P3 criteria on the owning issues.

### Actual predecessor states and the guest boundary

`T23-predecessor-RC2-*` runs the historical script from `69e6039f8f`; it moves
`/GAMES` to `/ROCKNIX`. `T23-predecessor-run101-*` runs `b2378d9c33`, moving
`/ROCKNIX` to `/Rasteratops`. Their actual interrupted pointers/cloud hashes
and script hashes are recorded before replacing the script with candidate
source. No recovery record is fabricated. Four of the original ten controls
failed before #391's fix. Additional cases interrupt the recovery again,
preserve custom/root content choices, refuse foreign shelves and preserve both
versions in a marked merge.

Known old derived content and discarded shelves now take the normal recorded
step, rather than an early content-only return. The shelf is retained separately
in the recovery record: current saves/backups pointers remain authoritative,
including when another device still writes either old tier. Populated/empty
content-only controls and the stronger shelf boundary controls cover the11
broad regressions found in the initial fix. Earlier schema1 records without the
optional shelf field still retry from their original saves source. Current primary pointers with
old derived content are eligible for the boot retry; a remaining old shelf is
also reported by the folder scan. A marker-only interruption has no local
historical clue: explicit apply or ordinary wizard seeding finishes publication;
we do not add a network probe to every boot/direct transfer or invent a record
on an unmarked cloud just because its name resembles our default.

Guest runner `tools/rasteratops-vm-cloud-epic` now has T17 settlement fault/recovery,
T19 unlinked/local-path refusal, T23 tier/delete/marker retry and follower-config,
and T26 unsupported-marker controls. `migration-protocol.sh` is sourced only
after the runner verifies guest d and the synthetic backend. It uses the
image's own scripts/rclone, a temporary provider-operation fault shim, separate
fixture resets, saved statuses/pointers/hashes, and cleanup of the shim. The
follower-config assertion on one guest is **not** the required two-guest proof.
Shell parsing and the runner's constructed failure are host checks; these new
guest cases are not claimed executed until P3 supplies their image receipts.

# Rasteratops 0.0.1 — second reader, refutation pass (audit #375)

**Inputs:** 02/03/04, `evidence/source-review.md`, the appendix (`cloud_migrate_layout:1-355, 646-748, 1001-1264`; `cloud_setup:700-830`; `GuiMenu.cpp:4680-4740`; both probe scripts; the provenance note), my blind response verbatim. I executed nothing. Every statement below is a **source inference** unless tagged **VM** (`pair-rerun.log`, run101 logs/frame as described by the primary) or **host** (host suite, the two predicate probes, the five-sample benchmark). Classes as in the blind pass: **CPD** current defect, **CFI** conditional on the identity flip, **TOW** tracked open work, **UNP** unproven interaction. Nothing below infers lost bytes; where discovery fails, the bytes stay where they were.

---

## 1. Independent additions and corrections from the appendix

**A-1 — Correction to my G-02, path (b).** The boot-place CREATE IT (`GuiMenu.cpp:5383`) runs `cloud_migrate_layout --apply` before seeding. In `main`, with a superseded saves folder that holds no save files (`:1041` → `superseded_source` finds nothing → `src` empty), the Backups tier is still judged on its own listing: `:1116` `has_entries "${remote}${backups}/"` (no excludes), `:1143-1145` adds `backups` to the plan, and `:1198-1204` announces `SETTINGS BACKUPS` and calls `relocate … SETTINGS_REMOTE` — copy, verify, pointer, delete. Only the saves pointer moves bare (`:1216-1218`). So the boot CREATE IT path **carries the archives**; my blind "whether `--apply` relocates a non-empty Backups tier when saves are empty" is answered yes. G-02 survives only on paths (a) and (c) (§3).

**A-2 — Correction to my G-03's consequences.** (i) `seed_note` fails closed: `cloud_setup:800-803` writes no README when the folder cannot be listed; only the `rclone mkdir` loop (`:765-775`) runs unconditionally. (ii) A settle that exits 2 (unreadable conf) is covered: `:746-752` exits before any mkdir. (iii) Recovery exists in two of three shapes: a device with no local saves rejoins via `layout_join` (`:839-862`; README excluded at `:842`), and a fleet recovers via a sibling's MOVE (`fleet_made` `:896-898`; merge at `:1119/:1127`; the merge shape is **VM**-shown by pair 5n). Residual: a lone device with local saves. (iv) Seeding a superseded folder that **does** hold saves (settle returns 3 at `:880`) is designed behaviour — **VM**: pair step 2 prints `OK /ROCKNIX/Saves … OK /ROCKNIX/Content/BIOS` after the join. My blind trigger ("whenever `--settle` cannot answer") was correctly scoped; the consequence was overstated and the window is narrower (settle fails, seeding succeeds: the `timeout 30` at `:739` against per-call bounds, or rc 1/4).

**A-3 — New (Low, UNP): the layout marker is written only after a successful content move.** `main:1249` `migrate_content … || content_rc=$?`; `:1255-1258` returns before `write_marker` at `:1259`. `migrate_content:692-703` returns 4 ("REFUSING … already exists") when `/Rasteratops/Content` exists, is not a partial copy of the source, and no marker is present. Result: saves and backups are at `/Rasteratops`, content is not, **no marker**. Every later `--apply` on this device re-enters `:1012-1028 → migrate_content → 4`, so the marker is never written; every sibling then hits `fleet_made` false at `:1119/:1127` and REFUSES instead of merging. A self-reinforcing stuck shape. Precondition is rare (a pre-existing, foreign, unmarked `/Rasteratops/Content` — a player's own folder of that name, or an earlier interrupted move from before #356's marker). Transient copy failures (return 5) do not stick: `resumable` (`:663-667`) lets the retry proceed and then writes the marker. Proposed cell for #365's table; a fixture (hand-made `/Rasteratops/Content/foo`, then two devices' moves) settles it. Nothing is lost in this shape; the player sees "didn't move. Try again." with a retry that cannot succeed.

**A-4 — New (minor, UX/time): `--apply`'s planning phase is silent and listing-heavy.** Before the first `>>> unit` (`:1200`), `main` runs up to ~12 listings (`:1041, 1087-1088, 1116-1118, 1124-1126, 1143, 1146, 1154, 1162, 1184-1189, 1199, 1212`), each an rclone start — "a second on a handheld" by the project's own estimate (`cloud_backup:1695-1696`). The MOVING page shows no row for that span. Not a defect; a note for the move page and for any handheld timing of #353.

**A-5 — Question, not a finding.** `cloud_setup:823` seeds a README saying "Settings backups, one folder per handheld", while every reader lists the Backups root non-recursively (`cloud_scan:210`, `cloud_restore:2120`, `cloud_backup:2385`). Either the README text is stale or the readers miss sub-folders. One `grep -n 'device_dest=' cloud_backup` settles it; pair step 1 ("a's settings backup is in /ROCKNIX/Backups") suggests the flat layout and a stale README.

**A-6 — Provenance resolved.** The appendix answers three of my blind "cannot establish" items: both probes are host reproductions with the stubs shown (bucket probe: `lsd→0`, `lsf→5`, `bucket_based→true`; archive probe: the exact `:219` regex); the benchmark is N=5 per root, synthetic WebDAV, run101, medians 325/266 ms (first samples 669/621 are warm-up; the median is the right statistic); the freshness run exited 2. I treat these as **host** evidence, not guest runtime.

**A-7 — Packet quality.** 58 PARTIAL entries in 02 share one boilerplate gap sentence and group-level evidence lines (every AC-344-* cites the same list). For the grading artifact each PARTIAL needs its own named missing proof; otherwise PARTIAL is indistinguishable from "not looked at".

---

## 2. Primary findings

### F-01 — High, CFI (#376). **Agree; survives refutation.**

Same finding as my G-01; the primary's consumer list (`cloud_scan:219`, `cloud_restore:2125,2143`, `cloud_backup:2387`, `backuptool:143-167,1459,1463,1827`) is complete for the packet. **Host:** `archive-identity-probe.sh` is the production regex with the two names.

Refutations tried:
- *"The rename might keep OS_NAME."* AC-337-06 requires `OS_NAME="RASTERATOPS"`. The trigger is planned, not hypothetical.
- *"The newest-overall fallback mitigates."* `cloud_restore:2130-2149` restores the newest archive when `mine` is empty. On a **single-device** cloud this does recover the old archive via `cloud_restore --yes` (CLI, and the journey prompt at `main.cpp:1108`) — a real narrowing. On the maintainer's own fleet (three devices plus the Nova, 04 § route 6) it inverts the risk: once one device uploads a `RASTERATOPS_` archive, every other device's `mine` is empty and the fallback applies **that device's** settings, journalled as "made on <other>" (`:2143-2149`). That is the shape AC-349-05 forbids by default. The UI route (`GuiMenu.cpp:4858-4861`) dims the row and offers nothing. So the fallback narrows the single-device case and worsens the fleet case; High stands, conditional.
- *"Retention deletes nothing."* Correct and worth recording: `cloud_backup:2390-2391` leaves non-matching archives alone. Fail-closed; no deletion risk from F-01.
- *Local recovery:* `backuptool:143-144, 159-161` flips both the new name and `LEGACY_BACKUPFILE`; the comment at `:152-156` says the design is safe *because* the suffix never changes.

**Falsifiers:** a commit pinning the archive suffix to a constant that does not flip (or matchers accepting both suffixes) with a **VM** run of a branded image against a seeded `…-ROCKNIX_SETTINGS.tar.gz` where the SETTINGS row is offered and `backuptool` lists it; or a register row keeping `OS_NAME=ROCKNIX` (which would contradict AC-337-06). Note for grading: `pair-rerun.log` checks archive **presence** at `/Rasteratops/Backups` (PASS 4), not matchability — a branded rerun of that tool would not catch F-01.

### F-02 — Medium, current predicate (#377). **Agree on the predicate; narrow the exposure; correct the acceptance route.**

`cloud_backup:819-825`: `bucket_dir_listed` returns 1 for "parent did not list" and "name absent" alike; `:1677-1678` turns that into `list_rc=3`; `:1680-1684` prints the offer and returns 0. **Host:** the probe shows `>>> offer create-saves-folder|/ROCKNIX/Saves`, `exit=0`, with `lsf→5`. The comment at `:1671-1673` promises the opposite. Sibling: `bucket_based` (`:809-818`) caches a failed features query as 0, unbounded, so a real bucket can fall through to `mkdir` of the superseded folder (`:1702`). Contrast the same project's `list_or_stop`/`absent_not_broken` (`cloud_migrate_layout:315-348`) written after "a provider error taken for absence" (`:73-80`).

Refutations tried:
- *Reachability.* `superseded_saves_setting` (`:830-839`) whole-string-compares `SAVES_REMOTE` with `/GAMES` or `/ROCKNIX/Saves`. On S3/GCS/B2/Azure the first path component is the bucket and `GAMES`/`ROCKNIX` are illegal names (uppercase; B2 minimum six characters) — `cloud-test-backend:800-806` says as much. So the **backup** branch is reachable only on bucket-based remotes with permissive container naming (Swift-shaped). Exposure Low there.
- *The restore sibling is not so gated.* `cloud_restore:1676-1679` applies `bucket_dir_listed` to **any** `SAVES_REMOTE`; a transient `lsf` failure there, followed by a successful parent probe at `:1712-1716`, yields "Nothing to restore yet" + offer + exit 0 — a silent skipped restore on any bucket user. Wider exposure than backup, same predicate class, still no deletion.
- *Severity.* Medium is right for the class (false absence violating the project's own rule, plus a misleading SKIPPED card via `ThreadedCloudSync.cpp:492-494, 524-528`); the backup instance alone would be Low.

**Correction to the primary's route (04 § route 2 / Finding verification):** "a whole-script S3 fault case" **cannot reach** `cloud_backup:1674-1686`, because no legal S3 bucket satisfies `superseded_saves_setting`. Acceptance for the backup predicate needs either a Swift-shaped backend or a stubbed `rclone backend features` plus a reachable superseded literal; S3 fault injection does exercise `cloud_restore:1676`. Three-way (present/absent/error) in both helpers is the fix shape.

**Falsifiers:** showing `bucket_dir_listed` propagates the `lsf` exit (it does not — `grep -qx` alone); showing no supported bucket-based backend accepts `GAMES`/`ROCKNIX` as a container *and* that `cloud_restore:1676` is unreachable (it is reachable for any path).

### Boot card overlap (#363) — **Agree, TOW.** `ThreadedCloudSync.cpp:719-722` clears `mInstance` before the linger at `:733`; `GuiMenu.cpp:5550` and `:5579` gate on `isRunning()`, not on the notification. **VM:** the saved E frame as reported by the primary; I have not seen the frame.

---

## 3. Blind leads, one by one

| ID | Blind | Now | Class | Tracking |
|---|---|---|---|---|
| G-01 | High CFI | **Agree** (= F-01); fleet-fallback worsening added | CFI | #376 |
| G-02 | Med CPD | **Narrow**; path (b) refuted by A-1; re-grade Low–Med | CPD (cell) | new cell → #365 |
| G-03 | Med CPD | **Re-grade Low**; consequences narrowed by A-2 | CPD/TOW | T17 under #365 + comment at `cloud_setup:736` |
| G-04 | Med CPD | **Agree** (= F-02); exposure narrowed; restore sibling wider | CPD | #377 |
| G-05 | Low–Med TOW | **Agree**; benchmark conditions now known | TOW | #364/#365 |
| G-06 | Low TOW | **Agree**; exit 2 confirmed | TOW | #361/#362 |
| G-07 | Low TOW | **Agree** | TOW | #366 |
| G-08 | Low CPD | **Re-class**: documented design rule, uncovered cell | design/UNP | cell → #365, maintainer's call |
| G-09 | Low CPD | **Narrow**: bounds inconsistency, needs a stated budget | CPD (minor) | new, minor |
| G-10 | Low CPD | **Agree**, confirmed by appendix | CPD | new, Low |
| G-11 | Low UNP | **Agree**; appendix confirms the root probe in every non-follow mode | UNP | new, verification item |
| G-12 | Low | **Narrow**: items 1–2 are body reconciliation (TOW); item 3 is a wording-accuracy note | TOW/minor | #354 body work |

**G-01.** Agree with F-01 in full; see §2 for the fleet-fallback addition and the falsifier. Nothing in the appendix weakens it.

**G-02 — Backups tier stranded when saves are empty.** *Narrow.* Path (b) is refuted by A-1 (`--apply:1116-1123, 1143-1145, 1198-1204`). Path (a) stands: in the Setup place `createEmpty=false` (`GuiMenu.cpp:5470`), a `superseded-empty` state goes straight to `then → seed` (`:7412-7427`) → `cloud_setup:739 --settle` → `layout_settle:880-882` tests `has_files` on the **saves** folder only (`SAVES_EXCLUDES` at `:371` exclude `/backup/**` and `/Backups/**`; `/ROCKNIX/Backups` is a sibling and never in that listing anyway) and re-points `SETTINGS_REMOTE` with no copy (settle "a setting, nothing copied", `:834-836` for join; settle writes at `:882`) → `:765-775` makes an empty new Backups → `cloud_scan:210-219` lists it → `MINE=` empty → `:4858-4861` dims the row. Path (c) stands: `cloud_scan:175-181` → `layout_follow:814-816`, "Nothing is copied or removed here" (`:795-796`). Realistic shapes: a settings-only user re-linking a remote; an old-build device that wrote only a settings archive into `/ROCKNIX/Backups` after the fleet moved (the settings-backup twin of pair 5n — 5n seeds a **save**, so `has_files` fires and MOVE merges; a settings archive would not). **VM coverage:** none of the 42 pair checks has an empty saves folder beside a populated Backups folder. Nothing is deleted; the archives remain under the old name with no screen pointing at them. **Falsifier:** `docs/rasteratops/cloud-folder-state-table.md` already carrying this cell with a copying actor, or a VM case (conf `/ROCKNIX/Saves`, one archive in `/ROCKNIX/Backups`, no saves, Setup-place step or follow) ending with the SETTINGS row offered. Unknown from the packet: how `folderStep` (`:7410`) is set, i.e. whether the Setup place runs for a carried superseded conf at all.

**G-03 — Seeding a superseded folder when settle cannot answer.** *Re-grade Medium → Low.* The code gap is real: `cloud_setup:739-740` uses settle's result for a log line only; `:784-788` applies the `--superseded` guard to the marker, not to the mkdir loop; the comment at `:736` ("changes nothing") describes the settle, not the seeding. But per A-2 the window needs settle to fail while individual `mkdir`/`lsf` calls succeed (the `timeout 30` against per-call `--contimeout 15s --timeout 30s --low-level-retries 3` at `cloud_migrate_layout:256`, or rc 1/4), READMEs land only when the folder lists (`:800-804`), and recovery exists via join or sibling merge for all but a lone device with local saves. The primary already lists "Setup failure × seeding … T17; fault-injection case needed" in 03 — so this is substantially **TOW under #365**, with the mkdir-loop guard as the one concrete code suggestion. **Falsifier:** a fault-injection run (settle killed at 30 s, cloud then answering) in which `/GAMES` is not seeded; or a `--superseded` gate added to `:765`.

**G-04.** = F-02. Agree; see §2. The probe script resolves my blind uncertainty: it **is** the bucket branch, not a path-backend `lsd=3`. The `bucket_based` cache point (`:809-818`) stands as the second half; its consequence (mkdir of the superseded folder) shares the Swift-only reachability.

**G-05 — Exit-sync cost and the narrowed guard.** *Agree, TOW.* `last-good-scripts-test:13391` enumerates `follow|join|settle|apply|state`, so AC-363-01's literal text ("no call to `cloud_migrate_layout`") is not what the test checks; the primary independently marks AC-363-01 FAIL on the probe at `cloud_backup:1674-1686`, so no verdict depends on that test. `:1674` precedes the `--recent` short-circuit at `:1700`, so the promise at `:1695-1699` no longer holds on an earlier default — source-confirmed. **Host:** N=5, WebDAV, medians 325/266. Decision belongs to #364 (D-WORKFLOW-134) against a handheld number. **Falsifier:** a handheld benchmark on an earlier default within 30 ms; or a register row accepting the cost.

**G-06.** *Agree, TOW.* Exit 2 now stated. `raofflineproxy`'s reason reads "pending the maintainer's disposition" — the register row AC-361-01 asks for does not yet exist by the tool's own words; 13 behind, not four (primary agrees in route 4). `libsoup` reason vs `webkitgtk CURRENT` is a wording tidy for #362. **Falsifier:** exit 0 on the candidate tree with the rows written.

**G-07.** *Agree, TOW.* `cloud-test-backend:806` bare `/GAMES`; **VM:** run101 `round-trip.log` 0/9 as described. Guard gaps at `:8937` (pattern needs a tier suffix; `.*# ` exclusion drops a live literal with a trailing comment) are refinements for #366's AC-01. No new issue.

**G-08 — Source selection order.** *Re-class.* The appendix confirms configured-first (`:82-87`) and that `--apply` re-points only when the configured folder is **empty** (`:1041-1059`), and shows the rationale is written down (`:73-74, 89-92`). With files in both defaults the device moves its own configured folder — defensible: those are the saves it has been writing. Fleet recovery is the sibling's MOVE/merge (**VM** pair 5n shape). The lone-device case (ran the fork's earlier build, reverted to stock, both populated) is an uncovered cell, not a bug against a stated rule. **Falsifier:** a register row naming configured-first as the rule for populated folders (then this is nothing), or a cell in #365's table.

**G-09 — Timeout arithmetic.** *Narrow to minor.* Confirmed: under `cloud_scan:163`'s `timeout 20`, `--join` runs the root probe (`:938-941`), features (`:952`), then one to three listings (`:842/:850`, `:96-99`), each allowed 15 s connect and 30 s total with retries; `absent_not_broken` can add climbs. On a degraded-but-working cloud the result is "YOUR CLOUD STOPPED ANSWERING" with TRY AGAIN — truthful enough that this is a budget question, not a defect. **Falsifier:** a stated page budget (e.g. "20 s is the scan's bound; a cloud slower than that is reported as not answering") in a register row.

**G-10 — `CONTENT_REMOTE=""`.** *Agree, Low, confirmed.* `conf_get`/`conf_value` (`:137-189`) print the empty string for present-empty and nothing for absent — indistinguishable to callers; `:1224-1227` deliberately reads empty as "a value nobody chose" (the stock conf shape, case B), and `:114, :819-821, :883-885` re-point it. `cloud_setup:755-763` deliberately reads present-empty as `--use-content-root`'s "the cloud's root" (#308 F-RS-20). Both are intentional and they conflict for one shape: a deliberate root choice on a device that joins, follows or settles. After settle the two agree again (settle rewrites the pointer before seeding reads it), which is why case B now behaves. **Falsifier:** `--use-content-root` writing a distinguishable value, or a decision that root choice yields to layout moves.

**G-11 — Root-listing dependency.** *Agree, UNP.* `main:938-941` probes `rclone lsd "${remote}"` for every mode but `--follow`; the opening scan runs `--join` for every player (`cloud_scan:163`) and lists the root at `:238`. `cloud_restore:1712` needs only the parent. Prefix-restricted bucket credentials would turn every transfer-page open into a stop (`unreadable` → `stop_on` → "SOMETHING WENT WRONG" for an rclone exit 1). Not exercised by the QA backends. **Falsifier:** a run with a prefix-only IAM policy passing the opening scan; or a documented credential requirement.

**G-12 — Words.** *Narrow.* Items 1–2 (AC-352-02, AC-353-05 vs in-code strings) are body reconciliation the primary already calls out ("old issue proposals must yield to D-CLOUD-164/167"); AC-353-05's proposed `/ROCKNIX/Saves` is a hit for AC-353-C01's sweep. Item 3 — `GuiMenu.cpp:5330` "YOUR OTHER DEVICES WILL FOLLOW" is exact only for devices whose old folder is empty (`layout_follow:810-814`); others get the MOVE question and a merge — is a player-language accuracy note for the maintainer, Low.

**Minor notes (unchanged):** pointer writes outside the cloud lock under an external `timeout` (`:815-821, :856-858, :881-885`; millisecond window, read-back at the next scan); `cloud_scan` exits 2 for both usage and an unreadable conf (`:124, :195`); three copies of the default root (`cloud_migrate_layout:57-59`, `cloud_setup:753-762`, `GuiMenu.cpp:5321`).

---

## 4. Tracked work vs. newly found

| Already tracked | Newly found in this audit | New cells for #365's table (not issues) |
|---|---|---|
| #363 card overlap, after-card ordering; #364 legacy listing cost; #365 T-cells/epic proof (incl. T17 settle×seeding = G-03's core); #366 fixture/`/GAMES`; #356 ladder/`cloud-layout.md`; #361/#362 pins; #337/#344 identity/release | **F-01/G-01** (#376); **F-02/G-04** (#377, with the restore sibling and the S3-unreachability correction to its acceptance test); **G-10** semantic clash; **A-3** marker-after-content stuck shape (Low, UNP) | G-02 (saves empty / Backups populated, Setup place and follow); G-08 (both defaults populated, lone device); A-3 fixture; G-11 restricted credentials; G-09 budget |

Source-inference vs **VM**-proven: the 42/0 pair run proves join, move, follow, missed-step offer, merge of a late save, and the dead-endpoint control on ROCKNIX-named images **for shapes where the saves folder holds files**. None of G-02, G-03, G-08, A-3 or the F-01 identity flip is among those shapes. The two probes and the benchmark are **host** evidence of the exact production predicates, not guest behaviour.

---

## 5. Limits of this packet

1. **No branded image exists**, so every F-01/G-01 consequence is a source inference awaiting the one build that would show it; the pair tool as written would not detect it (§2).
2. **Setup-place reachability:** how `folderStep` (`GuiMenu.cpp:7410`) is set is not in the packet; G-02(a) depends on it.
3. **Still unseen code:** `CloudOffer`, `cloudScanFacts`, `ThreadedCloudSync`'s `mOffer` handling across the restore-then-backup pair (`main.cpp:679-684`), `cloud_setup --content-location`, `device_dest`'s definition (A-5), `cloud_backup`'s settings-backup path (whether D-CLOUD-172's guard also covers it — relevant to G-02(c)), the `.layout` version comparison AC-356-02 relies on, and the `Saves-replaced` relocation beyond `:1229-1235`.
4. **The E frame and the state table** are described, not shown; I accept the primary's reading of both without having inspected them.
5. **Bucket-backend reality:** which bucket-based remotes the fork supports with permissive container naming (Swift) is not stated; F-02's backup exposure hinges on it.
6. **Benchmark and probes are host-side**; no handheld timing, no guest reproduction of the two predicates.
7. **02's PARTIAL entries** share boilerplate (A-7); I could not re-derive which specific proof each lacks and did not re-grade them individually.

My leads remain leads. The grading artifact should close G-02(a)/(c), G-03's residual, G-08 and A-3 with VM cells, and should run F-02's acceptance on a backend that can actually reach `cloud_backup:1674`.
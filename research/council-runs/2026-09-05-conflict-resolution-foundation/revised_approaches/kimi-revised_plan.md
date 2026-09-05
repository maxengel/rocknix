# Step 3 — Revised foundation for cloud-save conflict resolution in ROCKNIX

**Author:** the member who wrote `kimi-analysis.md` in Step 1. This document stands alone: it is the foundation I would build, revised after the Step 2 critiques. It concedes what was refuted (with the reviewer named), defends what I still hold, adopts what others got right (credited by filename), separates the load-bearing from the optional, and states every decision change explicitly.

Sources are cited by repo-relative path; the full declared paths and the Facilitator-verified sha256 values are in `corpus.provenance.json` at the end. I did not re-read or re-hash any file; the embedded corpus is my read-at-time corpus.

---

## 1. What the critique changed, in one paragraph

The spine of my Step 1 survives: detection must be the manifest three-way test (sha256 identity vs. a locally held agreement record), not `rclone bisync`, because sha256 is the only comparison that works on a hashless backend and because bisync's own agreement state has no named writer after a manual wizard apply. Three reviews converged on that (`claude_peer_review.md` §6, `gemini_peer_review.md` §5, `gpt_peer_review.md` §3). Around that spine, the critique forced real corrections: my endorsement of ES's slot/copy primitives was refuted by verified code readings in `gpt-analysis.md` §1.8; my "size-plus-relist" verification shortcut was refuted by `gpt_peer_review.md` §3; my #10 "Option A" violated the project's own attribution rule; my claim that the manifest has no PNG entries was simply wrong (`gemini_peer_review.md` §3); my auto-state "storm" was asserted on a premise that `es/SaveState.cpp` partially falsifies; and my concurrency mitigation was too weak (`mistral_peer_review.md`). Each is owned and corrected below. I also adopt the two findings no analysis had: the mid-session transient-file hazard and the one-way interim posture (`claude_peer_review.md` §5), and the harness/transport/exit-code findings of `gpt_peer_review.md` §5.

---

## 2. The foundation (load-bearing — get these wrong and the milestone is unsafe)

### F1. Identity: unchanged

A save version is the sha256 of its stored bytes; slot and file name are attributes (D-CLOUD-030; `docs/save-manifest-schema.md` §1). **No reopening.** One strengthening observation, adopted from `claude_peer_review.md` §5 A: ES's `setupSaveState()` creates a transient byte-identical copy mid-session (slot N copied to `.state.auto`, and in incremental mode to `game.state<next>`; `es/SaveState.cpp`). If a sync overlaps a session, that copy can reach another device as a zombie slot — and D-CLOUD-030's compaction (same hash in two slots → remove the higher after re-verification, logged) already cleans it up by construction. The register row is not merely safe here; it is the designed remedy.

### F2. Manifest: shape stands; five amendments as one explicit refinement of D-CLOUD-031

The per-device JSON at `savestates/.rocknix/manifest-<device-id>.json`, union-read, keyed by path relative to the sync root, with the agreement record local and unsynced (D-CLOUD-031) — endorsed. My Step 1 claim that it needed no changes was wrong (concession to `gpt_peer_review.md` §3). Five amendments, proposed as one new register row citing D-CLOUD-031:

1. **`origin` sub-object** (adopted from `gpt-analysis.md` §1.9 via `claude_peer_review.md` §6). When a device materialises a version it did not produce — a downloaded winner, a KEEP BOTH re-slot, #37's copy-to-free-slot — its manifest entry records the *producer's* `device`, `core`, `core_build`, `captured_at` copied from the source entry, as `origin`. This is an honest observation, not a stamp: "nothing stamps a file it did not write" is preserved because the writer's own provenance fields stay distinct from `origin`. Without it, a merged copy's provenance dies at the first re-slot (the alignment review's "#24 — a merged copy is a new entry with `replaces = null`" is exactly the gap).
2. **`screenshot_sha256`** (adopted from `gpt_peer_review.md` §5.7 / `claude_peer_review.md` §6). The picker's premise is choosing by picture; a manifest can name the right state and a stale PNG. Record the PNG's hash at capture; the wizard renders no picture on mismatch rather than a wrong one.
3. **`group` key + `rom: null` for shared containers** (my §3.2, re-scoped per `claude_peer_review.md` §3 revision 4: the canonical cases are PPSSPP's per-game-ID directory and the Dreamcast shared VMU, which the corpus itself names in `cloud_sync-rules.txt` and D-CLOUD-028 — not the N64 pair, where the two files are largely independent). All paths sharing a `group` resolve as **one decision**; a conflict in any member conflicts the unit. The grouping table (which layouts form units) is #21's data, like the core→package map; unknown layouts stay ungrouped, and grouping errors must merge decisions rather than split them — a stitched multi-file save is the corruption case.
4. **Parse-failure rule**: an unparseable cloud manifest → that device's entries are `unknown`, retried next pass; our temp-and-rename writes plus regeneration every capture make it self-healing (adopted from `claude_peer_review.md` §6).
5. **Identity-collision rule** (my §3.15, converged by `gpt-analysis.md`): `cloud_device_id` honours the stored value, so a cloned card duplicates an identity and two devices would write one `manifest-<id>.json`. If a manifest's `device.model`/`family` changes incoherently between observations, the reader warns and treats its entries as `unknown`.

Plus a **transport rule** (not schema, recorded in the same row): `/savestates/.rocknix/**` is excluded from every tree transfer by an *unconditional command-line exclusion*, and manifests move only by explicit single-file copy — our own uploaded after the tree pass, foreign manifests fetched into `/storage/.cache/cloud_sync/manifests/` for reading. Adopted from `gpt_peer_review.md` §5.4: "each device writes only its own" must constrain transport, not just capture — otherwise the exit upload (no `--update`; `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`) republishes a stale cached foreign manifest over the producer's newer one. Command-line exclusions are the unconditional mechanism because rclone applies `--exclude` ahead of `--filter-from` (verified per `.claude/rules/rclone-cloud-sync.md`), while a defaults-file rule is not unconditional — user rules precede defaults (`cloud_sync_helper`).

**Tombstones are deliberately not added.** Deletions do not propagate in V1 (F8); a tombstone field is #25/V2's additive change.

### F3. Detection: the manifest test is the sole classifier; a staging mirror is its substrate; bisync is demoted

**The classifier** is the schema §3 three-way test (L local hash, C cloud hash, A agreed hash), with these specified rows:

| Situation | Verdict | Action |
|---|---|---|
| L = C | identical | nothing; **if A unknown, write agreement** ("observed-equal") — adopted from `gpt_peer_review.md` §5.3, closing the first-run false-conflict loop |
| L ≠ C, L = A | cloud changed | download, no prompt |
| L ≠ C, C = A | device changed | upload, no prompt |
| L ≠ C, both ≠ A | divergent | wizard |
| L ≠ C, A unknown | divergent (never agreed) | wizard — conservative; `unknown`-both included (alignment review §3.5) |
| one side only | one-way | transfer, no prompt |
| same hash, new path | move | re-key, no conflict (D-CLOUD-030) |
| absent one side, A says both had it | deletion-attempt | **resurrect, logged** (F8); mass-absence → fail closed |
| any member of a `group` divergent | group divergent | wizard, one decision for the unit |

**The substrate** — this is the revision's main new mechanism, synthesised from `gemini_peer_review.md`'s demand that I expand the SRAM/WebDAV case and `gpt_peer_review.md`'s verification requirements. Each sync pass mirrors the remote's saves tree into `/storage/.cache/cloud_sync/stage/` (`rclone copy`, allowlist-filtered, skipping unchanged by the backend's available metadata), then sha256-hashes staged and local files. Consequences:

- **C is learned by content on every backend**, including the QA WebDAV that offers neither hashes nor modtimes (alignment review §1, D-QA-002 row). This is the #53 lesson (`cloud_backup`'s own comment block) applied structurally instead of per-call-site.
- **Budget**: when nothing changed anywhere, the pass costs one remote listing and zero downloads. When something changed, only changed files move. The nothing-changed game-exit path keeps D-CLOUD-028's zero-remote-contact property (F5).
- The staged bytes are **also** the wizard's cloud-side screenshot source, the KEEP BOTH materialisation source, the discard-store source (F7), and the upload-certification input (F4) — one mechanism, four consumers.
- **Honest residual risk**: on a hashless backend the staging skip keys on size alone, so a same-size cloud-side change is invisible until the next size-changing event on that path. The priced alternative (download-and-hash the whole tree every pass) is rejected on budget; the risk is stated, not hidden (blindspot 22's rule: a listing that answers nothing is *unknown*, never "no conflict" — so any path whose decision matters gets download-and-hash confirmation).

**Bisync's role.** Demoted from detector to *candidate bulk-transfer engine*, pending the spike. This amends #22's plan of record and #9's dependency status (no register row made bisync the detector, so no row reversal is needed; the #22 body edit happens in the same action, per blindspot 27's rule). Two spike-independent arguments, which I defend: (a) after the wizard resolves a conflict by hand, nothing writes bisync's listing state back — the next run re-reports or demands `--resync`, and `--resync-mode` defaults to path1, a winner-picks-all pass (futro §4 step 2); (b) D-CLOUD-030 gives us sha256, and no bisync listing compares sha256 against a backend that has no hashes. **Epistemic status, conceded** (to `gpt_peer_review.md` §3): my Step 1 stated bisync's size-only blindness and its post-manual-apply behaviour as settled. They are inference from rclone's documented comparison fallback plus the QA backend's measured properties. The spike is the arbiter; my falsification criteria stand. The spike still runs — `claude_peer_review.md` §1 is right that declining it while asking to reopen a decided dependency is backwards — and its fixtures (both-sides change, rename, interrupted run, external equalization after a manual apply, filter change) double as the adversarial suite for the manifest detector.

**Scope exclusions**: screenshots ride the pre-pass under one-way rules with recency explicitly tolerated — no player progress lives in a screenshot; this is the one place recency is tolerated, stated as an exception, flagged for revisit (my screenshots/** finding stands). Conflicted-copy artifacts (Dropbox "(conflicted copy)", Syncthing `.sync-conflict-`) are never offered as versions and never transferred (alignment review §3.5); the engine's filter set excludes them explicitly, because the shipped saves allowlist currently *admits* a conflicted `.srm` (`gpt-analysis.md`, verified against `cloud_sync-rules.txt`).

### F4. Agreement: one writer, certified writes, scoped keys

- `agreed.json` is keyed by **(remote identity, sync root, path)** — my finding, endorsed by `claude_peer_review.md` §6 as a local-file change. The schema's example binds agreement to nothing; `CHANGE CLOUD FOLDER` is a shipped row (`docs/es-menu-map.md`), and a remembered hash from a different sync relationship authorises the wrong overwrite.
- **The transfer engine is the only writer**, and only after certification. Certification on hash-capable backends: `rclone lsjson --hash` matched against the upload, or a locally computed backend-native hash (hypothesis H2, experiment 4 — adopted from `claude_peer_review.md` §5 D; if it holds, the D-CLOUD-028/`remote_hash`/"no extra spawn" contradiction `gpt-analysis.md` found dissolves, because the value is known at capture, not observed after upload). Certification on hashless backends: re-download the just-uploaded paths into staging and sha256-compare — one extra round trip per upload batch, only where the backend forces it.
- **Concession**: my Step 1 "size-plus-relist" certification is withdrawn (`gpt_peer_review.md` §3). It is the #53 failure shape; a different 65,536-byte SRAM passes it.

### F5. Write paths: gated transfers; capture always; D-CLOUD-029 stands

#22 owns the write paths (futro §5). The new pass shape: stage-down → hash → manifest test → apply non-conflicts (**downloads before uploads**, preserving the boot pair's restore-before-backup property from the replaced-mechanism inventory) → write the same `last-backup`/`last-restore` stamps (D-UI-018 preserved) → record conflicts to a pending-conflicts state file. The exit pass keeps `--max-age`/`--no-traverse` for *candidate selection* but uses the manifest test for *admission*; nothing-local-changed stays zero-remote-contact; boot and menu passes are full passes, so a wrong-mtime file is compared by hash, never skipped by a window (my §3.6 wrong-clock finding, scoped per `claude_peer_review.md` §1: a sha256 detector never classifies by mtime). The #22 refusal ACs stand, exercised through boot, exit, and SYNC row.

**D-CLOUD-028 refinement (explicit)**: the changed-path exit pass may list the remote for paths it is about to touch and may download-and-hash to certify uploads on hashless backends. This is a correctness read, not a reachability probe; the nothing-changed case is untouched. Proposed as a new row citing D-CLOUD-028; `gpt_peer_review.md` §3 and `claude_peer_review.md` §2 both treat this reopening as load-bearing.

**D-CLOUD-029: no reopening — defended.** `gemini-analysis.md` and `mistral-analysis.md` argued for an immediate `--update` stopgap on the exit upload. `102-cloud-saves` refutes the safety premise: it runs `cloud_restore --yes --method=copy --update` *before* the backup at every boot, so a skipped exit upload is overwritten by the next boot's restore — the clobber moves, nothing is preserved (`gpt_peer_review.md` §2 traces both timestamp orderings). The maintainer's "same in kind; the flag changes which copy loses" is correct at the system level. What I adopt from `claude_peer_review.md` §5 B is the **lossless interim posture**: the maintainer (the only user until the wizard ships) may disable the boot pair and the SYNC row via the existing toggles, leaving only the exit upload — no device is ever overwritten, every divergence survives for the wizard's first run, and cross-device pickup stops, which is precisely the operation that is unsafe today. This is a configuration note, not a code change and not a register change.

**Capture (#21) runs regardless of network state** (adopted from `gpt-analysis.md` §1.5 via `claude_peer_review.md` §3 revision 5). Capture inside `cloud_backup` is skipped whenever the sync is skipped (exit 4, exit 3, setting off) — and offline play is exactly when conflicts are manufactured. Capture is local work (hash, manifest entry, provenance fields), serialised with the engine by a manifest-write mutex; it never touches the remote. Capture is **provenance, not detection**: a file written with capture off is still detected (the engine hashes everything) and shown `unknown` (schema §4) — honest degradation, no stamping. Capture records the *launched* core; while the compiled default keeps `racommands = true`, `setupSaveState()`'s core rewrite is dormant (`es/SaveState.cpp`, gated on `!racommands`), so `getCore(true)` at the exit point is accurate **for this milestone**; it becomes a hard dependency the moment #10 ships a config file (`claude_peer_review.md` §2's refinement of `gpt-analysis.md` §1.5).

**Manifest write discipline** (my churn finding, retained): never rewrite the manifest to bump `generated_at`; write only when entries change, or every exit pass defeats the `--recent` window and the round-trip's "nothing changed" step.

### F6. Merge: a checked adapter, not raw ES primitives

My Step 1 endorsed `getNextFreeSlot()`/`copyToSlot()` reuse "as correct and evidence-based." **That was wrong** — conceded to `gpt-analysis.md` §1.8 (and to `claude_peer_review.md` §3, which verified it). I read `SaveStateConfigFile.cpp` closely and `SaveStateRepository.cpp` loosely. The verified facts:

- `getNextFreeSlot()` returns **-99** for an auto-only repository: the `states.size() == 0 → firstslot` early return does not cover a repo whose only state is `.state.auto` (slot −1); the 99999→0 scan finds no slot ≥ 0 and falls through (`es/SaveStateRepository.cpp`). `gemini_peer_review.md` §2's counter-claim is refuted by the embedded code — the early return requires an *empty* vector, not a numbered-slot-free one. This is the commonest KEEP BOTH case (auto conflicts).
- `getNextFreeSlot()` does not refresh the repository; `copyToSlot()` ignores both copy/rename return values and returns `true` unconditionally (`es/SaveState.cpp`); `makeStateFilename(fullPath=true)` derives the destination from the *source's* parent, so a staged cloud file would be "merged" inside the staging dir; `refresh()` deletes the `SaveState*` objects a wizard might be holding (`gpt_peer_review.md` §5.8).

The merge contract is therefore: refresh → allocate (auto-only → `firstslot`; else highest+1; treat −99 as a visible refusal, never a silent fall-through) → **reserve pending allocations inside the plan** (my §1.6's shape, retained — repeated calls before COMPLETE must not hand out the same slot) → compute destinations from the config templates, not from object state → copy state+png → **sha256-verify the destination** → only then remove any source (D-CLOUD-026's copy-verify-delete shape) → audit line *before* any deletion. KEEP BOTH on an auto conflict: the winner keeps `.state.auto`; the loser is re-slotted to the allocated numbered slot with its PNG.

### F7. Presentation: IA rev 4 plus a rev 5 amendment set

The IA (`docs/conflict-wizard-ia.md` rev 4) stands: cloud always left, nothing transfers until COMPLETE, quitting discards decisions, pre-pass gate, done page naming discards, 480×320-first, KEEP BOTH savestates-only and dimmed-with-reason on in-game saves. Amendments (IA rev 5; the IA doc is the design of record for #23, not a register row):

1. **Keep discarded saves defaults to ON, bounded** — conceded to `gpt-analysis.md` and `claude_peer_review.md` §6: two SRAM panels can both read unknown/unknown with untrusted clocks, and console-first means a support-only log is not a recovery path. The store lives at `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` — **outside the sync tree**, so no allowlist rule is needed at all and `gpt_peer_review.md` §5.5's user-rules-precedence hazard cannot apply. My §1.7's "priced download" of the cloud-side loser is now genuinely priced: it rides the staging mirror, zero extra round trips. Retention: last N discarded versions per path (default 3) with a global entry cap as backstop; the count selector remains the retention rule.
2. **`clock_synced: false` is rendered** on both panels (my §1.5.5; `mistral-analysis.md` converged).
3. **Multi-file units present as one conflict row** (F2c).
4. **Conflicts queue; they do not interrupt.** The exit sync never opens the wizard over a player who just finished a game; it records conflicts and the card says so. A `GAME SETTINGS > CLOUD SETTINGS` row ("N SAVE CONFLICTS TO RESOLVE") is the way in, and the menu-triggered SYNC's completion surface links to it. This amends rev 4's "a sync that reports conflicts opens the wizard" and structurally defuses the auto-conflict frequency problem whatever the census finds.
5. The headless handoff is a **state file + badge**, not an exit code (F11).

Rejected from `claude-analysis.md` (defended): renaming the CLOUD header to the producing device (residence and producer are two facts; the IA already shows both — `gpt_peer_review.md` §1 concurs); `session_seconds` (a settled product choice and unreliable progress evidence — `gpt_peer_review.md` §1 concurs). The launch-time resume tile is parked to #37's futro.

### F8. Deletion semantics: new register row

V1: **deletions never propagate.** Absence on one side where agreement says both had the file → one-way transfer (resurrect), logged. Mass absence (all entries, or an unreadable/empty sync root) → fail closed: no transfers, loud error — absence is not proof of intent (`gpt_peer_review.md` §1: interrupted layout change, unmounted storage, emulator temp rename, external client), and the changelog's "empty or unreachable cloud folders refuse to act" is the shipped precedent. Deliberate deletion propagation is V2, designed with #25's snapshots as the safety net; the schema adds a tombstone additively then. This closes the gap my Step 1 named (deletion absent from the IA scope table and schema §3) in the conservative direction the cardinal rule requires.

### F9. Concurrency: a degradation contract, strengthened

`mistral_peer_review.md` is right that my Step 1 mitigation (pre-upload check + audit) was insufficient. The contract is now four-part: **(1)** recheck the remote object immediately before any overwrite — the staging pass is recent by construction, and the wizard re-stages the conflicted paths at COMPLETE; a mismatch becomes a conflict, never an overwrite. **(2)** Never overwrite a remote object that differs from agreement without first holding its bytes (staging / discard store). **(3)** Audit every overwrite with before/after hashes. **(4)** State the residue honestly: one round trip between recheck and write, with no compare-and-swap on arbitrary backends, is an accepted risk under the one-player-never-concurrent model — and because of (2) and (3), even a lost race is recoverable. Under this contract my §3.13 trace ends differently at the first writer: A's recheck sees B's upload ≠ A's agreement → conflict, not overwrite. `gpt_peer_review.md` §3's demand — "the lock is advisory" must not become "progress is protected under concurrency" — is met by (4)'s honesty, not by a protocol I cannot price.

### F10. Audit: unchanged

D-CLOUD-027 stands (append-only text at `/storage/.cache/log/cloud_audit.log`, rotated, support-only). The audit line for any deletion precedes the deletion (existing AC). Rotation bounds lineage (`gpt_peer_review.md` §1) — acceptable: `replaces` is one step by design and the log was never promised as unbounded history.

### F11. Result protocol: normalise, and never signal conflicts by exit code

Adopted from `gpt-analysis.md` (verified): `cloud_backup`/`cloud_restore` pass rclone's own exit codes through `clean_exit`, and rclone's 3/4 (directory-not-found / file-not-found per `report_rclone_error`) collide with the scripts' reserved 3 (lock) / 4 (no network); `ThreadedCloudSync` renders any 3/4 as SKIPPED — and those paths *do* stamp a last-run, unlike genuine skips. Both scripts also exit with the save-phase status only, masking a system-phase failure. The new engine: a normalized result protocol; conflicts-pending is a state file plus a menu badge; per-phase failures propagate. The collisions are filed as shipped bugs.

### F12. Filters are constructed, never inherited

The engine builds its filter set unconditionally on the command line (exclusions: `.rocknix`, `*.bak` — the session-transient file from `claude_peer_review.md` §5 A — conflicted-copy patterns, `bios/**`, the backup folder; inclusion: the saves allowlist). Two shipped hazards make this load-bearing, both adopted from `gpt_peer_review.md` §5.5: user rules precede defaults in `cloud_sync_helper`, so a defaults line is not a boundary; and a customised nonempty `RCLONEOPTS` that omits `--filter-from` currently syncs with **no allowlist at all** (the fallback only fires on an empty array — `cloud_backup`). The round-trip gains both fixtures; the second is filed as a shipped hazard.

---

## 3. Refinements (valuable, not load-bearing)

- **R1.** `origin` (F2.1) is additive and cheap; V1's wizard can also read the producing device's manifest from the union directly. Required before #37's badge (`issues/issue-37.md`); merely correct before then.
- **R2.** Union-fetch caching: cache foreign manifests keyed by device-id + remote mtime; measure first — five devices × ~20 KB is small but unpriced (`claude_peer_review.md` §5 E).
- **R3.** The SQLite history index beside the text audit log: still #20's open call; V1 does not need it. Default no.
- **R4.** #10's per-core **directory** materialisation is deferred (see decision changes); "core as data" already carries the milestone via the schema.
- **R5.** #19's badge severity: unchanged — the bench decides (D-CLOUD-025), same-chipset control first (`issues/issue-19.md`).

---

## 4. Concessions (owned, named)

| # | My Step 1 claim | Refuted by | Correction |
|---|---|---|---|
| 1 | Reuse `getNextFreeSlot()`/`copyToSlot()` "as correct and evidence-based" | `gpt-analysis.md` §1.8; `claude_peer_review.md` §3 | Checked merge adapter (F6) |
| 2 | "Size-plus-relist" certifies uploads on hashless backends | `gpt_peer_review.md` §3 | Withdrawn; download-and-hash certification (F4) |
| 3 | "The manifest has no entries for PNGs" | `gemini_peer_review.md` §3 | Wrong — schema §6 `screenshot` exists; the real gap is no PNG *hash* → `screenshot_sha256` (F2.2) |
| 4 | #10 Option A: attribute flat states to the default core | `gpt_peer_review.md` §3; `claude_peer_review.md` §3 | Withdrawn — violates "nothing stamps a file it did not write"; `core: "unknown"` + explicit inference marker, never a guess as fact |
| 5 | Auto-state "storm" as a given | `claude_peer_review.md` §3 (citing `es/SaveState.cpp::onGameEnded`) | Hypothesis for the shadow census; frequency is launch-habit-dependent |
| 6 | Bisync's blindness/recovery stated as settled | `gpt_peer_review.md` §3 | Restated as hypotheses; the spike arbitrates; falsification criteria retained |
| 7 | "Nothing touches D-CLOUD-031" | `gpt_peer_review.md` §3 | Wrong; five amendments proposed explicitly (F2) |
| 8 | Concurrency mitigation: pre-upload check + audit | `mistral_peer_review.md` | Four-part contract (F9) |
| 9 | N64 `.eep`/`.mpk` as the canonical multi-file case | `claude_peer_review.md` §3 | PPSSPP per-game-ID and the shared VMU are the corpus's own cases (F2.3) |
| 10 | Shadow-mode census underdefined | `mistral_peer_review.md` | Defined in §8 step 8 |
| 11 | `BACKUPPATH ≠ RESTOREPATH` handled by a warning | `gpt_peer_review.md` §3 | Fail-closed (§6, unknown 7) |

**Checked and not adopted** (to show the adoptions were verified, not absorbed): `gemini_peer_review.md` §5.1's "duplicate-cleanup prompt is broken" is refuted by the embedded source — `controller_confirm` and `ASSUME_YES` both live in `cloud_backup`'s own `load_config`, and `cloud_sync_helper` never calls `controller_confirm`. Its §5.2 (`check_internet` vs `first_remote()` divergence) is unproven — both mechanisms sort the same file's section names; worth one two-remote check, not a finding.

## 5. Defences (held, with the argument made better)

1. **Manifest-primary detection** — my §1.1, now the council's consensus. The ordering is spike-independent: even a perfectly hashing bisync has no writer for its agreement state after a manual apply, and D-CLOUD-030's sha256 is the only backend-independent comparison.
2. **D-CLOUD-029 retained** — the `--update` reopen is refuted by `102-cloud-saves`' restore-then-backup ordering (F5). `claude_peer_review.md` §6 sides with retention.
3. **Wrong-clock stranding (§3.6)** — stands for the shipped paths; in the new engine the window selects candidates but never admits by mtime, and full passes hash everything (F5).
4. **Stale-agreement and first-writer traces (§3.13)** — stand; mitigations in F4/F9.
5. **Hardware-first sequencing** — retained and extended (§8); `mistral_peer_review.md` names it the strongest part of my Step 1.
6. **Manifest churn, headless handoff, discard-store scope, screenshots scope** — stand; incorporated into F5/F7/F11/F3.

---

## 6. Decision changes, stated explicitly

| Row | Change | Argument |
|---|---|---|
| **D-CLOUD-028** | **Refine** (new row citing it): the changed-path exit pass may list the remote and download-and-hash to certify; nothing-changed stays zero-contact | A correctness read is not a reachability probe; without it the exit pass cannot refuse a clobber (my §3.6; `gpt_peer_review.md` §3) |
| **D-CLOUD-031** | **Refine** (new row citing it): the five F2 amendments + the manifest transport rule | Origin-vs-possession gap; PNG binding; multi-file units; parse and identity-collision rules; foreign-manifest republication (`gpt_peer_review.md` §5.4) |
| **D-CLOUD-017** | **Implementation refinement** (new row citing it): "key on core, build as data" stands; the **directory materialisation is deferred** past the wizard | Shipping `es_savestates.cfg` hard-codes `racommands = false` and flips `autosave`/`incremental` defaults (`es/SaveStateConfigFile.cpp`) — a launch-behaviour migration nobody budgeted, not a config change (`gpt-analysis.md` §2.5, verified); it also activates `setupSaveState()`'s core rewrite, making launched-core capture a #10 dependency |
| **#9 / #22 plan of record** | **Amend** (body edits + new row): detection is manifest-diff primary; bisync is a candidate transfer engine pending the spike | §2 F3; no register row made bisync the detector, so none is reversed |
| **New row: deletion semantics** | **Add**: V1 never propagates deletions; resurrection logged; mass-absence fails closed | F8; absence ≠ intent |
| **New row: concurrency contract** | **Add**: recheck-before-overwrite; preserve-before-overwrite; audit; residual window documented | F9 |
| **D-CLOUD-029** | **No reopening.** The one-way interim posture is a maintainer configuration note | F5 |
| **D-CLOUD-030** | **No reopening.** Compaction additionally cleans the session-zombie pair (F1) | `claude_peer_review.md` §5 A |
| **D-CLOUD-025 / D-CLOUD-027** | **No reopening** | — |
| **IA doc** | **Rev 5** (not a register row): discard default on + `.cache` store; clock marker; group presentation; conflicts queue via badge | F7 |

---

## 7. The eleven known unknowns — resolution plans

| # | Plan |
|---|---|
| 1 (chipset axis; loud/silent) | #19 bench, unchanged; same-chipset control first; gates badge severity only (D-CLOUD-025) |
| 2 (bisync behaviour) | Spike reframed: transfer-engine candidacy + adversarial fixtures for the manifest detector; no longer gates the detection design |
| 3 (auto state commonest?) | Hypothesis; the shadow census (§8.8) measures fork frequency per kind; the wizard labels `kind: auto` as a resume point regardless |
| 4 (KEEP BOTH pre-pass gate) | AC stands; the staging mirror makes the gate mechanical — staging is idempotent, an interrupted pre-pass simply re-runs, and the wizard refuses to open until it completes |
| 5 (no `es_savestates.cfg`) | Resolved by deferral (§6): compiled defaults stay for this milestone; #10's directory move gets its own futro with a launch-behaviour rehearsal |
| 6 (core pin not on device) | #21 emits `/usr/share/rocknix/core-pins` at image build; capture is told, not discovering; launched-core capture is accurate while `racommands` stays compiled-true |
| 7 (`BACKUPPATH == RESTOREPATH`) | **Fail-closed**: the engine refuses (logs, no transfers) when they differ, until the two-root case is modelled |
| 8 (standalone multi-file layouts) | `group` key (F2.3); the grouping table covers PPSSPP, VMU, N64, PSX memcards before #23 opens conflicts for those systems; ungrouped multi-file conflicts present adjacent with a "part of a set" hint |
| 9 (480×320) | Layout at 480×320 first; real-thumbnail recognition test on the RG351M (§8.9) |
| 10 (two devices online) | F9 contract + audit; residual window documented |
| 11 (round-trip never run) | **Fix the harness first** (§8.0), then run (§8.7) |

## 8. What must be proven on hardware, in order

0. **Repair `tools/cloud-round-trip` before any run** (adopted from `gpt-analysis.md` §3.1 / `gpt_peer_review.md` §5.9): it overwrites `rclone.conf` *before* asserting the first remote — the docstring's guard is inverted — never restores it, cleans up partially, and carries two assertions that cannot pass against the embedded uploader. VM only, never a configured handheld.
1. **Session-zombie experiment** (`claude_peer_review.md` §5 A): startup sync on, boot, launch from a numbered slot within 30 s, let the boot sync finish, exit, list the remote for `.bak` and extra slot files. One H700, one boot. Validates the `*.bak` exclusion and the compaction remedy.
2. **ES primitive failure paths** (`gpt_peer_review.md` §5.1–5.2, §5.8): auto-only allocation → −99; `copyToSlot` against an unwritable destination → reported success vs. actual bytes; refresh invalidation. Gates the merge adapter's contract.
3. **bisync spike**: loopback WebDAV dry-run, then Dropbox from the device; output shape under `--conflict-resolve none`, loser renaming, `--recover`/`--resilient` after interruption, external equalization, filter-change behaviour.
4. **Local backend-hash experiment** (`claude_peer_review.md` §5 D): `rclone hashsum dropbox` a state on the device vs. `lsjson --hash` of its uploaded copy. Settles whether `remote_hash` can be known at capture.
5. **Core-set divergence** (`claude_peer_review.md` §5 C): diff `LIBRETRO_CORES` across targets in the tree (no device time); if they differ, plant a state under an absent core's directory and open the manager.
6. **#19 bench**: same-chipset control → cross-chipset pairs → loud/silent (truncation, byte-flip with compression off).
7. **Round-trip full run** on the GENERIC_X64 VM, WebDAV **and** MinIO, with the new steps: manifest transport, two-device both-sides-changed (neither copy overwritten), deletion-resurrection, wrong-clock, foreign-manifest republication, discard-store exclusion, no-allowlist `RCLONEOPTS`.
8. **Shadow-mode census** on the maintainer's devices: the detector runs log-only for a fixed window. A **verdict-table bug** is defined as a verdict whose action would have destroyed or stranded data (divergent misclassified as one-way; unknown misclassified as identical; a group split that would stitch). Outputs: fork rate per kind (tests H4), verdict distribution, unknown-rate. Gates enabling the wizard's apply step.
9. **480×320 recognition** with real thumbnails on the RG351M (`gpt_peer_review.md` §6).

Build order after the gates: capture (#21) → detector/staging (#22) → wizard (#23) → merge adapter (#24). #10's directory move and #25 follow with their own futros.

## 9. Unknown unknowns — failure, cheapest experiment

| Failure | Cheapest experiment |
|---|---|
| Mid-session transient files sync out and persist (`.bak`, zombie slot) | §8.1 |
| Foreign manifest republished over its producer's newer one | Harness step: plant a stale foreign manifest locally, run the exit pass, assert the remote's copy unchanged |
| A real rclone error renders as SKIPPED-lock / SKIPPED-no-network, stamped | Force exit 3/4 from rclone; watch card and stamp |
| Torn manifest download crashes or misleads the union read | Truncate a staged manifest; expect `unknown` + retry, not a crash |
| Cloned-card identity collision silently merges two devices' provenance | Copy the ID file to a second device/VM; run both; expect the F2.5 warning |
| A detached emulator writer outlives `process.run()` and capture hashes a half-written save (the legitimate residue of `gemini-analysis.md`'s otherwise-wrong flush-race — page-cache coherence is not the issue) | Shadow mode: hash at exit and again at sync; flag mismatches |
| Customised `RCLONEOPTS` without `--filter-from` syncs the whole tree | Harness fixture (§8.0) — also filed as a shipped bug |

## 10. Unmeasured hypotheses this approach rests on

- **H1.** bisync's behaviour under `none`/`--recover`/`--resilient`/interruption/filter-change/external-equalization — settled by §8.3.
- **H2.** `rclone hashsum <backend>` computes backend-native hashes locally on the device (general knowledge, not corpus) — §8.4.
- **H3.** Rename preserves mtime on the device's filesystem (ordinary semantics; confirm on target) — harness.
- **H4.** Auto-state fork frequency — §8.8.
- **H5.** Core sets differ per target — §8.5.
- **H6.** WebDAV size-only staging skip misses same-size cloud changes until the next size-changing event — residual risk, stated in F3; characterised in §8.3/§8.7.
- **H7.** Staging and union-fetch cost on the maintainer's real library — measured in shadow mode.
- **H8.** Detached-writer lifecycle for standalone emulators — §8.8's double-hash flag.

---

## `corpus.provenance.json`

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "source_count": 42,
  "source_reference_order": "positionally aligned across both arrays",
  "hash_verification": "SHA-256 values verified at embed time by the Council Facilitator and copied from the per-source headers",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "author_step1_artifact": "kimi-analysis.md",
  "peer_reviews_consulted": [
    "claude_peer_review.md",
    "gemini_peer_review.md",
    "gpt_peer_review.md",
    "mistral_peer_review.md"
  ],
  "source_file_paths": [
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/conflict-wizard-ia.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-schema.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/save-manifest-alignment-review.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/plans/conflict-resolution/vita-style-conflict-resolution.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/decision-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/blindspot-register.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/savestate-compat-test.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/rclone-cloud-sync.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/engineering-practices.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/upgrade-and-install.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/.claude/rules/es-native-ui.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/docs/cloud-sync-changelog.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/CLAUDE.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/rclone-bisync-planning.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-11.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-9.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-10.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-19.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-20.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-21.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-22.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-23.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-24.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-25.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-35.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/issues/issue-37.md",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_restore",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/repo/tools/cloud-round-trip",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateRepository.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveState.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/SaveStateConfigFile.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/ThreadedCloudSync.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.launchGame-excerpt-l740-850.cpp",
    "research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/es/FileData.cpp.getCore-excerpt-l1470-1560.cpp"
  ],
  "source_file_hashes": [
    "7e8c1076ee1735925af1d59dded61d23146c5c8e9fb2aae2be53d5afca26b6b7",
    "5738428852899047b9d49902b78e9c5e0d4457f67b09d079fdfeb89fdcfcc6c9",
    "2a794ea3d027402a26e3dfc62ea6184c204211c888c904413d1564ecf3f189ce",
    "56f6c54c013c5476f638a0dee5f2201e6a4ad021b47c674010bdc392665bfd48",
    "d22a49e73fe5d25cafea7646ec353e57a3da95f6ef84d4b86249c91bb170cf43",
    "0a4b1150d907f26cdd70d480830e195b9fa2885920abf48641506bb5a0f09640",
    "1514b33d61ab148d4e59bf446af03d973792a0673969df471b41c021edc9cbd8",
    "4d0b9d21ee5c9c26a25da5c169d9e99b83c18457732bd9471078c2d508b1d1bb",
    "7d43f252d029d54baa98ffa266b9334fa2f0f2da3db2507f451205f40dc73353",
    "e8ee62ea5af749ef09c0ede9da7abc5d7c192d890ae2e737cc369a5c5549c646",
    "d343c805b912141a1f8af7aa8d6025e2379e5335fb197c4cc59adf960fa43cbb",
    "cba905608c0104093b166c88393dba32159dca2b280d8a5229b6668930c8e4d2",
    "3ab8da275237ac1ccf3cab3bf2f019077d7fdef06d2e6afd180313ca80e00d8c",
    "6357ada783d5b09f22bd6fad2745b5c101e68fcdf2f85ffc698975be356cd594",
    "b19a3fd41d9728a0d5ee22aad6fd54c2f2d5199cd5835dbdc695d6e5062f8516",
    "acae778e1ee700e4a7c0120cb5e9be2fb5d2129aa04ef3e75590af2effca60eb",
    "4c6881068dd2be7eca3031e8d929b4d1a5f314eb6d08ba07a1d7cbd735bd207f",
    "cf3f971c8c6d95f0429d7f2937ecb130b1b40f2d12d7681441548230ca48a9c0",
    "4704211f8e92be217eb2f16cd363a6a7c3dacc381f5083b7536e9aa33b79ab0f",
    "b4f54c4e548f514f9429d5ea56dc9c3e246b95b0ae519a4b013891b1d69ffe39",
    "083c6c3504c578da7c283008d1305492f792a82c4b0a30d35007f9776ff6ad90",
    "c87315eb509d89d1ac2f8595c1fb47c9227836fadfbd13cf22122fce5f9806d3",
    "6d998503be831ad800a34bbfa952fc2aeb85ca5f5d959b6d10dad98d0fea6831",
    "016287a95f088a1cf137199a4c50321e0650684b78ecbe1849d995ae52afb6ee",
    "f87746eecfd56f78e477d227a25ddb7cfc2accc4626656c41ac14eeff8285ea0",
    "696bcdba14d33dfeea8e627a90094a2b1955745f32fc28677f54bb97f88099ba",
    "5787b6f79b1f7a9160c0540997d8b2fae1541201224c4bb8bf17b3cacf610210",
    "a43faf60f3fa4d2aa60345815484ff7c862bdba0061befa068e64b1994e0a907",
    "dfd1bf52dca78ab67a1b30b56e3c048d8910863a99ca02442525f58d083a2a57",
    "3a1bec8bb0ef5005f3dd92cdd766beb2c32ef26c5b5ea06fbd6cdb0bb0259de9",
    "8b22b9c82effe0a044ff765f73ecf24e26dd064abf694dc1f37304e2759b8823",
    "60db296dde26bebbf4fcf1b97101188799cedb2eb3260616204a2ee082ce19c3",
    "c9f4d94dc9745bce7bccf99145816e0e45305c8a5058acb6476a1fb56f96eb6c",
    "2b56d6f5fd4a86bfd40578bec43308204f62af513df9b3ed227cf971585f837b",
    "7c3e79bbe41bd70ec1c1f08d9defd04e38af891430616173609bf3e76c2159ee",
    "212e1c8531008b1d25f5f976797d9762c5cfa3061fe70229c546d276784efb49",
    "9931bfdceacc18344d7a6b9eeea0a27278dff46ae04a7f82e5c4efe7300ff51b",
    "848e0746fa26ef5c565af72962c487b0d4185f199f36f2290827bd086e303741",
    "4f38ea7dcfcbd71068122124c428d146b7da3c6dbdcc05a81afc99bbd93a9b15",
    "62f817868c3b803429e62efb7aa8f37aa995213386c6e4303e8e1f490a144ffc",
    "5b341d85de24badb2984fff979226f25f080831a1d194f607b6d6caa6085f233",
    "2410e4316d9c2c3bfb301c39dbe79590fb73682b18e70988527eeecc2a024fa6"
  ],
  "missing_material": [
    {
      "description": "Upstream rclone 1.75.0 bisync implementation and version-specific documentation; several bisync behaviour claims remain hypotheses until the spike",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Utils::FileSystem implementations and ES headers needed to establish copy/rename/lifetime guarantees beyond the embedded excerpts",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Full launcher/process implementation and RetroArch's directory-setting path (setsettings.sh and runtime configuration)",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Executed round-trip, bisync-spike, and savestate-compatibility results",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "description": "Current issue bodies and edited acceptance-criteria lists as distinct artifacts; the embedded issue snapshots are comment-thread exports in which the body cannot be distinguished from the first comment with certainty",
      "declared_source_path": null,
      "sha256": null
    }
  ]
}
```
# Round-2 revised approach — the foundation for cloud-save conflict resolution

**Author:** the member whose earlier artifacts are `claude-analysis.md`, `claude_peer_review.md` and `claude-revised_plan.md`. This document supersedes `claude-revised_plan.md`. It is written to be acted on without having read that plan or the four reviews; where it changes a position I held, it says so and names the review that changed it.

**Evidence markers used throughout:**
- **[V]** — verified in the embedded corpus (a file, a decision row, or ES/script source), cited by path or ID.
- **[K]** — a hypothesis about rclone, a backend, RetroArch or hardware that the corpus does not settle; the experiment that settles it is named in §6.
- **[C]** — a position the council now agrees on that the corpus does not settle. Flagged deliberately, because no reviewer is left to catch it.
- **[M]** — a product or policy call that belongs to the maintainer, with my recommended default.

Paths below are relative to `research/council-runs/2026-09-05-conflict-resolution-foundation/_sources/`; the full declared paths and embed-time hashes are in `corpus.provenance.json` at the end. I did not re-read, re-hash, run, or test anything. `claude-revised_plan.md` itself is not embedded in this prompt; I take the reviewers' descriptions of it as accurate where two or more agree, and say so where I cannot check a characterisation.

---

## 1. What this round changed

### 1.1 Conceded — refuted by a reviewer, and corrected below

| What I held | Who refuted it | Correction |
|---|---|---|
| Multi-file saves: classify per path, mark the group divergent if any member is | `gpt_peer_review-r2.md` §1.3 (the disjoint-member example) | Declared units are classified at the unit level on complete member maps, including membership changes (§2.3.4). |
| `--backup-dir` makes a concurrent overwrite recoverable | `gpt_peer_review-r2.md` §1.4 | Downgraded to "archives the destination object rclone replaced, on backends that honour it" [K]; the residual loss is stated exactly (§2.9); the semantics are a gate experiment. |
| Apply ordering (audit → archive → destructive step) is a sufficient interruption contract | `gpt_peer_review-r2.md` §1.5; partly `kimi_peer_review-r2.md` §2.2.8 | The wizard's plan file is the durable pending-operation record; it is written before apply, marks items done, and is what lets a re-run distinguish a half-applied unit from a fresh fork (§2.8). One JSON file, no journal system. |
| Deletion propagates via tombstones hooked into ES's delete path, with a 15-row table | `gpt_peer_review-r2.md` §2.2; `gemini_peer_review-r2.md` §1; `mistral_peer_review-r2.md` §1.2 | Retracted. V1 propagates no ordinary deletion; the one deletion is D-CLOUD-030's verified duplicate compaction, made to converge (§2.10). |
| Provenance is looked up by sha256 across the union of manifests | `gpt_peer_review-r2.md` §2.3; `kimi_peer_review-r2.md` D6 | An `origin` sub-object travels with any materialised version; hash lookup is the fallback for versions written before the field existed (§2.2). |
| A re-slotted copy is "a new entry with `replaces = null`" | `gpt_peer_review-r2.md` §2.3 | A re-slot is a new *placement* of the same *version*; the entry is new because entries are keyed by path, the sha256 is unchanged (D-CLOUD-030 [V]). |
| `replaces` can be read off the previous manifest entry at the same path | `gpt_peer_review-r2.md` §2.3 (rename-then-edit); `mistral-revised_plan.md` via `gpt_peer_review-r2.md` §4 | Capture folds moves by hash before assigning `replaces`; a predecessor it cannot establish is `"unknown"`, never a confident wrong value (§2.2). |
| A reflashed device downloads its cloud manifest before first capture | `gpt_peer_review-r2.md` §2.3 | Capture never needs the network. The reflash case is handled at first *publication*: merge the cloud copy of the device's own manifest with the local one, then upload (§2.4.3). |
| Identity collisions detected by comparing `generated_at` | `gpt_peer_review-r2.md` §2.3 | Withdrawn — clocks are untrusted by design (`repo/docs/save-manifest-schema.md` §6 `clock_synced` [V]). Replaced by a clock-free, optional check (§2.4.3, O4). |
| #10 can be deferred because flat-path cross-core collisions "become visible conflicts with core metadata" | `gpt_peer_review-r2.md` §2.4 | Wrong: a second core can overwrite the same flat path locally before any reconciler sees either version. #10 stays in the drop, sequenced last, gated by a real-device rehearsal (§2.12). |
| Exit push is "≤ 2 spawns" and the manifest "rides the same push" | `kimi_peer_review-r2.md` §2.2.7; `gpt_peer_review-r2.md` §2.5 | Restated as 3–4 spawns on the changed path, measured; the manifest is an explicit separate upload unless a spike shows `--files-from` can carry it safely (§2.5.2). |
| Hashless backends: exit uploads defer to the next full pass | `gpt_peer_review-r2.md` §2.5 (A-exit/B-start handoff) | Adopt `kimi-revised_plan.md`'s position: pay to verify by download-and-hash on hashless backends; the cost is measured and borne only by those backends (§2.5.2). |
| Cancellation text: "nothing was overwritten" | `gpt_peer_review-r2.md` §2.6 | Corrected: cancelling leaves the *conflicting* versions unchanged and discards the walkthrough's choices; non-conflicting updates were applied before it opened (§2.6.2). |
| The wizard opens automatically when a sync reports conflicts (IA rev 4) | `gpt_peer_review-r2.md` §2.6; `mistral_peer_review-r2.md` §3.4, both favouring `kimi-revised_plan.md` | Unattended syncs (boot, game exit) queue conflicts and badge; only an explicitly requested SYNC opens the wizard directly. An IA amendment [M] (§2.6.1). |
| `rom` should record the matched stem | `gpt_peer_review-r2.md` §3 | Withdrawn. `rom` stays as schema §6 defines it, supplied by ES at exit (schema §9 "told, not discovered" [V]). |
| A two-week shadow period on the live legacy writers | `gpt_peer_review-r2.md` §4 | Withdrawn. The first deployment stage is the reconciler live for one-sided cases with forks queued, legacy writers disabled — not observation of writers that destroy their own inputs (§2.12). |
| "Provisional agreement" after an exit push | `gpt_peer_review-r2.md` §4 | Withdrawn as a permission concept. Agreement is written when a transfer succeeds; `remote_hash.observed` records whether the cloud's hash has been seen (§2.2). |
| The ping-pong reversal is "real when B has no agreement record" | `kimi_peer_review-r2.md` §2.2.6 | Accepted: two disagreeing resolutions produce it with no missing state. The `resolves` field makes an explicit choice stick (§2.3.6). |

### 1.2 Adopted from others, credited

- **`gpt-revised_plan.md`** (via `kimi_peer_review-r2.md` §4 and `gpt_peer_review-r2.md`): lifecycle-gate semantics — uploads of sealed data may run during play, tree mutations may not; the auto-state KEEP BOTH outcome sentence; the `origin`-vs-possession distinction; the observation that loading a state can rewrite SRAM; the "no default route" false negative in `check_network_link` [V `repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`]; the mixed-version cutover boundary; the hash-bound plan file.
- **`kimi-revised_plan.md`**: producer metadata preserved when a version is materialised elsewhere; a content-addressed stage reused by the wizard, the merge and the discard store; queued conflicts; verify-by-download on hashless backends.
- **`gemini-revised_plan.md`** (via `gpt_peer_review-r2.md` §4, `mistral_peer_review-r2.md` §3.2): the real-device `es_savestates.cfg` launch-behaviour rehearsal as a pre-implementation gate; the bisync spike's fixtures as the detector's adversarial suite; the discipline of saying that nothing here is built.
- **`mistral-revised_plan.md`** (via `gpt_peer_review-r2.md` §4, `kimi_peer_review-r2.md` §4): observe moves rather than reconstruct them; register-ready amendment IDs; an explicit list of refused machinery; the `LIBRETRO_CORES` diff as the cheapest absent-core check.

### 1.3 Held, with the argument made better

- **The detection substrate** is `rclone lsjson --hash` plus targeted downloads into a content-addressed stage, not a mirrored copy of the remote tree. `gemini_peer_review-r2.md` §1 and `gpt_peer_review-r2.md` §1.2 both show why a metadata-skipped mirror fails the #53 shape on a hashless backend [V `cloud_backup` comments; `repo/docs/save-manifest-alignment-review.md` §1 D-QA rows]. The stage is a cache of *verified candidates keyed by hash*; the listing, not the stage, is the authority on what the cloud currently holds.
- **Concurrent writers**: pre-upload recheck, archive of whatever object is replaced, audit, lineage-based detection of the lost update on the next pass, and an honest residual — not a protected-publication store in V1. `kimi_peer_review-r2.md` D2 and `gemini_peer_review-r2.md` §1 settle here; `mistral_peer_review-r2.md` §1.3 does not, and I answer it in §2.9.
- **Manifest transport ownership** (own manifest uploaded explicitly; `.rocknix/**` never in the bulk upload). Verified as a real hazard by `gemini_peer_review-r2.md` §2 and `kimi_peer_review-r2.md` §2.1.
- **`agreed.json` bound to the remote and the sync roots** (`gemini_peer_review-r2.md` §3 credits it). `gpt_peer_review-r2.md` §2.3 is right that hashing a whole config section is too blunt: bind to the remote *name and type plus its root* (the `SYNCPATH`, `BACKUPPATH`, `RESTOREPATH` triple), not to credentials.
- **ES owns the boot sync**, with the gate scoped to save-tree safety (`gpt_peer_review-r2.md` §4: do not block launch behind content transfers).
- **Bisync is demoted**, and the epistemics are kept honest (§2.13). `gpt_peer_review-r2.md` §2.1 is right that I overreached on how bisync fingerprints filter files; struck.

### 1.4 Where a review misread me

- `mistral_peer_review-r2.md` §5 lists "protected publication areas" among the things `claude-revised_plan.md` proposes. It did not; `gpt-revised_plan.md` did. My V1 posture is archival plus detection plus an honest residual (§2.9).
- `gemini_peer_review-r2.md` §1 attributes the `--backup-dir` recoverability argument to me and `kimi-revised_plan.md`. I did make it; §1.4 of `gpt_peer_review-r2.md` shows it was overclaimed, and §2.9 restates it correctly. The reviewer's settlement in my favour rested on an argument I no longer make in that form.

---

## 2. The foundation, end to end

### 2.1 What survives unchanged from the register

These are binding and this plan builds on them without reopening: identity is the sha256 of stored bytes, slot and name are attributes, duplicates are compacted after re-verification (**D-CLOUD-030** [V]); one JSON manifest per device at `savestates/.rocknix/manifest-<id>.json`, describing saves and states by path relative to the sync root, with the agreement record local and unsynced (**D-CLOUD-031** [V]); states namespaced by core with the build pin as data (**D-CLOUD-017** [V]); the audit log at `/storage/.cache/log/cloud_audit.log`, append-only text, support-only (**D-CLOUD-027** [V]); #19 runs before the badge's severity is chosen (**D-CLOUD-025** [V]); the shipped write paths stay as shipped until #22 replaces them, with no `--update` stopgap (**D-CLOUD-029** [V]); the exit sync's one-spawn idle path (**D-CLOUD-028** [V], refined in §4); identity from `cloud_device_id` (**D-CLOUD-009** [V]); another client's conflicted copy is never moved or offered (**D-CLOUD-022** [V]).

Three rules from the rule files are treated as design constraints, not aspirations: conflict handling never defaults to recency (`repo/.claude/rules/rclone-cloud-sync.md` [V]); guards fail closed and the artifact is verified, never the report (`repo/.claude/rules/engineering-practices.md` [V]); an upgrade is invisible — read both shapes, write the new one (`repo/.claude/rules/upgrade-and-install.md` [V]).

### 2.2 Identity, lineage, provenance — schema refinements (all additive)

The schema at `repo/docs/save-manifest-schema.md` rev 1 stands. The following fields are added as a refinement of D-CLOUD-031 (§4 lists the row). Readers treat a missing field as `null`/`unknown`; no existing field changes meaning.

| Field | Meaning | Why it is earned |
|---|---|---|
| `lineage` (array of sha256, bounded ≤ 8, newest first) | The versions this version replaced at this path on this device, in order. `replaces` remains and equals `lineage[0]`. | A device that plays two sessions offline publishes a version two steps past what another device last agreed; with one step of lineage that reads as a fork (§2.3.6). |
| `resolves` (array of sha256 or `null`) | Versions the player deliberately chose *over* at this path, in the wizard, when this version was published. | Makes an explicit choice stick against a later device's automatic "cloud changed → download" (§2.3.6; `kimi_peer_review-r2.md` §2.2.6). |
| `origin` (object or `null`) | `{device_id, device_label, device_model, core, core_build, captured_at, captured_local, clock_synced}` of the version's *producer*, copied when a version is materialised on another device or re-slotted. `null` when the writer is the producer. | Once a producer overwrites its own path entry, no manifest in the union describes the old version; every copy elsewhere loses provenance (`gpt_peer_review-r2.md` §2.3). |
| `screenshot_sha256` (string or `null`) | The hash of the PNG that belongs to this state version. | The wizard's whole premise is choosing by picture; the picture must be bound to the version, not derived from a name that moves (`repo/docs/conflict-wizard-ia.md` [V]). |
| `unit` (string or `null`) | The declared save-unit key this path belongs to (§2.3.4). | Units are classified as one thing; the key must be data, not re-derived from patterns on both sides. |
| `remote_hash.observed` (bool) | Whether `remote_hash.value` has been seen in a listing of the remote. `false` when computed locally after an upload. | The exit push cannot afford a post-upload listing; a locally computed backend hash is an *expected* value until observed (`gpt_peer_review-r2.md` §2.5). |

Rules refined:

- **A placement is not a version.** Moving bytes to another slot (a renumber, a KEEP BOTH) creates a new entry at the new path with the same `sha256`, `replaces: null` at that path, `lineage: []`, and `origin` set to the producer. D-CLOUD-030 is unchanged.
- **Lineage is what capture can establish, never what it guesses.** At exit, capture first folds moves by hash (an old path's hash now found at another path is a move); only then does a path whose hash changed get `replaces` = the hash previously *at that path after moves are folded*. If the predecessor cannot be established, `replaces` is `"unknown"`. Optional (O3): ES records each `copyToSlot(move = true)` it performs (`es/SaveState.cpp` [V]) in a small local move log that capture consumes; that turns "unknown" into an answer for the rename-then-edit case `gpt_peer_review-r2.md` §2.3 constructs.
- **Parse failure is `unknown`, not absence.** A manifest that fails to parse, or carries `schema` higher than the reader supports, makes every entry it would have described `unknown` in provenance and blocks nothing else; it is never treated as "no entries" (blindspot 22 [V `repo/docs/blindspot-register.md`]).
- **`agreed.json` is bound** to `{remote name, remote type, SYNCPATH, BACKUPPATH, RESTOREPATH}`. A mismatch (CHANGE CLOUD FOLDER, a re-linked remote, a player who sets the two roots apart) invalidates every agreement: everything becomes never-agreed, which prompts rather than infers a mass deletion or a mass overwrite. Credential refresh alone does not invalidate. `BACKUPPATH ≠ RESTOREPATH` is refused by the reconciler with a message and exit 1, since the schema keys on one root (schema §9 assumption [V]).

### 2.3 Detection: the reconciler

The detector is application-owned and pure: it consumes a local inventory (path → sha256, plus the own manifest), a remote inventory (a listing, plus the union of downloaded manifests, plus staged verified downloads), and the agreement record, and it emits a classified plan. It transfers nothing while classifying.

#### 2.3.1 Learning C, the cloud's current version, without downloading everything

One `rclone lsjson --hash -R` over `<remote><SYNCPATH>/` [V — `repo/issues/issue-20.md` observed the call on 1.74.4; the cost over a real library is [K]]. For each listed path:

1. If a manifest entry (from any device's manifest in the union) has `remote_hash.type` equal to the listing's type and `remote_hash.value` equal to the listed hash → C = that entry's `sha256`, and the entry's `remote_hash.observed` becomes true for the producer if it is us.
2. Else if the listed hash equals a backend hash we can compute locally for a version we hold or have staged (O6) → C = that version.
3. Else if *no* manifest anywhere describes the path → a **legacy** file: download to the stage, hash, C = the hash, provenance `unknown` (schema §4 [V]).
4. Else — some manifest describes the path but not this hash → **in-flight or foreign**: C is `unknown` for this pass. The path is re-examined next pass; after it has been in-flight for two consecutive full passes it is escalated to the legacy rule (download-and-hash, never-agreed). This bounds the mixed-version cutover problem (`gpt_peer_review-r2.md` §8 via `kimi_peer_review-r2.md` §4) without a clock.
5. Hashless backend (the QA WebDAV [V `repo/docs/save-manifest-alignment-review.md` §1]): the listing gives size only. Size ≠ the agreed size → cloud changed, C unknown until downloaded; size equal → *not* equal — download-and-hash to decide (#53's exact shape, `cloud_backup` comments [V]). Size is a pre-check and never a verdict (schema §6 [V]).

A listing that fails, or returns nothing where the agreement record says files exist, yields C = `unknown` for everything and the run ends with the "could not classify" outcome (§2.11). Absence of an answer is never "no conflict" (blindspot 22 [V]).

#### 2.3.2 Folding moves and duplicates first

Before per-path classification, versions are matched by hash within a game: the same `sha256` under two paths is one version in two places (D-CLOUD-030 [V]). A version on one side only, under a path the other side holds under a different slot, is a *move*, not a cloud-only or device-only transfer. When one game holds the same hash in two slots on either side, the higher slot is the duplicate: it is downloaded to the stage if remote, both copies are re-read and hashed, and only on equality is the higher copy removed — **on whichever side holds it, remote included**, with an audit line. This is the only deletion the reconciler performs (§2.10) and it is lossless by construction. Doing it on both sides is what makes it converge; a local-only removal is re-downloaded next pass (`gpt_peer_review-r2.md` §2.2). The "which path wins" rule of #24 is: lower slot wins.

#### 2.3.3 The per-path verdict table

With **L** the local hash or ∅, **C** the cloud hash, ∅, or `unknown`, **A** the agreed hash or ∅, and **E** the cloud version's manifest entry (may be absent):

| # | L | C | A | Verdict | Action |
|---|---|---|---|---|---|
| 1 | = C | | any | identical | write A := L if A ≠ L (equality establishes agreement) |
| 2 | = A | = A | | in sync | nothing |
| 3 | = A | ≠ A | | cloud changed | if A ∈ E.lineage ∪ E.resolves ∪ {E.sha256} → download (stage, verify, install; local copy to discard store); A := C. Otherwise → **divergent**, wizard |
| 4 | ≠ A | = A | | device changed | upload (archive the replaced remote object); A := L |
| 5 | ≠ A | ≠ A, ≠ L | | **divergent** | wizard |
| 6 | present | present, ≠ L | ∅ | **never agreed** | wizard (conservative; the two-libraries first sync) |
| 7 | ∅ | present | ∅ | cloud only | download; A := C |
| 8 | ∅ | = A | | absent locally, cloud unchanged | **hold back** (O2): no download, no delete, mark in `agreed.json`; default without O2 is download |
| 9 | ∅ | ≠ A | | cloud changed, local gone | download; A := C |
| 10 | present | ∅ | ∅ | device only | upload; A := L |
| 11 | = A | ∅ | | cloud lost it | re-upload; A := L |
| 12 | ≠ A | ∅ | | local changed, cloud gone | upload; A := L |
| 13 | ∅ | ∅ | present | both gone | clear A |
| 14 | any | `unknown` | any | cannot classify | no transfer; reported (exit 6) |

Row 3's lineage check is what surfaces both the concurrent lost update (§2.9) and the disagreeing-resolutions reversal (§2.3.6) as forks instead of silent downloads. A cloud version whose entry is absent (legacy, or written by an old binary) has no lineage: if A is set and C ≠ A it lands in row 3's "otherwise" branch — divergent — which is the conservative reading of a change we cannot explain. A never-agreed cloud-only file (row 7) restores without asking, which answers `gpt_peer_review-r2.md`'s warning that unknown *provenance* is not itself a fork.

#### 2.3.4 Units: multi-file saves classified as one thing

A **unit** is a declared set of paths that an emulator writes as one coherent save: PPSSPP's per-game-ID directory, Dreamcast's shared VMU directory, an N64 game's `.eep`/`.mpk`/`.sra` set, a PSX memory card file (which several games share). The unit table is a small data file shipped with the reconciler; its first version groups every system save directory the allowlist names (`repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync-rules.txt` [V]) at directory granularity, and splits only where a pattern is known to be per-game. The true grouping is empirical (§6, unknown 8); over-grouping prompts more, under-grouping can install a mixed generation, so the default over-groups.

A unit is classified by the table above applied to **complete member maps**: L_u, C_u, A_u are each `{path → hash}` over the unit's members, and "changed" means any member changed *or membership changed*. The disjoint-member case in `gpt_peer_review-r2.md` §1.3 — `a` changed locally, `b` changed in the cloud, no single path divergent — is L_u ≠ A_u, C_u ≠ A_u, L_u ≠ C_u: **divergent**, wizard. One-sided unit changes transfer every member in one rclone call. KEEP BOTH is disabled for units (fixed layouts); the wizard shows a unit as one item with the game's box art in the header and a floppy glyph, per IA rev 4's in-game-save panel [V].

Unit publication is not atomic on any backend [K]. The **manifest-last commit** (§2.4.2) is what keeps a consumer from installing a half-published unit: members whose listed hash is not described by the producer's manifest are in-flight (§2.3.1 rule 4), so the unit is `unknown` until the producer's manifest lands. The producer's own interrupted publication is recognised on restart from its pending record (§2.8), not misread as a fork.

#### 2.3.5 Special kinds

- **Auto states** (`game.state.auto`): the schema asserts they are the commonest conflict (schema §4 [V]); `gpt_peer_review-r2.md` §3 is right that this is not established — a numbered-slot launch backs `.state.auto` up to `.bak` and restores it at exit (`es/SaveState.cpp` [V]), so only auto-resume and new-game sessions rewrite it. Frequency is a census question (§6, unknown 3). The wizard labels the kind as a resume point regardless.
- **`.state.auto.bak` and any `*.bak`** are transient, match the allowlist's `+ /**/*.state*` and neither of ES's regexes (`cloud_sync-rules.txt`, `es/SaveStateConfigFile.cpp` `SetupRegEx` [V]). The reconciler excludes `*.bak` from every transfer by an explicit flag (§2.4.1). Never rely on a game not being running to make this safe (§2.5.3).
- **Another client's conflicted copies** (Dropbox "conflicted copy", Syncthing `.sync-conflict-`): excluded from every transfer and never offered as a version (D-CLOUD-022 [V]; alignment review action 5 [V]).
- **Loading a state can rewrite SRAM** (from `gpt-revised_plan.md`, via `kimi_peer_review-r2.md` §4): a state and the in-game save of one game are one *progress* dependency even though they are separate paths. The walkthrough already goes game by game (IA rev 4 [V]); the plan groups a game's state and save decisions on consecutive screens, and the done page names both.

#### 2.3.6 Why `lineage` and `resolves` are load-bearing

The reversal `kimi_peer_review-r2.md` §2.2.6 describes needs no missing state: A and B share agreement A₀; both diverge; A resolves KEEP-own and publishes H_A; B's next pass sees a fork, resolves KEEP-own and publishes H_B over H_A (archived); A's next pass has L = H_A = A(agreed), C = H_B — row 3, "cloud changed". Without `resolves`, A silently installs H_B and its explicit choice is undone with the bytes in a support-only store. With `resolves`, B's publication of H_B carries `resolves: [H_A]` because the wizard showed H_A and the player chose against it; A's row-3 check finds A ∈ E.resolves → download without asking, and the discard store retains H_A. The second decision was informed (it saw the first), so applying it is correct. If instead B's publication had descended from something A never agreed and did not resolve A's version, row 3's "otherwise" branch asks — which is exactly the concurrent-writer lost update (§2.9) surfacing as the fork it is. `resolves` is per publication, never a permanent stigma on bytes: a player who later restores H_A deliberately publishes a fresh version.

`lineage` bounded at eight means a device would need nine unsynced sessions on one path before a linear descent read as a fork; at that point a prompt is defensible.

### 2.4 Transport rules

#### 2.4.1 Every transfer is unconditional and explicit

The reconciler decides what moves by hash. Therefore every rclone transfer it issues passes `--ignore-times` (or is a single-file `copyto`), so rclone's own comparison can never turn a decided upload into a skip. This matters most for in-game saves, whose size is fixed: a changed 64 KiB `.srm` uploaded to a backend with neither hashes nor modtimes is skipped by size-only comparison and reported as success — #53's shape applied to the commonest save kind [V `cloud_backup` comments describe the mechanism for the archive; the saves-tier instance is [K], §6 unknown 18]. D-CLOUD-005 already states the principle for the system archive; this generalises it.

Option hygiene: the reconciler never inherits `RCLONEOPTS` or `BACKUPMETHOD` from `cloud_sync.conf` — the shipped `RCLONEOPTS` carries `--delete-excluded` and a non-empty array silently replaces the allowlist (`repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync.conf`, `cloud_backup` `load_config` [V]). It builds its own option set: the allowlist by `--filter-from` only where it lists trees, explicit `--files-from` for decided transfers, and safety exclusions (`*.bak`, conflicted copies, `.rocknix/**` on bulk transfers, the snapshot and stage directories) as `--exclude` flags on the command line, because user rules are merged *ahead of* the defaults and a user `+ /**` defeats any rule in the file (`repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_sync_helper` [V]). Each exclusion is proven to fire by a fixture (blindspot 14 [V]).

Every remote overwrite passes `--backup-dir=<remote><SYNCPATH>-replaced/<device-id>/<UTC stamp>/` — a sibling, never inside the destination (D-CLOUD-014 [V]); per device so two handhelds cannot choose one directory in the same second (`gpt_peer_review-r2.md` §1.4). Every local overwrite first copies the replaced file and its PNG to `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` — outside the sync tree and outside `backuptool`'s archive by construction (IA rev 4's argument for `history.db` [V]), which is why an in-tree discard store under `savestates/` is refused (`kimi_peer_review-r2.md` §2.2.5).

Downloads land in `/storage/.cache/cloud_sync/stage/<sha256>` first, are hashed, and are installed into the tree only after the hash matches what the manifest promised (or, for a legacy file, is simply recorded). The stage is content-addressed, so one verified download serves the classifier, the wizard's picture, the merge adapter and the discard store. Presence in the stage says nothing about current presence in the cloud; only the listing does.

#### 2.4.2 Publication order — the manifest is the commit

A device publishes in this order: payload (with archive), then its own manifest by a single explicit `copyto`, then the agreement record. Consumers trust only versions their producer's manifest describes; an object the listing shows but no manifest explains is in-flight (§2.3.1). This gives units a commit point without a distributed transaction, on the assumption that a single-object copy appears whole on each backend [K, §6 unknown 14]. The own manifest is written locally whole, to a temporary name and renamed (schema §5 [V]).

#### 2.4.3 Manifest transport ownership

- The bulk upload never carries `savestates/.rocknix/**` [V — the allowlist admits it, and `copy` without `--update` republishes a stale foreign manifest over its producer's newer one: `cloud_sync-rules.txt`, `cloud_backup`; confirmed by `gemini_peer_review-r2.md` §2, `kimi_peer_review-r2.md` §2.1].
- Foreign manifests are downloaded read-only into the stage, never into the tree, and never re-uploaded.
- **First publication after a reflash**: `cloud_device_id` regenerates the same id from the permanent hardware address (`repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_device_id` [V]), so the cloud already holds `manifest-<id>.json` describing versions this hardware produced before the reflash. Before its first upload of its own manifest, a device downloads the cloud copy (if reachable) and merges: locally captured paths win; other paths keep the cloud's entries. Capture itself never needs the network. The same merge also runs when `agreed.json` is absent (a fresh card) — it is idempotent.
- **Writer collision** (O4, optional): `cloud_device_id`'s file can be edited to adopt another device's folder [V], so two live devices sharing an id is a supported misconfiguration. Each installation keeps a random `writer_instance` in `/storage/.cache/cloud_sync/` and writes it into its manifest; before publishing, the device inspects the cloud copy's `writer_instance` — different, and not explained by its own pending record — refuse to publish the manifest, report the collision. Clock-free; two fields; not load-bearing.

### 2.5 The write paths, and who owns the save tree

Today's writers are newest-wins by composition (blindspot 28 [V]): the boot pair and the SYNC row run `cloud_restore --method=copy --update` then `cloud_backup --method=copy --update` (`repo/projects/ROCKNIX/packages/network/rclone/autostart/102-cloud-saves` [V]; the menu map [V]); the game-exit push is `copy` with no `--update` (`es/FileData.cpp.launchGame-excerpt-l740-850.cpp`, `cloud_backup` `--recent` [V]). All three are replaced by the reconciler under #22. D-CLOUD-029 stands until they are: no `--update` stopgap, and no "one-way stopgap" either — disabling downloads while keeping the exit upload still overwrites a cloud-only version, because `--recent` forces `copy` and its `--backup-dir` branch applies only to `sync` (`cloud_backup` [V]; `gpt_peer_review-r2.md` §1.1, `kimi_peer_review-r2.md` §2.2.1). What the maintainer *can* do today is an operating choice, not a product change: keep both auto-sync toggles off and move saves by hand until the reconciler ships.

#### 2.5.1 Boot and menu: the full pass

Owned by ES, run as a `ThreadedCloudSync` job after gamelists load (a UI-less background writer is the root defect of the shipped boot pair; a job that mutates the save tree deserves the card — `repo/.claude/rules/es-native-ui.md` tiers [V]). The script it runs waits for a route, takes `take_cloud_lock` [V], lists, downloads foreign manifests and needed candidates to the stage, classifies, applies the non-conflict rows, uploads, publishes its manifest, and writes the result. Roughly six or seven rclone invocations, in the background, not watched; at the SYNC row it is watched and should land under ten seconds on a library the size of the maintainer's (~50 entries, schema §5 [V]) — measured (§6 unknown 17).

#### 2.5.2 Game exit: the gated push

Order matters: **capture first, network second** — a device with no route still captures, so its manifest is current when it next publishes.

1. Capture (#21): ES passes the game path, system, emulator and the core **from the launch command it actually ran** (`getCore(true)` describes the default, not the executed descriptor when an alternate config exists — `es/FileData.cpp.getCore-excerpt-l1470-1560.cpp`, `es/SaveState.cpp` `setupSaveState` [V]; council consensus). The script hashes the game's states, thumbnails, auto state and in-game save (or unit), folds moves, updates entries (`lineage`, `replaces`, `screenshot_sha256`, `origin: null`), writes the own manifest. No network.
2. `check_network_link` → exit 4 (SKIPPED); lock → exit 3. Known false negative: a LAN-only remote on a network with no default route reads as "no network" (`cloud_backup` [V]; from `gpt-revised_plan.md`). Documented; the rule file's "probe the remote" costs a spawn the idle path cannot pay.
3. Changed set = entries whose `sha256` ≠ the agreed `sha256` for that path (or never agreed). Empty → exit 0, "nothing to send", **zero rclone spawns** — strictly under D-CLOUD-028's budget. Exact rather than the ten-minute `--max-age` overlap; the trade is that only the played game's files are considered, and everything else waits for the full pass.
4. Spawn A (hashed backends whose hash rclone can compute on local files, [K]): `rclone hashsum <type>` over the changed files, so `remote_hash.value` can be recorded as an expected value; on md5-type backends busybox `md5sum` replaces this spawn. Without it, the next exit push for the same game before any full pass cannot confirm C = A and defers — two sessions in a row is the common case, so this spawn earns itself. Degrade: if measurement puts the changed path over budget, drop spawn A and let the next full pass observe.
5. Spawn B: `rclone lsjson --hash --files-from <changed paths>` [K that `lsjson` accepts `--files-from`]. Per path: cloud matches the agreed remote hash (or absent where agreed absent) → candidate; anything else → **deferred**: recorded as pending, the card says "N saves waiting for review", exit 5. On a hashless backend, equal size means a download-and-hash (spawn B′) decides.
6. Spawn C: upload the candidates in one `copy --files-from --ignore-times --backup-dir …`.
7. Spawn D: `copyto` the own manifest. If the spike shows `--files-from` can carry it in spawn C without the `.rocknix/**` bulk exclusion applying [K], D folds into C.
8. Agreement written for uploaded paths; stamp written only on success.

Budget: 0 spawns idle; 3–4 on the changed path with a Dropbox commit (today's measured changed-file cost is ~7 s, "most of it Dropbox's commit" — `repo/.claude/rules/rclone-cloud-sync.md` [V]); 4–5 on a hashless backend with a same-size candidate. D-CLOUD-028 is refined accordingly (§4) and the numbers are a gate, not a promise. "Waiting for review" is never shown as "safe in the cloud" (`gpt_peer_review-r2.md` §2.5).

#### 2.5.3 The lifecycle gate

Two markers in tmpfs (`/var/run/`, so a reboot clears them): ES writes a *game-running* marker around `ProcessStartInfo::run()`; the reconciler writes a *save-tree-busy* marker around any mutation of `/storage/roms` (install, compaction, renumber, apply). Rules: while a game runs, the reconciler may upload sealed data (a staged copy, an already-hashed file) but may not mutate the tree — a restore over live SRAM that RetroArch flushes every ten seconds (schema §4 [V]) is how a boot sync mid-session hands the exit push the emulator's copy to upload over the cloud's (mechanism source-visible; the byte loss is reproduced, not yet observed — §6 unknown 15). While the tree is busy, ES shows the card and defers the launch for the seconds it takes; it never blocks launch behind content transfers, which touch no save (`gpt_peer_review-r2.md` §4). The exit push never mutates the tree at all.

### 2.6 Presentation and resolution

The wizard's IA is rev 4 (`repo/docs/conflict-wizard-ia.md` [V]) with four amendments, each a documentation change and one a maintainer call.

#### 2.6.1 Trigger: queued, not modal, for unattended syncs [M — IA amendment]

Boot and exit runs never open the wizard over a player who just finished a game. They record conflicts durably (the result file, §2.11), the card ends "N saves waiting for review", and a badge shows on GAME SETTINGS › CLOUD SETTINGS and on the affected game's save rows where ES already renders per-slot text (`repo/issues/issue-37.md` [V]). The SYNC row, being an explicit request, opens the walkthrough directly when the run ends with conflicts. This adopts `kimi-revised_plan.md`'s position over rev 4's automatic trigger and needs the maintainer's word since it changes an implementation-ready doc. In kid/kiosk mode [M] the non-conflict rows still apply, divergent items wait, nothing is lost, and resolution requires unlocking — the mode's whole design is to remove configuration surfaces (`repo/docs/es-menu-map.md` [V]); I do not recommend exposing a destructive choice there to satisfy a reachability test.

#### 2.6.2 Cancellation, stated accurately

Non-conflicting rows are applied before the walkthrough opens (IA rev 4's own precondition for the slot rule [V]); row 3's one-sided download can overwrite a local file, with its copy in the discard store. So the promise is: *cancelling leaves the conflicting versions exactly as they were on both sides and discards the choices made so far; non-conflicting updates were applied before this opened.* "Nothing transfers until COMPLETE" is retained only for the conflicting items. Quitting still discards decisions.

#### 2.6.3 KEEP BOTH

- Numbered slots: the device's version stays at slot *n*; the cloud's version is materialised into the next free slot with its thumbnail; both are published; the entry at slot *n* carries `resolves: [C]`; the new entry carries `origin` = the cloud producer.
- **Auto states** (from `gpt-revised_plan.md`): the device's resume point stays at `.state.auto`; the cloud version becomes a numbered slot with its PNG. Visible on screen, deterministic, never inferred from recency.
- "Next free" means highest occupied **on either side** plus one — local after the pre-pass, plus any cloud slot held back under O2 — so a merge never lands on a slot the cloud already uses.
- In-game saves and units: KEEP BOTH dimmed with a reason (IA rev 4 [V]).

#### 2.6.4 Keep discarded saves — retention [M; register row proposed]

All four plans and the reviews favour **on by default, bounded by a count**; IA rev 4 says off by default with a count selector and no default count [V]. This is [C]: the council agrees and the corpus decides the other way. My recommendation to the maintainer: on, count three per path, the same bound applied to the remote archive directories on full passes. Two honesties from `gpt_peer_review-r2.md` §2.6: this is retention for *recovery*, not an undo control — a console-first undo is #25's V2 rollback, and the wizard's done page must not imply otherwise; and the remote `--backup-dir` archive grows until pruned, so pruning is part of the feature, not free.

#### 2.6.5 Panels and the badge

Per side: date, time (local, with `clock_synced: false` rendered as "clock not set", schema §6 [V]), device label and model, core and build; no size, no play time (IA rev 4 [V]). The picture is the staged PNG whose hash equals `screenshot_sha256`, or the glyph. Box art in the header only. The compatibility badge's severity waits for #19 (D-CLOUD-025 [V]); the data behind it is present regardless. Layout is proven at 480×320 first (`repo/issues/issue-23.md` [V]).

### 2.7 The merge adapter (#24)

ES computes destinations; the script executes. The adapter is a checked layer over ES's primitives, each defect source-visible:

- `getNextFreeSlot()` returns −99 when only the auto state exists (slot −1 makes the vector non-empty and the 99999→0 scan finds nothing — `es/SaveStateRepository.cpp` [V]); the adapter maps *that specific case* to `firstslot`, refuses KEEP BOTH when the repository is not enabled (also −99), and treats any other −99 as a refusal, never as slot zero (`gpt_peer_review-r2.md` §3). `kimi_peer_review-r2.md` §2.1's precision applies to the confirming experiment: launch from the auto state, since the new-game path swallows the −99.
- `copyToSlot()` returns true whatever `renameFile`/`copyFile` did (`es/SaveState.cpp` [V]), and `makeStateFilename(fullPath = true)` derives the destination from the *source's* parent (`gpt_peer_review-r2.md` via `gemini_peer_review-r2.md` §3). The adapter therefore computes destination names itself from the config templates (`es/SaveStateConfigFile.cpp` `getDirectory`, `file`, `image` [V]), copies state and PNG, and verifies both by hash before declaring success.
- Several KEEP BOTH decisions for one game in one plan receive explicit, distinct slot reservations computed once; `refresh()` is not relied on to prevent a repeat allocation, and it is not called while the wizard holds `SaveState` pointers, because `clear()` deletes them (`es/SaveStateRepository.cpp` [V]).
- After the apply, ES refreshes the repository so the savestate manager shows the merged slot.

### 2.8 Apply safety and recovery

The wizard writes a **plan file** to `/storage/.cache/cloud_sync/pending-apply.json` before anything is applied: every decision, bound to both operand hashes and their paths, the destination slot names reserved, the unit membership, and a per-item `done` flag. This file, not the audit log, is the pending-operation record (D-CLOUD-027 keeps the log support-only and rotated [V]). It is the small durable record `gpt_peer_review-r2.md` §1.5 asks for and no more.

Apply, per item: re-verify the operands (a fresh listing; a cloud side that moved since the plan aborts that item back to the queue and reports it) → audit line → discard-store copy of the loser (and its PNG) → install the winner or perform the merge → agreement → mark done. After all items: payload upload with archive, own manifest, plan file removed. On start-up with a plan file present, the script resumes: done items are skipped; undone items are re-verified before re-execution, so a retry never repeats a destructive step against a different occupant. An interrupted unit publication is recognised from the plan's recorded hashes, resumed, and not misread as a fork (§2.3.4). `kimi_peer_review-r2.md` §2.2.8 is right that the ordering alone converges for single files; units and half-published payloads are why the file is earned.

Because ES restarts on an assert (`repo/.claude/rules/engineering-practices.md` [V]), the apply runs in the script, driven by the plan file, never from ES process memory.

### 2.9 The concurrency contract, honestly

One player, many devices, never concurrent is the model; nothing enforces it and the lock is per device (`repo/plans/conflict-resolution/vita-style-conflict-resolution.md` futro [V]; accepted for this drop). What V1 provides: a recheck of the remote object immediately before every overwrite (the listing); `--backup-dir` on every overwrite so the object rclone replaces is archived rather than destroyed [K — which object, and whether the operation is atomic per backend, is §6 unknown 12]; an audit line with before/after hashes; and, on the *other* device's next pass, the lineage check of row 3, which turns the lost update into a visible fork instead of a silent download.

The residual, stated as `gpt_peer_review-r2.md` §1.4 requires: between one device's recheck and its upload, another device's publication can be replaced; that version survives only if the backend honoured the archive and the second device's lineage check then surfaces it. Where the archive is not honoured, a concurrent version can be lost. If the gate experiment shows Dropbox or WebDAV not honouring `--backup-dir` with `copy`, or shows the archived object is not the replaced one, V1 adopts `gpt-revised_plan.md`'s protected publication for the affected backends; otherwise that is V2, on evidence from the audit log. `mistral_peer_review-r2.md` §1.3 predicts the recheck alone cannot close the window; agreed — it is never claimed to. The lineage check is what turns "bytes retained somewhere" into "the player is shown both".

### 2.10 Deletion policy

V1 propagates no ordinary deletion. Absence is never authority to delete (rows 8, 11, 13) — an unmounted card, an interrupted layout change, an emulator's temporary rename and an external client all present as absence. The one deletion is D-CLOUD-030's duplicate compaction after both copies are re-read, applied to whichever side holds the higher copy, remote included, so it converges (§2.3.2).

Consequence, stated plainly: a state a player deletes on device A still exists on device B and in the cloud. Row 8 makes the deleting device *hold back* rather than re-download it every sync (O2, mine; no reviewer argued for it, and removing it yields plain resurrection, which is what `gemini_peer_review-r2.md` and `mistral_peer_review-r2.md` accept). The hold-back is a flag in `agreed.json`, per path; it lifts when the cloud version changes (row 9) and is cleared by an explicit DOWNLOAD SAVE DATA. It can never lose bytes: nothing is deleted, and a corrupt flag falls into the download branch. Explicit, propagating deletion — with a tombstone that names the exact version it deletes, so a stale one cannot remove a path's later occupant — is a separately approved V2 policy (`gpt_peer_review-r2.md` §2.2).

### 2.11 Results and exit codes

Normalised statuses: `0` done; `3` skipped, lock; `4` skipped, no network; `5` done, conflicts waiting; `6` could not classify (listing failed, manifest unparseable, C unknown) — no transfer, fail closed; `1` error. rclone's own codes go to the log and never to the exit: today rclone's 3 and 4 pass straight through `clean_exit` and `ThreadedCloudSync` renders them as friendly skips, and both mains return only the saves phase's status (`cloud_backup`, `cloud_restore`, `es/ThreadedCloudSync.cpp` [V]). Alongside the code, a result file under `/storage/.cache/cloud_sync/` carries the run id ES issued, the verdict list, and the pending conflicts. ES compares the run id it started with the one in the file; a missing or stale result is *unknown*, never success (`gpt_peer_review-r2.md` §2.7). The card says what happened; the result file and badge outlive the card (`repo/.claude/rules/es-native-ui.md` [V]).

### 2.12 Migration, cutover, and #10

- **Existing libraries.** Every pre-manifest file is `unknown` in provenance and still has a hash (schema §4 [V]); the first full pass downloads legacy files once to learn C, establishes agreement wherever L = C, and asks only where two never-agreed copies differ. Nothing is stamped that we did not write.
- **Cutover sequence.** Stage 1: #21 capture ships (manifests, no transfer change). Stage 2: the reconciler ships live for the non-conflict rows with forks queued and the wizard absent; the maintainer's devices run it with the legacy toggles off. Bytes are preserved by construction and the fork census is real. Stage 3: wizard and adapter. Stage 4: #10. Stage 5: #25. A device still on an old binary is a foreign writer during cutover: its overwrites in the cloud are archived only if it uses the new code — it does not — so the maintainer updates all devices together, and the in-flight rule (§2.3.1) is what keeps its uploads from being installed as trusted versions.
- **#10 stays in the drop** (problem statement; D-CLOUD-017 [V]), last. Its residual is real: two cores writing the same flat path on one device overwrite each other before any sync sees either, and metadata cannot recover overwritten bytes (`gpt_peer_review-r2.md` §2.4). Its hazard is also real: creating any `es_savestates.cfg` switches ES from the compiled `Default()` (racommands, autosave, incremental all on) to the XML path where `racommands` is false and `autosave`/`incremental` default off, which disables the `.auto` backup dance and the next-slot copy and enables the `-emulator`/`-core` command rewrite (`es/SaveStateConfigFile.cpp`, `es/SaveState.cpp` [V]). It is a launch-behaviour migration and is gated by `gemini-revised_plan.md`'s real-device rehearsal (§8, Gate 8), plus confirming that RetroArch's `savestate_directory` follows (`setsettings.sh:811` per the alignment review — not embedded [K]). The schema needs nothing from it: entries key on path (alignment review §2 [V]).

### 2.13 Bisync's role

Demoted from detector to an experiment. This is [C] in one respect: the IA and #22's comments still say bisync detects (`repo/docs/conflict-wizard-ia.md`, `repo/issues/issue-22.md` [V]) and the spike has not run. The reasons are architectural, not measured: the reconciler must understand units, slots, manifests, thumbnails and player decisions, none of which bisync models; its `--conflict-loser` suffix breaks ES's filename pattern (`issue-22.md` [V]); its `--resync-mode path1` default is a whole-tree winner-picks-all (futro §4 [V]); and the exit path needs a zero-contact idle case bisync does not offer. None of that establishes that bisync *fails* any contract — `mistral-revised_plan.md`'s categorical claims are struck, as `kimi_peer_review-r2.md` §2.2.2 and `gpt_peer_review-r2.md` §2.1 both require. The spike (§6 unknown 2) answers "question zero": can bisync accept an externally applied resolution without `--resync`, and does it report only under `none`? If yes to both, it may earn a role as a transfer engine for the one-sided rows; I predict it will not be worth a second baseline. Its fixture matrix becomes the detector's adversarial suite either way. Register: no row makes bisync a dependency; the edits are to #9's body and the IA (`gpt-revised_plan.md`'s procedural point via `kimi_peer_review-r2.md` §3).

---

## 3. Load-bearing versus optional

**Load-bearing — the milestone is unsafe without these:**

| # | Rule | Section |
|---|---|---|
| L1 | Every writer of the save tree goes through the reconciler; boot pair, SYNC row and exit push are replaced together; D-CLOUD-029 stands until then | 2.5 |
| L2 | The three-way classifier by sha256: never-agreed asks, unknown transfers nothing, moves folded first, declared units classified on complete member maps | 2.3 |
| L3 | Every issued transfer is unconditional (`--ignore-times`), explicit (`--files-from`/`copyto`), archived (`--backup-dir` remote, discard store local); rclone's comparison never decides | 2.4.1 |
| L4 | Manifest transport ownership: own manifest explicit, `.rocknix/**` never bulk-uploaded, foreign manifests read-only, reflash merge at first publication; manifest-last commit | 2.4.2–3 |
| L5 | Capture at exit, told not discovered, records the launched core, works offline; `unknown` first-class | 2.5.2 |
| L6 | Lifecycle gate: no tree mutation while a game runs; ES owns the boot job | 2.5.3 |
| L7 | Lock on every caller; option hygiene with exclusions as flags, each proven to fire | 2.4.1 |
| L8 | Checked merge adapter (−99, reservations, verified copies, PNG bound by hash) | 2.7 |
| L9 | Plan file before apply; per-item ordering; resume semantics | 2.8 |
| L10 | Normalised statuses; stale or missing result is unknown | 2.11 |
| L11 | `lineage` and `resolves` so explicit choices stick and lost updates surface | 2.3.6 |
| L12 | Harness repaired and the counterexample fixtures run before anything is built | 8 |
| L13 | #10 ships in the drop, last, behind the launch-behaviour rehearsal | 2.12 |

**Optional — can follow, or be dropped, without making the milestone unsafe:**

| # | Item | Default if dropped |
|---|---|---|
| O1 | Retention on by default with a count (needs [M]) | IA rev 4's off-by-default |
| O2 | Hold-back on row 8 | plain resurrection |
| O3 | ES move log for exact `replaces` | `replaces: "unknown"` after a move |
| O4 | `writer_instance` collision check | none; a shared id is a documented misconfiguration |
| O5 | Local backend-hash computation on the exit push | `remote_hash.observed: false`, confirmed by the next full pass; second consecutive session defers |
| O6 | Remote archive pruning on full passes | unbounded `-replaced/` growth |
| O7 | Queued trigger versus rev 4's automatic trigger (needs [M]) | rev 4 |
| O8 | Kid/kiosk policy (needs [M]) | badge in full UI only |
| O9 | Badge severity (after #19) | convenience framing until measured |
| O10 | The SQLite index of IA rev 4 | not built; `jq` over the manifests suffices at this scale |

---

## 4. Register: what stands, what is refined, what the maintainer decides

No decided row is reopened. Refinements, as new rows citing the old:

- **D-CLOUD-031-A** (refines D-CLOUD-031): additive fields `lineage`, `resolves`, `origin`, `screenshot_sha256`, `unit`, `remote_hash.observed`; parse-failure → `unknown`; `agreed.json` bound to remote and roots. Amendment IDs in `mistral-revised_plan.md`'s style, marked as proposals until the maintainer writes them.
- **D-CLOUD-030-A** (refines D-CLOUD-030): a placement is not a version; compaction acts on the side holding the higher copy, remote included, after both copies are re-read.
- **D-CLOUD-028-A** (refines D-CLOUD-028): the exit sync spawns rclone zero times when the played game's saves are unchanged by hash, and up to four times when they changed (five on a hashless backend), selects by hash rather than mtime, and never overwrites a cloud version it has not agreed on; figures measured on H700 at Gate 6.
- **D-CLOUD-029**: stands; the `--update` question is closed and the "one-way stopgap" is refused on the record (the procedural closure `gemini-revised_plan.md` framed, applied to the opposite conclusion).
- **D-CLOUD-027**: stands; the plan and result files are state under `/storage/.cache/cloud_sync/`, not log.
- **D-CLOUD-017 / -025**: stand.

Maintainer decisions [M] that need rows: retention default (§2.6.4); the wizard trigger for unattended syncs (§2.6.1); kid/kiosk policy (§2.6.1); the unit table's first version (§2.3.4); acceptance of the concurrency residual for this drop with the flip condition (§2.9). Issue-body edits: #9 (no "newer wins"; bisync is a spike), #22 (owns the write paths; the verdict table; the lifecycle gate), #21 (launched core; capture before network), #23 (trigger, cancellation text, auto KEEP BOTH, retention), #24 (adapter contract), #10 (rehearsal gate), #35 (new steps, §8).

---

## 5. Where the council agrees without the corpus settling it

Flagged so a reader knows these are reasoning, not measurement:

1. **Bisync is demoted** — the IA and #22 still say otherwise; the spike has not run (§2.13).
2. **Retention on by default** — IA rev 4 decides off (§2.6.4).
3. **Queued conflicts** — IA rev 4 opens the wizard on a reporting sync (§2.6.1).
4. **The manifest detector fits the exit budget** — every number in §2.5.2 is a prediction until Gate 6.
5. **`--backup-dir` with `copy` archives the replaced object atomically** — every plan leans on it; none has seen it (§2.9).
6. **Auto states are the commonest conflict** — asserted in schema §4, not counted (§2.3.5).
7. **Two devices online at once is acceptable for this drop** — actually settled, by the maintainer in the futro; what is not settled is whether the audit log would show a violation (it would show the overwrite; the lineage check is what would show the player).
8. **Unit grouping** — every plan agrees units exist; nobody has inventoried what PPSSPP, Flycast or Mupen actually write per save (§2.3.4).
9. **Hold-back** (O2) — mine alone.
10. **`jq`, `sha256sum`, bash and busybox suffice** — verified present (futro substrate table [V]); their *performance* over the maintainer's library is assumed.

---

## 6. Known unknowns → the experiment that settles each

The problem statement's eleven, then the ones this round surfaced. Device named; build step it precedes.

| # | Unknown | Experiment | Device / before |
|---|---|---|---|
| 1 | Chipset axis; loud or silent failure | `repo/docs/savestate-compat-test.md` as written; same-chipset control first (`repo/issues/issue-19.md` [V]) | H700 ×2, RK3326, RK3566 / before #23's badge |
| 2 | bisync under `none`; rename, both-sides change, interruption; `--recover`/`--resilient` vs `--resync`; external equalisation | Version-pinned matrix on disposable prefixes: WebDAV, MinIO, then device→Dropbox; fixtures: compressed state + PNG, same-size SRAM change, rename, deletion, fork, first run, changed vs rewritten-unchanged filter, interruption, manual resolution then re-run; record names and bytes, not exit codes | GENERIC_X64 then H700 / before #22 design freeze |
| 3 | Auto-state conflict frequency | Stage-2 census (§2.12) counts verdicts by kind for a fixed period | maintainer's devices / before #23 layout priority |
| 4 | KEEP BOTH pre-pass gate; interruption | Plan file + interrupt at each step of §2.8; slot collision fixture with a held-back cloud slot | GENERIC_X64 / before #24 |
| 5 | `es_savestates.cfg`; RetroArch directory | Real-device rehearsal: install the file, exercise auto-resume, incremental save, core selection, legacy flat discovery; read the launcher for `savestate_directory` | H700 / before #10 |
| 6 | Core build pin; absent cores | Emit `/usr/share/rocknix/core-pins` at image build; diff `LIBRETRO_CORES` across targets (`mistral-revised_plan.md`); a state from a core the target lacks must present as such | build tree, then device / before #21 |
| 7 | `BACKUPPATH == RESTOREPATH` | Reconciler refuses on mismatch; fixture sets them apart and expects exit 1 with message | GENERIC_X64 / before #22 |
| 8 | Unit grouping | Write one save in PPSSPP, Flycast, Mupen64Plus, a PSX core; inventory files touched per save; author the unit table from evidence | H700 / before #22's unit table |
| 9 | 480×320 recognition | Real thumbnails, controller-only walkthrough | RG351M / before #23 visual design |
| 10 | Two devices online | Gate 4 interleave: B publishes between A's recheck and upload; inventory canonical, archive and stage by hash | H700 ×2 / before Stage 2 |
| 11 | Round-trip suite | Repair, then run both backends (§8 Gate 0) | GENERIC_X64 / before anything |
| 12 | `--backup-dir` with `copy`: honoured per backend; which object; atomicity; same-second dirs | Overwrite a known object on Dropbox, WebDAV, MinIO; inspect archive contents by hash | H700 → Dropbox; VM → QA / Gate 2 |
| 13 | `lsjson --files-from`; local `hashsum <type>`; `--files-from` with `--exclude` | Ten-minute rclone semantics check on device | H700 / Gate 2 |
| 14 | Single-object copy appears whole | Poll a listing during a slow upload of a manifest-sized file | device → Dropbox, WebDAV / Gate 2 |
| 15 | Boot race byte loss | Startup sync on, boot, launch within 30 s, play past a flush, exit; inventory remote for `.bak` and the overwritten SRAM | H700 / Gate 3 |
| 16 | `.state.auto.bak` transfer | Same fixture; assert absent with the `--exclude` flag and present without | H700 / Gate 3 |
| 17 | Spawn/time budget | Trace invocations and time: idle; one SRAM; state + PNG; a unit; hashless same-size; offline; A-exits/B-starts handoff | H700 / Gate 6 |
| 18 | Same-size SRAM skipped on a hashless backend | Change one byte of a 64 KiB `.srm`; upload with and without `--ignore-times`; hash the remote copy | VM → WebDAV / Gate 1 |
| 19 | Disjoint-member unit fork | The two-file example of `gpt_peer_review-r2.md` §1.3 against the classifier | VM / Gate 1 |
| 20 | Rename-then-edit lineage | Delete slot 1 of {1,2}, save to slot 1, capture; inspect `replaces` with and without O3 | VM / Gate 4 |
| 21 | Reflash + offline capture + own-manifest merge | Reflash; capture offline; publish; assert historical entries survive and identity matches (current and legacy naming) | H700 / Gate 4 |
| 22 | Exit-code collisions | Force rclone exit 3 and 4; assert the script's normalised code differs | VM / Gate 1 |

---

## 7. Unknown unknowns — what this design and corpus have not seen

Each with the failure and the cheapest experiment that would expose it.

- **Path bytes do not round-trip through a backend.** Dropbox is case-insensitive and normalises Unicode; the library has names like `Mega Man & Bass (USA).state1` (schema §7 [V]). A key that comes back byte-different presents as a phantom cloud-only/device-only pair — a transfer both ways, forever, or a false never-agreed prompt. *Experiment:* upload states named with `&`, parentheses, an accented character and a case variant to Dropbox and WebDAV; compare `lsjson` path bytes to the local names. Not raised by any plan or review.
- **Fixed-size saves defeat every metadata shortcut.** §2.4.1's `--ignore-times` closes the upload side; the download side is closed by hashing after staging. The unknown is whether any other path (the wizard's PNG fetch, the compaction download) still lets rclone decide — *grep the effective command lines of every transfer for the flag, not the script text.*
- **Dropbox write-rate limits on many small operations.** The exit push issues one multi-file call; the full pass may issue a `copyto` per manifest plus deletes. *Experiment:* a full pass against Dropbox with 50 changed files and three devices' manifests; look for `too_many_write_operations` in the log.
- **The stage and the tree on different filesystems.** Install-by-rename is atomic only within one filesystem; `/storage/.cache` and `/storage/roms` are presumably one partition but nothing embedded says so. *Experiment:* `stat -f` both on a device; if they differ, install is copy-then-verify.
- **Wrong clock and the archive path.** `-replaced/<device>/<stamp>/` with a 1970 clock sorts wrongly and any date-based pruning removes the newest archive first. *Experiment:* set the clock back, overwrite, prune. Mitigation: prune by count per device, never by date.
- **A state loaded into the wrong core rewrites the game's SRAM.** After KEEP LEFT installs a cloud state, the next launch's load can flush a foreign SRAM over the local `.srm` (from `gpt-revised_plan.md`). The next exit sees "device changed" and uploads it — correctly, and with archive. The unknown is whether the player notices. *Experiment:* resolve a state conflict for a game with an in-game save, load the state, exit, inspect the `.srm` hash chain.
- **The first sync of two populated libraries produces dozens of never-agreed prompts.** By design (row 6), but the walkthrough has never been pressed through thirty items on a d-pad. *Experiment:* Gate 9's controller-only session with thirty synthetic forks.
- **`rclone lsjson -R` over a library far larger than the maintainer's.** The one listing is the whole budget of the full pass. *Experiment:* a 2,000-file synthetic tree against Dropbox; time it.

---

## 8. What must be proven on hardware before any of it is built — in order

- **Gate 0 — the instrument.** Repair `repo/tools/cloud-round-trip` [V defects: it writes `rclone.conf` before asserting the remote, restores neither it nor `SYNCPATH`, and its archive-namespace assertion cannot match the dated names `cloud_backup` writes]; run it end to end on GENERIC_X64 against WebDAV and MinIO; add the steps in §6 rows 7, 18, 19, 22 and a foreign-manifest republication step. Nothing else starts until it passes or every failure has an issue.
- **Gate 1 — cheap counterexamples on the VM** (§6 rows 18, 19, 20, 22; plus: the exit-only stopgap overwrites a cloud-only version; a non-empty `RCLONEOPTS` without `--filter-from` transfers without an allowlist; a user `+ /**` defeats a default exclusion). These kill wrong designs before hardware time is spent.
- **Gate 2 — rclone semantics on the device** (§6 rows 12, 13, 14; the bisync matrix of row 2; the path round-trip of §7). Against Dropbox from the H700 and the QA backends from a VM; on the device's rclone, not the host's (`repo/.claude/rules/rclone-cloud-sync.md` [V]).
- **Gate 3 — the boot race** (§6 rows 15, 16) on the H700, with the lifecycle markers proven to prevent it.
- **Gate 4 — ES primitives and identity** (§6 rows 4, 20, 21; −99 launched from the auto state; `copyToSlot` against an unwritable destination; refresh invalidation; batch reservations; two same-model devices with one cloned id if O4 is built).
- **Gate 5 — #19** as D-CLOUD-025 requires, same-chipset control first; results qualify the tested core/build pairs only.
- **Gate 6 — the exit budget** (§6 row 17) on the H700, and the A-exits/B-starts handoff on a hashless backend.
- **Gate 7 — interruption** at every step of §2.8 and of a unit publication; every pre-apply version recoverable; incomplete units not consumable; retry does not repeat a destructive step against a different occupant.
- **Gate 8 — #10 rehearsal** on a real device (§6 row 5), before the config file ships.
- **Gate 9 — the player** on the RG351M at 480×320 and the H700: real thumbnails, a thirty-item controller-only session, dismissal and rediscovery after a reboot, cancellation, auto KEEP BOTH, and whatever kid/kiosk policy the maintainer chose.

Build order after the gates: #21 capture and core pins → #22 reconciler, Stage 2 (forks queued, legacy toggles off) → #23 wizard with #24 adapter → #10 → #25.

---

## 9. What I refuse to build, and why

- **A staging mirror of the remote tree obtained by ordinary comparison skipping** (`kimi-revised_plan.md` F3): reproduces #53 on hashless backends and pays a whole-tree copy on every pass (`gpt_peer_review-r2.md` §1.2, `gemini_peer_review-r2.md` §1).
- **A protected-publication store with competing-heads readers in V1** (`gpt-revised_plan.md`): the complete answer to a risk the project accepted for this drop, at a cost the exit path cannot pay; §2.9 names the evidence that would flip it.
- **Tombstones hooked into ES's delete path** (my own earlier plan): the delete path is not embedded, a false tombstone violates the cardinal rule, and V1 needs no propagation.
- **The one-way stopgap** (`gemini-revised_plan.md` §5.1, `mistral-revised_plan.md` §3.2): not lossless; refused on the record.
- **An in-tree discard store** (`mistral-revised_plan.md` §3.5): defeated by user rules merged ahead of defaults.
- **A SQLite history index, a daemon, a database of any kind, vector clocks, semantic merging, progress heuristics that pick a winner** — the rule file's "lean toward progress heuristics" is read as *show* signals, never *select* by them (`repo/issues/issue-23.md` [V]).
- **A second production reconciler for diagnostics** after the spike has answered; the bisync fixtures live in the test suite.
- **A prompt at launch** about core mismatch or pending conflicts: a prompt is a failure mode (`repo/.claude/rules/upgrade-and-install.md` [V]); the badge is not a prompt.
- **Time-based anything in the classifier**: clocks are untrusted by the schema's own design.

---

## 10. Corpus gaps surfaced to the orchestrator

Not embedded, and needed before the marked claims can be called verified: `GuiSaveState.cpp` (delete and renumber-on-delete path; picker mechanics); `SaveState.h`/`SaveStateRepository.h` (default arguments of `makeStateFilename`, `copyToSlot`); `Paths.cpp` and `setsettings.sh` (savestates root; RetroArch `savestate_directory`); `cloud_content_backup`/`_restore`, `cloud_setup`, `backuptool`, `tools/cloud-test-backend`; `docs/es-ui-style-guide.md`; rclone 1.75.0 documentation or source for `bisync`, `--backup-dir` with `copy`, `lsjson --files-from`, `hashsum` on local paths; current issue bodies with the edited ACs (the embedded files are comment-thread exports); executed results of any round-trip, compatibility, concurrency or interruption test; and `claude-revised_plan.md` itself, which this document supersedes but could not re-read.

---

## `corpus.provenance.json`

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "council_member_artifact": "claude round-2 revised approach (this document); supersedes claude-revised_plan.md",
  "source_count": 42,
  "hash_verification": "sha256 values verified at embed time by the Council Facilitator and copied verbatim from the per-source headers; not re-read or re-hashed by this member",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "injected_peer_reviews": [
    "gemini_peer_review-r2.md",
    "gpt_peer_review-r2.md",
    "kimi_peer_review-r2.md",
    "mistral_peer_review-r2.md"
  ],
  "plans_referenced_via_reviews_only": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "gpt-revised_plan.md",
    "kimi-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "own_earlier_revision_embedded": false,
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
    {"description": "GuiSaveState.cpp; SaveState.h; SaveStateRepository.h; Paths.cpp", "declared_source_path": null, "sha256": null},
    {"description": "setsettings.sh and the RetroArch launch plumbing for savestate_directory (#10)", "declared_source_path": null, "sha256": null},
    {"description": "cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, tools/cloud-test-backend", "declared_source_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md", "declared_source_path": null, "sha256": null},
    {"description": "rclone 1.75.0 documentation or source for bisync, --backup-dir with copy, lsjson --files-from, hashsum on local paths", "declared_source_path": null, "sha256": null},
    {"description": "Current issue bodies with edited acceptance criteria (embedded files are comment-thread exports)", "declared_source_path": null, "sha256": null},
    {"description": "Executed round-trip, compatibility, concurrency and interrupted-apply results", "declared_source_path": null, "sha256": null},
    {"description": "claude-revised_plan.md and the other four revised plans, referenced here only through the injected reviews", "declared_source_path": null, "sha256": null}
  ]
}
```
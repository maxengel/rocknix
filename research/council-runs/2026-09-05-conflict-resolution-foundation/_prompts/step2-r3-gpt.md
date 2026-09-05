# Council — round 3, peer review of the revised approaches

You are one of five council members. Each of you has produced a revised
approach to the foundation for cloud-save conflict resolution in ROCKNIX. The
corpus is embedded above, unchanged and hash-verified; the other four members'
current revised approaches are injected below.

Review them. You are not revising your own plan in this step and you are not
voting.

## Anti-self-citation constraint

Judge the plans on their merits against the embedded corpus. Do not treat the
injected artifacts as evidence about how councils, models, or this deliberation
behave.

## Amendment to the problem context — two maintainer decisions

Both are authoritative, both were made **after** the injected plans were
written, and neither is open for argument. No plan is expected to name them and
none should be criticised for their absence. What matters is which plans are
closest to them, and what each would have to change.

### The purpose, restated

> The goal is to preserve the sanctity of the user's saves and to empower them
> with the choice to make a decision about a conflict. Undoing that choice is
> also something a user should have the option to do. They likely aren't going
> to be going 8 steps back with the save, but may accidentally make the wrong
> choice with the conflict and want to undo that choice. That's going to be the
> primary use case.
>
> Some of the edge cases around card disconnection, and so on, are good to think
> about, but are edge cases that shouldn't constrain our approach unnecessarily.

So: reversibility is a first-class requirement, the depth that matters is one
step back rather than a version history, and an edge case may inform a design
but may not drive it. In particular, the argument that a capability must be
given up *because* a detached or unmounted card is indistinguishable from a
deliberate deletion is not on its own sufficient. Failing closed on an
unexplained absence is cheap and is still expected; abandoning a capability to
buy it needs a better reason than the edge case alone.

### Where the undo lives, and where it does not

The plans divided on whether version one ships a control the player can press.
The maintainer has settled it:

> I don't want to add more complexity to the user during conflict resolution.
> The goal there is to get the user going as quickly as possible.

**Version one retains the discarded copy, on by default, bounded by a count, and
ships no undo control.** The wizard's done page says what was discarded and that
the copies are kept. Nothing in the resolution flow offers to put one back. A
plan that makes an on-device undo surface a version-one requirement is now
over-scoped, and a plan that builds lineage or receipt machinery deeper than one
step back is solving a problem the maintainer has said is not the primary case.

Restoring a discarded copy becomes a **separate tool**, tracked as its own
issue, and the maintainer has given it a shape:

> an option that allows you to essentially go back through conflict resolution
> flow and use it as a history restore flow, almost like a time machine, to
> overwrite the existing save with something from the past

That is the wizard's own compare-and-choose surface, pointed at a game's
retained past versions instead of at a live conflict, reached from outside the
moment of resolution.

**One consequence lands inside version one even though the tool does not.**
Nothing reads the discard store in version one, so nothing will catch a store
shape that a later reader cannot drive a picker from — one keyed only by a
timestamp, or one that drops which game, which slot, which device produced the
copy, and which side won. The store is designed now for a reader that does not
exist yet. Say whether each plan's retention design survives that requirement.

## What this round is for

The plans have converged on the architecture. What remains are the places where
they still genuinely differ, the places where all of them agree without the
corpus having settled the point, and now the places where the maintainer's
decisions above cut against what a plan proposes.

- **Find the real disagreements.** Where two plans differ, say whether the
  difference is substantive or only wording. If substantive, state what evidence
  or experiment would settle it, and which way you think it settles.
- **Test the load-bearing claims again.** A confident error that survives into
  the built foundation is the most expensive thing that can happen here.
- **Say which plans the amendments cost, and how much.** Naming a version-one
  requirement the maintainer has just descoped is a real defect; so is retention
  the later restore tool could not read.
- **Name what each plan uniquely has.** For every plan, identify at least one
  element the others lack that would be a real loss if it were dropped, specific
  enough to be lifted verbatim.
- **Name what any plan has that should not be built.** This is a handheld
  running busybox with a five-second budget on the path a player watches.
- **Say which plan you would build from,** and what you would take from the
  others before building. You are not voting; you are making the case.

Where a plan has changed your mind since your own revision, say so and why.

Refer to plans by filename (for example `kimi-revised_plan-r2.md`), never by an
invented ordinal.

## Injected revised approaches

=== START claude-revised_plan-r2.md ===

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

=== END claude-revised_plan-r2.md ===

=== START gemini-revised_plan-r2.md ===

This is my round-2 revised approach for the cloud-save conflict resolution foundation in ROCKNIX. It synthesizes the findings from the embedded corpus and the four peer reviews (`claude-revised_plan.md`, `gemini-revised_plan.md`, `gpt-revised_plan.md`, `mistral-revised_plan.md`), settling the remaining disagreements into a standalone, implementable specification.

## 1. Concessions and Refutations

Before defining the architecture, I concede the following points where peer reviews proved earlier approaches unsafe or unearned:

*   **The "lossless one-way stopgap" is destructive.** `gemini-revised_plan.md` and `mistral-revised_plan.md` proposed disabling downloads and keeping only the game-exit upload. As `gpt-revised_plan.md` and `kimi-revised_plan.md` correctly proved from `projects/ROCKNIX/packages/network/rclone/sources/cloud_backup`, the exit upload forces `copy` with *no* `--update`. It will blindly overwrite a newer cloud copy. This stopgap must not be built. D-CLOUD-029 stands.
*   **A full staging mirror is blind to same-size changes.** `kimi-revised_plan.md` proposed a metadata-skipped staging mirror. As `gpt-revised_plan.md` pointed out, on hashless backends (like the QA WebDAV, per `docs/save-manifest-alignment-review.md`), a same-size SRAM edit will be skipped by `rclone copy`, causing the detector to miss the cloud change entirely. We must use candidate-scoped reads with explicit download-and-hash verification.
*   **Hash-union provenance is volatile.** `claude-revised_plan.md` proposed looking up a version's producer by hashing across all manifests. `gpt-revised_plan.md` correctly argued that once the producer overwrites its own slot, the entry vanishes, and imported copies (like KEEP BOTH merges) lose their history. Provenance must be carried as an `origin` object inside the entry itself.
*   **Absence is not deletion intent, but D-CLOUD-030 requires tombstones.** `kimi-revised_plan.md` argued for never propagating deletions. However, `claude_peer_review-r2.md` proved that without cloud-side retirement, D-CLOUD-030's duplicate compaction creates an infinite upload/download/compact loop. We must use intent-recorded receipts (tombstones) for explicit deletions and compactions, while treating unexplained absence as a fail-closed anomaly.

## 2. The Architecture, End to End

### 2.1 Detection: The Manifest Three-Way Test
*Note: The council unanimously agrees on this, but it is **unmeasured** until the bisync spike runs.*

We demote `rclone bisync` to a candidate transport engine. The detector is a stateless classifier applying a three-way test (Local, Cloud, Agreed) per `docs/save-manifest-schema.md`.
*   **Candidate-Scoped Reads:** The engine lists the remote (`lsjson --hash`). It stages only the paths where L≠C (by hash if available, or size/mtime if not). On hashless backends, it explicitly downloads and hashes candidates to defeat the size-only blindspot.
*   **Multi-File Units:** Classification operates on the *save unit*, not individual files. If any member of a declared unit (e.g., a shared VMU or a state+PNG) is divergent, the entire unit is marked divergent. `gpt-revised_plan.md` correctly notes that aggregating file conflicts silently creates Frankenstein saves.

### 2.2 Identity and Lineage
We refine D-CLOUD-031 (see §5) to include an `origin` object.
*   **Self-Contained Provenance:** When a device materializes a save from the cloud, it records the producer's `device.label`, `core`, `core_build`, and `captured_at` in its own manifest entry.
*   **Screenshot Binding:** The manifest records `screenshot_sha256` to ensure the picker never displays a mismatched thumbnail.
*   **Move Observation:** ES move operations (`renumberSlots`) must update the placement record locally. We do not attempt to infer lineage after a rename-and-overwrite (`mistral-revised_plan.md`).

### 2.3 Presentation and Resolution
*   **Queued Conflicts & Headless Handoff:** The exit sync never opens the wizard over a player who just finished a game (`kimi-revised_plan.md`). Conflicts are written to a durable pending-result file. The UI surfaces a "N SAVE CONFLICTS TO RESOLVE" badge in `GAME SETTINGS > CLOUD SETTINGS`.
*   **Kid/Kiosk Mode:** The badge is hidden in restricted modes (`gpt-revised_plan.md`). Destructive resolution requires unlocking the full UI. We reject `mistral-revised_plan.md`'s requirement to make it reachable here, as it violates the mode's design (`docs/es-menu-map.md`).
*   **KEEP BOTH on Auto States:** The device's resume point stays at `.state.auto`. The cloud version materializes into a numbered slot with its thumbnail (`gpt-revised_plan.md`).
*   **Cancellation Contract:** "Cancelling leaves conflicting versions unchanged and discards walkthrough choices. Earlier non-conflicting updates have already been applied."

### 2.4 Merge, Safety, and Rollback
*   **Concurrency via `--backup-dir`:** We reject `gpt-revised_plan.md`'s expensive protected-publication protocol for V1. Instead, we use `gemini-revised_plan.md` and `claude-revised_plan.md`'s approach: every transfer in both directions uses `--backup-dir`. Uploads move cloud preimages to `<SYNCPATH>-replaced/<stamp>`; downloads move local preimages to `/storage/.cache/cloud_sync/discarded/<stamp>`. This makes lost races *recoverable* without extra spawns.
*   **Discard Store:** Lives at `/storage/.cache/cloud_sync/discarded/`. Because it is outside `/storage/roms`, it requires no allowlist exclusions and avoids sync-tree contamination (`kimi-revised_plan.md`).
*   **Retention:** *Keep discarded saves* defaults **ON**, bounded by a count selector. (This is a unanimous council change from IA rev 4's off-by-default).
*   **Checked Adapter:** `es/SaveStateRepository.cpp`'s `getNextFreeSlot()` returns -99 for auto-only repos, and `copyToSlot()` ignores return values. We wrap these in a checked adapter that verifies bytes written and handles the -99 defect safely.

### 2.5 Migration Path
*   **D-CLOUD-029 Stands:** The shipped write paths stay as they are until the new engine replaces them.
*   **Boot Sync vs. Session Race:** The detached `102-cloud-saves` boot script races with active gameplay, causing data loss (`claude-revised_plan.md`). We move the boot sync into ES scheduling, gated by save-lifecycle semantics (`gpt-revised_plan.md`): uploads of sealed data during play are permitted, but restores/renumbers/applies are blocked while an emulator runs.
*   **Manifest Transport:** Manifests move via in-spawn filters (`--include /savestates/.rocknix/manifest-<own>.json`), not separate `rclone` spawns, preserving the exit budget.

## 3. Decision Register Changes

These are explicit, append-only refinements to existing rows:

*   **Refine D-CLOUD-031-A (Origin):** Manifest entries must carry an `origin` object (device, core, build, capture time) to preserve producer metadata across re-slots.
*   **Refine D-CLOUD-031-B (Screenshots):** Manifest entries must carry `screenshot_sha256` to bind thumbnails to states.
*   **Refine D-CLOUD-031-C (Units):** Multi-file saves are grouped by a shared label. Shared containers (e.g., VMUs) record `rom: null`.
*   **Refine D-CLOUD-030-A (Deletions):** Unexplained absence fails closed. Explicit ES deletions, renumbers, and D-CLOUD-030 compactions write intent-recorded receipts (tombstones) which propagate as moves into dated siblings, capped per run.
*   **New Row (Retention):** *Keep discarded saves* defaults ON, bounded by a count selector, unifying conflict discards with #25's rollback precursor.

## 4. Known Unknowns (Resolution Plan)

1.  **Does loading a state rewrite SRAM?** (`gpt-revised_plan.md`)
    *   *Plan:* On a disposable test library, load a state, exit without saving in-game, and check if the `.srm` mtime/hash changed. If yes, states and saves form a single cross-unit dependency for the pre-pass.
2.  **The Exit Budget.**
    *   *Plan:* Measure process starts and remote operations on the H700 for: no changes, one changed SRAM, one state+PNG, and hashless verification. If the budget exceeds 5 seconds, defer hashless verification to the boot/menu full pass, leaving the exit push as a fast-path upload only.
3.  **`BACKUPPATH != RESTOREPATH` Behavior.**
    *   *Plan:* Treat a split path as an import destination (`gpt-revised_plan.md`). The engine performs a one-way copy into the alternate root but writes no agreement records, preserving the shipped feature's intent without corrupting the sync state.
4.  **The LAN No-Default-Route False Negative.**
    *   *Plan:* `check_network_link` exits 4 if there is no default route, which breaks LAN-only remotes on the same subnet (`gpt-revised_plan.md`). Replace the `ip route` check with a fast local ping to the remote's resolved IP, falling back to the default route check only for WAN remotes.

## 5. Unknown Unknowns

**The Failure:** The round-trip suite (`tools/cloud-round-trip`) reports SUCCESS while testing nothing, because its assertions are broken and it tests against a legacy archive naming convention.
**The Cheapest Experiment:** Repair the harness. Remove the `rclone.conf` overwrite that precedes the remote assertion. Fix the archive-namespace assertion to expect the new `${stamp}-${base}` dated names. Run it against MinIO (S3) and WebDAV on a GENERIC_X64 VM. If it fails, the test suite itself is the unknown unknown masking regressions.

## 6. What Must Be Proven on Hardware (In Order)

1.  **The Bisync Spike:** Run `rclone bisync` 1.75.0 against WebDAV and Dropbox with a genuine fork, a same-size SRAM edit, and an external equalization. If it demands `--resync` or renames savestate losers, permanently discard it as a detector.
2.  **The #19 Compatibility Bench (D-CLOUD-025):** Run the same-chipset control first (RG35XX SP vs RG SP). Then cross-family (H700 vs RK3566). Finally, corruption tests (truncate vs flip bytes) to determine if failure is loud or silent. This decides the severity of the UI badge.
3.  **The #10 Launch-Behavior Rehearsal:** Before shipping `es_savestates.cfg`, test auto-resume and incremental-slot behavior on a real device (`gemini-revised_plan.md`). Creating this XML file flips `racommands` to false and alters launch arguments. We must prove this does not strand existing flat-namespace saves.
4.  **The Boot-Race Reproducer:** Turn on startup sync, boot, launch a game from a numbered slot within 30 seconds, let the boot sync finish, exit, and list the remote. Prove that moving the boot sync into ES scheduling prevents the emulator's live SRAM from being overwritten by a stale cloud download.
5.  **The Interrupted Apply:** Kill the process after a local replacement but before remote publication, and after remote publication but before agreement is advanced. Prove that the frozen plan file allows the next pass to re-detect the unapplied remainder safely without deleting a unique candidate.

=== END gemini-revised_plan-r2.md ===

=== START kimi-revised_plan-r2.md ===

# Round-2 revised approach — the foundation I would build

**Author:** the council member whose round-1 revision was `kimi-revised_plan.md`.
**Corpus:** the 42 embedded sources, read at embed time, cited by declared path (shortened in prose to the part after `_sources/`) with the Facilitator's sha256 values recorded in `corpus.provenance.json` at the end. I did not re-read, re-hash, or execute anything.
**One honesty note before anything else:** `kimi-revised_plan.md` is not itself embedded. I engage with my own round-1 positions through the four reviews' quotations of them (F1–F9, H1–H8). Where I concede, I concede the claim as quoted.

---

## 0. How to read this document

This is a complete, standalone specification of the foundation: what gets built, in what order, with what guarantees, and what each guarantee rests on. Sections 2–3 are the delta since my round-1 revision (concessions and adoptions, with names). Section 4 is the architecture. Section 5 settles every substantive disagreement the reviews surfaced. Section 6 separates what the corpus proves from what the council merely agrees on. Sections 7–13 are the register changes, the unknowns, the experiments, the hardware gates, the refusals, and the build order.

The constraints from `00-problem-statement.md` are treated as binding throughout: preserve player progress above all; never default to recency; console-first; immutable OS, mutable `/storage`; rclone is the only transport; the exit path is watched by a player who just exited a game; guards fail closed; verify the artifact, not the report.

---

## 1. The foundation in one page

A save version is the sha256 of its stored bytes (D-CLOUD-030). Each device writes one manifest at `savestates/.rocknix/manifest-<id>.json` describing every save and state by path (D-CLOUD-031); a local, unsynced agreement record remembers the hash this device last moved per path per remote. Detection is a **unit-level three-way test** — local bytes, cloud bytes, agreed bytes — run by our own engine over rclone listings, foreign manifests, and on-demand content reads. `rclone bisync` is **not** the detector; it is a candidate bulk-transfer engine whose fate a spike decides, and no line of code depends on the outcome either way.

Capture happens at every game exit, offline or not, told the emulator and core by ES rather than discovering them. Non-conflicting changes are applied by the engine before any question is asked; genuine forks are **queued**, surfaced as a badge and a card line, and resolved in the wizard — never over the head of a player who just finished a game. The wizard walks system by system, cloud always left, screenshot or honest glyph, KEEP LEFT / KEEP RIGHT / KEEP BOTH, nothing conflicting transferred until COMPLETE. Merges go through a **checked adapter** over ES's slot allocator — never raw primitives, because the primitives lie. Every mutating transfer in both directions carries `--backup-dir` into a dated sibling, so no overwrite anywhere in the system destroys the only copy of anything. Deletions propagate only when they were **recorded** (an ES delete, a renumber, a compaction, a wizard choice) — as moves into the dated sibling, never hard deletes; unexplained absence fails closed, always. The shipped newest-wins write paths stay exactly as they are (D-CLOUD-029) until the engine replaces them wholesale.

---

## 2. What I concede from `kimi-revised_plan.md`

Nine positions did not survive review. Each is corrected in §4–§5; here they are owned.

| # | Round-1 claim (as quoted) | Refuted by | The refutation, verified against the corpus |
|---|---|---|---|
| C1 | **F8: deletions never propagate in V1; absence → resurrect, logged** | `claude_peer_review-r2.md` §2.1 | The renumber-churn trace: cloud-only `state5` downloaded onto `{0,1,2}`; `onGameEnded()` → `renumberSlots()` (incremental is true in the compiled default — `es/SaveStateConfigFile.cpp`, `es/SaveState.cpp`) moves it to `state3`; next pass uploads `state3` as device-only; `state5` is absent locally with agreement saying both had it → resurrected; D-CLOUD-030 compaction removes the local duplicate; next pass resurrects it again. **Forever.** I re-ran this trace against the embedded ES sources and the schema's move rule; it holds. Pure resurrection cannot terminate, because D-CLOUD-030's compaction is local-only and the cloud duplicate is never retired. |
| C2 | **F3: full staging mirror of the remote saves tree, hashed locally, as the default way to learn C** | `gpt_peer_review_r2.md` §1.2; `gemini_peer_review-r2.md` §1; `claude_peer_review-r2.md` §2.3 | A metadata-skipped `rclone copy` verifies the **cache**, not the cloud: on the QA WebDAV (no hashes, no modtimes — `repo/docs/save-manifest-alignment-review.md`) rclone compares by size, and same-size SRAM changes are the norm for fixed-size emulated memory — the #53 shape. And `rclone copy` is not a mirror: a remotely deleted file lingers in the stage, so staged presence is not proof of remote presence. |
| C3 | **F2: manifests move by explicit single-file copies, excluded from tree transfers** | `claude_peer_review-r2.md` §2.5 | A separate copy is another ~1 s rclone spawn on the path D-CLOUD-028 budgets at one spawn. The ownership semantics survive as filters inside the existing spawns. |
| C4 | **F5: the one-way interim posture "preserves both copies of every fork"** | `gpt_peer_review-r2.md` §1.1; `claude_peer_review-r2.md` row 14 | The exit upload is `copy` with no `--update` (`sources/cloud_backup`, the `--recent` branch): it overwrites the cloud head of a fork, after which the other head survives only on the other device — and a reflash or card failure ends it. The precise guarantee is *no device-local file is ever overwritten*. "Lossless" was wrong. |
| C5 | **F9: recheck-before-overwrite plus a staged prior version makes a lost race recoverable** | `gpt_peer_review-r2.md` §1.4 | The fatal interleaving: A checks and retains H₀; B publishes Hᵇ; A publishes over Hᵇ. A retained H₀, not Hᵇ. My staging protects the *observed* preimage, not the *intervening* one. |
| C6 | **F3's unit rule: classify per file; any divergent member makes the group divergent** | `gpt_peer_review-r2.md` §1.3 | The disjoint-member counterexample: agreed (a₀,b₀), local (a₁,b₀), cloud (a₀,b₁). No file is individually divergent, so the rule silently constructs (a₁,b₁) — a snapshot **neither device produced**. For an indivisible unit that is a fork, and per-file aggregation cannot see it. |
| C7 | **F1: D-CLOUD-030 compaction is the designed remedy for the mid-session zombie** | `claude_peer_review-r2.md` row 11 | Compaction covers *numbered slots of one game*. The `.state.auto` zombie is not a slot. The shipped sequence — `setupSaveState()` renames auto→`.bak` (old mtime preserved) and copies the slot→auto (fresh mtime); a racing boot backup uploads the zombie; `onGameEnded()` restores the real auto with its old mtime, which `--recent` never pushes; the next boot's `cloud_restore --update` downloads the zombie **over the real resume point** — is a concrete data-loss reproducer in shipped code (`es/SaveState.cpp`, `autostart/102-cloud-saves`). The remedy is exclusion and the lifecycle gate, not compaction. |
| C8 | **Discard retention "default 3, per the IA"** | `claude_peer_review-r2.md` row 15 | `repo/docs/conflict-wizard-ia.md` names a count selector and **no default**. The count-3 default is my proposal, and because IA rev 4 (which D-CLOUD-024 called implementation-ready) says *off by default*, flipping it needs a register row, not a citation. |
| C9 | **KEEP BOTH on an auto conflict: "the winner stays at `.state.auto`"** | `gpt_peer_review-r2.md` §2.6 | KEEP BOTH identifies no winner. Which copy automatic resume uses afterwards was undefined behaviour dressed as a rule. |

**Misread check:** `mistral_peer_review-r2.md` §3.3 attributes the staging mirror to `gpt-revised_plan.md` as something worth taking from it. The full mirror was my F3, and it was wrong; gpt's contribution was the candidate-scoped alternative I am now adopting. No other review misread my plan in a way that changes substance — the refutations above are correct, and `gemini_peer_review-r2.md` and `mistral_peer_review-r2.md`'s defences of F8 are addressed head-on in §5.1.

---

## 3. What I adopt from the other plans

Credited by filename; each is integrated in §4.

**From `claude-revised_plan.md` (via `claude_peer_review-r2.md`):** intent-recorded deletion receipts propagated as moves into dated siblings (the F8 replacement); `--backup-dir` in **both** directions as the concurrency-recoverability mechanism (developed from `gemini-revised_plan.md`'s seed); the agreement record bound to (remote, sync root); candidate-scoped staging with the full stage as hashless fallback; the reflash bootstrap; the one-writer rule and moving the boot sync under ES's scheduling; the in-spawn manifest transport filters.

**From `gpt-revised_plan.md` (via `gpt_peer_review-r2.md` and the other reviews):** the unit-level member-map classifier; the D-CLOUD-030 clarification (compaction concerns numbered states in one game/core repository, idle, after verified copies; never collapses an auto resume point into a numbered slot; equal bytes do not prove a move); the `makeStateFilename` parent-derivation finding (a staged-in-/tmp state would merge into /tmp — stage in the real save directory under a temp name); the eight #24 acceptance criteria, especially "standalone-emulator states never allocate" (`isEnabled` requires `retroarch`); the lifecycle gate **with a specified acquisition order**; self-contained producer provenance (an `origin` record, not a hash lookup into manifests the producer may have overwritten); move observation at the operation, not reconstruction after; the interrupted-apply contract; the precise cancellation sentence; the kid/kiosk rule; the import framing for `BACKUPPATH ≠ RESTOREPATH`; the "does loading a state rewrite SRAM?" and "no default route ≠ no reachable LAN remote" experiments; no 99-slot product cap; D-CLOUD-017 superseding the compat doc's "#10 likely unnecessary" line.

**From `gemini-revised_plan.md`:** the `--backup-dir` retention seed; the #10 launch-behaviour rehearsal as a real-device pre-implementation gate; the one-sentence D-CLOUD-029 confirmation ("the stopgap merely moves the clobber from game-exit to boot").

**From `mistral-revised_plan.md`:** the out-of-scope fence (a builder needs it as much as the plan); the IA-text corrections for rev 5 (the "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case); move observation as a first-class mechanism; the experiment→owner-issue table shape.

**Kept from `kimi-revised_plan.md` (verified by reviewers, not refuted):** the `RCLONEOPTS`-without-`--filter-from` hazard (a non-empty user `RCLONEOPTS` replaces the default option set wholesale — `sources/cloud_backup` `load_config` — and syncs `/storage/roms` with **no allowlist**; the most serious shipped hazard any plan found); the conflicted-copy admission in the saves tier (`+ /**/*.srm` admits a Dropbox "conflicted copy"; the saves scripts carry no `CONFLICT_EXCLUDES`); the `*.bak`/transient-artifact exclusion; the manifest-write discipline (never rewrite to bump `generated_at` — every exit would push 20 KB and the round-trip's "nothing to transfer" step would fail); the foreign-manifest republication hazard; the identity-collision rule for cloned cards; queue-and-badge conflict surfacing; the discard store outside the sync tree; the screenshots-tier recency exception; the ordered hardware gates with a defined shadow census; the #10 deferral.

---

## 4. The architecture, end to end

Each part is marked **endorse** (build as decided), **amend** (build with the stated changes), or **replace** (build differently), with register IDs cited.

### 4.1 Identity and lineage — **endorse, with five schema amendments**

D-CLOUD-030 and D-CLOUD-031 stand. A save version is the sha256 of its stored bytes; slot and file name are attributes; one JSON manifest per device at `savestates/.rocknix/manifest-<id>.json`, each device writes only its own, readers take the union; entries keyed by path relative to the sync root; the agreement record is local and unsynced at `/storage/.cache/cloud_sync/agreed.json`.

Five amendments (proposed as one register row refining D-CLOUD-031; §8):

1. **`origin`.** When a version is materialized anywhere other than where its producer wrote it — downloaded, re-slotted by KEEP BOTH — the receiving device records the producer's `device.id`, `device.label`, `core`, `core_build`, and `captured_at` **copied from the producer's entry at materialization time**. A re-slot is a new *placement* of an existing version, not a new version. This is `gpt_peer_review-r2.md` §2.3's correction: a per-device manifest holds one current entry per path, so when the producer overwrites the original path, the old provenance disappears from every manifest — hash-lookup provenance dies; self-contained provenance survives.
2. **`screenshot_sha256`.** The sha256 of the PNG that travels with a state. The picker's entire premise is choosing by the picture; a PNG that does not match the state version is a wrong picture shown at the worst moment. The apply step verifies the pair.
3. **`group`.** A label shared by the members of one save unit (VMU directory, memcard set, PPSSPP game-ID directory, an N64 `.eep/.mpk` pair), `null` for single-file saves. `rom` is `null` for shared containers (a VMU is not one game's). The grouping *table* — which layouts form indivisible units — lives in the engine, seeded from the allowlist's special directories (`sources/cloud_sync-rules.txt`: `n64/save/*`, `psx/memcards/*`, `dc/shared/savefiles/`, `psp/PPSSPP/`).
4. **Parse-failure rule.** An unparseable foreign manifest has its entries treated as `unknown`, is logged, is never adopted, and is never deleted — the producer rewrites it whole (temp-and-rename) on its next capture. A manifest with a higher `schema` is refused, per the schema's own rule.
5. **Identity-collision rule.** A device that finds entries under its own `device.id` that it did not write (a cloned card, an adopted identity file) warns loudly — audit line plus a UI surface — and does not adopt or merge them. The detection is behavioural, not time-based (`gpt_peer_review-r2.md` §2.3: clocks are explicitly untrusted in this design). The fix is regenerating one device's stored id, which `sources/cloud_device_id`'s stored-value-wins rule already permits.

Lineage: `replaces` holds one step; the audit log (D-CLOUD-027) holds the rest. **Move observation** (`mistral-revised_plan.md`'s mechanism, championed by `gpt_peer_review-r2.md` §2.3): ES's `copyToSlot(move=true)` and `SaveState::remove()` are patched to append one line to a local ops journal (`/storage/.cache/cloud_sync/ops.log`, never synced). Capture consumes it: a move re-keys the manifest entry (schema §6's own rule), which is what makes `replaces` correct across the rename-then-edit sequence — slot1=H₁, slot2=H₂, delete slot1 (renumber moves H₂ onto slot1's path), next session overwrites slot1 with H₃; without the journal, capture reads the stale entry and records `replaces: H₁` when the true predecessor was H₂. The journal is one choke point per operation type, and the round-trip suite proves it fires (blindspot 14: construct the renumber, watch the line appear). Hash-based move detection with re-verification remains as the safety net if a journal line is ever missed.

### 4.2 Capture (#21) — **amend**

Capture runs at the existing game-exit point (`es/FileData.cpp.launchGame-excerpt`), where ES already knows the game, `getEmulator(true)`, and `getCore(true)`, and passes them on the command line — told, not discovering (schema §9). Four amendments:

- **Unconditional.** Capture runs regardless of network, of the `cloudsaves.gameexit` setting, and of the cloud lock. The shipped gates (`FileData.cpp`: the setting, the binary's existence, `!ThreadedCloudSync::isRunning()`; `cloud_backup`'s exit 4 in `check_network_link`) exist for the *sync*; capture inside any of them misses exactly the offline sessions that manufacture forks. Capture is local reads plus a manifest write; per-file reads are safe against the engine's renames (rename is atomic), and a unit hashed across an apply boundary self-corrects at the next capture. It never takes the cloud lock, so it cannot deadlock behind a network worker (`gpt_peer_review-r2.md`'s acquisition-order requirement).
- **The launch descriptor, not the resolved default.** Record the core the launch actually used. Today `getCore(true)` is correct because the compiled default keeps `racommands=true`, which dormants `setupSaveState()`'s emulator/core rewrite; the XML path that activates the rewrite already exists (`es/SaveStateConfigFile.cpp`, `es/SaveState.cpp`), and upgraded installations can carry custom configs. ES passes what it launched; capture stays correct after #10.
- **The ops journal is consumed** (§4.1) so moves re-key rather than fork lineage.
- **The manifest is written only when something changed** — never to bump `generated_at`. Written whole, temp-and-rename.

`core_build` comes from `/usr/share/rocknix/core-pins`, emitted at image build from `LIBRETRO_CORES` × `get_pkg_version`, with `"unknown"` when the core→package map has no answer (schema §9). `clock_synced` is recorded; the wizard renders it.

### 4.3 Detection (#22) — **replace the detector; keep the issue's widened scope**

**The classifier is ours.** The authority is the unit-level three-way test. For a save unit U with member maps M_local, M_cloud, M_agreed (path → sha256 over the unit's *complete* member set, membership changes included):

| Condition | Verdict | Action |
|---|---|---|
| M_local = M_cloud | identical | nothing; write agreement if absent (verified equality writes agreement with no transfer) |
| M_local = M_agreed ≠ M_cloud | cloud changed | download the unit, no prompt |
| M_cloud = M_agreed ≠ M_local | device changed | upload the unit, no prompt |
| M_local ≠ M_agreed ∧ M_cloud ≠ M_agreed | **divergent** | wizard |
| no M_agreed ∧ M_local ≠ M_cloud | **never agreed** | wizard — conservative |
| only one side holds the unit | one-way | transfer, no prompt |
| cloud members match no manifest claim and no agreed map | **unknown** | ask — never silently "repaired" |
| a member missing that agreement says both had, no receipt | unexplained absence | fail closed (§4.6) |

Single-file saves are the degenerate case — this *is* the schema's §3 table generalized to units, which is the correction from `gpt_peer_review-r2.md` §1.3 (C6). A file with no manifest entry on either side is `unknown`-both and falls under "never agreed → ask" (the alignment review's constraint on #22). A sync client's conflicted copy is never a version the wizard offers (D-CLOUD-022) — and the saves tier currently *admits* one via `+ /**/*.srm`; that is a shipped bug, filed on day one (§8).

**How C's bytes are known — tiered, candidate-scoped** (C2's correction):

1. **Listing tier** (full passes): one `rclone lsjson --hash` of the sync root. Where the backend offers a hash, matching it against manifest-recorded `remote_hash` yields the sha256 without a download (schema §2).
2. **Manifest-claim tier:** the union of foreign manifests claims (sha256, size, mtime, device, core) per path. On hashless backends this is what catches another *ROCKNIX* device's same-size SRAM change — the producer's own manifest says so, and the subsequent download confirms the bytes.
3. **Confirmation tier:** download-and-hash for every path where a decision depends on it and tiers 1–2 cannot settle it — contested paths, wizard-displayed pairs, upload verification on hashless backends. On the QA WebDAV (no hashes, no modtimes) size is a hint and sha256-after-download is the confirmation, exactly as the schema says; a listing that answers nothing is *unknown*, never "no conflict" (blindspot 22).

The **full content stage survives only as a fallback mode** for backends offering neither hash nor modtime, and every staged object is valid only alongside the listing that vouched for its freshness. The residual is stated honestly: a same-size change by a *non-ROCKNIX* writer on a hashless backend is invisible to the cheap tiers; a periodic full-verify pass (menu-triggered, not boot) bounds it. The shadow census (§11) measures how large that scope actually is on the maintainer's real library before the fallback mode's cost is accepted.

**bisync is a candidate transfer engine, nothing more.** The spike (§11) decides whether bisync earns the bulk-transfer role for non-conflicting units. The engine's semantics — classification, agreement, receipts, the wizard's data — never depend on the outcome. If bisync is adopted: never `--resync` on its own (the first run is an explicit maintainer-driven step; `--resync-mode` defaults to path1, a winner-picks-all pass); `--recover`/`--resilient`; `--conflict-loser` never left to rename a savestate (its `…conflict1` suffix breaks `{{romfilename}}.state{{slot}}` and the file vanishes from the manager); the workdir named explicitly at `/storage/.cache/rclone/bisync`; every call under the cloud lock (the futro's #22 ACs, kept whole).

**The engine never inherits `RCLONEOPTS` or `BACKUPMETHOD`.** It builds its own option set. (Corpus-settled: `sources/cloud_sync.conf` ships `--delete-excluded` inside `RCLONEOPTS`; each legacy script strips it independently; the engine does not inherit the problem.)

**Passes and entry points.** The engine owns the saves tier's write paths (the futro's widened #22):

- **Boot pass** — full reconcile: download phase, then upload phase (the restore-before-backup ordering the old pair guarded), non-conflicts applied, conflicts queued, badge updated. Scheduled by ES once the UI is up and no game is running; the existing `autostart/102-cloud-saves` trigger is replaced by this, which is what removes the boot-sync-versus-gameplay race structurally (§4.7). Its liveness check becomes the configured remote, not `ping google.com` (`repo/.claude/rules/rclone-cloud-sync.md`: "reachability means the remote, not the internet" — the pre-existing gap is filed with #7).
- **Exit pass** — capture; then, if nothing changed since the last successful pass and no conflict work is pending: exit 0 with **no remote contact** (D-CLOUD-028's fast path preserved untouched). Otherwise one rclone spawn uploads the changed saves plus the own manifest (filtered include), with `--backup-dir` to the remote dated sibling; then verification — one `lsjson --hash` on hash backends (which also populates `remote_hash` lazily; no dedicated spawn), download-and-hash of just-transferred files on hashless ones. Before each upload, the cached manifest-claim tier is consulted: if a foreign manifest claims that path at a version ≠ agreement, the upload is skipped and the conflict queued instead. The residual is stated: a fork created since the last full pass can be overwritten on the exit path, and the dated sibling is what makes that recoverable; full passes detect authoritatively. The card reports `UPLOADED n` / `n CONFLICTS QUEUED` — never implying the cloud is settled when it is not (`gpt_peer_review-r2.md` §2.5's reporting rule).
- **SYNC SAVE DATA row** — explicit full reconcile, then a direct route into the wizard if conflicts exist (the player asked).
- **Menu full passes** — unchanged in spirit; they are where full-verify lives.

The replaced-mechanism inventory (the futro's requirement) is answered: `--update`'s newer-on-destination skip → the classifier; restore-before-backup ordering → the reconcile's download phase precedes its upload phase; the lock → kept, plus the lifecycle gate; the `--recent` window → kept for the exit pass; the stamps in `/storage/.cache/cloud_sync/` → written by the engine, so the D-UI-018 rows keep reading them. The content tier, the system-backup tier, and `gamelist.xml` are untouched — out of scope. Screenshots sync as today (append-mostly, timestamped names; no progress lives in a screenshot — a stated exception).

**Results are typed.** Every run writes a run-correlated result JSON (counts, per-phase status, conflicts found) that the card and badge read; rclone's raw exit codes never reach the UI. The shipped collision — rclone's 3/4 passing through `clean_exit` into the scripts' reserved SKIPPED meanings, and `clean_exit ${BACKUP_STATUS}` masking a system-phase failure — is filed on day one (`sources/cloud_backup`, `sources/cloud_restore`, `es/ThreadedCloudSync.cpp`; `claude_peer_review-r2.md` row 6, `gpt_peer_review-r2.md` §2.7).

### 4.4 Presentation and resolution (#23) — **amend the trigger and three details; endorse the rest**

IA rev 4's walkthrough stands: system by system then game by game; cloud always the left column; screenshot or glyph, never a substitute image; date, time, device + model, core + build per side; no file size, no play time; KEEP LEFT / KEEP RIGHT / KEEP BOTH; nothing conflicting transfers until COMPLETE; the pre-pass applies non-conflicts before the walkthrough opens, and the wizard refuses to open until it has completed.

Amendments (the IA rev 5 batch, §8):

1. **Queue-and-badge trigger.** "A sync that reports conflicts opens the wizard" cannot survive contact with the entry points: the boot pass has no UI to open anything, and the exit pass is watched by a player who just finished a game — a wizard over that moment is the prompt-as-failure-mode the repo's own rules name. Conflicts are recorded in a pending state file; the exit card says `n CONFLICTS QUEUED`; a `GAME SETTINGS > CLOUD SETTINGS` row reads `n SAVE CONFLICTS TO RESOLVE`; the wizard opens from that row and from the direct route after an explicit sync. (My F7.4 and `claude-revised_plan.md` converged on this; `gpt_peer_review-r2.md` §2.6's amendment — the direct route — is included.)
2. **The cancellation sentence** (`gpt_peer_review-r2.md` §2.6's precise form, which supersedes `claude_peer_review-r2.md` §2.8's): *"Cancelling leaves the conflicting versions unchanged and discards the walkthrough's choices. Earlier non-conflicting updates have already been applied."* Rev 4's "quitting partway leaves both sides exactly as they were" is literally false once the pre-pass has run.
3. **KEEP BOTH on an auto conflict requires a resume-side sub-choice** (C9): the player picks which copy becomes `.state.auto`; the other is materialized to the next free numbered slot through the checked adapter. One extra press; deterministic; visible. The schema's `kind: auto` marking lets the wizard label it a resume point rather than a numbered slot (schema §4).
4. **KEEP BOTH is dimmed with a reason** for in-game saves (fixed slots), for standalone-emulator states (`SaveStateRepository::isEnabled` requires `retroarch`; the allocator returns −99 — `claude_peer_review-r2.md` row 1, gpt's AC 8), and for auto-only repositories (the −99 defect).
5. **Kid/kiosk mode** (`gpt_peer_review-r2.md` over `mistral_peer_review-r2.md`): the full-UI block collapses in kid mode (`repo/docs/es-menu-map.md`), so the badge is invisible there — and a kid resolving save conflicts destructively is what kid mode exists to prevent. Pending conflicts stay safe (nothing destructive happens without the wizard) and become resolvable after unlock. No restricted-mode resolver is built.
6. **Layout at 480×320 first**, proven with real thumbnails on the RG351M (`tools/vm-visual-qa` frames at both sizes as AC evidence). If the thumbnails are not recognizable there, the fallback is a single-column compare (one panel, toggle sides) — decided by the test, not in advance.
7. **The compatibility badge** compares (core, core_build) between the entry and this device's pins; `unknown` renders honestly. Its severity — convenience or safeguard — waits for #19 (D-CLOUD-025 stands). Chipset is not an axis unless #19 makes it one.

The done page names each discarded copy per game, and the audit line is written **before** the apply step retires anything (the futro's ACs, kept).

### 4.5 Merge (#24) — **replace raw reuse with a checked adapter**

The corpus now proves the primitives cannot be used raw: `getNextFreeSlot()` returns −99 for an auto-only repository (the vector is non-empty with slot −1, the 99999→0 scan finds nothing — `es/SaveStateRepository.cpp`) and for any non-RetroArch emulator; `copyToSlot()` ignores the results of its copies and renames and returns `true` unconditionally (`es/SaveState.cpp`); and `makeStateFilename(fullPath=true)` derives the destination from the **source's** parent directory, so a cloud state staged outside the save directory would be merged back into the staging directory.

The adapter therefore:

- computes destinations itself; stages cloud bytes **in the real save directory under a temp name** (a name matching neither ES's slot regex nor the auto regex, cleaned on sight at the next pass — it would otherwise sync via `+ /savestates/**`);
- reserves the whole batch's target slots **up front** (refreshing between allocations is insufficient — planned copies have not materialized, so repeated refreshes return the same slot; `gpt_peer_review-r2.md` §3) and re-verifies at apply time;
- copies, **verifies the bytes by sha256**, then renames into place — PNG before state, the pair bound by `screenshot_sha256`;
- handles −99 explicitly: auto-only repository → the auto conflict's KEEP BOTH goes through the resume-side sub-choice; standalone or disabled → KEEP BOTH is dimmed, never attempted;
- records the merged copy as a new placement: manifest entry with `origin` preserved from the producer, `replaces: null`, slot as an attribute; audit line.

No 99-slot product cap is introduced to work around the allocator defect (`gpt_peer_review-r2.md`). `renumberSlots()` remains available if gap reclamation is ever wanted.

### 4.6 Safety, deletion, and rollback — **replace F8/F9 with the receipts-and-siblings mechanism**

**Every mutating transfer, in both directions, carries `--backup-dir` into a dated sibling.** Uploads: `remote:<SYNCPATH>-replaced/<stamp>/` (a sibling, never nested — D-CLOUD-014's verified constraint). Downloads and local retirements: `/storage/.cache/cloud_sync/discarded/<stamp>/`. Zero extra spawns; the archiving rides inside the transfer. This is `claude_peer_review-r2.md` §2.2's development of `gemini-revised_plan.md`'s seed, and it is what answers `gpt_peer_review-r2.md` §1.4's interleaving: when A publishes over B's intervening Hᵇ, A's own `--backup-dir` moves Hᵇ aside server-side in the same spawn. The guarantee is **recoverability, not prevention** — there is no compare-and-swap on arbitrary backends, and `--backup-dir`'s exact behaviour under a two-writer race (which generation it archives, same-second destination collisions) is a named spike fixture, not an assumption (§11).

**Deletion propagates only from recorded intent** (C1's correction). Three sources of intent, all local and all ours: the ops journal (ES deletions and renumbers), compaction (D-CLOUD-030), and wizard resolutions. Each produces a **receipt**: *path P held version H; this device retired it at T for reason R*. Propagation: if the cloud holds P with hash verified == H, the engine copies it to the dated sibling, verifies, then deletes P — copy-verify-delete, never `rclone move` (D-CLOUD-026). If the cloud holds P at any other hash, the world changed since the receipt: that is a conflict, not permission. Receipts are capped per run; an unexpected deletion set fails closed. A mass-absent remote tree refuses to act at all (the changelog's empty-remote guard).

**Unexplained absence fails closed, exactly as F8 said.** No receipt → the absent path is resurrected or asked about, never deleted. This is where `gemini_peer_review-r2.md` and `mistral_peer_review-r2.md`'s defence of F8 is honoured: their argument — a false tombstone loses data, a resurrection annoys — is correct for *unrecorded* absence, and it survives whole. What does not survive is "never", because D-CLOUD-030's own compaction cannot terminate without a cloud-side retirement (the churn trace, C1). The minimal mechanism that terminates is receipts for recorded operations; nothing more general is built (§5.1).

**The move-path rule** (proposed register row, §8): for a savestate, the device's renumbered path is canonical; the cloud's old path is retired by receipt. This answers the schema §3's dangling "the rule in #24 says which path wins" — #24 never said; now it is said.

**Keep discarded saves** becomes a retention count over the local dated sibling — the same machinery as #25's pre-change snapshots, built once, as the IA asked. Default **ON, count 3**, proposed as a register row (C8). The store lives outside the sync tree, so no allowlist rule is needed — and note `claude_peer_review-r2.md` row 8: a *defaults-file* exclusion is not a boundary at all, because `cloud_sync_helper` places user rules first. That propagates to #25: its snapshot exclusion must be a command-line exclusion or an outside-tree location, never a defaults line.

**The interrupted-apply contract** (`gpt_peer_review-r2.md` §1.5's requirement, `claude_peer_review-r2.md` §2.8's shape): the wizard's decisions are frozen into an **apply record** before anything moves — per unit: the decision, the operand hashes on both sides, destinations, preimage locations, and a per-unit status. Apply per unit: stage → verify staged bytes against the operand hash → move the loser to the local sibling → rename staged into place (PNG before state; a multi-file container staged as a whole directory and renamed whole) → verify final bytes → write manifest entries → write agreement **last** → audit line → mark status. An interruption leaves each unit old or new; the record's presence at the next pass means "an apply was interrupted", and each unit is re-reconciled from the record against reality — never deleting a unique candidate, never repeating a destructive step against a different occupant, and re-offering undecided units. The done page after a crash reads the record and says accurately what was applied. The audit log (D-CLOUD-027: bounded, support-only) is deliberately **not** the journal.

### 4.7 The one-writer rule and the lifecycle gate — **new, load-bearing**

The save tree has at most one writer at a time among gameplay, capture, and engine mutations. ES holds a **lifecycle lock** (a flock, non-blocking on the engine's side) for the duration of gameplay; the engine takes it before any save-tree mutation — downloads, compaction, apply — and skips-and-defers if a game is running. Acquisition order is fixed: **lifecycle lock, then cloud lock, never the reverse**; capture takes neither (§4.2). The gate is scoped to save-tree safety: game launch is never blocked behind a long content transfer (`gpt_peer_review-r2.md` §4's scoping). This is what closes the shipped boot-sync-versus-session race structurally rather than by timing luck: the boot pass runs under ES's scheduling when no game is running, and a game launched during any engine pass leaves the pass deferred, not racing. The session-zombie reproducer (C7) is run on hardware first, because it is also the evidence that justifies this gate to the maintainer (§11).

### 4.8 Migration off today's write paths — **endorse D-CLOUD-029; no stopgap**

The shipped paths stay exactly as they are until the engine replaces them: boot and menu run `copy --update` down then up; the exit upload is `copy` with no `--update` — newest-wins, blindspot 28. D-CLOUD-029's reasoning stands and I no longer argue with it: the maintainer is the only user until the feature exists, and the `--update` stopgap only moves the clobber from game-exit to boot (`gemini-revised_plan.md`'s one sentence). The maintainer's optional config posture — boot pair and SYNC row off, exit upload on — remains available as their own toggle choice, described with the corrected guarantee (C4): *local-loss-proof, not lossless; the cloud head of a fork can still be overwritten, surviving only on the other device.*

The upgrade is invisible (`repo/.claude/rules/upgrade-and-install.md`): existing saves are `unknown` and rendered as such; nothing stamps a file it did not write; the first full pass hashes the library once (priced on the maintainer's library before deciding boot vs menu — `claude_peer_review-r2.md` §2.11's consequence); verified equality writes agreement without transfer, so a device whose cloud already matches gets no false conflicts; a reflashed device regenerates the same `cloud_device_id` (seeded from the permanent hardware address), finds its own previous manifest in the cloud, and **seeds from it before its first capture republishes** — capture works offline regardless; the merge rule is that pre-reflash entries are its own history, refreshed for files it still holds, kept as provenance for files it does not. `BACKUPPATH ≠ RESTOREPATH` is handled as an **import**: the two-way engine refuses; a one-way copy into the alternate root writes no agreement (`gpt_peer_review-r2.md`'s framing, which beats my fail-closed-everything because `sources/cloud_sync.conf` documents the split as a feature).

---

## 5. The disagreements, settled

### 5.1 Deletion propagation — receipts for recorded operations; fail-closed otherwise

**Position:** as §4.6. **Reason:** C1's churn trace — verified against `es/SaveStateRepository.cpp`, `es/SaveState.cpp`, and D-CLOUD-030's text — shows pure resurrection cannot terminate, and `gpt_peer_review-r2.md` §2.2 independently reached the same scoping ("unexplained absence is not deletion authority; verified duplicate cleanup is already decided; do not make a general deletion protocol a prerequisite merely to solve duplicate convergence — but do not defer convergence either"). `gemini_peer_review-r2.md` ("Kimi is right… V1 must fail closed on absence") and `mistral_peer_review-r2.md` §1.2 ("the only safe V1 posture is no deletion propagation") did not engage with the trace; their safety argument is preserved in the fail-closed half, and their fragility worry is answered by the design's failure direction — a missed journal line means no receipt, and no receipt means fail closed. **Deciders:** the churn-termination fixture (cloud-only `state5` onto `{0,1,2}`; download; launch from the manager and exit; sync twice; assert one copy of H per side, no churn, the retired cloud copy in the dated sibling); the delete-propagation fixture (delete the highest slot on A; sync; sync B; assert B's copy is moved aside, not resurrected); the stale-receipt fixture (a receipt for X retires only an unchanged X; if the other side now holds Y → conflict); the mass-absence fixture (refuses to act). **Under each outcome:** if receipts prove fragile in practice, the hash-based move detection with re-verification is the net, and the worst case is bounded churn — annoying, never loss.

### 5.2 Concurrency — `--backup-dir` both directions; gpt's protocol deferred with a named trigger

**Position:** as §4.6. **Reason:** the model is one-player-many-devices-never-concurrent; the budget forbids a two-phase commit in bash (gpt's own pricing: a changed unit can require an evidence read, a publication batch, the canonical transfer, and verification, against a path where one save already costs ~7 s, "most of it Dropbox's commit" — `repo/.claude/rules/rclone-cloud-sync.md`); and the cardinal rule needs recoverability, not linearizability. `mistral_peer_review-r2.md` §1.3 is right that the pre-upload check alone cannot close the window — which is exactly why the mechanism is `--backup-dir`, not the check. **Deciders:** the two-H700 race fixture (interleave publications; kill after each destructive stage; pass = both heads present, one canonical, one siblinged) and gpt's Gate 5 cost measurement. **Under each outcome:** if `--backup-dir` preserves intervening heads on Dropbox and WebDAV, ship as designed; if it does not, gpt's protected-publication protocol becomes load-bearing **before multi-device ships**, and the drop sequences single-device-first.

### 5.3 How C's bytes are obtained — candidate-scoped tiers; full stage as hashless fallback

**Position:** as §4.3. **Reason:** C2. `mistral-revised_plan.md`'s metadata-only detector is rejected with it (`claude_peer_review-r2.md` row 13: on the QA WebDAV it compares by size — the #53 shape it itself cites). **Deciders:** the same-size WebDAV fixture (change a cloud SRAM preserving size; the classifier must not conclude "cloud unchanged"); the shadow census cost measurement. **Under each outcome:** if the decision-scoped download set is small on the maintainer's library, candidate-scoping is permanent; if it is large, the full-stage fallback is priced and accepted for hashless backends only.

### 5.4 bisync's role — candidate transfer engine; the classifier is ours regardless

**Position:** as §4.3. This is the council's main amendment to argue to the maintainer: the problem statement listed bisync-as-detector as the approach under judgement, and no register row made it binding (`claude_peer_review-r2.md` §0 is correct on both counts). The spike-independent argument — nothing writes bisync's listing state after a manual wizard apply — remains a hypothesis until the spike; the spike runs regardless. **Decider:** the spike matrix (§11). **Under each outcome:** pass → bisync earns bulk transfer of non-conflicting units under our flags; fail → pure rclone copy, and nothing in the engine changes, because nothing depended on it.

### 5.5 #10's per-core directories — deferred to their own futro; no safety claim made

**Position:** defer, with `gpt-revised_plan.md`'s proof obligations (via `claude_peer_review-r2.md` §2.4) installed as #10's futro gates, and `gemini-revised_plan.md`'s real-device launch-behaviour rehearsal as the pre-implementation gate. **Reason:** shipping `es_savestates.cfg` is a launch-behaviour migration, not a config change — corpus-settled (`es/SaveStateConfigFile.cpp`: the XML path hard-codes `racommands = false` and defaults `autosave`/`incremental` to false; the compiled `Default()` sets all three true). The wizard does not need the directory: `core` is a field, the classifier and badge work on the flat layout. **Honesty** (`gpt_peer_review-r2.md` §2.4): the flat layout's local cross-core overwrite (core C₂ writing the `.state.auto` path C₁ used, before any reconciler sees either version) is **pre-existing shipped behaviour** — this milestone does not worsen it, and I do not claim the drop is "safe" against it; D-CLOUD-017 stands and #10 gets its own futro. Also adopted: gpt's note that D-CLOUD-017 supersedes `repo/docs/savestate-compat-test.md`'s "#10 likely unnecessary" — a clean chipset result narrows the badge; it does not repeal core namespacing.

### 5.6 Wizard trigger, retention default, cancellation, auto KEEP BOTH, kid mode

Settled as §4.4: queue-and-badge with a direct route (IA rev 5, not a quiet replacement of the rev 4 contract); retention ON with count 3 by **register row**, not by citation (C8); gpt's precise cancellation sentence; the resume-side sub-choice; gpt's kid/kiosk rule over mistral's reachability requirement.

### 5.7 Manifest transport — in-spawn filters, gated on one dry run

**Position:** downloads exclude `/savestates/.rocknix/manifest-<own>.json`; uploads include only the own manifest under `.rocknix/`; foreign manifests in the tree are harmless read-only caches; the reflash bootstrap (§4.8) is a first-run special case, not a transport rule. **Reason:** C3. **Decider:** one dry run, because the corpus establishes only that `--include`/`--exclude` precede `--filter-from` (`repo/.claude/rules/rclone-cloud-sync.md`); the relative order of `--filter` and `--filter-from` is unestablished. If `--filter` cannot be ordered ahead, `--exclude`/`--include` are used, which can. The republication hazard itself (a cached foreign manifest republished over its producer's newer one; the own-manifest download overwriting entries captured since) becomes a round-trip fixture.

### 5.8 Interrupted apply — the frozen plan is the journal

Settled as §4.6: the apply record with per-unit status **is** the durable pending-operation record; no separate transaction journal, no database, no daemon. `gpt_peer_review-r2.md` §1.5's acceptance contract is adopted verbatim as the test: after interruption, the implementation can identify the exact planned versions and destinations, distinguish completed work from intent, keep incomplete units out of emulator consumption, and either finish or safely stop without deleting a unique candidate.

### 5.9 Split roots, remote_hash, agreement writes

Split roots: import framing (§4.8). `remote_hash`: populated lazily from the next natural listing, never by a dedicated post-upload spawn on the watched path (`claude_peer_review-r2.md` §4); a locally computed backend-native hash (`rclone hashsum dropbox`) is an *expected* value, not an observation — it remains my H2 experiment, not a dependency (`gpt_peer_review-r2.md` §2.5). Agreement is written in exactly three ways: after a verified upload, after a verified download, after verified equality. No provisional agreement authorizes anything (`gpt_peer_review-r2.md` §4's removal, adopted).

---

## 6. What the corpus settles vs what the council merely agrees on

The most expensive error left is a position held by everyone and evidenced by nobody. These are the load-bearing ones:

| Position | Status | What settles it |
|---|---|---|
| bisync's 1.75.0 behaviour under `--conflict-resolve none`, interruption, filter change, external equalization | **Council-agreed (demoted), corpus-silent** | The spike matrix (§11, gate 2) |
| `--backup-dir` preserves the intervening head under a two-writer race on our backends | **Council-agreed (claude/gemini/me), untested for this use** — shipped precedent exists only for `BACKUPMETHOD=sync` | The race fixture (§11, gate 7) |
| The exit upload overwrites the cloud head of a fork | **Code-visible** (`sources/cloud_backup` `--recent` forces `copy`, no `--update`), **not executed** | The cheap counterexample (§11, gate 1) |
| The session-zombie resume-point loss | **Code-traced** (`es/SaveState.cpp` + `autostart/102-cloud-saves`), **not executed** | The H700 reproducer (§11, gate 3) |
| Foreign-manifest republication | **Allowlist admission verified** (`+ /savestates/**`); the republish behaviour not executed | Round-trip fixture (§11, gate 1) |
| Auto states are the commonest conflict | **Schema §4 asserts; launch-habit dependent** (`gpt_peer_review-r2.md` §3: numbered-slot launches discard the session's auto at exit) | The shadow census (§11, gate 8) |
| 480×320 thumbnails are recognizable | **Council-agreed to test; unmeasured** | The RG351M recognition test (§11, gate 9) |
| Core sets differ per build target | **Asserted, not corpus-established** | `diff LIBRETRO_CORES` across targets — no hardware (§11, gate 0) |
| `--filter` vs `--filter-from` ordering | **Not in corpus** | One dry run (§11, gate 0) |
| `rclone hashsum <backend>` computes backend-native hashes locally | **General knowledge, not corpus** | Device experiment; not a dependency |

Corpus-**settled** (assertable without further experiment): the −99 allocator defect; `copyToSlot`'s unconditional `true`; the `es_savestates.cfg` behaviour flip; the boot pair's shape and its `ping google.com` gate; the harness defects; the `RCLONEOPTS`-without-`--filter-from` hazard; user-rules-first in `cloud_sync_helper`; the allowlist's admission of `*.bak` and conflicted-copy `.srm`; the exit-code 3/4 collision and phase-status masking; newest-wins as shipped (blindspot 28); the substrate (rclone 1.75.0 with bisync, `take_cloud_lock`, `jq`, busybox `sha256sum`, ES's slot primitives, the allowlist's `*.db*` exclusions); the budget numbers (~1 s rclone start, ~5 s nothing-changed exit sync, ~7 s one save); all cited D-CLOUD rows.

---

## 7. Load-bearing vs optional

**Load-bearing** — get these wrong and the milestone is unsafe:

1. Identity = sha256 of stored bytes (D-CLOUD-030) and the unit-level three-way classifier with unknown→ask and never-agreed→ask.
2. Capture at exit: unconditional, told-not-discovered, journal-consuming, write-only-on-change.
3. The checked merge adapter (no raw ES primitives; batch reservations; temp-then-rename; byte verification; PNG binding).
4. The one-writer rule: lifecycle gate with fixed acquisition order; the boot pass under ES's scheduling.
5. `--backup-dir` in both directions; dated siblings; retention count.
6. The ops journal + receipts; unexplained absence fails closed.
7. Manifest transport ownership (own manifest never downloaded over local; no republish of cached foreign manifests).
8. Agreement scoped to (remote, sync root); written last per unit; only the three write paths of §5.9.
9. The apply record for interrupted applies.
10. Guards fail closed; every transfer verified by content.

**Optional / deferrable:** bisync as transfer engine; the badge's severity (#19); #10's directories; #25's snapshot UI; resolution receipts / anti-ping-pong (V2 — the ordinary post-resolution case is "cloud changed → download"; a re-ask arises only when the other device never agreed, and re-asking is not destructive); full-verify cadence tuning; a kid-mode resolver; the SQLite history index (**rejected** — say so in #20 and close it).

---

## 8. Decision-register changes (proposals to the maintainer)

The register is append-only; each is a new row citing the old. Nothing below reopens a row silently.

- **D-CLOUD-029: stands.** No stopgap; the engine replaces the write paths wholesale. No row needed.
- **Proposed D-CLOUD-032** (refines D-CLOUD-030, cites #24): compaction's scope clarified — numbered states in one game/core repository, idle, after verified copies; never collapses an auto resume point into a numbered slot; equal bytes do not prove a move. And the move-path rule: for a savestate, the device's renumbered path is canonical; the cloud's old path is retired by receipt.
- **Proposed D-CLOUD-033** (refines D-CLOUD-031): the five schema amendments of §4.1 (`origin`, `screenshot_sha256`, `group`, parse-failure rule, identity-collision rule) plus agreement scoping to (remote, sync root).
- **Proposed D-CLOUD-034** (refines D-CLOUD-024 / IA rev 4): *keep discarded saves* defaults **ON** with a retention count of 3, bounded, sharing #25's machinery. Reason: the default-off path is destructive on the commonest conflict kind; the cardinal rule prefers retention; the count bounds card storage.
- **Proposed D-CLOUD-035** (refines D-CLOUD-028): the exit pass may spend verification round trips on just-transferred files (one listing on hash backends; download-and-hash on hashless). The no-change fast path — no remote contact — is untouched. Numbers attached after the pricing gate (§11, gate 8) before the row is asked for.
- **Proposed D-CLOUD-036** (amends the #22 approach as framed in `00-problem-statement.md` and the futro): the conflict classifier is the manifest three-way test; bisync is a candidate transfer engine pending the spike. This is the amendment `claude_peer_review-r2.md` §0 correctly says must be argued, not body-edited.
- **IA rev 5 batch** (to the maintainer with D-CLOUD-034; not rows): queue-and-badge trigger; the cancellation sentence; the KEEP BOTH auto sub-choice; the `getNextFreeSlot` −99 correction to the "checked, not assumed" paragraph; the kid/kiosk rule.
- **Propagated to #25:** the snapshot exclusion cannot be a defaults-file rule (user rules precede defaults); it must be a command-line exclusion or an outside-tree location.
- **Filed on day one, outside the milestone:** the `RCLONEOPTS`-without-`--filter-from` ROM-upload hazard; the exit-code 3/4 collision and saves-phase-only status masking; the round-trip harness repair (it overwrites `rclone.conf` before asserting the first remote, never restores it, and its dated-archive and tar-name assertions cannot pass against the embedded uploader); conflicted-copy artifacts in the saves tier; the `*.bak`/transient-artifact exclusion; the boot liveness check (#7); the exit-4 LAN finding (`gpt_peer_review-r2.md`: no default route ≠ no reachable LAN remote — `check_network_link` should test the remote's host against connected routes before declaring exit 4).

---

## 9. The eleven known unknowns: resolution plans

1. **Chipset axis; loud vs silent failure.** Run `repo/docs/savestate-compat-test.md` on the bench (H700 ×2, RK3326, RK3566), **same-chipset control first**, all devices on one build, before the badge is designed (D-CLOUD-025). Under "portable": the badge is a convenience. Under "silent corruption": it is a safeguard and the cross-core toggles get destructive framing. Either way the schema carries core + build.
2. **bisync against a real remote.** The spike (§11, gate 2): loopback WebDAV, then MinIO, then Dropbox from the device; the matrix of §11. Until it runs, no code depends on bisync. Its agreement state vs ours: answered by the external-equalization fixture.
3. **The auto state as commonest conflict.** Measured by the shadow census (fork rate per kind). The wizard treats `kind: auto` as a resume-point decision regardless; the census decides whether the resume framing is the common path or a special case.
4. **The KEEP BOTH pre-pass gate.** The wizard refuses to open until the pre-pass completes and says so (kept AC). An interrupted pre-pass is marked in the apply record; the next pass re-runs it; the wizard never opens on a partial one.
5. **No shipped `es_savestates.cfg`.** #10's futro creates it *and* moves RetroArch's `savestate_directory` (two consumers, one layout — the alignment review §3.2), rehearsed on a real device first (§5.5).
6. **The core build pin.** #21 emits `/usr/share/rocknix/core-pins` at image build; ES passes emulator and core at exit; `"unknown"` when unmapped.
7. **`BACKUPPATH == RESTOREPATH`.** Assumed; the engine refuses two-way when split; one-way import writes no agreement; a warning in `cloud_sync_helper`.
8. **Standalone layouts.** The grouping table is seeded from the allowlist's special directories; the unit classifier handles them; the SRAM-rewrite experiment (§10) decides whether a state and its `.srm` are a cross-unit dependency.
9. **480×320.** Layout at 480×320 first; the recognition test decides; the single-column compare is the designed fallback.
10. **Two devices online at once.** Not enforced; `--backup-dir` recoverability plus the audit log make violations visible and survivable; the race fixture proves the recoverability; the model stays "never concurrent" with the residual stated.
11. **The round-trip suite has never run.** Repaired first (§8), then run on a GENERIC_X64 VM against **both** backends before #22 begins — never against a configured handheld — with the new steps: manifest transport, two-device both-sides-changed (pass = neither copy overwritten), churn termination, deletion receipts, wrong-clock, republication, discard exclusion, no-allowlist `RCLONEOPTS`, same-size WebDAV SRAM fork, and the manifest step from the alignment review (manifest reaches the remote; `remote_hash` null on WebDAV, non-null on S3; absent from the content tier).

---

## 10. Unknown unknowns: named failures and their cheapest experiments

- **The boot-sync vs game-session race** (now known): the zombie reproducer — §11, gate 3.
- **Rename-then-edit lineage corruption** (`gpt_peer_review-r2.md`): delete slot 1 of {1:H₁, 2:H₂}, renumber, overwrite slot 1 with H₃; inspect `replaces`. Cheapest: the exact sequence on a device; the ops journal is the fix.
- **The disjoint-member unit fork** (`gpt_peer_review-r2.md`): the two-file fixture of C6 — pure classifier test, no hardware.
- **Stale foreign manifest republished** (mine): plant a stale `manifest-<other>.json` locally, run the exit pass, assert the remote's copy unchanged.
- **Identity collision on a cloned card** (mine): clone an ID onto a second same-model device; assert the warning fires and no entries are adopted.
- **Does loading a state rewrite SRAM?** (`gpt_peer_review-r2.md` — the sharpest unasked grouping question): load a state on disposable data, hash the `.srm` before and after. Decides whether state and SRAM are one unit.
- **The wizard's cloud-screenshot fetch fails mid-open:** kill the network between queue and open; the panel must render the glyph, not hang.
- **ES's repository staleness after an external apply:** apply a KEEP BOTH, open the savestate manager without relaunching; if ghost slots appear, the apply must force a refresh. (`SaveStateRepository::refresh` exists; the manager's refresh trigger is a corpus gap — §14.)
- **Same-second dated-sibling collision between two devices:** part of the race fixture; if real, the sibling name gains the device id.

---

## 11. What must be proven on hardware before any of it is built, in order

**Gate 0 (no hardware).** Repair `tools/cloud-round-trip`. `diff LIBRETRO_CORES` across targets. The `--filter`/`--filter-from` dry run.

**Gate 1 (VM + loopback WebDAV + MinIO).** The cheap counterexamples: exit-upload-overwrites-cloud-head; same-size staged cloud change; disjoint-member unit fork; stale-receipt path reuse; three-pass churn termination; `RCLONEOPTS`-no-allowlist; conflicted-copy exclusion; `*.bak` exclusion. These eliminate wrong designs before any hardware hour is spent.

**Gate 2 (loopback → Dropbox from the H700).** The bisync spike: genuine fork under `none`; same-size edits on WebDAV; rename; deletion; external equalization after a manual resolution; unchanged filter rewrite vs actual change; interruption and `--recover`/`--resilient`; missing listings; exact pre/post names and bytes. Dry-run **and** real disposable writes.

**Gate 3 (H700).** The session-zombie reproducer on shipped code: startup sync on; boot; launch from a numbered slot inside the boot window; let the boot sync finish; exit; inventory the remote for `.bak`, the zombie auto, the extra slot; then boot-restore and observe the resume point. This characterizes the shipped loss precisely and justifies the lifecycle gate.

**Gate 4 (H700 or VM-with-ES).** ES primitive failure paths: auto-only repository → −99 observed; `copyToSlot` against an unwritable destination → reported success vs actual bytes; the ops-journal hook fires on renumber and on manager delete; repository staleness after an external apply.

**Gate 5 (H700).** Capture and the lifecycle gate: offline capture, lock-skipped capture, boot-overlap capture; manifest verified against planted states (sha256 equality, `core_build` from the pins file, honest `unknown`).

**Gate 6 (bench).** #19: same-chipset control, then cross-chipset, then core-version, then loud/silent. Gates the badge only.

**Gate 7 (two H700s).** The race fixture with `--backup-dir` (both heads preserved: one canonical, one siblinged; kill after each destructive stage) and the churn-termination and delete-propagation fixtures end-to-end.

**Gate 8 (maintainer's library).** The shadow census: the detector runs log-only; outputs fork rate per kind, verdict distribution, unknown rate, and the exit-path cost in spawns, round trips, and seconds (the D-CLOUD-035 pricing). A verdict-table bug is defined: any pass whose verdict would have overwritten or deleted a unique byte sequence. Shadow runs preserve their inputs.

**Gate 9 (RG351M).** The 480×320 recognition test with real thumbnails; the wizard press-through; `tools/vm-visual-qa` frames at 480×320 and 640×480 as the AC evidence.

---

## 12. What is not being built

- `gpt-revised_plan.md`'s protected publication batch and resolution receipts (V2, with the named trigger of §5.2) — two-phase commit machinery the one-player model does not earn on a 5-second path.
- A separate apply journal beyond the frozen plan with per-unit status.
- The full staging mirror as a default mode; separate manifest-copy spawns.
- Semantic binary merging; vector clocks; a shared database; a SQLite history index; a daemon.
- A 99-slot product cap to work around the allocator defect.
- Permanent loser memory as automatic authority — a deliberately restored file is a new version, not a stigmatized one.
- Tombstones for hypothetical external writers — receipts cover **our** recorded operations only.
- A kid/kiosk-mode resolver.
- Progress heuristics that select a winner.

---

## 13. Build order

Repair the harness (gate 0) → counterexamples (gate 1) → bisync spike (gate 2) → zombie reproducer (gate 3) → ES primitives (gate 4) → capture + gate (gate 5) → #19 bench (gate 6) → race + churn fixtures (gate 7) → shadow census (gate 8) → 480×320 (gate 9). Then: **#21 (capture) → #22 (engine: classifier, passes, receipts, transport) → #24 (checked adapter) → #23 (wizard) → #10's futro → #25's futro.** The day-one filings of §8 proceed in parallel; they are not the milestone's baggage but its bycatch.

---

## 14. `corpus.provenance.json`

```json
{
  "artifact": "kimi-round2-revised-approach.md",
  "role": "council member, round-2 revised approach",
  "corpus_mode": "verbatim embedded sources supplied by the Council Facilitator (council-facilitator@1.2.0)",
  "facilitator_manifest_read_timestamp_utc": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_rehashed_sources": false,
  "member_executed_hardware_or_tool_tests": false,
  "hash_basis": "sha256 values are those declared verified at embed time by the Facilitator; not recomputed by this member",
  "own_round1_revision_embedded": false,
  "own_round1_revision_engaged_via": "quotations in the four injected peer reviews (F1-F9, H1-H8)",
  "reviewed_artifacts": [
    "claude_peer_review-r2.md",
    "gemini_peer_review-r2.md",
    "gpt_peer_review-r2.md",
    "mistral_peer_review-r2.md"
  ],
  "reviewed_artifact_hashes_provided": false,
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
  "missing_sources_needed": [
    "rclone 1.75.0 bisync documentation or source (every bisync behaviour claim is a hypothesis until this or the spike exists)",
    "emulationstation-next SaveState.h (the makeStateFilename default), GuiSaveState.cpp (the delete/renumber call site the ops journal must hook), Paths.cpp (the hard-coded savestates root)",
    "ROCKNIX setsettings.sh and the shipped retroarch.cfg / es_systems.cfg (RetroArch's savestate_directory; the two-consumer layout question; savestate_auto_save)",
    "docs/es-ui-style-guide.md (the house rules the IA cites for dimmed controls)",
    "cloud_sync.conf.defaults and cloud_sync-rules.txt.defaults (the user-rules-first merge cannot be fully reasoned about without them)",
    "cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, tools/cloud-test-backend (the changelog's cross-tier claims cannot be checked without them)",
    "unambiguous current issue bodies for #9, #10, #21, #22, #23, #35 with the futro's added ACs (the exports do not distinguish body from first comment)",
    "kimi-revised_plan.md (this member's own round-1 revision) and the four revised plans under review"
  ],
  "missing_source_paths_and_hashes": "not supplied by the Facilitator; none fabricated"
}
```

=== END kimi-revised_plan-r2.md ===

=== START mistral-revised_plan-r2.md ===

I will build from `claude-revised_plan.md`, with specific lifts from `gpt-revised_plan.md` and `kimi-revised_plan.md`. This synthesis preserves claude's operational clarity while adopting gpt's precision on lifecycle gates and kimi's evidence discipline.

---

## 1. Architecture

### 1.1 Detection

**Manifest-based three-way reconcile** (L, C, A) is the only writer of the save tree. Bisync is demoted to a spike; its output is not trusted for classification. The detector:

- **Inputs:** union of manifests, local tree scan, `agreed.json`, `remote_hash` observations.
- **Output:** per-path verdict (identical, one-way, divergent, unknown), plus a frozen plan file for the wizard.
- **Budget:** ≤ 2 rclone spawns (listing + changed-files upload), proven on H700.

**Conflict table** (claude §3.4) is authoritative. Tombstoned deletions, provisional-agreement rows, and recorded-loser rows are all implemented. The table is lifted verbatim into #22's ACs.

### 1.2 Transport

**Manifest transport** is owned: `.rocknix/**` excluded from bulk upload; own manifest uploaded explicitly via `--files-from`. Foreign manifests may sit in the tree as read-only caches.

**Agreement** is scoped to remote + root. A credential refresh does not invalidate agreement; a remote/root change does.

### 1.3 Merge

**ES primitives** are wrapped in a checked adapter (claude §3.6). The adapter:

- Rejects −99 allocations (auto-only repository).
- Verifies `copyToSlot()` success (both state and PNG).
- Observes moves (mistral's insight) and updates placement records.
- Preserves producer provenance (gpt's `origin` field).

**KEEP BOTH** materialises the cloud version into a numbered slot with its thumbnail; the device resume point stays at `.state.auto` (gpt §4.6).

### 1.4 Safety

**Concurrency:** pre-upload check + `--backup-dir` on every overwrite + audit + anomaly report. Manual recovery is the honest contract for V1.

**Deletion:** conservative resurrection (kimi's policy). Unexplained absence fails closed; explicit player deletions propagate as tombstones with a mass-delete guard.

**Apply:** audit line → archive/discard-store copy → destructive step, per item. Interrupted applies converge on re-run.

---

## 2. Register changes

### D-CLOUD-031 (refinement)

**Schema amendment** (mistral's D-CLOUD-031-A…E):

```json
{
  "schema": 1,
  "device": { … },
  "generated_at": "…",
  "entries": {
    "path": {
      "kind": "state|auto|save|container",
      "sha256": "…",
      "size": …,
      "mtime": "…",
      "captured_at": "…",
      "captured_local": "…",
      "clock_synced": …,
      "system": "…",
      "rom": "…",
      "emulator": "…",
      "core": "…",
      "core_build": "…",
      "core_display_version": "…",
      "slot": …,
      "screenshot": "…",
      "screenshot_sha256": "…",  // gpt's binding
      "replaces": "…",
      "remote_hash": { … },
      "origin": {  // gpt's durability
        "device": "…",
        "sha256": "…",
        "captured_at": "…"
      },
      "group": "…"  // claude's unit label
    }
  }
}
```

**Rules:**

- `rom` is the matched stem under `nofileextension = true` (claude §3.2 R9).
- `screenshot_sha256` binds the displayed PNG to the chosen state version.
- `origin` preserves producer metadata separately from the publishing device.
- `group` labels coherent units (N64 pairs, VMU directories, emulator-specific layouts).

### D-CLOUD-027 (refinement)

**Retention default ON, bounded** (unanimous consensus against IA rev 4):

```
D-CLOUD-027-A: *keep discarded saves* defaults ON, with a count selector (default 3).
D-CLOUD-027-B: Discarded copies are stored under `/storage/.cache/cloud_sync/discarded/<stamp>/`.
```

### D-CLOUD-029 (withdrawal)

**D-CLOUD-029 is withdrawn** (gemini's procedural closure). The interim posture is:

- Isolated test storage.
- Disabled auto-sync toggles as a maintainer operating choice.

---

## 3. Implementation sequencing

### 3.1 Repair the harness

- **Gate 0:** `tools/cloud-round-trip` must pass end-to-end against disposable GENERIC_X64, both WebDAV and MinIO.
- **Fixes:** preserve configuration before mutation; use exact paths and destination bytes; reconcile content fixtures with the current allowlist.

### 3.2 Build the detector

- **Gate 1:** H700 timings for no changed candidates, one changed SRAM, one state + PNG, a save unit, hashless verification, unavailable network.
- **Gate 2:** Two-H700 boot-race reproducer (claude §3.7.1, gpt §4.9).

### 3.3 Build the adapter

- **Gate 3:** Auto-only allocation returns −99; `copyToSlot()` verifies success; moves update placement records.
- **Gate 4:** KEEP BOTH outcome: device resume point stays at `.state.auto`; cloud version materialises into a numbered slot with its thumbnail.

### 3.4 Build the wizard

- **Gate 5:** RG351M layout at 480×320; real thumbnails recognisable.
- **Gate 6:** Interrupted apply converges on re-run.

### 3.5 Build #10

- **Gate 7:** Real-device launch-behaviour rehearsal (gemini's gate).
- **Gate 8:** #19's bench decides badge severity (D-CLOUD-025).

---

## 4. Hardware gates

| Gate | Experiment | Owner | Pass condition |
|---|---|---|---|
| 0 | `tools/cloud-round-trip` | #35 | End-to-end pass, both backends |
| 1 | Exit-push budget | #22 | ≤ 2 spawns, ≤ 5 s on H700 |
| 2 | Boot-race reproducer | #22 | Both heads present, one canonical, one in dated sibling |
| 3 | ES primitive adapter | #24 | −99 rejected; `copyToSlot()` verified; moves observed |
| 4 | KEEP BOTH outcome | #24 | Device resume point at `.state.auto`; cloud version in numbered slot |
| 5 | RG351M layout | #23 | Thumbnails recognisable at 480×320 |
| 6 | Interrupted apply | #22 | Converges on re-run |
| 7 | #10 launch behaviour | #10 | Auto-resume and incremental-slot behaviour verified on real device |
| 8 | #19 bench | #19 | Badge severity decided |

---

## 5. What not to build

- **The one-way stopgap** (gemini §5.1, mistral §3.2) — unsafe (§2.2.1).
- **gpt's protected-publication store in V1** (§4.7) — over-earned for the accepted risk.
- **gpt's full durable transaction journal in V1** (§4.8) — keep the apply ordering and idempotent re-plan.
- **mistral's in-tree discard store** (§3.5) — wrong placement.
- **mistral's kid-mode reachability requirement** (§5) — contradicts the mode's purpose.
- **Any production role for bisync before the spike answers question zero** — all four agree.

---

## 6. Evidence discipline

Every claim is marked with the corpus source that settles it:

- **[C]** claude-revised_plan.md
- **[G]** gpt-revised_plan.md
- **[K]** kimi-revised_plan.md
- **[M]** mistral-revised_plan.md
- **[S]** embedded source file

Example:

> `getNextFreeSlot()` returns −99 for an auto-only repository [K] [S37]

The resulting document is a build contract with no unmeasured claims.

=== END mistral-revised_plan-r2.md ===

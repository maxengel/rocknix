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

=== START gpt-revised_plan-r2.md ===

# `gpt-revised_plan-r2.md`

## Recommendation

**Build a content-based reconciler with one controlled save-writing path, using rclone for transport. Do not build the wizard on an assumed “report-only” bisync mode, and do not treat ES’s existing slot functions as transactional file operations.**

The foundation should preserve the project’s existing decisions on stored-byte identity, per-device manifests, core namespacing, persistent audit, and no recency-based conflict resolution. It needs targeted refinements to capture, agreement, deletion intent, retention, and the game-exit budget.

The load-bearing design is:

1. **Capture locally after every completed session**, independently of network availability and automatic-sync settings.
2. **Separate save production from cloud transport.** Gameplay, ES’s temporary save rearrangements, capture, and cloud writes must share a save-lifecycle gate; the existing cloud lock alone is insufficient.
3. **Classify using verified local content, verified cloud content, and local last agreement.** Manifests supply provenance and operation records, not unquestionable assertions about what the cloud currently contains.
4. **Transfer only explicitly classified paths**, with non-overridable scope and ownership checks.
5. **Preserve preimages before replacement.** Use rclone’s `--backup-dir` where its relevant behavior has been established, but do not call it atomic, free, or universally safe on the strength of this corpus.
6. **Propagate only recorded, version-specific retirements**, never deletions inferred from absence.
7. **Apply a frozen, hash-bound plan.** That plan, augmented with per-unit progress, is the recovery journal; there is no second transaction database.
8. **Use a checked ES merge adapter**, including a real fix for auto-only allocation and explicit destinations for staged cloud states.
9. **Queue conflicts from unattended syncs.** Interactive sync may enter the walkthrough; boot and game-exit jobs must not seize the UI.
10. **Keep #10 in the feature drop**, but implement its layout change after the reconciliation and launch behavior have been rehearsed. A working wizard does not make an unsafe flat save namespace acceptable.

Full snapshot history, distributed coordination, semantic save merging, a shared database, and an immutable remote publication protocol are **not default V1 machinery**.

### Evidence convention

`S01`–`S42` refer to the supplied source headers and the corresponding ordered path/hash pairs in `corpus.provenance.json` below. For readability, prose citations show the portion of the declared path after `_sources/`.

- **Source-visible:** follows from the embedded implementation.
- **Decided:** established by the decision register, pending an explicit refinement where proposed.
- **Proposed:** this document’s design choice.
- **Unmeasured:** requires the named experiment.

I have no filesystem access and performed no commands, hardware tests, or independent hashing. Earlier revised-plan files were not supplied in this round; references to them identify proposals described in the injected reviews, not files I independently inspected.

---

## 1. What changed after the reviews

### 1.1 Concessions and adoptions

| Point | Disposition |
|---|---|
| Mandatory protected remote publications for every changed unit | **Withdrawn as the default V1 mechanism.** `claude_peer_review-r2.md`, `gemini_peer_review-r2.md`, and `kimi_peer_review-r2.md` make the proportionality objection correctly: this requires additional protocol and transport work on an already expensive path. That objection establishes a scope problem, not that the cheaper replacement has already been proven. |
| A separate durable transaction journal | **Removed.** Adopt `claude_peer_review-r2.md`’s formulation: the frozen apply plan, with expected operands, preserved copies, and per-unit status, is the journal. `kimi_peer_review-r2.md` is also right that restart should revalidate actual artifacts rather than trust a saved program counter. |
| Full remote staging as the normal detection mechanism | **Rejected.** Retain candidate-scoped content reads. Full content examination is a fallback for a full reconciliation on backends without a trustworthy equality signal—not the normal game-exit operation. |
| Manifest transport ownership | **Adopt the ownership rule credited to `kimi-revised_plan.md`; do not require a separate process per manifest.** Foreign manifests must never be republished, and an ordinary download must not overwrite this device’s locally updated manifest. Batch ownership-filtered transfers when the filter behavior is proven. |
| Missing allowlist and transient-file hazards | **Adopt the findings emphasized by `kimi_peer_review-r2.md` and `claude_peer_review-r2.md`.** A nonempty `RCLONEOPTS` without `--filter-from` bypasses the allowlist; `.state.auto.bak` is admitted by the shipped save patterns. These are source-visible findings, not speculative objections. |
| Explicit scope exclusions | **Adopt the discipline credited to `mistral-revised_plan.md`.** No semantic binary merge, whole-library vector clocks, occurrence identifiers for ordinary saves, or audit-log tamper-proofing. |
| “Nothing here is built” | **Keep this explicit**, as emphasized by `gemini_peer_review-r2.md` and `kimi_peer_review-r2.md`. The signed schema describes future behavior; it is not evidence of a functioning detector or agreement store. |

Sources: `repo/docs/save-manifest-schema.md` [S03]; `repo/projects/ROCKNIX/packages/network/rclone/sources/cloud_backup` [S29]; `.../cloud_restore` [S30]; `.../cloud_sync_helper` [S31]; `.../cloud_sync-rules.txt` [S32].

### 1.2 Corrections to the reviews

These matter because agreement among reviewers is not a substitute for evidence.

- **`--backup-dir` is not proven “atomic-equivalent” or zero-round-trip.**  
  `gemini_peer_review-r2.md` overstates this, and `claude_peer_review-r2.md`’s “zero extra round trips” is unsupported. The embedded uploader demonstrates use of the flag in mirror mode; it does not demonstrate concurrent replacement semantics, crash ordering, complete-unit preservation, or cost on every backend. Adding a flag need not add a process, but server-side copy or rename can still cost requests and time. [S29]

- **The protected-publication proposal was not distributed two-phase commit.**  
  `gemini_peer_review-r2.md` mislabels it. Its purpose was preservation before canonical replacement, not global atomic commitment. I nevertheless withdraw its mandatory V1 implementation for the scope reasons above.

- **The reconciler is not stateless, and this plan does not require a full staging mirror.**  
  Those descriptions in `mistral_peer_review-r2.md` are incorrect. Last agreement, pending operations, and retirement records are deliberately durable local state.

- **Exit-time renumbering is conditional, not “every exit.”**  
  `claude_peer_review-r2.md` correctly identifies an important exit-time rename path, but overgeneralizes it. `FileData` calls `onGameEnded()` only when `saveStateInfo` exists; the `racommands` branch returns early for a negative slot. A numbered-slot launch can exercise the rename trace; an arbitrary new-game or auto-resume exit need not. [S38, S41]

- **The detailed “temporary auto gets a fresh mtime” incident trace remains partly unmeasured.**  
  The temporary auto and `.bak` operations are visible. The exact copy utility’s timestamp behavior is not embedded. Test the dangerous trace; do not promote its timing assumptions to observed behavior. [S38]

- **No deletion propagation is not an adequate resolution of D-CLOUD-030.**  
  I reject the V1 recommendation in `gemini_peer_review-r2.md` and `mistral_peer_review-r2.md`. Repeatedly restoring a retired duplicate while compacting it locally does not converge. Intent-recorded retirement is needed; absence-based deletion is not.

- **A one-way upload posture is not lossless.**  
  `mistral_peer_review-r2.md` repeats a claim refuted by the embedded uploader. Disabling downloads prevents one class of local overwrite, but the exit upload can still overwrite a cloud-only version. D-CLOUD-029 stands. [S06, S29, S35]

---

## 2. Decisions that need maintainer approval

These are proposed **new refinement rows citing existing IDs**, not edits to decided rows and not newly assigned register IDs.

| Existing decision | Proposed refinement | Reason |
|---|---|---|
| **D-CLOUD-031** | Retain one per-device JSON manifest and unsynced agreement. Revise the schema to preserve immutable origin, describe complete save units, bind screenshots, record explicit operations, scope agreement to its endpoints, and establish agreement on verified equality as well as transfer. | Path-keyed latest entries and a one-step `replaces` field do not represent possession versus production, grouped saves, retirement, or bootstrap equality adequately. |
| **D-CLOUD-030** | Retain stored-byte SHA-256 identity. Limit automatic compaction to duplicate **numbered states in one game/core repository**. Record and propagate verified move/duplicate retirements so they converge. Equality alone establishes duplicate bytes, not that a particular rename occurred. | Auto resume points are not interchangeable with numbered slots; cloud copies otherwise resurrect compacted duplicates. |
| **D-CLOUD-014**, with D-CLOUD-030/031 | Ordinary backup remains non-deleting. Reconciliation may retire an exact version only following an explicit save-management action, verified move, or verified duplicate compaction, with recoverable preservation and a deletion-set guard. | This is a narrow exception for synchronization of known intent, not a return to mirror semantics. The exception should be explicit rather than hidden behind a new command name. |
| **D-CLOUD-028** | Preserve a cheap no-local-change exit path. For changed units, permit bounded correctness reads and verification; timestamps become scheduling hints, not the authority for what changed. Batch payload and owned metadata whenever possible. | “Never inspect the remote” cannot safely authorize replacement of a potentially diverged cloud version. The changed-path cost must be measured, not concealed. |
| **D-CLOUD-024**, specifically its IA rev-4 endorsement | Keep the wizard in this drop. Approve IA rev 5 with queued unattended conflicts, precise cancellation semantics, default-on bounded discard retention, and minimal native recovery. | The existing off-by-default escape hatch is weak protection against a mistaken visual choice, and the absolute “nothing transfers” wording contradicts the pre-pass. |
| **D-CLOUD-017** | **No reversal.** Core directories remain in this drop. Their implementation follows the launch rehearsal and checked writer, rather than being treated as a configuration-only prerequisite. | A clean chipset result does not repeal core isolation. Creating `es_savestates.cfg` changes launch behavior as well as directories. |

The following remain unchanged:

- **D-CLOUD-009:** reuse `cloud_device_id`; do not silently invent a new device identity.
- **D-CLOUD-025:** hardware compatibility testing determines badge severity.
- **D-CLOUD-027:** append-only, rotated, support-only audit at `/storage/.cache/log/cloud_audit.log`.
- **D-CLOUD-029:** no `--update` stopgap.
- **D-CLOUD-026:** migrations preserve content before removing originals.

Bisync’s demotion requires an explicit approach amendment and edits to #9, #22, and the IA. No standalone register row declares bisync the detector, but that does **not** make changing the maintainer’s proposed architecture a merely clerical action. [S01, S02, S06, S16, S18, S23]

**Retention count:** I propose three completed, deliberately discarded versions per save unit as an initial default. That is a new product choice—not a number specified by the IA and not borrowed from system-backup retention. Unresolved conflicts and incomplete transactions are exempt from this rolling count.

---

## 3. The foundation to build

### 3.1 One save-writing authority, with two distinct locks

The existing `take_cloud_lock` serializes cloud scripts on one device. It does not serialize them against an emulator or ES’s save-state preparation and cleanup.

The source demonstrates why that distinction is essential:

- Boot launches restore and backup in a detached shell.
- Those commands are separate; backup runs even if restore fails.
- A numbered-state launch can create a temporary auto state, an auto backup, and a provisional numbered copy.
- Cleanup and possible renumbering occur before the current exit-sync call.
- SRAM may be flushed while gameplay is active.

Sources: `.../autostart/102-cloud-saves` [S35]; `es/SaveState.cpp` [S38]; `es/FileData.cpp.launchGame-excerpt-l740-850.cpp` [S41]; `repo/docs/save-manifest-schema.md` §4 [S03].

**Proposed mechanism**

- ES owns scheduling of the startup save job. The autostart path requests work; it no longer independently restores into the live save tree.
- All entry points—boot, exit, menu, Tools, the future savestate-manager SYNC tile, and any shutdown integration—reach the same backend.
- A **save-lifecycle gate** covers launch-time temporary changes, active gameplay, final emulator writes, ES cleanup, renumbering, and capture.
- Cloud downloads, compaction, re-slotting, and apply operations may modify the live tree only while that gate is available.
- Uploading an already sealed, immutable local staging copy may continue during gameplay.

**Lock order**

1. A network worker takes the cloud lock non-blockingly.
2. It takes the lifecycle gate non-blockingly only for a short snapshot or local commit.
3. It does not hold the lifecycle gate across network waits.
4. ES’s game session holds the lifecycle gate, performs local capture, releases it, and only then requests cloud work.
5. Capture never waits for the cloud lock.

This prevents a session from blocking on a network worker that is itself waiting for the session. The exact ownership mechanism must also survive ES dying while an emulator remains alive; that is a required failure test, not an assumption that `flock` alone settles.

### 3.2 Capture is unconditional local work

Capture runs after the session’s save lifecycle has stabilized, including ES cleanup, whether:

- automatic game-exit sync is disabled;
- the network is absent;
- another cloud operation is running;
- the emulator exited unsuccessfully.

Putting capture inside the present sync condition misses offline and skipped sessions—the sessions most likely to produce later forks. [S29, S41]

Capture receives the **actual launch context**, after save-state launch adjustments: game identity, system, resolved emulator, and the core actually selected for execution. Calling `getCore(true)` at exit is not a general substitute once `setupSaveState()` can rewrite the launch command. [S38, S39, S42]

Capture must:

- hash the known save units for the played game regardless of their mtimes;
- recognize ES’s recorded moves rather than attribute them as new production;
- exclude temporary auto backups and provisional launch artifacts;
- retain provenance for unchanged imported bytes;
- distinguish “observed here” from “produced here”;
- write only when content, placement, or meaningful metadata changes;
- never rewrite the manifest merely to refresh `generated_at`.

For standalone emulators, a ROM-name filter is insufficient. Use measured layout adapters. Files outside a known adapter may be inventoried and hashed as unknown; they must not all be attributed to whichever game just exited. [S03, S06 D-CLOUD-028, S22, S29]

The core-pins artifact is emitted at image build from the effective package configuration. Unknown mappings remain unknown. The pin is useful comparison data, **not proof** that two builds serialize identically. [S03 §9, S04, S15]

### 3.3 Keep the manifest shape; fix its semantics

Retain:

- `savestates/.rocknix/manifest-<device-id>.json`;
- one writer per manifest;
- path-relative entries;
- stored-byte SHA-256;
- local, unsynced agreement.

Do not add SQLite.

The minimum schema refinement is:

| Record | Required meaning |
|---|---|
| **Origin** | The device/model, emulator/core/build, and capture facts of the producer of these bytes. Copying or re-slotting preserves this object. Unknown stays unknown. |
| **Possession / placement** | This device currently holds a version at this path. Recording possession does not claim authorship. |
| **Save unit** | A complete member set captured at a coherent generation, with each member’s path and hash. A single SRAM or state is a simple unit; a multi-file save is a larger one. |
| **Screenshot binding** | The observed PNG path and its SHA-256, associated with the state version. This prevents stale transport pairing; it does not magically prove that an emulator generated the image contemporaneously. |
| **Operation record** | An explicit move, delete, duplicate retirement, or completed resolution, bound to exact input hashes and output locations. |
| **Generation / parent observation** | Enough information to distinguish a new own-manifest generation from an unacknowledged foreign rewrite of the same device file. No clock-based last-writer-wins rule. |

A shared VMU or memory-card container can have `rom: null`. Do not invent one game’s name for a file that serves several games.

Also distinguish:

- the ROM filename/path ES launched;
- the repository’s filename-derived matching key.

With `nofileextension=true`, ES commonly matches the ROM stem. The schema’s recorded launch filename can remain useful without pretending it is the discovery regex’s key. [S03, S37, S39]

**Why origin must be carried:** looking up provenance by hash across current manifests is a useful fallback, but not durable. The producer can overwrite its own latest path entry; without origin copied into a holder’s entry, imported versions then lose their provenance. This adopts the point supported by `kimi_peer_review-r2.md`.

**Validation rules**

- Reject traversal, absolute member paths, paths escaping the configured root, and unsafe symlink destinations.
- Reject contradictory membership and incomplete grouped units.
- Unsupported schema or malformed JSON is not an empty manifest.
- Unknown provenance does not mean unknown content: bytes can still be hashed.
- Unusable control metadata must not authorize destructive operations. Preserve the bytes and report a retryable metadata problem.
- Limits on manifest size, entries, group members, and thumbnail decoding must prevent a malformed remote file from exhausting the handheld.

### 3.4 Manifest transport is ownership-aware

The shipped allowlist would carry every manifest under `savestates/`. Bulk copy does not enforce the rule “each device writes only its own.” [S29, S30, S32]

Therefore:

- Upload only this device’s manifest from the metadata namespace.
- Ordinary downloads exclude this device’s manifest from replacement.
- Foreign manifests are downloaded as validated, read-only observations; they are never uploaded by their readers.
- Publish payload and the owned manifest in the same batch when the tested filter interface permits it.
- A manifest describing locally captured bytes is not a promise that those bytes already occupy the canonical cloud path.

The preferred implementation is exact file selection and ownership filters inside existing batches—not one rclone process per metadata file. If the relevant filter ordering or exact-path interface cannot express that safely, correctness wins over a claimed process budget; the measured extra batch is exposed under the D-CLOUD-028 refinement.

**Reflash special case**

A genuinely new device has no own cloud manifest. A reflash may regenerate an existing device identity, including its prior naming behavior. Its previous manifest must be read and reconciled before an own-manifest replacement, **but local capture must not wait for the network**. Keep new offline observations locally until bootstrap reconciliation can combine them honestly. [S03, S04, S34]

A same-ID manifest fork is not resolved by time or generation number alone. It can indicate a cloned card or stale own-file publication. Preserve both observations and refuse blind own-manifest replacement. The corpus does not supply a complete identity-collision detector; the cloned-card experiment is mandatory.

---

## 4. Classification, deletion, and resolution

### 4.1 Agreement is a scoped observation

Agreement means:

> At a verified reconciliation point, this device and this cloud destination held this version of this save unit.

It is not a last-run stamp and not an upload-success return code.

Bind it to:

- the selected remote’s storage identity and relevant endpoint/root configuration;
- the canonical cloud save prefix;
- the local root and storage identity;
- the unit’s complete member set;
- the verified content version.

Credential refresh should not invalidate agreement merely because a token changed. Changing a bucket, endpoint, cloud folder, local card, or save root must not silently reuse the old conversation.

Write agreement:

- after verified upload;
- after verified download;
- after verified equality with no transfer;
- after verified completion of a recorded operation.

Equality-establishes-agreement is necessary for first run, repaired state, and reflash. The current schema omits it. [S03 §§2–3, S33]

### 4.2 The classifier

For a coherent unit, let **L** be local content, **C** cloud content, and **A** last agreement. “Absent” below means absence established by a complete, successful observation—not a failed listing or missing mount.

Operation records are evaluated before a generic equality or one-way branch.

| Situation | Action |
|---|---|
| Root, listing, content identity, or required unit membership cannot be established | Preserve; mark pending/error. No destructive action. |
| A valid pending move/retirement record applies to exact version X, and its required preservation/destination checks pass | Complete that operation idempotently. |
| A retirement for X encounters Y at a relevant path | Conflict or stale operation; never treat the record as permission to remove Y. |
| A completed resolution applies to the exact observed versions | Reconcile to its verified outputs, preserving displaced copies. |
| Two resolution records choose different outputs for the same unresolved pair | Ask; no timestamp or device-priority winner. |
| L = C, with no outstanding operation changing that result | Establish/refresh agreement; transfer nothing. |
| L ≠ C, L = A | Cloud changed; verified, preimage-preserving download. |
| L ≠ C, C = A | Device changed; verified, preimage-preserving upload. |
| L ≠ C, both differ from A | Genuine conflict. |
| L ≠ C, A unknown | Conservative conflict. |
| Only one side exists, no agreement or retirement establishes a prior shared version | One-way addition after root and unit checks. |
| A previously agreed version is unexpectedly absent on one side, with no applicable operation record | Hold the surviving version; do not infer deletion and do not automatically resurrect indefinitely. Surface an incomplete reconciliation. |
| Both sides are absent | Clear obsolete agreement only after validating the roots and outstanding operation state. Absence alone creates no global delete instruction. |

The schema’s “only one side → transfer” rule therefore remains valid for additions, but not as a universal answer to previously agreed data disappearing. [S03]

A “pending” count must not inflate the wizard’s count of genuine forks. Connection, metadata, and storage problems are distinct outcomes.

### 4.3 Version-specific retirement belongs in V1

The concrete convergence requirement is simple:

1. Cloud has a state at slot 5.
2. A device imports it and later performs a legitimate ES renumber to slot 3.
3. Both paths can then exist in the cloud.
4. Local compaction alone removes slot 5.
5. A rule that always restores cloud-only paths brings slot 5 back forever.

That is incompatible with a useful implementation of D-CLOUD-030. The exact exit path must be tested, but the synchronization loop itself follows from the proposed rules.

**V1 retirement records are produced only by:**

- an explicit save-management delete action whose synced-library effect is made clear;
- a verified ES move/renumber;
- verified duplicate compaction.

They are **not** produced by a directory scan noticing a missing file.

For a move, the recorded destination becomes canonical only after the same version is verified there. If another version occupies that destination, do not overwrite it to satisfy the move. Concurrent equivalent placements can be compacted using D-CLOUD-030’s lower-numbered-copy rule, once every relevant version is preserved.

For a deletion, the record names the exact version the user removed. A remote edit is a delete/edit conflict, not collateral permission.

Every retirement:

- has an idempotent operation identity;
- requires successful artifact checks;
- preserves required bytes before removing a live name;
- is subject to an unexpected-deletion-set guard;
- is audited before the destructive step and recorded as complete afterwards.

Do not expire these records merely because the discard-retention count rolled over. An offline handheld must still learn why an old path was retired. V1 may retain these small records without automatic garbage collection; reaching a control-state limit should stop mutation rather than silently discard correctness state.

### 4.4 Keep a narrow resolution receipt

I retain this part of V1, agreeing with `kimi_peer_review-r2.md` and disagreeing with its deferral in `claude_peer_review-r2.md`.

The sequential reversal requires no concurrent gameplay:

- A and B diverge from X.
- A chooses A’s version.
- B later chooses B’s version.
- A’s next ordinary three-way pass can interpret B as a one-sided cloud change and silently reverse A’s choice.

An audit line alone cannot prevent that.

A receipt records the exact operand hashes and chosen output locations. It is not a vector clock or a general lineage database. Its purpose is to distinguish:

- application of the same completed choice on another device;
- resurrection of a specifically rejected version;
- a later genuinely new version;
- an explicit conflicting choice.

A newly confirmed reversal names the prior decision it supersedes. Old choices do not permanently veto later player intent, and dates do not resolve contradictory decisions.

---

## 5. Learning C without turning every exit into a full restore

### 5.1 Equality evidence

Use the backend’s native hash as a shortcut only when it has a **content-verified association** with the stored-byte SHA-256 for the same remote context.

Otherwise, fetch the relevant bytes into fresh or explicitly refreshed staging and hash them.

In particular:

- Size is a useful inequality check, not equality proof.
- Mtime is a useful scheduling hint, not equality proof.
- Hashless **with modtime** still cannot certify a preserved-mtime change.
- Hashless **without modtime**, as on the QA WebDAV, cannot safely reuse a size-only staging copy.
- A successful copy command that skipped stale staged bytes is not a content observation.

This is stricter than the hashless-and-no-modtime-only fallback suggested in `claude_peer_review-r2.md`. Its candidate-scoped principle is correct; its proposed equality boundary is not sufficient for the preserved-mtime fixture.

Sources: `repo/docs/save-manifest-schema.md` [S03]; `repo/docs/save-manifest-alignment-review.md` [S04]; `repo/.claude/rules/engineering-practices.md` [S10]; `.../cloud_backup` [S29].

On a **full** reconciliation, a backend without a usable content token may require reading every overlapping candidate unit. Do that in bounded batches, not by maintaining an unquestioned second full-library mirror.

### 5.2 The concrete game-exit path

1. **Capture locally**, as specified above.
2. If no content, placement, or meaningful owned metadata changed, perform no remote work for the exit push. Say **“No new saves to upload”**, not “The cloud is fully in sync.”
3. If automatic exit sync is disabled, stop after capture.
4. If the relevant remote is definitely unreachable locally, retain pending work and return promptly.
5. Take the cloud lock; obtain or use a sealed snapshot of the changed units.
6. Read cloud evidence for those units and the control records needed to classify them.
7. Upload only device-changed or safely new units. Conflicts and uncertain comparisons remain pending.
8. Batch the owned manifest with authorized payload where supported.
9. Verify the destination artifacts.
10. Advance agreement only for verified units. Preserve dirty state for anything not verified.

A non-overwrite option can help protect a normal first-addition case, but it must not be described as cross-device compare-and-swap. The concurrent first-create fixture remains part of the preservation test.

**Budget**

The no-local-change path should be no worse than the corpus’s approximately five-second H700 baseline and should avoid the rclone startup entirely when possible. The changed path may require an evidence batch, a transfer batch, and a verification batch; hashless or uncached cases can require more work.

I do not claim an unmeasured “two-spawn maximum.” Measure:

- one changed SRAM;
- one state plus PNG;
- five foreign manifests;
- warm and cold metadata caches;
- native-hash and hashless backends.

Do not add a standalone post-upload listing merely to fill `remote_hash` in the just-uploaded manifest. Keep verified observations locally and publish them on the next natural metadata update. A manifest with `remote_hash: null` is valid.

If work cannot complete within the approved interaction budget, leave it pending and say so. Do not recover the budget by skipping content verification or calling a queued save “uploaded.” [S03, S04, S06 D-CLOUD-028, S09]

### 5.3 No default route is not definitive “no network”

The current uploader returns exit 4 when there is no default route. A directly connected LAN remote can still be reachable. [S29]

The successor may use a cheap local test when it can establish that the selected remote has no usable path. Uncertainty should lead to a bounded real operation or a truthful pending outcome—not a false assertion that no network exists.

The LAN-only test must be run before inheriting the present skip behavior.

---

## 6. Replacement safety and the concurrency contract

### 6.1 The chosen V1 mechanism

**Use archive-before-replace, not a mandatory protected-publication protocol.**

For an authorized transfer:

- the source is sealed;
- expected destination content is recorded;
- the destination is revalidated as close to replacement as the transport permits;
- displaced bytes are preserved;
- the resulting artifact is verified;
- agreement is written last.

Use:

- a reserved remote sibling of the save payload for remote preimages;
- `/storage/.cache/cloud_sync/discarded/` for local retained copies;
- unique device/transaction components, not a timestamp alone.

The remote archive must be outside the synchronized payload and must be proven compatible with the configured remote-root shape. The design must not quietly relocate the player’s cloud folder to make an archive flag work.

`--backup-dir` is the preferred transport mechanism for preserving remote replacements when its behavior is established. Local replacements can use the same facility where applicable or the checked local commit machinery.

### 6.2 What this does—and does not—guarantee

The source corpus supports rclone’s existing archive use in one uploader mode. It does **not** establish all of the following:

- preservation when two writers both observed an absent destination;
- preservation when an intervening writer changes the destination after the precheck;
- behavior when killed between archival and replacement;
- atomic preservation of a multi-file unit;
- the safety of retrying a partially completed remote move;
- zero additional latency.

These are mandatory capability tests, not claims to repeat.

**Accepted V1 contract:** under the project’s single-player handoff model, operations preserve verified preimages and complete save units, fail closed on observed changes, and make unexpected overlap recoverable where the tested transport mechanism supports that property.

**Not claimed:** linearizable synchronization or an unconditional all-backend guarantee against arbitrary overlapping writers.

If that stronger guarantee is required, non-overwriting protected publications become load-bearing and their cost must be approved. Consensus that they are expensive cannot make the guarantee free.

### 6.3 Outcome of the preservation gate

- **Mechanism passes, with understood semantics:** enable the tested archive-before-replace path.
- **Mechanism is unsupported or remains ambiguous:** allow observation and safe local staging, but do not enable canonical replacement on that path.
- **A test loses an unreviewed competing head or produces an unrecoverable unit:** stop activation. Either adopt a measured, narrowly scoped protected-publication design or narrow automatic support. Never fall back to unchecked copy.

Archive anomalies must create a pending recovery item. A record saying what the worker *expected* to archive is not evidence of what it actually preserved.

Unreviewed competing heads and incomplete transactions are never automatically pruned by the ordinary discard count. If preservation space is exhausted, the operation stops; it does not evict the only unresolved copy.

---

## 7. Merge and interrupted apply

### 7.1 The checked merge contract

The following are source-visible:

- Auto-only repositories can fall through `getNextFreeSlot()` to `-99`.
- The allocator reads cached repository state.
- `copyToSlot()` ignores the copy/rename return values.
- Explicit full-path filename generation uses the source’s parent directory.
- Standalone emulator states are not generally supported by the current repository’s `isEnabled()` check.

Sources: `es/SaveStateRepository.cpp` [S37]; `es/SaveState.cpp` [S38]. The relevant header default arguments are not embedded.

The adapter must satisfy these acceptance criteria:

1. **Correct repository:** allocate within the intended game/core configuration. An unsupported standalone state does not gain KEEP BOTH merely because it has a state-like extension.
2. **Fresh occupancy:** refresh before planning; account for every relevant cloud-only state and every slot reserved earlier in the same plan.
3. **Correct empty/auto-only behavior:** when no numbered state exists, allocate from `firstslot`. Fix the allocator; do not invent a 99-slot product cap.
4. **Explicit destination:** compute the live destination from the repository configuration, not from a temporary download’s parent.
5. **No overwrite during allocation:** verify local and cloud destination availability again before commit. A changed destination invalidates the plan.
6. **Verified state/PNG pair:** copy with checked results, verify hashes and expected paths, and preserve the original until the operation is durable.
7. **Defined auto KEEP BOTH result:** the device resume point remains at `.state.auto`; the cloud resume point becomes a numbered state with its PNG. The plan explicitly shows which resume point will remain canonical and how both versions will exist on both sides.
8. **Idempotent recovery:** a failed or repeated apply cannot allocate a second copy merely because the first attempt’s status update was interrupted.

Automatic duplicate compaction never collapses an auto resume point into a numbered state. Different games, cores, or save containers are not deduplicated merely because their bytes happen to match.

### 7.2 The pre-pass gate

Before the walkthrough becomes actionable:

- reconcile independent non-conflicts;
- download and represent the cloud-only numbered states needed to establish slot occupancy;
- validate complete units;
- freeze the conflict operands, destination reservations, and relevant cloud observations.

If that pre-pass is interrupted or incomplete, do not open a wizard that offers an unsafe KEEP BOTH.

The pre-pass is necessary, not sufficient: another device can change the cloud while the player is deciding. COMPLETE must revalidate the inputs and destinations. A changed plan is refreshed rather than applied against stale assumptions.

A state and an SRAM file are not assumed independent merely because they are different files. The state-load/SRAM experiment determines whether related decisions need to be held together.

### 7.3 One frozen plan doubles as the journal

The plan records:

- transaction identity and endpoint context;
- exact unit inputs;
- chosen outcomes;
- intended destinations;
- locations and hashes of retained copies;
- per-unit stage;
- outstanding verification and agreement updates.

Before COMPLETE, choices are disposable. After COMPLETE starts mutation, recovery uses this plan until all affected units are coherent.

Local temporary files must be created on the destination filesystem when atomic rename is required. A state and PNG are not an atomic pair; a populated directory generally cannot be assumed replaceable atomically; cloud directory rename is not a generic multi-object transaction.

Therefore:

- stage and verify all members;
- preserve preimages;
- commit in an order defined for that unit;
- block access to an incomplete live unit;
- verify the resulting unit;
- write agreement last.

After a crash, inspect actual hashes and membership. If the unit is fully old, fully new, or safely repairable from retained copies, complete or roll it back idempotently. Otherwise keep it unavailable for mutation and present native recovery. Do not discard the plan simply because a fresh scan produced another plausible classification.

The audit log remains the human-readable record, not the transaction authority. Its rotation cannot erase recovery state. [S06 D-CLOUD-027, S10, S11]

---

## 8. Presentation and recovery

Retain the settled presentation choices:

- system → game walkthrough;
- cloud always left;
- screenshot for a state, save glyph for an in-game save;
- device/model, date/time, and emulator/core/build where known;
- no file size or play-time heuristic;
- KEEP LEFT / KEEP RIGHT / KEEP BOTH;
- KEEP BOTH disabled with a reason where unsupported;
- optional review before applying.

Sources: `repo/docs/conflict-wizard-ia.md` [S02]; `repo/.claude/rules/es-native-ui.md` [S12]; `issues/issue-23.md` [S24].

### Triggering

- **Interactive SYNC:** after a successful pre-pass, enter the walkthrough as part of that operation.
- **Boot/game exit:** record pending conflicts and report them on the existing status surface. A persistent cloud-settings entry opens the walkthrough.
- **Kid/kiosk mode:** preserve divergent data and retain pending state. Resolution may require unlocking the full UI; do not add a destructive configuration surface solely to bypass the mode’s design. [S13]

### Cancellation wording

Adopt the precise statement identified in `claude_peer_review-r2.md`:

> Before COMPLETE, no conflicting save or its dependent files are changed on either side. Quitting discards the pending decisions. Independently reconciled files from the completed pre-pass remain synced.

Staging cloud bytes for comparison is permitted; replacing a conflicting live save before COMPLETE is not.

### Retention and recovery

“Keep discarded saves” defaults on under the proposed refinement. Its count limits completed, deliberately discarded versions—not transaction preimages still needed for correctness.

Turning it off does not disable crash safety. It permits disposal of an explicitly rejected version only after the selected outcome has been safely applied.

V1 needs a minimal native recovery route for retained decisions and detected archival anomalies, reusing the same comparison/apply machinery. A directory of bytes recoverable only through SSH is not a complete console-first escape hatch.

The broad #25 timeline, arbitrary historical snapshots, and full rollback browser remain V2.

### Honest outcomes

Replace raw rclone status forwarding with typed backend outcomes:

- no local changes;
- completed and verified;
- skipped because another operation owns the lock;
- skipped because the remote is definitely unreachable locally;
- conflicts pending;
- partially completed/pending verification;
- failed.

The existing collision is real: rclone’s 3/4 can pass through script `clean_exit`, write stamps, and be displayed as friendly skips by `ThreadedCloudSync`. Both scripts also return the saves-phase status even when the system phase failed. [S29, S30, S40]

Keep rclone’s raw code in diagnostics, not in the UI protocol. A success stamp must name the operation actually verified.

---

## 9. Namespace, scope, and cutover

### 9.1 #10 stays in the drop

I reject deferring physical core isolation beyond the feature drop merely because the wizard can read a `core` field.

A flat shared filename can collide **before the cloud engine sees it**. Metadata cannot recover a state already overwritten locally by another core. D-CLOUD-017 remains justified.

However, shipping `es_savestates.cfg` is not a harmless path substitution:

- `Default()` enables `racommands`, auto-save, and incremental behavior.
- The XML parser hard-codes `racommands=false`.
- Auto-save and incremental defaults differ.
- Core/emulator command rewriting becomes relevant.

These are source-visible behavior changes. [S38, S39]

The implementation must prove:

1. ES discovers both existing flat states and new core-specific states.
2. RetroArch writes where ES looks.
3. New-game, numbered-state, and auto-resume launches retain intended semantics.
4. Actual launched-core provenance remains accurate.
5. Unknown legacy provenance is not silently assigned to the default core.
6. Interrupted materialization and downgrade/mixed-reader cases preserve old data.

If the XML path cannot preserve behavior, change the appropriate resolver/configuration behavior deliberately; do not ship a naive config because the directory template exists.

A passing chipset test narrows compatibility warnings. It does **not** make #10 unnecessary, despite that stale conclusion in the bench document. [S06 D-CLOUD-017/025, S08]

### 9.2 Enforce scope at the transport boundary

The new engine must not inherit arbitrary `RCLONEOPTS`, `BACKUPMETHOD`, or a mutable filter file as its safety policy.

The embedded configuration contains `--delete-excluded`; each existing script strips it independently. A new consumer can inherit it. User rules are placed ahead of defaults, so a defaults-file exclusion is not unconditional. [S29–S33]

Use:

- a fixed maximum save scope;
- user selection only to narrow that scope;
- exact planned paths;
- mandatory exclusions for internal state, transients, foreign-conflict artifacts, and non-save tiers;
- an assertion that effective restrictions are present before every transport operation.

State thumbnails belong to their state unit. Ordinary screenshots must not be mistaken for state evidence. Their collisions can be preserved separately without introducing a recency exception into save resolution.

The discard store remains outside the sync root. If #25 later adds an in-tree snapshot layout, its exclusion must be enforced at the actual transfer boundary, not merely inserted into defaults.

### 9.3 Unequal backup and restore roots

The shipped configuration documents a different restore root as a way to avoid replacing live data. [S33]

Therefore:

- two-way reconciliation requires compatible, explicit endpoint roots;
- an alternate restore root remains an **import destination**;
- import does not write agreement for the live save tree;
- import does not overwrite differing pre-existing destination data without preservation and a decision.

Do not silently rewrite this setting and do not reject all downloads merely because the two-way engine cannot model it.

### 9.4 Migration and old writers

D-CLOUD-029 remains binding until #22 replaces the paths. The honest development posture is isolated test storage and, if the maintainer chooses, disabling automatic sync on live libraries. Keeping only exit upload is not a no-loss guarantee.

Cut over in stages:

1. Build capture and observe locally.
2. Run the classifier in read-only shadow mode.
3. Enable the guarded exit push.
4. Route startup, menu, Tools, and savestate-manager operations through the same backend.
5. Enable the walkthrough and checked merge.
6. Complete and validate #10.
7. Activate the feature only after the end-to-end gates pass.

Before activation, inventory every caller and re-home its guards, settings, cadence, and stamps. Preserve the two user workflows affirmed by D-UI-018/020 rather than deleting “duplicate” surfaces again. [S06, S07, S10, S13]

A new device cannot stop an old binary on another device from running its old overwrite. The initial maintainer rollout must therefore update or disable old writers deliberately. This plan does not claim mixed-version writer safety merely because new readers understand old files.

---

## 10. Proof order

### 10.1 Before production implementation: substrate experiments

Test fixtures and instrumented test builds are permitted here. They are not an excuse to implement the production wizard before its assumptions are checked.

| Gate | Experiment and artifact | Where | What it gates |
|---|---|---|---|
| **P0 — Safe test channel** | Repair the round-trip runner; preserve/restore configuration in cleanup; validate the destination before replacing configuration; fix dated-archive expectations; create the tar artifact it tests; use valid content-system fixtures; preserve complete command output. Run baseline scenarios with explicit expected failures. | Disposable GENERIC_X64 VM; loopback WebDAV and MinIO | Every destructive experiment; #22 implementation |
| **P1 — Actual save lifecycle** | Numbered launch, auto launch, new-game launch; capture directory contents and hashes before/during/after. Introduce a delayed boot sync. Test `.auto.bak`, provisional slots, SRAM changes, and cleanup. Exercise auto-only allocation and a failed destination copy. | RG35XX SP on disposable data; second H700 where useful | Lifecycle gate, capture placement, #24 |
| **P2 — rclone contract** | Run the bisync and targeted-copy matrix below, including archive-before-replace and interrupted verification. Preserve raw output, resulting bytes, and workdir state. | VM/WebDAV/MinIO first; then H700/Dropbox; two H700s for overlap | Transport selection, deletion/retention mechanism, changed-path budget |
| **P3 — Launch/layout and save-unit inventory** | Rehearse core-directory changes; record actual launch commands and write locations. Inventory standalone save membership. Test state loading followed by SRAM flush. Check effective core/package pins and mapping exceptions. | H700 first; relevant second target and standalone emulators | #21, unit boundaries, #10 |
| **P4 — Compatibility** | Same-build, same-core H700 control first; then directed cross-family pairs, another core, a core-version mismatch where available, and controlled corruption. Observe continued behavior, not only initial load success. | H700 pair, RG351M, RG353M, as availability is confirmed | Badge severity; compatibility claims |
| **P5 — Cost and recognition** | Measure local hashing and candidate-scoped transport on a copy of the actual library. Display real cloud/device thumbnails, long labels, unknown metadata, and the auto-resume choice at both panel sizes. | H700 and physical RG351M | D-CLOUD-028 refinement, #23 layout |

The facilitator’s corpus reports the broader bench; it does not establish present physical availability. If a device or second core build is unavailable, record the missing test rather than declaring that axis settled.

### 10.2 Bisync’s decision gate

The matrix includes:

- compressed state plus PNG;
- equal-size SRAM changes;
- preserved-mtime changes;
- cloud-only and device-only additions;
- device rename and compaction;
- explicit deletion and unexplained absence;
- a genuine fork;
- first run;
- filter/root change;
- interrupted run;
- external manual equalization after a resolution;
- another device modifying the remote between observations.

Question zero is: **what does `--conflict-resolve none` actually do to payload names and bytes?**

Also establish:

- whether a supported, machine-readable plan can be consumed;
- whether external resolutions can be accepted without unsafe reinitialization;
- what `--recover` and `--resilient` actually recover;
- whether any automatic `--resync` would be needed;
- whether internal listing state can disagree with the authoritative agreement record;
- total measured cost.

**Outcome**

- If bisync satisfies the contract and materially simplifies full-pass transport, it may be adopted behind the classifier.
- If it mutates conflict paths, relies on unsafe reinitialization, cannot accept external apply coherently, or is too expensive, use targeted rclone copies.
- In neither case does bisync become an unexamined second authority.
- No production error handler invokes `--resync` automatically.

The corpus contains no upstream 1.75.0 implementation, authoritative documentation, or roadmap. I therefore make no claim about what a future release will fix. The same conformance matrix should gate future adoption. [S01, S05, S16, S23]

### 10.3 Before activation: behavior gates

After implementation:

1. **Shadow census:** record verified verdicts, pending reasons, auto/numbered/save frequencies, unknown provenance, and timing. Inject known positives and negatives; classify a disagreement as a bug when the result differs from the verified three-way/operation table.
2. **Fault campaign:** interrupt each local and remote apply stage, fill storage, fail PNG writes, corrupt a manifest, change a destination during the walkthrough, and replay pending operations.
3. **Whole-entry-point test:** boot, exit, upload, download, sync, bundle transfer, and savestate-manager sync all preserve constructed forks.
4. **Cross-device convergence:** resolve, sync the other handheld, sync both again; no duplicate resurrection, rejected-version reversal, or repeated allocation.
5. **Populated upgrade and clean install:** actual prior state, custom filters, alternate roots, old manifests, and core-layout transitions.
6. **Hardware end-to-end:** pass before upstream publication under D-QA-001.

The round-trip harness is not currently evidence of these behaviors. Its embedded implementation overwrites `rclone.conf` before checking the remote and does not restore it; several fixture expectations no longer match the uploader. Run it only after P0, never against the maintainer’s configured handheld as supplied. [S27, S36]

---

## 11. Closure plan for all eleven known unknowns

| Known unknown | Measurement and device | Decision / required point |
|---|---|---|
| **1. Chipset compatibility and silent failure** | P4: H700 control, then same-build cross-family runs and continued execution; corruption and version tests separately | Badge severity before #23 badge design. A passing sample is per-core evidence, not a universal compatibility theorem. |
| **2. Bisync, listings, interruptions, and duplicate agreement state** | P2’s raw-output/workdir/content matrix on VM backends and H700/Dropbox | Before choosing a production bisync role in #22. Targeted copies remain the safe implementation path if its contract fails. |
| **3. Auto-state conflict frequency** | P1 lifecycle traces plus shadow census segmented by launch type | Label autos as resume points, but do not assume they are written or retained on every exit. Tune presentation after observation. |
| **4. KEEP BOTH pre-pass and interruption** | Import a high cloud-only slot; interrupt pre-pass; introduce another cloud slot while the walkthrough is open; apply and sync twice | #24 and #23 cannot activate until allocation and revalidation pass. |
| **5. Missing `es_savestates.cfg`, two layout consumers** | P3 actual discovery, launch, write, resume, and cleanup traces on H700 | Before #10 implementation is committed to the XML approach; before release. |
| **6. Core pin and actual launched core** | Diff effective package/core sets; inspect emitted image artifact; run default and overridden-core launches | Before #21 is considered accurate. Unknown is allowed; misattribution is not. |
| **7. `BACKUPPATH == RESTOREPATH`** | VM fixture with split roots, cloud-folder change, remount, and restored agreement | Two-way refuses mismatched contexts; import remains available without live agreement. |
| **8. Multi-file standalone saves** | Stable member/hashing inventory for PPSSPP, VMU, N64, and PSX cases; interrupt member transfer; state-load/SRAM test | Before enabling automatic writes for that adapter. Unknown grouping remains pending, not file-by-file “success.” |
| **9. 480×320 recognition** | P5 physical RG351M recognition task with real examples, unknown data, and long source labels | Before #23 layout acceptance. Add a full-image inspection affordance if necessary; do not silently abandon the fixed cloud-left comparison. |
| **10. Two devices online** | P2 simultaneous first-create, replacement, delayed writer, contradictory resolution, and kill-stage tests | Enable only the preservation contract the mechanism supports. No claim of distributed locking. |
| **11. Never-run suite** | P0 corrected runner, then both backends and added artifact-based cases | Before #22 production work and again before activation. Step count is not coverage evidence. |

---

## 12. Additional failures worth exposing cheaply

These are hypotheses or source-derived hazards not settled by the existing acceptance claims.

| Failure | Cheapest revealing experiment | Required response |
|---|---|---|
| Archive names collide because two devices share a timestamp or wrong clock | Same-second replacements from both H700s with skewed clocks | Device/transaction-unique archive names; no clock-based uniqueness assumption |
| Native archive operation is copy/delete, not an indivisible move | Interrupt archive/replacement at each stage on the actual backend | Preserve and verify; disable unsupported destructive path |
| Screenshot is old although its recorded hash is valid | Delay or suppress PNG production while changing a state | Treat binding as observed pairing, not semantic proof; show a missing/untrusted image rather than a misleading substitute |
| Complete group cannot be reconstructed from stale manifest union | Different member sets from two device generations, plus an unmanifested member | Capture explicit coherent membership; no union of incompatible generations |
| A legitimate save unit includes an excluded database | Plant a grouped unit whose required member is excluded by the default database rules | Mark incomplete and investigate a safe adapter; never silently omit the member |
| Case-folding or Unicode normalization aliases distinct paths | Two names distinct locally but potentially equivalent remotely | Refuse collision; no overwrite or fabricated identity match |
| Same ROM basename in different directories/core repositories is paired incorrectly | Two different games or revisions with the same basename | Use actual launch identity and repository scope; do not merge by basename alone |
| Save root is present but is the wrong mounted card | Swap/unmount the save card while retaining agreement | Root/storage binding; absence cannot authorize retirement |
| An empty or partial remote listing looks like a clean library | Fail authentication/listing mid-pass; use a definitely nonexistent prefix | Typed unknown/error, not “nothing there” |
| A cloned card creates two writers of one manifest | Copy the stored device identity to the second test device and diverge | Preserve the manifest fork and refuse blind own-file publication |
| ES crashes while its emulator continues | Kill ES during gameplay, then request a cloud restore | Lifecycle protection must cover the surviving emulator |
| A core pin is unchanged while a patch or option affects serialization | Compare effective build inputs; exercise selected state-affecting settings | “Same pin” remains compatibility evidence, not a guaranteed-safe badge |
| Guard omitted by nonempty custom options or overridden includes | Remove `--filter-from`; add a broad user include; plant ROM and transient controls | Mandatory transport scope must still exclude them |
| Remote path or JSON member escapes the staging/live root | Malformed-path and symlink fixture | Validation fails closed before any write |

The test store, retained bytes, and pending plans are **not disposable caches**, despite residing below `/storage/.cache/`. Schema rebuilding may replace an index or agreement file; it must never recursively clear irreplaceable retained saves.

---

## 13. Release boundary

### Must ship in V1

- unconditional, honest capture;
- scoped agreement and content-based classification;
- ownership-safe manifest transport;
- save-unit and screenshot integrity;
- lifecycle gating plus the cloud lock;
- mandatory transfer scope;
- guarded replacements and recoverable retirement;
- narrow operation/resolution records;
- checked KEEP BOTH;
- frozen-plan crash recovery;
- queued conflicts, typed outcomes, and minimal native recovery;
- safe migration of every save-writing entry point;
- core namespacing with legacy reads;
- corrected tests and hardware evidence.

### May follow later

- broad #25 snapshot/history UI;
- immutable protected remote heads, unless the preservation gate makes them necessary;
- distributed leases, consensus, or compare-and-swap emulation;
- generalized causal histories;
- semantic SRAM or memory-card merging;
- automatic progress heuristics;
- a SQLite history index;
- proactive launch-time conflict resolution beyond protecting a live write;
- remote-hash conveniences that add cost without changing correctness.

**Final position:** the project has chosen good identity and presentation primitives, but it has not yet proven a safe writer. Build and test that writer first. Neither a unanimous architectural preference nor a successful rclone exit code is permission to overwrite player progress.

---

## `corpus.provenance.json`

The arrays below are positional: item *n* in `source_file_paths` is paired with item *n* in `source_file_hashes`, corresponding to `S01`–`S42`. Hashes are the Facilitator’s **sha256 values verified at embed time**, not hashes computed by this member.

```json
{
  "artifact": "gpt-revised_plan-r2.md",
  "role": "council member, round-2 revised approach",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator",
  "citation_mapping": "S01 through S42 correspond to the ordered, same-index source_file_paths and source_file_hashes arrays",
  "injected_review_artifacts": [
    "claude_peer_review-r2.md",
    "gemini_peer_review-r2.md",
    "kimi_peer_review-r2.md",
    "mistral_peer_review-r2.md"
  ],
  "injected_review_hashes_provided": false,
  "earlier_revised_plan_files_embedded_in_this_round": false,
  "peer_material_use": "Critique and attribution only. Claims about implementations are evaluated against the source corpus; peer agreement is not treated as empirical evidence.",
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
  "gaps_for_orchestrator": [
    {
      "material": "Authoritative rclone 1.75.0 bisync, copy, backup-dir, filtering, and verification documentation or implementation; relevant upstream roadmap if future direction is to influence the choice",
      "reason": "Transport mutation, recovery, archive ordering, and capability claims remain experiments until this evidence exists.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "SaveState.h, SaveStateRepository.h, FileData.h, GuiSaveState.cpp, Paths.cpp, and the filesystem copy/rename utility implementations",
      "reason": "Default arguments, deletion hooks, launch ownership, timestamp behavior, and final destination semantics are not fully inspectable from the supplied excerpts.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Full launch-command construction, RetroArch setsettings.sh, shipped retroarch.cfg and es_systems.cfg, and effective emulator/core build recipes",
      "reason": "Needed for the two-consumer directory change, actual launched-core capture, save-unit inventories, and effective core-pin emission.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, post-update integration, cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, and tools/cloud-test-backend",
      "reason": "Cross-tier, upgrade, archive, seeding, and test-isolation claims cannot all be independently checked from summaries or caller code.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "GuiMenu.cpp and the other complete cloud entry-point implementations",
      "reason": "The complete writer inventory and menu command composition are described by the corpus but not fully embedded as implementation.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "docs/es-ui-style-guide.md and actual 480x320/640x480 visual test artifacts",
      "reason": "Needed for final visual acceptance; no recognition result is established by the corpus.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Unambiguous current issue bodies and acceptance criteria",
      "reason": "The supplied issue exports are comment-thread shaped; body amendments described in the futro cannot all be independently confirmed.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "Hardware run logs, current bench availability, and the newly available GENERIC_X64 image identity",
      "reason": "The prompt reports availability but supplies no completed run evidence for the proposed foundation.",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated."
}
```

=== END gpt-revised_plan-r2.md ===

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

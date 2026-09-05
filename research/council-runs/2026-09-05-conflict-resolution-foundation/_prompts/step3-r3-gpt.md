# Council — round 3, revised approach

You are one of five council members. You have each produced a revised approach
to the foundation for cloud-save conflict resolution in ROCKNIX, and the other
four have now reviewed all of them. The corpus is embedded above, unchanged and
hash-verified; those four reviews are injected below.

Now produce **your round-3 revised approach**: the foundation you would
actually build, having heard this second round of critique. This is the artifact
the council votes on next, so it must stand on its own — a reader should be able
to act on it without having read any analysis, review, or earlier revision.

## Anti-self-citation constraint

Reason about the substance on its merits, against the embedded corpus. Do not
treat the injected reviews as evidence about how councils, models, or this
deliberation behave.

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

## What this revision must do

Two revisions have closed the easy distance. What remains are the places where
the plans genuinely disagree, and the places where all four agree without the
corpus having settled the point. Both are dangerous, and this round exists to
deal with them rather than to polish prose.

- **Settle, do not average.** Where the reviews identified a substantive
  disagreement, take a position and give the reason. If the evidence does not
  yet exist, say which experiment settles it and what your plan does in the
  meantime under each outcome. Do not adopt a compromise that no reviewer
  argued for.
- **Separate what the corpus settles from what the council merely agrees on.**
  A position held by everyone and evidenced by nobody is the most expensive
  kind of error, because no reviewer is left to catch it. Mark those explicitly.
- **Concede what was refuted**, naming the reviewer and the file, and correct
  it. A revision that quietly drops a refuted claim is worse than one that owns
  it. Where a review misread you, say so and make the argument better.
- **Adopt what others got right**, crediting them by filename. You are not
  scored on originality.
- **Refuse what the problem does not earn.** This is a handheld running busybox
  with a five-second budget on a path the player watches. Where a reviewer or a
  plan proposes machinery beyond that, say so and cut it.
- **Keep the load-bearing separable from the optional.** Get the load-bearing
  parts wrong and the milestone is unsafe; the rest can follow later. Make the
  boundary explicit.
- **State decision changes explicitly.** If your approach requires reopening a
  decided register row, name the ID, state the change as a new refinement
  citing the old row, and give the argument. If it needs no reopening, say so.
- **Pay the amendments.** If your plan named an on-device undo surface as a
  version-one requirement, remove it and re-home its design to the separate
  restore tool. If it carries lineage, generation tracking or receipts deeper
  than one step back, justify each against the maintainer's stated primary
  case or cut it. State plainly what your retention store records, and whether
  a later restore tool could drive a picker from it.
- **Be honest about what is still unmeasured**, and name the experiment that
  settles each hypothesis about rclone, bisync, RetroArch, a backend, or the
  hardware.

Refer to members and artifacts by filename (for example `gpt-analysis.md`,
`kimi_peer_review-r3.md`), never by an invented ordinal.

## Injected peer reviews

=== START claude_peer_review-r3.md ===

# Round 3 peer review — `claude_peer_review-r3.md`

**Reviewer:** the council member whose round-2 revision was `claude-revised_plan-r2.md`.
**Corpus:** the 42 embedded sources, cited as S01–S42 in embed order (full declared paths and the Facilitator's sha256 values are in `corpus.provenance.json` at the end; prose shows the part of each path after `_sources/`). I did not re-read, re-hash, or execute anything. The four injected plans are judged on their merits against the corpus and against the two maintainer decisions in the brief; they are not treated as evidence about anything.

---

## 0. The shape of this round

The four plans agree on the architecture that matters: sha256 identity (D-CLOUD-030), per-device manifests with an unsynced agreement record (D-CLOUD-031), our own three-way classifier with bisync demoted to a candidate transport, `--backup-dir` in both directions, a checked adapter over ES's slot primitives, a lifecycle gate that puts gameplay and the engine under one writer, queued conflicts for unattended passes, D-CLOUD-029 standing. What remains is (a) a handful of substantive disagreements, (b) several places where everyone agrees and the corpus has not spoken, and (c) the maintainer's two decisions, which cut differently into each plan.

I take the maintainer's decisions first, because they change the scoring of everything after.

---

## 1. The maintainer's two decisions, applied

### 1.1 What each plan ships in version one

| Plan | Undo control in V1 | Retention default | Lineage / receipt depth | Discard store readable by the later "time machine"? |
|---|---|---|---|---|
| `gemini-revised_plan-r2.md` | none — **aligned** | ON, count selector — aligned | one step; tombstones only for recorded deletions — aligned | **No.** `--backup-dir` into `discarded/<stamp>/` is a stamp-keyed path mirror; device of origin and which side won are not recorded anywhere durable; transport preimages and wizard losers share one store |
| `gpt-revised_plan-r2.md` | **"minimal native recovery route" is in the must-ship list (§8, §13)** — descoped by the maintainer | ON, 3 per save unit — aligned | **cross-device resolution receipts in V1 (§4.4)** — deeper than the primary case | **Closest.** Unique device/transaction components; the frozen plan records retained-copy locations, hashes, inputs and chosen outcomes; but whether the plan is *kept* after a successful apply is unstated |
| `kimi-revised_plan-r2.md` | none — aligned | ON, count 3 by register row (D-CLOUD-034) — aligned | one step, plus an ops journal partly justified by `replaces` fidelity | **No.** Same `discarded/<stamp>/` mirror; the apply record is removed on completion ("presence means interrupted"); the loser's `origin` lives only in a manifest entry the winner's entry overwrites. Also: **the KEEP BOTH auto sub-choice adds a press** the maintainer has just said not to add |
| `mistral-revised_plan-r2.md` | none ("manual recovery is the honest contract") — aligned | ON, 3 — aligned, but the row is mis-cited: D-CLOUD-027 is the audit log; retention refines IA rev 4 / D-CLOUD-024 | tombstones for explicit deletes only; "conservative resurrection (kimi's policy)" cites a position `kimi-revised_plan-r2.md` itself abandoned | **No.** Same stamp-keyed store |

Two of the four (gpt, kimi) carry a real version-one defect against the decision; the other two carry only the store gap that all four share.

### 1.2 The store requirement, spelled out — and the fix all four need

The maintainer's constraint is that the later restore tool is *the wizard's own compare-and-choose surface pointed at a game's retained past versions*. The wizard's panel needs, per side: kind, screenshot or glyph, date/time (with `clock_synced`), device + model, emulator/core + build (S02 § What each kind shows). So a retained copy must carry the same facts a live conflict pair carries, plus two the live pair does not: **why it is here** and **what beat it**.

Every plan places the store at `/storage/.cache/cloud_sync/discarded/<stamp>/…` and relies on `--backup-dir`'s path preservation. That recovers game and slot from the relative path (`savestates/gba/X.state1`) and nothing else. Device of origin and which side won exist at discard time — in the loser's manifest entry (`kimi-revised_plan-r2.md` §4.1's `origin`; gpt's Origin record) and in the wizard's decision — and are then lost: the winner's manifest entry replaces the loser's at that path, the apply record is disposed of (kimi) or of unstated fate (gpt), and the audit log rotates at 1 MiB keeping one predecessor (D-CLOUD-027, S06), so it cannot be the index either.

The liftable fix, which any of the four can absorb without changing its architecture:

- **A sidecar per retained copy** (`<file>.discarded.json` beside it, or one index per stamp directory), written *before* the destructive step, carrying: the copy's manifest entry verbatim (kind, sha256, system, rom, slot, `origin`/device, core, core_build, captured_at/local, clock_synced, screenshot path + sha256); `reason` ∈ {`conflict-loser`, `superseded-by-download`, `compaction`, `es-delete`}; `winner` = {side, path, sha256, device}; the run/transaction id; the wizard's decision text.
- **The PNG travels with a discarded state** (S03 §4 already says so). The time machine picks by picture; a state without its thumbnail is unusable in that surface.
- **The retention count is per save unit**, as `gpt-revised_plan-r2.md` §2 has it. A global count of 3 across the whole store would be consumed by three routine one-way downloads of unrelated games; the primary case — "I picked the wrong side for *this* game" — would be gone.
- **Transaction preimages and unresolved candidates are exempt from the count** (gpt §6.3, §8). Kimi and gemini do not say this; without it, a retention sweep can evict the only copy of an unreviewed head.

One further point cuts against all four and is `gpt-revised_plan-r2.md`'s alone (§12, last paragraph): *the test store, retained bytes, and pending plans are not disposable caches, despite residing below `/storage/.cache/`*. The IA chose `.cache` for the history **index** because "`.cache` is the established home for state that persists but can be regenerated … store a schema version and rebuild when it does not match" (S02 § Where state lives). A discarded save cannot be regenerated. The location may still be right — `/storage/.config` is swept into `backuptool`'s archive (S04 §1, D-CLOUD-018/019/020 row) and anything under `/storage/roms` is admitted by `+ /**/*.srm` and friends (S32) — but the store's home has to be decided *with* its shape, and whatever home is chosen must be exempt from every "rebuild when the version mismatches" convention. No plan says so. The maintainer asked for the store to be designed now for a reader that does not exist; this is part of that design.

### 1.3 The "edge cases inform, do not drive" sentence

It lands on one place: deletion propagation. The argument the maintainer rejects — give up propagating deletions because an unmounted card is indistinguishable from a deliberate delete — was `kimi-revised_plan.md`'s round-1 F8, and `kimi-revised_plan-r2.md` has already moved off it (its concession C1, §5.1). `gpt-revised_plan-r2.md` and `gemini-revised_plan-r2.md` propagate recorded intent and fail closed on unexplained absence, which is exactly the posture the maintainer describes. `mistral-revised_plan-r2.md` §1.4 is the one still half-way ("conservative resurrection … explicit player deletions propagate as tombstones") — it does not say what a renumber or a D-CLOUD-030 compaction does to the cloud copy, so the churn loop in §3 item 9 below is not closed.

---

## 2. The disagreements that remain

### D1 — How a multi-file save unit is classified. **Substantive.**

`gemini-revised_plan-r2.md` §2.1: "If any member of a declared unit is divergent, the entire unit is marked divergent." `kimi-revised_plan-r2.md` §4.3 and `gpt-revised_plan-r2.md` §4.2 compare the unit's **member maps** (path → hash over the complete member set) as three wholes.

Gemini's rule is wrong for the case that matters: agreed (a₀,b₀), local (a₁,b₀), cloud (a₀,b₁). No member is individually divergent — each is a one-way change — so gemini's rule fires nothing and the engine assembles (a₁,b₁), a save neither device produced. For an N64 `.eep/.mpk` pair or a memcard set that is a fork. The member-map comparison sees M_local ≠ M_agreed and M_cloud ≠ M_agreed and asks.

**Settles by:** a pure classifier fixture, no hardware, ten minutes. **Settles toward:** member maps. Gemini should lift kimi's §4.3 table verbatim.

### D2 — Does the game-exit push read the cloud before it writes? **Substantive, and it is an acceptance criterion.**

`gpt-revised_plan-r2.md` §5.2 steps 5–7: take the lock, read cloud evidence for the changed units, upload only device-changed or safely new units, leave conflicts pending. `kimi-revised_plan-r2.md` §4.3 exit pass: consult the *cached* manifest-claim tier from the last full pass; upload with `--backup-dir`; state the residual honestly — "a fork created since the last full pass can be overwritten on the exit path, and the dated sibling is what makes that recoverable."

The corpus does not leave this open. The futro widened #22 and added AC (a): *"a both-sides-changed save is refused (not resolved) by the boot pass, the game-exit pass and the SYNC row, shown by a constructed fixture"* (S05 §5; S17). Kimi's exit pass resolves the post-full-pass fork by recency with a recoverable copy; that is not "refused", and the constructed fixture's natural shape — A syncs up after B's last full pass, B exits — is exactly the case it misses. Recoverability via the sibling is a floor, not a substitute for the AC.

**Cost:** one evidence read on the *changed-unit* path only — `lsjson --hash` scoped to the changed paths on a hash backend; manifest claims plus download-and-hash on a hashless one. The no-change path stays at zero remote contact (both plans agree). gpt is right not to promise "two spawns"; the number must be measured on the H700 (kimi's gate 8, gpt's P5). **Settles toward:** gpt. If the measured cost breaks the budget, `gemini-revised_plan-r2.md`'s fallback rule is the right one (see §5): defer verification to the full pass, but never upload over an unread cloud head.

### D3 — KEEP BOTH on an auto-state conflict. **Substantive; settled by the maintainer.**

`kimi-revised_plan-r2.md` §4.4 amendment 3 adds a *resume-side sub-choice* ("the player picks which copy becomes `.state.auto`"). `gemini-revised_plan-r2.md` §2.3, `gpt-revised_plan-r2.md` §7.1 criterion 7 and `mistral-revised_plan-r2.md` §1.3 use a deterministic rule: the device's resume point stays at `.state.auto`; the cloud copy becomes a numbered state with its PNG.

Kimi's objection to the rule — "KEEP BOTH identifies no winner" — is right about semantics and wrong about the remedy. The deterministic rule *is* a defined outcome; it is arbitrary, not undefined, and it is already the IA's language ("merged saves move to the next free slot", S02). The maintainer: "I don't want to add more complexity to the user during conflict resolution." A player who wanted the cloud copy as the resume point presses KEEP LEFT; a player who wants both loses nothing and can load the slot from the manager. **Settles toward:** the deterministic rule; the done page names where the cloud copy went. Kimi's amendment 3 is dropped.

### D4 — Deletion propagation and the churn loop. **Substantive, now partly wording.**

`gpt-revised_plan-r2.md` §4.3, `kimi-revised_plan-r2.md` §4.6 and `gemini-revised_plan-r2.md` §3 (D-CLOUD-030-A) converge: intent-recorded receipts for ES deletes, renumbers and compactions, propagated as copy-verify-delete into a dated sibling; unexplained absence fails closed. `mistral-revised_plan-r2.md` §1.4 keeps "conservative resurrection" plus tombstones for explicit deletes only.

Two things are worth adding, because the three converged plans make the mechanism heavier than the corpus requires:

1. **The churn loop is closed by applying D-CLOUD-030 to the cloud copy.** The row (S06) says "after a sync, two slots of one game holding the same hash are compacted: the higher slot is removed" — it does not say *locally*. After a renumber uploads `state3 = H`, the cloud holds `state3` and `state5` with equal hashes; retiring the cloud's higher slot by copy-verify-delete (D-CLOUD-026) into the sibling terminates the loop with no journal at all. The renumber signature is also inferable by hash: the hash agreement says was at slot k is now at slot k−1. `kimi-revised_plan-r2.md` keeps hash inference as "the net"; it is in fact the main mechanism for renumbers.
2. **One hook is load-bearing: ES's delete.** Deleting the *highest* slot leaves no renumber and no duplicate — a pure absence — and without a receipt the cloud copy returns on every pass. That is the one case that needs the `GuiSaveState` delete hook (the call site is not embedded; S25's comment cites `GuiSaveState.cpp:236`). The `copyToSlot(move=true)` hook kimi also proposes is a fidelity improvement for `replaces` across rename-then-edit — which, after the maintainer's decision, is lineage machinery beyond the primary case. Keep the delete hook; make the move hook optional.

**Settles by:** kimi's three fixtures (churn termination; highest-slot delete propagation; stale receipt meets a different occupant → conflict). **Settles toward:** receipts scoped as above. Mistral must adopt cloud-side compaction or it does not converge.

### D5 — Cross-device resolution receipts in V1. **Substantive; the maintainer's decision plus a trace settle it.**

`gpt-revised_plan-r2.md` §4.4 keeps them ("A and B diverge from X; A chooses A's; B later chooses B's; A's next pass silently reverses A's choice"). `kimi-revised_plan-r2.md` §7 defers them ("the ordinary post-resolution case is 'cloud changed → download'; a re-ask arises only when the other device never agreed, and re-asking is not destructive").

Trace gpt's scenario against the schema's table (S03 §3). B's wizard showed B both Ha and Hb and B chose Hb *knowing about Ha*. A's next pass: L = Ha, C = Hb, A(agreed) = Ha → "cloud changed → download". Ha goes to A's discard store (with the sidecar of §1.2 saying `superseded-by-download`, winner Hb from device B). That is the later, informed human decision propagating, with the earlier choice retained one step back — which is precisely the maintainer's model of undo. The "resurrection of a specifically rejected version" case requires a third device whose agreement is *unknown*, which produces a re-ask, not a silent reversal. gpt's receipts would need resolution records synced through the manifests to distinguish these cases; that is the "receipt machinery deeper than one step back" the maintainer has said is not the primary case.

**Settles toward:** V2, as kimi has it. The two-device sequential-resolution fixture should still run — to *observe* that A's copy lands in the store with the right sidecar, not to justify receipts.

### D6 — #10 in the drop or deferred. **Substantive in scope, not in engineering.**

`gpt-revised_plan-r2.md` §9.1: core directories stay in the drop, implemented last, after the launch rehearsal. `gemini-revised_plan-r2.md` and `mistral-revised_plan-r2.md` agree (gates 3 and 7 respectively). `kimi-revised_plan-r2.md` §5.5: defer #10 to its own futro after the wizard.

The engineering is not in dispute: all four accept that creating `es_savestates.cfg` is a launch-behaviour migration, because the XML parser hard-codes `racommands = false` and defaults `autosave`/`incremental` to false while `Default()` sets all three true (S39) — so the rehearsal gate is unanimous. The dispute is scope: D-CLOUD-024 says the milestone blocks the drop, and S01 lists #10 among the milestone's children. Kimi's deferral therefore changes the drop's scope and needs the maintainer's word; kimi is honest that the flat layout's cross-core overwrite is pre-existing shipped behaviour, so deferral costs no *new* loss.

**Settles by:** the rehearsal (gemini's gate). If the XML path can preserve auto-resume and incremental-slot behaviour, keep #10 in the drop, last (gpt). If it cannot, that finding — not the wizard's convenience — is the argument to defer, and it goes to the maintainer as a reopening of the drop's scope, not of D-CLOUD-017.

### D7 — How the own manifest rides the transfer. **Substantive; one plan's mechanism is a hazard.**

`gemini-revised_plan-r2.md` §2.5: "in-spawn filters (`--include /savestates/.rocknix/manifest-<own>.json`)". `kimi-revised_plan-r2.md` §5.7: filtered include, gated on one dry run because `--filter` vs `--filter-from` ordering is not in the corpus. `mistral-revised_plan-r2.md` §1.2: `.rocknix/**` excluded from bulk upload; own manifest via `--files-from` — which reads as a separate spawn and contradicts its own "≤ 2 spawns". `gpt-revised_plan-r2.md` §3.4: exact file selection inside existing batches, with the filter interface proven first.

The corpus is explicit on gemini's mechanism: "using `--include` at all excludes everything it does not match, so a single wrong include is a silent no-op transfer, not an error" (S09, § Critical gotchas). A bare `--include` for the manifest on the saves transfer would exclude the saves. The clean answer nobody quite states: **capture already knows the exact changed set by hash**, so the exit upload can be `--files-from <list>` (changed saves + own manifest) with `--no-traverse` — one spawn, no filter-ordering question, and it also retires `--max-age` as the change detector, which the shipped script admits misses wrong-mtime files (S29, the `--recent` comment). Downloads exclude the own manifest by exact path. **Settles by:** a dry run on the device. **Settles toward:** `--files-from` from capture's set.

### D8 — Exit 4 when there is no default route. **Wording, mostly; one proposal is wrong.**

`gemini-revised_plan-r2.md` §4 item 4: replace the `ip route` check with "a fast local ping to the remote's resolved IP". `gpt-revised_plan-r2.md` §5.3: use a cheap local test only when it can establish the remote has no usable path; otherwise a bounded real operation or a truthful pending outcome. `kimi-revised_plan-r2.md` §8: test the remote's host against connected routes.

D-CLOUD-028's requirement is that the exit sync "answers 'no network' locally and at once … by `ip route`, not a probe" (S06). Gemini's ping is a probe, and resolving a hostname needs the network it is checking for. The LAN-only remote with no gateway is an edge case in the maintainer's sense. **Settles toward:** keep `ip route`; if the endpoint is a literal IP, `ip route get <ip>` is local and instant and answers the LAN case; otherwise a hostname without a default route is unreachable anyway.

### D9 — How strict on hashless backends. **Small substantive residual.**

`gpt-revised_plan-r2.md` §5.1: hashless-with-modtime cannot certify a preserved-mtime change; fetch and hash. `kimi-revised_plan-r2.md` §4.3: three tiers — listing, foreign-manifest claims, confirmation download — with the residual stated (a same-size, preserved-mtime change by a *non-ROCKNIX* writer on a hashless backend is invisible to the cheap tiers; a menu-triggered full verify bounds it). Kimi's manifest-claim tier is a real signal gpt underweights: another ROCKNIX device's own manifest asserts the new sha256. **Settles by:** the same-size WebDAV fixture (both plans name it) plus the shadow census on the maintainer's library for what a hashless full pass would cost. **Settles toward:** kimi's tiering as the default, gpt's strictness as the full-verify mode.

### D10 — `--backup-dir` claims. **Wording.**

gpt is right that the corpus supports `--backup-dir` only in the shipped mirror mode (S29) and proves nothing about two-writer ordering, kill points, or cost on every backend. Kimi's §6 table already lists it as "council-agreed, untested for this use". Both gate on the same race fixture. Lift gpt's §6.3 three-way outcome (pass / unsupported-or-ambiguous → no canonical replacement / loses a head → stop) as the gate's contract.

### Where all four agree and the corpus has not settled it

- **bisync's demotion.** No register row makes bisync the detector, but S01 frames it as the approach under judgement, and #9/#22/the IA say it. This is an amendment to argue to the maintainer, not a body edit; `kimi-revised_plan-r2.md`'s proposed D-CLOUD-036 is the right vehicle. The spike (all four) runs regardless.
- **Boot sync under ES's scheduling.** Necessary (the race in §3 item 7), unanimous, and not in the corpus: nothing embedded says when ES is up relative to the network or how `autostart/102-cloud-saves` (S35) hands off. That handoff is a gap to name (§9).
- **Queue-and-badge for unattended passes.** IA rev 4 says "a sync that reports conflicts opens the wizard" (S02). All four queue for boot/exit. Right, unmeasured, and an IA rev 5 item.
- **Retention count 3.** A product number none of the four can cite; the maintainer said "bounded by a count" and no more. Propose 3 per unit and say it is a proposal.

---

## 3. Load-bearing claims re-tested against the corpus

Each is marked **holds** (source-visible), **holds with caveat**, **does not hold**, or **not in corpus**.

1. **`getNextFreeSlot()` returns −99 for an auto-only repository.** S37: `if (states.size() == 0) return firstslot; for (i = 99999; i >= 0; i--) …; return -99;` — an auto state (slot −1) makes the vector non-empty and the scan finds no slot ≥ 0. **Holds.** And it is not an edge case: the auto conflict is the one the schema predicts as commonest (S03 §4), and a game with only an auto state is the ordinary case for it. Every plan's adapter must allocate from `firstslot` here; only gpt (§7.1 criterion 3) says so in words.
2. **`copyToSlot()` returns `true` unconditionally.** S38: the `renameFile`/`copyFile` results are discarded. **Holds.**
3. **`makeStateFilename(fullPath = true)` derives the destination from the source's parent.** S38: `combine(getParent(fileName), ret)`. **Holds** — a cloud state staged in `/tmp` would "merge" into `/tmp`. Stage in the real save directory under a temp name (kimi §4.5); the name must match neither regex in S39 — `X.state1.tmp-<id>` does not match `^(.*)\.state($|[0-9]+)$` or `^(.*)\.state\.auto$`.
4. **Exit-time renumbering is conditional, not "every exit".** S41 calls `onGameEnded()` only when `options.saveStateInfo != nullptr`; S38's `racommands` branch returns for `slot < 0` before `renumberSlots()`. **Holds** — gpt's correction of the earlier overgeneralisation (which was mine) is right. Numbered-slot launches renumber; auto and new-game launches do not.
5. **The exit upload is `copy` with no `--update`.** S29 `--recent` branch forces `BACKUPMETHOD=copy`; `--update` is added only when passed; S41 passes `--yes --saves-only --recent`. **Holds** — the exit path is local-wins within the window, and the "lossless one-way posture" is refuted (all four now concede).
6. **The boot pair is `copy --update` both ways.** S35. **Holds** — newest-wins, blindspot 28 (S07).
7. **The boot sync races a live session, and the numbered-slot launch manufactures a "zombie" auto.** S38: `setupSaveState()` renames auto → `.bak` and copies the slot file to the auto path; `onGameEnded()` removes the live auto and restores the `.bak`. S35: a detached background pair. **Holds with caveat** — the *mtime* consequence (the copied auto is "newer", the restored one is "older") depends on the copy utility's timestamp behaviour, which is not embedded (gpt §1.2 is right). The reproducer (kimi gate 3, gpt P1, gemini #4) is mandatory. One more consequence both plans note: a numbered-slot launch *discards the session's auto* at exit, so "the auto is written on every exit" (S03 §4) depends on launch habits — census, not assertion.
8. **Non-empty `RCLONEOPTS` replaces the default option set, including `--filter-from`.** S29 `backup_game_saves`: `if [ ${#filtered_opts[@]} -gt 0 ] … else … --filter-from`. **Holds** — a user who edits `RCLONEOPTS` and drops the filter syncs `/storage/roms` with only `--exclude=bios/**`. Kimi's finding; gpt adopted; gemini and mistral omit it. Filed on day one regardless of the milestone.
9. **The renumber-churn loop.** Trace in §2 D4 against S37/S38 (renumber via `copyToSlot(move=true)`), S03 §3 ("only one side has it → transfer") and D-CLOUD-030's local compaction. **Holds** as stated; **closed** by cloud-side compaction under the row's own wording plus the delete hook for the highest slot.
10. **The schema never writes agreement on verified equality.** S03 §2 ("the hash this device last uploaded or downloaded"), §3 (equal → nothing), §9 ("written by the transfer that moves a version"). **Holds, and it is the sharpest gap in the signed schema.** The maintainer's own devices, synced by the shipped scripts before the engine ships, will have L = C for every file and no agreement; the first change to any save then classifies as "never agreed → ask". That is an upgrade that is not invisible (S11). gpt §4.1 names it; kimi §4.3 adopts ("write agreement if absent"); gemini and mistral do not state it. It belongs in the D-CLOUD-031 refinement row every plan proposes.
11. **`.state.auto.bak` and Dropbox "conflicted copy" `.srm` files are admitted by the saves allowlist.** S32: `+ /savestates/**` takes the whole directory; `+ /**/*.srm` matches `X (conflicted copy).srm`; the embedded `cloud_backup`/`cloud_restore` carry no conflict exclusion (S29, S30). **Holds** — D-CLOUD-022's fix reached the content tier only. Kimi's finding.
12. **`--include` excludes everything it does not match.** S09. **Holds** — see D7.
13. **The round-trip harness cannot pass against the embedded uploader.** S36 writes `rclone.conf` wholesale before asserting the first remote and never restores it; asserts `f"{device_id}/{ARCHIVE_NAME}"` where S29 uploads a non-dated name as `${stamp}-${base}`; reads the archive back at the original path where S30 writes `local_name="${newest}"`; looks for `*-*_BACKUP.tar.gz` the fixture never creates. **Holds** — four visible failures, and one destructive act on a configured handheld. `gemini-revised_plan-r2.md`'s suggested fix ("remove the `rclone.conf` overwrite that precedes the remote assertion") is imprecise: the write is how the VM is pointed at the QA backend; the fix is back-up-and-restore around it, with the first-remote assertion made against the merged result.
14. **User rules come before defaults in the rules file.** S31 `update_cloud_sync_rules`. **Holds** — so #25's snapshot exclusion cannot live only in the defaults file; kimi propagates it correctly. Stated more carefully than kimi does: a default *can* be overridden by a user `+` rule, which is what defaults are; the safe design is a store outside the tree, which every plan now has.
15. **rclone's exit 3/4 collide with the scripts' reserved meanings, and `clean_exit ${BACKUP_STATUS}` masks a failed system phase.** S29 `clean_exit` writes a stamp for any code; S40 maps 3/4 to SKIPPED. **Holds** — typed outcomes (gpt §8, kimi §4.3) are necessary.
16. **Kid/kiosk mode hides `GAME SETTINGS`.** S13. **Holds** — the badge is invisible there; nothing destructive happens without the wizard; unlock resolves. All four now agree.
17. **`getCore(true)` at exit is correct today and may not be after #10.** S38's emulator/core rewrite requires `!racommands`; `Default()` is `racommands = true`; the XML path flips it (S39). **Holds** — gpt's "actual launch context" (kimi adopts) matters at #10, not before.
18. **bisync's behaviour under `--conflict-resolve none`, interruption, `--recover`/`--resilient`, filter change.** **Not in corpus.** All four demote and spike. Nothing depends on the outcome; that is the correct posture.
19. **`--backup-dir` under a two-writer race.** **Not in corpus.** See D10.
20. **`mistral-revised_plan-r2.md` §1.1 "≤ 2 rclone spawns … proven on H700" and §6 "a build contract with no unmeasured claims".** **Does not hold** — the spawn count is a target, not a measurement; and the plan's own evidence letters ([C] [G] [K] [M]) mark peer plans as settling claims, which the brief forbids: only [S] settles anything (`getNextFreeSlot()` → −99 is settled by S37, not by [K]).

---

## 4. What the amendments cost each plan

- **`gemini-revised_plan-r2.md`** — Low. It was already at "retain ON, bounded, no undo control". It owes the store sidecar (§1.2) and the separation of transport preimages from wizard losers (or a `reason` field that distinguishes them). Its unit rule (D1), `--include` mechanism (D7) and ping (D8) are corpus defects independent of the amendments.
- **`gpt-revised_plan-r2.md`** — Medium. Delete "minimal native recovery" from §8 and §13; move §4.4's resolution receipts and the "completed resolution" operation record to "may follow later"; keep the move/delete/compaction operation records (they are convergence, not lineage). Its store is the closest to the reader requirement; it owes one sentence: the frozen plan's per-unit record is *retained beside the copies*, not disposed of on completion. Its argument that SSH-only recovery is not console-first is answered by the maintainer's separate tool.
- **`kimi-revised_plan-r2.md`** — Medium. Drop the KEEP BOTH auto sub-choice (D3). Add the store sidecar; the `origin` data it needs is already in hand at discard time. Narrow the ops journal's justification to deletion receipts (D4) — the `replaces`-fidelity argument is lineage depth the maintainer has set aside. Separately from the amendments, its exit pass fails the futro's #22 AC (a) (D2).
- **`mistral-revised_plan-r2.md`** — Low on undo (none shipped), but it carries three defects the round should not let through: "D-CLOUD-029 is withdrawn" reopens a decided row without the argument S01 requires (and misattributes the withdrawal to `gemini-revised_plan-r2.md`, which says D-CLOUD-029 stands); the retention row cites D-CLOUD-027 instead of D-CLOUD-024/IA rev 4; and "conservative resurrection" is exactly the edge-case-driven posture the maintainer has ruled insufficient.

---

## 5. What each plan uniquely has — lift verbatim

**`gemini-revised_plan-r2.md`**
- The budget fallback rule (§4 item 2): *"If the budget exceeds 5 seconds, defer hashless verification to the boot/menu full pass, leaving the exit push as a fast-path upload only."* Read with D2: the fast path may still never overwrite an unread cloud head, but this is the only plan that says what to do when the measurement comes back bad.
- The two named kill points for the interrupted-apply proof (§6 item 5): *"after a local replacement but before remote publication, and after remote publication but before agreement is advanced."* gpt has a fault campaign; gemini names the two stages that matter.
- The compaction-tombstone wording in D-CLOUD-030-A: *"propagate as moves into dated siblings, capped per run."*

**`gpt-revised_plan-r2.md`**
- The lock order (§3.1): five steps, with *"capture never waits for the cloud lock"* and *"it does not hold the lifecycle gate across network waits."* Kimi adopts the order; gpt states it.
- *"Establish agreement on verified equality as well as transfer"* — the schema gap of §3 item 10, in the D-CLOUD-031 refinement.
- The classifier row *"A retirement for X encounters Y at a relevant path → conflict or stale operation; never treat the record as permission to remove Y."*
- The `.cache` warning of §1.2, and the preservation-gate outcomes of §6.3.
- The §12 table — case-folding aliases, same basename in two directories, the wrong mounted card, a legitimate unit whose member is excluded by the `*.db` rules (S32).

**`kimi-revised_plan-r2.md`**
- The three shipped hazards no other plan found: `RCLONEOPTS` without `--filter-from`; the conflicted-copy admission in the saves tier; the `*.bak` transient (§3 items 8, 11).
- §6, *"What the corpus settles vs what the council merely agrees on"* — the single most useful table in the round, and the one a builder should keep open.
- The day-one filings list (§8) — bycatch, not baggage.
- *"A deliberately restored file is a new version, not a stigmatized one"* (§12) — this is the semantics the time machine needs: a restore from the store is an ordinary new version to the classifier.
- Manifest write-only-on-change, with its consequence for the round-trip's "nothing to transfer" step.

**`mistral-revised_plan-r2.md`**
- The gate / experiment / owner-issue / pass-condition table (§4). Kimi credits the shape; mistral's is the cleanest instance.
- `kind: container` for shared VMU/memcard units, which makes "`rom` is null for a container" a type rule rather than a convention.

---

## 6. What should not be built

- **A native undo surface in the resolution flow** (gpt §8, §13) — descoped by the maintainer.
- **Cross-device resolution receipts synced through manifests** (gpt §4.4) — V2; the ordinary outcome is correct and retained (D5).
- **The KEEP BOTH auto sub-choice** (kimi §4.4 amendment 3) — one more press the maintainer has said not to add (D3).
- **Move-observation hooks justified by `replaces` fidelity** (kimi §4.1) — keep the delete hook for receipts; treat the move hook as optional (D4).
- **`--include`-based manifest transport** (gemini §2.5) — a silent no-op transfer per S09; use `--files-from` (D7).
- **A probe replacing `ip route`** (gemini §4 item 4) — contradicts D-CLOUD-028 (D8).
- **Per-file "any member divergent" unit classification** (gemini §2.1) — misses the disjoint-member fork (D1).
- **"Conservative resurrection" of compacted duplicates** (mistral §1.4) — does not converge (D4).
- **Withdrawing D-CLOUD-029** by assertion (mistral §2) — the row stands; the maintainer's toggle posture is compatible with it and needs no row.
- **A SQLite index** — all four agree; say so on #20 and close the question.
- **A generation counter that does more than fail closed** on a same-ID manifest fork (gpt §3.3) — a cloned card is an edge case; warn and refuse (kimi §4.1 rule 5) is enough.
- **Anything that reads a retention count as permission to evict an unreviewed head** — every plan's store must exempt transaction preimages and pending candidates (gpt says it; the others must).

---

## 7. Which plan I would build from, and what I would take

**Build from `kimi-revised_plan-r2.md`.** It is the only one of the four that is a complete standalone specification with every claim marked against the corpus, an honest residual stated wherever a mechanism does not close a case, a defined shadow census, ordered gates from no-hardware through the RG351M, and a build order. Its concessions are correct and traced. Its weaknesses are three and all liftable.

Before building, take:

1. From `gpt-revised_plan-r2.md`: the exit pass reads cloud evidence for changed units before uploading (D2, to satisfy the futro's #22 AC (a)); equality-establishes-agreement in the D-CLOUD-031 refinement (§3 item 10); the lock order as written; the `--backup-dir` preservation gate's three outcomes; the `.cache` non-disposable rule; the §12 failure table as additional fixtures.
2. From `gemini-revised_plan-r2.md`: the budget fallback rule and the two named kill points.
3. From `mistral-revised_plan-r2.md`: the gate table shape, with owners; `kind: container`.
4. Apply the maintainer's decisions: drop kimi's auto sub-choice; add the per-copy sidecar with `reason` and `winner`, per-unit retention with exemptions, PNG travelling with the state; decide the store's home alongside its shape; narrow the ops journal to the delete hook plus hash inference.
5. Simplify D4 with cloud-side compaction under D-CLOUD-030's existing wording.

The result is kimi's engine with gpt's evidence discipline on the two places kimi traded safety for cost, and the maintainer's undo model built into the store from day one.

---

## 8. Where these plans changed my mind since `claude-revised_plan-r2.md`

- **The exit push must read before it writes.** I had accepted cached claims plus `--backup-dir` as adequate for the exit path. The futro's AC (a) says *refused*; recoverability is not refusal. gpt is right; the cost is measured, not assumed.
- **Equality writes agreement.** I had not made this explicit. The trace in §3 item 10 shows that without it the upgrade to the engine is a wizard prompt on every save's first change. gpt's formulation is load-bearing.
- **`--backup-dir` is not "zero extra round trips".** That was my overclaim in the previous round. It adds no process; it may add server-side operations whose cost and ordering are unmeasured on Dropbox and WebDAV.
- **Exit-time renumbering is conditional.** My earlier trace generalised from the numbered-slot launch; S38/S41 show the auto and new-game paths return early. The reproducer still runs; the frequency claim changes.
- **The store's home is not settled by "outside the sync tree".** gpt's `.cache` observation reopened a point I had treated as closed. It should be decided with the maintainer alongside the sidecar shape.
- **Resolution receipts stay deferred.** I had deferred them in my round-2 review; gpt's V1 case did not move me because the trace shows the ordinary outcome is correct and retained, and the maintainer's decision now says the same thing from the product side.

---

## 9. Gaps to surface to the orchestrator

None of these is fabricated; each is named because a plan's claim depends on it and the corpus does not contain it.

- `GuiSaveState.cpp` (the delete/renumber call site the one load-bearing hook must attach to), `SaveState.h` / `SaveStateRepository.h` (default arguments), `Paths.cpp:83`, and the filesystem copy/rename utilities (timestamp behaviour for §3 item 7).
- rclone 1.75.0 documentation or source for bisync, `--backup-dir`, `--files-from`, and the `--filter`/`--filter-from` ordering (D7, D10, item 18–19).
- How ES's startup relates to network readiness, for the boot pass moving under ES's scheduling.
- `setsettings.sh`, the shipped `retroarch.cfg` and `es_systems.cfg` (RetroArch's `savestate_directory`, `savestate_auto_save`; the two-consumer layout for #10).
- `cloud_sync.conf.defaults`, `cloud_sync-rules.txt.defaults`, the content scripts, `cloud_setup`, `backuptool`, `tools/cloud-test-backend`.
- The four round-2 plans' predecessors and `claude-revised_plan-r2.md` itself were not embedded; I have not relied on any of them as evidence.

---

## `corpus.provenance.json`

```json
{
  "artifact": "claude_peer_review-r3.md",
  "role": "council member, round-3 peer review of the four injected revised approaches",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied from the supplied per-source headers; verified at embed time by the Facilitator, not recomputed by this member",
  "citation_mapping": "S01 through S42 correspond to the ordered, same-index source_file_paths and source_file_hashes arrays",
  "reviewed_artifacts": [
    "gemini-revised_plan-r2.md",
    "gpt-revised_plan-r2.md",
    "kimi-revised_plan-r2.md",
    "mistral-revised_plan-r2.md"
  ],
  "reviewed_artifact_hashes_provided": false,
  "own_prior_revision_embedded": false,
  "peer_material_use": "Judged on merits against the embedded corpus and the maintainer's two decisions in the orchestrator brief; not treated as evidence about councils, models, or this deliberation.",
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
      "material": "GuiSaveState.cpp, SaveState.h, SaveStateRepository.h, Paths.cpp, and the filesystem copy/rename utility implementations",
      "reason": "The one load-bearing ES hook (delete) has an uncited call site; default arguments and copy timestamp behaviour (zombie-auto trace) are not inspectable from the excerpts.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "rclone 1.75.0 documentation or source for bisync, --backup-dir, --files-from, and --filter/--filter-from ordering",
      "reason": "D7 and D10 and the bisync spike rest on behaviour the corpus does not contain.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "ES startup ordering relative to network readiness and the autostart handoff",
      "reason": "Every plan moves the boot pass under ES scheduling; the corpus does not show when ES is up or how 102-cloud-saves would hand off.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "setsettings.sh, shipped retroarch.cfg and es_systems.cfg",
      "reason": "RetroArch's savestate_directory and savestate_auto_save settings decide the #10 two-consumer layout and the auto-state frequency claim.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "cloud_sync.conf.defaults, cloud_sync-rules.txt.defaults, cloud_content_backup, cloud_content_restore, cloud_setup, backuptool, tools/cloud-test-backend",
      "reason": "Cross-tier and upgrade claims referenced by the plans cannot all be checked from the embedded callers.",
      "declared_source_path": null,
      "sha256": null
    },
    {
      "material": "The four round-2 plans' round-1 predecessors and claude-revised_plan-r2.md",
      "reason": "Not embedded; referred to only as the plans themselves describe them, never as evidence.",
      "declared_source_path": null,
      "sha256": null
    }
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated."
}
```

=== END claude_peer_review-r3.md ===

=== START gemini_peer_review-r3.md ===

An analysis of the four revised approaches against the embedded corpus and the maintainer’s new authoritative constraints.

---

### 1. Costing the Amendments

The maintainer’s two rulings—reversibility is one step back with no V1 undo control, and the discard store must support a future "time machine" picker—directly invalidate parts of the proposed plans:

*   **`gpt-revised_plan-r2.md` over-scoped V1.** GPT explicitly demanded a "minimal native recovery route for retained decisions" in V1 (Section 8), arguing that SSH is not a console-first escape hatch. The maintainer explicitly descoped this: *"ships no undo control... Restoring a discarded copy becomes a separate tool."* GPT pays the cost of designing and demanding a UI surface that the maintainer rejected.
*   **`kimi-revised_plan-r2.md` and `mistral-revised_plan-r2.md` designed a discard store the future picker cannot read.** Mistral places discards in `/storage/.cache/cloud_sync/discarded/<stamp>/`. Kimi places them in `/discarded/<path>/<sha256>`. Because Kimi deletes the plan file after apply, and Mistral relies only on a timestamp, both drop the context required for the future picker (which device produced the copy, which side won the conflict, what core it belongs to). To survive the amendment, the discard store must write a metadata sidecar (e.g., `discard-meta.json`) alongside the retained bytes.
*   **`kimi-revised_plan-r2.md` abandoned a capability for an edge case.** Kimi’s plan states: *"V1 propagates no ordinary deletion... The one deletion is D-CLOUD-030's duplicate compaction."* Kimi relies on a "hold-back" flag to prevent resurrecting deleted files, explicitly refusing to delete them from the cloud to protect against the unmounted-card edge case. The maintainer ruled: *"abandoning a capability to buy it [safety from an edge case] needs a better reason than the edge case alone."* Kimi’s complete refusal to propagate recorded deletions is costed by this amendment.

### 2. The Real Disagreements

**Disagreement 1: Deletion Propagation vs. Unexplained Absence**
*   *The Split:* `kimi-revised_plan-r2.md` refuses to propagate deletions to the cloud, using a local "hold-back" flag instead. `gpt-revised_plan-r2.md` allows deletion propagation, but *only* via explicit receipts (verified ES moves/deletes), while failing closed on unexplained absence.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `gpt-revised_plan-r2.md` wins. The maintainer’s amendment explicitly states we should not abandon capabilities just for edge cases. Kimi built a robust receipt system (the ops journal) but stopped short of using it to actually delete remote files. We should use Kimi's receipts to execute a remote `copy-verify-delete` (into the dated sibling), fulfilling the capability while still failing closed on unrecorded absence.

**Disagreement 2: Concurrency and `--backup-dir`**
*   *The Split:* `kimi-revised_plan-r2.md` leans on `rclone copy --backup-dir` in both directions as the primary safety net for concurrent writes, assuming it will atomically archive the intervening head if a race occurs. `gpt-revised_plan-r2.md` points out that `--backup-dir`'s atomicity and behavior under concurrent writes on backends like WebDAV and Dropbox is entirely unproven.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `gpt-revised_plan-r2.md` is correct. Rclone's `--backup-dir` is a client-side directive; on backends without atomic server-side moves, a concurrent overwrite can still result in a torn or lost file. *Experiment to settle:* The two-device race fixture (Gate 7). I predict `--backup-dir` will *not* reliably preserve the intervening head on WebDAV, meaning the lineage check (which both plans adopt) is the true safety net, surfacing the lost update as a fork on the next pass.

**Disagreement 3: The `es_savestates.cfg` Launch-Behavior Migration (#10)**
*   *The Split:* `claude-revised_plan-r2.md` (via Kimi's summary) thought #10 could be deferred because flat-path collisions become visible conflicts. `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md` correctly identify that shipping `es_savestates.cfg` alters emulator launch behavior, not just directories.
*   *Substantive or Wording:* Substantive.
*   *Resolution:* `kimi` and `gpt` are correct. Source `es/SaveStateConfigFile.cpp` proves that the compiled `Default()` sets `incremental = true`, `autosave = true`, and `racommands = true`. But the XML parser (lines 160+) defaults `autosave` and `incremental` to false, and hardcodes `emul->racommands = false;`. Shipping this file disables the `.auto` backup dance. It must be gated behind a real-device rehearsal.

### 3. Testing Load-Bearing Claims Against the Corpus

I verified the most critical claims made by the plans against the embedded sources:

*   **Claim:** `copyToSlot` ignores copy/rename return values and returns `true` unconditionally (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 38 (`es/SaveState.cpp`), lines 240-264. The function executes `Utils::FileSystem::renameFile(...)` or `copyFile(...)` and unconditionally hits `return true;` at the end without checking their success. A checked adapter is absolutely mandatory.
*   **Claim:** `getNextFreeSlot` returns `-99` for an auto-only repository (`kimi-revised_plan-r2.md`, `gpt-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 37 (`es/SaveStateRepository.cpp`), lines 183-199. If only an auto state exists, `states.size()` is 1. The loop scans `for (int i = 99999; i >= 0; i--)`. Since the auto state has `slot == -1`, the loop finishes without a match and returns `-99`.
*   **Claim:** A non-empty `RCLONEOPTS` without `--filter-from` bypasses the allowlist (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 33 (`cloud_sync.conf`) defines `RCLONEOPTS` including the `--filter-from` flag. Source 31 (`cloud_sync_helper`) merges user configs. If a user overrides `RCLONEOPTS` in their local config, the default `--filter-from` is lost. Because `cloud_backup` [S29] passes `RCLONEOPTS` directly to rclone, the allowlist is entirely bypassed. This is a massive shipped hazard.
*   **Claim:** The exit upload is `copy` with no `--update`, meaning it overwrites the cloud head of a fork (`kimi-revised_plan-r2.md`).
    *   *Verification:* **TRUE.** Source 29 (`cloud_backup`), lines 218-232. The `--recent` flag forces `BACKUPMETHOD="copy"` and adds `--max-age` and `--no-traverse`, but does *not* add `--update`. It is a blind overwrite.

### 4. What Each Plan Uniquely Has (To Lift Verbatim)

*   **From `kimi-revised_plan-r2.md`:** The exact breakdown of the ES primitive defects (`getNextFreeSlot` returning `-99`, `copyToSlot` returning unconditional `true`, `makeStateFilename` deriving from the source's parent). This proves beyond doubt that raw ES primitives cannot be used and a checked adapter is required.
*   **From `gpt-revised_plan-r2.md`:** The **lifecycle gate acquisition order**: *"1. A network worker takes the cloud lock non-blockingly. 2. It takes the lifecycle gate non-blockingly... 4. ES’s game session holds the lifecycle gate, performs local capture, releases it, and only then requests cloud work. 5. Capture never waits for the cloud lock."* This structurally eliminates the boot-sync vs. game-session race.
*   **From `claude-revised_plan-r2.md` (via Kimi):** Binding `agreed.json` to the 5-tuple of `{remote name, remote type, SYNCPATH, BACKUPPATH, RESTOREPATH}`. This ensures that changing a cloud folder or unlinking an account doesn't result in a mass false-agreement overwrite.
*   **From `mistral-revised_plan-r2.md`:** The explicit "What not to build" section, which serves as a strict out-of-scope fence for the builder.

### 5. What Should Not Be Built

*   **A native undo/recovery UI in V1:** Explicitly descoped by the maintainer.
*   **A SQLite database:** Unnecessary overhead on busybox, and syncing a database file is a known corruption hazard (as proven by the allowlist exclusions).
*   **A full staging mirror of the remote tree:** Costs a full download on hashless backends just to verify equality. Candidate-scoped staging is the correct approach.
*   **A 99-slot product cap:** ES supports 99999 slots; capping it is inventing a product limitation to mask a code defect.
*   **`bisync` as the production detector:** It remains a spike. Its `--conflict-loser` suffix breaks ES's regex, and its `--resync` behavior is too dangerous for unattended syncs.

### 6. Which Plan I Would Build From

I would build from **`kimi-revised_plan-r2.md`**. 

It is the most rigorously evidenced plan, correctly identifying the ES primitive bugs, the `RCLONEOPTS` bypass hazard, and the exact exit-path budget. It relies on verifiable artifacts rather than assumed rclone behaviors.

**What I would change/take from the others:**
1.  **Fix the Discard Store (Maintainer Amendment):** I would amend Kimi's discard store to write a `discard-meta.json` sidecar alongside every retained file. This sidecar will record `original_path`, `game`, `core`, `device_id`, `side_won`, and `timestamp`, perfectly setting up the maintainer's V2 "time machine" picker.
2.  **Restore Deletion Propagation (Maintainer Amendment / GPT):** I would take GPT's approach to deletion. Kimi built a brilliant "ops journal" to generate deletion receipts, but stopped short of using them to delete remote files. I would use Kimi's receipts to execute a remote `copy-verify-delete` (into the dated sibling), fulfilling the deletion capability while still failing closed on unrecorded absence.
3.  **Adopt the Lifecycle Gate (GPT):** I would lift GPT's strict lock acquisition order to guarantee the boot-sync cannot race the emulator.

### 7. Where a Plan Changed My Mind

The reviews and the revised plans changed my mind regarding **`bisync` and the full staging mirror**. In my own revision, I might have leaned toward utilizing `bisync`'s built-in detection or mirroring the remote tree to simplify comparisons. However, `kimi-revised_plan-r2.md` and `gpt-revised_plan-r2.md` conclusively proved that `bisync`'s suffixing breaks ES's `{{romfilename}}.state{{slot}}` regex (causing files to vanish from the UI), and that a full staging mirror on a hashless backend (like the QA WebDAV) would trigger a full library download just to verify sizes. Candidate-scoped downloads and a custom JSON-based reconciler are the only safe paths forward.

=== END gemini_peer_review-r3.md ===

=== START kimi_peer_review-r3.md ===

# Round-3 peer review — `kimi_peer_review-r3.md`

**Posture.** I am the fifth member; my earlier revision is the one the injected plans credit as `kimi-revised_plan.md`. I judge all four injected plans against the embedded corpus and the two maintainer amendments, not against my own artifact. I re-read nothing, re-hashed nothing, ran nothing; the corpus stands as embedded. Where all four plans agree and the corpus is silent, I say so explicitly — that is the class of claim most likely to ship a confident error.

---

## 1. What the two amendments cost each plan

The amendments were made after the plans were written, so absence is not a defect; distance from them is what I measure. Three tests fall out of them:

- **T1 (undo surface):** V1 ships retention ON, count-bounded, and *no* control to put a discarded copy back. The restore tool is a separate issue shaped as the wizard's compare-and-choose pointed at retained versions.
- **T2 (store readable by a reader that does not exist):** the discard store must not be keyed only by timestamp, and must not drop which game, which slot, which device produced the copy, and which side won.
- **T3 (edge cases inform, do not drive):** failing closed on unexplained absence is still expected; abandoning a capability *because* a detached card is indistinguishable from a deletion is not, on its own, sufficient reason.

### 1.1 Score table

| Plan | T1: retention ON, no V1 undo control | T2: store shape vs the future reader | T3: capability vs edge case | Net cost |
|---|---|---|---|---|
| `claude-revised_plan-r2.md` | Compliant (§2.6.4: ON, count 3, "retention for recovery, not an undo control"; done page names discards via the futro ACs it carries) | **Partial.** `/storage/.cache/cloud_sync/discarded/<path>/<sha256>` keeps game, slot, content identity, and the PNG travels (§2.4.1). Producer device and which-side-won are *not* durably bound to the copy: the plan file that held them is deleted after apply (§2.8), the audit log rotates at 1 MiB (D-CLOUD-027), and the loser's `origin` vanishes from the manifest union when the producer's entry is overwritten — the volatility claude itself conceded in §1.1 | **Weakened.** §2.10's no-delete-propagation leans on "an unmounted card … present as absence", which is exactly the argument T3 declares insufficient alone | Low–moderate |
| `gpt-revised_plan-r2.md` | **Violates T1.** §8: "V1 needs a minimal native recovery route … A directory of bytes recoverable only through SSH is not a complete console-first escape hatch." That is an on-device undo surface as a V1 requirement — now over-scoped | **Closest.** Store uses "unique device/transaction components, not a timestamp alone" (§6.1); manifest operation records bind resolutions to exact input hashes and outputs (§3.3), so every device learns every resolution. Still needs operand *provenance* inline — the records carry hashes and locations, and origin-by-lookup is volatile for the loser | **Strongest.** Retirement records name the exact version (§4.3): a detached card produces no record → fail closed; a deliberate delete produces one → propagates. The indistinguishability argument never applies | Low (mostly scope *reduction*) |
| `gemini-revised_plan-r2.md` | Compliant (§2.4: ON, count selector; no V1 undo surface) | **Fails.** `discarded/<stamp>` and remote `-replaced/<stamp>` (§2.4) are keyed by exactly the thing T2 forbids. Game, slot, producer, winner all depend on records not specified | Compliant in form (tombstones for explicit deletes/compactions), but the cited *necessity* is stale (§4.2 below) | Moderate |
| `mistral-revised_plan-r2.md` | Compliant (D-CLOUD-027-A: ON, default 3; no undo surface) | **Fails.** `discarded/<stamp>/` (D-CLOUD-027-B) — same defect as gemini | Compliant in form (tombstones + mass-delete guard, §1.4) | Moderate–high (plus four independent errors, §4.4) |

### 1.2 The fix the amendment demands, once

None of the four stores fully survives T2. The repair is small and the same for all: keep `claude-revised_plan-r2.md`'s path-keyed layout (`discarded/<path>/<sha256>`, PNG beside the state), and write a `<sha256>.json` sidecar at apply time carrying `{rom, system, kind, slot, producer: {device_id, device_label, device_model, core, core_build, captured_at}, winner_side, resolved_at, resolution_id}`. Every field is already in the apply-time plan item in claude's §2.8 or gpt's §7.3, so this is a write of data in hand, not new machinery. Prune by count per path, never by date (claude §7's wrong-clock hazard), and exempt unresolved conflicts and incomplete transactions from the count (gpt §2 — the count must never evict the only copy of an unresolved version). With that sidecar, the maintainer's "time machine" tool — the wizard's panels pointed at a game's retained versions — can be built later without touching V1's store.

### 1.3 Per-plan amendment notes

- `gpt-revised_plan-r2.md`'s T1 violation is the cheapest possible kind: the recovery route it designed is *exactly* the separate tool's shape ("reusing the same comparison/apply machinery"). Moving it to the new issue is a scope cut, and the design work is not wasted — it is the tool's seed. It must also add the done-page sentence (what was discarded, that copies are kept); its §8 cancellation wording is precise but the done page is silent.
- `claude-revised_plan-r2.md` needs the sidecar (§1.2) and a re-justified deletion position (§2, D1). Its done-page sentence already exists via the futro ACs it carries ("the done page names each discarded copy per game, and the audit line precedes the deletion").
- `gemini-revised_plan-r2.md` needs the store re-keyed and the sidecar; its "capped per run" on retirement propagation (§3, D-CLOUD-030-A) must be clarified — if the cap *drops* records it reintroduces non-convergence; `gpt-revised_plan-r2.md` §4.3's rule is the right one: reaching a control-state limit stops mutation rather than silently discarding correctness state.
- `mistral-revised_plan-r2.md` needs the same store repair, plus correction of the four errors in §4.4 before its content is safe to lift anywhere.

---

## 2. The real disagreements, and what settles them

### D1 — Deletion propagation in V1: substantive; settles to version-specific tombstones, conditionally

Positions: `gpt-revised_plan-r2.md` §4.3 (retirement records for explicit deletes, verified moves, verified compactions — each naming the exact version; "a remote edit is a delete/edit conflict, not collateral permission"); `gemini-revised_plan-r2.md` §3 (intent-recorded receipts, "capped per run"); `mistral-revised_plan-r2.md` §1.4 (tombstones + mass-delete guard); `claude-revised_plan-r2.md` §2.10 (no propagation in V1; direct remote compaction for duplicates; hold-back O2; explicit deletion deferred to "a separately approved V2 policy").

Two things are *not* in dispute: unexplained absence fails closed (all four; T3 confirms), and D-CLOUD-030's duplicate compaction must converge. On convergence, `gemini-revised_plan-r2.md` §1 cites my round-2 review as proving receipts are *required* — that is stale: `claude-revised_plan-r2.md` §2.3.2 compacts the higher copy **on whichever side holds it, remote included, after re-reading both copies**, which converges without any receipt. Receipts are one executor; direct remote compaction is another. The genuine residue is the **explicit player deletion**: under claude's design it resurrects on the deleting device (or is held back by O2 — itself new machinery of tombstone-like size), and the player's choice is honoured nowhere else.

T3 says the card-detachment edge case alone cannot kill the capability. Gpt's version-specific record is precisely the design the edge case cannot defeat: absence never mints a record, so a detached card fails closed, while a deliberate delete names the exact bytes it retires, so a stale record cannot remove a path's later occupant. Claude's remaining argument is scope — but its own O2 hold-back is comparable machinery, so scope does not bear the weight either.

**Settling evidence:** (a) does ES's delete path offer one hookable point? `GuiSaveState.cpp` is *not embedded* — the corpus knows only from `repo/issues/issue-24.md` that `GuiSaveState.cpp:236` calls `renumberSlots()` after deletion. This is now a load-bearing corpus gap (§8). (b) Fixture: delete on A → sync → B syncs → the version retires on B without resurrection, and a replayed/stale record cannot remove a later occupant of the path. **Predicted settlement:** gpt's form, conditional on the hook existing; if it does not, reconciler-observed move/compaction receipts still cover D-CLOUD-030, and explicit deletes fall back to resurrection + hold-back until the hook ships. One product call goes to the maintainer [M]: gpt's "whose synced-library effect is made clear" — the savestate manager's delete must say it removes the state on other devices too.

### D2 — Hashless-backend verification at game exit: substantive, small; settles to claude, with gemini's deferral as the measured fallback

`claude-revised_plan-r2.md` §2.5.2 pays a download-and-hash on hashless backends at exit (my round-2 position, which it adopted). `gemini-revised_plan-r2.md` §4.2 defers hashless verification to the full pass, leaving exit a fast-path upload. The deferral's cost: a same-size SRAM change on the QA WebDAV is invisible to a size-only comparison — the #53 shape (`cloud_backup` comments [V]) — so the save the player just made sits unverified until the next boot or menu pass, and the card must not claim otherwise. **Experiment:** Gate 6 timing on H700 → WebDAV, one changed 64 KiB `.srm`, same size. One targeted download + `sha256sum` is ~1–2 s on the measured budget (`repo/.claude/rules/rclone-cloud-sync.md`: rclone start ≈ 1 s, round trip 1–2 s). **Predicted settlement:** claude; if measurement blows the budget, gemini's deferral with an honest "waiting" card — never "safe in the cloud".

### D3 — `remote_hash` at exit: small; settles to claude's spawn A, gated on measurement

`claude-revised_plan-r2.md` §2.5.2 step 4 computes the backend hash locally (`rclone hashsum <type>`, or busybox `md5sum` on md5 backends) so the *next* exit push for the same game can confirm C = A without a listing; without it, a second changed session before any full pass defers. `gpt-revised_plan-r2.md` §5.2: "Do not add a standalone post-upload listing merely to fill `remote_hash` … A manifest with `remote_hash: null` is valid." Gpt's framing misses that claude's spawn is not a post-upload listing and is not for the manifest's vanity — it exists for the two-sessions-in-a-row case, which is the common case. **Experiment:** Gate 13 (`hashsum <type>` on local files, Dropbox's own hash type included) plus Gate 6 cost. **Predicted settlement:** claude, with its own degrade clause (drop spawn A, accept `observed: false`) if the number says so.

### D4 — `BACKUPPATH ≠ RESTOREPATH`: small; settles to gpt/gemini

`claude-revised_plan-r2.md` §2.2 refuses with exit 1. `gpt-revised_plan-r2.md` §9.3 and `gemini-revised_plan-r2.md` §4.3 treat the split root as an **import destination**: one-way copy in, no agreement written. The shipped config documents split roots as a feature ("Changing the below to be different from BACKUPPATH will prevent data from being replaced on restore" — `cloud_sync.conf` [V]), and the schema only *assumes* equality (schema §9). Under #22 the reconciler owns the write paths, so claude's refusal strands a shipped capability; the import reading preserves it without corrupting the sync state. **Settles:** gpt/gemini; the two-way reconciler still refuses the split, but the one-way import remains.

### D5 — `check_network_link`'s LAN false negative: small; settles to gemini

`cloud_backup` exits 4 when no default route exists [V]; a LAN-only or self-hosted remote on a route-less network then never syncs — and the rule file's own case is "a self-hosted or LAN remote needs no internet" (`repo/.claude/rules/rclone-cloud-sync.md` [V]). `claude-revised_plan-r2.md` documents it and keeps exit 4; `gemini-revised_plan-r2.md` §4.4 replaces the check for LAN remotes (probe the remote's resolved address, fall back to the route check for WAN); `gpt-revised_plan-r2.md` §5.3 agrees in principle. Note the interaction with claude's zero-spawn idle path: the idle path needs no network answer at all, so the fix only matters on the changed path, where a bounded probe is affordable. **Experiment:** no-default-route fixture against the loopback/LAN QA WebDAV. **Settles:** gemini.

### D6 — Foreign manifests in the tree: substantive but easy; settles to stage-only

`mistral-revised_plan-r2.md` §1.2: "Foreign manifests may sit in the tree as read-only caches." During cutover the legacy `cloud_backup` still runs, and the allowlist (`+ /savestates/**` [V]) will bulk-upload any manifest in the tree — republishing a stale foreign manifest over its producer's newer one, the exact hazard claude §2.4.3, gemini §2, and gpt §3.4 all design against (and which mistral's own ownership sentence contradicts in the same paragraph). **Settles:** foreign manifests live in the stage only, never the tree.

### D7 — Manifest in the payload spawn vs manifest-last commit: small; settles to claude

`gemini-revised_plan-r2.md` §2.5 rides the own manifest in the payload spawn via `--include` to save a spawn. But rclone does not guarantee intra-copy ordering, so the manifest can land before some payloads — a consumer then sees a manifest describing absent objects, which reads as "cloud lost it" (claude's row 11) on another device. `claude-revised_plan-r2.md` §2.4.2's manifest-last commit (payload, then manifest `copyto`, then agreement) exists precisely to close that window. The filter expressibility itself (include-then-exclude ordering among flags) is a Gate-13 check. **Settles:** claude's separate `copyto` unless the spike proves safe ordering; one spawn is the price of a commit point.

### D8 — Converged, listed only because the corpus has not settled them

These are [C] — council agreement, not corpus truth. Naming them so a reader knows what is reasoning: bisync's demotion (the IA and #22 still say bisync detects [V]; the spike has not run); the queued wizard trigger (contradicts IA rev 4's automatic open [V]; needs the maintainer's IA amendment); the manifest-detector fitting the exit budget (every number is a prediction until Gate 6); `--backup-dir` archiving the replaced object atomically per backend (the corpus shows it used only in `cloud_backup`'s `sync` branch [V]; with `copy` it is unmeasured); auto states as the commonest conflict (schema §4 asserts; `es/SaveState.cpp` shows numbered-slot launches restore `.auto` from `.bak` at exit, so only auto-resume sessions rewrite it — a census question); unit groupings (nobody has inventoried what PPSSPP/Flycast/Mupen actually write per save). Retention-ON has *left* this list — the maintainer's amendment settled it.

---

## 3. Load-bearing claims, re-tested against the corpus

**Verified source-visible, all four plans may rely on them:**
- `getNextFreeSlot()` returns −99 on an auto-only repository: the auto state sits in the vector with slot −1, the 99999→0 scan finds nothing (`es/SaveStateRepository.cpp` [V]). And the auto-resume launch path appends `-state_slot <nextSlot>` unconditionally (`es/SaveState.cpp` `setupSaveState`, slot == −1 branch [V]) — so the −99 reaches RetroArch's command line. What RetroArch does with slot −99 is [K]; the adapter (all four plans) is mandatory, and the confirming experiment must launch *from the auto state*, since the new-game path swallows the −99 behind `nextSlot > 0`.
- `copyToSlot()` returns true whatever `renameFile`/`copyFile` did, and `makeStateFilename(fullPath = true)` derives the destination from the *source's* parent (`es/SaveState.cpp` [V]) — a staged cloud state's copy would land in the stage directory. The checked adapter must compute destinations from the config templates itself.
- The exit upload is `copy` with no `--update`, and `--backup-dir` exists only in the `sync` branch (`cloud_backup` [V]) — the one-way stopgap is destructive; all four concede; D-CLOUD-029 stands.
- `.state.auto.bak` matches the allowlist's `+ /**/*.state*` and neither of ES's regexes (`cloud_sync-rules.txt`, `es/SaveStateConfigFile.cpp` [V]) — it syncs and is invisible to ES; exclusion must be a command-line flag because user rules merge *ahead of* defaults (`cloud_sync_helper` [V]) and command-line `--exclude` outranks `--filter-from` (`rclone-cloud-sync.md` [V]).
- A non-empty `RCLONEOPTS` silently replaces the default option set including `--filter-from` (`cloud_backup` `load_config` [V]) — option hygiene is load-bearing.
- rclone's exit 3/4 pass through `clean_exit` and render as friendly skips in `ThreadedCloudSync` (`cloud_backup`, `es/ThreadedCloudSync.cpp` [V]) — normalised statuses (claude §2.11, gpt §8) are a real fix for a real collision.
- Creating any `es_savestates.cfg` flips `racommands` to false and changes autosave/incremental defaults versus the compiled `Default()` (`es/SaveStateConfigFile.cpp`, `es/SaveState.cpp` [V]) — the #10 rehearsal gate (all four) is earned.
- Exit-time renumbering is *conditional*, not every exit: `onGameEnded` runs only when `saveStateInfo` exists, the `racommands` branch returns early for slot < 0, and `renumberSlots` runs only for incremental configs (`es/SaveState.cpp`, `es/FileData.cpp…l740-850` [V]). `gpt-revised_plan-r2.md` §1.2's correction of the overgeneralisation is correct.

**Unmeasured and must stay marked [K]:** `--backup-dir` with `copy` (which object, atomicity, cost); `lsjson --files-from`; `hashsum <type>` on local files; single-object copy appearing whole; the boot-race byte loss (mechanism source-visible — SRAM flush every 10 s per schema §4 — loss itself reproduced, not observed); auto-state conflict frequency; every spawn/time number.

**Errors found:**

- `gemini-revised_plan-r2.md` §2.4: "`--backup-dir` … makes lost races *recoverable* **without extra spawns**." The spawn count is not the cost axis — server-side copy/rename requests are, and they are unmeasured; `gpt-revised_plan-r2.md` §1.2 already refuted the "zero extra round trips" form. Restate as "no extra rclone *processes*; request cost measured at Gate 2".
- `gemini-revised_plan-r2.md` §1: the claim that receipts are *required* for D-CLOUD-030 convergence is stale (§2, D1) — direct remote compaction also converges. Receipts earn their place on the explicit-delete case, not the duplicate case.
- `gpt-revised_plan-r2.md`: no factual errors against the corpus found. Its defect is scope (T1), not correctness.
- `claude-revised_plan-r2.md`: the split-root refusal (D4) and the ES-death gap in its marker design (§5 below) are the only correctness-adjacent weaknesses; everything else checked out, including its concessions.
- `mistral-revised_plan-r2.md` — four errors, each load-bearing if lifted:
  1. §2: "**D-CLOUD-029 is withdrawn**." The register shows D-CLOUD-029 *decided* — no stopgap, paths stay until #22 replaces them (`repo/docs/decision-register.md` [V]). A decided row is binding unless reopened; "withdrawn" misstates register discipline and the decision's content.
  2. §1.1: "provisional-agreement rows … are all implemented." `claude-revised_plan-r2.md` §1.1 *withdrew* provisional agreement as a permission concept. Mistral lifts a table containing rows its author retracted.
  3. §2: "`rom` is the matched stem under `nofileextension = true` (claude §3.2 R9)." Claude withdrew this in the same §1.1; schema §6 defines `rom` as the ROM file name *recorded, not re-derived* ("told, not discovered", §9). Mistral adopts a retracted position that contradicts the signed schema.
  4. §1.1 and Gate 1: "Budget: ≤ 2 rclone spawns … **proven** on H700." Nothing has run; the round-trip suite has never executed (`repo/issues/issue-35.md`, `repo/tools/cloud-round-trip` [V]). Claude's honest accounting is 0 spawns idle, 3–4 changed. A gate written to a guessed number will either fail falsely or be quietly edited.

---

## 4. What each plan uniquely has (lift candidates)

**`claude-revised_plan-r2.md`:**
- The 14-row verdict table with the **clock-free in-flight rule** (§2.3.1 rule 4: an object no manifest explains is `unknown` for two consecutive full passes, then escalates to legacy download-and-hash) — the only complete answer to the mixed-version cutover that uses no clocks.
- The **result file + run id** (§2.11): ES compares the run id it issued with the one in the file; a missing or stale result is *unknown*, never success. Nobody else has the anti-stale-result mechanism.
- §7's unknown-unknowns, each with a cheap experiment: path-bytes round-trip through Dropbox's case/Unicode normalisation (phantom cloud-only/device-only pairs), Dropbox write-rate limits on many small operations, wrong-clock archive pruning (prune by count, never date), stage-and-tree on different filesystems (install = copy-then-verify), the thirty-item controller-only walkthrough gate.
- The hold-back (O2): the only design that lets a deleting device stop re-downloading without propagating the deletion.

**`gemini-revised_plan-r2.md`:**
- The **LAN-only reachability fix** (§4.4) — unique, correct, and cheap; the corpus's own rule file demands "reachability means the remote, not the internet".
- The honesty marker on consensus itself (§2.1: "unanimously agrees … but **unmeasured** until the bisync spike runs") — the discipline the whole round needs.

**`gpt-revised_plan-r2.md`:**
- **Version-specific retirement records** (§4.3) — the design that survives T3; see D1.
- **Retention-count exemptions** ("unresolved conflicts and incomplete transactions are exempt from this rolling count") and the warning that the discard store, pending plans and retained bytes "are **not disposable caches**, despite residing below `/storage/.cache/`" — the IA doc's own convention is that `.cache` contents *self-invalidate* (`repo/docs/conflict-wizard-ia.md` [V]); without this sentence, some future cleanup will correctly-by-convention delete the discard store.
- "Say **'No new saves to upload'**, not 'The cloud is fully in sync'" (§5.2) — the honest-outcome wording, liftable verbatim.
- The lifecycle-gate requirement that ownership **survive ES dying while the emulator lives** (§3.1) — claude's tmpfs marker written by ES does not specify this case, and `engineering-practices.md` documents ES aborting and being restarted [V].
- The **cloned-card experiment as mandatory** (§3.4) vs claude's optional O4 — two live devices sharing one `cloud_device_id` is a *supported* misconfiguration (`cloud_device_id` [V]: "the file can be edited to adopt another device's folder").
- "Never rewrite the manifest merely to refresh `generated_at`" (§3.2) — kills manifest churn on every exit.
- The split-root import destination (§9.3); see D4.

**`mistral-revised_plan-r2.md`:**
- The **inline full-entry JSON amendment** (§2) — as a documentation form for #20's thread, one amended entry shown whole beats a field table; lift the *form* (with the content errors of §4.4 stripped).
- `kind: "container"` for shared VMU/memcard units — arguably cleaner than overloading `rom: null` (gpt/gemini); either is acceptable, but the schema should pick one deliberately.
- "The conflict table is lifted verbatim into #22's ACs" — the right execution instruction, applied to the *corrected* table.

---

## 5. What should not be built

- `gpt-revised_plan-r2.md` §8's **V1 minimal native recovery route** — descoped by the maintainer; move it, nearly intact, to the separate restore-tool issue.
- `mistral-revised_plan-r2.md`'s **≤2-spawn gate**, **in-tree foreign manifest caches**, **provisional-agreement rows**, and **matched-stem `rom` rule** — §4.4.
- `gemini-revised_plan-r2.md`'s **stamp-keyed stores** and any retirement cap that *drops* records rather than deferring them.
- `claude-revised_plan-r2.md`'s **spawn A**, conditionally — build it, but its own degrade clause applies if Gate 6 puts the changed path over budget; **O4** (`writer_instance`) stays optional while gpt's cloned-card *experiment* runs regardless.
- Anything the four already refuse in chorus, kept refused: a staging mirror of the remote tree, a protected-publication store in V1 (unless Gate 2 flips it), tombstones hooked anywhere but the verified delete path, an in-tree discard store, SQLite, a daemon, vector clocks, semantic merging, progress heuristics that *select* a winner, time-based classification, a prompt at launch, and any production role for bisync before question zero is answered.

---

## 6. Where I changed my mind since my revision

1. **The resolution receipt is load-bearing.** I raised the ping-pong reversal (two disagreeing resolutions, no missing state) but did not specify the mechanism. `claude-revised_plan-r2.md`'s `resolves` (§2.3.6) and `gpt-revised_plan-r2.md`'s narrow receipt (§4.4) are the same answer in different clothes: a publication records the versions the player chose *over*, so the next pass applies an informed choice and asks about an uninformed one. I adopt it — per publication, never a permanent stigma on bytes.
2. **Compaction should act on the remote copy.** I held conservative resurrection for everything. `claude-revised_plan-r2.md` §2.3.2's direct remote compaction after re-reading both copies is lossless by construction and converges; my position would have left the upload/compact loop gemini described.
3. **Explicit deletions should propagate as version-specific records.** Post-amendment, my pure-resurrection stance rests on exactly the edge-case argument T3 disqualifies, and gpt's record design answers the indistinguishability problem directly. I keep fail-closed on *unexplained* absence; I drop "never propagate".
4. **The store must be designed for its future reader now.** My out-of-tree placement was necessary but not sufficient; the amendment's one V1 consequence is the sidecar of §1.2.
5. **The honest spawn accounting is 0 idle / 3–4 changed.** Claude's capture-before-network ordering and hash-selected change set convinced me the two-spawn figure I had hand-waved was wrong; the idle path can and should cost zero rclone starts, strictly under D-CLOUD-028.

I hold, against the remaining resistance: verify-by-download on hashless backends at exit (D2), the content-addressed stage as cache-not-authority, manifest transport ownership, and the queued trigger.

---

## 7. What I would build from

**Base: `claude-revised_plan-r2.md`.** It is the most complete and internally consistent artifact: the verdict table, transport rules, exit-path design, adapter contract, plan file, normalised statuses, gate ordering, and honest [V]/[K]/[C]/[M] marking. Its defects are few and each has a named fix.

**Lift into it, before building:**
- From `gpt-revised_plan-r2.md`: version-specific retirement records (D1) with the mass-delete guard and the stop-mutation-not-drop-records rule; the split-root import destination; retention-count exemptions; the ".cache is not disposable" warning; the ES-death survival requirement for the lifecycle gate; the mandatory cloned-card experiment; "never rewrite the manifest merely to refresh `generated_at`"; "No new saves to upload".
- From `gemini-revised_plan-r2.md`: the LAN-only reachability fix (D5).
- From `mistral-revised_plan-r2.md`: the inline-JSON form for the schema amendment; a deliberate decision between `kind: "container"` and `rom: null`.
- From the amendments themselves: the §1.2 discard sidecar; the done-page sentence made explicit everywhere; no undo control anywhere in V1; gpt's recovery-route design re-homed to the separate restore-tool issue as its seed.

The resulting document is claude's architecture with gpt's deletion semantics and the amendment's retention contract — and every number in it still gated on hardware, in the order claude's §8 gives.

---

## 8. Corpus gaps surfaced to the orchestrator

Newly load-bearing this round: **`GuiSaveState.cpp`** — the delete path is now the proposed home of explicit-delete tombstones (D1), and the corpus holds it only as a citation in `issue-24.md`. Also still missing and needed: `SaveState.h`/`SaveStateRepository.h` (default arguments), `Paths.cpp`, `setsettings.sh` (RetroArch `savestate_directory`), rclone 1.75.0 documentation or source for `--backup-dir` with `copy`, `lsjson --files-from`, `hashsum` on local paths and the Dropbox hash type, `docs/es-ui-style-guide.md`, and the current issue bodies with edited ACs. No executed test results of any kind exist in the corpus; every gate remains a gate.

---

## `corpus.provenance.json`

```json
{
  "artifact": "kimi_peer_review-r3.md",
  "role": "council member, round-3 peer review of the four injected revised approaches",
  "corpus_mode": "verbatim embedded read-at-time corpus supplied by Council Facilitator council-facilitator@1.2.0",
  "source_count": 42,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "member_filesystem_access": false,
  "member_independently_reread_files": false,
  "member_independently_rehashed_files": false,
  "member_executed_commands_or_hardware_tests": false,
  "hash_basis": "sha256 values copied verbatim from the supplied per-source headers; verified at embed time by the Facilitator",
  "injected_plan_artifacts": [
    "claude-revised_plan-r2.md",
    "gemini-revised_plan-r2.md",
    "gpt-revised_plan-r2.md",
    "mistral-revised_plan-r2.md"
  ],
  "injected_plan_hashes_provided": false,
  "own_earlier_revision_embedded": false,
  "amendments_applied": [
    "maintainer restatement of purpose: reversibility first-class, one step back is the depth that matters, edge cases inform but do not drive",
    "maintainer decision: V1 retains discarded copies ON by default bounded by a count, ships no undo control; restore becomes a separate wizard-shaped tool; the V1 store must be designed for that future reader"
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
    {"description": "GuiSaveState.cpp — now load-bearing: the delete path is the proposed home of explicit-delete retirement records (D1)", "declared_source_path": null, "sha256": null},
    {"description": "SaveState.h, SaveStateRepository.h, Paths.cpp, setsettings.sh and the RetroArch launch plumbing", "declared_source_path": null, "sha256": null},
    {"description": "rclone 1.75.0 documentation or source for --backup-dir with copy, lsjson --files-from, hashsum on local paths, Dropbox hash type on local files", "declared_source_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md; current issue bodies with edited ACs; any executed test results", "declared_source_path": null, "sha256": null},
    {"description": "kimi-revised_plan.md and the other round-2 artifacts, known here only through the injected plans' citations", "declared_source_path": null, "sha256": null}
  ],
  "missing_source_policy": "No missing source paths, hashes, file contents, or execution results have been fabricated."
}
```

=== END kimi_peer_review-r3.md ===

=== START mistral_peer_review-r3.md ===

I have reviewed the five revised approaches for the cloud-save conflict resolution foundation in ROCKNIX. Below is my analysis, focusing on the real disagreements, load-bearing claims, and what each plan uniquely offers.

---

## 1. Real Disagreements and How to Settle Them

### 1.1 Deletion Propagation
**Disagreement:** Whether deletions should propagate in V1, and if so, how.
- **`claude-revised_plan-r2.md` and `kimi-revised_plan-r2.md`:** Propagate only recorded deletions (ES deletions, renumbers, compactions, wizard choices) as moves into dated siblings. Unexplained absence fails closed.
- **`gemini-revised_plan-r2.md` and `mistral-revised_plan-r2.md`:** Never propagate deletions in V1; treat absence as a fail-closed anomaly.
- **`gpt-revised_plan-r2.md`:** Propagate only version-specific retirements with receipts, never deletions inferred from absence.

**Settlement:** The churn trace in `kimi-revised_plan-r2.md` (C1) proves that pure resurrection cannot terminate. The receipts-and-siblings mechanism is the minimal solution that converges. The fail-closed half of `gemini` and `mistral`'s argument is preserved: unexplained absence fails closed. The residual is bounded churn, which is annoying but never lossy.

**Experiment:** The churn-termination fixture (cloud-only `state5` onto `{0,1,2}`; download; launch and exit; sync twice; assert one copy per side, no churn, the retired cloud copy in the dated sibling).

---

### 1.2 Concurrency Contract
**Disagreement:** Whether `--backup-dir` in both directions is sufficient for recoverability, or if a protected-publication protocol is needed.
- **`claude`, `gemini`, `kimi`:** `--backup-dir` in both directions is sufficient for V1 under the one-player model.
- **`gpt`:** A protected-publication protocol is needed for linearizability.
- **`mistral`:** The pre-upload check alone cannot close the window.

**Settlement:** The one-player model does not earn a two-phase commit on a 5-second path. `--backup-dir` is the chosen mechanism, with the residual stated honestly: recoverability, not prevention. The race fixture (§11, gate 7) will prove whether `--backup-dir` preserves intervening heads on Dropbox and WebDAV.

**Experiment:** The two-H700 race fixture (interleave publications; kill after each destructive stage; assert both heads present, one canonical, one siblinged).

---

### 1.3 How C's Bytes Are Obtained
**Disagreement:** Whether to use a full staging mirror or candidate-scoped reads.
- **`kimi` and `claude`:** Candidate-scoped reads with the full stage as a hashless fallback.
- **`gpt`:** Full staging mirror as the default.
- **`mistral`:** Metadata-only detector.

**Settlement:** The full staging mirror is blind to same-size changes on hashless backends (the #53 shape). Candidate-scoped reads are the correct default, with the full stage as a fallback for backends offering neither hash nor modtime. The shadow census (§11, gate 8) will measure the cost of the fallback mode.

**Experiment:** The same-size WebDAV fixture (change a cloud SRAM preserving size; the classifier must not conclude "cloud unchanged").

---

### 1.4 Bisync's Role
**Disagreement:** Whether bisync should be the detector or a candidate transfer engine.
- **`claude` and `kimi`:** Bisync is a candidate transfer engine pending the spike.
- **`gpt` and `gemini`:** Bisync is demoted; the classifier is ours regardless.
- **`mistral`:** Bisync is the detector.

**Settlement:** The problem statement listed bisync-as-detector as the approach under judgement, but no register row made it binding. The spike (§11, gate 2) will decide whether bisync earns the bulk-transfer role for non-conflicting units. The classifier is ours regardless.

**Experiment:** The bisync spike matrix (§11, gate 2).

---

### 1.5 #10's Per-Core Directories
**Disagreement:** Whether #10 should be deferred.
- **`kimi` and `gpt`:** Defer #10 to its own futro, with proof obligations and a real-device rehearsal as gates.
- **`claude` and `gemini`:** Keep #10 in the drop, sequenced last.
- **`mistral`:** #10 is unnecessary.

**Settlement:** Shipping `es_savestates.cfg` is a launch-behaviour migration, not a config change. The wizard does not need the directory, but the flat layout's local cross-core overwrite is pre-existing shipped behaviour. #10 gets its own futro, and the rehearsal gate ensures the launch behaviour is preserved.

**Experiment:** The #10 launch-behaviour rehearsal (§11, gate 5).

---

### 1.6 Wizard Trigger, Retention Default, Cancellation, Auto KEEP BOTH, Kid Mode
**Settlement:** Queue-and-badge trigger (IA rev 5); retention ON with count 3 (register row); gpt's precise cancellation sentence; the resume-side sub-choice for auto KEEP BOTH; gpt's kid/kiosk rule over mistral's reachability requirement.

---

## 2. Load-Bearing Claims That Need Testing

| Claim | Experiment | Outcome |
|---|---|---|
| `--backup-dir` preserves the intervening head under a two-writer race | Race fixture (§11, gate 7) | If pass: ship as designed. If fail: adopt gpt's protected-publication protocol before multi-device ships. |
| The exit upload overwrites the cloud head of a fork | Cheap counterexample (§11, gate 1) | Corpus-settled; no experiment needed. |
| The session-zombie resume-point loss | H700 reproducer (§11, gate 3) | Corpus-traced; the lifecycle gate is the fix. |
| Foreign-manifest republication | Round-trip fixture (§11, gate 1) | Corpus-settled; the fixture verifies the hazard. |
| Auto states are the commonest conflict | Shadow census (§11, gate 8) | The wizard treats `kind: auto` as a resume-point decision regardless. |
| 480×320 thumbnails are recognizable | RG351M recognition test (§11, gate 9) | If fail: single-column compare as fallback. |
| `--filter` vs `--filter-from` ordering | Dry run (§11, gate 0) | If `--filter` cannot be ordered ahead, use `--exclude`/`--include`. |
| `rclone hashsum <backend>` computes backend-native hashes locally | Device experiment | Not a dependency; the exit path can defer to the next full pass. |

---

## 3. What Each Plan Uniquely Offers

### `claude-revised_plan-r2.md`
- **Intent-recorded deletion receipts propagated as moves into dated siblings.** This is the minimal mechanism that terminates D-CLOUD-030's compaction.
- **The reflash bootstrap.** A reflashed device regenerates the same `cloud_device_id` and seeds from its own previous manifest before its first capture republishes.
- **The lifecycle gate with fixed acquisition order.** This closes the boot-sync vs gameplay race structurally.

### `gemini-revised_plan-r2.md`
- **The `--backup-dir` retention seed.** This is the recoverability mechanism adopted by `claude` and `kimi`.
- **The #10 launch-behaviour rehearsal as a real-device pre-implementation gate.** This ensures the launch behaviour is preserved after shipping `es_savestates.cfg`.
- **The one-sentence D-CLOUD-029 confirmation.** "The stopgap merely moves the clobber from game-exit to boot."

### `gpt-revised_plan-r2.md`
- **The unit-level member-map classifier.** This is the correction to `kimi`'s per-file aggregation (C6).
- **The D-CLOUD-030 clarification.** Compaction concerns numbered states in one game/core repository, idle, after verified copies; never collapses an auto resume point into a numbered slot.
- **The `makeStateFilename` parent-derivation finding.** A staged-in-/tmp state would merge into /tmp — stage in the real save directory under a temp name.
- **The eight #24 acceptance criteria.** Especially "standalone-emulator states never allocate" (`isEnabled` requires `retroarch`).

### `kimi-revised_plan-r2.md`
- **The ops journal + receipts.** This makes `replaces` correct across the rename-then-edit sequence.
- **The discard store outside the sync tree.** This avoids sync-tree contamination and requires no allowlist exclusions.
- **The shadow census.** This measures fork rate per kind, verdict distribution, unknown rate, and the exit-path cost in spawns, round trips, and seconds.
- **The ordered hardware gates with a defined shadow census.** This ensures the foundation is proven before it is built.

### `mistral-revised_plan-r2.md`
- **The out-of-scope fence.** This is a builder needs it as much as the plan.
- **The IA-text corrections for rev 5.** The "checked, not assumed" paragraph is wrong about `getNextFreeSlot()` for the auto-only case.
- **Move observation as a first-class mechanism.** This is the correction to `gpt`'s reconstruction-after approach.

---

## 4. What Should Not Be Built

- **A protected-publication protocol in V1.** The one-player model does not earn it on a 5-second path.
- **A separate apply journal beyond the frozen plan with per-unit status.** The frozen plan is the journal.
- **The full staging mirror as a default mode.** It is blind to same-size changes on hashless backends.
- **Semantic binary merging, vector clocks, a shared database, a SQLite history index, a daemon.** These are out of scope for V1.
- **A 99-slot product cap to work around the allocator defect.** The allocator defect is fixed in the adapter.
- **Permanent loser memory as automatic authority.** A deliberately restored file is a new version, not a stigmatized one.
- **Tombstones for hypothetical external writers.** Receipts cover our recorded operations only.
- **A kid/kiosk-mode resolver.** A kid resolving save conflicts destructively is what kid mode exists to prevent.
- **Progress heuristics that select a winner.** The cardinal rule forbids it.

---

## 5. The Plan I Would Build From

I would build from `kimi-revised_plan-r2.md`, with the following additions from the other plans:

1. **From `claude-revised_plan-r2.md`:**
   - The reflash bootstrap.
   - The lifecycle gate with fixed acquisition order.
   - The in-spawn manifest transport filters.

2. **From `gpt-revised_plan-r2.md`:**
   - The unit-level member-map classifier.
   - The D-CLOUD-030 clarification.
   - The `makeStateFilename` parent-derivation finding.
   - The eight #24 acceptance criteria.

3. **From `gemini-revised_plan-r2.md`:**
   - The `--backup-dir` retention seed.
   - The #10 launch-behaviour rehearsal as a real-device pre-implementation gate.

4. **From `mistral-revised_plan-r2.md`:**
   - The out-of-scope fence.
   - The IA-text corrections for rev 5.

---

## 6. What Would Change My Mind

- **The race fixture (§11, gate 7):** If `--backup-dir` does not preserve intervening heads on Dropbox or WebDAV, gpt's protected-publication protocol becomes load-bearing before multi-device ships.
- **The shadow census (§11, gate 8):** If the decision-scoped download set is large on the maintainer's library, the full-stage fallback is priced and accepted for hashless backends only.
- **The bisync spike (§11, gate 2):** If bisync satisfies the contract and materially simplifies full-pass transport, it earns the bulk-transfer role for non-conflicting units.
- **The #10 rehearsal (§11, gate 5):** If the XML path cannot preserve launch behaviour, the appropriate resolver/configuration behaviour is changed deliberately; the naive config is not shipped.

---

## 7. Final Recommendation

Build from `kimi-revised_plan-r2.md` with the additions above. It is the most complete, safest, and most thoroughly tested foundation for cloud-save conflict resolution in ROCKNIX. The ordered hardware gates ensure the foundation is proven before it is built, and the shadow census ensures the design is tuned to the maintainer's real library. The receipts-and-siblings mechanism is the minimal solution that terminates D-CLOUD-030's compaction, and the lifecycle gate closes the boot-sync vs gameplay race structurally. The wizard's queue-and-badge trigger is the correct console-first design, and the discard store outside the sync tree avoids sync-tree contamination.

=== END mistral_peer_review-r3.md ===

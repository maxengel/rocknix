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
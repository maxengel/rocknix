# Council Step 1 — Initial Analysis: one home for earlier versions (`Saves/.history/`)

**Posture.** I judge the delta (`repo/docs/save-history-plan-delta.md`) against the plan of record (#22/#23/#25, D-CLOUD-030..053) under the binding rulings D-CLOUD-095..100, D-UI-039, D-QA-015/017. I reopen no register row outright; I identify two rows the delta *already amends without saying so* (D-CLOUD-047, D-CLOUD-046) and one it supersedes without citing (D-CLOUD-042), and I argue the delta must carry those citations. Where I reason about rclone filter semantics or network costs, that is inference from the corpus plus tool behaviour, and I say so; each such claim comes with the VM experiment that settles it.

**Corpus gaps I worked around** (surfacing per instructions): the full `cloud_backup`/`cloud_restore` scripts are not embedded — only the set-aside excerpts — so I cannot see the complete `all_opts` construction (specifically whether `--delete-excluded` appears anywhere, and whether the settings-archive phase carries its own `--backup-dir`); `upgrade-and-install.md` is quoted in the commission but not embedded; the unit table, `docs/conflict-wizard-ia.md`, `docs/save-manifest-schema.md`, and `engineering-practices.md` are referenced but not embedded. Nothing below rests on inventing their contents; two verification items depend on the missing script text and are flagged as such.

**Headline.** The delta is sound and I endorse all nine of its changed rows — seven outright, two with amendments that are specifications rather than additions. It weakens exactly one structural property of the plan of record: the store's exclusion from the sync boundary changes from *by construction* (a sibling, outside the allowlist) to *by rule* (a first-match exclude), and that weakening is real because rules files are user-editable and old images persist in a fleet. It strengthens every other property it touches: it closes the two gaps the plan of record openly admitted (undecided replacements, no validity check — `repo/docs/save-history-gap-analysis.md` §2.1–2.2), resolves D-UI-022's residual vocabulary problem, and turns deletion retention from a one-run accident into a recorded event. It also contains one internal contradiction (claims D-CLOUD-047 is unchanged while introducing `reason: deleted` and retiring the `-replaced/` sibling that 047 names as the record for propagated deletions) that must be fixed before the delta is locked.

---

## 1. Does the delta weaken any property the plan of record relies on?

### Row-by-row verdicts

| Delta row | Verdict |
|---|---|
| Store at `<SAVES_REMOTE>/.history/<unit>/<seq>/`, `reason` field, READMEs | **Endorse, amended** (register citations; commit-point ordering; old-image defence) |
| Retain-before-publish on every overwriting publish | **Endorse, amended** (atomic deferral with the ceiling; dedupe; copy never move) |
| `--backup-dir` retired once R1 holds | **Endorse** (the conditioning is the safety) |
| Allowlist: `- /.history/**` first, `.snapshots` rule dropped | **Endorse, amended** (write it into the shipped file, not only the reconciler's prepends) |
| Settings nested behind SAVE HISTORY | **Endorse** (with key-migration and range wording notes) |
| #25 reads one store, `reason` as the label | **Endorse** (resolves D-UI-022's residual) |
| `suspect` class with auto-heal | **Endorse, amended** (both directions; both-suspect; D-CLOUD-046 rider) |
| Save states, auto-states included | **Endorse** (binding D-CLOUD-099; size interaction flagged) |
| Public docs show the layout | **Endorse** |

### 1.1 The store's location: the one real weakening, and its price

The plan of record puts the store at `<SAVES_REMOTE>-discarded/`, "outside the allowlist by construction" (`issues/22.md` R9). Construction cannot be edited by a user, lost in a migration, or absent from an old image. The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**`.

That this is a live risk and not a formality is shown by the corpus itself. The shipped allowlist (`repo/code/cloud_sync-rules.txt`) includes `+ /**/*.srm`, `+ /**/*.sav`, `+ /**/*.state*`, `+ /**/*.dsv*`, `+ /**/*.eep` and friends — patterns that match at *any depth*, and rclone filters have no dotfile special-casing (inference from rclone semantics; the delta's own authors confirm the belief by adding the exclusion at all). The store's members sit "at their basenames" (`issues/22.md` R9), so under any rules file lacking the new exclusion — a pre-delta image, or a user's own filter file, which D-CLOUD-088 explicitly lets them keep — every save and state in `.history/` is *in scope* for transfers. Consequences, in increasing order of severity:

- An old-image **restore** copies the store's members down to `/storage/roms/.history/…`: card clutter on the device D-CLOUD-096 promised would never grow ("in the cloud, so no card grows"), and a visible folder the player was told was hidden.
- An old-image **sync-mode backup or MATCH THIS DEVICE TO THE CLOUD** (the menu's "only action that deletes", `repo/docs/es-menu-map.md`) treats the cloud's `.history/` members as included files absent locally and *deletes them from the cloud*. The shipped `--backup-dir` catches them into `Saves-replaced/<stamp>/` — one run deep, pruned on the next run (`repo/code/cloud_backup-set-aside-excerpt.md`). The save bytes are shredded out of the store while `record.json` and PNG files (no include matches them) survive as orphans pointing at nothing. This is the same shape as the 70-file deletion that motivated D-CLOUD-014, re-entering through the new folder.

The fleet today is the maintainer's own devices (D-UI-022: "I'm the only one using this"), sync is a non-default choice (D-CLOUD-014 sets `copy`), and R1's cutover is one image — so the probability is low *now*. But the project's own register names "a delete made on a device still on the old firmware" as a cause to design for (D-CLOUD-037), and the store's entire purpose is surviving mistakes. **Amendment:** make the migration's fold of `Saves-replaced/` a *standing* full-pass behaviour (section 4), path-aware so that members landing in `-replaced/<stamp>/.history/…` are folded *back* to their original `<unit>/<seq>/` — the store then self-heals through the very mechanism that threatens it, with no name-mangling of members (the maintainer asked for clear names, and #25 restores byte-for-byte through the record regardless). Residual, stated honestly: two consecutive old-image sync runs with no new-image pass between them lose the first stamp. I accept that residual; the alternative (mangling member names to defeat `*.state*`'s trailing star) costs the human-browsability the maintainer asked for.

**Register hygiene on this row:** D-CLOUD-095 says it "replaces the two planned siblings (`-replaced/`, D-CLOUD-014's set-aside; `-discarded/`, D-CLOUD-036/#22 R9)" but does not name **D-CLOUD-042**, the row that fixed the store's folder as `Saves-discarded` beside the saves folder. The register's own discipline (D-CLOUD-041 was recorded, not edited) wants the supersession cited. Add it.

### 1.2 Retain-before-publish on every overwriting publish: the delta's core win

This is the only mechanism that can close gap §2.1, because the alternative is physically impossible: rclone rejects a `--backup-dir` overlapping its destination (D-CLOUD-014, verified against the real remote; restated in `repo/code/cloud_backup-set-aside-excerpt.md`), so a store *inside* the saves folder cannot be written by `--backup-dir` at all. `copyto`-then-publish is forced, and it is correct: it also unifies the wizard's retain path with the ordinary publish path into one mechanism with one record shape — the delta's real elegance.

Three amendments, all specifications:

1. **The retain and its publish are one atomic pair for deferral purposes.** D-CLOUD-046's admission ceiling defers oversized units to the next full pass. The retain bytes (≈ the published bytes) must count toward the ceiling, and when a unit defers, *both* the retain and the publish defer — a publish must never go out ahead of its retain because the retain was the half that fit. The ordering rule (D-CLOUD-036/041, #25: retain verified before the winner replaces anything) already implies this; the delta should say it.
2. **Copy, never move.** A server-side *move* of the head into the store looks cheaper but opens a window in which the head is absent — and an absent head with agreement on record is exactly the unexplained-absence question D-CLOUD-037 makes the player answer. `copyto` keeps the head present until the publish replaces it (rclone renames into place per file, D-CLOUD-076). Say "copy, not move" in the delta so nobody optimizes it later.
3. **Dedupe against the newest entry.** If the newest store record's sha256 equals the current head's (re-publish after an interruption, or two devices retaining the same head — section 2.2), skip the retain. One hash comparison, no transfer.

### 1.3 Retiring `--backup-dir`: endorse, with the condition named

The conditioning on R1 is doing all the work and is correct: until the reconciler is the only writer, the shipped set-asides are the *only* protection that exists (D-CLOUD-078's named gap is what they closed), and D-CLOUD-097 (binding) forbids an interim widening. Two notes: (a) Gate 7 ("where `copy --backup-dir` proves reliable") is mooted for saves the way D-CLOUD-044 mooted the bisync upstream question — say so; (b) the excerpt's comment ("the same reasoning already applies to SETTINGS_REMOTE", `repo/code/cloud_backup-set-aside-excerpt.md`) suggests the settings phase may carry its own set-aside — the delta retires only the saves one, and should say the settings phase is untouched (the full script text is a corpus gap; verify).

### 1.4 The allowlist row: endorse, with placement specified

First-match-wins (`repo/code/cloud_sync-rules.txt` header) means `- /.history/**` must sit with the database excludes at the very top, ahead of *every* include — the delta says this. Two specifications: (a) the rule belongs **in the shipped `cloud_sync-rules.txt` file itself**, not only in the reconciler's prepended arguments (`issues/22.md` R2), because D-CLOUD-088 now forces the file onto every run that doesn't name its own — the file is the fleet-wide lever, and the pre-R1 scripts read only the file; (b) dropping the `.snapshots` guard is fine (a guard with no writer, `issues/25.md`), but the row should note R2's `- /**/*.bak` guard stays, so nobody reads the row as replacing both.

### 1.5 Settings nesting: endorse

Consistent with D-UI-039 and D-UI-023; the menu map already carries the pending note (`repo/docs/es-menu-map.md`). Two notes: the renamed switch's underlying key needs the D-UI-022 precedent — *read-old-if-new-absent* so an upgraded device keeps its value; and "per save 3 to 5" (D-CLOUD-096) against D-CLOUD-036's "selectable 1 to 9" is ambiguous wording. #134's checklist ("default 3 or 5") shows the open question was the *default*, so read 096 as the default band and keep the 1–9 range — but the delta should say the range explicitly, because narrowing a player-facing range is a change to D-CLOUD-036 that nobody has argued.

### 1.6 The #25 reader: endorse

The `reason` field resolves D-UI-022's residual ("a copy a sync replaced without anyone deciding is not discarded by anybody") by construction rather than by a second labelling scheme — this is the delta's cleanest vocabulary move. Generalize R9's `discarded_by: "wizard"` to a writer/cause field (`exit-sync`, `full-pass`, `manager-delete`, `auto-heal`, `migration`); keep `schema: 1` per D-CLOUD-045's additive-fields precedent (no deployed readers exist).

### 1.7 The suspect class and auto-heal: endorse, amended

The heuristic (zero length or all one byte *where the previous version was neither*) is the D-CLOUD-034 cheapest-sufficient form of the gap analysis's format-aware gate, and its best property is that **a false positive is recoverable by construction** — the "suspect" is retained, so a wrong heal is undone through #25 like any other entry. Amendments:

1. **Both directions.** The delta text describes a suspect *device* copy. The cloud's head can equally be suspect (pre-cutover corruption, a desktop client). Generalize: the suspect side loses to the healthy side, whichever it is; if *both* sides are suspect there is nothing worth protecting — treat as an ordinary change.
2. **Run the check before the divergent verdict.** A both-changed pair with one suspect side is not a conflict — one side is not a version. Auto-heal rather than queue; the retention makes it reversible, which is D-CLOUD-032's own deciding question. This also keeps a damaged file out of the wizard, where asking a player to choose between a save and a zero-byte file is a question we can answer for them.
3. **The D-CLOUD-046 rider.** D-CLOUD-100's "the cloud's good copy is kept and **restored**" requires a fetch, and the exit path is defined as push-only (D-CLOUD-046; `issues/22.md` R5 "No fetches… on this path"). The rows conflict and the delta doesn't say so. The exit card is exactly where D-CLOUD-098 permits spending the player's attention (they just exited; the card is up), and the fetch is one unit's members, bounded. The delta should carry an explicit refinement to D-CLOUD-046: *one bounded fetch per suspect unit on the exit pass*. The alternative (defer the local restore to the next pass) lets the player launch into the suspect file first; the cascade is survivable (the good copy is in the store) but scruffy.
4. **Detection cost.** On hashed backends, "all one byte" needs no fetch: the sha256 of a uniform buffer of the observed size is computable locally in O(size) and compared against the listing hash (inference; the mechanism is standard). On hashless backends R4 already fetches to hash. So the check adds no round trips.

### 1.8 Save states, all of them: endorse

Binding (D-CLOUD-099) and right on the merits — the accidental overwrite of a state is the highest-value restore case, and the wizard's auto-rule (#23) already treats auto-states as first-class. The interaction to name: RetroArch states are 28–51 KB with ~48 KB PNGs (D-CLOUD-036), so count-bounded churn is cheap; but the PPSSPP directory case — which D-CLOUD-036 already defers to the census gate — can run to tens of MB per state, and 5 × 40 MB for one unit is most of the 256 MiB cap. The eviction precedence the delta leaves unstated (section 2.4) and the census measurement are both prerequisites to fixing the cap; D-CLOUD-096 already frames the numbers as starting points.

### 1.9 Public docs: endorse

One requirement: the README text and the docs page's layout table must be generated from one source, or the documentation-accuracy gate will catch them drifting apart every time the layout changes.

---

## 2. Concrete failure modes and ordering hazards

Each with the cheapest decisive experiment on the GENERIC_X64 VM and the #133 backends (D-QA-007/017: the VM answers first; nothing touches a person's device or cloud, D-QA-015).

### 2.1 The interruption matrix for retain-before-publish

The delta says "copyto … with a record, then publish" but never says *member first or record first*. That choice is the whole failure analysis:

- **Bytes first, record last, record is the commit point.** Kill between copyto and record: orphan bytes in a `<seq>/` with no record — swept by a later pass (a seq dir without a valid `record.json` past a grace age is garbage). Kill between record and publish: a redundant entry for a version still head — dedupe rule (1.2.3) absorbs it. Kill mid-copyto: rclone's temp-and-rename (D-CLOUD-076) leaves a `.partial`, not a truncated member; the sweep takes it.
- The reverse order (record first) leaves a record pointing at missing bytes — an entry #25 displays and cannot restore. Strictly worse.

**Amendment:** the delta must state bytes-first-record-last and the orphan sweep; this preserves R9's "finalized, coherent … only" invariant (I13/I18/I26) across the store's wider population. **Experiment:** extend the existing A7/A8 kill fixtures (`issues/22.md` acceptance) — `kill -9` the reconciler pre-retain, mid-copyto, post-retain-pre-record, post-record-pre-publish, mid-publish; assert on restart: no head ever replaced without a verified store entry, orphans swept, pending-publish completes. All on the VM pair against WebDAV.

### 2.2 Two devices publishing at once

The fresh-head check already serializes actual publishes (`issues/22.md` R5: push only when head equals agreement; a mismatch reclassifies as divergent → wizard). The new surface is the store write itself: two devices can `copyto` the same head into different seq dirs concurrently — seq carries the deciding device id (R9), so no collision; the result is at worst a duplicate entry (same bytes), absorbed by dedupe. The TOCTOU window between head-check and publish is one round trip and fails *safe* (an extra entry, never a missing one). **Experiment:** two VM guests, one backend, same unit, forced simultaneous publishes; assert one winner, one reclassification, zero torn seq dirs.

### 2.3 Same-device overlap — the hazard nobody named

D-CLOUD-093 took a deliberate trade: an orphaned rclone no longer holds the transfer lock, "so a new run can start beside one." Post-R1 the reconciler holds `L_T` itself, but a reconciler killed mid-pass can leave an orphaned rclone finishing a copyto while a *new* reconciler starts on the same device. Two same-device runs in the same second produce the same seq (`<decided_at UTC compact>-<device id>` has no run id — R9). **Amendment:** add the run id to the seq, or fail the retain on an existing seq dir. **Experiment:** orphan an rclone mid-retain (SIGSTOP the reconciler, SIGKILL it, restart), let the next pass run; assert no interleaved writes in one seq dir.

### 2.4 Pruning racing a publish

`L_T` is device-local (`/var/run/cloud_sync.lock`, R6) — it does *not* serialize across devices, so the store must be safe under concurrent writers by construction. It nearly is: retains are add-only into unique seq dirs; deletes are idempotent purges. The two rules that close it: **prune counts only entries with valid records** (an in-flight retain is invisible), and **never purge a seq dir younger than a grace window** (an in-flight retain is protected). Also: **no pruning on the exit path** — the shipped script already skips the prune on `--recent` runs as "a remote round trip the game-exit sync should not pay" (`repo/code/cloud_backup-set-aside-excerpt.md`); the same discipline keeps count enforcement on full passes, accepting that a unit transiently holds N+1 between full passes. **Experiment:** prune against a retain in flight behind the QA backend's bandwidth cap; assert the grace skip.

**Eviction precedence** (the delta lists three bounds and one exception but no order): per-unit count first (within the unit), then age, then total size (both across units, oldest first) — and *every* eviction checks the only-copy rule against a fresh head listing, because a decided deletion retained with `reason: deleted` is by definition the game's last copy anywhere, and the 90-day cap must not evict it (D-CLOUD-096's "never the only copy of a game" is load-bearing precisely for deletions). **Experiment:** fill past 256 MiB with a mix including a deleted game's only copy; assert it survives.

### 2.5 The README and `.history/` against `sync` mode and the allowlist

`README.md` matches no include and falls to `- /**`, so it never travels to devices (intended — it addresses someone browsing the cloud folder) and `sync` won't delete excluded files *unless* `--delete-excluded` is passed. **The excerpt does not show the full options** (corpus gap): **verification item — grep every writer for `--delete-excluded`; if present anywhere, it must go before `.history/` lands**, because it deletes excluded files without the `--backup-dir` safety net. **Experiment:** seed a cloud with README + `.history/`; run the shipped image's backup (copy and sync), restore, and MATCH; assert both files survive on the cloud and never appear on the device. This experiment also settles the `**`-matches-dotdirs inference in 1.1 — it is the single most valuable run in this section, needs no new code, and should happen this week.

### 2.6 Provider differences

Dropbox: server-side `copyto` (one API call, hash-preserving); its own 30-day versions are a bonus layer, not a reason to skip the store (D-QA-017 forbids Dropbox-shaped design). WebDAV: server-side COPY support varies by server — *measure per backend*. SFTP/SMB: rclone streams the copy through the device — the retain costs a download *and* an upload leg on the handheld's Wi-Fi, which is why the ceiling must count retain bytes (1.2.1) and why the store being the *only* history on these backends (gap analysis §2.5) raises the correctness bar there. **Experiment:** `rclone copyto` same-remote on each #133 backend; record round trips, server-side vs streamed, kill-residue naming, hash preservation. One afternoon, no new code.

### 2.7 Clock skew against the age cap

Seq names and `decided_at` come from device clocks, and the corpus knows devices have wrong clocks (`repo/code/cloud_backup-set-aside-excerpt.md`; #23's `clock_synced: false`). A clock set backward makes a fresh entry look old → the age cap evicts it early; forward makes entries immortal. The count and size caps are clock-independent and carry the load; the age cap should compare against `max(decided_at, the record's server-side modtime)`. #25's A5 already includes "a clock set backward" as a store-survival case — extend the same fixture to the pruner.

### 2.8 Pending-publish replay after a replayed game

If an exit push is interrupted (pending-publish.json, R5) and the player relaunches, plays, and exits again, two sealed captures exist. Publishing both in sequence retains twice and makes the intermediate briefly head; collapsing to the newest loses the intermediate's bytes (which were never anyone's head). **Recommendation:** collapse to the newest sealed capture per unit, retain once — time-to-play beats an intermediate nobody saw. The delta's "every publish retains" makes the naive answer twice as expensive; #22 should state the collapse rule. (Inference; the unit table and capture-stage lifetime are corpus gaps.)

### 2.9 Layout migration carrying the store

`cloud_migrate_layout` (D-CLOUD-089) and TIDY UP YOUR CLOUD FOLDERS move saves folders; a move of the parent carries `.history/` naturally, but any child-by-child move would orphan the store from its README and from R7's context records. One line in the migration tool's inventory; one VM fixture (migrate a layout containing `.history/`, assert the store and records arrive intact).

---

## 3. What it costs the time to play

**The launch path (UI → first frame): zero added operations.** Retain-before-publish exists only inside reconciler passes (exit, boot, manual); nothing touches `FileData::launchGame`. The rule file already assigns the work its place: "Retain-before-publish, hashing, manifests and verification belong after the game has started or after the card has said the player may go" (`repo/rules/time-to-play.md`). The only coupling is indirect: longer syncs raise the chance a launch lands during one — and there the player never waits more than the cancel budget (SIGTERM, 2 s, SIGKILL at 1.5 s — D-CLOUD-076) for an automatic sync, or the visible refusal for a manual one (D-CLOUD-038). The cancel is safe under the delta *because* of 2.1's ordering: a kill anywhere in the retain leaves either orphans (swept) or a completed retain with the publish pending (completed next pass from pending-publish.json).

**The exit path (exit → next first frame): the delta spends everything here.** Per changed unit, retain-before-publish adds to R5's 3–4 spawns (D-CLOUD-046): one member-copy spawn (`rclone copy` with `--files-from` from head dir to seq dir batches a unit's members server-side on Dropbox), one record upload, one extra listing for store verification (the head's correspondence listing already exists). Net **+2–3 spawns, +3–5 API calls, ≈ +1.5–3 s per changed unit** on Dropbox-class latency (inference: ~300–800 ms per API operation on H700-class Wi-Fi; Gate 4/A10's measurement harness is the arbiter). A typical exit changes two units (battery save + auto-state with PNG): **≈ +3–5 s on the exit card**. On hashless self-hosted backends the member copy streams through the device: sub-second for ≤128 KB saves on LAN Wi-Fi, but **~25 s+ for a 30 MB PPSSPP state at 20 Mbps** — which is why the admission ceiling must weigh retain bytes and defer the pair (1.2.1). Note for #135: its acceptance text calls retain "one extra small transfer" — it is two to four; still small, but the budget row should be written from measurement, not that phrase.

**What keeps it off the launch path, stated as requirements:** retain runs only on publish paths; cancel-on-launch (D-CLOUD-076) caps player-visible interference at the kill budget; pruning and README existence checks run on full passes only (the shipped `--recent` precedent); the auto-heal fetch is bounded to suspect units and rides the exit card (1.7.3); the ceiling counts retain bytes. With those five, UI→first-frame is unchanged at boot and at rest, and exit→next-frame grows only for a player who chooses to watch the card instead of launching.

---

## 4. Migration

Constraint: read both, write the new one; a prompt is a failure mode (the commission's quote of `upgrade-and-install.md`; the file itself is not embedded). Devices hold cloud `Saves-replaced/<stamp>/` (one run deep) and local `/storage/.cache/cloud_sync/replaced/<stamp>/`; `-discarded/` never shipped. Both set-asides can hold bytes that exist nowhere else (the local one covers an unpublished newer save overwritten by a restore — the excerpt's own case), so "no earlier version is lost" forces folding *both*, not expiring them.

**The fold, run by the reconciler under `L_T`, no prompts, any failure leaves sources in place:**

1. **Cloud sibling → store (standing, not one-shot).** Each full pass: `lsf --dirs-only` on `Saves-replaced/` (one cheap call; empty → done). For each member: derive the unit from its path, `copyto` into `.history/<unit>/mig-<stamp>-<device>/`, synthesize `record.json` (`reason: replaced`, `producer: "unknown"` where unknowable, sha256/size from listing or fetch, `decided_at` from the stamp, `discarded_by: "migration"`); verify; only then purge the sibling. Paths that are themselves under `-replaced/<stamp>/.history/…` fold *back* to their original unit/seq — this is the self-healing property that answers 1.1's old-image hazard, and it is why the fold must be standing rather than a one-time migration: it also absorbs anything an old-image device in the fleet writes to `-replaced/` forever after, upgrading that device's safety net in place.
2. **Local set-aside → store (one-shot per device).** Upload `.cache/cloud_sync/replaced/<stamp>/` the same way (`reason: replaced`, producer this device), then delete the local folder. Also sweep any stray `/storage/roms/.history/` an old-image restore pulled down (2.5) — provably a copy, since nothing creates it locally.
3. **READMEs** written create-if-absent on the first pass (root and `.history/`, one source string); **the renamed setting's key** migrates read-old-if-new-absent (D-UI-022 precedent); **the docs page** ships in the same change (delta row 9).
4. **Deferral:** no network at first boot → the fold waits for the first networked pass; the old folders sit harmlessly because nothing writes them anymore (the pruner retired with `--backup-dir`, so the newest stamp does not rot). Idempotent: a re-run after a crash finds either sources (fold again) or verified records (skip).

**Experiment:** seed both set-asides with fixture trees on the VM pair; run the cutover image's first pass; assert every file landed with a record, siblings purged, local folder gone, *zero dialogs raised* (harness assertion), and a second run is a no-op.

---

## 5. A simpler shape?

**The delta is the simplest shape that meets the binding constraints; I have nothing better.** Each simpler candidate fails a constraint that is not up for debate:

- **Suffixed copies beside the file** (gap analysis option C): R2 already excludes `- /**/*.bak`, and any suffix that survives the allowlist clutters every folder the player browses — fails "hidden" (D-CLOUD-095) and carries no metadata, failing D-CLOUD-033's engineering consequence (a store #25 can drive a picker from).
- **Provider versioning** (Dropbox's 30 days): WebDAV/SFTP/SMB keep nothing (gap analysis §2.5), and D-QA-017 forbids Dropbox-shaped design. Fails "one home."
- **Two siblings with unified vocabulary**: fails "inside the saves folder, hidden" (D-CLOUD-095).
- **A visible folder inside Saves**: fails "hidden"; the maintainer considered and chose.
- **A local store**: fails D-CLOUD-036's consistency argument (resolve on one device, undo missing on another).
- **`--backup-dir` pointed at `.history/`**: physically impossible — rclone rejects the overlap (D-CLOUD-014). This is what forces `copyto`, and `copyto` is what forces the reconciler to own the retain, and the reconciler owning it is what makes records possible. The delta's shape is not a taste; it is the fixed point of the constraints.

What remains is irreducible: one dot-folder (hidden), one exclusion rule (forced by the location), one record shape (forced by #25's picker), one retain mechanism (forced by the overlap rule), one enum (forced by one vocabulary). The only trims I'd accept: single-source the two READMEs (one text, two outputs), and resist any future request to surface the age/size caps as rows (D-CLOUD-096 already keeps them ours). My amendments in sections 1–4 add no player-facing surface — they make the chosen shape true under interruption, concurrency, and a mixed fleet.

---

## `corpus.provenance.json`

```json
{
  "source_file_paths": [
    "research/council-runs/2026-09-11-save-history-one-home/_sources/00-problem-statement.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-plan-delta.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/save-history-gap-analysis.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/decision-register-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/docs/es-menu-map.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/time-to-play.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/rules/es-native-ui-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_backup-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_restore-set-aside-excerpt.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/repo/code/cloud_sync-rules.txt",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/22.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/23.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/25.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/134.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/135.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/131.md",
    "research/council-runs/2026-09-11-save-history-one-home/_sources/issues/133.md"
  ],
  "source_file_hashes": [
    "f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27",
    "1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b",
    "d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa",
    "46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726",
    "6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911",
    "97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da",
    "32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4",
    "e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509",
    "c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd",
    "bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e2d69ea018b8c9d5484d",
    "b05b7095a31dd11f63cc342129fd3b765a19b9ba4b4a91b4b9aa1877c7658b27",
    "1ca065c449e0b3695f1ab4e9573ad5bd4a92b21ae23c869bba8730fcefdebfc1",
    "14a3cee5592021447395db3e59dfaf27ec09de77f1fb85fe5c10cfde9da28d1b",
    "d7ffb5a4648964d458b18a4a5427b1bb5d8fd356bb31fd06182d2d08c33a2071",
    "3998a6e46d8cdd903deb97b2da23afb78ad1b237061328f4402291c03e0ff137",
    "b8034bb7ab57d7ffb7d5aa4cf16d0974f0bf8d731c983e864081296fa6ccc17c",
    "4f58af89b8a262bb1c7615b7bdfea3389cb655d3c607474fe6aca8c6d084f9f2"
  ],
  "note": "Paths and sha256 values are the Facilitator's embed-time declarations, recorded as instructed; I did not re-read or re-hash the files. Corpus gaps surfaced: full cloud_backup/cloud_restore scripts (only set-aside excerpts embedded), upgrade-and-install.md (quoted in the commission, not embedded), the unit table, conflict-wizard-ia.md, save-manifest-schema.md, engineering-practices.md (referenced, not embedded)."
}
```
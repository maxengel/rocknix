# Round 2 peer review — kimi

I reviewed the four injected revised approaches against the embedded corpus, claim by claim. I am the fifth member (author of `kimi-analysis.md` / `kimi_peer_review.md`); my own revised plan is not in scope here, and I say below where these four changed my mind.

---

## 1. Summary

The four plans have converged on the same foundation: manifest-based content reconciliation as the only writer of the save tree, bisync demoted to a spike, tombstoned deletions, a checked adapter around ES's slot primitives, option hygiene at the transport boundary, unconditional capture, default-on retention, and repair of the round-trip harness before anything else. That convergence is real and earned — each piece traces to a corpus lesson.

The remaining disagreements are few. Two of them are **errors**, not legitimate forks: the "one-way stopgap" in `gemini-revised_plan.md` and `mistral-revised_plan.md` is not lossless, and `mistral-revised_plan.md` states bisync's failure modes as facts the corpus does not establish. One is a genuine scoping fork: `gpt-revised_plan.md`'s protected-publication protocol versus `claude-revised_plan.md`'s archive-and-report posture for concurrent writers. The rest is wording.

I would build from `claude-revised_plan.md`, with specific lifts from `gpt-revised_plan.md`. Reasons and lifts in §7.

---

## 2. Load-bearing claims re-tested against the corpus

### 2.1 Claims that hold

| Claim | Where made | Corpus check |
|---|---|---|
| `getNextFreeSlot()` returns −99 for an auto-only repository (auto state has slot −1; `states.size() == 1`, so the empty-repo early return is not taken; the 99999→0 scan matches nothing) | `gpt-revised_plan.md` §1; `claude-revised_plan.md` §3.6 | **Confirmed** — `es/SaveStateRepository.cpp`. `gemini_peer_review.md`'s earlier rebuttal misread the size check; both revised plans are right that the bug is real. One precision on claude's confirmation experiment: for a *new-game* launch the `-state_slot -99` is swallowed by the `nextSlot > 0` guard in `setupSaveState`; it appears in the command only on the auto-resume and slot-launch paths (`es/SaveState.cpp`). The experiment must launch *from* the auto state. |
| `copyToSlot()` returns true without checking either file operation | `gpt-revised_plan.md`; `claude-revised_plan.md` §3.6 | **Confirmed** — `es/SaveState.cpp`. |
| `getNextFreeSlot()` reads a cached repository; `renumberSlots()` refreshes | both | **Confirmed** — `es/SaveStateRepository.cpp`. |
| Creating `es_savestates.cfg` flips `racommands` to false and defaults `autosave`/`incremental` to false, disabling ES's launch dance and activating the `-emulator`/`-core` rewrite | `claude-revised_plan.md` §3.9; `gpt-revised_plan.md` §4.10 | **Confirmed** — `es/SaveStateConfigFile.cpp` (XML constructor sets `racommands = false` unconditionally; `autosave` default `"false"`; `incremental` default absent) vs. `Default()` (all true); `es/SaveState.cpp` (`!racommands` gate on the rewrite). |
| The boot race: `102-cloud-saves` backgrounds restore+backup behind a ≤60 s ping loop; RetroArch flushes SRAM every 10 s; a mid-session restore is overwritten by the emulator; the exit push (`copy`, no `--update`) then uploads the emulator's copy over the cloud's | `claude-revised_plan.md` §3.7.1; adopted by all | **Confirmed** — `autostart/102-cloud-saves`, `docs/save-manifest-schema.md` §4, `cloud_backup` `--recent` block, `FileData.cpp.launchGame-excerpt`. The changelog's test #5 covers sync-vs-sync only (`docs/cloud-sync-changelog.md`). |
| `.state.auto.bak` matches the allowlist (`+ /**/*.state*`) and neither of ES's regexes | `claude-revised_plan.md` §3.3.5 | **Confirmed** — `cloud_sync-rules.txt`, `es/SaveStateConfigFile.cpp` `SetupRegEx`. |
| `RCLONEOPTS` ships `--delete-excluded`; `cloud_sync_helper` never strips it; both transfer scripts strip it at load; a new consumer inherits it | `claude-revised_plan.md` §3.3.6; `mistral-revised_plan.md` §3.6 | **Confirmed** — `cloud_sync.conf`, `cloud_backup`, `cloud_restore`, `cloud_sync_helper`. |
| User rules are merged *ahead of* the defaults; first match wins; a user `+ /**` defeats any default safety exclusion | `claude-revised_plan.md` §3.3.6; `gpt-revised_plan.md` §4.11 | **Confirmed** — `cloud_sync_helper` (`update_cloud_sync_rules`, comment and code). |
| A non-empty `RCLONEOPTS` without `--filter-from` transfers with no allowlist at all (fallback options only apply when the array is empty) | `claude-revised_plan.md` §3.3.6 | **Confirmed** — `cloud_backup` (`if [ ${#filtered_opts[@]} -gt 0 ]`). |
| rclone's exit 3/4 pass through `clean_exit` and collide with the scripts' own skip codes, which `ThreadedCloudSync` renders as friendly SKIPPED; both mains exit with the saves-phase status only, masking a failed system phase | `gpt-revised_plan.md` §4.11; `claude-revised_plan.md` §3.5.5 | **Confirmed** — `cloud_backup`/`cloud_restore` (`clean_exit ${BACKUP_STATUS}`), `es/ThreadedCloudSync.cpp`. |
| The round-trip harness overwrites `rclone.conf` *before* asserting the remote, never restores it or `SYNCPATH`, and its archive-namespace assertion false-fails on the dated names the uploader now writes | `gpt-revised_plan.md` §1/§6; `claude-revised_plan.md` §7 step 0 | **Confirmed** — `tools/cloud-round-trip` vs. `cloud_backup` (undated archive names get a `stamp-` prefix; the harness's `{device_id}/{ARCHIVE_NAME}` substring can never match). |
| A reflashed device regenerates the same `cloud_device_id` (permanent-address seed), so its *own* manifest is already in the cloud; the alignment review's "none of its own" applies to genuinely new hardware, not reflashes | `claude-revised_plan.md` §3.2 R6 | **Confirmed** — `cloud_device_id`, `docs/save-manifest-alignment-review.md` §2. |
| A stale foreign manifest is republished by the bulk upload (`copy`, no `--update`, `+ /savestates/**` admits every `manifest-*.json`) | `claude-revised_plan.md` §3.2 R7 | **Confirmed** — `cloud_backup`, `cloud_sync-rules.txt`. |
| `cloud_restore` still calls `sleep` directly where `cloud_backup` uses the `--yes`-aware `pause` | `claude-revised_plan.md` §3.10 | **Confirmed** — `cloud_restore` has no `pause()` function. |
| The schema has no deletion rows, no equality-establishes-agreement row, and §9 assigns agreement writes to transfers only | all four | **Confirmed** — `docs/save-manifest-schema.md` §3, §9. |
| `rom` as ES's repository key is the *stem* under `nofileextension = true`, not "file name with extension" as schema §6 glosses it | `claude-revised_plan.md` §3.2 R9 | **Confirmed** — `es/SaveStateRepository.cpp` (`getStem` branch), `es/SaveStateConfigFile.cpp` (default `nofileextension = true`). |
| The QA WebDAV offers no hashes and no modtimes | all four | **Confirmed** — `docs/save-manifest-alignment-review.md` §1 (D-QA rows). |

### 2.2 Claims that fail or are overclaimed

1. **The "one-way stopgap" is not lossless.** `gemini-revised_plan.md` §5.1 and `mistral-revised_plan.md` §3.2/§6 propose disabling the boot pair and SYNC row, keeping only the game-exit upload, and claim "no data is lost" / "preserves both copies of every fork". This is false. The exit upload is `cloud_backup --yes --saves-only --recent`: `BACKUPMETHOD` forced to `copy`, **no `--update`** (`cloud_backup`; futro §4 step 1: it "overwrites the cloud copy whenever the local one differs, even if the cloud's is the newer"). With downloads disabled, the local device never sees the other device's progress — and its exit push overwrites that progress at the cloud. The cardinal-rule violation persists in the upload direction. `gpt-revised_plan.md` §2 says this correctly ("'lossless' is too strong: it can still overwrite a cloud-only version"); `claude-revised_plan.md` quietly dropped the idea after its own Step 1. Notably, gemini and mistral adopted a position its originator abandoned and that a review they cite already refuted. **This must not be built.** D-CLOUD-029 stands as written; the honest interim is gpt's: isolated test storage and disabled auto-sync toggles as a maintainer *operating* choice, not a product change.

2. **`mistral-revised_plan.md` states bisync's failures as established fact.** §1/§3.1: "blind to SRAM changes on hashless backends, demands `--resync` on first runs and filter changes, and its stateful workdir is a corruption hazard." The corpus establishes none of these. The futro poses the `--resync` question as a what-if with a spike to settle it; the workdir at `/storage/.cache/rclone/bisync` is cited as *good* under blindspot 14 (a guard outside what it guards); behaviour on hashless backends is untested. The *conclusion* (manifest-based detector) may well be right, but `claude-revised_plan.md` ([K] markers, contract-first spike) and `gpt-revised_plan.md` ("the corpus does not establish that `--conflict-resolve none` is report-only") handle the epistemics correctly and mistral does not. A foundation document that asserts unmeasured tool behaviour as fact is how this project ships confident mistakes (blindspot 9).

3. **`mistral-revised_plan.md` §3.1's hashless fallback is wrong for the QA backend.** "size+mtime on hashless backends" — the QA WebDAV has *no modtimes* (#53), so the fallback is size-only, which is the exact #53 trap. The corpus-sanctioned fallback is size as pre-check plus sha256 after download (alignment review §1), which claude and gpt both state correctly.

4. **`mistral-revised_plan.md` §5's "wizard must be reachable in kid/kiosk mode"** contradicts the mode's design: kid/kiosk collapses the menu to INFORMATION / UNLOCK / RETROACHIEVEMENTS / QUIT (`docs/es-menu-map.md`), and configuration surfaces deliberately do not exist there. `claude-revised_plan.md` §3.5.6 and `gpt-revised_plan.md` §4.11 have the right shape: non-destructive branches run, divergent items wait (nothing is lost — both sides stay), a needs-attention badge shows in the full UI, resolution requires unlocking. mistral's requirement should be struck.

5. **`mistral-revised_plan.md` §3.5's discard store at `/savestates/.discards/**`** relies on an exclusion rule staying ahead of `+ /savestates/**` — but user rules merge *ahead of* defaults (`cloud_sync_helper`), so a user `+ /**` defeats it, and the store's contents (discarded saves) would sync. `/storage/.cache/cloud_sync/discarded/` (claude §3.7.2, gpt §4.8) is outside the sync tree by construction and outside `backuptool`'s archive — the same reasoning the IA used for `history.db`. Settles to claude/gpt.

6. **`claude-revised_plan.md` §3.4.4's correction of my ping-pong trace understates prevalence.** Claude is right that my original trace's agreement bookkeeping was loose. But the reversal scenario does not *require* B to lack an agreement record: it requires only that both sides resolve for their own copy. A and B share agreement A₀; both diverge; A resolves KEEP-own and uploads H_A; B sees divergent, resolves KEEP-own, uploads H_B; A's next pass sees L=H_A=A, C=H_B — schema row "cloud changed → download" silently reverses A's explicit choice. No reflash, no first run, no missing agreement. That is precisely why the recorded-loser guard (claude's row 4, gpt's resolution receipts) is V1 machinery and not an edge case. The guard is right; the framing "real when B has no agreement record" should read "real whenever two resolutions disagree, which the sequential single-player flow produces unaided".

7. **`claude-revised_plan.md` §3.3.3's "≤ 2 spawns" may undercount by one.** R7 requires the own manifest to go up by an explicit single-file copy with `.rocknix/**` excluded from the bulk upload; the manifest changes exactly when captures change, i.e. on every non-idle exit. Unless the changed-files upload carries the manifest via `--files-from` (filter interaction with the `.rocknix/**` exclusion is [K] — testable in ten minutes), the changed path is ≤ 3 spawns. Small, but the D-CLOUD-028 refinement row should state the real number.

8. **`gpt-revised_plan.md` §4.8's durable transaction journal is borderline over-earned for V1.** With tombstones and claude's apply ordering (audit line → archive/discard-store copy → destructive step, per item), an interrupted apply *converges on re-run*: the next reconcile re-classifies whatever state each unit is actually in, and every row of claude's table is idempotent under re-entry (I walked the crash points: post-download-pre-agreement → row 1 writes A; post-archive-pre-delete → row 9 re-fires; post-delete-pre-clear → row 15 clears). The journal's residual value is resume-without-reclassification, which is real but not obviously worth a second durable store beside the audit log in V1. Keep the ordering rule and the idempotent re-plan; grow the journal if the shadow phase shows a non-converging case.

---

## 3. The real disagreements, and how they settle

### Substantive

**D1 — The interim posture (D-CLOUD-029).** claude/gpt: endorse, no stopgap, accelerate #22. gemini/mistral: the one-way stopgap. *Settled by reading `cloud_backup` and the futro — no experiment needed.* Settles to claude/gpt (§2.2.1). gemini's own concession §1 contains the crispest statement of *why* `--update` on exit is pointless (the boot restore clobbers next boot); that argument is correct and worth keeping, but it argues for claude's "accelerate, don't patch", not for gemini's §5.1.

**D2 — Concurrent-writer machinery.** claude: pre-upload check + `--backup-dir` on every overwrite + audit + anomaly report, manual recovery, honest contract. gpt: protected non-overwriting publications + receipts + competing-heads reader logic, automatic detection. *What settles it:* the project's accepted posture (futro: "Accepted for this drop; the audit log will show if it is violated"), the exit-path budget (gpt's protocol adds a protected upload + receipt + verification per changed save; gpt itself says measure and degrade), and gpt's Gate 4 two-H700 interleaving test. My call: **claude's stack for V1** (the pre-upload check narrows the window to seconds; archival preserves bytes; the anomaly report surfaces it), **gpt's protocol as the designed V2 answer** if the audit shows violations or the feature ships beyond the maintainer. The *receipts* half of gpt's §4.7 (resolution receipts against ping-pong) is not concurrency machinery — the sequential flow produces the reversal unaided (§2.2.6) — and belongs in V1; both plans already have it. If Gate 4 shows `--backup-dir` unhonoured or the anomaly report unactionable on a real backend, I would flip to gpt's protocol for V1.

**D4 — Kid/kiosk behaviour.** Settles to claude/gpt (§2.2.4). Evidence: `docs/es-menu-map.md`'s mode design. No experiment needed.

**D5 — Discard store location.** Settles to claude/gpt (§2.2.5). Evidence: `cloud_sync_helper` merge order.

**D6 — Provenance for merged/imported copies.** claude: provenance looked up by sha256 across the union of manifests. gpt/mistral: an `origin` object carried in the entry. *Substantive, small.* gpt's durability argument is decisive: once the producer overwrites its own path entry, the union no longer contains that version anywhere, and hash-lookup provenance degrades to `unknown` for every device holding a copy — including KEEP BOTH merges, which are the milestone's own feature. Cost is one additive field. **Settles to gpt/mistral; adopt the origin field** (with claude's lookup as the fallback for pre-field versions).

**D7 — Auto-state KEEP BOTH outcome.** gpt states it explicitly: the device resume point stays at `.state.auto`; the cloud version materialises into a numbered slot with its thumbnail. claude's adapter handles the −99 allocation but never says where the cloud auto *goes*. *Settles to gpt's sentence, lifted verbatim into the merge adapter's contract.*

**D10 — Boot-sync mechanism.** claude: boot sync moves into ES (a `ThreadedCloudSync` job after gamelist load; ES refuses launches during save-tree writes). gpt: a save-lifecycle gate shared by launch/session/exit/cloud; a background boot operation may *upload sealed staging* during play but must never restore over live SRAM; boot writes a persistent result record ES consumes. *Substantive in mechanism, convergent in principle.* Settle: **claude's ES-owned scheduling** (a UI-less writer is the root defect; the boot job deserves the card per `es-native-ui.md`'s tiers) **with gpt's gate semantics** (uploads of sealed data during play are safe and keep the exit path cheap; restores, renumbers, compaction and applies are what must be excluded). The boot-race reproducer both plans specify gates the whole thing.

**D11 — The exit push.** claude has the only concrete design (hash the played game's files regardless of mtime; `lsjson --hash --files-from <changed>`; compare against agreed `remote_hash`; upload with `--backup-dir`; defer on mismatch; `--ignore-existing` for never-agreed first saves). gpt is directional ("correctness reads permitted; time window is a scheduling hint"). *Settles to claude's design*, with gpt's caveat that the changed-path cost is a Gate-5 measurement, and with the spawn-count correction from §2.2.7. `lsjson --files-from` support is [K] — add it to the spike.

### Wording only

- **"Reopen" vs "refine" D-CLOUD-031** (gemini says reopen; claude/gpt/mistral say refine/new row citing). The register is append-only; additive fields are refinements by its own rule. Same act, wrong label from gemini.
- **bisync's demotion** is unanimous; only the rhetoric differs (§2.2.2). All four keep the spike. gpt makes the correct procedural point that no register row makes bisync a dependency — it is issue-level (#9/#22 bodies and the IA), so issue bodies and the IA get edited, and no row needs reopening.
- **The wizard trigger channel** (claude's result file + exit 5; gpt's persistent pending/result record) is the same mechanism in two dialects.
- **Capture records the launched core from the command, not `getCore(true)` at exit** — converged; it is a consensus refinement to schema §9's "told not discovered" and should be written into #21's ACs verbatim.

### Converged and worth stating as consensus

Tombstoned deletion with a mass-delete guard and archival; the checked merge adapter (with the −99 fix); option hygiene (never inherit `RCLONEOPTS`/`BACKUPMETHOD`; safety exclusions as `--exclude` flags, proven to fire); unconditional capture; screenshot binding (`screenshot_sha256`); save units with `rom: null` for shared containers; **keep-discarded-saves default ON, bounded** — all four plans against IA rev 4's off-by-default, which is a doc decision, not a register row; this unanimous change should get its own register row; harness repair before any destructive test; #10 as a launch-behaviour migration, with claude's explicit resequencing after the wizard needing the maintainer's sign-off since the problem statement places #10 in the milestone.

---

## 4. What each plan uniquely has

**`claude-revised_plan.md`** — the most operationalized plan, and four elements the others lack that would be real losses:
- **The 15-row amended conflict table** (§3.4). The only complete, checkable verdict logic in the set — tombstone rows, provisional-agreement rows, recorded-loser rows, both-gone row. Liftable verbatim into #22's ACs.
- **The normalised exit-code protocol and result file** (§3.5.5: 0/3/4/5/6/1, rclone's codes to the log, never to the exit), with the rclone 3/4 collision as the evidence. gpt's "typed outcomes" is the same idea unnamed; claude's is implementable.
- **The gated exit push** (§3.3.3) — the only concrete D-CLOUD-028 refinement with a spawn budget.
- **Manifest transport ownership** (R7: `.rocknix/**` excluded from bulk upload, own manifest uploaded explicitly) plus the dual-identity refusal — the stale-manifest-republication hazard is named nowhere else.
- The **ledger** (§8) and the **[V]/[K]/[M] discipline** — every claim is auditable against this corpus; the model for what the built foundation's own comments should look like.

**`gpt-revised_plan.md`** — the most rigorous plan; unique elements:
- **The save-lifecycle gate semantics** (§4.9): uploads of sealed staging may proceed during play; restores/renumbers/compaction/applies may not. More precise than claude's blanket exclusion, and it keeps the exit path cheap.
- **The auto KEEP BOTH outcome** (§4.6) — see D7.
- **Origin-vs-possession with the durability argument** (§4.1) — see D6.
- **"Loading a state can rewrite SRAM"** (§5 row 8) — a cross-unit dependency nobody else names: resolving a *state* conflict can invalidate the *save* that a later flush overwrites. This changes what "independent" means for the pre-pass and belongs in the unit design.
- **The "no default route" false negative** (§6): `check_network_link` requires a *default* route, so a LAN-only remote on the same subnet is wrongly skipped with exit 4. Real, source-visible (`cloud_backup`), and unique to gpt.
- **Mixed-version cutover honesty** (§8): new code cannot prevent an old binary on another device from performing its old overwrite; protected publications must live outside the legacy mirror's reach. The only plan that states the cutover's hard boundary.
- **Receipt/tombstone retirement is not the payload count selector** (§4.4) — a handheld offline for a month must not miss a tombstone because a count rolled. claude's "bounded `resolutions`" needs this correction.

**`gemini-revised_plan.md`** — thin, and mostly a subset of the others. Two genuine uniques:
- **The pin that nothing is built yet** (concession: "querying `agreed.json` history is impossible today — the schema header says 'Nothing here is built'"). A useful discipline: every "the detector does X" sentence in all four plans is about unbuilt code, and gemini is the only one that says so.
- **The clean procedural closure of its own D-CLOUD-029 reopen** ("WITHDRAW the D-CLOUD-029 `--update` reopen") — the register-facing framing the question needs, whatever replaces it.
Its §5.1 stopgap is a liability, not a loss if dropped (§2.2.1).

**`mistral-revised_plan.md`** — two uniques worth lifting:
- **The register-ready amendment IDs** (D-CLOUD-031-A through -E). The other plans describe the same fields in prose; mistral's naming is what the register rows will actually look like.
- **The explicit out-of-scope foreclosures** (§7: occurrence identifiers, audit tamper-proofing, launch-time resolution) — the only plan that writes down which tempting machinery was considered and refused, which is exactly the anti-over-engineering record this milestone will need later.
- Its "diff `LIBRETRO_CORES` between targets" is the cheapest form of the absent-core experiment (gpt has the device-side version; both belong in the plan).

---

## 5. What should not be built

1. **The one-way stopgap** (gemini §5.1, mistral §3.2/§6) — unsafe, not merely unearned (§2.2.1).
2. **gpt's protected-publication store in V1** (§4.7's remote area, descriptors, competing-heads reader) — the complete answer to a risk the project has consciously accepted for this drop, at a cost the exit budget likely cannot pay. Keep the receipts; defer the store; claude's `--backup-dir` archival + anomaly report is the proportionate V1. Revisit on Gate-4 evidence.
3. **gpt's full durable transaction journal in V1** (§4.8) — keep the apply ordering and idempotent re-plan; grow the journal only if shadow mode shows a non-converging crash point (§2.2.8).
4. **mistral's in-tree discard store** (§3.5) — wrong placement; use `/storage/.cache/cloud_sync/discarded/`.
5. **mistral's kid-mode reachability requirement** (§5) — contradicts the mode's purpose (§2.2.4).
6. **Any production role for bisync before the spike answers question zero** — all four agree; worth stating as a gate, because #9's body still reads otherwise.

Nothing in `claude-revised_plan.md` is unearned machinery — but it is at the complexity ceiling for a busybox handheld, and its own staging (capture → shadow → exit push → boot/menu → wizard) is the right way to keep that ceiling from becoming the V1 diff.

---

## 6. Where these plans changed my mind

- **gpt's origin-durability argument (§4.1) changed my mind.** I would have relied on union-by-hash provenance (claude's R1). The producer overwriting its own entry silently orphans every imported copy's provenance — including KEEP BOTH merges. One field fixes it; I now think it belongs in the D-CLOUD-031 refinement.
- **gpt's SRAM-rewrite-on-state-load (§5 row 8) changed my mind about unit independence.** I had treated states and saves as separate universes sharing a ROM stem. A state load that rewrites the battery save on the next flush makes them one dependency for pre-pass purposes.
- **gpt's LAN no-default-route finding changed my mind about exit 4's correctness.** I had treated the route check as a clean local answer; it is a heuristic with a false-negative for LAN remotes.
- **claude's correction of my ping-pong trace (§3.4.4) I accept in part** — my agreement bookkeeping was loose — **and push back in part** (§2.2.6): the reversal needs no reflash and no missing agreement, only two disagreeing resolutions, so the guard is more load-bearing than claude's framing says.
- **On concurrency I moved toward claude.** My lost-update trace stands, and gpt's protocol is its only complete answer — but the accepted posture plus the exit budget plus claude's archival stack moved me to "archival + receipts + anomaly report in V1; protected heads in V2". gpt's own degradation clause ("leave reconciliation pending; never call it fully synced; never fall back to an unchecked overwrite") is what makes that split honest.
- The unanimous default-on retention confirms my earlier position; nothing to add beyond noting the consensus.

---

## 7. Which plan I would build from

**Base: `claude-revised_plan.md`.** It is the only plan an implementer could pick up cold: the verdict table, the exit-push design with a spawn budget, the exit-code/result protocol, the merge adapter's acceptance list, the staged cutover with shadow-disagreement definitions, and the hardware proof order. Its evidence markers mean every load-bearing claim can be re-checked against this corpus without trusting the author.

**Lift from `gpt-revised_plan.md`:** the lifecycle-gate semantics (uploads of sealed data during play are permitted; writes to the live tree are not); the auto KEEP BOTH outcome sentence; the `origin` field; the SRAM-rewrite dependency in the unit design; the LAN no-default-route finding (fix `check_network_link`'s successor to test the *remote*, per the rule file, not the default route); the mixed-version cutover boundary; the receipt-retirement correction to claude's bounded `resolutions`; the frozen, hash-bound plan language for the walkthrough.

**Lift from `mistral-revised_plan.md`:** the D-CLOUD-031-A…E amendment IDs and the out-of-scope foreclosures.

**Lift from `gemini-revised_plan.md`:** the explicit register-facing closure of the D-CLOUD-029 question, and the "nothing is built yet" discipline.

**Do not carry:** anything in §5 above.

The resulting foundation is claude's architecture with gpt's precision at the four points named, mistral's register hygiene, and gemini's procedural closure — and it is testable end to end by the hardware gates all four plans already agree on, in the order claude gives them.

---

## corpus.provenance.json

```json
{
  "corpus_mode": "facilitator_embedded_read_at_time",
  "council_member_artifact": "kimi round-2 peer review (this document)",
  "source_count": 42,
  "hash_verification": "sha256 values verified at embed time by the Council Facilitator and copied from the per-source headers; not re-read or re-hashed by this member",
  "independently_reread_files": false,
  "independently_rehashed_files": false,
  "commands_or_hardware_tests_performed": false,
  "manifest_read_timestamp_utc_as_supplied": "2026-09-05T17:32:51Z",
  "injected_revised_plans": [
    "claude-revised_plan.md",
    "gemini-revised_plan.md",
    "gpt-revised_plan.md",
    "mistral-revised_plan.md"
  ],
  "injected_plan_hashes_provided": false,
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
    {"description": "GuiSaveState.cpp (delete path for tombstones; renumber-on-delete claim; launch-time picker mechanics)", "declared_source_path": null, "sha256": null},
    {"description": "SaveState.h / SaveStateRepository.h (default arguments of makeStateFilename and copyToSlot)", "declared_source_path": null, "sha256": null},
    {"description": "rclone 1.75.0 bisync documentation or source (every bisync behaviour claim remains [K] until the spike)", "declared_source_path": null, "sha256": null},
    {"description": "cloud_content_backup / cloud_content_restore / cloud_setup / tools/cloud-test-backend / backuptool implementations", "declared_source_path": null, "sha256": null},
    {"description": "docs/es-ui-style-guide.md; Paths.cpp; RetroArch launch/setsettings.sh savestate_directory path", "declared_source_path": null, "sha256": null},
    {"description": "Current issue bodies with edited ACs (embedded issue files are comment-thread exports); my own kimi-revised_plan.md (not injected for this round)", "declared_source_path": null, "sha256": null}
  ]
}
```
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
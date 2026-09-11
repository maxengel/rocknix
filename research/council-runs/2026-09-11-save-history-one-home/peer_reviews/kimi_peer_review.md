# Council Step 2 — peer review of the four Step 1 analyses

*Seat review. Every claim below was tested against the embedded corpus only; I cite sources by their declared paths. Where a member's claim rests on knowledge outside the corpus (rclone internals, backend capabilities), I say whether they labelled it as such. I did not re-read or re-hash anything; the Facilitator's embed-time sha256 values are recorded in the provenance block at the end.*

**Headline judgments, argued below:**

1. `gpt-analysis.md` contains the single most important finding of the round — the concurrent-publisher counterexample — and it defeats the one genuinely weak claim in `claude-analysis.md` (that the hash-from-copy check closes the two-device race). The two analyses are complementary, not competing; the delta needs both.
2. `claude-analysis.md` is the most corpus-faithful of the four and its per-file count-keying finding (§1.2) is the best-diagnosed defect in the delta. Its concurrency section overclaims.
3. `gemini-analysis.md` is thin but contributes one amendment nobody else made (retain-before-install) and one real hazard (clock skew) — then wastes both by not developing them. Its migration section loses data and must be rewritten.
4. `mistral-analysis.md` contains a fabricated measurement presented as fact, a misattributed allowlist rule, a verification standard that contradicts R4, and a migration that destroys unique local copies. It needs the most revision.

---

## 1. `claude-analysis.md`

### Claims checked against the corpus

**Hold:**

- *"The shipped rules restore `.history/<unit>/<seq>/Zelda.srm` to a device today (the members match `+ /**/*.srm`; `record.json` and PNGs do not)."* — Verified against `repo/code/cloud_sync-rules.txt`. The includes `+ /**/*.srm`, `+ /**/*.state*`, `+ /**/*.sav` etc. match at any depth; `.json` and `.png` match no include and fall to the trailing `- /**`. The conclusion is correct, and it is the round's most important shipped-code fact: **the store is unsafe under the shipped allowlist**, in both directions (restore to device; sync-mode deletion into `-replaced/`, which `repo/code/cloud_backup-set-aside-excerpt.md` confirms — "anything replaced (or, in sync mode, removed) in the cloud goes to ${replaced_root}" — and which `prune_replaced_remote` then reduces to one run). The proposed remedy (ship `- /.history/**` one image early, as a guard with no writer, per the `.snapshots` precedent in `issues/25.md`) does not reopen D-CLOUD-097, which is about widening `-replaced/` retention, not about filter rules. This is the strongest safety argument in any of the four analyses.
- *The delta lists D-CLOUD-047 as unchanged while changing it.* — Verified. The delta's "What does not change" names "publications and retirements (D-CLOUD-047)"; D-CLOUD-047 says "Propagated deletions and compactions are not retained as discarded saves; … the cloud's `-replaced/` sibling is their record"; the delta's `reason: deleted` retains deletions and retires `-replaced/`. A real contradiction the delta's own text misses. `gpt-analysis.md` catches the same thing ("Reopen D-CLOUD-047's retention exclusions").
- *D-CLOUD-095 does not cite D-CLOUD-042.* — Verified against the register. `gpt-analysis.md` states the sharper version: D-CLOUD-042 has two clauses (the folder name; the legacy split-root refusal), and only the first is superseded. Claude should adopt that framing.
- *R5 forbids fetches on the exit path, so D-CLOUD-100's "restored" cannot happen at exit.* — Verified: `issues/22.md` R5: "It is **to-the-cloud only** … No fetches, no ICMP, no probes on this path." D-CLOUD-100: "the cloud's good copy is kept and restored." This is an internal contradiction in the plan of record as amended, and only this analysis and `gpt-analysis.md` ("The exit pass can flag and defer recovery; it must not silently become a download/install pass") engage with it. Claude's staged sequence (torn save → relaunch → fresh game written → published as "this device changed" → good copy retained but the player holds a blank game) is correctly constructed and correctly attributed to D-CLOUD-076 (launch cancels the boot sync that would have healed).
- *The count bound is keyed to the unit; auto-state churn evicts manual-slot history.* — Verified as far as the corpus goes: R4 defines *L* as "this device's hash set for the unit"; R9 says "unit = game + kind"; D-CLOUD-030 makes slot an attribute, not identity. Given those, one game's states are one unit, and a per-unit count of 3 lets three exits of auto-state churn evict the manual slot's retained version — the exact case D-CLOUD-099 was decided to protect. Claude flags the one unverifiable premise honestly ("if the unit table in #21 already keys states per slot, this amendment is a no-op"; #21 is not embedded). The fix (count per (unit, member path)) also matches the player-facing label VERSIONS KEPT PER SAVE better than the mechanism it amends. This is the best-diagnosed defect of the round.
- *`prune_replaced_remote` skips `--recent` runs; D-CLOUD-083 restored ten low-level retries; the maintainer has two devices.* — All verified against the register and the excerpts.
- The rclone recollections (overlap-check behaviour of `copy` vs `sync`/`move`, excluded-destination treatment under `sync`, modtime preservation, per-backend server-side copy) are **labelled as recollection with named VM experiments**. This is exactly the discipline the brief asks for, and the other three members do it inconsistently or not at all.

**Fails / overclaims:**

- *"Both retain H0, both publish. Covered in §1.3: with the hash taken from the copy, the second device sees the head no longer equals A and does not publish … Either way no version is lost."* — **Refuted by `gpt-analysis.md`'s counterexample.** Claude's check compares the retained copy's hash to *A* between the retain and the publish. Two devices can both pass that check while the head is still H0, then both publish; the second publish overwrites the first **without retaining it**. The check narrows the window; it cannot close it, because the check and the publish are not atomic — and GPT says exactly this ("Another head check merely moves the race window"). Worse, GPT's follow-on is real: if the first publisher's correspondence check completes before the overwrite, agreement advances to HA; the next pass then classifies "the cloud changed" and fetches HB over the local HA, and #22's negative scope ("no preimages of one-way fetches") means nothing retains HA anywhere. "No version is lost" is false in that window. Claude must adopt GPT's counterexample and either accept the escrow cost, accept Gemini's retain-before-install as the backstop, or explicitly record the residual as accepted — but may not claim closure.

### Strongest argument
§1.2 (per-file count keying), with §1.4 (heal-from-the-stage mechanics) and §1.5 (ship the exclusion rule early) close behind. Each is corpus-derived, each names its experiment, and each amends rather than reopens.

### Weakest argument
The concurrency closure claim (§2.2/§1.3), for the reason above. Second-weakest: dropping the 90-day age cap is well-argued (untrusted clocks are corpus evidence — `issues/23.md` carries `clock_synced: false`), but the recommendation should present the trust-gated sweep as the primary alternative and the drop as the fallback, since it reopens a clause of D-CLOUD-096 and the maintainer approved that number four days ago.

### Concrete revisions for Step 3
1. Replace §2.2's "Covered in §1.3" with GPT's counterexample and a three-option treatment (escrow / retain-before-install backstop / accepted residual), recommending one.
2. Add the ordering rule that the own-manifest witness (R7, I2) must run **before** any retain, or a cloned card writes store entries for a publish it will refuse — a point no member made.
3. Extend the audit requirement: #23 mandates an audit line per discard before the apply; the delta needs the same for routine retains and prunes, or the store's mutations have no lineage (D-CLOUD-027).
4. State the soft-cap semantics explicitly: pruning and the size sweep run on full passes only, so an exit-only device overshoots count and the 256 MiB cap between full passes. The README and the settings page must not promise a hard ceiling.
5. Note the startup-sync cost symmetric to §3: the boot pass's backup half now retains too, lengthening it and raising the probability a launch cancels it (D-CLOUD-076/072). Only the exit path is quantified.

---

## 2. `gemini-analysis.md`

### Claims checked against the corpus

**Holds, partially:**

- *"On self-hosted backends like SFTP or WebDAV, rclone may not support server-side copy and will silently fall back to downloading and re-uploading."* — Directionally correct for SFTP, but asserted without the "hypothesis" label Claude gives the same class of claim, and WebDAV is server-dependent (GPT states the correct distinction: "Copy efficiency and verifiability are separate"). The experiment Gemini names (measure traffic on the SFTP QA backend) is the right one; `issues/133.md` makes that backend available.
- *The clock-skew hazard.* — Real and corpus-grounded: R9's seq is `<decided_at, UTC compact>-<device id>`, and #23 already carries `clock_synced: false` because handheld clocks are not trusted. A 1970-clock device's brand-new entry sorts oldest and is pruned first. But Gemini stops at the hazard; Claude (drop or trust-gate the age cap) and GPT (timestamps are display, never correctness ordering) each supply the mitigation Gemini lacks. Gemini's find is a good premise with no conclusion.
- *The README falls through to the trailing `- /**` and does not sync to the device.* — Correct against `repo/code/cloud_sync-rules.txt`.

**Fails:**

- *"The allowlist (`repo/code/cloud_sync-rules.txt`) excludes `- /.history/**`."* — **False as written.** The shipped file contains no such rule; that rule is the delta's *proposal*. The distinction is the entire hazard: under the shipped rules, `.history` members matching `+ /**/*.srm` are restored to devices and, in sync mode, deleted from the cloud into `-replaced/` (Claude's §1.5, verified above). Gemini's phrasing treats the delta as already shipped and thereby misses the pre-R1 exposure window that motivates Claude's ship-the-rule-early amendment.
- *"If they launch the same game, EmulationStation checks `L_T` and `L_S`, and will refuse the launch if the reconciler holds `L_S` (D-CLOUD-053)."* — Garbled twice over. Per R6, ES takes `L_S` itself before the pre-launch renames, then checks `L_T`; the reconciler holds `L_S` only in sub-100-ms batches. And per D-CLOUD-076 (2026-09-10), a launch **cancels** an automatic sync in any phase; refusal applies only to a player-started sync. Gemini's model is stale relative to D-CLOUD-076 — the same staleness GPT correctly identifies in #22's own text.
- *The migration section ("Age out").* — This is the weakest migration of the four and it fails the commission's own rule ("no earlier version is lost"). Leaving `Saves-replaced/` in place "until the user deletes them or the 90-day age cap sweeps them" loses the bytes twice over: old-image devices prune the folder to one run (`prune_replaced_remote`), and the age cap as specified governs the store, not the legacy sibling — Gemini's own proposal is incoherent on its face. "Until the user deletes them" asks the player a question about internals, which the commission names a failure mode. And amending #25 to read `.cache/cloud_sync/replaced/` is impossible for any device but the one holding it — that cache is local by construction. Claude and GPT both show the only acceptable shape: fold, verify, then delete, with a grace period.
- The `L_S` recommendation ("read the captured save into staging, release `L_S`, then do the network work") is already the design — R6 holds `L_S` in brief per-unit batches. Gemini presents a plan-of-record property as a new requirement.

### Strongest argument
The **retain-before-install** amendment: "The reconciler must also perform retain-before-install for any fetch or restore that overwrites a local save, pushing the local loser to the cloud `.history/` store before overwriting it locally." Gemini's stated rationale is mostly redundant — for a routine fetch the local loser equals the old head, which the publisher's retain-before-publish already stored — but the amendment becomes load-bearing precisely in GPT's race follow-on, where the local loser (HA) was a head that nobody retained. It is the missing second half of the delta's publish-only retention, and Gemini is the only member who stated it.

### Weakest argument
The migration "age out," for the reasons above.

### Concrete revisions for Step 3
1. Rewrite migration wholesale: fold `-replaced/` into `.history/` with synthesized records, verify before deleting, upload unique local-cache bytes (the manual RESTORE row passes no `--update` — `repo/code/cloud_restore-set-aside-excerpt.md` — so some of those local copies exist nowhere else, as Claude notes), and take GPT's grace period.
2. Correct the launch-gate description per D-CLOUD-076 and R6.
3. Label backend-capability claims as hypotheses with the VM experiment attached (Claude's discipline).
4. Convert the clock hazard into a position on the age cap, or hand it to Claude's amendment explicitly.
5. State the retain-before-install amendment against the concrete scenario that needs it (GPT's follow-on), not the redundant one.

---

## 3. `gpt-analysis.md`

### Claims checked against the corpus

**Hold:**

- *"#22 still contains launch-refusal and exit-code language superseded by D-CLOUD-074, D-CLOUD-076, and D-CLOUD-098."* — Verified and uniquely caught. #22 R10 specifies outcomes "3 lock held · 4 no route"; D-CLOUD-074 moved the sentinels to 75/69 precisely because "rclone's codes run 1-9." #22 R6's launch *refusal* predates D-CLOUD-076's launch-*cancels*-automatic-syncs. Since the delta says "Everything not named here stays as #21–#25 … have it," these stale clauses ride along unless named. This matters and no other member saw it.
- *R9 flattens members to basenames; a multi-directory unit with two same-named files collides.* — Verified: R9 stores "the loser's members at their basenames." PPSSPP directory units are the corpus's own multi-file case. Unique to this analysis.
- *The old store counts "finalized, coherent wizard losers only," a materially narrower contract than the unified store.* — Verified verbatim from R9.
- *The four bounds are jointly unsatisfiable* (300 games × 1 MiB of only-copies vs 256 MiB). — Correct logic, and the priority ordering (transaction material → only usable copy → latest deliberate loser → count/age/size oldest-first) is the cleanest resolution offered. Claude's "never the only copy" definition handles the per-file case; GPT's handles the aggregate. GPT's is more complete.
- *D-CLOUD-095 supersedes only D-CLOUD-042's location clause.* — Correct nuance; sharper than Claude's treatment of the same row.
- *The concurrent-publisher counterexample.* — Constructed correctly and, as argued above, decisive against both the delta's sufficiency and Claude's closure claim. The follow-on (agreement advanced → "cloud changed" fetch overwrites the local loser with no preimage, against #22's "no preimages of one-way fetches" negative scope) is the loss that converts a near-miss into actual data loss. The framing the maintainer needs — **recoverable concurrency vs serializable head selection** — is exactly right, and it is the honest way to present a possible D-CLOUD-052 reopening.
- The migration treatment (copy-not-move, verify before removing, preserve unclassified files, the import grace period against the 90-day cap, mixed-version boundary as a release gate rather than a log line) is the most rigorous of the four. The grace-period point — import a 100-day-old version and the age cap deletes it immediately — is a genuine catch nobody else made.

**Fails / overclaims:**

- *The candidate-escrow fix is never reconciled with the bounds.* Escrowing every publish candidate roughly doubles store writes and churns the very count cap this analysis wants to prioritize; GPT gestures ("costs additional writes and protected storage") and later scopes it ("at minimum, the latest candidate per publishing device/unit"), but the two passages never meet. As written, the strongest finding has the least-costed remedy.
- *"'Discarded saves were not kept' is false if that operation retained a mandatory recovery copy."* — Over-lawyered. Transaction staging (`pending-publish.json`, the stage) exists regardless of the history switch and is not "kept discarded saves" in any vocabulary the player has. The real point underneath — the switch's semantics are unspecified under universal retain-before-publish (does OFF disable replacement retention? does it conflict with D-CLOUD-100's mandatory suspect retention?) — is genuine and worth keeping; the footer argument should be dropped.
- The D-CLOUD-052 reopen is named but the argument for it is only sketched. The commission's bar is "cite its ID and give the argument that should reopen it"; "recoverable vs serializable" is the right frame, but Step 3 needs it stated in one paragraph with the cost test (D-CLOUD-034) applied, or the reopen will read as casual given how decisively Gate 11 settled the transport.

### Strongest argument
The concurrent-publisher counterexample — the only finding in the round that is a *proof* rather than an assessment, and the one that most changes what the delta must say.

### Weakest argument
The uncosted escrow, followed by the footer quibble.

### Concrete revisions for Step 3
1. Cost the escrow against the caps: scope it to the latest candidate per (device, unit), state its interaction with the per-file count, and say what prunes it and when.
2. Write the D-CLOUD-052 reopening argument in full or downgrade it to "recoverable concurrency accepted as a residual" — one of the two, explicitly.
3. Drop the footer argument; keep the switch-semantics gap (which is real and which the delta must specify: OFF disables future optional history, never purges, and does not cover mandatory transaction/suspect retention).
4. Adopt Claude's per-file keying as the concrete mechanism for priority 3 (protecting the deliberate loser from churn) — the two proposals are the same idea at different altitudes.

---

## 4. `mistral-analysis.md`

### Claims checked against the corpus

**Fails — and these are the kind of confidently wrong claims the brief asks reviewers to catch:**

- *"~1–2 s per replaced save on a handheld's Wi-Fi (**measured on the RG35XX SP against Dropbox**)."* — **There is no such measurement in the corpus.** D-CLOUD-046 says the exit-path "Numbers are filled in from Gate 4, not chosen"; #135 says budgets are "to propose after a first measurement"; D-QA-015 exists precisely because an unannounced device run happened once and was ruled a serious breach. Presenting an estimate as a completed device measurement is the single worst claim in any of the four analyses, and it must be withdrawn or replaced with the VM measurement (#135's `time-to-play` cell, which `issues/135.md` says can run on the VM).
- *"This is a stricter version of the existing guard for `.snapshots/` (SOURCE 10, `cloud_sync-rules.txt`)."* — **Misattributed.** SOURCE 10 contains no `.snapshots` rule; that rule exists only in #22 R2's *planned* reconciler arguments ("a guard with no writer"). The shipped allowlist is exactly the problem — it guards nothing against `.history`.
- *"The reconciler must fall back to size + mtime for hashless backends when verifying `.history/` entries."* — **Contradicts the plan of record.** R4 specifies "hashless backends by size + sha256 after fetch"; D-CLOUD-046 specifies "size plus a capped re-fetch." Mtime is the thing `--ignore-times` exists to distrust (R2). This amendment would weaken verification below the standard the plan already set.
- *"Nine kept versions of one game … ~700 KB of auto-states, leaving little room for game saves under the 256 MiB cap."* — The arithmetic refutes the conclusion: 700 KB is roughly 0.3% of 256 MiB, and D-CLOUD-036 already computed "nine kept resolutions of one game stay under a megabyte." The churn problem is real (Claude's §1.2 is the correct diagnosis) but it is a **per-unit keying** problem, not an aggregate-size problem, and the fix is per-file counting — not reopening D-CLOUD-099, a decision the maintainer made four days ago with the accidental-overwrite rationale stated. Mistral's own hedge ("if the maintainer's D-CLOUD-099 decision is reversed") admits the weakness.
- *Migration: "The reconciler ignores this folder … left untouched until the next settings restore, which will overwrite it."* — **Fabricated mechanism and data loss.** Nothing in the corpus says a settings restore touches `/storage/.cache/cloud_sync/replaced/`; and because the manual RESTORE row passes no `--update` (verified in `repo/code/cloud_restore-set-aside-excerpt.md`), some of those local copies are the newest version of a save that exists nowhere else. Ignoring them loses exactly the data the commission's migration rule exists to protect.
- *"The second publish detects the first's `record.json` and refuses to overwrite it."* — Invented mechanics. The plan's actual mechanisms are the own-manifest witness (R7: `duplicate-device-id` refusal, which fires before any publish and makes Mistral's cloned-card experiment moot) and the classifier. The real two-device race is GPT's, and it is not solved by record detection.
- *The pruning amendment ("if the head matches the version being pruned, the prune fails").* — Confused: a history entry equal to the head is a redundant copy of live bytes; evicting it is harmless. The correct rule (Claude's) is: never evict the newest history entry of a file whose unit has no live member in the head. Mistral's version would permanently pin every entry created by a restore-from-history.
- The pseudocode block violates the commission's output shape ("No code").

**Holds:**

- The auto-state churn observation itself (the diagnosis is wrong; the symptom is real).
- The audit-log suggestion for auto-heal — worth generalizing to all store mutations (see my revisions to Claude).
- The allowlist placement instinct (ahead of includes) is directionally right though the stated position ("before `+ /savestates/**`") is muddled; the delta's "ahead of every include" is the correct general form, and the competing includes for root-level `.history` members are the extension rules, not `/savestates/**`.

### Strongest argument
The D-CLOUD-099 reopen attempt — not because it succeeds (Claude's per-file keying achieves the maintainer's stated intent without reopening a four-day-old decision), but because it is the only place Mistral engages with a real tension.

### Weakest argument
The fabricated measurement, because it corrupts the evidentiary basis every other section depends on; the migration, because it loses data.

### Concrete revisions for Step 3
1. Withdraw the "measured on the RG35XX SP" clause; replace with the VM experiment or a labelled estimate.
2. Replace the D-CLOUD-099 reopen with the per-file count amendment, or state explicitly why per-file counting fails to protect the manual slot.
3. Rewrite migration per Claude/GPT (fold, verify, grace, delete).
4. Drop "size + mtime"; cite R4's actual hashless standard.
5. Fix the prune rule to the newest-entry-per-file definition.
6. Remove the pseudocode.

---

## 5. Cross-cutting adjudications

**The count keying.** Claude's per-(unit, member path) amendment is correct and is the minimal change that makes D-CLOUD-099 true; GPT's priority ordering is the same insight at policy level and should cite it as the mechanism; Mistral's reopen of D-CLOUD-099 is unnecessary. The player-facing label (VERSIONS KEPT PER SAVE) already promises per-file semantics, so the amendment is also a documentation-accuracy fix.

**Concurrency.** GPT's counterexample stands unrefuted. The complete treatment synthesizes all four members: Claude's hash-from-copy check (cheap; narrows the window; keep it), Gemini's retain-before-install (closes the follow-on local loss), and GPT's escrow-or-accept decision (the only thing that addresses the head race itself) framed as recoverable-vs-serializable for the maintainer. The delta must state which it takes; "no version is lost" (Claude) and silence (the delta) are both unacceptable.

**The age cap.** Claude's drop-or-trust-gate is the best-supported position (untrusted clocks are corpus evidence, not hypothesis); GPT's priority pins are a viable alternative; Gemini found the hazard and stopped. The 90-day number was approved as a "starting point … to measure against" (D-CLOUD-096), so reopening its age clause with the clock argument is legitimate and should be presented with the trust-gated alternative.

**Migration.** Only the Claude/GPT shape (fold → verify → grace → delete; upload unique local-cache bytes; mixed-fleet ordering as a release gate) satisfies "no earlier version is lost … a prompt is a failure mode." Gemini's and Mistral's versions both fail it, in different ways.

**Auto-heal.** Claude's mechanics (heal from the stage first, sticky-divergent fallback, symmetric cloud-side check) and GPT's conservatism (format-validity gate, intentional-erase handling, no silent rollback of an authorized restore) are complementary amendments; neither alone is sufficient, and the plain endorsements (Gemini, Mistral) both miss the R5 no-fetches contradiction.

## 6. Failure modes every analysis missed or under-developed

Convergence here is a shared blind spot, not correctness:

1. **Witness-before-retain ordering.** R7's own-manifest witness refuses a cloned card's publish — but if the retain precedes the witness, a cloned card still writes store entries for a publish that will be refused. Nobody ordered the two.
2. **Audit lineage for routine retains and prunes.** #23 mandates an audit line per wizard discard before the apply; the delta's universal retains and the pruner's deletions have no equivalent requirement. The store is the player's last resort; its mutations need D-CLOUD-027 lineage. (Mistral's audit point covers auto-heal only.)
3. **The startup sync's backup half now retains too**, lengthening the boot sync and raising the probability a launch cancels it — symmetric to the exit cost Claude quantified, unexamined by all four.
4. **The auto-rule churns the store twice.** #23's divergent-`.state.auto` rule installs the cloud's auto as slot 4; that installation overwrites any existing slot 4, which under retain-before-publish creates a store entry — per divergence, in addition to the entries the delta already creates. Nobody modeled the interaction.
5. **Soft-cap semantics.** With pruning confined to full passes, an exit-only device overshoots both the count and the 256 MiB cap between full passes; the README and settings page must not promise a hard ceiling. Claude and GPT each touch the edge of this; nobody states it as a required disclosure.
6. **The wizard's pre-pass retains survive a quit.** #23: quitting discards decisions but "the pre-pass … has already happened and is not undone"; under the delta, the pre-pass's pushes retained first. Harmless, but the delta should say the entries exist and why.
7. **The delta never says when the allowlist rule ships.** Claude's ship-one-image-early amendment is the only treatment; it should be mandatory text in the delta, not a review finding, because the store is unsafe under the shipped rules from the first retain until R1 completes.

## 7. Where the other members changed my read

- GPT's counterexample changed my assessment of Claude's §1.3: I initially read the hash-from-copy amendment as closing the two-device race; it does not, and the follow-on through agreement advancement makes the residual a data-loss window, not a near-miss.
- Gemini's retain-before-install filled a gap I had accepted as covered; it is not covered for the race follow-on, and the delta's publish-only retention is asymmetric in a way the corpus does not justify.
- Claude's §1.2 changed my read of D-CLOUD-099: I had read the auto-state decision as settled coverage policy; keyed per unit, it is self-defeating, and the per-file amendment is the first thing I would write into the delta.

## Provenance (as embedded; not independently re-hashed)

All paths under `research/council-runs/2026-09-11-save-history-one-home/_sources/`, manifest read_timestamp_utc `2026-09-11T19:31:42Z`:

| path | sha256 (verified at embed time) |
| --- | --- |
| `00-problem-statement.md` | `f7d770768b3bf81985b7415b4d82f8ee9ef26965a98eb6c47c166f54db673b27` |
| `repo/docs/save-history-plan-delta.md` | `1d320545319eba2e8852d830d52f76ab3a417e48e365d01fe79231bade77da8b` |
| `repo/docs/save-history-gap-analysis.md` | `d1107b7e1790b8e8aab177411b96bb3828f69e389fbc8e33c36ce616f67105aa` |
| `repo/docs/decision-register-excerpt.md` | `46ccfb71ef85537639501c2973a5b02fd81b6d5772662608ead073b209ea2726` |
| `repo/docs/es-menu-map.md` | `6d7813f91e37510f5578f35adec3f9372ed34e1ce5d871fcc0f34e392b202911` |
| `repo/rules/time-to-play.md` | `97d2fbba79fa42f22def37e4ff90e18149fc9fbc216d255d091da3dc187075da` |
| `repo/rules/es-native-ui-excerpt.md` | `32be1ee4164c9d1f09e7a9e9c8c25f526e70802f75901e456097bdb5c02d46e4` |
| `repo/code/cloud_backup-set-aside-excerpt.md` | `e5b57d74b83046fc7ebf44b4129c68815a575b35553e938c2ae377c685852509` |
| `repo/code/cloud_restore-set-aside-excerpt.md` | `c0dacd8aa1eb1a4df2986447a853cc3c47b666b6234127e61783a151faa448bd` |
| `repo/code/cloud_sync-rules.txt` | `bdb7e18128ce4a604c9b02cfe5b0f10f4e3e4dfd3aa7e
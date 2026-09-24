**Vote: `claude-revised_plan.md`**

---

## Reasoning

I weighed the four plans against the brief's ordering: protect player progress first, then groundedness, buildability, sequencing, and simplicity. `claude-revised_plan.md` is the only plan with **no identified path that drops a copy**, and it achieves that with *less* machinery than the alternatives, not more.

### Why `claude-revised_plan.md` wins on protection of player progress

Its core replacement — **store-first** ("nothing becomes the head, and nothing leaves the head, unless that version is already in the store") — closes the two-device race from `gpt-analysis.md`'s schedule *for bytes*, with no residual: A's HA is escrowed and verified before it becomes head, so B overwriting it loses nothing. Every publish (exit push, full pass, wizard apply, #25 restore, MATCH) travels one code path: upload the entry from the local stage, verify, then write the head from the same stage.

Compare the alternatives' race handling:

- **`gpt-revised_plan.md`** recommends the conditional retain-before-install backstop and states its residual honestly: HA is not recoverable from the cloud alone until A next syncs, and if A's local copy disappears first (lost card, continued play), HA is gone. The brief is explicit that "a plan with an elegant store and one path that drops a copy is worse than a plainer plan with none." Gpt's plan has such a path; claude's does not. Gpt withdrew escrow as "insufficiently costed" — but claude's revision *does* cost it (§5: +1 spawn, +1× changed bytes, admission ceiling counts escrow bytes, defer-together, measurement via H6/#135), which removes the basis for that withdrawal.
- **`gemini-revised_plan.md`** adopts the same backstop but overstates it as "the cheapest sufficient form to *guarantee* recoverability" — it does not guarantee it, and gpt's own statement of the residual proves it. Overstating a safety property in a plan of record is worse than stating a weaker one honestly.
- **`mistral-revised_plan.md`** keeps the delta's retain-the-old-head mechanism and adds the fetch backstop — same loss window as gpt, stated less precisely.

Claude's mechanism is also *cheaper exactly where the store matters most*. The gap analysis (§2.5) and D-QA-017 establish that WebDAV/SFTP/SMB keep no versions — the store is those users' only history. On those backends, retain-old-head streams the old save down and back up through the handheld (3S of Wi-Fi traffic per publish, as mistral's own ledger shows); store-first moves 2S and never needs a server-side copy anywhere. On Dropbox/S3, gpt's server-side copy saves ~1S of upload — negligible at 8–128 KB per save, and PPSSPP-sized units defer under the admission ceiling either way.

Beyond the race, claude's protection stack is the most complete: P1/P2 (never prune head-equal or pending-referenced entries; never prune the last complete entry of a file with no live head) ahead of the three caps; per-file count keying that makes D-CLOUD-099 true instead of letting auto-state churn evict the manual slot it was decided to protect; the erase-twice heal loop broken by a second-occurrence question; copy → verify → record → delete migration in *both* directions (including the device-local `.cache/cloud_sync/replaced/`, which gemini's plan never mentions); and a standing, path-aware fold for old-image damage with the residual stated rather than claimed closed.

### Why it wins on groundedness and buildability

The concessions section (§1) corrects ten specific errors against the corpus, and its load-bearing claims are checkable and correct: the shipped `cloud_sync-rules.txt` really does match `.history/` members at any depth (`+ /**/*.srm`, `+ /**/*.state*`) while `record.json` and PNGs fall through to `- /**`; #22 R6's refusal text really is stale against D-CLOUD-076; the delta really does contradict D-CLOUD-047's third sentence while listing it as unchanged. The mechanism reuses D-CLOUD-052's transport unchanged (no reopening), needs no coordination protocol, and its one piece of new local state (`in_store`) fails safe — a lost flag costs a redundant entry, not a lost version. The F1–F6 / R-a–R-g split is exactly the "safest if adopted as written" structure: a small load-bearing core, everything else explicitly following. H1–H10 are cheap, decisive VM experiments sequenced before the expensive building, matching D-QA-007/015/017.

### Where the others fall short, specifically

- **`gemini-revised_plan.md`** is a well-chosen amendment list, not a buildable plan: no migration procedure for the local set-aside cache, no pruning-race protections, no heal-loop handling, no README-truthfulness rule (V1 must not advertise #25), no audit coverage, no settings mechanics. Its one distinctive mechanism — amending D-CLOUD-046 to permit a bounded fetch per suspect unit on the exit path — spends download time on the one path D-CLOUD-098 measures, for a case claude covers from the capture stage without touching R5's push-only contract.
- **`gpt-revised_plan.md`** is the strongest loser and nearly tied on thoroughness, but it is more machinery for a weaker guarantee: two code paths (publish-retain plus fetch-backstop with a "continued protection must be established" witness condition that is subtle to implement correctly), a manifest-carried shared-policy revision system, and the stated loss residual. Its backend-dependent cost profile (1S–3S) is worst on the backends that need the store most.
- **`mistral-revised_plan.md`** keeps the 3S mechanism, and its mitigation — "retain and verify in the background after the card says the player may go" — collides with D-CLOUD-076 (a launch cancels the sync, stranding the publish the card implied was done) and D-CLOUD-077 (the outcome line would claim completion before verification). It lacks concurrent-pruner protections and its D-CLOUD-052 row restates the residual less precisely than gpt does.

---

## Dissent: what the losing plans have that the winner does not fully absorb

These must survive into the final synthesis.

**From `gpt-revised_plan.md`:**
1. **Reserve the latest deliberate conflict loser against routine count churn** (§5.2). Claude's per-file count protects a manual slot from *auto-state* churn, but repeated overwrites of the *same* file after a wizard decision can evict the wizard loser — D-CLOUD-032's stated primary use case. Not absorbed.
2. **Decided deletion vs. unexplained absence in only-copy protection** (§5.4). Claude's P2 makes the last entry of any file with no live head permanent — including REMOVE EVERYWHERE results, which become permanent cap-exempt copies. Gpt's refinement (decided deletions expire under ordinary policy; unexplained absences keep only-copy protection) is more correct and must refine claude's P2 and D-CLOUD-096's wording.
3. **Orphan process quiescence before launch** (§8.5, refining D-CLOUD-093). Lock release is not proof that orphaned writers ended; track and stop the process group before a game starts. Claude only separates entries by run-id.
4. **Two-pruner fallback** (§5.6, §10): if the pruning-safety properties cannot be proved on the two-pruner fixture, *disable destructive cleanup* for the affected entries and report the overrun. Claude has run-count grace but no explicit disable-fallback.
5. **Shared-policy authority via causal revisions** (§5.7): ON wins and the larger count wins on incomparable changes, but a later explicit edit supersedes — avoiding the eternal-maximum ratchet in claude's "largest declared count."
6. **Completion is a separate fact from retention** (§3.2): readers must distinguish a recoverable earlier copy, a copy retained before an *interrupted* operation, and debris. Claude's member-verification rule covers completeness but not the operation-outcome distinction.
7. **Legacy/unknown `reason` for migrated entries** (§3.1): a `-replaced/` stamp can contain sync-mode *deletions*; importing everything as `reason: replaced` fabricates an event. (Also in `mistral-revised_plan.md` §1.)
8. **Narrower auto-heal for nonzero uniform files at plausible full size** (§7) and **truthful recovery wording** ("looked incomplete," not "was damaged," per D-CLOUD-077). Claude heals all first-occurrence uniform files and keeps D-CLOUD-100's wording.
9. **Planner-level rejection of reserved paths** regardless of custom filter or hostile `--files-from` (§6.2), and the R1 census gate explicitly exercising MATCH with hostile inputs (§10). Claude guards by filter rule and H2; the planner-enforced boundary is stronger.
10. **Request-based cost accounting** (§8.2–8.3, `k + 4` requests, metadata and retries in the admission ceiling) and the **multipart S3 ETag ≠ MD5** caution (§8.4) — both should inform claude's H6 and H1.
11. **Idempotent import receipts** mapping source → verified destination for migration retry (§6.5 step 4).

**From `gemini-revised_plan.md`:**
12. **The rules-file upgrade hypothesis** (§5.2): whether `cloud_sync_helper` actually delivers the `- /.history/**` guard to devices with user-edited rules files on upgrade. If it does not, the standing fold is the *only* defense for those devices. Claude's H5 tests old-image behavior but does not name this specific upgrade-path audit.
13. **Bounded exit-path fetch for auto-heal as a fallback position** (§3.2) — claude explicitly rejects it in favor of full-pass fetches; the disagreement and its D-CLOUD-046/D-CLOUD-098 framing should be recorded for the maintainer, not silently dropped.

**From `mistral-revised_plan.md`:**
14. **Both-suspect and good-copy-unavailable cases named as wizard questions** (§7) — claude covers the cloud-head-suspect and stage-missing cases; mistral's enumeration is a useful checklist for the suspect fixtures.
15. **The auto-rule double-churn and wizard pre-pass retention disclosures** (§12) — claude absorbs both (§3.1, §6), so these are confirmations, but mistral's framing of the slot-4 overwrite as a store-churn source belongs in the H6 measurement plan.

---

## Remaining defects in the winner that must be fixed before building

1. **The digest-skip can skip into an unprotected entry.** Claude's retain path says "the entries upload is skipped when the listing shows the digest." But if the digest-visible entry is itself pruning-eligible, skipping the upload leaves the version protected only by an entry another device's pruner may delete — gpt's "continued protection must be established" condition applies to claude's skip too. Fix: skip only when the found entry is protected, or re-protect/refresh it.
2. **Wizard-loser eviction by same-file churn** (gpt dissent #1) — the per-file count alone does not preserve D-CLOUD-032's primary undo case. Absorb the deliberate-undo reservation into C1.
3. **P2 permanence for decided deletions** (gpt dissent #2) — absorb the decided-vs-unexplained split.
4. **The count ratchet** (gpt dissent #5) — "largest declared count" can never decrease; adopt a supersede rule.
5. **Migration misclassifies sync-mode deletions** (gpt/mistral dissent #7) — add the `legacy`/`unknown` reason before the fold writes anything.
6. **The #21 stage-lifetime dependency is unverified.** Heal-from-stage (F4) and lazy retain-from-stage both rest on an amendment to a document outside the corpus (claude's own G1/H7). If #21's stage does not keep the agreed version until superseded, the exit-path retain and heal costs change shape. This must be settled before F4 is treated as foundation — claude flags it honestly, but it is the plan's single largest unverified load-bearing assumption.
7. **Orphan quiescence before launch** (gpt dissent #3) should be absorbed as a D-CLOUD-093 refinement alongside claude's run-id separation.

None of these defects loses a save as the plan is written (the worst, #1, requires a specific prune-skip race and is fixable in one rule); they are amendments, not re-architecture. That is precisely why `claude-revised_plan.md` earns the vote: the strongest safety invariant on the table, the simplest uniform mechanism, honest accounting of what it does not know, and a foundation small enough to build first.
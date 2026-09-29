# Retrospective -- the audit of the fixes to #313's items and #315, and the pass that fixed its findings

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1 in the session; the seats through the council Facilitator on OpenRouter, D-WORKFLOW-049)
**Date:** 2026-09-29 02:13 UTC (written after Phase 7, before the one build's images; the running log has the order)
**Subject:** how two seats read the whole of the fix round's fixes (`1b0d233657..02546235c1`, `87b182fbe..c15c698367`, #315's `320d2b2bea..286759eb6d`) in one night, how their 48 findings were settled, and what the audit of a fix pass can and cannot see
**Spec:** `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/05-punch-list.md` (the 34 items); #313; #315; the maintainer's words in `00-running-log.md`

---

## Running Notes

### What the audit did (the shape)

Three packets, each the branch diff whole and cut after the last commit (the 2026-09-28 lesson: a packet of named files at first delivery misses hunks and audits a branch that has moved) -- the distribution's upstream-bound paths (253 KB, 41 files), the EmulationStation fork (156 KB, 34 files), #315's four files (18 KB) -- to two seats each, with the 34 items' acceptance text (`seats/items.md`) and no outcomes, so the seats judged the diff against the contract and not against a claim. Six outputs, every one `outcome=success` and the served model the pinned one. 48 findings (31 on the fixes, 17 on #315), each re-read against the source by the orchestrator in Phase 2.5/4.5; the confirmed ones fixed in one pass by the orchestrator (a few lines each, no streams), each with a harness case seen to fail against the tree before the fix (`--old BASE_REF=286759eb6d`); the Phase 6 issue (#319) with one checkbox per item; Phase 7 recorded per item.

### What worked

- **The packet is the branch diff, whole.** Both seats reported "outside the packet" with precision (the ES seats on the distribution's items, the distribution seats on the ES items and on `tools/`, `.githooks/` and the rules), which is a scope map read back from the seats rather than asserted by the orchestrator. No hunk was found missing afterwards.
- **Confirm by execution where it is cheap.** gpt G3-D-01 (a sourced `RANDOM=` assignment runs a command substitution through bash's arithmetic evaluation) was graded by running the seat's canary on the host: it wrote the file. Read alone, it would have been "theoretical"; run, it is a High with a fix and a case.
- **Refute with the artifact, not the argument.** Five refutations, each with a thing a reader can re-check: the image's busybox `unzip -lv` measured to print the CRC-32 column; `F2-autoslot` 9 PASS on the guest; `cloud-signin-window.c:870` passing the Osk; `emulationstation2.po:5317`; a grep for readers of `.added`. One refuted premise (the CRC column) was still taken as a guard, because a lesser busybox is a plausible upgrade path.
- **One harness section per pass.** S3F holds every case of this pass, and the positives were shown in one `--old` run against `286759eb6d`: the whole pass fails as one section on the old tree and passes as one on the new, which is a shape a reader can re-run.
- **The credential guard refused the audit's own commit** (claude's ES output quoted the hooks' run-time fixture as a literal). Right on both counts: the fixture is built at run time and never written down, and the finding lost nothing by `<a credential-shaped value>`.

### What was harder than expected

- **A running harness was edited under itself.** The first full run mixed old and new scripts because the fixes were being written while it ran (bash reads a script by offset; `engineering-practices.md` § Never edit a shell tool while a run is in flight). The run was discarded and re-run whole after every edit had landed. The rule existed; the pressure to see a number sooner won once.
- **A silent batch.** One Python edit script died on a `SyntaxError` in a print and applied none of its edits (the pre-push prefixes, the migration's reader); the omission was found by grepping for the new text, not by the script saying so. A batched edit is checked by its result, never by its exit.
- **The harness's own grammar.** A check message carrying `\$(` broke the harness's parsing of its own check line; two messages were reworded. A check's message is code.
- **The fixes' own shape failed twice.** PL-010's scrub rule, written as a whole-tail mask, over-applied to a line the PL-014 case had fixed the shape of (rewritten key by key); PL-006's ack-by-rename broke the D35 race case, which keyed its shim on the old marker name (re-keyed on `index-pending.ack.*`). Both were the harness doing its job on the auditor's fixes; both cost one run each.
- **Two seats, one item, two verdicts -- and a summary written from one of them.** On PL-030 (the save-state COPY and the transfer lock) the claude ES seat returned *holds in part* (the refutation branch) and the gpt ES seat *does not hold as an evidenced closure* (comments, not protection or a regression case; the three load-bearing claims outside the packet). `02-forward-audit.md` § The seats' per-item verdicts said no item was returned as not holding. That sentence was written from the claude seat's shape and the gpt distribution seat's, before the gpt ES table had been read row by row; the scorecard in `04-analysis.md`, built per seat per item, found it. The three claims were then verified by line (04 § scorecard, PL-030) and 02 carries the correction. Blindspot 22's family: a summary written before every row was read.
- **The contract files came last.** The fixes went first, because the one build waits on them (D-WORKFLOW-063) and the analysis does not; 03, 04 and the second opinion were written after Phase 7, and `tools/lint-audit-artifacts` -- which the skill says to run before Phase 6 -- was what said so. The lint was right and the order was wrong; nothing in the fixes changes, but the second opinion now reads an audit whose fixes are already in the tree, which is a weaker check than one that could still change them.

### Cross-epic seams this audit was placed to see

- **One grammar, five copies.** `conf_valid` lives in `cloud_backup`, `cloud_restore` and `cloud_sync_helper`, and the two content scripts carry readers of their own; `conf_get` is in `cloud_setup`, now shared by `cloud_migrate_layout`. Every grammar finding (G3-D-01, G3-D-02 claude, G3-D-05 claude) was a fix to three or five places, and S3F runs each canary against every copy. The seam is the copies themselves: a sixth reader written from memory would not get the NUL check or the shell-owned names. The lead: one sourced library for the grammar, which `001-functions` is the natural home for, in the next round.
- **The hooks in two repositories.** `guard-lib`, `commit-msg` and `pre-push` exist in the distribution and in the EmulationStation fork; every hook finding (G3-E-01, -02, -05, -06, -07) landed twice, with two test suites (`hooks-test` 38, `pre-push-test` 22) for one contract. They drifted before (#313 PL-011's exemption existed in one and not the other) and will again; a shared file the ES fork vendors from the distribution is the lead.
- **The capture manifest and the transfer scripts.** PL-030's refutation rests on a negative -- no transfer script reads `/storage/.cache/cloud_sync`'s manifest or stage -- that nothing asserts but a grep in this audit. The lead, for the harness: a case that greps the five scripts for `manifest-`, `cloud_capture`, `/stage` and `.capture` and fails on a hit, so the day a script starts reading the manifest, the refutation breaks loudly instead of silently.
- **The interface's settings store and the scripts' writers.** gpt G3-E-02 (the recovery record published outside the settings lock) is a race between `SystemConf` in the interface and a script writing `system.cfg`; it is deferred with its reason (a millisecond window, an older record rather than a lost one) and is the one finding of this audit that crosses the interface and the scripts on one file. It goes to #317's release as a follow-up.

### What the audit could not see

- Nothing ran on a device; the VM's busybox (through the harness) and the guest (through the proofs of 2026-09-28) are the runtime evidence. The H700 twin of every build is built and unstaged (D-WORKFLOW-062).
- The seats read diffs, not frames; the interface findings are about code paths. The frames are the walks' and the proofs' business, on the cut.
- The #315 packet was read before its refinement landed (the seats' findings *were* the refinement); the refined scripts had the orchestrator's read and the harness (S315), not a second seat pass.

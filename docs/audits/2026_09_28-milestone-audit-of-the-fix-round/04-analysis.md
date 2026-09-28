# Analysis — the whole fix round for #307/#308, audited before the candidate (D-WORKFLOW-060)

**Auditor:** Code Auditor skill (orchestrator: Claude Fable 5.1; the seats `anthropic/claude-fable-5.1` at xhigh and `openai/gpt-6-astra` at max through the council Facilitator on OpenRouter, D-QA-048/049)
**Date:** 2026-09-28 (opened 15:08 UTC)
**Subject:** the distribution `417dcd8610..1b0d233657` and the EmulationStation fork `7eae8ed91..87b182fbe` -- the eight streams' first deliveries and follow-ups, and the integrator's own commits -- judged against #307's acceptance text, #308's rows and the first audit's 165 findings
**Spec:** `01-research-notes.md`

---

## Executive summary

**The round did what it set out to do, and the audit of the whole of it says the candidate is not ready as the tree stands: fourteen High defects, all small, all named with their fix, sit in the follow-ups and in the integrator's own guards.** Twenty seat calls over ten whole-branch packets returned 192 findings (Critical 0, High 16, Medium 71, Low 105). The orchestrator re-read every High against the source, running four of them: thirteen confirmed, one re-graded to Medium, two the same finding. A screen of the blindspot register against the round's diffs added five confirmed repeats, one of them High. The shape is one shape, in fourteen places: a guard added in the round that fails open on its own error -- a validator that accepts a carriage return before a comment (`conf_valid`, five copies), a safety copy restored on non-emptiness alone, a snapshot worklist whose failure reads as "nothing to protect", a credential scan with two holes (a flag-form password; a quoted value beginning with a space), a restore marker the archive can overwrite, a reader that still executes the configuration (`backuptool`), a tier guard a dot component walks past, a masking parser an escaped quote defeats, the hooks that pass a commit when their own pattern is invalid, and the exemption that stops them reading the audit's own packets. Plus one thing earlier builds left on the card that no fix answered: cloud passwords in a persistent log.

**What holds.** The 81 punch items are implemented on the reports and both audits' seats (no item drew "does not hold" from any seat in either audit); 21 are proven on the VM on the exact candidate build (`1b0d233657`: vm-qa run 69 fifteen suites, proof-298, the streams' proofs run 2); 56 rest on the harness's 844 checks and the reports' FAIL-then-PASS lines with no VM proof named; PL-032 is partial on a font decision; PL-081 is the PR-prep pass's. The 165 first-audit findings are all answered; this audit's seats accepted 18 withdrawals and disputed three (the pid-only lock as a correctness closure -- held as accepted risk, D-INFRA-012; a stored folder's re-validation, Low). The seams between streams agree on the read (the outcome words and the card's table, the proxy's tokens, the settings lock, the join's answer type); one seam defect is confirmed (two readers of one configuration file disagree on a duplicated key).

**What to do before the candidate.** The fourteen Highs and the six confirmed Mediums are the punch list's FIX-NOW set (`05-punch-list.md`), each with a case first; they touch five scripts, one C++ file, the two hooks in two repositories and one rule. The fixes go back to the streams that own the files (their agents keep their context) and to the integrator for the hooks and the lint; then one more cut, vm-qa and the proofs' scripts on it, and the candidate is called from that. The seats' Mediums that are leads go to the streams with the same instruction (read, fix with a case, or withdraw with the line); the test and lint gaps are the next round's. Nothing here changes the design decisions of the round; it changes their guards.

**Corrected after the second opinion (Phase 4.6, both passes; the sentences above are left as written, this paragraph governs).** Thirteen Highs, not fourteen (PL-013 is Medium), and eighteen Mediums, not six: 34 items in `05-punch-list.md`. "The 81 punch items are implemented" reads: 79 of #307's items are claimed implemented at the evidence levels the seats read -- no item drew "does not hold" -- and two (PL-081, the PR-prep pass, and one other) are struck on the issue as outside the round; implemented is not acceptance-complete, and the per-item table in 02 is the ledger. "21 proven on the VM" is 20 rows plus PL-032 (partial) and PL-069's leak measurement. "Every fix came with a case seen to fail first" holds per fix where the report says so and has O-2's read-only exception; a suite total proves nothing about it. "Five copies" of the validator: three gate a `source`, two are readers. The fixes' scope is the items' own file inventory. O-16 is qualified in 02 (complete for spelled siblings; the dot case is PL-009). The capture interaction is O-6 plus PL-034, not "safe by the bound". "Answered" for the first audit's findings means a response received, and 02's cross-check separates verified fixes, substantiated withdrawals and accepted risks. The unread leads are pending, five of them gated as PL-030..034. D-INFRA-012 accepts PID reuse; `pid_max` is not a wait bound. And "no VM proof named" does not make an item incomplete whose criterion is a host, unit or build test.

## Acceptance-criteria scorecard

81 items. "first delivery" is the fix audit's seats (opened after this audit's verdicts were written, Phase 2.5); "whole branch" is this audit's; the VM column is the streams' proofs' second run on `1b0d233657` where a script names the item; the orchestrator's column is the verdict that stands. Pass rate: 79 implemented (21 VM-proven, 56 on the harness and the reports, 2 the VM could not run), 1 partial, 1 not this round's. No item fails.

| item | sev | stream | first delivery (fix audit: claude/gpt) | whole branch (this audit: claude/gpt) | VM run 2 on 1b0d233657 | orchestrator |
|---|---|---|---|---|---|---|
| PL-001 | Critical | A | holds / holds | holds / holds | PASS | implemented; proven on the VM |
| PL-002 | High | F2 | holds / holds in part | holds / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-003 | High | B | holds / holds | cannot tell / in part | CANNOT RUN | implemented; the VM could not run it (see run 2) |
| PL-004 | High | B | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-005 | High | B | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-006 | High | B | holds in part / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-007 | High | B | holds / holds in part | holds / in part | PASS | implemented; proven on the VM |
| PL-008 | High | B | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-009 | High | B | holds / holds in part | holds / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-010 | High | B | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-011 | High | B | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-012 | High | A | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-013 | High | D | holds in part / holds in part | in part / in part | PASS | implemented; proven on the VM |
| PL-014 | High | E2 | holds in part / holds in part | cannot tell / cannot tell/in part | PASS | implemented; proven on the VM |
| PL-015 | High | C | A: holds; C: holds / A: holds; C: holds in part | holds/in part / cannot tell/in part | - | implemented on the reports and the seats; no VM proof named |
| PL-016 | High | C | holds / holds in part | in part / in part | PASS | implemented; proven on the VM |
| PL-017 | High | C | holds / holds | holds / holds | PASS | implemented; proven on the VM |
| PL-018 | High | C | holds / holds in part | holds / in part | PASS | implemented; proven on the VM |
| PL-019 | High | F1 | holds in part / holds in part | in part / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-020 | High | A | holds / holds | holds / holds | PASS | implemented; proven on the VM |
| PL-021 | High | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-022 | High | F1 | holds / holds in part | cannot tell / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-023 | High | F1 | holds / holds in part | in part / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-024 | High | E1 | holds / holds in part | cannot tell/holds / cannot tell/in part | PASS | implemented; proven on the VM |
| PL-025 | High | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-026 | High | A | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-027 | High | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-028 | High | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-029 | High | E2 | holds / holds in part | cannot tell / cannot tell/in part | PASS | implemented; proven on the VM |
| PL-030 | High | A | A: holds; E2: holds / A: holds; E2: holds in part | cannot tell/holds/in part / cannot tell/in part | - | implemented on the reports and the seats; no VM proof named |
| PL-031 | Medium | B | holds / holds | holds / holds | CANNOT RUN | implemented; the VM could not run it (see run 2) |
| PL-032 | Medium | F2 | holds in part / holds in part | in part / in part | PASS | partial: the code and the patch stack fixed and the widget log lines proven; the frame half waits on D-UI-111 |
| PL-033 | Medium | F1 | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-034 | Medium | F1 | holds in part / holds in part | in part / in part | PASS | implemented; proven on the VM |
| PL-035 | Medium | B | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-036 | Medium | B | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-037 | Medium | B | holds / holds | holds / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-038 | Medium | B | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-039 | Medium | B | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-040 | Medium | B | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-041 | Medium | B | B: holds in part; E1: holds / B: holds in part; E1: holds in part | cannot tell/in part / cannot tell/in part | - | implemented on the reports and the seats; no VM proof named |
| PL-042 | Medium | F1 | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-043 | Medium | F2 | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-044 | Medium | B | holds / holds | holds / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-045 | Medium | B | holds / holds in part | holds / in part | PASS | implemented; proven on the VM |
| PL-046 | Medium | B | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-047 | Medium | C | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-048 | Medium | C | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-049 | Medium | C | holds / holds in part | holds / in part | PASS | implemented; proven on the VM |
| PL-050 | Medium | C | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-051 | Medium | C | A: holds; C: holds / A: holds in part; C: holds in part | holds/in part / cannot tell/holds | - | implemented on the reports and the seats; no VM proof named |
| PL-052 | Medium | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-053 | Medium | A | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-054 | Medium | E2 | holds / holds | cannot tell/holds / cannot tell/in part | - | implemented on the reports and the seats; no VM proof named |
| PL-055 | Medium | D | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-056 | Medium | E2 | holds / holds | cannot tell / cannot tell/in part | - | implemented on the reports and the seats; no VM proof named |
| PL-057 | Medium | D | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-058 | Medium | D | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-059 | Medium | D | holds in part / holds in part | in part / in part | PASS | implemented; proven on the VM |
| PL-060 | Medium | D | holds in part / holds in part | holds / holds | PASS | implemented; proven on the VM |
| PL-061 | Medium | E2 | holds in part / holds in part | cannot tell/holds / cannot tell/in part | PASS | implemented; proven on the VM |
| PL-062 | Medium | E2 | holds / holds | cannot tell/holds / cannot tell/in part | PASS | implemented; proven on the VM |
| PL-063 | Medium | E1 | holds / holds | cannot tell/holds / cannot tell/in part | - | implemented on the reports and the seats; no VM proof named |
| PL-064 | Medium | E1 | B: -; E1: holds in part / B: other (no verdict word); E1: holds in part | cannot tell/in part / cannot tell/in part | PASS | implemented; proven on the VM |
| PL-065 | Medium | E1 | holds / holds in part | cannot tell/holds / cannot tell/in part | - | implemented on the reports and the seats; no VM proof named |
| PL-066 | Medium | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-067 | Medium | A | holds / holds in part | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-068 | Medium | E1 | E1: holds in part; E2: holds / E1: holds in part; E2: holds in part | cannot tell/holds/in part / cannot tell/in part | PASS | implemented; proven on the VM |
| PL-069 | Medium | E1 | holds / holds in part | cannot tell/holds / cannot tell/in part | - | implemented; the VM shows the launch cycle growth (#310), the sync leak gone |
| PL-070 | Medium | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-071 | Medium | A | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-072 | Medium | E1 | holds / holds in part | in part / in part | PASS | implemented; proven on the VM |
| PL-073 | Low | F1 | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-074 | Low | C | holds / holds | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-075 | Low | E1 | holds / holds | cannot tell/holds / cannot tell/holds | - | implemented on the reports and the seats; no VM proof named |
| PL-076 | Low | F1 | F1: -; F2: holds ("holds in the diff, credited elsewhere") / F1: other (no verdict word); F2: holds | cannot tell/holds / cannot tell/holds | - | implemented on the reports and the seats; no VM proof named |
| PL-077 | Low | B | holds / holds | holds / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-078 | Low | E1 | holds / holds | cannot tell / cannot tell | - | implemented on the reports and the seats; no VM proof named |
| PL-079 | High | A | - / holds ("present"; a paragraph, not an index row) | holds / holds | - | implemented on the reports and the seats; no VM proof named |
| PL-080 | Medium | A | - / holds ("present"; "A30 is a constructed progress-stream test, not a measurement") | holds / in part | - | implemented on the reports and the seats; no VM proof named |
| PL-081 | High | - | - / - | struck on #307 (the PR-prep pass, #256; outside this round) | - | not assessed here; the "holds / holds" it carried was unsupported (the refutation pass) |

## Code-quality assessment

**Strengths.** Every fix came with a case seen to fail first (844 harness checks, the ES unit suites at 1813 assertions, six new app suites); the outcome vocabulary is kept to the letter (`vocabulary-check` 0 wrong, French 599 of 599); the follow-ups answered 165 findings in a morning without a "not answered"; the register carries the round's decisions the same day (33 rows); the streams' reports say what they could not do.

**Concerns.** One grammar in five hand-kept copies (and a sixth reader without it); guards whose own failure paths were not written (§ Risk); a fast path narrower than the slow path it guards (the redaction); two readers of one file with different rules; a fix that moved a check earlier and left its old fixture behind (the rehearsal's wait); a scanner exemption keyed on a path. **Complexity hotspots:** `backuptool` (+2612 lines net in the round, the restore's snapshot, marker, seed and rollback paths interleaved -- four of the seven B Highs sit there), `cloud_migrate_layout` (nine raw-string compares on three pointers), `AtomicFileUtil.cpp` (three recovery paths with three notions of "whole").

## Cornerstone conformance

MEDIUM (`03-retrospective.md` § 3.2, § 3.7). `engineering-practices.md` § Guards must fail closed: met by the first deliveries, broken in the follow-ups and the integrator's guards in fourteen places. `upgrade-and-install.md`: the Already-written answer is missing twice (BS-1, G2-A-05). The vocabulary and the ES rules: met. `packaging-and-patches.md`: `pkgcheck` rc 0 on all 21 recipes. `documentation-accuracy.md`: unmet and tracked (#42). The invariants: progress above recency untouched; no secrets in backups strengthened and still holed (G2-B-02, G2-B-07, BS-1); the allowlist filter honoured (G-A-O1); every change landing on state answered per stream, with the two gaps above.

## Spec fidelity

Divergences recorded, none silent (`03-retrospective.md` § 3.3): PL-034, F1's part (a), the match page's retry, PL-077's refusal in place of two archives, PL-076's owner. This audit's seats read 48 item-seat pairs weaker than the fix audit's -- packet scope for most (a split item's other half, the plan withheld), mechanism for the Mediums in `02-forward-audit.md` § The Mediums.

## Missing artifacts

The upgrade rehearsal on `1b0d233657` (its guard cannot fail, BS-5, and the QA pair was busy); a case for the CR hole in each of five copies; a case for each of the seven fail-open follow-ups; the public docs (#42); scripts for E1's follow-up proofs, three of E2's, the migration on a backend; a device fact for PL-018; the lint's coverage of this audit's ids (fixed while it ran). Search trails in `03-retrospective.md` § 3.6.

## Risk assessment

Ranked by what it costs a player if the candidate shipped as the tree stands (all confirmed; the fix for each is in `05-punch-list.md`):

1. **Every save in the cloud deleted by TIDY UP YOUR CLOUD FOLDERS** when the saves pointer carries a trailing slash (G2-A-01 claude): the tier is copied onto itself, verified clean, and its files deleted. Needs a hand-edited or older conf; the outcome is total.
2. **A command in `cloud_sync.conf` runs** through a one-byte hole in the validator (G2-A-01 gpt, five copies) or through `backuptool`, which never got the validator (G2-B-01).
3. **A cloud password at rest on the card**, in `cloud_sync.log`, on any device that once had a failed remote create (BS-1); a flag-form password in a log (G2-B-02); a quoted password beginning with a space in a published backup (G2-B-07).
4. **A restore without its snapshot or with its marker overwritten** (G2-B-04, G2-B-06): the rollback then cannot put the settings back, and may say it did.
5. **The valid configuration replaced by a truncated copy** by the cleanup's own fallback on a full card (G2-A-02, two scripts).
6. **A password fragment in the log** past the masking parser's escaped quote (G2-E-core-01).
7. **The tier collision reopened** by `/Mine/Backups/.` (G2-C-04).
8. **A credential reaching the fork's public history** because the hooks pass on their own error (G2-I-02, both repositories) or never read an audit packet (G2-I-01) -- the guard the round added against blindspot 67, holed twice.
9. **The Mediums confirmed by read or run** (G2-A-05, G2-B-08, G2-B-10, G2-E-core-04, G2-E-app-02, G2-F2-01, BS-2..BS-5): each a wrong answer on a rare path, none a total loss.

Not a risk to a player: the test, lint and process gaps (the Lows and the E-tests Mediums).

## Coverage boundary

- **Whole branches, both seats, no plan for A and B** (the packets' size); the follow-ups were read by two seats for the first time; the integrator's commits by two seats for the first time -- except `b31bf53771`, whose own diff is empty after the maintainer's history rewrite (its change lives in the streams' branches).
- **The Highs were re-read and four were run; the Mediums were triaged and ten read**; the rest of the 71 and the 105 Lows go to the streams on the seats' evidence. That is the depth this audit affords; it is stated per finding in 02.
- **The VM proved 21 items on the exact candidate build and could not run four** (no Wi-Fi adapter or hwsim in the guest kernel; the rehearsal takes the QA pair; no widget walk); several passes rest on named stand-ins and stay partial.
- **No device fact** is claimed; the H700 twin is built and unstaged.
- **The sweep rows** were spot-checked by the seats (five per packet), not re-verified one by one.
- **What a reader should not conclude:** that 192 findings are 192 independent defects (the two seats overlap; the index is per seat); that "implemented" is "acceptance-complete" (56 items have no VM proof named); that the fixes' fixes are audited (they are not yet written); that the public documentation matches the build (#42).

## Finding verification

Phase 4.5 lives in `02-forward-audit.md` § Verification: every Critical and High re-read against the source with the artifact named, four run (the redaction fast path, the key regex, the dot path, the hook with an invalid pattern); results 13 confirmed, 1 re-graded (G2-B-05 to Medium), 2 the same (G2-E-tests-01 = G2-I-02), 0 refuted -- the seats' Highs were right. The blindspot screen's fifteen repeats: five survived (one High). The 21 orchestrator reads made before the seats' outputs were opened (O-1..O-21) stand; none of the seats' Highs contradicts them -- the seats found what those reads did not look for.

## Second opinion

Phase 4.6, two calls at milestone tier through the council Facilitator on OpenRouter (D-WORKFLOW-049), the GPT seat both times.

### The blind pass

**Command:** `tools/council/council-invoke.ts --member gpt --prompt-file second-opinions/blind.brief.md --source-manifest second-opinions/blind.manifest.json --output second-opinions/blind-gpt.md --provider openrouter --max-retries 2`, dispatched 15:06 UTC over `blind-packet.md` (the evidence with the verdicts withheld, sha256 `94f565b7…`). **Provenance** (`blind-gpt.md.provenance.json`): served model `openai/gpt-6-astra` (`model_identity_source: provider_response`), effort max, buffered, HTTP 200, one attempt, 835 s, 14,834 prompt and 29,902 completion tokens (24,344 reasoning), output sha256 `281875ff…`.

**What it returned:** 31 findings, S-01..S-31, each with the packet's reference, a failure scenario and what would refute it; a list of #307 items whose acceptance-specific demonstration the packet did not carry; a `gaps_for_orchestrator` block. Graded against the punch list as it stood (27 items):

| S | Its reading | Disposition |
| --- | --- | --- |
| S-01..S-05, S-07 | High | already PL-001, PL-002, PL-004, PL-003, PL-006, PL-007 -- **agree**, same grade |
| S-09, S-10, S-11, S-13, S-14, S-15, S-12 | High | already PL-008, PL-005, PL-010, PL-009, PL-011, PL-012, PL-014 -- **agree**, same grade |
| S-08, S-16, S-17, S-18, S-19, S-20, S-22, S-23, S-28, S-29, S-31 | Medium | already PL-022, PL-021, PL-015, PL-016, PL-017, PL-018, PL-019, PL-020, PL-023, PL-024, PL-013 -- **agree** (S-31 is High here: a rule that leaks; the difference is the surface, not the defect) |
| S-21, S-24, S-25, S-26 | Medium | the leads G2-E-app-01, G2-D-02, G2-C-03 and O-15's `::` case -- **agree as leads**, carried to E2, D, C, D by name in their briefs |
| **S-06** | High | G2-B-05: **confirmed Medium in § Verification and then carried nowhere** -- neither a punch item nor a lead, the one finding the punch list dropped. Added as **PL-028** (Medium: it needs an archive this tool never writes), stream B, its brief amended |
| **S-27** | Medium | O-6's gap: a capture blocked on the lock past the 120 s age is released for the launch with no proof it cannot write afterwards. **New lead** for stream A, in its brief |
| **S-30** | Medium | no candidate-specific proofs on the cut: the upgrade rehearsal, the migration on a guest, the E1/E2 follow-up proofs, the runner's 3 NOT RUN, the Wi-Fi stand-in. **Added as PL-029**, the integrator's, on the next cut |

**Its list of acceptance checks not reached by the packet** (58 #307 items) is a statement about the packet: the acceptance-specific runs live in `docs/qa-frames/2026-09-28/proofs-307/run2.md` (32 PASS / 1 FAIL (#310) / 4 cannot run / 3 no script on `1b0d233657`) and in the harness's named cases, neither of which the packet embedded. The 4 + 3 are PL-029's subject. Its note that the brief said 81 items against 80 ids is the packet's rendering: #307 carries 81 checkboxes and 81 distinct ids (counted).

**Net effect of the blind pass:** two items added (PL-028, PL-029), one lead added (S-27 to A), no grade changed, no item withdrawn. The list it produced independently matches the orchestrator's on 29 of 31, which is the corroboration the pass exists to give -- and the one it caught (S-06) is exactly the shape a blind read is for: a verdict written and then not carried forward.

### The refutation pass

**Command:** the same Facilitator call with `--prompt-file second-opinions/refutation.brief.md --source-manifest second-opinions/refutation.manifest.json --output second-opinions/refutation-gpt.md`, dispatched 15:45 UTC over 02, 03, this document, 05 (27 items then) and `blind-gpt.md` (335 KB; the five sha256 in the manifest). **Provenance** (`refutation-gpt.md.provenance.json`): served model `openai/gpt-6-astra` (`model_identity_source: provider_response`), effort max, buffered, HTTP 200, one attempt, 1,216 s, 94,391 prompt and 40,000 completion tokens (29,524 reasoning; the completion cap, and the document is whole: five sections, the closing paragraph complete), output sha256 `b2dfdee1…`.

**Its own findings (R-01..R-05), each about a prescription or an artifact, none a new defect in shipped code:**

| R | What it says | Disposition |
| --- | --- | --- |
| R-01 | PL-022's `cksum` is not ZIP's CRC-32 | **agree**; PL-022's acceptance amended (a ZIP-compatible CRC-32 the image has, or the refusal branch; healthy and damaged, stored and deflated); stream B told |
| R-02 | PL-011's "any status above grep's 1 refusing" is not stage-correct | **agree**; the acceptance amended (a producer, parser or redactor failure of any status refuses; grep's 1 only at the matching stage; statuses read in the shell that ran the pipeline) -- `.githooks/guard-lib` already does this (`set -o pipefail` around the producer, each grep's own status) |
| R-03 | the punch index was invalid YAML (`\1`, `\$`) and drifted from the prose on PL-003 and PL-015 | **agree, confirmed** (`yaml.safe_load` failed at PL-013's acceptance); the index is regenerated from the prose with single-quoted scalars and checked identical, 34 ids |
| R-04 | PL-018's oracle would discard a whole `.tmp` recovery | **agree**; the acceptance split into two cases; stream E1 told |
| R-05 | removing packet copies loses the reviewed bytes | **agree in part**: the copies are untracked, not destroyed -- history keeps them (`git show cba6ae23f2~1:<path>`) against the manifests' sha256, and the "regenerated from the range" claim is dropped from PL-012; the ES test's FAKE= exemption it also names is gone (ES `3cd229a51`) |

**The punch items:** 24 agree (some with the acceptance sharpened, folded in above and into the items), 3 narrowed (PL-001: the deletion is conditional on rclone's same-directory copy, unrun; PL-002: three of five copies gate a `source`; PL-019: the unchecked write and the missing press, not the preceding consent), 1 re-graded (PL-013 High -> Medium: a guide a person runs, not a shipped disclosure path; accepted, the fix stands), PL-027 "re-grade to Low" (it was Low). PL-006 widened (a failure after a successful mktemp). Every High of the list survives.

**The leads it would not leave where the triage put them:** G2-C-03 (gpt) and G2-D-01 (gpt) Medium not Low; G2-I-09 (gpt) into PL-011's scope (guard-lib refuses an unreadable list before reading a non-empty variable); G2-A-10 (claude) a Medium lead (size-only comparison before a destructive migration) -- carried to stream A by this note; the rest of § 2.2 are the leads the streams already hold, each with the refutation's sharper acceptance, which the streams read from this file.

**The blind list:** S-06 -> PL-028 and S-30 -> PL-029 as graded above; the refutation asks that five leads be gated rather than left as leads, because "unread leads cannot safely be summarized as either fixed or definitively non-blocking": **PL-030** (S-21, COPY outside the lock, E2), **PL-031** (S-24, the substituted readiness count, D), **PL-032** (S-25, a closed sign-in state reopened, C), **PL-033** (S-26, the `::` listener, conditional, D), **PL-034** (S-27, the capture released past the age bound, A) -- each verification-first: a fix with a case, or a source-backed refutation naming the line. (Its own numbering, PL-029..034 for S-21..S-30, differs by one from this list's.) The streams were told the same hour.

**Its corrections to this document's summary**, applied as the paragraph appended to the executive summary above: "81 implemented" is "79 claimed implemented at the seats' evidence levels" (PL-081 and one other are struck on #307 as outside the round; implemented is not acceptance-complete); "21 proven on the VM" is 20 rows plus PL-032 partial and PL-069's leak measurement; "every fix came with a case seen to fail first" has O-2's read-only exception and is per-fix, not per-suite; "five copies" is three validators and two readers; "fourteen Highs and six Mediums" is now 13 Highs and 18 Mediums after the second opinion; the fixes' scope is the items' file inventory, not "five scripts, one C++ file"; O-16 is amended in 02 (the collision set is complete for spelled siblings; the dot case is PL-009); "safe by the bound" is O-6 plus PL-034; "answered" separates response received from fix verified, withdrawal substantiated and risk accepted; unread leads are pending, not non-blocking. Two distinctions kept: D-INFRA-012 accepts PID reuse, and `pid_max` is not an elapsed-time bound; "no VM proof named" does not make an item incomplete when its criterion is a host, unit or build test.

**What it could not judge** (§ 4.1): the implementations behind the excerpts, the original criteria (PL-081's), the raw artifacts of the cut, rclone's same-directory behaviour, the shipped bind, the ZIP tools' capabilities, the configuration grammar, the archive trust boundary, the log-rotation facts PL-014's scrub needs, the packet-generation procedure. Each is either an item's case (PL-001, PL-022, PL-033, PL-014) or a limit of a document-only pass, stated.

**Net effect of the refutation pass:** five items added (PL-030..034), one re-graded (PL-013), five acceptance texts amended, the index made valid and identical to the prose, ten summary claims corrected, one verification entry qualified (O-16), and the ES fork's last line-shape exemption removed. No High withdrawn.

**Its closing paragraph, pasted as asked:** *"The refutation pass narrows several conclusions: total loss in the migration remains conditional on unrun rclone behavior; the packet establishes three sourcing validators, not five execution sinks; and the guide-only masking example is Medium rather than High. The ZIP-checksum prescription, hook status rule, recovery test oracle, punch YAML, and packet-retention plan need correction. G2-B-05 is a confirmed Medium missing from the numbered gate, while unresolved COPY, lifecycle, readiness, capture, and upgrade evidence cannot be declared non-blocking merely because it was not fully read. Most remaining blocker mechanisms are supported by the quoted inspections and reported probes, but 'implemented' is not 'acceptance-complete,' and suite totals do not prove every fix failed first. Keep the candidate unready until the corrected requirements, owner dispositions, and required final-cut evidence are recorded; accepted design risks should remain explicit exceptions, not be presented as correctness proofs."*

## Instruction File Recommendations

### Coverage gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
| --- | --- | --- |
| G2-A-01 gpt, G2-A-02, G2-B-01, G2-B-04, G2-B-06, G2-B-08, G2-E-tests-01/G2-I-02 | `engineering-practices.md` § Guards must fail closed ("prove the guard fires"; "success reported over a no-op") | -- |
| G2-B-02, G2-B-07, G2-E-core-01 | `engineering-practices.md` § Guards must fail closed ("construct the violation") -- a masking or scanning pattern proven on the shapes it must catch | -- |
| G2-A-01 claude, G2-C-04 | (none: a path compared as a string, a path with dot components) | **YES** |
| BS-1, G2-A-05 | `upgrade-and-install.md` § Fixing forward is not enough (what earlier builds already wrote) | -- |
| BS-2 | (none: two readers of one file) | **YES** |
| BS-4, BS-5 | `engineering-practices.md` § Guards must fail closed ("an assertion that cannot fail is not evidence") | -- |
| G2-I-01 | `fork-workflow.md` § Safety net (the guard scans every pushed branch -- the exemption contradicts the rule that describes it) | -- |

### Codification gaps (needs-new-rule)

| Pattern | Instances | Recommendation |
| --- | --- | --- |
| P-01: a path compared or derived as a string (trailing slash, dot components, case) where a path was meant | G2-A-01 claude, G2-C-04, BS-2's sibling (a duplicated key read two ways) | **Extend** `rclone-cloud-sync.md` with "A pointer is normalised before it is compared" -- the three pointers' canonical form (leading slash, no trailing slash, no dot components, case as typed) and one reader for the file |
| P-02: one grammar or one contract kept in several copies by hand | the five `conf_valid` copies, the four `.fla` lists, the two `pre_cleanup` fallbacks, the two repositories' hooks | **Extend** `engineering-practices.md` § Before deleting a duplicate with its converse: a rule copied into a second script is a rule that will be fixed in one -- a shared file, or a harness case that diffs the copies |
| P-03: a guard's own failure path unwritten (mktemp, cp, find, grep, awk, a pipeline's producer) | G2-A-02, G2-B-04, G2-B-08, G2-B-09, G2-I-02, the eight mktemp siblings | **Extend** `engineering-practices.md` § Guards must fail closed with the checklist: every external command a guard depends on has a checked status, and the unchecked-`mktemp` shape is named |

### Recommended action sequence

1. The punch list's FIX-NOW items land by their streams with a case each; the integrator's (the hooks, the lint, the rule's mask) by the integrator.
2. `rclone-cloud-sync.md` gains the pointer-normalisation paragraph (P-01) in the same change as G2-A-01's fix; `engineering-practices.md` gains P-02 and P-03 as short paragraphs under the sections named.
3. The candidate is cut after vm-qa and the proofs' scripts pass on the new tree.

## Quality self-check

| Standard / section | Present | Note |
| --- | --- | --- |
| Executive summary | yes | |
| Acceptance-criteria scorecard | yes | 81 rows from the two audits' verdict tables and the VM's run 2, by script |
| Code-quality assessment | yes | |
| Cornerstone conformance | yes | from 03 § 3.2 |
| Spec fidelity | yes | from 03 § 3.3 |
| Missing artifacts | yes | search trails in 03 § 3.6 |
| Risk assessment | yes | confirmed findings only |
| Coverage boundary | yes | |
| Finding verification | yes | in 02 § Verification, summarised here |
| Second opinion | both passes graded: 7 items added, 1 re-graded, 5 acceptance texts amended, the summary corrected | milestone tier |
| Instruction File Recommendations | yes | milestone tier |
| Traceability / evidence / reproducibility | yes | every confirmed finding names a file and a line or a command and its output; the seats' outputs and provenance are under `seats/` |
| Complete (every stated criterion evaluated) | yes for #307's 81; #308's rows spot-checked (stated) | |

1. **The executive summary overstates the evidence.** I reviewed only the embedded documents, not the code or test artifacts. Citations to 02–05 below resolve to the declared paths and embed-time hashes recorded in part 5. I distinguish the original **#313/PL** items from the new **05/PL** punch-list items.

   - **“The fixes to the 34 items hold against their own acceptance text on both seats’ reading” does not follow from the scorecard.** #313/PL-029 remains open; PL-030 received an adverse evidenced-closure verdict; several items were outside both packets. The gpt distribution seat’s in-packet verdicts are consistently *holds in part*. The ES verdicts are not uniformly partial—PL-018, for example, received *holds*—but neither pattern supports blanket two-seat endorsement. The supported statement is **33 reported closures by the orchestrator, with partial, adverse, and out-of-scope seat verdicts requiring separate reconciliation**.

   - **“17 fixed … 9 accepted … 5 refuted” mixes remediation items with source findings.** The 02 table contains eight accepted outcomes including the deferral, not nine. The full reconciliation is in part 4.

   - **“With a harness case each” is stronger than the item-level evidence shown.** In particular, 05/PL-013 cites `es-syntax-check PASS`, not a failing-before/passing-after directory or bad-read case. That does not prove no behavioral test exists; it means the blanket claim lacks a traceable supporting case.

   - **“Every in-packet verdict was holds or holds in part with the residual named as a finding, except one” is only partly supported.** The verdict words broadly match, but #313/PL-003, PL-004, PL-007, PL-008, PL-017, PL-028 and PL-033 have partial verdicts and no mapped finding. PL-001 maps only a claude finding despite the gpt partial verdict. “Findings on its files” is not a reconciliation of that seat’s acceptance-criterion reservation. Supply the original rationale and its disposition, or narrow the sentence.

   - **The final harness sentence needs run-level traceability.** 04 reports 1257 checks on the build tree; 05 records 1251 at the fixing commit. Different revisions could explain this, so it is not necessarily a contradiction. Name the later run and explain the difference. An aggregate old-tree failure also does not, by itself, establish that every new regression case failed.

   - **“One open item” needs the qualifier “on #313.”** The #315 paragraph separately leaves candidate-specific round-trip and restore-direction checks outstanding.

   Also mark 02’s Phase 2.5 statement—“no item was returned as not holding”—as explicitly superseded. The correction at the top does not make that later, unqualified repetition accurate.

2. **I agree with the three High diagnoses and classifications, on the evidence reported.**

   - **G3-D-01 (gpt):** the reported host canary establishes command execution through an accepted configuration assignment. That supports High, rather than a merely theoretical concern.
   - **G3-D-04 (gpt):** publishing a truncated settings file after producer failure is a serious integrity defect. The reported fail-after-hostname case directly addresses the diagnosis.
   - **G3-E-01 (gpt):** leaving a password readable after a valid quoting splice is a credential-disclosure defect. The two named regression cases are relevant evidence for the reported repair.

   On the five refutations:

   - **G3-D-01 (claude):** measuring the CRC column on the image’s stored and deflated listings is sufficient to refute its absence **on that image**. Taking a fail-closed compatibility guard anyway was appropriate.
   - **G3-D-04 (claude):** `F2-autoslot` running the challenged procedure on the named guest revision is an appropriate artifact. The procedure and case results are not embedded, so I cannot independently establish that its nine passes cover the complete allegation.
   - **G3-D-08 (claude):** the cited `g_signal_connect(..., &osk)` line is sufficient for the narrow user-data claim.
   - **G3-E-03 (claude):** the cited translation entry answers “the French string is missing.” It does not prove that the translation is displayed at runtime, which is a different claim.
   - **G3-E-04 (claude):** the grep supports the absence of additional readers within its search scope. Preserve the revision, command and scope; a reported negative search is not a permanent dependency invariant.

   **#313/PL-030:** the added manager-copy, capture-lock and transfer-read-set citations address the missing premises identified by the gpt seat. They can support an **orchestrator-owned, source-backed refutation**, assuming the alternative acceptance branch is as described. They do not retroactively turn the seat’s verdict into agreement. The weakest premise remains the negative search: zero hits for four spellings is narrower than proving that no indirect reader exists. Name the five scripts and preserve the search scope. A regression guard would strengthen future protection without pretending one already exists.

   I see no clear documentary basis for moving another refuted item into the fix queue. The CRC guard was already taken. **G3-D-03 (claude)** is correctly different: the interface-writer premise is refuted, while the hand-written-file limitation remains accepted.

3. **The leading risks are reasonably ranked, but the ledger contains both design costs and genuinely unfixed defects.**

   **G3-D-09 (gpt)** deserves a severity explanation. The packet describes a password tail surviving log scrubbing, while **G3-E-01 (gpt)** is High for credential disclosure. I would rank them together unless the audit documents a materially lower exposure for G3-D-09. Its conditional trigger may justify a distinction, but the distinction is not presently explained.

   The newline policy, duplicate-path refusal and deliberately stricter readers are recognizable compatibility or availability trade-offs. By contrast, **G3-D-08 (gpt)**, **G3-E-05 (claude)** and **G3-E-04 (gpt)** retain a socket race, a timing/liveness limitation and a weaker-than-flock ownership check. These are declined fixes under operating assumptions, not proofs that the defects cannot matter. Runner serialization, expected PID-write timing and the narrow impostor scenario should remain explicit assumptions.

   **G3-E-02 (gpt) can reasonably be deferred from this build, but the justification and tracking need strengthening.** A short window limits likelihood, not consequence. “Older, not lost” does not establish harmlessness: an older recovery record can matter when recovery is subsequently needed. Keep it as an unresolved Medium, with explicit risk acceptance, an owner, a filed follow-up and a deterministic interleaving test in the follow-up’s acceptance criteria. 05 says an issue is **“to file”**; naming #317’s release is not evidence that this tracking already exists.

   Finally, I cannot assess the six #315 known-cost rejections individually. Their IDs are listed, but their contents and D-CLOUD-154’s reasoning are not embedded. The ledger should summarize their player-visible consequences rather than requiring another document merely to understand the accepted risk.

4. **The seventeen rows cover all recorded “Taken” actions; no taken finding is orphaned.** They are the right remediation units for the dispositions in 02, not independent proof that every original acceptance criterion is now met.

   Counting **Outcome**, rather than mixing Outcome with Verdict, gives:

   - **19 Taken source findings**, consolidated into **17 punch-list items**.
   - **7 accepted findings plus 1 deferred finding**.
   - **4 refuted-only findings**.

   That totals 31. There are five refuted *premises* only because **G3-D-01 (claude)** is both refuted on the image and taken as a guard.

   The two consolidations are correct:

   - **05/PL-011:** G3-E-01 (claude) plus G3-E-06 (gpt).
   - **05/PL-012:** G3-E-02 (claude) plus G3-E-05 (gpt).

   The principal severity choices are defensible: the three Highs remain High; **05/PL-015** is reasonably Low as compatibility hardening; **05/PL-012** appropriately includes the Medium producer-failure finding; and **05/PL-014** reasonably treats dropped pending changes as Medium despite the seat’s Low label. My exception is the unexplained Medium/High distinction for **05/PL-010 / G3-D-09 (gpt)** discussed above.

   No accepted entry clearly demands an additional immediate code-fix row from these documents alone. The deferred recovery race does demand an actual tracked follow-up. Also, attach behavioral evidence to **05/PL-013** before presenting all seventeen as individually regression-proven.

5. **The boundary is candid, but several limitations need more prominence.**

   - “Whole packets” does not mean all 34 items received two complete reviews. The outside-every-packet list in 04 also omits **#313/PL-013**, which its scorecard marks outside.
   - A harness count combines different strengths of evidence. S3F “reads the branch” for **G3-D-07 (gpt)**; syntax checks and source assertions are not equivalent to executing the failure path.
   - Earlier guest proofs, and tests of scripts installed by path, do not certify the final chain-90 image. Nor does a successful build establish runtime behavior on H700.
   - As 03 acknowledges, the analysis and second opinion came after Phase 7. This is retrospective challenge of already-landed fixes, not the intended pre-execution review gate.
   - Only the 31 finding-level entries are embedded. The other 17 findings, original acceptance text and raw seat rationales are referenced rather than available for this reading.

   A reader should therefore not conclude that all 34 items received unqualified dual endorsement, that the seventeen new fixes or #315’s refinement received independent final-diff review, that every repair has demonstrated behavioral regression coverage, or that device behavior has been established.

   **I would not stop the build.** Producing the candidate enables the missing evidence, and absence of device testing cannot sensibly block starting device testing. Correct the documentary claims and tracking before calling the audit complete. Keep **#313/PL-029** and #315’s candidate-specific round-trip and restore checks open, and gate candidate acceptance on those results. A focused independent review of the final security, publication/locking and #315 changes would be prudent before promotion; it is not a reason to stop compilation.

   All four declared documents were present. The unembedded evidence needed for the qualifications above is surfaced below. Content for the orchestrator to save as `corpus.provenance.json`:

   ```json
   {
     "access_basis": "Embedded source contents only; no filesystem access, independent reread, or hash computation.",
     "citation_labels": ["02", "03", "04", "05"],
     "source_file_paths": [
       "docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/02-forward-audit.md",
       "docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/03-retrospective.md",
       "docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/04-analysis.md",
       "docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/05-punch-list.md"
     ],
     "source_file_hashes": [
       "417221c0f6f2f55b33512d6c92a0ec094d2ea0a16859eb3167dd4b3deb70ce8d",
       "612c409bef173d2b36d5ec3466f0bbbe029ab649bab691d02b4ffc58cdfdda93",
       "ebd89f6c46595fbff487a5974a74fa46d782e71488772a476a79c22b70f7d5e1",
       "790c763c7fa07bbde7e34f3a00374a8435380f1733bcd547d3d3190679cdaf5b"
     ],
     "hash_algorithm": "sha256",
     "hash_verification": "Verified at embed time by the Council Facilitator; not recomputed by this reader.",
     "manifest_read_timestamp_utc": "2026-09-29T02:15:52Z",
     "declared_sources_missing": [],
     "unembedded_evidence_gaps": [
       {
         "source_description": "Referenced seats/items.md and original seat outputs",
         "impact": "Cannot independently reconcile unmapped partial verdicts or verify the full acceptance text."
       },
       {
         "source_description": "#315 acceptance criteria, finding-level record, and D-CLOUD-154",
         "impact": "Cannot judge the six known-cost rejections individually."
       },
       {
         "source_description": "Underlying source and diffs, scoped grep results, per-case test outputs, and running log",
         "impact": "Cannot independently validate cited code facts, negative-search coverage, per-fix fail-before evidence, or the 1251-to-1257 run reconciliation."
       }
     ]
   }
   ```

6. The headline overstates the evidence: #313/PL-029 remains open, PL-030 did not receive two positive seat verdicts, and several partial verdicts lack mapped residuals; the disposition totals also mix source findings with remediation items. I agree with the three High diagnoses, and all recorded taken actions map to the seventeen punch-list rows. The narrow artifact-based refutations are reasonable as reported, while PL-030 is an orchestrator-evidenced refutation, not seat concurrence or a guarded invariant. G3-D-09’s lower credential-disclosure severity needs explanation, and G3-E-02 remains an unfixed recovery race requiring an owned, filed follow-up rather than reassurance about a small window. The blanket per-fix regression claim also needs stronger traceability, particularly for the selection read-back repair. This opinion reviews documents, not the final code: the seventeen fixes and #315 refinement still lack a second seat pass. The build can continue for QA, but candidate acceptance should wait for PL-029 and #315’s outstanding cut-specific proofs.
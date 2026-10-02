I used only the embedded documents. I did not inspect the tree, execute tests, or recompute hashes. **Agree** below means the quoted evidence supports the finding—not that I independently reproduced it.

Unless prefixed **#307** or **#309**, `PL-NNN` means the current 27-item punch list. Source keys are **F** = forward audit, **T** = retrospective, **A** = analysis, **P** = punch list, **B** = blind pass. Their full paths and embed-verified hashes are recorded in §4.

## 1. New findings from this packet

These are new findings about the proposed remediation and audit artifacts. They are **not additional independently confirmed defects in the shipped code**.

### R-01: The proposed ZIP-integrity fix names an incompatible checksum
- **Severity:** Medium — prescription defect.
- **Packet reference:** P, `PL-022`; F, `BS-3`.
- **What:** The proposed comparison between a ZIP member’s listed CRC and ordinary `cksum` output is not valid. POSIX `cksum` and ZIP CRC-32 use different computations; converting decimal to hexadecimal does not make them interchangeable.
- **Failure scenario:** An executing agent follows `PL-022` literally and rejects healthy archives because their member checksums do not match. Alternatively, a failing implementation is weakened until corrupted archives pass again.
- **Evidence:** The acceptance explicitly proposes “`unzip -lv` and `cksum`.” Nothing identifies a ZIP-compatible checksum mode available in the image. The alternative of explicitly refusing stored members is separate and does not have this algorithm mismatch.
- **Required correction:** Name a ZIP-compatible CRC-32 implementation, demonstrate that the target’s listing exposes the necessary metadata, and test **healthy and corrupted** stored and deflated members using the target tools.

### R-02: The hook prescription does not specify a stage-correct success rule
- **Severity:** Medium — security-fix acceptance defect.
- **Packet reference:** P, `PL-011`; F, `G2-E-tests-01 (gpt)` / `G2-I-02 (gpt)`.
- **What:** “Any status above grep’s 1 refusing” is unsafe if applied to every pipeline stage. Status 1 is an allowed no-match result for grep, not general permission for the producer, parser, or redactor to fail.
- **Failure scenario:** A producer or redactor returns 1 and leaves empty output. A literal implementation of the prescribed threshold still permits the commit.
- **Evidence:** The acceptance gives a global threshold rather than an allowed-status rule per command. It also does not specify that `PIPESTATUS` must be captured in the shell that ran the pipeline; reading it outside `hits="$(...)"` does not recover that pipeline’s statuses.
- **Required correction:** Require producer/parser/redactor success, allow grep’s documented no-match result only at the matching stage, and test failures returning both 1 and larger values. Prefer completing inspection before truncating diagnostic output with `head`, so intentional early pipe closure does not obscure inspection status.

### R-03: The punch index is invalid YAML and changes two acceptance criteria
- **Severity:** Medium — executable audit-artifact defect.
- **Packet reference:** P, `Punch index`, particularly `PL-003`, `PL-013`, and `PL-015`.
- **What:** The double-quoted YAML strings contain unsupported YAML escapes, including `\1` and `\$`. Separately, the index is not faithful to the prose:
  - `PL-003` changes the illustrated double-quoted assignment to a single-quoted assignment.
  - `PL-015` changes the required escaped double quote, `\"`, to `\'`.
- **Failure scenario:** A machine consumer cannot parse the index. An agent using the index instead of the prose implements or tests the wrong quoting behavior.
- **Evidence:** These differences and escapes are present in the embedded punch list itself. This is a textual finding; I did not run a YAML parser.
- **Required correction:** Generate prose and machine-readable requirements from one representation, use correctly escaped strings or block scalars, and assert that the parsed index contains all 27 items with matching acceptance text.

### R-04: The incomplete-backup acceptance can discard a whole temporary recovery
- **Severity:** Medium — recovery-test oracle defect.
- **Packet reference:** P, `PL-018`; F, `G2-E-core-04 (gpt)` and `G2-E-core-04 (claude)`.
- **What:** `PL-018` says that a cut backup with no usable live file should load defaults. It omits the whole `.tmp` candidate that the existing recovery design is meant to preserve.
- **Failure scenario:** Live configuration is unusable, the backup is cut, and a complete temporary file exists. A fix following that unconditional oracle selects defaults instead of the recoverable configuration.
- **Evidence:** F describes a whole temporary candidate after the backup-selection branch. The defect is the incomplete backup outranking that candidate—not a requirement to bypass the temporary candidate.
- **Required correction:** Split the test: a whole temporary must recover when eligible; defaults are expected only when **no eligible recovery candidate** exists.

### R-05: Removing packet copies lacks a demonstrated byte-for-byte reconstruction contract
- **Severity:** Medium — evidence-retention defect.
- **Packet reference:** P, `PL-012`; F, `G2-E-app-10 (claude)`; A, `Coverage boundary`.
- **What:** The prescription assumes hashes and branch ranges suffice to regenerate the reviewed packet. A hash identifies bytes; it does not preserve or reconstruct them.
- **Failure scenario:** The committed packet is removed, and a later reviewer cannot reproduce its manifest hash from the named range. The audit then cannot establish exactly what its seats reviewed.
- **Evidence:** F explicitly reports duplicate `ViewController` hunks and says that packet is not clean `git diff` output. A also records a history rewrite affecting an integrator commit. No exact reconstruction procedure or retained-object guarantee is supplied.
- **Required correction:** Remove the scanner exemption regardless. Before discarding packet copies, preserve the exact, secret-safe reviewed bytes in an immutable artifact store, or demonstrate hash-identical regeneration using preserved objects and a recorded procedure. A `.gitignore` entry also does not untrack copies already committed.

## 2. Disposition of the punch items and Medium-or-higher findings

### 2.1 Every numbered punch item

| Item and source finding | Judgment | Qualification or acceptance correction |
|---|---|---|
| **PL-001 — `G2-A-01 (claude)`** | **Narrow — High** | The missing identity guard is supported. The asserted total deletion remains conditional: F expressly says same-directory rclone copy was not run. A mandatory abort in the actual copy/check path would refute the deletion scenario. Keep the defensive identity check, but distinguish the demonstrated comparison defect from the unexecuted loss sequence. |
| **PL-002 — `G2-A-01 (gpt)`** | **Narrow — High** | Three sourcing validators are identified. The two adjacent content-script sites are described elsewhere as data-only `conf_get` readers; a grep match does not establish two additional execution sinks. Supply their downstream execution paths before claiming execution in five copies. Also, removing CR from `rest()` alone does not prove “CR anywhere in the file is refused.” |
| **PL-003 — `G2-B-01 (gpt)`; `G2-B-03 (claude)`** | **Agree — High** | Reading configuration by sourcing it has filesystem side effects despite the subshell. Preserve the already-tested `BACKUPFOLDER` fallback and supported literal forms when replacing the reader; the proposed single-key, single-quoting-form example is not a complete compatibility contract. See R-03. |
| **PL-004 — `G2-A-02 (gpt)`** | **Agree — High** | The quoted `elif` can restore a failed, non-empty copy. Check copy completion separately from cleanup, and prove the original remains byte-identical when copying fails. |
| **PL-005 — `G2-B-02 (gpt)`** | **Agree — High** | The reported probes directly support the fast-path mismatch. Test both `--pass` and `--RA_Pass` through argument and stream modes; make detector/redactor agreement the invariant rather than merely adding one substring. |
| **PL-006 — `G2-B-04 (gpt)`; `G2-B-01 (claude)`** | **Agree — High** | A checked `mktemp` helper is insufficient by itself. The acceptance must also cover failed `KEEP` and `NEWLIST` writes, deduplication, and final list publication. Test failure **after successful temporary creation**, not only `mktemp` failure. |
| **PL-007 — `G2-B-06 (gpt)`** | **Agree — High** | Both controls must survive every supported extractor. Add an interrupted-restore/rollback assertion, not just an immediate existence check. Apply one consistent member policy to backup enumeration, snapshot construction, and extraction. |
| **PL-008 — `G2-B-07 (gpt)`** | **Agree — High** | The recorded regex result supports the false negative. Prove refusal at archive publication, with a clean control; a regex-only positive does not establish that publication stops. |
| **PL-009 — `G2-C-04 (gpt)`** | **Agree — High** | The recorded accepted dot path defeats tier separation. Define “empty component” so the required leading root separator is not accidentally rejected, and state how already-written aliases are treated. |
| **PL-010 — `G2-E-core-01 (gpt)`** | **Agree — High** | The quoted branch ordering supports the masking defect. Test the relevant enclosing/inner quote combinations; do not assume backslash semantics are identical in every quoting context. |
| **PL-011 — `G2-E-tests-01 (gpt)` / `G2-I-02 (gpt)`; also `G2-I-03 (claude)`** | **Agree — High; amend prescription** | The invalid-pattern probe is persuasive. R-02 must be corrected. Include successful pattern-file loading, stage-specific status handling, ordinary no-match, and producer/redactor failures in both repositories. |
| **PL-012 — `G2-I-01 (claude and gpt)`** | **Agree — High; narrow remedy** | Remove the path exemption. Stopping packet commits is an evidence-storage choice, not the security fix itself; address R-05 before discarding the reviewed bytes. Also resolve the separate fixture-line exemption in `G2-E-tests-01 (claude)` rather than leaving another filename-based bypass. |
| **PL-013 — `G2-I-10 (gpt)`** | **Re-grade — Medium** | The expression demonstrably reinserts the secret, but the packet shows guidance requiring a person to execute it, not an automatic shipped disclosure path. It still belongs in FIX-NOW. `rules-check` alone is not proof that masking works. |
| **PL-014 — `BS-1`** | **Agree — High; narrow remediation evidence** | Persistent historical exposure is supported. The one-time stamp must follow successful treatment of every applicable file, with restrictive modes and a defined writer/rotation policy. A failed or interrupted scrub must not certify completion. |
| **PL-015 — `G2-A-05 (claude)`** | **Narrow — Medium** | The documented valid-shell example is rejected, so the compatibility problem is credible. Three validators and two data readers are not necessarily one interchangeable grammar. Define supported syntax, preserve safe meanings, and rerun malicious-input cases when adding escape support. Correct R-03. |
| **PL-016 — `G2-B-08 (gpt)`** | **Agree — Medium** | An unreadable mount table is not evidence of mount readiness. Keep the marker and defer. Separately resolve the supported plain-directory case in `G2-B-02 (claude)`; fail-closed must not silently become permanent non-recovery on a supported layout. |
| **PL-017 — `G2-B-10 (gpt)`** | **Agree — Medium** | The quoted `mv -f` permits replacement. `mv -n` success does not prove that a move happened, and a dated suffix can itself collide. Require verified, non-overwriting publication and preservation of both originals. |
| **PL-018 — `G2-E-core-04 (gpt)`** | **Agree — Medium; amend oracle** | Require completeness at the fallback. Correct R-04 so a whole temporary remains usable. This does not resolve the separate later-promotion problem in `G2-E-core-03 (gpt)`. |
| **PL-019 — `G2-E-app-02 (claude)` / `G2-E-app-03 (gpt)`** | **Narrow — Medium** | Ignoring the `--set-systems` result is supported. “Consent skipped” needs the preceding interaction and the meaning of `onDone()`; the excerpt alone does not establish that no authorizing press occurred. This is also not the `JourneyTiers` record discussed in O-7. |
| **PL-020 — `G2-F2-01 (gpt)`** | **Agree — Medium** | The quoted `elif` transition mishandles constant-false arms. No changed shipped table row from this exact defect is demonstrated. Regenerate the tables and name any changes rather than asserting an existing runtime failure. |
| **PL-021 — `BS-2`** | **Agree — Medium** | First-versus-last semantics disagree. Test all consumers, including the path where duplicate cleanup is declined or fails; changing only setup does not by itself prove global agreement. |
| **PL-022 — `BS-3`** | **Agree — Medium; amend prescription and scope** | Correct R-01. The reported successful `unzip -p` does **not** establish that extraction later fails and triggers rollback; silent acceptance of corrupted contents remains possible. Also examine A’s `archive_whole` consumer—the same stored-member limitation is recorded under #307 PL-070. |
| **PL-023 — `BS-4`** | **Agree — Medium** | Required skips must remain distinguishable from completed verification through the top-level runner. The report says run 69 had zero skips, so this finding does not invalidate that run’s result. |
| **PL-024 — `BS-5`** | **Agree — Medium** | A persistent line cannot prove this boot completed. Establish the boot boundary and check the completion query’s status. Fixing this guard is not a substitute for actually running the missing upgrade rehearsal. |
| **PL-025 — `G2-I-04 (claude)`** | **Agree with Low** | The inherited SIGPIPE difference follows from the stated wrapper. Observe dispositions using a probe that does not reset them itself; launching another Python interpreter would be a poor SIGPIPE oracle. |
| **PL-026 — `G2-I-02 (claude)` / `G2-I-03 (gpt)`** | **Agree with Low** | A path-derived false refusal is supported. Prefer scanning content separately from attaching labels; test quoted/unusual paths as well as a credential-shaped filename. |
| **PL-027 — `G2-A-04 (claude)`** | **Agree with re-grade to Low** | The reader table reportedly contains the sentences; the documented defect is register drift, not demonstrated untranslated runtime output. |

### 2.2 Other Medium-or-higher findings

I include **every remaining seat Medium**, even where the orchestrator subsequently lowered it. This avoids hiding a finding through a change of grade.

**“Narrow — Medium lead” means an unresolved mechanism at that impact level, not a newly verified production defect.** Unread leads cannot safely be summarized as either fixed or definitively non-blocking.

#### A and the configuration/outcome seams

| Finding | Judgment and reason |
|---|---|
| **`G2-A-02 (claude)`** | **Narrow — Medium lead.** The cut-point dependency between updated saves and derived content is credible. Retain its existing #309 tracking; a resumable-state trace across that exact cut would settle it. |
| **`G2-A-03 (claude)`; `G2-I-08 (claude)`** | **Narrow — Medium seam lead.** Token recognition does not prove that the automatic card and later row assign the same outcome to `69 gaps`. Exercise both consumers on one recorded run. |
| **`G2-A-06 (claude)`** | **Narrow — Medium performance lead.** Holding the lock through the walk and stamp is reported; exceeding the waiter’s budget is not measured. A lock-duration bound covering those operations would refute the practical failure. |
| **`G2-A-03 (gpt)`; `G2-I-09 (claude)`** | **Narrow — Medium destination-safety lead.** An unrecognized assignment must not silently become an absent setting whose default means remote root. Distinguish intentional root configuration from parser failure; an explicit downstream refusal would refute the unsafe-use scenario. |
| **`G2-A-04 (gpt)`** | **Narrow — Medium authorization lead.** Ignored plan-removal failure undermines the claimed one-use contract. Prove that failed consumption prevents apply, or that another durable mechanism spends the authorization. |

#### B

| Finding | Judgment and reason |
|---|---|
| **`G2-B-05 (gpt)`** | **Agree with Medium, provisionally—not omission.** F confirms a snapshot/extraction write-set mismatch and downgrades it because it requires an outside archive. That is still a confirmed Medium and appears in neither the numbered punch list nor its leads table. Add it. Raise severity if such archives are a supported or insufficiently bounded input. |
| **`G2-B-02 (claude)`** | **Narrow — Medium platform lead.** Permanent deferral matters if a plain `/storage/roms` directory is supported. Supply that platform invariant before declaring either the finding or the recovery safe. |
| **`G2-B-03 (gpt)`** | **Narrow — Medium mutual-exclusion lead.** Successful `ln` into a directory is not acquisition of the intended public lock. A directory-path rejection or equivalent inode/path check would refute the counterexample. |
| **`G2-B-09 (gpt)`** | **Narrow — Medium restore lead.** Checking the archive listing does not check extraction of its seed manifest. Require a failed or partial manifest read to stop before partial reset is reported complete. |
| **`G2-B-11 (gpt)`** | **Narrow — Medium persistence lead.** Two successful reads do not make the SSID/key writes atomic. Demonstrate refusal or recovery when the second write fails, including failure of compensating writes. |

#### C

| Finding | Judgment and reason |
|---|---|
| **`G2-C-01 (claude)`** | **Narrow — Medium interaction lead.** “Window open” and “field accepting input” are different states. The reported normal guest pass does not refute delayed-focus loss; use an actual focus acknowledgement or a faithful delayed-focus case. |
| **`G2-C-02 (claude)`** | **Re-grade — Low reporting gap.** Omission of #307 PL-030 from C’s plan/report is real scope-accounting trouble, but does not itself establish another injection defect. Keep the cross-stream acceptance outcome explicit. |
| **`G2-C-01 (gpt)`** | **Narrow — Medium compatibility lead.** The new data reader needs a declared supported grammar and failure behavior. Unsupported syntax must not silently acquire a different path meaning. |
| **`G2-C-02 (gpt)`** | **Narrow — Medium lifecycle lead.** Ownership does not prohibit `failed → waiting` within one attempt. Prove terminal-state ordering separately from attempt identity. |
| **`G2-C-03 (gpt)`** | **Retain Medium lead, rather than the orchestrator’s Low.** A rejected ownership write followed by successful completion side effects, or completion after close, affects the session’s truth. Gate the state transition and its callback/marker effects together. |

#### D

| Finding | Judgment and reason |
|---|---|
| **`G2-D-01 (claude)`** | **Narrow — conditional Medium.** Rejecting `::` can reject an IPv4-reachable service. An enforced shipped IPv4 bind would make the shipping scenario inapplicable; that implementation is not embedded. |
| **`G2-D-01 (gpt)`** | **Retain Medium lead.** A truncated numeric prefix can invent a different game ID and therefore a false ready state. The small timing/layout window does not establish harmlessness. Test a digit sequence crossing the prefix boundary. |
| **`G2-D-02 (gpt)`** | **Narrow — Medium measurement lead.** A helper’s checked failure is insufficient if its caller substitutes a different metric. Force the comparison to fail after nonzero cache operations and inspect the published result. |
| **`G2-D-03 (gpt)`** | **Retain Medium concurrency lead.** Token comparison followed by unlink is not atomic acknowledgement. A serialized acknowledgement or a forced competing-write test would refute the lost-notification scenario. |

#### F1

| Finding | Judgment and reason |
|---|---|
| **`G2-F1-01 (gpt)`** | **Narrow — Medium upgrade condition.** A completion stamp does not handle a downgrade that recreates retired state. The packet acknowledges this; an authorized support-boundary decision can accept it, but does not make cleanup generally idempotent across version cycling. |
| **`G2-F1-02 (gpt)`** | **Narrow — Medium ownership lead.** Exact filenames reduce breadth; they do not distinguish generated contents from an owner’s replacement at the same name. T’s statement that owner-file deletion was “fixed: exact names” is too broad. |
| **`G2-F1-03 (gpt)`** | **Narrow — Medium ownership lead.** The recorded reset/default exception may be intentional. It does not prove preservation of manually chosen values that happen to equal generated ones. State the inference and exception honestly. |
| **`G2-F1-04 (gpt)`** | **Narrow — Medium host-state lead.** A socket node proves type, not an exited owner. Require an active-owner refusal or another demonstrated exclusive ownership rule before unlinking. |

#### F2

| Finding | Judgment and reason |
|---|---|
| **`G2-F2-02 (gpt)`** | **Narrow — Medium provenance lead.** Reopening the same paths immediately after parsing narrows a race; it does not capture what the parser actually consumed. O-18 needs this qualification unless immutability is established. |
| **`G2-F2-03 (gpt)`** | **Narrow — Medium artifact-guard lead.** A matching directory entry is not a usable library/plugin. Show that the assertion resolves to an appropriate installed artifact, including broken-symlink and directory negatives. |

#### E-core

| Finding | Judgment and reason |
|---|---|
| **`G2-E-core-01 (claude)`** | **Narrow — Medium masking lead.** Do not assume this enclosing-quote counterexample is identical to the inner-quote High. Obtain its exact input and include it in PL-010’s masking matrix. |
| **`G2-E-core-02 (gpt)`** | **Narrow — Medium lost-update lead.** Recovery writes need the same serialization and precondition recheck as normal saves. A lock elsewhere covering selection through publication would refute it. |
| **`G2-E-core-03 (gpt)`** | **Narrow — Medium last-good lead.** Excluding the first save does not preserve provenance after newline normalization and a later load/save. Test the complete two-step sequence, not just the first write. |
| **`G2-E-core-05 (gpt)`** | **Narrow — Medium confidentiality lead.** The selected private mode must survive failed recovery publication and subsequent record creation. Deriving it again from an unrepaired path is not the same guarantee. |
| **`G2-E-core-06 (gpt)`** | **Narrow — Medium pending-state lead.** Failed reload must not be reconciled as successful absence. Test failure followed by a successful reload/save with pending edits intact. |
| **`G2-E-core-07 (gpt)`** | **Narrow — Medium false-conflict lead.** A retained in-memory map is not necessarily the last on-disk baseline. Demonstrate baseline capture from the appropriate snapshot. |

#### E-app

| Finding | Judgment and reason |
|---|---|
| **`G2-E-app-01 (claude)`** | **Narrow — Medium COPY-safety lead.** The inspected worker call differs from the locked DELETE path. A UI-time busy check does not cover a queued operation’s later execution. Require protection for the entire COPY operation. |
| **`G2-E-app-01 (gpt)`** | **Narrow — Medium wrong-action lead.** A namesake inactive profile must not outrank an explicitly active profile. Supply the full precedence and a two-profile counterexample test. |
| **`G2-E-app-02 (gpt)`** | **Narrow — Medium hand-off lead.** The launch hold must survive watcher ownership transfer. Same-watcher tests do not cover a successor’s first-run exemption. |
| **`G2-E-app-04 (gpt)`** | **Narrow — Medium safety-evidence gap.** Respect the recorded 120-second design decision, but age is not proof of termination or harmless overlap. Other capture checks might make overlap safe; that needs evidence. |
| **`G2-E-app-05 (gpt)`** | **Narrow — Medium signalling lead.** “Some process holds the lock” plus a substring in another process’s command line does not bind that PID to ownership. Require process identity and ownership evidence before signalling. |

#### E-tests

| Finding | Judgment and reason |
|---|---|
| **`G2-E-tests-01 (claude)`** | **Agree — Medium guard defect, not merely a test-style issue.** The fixture-line exemption permits arbitrary contents at the exempted line shape. Construct the fixture at runtime and remove the exemption as part of PL-012’s scanner hardening. |
| **`G2-E-tests-02 (claude)`** | **Agree — Medium evidence gap.** Successful real commits are negative controls, not proof that pre-commit refuses a violation. PL-011’s tests should cover the actual hook and the refusal reason. |
| **`G2-E-tests-03 (claude)`** | **Re-grade — Low test-coverage gap.** The omitted older-mtime positive weakens the stated coverage, but does not itself demonstrate a broken comparison. Do not conflate it with the separate recovery defects. |
| **`G2-E-tests-04 (claude)` / `G2-E-tests-06 (gpt)`** | **Agree — Medium lifetime-oracle gap.** Counting posts that start after closure does not prove closure waits for an already-running post. Use a controlled in-flight barrier and observe completion ordering. |
| **`G2-E-tests-02 (gpt)`** | **Narrow — Medium security-boundary lead.** The actual remote-URL matcher is not embedded. Resolve it before calling scanner hardening complete; this is not just documentation accuracy. |
| **`G2-E-tests-04 (gpt)`** | **Narrow — Medium classifier lead.** An unrecognized operand cannot be presumed safe. Demonstrate explicit unknown/error handling or a supported-input restriction. |
| **`G2-E-tests-05 (gpt)`** | **Agree — Medium test-driver gap.** Failed process creation or waiting must fail the test, not resemble a completed child. Construct those machinery failures. |
| **`G2-E-tests-07 (gpt)`** | **Agree — Medium oracle gap.** Identical final bytes do not prove no writes occurred. Observe the relevant write/publication operations or a sufficiently complete filesystem trace. |
| **`G2-E-tests-08 (gpt)`** | **Agree — Medium lifetime-oracle gap.** Reused addresses cannot distinguish a newly resolved object from a dangling old pointer. Use stable identities or a lifetime-aware failure oracle. |
| **`G2-E-tests-09 (gpt)`** | **Agree — Medium contract-coverage gap.** A manually maintained example table does not prove inclusion of all emitters. T’s stronger claim that this guards the byte-for-byte cross-repository contract is unsupported without inventory linkage. |

#### Integrator

| Finding | Judgment and reason |
|---|---|
| **`G2-I-05 (claude)` / `G2-I-07 (gpt)`** | **Re-grade — Low tooling defect.** The unchanged bullet gate can falsely reject valid verification coverage. Fix and test it, but distinguish this false-refusal direction from silent coverage success. |
| **`G2-I-06 (claude)` / `G2-I-08 (gpt)`** | **Retain Medium validation lead.** Missing sections, unsupported formats, or zero parsed findings must not quietly produce no verdict. The claimed G2-format repair is not supplied as code or a fired test here. |
| **`G2-I-07 (claude)` / `G2-I-04 (gpt)`** | **Narrow; Low for the fixture defect.** The screenshot early return can preserve the old marker. Separately reconcile the obsolete rule wording and the deliberate treatment of old user records; fixture repair alone does not answer both. |
| **`G2-I-05 (gpt)`** | **Retain Medium validation lead.** Substring mention of a seat can falsely credit verification. Require exact attribution rather than treating commentary as evidence. |
| **`G2-I-06 (gpt)`** | **Retain Medium validation lead.** Searching from Verification to EOF can credit text outside the verification section. Bound the section and test misleading later mentions. |
| **`G2-I-09 (gpt)`** | **Retain Medium security lead; include in PL-011.** A non-empty pattern variable does not prove its file loaded successfully. This belongs with hook fail-closed behavior, not a blanket Low lint bucket. |

### 2.3 Lows I would not leave at Low

Besides the orchestrator downgrades identified above:

- **`G2-A-10 (claude)` → Medium lead:** size-only comparison may not establish content identity before destructive migration. Require a per-object no-hash case with equal sizes and unequal contents. The clean-count fix in O-1 does not answer this.
- Apply the corresponding **Medium** disposition above to the Low counterparts:
  - `G2-B-07`, `G2-B-08 (claude)` — unchecked seed extraction and paired settings persistence.
  - `G2-C-03 (claude)` — late success side effects.
  - `G2-F1-04 (claude)` — unlinking a live socket.
  - `G2-E-core-05`, `G2-E-core-07 (claude)` — later last-good promotion and unlocked recovery.
  - `G2-E-app-05`, `G2-E-app-06 (claude)` — launch-hold loss and unsafe signalling.
  - `G2-E-tests-05`, `G2-E-tests-07 (claude)` and `G2-E-tests-10 (gpt)` — incomplete emitter coverage, allocator-dependent lifetime testing, and the fixture scanner exemption.

These are **overlapping reports**, not additional defect counts.

## 3. The blind pass, finding by finding

“Add” below means **new to the numbered resolution list**, not newly discovered by the blind pass. Several are already seat leads. Verification items may close with a source-backed refutation or a precisely documented authorized risk acceptance; they should not be mislabeled confirmed defects awaiting implementation.

| Blind finding | Disposition |
|---|---|
| **S-01** | **Already PL-001.** Preserve the blind pass’s conditional wording about same-directory rclone behavior. |
| **S-02** | **Already PL-002.** Narrow the five-execution-sites claim as above; the prescription search alone does not establish execution in the two content readers. |
| **S-03** | **Already PL-004.** |
| **S-04** | **Already PL-003.** |
| **S-05** | **Already PL-006.** Include append/list-construction failures, not only temporary creation. |
| **S-06** | **Add PL-028 — Medium:** restore extraction must stay within the protected write set. This is the already-confirmed `G2-B-05 (gpt)` dropped from tracking. The blind pass’s unconditional High needs the accepted-archive boundary established. |
| **S-07** | **Already PL-007.** |
| **S-08** | **Already PL-022.** Its “accepted as usable” wording is better supported than F’s assertion of a later extraction failure. Correct R-01 and cover the adjacent A consumer. |
| **S-09** | **Already PL-008.** |
| **S-10** | **Already PL-005.** |
| **S-11** | **Already PL-010.** |
| **S-12** | **Already PL-014.** |
| **S-13** | **Already PL-009.** Correctly challenges O-16’s “collision set is complete” assertion. |
| **S-14** | **Already PL-011.** Correct the acceptance’s status rule before implementation. |
| **S-15** | **Already PL-012.** |
| **S-16** | **Already PL-021.** |
| **S-17** | **Already PL-015.** Compatibility scope remains dependent on the supported syntax contract; the rejected example itself is reported. |
| **S-18** | **Already PL-016.** |
| **S-19** | **Already PL-017.** |
| **S-20** | **Already PL-018.** Correct the temporary-recovery oracle. |
| **S-21** | **Add PL-029 — Medium, verification-first:** establish COPY serialization through its complete operation, or fix it. This is existing `G2-E-app-01 (claude)`, not an independent discovery. |
| **S-22** | **Already PL-019, but narrow.** The unchecked selection write holds. The comparison to O-7 and suggested journey-resume consequence conflate `--set-systems` selection with the separate `JourneyTiers` record. That consequence is not demonstrated. |
| **S-23** | **Already PL-020.** Correctly avoids claiming a demonstrated shipped-core failure. |
| **S-24** | **Add PL-030 — Medium, verification-first:** force readiness measurement failure at the caller and prohibit substitution of cache-operation counts as “games made ready.” Existing `G2-D-02 (gpt)`. |
| **S-25** | **Add PL-031 — Medium, verification-first:** establish terminal-state ordering and ownership of successful completion side effects, including close without a successor attempt. Cover `G2-C-02` and `G2-C-03 (gpt)` together. |
| **S-26** | **Add PL-032 — Medium, conditional verification:** establish the shipped bind invariant. No listener code change is required if an enforced IPv4 bind refutes applicability. The blind pass correctly marks the implementation missing; do not promote it to a demonstrated shipping failure. |
| **S-27** | **Add PL-033 — Medium, safety-evidence resolution:** prove safe overlap or cancellation at the hung threshold, or record the precise accepted consistency risk. This need not reopen the authorized 120-second policy; it must stop being described as a safety proof based on age alone. |
| **S-28** | **Already PL-023.** Does not invalidate run 69, which reportedly had zero skips. |
| **S-29** | **Already PL-024.** |
| **S-30** | **Add PL-034 — Medium, release-evidence resolution:** run the required final-cut upgrade/integration proofs or obtain explicit acceptance of each unavailable proof. Do not demand a VM proof where an item’s actual criterion requires only a host/unit test. |
| **S-31** | **Already PL-013.** Agree with the blind pass’s Medium grade rather than the punch list’s High. |

The blind pass’s final list of unreached acceptance checks is **relative to its earlier packet**. F now supplies more item-specific reported evidence. Do not carry that list forward unchanged as proof that all those tests remain missing. Conversely, the extra summaries are not the raw artifacts, and the #307 PL-081 criterion remains unprovided.

## 4. What I could not judge, and unsupported summary claims

### 4.1 Material gaps

The orchestrator should supply or explicitly retain these limitations:

1. **Actual implementations and complete call paths.** The embedded documents contain excerpts and reports, not the current production, hook, and test files. I cannot establish dominating guards, complete callers, or actual extraction and recovery ordering beyond those excerpts.
2. **Original acceptance text.** The full #307/#308 specification and research notes are absent. In particular, #307 PL-081 receives `holds / holds` in A without a corresponding criterion or verdict row in F.
3. **Raw test artifacts tied to the cut.** The VM reports, commands, complete logs, frames, fault-injection outputs, and test binaries are not embedded. Their results are reported evidence, not independently inspected artifacts here.
4. **Dependency behavior.** Same-directory rclone behavior, the exact shipped proxy bind, and the target ZIP listing/checksum capabilities remain material dependencies.
5. **Supported-input and risk decisions.** The complete configuration grammar, archive trust boundary, and authorization records for D-INFRA-012 and D-UI-115 are not embedded. A document saying a risk was accepted is evidence of that claim, not the acceptance record itself.
6. **Historical remediation details.** Log rotations, compression, permissions, writer lifetimes, and restart behavior are needed to prescribe a safe one-time scrub.
7. **Packet reproducibility.** The exact packet-generation procedure, manifests, preserved objects, and reconstruction proof needed by PL-012 are absent.
8. **The earlier blind packet itself.** Its path and hash appear inside B, but its contents were not embedded as a direct source in this pass. I did not treat that nested citation as a separately reviewed file.

### 4.2 Executive and synthesis claims that need correction

| Claim | Why this packet does not support it as written | Entry it should rest on / corrected formulation |
|---|---|---|
| **“The 81 punch items are implemented”; “No item fails.”** | Absence of a seat verdict saying “does not hold” is not positive acceptance evidence. Numerous verdicts are partial or cannot tell; A itself identifies one partial and one outside this round. | F’s per-item table plus each item’s actual criterion. Say **79 claimed implemented at the stated evidence levels**, not that all acceptance criteria are complete. |
| **#307 PL-081 has `holds / holds`.** | No supporting seat row or acceptance text is supplied in F. | Supply the criterion and actual verdict source, or mark it outside scope/unassessed. |
| **“21 items proven on the VM.”** | The scorecard has 21 PASS cells, one being explicitly partial PL-032. Twenty rows explicitly say “implemented; proven on the VM”; PL-069 has a dash but makes a separate leak claim. The intended accounting needs reconciliation. | An item-to-artifact ledger distinguishing execution PASS, partial acceptance, stand-in evidence, and completed acceptance. If PL-069 supplies the additional item, show an appropriate leak measurement—not merely task count. |
| **“Every fix came with a case seen to fail first.”** | O-2 explicitly records an unconstructible pointer-write failure as read-only evidence. The reports also distinguish controls from red-before-fix cases, and several test oracles are challenged. This does not prove that every fix lacks such a case, but it does not support the universal claim. | Per-fix FAIL-then-PASS records. State the exceptions rather than deriving universality from 844 checks. |
| **“Five copies” of an executable configuration validator.** | F identifies three sourcing validators and separately describes content `conf_get` readers. T’s adjacency grep does not establish identical semantics or execution sinks. | A reader inventory naming parsing, expansion, execution, duplicate policy, and default behavior at each consumer. |
| **“All fourteen are one shape: guards failing on their own errors,” and all sit in this round’s follow-ups.** | Historical retained passwords, the pre-existing redaction guidance, path identity mistakes, and quote parsing are different mechanisms and origins. | F’s individual classifications, including `BS-1` and the explicit pre-existing description of `G2-I-10`. The common theme is incomplete safety coverage, not one literal error path. |
| **“Fourteen Highs and six confirmed Mediums” are the FIX-NOW set.** | P numbers **ten** Mediums. F additionally confirms `G2-B-05` as Medium, then loses it from P. | Reconcile the finding-to-item ledger. Under the documents’ original grading, ten numbered Mediums plus that omitted confirmed Medium require disposition. |
| **The fixes touch “five scripts, one C++ file…”** | The named punch scope includes more scripts, the generators and harness/rehearsal tools, and at least `StringUtil.cpp`, `AtomicFileUtil.cpp`, and `GuiMenu.cpp`. | Derive the scope from the actual PL-001..024 file inventory. “All small” is an effort judgment, not demonstrated evidence. |
| **“None of the seats’ Highs contradicts O-1..O-21.”** | O-16 claims the collision set is complete; the accepted dot path directly defeats that statement. Some other O entries are correctly limited, but their limits disappear in synthesis. | Amend O-16. Keep O-3 “as far as read”; qualify O-5’s fallback, O-8’s lifecycle scope, O-12’s first-save scope, and O-18’s parse-provenance claim. |
| **The emitter-table test guards the complete cross-repository contract.** | `G2-E-tests-09 (gpt)` and `G2-E-tests-05 (claude)` identify a manually curated table with no demonstrated complete-emitter linkage. | Say the listed examples are covered; supply an authoritative inventory or generated contract check before claiming completeness. |
| **The capture interaction is “safe by the bound.”** | A bound establishes responsiveness, not that the old capture is stopped or harmless. A capture blocked on A’s lock is expressly untested. | O-6 plus the missing interaction proof, or an explicit accepted consistency exception. |
| **All first-audit findings are “answered.”** | This can mean that every finding received a response. It cannot mean every answer was verified correct: F includes “cannot tell,” partial answers, and disputed withdrawals. | Separate **response received**, **fix verified**, **withdrawal substantiated**, and **risk accepted**. |
| **Unread Medium leads “none blocks the candidate.”** | Lack of a completed read is not a basis for a non-blocking correctness verdict, especially for recovery, signalling, publication, or COPY serialization. | Give each a verified resolution, a scoped non-blocking rationale, or an explicit pending status. Test infrastructure has no automatic immunity from release relevance. |

Two further distinctions matter:

- **D-INFRA-012 can accept PID-reuse risk, but `pid_max` is not an elapsed-time wait bound.** Do not describe that acceptance as a correctness refutation.
- **“No VM proof named” does not automatically mean an item is incomplete.** Some criteria require host, unit, or build evidence. Acceptance must be evaluated against its own text, not a universal VM requirement.

### 4.3 `corpus.provenance.json`

The arrays below are position-aligned in source-key order **F, T, A, P, B**. They also provide the full path-and-hash citations for those keys. All hashes are **verified at embed time by the Council Facilitator**, not independently verified by this reviewer.

```json
{
  "source_labels": [
    "F",
    "T",
    "A",
    "P",
    "B"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/02-forward-audit.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/03-retrospective.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/04-analysis.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/05-punch-list.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/second-opinions/blind-gpt.md"
  ],
  "source_file_hashes": [
    "b25df17f7b09e31606306b7b6d2f92db5f1e7028908afea06c436809ad68a350",
    "3c239e02bea2ef188ae2a7ece60c1a0ae7d630104d8b2b2514ab3566c90eabfb",
    "2a7ea4f78df2b89583e36d6ed1d1942ffba0a06a7fca8fb68b63fc7ab3d531d0",
    "1ee863e8ec3396de60416cc96d5a039b5c53a484ca8e19c6604a72cdd3f085ac",
    "281875ffe29546ba300855f0fdff70ecfe778f841a0878dc0431c8283e2576b2"
  ],
  "hash_algorithm": "sha256",
  "hash_verification": "Verified at embed time by the Council Facilitator; not independently recomputed by this reviewer.",
  "facilitator_manifest_read_timestamp_utc": "2026-09-28T15:45:33Z",
  "read_basis": "The five embedded documents only. No filesystem access, independent file re-reading, re-hashing, or command execution.",
  "gaps_for_orchestrator": [
    "Complete production, hook, and test implementations were not embedded; the review relies on quoted excerpts and reported inspections.",
    "The original acceptance criteria and research notes were not embedded. The criterion and seat evidence for original item PL-081 are missing.",
    "Raw candidate test reports, logs, frames, fault-injection artifacts, and item-to-artifact provenance were not embedded.",
    "Same-directory rclone behavior, the shipped proxy bind implementation, and target ZIP checksum/listing capabilities need direct evidence.",
    "The supported configuration syntax, accepted archive-input boundary, and complete risk-acceptance records were not embedded.",
    "Log rotation formats, permissions, writer lifetimes, and restart behavior needed for the historical scrub are not supplied.",
    "Exact packet-generation procedures, preserved source objects, and hash-identical reconstruction evidence were not embedded.",
    "The earlier blind-packet document cited inside blind-gpt.md was not embedded as a direct source in this pass and is not recorded as independently reviewed.",
    "No paths, hashes, or contents have been invented for missing material."
  ]
}
```

## 5. Pasteable closing paragraph

The refutation pass narrows several conclusions: total loss in the migration remains conditional on unrun rclone behavior; the packet establishes three sourcing validators, not five execution sinks; and the guide-only masking example is Medium rather than High. The ZIP-checksum prescription, hook status rule, recovery test oracle, punch YAML, and packet-retention plan need correction. G2-B-05 is a confirmed Medium missing from the numbered gate, while unresolved COPY, lifecycle, readiness, capture, and upgrade evidence cannot be declared non-blocking merely because it was not fully read. Most remaining blocker mechanisms are supported by the quoted inspections and reported probes, but “implemented” is not “acceptance-complete,” and suite totals do not prove every fix failed first. Keep the candidate unready until the corrected requirements, owner dispositions, and required final-cut evidence are recorded; accepted design risks should remain explicit exceptions, not be presented as correctness proofs.
# Packet I — independent audit

**Disposition: not sufficient for release-candidate sign-off.** The packet contains several concrete guard and audit-validation defects. The bootloader-recipe change is sound at the shell level, and the Python wrapper correctly resets SIGINT before executing the harness.

I reviewed **all 14 commit headings** in the embedded diff. This is a static review: I did not access files, recompute hashes, run tests, inspect frames, or inspect either repository outside the embedded corpus. Failure scenarios below are proposed reproductions, not executed tests.

**Two material evidence gaps:**
- The brief names **`b31bf53771`**, but the embedded diff contains neither that heading nor changes to `tools/last-good-scripts-test`. Its runtime-built secret fixtures therefore **cannot be reviewed**.
- No report identifying fixed and withdrawn sweep rows was embedded. I cannot certify those dispositions or claim the requested five sweep-row closures were checked.

References **[S1]–[S5]** resolve to the declared path/hash pairs in `corpus.provenance.json` below. Those hashes were verified by the Facilitator at embed time, not by me.

## 1. Per-commit verdicts

All commit references in this table cite **[S1]**, under the corresponding `#### commit` heading. “Sound in part” sometimes denotes an evidence boundary rather than a demonstrated defect; the reason distinguishes them.

| Commit | Verdict | Mechanism and limitation |
|---|---|---|
| `cdd8f1e63c` | **Sound in part** | The shown rules replace button letters with positions and qualify the browser prohibition with the provider sign-in window. The actual button mapping, `cloud_oauth`, map changes, and decision-register changes are not shown. |
| `6e7e2551cc` | **Sound in part** | Adds an explicit inventory of proposed outcome words and correctly labels their approval status as proposed. No emitting scripts or ES lookup table are supplied, so their correspondence to shipped behavior is unverified. |
| `59135a1dd7` | **Sound in part** | The lint’s `need` set genuinely uses `(seat, finding-id)`, improving on number-only matching. However, verification attribution and section boundaries can still produce false coverage: **G2-I-05/06**. The cloud-script changes described in the rule are not implemented in this packet. |
| `4e858bebe8` | **Sound in part** | Mechanically changes `PKG_VERSION` from `7eae8ed…` to `c0f4f4d…`. The referenced ES contents, ancestry, and build are not supplied. |
| `6f9d43a467` | **Sound** | An `if find_file_path …; then cp …; fi` with no successful condition returns success, avoiding the optional-file failure caused by a terminal `a && b`. A reached `cp` failure remains a failure. This establishes the shown shell behavior, not device/package validation. |
| `9e104c65f3` | **Sound in part** | Adds an index-based pre-commit scan and shares the pattern definition with pre-push. **Not fail closed:** scan failures can become an empty result, and filenames themselves are scanned as credentials: **G2-I-02/03**. The rule’s claim about runtime fixtures cannot be checked without `b31bf53771`. |
| `04b5f66d92` | **Not sound** | Avoids rescanning by pathname alone, without establishing that the bytes are a previously guarded copy. This creates a credential-scan bypass in every scan shown: **G2-I-01**. |
| `78f147f762` | **Sound in part** | **The SIGINT wrapper does what its comment says:** Python sets `SIGINT` to `SIG_DFL`, then `execv` replaces Python with the harness, so the shell does not enter with SIGINT ignored. This does not establish correct signal targeting or harness cancellation handling. Frame claims were added, but their rectangles and explanations cannot be verified without frames/baseline. |
| `a9c624f551` | **Sound in part** | Extends the ID regexes to `G-…` and alphanumeric stream names, but leaves the bullet gate restricted to `- **F-`: **G2-I-07**. The required `G2-I-…` IDs for this review also fall outside the accepted grammar: **G2-I-08**. |
| `380cbf7dc4` | **Sound in part** | Explicitly refuses an unset/empty pattern value after sourcing. It does not verify successful loading or clear an inherited value: **G2-I-09**. It also does not repair the scan-error handling in **G2-I-02**. The hooks cannot be certified fail closed. |
| `1edb7f5d73` | **Sound in part** | Writes `from=checked-launch` for a newly created manager fixture, but the existing-fixture shortcut prevents updating older fixtures: **G2-I-04**. The match wording removes the internally contradictory cloud-copy promise and documents a fresh-preview recovery route; the actual UI and match implementation are absent. |
| `79bcaf55a6` | **Sound in part** | Mechanically changes the ES pin from `c0f4f4d…` to `b05aa70…`; the follow-up implementation is not supplied. |
| `74af928b3c` | **Sound in part** | The shown upgrade-rule edit clearly changes the concurrency contract to one console at a time and preserves interrupted-run recovery requirements. The cited decisions, migration implementation, root-level set-aside behavior, and report are not embedded. |
| `1b0d233657` | **Sound in part** | Mechanically changes the ES pin to `87b182f…`. Whether that commit contains the two correct producer-matching “why” entries is not established by a pin alone. |

**Unreviewable expected commit:** `b31bf53771` is absent from the embedded contents. That is a corpus gap, not a negative verdict on its implementation.

## 2. Findings

There are **nine findings in the changed code**, followed by one explicitly separated defect in unchanged reference guidance.

### G2-I-01: Audit-path exemption accepts content that was never scanned

- **Severity:** High
- **Category:** Credential protection / newly introduced bypass
- **Where:** `.githooks/pre-commit` and `.githooks/pre-push`, `04b5f66d92`: the new audit-path `grep -v` exclusions and the `case "$f" … continue` branch.
- **What:** “This is a copy of an already guarded range” is asserted by a comment but implemented solely as a pathname test. The exception does not establish the source range, compare the copied bytes, or reject additions to the packet.
- **Failure scenario:** A newly introduced credential-shaped line—not copied from any guarded commit—is appended to `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/I.diff`. Pre-commit removes it before matching. The shown pre-push file scan skips the file, and its history scan removes the corresponding added line. None of those scans reports the credential.
- **Evidence:** [S1] shows:
  - pre-commit’s `grep -v -E '^docs/audits/…/seats/…\.diff: '`;
  - pre-push’s pathname-based `continue`;
  - pre-push’s history-path exclusion.
  
  I looked for a content/provenance check before these skips; none is present in the shown mechanisms. [S4], **Safety net**, still promises credential scanning on every pushed branch without documenting this content exemption.

Avoiding duplicate scanning can be legitimate, but it requires proving that the exempt bytes are the already-checked bytes.

### G2-I-02: A failed scan is treated as a clean index

- **Severity:** High
- **Category:** Credential protection / fail-open error handling
- **Where:** `.githooks/pre-commit`, created in `9e104c65f3`, retained through the later edits: the `hits="$(git diff … | … | head -5 || true)"` pipeline and final `exit 0`.
- **What:** The hook distinguishes only “nonempty captured output” from “empty captured output.” It does not distinguish no matches from a failed producer, parser, matcher, or redactor.
- **Failure scenario:** Git invokes the hook on an index containing a matching added line, but `awk` is unavailable on the hook’s PATH. That stage emits no data; later stages receive nothing; `hits` is empty. The hook reaches its explicit `exit 0`, allowing the commit despite not having scanned it.
- **Evidence:** [S1] contains the complete newly added pre-commit script. There is no checked status for `git diff`, `awk`, `grep`, or `sed`; the pipeline ends in `|| true`. The later nonempty-pattern check tests configuration, not successful scanning. The displayed pre-push scan pipelines also suppress scan failures with `|| true`, although its complete surrounding control flow is not embedded. This directly conflicts with [S2], **Guards must fail closed**.

A repair must distinguish `grep`’s legitimate no-match status from an execution error. Adding `pipefail` while retaining unconditional error suppression would not be sufficient.

### G2-I-03: Pre-commit scans filenames as credential content

- **Severity:** Medium
- **Category:** Newly introduced workflow false positive
- **Where:** `.githooks/pre-commit`, `9e104c65f3`: the `awk` output and following unanchored credential `grep`.
- **What:** The hook prepends the filename and then applies `SECRET_PATTERNS` to the entire resulting line:
  ```text
  print f ": " $0
  ```
  A credential-like substring in a filename is therefore treated as a credential in the added content.
- **Failure scenario:** An ordinary text file has a basename containing `sk-` followed by 24 letters, assembled at runtime for a regression fixture. Its added contents contain no secret. The filename matches the key pattern, making `hits` nonempty and rejecting the commit.
- **Evidence:** [S1] shows no content-only boundary in the pre-commit matcher. In contrast, the pre-push history matcher explicitly restricts matching to the third tab-separated field. Its comment in `04b5f66d92` documents the same historical false-positive category caused by a kernel patch’s name.

The new commit-time guard reintroduces a defect the push-time guard already knows how to avoid.

### G2-I-04: Existing manager fixtures never receive the new rotation tag

- **Severity:** Medium
- **Category:** QA fixture upgrade / inherited state
- **Where:** `tools/vm-qa`, `1edb7f5d73`, `ensure_manager_fixture()`: the initial screenshot existence check and the later rotation-file write.
- **What:** The write changes from `from=own-launch` to `from=checked-launch`, but an unrelated existing screenshot still causes an immediate return before that write.
- **Failure scenario:** An earlier run created `Bobl.rotation` with `from=own-launch` and created `fbn/mspacman.state.auto.png`. The updated runner reuses that guest with `--skip-up`. The screenshot test succeeds, so the new runner retains the old rotation record and never establishes the advertised `checked-launch` fixture.
- **Evidence:** [S1] shows:
  ```sh
  SSH 'test -f /storage/roms/savestates/fbn/mspacman.state.auto.png' ... && return 0
  ```
  before the changed `printf`. No fixture-version check or rotation read-back precedes the return. [S3], **Every fix answers what was already written**, requires handling existing artifacts; [S5], **The frames are compared**, requires walks to determine their own state.

The downstream reader is absent, so I do not claim a particular rendered failure. The stale-fixture path itself is established.

### G2-I-05: A substring can credit the wrong audit seat

- **Severity:** Medium
- **Category:** Audit validation / false verification coverage
- **Where:** `tools/lint-audit-artifacts`, `59135a1dd7`: extraction of `seats` from the parenthesis following a finding ID.
- **What:** Seat attribution is based on substring membership:
  ```python
  seats = [x for x in ("claude", "gpt") if x in par]
  ```
  This does not require an exact seat identifier.
- **Failure scenario:** The index contains both seats’ `F-CS-02`, but the only verification heading is:
  ```text
  ### F-CS-02 (claude, chatgpt cross-reference only)
  ```
  The parenthesis contains the substring `gpt`, so both seats are credited despite there being no independent GPT verification entry.
- **Evidence:** [S1] supplies the substring test and the final `need - have` comparison. No anchored seat field or canonical seat-list parser is present. This can recreate the same-number/two-findings coverage failure the added comment says the guard exists to prevent.

### G2-I-06: Later sections can satisfy missing verification entries

- **Severity:** Medium
- **Category:** Audit validation / section-boundary failure
- **Where:** `tools/lint-audit-artifacts`, `59135a1dd7`: `index, ver = forward[fi:vi], forward[vi:]` and the `ctx` handling.
- **What:** `ver` includes everything from `## Verification` to end-of-file. A later level-two heading neither ends verification parsing nor clears the seat context.
- **Failure scenario:** A GPT High finding has no verification entry. The document contains:
  ```text
  ## Verification
  ### 3-rclone-setup (gpt):
  ## Follow-ups
  - **F-CS-02**: still awaiting verification.
  ```
  The final bullet is outside Verification, but inherits `ctx == "gpt"` and satisfies the missing pair.
- **Evidence:** [S1] shows the unbounded slice. `ctx` changes only on qualifying `###` headings; `## Follow-ups` is ignored. The later `- **F-` bullet is accepted and added to `have`. There is no next-section bound or context reset to refute this path.

### G2-I-07: G-finding bullets are indexed but not read as verification

- **Severity:** Medium
- **Category:** Audit validation / incomplete ID-format update
- **Where:** `tools/lint-audit-artifacts`, `a9c624f551`: the expanded ID regexes and unchanged verification-line gate.
- **What:** The patch adds `G-…` support to the regexes but retains:
  ```python
  if not (line.startswith("### ") or line.startswith("- **F-")):
      continue
  ```
- **Failure scenario:** The index contains High `G-I-01` for GPT, and Verification contains:
  ```text
  - **G-I-01** (gpt): checked against the implementation.
  ```
  The index entry enters `need`, but the verification line is discarded before the new regex runs. The lint falsely reports a missing verification entry.
- **Evidence:** [S1] shows both the widened regex and the unchanged `- **F-` gate in the same hunk. No corresponding `G-` bullet alternative is supplied.

### G2-I-08: This audit’s required IDs are silently excluded from coverage

- **Severity:** Medium
- **Category:** Audit-format compatibility / fail-open parsing
- **Where:** `tools/lint-audit-artifacts`, `a9c624f551`: the findings-index condition using `[FG]-[A-Z][A-Z0-9]*-\d+$`.
- **What:** The orchestrator requires `G2-I-NN` findings, but the lint accepts only `F-…` and `G-…`. A Critical/High row with an unrecognized ID is silently omitted rather than rejected as an unsupported row.
- **Failure scenario:** The orchestrator indexes this report’s `G2-I-01` as High alongside a verified `F-CS-02`. The lint requires only the latter and can print “every Critical/High of the index has a verification entry” while omitting the new High finding. If all rows use `G2-…`, this check requires none of them.
- **Evidence:** [S1] shows the restrictive index regex and no `bad()` branch for an unrecognized Critical/High row. The requested output contract supplies the incompatible `G2-I-NN` format. This is a demonstrated integration gap, not a claim that an unseen index already contains those rows.

### G2-I-09: Missing pattern files can be concealed by an inherited value

- **Severity:** Medium
- **Category:** Guard configuration / incomplete fail-closed fix
- **Where:** `.githooks/pre-commit`, `380cbf7dc4`: sourcing `secret-patterns`, followed by `[ -n "${SECRET_PATTERNS:-}" ]`.
- **What:** Nonemptiness does not establish that the file was successfully loaded. The hook neither clears an inherited `SECRET_PATTERNS` nor checks the source command’s status.
- **Failure scenario:** The shared file is missing, while the environment contains `SECRET_PATTERNS='^$'`. Sourcing reports an error, but the nonempty test succeeds. Added records always contain the filename/content prefix, so that pattern matches none of them. The hook reaches `exit 0`, contrary to its “missing or empty … nothing is allowed” promise.
- **Evidence:** [S1] gives the complete pre-commit creation and subsequent edits: there is no `unset`, checked sourcing, or `set -e` before the new test. The pre-push addition uses the same nonempty test, but its complete prologue is absent; I do not infer identical end-to-end behavior there.

### G2-I-10: The existing log-redaction example preserves the secret

**Scope note: this is in an embedded reference rule, but not in the rule hunk changed by this round. It is not charged to `9e104c65f3`.**

- **Severity:** High
- **Category:** Pre-existing reference-guidance defect / credential disclosure
- **Where:** `.claude/rules/engineering-practices.md`, **Nothing runs on a person’s device… → Except where the line’s presence is the evidence**. No corresponding changed hunk is present.
- **What:** The recommended redactor captures the value and then puts that entire capture back:
  ```sh
  sed -E 's/((token|key|passw[a-z]*|psk|user)[=:][^ ]*)/\1***/Ig'
  ```
  It appends stars; it does not mask the value.
- **Failure scenario:** Input `token=<value>` becomes `token=<value>***`. Substituting a real token leaves that token intact in the transcript.
- **Evidence:** [S2] contains the exact command. `[^ ]*` is inside capture group 1, and replacement `\1***` reproduces it. I looked for a capture limited to the field name and delimiter; this example has none.

This should be corrected separately without representing it as a regression introduced by the fix round.

## 3. The five edited rule files

| Rule file represented in [S1] | What the packet supports | What remains unproved or inconsistent |
|---|---|---|
| `.claude/rules/es-player-text.md` | The edits consistently prefer button positions, qualify the browser prohibition, list proposed outcome words, remove the match’s contradictory cloud-copy promise, and describe recovery through a fresh match check. | Neither the emitting scripts nor the corresponding UI changes are present. The `69 gaps` interpretation, consumed-plan behavior, help-bar behavior, and precise outcome lookup cannot be certified from prose and pins. Full player-text/interface rules were not embedded. |
| `.claude/rules/rclone-cloud-sync.md` | The new text states concrete contracts: flag stripping, sibling layout derivation, named retention, bounded capture locking, manifest preservation, conditional sweeping, inert legacy rules, and text-only configuration reads. | Almost all supporting cloud implementations are outside the packet. These are implementation claims, not independent evidence that the code fulfills them. |
| `.claude/rules/engineering-practices.md` | Both ROCKNIX hooks are changed to source one pattern file. The runtime-fixture requirement is clear and consistent with preventing fixture literals entering history. | The promised fixture changes are missing. Guard reliability is overstated in light of **G2-I-01/02/03/09**; the ES repository’s hook is absent. The separate existing redaction defect is **G2-I-10**. |
| `.claude/rules/fork-workflow.md` | Documents an absolute `core.hooksPath`, explains why commit-time scanning helps, and accurately describes the intended shared patterns. | The unqualified scanning promise omits the new audit exemption and scanner-failure paths. Documentation of the absolute-path command is not evidence that the reviewed clone/worktrees actually have it configured. |
| `.claude/rules/upgrade-and-install.md` | Clearly changes the migration assumption to one player/console at a time, while requiring remote-state rereads after interruption. | The cited decision records and migration code are absent. I therefore do not classify lack of a cross-device migration lock as a defect. Separately, the manager-fixture edit fails the rule’s inherited-state principle on its visible early-return path. |

The relevant full rules are [S2]–[S5]. The other two edited rule files are available only through [S1]’s hunks.

## 4. Sweep checks and withdrawals

**The required report-to-sweep disposition audit remains blocked.** No fixed/withdrawn row list was supplied, and I will not manufacture statuses.

The following are **seven reference checks against identifiers actually mentioned in the diff**, not seven certified sweep-row closures:

| Reference in [S1] | Visible check | Result |
|---|---|---|
| **PL-073** | Optional bootloader updater installation, `6f9d43a467` | The recipe’s terminal-status repair is visible and sound. The updater deletion itself is not shown. |
| **F-ES-14** | Two cloud-folder-row claims in `78f147f762` | Claim entries exist. Neither UI implementation nor frames establish the asserted wording/rectangle. |
| **F-RA-14 / F-CS-07** | Transfer-footer claim entries | Entries say console letters were removed. The actual footer rendering is absent. |
| **PL-001** | Match recovery explanation in `1edb7f5d73` | The documentation explicitly avoids replaying a consumed plan. The producer and UI enforcement are absent. |
| **PL-020** | Upgraded-rule merge and anchored catch-all description | Only the rule’s account of the fix is present; no merge/refusal implementation is available. |
| **PL-021** | Named preservation during pruning | Only the documented algorithm is present; deletion ordering and retained-name checks cannot be inspected. |
| **PL-015** | Top-level folder handling and content-folder derivation | Only the documented behavior is present; no parser/writer hunk establishes it. |

**Withdrawals:** no withdrawn row or withdrawal rationale is embedded, so none can be judged.

## 5. Cross-stream seams

| Seam | Required agreement | Packet assessment |
|---|---|---|
| Shared `tools/last-good-scripts-test` ↔ hooks | Scanner fixtures must become credential-shaped only at runtime; their at-rest source must not match the guard. | **Unreviewable:** the named fixture commit is absent. Sharing a pattern definition does not prove fixture construction. |
| `vm-qa` launch ↔ cancellation tests | The harness must enter with SIGINT available and send it to the intended ready process. | The wrapper establishes the first condition. Test targeting, readiness, traps, and assertions are outside the packet. |
| Manager fixture ↔ rotation reader | Writer and consumer must agree on trusted provenance tags; reused guests must receive the intended fixture. | Fresh writes use `checked-launch`; the reader is absent. Reused guests demonstrably retain the old tag through **G2-I-04**. |
| Cloud scripts/backuptool ↔ ES cards | Emitted reason strings and stamp states must match the pinned interface’s interpretation, including partial network failures versus skipped runs. | New words and `69 gaps` are documented, but neither side’s implementation is supplied. Pin changes alone do not prove agreement. |
| Match apply ↔ UI retry | A consumed plan must lead to a fresh preview, not replay of the old apply command. | The rule states the right distinction for its described semantics. Neither enforcement side is visible. |
| Proxy stamps ↔ cards | The cards must interpret the proxy’s actual outcome/stamp representation. | No relevant producer or consumer hunk is present; no schema compatibility verdict is possible. |
| `wifictl` ↔ picker | The picker must parse and present the output the tool actually emits. | Neither implementation is included. A commit subject mentioning `CONNECTED` is not evidence of this contract. |
| Scripts ↔ interface settings lock | Both must agree on acquisition, ownership, timeout, and release behavior. | Relevant implementations are absent. The newly documented capture lock is a different lock and cannot establish settings-lock compatibility. |
| Audit reports/index ↔ lint | The lint must recognize every supported ID and exact seat within the Verification section. | Agreement is broken on the concrete inputs in **G2-I-05/06/07/08**. |
| ROCKNIX recipe ↔ device updater removal | Absence of an optional updater must not fail installation; a real copy failure must remain visible. | The shown conditional preserves those shell outcomes. The device-side removal and installed image are not supplied. |

## 6. Coverage boundary and orchestrator handoff

Before treating this packet as closed, the orchestrator needs:

1. **The missing `b31bf53771` fixture hunks**, including enough harness context to evaluate runtime construction and cancellation assertions.
2. **The fixed/withdrawn sweep report and referenced rows.** The minimum-five closure check is not satisfied by documentation references alone.
3. **The relevant pinned ES implementations and producer scripts**, particularly the new outcome words, match recovery, rotation reader, and cards.
4. **The full applicable player-text, interface, cloud, and packaging rules** where only names or diff excerpts were supplied.
5. **Guard positive-test evidence and VM/frame artifacts.** The rule requires observed constructed failures; the packet does not contain those observations. Their absence here does not prove they do not exist elsewhere.
6. **Complete existing-tool context where needed.** Pre-commit can be reconstructed from its creation and follow-ups; pre-push, the lint, `vm-qa`, and the recipes are only partially shown.

I did not verify package installation, device behavior, actual hook activation, frame-claim accuracy, or that any pinned ES commit contains or descends from the expected fixes.

## `corpus.provenance.json`

The following is artifact content for the orchestrator to persist; I have not written a filesystem file. The source-ID, path, and hash arrays are parallel.

```json
{
  "packet": "I",
  "review_mode": "static review of prompt-embedded contents only",
  "source_citation_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/I.diff",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/fork-workflow.md",
    ".claude/rules/generic-x64-vm-testing.md"
  ],
  "source_file_hashes": [
    "4c42ba0b028c1e215dc40aa11990982bf028cfa5cd8413f8017ec0d7a3ae02c1",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "5e10bbbf8cfb81bdb34412e54202a8310554ba677b653be636e174fca9211c3a",
    "9ae148998b481417b86d6b84f03dfff94ac47d8f1159edb2c6c17f5e7c350202"
  ],
  "source_arrays_are_parallel": true,
  "hash_algorithm": "sha256",
  "hash_verification_authority": "Council Facilitator — council-facilitator@1.2.0",
  "hash_verification_status": "verified at embed time by the Facilitator; values copied from source headers",
  "manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "independent_filesystem_access": false,
  "independent_file_reread": false,
  "independent_hash_computation": false,
  "runtime_tests_executed": false,
  "commit_headings_reviewed": 14,
  "changed_rule_files_reviewed": 5,
  "missing_or_partial_evidence": [
    "Commit b31bf53771 and tools/last-good-scripts-test fixture hunks are not present in the embedded diff. Runtime fixture construction cannot be judged.",
    "No report or row list identifying fixed and withdrawn sweep items was embedded. The requested minimum-five sweep-row closure audit remains blocked.",
    "The ES implementations referenced by the package pins are not embedded. Their contents, ancestry, builds, and producer-consumer compatibility are unverified.",
    "Relevant cloud scripts, proxy stamp producers and readers, wifictl and picker implementations, rotation reader, and shared settings-lock implementations are not embedded.",
    "Full es-player-text.md and rclone-cloud-sync.md are not embedded; only changed excerpts appear in I.diff. The additional interface and packaging rules named by the brief are not supplied in full.",
    "Existing pre-push, lint-audit-artifacts, vm-qa, and recipe implementations are shown only in partial diff context.",
    "QA frames, accepted baseline, runtime logs, installed artifacts, hook configuration, and observed FAIL-then-PASS evidence were not embedded."
  ],
  "missing_source_hashes": "Not supplied and not fabricated.",
  "finding_scope_note": "G2-I-01 through G2-I-09 concern changed code. G2-I-10 concerns pre-existing, unchanged guidance in embedded source S2."
}
```
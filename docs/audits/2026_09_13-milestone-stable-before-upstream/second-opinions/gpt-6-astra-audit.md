> Copied verbatim from the Facilitator scratchpad (`…/second-opinions/gpt-6-astra-audit.md`, provenance beside it) with one edit: the synthetic credential example in F-03's probe was put in angle brackets, because the fork's pre-push guard refuses a credential-shaped literal — the very guard that finding is about.

# Audit result: the completion claims are not reliable enough to close this milestone

**Scope:** distribution `53f390b1e9..59103cd9cb`; EmulationStation `52012829c..3466b36af`; supplied decisions, rules, and acceptance criteria.

**Findings:** **0 Critical, 3 High, 9 Medium, 2 Low.**

Two checked requirements are contradicted by the supplied changes: protection from old PPSSPP assets does not cover the legacy ZIP restore path, and a bad ScreenScraper developer pair with no account takes the “add an account” branch instead of identifying the developer credentials.

The main cross-system problems are backup compatibility, verification weakened after the backup-size change, and safeguards that report success without proving their own work. Several substantial feature claims also have no corresponding implementation or primary test artifact in this packet.

**Evidence boundary:** this is a static, milestone-tier second opinion—not a completed execution of the audit lifecycle. I did not run commands, inspect the named screenshots, create artifacts or an issue, or verify resolutions. Results quoted inside acceptance criteria remain claims, not independently inspected command output. Proposed probes below have **not** been executed. Line references use the new side of the supplied diffs.

---

# Findings by severity

## High

### F-01 — Legacy ZIP restores are not protected from old PPSSPP assets and caches

**Files**
- `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:541–566`
- `tools/last-good-scripts-test:597–608`

**What is wrong**

The new exclusion list is applied only inside `ARCHIVE_KIND=tar`:

```sh
tar -xzf "${BACKUPFILE}" -C / -X "${SKIP}"
```

The ZIP branch remains the older symlink-protection path. The diff supplies no corresponding exclusion for:

- `storage/.config/ppsspp/assets/`
- `storage/.config/ppsspp/PSP/SYSTEM/CACHE/`

Case k creates and restores only a `.tar.gz`.

**How it fails**

A legacy ZIP containing those regular files can restore old program data over a newer image’s PPSSPP files. The symlink safeguard is not sufficient: this change itself correctly explains that `/usr/bin/assets` points **into** the regular directory under `/storage`, not the other way around.

This violates D-CLOUD-008’s **“from any archive”** requirement and disproves the unqualified old-backup protection tick in #45.

**Refutation check**

The tar exclusion is real and useful; this finding is not alleging that it is ineffective. The uncovered compatibility branch is ZIP.

**What would settle it**

On a disposable target VM:

1. Make a legacy ZIP the sole restore candidate, containing old assets, old cache files, and a changed settings file.
2. Put distinct sentinel bytes in the current assets/cache.
3. Run `backuptool restore --no-restart`.
4. Require unchanged sentinel hashes **and** successful restoration of the settings file.

Add that case alongside the tar case. A complete ZIP extraction branch demonstrating equivalent existing protection would also settle the static gap.

---

### F-02 — Backup pruning converts an input/filter error into a potentially successful incomplete backup

**File:** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:275–297`

**What is wrong**

This suppresses every failure, not just grep’s legitimate “no retained lines” status:

```sh
grep -v -F -f "${REGENERABLE}" "${FILELIST}" > "${FILELIST}.pruned" || true
```

A partially produced `.pruned` file is then consumed and promoted to the authoritative file list. The newly added temporary-file creation, appends, and replacement also lack explicit success checks.

**How it fails**

If grep emits some filenames and then encounters an input or output error, the surviving list can still be nonempty. The later empty-list guard will not catch that. The archive can be structurally valid while silently omitting intended user configuration.

Validating an archive against an already-truncated send list does not establish that the intended backup was complete.

**Refutation check**

An all-excluded input legitimately gives grep status 1. That explains why a simple unconditional failure check would be wrong; it does **not** justify accepting status 2 or failed writes.

**What would settle it**

Extend `tools/last-good-scripts-test` with a failure-injection case whose pruning command writes one legitimate filename and then exits 2. Require:

- nonzero backup result;
- no new successful backup publication;
- the previous good backup unchanged.

Also test temporary-file/write failures. Handle grep’s empty-result status separately from machinery failure.

---

### F-03 — The ES secret guard scans the final tree, not all secret-bearing objects being pushed

**File:** ES `.githooks/pre-push:44–61`

**What is wrong**

The hook obtains filenames from an endpoint diff and reads each file only at `local_sha`:

```sh
git diff --name-only --diff-filter=AM "${range}"
git show "${local_sha}:${f}"
```

That cannot detect credentials introduced in an intermediate commit and removed before the pushed tip.

**How it fails**

Two commits—one adding a credential and one deleting it—can produce a clean final tree. Both commits and the credential-bearing blob are nevertheless pushed. An endpoint diff can omit the file entirely; reading the tip would miss the credential even if the file were enumerated.

**Refutation check**

A stronger regular expression cannot fix this. The vulnerable blob is never inspected.

**What would settle it**

In a disposable repository, using only a synthetic value matching the existing pattern:

1. Commit `devpassword=<a synthetic value matching the hook pattern>`.
2. Delete it in a second commit.
3. Push both commits together on a feature branch.

Expected: the hook refuses the push. The shown implementation has no matching tip content to refuse.

Scan newly exposed commits/blobs, including first-push and cross-remote cases. Record an actual negative test through Git’s installed hook, not just direct regex tests.

---

## Medium

### F-04 — Missing account credentials bypass the developer-pair diagnosis

**File:** ES `es-app/src/scrapers/ScreenScraper.cpp:1012–1029`

**What is wrong**

The account-presence check returns before the developer-only probe:

```cpp
if (ScreenScraperUser.empty() || ScreenScraperPass.empty())
    return _("SCREENSCRAPER NEEDS YOUR ACCOUNT TO SCRAPE...");
```

**How it fails**

For a login failure with a bad developer pair and no account, the player is told to add an account. The developer pair is never tested.

This directly contradicts #66’s checked **“wrong developer pair (any account, or none)”** requirement. A frame from an earlier implementation does not refute the final pinned source’s early return.

**What would settle it**

Test the final pin with bad developer credentials and:

- neither account field;
- only a username;
- a complete account.

All must identify a definitively rejected developer pair. With a valid developer pair and no account, the separate “add an account” message should remain available.

---

### F-05 — An inconclusive ScreenScraper probe is reported as rejected credentials

**File:** ES `es-app/src/scrapers/ScreenScraper.cpp:1020–1029`

**What is wrong**

`pairOk` requires a successful request and a body starting with `<?xml`. Every other outcome becomes:

> SCREENSCRAPER REJECTED THE DEVELOPER ID OR PASSWORD.

**How it fails**

A timeout, maintenance response, rate limit, server error, or unexpected response format is not proof that the developer credentials were rejected. This path directs the player to change credentials when retrying may be the correct action.

The code conflates **accepted**, **rejected**, and **could not determine**.

**What would settle it**

Inject successful, explicit-rejection, timeout, maintenance, rate-limit, and malformed-response probe results. Only an affirmative credential-rejection result should blame the developer pair. An unavailable probe must give a truthful retryable outcome.

---

### F-06 — The new absence classification has fail-open branches

**Files**
- `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:144–158,195–198`
- `projects/ROCKNIX/packages/network/rclone/sources/cloud_content_restore:325–339`

**What is wrong**

There are two ways classifier failure becomes permission to proceed:

1. A failed `rclone backend features` command is indistinguishable from a successfully identified non-bucket backend:

   ```sh
   if ! rclone backend features ... | grep -q '"BucketBased": true' ...
   ```

2. The directory-name comparison lacks `--`:

   ```sh
   grep -qFx "${name}/" && return 1
   return 0
   ```

   A name beginning with `-` can be interpreted as a grep option. Grep’s error then falls through to “absent.”

**How it fails**

The setter can apply the parent-based rule precisely when bucket identity was not established, undermining D-CLOUD-123’s explicit InvalidBucketName exception. A present, dash-prefixed folder can also be classified as absent after a failed listing.

**What would settle it**

Add fixtures for:

- a failing features probe followed by a successful root listing;
- an invalid bucket name;
- an existing `-Library/` directory.

Unknown backend identity and comparison errors must not authorize the path. Validate command statuses independently and compare names with `grep ... -- "${name}/"`.

---

### F-07 — QA account credentials are exposed in SSH process arguments

**File:** `tools/qa-accounts:43–52`

**What is wrong**

The RetroAchievements branch embeds the username, password, and API key in the SSH command argument. `%q` provides shell quoting, not secrecy.

**How it fails**

The credentials become observable in process arguments on the host and potentially the remote shell, and can enter process/debug captures. Redirecting stdout and protecting the source file with mode 0600 do not protect argv.

This is narrower than a production-account exposure because the tool targets QA guests, but the credentials remain sensitive.

**What would settle it**

Use synthetic credentials and inspect the argument vectors of the SSH process and its children during execution. No credential value should appear.

Transport values through a fixed stdin-based protocol or another appropriate protected channel, and verify that downstream setters do not reintroduce them into argv.

---

### F-08 — The ScreenScraper provisioning writer can replace valid configuration with invalid XML and report success

**File:** `tools/qa-accounts:65–84`, particularly the remote write at approximately `77–81`

**What is wrong**

The remote script:

1. filters the existing configuration through unchecked greps;
2. appends credential elements;
3. appends `</config>`;
4. renames the result over the original.

The post-write check verifies only that credential-shaped attributes exist—not that the XML parses or that previous settings survived.

**How it fails**

If reading/filtering the old file fails, the new file can contain credential elements and a closing tag but no valid opening document. The final `mv` can succeed, and the name-presence verification can also succeed.

Temp-and-rename makes replacement atomic; it does not make the replacement valid.

**What would settle it**

Test failed reads, partial writes, malformed input, and interruption. Require:

- a valid old or new configuration at every interruption point;
- all unrelated settings preserved;
- nonzero result on failure;
- XML validation before replacement.

Also demonstrate that ES’s in-memory settings and last-good recovery cannot undo or resurrect the provisioned state unexpectedly.

---

### F-09 — `qa-accounts clear` reports success even when nothing was cleared

**File:** `tools/qa-accounts:34–38`

**What is wrong**

The SSH result is ignored. The tool prints `cleared:` and exits 0 unconditionally. It performs no post-clear verification.

**How it fails**

An unreachable guest, authentication failure, or failed settings edit still produces a successful cleanup result. On a reachable guest, the diff also does not establish that a later ES save or recovery copy cannot restore the removed credentials.

**What would settle it**

Run the clear path against a deliberately unavailable QA endpoint. It must return nonzero and must not claim cleanup.

For successful cleanup, verify absence after ES restart and after the supported last-good recovery path. Include temporary and recovery files in the credential-lifecycle check.

---

### F-10 — LINK5’s new skip leaves the recovery-integrity proof unclosed

**File:** `tools/cloud-round-trip:5245–5257`

**What is wrong**

When `receiving and locked and archive_whole` is true, the new branch skips checking the receiving artifact after the rerun. It prints advice to assert elsewhere, but the diff adds no mandatory alternative test or unresolved-result propagation.

**How it fails**

The receiving archive may change after having been considered whole, yet this branch contributes no failure. The suite can finish successfully without proving recovery integrity for that case.

This is a **test gap**, not proof that the cloud script caused the server’s mutation. The method’s correct disposition for an invalid fixture is an explicit untestable result, followed by an independent test—not an inferred product failure or an implied integrity pass.

**What would settle it**

Either fix the fixture’s lifecycle or run the equivalent interruption-and-rerun integrity test on a suitable alternative backend. Verify actual receiver hashes after all outstanding requests settle. Until then, exclude this cell explicitly from completion claims.

---

### F-11 — The ES personal-path guard checks the source branch, not the pushed destination

**File:** ES `.githooks/pre-push:40–42,63–72`

**What is wrong**

The hook discards `_remote_ref` and decides whether to enforce `pr/*` restrictions from `local_ref`.

**How it fails**

A push such as:

```text
feature/example:refs/heads/pr/example
```

does not enter the personal-path check, although its destination is a PR branch. Pushing a commit expression or `HEAD` has the same class of problem.

Additionally, failure of the triple-dot comparison is suppressed inside process substitution. A comparison with no usable merge base can yield an empty filename stream and pass.

**What would settle it**

Exercise the installed hook with:

- local `pr/*` → remote `pr/*`;
- local `feature/*` → remote `pr/*`;
- `HEAD`/SHA → remote `pr/*`;
- an unavailable merge base.

Guard the destination ref and fail closed when the comparison cannot be performed.

---

### F-12 — `register-check` can claim complete citation coverage after silently missing citations or inputs

**File:** `tools/register-check:24–31,47–68`

**What is wrong**

ID extraction accepts arbitrary uppercase areas, but citation extraction recognizes only a hard-coded area list. A typo such as `D-NTE-002` is ignored rather than reported missing.

The discovery pipelines also suppress read errors, and their exit statuses are not validated before the success message.

**How it fails**

The tool can print:

> every citation in the live documents names a row

while an invalid citation was never examined, or an intended input could not be read.

**What would settle it**

Add negative tests for:

- a misspelled area;
- an unknown ID in a valid area;
- duplicate IDs;
- an unreadable mandatory input.

Use a consistent citation grammar and distinguish explicitly optional inputs from failed mandatory scans. Report coverage counts as well as ID counts.

---

## Low

### F-13 — The advertised QA port restriction accepts two extra ports

**File:** `tools/qa-accounts:25–31`

**What is wrong**

The documented range is `10022–10029`, but:

```sh
1002[0-9]
```

also accepts `10020` and `10021`.

**How it fails**

The tool may address an unintended local forwarding endpoint. If the endpoint is absent, F-09 can additionally report a successful clear.

**What would settle it**

Reject 10020 and 10021, and test both accepted and rejected boundaries. If the intended range really is larger, document and establish those endpoints as QA guests instead.

---

### F-14 — The ES instruction pointer gives an ambiguous/wrong working-directory command

**File:** ES `CLAUDE.md:30–34`

**What is wrong**

It says all listed checks run from the distribution checkout, then gives:

```sh
python3 tests/cloud-oauth-lifetime.py
```

The supplied runner documentation identifies that test as belonging to the ES tree. The command does not select that tree.

**How it fails**

A session following the pointer literally can fail to run the intended lifetime check or run a different relative path.

**What would settle it**

Give an explicit ES-rooted path or an explicit working-directory change, and execute the documented command verbatim from the stated starting directory.

---

# Checked acceptance criteria the diffs do not fully support

I re-derived all checked items rather than trusting siblings of a disproved tick.

**Scorecard for the 45 checked criteria**

| Verdict | Count |
|---|---:|
| PASS — narrow, static requirements | 2 |
| PARTIAL | 16 |
| FAIL — contradicted by the shown changes | 2 |
| UNTESTABLE from this packet | 25 |

This is an **evidence-coverage score**, not a measured product test-pass rate.

The two fully supported static ticks are:

- **#45, criterion 5:** the misleading symlink comment was corrected.
- **#27, criterion 2:** the save-state fix does not change its msgids or require corresponding save-state translations.

For the table below, criterion numbers are their order in the supplied issue checklist, including unchecked entries. **Every item listed below remains unsupported as a complete tick.**

| Issue | Independent verdicts | Evidence and unresolved gap |
|---|---|---|
| **#45** | **1 PARTIAL:** archive substantially smaller. **2 UNTESTABLE:** both INIs round-trip. **4 FAIL:** old archives cannot overwrite assets. **6 PARTIAL:** Cheats policy and coverage. | The pruning implementation exists, but no inspected target size result is supplied. Case k has no `controls.ini` fixture and does not restore the newly generated backup to prove that round-trip. Old ZIP protection is missing: F-01. D-CLOUD-008 records the Cheats choice and the include logic is consistent with it, but the test’s user-created file is `test/own`, not a user-added cheat, and no target artifact is available. |
| **#142** | **1 PARTIAL:** missing-folder classification. **2 PARTIAL:** FTP scan. **3 PARTIAL:** complete first content backup. **4 UNTESTABLE:** 99/99 or 100/100. | The parent walk and mkdir-before-copy are present. The classifier has F-06’s gaps. The source-order assertion does not prove every file arrived. No raw FTP suite result or receiver listing/hashes is supplied. Also, “reachable cloud never says unreadable” is too broad: reachable but unauthorized/unlistable is legitimately an error under D-CLOUD-123. |
| **#50** | **1 PARTIAL:** different default names. **3 UNTESTABLE:** reboot/reflash stability. **4 PARTIAL:** custom names retained. **5 PARTIAL:** upgrade preservation. **6 PARTIAL:** mDNS response. | The suffix algorithm, custom-name branch, service enablement, and ordering are visible. Case m stubs `cloud_device_id` and deliberately does not establish the kernel hostname. Its fixed ID cannot prove real reflash stability. Distinct full IDs also do not guarantee distinct four-hex prefixes. The upgrade claim must retain D-NET-002’s explicit exception for the shipped family name. No inspected boot, reflash, DNS response, or previous-image upgrade artifact is present. |
| **#93** | **1 PARTIAL:** prompts refresh after deletion. **2 UNTESTABLE:** VM screendump. | `loadGrid()` now calls `updateHelpPrompts()`. That is relevant implementation, not proof of the entire delete/focus/render sequence. The frame itself is not supplied. |
| **#47** | **1 UNTESTABLE:** an unconfigured cloud is not presented as faulty. | The shown `GuiMenu.cpp` changes make the restore marker lookup uncached. They do not show the claimed neutral cloud-row presentation or setup dialog implementation. |
| **#27** | **1 PARTIAL:** full labels and two-line slots at both resolutions. | The sizing, font scaling, and forced multiline changes are present. Actual frames at 640×480 and 1280×800 are not. The date fit also measures the current date string rather than demonstrating the widest displayed slot label. |
| **#149** | **1 PARTIAL:** help at 640×480. **2 PARTIAL:** single drawing at 1280×800. | The top-page/full-screen render guard is visible. Neither the actual prompt combinations nor the absence of a duplicate rendered bar is established by an inspected frame. |
| **#66** | **1 PARTIAL:** cause identified and recorded. **2 PARTIAL:** controlled error messages only. **3 FAIL:** bad developer pair with any/no account. **4 PARTIAL:** valid pair/bad account diagnosis. **5 UNTESTABLE:** both cases on VM. | The old forwarding of `getErrorMsg()` and the new controlled strings are visible; provider-response observations are not supplied as primary transcripts. F-04 contradicts criterion 3. F-05 leaves account/developer diagnosis unreliable when the probe is inconclusive. The French entries cover the newly shown strings, but do not prove runtime routing. |
| **#67** | **1, 2, 5, 6 UNTESTABLE:** tab persistence, visit persistence, fresh defaults, upgrade defaults. | No scraper-filter persistence/defaults implementation appears in the provided net diff. Named frames are not inspected evidence. |
| **#68** | **1–5 UNTESTABLE:** summary, game progress, missing-key messaging, secret exclusion/restore field, binary and conditional-build checks. | The `.po` entries are not the API-login, menu-field, sanitizer, or restore-page implementation. None of those changes or primary execution artifacts is supplied. The `CHEEVOS_DEV_LOGIN` build is expressly described as not built; “by construction” cannot establish that build’s behavior. |
| **#69** | **1–4 UNTESTABLE:** Boxart, Logo, unchanged Image modes, VM observation. | There is no theme change in the supplied diffs and no inspectable frame. This does not prove the feature is absent from the baseline; it means this packet does not prove it. |
| **#82** | **1–3 UNTESTABLE:** game-exit refresh, cloud-restore refresh, VM observation. | No screenshots rescan or dismissal/game-exit integration change is shown. The uncached restore-marker change is not evidence of screenshot-list refresh. |
| **#113** | **1, 2, 4 UNTESTABLE:** recorded worst case, retained cut bound, before/after QA numbers. | The actual QA log and command output are absent. Padding restores a plausible long-transfer fixture, but does not itself establish timing, exit status, marker preservation, or receiver integrity. F-10 additionally leaves an integrity cell unresolved. |

### Existing tracked scope—not new audit punch items

The **17 unchecked criteria** remain unverified and belong to their existing issues:

- #45: 3
- #50: 2, 7
- #47: 2–5
- #66: 6
- #67: 3, 4, 7, 8
- #68: 6
- #69: 5, 6
- #82: 4
- #113: 3

They must not be converted into “resolved” or blanket-deferred audit items merely to close this review.

For prior audit **#129 PL-08**, the new checker and `GuiMenu.cpp` citation correction are visible. The actual register rekey, companion live-document correction, and executed checker result are not available here, so I cannot verify that prior outcome as resolved. Likewise, D-CLOUD-008 explicitly says archive shrinking does **not** close #53’s size-only comparison problem.

---

# Conformance, coverage, and close-out

## What is supported structurally

There are worthwhile changes:

- The distribution ES pin matches the supplied ES diff tip.
- The new ScreenScraper msgids have corresponding French entries in this packet.
- Tar restoration now considers archives written before the pruning change.
- The FTP backup creates its destination before copying.
- Restore-marker reads are explicitly uncached.
- Hostname assignment and Avahi startup have explicit ordering.
- The LINK5 fixture is adjusted for the smaller archive rather than retaining its obsolete size assumption.

The chief quality concern is not lack of effort; it is that **verification repeatedly checks a narrower artifact than the completion claim**: a final Git tree instead of pushed history, attribute presence instead of valid configuration, source order instead of transferred bytes, and a tar fixture instead of all supported archive formats.

## Required evidence still missing

- `tools/pkgcheck` output for the edited recipes.
- A final-image build result and source/pin provenance.
- Target executions of the added script cases.
- Inspected VM frames at both stated resolutions.
- The cited FTP and link-suite command outputs and endpoint artifacts.
- Relevant baseline source or commit diffs for features absent from this net diff.
- Installed-hook negative tests and register-check negative tests.
- Final-image tests without unrecorded staged-script overlays.

The full blindspot register, service graph, unchanged extraction implementations, and historical audit resolutions were not independently inspected. No defect is asserted merely because one of those artifacts is absent.

## Recorded quality self-check

| Required dimension | Status |
|---|---|
| Executive summary | Present |
| AC scorecard | Present; every checked item re-derived |
| Code quality | Assessed from shown changes |
| Doctrine/conformance | Assessed against supplied excerpts |
| Spec fidelity | Contradictions and approved exceptions identified |
| Missing artifacts | Listed |
| Risk assessment | Severity, impact, and settlement per finding |
| Coverage boundary | Explicit |
| Finding verification | Static refutation checks for High findings; target probes not run |
| Instruction recommendations | Below |

**Lifecycle status:** open. No disk artifacts, artifact lint, GitHub punch-list issue, or Phase 7 resolutions are claimed. The three High findings require resolution or target evidence that refutes them before the affected completion claims should be restored.

---

# Instruction File Recommendations

## Coverage gaps — rules that would have prevented the findings

“Uncovered” below means **no sufficiently specific home in the supplied instruction excerpts**, not a claim that no such rule exists anywhere in the repository.

| Finding | Would have been caught by | Uncovered? |
|---|---|---|
| F-01 | `.claude/rules/upgrade-and-install.md` § **Fixing forward is not enough**; artifact-format compatibility | — |
| F-02 | `.claude/rules/engineering-practices.md` § **Guards must fail closed** and **Fail gracefully…** | — |
| F-03 | Generic guard-verification guidance applies, but no supplied instruction specifically requires inspecting all pushed history rather than the tip | **Yes—specific Git-history requirement** |
| F-04 | `.claude/rules/player-language.md` § **The test: Clear**; `.claude/rules/engineering-practices.md` § **Verify the artifact, not the report** | — |
| F-05 | `.claude/rules/player-language.md` § **The test: Clear**; `.claude/rules/engineering-practices.md` § **Guards must fail closed** | — |
| F-06 | `.claude/rules/engineering-practices.md` § **Guards must fail closed**, particularly producer-status handling and success-only classification | — |
| F-07 | The supplied secret-read filter does not govern secret-bearing process arguments. The cited credential-boundary decision supplies intent, not an instruction-file implementation rule | **Yes—argv transport** |
| F-08 | `.claude/rules/engineering-practices.md` § **Verify the artifact, not the report** and **The last known good state is a record** | — |
| F-09 | `.claude/rules/engineering-practices.md` § **Guards must fail closed** and **Verify the artifact, not the report** | — |
| F-10 | `.claude/rules/engineering-practices.md` § **Verify the artifact, not the report**; the audit method’s dependent-failure and target-evidence rules | — |
| F-11 | **Guards must fail closed** covers comparison errors; destination-ref enforcement has no specific supplied instruction home | **Partly** |
| F-12 | `.claude/rules/engineering-practices.md` § **Guards must fail closed** | — |
| F-13 | `.claude/rules/engineering-practices.md` § **Prove the guard fires**, including rejected boundary inputs | — |
| F-14 | General artifact-verification guidance applies; the exact working-directory requirement is not covered by a supplied specific rule | **Partly** |
| Unsupported runtime ticks | Target-evidence requirements in the method; `.claude/rules/upgrade-and-install.md` § **Verify on a device, not on the host** | — |

## Codification gaps — rule-of-three assessment

| Pattern | Instances | Recommendation |
|---|---|---|
| A guard’s own failure becomes success | F-02, F-06, F-08, F-09, F-11, F-12 | **Already codified.** Enforce `.claude/rules/engineering-practices.md` § **Guards must fail closed**. More generic prose would duplicate an existing rule. |
| A narrower check is presented as proof of the whole artifact | F-03, F-08, F-10; numerous unsupported ticks | **Already has a home:** **Verify the artifact, not the report**. Add regression fixtures and explicit coverage reporting rather than another broad principle. |
| Specific uncovered safeguards | Git-history scanning, secret argv, destination-ref selection | These are not three instances of one sufficiently specific uncovered pattern. **No new instruction file is justified by the supplied evidence.** |

## Recommended action sequence

1. **Correct the ES `CLAUDE.md` check command**, retaining the distribution repository as the single canonical rule home.
2. **Enforce the existing rules through failing regression cases**: legacy ZIP restoration, partial pruning failure, malformed provisioning output, failed clear, failed backend classification, and failed checker discovery.
3. **Add negative tests to both Git safeguards** using intermediate-commit secrets and destination `pr/*` refs. Document exactly what each guard covers.
4. **Reconcile the checked criteria with the evidence table above.** In particular, retain approved scope qualifications for hostname upgrades and do not equate a reachable cloud with a readable one.
5. **Re-run against the final pinned image**, then restore ticks only where the primary artifacts support the complete criterion.

These are recommendations only; no instruction files or acceptance criteria were edited in this audit.
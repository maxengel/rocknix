# E-core audit

**Recommendation: do not treat this packet as cleared for the release candidate.** The visible changes contain a new credential-redaction regression and several remaining failure paths in configuration recovery and pending-change preservation.

This is a **static review of the embedded corpus only**. I did not access a filesystem, re-hash files, build code, run tests, or inspect a guest. Reported FAIL/PASS results remain claims, not independently checked evidence.

Citations **[S1]–[S13]** identify the exact source path and Facilitator-supplied SHA-256 pairs recorded in `corpus.provenance.json` below. Application paths cited inside **[S1]** identify diff locations, not separately read files.

For first-audit findings whose implementation or tests are absent, I use **cannot tell from the packet** rather than manufacture an “answered” or adverse verdict.

## 1. Punch-item verdicts

The acceptance criteria are those in **[S6]** and **[S7]**. Where the mechanism is visible but the required test or guest proof is not, the verdict is **holds in part**.

### E1 items

| Item | Verdict | Evidence and boundary |
|---|---|---|
| **PL-024** | **Holds in part** | `AtomicFileUtil.cpp`, `@@ -126,7 +261,222 @@`: `saveUnderLock` returns `LockBusy` when acquisition fails, before reading or merging. `SystemConf.cpp`, `@@ -183,39 +232,67 @@`: failure returns precede `changedConf.clear()`. This fixes the ordinary save-after-timeout path. The required test and syntax-check artifacts are absent. Recovery writes still bypass this lock, and reload can discard retained changes: **G2-E-core-02, -06, -07**. |
| **PL-041** | **Holds in part** | `AtomicFileUtil.cpp`, acquisition hunk `@@ -148,32 +557,123 @@`, publishes a populated staging file using `link`; `removeIfStill`, `@@ -138,6 +488,65 @@`, serializes stale-lock removers using `.reap`. However, the no-hard-link fallback republishes an empty lock before writing its PID: **G2-E-core-08**. The shell implementation and contender tests are absent. |
| **PL-063** | **Holds in part** | `createTemporary`, `@@ -34,12 +36,51 @@`, uses `.tmp.<pid>.<counter>` with `O_EXCL`, stepping past existing names. Concurrent writers therefore no longer share the C++ temporary. The concurrent-writer test itself is not embedded. |
| **PL-064** | **Holds in part** | `chooseConfig`, `@@ -126,7 +261,222 @@`, selects a whole `.tmp` for an incomplete live prefix, and for a missing/unusable live file when no usable backup takes precedence. This supplies the named no-backup recovery mechanism. The boot-side handling and test are absent. An incomplete backup can still outrank the whole temporary: **G2-E-core-04**. |
| **PL-065** | **Holds in part** | `readText`, `@@ -104,20 +184,75 @@`, initializes `ok=false`, discards text after a non-`EINTR` read error, and rejects a regular-file read shorter than its opening size. This addresses a part-way failure. The injected-read test described in [S2] is not embedded. |
| **PL-068** | **Cannot tell from the packet** | `isFlockHeld` is present and fails closed on errors other than absence, but the DELETE/COPY callbacks and bookkeeper operations are not in [S1]. A probe is not itself a lock held through the operation. The required guest walk is absent. |
| **PL-069** | **Cannot tell from the packet** | The affected `ThreadedCloudSync` thread creation is absent. `CloudTransferJob`’s detached thread is a different operation and does not establish this fix. Neither the amended test nor guest measurements are embedded. |
| **PL-072** | **Holds in part** | `CloudText::actionCandidates`, `@@ -291,6 +374,143 @@`, preserves `inPlace` in every candidate when `keepInPlace` is true, ending with that clause alone. The caller that chooses this flag after a partial transfer, the test, and the 640×480 guest result are absent. |
| **PL-075** | **Holds** | `AtomicFileUtil.h`, `@@ -14,33 +16,154 @@`, explicitly limits its guarantees to POSIX/Linux and disclaims Windows atomic replacement, unique temporaries, locking, and mode preservation. This satisfies the documentation acceptance; it is not evidence of Windows runtime correctness. |
| **PL-078** | **Cannot tell from the packet** | Neither `.githooks/pre-push` nor its test appears in [S1]. The report’s hook results cannot substitute for them. |

### E2 items

| Item | Verdict | What would settle it |
|---|---|---|
| **PL-014** | **Cannot tell from the packet** | `FolderMerge`, `SystemData`’s integration, and the collection/view/index handling are absent. The 200-iteration VM soak is also absent. |
| **PL-029** | **Cannot tell from the packet** | The journey-record writer, parser, restart consumer, and continuation are absent. `CloudText::unitLabels` does not establish which tiers run. Need those hunks and the guest journal/frame. |
| **PL-030** | **Cannot tell from the packet** | `cloudSetSystemsCommand` and the script’s name validation are absent. The visible quoting in `ApiSystem::joinWifiNetwork` is unrelated to the cloud-folder acceptance. |
| **PL-054** | **Cannot tell from the packet** | `ProxyCards`’ flush-stamp/account-sentence decision and its test are absent. |
| **PL-056** | **Cannot tell from the packet** | The top-up watcher, queue, and stop/hold implementation are absent. |
| **PL-061** | **Cannot tell from the packet** | `FileData::captureGate` is absent. `CaptureRotation::recordAfterSession` records orientation; it is not the launch/capture serialization guard. |
| **PL-062** | **Cannot tell from the packet** | The gated-row press handlers and their uncached configuration checks are absent, as is the setup/FINISH walk. |
| **PL-068** | **Cannot tell from the packet** | Same boundary as E1’s PL-068: the helper is visible, the operations that must use/hold the lock are not. |

## 2. Review of the first audit’s claimed answers

### E1 findings

Claims being reviewed: **[S4]**, with explanations in **[S2]**.

| Seat / finding | Verdict | Diff-based assessment |
|---|---|---|
| **claude G-E1-01** — join inversion | **Answered in part** | `ApiSystem.cpp`, `@@ -674,12 +674,14 @@`, now returns `WifiText::JoinAnswer` and assigns code 0 only for successful execution plus `parseJoin`. This is no longer the old `bool` return. The type definition and `GuiWifi` caller are absent, so the complete withdrawal cannot be verified. |
| **claude G-E1-02** — cut live file / last-good loss | **Answered in part** | `chooseConfig` adds the incomplete-prefix/backup-time comparison, and `saveSystemConf` avoids recording one save over an incomplete base. That protection does not survive a subsequent load/save: **G2-E-core-03**. |
| **claude G-E1-03** — unreported changes / provenance | **Cannot tell from the packet** | The additional code is visible, but the cited commit bodies and their `Already written:` lines are not. Nor are all the delegation call sites. The report explains provenance; it does not prove it. |
| **claude G-E1-04** — stale stamp after clock rollback | **Answered in part** | `CloudText::stampsToRestamp`, `@@ -152,6 +153,85 @@`, compares nonempty file versions when a snapshot is supplied and excludes known ES tokens. `CloudTransferJob` now supplies a pre-command snapshot. `ThreadedCloudSync`’s snapshot acquisition and version construction are absent. |
| **claude G-E1-05** — ineffective/host-dependent thread test | **Cannot tell from the packet** | The changed test and source-inspection assertions are not embedded. |
| **claude G-E1-06** — Windows empty read | **Answered** | `readText`’s Windows branch now uses `fread`/`ferror`; an empty file reaches `ok=true` when no read error occurred. See `@@ -104,20 +184,75 @@`. |
| **claude G-E1-07** — non-CSI escape swallowing | **Answered** | `cleanLine`, `@@ -291,6 +374,143 @@`, now has separate CSI, OSC/string, two-byte, and lone-ESC handling. The specific title/two-byte escape failure is addressed by visible parsing, rather than “skip to a letter.” This is not certification of every ECMA-48 form. |
| **claude G-E1-08** — hook silence / URL matching / missing patterns | **Cannot tell from the packet** | Hook and test bodies are absent. |
| **claude G-E1-09** — queued deletion bypasses transfer lock | **Cannot tell from the packet** | The bookkeeper and manager changes are absent. The existence of `isFlockHeld` does not establish a lock held through deletion. |
| **claude G-E1-10** — tracked test binary | **Cannot tell from the packet** | Neither the index deletion nor `.gitignore` appears in [S1]. |
| **gpt G-E1-01** — reap guard exceeds deadline | **Answered** | `removeIfStill`, `@@ -138,6 +488,65 @@`, uses `LOCK_NB`, checks the acquisition deadline, and retries with a 5 ms pause instead of blocking indefinitely in `flock`. |
| **gpt G-E1-02** — guard failure restores stale-lock race | **Answered** | The same hunk returns false on guard-open failure or failed/budget-exhausted acquisition, before the reread/unlink. It does not reap unguarded. |
| **gpt G-E1-03** — reload drops retained changes | **Answered in part** | The pending-change map and comparison are present. They still lose changes after a failed reload and can compare against a stale in-memory baseline rather than the disk state: **G2-E-core-06, -07**. |
| **gpt G-E1-04** — truncated configuration bypasses last-good | **Answered in part** | The prefix/time recovery and first-save exclusion are visible, but subsequent promotion still destroys the retained record: **G2-E-core-03**. Recovery candidate selection also accepts an incomplete backup: **-04**. |
| **gpt G-E1-05** — private temporary becomes public copies | **Answered in part** | `chooseConfig` intersects modes and the recovery write receives that mode. If that write fails, the backup writer recomputes a potentially wider mode from the unrepaired live path: **G2-E-core-05**. |
| **gpt G-E1-06** — previous same-second stop restamped | **Answered** | The named prior ES stop is excluded by `r.knownToken`; snapshot users additionally require a changed, nonempty file version. The clock-only overload remains a weaker policy, so its remaining callers still need checking. |
| **gpt G-E1-07** — test cannot detect thread regression | **Cannot tell from the packet** | The amended test and CMake wiring are absent. |

### E2 findings

Claims being reviewed: **[S5]**, with explanations in **[S3]**.

| Seat / finding | Verdict | Diff-based assessment |
|---|---|---|
| **claude G-E2-01** — join signature/caller | **Answered in part** | The API now visibly returns a named answer type and documents code semantics. `WifiText::JoinAnswer`’s conversion restrictions/static assertions and the caller are not embedded. |
| **claude G-E2-02** — queued top-up starts under launch | **Cannot tell from the packet** | `ProxyCards` watcher/hold changes are absent. |
| **claude G-E2-03** — finalizers overwrite one another | **Cannot tell from the packet** | Neither `GuiSettings`’ slot nor all registrations is embedded. The withdrawal is neither established nor refuted here. |
| **claude G-E2-04** — non-repository save state dropped | **Cannot tell from the packet** | `FileData`, the state suppliers, and the allegedly unused temporary-state flag are absent. |
| **claude G-E2-05** — fresh entries indexed twice | **Cannot tell from the packet** | `populateFolder`, merge integration, and indexing callers are absent. |
| **claude G-E2-06** — capture-gate side effect | **Cannot tell from the packet** | The gate and generation changes are absent. The style guide’s preference against flashing spinners is not proof of the gate’s behavior. |
| **claude G-E2-07** — footer/rule mismatch | **Answered in part** | The current embedded player-text rule explicitly places retry/close on the page’s help bar [S10, “Recover”], supporting the withdrawal’s policy basis. The actual page input/help-bar implementation is absent. |
| **claude G-E2-08** — vocabulary/localization | **Answered in part** | `CloudText::unitLabels`, `@@ -748,6 +971,110 @@`, pairs composed labels with translations, and two new French msgids are appended. The Wi-Fi page change is absent. The current rule already uses `YOU STARTED A GAME` for the card [S10]. |
| **claude G-E2-09** — environment-bound/stand-in tests | **Cannot tell from the packet** | None of the corrected test bodies is embedded. The report’s disclosure that some “before” runs used stand-ins is useful but cannot establish test fidelity. |
| **gpt G-E2-01** — failed journey replacement replays old selection | **Cannot tell from the packet** | Record replacement and restore-start gating are absent. |
| **gpt G-E2-02** — incomplete journey record consumes work | **Cannot tell from the packet** | Parser and marker consumption are absent. |
| **gpt G-E2-03** — capture timeout permits overlap | **Cannot tell from the packet** | `captureGate` and its timeout behavior are absent. |
| **gpt G-E2-04** — stop starts queued top-up | **Cannot tell from the packet** | Same missing implementation as claude G-E2-02. |
| **gpt G-E2-05** — late stop publishes stopped state after completion | **Answered** | Both stop methods check and mark under `job->mMutex`, `@@ -76,32 +76,91 @@`. Completion holds that mutex and clears stop flags for return 0/9, `@@ -610,6 +677,17 @@`. The stated check/mark race is closed. |
| **gpt G-E2-06** — inherited bad rotation records | **Answered in part** | The trusted marker changes to `from=checked-launch`; the rewrite predicate distinguishes records through `recordFromOwnLaunch`. The full reader/fallback, successful-launch call-site gate, and VM fixture are absent, so end-to-end repair of inherited records cannot be certified. |

## 3. New findings

These are static counterexamples, not claimed test executions.

### G2-E-core-01: Escaped quotes inside a quoted command leak a password suffix

- **Severity:** High
- **Category:** Regression introduced by the redaction fix
- **Where:** `es-core/src/utils/StringUtil.cpp`, `maskValueEnd`, **[S1]**, `@@ -518,38 +520,124 @@`.
- **What:** In the new enclosing-quote branch, an active inner quote is processed before backslash escaping. An escaped inner double quote therefore closes `inner`, and the following space ends the redacted range.
- **Failure scenario:** Consider this shell command, with synthetic credential fragments:

  ```sh
  sh -c 'tool --password "front\" back"'
  ```

  The inner shell receives one password argument containing `front" back`. In the new scanner:
  1. The enclosing quote is `'`.
  2. The password’s opening `"` sets `inner`.
  3. The backslash is processed as an ordinary character by the `inner != 0` branch.
  4. The escaped `"` incorrectly clears `inner`.
  5. The following space ends the value range, leaving `back` outside redaction.

- **Evidence:** The new branch is:

  ```cpp
  if (inner != 0)
  {
      if (c == inner)
          inner = 0;
      ++i;
      continue;
  }
  ```

  The enclosing-single-quote backslash handling appears **after** this branch, so it cannot handle escapes while `inner` is active. The removed implementation explicitly skipped a backslash-escaped character inside a double-quoted value:

  ```cpp
  if (quote == '"' && s[i] == '\\')
  {
      ++i;
      continue;
  }
  ```

  That old branch would not have mistaken this escaped quote for the password’s end. I looked for corresponding escape handling in the new inner-quote branch; it is absent. This needs a regression case using the shipped `maskSecrets`, not only simple nested quotes.

### G2-E-core-02: Configuration recovery writes outside the settings lock

- **Severity:** Medium
- **Category:** Concurrency / overwrite without serialized precondition
- **Where:** `es-core/src/SystemConf.cpp`, `loadSystemConf` and `loadFromDisk`, **[S1]**, `@@ -113,66 +83,145 @@`; compare `saveSystemConf`, `@@ -183,39 +232,67 @@`.
- **What:** Normal saves now hold the shared settings lock across read-modify-write. Recovery still selects a source and overwrites the live configuration without acquiring that lock or rechecking the live file.
- **Failure scenario:**
  1. The live file is damaged; a usable backup exists.
  2. ES selects the backup in `chooseConfig`.
  3. A cooperating settings writer acquires `/tmp/.system.cfg.lock`, commits a new key/value to the live file, and releases the lock.
  4. ES resumes and writes its previously selected backup over that newer configuration.

  The other writer obeyed the lock; its update is nevertheless lost.
- **Evidence:** Both recovery cases call `Utils::AtomicFile::writeText(mSystemConfFile, chosen.text, mode)` directly. The complete visible `loadSystemConf`/`loadFromDisk` path contains no settings-lock acquisition or live-version recheck. In contrast, the save path delegates to `saveUnderLock`.

  I looked for serialization around the recovery’s read-and-replace sequence; none is shown. This is an ES-side gap even if the shell’s locking implementation is correct. A useful regression test holds the settings lock while initiating recovery and then commits another writer’s update before ES can replace the file.

### G2-E-core-03: A damaged base can still replace the last-known-good record

- **Severity:** Medium
- **Category:** Incomplete fix / last-known-good preservation
- **Where:** **[S1]**:
  - `AtomicFileUtil.cpp::saveUnderLock`, `@@ -126,7 +261,222 @@`;
  - `SystemConf.cpp::saveSystemConf`, `@@ -183,39 +232,67 @@`;
  - `SystemConf.cpp::applyChanges`, `@@ -278,27 +355,7 @@`;
  - `AtomicFileUtil.cpp::chooseConfig`, same `+261` hunk.
- **What:** The fix excludes only the **first** save over an unterminated base. That save normalizes the output into newline-terminated text. A subsequent save or load then promotes it to last-known-good, losing the whole record that the first save deliberately preserved. An empty base is considered complete immediately.
- **Failure scenario:**
  1. A whole backup contains `alpha=1` and `beta=2`.
  2. After ES has loaded it, the live file is cut to `alpha=1\nbe`.
  3. The player changes an unrelated setting. The save correctly sets `baseWhole=false` and preserves the backup.
  4. `applyChanges` writes the surviving lines and the changed setting with line endings.
  5. Another save sees a newline-terminated base, sets `baseWhole=true`, and records it over the backup. `beta` is now absent from both live and last-good files.

  Alternatively, an empty live file goes straight through the “complete base” branch and can replace a whole backup with only the dirty settings.
- **Evidence:**

  ```cpp
  *baseComplete = current.empty() || current.back() == '\n';
  ```

  ```cpp
  out += fileLines[i] + "\n";
  ```

  ```cpp
  if (baseWhole)
      recordLastGood(out);
  ```

  `chooseConfig` likewise sets `out.record = isComplete(live)` for a usable live file. There is no persistent indication that this newly terminated text descended from a damaged base, and no recovery/merge from the retained whole record in `saveUnderLock`.

  I looked for a mechanism that preserves the exclusion across the next operation; none is present. A one-save test misses this. The required artifact-preservation principle is explicit in [S8, “last known good state”] and [S9, “Fixing forward is not enough”].

### G2-E-core-04: An incomplete backup outranks a whole recovery temporary

- **Severity:** Medium
- **Category:** Upgrade recovery / candidate validation
- **Where:** `es-core/src/utils/AtomicFileUtil.cpp`, `chooseConfig`, **[S1]**, `@@ -126,7 +261,222 @@`.
- **What:** The function computes `backupWhole`, but the fallback that selects a backup requires only `isUsableKeyValues(backup)`. That branch precedes selection of a whole `.tmp`.
- **Failure scenario:** At first load:
  - the live configuration is missing;
  - `.tmp` contains a complete configuration;
  - `.backup` is an inherited fragment such as `a=1\nb=`, with no final newline.

  `liveCut` is false because `liveOk` is false. The incomplete backup passes the one-assignment usability test, is selected, and is written back instead of the complete temporary. The loaded configuration lacks the complete temporary’s settings.
- **Evidence:**

  ```cpp
  const bool backupWhole =
      backupOk && isUsableKeyValues(backup) && isComplete(backup);
  ```

  But selection later uses:

  ```cpp
  if (backupOk && isUsableKeyValues(backup))
  {
      out.source = LoadedConfig::Source::Backup;
      out.text = backup;
      return out;
  }
  if (tmpWhole)
  {
      ...
  }
  ```

  `isUsableKeyValues` does not require completeness. I looked for a later completeness check in the `Source::Backup` load path; it writes `chosen.text` directly. The report itself identifies fragmentary records as inherited state [S2, PL-065], so this is not merely an invented new file format.

### G2-E-core-05: Failed private recovery can create a world-readable backup

- **Severity:** Medium
- **Category:** Confidentiality / recovery failure path
- **Where:** `es-core/src/SystemConf.cpp`, `recordLastGood` and `Source::Temporary`, **[S1]**, `@@ -113,66 +83,145 @@`.
- **What:** Recovery obtains a restrictive `chosen.mode`, but does not pass it to the backup writer. If restoring the live file fails, `recordLastGood` instead derives the mode from the unrepaired live path, or defaults to `0644`.
- **Failure scenario:** In a writable, traversable parent directory:
  - `system.cfg` is a directory, so it is not a readable regular configuration and cannot be replaced by the temporary file rename;
  - `system.cfg.tmp` is a whole configuration with mode `0600`;
  - no backup exists.

  `chooseConfig` selects the private temporary with mode `0600`. The live write fails. The code then creates `system.cfg.backup` with fallback mode `0644`, exposing a copy that was previously restricted to `0600`.
- **Evidence:**

  ```cpp
  if (!Utils::AtomicFile::writeText(mSystemConfFile, chosen.text, mode))
      LOG(LogError) << ...;
  recordLastGood(chosen.text);
  ```

  The latter function independently chooses:

  ```cpp
  const int mode = Utils::AtomicFile::modeOf(mSystemConfFile, 0644);
  ...
  Utils::AtomicFile::writeText(backup, text, mode)
  ```

  I looked for an early return on failed live restoration, or propagation of `chosen.mode` into `recordLastGood`; neither is present. This leaves the first audit’s private-temporary fix incomplete precisely on a failure path.

### G2-E-core-06: A failed reload is treated as evidence that pending keys were removed

- **Severity:** Medium
- **Category:** Pending-state loss / failure interpreted as absence
- **Where:** `es-core/src/SystemConf.cpp::loadSystemConf`, **[S1]**, `@@ -113,66 +83,145 @@`; `AtomicFileUtil.cpp::pendingAfterReload`, `@@ -126,7 +261,222 @@`.
- **What:** Pending state is cleared before loading. Even when `loadFromDisk` returns false, the code reconciles pending changes against the now-empty `mOnDisk` and drops changes whose base key existed.
- **Failure scenario:**
  1. A setting with an existing base value has an unsaved change, retained after lock refusal.
  2. `loadSystemConf(true)` runs while the live file and recovery copies cannot be read.
  3. `loadFromDisk` returns false and `mOnDisk` remains empty.
  4. `pendingAfterReload` interprets that empty map as key removal and drops the change.
  5. The function returns false only after the retained change and its dirty mark have been lost.
- **Evidence:**

  ```cpp
  changedConf.clear();
  mPendingBase.clear();
  mOnDisk.clear();
  const bool loaded = loadFromDisk();

  const auto kept =
      Utils::AtomicFile::pendingAfterReload(pending, mOnDisk);
  ```

  The helper discards a change when:

  ```cpp
  if (hasNow != change.second.hadBase)
      continue;
  ```

  The caller also erases dropped unsaved keys absent from `mOnDisk`, then returns `loaded`. There is no `!loaded` branch retaining the prior pending state. A caller checking the false return cannot recover data already discarded.

### G2-E-core-07: Pending changes use the overlay map as their disk baseline

- **Severity:** Medium
- **Category:** Pending-state reconciliation / false conflict
- **Where:** `es-core/src/SystemConf.cpp`, **[S1]**:
  - `parseSystemConf`, `@@ -68,43 +68,13 @@`;
  - reload reconciliation, `@@ -113,66 +83,145 @@`;
  - `set`, `@@ -324,6 +381,13 @@`.
- **What:** `mPendingBase` is captured from `confMap`, although this map deliberately retains keys absent from the latest file. The later comparison is against `mOnDisk`, which contains only actual parsed disk keys. The two sides therefore do not represent the same baseline.
- **Failure scenario:**
  1. Load `tone=old\nkeep=1\n`.
  2. Another writer removes `tone`; reload `keep=1\n` successfully with no pending changes. `confMap` still retains `tone=old`.
  3. The player sets `tone=new`; a save is refused for the lock.
  4. Reload the unchanged `keep=1\n` with `keepPending=true`.
  5. The new change is dropped as an external removal, although the file has not changed since the player made it.
- **Evidence:** Parsing only overlays present keys:

  ```cpp
  mOnDisk = Utils::AtomicFile::parseKeyValues(text);
  for (const auto& kv : mOnDisk)
      confMap[kv.first] = kv.second;
  ```

  Reload erases absent keys only from the prior `unsaved` set, so step 2 leaves this clean stale key in memory. `set` then records the baseline using:

  ```cpp
  const auto it = confMap.find(name);
  mPendingBase[name] = ...
  ```

  `pendingAfterReload` compares that asserted presence against actual disk absence and rejects the change. I looked for capture of the baseline from the serialized/disk state, or removal of all obsolete clean overlay keys; neither is shown. The header even acknowledges that `confMap` carries keys the file no longer has.

### G2-E-core-08: The no-hard-link lock fallback recreates the empty-lock race

- **Severity:** Low
- **Category:** Conditional concurrency regression / fail-open fallback
- **Where:** `es-core/src/utils/AtomicFileUtil.cpp`, **[S1]**, `PidLock::acquire`, `@@ -148,32 +557,123 @@`, and stale handling at `@@ -184,10 +684,11 @@`.
- **What:** When hard linking is unavailable, acquisition falls back to creating the public lock file empty and writing its PID afterward—the publication sequence PL-041 was intended to remove.
- **Failure scenario:** On a filesystem or execution policy that makes `link` return one of the handled unsupported errors:
  1. Contender A creates the public lock with `O_EXCL` and is descheduled before its PID write.
  2. B sees an empty lock, waits 20 ms, then rereads/removes it under `.reap`.
  3. B acquires a replacement lock and continues holding it.
  4. A resumes, successfully writes to its now-unlinked file descriptor, and returns with `mHeld=true`.

  Both callers now believe they hold the lock.
- **Evidence:** The fallback opens `mPath` directly and only then calls `write`. A checked write proves the descriptor was written, not that `mPath` still names that inode. The `.reap` guard is taken by removers, not by this publishing fallback. There is no post-write ownership/identity validation.

  **The normal populated-hard-link path is not affected.** This is a conditional defect in the explicitly supported fallback; a 20 ms grace period cannot make it race-free.

## 4. Sweep-row spot checks

These check the reported fixes against visible implementation, not the reported suite totals. Claims are from **[S2]** and **[S3]**.

| Reported fixed row | Spot-check result |
|---|---|
| **5-cloud / claude F-CS-19** — UTF-8 on script lines | The helper preserves bytes `>= 0x80`; `CloudTransferJob::cleanLine` delegates to it. The card’s call site is absent. **Mechanism supported; card integration unverified.** |
| **5-cloud / gpt F-CS-27** — malformed status becomes success | `wholeNumber` validates syntax and range; `parseLastRun` rejects malformed fields; tier status becomes `-1` on invalid input. **Supported by visible code.** |
| **5-cloud / gpt F-CS-31** — translated script whys | `whySentences` contains literal/translated pairs and `localizedWhy` selects them. French additions are visible. All display consumers and script emitters are not. **Supported in part.** |
| **5-cloud / gpt F-CS-33** — core option replacement | `CommandLineUtil.h` scans quote-aware words and only recognizes an option at a word start, avoiding a quoted ROM-path substring. `SaveState`’s adoption is absent. **Supported in part.** |
| **8b / gpt F-ES-07** — lock budget | Nonregular lock paths fail immediately; unreadable/stale paths check expiry; reap acquisition is nonblocking and deadline-bound. **Supported for the named waiting defect.** |
| **8b / gpt F-ES-08** — private file modes | Ordinary replacement preserves mode; ordinary record writes pass the live file’s mode. Recovery failure still widens a private copy: **G2-E-core-05**. **Supported in part.** |
| **8b / gpt F-ES-09** — whole-value masking | Top-level concatenated/escaped pieces are handled, but nested escaped quotes regress: **G2-E-core-01**. **Not fully fixed.** |
| **8b / gpt F-ES-11** — tab columns | `Font` measures pieces between tabs; `TabStops::fromColumns` accumulates each column’s maximum width plus prior gaps. **The named multi-tab mechanism is supported.** Rendering tests are absent. |
| **8-es / claude F-ES-08; 8a / gpt F-ES-08** — rotation records | Log-age rejection, launch-banner check, zero override, and new trust marker are visible. The launch-success caller gate is absent. **Supported in part.** |
| **5-cloud / claude F-CS-26; gpt F-CS-24** — early/late stop | A stop request is retained until the PID arrives; stop check/mark and completion use the job mutex. **Supported by visible code**, without independently verified scheduling tests. |
| **1-raoffline / claude F-RA-19** — page-close sign-in | `CheevosRetry::saveSignIn` sends unchanged/no-token state to `InBackground`, and changed/offline state to `Offline`. The settings-page and watcher integration are absent. **Supported in part.** |
| **8-es / claude F-ES-26** — worker posts after teardown | `AppWindow::post` holds its gate through posting, and `CloudOffer` adopts it. `main()`’s closing order and remaining direct component calls are absent. **Supported in part.** |

### Withdrawals that can be judged

- **E1 claude F-ES-24, toast waiting behind a card:** the stated design premise holds. [S11, “One floating surface at a time”] explicitly queues the toast rather than displaying it over a card. `Window`’s implementation is not embedded.
- **E2 gpt F-RA-25, send/top-up cards in the same batch:** the stated design premise holds. [S11, “The cards at the link’s return”] expressly describes the send card with the top-up card stacked underneath.
- **E2 claude F-ES-17 / gpt F-ES-20, visible SSH password:** cannot validate the cited D-INFRA-010 exception. That decision is not embedded, while [S13] states the general masking rule. This needs the actual exception, not a verdict inferred from the report.
- Withdrawals about existing French strings, fixed card width, BIOS glyph bytes, and absence of other callers/readers require files or unchanged sections not present here. I cannot validate the reported searches.

The pure-helper extractions are consistent with [S12, “Pure text has a home, and a test”]. The missing test bodies prevent checking whether those tests actually exercise the shipped implementation and fail for the relevant defect.

## 5. Cross-stream seams

| Seam | Assumptions and assessment |
|---|---|
| **ES ↔ shell settings lock** | Both sides must honor the same PID-lock name and `.reap` flock, and must not publish an empty lock that another side can reap. The C++ normal save/reaper mechanisms are visible; the shell side is not. Recovery bypasses the shared lock regardless of shell correctness (**-02**); the C++ fallback publication is unsafe (**-08**). |
| **C++ temporaries ↔ `set_setting` ↔ boot recovery** | C++ now uses unique temporaries, while the code identifies `.tmp` as the shell/legacy name. ES deliberately stops deleting that name at load. Whether boot recovery preserves and consumes the right legacy artifact cannot be established without the boot-script changes. Candidate validation remains incomplete (**-04**). |
| **Save-state operations ↔ cloud transfer lock** | `isFlockHeld` supplies a fail-closed probe. DELETE must hold the lock through retire/unlink, and COPY needs scrutiny at its actual file-copy operation—not merely a nearby probe or a later manifest update. The report’s deletion-lock fix does not, by itself, prove COPY is serialized. Route this to the application packet. |
| **Cloud traps/stamps ↔ ES restamping** | ES assumes an interrupted script writes code 130 without an ES outcome token, and that a new stamp replaces the old file with a distinguishable version. The selector and `CloudTransferJob` snapshot call are visible. The scripts and `ThreadedCloudSync::readStamps`/restamp implementation are absent. Inode/version generation, error handling, and all remaining clock-only callers need verification. |
| **`wifictl` ↔ API ↔ picker** | The API assumes code 2 means service unavailable, and exit 0 still requires a parsed “joined” answer. The mapping is visible. The output parser, answer type’s conversion restrictions, profile-versus-SSID handling, and picker consumer are not. |
| **Launcher/log ↔ rotation reader** | The reader assumes a timestamp not older than `started` plus a build banner identifies usable session evidence; the caller must supply the actual launch start and gate failed launches. The new checked marker must be used by both reader/writer and VM seeds. Only part of that chain is embedded. Whole-second timestamp equality also remains an explicitly accepted ambiguity. |
| **Workers ↔ window lifetime** | `AppWindow` correctly gates new posts through its own API. It does not, by itself, protect direct calls on window-owned notification components or establish teardown ordering. [S3] explicitly hands off a lingering-card/direct-call concern; the relevant code is absent, so this remains an unverified handoff rather than a new source-proven finding here. |
| **Script/composer words ↔ English/French UI** | Known why sentences and composed unit labels are paired with localization calls; unknown whys fall back to their received text. Agreement requires checking actual emitters and consumers against those tables. The embedded rule now supports the match count-only note and match-specific retry route [S10], but scripts, page behavior, and rendered fit are not established here. |
| **Shared harness ↔ production code** | No test bodies, extraction scripts, doubles, or build wiring are embedded. The reports distinguish some faithful extractions and stand-ins, but that cannot prove their fidelity. In particular, PL-069’s original task-count acceptance is not a sufficient measurement of unjoined-thread resource retention; the reported replacement evidence needs inspection. |

## 6. Coverage boundary and orchestrator handoff

Not established by this packet:

- Full base/tip source beyond the displayed hunks.
- Unit tests, app-unit tests, hooks, test wiring, or raw execution artifacts.
- The application-side implementations listed as absent in the verdict tables.
- Shell-side lock publication/reaping, boot recovery, `wifictl`, cloud trap/stamp writers, and protocol emitters.
- `ThreadedCloudSync`’s file-version construction, snapshot/restamp implementation, and notification-component lifetime.
- VM acceptance walks, rescan soak, lock contention on the guest, upgrade rehearsal, translation/rendering fit, or actual package-pin/build integration.
- The manifest JSON itself: only its source headers were embedded.
- **`packaging-and-patches.md` and `rclone-cloud-sync.md`**, named in the brief but not embedded. I have not assigned them paths, hashes, or inferred contents.
- The cited SSH-password exception and rotation decision-register refinement.

**Handoff:** the eight numbered findings above need source-owner review and constructed regression cases. The missing application/shell/test evidence needs reconciliation with the other packets before changing any “cannot tell” verdict to a release sign-off. No fixes or test runs were performed in this review.

## `corpus.provenance.json`

The arrays below are parallel: `source_ids[i]`, `source_file_paths[i]`, and `source_file_hashes[i]` identify the same embedded source.

```json
{
  "packet": "E-core",
  "declared_review_range": "7eae8ed91..87b182fbe",
  "review_mode": "Static review of the embedded read-at-time corpus",
  "filesystem_access": false,
  "files_independently_reread": false,
  "hashes_independently_recomputed": false,
  "tests_executed": false,
  "hash_algorithm": "sha256",
  "hash_provenance": "Council Facilitator values, verified at embed time; not independently recomputed by this reviewer",
  "manifest_read_timestamp_utc": "2026-09-28T13:57:25Z",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
    "S11",
    "S12",
    "S13"
  ],
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E-core.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E1.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E2.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E1.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E2.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E1.items.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E2.items.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/es-native-ui.md",
    ".claude/rules/es-code-traps.md",
    ".claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "d81bcc896f30c5e6fbf7a9d587888850eb2d9fc9ba44bece4158595618648f7d",
    "654dff75600876daeb9162948bb36ffdb504913066e0b0cadda82a5a174b082e",
    "4e80f3ecb71487e7f11f655935eb878969d2063e25d54b10fbd7be6e55b989d9",
    "6a72853bb704067abb739809c34125484a5aa41f492c6821b3083103701ebaf7",
    "4cfcc1ade60afa464ab1055ee53e3b7200b856d0a2bd505dd9f5891da2bd73fd",
    "1717b7d820a008285ec26be8fd534469d85dd8fec231e84bff480a2480f37599",
    "4c1462730ae807beb9ef0beb893677591d6eb414f6aea6cc2f8600ec94a2e675",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "48cd5ac727b6d05d0e5acf5a17e7591d96a56e574d27f48a5c0210c5499afcb7",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "evidence_limits": [
    "Code conclusions use displayed diff hunks, not independently read full base or tip files.",
    "Stream reports and findings-table outcome columns are claims, not independently verified test evidence.",
    "No test bodies, harness wiring, raw test logs, guest journals, frames, or build artifacts were embedded.",
    "No commit bodies were embedded to verify the claimed Already written lines."
  ],
  "missing_sources_and_gaps": [
    "The manifest JSON itself was not embedded.",
    "Application consumers and integrations outside the E-core diff require the application packet or additional source.",
    "The shell settings-lock implementation, boot recovery, wifictl, cloud scripts, and protocol emitters were not embedded.",
    "ThreadedCloudSync snapshot/version/restamp implementation and direct notification-component lifetime code were not embedded.",
    "packaging-and-patches.md and rclone-cloud-sync.md were named in the brief but not embedded; no paths or hashes have been assigned to them.",
    "Decision-register evidence for the cited SSH-password exception and rotation refinement was not embedded.",
    "Runtime and upgrade acceptance evidence must be supplied by the orchestrator."
  ],
  "gap_disposition": "Surfaced in the audit's verdict tables, seam review, and coverage boundary for orchestrator follow-up"
}
```
# Council seat E-core — audit of the fix round, packet `E-core` (ES fork `7eae8ed91..87b182fbe`, core half)

**Corpus read:** the 13 embedded sources (the diff, E1/E2 reports, findings, items, seven rule files). **Not embedded, and named by the brief/manifest:** `packaging-and-patches.md`, `rclone-cloud-sync.md`. Nothing below relies on them; where the cloud scripts' side of a seam matters I say "outside the packet".

**One boundary that shapes everything below:** the packet's diff carries no test source. Neither `es-app/tests/unit/**` nor `tests/app-unit/**` nor `tests/*.py` is in `E-core.diff`. Every FAIL-then-PASS line in both reports is therefore a claim I could not check against a case; my verdicts are on the *mechanism the diff shows*, and I say so per item.

Hunk references are to `seats/E-core.diff` (sha256 `d81bcc89…`), by file and `@@` header; the diff has no absolute line numbers I could cite honestly.

---

## 1. Punch items

### E1 items (`E1.items.md`)

**PL-024** (High) — *a save after a lock timeout keeps the other writer's key.* **Holds** by mechanism. `AtomicFileUtil.cpp @@ -126,7 +261,222 @@`, `saveUnderLock`: `PidLock lock(lockPath); if (!lock.acquire(timeoutMs)) return LockedSave::LockBusy;` — nothing read, nothing written. `SystemConf.cpp @@ -183,39 +232,67 @@`: on `LockBusy` the function logs "nothing written -- the changes are kept for the next save" and returns before `changedConf.clear()`. When the lock frees, the next save merges `changedConf` onto the file re-read under the lock (`applyChanges(current)`), so a key the other writer changed survives. The unit test (`AtomicFileTests.cpp:435/:442`) is not in the packet. Note the 5 s interface-thread wait is unchanged by design.

**PL-041** (Medium) — *two waiters cannot remove each other's stale lock; the pid write's result is checked.* **Holds in part.** ES side present: `AtomicFileUtil.cpp @@ -148,32 +557,123 @@` creates a staging file with the pid, checks the write (`written` and `close()`), then `::link(staging, mPath)` so the lock is never empty; `@@ -138,6 +488,65 @@` `removeIfStill` re-reads and unlinks under an `flock` on `<lock>.reap`, non-blocking to the deadline, fail-closed. What the acceptance also names — `tools/wait-lock-test` and the shell's `wait_lock` taking the same `.reap` guard — is stream B's and outside the packet; until the shell side does, a shell reaper and this reaper can still meet (E1 says so, "For you" 2).

**PL-063** (Medium) — *two concurrent writers leave a whole file.* **Holds** by mechanism. `@@ -34,12 +36,51 @@` `createTemporary`: `path.tmp.<pid>.<n>` opened `O_CREAT | O_EXCL`, up to 100 attempts on `EEXIST`; `writeText` no longer names `path.tmp` on POSIX. Test not in packet. Residual: a process killed mid-write leaves `path.tmp.<pid>.<n>` litter nothing sweeps (E1 named it).

**PL-064** (Medium) — *startup does not delete the temporary; a cut live file beside a whole `.tmp` and no backup loads the `.tmp`.* **Holds in part.** `SystemConf.cpp @@ -113,66 +83,145 @@` removes only `.backup.tmp`; `chooseConfig` (`@@ -126,7 +261,222 @@`) returns `Temporary` on `liveCut`, and on `tmpWhole` when live and backup are unusable. Two gaps: (a) `liveCut` requires `!isComplete(live)` — a copy cut exactly on a line boundary is loaded as `Live` and *recorded* (`out.record = isComplete(live)`), although the stronger evidence (live is a strict prefix of a whole `.tmp`) is computed and could decide it — see G2-E-core-03; (b) on a real boot `chksysconfig` still deletes `system.cfg.tmp` before ES (E1's own "For you" 1), so the device path is unproven until B changes it. "Usable means one assignment" is unchanged for the *load*; only the *record* now requires completeness.

**PL-065** (Medium) — *`readText` ok only after the read.* **Holds** by mechanism. `@@ -104,20 +184,75 @@`: `*ok = false` first; a failing `read()` returns `""`; for a regular file `text.size() < st_size` returns `""`; `*ok = true` only at the end. The part-way `read()` fixture (44d174436) is a claim.

**PL-068** (Medium) — *DELETE and COPY refused while `cloud_backup` holds the transfer lock.* **Cannot tell from the packet.** Only the helper is here: `isFlockHeld` (`@@ -126,7 +261,222 @@`): `LOCK_EX | LOCK_NB` probe, `ENOENT` = not held, any other open/flock failure = held (fails closed). Its callers (`GuiSaveState`, `SaveStateBookkeeper`) and the VM walk are outside.

**PL-069** (Medium) — *no thread leak per sync.* **Cannot tell** — `ThreadedCloudSync` is not in this packet. (`CloudTransferJob::start` here already detaches; unchanged in substance.)

**PL-072** (Medium) — *a sync that moved files then lost the link keeps the in-place clause.* **Holds in part.** The rule is here: `CloudText.cpp @@ -291,6 +374,143 @@` `actionCandidates(inPlace, recoveries, keepInPlace)` — with `keepInPlace` every candidate carries the in-place clause and the clause alone is last. Who passes `keepInPlace=true` (the 69-after-bytes case in `ThreadedCloudSync`) is outside the packet, as is the 640x480 frame.

**PL-075** (Low) — *the header's contract matches the `_WIN32` branch.* **Holds** for the header: `AtomicFileUtil.h @@ -14,33 +16,154 @@` states the guarantees are POSIX's and lists the Windows deviations. The `_WIN32` `writeText` body is only partly in the diff (`tmp = path + ".tmp"`), so "removes `path` before it renames" is read from the header, not the branch.

**PL-078** (Low) — the pre-push hook. **Cannot tell** — `.githooks/` is not in the packet.

### E2 items (`E2.items.md`)

**PL-014, PL-029, PL-030, PL-054, PL-056, PL-061, PL-062** — all live in `SystemData`, `GuiMenu`, `main`, `JourneyTiers`, `ProxyCards`, `FileData`: **cannot tell from this packet** (the application half). What this packet does carry for them: the French for PL-061's `RECORDING YOUR LAST GAME'S SAVES...` and the refusal sentence, and for gpt G-E2-01's `COULDN'T SAVE WHAT YOU TICKED...` (`.po @@ -6286,3 +6286,174 @@`).

**PL-068** (E2's half) — **cannot tell**; the bookkeeper is outside. The shared check it now asks (`isFlockHeld`) is in this packet and is sound as far as it goes (above).

---

## 2. The first audit's findings, read against the follow-up hunks

### `E1.findings.md`, claude seat

- **G-E1-01** (Critical, join inverted) — **withdrawal holds as far as the diff shows.** `ApiSystem.cpp @@ -674,12 +674,14 @@` returns `WifiText::JoinAnswer` with `code` = the script's non-zero exit, else `parseJoin ? 0 : 1`; there is no `bool` left to invert. The one caller (`GuiWifi::join`) and `JoinAnswer`'s definition (`WifiText.h`) are outside the packet, so "cannot read as a truth value" is E2's claim, not something I saw.
- **G-E1-02** (cut live wins over a whole `.backup`) — **answered.** `chooseConfig`: `cutOfRecord` (live incomplete, strict prefix of a whole record, `ls.st_mtime <= bs.st_mtime + 1`) excludes the live file; `saveUnderLock` reports `*baseComplete`; `SystemConf::saveSystemConf` records only `if (baseWhole)`. Two edges remain: G2-E-core-03 (a cut on a line boundary) and G2-E-core-05 (the cut prefix line is laundered one save later).
- **G-E1-03** (provenance of extra changes) — **cannot judge the withdrawal from the packet** (commit messages are not here). The moved tables are visible (`CloudText::scanWhy/topUpWhy @@ -748,6 +971,110 @@`); whether `OfflineAchievements`/`ProxyCards` delegate is outside. The substantive half is G-E1-04, answered.
- **G-E1-04** (stale stop stamp by the clock) — **answered** for the rule: `stampsToRestamp(stamps, runStarted, before)` (`@@ -152,6 +153,85 @@`) restamps only a 130/no-token stamp whose `version` differs from the snapshot's. The snapshot's meaning ("inode and change time", `ThreadedCloudSync::readStamps`) is outside the packet; see G2-E-core-08 for the no-snapshot path.
- **G-E1-05** (PL-069 test cannot fail) — **cannot tell**; tests not in packet.
- **G-E1-06** (`_WIN32` readText, empty file) — **answered.** `@@ -104,20 +184,75 @@`: `fopen/fread/ferror`; `*ok = true` unless `ferror`.
- **G-E1-07** (cleanLine swallows text) — **answered.** `@@ -291,6 +374,143 @@` `cleanLine`: CSI to a final byte 0x40–0x7E, OSC/DCS/PM/APC to BEL or ESC-`\`, two-byte escape, lone ESC. I looked for a residual and found only a cosmetic one: a CSI's parameter loop accepts bytes ≥0x80, so a *malformed* `ESC [` immediately followed by UTF-8 text eats that text to the next ASCII letter; rclone's CSIs are well-formed and an 80-column cut ends the line, so I do not rate it.
- **G-E1-08, G-E1-10** (hooks, `.gitignore`) — **cannot tell**; outside.
- **G-E1-09** (PL-068 gated at the button) — **cannot tell**; `isFlockHeld` is here, its callers are not.

### `E1.findings.md`, gpt seat

- **G-E1-01** (reap flock blocks past the budget) — **answered.** `removeIfStill` (`@@ -138,6 +488,65 @@`): `flock(gfd, LOCK_EX | LOCK_NB)` in a loop, 5 ms sleeps, returns false at `deadline`; `acquire` passes `started + timeoutMs`.
- **G-E1-02** (guard failure reinstates the race) — **answered.** Every failure to take the guard returns `false` before the re-read; the caller sleeps 50 ms and lets `expired()` end it (`@@ -202,22 +703,27 @@`). The shell half is B's.
- **G-E1-03** (reload discards retained changes) — **answered** by mechanism. `SystemConf::loadSystemConf(bool keepPending)` (`@@ -113,66 +83,145 @@`) snapshots `changedConf` with `mPendingBase`, reloads, keeps `pendingAfterReload(pending, mOnDisk)`, and erases from `confMap` a dropped change whose key the file lacks. That `GuiWifi` passes `true` is outside the packet. Edge in G2-E-core-09.
- **G-E1-04** — as claude G-E1-02, answered.
- **G-E1-05** (recovery from a private `.tmp` makes 0644 copies) — **answered in part.** `chooseConfig` ANDs the modes of live/`.tmp`/`.backup` into `out.mode`; `loadFromDisk` writes the live file back with it, and the `Temporary` path then calls `recordLastGood`, which copies the live mode. The `Backup` path does *not* rewrite the record, so a 0644 record beside a now-0600 live file stays 0644 until the next save (G2-E-core-04).
- **G-E1-06** (same-second stop stamp) — **answered** on the snapshot path (`knownToken` excluded; identity, not time). The fallback path still uses `r.when >= runStarted` (G2-E-core-08).
- **G-E1-07** — cannot tell (test).
- **PL-065 "holds in part" fixture** — cannot tell (test).
- **Coverage 6** (`sh -c 'tool --password "front back"'`) — **answered for the double-quoted inner form** (`StringUtil.cpp @@ -518,38 +520,124 @@`, the `enclosing != 0` branch tracks `inner`). The single-quoted inner form that `shellQuote` itself produces is not handled — **G2-E-core-01**.

### `E2.findings.md`, the rows this packet reaches

- **claude G-E2-01** (`joinWifiNetwork` signature) — **answered in part (the visible half).** `ApiSystem.h @@ -271,11 +271,15 @@` is rewritten and the return is `WifiText::JoinAnswer`; the struct, its `static_assert`s and the caller are outside. One thing the new header does not say: `timeout 120` yields 124 (G2-E-core-10).
- **claude G-E2-08 (c)** (tier labels raw English) — **answered.** `CloudText::unitLabels/unitLabel` (`@@ -748,6 +971,110 @@`); French for the two new msgids is in the `.po`. (a)/(b) are outside.
- **gpt G-E2-05** (a late stop publishes stopped state) — **answered.** `CloudTransferJob.cpp @@ -76,32 +76,91 @@`: both stops read `mFinished` and set the flag under `mMutex`; `run()` (`@@ -610,6 +677,17 @@`) holds `mMutex` from `foldUnit()` through `mFinished = true` and clears the flags when `ret == 0 || ret == 9`. Only the success side of the race is corrected — G2-E-core-06. A test-only static hook (`testPauseInStop`) now ships in the binary; harmless, worth knowing.
- **gpt G-E2-06** (already-wrong own-launch records) — **answered for the writer.** `CaptureRotationText.cpp @@ -6,7 +6,12 @@` retires `from=own-launch` for `from=checked-launch`; `shouldRecord` rewrites a record that `recordFromOwnLaunch` does not accept, so an old record is replaced at the next exit. The reader's trust rule (`FileData.cpp`) and the `tools/vm-qa` fixture are outside. The "Already written" answer is read-both: the old line is untrusted, the table stands in, the next exit rewrites — sound.
- **Orchestrator G-E2-O2** — **answered by mechanism.** `run()` takes `mStampsBefore = ThreadedCloudSync::readStamps(mCommand)` before `popen` (`@@ -560,6 +623,10 @@`) and `restampStoppedParts` delegates with it (`@@ -643,57 +721,25 @@`); the overload's body is outside.
- All other E2 rows (G-E2-02/03/04/05/06/07/09, gpt G-E2-01/02/03/04) — **cannot tell**; their files are the application packet's.

---

## 3. Findings

### G2-E-core-01: `maskValueEnd` masks nothing when a `shellQuote`'d value sits inside a single-quoted command string
- **Severity:** Medium
- **Category:** Confidentiality / regression in a rewritten parser
- **Where:** `es-core/src/utils/StringUtil.cpp @@ -518,38 +520,124 @@`, the `enclosing != 0` branch of `maskValueEnd`.
- **What:** Inside a quoted string the new code returns at the first byte equal to `enclosing` ("the string itself ends"). `shellQuote` writes an embedded quote as `'\''` — *close, escaped quote, reopen* — so a value that was itself shell-quoted and then nested inside another `shellQuote` begins with the enclosing character.
- **Failure scenario:** Log line `sh -c 'tool --password '\''a b'\'''` (that is `shellQuote("tool --password " + shellQuote("a b"))`). At the value's start `s[pos] == '\''` and `enclosing == '\''`, so `maskValueEnd` returns `pos`: a zero-length value; the placeholder is inserted and `a b` is logged in the clear. The file's own contract (the comment at `@@ -473,10 +473,12 @@`: "where the shape is unclear, more is masked rather than less") is the opposite. The shape exists in this process: `CloudTransferJob::run` builds exactly `setsid sh -c <shellQuote("… " + mCommand + " …")>` (`@@ -560,6 +623,10 @@`), and `ThreadedCloudSync` gives its commands "the same shape" (that hunk's comment). Whether any *logged* line carries a credential in that position is outside the packet.
- **Evidence:** The branch has no `'\''` handling; the pre-rewrite code had `if (quote == '\'' && s.compare(i, 4, "'\\''") == 0) i += 3;` (removed in the same hunk). I looked for a top-level fallback for `enclosing == s[pos]` and found none.

### G2-E-core-02: a *trusted* zero rotation record is now written from the absence of a rotation line
- **Severity:** Low
- **Category:** New behaviour whose evidence is an absence (§ Verify the artifact)
- **Where:** `es-app/src/CaptureRotationText.cpp @@ -41,6 +46,20 @@` `shouldRecord`; `CaptureRotation.cpp @@ -145,25 +145,31 @@`.
- **What:** The old writer returned on `!had && turns == 0`. The new one, with no record, writes when `turns != 0 || tableTurns != 0` — so a session whose folded turn is 0 writes `turns=0 / from=checked-launch` whenever the core's table says otherwise, and that line is the one the reader now trusts over the table. `logHasLaunch` is a substring test for RetroArch's banner over the *whole* log, not the last launch's section, and it says only that RetroArch started; it does not say the rotation line would have been logged had the core asked.
- **Failure scenario:** A core the table gives 3 turns; a RetroArch whose log carries the banner but not the `SET_ROTATION` line for this session (a logging change, a different core log path). The exit writes a checked zero; captures of that game are unrotated from then on, and every later exit re-derives the same zero.
- **Evidence:** `fold`'s and `turnsFromLog`'s bodies are not in the diff; the header's own words ("turnsFromLog's -1 there is 'no evidence', which fold makes 0") are what I go on. What would settle it: whether `-1` (no evidence) and `0` (asked for none) reach `shouldRecord` distinguishably; they do not in the signature shown.

### G2-E-core-03: PL-064's recovery is keyed on the missing final line end, though a stronger test is computed and unused
- **Severity:** Low
- **Category:** D-CLOUD-078 (a cut file becomes the record)
- **Where:** `AtomicFileUtil.cpp @@ -126,7 +261,222 @@`, `chooseConfig`: `liveCut = liveOk && tmpWhole && !isComplete(live) && live.size() < tmp.size() && tmp.compare(0, live.size(), live) == 0`.
- **What:** The pre-#102 writer copied `.tmp` into a truncated live file in chunks; a kill on a chunk boundary that happens to follow a `\n` leaves a complete-looking prefix. With `!isComplete(live)` false, the live file is chosen (`Live`, `record = true`) and `recordLastGood` overwrites the record with the cut text — the whole `.tmp` beside it ignored. The comment says a cut at a line end "cannot be told from a shorter file", but a live file that is a *strict prefix of a whole `.tmp`* can be: no writer produces that pair except a cut copy.
- **Failure scenario:** `system.cfg` cut at byte 8192 where byte 8191 is `\n`; whole `system.cfg.tmp`; no usable record. Boot: keys after the cut are gone and the cut file becomes the last-known-good.
- **Evidence:** The prefix test is already in the `liveCut` expression; only the `!isComplete` conjunct blocks it. (On device this whole path is also behind `chksysconfig`'s `rm -f`, per E1.)

### G2-E-core-04: a usable-but-cut record beats a whole temporary, and the `Backup` recovery leaves the record at its old mode
- **Severity:** Low
- **Category:** Recovery ordering / G-E1-05 completeness
- **Where:** `chooseConfig` (`if (backupOk && isUsableKeyValues(backup)) → Backup` precedes `if (tmpWhole) → Temporary`); `SystemConf::loadFromDisk` `case Backup:` (`@@ -113,66 +83,145 @@`).
- **What:** (a) The header says "usable for the record means complete too", but the *load* accepts an incomplete record over a whole `.tmp` (records written since #102 are atomic, so this is the pre-#102 `cp`-at-boot record). (b) On `Backup` the live file is written back with the ANDed `mode` but `recordLastGood` is not called, so a 0644 record beside a now-0600 live file keeps the wider mode until the next save's `recordLastGood` notices the mismatch.
- **Failure scenario:** (a) live damaged, `.backup` cut mid-line from an old build, `.tmp` whole: the cut record is written back as the live file. (b) the G-E1-05 case with the record present: the private text stays world-readable in `.backup` for one boot.
- **Evidence:** the ordering of the three `if`s; the `Backup` case's body has `writeText` and `sRecovered = true` and no `recordLastGood`.

### G2-E-core-05: `applyChanges` completes a cut last line, and one save later it is recorded
- **Severity:** Low
- **Category:** Last-known-good provenance (the G-E1-04 gate holds for one save)
- **Where:** `SystemConf.cpp @@ -183,39 +232,67 @@` (`applyChanges` reads lines with `getline` and re-emits each with `"\n"`); `saveUnderLock`'s `*baseComplete`.
- **What:** A save merged onto a cut file is (rightly) not recorded. But the merge re-emits the partial last line as a whole line (`wifi.key=ab\n` from `wifi.key=abcdef`), so the written file is *complete*; the next start reads it as `Live` with `record = true` and `recordLastGood` makes the truncated value the record.
- **Failure scenario:** live cut mid-line with no record that `cutOfRecord` accepts; the player changes any setting; reboot. The truncated key is now the last-known-good, and any later recovery restores it.
- **Evidence:** `baseComplete` is only consulted to skip `recordLastGood` in that save; nothing marks the written file as derived from a cut base. What would refute it: `applyChanges` dropping the incomplete trailing line when `!baseWhole` — not in the diff.

### G2-E-core-06: a stop that lands after the command exited on its own with a *failure* is still reported as stopped; the signal's `ESRCH` is thrown away
- **Severity:** Low
- **Category:** Concurrency / outcome provenance (the half of G-E2-05 not taken)
- **Where:** `CloudTransferJob.cpp @@ -610,6 +677,17 @@` (`if ((mStoppedForGame || mStoppedByPlayer) && (ret == 0 || ret == 9))`); `deliverStop` (`@@ -76,32 +76,91 @@`) ignores `::kill`'s return.
- **What:** `ret` is computed from `pclose` before `mMutex` is taken. A stop arriving in that gap sets the flag and sends to a group that is already gone (`kill` → `ESRCH`). If the command had failed on its own (exit 5, a `>>> why`), the flags stay set and the run is presented as stopped for a game / by the player, hiding the real why. The same gap also means `kill(-pid)` can address a pid that the kernel has reused as a new group leader (pre-existing, not widened).
- **Failure scenario:** `cloud_backup` exits 5 with `YOUR CLOUD STOPPED ANSWERING`; the player presses a game in the same instant; the page says `SKIPPED - YOU STARTED A GAME` and the stamps (exit 5, not 130) are untouched, so the row and the page disagree.
- **Evidence:** the completion test lists only 0 and 9; `mSignalSent` records the request, not whether a process received it. Setting `mPid = 0` after `pclose`, or keeping `kill`'s result, would close both.

### G2-E-core-07: the recovery write-back at load runs outside the settings lock
- **Severity:** Low
- **Category:** Lock whose writers disagree (pre-existing, now more frequent)
- **Where:** `SystemConf::loadFromDisk` (`@@ -113,66 +83,145 @@`), the `Temporary` and `Backup` cases' `writeText(mSystemConfFile, …)`.
- **What:** Every other writer of `system.cfg` — the save (`saveUnderLock`) and the shell's `set_setting` — goes through `/tmp/.system.cfg.lock`. The load's write-back does not, and it now runs in two more cases (a whole `.tmp`, a cut-of-record).
- **Failure scenario:** a boot-time script's `set_setting` renames its temporary into place between ES's `chooseConfig` and ES's `writeText`; ES's rename wins and the script's key is gone — the PL-024 shape at startup.
- **Evidence:** no `PidLock` in `loadFromDisk`; `recordLastGood` is deliberately outside the lock (the shell never writes the record), but the live-file write-back is not the record.

### G2-E-core-08: `stampsToRestamp`'s no-snapshot path keeps the same-second rule the finding named
- **Severity:** Low
- **Category:** Fix relies on a caller's argument
- **Where:** `CloudText.cpp @@ -152,6 +153,85 @@`, `else if (r.when >= runStarted) names.push_back(s.name);`; `CloudText.h @@ -120,6 +120,26 @@` (`before = nullptr` default).
- **What:** Without `before`, a raw trap stamp (130, no token) written in the second this run began still qualifies; only stamps ES already restamped (`knownToken`) are excluded. Both callers in this packet's reach pass a snapshot (CloudTransferJob here; the card per E1), so this is a latent path, but the default argument keeps it the easiest overload to call.
- **Failure scenario:** a future caller `stampsToRestamp(stamps, runStarted)` with a run started within the same second as a shell-side `SIGTERM` of the previous one.
- **Evidence:** the two branches of the `if (before != nullptr)`; nothing prevents the fallback.

### G2-E-core-09: a pending change's base is taken from `confMap`, not from the file, so a key the file no longer holds is dropped by a `keepPending` reload
- **Severity:** Low
- **Category:** Pending-state loss (edge of G-E1-03's fix)
- **Where:** `SystemConf::set` (`@@ -324,6 +381,13 @@`): `mPendingBase[name] = it == confMap.cend() ? (false, "") : (true, it->second)`; `pendingAfterReload` (`@@ -126,7 +261,222 @@`).
- **What:** `confMap` keeps keys the file has lost (the parse only adds; a save that removes a key's line does not erase it from `confMap`). For such a key the base says `hadBase = true`, the reload finds no key (`hasNow = false`) and drops the change as "removed by somebody since", when nobody touched the file.
- **Failure scenario:** a setting cleared and saved (line removed), set again, the next save refused for the lock, then the picker's reload: the change is lost, and `confMap.erase` removes it from memory too.
- **Evidence:** `mOnDisk` exists in the same change and would be the right base; `set` does not consult it. Narrow, and the failure direction is the pre-fix one.

### G2-E-core-10: `joinWifiNetwork` returns `timeout`'s 124 as a code the header does not name
- **Severity:** Low
- **Category:** Player words chosen from an exit code (caller outside)
- **Where:** `ApiSystem.cpp @@ -674,12 +674,14 @@` (`timeout 120 wifictl join …`; `answer.code = result.second`); `ApiSystem.h @@ -271,11 +271,15 @@` lists only 2 and 1.
- **What:** After the 120 s bound the code is 124. E2's report says every code other than 2 gets "the forget-and-rejoin key advice".
- **Failure scenario:** NetworkManager hangs; the player waits two minutes and is told to check the key.
- **Evidence:** the header comment; `WifiText::joinFailure` is outside the packet, so which words 124 gets is a claim.

### G2-E-core-11: the match's zero-removed sentence differs from the rule's table, and its French is not among the strings this diff adds
- **Severity:** Low
- **Category:** Player text / vocabulary drift
- **Where:** `CloudText.cpp @@ -748,6 +971,110 @@` `matchRemovedNote`: `NOTHING WAS REMOVED FROM THIS DEVICE.`; `es-player-text.md` § Outcome vocabulary (updated by this same pass): `NOTHING WAS REMOVED.`
- **What:** The code and the rule the pass rewrote disagree by three words. The `.po` hunk adds French for `1 FILE WAS REMOVED…` and `%d FILES WERE REMOVED…` but not for the zero form; E2 counts "three new strings" including `TRY AGAIN: MATCH…`, which implies the zero form pre-existed in the catalogue — a claim I cannot see (the diff shows only appended lines).
- **Evidence:** the two texts side by side; `es-untranslated: 599/599` is the stream's line, not the packet's.

---

## 4. Sweep rows — spot-checks against the diff

Fixed rows I can see the mechanism for (more than the five asked):

| Row | Where in the diff | Holds? |
|---|---|---|
| gpt F-CS-27 (status not a whole number) | `wholeNumber` in `parseLastRun` (epoch 1..99999999999, code -1..255) and in the `Tier` branch (`@@ -330,7 +550,10 @@`) | yes |
| claude F-CS-19 (UTF-8 kept on the card) | `CloudText::cleanLine` keeps `c >= 0x80` | yes |
| gpt F-CS-31 (whys translated) | `whySentences/localizedWhy`; 18 + 9 French msgstrs appended | yes on the table; the rule's rc-keyed words differ (§ 5) |
| gpt F-CS-33 (`--core=` inside a ROM name) | `CommandLineUtil.h` — options found only at word starts, `wordEnd` honours quotes | yes; `SaveState.cpp`'s call is outside |
| gpt F-ES-07 (lock budget every pass) | `expired()` is called on the `!ok` path, after a reap, and at the loop's end | yes |
| gpt F-ES-08 (mode kept) | `writeText`: replacing → `fchmod(existing.st_mode & 07777)`; records pass `modeOf(path, 0644)` | yes (new files stay 0644 by design) |
| gpt F-ES-09 (whole shell word masked) | the top-level branch of `maskValueEnd` | yes at top level; see G2-E-core-01 for the nested case |
| gpt F-ES-11 (tab stops) | `TabStops::fromColumns`; `Font::getTabStops` measures pieces per column | the stops; whether the draw uses `stop + gap` is outside the hunk |
| claude F-CS-05 / gpt F-CS-23 (restamp only the interrupted part) | `stampsToRestamp` keeps only 130/no-token stamps written since the snapshot; `scriptStampNames` lists both `cloud_backup` stamps | yes |
| claude F-CS-26 / gpt F-CS-24 (stop before the pid) | `requestStop/deliverStop` with the seq-cst pair; `handleLine`'s `Pid` calls `deliverStop`; completed-not-stopped on 0/9 | yes (G2-E-core-06 for the failure side) |
| claude F-ES-08 / gpt 8a F-ES-08 (rotation) | mtime gate, `logHasLaunch`, `shouldRecord` | yes as designed; G2-E-core-02 |
| claude F-ES-26 (posts after teardown) | `AppWindow::post/closing`, used by `CloudOffer::present` | yes; `main()` calling `closing()` is outside |
| claude F-RA-19 (sign-in on close) | `CheevosRetry::saveSignIn` | the table; whether the switch change is folded into `accountChanged` by the caller is outside — the header's "changed the switch or the account" is wider than the parameter |
| claude F-WF-03 / gpt F-WF-06 (join says why) | `ApiSystem` returns the code | yes; the words are outside |

Withdrawn rows judgeable here: **claude F-RA-04** (a save resurrecting `hardcore_was`) — the withdrawal holds: `saveSystemConf` writes only `changedConf` keys merged onto the file read under the lock (`applyChanges`); a key never `set` is never written. **claude F-ES-24** (a toast over the hasher card) — the withdrawal matches `es-native-ui.md` § One floating surface at a time (D-UI-093). **claude F-WF-13**, **gpt F-ES-12**, **F-ES-19**, and the "not mine" rows — outside the packet.

---

## 5. Seams

- **The settings lock (ES `PidLock` ↔ shell `wait_lock`).** Both sides assume a regular file whose first line is the holder's pid, created so that a second creator fails. ES now creates it by `link()` from a pre-filled staging file (never empty); the shell's create-then-write window is still allowed 20 ms grace. Stale-lock removal is under `flock` on `<lock>.reap` on ES's side; the shell must take the same guard (E1: B's `db0f669bf4`) — outside the packet. ES no longer writes `system.cfg.tmp` at all, so the shell's own temporary name is uncontended; ES now *reads* it at load, which is fine because a shell write in flight is either incomplete (ignored) or whole and usable (loaded, same text the rename lands). The load's write-back is the one writer outside the lock (G2-E-core-07).
- **The scripts' stamps ↔ `parseLastRun`/`stampsToRestamp`.** The interface now requires `<epoch> <rc>` both whole numbers, rc in -1..255, and relies on (a) the trap writing `130` with no token, (b) `CloudExit::Stopped == 130`, (c) each stamp being written to a new file and renamed (so the snapshot's identity changes). (c) is asserted in comments and lives in the scripts. `scriptStampNames` maps by substring of the command (`cloud_backup`, `cloud_restore`, `cloud_content_*`): no name is a substring of another, but a command that merely *mentions* a script name (a path argument) would add its stamps to the candidate list — harmless, since only a stamp written since the snapshot is touched.
- **The scripts' `>>> why` sentences ↔ `whySentences`.** Byte-for-byte pairing; the emitter table in `CloudTextTests` is the guard (claimed, not in the packet). `es-player-text.md`'s "six rc-keyed sentences duplicated verbatim in ThreadedCloudSync's fallback map" names `YOUR CLOUD FOLDER WASN'T FOUND`, `YOUR CLOUD REFUSED THE TRANSFER`, `COULDN'T REACH YOUR CLOUD. YOU MAY NEED TO SIGN IN AGAIN`; the diff's table has `COULDN'T FIND YOUR CLOUD FOLDER`, `YOUR CLOUD WOULDN'T TAKE THE FILES`, `COULDN'T REACH YOUR CLOUD - CHECK YOUR SIGN-IN`. The rule's register table endorses the code's words, so the rule paragraph is the stale side; if `ThreadedCloudSync`'s fallback map (outside) still holds the old words, `localizedWhy` returns them untranslated.
- **wifictl ↔ `joinWifiNetwork`.** The interface reads exit 2 / 1 / 0-with-"joined"; the wrapper adds 124 (G2-E-core-10). Profile-name vs SSID is the other packet's.
- **The launch log ↔ `CaptureRotation`.** `LAUNCH_LOG`'s mtime against `started` (supplied by `FileData`, outside), the `=== Build ` banner as the launch witness: a banner change silently stops all records (fails toward "the table stands in"). The record's new `from=checked-launch` is read by `FileData` (outside) and written by `tools/vm-qa`'s fixture as `from=own-launch` (E2 flagged; distribution repo).
- **`CloudTransferJob` ↔ `ThreadedCloudSync`.** `readStamps(command)`, `restampStoppedParts(command, before, startedAt, token)`, `whyForCode`, `writeStamp` — signatures assumed, bodies outside.
- **`AppWindow` ↔ `main()`.** The gate only holds if `main()` calls `AppWindow::closing()` before the window's destructor; not in the packet.
- **Locale.** `TRY AGAIN: MATCH THIS DEVICE TO THE CLOUD` is French `RÉESSAYEZ : ALIGNER CET APPAREIL SUR LE CLOUD`; the pointer is only true if the row's own msgstr is `ALIGNER CET APPAREIL SUR LE CLOUD` — not visible.

---

## 6. Coverage boundary

- **No test source in the packet.** Every "seen to FAIL first" line and every suite count in both reports is a claim; I checked mechanisms, not cases.
- **Callees outside the diff whose bodies decide the verdicts above:** `CaptureRotationText::fold`, `turnsFromLog`, `recordFromOwnLaunch`, `recordText`; `CaptureRotation::recordMtime`, `fromTable`; `ThreadedCloudSync::readStamps` and the new `restampStoppedParts` overload; `WifiText::JoinAnswer`, `parseJoin`, `joinFailure`; `Window::postToUiThread`; `TAB_STOP_GAP` and the tabbed draw in `Font`; `CloudTransferJob::handleLine`'s locking and how `ret` is derived from `pclose`; `LastRun::knownToken`'s setter in `parseLastRun` (referenced, not shown).
- **Callers outside the diff:** every user of `saveSignIn`, `loadSystemConf(true)`, `isFlockHeld`, `replaceOptionValue`, `actionCandidates(…, keepInPlace)`, `recordAfterSession(…, started)`, `AppWindow::closing()`.
- **The shell side of every seam** (`wait_lock`, `chksysconfig`, `set_setting`, the cloud scripts' trap and stamps, `wifictl`) and the distribution rules named in the manifest (`rclone-cloud-sync.md`, `packaging-and-patches.md`) were not embedded.
- **Runtime and device:** the interface-thread budgets, tmpfs vs card behaviour of `link()`/`flock`, RetroArch's log content, the 640x480 frames.
- **The `.po`:** only appended lines are visible; whether a msgid already existed above the hunk (the zero-removed sentence, `YOU CANCELLED IT`, the four rc-keyed whys) cannot be told.

---

## corpus.provenance.json

```json
{
  "seat": "E-core",
  "audit": "docs/audits/2026_09_28-milestone-audit-of-the-fix-round",
  "manifest": "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/E-core.manifest.json",
  "read_timestamp_utc": "2026-09-28T13:57:25Z",
  "hashes_source": "as recorded by the Council Facilitator at embed time; not re-read or re-hashed by this seat",
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
  "declared_but_not_embedded": [
    ".claude/rules/packaging-and-patches.md",
    ".claude/rules/rclone-cloud-sync.md"
  ],
  "not_in_packet_and_not_consulted": [
    "es-app/tests/unit/**",
    "tests/app-unit/**",
    "tests/*.py",
    "the application half of the ES diff (GuiWifi, GuiMenu, FileData, ThreadedCloudSync, ProxyCards, SaveStateBookkeeper, WifiText, main.cpp)",
    "the distribution repo's scripts (wait_lock, chksysconfig, set_setting, cloud_*, wifictl, backuptool)"
  ]
}
```
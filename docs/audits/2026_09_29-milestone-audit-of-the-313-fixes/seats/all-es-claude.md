# Council seat: all-es — audit of the fixes (#313, D-WORKFLOW-063)

Read-at-time corpus: the 8 embedded sources (paths and sha256 as recorded by the Facilitator; recorded in `corpus.provenance.json` at the end). No filesystem access; nothing re-read or re-hashed. Where a callee or a runtime is outside `seats/all-es.diff`, I say so.

---

## 1. Per-item verdicts (against `seats/items.md` acceptance text)

| Item | Verdict |
|---|---|
| PL-001 … PL-009 | **outside the packet** (cloud scripts, backuptool, 001-functions, cloud_setup). |
| PL-010 | **holds.** `StringUtil.cpp`: new `maskInnerChar` reads one character of the inner command as its shell would (in an enclosing `"`: `\" \\ \$ \`` are one character; in an enclosing `'`: shellQuote's `'\''` is one quote), and the rewritten loop in `maskValueEnd` handles `c == '\\'` *before* the `inner == '"'` test, so inside an inner double quote a backslash takes the next character in both enclosing modes. The seat's line is a doctest: `MaskSecretsTests.cpp` "an escaped quote inside an inner quoted value does not end it (PL-010)" — `sh -c 'tool --password "front\" back"'` → `<redacted>` whole, plus the `"`-enclosing twin. Note: inside an inner *single* quote the fix deliberately does **not** skip after a backslash ("as the shell has it", pinned by the `'front\'\''back next'` case) — a narrower mechanism than the acceptance's literal wording, and the correct one for what the inner shell reads. `es-syntax-check` run: not in the packet. |
| PL-011 | **outside the packet** (distribution hooks). Fork sibling, judged lightly: `guard-lib` `guard_load` validates both lists once (`printf '' \| grep -E -e "$p"; rc ≤ 1`); `guard_scan` reads grep's status in the shell that ran it (`1` pass, `0` refuse, else refuse); producer/parser statuses are read (`pre-commit`: `set -o pipefail` on `git diff … \| guard_added_lines`; `pre-push`: `\|\| scan_ok=0` on each stage); `pre-push-test` case 11 constructs `SECRET_PATTERNS='['` and a missing wordlist, both refused. But a parser that silently produces *nothing* is not a status failure — see **G3-E-01**. |
| PL-012 | **outside the packet** (the `docs/audits/*/seats/*.diff` exemption and the `.gitignore` line are the distribution's; no such exemption appears in the fork's removed lines). Fork sibling: the two path-keyed exemptions (`maskSecrets(` in unit tests, `pre-push-test`'s `FAKE=`) are removed from both hooks; case 9 flipped from `allowed` to `refused`; the fixtures are built at run time / split in source. |
| PL-013 | documentation — **outside the packet**. |
| PL-014 … PL-017 | **outside the packet.** |
| PL-018 | **holds.** `AtomicFileUtil.cpp` `chooseConfig`: `if (backupOk && isUsableKeyValues(backup))` → `if (backupWhole)`. Two `es-file-tests` cases as the amended acceptance asks: "a record cut short beside a whole temporary: the temporary recovers" (no live / unusable live → `Source::Temporary`, `c.record`) and "a record cut short with no whole temporary" (no live → `Missing`, `!record`; unusable live → `Damaged`, `text != cut`, `!record`; `.backup` unchanged on disk). `SystemConfTests.cpp` adds the end-to-end: `get("system.hostname") == "BATOCERA"` (the default), nothing written back, `.backup == cut`. Caveat: `backupWhole`'s definition (line ~308, "unused there" per the item) is outside the hunk; the hunk's comment says whole means complete *and* usable — one visit confirms. |
| PL-019 | **holds** (the 640x480 frame is not in the packet). `GuiMenu.cpp`: `cloudSaveSelection()` runs `--set-systems`, refuses on rc ≠ 0, then re-reads `CLOUD_CONTENT_SELECTION` with `cloudSelectionRead` (ifstream — the 3-byte `readAllText` trap avoided) and refuses unless `is_open()` and the file's names set-equal what was ticked. The BIOS-only branch now opens the same `GuiSettings` page (NONE under the systems heading, a BIOS FILES group) with BACK and the verb; the verb calls `cloudSaveSelection({"bios"})`, shows `cloudSelectionNotSaved(backup)` on failure, else `*proceed = true; s->close()`; `onFinalize` calls `onDone()` only behind `*proceed`. The main page's verb does the same; BACK's `addSaveFunc` saves only when `!*proceed`. `cloudOpenTransfer` counts items through the same reader. The "app-unit case" is met by a different mechanism: `tests/cloud-content-selection.py` compiles the four shipped functions out of `GuiMenu.cpp` against a stub script (exit 0 over a stale file → refuse; exit 1 → refuse; missing script → refuse; nothing ticked with no file → refuse; one-letter name → continue) and checks the page's shape textually. Player text: the refusal names what did not happen; the recovery is the verb still on the page (es-player-text asks for "how to recover" in words — a nit, not a defect). French: see **G3-E-03**. |
| PL-020 … PL-025 | **outside the packet.** |
| PL-026 | **outside the packet** (distribution `pre-commit`). Fork sibling: `guard_scan` anchors every pattern past the label — `^([^\t]*\t)+.*(patterns)`, the label never holding a tab — so a credential-shaped *file name* is no longer content. The acceptance's "test adds a file named like a key" is not in the visible `pre-push-test` hunk. |
| PL-027 | documentation — **outside the packet**. |
| PL-028 | **outside the packet.** |
| PL-029 | needs no code; the E1/E2 follow-up proofs (`es-conf-tests`, `run-lock-signal.py`, `cloud-content-selection.py`, the ProxyCards cases) exist in this diff; whether they ran under `proofs-307/` is outside the packet. |
| PL-030 | **holds in part** (the refutation branch). `SaveStateBookkeeper.{h,cpp}` add a source-backed refutation: the copy's write to the saves tree is made at the press behind the manager's gate (`GuiSaveState`'s `savesTreeBusy`, `copyToSlot`); what the worker queues is only `cloud_capture --adopt`, whose write goes to the capture manifest under `/storage/.cache/cloud_sync`, serialised by `capture_lock` and read by no transfer script ("a grep of the five transfer scripts for manifest-, cloud_capture, /stage and .capture finds nothing"). What is missing against the acceptance's own words: it "names the line that already serialises it" — the comments name functions and a grep, not a line; and all three load-bearing claims (`copyToSlot` synchronous, `--adopt`'s write set, the five scripts' read set) are outside this packet. |
| PL-031 | **interface half holds**; the ctl half is outside the packet. `CloudText::parseScanStamp` reads `added=unknown` (lowercase only) as `ScanStamp::AddedUnknown = -2`, distinct from `-1` (no `added=`); `ProxyCards::runTopUp` computes `added = 0` for it (never `s.cached`), says `N GAMES ARE READY.` from `ready`, and with `ready == 0` says COMPLETED alone (`else if (!addedUnknown)` guards EVERYTHING'S UP TO DATE). Tests: `CloudTextTests` (unknown, UNKNOWN→-1, empty, `x2`) and `ProxyCardsTests` three cards. Seam: the ctl's exact token must be `unknown`; other readers of `added` — see **G3-E-04**. |
| PL-032 … PL-034 | **outside the packet.** |

## 2. Changes in the packet with no item (E follow-ups); what each does, read whole

- **G2-A-03 (69 + gaps)**: `CloudText::offlinePartWayWhy` picks the first stamp written since the run began (version changed vs `before`) carrying code 69 and token `gaps`; `ThreadedCloudSync::run` says `COULDN'T FINISH - <why>`, token `gaps`, keeps `ret = 69`, records the why into `last-sync-exit`; `exitSyncOwed` now also owes `69 gaps`. `keepInPlace` excludes `offlineGaps`; `moved = mMoved || offlineGaps`. Tests cover the bare 69, an old gaps stamp, a 5-gaps. No defect found.
- **G2-E-core-02/03/05/06/07/09 (SystemConf/AtomicFileUtil)**: `loadUnderLock` (choose, take `PidLock`, choose again, write back with the shared mode; `LockBusy` leaves the file and the next save merges onto the recovery); `saveUnderLock` merges onto the recovery when the live file is not whole or unusable (empty is not whole); a reload that reads nothing restores pending state and returns false; `set()` takes its base from `mOnDisk`; `mOnDisk` refreshed after a save; `recordLastGood(text, recoveredMode)`. New `es-conf-tests` compiles the shipped `SystemConf.cpp`. See **G3-E-06** for the sibling the reload fix leaves.
- **G2-E-app-05/02 (ProxyCards hold)**: a steady-clock deadline plus a games-started baseline replaces the flag; every run, the first included, calls `waitForTheGame()`; the watcher spends a hold before letting go. Traced the four new app-unit cases against the code; consistent. No defect found beyond **G3-E-05**'s caller behaviour.
- **G2-E-app-05/06 (stopRun)**: signals only a pid that holds the lock file open (`/proc/<pid>/fd` dev+ino), retrying for ~500 ms. `tests/run-lock-signal.py` runs it against real processes.
- **G2-E-app-01 (WifiText)**: the profile in use outranks an inactive namesake; two up and none named → not guessed; test added.
- **G2-E-core-01 (shellQuote nesting)**: covered under PL-010.
- **G2-E-tests-01 / #312 (fork hooks)**: `guard-lib`, `commit-msg`, wordlist scan, no path exempt. Findings **G3-E-01, G3-E-02, G3-E-07**.

---

## 3. Findings

### G3-E-01: `guard_added_lines` scans nothing when the `+++` header has no `b/` prefix, and blanks the path on a content line beginning `++ `
- **Severity:** Medium (the fork's hooks, fork-only — judged lightly; but this is the PL-011 category, a scanner that passes on its own blind spot, and `guard-lib` says "the same file is carried" in the distribution)
- **Category:** Guard fails open / regression on a path the item did not name
- **Where:** `.githooks/guard-lib` `guard_added_lines`; `.githooks/pre-commit` (`git diff --cached -U0 --no-color --diff-filter=ACMRT | guard_added_lines`); `.githooks/pre-push` (`git log --format='commit %h' -p --no-color --diff-merges=first-parent --diff-filter=ACMRT …`)
- **What:** The awk sets the path only on `/^\+\+\+ b\//`, clears it on any other `/^\+\+\+ /`, and prints an added line only `if (f != "")`. Neither git command forces prefixes, so a clone with `diff.noprefix = true` (a common user setting; `git diff` and `git log -p` honour it) emits `+++ path` for every file → `f = ""` → no line is ever printed → `guard_scan` greps an empty file → rc 1 → **pass**, for the credential scan and the wordlist scan alike, in both hooks. Independently, a content line whose text begins `++ ` appears in the diff as `+++ …`, is taken for a header, clears `f`, and every later added line of that file is unscanned until the next real header. The old awk (removed in the same hunks: `/^\+\+\+ /{next} /^\+/{print f ": " $0}`) printed lines with an empty label, so they were still grepped — this is a regression introduced by the fix.
- **Failure scenario:** `git config --global diff.noprefix true`; stage a file containing `<a credential-shaped value>`; `pre-commit` exits 0. Or, with default config: a file gaining the two lines `++ note` and `<a credential-shaped value>` in that order; the second is not scanned.
- **Evidence:** the four awk rules in the `guard_added_lines` hunk; the `if (f != "") print` guard; neither `git diff` nor `git log` invocation carries `--src-prefix=a/ --dst-prefix=b/`. Tried to refute with `++++ b/path` (a committed diff-of-a-diff): that line does not match `^\+\+\+ ` and is scanned — the bypass needs exactly `++ ` (content) or a missing prefix (config). `pre-push-test` case 10 (no pattern file) and case 11 do not construct either.
- **Fix:** force prefixes on both git commands (`--src-prefix=a/ --dst-prefix=b/`, which overrides `diff.noprefix`); treat `+++ ` as a header only when the previous line was `--- ` (a one-variable state in the awk); and fail closed — count added lines met while `f == ""` and `exit 1` from the awk in `END`, which `pre-commit`'s pipefail and `pre-push`'s `|| scan_ok=0` already turn into a refusal. Add two `pre-push-test` cases: the scratch repo with `diff.noprefix=true` and a credential line, refused; a `++ ` line before a credential line, refused. Mirror in the distribution's copy.
- **Confidence:** high on the awk (all rules are in the packet); high that the git commands honour `diff.noprefix` and that the prefix options override it.

### G3-E-02: `commit-msg` passes when the message file cannot be read
- **Severity:** Low (fork-only)
- **Category:** Guard fails open on its own error
- **Where:** `.githooks/commit-msg`, the `if ! grep -v -a -E '^#' -- "${1:-/dev/null}" | guard_numbered message > "${lines}"; then [ -s "${lines}" ] || exit 0; fi` block
- **What:** grep's exit 2 (unreadable file) and exit 1 (nothing left after dropping comments) both leave `${lines}` empty, and the hook treats "empty" as "nothing to scan, allowed". `guard-lib`'s own header says "a diff or a message that cannot be read -- each is a refusal, never an empty scan". Also: comment lines are dropped by `#` regardless of `core.commentChar`/`commit.cleanup`, so a `#` line git keeps (`cleanup=verbatim`) is unscanned.
- **Failure scenario:** the message file unreadable → exit 0, unscanned. Contrived in practice (git wrote the file), but it contradicts the library's contract.
- **Evidence:** the block above; no `PIPESTATUS`/readability test.
- **Fix:** `[ -r "${1:-}" ] || { echo "✖ commit-msg: cannot read the message; refused" >&2; exit 1; }` before the pipeline, or read `${PIPESTATUS[0]}` and refuse on anything above 1.
- **Confidence:** high.

### G3-E-03: the picker's restore-side refusal has no French
- **Severity:** Low
- **Category:** es-player-text.md § Every fork string ships in English and French (D-UI-051)
- **Where:** `GuiMenu.cpp` `cloudSelectionNotSaved()` — `_("COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED.")`; `locale/lang/fr/LC_MESSAGES/emulationstation2.po` hunk adds only the BACKED UP variant and `BIOS FILES`
- **What:** the two sibling strings were added in the same commit series; one got its French, the other falls through to English on a French device.
- **Failure scenario:** `system.language=fr`, CONTENT TO RESTORE, `--set-systems` fails → an English msgbox on a French interface.
- **Evidence:** the `.po` hunk lists two msgids; `cloudSelectionNotSaved` has two `_()` strings.
- **Fix:** add `msgid "COULDN'T SAVE WHAT YOU TICKED, SO NOTHING WAS RESTORED."` / `msgstr "IMPOSSIBLE D’ENREGISTRER CE QUE VOUS AVEZ COCHÉ, DONC RIEN N’A ÉTÉ RESTAURÉ."` in the file's style; confirm `NONE` already has an entry.
- **Confidence:** high.

### G3-E-04: `ScanStamp::AddedUnknown` widens the meaning of a negative `added`; only ProxyCards was updated
- **Severity:** Low (Medium if a second reader exists)
- **Category:** A contract change with un-audited consumers (PL-031's substitution, reintroduced by a reader the fix did not touch)
- **Where:** `CloudText.h` (`static constexpr int AddedUnknown = -2`, the `added` comment); `ProxyCards.cpp` `runTopUp` (the only consumer in the diff)
- **What:** Before, `added < 0` meant exactly one thing ("an older ctl's stamp, cached stood for it"), and the idiom `s.added >= 0 ? s.added : s.cached` was correct. Now `-2` means "nobody counted", and that idiom anywhere else substitutes the cache count — the exact fail-open PL-031 forbids. The diff changes no other reader; `parseScanStamp` is also read by the scan page and the SCAN GAMES row (per `es-code-traps.md` § Pure text has a home), which are outside the diff.
- **Failure scenario:** none demonstrated — conditional on a reader outside the diff using the old idiom; then a `cached=5 … added=unknown` stamp reads as "5 added" on that surface.
- **Evidence:** the constant and the single updated site; nothing else in the packet reads `.added`.
- **Fix:** one grep for `\.added` outside `ProxyCards.cpp`; if a reader exists, route both through a `CloudText::saidAdded(const ScanStamp&)` that returns 0 for `AddedUnknown` and `cached` for `-1`, with a case; if none, record the grep in the item's closure.
- **Confidence:** medium (the hazard is certain; whether it is realised is outside the packet).

### G3-E-05: `stopRun` gives up after ~500 ms, and the player's STOP IT AND PLAY silently becomes a wait
- **Severity:** Low
- **Category:** Degradation without a word to the player; a sleep on the interface thread
- **Where:** `OfflineAchievements.cpp` `stopRun()` (the `for (int attempt = 0; ; attempt++)` loop, `attempt >= 10`, `sleep_for(50ms)`); `ProxyCards.cpp` `stopTopUp()` (`if (OfflineAchievements::stopRun()) return true; sTopUpStoppedForGame = false; sTopUpHeldUntilMs = 0; return false;`)
- **What:** When the lock is held but the file's pid does not hold it for half a second (a ctl slow to write its pid, or a pid written by a subshell that does not own fd 9), `stopRun` logs and returns false; `stopTopUp` unwinds its state and returns false; the launch then "waits for the run to end on its own (FileData's launchWhenGone)" — a ctl run that can take minutes — after the player pressed a verb that promised a stop. Nothing in the diff shows a card or line changing to say so. The 11 × 50 ms polling runs on whichever thread answers the question (the launch question's callback — the interface thread), holding the screen up to half a second.
- **Failure scenario:** ctl takes the lock, spends >500 ms before `printf "%s\n" $$ >&9`; player presses STOP IT AND PLAY; nothing is signalled; the game launches only when the top-up finishes; the card still reads its running line.
- **Evidence:** the loop's bound and return; `stopTopUp`'s false branch; the harness `run-lock-signal.py` case 3 writes the pid at 0.2 s, inside the bound, and never constructs the over-bound case. The caller's behaviour on `false` is outside the diff.
- **Fix:** either lengthen the bound to the ctl's worst observed pid-write delay and move the poll off the interface thread, or, on `false`, tell the player (the question's KEEP WAITING outcome, or a line on the card: `IT COULDN'T BE STOPPED; YOUR GAME STARTS WHEN IT'S DONE.`) so the promise is not silently withdrawn.
- **Confidence:** medium (the interface-side consequence depends on `launchWhenGone`, outside the packet).

### G3-E-06: a reload onto a `Damaged` file still drops every pending change as "removed by somebody"
- **Severity:** Low
- **Category:** Sibling of G2-E-core-06 left in place
- **Where:** `SystemConf.cpp` `loadSystemConf()` (`if (!loaded && keepPending) { … return false; }` then `pendingAfterReload(pending, mOnDisk)`); `loadFromDisk()` `case Source::Damaged` (`parseSystemConf(chosen.text); return true;`)
- **What:** The fix keeps pending changes when `loadFromDisk()` returns false (nothing read). The `Damaged` case returns **true** after parsing text with no usable key=value line, so `mOnDisk` is empty and `pendingAfterReload` sees every changed key as gone from the file — the same inference from the same absence of evidence, one branch over.
- **Failure scenario:** a change pending (the lock refused a save, PL-024); the live file is overwritten with junk and neither a whole `.backup` nor a whole `.tmp` exists; `loadSystemConf(true)` → `Damaged` → the change is dropped from `changedConf` and from memory. Narrow: it needs the record to be absent or cut too.
- **Evidence:** the two hunks; `pendingAfterReload` itself is outside the diff, but its documented rule ("except where the file now holds a key differently") is what the G2-E-core-06 fix worked around for the `false` case only.
- **Fix:** treat a `Damaged` load like a failed one for the purpose of pending changes (keep them, with their bases), or have `pendingAfterReload` skip the comparison when the reading has no usable line; one `es-conf-tests` case.
- **Confidence:** medium-high.

### G3-E-07: `pre-push` leaves its three temporaries behind when killed
- **Severity:** Low (fork-only, hygiene)
- **Category:** Runner hygiene
- **Where:** `.githooks/pre-push` (`added="$(mktemp)"; lines="$(mktemp)"; msgs="$(mktemp)"` … `rm -f` at two exits; no `trap`)
- **What:** `pre-commit` and `commit-msg` trap EXIT; `pre-push` does not, so an interrupted push (Ctrl-C during a long `git log -p`) leaves files in `$TMPDIR`. Not a scan defect.
- **Failure scenario:** none beyond litter.
- **Evidence:** the hunk; the two `rm -f` sites are the only cleanup.
- **Fix:** a `trap 'rm -f "${added:-}" "${lines:-}" "${msgs:-}"' EXIT` at the top of the loop's scope (or once, with the variables declared before the loop).
- **Confidence:** high.

---

## 4. Seams

1. **`SystemConf`/`AtomicFileUtil` ↔ the shell's settings lock.** The interface now takes `sLockPath = "/tmp/.system.cfg.lock"` for the recovery write-back as well as the save, through `PidLock`. The shell's `wait_lock` (profile.d/001-functions) is named in the header comment; its path and protocol (pid-file vs flock, staleness) are outside the packet. If the two do not exclude each other the whole G2-E-core-02 fix is decorative; the `es-conf-tests` "recovery is written back under the settings lock" case proves only PidLock-against-PidLock.
2. **`ThreadedCloudSync`/`CloudText` ↔ the scripts' stamps.** The card now reads the scripts' `<epoch> 69 gaps <WHY>` and writes its own `last-sync-exit` as `69 gaps <why>` through `recordOutcome` (format outside the diff); `exitSyncOwed` reads the same token back. The default sentence `YOU WENT OFFLINE PART-WAY THROUGH` is a literal in `CloudText.cpp` and must match the scripts' and `localizedWhy`'s table byte for byte (es-player-text lists it since #307); a drift point. `offlinePartWayWhy` depends on `mStampsBefore` being read before every run (existing member, outside the hunk).
3. **`CloudText` ↔ `raofflineproxy-ctl`.** The interface accepts `added=unknown` only in lowercase; `UNKNOWN`, `unknown ` or `?` read as "does not say" → `cached`. The ctl's exact token is in the distribution packet.
4. **`GuiMenu` ↔ `cloud_content_restore --set-systems`.** The picker now proceeds only if the script leaves `/storage/.cache/cloud_sync/content-systems` naming exactly what was ticked (set-equal, one per line). If the real script normalises (lowercases, sorts, dedupes) the compare tolerates it; if it drops or rewrites a name and exits 0, the player is refused with COULDN'T SAVE WHAT YOU TICKED — correct in kind, but every such divergence becomes a visible refusal. The path is hard-coded in both sides.
5. **`.githooks/guard-lib` ↔ the distribution's copy.** "Change both together" — G3-E-01 applies to whichever copy is byte-identical.
6. **`ProxyCards::stopTopUp` ↔ `OfflineAchievements::stopRun` ↔ `RunLock`.** The hold is armed before `stopRun`'s ~500 ms poll and disarmed on its `false`; the poll assumes the ctl writes `$$` from the process that owns the lock fd within that bound. `RunLock::holder/held` are outside the diff.
7. **`FileData::GetGamesStarted` ↔ `ProxyCards`.** `sGamesStarted++` sits beside `mRunningGame = gameToUpdate` in `launchGame`; `stopTopUp`'s baseline subtracts one when a game is on screen, which holds only while every `mRunningGame` assignment goes through that line (the diff asserts `launchNow` does).

## 5. Refutations tried that failed

- `maskValueEnd`: `\\"` before the enclosing end quote → ends at the string, `back` outside is not masked and is not the value; `'\''` nested twice (shellQuote of shellQuote) → one value; a lone `\` before the enclosing `'` → ends; `'\''` inside an inner `"` → stays inside; `\ ` at the inner top level under an enclosing `"` (`\\ `) → consumed. No leak found.
- `offlinePartWayWhy`: an old `69 gaps` stamp with unchanged version → not this run's; `5 gaps` → skipped; bare `69` → skipped; `69 gaps` with no why → the default sentence.
- `exitSyncOwed`: `5 gaps` not owed; a later completed startup or backup stamp → not owed.
- ProxyCards: a stop with a game already running → baseline `N-1`, hold spent at once, the run still waits for the game to end; two stops in a row → the CAS leaves the later hold; `stopRun` false → hold cleared; no hold and no game → `waitForTheGame` returns at once (no regression on the at-once start); the hold branch keeps `sTopUpRunning` true so a request queues rather than spawning a second watcher.
- `runTopUp`: `!stamped || addedUnknown ? 0 : …` — precedence checked (`||` binds before `?:`).
- `saveUnderLock`: whole live beside a leftover `.tmp` → the live file; cut live with a usable line and no recovery → merged, not whole; empty live and nothing else → written, not whole.
- `loadUnderLock`: the second `chooseConfig` under the lock returns the shell's whole file → nothing written, that file read (tested).
- `guard_load`: a pattern that compiles alone but breaks inside `(…)` → `guard_scan` gets rc > 1 → refusal anyway.
- `pre-push`: `mktemp` failure → `> ""` fails → `scan_ok=0` → refusal (fail-closed by accident, not by design).
- `guard_added_lines`: `++++ b/path` (a diff committed as content) is scanned; `\ No newline at end of file` does not disturb line numbering.
- `pre-commit`: `trap 'rm -f "${added}" "${added}"'` — a duplicated word, harmless.
- `WifiText`: two up with the namesake up → `joinedNow`; two up neither named → empty profile and `joinName` falls back to the SSID, so JOIN is unchanged from before; the trade-off "one up on a second adapter + a namesake whose flag lags" is the finding's own chosen risk, stated in the comment.
- `cloudSaveSelection`: duplicates in `names` or the file → set compare; `\r` stripped; a missing file with nothing ticked → refused as the acceptance asks.

## 6. Coverage boundary (not judgeable from this packet)

- `backupWhole`'s definition (AtomicFileUtil.cpp ~308), `isComplete`, and `writeText`'s third parameter's default and its treatment of `mode = -1` (every ordinary save now passes `-1` explicitly; no test asserts an ordinary save's mode).
- Whether `loadFromDisk()` clears `confMap` before the choice; if so, a failed reload (G2-E-core-06) restores pending state but blanks every *unchanged* setting in memory until the file returns — the test asserts only the changed key.
- `pendingAfterReload`, `readStamps`, `mStampsBefore`'s population, `recordOutcome`'s stamp format, `localizedWhy`'s table, `RunLock::holder/held`, `FileData::launchWhenGone`, `GuiSaveState::copyToSlot`/`savesTreeBusy`, `cloud_capture --adopt`.
- `Found`'s type for `bios` and its `supported` default — `noteFor(bios)` appends `THIS DEVICE CANNOT RUN IT` when `!f.supported`; if the BIOS `Found` never sets it, the BIOS-only page carries that line. `cloudSetupAddInfoRow`'s signature; `addWithDescription(…, nullptr)`'s handling of a null component (a selectable row that does nothing on press?).
- Other readers of `ScanStamp::added` (G3-E-04).
- The ctl's exact `added=unknown` token; `cloud_content_restore --set-systems`'s real write shape; the shell's `wait_lock` path and protocol; the scripts' `69 gaps` writer.
- Runs and artifacts named by acceptance text but not in the diff: `es-syntax-check` (PL-010), the 640x480 frame (PL-019), whether `es-conf-tests`, `run-lock-signal.py` and `cloud-content-selection.py` are wired into a runner (`vm-qa`, `proofs-307/`) and were seen to FAIL once.
- `pre-push-test`'s `g`, `expect`, `says`, `${base}`, `${top}` helpers (outside the hunk) — including whether `g commit` bypasses the new `commit-msg` hook in the scratch repo (case 11's `-m 'about the qzx-estate'` would otherwise be refused before it is tested).
- `pre-push`'s pipelines outside the hunk under the now-global `set -o pipefail`.
- The app-unit ProxyCards cases are wall-clock tests (7.5 s, 6 s sleeps); their stability on a loaded runner is a runtime fact.

---

## corpus.provenance.json

```json
{
  "council_facilitator": "council-facilitator@1.2.0",
  "audit": "docs/audits/2026_09_29-milestone-audit-of-the-313-fixes",
  "seat": "all-es",
  "manifest_path": "docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/all-es.manifest.json",
  "manifest_read_timestamp_utc": "2026-09-29T00:18:21Z",
  "filesystem_access": false,
  "hash_method": "sha256 values recorded from the Facilitator's per-source embed headers (verified at embed time); not recomputed by this seat",
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/all-es.diff",
    "/workspace/repos/rocknix/docs/audits/2026_09_29-milestone-audit-of-the-313-fixes/seats/items.md",
    "/workspace/repos/rocknix/.claude/rules/engineering-practices.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/es-native-ui.md",
    "/workspace/repos/rocknix/.claude/rules/es-code-traps.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md"
  ],
  "source_file_hashes": [
    "ab990818040c72a1e60c77a553a98824256f548a39d109b3030fd12ec55ce54a",
    "7017bd2d9f3927d24c85f19a21069dd5fe118dee79b732b8b9042c49a488ac97",
    "9a41f84b4bf10534f5e8d1de3c165acafb6937807d98e84017b024076b23bdcd",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "48cd5ac727b6d05d0e5acf5a17e7591d96a56e574d27f48a5c0210c5499afcb7",
    "9d5d6995714c9a1287c84f0c02a92de244271a4bdad8e53d29bb61115ba51d0f",
    "bfbd58cd993195eb4af7b604db0cb4e163d4a48dde46046cddf383560974817a"
  ],
  "sources_needed_not_embedded": [
    "es-core/src/utils/AtomicFileUtil.cpp (whole file: backupWhole, isComplete, writeText's mode default)",
    "es-core/src/SystemConf.cpp (whole file: loadFromDisk's confMap handling, pendingAfterReload)",
    "es-app/src/RunLock.h, es-app/src/FileData.cpp launchWhenGone, es-app/src/guis/GuiSaveState.cpp",
    ".githooks/pre-push-test (whole file: g, expect, says helpers)",
    "the distribution packet (raofflineproxy-ctl added=unknown, cloud_content_restore --set-systems, profile.d/001-functions wait_lock, the scripts' 69 gaps stamp writer)"
  ]
}
```
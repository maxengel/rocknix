I have reviewed the four analyses (`claude-analysis.md`, `gemini-analysis.md`, `gpt-analysis.md`, `kimi-analysis.md`) against the embedded corpus. My task is to identify the strongest and weakest arguments in each, name failure modes every analysis missed, and give concrete revisions each proposal should make.

---

## 1. Strongest and weakest arguments per analysis

### `claude-analysis.md`

**Strongest argument:**
The **count bound must be keyed to the save file, not the unit** (§1.2). This is the most valuable finding in the set: the plan of record's unit definition (a hash set) is correct for the classifier but wrong for retention, and the maintainer's own example (the accidental overwrite of a manual slot by auto-state churn) is the exact case that breaks under the unit key. The argument is checkable against the corpus (`issues/22.md` R4, R9; D-CLOUD-030) and is decisive.

**Weakest argument:**
The **clock skew hazard against the age cap** (§1.6) is overstated. The seq stamp is the *retaining device's* clock, but `record.json`'s `decided_at` is only for display, and rclone sets the destination's modtime from the source on copy — so the store entry's modtime is the *save's* mtime, not the device's. A device whose clock reads 2031 therefore does not sweep every entry as expired; it writes entries every other device evicts first, but the damage is bounded and the residual is small. The hazard exists, but the analysis treats it as a showstopper rather than a residual to state.

---

### `gemini-analysis.md`

**Strongest argument:**
The **concurrent-publisher counterexample** (§2.2) is the most important hazard named in the set. Two devices can both retain the same head, both publish, and the second publish overwrites the first without retaining it — a real lost version. The analysis is correct, and the counterexample is decisive: the delta's retain-before-publish alone is insufficient for recoverability under concurrency. The experiment it proposes (two VMs, forced simultaneous publishes) is the cheapest way to settle it.

**Weakest argument:**
The **clock skew hazard** (§2.6) is the same overstatement as Claude's, but Gemini goes further and proposes a mitigation (compare against server-side modtime) that is unnecessary. The hazard is real but bounded, and the mitigation adds complexity for a residual that is already small.

---

### `gpt-analysis.md`

**Strongest argument:**
The **namespace protection hazard** (§2.1) is the most valuable single insight in the set. The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**` — and the shipped allowlist includes patterns that match at any depth (`+ /**/*.srm`, `+ /**/*.state*`). An old-image sync-mode backup or MATCH deletes the store's members from the cloud, shredding save bytes while leaving orphans. The analysis is correct, and the hazard is real: the store's exclusion changes from *by construction* to *by rule*, and rules files are user-editable and old images persist in a fleet. The experiment it proposes (seed a cloud with README + `.history/`, run the shipped image's backup/restore/MATCH) is the cheapest way to settle it.

**Weakest argument:**
The **auto-heal heuristic** (§2.10) is over-scoped. The analysis argues that "uniform bytes are legitimate" and that the heuristic must be format-aware, but the corpus already frames the heuristic as a cheap sufficient form (D-CLOUD-034: "a correctness fix that costs complexity, CPU or memory has to earn it"). The delta's zero-length/all-one-byte test is the cheapest sufficient form, and a false positive is recoverable by construction (the suspect is retained). The analysis treats this as a correctness hazard rather than a residual to state.

---

### `kimi-analysis.md`

**Strongest argument:**
The **old-image hazard and its self-healing migration** (§1.1, §4) is the most elegant solution in the set. An old-image sync-mode backup or MATCH deletes the store's members from the cloud, but the migration's fold of `Saves-replaced/` is made *standing* and path-aware: members landing in `-replaced/<stamp>/.history/…` fold *back* to their original `<unit>/<seq>/`. The store then self-heals through the very mechanism that threatens it, with no name-mangling of members. The argument is correct, and the solution is decisive: it answers the namespace protection hazard without requiring a fleet-wide rule file upgrade.

**Weakest argument:**
The **same-device overlap hazard** (§2.3) is overstated. D-CLOUD-093's trade (an orphaned rclone no longer holds the lock) is deliberate and safe: the reconciler holds `L_T` itself post-R1, and a reconciler killed mid-pass leaves an orphaned rclone finishing a copyto — but the copyto is idempotent, and the next pass dedupes against the newest entry. The hazard exists, but the residual (a duplicate entry) is benign and the mitigation (adding a run id to the seq) is unnecessary.

---

## 2. Failure modes every analysis missed

### 2.1 The README's own exclusion

The delta adds `- /.history/**` to the allowlist, but the root `README.md` is not explicitly excluded. The shipped allowlist ends with `- /**`, so the README falls to that and is excluded — but if a user edits the file and removes the trailing `- /**`, the README becomes in scope for transfers. An old-image restore then copies the README down to `/storage/roms/README.md`, cluttering the device with a file the player was told was hidden. The hazard is real, and the fix is one line: add `- /README.md` explicitly ahead of every include.

**Experiment:** seed a cloud with `Saves/README.md`; run the shipped image's restore with a rules file lacking the trailing `- /**`; assert the README appears locally.

---

### 2.2 The `.rocknix/` manifest folder

The plan already has one hidden folder inside `Saves` that *must* sync: `savestates/.rocknix/manifest-<id>.json` (D-CLOUD-031). The delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely. The hazard is real: the manifest folder matches `+ /savestates/**` and is restored to devices today. The fix is two lines: the README must name both folders, and the allowlist must keep `- /savestates/.rocknix/**` (it is not in the shipped file).

**Experiment:** seed a cloud with `Saves/savestates/.rocknix/manifest-<id>.json`; run the shipped image's restore; assert the manifest appears locally. Repeat with the amended rules; assert it does not.

---

### 2.3 The MATCH deletion path

The menu map calls MATCH THIS DEVICE TO THE CLOUD "the only action that deletes" (`repo/docs/es-menu-map.md`). The delta's `reason: deleted` retains deletions, but MATCH's deletions go through an explicit list (the preview page), not through the classifier. The retain step must run on MATCH's deletions too, or the store loses the very bytes it exists to protect. The hazard is real: MATCH is the one action that deletes, and the delta does not say it retains those deletions. The fix is one sentence: MATCH's deletions go to `.history/` with `reason: deleted` by copy-then-delete over its explicit list.

**Experiment:** seed a cloud with a save; run MATCH from a guest missing that save; assert the save is in `.history/` with a record, not gone.

---

### 2.4 The exit sync's admission ceiling

The delta's retain-before-publish adds bytes to the exit sync's admission ceiling (R4/R5). On backends without server-side copy (SFTP/SMB), the retain streams through the device: a 30 MB PPSSPP state costs 60 MB through the handheld's Wi-Fi. The ceiling must count retain bytes, or a unit that would have cleared the ceiling for the publish alone stalls the exit sync on the retain. The hazard is real: the delta's "one small extra transfer" is two to four spawns, and the ceiling must weigh them. The fix is one sentence: the ceiling counts retain bytes, and when a unit defers, both the retain and the publish defer.

**Experiment:** seed a 30 MB state; run an exit sync against SFTP with a tiny ceiling; assert the pair defers, not only the publish.

---

### 2.5 The auto-heal fetch's budget

D-CLOUD-100's "the cloud's good copy is kept and restored" requires a fetch, and the exit path is defined as push-only (D-CLOUD-046). The delta does not say how the fetch is bounded. The hazard is real: an unbounded fetch on the exit card violates D-CLOUD-098's time-to-play budget. The fix is one sentence: *one bounded fetch per suspect unit on the exit pass*. The fetch is one unit's members, bounded, and rides the exit card — the card is exactly where D-CLOUD-098 permits spending the player's attention.

**Experiment:** truncate a save to zero; run an exit sync; assert the good copy is fetched and installed, and the fetch is bounded to the suspect unit.

---

## 3. Concrete revisions each proposal should make

### `claude-analysis.md`

1. **Drop the age cap** (§1.6). The hazard is real but bounded, and the mitigation (compare against server-side modtime) is unnecessary. The count and size caps carry the load.
2. **Add `- /README.md` to the allowlist row** (§1.1). The README is not explicitly excluded, and the hazard is real.
3. **Add the MATCH deletion path** (§1.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
4. **State the exit sync's admission ceiling counts retain bytes** (§2.6). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.

---

### `gemini-analysis.md`

1. **Add the namespace protection hazard** (§2.1). The delta moves the store inside the sync root, where exclusion survives only as the rule `- /.history/**` — and the shipped allowlist includes patterns that match at any depth. The hazard is real, and the experiment (seed a cloud with README + `.history/`, run the shipped image's backup/restore/MATCH) is the cheapest way to settle it.
2. **Add the MATCH deletion path** (§2.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
3. **State the exit sync's admission ceiling counts retain bytes** (§2.6). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.
4. **Drop the clock skew mitigation** (§2.6). The hazard is real but bounded, and the mitigation is unnecessary.

---

### `gpt-analysis.md`

1. **Add the self-healing migration** (§4). The delta's namespace protection hazard is real, but the migration's fold of `Saves-replaced/` is made *standing* and path-aware: members landing in `-replaced/<stamp>/.history/…` fold *back* to their original `<unit>/<seq>/`. The store then self-heals through the very mechanism that threatens it, with no name-mangling of members.
2. **Add the `.rocknix/` manifest folder** (§2.2). The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely.
3. **State the exit sync's admission ceiling counts retain bytes** (§3.1). On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it.
4. **Drop the auto-heal format-awareness** (§2.10). The delta's zero-length/all-one-byte test is the cheapest sufficient form, and a false positive is recoverable by construction.

---

### `kimi-analysis.md`

1. **Add `- /README.md` to the allowlist row** (§1.4). The README is not explicitly excluded, and the hazard is real.
2. **Add the `.rocknix/` manifest folder** (§2.2). The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. The outer README must declare both, and the allowlist must treat them oppositely.
3. **Add the MATCH deletion path** (§1.3). MATCH's deletions must go to `.history/` with `reason: deleted`, or the store loses the very bytes it exists to protect.
4. **Drop the same-device overlap mitigation** (§2.3). The hazard exists, but the residual (a duplicate entry) is benign, and the mitigation (adding a run id to the seq) is unnecessary.

---

## 4. Summary of revisions all proposals should adopt

| Revision | Why |
|---|---|
| **Count bound per save file, not per unit** | The maintainer's own example (auto-state churn evicting a manual slot) breaks under the unit key. |
| **Add `- /README.md` to the allowlist** | The README is not explicitly excluded, and the hazard is real. |
| **Add the `.rocknix/` manifest folder to the allowlist and README** | The plan already has one hidden folder inside `Saves` that *must* sync; the delta adds one that *must not*. |
| **MATCH's deletions go to `.history/` with `reason: deleted`** | MATCH is the one action that deletes, and the delta does not say it retains those deletions. |
| **The exit sync's admission ceiling counts retain bytes** | On backends without server-side copy, the retain streams through the device, and the ceiling must weigh it. |
| **One bounded fetch per suspect unit on the exit pass** | D-CLOUD-100's "restored" requires a fetch, and the exit path is defined as push-only. |
| **The migration's fold of `Saves-replaced/` is standing and path-aware** | An old-image sync-mode backup or MATCH deletes the store's members from the cloud; the fold absorbs anything written to `-replaced/` forever after. |
| **Dedupe against the newest entry** | If the newest store record's sha256 equals the current head's, skip the retain. |
| **Copy, never move** | A server-side *move* opens a window in which the head is absent — the unexplained-absence question D-CLOUD-037 makes the player answer. |
| **The retain and its publish are one atomic pair for deferral purposes** | When a unit defers, both the retain and the publish defer — a publish must never go out ahead of its retain. |

---

## 5. Register rows the delta must cite

The delta amends or supersedes these rows without saying so:

| Row | What the delta does | What it should say |
|---|---|---|
| **D-CLOUD-042** | Fixes the store's folder as `Saves-discarded` beside the saves folder. The delta moves the store inside `Saves/.history/` and does not cite 042. | "D-CLOUD-095 supersedes D-CLOUD-042's store-location clause." |
| **D-CLOUD-047** | Says "Propagated deletions and compactions are not retained as discarded saves; where `copy --backup-dir` proves reliable (Gate 7), the cloud's `-replaced/` sibling is their record and #25 labels them apart." The delta's `reason: deleted` retains deletions and retires `-replaced/`. | "D-CLOUD-095 supersedes D-CLOUD-047's retention exclusions for deletions; compactions still retain nothing." |
| **D-CLOUD-046** | Defines the exit path as push-only. The delta's auto-heal requires a fetch, and the exit card is exactly where D-CLOUD-098 permits spending the player's attention. | "D-CLOUD-100 refines D-CLOUD-046: one bounded fetch per suspect unit on the exit pass." |

---

## 6. The one register row to reopen

**D-CLOUD-096's age cap clause** should be reopened. The hazard is real but bounded, and the mitigation (compare against server-side modtime) is unnecessary. The count and size caps carry the load, and the age cap protects nothing they do not. The residual (a bad-clock writer's older entries mis-ordered) is small and bounded. The delta should drop the age cap, or gate it on a trusted clock.
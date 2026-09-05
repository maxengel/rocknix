# Cloud Saves: Visual Conflict Resolution — planning notes

Milestone: "Cloud Saves: Visual Conflict Resolution" (fork). Epic: issue #11;
tasks #19–#25. Captured 2026-07-26 from maintainer direction.

## Product vision
Vita-style: side-by-side screenshots of the cloud copy and the on-device copy,
walked system → game so the pass stays logical. Choices: KEEP CLOUD / KEEP
DEVICE / MERGE, with directional arrows + dimming making the survivor obvious.
Native EmulationStation only (console-first rule applies).

## Key decisions & rationale
- **Merge = re-slot, never overwrite**: conflicting savestate appends to the
  next free slot (or inserts, shifting later slots). Slot-limited cores get
  keep-one only. Game saves (SRAM) are binary-choice.
- **Manifests over mtimes**: sidecar metadata (game/ROM, UTC + local time,
  device friendly name via device-tree mapping, emulator/core + version,
  screenshot, slot, schema version). Detection compares against last-synced
  state — "both diverged" is the only true conflict.
- **Cross-device is the endgame**: saves portable; savestates keyed by
  (core, core-version, arch?) — compatibility table from #19 drives UI badges
  and whether cross-device resume is offered.
- **Sync model**: one player, many devices, never concurrent. Conflict cause:
  forgot to sync up on A → synced down/played on B → synced up.
- **Reversibility (V2, planned now)**: snapshot saves before applying any
  resolution; rollback restores byte-for-byte. Schema reserves the fields.

## Open questions

All four of the July questions were settled before execution began:

- Per-core state-header version sensitivity → run, not surveyed: `docs/savestate-compat-test.md` on the bench (#19, D-CLOUD-025).
- Screenshot source for cores without RetroArch thumbnails → none; savestates have a PNG (`savestate_thumbnail_enable = "true"`), in-game saves get a glyph, never a substitute image (#20, #23).
- Where the last-synced snapshot lives → locally under `/storage/.cache/`, never synced; the manifests that sync are the truth (IA doc § Where state lives).
- Friendly-name source of truth → `cloud_device_id --label` (devicetree model), already shipped (#49).

Still open at kickoff, owned by the futro below: the manifest shape (#20 against D-CLOUD-017), slot identity across renumbering (#24), and whether the shipped write paths gain `--update` before #22 gates them (D-CLOUD-029).

## Futro: Cloud Saves — Visual Conflict Resolution (epic #11; #19–#25, #10)

**Prepared:** 2026-09-05
**Scope of this futro:** the whole milestone as one execution batch — the design pair (#20 manifest, #24 slot identity), the bench run (#19), the backend (#21 capture, #22 detection, #10 per-core namespacing) and the wizard (#23). Does not cover #25 (V2 snapshots and rollback) beyond keeping the schema from precluding it; #25 gets its own futro when the wizard has shipped.

**Upstream retro consulted:** the mini-retro on #26 (2026-09-04), including its § Scoped audit findings and § Adjustments to remaining issues. No addenda were posted after it.
**Inputs considered:** #11 body and both comments (the cardinal rule; the 2026-09-04 kickoff); the eight sub-issue bodies and every comment thread; `docs/conflict-wizard-ia.md` rev 4; `docs/blindspot-register.md` (26 entries); `docs/decision-register.md` (D-CLOUD-016…028, D-QA-001…006, D-UI-017…021); `docs/savestate-compat-test.md`; `plans/conflict-resolution/vita-style-conflict-resolution.md`; audit `docs/audits/2026_08_24-milestone-cloud-saves-and-conflict-resolution/`; the shipped scripts under `projects/ROCKNIX/packages/network/rclone/`; the ES tree at `test/qa-integration` `e639beb45`; and the RG35XX SP itself, on image `6d03d93946`.

---

### 1. What do we know and what are we assuming?

**The plan (as written):** #19/#20 in parallel (bench run; manifest schema) → #21 (capture at write time) → #22 (detection: last-synced state, JSON for the UI) → #23 (Vita-style walkthrough, KEEP LEFT / KEEP RIGHT / KEEP BOTH, cloud always left, nothing transfers until COMPLETE) with #24 feeding it (merge = next free slot via ES's own allocator) → #25 later. #10 (per-core namespacing, D-CLOUD-017) rides along in the milestone. The retro re-ordered two things: #24's slot-identity question is critical path and blocks #20; #9 (adopt bisync) is a hard dependency of #22.

**Explicit assumptions we are relying on:**

- A conflict is *changed on both sides since they last agreed*, and nothing today decides one silently — **false as shipped, see §4.**
- `rclone bisync` (1.75.0) is the detector; its default `--conflict-resolve none` reports rather than picks; we resolve into slots ourselves and never let it rename a savestate loser.
- Device identity and label come from `cloud_device_id` / `--label`; no second identity is invented (#20, #21 grounding comments).
- The manifest travels with the saves because it sits inside the sync allowlist.
- ES's `getNextFreeSlot()`, `copyToSlot(slot, move)` and `renumberSlots()` are the merge primitives; the `.png` moves with the state.
- RetroArch writes a thumbnail beside every savestate; in-game saves have none and get a glyph.
- The audit log is append-only text at `/storage/.cache/log/cloud_audit.log` (D-CLOUD-027); whether a SQLite index sits beside it is #20's call.
- The three handheld families are all ARMv8-A aarch64 with globally pinned cores, so the compatibility badge may be a convenience — decided by running #19, not by reasoning (D-CLOUD-025).
- One player, many devices, never concurrent (#11). The lock (`take_cloud_lock`, exit 3) serialises callers on *one* device; nothing serialises two devices.

**Substrate-precondition check — what this work assumes EXISTS, verified on the RG35XX SP (image `6d03d93946`, 2026-09-05 ~05:30 UTC):**

| Primitive | Evidence | State |
|---|---|---|
| Model string distinct from build target | `tr -d '\0' < /proc/device-tree/model` → `Anbernic RG35XX SP`; `/etc/os-release` `HW_DEVICE="H700"` | present; the #19 identity AC is a wiring job |
| Stable device id + label | `cloud_device_id` → `ROCKNIX-ee5013fc56`; `cloud_device_id --label` → `Anbernic-RG35XX-SP` | present |
| rclone with bisync | `rclone version` → v1.75.0; `rclone bisync --help` lists `--recover`, `--resilient`, `--resync-mode` (default path1), `--workdir` default `/storage/.cache/rclone/bisync` | present; `HOME=/storage`, so the workdir is on persistent storage |
| Lock in every transfer script | `grep -c take_cloud_lock` → cloud_backup 2, cloud_restore 2, cloud_content_backup 2, cloud_content_restore 3 | present |
| Persistent log dir | `/storage/.cache/log/` exists (holds `journal`); `cloud_audit.log` not yet created — expected | present |
| Stamps | `/storage/.cache/cloud_sync/`: `last-backup`, `last-restore`, `last-content-*`, `device.json`, `content-systems`, `system-backup.uploaded` | present (underscore path; the IA doc's table still says `cloud-sync/`) |
| Savestate thumbnails | `retroarch.cfg`: `savestate_thumbnail_enable = "true"`, `savestate_file_compression = "true"`, `savestates_in_content_dir = "false"`, `sort_savestates_by_content_enable = "false"` | present; states are **compressed** and laid out flat per system |
| Savestate layout | `/storage/roms/savestates/fbn/mslug.state`, `.state1`, `.state.png`, `.state1.png`, `mspacman.state.auto(.png)`; systems fbn, gb, gba, genesis, nes | flat per system — **D-CLOUD-017's per-core directories are decided, not built** |
| In-game saves | `savefiles_in_content_dir = "true"` → `.srm` beside the ROM under `/storage/roms/<system>/`; allowlist `+ /**/*.srm` | present |
| ES merge primitives | `SaveStateRepository.h:20-21` `getNextFreeSlot`, `renumberSlots`; `SaveState.h:26` `copyToSlot(slot, move)`; `SaveStateRepository.cpp:98-99` pairs `.png` | present |
| ES per-core directory templates | `SaveStateConfigFile.cpp:51-55` substitutes `{{system}}`, `{{emulator}}`, `{{core}}` in `directory`; default `"{{system}}"` | present in code; no `es_savestates.cfg` found at `/usr/config/emulationstation/` or `/storage/.config/emulationstation/` on the device — **where the shipped one lives is an open item for #10** |
| Game-exit hook | `ls /usr/bin/scripts/game-end/` → absent; `FileData.cpp:836` runs `ThreadedCloudSync::start(window, "/usr/bin/cloud_backup --yes --saves-only --recent", …)` | the OS hook is gone; **#21's body still names it** (fixed in §5) |
| sqlite | `/usr/bin/sqlite3`, `/usr/lib/libsqlite3.so.0` | present |
| Allowlist excludes databases | `cloud_sync-rules.txt` begins `- /**/*.db`, `*.db-wal`, `*.db-shm`, `*.db-journal`, `*.sqlite`, `*.sqlite3` | present (the #20 suggestion was applied) |

**Allowlist behaviour, tested rather than read** — fixture tree on the device, `rclone lsf -R --files-only --filter-from /storage/.config/cloud_sync-rules.txt`:

```
passes:   savestates/.rocknix/states-ROCKNIX-ee5013fc56.json
          savestates/fbn/.cloud-meta.xml
          savestates/fbn/mslug.state1  .state1.png  .state1.json  .state1.manifest
          savestates/fbn/snes9x/mslug.state2
          snes/game.srm
excluded: snes/game.srm.json   snes/game.srm.manifest   snes/.cloud-meta.xml   snes/game.sfc
```

So **any manifest shape works for savestates** (`+ /savestates/**` precedes `- /**/*.xml` and `- /**`), and **no sidecar beside an in-game save syncs at all** — `.srm` passes only because of `+ /**/*.srm`, and the file ends `- /**`. A manifest for in-game saves must live under `savestates/` (or a new `+` rule must be added, and `- /**/*.xml` means XML is out anywhere else). This was not written anywhere before today.

**Build-vs-adopt re-validation.** The retro's PASS stands: bisync (adopt; #9 now a dependency), ES's own slot allocator (adopt), pugixml/JSON already in ES (adopt), sqlite present on the device (adopt if #20 wants the index), FontAwesome glyphs verified present (adopt). `cloud_oauth` stays bespoke per D-CLOUD-001. Nothing drifted.

**Confidence:** mixed. The design is unusually well worked (three revisions, several answers read out of ES's code), the substrate is present, and the bench is assembled. But §4 finds that the shipped transfers already resolve conflicts by recency, which the plan assumes they do not — the milestone's first job is to stop that, and no issue owned it until now.

---

### 2. What known unknowns need investigation?

| Unknown | Treatment | Owner / task |
|---|---|---|
| Is chipset a compatibility axis at all, and is a failed load loud or silent? Decides whether #23's badge is a safeguard or a convenience (D-CLOUD-025). | **Investigate before #23's badge is designed** — run `docs/savestate-compat-test.md` on the bench (H700 ×2, RK3326, RK3566, ~1 h of the maintainer's hands; all devices on one build). Does not block #20/#24/#21. | #19 |
| Does `tools/cloud-round-trip` pass? It carries eleven deferred criteria and the three `--recent` steps and has **never executed** (#35). | **Investigate before #22** — needs a GENERIC_X64 image; the `generic-x64` worktree is checkout-only, so this is a cold build (hours, disk is fine: 3.3 TB free). Start it now in the background so it is ready when #22 begins. | #35; task "build GENERIC_X64 for the round-trip run" |
| Which manifest shape? Three are in play: per-save sidecar (IA doc, #20 2026-08-24), one XML per directory (#20 2026-08-18), one JSON per device under `savestates/.rocknix/` (D-CLOUD-017 via #10 2026-09-01, a maintainer's call). | **Design decision inside #20, first task of the batch**, constrained by: the allowlist test above (XML is excluded outside `savestates/`; nothing beside an `.srm` syncs), D-CLOUD-017's multi-writer argument (each device writes only its own file), and #24's identity question. Record the outcome as a register row citing D-CLOUD-017. | #20 |
| What keys a savestate across renumbering? ES renames on delete; sync sees delete+create. | **Design decision inside #20/#24** — the candidates are already named (content sha256 in the manifest = identity of a version; the audit log = lineage). Cannot be probed; must be decided before the schema is written. | #24 → #20 |
| How does bisync behave against a real remote with compressed savestates, a device-side rename, and a genuine both-sides change — and what does its listing state look like after an interrupted run? | **Spike inside #22 before any code**: a fixture run against `tools/cloud-test-backend` (WebDAV, loopback, D-QA-002) with `--dry-run`, then one against Dropbox from the device; record `--conflict-resolve none` output shape and confirm `--recover`/`--resilient` avoid a `--resync`. | #22 |
| Where does the shipped `es_savestates.cfg` live, and does RetroArch honour a per-core directory ES computes? (`{{core}}` is substituted in `SaveStateConfigFile.cpp:55`; the file was not found at either expected path on the device.) | **Investigate before #10** — `find` the image root for `es_savestates.cfg`; read how ROCKNIX launches RetroArch (`--savestate-directory`?). | #10 |
| Do the write paths gain `--update` on the game-exit upload now, as a stopgap, before #22 gates them properly? | **Maintainer's decision** — parked as D-CLOUD-029 (open) with home #22; see §4 for why it matters and what it does not fix. | #22 / register |

---

### 3. What patterns from prior work apply that we haven't named?

- **Read the answer out of the running system before designing.** Three rev-3 decisions came from reading `SaveStateRepository.cpp` rather than choosing (no 99-slot ceiling; append-not-fill; the `.png` moves with `copyToSlot`). The screenshot-fallback question was closed by `retroarch.cfg` on a device. Today's allowlist fixture test is the same move and found a constraint nobody had written down. **Apply to every remaining design question**: bisync's actual output, RetroArch's actual directory handling, the actual `es_savestates.cfg`.
- **Prove the guard fires** (retro § What worked well; `engineering-practices.md` *Guards must fail closed*). The lock, `CONFLICT_EXCLUDES`, the size assert were each run against the violation they exist to catch. #22's "no transfer for divergent items" is a guard of exactly this kind and needs a constructed both-sides change that it is *seen* to refuse.
- **The label-diff and the `strings` check** caught what reading a diff did not. The wizard's ACs should be checked by `strings` on the built ES and by `tools/vm-visual-qa` frames, not by reading `GuiMenu.cpp` (blindspot 13).
- **`cloud_device_id` and `take_cloud_lock` already exist** (#49, `b9ea9f3fe8`); the grounding comments on #20/#21/#22 say so. Blindspot 1 (assumed-undone) has hit this milestone's neighbours twice; every task that reaches for an identity or a lock reuses these.
- **Migrations copy, verify, then delete** (D-CLOUD-026 superseding D-CLOUD-016 after #57). #10's per-core layout change and any KEEP BOTH re-slotting are migrations of player data and follow the same shape: `copyToSlot(slot, move=false)`, verify, then remove the source.
- **A prompt is a failure mode** (`upgrade-and-install.md`). The wizard *is* a prompt, deliberately — it exists for the one case where the choice is genuinely the player's. Everything else (cloud-only, device-only, identical) is applied silently, as the IA doc says; keep it that way when tempted to "confirm" more.
- **Two surfaces for one event; an operation whose only report is transient** (`es-native-ui.md`). The wizard ends in a page that outlives the apply step and says what changed per side; the audit log is the durable record; neither replaces the other.

---

### 4. What could we be missing?

**Agent-execution simulation ("what if?" walkthrough):**

> Archetype simulated: a fresh agent handed #22 with the issue body, the IA doc, and repo access — no memory of today.

- **Step 1 (it reads "detect real conflicts instead of trusting timestamps" and builds a bisync-based detector that runs from the SYNC SAVE DATA row).** What if it never asks what the *other* transfers do meanwhile? Today those are, verified in source and on the device:

  ```
  autostart/102-cloud-saves:21   /usr/bin/cloud_restore --yes --method=copy --update
  autostart/102-cloud-saves:22   /usr/bin/cloud_backup  --yes --method=copy --update
  GuiMenu.cpp (SYNC SAVE DATA)   the same pair
  FileData.cpp:836 (game exit)   /usr/bin/cloud_backup --yes --saves-only --recent
  cloud_backup:639-646 (--recent) --max-age Ns --no-traverse, BACKUPMETHOD forced to copy, no --update
  ```

  `copy --update` skips only files newer on the destination. A file changed on both sides is therefore resolved at boot **by whichever is newer** — the older progress is overwritten with no record — and the game-exit `--recent` upload, which has no `--update` at all, overwrites the cloud copy whenever the local one differs, even if the cloud's is the newer. **The shipped two-way sync is newest-wins.** It is precisely what the cardinal rule on #11 forbids, and it runs before any detector the agent writes gets a look. The wizard would trigger only for the residue those passes happened to skip.
  **Plan change:** #22 owns the write paths, not just a detector. ACs added (§5): every transfer that can touch a save that changed on both sides since the last agreement either defers it to the wizard or refuses it; a constructed both-sides change is seen to be refused by the boot pass, the game-exit pass and the SYNC row. Stopgap decision parked as D-CLOUD-029: adding `--update` to the game-exit upload turns clobber into skip (the cloud's newer copy survives; the local one waits for the wizard), at the price of `--recent` no longer pushing a save whose cloud copy is newer — which is exactly the case that should wait.

- **Step 2 (it runs bisync for the first time).** What if the first run, or any run after an interruption, needs `--resync`? `--resync-mode` defaults to **path1** — a winner-picks-all pass over the whole tree. An agent that scripts `bisync … || bisync --resync` to "make it work" ships a recency-free data-loss tool.
  **Plan change (AC on #22):** the detector never passes `--resync` on its own; the first run is an explicit, maintainer-driven step; use `--recover` and `--resilient`; the workdir stays at its default `/storage/.cache/rclone/bisync` (persistent, `HOME=/storage`) and is named in the script so a future change of `HOME` cannot move it under `/var`.

- **Step 3 (it writes manifests "beside each save").** What if it puts `game.srm.json` beside the `.srm`? It does not sync (fixture above), the cloud side of every in-game-save conflict has no manifest, and the wizard shows two blank panels for the commonest conflict kind. Nothing errors.
  **Plan change (constraint on #20/#21):** manifests live under `savestates/` (any shape) or the allowlist gains an explicit `+` for them; `- /**/*.xml` rules XML out anywhere else. The fixture command above is the acceptance test.

- **Step 4 (it stamps pre-existing saves at sync time so the panels are not blank).** What if? That is the false-attribution trap named on #10 and #20 — a state pulled from another device gets stamped as ours.
  **Plan change:** already in #20's comments; promoted to an AC: `unknown` is a first-class value the wizard renders honestly; nothing stamps a file it did not write.

> Archetype re-run: the maintainer, testing the wizard on the bench with two H700s in October.

- **They resolve a savestate conflict with KEEP BOTH, and the merged copy lands in slot 3.** What if the *other* device also has a slot 3 by the time it syncs? The IA doc's answer — apply non-conflicts first so free-on-device equals free-on-both — holds only if the detector has downloaded every cloud-only state before the wizard opens. If the wizard opens from a bisync *report* without that pre-pass having run, the merge collides at the next sync and one resolved conflict becomes a new one.
  **Plan change (AC on #23):** the wizard refuses to open until the pre-pass is complete and says so.

- **They pick KEEP RIGHT on an in-game save and *keep discarded saves* is off (default).** The losing copy is gone. That is by design (rev 2/3) — but the audit log is "support-only" (D-CLOUD-027), so nothing on screen afterwards tells them which save they discarded.
  **Plan change (AC on #23):** the done page names each discarded copy per game, and the audit line for it is written *before* the apply step deletes anything.

**Pre-mortem (30 days out):**

- **Imagined failure:** "On 2026-10-08 the maintainer's Metroid save on the RG353M reverted to a week-old state. Root cause: the RG-SP's boot sync (`copy --update`) uploaded its newer-but-shorter save; the wizard never opened because bisync only runs from the menu. Review missed it because #22's ACs were about classification, not about the passes that run without asking." — the Step-1 finding, as an incident. **Plan change:** as above; plus #35's round-trip suite gains a two-device both-sides-changed step that must end with *neither* copy overwritten.
- **Imagined failure:** "The wizard shipped; nobody used it; a `.state1.conflict1` file appeared in Dropbox and vanished from the savestate manager." Root cause: bisync was allowed to rename a loser. **Plan change:** already an AC in spirit; made literal — `--conflict-loser` is never left at its default on a savestate tree; the detector's dry run is grepped for `conflict` in filenames as a guard.
- **Imagined failure:** "Wizard built at 640×480, thumbnails unreadable on the RG351M at 480×320; the picker's one advantage over a list of dates was gone." (#23 comment of 2026-08-23.) **Plan change (AC on #23):** lay out at 480×320 first; `tools/vm-visual-qa` frames at both sizes are the evidence.

**Blindspot check (against `docs/blindspot-register.md`, 26 entries):**

- **1 Assumed-undone** — applies. `cloud_device_id`, `take_cloud_lock`, the allowlist `*.db` exclusions, ES's slot primitives all exist. Mitigation: the substrate table above; every task starts from it.
- **8 Synthetic fixtures** — applies to the bisync spike and to #35: the fixture must be run against a real remote from the device at least once, not only against loopback WebDAV.
- **9 Futro predictions as decisions** — applies to *this* document: the `--update` stopgap and "manifests under `savestates/`" are hypotheses until run. Hence D-CLOUD-029 is parked open, and the allowlist claim is backed by a run.
- **10 Fixing forward only** — applies to #10's layout change and to #21's capture: existing states have no manifest and stay `unknown`; a per-core directory move must read both layouts (`upgrade-and-install.md`).
- **13 Assumed-done** — the wizard's ACs are UI behaviours; tick only on frames or on the maintainer's presses.
- **14 A guard stored inside what it guards** — bisync's listings live in `/storage/.cache/rclone/bisync`, outside the synced tree: good. The audit log is outside too. Keep the history index (if any) outside `savestates/` for the same reason (the IA doc already says so).
- **21 Boundary at the wrong granularity** — **this is the allowlist finding.** The rules divide by directory for savestates and by extension for in-game saves; a sidecar falls between the two. Canonical instance updated (§5).
- **22 A probe that cannot report absence** — applies to any "is there a conflict?" check built on `rclone lsjson --stat` or on grepping bisync's output: a silent run must be distinguishable from "no conflicts".
- **23 Replaced mechanism** — applies if #22 replaces the `copy --update` pair with bisync: enumerate what the pair guarded (`--update`'s newer-on-destination skip; the boot ordering restore-then-backup; the `--recent` window) and name a home for each.
- **New — 27 (added below): supersession that lives only in a comment.** Three instances in this milestone's own issues: #21's body still names the removed `/usr/bin/scripts/game-end/` hook although its grounding comment says it is gone; #20's body predates D-CLOUD-017 and three comments propose three manifest shapes; #10's title still says "per-chipset/arch" after D-CLOUD-017 keyed on core. `issue-tracking.md` already demands the body edit in the same action; the register records that it was skipped three times.
- **New — 28 (added below): two non-destructive one-way transfers composed into a two-way sync are a recency resolver.** `copy --update` down then `copy --update` up reads as "safe both ways" and is newest-wins by construction. Guard: any two-way path names its conflict rule explicitly, and a both-sides-changed fixture is in the suite.

**Replaced-mechanism archetype:** #22 will replace (or wrap) the `102-cloud-saves` pair and the SYNC row's pair. What the old ones held: the newer-on-destination skip, the restore-before-backup ordering (a device that has been away gets the cloud's state before pushing), the lock, the `--recent` window on exit, the stamps in `/storage/.cache/cloud_sync/` that GAME SETTINGS reads (D-UI-018). Each needs a named home in the new design before the old one goes.

**Honesty check:** the first archetype found the write-path gap; the second found the pre-pass gate and the discard visibility; neither returned clean.

---

### 5. What adjustments or investigations must happen BEFORE execution?

**Plan edits applied (issue bodies, same session):**

- **#22** — scope widened from "detector" to "owner of the write paths". ACs added: (a) a both-sides-changed save is refused (not resolved) by the boot pass, the game-exit pass and the SYNC row, shown by a constructed fixture; (b) the detector never runs `--resync` on its own and uses `--recover`/`--resilient`; (c) `--conflict-loser` is never left to rename a savestate; a dry-run listing grepped for `conflict` is the guard; (d) the bisync workdir is named explicitly and lives outside the synced tree; (e) every call takes `take_cloud_lock`; (f) the replaced-mechanism inventory above is answered in the issue before the old pair is touched.
- **#21** — hook point corrected: capture runs where the game-exit sync already runs (`FileData::launchGame` → `ThreadedCloudSync`, `e74fe4e58a`), never a revived `/usr/bin/scripts/game-end/`; sidecars for in-game saves must pass the allowlist (fixture command as the AC); nothing stamps a file it did not write; `unknown` is rendered, not guessed.
- **#20** — constraints section added: pick one manifest shape against D-CLOUD-017 (per-device JSON under `savestates/.rocknix/`, each device writes only its own), the allowlist result, and #24's identity; `- /**/*.xml` excludes XML outside `savestates/`; identity via `cloud_device_id`; the outcome is a register row citing D-CLOUD-017.
- **#10** — title and summary aligned with D-CLOUD-017 (key on core; core build as data in a per-device manifest; arch/chipset dropped); open item added: locate the shipped `es_savestates.cfg` and confirm RetroArch honours the computed directory.
- **#23** — ACs added: the wizard opens only after the non-conflict pre-pass has completed; the done page names discarded copies per game and the audit line precedes the deletion; layout proven at 480×320 and 640×480 by `tools/vm-visual-qa` frames.
- **#35** — gains a two-device both-sides-changed step whose pass condition is that neither copy was overwritten.
- `plans/conflict-resolution/vita-style-conflict-resolution.md` — open questions refreshed (four of four were settled since July); this futro appended.
- `docs/conflict-wizard-ia.md` — one line: the stamps directory is `cloud_sync/` (underscore), as the doc's own open-questions note already says.

**Investigation tasks opened (todo + tracker):**

- Run `docs/savestate-compat-test.md` on the bench before the badge is designed (#19; maintainer's hands, ~1 h).
- Build GENERIC_X64 in the background now; run `tools/cloud-round-trip` (#35) before #22 begins.
- bisync spike inside #22: fixture against the loopback WebDAV, then Dropbox from the device; record output shape; confirm no `--resync` path.
- Locate `es_savestates.cfg` in the image and RetroArch's directory handling (#10).

**Documented unresolved assumptions (proceeding without resolving):**

- The compatibility badge's severity (safeguard vs convenience) is unknown until #19 runs. #20/#24/#21 proceed because their schema carries core name + build pin regardless; only #23's badge waits.
- Whether the SQLite history index is still wanted beside the text audit log — #20 decides; the schema does not depend on it.
- Two devices are never online at once (#11's model). Not enforced; the lock is per device. Accepted for this drop; the audit log will show if it is violated.

**Blindspot register updates:** entries 27 and 28 added (above); entry 21's canonical instances extended with the allowlist sidecar result.

**Decision register:** D-CLOUD-029 parked open — *do the write paths gain `--update` on the game-exit upload now, before #22 gates them properly?* Home #22.

---

**Futro complete.** Ready to proceed to Step 3 for the design pair (#24 slot identity → #20 manifest) and the two background investigations (GENERIC_X64 build; #19 bench scheduling). **Pause on #22 and #23's badge** until the round-trip suite has run and the bench result is in.

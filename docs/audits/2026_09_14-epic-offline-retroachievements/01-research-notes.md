# Research Notes — Epic #163 "Offline RetroAchievements"

**Auditor:** Code Auditor skill v1.10.0, Epic tier, one orchestrator, serial
**Date:** 2026-09-14
**Subject:** Epic #163 and sub-issues #164 #165 #166 #167 #168 #172 #173 #175 #176 #179 #180 #183 #184, at the state of the two `feature/round-notes-rc5` branches (the sixth candidate's content)
**Spec:** the issue bodies and their comments on maxengel/rocknix (issues are the spec here); register rows D-RA-001..014, D-RA-016, D-UI-053..055, D-WORKFLOW-020/021/022, D-QA-016, D-INFRA-010/011 in `docs/decision-register.md`; `docs/ra-offline/2026_09_13-phase-1-design-note.md`
**Model:** Claude Fable 5.1 (`claude-fable-5-1`), effort xhigh

---

## Running Notes

### 1.0 Trees under audit (read-only)

| Tree | Branch | Tip | Base | Commits on top of base |
| --- | --- | --- | --- | --- |
| distribution `/workspace/repos/rocknix.worktrees/round-notes-rc5` | `feature/round-notes-rc5` | `cee1656c33` | `next` at `95e4961fb3` (merge-base) | 4: `451a8b1021` (patch 004, D-RA-014), `aa9227d83d` (patch 004 regenerated), `8c03cbb6e7` (index-fed scan/topup, D-RA-013), `cee1656c33` (docs) |
| EmulationStation `~/Development/emulationstation-next.worktrees/round-notes-rc5` | `feature/round-notes-rc5` | `ec2de8ae7` | `test/qa-integration` at `df9d88171` | 6: `77d62d8e8` (row says (BETA)), `c77f39fd9` (French), `3fd70aa68` (page reshaped), `ee7af6182` (switch-on offers scan), `634301ce4` (counts line), `ec2de8ae7` (index-fed cache, hasher recovery id) |

`next` has moved four docs-only commits past the distro branch's merge-base (`cc0fe85ac6`, `93fa633258`, `4c222e0e24`, `ec4a74937d` — register rows D-RA-014/013/016 and the work log). The brief's "`next` at `4c222e0e24`" names the register state, not the code base; no code differs. The distro's ES pin (`projects/ROCKNIX/packages/ui/emulationstation/package.mk:5`) is `df9d88171` — the ES branch's **base**, so no image yet carries the six ES commits (expected: the sixth candidate is not built, per the maintainer).

**Most of the epic's code is already on `next`** (RC-1..RC-5 merged): the package `6e35a5fd04`, the scripts `df9407007e`, backuptool hold-back `41ea4f6fcb`, 099-networkservices `1a5c066623`, patches 001–003 (`43b4a62909`, `51e2acece6`, `67a89cb623`), the ctl's scan/topup/ready `d0de5f3658` and pending-ids/account `ead25d7497`, rchash library `5e4125ac8c`, #176's redaction (`80edc086fd`, `f3f67908f5`, `4ccad1a214`), the fixture (`4faa9471ef`, `0ddfbddf0e`), `qa-accounts` (`3afa3930ff`). The audit reads the whole epic at the branch tips, not only the six + four commits.

### 1.1 The spec, as the issues state it

The epic's stated experience (D-RA-008, maintainer 2026-09-14): *a player with offline achievements on never has to care whether the device is connected to trust that casual achievements earned while playing are credited.* Mechanism: misantronic/RAOfflineProxy's Linux client (stdlib Python, pinned `64d03d3063`) packaged natively, a loopback service on 127.0.0.1:8080, RetroArch and PPSSPP pointed at it per launch from the appendconfig (`setsettings.sh`, `cheevos_ppsspp.sh`), casual-only (hardcore forced off with a sentence, D-RA-002), a queue on `/storage` flushed on reconnect (upstream's flusher + fork patch 003 stamp), messages riding the sync cards (D-RA-004), a library scan and an on-connect top-up fed by the interface's game index (D-RA-010/013), the achievements pages reading the proxy's cache offline (D-RA-009/011), no cap (D-RA-014), everything contributed back (D-RA-016).

Five open questions the epic body posed are settled in the register: system-wide (D-RA-001/002), hardcore (D-RA-002), packaging (#165 comment 2026-09-13 17:57), trust/privacy (D-RA-002: the token cache never travels; D-INFRA-010/011), upstream (D-RA-016, phase 5).

**Ambiguities flagged for Phase 2:**
- D-RA-004's provisional wording ("SYNCED") was superseded by the maintainer's call of 2026-09-14 ("sync" stays the saves' word, achievements are **sent**) recorded only in the #173 comment of 00:29 and in D-UI-022's reservation — no D-RA row states the final wording. The strings shipped as "SENT". I audit against "sent".
- #173 AC 3 ("with the proxy off, the same exit says the award was not recorded — #162 option 1") is contradicted by what shipped (saves-only sentence, no award sentence with the toggle off); the #173 comments of 02:16 and 03:04 name the discrepancy and leave it "for the wording pass". Body not amended (blindspot 27 shape).
- #179 AC 2 says "never exceeds the cap" while D-RA-014 removed the cap; body not amended.
- The register has **no D-RA-015** (numbering jumps 014 → 016). `tools/register-check` is about duplicates and dangling citations, so a gap is not an error; recorded as an observation.
- #184's checkboxes are ticked "when it is in a candidate and seen on the device" — all unticked; the sixth candidate is not built. These are handheld-owned and will be SKIP with the location recorded.

### 1.2 Issue inventory and acceptance criteria (verbatim, numbered for Phase 2)

| ID | Issue | Criterion (verbatim, abbreviated where long) | Ticked in body |
| --- | --- | --- | --- |
| AC-163-1 | #163 | D-RA-001 settled (system-wide vs per emulator; hardcore stance; fork-first vs upstream-first). | no |
| AC-163-2 | #163 | A milestone exists with its acceptance test in the description, or the maintainer decides this rides an existing one. | no |
| AC-163-3 | #163 | Sub-issues for the phases above, attached as GitHub sub-issues. | no |
| AC-164-1 | #164 | A design note in `docs/` answering each question above with file and line references into the pinned upstream commit. | yes |
| AC-164-2 | #164 | D-RA-002 settled: the hardcore stance in the fork's toggle; the token/credential handling against D-INFRA-010; RetroArch first, PPSSPP after, or both. | no |
| AC-164-3 | #164 | The upstream commit to pin, and the list of things the fork would want to contribute back. | no |
| AC-165-1 | #165 | `tools/pkgcheck` clean; the package builds for GENERIC_X64 and H700. | no |
| AC-165-2 | #165 | Toggle on: the service runs, `retroarch.cfg` carries the proxy host, a game launched online is cached; toggle off: the service stops and the config is restored to what the player had. | yes |
| AC-165-3 | #165 | The settings backup carries the toggle and never a token (D-INFRA-010; `tools/last-good-scripts-test` proves it). | yes |
| AC-165-4 | #165 | Frames of the page at 640x480 and 1280x800 in English and French. | yes |
| AC-166-1 | #166 | The scenario passes on a QA guest, recorded in `docs/vm-qa-log.md` with frames of the exit and reconnect messages in both languages. | yes |
| AC-166-2 | #166 | The same scenario with the toggle off reproduces #162's loss (the control). | yes |
| AC-166-3 | #166 | The `vm-qa` fixture exists and is in the runner's suite list. | yes |
| AC-167-1 | #167 | The award survives an exit with the link down and is recorded on reconnect, on the handheld. | no |
| AC-167-2 | #167 | The messages at exit and reconnect read right on the 640x480 panel. | no |
| AC-167-3 | #167 | #161's cause named from the journal. | no |
| AC-168-1 | #168 | The docs page prepared alongside the fork change. | no |
| AC-168-2 | #168 | Upstream PRs opened or the reasons not to recorded here. | no |
| AC-173-1 | #173 | Exit with the link down and a pending award: the sentence appears (frame, EN/FR). | no |
| AC-173-2 | #173 | Reconnect: the recorded sentence appears within a minute (frame, EN/FR). | no |
| AC-173-3 | #173 | With the proxy off, the same exit says the award was not recorded (#162 option 1). | no |
| AC-173-4 | #173 | `tools/vm-qa` fixture drives it (#166 box 3). | no |
| AC-175-1 | #175 | The write that flips the switch is named (file:line) from a reproduction on a guest with the link cut at boot. | yes |
| AC-175-2 | #175 | A failed boot-time login never changes `global.retroachievements`; the page shows the switch on and the login retried when the network arrives. | yes |
| AC-175-3 | #175 | Frame at 640x480 of the main menu still holding RETROACHIEVEMENTS after such a boot. | yes |
| AC-176-1 | #176 | `setsettings.sh` (or whatever writes the appendconfig lines to `exec.log`) redacts the value of every credential key it logs — the key name stays. | yes |
| AC-176-2 | #176 | `rocknix-evidence` scrubs credential-shaped lines from every file it bundles, with a suite check in `tools/last-good-scripts-test` that plants a value and fails before / passes after. | yes |
| AC-176-3 | #176 | On a guest with the QA account: a launch, then `grep -c` of the planted value across `/tmp/exec.log` and the evidence bundle -> 0. | yes |
| AC-179-1 | #179 | On the VM: a game never started while connected (Böbl), after the chosen caching path has run while online, starts offline with `logged in successfully`, `Identified game`, and `achievements active` through `127.0.0.1:8080`; an unlock in that session is `queued_offline` and credited after the link returns. | yes |
| AC-179-2 | #179 | The caching path never runs while offline, never exceeds the cap, and logs what it cached and what it skipped (unrecognised ROMs skipped silently, as the proxy does). | no |
| AC-179-3 | #179 | The OFFLINE ACHIEVEMENTS page tells the player, in one line, which games earn offline (or that all recently played ones do), in EN and FR. *(amended by comment: the page shows how many games are ready for offline play and offers the scan)* | yes |
| AC-179-4 | #179 | Wording and behaviour on the RG SP with the maintainer's own library, once. | no |
| AC-180-1 | #180 | VM: link off, the achievements page of a cached game lists its achievements with badges and the player's unlocks (frame at 640x480, EN/FR). | yes |
| AC-180-2 | #180 | VM: an achievement unlocked offline appears on that page as earned-pending before the link returns, and as earned after the flush. | no |
| AC-180-3 | #180 | VM: a never-cached game shows the one-line explanation, not an empty page or a spinner. | no |
| AC-180-4 | #180 | RG SP: the maintainer turns Wi-Fi off and views a played game's achievements. | no |
| AC-183-1 | #183 | On the VM, with RETROACHIEVEMENTS on and the startup index setting on, a rebooted connected guest indexes its games (hasher lines in the log, `cheevosId` in memory), and `VIEW THIS GAME'S ACHIEVEMENTS` appears for a game with a set. | no |
| AC-183-2 | #183 | The cause of (2) named: gamelist keys read, or `isCheevosSupported()` on this image. | no |
| AC-183-3 | #183 | If the fix is in the interface, a unit test or a walk frame pins it. | no |
| AC-184-1 | #184 n.1 | The beta word belongs in the row label, not the subtitle (D-UI-053). | no |
| AC-184-2 | #184 n.2 | The page: (BETA) in the title, the two options first, then a little space, then one block of text; '!RA!' quoted (D-UI-054). | no |
| AC-184-3a | #184 n.3a | Turning the switch on offers the scan (D-RA-012). | no |
| AC-184-3b | #184 n.3b | How the startup index and the offline cache relate (D-RA-013). | no |
| AC-184-4 | #184 n.4 | The scan dialog in complete sentences, without the API remark (D-UI-055). | no |
| AC-184-5a | #184 n.5a | The page counts the games with achievements it added, nothing about the ones without. | no |
| AC-184-5b | #184 n.5b | Should the scan draw on the existing RetroAchievements index? (D-RA-013, built). | no |
| AC-184-6 | #184 n.6 | No cap on how many games earn offline (D-RA-014). | no |
| AC-184-A | #184 | Every note above has a home and, once built, a frame at 640x480 (EN/FR) or the maintainer's word on the device. | no |
| AC-184-B | #184 | The notes' branch merges into `test/qa-integration` / `next` for the sixth candidate. | no |
| REG-RA-002 | register | System-wide toggle; hardcore off with the sentence, never silently; per-core parked; token cache never travels. | — |
| REG-RA-003/005 | register | Synthetic 101000001 never reaches the emulator; the toggle has its own page. | — |
| REG-RA-004 | register | Messages ride the sync cards; no separate monitor; link not mentioned (wording as superseded: *sent*). | — |
| REG-RA-007 | register | Fully-offline proof, VM first, for a game played once online and one never played online. | — |
| REG-RA-010 | register | Scan on the page, fourth-tier surface; verb is scan; on-connect top-up; one outcome line under the row. | — |
| REG-RA-011 | register | Page source: web online, proxy offline by `online_state.json`; network-class failure falls back; two shapes read; `Unlocked` without a date; queued marker; never-cached dialog; no second cache; 204 is not an image. | — |
| REG-RA-012 | register | Switch-on offers the scan; offline, one line saying to scan when connected. | — |
| REG-RA-013 | register | Scan/top-up read the index; top-up caches every uncached game; page says NEW GAMES ARE ADDED...; GAME INDEXES text changes while on. | — |
| REG-RA-014 | register | No cap; throttle kept. | — |
| REG-RA-016 | register | Contribute back, each on the maintainer's go. | — |
| REG-UI-053/054/055 | register | (BETA) in the row name; options first then one block, '!RA!' quoted; complete sentences, no machinery. | — |
| REG-WF-020/021/022 | register | One RC carries both; issues found during a build fixed before release; #178 not a gate. | — |
| REG-INFRA-010/011 | register | A credential never crosses a script boundary; never reaches a log or bundle; `redact_credentials` in `001-functions`. | — |
| REG-QA-016 | register | RG35XX SP is the testing-only handheld after the H700 round; D-QA-015 governs until then. | — |

Count: 50 issue criteria (incl. #184's 10) + 14 register rows/groups = 64 entries for Phase 2. #172 has no criteria (parked by D-RA-002) — recorded as SKIP with its home.

**Ticked boxes (18 of 50)** — each is re-derived in Phase 2 from primary artifacts; a false tick voids its siblings.

### 1.3 What code changed (both trees)

**Distribution** (`git log --since=2026-09-12` over the scope, 23 epic commits):
- `projects/ROCKNIX/packages/network/raofflineproxy/` — `package.mk` (140 l), `patches/001..004` (63/59/81/27 l), `sources/raofflineproxy-ctl` (1086 l), `sources/raofflineproxy-cache-indexed` (183 l), `system.d/raofflineproxy.service` (32 l), `daemons/006-raofflineproxy` (10 l). Pulled in by `projects/ROCKNIX/packages/virtual/network/package.mk:13`.
- `raofflineproxy-rcheevos/package.mk` (20 l), `raofflineproxy-libchdr/package.mk` (20 l) — source-only, for `libraproxy_rchash.so`.
- `projects/ROCKNIX/packages/rocknix/sources/scripts/setsettings.sh` (1363 l; proxy branch + #176 redaction), `runemu.sh` (556 l; #176 redaction, the lowerdeck host at `:290`), `projects/ROCKNIX/packages/emulators/standalone/ppsspp-sa/scripts/cheevos_ppsspp.sh` (86 l — **not** under `rocknix/sources/scripts/` as the brief guessed), `projects/ROCKNIX/packages/rocknix/autostart/099-networkservices` (45 l), `autostart/001-functions` (`redact_credentials`), `rocknix-evidence`, `backuptool` (`RATOKENDIRS`).
- `tools/ra-offline-test` (403 l), `tools/qa-accounts` (137 l), `tools/last-good-scripts-test` (1627 l; cases k p q r s + ctl cases), `tools/vm-qa` (`ra-offline` suite, `--guest d`).
- Observation: `sources/__pycache__/raofflineproxy-cache-indexedcpython-314.pyc` sits in the worktree, **untracked** (`git ls-files` empty; gitignored) — a stray from a host run of the helper, not a repo defect. Does `package.mk` install `sources/` wholesale? Checked in Phase 2 (AC-165-1).

**EmulationStation** (`git log --since=2026-09-12`, 20 epic commits): `OfflineAchievements.{h,cpp}` (121/253), `OfflineAchievementsText.{h,cpp}` (120/247), `guis/GuiOfflineScan.{h,cpp}` (100/439), `guis/GuiRetroAchievementsSettings.cpp` (533), `RetroAchievements.{h,cpp}` (267/1018), `guis/GuiGameAchievements.cpp` (341), `guis/GuiRetroAchievements.cpp` (414), `NetworkThread.{h,cpp}` (101/237), `CheevosRetry.{h,cpp}` (31/18), `ThreadedHasher.cpp` (282), `ThreadedCloudSync.cpp` (781, at `es-app/src/`), `CloudText.{h,cpp}` (350/734), `es-core/src/HttpReq.{h,cpp}` (170/637), `es-core/src/components/WebImageComponent.cpp` (251), `GuiMenu.cpp` (10372; two gates + GAME INDEXES text), `tests/unit/{CheevosRetryTests,CloudTextTests,OfflineAchievementsTextTests}.cpp`, `locale/lang/fr/LC_MESSAGES/emulationstation2.po` (34 lines match HORS LIGNE / OFFLINE ACHIEVEMENTS).

**The upstream client the fork drives** (read-only, `build/raofflineproxy-64d03d30.../linux/raofflineproxy/`): 15,745 lines of Python; the files the fork's paths touch are `main.py` (854), `proxy_service.py` (1125), `rom_cache.py` (474), `smart_cache.py` (694), `flusher.py` (529), `network.py` (457), `storage.py` (811), `rom_hashing.py` (293), `config.py` (443), `service.py` (413), `auth.py`, `pending_awards.py`, `image_cache.py` (241), `es_export.py`, `log_uploader.py` (378).

### 1.4 Constraints that apply (rules read from `next`)

| Rule | Glob matches | What it binds here |
| --- | --- | --- |
| `packaging-and-patches.md` | `projects/**` | SPDX header + JELOS/LibreELEC/ROCKNIX credits; full hash pin; late binding; `PKG_DEPENDS_TARGET` names every CLI a shipped script runs; patches apply after unpack |
| `rclone-cloud-sync.md` | `rocknix/sources/scripts/**`, `tools/last-good-scripts-test` | harness conventions; the sync cards' vocabulary; stamps |
| `generic-x64-vm-testing.md` | `projects/ROCKNIX/packages/**`, `tools/vm-qa`, `docs/vm-qa-log.md` | guest reads through the credential filter; 640x480 frames; RA games fixture; `ra-offline` opt-in and spends an achievement |
| `handheld-evidence.md` | `rocknix/**`, `docs/**` | `rocknix-evidence` bundles pass `redact_credentials`; `/var/log` persistence |
| `es-native-ui.md`, `es-ui-style-guide.md`, `es-player-text.md`, `es-code-traps.md`, `player-language.md`, `least-surprise.md` | `**` / every session | fourth-tier surface for long jobs; two lines per row; UPPERCASE `_()`; Wi-Fi; scan not sync; sent vs synced; EN+FR (D-UI-051); `exists()` cache; ASCII comments; pure text in CloudText-style with tests; dim don't hide |
| `engineering-practices.md` | `**` | guards fail closed; verify the artifact; diff behaviours before deleting; three fixes rule; VM first; never reboot without asking |
| `upgrade-and-install.md` | `**` | both questions (upgrade, clean install) for markers, keys, formats, migrations |
| `documentation-accuracy.md` | `**` | rocknix.org page before an upstream PR (hard gate) — #168 |
| `fork-workflow.md` | `**` | personal paths never in a PR; `pr/*` built by content |
| `decision-register.md`, `issue-tracking.md`, `learning-capture.md` | `**` | rows cited by ID; body edits in the same action as a superseding comment; ticks record behaviour |
| `vm-first.md`, `adversarial-council.md` | every session | the second opinion runs through the Facilitator's GPT seat, identity gate checked |

Blindspot register: 43 entries read in full. The ones this epic is most exposed to, to be tested in Phase 3: 6 (consumed one-shot marker — `last-flush`, `last-scan`), 8 (synthetic fixtures — the ctl's sqlite reads tested with a fixture DDL), 10 (fix forward only — the recovery-file id change, the hasher), 13 (assumed-done ticks), 14/26 (guards that can be absent), 16 (a runtime CLI no package declares — `python3`, `sqlite3`, `flock`), 22 (a probe that cannot report absence — `probe-online`, `online_state.json`), 27 (supersession only in comments — #173 AC3, #179 AC2), 34 (host tools vs busybox — the ctl's `find`, `stat`, `date`, `flock`), 43 (a safety claim in a header, untested).

### 1.5 Prior phase findings (Epic-tier consolidating posture)

There are no phase retros for this epic (no `mini-retro` artefacts under `docs/`); the closest inputs are the verification comments on each issue (the "observations only" comments of 2026-09-13/14 on #165/#166/#173/#175/#176/#179/#180) and the RC-5 row in `docs/vm-qa-log.md:73`. These are trusted as leads; the spot re-verification quota (two consolidated PASS findings re-derived from primary sources) is applied in Phase 2 to AC-165-3 (the hold-back) and AC-176-1 (the redaction) — both have mechanical checks I can run.

Prior audit #151 (2026-09-13) predates this epic's code except `qa-accounts` (PL-09) and `last-good-scripts-test` (PL-10); its PL-13 noted `devpassword=` never reaches `es_log.txt` — relevant to the credential question.

**Tier B coverage (frames):** `docs/qa-frames/2026-09-14/` holds 34 RA-related frames (175-*, 179-*, 180-*, ra-offline-*); all at 640x480 except five `ra-offline-toggle-*-1280x800-31253072d6`. None of the six RC-5→RC-6 ES commits has a frame in the repo (the sixth candidate is unbuilt); #184's frames are owed by its own acceptance line.

### 1.6 Red flags from research (to be tested, not concluded)

1. Two issue bodies contradict what shipped and the register (#173 AC3; #179 AC2 "cap") — blindspot 27.
2. The ES pin in the distro tree is the ES branch's base — the RC-6 ES changes have never been in an image; every RC-6 wording criterion is code-read only until a build exists.
3. `#183` says the startup hasher did not run on the VM and a hand-written `cheevosId` was not enough; D-RA-013 now makes the whole offline cache depend on that index. If the index does not fill on a fresh install, the index-fed scan degrades to hashing — the fallback path matters.
4. The proxy's sqlite is written by the service and read by the ctl (`pending`, `pending-ids`, `ready`, `account`) and written by `cache-roms`/`cache-indexed` runs from the ctl while the service runs — two writers; WAL mode is present on disk (`-shm`/`-wal` seen) but the ctl's write path is a separate Python process.
5. `raofflineproxy-ctl` is 1086 lines of shell driving Python; the brief asks for fail-closed on every refusal.
6. The `cheevos_username` still appears in `exec.log` (#176 comment: "cheevos_username still logged (2 lines)") — the brief asks whether an account name reaches a log "where it is meant to be masked".
7. The design note's § 4/§ 9 say the upstream client uploads storage-corruption logs to a remote endpoint ungated (`log_uploader.py`) — does the fork's packaging reach that path?
8. No D-RA-015; the register numbering has a hole.

## Research Summary

- **Planned:** RAOfflineProxy packaged natively behind a system-wide, casual-only OFFLINE ACHIEVEMENTS (BETA) toggle; messages on the sync cards; a scan and top-up fed by the interface's index; achievements pages reading the cache offline; no cap; everything upstreamable.
- **Issues:** epic #163 + 13 sub-issues, all OPEN; 18 of 50 boxes ticked; #167 #168 #172 #183 #184 entirely unticked; #184's notes are all built on the two branches and none is in an image.
- **Code:** 23 distro commits (≈1,764 lines in the package + edits to 8 scripts/tools), 20 ES commits (≈4,300 lines across 14 files + tests + French), on top of a 15.7k-line upstream client.
- **Constraints:** 20 rules apply (table above); the blindspot register's 43 entries; the register's 20 rows.
- **Red flags:** eight, listed in 1.6.

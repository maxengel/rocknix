# Retrospective Audit — The release-candidate round (work since #186)

**Auditor:** Code Auditor skill v1.10.0 (Claude Fable 5.1, `claude-fable-5-1`)
**Date:** 2026-09-24
**Subject:** distribution `95e4961fb3..443028ff7a` (the fork's 134 commits / 96 files) and EmulationStation `ae9c7d56b..75ca1dac2` (57 commits / 108 files), read backwards from what was built
**Spec:** the issue bodies on `maxengel/rocknix`; `docs/decision-register.md`; `.claude/rules/*.md` from `next`; `docs/blindspot-register.md` 1–52

---

## Running Notes

## 3.1 Architectural coherence

**The whole holds together, with one seam left over from a reversal.** The range is fourteen RC cuts, each a small, named change over the last, and the tree reads that way: the proxy package's patches are numbered and each header says what it fixes and where it came from; the save-state contract is one file (`es_savestates.cfg`) plus two launcher functions plus a harness section that pins it; the rotation work is a record, a table per core and a text helper with a test; the tools are single-purpose and each carries its usage and its reason at the top.

**The seam: D-UI-078 reversed the #187 design and the code kept both halves.** `GuiCloudTransfer` and `CloudTransferJob` were built on 2026-09-15 so a page could be left and the run followed from the hub row (D-UI-060/070). On 2026-09-21 the maintainer reversed it (D-UI-078): the page is sat in and CANCEL is the only way out. The reversal changed `input()` (`GuiCloudTransfer.cpp:215-218`) and the footer; it left in place the machinery of the old design and every comment describing it:

- `GuiMenu.cpp:5025,5087` still read `CloudTransferJob::current()` to show the hub row's live line "while the run is in the background" (`:5033`, `:5110`), and `FileData.cpp:831` still asks the launch question over "a transfer left running" (`:788`) -- states a player can no longer reach, because the page refuses every press but CANCEL while it runs. The only way to a live run with the page down is the QA API's `POST /launch` under an open page, which launches nothing (memory: *ES API launch needs the carousel*).
- Nineteen comment sites describe the leavable page as the present design (§ Comment quality, shape S1), one of them the header's first paragraph: `GuiCloudTransfer.h:25` "And it is left running, not sat in (fork #187; the scan page is the model)" -- the exact opposite of the rule now in `es-native-ui.md`.

Not dead in the harmful sense (nothing misbehaves), but a reader of the header is told a design the screen contradicts, and `engineering-practices.md` § "Before deleting a duplicate, diff its behaviours" cuts the other way here: a reversal that keeps the old mechanism needs the same list -- what the leftover still does (the row's post-run outcome until dismissed, D-UI-070) and what is now unreachable.

**Two duplicates worth naming.** `projects/ROCKNIX/packages/emulators/libretro/rotation-table-fba.py` and `fbneo-lr/scripts/rotation-table.py` are byte-identical (`cmp`); the shared one's docstring still calls itself `fbneo-rotation-table.py`. Two copies of one generator drift. And `CaptureRotation`'s `sKnown`/`sTables` and `DisplayAspect`'s `known` are three static caches with no invalidation (the first is updated by `recordAfterSession`; the other two never), so a screenshot viewed before its game's first session keeps the file's turn until the interface restarts.

**Removed mid-range and clean:** `SaveStateDeleteQueue`/`SaveStateDeleter` (build 8) gave way to `SaveStateBookkeeper`/`SaveStateJobQueue` (build 10) with the tests moved; no orphan remains (`grep -rn SaveStateDelete es-app/src` -> none). The diagnostic log lines of two cuts (`0f916d52a4`, `8dc8233331`) were removed in the seventh (`DisplayAspect.cpp` has no LOG).

## 3.2 Project conformance

### Face 1 — instruction files (read from `next`; every in-scope rule)

| Rule | Relevance | Finding |
| --- | --- | --- |
| `engineering-practices.md` § Verify the artifact | high | ⚠ Mostly honoured (the ticks quote frames, stamps, counts). Three artifact-shaped ticks on behaviour boxes: #121-2 (a script hash), #196-5 (byte identity for "shows the same tiles and launches each"), #244-2 ("each claim checked" = 11 of 49). |
| § Guards must fail closed | high | ⚠ `.githooks/pre-push:229` runs the ceremony gate only if `$hooks_root/tools/ceremony-check` exists in the pushing worktree; `tools/ceremony-check:147` accepts `issue: guard` unverified; `lint-audit-artifacts` PASSes a folder whose YAML index says `open` ×32 because it reads the outcomes table alone; `raofflineproxy-ctl:1297/1300` `exit ${EX_USAGE}` exits 0; the rotation generators echo `0 games with a turn` and the build succeeds. Fail-closed examples that hold: `es-menu-map-check`/`frame-diff`/`es-syntax-check` exit 2 when they cannot run; `vm-qa` SKIPs a missing baseline. |
| § A name is not a behaviour | high | ✓ The tree carries the lesson in code (the `refresh` helper re-reads unlocks; the worker's line says what is on disk). |
| § A promise is not a mechanism | medium | ✓ `tools/watch-job` + the detach rule; the tip's builds were watched. |
| § Change stays inside the fork's lanes | high | ✓ D-UI-079 honoured: the game index, content installer, OS update and Bluetooth cards untouched (`git diff --stat` shows no change to `ThreadedHasher`'s card, the installer or the updater). Patch 0014 (widget backdrop at every context reset) reaches every RetroArch notification -- inside the RetroAchievements lane by intent, wider by effect; noted. |
| § Never reboot / nothing runs on a device without a yes | high | ✓ Every staging and reboot in #236's comments is asked for by name and run through `tools/device-act` with boot ids; one act's label mis-states the hour of the yes (14:55 vs ~05:45), corrected in the same comment. |
| § If the VM can test it, the VM tests it first | high | ✓ D-QA-033 applied to the round; every cut ran vm-qa and the rehearsal before staging. ⚠ Two VM proofs owed by boxes were skipped while the device half was taken: #192 box 3's VM frames ("not framed on the VM this round"), #178 box 2's ten reboots. |
| § Stop after three fixes | medium | ⚠ #243 took three cuts and two diagnostic pins (fifth, sixth, two diagnostics, seventh) before `es-code-traps` § "the theme's own extra" was written -- the rule fired on the fourth and the lesson was recorded. |
| `upgrade-and-install.md` | high | ⚠ Read-both-write-new honoured for the rotation record (D-UI-082) and the legacy `0`; the rehearsal ran on every cut. **The clean-install path diverges from the upgrade path for `es_savestates.cfg`** (F-B05): `userconfig-setup:13` copies it where `post-update:32` links it. Harmless today, latent, and the cfg's own header says the opposite. |
| `es-native-ui.md` | high | ⚠ D-UI-078's rule is in the file and in the code; the code's comments still carry the old design (S1). `es-syntax-check` before a pin bump: run for #241/#243 (the ticks say so); the tool cannot pass three in-range TUs (F-T01). |
| `es-code-traps.md` § ASCII comments | high | ⚠ Two in-range comment lines carry U+00B7 (`GuiScraperRun.cpp:177`, `.h:38`); xgettext extracts only a comment directly before a `_( )` (`--add-comments=TRANSLATION`, `--keyword=_`), a signature line separates these, and the image built -- so no break, but the rule's pre-bump grep would have flagged them. |
| `es-player-text.md` / `player-language.md` / `least-surprise.md` | high | ✓ `vocabulary-check` 0 wrong of 143; the new strings follow the register (COMPARING SAVES, SKIPPED - YOU CANCELLED IT, STOP IT AND PLAY, WI-FI NETWORK, `Logged in as … (offline).`); every fork string has French (674/674). |
| `es-ui-style-guide.md` | medium | ✓ YES-first confirmations (`CANCEL THIS BACKUP OR RESTORE?`, `STOP IT AND PLAY`/`KEEP WAITING` with B on KEEP WAITING); dim-don't-hide through one `setDimmed`. |
| `rclone-cloud-sync.md` | high | ✓ `cloud_capture` keeps its two rules (no flock, no profile) and adds `trap '' TERM` with its why; the saves-only/system-only contract untouched; the stall ceiling documented in the rule and in the script. ⚠ F-B17: `--retire --unlink` unlinks a path it refused to record -- the rule's "record before unlink" (D-CLOUD-053) not honoured on the refused branch. |
| `packaging-and-patches.md` | high | ✓ pkgcheck 28/28; `PKG_SHA256` on every bump; full hashes for git pins; patches numbered with headers. ⚠ The `python3` the rotation generators run at build time is not in `PKG_DEPENDS_HOST` (the host has it; the rule asks for a shipped script's tools to be declared -- a build-time tool is a weaker case, noted). |
| `device-builds.md` § Late binding in a merge | high | ✓ No file-scope `${PKG_BUILD}` in the six standalone recipes; `${SYSROOT_PREFIX}` at file scope in amiberry/yabasanshiro is set before `source_package` and pkgcheck-clean. ⚠ The re-added guards' comment premise is false for three of five (`virtual/emulators/package.mk:11-12` vs the device arms) -- a constraint written wrong, blindspot 48's shape. |
| `fork-workflow.md` | high | ⚠ `fork-package-freshness` exits 1 at the tip (F-D23); the fork-only tool lists in `.githooks/pre-push` and the rule agree (D's cross-check); `instruction-files.md`'s table lacks four tools (F-DOC). PR 3359 built by content, one commit. |
| `instruction-files.md` § the fork's own tools | medium | ✗ `archaeology`, `ceremony-check`, `frame-diff`, `work-log-index` are in both lists and not in the table ("a new one is added to both lists and to this table, or it is invisible"). |
| `issue-tracking.md` § Ticking / § body edit / § putting a box on a checklist | high | ✗ The most repeated miss of the range (F-hyg): #225 closed with five open boxes; #247 delivered with three open; #193/#194/#203/#195/#211/#182/#177/#198 boxes true and unticked; #45-3/#121-2/#131-2/#150-1 re-scoped inside the tick; #196-1 names `libretro`; #186 PL-04 says "three probes". Blindspot 27's shape, many times. |
| `decision-register.md` | high | ✓ 344 IDs, each once; every citation resolves (register-check) -- except `D-RA-0xx` in a directory it does not scan. ⚠ D-RA-025 was written as open and "corrected in the register in the same action" (append-only asks a new row; the register's text is fine, the history is in git). |
| `change-log.md` | medium | ⚠ Every player-visible change has a claim; the 09-23/24 changes sit as bullets under the 09-22 heading (the rule: a `## Title (date)` section per landing day). |
| `learning-capture.md` / `ceremonies.md` | medium | ✓ Work logs daily with the index; `ceremony-check` green; blindspots 47-52 each name a guard. ⚠ No `docs/retros/` entry in the range (the retro marker is a work-log heading from 09-04); the first retro under the gate is #254's open box. |
| `generic-x64-vm-testing.md` | high | ✓ Twelve suites on the tip; `frame-diff` wired after being seen to fail (run 17); masks explained. ⚠ `retroarch-wrapper-test` and `archaeology`'s constructed case have no observed positive in a suite. |
| `handheld-evidence.md` | medium | ✓ `rocknix-corekeep` obeys the file's rules (bounded, refuses, never collected); D-QA-029 honoured (the marker absent on guest d). |
| `vm-first.md` / `time-to-play.md` | high | ✓ The launch question is measured in the tip's time-to-play cell (1.03 s); D-CLOUD-131. |
| `documentation-accuracy.md` | high | ✗ The fork's rocknix.org draft (`docs/ra-offline/rocknix-org-offline-achievements.md:25`) contradicts the shipped behaviour (PL-11 FAIL); #191/#201/#203 name the rocknix.org page as owed (#42's sequencing). |
| `adversarial-council.md`, `council-substrate-integrity.md`, `worktrees.md`, `learning-capture.md` | low | · no council in this audit's scope; worktrees rule not touched by the range. |

### Face 2 — the blindspot register (does this work repeat it?)

| # | Repeated? | Evidence |
| --- | --- | --- |
| 1 assumed-undone | no | #253's archaeology and blindspot 52 are the guard; #209 was caught re-arguing D-UI-057 and stopped. |
| 6 consumed artifact checked late | no | — |
| 7/10 archive symlinks, fixing forward only | no (partly) | ⚠ F-B05 is a fix-forward shape in miniature: the clean install writes a copy while the update links -- read-both holds because the bytes are equal. |
| 8 synthetic-fixture testing | **yes, three times** | #245 box 2 proven with a hand-appended `SET_ROTATION` (no rotating core on the VM); #213 boxes 1-2 with a host fixture "through the real function", not the image's Python; #247's CUT branch with `/dev/zero`. Each recorded honestly in its tick. |
| 13 assumed-done | **yes** | #121-2 ticked from a script hash; #196-3's Menu+L2 clause ticked before its evidence; #244-2 "each claim checked" for eleven of 49; #196-5 byte identity for a launch box. |
| 14 a guard with no observed positive | **yes** | `--wrap-mode=nodownload` (never seen to refuse); the pre-push INDEX warning (`:226-228`); `fork-checks.yml` (twelve green runs, no constructed red); `tools/retroarch-wrapper-test` (run once by hand, wired nowhere); `archaeology`'s constructed case (#253 box 1 unticked). |
| 16 runtime dependency with no build signal | no (weak) | `python3` at build time for the tables; `gzip -l` on the device (GNU there, confirmed). |
| 22 a probe that cannot report absence | no | the ctl exits 2 on "cannot tell"; `proxyOffline()` returns false without a state file (a fresh toggle-on goes online-way -- a lead, not a false positive). |
| 27 supersession that lives only in a comment | **yes, repeatedly** | see F-hyg above; D-RA-023/D-UI-067/D-RA-022 supersede box text on #190/#193/#194 without a body edit. |
| 33 sentinel collision | no | `EX_UNAVAILABLE`/`TEMPFAIL`/`NOPERM`/`CONFIG` in the ctl; `EX_USAGE` undefined is the opposite failure (exit 0). |
| 34 proven under the host's tools | **yes** (#213), and guarded elsewhere | the harness shims busybox for the scripts (section x for corekeep ran under the shims, and guest d confirmed `gzip`/`head`/`date`). |
| 39/40 a suite that passed over dashes / on the caller's shell | no | `frame-diff` SKIPs a missing baseline; `vm-qa` defines what it needs; `time-to-play` fails on missing headlines (the tip's cell has numbers). |
| 44/45 proven at a fixture's size / speed | partly | the tile-relayout defect (#241's `MultiLineMenuEntry`) shipped in two candidates because every walk scanned a handful of games -- found on the device and recorded in the rule. |
| 46 a name read as a behaviour | no | the `refresh` helper's header says exactly which calls it makes and why. |
| 48 a constraint that lived only in a commit subject | no -- and the fix shipped | webkitgtk's reason sits beside `PKG_VERSION` and beside the option. ⚠ The re-added `PKG_ARCH` guards carry a reason that is wrong for three of five recipes. |
| 49 an edit made blind to the compiler | mitigated | `es-syntax-check` exists and was run; it cannot pass three in-range TUs (F-T01). |
| 50 a log check that never asked whose log | no | `ra-offline-test` clears `exec.log` and dismisses dialogs first. |
| 51 a checklist built from open boxes | partly | #236 was re-cut under D-QA-033 and the stale boxes named; #150 box 2 still names a script that is not in the tree. |
| 52 a decisions list built from a section, twice | no | `archaeology`, the index and the same-day rows exist; #236 § C now names open-table IDs only. |

### Face 3 — project invariants

- **Preserve player progress above all.** No new writer of the saves tree bypasses `cloud_capture`'s record (the manager's COPY now records through `--adopt`; the deletion's row precedes the unlink). ⚠ F-B17: the refused-path branch unlinks without a record -- unreachable from the interface, contradicts the invariant's letter.
- **No secrets in backups or logs.** D-RA-025 re-proved the archive; `maskSecrets` before every logged command line; `rocknix-corekeep` never collected; `qa-accounts` never printed. ✓
- **The filter is an allowlist; `--delete-excluded` restore-side is a bug.** Untouched in range. ✓
- **Every change lands on devices with state.** The rehearsal on every cut; the legacy `0` read as DO NOT INCREMENT; the rotation table at draw time. ⚠ F-B05 (clean install vs upgrade).

## 3.3 Spec fidelity (the register rows the range wrote, against the code)

| Row | Honoured in code? |
| --- | --- |
| D-UI-057/059/069/083 (Batocera parity; no renumbering; the modes) | ✓ `es_savestates.cfg`, `SaveState.cpp`, `setsettings.sh` `0|2|false|none`, harness v/x |
| D-UI-058/066 (12-hour times, padded) | ✓ `TimeUtil.cpp`, `TimeTextTests` |
| D-UI-060/070 -> **reversed by D-UI-078/079** | ✓ the reversal is in `input()`; ⚠ the code and comments of 060/070 remain (S1) |
| D-UI-061 -> superseded by D-UI-063; D-UI-062/064/068/071 | ✓ `wifictl`, `GuiMenu.cpp:9041/9091`, `GuiWifi` |
| D-UI-073/074, D-CLOUD-132/133/134 | ✓ `SaveStateBookkeeper`, `cloud_capture --retire --unlink`/`--adopt`, `GuiSaveState::update` |
| D-UI-075 | ✓ `CloudText::liveWords` |
| D-UI-076 | ✓ `es-menu-map-check` in vm-qa |
| D-UI-077 (REFRESH ACHIEVEMENT STATUS) | ✗ **no row ships** at `75ca1dac2`; the backend verb exists; #224 open -- the register names a row nobody can press |
| D-UI-080/081/082 | ✓ `DisplayAspect`, `CaptureRotation`, the five tables |
| D-UI-084 | ✓ patch 0016 |
| D-RA-019/020/021/022/024/027 | ✓ ctl `DONE` verdict; store-only header; the offline lines; `(offline)`; patch 013; images unconditional |
| D-RA-025 | ✓ (the archive strips; the row corrects a withdrawn premise) |
| D-CLOUD-129/130/131 | ✓ `FileData.cpp:796-832`, `launchWhenGone`, time-to-play's press |
| D-QA-029 (keeper off on a candidate) | ✓ guest d has no marker |
| D-QA-030..039 | ✓ process rows; D-QA-038's baseline was first accepted on a VM pass (then device-accepted the same night) |
| D-WORKFLOW-024 | ⚠ the tool exits 1 at the tip; the proxy recipe lacks the pinned line |
| D-WORKFLOW-026 | ✓ 2.52.6 with the reason beside the version and the option |
| D-WORKFLOW-028 | ✓ `ceremony-check` in the guard and CI; ⚠ the guard's reach (F-D51) |

**Silently changed design:** none found that is not in the register. **Scope added without a row:** the `images` and `refresh` ctl verbs (#212/#224) beyond the PL-30 stop path -- small.

## 3.4 Platform architecture conformance

| Check | Relevance | Finding |
| --- | --- | --- |
| Reference implementation (tenant zero) | · | not applicable to an OS fork |
| Schema-before-code | ⚠ | `docs/save-manifest-schema.md` is owed the `copy` op and the dropped renumber (D-CLOUD-132 says so); not updated in range |
| Dogfooding gate | ✓ | every cut on the VM before the QA handheld |
| API-first | · | n/a |

## Comment quality (the maintainer's face)

**Method.** Every fork-changed file in both repos was counted for added comment lines, issue/decision markers, non-ASCII bytes and TODO tags (Phase 1.7's tables in the running log). The comment text was read whole for the shipped scripts (`cloud_capture`, `runemu.sh`, `setsettings.sh`, `wifictl`, `setrootpass`, `rocknix-corekeep`, `cloud_net_ready`, `001-functions`, `post-update`, `userconfig-setup`, `es_savestates.cfg`, the two cheevos scripts), RetroArch patch 0016, the raofflineproxy/webkitgtk/cairo/rclone/standalone recipes, and sampled (the first 30-34 added comment lines) for 13 tools/helpers and 14 ES files. Truth was judged against the code beside each comment where that code was read in Phase 2; the why/marker face by presence of a reason and an issue or decision ID where a decision was made; ASCII by grep. Stale claims found in a sample were then swept to every site by their shape (`grep`).

**Counts.**

| | Files with added comments | Added comment lines | Lines with `#N`/`D-ID` | Non-ASCII lines | TODO/FIXME |
| --- | --- | --- | --- | --- | --- |
| Distribution (fork commits) | 60+ of 96 | ≈1,900 | ≈165 | 1 (patch 008, Python) | 0 |
| EmulationStation (range) | 60+ of 108 | ≈1,785 (top 60 files) | ≈226 | 2 (`GuiScraperRun.cpp:177`, `.h:38`, U+00B7) | 0 |

Decision-ID citations: every ID cited in the ES sources (51 distinct) and in the proxy package resolves to a register row -- except **`D-RA-0xx`** (`raofflineproxy-cache-images:6`), a placeholder that `tools/register-check` never sees because it does not scan `projects/ROCKNIX/packages/network/raofflineproxy/sources` (`register-check:48-58`).

**What is good, and it is most of it.** The comments in this range are the best-argued part of the work: a header names the issue, the decision and the maintainer's words (`fork-package-freshness`, `frame-diff`, `ceremony-check`, `watch-job`, `build-preflight`, `ra-candidate-games`, `raofflineproxy-refresh`, `SaveStateBookkeeper.h`, `SaveStateJobQueue.h`, `CloudText.h`, `StringUtil.cpp maskSecrets`, `LogPolicy.h`, `CaptureRotationText.h`); constraints sit beside what they constrain with a date and a commit (`webkitgtk` ENABLE_VIDEO, `-j4`; `cloud_capture`'s `trap '' TERM`; `setsettings.sh`'s hardcore `= "0"`); measured numbers are quoted where a number was the reason (`rocknix-corekeep`'s 866 MB, `SaveStateBookkeeper.h`'s third of a second); and the register is cited by ID rather than re-argued. Non-ASCII is two lines; TODO is zero.

**Defects (each verified against the code beside it).**

| Shape | Sites | Severity |
| --- | --- | --- |
| **S1 -- a design reversed, its comments kept.** D-UI-078 (2026-09-21) made the transfer page sat-in with CANCEL; these still describe the leavable page as current: `GuiCloudTransfer.h:25` ("left running, not sat in"), `:81`, `:96`; `CloudTransferJob.h:16,19,171`; `CloudTransferJob.cpp:547`; `GuiCloudTransfer.cpp:164,406`; `GuiMenu.cpp:4382,4920,4922,5033,5110`; `CloudText.h:205`; `FileData.cpp:788`; `ThreadedCloudSync.cpp:686`; `GuiOfflineScan.cpp:93` (the scan page too). 17 sites in 8 files; the code they describe is unreachable (§ 3.1). The fork's own doc draft has the same claim (`docs/ra-offline/rocknix-org-offline-achievements.md:25`). | Medium |
| **S2 -- a label renamed, its comments kept.** D-UI-071 (2026-09-16) renamed WI-FI SSID to WI-FI NETWORK; `WifiText.h:48`, `GuiWifi.h:11`, `GuiMenu.cpp:8887`, `MultiLineMenuEntry.h:28` still name "the WI-FI SSID row" as current (`GuiMenu.cpp:9040` is correctly historical). | Low |
| **S3 -- a pin moved, its comments kept.** `41f86ec9ba` (2026-09-20) re-pinned the proxy; `raofflineproxy-ctl:193` and `raofflineproxy-rcheevos/package.mk:6` still say the schema/submodule follows `64d03d30`; `raofflineproxy-libchdr/package.mk:6` was updated (patches 001/002's context lines carry the old hash legitimately). | Low |
| **S4 -- a mechanism changed, its header kept.** `rocknix-corekeep:32-34` "cut off at CORE_MAX_BYTES of *compressed* output"; the code (`:76-80,167-177`) caps raw bytes and says so. `StringUtil.cpp:459-461` "GuiMenu passes the password unquoted, so a space in it would otherwise leave a tail visible" -- since #198 (`GuiMenu.cpp:3162/6003`) it is quoted; the mask still handles both, the reason given is gone. | Low |
| **S5 -- a constraint written wrong.** `aethersx2-sa:12-15`, `bigpemu-sa:12-15`, `drastic-sa:11-14`: "PKG_EMUS lists this package for every device" -- `virtual/emulators/package.mk:11-12` lists only amiberry and yabasanshiro-sa in the base set; the three are added in device arms that exclude x86_64 anyway. The guard is harmless; the reason beside it is not the real one (blindspot 48's cure applied with the wrong fact). | Low |
| **S6 -- a comment true of the upgrade path only.** `es_savestates.cfg` header: "userconfig-setup links it into /storage/.config/emulationstation on first boot"; `userconfig-setup:51-52` the same. On a clean install it is copied (F-B05). | Medium (with F-B05) |
| **S7 -- a placeholder shipped.** `raofflineproxy-cache-images:6` `D-RA-0xx`. | Low |
| **S8 -- non-ASCII before a translatable string's neighbourhood.** `GuiScraperRun.cpp:177`, `GuiScraperRun.h:38` (`·`). Harmless by position; the rule asks for ASCII. | Low |
| **S9 -- a why missing where a decision was made.** `projects/ROCKNIX/packages/graphics/cairo/package.mk` no longer says why the ROCKNIX override exists now that it names the release the generic recipe would; `raofflineproxy/package.mk` explains the 09-20 pin in prose but lacks the `# freshness: pinned --` marker the tool reads (or a bump). `tools/fork-package-freshness:73-75` holds ruby to its minor series in the tool with no line in the recipe. | Low |
| **S10 -- a doc draft the code contradicts.** `docs/ra-offline/rocknix-org-offline-achievements.md:25` (PL-11). | Medium |

**Counts of defects:** 10 shapes, 32 sites (17 + 4 + 2 + 3 + 3 + 2 + 1 + 2 + 3 + 1 -- S4 counts two sites, S9 three) across 17 files, against ≈3,700 added comment lines: under 1 %, concentrated in one reversal (S1) and three renames/moves (S2-S4). No comment lies about what the code *does* in a way that would mislead a fix -- every stale site describes a design the register records as reversed or a name it records as changed; the risk is the reader who has the file and not the register.

## 3.5 Cross-system interactions

### Interaction: `cloud_capture --retire --unlink` × `essway.service` stop
**State shared:** the manifest and the state files; the worker thread's popen. **Wipe risk:** `systemctl stop essway` SIGTERMs the whole control group mid-deletion. **Test coverage:** TESTED (CAP13 (a)-(d) on guest b; build 9's `systemctl restart essway` found the window; D-CLOUD-133 closed it with `trap '' TERM`; the harness kills a shim mid-redraw). **Finding:** safe; residual accepted (a power cut inside the script's tail); the trap sits at line 116 after the config reads (a SIGTERM in the first milliseconds kills a script that has done nothing -- neither half, fine).

### Interaction: the launch question × the transfer page × the automatic sync
**State shared:** one flock; `ThreadedCloudSync::isRunning()`, `CloudTransferJob::current()`. **Wipe risk:** a rename landing under a game that has the save open. **Test coverage:** TESTED for the sync (time-to-play's press, 1.03 s; frames); the transfer branch (`FileData.cpp:831`) is UNREACHABLE after D-UI-078 (the page refuses B while running). **Finding:** safe; a dead branch with live comments (S1).

### Interaction: `es_savestates.cfg` × `userconfig-setup` × `post-update` × the interface's read order
**State shared:** `/storage/.config/emulationstation/es_savestates.cfg`. **Wipe risk:** none (equal bytes); a future change to the shipped file does not reach a fresh device until its first update. **Test coverage:** UNTESTED (the rehearsal tests the upgrade path only; nothing boots a fresh image and reads the link). **Finding:** risky-latent (F-B05); the rule's own prescription -- exclude the file from the copy as the two upstream files are -- is one token.

### Interaction: the crash handler × `Log`'s mutex × `essway`'s restart
**State shared:** `Log::mMutex` (`std::mutex`). **Wipe risk:** a fault while the mutex is held turns a crash (restart in seconds) into a hang (no restart: `essway` restarts on exit; the SoC watchdog catches a stopped kernel, not a stopped program -- `handheld-evidence.md`). **Test coverage:** UNTESTED. **Finding:** risky (F-B32); the comment accepts a lost backtrace and does not name the hang.

### Interaction: the rotation record × the static caches × the SCREENSHOTS list
**State shared:** `CaptureRotation::sKnown`, `DisplayAspect::known`. **Wipe risk:** none; staleness for one interface session. **Test coverage:** UNTESTED in the order "view a screenshot, then play the game, then view it again". **Finding:** risky for the device box #245-4 (it can read as a failure that is not one).

### Interaction: the ceremony gate × the pushing worktree × CI
**State shared:** `.githooks/pre-push` runs `$hooks_root/tools/ceremony-check` -- the tool of the worktree being pushed from. **Wipe risk:** a push of `next` from a worktree cut before #254 (or `git push origin feature/x:next`) skips the gate silently; CI catches it later (red, not blocking). **Test coverage:** the gate's positives were constructed from the primary only. **Finding:** risky (F-D51).

### Interaction: `frame-diff` × the walks' fixtures × the accepted baseline
**State shared:** `walk-baseline/BASELINE.txt`, the manager fixture's mtimes, `default-pre`'s state. **Wipe risk:** a fixture change lands as 156 unclaimed boxes (run 17 -- the suite failing closed). **Test coverage:** TESTED (runs 17-21, the tip's 0 boxes). **Finding:** safe; `claims.txt` is empty at the tip so every future change fails until claimed -- the strict state D-QA-038 wants.

### Interaction: the startup index × the link-up rerun × the top-up
**State shared:** `startIndexesAtStart(window, true)` on link-up (`NetworkThread.cpp:232`), the ctl's top-up `--after-index`. **Test coverage:** PARTIAL (both proofs took the first path; the rerun has no observed positive). **Finding:** unproven, not broken.

### Interaction: `fork-package-freshness` × the `pr/` guard × upstream's movement
**State shared:** none in code; a process gate. **Finding:** the check is red today with no pinned line; the guard that would block a PR is a prose checklist (`fork-workflow.md`), not the hook.

## 3.6 What is missing (with the searches)

| Missing | Search trail | Proximate work that could have added it |
| --- | --- | --- |
| French frames for #203's question | `ls docs/qa-frames/2026-09-1[5-9]/ docs/qa-frames/2026-09-2[0-4]/ \| grep '^203-' \| grep -c -- '-fr'` -> 0 (10 EN) | #203 box 3 says "FR not yet" |
| 1280x800 frames for #182 and #193; an online #193 frame | `grep -c '^182-'` -> 1 (640x480); `193-*` two files, both 640x480 offline | none |
| The `manager-gb` walk frame | `ls docs/qa-frames/2026-09-23/ \| grep 252-walk-manager` -> `fbn`, `nes` | #252 box 3 cites three |
| A VM frame for #192's two card lines | `grep -c '^192-'` -> 0 | the comment: "not framed on the VM this round" |
| A red run of `fork-checks.yml` | `gh run list --workflow fork-checks.yml --limit 6` -> six `success` | #254 box 2 open |
| A positive for `--wrap-mode=nodownload` | the work logs and #226 name only the accidental DNS-less failure before the guard | #226 box 4 (an empty `find`) |
| A test of the clean-install link for `es_savestates.cfg` | `grep -n 'es_savestates' tools/last-good-scripts-test tools/vm-upgrade-rehearsal tools/vm-qa` -> the rehearsal seeds states, never reads the link; guest d shows the copy | #196 box 1 |
| A non-empty floor on a generated rotation table | `grep -n 'wc -l' projects/ROCKNIX/packages/emulators/libretro/*/package.mk` -> the echo only | #248 box 3 |
| `tools/retroarch-wrapper-test` in a suite | `grep -c retroarch-wrapper-test tools/vm-qa` -> 0 | #225 box 3 |
| The REFRESH ACHIEVEMENT STATUS row D-UI-077 names | `grep -rn 'REFRESH ACHIEVEMENT STATUS' es-app/src` -> 0 | #224 open (backend shipped `87d9969bbb`) |
| `docs/save-manifest-schema.md`'s `copy` op and the dropped renumber | D-CLOUD-132 says it "is owed a correction"; `git log 95e4961fb3..443028ff7a -- docs/save-manifest-schema.md` -> (not checked for content; the row says owed) | #205/#206 |
| The four tools in `instruction-files.md`'s table | `grep -c '\`archaeology\`\|\`ceremony-check\`\|\`frame-diff\`\|\`work-log-index\`' .claude/rules/instruction-files.md` -> 0 each | #253/#254/#252 |
| Phase 7 outcomes in #186's index | `awk` over `05-punch-list.md`'s YAML -> 32 `open`, 1 `resolved` | #186's closure 2026-09-21 |
| A `docs/retros/` entry since 2026-09-04 | `ceremony-check`: "retro last 2026-09-04" | #254 box 3 |

## 3.6.5 Defect shapes, traced to every site

| Shape | Site | Siblings / adjacent | Class |
| --- | --- | --- | --- |
| A design reversed, its comments and code kept (S1) | `GuiCloudTransfer.h:25` | 16 more comment sites (§ Comment quality S1); `GuiMenu.cpp:5025-5110`, `FileData.cpp:831` (unreachable code); `docs/ra-offline/…:25` (S10) | FIX-NOW (comments, doc), FILE-FOLLOWUP (the dead paths: keep the post-run outcome, drop the live line and the transfer launch branch, or record why they stay) |
| A name/pin/mechanism changed, its comment kept (S2-S4) | `WifiText.h:48` | `GuiWifi.h:11`, `GuiMenu.cpp:8887`, `MultiLineMenuEntry.h:28`; `raofflineproxy-ctl:193`, `raofflineproxy-rcheevos/package.mk:6`; `rocknix-corekeep:32-34`; `StringUtil.cpp:459-461` | FIX-NOW |
| A guard with no observed positive (blindspot 14) | `scripts/build` `--wrap-mode=nodownload` | `.githooks/pre-push:226-228` INDEX warning; `fork-checks.yml` red; `tools/retroarch-wrapper-test`; `archaeology`'s constructed case; the pre-push ceremony gate from a foreign worktree | FILE-FOLLOWUP (one constructed positive each) |
| Success reported over a no-op | `SaveStateBookkeeper.cpp:85` (`save state copy recorded` on rc 0 for a non-member) | `fbneo-lr/package.mk:38` and the four MAME/FBA recipes (`0 games with a turn` builds green); `raofflineproxy-ctl:1297/1300` (`exit ${EX_USAGE}` -> 0); `tools/lint-audit-artifacts` (reads the outcomes table, never the index that disagrees with it) | FIX-NOW (the exit, the floor), FILE-FOLLOWUP (the log line, the lint) |
| A clean-install path that diverges from the upgrade path | `userconfig-setup:13` (`es_savestates.cfg` not excluded) | `post-update:32` (correct); `es_savestates.cfg` header and `userconfig-setup:51-52` (S6) | FIX-NOW |
| Unlink after refusing to record | `cloud_capture:237-244` with `:1308-1316` | `--adopt`'s membership refusal (`:549-556`) is the correct sibling | FIX-NOW |
| A malformed progress line / no stop path for a verb | `raofflineproxy-ctl:1279` (`mark_running images`) | `:1309` (`refresh`); `do_images`/`do_refresh` no `TERM` trap and no `CLIENT` (PL-30 gap) | FIX-NOW |
| A tick re-scoped by annotation, a body not edited (blindspot 27) | #45-3 | #121-2, #131-2, #150-1, #196-1 (`libretro`), #186 PL-04 ("three probes"), PL-07 (reversed, unannotated); the unticked-though-true set #225 ×5, #247 ×3, #193 ×2, #194-2, #203-4, #195-4, #211 ×3, #182 ×2, #177 ×2, #198 ×3, #201-6 half, #191-4 half | FILE-FOLLOWUP (one pass over the bodies; the rule exists) |
| A static cache never invalidated | `DisplayAspect.cpp:44-50` | `CaptureRotation.cpp:19,27` (`sKnown` updated by the record only; `sTables` never) | FILE-FOLLOWUP |
| A scroll-loop tile without the decorator | `ImageGridComponent.h:413-417` | (the two decorated sites `:305-309`, `:377-381` are the correct siblings) | FIX-NOW (one call) |
| A generated file with no duplicate-free source | `rotation-table-fba.py` ≡ `fbneo-lr/scripts/rotation-table.py` | — | FILE-FOLLOWUP |

## 3.7 Retrospective summary

**Architectural assessment.** Sound. Fourteen cuts, each small, each proven on the VM before a device, each with its reason in the tree. One seam (the #187 machinery under D-UI-078) and two static caches are the architectural debts; everything else the range built is reachable, tested by a suite or a harness section, and described in a rule.

**Doctrine alignment: MEDIUM-HIGH.** The engineering rules hold where they are enforced by a tool (pkgcheck, the harness, register-check, vocabulary, the menu map, frame-diff, the rehearsal) and slip where they are prose: guards without a positive, a clean-install path nobody boots, an issue-tracking rule broken a dozen times in one round under RC pressure (working-principles § "Under pressure, do more checking" names exactly this). The comment face is strong overall (≈3,700 lines, two non-ASCII, zero TODO, every decision cited by a real ID save one placeholder) and weak in one specific way: a reversal or rename leaves its old sentences behind -- 32 sites, 17 of them one reversal.

**Cross-system interactions.** Eight examined; two risky-latent (the clean-install copy, the crash handler's hang mode), one risky by reach (the push gate), one unproven (the link-up rerun), the rest tested and safe.

**Spec drift.** The register and the code agree except D-UI-077 (a row the register names and the interface does not have) and the stale texts of boxes the register superseded.

**Missing artifacts.** Fourteen, listed with their searches; none blocks a player, several block a box from being honestly ticked.

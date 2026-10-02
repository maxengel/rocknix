# Council seat — second-round audit of stream F2's fix packet (packages, recipes, RetroArch 0011/0014/0016–0019, the rotation generators)

Read-at-time corpus: the nine embedded sources below. I have no filesystem access; every citation is to `F2.diff` by file and `@@` hunk (the diff has no line numbers of its own), or to a named section of the other eight sources. Where a callee, a tool or a runtime is outside the packet I say so rather than infer.

## 0. Corpus provenance (for `corpus.provenance.json`)

Recorded as embedded; I did not re-read or re-hash anything.

```json
{
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.diff",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.report.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.findings.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.items.md",
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/F2.plan.md",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/es-player-text.md",
    ".claude/rules/packaging-and-patches.md"
  ],
  "source_file_hashes": [
    "f6e7b0018aa5441dd62433fcd1713e71718ac1ddae21b43584534696e2af6e78",
    "2feee2db6d31143792c1bccdce0b97c51cca20e699343b8b3e92fdeacdffb5a7",
    "180feb76fa6cc03933ce76ffb4b0e2a1b49ad610f8cd3ab599e8304860da9e2c",
    "afc3ec97a5181ede1d4bdf032a6df5048d8ea258871164cc113404e2fbf96a02",
    "80830e921e97d803de7227fe40ff6539ede05f5796e870263e6af21b5ce2c731",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "c401103eba4ada9d0e757a2b8522e7ed9558a17eb4da72b65615795163f33c86",
    "2a44db10f4f179198b9366239eabe0900e1701145beced181536eb18bcbc0746"
  ]
}
```

Sources the brief names but that were not embedded: `rclone-cloud-sync.md` and "the ES rules" — not needed, since no cloud script or ES file is in `F2.diff`. Sources I would have needed and did not have: `config/functions` (`calculate_stamp`, `safe_remove`, `get_pkg_directory`), `scripts/unpack`, `scripts/build`, `scripts/get_env`, the generic `gst-plugins-{bad,base}` recipes, `projects/ROCKNIX/packages/compress/zip/`, the pinned RetroArch tree (in particular the unchanged bodies of `gfx_widgets_sharp_size`, `gfx_widgets_msg_queue_move`, `gfx_widgets_iterate`, `config_load_file`), the pinned cores' sources, ES's `CaptureRotation.cpp`, the launcher that writes the `--appendconfig` file, `/etc/profile` (where `HW_DEVICE` comes from), `tools/vm-upgrade-rehearsal`, `docs/decision-register.md`, and the commit messages (the `Already written:` lines the report says every commit carries). Each is flagged where it matters.

---

## 1. Punch items (the acceptance text is the criterion)

### PL-002 (High) — **holds, by mechanism**
- **Mechanism in the diff:** each of the five recipes adds `PKG_NEED_UNPACK="$(dirname "$(get_pkg_directory ${PKG_NAME})")/rotation-table-fba.py"` (fbalpha2012 `@@ -7,40 +7,31 @@`, fbalpha2019 `@@ -7,41 +7,32 @@`, fbneo `@@ -7,10 +7,14 @@`) or `.../rotation-table-mame.py` (mame2003-plus `@@ -7,37 +7,28 @@`, mame2010 `@@ -7,10 +7,14 @@`), with the comment that `calculate_stamp` hashes it.
- **Test in the diff:** F2-1 sources each recipe in a fixture root and runs the tree's own `calculate_stamp` (extracted from `config/functions` by awk), asserting `[ "${s}" != "${F2_S0[${p}]}" ]` after an edit to the family's generator and `[ "${s}" = "${F2_S0[${p}]}" ]` for the other family — seven checks; an empty stamp fails (`[ -n "${s}" ]`).
- **What the packet cannot show:** (i) that `calculate_stamp` (outside the diff) hashes a *file* path in `PKG_NEED_UNPACK` — F2-1 would FAIL on both trees if it did not, and the report quotes a PASS; (ii) the acceptance's literal act, `./scripts/build <core>` moving `build_target`, was forbidden to the stream and is handed to the integrator (report § PL-002 "For the integrator"); (iii) `get_pkg_directory` at file scope is *stubbed* in F2-1 (`get_pkg_directory() { echo "${FXR}/${F2_LR}/${1%:*}"; }`), so the real function's behaviour under `source_package` is asserted only by analogy to the vdr idiom the report cites.

### PL-032 (Medium) — **holds in part**
- **Stale context (F-RW-01 gpt):** the fork's patches 0014/0016/0017/0018/0019 are regenerated; F2-4 applies each fork patch with `patch ... --fuzz=0 --dry-run` and adds it to `F2_FUZZ` on any fuzz; the check is `[ "${F2_APPLY}" -eq 0 ] && [ -z "${F2_FUZZ}" ]`. Holds.
- **"a `RARCH_LOG` line on the guest names the table applied":** 0017 `@@ -895,15 +992,33 @@` adds `RARCH_LOG("[Widgets] font %s: %s, computed %.2f px, floor %.0f, %s%s, drawn %u px\n", ...)` printing `face->name` or `"no sharp-size table for this face"`. Holds (mechanism); the guest line itself is the integrator's.
- **"`frame-diff` shows the widget text at a sharp size":** **does not hold for the shipped profiles, by the diff's own design.** `gfx_widgets_sharp_faces[]` (0017 `@@ -54,6 +55,102 @@`) holds only `ozone/regular.ttf` and `ozone/bold.ttf`; the profiles' `xmb/monochrome/font.ttf` returns NULL and is drawn at its computed size ("there is no sharp size to move to", same hunk). The report says so openly and defers to a maintainer decision (an M+ table or a different face). This half of the acceptance cannot be met by this diff without that decision.
- **Beyond the item, confirmed in the diff:** the base's message-queue table selection compared a local array's address to a pointer — `(font_file == p_dispwidget->ozone_regular_font_path) ? REGULAR_SHARP_SIZES : NULL` (removed lines of `@@ -1010,22 +1125,28 @@`; `font_file` is filled by `strlcpy(font_file, ...)` two lines above) — never true. Replaced by selection on the loaded file.

### PL-043 (Medium) — **holds, by mechanism; the 600 is stub-observed**
- **Mechanism:** the `$(shell umask 077; ./scripts/get_env > .env)` prerequisite is deleted (`Makefile @@ -156,11 +156,6 @@`); the `docker-%` recipe (`@@ -175,5 +170,17 @@`) is one shell: `rm -f .env && [ ! -e .env ] || { ...; exit 1; }; trap 'rm -f .env' EXIT; trap 'exit 130' INT TERM HUP; ( umask 077 && set -C && ./scripts/get_env > .env ) || { ...; exit 1; }; ... docker run ...`. A fresh create under `umask 077` is 0600; `set -C` refuses an existing file; an unremovable file exits before anything is written.
- **Test:** F2-3's docker stub runs `stat -c %a .env` — the acceptance's own measurement — and the check requires `600` plus this run's `F2_FORWARDED=yes` and no `STALE`; F2-3b runs the recipe in a 0555 directory and requires no container, non-zero rc, and `STALE=1` intact.
- **Not in the packet:** a real `make docker-*`; the report names it for the integrator.

### PL-076 (Low) — **cannot tell from the packet**
- No hunk in `F2.diff` touches `sources/GENERIC_X64/retroarch.cfg`. The report says F1's `9fd73da845` on `next` removed the line (`grep -c` 0). That commit and file are outside this packet; the item's resolution is F1's to show.

---

## 2. The first audit's findings — is the stream's answer sound as the diff shows it?

| seat / id | verdict | the hunk / the reason |
|---|---|---|
| claude G-F2-01 (four fixes with no hunk) | **withdrawal holds** | This packet's diff *does* carry them: `gst-plugins-bad @@ -7,23 +7,42 @@`, `gst-plugins-base @@ -81,20 +81,23 @@`, `ryzenadj @@ -1,5 +1,6 @@`/`@@ -14,6 +15,6 @@`, `dmidecode @@ -1,5 +1,6 @@`, `woff2 @@ -15,8 +15,7 @@`, the two `packages/compress/zip` deletions, `091-vbox-graphics` deleted. The gap was the earlier packet's. |
| claude G-F2-02 (0018 re-reads at content load; default direction) | **answered** | `configuration.c @@ -4016,6 +4016,11 @@`: `command_record_append_config(...)` right after the append block (`check_verbosity_settings(conf, settings); }`); the answer is stored (`static bool command_append_auto_slot`) and both guards read the stored value (`command.c @@ -1913,6 +1967,18 @@`, `runtime_file.c @@ -290,7 +292,16 @@`). Caveat: the record is a *second read* of the same paths (`config_file_new_from_path_to_string(ptr)`), not a capture from the `conf` RetroArch parsed — the two reads are in the same function call, so "the files RetroArch read" is true to within that window. The default `false` sends a launch with no readable append file to upstream's reset, which is the finding's safe direction. F2-4's compiled matrix (`0100001111`, including `--rr` = file deleted after the record) exercises it. |
| claude G-F2-03 (post_patch proved by calling it) | **answered** (statically) | F2-6's added block greps `scripts/unpack` for `pkg_call_exists_opt post_unpack && pkg_call`, `patch -d "${PKG_BUILD}" -p1`, `pkg_call_exists_opt post_patch && pkg_call` and requires the line numbers to increase. It reads the build system's text, not a run; `scripts/unpack` is outside the packet. |
| claude G-F2-04 (row floor fires only as last statement) | **answered** | All five generator lines end `\ || die "rotation table <core>.txt: the generator failed or found under 100 games ..."`. F2-2b's die check sources each recipe with a `python3` that exits 1 and requires `die`. Note (G2-F2-01 below): that check also passes on the base tree, so its quoted FAIL-before was measured against the first delivery. |
| claude G-F2-05 (`#if 0`, digit separators) | **answered** | `drop_dead()` in both generators (states dead/one/live/gone; nested `#if` handled by the stack); `LEXEME`'s `(?<![0-9])\'` excludes a quote after a digit. Fixtures `d_fixture2.cpp` (`1'000; /* ... */`, `#if 0`) and `fixture2.c` (`#if 0/#else`, nested `#if 1` in a dead block). Other conditions are read as live, and the header says so. |
| claude G-F2-06 (line-bound checks) | **answered** | F2-4's python block folds whitespace (`re.sub(r'\s+', ' ', ...)`), extracts `gfx_widgets_layout` and asserts the four regular/bold calls end `, 9.0f, true)` and the two queue calls `MSG_QUEUE_MIN_SIZE, false)` appear exactly twice; an unmatched function yields `lay=''` and every tag fails (fails closed). |
| claude G-F2-07 (`video_driver` gl) | **withdrawal holds as far as the packet shows** | No `retroarch.cfg` hunk in `F2.diff`. |
| claude G-F2-08 (Control1 fix forward-only) | **answered, with caveats** | `start_mupen64plus.sh @@ -44,6 +44,28 @@`: on `HW_DEVICE = GENERIC_X64` and the header line present, awk drops exactly the six literal lines to `.repair`, `[ -s ]`, `mv -f`; else `rm -f .repair`. F2-5b runs it under the image's busybox (`PATH="${TMP}/bbin:..."`), checks the six-line diff, idempotence, and SM8250 untouched. Caveats in G2-F2-04. |
| claude G-F2-09 (yabasanshiro-sa on AMD64) | **withdrawal holds as a decision; the fact stands** | `yabasanshiro-sa @@ -8,14 +8,16 @@` restricts only `DEVICE = GENERIC_X64` and its own comment says on x86_64 "the install fails". So the fork's tree, built for AMD64, fails there — as upstream's does since `28e750db32` per the comment. Parity is what F-EM-05 asked for and what the lanes rule prefers; whether upstream's AMD64 actually builds today is outside the packet. |
| claude G-F2-10 (silent SKIP) | **answered** | `check 1 "" "retroarch-... is not under ..."` when `RA_TAR` is empty; `check 1 "" "no gcc on this host..."`; F2-6 `check 1 "" "the ppsspp-lr source ... did not run"`; F2-3b `check 1` when run as root. Each names what did not run. |
| claude G-F2-11 (doc block) | **answered** | `command.c @@ -1903,6 +1903,60 @@`: the helper block sits between `/* ROCKNIX: append auto slot begin/end */` and ends *before* the ` /**\n * Determines most recent savestate slot` context, which stays over `command_event_set_savestate_auto_index`. F2-4 greps the adjacency `@return \c The most recent savestate slot. */ void command_event_set_savestate_auto_index(`. |
| claude G-F2-12 (`/` only) | **answered** | `gfx_widgets_sharp_tail_is()` treats `/` and `\` as one separator; `gfx_widgets_sharp_face()` tests `== '/' || == '\\'` before the tail; F2-4 feeds `C:\RetroArch\assets\ozone\regular.ttf`. |
| gpt G-F2-01 (unchecked `rm`) | **answered** | `rm -f .env && [ ! -e .env ] || { echo ...; exit 1; }` before the trap, `set -C` for the write; F2-3b's 0555 directory case. |
| gpt G-F2-02 (IPv6 listener) | **not in this packet** | No `cheevos_ppsspp.sh` hunk; the findings file records stream D's `adf852a4b7`. |
| gpt G-F2-03 (`GAME()` in a string) | **answered** | `rotation-table-mame.py`: `text = STRING.sub('""', drop_dead(strip_comments(fh.read())))` before the `GAME[A-Z]*\s*\(` search; fixture `note = "GAME(1990, phantom, ...)"`. (The FBA generator keeps strings for its `DRIVER` match and blanks them only for the flags — see G2-F2-10.) |
| gpt G-F2-04 (Control1 repair) | **answered** | Same hunk as claude G-F2-08. |
| gpt G-F2-05 (F2-4 tests no behaviour) | **answered** | The 0018 helper is compiled against libretro-common (`config_file.c` et al.) and run over ten lists; the sharp-size step is compiled alone and asked eight questions (`Inter UI Regular|...|18|11.0`). Both can fail (`1111111111`, `none|...`). |
| gpt G-F2-06 (missing prerequisites) | **answered** | Same as claude G-F2-10. |
| gpt G-F2-07 (ARMSX2 `mv`) | **not in this packet** | No `cheevos_armsx2.sh` hunk; D's `a78a72269f`. |

---

## 3. Findings of my own

None reaches Medium: I found no fix in this packet that introduces a defect I can demonstrate from the diff. What follows is claim precision, guard shape and upgrade-path gaps, each checkable in one file.

### G2-F2-01: The harness block describes a `--old` result the follow-up made stale, and one follow-up FAIL-before is not against the audited tree
- **Severity:** Low
- **Category:** Evidence labelling / test documentation
- **Where:** `tools/last-good-scripts-test`, the F2 block's header comment; F2-2b's third check; `F2.report.md` § Follow-up, row claude G-F2-04
- **What:** The block's header still says "37 checks FAIL there, every case at least once, and the six that PASS both ways are the controls." Counting `check` calls in the block gives 51 (F2-1:7, F2-2:8, F2-2b:3, F2-3:4, F2-3b:1, F2-4:11, F2-5:1, F2-5b:3, F2-6:2, F2-7..F2-9:3, F2-10:5, F2-11..F2-13:3) — matching the report's 437 − 386 — of which the follow-up added eight (F2-2b ×3, F2-3b, F2-5b ×3, F2-6's unpack-order check). Read against the base tree, four of the eight pass both ways: F2-2b's die check (the base recipe's `rotation_table_check` reads `wc -l` = 0 from the file the failed `python3 ... >` created and calls `die` itself), F2-5b's second and third checks (no repair block → the file is unchanged, `plugin = 5` present), and F2-6's `scripts/unpack` order check (F2 did not change `scripts/unpack`). So `--old` would now read 41 FAIL / 10 controls, not 37 / 6.
- **Failure scenario:** a reader takes the block's header as the record of what `--old` shows and the report's FAIL-before for claude G-F2-04 (`returned without die in: fbalpha2012-lr ...`) as an observation against `417dcd8610`; it was observed against the first-delivery tree, which the report does not say.
- **Evidence:** the header lines quoted; the base recipe's `rotation_table_check` (`[ "${rows}" -ge 100 ] || die ...`) in the removed lines of the five recipe hunks; the follow-up section of the report quotes 437 PASS and no `--old` run. What would have refuted this: an updated header or a fresh `--old` line in the follow-up; neither is in the packet.

### G2-F2-02: "Only what the compiler reads counts" is wider than the generators' behaviour
- **Severity:** Low
- **Category:** Claim precision
- **Where:** `rotation-table-fba.py` header and `DRIVER` regex; `rotation-table-mame.py` header; both `main()` loops
- **What:** (a) `DRIVER = re.compile(r'struct\s+BurnDriver[D]?\s+BurnDrv\w+...')` reads `BurnDriverD` as live. In FBNeo, `BurnDriverD` is the debug-only driver class, excluded from a non-debug build (this is FBNeo's `burn.h`, outside the packet — stated as recollection, not read). (b) Both generators now record zeros (`out[name.group(0)[1:-1]] = turns`; `out[name] = TURNS.get(rot.replace(' ', ''), 0)`) where the base recorded only turns, and `drop_dead` reads every non-literal `#if` as live — so a game declared in both arms of an `#ifdef` is decided by file order, and a later ROT0 clears an earlier turn. The MAME header describes this as "every live declaration counts".
- **Failure scenario:** (a) a rotated `BurnDriverD` row ships in a table for a game the release core does not have — harmless to display, but a row the header says cannot exist; (b) a future core pin with a game declared ROT270 under `#ifdef A` and ROT0 under `#else`, in that order, gets no turn, whichever arm the build compiles.
- **Evidence:** the lines quoted. The report's counts (852/1923/2543/1642/2180, byte-identical between first delivery and follow-up) say neither shape occurs at the current pins; F2-2's fixture puts `BurnDriverD` only inside a comment, so a live `BurnDriverD` is untested.

### G2-F2-03: No `Already written:` for the six rotation rows the new generators drop
- **Severity:** Low
- **Category:** Upgrade path (D-WORKFLOW-050)
- **Where:** `F2.report.md` sweep row 37 (gpt F-EM-04) and the five `makeinstall_target` hunks
- **What:** The fix changes what the tables say for `sbdk` (three FBA tables), `nrallyv`, `dambust`, `kkgalax`, `mrkougr2`. The tables live on the system partition and are replaced by the image, but `upgrade-and-install.md`'s own example (#288) shows EmulationStation persists per-game rotation records derived in part from the core's table. The report's row gives the new counts and no answer for a record or a capture already written from the false rows; the follow-up's "same bytes as before" compares first delivery to follow-up, not to the base.
- **Failure scenario:** a device that showed `sbdk` turned by the false row keeps whatever ES recorded from it until the #288 mechanism ("a record without `from=own-launch` is not trusted, the core's table stands in") applies — if it applies to this class; the packet cannot say.
- **Evidence:** report row 37 and § "What changes on devices"; ES source and the commit body's `Already written:` line are not in the packet.

### G2-F2-04: The Control1 repair is a migration with no rehearsal seed, keyed on a variable the packet cannot see
- **Severity:** Low
- **Category:** Upgrade path (D-WORKFLOW-050 § Migrated) / guard visibility
- **Where:** `start_mupen64plus.sh @@ -44,6 +44,28 @@`; `F2.diff` as a whole (no `tools/vm-upgrade-rehearsal` hunk)
- **What:** The rule text embedded here says a migrated piece is added to `tools/vm-upgrade-rehearsal`'s seeds "so the next candidate proves it"; the diff adds none and the report hands the guest run to the integrator. The repair's gate is `[ "${HW_DEVICE}" = "GENERIC_X64" ]`; where the script gets `HW_DEVICE` (`/etc/profile`, presumably) is outside the hunk, and F2-5b sets `HW_DEVICE="$1"` itself, so an unset variable on the guest would make the repair a silent no-op the harness cannot see. Minor: a copy whose six lines differ by a byte (CRLF, trailing space) keeps the header line, so the gate fires and the file is rewritten identically at every launch.
- **Failure scenario:** the launcher does not export `HW_DEVICE` (or exports another spelling); the guest keeps the spliced Control1 while the harness reports PASS.
- **Evidence:** the gate line; the harness's `f2_m64() { ( set +u; HW_DEVICE="$1"; M64PCONF="$2"; ... ) }`. The stream did not own `tools/vm-upgrade-rehearsal` (plan § files), which explains but does not close the gap.

### G2-F2-05: `scripts/get_env`'s exit status now gates every docker build, and its semantics are outside the packet
- **Severity:** Low (fail-closed direction)
- **Category:** Regression risk / guard direction
- **Where:** `Makefile @@ -175,5 +170,17 @@`
- **What:** The base ran `get_env` as `$(shell ...)` and discarded its status; the recipe now runs `( umask 077 && set -C && ./scripts/get_env > .env ) || { echo "scripts/get_env failed: no container started" >&2; exit 1; }`. If `get_env` can end non-zero for a benign reason (a final `grep -v` that passes nothing, an optional file absent), every `make docker-*` stops. F2-3's stub `get_env` exits 0 or 3 by construction, so the case cannot see it.
- **Failure scenario:** a builder with an empty forwarded environment (a CI runner) gets "scripts/get_env failed" on every docker target.
- **Evidence:** the lines quoted; `scripts/get_env` is not in the packet. One real `make docker-*` (the report's integrator item for PL-043) would settle it.

### G2-F2-06: Two definitions of "sharp" in the patch stack
- **Severity:** Low
- **Category:** Claim precision / upstream fit
- **Where:** 0016's message (`@@ -1,4 +1,4 @@`, `@@ -10,17 +10,20 @@`); 0017's message and table comment (`@@ -2,34 +2,55 @@`, `@@ -54,6 +55,102 @@`)
- **What:** 0017's tables are the sizes with a fully lit column in 100 % of strokes (`REGULAR_SHARP_SIZES[] = { 15, 18, ... }`; the comment gives `13:88% 14:87% 15:100%`). 0016 calls 13 px "the lowest size at which Inter's stems cross a whole pixel as they do at 14 (13 px: 88 %...)", and 0017's message says the queue takes no step because 13 is "one Inter's stems already land on". By the table's own criterion 13 is not a sharp size; by the floor's it is. A reviewer of D-UI-088 ("moved up to the nearest sharp size") cannot tell which definition governs.
- **Failure scenario:** an upstream reviewer asks why the queue face is exempt from the step the same patch applies to the regular face; the two messages answer with different thresholds.
- **Evidence:** the quoted lines. Refutation sought: a sentence defining "sharp" once; none in either message.

### G2-F2-07: 0019's re-placement runs inside `gfx_widgets_layout`; locking and double-push are not visible
- **Severity:** Low (cannot tell)
- **Category:** Regression risk / coverage
- **Where:** 0019 `@@ -1180,6 +1201,24 @@`: `if (p_dispwidget->current_msgs_size) gfx_widgets_msg_queue_move(p_dispwidget);`
- **What:** `gfx_widgets_layout` is called from `gfx_widgets_iterate` (on a dimension change) and from `gfx_widgets_context_reset`. 0014's context refers to "the producer-locking fix" (`current_msgs_lock`) on this queue. Whether `current_msgs` may be walked here without that lock, and whether `gfx_widgets_iterate` also moves the queue in the same pass (a second animation push on the same `offset_y` before the first has moved it, since `msg_queue_move` compares `msg->offset_y != y`), cannot be judged from the packet — the bodies of `gfx_widgets_msg_queue_move` and `gfx_widgets_iterate` are outside it.
- **Failure scenario:** a message pushed from another thread while a context reset lays out; or a stack that animates twice in one frame.
- **Evidence:** the quoted line and 0014's forward-declaration comment. F2-4 compiles with `-DHAVE_THREADS` but tests no runtime.

### G2-F2-08: Two harness checks accept absence where "once" is the claim; one fixture is a git object with a misleading FAIL text
- **Severity:** Low
- **Category:** Test strength
- **Where:** F2-12 (`... | grep -o 'has not tagged a release since 2020' | wc -l)" -le 1`; `grep -c 'segfaults' ...)" -le 1`); F2-5b (`git -C "${ROOT}" show "417dcd8610:..." > "${MR}/spliced.cfg" 2>/dev/null`)
- **What:** F2-12's pass text says "woff2 says its release date once, gst-plugins-base its appsink story once"; both checks pass at zero. F2-5b's fixture is an object from history rather than a file in the tree; if the object is unreadable (a shallow clone, a rewritten range — the brief notes history was rewritten for stream B), the case fails with "the repair changed: 'nothing'", which names the wrong cause.
- **Failure scenario:** a later comment edit deletes the appsink paragraph; F2-12 still passes. A clone without `417dcd8610` reports a repair defect that is a fixture defect.
- **Evidence:** the quoted lines; `git show`'s status is not tested.

### G2-F2-09: 0018's header records a pass of a different guard than the one it now carries
- **Severity:** Low
- **Category:** Claim precision (F-RW-06's ask)
- **Where:** 0018 header `@@ -19,54 +20,162 @@`: "With both halves, on the QA guest (image a8175c6193, 2026-09-26): no found_last_state_slot line, and the load-state key ... loaded Probe.state.auto."
- **What:** That observation is dated two days before the plan and describes the base 0018 (any negative slot kept). The guard was narrowed twice since (append-only; then recorded at load). The header presents the 2026-09-26 pass as the proof of the patch it heads. The narrowed guard's evidence is the compiled matrix in F2-4; its guest pass is the integrator's (report § For the integrator, `proof-249-auto-slot.sh`).
- **Failure scenario:** a reader takes "Probe.state.auto loaded" as proof that a launch whose `-1` sits only in the main config is reset — the new behaviour — when nothing on a guest has shown it.
- **Evidence:** the date in the header against the report's timeline; `F2.report.md` § Follow-up "check that `proof-249-auto-slot.sh` passes with the new 0018".

### G2-F2-10: The FBA generator matches a driver on text with its strings intact
- **Severity:** Low
- **Category:** Consistency of the extraction fix
- **Where:** `rotation-table-fba.py` `main()`: `text = drop_dead(strip_comments(fh.read()))` then `DRIVER.finditer(text)`; strings are blanked only for `fields = STRING.sub('""', body)`
- **What:** The MAME generator blanks strings before it looks for `GAME(` (gpt G-F2-03's fix); the FBA generator does not, so `struct BurnDriver BurnDrvX = { "x", ... };` inside a string literal would be read as a driver, and a `};` inside a string would truncate a real driver's body (`(.*?)\};`). The header's claim is narrower and true ("a flag is read from the driver's fields, never from the text of its strings"), so this is inconsistency, not a false claim.
- **Failure scenario:** none at the pins per the report's counts; a future pin with such a literal.
- **Evidence:** the lines quoted.

Player-visible text: nothing in this packet reaches a screen — the new strings are build-log `die` messages, a Makefile stderr line and RetroArch log lines; `es-player-text.md` does not apply, and no outcome word is used or misused.

---

## 4. Sweep rows

**Fixed rows spot-checked against the diff (all confirmed present):**
- **F-PB-09** — `gst-plugins-bad @@ -7,23 +7,42 @@`: `eval "gst_plugins_bad_generic_$(declare -f pre_configure_target)"`, the two `${PKG_MESON_OPTS_TARGET/.../...}` flips, two `case ... die`. Depends on the override's lines 1–6 (outside the hunk) sourcing the generic recipe; F2-10's fixture only works if they do, and the report quotes 172 of 172.
- **F-PB-24** — same hunk and `gst-plugins-base @@ -81,20 +81,23 @@`: `compgen -G ... || die`, the eight-file loop, no `|| true` remains.
- **F-PB-19** — `ryzenadj @@ -14,6 +15,6 @@`: `-DCMAKE_EXE_LINKER_FLAGS=-ludev`; both `@@ -1,5 +1,6 @@` hunks add `Copyright (C) 2023 JELOS` and `2026-present ROCKNIX` (the provenance "from JELOS 2023" is the report's claim, not the diff's).
- **F-EM-02 (claude)** — `ppsspp-lr @@ -59,18 +59,17 @@`: `post_patch()` holds the x86_64 sed; `post_unpack()` keeps the cross-compile fix.
- **F-EM-15 / gpt F-EM-02** — `gliden64 @@ -44,13 +44,16 @@`: the `x86_64)` arm gone; `if [ "${DEVICE}" = "GENERIC_X64" ]; then PKG_MAKE_OPTS_TARGET+=" -DNOHQ=On"; fi`. (The upstream `arm|aarch64)` arm in the same context also appends without a space — upstream's line, not touched.)
- **F-EM-05** — both standalone recipes: `if [ "${DEVICE}" = "GENERIC_X64" ]; then PKG_ARCH="aarch64"; fi`.
- **F-EM-08** — `audio-sdl @@ -7,8 +7,11 @@`: `libsamplerate` removed, `speexdsp` kept; the `NO_SRC=1` justification is in `make_target`, outside the hunk (F2-8 greps it).
- **F-EM-10/11/12, gpt F-EM-04/06** — both generators: SPDX + copyright, `--min N`, corrected usage lines, comment lexer; the `macro` regex is gone from the MAME file.
- **F-RW-07** — 0014 `@@ -90,7 +92,10 @@`: `bool xmb = ... || (menu_driver_id == MENU_DRIVER_ID_UNKNOWN && string_is_equal(settings->arrays.menu_driver, "xmb"))`.
- **F-RW-08 / gpt F-RW-04 / gpt F-RW-03** — 0019 `@@ -1180,6 +1201,24 @@`: the log after `divider_width_1px`, both pitches include the divider, `gfx_widgets_msg_queue_move` re-called.
- **F-RW-10** — 0011 header names `libretro/RetroArch/pull/19518` and `d1fcc5fd364d` (the merge date and hash are unverifiable here).
- **F-VM-09** — `mupen64plus.cfg @@ -186,12 +186,6 @@`: the six lines removed between `# Digital button configuration mappings` and `DPad R = button(14)`; the launcher's `b[1]..b[6]` match them byte for byte.
- **F-PB-21** — `woff2 @@ -15,8 +15,7 @@` (sentence once), `cairo @@ -6,9 +6,10 @@` ("cairo 1.18 has no GL or GLES backend"), `091-vbox-graphics` deleted (`index e69de29bb2` = empty blob).
- **F-BR-10** — both `packages/compress/zip` files deleted; the surviving project recipe is not in the packet, so "same steps, same patch byte for byte" (the § Before deleting a duplicate list) rests on the report's `cmp`.

**Withdrawn rows I can judge from the packet:**
- **gpt F-BR-18** (valloc probe): the deleted patch shows the call under `#ifdef MMAP` — that much of the reason is visible. "Nothing defines `MMAP`" is a claim about zip30's `unix/configure`, outside the packet; either way the probe's worst case is `-DNO_VALLOC` (a `malloc` fallback), and the patch now exists only in the project copy, also outside the packet. Reason partly verifiable, outcome benign.
- **claude F-PB-05** (QEMU quirks → F1): the plan's file list says "NOT GENERIC_X64 (F1)"; consistent. Note that F2 did delete a `hardware/quirks/devices/**` file (`innotek GmbH VirtualBox`) under F-PB-21 — the boundary was applied two ways; harmless here.
- **claude F-RW-09 / F-EM-13** (fork references → PR-prep): the split is as described — no `RARCH_LOG` string carries an issue number (F2-4 polices it), while comments still do (`gfx_widgets.h` "ROCKNIX fork #296"; 0016's context "#251; 14 until #296").
- **claude F-RW-03** (D-UI-100), **F-EM-06** (ES `CaptureRotation.cpp:31`), **F-PB-20** (`get_env` grep), **gpt F-PB-23** (`scripts/extract`), **F-PB-15/18/19 gpt**, **F-PB-20 gpt**: the refuting line or the owning file is not in the packet; not judgeable here. The recipes' comments now do name `/usr/config/emulationstation/rotation/<core>.txt` (F-EM-06's ask for a stated path).

---

## 5. Seams

- **`tools/last-good-scripts-test` (shared with every stream):** F2's block relies on the header's `check <rc> <pass> <fail>`, `src_of` honouring `--old`/`BASE_REF`, `${TMP}/bbin` holding the image's busybox, `ROOT`, `OLD`, `FAIL`, and on sitting immediately before the summary line — a position more than one stream may claim; the integrator merges. F2 leaves unprefixed globals (`L`, `B`, `n`, `rc`, `rc2`, `g`, `a`, `h`, `s`, `RO`, `MX`, `GX`, `RX`, `AS`, `GR`, `GI`, `MR`, `PX`) and a global function `builds()`; a block placed after F2's inherits them. The block's `--old` header is stale (G2-F2-01).
- **RetroArch patch stack order:** 0019's hunk rewrites the `#include "../verbosity.h"` comment that 0017 adds, so 0017→0019 (and 0014→0016→0017) is a strict fuzz-0 dependency chain; `batteryplus/` is applied after. Both sides are F2's; F2-4 is the guard.
- **Launcher ↔ 0018:** 0018 now keeps Auto only when the `-1` arrives via `--appendconfig` (`command_append_list_sets_auto_slot` walks `RARCH_PATH_CONFIG_APPEND`). The launcher that writes that file is another stream's; if it ever moved `state_slot` into the main config or an override, Auto would be reset on every launch. The contract is unstated on the launcher side in this packet.
- **Seed ↔ repair:** `mupen64plus.cfg`'s removed lines and `start_mupen64plus.sh`'s `b[1..6]` must stay identical; they do today. `HW_DEVICE`'s export is the seam with `/etc/profile` (G2-F2-04). The report notes F1 may also have touched `config/GENERIC_X64/` files.
- **gst overrides ↔ generic recipes ↔ WebKit:** the override expects the generic `pre_configure_target` to exist at source time and to contain `-Dmpegtsdemux=disabled -Dmpegtsmux=disabled`, and dies otherwise (fail-closed both ways); the eight payload names are a contract with webkitgtk's needs, checked against an image listing per the report.
- **ES ↔ rotation tables:** the file format `<romname> <turns>` is unchanged; six rows change meaning (G2-F2-03). ES's reader is in the other repository.
- **`Makefile` ↔ `scripts/get_env`:** the exit status is newly load-bearing (G2-F2-05).

## 6. Coverage boundary

Could not be judged from this packet: `calculate_stamp`'s handling of a file in `PKG_NEED_UNPACK` and `get_pkg_directory` at file scope under the real `source_package` (PL-002's literal `scripts/build` run); `scripts/unpack`'s actual hook order (read only as text by F2-6); `scripts/get_env`'s status semantics; the surviving `projects/ROCKNIX/packages/compress/zip` recipe and patch; the generic gst recipes and the override's lines 1–6; the pinned RetroArch tree — `gfx_widgets_sharp_size`'s band logic, `gfx_widgets_msg_queue_move`'s locking, whether `command.c` already includes `<file/config_file.h>`/`compat/strl.h` (F2-4's `-fsyntax-only` compile is the only evidence, and the helper is not under `#ifdef HAVE_CONFIGFILE`), `config_load_file`'s call sites; FBNeo's `BurnDriverD` semantics and the pinned drivers' `#if` shapes; ES's reader and any rotation records it wrote from the six false rows; the launcher's `--appendconfig` file; `HW_DEVICE`'s source; `tools/font-stems`' measurements and the register rows D-UI-088/098/100 and D-WORKFLOW-050's tool (`tools/rc-preflight`); every commit body's `Already written:` line; every VM, guest and device observation, and the report's PASS counts, `cmp` results and `git merge-tree` claim. The verdicts above are what the diff and the harness text support; the runtime half of PL-032, PL-043 and PL-002 is, as the report itself says, the integrator's to prove.
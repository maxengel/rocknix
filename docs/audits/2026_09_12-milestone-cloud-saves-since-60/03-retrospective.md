# Retrospective Audit — Cloud saves since audit #60 (fork issue #129)

**Auditor:** Code Auditor skill v1.10.0
**Date:** 2026-09-12
**Subject:** Milestone tier. ROCKNIX `e98fdd84f7..e1ddfd7ec2`; ES `00a258f9d7..f93acc2a6`
**Spec:** GitHub issue bodies, `maxengel/rocknix`

Findings are numbered F-NN and carry severity at first statement. Phase 3.5 (cross-system
interaction) and 3.6.5 (site/sibling/adjacent) are run per the skill; the seam list the
orchestrator named is worked through in § 3.5.

---

## Running Notes

### F-01 (High) — the ES OAuth lifetime regression test has not compiled since 2026-09-11

**Category:** Test Gap / Cornerstone Violation (guard with no observed positive).

`~/Development/emulationstation-next/tests/cloud-oauth-lifetime.py` lifts
`cloudOAuthPresentChoice` and `cloudSetupPresent` verbatim out of
`es-app/src/guis/GuiMenu.cpp` and compiles them under AddressSanitizer against doubles. Its
double is `struct CloudBackend { std::string label = "Dropbox"; };`
(`tests/cloud-oauth-lifetime.py:74`). The real struct (`es-app/src/guis/GuiMenu.cpp:6226-6232`)
carries `tier`, `name`, `label`, `subprovider`, and since `229f50ad4` (2026-09-11 04:30 UTC,
#128) the extracted body calls `CloudText::providerSubtitle(backend.name, backend.label)`.

**Reproduction, run this session:**

```
$ python3 tests/cloud-oauth-lifetime.py          # at f93acc2a6
lifetime.cpp:83:24: error: 'CloudText' has not been declared
lifetime.cpp:83:60: error: 'const struct CloudBackend' has no member named 'name'
exit=1
$ git show 229f50ad4^:es-app/src/guis/GuiMenu.cpp > /tmp/GuiMenu-pre.cpp
$ python3 tests/cloud-oauth-lifetime.py /tmp/GuiMenu-pre.cpp
PASS phone / PASS keyboard / PASS no-browser / PASS failed-start      exit=0
```

So it worked at the parent of the breaking commit and has been dead since. **Nothing runs
it**: `grep -rn 'cloud-oauth-lifetime'` finds no caller in either repo, and the ES repo has
no `.github/workflows` directory at all. `.claude/rules/es-native-ui.md:388` names it as the
check on exactly the wizard page-replacement transitions that crashed on the device on
2026-09-05. The guard's absence is indistinguishable from its silence — blindspot 14/23/26,
and `engineering-practices.md` § "Guards must fail closed".

It has been absent through #128, #138, #140 and the seven-issue pass.

### F-02 (Medium-High) — `>>> offer create-saves-folder` is silently dropped by the transfer page

**Category:** Interaction Defect. Seam: cloud scripts × EmulationStation, protocol lines.

There are **two** readers of the `>>> ` protocol and they implement different subsets:

| Reader | pid | doing | why | offer | tier | unit | removed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `CloudText::classifyProtocolLine` (`es-app/src/CloudText.cpp:278-322`), used by `ThreadedCloudSync::run` | ✓ | ✓ | ✓ | **✓** | ✓ | — (falls to `Unknown`) | — |
| `GuiCloudTransfer::handleLine` (`es-app/src/guis/GuiCloudTransfer.cpp:835-958`), its own parser | — | ✓ | ✓ | **—** | ✓ | ✓ | ✓ |

`cloud_restore` emits `>>> offer create-saves-folder|<path>[|<near>]` at
`projects/ROCKNIX/packages/network/rclone/sources/cloud_restore:980` and `:989` when the cloud
root lists but the saves folder is absent — the #100/#127 empty-cloud offer. Only
`ThreadedCloudSync` acts on it (`es-app/src/ThreadedCloudSync.cpp:206-214`, `:481-491`).

`GuiCloudTransfer` has no `offer` branch at all (`grep -i offer` over both its files finds
one unrelated comment at `GuiCloudTransfer.cpp:587`), and its `handleLine` falls through
unmatched `>>> ` lines to the rclone parsers, which ignore them.

**Consequence:** the RESTORE FROM THE CLOUD transfer page runs
`/usr/bin/cloud_restore --yes --saves-only` (`es-app/src/guis/GuiMenu.cpp:4618`) on a
`GuiCloudTransfer`. On a cloud that has never held saves — the fresh-handheld journey (#26),
which is the flow most likely to meet it — the script exits 0 with its plain sentence and the
offer line, and the page shows a completed run with nothing transferred and **no offer**.
The same script run from GAME SETTINGS → RESTORE SAVES FROM THE CLOUD (`GuiMenu.cpp:5439`,
`ThreadedCloudSync`) *does* offer it.

Neither #100 nor #127 states which surface the offer appears on, so this is not a failed
acceptance criterion; it is the cross-surface gap a milestone-tier audit exists to see.
Blindspot 29's shape ("a feature that ships but has no route") applied to one of two routes.

### F-03 (Medium) — `RCLONE_NET_OPTS_FALLBACK` still carries the two-retry bound that #107 removed

**Category:** Spec Drift / Interaction Defect (sibling site missed). Blindspot 36's defect,
alive on the fallback path.

`f988562665` ("low-level retries back to ten") changed three files —
`cloud_sync.conf`, `cloud_sync.conf.defaults`, `cloud_sync_helper` — and **not** the four
in-script constants:

```
cloud_backup:42           RCLONE_NET_OPTS_FALLBACK="… --low-level-retries 2 --retries 1"
cloud_restore:42          (same)
cloud_content_backup:121  (same)
cloud_content_restore:125 (same)
```

against `cloud_sync.conf.defaults:92` / `cloud_sync.conf:89`
`… --low-level-retries 10 --retries 1`.

The scripts' own comments now assert something false. `cloud_restore:33-41`: *"This is the
same value for a config the helper has not reached … Keep the two values in step."*
`cloud_backup:707-710`: *"Empty or unset … means the shipped values, never rclone's
defaults."* Both were true when written and are not now.

**Reachable path:** `load_config` uses the fallback whenever `RCLONE_NET_OPTS` is empty or
unset (`cloud_backup:711-713`, `cloud_restore:742-744`). That is the state of a conf the
helper has not reached, a line somebody blanked, **and — the realistic one — a torn conf that
fell back to a `.bak` written before #103**, a path `tools/last-good-scripts-test` explicitly
exercises ("load_config on a torn conf falls back to the .bak and goes on"). On Dropbox that
restores #107 exactly: 6 of 12 replacements failed at two low-level retries, measured on the
maintainer's device.

`cloud_sync_helper:389-397` migrates the *conf* correctly, guarded on the exact shipped string
and a once-only marker. The migration is not the gap; the constants are.

### F-04 (Medium) — three player-facing strings name a control that does not exist

**Category:** Spec Drift / Documentation Gap (in-product). Rule:
`upgrade-and-install.md` § "A menu entry that moved" — *"does any string still name the old
path? … a message that sends someone to a menu that no longer holds anything is a dead end at
the moment they most need the instruction."* Also `least-surprise.md` § "Same thing, same
place, same words" and `player-language.md` step 4.

Method: every `_( )` string containing a menu-path shape (`UNDER <LABEL>`, `<A> > <B>`,
`USE '<LABEL>'`) was extracted, then each named label was checked for an exact
`_("<LABEL>")` definition in the ES tree.

| Site | String says | The tree has | Introduced |
| --- | --- | --- | --- |
| `es-app/src/guis/GuiMenu.cpp:356` | "…OR TURN ON **SETTINGS BACKUP** UNDER CLOUD SETTINGS." | **No control of that name anywhere.** The CLOUD SETTINGS group (`GuiMenu.cpp:5414-5445`) holds four rows: SYNC SAVES WITH THE CLOUD, BACK UP SAVES TO THE CLOUD, RESTORE SAVES FROM THE CLOUD, MANAGE CLOUD STORAGE. There is no settings-backup toggle to turn on; settings go up as a **tick** on the transfer page. | `d161afb2b` "Cloud: one vocabulary" (#73) — **in range** |
| `es-app/src/guis/GuiMenu.cpp:362` **and** `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:673` | "…OR **BACK UP SETTINGS TO THE CLOUD** FROM GAME SETTINGS." | No row of that name. The nearest is MANAGE CLOUD STORAGE → **BACK UP TO THE CLOUD** (`GuiMenu.cpp:4907`), then tick SETTINGS. | `0d3f0fb1e` — **in range** |
| `es-app/src/guis/GuiCloudTransfer.cpp:652` | "**UPDATE GAME LISTS** UNDER GAME SETTINGS TO SEE THE CHANGE." | The row is `_("UPDATE GAMELISTS")` (`GuiMenu.cpp:5061`, GAME SETTINGS → TOOLS). | `4bab23fcb` "Plain language on the card and the transfer page" (#108) — **in range** |

Two of the three were *introduced by the vocabulary and plain-language passes in this audit's
own range* (#73, #108) — the passes whose job was to make one word mean one thing. The third
is a sibling in `backuptool`, which is the Phase 3.6.5 "Adjacent" site: the same sentence
lives in the script and in ES, and only one copy would be found by grepping either repo alone.

**Site/Sibling/Adjacent (3.6.5):** Site = `GuiMenu.cpp:356`. Sibling = `GuiMenu.cpp:362`.
Adjacent = `backuptool:673` (different repo, same sentence). Sibling-2 =
`GuiCloudTransfer.cpp:652`. All four classified **FIX-NOW**; none is fixed in this audit
(an audit records).

### F-05 (Medium) — one page, two row labels, two descriptions

**Category:** Cornerstone Violation (`least-surprise.md`, D-UI-022, D-UI-045).

`GuiMenu::openRestoreRelink` is reached from two rows, both gated on the same marker
`/storage/.config/.restore-finish-pending`:

| Where | Label | Description |
| --- | --- | --- |
| Cloud hub, `GuiMenu.cpp:5043-5045` | **FINALIZE RESTORE** | "RE-ENTER PASSWORD INFO THAT'S NOT BACKED UP TO THE CLOUD (WI-FI, ACCOUNTS, ETC.)" |
| NETWORK SETTINGS, `GuiMenu.cpp:9025-9027` | **FINISH RESTORE SETUP** | "RE-ENTER THE PASSWORDS BACKUPS DO NOT INCLUDE (WI-FI, ACCOUNTS, THIS DEVICE)." |
| The page itself, `GuiMenu.cpp:7188` | title **FINISH RESTORE SETUP** | subtitle "RE-ENTER THE PASSWORDS BACKUPS DO NOT INCLUDE" |

So pressing FINALIZE RESTORE opens a page called something else, and the same job has two
names in two menus. `GuiMenu.cpp:7359` then tells the player to "FIND IT IN NETWORK SETTINGS >
FINISH RESTORE SETUP" — true of one route and not the other. "ETC." is the vagueness
`player-language.md` step 2 exists to remove, and the other copy already enumerates it.

`git log -S"FINALIZE RESTORE" 00a258f9d7..f93acc2a6` returns nothing, so the split **predates
this range**. It is reported here because #73 (one vocabulary), #108 (plain language) and #118
(the 33-string sweep) all ran inside the range and all three passed over it — which says
something about how those sweeps were scoped (they grepped for a *word*, not for *two rows
reaching one page*).

### F-06 (Low) — the menu path is written two ways, and one of them names a page that does not exist

`CLOUD SETTINGS` is an `addGroup` heading on the GAME SETTINGS page
(`GuiMenu.cpp:5414`); `MenuComponent::addGroup` (`es-core/src/components/MenuComponent.h:39`)
adds a non-selectable header row, not a submenu. So:

- the four cloud scripts say **"GAME SETTINGS > MANAGE CLOUD STORAGE"** (e.g.
  `cloud_backup:462`, `cloud_restore:509`, `cloud_content_backup:96`,
  `cloud_content_restore:97`) — two levels, correct;
- ES says **"GAME SETTINGS > CLOUD SETTINGS > MANAGE CLOUD STORAGE"** (`GuiMenu.cpp:7347`,
  `:7349`) and "GAME SETTINGS > CLOUD SETTINGS IS NOW AVAILABLE" (`:6526`), "IN GAME
  SETTINGS > CLOUD SETTINGS:" (`:6936`) — three levels, one of which cannot be entered.

Both are findable; they are not the same instruction, which is the least-surprise cost.

### F-07 (Low) — one un-hyphenated `WIFI` among 24 hyphenated `WI-FI` strings

`es-app/src/guis/GuiMenu.cpp:8733` `_("ENABLE WIFI GPIO")`, against 24 `_("…WI-FI…")`
strings elsewhere (`GuiMenu.cpp` 356, 368, 4586, 4992, 5045, 7214-7219, 8726, 8760-8776,
8849-8935, 9026; `GuiWifi.cpp` 51, 114). `es-native-ui.md` § Conventions: *"**'Wi-Fi',
hyphenated**, in every user-visible string."*

### F-08 (Low) — `tools/pkgcheck` cannot fail a caller

`tools/pkgcheck` contains **no `exit` statement** (`grep -n exit tools/pkgcheck` → nothing).
It prints `[FAIL] … late binding violation` and still returns 0 — proved this session by
running a scratch copy over a planted `PKG_CFLAGS="${CFLAGS}"` at global scope. `CLAUDE.md:58`
calls it "the only lint"; `.claude/rules/issue-tracking.md:79` and the `code-auditor` skill's
own evidence table (`SKILL.md:126`) both say to *run it and record exit status*. An exit status
recorded from this tool proves nothing; only the absence of `[FAIL]`/`[WARN]` lines does.
Whole-tree run this session: 0 such lines.

### F-09 (Low-Medium) — #71's criterion says `--filter`, the code recognises only `--filter-from`/`--filters-file`

Detailed in `02-forward-audit.md` § AC-71-4. `cloud_backup:983` / `cloud_restore:1034`.
The tick's note narrows the claim without editing the criterion — blindspot 27, and
`issue-tracking.md`'s "edit the body in the same action".

### F-10 (Low) — #127 is OPEN with every acceptance criterion ticked

`gh issue view 127` → `OPEN`, three `- [x]`. `issue-tracking.md` § "Closing discipline":
deliver → close `completed` with a comment naming the commits; *"Never leave a delivered issue
open."* Either there is scope the checklist does not express (D-CLOUD-092's row does say "the
maintainer's confirmation is the open half", which would be that scope — and it is not a
checkbox), or it should be closed.

### F-11 (Medium) — `D-INFRA-008` is two different decisions

**Category:** Cornerstone Violation (`decision-register.md` § "One row per decision: date,
**stable ID**", and the whole point of citing by ID).

`docs/decision-register.md:94` (2026-09-05) — *"The device-flashing documentation targets the
maintainer's own bench…"*. `docs/decision-register.md:171` (2026-09-11) — *"A credential never
crosses a script boundary: `cloud_setup --info` prints `PASSWORD_SET=1|0`…"*. Two unrelated
decisions, one ID.

It was created by following audit #72's own punch list —
`docs/audits/2026_09_06-issue-device-flashing-runbook/05-punch-list.md:50` says *"Append two
rows: (a) **D-INFRA-008** — the flashing documentation targets…"* — and then #116's work
assigned the same number again on 2026-09-11. `docs/cloud-sync-changelog.md:1830` cites
`D-INFRA-008` for the credential decision; #72's artifacts cite it for the flashing one.
`gh issue view 116` cites it for the credential one.

**Mechanical check (mine, this session):** a parse of the whole register found exactly one
duplicate ID among 199 decided rows and no ID appearing in both the `Decided` and
`Open decisions` tables.

**Adjacent (3.6.5):** the same parse showed `D-CLOUD-006` and `D-CLOUD-007` in neither table,
while `D-CLOUD-010`'s text says *"Settles D-CLOUD-007"* and a work log cites `D-CLOUD-006`.
The rule says a settled open question *"moves down as a row, keeping its ID"*; these two were
removed from `Open decisions` without moving down, so two cited IDs resolve to nothing.
Classified FILE-FOLLOWUP, not FIX-NOW — they are historical and harm nobody today.

### F-12 (Low-Medium) — the "same list" invariant between `fork-workflow.md` and the pre-push guard is false

`.claude/rules/fork-workflow.md:28`: *"This list and `PERSONAL_PATTERNS` in `.githooks/pre-push`
are the same list; change one and change the other."*

They are not. `PERSONAL_PATTERNS` (`.githooks/pre-push:29-60`) carries three entries the rule's
prose list does not: **`tools/emulator-exit-test`**, **`tools/vm-qa`**, **`tools/time-to-play`**
— all three fork-only tools added inside this audit's range.

Direction of risk is mild: the *hook* is the enforcing copy and it is complete, so no PR can
leak them. The cost is that the invariant the rule asserts is untrue, which is how the next
person stops checking either copy.

**Checked while here (blindspot 26):** `git config core.hooksPath` =
`/workspace/repos/rocknix/.githooks`, absolute, and `ls` lists `pre-push`. The guard can run.

### F-13 (Medium) — an exit sync that ES declines to start says nothing at all

**Category:** Interaction Defect. Seam: `ThreadedCloudSync` × the cloud scripts' lock.

`es-app/src/FileData.cpp:904-910`:

```cpp
if (SystemConf::getInstance()->get("cloudsaves.gameexit") == "1"
    && Utils::FileSystem::exists("/usr/bin/cloud_backup")
    && !ThreadedCloudSync::isRunning())
{
    ThreadedCloudSync::start(window, "/usr/bin/cloud_backup --yes --saves-only --recent", …);
}
```

When another sync is already running — the startup sync on a slow link, a manual one the
player left going — the exit sync is **not started**, and because it never runs there is no
card, no `>>> why`, no last-run stamp and no log line. The player exits a game and nothing
happens.

Had ES started it, the script's own lock would have exited 75 and the card would have read
`SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` — a real answer. The pre-emption is defensible
(D-CLOUD-093's trade means a second run *could* now start beside an orphan, and not starting
one is cheaper than starting one to be refused); what is not defensible is that it is silent.

`least-surprise.md` § "No silent outcomes": *"Anything that did not happen as the screen
implied it would is said, once, with the consequence and the way forward."* D-UI-041 (#139)
is the issue that says this for the offline case; its four criteria name **no route**, **a
dead uplink** and **a cloud that does not answer**, and not this one. So it is a gap in the
issue as well as in the code.

`cloud_capture` is unaffected — it runs earlier and unconditionally
(`FileData.cpp:817-828`), so the session is still recorded.

### F-14 (Low) — unconditional deletion of an opt-in setting on every update

`projects/ROCKNIX/packages/rocknix/sources/post-update:200`:
`sed -i "/system.suspend.dpms/d" /storage/.config/system/configs/system.cfg`, with the comment
directly above it saying *"It is disabled by default, but can be used on an **opt-in** basis"*.
The line is unconditional and `post-update` runs on every update, so the opt-in is deleted
again at every OS update and cannot persist. `upgrade-and-install.md`'s "renaming a key
silently resets everyone's preference" applied to deleting one.

**Provenance:** upstream's (`104a4d14ff`, John Williams, 2026-08-20), reached `next` by merge
inside this range. Not the fork's work; recorded because it ships in the same image and
`engineering-practices.md` § "A failure you find is yours to fix" says provenance is not
priority. Worth an upstream report rather than a fork fix.

---

## 3.5 Cross-system interaction audit

### Interaction: cloud scripts × EmulationStation (the `>>> ` protocol)

**State shared:** the line protocol on stdout, read by two independent parsers.
**Wipe risk:** none (no shared storage) — the risk is divergence.
**Test coverage:** PARTIAL. `CloudText::classifyProtocolLine` has 6 unit cases;
`GuiCloudTransfer::handleLine` has **none** (it is not pure and lives outside
`es-app/tests/unit/`).
**Finding:** **broken in one direction** — F-02. Two parsers, different subsets, and the one
with no tests is the one that drops a shape the scripts emit.

### Interaction: cloud scripts × the lock × EmulationStation's own gate

**State shared:** `/var/run/cloud_sync.lock`, plus ES's in-process `ThreadedCloudSync::isRunning()`.
**Wipe risk:** an orphaned holder blocking every later sync — closed by D-CLOUD-093 (`9>&-`).
**Test coverage:** PARTIAL — `tools/wait-lock-test` covers the *settings* lock
(`001-functions`, #98) and I ran it (PASSED; `--old` FAILs 14 checks). The *cloud* lock's
100-run loop needs a guest.
**Finding:** **safe, with a silent path** — F-13. Two gates for one condition, and only one of
them can speak.

### Interaction: `cloud_capture` × the saves tree × `--recent`

**State shared:** `SAVESPATH` (read by both), `/storage/.cache/cloud_sync/` (written by both).
**Wipe risk:** a capture that wrote under `SAVESPATH` would change mtimes and move the
`--max-age` window; a stage inside `SAVESPATH` would be uploaded by the allowlist.
**Test coverage:** TESTED for the stamp (`tools/cloud-capture-stamp-test`, run by me, PASSED,
`--old` FAILs 9); untested for the interaction.
**Finding:** **safe.** `cloud_capture:88-89` puts `CACHE=/storage/.cache/cloud_sync` and
`STAGE=${CACHE}/stage` outside `SAVESPATH` (default `/storage/roms`), and every write in the
script lands under `CACHE`, `STAGE` or `MANIFEST`. `cloud_backup`'s `--recent` reads
`last-backup` from the same cache and derives `--max-age` from it
(`cloud_backup:1027-1038`); nothing in capture touches a save's mtime.

### Interaction: the startup sync × a game launch × the exit sync

**State shared:** `ThreadedCloudSync`'s single running instance, the lock, the launch gate.
**Wipe risk:** none; the risk is time-to-play and silence.
**Test coverage:** UNTESTED here (needs a guest); `tools/time-to-play` exists for it and none
of #135's criteria is ticked.
**Finding:** **risky and known.** Today a launch *cancels* a running sync (D-CLOUD-076,
`ThreadedCloudSync::cancelForLaunch`, `FileData.cpp:740-744`, SIGTERM then SIGKILL at 1500 ms).
D-CLOUD-109 reverses this — *"a launch never cancels an automatic sync, it waits for it"* —
and is **not yet built**. So the shipped behaviour contradicts a decided row; that is the
boundary #22/#135 close, and it is listed under "Not yet built" rather than as a FAIL.

### Interaction: settings keys × `setsettings.sh` × EmulationStation

**State shared:** `/storage/.config/system/configs/system.cfg`.
**Wipe risk:** a renamed key silently resetting a preference (`upgrade-and-install.md`).
**Test coverage:** UNTESTED directly; `tools/last-good-scripts-test` c. covers `set_setting`'s
atomicity, not key migration.
**Finding:** **safe — a candidate finding that died under refutation, recorded because the
check is the point.** The range renames
`global.retroachievements.challengeindicators` → `challenge_indicators` and
`testunofficial` → `unofficial` in the shipped `system.cfg`, with no migration in
`post-update`. `setsettings.sh:278-285` reads either spelling (`add_setting_either`), which is
the "read both, write the new one" pattern; but `GuiSettings::addSwitch`
(`es-app/src/guis/GuiSettings.cpp:384-409`) reads **only** the new key and writes it on close,
so an upgraded device holding only the old key would show OFF and, on the first visit to the
page, overwrite the old preference.

**Why it is not a defect:** `git log -S` over the ES repo shows ES has **never** written the
old spellings — `git show 00a258f9d7:es-app/src/guis/GuiRetroAchievementsSettings.cpp` already
used `challenge_indicators`, `unofficial`, `encore`. The old key on any device can therefore
only ever hold the value the image seeded (`=0`), so nothing a player chose is behind it.
`add_setting_either` exists to fix the *opposite* bug (the script read the old names while ES
wrote the new ones, so three switches never reached RetroArch) and it does.

### Interaction: journald configuration × the GENERIC_X64 quirks

**State shared:** `/etc/systemd/journald.conf` and its drop-in directory.
**Test coverage:** the VM is where #104's journal evidence was taken.
**Finding:** **risky as an evidence source.** Three quirk files write three drop-ins with
conflicting values; `20-x64-fd-improvements.conf` wins lexically, so the guest runs
`SyncIntervalSec=10min` where the image ships `1min`. Detailed in `02-forward-audit.md` §
AC-104-1.

---

## 3.6 What's missing

Each negative claim carries the literal searches that produced it.

| Missing | Search run | Result |
| --- | --- | --- |
| Reference frames for the walks, and a comparison step (#120 box 3) | `find . -iname '*reference*' -o -iname '*baseline*frame*'`; `ls tools/vm-walks/`; `grep -niE 'reference\|baseline\|compare' tools/vm-qa tools/vm-visual-qa` | No stored reference set. `tools/vm-qa:27` states it itself: *"frames are kept for a person to read; comparing them to references is fork #120's third box"*. |
| A nightly runner (#120 box 5) | `grep -rniE 'nightly\|cron\|OnCalendar' tools/vm-qa .github/workflows/`; `grep -rn 'vm-qa' .` excluding docs | No unit, crontab or workflow invokes `tools/vm-qa`. `tools/vm-qa:31` was written for one: *"non-zero if any suite failed -- so a nightly can tell."* |
| A caller for `tests/cloud-oauth-lifetime.py` | `grep -rn 'cloud-oauth-lifetime'` in both repos; `ls .github/workflows` in the ES repo | None, and the ES repo has no workflows directory. F-01. |
| Unit tests for `GuiCloudTransfer`'s protocol parser | `grep -oE 'TEST_CASE\("[^"]+"\)' es-app/tests/unit/CloudTextTests.cpp` (29 cases listed) | `>>> unit` and `>>> removed` are handled only by the untested parser. |
| A rocknix.org docs change for this range's user-facing behaviour | `gh issue view 42`; `documentation-accuracy.md` § "Don't let known drift grow" | #42 still OPEN — carried from audit #60's PL-06. The range added CHECK CONNECTION, FINALIZE RESTORE, MATCH THIS DEVICE TO THE CLOUD, the provider forms, a new outcome vocabulary and `RCLONE_NET_OPTS`; none is on the site. |
| `- /n64/save/*.fla` beside its three siblings | `grep -nE '\.eep\|\.mpk\|\.sra\|\.fla' cloud_sync-rules.txt*` | `/n64/save/` lists `.eep`, `.mpk`, `.sra` and not `.fla`. Harmless — `+ /**/*.fla` above it already admits the file — so **BY-DESIGN/SAFE**, recorded only because the asymmetry looks like an omission and will be re-noticed. |

## 3.6.5 Audit-prescription verification (site / sibling / adjacent)

| Defect class | Site | Siblings | Adjacent | Verdict |
| --- | --- | --- | --- | --- |
| **A string naming a control that does not exist** (F-04) | `GuiMenu.cpp:356` | `GuiMenu.cpp:362`, `GuiCloudTransfer.cpp:652` | `backuptool:673` (other repo, same sentence) | PARTIAL — all four enumerated, none fixed (an audit records) |
| **A constant left behind by a config change** (F-03) | `cloud_backup:42` | `cloud_restore:42` | `cloud_content_backup:121`, `cloud_content_restore:125` | PARTIAL — all four enumerated; the conf, the defaults and the helper were changed and these were not |
| **A protocol shape one reader handles and the other drops** (F-02) | `GuiCloudTransfer.cpp:835-958` (no `offer`) | — the same parser also lacks `pid`, which is harmless (it does not run under `setsid`) | `CloudText::classifyProtocolLine` lacks `unit`/`removed`, harmless for its consumer | PARTIAL — enumerated; the asymmetry is by design for three of the four, and a defect for `offer` |
| **Two rows, one page, two labels** (F-05) | `GuiMenu.cpp:5043` vs `:9025` | searched every `openRestoreRelink` call site (2) and every `addWithDescription` naming a cloud action | none further | PASS — enumerated, one instance |
| **A duplicate register ID** (F-11) | `docs/decision-register.md:94` / `:171` | whole-file parse of 199 rows | `D-CLOUD-006/007` absent from both tables | PASS — enumerated mechanically |

## 3.7 Retrospective Summary

### Architectural assessment

Sound, and unusually well reasoned in the places that matter. The lock design (D-CLOUD-093),
the config-merge ordering (#39), the stamp atomicity, the sentinel choice (75/69 out of
rclone's space) and the `--recent` window each carry their argument in the code beside them,
and `tools/last-good-scripts-test`, `tools/wait-lock-test` and `tools/cloud-capture-stamp-test`
each ship with a working positive control — which is the single strongest quality signal in
this range, and rarer than it should be.

The weakness is at the **seams**, which is what a milestone-tier audit expects and what it
found: two protocol parsers with different vocabularies (F-02), a change applied to three of
seven sites (F-03), a guard nobody runs (F-01), and a decision ID used twice (F-11).

### Conformance: HIGH, with the exceptions above

`rclone-cloud-sync.md`'s hard rules are honoured — the allowlist is applied unconditionally
now (#71), `--delete-excluded` is still stripped on restore, `SETTINGS_REMOTE` nesting is
warned about, the settings phase passes no `--filter-from`, `cloud_capture` writes nothing
under `SAVESPATH` and never takes the lock, and the config/defaults pair is exactly in step
(mechanically checked: 14 keys each, zero asymmetry either way).

### Spec drift

Two deliberate widenings, neither documented as such: the watchdog and hang policy shipped
fleet-wide where #104 says "H700 (then the other families)"; and D-UI-036's "three terminal
steps" exemption covers a fourth string.

### Missing artifacts

The table in 3.6. The two that matter are the dead lifetime test (F-01) and the docs debt
(#42, now carried across two audits).

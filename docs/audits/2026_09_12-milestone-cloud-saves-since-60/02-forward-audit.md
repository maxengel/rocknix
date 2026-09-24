# Forward Audit — Cloud saves since audit #60 (fork issue #129)

**Auditor:** Code Auditor skill v1.10.0
**Date:** 2026-09-12
**Subject:** Milestone tier. ROCKNIX `e98fdd84f7..e1ddfd7ec2`; ES `00a258f9d7..f93acc2a6`
**Spec:** the issue bodies on `maxengel/rocknix` named by #129's scope statement, plus #11,
#133, #135, #138, #140

Every criterion is re-derived from primary sources. **Prior verdicts are sequestered** and
opened only in § "Prior-verdict cross-check" at the foot of this file (Phase 2.5).

**Constraint on this run, stated once and applying to every UNTESTABLE below:** no guest, no
QA cloud endpoint, no handheld (another process holds them). Executed evidence is therefore
either host-side (mine, this session) or an already-executed run whose log I read. A log I
did not run is corroboration, never a verdict.

---

## AC-116-1: `cloud_setup --info` no longer prints a usable credential, or the decision is a register row

**Source:** #116 · **Verdict:** PASS ✓

**Evidence:** `projects/ROCKNIX/packages/network/rclone/sources/cloud_setup:193` —
`echo "PASSWORD_SET=$([ -n "$(get_setting root.password)" ] && echo 1 || echo 0)"`. No
`PASSWORD=` line remains in the `--info` output (`grep -n 'PASSWORD' cloud_setup` returns that
one line). D-INFRA-008 records why the page may still display the value: it is read
in-process by ES, not printed by the script.

**Refutation attempted:** searched `cloud_setup` for any other emission of the value
(`get_setting root.password` appears only inside the `-n` test); searched the ES tree for
`info["PASSWORD"]` — 0 hits; the only reader is `GuiMenu.cpp:5894`
`info["PASSWORD_SET"] == "1"`. Nothing carries the secret over the process boundary.

## AC-116-2: the setup page's step-1 checkmark still works

**Source:** #116 · **Verdict:** UNTESTABLE ?

The checkmark is a rendering, verifiable only from a frame. `GuiMenu.cpp:5894` derives
`pwOk` from `PASSWORD_SET`, which is the right input, but "the tick draws" is a runtime
claim. The issue cites
`x64-all-20260911-88b82d94a7/shots/640x480/ssh-setup-step-1-checkmark-from-password-set.png`.
**I may not drive a guest on this run**, so this is code-read + a cited frame I did not
produce. Not FAIL — nothing contradicts it.

## AC-116-3: nothing else in the tree reads `PASSWORD=`

**Source:** #116 · **Verdict:** PASS ✓

**Evidence:** `grep -rn 'info\["PASSWORD"\]' es-app/` → 0. `grep -rn 'PASSWORD_SET' es-app/`
→ one site (`GuiMenu.cpp:5894`).

**Refutation attempted:** also grepped the fork's `projects/` for `--info` consumers parsing
`PASSWORD`; none. The search would have found a second parser had one existed.

## AC-52-1: `rclone.conf` is held back from the archive even when `LOCATIONS` would include it

**Source:** #52 · **Verdict:** PASS ✓ (mechanical)

**Evidence, executed this session:** `tools/last-good-scripts-test` case f —
`PASS a backup with rclone.conf in LOCATIONS completes (rc 0)` /
`PASS rclone.conf is not in the archive` / `PASS and no token travelled in any member` /
`PASS the log says rclone.conf was held back`. Exit 0, 56 PASS / 0 FAIL overall.

**Refutation attempted (the floor's rule 4 — what would FAIL?):** the same harness run with
`--old` (base `1d1503180d`) exits 1 with 34 FAILs. The suite has a demonstrated positive
control, so a pass here is not vacuous.

## AC-52-2: a restored device has no cloud tokens and is sent to cloud setup

**Source:** #52 · **Verdict:** PARTIAL ⚠

**Evidence:** the archive half is proved above. The "sent to cloud setup" half is
`GuiMenu.cpp:7347` — `NO CLOUD STORAGE IS SET UP ON THIS DEVICE YET.\n\nBACKUPS NEVER CARRY
YOUR CLOUD SIGN-IN. CONNECT IT AGAIN UNDER GAME SETTINGS > CLOUD SETTINGS > MANAGE CLOUD
STORAGE.` — which exists and is reached from CHECK CONNECTION.

**Gap:** that sentence names a three-level path whose middle level is an `addGroup` heading,
not an enterable page (finding F-06). The player is sent somewhere real by a description of
somewhere that does not exist as a step. Criterion met in substance, imprecise in wording.

## AC-52-3: an archive created before this change is still restorable

**Source:** #52 · **Verdict:** UNTESTABLE ?

The restore path is untouched by the change (`git diff e98fdd84f7..e1ddfd7ec2 --
backuptool` shows the held-back list on the backup side), but "an old archive restores" is a
runtime claim needing a device and an old archive. `last-good-scripts-test` case b exercises
*a* restore, not a pre-change archive.

## AC-52-4: the credential scanner still reports anything not held back

**Source:** #52 · **Verdict:** PASS ✓ (mechanical)

**Evidence:** `last-good-scripts-test` case f —
`PASS the scanner reports the pass= line in a file it does not hold back`.

**Refutation attempted:** this is the one assertion in case f that could pass vacuously if
the scanner reported *nothing*; it asserts a positive report on a planted secret, so an
inert scanner fails it. Confirmed by reading the case: it plants `pass = QA-SECRET-PASS` in
an *archived* file and requires the warning.

## AC-71-1..3: a filter-free `RCLONEOPTS` still keeps the saves allowlist, on both scripts, and the default is unchanged

**Source:** #71 · **Verdict:** PASS ✓

**Evidence:** `cloud_backup:981-988` and `cloud_restore:1032-1037` —

```sh
local has_filter=0 opt
for opt in "${all_opts[@]}"; do
    case "${opt}" in --filter-from|--filter-from=*|--filters-file|--filters-file=*) has_filter=1 ;; esac
done
if [ "${has_filter}" = 0 ]; then
    all_opts+=("--filter-from" "/storage/.config/cloud_sync-rules.txt")
```

Both scripts carry it, identically — `rclone-cloud-sync.md`'s "keep these two structurally
in sync" honoured.

**Refutation attempted:** looked for a path that bypasses `all_opts` (the settings phase
deliberately passes no `--filter-from` at all, which is correct per the rule: the archive
lives at the root of `SETTINGS_REMOTE` and is matched with `--include=*.zip`). Looked for a
second `RCLONE_OPTS_ARRAY` assembly after the guard; there is none.

## AC-71-4: a user who supplies their own `--filter-from` **or `--filter`** keeps control

**Source:** #71 · **Verdict:** PARTIAL ⚠ — **finding F-09**

**Gap:** the `case` recognises `--filter-from`, `--filter-from=*`, `--filters-file`,
`--filters-file=*`. It does **not** recognise a bare `--filter`
(`grep -n '\-\-filter)' cloud_backup cloud_restore` → no match). A player who writes
`RCLONEOPTS="--filter '+ /**/*.dat'"` gets the built-in allowlist appended beside their rule
and the WARN line logged — the opposite of what the criterion says.

The tick's own note narrows the claim to "(`--filter-from`, `--filter-from=`,
`--filters-file` are all recognised)" without editing the criterion text. That is
`issue-tracking.md`'s named failure — *"When a comment supersedes an acceptance criterion,
edit the body in the same action"* — and blindspot 27.

Whether `--filter` *should* be honoured is a real design question (the allowlist is
deliberately "not optional"), which is why this is PARTIAL and a body edit rather than a
code bug.

## AC-71-5: `tools/cloud-round-trip` gains a case that must fail against the old code

**Source:** #71 · **Verdict:** PARTIAL ⚠

**Evidence:** the step exists — `tools/cloud-round-trip:930-963`, "an edited RCLONEOPTS
without --filter-from still keeps the allowlist", asserting
`"keep-off-the-cloud.probe" not in listing and "game1.srm" in listing` (a paired
negative+positive, so it cannot pass on an empty upload) and
`warned.isdigit() and int(warned) > 0` for the log line.

**Gap:** "It must fail against the current code" is a *positive-control* requirement and the
harness needs a guest. I may not run it. Read, not run.

## AC-39: a user rule survives a sync, appears above the catch-all, and demonstrably affects what transfers

**Source:** #39 (stated as a prose `Acceptance:` line — **the issue carries no `- [ ]`
checklist at all**, against `issue-tracking.md` § "Every actionable issue carries an
'Acceptance criteria' checklist") · **Verdict:** PASS ✓ (mechanical)

**Evidence:** `cloud_sync_helper:78-97` puts the user's own lines *before* the defaults, with
the reasoning in the comment (first-match-wins, and leading position is also what lets a
user `+ include` beat a default exclusion). Executed this session:
`tools/last-good-scripts-test` d — `PASS the merged file carries the user's rule first and
the catch-all`, `PASS the helper keeps a .bak of a whole rules file before merging`,
`PASS a truncated rules file does not replace the good .bak`.

**Refutation attempted:** checked the assembly is a rename within the same directory
(`"${rules}.new"`, `cloud_sync_helper:90`) rather than the old cross-filesystem `/tmp` move
that made it a truncate-then-write; it is.

**Note:** `cloud_sync_helper:69` writes the intermediate to the fixed path
`/tmp/cloud_sync-rules.user` with no `$$`. Two concurrent helpers would clobber it. Low; the
helper runs from `post-update`.

## AC-74-1..4: CHANGE CLOUD FOLDER writes sibling `SETTINGS_REMOTE`/`CONTENT_REMOTE`

**Source:** #74 · **Verdict:** UNTESTABLE ? (device/guest), code-read consistent

**Evidence:** `cloud_setup --set-saves-remote` derives the siblings; the harness step
"changing the cloud folder moves the settings folder beside it" asserts
`{"SAVES_REMOTE": rpath("QA-Custom/Saves"), "SETTINGS_REMOTE": rpath("QA-Custom/Backups"),
"CONTENT_REMOTE": rpath("QA-Custom/Content")}` at `tools/cloud-round-trip:1088`, and the
nesting-warning assertion at `:1098`, and the `cloud_migrate_layout --check` "nothing to
move" assertion at `:1105` (`rc == 3 and "nothing to move" in out`).

All three are real assertions with failing inputs available. **None was run by me** — the
harness drives a guest. Verdict is UNTESTABLE rather than PASS on the evidence floor's rule
3, not because anything looks wrong.

## AC-100-1: a restore with the parent present and `Saves` absent ends COMPLETED, exit 0, with a line saying nothing was in the cloud

**Source:** #100 · **Verdict:** PASS ✓ (code), with **finding F-02** attached

**Evidence:** `cloud_restore:974-991` — `rclone lsd` on the parent; on success it prints
`There's nothing in your cloud to restore yet.` and `>>> offer create-saves-folder|<path>`
and `return 0`.

**Refutation attempted, and it found something:** the criterion is silent on *which surface*
shows the offer. `CloudText::classifyProtocolLine` handles `>>> offer`
(`CloudText.cpp:304-311`) and `ThreadedCloudSync` acts on it (`:206-214`, `:481-491`); the
**transfer page has no `offer` branch at all**, and the RESTORE FROM THE CLOUD page runs
`cloud_restore --yes --saves-only` (`GuiMenu.cpp:4618`) on a `GuiCloudTransfer`. See F-02.

## AC-100-2: a restore whose configured root does not exist still fails

**Source:** #100 · **Verdict:** PARTIAL ⚠ — holds on path-based backends, **fails on the
bucket tier** (tracked as #141, not a new punch item)

**Evidence:** `cloud_restore:938` uses `rclone lsd "${REMOTENAME}${SAVES_REMOTE}"` as the
existence test. On a bucket remote an absent prefix lists empty and exits **0**, so the whole
empty/near-name/offer block at `:974-996` is never entered and the restore proceeds to copy
nothing and report COMPLETED. That is #141's third row, filed 2026-09-12 and open.

**Doctrine note (new, and not on #141):** `rclone-cloud-sync.md`'s own remedy for blindspot 22
is *"Use a **listing**: does the path contain anything, or does its parent list it?"* — and
`lsd` **is** a listing. On the bucket tier a listing cannot separate *absent* from *empty*
either, so the rule as written prescribes a fix that does not work for this case. See the
proposed rule change in `04-analysis.md`.

## AC-100-3 / AC-127-1: the decisions are register rows

**Source:** #100, #127 · **Verdict:** PASS ✓

**Evidence:** D-CLOUD-085 (`docs/decision-register.md`), D-CLOUD-091, D-CLOUD-092, all in the
`Decided` table. D-CLOUD-092's row itself records "the maintainer's confirmation is the open
half", which is honest rather than a gap.

## AC-100-4: the harness asserts both shapes

**Source:** #100 · **Verdict:** PASS ✓ (code-read; the run needs a guest)

**Evidence:** `tools/cloud-round-trip:1129` asserts
`rc == 0 and "nothing in your cloud" in out.lower() and ">>> offer create-saves-folder" in out`;
`:1134` asserts `rc != 0 and ">>> offer" not in out` for the missing root. The second is the
one that could pass vacuously — it does not, because it also requires a non-zero rc.

## AC-127-2: the offer names siblings when the missing folder's name is close to one

**Source:** #127 · **Verdict:** PASS ✓ (code)

**Evidence:** `cloud_restore:975-982` — `near_names "${missing_name}"` over the parent's
directory list; when non-empty the line is
`>>> offer create-saves-folder|${saves_path}|${saves_parent}/${near}`, and
`ThreadedCloudSync.cpp:490-491` reads `mOfferArgs[0]` (the missing folder) and `[1]`
(the near name). Harness assertions at `tools/cloud-round-trip:1153` (a near name is carried)
and `:1161` (`QA-Near/Photos` — a name that is *not* near — carries no second field), which
is the pair that makes the check falsifiable.

## AC-127-3: a root-level saves folder on an empty cloud gets the offer

**Source:** #127 · **Verdict:** PASS ✓ (code)

**Evidence:** `cloud_restore:971-973` — `saves_parent="${saves_path%/*}"`, then
`[ "${saves_parent}" = "${saves_path}" ] && saves_parent=""`, so `/Saves` yields an empty
parent and `rclone lsd "${REMOTENAME}"` tests the root. Harness assertion at
`tools/cloud-round-trip:1142`.

**Process finding (F-10, Low):** **#127 is OPEN with all three criteria ticked.**
`issue-tracking.md` § "Closing discipline": *"Never leave a delivered issue open or close one
silently."* Either the issue has scope its checklist does not express, or it should be closed.

## AC-117-1..4: the exit-hotkey debounce

**Source:** #117 · **Verdict:** UNTESTABLE ? (all four)

`tools/emulator-exit-test` is the cell and it drives a guest; I may not run it. The debounce
itself is readable, and the issue's evidence cites parts B and C of that cell on
`073929659d`'s guest, including the *negative* arm (the debounce stripped from a bind-mounted
copy leaves no `.srm`) — which is the positive control the evidence floor asks for. AC-117-4
is a claim about an H700 handheld, which nothing on this host can answer.

## AC-118-1..3: the "remote" vocabulary sweep

**Source:** #118 · **Verdict:** PASS ✓ with a caveat

**Evidence, executed this session:** `grep -rn 'REMOTE' es-app/src/guis/GuiMenu.cpp | grep '_('`
returns exactly **three** lines — 6044, 6049, 6060 — which is what AC-2's note claims.

**Refutation attempted:** the grep in the AC is single-file and single-string; I widened it
to `_\("[^"]*REMOTE[^"]*"` over `es-app/src` **and** `es-core/src` and to every line
containing both `_(` and `REMOTE`, in case a concatenated or multi-line string hid one. Still
three.

**Caveat:** line 6060, `NOTE: CLOUD SYNC USES THE FIRST REMOTE IN ALPHABETICAL ORDER.`, is
not one of "the three `rclone config` terminal steps" D-UI-036 exempts — it is *our* statement
about *our* behaviour, using rclone's word. It sits on the same page as step 2's gloss, so it
is defensible; the AC's wording ("exactly the three terminal steps") is not exact.

## AC-118-2 (second reading): every string that quotes a menu label quotes it as it now reads

**Source:** #118 · **Verdict:** FAIL ✗ — **findings F-04, F-05**

**Evidence:** three strings name controls that do not exist —
`GuiMenu.cpp:356` ("TURN ON SETTINGS BACKUP UNDER CLOUD SETTINGS"; no such control),
`GuiMenu.cpp:362` + `backuptool:673` ("BACK UP SETTINGS TO THE CLOUD FROM GAME SETTINGS"; the
row is BACK UP TO THE CLOUD), `GuiCloudTransfer.cpp:652` ("UPDATE GAME LISTS"; the row is
`_("UPDATE GAMELISTS")`). Two of the three were *introduced inside this audit's range*, by
#73 (`d161afb2b`) and #108 (`4bab23fcb`). Method and the full table are in
`03-retrospective.md` § F-04.

This is a FAIL of the criterion as stated, not of #118's intent: #118 swept for the word
*remote*, and these are labels that drifted for other reasons. It is recorded here because
the criterion says "every string that quotes a menu label", and this is the check that
would have caught them.

## AC-119-1: `/usr/bin/run false` exits non-zero

**Source:** #119 · **Verdict:** PASS ✓ (mechanical, mine, with a positive control)

**Evidence, executed this session.** A copy of the shipped
`projects/ROCKNIX/packages/rocknix/sources/scripts/run` with `/etc/profile` pointed at a stub
(`UI_SERVICE=emustation.service`), `systemctl`/`clear` stubbed, and `/dev/console` substituted
for a writable file — the same lift-and-run technique `tools/last-good-scripts-test` uses:

| invocation | shipped `run` | `run` at `e98fdd84f7` (control) |
| --- | ---: | ---: |
| `run false` | **1** | 0 |
| `run true` | **0** | 0 |
| `run definitely-not-a-command` | **127** | 0 |
| `run "<path with a space>"` (exits 7) | **7** | — |

The control returns 0 for every failure, so the check has a demonstrated failing input.

**Incidental observation (Low, not a finding against the criterion):** the status is taken
from `$* >/dev/console`, so on a system where `/dev/console` is **not writable** the
redirection fails, the command never runs, and `run` exits 1. Root on a device can write it;
worth knowing when this is tested anywhere else.

## AC-119-2: the remaining ES callers react to a non-zero status

**Source:** #119 · **Verdict:** PASS ✓ (code)

**Evidence:** `grep -rn '/usr/bin/run' es-app/src` — the ten maintenance rows no longer use
it; each runs headless and ends in a dialog (D-UI-037, `0d3f0fb1e`). `run`'s own header
(`scripts/run:12-17`) records that `runSystemCommand` still discards the status while
`executeScriptLegacy` reads it, which is the honest statement of the residual.

## AC-119-3: frame of the message at 640x480

**Source:** #119 · **Verdict:** UNTESTABLE ? — a frame I may not produce; cited as
`x64-all-20260910-7a90be59fb/shots/640x480/reset-mednafen-outcome.png`.

## AC-121-1: a boot of the GENERIC_X64 guest has no `powerstate` line in `journalctl -b`

**Source:** #121 · **Verdict:** PASS ✓ (cause removed in code), UNTESTABLE ? for the boot

**Evidence:** `projects/ROCKNIX/packages/sysutils/powerstate/sources/powerstate.sh` now
guards the whole block with `if [[ "${BATLEFT}" =~ ^[0-9]+$ ]]`, and takes one reading
(`battery_percent | head -n1`). With no battery the `(( ))` that produced the error every two
seconds is never reached.

**Refutation attempted:** checked that no `(( ))` or `-le` on `BATLEFT` survives outside the
guard — `BATCNT=$(( ${BATCNT} + 1 ))` is the only arithmetic left and `BATCNT` is always
numeric.

## AC-121-2: a handheld's `powerstate` behaviour is unchanged

**Source:** #121 · **Verdict:** UNTESTABLE ? — needs a handheld with a battery. The diff is a
pure guard plus `head -n1`; on a device with one numeric battery the arms are identical.

## AC-122-1: no `laptop_mode` warning in `journalctl -b`

**Source:** #122 · **Verdict:** PASS ✓ (both halves in code), UNTESTABLE ? for the boot line

**Evidence:** the package line is gone (`git diff` over
`projects/ROCKNIX/packages/rocknix/config/…`), **and** the upgrade path is handled —
`post-update:96-102` removes exactly `^vm\.laptop_mode=` from
`/storage/.config/sysctl.d/*.conf`, leaving the rest of the owner's file. This is the
`upgrade-and-install.md` pair done properly: the clean install stops shipping it, the
upgraded device has it removed.

**Refutation attempted:** checked the sed is anchored (`^vm\.laptop_mode=`) so a commented or
differently-named line survives; it is.

## AC-123-1..2: provider forms show player words

**Source:** #123 · **Verdict:** PASS ✓ (logic), UNTESTABLE ? (the frames)

**Evidence:** `CloudText::fieldLabel` (`es-app/src/CloudText.cpp:56`) with a mapping table,
called at every row-building site (`GuiMenu.cpp:6410, 6429, 6466, 6471`); the fall-through
spaces and upper-cases an unmapped rclone name. Covered by the unit suite — `fieldLabel says
the player's words for rclone's option names` — which I ran: **29 cases, 280 assertions,
0 failed**.

## AC-124-1..2: the transfer lock never outlives a finished run

**Source:** #124 · **Verdict:** PASS ✓ (code + register), UNTESTABLE ? (the 100-run loop)

**Evidence:** `cloud_backup:1642-1643` `take_cloud_lock` then `main 9>&-`; the same shape in
`cloud_restore:1489-1490`, `cloud_content_backup:512-515`, and **twice** in
`cloud_content_restore` (`:579` + `} 9>&-` at `:731` for `match_run`, `:1016` + `:1085` for the
main path). D-CLOUD-093 records the trade taken.

**Refutation attempted:** checked `take_cloud_lock` is called *outside* the `9>&-` group in
every one of the five sites — if it were inside, the lock would be closed immediately and
mutual exclusion would be gone. It is outside in all five. Checked `match_run`'s preview path
takes no lock (`[ "${apply}" = "1" ] && take_cloud_lock`) and that closing an unopened fd is a
no-op, which the comment states and bash honours.

## AC-125-1: every walk uses `settle`/`wait-for-change` instead of fixed waits

**Source:** #125 · **Verdict:** PASS ✓ (mechanical, mine)

**Evidence:** `grep -n 'sleep' tools/vm-walks/*.steps` → **no matches**.
`grep -c 'settle\|wait-for-change'` is non-zero for 14 of 15 walks; the fifteenth,
`reset.steps`, uses `wake` + `dismiss-dialogs`, which is frame-driven (it presses B until the
screen repeats one it has stood on). Both verbs exist in `tools/vm-visual-qa` (`:465`, `:470`,
`:531`, `:560`).

## AC-125-2..3: the walks suite completes under load; `vm-pair up` reports no false negative

**Source:** #125 · **Verdict:** UNTESTABLE ? — both are runtime claims about a loaded host
driving a guest pair.

## AC-126-1: the settings phase with nothing to send ends with one consistent line

**Source:** #126 · **Verdict:** PASS ✓ (code), UNTESTABLE ? (the harness run)

**Evidence:** `cloud_backup:1172-1173` sets `SETTINGS_OUTCOME="SKIPPED - NOTHING TO SEND YET"`
and `SETTINGS_NOTHING_RAN=1`; `record_last_run` (`:374-377`) then returns without writing the
stamp, so a run that sent nothing does not rewrite the last-upload stamp. The complementary
lines `SKIPPED - SETTINGS ONLY` (`:1584`) and `SKIPPED - SAVES ONLY` (`:1598`) close
D-CLOUD-090's other two shapes. The harness asserts all three at
`tools/cloud-round-trip:1066-1073`, including `stamp_after == stamp_before`.

## AC-128-1..2: the S3 subtitle is a name, the others unchanged

**Source:** #128 · **Verdict:** PASS ✓ (logic, unit-tested), UNTESTABLE ? (the frame)

**Evidence:** `CloudText::providerSubtitle` (`CloudText.cpp:46-54`) — a label is kept only if
non-empty, ≤ 40 characters and free of commas; otherwise it falls back to `providerLabel(type)`.
Unit case `providerSubtitle keeps a name and drops a paragraph` passes in the run I made.

**Refutation attempted:** this is the function whose signature change broke the ES lifetime
test (F-01) — the same commit `229f50ad4`. The unit suite covers the function; nothing covers
the *call site* any more, which is precisely what F-01 is about.

## AC-104-1: persistent journal on `/storage`, size-capped, surviving a power cycle

**Source:** #104 · **Verdict:** PASS ✓ (mechanism), PARTIAL ⚠ (the stated numbers)

**Evidence:** `packages/sysutils/busybox/system.d/var-log.mount` — the two debugging
conditions are gone and replaced by `ConditionPathExists=!/storage/.cache/volatile-log`
(diff over the range). `storage-log.service` now makes `journal/` **and** `pstore/`.
`projects/ROCKNIX/packages/sysutils/systemd/package.mk:210-211` sets `SystemMaxUse=64M` and
`SyncIntervalSec=1min` in `journald.conf`.

**Refutation attempted, and it found something worth recording:** the unit has no `[Install]`
section and is not in busybox's `enable_service` list, so I checked what pulls it in —
upstream's `systemd-journal-flush.service` carries `RequiresMountsFor=/var/log/journal`, and
`/var/log` is the closest mount unit, so it is required rather than enabled. The unit's own
comment says exactly this. Correct.

**Gap (PARTIAL):** on the **GENERIC_X64 guest — which is where AC-104-1's evidence was
taken** — three quirk drop-ins override `journald.conf`:
`…/quirks/devices/QEMU Standard PC (Q35 + ICH9, 2009)/092-journald-config` writes
`10-generic-x64.conf` (32M / 5min), `093-rocknix-service-fixes` writes
`10-generic-x64-early.conf` (32M / 10min), `098-dbus-fd-improvements` writes
`20-x64-fd-improvements.conf` (64M / **10min**). Drop-ins apply in lexical order, so `20-…`
wins: the VM runs `SyncIntervalSec=10min`, not the 1 min the criterion states. The evidence
still holds (an err-level message forces an immediate sync, which is why the info marker
75 s earlier survived — the criterion says so itself), and the handheld's interval is
*shorter*, so the VM measurement is conservative. But the criterion's numbers were not the
numbers under test. Worth knowing before the next journal measurement.

## AC-104-2: ES's log and `cloud_sync.log` on `/storage`, rotated

**Source:** #104 · **Verdict:** PASS ✓ (code)

**Evidence:** both ride `var-log.mount`. `cloud_sync_helper:305` trims `cloud_sync.log` past
1 MiB to its last 512 KiB, with the reasoning beside it.

## AC-104-3: boot-evidence snapshot, ring of five

**Source:** #104 · **Verdict:** PASS ✓ (code)

**Evidence:** `projects/ROCKNIX/packages/rocknix/system.d/rocknix-evidence.timer`
(`OnBootSec=60s`, `OnUnitActiveSec=5min`, `AccuracySec=30s`);
`rocknix-evidence.service` (`Type=oneshot`, `Nice=15`, `IOSchedulingClass=idle`,
`ConditionPathExists=!/storage/.cache/volatile-log` — the *same* opt-out marker as
`var-log.mount`, which is the right coupling: without the persistent tree the page would be
written to RAM and lost with the freeze it exists to explain);
`projects/ROCKNIX/packages/rocknix/package.mk:85` `enable_service rocknix-evidence.timer`.

**Refutation attempted:** checked the timer is actually enabled (it is, by `enable_service`,
and the unit has `[Install] WantedBy=timers.target`); checked the condition is on the
*service* not the timer, so the timer still fires and the work is skipped — correct, since a
condition on the timer would need a reload to take effect.

## AC-104-4: watchdog + panic-on-hang + RAM crash store

**Source:** #104 · **Verdict:** PARTIAL ⚠ — **unticked on the issue, and correctly so**

**Evidence that it is built:**
`projects/ROCKNIX/packages/sysutils/systemd/config/system.conf.d/20-watchdog.conf`
(`RuntimeWatchdogSec=15s`, `RebootWatchdogSec=off`, installed by `package.mk:274-275`);
`projects/ROCKNIX/packages/sysutils/busybox/sysctl.d/hang-policy.conf`
(`kernel.panic = 10`, `softlockup_panic = 1`, `hung_task_panic = 1`);
`projects/ROCKNIX/devices/H700/patches/linux/0950-arm64-dts-allwinner-h616-ramoops-reserved-memory.patch`
(`ramoops@4f000000`, `reg = <0x0 0x4f000000 0x0 0x100000>`, `record-size = <0x20000>`,
`console-size = <0x80000>`, `max-reason = <2>`); the pstore redirect
`projects/ROCKNIX/packages/sysutils/systemd/tmpfiles.d/z_01_rocknix.conf:12`
`L+ /var/lib/systemd/pstore - - - - /storage/.cache/log/pstore`, with the shipped
`d /var/lib/systemd/pstore` line sed'ed out of `systemd-pstore.conf` (`package.mk:285`) so
tmpfiles does not fight the symlink.

**Refutation attempted — does `hang-policy.conf` actually reach the image?** It is not copied
by any line in busybox's `package.mk`. `scripts/install:126-128` carries the convention
(`${PKG_TMP_DIR}/sysctl.d/*.conf` → `${INSTALL}/usr/lib/sysctl.d`), and `PKG_TMP_DIR`
(`scripts/install:73-75`) iterates `${PKG_DIR}` then the project and device package
directories, so the ROCKNIX override's file is installed. Arithmetic on the ramoops region:
`console-size` 512 KiB + 4 × `record-size` 128 KiB = 1 MiB, exactly the reserved `0x100000`.

**Gaps, both worth stating:**

1. **Scope.** The criterion reads "for H700 (**then** the other families)". `20-watchdog.conf`
   and `hang-policy.conf` are in *shared* packages, so they arm on **every** family from the
   first build — GENERIC_X64 excepted, where quirk `095-kernel-early-boot-fixes` sets
   `RuntimeWatchdogSec=0`. Both files argue the case in their comments ("a device without a
   watchdog device logs one line and carries on"), so this is a deliberate widening, not an
   accident — but it is a widening of the criterion, undocumented as such.
2. **`hung_task_panic = 1` fleet-wide with the default 120 s timeout**
   (`kernel.hung_task_timeout_secs` is not set anywhere) means any task in uninterruptible
   sleep for two continuous minutes panics the device and reboots it ten seconds later. On a
   handheld whose storage is a microSD card, a controller stall during a large write is the
   scenario — and a reboot *during a write* is the corruption class this policy exists to
   prevent. The comment reasons about soft lockups and does not reach this case. Recorded as a
   risk to size, not as a proven defect: I have no measurement of D-state duration on these
   devices, and I may not take one on this run.

## AC-104-5: config files survive a mid-shutdown power cut

**Source:** #104 · **Verdict:** PASS ✓ (mechanical, mine)

**Evidence:** `tools/last-good-scripts-test` a., c. and d., executed this session — 56 PASS /
0 FAIL, exit 0, including `an empty system.cfg gets its one line`, `set_setting writes a
temporary and renames it (no separate append)`, `a stamp writer killed before its rename
leaves the previous stamp (rc 137)`, `and its temp file beside it, not an empty stamp`.
Positive control: `--old` → 34 FAIL.

## AC-104-6: a rule on what to capture first when a handheld misbehaves

**Source:** #104 · **Verdict:** PASS ✓

**Evidence:** `.claude/rules/handheld-evidence.md` exists on `next` at the audited SHA (94
lines), with `rocknix-evidence collect` named as the first action and a "what survives what"
table.

## AC-105-1..9: graceful degradation

**Source:** #105 · **Verdict:** PASS ✓ for 1, 6, 7, 8 (mechanical); UNTESTABLE ? for 2, 3, 4,
9 (frames/guest); SKIP ○ for 5 (explicitly superseded by D-UI-030 and struck through in the
body — the supersession *is* recorded in the body, which is the right way)

**Evidence for 1:** the vocabulary lives in `es-native-ui.md` (D-UI-028) and in code as
`CloudText::outcomeCandidates` / `ThreadedCloudSync::whyForCode`; D-UI-030's retirement of
COMPLETED WITH GAPS is visible in `outcome_word()` (`cloud_backup:415-420`), which emits only
`COMPLETED` and `COULDN'T FINISH`.

**Evidence for 6 and 7 (mechanical, mine):** `tools/last-good-scripts-test` e. —
`PASS no screen line matches FORBIDDEN across the six scripts`. This is the one check in the
suite that could pass vacuously if the extraction found no lines; it does not, because the
same harness's a./b. cases assert specific sentences *are* printed, so the extractor is
demonstrably producing lines.

**Evidence for 8:** the gate is on by default —
`tools/cloud-round-trip:505-509`, `--vocabulary … default=True`, with `--no-vocabulary` as the
escape. `assert_message` (`:5535`) checks the FORBIDDEN regex on every card-visible line, the
three outcome words on the last line, and a recovery clause when `rc` is not 0/75/69.

**Observation (Low):** `assert_message`'s FORBIDDEN check is
`check(not offenders, f"…no developer words on the {len(visible)} card-visible line(s)…")`.
With `visible` empty it passes and prints `0 card-visible line(s)` — the shape the project
already fixed once for the allowlist check ("SKIP … nothing uploaded, so it proves nothing").
It is *usually* saved by the sibling outcome-word assertion, which fails on an empty last
line — but two of the seventeen call sites pass no `rc` or no vocabulary flag.

## AC-120-1: `tools/vm-qa <image>` runs everything unattended and leaves one report

**Source:** #120 · **Verdict:** PASS ✓ (exists), UNTESTABLE ? (the unattended run)

**Evidence:** `tools/vm-qa` (212 lines) with
`ONLY="scripts,round-trip,exit,time-to-play,walks"` and `report.md`. The cited run is
`qa-a2ee7b9bb2-webdav-a-20260912-0646/`.

## AC-120-2: the #117 exit cell exists and fails without the debounce

**Source:** #120 · **Verdict:** PASS ✓ (exists), UNTESTABLE ? (the negative arm)

## AC-120-3: reference frames for every walk, and a one-row change fails the comparison

**Source:** #120 · **Verdict:** FAIL ✗ — **unticked, and nothing in the tree provides it**

**Evidence (negative claim, with its search trail):**
`find . -path ./.git -prune -o -name '*reference*' -print`, `ls tools/vm-walks/`, and
`grep -rn 'reference\|baseline\|compare' tools/vm-visual-qa tools/vm-qa` were run; there are
`.steps` files and a `suite.txt`, and `tools/vm-qa` "keeps" frames under `$OUT/walks`, with no
stored reference set and no comparison step. `tools/vm-qa:26` says so in its own header:
"each step file replayed from a rebooted guest, **frames kept**". D-QA-013's row also says
"Frames are compared as th…" — the row claims a comparison the tooling does not yet perform.
Accurately unticked on the issue.

## AC-120-4: an ES unit-test binary covering the pure code, under a second

**Source:** #120 · **Verdict:** PASS ✓ (mechanical, mine)

**Evidence, executed this session** in my own ES worktree at `f93acc2a6`:
`cmake -S es-app/tests/unit -B build-tests -DCMAKE_CXX_COMPILER=/usr/bin/g++` then
`--build … --target es-unit-tests` then `./build-tests/es-unit-tests` →
**29 test cases, 280 assertions, 0 failed**, exit 0. The issue's tick cites 19 cases / 162
assertions, so the suite has grown since, which is the right direction.

**Refutation attempted:** listed the 29 case names. They cover `cleanHostname`,
`providerLabel`, `parseLastRun` (6 cases), `runOrigin`, `shortenWhy`, `outcomeCandidates`,
`classifyProtocolLine` (6), `providerSubtitle`, `fieldLabel`, `verbOf`, `chooseThatFits`,
`parseBytes`, `sizeLabel`, `roundSizes`, `liveLine` (5). **Not covered:** the `>>> unit` and
`>>> removed` shapes, because `classifyProtocolLine` does not handle them — they live in
`GuiCloudTransfer`'s own parser, which is not pure and is not tested. That is the untested
half of finding F-02's seam.

## AC-120-5: a nightly run has produced at least one report without a hand on the keyboard

**Source:** #120 · **Verdict:** FAIL ✗ — unticked; no scheduler exists.
`grep -rn 'cron\|systemd.*timer\|nightly' tools/vm-qa` → nothing; there is no unit, crontab
or workflow in either repo that invokes `tools/vm-qa`. Accurately unticked.

## AC-129-1: an audit report under `docs/` naming every finding with a severity and file:line

**Source:** #129 · **Verdict:** PASS ✓ — `docs/audits/2026_09_12-milestone-cloud-saves-since-60/`
(this folder); every finding in `03-retrospective.md` and `04-analysis.md` carries a severity
and a `file:line`.

## AC-129-2: every finding of severity high or above has an issue with acceptance criteria

**Source:** #129 · **Verdict:** see `05-punch-list.md` and the Phase 7 outcomes; filed as
part of Phase 6.

## AC-129-3: the decision register is checked against the code for every row cited in the pass

**Source:** #129 · **Verdict:** PASS ✓ — the check is § "Register check" in `04-analysis.md`,
covering the 24 rows #129 names plus the 34 added since.

## AC-133 / AC-135 / AC-11 and children: not yet built

**Source:** #133, #135, #11 (+ #19 #21 #22 #23 #24 #25 #134 #139) · **Verdict:** SKIP ○ for
the unbuilt criteria, with the boundary enumerated in `04-analysis.md` § "Not yet built".

These are design decisions and planned work, and the audit's job with them is to say where the
boundary is, not to fail them. The two exceptions, both **built and therefore audited above**:
#133's harness plumbing (`--backend`, five endpoints, `cloud-test-backend`) exists and its
first run produced #141/#142/#143; and #135's `tools/time-to-play` exists (1331 lines) while
none of its thirteen criteria is ticked.

---

## Forward Audit Summary

| Verdict | Count | Criteria |
| --- | ---: | --- |
| PASS ✓ | 27 | 116-1, 116-3, 52-1, 52-4, 71-1, 71-2, 71-3, 39, 100-1, 100-3/127-1, 100-4, 127-2, 127-3, 118-1, 118-3, 119-1, 119-2, 121-1, 122-1, 123-1, 124-1, 125-1, 126-1, 128-1, 104-2, 104-3, 104-5, 104-6, 120-4, 129-1, 129-3 |
| PARTIAL ⚠ | 6 | 52-2, 71-4 (**F-09**), 71-5, 104-1, 104-4, 100-2 |
| FAIL ✗ | 3 | 118-2 second reading (**F-04/F-05**), 120-3, 120-5 |
| SKIP ○ | 2 | 105-5 (superseded, recorded in the body), #133/#135/#11's unbuilt criteria (as a block) |
| UNTESTABLE ? | 17 | 116-2, 52-3, 74-1..4, 117-1..4, 119-3, 121-2, 123-2 (frames), 124-2, 125-2, 125-3, 126-1 (run), 128-2, 105-2/3/4/9, 120-1, 120-2 |

**Overall assessment: PASS WITH FINDINGS.**

The UNTESTABLE count is high (17) and it is **not** a statement about the work. Every one is
a criterion whose only possible evidence is a guest, a handheld or a rendered frame, and this
run was explicitly barred from all three. `references/anti-patterns.md` says more than five
UNTESTABLE suggests weak criteria and should be flagged to the user: here it instead flags
the constraint, and the right reading is that **a re-run of these seventeen against
`tools/vm-qa` is the cheapest remaining verification in this milestone.**

## Coverage Boundary

**Examined, and to what depth:**

- `projects/ROCKNIX/packages/network/rclone/sources/*` — read in full for `cloud_backup`,
  `cloud_restore`, `cloud_sync_helper`, `cloud_net_ready`, `cloud_saves_root`, and by
  targeted reading for `cloud_capture`, `cloud_content_*`, `cloud_setup`,
  `cloud_migrate_layout`. Depth: code-read; **runtime-probed: none** (no guest).
- `projects/ROCKNIX/packages/rocknix/sources/scripts/*` — `run` **executed** (host, with a
  positive control); `backuptool`, `chksysconfig`, `001-functions` exercised through
  `tools/last-good-scripts-test` (executed, with its positive control); `powerstate`,
  `post-update`, `rocknix-evidence` code-read.
- ES `es-app/src/{CloudText,ThreadedCloudSync,FileData,main}.cpp`,
  `guis/{GuiCloudTransfer,GuiMenu,GuiSettings,GuiRetroAchievementsSettings}.cpp`,
  `es-core/src/{Settings,SystemConf}.cpp`, `components/{ComponentGrid,MenuComponent}` — read
  around every cloud surface; `es-unit-tests` **built and executed**;
  `tests/cloud-oauth-lifetime.py` **executed** (and found F-01).
- `tools/` — `pkgcheck` **executed** (+ a constructed violation), `last-good-scripts-test`
  **executed** (+ `--old`), `wait-lock-test` **executed** (+ `--old`),
  `cloud-capture-stamp-test` **executed** (+ `--old`); `cloud-round-trip`, `vm-qa`,
  `vm-visual-qa`, `vm-walks`, `time-to-play`, `emulator-exit-test` code-read only.
- Doctrine: all 21 `.claude/rules/*.md`, `docs/blindspot-register.md` (38 entries),
  `docs/decision-register.md` (199 + 6) — read from `next` at the audited SHA.

**Deliberately not examined:**

- The council research corpus (`research/council-runs/**`, ~160 files) — process artifacts,
  not shipped code.
- Upstream kernel/device patches pulled in by merges, except `0950-…-ramoops-…` which is ours.
- `tools/council/**` — fork infrastructure outside #129's scope.
- The emulator/core packages, the bootloaders, and everything under `packages/` that the
  cloud-saves work does not touch.
- `cloud_content_backup`/`cloud_content_restore`'s `--scan` output format beyond the seam
  checks, and `cloud_census`.

**Dimensions not exercised at all:**

runtime behaviour on a guest or a device · rendered UI (every frame cited is one somebody else
produced) · any cloud endpoint, QA or real · performance and timing · the upgrade path
end-to-end on a populated device · concurrency between two devices · the S3/FTP/SMB/SFTP
backends (their findings are read from #141/#142/#143, not reproduced).

---

## Prior-verdict cross-check (Phase 2.5)

Opened only now, after every independent verdict above was written. The two prior artifact
sets in scope cover *different* criteria from mine, so there is little per-AC overlap; what
there is, is agreement, and the useful work here was re-verifying that their **fixes** still
hold.

### Audit #60 (`2026_09_03-milestone-cloud-sync-tiers`)

Its eleven punch items: nine resolved, two deferred. Re-derived, not remembered:

| Item | Its verdict | Mine, re-derived from the code at `e1ddfd7ec2` |
| --- | --- | --- |
| PL-01 (High) — `ls A B` gating switched off the #53 size check | Resolved `2b626195d8` | **Still holds.** `cloud_backup:1280-1289` collects into `archives=()` and gates on `[ ${#archives[@]} -gt 0 ]`, with the comment naming the old failure. This is `engineering-practices.md` § "Guards must fail closed" applied literally. **Agree.** |
| PL-05 (Medium) — credential scan word-split member names | Resolved `2b626195d8` | **Still holds.** `backuptool:242-360` works through newline-delimited temp files and `grep -vxF -f` / `grep -qxF`, so a name with a space cannot split. **Agree.** |
| PL-06 (Medium) — five user-visible changes with no rocknix.org update | Deferred to #42 | **Still open, and now worse.** `gh issue view 42` → OPEN. This range added at least six more user-visible changes (CHECK CONNECTION, FINALIZE RESTORE, MATCH THIS DEVICE TO THE CLOUD, the provider forms, the outcome vocabulary, `RCLONE_NET_OPTS`). Carried forward as **PL-07** below. |
| PL-10 (Low) — the `unsupported` branch of `--scan` had never produced output | Deferred to #35 | **Still open.** `gh issue view 35` → OPEN. Carried forward. |
| PL-02, 03, 04, 07, 08, 09, 11 | Resolved | Spot-checked PL-02 (`backuptool`'s staging pipeline now sets `pipefail` in a subshell, `:311`) and PL-04 (`gmu/playlists`, `scummvm/games`, `modules` present in the tier lists). **Agree.** |

**Disagreement: none.** #60's self-declared independence caveat ("run by the session that
implemented the work") turned out not to have cost it anything I can find; its findings were
real and its fixes are intact.

### `2026_09_10-graceful-degradation` (the #105 input pass)

Not a `code-auditor` artifact set — three read-only reports and a README, no verdicts to
cross-check. Its known error is already in the blindspot register as entry 35 (`actionLine`
asserted `true` by default when the header says `false`), closed the same day by ES
`eb4148ebc`.

**Re-derived:** `es-core/src/components/AsyncNotificationComponent.h` — the card is
constructed with its action row, and `ThreadedCloudSync.cpp:449` passes
`CloudText::outcomeCandidates(outcome)` *and* an `action` string to `updateText`. So the
remedy landed and the register entry's "Closed" is accurate. **Agree.**

**The lesson that folder teaches is the one this audit applied throughout:** every claim in
the findings above cites a `file:line` read this session, because an audit is our own report
about the code and is read with more trust than the code.

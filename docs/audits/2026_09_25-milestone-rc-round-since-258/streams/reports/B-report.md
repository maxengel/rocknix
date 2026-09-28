# Stream B report: backuptool and the rocknix scripts (audit #307 / #308)

- **Branch:** `feature/pl-b` in `/workspace/repos/rocknix.worktrees/pl-b`. Base `417dcd8610` (next when the stream started). Head `52ac9e65e7`. Nothing pushed, nothing built, no host or guest touched.
- **Files changed (all in stream B's list):** `backuptool`, `wifictl`, `chksysconfig`, `factoryreset`, `rocknix-evidence`, `rocknix-corekeep`, `runemu.sh`, `automount` (under `projects/ROCKNIX/packages/rocknix/sources/scripts/`), `projects/ROCKNIX/packages/rocknix/profile.d/001-functions`, `tools/last-good-scripts-test`. No `package.mk` was edited, so `tools/pkgcheck` does not apply.
- **The harness:** `./tools/last-good-scripts-test` → **`PASSED`, 468 PASS / 0 FAIL** (baseline on this base: 386 PASS). Stream B's block, `# ---- audit #307, stream B ----` (sections y1 to y4, at the end, before the verdict line), adds **82 checks**. Against the branch base (`BASE_REF=417dcd8610 ./tools/last-good-scripts-test --old`), **74 of the 82 FAIL**. The 8 that pass there are guards against over-reach, each named below. Logs are in `/workspace/tmp/rocknix-session/streams/B/`: `final.log`, `final-old.log`, plus the before-fix runs `bt-unfixed.log`, `wf-unfixed.log`, `fn-unfixed.log` and `ms-unfixed.log`.
- **Other checks:**
  - `tools/wait-lock-test` (unchanged): **PASSED, 21 PASS** on the new `001-functions`.
  - `tools/vocabulary-check`: **152 strings judged, 0 wrong**.
- **Commits:** 47. Every title is 72 characters or fewer and matches `^[a-zA-Z0-9_*./-]+:[[:space:]].+$`. Every body line is 72 or fewer. Each commit carries `Already written:` and the Co-Authored-By trailer.

## Harness edits outside the block (please carry them through the merge)

These edit other sections of `tools/last-good-scripts-test`, and every one is in a section that tests a stream-B file:

- **Section f and section k:** each planted a credential in the same run as its other checks and expected success with a warning. PL-005 turns that warning into a refusal, so each now plants the credential for a second run and expects the refusal:
  - section f: 2 lines, from rclone's `pass=` and `password2=`;
  - section k: 1 line, from the unknown `Token =`;
  - in both, the first archive stays the only one.
  - The checks are replaced one for one.
- **Section u's nmcli shim:**
  - It strips `ifname <dev>` from the name it records for `connection up` (PL-031).
  - It answers `-g 802-11-wireless.ssid` with the profile name (F-WF-12).
- **Section u:** "forget with NetworkManager not answering" now expects exit 2 (F-WF-07).

## git log --oneline 417dcd8610..HEAD (oldest first)

```
b3fa5a156c backuptool: a location with a space is backed up whole
02d1b16aa4 backuptool: legacy member names read whole; half copies not archived
221804941d backuptool: locations by canonical path; an empty list is the standard
63269d17ab backuptool: a location outside /storage is refused, not dropped
baed981ad4 backuptool: the settings backups folder never goes into a backup
9c0e7c0ab1 backuptool: a copy that could not be taken stops the restore
189226087b backuptool: nothing to back up is said as such, not as a retry
7a719d8f6f backuptool: a selection of only sanitised files is a backup
1506c976b3 backuptool: a sign-in in the backup ends the run before it is named
f3b280ac5b backuptool: the credential scan reads any case and the guard's shapes
17c994e644 backuptool: the pre-restore copy covers what the archive replaces
6517eb4c9d backuptool: the restore mark is written and read back, or nothing is
d57cdc65df backuptool: a restore never takes the device's cloud sign-in or name
01522088cc backuptool: a file left out as the image's own is reset on restore
dbb9e6bdd5 backuptool: one backup or restore at a time, and a name per run
6236faa178 backuptool: the pre-restore copy is never trimmed away
f1152db8ef backuptool: upstream-era ARCHIVED zips at the root move into archive/
8b2e808d7e backuptool: the player's words name the tier; a tool's go to the log
ffa527dff6 backuptool: every held-back folder keeps its own wildcard on restore
36edaa8ad2 backuptool: a tar archive's regular file never replaces an OS symlink
7ca6f89963 backuptool: a zip is whole only when every member reads back
c8593f5367 backuptool: the archive keeps files' modes and imposes no folders
43e24df453 backuptool: a backup is staged once, on the storage card, not in RAM
92bbb03d78 backuptool: a killed run's leftovers are swept by the next run
e60fccb2dc backuptool: the settings backups folder is read as cloud_backup reads it
1ec3930baf backuptool: nothing waits on a screen nobody is reading
449973e7e4 backuptool: the comments describe the tar flow, and why Bluetooth is out
fb45fc4289 wifictl: a saved network's key is stored as typed, or not at all
9b3eec49a7 wifictl: a saved-network join is judged on this device's adapter
f4cf7aed49 wifictl: a join writes the network's SSID to wifi.ssid, not its name
7231b40e58 wifictl: forget forgets the settings' copy too, and says "could not ask"
7d450616ef wifictl: the scan's names are unescaped like current's and saved's
a50b402f8e wifictl: a saved name with a tab in it can be joined and forgotten
2c50212553 wifictl: the join comment names the row by its current label
174f6126f9 001-functions: a settings write that did not land is not called done
577089c5f4 001-functions: deleting a setting matches its key literally
073a3fdaff 001-functions: the settings lock is born with its pid and reaped once
c864fcb7cd 001-functions: a credential value that starts with & or ; is redacted
56f88c297f 001-functions: redaction knows ...Pass keys; "disk-" is not a token
45f390e898 chksysconfig: a copy on a card not mounted yet is not called missing
9764cf01b2 chksysconfig: a whole system.cfg.tmp is kept when no better copy exists
14bc17919c factoryreset: a folder that will not go stops the reset before the copy
a1a65e0e50 rocknix-evidence: a file the filter could not replace is not archived
5ec237f820 rocknix-evidence: each collection stages alone and gets its own name
e1f4155051 rocknix-corekeep: read nothing disarmed; cap, cut, ring and lock by fact
d56288b5d9 runemu.sh: the platform and the save-state flags are read by argument
52ac9e65e7 automount: the disk under /storage is the internal one, sd included
```

## Punch items (#307)

Every item was resolved. "FAIL before" is the harness line seen against the script before its fix: the pristine base, or `BASE_REF=HEAD --old` against the previous commit. "PASS after" is the same check on HEAD (`final.log`).

| Item | Commit | Case (check text starts with) | FAIL before | Already written |
|---|---|---|---|---|
| **PL-003** saved-network key escaped | `fb45fc4289` (with #308 claude F-WF-02) | y2 `#307 PL-003: a passphrase with ':' and '\' ...` | `rc 0; wifi.key is 'ab\:cd\\ef12345'` | An escaped `wifi.key` from an earlier join stays until that network is joined again or the key is typed again. It cannot be told apart from a real key. |
| **PL-004** space in a location drops it | `b3fa5a156c` | y1 `#307 PL-004:` ×4 (space path, theme folder, unreadable folder, member count) | `rc 0; the archive lists: storage/\|...\|test/f1\|` (my games/ missing); `rc 0; archives: 1; why: ''` | A short archive already written stays as it is; the next backup is whole. |
| **PL-005** scan warns and publishes | `1506c976b3` | y1 `#307 PL-005: a pass = line ... ends the backup` | `rc 0; why ''; ... secret in an archive: 1` | Archives already written stay where they are. The next backup of the same selection is refused. |
| **PL-006** scan class has no capital | `f3b280ac5b` | y1 `#307 PL-006:` ×6 (5 positive shapes, 1 negative) | `rc 0; why ''; archives: 1 -- the capital P passed`. The negative FAILed against PL-005: a catalogue's `Token =` line was refused. | Applies to the next backup. |
| **PL-007** snapshot misses archive members | `17c994e644` (also changes `chksysconfig`) | y1 `#307 PL-007:` ×4 (backuptool revert, mark lines, boot revert with copy, boot revert without) | `x.cfg='FROM ARCHIVE' ... new.cfg: left`; `the mark at extraction: '<one line>'`; `new cfg.cfg: left; said: 'reverted'`; `said: 'failed'` | Older PRE_RESTORE copies and one-line marks are read as before. |
| **PL-008** backup folder nested into a backup | `baed981ad4` | y1 `#307 PL-008:` ×2 | `members under the backup folder: storage/roms/backup/2026_01_01-...tar.gz ... PRE_RESTORE...` | Archives already written with nested archives stay where they are. The next backup does not carry them. |
| **PL-009** failed snapshot read as empty device | `9c0e7c0ab1` | y1 `#307 PL-009: a copy that cannot be taken ...` | `rc 0; f1='ARCHIVE'; why: ''` | Nothing on a device changes. |
| **PL-010** legacy restore takes cloud identity | `d57cdc65df` | y1 `#307 PL-010:` ×3 (tar, zip, backup hold-back) | `rclone.conf='ARCHIVE CLOUD' id='other-device'`; `'ZIP CLOUD' 'zip-device'`; `archive: storage/.config/cloud_sync-device-id` | This is the already-written case: archives in the field keep those files, and a restore no longer applies them. |
| **PL-011** failed settings write returns 0 | `174f6126f9` | y3 `#307 PL-011: set_setting whose write cannot land ...` | `rc 0; system.cfg: 'system.hostname=X\|a=1\|'` | Nothing changes. Callers that test the status (`headphone_sense`, `020-rumble`) now see a real failure. |
| **PL-031** join judged on the wrong adapter | `9b3eec49a7` | y2 `#307 PL-031: joining B while B is up on another adapter ...` | `printed 'joined\|'; up: ''; wlan0 is on 'A'` | Nothing is written differently. |
| **PL-035** `/.` spelling, empty list | `221804941d` | y1 `#307 PL-035:` ×2 | `SECRET in: storage/.config/system/configs/system.cfg`; `rc 1 ... GATHERING` | An archive that carried a key through a `/.` spelling stays where it was written. |
| **PL-036** legacy whitespace, unchecked sanitisers | `02d1b16aa4` | y1 `#307 PL-036:` ×2 | `rc 1 ... unzip: 'storage/.config/test/my link.cfg' exists but is not a regular f...`; `rc 0; ... system.cfg in it: system.hostname=X\|` | Nothing is written differently. |
| **PL-037** seed-pruned file not reset | `01522088cc` | y1 `#307 PL-037:` ×2 | `es_settings.cfg after the restore: 'EDITED'`. The second check is a guard and passed at the base. | Old archives carry no seed list, so restoring one behaves as before. An old image extracts the list as an inert file. |
| **PL-038** location outside /storage dropped | `63269d17ab` | y1 `#307 PL-038: /flash/x in LOCATIONS ends the backup with the refusal` | `rc 0; archives: 1; why: ''` | Nothing a device holds changes. |
| **PL-039** restore mark unchecked | `6517eb4c9d` | y1 `#307 PL-039: an unwritable restore mark ...` | `rc 0; f1='ARCHIVE'; why: ''` | Nothing a device holds changes. |
| **PL-040** redaction misses a leading `&`/`;` | `c864fcb7cd` | y3 `#307 PL-040:` ×2. The second is a guard that passed at the base. | `'root.password=&example-value' / 'x.password=&y=QAKEY9' / 'token=;semi'` (all passed through) | Logs and bundles already written keep what they carry. |
| **PL-041** (the shell half) stale-lock theft | `073a3fdaff` (with claude F-PB-06 and F-PB-08) | y3 `#307 PL-041 / #308 claude F-PB-08: two waiters reaping one stale lock ...`, plus `tools/wait-lock-test` unchanged (21 PASS) | `spans: start ...\|start ...\|end ...\|end ...; overlapping: 1` | Nothing changes: the lock is on the /tmp tmpfs. |
| **PL-044** factoryreset `rm` unchecked | `14bc17919c` | y4 `#307 PL-044: a retroarch folder that cannot be removed ...` | `rc 0; nested copy: yes` | A nested copy an earlier reset made stays until the next reset of that folder. |
| **PL-045** marker consumed while unmounted | `45f390e898` (with claude F-PB-11) | y4 `#307 PL-045 / #308 claude F-PB-11: ...` | `mark: removed; said: 'failed'` | A mark already consumed is gone; the fix protects the next cut restore. |
| **PL-046** filtered file counted when `mv` fails | `a1a65e0e50` | y4 `#307 PL-046:` ×2 | `plant in it: 1; summary: ... 0 left out`; `rc 0; archives: 1` | Bundles already archived or sent cannot be reached. |
| **PL-077** same-second names | `dbb9e6bdd5` (backuptool half, with claude F-BR-15) and `5ec237f820` (evidence half) | y1 `#307 PL-077 / #308 F-BR-15:` ×2; y4 `#307 PL-077 (evidence half): ...` | `rc 0; archives 1; why ''`; `archives: 1 -- the second took the first one's name`; `archives: 2026_09_21-140000-device-evidence.tar.gz` (one) | `.partial` files from an earlier kill are swept by the first run. |

Notes on the items:

- **PL-005:** a hit returns 5 from `write_archive`. The run prints `>>> why A SIGN-IN WAS FOUND IN THE BACKUP`, then `A SIGN-IN WAS FOUND IN THE BACKUP, SO IT WASN'T KEPT. YOUR LAST BACKUP IS UNCHANGED.` It then exits 1, so the settings tier's `&&` chain stops.
  - The scan reads the staged tree, which is exactly the archive's content, before the archive exists.
  - The brief's "partial removed" holds: no `.partial` is ever written for a refused run.
- **PL-006:** the shipped config seeds give four scan matches. Three are removed before the scan (`root.password` by the `system.cfg` strip, melonDS's `RA_Password=null` and `RA_Token=null` by the token blanking). The fourth, `gmu.conf`'s `gmuhttp.Password=change.me`, is a real password line. It is reached only when a custom list covers an edited `gmu.conf`, and such a backup is now refused.
- **PL-041:** the shell side takes `flock -x` on `"${J_CONF_LOCK}.reap"`, the same path E1's PidLock uses (409f44917), around the re-read and the `rm`, as E1 asked. The lock is born with its pid by `ln` from `<lock>.<pid>`.
  - A shell without `ln` or `flock` falls back to the old create and an unguarded reap. `tools/wait-lock-test` narrows PATH to exactly that shell (rm, sleep, cat), which is why the fallback exists.
  - The acceptance's "tools/wait-lock-test two contenders" case is in stream B's block instead: `tools/wait-lock-test` is not in my files, and it passes unchanged.
- **PL-064, the upgrade half (E1's ask):** commit `9764cf01b2`, check y4 `#307 PL-064 (upgrade half, E1): ...` ×2.
  - FAIL before: `system.cfg 'system.hostname=DEFAULT|'; .tmp: gone -- the whole copy was deleted and the defaults reseeded`.
  - The second check (a good `.backup` wins) is a guard and passed at the base.
  - Already written: this is the already-written case. A whole `.tmp` an older writer left behind is read once at the next boot, and only when there is no usable live file and no usable record.

### What the integrator must prove on the VM or a device

- **PL-003:** on a guest (the VM can show this), join a saved network whose key holds `:` and `\`, then `get_setting wifi.key` must equal the key typed. The shim models the target's `-g` escaping as guest d showed it.
- **PL-031:** needs two wireless adapters. The VM has one, so this needs a USB adapter on a device, or `mac80211_hwsim` in a guest.
- **PL-045:** on the VM, cut a restore (the KILL18 fixture) and reboot. The 1.7 s sysinit pass must keep the mark (`/storage/roms` is not mounted yet) and the `001-setup` pass must revert.
- **PL-007:** the same kill on the VM with a mark holding `+<path>` lines; the created files must be gone after the boot.
- **PL-005:** `tools/vm-qa` and `tools/cloud-round-trip`:
  - the settings tier's chain must stop on a refused backup;
  - a clean standard backup must not be refused. The scan was run against every shipped seed, but not against a lived-in device's configs.
- **PL-064 (upgrade):** a `tools/vm-upgrade-rehearsal` variant with a cut `system.cfg` and a whole `.tmp` beside it.
- **Interface wording:** the maintenance dialog now shows `COULDN'T FINISH - <the new fail sentence>` for the new outcomes (a sign-in was found, nothing to back up, a folder a backup can't carry, already running). Take frames at 640x480.

## Sweep rows (#308), 49 plus 2 added

Each row is either fixed, with its commit, or withdrawn, with the reason.

**10-packages-and-build, claude**

| id | Outcome |
|---|---|
| F-PB-06 | **Fixed** `073a3fdaff`, with PL-041. FAIL before: `rc 124 after 20s (124: still spinning at the timeout)`. |
| F-PB-07 | **Withdrawn, refuted in part.** Busybox awk exits 1 on an input it cannot open. The image's binary gave: `awk: t.cfg: Permission denied rc=1`, and rc=1 for ENOENT and EISDIR. So `write_setting_line` never reaches its rename there. The proposed hostname guard would contradict section c's contract (a hostname-less file keeps its keys; an empty file gets its one line). An EIO in the middle of a read cannot be constructed on the host, and a second read would meet the same EIO. |
| F-PB-08 | **Fixed** `073a3fdaff`, with PL-041 (the window). The pid-reuse half does not arise: `J_CONF_LOCK=/tmp/.system.cfg.lock`, and /tmp is tmpfs (`tmp.mount`, `What=tmpfs`). |
| F-PB-10 | **Withdrawn, refuted.** The interface strips the ANSI codes before using the last line: es-app `GuiMenu.cpp:282-299`, `maintenancePlainLine`. |
| F-PB-11 | **Fixed** `45f390e898`, with PL-045. |
| F-PB-13 | **Fixed** `52ac9e65e7`. FAIL before: `rc 0 -- sda2 was stripped to itself`. Two regression guards (mmcblk1 external, mmcblk0p2 root) passed at the base. |
| F-PB-14 | **Withdrawn, not my file.** It is `projects/ROCKNIX/packages/sysutils/systemd/config/system.conf.d/20-watchdog.conf`, a drop-in, not a unit under my rows. D-SYS-002 settles the 15 s figure. Whether a SoC's watchdog keeps counting in suspend is a device fact: a suspend test per SoC, on a handheld, asked for by name. |
| F-PB-16 | **Fixed** `e1f4155051`. FAIL before: `67108864 bytes were read and dropped`; `(whole: 3000 raw bytes ...)` for a 3001-byte dump under busybox head. |
| F-PB-17 | **Withdrawn, design intent.** The five-minute snapshot is what brackets a play-time freeze: `handheld-evidence.md`'s row "Device-state pages, ring of five, every 5 min", and the script header's "a freeze is bracketed by the last 25 minutes of state". It runs at Nice=15 with IOSchedulingClass=idle, and there is an opt-out (`volatile-log`). No hitch was demonstrated; `tools/time-to-play` could measure one on the VM if wanted. |
| F-PB-18 | **Fixed** `56f88c297f` (`...Pass` keys; `sk-` anchored). `login` was not added: a login is a user name, which the tree keeps on purpose. |

**2-wifi, claude**

| id | Outcome |
|---|---|
| F-WF-01 | **Fixed** `7231b40e58`. FAIL before: `wifi.ssid 'Home' wifi.key 'home-key-1'` stayed after forgetting Home. |
| F-WF-02 | **Fixed** `fb45fc4289`, with PL-003. FAIL before: `wifi.ssid 'Cafe' wifi.key ''`. |
| F-WF-04 | **Withdrawn, refuted.** `WIFI_DEV` is assigned at file scope (`wifictl:37`, `ls /sys/class/net \| grep -m1 ^wlan`), and the script exits 0 without it (`:40`). |
| F-WF-05 | **Fixed** `7d450616ef`. FAIL before: `list printed 'Cafe\: Guest\|Neighbour\|'`. |
| F-WF-06 | **Fixed** `a50b402f8e`. FAIL before: `join rc 1, forget rc 1`. |
| F-WF-07 | **Fixed** `7231b40e58`. FAIL before: `rc 1`. |
| F-WF-09 | **Withdrawn, refuted.** The harness already has section u, "wifictl current, saved, forget and join", run through the image's busybox sed, awk, head and cut (#191). y2 extends it. |
| F-WF-10 | **Fixed** `2c50212553` for the stale row name (WI-FI SSID is WI-FI NETWORK since D-UI-071). The fork issue numbers and dated quotes in the comments are upstream fit, left for the PR-prep pass (#256). |
| F-WF-12 | **Fixed** `f4cf7aed49`, the script half: `wifi.ssid` is the profile's SSID. FAIL before: `wifi.ssid 'Home profile'`. The picker half (`WifiText::pickerRows` matching SSIDs against saved names) belongs to the interface's stream. |

**4-backup-restore, claude**

| id | Outcome |
|---|---|
| F-BR-05 | Duplicate of **PL-037**, fixed in `01522088cc`. |
| F-BR-06 | Duplicate of **PL-038**, fixed in `63269d17ab`. |
| F-BR-07 | **Fixed** `f1152db8ef`. FAIL before: `root: ... ARCHIVED_ROCKNIX_BACKUP-20-01-01_00_00_00.zip ; archive/: (empty)`. These are the upstream-era archives that `cloud_backup`'s `--include=/*.{zip,tar.gz}` uploaded on every backup. |
| F-BR-08 | **Fixed** `6236faa178`. FAIL before: `f1='ARCHIVE'` (the rollback had no copy). |
| F-BR-09 | **Fixed** `43e24df453`. Staging is at `/storage/.cache/backuptool-staging.*`, not in /tmp, which is a tmpfs at 50% of RAM. FAIL before: `mktemp calls: ... mktemp -d`. |
| F-BR-11 | **Fixed** `449973e7e4` (comments only). |
| F-BR-12 | **Fixed** `8b2e808d7e`: (a) the tier is named, (e) tool stderr goes to the log, (f) the damaged-archive advice is rewritten; (b) and (c) went with PL-005's refusal. FAIL before: the three lines in `bt-unfixed.log`. **(d) withdrawn:** the `>>> why` line is the protocol the interface's maintenance dialog reads from the same stdout, and moving it to another descriptor is a protocol change across both repos. |
| F-BR-13 | **Fixed** `ffa527dff6`. FAIL before: `raofflineproxy/q: restored`. The case is a zip: busybox tar `-X` excludes a bare folder name's subtree, busybox unzip `-x` does not (probed on the image's binary). |
| F-BR-14 | Duplicate of **PL-036**, fixed in `02d1b16aa4`. |
| F-BR-15 | Duplicate of **PL-077**, fixed in `dbb9e6bdd5`. |
| F-BR-16 | **Fixed** `449973e7e4` (a comment beside DEFAULT naming 747362fe36 and the reason). The restore note is not lengthened: a same-device restore keeps its pairings. |
| F-BR-17 | **Fixed** `189226087b`. FAIL before: the why was `THE BACKUP COULDN'T FINISH WHILE GATHERING YOUR SETTINGS` and the screen said TRY AGAIN. |
| F-BR-18 | **Fixed** `e60fccb2dc`. The file is sourced in a subshell, as `cloud_backup` does, and the result must be under /storage. FAIL before: `archives at /storage/roms/backup: 0`. |
| F-BR-19 | **Fixed** `1ec3930baf` (pauses only on a tty). FAIL before: `sleeps: sleep 3\|sleep 5\|`. |

**5-cloud-sync-and-saves, claude**

| id | Outcome |
|---|---|
| F-CS-09 | **Withdrawn, refuted.** The post-update that runs is the installed one, `projects/ROCKNIX/packages/rocknix/sources/post-update:106-111`, and it calls `/usr/bin/cloud_sync_helper` after every update through `autostart/003-upgrade`. The deleted `rclone/sources/post-update` was never installed by any package (e6af480449). |

**10-packages-and-build, gpt**

| id | Outcome |
|---|---|
| F-PB-15 | **Fixed** `e1f4155051`. FAIL before: the epoch-4000 interface dump was deleted, and five space-refused notes all stayed. |
| F-PB-16 | **Fixed** `577089c5f4`. FAIL before: `system.cfg: 'system.hostname=X\|'` (foo_bar and fooXbar removed). |
| F-PB-17 | **Fixed** `d56288b5d9`. FAIL before: `got 'S=2 A= F=' and 'S= A=0 x.sfc'`. |
| F-PB-21 | **Fixed** `e1f4155051` (flock on the cores folder). FAIL before: `the second note existed mid-way through the first dump: yes`. |
| **F-PB-20** (added by the coordinator, from F2) | **Fixed** `e1f4155051` (the cap follows `%E`'s basename; the cut comm also matches). FAIL before: `(whole: 100 raw bytes ...) -- the 256 MiB cap was applied`. Already written: an armed device's existing cores are kept, and the next crash prunes to the three newest by time. |

**2-wifi, gpt**

| id | Outcome |
|---|---|
| F-WF-03 | **Fixed** `f4cf7aed49`, the script half; same as claude F-WF-12. |
| F-WF-04 | **Fixed** `a50b402f8e`; same as claude F-WF-06. |
| F-WF-07 | **Fixed** `7231b40e58`; same as claude F-WF-01. |

**4-backup-restore, gpt**

| id | Outcome |
|---|---|
| F-BR-13 | **Fixed** `36edaa8ad2`. FAIL before: `es_systems.cfg is a regular file: FROZEN SYSTEMS`. |
| F-BR-14 | **Fixed** `7ca6f89963` (`unzip -p` reads every member). FAIL before: `why 'THE RESTORE COULDN'T FINISH'; ... snapshots: 1`. |
| F-BR-15 | **Fixed** `6236faa178`; same as claude F-BR-08. |
| F-BR-16 | **Fixed** `c8593f5367`. FAIL before: `system.cfg in the archive: '-rw-rw-r--'; directory entries: 5`. |
| F-BR-17 | **Fixed** `92bbb03d78`. FAIL before: the PRE_RESTORE `.partial` and the staging folder were left. |
| F-BR-19 | **Fixed** `7a719d8f6f`. FAIL before: `rc 1; why 'THE BACKUP COULDN'T FINISH WHILE GATHERING YOUR SETTINGS'`. |
| F-BR-20 | **Fixed** `8b2e808d7e`; same as claude F-BR-12(e). |

**7-generic-x64-vm, gpt**

| id | Outcome |
|---|---|
| F-VM-18 | **Withdrawn, not my files.** `packages/hardware/quirks/platforms/GENERIC_X64/095-kernel-early-boot-fixes` and `projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm` belong to stream F1. |

**8-es-menus-and-core, claude: the launch command finding (added by the coordinator, from E2)**

- **Fixed** `d56288b5d9`. The platform is now read from the first `-P<platform>` argument after the ROM.
- FAIL before: `the platform read 'layer'`.
- Already written: nothing on a device changes.

## Decisions made while executing (for the register; docs/ is outside my files)

1. **A credential in a backup refuses it, and the refusal goes after the archive's content is final.** The scan runs over the staged tree before `tar` (PL-005). The alternative in the claude seat's verdict, keeping the archive renamed `.held`, was not taken: the brief's text says "the partial removed".
2. **The backup folder is excluded from a backup, not refused** (PL-008): `/storage/roms` is a reasonable list, and only its nested archives are wrong. **A location outside /storage refuses the whole backup** (PL-038): that is the acceptance's "ends with the refusal line", and a silent skip is the defect.
3. **The pre-restore copy is the archive's members that exist on the device, unpruned.** The files the restore would create travel in the restore mark as `+<path>` lines after line 1 (PL-007). Marker format v2 is readable by old images, which take line 1 only.
4. **The seed list is a member of the archive, `storage/.config/.backuptool-seeds`** (PL-037). It is never extracted to the device.
5. **One run at a time, by `flock -n` on a descriptor opened on the settings backups folder**, with no lock file (PL-077). A second run is refused, not queued.
6. **Staging goes under `/storage/.cache`**: the internal card keeps file modes, where a FAT games card would not, and /tmp is RAM (F-BR-09).
7. **wifictl:**
   - forget removes `wifi.ssid` and `wifi.key` when they name the forgotten network, by SSID or profile name (F-WF-01);
   - join writes the profile's SSID, not its name (F-WF-12);
   - a key that cannot be read leaves the settings untouched but still reports joined (F-WF-02).
8. **The settings lock:** born with its pid through `ln`; reaped under `flock <lock>.reap`, matching E1; gives up after five create misses (about 4 s) and returns 1 (PL-041, F-PB-06).
9. **chksysconfig:** a copy under /storage/roms waits for `mountpoint -q /storage/roms` (PL-045). A whole `.tmp` is taken when there is no usable live file or record (PL-064).

## Player words proposed (for the maintainer's approval)

Each is a `>>> why` line plus a fail sentence, or a note. All pass `tools/vocabulary-check` and section e's FORBIDDEN regex.

- `A SIGN-IN WAS FOUND IN THE BACKUP` / `A SIGN-IN WAS FOUND IN THE BACKUP, SO IT WASN'T KEPT. YOUR LAST BACKUP IS UNCHANGED.`
- `THERE'S NOTHING TO BACK UP YET` / `THERE'S NOTHING TO BACK UP YET. YOUR LAST BACKUP IS UNCHANGED.`
- `YOUR OWN BACKUP LIST NAMES A FOLDER A BACKUP CAN'T CARRY` / `..., SO NOTHING WAS WRITTEN. YOUR LAST BACKUP IS UNCHANGED.`
- `A SETTINGS BACKUP OR RESTORE IS ALREADY RUNNING` / `... WAIT FOR IT TO FINISH, THEN TRY AGAIN.`
- `THIS DEVICE CAN'T RESTORE SETTINGS. SOMETHING IT NEEDS IS MISSING FROM THIS BUILD.` (the restore's new tool check)
- `YOUR OWN BACKUP LIST IS EMPTY, SO THE STANDARD ONE WAS USED.`
- `THIS DEVICE'S SETTINGS BACKUP IS DAMAGED. NOTHING WAS CHANGED. RESTORE SETTINGS FROM THE CLOUD AGAIN, OR BACK UP SETTINGS TO REPLACE IT.`
- `COPY IT SOMEWHERE SAFE, OR BACK UP SETTINGS TO THE CLOUD UNDER GAME SETTINGS > MANAGE CLOUD STORAGE.`
- `KEEPING N FILE(S) THE SYSTEM PROVIDES THAT THIS BACKUP WOULD HAVE REPLACED.` ("OLDER" is dropped, because tar archives now say it too.)
- factoryreset uses its existing `THE DEFAULT SETTINGS COULDN'T BE PUT BACK.` for the new failure.

## What I could not do, and why

- **F-PB-14 and F-VM-18** are in files outside stream B (the systemd drop-in, and GENERIC_X64/F1). Both are withdrawn and routed as above.
- **The interface half of F-WF-12 / F-WF-03** is `WifiText::pickerRows`, in the ES tree, which belongs to another stream.
- **F-BR-12(d)**, moving `>>> why` to another descriptor, is a protocol change across both repos. Not done.
- **F-WF-10's fork references** are left for the PR-prep pass (#256).
- **A two-contender case in `tools/wait-lock-test` itself:** that file is not in my list. The case is in stream B's block, and wait-lock-test passes unchanged.
- **F-PB-07:** an EIO in the middle of a read cannot be constructed on the host. The part that can be tested (an unreadable input) is refuted with the image's awk.
- **No work-log entry and no register rows were written.** `docs/` is not in my files; the decisions above are for the integrator to record.
- **Nothing was run on the VM or a device**, as the brief requires. The proofs owed there are listed under the punch items.
- **Process slip:** one commit was first made with the suite failing. I had not gated the commit on the suite's exit code, and `exec 9<dir 2>/dev/null` had silenced the rest of the script's stderr. I amended it within the same step once the full suite passed (it became `dbb9e6bdd5`), and every later commit went through `commit-gated.sh`, which commits only on a passing suite.

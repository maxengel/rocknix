# Forward Audit — Milestone "Stable before upstream", the work since audit #129

**Auditor:** Code Auditor skill (Claude Fable 5.1, `xhigh`)
**Date:** 2026-09-13
**Subject:** every acceptance criterion in #45 #142 #50 #93 #47 #27 #149 #66 #67 #68 #69 #82 #113 #129, ticked or not, plus the ten register rows the range wrote
**Spec:** the issue bodies on `maxengel/rocknix`; `docs/decision-register.md`

---

## Running Notes

Method: each criterion is copied from the issue, the evidence is located in code or in a check I ran, a refutation is attempted, and the verdict is written before the next criterion is opened. Verification depth is stated per entry: *code-read*, *check-run* (a mechanical check I executed), *guest-read* (a read-only ssh to a QA guest), *frame* (a PNG under `docs/qa-frames/2026-09-13/` I opened by name), or *cited* (a run recorded by the implementer that I could not repeat under this audit's read-only constraints). Tracker state is never the evidence. Ticks in the issue bodies are quoted so a false one can be seen.

Constraints that shape the depth: no handheld, no real cloud account, no writes to the QA guests (so no `cloud-round-trip`, no `vm-visual-qa` walk, no planted marker), no code changes. Where a criterion's only proof is a run I could not make, the verdict says so rather than borrowing the implementer's.

---

## #45 — backuptool: the archive is OS-shipped PPSSPP content, not user config

### AC-45-1: A backup on a device with stock PPSSPP content is substantially smaller than 16 MB; the archive's size tracks user data rather than shipped assets.

**Source:** #45, box 1 (ticked: "guest c, `4fae9fe2e4`: 17,317,741 B and 187 asset entries with the shipped script, 9,218 B and 16 entries with the new one")
**Verdict:** PASS ✓ (code-read + check-run; device figure cited)

**Evidence:**
- `backuptool:258-297` (`4fae9fe2e4`): `grep -v -F -f REGENERABLE` drops every path under `/storage/.config/ppsspp/assets/` and `…/PSP/SYSTEM/CACHE/`; the `while read` loop drops every `/storage/.config/<rel>` whose `/usr/config/<rel>` exists and is `cmp -s`-identical; the count is logged (`:297`).
- `tools/last-good-scripts-test` case k, run 06:06 UTC: `PASS shipped seeds identical to /usr/config do not (cheat.db, test/seed)`, `PASS assets and the shader cache never do, edited or not`, `PASS and the log says two were left out`. `BASE_REF=53f390b1e9 … --old`: the same three checks FAIL against the pre-range script — the guard fires.
- `cmp` is a busybox applet on both image trees (`image/system/usr/bin/cmp -> busybox`, H700 and x64) — the prune cannot silently no-op for want of the tool (blindspot 16 checked).
- Device figure: work log 00:05, guest c, 17.3 MB → 9,218 B (cited).

**Refutation attempted:** looked for a way the prune passes over everything — `grep -v` exiting 1 when every line is pruned is caught by `|| true`; an absent `/usr/config/<rel>` keeps the file; a `cmp` failure (exit 2) keeps the file. Looked for a busybox `cmp` absence: present. Looked for the empty-list path: `[ ! -s FILELIST ]` at `:299` runs after the prune, so a device whose whole tree is shipped seeds is told nothing is there to back up rather than writing an unreadable archive.

**Notes:** the comment at `:275-276` says "prefix matches"; `grep -F` is a substring match. Harmless (the strings begin with `/storage/.config/`), inaccurate. Also: `grep -F -f` is GNU grep on the device (the image's busybox has no grep applet — `rclone-cloud-sync.md`), so no applet gap there.

### AC-45-2: `ppsspp.ini` and `controls.ini` still round-trip through backup → restore byte-identically in the VM.

**Source:** #45, box 2 (ticked: "guest c: `ppsspp.ini` back byte-identical via `restore --no-restart`; case k proves the edited-file path")
**Verdict:** PASS ✓ (check-run; device run cited)

**Evidence:** case k `PASS the edited ini and the player's own file travel` and `PASS the ini and the player's file come back from it` (the edited `ppsspp.ini` differs from `/usr/config`'s and is kept; the restore puts `OLD ini` back). `controls.ini` is not in the fixture, but it follows the identical rule (a file that differs from its seed travels; one that is byte-identical is regenerable from the image, which is the criterion's own intent).

**Refutation attempted:** a `controls.ini` the player never changed is pruned and does not "round-trip" — but the image restores the identical bytes by construction (`factoryreset` seeds it), so the device ends with the same file. Looked for an edited `controls.ini` being treated as shipped: only a byte-identical file is pruned.

### AC-45-3: The same on hardware: the archive shrinks and `ppsspp.ini`/`controls.ini` round-trip on the RG SP or RG35XX SP once a build carrying `4fae9fe2e4` is staged.

**Source:** #45, box 3 (unticked)
**Verdict:** SKIP ○ — open in the issue by design (per-device yes, D-QA-015); not attempted here (no handheld touched). Tracked on #45.

### AC-45-4: Restoring a backup taken on an older build does not overwrite `/storage/.config/ppsspp/assets` on a newer one.

**Source:** #45, box 4 (ticked: "the shipped script's 17 MB archive restored by the new script over a marked `7z.png` left the asset untouched … case k: `-X` skip … four checks fail against the pre-change script")
**Verdict:** PARTIAL ⚠ (code-read + check-run; device run cited)

**Evidence:**
- Tar archives: `backuptool:574-577` extracts with `-X SKIP` (`storage/.config/ppsspp/assets/*`, `storage/.config/ppsspp/PSP/SYSTEM/CACHE/*`); case k `PASS its assets and cache are left where they were`, FAIL under `--old`. Guest c's run (work log 00:05) exercised the image's busybox `tar -X` on a real 17 MB archive — the harness's `btk` binds the host's `/usr`, so case k's tar is GNU tar (the shim list at `tools/last-good-scripts-test:111` is `sed mv cp tr head wc cut awk`; `tar` is not shimmed). The device run is what proves busybox `-X` semantics; case k proves the script's logic.
- **Zip archives are not skipped.** `backuptool:578-600`: the zip branch's `SKIP` collects only entries that are live symlinks (`[ -L "/${ENTRY}" ]`); `ppsspp/assets/*` is never added, and `unzip -o … -d /` writes them. An archive written before the tar switch (`912193b34e`, 2026-08-26) carries `ppsspp/assets/**` as regular files (that was the 16 MB), and restoring it onto a newer build puts the older assets under the newer emulator — the exact failure the criterion names.

**Refutation attempted (of the gap):** is any zip archive still in the wild? `zip` was absent from every image built after upstream's January deletion (blindspot 16), so no zip archive was *written* between then and 2026-08-26; but archives written by images from before January exist on devices and in clouds, and `backuptool` deliberately still restores them (`ARCHIVE_KIND` zip branch exists for that reason). The population is small and real.

**Gaps:** the zip branch needs the same two prefixes excluded (`unzip -x 'storage/.config/ppsspp/assets/*' 'storage/.config/ppsspp/PSP/SYSTEM/CACHE/*'`), and D-CLOUD-008's "from any archive" is true only after that.

### AC-45-5: The `backuptool:162` comment describes the actual symlink direction, or drops the incorrect PPSSPP example.

**Source:** #45, box 5 (ticked)
**Verdict:** PASS ✓ (code-read)

**Evidence:** `backuptool:244-248`: "the ppsspp link runs the other way -- /usr/bin/assets points INTO /storage/.config/ppsspp/assets -- so that one is not an example of this"; `ppsspp-sa/package.mk:91` `ln -sf /storage/.config/ppsspp/assets ${INSTALL}/usr/bin/assets` confirms the direction stated.

**Refutation attempted:** checked the new examples — `es_systems.cfg`/`es_features.cfg` "point into /usr/config": consistent with the zip branch's own comment and with #45's original finding. No contradiction.

### AC-45-6: A decision is recorded for `PSP/Cheats/`, with user-added cheat files still covered by whatever is chosen.

**Source:** #45, box 6 (ticked: D-CLOUD-008)
**Verdict:** PASS ✓ (code-read + check-run)

**Evidence:** `docs/decision-register.md` row D-CLOUD-008 (2026-09-13) states the identity rule for `PSP/Cheats/`; the code implements no Cheats-specific path — the identity prune covers it; case k: `cheat.db` (identical to the seed) is left out, `test/own` (no seed) travels — the two sides of the rule.

**Refutation attempted:** a player who edits the shipped `cheat.db` — it differs, so it travels (correct). A player's own `NPEG00023.ini` that happens to be byte-identical to the shipped one is pruned — and is regenerable from the image, so nothing is lost. No failing input found.

---

## #142 — FTP remotes: a missing directory reads as a broken cloud, and `--retries 1` loses files

### AC-142-1: A missing remote directory is treated as *not there yet* on FTP as it is on WebDAV — the branch does not rest on rclone's exit code alone where the code differs by backend.

**Source:** #142, box 1 (ticked: `6c13475947`, D-CLOUD-123, case l)
**Verdict:** PASS ✓ (code-read + check-run)

**Evidence:** `cloud_content_restore:325-340` `absent_not_broken()` walks to the nearest listable parent; `:894-897` and `:909-912` consult it after any scan code other than 0 or 3 and set the code to 3; `cloud_setup:127-158` carries the identical function and `syncpath_problem` (`:189-198`) consults it on path-based remotes only. Case l, 11 checks PASS (absent at one, two and three levels; present when the parent lists it; unlistable root is broken; root never absent; the two copies `diff`-identical; mkdir before copy; both scan sites consult it).

**Refutation attempted:** traced `qa:/QA/Content/ROMs/` by hand through the string arithmetic (`remote`, `rel`, `name`, `parent`) — correct at each level including the root (`parent=""` → `qa:/`). Looked for a false "absent" — on a **bucket remote whose bucket does not exist**, the root lists buckets and lacks the name, so the *scan* (which has no BucketBased guard, unlike the setter) reads a missing bucket as an empty cloud. Not the FTP case, not the everyday path (the setter refuses such a name), recorded in Phase 3 as an observation.

### AC-142-2: `cloud_content_restore --scan` lists every system against an FTP remote, and a scan against a reachable cloud never ends `Your cloud couldn't be read`.

**Source:** #142, box 2 (ticked: "the five scan checks and the stanza-restore check pass on guest a with the patched script")
**Verdict:** PASS ✓ (code-read; guest run cited, not repeated)

**Evidence:** the scan path above rewrites a 501-shaped failure to 3 before the code is judged; case l's shim answers 501 for every unknown folder and the function reads it as absent. The "couldn't be read" sentence is emitted only for a code the rewrite did not reach. The 100/100 FTP run on guest a with the patched scripts (work log 01:05, `--path-prefix /tmp/qa-bin`) is the implementer's; this audit did not run `cloud-round-trip` (it drives a guest and a QA endpoint, both off-limits here).

**Refutation attempted:** an FTP server whose *root* refuses to list (`ROOT_DOWN`) — case l `PASS a root that will not list is broken, not absent`: the scan then keeps the failure code, which is the right answer. No path found where a reachable cloud's empty folder still reads as unreadable.

### AC-142-3: A content backup into a cloud folder that does not exist yet transfers every file — the destination is created before the copy, or the copy is allowed the retry that recovers it.

**Source:** #142, box 3 (ticked)
**Verdict:** PASS ✓ (code-read + check-run)

**Evidence:** `cloud_content_backup:564` `rclone mkdir "${TARGET}" "${RCLONE_LIST_OPTS[@]}" 2>/dev/null` immediately before the `rclone copy` at `:565`; `RCLONE_LIST_OPTS` is declared at `:131` (above its use — blindspot 24 checked); case l `PASS cloud_content_backup makes the folder before it copies into it` (an `awk` line-order check).

**Refutation attempted:** the mkdir's own failure is discarded (`2>/dev/null`, status unchecked) — if it fails, the copy still runs and reports its own failure loudly under `--retries 1`, which is the pre-change behaviour and not silent. On a bucket remote `mkdir` writes a marker only under `directory_markers` (D-CLOUD-120); without markers it is a no-op and the copy behaves as before. No regression found.

### AC-142-4: `tools/cloud-round-trip --backend ftp` reaches 99/99 on the vm-pair.

**Source:** #142, box 4 (ticked: "100/100 on guest a, `ec12767b26` with the three scripts staged under `--path-prefix /tmp/qa-bin`")
**Verdict:** UNTESTABLE ? (this audit may not run the harness; the run is cited)

**Evidence:** the claim is a run on guest a on 2026-09-13 01:05 UTC (work log), with the FTP fixture on 9015. Not in `docs/vm-qa-log.md` (the 2026-09-13 rows record WebDAV suite runs only). The code paths the nine failures exercised are the ones AC-142-1/-3 verify.

**Refutation attempted:** none possible without a run. Recorded as a Coverage Boundary item; the suite's FTP cell is the re-check once a run is permitted.

---

## #50 — network: every device ships with hostname = device family, so two units collide

### AC-50-1: Two devices of the same family get different names without manual renaming.

**Source:** #50, box 1 (ticked: three GENERIC_X64 guests came up `GENERIC-X64-491f`, `-15ca`, `-0964`)
**Verdict:** PASS ✓ (guest-read + check-run + code-read)

**Evidence:** guests a/b/d on `519f40aa0c` report `hostname` = `GENERIC-X64-15ca` / `-0964` / `-474c` (read 06:06 UTC); `network-base-setup:26-35` renames a name equal to `HW_DEVICE` (or empty) to `<FAMILY>-<4 hex of cloud_device_id>` once and writes it back; `scripts/image:163` and `rocknix/package.mk:90` make `HW_DEVICE` and the shipped `system.hostname` the same `${DEVICE}` string; case m: `PASS the family name H700 becomes H700-9a3f`, and `vm-qa`'s pair-identity suite requires two names each equal to its setting (`tools/vm-qa:146-154`).

**Refutation attempted:** two units whose ids share their first four hex digits collide again — 16 bits of hash, a 1-in-65536 pair; accepted by D-NET-002 implicitly, noted. A unit whose `cloud_device_id` yields no hex (`unknown`) keeps the family name with **no log line** (`:28-34` has no `else`) — a silent no-rename; see AC-50-3 and Phase 3.

### AC-50-2: Two same-family handhelds on one network are both reachable by their names (the router's view).

**Source:** #50, box 2 (unticked)
**Verdict:** SKIP ○ — needs two handhelds on a LAN (per-device yes); tracked on #50.

### AC-50-3: The default hostname is stable across reboots and reflashes of the same unit (not re-randomised every boot).

**Source:** #50, box 3 (ticked: "written back once; a second run leaves it; the suffix is `cloud_device_id`'s, seeded from the permanent hardware address, so a reflash derives the same one; case m")
**Verdict:** PARTIAL ⚠ (reboots: PASS by code and check; reflash: proven on the VM, unproven and newly fragile on a handheld)

**Evidence:**
- Reboots: once written, `system.hostname` no longer equals the family, so the branch is never re-entered (`:26`); case m `PASS a second boot leaves it (stable)`; guest b's current boot logged the rename once and kept it.
- Reflash: the suffix is `cloud_device_id`'s hash. On the three guests `md5("<permanent MAC>|unknown")[0:10]` equals the stored id (computed 06:06 UTC: `15ca35b6b4`, `0964eed643`, `474cbdb64c`), so on the VM the first-boot id was adapter-derived and a reflash would reproduce it.
- **The fragility this range introduced:** `network-base.service` (`DefaultDependencies=no`, `After=local-fs.target systemd-tmpfiles-setup.service userconfig.service`) now makes the **first** call to `cloud_device_id` on a fresh device, at 1.8-2.8 s on the guests. `cloud_device_id:generate_id` falls back from `ethtool -P` to `/etc/machine-id` to `unknown` and `main` **stores the result** (`write_id`), after which "the stored value wins" (its header). Before this range the first caller was a cloud action with the network up. On a handheld whose SDIO wifi (H700: `CONFIG_RTW88_8821CS=y`, firmware from the rootfs) is not yet an interface at that moment, the identity is seeded from machine-id — hardware-derived on H700 (`systemd-machine-id-setup`: `sunxi-sid`) so stable, but a *different* value from the MAC hash — and a later reflash whose first boot finds the adapter up seeds from the MAC. Two boots, two identities, two hostnames, two cloud folders.

**Refutation attempted:** looked for a guarantee the adapter exists — none in the unit (`DefaultDependencies=no`; no `After=sys-subsystem-net-devices-*.device`, no `Wants=network-pre.target`). Looked for `cloud_device_id` refusing to write a fallback id — it writes every generated id except the empty-file-no-adapter case. Looked for an H700 boot journal in `docs/` with wlan0 and network-base in monotonic time — none. So the failure cannot be shown on a device from here, and it cannot be excluded either.

**Gaps:** either the rename waits for an id that is adapter-derived (a `cloud_device_id --if-stored`/`--no-write` mode, or the rename deferred to a unit after `network-online.target`), or the first boot's id is proven adapter-derived on an H700 in monotonic time. Acceptance for the finding: on an RG35XX SP flashed fresh, `journalctl -b -o short-monotonic` shows `wlan0` registered before `network-base.service` starts, **or** the stored id equals `md5("<ethtool -P wlan0>|unknown")[0:10]`.

### AC-50-4: A hostname the player has set is never overwritten by the default.

**Source:** #50, box 4 (ticked)
**Verdict:** PASS ✓ (code-read + check-run)

**Evidence:** `:26` enters the rename only for an empty name or one equal to `FAMILY`; case m `PASS a name the player typed is untouched (Max Deck)`, `PASS another family's name … is left alone (RK3566)`.

**Refutation attempted:** a player who typed exactly their family name (`H700`) is renamed — D-NET-002 declares that name "never something a player typed". A stated assumption, recorded, not a defect. A name that *cleans* to the family (`H 700`)? `:26` compares the raw setting, so it is left alone — correct.

### AC-50-5: Upgrading a device that already has `system.hostname` set keeps that value.

**Source:** #50, box 5 (ticked, with the family-name exception stated)
**Verdict:** PASS ✓ (code-read + check-run)

**Evidence:** the same branch; an upgraded device carrying `H700` is renamed at the first boot of the new image (stated in the tick and in D-NET-002 "for the maintainer to overrule"); one carrying a typed name is untouched (case m). The write goes through `set_setting`, one rename of `system.cfg` (case c), inside the `chksysconfig` window — see Phase 3.5.

**Refutation attempted:** the criterion as written ("keeps that value") is contradicted for the family-name case, and the tick says so openly; the register row records the choice. No hidden divergence.

### AC-50-6: mDNS responds on the VM: `avahi-daemon` enabled and ordered after the naming script (`e76bafe860`, D-NET-003); on a GENERIC_X64 guest at 1.9 s it logs `Server startup complete. Host name is GENERIC-X64-474c.local`, 190 ms after the name was written, with no `Daemon not running` line left.

**Source:** #50, box 6 (ticked)
**Verdict:** FAIL ✗ (guest-read + image-tree read + code-read)

**Evidence:**
- Enabled: yes — `avahi/package.mk:106` `enable_service avahi-daemon.service`; the image tree has `multi-user.target.wants/avahi-daemon.service`; `systemctl show` on the guests: active. `Daemon not running`: gone, because `network-base-setup:46-56` no longer calls `avahi-set-host-name`.
- **Ordered after the naming script: no.** The image ships avahi's **stock** unit, not `projects/ROCKNIX/packages/network/avahi/system.d/avahi-daemon.service`: `image/system/usr/lib/systemd/system/avahi-daemon.service` on both x64 (`519f40aa0c`) and H700 (`59103cd9cb`) trees reads `[Unit] Description=Avahi mDNS/DNS-SD Stack / Requires=avahi-daemon.socket`, `Type=dbus`, `WantedBy=multi-user.target`; `systemctl show avahi-daemon.service -p After` on guests a/b/d: `basic.target avahi-daemon.socket system.slice systemd-journald.socket dbus.socket sysinit.target` — no `network-base.service`, `TriggeredBy=avahi-daemon.socket`. Root cause in `01-research-notes.md` § 1.3f: the fork's recipe lacks upstream's `rm -rf ${INSTALL}/usr/lib/systemd`, so `scripts/install` extracts the stock units over the fork's `system.d/` copy.
- **The consequence, observed:** guest b (`:10023`), monotonic journal: `avahi-daemon.service` started 1.777 s, `Server startup complete. Host name is ROCKNIX.local` at 2.762 s; `network-base.service` started 2.761 s, wrote `GENERIC-X64-0964` at 2.794 s. The guest is named `GENERIC-X64-0964` and **publishes `ROCKNIX.local`** — the collision #50 exists to remove, now over mDNS, and with `avahi-set-host-name` removed nothing corrects it during the session. Guests a and d won the race (a: avahi started 1.85 s after network-base finished 1.83 s; d: avahi's startup read the name after network-base wrote it at 2.10 s). The tick's observation (`474c`, 190 ms after) was one boot on which the race was won.
- `tools/last-good-scripts-test` case m, check 8 ("the mDNS responder is enabled and orders after network-base") greps the **source** unit file (`:669`) and passes; it never looks at what ships (blindspot 20/34's shape — the artifact under test is not the one built).

**Refutation attempted:** looked for a drop-in adding the ordering (`avahi-daemon.service.d/`: none on either tree); for an ordering cycle that would explain a dropped `After=` (`journalctl | grep -ci 'ordering cycle'`: 0 on all three guests); for avahi tracking a later hostname change on its own (it logged no second `Host name is` line on guest b in 30+ minutes; avahi re-reads the name only on `avahi-set-host-name`/D-Bus `SetHostName`, which nothing calls). The finding survives.

**Gaps:** (1) `rm -rf ${INSTALL}/usr/lib/systemd` (or equivalent) in the fork's `post_makeinstall_target` so the fork's unit ships; (2) a check that reads the **built** unit (`image/system/usr/lib/systemd/system/avahi-daemon.service`, or `systemctl show -p After` on a guest in `vm-qa`'s pair-identity suite) rather than the source; (3) a `pair-identity` assertion that the published mDNS name equals the kernel hostname (`journalctl -u avahi-daemon | grep 'Host name is'`); (4) until (1) lands, restore `avahi-set-host-name` (or `avahi-daemon -r`) after the write as the corrective the shipped ordering lacks; (5) D-NET-003's off-switch sentence is false on the shipped unit (no `ConditionPathExists` at all) — and on the fork's own unit it would be false too on any device that already has `avahi.conf` (every one that has booted): `avahi-defaults.service` conditions on `!avahi.conf` and `!avahi.disabled`, so `.disabled` only prevents a copy that has already happened.

### AC-50-7: `<name>.local` resolves from a laptop on the LAN for a handheld running an image with this.

**Source:** #50, box 7 (unticked)
**Verdict:** SKIP ○ — LAN only; tracked on #50. Note for whoever runs it: on the boot the race is lost, `<name>.local` will not resolve and `ROCKNIX.local` will — the test should also assert that `ROCKNIX.local` does **not** answer.

---

## #93 — SAVESTATE MANAGER: help bar is stale after deleting the last slot

### AC-93-1: After a delete, the help bar shows the prompts of the newly focused row (START NEW GAME: BACK / LAUNCH, or whatever that row offers).

**Source:** #93, box 1 (ticked: ES `a45c4c1b1`, image `878ec8863b`)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** `GuiSaveState.cpp:230-236` — `loadGrid()` ends with `updateHelpPrompts()`, so a rebuild that moves the cursor without a cursor event re-reads `getHelpPrompts()` (`:431-`) for whatever is under it; `GuiComponent::updateHelpPrompts` (`es-core/src/GuiComponent.cpp:909-917`) acts only on the top page, so the constructor's call is a no-op before the page is shown. Frame `save-state-manager-after-last-delete-help-bar.png` (1280x800, opened): START NEW GAME focused, START NEW AUTO SAVE beside it, bar `BACK  LAUNCH`. Frame `save-state-manager-after-delete-640x480-db6b42c180.png` is named in the README for the same state at 640x480 (not opened; the 640x480 four-tile frame below shows the same bar shape).

**Refutation attempted:** a delete that leaves slots — the cursor lands on a slot and the bar must offer DELETE / COPY TO FREE SLOT: `getHelpPrompts` adds them when `mGrid->size()` and a slot is selected (`:437-`); `save-state-manager-slot-focused-640x480-db6b42c180.png` (opened) shows `BACK DELETE COPY TO FREE SLOT LAUNCH` on AUTO SAVE. A delete confirmed through `GuiMsgBox` — the msgbox closes, the manager becomes top, `loadGrid` runs after the delete and calls `updateHelpPrompts` while top. No stale path found.

### AC-93-2: Screendump on the VM.

**Source:** #93, box 2 (ticked)
**Verdict:** PASS ✓ (frame — the file exists and shows what the tick says)

---

## #47 — FINISH RESTORE SETUP page: unexplained icons, ambiguous LATER, cloud row shown to everyone

The issue is CLOSED (completed) with **one of five boxes ticked**. The closing comment (2026-09-13 01:47) addresses items 1-4 with quoted strings and frames from guest b at 1280x800. Each criterion is re-derived from `GuiMenu.cpp::openRestoreRelink` (`:7186-7340`) and the three `finish-restore-process-*.png` frames (opened).

### AC-47-1: A player who has never configured cloud sync does not see a cloud row presented as a fault.

**Source:** #47, box 1 (ticked)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** `GuiMenu.cpp:7291-7297` gates on `exists("/storage/.config/rclone/rclone.conf", false)` (uncached) and calls `cloudAddGatedEntry` — the row is greyed under a neutral line ("CONFIRMS YOUR CLOUD STORAGE STILL SIGNS IN AFTER THE RESTORE."); pressed, the `rc == 1` branch (`:7314`) or the gate's own offer asks `NO CLOUD STORAGE IS SET UP ON THIS DEVICE YET. SET IT UP NOW?` — frame `finish-restore-process-check-connection-pressed.png` shows exactly that with YES / NO, YES first (style guide § Confirmations).

**Refutation attempted:** the old gate `exists("/usr/bin/cloud_setup")` is still the outer `if` (`:7286`) — harmless, always true, the inner gate does the work. A device with `rclone.conf` but a dead remote gets `YOUR CLOUD ISN'T ANSWERING` with a path to the repair row — a fault message for a real fault. Correct.

### AC-47-2: Every actionable row carries a description explaining why it is here and the consequence of skipping it.

**Source:** #47, box 2 (**unticked**, issue closed)
**Verdict:** PARTIAL ⚠ (code-read + frame: the descriptions exist; two of them break the rule that governs descriptions)

**Evidence:** every `addCredentialRow` passes a description and `multiLine = true` (`:7203-7206`, the seventh argument of `GuiSettings::addWithDescription`, `GuiSettings.h:53`); CHECK CONNECTION has one; the Bluetooth line is non-actionable. Frame `finish-restore-process-no-cloud-top.png`: each row has a line under it.

**Gaps:**
- **Two rows are three lines at 1280x800**, in the implementer's own frame: `DEVICE PASSWORD (SSH, SAMBA, FILE SERVER)` + "YOUR EXISTING PASSWORD STILL WORKS -- SET ONE HERE ONLY IF YOU WANT TO / CHANGE IT." and `LATER KEEPS THIS LIST` + "IT COMES BACK NEXT TIME YOU START UP, OR FIND IT IN NETWORK SETTINGS > / FINISH RESTORE PROCESS." `es-player-text.md` § "Two lines per row, never three (D-UI-023)" is the rule these descriptions were written under; at 640x480 (fonts ×1.31, half the width) they wrap further. `player-language.md` step 3: "a string that needs more wants a page, not smaller text."
- `--` as an on-screen dash in "STILL WORKS -- SET ONE HERE": the ASCII-comment convention (`es-code-traps.md`) leaked into a player-facing literal; string literals may carry a real dash or a period.
- **The body was not updated when the issue closed**: `issue-tracking.md` § "Ticking an acceptance criterion" — "When a comment supersedes an acceptance criterion, edit the body in the same action"; blindspot 27.

### AC-47-3: The state icon distinguishes "not set yet" from "there is a problem", or the page explains what the icon means.

**Source:** #47, box 3 (**unticked**, issue closed)
**Verdict:** PASS ✓ (code-read; the not-set glyph itself is not in any frame)

**Evidence:** `:7204` `ok ? _U("  ") : _U("  ")` — check-circle when set, empty circle (FontAwesome `circle-o`) when not, no warning triangle; the comment at `:7195-7200` records the reasoning. `` is the same glyph `GameNameFormatter.cpp:24` ships as its `SPINNER`, so it is in `fontawesome-webfont.ttf` and renders.

**Refutation attempted:** looked for a frame showing the empty circle — none: both frames show a guest that was online and had a root password, so both rows carry check-circles. The claim "empty circle when not" in the closing comment is read from the code, not observed. Recorded as a gap in the frames, not in the code.

### AC-47-4: Pressing LATER leaves the player knowing the page will return and where to find it on demand.

**Source:** #47, box 4 (**unticked**, issue closed)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** `:7325-7328` a non-selectable row `LATER KEEPS THIS LIST` / "IT COMES BACK NEXT TIME YOU START UP, OR FIND IT IN NETWORK SETTINGS > FINISH RESTORE PROCESS."; `:7335` LATER leaves the marker, FINISH removes it (`consumeMarker`). Frame `finish-restore-process-no-cloud-bottom.png` shows the row above the two buttons. The path it names exists: `GuiMenu.cpp:9027-9033` adds `FINISH RESTORE PROCESS` under NETWORK SETTINGS > RESTORE while the marker exists (uncached read, `613f6152b`).

**Refutation attempted:** the row is placed where a player reads it *before* pressing — under the list, not in a confirmation — acceptable for a page with no confirmation dialog (es-player-text: "a row with no confirmation has nowhere to move a line to"). The three-line wrap is AC-47-2's gap.

### AC-47-5: Reviewed on a small handheld panel, not only in a VM — see the related `GuiMsgBox` sizing issue.

**Source:** #47, box 5 (**unticked**, issue closed)
**Verdict:** FAIL ✗ (not done, and the issue was closed anyway)

**Evidence:** the three #47 frames are guest b at 1280x800 (`docs/qa-frames/2026-09-13/README.md`, rows 5-7); no `finish-restore-process-*640x480*` frame exists; no handheld was used on 2026-09-13 (work log 06:40: "the maintainer's handhelds have not been touched tonight"). Guest d at 640x480 was up the same hour for #27's frames. Blindspot 41, written that day, is the rule this criterion states.

**Gaps:** a 640x480 frame of the page (both halves), and the fix for whatever it shows — the two three-line rows above are the first candidates; then the body ticked or the issue reopened.

---

## #27 — ES savestate manager: 'START NEW GAME/AUTO SAVE' labels truncate

### AC-27-1: Both free-slot tiles show their full text at default theme/resolution; slot tiles keep their two lines; verified visually in the GENERIC_X64 VM at 1280×800 and a handheld-typical 640×480.

**Source:** #27, box 1 (ticked: ES `7c935a39d`, image `db6b42c180`)
**Verdict:** PASS ✓ (code-read + frames at both sizes)

**Evidence:** `GuiSaveState.cpp:16` sheet 0.55; `:71-74` rasterise ASCII 32-126 before measuring (`Font::getHeight` is the tallest glyph *so far*); `:96-100` ask for `getSize() / fontScale()` so the tile's `Font::get` does not scale twice; `:101-110` shrink the label font where today's date would exceed 0.86 of the tile; `:111-118` two full lines of that font as the label share, clamped 0.30-0.50; `:149` `<multiLine>true</multiLine>`, honoured by `GridTextProperties::applyTheme` (`GridTileComponent.cpp:700-701`) and applied in `GridTileComponent.h:108-115`. Frames opened: `save-state-manager-four-tiles-640x480-db6b42c180.png` — START NEW GAME whole on one line, AUTO SAVE / SLOT 1 / SLOT 2 each with a date inside its tile, no ellipsis, no run-together dates; `save-state-manager-four-tiles-1280x800-db6b42c180.png` — the same four tiles whole; `save-state-manager-after-last-delete-help-bar.png` — START NEW AUTO SAVE whole at 1280x800.

**Refutation attempted:** START NEW AUTO SAVE at 640x480 — the README names `save-state-manager-after-delete-640x480-db6b42c180.png` as showing it whole; not opened here, and the four-tile frame has an AUTO SAVE so that tile is absent from it — the 640x480 proof of the *longer* free-slot label rests on that one un-opened frame (recorded in Coverage). The "widest line" is today's date (`Utils::Time::DateTime::now()`), so a locale whose date string is wider than today's is not measured — proportional digits differ by a pixel or two; the 0.86 factor leaves the margin. A six-column grid at 640x480 (`slots = 6`) puts tiles at ~100 px, where the shrink fires harder; the frames show four tiles because the fixture had two states — not a failing input, a narrower case not framed.

### AC-27-2: No `.po` changes required.

**Source:** #27, box 2 (ticked)
**Verdict:** PASS ✓ (code-read)

**Evidence:** the range's `.po` diff adds 14 new fork msgids to `fr` only; `START NEW GAME` and `START NEW AUTO SAVE` are untouched as msgids (`GuiSaveState.cpp:220-224` still pass `_("START NEW GAME")`, `_("START NEW AUTO SAVE")`).

---

## #149 — Save state manager: no help bar at all on a 640x480 panel (full-screen menus)

### AC-149-1: On a 640x480 guest the manager shows BACK / LAUNCH under the tiles, and BACK / DELETE / COPY TO FREE SLOT / LAUNCH with a slot focused (frames).

**Source:** #149, box 1 (ticked: `db6b42c180`, guest d)
**Verdict:** PASS ✓ (code-read + frames)

**Evidence:** `GuiSaveState.cpp:288-301` `render()` calls `mWindow->renderHelpPromptsEarly(parentTrans)` when the page is top and `fullScreenMenus()` is on, into the row `onSizeChanged`/`helpRowPerc` reserves; `Window.cpp:982-986` draws the prompts and sets `mRenderedHelpPrompts`, which `Window::render` (`:727`) checks before its own draw. Frames opened: `…four-tiles-640x480-db6b42c180.png` → `BACK LAUNCH`; `…slot-focused-640x480-db6b42c180.png` → `BACK DELETE COPY TO FREE SLOT LAUNCH`.

**Refutation attempted:** a `GuiMsgBox` (delete confirmation) on top of the manager — the manager is no longer top, draws nothing, and `Window::render` draws no help for a third page under full-screen menus, so the dialog's own YES/NO prompts are absent at 640x480. Pre-existing for every dialog on small panels, not this range's regression; noted in Phase 3.

### AC-149-2: At 1280x800 the bar is drawn once, not twice (frame).

**Source:** #149, box 2 (ticked)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** at 1280x800 `fullScreenMenus()` is off, the `render()` branch does not fire, and `Window::render` draws once; frame `save-state-manager-four-tiles-1280x800-db6b42c180.png` shows one bar. Even were both to fire, `mRenderedHelpPrompts` suppresses the second draw for the frame.

---

## #66 — ES: ScreenScraper login failure shows the API's raw French text and blames the account

### AC-66-1: Why it is French, and why it blames the account, is identified and recorded.

**Source:** #66, box 1 (ticked, with the diagnosis inline)
**Verdict:** PASS ✓ (code-read)

**Evidence:** pre-change `ScreenScraper.cpp` (`git diff` old side, `:975-976`): `result = httpreq.getErrorMsg()` — the API body verbatim. The tick's account of the two endpoints' wording matches the comment now at `:966-976` and the probe's premise.

### AC-66-2: A login failure at scrape start shows an English message, and the API's body goes to the log only — never to the screen, for any error.

**Source:** #66, box 2 (ticked: ES `f33fa23ac`, image `697aa68e29`, frame)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** `ScreenScraper.cpp:976-1035` `screenScraperFailureMessage`: `LOG(LogError) … body` (`:980`), then every return is a `_()` string; `getThreadCount` (`:1037-1046`) returns only that. The `default:` branch returns `SCREENSCRAPER ANSWERED WITH AN ERROR. TRY AGAIN LATER.` for any status whose body names neither *identifiant*/*login* nor *maintenance*/*ferm* — the body never reaches `result`. Frame `screenscraper-rejected-developer-pair-english.png` (640x480, opened): `AN ERROR OCCURRED : SCREENSCRAPER REJECTED THE DEVELOPER ID OR PASSWORD. CHECK THEM UNDER SCRAPER > OPTIONS.` — two lines, fits the panel.

**Refutation attempted:** every `case` and the `default` return `_()` text; the only non-`_()` data used is the body's lowercase for branching. Enum names checked in `HttpReq.h:90-99` (`REQ_426_SERVERMAINTENANCE = 423` etc. — upstream's names, ScreenScraper's codes). The 401 line "OPEN TO ITS MEMBERS ONLY" matches ScreenScraper's documented 401. No path puts the body on screen.

### AC-66-3: With a wrong developer pair (any account, or none) the message names the developer pair and SCRAPER > OPTIONS; the pair-only probe runs only after a login failure.

**Source:** #66, box 3 (ticked)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** the probe (`:1023-1030`) sits after the `switch` inside the failure function, so a scrape that starts makes no extra request; `pairOk` requires `REQ_SUCCESS` **and** a body beginning `<?xml` — fail-closed (a 200 with a French sentence is "rejected"). The frame above is the bogus-pair/no-account case; `screenscraper-rejected-pair-with-real-account.png` is named for the bogus-pair/real-account case (not opened).

**Refutation attempted:** with **no account and a bad pair** the account check (`:1019-1020`) fires first and says NEEDS YOUR ACCOUNT rather than blaming the pair — the criterion says "any account, or none" should name the pair. The `5e7245b51` ordering chose the account message first because a valid pair alone is refused everything anyway (work log 12:40), so a player with neither is told the thing they must add first. A defensible reading, and the frame proves the pair message with a bogus pair when an account is present — but the criterion's "or none" is not literally met. Noted; not graded down (the message is true and actionable in that state).

### AC-66-4: With a valid pair and a wrong account password it names the account and SCRAPER > ACCOUNTS.

**Source:** #66, box 4 (ticked: the public JELOS pair beside a made-up account, frame)
**Verdict:** PASS ✓ (code-read; frame named, not opened)

**Evidence:** `pairOk` true → `SCREENSCRAPER REJECTED YOUR USERNAME OR PASSWORD.\nCHECK THEM UNDER SCRAPER > ACCOUNTS.`; the tab names exist as `_()` labels (`GuiScraperStart.cpp:16-20`: SCRAPER, SCRAPE / OPTIONS / ACCOUNTS). Frame `screenscraper-rejected-account-english.png` exists (not opened).

### AC-66-5: Both cases on the GENERIC_X64 VM with a ScreenScraper test account.

**Source:** #66, box 5 (ticked: the maintainer's QA account and the public JELOS pair via `tools/qa-accounts`; the success path framed)
**Verdict:** PASS ✓ (frames named; `tools/qa-accounts` read)

**Evidence:** frames `scraper-running-with-account-and-pair.png`, `scraper-finished-with-account-and-pair.png` exist; `tools/qa-accounts` writes the ScreenScraper lines over ssh stdin and reads the names back (`:71-82`), printing names only.

**Refutation attempted:** none of the credential values appears in any artifact I read (work log, frames' README, tool output) — the `qa-accounts` report prints names. The French frame `screenscraper-rejected-developer-pair-french.png` (opened): `SCREENSCRAPER A REFUSÉ L’IDENTIFIANT OU LE MOT DE PASSE DÉVELOPPEUR. VÉRIFIEZ-LES DANS SCRAPEUR > OPTIONS.` with the menu itself in French — D-UI-051 observed.

### AC-66-6: Both cases observed on the H700.

**Source:** #66, box 6 (unticked)
**Verdict:** SKIP ○ — handheld; tracked on #66.

---

## #67 — ES: scraper SCRAPE-tab filters reset on every tab switch and every visit

(Code from ES `3e7195eb9`, 2026-09-05, outside the range; this range pressed it.)

### AC-67-1: Set GAMES TO SCRAPE FOR to ALL, switch to OPTIONS and back: it still reads ALL.

**Source:** #67, box 1 (ticked: guest b, frame)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** `GuiScraperStart.cpp:92` reads `ScraperFilter`, `:106` writes it on change (inside the selection callback, so a tab switch's `save(); clearSaveFuncs(); mMenu.clear()` cannot lose it); default `missing-any` in `Settings.cpp:224`. Frame `scraper-games-to-scrape-for-all-after-tab-switch.png` exists (not opened); `scraper-reopened-all-and-no-kept.png` (opened) shows ALL and NO after a reopen, which subsumes the tab switch.

### AC-67-2: Set IGNORE RECENTLY SCRAPED GAMES to NO, leave the scraper entirely, reopen it from the main menu: it still reads NO.

**Source:** #67, box 2 (ticked)
**Verdict:** PASS ✓ (code-read + frame)

**Evidence:** `:121` reads `RecentlyScrappedFilter` (upstream's declared-but-unread key, default 3 in `Settings.cpp:223`), `:138` writes it on change. Frame `scraper-reopened-all-and-no-kept.png` (opened): `GAMES TO SCRAPE FOR ◁ ALL ▷`, `IGNORE RECENTLY SCRAPED GAMES ◁ NO ▷`.

### AC-67-3: Deselect two systems, leave, reopen from the main menu: the same two are deselected.

**Source:** #67, box 3 (unticked)
**Verdict:** SKIP ○ — needs three platform systems on a guest (work log 09:10); the code path exists (`:166-208`, `ScraperSystems`); tracked on #67.

### AC-67-4: Open the scraper from a game list: only that system is selected, as today.

**Source:** #67, box 4 (unticked)
**Verdict:** SKIP ○ — not pressed; tracked on #67.

### AC-67-5: A fresh install shows today's defaults (GAMES MISSING ANY MEDIA, LAST 15 DAYS, all systems).

**Source:** #67, box 5 (ticked: `scraper-scrape-tab-fresh-defaults.png`)
**Verdict:** PASS ✓ (code-read; frame named)

**Evidence:** `Settings.cpp:223-225` defaults `3`, `missing-any`, `""` (empty = the default set); the fresh guest's frame is named in the tick (not opened).

### AC-67-6: A device upgraded from an image without these keys shows the same defaults, no prompt.

**Source:** #67, box 6 (ticked)
**Verdict:** PASS ✓ (code-read)

**Evidence:** a missing key reads as its `Settings.cpp` default — the same three values; nothing asks (`upgrade-and-install.md` § "An upgrade should be invisible", read both / write new). `RecentlyScrappedFilter` was already declared upstream, so an upgraded device may carry a stored value it never chose — it was written by no one, so it is the default.

### AC-67-7: SCRAPE NOW uses the shown values — verified by a scrape that would differ.

**Source:** #67, box 7 (unticked)
**Verdict:** SKIP ○ — not observed (needs an account and a scrape that would differ); the success-path scrape for #66 ran with the filters' values but was not designed to tell them apart. Tracked on #67.

### AC-67-8: Observed on the H700 by pressing, not by reading the code.

**Source:** #67, box 8 (unticked)
**Verdict:** SKIP ○ — handheld; tracked.

---

## #68 — ES: RetroAchievements menu pages fail with 401 on fork builds

(Code from ES `2bdb5d0e7`, 2026-09-05, outside the range; pressed in this range with the maintainer's QA account.)

### AC-68-1: With the key entered, RETROACHIEVEMENTS from the main menu opens the summary page for the account.

**Source:** #68, box 1 (ticked: guest b, `947072a988`, frame)
**Verdict:** PASS ✓ (code-read; frame named)

**Evidence:** `RetroAchievements.cpp:134-141` `getApiLogin()` returns `z=<user>&y=<key>` from SystemConf under `#ifndef CHEEVOS_DEV_LOGIN`; `:167`, `:180` use it; frame `retroachievements-summary-with-key.png` exists (not opened — it shows an account name; the frame is the maintainer's to share).

### AC-68-2: With the key entered, RETROACHIEVEMENTS from a game's context menu opens that game's progress page.

**Source:** #68, box 2 (ticked, frame)
**Verdict:** PASS ✓ (frame named; code-read)

**Evidence:** `:256`, `:336`, `:454` — the `#ifndef` early return is gone; an empty login returns an error the page shows. Frame `retroachievements-game-progress-with-key.png` exists.

### AC-68-3: With the key empty, either entry shows an English message naming WEB API KEY and RETROACHIEVEMENTS SETTINGS; no 401 body reaches the screen.

**Source:** #68, box 3 (ticked: frame)
**Verdict:** PASS ✓ (frame opened + code-read)

**Evidence:** frame `retroachievements-needs-web-api-key.png` (1280x800): `RETROACHIEVEMENTS NEEDS YOUR WEB API KEY. ENTER IT UNDER RETROACHIEVEMENTS SETTINGS, NEXT TO YOUR PASSWORD.`; the menu label `RETROACHIEVEMENTS SETTINGS` exists (`GuiMenu.cpp:2700`, `:5085`); the French for it in the `.po` is `PARAMÈTRES RETROACHIEVEMENTS`, the file's own translation of that label (`emulationstation2.po:301`).

**Refutation attempted:** the context-menu entry takes `getApiLogin()` too (`:336`) — the tick says so and the code agrees. Not framed from the context menu; the code path is shared.

### AC-68-4: `backuptool backup` leaves neither the password nor the key in the archive; the restore credential page lists the key.

**Source:** #68, box 4 (ticked: guest b with a throwaway key and password)
**Verdict:** PASS ✓ (code-read; guest run cited)

**Evidence:** `backuptool:377` `sed -E '/^[^#]*\.(key|password|token)=/d'` on the archived `system.cfg` — `global.retroachievements.key=` and `.password=` both match; `GuiMenu.cpp:7254-7256` adds the WEB API KEY row on the FINISH RESTORE PROCESS page under `#ifndef CHEEVOS_DEV_LOGIN`; case b in `last-good-scripts-test` proves the wifi key is stripped by the same sed (`PASS with the wifi key stripped`).

**Refutation attempted:** a key stored under another name would escape — the code writes exactly `global.retroachievements.key` (`GuiMenu.cpp:7256`, `RetroAchievements.cpp:140`; `tools/qa-accounts:47` uses the same). The issue's proposed name `apikey` is not what shipped; every writer agrees on `.key`.

### AC-68-5: `strings` on the built ES shows no `z=…&y=` fragment; an upstream-style build with `CHEEVOS_DEV_LOGIN` set shows no WEB API KEY row.

**Source:** #68, box 5 (ticked)
**Verdict:** PASS ✓ (check-run for the first half; code-read for the second)

**Evidence:** `strings image/system/usr/bin/emulationstation | grep -cE 'z=[^&]+&y='` on the x64 tree (`519f40aa0c`, built 05:33): **0**; the new #66 string is present (1) so the binary is the range's. Second half by construction: both rows sit under `#ifndef CHEEVOS_DEV_LOGIN` (`GuiMenu.cpp:7254`, and the settings page's row per the issue); not built here, as the tick says.

### AC-68-6: Observed on the H700.

**Source:** #68, box 6 (unticked)
**Verdict:** SKIP ○ — handheld; tracked.

---

## #69 — theme: Tools entries lose their icons when GAME ARTWORK is Boxart or Logo

(Patch `638eedc5b3`, 2026-09-05, outside the range; pressed in this range.)

### AC-69-1: GAME ARTWORK = Boxart: Tools entries show their icons; a scraped game still shows its box art.

**Source:** #69, box 1 (ticked: guest d, 640x480, frames)
**Verdict:** PASS ✓ (patch read + frame)

**Evidence:** `patches/001-tools-always-show-image.patch` adds `<path if="${system.theme} == 'tools'">{game:image}</path>` after the three artwork-mode paths in `theme.xml`. Frame `tools-list-boxart-icons.png` (640x480, opened): File Manager's icon drawn on the right panel. `nes-list-boxart-game-thumbnail.png` exists for the game half (not opened).

**Refutation attempted:** a later `<path>` wins in ES theme evaluation when its `if` holds — the patch relies on ordering; the frames at all three modes (below) are the proof. A system whose theme name is not `tools` but is tools-like (none shipped) would not be covered — the criterion is tools only.

### AC-69-2: GAME ARTWORK = Logo: Tools entries show their icons.

**Source:** #69, box 2 (ticked: `tools-list-logo-icons.png`)
**Verdict:** PASS ✓ (frame named; patch read)

### AC-69-3: GAME ARTWORK = Image / Image (Cropped): unchanged.

**Source:** #69, box 3 (ticked: `tools-list-image-icons.png`)
**Verdict:** PASS ✓ (frame named; the patch's path resolves to the same `{game:image}` those modes already used)

### AC-69-4: Observed on the GENERIC_X64 VM by `tools/vm-visual-qa` frames.

**Source:** #69, box 4 (ticked)
**Verdict:** PASS ✓ (three frames exist under `docs/qa-frames/2026-09-13/`)

### AC-69-5: Observed on the H700 by switching the option and looking.

**Source:** #69, box 5 (unticked)
**Verdict:** SKIP ○ — handheld; tracked.

### AC-69-6: Patch offered upstream to the theme repository (link in a comment).

**Source:** #69, box 6 (unticked)
**Verdict:** SKIP ○ — an outward-facing PR, the maintainer's (work log 09:10); tracked.

---

## #82 — Screenshots taken during a session do not appear in the image viewer until UPDATE GAMELISTS

(Code from ES `b09ca9409`, outside the range; pressed in this range.)

### AC-82-1: Take a screenshot in a game, exit: the SCREENSHOTS list shows it without UPDATE GAMELISTS.

**Source:** #82, box 1 (ticked: guest b, frame)
**Verdict:** PASS ✓ (code-read; frame named)

**Evidence:** `FileData.cpp:877` `window->postToUiThread([] { SystemData::rescanChangedFolders(); })` after a game exits; `SystemData.cpp:340` `rescanChangedFolders()` (+48 lines in `b09ca9409`). Frame `screenshots-list-after-game-exit.png` exists (not opened).

### AC-82-2: RESTORE SAVES FROM THE CLOUD that brings new screenshots: listed afterwards without UPDATE GAMELISTS.

**Source:** #82, box 2 (ticked, with the note that the rescan is posted when the page is dismissed)
**Verdict:** PASS ✓ (code-read; frame named)

**Evidence:** `GuiCloudTransfer.cpp:234-241` posts the rescan when the page closes (the tick's own caveat matches the code). Frame `screenshots-list-after-cloud-restore.png` exists.

**Refutation attempted:** the work-log note (03:50) — "a system with no games at boot is never created, so a device whose screenshots folder is empty at boot has no SCREENSHOTS entry to refresh; its first screenshot appears at the next boot" — is a real limit of the criterion as met, recorded on #82 as a note and not filed. It is the fresh-device case (`upgrade-and-install.md`'s second question). Carried to Phase 3 as an observation for the punch list's tracked-scope section.

### AC-82-3: Verified on the GENERIC_X64 VM by frame.

**Source:** #82, box 3 (ticked)
**Verdict:** PASS ✓ (both frames exist)

### AC-82-4: Then on a handheld.

**Source:** #82, box 4 (unticked)
**Verdict:** SKIP ○ — per-device yes; tracked.

---

## #113 — cloud sync: ten low-level retries hold a run for five minutes against a server that keeps erroring

### AC-113-1: The worst-case duration of a run against a persistently-erroring endpoint is known and written down.

**Source:** #113, box 1 (ticked 2026-09-10: "303 s (LINK5 …); a dead link is 30 s (LINK1-7, exit 69). Both in `docs/vm-qa-log.md` (2026-09-10 rows for `e73efbc8e0`)")
**Verdict:** PASS ✓ for the criterion (the numbers are written down — in the issue); the tick's citation is wrong

**Evidence:** `grep -c '\b303\b' docs/vm-qa-log.md` → **0**; no row names `e73efbc8e0`. Row 32 (2026-09-10, `d574edf975`) has "exit 69 ~30 s after the cut"; row 50 (2026-09-12, `205b80c8cf`) has "stalled endpoint 20.8 s (was 320.9)", "refused port 12.0 s", "3.9 s". The 303 s LINK5 figure exists only in #113's body.

**Refutation attempted:** searched the whole QA log for `303`, `e73efbc8e0`, `LINK5` — the only LINK5 row is 2026-09-13's (`db6b42c180`, 29.5 s). A record cited as the home of a number that is not in it is blindspot 13's shape in miniature; Low.

### AC-113-2: Whatever bound is chosen, LINK1-7 still end within ~30 s of a cut.

**Source:** #113, box 2 (ticked 2026-09-13: 65 PASS on LINK1-4, 6, 7; LINK5 29.5 s after the cut, exit 69, once the fixture padded the archive — `cc2a9bfd3a`)
**Verdict:** PASS ✓ (code-read; run cited in the QA log)

**Evidence:** `tools/cloud-round-trip:5318-5330` (`bedc51992d`): `fx_link5` writes 12 MiB of random bytes to `/storage/.config/retroarch/link5-padding.bin` before `backuptool backup` and removes it in a `finally` — a default location with no `/usr/config` twin, so #45's identity prune keeps it and the upload is long enough to cut; `:5245-5253` (`cc2a9bfd3a`) SKIPs the post-re-run content match under the QA WebDAV stale-PUT lock with its reason printed. QA log row 58 (`db6b42c180`): "LINK5 alone PASS (29.5 s after the cut, exit 69, marker unchanged; the WebDAV lock's two faces SKIPped)".

**Refutation attempted:** the SKIP is a check that can no longer fail on WebDAV — by design, with the reason and the instruction to assert on MinIO/S3 printed (the same disposition as the line above it). A fixture that pads the archive proves the cut lands; it does not re-prove the 303 s case (that was the *un*bounded run, now bounded by D-CLOUD-118/121). The cell is not re-runnable under this audit's constraints (it drives a guest and the QA endpoint).

### AC-113-3: A Dropbox backup that replaces several saves still completes under five low-level retries (the maintainer's device).

**Source:** #113, box 3 (unticked)
**Verdict:** SKIP ○ — the maintainer's device and cloud, per-device yes (D-CLOUD-121); tracked on #113.

### AC-113-4: The QA log records both numbers.

**Source:** #113, box 4 (ticked 2026-09-12)
**Verdict:** PARTIAL ⚠ (the "after" numbers and the dead-link 30 s are in rows 32, 50, 58; the 303 s "before" figure is not in the QA log)

**Gaps:** one sentence in the 2026-09-10 or 2026-09-13 row naming the 303 s measurement, or the tick reworded to say where the number lives.

---

## #129 — Code audit of the cloud-saves work since the last audit (#60)

### AC-129-1: An audit report under `docs/` naming every finding with a severity and the file:line it anchors to.

**Source:** #129, box 1 (ticked)
**Verdict:** PASS ✓ (check-run)

**Evidence:** `tools/lint-audit-artifacts docs/audits/2026_09_12-milestone-cloud-saves-since-60 --issue 129` → PASS (re-run 06:10 UTC); the folder holds the six files; `05-punch-list.md` declares PL-01..PL-12 each with severity and a `file:line`.

### AC-129-2: Every finding of severity high or above has an issue with acceptance criteria.

**Source:** #129, box 2 (ticked: #144, #145, #146)
**Verdict:** PASS ✓ (tracker read as corroboration of the punch list's own text)

**Evidence:** #144, #145, #146 exist and are CLOSED (read 06:10 UTC); the punch list's Phase 7 table names each with "four acceptance criteria".

### AC-129-3: The decision register is checked against the code for every row cited in the pass.

**Source:** #129, box 3 (ticked)
**Verdict:** PASS ✓ (the prior audit's `04-analysis.md` § "Register check" exists; not re-derived — that is #129's scope, not this one's)

**Punch list state:** PL-01..PL-05, PL-08..PL-12 ticked with commits; **PL-06** (an exit sync ES declines to start reports nothing, `FileData.cpp:904`) and **PL-07** (rocknix.org docs, #42 OPEN, milestone "Stable before upstream") remain open. `FileData.cpp` is untouched in this ES range (`git diff --stat` lists no `FileData.cpp`), so PL-06 stands as it was. Both go to the punch list's tracked-scope section, not as new items.

---

## Register rows the range wrote

Each row is checked against the code and the shipped image, as #129's criterion 3 did for its rows.

| Row | Claim (operative part) | Verdict | Evidence |
| --- | --- | --- | --- |
| D-CLOUD-008 | the settings archive carries nothing the image ships; **a restore skips those two prefixes from any archive** | PARTIAL ⚠ | backup side and tar restore: `backuptool:258-297`, `:574-577`, case k. **Zip restore does not skip them** (`:578-600`; AC-45-4) — "any archive" over-claims for pre-2026-08-26 archives |
| D-CLOUD-123 | a folder a listing could not read is judged by its nearest listable parent; the content backup makes each folder before copying | PASS ✓ | `cloud_content_restore:325-340`, `:894-897`, `:909-912`; `cloud_setup:127-198`; `cloud_content_backup:564`; case l (11 checks) |
| D-NET-002 | shipped family name becomes `<FAMILY>-<4 hex>` once, written back; a player's name never touched; a reflash gives the same name | PASS ✓ with a caveat | guests 3/3, case m; the reflash clause rests on the id being adapter-derived at the first boot's ~2 s, now the first call (AC-50-3) |
| D-NET-003 | `avahi-daemon.service` enabled, **ordered after `network-base.service`** so it publishes the unit's own name; `network-base-setup` no longer calls `avahi-set-host-name`; **`avahi.disabled` still turns it off** | FAIL ✗ | enabled: yes; ordering: **not in the shipped unit** (stock avahi unit ships; `01-research-notes.md` § 1.3f); guest b publishes `ROCKNIX.local` while named `GENERIC-X64-0964`; off-switch: the shipped unit has no condition, and even the fork's unit's condition is inert once `avahi.conf` exists (every booted device) |
| D-UI-050 | sheet 0.55; label two lines of the small font, share 0.30-0.50, wrap forced; font shrinks where a date exceeds 0.86 of the tile; the page draws help prompts itself under full-screen menus | PASS ✓ | `GuiSaveState.cpp:16`, `:71-118`, `:149`, `:288-301`; frames at both sizes |
| D-UI-051 | a fork string ships in English and French, keyed by `system.language`; msgid byte-identical to the source | PASS ✓ | 14/14 msgids match the sources; the French frame at 640x480; the path words match the `.po`'s own translations of SCRAPER / ACCOUNTS / OPTIONS / RETROACHIEVEMENTS SETTINGS |
| D-WORKFLOW-010 | ES fork carries a pointer `CLAUDE.md` and a `.githooks/pre-push` guard; `core.hooksPath` absolute in the ES clone | PASS ✓ | both files at `3466b36af7`; `core.hooksPath` = `~/Development/emulationstation-next.worktrees/qa-integration/.githooks`, `ls` lists `pre-push`. Nits: `CLAUDE.md` says the checks "all run from the distribution checkout" though `tests/cloud-oauth-lifetime.py` lives in the ES tree; `pre-push:5` says `upstream/next` where the code uses `upstream/master` |
| D-WORKFLOW-013 | the mis-keyed row corrected in place; `tools/register-check` refuses a duplicate ID or a dangling citation | PASS ✓ | `register-check` clean on the tree (233 IDs); **proven to fire** on a scratch copy: a duplicated `D-NET-002` → `DUPLICATE … FAILED` exit 1; a `D-CLOUD-999` citation → `MISSING … FAILED` exit 1. Limits found: a citation in an unlisted area (`D-THEME-001`) and a four-digit ID (`D-CLOUD-1234`, read as `D-CLOUD-123`) pass silently |
| D-WORKFLOW-014 | rocknix.org docs (#42) are the last step before the upstream PR | PASS ✓ (process) | #42 OPEN on the milestone; consistent with #129 PL-07 open |
| D-QA-016 | no new QA device now; the RG35XX SP becomes the testing handheld after the H700 round | PASS ✓ (process) | no handheld touched in the range (work log 06:40); consistent |

---

## Forward Audit Summary

| Verdict | Count | Criteria |
| --- | --- | --- |
| PASS ✓ | 41 | AC-45-1, -2, -5, -6; AC-142-1, -2, -3; AC-50-1, -4, -5; AC-93-1, -2; AC-47-1, -3, -4; AC-27-1, -2; AC-149-1, -2; AC-66-1..5; AC-67-1, -2, -5, -6; AC-68-1..5; AC-69-1..4; AC-82-1, -2, -3; AC-113-1, -2; AC-129-1, -2, -3 |
| PARTIAL ⚠ | 4 | AC-45-4 (zip branch), AC-50-3 (reflash identity fragility), AC-47-2 (three-line rows, body not updated), AC-113-4 (303 s not in the QA log) |
| FAIL ✗ | 2 | AC-50-6 (mDNS ordering not shipped; wrong name published), AC-47-5 (small-panel review not done, issue closed) |
| SKIP ○ | 17 | AC-45-3; AC-50-2, -7; AC-66-6; AC-67-3, -4, -7, -8; AC-68-6; AC-69-5, -6; AC-82-4; AC-113-3 — all unticked in their issues, all handheld/LAN/maintainer-owned or explicitly not yet pressed; none silently |
| UNTESTABLE ? | 1 | AC-142-4 (a harness run this audit may not make) |

65 criteria. **Decidable (excluding SKIP and UNTESTABLE): 47; fully met: 41 (87%).** Register rows: 10 checked — 7 hold, 1 holds with a caveat (D-NET-002), 1 over-claims (D-CLOUD-008), 1 does not hold as shipped (D-NET-003).

**Overall assessment: PASS WITH FINDINGS.** Every code change in the range does what its commit says on the host and on the VM, and the mechanical checks are green. Two things it says are not in the image: the mDNS ordering and off-switch (D-NET-003, AC-50-6), because the fork's avahi recipe never removes the stock units; and the "any archive" half of D-CLOUD-008. One thing it did is newly fragile on a handheld: the device identity is now first computed at ~2 s of the first boot by a unit that cannot see whether the adapter exists. One issue (#47) was closed against its own checklist.

## Coverage Boundary

**Examined, with depth:**
- *check-run*: `last-good-scripts-test` (current and `--old` at `53f390b1e9`), `register-check` (tree + scratch fire test), `vocabulary-check`, `pkgcheck` ×5, `bash -n` ×11, `py_compile` ×3, `lint-audit-artifacts --issue 129`, `strings` on the built ES, `md5` of the guests' MACs vs their ids.
- *guest-read* (a, b, d on `519f40aa0c`; ssh, filtered, no writes): hostnames, id files, `ethtool -P`, machine-id length, monotonic journals for `machine-id`/`network-base`/`avahi`/`hostnamed`/`NetworkManager`, `systemctl show` of the three units, the shipped unit file text.
- *image-tree read* (x64 `519f40aa0c`, H700 `59103cd9cb`): busybox applet links, `ethtool`, `cloud_device_id`, the avahi and network-base units, the `.wants` symlinks, `os-release`.
- *code-read*: every changed line in both diffs; the surrounding functions (`backuptool` restore, `cloud_device_id` whole, `openRestoreRelink` whole, `screenScraperFailureMessage`, `GuiSaveState` constructor/render, `Window::renderHelpPromptsEarly`, `GuiComponent::updateHelpPrompts`, `GuiScraperStart` filter reads/writes, `RetroAchievements::getApiLogin`, `SystemData::rescanChangedFolders` call sites, both avahi recipes, `scripts/install`).
- *frame*: 12 PNGs opened (the four save-state frames at 640x480/1280x800, the three FINISH RESTORE frames, the English and French ScreenScraper dialogs, the RA needs-key dialog, Tools under Boxart, the scraper reopened); 21 more named from README/issues and their existence checked.

**Deliberately not examined:** any handheld (D-QA-015; none was touched); the real cloud accounts; `tools/cloud-round-trip` and `tools/vm-visual-qa` runs (they write to guests and the QA endpoint — read-only here); the `docs/` commits in the range (personal overlay, outside the frozen code scope, read only as evidence); #67/#68/#69/#82's implementing commits' internals beyond the call sites the criteria name (they predate the range); the ES `tests/` directory (not changed in the range; #144 CLOSED).

**Dimensions not exercised:** runtime behaviour on a handheld (the L12 timing question, the LAN mDNS test, the 640x480 FINISH RESTORE page); the FTP 100/100 cell; performance beyond the QA-log numbers; security beyond the credential strip and the `qa-accounts` quoting path (read, not executed).

---

## Prior-verdict cross-check (Phase 2.5)

Opened only now: #129's `05-punch-list.md` Phase 7 table and its checklist ticks.

| Item | #129's recorded outcome | This audit's independent view | Agreement |
| --- | --- | --- | --- |
| PL-08 (`D-INFRA-008` twice) | Deferred → fixed 2026-09-13 by `b1fdf555ad` (D-WORKFLOW-013) | `register-check` clean, fires on a scratch duplicate; the two live citations say D-INFRA-010 (`GuiMenu.cpp:5895`, `cloud-sync-changelog.md:1830`) | agree; two pattern limits added |
| PL-06 (exit sync declined reports nothing) | Deferred → #129 checklist, #139 | `FileData.cpp` untouched in this range; still open | agree (tracked scope) |
| PL-07 (rocknix.org docs) | Deferred → #42 | #42 OPEN on the milestone; D-WORKFLOW-014 says last before the PR | agree (tracked scope) |
| PL-11 (two personal-path lists) | fixed `01143a23ef` | both lists carry `tools/register-check` and `tools/qa-accounts` added in this range — the fix held through two more additions | agree |
| PL-04/PL-12 (strings naming a control that does not exist; menu path written two ways) | fixed ES `db1005101` | this range adds fourteen strings; every menu path named in them (`SCRAPER > OPTIONS`, `SCRAPER > ACCOUNTS`, `RETROACHIEVEMENTS SETTINGS`, `NETWORK SETTINGS > FINISH RESTORE PROCESS`) exists as a `_()` label; one string says `UNDER OPTIONS` where its siblings say `SCRAPER > OPTIONS` (pre-range string, #64) | agree, with one residual of PL-12's shape |

No disagreement with a prior verdict. The one place a prior *tick* and this audit disagree is inside this range, not #129's: #50 box 6 and the D-NET-003 row.

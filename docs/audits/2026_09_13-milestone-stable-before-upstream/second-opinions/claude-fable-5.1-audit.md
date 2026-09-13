# Second-opinion audit — ROCKNIX fork, work since audit #129 (2026-09-12 → 2026-09-13)

**Tier called: Milestone.** The scope crosses at least six epic boundaries (settings backup #45; cloud transport #142/#113; network identity #50; the save-state manager #27/#93/#149; the scraper/RA credential surfaces #66/#67/#68; QA/workflow tooling #129/#147). Per the method's tier table, the value is in the seams, and that is where the two highest findings below sit (backup ↔ per-unit hostname; the scraper's shipped message ↔ the claim its own QA tool makes). Everything below is derived from the diffs and rules in this document only; where a verdict needs a command I could not run, I say what command settles it.

**Trust posture.** Two ticked items are disproved by the diffs themselves (#66 "wrong pair … or none"; #45 "an older build's backup does not overwrite assets"). Under "one false tick voids the list", every sibling in #66 and #45 was re-derived from code rather than accepted, and the results are in §2.

---

## 1. Findings

### HIGH

**H-1 — The shipped code cannot show the developer-pair message when no account is set; the ticked AC says it does.**
`es-app/src/scrapers/ScreenScraper.cpp` ~L1010–1015 (`screenScraperFailureMessage`), the block starting `if (Settings::getInstance()->getString("ScreenScraperUser").empty() || …Pass…empty()) return _("SCREENSCRAPER NEEDS YOUR ACCOUNT TO SCRAPE…")`.
*What is wrong.* This early return precedes the pair-only probe. For a wrong pair and **no** account — the fork's own default, since it compiles no pair — the function returns "NEEDS YOUR ACCOUNT", never "REJECTED THE DEVELOPER ID OR PASSWORD". The AC "With a wrong developer pair (any account, or none) the message names the developer pair and SCRAPER > OPTIONS" is ticked with a frame from ES `f33fa23ac`; the pinned ES is `3466b36af`, and the .po ordering (that msgid is last) indicates the no-account branch was added after the frame was taken. The tick's evidence predates the code that ships.
*How it fails.* A player who mistyped their pair and has no account is told to add an account; they add one; the scrape still fails. Worse, the two comments in this push disagree on whether an account is needed at all: ScreenScraper.cpp says "the pair alone lists systems and is refused everything else", while `tools/qa-accounts` says "A pair alone is enough for a real scrape (anonymous quota)", and this same `switch` carries a 401 "OPEN TO ITS MEMBERS ONLY RIGHT NOW" case — a message that only makes sense if anonymous access normally exists. If the pair alone *can* scrape, "NEEDS YOUR ACCOUNT TO SCRAPE" is dialog text describing behaviour the backend does not have (es-player-text § Anti-patterns).
*Evidence that settles it.* On guest d: (a) valid public pair, no account, SCRAPE NOW — does it scrape? (b) bogus pair, no account — which sentence appears? Frame both at 640×480 from image built on `3466b36af`. Read the reply status/body in `es_log.txt` for (b).

**H-2 — Zip-era archives still extract PPSSPP assets and the shader cache over a newer image; D-CLOUD-008 and the ticked AC claim "any archive".**
`projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool` restore branch, ~L541–575. The `-X "${SKIP}"` skip-list is added only under `if [ "${ARCHIVE_KIND}" = "tar" ]`. The `else` (zip) branch changes only by deleting `SKIP=""`; its existing loop skips symlink entries and nothing else.
*What is wrong.* The script's own comment says zip archives are the older format ("Archives written before backups switched to regular files only…"), so "a backup taken on an older build" in the wild is very often a `.zip`, on the device and in the player's cloud. `upgrade-and-install.md` § "Fixing forward is not enough" is the exact rule: the tar-side skip helps only what the new writer produced or the recent tar writer wrote. D-CLOUD-008's "a restore skips those two prefixes from any archive" and the ticked AC are true for one of two formats. `last-good-scripts-test` case k builds only a `.tar.gz` fixture.
*How it fails.* Restore from an old zip on a newer image puts an older emulator's `assets/` and cache under a newer PPSSPP — the failure #45 exists to prevent.
*Evidence.* Build a pre-#45-shaped `.zip` (assets + cache + an ini) and `backuptool restore` it on the VM; `stat` the marked asset. Add a zip case beside k that fails against the current script.

**H-3 — The generated per-unit hostname travels in the settings archive, and the new rule then treats it as a name the player typed.**
Seam between `network-base-setup` L13–31 (the rename fires only when `RAW_HOSTNAME` equals `HW_DEVICE` or is empty) and `backuptool`/`cloud_restore`, which carry `system.cfg` (the #68 AC confirms system.cfg is archived with only the RA password/key removed).
*What is wrong.* Unit A boots as `H700-9a3f`, unit B as `H700-15ca`. Restore A's settings to B — the one-player-many-devices flow this project is built around — and B's `system.cfg` now says `system.hostname=H700-9a3f`. At B's next boot that name is not the family and not empty, so it is "the player's and is never touched". Both units are `H700-9a3f`, which is #50's collision, now permanent and unrepaired by the fix. Nothing in the diff excludes `system.hostname` from restore or recognises another unit's generated name.
*How it fails.* Exactly as #50 did — the router's lease flips, EHOSTUNREACH — but only after a cross-device restore, which is when nobody suspects the hostname.
*Evidence.* `grep -n 'hostname' backuptool cloud_restore` for a restore-side exclusion (if one exists this drops to Low and needs only a test). Otherwise on the pair: back up on a, restore on b, reboot b, run `tools/vm-qa --only pair-identity` — the new hostname check should fail. Fix options for the maintainer: treat `system.hostname` as per-unit and drop it from restore (like the passwords), or extend the rule so a name of the shape `<FAMILY>-[0-9a-f]{4}` whose suffix is not this unit's is also "shipped default of some unit" and re-derived. Check `cloud_device_id`'s own persistence in the same pass — if it lives under `/storage/.config` it travels the same way (#91's territory).

### MEDIUM

**M-1 — `cloud_device_id` is now called at a boot stage where a handheld's Wi-Fi MAC may not exist yet.**
`network-base-setup` L22–23; `network-base.service` is `DefaultDependencies=no`, `After=local-fs.target systemd-tmpfiles-setup.service userconfig.service`, now `Before=systemd-hostnamed.service NetworkManager.service`.
*What is wrong.* D-NET-002 rests on "seeded from the permanent hardware address, so a reflash gives the same name". At `local-fs.target` on an H700/RK35xx with an SDIO or USB Wi-Fi module loaded by udev coldplug, `/sys/class/net/wlan0` is plausibly absent. If `cloud_device_id` then falls back (or worse, seeds and *persists* a fallback id on a fresh flash), the suffix is not the MAC's — and the same id is what cloud sync uses to tell devices apart. The VM cannot show this: virtio-net is present from the first millisecond, which is why three guests proved nothing about ordering.
*How it fails.* Either no rename on first boot (`UNIT` empty — benign, retried next boot) or a stable-but-wrong id that changes on reflash, breaking both the "same after a reflash" promise and, if persisted, cloud device identity.
*Evidence.* Read `cloud_device_id`: what it reads, whether it writes a seed file. On a handheld, `journalctl -b -o short-monotonic | grep -E 'network-base|wlan0'` for the order. Compare `cloud_device_id` on a fresh flash against the MAC. This is on the untricked hardware AC's path; write it into that AC's evidence list so it is not forgotten.

**M-2 — The bucket-based guard in `syncpath_problem` fails open.**
`cloud_setup` ~L194–197: `if ! rclone backend features "${remote}" 2>/dev/null | grep -q '"BucketBased": true' && absent_not_broken …; then return 0`.
*What is wrong.* Any failure of `rclone backend features` (mis-typed remote, rclone missing, exotic backend, output format change) makes `grep -q` false, `!` true, and the remote is treated as path-based. `absent_not_broken` on a bucket remote then lists the root, finds no `badbucketname/`, returns 0, and the wizard accepts the path — the exact outcome the comment says it is avoiding ("store the name it rejected"). `engineering-practices.md` § "Guards must fail closed": prefer a positive assertion. Case l does not exercise this branch at all.
*Evidence.* Point `syncpath_problem` at an S3-style remote with `rclone` shimmed so `backend features` exits 1; expect refusal, observe acceptance. Fix: capture the features output, require it to parse, and take the provider's answer whenever bucket-ness is unknown.

**M-3 — Case m runs `network-base-setup` under the host's GNU tools, in the file that was rewritten to stop doing that.**
`tools/last-good-scripts-test` case m: `nbs()` binds `${M}/shim` (hostnamectl/logger/cloud_device_id stubs), not `${B}/shim` (the busybox applets), so `sed -n 's/^HW_DEVICE="\{0,1\}…'`, `tr -cd 'a-f0-9'`, `cut -c1-4`, `head -1` run as GNU.
*What is wrong.* `upgrade-and-install.md` § "And under the device's tools, not the host's" was written from this test's own history (blindspot 34: `tr` passed here and rejected every real `system.cfg`). Case k and the earlier cases go through `/shim`; case m regresses the discipline for the one script that runs at every boot on every device.
*How it fails.* Silently — a busybox difference in the BRE interval or `tr -c` would leave `UNIT` empty on the device while the host test passes.
*Evidence.* On a guest, `readlink -f $(command -v sed tr cut head)` and run the `FAMILY=`/`UNIT=` pipeline verbatim over `/etc/os-release` and a fixed id. Then bind `${B}/shim` first in case m's PATH.

**M-4 — `tools/register-check` is not run by anything and has no recorded failing run; D-WORKFLOW-013 says it "refuses" recurrence.**
The diff adds the tool and adds it to `.githooks/pre-push` only as a *personal-path pattern* — nothing invokes it (not the hook, not `tools/vm-qa`, not a CI step). The register was rekeyed in the same change, so the only duplicate it was written to catch is gone.
*What is wrong.* `engineering-practices.md`: "a suite is not wired in until it has been seen to FAIL once… The first PASS of anything new is the one to distrust." The decision's guarantee ("cannot recur unnoticed") describes a gate that does not exist.
*Evidence.* `tools/register-check` against `git show <pre-rekey>:docs/decision-register.md` should print `DUPLICATE D-INFRA-008`; record that output. Then wire it (pre-push on `next`, or a `vm-qa` host suite) so it runs.

**M-5 — A failing LINK5 assertion was converted to a SKIP, and the "65 PASS" tick includes that cell.**
`tools/cloud-round-trip` L5245–5254: `elif receiving and locked and archive_whole: print("    SKIP …")`. The receiving-side comparison after the re-run no longer runs under the stale-PUT lock on WebDAV.
*What is wrong.* The rationale (the QA server's stale PUT commits after slirp drops the socket) may well be right, but it was decided by the session whose PASS depended on it, the SKIP increments nothing, and the message itself names the check that would settle it ("Assert on MinIO/S3 or a real provider") without that run being recorded. `engineering-practices.md` § "A failure you find is yours to fix… or say plainly that you did not."
*Evidence.* Run `cloud-round-trip --backend s3` (MinIO) on the pair and record LINK5's receiving-side verdict; if it passes there, the SKIP is justified and should say so with the run's date; if not, the script has a bug the SKIP now hides.

**M-6 — `tools/qa-accounts` sends the RetroAchievements password and web API key through ssh's argv.**
`tools/qa-accounts` ra branch: `g ". /etc/profile; … set_setting global.retroachievements.password $(q "${RA_QA_PASSWORD}"); set_setting global.retroachievements.key $(q "${RA_QA_WEBKEY}")"`.
*What is wrong.* The remote command string is the ssh process's argv on the host and `sh -c`'s argv under `sshd` on the guest — readable in `ps` on both — and whatever `set_setting` does with its arguments (a `sed -i` in `ps`, a `logger`) is another exposure. The script's own ScreenScraper branch knows better ("The lines travel over ssh's stdin, never through a second shell's quoting") and uses stdin. The header's "without a credential ever passing through … a log" is not shown, and per the #68 AC these are the maintainer's account credentials, not a throwaway (D-QA-016's remaining box). D-INFRA-010 is the standing rule.
*Evidence.* `ps -o args -C ssh` on the host during a run; `journalctl` on the guest for the value. Fix: carry the RA lines over stdin as the SS branch does, or write a 0600 file and `set_setting` from it.

**M-7 — A network failure at scrape start is reported as "SCREENSCRAPER ANSWERED WITH AN ERROR"; a probe failure blames the pair.**
`ScreenScraper.cpp` `default:` branch: a `REQ_IO_ERROR` (offline, DNS, timeout) has a curl body with no "identifiant"/"login", so the player is told the server answered with an error and to try later. The vocabulary for this is `YOU'RE NOT ONLINE` / `TRY AGAIN WHEN YOU'RE ONLINE` (es-player-text § Outcome words). Separately, if the pair-only probe itself fails for a transient reason, `pairOk` is false and the pair is blamed.
*Evidence.* Cut the guest's link, SCRAPE NOW, frame the message. Fix: handle `REQ_IO_ERROR`/status 0 before the switch; on probe non-answer say "COULDN'T REACH SCREENSCRAPER" rather than naming a credential.

**M-8 — The identity rule changes what "restore" means across devices, and D-CLOUD-008 does not say so.**
`backuptool` `write_archive` L263–298. A file the source device had *at the image default* is left out. Restore onto a device whose copy of that file is *not* at default leaves the target's modified copy in place. Before this change a restore made the target's settings match the source's; now it applies the source's *deviations* only. Also: `/usr/config` differs per build family, so the comparison is against the *source* family's seed.
*Why it matters.* `least-surprise.md` is cited by the rules as the standing test; a player who reset a setting on A and restored to B expects B reset. The maintainer chose the identity rule for size and staleness; this consequence was not put in terms of what the player sees (player-language § "A decision is put in terms of what they would see").
*Evidence.* Guest a: file X at default; guest b: X edited; back up a, restore on b; `cmp X /usr/config/X` on b. Then a one-line D-CLOUD-008 addendum either accepting this or adding a manifest of pruned paths so restore can reset them.

**M-9 — Deleting `SKIP=""` in the zip branch is unmotivated and possibly unsafe.**
`backuptool` ~L565. If the zip loop appends (`SKIP="${SKIP} …"`) under `set -u`, the zip restore now aborts on an unbound variable; if it does not, the deletion is dead noise. Either way it was the only edit to the branch that H-2 says needed a real one.
*Evidence.* `grep -n 'set -u\|SKIP' backuptool`; run a zip restore on the VM (also covers H-2).

### LOW

**L-1 — `GuiSaveState` computes `titlePerc` from `theme->Title.font->getHeight(2.0f)` before that font has rasterised anything** (`GuiSaveState.cpp` ~L115), the exact trap the same session wrote into `es-code-traps.md` and fixed for the *label* font two lines above; and `helpRowPerc()` in the constructor runs with `mTheme` null (hence the new guard), so it measures an unthemed help font while `onSizeChanged` measures the themed one — the comment's "the two agree" is not true in the constructor. Clamping to [0.30, 0.50] and two frames hide it for the default theme. Evidence: log both values in constructor vs `onSizeChanged`; frame with a second theme at 640×480.

**L-2 — `cloud_setup`: `readonly -a RCLONE_LIST_OPTS=(…)` is spliced into `syncpath_problem`'s doc comment, is used only by `absent_not_broken` as far as the diff shows, so the comment "a cloud that never answers is a refusal in 30 s, not a wizard that hangs" is unproven for the pre-existing probe; and `readonly` will error if any sourced helper already defines the name. Evidence: `grep -n RCLONE_LIST_OPTS cloud_setup` and a `--contimeout` sanity run against a black-holed host.

**L-3 — `absent_not_broken` is duplicated verbatim in two scripts** with a test that enforces byte-identity — a drift guard for a problem a shared home (`cloud_sync_helper` / `001-functions`) would remove. `exists_remote()` in `cloud_content_restore` now overlaps it too.

**L-4 — `grep -v -F -f "${REGENERABLE}"` is a substring match, not the prefix match the comment claims** (`backuptool` L279). Harmless today; the comment is wrong.

**L-5 — Test hygiene in `last-good-scripts-test`:** `[ -s "${LL}/fn.sh" ] && [ -s "${LL}/fn.sh" ]` (duplicated condition); the `--old` header names only k among the three new cases; case l proves the function in isolation and the integrations by `grep`/`awk` text checks only — the `syncpath_problem` branch (M-2) and the scan's `scan_rc=3` rewrite are never executed; case m's "calls neither hostnamectl nor avahi-set-host-name" was written *after* the removal, so it has never been seen to fail.

**L-6 — `avahi-daemon.service` has `ConditionPathExists=/storage/.cache/services/avahi.conf`; the package.mk comment says `avahi.disabled` turns it off.** Nothing in the diff creates `avahi.conf` on a clean install or an upgraded `/storage`. Evidence: `ls /storage/.cache/services/` and `systemctl status avahi-daemon` on a fresh guest and an upgraded one. Also unproven: whether the daemon follows a rename made later in NETWORK SETTINGS.

**L-7 — ES `CLAUDE.md` mixes machine layouts** (`/workspace/repos/rocknix` vs `~/Development/emulationstation-next.worktrees/…/.githooks`), so the copy-paste `core.hooksPath` command likely names a directory that does not exist on this workspace — and the hook's own comment says a missing directory "runs nothing and says nothing". It also lists `.claude/rules/vm-first.md`, which nothing else in this document evidences. The hook only *warns* on a relative `core.hooksPath`. Evidence: `ls "$(git -C <es> config core.hooksPath)"`; `ls .claude/rules/vm-first.md`.

**L-8 — `register-check` regex `D-…-[0-9]{3}` has no trailing boundary** (a `D-UI-1234` reads as `D-UI-123`), and `IFS=:` breaks on any path with a colon.

**L-9 — Seven of the nine new ScreenScraper strings are unframed at 640×480** (es-player-text: "Measure every string at 640x480 in frames"); only the two rejection messages have frames.

**L-10 — `GridTextProperties` now honours `<multiLine>` on every theme's `gridtile` text** (`GridTileComponent.h`), a global es-core behaviour change made for one page. Evidence: `grep -r multiLine` across the shipped theme packages' gridtile text elements. **Uncovered by any rule** (see §4).

**L-11 — `qa-accounts clear` writes the literal `default`** unless `set_setting … default` is special in `001-functions`; it leaves `global.retroachievements=1` and the username in place; the port check accepts 10020–10029 while the message says 10022–10029. Evidence: `get_setting global.retroachievements.password` after `clear`.

**L-12 — `cloud_content_backup` now expands `"${RCLONE_LIST_OPTS[@]}"`**; the diff does not show it defined in that script (it is defined in `cloud_setup` by this change and used pre-existingly in `cloud_content_restore`). Evidence: `grep -n RCLONE_LIST_OPTS cloud_content_backup`.

**L-13 — The pair-only probe URL carries `devpassword=`.** If `HttpReq` logs a failing URL (upstream does in some paths), the developer password lands in `es_log.txt` — the very string the new pre-push hook scans for. Pre-existing for the user-info URL; extended here. Evidence: `grep -c devpassword /storage/.config/emulationstation/es_log.txt` after a failed scrape on guest d.

**L-14 — LINK5's pad is written to `/storage/.config/retroarch/link5-padding.bin`** with no `mkdir -p`; 12 MiB of `/dev/urandom` per run onto the guest image. Fine on the VM; would be a footprint on a device (the fixture is VM-only today — keep it so).

---

## 2. Ticked acceptance criteria the diffs do not support

Legend: **✗ contradicted** by the diff; **∅ no code in either diff**; **◐ mechanism in diff, measurement/frame/log not** (corroboration lives outside the artefact; acceptable if the cited primary artefact exists, but the diff alone does not prove it).

| Issue | Ticked criterion | Verdict from diffs |
|---|---|---|
| #45 | Older build's backup does not overwrite `ppsspp/assets` on a newer one | **✗** tar only; zip archives untouched (H-2) |
| #45 | Substantially smaller than 16 MB; `ppsspp.ini`/`controls.ini` round-trip | ◐ mechanism + case k; guest numbers not in diff. `controls.ini` never appears in case k (only `ppsspp.ini`) |
| #142 | `--scan` lists every system on FTP; never "couldn't be read" against a reachable cloud | ◐ rewrite present; the five guest checks not in diff; the `absent_not_broken`-returns-1 path (parent lists and holds it) still yields "couldn't be read", by design |
| #142 | `cloud-round-trip --backend ftp` reaches 99/99 | ∅ harness result only |
| #50 | Default stable across reboots **and reflashes** | ◐ reboot: case m; reflash rests on `cloud_device_id` at early boot (M-1), untested off the VM |
| #50 | A player's hostname is never overwritten | ◐ true for the boot script; false through the restore path (H-3) |
| #50 | mDNS responds on the VM | ◐ enable + ordering in diff; journal line not; `avahi.conf` presence unproven (L-6) |
| #47 | A never-configured player does not see the cloud row as a fault (CHECK CONNECTION greyed, neutral line, NO CLOUD STORAGE… dialog) | **∅** the only ES change touching that page is the uncached marker read; no code for the described behaviour is in `52012829c..3466b36af` |
| #66 | With a wrong pair **(any account, or none)** the message names the pair | **✗** with no account the pair message is unreachable (H-1) |
| #66 | English message for any error; body to log only | ◐ by code; but a network failure is misattributed (M-7) |
| #66 | Both cases on the VM with a test account | ∅ frames; and the "none" frame predates the shipped code |
| #67 | All five ticks (ALL kept across tab switch; NO kept across reopen; fresh defaults; upgraded defaults; …) | **∅** no scraper-filter persistence code in either diff. The "upgraded device" tick is reasoning, not observation |
| #68 | All five ticks (summary page; game page; empty-key message; backuptool leaves key out and restore page lists it; `strings` shows no `z=…&y=`) | **∅** no `GuiMenu`/`GuiRetroAchievements`/`backuptool` code for the key in either diff; only the French msgstr for msgids whose source is not shown — so the D-UI-051 "byte for byte" requirement cannot be checked either |
| #69 | All four VM ticks | **∅** no theme change in the distribution diff |
| #82 | All three ticks | **∅** no rescan code in the ES diff |
| #113 | LINK1-7 end within ~30 s; "65 PASS" | ◐ the padding fixture is in diff; the count is not, and it includes a cell whose assertion became a SKIP (M-5) |
| #113 | The QA log records both numbers | ∅ docs not in diff |
| #93 | After a delete the bar shows the focused row's prompts | ✓ `updateHelpPrompts()` in `loadGrid()` |
| #27 / #149 | Labels fit at both sizes; help bar drawn on 640×480, once at 1280×800; no .po changes | ✓ by code (L-1 caveat) |

For the ∅ rows: either the code predates `52012829c` (then it belongs to audit #129's scope and these ticks are re-verifications, which is fine — but say so and cite the ES commits), or the "complete diffs" are not complete. `git log --oneline -S'WEB API KEY' -- es-app/src` and `git log --oneline -- es-app/src/guis/GuiScraperStart.cpp` in the ES tree settle which.

---

## 3. Conformance and interaction notes (condensed)

**Blindspot register (by number as cited in the rules):** 7/34 host-vs-device tools — **repeated** (M-3). 13 assumed-done — **repeated** (H-1's tick; the #47 tick). 14/39 unwired/unfailed checks — **repeated** (M-4, M-5, L-5). 22 a probe that cannot report absence — **repeated** (M-2). 23 deleting without diffing behaviours — ⚠ (M-5's removed assertion; M-9). 41 frame at 640×480 — ⚠ (L-9). 40 unbound variable — fixed once in `vm-qa`, open question in L-12.

**Invariants.** Player progress: untouched (settings, not saves). Secrets in backups: unchanged by this diff; M-6 and L-13 are secret-in-transit/log risks, not archive risks. Allowlist/`--delete-excluded`: untouched (`rclone mkdir` carries no filter). Upgrade *and* clean install: answered for the hostname (both paths reasoned); **not answered** for zip archives (H-2), for `avahi.conf` (L-6), or for the third path this project actually has — restore onto a different unit (H-3, M-8).

**Interaction pairs examined.** backup/restore ↔ per-unit naming (H-3); `network-base-setup` ↔ `cloud_device_id` ↔ udev timing (M-1); `network-base-setup` `set_setting` at boot ↔ `chksysconfig` last-good record (#102) — no conflict visible, ordering unproven; `absent_not_broken` ↔ `cloud_content_filter`/page — rewrite happens after the pipe is consumed, correct; `GridTileComponent.multiLine` ↔ every theme (L-10); `GuiSaveState::render` ↔ `Window`/`ViewController` early help draw — guarded by `peekGui()==this`, correct; `vm-qa pair-identity` ↔ pre-#50 image — deliberately fails, good (the one new check with a designed positive).

**Build-vs-adopt.** No register exists; advisory only. Nothing here is net-new platform behaviour beyond `register-check` (bespoke, ~70 lines — acceptable) and `absent_not_broken` (rclone offers no equivalent; the survey is implicit in the comment).

---

## 4. Instruction-file recommendations

### Coverage gaps (would-have-prevented)

| Finding | Would have been caught by | Uncovered? |
|---|---|---|
| H-1, #47/#113 ticks | `.claude/rules/engineering-practices.md` § "Verify the artifact, not the report" — but no rule binds a *tick* to the commit it saw | partly — see P-01 |
| H-2 | `upgrade-and-install.md` § "Fixing forward is not enough" | — |
| H-3, M-8 | `upgrade-and-install.md` § "The two questions" — which are two, not three | partly — see P-02 |
| M-1 | `engineering-practices.md` § "If the VM can test it… Ask what the VM cannot prove, and write the answer down" | — |
| M-2, L-12 | `engineering-practices.md` § "Guards must fail closed" | — |
| M-3 | `upgrade-and-install.md` § "And under the device's tools, not the host's" | — |
| M-4, M-5, L-5 | `engineering-practices.md` § "a suite is not wired in until it has been seen to FAIL once" / "The first PASS… is the one to distrust" | — |
| M-6, L-13 | D-INFRA-010 via `engineering-practices.md` § "A read is free, and still goes through the filter" (reads only) | partly — see P-03 |
| M-7 | `es-player-text.md` § Outcome words (`YOU'RE NOT ONLINE`) and § Anti-patterns | — |
| L-1 | `es-code-traps.md` § "Three things a font is not" | — |
| L-9 | `es-player-text.md` "Measure every string at 640x480 in frames" | — |
| L-10 | (none — no rule about es-core changes that alter theme semantics) | **YES** |
| L-7 | `documentation-accuracy.md` (referenced by D-WORKFLOW-014; not excerpted) | probably — |

### Codification gaps (3+ instances)

| Pattern | Instances | Recommendation |
|---|---|---|
| **P-01: a tick's evidence is from a commit other than the one that ships** | H-1 (#66 frame `f33fa23ac` vs pin `3466b36af`), #47 tick (image `878ec8863b`, no code in range), #113 "65 PASS" (`db6b42c180`, assertion since removed) | **Extend** `.claude/rules/issue-tracking.md` (or wherever ticks are governed) § "A tick names its commit": every `[x]` names the exact commit/image it saw; any later commit touching the same file or string re-opens the box; the auditor compares the tick's commit to the pin before accepting it. Add the pin-vs-tick comparison as a Phase 2 step in the code-auditor skill. |
| **P-02: what travels in the settings archive is decided per file without asking whose the value is** | H-3 (per-unit hostname), M-8 (per-image defaults), H-2 (per-image assets by format), #68 key exclusion (done right, by hand) | **Extend** `upgrade-and-install.md` § "The two questions" to three: *Upgrade*, *Clean install*, **Restore onto a different unit**. Add a table row "A new `system.cfg` key or `/storage/.config` path": classify as per-unit (never restored onto another device: hostname, device id, SSH password, Wi-Fi keys), per-player (travels), or per-image (regenerable, never travels), and name the list in `backuptool` where the passwords already are. |
| **P-03: a new check exists but nothing runs it and nothing has seen it fail** | M-4 (`register-check`), M-5 (LINK5 SKIP), L-5 (case m's post-hoc `hostnamectl` assertion) | The rule text exists; add one operational line to `engineering-practices.md` § "Guards must fail closed": *"A new tool's header names the suite that runs it (`vm-qa` suite, pre-push hook, or test case) and the commit/date of the run in which it was watched to FAIL; a tool with neither is not yet a guard."* |
| P-04: a credential in a process's arguments | M-6, L-13 | Two instances — below threshold. Note for the next audit; if it recurs, add a "writes" sibling to § "A read is free…": values go over stdin or a 0600 file, never argv, and a tool's self-report names keys only. |

### Recommended action sequence (for Phase Z.6, not for the auditor)

1. `upgrade-and-install.md`: add the third question and the per-unit/per-player/per-image row (P-02); cite H-3 as the case.
2. `issue-tracking.md` (or equivalent): add "A tick names its commit" (P-01); cite the #66 frame.
3. `engineering-practices.md` § "Guards must fail closed": add the one-line "names the suite that runs it" bullet (P-03).
4. `es-code-traps.md` § "Three things a font is not": add the sentence "…and the Title font too — `GuiSaveState`'s `titlePerc` still reads it cold" once L-1 is fixed, or fix L-1 and skip.
5. `es-player-text.md` § Outcome words: add a line under "Why" that a non-HTTP failure is `YOU'RE NOT ONLINE`/`COULDN'T REACH <SERVICE>`, never "answered with an error" (M-7).
6. New consideration for `es-native-ui.md` (Uncovered, L-10): a change in `es-core` that alters how a theme property is read is a change to every shipped theme — grep the theme packages before the pin moves.
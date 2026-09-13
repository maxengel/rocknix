# Punch List — Milestone "Stable before upstream", the work since audit #129

**Generated:** 2026-09-13
**Source audit:** `docs/audits/2026_09_13-milestone-stable-before-upstream/04-analysis.md`
**Total items:** 18 (Critical: 0, High: 2, Medium: 8, Low: 8)
**Tracker:** [#151](https://github.com/maxengel/rocknix/issues/151) — every item is a checkbox there.
**Rule of the day:** D-WORKFLOW-015 — every item is fixed, at every severity; severity orders the work and excuses nothing. `deferred:#NNNN` is for an item whose fix needs a design decision, recorded as such.

---

## Instructions for Executing Agent

Each item is discrete. Work through them in order. For each: read the evidence, reproduce it where a probe is given, fix, verify against the stated Acceptance, and tick the box on the audit issue with the commit or the frame that proves it.

**Nothing in this list was fixed by the audit** — it ran under an explicit no-change mandate (code, docs outside its folder, and issues other than its own were read-only). Two items (PL-02, PL-04) carry a default fix and a design alternative; the maintainer chooses.

Seat attribution: items the two Facilitator seats raised and this audit confirmed are marked *(Claude seat H-n/M-n/L-n)* / *(GPT seat F-n)*; the rest are the orchestrator's own.

---

# High priority

## PL-01 — the fork's `avahi-daemon.service` does not ship; the responder publishes a stale name on the boot it starts first

- **Severity:** High
- **Category:** Acceptance Criteria Gap / Cornerstone Violation (verify the artifact; diff a duplicate's behaviours)
- **Source finding:** F-01 (AC-50-6 FAIL; D-NET-003 does not hold as shipped)
- **Owner area:** `projects/ROCKNIX/packages/network/avahi/` (recipe and unit); `tools/last-good-scripts-test` case m; `tools/vm-qa` pair-identity
- **What:** (1) Add upstream's `rm -rf ${INSTALL}/usr/lib/systemd` to the override's `post_makeinstall_target` (it is the one line the override lacks against `packages/network/avahi/package.mk:83`), so `scripts/install` copies the fork's `system.d/avahi-daemon.service` and nothing extracts over it. (2) Make case m's check 8 read the **built** unit when a build root is present (`build.ROCKNIX-*/image/system/usr/lib/systemd/system/avahi-daemon.service`), as the busybox shim already reads the build root, and fall back to the source only when none is. (3) Add to `vm-qa`'s pair-identity suite: the avahi `Host name is <x>.local` journal line on each guest names that guest's kernel hostname. (4) Until (1) is in an image, or as belt-and-braces beside it, have `network-base-setup` re-publish after the write (`avahi-set-host-name` guarded by the daemon being up, or `avahi-daemon -r`) — the property the removed call carried.
- **Where:** `projects/ROCKNIX/packages/network/avahi/package.mk:81-99` (`post_makeinstall_target`); `projects/ROCKNIX/packages/network/avahi/system.d/avahi-daemon.service:1-8`; `tools/last-good-scripts-test:669` (check 8); `tools/vm-qa:139-155`; `projects/ROCKNIX/packages/sysutils/systemd/scripts/network-base-setup:44-56`
- **Why:** the stock unit has no `After=network-base.service` and no `ConditionPathExists`; the daemon starts from `basic.target` via its socket and reads the kernel hostname whenever it comes up. On guest b it came up first and holds `ROCKNIX.local` for a device named `GENERIC-X64-0964` — #50's collision over mDNS, and the maintainer's call ("turn the mDNS responder back on", D-NET-003) implemented on a file the build never uses. `least-surprise.md`: a name that differs by boot.
- **Evidence (reproduction):**
  ```
  # the built artifact, not the source
  cat build.ROCKNIX-GENERIC_X64.x86_64/image/system/usr/lib/systemd/system/avahi-daemon.service | grep -c network-base   # expected 1, actual 0
  diff packages/network/avahi/package.mk projects/ROCKNIX/packages/network/avahi/package.mk | grep 'rm -rf'              # 83d82 < rm -rf ${INSTALL}/usr/lib/systemd
  # a guest that lost the race (read-only)
  ssh -p 10023 … 'systemctl show avahi-daemon.service -p After; journalctl -b -o short-monotonic -u avahi-daemon | grep "Host name is"; hostname'
  #   After= has no network-base.service; "Host name is ROCKNIX.local" at 2.76 s; hostname GENERIC-X64-0964
  ```
- **Acceptance:** on a rebuilt x64 image, `systemctl show avahi-daemon.service -p After` on every pair guest lists `network-base.service`; ten boots of the pair show the avahi `Host name is` line equal to `hostname` on every boot; case m check 8 fails when the built unit lacks the ordering and passes when it has it; the pair-identity suite has the mDNS-name assertion and passes.

## PL-02 — the generated per-unit hostname travels in the settings archive and is then protected as the player's on the next unit

- **Severity:** High
- **Category:** Interaction Defect (backuptool × D-NET-002)
- **Source finding:** F-02 *(Claude seat H-3, confirmed)*
- **Owner area:** `projects/ROCKNIX/packages/sysutils/systemd/scripts/network-base-setup`; `projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool`; D-NET-001/002
- **What:** Default fix, no design change: in `network-base-setup`, treat a stored name of the generated shape — `^<FAMILY>-[0-9a-f]{4}$` whose four hex digits are **not** this unit's — as another unit's shipped default and re-derive it, logging the reason. Design alternative for the maintainer: classify `system.hostname` as per-unit and drop it from the settings archive beside the passwords (`backuptool:377`), which also stops a typed name colliding after a restore but changes what "restore my settings" carries (D-NET-001 says the name is the player's). Either way, add a case-m check: `system.hostname=H700-15ca` (another unit's) becomes `H700-9a3f`; `Max Deck` stays.
- **Where:** `network-base-setup:26` (the `if`); `backuptool:154` (`system.cfg` in DEFAULT), `:372-380` (the strip); `tools/last-good-scripts-test` case m
- **Why:** unit A boots as `H700-9a3f`; the player restores A's settings on unit B (the fresh-handheld journey — `cloud_restore` deliberately offers another device's folder, `cloud_restore:1343-1372`); B's `system.cfg` now says `H700-9a3f`, which is neither the family nor empty, so `network-base-setup` never touches it. Both units are `H700-9a3f` — AC-50-1 defeated on the project's central flow, and the collision is now permanent where before it was per-boot.
- **Evidence (reproduction):** on the pair: `backuptool backup` on a; copy the archive to b's `/storage/roms/backup/`; `backuptool restore --no-restart` on b; reboot b; `tools/vm-qa --only pair-identity` → expected "two devices, two names", actual "the guests share a hostname". Static: `grep -in hostname backuptool cloud_restore` → comments only.
- **Acceptance:** after the restore-and-reboot above, the pair-identity suite passes with two different names; a typed name (`Max Deck`) restored onto b is kept (default fix) or not carried (alternative), and the choice is a register row citing D-NET-002.

# Medium priority

## PL-03 — the zip restore branch does not skip PPSSPP's assets and cache; D-CLOUD-008 says "any archive"

- **Severity:** Medium *(both seats: High)*
- **Category:** Acceptance Criteria Gap
- **Source finding:** F-03 (AC-45-4 PARTIAL) *(Claude seat H-2; GPT seat F-01)*
- **Owner area:** `backuptool`; `tools/last-good-scripts-test` case k; `docs/decision-register.md`
- **What:** in the zip branch, exclude `storage/.config/ppsspp/assets/*` and `storage/.config/ppsspp/PSP/SYSTEM/CACHE/*` with `unzip -x` alongside the symlink skips (the `-x` mode switch is already used there); add a zip fixture to case k (assets + cache + an ini, restored over marked files) that fails against the current script; append a D-CLOUD-008 row saying the zip half is done.
- **Where:** `backuptool:578-600`; `tools/last-good-scripts-test:597-608`; `docs/decision-register.md` row D-CLOUD-008
- **Why:** `upgrade-and-install.md` § Fixing forward is not enough — the archives already written are the ones that carry 16 MB of assets, and the zip ones are the oldest of those. `#45` box 4 is ticked without qualification.
- **Evidence:** static: `sed -n '578,600p' backuptool` shows `SKIP` collects only `[ -L ]` entries. Probe on a guest: build a zip with `storage/.config/ppsspp/assets/lang/en_US.ini` = `OLD`, mark the live file, `backuptool restore --no-restart`, `cat` the live file → expected unchanged, actual `OLD`.
- **Acceptance:** the zip fixture in case k passes on the fixed script and fails under `--old`; the live asset is untouched after a zip restore on a guest; D-CLOUD-008 has its addendum row; #45 box 4's parenthetical names both archive kinds.

## PL-04 — the device identity is first computed at ~2 s of the first boot by a unit that cannot see the adapter

- **Severity:** Medium
- **Category:** Interaction Defect (network-base × cloud identity)
- **Source finding:** F-04 (AC-50-3 PARTIAL; D-NET-002 caveat) *(Claude seat M-1, confirmed)*
- **Owner area:** `network-base-setup`; `cloud_device_id`; `network-base.service`
- **What:** decide and implement one of: (a) `cloud_device_id --if-stored` (or `--no-write`): return the stored id, or compute without storing when the adapter is present, and return nothing otherwise — `network-base-setup` then leaves the family name for a later boot and logs it; (b) move the rename to a unit ordered after the adapter exists (`After=sys-subsystem-net-devices-wlan0.device` is device-specific; a small oneshot `Wants=network-pre.target` after udev settle is not). Then prove it on an RG35XX SP flashed fresh: `journalctl -b -o short-monotonic | grep -E 'wlan0|network-base'` and `cat /storage/.config/cloud_sync-device-id` vs `md5("$(ethtool -P wlan0 …)|unknown")[0:10]`.
- **Where:** `network-base-setup:28-34`; `cloud_device_id:generate_id`, `main` (`write_id` on every computed id); `network-base.service:1-6`
- **Why:** before this range the first caller was a cloud action with the network up; now it is a `DefaultDependencies=no` unit at `local-fs.target`. `generate_id` falls back to machine-id (on H700 hardware-derived, so stable — but a *different* id from the MAC hash) and stores it; a reflash whose first boot finds the adapter seeds the other one. The reflash-stability promise (`cloud_device_id` header; D-NET-002) then depends on boot timing. The VM cannot show it: virtio-net is present from the first millisecond (three guests: MAC-derived by hash).
- **Evidence:** `sed -n '/^generate_id/,/^}/p;/^main/,/^}/p' cloud_device_id` — every computed id is written; `systemctl cat network-base.service` — no network ordering. Handheld journal as above (the missing artifact; per-device yes).
- **Acceptance:** on a fresh-flashed H700 the stored id equals the MAC hash and the hostname suffix its first four digits, on two consecutive flashes; or, with (a), the first boot logs "adapter not present yet, keeping the shipped name" and the second boot renames; case m covers the no-adapter path.

## PL-05 — #47 was closed against its own checklist; two rows are three lines; the page was never framed at 640x480

- **Severity:** Medium
- **Category:** Acceptance Criteria Gap / Cornerstone Violation (D-UI-023; issue-tracking; blindspot 41)
- **Source finding:** F-05 (AC-47-2 PARTIAL, AC-47-5 FAIL)
- **Owner area:** ES `es-app/src/guis/GuiMenu.cpp::openRestoreRelink`; issue #47
- **What:** cut the two descriptions to one line each at 640x480 (`DEVICE PASSWORD…`: "YOUR EXISTING PASSWORD STILL WORKS. SET ONE ONLY TO CHANGE IT."; `LATER KEEPS THIS LIST`: "IT RETURNS AT STARTUP, OR UNDER NETWORK SETTINGS > FINISH RESTORE PROCESS." — or move the LATER sentence into a confirmation on the LATER button); replace the `--` dash with a period; frame the page at 640x480 on a guest **without** wifi so the empty-circle glyph is observed; then edit #47's body — tick boxes 2-4 with the frame and the commit, tick 5 with the 640x480 frame (or reopen the issue until it exists).
- **Where:** `GuiMenu.cpp:7269-7272` (DEVICE PASSWORD description), `:7325-7328` (LATER row), `:7204` (glyphs); issue #47 body boxes 2-5
- **Why:** `es-player-text.md` "Two lines per row, never three (D-UI-023)" is the maintainer's rule for exactly these rows, and the implementer's own 1280x800 frame (`finish-restore-process-no-cloud-top.png`) already shows three; at 640x480 fonts scale ×1.31 on half the width. `issue-tracking.md`: "When a comment supersedes an acceptance criterion, edit the body in the same action" (blindspot 27). Blindspot 41 was written the same day.
- **Evidence:** open `docs/qa-frames/2026-09-13/finish-restore-process-no-cloud-top.png` — the DEVICE PASSWORD row's description wraps to a second line; `finish-restore-process-no-cloud-bottom.png` — the LATER row likewise. `gh issue view 47 --json body` — 1 of 5 boxes ticked, state CLOSED.
- **Acceptance:** a 640x480 frame of the page with every row at two lines or fewer and an empty circle visible on WI-FI PASSWORD; #47's body reflects its state.

## PL-06 — the no-account early return hides the developer-pair message; the ticked frame predates the shipped code

- **Severity:** Medium *(Claude seat: High)*
- **Category:** Acceptance Criteria Gap / Spec Drift
- **Source finding:** F-06 (AC-66-3 PARTIAL) *(Claude seat H-1; GPT seat F-04)*
- **Owner area:** ES `es-app/src/scrapers/ScreenScraper.cpp::screenScraperFailureMessage`; issue #66; `tools/qa-accounts`
- **What:** either reorder — probe the pair first (one request, already on the failure path), and when it is rejected say so regardless of the account; when it is accepted and no account is set, say NEEDS YOUR ACCOUNT — or reword #66 box 3 to the ordering that shipped and say why (the 12:40 finding that a pair alone is refused everything). Retake the box-3 frame on the pinned commit (`3466b36af7` or later) with a bogus pair and no account. Fix `tools/qa-accounts:58-60`'s comment ("A pair alone is enough for a real scrape (anonymous quota)"), which the same day's observation contradicts.
- **Where:** `ScreenScraper.cpp:1019-1030`; `tools/qa-accounts:58-60`; #66 body box 3
- **Why:** a player with a mistyped pair and no account is told to add an account, adds one, and fails again with the pair message — two failures where one would do. The tick's evidence (ES `f33fa23ac`) is from before `5e7245b51` added the branch (blindspot 13: the frame shows a state the pinned code no longer produces).
- **Evidence:** static: the `if … empty() … return` at `:1019-1020` precedes `HttpReq probe` at `:1023`. Probe on guest d, pinned image, bogus pair, no account, SCRAPE NOW → expected (per box 3) `REJECTED THE DEVELOPER ID…`, actual `NEEDS YOUR ACCOUNT…`.
- **Acceptance:** with a bogus pair and no account the screen names the pair (or #66's criterion says otherwise and why); a 640x480 frame from the pinned commit is attached to the box; `qa-accounts`' comment agrees with `ScreenScraper.cpp`'s.

## PL-07 — an offline scrape is told the server answered with an error; an inconclusive probe blames the pair

- **Severity:** Medium
- **Category:** Cornerstone Violation (player-language § Clear; es-player-text § Outcome words)
- **Source finding:** F-07 *(Claude seat M-7; GPT seat F-05)*
- **Owner area:** ES `ScreenScraper.cpp::screenScraperFailureMessage`; `locale/lang/fr`
- **What:** before the status `switch`, handle `HttpReq::REQ_IO_ERROR` (and status 0) with `YOU'RE NOT ONLINE. TRY AGAIN WHEN YOU ARE.` (the outcome-words vocabulary); make the probe tri-state — accepted (`REQ_SUCCESS` + `<?xml`), rejected (`REQ_SUCCESS` + a body), unknown (anything else) — and on unknown say `COULDN'T REACH SCREENSCRAPER. TRY AGAIN.` rather than naming a credential. French for both new strings in the same commit (D-UI-051).
- **Where:** `ScreenScraper.cpp:976-1035` (`default:` branch; `pairOk` at `:1027`); `HttpReq.h:85` (`REQ_IO_ERROR = 3`)
- **Why:** the `default:` branch's body test (`identifiant`/`login`/`maintenance`/`ferm`) reads curl's "Couldn't resolve host" as a server error; `pairOk == false` covers timeout, 429 and a maintenance page as well as rejection. Wrong instructions at the moment of failure.
- **Evidence:** cut the guest's link (`tools/vm-qa`'s link method) and press SCRAPE NOW → expected an offline sentence, actual `SCREENSCRAPER ANSWERED WITH AN ERROR. TRY AGAIN LATER.`
- **Acceptance:** frames at 640x480 for offline and for a probe timeout (a black-holed `API_URL_BASE`), each with the right sentence in English and French; no credential named in either.

## PL-08 — both `pre-push` hooks scan secrets only at the pushed tip and key the `pr/*` guard on the local ref; the distribution hook skips with no base

- **Severity:** Medium
- **Category:** Cornerstone Violation (guards must fail closed; blindspot 14)
- **Source finding:** F-08 *(GPT seat F-03, F-11; the distribution-hook siblings found here)*
- **Owner area:** `.githooks/pre-push` (distribution); ES `.githooks/pre-push`
- **What:** in both hooks: (1) scan the **added lines of every pushed commit** (`git log -p --diff-filter=AM ${range}` or `git rev-list ${range} | while … git show --format= -p`) so a secret added and removed within the push is refused; (2) decide `pr/*` from the **remote** ref (`_remote_ref`), not the local branch name; (3) when the base ref is missing or `git diff … ...` fails, refuse (`status=1`) — the ES hook already does the first, the distribution hook warns and skips (`:149`); (4) prove each with a negative test in a scratch repo: an intermediate-commit `devpassword=<a synthetic value matching the hook pattern>`; `feature/x:refs/heads/pr/x`; no `upstream/next`.
- **Where:** distribution `.githooks/pre-push:108-131` (scan), `:141-154` (pr keying, skip); ES `.githooks/pre-push:38-61` (scan), `:63-72` (pr keying)
- **Why:** the scan reads `git show ${local_sha}:${f}` — a blob that is never inspected can be pushed; the `case "${branch}" in pr/*)` on the local name lets `git push origin feature/x:pr/x` bypass the personal-path guard entirely. "A guard with no observed positive is a guard with no evidence" — both hooks have been proven on a carried file, not on these shapes.
- **Evidence:** static, both files at the lines above. Probe as in (4): expected refusal, actual push.
- **Acceptance:** the three negative tests refuse in both repos, recorded (commands and output) in the hooks' headers or in `docs/`.

## PL-09 — `tools/qa-accounts`: credentials in `ssh`'s argv; `clear` always succeeds; a missing file yields invalid XML; the port range

- **Severity:** Medium
- **Category:** Cornerstone Violation (D-INFRA-010; guards must fail closed)
- **Source finding:** F-09 *(Claude seat M-6, L-11; GPT seat F-07, F-08, F-09, F-13)*
- **Owner area:** `tools/qa-accounts`
- **What:** carry the RetroAchievements lines over ssh's stdin as the ScreenScraper branch does (a remote `while read k v; do set_setting "$k" "$v"; done`), so no value is in either side's argv; check the `clear` ssh's status and read the settings back before printing `cleared:`; in the SS writer, refuse an input that lacks `<config>` (so a missing or unparseable file is an error, not a new invalid file), and verify the result parses (`python3 -c 'import xml…'` on the host after reading it back, or a `grep -c '<config>'`); tighten the port check to `1002[2-9]` to match the message.
- **Where:** `tools/qa-accounts:43-52` (ra), `:34-38` (clear), `:71-84` (ss writer), `:29` (port)
- **Why:** the maintainer's QA account values sit in `ps` on the host and in `sh -c`'s argv on the guest while the tool runs; `clear` exits 0 on an unreachable guest; the writer already broke `es_settings.cfg` once through quoting (work log 12:40) and its report checks attribute names, not validity.
- **Evidence:** `ps -o args -C ssh` during a run shows the values (use a throwaway file); `QA_ACCOUNTS=… tools/qa-accounts 10029 clear` against a port nothing listens on → prints `cleared:` and exits 0.
- **Acceptance:** `ps` shows no value during either write; `clear` against a dead port exits non-zero and prints no `cleared:`; a run against a guest whose `es_settings.cfg` was moved aside refuses; 10020/10021 are rejected.

## PL-10 — the scripts suite cannot show three of its own guards firing, and two cases run under the host's tools

- **Severity:** Medium
- **Category:** Test Gap (blindspots 14, 34)
- **Source finding:** F-10 *(Claude seat M-3, L-5)*
- **Owner area:** `tools/last-good-scripts-test`
- **What:** under `--old`, fetch `${BASE_REF}` copies for case l (`cloud_content_restore`, `cloud_setup`, `cloud_content_backup`) and case m (`network-base-setup`) as `:342`/`:422` do for other cases, so `BASE_REF=53f390b1e9 … --old` fails l and m and the header says so; put `${TMP}/bbin` first on case m's PATH (its `sed -n 's/…\{0,1\}…/'`, `tr -cd`, `cut -c1-4`, `head -1` run as GNU today); when a build root is present, shim `tar` too for case k's restore (`-X` semantics are busybox's on the device — proven on guest c by hand, not by the suite); fix the duplicated `[ -s "${LL}/fn.sh" ]` at `:632`.
- **Where:** `tools/last-good-scripts-test:60` (header), `:93`, `:342`, `:422` (old-copy fetches), `:111` (shim list), `:617-627` (case m sandbox PATH), `:632`
- **Why:** the run at 06:06 with `BASE_REF=53f390b1e9 --old` failed only case k; l's eleven and m's nine checks passed against the current scripts. A check nobody has seen fail is a check with no evidence — and case m's "calls neither hostnamectl nor avahi-set-host-name" was written after the removal.
- **Evidence:** `BASE_REF=53f390b1e9 tools/last-good-scripts-test --old` → `4 CHECK(S) FAILED`, all in k.
- **Acceptance:** the same command fails checks in k, l and m; the header names all three; case m's pipeline runs through the image's busybox when a build root is present.

# Low priority

## PL-11 — `register-check`: an unlisted area and a four-digit ID pass silently; nothing runs it

- **Severity:** Low
- **Category:** Code Quality / Test Gap
- **Source finding:** F-11 *(Claude seat L-8, M-4 in part; GPT seat F-12)*
- **Owner area:** `tools/register-check`; `tools/vm-qa`
- **What:** cite pattern `D-[A-Z]+-[0-9]+\b` (any area, any width, a boundary) so `D-THEME-001` and `D-CLOUD-1234` are checked; treat a mandatory input that cannot be read as a failure; add a `register` host suite to `vm-qa` (0 s, like `vocabulary`).
- **Where:** `tools/register-check:47-56` (the pattern, twice), `:25-31`; `tools/vm-qa:~90` (host suites)
- **Why:** on a scratch copy `D-THEME-001` and `D-CLOUD-1234` (read as `-123`) both pass. The tool has fired for real (D-CLOUD-007) and here; it runs only by hand.
- **Evidence:** `01-research-notes.md` § 1.3e and `02-forward-audit.md` D-WORKFLOW-013 row.
- **Acceptance:** the two scratch citations fail; `tools/vm-qa` lists `register` among its suites.

## PL-12 — #113's ticks cite a QA-log row that does not exist and a number the log does not hold

- **Severity:** Low
- **Category:** Documentation Gap (blindspot 13)
- **Source finding:** F-12 (AC-113-1 note, AC-113-4 PARTIAL)
- **Owner area:** `docs/vm-qa-log.md`; issue #113
- **What:** add the 303 s LINK5 measurement to the QA log (the 2026-09-13 `db6b42c180` row is the natural home, as the before-figure of its 29.5 s), or reword boxes 1 and 4 to say where the number lives (the issue). There is no `e73efbc8e0` row.
- **Where:** `docs/vm-qa-log.md` rows 32, 50, 58; #113 body boxes 1 and 4
- **Why:** `grep -c '\b303\b' docs/vm-qa-log.md` → 0; `grep -c e73efbc8e0` → 0.
- **Acceptance:** the grep finds the number where the tick says it is.

## PL-13 — LINK5's receiving-side check is a SKIP that cannot fail on WebDAV, with no other run behind it

- **Severity:** Low
- **Category:** Test Gap
- **Source finding:** F-13 *(Claude seat M-5; GPT seat F-10)*
- **Owner area:** `tools/cloud-round-trip`
- **What:** run LINK5 once against MinIO (`--backend s3`) and put the date and result into the SKIP's text (or turn the SKIP into a check there); if it fails there, the script has a bug the SKIP hides.
- **Where:** `tools/cloud-round-trip:5245-5253`
- **Why:** the SKIP names the run that would settle it and nobody has recorded one.
- **Acceptance:** the SKIP text cites a MinIO run with its date, or the check runs on MinIO.

## PL-14 — four small branches fail open

- **Severity:** Low
- **Category:** Code Quality (guards must fail closed)
- **Source finding:** F-14 *(Claude seat M-2; GPT seat F-02, F-06)*
- **Owner area:** `backuptool`; `cloud_setup`; `cloud_content_restore`
- **What:** (1) `backuptool:279`: `grep -v -F -f … || true` → capture `$?` and fail on 2 (1 is "everything pruned", 0 fine); (2) `cloud_setup:195-198`: capture `rclone backend features` output, require it to parse, and take the provider's answer when bucket-ness is unknown; (3) `absent_not_broken` in both scripts: `grep -qFx -- "${name}/"`; (4) `network-base-setup:28-34`: log when `UNIT` is empty (the silent no-rename).
- **Where:** as listed
- **Why:** each defaults to "proceed" when its own machinery fails — the shape `engineering-practices.md` names.
- **Acceptance:** each branch has a failing input in a case (`grep` exit 2 via an unreadable temp; a shimmed `rclone backend features` exiting 1; a `-Name/` folder; an empty id) and refuses or logs.

## PL-15 — the register and two comments say more than the code does

- **Severity:** Low
- **Category:** Documentation Gap
- **Source finding:** F-15, F-16 *(Claude seat M-8, L-4, L-2 in part; GPT seat F-14)*
- **Owner area:** `docs/decision-register.md`; `backuptool`; `cloud_setup`; ES `CLAUDE.md`, `.githooks/pre-push`
- **What:** (1) a D-CLOUD-008 addendum row: a file at the image default on the source device is not carried, so a restore applies the source's *deviations*, and a stale-but-unedited seed does travel — the maintainer accepts or asks for a manifest; (2) `backuptool:275-276` "prefix" → "substring"; (3) `cloud_setup:129-131`'s "a cloud that never answers is a refusal in 30 s" covers only `absent_not_broken` — bound the pre-existing `rclone lsd` at `:184` too, or narrow the comment; (4) ES `CLAUDE.md:30-34`: `python3 tests/cloud-oauth-lifetime.py` runs from the ES checkout — say so; (5) ES `.githooks/pre-push:5`: `upstream/next` → `upstream/master`; (6) the dead `SKIP=""` deletion in the zip branch is harmless (no `set -u`) — note or restore; (7) the pre-range string `SCREENSCRAPER NEEDS A DEVELOPER ID AND PASSWORD.\nENTER YOURS UNDER OPTIONS…` → `SCRAPER > OPTIONS` like its siblings (French too).
- **Where:** as listed
- **Acceptance:** each text matches the code it describes; `register-check` still passes.

## PL-16 — no issue tracks D-UI-051's follow-up; #42's list is five items short

- **Severity:** Low
- **Category:** Missing Artifact / Documentation Gap
- **Source finding:** F-17
- **Owner area:** the tracker; #42
- **What:** file "French for the rest of the fork's strings (D-UI-051 follow-up)" with acceptance criteria (every fork `_()` string since 2026-08 has a `fr` msgstr; a script that lists the untranslated ones); append to #42: the per-unit device name and its rule, `.local` answering, scraper filters kept, the WEB API KEY row, the ScreenScraper messages.
- **Why:** D-UI-051 says "a follow-up"; `gh issue list --search French` finds none. `documentation-accuracy.md`'s gate is satisfied by D-WORKFLOW-014's ordering only if the list is complete when the page is written.
- **Acceptance:** the issue exists on the milestone; #42's body lists the five.

## PL-17 — `helpRowPerc` measures an unthemed help font in the constructor; seven ScreenScraper strings are unframed at 640x480

- **Severity:** Low
- **Category:** Code Quality / Test Gap
- **Source finding:** F-18 *(Claude seat L-1, L-9)*
- **Owner area:** ES `GuiSaveState.cpp`; `docs/qa-frames/`
- **What:** pass the theme into `helpRowPerc` (or call it only after `mTheme` is set) so the constructor's `gridHeight` and `onSizeChanged`'s agree, and drop the `!= nullptr` guard that hides the disagreement; frame the seven status messages (401, 423, 426, 429, 430, 431, default) at 640x480 in English and French — a shimmed `API_URL_BASE` returning each status does it on a guest.
- **Where:** `GuiSaveState.cpp:112-118`, `:240-263`; `ScreenScraper.cpp:987-1004`
- **Acceptance:** the two `helpSize` values are equal in a debug log at 640x480 and 1280x800; fourteen frames exist.

## PL-18 — D-NET-003 and #50 box 6 record a mechanism the image does not carry

- **Severity:** Low (the code half is PL-01)
- **Category:** Documentation Gap (decision-register; issue-tracking)
- **Source finding:** F-01 (the record half)
- **Owner area:** `docs/decision-register.md`; issue #50
- **What:** a new row citing D-NET-003: the unit that shipped was avahi's stock one until PL-01; the ordering held on two guests by luck and failed on one; the `avahi.disabled` sentence is false on the shipped unit and, on the fork's, inert once `avahi.conf` exists — state what the off-switch actually is (remove `avahi.conf` **and** create `avahi.disabled`, or an ES toggle). Untick or reword #50 box 6 until PL-01's image is framed.
- **Why:** `decision-register.md` § Write a row when: a standing assumption is invalidated.
- **Acceptance:** the row exists; `register-check` passes; #50 box 6 describes the shipped state.

---

## Observations recorded, no punch item

- `cloud_content_restore --scan` on a bucket remote whose bucket does not exist reads the root's listing (no such name) as "not there yet" — an empty cloud rather than a fault. Not the FTP case; the setter refuses such a name; recorded for the day a scan meets it.
- A `GuiMsgBox` on top of the save state manager gets no help bar at 640x480 (a third page under full-screen menus). Pre-existing for every dialog on a small panel.
- `SystemData::rescanChangedFolders` cannot refresh a system that did not exist at boot (an empty screenshots folder at boot → no SCREENSHOTS entry until the next boot). Noted on #82 by the implementer, not filed.
- `network-base-setup` calls a tool from another package without a declared dependency; `synctools` is unconditional in the image today.
- The identity prune cannot tell an edited file from an unedited seed the image has since changed; both travel. A limit of the rule, recorded in PL-15's addendum.
- `GridTextProperties` now honours `<multiLine>`; no shipped theme sets it (0 in the art-book-next XML), so nothing changes for them.
- `strings` on the built ES finds one `devpassword=` — the URL parameter name in `screenScraperDevLogin()`, not a value; `tools/fork-publish-release`'s embedded-credential test keys on that literal and would refuse a public publish of every fork build. Out of this range's scope; worth a look before the next publish.

## Pre-existing tracked scope (NOT punch items — exempt from the resolution gate)

- **#129 PL-06** — an exit sync ES declines to start reports nothing (`FileData.cpp:904`); untouched in this range; open on #129/#139.
- **#129 PL-07 / #42** — the rocknix.org docs; D-WORKFLOW-014 says last before the PR; PL-16 adds five items to its list.
- The **seventeen unticked boxes** in their issues, all handheld/LAN/maintainer-owned or explicitly not yet pressed: #45-3; #50-2, -7; #66-6; #67-3, -4, -7, -8; #68-6; #69-5, -6; #82-4; #113-3. They stay where they are.
- **#53** — the size-only comparison D-CLOUD-008 narrows and does not close.
- **#131** — the QA handheld's own cloud accounts (D-QA-016's remaining box).

---

## Machine-readable index

```yaml
punch_index:
  - id: PL-01
    severity: High
    category: Acceptance Criteria Gap
    source_finding: F-01
    owner_area: projects/ROCKNIX/packages/network/avahi; tools/last-good-scripts-test; tools/vm-qa
    where: projects/ROCKNIX/packages/network/avahi/package.mk:81-99
    acceptance: "the built avahi-daemon.service lists network-base.service in After=; ten pair boots publish the kernel hostname; case m reads the built unit; pair-identity asserts the mDNS name"
    outcome: resolved
  - id: PL-02
    severity: High
    category: Interaction Defect
    source_finding: F-02
    owner_area: projects/ROCKNIX/packages/sysutils/systemd/scripts/network-base-setup; backuptool
    where: projects/ROCKNIX/packages/sysutils/systemd/scripts/network-base-setup:26
    acceptance: "after restoring unit a's settings on unit b and rebooting, pair-identity reports two names; the choice is a register row"
    outcome: resolved
  - id: PL-03
    severity: Medium
    category: Acceptance Criteria Gap
    source_finding: F-03
    owner_area: backuptool; tools/last-good-scripts-test; docs/decision-register.md
    where: projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:578-600
    acceptance: "a zip fixture in case k passes on the fixed script and fails under --old; D-CLOUD-008 has its addendum"
    outcome: resolved
  - id: PL-04
    severity: Medium
    category: Interaction Defect
    source_finding: F-04
    owner_area: network-base-setup; cloud_device_id
    where: projects/ROCKNIX/packages/sysutils/systemd/scripts/network-base-setup:28-34
    acceptance: "on a fresh-flashed H700 the stored id equals the MAC hash on two flashes, or the first boot logs that the adapter was absent and keeps the shipped name"
    outcome: resolved
  - id: PL-05
    severity: Medium
    category: Acceptance Criteria Gap
    source_finding: F-05
    owner_area: emulationstation-next GuiMenu.cpp openRestoreRelink; issue #47
    where: es-app/src/guis/GuiMenu.cpp:7269-7272
    acceptance: "a 640x480 frame with every row at two lines or fewer and the empty circle visible; #47's body matches its state"
    outcome: resolved
  - id: PL-06
    severity: Medium
    category: Acceptance Criteria Gap
    source_finding: F-06
    owner_area: emulationstation-next ScreenScraper.cpp; issue #66; tools/qa-accounts
    where: es-app/src/scrapers/ScreenScraper.cpp:1019-1030
    acceptance: "bogus pair + no account names the pair, or #66 box 3 says otherwise and why; the frame is from the pinned commit"
    outcome: resolved
  - id: PL-07
    severity: Medium
    category: Cornerstone Violation
    source_finding: F-07
    owner_area: emulationstation-next ScreenScraper.cpp
    where: es-app/src/scrapers/ScreenScraper.cpp:976-1035
    acceptance: "offline and probe-timeout frames at 640x480 in English and French name no credential"
    outcome: deferred:#156
  - id: PL-08
    severity: Medium
    category: Cornerstone Violation
    source_finding: F-08
    owner_area: .githooks/pre-push (both repos)
    where: .githooks/pre-push:108-154
    acceptance: "three negative tests refuse in both repos, recorded"
    outcome: resolved
  - id: PL-09
    severity: Medium
    category: Cornerstone Violation
    source_finding: F-09
    owner_area: tools/qa-accounts
    where: tools/qa-accounts:43-52
    acceptance: "no value in ps during a write; clear fails on a dead port; a missing es_settings.cfg is refused; 10020/10021 rejected"
    outcome: resolved
  - id: PL-10
    severity: Medium
    category: Test Gap
    source_finding: F-10
    owner_area: tools/last-good-scripts-test
    where: tools/last-good-scripts-test:342
    acceptance: "BASE_REF=53f390b1e9 --old fails checks in k, l and m; case m runs on the image's busybox when a build root is present"
    outcome: resolved
  - id: PL-11
    severity: Low
    category: Test Gap
    source_finding: F-11
    owner_area: tools/register-check; tools/vm-qa
    where: tools/register-check:47-56
    acceptance: "D-THEME-001 and D-CLOUD-1234 citations fail; vm-qa lists a register suite"
    outcome: resolved
  - id: PL-12
    severity: Low
    category: Documentation Gap
    source_finding: F-12
    owner_area: docs/vm-qa-log.md; issue #113
    where: docs/vm-qa-log.md:58
    acceptance: "grep finds 303 where #113's tick says it is"
    outcome: resolved
  - id: PL-13
    severity: Low
    category: Test Gap
    source_finding: F-13
    owner_area: tools/cloud-round-trip
    where: tools/cloud-round-trip:5245-5253
    acceptance: "the SKIP cites a MinIO run with its date, or the check runs there"
    outcome: resolved
  - id: PL-14
    severity: Low
    category: Code Quality
    source_finding: F-14
    owner_area: backuptool; cloud_setup; cloud_content_restore; network-base-setup
    where: projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:279
    acceptance: "each of the four branches has a failing input in a case and refuses or logs"
    outcome: resolved
  - id: PL-15
    severity: Low
    category: Documentation Gap
    source_finding: F-15
    owner_area: docs/decision-register.md; backuptool; cloud_setup; ES CLAUDE.md and pre-push
    where: docs/decision-register.md
    acceptance: "each text matches the code it describes; register-check passes"
    outcome: resolved
  - id: PL-16
    severity: Low
    category: Missing Artifact
    source_finding: F-17
    owner_area: tracker; issue #42
    where: docs/decision-register.md row D-UI-051
    acceptance: "a French follow-up issue exists on the milestone; #42 lists the five additions"
    outcome: resolved
  - id: PL-17
    severity: Low
    category: Code Quality
    source_finding: F-18
    owner_area: emulationstation-next GuiSaveState.cpp; docs/qa-frames
    where: es-app/src/guis/GuiSaveState.cpp:112-118
    acceptance: "the two helpSize values agree at both sizes; fourteen status frames exist"
    outcome: deferred:#156
  - id: PL-18
    severity: Low
    category: Documentation Gap
    source_finding: F-01
    owner_area: docs/decision-register.md; issue #50
    where: docs/decision-register.md row D-NET-003
    acceptance: "a row citing D-NET-003 states the shipped state and the real off-switch; #50 box 6 matches"
    outcome: resolved
```

---

# Phase 7 resolution gate

Phase 7 is the maintainer's. Outcomes below were re-derived on 2026-09-13 from the commits, suite runs, frames and issue edits named in each row, after the fix streams landed and the rebuilt image `d32f47a947` went through the nine runner suites, the pair proofs and the 640x480 frames (D-WORKFLOW-015: every item fixed at every severity). Two items keep a **Deferred** half, both to #156, because their remaining frames need an HTTPS shim the VM does not have; that is a harness decision, not a severity excuse.

| Item | Outcome | Evidence |
| --- | --- | --- |
| PL-01 | **Resolved** | `1d07330ae1` (recipe `rm -rf ${INSTALL}/usr/lib/systemd`, guarded re-publish), `216f3a57b0`, `d46f7fa227` (pair-identity mDNS assertion), `401a3a047c`; built unit on `d32f47a947` has `After=network.target network-base.service avahi-defaults.service`; 20 of 20 pair boots publish the kernel hostname; case m check 8 grades the built image and FAILed against the stale root; #151 box ticked |
| PL-02 | **Resolved** | `5cfeeabb8c` + D-NET-004 (default fix): a's archive restored on b -> b reboots as `GENERIC-X64-0964` logging "another unit's shipped default ... carried here by a settings restore"; `Max Deck` kept as `Max-Deck`; pair-identity PASS with two names; #151 box ticked |
| PL-03 | **Resolved** | `9e811f240d` + D-CLOUD-124: legacy `ROCKNIX_BACKUP.zip` restored on guest a left `assets/lang/en_US.ini` and CACHE at their md5s and brought `ppsspp.ini` in; case k zip fixture FAILs under `--old`; #45 box 4 names both archive kinds; #151 box ticked |
| PL-04 | **Resolved** (VM half); device proof on #150 | `9d71a829fe` + D-NET-005: `cloud_device_id --if-present`; case m with a fake `/sys/class/net`, 8 checks FAIL at `6e09b6fcca`; the two fresh H700 flashes are a #150 criterion; #151 box ticked |
| PL-05 | **Resolved** | ES `15bfd5e81` (pinned `c694d733c6`): rows one line under the label at both panels, measured; frames `finish-restore-process-no-wifi-top/bottom-640x480-d32f47a947.png` (+`-fr`) with the empty circle on WI-FI PASSWORD; #47 reopened, boxes 2-5 ticked; #151 box ticked. The NETWORK SETTINGS row that leads to the page is #155 |
| PL-06 | **Resolved** | ES `2842af2d0`: probe before the account check; frame `screenscraper-rejected-developer-pair-no-account-640x480-d32f47a947.png` (+`-fr`) from the pinned commit; #66 box 3 reworded to the shipped ordering and SCRAPER > ACCOUNTS; #151 box ticked |
| PL-07 | **Resolved** for the offline sentence; **Deferred** to #156 for the probe-unknown frame | ES `5a0095455`: `REQ_IO_ERROR`/status 0 -> `YOU'RE NOT ONLINE. TRY AGAIN WHEN YOU ARE.`, framed EN/FR (`screenscraper-not-online-640x480-d32f47a947.png`); tri-state probe in code, French present; `COULDN'T REACH SCREENSCRAPER. TRY AGAIN.` cannot be reached on the VM (every IO failure meets the guard first; the HTTPS API needs the #156 shim) |
| PL-08 | **Resolved** | distribution hook `17dbb85b88`, ES hook `51edcf728c`: every pushed commit's added lines scanned, `pr/*` keyed on the remote ref, missing base refused; three negative tests recorded in each header; #151 box ticked |
| PL-09 | **Resolved** | `ac7b17554c`: values over ssh stdin (no value in `ps`), `clear` fails on a dead port, missing/unparseable `es_settings.cfg` refused, ports `1002[2-9]`; #151 box ticked |
| PL-10 | **Resolved** | `00d6bfaaad`, `401a3a047c`: `BASE_REF=53f390b1e9 --old` -> 36 FAIL (k 6, l 13, m 17), normal 130 PASS from the primary on the image busybox; #151 box ticked |
| PL-11 | **Resolved** | `4b219ef937`: `D-[A-Z]+-[0-9]+\b`, unreadable input fails, `register` suite in `vm-qa`; scratch `D-THEME-001`/`D-CLOUD-1234` -> MISSING; #151 box ticked |
| PL-12 | **Resolved** | `1ee141207f`: 303 s in the `db6b42c180` row; #113 boxes 1 and 4 re-pointed; #151 box ticked |
| PL-13 | **Resolved** | `96284d5544`: throttled S3 endpoint; LINK5 on MinIO at 40 s and 120 s with every receiving-side check PASS and no SKIP; WebDAV SKIP texts cite the run. The unbounded S3 deliberate run it exposed is #153; #151 box ticked |
| PL-14 | **Resolved** | `e18916ff7e`: four branches fail closed, each with a failing input in the suite (3 FAIL under `BASE_REF=6e09b6fcca --old`); #151 box ticked |
| PL-15 | **Resolved** | `91f14ad20a` (D-CLOUD-125, "substring", bounded `lsd`), `9e811f240d` (part 6), ES `ee53ecd65` (CLAUDE.md, hook comment, SCRAPER > ACCOUNTS -- where the fields are; `device-builds.md` corrected `ff46dc2310`); #151 box ticked |
| PL-16 | **Resolved** | #152 filed (French follow-up); #42 carries the five surfaces; #151 box ticked |
| PL-17 | **Resolved** for `helpRowPerc`; **Deferred** to #156 for the fourteen status frames | ES `772d70035`: `helpRowPerc(float, const HelpStyle&)`, guard gone, debug log; `GuiSaveState: help row 0.164167 of a 264 px sheet` equal for constructor and onSizeChanged at 640x480 (1280x800 measured separately, see the #151 comment); all seven status msgids have French msgstrs; the frames need the #156 shim |
| PL-18 | **Resolved** | D-NET-006 `d32f47a947`; #50 box 6 reworded to the shipped state and re-ticked after the 20 boots; #151 box ticked |

**Gate status:** 18 of 18 items carry an outcome with evidence; 16 Resolved in full, 2 Resolved in code and framed where the VM can reach, Deferred to #156 for the frames it cannot. Side findings filed on their own: #153, #154, #155, #156. The device proofs (PL-04's two flashes; #50's LAN boxes) ride #150's staging round.

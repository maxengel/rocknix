# Council seat 2-wifi — adversarial code audit

Corpus: the five embedded sources (paths and sha256 recorded in the Provenance appendix). Line numbers below are the post-change file's, computed from the hunk headers in `seats/2-wifi.diff`; nothing outside that diff was read.

---

## 1. Summary

The bucket adds four `wifictl` subcommands (`current`, `saved`, `forget`, `join`) that read and act on NetworkManager profiles instead of the `wifi.ssid`/`wifi.key` settings, and rebuilds the EmulationStation Wi-Fi picker (`GuiWifi`) around them with a pure text module (`WifiText`) and doctest coverage for its parsers. The shell side is careful about nmcli's terse escaping and quoting, and the C++ side keeps names byte-exact and avoids blocking the interface thread; no credential is printed or logged, and no personal path or secret appears in the diff. The design leaves one seam untreated: `join` moves `wifi.ssid`/`wifi.key` onto the joined profile so the settings-driven connect paths stay coherent, but `forget` leaves those settings naming the forgotten network and its key (F-WF-01), so the paths `join` was reconciling can recreate what the player just forgot. `join` also writes `wifi.key` from an unchecked `nmcli -s -g` read, so a failed read is indistinguishable from an open network and clears the key of a network the device is on (F-WF-02). The picker discards the "could not ask" answers the script was written to distinguish (F-WF-03), and `current_wifi` uses `${WIFI_DEV}` without the `wait_for_wifi` every other device-touching function in view calls (F-WF-04, low confidence — the assignment is outside the packet). The bucket is not self-contained: `ApiSystem`, `GuiMenu` (the changed `GuiWifi` constructor's caller and the MANAGE SAVED NETWORKS page), CMake wiring, and the French `.po` are all outside this diff, so buildability and the forget UI cannot be judged here.

---

## 2. Findings

### F-WF-01: `forget` deletes the profile but leaves `wifi.ssid`/`wifi.key` naming the forgotten network
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:226-236` (`forget_wifi`)
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:242-249` (`join_wifi` comment naming the settings-driven connect paths and `pin_wifi`)
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:262-264`
  - `es-app/src/guis/GuiWifi.cpp:158-159` (the message that sends a player through forget)
- **What:** `forget_wifi` acts only on NetworkManager. When the forgotten profile is the one `wifi.ssid`/`wifi.key` name (which `join_wifi` and `GuiWifi::connect` guarantee for the network last joined), the settings still hold its name and key, and every path the diff says connects from the settings will rebuild it.
- **Failure scenario:** `wifi.ssid=Home`, `wifi.key=K` (set by `join` at 262-263 or by `GuiWifi::connect` at 204-206). Player forgets Home; `forgotten` and `disconnected` print. `system.cfg` still holds `Home`/`K`. The next settings-driven connect — the ENABLE WI-FI switch, the WI-FI KEY row, the restore wizard (named at 246-247) — runs `connect`, which per 242-243 "deleted the profile and rebuilt it from the WI-FI KEY setting": Home is back in MANAGE SAVED NETWORKS with the key the player asked to forget, and `pin_wifi` (248-249) "prefers this network at the next boot and resume". Meanwhile the forgotten network's key stays in `system.cfg` and travels in the settings backup.
- **Evidence:** `forget_wifi` body is `saved_wifi` → awk match → `nmcli connection delete id` → two echoes; no `set_setting` and no `get_setting wifi.ssid` comparison. Refutation attempted: looked for the settings clear in the ES forget flow — that flow lives in `GuiMenu` (per `WifiText.h:9-10`), which is outside the packet, so it could be done there; the script, which is the layer that owns the settings coupling for `join`, does not do it.
- **Fix:** In `forget_wifi`, after the delete, if `$(get_setting wifi.ssid)` equals `${name}`, clear `wifi.ssid` and `wifi.key` (and unpin), and print a third token (`unset`) so the interface can say the device will not rejoin it automatically. Add a `WifiText::parseForget` field for it, with a test.
- **Confidence:** medium — the settings-driven rebuild paths are asserted by the diff's own comments, but `connect`, `pin_wifi` and the boot path are outside the packet.

### F-WF-02: `join` writes `wifi.key` from an unchecked read; a failed read is indistinguishable from an open network and clears the key
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:261-263`
- **What:** `psk=$("${NMCLI}" -s -g 802-11-wireless-security.psk connection show id "${name}" 2>/dev/null)` has no exit-status check and no `key-mgmt` check; `set_setting wifi.key "${psk}"` then writes whatever came back, including the empty string a failed read produces.
- **Failure scenario:** `connection up` succeeds at 259 (device is now on Home). The secrets read at 261 fails (NetworkManager slow or not answering on D-Bus — the condition the diff cites as fork #102 in `GuiWifi.cpp:24-25`), or the profile is 802-1x with no psk. `wifi.ssid=Home`, `wifi.key=""`. The interface toasts CONNECTED TO Home. The next settings-driven connect (ENABLE WI-FI, restore wizard, per 246-247) rebuilds Home's profile with an empty key, destroying the working profile; the device is off its network and MANAGE SAVED NETWORKS shows a Home that cannot join.
- **Evidence:** lines 261-263 as quoted; contrast `rows=$(saved_wifi) || return 2` at 255 and `|| return 1` at 259, where the same author checks status. Refutation attempted: looked for a `key-mgmt` query or a `[ -n "${psk}" ]` guard — none. The style guide § Saving ("apply a credential only when it is non-empty *and* changed, so opening an editor and backing out cannot clear it") is the rule this writes past.
- **Fix:** Read `802-11-wireless-security.key-mgmt` first. If it is empty/`none`, write `wifi.key ""` (open network). Otherwise require the psk read to exit 0 and return non-empty; on failure leave `wifi.key` untouched and print `joined` plus a token the UI can act on, or exit 2.
- **Confidence:** medium — the unconditional write is certain; how often the read fails on the device's NetworkManager is not visible from the packet.

### F-WF-03: The picker collapses "could not ask" into "none", the distinction the script was written to preserve
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `es-app/src/guis/GuiWifi.cpp:262-263` (return values of `getSavedWifiNetworks` / `getCurrentWifiSsid` discarded)
  - `es-app/src/guis/GuiWifi.cpp:274-276`
  - `es-app/src/guis/GuiWifi.cpp:157-159` (the join failure message)
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:189-192, 204-205, 250-251`
- **What:** `current_wifi` exits 2 and `saved_wifi` exits 1 "so a caller cannot read a silence as 'not connected'" / "an empty list and no list are different answers". `GuiWifi::onRefresh` ignores both results and builds rows from whatever landed in `answer.saved` and `answer.current`, so a failed answer produces a list with no CONNECTED row and no SAVED marks.
- **Failure scenario:** `list` succeeds (it has its own wait), `saved`/`current` fail or hit ApiSystem's time-box (the comment at 248-251 says they are time-boxed; the box is outside the packet), or `current` fails for the reason in F-WF-04. The player sees their own network unmarked, presses it, is asked for a key (`onSelect` → `askKeyAndConnect`, 99-102), and `connect` — per `wifictl:242-243` — deletes and rebuilds the profile of the network the device is on: the live connection drops and the profile is replaced with whatever was typed. Separately, when `join` returns 2 (NetworkManager not answering), the box at 158-159 tells the player their key has changed and to forget the network — advice that, followed, triggers F-WF-01.
- **Evidence:** `ApiSystem::getInstance()->getSavedWifiNetworks(answer.saved);` and `...getCurrentWifiSsid(answer.current);` as bare statements; `pickerRows` (`WifiText.cpp:56-86`) marks only from `saved`/`current`. Refutation attempted: the ApiSystem methods might return `void`, or throw — their signatures are outside the packet; the discard is certain either way.
- **Fix:** Have the two ApiSystem shells return a tri-state (answered / none / could not ask) and carry it in `Answer`; when either is "could not ask", show the list unmarked with a one-line notice (`COULDN'T CHECK WHICH NETWORKS ARE SAVED.`) and make the join-failure text depend on exit code (2 → `COULDN'T REACH WI-FI SETTINGS. TRY AGAIN.`, 1 → the key advice).
- **Confidence:** medium — the discard is visible; the consequences route through ApiSystem and `connect`, both outside the packet.

### F-WF-04: `current_wifi` uses `${WIFI_DEV}` without `wait_for_wifi`, unlike every other device-touching function in view
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:193-199` (`current_wifi`)
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:269-270` (context: `has_ap_mode() { wait_for_wifi`)
- **What:** `current_wifi` runs `nmcli ... device wifi list ifname "${WIFI_DEV}" --rescan no`. The only other function whose body touches the adapter in the packet (`has_ap_mode`) opens with `wait_for_wifi`, and `GuiWifi.cpp:21-23` describes `list` as waiting "for the adapter" first. If `WIFI_DEV` is assigned inside `wait_for_wifi` rather than at file scope, every `wifictl current` — a fresh process — runs with an empty `ifname` and returns 2.
- **Failure scenario:** `WIFI_DEV` unset → `nmcli device wifi list ifname "" --rescan no` fails → exit 2 → `answer.current` empty on every open of the picker → no CONNECTED row ever; F-WF-03's path opens on the device's own network every time.
- **Evidence:** the asymmetry quoted above; the file-scope lines visible (`wifictl:31-33`: `WIFI_TYPE`, `NETWORK_ADDRESS`) do not include `WIFI_DEV`. Refutation attempted: looked for a file-scope `WIFI_DEV=` in the context lines — not present in the hunks, which does not mean absent from the file.
- **Fix:** Either call `wait_for_wifi` at the top of `current_wifi` (accepting its wait), or drop the `ifname` filter and read the active connection directly: `nmcli -t -f NAME,TYPE,DEVICE connection show --active` filtered on `wireless`, which also removes the SSID/profile-id mismatch in F-WF-12.
- **Confidence:** low — depends on where `WIFI_DEV` is assigned, which is outside the packet; the check is a one-line grep for the punch-list owner.

### F-WF-05: `saved`/`current` are unescaped; if `list` is not, exact-match marking and the CONNECTED row split for names with `:` or `\`
- **Severity:** Medium
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:181-187, 196, 213` (`nm_unescape` applied to `current` and `saved` only)
  - `es-app/src/WifiText.cpp:56-86` (`pickerRows` compares names byte-exact)
  - `es-app/src/guis/GuiWifi.cpp:261-263` (three sources merged)
- **What:** The diff introduces `nm_unescape` because "nmcli -t ... escapes a ':' or '\' inside a value", and applies it to the two new readers. `list_wifi` (unchanged, outside the packet) feeds the third input to `pickerRows`; if it still emits terse output as-is, the same network arrives as `Cafe\: Guest` from the scan and `Cafe: Guest` from `current`/`saved`.
- **Failure scenario:** SSID `Cafe: Guest`, saved and joined. Picker shows a CONNECTED row `Cafe: Guest` and a second, unmarked row `Cafe\: Guest` (not deduplicated: `listed()` compares exactly). Pressing the second asks for a key and calls `connect` with an SSID that does not exist.
- **Evidence:** the escaping model is stated at 181-184 and honoured at 196 and 213; nothing in the packet applies it to the scan. Refutation attempted: `list_wifi` might already unescape or use a non-terse format — cannot be seen; the `sleep 2; list_wifi` context at 326-327 shows only that it exists.
- **Fix:** Apply `nm_unescape` in `list_wifi` (or move all unescaping to one place, e.g. a helper both `list` and `current` call), and add a `pickerRows` test with a colon name arriving from all three inputs.
- **Confidence:** low — `list_wifi` is outside the packet.

### F-WF-06: A name containing a tab parses in ES but can neither be joined nor forgotten by the script
- **Severity:** Low
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:230, 256` (`awk -F'\t' '$1 == ENVIRON["NAME"]'`)
  - `es-app/src/WifiText.cpp:14` (`rfind('\t')`), `es-app/src/WifiText.h:33-35`
  - `es-app/tests/unit/WifiTextTests.cpp:35-36`
- **What:** `saved_wifi` prints `<name>\t<flag>`; the C++ side deliberately reads the flag after the *last* tab so a tab inside a name survives, and the test enshrines it. The script's own matchers split on `\t` and compare `$1`, which is only the part before the first tab, so `join a\tb` and `forget a\tb` return 1 for a profile the interface just listed as SAVED.
- **Failure scenario:** profile id `a<TAB>b` → picker marks it SAVED → press → `wifictl join` exits 1 → box says its key changed → forget also exits 1 → the player cannot act on the network.
- **Evidence:** lines quoted. Refutation attempted: nmcli does not escape tabs in terse output, so nothing upstream of awk removes them; NetworkManager does not forbid tabs in `connection.id`.
- **Fix:** Match on everything before the last tab in awk (`sub(/\t[^\t]*$/, "")` then compare), or reject tab-bearing names symmetrically in both layers and drop the test that promises them.
- **Confidence:** high — both sides are in the packet; the path is rare.

### F-WF-07: `forget` reports NetworkManager-unreachable as a refusal (exit 1), unlike `current` and `join`
- **Severity:** Low
- **Category:** Convention
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:229` (`rows=$(saved_wifi) || return 1`)
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:22-24` (usage: only exit 1 documented)
  - compare `wifictl:195` (`|| return 2`), `wifictl:255` (`|| return 2`)
- **What:** `join` and `current` reserve exit 2 for "could not be asked" so "a caller cannot read a silence as a refusal"; `forget` folds that case into exit 1 with "not a remembered network".
- **Failure scenario:** none demonstrated beyond wrong advice: the interface cannot tell "no such network" from "NetworkManager did not answer" and must show one message for both.
- **Evidence:** lines quoted. Refutation attempted: the comment at 221-223 documents the collapse as intended, but the stated reason for exit 2 elsewhere applies equally here.
- **Fix:** `rows=$(saved_wifi) || return 2` and document it in the usage block; `parseForget` needs no change.
- **Confidence:** high.

### F-WF-08: Toast text built by concatenation, unlike the format-string idiom used above it
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiWifi.cpp:219` (`_U("\uF058  ") + _("CONNECTED TO") + " " + name`)
  - compare `es-app/src/guis/GuiWifi.cpp:158, 201` (`Utils::String::format(_("COULDN'T CONNECT TO %s.").c_str(), name.c_str())`)
- **What:** `_("CONNECTED TO")` is a translated fragment whose position relative to the name is fixed in C++, so a translation cannot reorder it; the same file uses `%s` two functions above.
- **Failure scenario:** none demonstrated in English; a French msgstr cannot place the name where French would.
- **Evidence:** lines quoted. Refutation attempted: the style guide's own toast example (`REBOOT REQUIRED TO APPLY...`) has no placeholder, so the shape is not mandated; the inconsistency within the file is.
- **Fix:** `Utils::String::format(_("CONNECTED TO %s").c_str(), name.c_str())`.
- **Confidence:** high.

### F-WF-09: The four new `wifictl` subcommands have no script-level test in the packet, and they run under busybox `sed`/`awk`/`head`
- **Severity:** Low
- **Category:** Test gap
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:185-267`
  - rule: `.claude/rules/upgrade-and-install.md` § "And under the device's tools, not the host's"
- **What:** The C++ parsers have thirteen doctest cases; the shell that produces the lines they parse — the escaping model at 181-187, the right-anchored field split at 210-213, the `ENVIRON` whole-name match at 230/256 — has none. The rule names `sed awk head` as applets whose busybox behaviour differed from the host's before (blindspot 34) and asks for tests run through the image's busybox with real fixtures.
- **Failure scenario:** none demonstrated — I traced `-F'\t'` (busybox unescapes the `-F` argument), `ENVIRON`, the `?:` in `print`, and the BRE in `nm_unescape`, and found no busybox divergence; the point is that nothing in the packet did the same on the device's binary.
- **Evidence:** absence in the diff; `tools/last-good-scripts-test` is named by the rule as the pattern.
- **Fix:** Add fixtures (captured `nmcli -t` output with a colon name, a backslash name, a wired profile, an empty list) and assert `saved_wifi`/`current_wifi` output and exit codes through the build root's busybox, in the same harness the rule describes.
- **Confidence:** high that the test is absent from the packet; it may exist in a bucket not embedded here.

### F-WF-10: Fork-internal references and stale row names in comments destined upstream
- **Severity:** Low
- **Category:** Upstream fit
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:17, 175, 239-241` (`fork #191`, "the maintainer's paradigm of 2026-09-15", "the WI-FI SSID row")
  - `es-app/src/WifiText.h:5, 45-49`, `es-app/src/guis/GuiWifi.h:9-12`, `es-app/src/guis/GuiWifi.cpp:24-25` (`fork #102`, `D-UI-071`)
- **What:** Issue numbers, decision-register IDs and dated conversations mean nothing to an upstream reader; and `wifictl:240` still calls the row WI-FI SSID while `GuiWifi.h:10` and `WifiText.h:46-47` say D-UI-071 renamed it WI-FI NETWORK — the packet disagrees with itself about the name of the row it documents.
- **Failure scenario:** none demonstrated.
- **Evidence:** lines quoted.
- **Fix:** Strip tracker references from code comments before submission (keep the behavioural explanation), and use the current row name in `wifictl`.
- **Confidence:** high.

### F-WF-11: The same fact is CONNECTED on the picker and IN USE on the page beside it
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiWifi.cpp:60-62, 75` (`_("CONNECTED")`, "the shape of MANAGE SAVED NETWORKS' IN USE")
- **What:** The comment says the right-hand mark copies the shape of MANAGE SAVED NETWORKS' IN USE, then uses a different word for the same state. `es-player-text.md` places `least-surprise.md` ("same thing, same place, same words") above itself.
- **Failure scenario:** none demonstrated.
- **Evidence:** the comment is the only evidence; MANAGE SAVED NETWORKS is outside the packet.
- **Fix:** Pick one word for "the network the device is on" across both pages and the toast (`CONNECTED TO`).
- **Confidence:** medium.

### F-WF-12: `current`/`list` speak SSID; `saved`/`join`/`forget` speak profile id; the picker treats them as one namespace
- **Severity:** Low
- **Category:** Correctness
- **Where:**
  - `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:195-196` (SSID from the AP list), `208-213` (NAME from profiles), `232, 259` (`id "${name}"`)
  - `es-app/src/WifiText.cpp:56-86`, `es-app/src/WifiText.h:62-67` ("Names compare exactly, as NetworkManager does")
- **What:** A profile's `connection.id` defaults to the SSID but need not equal it (NetworkManager's own dedup appends ` 1`; a profile can be renamed). `pickerRows` marks a scanned SSID SAVED only when a profile has that exact id, and `join` is issued with the SSID as the id.
- **Failure scenario:** profile `Home 1` for SSID `Home`. Picker lists `Home` unmarked; pressing it asks for a key and `connect` creates another profile; MANAGE SAVED NETWORKS now shows `Home 1` and `Home`. The CONNECTED row for `Home` is marked unsaved though the device joined it from a saved profile.
- **Evidence:** lines quoted. Refutation attempted: profiles created by ROCKNIX's `connect` are presumably named by SSID (the comment at 242-243 describes delete-and-rebuild), so ids match for the common case; the mismatch needs a profile from elsewhere.
- **Fix:** Have `saved_wifi` print the profile's `802-11-wireless.ssid` alongside its id (or key the whole feature on ids, including `current` via `connection show --active`), and match on SSID.
- **Confidence:** medium.

### F-WF-13: New player strings without their French in the packet (D-UI-051)
- **Severity:** Low
- **Category:** Player text
- **Where:**
  - `es-app/src/guis/GuiWifi.cpp:75, 149, 158-159, 177, 179, 193, 201, 219` — `CONNECTED`, `SAVED`, `CONNECTING TO WI-FI`, `COULDN'T CONNECT TO %s.`, `IF ITS KEY HAS CHANGED, ...`, `CHECK THE KEY AND TRY AGAIN.`, `CONNECTED TO`
  - rule: `.claude/rules/es-player-text.md` § "Every fork string ships in English and French"
- **What:** The rule requires the French msgstr "in the same commit"; no `locale/lang/fr/LC_MESSAGES/emulationstation2.po` hunk is in this bucket's diff.
- **Failure scenario:** a French-language device shows these boxes in English.
- **Evidence:** absence from the diff. Refutation attempted: the diff is bucketed by topic and locale files may sit in another seat's diff — not visible from here.
- **Fix:** Add the eight msgids with French msgstrs in the file's style (accented capitals, typographic apostrophe, space before `?`/`:`), or point the audit at the bucket that carries them.
- **Confidence:** medium.

---

## 3. Upstream fit

What a ROCKNIX maintainer reviewing this pair of pull requests would push back on:

- **Two repositories, one feature, three moving parts not in this diff.** `wifictl`'s four subcommands have no consumer in the distribution repo; their consumers are `ApiSystem::joinWifiNetwork/getSavedWifiNetworks/getCurrentWifiSsid` (named at `GuiWifi.cpp:150, 262-263`), which are not in this diff, nor is the `GuiMenu.cpp` caller of the changed `GuiWifi` constructor (`GuiWifi.h:23`: three parameters, was four with a different callback type). As submitted here the ES side does not compile against an unchanged `GuiMenu`, and the script PR ships dead commands until the ES PR lands. They have to be reviewed and pinned together.
- **`join` mutates settings as a side effect of a query-shaped command** (`wifictl:262-264`). Upstream's `wifictl` reads settings; a subcommand that rewrites `wifi.ssid`/`wifi.key` and calls `pin_wifi` couples the script's contract to the fork's settings semantics. Expect a request to split "activate profile" from "adopt as the configured network", or at least to document the write in the usage block (it does, at 25-27, but only there).
- **A unit-test tree with doctest** (`es-app/tests/unit/WifiTextTests.cpp:7`, `WifiText.h:7-8` "so es-unit-tests can hold the rules"). No CMake change is in the packet; if upstream emulationstation-next has no test target, this PR introduces a framework, and the maintainer will ask where it is wired and whether it runs in their CI.
- **Comments written for the fork's decision register** (F-WF-10): `fork #191`, `fork #102`, `D-UI-071`, "the maintainer's paradigm of 2026-09-15". Also the unusually long prose comments per function; upstream style in the surrounding context (`GuiWifi.cpp` before the change) is terse.
- **Redundant `#pragma once` plus include guard** in `WifiText.h:1-3` — harmless, but not the file style of `GuiWifi.h:1` (`#pragma once` alone).
- **The `#if !WIN32` branch** at `GuiWifi.cpp:187-192` calls a two-argument `enableWifi(name, key)`; whether that overload exists upstream is outside the packet.
- **Clean on the things that most often block a fork PR:** no credentials, no personal or absolute fork paths, no debug prints; `LOG(LogInfo)` lines log the SSID only (`GuiWifi.cpp:148, 186`), never the key; all `nmcli` arguments are quoted (`wifictl:195, 232, 259, 261`). Commit hygiene is not visible from a squashed range diff.

---

## 4. Coverage boundary

Judged from the packet and stated as such; each item names what would close it.

- **`GuiMenu.cpp`** (not embedded): the WI-FI NETWORK row, MANAGE SAVED NETWORKS and its forget flow (whether it clears `wifi.ssid`/`wifi.key` — decides F-WF-01's severity), the `onJoined` callback (whether it rebuilds the page before `GuiSettings` save-funcs write a stale `wifi.ssid` back), and the `GuiWifi` constructor call.
- **`ApiSystem.cpp/.h`** (not embedded): signatures and return semantics of the three new shells (F-WF-03); the time-boxing the comments assert (`GuiWifi.cpp:250-251`); whether `parseSaved/parseCurrent/parseJoin/parseForget` are actually the parsers used (no caller for them is in the packet — only `pickerRows` is called); and **how a name reaches the shell**. A scanned SSID is attacker-chosen (any 32 bytes broadcast nearby) and, once a profile with that name exists, `join`/`forget` receive it. The script quotes correctly; whether ApiSystem builds a shell string or an argv is the security question this packet cannot close.
- **The rest of `wifictl`** (only context lines embedded): where `WIFI_DEV` is assigned (F-WF-04); whether `list_wifi` unescapes (F-WF-05); what `pin_wifi` does with a name whose profile no longer exists, and how long it can take inside `join` (it runs before `joined` is printed, `wifictl:264-265`, and the ES side budgets 90 s for the association only); `set_setting` with an empty value; whether the AP/hotspot mode's own profile is `802-11-wireless` and therefore appears in `saved` and can be joined from the picker.
- **`nmcli` behaviour on the device's NetworkManager version:** whether single-field `-g` output escapes `:`/`\` (if it does, a PSK containing either is stored escaped at `wifictl:261-263`; I lean to "not escaped" for one field and did not raise it as a finding); whether the terse `TYPE` is `802-11-wireless` on that version (the `/wireless/` match at 210 depends on it); whether the active AP of a hidden network carries its SSID in `device wifi list` after association (else `current` returns 1 while joined, contradicting `WifiText.h:60-62`).
- **`SystemConf::loadSystemConf()`** semantics (`GuiWifi.cpp:162`): whether it drops or keeps unsaved in-memory `set()`s from pages beneath the picker.
- **CMake and locale:** wiring of `WifiText.cpp` and `WifiTextTests.cpp`; whether `es-unit-tests` runs in `tools/vm-qa`; the French `.po` (F-WF-13).
- **Runtime evidence:** none in the packet — no VM or device run, no `tools/vm-upgrade-rehearsal` seed for a device upgrading with an existing `wifi.ssid` and NM profiles. The D-WORKFLOW-050 "Already written" line lives in the issue's code trace, not in a diff, so I cannot say whether it was written for #191.
- **`seats/2-wifi.manifest.json`** was referenced by the Facilitator but not embedded; I have the five sources it declared and nothing else. The gaps above should go to the orchestrator as sources to embed for a follow-up pass rather than be guessed at here.

---

## Provenance (`corpus.provenance.json`)

```json
{
  "seat": "2-wifi",
  "facilitator": "council-facilitator@1.2.0",
  "manifest": "docs/audits/2026_09_25-milestone-rc-round-since-258/seats/2-wifi.manifest.json",
  "manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "source_file_paths": [
    "/workspace/repos/rocknix/docs/audits/2026_09_25-milestone-rc-round-since-258/seats/2-wifi.diff",
    "/workspace/repos/rocknix/.claude/skills/code-auditor/references/anti-patterns.md",
    "/workspace/repos/rocknix/.claude/rules/upgrade-and-install.md",
    "/workspace/repos/rocknix/.claude/rules/es-player-text.md",
    "/workspace/repos/rocknix/.claude/rules/es-ui-style-guide.md"
  ],
  "source_file_hashes": [
    "5f0403f3a73c76c46b7c24ab664bcb3aa07d18b5004cf9cd615300efd7cc67d6",
    "fd825c0505ae772ca2a6651eefe642581aaa147c254fed8cf50db1f8f1bde678",
    "de4a683f9a36f9100e6fd98be11ad84d736f370374c40f74c445a2b81eca1995",
    "97c0816eabd3088ce94e3d45dec8042c1796afa3c295a9a8d080597ece817145",
    "150d0ac637626d771871eab48db995d8fc46c69ed7cf786240213649d264ad02"
  ],
  "hash_provenance": "sha256 values as verified and reported by the Facilitator at embed time; not re-read or re-hashed by this seat (no filesystem access)",
  "sources_needed_not_embedded": [
    "es-app/src/guis/GuiMenu.cpp (WI-FI NETWORK row, MANAGE SAVED NETWORKS, GuiWifi caller, onJoined)",
    "es-app/src/ApiSystem.cpp and ApiSystem.h (joinWifiNetwork, getSavedWifiNetworks, getCurrentWifiSsid, getWifiNetworks, enableWifi; shell quoting; time-boxing)",
    "projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl (full file: wait_for_wifi/WIFI_DEV, list_wifi, pin_wifi, connect, set_setting)",
    "es-app/CMakeLists.txt or equivalent (WifiText.cpp, es-unit-tests wiring)",
    "locale/lang/fr/LC_MESSAGES/emulationstation2.po",
    "docs/audits/2026_09_25-milestone-rc-round-since-258/seats/2-wifi.manifest.json"
  ]
}
```
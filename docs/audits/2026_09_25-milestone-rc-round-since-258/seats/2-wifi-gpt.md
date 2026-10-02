## 1. Summary

This bucket adds NetworkManager-backed current/saved/join/forget commands and changes the Wi-Fi picker from a settings editor into a connection workflow. The handoff is not ready for sign-off: a saved join can report success without moving the interface whose connection the picker displays. The saved-key transfer also passes nmcli’s escaped representation toward settings, rather than explicitly obtaining the original key. Profile names are treated as SSIDs, which misclassifies valid retained profiles whose names differ from their network names. The supplied tests exercise text parsing, not these shell-to-interface interactions; several integration questions therefore remain open.

This review uses only the embedded corpus. References S1–S5 resolve to the declared paths and Facilitator-verified hashes recorded under `corpus.provenance.json` below.

## 2. Findings

### F-WF-01: Saved join can report success on the wrong interface
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:193–214,252–267`  
  `es-app/src/guis/GuiWifi.cpp:149–163,215–222`
- **What:** Current-network reporting is scoped to `WIFI_DEV`, but saved-profile activity and activation are not. An active profile on another adapter bypasses activation and produces `joined`, even though the interface displayed by the picker remains on a different network.
- **Failure scenario:** `WIFI_DEV=wlan0` is connected to A, while another adapter has profile B active. Selecting saved network B skips `connection up`, prints `joined`, and produces a “CONNECTED TO B” toast; `current_wifi` still reports A.
- **Evidence:** S1 scopes the current query with `ifname "${WIFI_DEV}"`, but enumerates saved profiles with unrestricted `connection show`. Joining checks only `[ "${state}" != "active" ]`; even the activation command lacks an interface selector. **Refutation attempted:** looked for a device-specific active-state check or a post-activation readback before `echo "joined"`; neither appears.
- **Fix:** Resolve the selected profile to a stable identifier, activate it explicitly on `WIFI_DEV`, and verify that interface’s active connection before reporting success. Test with two wireless adapters and a profile already active on the other adapter.
- **Confidence:** high — the inconsistent interface scope and success path are visible in the supplied functions.

### F-WF-02: Saved-key transfer does not decode nmcli output
- **Severity:** High
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:181–196,244–265`
- **What:** `join_wifi` passes the result of nmcli’s terse/get-values output directly to `set_setting wifi.key`. Unlike the name-reading paths, it neither requests unescaped output nor decodes the escape representation.
- **Failure scenario:** A saved passphrase `eight:words` is returned in default escaped form as `eight\:words`. That altered string reaches the settings setter, while the function reports `joined`; a setter that preserves its argument stores the wrong key for subsequent settings-driven connections.
- **Evidence:** S1 contains `psk=$("${NMCLI}" -s -g 802-11-wireless-security.psk connection show id "${name}" 2>/dev/null)` followed by `set_setting wifi.key "${psk}"`. The same hunk documents colon/backslash escaping and provides `nm_unescape` for network names. **Refutation attempted:** found neither `--escape no` nor decoding on the PSK path. The definition of `set_setting` is outside the packet, so compensating decoding there cannot be verified.
- **Fix:** Obtain an explicitly unescaped secret, check the query’s exit status before changing settings, and preserve legitimate empty keys for open networks. Add target-tool round-trip tests for passphrases containing both colons and backslashes.
- **Confidence:** medium — the escaped-value handoff is visible; the target nmcli execution and settings setter are not supplied.

### F-WF-03: Connection profile names are substituted for SSIDs
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:206–214,252–263`  
  `es-app/src/WifiText.cpp:57–84`
- **What:** The saved-network protocol exposes NetworkManager’s connection `NAME`, but the picker compares it directly with scanned SSIDs. Joining then writes that profile name into `wifi.ssid`, although a connection name and its wireless SSID are separate values.
- **Failure scenario:** A retained profile named `Home profile` connects to SSID `Home Wi-Fi`. The scanned `Home Wi-Fi` row is not marked SAVED and asks for a key; directly joining `Home profile` writes `wifi.ssid=Home profile` instead of the actual SSID.
- **Evidence:** S1 requests `-f NAME,TYPE,ACTIVE`; `pickerRows` uses `network.name == name`; `join_wifi` writes `set_setting wifi.ssid "${name}"`. **Refutation attempted:** looked for retrieval of the profile’s wireless SSID or a profile-to-SSID mapping. Neither is present; the only profile property queried during join is its PSK.
- **Fix:** Carry profile identity separately from its SSID: use UUIDs for operations, actual SSIDs for display/matching and `wifi.ssid`, and an explicit policy for multiple profiles sharing an SSID. Test retained profiles with differing names and SSIDs.
- **Confidence:** high — the field substitution is explicit in both producer and consumer.

### F-WF-04: Tab-containing names parse successfully but cannot be acted on
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:226–231,252–257`  
  `es-app/src/WifiText.cpp:11–30`  
  `es-app/tests/unit/WifiTextTests.cpp:26–36`
- **What:** The C++ parser reads the status after the last tab, deliberately supporting tabs inside a name. The shell’s join and forget matchers instead compare only the first tab-separated field.
- **Failure scenario:** A profile named `a<TAB>b` produces `a<TAB>b<TAB>saved`. ES accepts and displays it, but both shell actions compare `a` with `a<TAB>b`, find no match, and return failure.
- **Evidence:** S1 uses `line.rfind('\t')` in C++ and explicitly tests `"a\tb\tsaved"`. Both shell actions use `awk -F'\t' '$1 == ENVIRON["NAME"] { print $2 }'`. **Refutation attempted:** the environment-based comparison preserves backslashes, but does not repair the first-field split; `nm_unescape` does not repair it either.
- **Fix:** Parse the final status delimiter consistently on both sides, or replace the name-based action protocol with a properly encoded identity-bearing format. Exercise the shell producer and both actions with the same tab fixture used by the C++ test.
- **Confidence:** high — the supplied fixture demonstrates the incompatible parsing rules directly.

### F-WF-05: Selecting CONNECTED trusts an old snapshot
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiWifi.cpp:88–128,274–276`
- **What:** Selecting a row marked connected closes the picker without checking or requesting the connection. Manual input does the same when its name matches the cached `mCurrent`.
- **Failure scenario:** The picker loads while connected to A, then NetworkManager disconnects A or autoconnects to B. Selecting the still-marked A row merely closes the picker; no attempt to join A occurs and no parent refresh callback runs.
- **Evidence:** S1 implements the connected branch as `delete this; return;`, and the manual-input branch similarly trusts `name == mCurrent`. The snapshot is assigned during refresh. **Refutation attempted:** neither selection branch performs a current-state query, invokes `join`, or calls `mOnJoined`.
- **Fix:** Revalidate the requested connection when selected, preferably through the same off-thread join/verification path used for saved networks. Close and refresh the parent only after confirming the selected network is actually current.
- **Confidence:** high — the no-op branches are explicit; the failure requires only a connection change after refresh.

### F-WF-06: Refresh results cannot represent unreadable network state
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `es-app/src/guis/GuiWifi.h:29–36`  
  `es-app/src/guis/GuiWifi.cpp:260–276`  
  `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:189–208`
- **What:** The refresh result carries only data, and the calls fetching saved/current state are used without inspecting a result. The rendering path therefore has no explicit distinction between “none” and “could not determine.”
- **Failure scenario:** The scan returns `Home`, but a failed saved-profile lookup leaves `answer.saved` empty. The picker renders Home as unsaved and routes selection to key entry rather than saved-profile activation; a failed current lookup similarly removes the connected indication.
- **Evidence:** S1 calls `getSavedWifiNetworks(answer.saved)` and `getCurrentWifiSsid(answer.current)` without retaining status. `Answer` contains no status fields, although the backend explicitly distinguishes current-query failure from no connection. **Refutation attempted:** found no unknown/retry state before `pickerRows`. ApiSystem and loading-handler error behavior are outside the packet and could affect whether this scenario reaches rendering.
- **Fix:** Carry query outcomes alongside data and handle failure explicitly. Do not interpret unknown savedness as permission to invoke the new-network connection path. Test query failure separately from a successful empty response.
- **Confidence:** medium — the missing status channel is visible; the wrappers’ failure behavior is not.

### F-WF-07: Forget leaves the settings-held copy of the network intact
- **Severity:** Medium
- **Category:** Correctness
- **Where:** `projects/ROCKNIX/packages/rocknix/sources/scripts/wifictl:226–248`  
  `es-app/src/guis/GuiWifi.cpp:204–206`
- **What:** The new forget helper removes the NetworkManager profile but does not invalidate matching `wifi.ssid`/`wifi.key` settings. Those settings are expressly retained for other connection paths; compensating caller cleanup is not shown.
- **Failure scenario:** Connect to Home through the picker, then invoke `wifictl forget Home`. The helper reports `forgotten`, but the configured name and key remain available for a later settings-driven connection to recreate the profile.
- **Evidence:** S1’s forget success path consists of profile deletion, outcome messages, and return. The join comment identifies the WI-FI KEY row, ENABLE WI-FI switch, and restore wizard as settings-driven connection paths. **Refutation attempted:** no matching-settings cleanup exists in the helper; the management page and API wrapper that might perform it are outside the packet.
- **Fix:** Make forgetting invalidate the matching settings-backed connection as well, without clearing another network’s settings. Add an end-to-end forget → enable/disable → restart test proving that the forgotten network is not recreated.
- **Confidence:** medium — retained state is evident at the helper boundary; complete caller behavior is unavailable.

### F-WF-08: Connection toast violates the supplied notification convention
- **Severity:** Low
- **Category:** Convention
- **Where:** `es-app/src/guis/GuiWifi.cpp:215–219`
- **What:** The connection toast uses the two-space row glyph prefix and a “CONNECTED TO name” sentence instead of the prescribed notification shape.
- **Failure scenario:** none demonstrated.
- **Evidence:** S1 passes `_U("\uF058  ") + _("CONNECTED TO") + " " + name`. S5, **Glyphs**, specifies one trailing space for notifications; **Waiting** specifies `<glyph> <subject> : <outcome>`. **Refutation attempted:** no local formatter supplies that shape before the notification call.
- **Fix:** Use the one-space notification prefix and a subject/outcome form, for example `<check> Home Wi-Fi : CONNECTED`, preserving the SSID’s case. Verify its fit on the target frame.
- **Confidence:** high — the literal and the supplied convention disagree directly.

## 3. Upstream fit

- **The cross-repository change needs its companion evidence.** The new constructor signature, ApiSystem methods, script verbs, and new translation unit must be reviewed with their callers, build registration, and package pin. Their omission from this bucket is not proof of a broken build, but it prevents an upstream-ready judgment.
- **The protocol needs stronger identity and encoding rules.** F-WF-02 through F-WF-04 are boundary defects, not merely presentation problems. Parser-only tests do not establish that nmcli, the shell helpers, and ES agree.
- **Fork-history comments need upstream context.** References such as “fork #191,” `D-UI-071`, and the dated “maintainer’s paradigm” should become self-contained rationale or links meaningful in the receiving repository.
- No unrelated feature implementation, hardcoded credential, or personal runtime path is visible in these six files. The three new files contain no explicit copyright/license header; the packet does not establish whether upstream requires one.
- Commit hygiene and separation cannot be assessed from an aggregate diff without the commit series.

## 4. Coverage boundary

**No build, test, VM session, or device execution was performed.** The added test source is evidence of test cases, not evidence that they are registered or passing.

The following gaps are surfaced to the orchestrator:

- **Backend and UI integration:** ApiSystem command construction, quoting, timeouts, exit-status handling, and parsing are outside the packet. So are the network-settings/manage-saved-network callers, including any cleanup that could refute F-WF-07.
- **Complete shell behavior:** The script prologue and settings-helper definitions are missing. Consequently, whole-script error propagation, settings-write behavior, `pin_wifi`, and the existing connect/list implementations cannot be certified.
- **Lifecycle and credentials:** Window, GuiLoading, and text-popup implementations are not supplied. Callback lifetime, cancellation safety, thread behavior, and password masking cannot be established from their names or the visible arguments.
- **Upgrade and clean install:** S3 requires both paths and an account of already-written state. No rehearsal or retained-profile fixtures are supplied. Target BusyBox/nmcli tests, matched frontend/backend package testing, and real association tests are needed; host parser tests alone do not satisfy this requirement.
- **Player-text conformance:** S4 requires French translations and target-size verification. The catalogs and 640×480 captures are absent. S5’s caller gating and complete navigation behavior also cannot be checked.
- **Audit completeness:** The blindspot register required by S2 and the primary acceptance criteria for issue #191 were not embedded. Their conformance remains open, not passed.

### `corpus.provenance.json`

Inline artifact content below; it has not been written to a filesystem. The three source arrays are aligned by index. All hashes are the Facilitator’s **sha256 values verified at embed time**, not independently recomputed values.

```json
{
  "seat": "2-wifi",
  "read_basis": "Facilitator-embedded corpus only",
  "independent_filesystem_read": false,
  "independent_hash_verification": false,
  "hash_verification_authority": "Council Facilitator; verified at embed time",
  "manifest_read_timestamp_utc": "2026-09-27T22:58:44Z",
  "source_ids": [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5"
  ],
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
  "missing_sources": [
    "ApiSystem Wi-Fi wrapper implementations; not embedded",
    "Network-settings and manage-saved-network callers, including all GuiWifi construction sites; not embedded",
    "Complete wifictl prologue and connection helpers, plus settings-helper definitions; not embedded",
    "Window, GuiLoading, and text-popup lifecycle and masking implementations; not embedded",
    "Build registration, package integration, and test execution evidence; not embedded",
    "French catalogs and target-size UI captures; not embedded",
    "Upgrade and clean-install evidence using retained NetworkManager profiles and settings; not embedded",
    "Blindspot register and primary issue #191 acceptance criteria; not embedded"
  ],
  "missing_source_paths_and_hashes": "Not supplied; none fabricated",
  "execution": "Static review only; no commands or tests executed"
}
```
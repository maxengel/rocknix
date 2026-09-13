# RA offline, phase 1: RAOfflineProxy's Linux/ROCKNIX side, read

Phase 1 of the Offline RetroAchievements milestone (#4): epic #163, issue #164,
the lost award in #162. D-RA-001 is settled (a toggle, casual-only, packaged
natively, contributed back). D-RA-002 is open and this note proposes its three
answers at the end. Everything below is read from the upstream code, not from
its website; the website is built from `docs/` in the same repository, and the
few places where the two disagree are called out.

**Upstream commit read:** `misantronic/RAOfflineProxy` at
`64d03d30633ca6e7719c26d732cef3c97dedcc27` (branch `main`, 2026-09-12 23:51
UTC, "onion: log the menu texture path and guard the full_resolution marker").
The last tag is `v1.13.0-alpha1` = `dd23c709bf3fb98c905fe5b14afb3f1180a71ac0`
(2026-09-01); the 19 commits between them touch Android, the donation lambda,
the Onion menu and one muOS revert path (`720cc20655`, which clears
`cheevos_custom_host` from the muOS appendconfig on stop) and a Smart Cache
consent dialog (`8959062222`). Nothing under `linux/raofflineproxy/` that
ROCKNIX runs differs from the tag except that muOS hardening, and
`APP_VERSION` is still `1.13.0-alpha1` (`config.py:204`). **Pin `64d03d30`.**
Fork-side references are to `next` at `bf6f757f64`.

Two facts frame everything else. First, on ROCKNIX the proxy's own
config-patching is mostly moot, because `setsettings.sh` rebuilds RetroArch's
RetroAchievements settings from `system.cfg` at every launch through an
appendconfig (`setsettings.sh:20`, `:287-319`, `:453-485`); the upstream
author knows this and patches `system.cfg` too (`config.py:323-330`). Second,
the fork already has the mechanism a native integration wants: on dual-screen
devices `runemu.sh:281` appends `cheevos_custom_host = "http://127.0.0.1:4874"`
to that same appendconfig for the lowerdeck proxy. The native design in § 10
is that line, behind a setting, pointed at RAOfflineProxy.

## 1. What it is

A loopback HTTP server (`127.0.0.1:8080` by default, `config.py:208`,
`:295-300`; refuses non-loopback clients, `proxy_service.py:226-228`) that
RetroArch is pointed at through `cheevos_custom_host`. Online, it forwards every
`/dorequest.php` call to `https://retroachievements.org` and caches successful
responses except `startsession` (`proxy_service.py:132-137`, `:540-562`).
Offline, it serves `gameid`, `patch`, `unlocks`, `achievementsets` from the
cache, fabricates `startsession` from cached unlocks (`:667-718`), answers
`ping`/`postactivity` with a fake success (`:78`, `:351-352`), serves a cached
`login2` (`:383-397`), and queues `awardachievement`/`submitlbentry`
(`:77`, `:399-417`, `:810-862`), answering the emulator with
`{"Success":true,...,"Error":"queued_offline"}` (`:485-496`) so the unlock
registers in-game at once. When the link returns it replays the queue
(§ 7). Hardcore requests are never served from cache and hardcore awards are
refused (`:346-349`, `:402-403`).

For #162 this means: with the proxy up, RetroArch's award call succeeds
immediately against loopback, so `rc_client` never schedules the retry and the
`!RA!` badge never appears; the loss on exit cannot happen because the
persistence moved out of the RetroArch process. The new failure mode is the
proxy being down while `cheevos_custom_host` points at it: a refused
connection makes rcheevos disable achievements for the whole session
(`boot.py:5-7`). § 10 guards it.

## 2. How it is started and stopped on ROCKNIX today

The upstream ROCKNIX target is a self-extracting installer built by
`linux/rocknix/build_bundle.sh` (a tarball base64-appended to a shell stub,
`:69-115`) that a player copies into `/storage/.config/modules` and runs from
the **Tools** menu (`docs/linux-support/installation.md:118-140`). It is verified
upstream on one device, an SM8550 on `next` (`linux/rocknix/README.md:7-13`).

- **Install** (`scripts/install.sh`): stops a running older proxy first and
  remembers that it was running (`:19-24`); replaces
  `/storage/.local/share/raofflineproxy/{app,lib}` and writes `bin/raofflineproxy`
  and `bin/raofflineproxy-uninstall` (`:26-36`); copies `tool-launcher.sh` both
  into the app dir and into `/storage/.config/modules/RAOfflineProxy.sh`
  (`:38-41`); installs the boot hook (`:58-61`); restarts the proxy if it was
  running (`:63-67`); asks EmulationStation to rescan over its HTTP API
  (`curl http://127.0.0.1:1234/reloadgames`, `:72`).
- **The Tools entry** (`scripts/tool-launcher.sh`): sources `/etc/profile`,
  registers a kill combo with `set_kill` (`:25-27`), then runs the pygame SDL
  menu fullscreen under sway, trying `SDL_VIDEODRIVER` in `wayland`, `kmsdrm`,
  `x11` order, each first with ROCKNIX's own `libSDL2` `LD_PRELOAD`ed and then
  with the wheel's, treating an exit code >= 128 as a native crash and moving
  to the next pair, caching the survivor in
  `/storage/.config/raofflineproxy/rocknix_sdl_attempt2` (`:45-95`). The
  reason is two Mali failure modes of the manylinux SDL (segfault on RK3326,
  silent garbage on RK3566, `README.md:162-181`). This whole layer exists only
  to draw a menu.
- **Start** (menu, or `raofflineproxy start-proxy`): `_apply_proxy`
  (`main.py:150-172`) spawns the service first, then patches configs.
  `start_service_process` (`service.py:234-282`) refuses if the port is taken,
  then `Popen([python3, -m raofflineproxy.main, run-service])` detached
  (`start_new_session=True`, stdout/stderr to `service.log`, `:269-279`) and
  writes `service.pid` and `service_status.json`. From the launcher,
  `start-proxy` and `boot-reconcile` go through `raofflineproxy.boot`, which
  binds the port with only the stdlib loaded and hands the socket to the
  service through `RAOFFLINEPROXY_LISTEN_FD`, so an emulator's login is queued
  rather than refused during the seconds Python takes to import
  (`boot.py:1-13`, `:26-43`; `launcher-raofflineproxy:17-23`).
- **Autostart** is a config flag (`autostart_enabled` in `config.json`,
  `platform.py:146-159`) plus a boot hook the installer always writes:
  `/storage/.config/autostart/raofflineproxy.sh` (`platform.py:32`,
  `:191-195`, `:446-467`). ROCKNIX's `/usr/bin/autostart` runs every file there
  (`sysutils/autostart/sources/autostart:70-78`) from
  `rocknix-autostart.service`, `After=network.target`,
  `Before=emustation.service weston.service`. The hook does two things: it
  copies the Tools launcher back into `/storage/.config/modules`, because
  `001-sync-modules` runs `rsync -a --delete /usr/config/modules/
  /storage/.config/modules/` on every boot and wipes third-party entries
  (`misc/modules/autostart/001-sync-modules:8`); then it runs
  `boot-reconcile`, which applies the proxy if the flag is on and otherwise
  reverts the configs (`main.py:383-390`).
- **Stop** (`stop-proxy`, `main.py:218-228`): SIGTERM to every process whose
  cmdline matches `-m raofflineproxy.main run-service`, wait up to 10 s,
  SIGKILL what remains (`service.py:285-335`), then revert every config
  (`main.py:175-215`). The service itself catches SIGTERM/SIGINT and shuts
  down the server, stops its threads, stops the chained lowerdeck proxy if it
  started one, and closes the database (`service.py:365-413`,
  `proxy_service.py:1092-1105`).
- **Uninstall** (`scripts/uninstall.sh`): stop, remove the boot hook, `pkill -f
  raofflineproxy.main`, delete the Tools entries and the autostart script, then
  `rm -rf` both the config/cache directory and the app (`:11-31`). It deletes
  the award queue with the app.

How the other firmwares run it, for comparison: KNULLI through
`knulli-services` (`knulli_service.py`), dArkOS through a systemd unit written
with `sudo` (`darkos_service.py:79-103`: `After=emulationstation.service
network.target`, `ExecStartPre=-... apply-emulator-config`, `ExecStart=...
run-service`, `Restart=always`). The dArkOS unit is the closest model to a
native ROCKNIX package, minus the `sudo` and the `ExecStartPre` patch step.

## 3. What the ROCKNIX scripts and build tooling do

| File (`linux/rocknix/`) | Role |
|---|---|
| `build_bundle.sh` | Refuses without vendored pygame for cp313 and cp314 (`:17-30`); builds `libraproxy_rchash.so` with zig for `aarch64-linux-gnu.2.17` (`:32-33`); assembles `app/` (the package, `requirements.txt`, the logo, pygame, `pygame_ce.libs`), `lib/`, `scripts/`, `install.sh`, `uninstall.sh` (`:42-50`); strips `__pycache__` and the mono fonts (`:52-56`); emits `dist/RAOfflineProxy-Rocknix-v<ver>-Install.sh` (`:69-115`). |
| `fetch_vendor.sh` | `pip download pygame-ce==2.5.7` for `cp313` and `cp314` `manylinux_2_17_aarch64`, unzips both into one `vendor/pygame` so both ABIs' `.so` files sit side by side (`:22-41`). aarch64 only. |
| `scripts/install.sh`, `scripts/uninstall.sh` | § 2. |
| `scripts/launcher-raofflineproxy` | Sets `HOME=/storage`, `XDG_CONFIG_HOME=/storage/.config`, `LD_LIBRARY_PATH` to the bundle's `lib`, `MALLOC_ARENA_MAX=2` (measured: 32 -> 19 MB RSS on a 103 MB device, `:10-14`), `PYTHONPATH` to `app`; `exec /usr/bin/python3 -m raofflineproxy.{boot,main}`. The system Python, never a bundled one. |
| `scripts/launcher-raofflineproxy-uninstall` | `exec` of the extracted bundle's `uninstall.sh`. |
| `scripts/tool-launcher.sh` | § 2, the SDL driver/preload matrix. |
| `scripts/sdl-doctor.sh`, `scripts/sdl_probe.py` | Optional second Tools entry (`INSTALL_SDL_DOCTOR=true`) that runs window creation across SDL configurations and writes `sdl-doctor.log` with dmesg for the developer. Diagnostic only. |

Note the tests: `linux/tests/test_linux_rocknix.py` covers platform detection,
paths, the boot hook and the installer asset name; `linux/tests/e2e/` runs the
real bundle in a ROCKNIX-shaped aarch64 container against a fake RA server
(`e2e/README.md`, `e2e/devices.py:108-131`,
`e2e/scenarios/test_rocknix_lifecycle.py`). That harness is the shape of
phase 3's VM fixture and the place a native-path scenario would be
contributed.

## 4. Files it writes, and where

Everything the proxy owns lives in one directory, `CONFIG_DIR`, resolved in
`config.py:172-199`: `RAOFFLINEPROXY_CONFIG_DIR` if set, else
`$XDG_CONFIG_HOME/raofflineproxy` (the launcher sets `XDG_CONFIG_HOME=
/storage/.config`), else `/storage/.config/raofflineproxy` when
`/etc/os-release` says `OS_NAME="ROCKNIX"` (`:63-68`, `:196-197`). Outside it,
the proxy edits three files it does not own.

| Path | What | Written by | Secret? |
|---|---|---|---|
| `/storage/.config/raofflineproxy/proxy.sqlite3` (+ `-wal`, `-shm`) | `api_cache` (cached RA responses keyed `gameid:`, `patch:`, `unlocks:`, `startsession:`, `achievementsets:`, `login2::<user>`, `ua::last`, `auth::invalid_token`) and `pending_awards` (the queue, with chain fields) | `storage.py:74-96`; WAL, falling back to DELETE journal on FAT (`:67-71`) | **Yes.** The `login2::<user>` body carries the RA `Token` (`auth.py:79-80`, `:113`); `auth::invalid_token` *is* a token (`storage.py:726-727`); each queued award's `requestBody` carries the `t=` token the emulator sent (`proxy_service.py:843`). `login2::` rows are never evicted (`storage.py:479-487`). |
| `.../proxy.json` (+ `.lock`, `.tmp.<pid>`) | The same data when Python lacks `sqlite3` (`storage.py:23-25`, `:122-125`, atomic write `:184-195`). ROCKNIX ships `_sqlite3.so`, so unused here. | | Yes, same content |
| `.../award_secret.key` | 32 random bytes, the HMAC key for the award chain | `award_signing.py:8-15` | Yes (device-local signing key) |
| `.../config.json` | `proxy_host`, `proxy_port`, `retroarch_cfg`, `upstream_host`, `cache_images`, `autostart_enabled`, path overrides | `config.py:276-280`, `platform.py:146-159` | No |
| `.../retroarch_patch_state.json` | What `retroarch.cfg`, `system.cfg`, `ppsspp.ini`, Dolphin held before patching (`hardcore_was_enabled`, `previous_host`, `previous_enable`, `batocera_previous`, `ppsspp_previous`, ...) | `retroarch_cfg.py:381-391`, `main.py:122-127`, `state.py:30-35` | No |
| `.../service.pid`, `service_status.json`, `online_state.json`, `update_status.json` | Runtime state | `state.py`, `service.py:185-197` | No |
| `.../service.log` (+ `.1`) | Rotating log, 2 MiB x 1 backup; every request line with `t=`/`p=` redacted (`proxy_service.py:242-248`, `utils.py:110-115`) | `config.py:232-241` | Usernames, game and achievement ids, timestamps |
| `.../menu-sdl.log`, `menu-stdout.log`, `rocknix_sdl_attempt2`, `sdl-doctor.log` | Menu and launcher diagnostics | `tool-launcher.sh:45-46`, `sdl-doctor.sh:13` | No |
| `.../cached_game_ids.txt` | One RA game id per line, every cached game (§ 8) | `es_export.py:10`, `:42-58` | No |
| `.../image_cache/{games,static}/` | Badge and icon images fetched from `media.retroachievements.org` | `image_cache.py:16-18` | No |
| `.../storage_corruption.json`, `*.json.corrupt-*` | A quarantined corrupt `proxy.json` and its incident record | `storage_corruption.py:10-33` | Quarantined copies hold whatever the JSON held |
| **`/storage/.config/retroarch/retroarch.cfg`** | `cheevos_custom_host = "127.0.0.1:8080"`, `cheevos_enable = "true"`, `cheevos_hardcore_mode_enable = "false"`; plus `cheevos_token` written and `cheevos_password` blanked when a username/password pair is present (`retroarch_cfg.py:258-262`, `:265-295`) | `patch_retroarch_cfg`, `:328-402` | Travels in the settings archive (`backuptool:156`); the token is blanked there (`backuptool:405-416`) but the proxy host is not |
| **`/storage/.config/system/configs/system.cfg`** | `global.retroachievements=1`, `global.retroachievements.hardcore=0`, `global.retroarch.cheevos_enable="true"`, `global.retroarch.cheevos_custom_host="127.0.0.1:8080"`, `global.retroarch.cheevos_hardcore_mode_enable="false"` (the last three are Batocera keys ROCKNIX never reads) | `batocera_conf.py:105-116`, via `detect_batocera_conf` -> `detect_rocknix_system_cfg` (`config.py:311-338`, `:385-397`) | The file travels (`backuptool:154`); its `.password`/`.token` lines are dropped (`:389-392`) |
| **`/storage/.config/ppsspp/PSP/SYSTEM/ppsspp.ini`** | `[Achievements]` `AchievementsHost = 127.0.0.1:8080`, `AchievementsChallengeMode = False` | `ppsspp_cfg.py:90-97`, `:123-159` | Travels (`backuptool:155`); the host with it |
| `/storage/.config/dolphin-emu/RetroAchievements.ini` | When the directory exists (`config.py:54`, `:415-443`, `dolphin_cfg.py`) | | Not in the archive |
| `/storage/.config/autostart/raofflineproxy.sh`, `/storage/.config/modules/RAOfflineProxy.sh` | The boot hook and the Tools entry (§ 2) | `platform.py:191-195`, `install.sh:41` | `modules/*` travels (`backuptool:185`) |
| `/storage/.local/share/raofflineproxy/`, `/storage/.local/share/.raofflineproxy-rocknix-bundle/` | The app and the extracted installer | `install.sh:5-8`, `build_bundle.sh:81` | No |

The cache and the queue survive a reboot because they are ordinary files
under `/storage`; nothing is held in memory only. Corruption handling is for
the JSON fallback (quarantine, salvage the pending count, record an incident,
`storage.py:165-183`, `:737-756`); SQLite gets WAL and a 5 s busy timeout
(`:50-52`).

## 5. How it authenticates

Token-first, in `auth.resolve_credentials` (`auth.py:28-70`), called by the
flusher, the periodic refresh and Smart Cache, never for the emulator's own
requests, which carry their own `t=`:

1. A `cheevos_username` + `cheevos_token` pair from `retroarch.cfg`, then from
   the muOS appendconfig `retroarch.cheevos.cfg`, then from ROCKNIX's
   `system.cfg` as `global.retroachievements.username` /
   `global.retroachievements.token` (`retroarch_cfg.py:132-143`; the comment at
   `auth.py:37-39` names why: `setsettings.sh` strips the cheevos keys out of
   `retroarch.cfg` at every launch, which is true, `setsettings.sh:287-302` and
   `:459-461`). A found token is written into the cache as a synthetic
   `login2::<user>` row (`auth.py:73-81`).
2. Else the cached `login2::<user>` row, unless that token was marked invalid
   by a 401/403 during a flush (`:50-52`; `storage.py:726-734`).
3. Else a username + password pair, from the same three sources (plus spruce's
   own settings), used **once** for `r=login2&u=&p=` against RA; the response
   (which contains the `Token`) is cached, and that token is used from then on
   (`:57-68`, `:84-114`). `cheevos_password` is never used as a token
   (`linux/README.md:45`).

On ROCKNIX specifically: `retroarch.cfg` has no credentials (the device
templates ship them empty, `retroarch/sources/H700/retroarch.cfg:64,68,70`, and
`setsettings.sh` deletes and re-adds them per launch in the appendconfig), so
the proxy's `_ensure_cheevos_token` rewrite of `retroarch.cfg`
(`retroarch_cfg.py:265-295`) is a no-op here. The token it uses is
`global.retroachievements.token` when EmulationStation has stored one (the
standalone launch scripts expect it there too, `cheevos_ppsspp.sh:16`,
`:27-33`), else a `login2` with the username and password from `system.cfg`.
`tools/qa-accounts ra` writes exactly username, password and web key into
`system.cfg` (`tools/qa-accounts:74-80`), so the QA account takes path 3 and
needs nothing more.

The emulator's own login also goes through the proxy: `setsettings.sh:460-461`
gives RetroArch `cheevos_username`/`cheevos_password`, RetroArch sends
`login2` to the proxy at every game start, online it is forwarded and the
response cached, offline the cached response is served (`proxy_service.py:79`,
`:354-376`, `:383-397`). That is what makes an offline launch possible at all
on this OS, and it is why the token cache in § 4 is not optional.

## 6. What it does to a hardcore player's setting

**What.** Three writes, on ROCKNIX:

- `retroarch.cfg`: `cheevos_hardcore_mode_enable = "false"`
  (`retroarch_cfg.py:258-262`), recording `hardcore_was_enabled` beforehand
  (`:349`, `:384`).
- `system.cfg`: `global.retroachievements.hardcore=0` and
  `global.retroachievements=1` (`batocera_conf.py:110-111`), recording the
  previous values (`:29-39`). This is the one that matters here, because
  `setsettings.sh:463` rebuilds `cheevos_hardcore_mode_enable` from that key at
  every launch and would otherwise undo the `retroarch.cfg` write.
- `ppsspp.ini`: `AchievementsChallengeMode = False` (`ppsspp_cfg.py:90-97`);
  `cheevos_ppsspp.sh:35-40`, `:57-61` rewrites it from `system.cfg` at every
  PPSSPP launch, so again the `system.cfg` write is the effective one.

**When.** At `start-proxy`, at `boot-reconcile` with autostart on, at
`apply-emulator-config`, and (`retroarch.cfg` only) every time the SDL menu
opens (`main.py:105-127`, `menu_sdl.py:447`). The Linux README says the service
"re-enforces those values periodically" while running
(`linux/README.md:31`); at this commit nothing does: `enforce_patched_cfg` has
exactly two callers, `main.py:117` and `menu_sdl.py:447`, and no thread in
`proxy_service.py` touches configs. Docs/code drift; on ROCKNIX it is moot
because the appendconfig carries the values from `system.cfg` at every launch.

**Does it restore it.** Yes, on `stop-proxy` (and on `boot-reconcile` with
autostart off): `retroarch.cfg` gets `"true"` back only if
`hardcore_was_enabled` was recorded (`retroarch_cfg.py:298-313`, `:439-455`);
`system.cfg` gets the recorded previous `global.retroachievements.hardcore`
back, or the line removed if there was none (`batocera_conf.py:133-153`,
`:177-194`); the master `global.retroachievements` is deliberately never
disabled on revert (`:134-135`). Re-running the patch over an already patched
file keeps the first-captured previous values rather than the proxy's own
(`store_batocera_previous`, `:57-65`; `_sanitize_previous`, `:119-130`;
`retroarch_cfg.py:361-379`). Two ways the restore does not happen: the
service dies or the device loses power with the proxy on (nothing reverts
until someone stops it; `docs/caveats.md:28-32` says as much for Android), and
the uninstall path, which stops first and so does revert.

**Is the player told.** No. The SDL menu has no string containing "hardcore"
(`grep -ci hardcore linux/raofflineproxy/menu_sdl.py` = 0). The only surfaces
are the `status` CLI line `Hardcore enabled: yes/no` (`main.py:835-838`), the
`ui.py` status image for KNULLI, and the documentation
(`docs/linux-support/cfg-patching.md:88`, `docs/cfg-patching.md:125-136`). A
hardcore player who starts the proxy is switched to casual and finds out from
RetroArch's own casual-mode toast.

**At runtime.** A request with `h=1` is forwarded when online and answered
`503 upstream unavailable` when offline (`proxy_service.py:346-349`). A
hardcore award is refused with `403 hardcore_not_supported` whether online or
not (`:402-403`). A hardcore award that somehow reached the queue is marked
stale at flush and never sent (`flusher.py:55-61`, `:400-411`).

**Two ROCKNIX-specific edges.** `get_setting` resolves per-game and
per-platform overrides (`setsettings.sh:262-269`, `game_setting` passes
`PLATFORM` and `ROM`), and the proxy patches only the global key, so a game
with `<platform>.retroachievements.hardcore=1` still launches in hardcore
behind the proxy and every award from it gets the 403. And ROCKNIX itself
already forces hardcore off silently for netplay (`setsettings.sh:493`), which
is a precedent for the pattern, not an argument for it: it predates the rules
in `es-player-text.md` and `player-language.md`.

## 7. The queue, the flush, the backoff, the clamp, the chain

**Queue.** `queue_award` (`proxy_service.py:810-862`) runs under a lock,
drops a duplicate for an achievement already pending or already unlocked in
the cache (`:818-830`; `achievementId` is `UNIQUE`, `storage.py:84`), computes
`payloadHash = sha256("<aid>|<path>|<body>|<queuedAt>")`, `prevHash` = the
latest pending award's hash or `genesis`, `signature = HMAC-SHA256(secret,
"<payloadHash>:<prevHash>")`, and stores the raw request (path, body, the
emulator's User-Agent) with `queuedAt` in ms (`:832-856`). Survives a reboot
because it is a row in `proxy.sqlite3` (§ 4).

**Trigger.** A flush runs at service start if RA is reachable
(`proxy_service.py:1084-1088`) and from `ConnectivityMonitor` every 15 s
**only on an offline-to-online transition** (`:954-982`, the
`is_online and not was_online` gate at `:977-979`). Reachability is: some
interface other than `lo` has `operstate == up` (`network.py:186-199`) and a
`HEAD https://retroachievements.org/` answers 2xx-4xx within 5 s, the result
cached for 30 s while reachable and re-probed at once while not (`:20`,
`:171-239`). There is no backoff schedule between flush attempts because
there is no retry loop: a flush that fails while the device stays online (RA
5xx, a token refresh that fails) waits for the next transition, the next
service start, or the hourly `PeriodicRefresh` (`:985-1038`), which refreshes
caches but does not flush. HTTP 429 is handled inside `http_get` with
`Retry-After` or 2 s doubling to 15 s over 4 retries (`network.py:21-24`,
`:242-313`, `:360-369`), and RA GETs are throttled to one per 0.3 s
(`:25`, `:42-63`); `http_post`, which sends the awards, has neither.

**Flush** (`flusher.py:280-496`), oldest first:

1. Verify the chain: recompute each `payloadHash`, check `prevHash` links, verify
   each signature (`:127-151`). A `chain link broken` failure is repaired by
   re-signing in order (`:154-180`, `:287-296`); any other failure aborts the
   whole flush with nothing sent (`:297-318`), which is the documented stance
   (`docs/linux-hash-chain.md:26-28`). Legacy rows without a hash are skipped
   by verification (`:132-133`).
2. Resolve credentials (§ 5); abort if none (`:346-356`).
3. Refresh `patch` data for every game the pending awards belong to, so a
   retired achievement can be recognised (`:183-236`, `:358-378`); a 401/403
   here marks the token invalid and aborts.
4. Per award: `deleted` and `stale` rows skipped; a hardcore award -> `stale`;
   an achievement id no longer in live patch data -> `stale` with the reason
   (`:385-425`). Then `send_award` (`:239-277`): the body gets the **current**
   token in `t=` (`:90-91`), and if any time has passed, `o` = seconds since
   `queuedAt` **clamped to 14 days = 1,209,600 s** (`:41`, `:82-84`, `:92-104`)
   with `v` recomputed as `md5(aid + user + h + aid + offset)` (`:68-79`) --
   RA's own validation hash, so a backdated award is accepted -- and then the
   chain fields `ra_chain_payload_hash`, `ra_chain_prev_hash`, `ra_chain_sig`,
   `ra_chain_pubkey` appended (`:106-115`; RA ignores them today,
   `docs/hash-chain.md:56`). User-Agent is the emulator's original plus
   `RAOfflineProxy/Linux/<version>` (`:243`, `utils.py:68-71`; `config.py:205`).
   Outcomes: `Success` -> `flushed`; HTTP 401/403 or an error mentioning
   invalid/token/credentials/user -> `auth_error`, stays `pending` with the
   message, no retry counter (`:435-443`); anything else -> `network_error`,
   `retryCount += 1`, stays `pending` (`:444-462`). `MAX_RETRIES = 5` (`:39`)
   only changes the log line at `:449-455`; nothing skips an award whose count
   has reached it, so in practice a network-failed award is retried at every
   flush forever. The Android page says "Retried up to 5 times"
   (`docs/pending-awards.md:39`); the Linux code does not do that.
5. If anything was sent, wait 3 s, re-cache unlocks and session for those games
   (`:464-471`); purge `flushed`/`stale`/`deleted` rows once nothing is pending
   (`:499-509`).

**The chain, honestly described.** `award_signing.py` is HMAC-SHA256 with a
random 32-byte key in `award_secret.key`; the "public key" sent to RA is the
SHA-256 of that secret, base64 (`:29-31`). It is tamper *evidence* against
accidental corruption and casual editing, on the same device that holds the
key; upstream says exactly that (`docs/linux-hash-chain.md:38-42`,
`docs/hash-chain.md:58-66`). It does not make casual awards trustworthy in the
hardcore sense and does not claim to. The "public key" naming is Android
vocabulary (ECDSA in the Keystore there) carried over.

## 8. `es_export.py`

Fifty-eight lines. Whenever a `patch:` or `achievementsets:` cache row changes
(`storage.py:224-226`, `es_export.py:16-19`), it collects every cached game id
(`:22-39`) and atomically rewrites `cached_game_ids.txt`, one id per line,
sorted, skipping the write when unchanged (`:42-58`). A KNULLI
EmulationStation integration reads that file to mark cached games in the
gamelist (`linux/knulli/integration/README.md:62`). Nothing on ROCKNIX reads
it. For the fork it is the ready-made feed for a "playable offline" mark on
the game page or the RetroAchievements page, if phase 3 wants one; the CLI
also offers `cached-games`, `cached-games-count`, `pending-awards-count` and a
JSON `home-status` (`main.py:437-462`, `:512-539`) for a page to read.

## 9. `log_uploader.py`: what leaves the device, where, and when

**Where.** `https://ud63psmdb5.execute-api.eu-central-1.amazonaws.com/logs/request-upload`
(`log_uploader.py:18`), a developer-run AWS API Gateway: a POST with metadata
returns an upload id and a presigned URL (`:124-156`), then a PUT of a zip
(`:331-349`). Over the default TLS context (`network.py:133-138`; honours
`SSL_CERT_FILE`/`SSL_CERT_DIR`).

**What.** `service.log` and `service.log.1`, `menu-sdl.log`, `launch.log`,
`menu-stdout.log`, `update_status.json`, `service_status.json`, and any
quarantined `*.json.corrupt-*` (`:58-80`, `:88-96`). Redaction: `t=` and `p=`
values in free text (`utils.py:110-115`) and the `responseBody` of `login2::`
and `auth::invalid_token` cache entries inside quarantined JSON (`:45-55`,
`:83-85`). **Not redacted:** the RA username (`u=` is not in
`REDACTED_QUERY_KEYS`, `network.py:19`, nor in `_QUERY_SECRET_PATTERN`), game
and achievement ids, request timestamps, the request log itself. Metadata:
`system=Linux`, `os=ROCKNIX`, `device` = the devicetree model or DMI
vendor+product (the same files `rocknix-info` reads, `:255-265`),
`os_version` from `/etc/os-release` `OS_VERSION`, `app_version`, and which of
RetroArch/PPSSPP are patched (`:302-328`).

**When, and is it opt-in.** Two paths:

- **"Send Logs" in the SDL menu** (`menu_sdl.py:2529-2549`): a player action.
  Opt-in.
- **A storage-corruption incident**: **automatic**. When the JSON store is found
  corrupt (only the no-`sqlite3` fallback), an incident is recorded
  (`storage_corruption.py:10-33`); the next time the menu opens it uploads the
  report at once and shows the result (`menu_sdl.py:2451-2490`), and the
  **service retries the upload at every online start** until one succeeds
  (`proxy_service.py:1041-1054`, called at `:1088`), with the comment "The
  service retries silently on every startup until it actually gets through"
  (`:1044-1045`). No config key gates either path; `config.py` has none. On
  ROCKNIX the trigger is unreachable in practice (SQLite is present), but the
  code path ships.

Also outbound from the **menu only**: a daily `GET
https://api.github.com/repos/misantronic/RAOfflineProxy/releases` for the
update check (`update.py:22-23`, `menu_sdl.py:2424-2435`). The service itself
talks only to `retroachievements.org` and `media.retroachievements.org`
(`config.py:202-203`; images `proxy_service.py:305-315`).

The project's privacy policy (`docs/privacy-policy.md`) is written for Android
and says the app "does not collect, store, or transmit any data to its
developer" apart from donations (`:9-11`); the Linux log upload and the
automatic corruption report are not in it.

## 10. What a native package would replace, and what it would keep

The upstream bundle solves problems a package on the image does not have:
getting Python code and a GUI toolkit onto a device without `pip`, surviving
the `modules` wipe, patching files the OS regenerates. A native package
inverts the design: the OS owns the launch-time config, the proxy owns only
the service.

**Replace**

| Upstream piece | Native replacement |
|---|---|
| Self-extracting installer; `/storage/.local/share/raofflineproxy/{app,lib}`; `install.sh`/`uninstall.sh` | A `package.mk` under `projects/ROCKNIX/packages/` pinned to `64d03d30` (`PKG_URL` = the GitHub archive of that commit, `PKG_LICENSE="GPL-3.0-only"`, `PKG_DEPENDS_TARGET="toolchain Python3"`), installing `linux/raofflineproxy/` to `/usr/lib/python3.14/site-packages/raofflineproxy` and running `python_compile` on it the way `packages/lang/Python3/package.mk:138` does for the stdlib -- the image ships `.pyc` only (`/usr/lib/python3.14/*.pyc`; the recipe's `--disable-pyc-build` then compile), and the root filesystem is read-only, so uncompiled sources would recompile at every start. |
| The pygame-ce vendor tree, the SDL menu, `tool-launcher.sh`, `sdl-doctor.sh`, the `modules` Tools entry and the boot hook that re-adds it | Nothing. The player's surface is the fork's EmulationStation RetroAchievements page (D-RA-001: a toggle whose line says beta and casual-only). No pygame on the image. |
| `/storage/.config/autostart/raofflineproxy.sh` + `boot-reconcile` + `autostart_enabled` | A unit `raofflineproxy.service`: `ExecStart=/usr/bin/python3 -m raofflineproxy.main run-service`, `Environment=RAOFFLINEPROXY_CONFIG_DIR=/storage/.config/raofflineproxy HOME=/storage XDG_CONFIG_HOME=/storage/.config MALLOC_ARENA_MAX=2`, `Restart=always`, `After=network.target` (the proxy tolerates no network; it only needs the interface list), `Before=emustation.service` (so the port is up before a game can be launched, the concern `boot.py` exists for), gated the way ROCKNIX gates optional services: `ConditionPathExists=/storage/.cache/services/raofflineproxy.conf` (`avahi-daemon.service:8`; samba uses the inverse `.disabled` marker). The ES toggle creates or removes the marker and `systemctl start`/`stop`s the unit. |
| `retroarch_cfg.py` patching `retroarch.cfg`; `batocera_conf.py` patching `system.cfg`; `retroarch_patch_state.json`; the revert dance | **`setsettings.sh set_cheevos`** adds `cheevos_custom_host` to the per-launch appendconfig when the toggle is on -- the line `runemu.sh:281` already writes for lowerdeck, behind a `get_setting` instead of `DEVICE_HAS_DUAL_SCREEN`. Nothing persistent is written, so nothing needs reverting, nothing travels in a settings backup (`retroarch.cfg` and `system.cfg` both do, `backuptool:154-156`), and a backup restored on a device with the toggle off does not strand RetroArch on a dead port. Add a guard before the line: only when the proxy's port answers (busybox `nc -z 127.0.0.1 8080` or `netstat -ln`, as `runemu.sh:283-288` already does for lowerdeck), else launch direct and log it; that closes the refused-connection failure in § 1. |
| `ppsspp_cfg.py` | One line each way in `cheevos_ppsspp.sh`, which already rewrites `[Achievements]` at every launch (`:42-62`): set `AchievementsHost` when the toggle is on, clear it when off (the file travels in backups, `backuptool:155`, so clearing matters). |
| `lowerdeck.py` chaining | Keep the module; it only activates when `DEVICE_HAS_DUAL_SCREEN=true` and `/usr/share/lowerdeck/ra_proxy.py` exists (`lowerdeck.py:30-34`, `:57-58`). None of the fork's devices are dual-screen; the setsettings change should make the two lines mutually exclusive on such devices rather than emit both hosts. |
| `update.py` | Not run; the image carries the version. |
| `log_uploader.py` and `retry_storage_corruption_report` | Not shipped or patched out (§ 9). A fork patch under the package's `patches/` until upstream accepts a gate. |

**Keep**, unchanged: `run-service` and everything under it --
`proxy_service.py`, `storage.py`, `flusher.py`, `auth.py`,
`award_signing.py`, `network.py`, `rom_cache.py`, `image_cache.py`,
`cache_keys.py`, `utils.py`, `state.py`, `es_export.py`, `boot.py` (the
prebind is worth keeping even under systemd) -- and `config.py`'s ROCKNIX
detection and credential reading from `system.cfg`, which need no patch.
Keep the User-Agent suffix `RAOfflineProxy/Linux/<version>` exactly
(`utils.py:68-83`): RA's approval of the project (`README.md:58`) is what lets
this traffic be told apart from an emulator's, and the fork should not
present as anything else.

**Not in v1**: `rom_hashing.py`/`libraproxy_rchash.so` (Add ROM, Smart Cache:
needs the zig-built hasher, `linux/build_rchash.sh`), `native_codecs.py`
(RVZ), `rom_browser.py`, `smart_cache.py`, `menu_sdl.py`, `ui.py`. The cache
fills from ordinary online launches (`proxy_service.py:540-560`); the
milestone's acceptance test is exactly that scenario.

**Dependencies, checked against the image.** The service is stdlib-only: the
import inventory across `linux/raofflineproxy/*.py` is `argparse base64
concurrent.futures contextlib ctypes dataclasses datetime hashlib hmac http
io json logging os pathlib re secrets select shutil signal socket
socketserver sqlite3 ssl struct subprocess sys tempfile threading time
traceback typing urllib zipfile`, all present; `requirements.txt` says the same
in one comment line. The GENERIC_X64 image ships CPython 3.14.7
(`/usr/bin/python3 -> python3.14`, `packages/lang/Python3/package.mk:6`) with
`_sqlite3.so`, `_ssl.so`, `_hashlib.so`, `_hmac.so`, `_socket.so`,
`_ctypes.so`, `_json.so`, `zlib.so` in `lib-dynload` (`--enable-sqlite3` for the
target, `package.mk:74`). Upstream keeps 3.9-compatible syntax
(`linux/tests/test_linux_python39_compat.py`). CA roots: `/etc/ssl/cert.pem ->
/run/rocknix/cacert.pem`, which OpenSSL's default context finds. `subprocess`
calls `ps` and `pgrep` (`service.py:93`, `lowerdeck.py:48`), both busybox.
Nothing in the tree listens on 8080. Memory: upstream measured 19 MB RSS with
`MALLOC_ARENA_MAX=2` (`launcher-raofflineproxy:10-14`).

**Licence.** `LICENSE` is the GPLv3 text with no "or any later version" grant
in the sources, so `GPL-3.0-only` (the spelling 27 ROCKNIX recipes use).
RetroArch is already GPL-3 on the image; shipping the package is routine.
Obligations: the source at the pinned commit is public; the fork's patches are
GPL-3 and go upstream (D-RA-001). `third_party/` (rcheevos, libchdr,
lzma-sdk) only matters if the hasher is ever built.

## 11. What the fork would contribute back

To **misantronic/RAOfflineProxy**:

1. A managed-config mode: `run-service` as the documented integration entry
   for an OS that owns emulator configuration, with `boot-reconcile`/
   `start-proxy` skipping the patchers under a flag (env or `config.json`), and
   `RAOFFLINEPROXY_CONFIG_DIR` documented. The dArkOS unit
   (`darkos_service.py:79-103`) is halfway there.
2. The "re-enforces periodically" claim (`linux/README.md:31`) has no
   implementation (§ 6). Fix the sentence or add the thread.
3. `MAX_RETRIES` gates nothing (`flusher.py:444-462`); either enforce it or
   drop it and correct `docs/pending-awards.md:39`. And a flush retry while
   online with awards pending (§ 7), rather than only on a link transition.
4. An opt-in gate for the automatic storage-corruption upload
   (`proxy_service.py:1041-1054`, `menu_sdl.py:2451-2490`), and a Linux
   paragraph in the privacy policy that names the log endpoint. Redact `u=`
   alongside `t=`/`p=` (`network.py:19`, `utils.py:110`).
5. Say in the menu's start flow that hardcore is being turned off
   (`menu_sdl.py` has no such string); the docs do, the screen does not.
6. Per-game hardcore overrides on Batocera-shaped OSes (`setsettings.sh:262-269`):
   the global patch is not the effective value; at least document it.
7. ROCKNIX README: the installer example names `v1.5.5-alpha1`
   (`linux/rocknix/README.md:216-224`) against `build_bundle.sh:10`'s
   `1.13.0-alpha1`; "verified end to end" is one SM8550. A native-path e2e
   scenario beside `test_rocknix_lifecycle.py` once § 10 exists.
8. `ConnectivityMonitor` logs the restore (`Connectivity restored; attempting
   flush`, `proxy_service.py:978`) and nothing when the link goes: on the VM
   check `online_state.json={"online":false}` was the only evidence of the
   drop (#166 § 4). One `LOGGER.info` on the transition to offline, so the
   service log reads both ends of an outage. Noted, not patched.
9. `handle_online_request` answered every non-2xx from `dorequest.php` with
   `503 upstream unavailable` (`proxy_service.py:512`), so a ROM with no
   achievement set read "Load failed (-27): upstream unavailable" through the
   proxy and "Load failed (-29): Unknown game" without it (#166 § 3). The fork
   carries `patches/001-dorequest-4xx-passthrough.patch` -- a 4xx other than
   401/403 passes through as it came, status and body; 5xx and network
   errors keep the 503 -- written to be offered upstream as-is.

To **ROCKNIX/distribution** (the docs hard gate applies; `rocknix.org` needs a
page): `cheevos_custom_host` from a setting in `setsettings.sh` and
`AchievementsHost` in `cheevos_ppsspp.sh` (§ 10); the upstream README's
finding that `cheevos_duckstation.sh` is disabled with "Seems like Duckstation
changed the token encryption" (`linux/rocknix/README.md:90-100`) is a ROCKNIX
bug they have already written up for us. And `099-networkservices`, which
never reset `STATE SVC CONF DAEMONS` between the fragments it sources, so a
fragment without `CONF=` removed the marker the previous one had just written
-- `007-syncthing` took `raofflineproxy.conf` and the toggle died on the
second boot (#166 § 6); `004-tailscaled` has taken samba's `smb.conf` the
same way at every boot. One `unset` at the top of the loop, on the feature
branch, worth a PR of its own.

Fork findings from this read, not the proxy's: `ppsspp_retroachievements.dat`
holds the raw RA token (`cheevos_ppsspp.sh:33`, `:44`) and sits under
`/storage/.config/ppsspp/*`, which `backuptool` archives whole (`:155`) and
strips only `system.cfg`, `es_settings.cfg`, `retroarch.cfg` and `rclone.conf`
(`:324-343`, `:385-416`). The token travels in every settings backup today,
regardless of this milestone -- filed as its own issue.

## 12. D-RA-002: proposed answers

**Hardcore: mutual exclusion the player chooses, on both rows; the service
refuses to run in hardcore; the proxy's own hardcore writes are not used.**
Upstream's approach -- flip `global.retroachievements.hardcore` to 0 on start
and back on stop, telling nobody (§ 6) -- is the silent change D-UI-028 and
`player-language.md` forbid, and it also fails on its own terms (a crash or a
power loss leaves the flip in place; a per-game override defeats it). Refusing
the toggle outright is honest but leaves the player without the one action
they came for. So: with HARDCORE MODE on, selecting OFFLINE RETROACHIEVEMENTS
opens a two-button dialog, `OFFLINE RETROACHIEVEMENTS WORKS ONLY WITH HARDCORE
MODE OFF. TURN HARDCORE MODE OFF?` -- YES sets both, NO changes nothing; with
the toggle on, selecting HARDCORE MODE asks `HARDCORE MODE TURNS OFFLINE
RETROACHIEVEMENTS OFF. CONTINUE?`. Both rows then always tell the truth, the
sentence is read where the choice is made (D-UI-023's place for it), and
neither setting ever changes without a YES. Under it, fail closed: the unit
does not start while `global.retroachievements.hardcore=1` (an
`ExecStartPre` check, or the ES toggle refusing to write the marker), so a
hand-edited `system.cfg` or a restored backup cannot recreate the silent case,
and `setsettings.sh` emits `cheevos_custom_host` only when the *effective*
hardcore for that game is off (`game_setting`), so a per-game hardcore
override keeps today's direct path -- "hardcore mode is unchanged and says
so", as milestone 4's acceptance test puts it. The proxy's `batocera_conf`
and `retroarch_cfg` writers are simply never invoked on ROCKNIX (§ 10).

**The token cache never travels, and the proxy leaves no host in files that
do.** `/storage/.config/raofflineproxy/` holds the RA token three ways plus
the HMAC key (§ 4). It is outside `backuptool`'s default allowlist today
(`:151-187`), so nothing changes for a stock configuration; for a custom
`LOCATIONS` that sweeps `/storage/.config`, hold the directory back outright
the way `rclone.conf` is (`:333-343`) -- there is no sanitised form worth
keeping, because a queue is bound to the device that earned it (the HMAC key)
and duplicating it onto a second device would replay the same awards, and the
cache re-fills from the next online launch. On restore there is nothing to do:
the proxy re-derives its token from `system.cfg` or a fresh `login2` (§ 5).
The second half is the § 10 design: because the native path writes
`cheevos_custom_host` into the per-launch appendconfig and not into
`retroarch.cfg` or `system.cfg`, a settings archive carries no trace of the
proxy, where upstream's patching would carry `127.0.0.1:8080` into every
backup (`backuptool:154-156`) and onto any device it is restored to.
`tools/qa-accounts` needs nothing new. D-INFRA-010 holds.

**RetroArch first, PPSSPP in the same milestone once the VM proof passes.**
#162's case is RetroArch; milestone 4's gate is a RetroArch scenario on the
GENERIC_X64 guest; the RetroArch integration is one guarded line in
`setsettings.sh`. PPSSPP is one line each way in `cheevos_ppsspp.sh` and the
GENERIC_X64 image ships `ppsspp-sa` and that script, so it is testable on the
guest -- but its achievements client is a different rc_client build behind
`AchievementsHost`, the upstream evidence for it is the SM8550 alone, and
`ppsspp.ini` travels in backups so the clear-when-off path needs its own test.
Ship the toggle covering libretro cores; add PPSSPP when a PSP title passes
the same unlock-offline-reconnect scenario on the guest, before the handheld
round. The toggle's line stays `BETA. CASUAL ONLY.` either way; which
emulators it covers is for the page's help text and the rocknix.org page,
not the row.

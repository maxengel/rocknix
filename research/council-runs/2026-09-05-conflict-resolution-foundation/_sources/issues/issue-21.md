author:	maxengel
association:	owner
edited:	false
status:	none
--
## Capture the play-time fields too - they cannot be recovered later

The conflict wizard wants to show play time and play count per side (#23). Those live in ES's gamelist on the **device that wrote the save**, so they are only knowable at capture time. A device reading a conflict later can see its own values and has no way to learn the other side's.

Add to whatever the capture step snapshots:

- `gametime` (total seconds) - verified real, `FileData.cpp:782` accumulates elapsed seconds on game exit
- `playcount`
- `lastplayed`

Two things to get right in the schema rather than in the UI:

- **Absent must be distinguishable from zero.** A game genuinely never played reads `0`; a save captured before this field existed, or by a device whose gamelist had no entry, is *unknown*. If both serialise as `0` the wizard shows "0 minutes played" for saves that may have hours behind them, which is worse than showing nothing.
- **Timing.** ES updates `gametime` on game exit, while the save may be written mid-session by the emulator. Capturing at save-write time will usually read the value from *before* the current session. That is acceptable, but it should be a decision rather than a surprise, and the field should mean "play time as of the last completed session" rather than implying it is current.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
Play time is out of scope for the picker (decided on #23), so **disregard my earlier note asking capture to snapshot `gametime`, `playcount` and `lastplayed`**. Nothing here needs to carry them.

The rest of that comment's point still applies to whatever fields do get captured: a schema must distinguish *absent* from a legitimate zero or empty value, or the UI ends up presenting "unknown" as fact.
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Prior-work grounding (retro on #26, 2026-09-04):** the capture hook has an existing home and an existing guard to respect. Game exit is already handled in ES (`FileData::launchGame` → `ThreadedCloudSync`, `e74fe4e58a`); the OS-hook path `/usr/bin/scripts/game-end/` was removed and must not come back as a second path (engineering-practices: *diff behaviours before deleting a duplicate*). Any script this issue adds that touches the cloud must call `take_cloud_lock` (`b9ea9f3fe8`). Device fields come from `cloud_device_id` (see #20).
--
author:	maxengel
association:	owner
edited:	false
status:	none
--
**Pre-futro audit — 2026-09-05.** Drift found: the body named `/usr/bin/scripts/game-end/`, removed in `357dfcffd7`; the capture point is `FileData::launchGame` → `ThreadedCloudSync` (blindspot 27). Live state: no sidecar beside an in-game save passes the allowlist (fixture on the device). **Post-futro audit — 2026-09-05.** Hook bullet corrected; four ACs added. Depends on #20's shape decision. Green light once #20 is signed off.
--

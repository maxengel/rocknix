# QA frames, 2026-09-25 — the twenty-second cut `664ad9ac64` on guest d: the offline sign-in toast (#194) and the RC round's § B (#196, #209, #69)

Guest d (640x480) on the candidate the RG35XX SP runs, the QA RetroAchievements
account already on the guest, OFFLINE RETROACHIEVEMENTS turned on for the run
(`raofflineproxy-ctl enable`) and RetroArch switched to GL for it (the image
ships Vulkan, which a QEMU guest cannot draw with). Tobu Tobu Girl Deluxe was
launched once online through the interface's own launch path (`POST /launch`),
so the proxy stored the sign-in; the link was cut on the QEMU monitor
(`set_link net0 off`; carrier 0 and the proxy's `online_state.json` false over
serial before the launch); the game was launched again over the serial console,
and a burst of 40 screendumps was taken 0.3 s apart. The first offline launch
came up on a 240x256 surface (#263's race) and its frames were discarded; the
second read `[GL] Using resolution 640x480` in `/var/log/exec.log`, with
`Login answered through the offline proxy, from its store (offline)`. The guest
was put back afterwards: the link on, Vulkan restored, the toggle off, and the
proxy's folder -- which this run created, and which holds a session token --
removed.

- `194-offline-login-toast-640x480-664ad9ac64.png` — +3.0 s after the offline
  launch: `RetroAchievements: Logged in as "<account>" (offline).` in the
  message queue, its backdrop running from x≈14 to x≈441 past the text's end
  at x≈430, and the auto-load toast beneath it covered the same way. **The
  account name is painted out: an 84x24 band at (283,351)**
  (`tools/png-blackout`). This replaces #194's frames of 2026-09-15 and
  2026-09-21 as the evidence, both of which predate #263 and neither of which
  confirmed its surface.

  **The sizes are the VM's, and only the queue's matches the H700.** The guest
  runs RetroArch's `menu_widget_scale_factor = 0.4`; the H700 runs 1.0. The
  message queue lands on its 14 px floor either way, which the fit rule moves
  to 15 (D-UI-084, D-UI-088; the text measures 13 px of rows here), so the
  toast is the size a handheld draws. The achievement banner top left ("You
  have 1 of 28 achievements unlocked") is not: at 0.4 it sits on the 9 px
  floor (6 px of text), where the H700 draws 18. A banner frame at the
  H700's size wants the factor set to 1.0 for the run, as #251's measurements
  did.

## The RC round's § B, on the same guest and cut (#236)

- `196-manager-before-launch-640x480-664ad9ac64.png`,
  `196-manager-slot1-selected-640x480-664ad9ac64.png`,
  `196-manager-after-exit-640x480-664ad9ac64.png` — #236 § B's #196 line,
  the regression on the candidate. Bobl's SAVE STATE MANAGER before: AUTO SAVE
  `YESTERDAY at 09:07` (the guest's clock past midnight), SLOT 0 `09/23/26 at
  14:03`, SLOT 1 `09/01/26 at 12:00`. SLOT 1 launched from the manager with
  RetroArch on GL for the run: `-e 1` on its command line, `state_slot = "1"`
  and `savestate_auto_index = "false"` in `/tmp/.retroarch.cfg`. A minute of
  play, then the quit through the shipped exit hotkey's `execute_kill` (the
  VM's keyboard Esc-twice did not quit RetroArch this time): `Auto save state
  to ".../Bobl.state.auto" succeeded`, `Checking errors: 0`. After: AUTO SAVE
  `TODAY at 00:25` with the exit's own thumbnail -- `stat` 6,239 bytes at
  00:25:37 EDT, the moment of the quit -- and SLOT 1 still there with its own
  time, its file untouched (4,096 bytes, 2026-09-01 12:00:02).
- `209-incremental-row-legacy-0-640x480-664ad9ac64.png` — #209's third
  checkbox: the guest holds the legacy `global.incrementalsavestates=0`, and
  GAME SETTINGS' INCREMENTAL SAVE STATES reads DO NOT INCREMENT (ES
  `75ca1dac2`); the next launch's `/tmp/.retroarch.cfg` carried
  `savestate_auto_index = "false"` -- the SLOT 1 launch above -- so the row
  says what the next save does.
- `69-tools-list-boxart-640x480-664ad9ac64.png`,
  `69-tools-list-logo-640x480-664ad9ac64.png`,
  `69-theme-configuration-game-artwork-logo-640x480-664ad9ac64.png` — #236 § B's
  #69 line on the candidate: `subset.gamelist-view-artwork` set to `boxart`,
  then `logo`, in `es_settings.cfg` with the interface stopped and the guest
  rebooted each time (StartupSystem `tools` for the run); the TOOLS list's
  File Manager keeps its icon under both, and THEME CONFIGURATION reads GAME
  ARTWORK LOGO, which is how the frames show the option was the one loaded.
  The guest's `es_settings.cfg` was put back as it was and the guest rebooted.

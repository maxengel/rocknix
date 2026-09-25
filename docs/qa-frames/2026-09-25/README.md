# QA frames, 2026-09-25 — the offline sign-in toast on the twenty-second cut `664ad9ac64`

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

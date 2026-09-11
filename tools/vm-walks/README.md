# VM walks

Step files for `tools/vm-visual-qa run`, one per screen worth reaching, so a
QA cycle replays a walk instead of rediscovering the keys.

```bash
W=tools/vm-walks
cat $W/reset.steps $W/to-manage-cloud-storage.steps $W/back-up-page.steps \
    $W/tick-roms.steps $W/continue-to-systems.steps $W/run-transfer.steps \
  | tools/vm-visual-qa --monitor /tmp/rocknix-qemu-monitor.sock run - --outdir shots/
```

## The steps wait for the screen, not for the clock

Every file here is written on `settle` and `wait-for-change` rather than
`wait N`. The reason is in fork #125: a step file made of fixed delays is a
guess about a machine that is also building an image, and a press one second
after a screen change is regularly eaten. The walk then runs its whole
remainder one screen out of phase -- a switch that did not toggle, a game
list that did not launch, a `LATER` that landed on the wrong row and typed
into a Wi-Fi password field. Three derails on 2026-09-10, two on 2026-09-11.

- `settle [timeout_s] [quiet_s]` waits until the frame has held still, and
  never fails a walk: a page that is still scanning simply runs to the
  bound. Use it before a `shot`, and after anything that loads or transfers.
- `wait-for-change [timeout_s] [retries]` waits until the frame differs from
  the one taken before the last `key`. An eaten press is re-sent once by
  default and then **fails the walk**, naming the key and the line, instead
  of letting every later step run against the wrong screen.
- `wake` spends the screensaver's free press on a key EmulationStation
  ignores.
- `dismiss-dialogs` closes whatever is open and ends on the carousel.

`tools/vm-visual-qa --help` is the reference for all of them, including the
frame-comparison thresholds and how they were measured. The two places a
fixed `wait` is still right are a deliberate sampler
(`run-transfer-frames.steps` wants a frame at a known offset, not a frame
when the page stops moving) and a pause where nothing on screen will change.

## Where a walk starts

The deterministic start is a **rebooted VM**: it comes up on the carousel,
awake, with nothing open. `reset.steps` reaches the same state from wherever
the interface happens to be, and is what to compose in front of a walk that
follows another in the same session.

A reboot is not a clean slate, though. The transfer pages' four class
switches are saved as `cloudsync.pick.<direction>.<class>` in
**`/storage/.config/system/configs/system.cfg`** when the page closes, and
restored at the next start -- so a `tick-*` walk, which flips rather than
sets, goes the wrong way after any earlier walk left one on. `suite.txt`'s
`default-pre` resets them; a hand-composed walk should do the same:

```bash
tools/vm-pair ssh b '. /etc/profile; for d in backup restore; do \
  for k in content media settings; do set_setting cloudsync.pick.$d.$k 0; done; \
  set_setting cloudsync.pick.$d.saves 1; done'
```

(That path is not the `/storage/.config/system.cfg` the rest of the harness
names, and a value written to it while ES is running does survive the
reboot.)

`reset.steps` used to be four B presses and now calls `dismiss-dialogs`,
because four is a guess: B closes a dialog, a menu or a game list, but on
the carousel it *opens* GO TO, so a fixed count lands on the carousel from
an even depth and on a dialog from an odd one. `wake.steps` remains for a
composition that needs only the wake; `reset.steps` wakes first itself.

A **restarted** EmulationStation (`systemctl restart emustation`) is not a
rebooted one: it restores the game list that was open, so a walk that
assumes the carousel starts one screen deep and its `x` presses launch
whatever is under the cursor (the File Manager, 2026-09-09). `screendump`
can also serve the previous ES's frame for half a minute afterwards. Reboot.

## The suite

`suite.txt` lists the compositions `tools/vm-qa --only walks` replays, one
per line, each from a rebooted guest. It exists because most files here are
a *leg* -- `back-up-page.steps` starts on the CLOUD hub, `run-transfer.steps`
on the systems page -- and the runner used to replay each file on its own,
so nine of them pressed A into the carousel and drove whatever game list was
under the cursor. The frames were counted and the suite passed.

`tools/vm-qa --skip-up --only walks --guest b` runs it against vm-pair's
second guest, which is how it runs while another session holds guest a.

## What each file expects

Every file states where it starts and where it leaves the focus, because the
next file depends on it. Read the file; the notes below are only the ones
that span files.

- `to-change-cloud-folder.steps` and `confirm-cloud-folder.steps` reach the
  CLOUD FOLDER editor and press OK on the current value; on MinIO, where
  `/ROCKNIX/Saves` is not a legal bucket name, that is the refusal dialog
  (#78). The walk takes **seven** downs since CHECK CONNECTION joined CLOUD
  STORAGE SETUP above CHANGE CLOUD FOLDER; with six it ran the connection
  check instead and sat on its dialog (2026-09-11).
- `ui-settings-toggle.steps` ends on USER INTERFACE SETTINGS with its last
  row -- SHOW RETROACHIEVEMENTS ICON, a Settings-backed switch -- toggled and
  focused; the next B closes the page and runs both settings writers
  (es_settings.cfg and system.cfg). It is the walk
  `tools/cloud-round-trip --only KILL13` drives before its power cuts, and
  that harness reads the file itself, so a changed row is fixed in one
  place. The toggle must stay the file's last `key x`: KILL13 truncates
  there for the trial that changes nothing. Frame-verified 2026-09-10 at
  1280x800 and 2026-09-11 at 640x480.
- `match-dialog.steps` runs the third action from the hub -- MATCH THIS
  DEVICE TO THE CLOUD -- through its confirmation to its done page. It needs
  the seed fixture (`cloud-test-backend seed-content` + `seed-device`) so the
  device holds ROMs the cloud does not, and it must run **before** the
  transfer walks, which upload exactly those: after them it reaches THIS
  DEVICE ALREADY MATCHES YOUR CLOUD. THERE IS NOTHING TO REMOVE. `suite.txt`
  orders it accordingly.
- The transfer flow is: hub -> transfer page (four class switches) ->
  CONTINUE (shown once ROMS AND BIOS or GAME CONTENT is on) -> the systems
  page -> BACK UP / RESTORE -> the transfer page -> PRESS ANY BUTTON TO
  CLOSE -> hub. The systems page's bar is BACK / SELECT ALL / BACK UP (or
  RESTORE), so from BACK the verb is two rights away, not one. The `tick-*`
  walks *flip* a switch rather than set it, which is deterministic only from
  a rebooted guest; read the frame.
- `run-transfer.steps` presses SELECT ALL and then the verb, and **needs no
  system ticked when it starts**. The verb runs whatever the picker last
  saved to `/storage/.cache/cloud_sync/content-systems` -- saved on every
  close, BACK included, and kept across a reboot -- and with nothing ticked
  `cloud_content_backup --selected` exits 1
  before any rclone runs, so the page ends FAILED with rows 3-4 blank and
  the walk has exercised no transfer. SELECT ALL is a toggle that reads
  SELECT NONE once everything is on, so on a VM where an earlier walk
  already saved SELECT ALL the same press clears the selection and fails the
  same way. Empty it over SSH or serial before the composition,
  `cloud_content_restore --set-systems ""` (a fresh image has none), and
  read the `selected-all` frame -- every switch on, the button reading
  SELECT NONE -- before trusting the frames after it.

What the keys mean is in `.claude/rules/generic-x64-vm-testing.md`
§ "Driving EmulationStation" and in `tools/vm-visual-qa --help`; the short
version: `ret` is START, `x` is A, `z` is B, `shift` is the wake key, and
`up` from a page's first row lands on its BACK button before it wraps to the
last row.

When a walk stops matching the interface (a row moved, a page was renamed),
fix the walk in the same change as the interface -- a walk that no longer
reaches its screen is the first thing the next cycle finds, and the
cheapest. Since #125 it is also the first thing the *walk* finds: the run
fails on the press that stopped landing, rather than four frames later.

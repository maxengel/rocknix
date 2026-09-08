# VM walks

Step files for `tools/vm-visual-qa run`, one per screen worth reaching, so a
QA cycle replays a walk instead of rediscovering the keys. Compose them:

```bash
W=tools/vm-walks
cat $W/wake.steps $W/reset.steps $W/to-manage-cloud-storage.steps $W/back-up-page.steps \
    $W/tick-roms.steps $W/continue-to-systems.steps $W/run-transfer.steps \
  | tools/vm-visual-qa --monitor /tmp/rocknix-qemu-monitor.sock run - --outdir shots/
```

Start every composition with `wake.steps` and then `reset.steps`, in that
order. The four B presses of `reset.steps` return any open dialog, menu or
game list to the system carousel, which is the state the other walks
assume; without it a walk replayed after another walk starts one screen
out of phase and lands somewhere unrelated (a PICO-8 game list,
2026-09-07). Wake comes first because its key is one EmulationStation
ignores: a B press that only wakes the screensaver is a B press not spent
closing something, and a B press that reaches the carousel opens a GO TO
dialog there (GO TO LETTER under the alphabetical systems sort, GO TO
MANUFACTURER under the manufacturer one; `SystemView::showNavigationBar`
picks by the SORT SYSTEMS setting) -- so a reset that starts asleep, or
one B short, ends on a dialog rather than the carousel (#85). The
deterministic start is a fresh EmulationStation (a rebooted VM, or
`systemctl restart emustation` over serial): it comes up on the carousel,
awake, with nothing open, and needs neither file. Use the pair when a walk
follows another in the same session; when the state is unknown, restart
instead of guessing. `to-change-cloud-folder.steps` and
`confirm-cloud-folder.steps`
reach the CLOUD FOLDER editor and press OK on the current value; on MinIO,
where `/ROCKNIX/Saves` is not a legal bucket name, that is the refusal
dialog (#78).

`match-dialog.steps` runs the third action from the hub -- MATCH THIS DEVICE
TO THE CLOUD -- through its confirmation to its done page; it needs the
seed fixture so the preview lists something.

The transfer flow is: hub → transfer page (four class switches) → CONTINUE
(shown once ROMS AND BIOS or GAME CONTENT is on) → the systems page → BACK
UP / RESTORE → the transfer page → PRESS ANY BUTTON TO CLOSE → hub. The
systems page's bar is BACK / SELECT ALL / BACK UP (or RESTORE), so from
BACK the verb is two rights away, not one. The
`tick-*` walks *flip* a switch rather than set it, because the page
remembers its last state per direction; read the frame to know where you
are.

`run-transfer.steps` presses SELECT ALL and then the verb, and **needs no
system ticked when it starts**. The verb runs whatever the picker last saved
to `/storage/.cache/cloud_sync/content-systems` -- saved on every close,
BACK included, and kept across an EmulationStation restart -- and with
nothing ticked `cloud_content_backup --selected` exits 1 before any rclone
runs, so the page ends FAILED with rows 3-4 blank and the walk has exercised
no transfer. SELECT ALL is a toggle that reads SELECT NONE once everything
is on, so on a VM where an earlier walk already saved SELECT ALL the same
press clears the selection and fails the same way. Empty the selection over
serial before the composition, `cloud_content_restore --set-systems ""` (a
fresh image has none), and read the `selected-all` frame -- every switch on,
the button reading SELECT NONE -- before trusting the frames after it.

Every file states where it starts and where it leaves the focus, because
the next file depends on it. What the keys mean is in
`.claude/rules/generic-x64-vm-testing.md` § "Driving EmulationStation"; the
short version: `ret` is START, `x` is A, `z` is B, and `up` from a page's
first row lands on its BACK button before it wraps to the last row.

When a walk stops matching the interface (a row moved, a page was renamed),
fix the walk in the same change as the interface — a walk that no longer
reaches its screen is the first thing the next cycle finds, and the cheapest.

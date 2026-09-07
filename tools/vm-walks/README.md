# VM walks

Step files for `tools/vm-visual-qa run`, one per screen worth reaching, so a
QA cycle replays a walk instead of rediscovering the keys. Compose them:

```bash
W=tools/vm-walks
cat $W/wake.steps $W/to-manage-cloud-storage.steps $W/back-up-page.steps \
    $W/tick-roms.steps $W/continue-to-systems.steps $W/run-transfer.steps \
  | tools/vm-visual-qa --monitor /tmp/rocknix-qemu-monitor.sock run - --outdir shots/
```

`match-dialog.steps` runs the third action from the hub -- MATCH THIS DEVICE
TO THE CLOUD -- through its confirmation to its done page; it needs the
seed fixture so the preview lists something.

The transfer flow is: hub → transfer page (four class switches) → CONTINUE
(shown once ROMS AND BIOS or GAME CONTENT is on) → the systems page → BACK
UP / RESTORE → the transfer page → PRESS ANY BUTTON TO CLOSE → hub. The
`tick-*` walks *flip* a switch rather than set it, because the page
remembers its last state per direction; read the frame to know where you
are.

Every file states where it starts and where it leaves the focus, because
the next file depends on it. What the keys mean is in
`.claude/rules/generic-x64-vm-testing.md` § "Driving EmulationStation"; the
short version: `ret` is START, `x` is A, `z` is B, and `up` from a page's
first row lands on its BACK button before it wraps to the last row.

When a walk stops matching the interface (a row moved, a page was renamed),
fix the walk in the same change as the interface — a walk that no longer
reaches its screen is the first thing the next cycle finds, and the cheapest.

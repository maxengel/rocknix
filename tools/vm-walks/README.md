# VM walks

Step files for `tools/vm-visual-qa run`, one per screen worth reaching, so a
QA cycle replays a walk instead of rediscovering the keys. Compose them:

```bash
cat tools/vm-walks/wake.steps tools/vm-walks/to-manage-cloud-storage.steps \
    tools/vm-walks/systems-to-back-up.steps | tools/vm-visual-qa --monitor /tmp/rocknix-qemu-monitor.sock run - --outdir shots/
```

Every file states where it starts and where it leaves the focus, because
the next file depends on it. What the keys mean is in
`.claude/rules/generic-x64-vm-testing.md` § "Driving EmulationStation"; the
short version: `ret` is START, `x` is A, `z` is B, and `up` from a page's
first row lands on its BACK button before it wraps to the last row.

When a walk stops matching the interface (a row moved, a page was renamed),
fix the walk in the same change as the interface — a walk that no longer
reaches its screen is the first thing the next cycle finds, and the cheapest.

# Audit: every flow against D-CLOUD-077 (fail gracefully) and D-CLOUD-078 (keep the last known good state)

Maintainer, 2026-09-10: *"With this new rule, do we want to take a pass through
all of our flows and make sure they're adhering to these new guidelines, and
then work on new builds to satisfy that?"* — yes. Three read-only audits, run
in parallel on `next` `d452f185b6` / ES `e46093354`, reports verbatim:

- `scripts-and-writers.md` — every write the cloud scripts, `backuptool`, the
  settings functions and the boot-time config checker make, judged on the
  three obligations (positive success check; replace only after it; remove
  the superseded record once) with the consequence of a kill at each step.
- `emulationstation-flows.md` — every flow's outcome texts, recovery path and
  retry, the two settings writers, and the proposed outcome vocabulary.
- `kill-fixtures-design.md` — the harness design that makes the rule
  mechanical: kill at every step, power-cut cells, one-record and message
  assertions.

The consolidated fix list lives on #105; the tranche that implements it is
recorded in the work log and the changelog as it lands.

---
paths:
  - "packages/**"
  - "projects/**"
  - "scripts/**"
---

# Every change ships onto devices that already have state

Full detail: `.github/instructions/upgrade-and-install.instructions.md`.

- **An upgrade should be invisible.** Before reaching for a migration, a prompt
  or a release note, ask whether the code can read both shapes and write the
  new one. A prompt is a failure mode, not a solution — it asks somebody about
  a setting they never chose. A release note is never a mitigation.
- **Fixing forward is not enough.** A fix that changes what we *write* does
  nothing for what is already written. Ask separately: can new code read old
  data, can old code read new data, does anything need migrating.
- **A config option must be in both** `*.conf` and `*.conf.defaults`, or it
  never reaches an upgraded device. Note the asymmetry: a key that already
  exists is left alone, a new key is added — so a new key can land beside old
  values it contradicts.
- **Verify on a device, not on the host.** Host tools differ from the device's,
  and the gap hides real failures.

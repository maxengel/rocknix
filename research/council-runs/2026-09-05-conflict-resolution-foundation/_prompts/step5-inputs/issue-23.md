# #23 [OPEN] conflict-resolution: ES-native Vita-style conflict wizard
labels: cloud-saves  milestone: Cloud Saves: Visual Conflict Resolution

Part of the conflict-resolution milestone (epic: #11). Depends on the detection engine (#22). Console-first: everything happens in EmulationStation with a controller.

Modeled on the PlayStation Vita's sync conflict screen: the player sees **both versions side by side with screenshots** and decides.

## Flow

> **Superseded 2026-08-24.** The design below replaces the original
> Vita-style spec. Full IA and rendered wireframes:
> [`docs/conflict-wizard-ia.md`](https://github.com/maxengel/rocknix/blob/next/docs/conflict-wizard-ia.md)
> · <https://claude.ai/code/artifact/5da9ce12-b088-4db0-8557-4b34fe454dd6>

- [ ] **No entry screen.** The conflict count is the header of the first
      conflict ("3 CONFLICTS FOUND"); non-conflicting files sync first, without
      prompting.
- [ ] Walkthrough ordered **system by system, then game by game**.
- [ ] Per conflict: two panels, **CLOUD always left**, THIS DEVICE right, with
      the source badge overlaid on the picture.
- [ ] **Savestates** show the RetroArch screenshot. **In-game saves show a
      glyph** — no screenshot exists for a `.srm`, and substituting a different
      image would drive wrong choices.
- [ ] Metadata per side: date · time · device + model · core/emulator +
      version. **No file size, no play time** (neither is actionable, and
      ranking by play time reintroduces a recency-style heuristic).
- [ ] Choices: **KEEP LEFT / KEEP RIGHT / KEEP BOTH**; the selected column(s)
      highlight, so LEFT/RIGHT never has to be mapped onto CLOUD/DEVICE.
- [ ] **KEEP BOTH is savestates only**, moving the merged copy to the next free
      slot via ES's own `getNextFreeSlot()`. On in-game saves it is **dimmed
      with a reason** (fixed cartridge slots), not hidden.
- [ ] **No summary screen and no deferral.** The last CONTINUE becomes
      **COMPLETE**; nothing transfers until then. A "Review decisions before
      applying" setting (off by default) restores the summary for those who
      want it.
- [ ] **Keep discarded saves** setting (off by default) with a retention count,
      shown dimmed while off — this, not deferral, is the escape hatch for
      "I am not sure", and it is what makes a one-way choice acceptable.
- [ ] Compatibility badge when the other side's savestate would not load here
      (from #19 rules).
- [ ] Resolutions recorded in an **audit log**.

## Building blocks (see es-native-ui.instructions.md)
ImageComponent side-by-side in a ComponentGrid, GuiMsgBox confirms, AsyncNotificationComponent for the apply step, GuiLoading for manifest fetch.



## Futro adjustments (2026-09-05, futro on #11)

- [ ] The wizard opens only after the non-conflict pre-pass (cloud-only down, device-only up) has **completed**, and says so if it has not — otherwise KEEP BOTH can pick a slot the cloud already holds and one resolved conflict becomes a new one at the next sync.
- [ ] The done page names each discarded copy per game, and its audit line (`/storage/.cache/log/cloud_audit.log`, D-CLOUD-027) is written **before** the apply step deletes anything.
- [ ] Layout proven at 480×320 (RG351M) first and at 640×480, by `tools/vm-visual-qa` frames, not by reading the code.
- [ ] The compatibility badge is designed only after #19 has run (D-CLOUD-025); until then the panels show core + build pin as plain text.


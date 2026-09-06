**Summary.** Save states get a directory per core; the core build pin travels as data in the manifest, not in the path (D-CLOUD-017). Game saves stay one shared pool. This is the **last** build step of the milestone: the manifest keys entries by path relative to the saves root, so the layout change is a re-key and nothing else depends on it (`docs/save-manifest-schema.md` §9).

**What changed.** The title's "per-chipset/arch" is gone (D-CLOUD-017, blindspot 27). Whether chipset is an axis at all is Gate 8's to answer (#19) and does not gate this issue: directories are per **core** regardless.

### What was found before building

- There is **no `es_savestates.cfg`** anywhere — not in the ES repo, the rocknix tree, or on the device. ES runs on `SaveStateConfig::Default()` (`directory = "{{system}}"`, `SaveStateConfigFile.cpp`) and the root is hard-coded. This issue **creates** the file for the ES package.
- Creating it has a side effect the compiled default does not: every emulator entry parsed from the file gets `racommands = false` unconditionally, and `incremental`/`autosave` default to `false` unless the file sets them (`SaveStateConfigFile.cpp`, constructor). `racommands` decides whether ES copies a chosen state to `.state.auto` before launch or passes `-state_file` (`SaveState.cpp` `setupSaveState`). The flip is a behaviour change every player sees at launch and is Gate 9's first fixture.
- `{{core}}` in the directory template splits cores; `defaultCoreDirectory` lets the default core keep reading the existing flat directory while other cores get their own (`getSaveStateConfigs`). That is how both layouts stay discoverable without scanning: `defaultCoreDirectory = "{{system}}"`, other cores `{{system}}/{{core}}`.
- RetroArch writes where `savestate_directory` points (`setsettings.sh`, `${SNAPSHOTS}/${PLATFORM}` today). Two consumers, one layout, verified together.
- The sync allowlist already passes any depth under `savestates/` (fixture: `savestates/fbn/snes9x/mslug.state2` passed; `docs/save-manifest-alignment-review.md`).

### Acceptance (after Gate 9, after the wizard ships)

- [ ] With the new `es_savestates.cfg` on the H700, a state saved from the save state manager loads from it; the auto state still restores; `racommands`, `incremental` and `autosave` behave as they do today or the difference is recorded and accepted.
- [ ] A state written by a non-default core lands in `{{system}}/{{core}}/` and appears in the save state manager; states already in the flat directory remain visible and loadable for the default core.
- [ ] RetroArch's `savestate_directory` resolves to the same directory ES lists, per core, on the same device.
- [ ] Existing states are `unknown` in every provenance field and never stamped (`.claude/rules/upgrade-and-install.md`); any move of player data is copy → verify → delete, resumable, idempotent (D-CLOUD-026 shape).
- [ ] The reconciler treats the moved paths as a re-key: no conflict, no new version, no duplicate left behind (D-CLOUD-030 compaction runs once).
- [ ] A device that has not updated reads the flat layout and is not broken by a device that has (blindspot 10).

**Does not build**: nothing keyed on chipset, arch or device; no directory named after a build; no migration before the wizard has shipped.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*

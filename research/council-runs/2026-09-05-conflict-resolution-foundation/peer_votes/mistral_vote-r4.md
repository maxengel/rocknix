I vote for **kimi-revised_plan-r4.md**.

## Reasoning

The kimi plan is the one I would hand to a builder on Monday. It is the most complete specification of the foundation, with the fewest unanswered questions and the fewest places where a wrong reading produces silent data loss. It also aligns most closely with the maintainer’s two binding amendments: reversibility as one-step retention, on by default, no V1 undo control; and the restore tool as a separate issue.

### Where kimi’s plan is stronger

1. **The retention store is specified for its future reader.** The store’s layout, keys, ordering, and record contract are all written so that the future restore tool can answer *"show me the retained past versions of this game, newest first, with a thumbnail, the producing device, and which side won"* without scanning unrelated games, trusting mutable manifests, or relying on the rotating audit log. The other three plans either omit the store’s physical layout or leave its discovery path unspecified. The kimi plan’s reader test (§4) is the acceptance gate that proves the store survives the amendment’s requirement.

2. **The write-path replacement is complete.** The kimi plan replaces every writer of the save tree — boot, SYNC/UPLOAD/DOWNLOAD rows, the hub tick, the Tools symlinks, the game-exit pass, the future #37 SYNC tile, and a maintainer at an SSH prompt — with one coordinator that reads current cloud evidence before writing. The other three plans either omit one or more writers or leave the replacement mechanism unspecified. The kimi plan’s typed outcomes and exit codes (§3.4) are also the most concrete, with a clear mapping from rclone’s native exits to the scripts’ reserved skip codes.

3. **The lifecycle gate is specified.** The kimi plan owns the gate across the emulator’s process lifetime, surviving an EmulationStation crash-and-restart, and excludes the save tree from every sync pass while a game runs. The other three plans either omit the gate or leave its ownership unspecified. The kimi plan’s sealed stage copies (§3.5) are also the most concrete, with a temp name matching neither ES regex.

4. **The classifier is specified.** The kimi plan’s three-way classifier over complete member maps is the most concrete, with a table that folds out moves first and qualifies them (§3.3). The other three plans either omit the classifier or leave its verdict table unspecified. The kimi plan’s unit descriptor (§3.1) is also the most concrete, with `kind: container` confined to single-file multi-game saves and multi-file containers expressed as declared units over per-file entries.

5. **The tombstone rule is specified.** The kimi plan’s bounded `retirements` list in the per-device manifest, with explicit applicability/consumption semantics (§3.9), is the most concrete. The other three plans either omit tombstones or leave their lifetime unspecified. The kimi plan’s resurrection consequence is also stated plainly: a forgotten tombstone plus a late device means the file returns as device-only and is uploaded without a prompt — non-destructive, self-correcting, at worst a later conflict the wizard shows.

6. **The picks are settled.** The kimi plan’s six picks (§5) — store home, store keying, tombstone lifetime, manifest transport, protected publication, retention count — are the most concrete. The other three plans either omit one or more picks or leave them unspecified.

### Where the other plans fall short

- **claude-revised_plan-r4.md** is the second-strongest plan, but it omits the retention store’s physical layout and leaves its discovery path unspecified. It also omits the lifecycle gate’s ownership and leaves the write-path replacement mechanism unspecified. Its tombstone rule is less concrete, and its picks are less settled.

- **gpt-revised_plan-r4.md** is the third-strongest plan, but it omits the retention store’s physical layout and leaves its discovery path unspecified. It also omits the lifecycle gate’s ownership and leaves the write-path replacement mechanism unspecified. Its classifier is less concrete, and its tombstone rule is less concrete.

- **gemini-revised_plan-r4.md** is the weakest plan. It omits the retention store’s physical layout and leaves its discovery path unspecified. It also omits the lifecycle gate’s ownership and leaves the write-path replacement mechanism unspecified. Its classifier is less concrete, its tombstone rule is less concrete, and its picks are less settled.

### What the kimi plan needs to satisfy the amendments

The kimi plan already satisfies the maintainer’s two amendments. It retains the discarded copy on by default, bounded by a count, and ships no undo control. The done page says what was discarded and that the copies are kept on this device. The store is designed for the future restore tool, and the reader test (§4) is the acceptance gate that proves it.

The kimi plan also already states the resurrection consequence of a forgotten tombstone: the file returns as device-only and is uploaded without a prompt — non-destructive, self-correcting, at worst a later conflict the wizard shows. This is the maintainer’s "fail closed on unexplained absence, cheaply, without abandoning deletion propagation" requirement.

### Dissent — what the other plans have that kimi’s plan does not fully absorb

1. **claude-revised_plan-r4.md’s manifest-last transport.** The kimi plan adopts `--files-from` with payload and manifest together, but claude’s manifest-last second spawn is an optional, measured optimization. The kimi plan’s reader coherence check is the safety, not ordering. The claude plan’s manifest-last spawn is not load-bearing, but it is a measured option the kimi plan could adopt after the transport gate passes.

2. **gpt-revised_plan-r3.md’s agreement context binding.** The kimi plan adopts the binding, but gpt’s register refinement (§2) is more concrete. The kimi plan’s `sync_context` block could be made more explicit about the remote’s non-secret identifying fields.

3. **gemini-revised_plan-r3.md’s protected publication protocol.** The kimi plan adopts the sibling `--backup-dir` mechanism, but gemini’s protected publication is a conditional requirement. The kimi plan’s race fixture (gate 6) decides whether the protocol is needed; if it is, the kimi plan’s warn-and-refuse same-ID is the fallback.

### Remaining defect in the kimi plan

The only remaining defect is that the `#10 per-core namespacing` rehearsal (§3.10) is not embedded. The rehearsal’s three questions — whether the non-`racommands` launch path works, whether an ES patch scanning both the flat and per-core directories preserves discovery of existing states, and whether losing the `.auto`/`.bak` dance changes observable behavior — are not inspectable from the embedded corpus. The rehearsal is a gate, not a defect in the design, but it is a gap in the evidence.

---

## Summary

The kimi plan is the most complete specification of the foundation, with the fewest unanswered questions and the fewest places where a wrong reading produces silent data loss. It aligns most closely with the maintainer’s two binding amendments, and it is the one I would hand to a builder on Monday. The other three plans either omit key parts or leave them unspecified. The kimi plan’s retention store, write-path replacement, lifecycle gate, classifier, tombstone rule, and picks are all concrete and specified for their future readers. The only remaining gap is the `#10` rehearsal, which is a gate, not a defect in the design.
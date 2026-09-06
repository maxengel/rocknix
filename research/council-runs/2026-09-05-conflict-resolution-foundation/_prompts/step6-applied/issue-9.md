**What changed.** This issue no longer replaces the two scripts with bisync, and bisync is no longer "the detector". Detection is the reconciler's classifier over sha256 identity and local agreement (#22; D-CLOUD-030/031). What bisync may be is the **transport for full passes** under that layer — and whether it can be is settled by this spike, scored against the contract below, not by reasoning (D-CLOUD-039). The planning note on `rclone-bisync-beta` (`plans/bisync/rclone-bisync-planning.md`, Phase 3 "newer file wins", `--conflict-resolve newer`) is struck: resolution never defaults to recency (`docs/save-manifest-alignment-review.md` §3.1). The exit push is not bisync's: it is a decided, to-the-cloud-only `copy --files-from` (#22 R5) whatever this spike finds.

### The layer above bisync is not bisync

Which device wrote a version, which core and build, when, and its thumbnail are not on disk; no sync tool produces them. They are recorded at exit by the one process that knows (#21). The only overlap between the reconciler and bisync is the *comparison*. The spike asks whether bisync can move files under that layer without becoming a second authority over which version is current.

### The contract (score each item PASS / FAIL, and each FAIL as *upstream-shaped* or *architectural*)

1. **Reports, never resolves.** With `--conflict-resolve none`, a both-changed pair is reported in a form a script can parse without reading a fixed line position (`.claude/rules/engineering-practices.md` *Guards must fail closed*), and neither file changes.
2. **No renames on the saves tree.** A save-state loser is never left renamed (`…conflict1` breaks `{{romfilename}}.state{{slot}}`, `SaveStateConfigFile.cpp` `SetupRegEx`). Either bisync can be configured so, or the reconciler constrains the run so it cannot happen; a dry-run listing grepped for `conflict` is the guard and is shown to fire on a constructed conflict.
3. **Decided transfers only.** bisync moves exactly the set the reconciler decided (a per-run filter file or equivalent) and nothing else — so a unit the classifier holds is not half-installed by a per-file transfer.
4. **Hashless backend.** On the QA WebDAV (no hashes, no modtime precision, #53) an equal-size byte change is never treated as identical by anything that decides.
5. **External resolution without `--resync`.** After the wizard installs a winner and pushes it, the next run — with no `--resync` — neither re-flags nor re-transfers the pair.
6. **Interruption.** A run killed mid-transfer is completed by the next run with `--recover`/`--resilient`; the listing state under `/storage/.cache/rclone/bisync` is consistent; nothing is lost; `--resync` is never needed after the maintainer-driven first run.
7. **Renumber.** ES's rename (same hash, new slot) — a delete-plus-create to any file sync — loses no data and leaves the reconciler's move rule applicable.
8. **Absence never deletes without the reconciler's word.** An unmounted or empty saves root with listings on record does not propagate deletions (bisync's own `--max-delete` is not the guard the reconciler relies on).
9. **Budget.** Spawns and seconds for a full pass with nothing changed on the H700, recorded against today's ≈5 s contract (D-CLOUD-028; `.claude/rules/rclone-cloud-sync.md` § budget).
10. **Single authority.** bisync's listings are never read as agreement; `agreed.json` is (#22 R7). bisync runs correctly when fed only the reconciler's decisions.

### Fixtures (venue: VM against `tools/cloud-test-backend`, WebDAV and MinIO; then the RG35XX SP against Dropbox — blindspot 8)

A multi-file save (an N64 `.eep`+`.mpk` pair) resolved as a unit and published torn; a hashless backend; an external resolution with no `--resync`; an interrupted run; a device-side renumber; compressed states (`#RZIPv`); an unmounted root. The fixtures live in `tools/cloud-round-trip` (#35).

### Verdict rule

All PASS → bisync is the full-pass transport under the reconciler. Any *architectural* FAIL → the reconciler's own transport for every pass: `rclone copy --files-from --ignore-times` per direction (the handoff's I22), bisync not used. Only *upstream-shaped* FAILs → a request on `rclone/rclone` naming the gap, and until it lands the reconciler classifies the affected case as one it cannot transfer — it holds or queues it — and never resolves it by a second mechanism (D-CLOUD-039).

### Acceptance

- [ ] Each contract item above has a recorded result from both venues, with the command, the rclone version (`rclone version` on the device, not the host), and the observed output.
- [ ] Item 2's guard is watched firing on a constructed conflict before it is trusted.
- [ ] Item 6 is observed after a real kill mid-transfer, not a `--dry-run`.
- [ ] The verdict is recorded on this issue and mirrored on #22 before #22's transport is coded.
- [ ] Any upstream request is linked here.

**Preceded by** Gate 0. **Does not build**: no resolution logic, no `--resync` anywhere unattended, no bisync on the exit path.

---

---
*Body written from the council's handoff, `research/council-runs/2026-09-05-conflict-resolution-foundation/final-issue-draft.md` (consensus plan `revised_approaches/consensus_plan.md`), applied 2026-09-06 per the maintainer.*

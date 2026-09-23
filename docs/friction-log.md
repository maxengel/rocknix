# Friction log

What slowed the work down, written the moment it did, one line each -- and
within three days either an issue that owns the fix or the guard that now
catches it. `tools/ceremony-check` reads this file: an entry older than three
days that still says `issue: none` refuses the next push of `next`. The
mini-retro's second question ("what was harder than expected?") reads it too,
so a retro starts from what the days recorded rather than from what a session
remembers (#254; Pongogo's `retrospective_triggers`, adapted).

Format, one entry per line so a tool can read it:

    - <yyyy-mm-dd> <HH:MM> UTC -- <what slowed us, in one sentence> -- guard: <what would have caught it, or none> -- issue: #N | guard | none

`issue: guard` means the guard named on the line exists in the tree and no
issue is needed; `issue: none` is the state that expires.

## Entries

- 2026-09-23 05:20 UTC -- #250's proof compared the arrow against the fifth cut, which already carried the defect, and read a correct fix as a regression for an hour -- guard: the acceptance box names the baseline from before the series' first change; `tools/frame-diff` against an accepted cut -- issue: #252
- 2026-09-23 16:50 UTC -- the first frame-diff run failed on 156 boxes my own fixture had caused (the backdrop, the systems page) and on the hub's state differing between a full run and a walks-only run -- guard: the walks fix the state they frame (`default-pre`) and reset the QA cloud before seeding -- issue: #252
- 2026-09-23 17:40 UTC -- vm-qa run 19 died after 22 minutes because `tools/vm-qa` was edited while it ran; bash reads a script by offset -- guard: memory `never-edit-a-running-bash-script`; a running run's tools are not edited -- issue: none
- 2026-09-23 18:50 UTC -- four "pending decisions" were put to the maintainer that the issues' comments, the commits and the register had settled -- guard: `tools/archaeology` before anything is called pending; a register row the day a decision is made -- issue: #253
- 2026-09-23 19:00 UTC -- `StartupSystem` does not land the carousel on `imageviewer`, so the SCREENSHOTS list and the viewer have no walk -- guard: none yet -- issue: #252
- 2026-09-23 20:30 UTC -- the ceremonies (retro, futro, audit) stopped when the work became a stream of RC cuts: fifteen cuts and six blindspots since 09-14 with none of them run, because each was tied to a phase boundary that never came -- guard: `tools/ceremony-check` in the push guard and the fork CI -- issue: #254

# VM QA log

One row per VM test cycle, so the next cycle starts from the last one rather
than from zero. The ritual that fills it is `generic-x64-vm-testing.md`
§ "After every VM cycle"; the narrative stays in the work logs. A cycle is a
built image driven in the GENERIC_X64 VM against a fixture, with frames read
and the endpoint inspected.

| Date | Scope | Image(s) | What the VM found | What it could not prove | Left behind (tool / walk / rule) |
| --- | --- | --- | --- | --- | --- |
| 2026-09-06 | #76 scraped content switch, systems pages per direction (D-CLOUD-048) | GENERIC_X64 ×4, `next` `44737b76ba`→`2b2a8d385f` | Busybox has no `comm` (counts read 0); `MEDIA_EXCLUDES` passed to neither copy (media uploaded with the switch off; blindspot 30); the switch row wrapped to three lines (D-UI-023) | A restored-then-scraped real library (343 MB SNES media on the RG35XX SP); a real provider | `generic-x64-vm --headless/--daemonize`, `tools/vm-serial`, `vm-visual-qa` stdlib PNG, `cloud-test-backend seed-content`/`seed-device`, `tools/vm-walks/` (wake, to-manage-cloud-storage, systems-to-back-up, systems-to-restore, toggle-scraped-content); rule §§ Headless / Driving ES / busybox / Fixtures / After every cycle |
| 2026-09-06 | #77 game content as a class; CONTINUE opens the systems page; the game list moves with game content (D-CLOUD-049/050) | GENERIC_X64 ×2, `next` `91b8c62ca4`→`0803aa195c` | `BACKING UP SAVES AND ROMS AND BIOS` (a class name containing AND cannot be joined by AND); a backup never carried BIOS once the picker stopped listing it (restore had the union, backup did not) | The RG35XX SP's real library under ROMS AND BIOS alone; a real provider | First cycle run entirely on the previous cycle's tools: `run --headless --daemonize`, `vm-serial wait/script`, `seed-content`/`seed-device`, composed walks — nothing rediscovered. New walks for the CONTINUE flow (`back-up-page`, `restore-page`, `tick-roms`, `tick-game-content`, `continue-to-systems`, `run-transfer`) |


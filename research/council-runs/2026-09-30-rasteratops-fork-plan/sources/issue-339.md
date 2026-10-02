# Issue #339: A complete adversarial review of the whole codebase, in tiers: the fork's own 121,000 lines, then what the image runs, then the interface; patches by provenance

Opened 2026-09-30T00:30:01Z

**Maintainer, 2026-09-30 (chat, D-QA-012):** *"If I'm doing a clean fork and it's becoming my own thing, I'd be interested in running through a complete adversarial code review of the entire codebase, but I'm curious how big it is."*

**How big it is** (counted 2026-09-30 from the checked-in files, blank lines included):

| Tree | Lines | Files | What the lines are |
| --- | ---: | ---: | --- |
| distribution, whole tree | 1,620,784 | 8,965 | patches 525,304; kernel and emulator `.conf` 265,552; Markdown 257,075 (the fork's records); scripts 92,143; YAML 65,931; recipes 52,981 |
| distribution, upstream-bound roots only | 1,296,255 | 6,684 | the same less the fork's overlay |
| the fork's own additions on those roots (`upstream/next..next`) | +79,181 | -- | the product (about 40,000: the cloud scripts, the proxy, the OS scripts, the RetroArch patches) and the QA tooling under `tools/` (the rest) |
| EmulationStation fork, whole tree | 566,484 | 1,098 | translations 154,087; C++ and headers 238,353; C 80,144; XML 63,261 |
| EmulationStation, `es-app/src` and `es-core/src` | 184,891 | 482 | the code that runs |
| the fork's own additions there (`rocknix/master..test/qa-integration`) | +42,180 | -- | the pages, the cards, the text rules, the tests |
| the site checkout | 8,635 | 296 | Markdown |

So "the entire codebase" is about 1.3 million lines on the distribution side, of which most is not code a review reads line by line: half a million lines of kernel and emulator patches (upstream's and their upstreams'), a quarter million of kernel configuration, the translations. The code that runs on a device and can be read is about 90,000 lines of shell, 53,000 of recipes, 185,000 of C++ in the interface, and the fork's own 121,000 across both.

**A complete adversarial review, in tiers** (the `code-auditor` skill at milestone tier with both council seats, as the fix-round audits ran; a seat's packet is about 500 KB, roughly 12,000 lines, and the fix-round audit read 40,000 lines in eight packets in an evening):

1. **Tier 1: what the fork wrote** -- the 121,000 lines above. The audits so far covered each fix round against its own scope, never the whole at once; this is the first act of the new OS, and its punch list is the `0.0.x` fix list. About twenty packets a seat.
2. **Tier 2: what the image runs that upstream wrote** -- the OS scripts, the launcher, the recipes the image builds, the quirks for the four devices: about 140,000 lines of shell and recipes. Twelve to fifteen packets. Findings here are the fork's to fix now, since there is no longer anyone to send them to.
3. **Tier 3: the interface** -- the 185,000 lines of `es-app` and `es-core` the fork's pages sit on, batocera's and ROCKNIX's. Fifteen packets. The libretro work (#336) will change its launch path, so this tier is read before that work starts.
4. **Not read line by line:** the patches and the kernel configurations, reviewed by provenance instead (each patch's origin named, upstream-merged or fork-carried, with its reason), which is a table, not a reading.

Can this be done on the VM? The review is host work; every finding that claims a behaviour is proven on the VM before it is a punch item.

## Acceptance criteria

- [ ] `docs/audits/<date>-milestone-whole-codebase-tier-1/` with the six phase files, both seats' packets under `second-opinions/`, `tools/lint-audit-artifacts` PASS, and a punch-list issue; then tiers 2 and 3 the same.
- [ ] The provenance table for the patches and configs under `docs/audits/…/patches-provenance.md`, one row per patch, with the count of rows equal to the count of patch files in the tree.
- [ ] Every punch item resolved through Phase 7 before `0.1`, or accepted by a register row.


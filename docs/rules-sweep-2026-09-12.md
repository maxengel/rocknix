# Instruction-file sweep, 2026-09-12

**Maintainer, 2026-09-12 (#147):** *"We should make sure that our instruction files
and decision log contain everything around our naming schemes, preferences, etc.
Same goes for what we've discussed around the time to play and the other rules. We
want to make sure these are being enforced by the agents at the right times as well
as being logged as decisions. It might be worth us doing an instruction file sweep
to ensure alignment with other documentation we've developed."*

Swept: all 21 files under `.claude/rules/`, `CLAUDE.md`, `AGENTS.md`,
`docs/device-testing-policy.md`, `docs/decision-register.md`,
`docs/blindspot-register.md`, `docs/es-menu-map.md`, `docs/conflict-wizard-ia.md`,
`docs/es-ui-style-guide.md`, `docs/cloud-vocabulary-audit.md`,
`docs/save-history-consensus-amendment.md`, `docs/retrospective/carry-forward.md`,
the work logs of 2026-09-06 … 2026-09-12, `.githooks/pre-push`,
`tools/vocabulary-check`, `tools/last-good-scripts-test`, `tools/vm-qa`,
`tools/time-to-play`, `tools/pkgcheck` and `tools/fork-worktree`.

## How to read the table

- **Loads when?** A rule file with `paths: - "**"` matches every file in this repo,
  so it is in context whenever anything is. A file with **no** `paths:` key loads at
  session start, every session (`instruction-files.md`). A narrow glob is the only
  case that can miss, and the column says whether it does.
  Crush loads the whole directory recursively and ignores `paths:` entirely, so a
  narrow glob only ever costs Claude Code.
- **Checked?** "none" means no tool looks at it; "not checkable" means no tool
  reasonably could; "**checkable, unchecked**" is a finding.
- A row marked **GAP** was closed by this change unless the Gaps-left-open section
  says otherwise.

## 1. Naming and vocabulary

| Rule | Written | Loads when? | Register row | Checked? | Contradiction |
|---|---|---|---|---|---|
| Four tiers — *settings*, *saves* (game saves, save states, and screenshots), *ROMs and BIOS*, *game content* | `es-native-ui.md` § Conventions | `**` → always | D-UI-022, D-CLOUD-049/050 | checkable, unchecked | `docs/cloud-vocabulary-audit.md` predates *game content* and still says three tiers — historical audit, left as written |
| Two verbs only — *back up* and *restore*; nothing is "uploaded" or "archived" in a label | `es-native-ui.md` § Conventions | `**` → always | D-UI-022 | checkable, unchecked | — |
| *Sync* is reserved for the automatic two-way behaviour; the automatic cards say SYNCING SAVES, the deliberate page says BACK UP / RESTORE | `es-native-ui.md` § Conventions; `least-surprise.md` | `**` / no glob → always | D-UI-022, D-UI-040, D-CLOUD-113 | checkable, unchecked | — |
| Banned: *system backup*, *save data*, *configurations*, *everything*, *cloud library* | `es-native-ui.md` § Conventions | `**` → always | D-UI-022 | checkable, unchecked — 3 shipped ES strings still say CONFIGURATIONS (`GuiMenu.cpp:395/416/467`, upstream RetroArch-reset warnings, outside the cloud tiers) | — |
| "back up" (verb, two words) vs "backup" (noun, one word) | `es-native-ui.md` § Conventions | `**` → always | D-UI-047 | **yes** — `tools/vocabulary-check`, run by `tools/vm-qa` as the `vocabulary` suite on every image. The only vocabulary rule with a check | — |
| Serial comma, always | `es-native-ui.md` § Conventions | `**` → always | D-UI-022, D-UI-031, D-UI-048 | not checkable | `docs/es-ui-style-guide.md:97`'s model string broke it — **fixed** |
| "game save" vs "save state" (two words) | `es-native-ui.md` § Conventions | `**` → always | D-UI-022 (by reference), D-UI-048 | checkable, unchecked — **14 shipped ES strings say `SAVESTATE(S)`** (`GuiMenu.cpp:1253, 4959-4978, 7665-7669, 8079`), filed as #148 | `docs/conflict-wizard-ia.md:138` headed its own columns *Savestate* / *In-game save* — **fixed** |
| "Wi-Fi", hyphenated, in every user-visible string | `es-native-ui.md` § Conventions | `**` → always | **GAP**, closed here: D-UI-048 | checkable, unchecked — clean today: 0 unhyphenated hits in 3,011 ES strings and none in the scripts |  — |
| The wizard's kept losers are *discarded saves*; *discard* means nothing else | `es-native-ui.md` § Conventions | `**` → always | D-UI-022, D-UI-043 | not checkable | — |
| Outcome words: a run **passes or fails** — `COMPLETED`, `COULDN'T FINISH - <why>`, `SKIPPED - <reason>`; no `FAILED`, no `SUCCEEDED`, no middle word | `es-native-ui.md` § Outcome words / § Outcome vocabulary | `**` → always | D-UI-028, reversed in part by **D-UI-030** | partly — `tools/last-good-scripts-test` case e bans exit codes, log paths, tool names, flags and the literal `COMPLETED WITH ERRORS` on screen lines; it does not ban `COMPLETED WITH GAPS` | **FOUND AND FIXED**: the § Outcome vocabulary table still carried `COMPLETED WITH GAPS` as a live word, six sections after the same file records its removal |
| Everyday register, not formal (`YOU'RE NOT ONLINE`, not `NO NETWORK CONNECTION`) | `es-native-ui.md` § Outcome words | `**` → always | D-UI-031 | none | **FOUND AND FIXED**: the § Outcome vocabulary table still showed the pre-D-UI-031 sentinel texts, which the shipped ES replaced (`ThreadedCloudSync.cpp:75-76`) |
| The provider labels follow standard names | `es-native-ui.md` (by reference) | `**` → always | D-UI-044 | none | — |
| One name for the relink page and both rows: FINISH RESTORE PROCESS | — | — | D-UI-046 | none | see § 6 |

## 2. The shape of a player-facing surface

| Rule | Written | Loads when? | Register row | Checked? | Contradiction |
|---|---|---|---|---|---|
| A row is a label and at most one line under it; a third line moves into the confirmation dialog | `es-native-ui.md` § A row that leads somewhere is a label, not a paragraph | `**` → always | D-UI-023, D-UI-029 | not checkable (measured in frames) | — |
| A row that opens a page with more than one action is a submenu | same section | `**` → always | D-UI-023 | none | — |
| Four surface tiers (splash / toast / progress card / full-page transfer), and duration picks between the last two | `es-native-ui.md` § Spacing | `**` → always | D-UI-024 | none | — |
| Spacing constants live in one place each; screen-relative fractions, never pixels | `es-native-ui.md` § Spacing | `**` → always | — | none | — |
| The transfer page is seven fitted lines | `es-native-ui.md` § Spacing (by reference) | `**` → always | D-UI-024, D-CLOUD-043 | none | — |
| An operation's only report must not be transient — a durable outcome on the page that ran it | `es-native-ui.md` § Anti-patterns | `**` → always | D-UI-028 | none | — |
| Two surfaces for one event is an anti-pattern | `es-native-ui.md` § Anti-patterns | `**` → always | — | none | — |
| Comments next to a `_( )` string must be ASCII (xgettext stops the image build) | `es-native-ui.md` § Comments near a translatable string | `**` → always | — | none — a real image build is the only check | — |
| Pure string code lives in `CloudText` and gets a doctest case | `es-native-ui.md` § Pure text has a home | `**` → always | — | yes — `es-app/tests/unit`, but **not a `vm-qa` suite** | — |

## 3. Time to play, least surprise, player language

| Rule | Written | Loads when? | Register row | Checked? | Contradiction |
|---|---|---|---|---|---|
| Time to play is a first-class metric: interface → first frame, and exit → next first frame | `time-to-play.md` | no glob → every session | D-CLOUD-098 | yes — `tools/time-to-play`, a `vm-qa` default suite; `docs/vm-qa-log.md` carries the numbers per image | — |
| A budget for each is a register row and a run over budget fails the suite | `time-to-play.md` | no glob → every session | **only the exit-sync budget** is a row (D-CLOUD-119, 3 s); launch and game-to-game have none | partly — `tools/time-to-play` fails only on the exit-sync median and on `headline_missing` | **FOUND AND FIXED**: the rule read as though all the budgets were rows. #135 already says "the launch and game-to-game numbers report until a row bounds them"; the rule now says so too, and the missing budgets are an Open decision |
| Nothing we add sits on the launch path unless it must | `time-to-play.md` | every session | D-CLOUD-098 | partly (the launch cell reports, does not judge) | — |
| Two contracts, never one budget: a deliberate back up may be long; an automatic sync is quick and bounded | `time-to-play.md`; `rclone-cloud-sync.md` § The automatic sync is bounded | every session / rclone glob | D-CLOUD-113, D-CLOUD-118, D-CLOUD-121 | yes — `last-good-scripts-test` case h holds conf, defaults and every script fallback equal and proves the wrapper fires | — |
| The offline benchmark: an offline exit reaches its outcome in about the time a successful sync would have taken | `time-to-play.md` | every session | D-CLOUD-112, D-CLOUD-119 | yes — `tools/time-to-play` cells `dead`, `noroute`, `blackhole`, `linkdown`, `portal` | — |
| A sync the player can see is never cancelled by a launch; it is bounded instead | `time-to-play.md`; `least-surprise.md` | every session | D-CLOUD-109 (supersedes D-CLOUD-076) | none yet (#135 AC open) | — |
| Every retro asks what the phase did to time to play | `docs/retrospective/carry-forward.md` | — (read by the `mini-retro` skill) | D-CLOUD-098 | none | — |
| Least surprise: things work as the player expects, and the same way every time | `least-surprise.md` | no glob → every session | D-UI-042 | not checkable | — |
| Same thing, same place, same words | `least-surprise.md` | every session | D-UI-022, D-UI-042 | none | — |
| Precedent over invention (Steam, the consoles, ROCKNIX's own menus) | `least-surprise.md` | every session | D-CLOUD-113 | not checkable | — |
| Player language: clear, then brief, then sized to the space | `player-language.md` | no glob → every session | D-UI-045 | none | — |
| A tool's words never reach a player | `player-language.md` | every session | D-UI-045, D-UI-028 | partly — `last-good-scripts-test` case e, on script screen lines only | — |
| Present the short form for approval; put a decision in terms of what the maintainer would see | `player-language.md` | every session | — (**GAP**, closed here: the "budget / stage / P-4 meant nothing" lesson of 2026-09-12 05:40 UTC was only in the work log) | not checkable | — |

## 4. Devices, the VM and QA

| Rule | Written | Loads when? | Register row | Checked? | Contradiction |
|---|---|---|---|---|---|
| **Can this be done on the VM?** — asked and answered in writing, in the issue, before every test, proof or measurement | `vm-first.md`; `engineering-practices.md` § If the VM can test it; `issue-tracking.md` § An issue that proposes a test | no glob / `**` → always | D-QA-007, D-QA-015, D-QA-017 | none — no tool reads an issue body for the line | — |
| "A real provider" is not a reason to leave the VM | `vm-first.md` | every session | D-QA-017 | n/a — `tools/cloud-test-backend` is the mechanism | — |
| QA never optimises for Dropbox | `vm-first.md` (by implication); `docs/device-testing-policy.md` | every session | D-QA-017 | none | — |
| Conflict and bisync testing is VM-only, never a handheld | `generic-x64-vm-testing.md` (fixtures); `docs/device-testing-policy.md` | **narrow glob — widened here** | D-QA-009 | none | — |
| **Nothing runs on a person's device without their yes** — reboot, launch, input, screenshot, sync, upload, deletion; a category offer is not a standing yes; reads are free | `engineering-practices.md` §§ Never reboot… / Nothing runs on a person's device…; `docs/device-testing-policy.md`; `handheld-evidence.md` | `**` → always | D-QA-008, D-QA-011, D-QA-015 | none | — |
| Ask before the **transfer** too, not only the reboot | `engineering-practices.md` § Never reboot… | `**` → always | D-QA-011 | none | — |
| The idle check covers emulators **and** cloud transfers, tests the lock with `flock -n`, and uses a pattern the shell cannot self-match | `engineering-practices.md` § Never reboot… | `**` → always | D-QA-008 | none | — |
| **The read filter**: every read of a device's or guest's config goes through `grep -v -i -E 'key\|pass\|token\|user\|psk'` | `docs/device-testing-policy.md` § Reading a device's output — **not an auto-loading file** | **GAP**, closed here: added to `engineering-practices.md` (`**` → always) | **GAP**, closed here: D-QA-021 | none, and not checkable from inside a session | — |
| A dedicated QA handheld with its own accounts | — | — | D-QA-016 (**Open**, #131) | — | — |
| A handheld keeps its evidence; `rocknix-evidence collect` before a second reboot | `handheld-evidence.md` | `projects/…/sysutils`, `…/rocknix`, device linux, `docs/**` — fires for device work and for any docs edit | D-SYS-001..005 | none | — |
| A suite added to the runner is not wired in until it has been **seen to FAIL once** on the runner's own guest; a tool that reports numbers fails when the numbers are missing | `docs/blindspot-register.md` #39 only | **GAP**, closed here: added to `engineering-practices.md` § Guards must fail closed (`**` → always) | **GAP**, closed here: D-QA-022 | yes for the instance — `headline_missing()` in `tools/time-to-play` | — |
| A step that cannot hold on a backend is marked with the reason, never skipped in silence | — (the practice lives in `tools/cloud-round-trip`) | — | D-QA-020 | yes, by construction | — |
| A remote path's shape is stated by the backend, never inferred from its name | `rclone-cloud-sync.md` § Bucket remotes behave differently | **narrow glob — widened here** | D-QA-019, D-CLOUD-120 | yes — the matrix's one expectation on every backend | — |
| Each QA backend gets its own port and data directory | `generic-x64-vm-testing.md` § The five backends | **narrow glob — widened here** | D-QA-018 | yes, by construction | — |
| Walks wait on frames, not on the clock; thresholds are measured | `generic-x64-vm-testing.md` § Automated visual QA | **narrow glob — widened here** | D-QA-013, D-QA-014 | yes — `tools/vm-visual-qa`, the `walks` suite | — |
| Both mounts on a worktree build (`.git` **and** the shared sources cache) | `generic-x64-vm-testing.md` § Build; `device-builds.md` § The build command | **narrow glob — widened here** | — | none | — |
| Every VM cycle writes a row in `docs/vm-qa-log.md` | `generic-x64-vm-testing.md` § After every VM cycle; `learning-capture.md` § 3 | **narrow glob — widened here** | — | none | — |
| A learning that is a procedure becomes a tool, a flag or a step file, not prose | `learning-capture.md` § 3 | `**` → always | — | none | — |

## 5. The register, issues, and the work

| Rule | Written | Loads when? | Register row | Checked? | Contradiction |
|---|---|---|---|---|---|
| The register is **append-only**; a reversal is a new row citing the old ID; cite by ID rather than re-arguing | `decision-register.md`; `docs/decision-register.md` header | `**` → always | the register's own header states it | **none** — nothing lints the register; a decided row can be edited or deleted with no signal | — |
| A settled Open question moves down as a row keeping its ID | `decision-register.md` | `**` → always | — | none | **FOUND AND FIXED**: D-CLOUD-094 and D-CLOUD-101 both recorded "all settled 2026-09-12" while still sitting in Open decisions |
| A decision is written in the session it happens | `decision-register.md` | `**` → always | — | none | — |
| Every out-of-band maintainer request is a fork issue the same session, quoting their words | `issue-tracking.md` § Every out-of-band request | `**` → always | D-QA-012 | none | — |
| Issues only on `maxengel/rocknix`, always with `--repo` | `issue-tracking.md` | `**` → always | — | none | — |
| Every actionable issue carries an Acceptance criteria checklist; a tick records observed behaviour, never an artifact | `issue-tracking.md` §§ Structure / Ticking | `**` → always | — | partly — `tools/lint-audit-artifacts`, for audit artifacts only | — |
| A found failure is yours to fix, and the hole that let it through is closed | `engineering-practices.md` § A failure you find is yours to fix | `**` → always | — | none | — |
| Guards must fail closed; prove the guard fires | `engineering-practices.md` § Guards must fail closed | `**` → always | — | partly — `last-good-scripts-test --old` replays the pre-change scripts so each guard is seen to fire | — |
| Stop after three fixes on the same failure | `engineering-practices.md` | `**` → always | — | not checkable | — |
| Before deleting a duplicate, diff its behaviours | `engineering-practices.md` | `**` → always | — | not checkable | — |
| Fail gracefully: bounded, last-good kept, a player-facing message, a retry in reach | `engineering-practices.md` § Fail gracefully | `**` → always | D-CLOUD-077, D-CLOUD-078 | yes — `tools/last-good-scripts-test` cases a–d, and `vm-qa`'s `scripts` suite | — |
| `ssh -n` inside a `while read` loop | — (a per-machine memory only) | **GAP**, closed here: `engineering-practices.md` | — | none | — |

## 6. Fork workflow, worktrees, builds, upgrades

| Rule | Written | Loads when? | Register row | Checked? | Contradiction |
|---|---|---|---|---|---|
| Feature work in a worktree under `../rocknix.worktrees/<name>`; the primary checkout stays on `next` | `worktrees.md` | `**` → always | — | none | — |
| Build worktrees are on `build/*` branches, never detached (`BUILD_BRANCH` in `/etc/os-release`) | `worktrees.md` § Build worktrees | `**` → always | **GAP**, closed here: D-WORKFLOW-004 | partly — `tools/fork-worktree sync` touches only `build/*` | — |
| Never sync a worktree with a build in flight | `worktrees.md` | `**` → always | — | partly — `sync` refuses a dirty tree, but nothing detects a running build | — |
| Remove a worktree with `tools/fork-worktree remove`, never `git worktree remove --force` | `worktrees.md` § Removing a worktree | `**` → always | **GAP**, closed here: D-WORKFLOW-005 | yes — `fork-worktree` refuses when build output is present and refuses the cwd | **FOUND AND FIXED**: the same file's § Manage worktrees and Rule 5 still taught `git worktree remove` |
| Upstream PR branches are built **by content** (`git checkout next -- <paths>`), not by `git rebase --onto` | `fork-workflow.md` § Per-feature flow | `**` → always | **GAP**, closed here: D-WORKFLOW-006 | partly — `.githooks/pre-push` blocks personal paths on `pr/*`, which is the backstop, not the recipe | **FOUND AND FIXED**: `worktrees.md` Rule 6, `CLAUDE.md` and `AGENTS.md` all still taught the retired `--onto` recipe, which silently produces an empty PR branch once the feature is merged into `next` |
| Personal paths never reach an upstream PR; the prose list and `PERSONAL_PATTERNS` are the same list | `fork-workflow.md` § Branch model | `**` → always | — | yes — `.githooks/pre-push`; verified this sweep: 19 fork-only tools in `tools/`, 19 in the hook, 19 in the prose |  — |
| Every branch is scanned for credential-shaped lines | `fork-workflow.md` § Safety net | `**` → always | D-INFRA-006, D-INFRA-007 | yes — `SECRET_PATTERNS` in `.githooks/pre-push` | — |
| Console-first: no QEMU/VM wording in product surfaces | `fork-workflow.md` § Safety net; `es-native-ui.md` § Anti-patterns | `**` → always | — | yes — the pre-push content guard, over `…/rclone/sources/` and `…/rocknix/sources/scripts/` | — |
| Upstream commit titles match `^[a-zA-Z0-9_*./-]+:[[:space:]].+$`, ≤72 chars, one commit | `fork-workflow.md`; `CLAUDE.md` § Commit conventions | `**` → always | — | yes — upstream CI | — |
| Every change ships onto a device that already has state: check the upgrade path and the clean install | `upgrade-and-install.md` | `**` → always | — | partly — the VM's `.update` path; no automatic check | — |
| An upgrade should be invisible: read both shapes, write the new one; a prompt is a failure mode | `upgrade-and-install.md` § An upgrade should be invisible | `**` → always | D-UI-022 (read-old-if-new-absent) | none | — |
| A new config key goes in **both** `cloud_sync.conf` and `.defaults`; a changed default needs an explicit one-time migration with a marker | `upgrade-and-install.md`; `rclone-cloud-sync.md` § Config conventions | `**` / **narrow glob — widened here** | D-CLOUD-121, D-SYS-007 | yes — `last-good-scripts-test` cases d and g | — |
| Verify on the VM before the device, and under the device's busybox, not the host's tools | `upgrade-and-install.md` § Verify on a device | `**` → always | D-QA-007 | yes — `last-good-scripts-test` runs the image's busybox applets | — |
| `tools/pkgcheck` after every `package.mk` edit; late binding only inside functions | `packaging-and-patches.md`; `CLAUDE.md` | `packages/**`, `projects/**` — fires | — | yes — `tools/pkgcheck`, non-zero on FAIL since the #129 audit | — |
| A shipped script's CLI tools are `PKG_DEPENDS_TARGET` | `packaging-and-patches.md` | `packages/**`, `projects/**` | — | none | — |
| Adversarial analysis routes through council; never the rubber-duck agent | `adversarial-council.md` | `**` → always | D-WORKFLOW-003 | partly — `council-substrate-integrity.md` names lint scripts that are not in this repo | see § Gaps left open |
| Public docs (`ROCKNIX/rocknix.org`) change in the same PR as user-facing behaviour | `documentation-accuracy.md` | `**` → always | — | none | — |

## 7. Where the rule, the register, the menu map, the wizard IA and the policy disagreed

Nine disagreements, each quoting both sides. Six are closed in this change; three
wait, and say why in § 9.

| # | The two sides | Resolution |
|---|---|---|
| C1 | `es-native-ui.md` § Outcome words: *"A cloud run **passes or fails** … There is no middle word: `COMPLETED WITH GAPS` existed for a day"* (D-UI-030) — against the same file's § Outcome vocabulary table, 320 lines later: *"ends a run with one of four words"* and a live `COMPLETED WITH GAPS - <what>` row. D-UI-028 names that table the register-of-record, so the wrong copy was the authoritative one | **Closed.** Three words; the row removed and the reversal stated at the head of the table |
| C2 | The same table: `SKIPPED - NO NETWORK CONNECTION` / `SKIPPED - ANOTHER CLOUD SYNC IS RUNNING` — against D-UI-031 and the shipped binary, `ThreadedCloudSync.cpp:75-76`: `YOU'RE NOT ONLINE`, `A SYNC IS ALREADY RUNNING` | **Closed** in favour of the shipped words |
| C3 | **Three tiers or four.** `es-native-ui.md:363` *"**Four tiers** … settings … saves … ROMs and BIOS, and **game content**"* (D-CLOUD-049/050) — against `es-native-ui.md:144` *"the three tiers"*, `player-language.md:24` *"saves, settings, ROMs and BIOS"*, `es-menu-map.md:85` the same three, and `es-menu-map.md:102` a tick list of three where the shipped page offers four (`GuiMenu.cpp:4458-4468`) | **Closed.** Four everywhere. The word *tier* also named the four **surfaces** in the same file; that list is now labelled "surface tiers" |
| C4 | **A launch cancels the sync, or waits for it.** `time-to-play.md:21` *"A launch already cancels an automatic sync (D-CLOUD-076)"* — against `time-to-play.md:30`, nine lines later, *"A sync the player can see is never cancelled by a launch; it is bounded instead (D-CLOUD-109)"*. Also `es-menu-map.md:144` *"a launch cancels either (D-CLOUD-076)"* | **Closed by naming the seam**, not by choosing: D-CLOUD-076 is what ships (`SKIPPED, A GAME WAS STARTED` is in the binary), D-CLOUD-109 supersedes it and has not landed. Both files now say which is which, so a design is not written against a superseded row by accident |
| C5 | **Where a losing copy goes.** `cloud-vocabulary-audit.md:228` *"`/ROCKNIX/SaveVersions/` … replaces the `-replaced/` sibling's role"*, listed under "New in this milestone" — against `conflict-wizard-ia.md:19` and D-CLOUD-095, *"one hidden store `Saves/.history/` with every other earlier version"* | **Closed.** The audit row is struck through and marked superseded; it stays because a term has to be readable against every layout that has shipped |
| C6 | **Is the losing copy always retained?** `conflict-wizard-ia.md:134` *"the other version is retained in `Saves/.history/` **either way**"* — against the same file's table at `:146`, *"retained **only when** *keep copies of discarded saves* is on"*, and `:96` *"that setting … is the escape hatch"* | **Closed** in favour of unconditional retention: `save-history-consensus-amendment.md`'s retain-only invariant, and D-CLOUD-105, under which OFF still keeps a transaction copy. The toggle governs how long, never whether |
| C7 | **The restore-verb row.** `conflict-wizard-ia.md:30` and `es-native-ui.md:190` both present *MANAGE GAME SAVE RESTORES AND CONFLICTS* — against D-UI-043, *"the row under SAVE MANAGEMENT is about keeping — EARLIER VERSIONS OF SAVES … and carries no restore verb"* | **Closed** in the wizard IA, marked as superseded in part by D-UI-043. `es-native-ui.md` uses it only as an example of a verb-carrying hub label, which still reads |
| C8 | **`worktrees.md` against itself.** § Removing a worktree: *"**Use `tools/fork-worktree remove`, not `git worktree remove`.**"* — against § Manage worktrees and Rule 5, both of which said `git worktree remove` | **Closed.** The tool everywhere; `git worktree list` kept, because reading is safe |
| C9 | **The retired PR recipe.** `fork-workflow.md`: *"The old recipe was `git rebase --onto upstream/next next pr/<name>` … `next..pr/<name>` is empty … It fails quietly, which is the worst way for it to fail."* — against `worktrees.md` Rule 6, `CLAUDE.md` and `AGENTS.md`, all three of which still taught it | **Closed** in all three, with a register row (D-WORKFLOW-006) so it is citable |

Two more, inside documents' own example strings:

- `es-ui-style-guide.md:97` offered `GAME SAVES, SAVESTATES AND SCREENSHOTS` as the
  model description — one word where the rule says two, and no serial comma, in the
  file that teaches string shape. The shipped strings were already right
  (`GuiMenu.cpp:4450/4804/5433`). **Fixed.**
- `es-native-ui.md:338` illustrated the "back up" verb rule with
  `BACK UP CONFIGURATIONS TO CLOUD` — a string that breaks the tier rule 30 lines
  below it and no longer exists in ES. **Fixed** to `BACK UP SETTINGS TO THE CLOUD`.

## 8. Gaps closed

**Rules added**

- The **read filter** for device and QA-guest output moved from
  `docs/device-testing-policy.md`, which nothing loads, into
  `engineering-practices.md` § Nothing runs on a person's device, which loads always.
- **A suite is not wired in until it has been seen to FAIL once**, and a tool that
  reports numbers fails when the numbers are missing — promoted from blindspot 39
  into `engineering-practices.md` § Guards must fail closed.
- **`ssh -n` inside a `while read` loop** — a per-machine memory only, now a rule.
- **A decision is put in terms of what the maintainer would see** — the 2026-09-12
  "budget / stage / P-4 meant nothing" lesson, into `player-language.md`.
- **D-UI-039 (the menu map updates in the same change)** hoisted into
  `es-native-ui.md`, which loads, from `docs/es-menu-map.md`, which does not.
- **Two safety rules from the style guide** — YES first / the back-button accelerator,
  and dim-don't-hide versus gate-a-button-by-existence — carried up into
  `es-native-ui.md` because they decide safety rather than looks.

**Globs widened** (both were narrow enough to miss their own subject)

- `generic-x64-vm-testing.md` gained `tools/vm-qa`, `vm-serial`, `vm-pair`,
  `vm-visual-qa`, `vm-walks/**`, `cloud-test-backend`, `emulator-exit-test`,
  `time-to-play` and `docs/vm-qa-log.md`. Most of that file is about the harness, and
  none of the harness lived under the old globs.
- `rclone-cloud-sync.md` gained `projects/ROCKNIX/packages/rocknix/sources/scripts/**`
  and the five cloud tools. `backuptool` writes the settings tier this file's
  vocabulary and last-good rules govern, and `.githooks/pre-push` already treats both
  script directories as one product surface — the glob was the only place that did not.

**Register rows appended** — D-QA-021 (the read filter), D-QA-022 (a suite seen to
fail), D-WORKFLOW-004 (build worktrees on `build/*`), D-WORKFLOW-005
(`fork-worktree remove`), D-WORKFLOW-006 (PR branches by content), D-UI-048 (Wi-Fi,
the serial comma, game save vs save state — conventions that had no ID to cite), and
D-INFRA-010, which gives the 2026-09-11 credential decision an ID of its own after it
was written as a second `D-INFRA-008` (audit #129's PL-08). Nothing was edited or
deleted: the two colliding rows stand, and the new one says which citations resolve
where.

**Open decisions** — D-CLOUD-094 and D-CLOUD-101 both recorded "all settled
2026-09-12" and were still sitting in the Open table; both moved down as decided rows
keeping their IDs. D-CLOUD-122 added (the launch and game-to-game budgets). The table
now holds five genuinely open questions: D-CLOUD-122, D-QA-016, D-SYS-006,
D-CLOUD-051, D-CLOUD-008.

**Pointers** — `CLAUDE.md` and `AGENTS.md` now name all 21 rule files, grouped by
when they load, and point at the three `docs/` files that carry interface law and load
nowhere. `packages/readme.md` corrected to `packages/README.md` in three places (the
file on disk is `README.md`; on a case-sensitive filesystem the old reference resolved
to nothing).

## 9. Gaps left open, and why

| Gap | Why it waits |
|---|---|
| **14 shipped ES strings say `SAVESTATE`**, and `GuiMenu.cpp:4586` says `RESTORE SYSTEM SETTINGS FIRST` | Code, and #148 filed. The savestate labels are inherited upstream strings whose `msgid`s carry translations; *system settings* may be a deliberate distinction from the other restore classes, and that is the maintainer's word to give |
| **The launch and game-to-game time-to-play budgets** | Register rows are proposed from a measurement, never chosen (D-CLOUD-116). Open as D-CLOUD-122, home #135 |
| **`conflict-wizard-ia.md`: per-save sidecar manifest vs per-device manifest** (`:246` against `cloud-vocabulary-audit.md:229`, D-CLOUD-031) | A design question inside #22/#23, not a drafting error. Named here so it is not re-derived |
| **`conflict-wizard-ia.md`: what detects a conflict** — `rclone bisync` (#9) at `:63`, the #22 classifier in `save-history-consensus-amendment.md:80` | Same: #22's to settle. The wizard doc already hedges it |
| **Retention count range** — `conflict-wizard-ia.md:157` says 1–9 default 3; D-CLOUD-096 says 3–5 | Drift in progress; the doc flags it as P-1/P-2 on #134 |
| **A rule that fires only in this repo** | ES source lives in `ROCKNIX/emulationstation-next`. A session working only there loads none of `.claude/rules/`, and `es-native-ui.md` is written for exactly that work. No fix attempted; it needs a decision about where the ES repo's own rules live |
| **`adversarial-council.md` names a `council-research` and a `begin-exploration` skill that are not in this repo**, and `council-substrate-integrity.md`'s `paths:` includes `.claude/skills/council-research/**`, which cannot match. Its lint scripts (`scripts/lint-*.ts`) are not here either | The council substrate is seeded from another estate; correcting the claim is that estate's call, not a naming or device rule. The globs are harmless (they simply never fire) |
| **Nothing lints the register or the rule front matter** | A `paths:` typo, a deleted decided row, or a duplicated ID is invisible today. Worth a small checker; not built here because the sweep was asked to be a reading |
| **`docs/es-menu-map.md`'s verification claim is undated** outside its cloud section | *"verified against the running UI with `tools/vm-visual-qa`"* carries no date or image id, while the survey line is dated 2026-08-19 against the `20260818` build. The cloud subtree is stamped to 2026-09-12 (ES `51639dd09`); the rest is three weeks old with an undated claim over it. Re-verifying is a VM run, not a reading |

## 10. What the sweep noticed about the shape of the rules

1. **Only one vocabulary rule is checked.** `tools/vocabulary-check` checks "back up"
   vs "backup" and nothing else — not Wi-Fi, not the serial comma, not game save vs
   save state, not the tiers, not the banned words, not the reserved *sync*. Its gate
   (`\bBACK(ING|ED)? ?-?UPS?\b`) means no other string is even looked at. Every other
   naming rule is enforced by somebody remembering it, which is how 14 `SAVESTATE`
   labels survived. The cheapest next win in this whole area is three more patterns
   in that tool.
2. **Three documents under `docs/` carry as much interface law as `es-native-ui.md`
   does, and nothing loaded them.** `es-ui-style-guide.md` alone holds ~25 rules — the
   row builders, the four gates, button order, the back-button accelerator,
   confirmation registers, glyphs, placeholder words. The reference ran one way only:
   the style guide points up at the rule file, the rule file did not point down. That
   is now fixed by pointers, but the real question for the parent is whether
   `es-ui-style-guide.md` should *be* a rule file.
3. **Four files state a version of "ask before you touch a device"**:
   `engineering-practices.md` (twice, in two sections), `docs/device-testing-policy.md`,
   `handheld-evidence.md` and `vm-first.md`, plus `CLAUDE.md` and `AGENTS.md`. They
   agree, which is the good case — but D-QA-011 was added to only one of them when it
   was decided, and the policy doc is the only place the read filter reached. A rule
   stated in four places is a rule that gets updated in one.
4. **`es-native-ui.md` is 500 lines and holds five unrelated subjects** — ES
   internals (the button-bar crash, `TextComponent`'s measuring, xgettext, the file
   cache), the spacing system, the vocabulary, the outcome register, and the
   anti-patterns. Two of its three self-contradictions were between sections 300 lines
   apart. A split into "ES mechanics" and "what a player reads" would make the second
   half readable by somebody writing a script, which is where half the strings are.
5. **`least-surprise`, `player-language`, `time-to-play` and `vm-first` have no
   `paths:` key at all**, which is correct — they load every session — but it makes
   them invisible to a reader scanning front matter for "when does this apply". The
   files are also the newest and the shortest, and they are the ones the maintainer
   named this week. They are working as intended.
6. **The register is the healthiest artefact here.** 214 decided rows, one
   append-only table, IDs cited across issues, rules and work logs. Three defects,
   all clerical: two settled questions left in the Open table, and `D-INFRA-008`
   naming two different decisions (audit #129's F-11/PL-08). The second was corrected
   the way the register's own contract asks — a new row, D-INFRA-010, giving the
   2026-09-11 credential decision an ID of its own and saying which existing citations
   resolve where — rather than by renumbering, because a decided row is never edited.
   Nothing mechanically protects any of this; a twenty-line duplicate-ID and
   front-matter checker would have caught two of the three.

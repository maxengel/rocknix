---
description: "Where the canonical rules live and how they load; how to tell a stale worktree copy from the current one."
paths:
  - "**"
---

# Where the rules live, and which copy you are reading

Every rule in this directory loads automatically: those with a `paths:` glob
when a matching file enters context, those without one at session start. There
is no second copy — `.github/instructions/` was a Copilot convention and is
gone, along with Copilot.

Other tools in use here read the same files: Crush can be pointed at this
folder with `global-context-path`, and it already discovers `.claude/skills`.
Crush loads the folder recursively and does **not** honour `paths:`, so every
rule reaches it every session — a rule that is noise there is noise always.

## The front-matter standard

Every file in this directory opens with front matter, and nothing else comes
before it:

```yaml
---
description: "<one line: what this file decides, and when to read it>"
paths:
  - "<glob>"          # optional; omit the whole key to load every session
---
```

- **`description` is one line**, and it is the only thing a reader sees in an
  index or a picker. Say what the file decides and when to open it, not what
  subject area it belongs to. (`council-substrate-integrity.md` carries a
  longer one; it is adopted verbatim from another estate and is refreshed by
  deliberate re-review, not edited here — #147 § 9.)
- **`description` comes first**, then `paths:`. The order changes nothing
  mechanically; it makes the files diffable against each other.
- **`paths:` is optional, and omitting it is a decision.** A file with no
  `paths:` key loads at session start, every session. A file that omits it
  **says so in its first paragraph, and why** — otherwise a reader scanning
  front matter for "when does this apply" finds nothing and assumes the
  answer is "never".
- **A comment above a glob explains a glob that is wider or narrower than it
  looks.** `#` comments are legal inside the block and are where the #147
  sweep's reasoning lives (`rclone-cloud-sync.md`, the four ES files).
- **A narrow glob is the only kind that can miss.** `paths: - "**"` matches
  every file in this repo, so in practice it means "always" for any session
  that touches the tree. Crush ignores `paths:` entirely and loads the whole
  directory, so a narrow glob only ever costs Claude Code.

## The ES rules reach an ES session only by loading every session

The four EmulationStation rules — `es-native-ui.md`, `es-player-text.md`,
`es-code-traps.md`, `es-ui-style-guide.md` — govern work in a **different
repository**: ES source is `ROCKNIX/emulationstation-next`, checked out
elsewhere on the machine. A `paths:` glob is resolved against this repo, so no
glob written here can name `es-app/**`, and there is no narrow, high-signal
glob to be had. They therefore carry `paths: - "**"`, the widest reach
available, which loads them whenever any file in this repo enters context.

D-WORKFLOW-010 keeps one canonical distribution rule corpus. Each active ES
checkout carries `AGENTS.md` and `CLAUDE.md` entry pointers to the distribution
checkout's `next` rules and `.github/sessions/saved-session-state-next.md`.
They name the ES syntax check and integration branch; they do not duplicate
policy. The splash repository carries the same resume route in `AGENTS.md`.
Read those pointers at entry, then the canonical files they name (#368).

**Seeing `.github/instructions/` means you are in a stale worktree.** That
directory no longer exists on `next`. Several worktrees were cut before it was
retired and still carry it on disk, so its presence is a reliable signal that
the rules around you predate the move — not that a second copy exists.

**Read rules and skills from `next`, not from a feature worktree.** A branch
cut from an older base silently lacks anything added since. This has bitten
twice: ES work proceeded in a worktree missing `es-native-ui`, and a code audit
loaded a stale copy of its own skill and would have graded the work against a
rubric that no longer existed.

```bash
diff -q <file> <(git -C /workspace/repos/rocknix show next:<file>)
```

## The index

Every rule file, what it decides, and what makes it load. Add a row here in the
same change that adds a file; a rule nobody can find is a rule nobody applies.

| File | Decides | Loads |
| --- | --- | --- |
| `least-surprise.md` | the player is surprised as little as possible; things work as expected and the same way every time (D-UI-042) | every session |
| `player-language.md` | clear, then brief, then sized to the space, for every string a player reads (D-UI-045) | every session |
| `time-to-play.md` | interface → a game's first frame, and one game's exit → the next, as a first-class metric (D-CLOUD-098) | every session |
| `vm-first.md` | *can this be done on the VM?* asked and answered in writing before any test, proof or measurement (D-QA-007) | every session |
| `bugs-are-agent-first.md` | what a bug is: fixed to the best of our ability means fixed; every criterion verified on the VM by an agent; the two other classes (open item to test, keep an eye on); no known bug at the call (D-QA-051) | every session |
| `ceremonies.md` | which ceremony is owed and when -- friction entries, retros, the weekly and monthly summaries, the index, audits, futros -- as a state machine `tools/ceremony-check` turns (D-WORKFLOW-028) | every session |
| `release-candidates.md` | the standard operating procedure for every release candidate: nothing behind before the cut, a clean baseline, the candidate's build, every test, play-testing, the call, the two-agent upstream audit, then the submission and builds for every test device (D-WORKFLOW-047) | every session |
| `adversarial-council.md` | code audits use local, cross-lab two-model or extended three-model review; formal councils keep five verified seats | `**` |
| `decision-register.md` | when a decision becomes a row, and why a settled one is cited rather than re-argued | `**` |
| `device-builds.md` | building, publishing and flashing handheld images, and what a warm build root hides | `**` |
| `documentation-accuracy.md` | user-facing behaviour and the public rocknix.org docs change together | `**` |
| `engineering-practices.md` | verify the artifact not the report; guards fail closed; nothing runs on a person's device without their yes | `**` |
| `es-code-traps.md` | the sharp edges of the ES codebase, each found by debugging and each with its fix | `**` (see § The ES rules) |
| `es-native-ui.md` | ES mechanics: where the code lives, the page and job patterns, spacing, the four surface tiers | `**` (see § The ES rules) |
| `es-player-text.md` | every word a player reads: the tiers, the verbs, the naming conventions, the outcome vocabulary | `**` (see § The ES rules) |
| `es-ui-style-guide.md` | how a screen looks and behaves: row builders, gates, buttons, confirmations, glyphs, wizards | `**` (see § The ES rules) |
| `fork-workflow.md` | the branch model, and building an upstream PR by content so no personal path leaks | `**` |
| `instruction-files.md` | where the rules live, how they load, the front-matter standard, and this index | `**` |
| `issue-tracking.md` | issues on the fork only; Milestone → Epic → Issue; what a ticked acceptance criterion means | `**` |
| `milestone-phase-naming.md` | milestone bodies hold current ordered priorities; M/P issue titles identify placement, not issue chronology | `**` |
| `learning-capture.md` | a learning becomes a rule, a tool or a work-log entry — never only a memory | `**` |
| `upgrade-and-install.md` | every change lands on a device that already has state; check the upgrade and the clean install | `**` |
| `worktrees.md` | one worktree per branch under `../rocknix.worktrees/`, build worktrees on `build/*`, removal via `tools/fork-worktree` | `**` |
| `working-principles.md` | the twelve principles and which rule enforces each -- an index, not a second copy; the pre-flight (read the rules the work touches, this session) and the enforcement ladder | `**` |
| `packaging-and-patches.md` | `package.mk` fields, late binding, and how patches are produced and scoped | `packages/**`, `projects/**` |
| `change-log.md` | the running change log (`docs/cloud-sync-changelog.md`) is written the day a player-visible change lands, as claims checked against the build | `projects/ROCKNIX/packages/**`, the change log |
| `rclone-cloud-sync.md` | the cloud-sync subsystem: config conventions, the bounded automatic sync, last-good behaviour | the rclone package, `rocknix/sources/scripts/**`, the five cloud tools |
| `generic-x64-vm-testing.md` | building and QA'ing the GENERIC_X64 VM image, and the harness that drives it | GENERIC_X64, `projects/ROCKNIX/packages/**`, `scripts/mkimage`, `scripts/image`, the VM tools, `docs/vm-qa-log.md` |
| `handheld-evidence.md` | what a handheld keeps across a power cycle and what to capture first when one misbehaves | device packages and kernels, `docs/**` |
| `council-substrate-integrity.md` | every council member call goes through the Facilitator; no ad-hoc provider calls | council artifacts, skills, agents, `scripts/council-invoke.ts` and `scripts/lib/council-verification.ts` |

Three documents under `docs/` carry interface law and load **nowhere** — open
them when the work is theirs: `docs/es-menu-map.md` (where a row belongs; and
D-UI-039, a row added, moved or renamed updates it in the same change),
`docs/conflict-wizard-ia.md` (the wizard's IA), `docs/device-testing-policy.md`
(the device and QA-guest policy, whose read filter is now also in
`engineering-practices.md`).

**The principles behind these rules, and which rule enforces each, are in
[`working-principles.md`](working-principles.md)** — an index, not a second
copy. Read it when you want to know whether something is already covered
before writing a new rule; ten of twelve imported principles turned out to be.

## The fork's own tools, and which rule documents each

Written because a tool nobody remembers is a tool nobody runs — and this
estate keeps growing. One line each; the rule named is where the detail lives, so this stays an index rather than a second copy. `tools/` is
otherwise upstream's, which is why the fork-only ones are enumerated by hand
in `.githooks/pre-push` and in `fork-workflow.md`; **a new one is added to
both lists and to this table, or it is invisible.**

| Tool | What it answers | Detail in |
| --- | --- | --- |
| `build-preflight` | has the machine the memory for a build, and what is holding it | `device-builds.md` |
| `archaeology` | what the record already says about a question -- the registers, the work logs, the rules, `git log`, the issues -- before anything is called pending or new | `decision-register.md` |
| `ceremony-check` | which ceremony is owed (a friction entry's issue, a retro, a weekly or monthly summary, the index, a blindspot's guard, an audit, a futro) and whether the push guard refuses | `ceremonies.md` |
| `frame-diff` | did this build change any walk frame it did not mean to -- the boxes against the last accepted cut, the masks, the claims | `generic-x64-vm-testing.md` |
| `work-log-index` | the day, week and month table of contents over the work logs, regenerated after every entry | `learning-capture.md` |
| `watch-job` | is a long job still alive, stalled, finished, or killed — and is the watcher itself alive | `engineering-practices.md` |
| `fork-worktree` | worktree list / remove / repair / sync, refusing to destroy build output | `worktrees.md` |
| `fork-package-freshness` | are the packages the fork introduces at their latest upstream release, or pinned with a stated reason | `fork-workflow.md` |
| `vm-upgrade-rehearsal` | boot the previous image in a guest, seed a player's state, update in place, check every piece survived | `upgrade-and-install.md` |
| `cloud-pair-migration` | the mixed-installation test: one cloud, a device updated in place from the previous build and a fresh install, the folder's join, move and follow read from the cloud and both confs (D-CLOUD-158) | `rclone-cloud-sync.md` |
| `es-syntax-check` | compile an EmulationStation edit syntax-only with the image build's own command, before the pin moves | `es-native-ui.md` |
| `png-blackout` | paint a rectangle of a frame black with the standard library, so a screendump carrying the QA account's name is filed with the band painted out | `generic-x64-vm-testing.md` |
| `fork-newdrive` | move the build estate to another volume | `device-builds.md` |
| `fork-publish-release` | publish an image, refusing to publish embedded credentials | `device-builds.md` |
| `device-act` | run one command on a device, recorded with the boot id before and after | `engineering-practices.md` |
| `qa-accounts` | carry QA credentials into a guest without printing them | `generic-x64-vm-testing.md` |
| `vm-pair`, `vm-serial`, `vm-visual-qa`, `vm-walks/` | bring guests up, drive them, capture frames, walk the interface | `generic-x64-vm-testing.md` |
| `vm-qa` | every automated check against one image, one report | `generic-x64-vm-testing.md` |
| `cloud-round-trip`, `cloud-test-backend`, `cloud-census`, `cloud-capture-stamp-test` | the cloud-sync suites and their backends | `rclone-cloud-sync.md` |
| `emulator-exit-test`, `wait-lock-test`, `last-good-scripts-test` | the exit hotkey, the lock's patience, the scripts under busybox | `generic-x64-vm-testing.md` |
| `time-to-play` | interface to a game's first frame, and game to game | `time-to-play.md` |
| `ra-offline-test` | an achievement earned offline survives to the server | `generic-x64-vm-testing.md` |
| `ra-candidate-games` | which homebrew titles have cheap achievements, and does a ROM carry its set | `generic-x64-vm-testing.md` |
| `retroarch-wrapper-test` | does the threaded video wrapper run a posted command exactly once | `engineering-practices.md` |
| `es-menu-map-check` | does `docs/es-menu-map.md` still describe the menus that ship | `es-native-ui.md` |
| `es-untranslated` | which fork strings have no French | `es-native-ui.md` |
| `font-stems` | how sharp a widget face renders at each pixel size: strokes, solid cores, mean stem, per px, on FreeType | `es-native-ui.md` |
| `signin-memory` | what the cloud sign-in window costs in memory on a QA guest: the window's and WebKit's peak RSS while a page loads | `generic-x64-vm-testing.md` |
| `vocabulary-check` | back up / backup, and the rest of the player vocabulary | `es-player-text.md` |
| `forbidden-terms-check` | does a tree, or a set of lines, carry a word from the list kept outside every tree (D-WORKFLOW-061); the fork CI runs it | `fork-workflow.md` |
| `register-check` | every decision ID once, every citation naming a real row | `decision-register.md` |
| `lint-audit-artifacts` | the audit artifacts are well formed | `issue-tracking.md` |
| `rules-check` | every rule file front-mattered per the standard, every file in this index, the counts in `CLAUDE.md` and `AGENTS.md` true, `AGENTS.md` within Codex's budget and naming every rule (D-WORKFLOW-045) | `instruction-files.md` |
| `box-check` | is every open acceptance checkbox on the fork agent-verifiable -- names its artifact, and a physical fact when it asks for a device (D-QA-044; the checkbox checker, D-QA-045) | `issue-tracking.md` |
| `prose-check` | does a rocknix.org draft read as the site's own writers write -- the tells the samples named, fail and warn; `--self-test` passes the maintainer's page and fails a machine-sounding draft (#323, D-WORKFLOW-068) | the `developer-relations` skill |
| `release-catalog` | what each kept cut carried, what was proven on it and where it is, generated from the artifacts' RECORD.txt into `docs/releases/catalog.md` (D-WORKFLOW-044) | `issue-tracking.md` |
| `rc-preflight` | may this tree be cut as a release candidate: packages current, the bases level with ROCKNIX, no bug without a disposition, the record clean -- or each finding accepted by a register row (#271, D-WORKFLOW-047) | `release-candidates.md` |
| `pr-stack-check` | build the upstream series by content from `docs/pr-series/map.txt` in a throwaway worktree, and prove the last head equals `next` on every upstream-bound path (#322) | `fork-workflow.md` |
| `es-launch-memory` | capture stable-PID launch/exit memory and successful exit-sync stamps on an owned QA guest | `generic-x64-vm-testing.md` |
| `nova-led-test` | exercise all eight LED nodes, saved brightness and the battery writer using actual scripts and fixture sysfs | `generic-x64-vm-testing.md` |
| `raofflineproxy-integration-test` | preserve old-writer state and prove full-library preparation, retries and rate-limit pacing | `generic-x64-vm-testing.md` |
| `rasteratops-cloud-layout-test` | prove numbered layout transitions, partial-state recovery and missing-remote refusal | `rclone-cloud-sync.md` |
| `rasteratops-vm-cloud-epic` | run promoted cloud and settings cases against actual guest scripts | `generic-x64-vm-testing.md` |
| `rasteratops-identity-check` | check distribution identity contracts in source and an image | `release-candidates.md` |
| `rasteratops-candidate-store` | retain and verify an exact candidate by manifest and digest | `release-candidates.md` |
| `council/` | verified external reviewer invocation and retained receipts | `adversarial-council.md` |
| `pkgcheck` *(upstream's)* | a `package.mk` obeys late binding | `packaging-and-patches.md` |

**When a rule earns its place, write it down.** `docs/blindspot-register.md`
holds failure modes this project has actually committed — consult it before
calling something greenfield, and add to it when a new one surfaces.
`docs/decision-register.md` holds settled decisions; cite a row by ID rather
than re-arguing the choice, and add one the same session a decision is made.

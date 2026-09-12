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

The residual gap is real and open: a session working **only** in the ES
checkout loads none of `.claude/rules/`, and the ES rules are exactly the ones
written for that work. Closing it needs rules in the ES repo itself, which is a
decision nobody has made (#147 § 9). Until then, an agent sent to the ES tree
is told to read these four from `next` — see the paragraph below on stale
copies, which is the same failure by a different route.

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
| `adversarial-council.md` | adversarial analysis routes through the verified multi-model council; never the rubber-duck agent | `**` |
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
| `learning-capture.md` | a learning becomes a rule, a tool or a work-log entry — never only a memory | `**` |
| `upgrade-and-install.md` | every change lands on a device that already has state; check the upgrade and the clean install | `**` |
| `worktrees.md` | one worktree per branch under `../rocknix.worktrees/`, build worktrees on `build/*`, removal via `tools/fork-worktree` | `**` |
| `packaging-and-patches.md` | `package.mk` fields, late binding, and how patches are produced and scoped | `packages/**`, `projects/**` |
| `rclone-cloud-sync.md` | the cloud-sync subsystem: config conventions, the bounded automatic sync, last-good behaviour | the rclone package, `rocknix/sources/scripts/**`, the five cloud tools |
| `generic-x64-vm-testing.md` | building and QA'ing the GENERIC_X64 VM image, and the harness that drives it | GENERIC_X64, `projects/ROCKNIX/packages/**`, `scripts/mkimage`, `scripts/image`, the VM tools, `docs/vm-qa-log.md` |
| `handheld-evidence.md` | what a handheld keeps across a power cycle and what to capture first when one misbehaves | device packages and kernels, `docs/**` |
| `council-substrate-integrity.md` | every council member call goes through the Facilitator; no ad-hoc provider calls | council artifacts, skills, agents and `tools/council/**` |

Three documents under `docs/` carry interface law and load **nowhere** — open
them when the work is theirs: `docs/es-menu-map.md` (where a row belongs; and
D-UI-039, a row added, moved or renamed updates it in the same change),
`docs/conflict-wizard-ia.md` (the wizard's IA), `docs/device-testing-policy.md`
(the device and QA-guest policy, whose read filter is now also in
`engineering-practices.md`).

**When a rule earns its place, write it down.** `docs/blindspot-register.md`
holds failure modes this project has actually committed — consult it before
calling something greenfield, and add to it when a new one surfaces.
`docs/decision-register.md` holds settled decisions; cite a row by ID rather
than re-arguing the choice, and add one the same session a decision is made.

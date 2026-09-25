# AGENTS.md

ROCKNIX is an **immutable Linux distribution for handheld gaming devices** (a JELOS fork
built on the LibreELEC/CoreELEC cross-compilation system). There is no app to run — this
repo is a *build system* that cross-compiles a complete OS image (kernel, bootloader,
emulators, userland) per device.

**How this file is read.** Codex reads `AGENTS.md` (this file, at the root; a nested
`AGENTS.md` adds to its own subtree) and nothing else on its own, so this file stands
alone: the commands, the rules that bind every session, and the list of every rule file
with what it decides. Claude Code reads `CLAUDE.md` and loads `.claude/rules/*.md` by
their `paths:` globs. Both files carry the same facts and are kept equal by
`tools/rules-check` (D-WORKFLOW-045), which also regenerates the rule list below from
the rule files' own front matter. When something here and a rule file disagree, the rule
file is right and this file has a bug.

**Canonical deep-dive docs (this file summarizes; they are authoritative):**

- `packages/README.md` — the authoritative `package.mk` format reference.
- `.claude/rules/*.md` — the canonical guides, all 27, listed below with their one-line
  descriptions and when each loads. `instruction-files.md` is their index and carries the
  front-matter standard (D-WORKFLOW-009). Open the every-session ones before starting;
  open a scoped one before touching its paths.
- Two documents carry interface law and are loaded by no rule: `docs/es-menu-map.md`
  (where a row belongs; D-UI-039: a row added, moved or renamed updates it in the same
  change) and `docs/conflict-wizard-ia.md` (the wizard's IA). `docs/device-testing-policy.md`
  is the device and QA-guest policy.

## Build & development commands

Builds are driven by `PROJECT` (default `ROCKNIX`), `DEVICE`, and `ARCH`. Per-device make
targets exist for: `RK3588`, `RK3576`, `RK3566`, `RK3326`, `RK3399`, `S922X`, `SM6115`,
`SM8250`, `SM8550`, `SM8650`, `SM8750`, `H700`, `AMD64` (see `Makefile`; most build both
`arm` and `aarch64`). `make world` builds the primary device set. The fork adds
`GENERIC_X64`, the VM image every change is QA'd on first.

Docker is the recommended way to build:

```bash
make docker-image-pull                   # pull ghcr.io/rocknix/rocknix-build:latest
make docker-RK3588                       # full image build for a device
make docker-shell                        # interactive shell in the build container
PACKAGE=retroarch make docker-package    # build one package in the container
```

Native equivalents (run from a path **without spaces**, **never as root**):

```bash
make RK3588                              # device image build
./scripts/build <package>                # build ONE package
./scripts/clean <package>                # clean ONE package so it rebuilds
make kconfig-menuconfig-RK3588           # edit a device's kernel config
scripts/checkdeps                        # verify host build dependencies
```

Fast dev loop — rebuild one package, then remake the image instead of a full build:

```bash
make docker-shell                        # skip when building natively
export PROJECT=ROCKNIX DEVICE=RK3588 ARCH=aarch64
./scripts/clean <pkg> && ./scripts/build <pkg>
./scripts/install <pkg> && ./scripts/image mkimage   # needs OS_VERSION/BUILD_DATE exported
```

Images land in `target/` (`config/path` sets `TARGET_IMG=$ROOT/target`). Deploy to a
networked device by `scp`-ing the image tar to `root@<host>:~/.update` and rebooting
(preserves settings) — and both the copy and the reboot are the owner's yes, see below.

**Testing/lint:** there is **no unit-test suite**. `tools/pkgcheck <package>` is the only
package lint — run it after every `package.mk` edit. The real test is that the package or
image builds, and then that `tools/vm-qa` is green on the GENERIC_X64 image. A first build
needs ~200GB disk and hours; cached rebuilds take minutes.

## Architecture

**Layered config resolution** (`config/options`): options are sourced in order —
`distributions/<DISTRO>/options` → `projects/<PROJECT>/options` →
`projects/<PROJECT>/devices/<DEVICE>/options` → `config/arch.<ARCH>` — each layer
overriding the last. Device knobs (CPU flags, kernel target, bootloader, GPU family) live
in the device `options` file.

**Package override model:** every package is a directory with a `package.mk`. A
`package.mk` under `projects/<PROJECT>/packages/...` or
`projects/<PROJECT>/devices/<DEVICE>/...` overrides the generic one of the same name in
`packages/`. `DEVICE_ROOT` lets one device reuse another's build root.

**Directory roles:**

- `packages/` — generic cross-project package recipes, grouped by function.
- `projects/<PROJECT>/` — SoC/vendor families (`ROCKNIX`, `Rockchip`, `Qualcomm`, ...):
  device `options`, package overrides, `patches/`, `filesystem/` overlays, `bootloader/`.
- `distributions/ROCKNIX/` — distro identity (version, options, splash).
- `scripts/` — the build engine (`build_distro`, `build`, `clean`, `install`, `image`).
- `tools/` — dev helpers; most are upstream's, and the fork's own are enumerated by name
  in `.claude/rules/fork-workflow.md` and `.githooks/pre-push`.
- `build.*/`, `sources/`, `release/`, `target/` — gitignored build outputs.

**Emulator naming:** libretro cores are `*-lr`; standalone emulators are `*-sa`
(`projects/ROCKNIX/packages/emulators/`).

**EmulationStation** source lives in a separate git repo; see
`projects/ROCKNIX/packages/ui/emulationstation/package.mk` for the pin and the extra build
steps. An ES `.cpp` edit runs `tools/es-syntax-check` before the pin moves.

## `package.mk` rules (see `packages/README.md` for the full reference)

- **Late-binding (enforced by `pkgcheck`):** toolchain/path vars (`CC`, `CFLAGS`,
  `PKG_BUILD`, `TARGET_*`, ...) exist only *after* the package loads — reference them
  **only inside functions** (`configure_package`, `pre_configure_target`, ...), never at
  global scope.
- Customize via `pre_*`/`post_*` hook functions rather than replacing core build steps;
  branch per device with `case ${DEVICE} in ... esac`.
- Preserve upstream JELOS/LibreELEC copyright headers and add a ROCKNIX line — this is a
  fork; credits must be retained.
- Pin git sources with the **full** commit hash in `PKG_VERSION`.
- Patches in a package's `patches/` dir auto-apply after unpack; scope per device with
  `patches/<DEVICE>/`. Kernel patches live under `packages/linux/patches/<DEVICE>/`;
  hardware quirks under `projects/ROCKNIX/packages/hardware/quirks/`.

## Commit conventions

No Conventional Commits. Scope by package or device, matching history:
`azahar-sa - bump to ...`, `SM8250 - linux - enable ntsync`, `emulationstation: bump package`.
**Upstream PR commits are stricter** (CI-enforced): `package: text` title matching
`^[a-zA-Z0-9_*./-]+:[[:space:]].+$`, ≤72 chars, blank line before body, no merge commits.

## Fork workflow (this working copy is a fork)

`origin` = `maxengel/rocknix`, `upstream` = `ROCKNIX/distribution`. Full rules in
`fork-workflow.md` / `worktrees.md`; the essentials:

- Branch `next` = `upstream/next` + a *personal overlay* (`.claude/`, `AGENTS.md`,
  `CLAUDE.md`, `docs/`, `plans/`, `.githooks/`, the fork-only tools). **Never PR `next`
  upstream.**
- Feature work: branch `feature/<name>` from `next` in a worktree at
  `../rocknix.worktrees/<name>`; the primary checkout stays on `next`. Build worktrees are
  on `build/*` branches, never detached (D-WORKFLOW-004).
- Upstream PRs use a throwaway branch built **by content**: check out a detached
  `upstream/next`, `git checkout next -- <the feature paths>`, one commit. The old
  `git rebase --onto upstream/next next pr/<name>` recipe is retired — it silently
  produces an empty branch once the feature has been merged into `next` (D-WORKFLOW-006).
  `.githooks/pre-push` guards `pr/*`; install it with an **absolute** path
  (`git config core.hooksPath "$(git rev-parse --show-toplevel)/.githooks"`).
- Remove a worktree with `tools/fork-worktree remove`, never `git worktree remove --force`
  (D-WORKFLOW-005): it cannot tell a checkout from hours of build output.
- Issues go on the fork: always `gh --repo maxengel/rocknix` (`gh` defaults to upstream
  here, which has Issues disabled).
- User-facing behavior changes need a follow-up docs PR to the separate
  `ROCKNIX/rocknix.org` repo — code and the public docs must not drift.
- Every package the fork introduces is at its latest upstream release or pinned with a
  stated reason: `tools/fork-package-freshness` exits 0 before a `pr/*` branch is cut.

## The rules that bind every session

These are the maintainer's calls, each recorded in `docs/decision-register.md` by ID.
They are not style; each one exists because its absence cost somebody an evening.

- **A handheld is a person's device and its cloud is their data.** Nothing runs on one
  without a per-action yes: not a reboot, not a game launch, not injected input, not a
  screenshot, not a sync, upload or deletion in their cloud, and not the copy of an update
  into `~/.update`. A general offer of device testing is not a standing yes; each action is
  asked for by name with what it writes, sends and leaves behind. Reads need no question
  but go through `grep -v -i -E 'key|pass|token|user|psk'`. Every state-changing device
  command runs through `tools/device-act` (D-QA-011, D-QA-015, D-QA-021).
- **Can this be done on the VM?** Asked and answered in writing, in the issue, before every
  test, proof or measurement. Only a named physical fact (a radio, a battery, a board's
  boot, a real panel, a tailnet) moves it off the VM; "a real provider" and "the device
  already has the history" are not a no (D-QA-007, D-QA-033).
- **Acceptance criteria are agent-first.** Every checkbox is written so an agent can verify
  it and names the artifact that ticks it — a frame, a suite's PASS line, a stamp, a journal
  line. A person's testing and feedback are the source of issues, never the check that
  closes one; a checkbox that says "the maintainer's word" without a physical fact is not a
  criterion (D-QA-044). Say *checkbox* or *open item to verify*, never a bare *box*, which
  here means a machine (D-QA-045).
- **Every out-of-band request becomes a fork issue the same session**, quoting the
  maintainer's words verbatim, with what exists today and acceptance criteria (D-QA-012).
- **Decisions go in `docs/decision-register.md` the same session**, cited by ID and never
  re-argued; the table is append-only. Run `tools/archaeology <terms>` before calling
  anything pending, open or new — the record has settled more than any session remembers.
- **A learning becomes a rule, a tool or a work-log entry, never only a memory.** Append a
  timestamped entry to `docs/work-logs/<yyyy_mm>-work_logs/<yyyy_mm_dd>-work_log.md`, then
  `tools/work-log-index --write`. A procedure becomes a tool or a flag, not prose.
- **Verify the artifact, not the report.** A claim about behaviour cites a file's bytes, a
  row's timestamp, a process, a frame. A name is not a behaviour; a summary is not the
  source; a guard that cannot run has not passed; a promise is not a mechanism — name what
  is watching a long job or say nothing is.
- **Every change lands on devices that already have state.** Check the upgrade path (a
  device keeping its `/storage`) and a clean install before anything is published;
  `tools/vm-upgrade-rehearsal` runs the upgrade half on the VM.
- **Never edit a shell tool while a run of it is in flight**, and never `pkill -f` a
  pattern the shell's own argv carries; long-lived processes get a pidfile.
- **Clarity, then brevity, then sized to the space** for every string a player reads, and
  surprise them as little as possible; time to play (interface → first frame, exit → next
  first frame) is measured on every image (D-UI-045, D-UI-042, D-CLOUD-098).

## The rule files, and when each loads

Generated from the rule files' front matter by `tools/rules-check --write-agents`; the
default run fails when this block is stale. "Every session" means the file has no
`paths:` glob or a `**` glob; Codex does not load any of them on its own, so open the
every-session ones at the start of a session and a scoped one before touching its paths.

<!-- rules-index:begin (generated by tools/rules-check --write-agents; do not edit by hand) -->
**Every session** (no `paths:` glob, or `**`):

- `adversarial-council.md` -- Adversarial-analysis routing — never use the rubber-duck agent; use only the verified multi-model council process, with pinned Fable 5.1 and GPT-6 Astra seats. Read before requesting a challenge pass, independent adversarial analysis, or council deliberation.
- `bugs-are-agent-first.md` -- What a bug is here: fixed to the best of our ability means fixed and closed; every criterion is verified on the VM by an agent; what the VM cannot verify is not a known bug but an item the community tests or a thing to keep an eye on; no known bug is open when a build is called a release candidate (D-QA-051).
- `ceremonies.md` -- Which ceremony is owed and when -- a friction entry's issue, a mini-retro, the weekly and monthly summaries, the work-log index, the register lint, a blindspot's guard, a code audit, a futro -- as a state machine tools/ceremony-check reads from the record; what a missing one refuses (D-WORKFLOW-028, D-QA-040).
- `decision-register.md` -- The append-only ledger of maintainer and operational decisions — when to write a row, when to read one, and why a settled choice should be cited rather than re-argued.
- `device-builds.md` -- Building, publishing, and safely flashing images for the handheld devices we test on, as distinct from the GENERIC_X64 VM build.
- `documentation-accuracy.md` -- Keep user-facing behavior and the public rocknix.org docs in sync; don't let code and docs drift.
- `engineering-practices.md` -- General engineering practices for this codebase (high-signal; add only durable, generalizable rules).
- `es-code-traps.md` -- Sharp edges in the EmulationStation codebase, each found by debugging and each carrying its fix: button-bar lifetimes, rclone's piped progress, xgettext and non-ASCII comments, help-bar prompts, TextComponent's measuring, and where pure string code lives.
- `es-native-ui.md` -- EmulationStation mechanics: where the code lives, the patterns for pages, cards and background jobs, the spacing and the four surface tiers, and the code conventions. Read before building or changing an ES screen; the words it shows are in `es-player-text.md`.
- `es-player-text.md` -- Every word a player reads: the four tiers and the two verbs, the naming conventions, how much text a row may carry, and the outcome vocabulary every cloud run ends with. Read before writing any string an ES screen or a script shows.
- `es-ui-style-guide.md` -- How an EmulationStation screen looks and behaves: the seven row builders, text, confirmations, waiting, saving, reboot flags, buttons, glyphs, gating, and wizards. Read before building or changing any ES screen.
- `fork-workflow.md` -- How to develop on the fork and open clean PRs upstream without leaking personal artifacts.
- `instruction-files.md` -- Where the canonical rules live and how they load; how to tell a stale worktree copy from the current one.
- `issue-tracking.md` -- Where to file issues / tracking lists for this working copy, and how they are structured.
- `learning-capture.md` -- Capture-learning loop: when storing a memory, also consider an instruction-file abstraction and append to the dated work log.
- `least-surprise.md` -- Surprise the player as little as possible: things work as they expect and the same way every time. The tie-breaker for interface and sync decisions.
- `player-language.md` -- Player-facing language is clear first, then as short as it can be while still clear, and sized to the space it is shown in. Applies to every label, dialog, card line and script sentence.
- `release-candidates.md` -- The standard operating procedure for every release candidate: nothing behind before the cut, a clean baseline, the candidate's build, every test, play-testing on the test device, the call, the two-agent upstream audit, then the submission and builds for every test device (D-WORKFLOW-047).
- `time-to-play.md` -- Time to play -- from the interface to a game's first frame, and from one game's exit to the next -- is a first-class goal that weighs on every cloud, sync and interface decision.
- `upgrade-and-install.md` -- Every change ships onto devices that already have state. Check the upgrade path and the clean-install path before a build goes out.
- `vm-first.md` -- Before any test, build proof or measurement: can this be done on the VM? Written down, answered, and only a reasoned no moves it elsewhere.
- `working-principles.md` -- The principles this project works by, and where each one is actually enforced. A map, not a restatement — every row points at the rule that does the work.
- `worktrees.md` -- Convention for creating, placing, and managing git worktrees in this fork

**Scoped** (open before touching the paths):

- `change-log.md` -- The running change log is written the day a player-visible change lands; a section is a set of claims checked against the build. (paths: `projects/ROCKNIX/packages/**`, `docs/cloud-sync-changelog.md`)
- `council-substrate-integrity.md` -- Hard, mechanically-enforced rules for any council or council-research invocation. Every council member call MUST go through the Council Facilitator (`tools/council/council-invoke.ts`). `runSubagent`, ad-hoc `curl`/`fetch`, MCP provider tools, and bespoke scripts are FORBIDDEN as council member invocation paths. Auto-loads on every council / council-research artifact so the rule is in the orchestrator's context at the relevant moment, not buried inside a skill reference doc the orchestrator may not open. (paths: `research/council-research/**`, `research/council-runs/**`, `.claude/skills/council-research/**`, `.claude/skills/council/**`, `.claude/agents/council-member-*.agent.md`, `tools/council/council-invoke.ts`, `tools/council/lib/council-verification.ts`)
- `generic-x64-vm-testing.md` -- How to build-test and QA the GENERIC_X64 (x86_64) VM image locally in QEMU/KVM. (paths: `projects/ROCKNIX/devices/GENERIC_X64/**`, `projects/ROCKNIX/packages/**`, `scripts/mkimage`, `scripts/image`, `tools/vm-qa`, `tools/vm-serial`, `tools/vm-pair`, `tools/vm-visual-qa`, `tools/vm-walks/**`, `tools/cloud-test-backend`, `tools/emulator-exit-test`, `tools/time-to-play`, `docs/vm-qa-log.md`)
- `handheld-evidence.md` -- What a handheld keeps across a power cycle, what to capture first when one misbehaves, and how the hang-to-reboot path works. (paths: `projects/ROCKNIX/packages/sysutils/**`, `projects/ROCKNIX/packages/rocknix/**`, `projects/ROCKNIX/devices/*/linux/**`, `projects/ROCKNIX/devices/*/patches/linux/**`, `docs/**`)
- `packaging-and-patches.md` -- Writing a package.mk and generating patches: the required fields, the templates, and how patches are produced and scoped. (paths: `packages/**`, `projects/**`)
- `rclone-cloud-sync.md` -- Conventions for the rclone cloud-sync subsystem (save/savestate/screenshot/settings backup sync). (paths: `projects/ROCKNIX/packages/network/rclone/**`, `projects/ROCKNIX/packages/rocknix/sources/scripts/**`, `tools/cloud-round-trip`, `tools/cloud-test-backend`, `tools/cloud-census`, `tools/cloud-capture-stamp-test`, `tools/last-good-scripts-test`)
<!-- rules-index:end -->

## Non-obvious gotchas

- Script-only changes (e.g. `scripts/mkimage`) do **not** trigger an image rebuild —
  delete `build.*/.stamps/image/build_target` first.
- Building from a git worktree in Docker requires mounting the main repo's `.git`:
  `DOCKER_EXTRA_OPTS='-v <main-repo>/.git:<main-repo>/.git'` — a worktree's `.git` is a
  pointer file and `scripts/image` runs `git rev-parse`.
- A network/download failure during a build often surfaces as a **misleading,
  unrelated-looking build error** — check for failed downloads first.
- Before "fixing" apparently wrong code, verify design intent via `git log -S`/`git blame`
  and the guards around it — several dangerous-looking patterns are intentional
  (`engineering-practices.md`).
- **Vocabulary is not decoration.** Four tiers (settings; saves; ROMs and BIOS; game
  content), two verbs (*back up*, *restore*), *sync* reserved for the automatic behaviour,
  "Wi-Fi" hyphenated, the serial comma, *game save* vs *save state* — `es-player-text.md`,
  D-UI-022. Only "back up" vs "backup" is checked mechanically (`tools/vocabulary-check`).
- **Read the rules from `next`, not from a feature worktree.** A branch cut from an older
  base silently lacks rule files added since:
  `diff -q <file> <(git -C /workspace/repos/rocknix show next:<file>)`.
- **Headless VM QA** (no desktop on the build host): `generic-x64-vm run --headless
  --daemonize <qcow2>`, then `tools/vm-serial` for a root shell and `tools/vm-visual-qa`
  with `tools/vm-walks/` for the screen. SSH is disabled on a fresh image, so serial is the
  way in; stop a VM by its pidfile, never by `pkill` pattern.
- **A worktree is removed with `tools/fork-worktree remove`**, never
  `git worktree remove --force`, and never the one you are standing in.

## Subsystem quick warnings (read the rule file before editing)

- **rclone cloud-sync** (`projects/ROCKNIX/packages/network/rclone/`,
  `rclone-cloud-sync.md`): the filter file is an *allowlist*; never put `-v`/`--verbose`
  in `RCLONEOPTS`; `--delete-excluded` is catastrophic on a `sync`-mode restore; single
  remote only; a new config option goes in BOTH `cloud_sync.conf` and
  `cloud_sync.conf.defaults` (`DEFAULT_` prefix); an automatic sync is bounded in seconds
  while a deliberate back up may be long (D-CLOUD-113).
- **GENERIC_X64 VM QA** (`generic-x64-vm-testing.md`): the VM disk must be **16GB+** or
  first boot breaks in a way that looks like a graphics bug; a RetroArch frame from a guest
  is evidence only when its surface was the panel's size (#263); `tools/vm-qa` is the
  runner, `docs/vm-qa-log.md` the ledger.
- **Physical-device flashing** (`docs/device-flashing-runbook.md`, `device-builds.md`):
  identify the removable card at run time and exclude every system disk; read the raw
  image back before touching its filesystem; on H700 a fresh card does not boot until the
  exact device tree is activated as `/dtb.img`.
- **EmulationStation** (the four ES rules): comments near a `_( )` string must be ASCII or
  xgettext stops the image build; `Utils::FileSystem::exists` caches a miss for the
  session unless passed `false`; a button must not rebuild its own button bar.

## The checks to run before a push

```bash
tools/pkgcheck <package>        # after every package.mk edit
tools/rules-check               # the instruction files: front matter, index, this file
tools/register-check            # every decision ID once, every citation names a row
tools/work-log-index --check    # the work-log index is current
tools/ceremony-check --gate     # what the push guard refuses
```

`.githooks/pre-push` runs the cheap ones and refuses a push of `next` when one fails; the
fork CI (`.github/workflows/fork-checks.yml`) runs them on every push and daily.

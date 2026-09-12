# AGENTS.md

ROCKNIX is an **immutable Linux distro for handheld gaming devices** (JELOS fork, built on
the LibreELEC/CoreELEC cross-compilation system). There is no app to run — this repo is a
*build system* that cross-compiles a full OS image per device.

**Canonical guides — read before working (this file only adds what they don't cover):**

- `CLAUDE.md` — build/dev commands, architecture, `package.mk` conventions, commit
  style. The overview every agent should start from.
- `packages/README.md` — the authoritative `package.mk` format reference.
- `.claude/rules/*.md` — the canonical scoped guides. A rule with a `paths:` glob
  applies when a matching file is in play; one without applies always. Claude Code
  loads them automatically; point Crush at the directory with `global-context-path`,
  which loads it recursively but ignores `paths:` — so every rule arrives every
  session there. All 21:

  - **The four principles**, loaded every session: `least-surprise` (D-UI-042),
    `player-language` (D-UI-045), `time-to-play` (D-CLOUD-098), `vm-first` (D-QA-007).
  - **Always in context** (`paths: "**"`): `engineering-practices`,
    `upgrade-and-install`, `es-native-ui`, `documentation-accuracy`, `fork-workflow`,
    `worktrees`, `device-builds`, `issue-tracking`, `decision-register`,
    `learning-capture`, `instruction-files`, `adversarial-council`.
  - **Scoped**: `packaging-and-patches` (`packages/**`, `projects/**`),
    `rclone-cloud-sync` (the rclone package, `rocknix/sources/scripts`, the cloud
    tools), `generic-x64-vm-testing` (GENERIC_X64, `projects/ROCKNIX/packages/**`,
    the VM tools), `handheld-evidence` (device packages and kernels, `docs/**`),
    `council-substrate-integrity` (council artifacts and skills).

  Three documents carry interface law and load **nowhere** — open them when the work
  is theirs: `docs/es-ui-style-guide.md`, `docs/es-menu-map.md` (and D-UI-039: a row
  added, moved or renamed updates it in the same change), `docs/conflict-wizard-ia.md`.

There is **no unit-test suite**; `tools/pkgcheck <package>` is the only lint (run it after
any `package.mk` edit), and the real test is that the package/image builds.

## Fork workflow (this working copy is a fork)

`origin` = `maxengel/rocknix`, `upstream` = `ROCKNIX/distribution`. Full rules in
`fork-workflow.md` / `worktrees.md`; the essentials:

- Branch `next` = `upstream/next` + a *personal overlay* (`.claude/rules/`, `docs/`,
  `plans/`, `.githooks/`, `tools/fork-publish-release`, …). **Never PR `next` upstream.**
- Feature work: branch `feature/<name>` from `next` in a worktree at
  `../rocknix.worktrees/<name>`; the primary checkout stays on `next`.
- Upstream PRs use a throwaway branch built **by content**: check out a detached
  `upstream/next`, `git checkout next -- <the feature paths>`, one commit. The old
  `git rebase --onto upstream/next next pr/<name>` recipe is retired — it silently
  produces an empty branch once the feature has been merged into `next`
  (D-WORKFLOW-006). `.githooks/pre-push` guards `pr/*`; install it with an **absolute**
  path (`git config core.hooksPath "$(git rev-parse --show-toplevel)/.githooks"`).
- Remove a worktree with `tools/fork-worktree remove`, never `git worktree remove
  --force` (D-WORKFLOW-005); build worktrees stay on `build/*` branches, never
  detached (D-WORKFLOW-004).
- Issues go on the fork: always `gh --repo maxengel/rocknix` (`gh` defaults to upstream
  here, which has Issues disabled).
- Public user docs live in a separate repo (`ROCKNIX/rocknix.org`); user-facing behavior
  changes need a follow-up docs PR there — don't let code and docs drift.
- When a durable lesson is learned, consider an instruction file under
  `.claude/rules/` and append a timestamped entry to
  `docs/work-logs/<yyyy_mm>-work_logs/<yyyy_mm_dd>-work_log.md` (append, don't overwrite).
  A learning that is a *procedure* becomes a tool or a flag, not prose.
- Decisions go in `docs/decision-register.md` the same session, cited by ID, in an
  **append-only** table (`decision-register.md`); every out-of-band maintainer request
  becomes a fork issue the same session, quoting their words (D-QA-012).

## Non-obvious gotchas

- Script-only changes (e.g. `scripts/mkimage`) do **not** trigger an image rebuild —
  delete `build.*/.stamps/image/build_target` first.
- Building from a **git worktree** in Docker requires mounting the main repo's `.git`
  (`DOCKER_EXTRA_OPTS='-v <main-repo>/.git:<main-repo>/.git'`): a worktree's `.git` is a
  pointer file and `scripts/image` runs `git rev-parse`.
- A network/download failure during a build often surfaces as a **misleading,
  unrelated-looking build error** — check for failed downloads before debugging.
- Before "fixing" apparently wrong code, verify design intent via `git log -S`/`git blame`
  and surrounding guards (`engineering-practices.md`) — several
  dangerous-looking patterns here are intentional or gated.

## Subsystem quick warnings (read the instruction file before editing)

- **Player-facing words**: four tiers (settings; saves; ROMs and BIOS; game content),
  two verbs (*back up*, *restore*), *sync* only for the automatic behaviour, "Wi-Fi"
  hyphenated, the serial comma, *game save* vs *save state*, a row is a label and at
  most one line under it (`es-native-ui.md`, D-UI-022/023). Only "back up" vs "backup"
  is checked mechanically (`tools/vocabulary-check`).
- **Time to play** (`time-to-play.md`, D-CLOUD-098): interface → a game's first frame,
  and a game's exit → the next game's first frame, measured on every image; nothing new
  sits on the launch path unless it must, and an automatic sync is bounded in seconds
  while a deliberate back up may be long (D-CLOUD-113).
- **Can this be done on the VM?** -- written and answered in the issue before every test or
  proof; only a reasoned no moves it off the VM (`.claude/rules/vm-first.md`).
- **A handheld is a person's device and its cloud is their data**: every action on one
  (reboot, game launch, input, screenshot, sync, upload, deletion) is asked for by name
  before it runs; a category-level offer is not a standing yes; reads are free. See
  `docs/device-testing-policy.md` and D-QA-015.
- **Physical-device flashing** (`docs/device-flashing-runbook.md`,
  `device-builds.md`): identify the removable card at run time and exclude all
  system disks; verify the raw image readback before changing its filesystem;
  where extlinux expects `/dtb.img`, activate and hash-check the exact device
  tree from `device_trees/` before first boot.
- **rclone cloud-sync** (`projects/ROCKNIX/packages/network/rclone/`,
  `rclone-cloud-sync.md`): the filter file is an *allowlist* (only
  saves/states/screenshots + `backup/*.zip` sync — never ROMs/BIOS); never put
  `-v`/`--verbose` in `RCLONEOPTS`; `--delete-excluded` is catastrophic on a `sync`-mode
  restore; single-remote only; new config options go in BOTH `cloud_sync.conf` and
  `cloud_sync.conf.defaults` (`DEFAULT_` prefix); keep `cloud_backup`/`cloud_restore`
  structurally in sync.
- **GENERIC_X64 VM QA** (`generic-x64-vm-testing.md`): VM profile source of
  truth is `projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json` + the `generic-x64-vm`
  tool; disk must be **16GB+** or first-boot rsync ENOSPCs and EmulationStation renders
  with a broken menu (looks like a graphics bug, isn't); firmware needs **512-byte logical
  sectors**; prefer the serial debug shell (`ttyS0`) over SSH in-guest; on the host use
  `usermod -aG kvm` + `sg kvm` (not `setfacl`, which logind resets).

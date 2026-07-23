# AGENTS.md

ROCKNIX is an **immutable Linux distro for handheld gaming devices** (JELOS fork, built on
the LibreELEC/CoreELEC cross-compilation system). There is no app to run — this repo is a
*build system* that cross-compiles a full OS image per device.

**Canonical guides — read before working (this file only adds what they don't cover):**

- `.github/copilot-instructions.md` — build/dev commands, architecture, `package.mk`
  conventions, commit style. Agents that auto-load it (Crush, Copilot) already have it;
  everyone else must read it first.
- `packages/readme.md` — the `package.mk` format reference.
- `.github/instructions/*.instructions.md` — scoped deep-dives; each has an `applyTo` glob.
  Load the matching one before touching its area (fork workflow, worktrees, rclone
  cloud-sync, GENERIC_X64 VM QA, issue tracking, learning capture, doc accuracy).
- `.github/shared-copilot-knowledge/` is generic external content — NOT ROCKNIX-specific.

There is **no unit-test suite**; `tools/pkgcheck <package>` is the only lint (run it after
any `package.mk` edit), and the real test is that the package/image builds.

## Fork workflow (this working copy is a fork)

`origin` = `maxengel/rocknix`, `upstream` = `ROCKNIX/distribution`. Full rules in
`fork-workflow.instructions.md` / `worktrees.instructions.md`; the essentials:

- Branch `next` = `upstream/next` + a *personal overlay* (`.github/instructions/`, `docs/`,
  `plans/`, `.githooks/`, `tools/fork-publish-release`, …). **Never PR `next` upstream.**
- Feature work: branch `feature/<name>` from `next` in a worktree at
  `../rocknix.worktrees/<name>`; the primary checkout stays on `next`.
- Upstream PRs use a throwaway branch built with
  `git rebase --onto upstream/next next pr/<name>` (excludes personal commits by
  construction). `.githooks/pre-push` guards `pr/*` (`git config core.hooksPath .githooks`).
- Issues go on the fork: always `gh --repo maxengel/rocknix` (`gh` defaults to upstream
  here, which has Issues disabled).
- Public user docs live in a separate repo (`ROCKNIX/rocknix.org`); user-facing behavior
  changes need a follow-up docs PR there — don't let code and docs drift.
- When a durable lesson is learned, consider an instruction file under
  `.github/instructions/` and append a timestamped entry to
  `docs/work-logs/<yyyy_mm>-work_logs/<yyyy_mm_dd>-work_log.md` (append, don't overwrite).

## Non-obvious gotchas

- Script-only changes (e.g. `scripts/mkimage`) do **not** trigger an image rebuild —
  delete `build.*/.stamps/image/build_target` first.
- Building from a **git worktree** in Docker requires mounting the main repo's `.git`
  (`DOCKER_EXTRA_OPTS='-v <main-repo>/.git:<main-repo>/.git'`): a worktree's `.git` is a
  pointer file and `scripts/image` runs `git rev-parse`.
- A network/download failure during a build often surfaces as a **misleading,
  unrelated-looking build error** — check for failed downloads before debugging.
- Before "fixing" apparently wrong code, verify design intent via `git log -S`/`git blame`
  and surrounding guards (`engineering-practices.instructions.md`) — several
  dangerous-looking patterns here are intentional or gated.

## Subsystem quick warnings (read the instruction file before editing)

- **rclone cloud-sync** (`projects/ROCKNIX/packages/network/rclone/`,
  `rclone-cloud-sync.instructions.md`): the filter file is an *allowlist* (only
  saves/states/screenshots + `backup/*.zip` sync — never ROMs/BIOS); never put
  `-v`/`--verbose` in `RCLONEOPTS`; `--delete-excluded` is catastrophic on a `sync`-mode
  restore; single-remote only; new config options go in BOTH `cloud_sync.conf` and
  `cloud_sync.conf.defaults` (`DEFAULT_` prefix); keep `cloud_backup`/`cloud_restore`
  structurally in sync.
- **GENERIC_X64 VM QA** (`generic-x64-vm-testing.instructions.md`): VM profile source of
  truth is `projects/ROCKNIX/devices/GENERIC_X64/vm/profile.json` + the `generic-x64-vm`
  tool; disk must be **16GB+** or first-boot rsync ENOSPCs and EmulationStation renders
  with a broken menu (looks like a graphics bug, isn't); firmware needs **512-byte logical
  sectors**; prefer the serial debug shell (`ttyS0`) over SSH in-guest; on the host use
  `usermod -aG kvm` + `sg kvm` (not `setfacl`, which logind resets).

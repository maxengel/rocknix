# Fix stream B: backuptool and the rocknix scripts -- the audit of the fix round (D-WORKFLOW-060), Phase 7
You are an Opus 5.5 subagent executing the punch list of the milestone-tier audit of the whole fix round (`docs/audits/2026_09_28-milestone-audit-of-the-fix-round/`), the second such round today: the same worktree, the same files, the same rules. Work only in your worktree, only in the files you own, run every item to an outcome, and return a report. Nothing you do reaches a device, a QA guest, an image build or the `next` branch: you deliver a branch, and the integrator builds.
## Your worktree and branch

- Worktree: `/workspace/repos/rocknix.worktrees/pl-b`, branch `feature/pl-b`, cut from `next`. `cd` there for everything; commit there. The primary checkouts (`/workspace/repos/rocknix` on `next`; the ES checkout `/home/max/Development/emulationstation-next.worktrees/qa-integration`) are read-only for you.
- The rules live in `/workspace/repos/rocknix/.claude/rules/` (read them from there; your ROCKNIX worktree carries the same copies). Open before you start: `engineering-practices.md` (§ Guards must fail closed, § Verify the artifact not the report, § A failure you find is yours to fix, § Before deleting a duplicate), `upgrade-and-install.md` (every fix answers what it does to what earlier builds already wrote), `working-principles.md` § Pre-flight, `packaging-and-patches.md`, and `rclone-cloud-sync.md` where your files are cloud scripts. Cite the decision-register rows your items name (`docs/decision-register.md`) rather than re-arguing them.
## The files you own (exclusive -- another stream owns everything else)

`projects/ROCKNIX/packages/rocknix/sources/scripts/` (`backuptool`, `wifictl`, `factoryreset`, `chksysconfig`, `rocknix-evidence`, and the others there), `projects/ROCKNIX/packages/rocknix/profile.d/001-functions` (`wait_lock`, `write_setting_line`, `set_setting`, the redaction), `projects/ROCKNIX/packages/sysutils/systemd/scripts/` (`userconfig-setup`, `post-update`), the `system.d` units under `projects/ROCKNIX/packages/` named by your rows; plus your block in `tools/last-good-scripts-test`. NOT the rclone package (A), NOT raofflineproxy (D), NOT GENERIC_X64 (F1).

If a fix genuinely needs a file outside this list, do not touch it: say so in the report under that item and leave the item open with the reason.
## How you prove a fix (scripts and recipes)

- `tools/last-good-scripts-test` (run from your worktree root: `./tools/last-good-scripts-test`; read its header first for how cases are written, how the image's busybox is used for the applets the device has, and how fixtures are made) is the harness. Add your cases at the END of the file in ONE block headed `# ---- audit #307, stream B ----` (other streams append their own blocks; the integrator merges). A case is written FIRST and seen to FAIL on the unfixed script -- paste the FAIL line in the report -- then the fix, then the whole suite PASS; quote the final PASS count.
- A recipe (`package.mk`) edit is followed by `tools/pkgcheck <package>`; quote its output. Late binding: toolchain and path variables only inside functions.
- A script that will run under busybox is tested through the image's busybox as the harness does; every external command you add is one the device has (`command -v` in the guest's busybox list in `generic-x64-vm-testing.md` § What the guest's busybox lacks, or a package dependency).
- Every word a player reads (a `>>> why` line, a console line) follows `es-player-text.md` § Outcome vocabulary: `COMPLETED`, `COULDN'T FINISH - <why>`, `SKIPPED - <reason>`, everyday register, no exit codes or paths on a screen.
## Commits

One commit per punch item (a sweep group may share one). Title `<package or script>: <text>` under 72 characters, no spaces before the colon; a blank line; a body that names the item (`audit of the fix round PL-NNN`, or the lead's id `G2-X-NN`) and the finding, says what the test case is, and carries the `Already written:` line -- how the fix treats what earlier builds already wrote on a device (D-WORKFLOW-050; "nothing is written" is an acceptable answer when true). End every commit message with:

```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

Never `--no-verify`, never a bare `git stash`, never edit a shell script while a run of it is in flight (the harness reads scripts by offset).

## The punch items (the contract)

Each item below is a defect the orchestrator confirmed against the source, with the artifact named in `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/02-forward-audit.md` § Verification (the `O-n` entries and the runs) -- read that entry for your item before you start, and the seat's finding under its id in `seats/B-claude.md` / `seats/B-gpt.md`. Every item: a case seen to fail first, then the fix, then the case passing; the commit body carries the `Already written:` line (D-WORKFLOW-050) saying how the fix treats what earlier builds already wrote.

## PL-003: backuptool sources cloud_sync.conf to read the backups folder
- **Severity:** High
- **Category:** Configuration executed
- **Source Finding:** G2-B-01 (gpt, B)
- **Owner area:** stream B, backuptool
- **Where:** projects/ROCKNIX/packages/rocknix/sources/scripts/backuptool:42
- **What:** the reader is `. /storage/.config/cloud_sync.conf` in a subshell; the string is validated after the file has run.
- **Acceptance:** the key is read as text (the first `SETTINGS_BACKUPS="..."` line, as the cleanup keeps it), never sourced; a case with a command in the conf shows nothing runs and the folder is read

## PL-005: the redaction fast path lets a flag-form password through
- **Severity:** High
- **Category:** Credential in a log
- **Source Finding:** G2-B-02 (gpt, B)
- **Owner area:** stream B, 001-functions
- **Where:** projects/ROCKNIX/packages/rocknix/profile.d/001-functions (`redact_credentials`, `passkey=`)
- **What:** `redact_credentials 'launcher --pass qa-value'` prints the value: the argument-mode detector knows `pass` before `=`/`:` only, the sed path knows the flag form.
- **Acceptance:** the fast-path trigger includes the flag form (`--?[A-Za-z0-9_.-]*pass` followed by whitespace); the two lines as cases, masked

## PL-006: a failed snapshot worklist reads as "nothing to protect"
- **Severity:** High
- **Category:** Restore without its snapshot (guard fails open)
- **Source Finding:** G2-B-04 (gpt, B); eight sibling mktemp sites
- **Owner area:** stream B, backuptool
- **Where:** backuptool snapshot_members (KEEP=$(mktemp), the appends, `return 4`); mktemp at 207, 473, 650-652, 758, 775, 1093
- **What:** `mktemp` and every append to KEEP are unchecked; an empty worklist returns 4 whatever emptied it, and the restore extracts without a snapshot or marker.
- **Acceptance:** one checked helper for every temporary file in backuptool; a failure returns a code the restore refuses (not 4); a case that makes mktemp fail asserts the restore refuses; a genuinely empty selection still returns 4

## PL-007: an archive can overwrite the recovery marker that protects its own extraction
- **Severity:** High
- **Category:** Restore control file overwritten
- **Source Finding:** G2-B-06 (gpt, B); adjacent: the snapshot path
- **Owner area:** stream B, backuptool
- **Where:** backuptool:1302 (RESTORE_MARK), the skip lists at 1355 and the unzip equivalent
- **What:** the marker and the snapshot path are not excluded from extraction; an archive carrying `storage/.config/.restore-in-progress` overwrites the fresh marker, and the boot's revert reads the archived one.
- **Acceptance:** the marker and the snapshot path are in every skip list and never listed by the backup; a case with an archive carrying both asserts the fresh marker and the snapshot survive extraction

## PL-008: a quoted password beginning with whitespace passes the key scan
- **Severity:** High
- **Category:** Credential published
- **Source Finding:** G2-B-07 (gpt, B)
- **Owner area:** stream B, backuptool
- **Where:** backuptool CREDENTIAL_KEYS
- **What:** `password = " leading-text"` does not match (`"?[^"[:space:]]+` cannot consume the space after the quote); the file publishes.
- **Acceptance:** the value class allows whitespace after the opening quote; the line as a case, refused

## PL-016: the revert proceeds when the mount table cannot be read
- **Severity:** Medium
- **Category:** Guard fails open
- **Source Finding:** G2-B-08 (gpt, B)
- **Owner area:** stream B, chksysconfig
- **Where:** chksysconfig:144-147
- **What:** with /proc/mounts unreadable the fallback treats an existing parent folder as "not waiting".
- **Acceptance:** an unreadable table waits (fails closed) with its say line; a case with PROC_MOUNTS pointing at a missing file asserts the revert is deferred and the mark kept

## PL-017: the upstream-era move can replace an older archived ZIP of the same name
- **Severity:** Medium
- **Category:** Data loss (an archived backup overwritten)
- **Source Finding:** G2-B-10 (gpt, B)
- **Owner area:** stream B, backuptool
- **Where:** backuptool:1479
- **What:** `mv -f` into archive/upstream-era/ overwrites a same-named file.
- **Acceptance:** a collision keeps both (`mv -n`, then a dated suffix); a case with two same-named zips asserts both survive

## PL-022: busybox unzip passes a damaged stored ZIP member
- **Severity:** Medium
- **Category:** A check that cannot see a damaged stored member
- **Source Finding:** BS-3 (blindspots 8, 43; B)
- **Owner area:** stream B, backuptool
- **Where:** backuptool's ZIP verification (the `unzip -t` / `unzip -p` comment)
- **What:** measured on the image's busybox 1.36.1: a damaged stored member passes `unzip -t` and `unzip -p` (rc 0); a damaged deflated one fails (rc 1).
- **Acceptance:** each member is verified against its listed CRC (`unzip -lv` and `cksum`), or a legacy ZIP with stored members is refused with its why; the measurement as the case, run with the image's busybox

## PL-028: an archive member outside storage/ is extracted and never rolled back
- **Severity:** Medium
- **Category:** Restore/rollback write-set mismatch (a member the snapshot never covers)
- **Source Finding:** G2-B-05 (gpt, B); the blind pass's S-06
- **Owner area:** stream B, backuptool
- **Where:** backuptool `archive_members` (the `^storage/` filter, line 5's awk and the tar case at 479-480); the extraction `tar -xzf ... -C / -X "${SKIP}"` (1356) and the unzip equivalent
- **What:** the snapshot lists `storage/*` regular files; extraction runs the whole archive minus a skip list, so a member outside `storage/` (a legacy or foreign archive's `tmp/...`) is written to `/` and never rolled back. Confirmed Medium in § Verification and then carried nowhere -- neither a punch item nor a lead -- until the blind pass named it (S-06, High there); the grade stays Medium: it needs an archive this tool never writes.
- **Acceptance:** an archive whose member list holds a path not under `storage/` is refused before anything is extracted, with its why; a case with such an archive (tar and zip) asserts nothing outside `storage/` is written and the refusal is printed

## The leads (the seats' remaining findings in your files; not gated, every one gets an outcome)

Read each under its id in `docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/B-claude.md` and `B-gpt.md` (part 2 of the seat's output), then the code it names. Then either **fix** it -- the same rule, a case first -- or **withdraw** it with the line that refutes it, in the report. Ids: G2-B-02 (claude); G2-B-03, G2-B-09, G2-B-11 (gpt). In short: a device whose roms folder is never a mount point waits for ever; `ln` into a directory at the lock path; the seed manifest's unchecked read; persistence failures of the SSID/key pair.

## The report

Write `/workspace/tmp/rocknix-session/streams2/B-report.md` (create the directory if needed) and return its content as your final message. It carries: the branch and `git log --oneline <base>..HEAD`; per punch item -- **outcome** (resolved / open with reason), the commit, the test case's name, the FAIL line seen before the fix and the PASS after, the `Already written:` answer, and anything the integrator must prove on the VM or a device; per sweep row -- fixed (commit) or withdrawn (reason); the harness's final line (the `tools/last-good-scripts-test` PASS count); and a short list of what you could not do and why. No claim without its artifact: a commit hash, a test's output line, a grep.

## Do not

- Build an image or run `make`, `scripts/build`, `scripts/image`; touch `/workspace/repos/rocknix.worktrees/generic-x64` or `devices` (build worktrees); ssh to any host or guest; run `tools/vm-*` or `generic-x64-vm`; touch `/workspace/artifacts`.
- Push; commit on `next` or `test/qa-integration`; create or remove worktrees; edit files outside your list; read `~/.config/council/env`, `~/.config/rocknix/`, `~/.ROCKNIX/`, or anything under `~/.config/<the external forge>/`.
- Ask questions: nobody is watching this stream; decide from the rules and say what you decided in the report. If an item is blocked, leave it open with the reason and go on.

## Run to completion

Wait for every command you start with bounded loops; return only when every punch item and every lead has an outcome. A few hours is expected.

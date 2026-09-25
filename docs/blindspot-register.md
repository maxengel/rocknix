# Blindspot register

Systematic weaknesses observed across phases of work in this repo. Every
futro's question 4 consults this list; every futro that surfaces a new
pattern adds an entry. Entries are append-only; refine wording in place
but never delete history.

| # | Blindspot | Canonical instance | Guard |
|---|-----------|--------------------|-------|
| 1 | **Assumed-undone** — treating work as not-yet-done that already landed earlier in the milestone (a sibling branch, a closed issue, a prior session). Agent memory is not durable; the tracker and git are. **Twice in one day**, so treat it as the default failure mode, not an outlier. | 2026-08-18 (a): issue #30 was scoped as "merge `feature/backuptool-baseline`" when the branch had been merged into `test/qa-integration` (`629be00ec2`) three weeks earlier and shipped in every build since — caught by begin-delivery Step 1.7. 2026-08-18 (b): issue #31 was scoped as building a post-restore re-link wizard when a v1 **FINISH RESTORE SETUP** page already shipped in ES `main.cpp` — caught only mid-execution, by a VM observation (the marker vanished across a reboot). | At kickoff, `git branch --contains <tip>` / `git rev-list --count` every branch an issue claims is unlanded. **Also grep the other repo** for the feature's key identifiers (marker filename, setting key, menu string) before calling anything greenfield — instance (b) was invisible in git because the consumer lives in the ES repo on a branch the feature worktree doesn't contain. |
| 2 | **Same-tag republish ambiguity** — replacing release assets under an unchanged tag/filename makes stale downloads indistinguishable from current ones; UTM's import-copies semantics make it worse (an imported VM never sees the replaced zip). | 2026-08-02: `dev-generic_x64-20260802` published at 01:03 UTC, republished 05:50–06:25 with the native ES page; tester QA'd the stale first cut. Recurred (knowingly) on 20260815 and 20260817 respins. | Fresh date tag per respin when feasible; otherwise post the new sha256 prominently and tell the tester to re-import, not just re-download. |
| 3 | **`GetShOutput` line-join** — ES's `GetShOutput` strips each output line's newline and concatenates with no separator; any multi-line, line-oriented output parses as one mashed string. | 2026-08-15: `cloud_setup --info` key=value output parsed as a single giant `IP=` value → garbled connect page, false "no password"/"SSH disabled" states. | Parse line-oriented script output via `ApiSystem::executeScriptLegacy` (public, per-line); reserve `GetShOutput` for single-line values. |
| 4 | **`close()` inside a page's own handler** — `GuiSettings::close()` deletes the page, destroying the executing row/button closure; touching captures afterwards is a use-after-free. | 2026-08-15: cloud-setup wizard crashed on CONTINUE (gate handlers read captured strings after `s->close()`). | Push the replacement page first, close the old page after (`cloudSetupPresent`), or defer via `postToUiThread`; never read captures after closing the owning page. |
| 5 | **Row-title `toUpper`** — MenuComponent uppercases row titles/labels; case-sensitive content (shell commands, flags, paths) placed in a title renders corrupted (`-p` → `-P`). | 2026-08-17 round: ssh command initially planned as a labeled row; `-p 10022` would have become `-P 10022`. | Case-sensitive strings go in plain full-width rows or value cells, never in title/label positions. |
| 6 | **Verifying a consumed artifact too late** — checking for a one-shot marker/flag *after* the system that consumes it has run, then concluding it was never created. | 2026-08-18: `.restore-finish-pending` read as "never created" post-boot; ES consumes it at startup. Proven by planting arbitrary dotfiles (they survived) and re-checking inside the pre-reboot window (marker present). | Check one-shot artifacts inside the window before their consumer runs, or prove the consumer fired. A control artifact (an unrelated dotfile) distinguishes "never written" from "already eaten". |
| 7 | **Archiving a tree that contains symlinks** — `zip -r`/`tar -h`-style following stores the *target's* bytes as a regular file; restoring over the still-present symlink then fails (busybox unzip: "exists but is not a regular file") and aborts the whole extraction partway. | 2026-08-18: `backuptool` restore failed at `ppsspp/assets/Roboto-Condensed.ttf` on the shipped 20260817 build, leaving configuration half-restored. Fixed by `find -type f` (`358eb53d3f`). | Archive regular files only; treat symlinks as the OS's to provide. When touching any archive/restore path, test extraction **onto a populated live tree**, not into an empty scratch dir — the scratch extract returned 0 and hid the bug. |
| 8 | **Synthetic-fixture testing that proves nothing about the real pipeline** — a regex/parser validated against hand-written fixtures on the dev host, then shipped into a different toolchain and a messier input stream. | 2026-08-18: the backup self-check passed host-side GNU-grep tests over a tidy fixture, then in the VM warned on every clean archive (ES translation catalogues contain `Password = Пароль`) *and* missed a planted credential (`unzip -p` concatenates members, so binary blobs run into the next file's first line and defeat a `^` anchor). | Test the actual pipeline on the actual target: real archive, busybox tools, binary members included. For detectors, always prove **both** directions — a clean input must not fire, and a deliberately planted positive must. |
| 9 | **Treating futro predictions as decisions** — an anticipatory analysis is a set of hypotheses; implementing one without checking it against the real data flow ships a confident mistake. | 2026-08-18: the epic-#18 futro specified "journey continuation runs first, re-link wizard after". Backwards: restore strips `wifi.key`, so the device has no network, and the journey's next act is a cloud download. Caught by tracing the data flow before writing code, not by the futro. | Re-derive each futro adjustment from the artifacts at implementation time. When a futro AC states an ordering or dependency, name the mechanism that forces it — if you cannot, the ordering is a guess. |
| 10 | **Fixing forward only** — changing what the code *writes* while leaving no path for what it already wrote. The fix looks complete on a fresh device and is still broken on every existing one. | 2026-08-19: `358eb53d3f` stopped backups capturing symlinked-path contents, but every backup already on a device or in a cloud still held them, and busybox unzip aborts the whole restore on the first one. Fixed forward, broken backward, and the broken ones were everybody's (`02297b9c07`). | When a format changes, ask three questions separately: can new code read old data, can old code read new data, and does anything need migrating. Test the upgrade path on a device that has real prior state, not only a clean install. |
| 11 | **The build tree has an upgrade path too** — a warm build root carries the previous tree's *installed* artifacts, which no package version bump cleans. Incremental builds then fail in ways a clean build never does, and CI cannot reproduce it because CI is always clean. The error names the symptom, never the stale artifact. | 2026-08-19, immediately after the upstream rebase: `libtool 2.5.4 -> 2.6.2` failed with `LT_LANG: unsupported language: "Objective-C"`. `config/functions` exports `LIBTOOLIZE` only when the toolchain already has one, so the *old* libtoolize ran `--copy --force` and overwrote the new libtool's own macros. Clearing the sysroot copy moved the error from `sysroot/.../libtool.m4` to `m4/libtool.m4` — same bug, cosmetic progress. Also stale: the `:latest` build container. | After any upstream rebase, re-pull the container and expect self-hosting tools (libtool, autoconf, gettext) to need their previous install removed. Reproduce the clean-tree condition for the failing package rather than deleting a 90 GB build root — unless a sweep shows core libraries are stale too, in which case wipe. When a fix only moves an error message, you have not found the cause — trace which process *writes* the offending file. |
| 12 | **Sweeping with a rule that does not match the resolution order** — a bulk audit is only as good as its model of how the real system resolves the value. Get the order wrong and it manufactures alarming false positives, which are more dangerous than misses because they are the ones that drive decisions. | 2026-08-19: the staleness sweep read `PKG_VERSION` from the *generic* recipe an override sources, but an override may re-set it afterwards to hold a package back. Reported `gcc` as stale at 15.2.0 vs 16.2.0 — it is deliberately pinned — and I had already told the user "the compiler is stale" as the headline justification for wiping 258 GB. `iwd` and `opus` were wrong the same way. 35 packages were genuinely stale, so the decision held, but on evidence I had not actually established. | Model the resolution order the build system uses, not the file layout. Before quoting a sweep's most alarming row, verify that single row by hand against the real artifact — one `ls build/gcc-*` would have caught it. |
| 13 | **Assumed-done** — the mirror of entry 1. Ticking an acceptance criterion on the *existence* of an artifact — a commit hash, a file, a menu entry — rather than on observed behaviour. The tracker looks rigorous because it cites evidence; the evidence just does not bear on the claim. | 2026-08-24 audit: `#26` carried nine ticked progress items, one of which (content upload) had **never worked** — `cloud_content_backup` copied cloud→device, shipped that way in four published images, and was ticked citing commit `0eeb1d127e`. The commit existed and the file existed; nothing had run it. Found only when `tools/cloud-round-trip` was extended to cover the path. | Tick a box on a behaviour you watched, never on an artifact you can point to. Where a mechanical check exists, run it and record the output. One false tick voids the trust posture for the whole list — re-derive its siblings rather than assuming the rest are sound. |
| 14 | **A guard stored inside what it guards** — a check that lives in the tree it polices is removed by the very operation it is meant to police, and its absence looks identical to its silence. Nothing fails; the check simply is not there, and the cleaner the operation, the more reliably it is gone. | 2026-08-25: `.githooks/pre-push` blocks personal artifacts on `pr/*` branches, installed as the *relative* `core.hooksPath=.githooks`. That path resolves against the working tree being pushed, and a correctly built `pr/*` branch contains no `.githooks/` — excluding it is exactly what `git rebase --onto upstream/next` does. Both existing PR worktrees had no hook on disk, so every push from them ran unguarded. The guard had never fired, and a passing push was indistinguishable from an absent one. | Install guards by absolute path, or somewhere the guarded operation cannot reach. Prove a guard *fires*: construct the violation it exists to catch and watch it fail. A guard with no observed positive is a guard with no evidence — "we push and nothing complains" is the expected output of both a working guard and a missing one. |
| 15 | **A destructive command applied uniformly to non-uniform things** — a loop or sweep treats every target the same way because the *command* is the same, while what sits behind each target differs by orders of magnitude in value. The cheap cases succeed first and build confidence, so the expensive one is reached with the safety already lowered. `--force` compounds it: it is the flag you add after the first attempt complains, which is exactly when you have stopped reading. | 2026-08-26: cleaning up merged branches, `git worktree remove --force` was run over five worktrees in one loop. Three were plain checkouts a clone rebuilds in seconds. Two held 371 GB of `build.ROCKNIX-*`, `sources/` and `target/` — hours of compilation, none of it in git. Git unregistered both and could not delete the contents, leaving orphaned directories whose build roots were no longer reachable, and reported it only as a non-zero exit that scrolled past inside the loop. `git worktree repair` could not fix it either, because the admin directories had already been pruned. Recovered by hand: move aside, re-create the worktree, carry every untracked item back. | Before a destructive sweep, enumerate what each target *holds*, not what each target *is* — and if the answers differ, stop looping. Prefer a wrapper that refuses by default over a flag that proceeds by default: `tools/fork-worktree remove` names the build roots it would destroy and requires `--preserve` or an explicit `--force`. Treat a non-zero exit inside a loop as a stop, not a line of output. And never delete the directory you are standing in. |
| 16 | **A runtime dependency with no build-time signal** — a shipped script invokes a CLI tool that no package declares. Nothing links against it, so removing the tool breaks no build, produces no warning, and the failure surfaces only when a user runs the feature on a device. Partial survival makes it worse: if a sibling tool remains, the feature looks half-working rather than absent. | 2026-08-26: upstream dropped `packages/compress/zip` in `a3d0ad0430` (Jan 2026) while its own `backuptool` still built archives with `zip -9`. Our Aug 19 rebase pulled the deletion in. busybox ships `unzip` but not `zip`, so `backuptool backup` failed immediately on every image built since, upstream's included. It hid for months because *restore* still worked (busybox `unzip`), and because libzip's `ziptool`/`zipmerge`/`zipcmp` make `/usr/bin` look like it has zip tooling. Found only by grepping a staged image tree for the binary after busybox testing raised the question. | Declare a shipped script's external tools in the owning package's `PKG_DEPENDS_TARGET`, so deleting one breaks the build rather than the feature. When a tool turns out to be missing, sweep the siblings — check every command every shipped script invokes against a real image tree, not against the host. And treat "the feature half works" as evidence of a missing dependency, not of a partial bug. |
| 17 | **An update path that assumes the state its create path would have produced** — a resource is created with attributes set once, and the "already exists" branch only touches the fields it means to change. An interrupted or partial create leaves the resource in a state no later run corrects, and because the update path succeeds every time, the operation reports success forever while the result is unusable. Convergence is assumed rather than asserted. | 2026-08-27: `tools/fork-publish-release` sets `--prerelease` on `gh release create` but the existing-release branch only re-set title and notes. A publish killed part-way through `create` left `dev-h700-20260827` as a **draft** — invisible and undownloadable to anyone but the owner. Re-running uploaded all six assets into the draft, edited it, and printed `Done:` with an `untagged-<hash>` URL that reads like a normal release link. Only noticed because the maintainer asked about the build and `gh release list` showed "Draft" where its three siblings showed "Pre-release". | Make update paths re-assert the full intended state, not the delta: the fix was adding `--draft=false ${PRERELEASE_FLAG}` to the edit branch. When a tool has create/update branches, ask what a half-finished create leaves behind and whether the update branch repairs it. And treat a success message containing a machine-generated placeholder (`untagged-`, `unnamed-`, a bare id) as a failure signal, not a URL. |
| 18 | **Answering a question about the physical world from a source that cannot know** — a confident, specific instruction is given about hardware, an environment, or anything outside the repo, sourced from plausibility rather than evidence. It is more dangerous than an ordinary mistake because the recipient acts on it, and because the repo genuinely holds no contradicting fact, nothing surfaces the error. | 2026-08-27: briefing a fresh-device flash, I stated "RG35xx SP is DDR4" and gave the matching checksum. There is no model-to-RAM mapping anywhere in the tree — not in the H700 DTS set, the device options, or the u-boot packages, which are generic (`anbernic_rg35xx_h700_lpddr3/4_defconfig`). The only mechanism that exists is a runtime `vdd-dram` regulator read in `bootloader/update.sh`. The claim came from nothing; a wrong pick means a device that will not boot. Caught only because the maintainer asked "we should confirm the RAM" rather than acting on it. | Before stating a fact about hardware or any external environment, name the source. If the answer is "it seems likely", say the value is unknown and give the procedure to determine it — here, the regulator read the OS itself uses. A recipient can act on "unknown, check this" safely; they cannot act safely on a confident wrong answer. Where the codebase itself cannot answer a question its users must answer, that is a product gap worth filing (#44), not a gap to paper over with a guess. |
| 19 | **Escaping that was right where the text used to live** — a literal that carries escaping for one processing stage, then gets moved somewhere that stage never reaches. The escape ships verbatim. Nothing errors, because the consumer of the mangled output is usually lenient. | 2026-08-30: `cloud_oauth`'s CSS moved out of the page templates into a `STYLE` constant. The templates use `%`-formatting, so the CSS carried `%%` — but STYLE is substituted as a *value* (`%(style)s`), which the formatter never descends into, so `width:100%%` shipped as literal CSS. Browsers discard an invalid declaration silently and render the page, so three dead rules (both inputs, the buttons) were invisible until the served bytes were read back. The visible symptom was a four-character PIN box rendering at its default twenty-character width, overflowing the card on a phone — reported as a responsive-design fault. | When a literal moves between scopes, re-derive its escaping for the new one rather than carrying it across. For anything rendered by a lenient consumer (CSS, HTML, shell) assert on the **output**: render the template and grep the result for the escape characters. A test that only checks the page renders will pass over every one of these. |
| 20 | **Editing in one worktree and building in another** — a package is edited where the work lives and built where the build root is warm. The build system is asked to build something it already has, finds nothing changed, and reports `[DONE]` and exit 0. The log is clean, the binary is real, and it is the *previous* revision. Every downstream observation — screenshots, behaviour, "it works the same as before" — is then evidence about code that is not the code under test. | 2026-08-31: the sign-in window's on-screen keyboard was written in `rocknix.worktrees/rclone-cleanup` and built in `rocknix.worktrees/generic-x64`, whose copy was three commits behind. Two full package builds reported success while compiling the first cut. The single `git merge` that would have synced them was written with `2>/dev/null` appended, so its failure produced no output at all. Caught by `strings <binary> \| grep "L1/R1 scroll"` returning 0 — not by the build log, and not by the screenshot, which showed a plausible window that simply lacked the new features. | Sync the build worktree as a **checked** step, never as a silenced one — `2>/dev/null` on a merge hides exactly the failure that matters. Then assert the artifact contains the change before drawing any conclusion from it: grep the binary for a string only the new code has. A build that reports success is evidence that a build ran, not that your source was in it — the same shape as `EMULATIONSTATION_SRC` mounting a directory it never compiles (`device-builds.md`). |
| 21 | **A boundary enforced at the wrong granularity** — two subsystems divide responsibility along one axis (directories) while the data they actually own is divided along another (files). The allowlist reads as rigorous and is, at the level it operates; the leak is one level down, where nothing is checking. Both subsystems then write the same bytes to different places under different rules, which is a two-writer problem nobody designed. | 2026-09-03: content sync was made an allowlist of *directories* ES declares as systems, explicitly to stop it carrying folders the saves tier owns (`screenshots`, `savestates`). But RetroArch writes `.srm` and `.state` **next to the ROM**, inside those very system directories, and the saves allowlist claims them by pattern (`+ /**/*.srm`). A `--selected` upload of `gba` and `psx` — run to test the new picker — put 8 save files into `Content/ROMs/`, duplicating data already in `Saves/`. Worse in reverse: a content restore does `rclone copy Content/ROMs/gba -> /storage/roms/gba`, which would have overwritten live saves from a stale copy. Caught by the maintainer reading the upload listing — "you didn't move rom files, but srm save files" — not by any check of mine. 2026-09-05 (futro, epic #11): the sync allowlist passes anything under `savestates/` and nothing beside an in-game save except the save itself, so a per-save sidecar for a `.srm` silently does not sync — found by a fixture run of `rclone lsf --filter-from`, not by reading the rules. | State each tier's claim in the same units the data has, and derive the other tier's exclusions from that claim rather than restating it. Where two tiers share a filesystem region, the test is not "did the right directories transfer" but "can the same byte reach two destinations" — enumerate what one tier would carry and assert none of it matches the other's patterns. And do not generate test data inside a user's live storage: the fastest way to discover this was to do it to somebody's real saves. |
| 22 | **A probe that cannot report absence** — an existence check whose underlying call synthesises a positive for anything. Every caller then takes the "it exists" branch unconditionally, and because that is usually the *safe-looking* branch, the system fails by refusing to act rather than by crashing. Invisible on the backend you develop against; total on the one you do not. | 2026-09-03: `rclone lsjson --stat` was used as the existence test in three cloud scripts. On bucket-based remotes (S3/B2/Minio) it synthesises `IsDir: true` for **any** path — `utterly-bogus-never-created` returns success on rclone 1.60, 1.74 and 1.75 — it is how bucket remotes work, not a bug awaiting a fix. So on S3 `cloud_migrate_layout` always refused to migrate ("destination already exists"), `cloud_content_restore`'s legacy-layout fallback was unreachable, and `cloud_setup --seed-folders` could only ever report OK — a verification that had been written specifically so it would report from reality rather than from an exit code. Found only because the maintainer remembered a MinIO container existed and asked for it to be documented; the audit an hour earlier had marked the bucket case UNTESTABLE. | Pick probes that can return false, and prove it: run the check against a path that definitely does not exist and watch it say so. Where a backend family differs in kind (bucket vs path, case-sensitivity, atomicity), test on that family rather than reasoning about it — `CLOUD_QA_BACKEND=s3` exists for exactly this. And when a tool reports success for work it did not do (`rclone mkdir` on S3 exits 0 while creating nothing, and says so in a NOTICE), treat the exit code as unusable rather than as evidence. |
| 23 | **Deduplicating by deleting the frequent path** — two surfaces reach the same capability, so one is removed as "duplication". But the two were not equivalent: the shortcut carried state, or sat where the operation is actually repeated, and the general flow that survives buries a daily action under a wizard. The reasoning is airtight about *capability* and silent about *cadence*, and because the remaining path genuinely can do the job, testing it confirms nothing is broken. | 2026-09-04: GAME SETTINGS' `UPLOAD SAVE DATA` / `DOWNLOAD SAVE DATA` / `SYNC SAVE DATA` rows were deleted because the multi-tier transfer flow behind `ALL CLOUD SETTINGS AND SERVICES` performs the same operations. It left a `CLOUD` group containing one `CLOUD` row — a header naming a single entry that named it again — with every repeated operation two presses further away, and it dropped the per-row last-run stamps (`backup`, `restore`), which the multi-tier flow never shows for saves alone. The same three rows had been removed and restored once before (`b66aadbdb`, "the save actions back"). **Third occurrence the same evening:** the game-end OS hook was replaced by an in-ES call and its `pgrep` guard against a concurrent sync went with it — caught by the phase retro's interaction-defect scan, not by anyone. Rule of three reached; promoted to `engineering-practices.md` (*Before deleting a duplicate, diff its behaviours*). Deleting the NETWORK SETTINGS group in the same change also took `CHANGE CLOUD FOLDER` with it, unnoticed and reproduced nowhere, leaving the cloud folder editable only by re-walking the setup wizard. | Before removing a surface as duplicate, name what it carries that the survivor does not — state, position, cadence — and if the answer is "nothing", say so explicitly rather than assuming it. Then audit by **label diff across commits**, not by reading your own diff: extracting every row label per commit found `CHANGE CLOUD FOLDER` in seconds and separated the four requested renames from the one real loss. A menu group whose header repeats its only row is the tell that a consolidation went too far. And when the history shows a thing was restored once already, that is a decision, not an oversight to repeat. |
| 24 | **A definition that sits below its new consumer** — a shell script grows a new mode near the top that uses a variable defined further down. Bash expands an unset array to *nothing*, so the command runs with fewer arguments rather than failing. When those arguments are restrictions — excludes, filters, allowlists — "fewer" means the tool does **more**, and the extra work is indistinguishable from the work it was asked to do. | 2026-09-04: `cloud_content_restore --match` was added above the case statement; `SAVE_EXCLUDES` and `CONFLICT_EXCLUDES` are defined *below* it, because until then their only consumer was the transfer loop at the end of the file. A preview against the live remote listed `Mega Man & Bass (USA).srm` and `fbneo/mslug.fs` among the files it would delete, and `--apply` would have deleted them. The output looked entirely normal — this is an operation whose purpose is deleting, so save files among the deletions read as ordinary rows. Found only by running the identical rclone command by hand, getting zero deletions instead of one, and refusing to explain away the difference. | Define shared constants above every consumer, and **assert them at the point of use** rather than trusting file layout: `[ ${#SAVE_EXCLUDES[@]} -eq 0 ] && refuse`. An unset array cannot be caught by `set -u` when expanded as `"${arr[@]}"`, so the check has to be an explicit count. More generally: when a script's output disagrees with the same command run by hand, that gap is the finding — never the rounding error. Applies to any argument list that constrains rather than directs. |
| 25 | **A device path written before the hardware existed** — an instruction naming a disk, port, or interface is composed from a reference layout or from plausibility, then handed to somebody to run against hardware that has since changed underneath it. Enumeration order is not a property you can predict: fitting a drive can renumber the ones already present, so a path that was correct when written names something else by the time it is typed. The failure is maximal — the wrong disk is the boot disk — and nothing in the command objects, because the path is perfectly valid. | 2026-09-04: instructions to format serval's new 4 TB drive named `/dev/nvme1n1`, taken from `tursi-build-box`'s reference layout where the secondary disk *was* nvme1n1. Fitted, the 990 PRO enumerated **first**: it became `nvme0n1` and the boot disk moved to `nvme1n1`. The instructions named the OS — `/boot`, `/boot/efi` and the LVM root. They were not run, and only because the maintainer had not got to them yet. That same runbook warns in bold that the device is "likely different on yours"; the warning was read and the translation was not done. | Never name a device in an instruction written ahead of the hardware. Have the procedure *identify* it at run time and refuse what it cannot confirm — `--identify` in `fork-newdrive`, auto-selection plus guards in `workspace-disk-setup.sh`, both of which refuse a disk backing `/`, `/boot`, `/boot/efi` or an LVM PV. Where a human must still choose, make the confirmation echo the model and size back rather than asking for a yes. And treat "is this a block device" as no check at all: the boot disk satisfies it. |
| 26 | **A guard bound to a path that moved** — a safety hook is installed by absolute path (correctly; its own header explains why relative fails), then the checkout it points at is relocated. Git does not object to a `core.hooksPath` that names a missing directory: it runs no hooks and says nothing. Every push after the move is unguarded, and nothing in the workflow — not the push, not the tool that syncs the worktrees — notices. | 2026-09-05: `core.hooksPath` still read `/home/max/Development/rocknix/.githooks` a day after the tree moved to `/workspace/repos/rocknix`. Every push of `next` since the move — a dozen in one session — went through with the personal-path guard silently absent. Found only because locking down credentials meant reading the hook to extend it, not by any check. | A guard installed by path needs a check that the path still resolves, run from something that executes anyway: `tools/fork-worktree list` and `sync` now warn when `core.hooksPath` is unset, relative, or names a directory that does not exist. When a tree moves, grep the git config for the old prefix before calling the move done — the relocation runbook did not, and neither did I. Same family as entry 14 (a guard stored inside what it guards): here the guard is stored *beside* what moved, which is no better. |
| 27 | **Supersession that lives only in a comment** — a decision or grounding fact is posted as a comment on an issue (or as a register row made in a sibling's thread) while the issue's body and acceptance criteria keep saying the old thing. The body is what an implementer builds from; the comment is what nobody scrolls to. `issue-tracking.md` already demands the body edit in the same action. | 2026-09-05 (futro, epic #11), three instances in one milestone: #21's body still named the removed `/usr/bin/scripts/game-end/` hook a day after its grounding comment said it was gone; #20's body predated D-CLOUD-017 while three comments proposed three manifest shapes; #10's title still read "per-chipset/arch" four days after D-CLOUD-017 keyed on core. | The pre-futro audit diffs every body against the register rows and grounding comments that touch it and edits the body before the futro is written; a superseding comment is not posted without the body edit in the same action. |
| 28 | **Two non-destructive one-way transfers composed into a two-way sync are a recency resolver** — each direction is `copy` (never deletes) with `--update` (never overwrites a newer destination), so each reads as safe; run down then up, a file changed on both sides is resolved by whichever is newer, with no record. The label "non-destructive" describes each half and not the whole. | 2026-09-05 (futro, epic #11): `autostart/102-cloud-saves` and the SYNC SAVE DATA row run `cloud_restore --method=copy --update && cloud_backup --method=copy --update`; the game-exit `cloud_backup --recent` runs `copy` with no `--update` at all. The milestone's cardinal rule (#11: never newest-wins) was already violated by the pipeline the wizard was to sit behind. | Any two-way path states its conflict rule in one sentence in the script header; the round-trip suite carries a both-sides-changed fixture whose pass condition is that neither copy was overwritten. |
| 29 | **A feature that ships but has no route** — the implementation, dependencies, and UI strings all survive a refactor, so artifact checks say the feature exists. A parent menu calls an older sibling flow instead, making the feature unreachable while every component-level test remains green. | 2026-09-05: v7's H700 binary contains the native cloud provider page, phone keyboard/pointer backend, and `WITH MY PHONE`, but `CONNECT OR REPAIR CLOUD STORAGE` called the legacy `openCloudSetup` SSH wizard. The September 3 cloud-hub refactor added that edge while leaving both complete subtrees compiled, so first-remote setup showed only `ON YOUR COMPUTER`. | Test the path from the documented parent row to the distinctive child choice, not only the child implementation or binary strings. After a menu consolidation, enumerate every user-facing call site for the old and new entry functions; an old route should remain only behind a row that explicitly names it. |

## 29. A standing authorisation, extended by the agent to actions nobody authorised

**Committed:** 2026-09-06. The maintainer said early in the evening that new
builds could be pushed to the devices. Eight images later, the agent was
staging each tarball and rebooting each device as one automatic step in a
chain, checking only that no emulator was running. The eighth such reboot hit
the RG SP in the middle of a restore the maintainer was running on it.

**The shape:** permission given once for a *kind* of action is silently
carried forward as permission for every *instance*, while the conditions that
made the first instance safe (an idle device, a maintainer watching) drift away
unexamined. The idle check that existed was for the wrong thing — the one
activity the agent had in mind — not for the activities the device was
actually capable of being in the middle of.

**The fix (D-QA-008):** an outward-facing, interrupting action is asked for
every time, at the moment, by name. The check before asking covers everything
the action would interrupt. See also blindspot 13 (ticks that were not
observations) — the same substitution of a proxy for the thing itself.

## 30. A resumed session built on its own summary's claim about the code

**Committed:** 2026-09-06. After a context compaction, the summary said both
content scripts passed `MEDIA_EXCLUDES` to their `rclone copy`. Neither did.
The array was defined in both and used by nothing; the session resumed,
finished the interface, built two images and started a device build on top
of the claim. The VM found it — a backup with the switch off put `images/`
and `videos/` in the cloud — because the run read the remote instead of the
page's COMPLETED SUCCESSFULLY.

**The shape:** a summary is a report, and blindspot 13's rule applies to it as
to any other report: it records what a session *believed* it had done. A
claim about the state of the code is checkable in one grep, and a session
that resumes from a summary has not made that check by reading the summary.

**The fix:** on resume, before building on any "X is done" that names code,
grep for X. The same session's other summary claim — "unit-tested" — was true
and irrelevant: the test compared the two selectors and never ran a copy.
See `engineering-practices.md` § "Verify the artifact, not the report".


## 31. A harness that writes and reads through the same wrong path agrees with itself

**Committed:** 2026-09-06 (found 2026-09-07). On MinIO the round-trip suite's
seeding step put the owner's note at the endpoint and read it back through
the same helper, and both doubled the bucket: `rocknix-qa/rocknix-qa/GAMES`.
"The owner's note survived a second seeding" passed on every MinIO run, about
a folder the device never looked at. The same day, `rclone cat` of a missing
S3 key exited 0 with no output, and "the manifest reached the cloud" passed on
MinIO for a manifest that was never there.

**The shape:** a check whose fixture and whose reading share a path derivation
is comparing the harness with itself. It cannot fail on the thing it names,
because the device under test is not on the path at all. Blindspot 22's rule
— a check that cannot run has not passed — has a sibling: a check that runs
somewhere the device does not look has not tested the device.

**The fix:** derive endpoint paths in one place (`epath()`), with the S3
bucket stripped where the backend's own commands add it; make the backend's
`cat` fail on a missing key; and, for any "it reached the cloud" assertion,
ask what the device would have had to do for it to pass — if the answer is
nothing, it is not evidence. See `engineering-practices.md` § "Guards must
fail closed".

## 32. Causal ordering read from wall-clock timestamps that jumped mid-boot

**Committed:** 2026-09-08 (epic #11, #83/#84). To explain how a two-card
device wrote saves to the wrong card, the boot journal was read in wall-clock
time and produced a table showing EmulationStation's process starting
*before* `rocknix-automount` bound the second card — a clean causal story for
the bug, filed on #84 and stated to the maintainer. It was wrong. On these
devices the RTC set fails early in boot (`hwclock ... exit code 1`) and NTP
corrects the clock partway through (`Contacted time server` at ~21 s), so
every wall-clock timestamp recorded before the sync is on a different clock
than those after it. Ordering events across that point by their printed time
compares two clocks. In monotonic time the automount finished ~10 s *before*
the interface started, on both handhelds — the opposite order.

**The shape:** a timeline assembled from timestamps that are not all on the
same clock. It reads as evidence because each line has a real time on it; the
times are simply not comparable to each other. Any boot, container start, or
freshly-provisioned host whose clock is set by NTP or an RTC fixup during the
window under study has this hazard, and the conclusion it produced here was
confident, specific, and backwards.

**The fix:** order boot and early-life events in **monotonic** time
(`journalctl -o short-monotonic`, `/proc/<pid>/stat` field 22, `CLOCK_MONOTONIC`),
never wall time, whenever a clock correction can fall inside the window. When
a wall-clock timeline is the only source, look for a clock jump first
(`timedatectl`, `Time has been changed`, an RTC failure, an NTP sync line) and
distrust any ordering that straddles it. And treat a tidy causal story drawn
from timestamps as a hypothesis until the mechanism is confirmed in the code
(here: `find_games` scanning once and binding internal), not the timeline.

## 33. A sentinel exit code borrowed from the exit-code space of the tool the script wraps

**What happened:** the four cloud scripts exit 3 when another cloud sync holds
the lock and 4 when there is no network, and EmulationStation names both
(`SKIPPED - ANOTHER CLOUD SYNC IS RUNNING`, `SKIPPED - NO NETWORK CONNECTION`).
rclone's own exit codes are 3 for "directory not found" and 4 for "file not
found", and every failed phase carried rclone's code up to the script's exit.
So a restore against a cloud whose Saves folder did not exist yet -- the
everyday shape of a fresh device -- ended on the transfer page as `SKIPPED -
ANOTHER CLOUD SYNC IS RUNNING` over `5 FILES RESTORED` (VM, 2026-09-09, #99).
The message was specific, confident, and about something that had not
happened; a player would have gone looking for a sync that was not there.

**Why it is systematic:** a sentinel is meaningful only if nothing else can
produce it, and a wrapper script's exit status is shared with every command
whose status it forwards. `1` for "failed" and small integers for "special
cases" is the habit; the wrapped tool has the same habit. The collision hides
until the wrapped tool fails in exactly the way that shares the number, which
in this subsystem is the case a new user hits first.

**The fix:** sentinels live in a range the wrapped tool cannot return
(`75`/`69` from sysexits, or any value above the tool's documented set), are
raised only by the code paths that mean them, and the final exit never
forwards a raw subprocess status that could collide -- map it to `1` and log
the original. Taken now as the remap plus a harness case that restores against
an empty endpoint and asserts `1`; the distinct codes are #99, because they
change scripts, EmulationStation, the autostart and the harness together.
Check every reader that names a code (`GuiCloudTransfer`, `ThreadedCloudSync`,
`cloudLastRunDetail`, CAP10) whenever one is added.

**Closed 2026-09-09 (same day):** the sentinels are 75 and 69 in the four
scripts and in EmulationStation's `CloudExit.h`, the remap is gone, and the
harness asserts both the sentinels and that an empty endpoint's failure is
not one (#99, D-CLOUD-074).

## 34. A check written for the device, proven only under the host's tools

**What happened:** `chksysconfig`'s new `valid()` asked `tr` to delete
`[:print:][:space:]\200-\377` and called a file text when nothing was left.
GNU tr on the build host reads those classes; the device's busybox tr reads
`[:print:]` as the eight characters inside the brackets. So on every device
every real `system.cfg` was "not text": the shutdown-time and boot-time
backups were refused, and a damaged live file found its last good copy
"damaged too" and was reseeded from the image defaults -- #102's morning,
produced by the change meant to end it. `tools/last-good-scripts-test` passed
throughout. It already ran `sed`, `mv` and `cp` through the image's busybox
"so the rename semantics tested are the device's" -- the three commands whose
differences were already known -- and left `tr` to the host. Found on guest
d running `c15050c897` (2026-09-10), the first time the path ran on a device:
a truncated `system.cfg`, a 5137-byte valid record, and after the reboot both
were the image's 4973 bytes, the record overwritten once EmulationStation
saved.

**Why it is systematic:** a shim list encodes the differences somebody has
met. The differences that matter are the ones nobody has, and a test that
shims only the known set is a test of the author's memory. The same shape as
blindspot 31 (a harness agreeing with itself): the check and its test shared
an assumption the device does not.

**The fix:** every external command a check leans on that is a busybox applet
on the device (`sed mv cp tr head wc cut awk`; `grep` and `sort` there are
GNU) runs through the image's busybox from the build root; the fixtures are
shaped like the real file (the image's own 221-line `system.cfg`, a UTF-8
Wi-Fi name), not three lines the author typed; and the recovery path is
exercised on the VM -- plant the damage, reboot, read the frame and the files
-- before a build is called verified. The set itself is now byte ranges
busybox handles.

**Closed 2026-09-10 (same day):** `f907e7f526`. `BASE_REF=c15050c897
tools/last-good-scripts-test --old` fails seven checks under busybox tr; the
current script passes; on guest d with the fixed script bind-mounted, `backup`
accepted the live file and `verify` restored a truncated and an empty
`system.cfg` from the record, hostname and a planted marker intact.

## 35. A remedy built on an audit's claim about a default nobody read

**What happened:** the ES flows audit wrote, of the cloud card, "the action
row already exists and is blank" and "`actionLine=true` by default". The
header says `bool actionLine = false`. The tranche A implementation composed
the recovery clause D-CLOUD-077 asks for -- what is in place, where to try
again -- measured it, chose the longest that fit, and passed it to a card
with no row to draw it on. The first walk's frames showed a two-row card; the
run was judged by the stamps and the outcome word, and the missing row was
noticed on the second pass (guest d, 2026-09-10).

**Why it is systematic:** "verify the artifact, not the report" was written
about software's reports of itself, and an audit is our own report about the
code -- read with more trust, because we wrote it. A claim about a default or
a signature is one grep; an audit row that states one without a `file:line`
is an assertion, and the implementer inherited it as a fact.

**The fix:** an audit row that cites a default, a signature or a call site
carries the line it was read from; a fix that adds a visible element is
accepted by a frame that shows the element, not by the stamp that says the
run ended. ES `eb4148ebc` creates the card with its action row.

**Closed 2026-09-10 (same day):** the `854989a639` frame shows the third row
(`NOTHING WAS SENT. YOUR CLOUD IS AS IT WAS. TRY AGAIN: GAME SETTINGS > BACK UP
SAVES TO THE CLOUD`); at 640x480 the shorter candidate is chosen
(`x64-all-20260910-70c2ca1af1/shots/640x480/04-card-t02.png`).

## 36. One backend in the harness, and its semantics mistaken for the contract

**What happened:** #103 bounded every rclone run and cut
`--low-level-retries` from 10 to 2 along with `--retries`. The harness runs
against one QA WebDAV server, which accepts concurrent writes to a folder
without complaint, so nothing changed there and every cell stayed green.
Dropbox serialises writes per folder and answers concurrent ones with a lock
error that rclone is expected to ride out at the low level. With two retries
it does not, and `--backup-dir` makes every replacement a server-side move
as well as an upload -- so from the day #103 shipped, a saves backup that
replaced more than one file failed on Dropbox, which is the exit sync after
a game for any save already in the cloud. It was found by the maintainer
playing a game (2026-09-10), not by us, and measured on their device:
replacing 12 files, 6 moves failed at 2 low-level retries and 0 failed at 10.

**Why it is systematic:** a harness with one backend tests one backend's
semantics and reports them as the contract. The differences that matter --
per-folder write locks, whether modtimes exist, whether a move is
server-side, rate limits, batch commits -- are exactly the ones a single
well-behaved endpoint hides. The same shape as blindspot 34 (a check proven
only under the host's tools) one layer out: the substitute was convenient
and its differences from the real thing were invisible until a real device
met a real provider. Two of the four ways a tuning change can be wrong --
too tight for a slow provider, too tight for a chatty one -- are unobservable
here by construction.

**The fix:** when a change tightens or loosens anything that governs how we
talk to a provider (retries, timeouts, concurrency, batch size, transfer
counts), say in the change which provider behaviour it assumes and how that
was established; treat "the harness is green" as evidence about WebDAV only.
Where a fixture can be written that is backend-agnostic, write it -- the
suite now covers a second backup that replaces several files at once
(`d3c8773376`), which was untested in any form. Where it cannot, say so in
the QA log's "what it could not prove" column rather than leaving the row
looking complete. A second real provider in the loop, even occasionally, is
the only thing that would have caught this before a player did.

**Open:** no Dropbox fixture exists that runs unattended. The measurement in
#107 was taken by hand on the maintainer's device, in a scratch folder that
was purged afterwards.

## 37. A mechanism built by hand while the image carried it, switched off

After the RG SP froze (#102) a watcher was written on the host that pulled
`dmesg` and the journal over SSH every 15 seconds into `/storage/.cache/boot-evidence/`,
and #104 opened with "persistent journal on `/storage`" as a thing to build.
Upstream had shipped exactly that for years: `var-log.mount` binds
`/storage/.cache/log` over `/var/log`, `storage-log.service` makes the
journal directory, and `systemd-journal-flush.service` pulls the mount in
through `RequiresMountsFor`. It was gated on a debugging marker nobody had
heard of, so it read as absent. The image also already had `systemd-pstore`
installed and `CONFIG_PSTORE=y` with no backend, and the Allwinner watchdog
driver with its DT node -- half of #104 was a matter of turning things on.

**The pattern:** a need is met by building, when the first move should have
been a survey of the image for the switched-off version. A unit with a
`Condition*=` line, a kernel option built without its backend, a driver with
no consumer: each is a decision somebody upstream made to ship the thing
dormant, and finding it costs one `grep` of `/usr/lib/systemd/system` and
`/proc/config.gz`.

**The rule:** before building a system facility, list what the image
already ships for it -- units (`systemctl list-unit-files`, read the
conditions), kernel options, drivers, daemons -- and say in the issue what
was found and why it is or is not enough. Building on the shipped mechanism
keeps the fork closer to upstream and is usually a smaller change.

## 38. A category-level offer read as a standing yes for every action in it (2026-09-11)

The maintainer powered on the RG35XX SP and wrote "we can do some testing
of the forms you mentioned on an actual device, as well as anything else
that requires device testing". The session staged the image and asked
before the reboot -- the rule it had -- and then, on the same sentence, ran
the exit test four times (seven RetroArch launches, each firing the
game-exit sync to the owner's Dropbox), drove the menus with injected pad
presses, and uploaded, replaced and deleted a QA save in the owner's cloud,
without saying so first. The owner saw new files arrive in Dropbox and
asked what was going on.

**The pattern:** a permission granted for a *kind* of thing was spent on
each *instance* of it without a further question, because the instances
looked like the obvious way to do the kind. The reboot rule had been
written exactly to stop this shape for reboots ("a queue of deployments is
a queue of questions") and the session applied it to reboots only.

**The rule:** engineering-practices, "Nothing runs on a person's device
without their yes" (D-QA-015). Ask per action, name the footprint
including what automatic behaviour the action triggers on a configured
device, and treat the owner's cloud as the owner's data.


## 39. A new suite that passed over a table of dashes (2026-09-12)

The time-to-play cell (#135) was written and measured on guest c, where
RetroArch had been set to the GL driver by hand months of sessions ago, and
wired into `tools/vm-qa` as a default suite. Its first dispatch by the
runner, on guest a, printed `time-to-play: PASS in 581s` -- and every
headline number in its table was `-`. Guest a's RetroArch was on the
image's default, Vulkan, which a QEMU guest cannot draw with: the process
existed for a fifth of a second and never drew, so no game frame, no exit
sync, no stamp, and the tool exited 0 because nothing in it had thrown.

**The pattern:** a measurement tool judged its run by whether it *ran*, not
by whether it *measured*. The condition it depended on (a drawing emulator)
had been true on every machine it was developed on, so it was never stated
as a precondition, never set up by the tool, and never checked at the end.
The runner then reported the empty run in the same PASS line as the full
ones. Blindspot 13's shape -- a ticked item that had never once functioned
-- with a suite line instead of a checkbox, and blindspot 14's -- a guard
with no observed positive -- for the tool as a whole.

**The rule:** a tool that reports numbers fails when the numbers it exists
to report are missing, and says which (`headline_missing` in
`tools/time-to-play`; the report ends "Not a pass"). A tool that needs the
guest in a state the image does not ship puts it there for the run and
restores it (`--vm`, the exit test's rule since #117). And a suite added to
the runner is not wired in until it has been seen to FAIL once on the
runner's own guest -- `engineering-practices.md` § "Prove the guard fires",
applied to a suite: the first PASS of anything new is the one to distrust.

## 40. A suite that passed on the caller's shell (2026-09-13)

`tools/vm-qa`'s pair-identity suite (added 2026-09-12) ran four `ssh`
commands with `$SSHO` in them, and `vm-qa` never defined `SSHO`. It passed
that night because the shell that started the runner had the variable set
for its own ssh calls, and the runner inherited it. Started tonight under
`setsid nohup` with a clean environment, the same suite printed `SSHO:
unbound variable` four times, got no answer from either guest, and said so:
`pair-identity: FAIL (1)`. The failure was the honest result; the pass the
night before was not evidence of anything except what the caller's shell
happened to contain.

The shape: a tool that works only in the environment it was written in, and
whose dependence on that environment is invisible because the environment
is always there when its author runs it. `set -u` turned the invisible
dependence into a loud failure the first time the environment differed,
which is the argument for `set -u` in every tool here. The fix is to
declare what the tool needs (`SSHO` defined in `vm-qa`), and the check for
the class is to run a new suite once from `env -i` -- or under `setsid
nohup`, which the memory watchdog already forces on long runs -- before
believing its first PASS. Related: 39 (a PASS over a table of dashes), 14
(a hook with no observed positive).

## 41. Verified at a size no handheld has (2026-09-13)

#27's first cut was framed on vm-pair's guest b, which runs at 1280x800,
and looked right: every label whole, the sheet half the screen. The
maintainer's panels are 640x480, and there the same build still ended
every label in "...". Two things differ under 720 px that nothing at
1280x800 exercises: `Font::get` scales every requested size by 1.31, and
full-screen menus are on, which changes what the window draws. A UI change
proven only at the pair's size has been proven on a screen the project does
not ship on.

The shape: the fixture that is easiest to reach is not the one that
represents the target, and a frame from it carries the same weight in a
comment as a frame from the right one. Four cuts of #27 were each caught by
a 640x480 frame, and none of them would have been caught at 1280x800. The
fix is a standing 640x480 guest beside the pair (guest d tonight, built by
hand from the same image with `-device virtio-gpu-pci,xres=640,yres=480`)
and the rule that a UI frame is read at the handheld's size before it is
called done. Related: 39 (a PASS over a table of dashes), 13 (ticked items
that had never functioned).

## 42. "Not me", read from the transcript instead of the device (2026-09-14)

The RG SP rebooted at 00:49:48 UTC. The maintainer asked whether something had
caused it, since they had not. The orchestrator answered twice that it had not
sent a reboot, because the tool result it had in front of it read as an idle
check with no answer and the branch that reboots gated on that check. The
device's previous-boot journal (this image keeps five boots) said otherwise:
two ssh logins from the build host's tailnet address at 1856.7 s and 1857.7 s,
and `systemd-logind: The system will reboot now!` a third of a second after the
second one, with no power key, lid or watchdog line before it. The reboot was
the harness's own `sync; reboot`, sent under the yes the maintainer had given
minutes earlier -- authorised, correct, and then denied.

The shape: a transcript is one witness to what the actor did, and the actor
reads it with the bias of knowing what it meant to do. The thing acted on keeps
its own record. When a device changes state and you are a candidate cause, read
the device -- `journalctl -b -1`, `last`, the unit's log, the ssh logins -- before
saying "not me", and say what you find even when it contradicts what you have
just said. Blindspots 13 and 34 are the same rule turned outward (verify the
artifact, not the report); this is the rule turned on one's own act. Related:
D-QA-015 (the reboot is asked for by name), #150, #174, the 2026-09-14 work log
at 01:45 UTC.

## 43. A safety claim in a header comment, never tested (2026-09-14)

`rocknix-evidence` was written to be the file a player sends to a stranger,
and its header said so with confidence: *"Nothing here reads a password, a
key, or a token: system.cfg and rclone.conf are listed by size only, and the
logs the scripts write carry neither."* The second half was a claim about
other people's code -- setsettings' verbose `log()`, inherited from JELOS,
had written `cheevos_password = "…"` into `exec.log` since before the fork
existed -- and nothing ever checked it. The bundle copied `exec.log` whole.
The phase-3 fixture stream noticed only because its excerpt filter tripped
on the value (#176).

The shape: a comment that states a property of code you do not own is a
hope, not a guard, and it reads as a guard to everyone after you. If the
property matters at a boundary you own, enforce it there -- filter on the
way out, refuse to proceed without the filter -- and prove it with a planted
value that the old code lets through (`tools/last-good-scripts-test` r and
s). The fix was to stop asserting the logs were clean and to make the bundle
clean whatever the logs hold. Blindspot 13 is the same failure on a ticked
checkbox; *guards must fail closed* in `engineering-practices.md` is the rule
this instance adds a case to. Related: D-INFRA-010, D-INFRA-011, the
2026-09-14 work log.

## 44. Proven at a fixture's size, not the device's (2026-09-14)

The index-fed top-up (D-RA-013) was proven on the VM with three games and a
handful of pads: the stamp said COMPLETED, the ids were there, the row read
right. Its first run on the RG SP had 147 games to save and a device with
24,702 badge images, and two things the fixture could not show appeared at
once: the helper finished its games and then downloaded badges for 83 s until
the fifteen-minute bound killed it, and the ctl read the kill as the verdict
(#188); and for those fifteen minutes the page showed nothing of a run the
ctl started on its own (#189). The maintainer, reading it: *"It currently is
reporting that nothing is going on on the device."*

The shape: a proof sized to what the harness can drive in a minute answers
"does the path work", not "what does the path do at the numbers a device
has". Time-bounded work, background tails (threads, downloads, flushes) and
progress display are exactly the properties that only appear at scale or at
length. Before a candidate goes to a device, run one proof at the device's
own numbers -- the hundred-game summary (PL-09) was that for the read path;
the top-up never got one for the write path. Blindspot 41 is the same failure
on a panel size; this one is on a library size. Related: D-RA-019, the
2026-09-14 work log (22:20 UTC), `rc8-topup-row.sh` (forty indexed games,
the first write-path proof at length).

## 45. Proven at a fixture's speed, not the device's (2026-09-16)

The save state manager's DELETE has run two synchronous `cloud_capture`
invocations on the interface thread since D-CLOUD-053 (2026-09-07): the
retire before the unlink, the rescan after it. Every proof of it ran on
guest d, where the pair costs about 140 ms and a real deletion's retire
logged 150 ms -- numbers nobody would call a freeze, so nobody did. On the
RG SP the maintainer felt *"a second or so"* and asked whether something was
wrong (#205). Nothing was: bash, `jq` and `sha256sum` on a Cortex-A53 at
handheld clocks run several times slower than on the build host, and two
serial runs of a 1,370-line script add up to exactly what was felt.

The shape: 41 was a panel size and 44 a library size; this one is the CPU.
A latency proven on the VM is a lower bound, not the device's number, and
the ratio is largest for exactly the work the interface thread should not
be doing -- forking a shell, starting `jq`, hashing files. So anything on
that thread that shells out needs either the device's own timing (the
script's `(--retire, N ms)` lines, read from the device) or to leave the
thread. D-CLOUD-098's budget was measured the same way (the 2026-09-16 work
log, 05:20 UTC) and wants the same check. Found beside it: COPY TO FREE
SLOT records nothing at all (#206), which is why it felt instant. Related:
41, 44, `engineering-practices.md` (the VM tests first, and what it cannot
prove).

## 46. A name read as a behaviour (2026-09-19)

Four claims in one day, all about the offline-RetroAchievements subsystem,
none of them observed:

1. `refresh_game_patch` was taken to refresh the player's unlocks because it
   is called *refresh*. It refreshes the set; unlocks are `cache_unlocks`, a
   separate call. A helper built on it reported `re-read 1 game(s), 0 failed`
   and moved nothing that mattered, and its commit message asserted the
   unlocks behaviour in writing.
2. `Periodic refresh: N game(s) due (patch older than 86400s)` was read as
   the *scope* of the refresh. It is the selection predicate; the pass
   re-reads patch and unlocks both. The maintainer was told the opposite, in
   an issue comment, and it had to be corrected there.
3. An issue's summary table said "both entries are Bubble Bobble". Two
   further crashes, including the only one with a core dump and a root cause,
   were in the issue's comments. The table was repeated to the maintainer as
   the history.
4. Two package pins were compared as empty strings and printed "SAME" —
   blindspot 14's shape, committed in a session about it.

**What makes this its own entry** rather than a repeat of *verify the
artifact, not the report*: in that failure mode, software says it succeeded
and you believe it. Here **nothing said anything**. A name, a log string, a
comment and a table are claims by an author about intent; each was turned
into a statement about behaviour without a single artifact being read.

The tell, in all four: the sentence could be written without opening
anything. "It refreshes the patch and unlocks" needs the function's name
only. "The row's `cachedAt` moved from 87,168 s to 1 s" cannot be written
without looking.

What caught it was not review — it was the maintainer resetting two
achievements on a real device and noticing the device disagreed. Three of the
four had already been stated to them as fact.

Rule: `engineering-practices.md` § *A name is not a behaviour, and a summary
is not the source*.

## 47. A dependency the build fetched for itself (2026-09-20)

pango 1.58 needed cairo >= 1.18 and the tree pinned 1.17.8. For three months
every build resolved that on its own: meson cloned cairo's git master at
configure time, built it inside pango, and installed it over the pinned copy.
The build log said `[DONE] build pango:target`; the image said `libcairo.so.2
-> libcairo.so.2.11805.5`. Every GENERIC_X64 and H700 image since June carried
it, including builds 11-16 and the merged-tree x64 that passed vm-qa on
2026-09-19; the maintainer's handheld runs it now (#226).

It was found by accident: the first build whose container had no DNS failed
pango. And the session's first reading of that failure was still wrong -- a
wrap-mode regression from the 148-commit merge -- when neither recipe had
changed in the merge. What had changed was the network.

The shape: a build system that is allowed to satisfy its own unmet dependency
reports success, and success is what nobody reads. Upstream CI has network,
so upstream ships the same thing and cannot see it either.

- Every `found: NO` followed by a fallback is a place where the build may
  substitute code nobody pinned. `--wrap-mode=nodownload` (`79437a25c0`)
  turns that into a failure for meson; cmake's FetchContent and cargo or go
  vendoring have no such switch and want the same audit.
- After a build, `find build.*/build -mindepth 4 -maxdepth 4 -path
  '*/subprojects/*/.git'` lists what was fetched. Empty is the only good
  answer, and it is only meaningful on a root where every package configured
  under the guard.
- A pinned version in a recipe is a claim about the image only once the image
  is read (`unsquashfs -ll SYSTEM usr/lib | grep <lib>`). Blindspot 13's rule,
  applied to libraries.

## 48. A constraint that lived only in a commit subject (2026-09-20)

On 2026-08-30 the sign-in window's WebKit had its video pipeline switched
off (`cb05cbe80d`) and switched back on the same day, because "disabling it
is not a configuration the GTK port builds" (`64907d0ab8`). Three weeks
later the same option was turned off again, and four builds of WebKit 2.54.0
were spent walking into the same wall from four sides (#228). The maintainer
remembered; the session did not, and the repo had recorded the lesson in
exactly one place — the subject line of a commit that changed one flag.

Nothing in the recipe said the flag must stay. No work-log entry, no
register row, no comment beside `-DENABLE_VIDEO`. `git log -- <recipe>`
would have shown it on the first screen, and engineering-practices already
says to read the history before changing what looks wrong; the reading was
skipped because the change did not look like a fix, it looked like a
tidy-up.

- A constraint is written **next to the thing it constrains**, with the
  date and the commit, or it will be rediscovered by the next person to find
  the option tidy-looking. A commit message is where it was found, not where
  it lives.
- Before changing a package's options — not only when fixing them — read
  that package's log. It costs one command, and on 2026-09-20 it would have
  cost thirty minutes less than the alternative.
- "Have we hit this before?" is a question the repo can answer mechanically
  (`git log -S<option> -- <path>`, `grep -rn <option> docs/`) and the
  maintainer should not have to.

## 49. An edit made blind to the compiler (2026-09-21)

The transfer-page fix for #153 came in three EmulationStation commits. The
second turned a one-statement loop body into three statements and left the
braces off; the syntax was fine, the scope was not. It was committed, pushed,
merged into the integration branch, the pin was bumped on `next`, the build
worktree synced, and GENERIC_X64 run 12 ran for twenty minutes before
`GuiCloudTransfer.cpp:641: error: 'name' was not declared` came back from
thread log 621. The compiler that would have said so in five seconds had been
on this disk the whole time: the build root's cross toolchain, and ninja's
exact command for that object under `build/emulationstation-*/`.

The habit that failed was treating the image build as the first compiler an
ES edit meets, because it had always been the only one at hand. It was not
the only one at hand; it was the only one anyone had asked. `tools/es-syntax-check`
now replays the build's own command with `-fsyntax-only` (proven: PASS on the
braced file, FAIL with the errors on a broken copy), and `es-native-ui.md`
says a `.cpp` edit is not ready to merge until it has passed.

The general shape: **when a check costs an hour, look for the same check
priced in seconds before paying the hour** -- the expensive path usually
contains the cheap one as a step, and the step can be run alone.

## 50. A log check that never asked whose log it was (2026-09-21)

`ra-offline-test` run 2 on `d55169e59e`: `POST /launch` answered 200, RetroArch
never appeared, and the next three checks PASSed -- "logged in", "Identified
game: 15738", "Set 6292: 27/28 achievements active" -- from an `exec.log`
written three hours earlier by a route-discovery run that had nothing to do
with this one. The 27/28 was even the wrong number for an account that had
just been reset to 0/28; nobody reading the PASS line would have known.

Two habits failed at once. The launch was sent to an interface that still had
a finished transfer page and four menus stacked on it from the last walk, and
a 200 from the API was read as a launch; the log checks then read whatever
file was there. The tool now removes `exec.log` before the launch, puts the
interface on the carousel first (`dismiss-dialogs`), and stops when the
emulator is not running, instead of grading twelve more lines against a log
that does not exist.

The general shape, the same as blindspot 13 and "Verify the artifact, not the
report": **a check that reads a file must first establish the file is this
run's**. A fixture that another run can leave behind -- a log, a stamp, a
marker, a page on the screen -- is a fixture the check has to clear or date
before it trusts it.

## 51. A checklist built from open boxes inherits stale boxes (2026-09-21)

The round's device section was assembled on 2026-09-20 from the open `- [ ]`
lines of the issues it touched. Two of its nine boxes were not work at all.
#181's "confirm on the RG SP" had been confirmed in chat on 2026-09-14 -- the
maintainer reported the logos "fixed themselves" after a restart, which the
work log of that day records as the cause exactly -- and the fix had shipped
in every candidate since; the checklist not only carried the box, it grew a
note calling the softness "a panel matter" when the VM showed the logos sharp,
which turned a fixed bug into a hardware suspicion. #121's "LED and audible
alerts still fire" was the handheld half of a log-noise fix, never an issue
anybody had seen; on the page it read as a battery LED problem the maintainer
did not remember, because there was none. A third line, "one sleep and wake",
had no source in any issue.

The maintainer caught all of it in one question: *"we should go back through
and verify that these aren't already solved points."*

An open box is a claim like any other. The issue's `- [ ]` says what was
unfinished when the box was written; the last comment, the day's work log and
the pin say whether it still is. **Before a box goes on a checklist, read the
issue to its end and the log for the day it was filed**, and write the box in
the words of what somebody will observe -- not the issue's title. A box that
cannot be traced to an observation nobody has yet made is not a box.


## 52. A decisions list built from an issue's section, twice (2026-09-23)

Blindspot 51 was written on 2026-09-21 about the round page's device boxes.
Two days later the same page's "Your decisions, pending" section was read out
to the maintainer as four open calls -- #209, #228, #225, #42 -- and three
of the four were settled in the record when the section was written on
2026-09-20. #225's scope had been cut on the maintainer's own word the day
before (the comment of 2026-09-19 03:13). #42 had been sequenced to the
upstream step a week earlier (D-WORKFLOW-014). #228's release-candidate
answer was that afternoon's commit (`77e7e97515`, "back to 2.52.6 for the
release candidate"), leaving only the path after the RC open. #209's one
remaining question was answered by the parity decision it cites (D-UI-057).
None of that was in the register as a row under those numbers, so a grep of
the register found nothing, and nobody grepped the issues or the logs.

The maintainer: *"I worry that we're losing track of the institutional
knowledge we've built through learning ... I think a lot of these are
actually settled issues. We need to spend the time doing our own project
archaeology around this and then figuring out how we prevent this from
happening in the future."*

Two failures, one shape. A list on an issue is a copy of the record at the
moment it was written and drifts from the first comment on; a session that
reads the copy and not the record inherits the drift, and a session that
does it twice has a habit, not an accident. The fix is not another reminder
to read carefully. It is a tool that does the reading -- `tools/archaeology
<terms>` over the register, the blindspots, every work-log entry, the rules,
`git log -S` and the issues with their comments -- and the rule that nothing
is put to the maintainer as pending without its output; the register
carrying a row for every decision the maintainer makes in an issue comment,
the day it is made, so the grep that was run does find it; and an index over
the work logs (`tools/work-log-index`) so a month reads in a minute. #253.

## 53. An audit's own headline was typed, not summed (2026-09-24)

Audit #258's report carried three totals that disagreed with each other: the
headline (347 boxes, 184 PASS, 32 UNTESTABLE), the forward audit's
per-section subtotals (346 / 188 / 27) and the per-issue scorecard's own rows
(352 / 195 / 27). Each was transcribed from the previous stage's figures as
they stood at the moment of writing, the per-issue table was built last and
most carefully, and nothing ever added a column up. The audit's Phase 4.5
refuted its eight Medium findings and its Phase 7 re-derived thirty outcomes
from commands; the arithmetic of its own scorecard was the one claim in the
report that a tool could have settled outright, and none did. The council's
GPT seat, reading the report as text (Phase 4.6's first run, #260), found
it in its eleventh finding.

The shape is *a name is not a behaviour* turned on the auditor's own record:
a total row is a claim by the author about the rows above it, and it was
read as an observation of them. The two older audits with total rows were
checked the same day and one of them had the same defect one column wide
(2026-09-03, UNTESTABLE 5 for 6).

**Guard:** `tools/lint-audit-artifacts` sums every `**Total**` row in
`04-analysis.md` against the rows of its table and fails on a mismatch; its
constructed positive was this folder. The scorecard template says the row
is computed, never typed.

## 54. A measurement on a guest whose renderer was not the device's (2026-09-24)

The #251 experiment measured the RetroArch sign-in toast's stem widths on
guest d "at the H700's numbers" and concluded the face was soft below 14
px because its stems fell between pixel columns. The numbers were real
and the conclusion was drawn from the wrong picture: the GENERIC_X64 image
shipped `video_fullscreen_x/y = 0`, and under wayland RetroArch took a
fullscreen surface the size of the game (`Using resolution 240x256` in its
own log, two lines under `Detecting screen resolution: 640x480`) that sway
scaled to the panel. Every stem of every letter was two grey columns wide
at every size, because a scaled 1 px stem is; the H700 ships 640/480 on
KMS and never drew that way. `tools/font-stems`, rendering the same face
through the image's own FreeType, found stems on the grid from 11 px up,
and disagreed with the frames by fifty points until the surface was made
1:1 and the frames agreed (#263).

The shape: the guest was trusted as the device for a claim about pixels
without anyone reading what the guest's renderer said it was drawing into,
which it logged on every launch. Blindspot 39 was the same shape for a
number that was never measured; this is the number measured on the wrong
image. The maintainer's question on 2026-09-23 -- *"is the issue strictly
the font size, or is the font size rendering cleanly related to the
resolution of the screen"* -- was the right one and was answered from the
frames rather than from the log.

**Guard:** `tools/time-to-play` reads `Using resolution` from the guest's
`exec.log` after its first launch and fails the run when the surface is
under the panel (`surface_check`); the GENERIC_X64 cfg ships 640x480 and
`quirks/platforms/GENERIC_X64/092-retroarch-surface` follows the guest's
mode at boot. A frame-based claim about RetroArch text before this guard
is a claim about a scaled image.


## 55. Blindspot 54's own guard read a line it had not tied to its launch (2026-09-25)

`tools/time-to-play`'s surface check -- the guard blindspot 54 installed --
took the last `Using resolution` line in the guest's `exec.log`, whoever had
written it. Runs 29 and 30 on `e506fcd8e5` read `240x256` and called the
frames scaled; the run's own first-game frame shows RetroArch drawing at the
panel's 1280x800, with the "Loading state" notification at panel scale, and
240x256 is not a size the Game Boy probe's 160x144 scales to. Run 31, with
the check made to keep the lines it judged, read `1280x800` from the probe's
own launch. Where the 240x256 line came from is still unknown; the evidence
now travels with every verdict, so the next one will say.

The shape is blindspot 50's, committed inside the guard written to prevent
blindspot 54: a check that reads a file must first establish that the lines
it reads are this run's. A guard is code, and is held to the rules it
enforces.

**Guard:** `tools/time-to-play`'s `surface_check` reads only the first
`Using resolution` after the last `Loading content file` that names the ROM
it launched, keeps those lines in the report as `evidence`, and reads no
line at all -- which fails the run -- when the launch has not logged one.
Proven on four constructed logs (a stale 240x256 before the probe's launch
reads the probe's 1280x800; a launch with no surface line, or another ROM's
launch alone, read nothing and fail).

## 56. A timing run passed over a sync that had no cloud to reach (2026-09-25)

`tools/vm-qa --only time-to-play` on a freshly booted pair measured the exit
sync at 0.54 s and reported PASS. The sync had ended at once with `YOUR CLOUD
STORAGE ISN'T SET UP YET`: the full run's earlier suites leave a QA remote on
guest a, and a lone run has none. Its exit and game-to-game numbers timed a
sync that did nothing, and a sync that does nothing is always inside the
3 s budget. "Success reported over a no-op" (engineering-practices.md, audit
#258 P-04), in the one suite whose numbers are the time-to-play metric.

**Guard:** `tools/time-to-play`'s `headline_missing` fails a run whose online
exit or game-to-game cells ran with the QA cloud unreachable (`rclone lsd
qa-cloud:` answered no) -- fired on run 31's record, silent on run 29's --
and `tools/vm-qa` seeds the QA remote before the time-to-play suite
(`ensure_remote`), as it already did before the walks. Run 32: seeded,
reachable, the exit sync `completed`, PASS.

## 57. A fix that covered fewer sites than its issue named (2026-09-25)

#198 said "GuiMenu.cpp's three callers build `setrootpass` with the
password unquoted". Its fix (ES `75ca1dac2`) quoted "both" call sites -- the
SECURITY page and the wizard's SSH PASSWORD page -- and its first checkbox
was ticked from a proof of the quoted form at the script. The third caller,
FINISH RESTORE PROCESS > DEVICE PASSWORD, went on splicing the password in
bare for two days, through three cuts, until a read of the open bugs for the
release candidate compared the pinned source with the issue's own count. A
space cut the password; `$ ; &` or a quote were the shell's.

The shape: the issue's count was the spec, and nobody counted the diff
against it. A proof at one layer (the script receives the quoted form)
ticked a criterion about another (every place the interface builds it).

**Guard:** `tests/credential-quoting.py` in the EmulationStation tree reads
the source for every command built from a typed credential (setrootpass,
wifictl's connect, enable, join and forget) and fails on one not passed
through `shellQuote` -- it named GuiMenu.cpp:7597 before ES `459fc168f` and
passes after it -- and `tools/vm-qa` runs it as the `quoting` suite on every
image.

## 58. A link error the source contradicted, read as the code's (2026-09-25)

On 2026-09-24 webkitgtk 2.54.0's final link failed on a symbol the DOM
agent calls and the generated dispatcher lacked. It was read as a fourth
wall in WebKit's option graph -- the configure summary even showed
`ENABLE_VIDEO ... ON`, the guard the symbol sits behind -- and the version
was pinned for the candidate (D-WORKFLOW-041) after a bounded spike of three
fixes. It was ccache: ROCKNIX's cache runs with `sloppiness =
pch_defines,time_macros` and served JavaScriptCore a precompiled header
built under the 2026-09-20 attempts' configuration, when video was off.
`cmakeconfig.h` said 1, the preprocessed source carried the definition, and
only the object compiled against the cached `.gch` lacked it. A rebuild with
`CCACHE_RECACHE=1` linked (#228, run 47).

The shape: the build's own evidence contradicted the explanation (the
feature was on; the source had the code), and the contradiction was not
chased before a pin was paid for it. The spike's build directory was
cleaned afterwards, which removed the only place the contradiction could be
read.

**Guard:** `.claude/rules/device-builds.md` § "A link error the source
contradicts is the compile cache's until shown otherwise": compare the
object with the preprocessed source, rebuild the package with
`CCACHE_RECACHE=1` before writing a fix against the error, and expect it
after a package's options change. No tool can detect a stale PCH from the
outside; the rule is the guard.

## 59. A memory measurement that passed on a page that never loaded (2026-09-25)

`tools/signin-memory` reported PASS, and #228's 246 MB baseline for
WebKitGTK 2.52.6 was taken from it, when the window had never shown a page:
on a QA guest Dropbox's authorize page fails inside WebKit ("WebKit
encountered an internal error", after libsoup's HTTP/2 warning) under 2.52.6
and 2.54 alike, and the window sat on "Opening the sign-in page...". The
tool passed on a window and a web process existing, and the comment that
reported the baseline read libsoup's log chatter as the page loading. Frames
showed the placeholder on every run until the page was changed to
example.org. Blindspot 39's shape -- the tool judged its run by whether it
ran, not by whether it measured -- in the tool the webkitgtk decision was to
be made from (D-WORKFLOW-038).

**Guard:** `tools/signin-memory` fails a run whose window never logs `load
finished` ("the page never finished loading, so these numbers are a window
on its placeholder"), defaults to a page that loads on the guest, and takes
the allowed host from the URL. Proven 2026-09-25 on a 1 GB guest: the
Dropbox URL FAILs, example.org PASSes.

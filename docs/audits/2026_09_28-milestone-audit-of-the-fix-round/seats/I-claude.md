> Redacted by the orchestrator, 2026-09-28: credential-shaped example strings in this seat's prose (test fixtures and pattern examples the seat quoted) were replaced by `<credential-shaped example redacted>` so the file can be committed past the push guard (`.githooks/secret-patterns`); nothing else was changed.

# Packet I — second-seat audit (integrator's product & harness commits on `next`)

**Seat:** council member (this seat)
**Corpus:** the five embedded sources (paths and sha256 as declared by the Facilitator; recorded in the provenance block at the end). I did not re-read or re-hash anything.

## 0. What the packet does and does not contain

`seats/I.diff` (sha256 `4c42ba0b…02c1`) holds 14 commits. The brief names one more, **`b31bf53771` ("the harness's run-time fixtures")**, which is **not in the diff**. I therefore cannot judge whether `tools/last-good-scripts-test`'s credential/redaction fixtures are built at run time; the only evidence in the packet about fixtures at rest is indirect (see G2-I-01, and § 6). This gap should be surfaced to the orchestrator.

Rule files embedded: `engineering-practices.md`, `upgrade-and-install.md`, `fork-workflow.md`, `generic-x64-vm-testing.md`. Rule files the diff edits but which were **not** embedded in full: `es-player-text.md`, `rclone-cloud-sync.md`. Not embedded at all: `es-ui-style-guide.md`, `packaging-and-patches.md`. For the two edited-but-unembedded files I judge only the hunks; for the two absent files I make no claim.

The diff excludes `docs/`, so no register row, work-log line, forward audit, punch list or sweep report is in the packet. Every "the stream fixed X" claim referenced below is therefore judged only against what the diff itself shows.

---

## 1. Per-commit verdicts

| # | Commit | Verdict | Basis |
|---|---|---|---|
| 1 | `cdd8f1e63c` docs: buttons by position; the sign-in window is the one browser | **sound in part** | The two hunks say something internally consistent and one is corroborated inside the packet (claims.txt: "the transfer page's footer no longer names a console letter"). The `rclone-cloud-sync.md` hunk now says the device *has* a browser (the sign-in window) while the same paragraph still says a computer is needed for "rclone's OAuth `authorize` step" — unreconciled. "South"/"east" as fixed positions is a claim about the pad layout that nothing in the packet supports (`es-ui-style-guide.md` not embedded). |
| 2 | `6e7e2551cc` docs: the streams' whys as register rows | **sound in part** | Records new player words as "built with the proposed words". Two concerns inside the hunk: `…MISSING FROM THIS BUILD.` is developer vocabulary on a player screen (G2-I-15); the new stamp shape `69 gaps` is introduced while the same file's outcome table still routes exit 69 unconditionally to `SKIPPED` (G2-I-08). |
| 3 | `59135a1dd7` docs, lint: seat-keyed verification check; cloud-sync rule brought current | **sound in part** | The lint's stated mechanism (key by `(seat, id)`, not id) is implemented and would have caught blindspot 66 as described. But the check vanishes silently when its headings/columns are absent, credits seats by substring, and scans to end-of-file (G2-I-06, G2-I-10). The rule text contradicts itself on `--delete-excluded` within the same commit (G2-I-13) and documents `CONTENT_REMOTE` written empty meaning the remote's root (G2-I-09). |
| 4 | `4e858bebe8` ES pin `7eae8ed…` → `c0f4f4da…` | **sound as a pin; content unjudgeable** | Mechanism is the hash; `PKG_GIT_CLONE_BRANCH` unchanged. Nothing in the packet shows what the ES range contains or whether the ES commits named in claims.txt (`39d5a9d6d`, `5a7afc4ca`, `52ba93160`) are ancestors of this hash. No `Already written:` answer for anything the ES side writes (rotation records, plan files) is in the packet. |
| 5 | `6f9d43a467` rocknix: install the bootloader updater only where the device ships one | **sound** | `if find_file_path …; then cp …; fi` returns 0 when the condition is false, where `a && b` as the function's last statement returned `a`'s failure — the comment's diagnosis is correct and the mechanism is the one the subject names. Two quibbles (G2-I-14): the retained `# Always install the update script` comment now says the opposite of the code, and the skip is silent for every device, not only the one without an updater. |
| 6 | `9e104c65f3` .githooks: a pre-commit scan with the push guard's patterns | **sound in part; does not fully fail closed** | Refuses a commit whose *index* diff adds a pattern-matching line — the mechanism is real (`git diff --cached -U0` → added lines → `grep -E`). But (a) the pipeline's status is `head`'s, so a failing `git diff` yields an empty `hits` and `exit 0` (G2-I-03); (b) the grep runs over `path: +line`, so a file whose *name* matches a pattern is refused on every line — the exact false positive the pre-push fixed on 2026-09-25 (G2-I-02). The "missing patterns file" case was fail-open-by-accident here (empty regex matches all → refuses; empty diff → allows) and is properly closed in commit 10. |
| 7 | `04b5f66d92` .githooks: an audit packet's diff copy is not scanned twice | **not sound** | Removes a credential-guard's coverage from a pushed path by name, on a justification ("a range the guards have already read") that no code checks and that the hook's own comment shows is false for this round's workflow (streams commit in *unpushed* worktrees; the range was *refused*, not "read and allowed") — G2-I-01. The two hooks' exemption patterns also differ in breadth (G2-I-12). |
| 8 | `78f147f762` vm-qa: launch the scripts suite with SIGINT deliverable; claims | **sound in part** | The wrapper does what its comment says: a POSIX shell cannot reset a signal ignored at entry, Python's `signal.signal(SIGINT, SIG_DFL)` can, and `os.execv` carries dispositions across. It also does something the comment does not say: Python sets SIGPIPE (and SIGXFSZ) to `SIG_IGN` at interpreter start and `os.execv` carries *those* across too, so the harness now runs with SIGPIPE ignored under vm-qa and not when run by hand (G2-I-04). The claims are written after run 68 rather than before it, and one box is 820×210 px (G2-I-11). |
| 9 | `a9c624f551` lint: keys `G-stream-NN` ids | **not sound** | Three of the four places the `F-` prefix appears were widened to `[FG]`; the fourth, `line.startswith("- **F-")`, was not. A `- **G-…**` bullet is never scanned, so any Critical/High `G-` row in `need` can only be satisfied by a `###` heading (G2-I-05). Direction: a false FAIL, not a false pass. |
| 10 | `380cbf7dc4` githooks: refuse when secret-patterns is missing | **sound; fails closed** | `[ -n "${SECRET_PATTERNS:-}" ] || { …; exit 1; }` after the `.`; a missing, empty or unparseable file refuses every commit and every push, with a message that names the cause. Only residue: an exported `SECRET_PATTERNS` in the caller's environment would satisfy the test when the file is missing — improbable, noted for completeness. |
| 11 | `1edb7f5d73` vm-qa: rotation fixture `from=checked-launch`; es-player-text follows E2 | **sound in part** | The es-player-text hunks are coherent (the match sentence correction follows D-CLOUD-023 as cited; "no TRY AGAIN for a match" follows from "the same command again is always refused"). The fixture change alters the marker value the harness seeds; the rule that explains the marker (`upgrade-and-install.md`, edited two commits later) still names `own-launch`, and the packet holds no `Already written:` answer for records devices already carry; the fixture's early-return is keyed on a PNG, not on the rotation file (G2-I-07). |
| 12 | `79bcaf55a6` ES pin `c0f4f4da…` → `b05aa706…` | **sound as a pin; content unjudgeable** | As #4. No claims.txt line accompanies it; if it changed a walked screen, the next frame-diff will report an unclaimed box (safe direction). |
| 13 | `74af928b3c` upgrade-and-install on D-CLOUD-102 | **sound in part** | The replacement bullet is consistent with the harness facts in `generic-x64-vm-testing.md` (per-device `cloud_device_id`, sequential pair fixtures, "one guest cannot make a conflict") and with the retained "interruption is the normal case" bullet. Its claim about code ("reads the cloud's state before every step") is unverifiable here. The same file's `from=own-launch` example is now stale against commit 11 (G2-I-07). |
| 14 | `1b0d233657` ES pin `b05aa706…` → `87b182fb…` | **sound as a pin; content unjudgeable** | As #12. |

---

## 2. The five rule edits — true of the code in this round, as far as the packet shows?

**`.claude/rules/es-player-text.md`** (commits 1, 2, 11; hunks only).
- *Buttons by position*: corroborated once (claims.txt line for `run-transfer/07-transfer-running.png`: "no longer names a console letter"). The specific positions "confirm = south, back = east" are unsupported by anything embedded.
- *The sign-in window is the only browser*: depends on `cloud_oauth` (#228), outside the packet.
- *The new whys*: the text says they were "built with the proposed words"; no script or ES source is in the packet. Two of the words are questionable against the file's own rules (G2-I-08, G2-I-15).
- *Match sentence* (`YOUR CLOUD STILL HAS THEM` removed): the reasoning cites D-CLOUD-023 correctly as far as the hunk shows; whether the ES card was changed to match (E2, ES pin 12) is not in the packet.
- *TRY AGAIN on the help bar; none for a match*: internally consistent with `SOMETHING CHANGED SINCE YOU CHECKED`; the ES side is outside the packet.

**`.claude/rules/rclone-cloud-sync.md`** (commits 1, 3; hunks only).
- The `--delete-excluded` paragraph now says the flag is stripped unconditionally, while the paragraph at `@@ -182,8 +192,12 @@` in the *same commit* still describes phase 1 as "syncs `SAVES_REMOTE` with `--delete-excluded` … a nested path is deleted there" — G2-I-13.
- The "quiet behaviour" section (`.capture.lock` bounded at 5 s; `restore-tree-clean`; `.cloud_sync-rules-user-first-applied`; conf never sourced with a command in it) describes markers and locks whose readers/writers are all outside the packet; I can say only that the described fail directions are the right ones (a missing `restore-tree-clean` forces a sweep; a cut-short rules file is never installed) and that two questions are unanswered by the text: what happens when the 5 s capture-lock bound is hit (proceed or abort?), and whether every writer to the saves tree clears `restore-tree-clean` or only `cloud_restore`.
- `CONTENT_REMOTE` "written empty, the remote's root" — G2-I-09.

**`.claude/rules/engineering-practices.md`** (commit 6; Source 2 is the post-edit file).
- The paragraph claims (i) the harness fixtures are built at run time and "the file at rest carries no line the guard would match", (ii) "`.githooks/pre-commit` (both repositories) now refuses such a line … with the same patterns the push guard uses". (i) is unverifiable: `b31bf53771` is not in the packet. (ii) is true of *this* repository's hook as far as the diff shows, minus two things the paragraph omits: the pre-commit exempts `docs/audits/*/seats/*.diff` (commit 7), and the pre-push comment in commit 7 records that a packet "carried the ES guard's own FAKE= fixture" — i.e. a fixture line the ES repository keeps at rest and this repository's patterns refuse. So the two repositories' scanners demonstrably disagree, and the rule's "both repositories … same patterns" reads as stronger than the packet supports. The ES repository's hooks are outside the packet.

**`.claude/rules/fork-workflow.md`** (commit 6; Source 4 is the post-edit file).
- The new paragraph is true of `.githooks/pre-commit` except that it does not mention the exemption. Three retained sentences are now stale: "shaped like credentials (`SECRET_PATTERNS` in the hook: …)" — the patterns moved to `.githooks/secret-patterns`; "`ls "$(git config core.hooksPath)"` must list `pre-push`" — it must now also list `pre-commit` and `secret-patterns`; and the personal-paths prose says `.githooks/` is personal (fine — the new file is covered by the directory), but `PERSONAL_PATTERNS` itself is not in the diff to confirm.

**`.claude/rules/upgrade-and-install.md`** (commit 13; Source 3 is the post-edit file).
- The D-CLOUD-102 bullet: consistent with the register decision as cited and with Source 5's device-id facts; the code claim is unverifiable. The file's own worked example under "Every fix answers what was already written" still says "a record without `from=own-launch` is not trusted", while commit 11 seeds `from=checked-launch` — the rule no longer describes what the harness writes (G2-I-07).

---

## 3. Findings

### G2-I-01: The audit-packet exemption removes the credential scan from a pushed path on a justification nothing checks
- **Severity:** High
- **Category:** New defect introduced by a fix (guard weakened by construction)
- **Where:** `seats/I.diff`, commit `04b5f66d92`: `.githooks/pre-commit` hunk `@@ -9,9 +9,14 @@` (`| grep -v -E '^docs/audits/[^/:]+/seats/[^/:]+\.diff: '`); `.githooks/pre-push` hunks `@@ -207,6 +207,7 @@` (`case "$f" in docs/audits/*/seats/*.diff) continue ;; esac`) and `@@ -216,9 +217,14 @@` (`| grep -v -E "^[^${tab}]*${tab}docs/audits/[^/${tab}]+/seats/[^/${tab}]+\.diff${tab}"`).
- **What:** Both hooks now skip every `.diff` under `docs/audits/*/seats/` by path. The comment's justification is that such a file "is a verbatim copy of a range the guards have already read line by line". No code checks that: not that the commits in the packet are reachable from any pushed ref, not that the copy is verbatim, not that the copied range passed. The exemption is keyed on a path name alone, in a repository the rules describe as public ("GitHub's own push protection is on for both public repos", `fork-workflow.md`).
- **Failure scenario:** (a) The Facilitator (or a person) builds `seats/X.diff` from fix-stream branches that live in worktrees and have never been pushed — which is exactly how this round worked (`pre-commit` comment in commit 6: "eight fix streams committed in worktrees"). One branch carries a real value (a device's `rclone.conf` `token =` line pasted into a script comment; a `devpassword=` in a scraper fixture). The packet is committed and pushed: the pre-commit exempts it, the pre-push exempts it, and the value is in the public fork's history while the branch it came from would have been refused. (b) The three literal fixtures the rule paragraph in commit 6 describes: any packet built from that stream *before* the history rewrite carried them, and under this exemption the packet pushes cleanly — the rewrite cost the rule was written to avoid is avoided by not looking.
- **Evidence:** The comment in the same commit refutes its own premise: the range the packet carried had been *refused* twice ("it carried the ES guard's own FAKE= fixture and refused the push twice"), so "already read" did not mean "already allowed"; the resolution chosen was to stop reading the copy rather than to remove the line from the copy. I looked for a compensating check — a `git merge-base --is-ancestor` on each `#### commit <hash>` in the packet, a hash of the copied range, a narrower exemption (e.g. only the `printf`-fragment fixture lines) — and found none in either hook. I looked for the rule texts naming the exemption (`fork-workflow.md` § Safety net, `engineering-practices.md` § Guards must fail closed, both post-edit) and found neither does: both still say the pre-commit "refuses a commit that would add a credential-shaped line", unqualified. `engineering-practices.md` § Guards must fail closed: "Each defaults to 'proceed' when its own machinery breaks … precisely backwards."

### G2-I-02: The pre-commit scans the file's path together with the added line, re-introducing the false positive the pre-push fixed
- **Severity:** Medium
- **Category:** New defect introduced by a fix (regression of a documented fix; fail-closed direction)
- **Where:** `seats/I.diff`, commit `9e104c65f3`, `.githooks/pre-commit`: `awk '… /^\+/{print f ": " $0}'` followed by `| grep -E "${SECRET_PATTERNS}"`.
- **What:** The awk labels each added line as `<path>: +<content>` and grep then runs over the whole labelled line, so a match anywhere in the *path* is a hit. The pre-push in the same file family anchors its pattern past the path for exactly this reason: `grep -E "^[^${tab}]*${tab}[^${tab}]*${tab}.*(${SECRET_PATTERNS})"`, with the comment (retained and extended in commit 7) "A file's NAME is not a credential: on 2026-09-25 merging upstream brought a kernel patch named `…mmc-ma<credential-shaped example redacted>.patch`, its 'sk-…' tail matched the OpenAI key shape, and every line of the file was refused for its name."
- **Failure scenario:** Resolving a conflict after `git merge upstream/next` and running `git commit` (which does run `pre-commit`) with that kernel patch in the index: `sk-` followed by `DATA0-when-updating-the-clock-on-H616-eMMC` (42 characters, all in `[A-Za-z0-9_-]`) satisfies `sk-[A-Za-z0-9_-]{24,}`; every added line of the patch is refused, and the message shows `[REDACTED]-eMMC.patch: +…` because the `sed` redacts the path too. The committer reaches for `--no-verify`, which is how a guard is trained out of use.
- **Evidence:** The two greps quoted above, in the same diff. What would have refuted it: an awk that prints the label to a separate field the grep excludes (a tab-separated form like the pre-push's), or a `grep -v` on the path before the pattern grep. Neither is present.

### G2-I-03: The pre-commit pipeline's status is `head`'s, so a failing producer allows the commit
- **Severity:** Medium
- **Category:** Guard fails open on its own machinery
- **Where:** `seats/I.diff`, commit `9e104c65f3`, `.githooks/pre-commit`: `hits="$(git diff --cached -U0 --no-color --diff-filter=ACMRT | awk … | grep -E … | sed … | head -5 || true)"` then `if [ -n "${hits}" ]; then … exit 1; fi; exit 0`.
- **What:** No `set -o pipefail`; the `|| true` applies to the pipeline whose status is already `head`'s (0). If `git diff --cached` exits non-zero and prints nothing on stdout — an index lock held by another process in a shared worktree tree, a corrupt object, `diff.external` configured (the hook does not pass `--no-ext-diff`, so an external diff driver produces output with no `+++ b/` / `+` lines) — `hits` is empty and the hook exits 0.
- **Failure scenario:** A committer's global git config sets `diff.external` (common with GUI diff tools). Every commit's staged changes are rendered by the external tool; the awk sees no `+` lines; the hook allows every commit, including the literal fixtures it was written to refuse. The pre-push then refuses at push time — the cost the pre-commit exists to avoid.
- **Evidence:** The pipeline as quoted; `engineering-practices.md` § Guards must fail closed, first bullet: "A pipeline's status is its **last** command's … a producer that exits 1 … is discarded and the guard never fires." What would have refuted it: `set -o pipefail` with `PIPESTATUS[0]` checked, or `--no-ext-diff`, or a positive assertion that the diff was read (e.g. count of `+++` headers ≥ number of staged files). None present. Note the fail-closed sibling in commit 10 handles the *patterns* being missing but not the *diff* being missing.

### G2-I-04: The vm-qa wrapper resets SIGINT and silently leaves SIGPIPE/SIGXFSZ ignored
- **Severity:** Medium
- **Category:** New behaviour the fix's own comment does not name (runner-vs-by-hand divergence)
- **Where:** `seats/I.diff`, commit `78f147f762`, `tools/vm-qa` hunk `@@ -138,7 +138,11 @@`: `python3 -c 'import os, signal, sys; signal.signal(signal.SIGINT, signal.SIG_DFL); os.execv(sys.argv[1], sys.argv[1:])' "$ROOT/tools/last-good-scripts-test"`.
- **What:** The comment is right that a child shell cannot undo an ignored SIGINT and Python can. But the CPython interpreter, at startup, sets SIGPIPE, SIGXFSZ (and SIGXFZ where defined) to `SIG_IGN` so that broken pipes surface as exceptions; `os.execv` does **not** restore them (that is what `subprocess`'s `restore_signals=True` exists for, and `os.exec*` has no equivalent). So the harness now starts under vm-qa with SIGPIPE ignored — a disposition it does not have when the maintainer runs `tools/last-good-scripts-test` by hand.
- **Failure scenario:** Any harness construct of the form `producer | head -n1` or `producer | grep -q …` where `producer` is a shell loop (`while :; do echo …; done`) or a program that does not check write errors: with SIGPIPE default the producer dies when the reader closes; with SIGPIPE ignored it gets `EPIPE`, bash's `echo` reports "write error: Broken pipe" and *the loop continues forever* — a suite that passes by hand hangs (or, under a timeout, fails) only under the runner. Less severely, every producer in such a pipeline now writes a `Broken pipe` line into `scripts.log` and exits 1 instead of 141, changing `PIPESTATUS` where the harness reads it. This is the "runner's own guest" trap of `engineering-practices.md` ("a suite is not wired in until it has been seen to FAIL once, on the runner") with the direction reversed.
- **Evidence:** The `-c` script resets exactly one signal. What would have refuted it: `signal.signal(signal.SIGPIPE, signal.SIG_DFL)` beside the SIGINT line (and SIGXFSZ), or a shell `trap - PIPE` documented as unnecessary. The harness body is outside the packet, so I cannot say whether it contains a vulnerable pipeline; the divergence itself is certain from the wrapper alone.

### G2-I-05: The lint's `[FG]` widening missed the fourth `F-` literal, so `G-` bullets are never scanned
- **Severity:** Medium
- **Category:** Incomplete change to a check (false FAIL direction)
- **Where:** `seats/I.diff`, commit `a9c624f551`, `tools/lint-audit-artifacts` hunk `@@ -98,18 +98,18 @@`: three regexes changed to `[FG]-[A-Z][A-Z0-9]*-\d+`; the unchanged context line `if not (line.startswith("### ") or line.startswith("- **F-")): continue`.
- **What:** `need` now admits `(seat, G-…)` pairs from the index, but the `have` loop still discards every bullet that does not start with `- **F-`. A verification entry written as `- **G-A-03** (gpt, …)` is skipped before its id is read.
- **Failure scenario:** A forward audit whose index has one Critical `G-` row and whose Verification section answers it as a `- **G-…**` bullet: the lint reports `02 § Verification has no entry for G-… (seat)` and the artefacts fail lint although the entry exists. The only formats that satisfy the check for `G-` ids are a `### G-…` heading with the seat in parentheses, or a heading-context section — neither of which the docstring describes.
- **Evidence:** The unchanged `startswith("- **F-")` sits between two changed lines in the same hunk. Direction: cannot produce a false pass. Whether it fired on this round's `02-forward-audit.md` is not in the packet (docs excluded).

### G2-I-06: The seat-keyed verification check disappears without a word when its sections or columns are not where it expects
- **Severity:** Medium
- **Category:** Guard cannot run → reports nothing (silent pass)
- **Where:** `seats/I.diff`, commit `59135a1dd7`, `tools/lint-audit-artifacts` hunk `@@ -82,6 +82,48 @@`: `fi, vi = forward.find("## Findings index"), forward.find("## Verification")`; `if fi >= 0 and vi > fi:`; the row filter `c[3] in ("Critical","High") and re.match(r"F-[A-Z]+-\d+$", c[2]) and c[1] in ("claude","gpt")`; `if need and not short: ok(…)`; `index, ver = forward[fi:vi], forward[vi:]`.
- **What:** Four ways the check produces neither `ok` nor `bad`: `02-forward-audit.md` missing (`forward = ""`); either heading absent or spelled differently (`## Findings Index`, `## Verification so far`); the headings in the other order; the table's columns not laid out as `| bucket | seat | id | severity |` (or an id written `**F-CS-02**`), which empties `need` and skips the `ok`. In each case the lint is silent about a check it did not run. Separately, `ver = forward[vi:]` runs to end of file, so an `- **F-…**` bullet in any later section (an appendix, "findings not verified") counts as a verification entry.
- **Failure scenario:** The next audit's template renames the section to `## Verification (so far)` or adds a "bucket" column before "seat". Every Critical/High row loses its seat-keyed check; the lint prints its other `ok` lines and exits 0; blindspot 66 recurs with the guard nominally in place.
- **Evidence:** No `bad(...)` on the `else` of `if fi >= 0 and vi > fi`, none when `need` is empty while the index contains rows whose fourth column reads Critical/High. `engineering-practices.md` § Guards must fail closed: "A check that cannot run has not passed." What would have refuted it: a `bad` naming the missing heading, and a `bad` when the index has Critical/High cells that the row parser did not admit.

### G2-I-07: The rotation fixture's marker changed to `from=checked-launch` with the explaining rule still naming `own-launch`, no answer for records already written, and an early-return that keeps the old value on a seeded guest
- **Severity:** Medium
- **Category:** Change to what is written with no answer for what earlier builds already wrote; rule/harness drift
- **Where:** `seats/I.diff`, commit `1edb7f5d73`, `tools/vm-qa` hunk `@@ -343,7 +343,7 @@` (`printf "turns=1\nfrom=checked-launch\n"`, was `from=own-launch`) and its unchanged first line `SSH 'test -f /storage/roms/savestates/fbn/mspacman.state.auto.png' 2>/dev/null && return 0`; `upgrade-and-install.md` (Source 3, post-commit-13) § Every fix answers what was already written: "#288's answer: a record without `from=own-launch` is not trusted, the core's table stands in, the next exit rewrites it."
- **What:** The harness now seeds the value the (new) reader presumably trusts. Three things follow and none is in the packet: (1) the rule that explains the marker still names `own-launch`, so either the rule is stale or the fixture seeds a value the reader distrusts; (2) devices that ran the #288 build have written `from=own-launch` records — if the reader now trusts only `checked-launch`, every one of them is distrusted again until each game is played, which is #288's own bug shape (`upgrade-and-install.md`: "the rotation records the old reader had already written stayed wrong on the device until each game was played again"), and no `Already written:` line for it is in the packet; (3) `ensure_manager_fixture` returns before the `printf` whenever the fbn PNG exists, so a guest that already carries the fixture (`--skip-up`, a pair left up) keeps `own-launch` and the walk frames the old state.
- **Failure scenario:** Run 69 on a pair brought up for run 68: the PNG is present, the rotation file still says `own-launch`, the manager tile framed is whatever the reader does with a distrusted record; a frame-diff box appears (or is masked by an existing claim), and the fixture change is reported as "no change".
- **Evidence:** The hunk and the early return are adjacent in the diff. I looked for a change to the return condition (e.g. `grep -q from=checked-launch …Bobl.rotation`) and for an `Already written:` line in any embedded rule and found neither. The reader (launcher script / ES) is outside the packet.

### G2-I-08: A `69 gaps` stamp shape is introduced while the outcome table still maps exit 69 unconditionally to `SKIPPED`
- **Severity:** Medium
- **Category:** Seam between the scripts' stamp and the interface's card; rule-of-record inconsistency
- **Where:** `seats/I.diff`, commit `6e7e2551cc`, `es-player-text.md` hunk `@@ -272,7 +272,18 @@`: "the stamp why `YOU WENT OFFLINE PART-WAY THROUGH` (a run the network cut after files moved, stamped `69 gaps`)"; the unchanged table row in commit 11's hunk `@@ -237,7 +237,7 @@`: "`SKIPPED - <reason>` | only 69, 75, and the launch cancel | `SKIPPED - YOU'RE NOT ONLINE` …".
- **What:** The file now says two things about rclone's exit 69: it is always `SKIPPED - YOU'RE NOT ONLINE` (nothing moved), and, with `gaps`, it is a run that moved files and could not finish. Nothing in the packet says how the card's reader tells `69` from `69 gaps`, and the table — the specification the interface is meant to match — was not amended.
- **Failure scenario:** A saves sync moves 40 of 60 files, the link drops, the script stamps `69 gaps`. A card reader that parses the leading code shows `SKIPPED - YOU'RE NOT ONLINE` over a run that changed both sides — the "lie by omission" of `engineering-practices.md` § Fail gracefully ("a run that exits 0 after moving nothing" has this shape's mirror image: a run that moved things reported as having done nothing).
- **Evidence:** Both hunks in the same file, same packet. What would have refuted it: the table row amended to "69 alone" with a `COULDN'T FINISH - YOU WENT OFFLINE PART-WAY THROUGH` row beside it, or a sentence naming the reader's rule. Neither present. The scripts and `CloudText` are outside the packet.

### G2-I-09: `CONTENT_REMOTE` is documented as written empty, meaning the remote's root
- **Severity:** Medium
- **Category:** An empty value with a permissive meaning (fail-open shape); cannot be verified here
- **Where:** `seats/I.diff`, commit `59135a1dd7`, `rclone-cloud-sync.md` hunk `@@ -182,8 +192,12 @@`: "`cloud_sync_helper` derives no content folder for a top-level saves folder on an upgraded config (`CONTENT_REMOTE` is written empty, the remote's root, for the owner to set)".
- **What:** The rule records that an upgraded device whose saves folder is at the top level gets `CONTENT_REMOTE=""` and that an empty value denotes the root of the remote. Whether every content script refuses to run with an empty `CONTENT_REMOTE` is not shown. `generic-x64-vm-testing.md` § The three shapes a remote path can have adds a second problem: on S3 the first path component is the bucket and on SMB the share, so an empty path is not a legal target at all there.
- **Failure scenario:** An upgraded device with `SAVES_REMOTE=/` (top level) opens the content page; a content backup runs with `CONTENT_REMOTE=""` → `rclone copy /storage/roms/... remote:` — the library lands in the root of the owner's Dropbox beside their own files, which `upgrade-and-install.md` § Never move what you did not put there calls "unforgivable and entirely avoidable". On S3 the same run fails with a bucket error and, depending on the script, a `COMPLETED` over nothing.
- **Evidence:** The sentence as written; the rule says "for the owner to set" but not "and refused until set". What would have refuted it: a sentence in the same hunk saying the content scripts refuse an empty `CONTENT_REMOTE` with a named why. `cloud_sync_helper`, `cloud_content_*` are outside the packet — one visit to `cloud_content_backup`'s handling of an empty `CONTENT_REMOTE` settles it.

### G2-I-10: The lint credits a seat by substring in the parenthesis
- **Severity:** Low
- **Category:** Substring match where an exact answer exists
- **Where:** `seats/I.diff`, commit `59135a1dd7`, `tools/lint-audit-artifacts`: `seats = [x for x in ("claude", "gpt") if x in par]`.
- **What:** Any parenthesis that mentions the other seat for contrast credits it.
- **Failure scenario:** Under `### 3-rclone-setup (claude):`, the entry `- **F-CS-02** (claude; gpt's F-CS-02 is a different defect, unverified)` puts `("gpt","F-CS-02")` into `have` — the blindspot-66 pair, re-credited through the check written to stop it.
- **Evidence:** The list comprehension; the heading-context fallback shows the author had a precise source for the seat and used the substring first. What would have refuted it: a regex on the first token of the parenthesis (`^(claude|gpt|both seats|claude and gpt)\b`).

### G2-I-11: Claims written after the run, one of them 820×210 px, and two later ES bumps with no claims
- **Severity:** Low
- **Category:** Process rule inverted (the check's blind spots grow after the fact)
- **Where:** `seats/I.diff`, commit `78f147f762`, `tools/vm-walks/claims.txt`: header "The #307 fix build (4234be0b6b, vm-qa run 68)"; line `d72084ccad continue-to-systems/05-systems-page.png 230 470 1050 680 #308` (and the two `run-transfer-frames` copies of the same box). Commits `79bcaf55a6`, `1b0d233657` touch no claims.
- **What:** `generic-x64-vm-testing.md` § The frames are compared: "Claim before you run … An unclaimed box after the fact is the finding, not an inconvenience." These eight claims name a run that had already happened. Each is attributed to an ES commit and a finding, which is the right content; the order is the wrong one, and the systems-page box covers most of the list ("the rows below it shift down"), so any other change in those rows on that screen is now unreported.
- **Failure scenario:** ES pin 12 or 14 truncates a system label on the systems page; the box is inside `230 470 1050 680`; frame-diff passes.
- **Evidence:** The header line's tense and the rectangle sizes. A narrower alternative (one claim per shifted row) would have refuted the breadth concern; not present.

### G2-I-12: The two hooks' exemption patterns differ in breadth, and both labellers inherit the previous file's name on a quoted path
- **Severity:** Low
- **Category:** Reader and writer of one contract disagree; label spoof by inheritance
- **Where:** `seats/I.diff`, commit `04b5f66d92`: pre-commit `'^docs/audits/[^/:]+/seats/[^/:]+\.diff: '` (one segment each) vs pre-push `case "$f" in docs/audits/*/seats/*.diff)` (bash `case` `*` matches `/`, so any depth) vs pre-push awk grep `docs/audits/[^/${tab}]+/seats/[^/${tab}]+\.diff` (one segment). Both awks set `f` only on `+++ b/…`; a path git quotes (`+++ "b/…"` for non-ASCII, quotes, tabs) leaves `f` at the previous file's name.
- **What:** `docs/audits/x/seats/deep/y.diff` is scanned at commit and skipped by the pre-push's first scan — safe direction. The quoted-path case is the unsafe one: a file whose header follows an exempted packet in diff order inherits the packet's label and is exempted by the pre-commit's `grep -v` and the pre-push's tab-grep.
- **Failure scenario:** `docs/audits/<a>/seats/I.diff` and `docs/audits/<a>/seats/Ñotes.md` (quoted by `core.quotePath`) staged together; the notes file's added lines are labelled `…/I.diff: +…` and skipped.
- **Evidence:** The awk programs in both hooks and the three exemption expressions, all in commit 7. What would have refuted it: an awk rule for `/^\+\+\+ "/` (reset `f` to a non-exempt sentinel) and a single shared exemption expression sourced from `secret-patterns`.

### G2-I-13: `rclone-cloud-sync.md` contradicts itself on `--delete-excluded` within one commit, and the nesting warning is described as firing where the hazard it names cannot occur
- **Severity:** Low
- **Category:** Rule of record inconsistent with itself
- **Where:** `seats/I.diff`, commit `59135a1dd7`, `rclone-cloud-sync.md` hunk `@@ -155,6 +155,16 @@` ("the shipped `RCLONEOPTS` no longer carries `--delete-excluded` at all, and `cloud_backup` strips it … whatever the file says") vs the retained lead of hunk `@@ -182,8 +192,12 @@` ("syncs `SAVES_REMOTE` with `--delete-excluded` and the archive is an excluded file, so a nested path is deleted there … a `--saves-only` run … deletes the archives and puts nothing back").
- **What:** The second paragraph still describes the deletion mechanism the first says is gone; only its last sentence was edited. Under `copy` with the flag stripped (the shipped default the same hunk describes), a nested settings folder is not deleted by phase 1, so the warning that now "always logs, and shows on screen on deliberate runs" fires over a hazard that needs `sync` — which "no menu offers". Not wrong to warn, but the rule should say what the warning now protects against (a hand-edited `sync`), or a reader will look for a deletion that cannot happen.
- **Evidence:** The two hunks. Whether the code still has a deleting path is outside the packet.

### G2-I-14: The recipe's retained comment says the opposite of the code, and the skip is silent for every device
- **Severity:** Low
- **Category:** A constraint not beside the thing it constrains; a build-time absence made invisible
- **Where:** `seats/I.diff`, commit `6f9d43a467`, `projects/ROCKNIX/packages/rocknix/package.mk` hunk `@@ -48,7 +48,12 @@`: retained `# Always install the update script` directly above the new `if find_file_path bootloader/update.sh; then … fi`.
- **What:** The comment now lies. And the `&&` form, whatever its intent, made a missing `update.sh` a build failure; the `if` makes it a silent skip for *every* device, while the subject says "only where the device ships one" — the recipe has no notion of which devices ship one, only of which have the file today.
- **Failure scenario:** A rename or a moved `bootloader/` directory for a device that does have an in-place updater; the build passes; the image ships an empty `/usr/share/bootloader/` (the `mkdir -p` still runs); the on-device update flow finds nothing. Whether anything consumes the path's presence (a menu row, a post-update step) is outside the packet.
- **Evidence:** The hunk. What would have refuted the second point: an `echo`/`WARN` line in the `else` branch naming the device, or a per-device declaration gating the copy. `packaging-and-patches.md` is not embedded.

### G2-I-15: `THIS BUILD` in a player-visible why
- **Severity:** Low
- **Category:** Player-visible word outside the register's own anti-patterns
- **Where:** `seats/I.diff`, commit `6e7e2551cc`, `es-player-text.md` hunk `@@ -272,7 +272,18 @@`: `THIS DEVICE CAN'T RESTORE SETTINGS. SOMETHING IT NEEDS IS MISSING FROM THIS BUILD.`
- **What:** "Build" is a developer concept; the same file's § Anti-patterns forbids "Developer/QA concepts in product text", and `engineering-practices.md` § Fail gracefully says the message "is for the player, not the developer". The hunk records the word as "built with the proposed words, and put to the maintainer (D-UI-112)" — so the decision is open, but the rule file now carries the wording as shipped.
- **Failure scenario:** A player on an image missing `unzip` (the case `engineering-practices.md` § Verify the artifact describes) reads "THIS BUILD" and has no action; `SOMETHING THIS DEVICE NEEDS IS MISSING. UPDATE IT AND TRY AGAIN.` would give one.
- **Evidence:** The hunk; the anti-patterns list two hunks later in commit 1's diff of the same file.

---

## 4. Sweep rows — spot checks against the diff

There is no report or items file in the packet, so "the rows the report says it fixed" are the rows the diff itself names. Checked:

| Row | Where the diff claims it | What the packet can verify |
|---|---|---|
| **#307 PL-073** (GENERIC_X64 ships no updater; install failed) | commit `6f9d43a467` | **Verified** in the packet: the `if` form returns 0 when the file is absent; the mechanism named in the comment is correct. The deleted `update.sh` itself and any consumer of the path are not in the packet (G2-I-14). |
| **#308 F-CS-17** (nesting warning never fired) | `rclone-cloud-sync.md` hunk in `59135a1dd7` | **Rule text only.** The cause given ("fired only while the flag was present, which the strip removed a few lines earlier") is coherent; `cloud_backup` is not in the packet. The rule's own retained paragraph undercuts what the warning now guards (G2-I-13). |
| **#308 F-ES-14** (CHANGE CLOUD FOLDER's line) | claims.txt lines 1–2, `39d5a9d6d` | **A claim line, not a verification.** A claim tells frame-diff to accept a box; it does not show the words in it. The ES commit is outside the packet. |
| **#308 F-RA-14 / F-CS-07** (footer names a console letter) | claims.txt lines 3–4, `5a7afc4ca`; rule edit `cdd8f1e63c` | As above; the rule edit and the claim agree with each other, which is the only cross-check the packet allows. |
| **8a (gpt)** (PICO-8's 0-byte file read as nothing to move) | claims.txt lines 5–8, `52ba93160` | As above. The claim's own words ("`1 FILE NOT YET IN YOUR CLOUD`", "`ITEM 1 OF 5`") are player-visible strings I cannot check against the full vocabulary file (not embedded). |
| **#307 PL-021** (prune by name then count), **PL-015** (nesting/derivation), **PL-020** (rules merge), **PL-001** (match plan used up) | rule hunks in `59135a1dd7`, `1edb7f5d73` | **Rule text only**; no script in the packet. PL-015's text raises G2-I-09. |

**Withdrawn rows:** none are named in the packet (the sweep report is under `docs/`, excluded). I can judge no withdrawal reason.

---

## 5. Seams

- **Shared harness (`tools/vm-qa`, `tools/last-good-scripts-test`, `claims.txt`, frame-diff baseline).** vm-qa assumes `last-good-scripts-test` is an executable with a shebang (`os.execv` will not run a non-executable file — fail-closed, the suite FAILs) and that its cancel cases rely on SIGINT reaching children; the harness now inherits SIGPIPE ignored (G2-I-04). vm-qa's fixture assumes the rotation reader trusts `from=checked-launch` (G2-I-07); the reader is another stream's. claims.txt assumes ES `39d5a9d6d`/`5a7afc4ca`/`52ba93160` are in pin `c0f4f4da…`; nothing in the packet shows the ancestry. `run_suite`'s handling of a multi-word command is outside the visible diff.
- **Cloud scripts' outcome words read by the interface.** Commit 2 adds whys the scripts write and the card shows; the `69 gaps` stamp (G2-I-08) is the one place the two sides' contract, as the rule records it, does not agree with itself. Commit 11's match sentence and the removal of the match's TRY AGAIN are the interface side (E2); the scripts' `SOMETHING CHANGED SINCE YOU CHECKED` is the scripts side; they agree in the text.
- **Proxy stamps read by the cards; wifictl's output read by the picker.** Nothing in this packet touches either (the "CONNECTED on the map" change in commit 1's subject is under `docs/`, excluded). No claim made.
- **Settings lock shared by scripts and interface.** Not touched here. Commit 3's rule text introduces two new script-side artefacts (`/storage/.cache/cloud_sync/.capture.lock`, `restore-tree-clean`); whether the interface reads or clears either, and what the 5 s bound does on expiry, is outside the packet.
- **Hooks ↔ the Facilitator's packets.** Commit 7 creates a contract — "a `seats/*.diff` is a verbatim copy of an already-guarded range" — that the Facilitator must honour and no code enforces (G2-I-01). This packet is itself an instance of the exempted class.
- **`.githooks/secret-patterns` ↔ both hooks ↔ the ES repository's hooks.** Within this repo the two hooks read one definition (sound). Across repos they demonstrably do not: the ES guard's `FAKE=` fixture is allowed there and refused here (commit 7's pre-push comment). The rule paragraph in `engineering-practices.md` says "both repositories … the same patterns"; the packet shows that is not yet true of the fixtures.

---

## 6. Coverage boundary — what I could not judge

- **`b31bf53771`** (run-time fixtures) is not in the packet; the brief's question "are the fixtures built at run time" is unanswerable here. The one indirect datum (an ES `FAKE=` fixture at rest in the ES repo, per commit 7's comment) concerns the other repository.
- **Every script the rule edits describe** (`cloud_backup`, `cloud_restore`, `cloud_capture`, `cloud_setup`, `cloud_sync_helper`, `cloud_content_*`, `backuptool`, `cloud_oauth`), the **ES commits** behind three pins, `CloudText`/the cards, the rotation reader, `run_suite`'s body, `tools/frame-diff`, `tools/last-good-scripts-test`, the pre-push's producer of `$added`, `PERSONAL_PATTERNS`, GENERIC_X64's removed `update.sh` and any consumer of `/usr/share/bootloader/update.sh`.
- **The ES repository's `.githooks/`.**
- **Rule files not embedded:** `es-ui-style-guide.md` (so "confirm = south, back = east" is unjudged), `packaging-and-patches.md`, and the full text of `es-player-text.md` and `rclone-cloud-sync.md` (only hunks seen).
- **Everything under `docs/`:** register rows D-UI-112/114/115, D-CLOUD-141/142/143/146, D-WORKFLOW-058/059, D-QA-054; the work-log lines that would show each new guard's observed positive (`engineering-practices.md`: "the positive is recorded where the guard is wired" — for the pre-commit hook, the lint check and the vm-qa wrapper no positive is in the packet); the forward audit the lint runs on; the sweep report and any withdrawals.
- **Runtime facts:** whether `python3` is on the runner host (inferred only from `lint-audit-artifacts` being Python), whether the pre-commit hook has fired once, whether `core.hooksPath` is set in the streams' worktrees.

---

## Provenance (for `corpus.provenance.json`)

```json
{
  "seat": "I",
  "read_timestamp_utc": "2026-09-28T13:57:25Z",
  "source_file_paths": [
    "docs/audits/2026_09_28-milestone-audit-of-the-fix-round/seats/I.diff",
    ".claude/rules/engineering-practices.md",
    ".claude/rules/upgrade-and-install.md",
    ".claude/rules/fork-workflow.md",
    ".claude/rules/generic-x64-vm-testing.md"
  ],
  "source_file_hashes": [
    "4c42ba0b028c1e215dc40aa11990982bf028cfa5cd8413f8017ec0d7a3ae02c1",
    "7f1eb012edc986ee2975abacb44f1a662f2a111a6ded1a1a623a84af509eef7d",
    "d79a1084e85117ba566d23af7fbf3633c44290a6c490f9125e1fd9df061f8cfd",
    "5e10bbbf8cfb81bdb34412e54202a8310554ba677b653be636e174fca9211c3a",
    "9ae148998b481417b86d6b84f03dfff94ac47d8f1159edb2c6c17f5e7c350202"
  ],
  "hashes_verified_by": "council-facilitator@1.2.0 at embed time; not re-hashed by this seat",
  "sources_named_by_brief_but_not_embedded": [
    "commit b31bf53771 (harness run-time fixtures) — absent from seats/I.diff",
    ".claude/rules/es-player-text.md (full file; hunks only in the diff)",
    ".claude/rules/rclone-cloud-sync.md (full file; hunks only in the diff)",
    ".claude/rules/es-ui-style-guide.md",
    ".claude/rules/packaging-and-patches.md",
    "docs/** (register, work log, forward audit, sweep report — excluded by packet design)"
  ]
}
```
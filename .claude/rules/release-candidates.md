---
description: "The standard operating procedure for every release candidate: nothing behind before the cut, a clean baseline, the candidate's build, every test, play-testing on the test device, the call, the two-agent upstream audit, then the submission and builds for every test device (D-WORKFLOW-047)."
---

# Making a release candidate

*No `paths:` glob, so this file loads every session: a candidate is started
from a conversation, not from a file.*

Maintainer, 2026-09-25, after the twenty-second cut had been called the
candidate and was then found to carry three packages behind their authors'
releases and a base 56 commits behind ROCKNIX: *"We need a better process for
how we check for these sorts of things before a release candidate could be
cut. At this point, the better idea is to do the bumps and then do the release
candidate. It's easier to do that than a fast follow, especially because
Rocknix tends to want to ship on a monthly schedule."* And: *"This needs to be
our standard operating procedure for generating any release candidate. We
should make sure we document this so we don't go through this dance next
time."* (D-WORKFLOW-047, the round's own plan D-QA-049.)

A release candidate is the build that goes upstream and onto every test
device. It is made in this order, and a step starts only when the one before
it has its artifact.

## The procedure

0. **Nothing behind, before anything is built.** On the tree about to be cut:
   every package the fork introduces at its author's current release; the
   distribution's `next` level with `upstream/next`; the EmulationStation pin
   level with ROCKNIX's master; no open bug without a disposition; no failing
   checkbox; the catalog and the device facts current. Anything behind is
   brought current now -- a bump, a merge -- or accepted for this candidate
   by a register row that names it. **A bump is never a fast follow**: ROCKNIX
   ships monthly, and a candidate called with a known bump outstanding costs
   a round. `tools/rc-preflight --tree <build worktree>` (#271) is the check:
   one verdict per item, exit 1 on a finding no register row accepts, exit 2
   on an item it could not answer. An acceptance is a line in
   `docs/releases/rc-accept.txt` citing a decided row. The device facts have
   no tool yet (#270): read them by hand and say so with `--allow-unchecked
   device-facts`. Its verdict line is quoted on the round's issue and in the
   candidate's RECORD.txt. **An open bug is accepted only on a code trace
   posted on its issue** -- how it was found, in the issue's own words; the
   defect at its source, as the code was before the fix; the fix read and
   located in the candidate; every sibling call site or path hunted; and
   what reading cannot prove, named (#273; maintainer, 2026-09-25: *"at a
   minimum, do code exploration of every bug to see if we can track the
   source and validate it just that way"*). `rc-preflight` refuses an
   acceptance whose issue carries no "Code trace" comment. A fix found
   incomplete by its trace is fixed in the candidate's tree, or the
   uncovered path is named in the accepting row.
1. **A clean baseline.** The current tree built and green before the bumps,
   so that a failure after them is theirs and not the tree's
   (`device-builds.md` § After rebasing onto upstream, `tools/build-preflight`).
2. **The candidate's build**, with the bumps and merges in: GENERIC_X64 and
   H700 from one synced head, so they share a BUILD_ID.
3. **Every test passes on the VM**: `tools/vm-qa` with every suite and
   `frame-diff` against the accepted baseline; the upgrade rehearsal from the
   previous device build (`tools/vm-upgrade-rehearsal`); and each bumped
   package's own proof -- the sign-in window for webkitgtk, `tools/ra-offline-test`
   for the proxy. RECORD.txt written, the catalog regenerated.
4. **Play-testing on the test device**: staged on the RG35XX SP with the
   maintainer's yes for the copy and a second for the reboot (D-QA-011); the
   soak -- hours of play offline, then Wi-Fi back (D-QA-036) -- with its
   journal read afterwards.
5. **The call**: a comment on the round's issue naming the build, the soak's
   read and step 0's verdict; the device facts and the catalog updated in the
   same change (D-WORKFLOW-046).
6. **The full upstream audit, by two agents**: the code auditor at milestone
   tier over everything going upstream -- the distribution's diff against
   `upstream/next` and the EmulationStation fork's against ROCKNIX's master --
   by Fable 5.1 and GPT-6 Astra (D-QA-048), both through the council's
   Facilitator on OpenRouter (D-WORKFLOW-049: every council and audit seat
   goes that way; the native harness's Fable is for the session's own work).
   The key is `~/.config/council/env`, sourced before the Facilitator runs;
   a probe of each seat first, its provenance naming the served model. Its
   punch list is
   resolved (Phase 7) before step 7; a fix that changes the build goes back to
   step 2, and the soak is re-read for what the fix touches.
7. **Submission and the test devices**: the PR series cut by content along
   the named buckets (`fork-workflow.md`, D-WORKFLOW-034), rocknix.org's
   documentation last (#42, D-WORKFLOW-014); builds for every test device --
   the RG35XX SP, the RG SP, the Retroid Pocket Nova -- for the maintainer's
   play-through, each staged and rebooted on its own yes.
8. **The builds shared with the ROCKNIX developers** beside the PRs, each
   saying what it was built from and what it was tested on.

## Why the order is the order

On 2026-09-25 the twenty-second cut was built, proven, staged and recorded as
the candidate (D-QA-046) before anyone asked whether it was current. It was
not: webkitgtk one release series behind, RAOfflineProxy sixteen commits, its
rcheevos twenty, the distribution 56 commits behind ROCKNIX and
EmulationStation 66. `tools/fork-package-freshness` exited 0 throughout,
because D-WORKFLOW-024 lets a recipe state why it is pinned -- a pin that was
reasonable for a round in progress and wrong for a build going upstream --
and the bumps had been planned "after the candidate" (D-WORKFLOW-042, #259).
It surfaced only when the upstream audit was being scoped, after the cut had
been called, which is the dance this file exists to prevent. So step 0 comes
before the first build, and its verdict is part of the call.

The audit follows the play-testing rather than preceding it (the maintainer's
order, D-QA-049): the audit covers everything going upstream, which is far
more than any one round changed, and the play-testing is what says the build
is worth auditing.

## When the procedure changes

This file, its register row and `tools/rc-preflight` change together, in one
change -- a procedure written in two places drifts in one of them.

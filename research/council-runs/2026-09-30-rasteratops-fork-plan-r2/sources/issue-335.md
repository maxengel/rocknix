# Issue #335: Two prongs: a compliant submission upstream as a courtesy and an experiment, and the fork standing on its own

Opened 2026-09-29T23:04:38Z

**Maintainer, 2026-09-29 (chat, D-QA-012), after the licence and compliance reads on #334:** *"This honestly makes me kind of want to fork things. I don't know that we want to give up the kernel patch, the kernel configs, and the changes we've made. We lose a fair bit. We could take a dual-pronged approach and try to submit a compliant build following this to the leather, including the further upstream work, and then maybe separately also just pursue maintaining our fork. This might be just a courtesy, an experiment to them to see if they'll accept it. If not, I think we're moving in a strong direction, and so we could remain a fork but then continue with some of the items we feel we'd like to make."*

**The two prongs**, as the maintainer put them; the decision itself is D-WORKFLOW-081, open until they call it.

## Prong 1: a compliant submission, to the letter, as a courtesy and an experiment

What it contains, from #334's read: the ten distribution PRs less the virtual-machine target, less the H700 kernel patch and configs, less the changes to upstream's own recipes (the new packages moved under `projects/ROCKNIX/packages`; the recipe fixes offered separately as small hand-written fixes), with comments stripped to a maintainer's, descriptions cut to the template's three headings with the AI-usage answer given truthfully, an artifact link per PR, one commit each, and the interface work split by D-WORKFLOW-080's answer. Submitted one at a time, smallest first, each only after the maintainer has read it and can defend it (the accountability directive), and the next only after a reply.

- [ ] `docs/pr-series/map.txt` (or a `map-compliant.txt` beside it) names the compliant series with the three drops recorded; `tools/pr-stack-check` passes it with every description under the template's shape and a size line per PR.
- [ ] A comment here lists, per PR, what the maintainer read before it went up (the file list and the date), which is the directive's evidence.
- [ ] The kernel patch, the configs and the recipe fixes are tracked for the kernel's and each package's own upstream (issues here, one per item, with where it goes).
- [ ] The first PR's reply from a ROCKNIX developer, quoted here, decides whether the second goes up.

## Prong 2: the fork stands on its own

From #334's licence read: a name, a logo and a splash of the fork's own (the branding is CC BY-NC-SA and must not suggest endorsement), an update server of its own (the updater pointed at the fork's releases), release notes and a site under that name, `upstream/next` merged on for the hardware work, and the fork's own direction on top -- the first candidate for which is #336 (a lighter libretro frontend under EmulationStation).

- [ ] The rename is one register row (the name, the logo's licence, the update URL) and one change to `distributions/`, with an image that boots under it on the VM and on one device (frames filed here).
- [ ] The fork's release page carries a note saying what the fork is and what it is a fork of (the CC BY-NC-SA attribution of the branding, per `LICENSE.md`): `gh release view <tag> --repo <the fork> --json body` reads the sentence, in the wording the register row that adopts it records.

Can this be done on the VM? Prong 1 is host tooling and the maintainer's reading; prong 2's boot under the new name is the VM's first, then a device on its yes.




---

## Comment by maxengel, 2026-09-29T23:20:53Z

**Maintainer, 2026-09-29:** *"In terms of level of effort, how would doing this compare with what it would take to be compliant with ROCKNIX? If we know we can offer a better experience and keep working the way we're working, I'm happy upstreaming everything. Maybe we just need to start targeting further upstream and letting it flow down to ROCKNIX, and so all of our changes would go to, say, EmulationStation directly or others. We can still use their agents.md as a guide. We also can maybe first start by seeing if the ROCKNIX team will adopt our changes."*

**The sizes** (lines added against `upstream/next` and ROCKNIX's EmulationStation master, read tonight): the cloud scripts +14,468, the proxy package +5,183, the OS scripts +3,702, the RetroArch patches +1,244, the interface +28,359. Comments are a third to two fifths of the scripts (cloud_backup 1,015 of 2,451 lines, the proxy control script 879 of 2,441).

**Compliance with ROCKNIX, the effort.** The tooling half is done tonight (the guard, the checker, the skill, the ten descriptions). What remains is a rewrite pass: three drops (the VM target, the kernel patch and configs, the recipe fixes moved or offered separately) in about a day; the comment-stripping pass over some 50,000 upstream-bound lines, several days of careful work with the fork's reasoning moved into its records; the interface split of D-WORKFLOW-080, a week if the code is moved out of `GuiMenu.cpp` first. Then the part no tool does: the accountability directive means the maintainer reads and can defend every line submitted, which at this size is weeks of reading, one PR at a time, each waiting on a reply from a team that has written *"use less AI"*. The outcome is theirs to grant; the effort is real either way.

**The libretro direction, the effort.** Step 0 (RetroArch under our interface, over its command socket) is days and changes nothing underneath. The runner with both core kinds is weeks (three to five thousand lines of glue plus its proofs on the VM), comparable to the compliance rewrite in agent time, and every hour of it lands in the maintainer's own hands as a product regardless of anyone's acceptance. Neither touches the hardware work, which keeps arriving from `upstream/next`.

**Further upstream, letting it flow down.** It works for the generic fixes and not for the product: RetroArch's two real bugs (the threaded video wrapper's posting, the Auto slot across a content load) and the notification sizing are small, human-readable PRs that reach ROCKNIX through RetroArch's next bump; the proxy's fifteen patches go to RAOfflineProxy's author, as the fork always meant; the H616 ramoops device-tree change goes to the kernel (months, and it flows down through ROCKNIX's kernel bumps). The interface work has no upstream but ROCKNIX's EmulationStation fork -- batocera's EmulationStation, above it, would need the pages rewritten against batocera's own scripts -- and the cloud scripts, the proxy integration and the Wi-Fi pages have no upstream but ROCKNIX at all. So the product either lands in ROCKNIX or lives in the fork, and the small fixes go up regardless, which is worth doing this week whatever else is decided.

**Seeing whether ROCKNIX adopts the changes first.** Cheap to try, bounded: the two or three PRs that are pure wins for them and small under their rules (the build guard without the recipe fixes; persistent logs without the kernel bits; the last-good settings), one at a time, smallest first, each read by the maintainer before it goes up. Their reply to the first decides the second. The fork's own identity (#337) is a day of work that can be prepared in parallel and used only if the answer is no.



---

## Comment by maxengel, 2026-09-29T23:24:04Z

**Maintainer, 2026-09-29:** *"Really, honestly, don't want to read through everything. We have a fairly complicated structure in place running here to ensure quality that will only mature in our own CI/CD pipeline: use of VMs, regression testing, and then testing, etc. is likely far more advanced than what they're doing. I trust our process, so I don't feel the need to manually review our commits, nor do I even have the time."*

Recorded as D-WORKFLOW-082. It settles the one row of #334's table that no tool could: ROCKNIX's accountability directive cannot be met honestly for this series, so prong 1 reduces to the small generic fixes anyone can read (RetroArch's two bugs and the notification sizing; the proxy's patches to RAOfflineProxy's author; the H616 ramoops change to the kernel), each offered under the receiving project's rules with the AI question answered truthfully, and the product work lives in the fork. D-WORKFLOW-081 stays open for the fork's name and footing (#337). The process the maintainer trusts is also the thing to keep maturing: tonight it missed a dead page script for a week (blindspot 69) and caught it once the stub was made honest, which is the pattern to build the CI on.



---

## Comment by maxengel, 2026-09-29T23:31:35Z

**The conversation itself, shared by the maintainer on 2026-09-29** (a ROCKNIX developer on the project's Discord, and the maintainer's replies), which corrects what I had assumed from the closing alone:

> spycat: *"What's with the AI PR's?"* … *"I don't want to reject your PR's and have always accepted them in the past but PR's like that will not be reviewed, AI needs to be used responsibly. We also have an AGENTS.md which appears to have been completely ignored."* … *"Not at all, but we can't be expected to review a PR with 40,000 lines of changes."*
>
> the maintainer: *"Let me look into it. I'm still trying to streamline this part of the process for me. The commits were so big that I wanted to break them into different parts because the sheer quantity was massive, but it didn't squash-merge correctly. Let me get everything cleaned up and a bit easier to review and I can resubmit."* … *"Understood. Let me square up with the agents.md file. I'm definitely using AI in a responsible manner, and will make sure that it conforms. If it becomes problematic, just let me know, and I certainly understand if you don't want me to submit them."* … *"I can squash-merge every commit by major area, but that's still going to leave massive bits of changes to review. I can also break them into much smaller commits, still squash-merged, but then that's going to create a host of commits. It wound up being such a massive feature drop after being in the weeds on this for about a month, so I'm certainly open to ideas on how best to upstream this."*

**What it changes.** The door is open: the developers have taken the maintainer's PRs before and say so, they do not refuse assisted work, and their ask is three concrete things -- responsible use, `AGENTS.md` followed, and a size a person can review. Nobody in that conversation asked for a line-by-line reading; D-WORKFLOW-082 (the fork's quality is its process) and the maintainer's *"I'm definitely using AI in a responsible manner"* are the same statement, made truthfully, and the template's AI question answered YES is how it is said on each PR. So prong 1 is not reduced to the generic fixes; it is the primary path, and the maintainer has said as much to the developers. The fork's own identity stays the fallback the maintainer keeps in hand.

**The answer to "how best to upstream this", which the maintainer asked them and which is mine to propose:** a series of small PRs, each one purpose and one commit on `upstream/next`, in dependency order, one at a time, the next only after the last has a reply; the interface work first moved out of `GuiMenu.cpp` into files of its own (a mechanical move, itself one reviewable PR), then one PR per feature; the three things `AGENTS.md` forbids left out of the series (the VM target, the kernel patch and configs unless the developers say a device-tree reservation is welcome as a device patch -- their own tree carries hundreds -- and the recipe fixes offered as their own small PRs); every description in the template's shape with the AI question answered; comments in upstream-bound code cut to what a maintainer would write. A size ceiling set from the project's own merged PRs (measured below), written into the map's header and enforced by the checker. The whole series then takes weeks to months at the developers' pace, which is the honest shape of upstreaming a month of work, and every PR that lands is one less the fork carries.



---

## Comment by maxengel, 2026-09-29T23:32:22Z

**Two measurements, so "reviewable" is a number and "no kernel patches" is read against practice.**

The last forty PRs merged on `ROCKNIX/distribution`: a median of **18 lines added in one file**, three quarters under 85 lines, the largest 3,046 (a new device). Against that, the series as it stands is ten PRs of 28 to 12,562 lines, and the interface PR was 41,496. The map now carries a ceiling of 1,500 insertions and 30 files, which the checker enforces: five of the ten fail it today (the VM target at 12,562, the saves scripts at 10,462, the cloud setup at 6,313, the proxy at 5,681, the settings at 3,097), and the build guard (278), the network scripts (527), the evidence scripts (706), the RetroArch patches (1,041) and the pin (28) pass. Splitting the five to the ceiling makes the distribution side about twenty PRs; the interface side, after the move out of `GuiMenu.cpp`, another fifteen or so. That is the true size of upstreaming a month's work at the project's own pace, and it is months.

On kernel patches: upstream's tree carries 277 in-tree kernel patches for all devices and 32, 56, 33 and 16 under the H700, SM8550, RK3566 and RK3588 device directories, added this year by two of their own developers. The rule in `AGENTS.md` is written for an agent writing kernel code without references, not for a device's reservation patch; the H616 ramoops change is offered as a device patch with the question asked, rather than dropped.



---

## Comment by maxengel, 2026-09-29T23:43:11Z

**Maintainer, 2026-09-29, playing devil's advocate:** *"even if we go along with them, there's no way I can review 80,000 lines of code, and so I don't know how we could be compliant with the agents' MD file. We can see what they come back to us with, but I just have a hard time imagining how we could ever be compliant with their policies."*

**Read literally, the directive cannot be met for this body of work, and it is better to say so than to pretend.** *"Fully accountable for understanding and validating all code you produce"* at 80,000 lines is a reading nobody will do. Two readings remain, and only one of them is a submission:

1. **Accountable at the granularity of a change, with its evidence.** Under the ceiling a PR is at most 1,500 lines; understanding one means reading its paragraph, skimming its diff, and knowing what it does, how it was tested and what breaks if it is wrong -- which the fork's records already hold for every change (the change log's entry, the register's rows, the run that proved it). Fifteen to thirty minutes a PR, thirty-five PRs, spread over the months the project's pace imposes: about ten to fifteen hours of the maintainer's time in all, not 80,000 lines. When a developer asks *"why does this do X"* or *"this broke on my device"*, the answer comes from that evidence, with the assistant to fetch the specifics. Whether that satisfies the file is the developers' call; the thread suggests their concern is that *they* can review and that the submitter stands behind it, and nothing in it demands the other reading. It is honestly described on each PR by the template's AI question answered YES.
2. **Accountable by reading, at the volume that allows it.** Submit only the small generic fixes (a few hundred lines in all, readable in an hour) and keep the product in the fork. Fully compliant, and most of the work stays home.

There is no third reading in which 80,000 lines go upstream and the maintainer has read them. So the honest answer to *"could we ever be compliant"* is: with the product, only at the change-by-change granularity and only if the developers accept that as accountability; with the generic fixes alone, yes, completely. *"See what they come back with"* is the right next move and costs one small PR: the build guard, under the ceiling, in the template, the AI question answered, offered with a sentence that says how it was validated. Their reply to that is the answer to this question, and it is theirs to give.


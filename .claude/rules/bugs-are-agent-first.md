---
description: "What a bug is here: fixed to the best of our ability means fixed and closed; every criterion is verified on the VM by an agent; what the VM cannot verify is not a known bug but an item the community tests or a thing to keep an eye on; no known bug is open when a build is called a release candidate (D-QA-051)."
---

# Bugs are agent-first

*No `paths:` glob, so this file loads every session: a bug is filed, dispositioned
or closed from a conversation, before any file is open.*

Maintainer, 2026-09-25, when a release candidate was put to them with ten bugs
open under a disposition row and asked *"If we have open bugs, why wouldn't we
deal with them before we ship a build?"*:

> *"We need to think agent-first with this. If we fix the bug to the best of our
> ability on our end, then the bug should be considered fixed. [...] if a bug
> cannot be verified on the VM, then it's not a bug that's properly structured.
> Any human verification is beyond what we can rely on.*
>
> *We can create a list of a new class of bug that we call "open items to test"
> or something like that, where we want that verified by the community in
> builds. We need to optimize every issue we create, every bug report we
> generate, and every method through which we have acceptance criteria to be
> oriented around what is testable and verifiable fully agentically via the VMs.*
>
> *If there are ways for us to creatively problem-solve and develop solutions
> so we can test it on the VM, then that's important. If there are additional
> things necessary to do so, such as providing a PSP title on the guest, etc.,
> that's also something we can handle. [...]*
>
> *Otherwise, we should close all known bugs that we discover before we consider
> anything to be a release candidate. If there's a bug we discover that we
> cannot verify, we first need to think about how we could create a system to
> verify it agentically and on our VM. If that is truly impossible, then we need
> to not consider it a known bug, but something to keep our eye on as a
> potential future issue or something to that effect."*

Binding (D-QA-051, #276). It refines D-QA-044 (a criterion is agent-first) and
D-QA-046, and it replaces the shape D-QA-050 took, where six fixed bugs stayed
open on device observations nobody could make.

## The three classes, and the label each carries

| Class | Label | Meaning | Where it lives |
| --- | --- | --- | --- |
| **Bug** | `bug` | a defect with a fix we can make and a criterion the VM verifies | open until the fix is in the tree and every criterion is ticked from a VM artifact; then closed as delivered |
| **Open item to test** | `open item to test` | a fixed thing whose remaining observation only a real device, network or account can make | closed as a bug; the observation listed for the community's builds, and read from the soak when it comes |
| **Keep an eye on** | `keep an eye on` | something seen once that no evidence explains, or a failure the VM can neither reproduce nor verify after the harness question has been asked | not a known bug; a note with what would turn it into one (a dump, a journal line, a second sighting) |

`tools/rc-preflight` counts only `bug`-labelled open issues, so the second and
third classes never stop a candidate -- and a `bug` that stays open does, which
is the point.

## The rules

1. **Fixed to the best of our ability means fixed.** The fix in the tree and
   every criterion ticked from a VM artifact (a suite's PASS line, a frame, a
   stamp, a journal line, a measurement) closes the issue. A person's
   observation is never the check (D-QA-044); it can be the source of the
   next issue.
2. **Every criterion is written for the VM.** A criterion the VM cannot tick
   is a criterion badly written, not a device task: rewrite it as the VM
   artifact that proves the same thing, or move the observation to the
   open-items list and close.
3. **Before "the VM cannot", the harness question.** What would let the VM
   verify it -- a PSP title on the guest, a two-guest LAN with multicast, a
   backend mode that refuses then accepts, a walk that types on the on-screen
   keyboard? That is work to file and do (`generic-x64-vm-testing.md`), and
   until it exists the item is an open item to test, not an open bug.
4. **Truly impossible means keep an eye on.** A physical fact the guest cannot
   have and no harness can give (`vm-first.md`'s list) does not make a known
   bug; it makes a watch item with the evidence that would.
5. **No known bug at the call.** A build is called a release candidate with
   every `bug` closed: fixed, or moved to one of the other two classes with
   the reason written in the issue. The preflight refuses otherwise
   (`release-candidates.md` step 0).
6. **A bug we find in upstream's code is still ours to close** when the fix is
   contained -- a quoting, a bound, a strip -- because "all known bugs that we
   discover" does not stop at a lane; D-UI-079 (change stays inside the lanes)
   governs behaviour we would alter, not a defect we would remove. Say which
   it was in the commit.

## What changed on 2026-09-25 under it

The ten bugs D-QA-050 had left open: the six fixed with a device observation
owed (#50, #113, #169, #170, #177 and the pad half of #249) close, their
observations moving to the open-items list; the two VM proofs nobody had run
(#178's reboot after a WARNING, #249's injected key) run; #239 is reproduced
on the guest and its `HideWindow` lead tested; #275 is fixed; #79's entry 1
becomes a watch item and the list drops the `bug` label. The harness work the
question turns up -- a PSP title on the guest, a two-guest multicast LAN, the
refuse-then-accept backend mode -- is filed as its own work.

---
description: "Before any test, build proof or measurement: can this be done on the VM? Written down, answered, and only a reasoned no moves it elsewhere."
---

# Can this be done on the VM?

*No `paths:` glob, so this file loads every session: the question is asked
before a test is written, which is before there is a file to match.*

Maintainer, 2026-09-11: *"we should always ask the question: 'Can this be done on
the VM?' Only if the answer is no should we move elsewhere."* Binding (D-QA-007,
D-QA-015, D-QA-017). This file exists so the question is asked every session, by
every agent, before every proof -- not remembered by one.

## The question, and where the answer goes

Before a test, a measurement, a screenshot, a fixture, a reproduction or a proof
of any kind, write the question and its answer **in the issue the work belongs to**
(or the work log when there is no issue):

> Can this be done on the VM? **Yes** -- <how>. / **No** -- <the one thing only a
> device or a person's account can show>.

**A synthetic input is named, and keeps its checkbox partial (audit #258, P-05).**
When the VM cannot produce the real input -- a core that rotates, a process
whose core exceeds the cap, a hotkey from a pad -- and the proof feeds a
substitute (a hand-appended `SET_ROTATION` line, `/dev/zero` through the
keeper, a command through the API where a button was meant), the tick names
the substitute and the checkbox stays `- [ ]` with that note until a real input
has been seen once, on the VM or on a device with its yes. Blindspot 8's rule
(an assertion that only holds because nothing had happened yet) applied to
the tick: a proof of the path is not a proof of the input.

**And the criterion itself is written for an agent (D-QA-044).** The checkbox
names the artifact that ticks it; a device checkbox names the fact and points at
its row in `docs/releases/device-facts.md`; `tools/box-check` fails the rest
(`issue-tracking.md` § A criterion is agent-first).

A "no" names a physical fact the GENERIC_X64 guest cannot have: a real panel's
scaling, a board's DRAM surviving a reset, a battery, a GPU driver's exit path, a
bootloader on a given board. **"A real provider" is not a no**: the build host
runs WebDAV, S3, SFTP, SMB and FTP backends of its own (`tools/cloud-test-backend`,
#133) and a VM guest can sign in to a hosted QA account. **"It already has the
history" is not a no**: `upgrade-and-install.md` says how the VM gets it.

## What the VM has

The GENERIC_X64 image runs the same busybox, scripts, EmulationStation binary,
fonts and 640x480 panel size as a handheld; `tools/vm-pair` gives two guests on
one cloud; `tools/cloud-test-backend` the endpoint (and a dead port for
failures); `tools/vm-qa` the runner with its four suites; `tools/vm-visual-qa`
the frames and the walks; `tools/emulator-exit-test` the exit hotkey; the
`.update` path an in-place upgrade. Anything these cannot reach is a gap in
them to name and, usually, to close -- not a reason to reach for a device.

## When the answer is no

Then, and only then, `engineering-practices.md` § "Nothing runs on a person's
device without their yes" (D-QA-015): the device run is asked for by name, with
what it shows, writes, sends and leaves behind -- including what the device's own
automation (game-exit sync, startup sync, set-aside pruning) will do in response
-- and it runs only on the yes, scoped to exactly the fact the VM could not show.
A dedicated QA handheld with QA-only accounts (D-QA-016, #131) is the standing
answer for the recurring "no"s; the maintainer's device is not a test bench.

## Why this file

On 2026-09-11 a session ran the exit test and a provider proof on the
maintainer's RG35XX SP and their Dropbox. Asked afterwards, the honest answer
was that the forms needed no device at all, the exit path had a small real gap
that could have waited, and the provider proof's gap was an account, not the
VM. One of the runs made the scripts prune a set-aside folder of the
maintainer's own saves (blindspot 38, #130, #132). The question, asked and
written first, would have stopped all three.

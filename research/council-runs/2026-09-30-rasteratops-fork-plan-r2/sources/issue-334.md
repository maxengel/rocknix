# Issue #334: The fork's footing: what the licences allow a standalone fork, and what upstream's AGENTS.md requires of a submission

Opened 2026-09-29T22:54:48Z

**Maintainer, 2026-09-29 (chat, D-QA-012), after the ROCKNIX developers closed the series (#333):** *"Candidly, we might be reaching a point (and I'm talking to the devs now) where they just don't want to take any PRs with AI assistance to the degree that I've been using it. We should look into the license of the project and see if we can fork it. They also said we're not compliant with this. I'm not saying we should be, but we should investigate whether we can be. https://github.com/ROCKNIX/distribution/blob/next/AGENTS.md"*

Two questions, both answered by reading, not by opinion; the assessment is the first comment below and is the maintainer's to act on.

1. **The licence: can the fork stand on its own?** What `LICENSE.md` on `ROCKNIX/distribution` and the EmulationStation repository's `LICENSE.md` permit, what they require (attribution, share-alike, the GPL's source obligations), and what is not covered by the licence at all (the name, the logo, the artwork, the update servers, the build container).
2. **Upstream's `AGENTS.md`: what it requires, where this fork's process diverges, and what compliance would cost.** Directive by directive, with the fork's practice beside each.

Can this be done on the VM? Not a VM question: two documents read on the host.

## Acceptance criteria

- [ ] A comment on this issue with the licence read: each file's terms quoted, the obligations a standalone fork carries, and the things the licence does not grant (the name and marks first), each with the line it comes from.
- [ ] A comment with `AGENTS.md`'s directives in a table against the fork's practice, each row marked complies / diverges / not applicable, and the cost of the divergent rows.
- [ ] The maintainer's decision recorded as a register row (the fork's relationship to upstream: submit under their rules, submit less, or stand alone), whichever it is.



---

## Comment by maxengel, 2026-09-29T22:57:02Z

**The licence read** (the two files, quoted; a reading of the documents, not legal advice).

**What the software licence permits.** `LICENSE.md` on `ROCKNIX/distribution`: *"Original software and scripts developed by the ROCKNIX team are licensed under the terms of the GNU GPL Version 2"*, and *"Modifications to bundled software and scripts by the ROCKNIX team are licensed under the terms of the software being modified."* The build system underneath is JELOS's, itself LibreELEC's and CoreELEC's, GPL-2.0-or-later. The EmulationStation repository's `LICENSE.md` is MIT (*"Copyright (c) 2014 Alec Lofquist ... Permission is hereby granted, free of charge, to any person obtaining a copy of this software ... to deal in the Software without restriction"*). So a standalone fork may copy, change and redistribute all of it. The GPL asks for the source of what is distributed (this fork is public, so that is met by existing) and for the notices to stay; MIT asks for the copyright notice to stay. The fork's own rule of preserving every upstream header and adding a line is the same obligation.

**What the licence does not permit freely: the name, the logo, the artwork.** `LICENSE.md`: *"ROCKNIX branding and images are licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License"* -- *Attribution: ... but not in any way that suggests the licensor endorses you or your use*; *NonCommercial*; *ShareAlike*. A standalone fork that still boots with the ROCKNIX logo, calls itself ROCKNIX and updates from ROCKNIX's release page is inside "suggests the licensor endorses you", licence or no licence. The clean shape is a fork with its own name, logo and splash, that says it is *a fork of ROCKNIX, itself a fork of JELOS* -- which is what CC BY-SA asks for (*indicate if changes were made*) and what the README's own credits section models.

**What the licence does not cover at all**, and a standalone fork has to provide for itself: the update server (`rocknix-update` reads ROCKNIX's GitHub releases; a fork points it at its own), the release page and its `.sha256` convention (the fork has this already, `maxengel/rocknix`'s releases), the build container `ghcr.io/rocknix/rocknix-build` (public, usable, not ours to keep current), the site (rocknix.org is its own repository; the fork's pages would be the fork's), the Discord and the community, and every device's bring-up, kernel and bootloader work, which is upstream's largest continuing contribution and the reason to keep merging `upstream/next` whatever else is decided. *"This distribution includes components licensed for non-commercial use only"* is a constraint the fork already lives under.

**What "forking" would actually change.** The fork exists: `next` is `upstream/next` plus the overlay, built and QA'd on its own, released on its own page. Standing alone means (1) a name, a logo and a splash of its own (`distributions/ROCKNIX/` becomes `distributions/<name>/`; `OS_NAME`, the update URL, the theme's logo), (2) release notes and a site under that name, (3) keeping `upstream/next` merged for the hardware work, as now, and (4) submitting upstream only what upstream will take, if anything. Nothing in the licences prevents any of it; the branding terms make (1) the one thing that is not optional.



---

## Comment by maxengel, 2026-09-29T22:57:03Z

**Upstream's `AGENTS.md` against this fork's practice** (the file is 38 lines, added 2026-08-31 by the developer who closed the interface PR; its "Mandatory LLM Pre-Flight Checklist" section names two self-review passes and lists no items). Beside it, `.github/pull_request_template.md` asks *"Did you use AI tools to help write this code? YES | PARTIALLY | NO"* under *"While ROCKNIX doesn't have restrictions on AI tools in contributing, please be transparent about their usage"*, and the workflow that labelled such PRs `ai-generated` was disabled on 2026-06-17.

| Directive | The fork today | Verdict | What compliance costs |
| --- | --- | --- | --- |
| A. No verbose explanations or narrative in PR descriptions | The closed series: five bold sections per PR. The rewrite: three or four paragraphs. | diverged; closer now | Cut each to a paragraph and a test line; the template's three headings. Small. |
| A. No obvious or noisy inline comments; minimal, clean code | The fork writes paragraphs of rationale in comments, by design (the register's IDs, the dates, the cases). | diverges, deliberately | Strip upstream-bound code to the comments a maintainer would write, keeping the rationale in the fork's records. Real work per file; a loss the fork chose not to take. |
| B. Do not modify `package.mk` under top-level `packages/`; use `projects/ROCKNIX/packages` and the device overrides | The series changes 20 files under `packages/` (the web stack for the sign-in window, syslinux, the installer, libyaml, libsamplerate, brotli, ruby, unifdef, openjpeg, woff2, glib-networking, libtasn1, dmidecode, qrencode, ryzenadj, libpsl, libsoup, webkitgtk). | diverges | New packages can move under `projects/ROCKNIX/packages` (the override model); fixes to upstream's own recipes cannot, by definition, and are the kind of change the rule is not about. A day. |
| C. Do not split related changes into parallel PRs; one purpose, one PR | Ten distribution PRs by area; one interface PR by the same rule (D-WORKFLOW-066). | complies by the letter; the developers' closing asks the opposite of the interface PR | The two asks meet at "one purpose, readable size": the interface split of D-WORKFLOW-080. |
| C. No zero-shot kernel modules | None written. | not applicable | -- |
| C. Do not modify `mkimage` scripts to create custom images for individual devices | `scripts/image`, `scripts/extract`, `scripts/build_distro` changed for the GENERIC_X64 target (BIOS boot, the release directory). | diverges by the letter (a new target, not a custom image) | Keep the target's image work inside its device directory where the scripts allow; where they do not, it is a change to the image scripts, which the rule forbids. |
| C. No direct in-tree patches to the Linux kernel or core libraries | One H700 device-tree patch (ramoops reserved memory) and two kernel configs; webkitgtk's two build patches; RetroArch's eight. | diverges (the DT patch and the configs) | The DT change belongs upstream in the kernel or is dropped; the configs are a device's own. RetroArch is not a core library by any reading. |
| C. Isolate device-specific behaviour into quirk files | GENERIC_X64's and the Nova's behaviour is in quirks. | complies | -- |
| C. Reference upstream sources and pull them in dynamically at the build root | Every source is fetched from its upstream at a pinned commit with a hash; meson's own downloads are refused (#226). | complies in substance | -- |
| C. Cross-test kernel edits on multiple target devices | The H700 config and DT patch tested on two H700 boards (RG35XX SP, RG SP). | partly | Every device family the config reaches, or a per-device config. |
| D. The human contributor fully accountable for understanding and validating all code produced | The maintainer decides, play-tests and reviews outcomes; the code is read by the fork's audits, not line by line by the maintainer. | diverges -- this is what "use less AI" means | The maintainer reads and can defend every line submitted. Their time, per PR; the only cost on this list that does not shrink. |
| D. Build artifacts (`.img.gz`, `.tar`) linked in the PR for every affected device | RC1's release existed; no PR linked it. | diverged; trivial to comply | A link per PR to the fork's release. |
| Pre-flight: two self-review passes | The fork's audits and second opinions exceed it. | complies | -- |
| PR template, with the AI-usage answer | The series used its own bodies; no answer given. | diverges | Use the template; answer YES or PARTIALLY, truthfully. Removing the footer (#333) and then answering NO would be the one thing worse than the footer. |

**Reading it whole.** The written policy allows assisted contributions with disclosure and asks for terse descriptions, minimal comments, quirk-isolated device work, no kernel or image-script changes, and a human who can vouch for every line. Of those, the fork can comply with everything but two at the cost of a rewrite pass: the comment style (a choice the fork made, reversible per file for upstream-bound code) and the human accountability, which is not a tooling change but a change in how the maintainer spends time per PR. The developers' stance in the closing goes past the written policy -- *"use less AI"* -- and no document says where that line is, so it is a question for the conversation the maintainer is having, not one these files answer.



---

## Comment by maxengel, 2026-09-29T22:58:48Z

**Maintainer, 2026-09-29:** *"Could we even comply with what they've outlined in their agents.md file?"*

**Yes, with the rules as written, at three costs and one condition.** Reading the table above as a whole:

What complies today or with a small pass: one purpose per PR; device behaviour in quirks; sources fetched from upstream at pinned commits; descriptions cut to the template's three headings; an artifact link per PR; the two self-review passes; the AI-usage answer given truthfully.

What would have to be dropped or deferred from the submission to comply with the letter:

1. **The virtual-machine build target** (PR 2). It changes `scripts/image`, `scripts/extract` and `scripts/build_distro`, and the rule forbids changing the image scripts. It is QA infrastructure the fork keeps regardless; upstream can live without it.
2. **The H700 kernel patch and the two kernel configs** (in PR 3). The rule forbids direct in-tree kernel patches; the ramoops device-tree change goes to the kernel upstream first, or the persistent-crash-store feature ships without ramoops on H700.
3. **The twenty changes under top-level `packages/`** (in PRs 1 and 7). New packages (the web stack for the sign-in window, qrencode) move under `projects/ROCKNIX/packages`, which the override model allows; the fixes to upstream's own recipes (cairo, libyaml, syslinux, the installer, libsamplerate and the rest) cannot be made anywhere else, so they are either submitted as small hand-written fixes outside this series or left out.

What would have to be rewritten: every comment in upstream-bound code down to what a maintainer would write, with the rationale kept in the fork's records (a pass over the cloud scripts, the proxy control script, the interface files); every description to a paragraph.

**The condition, which is the whole question:** *"hold the human contributor fully accountable for understanding and validating all code you produce."* The series is about 42,000 inserted lines on the interface side and 40,000 on the distribution side. Compliance with that line is not a tool change; it is you having read and being able to defend every line you submit. At this volume that means submitting far less at a time, only what you have read, at the pace of your reading -- and the developers' *"use less AI"* suggests that even then, the question they will ask is who wrote it, which no rule in the file settles.

So: the fork can be made compliant with `AGENTS.md`; the series as it stands cannot be, and the part of the series that could would arrive slowly and partly. That is the trade the decision on #334 is about.


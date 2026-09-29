---
name: release-notes
description: "Write a release note for the fork's releases page or a PR description for the upstream series: outcomes a player or a reviewer can act on, in the site's voice, with the plumbing (commits, issues, runs) in a details block underneath. Use for every release and every pr/* branch."
license: GPL-2.0-or-later
metadata:
  version: 1.0.0
  origin: "Synthesized 2026-09-29 (#323, D-WORKFLOW-068) from the maintainer's estate: its friendly-changelog skill (the glyph sections, the ten-bullet ceiling, outcomes not implementation, no plumbing in the prose, no invented change) and its commit-messages card (an outcome-first subject, the reader-with-no-diff test); re-anchored on this fork, where the note is written by hand from docs/cloud-sync-changelog.md and checked against a run, and PR titles follow upstream's `package: text` rule."
---

# Release notes and PR descriptions

Two readers. A player on the releases page decides whether to flash the
build; a ROCKNIX reviewer on a PR decides whether to merge it. Both want the
outcome first, the evidence second, and the plumbing out of the way. The
voice is `developer-relations`' (the site's); this file is the shape.

## The release note

The body of a release on `maxengel/rocknix` (`tools/fork-publish-release`
uploads the files; the note is written by hand and pasted with `gh release
edit --notes-file`). Structure, in this order:

```
One sentence saying what this build is and who it is for.

### What's new
- One-sentence bullets, the most player-visible first (at most ten across all sections)

### What's fixed
- Repaired behaviour, as fixes, never promoted to "new"

### What to know
- The one or two things that change what a player does (a setting that moved, a first-boot step)

### Devices and how to install
- One line per device: the file to flash or copy, and the H700 choice (the regulator read) where it applies

<details><summary>Built from, tested on</summary>
the heads, the runs (vm-qa, the proofs, the rehearsal), the device play-tested, the issues; the sha256 files
</details>
```

Rules, from the estate's changelog skill and kept whole:

- **Outcomes, not implementation.** "A save that changed but kept its size
  now reaches the cloud" -- not "cloud_backup passes --update on size-only
  remotes".
- **No plumbing in the prose.** No commit hashes, issue numbers, run
  numbers, branch names or script names above the details block. They live
  in the block, where the reviewer looks.
- **At most ten bullets across the sections**; combine related changes;
  drop a section rather than pad it.
- **One sentence per bullet.** No sub-bullets.
- **Every bullet traces to an entry in `docs/cloud-sync-changelog.md`**,
  which traces to a run. Nothing is described that no run showed.
- **Classify fixes as fixes.**
- **Name the provider a player set up** (Dropbox, Google Drive, a WebDAV
  server); never a tool's flag, exit code or log path.
- **No exclamation marks, no "we're excited", no sign-off.** The first
  character of the note is the first character of its first sentence.

Two heads in one release (as RC1 has) are said in the first sentence and in
the details block, with the diff between them in a clause: "the SM8550 and
RK3566 images come from a head that adds only a build fix for a package
those devices ship and the H700 does not."

## The PR description

For each `pr/*` branch of the series (#322), the body upstream reads. The
title is upstream's rule, not ours: `package: text`, 72 characters, no
Conventional Commits prefix (`fork-workflow.md`). The body:

```
What a player gets from this change, in two or three sentences.

**What it carries.** The paths, by area, in a sentence each.
**How it was tested.** The suite, the proof, the device -- named, with what
they showed; a build for at least one target.
**What it does not touch.** The neighbours a reviewer might expect it to.
**Kernel, bootloader or device tree.** Any such change, named; or "none".
**Depends on.** The PR before it in the series, or "none".
```

From the estate's commit-messages card, the test that matters: a reviewer
reading **only the description** -- no diff, no session, no fork issue --
should know what problem this solves, why it matters and what it touches. If
the description needs the diff to make sense, rewrite it. Outcome-first,
present tense, active voice; the banned openers are the same ("This PR...",
"This change...", "Various fixes"); the plumbing (fork issue numbers, the
QA runs' names) goes in a details block at the end, since upstream's readers
cannot open the fork's issues.

## Before it is shown

`tools/prose-check` on the note or the description; every bullet checked
against the change log's entry and the run it names; the two-heads clause
present whenever the files come from more than one build.

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

The body of a release on `pixelelated/distribution` (`tools/fork-publish-release`
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
- **First person singular, always (D-WORKFLOW-074).** A note, a PR
  description or an issue comment is posted as the maintainer, one person:
  "I", "my", "the two I have", never "we" or "our". Maintainer,
  2026-09-29: *"we're posting as me, so it should be first person singular.
  That should be a consistent policy for everything we do."*
  `tools/prose-check` fails a plural.

Two heads in one release (as RC1 has) are said in the first sentence and in
the details block, with the diff between them in a clause: "the SM8550 and
RK3566 images come from a head that adds only a build fix for a package
those devices ship and the H700 does not."

## The PR description

For each `pr/*` branch of the series, the body upstream reads. The title is
upstream's rule, not ours: `package: text`, 72 characters, no Conventional
Commits prefix (`fork-workflow.md`).

**It reads as the maintainer's own note to a reviewer**, because it is
posted under their name (D-WORKFLOW-074) and because the ROCKNIX developers
closed a whole series on 2026-09-29 for reading otherwise -- one asked for
*"less AI"* in the submissions (D-WORKFLOW-078, #333). So: three or four
short paragraphs of plain prose, first person singular, the way a person
writes to a colleague they will meet again.

1. What this changes and why, as a player or a reviewer would say it.
2. How I tested it: which devices, what I ran, what I saw. Plainly.
3. What it touches and does not (kernel, bootloader or device tree named
   if any), and what it depends on, in a sentence.

What it never carries:

- **Any assistant.** No `Generated with Claude Code` footer, no
  `Co-Authored-By` for one, no Claude, Claude Code or Anthropic anywhere --
  in the body, the commit message, or a comment on the PR. The harness adds
  a footer on its own; delete it before the PR is opened.
- **Templates.** No bold labels (`**What it carries.**`), no headings, no
  bullet lists unless they list devices; a template reads generated because
  it is.
- **The fork's plumbing.** No decision IDs, no `tools/…` names, no fork issue
  numbers, no run numbers, no session names, no register vocabulary. A
  reviewer cannot open any of it, and each one says a machine wrote this.
- **The plural.** *I* built it, *I* tested it, *I* found it.
- **Sales.** No exclamation marks, no "excited", no sign-off.

From the estate's commit-messages card, the test that matters: a reviewer
reading **only the description** should know what problem this solves, why
it matters and what it touches. A second test, from the closing: read it
aloud as the maintainer; anything they would not say, cut.

**The commit message** of the `pr/*` branch is the title, a blank line, and
the first paragraph of the description in the same voice, 72 columns; no
trailer of any kind.

**One PR, one commit, one reviewable size.** Every `pr/*` branch is built
on `upstream/next` by itself as one commit (D-WORKFLOW-079); a PR a person
cannot read in a sitting is split before it is opened, and the interface
work goes up as the review guide's buckets, one PR each.
`tools/pr-stack-check` builds the branches, counts the commits, prints each
PR's files and insertions, and refuses a description that carries any of
the above.

## Before it is shown

`tools/prose-check` on the note or the description, with `PROSE_FIRST_PERSON=fail`
for a PR description; `tools/pr-stack-check` for the series (the drafts'
scan); every bullet checked against the change log's entry and the run it
names; the two-heads clause present whenever the files come from more than
one build; and the footer the harness appends removed from every `gh pr
create` body before it is sent.

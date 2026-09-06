# Council — Step 5: the handoff, as tracker text

The council has settled on a consensus plan; its handoff section is injected
below, verbatim, and it is the specification. Every decision that section
listed as "the maintainer's to make" has since been made, and those register
rows are injected after it and are binding. So is the vocabulary rule, which
governs every string you write.

Your job is to turn the handoff into **the text the tracker will hold**, so
that whoever picks up each issue on Monday builds the foundation the council
chose and nothing else. The corpus is embedded above, unchanged.

## Anti-self-citation constraint

Write from the substance. Do not describe or characterise the deliberation
that produced it, and do not cite the injected artifacts as evidence about
how councils or models behave.

## What to produce

This project tracks work as **Milestone → Epic → child issues**, and the
children already exist. The current bodies of the epic (#11) and every child
the handoff touches (#9 #10 #19 #21 #22 #23 #24 #25 #35 #37 #7) are injected
below, so you edit real text rather than imagined text. Produce, in this
order:

1. **The epic body for #11**, rewritten: one paragraph of context; the
   architecture in one screen (the reconciler owns every writer; sha256
   identity; per-device manifests; local agreement; the classifier; the
   lifecycle gate; the checked adapter; count-bounded retention in the cloud
   with no undo control; queue-and-badge); the **build order** from the
   handoff mapped to child issue numbers; the **ordered experiments** table
   with each gate's venue and what it unblocks; and the decisions that bind
   the milestone, cited by register ID, not restated.
2. **Each child issue body**, rewritten or amended: the requirements that
   issue carries (R-numbers, verbatim where the handoff gives them), its
   acceptance conditions (A-numbers, verbatim), the gates that precede it,
   and what it must not build. Where the current body says something the
   plan overturns — bisync as the detector, a local retention store, an undo
   control, the old vocabulary — replace it and say in one line what changed
   and why (cite the register ID). Keep each issue's existing acceptance
   checklist form: `- [ ]` items that are observable behaviour, never
   artefacts.
3. **The register rows the handoff proposed** (P1–P8), each resolved against
   the decisions that have since been made: state which are now *already
   decided* (cite the ID and stop), and draft the wording only for any that
   remain genuinely open.
4. **The document edits list** from the handoff, checked against the
   vocabulary rule and updated where a name has changed.
5. **What still needs the maintainer's word**, if anything survives 1–4.
   Expect this to be short or empty; if you list something, say why it is
   not already covered by an injected decision.

## Rules for the text

- **Vocabulary per D-UI-022**: settings, saves (game saves, save states, and
  screenshots), ROMs and BIOS; back up and restore; *sync* only for the
  automatic two-way behaviour; *discarded saves*; never "system backup",
  "save data", "upload", "everything", "cloud library".
- **Config keys are the new ones**: SAVESPATH, SETTINGS_BACKUPS, SAVES_REMOTE,
  SETTINGS_REMOTE, CONTENT_REMOTE. RESTOREPATH no longer exists.
- **Two lines per row, never three** (D-UI-023) wherever you specify
  interface text.
- **Retention lives in the cloud** (D-CLOUD-036), not under `/storage/.cache`
  or `/storage/.local`. Where the handoff's store layout, `record.json`, and
  Gate 2 assume a local store, translate them to the cloud location beside
  the saves folder, keep what the reader (the restore tool, #25) needs, and
  keep the ordering rule the decision states: the loser is verified in the
  cloud before the winner replaces it anywhere.
- **Absence is a question** (D-CLOUD-037) — where the handoff says "hold and
  report", the wizard asks instead, with the mass case still refusing.
- **Launch gating extends the shipped guard** (D-CLOUD-038), not a new
  mechanism.
- **The bisync spike is decisive** (D-CLOUD-039): Gate 11 is scored against
  the written contract and is not "informational".
- Cite corpus sources by their declared path and the register by ID; mark
  every remaining hypothesis with the gate that settles it.
- Refer to the run's artifacts by path under
  `research/council-runs/2026-09-05-conflict-resolution-foundation/` so the
  trail is auditable from the tracker.

Write it so a maintainer can paste each section into its issue with at most
a glance. Headings: `## #11 — <title>` for the epic, `## #<n> — <title>` for
each child, then `## Register rows`, `## Document edits`, `## Needs the
maintainer`.

## The consensus plan's handoff section

{INJECTED_HANDOFF}

## Decisions made since, binding

{INJECTED_DECISIONS}

## The vocabulary rule and the two-line rule

{INJECTED_VOCABULARY}

## Current tracker text

{INJECTED_ISSUES}

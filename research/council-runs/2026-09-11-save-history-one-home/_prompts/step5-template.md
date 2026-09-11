# Council -- Step 5: the handoff, as tracker text

The council has settled on a consensus plan; its handoff section is injected
below, verbatim, and it is the specification. The maintainer's decisions of
2026-09-11 (D-CLOUD-095..100, D-UI-039, D-QA-015/017) are binding and are in the
embedded corpus; so is the vocabulary rule (D-UI-022), which governs every string
you write.

Your job is to turn the handoff into **the text the tracker will hold**, so that
whoever picks up each issue builds the change the council chose and nothing else.
The corpus is embedded above, unchanged and hash-verified; the current bodies of
the issues you edit are in it (`issues/22.md`, `issues/23.md`, `issues/25.md`,
`issues/134.md`, `issues/135.md`).

## Anti-self-citation constraint

Write from the substance. Do not describe or characterise the deliberation that
produced it, and do not cite the injected artifacts as evidence about how councils
or models behave.

## What to produce, in this order

1. **The epic body for #134**, rewritten: one paragraph of context; the design in
   one screen (one hidden store inside the saves folder, declared in the README;
   the store-first invariant; the transaction shape; what runs in the exit sync,
   in a full pass, never on the device; the bounds and their priority; shared
   settings; the suspect class and the heal from the stage); the **build order**
   mapped to #22, #23, #25 and any new child the handoff needs; the **ordered
   experiments** table with each one's venue (the GENERIC_X64 pair and the QA
   backends of `issues/133.md` -- never a person's device, D-QA-015) and what it
   unblocks; the time-to-play measurement (#135) as a gate; and the decisions that
   bind, cited by register ID, not restated.
2. **The amendments to #22** (R1-R9), stated row by row as replacement text for
   the rows that change and "unchanged" for the rest; then **#23**'s retention
   settings rows and **#25**'s reader, the same way. Keep each issue's acceptance
   checklist form: `- [ ]` items that are observable behaviour, never artefacts.
   Where the current body says something the plan overturns -- a `-discarded/`
   sibling, "labelled separately", retain-only-on-decision -- replace it and say
   in one line what changed and why, citing the register ID.
3. **The migration issue**, as a new child: what devices hold today, the
   copy-verify-retire order, the legacy event classification, the mixed-version
   boundary, and the rule that no player is asked a question.
4. **The register rows the handoff proposed**, each resolved against the decisions
   already made: which are *already decided* (cite the ID and stop), and the
   wording for any that remain genuinely open, marked as proposals -- IDs are the
   maintainer's to assign.
5. **The document edits list**: the public cloud-sync page's layout table and the
   README text; `docs/es-menu-map.md`'s SAVE MANAGEMENT nest; anything else the
   handoff names.
6. **What still needs the maintainer's word**, if anything survives 1-5.

## Rules for the text

- **Vocabulary per D-UI-022**: settings, saves (game saves, save states, and
  screenshots), ROMs and BIOS; back up and restore; *sync* only for the automatic
  two-way behaviour; earlier versions in the store are "earlier versions" and the
  wizard's kept losers are "discarded saves"; never "system backup", "save data",
  "upload", "everything", "cloud library", "escrow" or "retention store" in a
  string a player reads.
- **Rows are a label and at most one line** (D-UI-023); settings nest (D-UI-039).
- **Every acceptance item is observable behaviour** with its venue named.
- **Cite decisions by ID.** Do not restate an argument the register already holds.
- Markdown, ready to paste into the tracker; each issue body under its own
  `## #<number>` heading.

## The handoff

{INJECTED_HANDOFF}

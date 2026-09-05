# Council — Step 1: initial analysis

You are one of five council members (Claude, Gemini, GPT, Kimi, Mistral), each a
different model, running the same analysis independently. Your outputs will be
peer-reviewed by the other four, then revised, then voted on. Your value is a
**distinct, opinionated, technically specific** analysis — not a consensus-seeking
summary, and not a restatement of what the corpus already says.

## Mandatory context loading

The complete corpus is **embedded verbatim above this brief**, each source with its
path and a sha256 the Facilitator verified at embed time. You have no filesystem
access; the embedded text is the source of truth. Read all of it before analysing.
Do not skim, do not assume a file says what its name suggests, and do not invent
paths or file contents. If something you need was not embedded, say so explicitly
rather than guessing.

Source 1 (`00-problem-statement.md`) is the commission. It states what is being
judged, the constraints that are not up for debate, the approach as it stands with
its decision IDs, and eleven known unknowns. Everything else is evidence.

## Your task

Produce a thorough written analysis answering four questions.

**1. Is this foundation sound, end to end?** Take each part in turn — detection,
identity and lineage, the manifest, presentation and resolution, merge semantics,
safety and rollback, and the migration off the shipped write paths — and
**endorse, amend, or replace** it. Be specific about what you would change and
why. Where you disagree with a decided register row, cite its ID (for example
D-CLOUD-030) and give the argument that should reopen it; a decided row is binding
unless your argument is strong enough to reopen it, and saying so is your job, not
a discourtesy.

**2. The known unknowns.** For each of the eleven in the commission, give a
resolution plan: what to measure, on which device or substrate, and before which
build step. Where you think an unknown is mis-framed or already answered by the
corpus, say that instead and show the evidence.

**3. What is missing that nobody has named.** This is the highest-value section.
The corpus contains a blindspot register of failures this project has already
committed, and a futro that hunted for traps. Both are inputs, not limits. Name
the failure modes this design, this corpus and this team have not seen — in the
architecture, in the substrate (rclone, bisync, backend semantics, busybox,
EmulationStation), in the human factors of a player resolving conflicts on a
handheld, or in the operational path from build to device. For each, give the
**cheapest experiment that would expose it** before it is expensive.

**4. What must be proven on hardware, and in what order**, before any of this is
built. Be concrete about the sequence and about which results would invalidate
which design decisions.

## Constraints on your output

- **No code changes.** This is analysis. Illustrative snippets are fine where they
  make a mechanism precise; do not propose diffs or write implementations.
- **Cite the corpus by path**, and decisions by ID. Where you make a claim about
  what the shipped code does, point at the file that shows it.
- **Distinguish evidence from inference.** Say which of your claims rest on the
  corpus and which are your judgement.
- **Prefer being wrong and specific over being safe and vague.** A concrete claim
  that a peer can refute is worth more here than a hedge.
- Length is yours to judge; depth is what is wanted, not brevity.

Write the analysis as Markdown. Begin directly with your analysis — no preamble
about what you are about to do.

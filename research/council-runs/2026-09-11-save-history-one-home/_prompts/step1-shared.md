# Council -- Step 1: initial analysis

You are one of five council members (Claude, Gemini, GPT, Kimi, Mistral), each a
different model, running the same analysis independently. Your outputs will be
peer-reviewed by the other four, then revised, then voted on. Your value is a
**distinct, opinionated, technically specific** analysis -- not a consensus-seeking
summary, and not a restatement of what the corpus already says.

## Mandatory context loading

The complete corpus is **embedded verbatim above this brief**, each source with its
path and a sha256 the Facilitator verified at embed time. You have no filesystem
access; the embedded text is the source of truth. Read all of it before analysing.
Do not skim, do not assume a file says what its name suggests, and do not invent
paths or file contents. If something you need was not embedded, say so explicitly
rather than guessing.

Source 1 (`00-problem-statement.md`) is the commission. It states what is being
judged -- a **delta** to a plan of record, not the plan -- the constraints that are not
up for debate, and five questions. Everything else is evidence.

## Your task

Answer the commission's five questions, in its order, as a thorough written analysis:

1. **Does the delta weaken any property the plan of record relies on?** Row by row of
   the delta table: endorse, amend, or replace, with the argument. A decided register
   row is binding unless you reopen it by ID with an argument strong enough to do so;
   saying so is your job, not a discourtesy.
2. **Concrete failure modes and ordering hazards**, each with the cheapest experiment
   on the GENERIC_X64 VM and the QA backends that would expose it before it is
   expensive. The commission lists the ones already suspected; the ones nobody has
   named are worth most.
3. **What it costs the time to play**, in round trips and seconds on a handheld's
   Wi-Fi, and what keeps it off the launch path.
4. **Migration** from what devices already hold, with no earlier version lost and no
   question put to a player about our internals.
5. **A simpler shape**, if one exists, that meets the maintainer's constraints and
   beats the delta -- or the statement that the delta is already the simplest, with
   the reasoning.

## Constraints on your output

- **No code changes.** This is analysis. Illustrative snippets are fine where they
  make a mechanism precise; do not propose diffs or write implementations.
- **Cite the corpus by path**, and decisions by ID. Where you make a claim about
  what the shipped code does, point at the excerpt that shows it.
- **Distinguish evidence from inference.** Say which of your claims rest on the
  corpus and which are your judgement.
- **Respect the constraints that are not up for debate** in the commission; argue
  against one only by reopening the row it rests on.
- Write in plain prose with headings for the five questions; tables where they
  make a comparison exact. Length is yours to judge; completeness over brevity, but
  nothing repeated.

#!/usr/bin/env node
// Adapted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/build-council-prompt.ts
// scaffold#524: Node-native imports, verified sibling inputs, recursion rounds.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertGenesis,
  outputsForStep,
  readManifest,
  resolveRunArtifact,
  stepKey,
  type CouncilRunManifest,
} from "./lib/council-verification.ts";
import { COUNCIL_ROOT, assertRunRoster } from "./lib/council-roster.ts";
import { lintRun } from "./lint-council-run.ts";
import { verifyChain } from "./verify-chain.ts";
import { verifySeals } from "./verify-seals.ts";

interface Args {
  runDir: string;
  member: string;
  step: number;
  round: number;
  template?: string;
  out?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = { round: 1 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[++index];
    if (!value || value.startsWith("--")) throw new Error(arg + " requires a value");
    if (arg === "--run-dir") args.runDir = path.resolve(value);
    else if (arg === "--member") args.member = value;
    else if (arg === "--step") args.step = Number(value);
    else if (arg === "--round") args.round = Number(value);
    else if (arg === "--template") args.template = path.resolve(value);
    else if (arg === "--out") args.out = path.resolve(value);
    else throw new Error("unknown option: " + arg);
  }
  if (!args.runDir || !args.member || !args.step || ![1, 2, 3, 4].includes(args.step))
    throw new Error("--run-dir, --member, and --step 1–4 are required");
  stepKey(args.step, args.round);
  return args as Args;
}

function injectionPlan(step: number, round: number) {
  if (step === 1) return null;
  if (step === 2)
    return {
      placeholder: "{INJECTED_ANALYSES}",
      label: round === 1 ? "analyses" : "prior-round revised plans",
      source: round === 1 ? "step1" : stepKey(3, round - 1),
      gate: round === 1 ? "step1" : stepKey(4, round - 1),
    };
  return {
    placeholder: step === 3 ? "{INJECTED_PEER_REVIEWS}" : "{INJECTED_REVISED_PLANS}",
    label: step === 3 ? "peer reviews" : "revised plans",
    source: stepKey(step - 1, round),
    gate: stepKey(step - 1, round),
  };
}

function loadTemplate(args: Args, manifest: CouncilRunManifest): string {
  if (args.template) return fs.readFileSync(args.template, "utf8"); // missing explicit template is an error
  const candidates = [
    ...(args.round > 1
      ? [resolveRunArtifact(args.runDir, "_prompts/step" + args.step + "-r" + args.round + "-template.md")]
      : []),
    ...(args.step === 1 ? [resolveRunArtifact(args.runDir, "_prompts/step1-shared.md")] : []),
    resolveRunArtifact(args.runDir, "_prompts/step" + args.step + "-template.md"),
    path.join(
      COUNCIL_ROOT,
      ".claude/skills/council/references/prompt-templates/step" + args.step + "-template.md"
    ),
  ];
  for (const candidate of candidates)
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, "utf8");
  const plan = injectionPlan(args.step, args.round);
  return (
    "# Council Step " +
    args.step +
    ", round " +
    args.round +
    "\n\nTopic: " +
    (manifest.topic ?? manifest.run_id) +
    "\n\nGive independent reasoning from the supplied sources. Do not write code or treat prior proposals as empirical observations.\n\n" +
    (plan?.placeholder ??
      "The Facilitator must embed the mandatory source manifest for this initial analysis.") +
    "\n"
  );
}

export function renderPrompt(args: Args): string {
  const manifest = readManifest(args.runDir);
  assertRunRoster(manifest);
  assertGenesis(args.runDir, manifest);
  if (!manifest.roster.includes(args.member))
    throw new Error("[FAIL unknown_member] member is not in the locked roster");
  if (outputsForStep(manifest, stepKey(args.step, args.round)).length !== manifest.roster.length)
    throw new Error(
      "[FAIL round_undeclared] declare the complete round before building its prompts"
    );
  const template = loadTemplate(args, manifest);
  const plan = injectionPlan(args.step, args.round);
  if (!plan) return template.endsWith("\n") ? template : template + "\n";
  const findings = [
    ...lintRun(args.runDir, { atStep: plan.gate }),
    ...verifyChain(args.runDir),
    ...verifySeals(args.runDir),
  ];
  if (findings.length)
    throw new Error("[FAIL prior_step_unverified] " + findings.map((item) => item.kind).join(", "));
  const sources = outputsForStep(manifest, plan.source).filter(
    (output) => output.member !== args.member
  );
  if (sources.length !== manifest.roster.length - 1)
    throw new Error("[FAIL sibling_set_incomplete] expected every other member exactly once");
  const injected = sources
    .map((output) => {
      const content = fs.readFileSync(resolveRunArtifact(args.runDir, output.path), "utf8");
      const name = path.basename(output.path);
      return "=== START " + name + " ===\n\n" + content + "\n\n=== END " + name + " ===";
    })
    .join("\n\n");
  // Literal replacement: member output may contain dollar-sign replacement
  // sequences, which must not be interpreted by String.replace.
  // Older round-specific Step 2 templates name revised plans; the generic
  // Step 2 template still names analyses. Both refer to the selected siblings.
  const placeholders = args.step === 2 && args.round > 1
    ? ["{INJECTED_REVISED_PLANS}", plan.placeholder]
    : [plan.placeholder];
  const rendered = placeholders.some((placeholder) => template.includes(placeholder))
    ? placeholders.reduce((text, placeholder) => text.replaceAll(placeholder, () => injected), template)
    : template.trimEnd() + "\n\n## Injected " + plan.label + "\n\n" + injected;
  return rendered.endsWith("\n") ? rendered : rendered + "\n";
}

function main(): number {
  try {
    const args = parseArgs(process.argv.slice(2));
    const prompt = renderPrompt(args);
    if (args.out) {
      const relative = path.relative(args.runDir, args.out).split(path.sep).join("/");
      if (!relative.startsWith("_prompts/"))
        throw new Error(
          "[FAIL output_scope] generated prompts must stay under the run's _prompts/"
        );
      const out = resolveRunArtifact(args.runDir, relative);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, prompt, { flag: "wx" });
      console.log("Wrote " + relative);
    } else process.stdout.write(prompt);
    return 0;
  } catch (error) {
    console.error(
      "[FAIL prompt_build] " + (error instanceof Error ? error.message : "invalid input")
    );
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main());

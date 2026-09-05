#!/usr/bin/env npx tsx
/**
 * Council Prompt Builder (M64.P1.5 E7/C2 #2978)
 *
 * Builds per-step council prompts from a manifest-backed run directory. Steps
 * 2-4 inline the canonical sibling set for the target member and fail closed
 * when any required sibling is missing.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../..") /* rocknix: tools/council/ is two below the repo root */;
const MANIFEST_NAME = "council-run-manifest.json";

type StepNumber = 1 | 2 | 3 | 4;
type StepKey = "step1" | "step2" | "step3" | "step4";

interface ExpectedOutput {
  path: string;
  member: string;
  kind: string;
}

interface CouncilRunManifest {
  run_id: string;
  topic: string;
  roster: string[];
  expected_outputs_per_step: Partial<Record<StepKey, ExpectedOutput[]>>;
}

interface CliArgs {
  step: StepNumber | null;
  member: string | null;
  runDir: string | null;
  out: string | null;
  template: string | null;
}

interface InjectionPlan {
  placeholder: string;
  sourceStep: StepKey;
  description: string;
}

function relativePath(absPath: string): string {
  return path.relative(REPO_ROOT, absPath);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStep(value: string): StepNumber {
  const step = Number.parseInt(value, 10);
  if (![1, 2, 3, 4].includes(step)) {
    throw new Error("--step must be one of 1, 2, 3, or 4");
  }
  return step as StepNumber;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { step: null, member: null, runDir: null, out: null, template: null };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const expectValue = (): string => {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} requires a value`);
      index += 1;
      return value;
    };

    if (arg === "--step") {
      args.step = parseStep(expectValue());
    } else if (arg === "--member") {
      args.member = expectValue();
    } else if (arg === "--run-dir") {
      args.runDir = expectValue();
    } else if (arg === "--out") {
      args.out = expectValue();
    } else if (arg === "--template") {
      args.template = expectValue();
    } else if (arg.startsWith("--")) {
      throw new Error(`unknown flag: ${arg}`);
    } else {
      throw new Error(`unexpected positional argument: ${arg}`);
    }
  }

  if (args.step === null) throw new Error("--step is required");
  if (args.member === null) throw new Error("--member is required");
  if (args.runDir === null) throw new Error("--run-dir is required");
  return args;
}

function readJson(absPath: string): unknown {
  return JSON.parse(fs.readFileSync(absPath, "utf8"));
}

function readManifest(runDir: string): CouncilRunManifest {
  const manifestPath = path.join(runDir, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`[FAIL manifest_missing] ${relativePath(manifestPath)} does not exist`);
  }

  const parsed = readJson(manifestPath);
  if (!isRecord(parsed)) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${relativePath(manifestPath)} root must be an object`
    );
  }

  if (!Array.isArray(parsed.roster) || parsed.roster.some((member) => typeof member !== "string")) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${relativePath(manifestPath)} roster must be an array of strings`
    );
  }
  if (!isRecord(parsed.expected_outputs_per_step)) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] ${relativePath(manifestPath)} expected_outputs_per_step must be an object`
    );
  }

  return parsed as unknown as CouncilRunManifest;
}

function injectionPlan(step: StepNumber): InjectionPlan | null {
  switch (step) {
    case 1:
      return null;
    case 2:
      return {
        placeholder: "{INJECTED_ANALYSES}",
        sourceStep: "step1",
        description: "analyses",
      };
    case 3:
      return {
        placeholder: "{INJECTED_PEER_REVIEWS}",
        sourceStep: "step2",
        description: "peer reviews",
      };
    case 4:
      return {
        placeholder: "{INJECTED_REVISED_PLANS}",
        sourceStep: "step3",
        description: "revised plans",
      };
  }
}

function assertInsideRun(runDir: string, relativeArtifactPath: string): string {
  const absPath = path.resolve(runDir, relativeArtifactPath);
  const relative = path.relative(runDir, absPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`[FAIL path_escape] ${relativeArtifactPath} escapes ${relativePath(runDir)}`);
  }
  return absPath;
}

function expectedOutputsFor(manifest: CouncilRunManifest, step: StepKey): ExpectedOutput[] {
  const outputs = manifest.expected_outputs_per_step[step];
  if (!Array.isArray(outputs)) {
    throw new Error(
      `[FAIL manifest_schema_mismatch] expected_outputs_per_step.${step} must be an array`
    );
  }
  return outputs;
}

function loadTemplate(
  args: CliArgs,
  runDir: string,
  step: StepNumber,
  manifest: CouncilRunManifest
): string {
  const explicitTemplate = args.template ? path.resolve(args.template) : null;
  const runTemplate = path.join(runDir, "_prompts", `step${step}-template.md`);
  const canonicalTemplate = path.join(
    REPO_ROOT,
    ".claude/skills/council/references/prompt-templates",
    `step${step}-template.md`
  );
  const step1Shared = path.join(runDir, "_prompts", "step1-shared.md");

  if (explicitTemplate && fs.existsSync(explicitTemplate))
    return fs.readFileSync(explicitTemplate, "utf8");
  if (step === 1 && fs.existsSync(step1Shared)) return fs.readFileSync(step1Shared, "utf8");
  if (fs.existsSync(runTemplate)) return fs.readFileSync(runTemplate, "utf8");
  if (fs.existsSync(canonicalTemplate)) return fs.readFileSync(canonicalTemplate, "utf8");

  return builtInTemplate(step, manifest.topic, manifest.roster);
}

function builtInTemplate(step: StepNumber, topic: string, roster: string[]): string {
  const rosterList = roster.join(", ");
  if (step === 1) {
    return `# Step 1 — Initial analysis prompt\n\nYou are one council member in the active roster (${rosterList}) deliberating on: ${topic}.\n\nProduce an independent analysis. Do not read prior council-run outputs. Do not write code.\n`;
  }

  const plan = injectionPlan(step);
  const label = plan?.description ?? "inputs";
  return `# Step ${step} — Council prompt\n\nYou are one council member in the active roster (${rosterList}) deliberating on: ${topic}.\n\nRead the injected ${label} below, excluding your own prior output. Produce the Step ${step} artifact for your member.\n\nYou are evaluating PROPOSALS for the technique, not OBSERVATIONS of the run that produced them. Do NOT cite the injected artifacts as empirical evidence about the technique itself. The deliberation's value comes from independent reasoning about the technique on its merits; using the run's artifacts as evidence for the technique's claims is circular.\n\n${plan?.placeholder ?? ""}\n`;
}

function sourceOutputsForMember(params: {
  manifest: CouncilRunManifest;
  runDir: string;
  targetMember: string;
  sourceStep: StepKey;
}): ExpectedOutput[] {
  const sourceOutputs = expectedOutputsFor(params.manifest, params.sourceStep);
  return sourceOutputs.filter((output) => output.member !== params.targetMember);
}

function renderInjectedArtifacts(params: {
  runDir: string;
  targetMember: string;
  sourceOutputs: ExpectedOutput[];
}): string {
  const chunks: string[] = [];
  for (const output of params.sourceOutputs) {
    const absPath = assertInsideRun(params.runDir, output.path);
    if (!fs.existsSync(absPath)) {
      throw new Error(
        `[FAIL required_sibling_missing] ${relativePath(absPath)} is required for member=${params.targetMember}`
      );
    }

    const label = path.basename(output.path);
    const content = fs.readFileSync(absPath, "utf8");
    chunks.push(`=== START ${label} ===\n\n${content.trimEnd()}\n\n=== END ${label} ===`);
  }
  return chunks.join("\n\n");
}

function renderPrompt(args: CliArgs, manifest: CouncilRunManifest, runDir: string): string {
  const targetMember = args.member ?? "";
  if (!manifest.roster.includes(targetMember)) {
    throw new Error(`[FAIL unknown_member] ${targetMember} is not in manifest.roster`);
  }

  const step = args.step ?? 1;
  const template = loadTemplate(args, runDir, step, manifest);
  const plan = injectionPlan(step);
  if (plan === null) return template.endsWith("\n") ? template : `${template}\n`;

  const sourceOutputs = sourceOutputsForMember({
    manifest,
    runDir,
    targetMember,
    sourceStep: plan.sourceStep,
  });

  const expectedCount = Math.max(0, manifest.roster.length - 1);
  if (sourceOutputs.length !== expectedCount) {
    throw new Error(
      `[FAIL sibling_set_incomplete] step=${step} member=${targetMember} expected ${expectedCount} ${plan.description}, found ${sourceOutputs.length}`
    );
  }

  const injected = renderInjectedArtifacts({ runDir, targetMember, sourceOutputs });
  if (template.includes(plan.placeholder)) {
    return template.replace(plan.placeholder, injected).replace(/\n?$/, "\n");
  }

  return `${template.trimEnd()}\n\n## Injected ${plan.description}\n\n${injected}\n`;
}

function main(): void {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`[FAIL local_config_error] ${(err as Error).message}`);
    process.exit(2);
  }

  const runDir = path.resolve(args.runDir ?? "");
  try {
    const manifest = readManifest(runDir);
    const prompt = renderPrompt(args, manifest, runDir);
    if (args.out) {
      const outPath = path.resolve(args.out);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, prompt, "utf8");
      console.log(`Wrote ${relativePath(outPath)}`);
    } else {
      process.stdout.write(prompt);
    }
  } catch (err) {
    const message = (err as Error).message;
    console.error(message.startsWith("[FAIL ") ? message : `[FAIL prompt_build_error] ${message}`);
    process.exit(1);
  }
}

main();

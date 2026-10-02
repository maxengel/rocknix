#!/usr/bin/env node
// Adopted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/write-step-seal.ts
// 2026-09-07, scaffold#524: Node-native TypeScript imports; see docs/planning/council-toolchain-524.md.
/**
 * Council Step Seal Writer (M64.P1.5 E7/H2 #2974)
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { lintRun } from "./lint-council-run.ts";
import { verifyChain } from "./verify-chain.ts";
import { signatureFor, verifySeals } from "./verify-seals.ts";
import {
  canonicalJson,
  canonicalSha256,
  completedVerdictCount,
  expectedVerdictCount,
  isRecord,
  readLedger,
  readManifest,
  readSealKey,
  resolveRunArtifact,
  minimumAssurance,
  stepKey,
} from "./lib/council-verification.ts";

interface CliArgs {
  runDir: string;
  step: string;
}

function parseArgs(argv: string[]): CliArgs {
  let runDir: string | null = null;
  let step: string | null = null;
  let round = 1;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--run-dir") runDir = argv[++index] ?? null;
    else if (arg === "--step") step = argv[++index] ?? null;
    else if (arg === "--round") round = Number(argv[++index]);
    else throw new Error(`[FAIL usage] unknown argument ${arg}`);
  }
  if (!runDir || !step) throw new Error("[FAIL usage] --run-dir and --step are required");
  return { runDir: path.resolve(runDir), step: stepKey(step, round) };
}

function main(): number {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
    const findings = [
      ...lintRun(args.runDir, { atStep: args.step, beforeSeal: true }),
      ...verifyChain(args.runDir),
      ...verifySeals(args.runDir, args.step),
    ];
    if (findings.length)
      throw new Error(
        `[FAIL seal_preflight] ${findings.map((finding) => finding.kind).join(", ")}`
      );
    const manifest = readManifest(args.runDir);
    const entries = readLedger(args.runDir);
    const declaredOutputCount = expectedVerdictCount(manifest, args.step);
    if (declaredOutputCount === 0) {
      throw new Error(`[FAIL step_schema_missing] ${args.step} has no expected outputs`);
    }
    const expectedCount = completedVerdictCount(args.runDir, manifest, args.step, entries);
    if (expectedCount === null) {
      throw new Error(
        `[FAIL seal_verdict_count_short] ${args.step} expected ${declaredOutputCount} completed output verdicts, found ${entries.length} ledger entries`
      );
    }
    const sealedEntries = entries.slice(0, expectedCount);
    const terminal = entries[expectedCount - 1];
    if (!isRecord(terminal))
      throw new Error(`[FAIL ledger_entry_invalid] terminal entry is invalid`);

    const payload = {
      step_n: args.step,
      chain_terminal_sha256: canonicalSha256(terminal),
      verdict_count: expectedCount,
      expected_verdict_count: expectedCount,
      min_assurance_tier: minimumAssurance(sealedEntries),
      min_assurance_tier_across_seats: minimumAssurance(sealedEntries),
    };
    if (payload.min_assurance_tier === null)
      throw new Error("[FAIL seal_assurance_invalid] every verdict needs a known assurance tier");
    const seal = { ...payload, signature: signatureFor(payload, readSealKey(args.runDir)) };
    const sealsDir = resolveRunArtifact(args.runDir, "verification/seals");
    fs.mkdirSync(sealsDir, { recursive: true });
    const sealPath = resolveRunArtifact(args.runDir, `verification/seals/${args.step}.seal.json`);
    if (fs.existsSync(sealPath)) {
      if (canonicalJson(JSON.parse(fs.readFileSync(sealPath, "utf8"))) !== canonicalJson(seal))
        throw new Error(
          "[FAIL seal_conflict] existing seals are immutable; preserve the failure and restart"
        );
      console.error(`Unchanged ${path.relative(process.cwd(), sealPath)}`);
    } else {
      fs.writeFileSync(sealPath, JSON.stringify(seal, null, 2) + "\n", { flag: "wx" });
      console.error(`Wrote ${path.relative(process.cwd(), sealPath)}`);
    }
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main());

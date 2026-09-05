#!/usr/bin/env npx tsx
/**
 * Council Step Seal Writer (M64.P1.5 E7/H2 #2974)
 */

import { createHmac } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  canonicalJson,
  canonicalSha256,
  completedVerdictCount,
  expectedVerdictCount,
  isRecord,
  readLedger,
  readManifest,
} from "./lib/council-verification.js";

type AssuranceTier =
  | "client_telemetry"
  | "local_capture_provider_attested"
  | "corroborated"
  | "provider_signed";

const ASSURANCE_RANK: Record<AssuranceTier, number> = {
  client_telemetry: 0,
  local_capture_provider_attested: 1,
  corroborated: 2,
  provider_signed: 3,
};

function isAssuranceTier(value: unknown): value is AssuranceTier {
  return typeof value === "string" && value in ASSURANCE_RANK;
}

function minAssuranceTier(entries: unknown[]): AssuranceTier | null {
  let minimum: AssuranceTier | null = null;
  for (const entry of entries) {
    if (!isRecord(entry) || !isRecord(entry.final)) {
      continue;
    }
    const tier = entry.final.assurance_tier;
    if (!isAssuranceTier(tier)) {
      continue;
    }
    if (minimum === null || ASSURANCE_RANK[tier] < ASSURANCE_RANK[minimum]) {
      minimum = tier;
    }
  }
  return minimum;
}

interface CliArgs {
  runDir: string;
  step: string;
}

function parseArgs(argv: string[]): CliArgs {
  let runDir: string | null = null;
  let step: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--run-dir") runDir = argv[++index] ?? null;
    else if (arg === "--step") step = argv[++index] ?? null;
    else throw new Error(`[FAIL usage] unknown argument ${arg}`);
  }
  if (!runDir || !step) throw new Error("[FAIL usage] --run-dir and --step are required");
  return { runDir: path.resolve(runDir), step: step.startsWith("step") ? step : `step${step}` };
}

function sealKey(runDir: string): string {
  if (process.env.COUNCIL_SEAL_HMAC_KEY) return process.env.COUNCIL_SEAL_HMAC_KEY;
  const keyPath = path.join(runDir, "verification", "seal-key.local");
  if (fs.existsSync(keyPath)) return fs.readFileSync(keyPath, "utf8").trim();
  throw new Error(
    `[FAIL seal_key_missing] Set COUNCIL_SEAL_HMAC_KEY or create ${path.relative(process.cwd(), keyPath)}`
  );
}

function signatureFor(payload: Record<string, unknown>, key: string): string {
  return `hmac-sha256:${createHmac("sha256", key).update(canonicalJson(payload)).digest("hex")}`;
}

function main(): number {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
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
      min_assurance_tier: minAssuranceTier(sealedEntries),
      min_assurance_tier_across_seats: minAssuranceTier(sealedEntries),
    };
    const seal = { ...payload, signature: signatureFor(payload, sealKey(args.runDir)) };
    const sealsDir = path.join(args.runDir, "verification", "seals");
    fs.mkdirSync(sealsDir, { recursive: true });
    const sealPath = path.join(sealsDir, `${args.step}.seal.json`);
    fs.writeFileSync(sealPath, JSON.stringify(seal, null, 2) + "\n", "utf8");
    console.error(`Wrote ${path.relative(process.cwd(), sealPath)}`);
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

process.exit(main());

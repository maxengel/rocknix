#!/usr/bin/env npx tsx
/**
 * Council Step Seal Verifier (M64.P1.5 E7/H2 #2974)
 */

import { createHmac } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  canonicalJson,
  canonicalSha256,
  completedVerdictCount,
  isLegacyManifest,
  isRecord,
  readLedger,
  readManifest,
} from "./lib/council-verification.js";

interface Finding {
  kind:
    | "seal_missing"
    | "seal_parse_error"
    | "seal_terminal_mismatch"
    | "seal_verdict_count_mismatch"
    | "seal_signature_unverifiable"
    | "seal_signature_mismatch";
  file: string;
  message: string;
  expected?: string | number | null;
  actual?: string | number | null;
}

interface CliArgs {
  strict: boolean;
  json: boolean;
  runDir: string;
}

function parseArgs(argv: string[]): CliArgs {
  const positional: string[] = [];
  let strict = false;
  let json = false;
  for (const arg of argv) {
    if (arg === "--strict") strict = true;
    else if (arg === "--json") json = true;
    else positional.push(arg);
  }
  if (positional.length !== 1) {
    throw new Error("[FAIL usage] verify-seals requires exactly one run directory");
  }
  return { strict, json, runDir: path.resolve(positional[0] ?? ".") };
}

function sealKey(runDir: string): string | null {
  if (process.env.COUNCIL_SEAL_HMAC_KEY) return process.env.COUNCIL_SEAL_HMAC_KEY;
  const keyPath = path.join(runDir, "verification", "seal-key.local");
  if (fs.existsSync(keyPath)) return fs.readFileSync(keyPath, "utf8").trim();
  return null;
}

function signatureFor(payload: Record<string, unknown>, key: string): string {
  return `hmac-sha256:${createHmac("sha256", key).update(canonicalJson(payload)).digest("hex")}`;
}

function payloadWithoutSignature(seal: Record<string, unknown>): Record<string, unknown> {
  const { signature: _signature, ...payload } = seal;
  return payload;
}

function lintRun(runDir: string): Finding[] {
  const findings: Finding[] = [];
  const manifest = readManifest(runDir);
  if (isLegacyManifest(manifest)) return findings;

  const ledger = readLedger(runDir);
  const key = sealKey(runDir);
  const stepKeys = ["step1", "step2", "step3", "step4", "step4_5"].filter((step) => {
    if (!Array.isArray(manifest.expected_outputs_per_step[step])) return false;
    return completedVerdictCount(runDir, manifest, step, ledger) !== null;
  });

  for (const step of stepKeys) {
    const sealPath = path.join(runDir, "verification", "seals", `${step}.seal.json`);
    if (!fs.existsSync(sealPath)) {
      findings.push({
        kind: "seal_missing",
        file: sealPath,
        message: `${step} seal is required for non-legacy council runs`,
      });
      continue;
    }

    let seal: unknown;
    try {
      seal = JSON.parse(fs.readFileSync(sealPath, "utf8"));
    } catch (error) {
      findings.push({
        kind: "seal_parse_error",
        file: sealPath,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    if (!isRecord(seal)) {
      findings.push({ kind: "seal_parse_error", file: sealPath, message: "seal is not an object" });
      continue;
    }

    const expectedCount = completedVerdictCount(runDir, manifest, step, ledger);
    if (expectedCount === null) continue;
    const terminal = ledger[expectedCount - 1];
    const expectedTerminal = terminal ? canonicalSha256(terminal) : null;
    const actualTerminal =
      typeof seal.chain_terminal_sha256 === "string" ? seal.chain_terminal_sha256 : null;
    if (actualTerminal !== expectedTerminal) {
      findings.push({
        kind: "seal_terminal_mismatch",
        file: sealPath,
        message: `${step} seal terminal hash mismatch`,
        expected: expectedTerminal,
        actual: actualTerminal,
      });
    }

    const actualCount = typeof seal.verdict_count === "number" ? seal.verdict_count : null;
    const actualExpectedCount =
      typeof seal.expected_verdict_count === "number" ? seal.expected_verdict_count : null;
    if (actualCount !== expectedCount || actualExpectedCount !== expectedCount) {
      findings.push({
        kind: "seal_verdict_count_mismatch",
        file: sealPath,
        message: `${step} seal verdict count mismatch`,
        expected: expectedCount,
        actual: actualCount ?? actualExpectedCount,
      });
    }

    if (!key) {
      findings.push({
        kind: "seal_signature_unverifiable",
        file: sealPath,
        message:
          "COUNCIL_SEAL_HMAC_KEY or verification/seal-key.local is required to verify seal signatures",
      });
      continue;
    }

    const actualSignature = typeof seal.signature === "string" ? seal.signature : null;
    const expectedSignature = signatureFor(payloadWithoutSignature(seal), key);
    if (actualSignature !== expectedSignature) {
      findings.push({
        kind: "seal_signature_mismatch",
        file: sealPath,
        message: `${step} seal signature mismatch`,
        expected: expectedSignature,
        actual: actualSignature,
      });
    }
  }

  return findings;
}

function printFindings(findings: Finding[], json: boolean): void {
  if (json) {
    console.error(JSON.stringify({ findings }, null, 2));
    return;
  }
  for (const finding of findings) {
    console.error(`[FAIL ${finding.kind}] ${finding.file}: ${finding.message}`);
  }
}

function main(): number {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
    const findings = lintRun(args.runDir);
    if (findings.length > 0) {
      printFindings(findings, args.json);
      return args.strict ? 1 : 0;
    }
    console.error(
      `OK - council step seals verified for ${path.relative(process.cwd(), args.runDir)}`
    );
    return 0;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

process.exit(main());

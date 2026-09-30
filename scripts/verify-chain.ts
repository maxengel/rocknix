#!/usr/bin/env node
// Adopted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/verify-chain.ts
// 2026-09-07, scaffold#524: Node-native TypeScript imports; see docs/planning/council-toolchain-524.md.
/**
 * Council Chain Verifier (M64.P1.5 E7/H2 #2974)
 *
 * Verifies the per-run ledger hash chain produced by scripts/council-invoke.ts.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertRunRoster } from "./lib/council-roster.ts";
import {
  assertGenesis,
  canonicalJson,
  canonicalSha256,
  GENESIS_PATH,
  genesisSha256,
  historicalMixedContract,
  isHistoricalManifest,
  isLegacyManifest,
  isRecord,
  LEDGER_NAME,
  readManifest,
  resolveRunArtifact,
} from "./lib/council-verification.ts";

interface Finding {
  kind:
    | "manifest_error"
    | "ledger_missing"
    | "ledger_parse_error"
    | "ledger_noncanonical"
    | "genesis_missing"
    | "genesis_hash_mismatch"
    | "chain_link_mismatch"
    | "historical_manifest_mixed_contract"
    | "contract_mismatch";
  file: string;
  message: string;
  expected?: string | null;
  actual?: string | null;
  index?: number;
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
    throw new Error("[FAIL usage] verify-chain requires exactly one run directory");
  }
  return { strict, json, runDir: path.resolve(positional[0] ?? ".") };
}

function readLedgerLines(ledgerPath: string): Array<{ line: string; data: unknown }> {
  return fs
    .readFileSync(ledgerPath, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => ({ line, data: JSON.parse(line) }));
}

export function verifyChain(runDir: string): Finding[] {
  const findings: Finding[] = [];
  let manifest;
  try {
    manifest = readManifest(runDir);
    // A historical run is verified against its own contract's evidence, never the installed roster (#944).
    const mixed = historicalMixedContract(manifest);
    if (mixed) {
      findings.push({ kind: "historical_manifest_mixed_contract", file: path.join(runDir, "council-run-manifest.json"), message: mixed });
      return findings;
    }
    if (!isLegacyManifest(manifest) && !isHistoricalManifest(manifest)) {
      assertRunRoster(manifest);
      assertGenesis(runDir, manifest);
    }
  } catch (error) {
    findings.push({
      kind: "manifest_error",
      file: path.join(runDir, "council-run-manifest.json"),
      message: error instanceof Error ? error.message : String(error),
    });
    return findings;
  }

  const ledgerPath = resolveRunArtifact(runDir, LEDGER_NAME);
  if (!fs.existsSync(ledgerPath)) {
    if (!isLegacyManifest(manifest)) {
      findings.push({
        kind: "ledger_missing",
        file: ledgerPath,
        message: `${LEDGER_NAME} is required for non-legacy council runs`,
      });
    }
    return findings;
  }

  const genesisPath = path.join(runDir, GENESIS_PATH);
  const genesisHash = genesisSha256(runDir);
  if (!genesisHash && !isLegacyManifest(manifest)) {
    findings.push({
      kind: "genesis_missing",
      file: genesisPath,
      message: `${GENESIS_PATH} is required for non-legacy council runs`,
    });
  }

  let entries: Array<{ line: string; data: unknown }>;
  try {
    entries = readLedgerLines(ledgerPath);
  } catch (error) {
    findings.push({
      kind: "ledger_parse_error",
      file: ledgerPath,
      message: "ledger contains invalid JSON",
    });
    return findings;
  }
  if (entries.length === 0 && !isLegacyManifest(manifest))
    findings.push({
      kind: "ledger_missing",
      file: ledgerPath,
      message: "ledger contains no verdicts",
    });

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.line !== canonicalJson(entry.data)) {
      findings.push({
        kind: "ledger_noncanonical",
        file: ledgerPath,
        index,
        message: `ledger entry ${index + 1} is not canonical JSON`,
      });
    }

    if (!isRecord(entry.data)) {
      findings.push({
        kind: "ledger_parse_error",
        file: ledgerPath,
        index,
        message: `ledger entry ${index + 1} is not a JSON object`,
      });
      continue;
    }

    if (isHistoricalManifest(manifest) && entry.data.facilitator_version !== manifest.provenance_contract) {
      findings.push({
        kind: "contract_mismatch",
        file: ledgerPath,
        index,
        message: `ledger entry ${index + 1} was written under ${String(entry.data.facilitator_version)}, not the run's ${manifest.provenance_contract}`,
      });
    }

    const actualGenesis =
      typeof entry.data.genesis_sha256 === "string" ? entry.data.genesis_sha256 : null;
    if (genesisHash && actualGenesis !== genesisHash) {
      findings.push({
        kind: "genesis_hash_mismatch",
        file: ledgerPath,
        index,
        message: `ledger entry ${index + 1} genesis hash does not match verification/genesis.json`,
        expected: genesisHash,
        actual: actualGenesis,
      });
    }

    const expectedPrev = index === 0 ? null : canonicalSha256(entries[index - 1]?.data);
    const actualPrev =
      typeof entry.data.prev_verdict_sha256 === "string" || entry.data.prev_verdict_sha256 === null
        ? entry.data.prev_verdict_sha256
        : undefined;
    if (actualPrev !== expectedPrev) {
      findings.push({
        kind: "chain_link_mismatch",
        file: ledgerPath,
        index,
        message: `ledger entry ${index + 1} prev_verdict_sha256 mismatch`,
        expected: expectedPrev,
        actual: actualPrev ?? null,
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
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const findings = verifyChain(args.runDir);
  if (findings.length > 0) {
    printFindings(findings, args.json);
    return 1;
  }

  console.error(
    isLegacyManifest(readManifest(args.runDir))
      ? "Legacy evidence inspected; no current-run assurance claimed."
      : isHistoricalManifest(readManifest(args.runDir))
        ? `Historical evidence (${readManifest(args.runDir).provenance_contract}) chain verified; no current-run assurance claimed.`
        : `OK - council chain verified for ${path.relative(process.cwd(), args.runDir)}`
  );
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main());

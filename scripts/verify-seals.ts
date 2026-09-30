#!/usr/bin/env node
// Adapted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/verify-seals.ts
// scaffold#524: immutable round seals and truncated-ledger refusal.
import { createHmac, timingSafeEqual } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertGenesis,
  canonicalJson,
  canonicalSha256,
  completedVerdictCount,
  historicalMixedContract,
  isHistoricalManifest,
  isLegacyManifest,
  isRecord,
  minimumAssurance,
  orderedSteps,
  readLedger,
  readManifest,
  readSealKey,
  resolveRunArtifact,
} from "./lib/council-verification.ts";
import type { Finding } from "./lint-council-run.ts";
import { assertRunRoster } from "./lib/council-roster.ts";

export function signatureFor(payload: Record<string, unknown>, key: string): string {
  return "hmac-sha256:" + createHmac("sha256", key).update(canonicalJson(payload)).digest("hex");
}

/** Only the current missing seal may be skipped while its writer preflights. */
export function verifySeals(runDir: string, beforeSeal?: string): Finding[] {
  const findings: Finding[] = [];
  try {
    const manifest = readManifest(runDir);
    if (isLegacyManifest(manifest)) return findings;
    // A historical run's seals are checked against its own evidence, never the installed roster (#944).
    const mixed = historicalMixedContract(manifest);
    if (mixed) {
      findings.push({ kind: "historical_manifest_mixed_contract", file: runDir, message: mixed });
      return findings;
    }
    if (!isHistoricalManifest(manifest)) {
      assertRunRoster(manifest);
      assertGenesis(runDir, manifest);
    }
    const ledger = readLedger(runDir);
    const steps = orderedSteps(manifest);
    const key = readSealKey(runDir);
    if (beforeSeal && !steps.includes(beforeSeal)) throw new Error("pre-seal step is not declared");
    const directory = resolveRunArtifact(runDir, "verification/seals");
    if (fs.existsSync(directory))
      for (const name of fs.readdirSync(directory)) {
        if (!name.endsWith(".seal.json") || !steps.includes(name.slice(0, -".seal.json".length)))
          findings.push({
            kind: "unexpected_seal",
            file: name,
            message: "seal is not declared in the run inventory",
          });
      }
    for (const step of steps) {
      const file = resolveRunArtifact(runDir, "verification/seals/" + step + ".seal.json");
      const count = completedVerdictCount(runDir, manifest, step, ledger);
      const exists = fs.existsSync(file);
      if (!exists && count === null) continue;
      if (!exists && step === beforeSeal) continue;
      const fail = (kind: string, message: string) => findings.push({ kind, file, message });
      if (!exists) {
        fail("seal_missing", "completed step has no seal");
        continue;
      }
      // A seal remains evidence even if a later edit deletes verdicts. Never
      // infer the inventory solely from what survived on disk.
      if (count === null) {
        fail("seal_ledger_incomplete", "sealed step no longer has all successful verdicts");
        continue;
      }
      let seal: unknown;
      try {
        seal = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        fail("seal_parse_error", "seal is not valid JSON");
        continue;
      }
      if (!isRecord(seal)) {
        fail("seal_parse_error", "seal must be an object");
        continue;
      }
      if (seal.step_n !== step || seal.chain_terminal_sha256 !== canonicalSha256(ledger[count - 1]))
        fail("seal_terminal_mismatch", "step identity or chain terminal differs");
      if (seal.verdict_count !== count || seal.expected_verdict_count !== count)
        fail("seal_verdict_count_mismatch", "sealed verdict count differs");
      const tier = minimumAssurance(ledger.slice(0, count));
      if (
        tier === null ||
        seal.min_assurance_tier !== tier ||
        seal.min_assurance_tier_across_seats !== tier
      )
        fail("seal_assurance_mismatch", "minimum assurance differs or contains unknown evidence");
      const { signature, ...payload } = seal;
      const expected = signatureFor(payload, key);
      if (
        typeof signature !== "string" ||
        Buffer.byteLength(signature) !== Buffer.byteLength(expected) ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      )
        fail("seal_signature_mismatch", "HMAC signature does not verify with the anchored key");
    }
  } catch (error) {
    findings.push({
      kind: "seal_verification_failed",
      file: runDir,
      message: error instanceof Error ? error.message : "cannot verify seals",
    });
  }
  return findings;
}

function main(): number {
  const args = process.argv.slice(2);
  const positional = args.filter((arg) => !["--strict", "--json"].includes(arg));
  if (positional.length !== 1 || positional[0].startsWith("--")) {
    console.error("[FAIL usage] verify-seals [--strict] [--json] <run-directory>");
    return 1;
  }
  const runDir = path.resolve(positional[0]);
  const findings = verifySeals(runDir);
  if (args.includes("--json")) console.log(JSON.stringify({ findings }, null, 2));
  else if (findings.length)
    for (const item of findings)
      console.error("[FAIL " + item.kind + "] " + item.file + ": " + item.message);
  else
    console.log(
      "OK - seal checks complete; HMAC uses a local key, not provider-signed attestation."
    );
  return findings.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main());

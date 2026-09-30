#!/usr/bin/env node
// Adopted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/verify-pins.ts
// 2026-09-07, scaffold#524: Node-native TypeScript imports; see docs/planning/council-toolchain-524.md.
/**
 * Council verifier pin checker (M64.P1.5 E7/H3 #2975)
 *
 * Two gates:
 *   1. Byte-integrity   — every pinned file hashes to its pinned sha256.
 *   2. Accountability    — any pin whose sha CHANGED vs HEAD (or any new
 *                          pin) must carry a non-empty repin_reason and a
 *                          fresh repinned_at. Closes the silent-re-pin gap:
 *                          a writer can no longer move a pin without
 *                          documenting it in the same diff.
 */

import { verifyPinAccountability, verifyPinnedFiles } from "./lib/verifier-pins.ts";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

function main(): number {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== "--base-ref" || args[1].startsWith("-")))
      throw new Error("[FAIL usage] verify-pins [--base-ref <review-base>]");
    const findings = [
      ...verifyPinnedFiles(),
      ...verifyPinAccountability(process.cwd(), args[1] ?? "HEAD"),
    ];
    if (findings.length === 0) {
      console.error("OK - verifier pins match current files and every re-pin is accountable.");
      return 0;
    }

    for (const finding of findings) {
      console.error(`[FAIL ${finding.code}] ${finding.message}`);
    }
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main());

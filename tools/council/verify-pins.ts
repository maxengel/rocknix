#!/usr/bin/env npx tsx
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

import { verifyPinAccountability, verifyPinnedFiles } from "./lib/verifier-pins.js";

function main(): number {
  try {
    const findings = [...verifyPinnedFiles(), ...verifyPinAccountability()];
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

process.exit(main());

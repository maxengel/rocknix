#!/usr/bin/env node
/**
 * Purpose: Recheck independently selected capability files without executing them.
 * Usage: const verify = await createFilePinCheck({entryPath, expectedSha256, dependencies});
 * Dependency completeness is a reviewed caller contract, never package authority.
 */
import { lstat } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { freezeSources } from "./council-staged-sources.mjs";
import { cloneDerived } from "./council-staged-derived-contract.mjs";

const HASH = /^[a-f0-9]{64}$/;
function need(value, message) {
  if (!value)
    throw Object.assign(new Error(`capability_pin_refused: ${message}`), {
      code: "capability_pin_refused",
    });
}

export async function createFilePinCheck({ entryPath, expectedSha256, dependencies = [] }) {
  const pins = cloneDerived(dependencies, 1_048_576);
  need(typeof entryPath === "string" && HASH.test(expectedSha256), "entry and digest required");
  need(Array.isArray(pins) && pins.length <= 64, "at most 64 dependency pins");
  let total = 0;
  const paths = new Set([resolve(entryPath)]);
  for (const pin of pins) {
    need(
      pin &&
        Object.keys(pin).sort().join() === "byte_length,path,sha256" &&
        typeof pin.path === "string" &&
        pin.path === resolve(pin.path) &&
        HASH.test(pin.sha256) &&
        Number.isSafeInteger(pin.byte_length) &&
        pin.byte_length >= 0 &&
        !paths.has(pin.path),
      "invalid or repeated dependency pin"
    );
    paths.add(pin.path);
    total += pin.byte_length;
    need(total <= 256 * 1024 * 1024, "dependency bytes exceed 256 MiB");
  }
  const filename = resolve(entryPath);
  async function verifyFile(path, sha256, byteLength, maximum) {
    const entry = await lstat(path);
    need(
      entry.isFile() &&
        entry.nlink === 1 &&
        entry.size <= maximum &&
        (byteLength === undefined || entry.size === byteLength),
      "expected an unaliased regular file with its pinned size"
    );
    await freezeSources({
      sourceRoot: dirname(path),
      inputs: [{ id: "pinned-file", path: basename(path), sha256, byte_length: entry.size }],
      limits: {
        max_source_bytes: Math.max(entry.size, 1),
        max_total_bytes: Math.max(entry.size, 1),
        max_sources: 1,
        max_chunks: 1,
        max_assessments: 1,
      },
    });
  }
  const verify = async () => {
    await verifyFile(filename, expectedSha256, undefined, 1_048_576);
    for (const pin of pins)
      await verifyFile(pin.path, pin.sha256, pin.byte_length, 256 * 1024 * 1024);
  };
  await verify();
  return verify;
}

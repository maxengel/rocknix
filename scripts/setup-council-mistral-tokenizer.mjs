#!/usr/bin/env node
/**
 * Explicitly install the pinned publisher tokenizer for offline council counting.
 * Usage: node scripts/setup-council-mistral-tokenizer.mjs --destination /absolute/path/tekken.json
 * Downloads a public artifact only during setup; the counter never calls this.
 */
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute } from "node:path";

const URL =
  "https://huggingface.co/mistralai/Mistral-Large-3-675B-Instruct-2512/resolve/383ffea2c7d60dfd44ca960e8e691709d4fdb9cd/tekken.json";
const SHA256 =
  "e29d19ea32eb7e26e6c0572d57cb7f9eca0f4420e0e0fe6ae1cf3be94da1c0d6";
const BYTE_LENGTH = 16753777;
const TIMEOUT_MS = 120000;

function fail(code) {
  throw Object.assign(new Error(code), { setupCode: code });
}

function verify(bytes) {
  if (
    bytes.byteLength !== BYTE_LENGTH ||
    createHash("sha256").update(bytes).digest("hex") !== SHA256
  ) {
    fail("tokenizer_digest_mismatch");
  }
}

async function existing(destination) {
  let stat;
  try {
    stat = await lstat(destination);
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
  if (!stat.isFile() || stat.nlink !== 1 || stat.size !== BYTE_LENGTH) {
    fail("invalid_existing_tokenizer");
  }
  verify(await readFile(destination));
  return true;
}

try {
  const args = process.argv.slice(2);
  const destination = args[1];
  if (
    args.length !== 2 ||
    args[0] !== "--destination" ||
    !isAbsolute(destination) ||
    basename(destination) !== "tekken.json"
  ) {
    fail("usage_requires_absolute_tekken_json_destination");
  }
  let reused = await existing(destination);
  if (!reused) {
    const response = await fetch(URL, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok || !response.body) fail("tokenizer_download_failed");
    const chunks = [];
    let bytesReceived = 0;
    for await (const chunk of response.body) {
      bytesReceived += chunk.byteLength;
      if (bytesReceived > BYTE_LENGTH) fail("tokenizer_size_exceeded");
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks, bytesReceived);
    verify(bytes);
    await mkdir(dirname(destination), { recursive: true });
    try {
      await writeFile(destination, bytes, { flag: "wx", mode: 0o600 });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      reused = await existing(destination);
      if (!reused) fail("tokenizer_install_conflict");
    }
  }
  process.stdout.write(
    JSON.stringify({
      ok: true,
      artifact_sha256: SHA256,
      artifact_byte_length: BYTE_LENGTH,
      reused,
    }) + "\n",
  );
} catch (error) {
  process.stderr.write(
    JSON.stringify({
      ok: false,
      code: error.setupCode ?? "tokenizer_setup_failed",
    }) + "\n",
  );
  process.exitCode = 1;
}

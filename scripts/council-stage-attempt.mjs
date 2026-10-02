#!/usr/bin/env node
// Purpose: Prepare a durable attempt or capture/verify an existing raw receipt.
// Usage: npx tsx scripts/council-stage-attempt.mjs prepare --spec FILE
//   --counter-module FILE --counter-sha256 HASH --config-output FILE
//        node scripts/council-stage-attempt.mjs capture|verify --config FILE
// This CLI never dispatches a provider request or accepts member reading.
import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { dirname, isAbsolute, parse, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig } from "./council-stage-sources.mjs";
import {
  captureAttempt,
  verifyAttemptCapture,
  verifyAttemptIntent,
} from "./lib/council-staged-attempt-store.mjs";

const HELP =
  "Usage: council-stage-attempt.mjs prepare --spec FILE --counter-module FILE --counter-sha256 HASH --config-output FILE | capture|verify --config FILE";

function parseArgs(argv) {
  const [verb, ...args] = argv;
  if (!["prepare", "capture", "verify"].includes(verb)) throw new Error(HELP);
  const allowed =
    verb === "prepare" ? ["spec", "counter-module", "counter-sha256", "config-output"] : ["config"];
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.slice(2);
    if (
      !args[i]?.startsWith("--") ||
      !allowed.includes(key) ||
      opts[key] !== undefined ||
      !args[i + 1] ||
      args[i + 1].startsWith("--")
    ) {
      throw new Error(HELP);
    }
    opts[key] = args[i + 1];
  }
  if (allowed.some((key) => !opts[key])) throw new Error(HELP);
  return { verb, opts };
}

function within(parent, child) {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

async function checkConfigDestination(filename, spec) {
  const target = resolve(filename);
  const root = resolve(spec.controlled_root);
  const preparation = resolve(root, spec.preparation.logical_root);
  if (within(resolve(root, ".council-attempts"), target) || within(preparation, target)) {
    throw new Error(
      "unsafe_path: caller configuration must be outside preparation and attempt records"
    );
  }
  let current = parse(target).root;
  for (const component of relative(current, dirname(target)).split(sep).filter(Boolean)) {
    current = resolve(current, component);
    const entry = await lstat(current);
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error("unsafe_path: configuration parent must be an existing unaliased directory");
    }
  }
  try {
    await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return target;
    throw error;
  }
  throw new Error("attempt_conflict: configuration destination already exists");
}

async function writeConfigExclusive(target, config) {
  const file = await open(
    target,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await file.writeFile(JSON.stringify(config, null, 2) + "\n", "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  const directory = await open(
    dirname(target),
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW
  );
  try {
    await directory.sync();
  } finally {
    await directory.close();
  }
}

function verificationArgs(config) {
  return {
    controlledRoot: config.controlled_root,
    attemptRoot: config.attempt_root,
    expectedIntentSha256: config.expected_intent_sha256,
    expectedPlanSha256: config.expected_plan_sha256,
    expectedScope: config.expected_scope,
    expectedOwnerId: config.expected_owner_id,
    expectedNodeId: config.expected_node_id,
  };
}

export async function run(argv) {
  const { verb, opts } = parseArgs(argv);
  if (verb !== "prepare") {
    const expected = verificationArgs(await readConfig(opts.config));
    const capture =
      verb === "verify"
        ? await verifyAttemptCapture(expected)
        : await captureAttempt({ handle: await verifyAttemptIntent(expected) });
    // Keep the self-digested record byte-for-byte representable: command
    // metadata belongs outside the schema whose self-digest we just verified.
    return { state: capture.state, capture, reading_accepted: false, provider_dispatched: false };
  }
  const spec = await readConfig(opts.spec);
  const destination = await checkConfigDestination(opts["config-output"], spec);
  const { prepareStagedAttempt, loadTrustedCounter } =
    await import("./lib/council-staged-invocation.ts");
  const counter = await loadTrustedCounter({
    modulePath: resolve(opts["counter-module"]),
    expectedSha256: opts["counter-sha256"],
  });
  const prepared = await prepareStagedAttempt({ spec, counter });
  // A config publication failure leaves the durable intent untouched, without a
  // dispatch. Preserve that evidence and choose a fresh attempt after inspection.
  await writeConfigExclusive(destination, prepared.invoker_config);
  return {
    state: "intent_prepared",
    attempt_root: prepared.invoker_config.attempt_root,
    intent_sha256: prepared.intent.intent_sha256,
    config_path: destination,
    output_path: prepared.output_path,
    provenance_path: prepared.provenance_path,
    source_manifest_path: prepared.source_manifest_path,
    reading_accepted: false,
    provider_dispatched: false,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).then(
    (record) => console.log(JSON.stringify(record)),
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    }
  );
}

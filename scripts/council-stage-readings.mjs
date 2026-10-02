#!/usr/bin/env node
/**
 * Purpose: Create, accept and reverify bounded initial council readings.
 * Usage: npx tsx scripts/council-stage-readings.mjs <create|accept|verify> [flags]
 * Independent config and note-counter pins are required. No verb dispatches a provider.
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig } from "./council-stage-sources.mjs";
import { loadTrustedNoteCounter } from "./lib/council-staged-note-counter.mjs";

const COUNTER_FLAGS = ["note-counter-module", "note-counter-sha256"];
const MODES = {
  create: ["config", "policy", ...COUNTER_FLAGS],
  accept: ["config", "attempt-id", "node-id", ...COUNTER_FLAGS],
  verify: ["config", ...COUNTER_FLAGS],
};

function usage(message) {
  throw Object.assign(new Error(message), { code: "reading_cli_usage" });
}

function parseArgs(argv) {
  if (!Array.isArray(argv) || argv.some((value) => typeof value !== "string"))
    usage("Reading arguments must be strings");
  const [verb, ...args] = argv;
  if (!Object.hasOwn(MODES, verb))
    usage("Usage: council-stage-readings.mjs create|accept|verify [flags]");
  const required = MODES[verb];
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const name = flag.startsWith("--") ? flag.slice(2) : "";
    if (!required.includes(name) || Object.hasOwn(options, name))
      usage("Unsupported or duplicate reading flag");
    const value = args[index + 1];
    if (!value || !value.trim() || value.startsWith("--")) usage(`Missing value for --${name}`);
    options[name] = value;
  }
  if (required.some((name) => !Object.hasOwn(options, name)))
    usage(`Required ${verb} flags: ${required.map((name) => `--${name}`).join(" ")}`);
  return { verb, options };
}

export async function run(argv) {
  const { verb, options } = parseArgs(argv);
  const config = await readConfig(options.config);
  const policy = verb === "create" ? await readConfig(options.policy) : undefined;
  const counter = await loadTrustedNoteCounter({
    modulePath: resolve(options["note-counter-module"]),
    expectedSha256: options["note-counter-sha256"],
  });
  const readings = await import("./lib/council-staged-readings.ts");
  if (verb === "create") return readings.createReadingPolicy({ config, policy, counter });
  if (verb === "accept")
    return readings.acceptInitialReading({
      config,
      attemptId: options["attempt-id"],
      nodeId: options["node-id"],
      counter,
    });
  return readings.inspectReadings({ config, counter });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).then(
    (record) => console.log(JSON.stringify(record)),
    (error) => {
      const code =
        typeof error?.code === "string" && /^[a-z][a-z0-9_]{0,63}$/u.test(error.code)
          ? error.code
          : "reading_refused";
      // Parser/library errors can include source excerpts; expose no raw note or prompt text.
      console.error(
        JSON.stringify({
          state: "refused",
          code,
          error:
            code === "reading_cli_usage"
              ? error.message
              : "Reading operation refused; verify the independent inputs, evidence and pins.",
        })
      );
      process.exitCode = 1;
    }
  );
}

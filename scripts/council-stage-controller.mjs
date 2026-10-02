#!/usr/bin/env node
/**
 * Purpose: Create, inspect and execute a bounded staged-controller plan.
 * Usage: npx tsx scripts/council-stage-controller.mjs <create|verify|prepare|run|reconcile|next> [flags]
 * Independent config/module pins are required. Only run invokes the canonical provider path.
 */
import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { dirname, isAbsolute, parse, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { readConfig } from "./council-stage-sources.mjs";

const MODES = {
  create: { required: ["config", "policy", "spend-module", "spend-sha256"], optional: [] },
  verify: { required: ["config"], optional: [] },
  prepare: {
    required: [
      "config",
      "spec",
      "counter-module",
      "counter-sha256",
      "spend-module",
      "spend-sha256",
      "config-output",
    ],
    optional: ["previous-attempt", "replay-ambiguous"],
  },
  run: {
    required: [
      "config",
      "prompt-file",
      "counter-module",
      "counter-sha256",
      "spend-module",
      "spend-sha256",
    ],
    optional: ["system-prompt-file"],
  },
  reconcile: { required: ["config", "attempt-id"], optional: ["acknowledge-stopped"] },
  next: { required: ["config", "node-id"], optional: ["previous-attempt", "replay-ambiguous"] },
};
function parseArgs(argv) {
  const [verb, ...args] = argv;
  const mode = MODES[verb];
  if (!mode)
    throw new Error(
      "Usage: council-stage-controller.mjs create|verify|prepare|run|reconcile|next [flags]"
    );
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const name = args[i]?.startsWith("--") ? args[i].slice(2) : "";
    if (![...mode.required, ...mode.optional].includes(name) || Object.hasOwn(options, name))
      throw new Error("Unsupported or duplicate controller flag");
    if (name === "replay-ambiguous" || name === "acknowledge-stopped") {
      options[name] = true;
      continue;
    }
    const value = args[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${name}`);
    options[name] = value;
  }
  if (mode.required.some((name) => !options[name]))
    throw new Error(
      `Required ${verb} flags: ${mode.required.map((name) => `--${name}`).join(" ")}`
    );
  if (options["replay-ambiguous"] && !options["previous-attempt"])
    throw new Error("Explicit ambiguous replay requires its previous attempt ID");
  return { verb, options };
}
function within(parent, child) {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}
async function destination(filename, spec) {
  const target = resolve(filename);
  for (const root of [
    resolve(spec.controlled_root, ".council-attempts"),
    resolve(spec.controlled_root, ".council-controllers"),
    resolve(spec.controlled_root, ".council-readings"),
    resolve(spec.controlled_root, spec.preparation.logical_root),
  ])
    if (within(root, target))
      throw new Error(
        "unsafe_path: config must be outside controlled preparation, attempts and journal"
      );
  let current = parse(target).root;
  for (const component of relative(current, dirname(target)).split(sep).filter(Boolean)) {
    current = resolve(current, component);
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error("unsafe_path: config ancestors must be real existing directories");
  }
  try {
    await lstat(target);
  } catch (error) {
    if (error.code === "ENOENT") return target;
    throw error;
  }
  throw new Error("controller_conflict: config destination already exists");
}
async function writeConfig(filename, config) {
  const file = await open(
    filename,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o600
  );
  try {
    await file.writeFile(`${JSON.stringify(config, null, 2)}\n`, "utf8");
    await file.sync();
  } finally {
    await file.close();
  }
  const dir = await open(
    dirname(filename),
    constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW
  );
  try {
    await dir.sync();
  } finally {
    await dir.close();
  }
}
export async function run(argv) {
  const { verb, options: opts } = parseArgs(argv);
  const config = await readConfig(opts.config);
  const controller = await import("./lib/council-staged-controller.ts");
  if (verb === "verify") return controller.inspectControlledPlan(config);
  if (verb === "reconcile")
    return controller.reconcileControlledAttempt({
      config,
      attemptId: opts["attempt-id"],
      acknowledgeStopped: opts["acknowledge-stopped"] === true,
    });
  if (verb === "next")
    return {
      ...(await controller.decideNextControlledAttempt({
        config,
        nodeId: opts["node-id"],
        previousAttemptId: opts["previous-attempt"],
        explicitAmbiguousReplay: opts["replay-ambiguous"] === true,
      })),
      reading_accepted: false,
      provider_dispatched: false,
    };
  if (verb === "run")
    return controller.runControlledAttempt({
      configPath: resolve(opts.config),
      promptFile: resolve(opts["prompt-file"]),
      ...(opts["system-prompt-file"]
        ? { systemPromptFile: resolve(opts["system-prompt-file"]) }
        : {}),
      counterModule: resolve(opts["counter-module"]),
      counterSha256: opts["counter-sha256"],
      spendModule: resolve(opts["spend-module"]),
      spendSha256: opts["spend-sha256"],
    });
  const evaluator = await controller.loadTrustedSpendEvaluator({
    modulePath: resolve(opts["spend-module"]),
    expectedSha256: opts["spend-sha256"],
  });
  if (verb === "create")
    return controller.createControlledPlan({
      config,
      policy: await readConfig(opts.policy),
      evaluator,
    });
  const spec = await readConfig(opts.spec);
  const output = await destination(opts["config-output"], spec);
  const { loadTrustedCounter } = await import("./lib/council-staged-invocation.ts");
  const counter = await loadTrustedCounter({
    modulePath: resolve(opts["counter-module"]),
    expectedSha256: opts["counter-sha256"],
  });
  const prepared = await controller.prepareControlledAttempt({
    config,
    spec,
    counter,
    evaluator,
    previousAttemptId: opts["previous-attempt"],
    explicitAmbiguousReplay: opts["replay-ambiguous"] === true,
  });
  await writeConfig(output, prepared.invoker_config);
  return {
    state: "attempt_reserved",
    config_path: output,
    intent_sha256: prepared.intent.intent_sha256,
    reservation_sha256: prepared.reservation.event_sha256,
    attempt_root: prepared.invoker_config.attempt_root,
    output_path: prepared.output_path,
    provenance_path: prepared.provenance_path,
    source_manifest_path: prepared.source_manifest_path,
    reading_accepted: false,
    provider_dispatched: false,
  };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).then(
    (record) => {
      console.log(JSON.stringify(record));
      if (Number.isInteger(record.exit_code) && record.exit_code !== 0)
        process.exitCode = record.exit_code;
    },
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    }
  );
}

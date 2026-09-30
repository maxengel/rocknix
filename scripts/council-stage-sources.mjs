#!/usr/bin/env node
/**
 * Prepare exact source slices without dispatching a council or accepting reading.
 * Usage: npx tsx scripts/council-stage-sources.mjs prepare --spec spec.json
 *          --counter-module reviewed-counter.mjs --counter-sha256 SHA256
 *        node scripts/council-stage-sources.mjs verify --root ROOT
 *          --logical-root RELATIVE_PATH --scope scope.json --plan-sha256 SHA256
 * A counter module is trusted executable code explicitly selected by the operator,
 * never by the source manifest. Its SHA-256 is checked before import. It must export
 * `counter` with the interface documented in council-staged-request.ts.
 */
import { lstat, open } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { freezeSources, planInitialReads, sha256Bytes } from "./lib/council-staged-sources.mjs";
import { materializePreparation, verifyPreparation } from "./lib/council-staged-store.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HELP =
  "Usage: council-stage-sources.mjs prepare --spec FILE --counter-module FILE --counter-sha256 HASH | verify --root ROOT --logical-root PATH --scope FILE --plan-sha256 HASH";

/** Config is caller-supplied; still reject ambiguous keys and unbounded files. */
export async function readConfig(filename, { maxBytes = 4 * 1024 * 1024 } = {}) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 16 * 1024 * 1024) {
    throw new Error("invalid_source: configuration read limit must be at most 16 MiB");
  }
  const handle = await open(
    resolve(filename),
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK
  );
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1 || before.size > maxBytes) {
      throw new Error(
        `invalid_source: configuration must be an unaliased regular file of at most ${maxBytes / 1024 / 1024} MiB`
      );
    }
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (!bytesRead) throw new Error("source_drift: configuration shortened during reading");
      offset += bytesRead;
    }
    const after = await handle.stat();
    if (
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      before.ctimeMs !== after.ctimeMs
    ) {
      throw new Error("source_drift: configuration changed during reading");
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parsed = JSON.parse(text); // Validate grammar before scanning object keys.
    const stack = [];
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === "{") stack.push(new Set());
      else if (c === "[") stack.push(null);
      else if (c === "}" || c === "]") stack.pop();
      else if (c === '"') {
        const start = i++;
        while (text[i] !== '"') {
          if (text[i] === "\\") i++;
          i++;
        }
        let next = i + 1;
        while (/\s/.test(text[next] ?? "") && next < text.length) next++;
        if (text[next] === ":") {
          const key = JSON.parse(text.slice(start, i + 1));
          const keys = stack[stack.length - 1];
          if (keys.has(key)) throw new Error("invalid_source: duplicate configuration key");
          keys.add(key);
        }
      }
    }
    return parsed;
  } finally {
    await handle.close();
  }
}

function parseArgs(argv) {
  const [verb, ...args] = argv;
  if (!["prepare", "verify"].includes(verb)) throw new Error(HELP);
  const allowed =
    verb === "prepare"
      ? ["spec", "counter-module", "counter-sha256"]
      : ["root", "logical-root", "scope", "plan-sha256"];
  const opts = {};
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i]?.slice(2);
    if (
      !args[i]?.startsWith("--") ||
      !allowed.includes(name) ||
      opts[name] !== undefined ||
      !args[i + 1] ||
      args[i + 1].startsWith("--")
    )
      throw new Error(HELP);
    opts[name] = args[i + 1];
  }
  if (allowed.some((k) => !opts[k]))
    throw new Error(verb === "prepare" ? "budget_unverified: " + HELP : HELP);
  return { verb, opts };
}

export async function run(argv) {
  const { verb, opts } = parseArgs(argv);
  if (verb === "verify") {
    return verifyPreparation({
      controlledRoot: resolve(opts.root),
      logicalRoot: opts["logical-root"],
      expectedScope: await readConfig(opts.scope),
      expectedPlanSha256: opts["plan-sha256"],
    });
  }
  const spec = await readConfig(opts.spec);
  if (
    typeof spec.controlled_root !== "string" ||
    resolve(spec.controlled_root) !== resolve(__dirname, "..")
  ) {
    throw new Error(
      "unsafe_path: controlled_root must be the installed Facilitator repository root"
    );
  }
  if (spec.counter_module !== undefined || spec.counter !== undefined) {
    throw new Error("budget_unverified: source specifications cannot select executable counters");
  }
  if (typeof spec.user_prompt !== "string" || !Array.isArray(spec.controls)) {
    throw new Error("invalid_source: spec requires exact user_prompt text and ordered controls");
  }
  const sources = await freezeSources({
    sourceRoot: resolve(spec.source_root),
    inputs: spec.sources,
    limits: spec.limits,
  });
  const frozenControls = spec.controls.length
    ? await freezeSources({
        sourceRoot: resolve(spec.source_root),
        inputs: spec.controls,
        limits: spec.limits,
      })
    : [];
  const controls = frozenControls.map((file, i) => ({
    path: `${spec.logical_root}/controls/control-${String(i + 1).padStart(6, "0")}.txt`,
    bytes: file.bytes,
    sha256: file.sha256,
  }));
  const counterPath = resolve(opts["counter-module"]);
  const counterEntry = await lstat(counterPath);
  if (!counterEntry.isFile() || counterEntry.nlink !== 1 || counterEntry.size > 1048576) {
    throw new Error("invalid_source: counter must be an unaliased regular file of at most 1 MiB");
  }
  const [frozenCounter] = await freezeSources({
    sourceRoot: dirname(counterPath),
    inputs: [
      {
        id: "counter",
        path: basename(counterPath),
        sha256: opts["counter-sha256"],
        byte_length: counterEntry.size,
      },
    ],
    limits: {
      max_source_bytes: 1048576,
      max_total_bytes: 1048576,
      max_sources: 1,
      max_chunks: 1,
      max_assessments: 1,
    },
  });
  const counterBytes = frozenCounter.bytes;
  if (sha256Bytes(counterBytes) !== opts["counter-sha256"])
    throw new Error("source_drift: counter module changed");
  const { counter } = await import(pathToFileURL(counterPath).href);
  if (counter?.identity?.artifact_sha256 !== opts["counter-sha256"]) {
    throw new Error("budget_unverified: counter identity must bind the selected module hash");
  }
  const { createCanonicalRequestAssessor } = await import(
    resolve(__dirname, "lib/council-staged-request.ts")
  );
  const assessor = await createCanonicalRequestAssessor({
    seats: spec.seats,
    userPrompt: spec.user_prompt,
    systemPrompt: spec.system_prompt ?? null,
    counter,
  });
  const { plan, files } = await planInitialReads({
    scope: spec.scope,
    sources,
    controls,
    logicalRoot: spec.logical_root,
    seats: assessor.seats,
    limits: spec.limits,
    assessRequest: assessor.assessRequest,
  });
  return materializePreparation({
    controlledRoot: resolve(spec.controlled_root),
    logicalRoot: spec.logical_root,
    plan,
    files,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2))
    .then((record) => {
      console.log(
        JSON.stringify({
          state: record.state,
          plan_sha256: record.plan_sha256,
          files: record.files.length,
          reading_accepted: false,
        })
      );
    })
    .catch((error) => {
      console.error(`${error.code ?? "preparation_error"}: ${error.message}`);
      process.exitCode = 1;
    });
}

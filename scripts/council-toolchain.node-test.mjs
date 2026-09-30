// Offline synthetic fixtures only. No provider, keyring, network, or live forge calls.
// .node-test.mjs keeps consumer Vitest/Jest discovery from collecting node:test suites.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHmac } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  catalogFindings,
  declarationFindings,
  readRoster,
  readSnapshot,
  rosterIdentity,
  seatModelMatches,
  validateRoster,
  assertRunRoster,
  readPreliminaryReviewContract,
  assertPreliminaryReviewContract,
} from "./lib/council-roster.ts";
import {
  canonicalJson,
  canonicalSha256,
  sha256Hex,
  orderedSteps,
  outputsForStep,
  readManifest,
} from "./lib/council-verification.ts";
import { REQUIRED_PINS, verifyPinAccountability, verifyPinnedFiles } from "./lib/verifier-pins.ts";
import {
  FACILITATOR_VERSION,
  OPENROUTER_RECIPES,
  openRouterModelMatches,
  OPENROUTER_SEATS,
  SHADOW_OPENROUTER_SEATS,
} from "./council-invoke.ts";
import { machineGitArgs } from "./council-run-start.ts";
import { attemptTokenUsage } from "./council-run-summary.ts";

test("summary preserves unavailable Facilitator usage and supports older provider-only records", () => {
  const usage = { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 };
  assert.equal(attemptTokenUsage({ tokens: null, usage, usage_unavailable: "usage_absent" }), null);
  assert.equal(attemptTokenUsage({ tokens: false, usage }), null);
  assert.equal(attemptTokenUsage({ tokens: { in: 7, out: 3 }, usage }), null);
  assert.deepEqual(attemptTokenUsage({ tokens: { prompt: 11, completion: 5, total: 16 }, usage }),
    { prompt: 11, completion: 5, total: 16 });
  assert.deepEqual(attemptTokenUsage({ usage }), { prompt: 7, completion: 3, total: 10 });
});

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, ".work");
const roster = readRoster();
const members = Object.keys(roster.members);
// scaffold#917: the fake transport names a served provider the way OpenRouter does, keyed by
// the request's model: a pinned seat's first admitted name, a synthetic host for an unpinned one.
const SYNTHETIC_UNPINNED_PROVIDER = "Synthetic Unpinned Host";
const SERVED_BY_MODEL = Object.fromEntries(
  Object.values(OPENROUTER_RECIPES).map((recipe) => [
    recipe.buildBody({ userPrompt: "", systemPrompt: null, maxTokens: 1, transport: "buffered" })
      .model,
    recipe.servedProviders?.[0] ?? SYNTHETIC_UNPINNED_PROVIDER,
  ])
);
const node = process.execPath;
const json = (file) => JSON.parse(readFileSync(file, "utf8"));
const writeJson = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
const env = {
  ...process.env,
  OPENROUTER_API_KEY: ["synthetic", "test", "key", "not", "valid"].join("-"),
};
delete env.COUNCIL_SEAL_HMAC_KEY;
delete env.NODE_TEST_CONTEXT;
delete env.NODE_OPTIONS;

function invoke(root, script, args = [], extra = {}) {
  return spawnSync(node, [script, ...args], {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: 15000,
    ...extra,
  });
}
function ok(result) {
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result;
}
function fails(result, expression) {
  assert.notEqual(result.status, 0, "must fail closed");
  if (expression) assert.match(result.stdout + result.stderr, expression);
  return result;
}

function fixture(t, profile = "definitive", nested = false) {
  const roster = readRoster(ROOT, profile);
  const members = Object.keys(roster.members);
  mkdirSync(WORK, { recursive: true });
  const root = mkdtempSync(path.join(WORK, "council-synthetic-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const file of new Set([
    ...REQUIRED_PINS,
    ...Object.keys(json(path.join(ROOT, "verifier-pins.json")).pins),
    "verifier-pins.json",
    ".gitignore",
    "seed/corpus/manifest.json",
  ])) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    copyFileSync(path.join(ROOT, file), path.join(root, file));
  }
  // A fresh consumer owns its ignore policy. Declare this fixture's ignored
  // scratch directory explicitly instead of inheriting Scaffold's .work rule.
  const ignore = path.join(root, ".gitignore");
  writeFileSync(
    ignore,
    readFileSync(ignore, "utf8") + "\n# Synthetic fixture scratch only\n.work/\n"
  );
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.name", "Synthetic Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "commit.gpgsign", "false");
  git("config", "core.hooksPath", "/dev/null");
  git("commit", "-q", "--allow-empty", "-m", "test: synthetic fixture root");
  const runId = nested ? "2026-09-25-synthetic-research/phase-4-deliberation" : "synthetic-run";
  const run = path.join(root, nested ? "research/council-research" : "research/council-runs", runId);
  mkdirSync(run, { recursive: true });
  const manifest = {
    schema_version: "council-run-manifest@1.0.0",
    run_id: runId,
    created_at: new Date().toISOString(),
    topic: "SYNTHETIC OFFLINE FIXTURE — NOT COUNCIL EVIDENCE",
    provenance_contract: FACILITATOR_VERSION,
    roster: members,
    roster_contract: rosterIdentity(root, profile),
    council_profile: profile,
    ...(profile === "definitive"
      ? {}
      : {
          experiment: {
            schema_version: "council-experiment@1.0.0",
            campaign_id: "synthetic-campaign",
            baseline_run_id: "synthetic-definitive-run",
            decision_authority: "non-binding",
          },
        }),
    coordinator: {
      harness: "synthetic-test",
      requested_model: "none",
      observed_model: null,
      observation: "unverified",
      voting: false,
    },
    expected_outputs_per_step: {},
  };
  const addRound = (round = 1) => {
    for (const [step, dir, suffix] of [
      [1, "", "-analysis"],
      [2, "peer_reviews/", "_peer_review"],
      [3, "revised_approaches/", "-revised_plan"],
      [4, "peer_votes/", "_vote"],
    ]) {
      if (round > 1 && step === 1) continue;
      const key = "step" + step;
      manifest.expected_outputs_per_step[key] ??= [];
      manifest.expected_outputs_per_step[key].push(
        ...members.map((member) => ({
          member,
          kind: "synthetic-step-" + step,
          path: dir + member + suffix + (round > 1 ? "-r" + round : "") + ".md",
        }))
      );
    }
    writeJson(path.join(run, "council-run-manifest.json"), manifest);
  };
  addRound();
  const start = () => invoke(root, "scripts/council-run-start.ts", ["--run-dir", run, "--no-push"]);
  const ledger = () =>
    existsSync(path.join(run, "ledger.jsonl"))
      ? readFileSync(path.join(run, "ledger.jsonl"), "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map(JSON.parse)
      : [];
  const emit = (step, round = 1, onlyMember) => {
    for (const output of outputsForStep(
      manifest,
      "step" + step + (round > 1 ? "-r" + round : "")
    )) {
      if (onlyMember && output.member !== onlyMember) continue;
      const target = path.join(run, output.path);
      mkdirSync(path.dirname(target), { recursive: true });
      const content =
        "# SYNTHETIC " +
        output.member +
        " step " +
        step +
        " round " +
        round +
        "\n\nLiteral $& text.\n";
      writeFileSync(target, content);
      const previous = ledger();
      const observed = roster.members[output.member].slug;
      const declaration = OPENROUTER_RECIPES[output.member].declaredModel;
      // scaffold#917: a pinned seat is served inside its pin; an unpinned seat records NOT_PINNED.
      const admitted = roster.members[output.member].served_providers ?? null;
      const served = admitted ? admitted[0] : SYNTHETIC_UNPINNED_PROVIDER;
      const record = {
        synthetic_fixture: true,
        facilitator_version: manifest.provenance_contract,
        artifact_path: path.relative(root, target).split(path.sep).join("/"),
        output_file_sha256: sha256Hex(content),
        member: output.member,
        declared_model: declaration,
        substrate: "openrouter",
        endpoint: "https://example.invalid/synthetic",
        roster_contract: manifest.roster_contract,
        request: { reasoning_effort: roster.members[output.member].effort },
        attempts: [
          {
            attempt: 1,
            outcome: "success",
            model_field: observed,
            served_provider: served,
            served_provider_observations: [served],
            duration_ms: 10,
            tokens: {
              prompt: 3,
              completion: 4,
              total: 7,
              reasoning: output.member === "mistral" ? null : 2,
            },
          },
        ],
        genesis_sha256: sha256Hex(readFileSync(path.join(run, "verification/genesis.json"))),
        prev_verdict_sha256: previous.length ? canonicalSha256(previous.at(-1)) : null,
        final: {
          outcome: "success",
          assurance_tier: "local_capture_provider_attested",
          file_artifact_sha256: sha256Hex(content),
          tokens: {
            prompt: 3,
            completion: 4,
            total: 7,
            reasoning: output.member === "mistral" ? null : 2,
          },
          effort_verification: {
            result: "PASS",
            declared: output.member === "mistral" ? null : roster.members[output.member].effort,
            evidence: "reasoning_tokens",
            observed_reasoning_tokens: output.member === "mistral" ? null : 2,
          },
          provider_verification: {
            result: admitted ? "PASS" : "NOT_PINNED",
            declared: admitted,
            evidence: "response_provider_field",
            observed: served,
            observed_providers: [served],
          },
          verification: {
            result: "PASS",
            declared: declaration,
            observed,
            model_identity_source: "provider_response",
          },
        },
      };
      writeJson(target + ".provenance.json", record);
      writeFileSync(
        path.join(run, "ledger.jsonl"),
        [...previous, record].map(canonicalJson).join("\n") + "\n"
      );
    }
  };
  const seal = (step, round = 1) =>
    invoke(root, "scripts/write-step-seal.ts", [
      "--run-dir",
      run,
      "--step",
      String(step),
      "--round",
      String(round),
    ]);
  const lint = (...flags) =>
    invoke(root, "scripts/lint-council-run.ts", ["--strict", ...flags, run]);
  const verify = (script) => invoke(root, "scripts/" + script + ".ts", ["--strict", run]);
  const mock = path.join(root, ".work/mock-fetch.mjs");
  mkdirSync(path.dirname(mock), { recursive: true });
  writeFileSync(
    mock,
    `import {appendFileSync} from 'node:fs';
const SERVED = ${JSON.stringify(SERVED_BY_MODEL)};
globalThis.fetch = async (_url, options) => {
  const body = JSON.parse(options.body);
  appendFileSync('.work/synthetic-calls.jsonl', JSON.stringify({model:body.model,reasoning:body.reasoning,provider:body.provider})+'\\n');
  const response = {model: process.env.COUNCIL_FIXTURE_MISSING_IDENTITY === '1' ? null : process.env.COUNCIL_FIXTURE_MISMATCH === '1' ? 'wrong/provider-model' : body.model,
    ...(process.env.COUNCIL_FIXTURE_MISSING_PROVIDER === '1' ? {} : {provider: process.env.COUNCIL_FIXTURE_PROVIDER_MISMATCH === '1' ? 'Wrong Host' : SERVED[body.model] ?? ${JSON.stringify(SYNTHETIC_UNPINNED_PROVIDER)}}),
    choices:[{message:{role:'assistant',content:'PONG (synthetic fixture only)'},finish_reason:'stop'}],
    usage:{prompt_tokens:3,completion_tokens:4,total_tokens:7,
      ...(process.env.COUNCIL_FIXTURE_MISSING_EFFORT === '1' ? {} : {completion_tokens_details:{reasoning_tokens:2}})}};
  if (body.stream) {
    const frames = [
      {model:response.model,provider:process.env.COUNCIL_FIXTURE_MIXED_PROVIDER === '1' ? 'Wrong Host' : response.provider,
        choices:[{delta:{content:'PONG (synthetic fixture only)'},finish_reason:null}]},
      {model:response.model,provider:response.provider,choices:[{delta:{content:''},finish_reason:'stop'}],usage:response.usage},
    ];
    return new Response(frames.map(frame => 'data: '+JSON.stringify(frame)+'\\n\\n').join('')+'data: [DONE]\\n\\n',
      {headers:{'content-type':'text/event-stream'}});
  }
  return Response.json(response);
};\n`
  );
  const call = (member, name = "probe", overrides = {}, transport = "buffered") =>
    invoke(
      root,
      "--import",
      [
        mock,
        "scripts/council-invoke.ts",
        "--member",
        member,
        "--provider",
        "openrouter",
        "--transport",
        transport,
        "--prompt",
        "SYNTHETIC FIXTURE: reply PONG",
        "--output",
        path.join(run, "_probes", member + "-" + name + ".md"),
        "--max-retries",
        "0",
      ],
      { env: { ...env, ...overrides } }
    );
  // This receipt is deliberately fabricated inside an ignored, disposable test
  // repo. It tests local validation only; no remote anchor is claimed or pushed.
  const syntheticReceipt = () => {
    const file = path.join(run, "verification/anchor-receipt.json");
    writeJson(file, {
      ...json(file),
      status: "pushed",
      synthetic_fixture: true,
    });
  };
  return {
    root,
    run,
    manifest,
    git,
    start,
    emit,
    seal,
    lint,
    verify,
    addRound,
    ledger,
    call,
    syntheticReceipt,
    mock,
  };
}

test("five pins, requests, agent declarations, and catalog agree without SDKs or network", () => {
  assert.equal(catalogFindings(roster, readSnapshot()).length, 0);
  assert.deepEqual(declarationFindings(), []);
  assert.deepEqual(verifyPinnedFiles(ROOT), []);
  assert.deepEqual(verifyPinAccountability(ROOT), []);
  assert.equal(roster.version, FACILITATOR_VERSION);
  // scaffold#915: Mistral keeps a recipe but sits in no profile, so it is checked against
  // its own pinned request below instead of a roster seat.
  assert.equal(roster.members.mistral, undefined);
  assert.deepEqual(Object.keys(roster.members), ["claude", "gemini", "gpt", "kimi", "muse"]);
  for (const [member, recipe] of Object.entries(OPENROUTER_RECIPES)) {
    if (member === "mistral") {
      for (const transport of ["buffered", "sse"]) {
        const body = recipe.buildBody({ userPrompt: "synthetic", systemPrompt: null, maxTokens: 8192, transport });
        assert.equal(body.model, "mistralai/mistral-large-2512");
        assert.equal(body.reasoning, undefined);
        assert.equal(body.stream, transport === "sse" ? true : undefined);
        assert.deepEqual(body.provider, { only: ["mistral/eu"], order: ["mistral/eu"], allow_fallbacks: false });
      }
      continue;
    }
    const seat =
      member === "grok" || member === "deepseek"
        ? readRoster(ROOT, `${member}-shadow`).members[member]
        : roster.members[member];
    for (const transport of ["buffered", "sse"]) {
      const body = recipe.buildBody({
        userPrompt: "synthetic",
        systemPrompt: null,
        maxTokens: 8192,
        transport,
      });
      assert.equal(body.model, seat.slug);
      assert.equal(body.models, undefined);
      assert.equal(body.temperature, 0.3);
      assert.deepEqual(body.provider, seat.provider);
      assert.equal(body.reasoning?.effort, seat.effort === "none" ? undefined : seat.effort);
      // SSE-enabled recipes must request streaming, not merely select its parser.
      assert.equal(
        body.stream,
        ["muse", "grok", "deepseek"].includes(member) && transport === "sse" ? true : undefined
      );
      if (member === "muse")
        assert.deepEqual(body.provider, { order: ["meta"], allow_fallbacks: false });
      if (member === "deepseek")
        assert.deepEqual(body.provider, {
          only: ["coreweave/fp8"], order: ["coreweave/fp8"], allow_fallbacks: false,
        });
      if (member === "gpt")
        assert.deepEqual(body.provider, {
          order: ["openai"],
          allow_fallbacks: false,
        });
      if (member === "kimi")
        assert.deepEqual(body.provider.order, ["modal", "sail-research", "together", "moonshotai"]);
    }
  }
});

test("consumers use current recipe model matchers, including provider and build rules", () => {
  for (const seat of Object.values(roster.members)) {
    assert.equal(seatModelMatches(seat, seat.slug), true);
    assert.equal(seatModelMatches(seat, ""), false);
    for (const observed of [
      seat.slug + "-20991231",
      seat.slug + "-mini",
      "wrong/" + seat.slug.split("/")[1],
    ])
      assert.equal(
        seatModelMatches(seat, observed),
        OPENROUTER_RECIPES[seat.id].modelMatches(observed)
      );
  }
  assert.equal(
    openRouterModelMatches("anthropic/claude-fable-5.1", "anthropic/claude-fable-5"),
    false
  );
  assert.equal(
    openRouterModelMatches(roster.members.gpt.slug, roster.members.gpt.slug + "-20991231"),
    true
  );
});

test("unsupported effort, ceiling, and incorrect seat identities fail closed", () => {
  for (const member of ["gemini", "kimi"]) {
    const changed = structuredClone(roster);
    changed.members[member].effort = "xhigh";
    assert.match(catalogFindings(changed, readSnapshot()).join("\n"), /effort_unsupported/);
  }
  const changed = structuredClone(roster);
  changed.members.claude.maxOutputTokens = 9999999;
  assert.match(catalogFindings(changed, readSnapshot()).join("\n"), /output_ceiling_exceeds_model/);
  changed.members.gemini = changed.members.claude;
  assert.throws(() => validateRoster(changed), /invalid seat/);
  assert.match(catalogFindings(roster, { models: {} }).join("\n"), /model_not_pinned/);
});

test("run-start preserves branch and staged files, keeps keys out of anchors, and retries identically", (t) => {
  const f = fixture(t);
  writeFileSync(path.join(f.root, "staged-sentinel"), "unrelated user staging");
  f.git("add", "staged-sentinel");
  const branch = f.git("branch", "--show-current");
  const index = f.git("diff", "--cached", "--binary");
  ok(f.start());
  assert.equal(f.git("branch", "--show-current"), branch);
  assert.equal(f.git("diff", "--cached", "--binary"), index);
  const receiptPath = path.join(f.run, "verification/anchor-receipt.json");
  const receipt = json(receiptPath);
  assert.equal(receipt.status, "local-only");
  assert.equal(
    f.git("ls-tree", "-r", "--name-only", receipt.commit),
    "research/council-runs/synthetic-run/verification/genesis.json"
  );
  const genesis = readFileSync(path.join(f.run, "verification/genesis.json"));
  ok(f.start());
  assert.deepEqual(readFileSync(path.join(f.run, "verification/genesis.json")), genesis);
  assert.equal(json(receiptPath).commit, receipt.commit);
  fails(f.call("claude"), /anchor_not_published/);
  assert.equal(existsSync(path.join(f.root, ".work/synthetic-calls.jsonl")), false);
  f.manifest.coordinator.requested_model = "changed-preference";
  writeJson(path.join(f.run, "council-run-manifest.json"), f.manifest);
  fails(f.start(), /genesis_conflict/);
});

test("a real Facilitator invocation against a fake transport captures success and stops on mismatch", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  ok(f.call("claude"));
  assert.equal(f.ledger()[0].final.verification.result, "PASS");
  assert.equal(f.ledger()[0].final.effort_verification.declared, "xhigh");
  fails(
    f.call("muse", "override-refused", {
      OPENROUTER_MISTRAL_MODEL: "wrong/override",
    }),
    /OPENROUTER_MISTRAL_MODEL/
  );
  ok(f.call("muse", "fixed-model"));
  assert.equal(f.ledger().at(-1).final.verification.observed, roster.members.muse.slug);
  fails(f.call("claude"), /output_exists/);
  const mismatch = fails(
    f.call("gpt", "mismatch", { COUNCIL_FIXTURE_MISMATCH: "1" }),
    /model_mismatch/
  );
  assert.equal(mismatch.status, 3);
  assert.equal(f.ledger().at(-1).attempts.length, 1);
  assert.equal(f.ledger().at(-1).final.outcome, "model_mismatch_no_retry");
  fails(f.call("kimi"), /run_halted/);
  assert.equal(
    readFileSync(path.join(f.root, ".work/synthetic-calls.jsonl"), "utf8").trim().split("\n")
      .length,
    3
  );
});

test("partial outputs cannot pass a step or create a seal; per-artifact checks remain usable", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.emit(1, 1, "claude");
  ok(f.lint("--artifact", "claude-analysis.md"));
  fails(f.lint("--at-step", "1", "--before-seal"), /output_missing/);
  fails(f.seal(1), /seal_preflight/);
  fails(
    invoke(f.root, "scripts/lint-council-run.ts", ["--strict", "missing-directory"]),
    /explicit run directory is missing/
  );
});

test("pre-seal then immutable seal then full gate works; edited artifacts and ledger truncation fail", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.emit(1);
  ok(f.lint("--at-step", "1", "--before-seal"));
  fails(f.lint("--at-step", "1"), /seal_missing/);
  ok(f.seal(1));
  ok(f.seal(1));
  ok(f.lint("--at-step", "1"));
  ok(f.verify("verify-chain"));
  ok(f.verify("verify-seals"));
  writeFileSync(path.join(f.run, "claude-analysis.md"), "# altered fixture");
  fails(f.lint("--at-step", "1"), /file_modified_post_write/);
  fails(f.seal(1), /seal_preflight/);
  const entries = f.ledger();
  entries.pop();
  writeFileSync(path.join(f.run, "ledger.jsonl"), entries.map(canonicalJson).join("\n") + "\n");
  fails(f.verify("verify-seals"), /seal_ledger_incomplete/);
});

test("ties use previous revised plans, exclude self, and preserve round-1 seals", (t) => {
  const f = fixture(t);
  ok(f.start());
  for (const step of [1, 2, 3, 4]) {
    f.emit(step);
    ok(f.seal(step));
  }
  const oldSeal = readFileSync(path.join(f.run, "verification/seals/step2.seal.json"));
  f.addRound(2);
  mkdirSync(path.join(f.run, "_prompts"), { recursive: true });
  writeFileSync(path.join(f.run, "_prompts/step2-template.md"), "# Base review\n{INJECTED_ANALYSES}\n");
  writeFileSync(path.join(f.run, "_prompts/step2-r2-template.md"), "# Round two review\n{INJECTED_REVISED_PLANS}\n");
  assert.equal(orderedSteps(readManifest(f.run)).length, 7);
  const prompt = ok(
    invoke(f.root, "scripts/build-council-prompt.ts", [
      "--run-dir",
      f.run,
      "--step",
      "2",
      "--round",
      "2",
      "--member",
      "claude",
    ])
  ).stdout;
  assert.match(prompt, /^# Round two review/);
  assert.doesNotMatch(prompt, /\{INJECTED_/);
  assert.match(prompt, /gemini step 3 round 1/);
  assert.match(prompt, /Literal \$& text/);
  assert.doesNotMatch(prompt, /claude step 3|step 1 round 1/);
  for (const step of [2, 3, 4]) {
    f.emit(step, 2);
    ok(f.seal(step, 2));
  }
  assert.deepEqual(readFileSync(path.join(f.run, "verification/seals/step2.seal.json")), oldSeal);
  assert.equal(existsSync(path.join(f.run, "verification/seals/step2-r2.seal.json")), true);
  ok(f.lint("--full"));
  ok(f.verify("verify-seals"));
});

test("opted-in consensus appends its inventory without changing prior seals or anchored identity", (t) => {
  const f = fixture(t);
  ok(f.start());
  const genesis = readFileSync(path.join(f.run, "verification/genesis.json"));
  for (const step of [1, 2, 3, 4]) {
    f.emit(step);
    ok(f.seal(step));
  }
  ok(f.lint("--full"));
  const voteSeal = readFileSync(path.join(f.run, "verification/seals/step4.seal.json"));
  f.manifest.expected_outputs_per_step.step4_5 = [
    {
      member: "claude",
      kind: "consensus-plan",
      path: "revised_approaches/consensus_plan.md",
    },
  ];
  writeJson(path.join(f.run, "council-run-manifest.json"), f.manifest);
  fails(f.lint("--full"), /output_missing/);
  f.emit("4_5");
  ok(f.seal("4_5"));
  ok(f.lint("--full"));
  ok(f.verify("verify-chain"));
  ok(f.verify("verify-seals"));
  assert.deepEqual(readFileSync(path.join(f.run, "verification/genesis.json")), genesis);
  assert.deepEqual(readFileSync(path.join(f.run, "verification/seals/step4.seal.json")), voteSeal);
});

test("tampered provenance, unsupported coordinator claims, unsafe paths, and missing pins are rejected", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.emit(1);
  const substrate = path.join(f.root, "scripts/council-run-summary.ts");
  const original = readFileSync(substrate);
  writeFileSync(substrate, original.toString("utf8") + "\n// synthetic byte drift\n");
  fails(f.lint("--at-step", "1", "--before-seal"), /verifier_pin_mismatch/);
  fails(f.seal(1), /seal_preflight/);
  assert.equal(existsSync(path.join(f.run, "verification/seals/step1.seal.json")), false);
  fails(
    invoke(f.root, "scripts/build-council-prompt.ts", [
      "--run-dir",
      f.run,
      "--step",
      "1",
      "--member",
      "gpt",
    ]),
    /verifier_pin_mismatch/
  );
  writeFileSync(substrate, original);
  const sidecar = path.join(f.run, "claude-analysis.md.provenance.json");
  const record = json(sidecar);
  record.final.verification.observed = roster.members.gpt.slug;
  writeJson(sidecar, record);
  fails(f.lint("--artifact", "claude-analysis.md"), /model_mismatch|ledger_sidecar_mismatch/);
  const manifest = structuredClone(f.manifest);
  manifest.coordinator.observed_model = "invented";
  assert.throws(() => assertRunRoster(manifest), /unverified coordinator/);
  manifest.coordinator = f.manifest.coordinator;
  manifest.roster = ["claude", "gemini", "gpt"];
  assert.throws(() => assertRunRoster(manifest), /all five installed members/);
  const pinFile = path.join(f.root, "verifier-pins.json");
  rmSync(sidecar);
  symlinkSync(path.join(f.root, "verifier-pins.json"), sidecar);
  fails(f.lint("--artifact", "claude-analysis.md"), /path_escape/);
  writeJson(pinFile, { ...json(pinFile), pins: {} });
  fails(invoke(f.root, "scripts/verify-pins.ts"), /verifier_pin_missing/);
});

test("five-seat admission rejects reduced rosters even with a recorded decision", (t) => {
  const f = fixture(t);
  assert.doesNotThrow(() => assertRunRoster(f.manifest));
  for (const missing of members) {
    const manifest = structuredClone(f.manifest);
    manifest.roster = members.filter((member) => member !== missing);
    manifest.roster_decision = "Historical exception cannot waive five-seat presence";
    assert.throws(() => assertRunRoster(manifest), /all five installed members/);
  }
  const trio = {
    ...f.manifest,
    roster: ["claude", "gemini", "gpt"],
    roster_decision: "approved",
  };
  assert.throws(() => assertRunRoster(trio), /all five installed members/);
  const duplicate = {
    ...f.manifest,
    roster: ["claude", "gemini", "gpt", "kimi", "kimi"],
  };
  assert.throws(() => assertRunRoster(duplicate), /all five installed members/);
  const sixth = { ...f.manifest, roster: [...members, "reserve"] };
  assert.throws(() => assertRunRoster(sixth), /all five installed members/);

  // Exercise the actual start command: refusal precedes genesis or dispatch.
  const manifest = structuredClone(f.manifest);
  manifest.roster = members.filter((member) => member !== "muse");
  manifest.roster_decision = "approved";
  for (const [step, outputs] of Object.entries(manifest.expected_outputs_per_step))
    manifest.expected_outputs_per_step[step] = outputs.filter(
      (output) => output.member !== "muse"
    );
  writeJson(path.join(f.run, "council-run-manifest.json"), manifest);
  fails(f.start(), /all five installed members/);
  assert.equal(existsSync(path.join(f.run, "verification/genesis.json")), false);
  fails(
    invoke(f.root, "scripts/build-council-prompt.ts", [
      "--run-dir",
      f.run,
      "--step",
      "1",
      "--member",
      "gpt",
    ]),
    /all five installed members/
  );
  fails(f.call("gpt", "reduced-roster"), /all five installed members/);
  assert.equal(existsSync(path.join(f.run, "_probes/gpt-reduced-roster.md")), false);
});

test("missing keys, source hash drift, ignored sources, and declaration drift stop before network", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  fails(f.call("claude", "missing-key", { OPENROUTER_API_KEY: "" }), /Required env var/);
  writeFileSync(path.join(f.root, "brief.md"), "# synthetic source");
  const source = path.join(f.run, "source-manifest.json");
  writeJson(source, {
    sources: [{ path: "brief.md", sha256: "0".repeat(64) }],
  });
  const call = () =>
    invoke(f.root, "--import", [
      path.join(f.root, ".work/mock-fetch.mjs"),
      "scripts/council-invoke.ts",
      "--member",
      "claude",
      "--prompt",
      "synthetic fixture",
      "--output",
      path.join(f.run, "claude-analysis.md"),
      "--source-manifest",
      source,
    ]);
  fails(call(), /sha256 drift/);
  writeFileSync(path.join(f.root, ".work/ignored-source"), "synthetic ignored input");
  writeJson(source, {
    sources: [
      {
        path: ".work/ignored-source",
        sha256: sha256Hex("synthetic ignored input"),
      },
    ],
  });
  fails(call(), /source_manifest_ignored/);
  const agent = path.join(f.root, ".claude/agents/council-member-gemini.agent.md");
  writeFileSync(agent, readFileSync(agent, "utf8").replace("effort=high", "effort=xhigh"));
  fails(
    invoke(f.root, "scripts/lint-council-seat-efforts.ts", ["--strict"]),
    /agent_declaration_drift/
  );
  fails(f.call("gemini"), /agent_declaration_drift|verifier_pin_mismatch/);
  assert.equal(existsSync(path.join(f.root, ".work/synthetic-calls.jsonl")), false);
});

test("an exceeding seat ceiling fails only under --strict; an unpinned seat model exits 2 first", (t) => {
  // scaffold#642: the in-process suite proves lintSeats(); this case proves main()'s wiring of it —
  // `counted` into the finding count, the count into the --strict exit, model_not_pinned into exit 2.
  const f = fixture(t);
  const snapshotFile = path.join(f.root, "council-seat-efforts.json");
  const lint = (...args) => invoke(f.root, "scripts/lint-council-seat-efforts.ts", args);
  // Derived from the installed seat tables, never a typed count: the lint must examine every seat
  // the Facilitator can dispatch, definitive and shadow alike (seven since scaffold#915).
  const installedSeats = Object.keys({ ...OPENROUTER_SEATS, ...SHADOW_OPENROUTER_SEATS }).length;
  assert.equal(installedSeats, 7);
  assert.match(
    ok(lint("--strict")).stderr,
    new RegExp(`^OK — ${installedSeats} council seat\\(s\\) checked`, "m")
  );
  // The kimi seat requests 262144 completion tokens; pin its model's maximum below that.
  const snapshot = json(snapshotFile);
  snapshot.models["moonshotai/kimi-k3"].max_completion_tokens = 1000;
  writeJson(snapshotFile, snapshot);
  const strict = fails(lint("--strict"), /\[FAIL output_ceiling_exceeds_model\] seat kimi /);
  assert.equal(strict.status, 1, "a counted finding under --strict is exit 1, never 0 and never 2");
  assert.match(strict.stderr, /^1 seat effort finding\(s\)\.$/m);
  const lenient = ok(lint());
  assert.match(lenient.stderr, /^\[WARN output_ceiling_exceeds_model\] seat kimi /m);
  assert.match(lenient.stderr, /^1 seat effort finding\(s\)\.$/m);
  assert.doesNotMatch(lenient.stderr, /^OK — /m, "a WARN is still a finding, not an OK run");
  // An unpinned model ends the run AT that seat: exit 2, and the exceeding kimi seat after it is
  // never classified — fail closed, not a counted finding.
  delete snapshot.models["google/gemini-3.8-flash"];
  writeJson(snapshotFile, snapshot);
  const unpinned = fails(lint("--strict"), /^\[FAIL model_not_pinned\] seat gemini: /m);
  assert.equal(unpinned.status, 2, "an unpinned seat model is exit 2, never the --strict exit 1");
  assert.doesNotMatch(unpinned.stderr, /output_ceiling_exceeds_model|seat effort finding/);
});

test("changed pins require a new accountable timestamp relative to the review base", (t) => {
  const f = fixture(t);
  f.git("add", "verifier-pins.json");
  f.git("commit", "-q", "-m", "test: synthetic baseline pin manifest");
  const file = path.join(f.root, "verifier-pins.json");
  const pins = json(file);
  pins.pins["scripts/council-invoke.ts"].sha = "1".repeat(64);
  writeJson(file, pins);
  assert.ok(
    verifyPinAccountability(f.root).some(
      (finding) => finding.code === "verifier_pin_stale_repinned_at"
    )
  );
});

test("unavailable Git cannot turn pin accountability or stale-blob checks into a pass", (t) => {
  const f = fixture(t);
  const unavailableGit = {
    env: { ...env, PATH: path.join(f.root, ".work/no-executables") },
  };
  fails(invoke(f.root, "scripts/verify-pins.ts", [], unavailableGit), /verifier_pin_baseline/);
  fails(
    invoke(f.root, "scripts/check-stale-blob-drift.ts", [], unavailableGit),
    /stale_blob_unverified/
  );
});

test("anchor Git route clears inherited helpers and never carries a token", () => {
  const args = machineGitArgs();
  assert.ok(args.includes("credential.helper="));
  assert.ok(args.includes("credential.https://github.com.helper="));
  assert.ok(args.includes("http.followRedirects=false"));
  assert.ok(args.includes("credential.interactive=false"));
  assert.equal(args.filter((arg) => arg.startsWith("credential.helper=!")).length, 0);
  assert.equal(args.some((arg) => /TOKEN|password/i.test(arg)), false);
});

test("a remote outside the fork's own repository refuses before creating an anchor or seal key", (t) => {
  const f = fixture(t);
  f.git("remote", "add", "origin", "https://github.com/example/synthetic.git");
  fails(invoke(f.root, "scripts/council-run-start.ts", ["--run-dir", f.run]), /remote_scope/);
  assert.equal(existsSync(path.join(f.run, "verification/genesis.json")), false);
  assert.equal(existsSync(path.join(f.run, "verification/seal-key.local")), false);
  assert.equal(f.git("branch", "--show-current"), "main");
});

test("full offline producer-to-consumer lifecycle builds prompts, seals all steps, and reports actual usage", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  const brief = "# Synthetic mandatory source; not a council result.\n";
  writeFileSync(path.join(f.root, "brief.md"), brief);
  const sources = path.join(f.run, "source-manifest.json");
  writeJson(sources, {
    sources: [{ path: "brief.md", sha256: sha256Hex(brief) }],
  });
  // Neither missing peers nor a skipped producer step can be bypassed by
  // writing the next prompt manually.
  const invokeOutput = (member, output, prompt) =>
    invoke(f.root, "--import", [
      f.mock,
      "scripts/council-invoke.ts",
      "--member",
      member,
      "--provider",
      "openrouter",
      "--transport",
      "buffered",
      "--prompt-file",
      prompt,
      "--output",
      path.join(f.run, output),
      "--source-manifest",
      sources,
      "--max-retries",
      "0",
    ]);
  const earlyPrompt = path.join(f.run, "early.md");
  writeFileSync(earlyPrompt, "Synthetic early input");
  fails(
    invokeOutput("claude", "peer_reviews/claude_peer_review.md", earlyPrompt),
    /prior_step_unverified/
  );
  assert.equal(existsSync(path.join(f.root, ".work/synthetic-calls.jsonl")), false);
  for (const step of [1, 2, 3, 4]) {
    for (const output of outputsForStep(f.manifest, "step" + step)) {
      const prompt = path.join(f.run, "_prompts", `step${step}-${output.member}.md`);
      ok(
        invoke(f.root, "scripts/build-council-prompt.ts", [
          "--run-dir",
          f.run,
          "--step",
          String(step),
          "--member",
          output.member,
          "--out",
          prompt,
        ])
      );
      ok(invokeOutput(output.member, output.path, prompt));
      ok(f.lint("--artifact", output.path));
    }
    ok(f.lint("--at-step", String(step), "--before-seal"));
    ok(f.seal(step));
    ok(f.lint("--at-step", String(step)));
  }
  ok(f.verify("verify-chain"));
  ok(f.verify("verify-seals"));
  ok(f.lint("--full"));
  const summarize = (...args) =>
    invoke(f.root, "scripts/council-run-summary.ts", ["--run-dir", f.run, ...args]);
  ok(summarize());
  const summaryPath = path.join(f.run, "run-summary.json");
  const summary = json(summaryPath);
  assert.equal(summary.usage_scope, "declared_outputs_excluding_setup_probes");
  assert.equal(summary.totals.attempts, 20);
  assert.equal(summary.totals.total_tokens, 140);
  for (const step of Object.values(summary.steps))
    for (const attempt of step.attempts) {
      assert.deepEqual(attempt.served_provider_observations, [attempt.served_provider]);
    }
  assert.equal(summary.totals.usage_unavailable_count, 0);
  assert.equal(summary.min_assurance_tier, "local_capture_provider_attested");
  assert.equal(f.ledger().length, 20);
  assert.ok(
    f
      .ledger()
      .every(
        (record) =>
          record.facilitator_version === FACILITATOR_VERSION &&
          record.final.verification.result === "PASS"
      )
  );
  const saved = readFileSync(summaryPath);
  fails(summarize("--out-json", path.join(f.root, "outside.json")), /summary_output_scope/);
  assert.equal(existsSync(path.join(f.root, "outside.json")), false);
  writeFileSync(path.join(f.run, "claude-analysis.md"), "# altered after seal\n");
  fails(summarize(), /summary_unverified/);
  assert.deepEqual(
    readFileSync(summaryPath),
    saved,
    "failed summary cannot replace prior verified projection"
  );
});

test("unknown served model remains exit 6 and cannot advance a bound run", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  const result = f.call("claude", "unknown-model", {
    COUNCIL_FIXTURE_MISSING_IDENTITY: "1",
  });
  assert.equal(result.status, 6, result.stdout + result.stderr);
  assert.equal(
    f.ledger()[0].final.outcome,
    "success",
    "provider content is preserved, not promoted to identity proof"
  );
  assert.equal(f.ledger()[0].final.verification.result, "UNVERIFIABLE");
  fails(f.call("gpt"), /run_halted/);
  fails(f.seal(1), /seal_preflight/);
  assert.equal(
    readFileSync(path.join(f.root, ".work/synthetic-calls.jsonl"), "utf8").trim().split("\n")
      .length,
    1
  );
});

test("missing provider reasoning evidence is not a verified effort or permission to continue", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  ok(f.call("claude", "unknown-effort", { COUNCIL_FIXTURE_MISSING_EFFORT: "1" }));
  assert.equal(f.ledger()[0].final.effort_verification.result, "UNVERIFIABLE");
  fails(f.call("gpt"), /run_halted/);
  fails(
    invoke(f.root, "scripts/council-run-summary.ts", ["--run-dir", f.run]),
    /summary_unverified/
  );
  assert.equal(existsSync(path.join(f.run, "run-summary.json")), false);
});

// scaffold#917: routing evidence through the real Facilitator and a bound run.
test("a pinned seat served outside its pin exits 7, keeps no content, and halts the run", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  ok(f.call("claude"));
  assert.deepEqual(f.ledger()[0].final.provider_verification, {
    result: "NOT_PINNED",
    declared: null,
    evidence: "response_provider_field",
    observed: SYNTHETIC_UNPINNED_PROVIDER,
    observed_providers: [SYNTHETIC_UNPINNED_PROVIDER],
  });
  ok(f.call("gpt", "served-inside"));
  assert.deepEqual(f.ledger().at(-1).final.provider_verification, {
    result: "PASS",
    declared: roster.members.gpt.served_providers,
    evidence: "response_provider_field",
    observed: roster.members.gpt.served_providers[0],
    observed_providers: [roster.members.gpt.served_providers[0]],
  });
  const outside = f.call("kimi", "served-outside", { COUNCIL_FIXTURE_PROVIDER_MISMATCH: "1" });
  assert.equal(outside.status, 7, outside.stdout + outside.stderr);
  assert.match(outside.stderr, /providers=\["Wrong Host"\]/);
  assert.match(outside.stderr, /provider_mismatch_no_retry/);
  const receipt = f.ledger().at(-1);
  assert.equal(receipt.final.outcome, "provider_mismatch_no_retry");
  assert.equal(receipt.attempts[0].outcome, "provider_mismatch");
  assert.equal(receipt.final.verification.result, "PASS", "the model was right; the route was not");
  assert.equal(receipt.final.provider_verification.result, "FAIL");
  assert.equal(receipt.final.provider_verification.observed, "Wrong Host");
  assert.equal(existsSync(path.join(f.run, "_probes/kimi-served-outside.md")), false);
  fails(f.call("muse"), /run_halted/);
});

test("a pinned seat whose response names no provider is UNVERIFIABLE and cannot advance a bound run", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  ok(f.call("muse", "unnamed-provider", { COUNCIL_FIXTURE_MISSING_PROVIDER: "1" }));
  const receipt = f.ledger()[0];
  assert.equal(receipt.final.outcome, "success", "content is kept; routing is not promoted to proof");
  assert.equal(receipt.attempts[0].served_provider, null);
  assert.deepEqual(receipt.final.provider_verification, {
    result: "UNVERIFIABLE",
    declared: roster.members.muse.served_providers,
    evidence: "response_provider_field",
    observed: null,
    observed_providers: [],
  });
  fails(f.call("gpt"), /run_halted.*provider evidence/);
  fails(
    invoke(f.root, "scripts/council-run-summary.ts", ["--run-dir", f.run]),
    /summary_unverified/
  );
});

test("pinned seats commit to exactly the providers their pins admit in the catalogue", () => {
  const snapshot = readSnapshot();
  let pinned = 0;
  for (const profile of ["definitive", "grok-shadow", "deepseek-shadow"]) {
    const profileRoster = readRoster(ROOT, profile);
    assert.deepEqual(catalogFindings(profileRoster, snapshot), [], profile);
    for (const seat of Object.values(profileRoster.members)) {
      assert.equal(Boolean(seat.provider), Boolean(seat.served_providers?.length), seat.id);
      if (seat.provider) pinned += 1;
    }
  }
  assert.ok(pinned >= 3, "the served-provider check examined no pinned seat");
  const drift = structuredClone(roster);
  drift.members.gpt.served_providers = ["OpenAI", "Azure"];
  assert.match(catalogFindings(drift, snapshot).join("\n"), /gpt: served_providers_drift/);
  const blind = structuredClone(snapshot);
  delete blind.models[roster.members.kimi.slug].endpoints;
  assert.match(catalogFindings(roster, blind).join("\n"), /kimi: served_providers_unverified/);
  const nowhere = structuredClone(roster);
  nowhere.members.muse.provider = { order: ["nowhere"], allow_fallbacks: false };
  assert.match(catalogFindings(nowhere, snapshot).join("\n"), /muse: pin_admits_no_endpoint/);
  const missing = structuredClone(roster);
  delete missing.members.gpt.served_providers;
  assert.throws(() => validateRoster(missing), /must declare the providers it admits/);
  const stray = structuredClone(roster);
  stray.members.claude.served_providers = ["Anthropic"];
  assert.throws(() => validateRoster(stray), /served providers without a provider pin/);
});

for (const candidate of ["grok", "deepseek"]) {
  test(`${candidate} shadow: five distinct identities, complete lifecycle, non-binding summary`, (t) => {
    const profile = `${candidate}-shadow`;
    const f = fixture(t, profile);
    assert.deepEqual(f.manifest.roster, ["claude", "gemini", "gpt", "kimi", candidate]);
    assert.deepEqual(catalogFindings(readRoster(ROOT, profile), readSnapshot()), []);
    assert.deepEqual(declarationFindings(ROOT, profile), []);
    ok(f.start());
    f.syntheticReceipt();
    ok(f.call(candidate));
    assert.equal(f.ledger().at(-1).member, candidate);
    assert.equal(
      f.ledger().at(-1).final.verification.observed,
      OPENROUTER_RECIPES[candidate].buildBody({
        userPrompt: "",
        systemPrompt: null,
        maxTokens: 4096,
        transport: "buffered",
      }).model
    );
    fails(f.call("muse", "wrong-arm"), /run_route_mismatch/);
    for (const step of [1, 2, 3, 4]) {
      f.emit(step);
      ok(f.seal(step));
    }
    ok(f.verify("verify-chain"));
    ok(f.verify("verify-seals"));
    ok(invoke(f.root, "scripts/council-run-summary.ts", ["--run-dir", f.run]));
    const summary = json(path.join(f.run, "run-summary.json"));
    assert.equal(summary.council_profile, profile);
    assert.equal(summary.decision_authority, "non-binding");
    assert.match(
      readFileSync(path.join(f.run, "run-summary.md"), "utf8"),
      /SHADOW EXPERIMENT ONLY/
    );
    // A mutable label cannot promote an anchored shadow into definitive evidence.
    f.manifest.experiment.decision_authority = "definitive";
    writeJson(path.join(f.run, "council-run-manifest.json"), f.manifest);
    fails(f.verify("verify-chain"), /council_roster_invalid/);
    fails(f.start(), /council_roster_invalid/);
  });
  test(`${candidate} shadow cannot use a definitive contract, lose a member, add a sixth, or change campaign after genesis`, (t) => {
    const f = fixture(t, `${candidate}-shadow`);
    const m = structuredClone(f.manifest);
    delete m.council_profile;
    assert.throws(() => assertRunRoster(m), /council_roster_invalid/);
    delete m.experiment;
    assert.throws(() => assertRunRoster(m), /council_roster_invalid/);
    for (const member of f.manifest.roster)
      assert.throws(
        () =>
          assertRunRoster({
            ...f.manifest,
            roster: f.manifest.roster.filter((id) => id !== member),
          }),
        /all five installed members/
      );
    assert.throws(
      () =>
        assertRunRoster({
          ...f.manifest,
          roster: [...f.manifest.roster, "muse"],
        }),
      /all five installed members/
    );
    assert.throws(
      () => assertRunRoster({ ...f.manifest, experiment: undefined }),
      /non-binding authority/
    );
    ok(f.start());
    f.manifest.experiment.campaign_id = "changed-campaign";
    writeJson(path.join(f.run, "council-run-manifest.json"), f.manifest);
    fails(f.verify("verify-chain"), /genesis_binding_mismatch/);
    fails(f.start(), /genesis_conflict/);
  });
}


test("preliminary review projects the same three recipes as the definitive council", () => {
  const review = readPreliminaryReviewContract();
  assert.deepEqual(review.roster, ["claude", "gemini", "gpt"]);
  assert.equal(review.decision_authority, "advisory");
  assert.equal(review.formal_council_complete, false);
  for (const id of review.roster) assert.deepEqual(review.members[id], readRoster().members[id]);
  assert.doesNotThrow(() => assertPreliminaryReviewContract(review));
});

test("preliminary format refuses altered pins, provider routing and completion authority", () => {
  const mutations = [
    (r) => { r.members.gpt.slug = "openai/another-model"; },
    (r) => { r.members.gemini.effort = "low"; },
    (r) => { r.members.gpt.provider.allow_fallbacks = true; },
    (r) => { r.members.claude.maxOutputTokens = 1; },
    (r) => { r.roster.push("kimi"); },
    (r) => { r.review_kind = "council"; },
    (r) => { r.decision_authority = "definitive"; },
    (r) => { r.formal_council_complete = true; },
  ];
  for (const mutate of mutations) {
    const review = readPreliminaryReviewContract();
    mutate(review);
    assert.throws(() => assertPreliminaryReviewContract(review), /preliminary review must retain/);
  }
});

test("preliminary evidence cannot satisfy formal admission even with five appended seats", (t) => {
  const f = fixture(t);
  assert.throws(() => assertRunRoster(readPreliminaryReviewContract()), /preliminary review cannot satisfy/);
  for (const marker of [{review_kind: "preliminary-review"}, {decision_authority: "advisory"}]) {
    const candidate = {...f.manifest, ...marker};
    assert.equal(candidate.roster.length, 5);
    assert.throws(() => assertRunRoster(candidate), /preliminary review cannot satisfy/);
  }
});

test("nested research councils retain namespaced anchors, discovery and all verification gates", (t) => {
  const f = fixture(t, "definitive", true);
  ok(f.start());
  assert.equal(json(path.join(f.run, "verification/genesis.json")).run_id, f.manifest.run_id);
  assert.equal(json(path.join(f.run, "verification/genesis.json")).anchor_branch,
    "verification-anchors/" + f.manifest.run_id);
  fails(f.lint("--full"), /ledger.jsonl is missing/);
  for (const step of [1, 2, 3, 4]) { f.emit(step); ok(f.seal(step)); }
  ok(f.lint("--full"));
  ok(f.verify("verify-chain"));
  ok(f.verify("verify-seals"));
  for (const location of [f.run, path.dirname(f.run), path.join(f.run, "peer_reviews")]) {
    const result = ok(invoke(f.root, "scripts/lint-council-run.ts", ["--json", location]));
    assert.equal(JSON.parse(result.stdout).runs_scanned, 1);
  }
  const scan = ok(invoke(f.root, "scripts/lint-council-run.ts", ["--json"]));
  assert.equal(JSON.parse(scan.stdout).runs_scanned, 1);
  f.manifest.run_id = "phase-4-deliberation";
  writeJson(path.join(f.run, "council-run-manifest.json"), f.manifest);
  fails(f.lint(), /manifest_schema_mismatch/);
});

test("historical nested scans are disclosed and explicit paths remain subject to current admission", (t) => {
  const f = fixture(t, "definitive", true);
  writeJson(path.join(path.dirname(f.run), ".setup.json"), { methodology_version: "1.9.0" });
  const scan = ok(invoke(f.root, "scripts/lint-council-run.ts", ["--json"]));
  const report = JSON.parse(scan.stdout);
  assert.equal(report.runs_scanned, 0);
  assert.deepEqual(report.legacy_nested_not_scanned, [path.relative(f.root, f.run).split(path.sep).join("/")]);
  fails(f.lint(), /genesis/);
  f.manifest.provenance_contract = "council-facilitator@1.3.1";
  writeJson(path.join(f.run, "council-run-manifest.json"), f.manifest);
  fails(f.start(), /council_roster_invalid/);
  writeJson(path.join(path.dirname(f.run), ".setup.json"), { methodology_version: "invalid" });
  fails(invoke(f.root, "scripts/lint-council-run.ts", ["--json"]), /research_setup_invalid/);
});

test("unversioned research labels retain the dated legacy boundary without hiding malformed versions", (t) => {
  const historical = fixture(t, "definitive", true);
  const researchRoot = path.dirname(path.dirname(historical.run));
  const oldRoot = path.join(researchRoot, "2026-06-03-synthetic-research");
  renameSync(path.dirname(historical.run), oldRoot);
  const oldRun = path.join(oldRoot, "phase-4-deliberation");
  historical.manifest.run_id = "2026-06-03-synthetic-research/phase-4-deliberation";
  writeJson(path.join(oldRun, "council-run-manifest.json"), historical.manifest);
  writeJson(path.join(oldRoot, ".setup.json"), { methodology: "council-research" });
  const scan = JSON.parse(ok(invoke(historical.root, "scripts/lint-council-run.ts", ["--json"])).stdout);
  assert.equal(scan.runs_scanned, 0);
  assert.deepEqual(scan.legacy_nested_not_scanned, [path.relative(historical.root, oldRun).split(path.sep).join("/")]);
  fails(invoke(historical.root, "scripts/lint-council-run.ts", ["--json", oldRun]), /genesis/);
  for (const invalid of ["invalid", 7, "1.10"]) {
    writeJson(path.join(oldRoot, ".setup.json"), { methodology: "council-research", methodology_version: invalid });
    fails(invoke(historical.root, "scripts/lint-council-run.ts", ["--json"]), /research_setup_invalid/);
  }
  writeJson(path.join(oldRoot, ".setup.json"), { methodology: "other-research" });
  fails(invoke(historical.root, "scripts/lint-council-run.ts", ["--json"]), /research_setup_invalid/);

  const current = fixture(t, "definitive", true);
  writeJson(path.join(path.dirname(current.run), ".setup.json"), { methodology: "council-research" });
  fails(invoke(current.root, "scripts/lint-council-run.ts", ["--json"]), /genesis/);
});

test("default discovery audits old inventory separately from current admission", (t) => {
  const f = fixture(t);
  const oldRun = path.join(path.dirname(f.run), "2026-06-16-historical-inventory");
  renameSync(f.run, oldRun);
  const oldManifest = {
    schema_version: "council-run-manifest@1.0.0",
    run_id: path.basename(oldRun), created_at: "2026-06-16T01:00:00Z", topic: "Historical fixture",
    roster: ["claude", "gpt"], provenance_contract: "council-facilitator@1.2.0",
    expected_outputs_per_step: {
      step1: [{ path: "claude-analysis.md", member: "claude", kind: "analysis" }],
      step2: [], step3: [], step4: [],
    },
  };
  const output = path.join(oldRun, "claude-analysis.md");
  writeFileSync(output, "historical member output\n");
  const provenance = {
    member: "claude", substrate: "historical", endpoint: "synthetic", attempts: [],
    facilitator_version: oldManifest.provenance_contract,
    final: { verification: {}, file_artifact_sha256: sha256Hex(readFileSync(output)) },
  };
  writeJson(output + ".provenance.json", provenance);
  writeJson(path.join(oldRun, "council-run-manifest.json"), oldManifest);
  writeFileSync(path.join(oldRun, "step5-gap-analysis.md"), "coordinator prose\n");
  const scan = () => invoke(f.root, "scripts/lint-council-run.ts", ["--strict", "--json"]);
  const report = JSON.parse(ok(scan()).stdout);
  assert.equal(report.runs_scanned, 1);
  assert.equal(report.current_runs_scanned, 0);
  assert.deepEqual(report.historical_runs_audited, [path.relative(f.root, oldRun).split(path.sep).join("/")]);
  fails(invoke(f.root, "scripts/lint-council-run.ts", [oldRun]), /manifest_schema_mismatch/);
  fails(invoke(f.root, "scripts/lint-council-run.ts", ["--full"]), /manifest_schema_mismatch/);
  fails(invoke(f.root, "scripts/council-run-start.ts", ["--run-dir", oldRun, "--no-push"]), /manifest_schema_mismatch|council_roster_invalid/);
  writeFileSync(output, "tampered\n");
  fails(scan(), /file_modified_post_write/);
  writeFileSync(output, "historical member output\n");
  writeFileSync(path.join(oldRun, "ledger.jsonl"), "");
  fails(scan(), /seal_missing/);
  rmSync(path.join(oldRun, "ledger.jsonl"));
  rmSync(output + ".provenance.json");
  fails(scan(), /ENOENT|provenance/);
  writeJson(output + ".provenance.json", { ...provenance, facilitator_version: "council-facilitator@9.0.0" });
  fails(scan(), /contract_mismatch/);
  writeJson(output + ".provenance.json", provenance);
  // Historical explicit inventories can include a guest absent from the summary roster.
  oldManifest.expected_outputs_per_step.step1[0].member = "kimi";
  writeJson(path.join(oldRun, "council-run-manifest.json"), oldManifest);
  writeJson(output + ".provenance.json", { ...provenance, member: "kimi" });
  ok(scan());
  writeJson(output + ".provenance.json", provenance);
  fails(scan(), /provenance_invalid/);
  oldManifest.expected_outputs_per_step.step1[0].member = "claude";
  oldManifest.provenance_contract = "council-facilitator@999.0.0";
  writeJson(path.join(oldRun, "council-run-manifest.json"), oldManifest);
  fails(scan(), /manifest_schema_mismatch/);
  oldManifest.provenance_contract = "council-facilitator@1.2.0";
  // scaffold#944 reverses the calendar cutoff these lines once asserted: a run is historical by its contract.
  oldManifest.created_at = "2026-09-27T00:00:00Z";
  writeJson(path.join(oldRun, "council-run-manifest.json"), oldManifest);
  ok(scan());
  oldManifest.created_at = "2026-06-16T01:00:00Z";
  // A historical contract carrying a newer contract's key is its own finding, not a schema mismatch (#944).
  writeJson(path.join(oldRun, "council-run-manifest.json"), { ...oldManifest, roster_contract: {} });
  fails(scan(), /historical_manifest_mixed_contract/);
  const recentRun = path.join(path.dirname(oldRun), "2026-09-27-historical-inventory");
  renameSync(oldRun, recentRun);
  oldManifest.run_id = path.basename(recentRun);
  writeJson(path.join(recentRun, "council-run-manifest.json"), oldManifest);
  ok(scan());
});


test("run lint refuses an earlier out-of-pin provider behind an allowed final scalar and a planted PASS", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.emit(1);
  ok(f.lint("--at-step", "1", "--before-seal"));
  const output = outputsForStep(f.manifest, "step1").find((entry) => entry.member === "gpt");
  assert.ok(output);
  const filename = path.join(f.run, output.path) + ".provenance.json";
  const original = json(filename);
  for (const mutate of [
    (record) => {
      const observations = ["Wrong Host", roster.members.gpt.served_providers[0]];
      record.attempts.at(-1).served_provider_observations = observations;
      record.final.provider_verification.observed_providers = [...observations];
    },
    (record) => delete record.attempts.at(-1).served_provider_observations,
    (record) => { record.final.provider_verification.observed_providers = ["Wrong Host"]; },
  ]) {
    const planted = structuredClone(original);
    mutate(planted);
    writeJson(filename, planted);
    fails(f.lint("--artifact", output.path), /provider_unverified/);
  }
  writeJson(filename, original);
  ok(f.lint("--artifact", output.path));
});


test("mixed-provider SSE is retained and refused by the installed producer", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.syntheticReceipt();
  const result = f.call("muse", "mixed-provider", { COUNCIL_FIXTURE_MIXED_PROVIDER: "1" }, "sse");
  assert.equal(result.status, 7, result.stdout + result.stderr);
  const output = path.join(f.run, "_probes/muse-mixed-provider.md");
  assert.equal(existsSync(output), false);
  const receipt = json(output + ".provenance.json");
  assert.deepEqual(receipt.attempts[0].served_provider_observations, ["Wrong Host", "Meta"]);
  assert.deepEqual(receipt.final.provider_verification.observed_providers, ["Wrong Host", "Meta"]);
  assert.equal(receipt.final.provider_verification.observed, "Meta");
  assert.equal(receipt.final.provider_verification.result, "FAIL");
  assert.equal(receipt.final.outcome, "provider_mismatch_no_retry");
  assert.equal(receipt.attempts[0].tokens.total, 7);
  assert.equal(receipt.attempts.length, 1);
  fails(f.call("gpt"), /halt/i);
});

// ── scaffold#944: a run is historical by the contract it carries, never by the calendar ──────────────────
// R5299-100 was sealed under council-facilitator@1.3.1 on the day the old cutoff named (2026-09-27), and the
// default scan, verify-chain and verify-seals all refused it as council_roster_invalid. toHistorical turns the
// harness's own sealed current run into that shape: the manifest names the historical contract and drops the
// keys only newer contracts write, every verdict and provenance record carries the contract, the chain is
// re-linked and every seal is re-signed with the run's key. So what the verifiers accept is real evidence.
function toHistorical(f, contract, createdAt, { keepNewerKeys = false } = {}) {
  const manifestPath = path.join(f.run, "council-run-manifest.json");
  const manifest = json(manifestPath);
  manifest.provenance_contract = contract;
  manifest.created_at = createdAt;
  if (!keepNewerKeys) for (const key of ["roster_contract", "coordinator", "council_profile", "experiment"]) delete manifest[key];
  writeJson(manifestPath, manifest);
  const ledgerPath = path.join(f.run, "ledger.jsonl");
  const entries = readFileSync(ledgerPath, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
  const relinked = [];
  for (const entry of entries) {
    entry.facilitator_version = contract;
    entry.prev_verdict_sha256 = relinked.length ? canonicalSha256(relinked.at(-1)) : null;
    relinked.push(entry);
    const provenancePath = path.join(f.root, entry.artifact_path + ".provenance.json");
    if (existsSync(provenancePath)) writeJson(provenancePath, { ...json(provenancePath), facilitator_version: contract });
  }
  writeFileSync(ledgerPath, relinked.map(canonicalJson).join("\n") + "\n");
  const key = readFileSync(path.join(f.run, "verification/seal-key.local"), "utf8").trim();
  const sealsDir = path.join(f.run, "verification/seals");
  for (const name of existsSync(sealsDir) ? readdirSync(sealsDir) : []) {
    const seal = json(path.join(sealsDir, name));
    const { signature: _old, ...payload } = seal;
    payload.chain_terminal_sha256 = canonicalSha256(relinked[payload.verdict_count - 1]);
    const signature = "hmac-sha256:" + createHmac("sha256", key).update(canonicalJson(payload)).digest("hex");
    writeJson(path.join(sealsDir, name), { ...payload, signature });
  }
}
const relRun = (f) => path.relative(f.root, f.run).split(path.sep).join("/");

test("#944: a run sealed under 1.3.1 is historical by its contract on any date; the scan, verify-chain and verify-seals admit it", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.emit(1);
  ok(f.seal(1));
  // The same run under the current contract goes through current admission (criterion 3).
  // (An in-progress current run reports its later steps as missing; what matters here is the route it takes.)
  assert.equal(JSON.parse(invoke(f.root, "scripts/lint-council-run.ts", ["--json"]).stdout).current_runs_scanned, 1);
  ok(f.verify("verify-chain"));
  ok(f.verify("verify-seals"));

  toHistorical(f, "council-facilitator@1.3.1", "2026-09-28T05:15:58Z");
  const scan = JSON.parse(ok(invoke(f.root, "scripts/lint-council-run.ts", ["--json"])).stdout);
  assert.deepEqual(scan.historical_runs_audited, [relRun(f)], "admitted as historical inventory although created after the old cutoff");
  assert.equal(scan.current_runs_scanned, 0);
  const chain = ok(f.verify("verify-chain"));
  assert.match(chain.stdout + chain.stderr, /Historical evidence \(council-facilitator@1\.3\.1\) chain verified; no current-run assurance claimed/);
  ok(f.verify("verify-seals"));

  // Its own evidence still binds: a verdict written under another contract is refused.
  const ledgerPath = path.join(f.run, "ledger.jsonl");
  const good = readFileSync(ledgerPath, "utf8");
  const lines = good.split("\n").filter((l) => l.trim());
  const first = JSON.parse(lines[0]);
  writeFileSync(ledgerPath, [canonicalJson({ ...first, facilitator_version: "council-facilitator@1.2.0" }), ...lines.slice(1)].join("\n") + "\n");
  fails(f.verify("verify-chain"), /contract_mismatch/);
  fails(invoke(f.root, "scripts/lint-council-run.ts", ["--strict", "--json"]), /contract_mismatch/);
  writeFileSync(ledgerPath, good);
  // And a historical run is still not current: an explicit check keeps current admission.
  fails(f.lint(), /council_roster_invalid/);
});

test("#944: a historical contract with a newer contract's keys is named historical_manifest_mixed_contract, not council_roster_invalid", (t) => {
  const f = fixture(t);
  ok(f.start());
  f.emit(1);
  ok(f.seal(1));
  toHistorical(f, "council-facilitator@1.3.1", "2026-09-28T05:15:58Z", { keepNewerKeys: true });
  for (const result of [
    invoke(f.root, "scripts/lint-council-run.ts", ["--json"]),
    f.verify("verify-chain"),
    f.verify("verify-seals"),
  ]) {
    const out = result.stdout + result.stderr;
    assert.notEqual(result.status, 0, out);
    assert.match(out, /historical_manifest_mixed_contract/);
    assert.doesNotMatch(out, /council_roster_invalid/);
  }
});

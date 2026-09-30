/**
 * Routing + model-identity tests for scripts/council-invoke.ts.
 *
 * Two halves:
 *   1. Spawn-based route selection (stops at local_config_error / missing-env
 *      preflight). The missing-env failure tells us which route the Facilitator
 *      selected. Covers Mistral's azure/bedrock/openrouter providers + transports.
 *   2. OpenRouter-for-all substrate (M64 consolidation): `--provider openrouter`
 *      routes every member to its pinned OpenRouter recipe; each seat pins the
 *      correct slug + max reasoning effort; `openRouterModelMatches` accepts
 *      OpenRouter's reordered/date-stamped echoes but rejects substitutions.
 *
 * Run via:  npx tsx --test scripts/__tests__/council-invoke-routing.node-test.ts
 *
 * The `.node-test.ts` suffix is deliberate (corpus 4.7.1): this file registers its suites
 * through node:test, and estates whose CI runs vitest collect every `*.test.ts` by default —
 * seven fleet repos failed 4.7.0 with "No test suite found in file" until the name stopped
 * matching. Keep the suffix; `npx tsx --test <path>` runs any explicit path.
 *
 * Corpus base file (scaffold#571): seeded into every fleet repo beside the Facilitator
 * and run from the repo root. It mirrors OPENROUTER_SEATS in scripts/council-invoke.ts —
 * when a seat moves, this table moves in the same change, or the drift it exists to
 * catch is the drift it hides (it asserted Opus 5 / K2.6 / xhigh for twelve days once).
 */
import { describe, it, test } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  OPENROUTER_RECIPES,
  admittedProviderNames,
  classifyAttempt,
  openRouterModelMatches,
  runCouncilInvocation,
  selectRecipe,
  servedProviderMatches,
  verifyServedProvider,
} from "../council-invoke.js";

// #665: test the real dispatcher, not just a model matcher. Every HTTP response
// is synthetic; these are not provider-access or completed-council evidence.
const identityCases = [
  { name: "absent", field: {}, verification: "UNVERIFIABLE", exit: 6 },
  {
    name: "null",
    field: { model: null },
    verification: "UNVERIFIABLE",
    exit: 6,
  },
  {
    name: "empty",
    field: { model: "" },
    verification: "UNVERIFIABLE",
    exit: 6,
  },
  {
    name: "blank",
    field: { model: "   " },
    verification: "UNVERIFIABLE",
    exit: 6,
  },
  {
    name: "non-string",
    field: { model: 42 },
    verification: "UNVERIFIABLE",
    exit: 6,
  },
  {
    name: "exact",
    field: { model: "mistralai/mistral-large-2512" },
    verification: "PASS",
    exit: 0,
  },
  {
    name: "semantic",
    field: { model: "MISTRALAI/MISTRAL-LARGE-2512" },
    verification: "PASS",
    exit: 0,
  },
  {
    name: "mismatch",
    field: { model: "other/model" },
    verification: "FAIL",
    exit: 3,
  },
] as const;

for (const transport of ["buffered", "sse"] as const) {
  for (const scenario of identityCases) {
    test(`identity gate: ${transport} ${scenario.name} response`, async (t) => {
      await mkdir(join(process.cwd(), ".work"), { recursive: true });
      const directory = await mkdtemp(join(process.cwd(), ".work", "identity-665-"));
      t.after(() => rm(directory, { recursive: true, force: true }));
      const priorKey = process.env.OPENROUTER_API_KEY;
      const priorModel = process.env.OPENROUTER_MISTRAL_MODEL;
      process.env.OPENROUTER_API_KEY = ["synthetic", "test", "fixture"].join("-");
      process.env.OPENROUTER_MISTRAL_MODEL = "";
      t.after(() => {
        if (priorKey === undefined) delete process.env.OPENROUTER_API_KEY;
        else process.env.OPENROUTER_API_KEY = priorKey;
        if (priorModel === undefined) delete process.env.OPENROUTER_MISTRAL_MODEL;
        else process.env.OPENROUTER_MISTRAL_MODEL = priorModel;
      });
      const output = join(directory, "result.txt");
      const content = "Synthetic content; identity must be checked separately.\n";
      const usage = { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 };
      let calls = 0;
      t.mock.method(globalThis, "fetch", async (url: string | URL, request: RequestInit) => {
        assert.equal(String(url), "https://openrouter.ai/api/v1/chat/completions");
        assert.equal(JSON.parse(String(request.body)).model, "mistralai/mistral-large-2512");
        assert.deepEqual(JSON.parse(String(request.body)).provider, {
          only: ["mistral/eu"], order: ["mistral/eu"], allow_fallbacks: false,
        });
        calls += 1;
        const body = {
          ...scenario.field,
          choices: [
            {
              ...(transport === "sse" ? { delta: { content } } : { message: { content } }),
              finish_reason: "stop",
            },
          ],
          usage,
        };
        return transport === "sse"
          ? new Response(`data: ${JSON.stringify(body)}\n\ndata: [DONE]\n\n`, {
              headers: { "content-type": "text/event-stream" },
            })
          : Response.json(body);
      });
      const exit = await runCouncilInvocation([
        "--member",
        "mistral",
        "--provider",
        "openrouter",
        "--transport",
        transport,
        "--prompt",
        "Synthetic fixture only",
        "--output",
        output,
        "--max-retries",
        "3",
        "--retry-base-ms",
        "1",
      ]);
      assert.equal(exit, scenario.exit);
      assert.equal(calls, 1, "identity uncertainty/mismatch must not trigger paid retries");
      const receipt = JSON.parse(await readFile(output + ".provenance.json", "utf8"));
      assert.equal(receipt.final.verification.result, scenario.verification);
      assert.equal(receipt.attempts.length, 1);
      assert.equal(receipt.final.retries_used, 0);
      assert.equal(receipt.final.verification.declared, receipt.declared_model);
      assert.deepEqual(receipt.attempts[0].usage, usage);
      if (scenario.exit === 3) {
        assert.equal(receipt.final.outcome, "model_mismatch_no_retry");
        await assert.rejects(readFile(output), { code: "ENOENT" });
      } else {
        assert.equal(
          receipt.final.outcome,
          "success",
          "provider content success is retained, not promoted to identity proof"
        );
        assert.equal(receipt.attempts[0].outcome, "success");
        assert.equal(await readFile(output, "utf8"), content);
        assert.deepEqual(receipt.final.usage, usage);
        if (scenario.exit === 6) {
          assert.equal(receipt.final.verification.match_kind, "none");
          assert.ok(
            receipt.final.verification.observed === null ||
              receipt.final.verification.observed.trim() === ""
          );
          assert.equal(Object.hasOwn(receipt.final.verification, "model_identity_source"), false);
        } else {
          assert.equal(receipt.final.verification.observed, scenario.field.model);
          assert.equal(receipt.final.verification.model_identity_source, "provider_response");
        }
      }
    });
  }
}

for (const transport of ["buffered", "sse"] as const) {
  for (const status of [200, 401]) {
    test(`identity CLI: ${transport} HTTP ${status} without a model`, async (t) => {
      await mkdir(join(process.cwd(), ".work"), { recursive: true });
      const directory = await mkdtemp(join(process.cwd(), ".work", "identity-cli-665-"));
      t.after(() => rm(directory, { recursive: true, force: true }));
      const preload = join(directory, "synthetic-fetch.mjs");
      const output = join(directory, "result.txt");
      const response =
        status === 401
          ? { error: { message: "synthetic unauthorized response" } }
          : {
              choices: [
                {
                  ...(transport === "sse"
                    ? { delta: { content: "Synthetic output" } }
                    : { message: { content: "Synthetic output" } }),
                  finish_reason: "stop",
                },
              ],
            };
      const body =
        transport === "sse" && status === 200
          ? `data: ${JSON.stringify(response)}\n\ndata: [DONE]\n\n`
          : JSON.stringify(response);
      await writeFile(
        preload,
        `// Test-only transport: no network or usable credentials.\nlet calls=0;\nglobalThis.fetch=async (url)=>{\nif(String(url)!=='https://openrouter.ai/api/v1/chat/completions'||++calls!==1) throw new Error('Unexpected fixture dispatch');\nreturn new Response(${JSON.stringify(body)}, {status:${status}, headers:{'content-type':${JSON.stringify(transport === "sse" && status === 200 ? "text/event-stream" : "application/json")}}});\n};\n`
      );
      const result = spawnSync(
        "npx",
        [
          "--offline",
          "tsx",
          "--import",
          pathToFileURL(preload).href,
          "scripts/council-invoke.ts",
          "--member",
          "mistral",
          "--provider",
          "openrouter",
          "--transport",
          transport,
          "--prompt",
          "Synthetic fixture only",
          "--output",
          output,
          "--max-retries",
          "0",
        ],
        {
          cwd: process.cwd(),
          encoding: "utf8",
          timeout: 30000,
          env: {
            ...process.env,
            OPENROUTER_API_KEY: ["synthetic", "test", "fixture"].join("-"),
            OPENROUTER_MISTRAL_MODEL: "",
          },
        }
      );
      assert.equal(result.status, status === 200 ? 6 : 5, result.error?.message ?? result.stderr);
      const receipt = JSON.parse(await readFile(output + ".provenance.json", "utf8"));
      assert.equal(receipt.final.verification.result, "UNVERIFIABLE");
      assert.equal(receipt.final.verification.observed, null);
      assert.equal(receipt.attempts.length, 1);
      assert.equal(receipt.attempts[0].http_status, status);
      if (status === 200) {
        assert.equal(receipt.final.outcome, "success");
        assert.equal(await readFile(output, "utf8"), "Synthetic output");
        assert.match(result.stderr, /model_identity_unverifiable.*HALT/);
      } else {
        assert.equal(receipt.final.outcome, "permanent_provider_error");
        await assert.rejects(readFile(output), { code: "ENOENT" });
      }
    });
  }
}

// scaffold#917: the served-provider gate through the real dispatcher. DeepSeek is the seat pinned
// to one provider ("CoreWeave only"); OpenRouter names the serving provider on buffered bodies and
// on every SSE chunk (live-verified 2026-09-28, 7 of 7 chunks). Every response here is synthetic.
const providerCases = [
  { name: "inside the pin", field: { provider: "CoreWeave" }, verification: "PASS", exit: 0 },
  { name: "inside the pin, other casing", field: { provider: " coreweave " }, verification: "PASS", exit: 0 },
  { name: "outside the pin", field: { provider: "GMICloud" }, verification: "FAIL", exit: 7 },
  { name: "absent", field: {}, verification: "UNVERIFIABLE", exit: 0 },
  { name: "null", field: { provider: null }, verification: "UNVERIFIABLE", exit: 0 },
  { name: "blank", field: { provider: "   " }, verification: "UNVERIFIABLE", exit: 0 },
  { name: "non-string", field: { provider: 7 }, verification: "UNVERIFIABLE", exit: 0 },
] as const;

for (const transport of ["buffered", "sse"] as const) {
  for (const scenario of providerCases) {
    test(`provider gate: deepseek ${transport} ${scenario.name}`, async (t) => {
      await mkdir(join(process.cwd(), ".work"), { recursive: true });
      const directory = await mkdtemp(join(process.cwd(), ".work", "provider-917-"));
      t.after(() => rm(directory, { recursive: true, force: true }));
      const priorKey = process.env.OPENROUTER_API_KEY;
      process.env.OPENROUTER_API_KEY = ["synthetic", "test", "fixture"].join("-");
      t.after(() => {
        if (priorKey === undefined) delete process.env.OPENROUTER_API_KEY;
        else process.env.OPENROUTER_API_KEY = priorKey;
      });
      const output = join(directory, "result.txt");
      const content = "Synthetic content; routing must be checked separately.\n";
      const usage = {
        prompt_tokens: 3,
        completion_tokens: 4,
        total_tokens: 7,
        completion_tokens_details: { reasoning_tokens: 2 },
      };
      let calls = 0;
      t.mock.method(globalThis, "fetch", async (_url: string | URL, request: RequestInit) => {
        const sent = JSON.parse(String(request.body));
        assert.equal(sent.model, "deepseek/deepseek-v4-pro-0813");
        assert.deepEqual(sent.provider, {
          only: ["coreweave/fp8"],
          order: ["coreweave/fp8"],
          allow_fallbacks: false,
        });
        calls += 1;
        const frame = (extra: Record<string, unknown>) => ({
          model: "deepseek/deepseek-v4-pro-0813",
          ...scenario.field,
          ...extra,
        });
        if (transport === "sse") {
          const frames = [
            frame({ choices: [{ delta: { content: content.slice(0, 10) }, finish_reason: null }] }),
            frame({ choices: [{ delta: { content: content.slice(10) }, finish_reason: "stop" }], usage }),
          ];
          return new Response(
            frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join("") + "data: [DONE]\n\n",
            { headers: { "content-type": "text/event-stream" } }
          );
        }
        return Response.json(
          frame({ choices: [{ message: { content }, finish_reason: "stop" }], usage })
        );
      });
      const exit = await runCouncilInvocation([
        "--member",
        "deepseek",
        "--provider",
        "openrouter",
        "--transport",
        transport,
        "--prompt",
        "Synthetic fixture only",
        "--output",
        output,
        "--max-retries",
        "3",
        "--retry-base-ms",
        "1",
      ]);
      assert.equal(exit, scenario.exit);
      assert.equal(calls, 1, "a routing violation or a routing gap must not trigger paid retries");
      const receipt = JSON.parse(await readFile(output + ".provenance.json", "utf8"));
      const routing = receipt.final.provider_verification;
      assert.equal(routing.result, scenario.verification);
      assert.deepEqual(routing.declared, ["CoreWeave"]);
      assert.equal(routing.evidence, "response_provider_field");
      assert.equal(receipt.attempts.length, 1);
      assert.equal(receipt.attempts[0].served_provider, routing.observed);
      const expectedProviders = routing.observed === null ? [] :
        Array(transport === "sse" ? 2 : 1).fill(routing.observed);
      assert.deepEqual(receipt.attempts[0].served_provider_observations, expectedProviders);
      assert.deepEqual(routing.observed_providers, expectedProviders);
      // The model was right in every case; routing carries its own verdict.
      assert.equal(receipt.final.verification.result, "PASS");
      if (scenario.exit === 7) {
        assert.equal(routing.observed, "GMICloud");
        assert.equal(receipt.final.outcome, "provider_mismatch_no_retry");
        assert.equal(receipt.attempts[0].outcome, "provider_mismatch");
        assert.match(receipt.attempts[0].error_message, /outside the seat's pin \[CoreWeave\]/);
        await assert.rejects(readFile(output), { code: "ENOENT" });
      } else {
        assert.equal(receipt.final.outcome, "success");
        assert.equal(await readFile(output, "utf8"), content);
        if (scenario.verification === "PASS") assert.equal(routing.observed.trim().toLowerCase(), "coreweave");
        else assert.equal(routing.observed, null);
      }
    });
  }
}

test("provider gate: an unpinned seat records its served provider as NOT_PINNED, never as a pass", async (t) => {
  await mkdir(join(process.cwd(), ".work"), { recursive: true });
  const directory = await mkdtemp(join(process.cwd(), ".work", "provider-917-unpinned-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const priorKey = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = ["synthetic", "test", "fixture"].join("-");
  t.after(() => {
    if (priorKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = priorKey;
  });
  for (const [label, served] of [
    ["named", "Anthropic"],
    ["unnamed", undefined],
  ] as const) {
    t.mock.method(globalThis, "fetch", async () =>
      Response.json({
        model: "anthropic/claude-fable-5.1-20260831",
        ...(served ? { provider: served } : {}),
        choices: [{ message: { content: "Synthetic" }, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 3,
          completion_tokens: 4,
          total_tokens: 7,
          completion_tokens_details: { reasoning_tokens: 2 },
        },
      })
    );
    const output = join(directory, `${label}.txt`);
    const exit = await runCouncilInvocation([
      "--member",
      "claude",
      "--provider",
      "openrouter",
      "--prompt",
      "Synthetic fixture only",
      "--output",
      output,
      "--max-retries",
      "0",
    ]);
    assert.equal(exit, 0);
    const receipt = JSON.parse(await readFile(output + ".provenance.json", "utf8"));
    assert.deepEqual(receipt.final.provider_verification, {
      result: "NOT_PINNED",
      declared: null,
      evidence: "response_provider_field",
      observed: served ?? null,
      observed_providers: served ? [served] : [],
    });
    assert.equal(receipt.attempts[0].served_provider, served ?? null);
  }
});

describe("served-provider classification (scaffold#917)", () => {
  const base = {
    fetchError: null,
    httpStatus: 200,
    observedModel: "deepseek/deepseek-v4-pro-0813",
    declaredMatches: true,
    contentLength: 5,
    wasTruncated: false,
  };
  it("a provider outside the pin is provider_mismatch and never retried", () => {
    assert.deepEqual(
      classifyAttempt({ ...base, servedProvider: "GMICloud", servedProviders: ["CoreWeave"] }),
      { shouldRetry: false, reason: "provider_mismatch", bumpMaxTokens: false }
    );
  });
  it("a model mismatch outranks a provider mismatch, and a missing provider is not a mismatch", () => {
    assert.equal(
      classifyAttempt({
        ...base,
        observedModel: "other/model",
        declaredMatches: false,
        servedProvider: "GMICloud",
        servedProviders: ["CoreWeave"],
      }).reason,
      "model_mismatch"
    );
    assert.equal(
      classifyAttempt({ ...base, servedProvider: null, servedProviders: ["CoreWeave"] }).reason,
      "success"
    );
  });
  it("a caller holding no routing evidence keeps the pre-#917 classification", () => {
    // The staged controller re-derives attempts without these inputs; it then disagrees with a
    // recorded provider_mismatch and refuses the evidence rather than accepting it.
    assert.equal(classifyAttempt({ ...base }).reason, "success");
    assert.equal(classifyAttempt({ ...base, servedProvider: "GMICloud" }).reason, "success");
  });
  it("verification: PASS, FAIL, UNVERIFIABLE, NOT_PINNED; names compare trimmed and case-insensitively", () => {
    assert.equal(verifyServedProvider(["CoreWeave"], "CoreWeave"), "PASS");
    assert.equal(verifyServedProvider(["CoreWeave"], "  COREWEAVE "), "PASS");
    assert.equal(verifyServedProvider(["CoreWeave"], "CoreWeaver"), "FAIL");
    assert.equal(verifyServedProvider(["CoreWeave"], ""), "UNVERIFIABLE");
    assert.equal(verifyServedProvider(["CoreWeave"], null), "UNVERIFIABLE");
    assert.equal(verifyServedProvider(undefined, "CoreWeave"), "NOT_PINNED");
    assert.equal(verifyServedProvider([], "CoreWeave"), "NOT_PINNED");
    assert.equal(servedProviderMatches(["Modal", "Together"], "together"), true);
    assert.equal(servedProviderMatches(null, "Together"), false);
  });
  it("a pin admits its exact tag and the tags beneath it, never a longer provider slug", () => {
    const endpoints = [
      { tag: "modal/mxfp4", provider_name: "Modal" },
      { tag: "modality", provider_name: "Modality" },
      { tag: "together", provider_name: "Together" },
      { tag: "coreweave/fp8", provider_name: "CoreWeave" },
    ];
    assert.deepEqual(
      admittedProviderNames({ order: ["modal", "together"], allow_fallbacks: false }, endpoints),
      ["Modal", "Together"]
    );
    assert.deepEqual(
      admittedProviderNames(
        { only: ["coreweave/fp8"], order: ["modal"], allow_fallbacks: false },
        endpoints
      ),
      ["CoreWeave"]
    );
    assert.equal(admittedProviderNames({ order: ["modal"] }, endpoints), null, "fallbacks allowed");
    assert.equal(admittedProviderNames(undefined, endpoints), null);
  });
  it("only OpenRouter recipes read a served provider; a pinned recipe declares what its pin admits", () => {
    for (const [member, recipe] of Object.entries(OPENROUTER_RECIPES)) {
      assert.equal(typeof recipe.extractServedProvider, "function", member);
      const body = recipe.buildBody({ userPrompt: "", systemPrompt: null, maxTokens: 1, transport: "buffered" });
      assert.equal(Boolean(body.provider), Boolean(recipe.servedProviders?.length), member);
    }
    assert.equal(
      selectRecipe({ member: "claude", provider: "direct" } as never).extractServedProvider,
      undefined,
      "a direct substrate is itself the provider"
    );
  });
});

const repoRoot = process.cwd();

function invokeWithEnv(
  args: string[],
  envOverrides: Record<string, string>
): {
  status: number | null;
  stderr: string;
} {
  const result = spawnSync("npx", ["tsx", "scripts/council-invoke.ts", ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
  return { status: result.status, stderr: result.stderr };
}

describe("council-invoke Mistral route selection", () => {
  it("uses OpenRouter for Mistral when --provider is omitted", () => {
    const result = invokeWithEnv(
      ["--member", "mistral", "--prompt", "hello", "--output", "tmp/council-routing.md"],
      { OPENROUTER_API_KEY: "", AZURE_AI_API_KEY: "fake-azure-key" } // pragma: allowlist secret
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /Required env var OPENROUTER_API_KEY is not set/);
  });

  it("uses Azure Foundry for Mistral when --provider azure is explicit", () => {
    const result = invokeWithEnv(
      [
        "--member",
        "mistral",
        "--provider",
        "azure",
        "--prompt",
        "hello",
        "--output",
        "tmp/council-routing.md",
      ],
      { OPENROUTER_API_KEY: ["fake", "openrouter", "key"].join("-"), AZURE_AI_API_KEY: "" }
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /Required env var AZURE_AI_API_KEY is not set/);
  });

  it("uses Amazon Bedrock for Mistral when --provider bedrock is explicit", () => {
    const result = invokeWithEnv(
      [
        "--member",
        "mistral",
        "--provider",
        "bedrock",
        "--prompt",
        "hello",
        "--output",
        "tmp/council-routing.md",
      ],
      {
        OPENROUTER_API_KEY: ["fake", "openrouter", "key"].join("-"),
        AZURE_AI_API_KEY: "fake-azure-key", // pragma: allowlist secret
        AWS_REGION: "",
      }
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /Required env var AWS_REGION is not set/);
  });

  it("rejects SSE transport for members without an SSE recipe", () => {
    const result = invokeWithEnv(
      [
        "--member",
        "claude",
        "--transport",
        "sse",
        "--prompt",
        "hello",
        "--output",
        "tmp/council-routing.md",
      ],
      { ANTHROPIC_API_KEY: ["fake", "anthropic", "key"].join("-") }
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /--transport sse is not supported for --member claude/);
  });

  it("rejects EventStream transport for members without a Bedrock EventStream recipe", () => {
    const result = invokeWithEnv(
      [
        "--member",
        "claude",
        "--transport",
        "eventstream",
        "--prompt",
        "hello",
        "--output",
        "tmp/council-routing.md",
      ],
      { ANTHROPIC_API_KEY: ["fake", "anthropic", "key"].join("-") }
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /--transport eventstream is not supported for --member claude/);
  });

  it("allows Mistral's Bedrock EventStream route to reach AWS env preflight", () => {
    const result = invokeWithEnv(
      [
        "--member",
        "mistral",
        "--provider",
        "bedrock",
        "--transport",
        "eventstream",
        "--prompt",
        "hello",
        "--output",
        "tmp/council-routing.md",
      ],
      {
        OPENROUTER_API_KEY: ["fake", "openrouter", "key"].join("-"),
        AZURE_AI_API_KEY: "fake-azure-key", // pragma: allowlist secret
        AWS_REGION: "",
      }
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /Required env var AWS_REGION is not set/);
  });

  it("allows Mistral's OpenRouter SSE route to reach OpenRouter env preflight", () => {
    const result = invokeWithEnv(
      [
        "--member",
        "mistral",
        "--provider",
        "openrouter",
        "--transport",
        "sse",
        "--prompt",
        "hello",
        "--output",
        "tmp/council-routing.md",
      ],
      {
        OPENROUTER_API_KEY: "",
        AZURE_AI_API_KEY: "fake-azure-key",
        AWS_REGION: "us-east-1",
      } // pragma: allowlist secret
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /Required env var OPENROUTER_API_KEY is not set/);
  });

  it("allows Kimi's explicit direct SSE route to reach Azure env preflight", () => {
    const result = invokeWithEnv(
      [
        "--member",
        "kimi",
        "--provider",
        "direct",
        "--transport",
        "sse",
        "--prompt",
        "hello",
        "--output",
        "tmp/council-routing.md",
      ],
      { AZURE_AI_API_KEY: "" }
    );

    assert.equal(result.status, 4);
    assert.match(result.stderr, /Required env var AZURE_AI_API_KEY is not set/);
  });
});

// selectRecipe only reads .provider and .member off CliArgs.
const cliArgs = (provider: string, member: string) =>
  ({ provider, member }) as unknown as Parameters<typeof selectRecipe>[0];

describe("openRouterModelMatches — identity gate", () => {
  const accept: ReadonlyArray<readonly [string, string]> = [
    ["anthropic/claude-opus-5", "anthropic/claude-opus-5-20260723"],
    ["openai/gpt-5.6-sol", "openai/gpt-5.6-sol-20260701"],
    ["google/gemini-3.1-pro-preview", "google/gemini-3.1-pro-preview-20260219"],
    ["moonshotai/kimi-k2.6", "moonshotai/kimi-k2.6-20260420"],
    ["mistralai/mistral-large-2512", "mistralai/mistral-large-2512"],
    // The seats of record (2026-09-09): date-stamped canonical echoes.
    ["anthropic/claude-fable-5.1", "anthropic/claude-fable-5.1-20260831"],
    ["openai/gpt-6-astra", "openai/gpt-6-astra-20260903"],
    ["moonshotai/kimi-k3", "moonshotai/kimi-k3-20260715"],
    ["google/gemini-3.8-flash", "google/gemini-3.8-flash-20260902"],
  ];
  const reject: ReadonlyArray<readonly [string, string]> = [
    // A served predecessor or a variant is a different model, whatever the prefix.
    ["anthropic/claude-fable-5.1", "anthropic/claude-fable-5-20260701"],
    ["openai/gpt-6-astra", "openai/gpt-6-astra-pro-20260903"],
    ["openai/gpt-6-astra", "openai/gpt-5.6-sol-20260701"],
    ["moonshotai/kimi-k3", "moonshotai/kimi-k2.6-20260420"],
    ["google/gemini-3.8-flash", "google/gemini-3.7-flash-20260813"],
    ["google/gemini-3.8-flash", "google/gemini-3.1-pro-preview-20260219"],
    ["openai/gpt-5.6-sol", "openai/gpt-5.6-sol-pro-20260701"],
    ["openai/gpt-5.6-sol", "openai/gpt-5.6-terra-20260701"],
    ["anthropic/claude-opus-5", "anthropic/claude-opus-4.8-20260528"],
    ["anthropic/claude-opus-5", "anthropic/claude-fable-5-20260701"],
    ["anthropic/claude-opus-5", "openai/gpt-5.6-sol-20260701"],
    ["moonshotai/kimi-k2.6", "moonshotai/kimi-k2.6-fast-20260101"],
  ];
  for (const [slug, observed] of accept) {
    it(`accepts ${observed} for ${slug}`, () => {
      assert.equal(openRouterModelMatches(slug, observed), true);
    });
  }
  for (const [slug, observed] of reject) {
    it(`rejects ${observed} for ${slug}`, () => {
      assert.equal(openRouterModelMatches(slug, observed), false);
    });
  }
});

describe("OPENROUTER_RECIPES — per-seat pin, effort, identity", () => {
  // Mirrors OPENROUTER_SEATS: the 2026-08-27 roster revision (Kimi K3; gemini at
  // high, its advertised ceiling), the 2026-09-03 limits audit (kimi high → max,
  // K3's own default, once budgets sat at the model maximum — pfi-collaboration,
  // owner direction), the 2026-09-08 Kimi provider pin, and the 2026-09-09 operator
  // direction (claude seat → Fable 5.1 at xhigh; gpt seat → GPT-6 Astra at max), and
  // the 2026-09-10 owner ruling (gemini seat → Gemini 3.8 Flash at high, scaffold#621).
  // Converged as one fleet table in the scaffold corpus (scaffold#571).
  const expected = {
    claude: {
      slug: "anthropic/claude-fable-5.1",
      effort: "xhigh" as const,
      observed: "anthropic/claude-fable-5.1-20260831",
    },
    gemini: {
      slug: "google/gemini-3.8-flash",
      effort: "high" as const,
      observed: "google/gemini-3.8-flash-20260902",
    },
    gpt: {
      slug: "openai/gpt-6-astra",
      effort: "max" as const,
      observed: "openai/gpt-6-astra-20260903",
    },
    kimi: {
      slug: "moonshotai/kimi-k3",
      effort: "max" as const,
      observed: "moonshotai/kimi-k3-20260715",
    },
    mistral: {
      slug: "mistralai/mistral-large-2512",
      effort: null,
      observed: "mistralai/mistral-large-2512",
    },
  } as const;

  for (const [seat, exp] of Object.entries(expected)) {
    const recipe = OPENROUTER_RECIPES[seat as keyof typeof OPENROUTER_RECIPES];
    it(`${seat}: substrate is openrouter`, () => {
      assert.equal(recipe.substrate, "openrouter");
    });
    it(`${seat}: body pins ${exp.slug}${exp.effort ? ` + reasoning effort=${exp.effort}` : " (no reasoning)"}`, () => {
      const body = recipe.buildBody({
        userPrompt: "ping",
        systemPrompt: null,
        maxTokens: 1024,
      });
      assert.equal(body.model, exp.slug);
      if (exp.effort) assert.deepEqual(body.reasoning, { effort: exp.effort });
      else assert.equal("reasoning" in body, false);
    });
    it(`${seat}: modelMatches accepts its live-observed echo`, () => {
      assert.equal(recipe.modelMatches(exp.observed), true);
    });
  }

  it("gpt: body pins the live-verified OpenAI provider", () => {
    const body = OPENROUTER_RECIPES.gpt.buildBody({
      userPrompt: "ping",
      systemPrompt: null,
      maxTokens: 1024,
    });
    assert.deepEqual(body.provider, {
      order: ["openai"],
      allow_fallbacks: false,
    });
  });

  it("kimi: body pins the fast, healthy providers in order with no fallbacks (2026-09-08) at effort max (2026-09-03)", () => {
    const body = OPENROUTER_RECIPES.kimi.buildBody({
      userPrompt: "ping",
      systemPrompt: null,
      maxTokens: 1024,
    });
    assert.deepEqual(body.provider, {
      order: ["modal", "sail-research", "together", "moonshotai"],
      allow_fallbacks: false,
    });
    assert.deepEqual(body.reasoning, { effort: "max" });
  });

  it("every OpenRouter seat requests its full output ceiling on the first attempt (2026-09-03 limits audit)", () => {
    const ceilings = {
      claude: 128000,
      gemini: 65536,
      gpt: 128000,
      kimi: 262144,
      mistral: 131072,
    } as const;
    for (const [seat, ceiling] of Object.entries(ceilings)) {
      const recipe = OPENROUTER_RECIPES[seat as keyof typeof OPENROUTER_RECIPES];
      assert.equal(recipe.defaultMaxTokens, ceiling, `${seat} starts at its ceiling`);
      assert.equal(recipe.maxTokensCeiling, ceiling, `${seat} ceiling`);
    }
  });

  it("reasoning seats without a provider pin emit no provider field", () => {
    for (const seat of ["claude", "gemini"] as const) {
      const body = OPENROUTER_RECIPES[seat].buildBody({
        userPrompt: "ping",
        systemPrompt: null,
        maxTokens: 1024,
      });
      assert.equal("provider" in body, false);
    }
  });
});

describe("selectRecipe — provider routing", () => {
  const members = ["claude", "gemini", "gpt", "kimi", "mistral"] as const;
  it("--provider openrouter → OpenRouter recipe for every member", () => {
    for (const m of members) {
      assert.equal(selectRecipe(cliArgs("openrouter", m)).substrate, "openrouter");
    }
  });
  it("--provider default → OpenRouter recipe for every member", () => {
    for (const m of members) {
      assert.equal(selectRecipe(cliArgs("default", m)).substrate, "openrouter");
    }
  });
  it("--provider direct → direct-provider recipe for every member", () => {
    for (const m of members) {
      assert.notEqual(selectRecipe(cliArgs("direct", m)).substrate, "openrouter");
    }
  });
});

// The OpenRouter-only members (scaffold#915): Muse holds the definitive fifth seat; Grok and
// DeepSeek are the non-binding shadows. Each pin and its served providers are asserted exactly.
for (const [member, slug, effort, pin, served] of [
  ["muse", "meta/muse-spark-1.3", "max", { order: ["meta"], allow_fallbacks: false }, ["Meta"]],
  ["grok", "x-ai/grok-4.7", "xhigh", { order: ["xai"], allow_fallbacks: false }, ["xAI"]],
  [
    "deepseek",
    "deepseek/deepseek-v4-pro-0813",
    "max",
    { only: ["coreweave/fp8"], order: ["coreweave/fp8"], allow_fallbacks: false },
    ["CoreWeave"],
  ],
] as const) {
  test(`${member} OpenRouter-only recipe preserves exact identity, native effort, pin, served providers and output reservation`, () => {
    const recipe = OPENROUTER_RECIPES[member];
    const body = recipe.buildBody({
      userPrompt: "synthetic",
      systemPrompt: null,
      maxTokens: 131072,
      transport: "sse",
    });
    assert.equal(body.model, slug);
    assert.equal(body.max_tokens, 131072);
    assert.deepEqual(body.reasoning, { effort });
    assert.deepEqual(body.provider, pin);
    assert.deepEqual(recipe.servedProviders, served);
    assert.equal(recipe.supportsSse, true);
    assert.equal(recipe.defaultTransport, "sse");
    assert.ok(recipe.modelMatches(slug));
    assert.ok(recipe.modelMatches(slug + "-20260902"));
    assert.equal(recipe.modelMatches("mistralai/mistral-large-2512"), false);
    assert.equal(recipe.modelMatches(slug + "-contributor"), false);
    assert.equal(recipe.modelMatches(slug + "-mini"), false);
    assert.throws(() => selectRecipe({ member, provider: "direct" } as never), /supports only/);
  });
}

for (const member of ["muse", "grok", "deepseek"] as const) {
  test(`${member}: actual SSE dispatcher requests streaming and preserves chunked identity, provider, usage and content`, async (t) => {
    await mkdir(join(process.cwd(), ".work"), { recursive: true });
    const directory = await mkdtemp(join(process.cwd(), ".work", "shadow-sse-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const priorKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = ["synthetic", "test", "fixture"].join("-");
    t.after(() => {
      if (priorKey === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = priorKey;
    });
    const recipe = OPENROUTER_RECIPES[member];
    const model = recipe.buildBody({
      userPrompt: "",
      systemPrompt: null,
      maxTokens: 4096,
      transport: "sse",
    }).model;
    // OpenRouter names the serving provider on every chunk (scaffold#917).
    const provider = recipe.servedProviders![0];
    t.mock.method(globalThis, "fetch", async (_url: unknown, request: RequestInit) => {
      const body = JSON.parse(String(request.body));
      assert.equal(body.model, model);
      assert.equal(body.stream, true);
      assert.deepEqual(body.stream_options, { include_usage: true });
      const frames = [
        {
          model,
          provider,
          choices: [{ delta: { content: "10" }, finish_reason: null }],
        },
        {
          model,
          provider,
          choices: [{ delta: { content: "81" }, finish_reason: "stop" }],
          usage: {
            prompt_tokens: 9,
            completion_tokens: 8,
            total_tokens: 17,
            completion_tokens_details: { reasoning_tokens: 6 },
          },
        },
      ];
      const text =
        frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join("") + "data: [DONE]\n\n";
      // Split inside frames as well as between them, as a network stream can.
      const bytes = new TextEncoder().encode(text);
      return new Response(
        new ReadableStream({
          start(controller) {
            for (let i = 0; i < bytes.length; i += 7) controller.enqueue(bytes.slice(i, i + 7));
            controller.close();
          },
        }),
        { headers: { "content-type": "text/event-stream" } }
      );
    });
    const output = join(directory, "result.txt");
    const code = await runCouncilInvocation([
      "--member",
      member,
      "--provider",
      "openrouter",
      "--transport",
      "sse",
      "--prompt",
      "synthetic",
      "--output",
      output,
      "--max-retries",
      "0",
    ]);
    assert.equal(code, 0);
    assert.equal(await readFile(output, "utf8"), "1081");
    const receipt = JSON.parse(await readFile(output + ".provenance.json", "utf8"));
    assert.equal(receipt.member, member);
    assert.equal(receipt.final.verification.result, "PASS");
    assert.equal(receipt.final.effort_verification.result, "PASS");
    assert.equal(receipt.final.tokens.reasoning, 6);
    assert.equal(receipt.attempts[0].stream_done, true);
    assert.equal(receipt.attempts[0].served_provider, provider);
    assert.deepEqual(receipt.final.provider_verification, {
      result: "PASS",
      declared: [...recipe.servedProviders!],
      evidence: "response_provider_field",
      observed: provider,
      observed_providers: [provider, provider],
    });
  });
}


// #943: the final provider never stands in for the whole stream. These invoke the actual
// dispatcher with synthetic split frames, including late errors and nonblank repetitions.
for (const scenario of [
  { name: "wrong content then allowed final", providers: ["GMICloud", "CoreWeave"], verdict: "FAIL", exit: 7 },
  { name: "allowed content then wrong final", providers: ["CoreWeave", "GMICloud"], verdict: "FAIL", exit: 7 },
  { name: "repeated allowed observations", providers: ["CoreWeave", "CoreWeave"], verdict: "PASS", exit: 0 },
  { name: "allowed casing and whitespace", providers: [" coreweave ", "COREWEAVE"], verdict: "PASS", exit: 0 },
  { name: "wrong followed by blank", providers: ["GMICloud", " "], verdict: "FAIL", exit: 7 },
  { name: "wrong followed by absent", providers: ["GMICloud", null], verdict: "FAIL", exit: 7 },
  { name: "all absent or blank", providers: [null, " "], verdict: "UNVERIFIABLE", exit: 0 },
  { name: "wrong before stream read error", providers: ["GMICloud", "CoreWeave"], verdict: "FAIL", exit: 7, broken: true },
  { name: "wrong before stream timeout", providers: ["GMICloud", "CoreWeave"], verdict: "FAIL", exit: 7, timeout: true },
  { name: "wrong before provider error event", providers: ["GMICloud", "CoreWeave"], verdict: "FAIL", exit: 7, errorEvent: true },
] as const) {
  test(`complete provider evidence: ${scenario.name}`, async (t) => {
    await mkdir(join(process.cwd(), ".work"), { recursive: true });
    const directory = await mkdtemp(join(process.cwd(), ".work", "provider-943-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const priorKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = ["synthetic", "test", "fixture"].join("-");
    t.after(() => {
      if (priorKey === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = priorKey;
    });
    const model = "deepseek/deepseek-v4-pro-0813";
    let calls = 0;
    t.mock.method(globalThis, "fetch", async (url: unknown, request: RequestInit) => {
      assert.equal(String(url), "https://openrouter.ai/api/v1/chat/completions");
      const body = JSON.parse(String(request.body));
      assert.equal(body.model, model);
      assert.equal(body.stream, true);
      assert.deepEqual(body.provider, {
        only: ["coreweave/fp8"], order: ["coreweave/fp8"], allow_fallbacks: false,
      });
      calls++;
      const frames = scenario.providers.map((provider, index) => ({
        model, ...(provider === null ? {} : { provider }),
        choices: [{ delta: { content: index === 0 ? "Synthetic content" : "" }, finish_reason: index === 1 ? "stop" : null }],
        ...(index === 1 ? { usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7,
          completion_tokens_details: { reasoning_tokens: 2 } } } : {}),
      }));
      let payload = frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join("");
      if ("errorEvent" in scenario) payload += 'data: {"error":{"message":"synthetic interruption"}}\n\n';
      else if (!("broken" in scenario) && !("timeout" in scenario)) payload += "data: [DONE]\n\n";
      const bytes = new TextEncoder().encode(payload);
      let offset = 0;
      return new Response(new ReadableStream({
        start(controller) {
          if ("timeout" in scenario) request.signal?.addEventListener("abort", () => {
            controller.error(new Error("synthetic timeout"));
          }, { once: true });
        },
        pull(controller) {
          if (offset < bytes.length) {
            controller.enqueue(bytes.slice(offset, offset + 13));
            offset += 13;
          } else if ("broken" in scenario) controller.error(new Error("synthetic read failure"));
          else if ("timeout" in scenario) return new Promise<void>(() => {});
          else controller.close();
        },
      }), { headers: { "content-type": "text/event-stream" } });
    });
    const output = join(directory, "result.txt");
    const exit = await runCouncilInvocation([
      "--member", "deepseek", "--provider", "openrouter",
      "--transport", "sse", "--prompt", "synthetic", "--output", output,
      "--max-retries", "3", "--retry-base-ms", "1",
      ...("timeout" in scenario ? ["--per-attempt-timeout-ms", "100"] : []),
    ]);
    assert.equal(exit, scenario.exit);
    assert.equal(calls, 1, "no later event or interruption conceals a mismatch behind a retry");
    const receipt = JSON.parse(await readFile(output + ".provenance.json", "utf8"));
    const observations = scenario.providers.filter((name) => typeof name === "string" && name.trim());
    assert.deepEqual(receipt.attempts[0].served_provider_observations, observations);
    assert.deepEqual(receipt.final.provider_verification.observed_providers, observations);
    assert.equal(receipt.final.provider_verification.observed, observations.at(-1) ?? null);
    assert.equal(receipt.final.provider_verification.result, scenario.verdict);
    assert.equal(receipt.final.retries_used, 0);
    if (scenario.exit === 7) {
      assert.equal(receipt.final.outcome, "provider_mismatch_no_retry");
      assert.equal(receipt.attempts[0].tokens.total, 7, "observed usage remains accounted");
      await assert.rejects(readFile(output), { code: "ENOENT" });
    } else assert.equal(await readFile(output, "utf8"), "Synthetic content");
  });
}

test("a known provider mismatch is terminal across transport statuses and cannot fall back to its final scalar", () => {
  for (const httpStatus of [null, 200, 429, 503]) {
    assert.deepEqual(classifyAttempt({
      fetchError: new Error("synthetic transport error"), httpStatus,
      observedModel: "deepseek/deepseek-v4-pro-0813", declaredMatches: true,
      contentLength: 10, wasTruncated: false, servedProvider: "CoreWeave",
      servedProviderObservations: ["GMICloud", "CoreWeave"], servedProviders: ["CoreWeave"],
    }), { shouldRetry: false, reason: "provider_mismatch", bumpMaxTokens: false });
  }
});

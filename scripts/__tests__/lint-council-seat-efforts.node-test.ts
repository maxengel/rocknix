/**
 * Branch tests for scripts/lint-council-seat-efforts.ts — the output-ceiling classification.
 *
 * WHY. The lint became a corpus base file in 4.7.0 (scaffold#614) and compares every seat's
 * maxOutputTokens against its model's pinned max_completion_tokens. On the live table only the
 * below-model branch ever runs (kimi: 262144 of a possible 943718); the exceeds branch and the
 * missing-max_completion_tokens branch had never executed anywhere when the source estate's
 * Merge Reviewer named the gap on the 4.8.1 adoption (the source estate's issue 4595, finding
 * `scripts-lint-council-seat-efforts-output-ceiling-untested`, tracked at the source as
 * scaffold#642). A gate that "cannot silently misclassify seat limits" needs its branches proven,
 * so this suite drives the exported pure `lintSeats()` with fixture seat tables and fixture
 * snapshots — never council-seat-efforts.json, never the OpenRouter catalogue.
 *
 * Every case asserts `checked` and an EXACT findings.length: a check that examines nothing passes
 * silently (the issue's AC 3), and `>= 1` would let a second, wrong finding hide behind the right
 * one. The fixture numbers (128000 / 65536 / 262144 / 943718) mirror shapes the live table has had
 * so a reader can map a case to a real seat; the slugs are synthetic on purpose.
 *
 * Run via:  npx tsx --test scripts/__tests__/lint-council-seat-efforts.node-test.ts
 *           node --test scripts/__tests__/lint-council-seat-efforts.node-test.ts   (Node 24 runs .ts natively)
 *
 * The `.node-test.ts` suffix is deliberate — keep it. Why, and the fleet evidence, live in one
 * place: the routing suite's header (scripts/__tests__/council-invoke-routing.node-test.ts) and
 * seed/corpus/CHANGELOG.md § 4.8.1. `npx tsx --test <path>` runs any explicit path.
 *
 * Corpus base file (scaffold#642; the routing suite from scaffold#571 is the precedent): seeded
 * into every fleet repo beside the lint it proves and run from the repo root. Two cases leave the
 * fixtures: (h) runs the shipped CLI against the live table and asserts the seat COUNT, and (i)
 * imports the module and asserts the entry guard keeps main() from running at import — the
 * property every in-process test here depends on.
 */
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { lintSeats } from "../lint-council-seat-efforts.ts";
import type { LintSeat, SeatFinding, Snapshot } from "../lint-council-seat-efforts.ts";
import { OPENROUTER_SEATS, SHADOW_OPENROUTER_SEATS, pinEntries } from "../council-invoke.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../..");
const LINT = resolve(REPO_ROOT, "scripts/lint-council-seat-efforts.ts");

function snapshot(models: Snapshot["models"]): Snapshot {
  return {
    schema_version: "council-seat-efforts@1.0.0",
    refreshed_at: "2026-01-01T00:00:00Z",
    refreshed_from: "fixture — never the live catalogue",
    models,
  };
}

function seat(
  slug: string,
  maxOutputTokens: number,
  effort: LintSeat["effort"] = "high"
): LintSeat {
  return { slug, effort, maxOutputTokens };
}

const classes = (findings: SeatFinding[]): string[] => findings.map((f) => f.class);

describe("output ceiling vs the model's max_completion_tokens", () => {
  it("(a) a seat above the model's maximum is output_ceiling_exceeds_model — FAIL under --strict, counted", () => {
    const seats = { alpha: seat("fixture/alpha", 200000) };
    const snap = snapshot({
      "fixture/alpha": {
        supported_efforts: ["high"],
        max_completion_tokens: 128000,
      },
    });
    const run = lintSeats(seats, snap, { strict: true });
    assert.equal(run.checked, 1);
    assert.equal(run.findings.length, 1);
    assert.deepEqual(run.findings[0], {
      seatId: "alpha",
      slug: "fixture/alpha",
      class: "output_ceiling_exceeds_model",
      severity: "FAIL",
      counted: true,
      message:
        "[FAIL output_ceiling_exceeds_model] seat alpha (fixture/alpha) requests " +
        "maxOutputTokens=200000 but the model's maximum is 128000.",
    });
  });

  it("(a) the same seat without --strict is a WARN — still counted, so the summary line still reports it", () => {
    const seats = { alpha: seat("fixture/alpha", 200000) };
    const snap = snapshot({
      "fixture/alpha": {
        supported_efforts: ["high"],
        max_completion_tokens: 128000,
      },
    });
    const run = lintSeats(seats, snap, { strict: false });
    assert.equal(run.checked, 1);
    assert.equal(run.findings.length, 1);
    assert.equal(run.findings[0].class, "output_ceiling_exceeds_model");
    assert.equal(run.findings[0].severity, "WARN");
    assert.equal(run.findings[0].counted, true);
    assert.match(run.findings[0].message, /^\[WARN output_ceiling_exceeds_model\] seat alpha /);
  });

  it("(b) a seat below the model's maximum is output_ceiling_below_model — a NOTE, never counted, strict or not", () => {
    const seats = { kappa: seat("fixture/kappa", 262144) };
    const snap = snapshot({
      "fixture/kappa": {
        supported_efforts: ["high"],
        max_completion_tokens: 943718,
      },
    });
    for (const strict of [true, false]) {
      const run = lintSeats(seats, snap, { strict });
      assert.equal(run.checked, 1, `strict=${strict}`);
      assert.equal(run.findings.length, 1, `strict=${strict}`);
      assert.deepEqual(run.findings[0], {
        seatId: "kappa",
        slug: "fixture/kappa",
        class: "output_ceiling_below_model",
        severity: "NOTE",
        counted: false,
        message:
          "[NOTE output_ceiling_below_model] seat kappa (fixture/kappa) uses 262144 of a possible " +
          "943718 completion tokens — a chosen limit; see the seat comment in council-invoke.ts.",
      });
    }
  });

  it("(c) a snapshot entry without max_completion_tokens is output_ceiling_unverified — a NOTE, not the WARN the issue text assumed", () => {
    const seats = { gamma: seat("fixture/gamma", 65536) };
    const snap = snapshot({ "fixture/gamma": { supported_efforts: ["high"] } });
    const run = lintSeats(seats, snap, { strict: true });
    assert.equal(run.checked, 1);
    assert.equal(run.findings.length, 1);
    assert.deepEqual(run.findings[0], {
      seatId: "gamma",
      slug: "fixture/gamma",
      class: "output_ceiling_unverified",
      severity: "NOTE",
      counted: false,
      message:
        "[NOTE output_ceiling_unverified] seat gamma (fixture/gamma): snapshot has no " +
        "max_completion_tokens; run --refresh.",
    });
  });

  it("(c) an explicit null max_completion_tokens (what --refresh writes when the catalogue has none) is the same NOTE", () => {
    const seats = { gamma: seat("fixture/gamma", 65536) };
    const snap = snapshot({
      "fixture/gamma": {
        supported_efforts: ["high"],
        max_completion_tokens: null,
      },
    });
    const run = lintSeats(seats, snap, { strict: true });
    assert.equal(run.checked, 1);
    assert.equal(run.findings.length, 1);
    assert.equal(run.findings[0].class, "output_ceiling_unverified");
    assert.equal(run.findings[0].severity, "NOTE");
    assert.equal(run.findings[0].counted, false);
  });

  it("(d) a seat exactly at the model's maximum raises no ceiling finding — the silent fourth branch", () => {
    const seats = { delta: seat("fixture/delta", 65536) };
    const snap = snapshot({
      "fixture/delta": {
        supported_efforts: ["high"],
        max_completion_tokens: 65536,
      },
    });
    for (const strict of [true, false]) {
      const run = lintSeats(seats, snap, { strict });
      assert.equal(run.checked, 1, `strict=${strict}`);
      assert.equal(run.findings.length, 0, `strict=${strict}: ${classes(run.findings)}`);
    }
  });
});

describe("reasoning effort", () => {
  it('(e) effort "none" skips the effort check, but the ceiling is still checked', () => {
    // supported_efforts is EMPTY, so an effort check that ran would fail — none may.
    const exceeding = lintSeats(
      { nu: seat("fixture/nu", 200000, "none") },
      snapshot({
        "fixture/nu": { supported_efforts: [], max_completion_tokens: 128000 },
      }),
      { strict: true }
    );
    assert.equal(exceeding.checked, 1);
    assert.deepEqual(classes(exceeding.findings), ["output_ceiling_exceeds_model"]);

    const level = lintSeats(
      { nu: seat("fixture/nu", 128000, "none") },
      snapshot({
        "fixture/nu": { supported_efforts: [], max_completion_tokens: 128000 },
      }),
      { strict: true }
    );
    assert.equal(level.checked, 1);
    assert.equal(level.findings.length, 0);
  });

  it("an effort the model does not advertise is effort_unsupported — FAIL/WARN, counted, both stderr lines in one message", () => {
    const seats = { epsilon: seat("fixture/epsilon", 65536, "xhigh") };
    const snap = snapshot({
      "fixture/epsilon": {
        supported_efforts: ["high", "medium", "low"],
        default_effort: "medium",
        max_completion_tokens: 65536,
      },
    });
    const strictRun = lintSeats(seats, snap, { strict: true });
    assert.equal(strictRun.checked, 1);
    assert.equal(strictRun.findings.length, 1);
    assert.deepEqual(strictRun.findings[0], {
      seatId: "epsilon",
      slug: "fixture/epsilon",
      class: "effort_unsupported",
      severity: "FAIL",
      counted: true,
      message:
        '[FAIL effort_unsupported] seat epsilon (fixture/epsilon) requests effort="xhigh" but the ' +
        "model supports [high, medium, low].\n" +
        "       An unsupported effort does NOT reliably error — it can silently fall back to medium " +
        'while the run record still attests effort="xhigh".',
    });

    const lax = lintSeats(seats, snap, { strict: false });
    assert.equal(lax.findings.length, 1);
    assert.equal(lax.findings[0].severity, "WARN");
    assert.equal(lax.findings[0].counted, true);
    assert.match(lax.findings[0].message, /^\[WARN effort_unsupported\] /);

    // No default_effort in the snapshot → the message names "the model default".
    const noDefault = lintSeats(
      seats,
      snapshot({
        "fixture/epsilon": {
          supported_efforts: ["high"],
          max_completion_tokens: 65536,
        },
      }),
      { strict: true }
    );
    assert.equal(noDefault.findings.length, 1);
    assert.match(noDefault.findings[0].message, /fall back to the model default while/);
  });

  it("a seat can carry a ceiling finding and an effort finding — two findings, ceiling first", () => {
    const run = lintSeats(
      { zeta: seat("fixture/zeta", 200000, "xhigh") },
      snapshot({
        "fixture/zeta": {
          supported_efforts: ["high"],
          max_completion_tokens: 128000,
        },
      }),
      { strict: true }
    );
    assert.equal(run.checked, 1);
    assert.deepEqual(classes(run.findings), ["output_ceiling_exceeds_model", "effort_unsupported"]);
    assert.deepEqual(
      run.findings.map((f) => f.counted),
      [true, true]
    );
  });
});

describe("fail-closed and emptiness", () => {
  it("(f) a slug absent from the snapshot is model_not_pinned — FAIL, counted, and every later seat stays unchecked", () => {
    const seats = {
      first: seat("fixture/first", 65536),
      missing: seat("fixture/missing", 65536),
      later: seat("fixture/later", 200000), // would be an exceeds finding if the pass continued
    };
    const snap = snapshot({
      "fixture/first": {
        supported_efforts: ["high"],
        max_completion_tokens: 65536,
      },
      "fixture/later": {
        supported_efforts: ["high"],
        max_completion_tokens: 128000,
      },
    });
    const run = lintSeats(seats, snap, { strict: false });
    assert.equal(run.checked, 1, "only the seat before the unpinned one is checked");
    assert.equal(
      run.findings.length,
      1,
      `later seats must not be classified: ${classes(run.findings)}`
    );
    assert.deepEqual(run.findings[0], {
      seatId: "missing",
      slug: "fixture/missing",
      class: "model_not_pinned",
      severity: "FAIL",
      counted: true,
      message:
        "[FAIL model_not_pinned] seat missing: fixture/missing is absent from " +
        "council-seat-efforts.json. Run --refresh, or the seat is unverifiable.",
    });
  });

  it("(g) an empty seat table checks nothing and finds nothing — the count is what makes emptiness visible", () => {
    const run = lintSeats({}, snapshot({}), { strict: true });
    assert.equal(run.checked, 0);
    assert.equal(run.findings.length, 0);
  });
});

// scaffold#917: a provider-pinned seat declares exactly the provider names its pin admits in the
// model's endpoint list. Fixture endpoints mirror live shapes (a provider slug covering a
// quantized tag, one provider with several tags) under synthetic slugs.
describe("served providers vs the catalogue's endpoints (scaffold#917)", () => {
  const endpoints = [
    { tag: "alpha-host/mxfp4", provider_name: "Alpha Host" },
    { tag: "beta-host", provider_name: "Beta Host" },
    { tag: "beta-host/fast", provider_name: "Beta Host" },
    { tag: "gamma-host/fp8", provider_name: "Gamma Host" },
    { tag: "alphabet/fp8", provider_name: "Alphabet" },
  ];
  const model = { supported_efforts: ["high"], max_completion_tokens: 65536, endpoints };
  const pinned = (
    order: string[],
    servedProviders?: string[],
    extra: Partial<LintSeat["provider"]> = {}
  ): LintSeat => ({
    slug: "fixture/routed",
    effort: "high",
    maxOutputTokens: 65536,
    provider: { order, allow_fallbacks: false, ...extra },
    ...(servedProviders ? { servedProviders } : {}),
  });
  const run = (s: LintSeat, m = model, strict = true) =>
    lintSeats({ routed: s }, snapshot({ "fixture/routed": m }), { strict });

  it("(j) declaring exactly the admitted names passes; a provider slug admits its tags, never a longer slug", () => {
    // "alpha-host" admits alpha-host/mxfp4 but not "alphabet/fp8"; "beta-host" admits both tags,
    // which report one name. Order and duplicates in the endpoint list do not matter.
    const result = run(pinned(["alpha-host", "beta-host"], ["Beta Host", "Alpha Host"]));
    assert.equal(result.checked, 1);
    assert.deepEqual(result.findings, []);
  });

  it("(k) a pinned seat that declares no served providers is served_providers_missing", () => {
    const result = run(pinned(["gamma-host/fp8"]));
    assert.equal(result.checked, 1);
    assert.deepEqual(classes(result.findings), ["served_providers_missing"]);
    assert.equal(result.findings[0].severity, "FAIL");
    assert.equal(result.findings[0].counted, true);
  });

  it("(l) served providers on a seat whose pin does not fail closed is served_providers_without_pin", () => {
    const open = pinned(["gamma-host/fp8"], ["Gamma Host"], { allow_fallbacks: true });
    const result = run(open);
    assert.equal(result.checked, 1);
    assert.deepEqual(classes(result.findings), ["served_providers_without_pin"]);
    const bare: LintSeat = { slug: "fixture/routed", effort: "high", maxOutputTokens: 65536, servedProviders: ["Gamma Host"] };
    assert.deepEqual(classes(run(bare).findings), ["served_providers_without_pin"]);
  });

  it("(m) a snapshot with no endpoint list cannot verify the claim — served_providers_unverified, FAIL even without --strict", () => {
    const { endpoints: _omitted, ...withoutEndpoints } = model;
    const result = run(pinned(["gamma-host/fp8"], ["Gamma Host"]), withoutEndpoints, false);
    assert.equal(result.checked, 1);
    assert.deepEqual(classes(result.findings), ["served_providers_unverified"]);
    assert.equal(result.findings[0].severity, "FAIL");
    assert.equal(result.findings[0].counted, true);
  });

  it("(n) a pin that matches no catalogue endpoint is pin_admits_no_endpoint", () => {
    const result = run(pinned(["delta-host"], ["Delta Host"]));
    assert.equal(result.checked, 1);
    assert.deepEqual(classes(result.findings), ["pin_admits_no_endpoint"]);
  });

  it("(o) a declared name the pin does not admit, or an admitted name left out, is served_providers_drift", () => {
    const extra = run(pinned(["gamma-host/fp8"], ["Gamma Host", "Beta Host"]));
    assert.equal(extra.checked, 1);
    assert.deepEqual(classes(extra.findings), ["served_providers_drift"]);
    assert.match(extra.findings[0].message, /declares \["Beta Host","Gamma Host"\] but its pin admits \["Gamma Host"\]/);
    const short = run(pinned(["alpha-host", "beta-host"], ["Alpha Host"]));
    assert.deepEqual(classes(short.findings), ["served_providers_drift"]);
    // `only` restricts when present, whatever `order` says.
    const onlyPin = run(pinned(["beta-host"], ["Gamma Host"], { only: ["gamma-host/fp8"] }));
    assert.deepEqual(onlyPin.findings, []);
  });
});

describe("the shipped CLI and the module boundary", () => {
  it("(h) the lint checks every OPENROUTER_SEATS seat against the live snapshot and exits 0 under --strict", () => {
    const expected = Object.keys({
      ...OPENROUTER_SEATS,
      ...SHADOW_OPENROUTER_SEATS,
    }).length;
    assert.ok(expected > 0, "an empty seat table would make this case vacuous");
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    delete env.NODE_TEST_CONTEXT;
    delete env.OPENROUTER_API_KEY;
    const result = spawnSync(process.execPath, [LINT, "--strict"], {
      cwd: REPO_ROOT,
      env,
      encoding: "utf8",
      timeout: 60000,
    });
    assert.equal(result.status, 0, result.error?.message ?? result.stdout + result.stderr);
    assert.match(
      result.stderr,
      new RegExp(`^OK — ${expected} council seat\\(s\\) checked, every effort supported`, "m"),
      result.stderr
    );
    // scaffold#917: the pinned-seat count is derived from the seat tables, so a pin added or
    // dropped without its served providers moves this assertion rather than hiding.
    const pinnedSeats = Object.values({ ...OPENROUTER_SEATS, ...SHADOW_OPENROUTER_SEATS }).filter(
      (s) => pinEntries(s.provider) !== null
    ).length;
    assert.ok(pinnedSeats > 0, "no pinned seat would make the served-provider half vacuous");
    assert.match(
      result.stderr,
      new RegExp(`; ${pinnedSeats} provider-pinned seat\\(s\\) declare exactly the providers`),
      result.stderr
    );
  });

  it("(i) importing the module runs nothing — zero stderr bytes, no exit code (the entry guard holds)", async () => {
    // A fresh module instance: the query string defeats the ESM cache, so the top-level guard
    // is evaluated again here, where process.argv[1] is this test file, not the lint.
    let bytes = 0;
    const original = process.stderr.write;
    process.stderr.write = ((chunk: unknown) => {
      bytes += Buffer.byteLength(String(chunk));
      return true;
    }) as typeof process.stderr.write;
    try {
      const mod = await import(`${pathToFileURL(LINT).href}?guard-probe=${Date.now()}`);
      assert.equal(typeof mod.lintSeats, "function");
      await new Promise((r) => setTimeout(r, 250)); // main() would have started printing by now
    } finally {
      process.stderr.write = original;
    }
    assert.equal(bytes, 0, `the import printed ${bytes} stderr byte(s) — main() ran at import`);
    assert.equal(process.exitCode, undefined);
  });
});

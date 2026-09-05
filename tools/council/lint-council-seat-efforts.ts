#!/usr/bin/env npx tsx
/**
 * Council seat effort lint — every seat must request an effort its model accepts.
 *
 * WHY THIS EXISTS. The gemini seat was configured `effort: "xhigh"` from
 * 2026-07-11 to 2026-08-27 against google/gemini-3.1-pro-preview, which
 * advertises only high/medium/low. Nothing caught it for six weeks. The seat
 * comment at the time asserted that an unsupported level "surfaces as a loud
 * provider 400, never a silent downgrade" — it does not, and that confident
 * comment is why nobody looked.
 *
 * This is an ATTESTATION defect, not a tuning nit. Reasoning is mandatory on
 * that model and its default effort is medium, so an unsupported value either
 * errors or quietly falls back — while the council run record still attests
 * `effort=xhigh`. A verdict that misstates how it was produced is worse than a
 * verdict produced at the wrong effort.
 *
 * DESIGN: static by default, refreshable on demand — the same shape as
 * verifier-pins.json. CI must not depend on a live third-party catalogue, so
 * the supported-effort sets are PINNED in council-seat-efforts.json and this
 * lint compares seats against that snapshot with no network access.
 * `--refresh` re-queries OpenRouter and rewrites the snapshot, which is a
 * reviewable diff rather than an invisible drift.
 *
 * Exit codes:
 *   0  every seat's effort is supported by its pinned model (or findings without --strict)
 *   1  findings, under --strict
 *   2  snapshot missing a seat's model, or unreadable — fail closed, never skip
 */
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OPENROUTER_SEATS } from "./council-invoke.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "../..") /* rocknix: tools/council/ is two below the repo root */;
const SNAPSHOT = resolve(REPO_ROOT, "tools/council/council-seat-efforts.json");

interface ModelEntry {
  supported_efforts: string[];
  reasoning_mandatory?: boolean;
  default_effort?: string;
  /** `top_provider.max_completion_tokens` from the catalogue; bounds a seat's maxOutputTokens. */
  max_completion_tokens?: number | null;
}
interface Snapshot {
  schema_version: string;
  refreshed_at: string;
  refreshed_from: string;
  note?: string;
  models: Record<string, ModelEntry>;
}

const strict = process.argv.includes("--strict");
const refresh = process.argv.includes("--refresh");

async function loadSnapshot(): Promise<Snapshot> {
  try {
    return JSON.parse(await readFile(SNAPSHOT, "utf8")) as Snapshot;
  } catch (err) {
    console.error(`[FAIL snapshot_unreadable] ${SNAPSHOT}: ${(err as Error).message}`);
    console.error("       Fail closed: without the snapshot no seat can be verified.");
    process.exit(2);
  }
}

async function doRefresh(): Promise<void> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.error("[FAIL refresh_no_key] --refresh needs OPENROUTER_API_KEY.");
    process.exit(2);
  }
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error(`[FAIL refresh_http] OpenRouter returned HTTP ${res.status}`);
    process.exit(2);
  }
  const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
  const catalogue = new Map<string, Record<string, unknown>>();
  for (const m of body.data ?? []) {
    if (typeof m.id === "string") catalogue.set(m.id, m);
  }

  const prev = await loadSnapshot();
  const models: Record<string, ModelEntry> = {};
  let missing = 0;
  for (const seat of Object.values(OPENROUTER_SEATS)) {
    const entry = catalogue.get(seat.slug);
    if (!entry) {
      console.error(`[FAIL refresh_slug_absent] ${seat.slug} is not in the live catalogue.`);
      missing += 1;
      continue;
    }
    const reasoning = (entry.reasoning ?? {}) as Record<string, unknown>;
    const efforts = Array.isArray(reasoning.supported_efforts)
      ? (reasoning.supported_efforts as string[])
      : [];
    const topProvider = (entry.top_provider ?? {}) as Record<string, unknown>;
    const maxOut = topProvider.max_completion_tokens;
    models[seat.slug] = {
      supported_efforts: efforts,
      reasoning_mandatory: Boolean(reasoning.mandatory),
      ...(typeof reasoning.default_effort === "string"
        ? { default_effort: reasoning.default_effort }
        : {}),
      max_completion_tokens: typeof maxOut === "number" ? maxOut : null,
    };
  }
  if (missing > 0) process.exit(2);

  const next: Snapshot = {
    ...prev,
    refreshed_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    refreshed_from: "https://openrouter.ai/api/v1/models",
    models,
  };
  await writeFile(SNAPSHOT, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.error(`refreshed ${Object.keys(models).length} model(s) into ${SNAPSHOT}`);
}

async function main(): Promise<void> {
  if (refresh) {
    await doRefresh();
    return;
  }
  const snapshot = await loadSnapshot();
  let findings = 0;
  let checked = 0;

  for (const [seatId, seat] of Object.entries(OPENROUTER_SEATS)) {
    const entry = snapshot.models[seat.slug];
    if (!entry) {
      // Fail closed. A seat whose model is absent from the snapshot is
      // UNVERIFIED, which is exactly the state that let gemini drift.
      console.error(
        `[FAIL model_not_pinned] seat ${seatId}: ${seat.slug} is absent from ` +
          `council-seat-efforts.json. Run --refresh, or the seat is unverifiable.`
      );
      process.exit(2);
    }
    checked += 1;

    // Output ceiling vs the model's maximum. Exceeding it is a request the
    // provider will reject or clamp; sitting below it is a limit WE chose and
    // should be able to defend (2026-09-03: quality outranks spend).
    const modelMax = entry.max_completion_tokens;
    if (typeof modelMax === "number") {
      if (seat.maxOutputTokens > modelMax) {
        findings += 1;
        console.error(
          `[${strict ? "FAIL" : "WARN"} output_ceiling_exceeds_model] seat ${seatId} (${seat.slug}) ` +
            `requests maxOutputTokens=${seat.maxOutputTokens} but the model's maximum is ${modelMax}.`
        );
      } else if (seat.maxOutputTokens < modelMax) {
        console.error(
          `[NOTE output_ceiling_below_model] seat ${seatId} (${seat.slug}) uses ` +
            `${seat.maxOutputTokens} of a possible ${modelMax} completion tokens — a chosen limit; ` +
            `see the seat comment in council-invoke.ts.`
        );
      }
    } else {
      console.error(
        `[NOTE output_ceiling_unverified] seat ${seatId} (${seat.slug}): snapshot has no ` +
          `max_completion_tokens; run --refresh.`
      );
    }

    // effort "none" means the seat sends no reasoning param at all — always legal.
    if (seat.effort === "none") continue;

    if (!entry.supported_efforts.includes(seat.effort)) {
      findings += 1;
      console.error(
        `[${strict ? "FAIL" : "WARN"} effort_unsupported] seat ${seatId} (${seat.slug}) ` +
          `requests effort="${seat.effort}" but the model supports ` +
          `[${entry.supported_efforts.join(", ")}].`
      );
      console.error(
        `       An unsupported effort does NOT reliably error — it can silently ` +
          `fall back to ${entry.default_effort ?? "the model default"} while the run ` +
          `record still attests effort="${seat.effort}".`
      );
    }
  }

  if (findings === 0) {
    console.error(
      `OK — ${checked} council seat(s) checked, every effort supported ` +
        `(snapshot refreshed ${snapshot.refreshed_at}).`
    );
    return;
  }
  console.error(`${findings} seat effort finding(s).`);
  if (strict) process.exit(1);
}

main().catch((err) => {
  console.error(`[FAIL unexpected] ${(err as Error).message}`);
  process.exit(2);
});

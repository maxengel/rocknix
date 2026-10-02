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
import {
  OPENROUTER_SEATS,
  SHADOW_OPENROUTER_SEATS,
  admittedProviderNames,
  pinEntries,
} from "./council-invoke.ts";
import type { CatalogueEndpoint, OpenRouterSeat } from "./council-invoke.ts";

const INSTALLED_SEATS = { ...OPENROUTER_SEATS, ...SHADOW_OPENROUTER_SEATS };
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");
const SNAPSHOT = resolve(REPO_ROOT, "council-seat-efforts.json");

export interface ModelEntry {
  supported_efforts: string[];
  reasoning_mandatory?: boolean;
  default_effort?: string;
  /** `top_provider.max_completion_tokens` from the catalogue; bounds a seat's maxOutputTokens. */
  max_completion_tokens?: number | null;
  /**
   * The model's endpoints at refresh, `{tag, provider_name}` sorted by tag, from
   * GET /api/v1/models/<slug>/endpoints (scaffold#917). A pinned seat's servedProviders must
   * equal admittedProviderNames(pin, endpoints); without the list the claim is unverifiable.
   */
  endpoints?: CatalogueEndpoint[];
}
export interface Snapshot {
  schema_version: string;
  refreshed_at: string;
  refreshed_from: string;
  note?: string;
  models: Record<string, ModelEntry>;
}

/**
 * The seat fields the lint reads. Provider routing enters a verdict only through the
 * served-provider check (scaffold#917): a pinned seat must declare exactly the providers its
 * pin admits in the catalogue, and an unpinned seat must declare none.
 */
export type LintSeat = Pick<OpenRouterSeat, "slug" | "effort" | "maxOutputTokens"> &
  Partial<Pick<OpenRouterSeat, "provider" | "servedProviders">>;

export interface SeatFinding {
  seatId: string;
  slug: string;
  class:
    | "model_not_pinned"
    | "output_ceiling_exceeds_model"
    | "output_ceiling_below_model"
    | "output_ceiling_unverified"
    | "effort_unsupported"
    | "served_providers_missing"
    | "served_providers_without_pin"
    | "served_providers_unverified"
    | "pin_admits_no_endpoint"
    | "served_providers_drift";
  severity: "FAIL" | "WARN" | "NOTE";
  /** true = contributes to the finding count that fails the run under --strict; a NOTE never does. */
  counted: boolean;
  /** The exact stderr text main() prints — one console.error per finding (multi-line where it always was). */
  message: string;
}

/**
 * The per-seat classification, pure: no file I/O, no process.exit, no network. main() prints
 * each finding's message verbatim and keeps the exit codes; this function is what the corpus
 * suite (scripts/__tests__/lint-council-seat-efforts.node-test.ts, scaffold#642) proves against
 * fixture seat tables and fixture snapshots, because the live table exercises only the
 * below-model branch. A seat whose model is absent from the snapshot ends the pass (fail closed:
 * main() exits 2 on that finding), so seats after it stay unchecked — exactly what the CLI does.
 */
export function lintSeats(
  seats: Record<string, LintSeat>,
  snapshot: Snapshot,
  { strict }: { strict: boolean }
): { checked: number; findings: SeatFinding[] } {
  const findings: SeatFinding[] = [];
  let checked = 0;

  for (const [seatId, seat] of Object.entries(seats)) {
    const entry = snapshot.models[seat.slug];
    if (!entry) {
      // Fail closed. A seat whose model is absent from the snapshot is
      // UNVERIFIED, which is exactly the state that let gemini drift.
      findings.push({
        seatId,
        slug: seat.slug,
        class: "model_not_pinned",
        severity: "FAIL",
        counted: true,
        message:
          `[FAIL model_not_pinned] seat ${seatId}: ${seat.slug} is absent from ` +
          `council-seat-efforts.json. Run --refresh, or the seat is unverifiable.`,
      });
      break;
    }
    checked += 1;

    // Output ceiling vs the model's maximum. Exceeding it is a request the
    // provider will reject or clamp; sitting below it is a limit WE chose and
    // should be able to defend (2026-09-03: quality outranks spend).
    const modelMax = entry.max_completion_tokens;
    if (typeof modelMax === "number") {
      if (seat.maxOutputTokens > modelMax) {
        findings.push({
          seatId,
          slug: seat.slug,
          class: "output_ceiling_exceeds_model",
          severity: strict ? "FAIL" : "WARN",
          counted: true,
          message:
            `[${strict ? "FAIL" : "WARN"} output_ceiling_exceeds_model] seat ${seatId} (${seat.slug}) ` +
            `requests maxOutputTokens=${seat.maxOutputTokens} but the model's maximum is ${modelMax}.`,
        });
      } else if (seat.maxOutputTokens < modelMax) {
        findings.push({
          seatId,
          slug: seat.slug,
          class: "output_ceiling_below_model",
          severity: "NOTE",
          counted: false,
          message:
            `[NOTE output_ceiling_below_model] seat ${seatId} (${seat.slug}) uses ` +
            `${seat.maxOutputTokens} of a possible ${modelMax} completion tokens — a chosen limit; ` +
            `see the seat comment in council-invoke.ts.`,
        });
      }
    } else {
      findings.push({
        seatId,
        slug: seat.slug,
        class: "output_ceiling_unverified",
        severity: "NOTE",
        counted: false,
        message:
          `[NOTE output_ceiling_unverified] seat ${seatId} (${seat.slug}): snapshot has no ` +
          `max_completion_tokens; run --refresh.`,
      });
    }

    // Served providers (scaffold#917): what a pinned seat may be served by is the catalogue's
    // answer for its pin, never a second hand-typed list. "Cannot determine" (no endpoint list)
    // is its own class, distinct from "determined wrong" (drift).
    const sev = strict ? "FAIL" : "WARN";
    const pinned = pinEntries(seat.provider) !== null;
    const declared = [...(seat.servedProviders ?? [])].sort();
    if (!pinned && declared.length) {
      findings.push({
        seatId,
        slug: seat.slug,
        class: "served_providers_without_pin",
        severity: sev,
        counted: true,
        message:
          `[${sev} served_providers_without_pin] seat ${seatId} (${seat.slug}) declares ` +
          `servedProviders but carries no fail-closed provider pin to hold them to.`,
      });
    } else if (pinned && !declared.length) {
      findings.push({
        seatId,
        slug: seat.slug,
        class: "served_providers_missing",
        severity: sev,
        counted: true,
        message:
          `[${sev} served_providers_missing] seat ${seatId} (${seat.slug}) is provider-pinned ` +
          `but declares no servedProviders, so its routing can never be attested.`,
      });
    } else if (pinned) {
      if (!Array.isArray(entry.endpoints) || entry.endpoints.length === 0) {
        findings.push({
          seatId,
          slug: seat.slug,
          class: "served_providers_unverified",
          severity: "FAIL",
          counted: true,
          message:
            `[FAIL served_providers_unverified] seat ${seatId} (${seat.slug}): the snapshot ` +
            `lists no endpoints for this model. Run --refresh, or the declared providers are unverified.`,
        });
      } else {
        const admitted = admittedProviderNames(seat.provider, entry.endpoints) ?? [];
        if (admitted.length === 0) {
          findings.push({
            seatId,
            slug: seat.slug,
            class: "pin_admits_no_endpoint",
            severity: sev,
            counted: true,
            message:
              `[${sev} pin_admits_no_endpoint] seat ${seatId} (${seat.slug}): no catalogue ` +
              `endpoint matches the pin ${JSON.stringify(seat.provider)}; the seat cannot be served.`,
          });
        } else if (JSON.stringify(declared) !== JSON.stringify(admitted)) {
          findings.push({
            seatId,
            slug: seat.slug,
            class: "served_providers_drift",
            severity: sev,
            counted: true,
            message:
              `[${sev} served_providers_drift] seat ${seatId} (${seat.slug}) declares ` +
              `${JSON.stringify(declared)} but its pin admits ${JSON.stringify(admitted)} in the catalogue.`,
          });
        }
      }
    }

    // effort "none" means the seat sends no reasoning param at all — always legal.
    if (seat.effort === "none") continue;

    if (!entry.supported_efforts.includes(seat.effort)) {
      findings.push({
        seatId,
        slug: seat.slug,
        class: "effort_unsupported",
        severity: strict ? "FAIL" : "WARN",
        counted: true,
        message:
          `[${strict ? "FAIL" : "WARN"} effort_unsupported] seat ${seatId} (${seat.slug}) ` +
          `requests effort="${seat.effort}" but the model supports ` +
          `[${entry.supported_efforts.join(", ")}].\n` +
          `       An unsupported effort does NOT reliably error — it can silently ` +
          `fall back to ${entry.default_effort ?? "the model default"} while the run ` +
          `record still attests effort="${seat.effort}".`,
      });
    }
  }

  return { checked, findings };
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
  for (const seat of Object.values(INSTALLED_SEATS)) {
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
    // scaffold#917: the endpoint list is what a pinned seat's servedProviders is checked
    // against. A failed read stops the refresh; a snapshot never loses a list silently.
    const endpointsUrl = `https://openrouter.ai/api/v1/models/${seat.slug}/endpoints`;
    const endpointsRes = await fetch(endpointsUrl, { headers: { Authorization: `Bearer ${key}` } });
    if (!endpointsRes.ok) {
      console.error(`[FAIL refresh_endpoints_http] ${endpointsUrl} returned HTTP ${endpointsRes.status}`);
      process.exit(2);
    }
    const listed = ((await endpointsRes.json()) as { data?: { endpoints?: unknown[] } }).data
      ?.endpoints;
    const endpoints = (Array.isArray(listed) ? listed : [])
      .filter(
        (e): e is { tag: string; provider_name: string } =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as Record<string, unknown>).tag === "string" &&
          typeof (e as Record<string, unknown>).provider_name === "string"
      )
      .map(({ tag, provider_name }) => ({ tag, provider_name }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
    if (endpoints.length === 0) {
      console.error(`[FAIL refresh_endpoints_empty] ${endpointsUrl} listed no endpoints.`);
      process.exit(2);
    }
    models[seat.slug] = {
      supported_efforts: efforts,
      reasoning_mandatory: Boolean(reasoning.mandatory),
      ...(typeof reasoning.default_effort === "string"
        ? { default_effort: reasoning.default_effort }
        : {}),
      max_completion_tokens: typeof maxOut === "number" ? maxOut : null,
      endpoints,
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
  const seatLint = lintSeats(INSTALLED_SEATS, snapshot, { strict });
  let findings = 0;
  let unverified = 0;
  for (const finding of seatLint.findings) {
    console.error(finding.message);
    // Fail closed — an unpinned model ends the run here, before any later seat.
    if (finding.class === "model_not_pinned") process.exit(2);
    if (finding.class === "served_providers_unverified") unverified += 1;
    if (finding.counted) findings += 1;
  }
  // "Cannot determine" exits 2, after every finding has printed: the snapshot needs --refresh.
  if (unverified > 0) process.exit(2);
  const { checked } = seatLint;
  const pinnedSeats = Object.values(INSTALLED_SEATS).filter(
    (seat) => pinEntries(seat.provider) !== null
  ).length;

  const { declarationFindings, ROSTER_PROFILES } = await import("./lib/council-roster.ts");
  for (const finding of declarationFindings(REPO_ROOT)) {
    findings += 1;
    console.error(`[FAIL agent_declaration_drift] ${finding}`);
  }
  if (findings === 0) {
    console.error(
      `OK — ${checked} council seat(s) checked, every effort supported; ` +
        `${pinnedSeats} provider-pinned seat(s) declare exactly the providers the catalogue ` +
        `admits (snapshot refreshed ${snapshot.refreshed_at}).`
    );
    return;
  }
  console.error(`${findings} seat effort finding(s).`);
  if (strict) process.exit(1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`[FAIL unexpected] ${(err as Error).message}`);
    process.exit(2);
  });
}

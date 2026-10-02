// Read-only projection of the canonical Facilitator recipes (scaffold#524).
// No second model table: dispatch, declarations and run identity share one source.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FACILITATOR_VERSION,
  OPENROUTER_RECIPES,
  OPENROUTER_SEATS,
  SHADOW_OPENROUTER_SEATS,
  admittedProviderNames,
  type CatalogueEndpoint,
} from "../council-invoke.ts";
import { canonicalSha256, isRecord } from "./council-verification.ts";
import { verifyPinnedFiles } from "./verifier-pins.ts";

export const COUNCIL_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
// The definitive roster (scaffold#915, owner ruling 2026-09-27): Muse Spark 1.3 holds the
// fifth seat. Mistral keeps its recipe for historical runs and a future re-qualification but
// sits in no profile. The two shadows are the other candidates, non-binding by construction.
export const MEMBER_IDS = ["claude", "gemini", "gpt", "kimi", "muse"] as const;
export type MemberId = (typeof MEMBER_IDS)[number] | "mistral" | "grok" | "deepseek";
export const ROSTER_PROFILES = {
  definitive: MEMBER_IDS,
  "grok-shadow": ["claude", "gemini", "gpt", "kimi", "grok"],
  "deepseek-shadow": ["claude", "gemini", "gpt", "kimi", "deepseek"],
} as const;
export type CouncilProfile = keyof typeof ROSTER_PROFILES;
export function profileForManifest(manifest: Record<string, unknown>): CouncilProfile {
  const profile = manifest.council_profile ?? "definitive";
  if (typeof profile !== "string" || !Object.hasOwn(ROSTER_PROFILES, profile))
    throw new Error("[FAIL council_profile_invalid] select an installed five-seat profile");
  return profile as CouncilProfile;
}
export function decisionAuthority(profile: CouncilProfile): "definitive" | "non-binding" {
  return profile === "definitive" ? "definitive" : "non-binding";
}
export type ReasoningEffort = "none" | "low" | "medium" | "high" | "xhigh" | "max";
export interface OpenRouterSeat {
  id: MemberId;
  slug: string;
  declared_model: string;
  effort: ReasoningEffort;
  maxOutputTokens: number;
  provider?: { order: string[]; only?: string[]; allow_fallbacks: false };
  /**
   * With a provider pin only: the provider names the pin admits, as the recipe declares
   * them (scaffold#917). Anchored runs commit to this list; the run lint requires every
   * member result's served provider to be one of them.
   */
  served_providers?: string[];
}
export interface CouncilRoster {
  schema_version: "council-roster@2.0.0";
  version: string;
  provider: "openrouter";
  model_identity_policy: "facilitator-recipe";
  profile: CouncilProfile;
  decision_authority: "definitive" | "non-binding";
  members: Partial<Record<MemberId, OpenRouterSeat>>;
}
export interface CouncilSnapshot {
  schema_version: string;
  models: Record<
    string,
    {
      supported_efforts: string[];
      reasoning_mandatory: boolean;
      max_completion_tokens: number;
      /** The model's endpoint list at refresh (scaffold#917); pinned seats need it. */
      endpoints?: CatalogueEndpoint[];
    }
  >;
}
const fail = (message: string): never => {
  throw new Error(`[FAIL council_roster_invalid] ${message}`);
};
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((x) => typeof x === "string");

/** A preference or catalog listing is not observed runtime identity. */
export function readRoster(
  _root = COUNCIL_ROOT,
  profile: CouncilProfile = "definitive"
): CouncilRoster {
  profile = profileForManifest({ council_profile: profile });
  // The legacy Mistral override remains available to explicit diagnostics, not
  // to an anchored council. No profile carries Mistral since #915, but a set
  // override still marks a diagnostic environment, so anchoring refuses it.
  if (process.env.OPENROUTER_MISTRAL_MODEL?.trim())
    fail(
      "clear OPENROUTER_MISTRAL_MODEL for an anchored run; the installed recipe is authoritative"
    );
  const members = Object.fromEntries(
    ROSTER_PROFILES[profile].map((id) => {
      const recipe = OPENROUTER_RECIPES[id];
      const body = recipe.buildBody({
        userPrompt: "",
        systemPrompt: "",
        maxTokens: recipe.defaultMaxTokens,
        transport: "buffered",
      });
      const seat = id === "grok" || id === "deepseek" ? SHADOW_OPENROUTER_SEATS[id] : OPENROUTER_SEATS[id];
      return [
        id,
        {
          id,
          slug: body.model,
          declared_model: recipe.declaredModel,
          effort: seat?.effort ?? "none",
          maxOutputTokens: recipe.maxTokensCeiling,
          // Freeze the actual request pin, including the bespoke Mistral recipe.
          ...(body.provider ? { provider: structuredClone(body.provider) } : {}),
          // ...and the providers that pin admits, so an anchored run commits to them (#917).
          ...(recipe.servedProviders ? { served_providers: [...recipe.servedProviders] } : {}),
        },
      ];
    })
  );
  return validateRoster({
    schema_version: "council-roster@2.0.0",
    version: FACILITATOR_VERSION,
    provider: "openrouter",
    model_identity_policy: "facilitator-recipe",
    profile,
    decision_authority: decisionAuthority(profile),
    members,
  });
}

export function validateRoster(value: unknown): CouncilRoster {
  if (
    !isRecord(value) ||
    value.schema_version !== "council-roster@2.0.0" ||
    value.version !== FACILITATOR_VERSION ||
    value.provider !== "openrouter" ||
    value.model_identity_policy !== "facilitator-recipe" ||
    !isRecord(value.members)
  )
    fail("invalid recipe projection");
  const profile = profileForManifest({ council_profile: value.profile });
  if (value.profile !== profile || value.decision_authority !== decisionAuthority(profile))
    fail("profile authority is fixed; shadow councils are always non-binding");
  const members = value.members as Record<string, unknown>;
  if (Object.keys(members).length !== 5)
    fail("exactly five installed seat definitions are required");
  for (const id of ROSTER_PROFILES[profile]) {
    const seat = members[id];
    if (
      !isRecord(seat) ||
      seat.id !== id ||
      typeof seat.slug !== "string" ||
      !/^[a-z0-9-]+\/[a-z0-9.-]+$/.test(seat.slug) ||
      typeof seat.declared_model !== "string" ||
      !["none", "low", "medium", "high", "xhigh", "max"].includes(String(seat.effort)) ||
      !Number.isSafeInteger(seat.maxOutputTokens) ||
      Number(seat.maxOutputTokens) <= 0
    )
      fail(`${id}: invalid seat definition`);
    if (
      seat.provider !== undefined &&
      (!isRecord(seat.provider) ||
        !strings(seat.provider.order) ||
        !seat.provider.order.length ||
        seat.provider.allow_fallbacks !== false)
    )
      fail(`${id}: provider pin must fail closed`);
    // scaffold#917: a pinned seat names the providers its pin admits; an unpinned seat
    // names none. Without the list, a pinned seat's routing could never be attested.
    if (seat.provider !== undefined) {
      if (
        !strings(seat.served_providers) ||
        !seat.served_providers.length ||
        seat.served_providers.some((name) => !name.trim()) ||
        new Set(seat.served_providers).size !== seat.served_providers.length
      )
        fail(`${id}: a provider pin must declare the providers it admits`);
    } else if (seat.served_providers !== undefined)
      fail(`${id}: served providers without a provider pin`);
  }
  return value as unknown as CouncilRoster;
}

export function rosterIdentity(
  root = COUNCIL_ROOT,
  profile: CouncilProfile = "definitive"
): {
  version: string;
  sha256: string;
  provider: string;
} {
  const roster = readRoster(root, profile);
  return {
    version: roster.version,
    sha256: canonicalSha256(roster),
    provider: roster.provider,
  };
}
export function readSnapshot(root = COUNCIL_ROOT): CouncilSnapshot {
  const value = JSON.parse(readFileSync(resolve(root, "council-seat-efforts.json"), "utf8"));
  if (
    !isRecord(value) ||
    value.schema_version !== "council-seat-efforts@1.0.0" ||
    !isRecord(value.models)
  )
    fail("catalog snapshot is missing or malformed");
  return value as unknown as CouncilSnapshot;
}
export function catalogFindings(roster: CouncilRoster, snapshot: CouncilSnapshot): string[] {
  const findings: string[] = [];
  for (const [id, seat] of Object.entries(roster.members)) {
    // The existing snapshot attests the four reasoning seats, not live key
    // access or Mistral's non-reasoning route. Do not invent catalog evidence.
    if (id === "mistral") {
      if (seat.effort !== "none") findings.push("mistral: reasoning_unsupported");
      continue;
    }
    const model = snapshot.models[seat.slug];
    if (
      !model ||
      !strings(model.supported_efforts) ||
      !Number.isSafeInteger(model.max_completion_tokens) ||
      model.max_completion_tokens <= 0
    ) {
      findings.push(`${id}: model_not_pinned or catalog_shape_invalid`);
      continue;
    }
    if (!model.supported_efforts.includes(seat.effort))
      findings.push(`${id}: effort_unsupported (${seat.effort})`);
    if (seat.effort === "none" && model.reasoning_mandatory)
      findings.push(`${id}: reasoning_required`);
    if (seat.maxOutputTokens > model.max_completion_tokens)
      findings.push(`${id}: output_ceiling_exceeds_model`);
    // scaffold#917: the providers a pinned seat declares are the catalogue's names for the
    // endpoints its pin admits — derived from the snapshot, never taken on the recipe's word.
    if (seat.provider) {
      const endpoints = model.endpoints;
      if (
        !Array.isArray(endpoints) ||
        !endpoints.length ||
        endpoints.some(
          (endpoint) =>
            !isRecord(endpoint) ||
            typeof endpoint.tag !== "string" ||
            typeof endpoint.provider_name !== "string"
        )
      ) {
        findings.push(`${id}: served_providers_unverified (snapshot lists no endpoints)`);
        continue;
      }
      const admitted = admittedProviderNames(seat.provider, endpoints);
      const declared = [...(seat.served_providers ?? [])].sort();
      if (!admitted?.length) findings.push(`${id}: pin_admits_no_endpoint`);
      else if (JSON.stringify(declared) !== JSON.stringify(admitted))
        findings.push(
          `${id}: served_providers_drift (declared ${JSON.stringify(declared)}, catalogue ${JSON.stringify(admitted)})`
        );
    }
  }
  return findings;
}
export function declarationFindings(
  root = COUNCIL_ROOT,
  profile: CouncilProfile = "definitive"
): string[] {
  const findings: string[] = [];
  for (const [id, seat] of Object.entries(readRoster(root, profile).members)) {
    const agent = readFileSync(
      resolve(root, `.claude/agents/council-member-${id}.agent.md`),
      "utf8"
    );
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(agent)?.[1] ?? "";
    const pins = /(?:^|\n)model:\s*\n((?:[ \t]+-.*\n?)+)/.exec(frontmatter)?.[1] ?? "";
    const entries = [...pins.matchAll(/^[ \t]+-[ \t]+["']([^"']+)["']/gm)].map((match) => match[1]);
    if (entries.length !== 1 || entries[0] !== seat.declared_model)
      findings.push(`${id}: agent_declaration_drift`);
  }
  return findings;
}
export function assertCatalog(root = COUNCIL_ROOT, profile: CouncilProfile = "definitive"): void {
  const findings = [
    ...catalogFindings(readRoster(root, profile), readSnapshot(root)),
    ...declarationFindings(root, profile),
  ];
  if (findings.length) fail(findings.join("; "));
}
export function seatModelMatches(seat: OpenRouterSeat, observed: string): boolean {
  return observed.trim().length > 0 && OPENROUTER_RECIPES[seat.id].modelMatches(observed);
}

/** Bind the run to installed recipes, not a second editable roster file. */
export function assertRunRoster(manifest: Record<string, unknown>, root = COUNCIL_ROOT): void {
  if (manifest.review_kind === "preliminary-review" || manifest.decision_authority === "advisory")
    fail("a preliminary review cannot satisfy a formal council contract");
  const profile = profileForManifest(manifest);
  const required: readonly string[] = ROSTER_PROFILES[profile];
  const experiment = manifest.experiment;
  if (profile !== "definitive" || experiment !== undefined) {
    if (
      !isRecord(experiment) ||
      experiment.schema_version !== "council-experiment@1.0.0" ||
      experiment.decision_authority !== decisionAuthority(profile) ||
      typeof experiment.campaign_id !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(experiment.campaign_id) ||
      typeof experiment.baseline_run_id !== "string" ||
      !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(experiment.baseline_run_id) ||
      (profile === "definitive"
        ? experiment.baseline_run_id !== manifest.run_id
        : experiment.baseline_run_id === manifest.run_id)
    )
      fail("shadow experiments require a separate baseline and fixed non-binding authority");
  }
  const expected = rosterIdentity(root, profile);
  const actual = manifest.roster_contract;
  if (
    manifest.provenance_contract !== FACILITATOR_VERSION ||
    !isRecord(actual) ||
    actual.version !== expected.version ||
    actual.sha256 !== expected.sha256 ||
    actual.provider !== expected.provider
  )
    fail("run contract must match the installed Facilitator and recipe projection");
  const coordinator = manifest.coordinator;
  if (
    !isRecord(coordinator) ||
    coordinator.voting !== false ||
    typeof coordinator.harness !== "string" ||
    !coordinator.harness.trim() ||
    typeof coordinator.requested_model !== "string" ||
    !coordinator.requested_model.trim() ||
    !["runtime-reported", "unverified"].includes(String(coordinator.observation))
  )
    fail("coordinator must record its harness, request, non-voting role, and observation source");
  if (
    coordinator.observation === "unverified"
      ? coordinator.observed_model !== null
      : typeof coordinator.observed_model !== "string" || !coordinator.observed_model.trim()
  )
    fail(
      "an unverified coordinator has observed_model=null; never infer runtime identity from preference"
    );
  const active = manifest.roster;
  if (
    !strings(active) ||
    active.length !== required.length ||
    new Set(active).size !== active.length ||
    active.some((id) => !required.includes(id)) ||
    required.some((id) => !active.includes(id))
  )
    fail(
      "all five installed members are required; diagnose the missing seat, never reduce the roster"
    );
  // Keep the shared serialization/hash module dependency-free for staged
  // consumers. Only this standalone contract loads the installed pin closure.
  if (verifyPinnedFiles(root).length)
    throw new Error(
      "[FAIL verifier_pin_mismatch] installed substrate bytes differ from the run's verifier pins"
    );
}

/** Advisory review format; its shared seats are a projection, never another pin table. */
export const PRELIMINARY_REVIEW_MEMBERS = ["claude", "gemini", "gpt"] as const;
export function readPreliminaryReviewContract(root = COUNCIL_ROOT) {
  const council = readRoster(root);
  return {
    schema_version: "preliminary-review@1.0.0" as const,
    review_kind: "preliminary-review" as const,
    decision_authority: "advisory" as const,
    formal_council_complete: false as const,
    version: council.version,
    provider: council.provider,
    model_identity_policy: council.model_identity_policy,
    roster: [...PRELIMINARY_REVIEW_MEMBERS],
    members: Object.fromEntries(
      PRELIMINARY_REVIEW_MEMBERS.map((id) => [id, structuredClone(council.members[id])])
    ),
  };
}

/** Validates format and pins only; it cannot attest provider work or review completion. */
export function assertPreliminaryReviewContract(value: unknown, root = COUNCIL_ROOT): void {
  if (!isRecord(value) || canonicalSha256(value) !== canonicalSha256(readPreliminaryReviewContract(root)))
    fail("preliminary review must retain its advisory format and the installed shared seat recipes");
  if (verifyPinnedFiles(root).length)
    throw new Error("[FAIL verifier_pin_mismatch] preliminary review substrate differs from installed pins");
}

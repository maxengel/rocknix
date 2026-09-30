#!/usr/bin/env node
// Adapted from pfi-collaboration@534475088647785db22308db756a52b1dea5c761:scripts/lint-council-run.ts
// scaffold#524: strict round-aware checks; see docs/planning/council-toolchain-524.md.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertGenesis,
  canonicalJson,
  councilRunScope,
  HISTORICAL_CONTRACTS,
  historicalMixedContract,
  isLegacyManifest,
  isRecord,
  orderedSteps,
  outputsForStep,
  readLedger,
  readManifest,
  resolveRunArtifact,
  sha256Hex,
  stepKey,
  stepKeysThrough,
  type CouncilRunManifest,
  type ExpectedOutput,
} from "./lib/council-verification.ts";
import {
  COUNCIL_ROOT,
  assertRunRoster,
  readRoster,
  profileForManifest,
  seatModelMatches,
  type MemberId,
} from "./lib/council-roster.ts";
import { FACILITATOR_VERSION, verifyServedProvider } from "./council-invoke.ts";

export interface Finding {
  kind: string;
  file: string;
  message: string;
}
export interface LintOptions {
  atStep?: string;
  beforeSeal?: boolean;
  artifact?: string;
}

// Read-only compatibility with the source estate's pre-adoption inventory lint.
// This path is used only for default repository discovery, never explicit runs,
// --full, step/artifact checks, run-start, sealing or completion admission.
// A run is historical by the contract it carries (HISTORICAL_CONTRACTS, council-verification.ts), never by the
// calendar. A date cutoff refused a 1.3.1 run set up on the cutoff's own day (scaffold#944, R5299-100).
type HistoricalInventoryManifest = CouncilRunManifest & { provenance_contract: string };
type HistoricalClass = { manifest: HistoricalInventoryManifest } | { mixed: string } | null;
function historicalInventoryManifest(runDir: string): HistoricalClass {
  const value: unknown = JSON.parse(fs.readFileSync(resolveRunArtifact(runDir, "council-run-manifest.json"), "utf8"));
  if (!isRecord(value) || value.schema_version !== "council-run-manifest@1.0.0" ||
      typeof value.provenance_contract !== "string" || !HISTORICAL_CONTRACTS.has(value.provenance_contract) ||
      typeof value.created_at !== "string" || !/^\d{4}-\d{2}-\d{2}T/.test(value.created_at) ||
      !Number.isFinite(Date.parse(value.created_at))) return null;
  // A historical contract with a newer contract's keys is malformed: named, never sent to current admission.
  const mixed = historicalMixedContract(value as unknown as CouncilRunManifest);
  if (mixed) return { mixed };
  return { manifest: value as unknown as HistoricalInventoryManifest };
}

/** Audit the evidence the historical manifest declares, without conferring current authority. */
function lintHistoricalInventory(runDir: string, manifest: HistoricalInventoryManifest): Finding[] {
  const findings: Finding[] = [];
  const fail = (kind: string, file: string, message: string) => findings.push({ kind, file, message });
  // The ledger names its contract too: every verdict must carry the manifest's (#944).
  if (!manifest.provenance_contract.startsWith("legacy-") && fs.existsSync(resolveRunArtifact(runDir, "ledger.jsonl"))) {
    const lines = fs.readFileSync(resolveRunArtifact(runDir, "ledger.jsonl"), "utf8").split("\n").filter((l) => l.trim());
    lines.forEach((line, index) => {
      let entry: unknown = null;
      try { entry = JSON.parse(line); } catch { /* reported below */ }
      if (!isRecord(entry) || entry.facilitator_version !== manifest.provenance_contract)
        fail("contract_mismatch", "ledger.jsonl", `ledger entry ${index + 1} is not written under the run's ${manifest.provenance_contract}`);
    });
  }
  try {
    const scope = councilRunScope(runDir);
    if (!(manifest.run_id === scope.runId || (scope.legacy && manifest.run_id === path.basename(runDir))) ||
        !Array.isArray(manifest.roster) || manifest.roster.length === 0 ||
        manifest.roster.some((member) => typeof member !== "string" || !/^[a-z][a-z0-9-]*$/.test(member)) ||
        new Set(manifest.roster).size !== manifest.roster.length ||
        !isRecord(manifest.expected_outputs_per_step)) throw new Error("invalid historical manifest inventory");
    const steps = ["step1", "step2", "step3", "step4", "step4_5"];
    if (Object.keys(manifest.expected_outputs_per_step).some((step) => !steps.includes(step)))
      throw new Error("unknown historical step");
    const selected: string[] = [];
    const declared = new Set<string>();
    const allPaths = new Set<string>();
    for (const step of steps) {
      const outputs = manifest.expected_outputs_per_step[step];
      if (outputs === undefined) continue;
      if (!Array.isArray(outputs)) throw new Error("historical step must declare an array");
      for (const output of outputs) {
        if (!isRecord(output) || typeof output.path !== "string" || !output.path.endsWith(".md") ||
            typeof output.member !== "string" || !/^[a-z][a-z0-9-]*$/.test(output.member) ||
            typeof output.kind !== "string" || !output.kind || allPaths.has(output.path))
          throw new Error("invalid or duplicate historical member output");
        resolveRunArtifact(runDir, output.path);
        allPaths.add(output.path);
      }
      // The previous inventory contract checked started steps, including all
      // declared peers once any output or provenance in that step existed.
      if (!outputs.some((output) => fs.existsSync(resolveRunArtifact(runDir, output.path)) ||
          fs.existsSync(resolveRunArtifact(runDir, output.path + ".provenance.json")))) continue;
      selected.push(step);
      for (const output of outputs) {
        declared.add(output.path);
        try {
          const bytes = fs.readFileSync(resolveRunArtifact(runDir, output.path));
          const record: unknown = JSON.parse(fs.readFileSync(resolveRunArtifact(runDir, output.path + ".provenance.json"), "utf8"));
          if (!isRecord(record) || record.member !== output.member || typeof record.substrate !== "string" ||
              typeof record.endpoint !== "string" || !Array.isArray(record.attempts) ||
              !isRecord(record.final) || !isRecord(record.final.verification)) {
            fail("provenance_invalid", output.path, "historical member/provenance core shape mismatch");
          } else if (!manifest.provenance_contract.startsWith("legacy-")) {
            if (record.facilitator_version !== manifest.provenance_contract)
              fail("contract_mismatch", output.path, "historical provenance differs from its declared contract");
            if (record.final.file_artifact_sha256 !== sha256Hex(bytes))
              fail("file_modified_post_write", output.path, "historical artifact differs from its provenance digest");
          }
        } catch (error) {
          fail("historical_artifact_invalid", output.path, error instanceof Error ? error.message : "artifact unreadable");
        }
      }
      if (!manifest.provenance_contract.startsWith("legacy-") && fs.existsSync(resolveRunArtifact(runDir, "ledger.jsonl")) &&
          !fs.existsSync(resolveRunArtifact(runDir, "verification/seals/" + step + ".seal.json")))
        fail("seal_missing", step, "historical started step with a ledger must retain its seal");
    }
    const directories: Record<string, string> = {
      step1: "", step2: "peer_reviews", step3: "revised_approaches", step4: "peer_votes", step4_5: "revised_approaches",
    };
    for (const step of selected) {
      const directory = directories[step];
      const absolute = directory ? resolveRunArtifact(runDir, directory) : runDir;
      if (!fs.existsSync(absolute)) continue;
      for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
        if (!entry.isFile() && !entry.isSymbolicLink()) continue;
        const name = entry.name.replace(/\.provenance\.json$/, "");
        const candidate = step === "step1" ? manifest.roster.some((member) => name === member + "-analysis.md") :
          step === "step2" ? name.endsWith("_peer_review.md") :
          step === "step3" ? name.endsWith("-revised_plan.md") :
          step === "step4" ? name.endsWith("_vote.md") : name === "consensus_plan.md";
        const artifact = directory ? directory + "/" + name : name;
        if (candidate && !declared.has(artifact))
          fail("unexpected_output", artifact, "historical member artifact is not declared in the manifest");
      }
    }
  } catch (error) {
    fail("historical_inventory_invalid", runDir, error instanceof Error ? error.message : "inventory unreadable");
  }
  return findings;
}

/** Artifacts must agree with both their sidecar and the append-only ledger. */
export function lintArtifact(
  runDir: string,
  manifest: CouncilRunManifest,
  expected: ExpectedOutput,
  ledger = readLedger(runDir)
): Finding[] {
  const findings: Finding[] = [];
  const fail = (kind: string, message: string) =>
    findings.push({ kind, file: expected.path, message });
  try {
    const output = resolveRunArtifact(runDir, expected.path);
    const sidecar = resolveRunArtifact(runDir, expected.path + ".provenance.json");
    if (!fs.existsSync(output) || !fs.statSync(output).isFile()) {
      fail("output_missing", "declared output is missing");
      return findings;
    }
    if (!fs.existsSync(sidecar)) {
      fail("provenance_missing", "declared output has no provenance sibling");
      return findings;
    }
    const record: unknown = JSON.parse(fs.readFileSync(sidecar, "utf8"));
    if (
      !isRecord(record) ||
      !isRecord(record.final) ||
      !isRecord(record.final.verification) ||
      !Array.isArray(record.attempts)
    ) {
      fail("provenance_invalid", "missing Facilitator final verification or attempts");
      return findings;
    }
    if (record.member !== expected.member)
      fail("member_mismatch", "provenance names a different member");
    if (isLegacyManifest(manifest)) return findings;
    if (
      manifest.provenance_contract !== FACILITATOR_VERSION ||
      record.facilitator_version !== manifest.provenance_contract
    )
      fail("contract_mismatch", "unknown or mismatched Facilitator contract");
    const digest = sha256Hex(fs.readFileSync(output));
    if (record.final.file_artifact_sha256 !== digest || record.output_file_sha256 !== digest)
      fail("file_modified_post_write", "file bytes differ from their recorded digests");
    if (record.final.outcome !== "success" || record.final.verification.result !== "PASS")
      fail("member_not_verified", "output is not a successful, model-verified member result");
    const lastAttempt = record.attempts.at(-1);
    if (
      !isRecord(lastAttempt) ||
      lastAttempt.outcome !== "success" ||
      lastAttempt.model_field !== record.final.verification.observed
    )
      fail("attempt_mismatch", "final result has no matching successful provider attempt");
    if (manifest.roster_contract !== undefined) {
      const seat = readRoster(COUNCIL_ROOT, profileForManifest(manifest)).members[
        expected.member as MemberId
      ]!;
      if (
        record.final.assurance_tier !== "local_capture_provider_attested" ||
        record.final.verification.model_identity_source !== "provider_response"
      )
        fail(
          "assurance_mismatch",
          "this OpenRouter route supports response-field identity, not a higher assurance tier"
        );
      if (
        typeof record.final.verification.observed !== "string" ||
        !seatModelMatches(seat, record.final.verification.observed) ||
        record.substrate !== "openrouter" ||
        record.declared_model !== seat.declared_model ||
        record.final.verification.declared !== record.declared_model
      )
        fail("model_mismatch", "served identity or declared route differs from the pinned seat");
      if (canonicalJson(record.roster_contract) !== canonicalJson(manifest.roster_contract))
        fail("roster_contract_mismatch", "provenance is not bound to this roster");
      const effort = record.final.effort_verification;
      const tokens = record.final.tokens;
      if (
        !isRecord(effort) ||
        effort.declared !== (seat.effort === "none" ? null : seat.effort) ||
        effort.result !== "PASS" ||
        effort.evidence !== "reasoning_tokens" ||
        (seat.effort !== "none" &&
          (!isRecord(tokens) ||
            typeof tokens.reasoning !== "number" ||
            !Number.isSafeInteger(tokens.reasoning) ||
            tokens.reasoning <= 0 ||
            effort.observed_reasoning_tokens !== tokens.reasoning))
      )
        fail(
          "effort_unverified",
          "requested effort and provider reasoning-token evidence must agree; missing evidence is not a pass"
        );
      // #943: every provider observation must agree across receipt surfaces and be admitted.
      // The compatibility scalar cannot conceal an earlier mismatch in a successful stream.
      const routing = record.final.provider_verification;
      const admitted = seat.served_providers ?? null;
      if (
        !isRecord(routing) ||
        routing.evidence !== "response_provider_field" ||
        !isRecord(lastAttempt) ||
        !Array.isArray(lastAttempt.served_provider_observations) ||
        !lastAttempt.served_provider_observations.every((name) => typeof name === "string" && name.trim()) ||
        !Array.isArray(routing.observed_providers) ||
        canonicalJson(lastAttempt.served_provider_observations) !== canonicalJson(routing.observed_providers) ||
        lastAttempt.served_provider !== (routing.observed_providers.at(-1) ?? null) ||
        routing.observed !== lastAttempt.served_provider ||
        (admitted
          ? routing.result !== "PASS" ||
            canonicalJson(routing.declared) !== canonicalJson(admitted) ||
            verifyServedProvider(admitted, routing.observed_providers as string[]) !== "PASS"
          : routing.result !== "NOT_PINNED" || routing.declared !== null)
      )
        fail(
          "provider_unverified",
          admitted
            ? `this pinned seat must be served by ${admitted.join(" or ")}, recorded on its final attempt; missing evidence is not a pass`
            : "this unpinned seat must record NOT_PINNED routing evidence, with its final attempt's served provider"
        );
    }
    const artifactPath = path.relative(process.cwd(), output).split(path.sep).join("/");
    if (record.artifact_path !== artifactPath)
      fail("artifact_path_mismatch", "provenance points to another artifact");
    const latest = ledger
      .filter((entry) => isRecord(entry) && entry.artifact_path === artifactPath)
      .at(-1);
    if (latest === undefined || canonicalJson(latest) !== canonicalJson(record))
      fail(
        "ledger_sidecar_mismatch",
        "provenance is absent from, or differs from, the latest ledger verdict"
      );
  } catch (error) {
    fail("artifact_invalid", error instanceof Error ? error.message : "artifact could not be read");
  }
  return findings;
}

export function lintRun(runDir: string, options: LintOptions = {}): Finding[] {
  const findings: Finding[] = [];
  try {
    const manifest = readManifest(runDir);
    const steps = options.atStep
      ? stepKeysThrough(manifest, options.atStep)
      : orderedSteps(manifest);
    if (options.beforeSeal && !options.atStep) throw new Error("--before-seal requires --at-step");
    const mixed = historicalMixedContract(manifest);
    if (mixed) return [{ kind: "historical_manifest_mixed_contract", file: "council-run-manifest.json", message: mixed }];
    if (!isLegacyManifest(manifest)) {
      assertRunRoster(manifest);
      assertGenesis(runDir, manifest);
      if (!fs.existsSync(resolveRunArtifact(runDir, "ledger.jsonl")))
        throw new Error("ledger.jsonl is missing");
    }
    const ledger = readLedger(runDir);
    if (options.artifact) {
      if (options.atStep || options.beforeSeal)
        throw new Error("--artifact cannot be combined with step options");
      const expected = Object.values(manifest.expected_outputs_per_step)
        .flat()
        .find((output) => output?.path === options.artifact);
      if (!expected) throw new Error("--artifact must name one declared member output");
      return lintArtifact(runDir, manifest, expected, ledger);
    }
    const declared = new Set(
      Object.values(manifest.expected_outputs_per_step).flatMap(
        (outputs) => outputs?.map((output) => output.path) ?? []
      )
    );
    for (const step of steps) {
      for (const expected of outputsForStep(manifest, step))
        findings.push(...lintArtifact(runDir, manifest, expected, ledger));
      if (!isLegacyManifest(manifest) && !(options.beforeSeal && step === options.atStep)) {
        const seal = "verification/seals/" + step + ".seal.json";
        if (!fs.existsSync(resolveRunArtifact(runDir, seal)))
          findings.push({
            kind: "seal_missing",
            file: seal,
            message: "complete prior steps must be sealed",
          });
      }
    }
    // Inventory every round, including undeclared future outputs. Coordinator
    // prose such as README.md is not a member artifact.
    for (const directory of ["", "peer_reviews", "revised_approaches", "peer_votes"]) {
      const absolute = directory ? resolveRunArtifact(runDir, directory) : runDir;
      if (!fs.existsSync(absolute)) continue;
      for (const file of fs.readdirSync(absolute)) {
        const name = file.replace(/\.provenance\.json$/, "");
        if (
          !/(?:-analysis|_peer_review|-revised_plan|_vote)(?:-r\d+)?\.md$/.test(name) &&
          name !== "consensus_plan.md"
        )
          continue;
        const artifact = directory ? directory + "/" + name : name;
        if (!declared.has(artifact))
          findings.push({
            kind: "unexpected_output",
            file: artifact,
            message: "member artifact is not in the manifest",
          });
      }
    }
  } catch (error) {
    findings.push({
      kind: "run_invalid",
      file: runDir,
      message: error instanceof Error ? error.message : "run could not be validated",
    });
  }
  return findings;
}

function main(): number {
  try {
    const args = process.argv.slice(2);
    const positional: string[] = [];
    let atStep: string | undefined;
    let round = 1;
    let beforeSeal = false;
    let json = false;
    let full = false;
    let artifact: string | undefined;
    for (let index = 0; index < args.length; index += 1) {
      const arg = args[index];
      if (arg === "--strict") continue; // compatibility flag: all findings now fail
      if (arg === "--json") json = true;
      else if (arg === "--full") full = true;
      else if (arg === "--before-seal") beforeSeal = true;
      else if (arg === "--at-step") atStep = args[++index];
      else if (arg === "--artifact") artifact = args[++index];
      else if (arg.startsWith("--at-step=")) atStep = arg.slice(10);
      else if (arg === "--round") round = Number(args[++index]);
      else if (arg.startsWith("--")) throw new Error("unknown option " + arg);
      else positional.push(arg);
    }
    if (
      (full && (atStep || artifact)) ||
      (beforeSeal && !atStep) ||
      (!atStep && round !== 1) ||
      (artifact && atStep)
    )
      throw new Error(
        "choose full, step, or artifact checks; --before-seal/--round require --at-step"
      );
    const root = path.join(COUNCIL_ROOT, "research/council-runs");
    const research = path.join(COUNCIL_ROOT, "research/council-research");
    const children = (directory: string) => fs.existsSync(directory)
      ? fs.readdirSync(directory, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && !entry.name.startsWith("__"))
          .map((entry) => path.join(directory, entry.name))
      : [];
    const nestedRuns = (directory: string) => children(directory).filter((dir) =>
      councilRunScope(dir).nested && fs.existsSync(path.join(dir, "council-run-manifest.json")));
    const legacyNested: string[] = [];
    const dirs = positional.length ? positional.flatMap((input) => {
      const candidate = path.resolve(input);
      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory())
        throw new Error("explicit run directory is missing: " + input);
      if (fs.realpathSync(candidate) !== candidate)
        throw new Error("explicit run directory must not traverse a symlink");
      if (fs.existsSync(path.join(candidate, "council-run-manifest.json"))) return [candidate];
      if (path.dirname(candidate) === research) {
        const nested = nestedRuns(candidate);
        if (!nested.length) throw new Error("research run has no Phase 4 manifest: " + input);
        return nested;
      }
      let ancestor = path.dirname(candidate);
      while (ancestor !== path.dirname(ancestor)) {
        if (councilRunScope(ancestor).nested && fs.existsSync(path.join(ancestor, "council-run-manifest.json")))
          return [ancestor];
        ancestor = path.dirname(ancestor);
      }
      return [candidate]; // an explicitly named incomplete run must fail, never disappear
    }) : [
      ...children(root),
      ...children(research).flatMap(nestedRuns).filter((dir) => {
        if (!councilRunScope(dir).legacy) return true;
        legacyNested.push(path.relative(COUNCIL_ROOT, dir).split(path.sep).join("/"));
        return false;
      }),
    ];
    const uniqueDirs = [...new Set(dirs)];
    const options = {
      atStep: atStep ? stepKey(atStep, round) : undefined,
      beforeSeal,
      artifact,
    };
    const historicalRuns: string[] = [];
    const inventoryOnly = !positional.length && !full && !atStep && !artifact && !beforeSeal;
    const findings = uniqueDirs.flatMap((dir) => {
      const historical = inventoryOnly ? historicalInventoryManifest(dir) : null;
      if (historical && "mixed" in historical)
        return [{ kind: "historical_manifest_mixed_contract", file: path.relative(COUNCIL_ROOT, dir).split(path.sep).join("/"), message: historical.mixed }];
      if (!historical) return lintRun(dir, options);
      historicalRuns.push(path.relative(COUNCIL_ROOT, dir).split(path.sep).join("/"));
      return lintHistoricalInventory(dir, historical.manifest);
    });
    if (json) console.log(JSON.stringify({ runs_scanned: uniqueDirs.length,
      current_runs_scanned: uniqueDirs.length - historicalRuns.length,
      historical_runs_audited: historicalRuns, historical_audit_authority: "inventory-only; not current admission",
      legacy_nested_not_scanned: legacyNested, findings }, null, 2));
    else if (findings.length)
      for (const item of findings)
        console.error("[FAIL " + item.kind + "] " + item.file + ": " + item.message);
    else
      console.log(
        dirs.length
          ? "OK - " +
              dirs.length +
              " run(s): declared artifacts checked" +
              (artifact ? " (one artifact only)." : beforeSeal ? " (pre-seal check only)." : ".")
          : "No council runs found; no evidence was verified."
      );
    if (!json && historicalRuns.length)
      console.log("historical inventory only (not current admission): " + historicalRuns.join(", "));
    if (!json && legacyNested.length)
      console.log("Historical nested runs not scanned: " + legacyNested.join(", "));
    return findings.length ? 1 : 0;
  } catch (error) {
    console.error(
      "[FAIL council_lint] " + (error instanceof Error ? error.message : "invalid arguments")
    );
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exit(main());

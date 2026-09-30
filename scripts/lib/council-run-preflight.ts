// Standalone lifecycle gate, loaded lazily by the Facilitator. Staged attempts
// retain their own controller/store contract and never enter this path.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import {
  assertGenesis,
  canonicalJson,
  findCouncilRunDir,
  genesisSha256,
  isRecord,
  orderedSteps,
  outputsForStep,
  readJsonFile,
  readLedger,
  readManifest,
  readSealKey,
  resolveRunArtifact,
  sha256Hex,
} from "./council-verification.ts";
import {
  COUNCIL_ROOT,
  assertCatalog,
  assertRunRoster,
  rosterIdentity,
  profileForManifest,
  type CouncilProfile,
  type MemberId,
} from "./council-roster.ts";
import { verifyPinAccountability, verifyPinnedFiles } from "./verifier-pins.ts";
import { lintArtifact, lintRun } from "../lint-council-run.ts";
import { verifyChain } from "../verify-chain.ts";
import { verifySeals } from "../verify-seals.ts";

export interface RunBinding {
  runDir: string;
  genesisHash: string;
  manifestHash: string;
  roster: ReturnType<typeof rosterIdentity>;
  profile: CouncilProfile;
}

export function preflightRunOutput(
  outputPath: string,
  provenancePath: string,
  member: MemberId,
  substrate: string,
  sources: Array<{ path: string; sha256: string }> = []
): RunBinding | null {
  const runDir = findCouncilRunDir(outputPath);
  // Unbound diagnostics remain available, but cannot be accepted by any run
  // lint/seal/summary. Never implicitly make them council evidence.
  if (!runDir) return null;
  if (resolve(process.cwd()) !== COUNCIL_ROOT)
    throw new Error(
      "[FAIL repository_root] run the Facilitator from the installed repository root"
    );
  const manifest = readManifest(runDir);
  assertRunRoster(manifest);
  assertCatalog(COUNCIL_ROOT, profileForManifest(manifest));
  if (substrate !== "openrouter" || !manifest.roster.includes(member))
    throw new Error("[FAIL run_route_mismatch] member and route must match the anchored run");
  const artifact = relative(runDir, outputPath).split("\\").join("/");
  resolveRunArtifact(runDir, artifact);
  resolveRunArtifact(runDir, relative(runDir, provenancePath).split("\\").join("/"));
  if (provenancePath !== `${outputPath}.provenance.json`)
    throw new Error("[FAIL provenance_scope] anchored calls require the canonical sidecar path");
  const steps = orderedSteps(manifest);
  const atStep = steps.find((step) =>
    outputsForStep(manifest, step).some(
      (output) => output.path === artifact && output.member === member
    )
  );
  const isProbe = new RegExp(`^_probes/${member}-[a-zA-Z0-9._-]+\\.md$`).test(artifact);
  if (!atStep && !isProbe)
    throw new Error("[FAIL output_undeclared] declare this member output before invocation");
  if (atStep === "step1" && sources.length === 0)
    throw new Error("[FAIL source_manifest_missing] Step 1 requires the mandatory source manifest");
  if (existsSync(outputPath) || existsSync(provenancePath))
    throw new Error(
      "[FAIL output_exists] preserve prior evidence; never overwrite a council attempt"
    );
  const pins = [...verifyPinnedFiles(COUNCIL_ROOT), ...verifyPinAccountability(COUNCIL_ROOT)];
  if (pins.length)
    throw new Error(
      "[FAIL verifier_pin_mismatch] installed helpers differ from their accountable pins"
    );
  for (const source of sources) {
    if (!source || typeof source.path !== "string" || !/^[a-f0-9]{64}$/.test(source.sha256))
      throw new Error(
        "[FAIL source_manifest_invalid] sources require repository-relative paths and SHA-256 hashes"
      );
    const file = resolveRunArtifact(COUNCIL_ROOT, source.path);
    const ignored = spawnSync("git", ["check-ignore", "-q", "--", source.path], {
      cwd: COUNCIL_ROOT,
      stdio: "ignore",
    });
    if (ignored.status !== 1)
      throw new Error(
        "[FAIL source_manifest_ignored] refused ignored source or failed ignore check"
      );
    if (sha256Hex(readFileSync(file)) !== source.sha256)
      throw new Error("[FAIL source_hash_mismatch] source bytes changed before dispatch");
  }
  const genesis = assertGenesis(runDir, manifest);
  readSealKey(runDir);
  const genesisHash = genesisSha256(runDir)!;
  const receipt = readJsonFile(resolveRunArtifact(runDir, "verification/anchor-receipt.json"));
  if (
    !isRecord(receipt) ||
    receipt.status !== "pushed" ||
    receipt.genesis_sha256 !== genesisHash ||
    receipt.branch !== genesis.anchor_branch ||
    typeof receipt.commit !== "string" ||
    !/^[a-f0-9]{40,64}$/.test(receipt.commit)
  )
    throw new Error(
      "[FAIL anchor_not_published] run-start must push and read back the anchor; --no-push is offline setup only"
    );
  const anchored = spawnSync(
    "git",
    [
      "show",
      `${receipt.commit}:${relative(COUNCIL_ROOT, resolveRunArtifact(runDir, "verification/genesis.json")).split("\\").join("/")}`,
    ],
    { cwd: COUNCIL_ROOT, stdio: ["ignore", "pipe", "pipe"] }
  );
  if (anchored.status !== 0 || sha256Hex(anchored.stdout) !== genesisHash)
    throw new Error("[FAIL anchor_binding_mismatch] receipt commit does not contain this genesis");
  const ledger = readLedger(runDir);
  if (ledger.length) {
    for (const entry of ledger) {
      if (
        !isRecord(entry) ||
        !isRecord(entry.final) ||
        entry.final.outcome !== "success" ||
        !isRecord(entry.final.verification) ||
        entry.final.verification.result !== "PASS" ||
        !isRecord(entry.final.effort_verification) ||
        entry.final.effort_verification.result !== "PASS" ||
        // scaffold#917: routing evidence too. NOT_PINNED is admitted here only as a shape;
        // lintArtifact below checks it against the seat, so a pinned seat cannot claim it.
        !isRecord(entry.final.provider_verification) ||
        !["PASS", "NOT_PINNED"].includes(String(entry.final.provider_verification.result)) ||
        typeof entry.artifact_path !== "string" ||
        typeof entry.member !== "string"
      )
        throw new Error(
          "[FAIL run_halted] prior invocation failed or lacks model/effort/provider evidence; preserve this run"
        );
      const previousPath = relative(runDir, resolve(COUNCIL_ROOT, entry.artifact_path))
        .split("\\")
        .join("/");
      if (
        lintArtifact(
          runDir,
          manifest,
          { path: previousPath, member: entry.member, kind: "previous" },
          ledger
        ).length
      )
        throw new Error("[FAIL prior_evidence_invalid] prior artifact/sidecar/ledger disagree");
    }
    const findings = [...verifyChain(runDir), ...verifySeals(runDir)];
    if (findings.length)
      throw new Error(
        `[FAIL prior_evidence_invalid] ${findings.map((item) => item.kind).join(", ")}`
      );
  }
  if (atStep && steps.indexOf(atStep) > 0) {
    const prior = steps[steps.indexOf(atStep) - 1];
    if (lintRun(runDir, { atStep: prior }).length)
      throw new Error("[FAIL prior_step_unverified] complete and seal the preceding step first");
  }
  return {
    runDir,
    genesisHash,
    manifestHash: sha256Hex(readFileSync(resolveRunArtifact(runDir, "council-run-manifest.json"))),
    roster: rosterIdentity(COUNCIL_ROOT, profileForManifest(manifest)),
    profile: profileForManifest(manifest),
  };
}

export function assertRunBindingUnchanged(binding: RunBinding): void {
  if (
    genesisSha256(binding.runDir) !== binding.genesisHash ||
    sha256Hex(readFileSync(resolveRunArtifact(binding.runDir, "council-run-manifest.json"))) !==
      binding.manifestHash ||
    canonicalJson(rosterIdentity(COUNCIL_ROOT, binding.profile)) !==
      canonicalJson(binding.roster) ||
    verifyPinnedFiles(COUNCIL_ROOT).length
  )
    throw new Error(
      "[FAIL run_contract_changed] configuration changed during dispatch; preserve the response as unverified"
    );
}

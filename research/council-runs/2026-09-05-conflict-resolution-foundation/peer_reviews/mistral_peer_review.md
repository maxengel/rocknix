I've reviewed the four peer analyses of the cloud-save conflict resolution foundation for ROCKNIX. Here's my assessment of their strengths, weaknesses, and key disagreements:

## Claude Analysis (claude-analysis.md)

**Strongest argument:** The bisync replacement proposal with a listing-diff detector is compelling. The analysis correctly identifies that bisync's stateful nature creates multiple failure modes (workdir corruption, `--resync` requirements, SRAM blindness on hashless backends) that make it unsuitable for this use case. The proposed manifest-based three-way comparison is more robust and fits the project's needs better.

**Weakest argument:** The boot-vs-emulator race condition (3.1) is underdeveloped. While the analysis identifies the problem, it doesn't fully explore the implications for the boot sync's current placement in the autostart scripts. The proposed fix (moving it into ES) is correct but needs more detail about how to handle the timing window.

**Key disagreement:** I disagree with the proposal to make `session_seconds` mandatory. While it's useful information, it adds complexity to the schema and capture process. The timestamp and thumbnail should be sufficient differentiators in most cases.

**Concrete revisions needed:**
1. The deletion propagation rows in the conflict table need to be made explicit in the schema
2. The `agreed.json` scoping needs to include remote and sync root identifiers
3. The boot sync needs to be moved into ES or gated on emulator inactivity

## Gemini Analysis (gemini-analysis.md)

**Strongest argument:** The clear identification of bisync's fundamental incompatibility with the project's requirements. The analysis does an excellent job explaining why bisync's snapshot-based approach conflicts with the wizard's apply step and why the manifest test is superior.

**Weakest argument:** The reopening of D-CLOUD-029 to add `--update` to the game-exit sync is misguided. While the analysis correctly identifies the clobber risk, adding `--update` would create a different class of problems (stranding local changes) and isn't a true solution. The proper fix is the exit-pass conflict check proposed in the claude analysis.

**Key disagreement:** The analysis overstates the risk of the auto-only allocation failure. While `getNextFreeSlot()` does return -99 for auto-only repositories, this is easily fixed by checking for negative slots before allocation.

**Concrete revisions needed:**
1. The bisync spike needs to be reframed to focus on the manifest test's requirements
2. The exit-pass conflict check needs to be incorporated into D-CLOUD-028
3. The deletion semantics need to be explicitly decided before #22 ships

## GPT Analysis (gpt-analysis.md)

**Strongest argument:** The comprehensive failure mode catalog (Section 3.2) is excellent. The analysis identifies several critical failure modes that other analyses missed, particularly around multi-file saves, shared containers, and the concurrency degradation contract.

**Weakest argument:** The reopening of D-CLOUD-031 is overbroad. While some amendments are needed (origin vs possession, publication completeness), the core shape of the manifest is sound and doesn't need to be reopened.

**Key disagreement:** The analysis overstates the risks of hash identity. The compressed bytes issue is a theoretical concern that has negligible practical impact, and the analysis doesn't provide evidence that this would actually cause problems.

**Concrete revisions needed:**
1. The container/grouping key needs to be added to the schema
2. The shared-save handling needs to be explicitly designed
3. The recovery protocol needs to be moved into V1

## Kimi Analysis (kimi-analysis.md)

**Strongest argument:** The clear sequencing of hardware tests and the identification of which decisions each test can invalidate. The analysis does an excellent job of prioritizing the cheap physics experiments that should happen before expensive implementation work.

**Weakest argument:** The shadow-mode phase (Step 5) is underdefined. While the concept is sound, the analysis doesn't specify what constitutes a "verdict-table bug" or how to distinguish them from legitimate conflicts.

**Key disagreement:** The analysis understates the risks of the concurrent write race (3.13). The proposed mitigation (pre-upload check + audit record) is insufficient - we need stronger guarantees about preserving both versions in all cases.

**Concrete revisions needed:**
1. The deletion semantics need to be explicitly decided
2. The container/grouping key needs to be added to the schema
3. The concurrency degradation contract needs to be strengthened

## Key Areas of Consensus

1. **Bisync replacement:** All analyses agree that bisync should not be the primary detection mechanism. The manifest test is superior.

2. **Identity and manifest shape:** All analyses endorse D-CLOUD-030 and D-CLOUD-031's core decisions.

3. **Wizard IA:** All analyses endorse the core flow and presentation decisions from rev 4.

4. **Merge primitives:** All analyses agree that ES's existing helpers are the right foundation.

5. **Hardware testing priority:** All analyses agree that the cheap physics experiments (deletion resurrection, wrong-clock stranding, exit-pass clobber) should happen before implementation.

## Key Disagreements

1. **D-CLOUD-029:** Gemini wants to reopen it to add `--update`; others want to keep the wholesale replacement plan.

2. **D-CLOUD-031:** GPT wants to reopen it broadly; others want targeted amendments.

3. **Recovery protocol:** GPT wants it in V1; others are comfortable deferring history browsing to V2.

4. **Concurrency guarantees:** Kimi's mitigation is insufficient; we need stronger preservation guarantees.

## Recommendations for Step 3

1. **Detection:** Adopt the manifest test as primary, with bisync as a diagnostic tool only. This addresses the core architectural flaw identified by all analyses.

2. **Deletion semantics:** Add explicit deletion rows to the conflict table and schema. This addresses the zombie deletion problem identified by claude and kimi.

3. **Container/grouping:** Add a container/grouping key to the schema to handle multi-file saves and shared containers. This addresses the failure modes identified by gpt.

4. **Concurrency:** Strengthen the concurrency degradation contract to guarantee preservation of both versions in all cases. This addresses the race condition identified by gpt and kimi.

5. **Testing sequence:** Follow kimi's hardware test sequence, with the addition of a multi-file save test before schema finalization.

6. **Exit-pass check:** Incorporate the exit-pass conflict check into D-CLOUD-028, with the understanding that it's a correctness read, not a reachability probe.

The foundation is sound enough to build on, but these amendments are necessary to address the identified failure modes and architectural flaws. The key is to preserve the core identity/manifest/wizard decisions while fixing the detection layer and adding the missing semantics for deletion and containers.
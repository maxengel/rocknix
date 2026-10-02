## Vote: **Claude**

Claude’s proposal offers the strongest combination of migration safety, verifiable release gates, and manageable scope. My preference rests on how its proposed controls address failure mechanisms—not on any claim that those controls have already succeeded.

### Why it is strongest

- **It treats identity changes as compatibility changes.** Reading the updater, boot chain, and consumers of identity variables before editing them avoids assuming that a display-name change cannot affect asset selection, partition discovery, or persisted configuration. The explicit OTA/manual-adoption branches also acknowledge that changing the new image cannot, by itself, repair discovery in an already-installed client.

- **It separates artifact integrity from resource scheduling.** QA against an immutable, hashed candidate addresses testing the wrong or changing image. A build/QA lock addresses resource contention. These are different problems, and neither control substitutes for the other. Binding test receipts to image hashes and input revisions makes the eventual publication decision auditable.

- **It proposes a useful staged release gate.** X64-first qualification can expose common build and packaging failures before spending effort on other targets. Requiring an actual RC2 handheld migration adds coverage that a fresh VM boot cannot provide. Keeping one canonical tag avoids introducing new version-selection semantics merely to accommodate scheduling. However, one handheld test must not be treated as certification of every target.

- **It distinguishes exploration, release permission, and long-term policy.** A Step-0 branch can investigate feasibility without authorizing shipment of unresolved security or state-preservation defects. Likewise, trial-merge costs and an explicit pin-versus-track trigger are better decision inputs than either permanently rejecting a rename or deferring it without a reconsideration condition. Separating labour, elapsed time, and owner approvals also exposes scheduling dependencies without establishing an unsupported completion-time guarantee.

### Dissent notes: primitives to retain from other proposals

1. **Kimi and Muse: corresponding-source and component-licence closure before publication.**  
   Claude’s manifest records useful provenance, but commit identifiers and a container digest do not themselves satisfy source-distribution obligations. Add a pre-publication component inventory and preserve the required corresponding source, patches, and build scripts for shipped components. A later documentation task is not an adequate substitute.

2. **Kimi and Muse: back up non-reconstructible state, not only credentials and provisioning instructions.**  
   A blueprint can recreate a host; it cannot recover unpushed work, local-only configuration, or vanished build inputs. Add an off-host snapshot of irreplaceable state and verify a representative restore. Reproducible caches need not all become mandatory backup scope.

3. **Gemini: retain per-target hardware qualification for supported OTA delivery.**  
   Claude’s reduced flash gate is reasonable for explicitly experimental artifacts. It is insufficient if publication automatically makes untested images normal update candidates. Release-note disclaimers do not enforce that distinction. Each target should either receive its hardware smoke test or remain outside the supported update offering until it does.

### One execution correction

Claude schedules the physical migration rehearsal in P3 but places the remaining handheld builds in P4. Build the selected handheld candidate **before P3**, then build the remaining targets afterward. Destructive interruption tests should use backed-up or cloned player state.

With those additions, Claude remains my clear first choice.
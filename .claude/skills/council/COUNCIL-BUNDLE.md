# Council toolchain: the scaffold export

- **Source:** scaffold `main` at `7be6721be24458910e75ca639f318d25ffe7e8d5` (2026-09-30), corpus **4.29.1** plus #976, which is not yet in a published release.
- **Files:** 94, byte-identical to that commit, at their scaffold paths. SHA-256 of each is in `SHA256SUMS`.
- **Selection:** every corpus-manifest entry on the council surface, every file `verifier-pins.json` pins, and the transitive closure of their relative imports.

## Checked standalone (in this directory, with no scaffold around it)

Commit the files to a git repository first. `verify-pins` refuses outside one (`verifier_pin_baseline: run from a git repository`), and one toolchain test needs it too. In a fresh directory: `git init && git add -A && git commit -m import`. Unpacked into an existing project, commit them there.

- `node scripts/verify-pins.ts`: every pin matches, and every re-pin is accountable.
- `node --test scripts/council-toolchain.node-test.mjs`: 39/39.
- `npm exec --yes --package=tsx@4.22.4 -- tsx --test scripts/__tests__/council-invoke-routing.node-test.ts`: 109/109. It needs tsx, which maps `.js` imports to `.ts`, as scaffold's CI does. Under plain `node` it cannot resolve `../council-invoke.js`, and it fails the same way in scaffold itself.
- `node --test scripts/__tests__/lint-council-seat-efforts.node-test.ts`: 19/19.
- Needs Node 24 and git on PATH. The tests make throwaway git repos under `.work/`; add `.work/` to the project's ignore file.

## Where to start

- `.claude/skills/council/SKILL.md` for a council, and `.claude/skills/council-research/SKILL.md` for a research run.
- `scripts/council-run-start.ts` starts a run, and `scripts/council-invoke.ts` dispatches members (`npx tsx scripts/council-invoke.ts --help`).
- After a run: `scripts/lint-council-run.ts`, `scripts/verify-chain.ts` and `scripts/verify-seals.ts`.
- The roster, seats and efforts: `.claude/agents/council-member-*.agent.md`, `council-seat-efforts.json` and `.claude/skills/council/references/member-roster.md`.

## Scaffold-specific parts to know about

- `scripts/forge-write-status.mjs` and `scripts/owner-queue-lint.mjs` come in only because `council-run-start.ts` imports the Forge write preflight. They name the source estate.space and scaffold's custody paths.
- `seed/corpus/manifest.json` is scaffold's full corpus manifest, so most of its entries point at files not in this bundle. The roster and the test fixture read it, so it's kept as is. `seed/corpus/banner.mjs` is a small import of the pins library.
- `.gitignore` is scaffold's, and it's here because the test fixture copies it.
- Pins: `verifier-pins.json` holds the SHA-256 of the verifier files. Change one and `verify-pins` fails until it's re-pinned with a `repin_reason`, by design.
- A seal key is never included. Runs write theirs to `verification/seal-key.local` or read `COUNCIL_SEAL_HMAC_KEY`.

## Included since the first export

scaffold PR #976 (issue #944), merged at `7be6721b`: a run is historical by the contract it carries (`provenance_contract` 1.2.0, 1.3.1 or a legacy facilitator), not by a date. Such a run is checked against its own ledger, provenance and seals, never the installed roster, and it claims no current-run assurance. A historical contract carrying a newer contract's keys is refused as `historical_manifest_mixed_contract`. It isn't in a published corpus yet; its change file waits for the next release (4.29.2).

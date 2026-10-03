# Fresh P3 resume proof — #383

Agent `m7_p3_build_resume` began with only the repository and canonical
entrypoints, read-only. It recovered cold build → exact artifact qualification
→ approved P4 review, without inferring an RC/publication claim.

Independent checks:

- Host builder3863117 and watcher3863200 alive;14:14:47UTC heartbeat101/642,
  no build.rc or target artifact yet.
- Clean build checkout503e24e10dde6a59aa6c631f789b88b89f8e92e1; retained/live
  manifest SHA25624116729b3610411fe5ba89543cf10db98b11cb9ca8afc3cbf0ef61f08640459
  matches. All6,606 tracked input hashes match current bytes.
- Live container/digest/nonroot1000:1000 and required mounts match receipt;
  launched and retained script copies are identical.
- ES/splash checkouts clean at published commits. Source selection through
  ES_SRC/RETROARCH_SRC is supported by the current runner.

Two stale current-state sentences were found: readiness opening still said
freeze/integration pending, and live #383 opening named P2. Both were corrected
and independently re-read. Retest **PASS, no unresolved handoff defect**.
Historical review sections remain dated baselines. Documentation integration
onto next is the last handoff step; the running build worktree stays frozen.
No files/jobs/device/cloud state were changed by the proof agent.

## Full-manifest custody retest

After the credential-shape guard refused two ordinary patch filenames, the
full manifest was retained unchanged in the live run and read-only artifact
store; Git retains inputs-summary.json. The same agent verified both full
hashes still equal24116729b3610411fe5ba89543cf10db98b11cb9ca8afc3cbf0ef61f08640459,
artifact mode0444, summary paths/metadata/counts (1,608 recipes,6,606 sources),
and checkpoint/README routing. **Retest PASS.** No guard exemption or frozen
input change occurred. The full inventory remains inspectable from its path.

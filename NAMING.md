# Identity classification, version 1 (#337)

RASTERATOPS is the OS_NAME, DISTRONAME and image-name prefix for 0.0.1.
`DISTRO=ROCKNIX`, the distribution/project directories, toolchain triples,
partition labels, kernel default hostname, units, commands, settings keys,
share names, mount points and backup archive writer suffix remain compatible
with RC2 (D-WORKFLOW-123). Readers accept both archive display identities.
The adoption tar includes `-from-ROCKNIX` (D-WORKFLOW-128).

Player-facing names and brand artwork change; upstream copyright, component
credits and historical documentation retain their original names. Tools-list
`developer` and `publisher` fields preserve attribution. A reference to the
ROCKNIX partition means the actual retained label, not the distribution name.
New fork-owned helpers carry the `rasteratops` prefix (D-WORKFLOW-115).
The cloud default is `/Rasteratops`; `/GAMES` and `/ROCKNIX` remain migration
inputs, kept choices, or legacy archive locations (D-CLOUD-158/159).

The wordmark uses Tiny5 Duo, whose unmodified source and SIL OFL 1.1 terms are
retained by the splash fork. Its icon-free form follows D-WORKFLOW-130.
The previous distribution's update and statistics endpoints are inactive;
manual updates and a masked statistics timer implement the recorded decisions.

The full baseline classification is `docs/rasteratops/p0-sweep-hits.txt`.
A remaining ROCKNIX identifier is assessed by its consumer using the rules
above; a blanket string replacement is not an identity migration.

`tools/rasteratops-identity-check --es <pinned checkout>` verifies the source
contracts, including inert updater/statistics commands in a network-isolated
filesystem. A template-only negative control is retained under
`docs/qa-logs/2026-10-02-candidate-preflight/`. It is not the image-wide brand
classification or an old-logo frame matcher; those remain image QA criteria.

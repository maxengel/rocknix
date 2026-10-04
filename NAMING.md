# Identity classification, version 2 (#409)

`pixelelated` (always lowercase) is the OS_NAME, DISTRONAME and image-name prefix for 0.0.1.
`DISTRO=ROCKNIX`, the distribution/project directories, toolchain triples,
partition labels, kernel default hostname, units, commands, settings keys,
share names, mount points and backup archive writer suffix remain compatible
with RC2 (D-WORKFLOW-123). Readers retain legacy archive display identities.
The adoption tar includes `-from-ROCKNIX` (D-WORKFLOW-128).

Player-facing names and brand artwork change; upstream copyright, component
credits and historical documentation retain their original names. Tools-list
`developer` and `publisher` fields preserve attribution. A reference to the
ROCKNIX partition means the actual retained label, not the distribution name.
New fork-owned helpers use the `pixelelated` prefix. Existing `rasteratops-*`
helper names and watcher variables are retained internal interfaces.
The cloud default is `/pixelelated`; `/GAMES` and `/ROCKNIX` remain migration
inputs, kept choices, or legacy archive locations (D-CLOUD-174).

The wordmark uses Tiny5 Duo LCD, whose unmodified source and SIL OFL 1.1 terms are
retained by the splash fork. Its icon-free form follows D-WORKFLOW-145.
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

D-WORKFLOW-144 makes pixelelated the project and OS name. Rasteratops is a
character and the maintainer's GitHub handle; the organization is pixelelated.
Blitterbot's account and email stay unchanged. The owner confirms no systems
use /Rasteratops: ROCKNIX → pixelelated is the required adoption path.
Historical docs/artifacts keep their original names and paths; current art is
in `docs/pixelelated/art/`. The wordmark contains no character artwork.

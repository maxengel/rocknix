# Replacement02 full defaults and actual RC2 upgrade

Frozen image61b64817bf, immutable bundle87b8c01d65dc22b4f29049bd0d69307a59c14c16f5223534e95058b2234ca5cd.
All15 default suites PASS,0FAIL/0SKIP, including16 walks/78 walk frames (plus16 time-to-play frames) and the required comparison against the retained baseline. Clean guest
readback verifies eight installed script/policy files and their modes.

Actual RC2 image69e6039f8f produced settings/save/config fixtures and an archive
before the normal migration tar was staged. Upgrade rehearsal PASS; the exact
retained upgraded disk was restarted and all eight payload files read back.
Custody verification passed before/after; launcher/runner/watcher/outer0 at
23:54:39UTC. Owned pair and WebDAV9010 stopped. Follow-on recovery/timing uses
a new COW of the retained upgraded disk, not a replacement synthetic disk.
No device/personal-cloud actions. Refs #383, #376, #381, #397, #406.

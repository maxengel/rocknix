# Prepared WebDAV/S3 link-loss stage

Prepared only; never run against an image yet. Owner:
`/workspace/tmp/pixelelated-m7-link-01`.

The launcher requires first-stage `/workspace/tmp/pixelelated-m7-qa-01/outer.rc`
0, exact frozen source/ES/candidate inputs, its own matching harness hashes,
no existing QEMU process and a fresh owner start marker. It runs both providers
against the new lowercase image, stores separate artifacts and stops each
owned pair/backend. Start through the frozen tree's shared watcher:

```
tools/watch-build --interval 5 --stall-min 5 --activity-dir /workspace/tmp/pixelelated-m7-link-01/artifacts --recursive-activity -- /workspace/tmp/pixelelated-m7-link-01/run.sh <verified-bundle>
```

Capture owner outer.log/outer.rc as for the first QA stage; supervise current
status at most60s apart and announce completion/failure/stall. No off-session
delivery is configured. Syntax/checksum checks passed; no guest/backend was
started. Original source/historical launchers and frozen build remain intact.
Refs #383, #409.

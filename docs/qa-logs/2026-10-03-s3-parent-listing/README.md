# Actual S3 failed parent listing — #377

10 assertions pass on replacement134e89, child/watcher/outer/tool rc0 at
22:38:05UTC. A transparent local proxy fronts the isolated MinIO QA bucket.
The child ListObjects request succeeds; only the exact parent prefix
Rasteratops/ receives403. The installed whole cloud_restore script returns1,
reports COULDN'T FINISH and emits no create-folder offer. Local and remote
sentinels remain byte-identical. Removing the fault permits an exact-byte
restore. The proxy event receipt contains only method, path, prefix and status;
no authentication headers or configuration are copied. All owned resources
stopped. No personal provider or physical device was used.

The bucket-prefixed S3 backup path does not reach the old-default literal
guard. Its reachable whole-script synthetic bucket proof remains the host
case in 2026-10-02-cloud-remediation, rechecked by the full1373+322 suite.
This VM result qualifies the ungated restore sibling, not that backup branch.

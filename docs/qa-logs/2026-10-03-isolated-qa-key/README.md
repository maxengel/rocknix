# M7.P3 isolated QA identity — #399

vm-pair injected its run-owned key but vm-qa used the default path. Link-02
failed before any suite; original build.log/status/rc are retained. Corrected
KEY selection honors VM_PAIR_DIR and keeps the default. Unset, empty and a
path with spaces controls pass. Source featurecb6e792b91 / next031f41beaa.

Fresh link-03 authenticated with a newly generated key whose public digest
differs from the default. It ran all seven cases. Its one LINK5 retry failure
is separately owned by #400; authentication and all other cases passed.
See ../2026-10-03-link-retry/webdav-before-report.md and the complete link log.
No private key or account value is retained here. Owned cleanup completed.

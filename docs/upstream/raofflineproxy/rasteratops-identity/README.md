# Rasteratops account discovery — #408/#168

Prepared against upstream5866cd9ba784c13771a99c52dd6b6f2acc546842; not
submitted. The new distribution name retains the ROCKNIX /storage settings
layout. Recognize its exact OS_NAME record so automatic account discovery
continues to use system.cfg after upgrading. No paths or state formats change.
The patch contains only config.py and focused upstream-format unittests.
Configured paths still take precedence; other platforms and partial/commented
name records do not match. Qualification receipts: `docs/qa-logs/2026-10-03-proxy-identity/`.

Suggested title: `linux: recognize Rasteratops account settings`

Suggested description: Rasteratops uses ROCKNIX's settings layout but a new
OS_NAME, so the automatic account lookup misses system.cfg after the rename.
Recognize both complete OS_NAME records. Tests cover branded account lookup,
configured-path precedence, and rejection of commented/partial names.

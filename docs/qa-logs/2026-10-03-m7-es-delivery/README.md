# Qualified ES delivery — #310/#368/#383

The owner explicitly approved the pending ES pushes on2026-10-03. Normal
pushes succeeded for feature/cloud-epic4f54ec035505b7a47501d298ae2ea3b0f6c7da4b
and test/qa-integratione6e1e4d0f91e177e182cc05b1cea74991e1cc45b; exact remote
refs were read back. The distribution recipe now selects that full QA hash.

Memory qualification remains `../2026-10-03-launch-memory/`: all strict
software10/software50-sync/virgl10 diagnostic limits pass. Current-source
syntax checks and diagnostic builds passed before the pin moved. The cold
combined image has not yet been qualified; those checks belong to M7.P3.

The owner's later explicit splash approval names commit530b334. Its normal
master push and remote readback pass. It adds only the canonical instruction
pointer; product pin7450aa8180ae66684814dd460f31eb502b2abf61 remains unchanged.
There are no pending ES/splash approval holds. The earlier review refusal is
historical and was resolved by the explicit named approval, not bypassed.

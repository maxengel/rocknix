# Additional source verification

The exact cached Art Book Next archive matched its recipe SHA256
7ee1e93f2c4e4f7385b78680ecfa3828acf12bc616e2111d23cc66a524231125.
All theme patches applied with `patch --batch --fuzz=0`; the later theme hunk
used a seven-line offset, no fuzz. Assertions verified displayName="pixelelated"
and the pixelelated-wordmark.svg path in the patched output.

Regenerating the LCD SVG/header with fonttools4.66.1 produced identical
SHA256 hashes. The native preview uses the actual parser/renderer and does
not open a framebuffer. All three changed ES translation units passed;
the final GuiMenu check includes the case-preserving, RTL-aware row.

The council remote-scope regex accepts the new HTTPS and github-blitterbot
SSH organization URLs and rejects the previous organization and upstream.
`node scripts/verify-pins.ts` passes accountable re-pins; seat lint retains
five active provider-pinned seats and historical inactive recipes.

Build preflight at02:11UTC found1.7TiB free disk and about45GiB available RAM,
but the8GiB swap was full. Resolve/recheck host memory before the next cold
image build. No image build was launched as part of these source checks.

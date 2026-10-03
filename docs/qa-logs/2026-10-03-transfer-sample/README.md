# Fixed transfer sample — #406

Replacement134e89, unchanged ESe6e1e4d0f91e, against accepted baseline
d72084ccad. The first separate comparison failed on one unclaimed region:
x415..865,y412..426 in the fixed five-second sample. Both actual images
were read: the baseline had completed; the replacement showed NES, item3of5,
with a legible, unclipped files/bytes/rate line. Its eight-second and final
frames show COMPLETED,24files/640KB, elapsed0:04. These four frames are kept.

The existing claims already cover this sample's running item, footer and
cancel prompt. One exact half-open rectangle now covers the statistics
line, against this baseline and this sample only. No new baseline was
accepted and no general mask added. The copy guard polls completion every
0.25seconds; timing can vary between sampled phases. One sample does not
establish the cause or magnitude of a performance change.

Actual controls: absent claim FAIL, one-pixel-too-narrow claim FAIL, current
claim PASS (78screens,21claimed,0unclaimed,0missing). Baseline file hashes
match before/after. The original failed report remains at
`/workspace/tmp/rasteratops-m7-replacement-frame-01/artifacts/frame-diff.md`.
`check-claims.py` reproduces the controls from retained frames. This closes
the visual-comparison gap, not all remaining P3 qualification.

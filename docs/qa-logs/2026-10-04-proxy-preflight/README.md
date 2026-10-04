# Final dependency preflight (#361, #386, #409)

The current proxy source is ec60fdd0f6522790d9d1d4d20add397bbc4da945,
four commits beyond5866cd9. The source archive SHA is393ffcec34b223fa4315622
db7e68a8778a87e1dff2d3aaf289df857fcb7ff2f (full value in upstream-delta.json).
The packaged linux/raofflineproxy Python file sets are identical; every file
hash is identical except config.py, where replacing alpha1 with alpha2 makes
its bytes identical too. Remaining changes are Android/docs/bundle versions.
Both native submodule gitlinks remain unchanged. All15 fork patches apply
with zero fuzz.

The current patched source passes199 upstream tests (award parity, queue,
image cache, network, consent, refresh, ROCKNIX detection and version tests)
and8 fork whole-library/persisted-state controls. The predecessor fixture
for this incremental test uses the actual previous5866cd9 patched source;
older248ce and installed RC2 evidence remains separately retained. This
is source proof, not the new image's ordinary-mode award/reconnect result.
Full fork package freshness exits0.

D-WORKFLOW-147 records the already-qualified SPIR-V parent coupling:
glslang16.6.0 known_good.json and SPIRV-Tools DEPS agree on headers4965431.
Both upstream files are retained; prior native consumer/compiler proof is
under2026-10-03-dependencies/. rc-accept.txt now records that dependency
choice without waiving any bug or image acceptance.

The initial rc-preflight also reported8 open candidate bugs and #371's
missing code-trace heading. Its existing7-control hook proof and normal
push evidence were mapped in an explicit Code trace comment on #371. The
remaining bug criteria require reconciliation against the new image and
current proofs; they are not waived to make the preflight green.

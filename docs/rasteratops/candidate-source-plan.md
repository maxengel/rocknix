# 0.0.1 source dispositions (#361, #362, #383, #384, #386)

Updated 2026-10-03 under D-WORKFLOW-138. The owner selects current upstream
proxy/libraries, with existing functionality preserved. The earlier proposal
to retain proxy248ce5acae and libsoup3.6.6 is withdrawn; no pin answer remains
pending. Exact commit/version pins still make the selected inputs reproducible.

| Component | Selected refresh | Evidence and qualification still required |
| --- | --- | --- |
| RAOfflineProxy | main5866cd9ba784c13771a99c52dd6b6f2acc546842, archive SHA256 1bc5a88f379c958e958348efd1e5de3edeb8682fe42432b6415f4f29cabc218e | Recipe and14 rebased patches now select this source; duplicate connection/subset patches retired. Eight integration and180 upstream tests pass. The broad fork run passes1,367 checks plus322 focused cases with no failures/skips. Cold-image qualification remains; detailed dispositions in [raofflineproxy-refresh.md](raofflineproxy-refresh.md). |
| libsoup | 3.8.0, SHA256 bbf08fa3e03a88c31a3d27a0d87cb422e9490f2d08e149211103df6d638a2238 | Official checksum verified; recipe updated and pkgcheck passed. Actual GLib minimum is 2.70.0, satisfied by the distribution's 2.89.3. Previous claim of a GLib blocker is withdrawn. Current Meson options remain supported; new optional zstd decoding is explicitly disabled to preserve deterministic dependency selection. Cold WebKit build and VM sign-in/memory proof remain. |
| WebKitGTK | 2.54.1, SHA256 ea0bbb02dbdbc596874a4e7ad35b66645b3e0a232bd0e4081de5ed92eb0a397d | Official archive verified and both patches apply. Cold build, HTTP/TLS/sign-in behavior and memory bound remain. |

| glslang / SPIR-V | glslang16.6.0; Tools ef96ed763b43b59b33b31b362f09a02b729fa1c9; Headers496543121ce6419f23d6fa5d7194ba66c36212d2 | glslang known_good.json and Tools DEPS agree on the coupled pair. Native library/optimizer builds and shaderc2025.3 shader compilation pass. Headers include LLVM translator22.1.5's required ancestor. Full cold consumers remain. |
| cbindgen | 0.29.4 | Verified source archive, package lint and native release build with the project's Rust1.94.1 pass. |
| tllist | 1.1.0, unchanged | Live Codeberg API confirms current. Added resolver; six controlled cases pass, including unavailable upstream refusing CURRENT. |

## Proxy integration risks and preservation criteria

- Upstream removes the permanent total-game cap, but bulk caching uses a
  100-new-games/30-minute budget, ten-minute batches and a persistent queue.
  Launch-time caching is exempt. This pacing may increase preparation time;
  it is not permission to lose whole-library offline capability.
- The fork's indexed helper calls `cache_game` directly; the unindexed path
  calls `add_rom_to_cache`, which can now return success with `queued=True`.
  The explicit deliberate-scan API now prepares125 synthetic games in both paths. A
  queued game must never be counted or displayed as ready offline. Preserve
  interruption/retry, cached data and server throttling/backoff.
- Review every local patch against source behavior before keeping or dropping
  it. Main already contains subset-aware award mapping and per-thread image
  connection reuse; do not apply the old implementations over them blindly.
- Upgrade fixtures must preserve stored sign-in, cached games/images and
  queued base/subset awards across restart and reconnection. New upstream
  usage telemetry requires consent; unanswered/declined must send nothing.
- rcheevos1433173220a7eaede6a9ed7a18e94117be1821e0 and
  libchdr8e7b8bd32bc676b7e5c6b42fe7d2daca986c4a0d remain upstream's actual
  submodule inputs, verified from the selected parent's tree.

Patch applicability and upstream baseline receipts:
`docs/qa-logs/2026-10-02-upstream-refresh/`. Pristine source:
`/tmp/rasteratops-upstream-refresh-20261002/`. The former review list was
003,004,005,009,013,014,015,017. Its final dispositions now live in
[raofflineproxy-refresh.md](raofflineproxy-refresh.md). Applicability is not
proof of behavior. New integration receipts are under
`docs/qa-logs/2026-10-03-proxy-refresh/`; dependency receipts, archive hashes and
compatibility boundaries are under `docs/qa-logs/2026-10-03-dependencies/`.

The current pristine upstream source passes104 tests across caching queue,
award parity, usage consent and image-cache/shutdown suites. Three local-server
tests were initially blocked by sandbox socket permissions; the host rerun
passes all104. This baseline is not proof of our patched integration or an
upgraded image.

## Contributing back

#168 is the existing contribution tracker (D-RA-016). Reconcile its earlier
audit findings as well as the current patch series. Prepare general-purpose
fixes with reproductions and regression tests, retain local fixes until
adopted/qualified, and record upstream PR links or reasons a patch is not
appropriate upstream. Candidates to investigate include image validation,
bounded DNS, resilient refresh and an award-flush signal. A candidate is not
yet a confirmed upstream defect or a submitted PR.

One contribution is now reproduced and prepared:
`docs/upstream/raofflineproxy/image-publication/`. Concurrent writers can
publish mixed image bytes on current main; the rebased local fix passes the
new deterministic regression and104 existing upstream tests (105 total).
No PR has been submitted yet.

The distribution base stays at D-WORKFLOW-111's frozen ROCKNIX ancestry.
Build cold under the RASTERATOPS name; never rename the warm ROCKNIX root.
VM qualification and the independent fixes audit follow source preparation.
No host receipt qualifies an unbuilt image. Publication and physical-device
actions retain their separate gates.

Sources: [RAOfflineProxy source](https://github.com/misantronic/RAOfflineProxy/tree/5866cd9ba784c13771a99c52dd6b6f2acc546842),
[2.0 release](https://github.com/misantronic/RAOfflineProxy/releases/tag/v2.0.0-alpha1),
[libsoup release notes](https://download.gnome.org/sources/libsoup/3.8/libsoup-3.8.0.news),
[libsoup checksums](https://download.gnome.org/sources/libsoup/3.8/libsoup-3.8.0.sha256sum),
[WebKit archive](https://webkitgtk.org/releases/webkitgtk-2.54.1.tar.xz).

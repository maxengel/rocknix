# 0.0.1 source dispositions (#361, #362, #383, #384)

Updated 2026-10-02 under D-WORKFLOW-138. The owner selects current upstream
proxy/libraries, with existing functionality preserved. The earlier proposal
to retain proxy248ce5acae and libsoup3.6.6 is withdrawn; no pin answer remains
pending. Exact commit/version pins still make the selected inputs reproducible.

| Component | Selected refresh | Evidence and qualification still required |
| --- | --- | --- |
| RAOfflineProxy | current upstream main bdcd229b45e289fdd0d920935887406d7d7b5919, archive SHA256 7ba9033c3025bbb8c384054b54b9b30925c2d42d11cf860e2002aac9bddd493c | Downloaded and inspected; not yet the recipe input. Latest release is v2.0.0-alpha1. Eight of sixteen local patches apply; eight need semantic review/rebase, some already superseded upstream. Preserve whole-library readiness, cached sign-in, pending base/subset awards, image integrity, bounded networking and UI notification contracts. |
| libsoup | 3.8.0, SHA256 bbf08fa3e03a88c31a3d27a0d87cb422e9490f2d08e149211103df6d638a2238 | Official checksum verified; recipe updated and pkgcheck passed. Actual GLib minimum is 2.70.0, satisfied by the distribution's 2.89.3. Previous claim of a GLib blocker is withdrawn. Current Meson options remain supported; new optional zstd decoding is explicitly disabled to preserve deterministic dependency selection. Cold WebKit build and VM sign-in/memory proof remain. |
| WebKitGTK | 2.54.1, SHA256 ea0bbb02dbdbc596874a4e7ad35b66645b3e0a232bd0e4081de5ed92eb0a397d | Official archive verified and both patches apply. Cold build, HTTP/TLS/sign-in behavior and memory bound remain. |

## Proxy integration risks and preservation criteria

- Upstream removes the permanent total-game cap, but bulk caching uses a
  100-new-games/30-minute budget, ten-minute batches and a persistent queue.
  Launch-time caching is exempt. This pacing may increase preparation time;
  it is not permission to lose whole-library offline capability.
- The fork's indexed helper calls `cache_game` directly; the unindexed path
  calls `add_rom_to_cache`, which can now return success with `queued=True`.
  Adapt this boundary and prove it with more than 100 synthetic games. A
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
`/tmp/rasteratops-upstream-refresh-20261002/`. Current review list:
003,004,005,009,013,014,015,017. Applicability is not proof of behavior.
The final retained/rebased/superseded table and tests belong on #361.

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

Sources: [RAOfflineProxy source](https://github.com/misantronic/RAOfflineProxy/tree/bdcd229b45e289fdd0d920935887406d7d7b5919),
[2.0 release](https://github.com/misantronic/RAOfflineProxy/releases/tag/v2.0.0-alpha1),
[libsoup release notes](https://download.gnome.org/sources/libsoup/3.8/libsoup-3.8.0.news),
[libsoup checksums](https://download.gnome.org/sources/libsoup/3.8/libsoup-3.8.0.sha256sum),
[WebKit archive](https://webkitgtk.org/releases/webkitgtk-2.54.1.tar.xz).

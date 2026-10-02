# 0.0.1 source dispositions (#361, #362, #383, #384)

Prepared 2026-10-02 against the current upstream sources. The owner has
approved the four-step remediation. The following two candidate pin
exceptions need their explicit disposition before candidate preflight can
accept them; they are not recorded as approved decisions yet.

| Component | Proposed candidate input | Evidence and tradeoff |
| --- | --- | --- |
| RAOfflineProxy | retain 248ce5acae75113d09500cd7c6661a12fee4b93c plus the existing 16 patches and upstream subset-award fix 1278ebcd4795eefbe5661f93135f5104e2a17c4f as patch017 | current upstream bdcd229b45 is 18 commits ahead; its caching-budget/queue rewrite changes whole-library behavior and conflicts with nine fork patches. The subset mapping defect is reproduced on the old source and corrected by the narrow backport; all 23 upstream award-parity tests pass after it. Image offline-flush proof remains required. |
| libsoup | retain 3.6.6 for this candidate | 3.8.0 is a new series beneath the sign-in window. Its refresh is kept separate from the cloud/identity work; this candidate rebuilds WebKitGTK and proves the current HTTP stack in the guest. |

WebKitGTK moves from 2.54.0 to 2.54.1, released 2026-10-02. Both fork
patches apply without rejection. Official release notes list rendering,
clipboard, input-method and crash fixes. Archive from
https://webkitgtk.org/releases/webkitgtk-2.54.1.tar.xz has SHA256
`ea0bbb02dbdbc596874a4e7ad35b66645b3e0a232bd0e4081de5ed92eb0a397d`.
This patch-series move does not imply adopting libsoup 3.8.

The distribution base stays at D-WORKFLOW-111's frozen ROCKNIX ancestry.
The image build will be cold under its RASTERATOPS name; no warm ROCKNIX
build tree is renamed. Publication and physical-device testing retain their
separate gates. No host receipt here is a candidate qualification result.

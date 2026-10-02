# Candidate source checks, 2026-10-02 (#337, #383, #384)

These are host source receipts, not image qualification.

`full-host-suite.log`: the final corrected run exits0 with1367 harness PASS,
0 FAIL and0 SKIPPED. The nested focused runner passes all72 cloud cases;
the upstream award-parity suite also passes. Both the corrected import path
and verified WebKit2.54.1 source cache are used. Implementation source is
bd033f8adf, integrated on next as3d7c075f63.

- `identity-source.log`: all source identity contracts pass in a
  network-isolated filesystem. `identity-template-negative.log` applies only
  the new name/version templates to the preceding source and must fail.
- `es-syntax.log`: ApiSystem.cpp, GuiMenu.cpp and main.cpp compile with the
  image toolchain's headers. Current ES pin:97523542963dcc72e9ea51cfbcd26b735ff28c1f.
- `subset-old-source.txt`: incorrect base-game assignment on the old proxy.
  `subset-backport-tests.log`:23 upstream award-parity tests pass after017.
- `package-freshness.log`: release query exits0 with WebKitGTK2.54.1 current.
  PINNED rows are not candidate acceptance; #361/#362 still need disposition.
- `candidate-store.log`: synthetic duplicate reuse and preservation tests;
  the deliberate corrupt-artifact FAIL is followed by the harness's PASS
  because verification correctly rejected it. No real candidate exists yet.

Theme patch dry-run: both theme.xml and splash.xml pass against the pinned
source. splash.xml's CRLF bytes must be preserved in the patch. Raw logs,
upstream font licence bytes and patch context deliberately retain their
original whitespace; source/code whitespace checks exclude those artifacts.

Localization reconciliation: French
`locale/lang/fr/LC_MESSAGES/emulationstation2.po` changes the screenshot
msgid/translation from ROCKNIX to RASTERATOPS and adds MANUAL UPDATES plus its
instruction dialog, each matching the C++ msgid exactly. The image toolchain's
msgfmt passes. Theme XML changes only the displayName of distribution:rocknix
to Rasteratops; the stored key and custom splash selection are retained.
The new splash path has a matching installed SVG and licence. Runtime French
and English frames remain required; these checks do not claim their fit.

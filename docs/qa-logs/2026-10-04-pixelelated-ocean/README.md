# Ocean Bands runtime source proof (#409)

Source/host evidence only. ES c75aa3fac967ba532fd9ba1c21fa10ca024e8bc1 and
splash8c71126ceef702528c87a4c49625e64988609f26 were pushed normally and the
remote hashes read back. The splash archive checksum is in inputs.json.

The exact LCD font is intersected with the five RGB555 bands, producing258
plain colored paths for the limited boot/ES SVG readers. The editable clip
master is retained in docs/pixelelated/art/. Source geometry and pixels agree.
Actual ES NanoSVG parses all258 closed paths and exact palette colors; the
reproducible native parser probe is nanosvg-proof.cpp (compile against the
ES checkout's external/nanosvg headers).

The actual boot C renderer uses half-open pixel-center sampling. Its640x480
frame equals the approved composition pixel-for-pixel. All four rotations
render7350 visible pixels without clipping;1280x960 renders31500. Each frame
has exactly five palette colors plus black. The90-degree640x480 preview also
passes AddressSanitizer/UBSan with leak detection disabled for the sandbox.
Existing unchecked framebuffer read/write compiler warnings are inherited.
No host or handheld framebuffer was opened. These are not guest frames.

Theme patches apply with zero fuzz to verified upstream archive7ee1e93f...;
the historical later theme hunk retains its seven-line offset. Its CRLF
splash.xml patch keeps CRLF deliberately (`git -c core.whitespace=cr-at-eol
diff --check`). All changed packages pass pkgcheck.

identity-sandbox-limited.log retains the failed outer-sandbox attempt: the
five bubblewrap subprocesses could not create namespaces. The same actual
guard with namespace permission passes0fail in identity.log. No assertion
was removed. The new build/VM qualification remains required.

A host watcher/container delivery probe completed at03:04:34UTC with rc0,
runner1480688/watcher1480689, and was reported in the active session. The
status/logs are retained here. Disconnected notification is not configured.

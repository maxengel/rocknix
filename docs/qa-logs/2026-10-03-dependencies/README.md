# M7.P2 dependency source checks — #386

These are host checks, not a candidate-image qualification. The old warm
GENERIC_X64 toolchain supplied CMake4.4.2, Ninja1.13.2 and Rust1.94.1; the
isolated native graphics build used the host GCC with eight compilation jobs.
It changed no build worktree or sysroot. Raw source/recipe hashes are retained
alongside the commands and full compiler logs.

| Input | Result |
| --- | --- |
| glslang16.6.0 | Archive verified; existing packaging patch applies with no fuzz. Native library built with the target recipe's relevant options. |
| SPIRV-Tools ef96ed7 / headers4965431 | Exact pair from glslang16.6.0 `known_good.json`; SPIRV-Tools DEPS names the same header commit. Both embedded optimizer and standalone libraries built. Deliberate parent coupling replaces the unexplained old pins. |
| shaderc2025.3 | Existing consumer built against the installed candidate libraries and compiled a Vulkan vertex shader to752 bytes of SPIR-V. Its older DEPS versions are upstream's tested baseline, not a demonstrated upper-version constraint. Full-image consumers still need their cross-build. |
| LLVM translator22.1.5 | Candidate headers contain the translator's declared revision575b651, with13 subsequent commits and no divergent ancestry. Source compatibility is corroborated, not a completed translator build. |
| cbindgen0.29.4 | Built with project Rust1.94.1; executable reports0.29.4. Source MSRV remains1.74. Fixed recipe's project URL. |
| tllist1.1.0 | Current per the live Codeberg tags API. No recipe bump needed. |

The shaderc patch's missing final newline caused strict application to fail.
Adding only that newline makes both hunks apply with zero fuzz. The first
hunk retains its existing ten-line offset; resulting source edits are unchanged.
Both failure and successful application logs are retained.

`check-codeberg.py <path-to-tools/fork-package-freshness>` runs the real tool
in an isolated fixture. Before the resolver, stable/current and new-version
controls fail. Afterward all six pass: stable tags, prerelease exclusion,
newer stable release, empty/malformed responses, and failed requests including
a valid body returned with a transport error. No error becomes CURRENT.
`tllist-live.log` records the independent real API result.

`freshness-after.log` covers the seven selected fork-inventory entries and
exits0. SPIRV-Tools is not a fork-added inventory entry, but is explicitly
qualified with its parent above. The subsequent complete fork inventory also exits0
(`freshness-full.log`/`.rc`); it must identify the same inputs at the final freeze. `pkgcheck.log` exits0 for all four changed recipes.

Remaining: full cold cross-build, affected consumers and sign-in behavior on
the branded GENERIC_X64 image, full candidate freshness and source manifest.
#362 owns libsoup/WebKit image acceptance; their source versions remain3.8.0
and2.54.1. No issue is closed from these source receipts alone.

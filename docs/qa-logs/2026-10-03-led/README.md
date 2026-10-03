# M7.P2 Nova LED source proof — #332

`tools/nova-led-test` runs all three actual scripts with a synthetic settings
profile, eight LED sysfs directories, battery status/capacity files and a
bounded service/sleep adapter. Path/profile adaptation is visible in the tool;
branch logic, RGB conversion and brightness writes are production code.

The unchanged HEAD scripts pass6 and fail8 controls. The corrected battery
writer preserves the selected32/128/255 brightness on color transitions and
low-charge blinking; all14 pass. Explicit custom RGB tuples retain their
existing precedence. Off clears brightness and all channels. The helper and
battery script accept fixture paths while keeping their hardware defaults.

The source uses four RGB devices per stick (eight), not the six quoted in the
original report. No physical device was accessed. Actual guest selection of
an already-selected row remains open; OptionListComponent's popup already
invokes its callback for that selection. Physical illumination is a separately
authorized device fact. This source proof does not claim either of those.

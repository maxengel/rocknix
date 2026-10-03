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

The source uses four RGB devices per stick (eight), not six.

## Actual guest menu reselection — PASS

Can this be done on the VM? Yes. The owned isolated run101 virgl guest used
unchanged current scripts with fixture sysfs/profile boundaries. The LED menu
block and entire option-popup implementation match current ES byte for byte
(`ui-reselection/ui-source-match.json`). Screenshots show RGB and MID already
selected; accepting each again logs the real `ledcontrol rgb` / `ledcontrol
brightness mid` call. RGB writes128 brightness and255/255/255 channels to all
eight devices. Resetting brightness to0 supplies a failing-state control;
reselecting MID restores all eight to128 without changing saved settings or
color channels. All nine receipt assertions pass (`ui-reselection/result.json`).

Wrappers, setup, walk steps, command log, before/after fixture values and
source hashes are retained. No physical device was accessed. Actual perceived
illumination and boot behavior on the Nova remain a separately authorized
open item to test, recorded in `docs/releases/device-facts.md`. This is source
and diagnostic VM proof; the combined candidate still needs M7.P3 checks.

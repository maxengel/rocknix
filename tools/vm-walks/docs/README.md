# The walks behind the rocknix.org screenshots (#323)

One step file per page, run with `tools/vm-visual-qa --monitor <sock> run
<file> --outdir <dir>` on a GENERIC_X64 guest at 640x480, so every picture on
a wiki page can be taken again when the screen changes. The frames land in
the site checkout under `docs/_inc/images/<page>/`.

Fixture, the same as the walks above this folder: a guest with **no
RetroAchievements sign-in** (signed in, the MAIN MENU opens on its
RETROACHIEVEMENTS row and every count below lands one row short), a cloud
storage connected (the hub's rows read their stamps), and, for
`networking.steps`, the stand-in `wifictl` from `proofs-307/guest/qa318-wifictl`
bound over `/usr/bin/wifictl` (the guest has no Wi-Fi adapter; the stand-in
answers Home Wi-Fi in use and Cafe saved). Each walk starts on a system or
game list with nothing open and ends with `dismiss-dialogs`.

A frame that shows an account's name is painted out with `tools/png-blackout`
before it is filed; none of these should, on that fixture.

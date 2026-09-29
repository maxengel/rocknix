# The walks behind the rocknix.org screenshots (#323)

One step file per page, run with `tools/vm-visual-qa --monitor <sock> run
<file> --outdir <dir>` on a GENERIC_X64 guest at 640x480, so every picture on
a wiki page can be taken again when the screen changes. The frames land in
the site checkout under `docs/_inc/images/<page>/`.

Fixture: a cloud storage connected (the hub's rows read their stamps), and, for
`networking.steps`, the stand-in `wifictl` from `proofs-307/guest/qa318-wifictl`
bound over `/usr/bin/wifictl` (the guest has no Wi-Fi adapter; the stand-in
answers Home Wi-Fi in use and Cafe saved). Each walk starts on a system or
game list with nothing open and ends with `dismiss-dialogs`; each press has
30 s and one re-send, since a loaded guest eats a press now and then. The MAIN MENU
is walked from its bottom (up wraps through BACK to QUIT), so a guest signed
in to RetroAchievements, whose menu opens on that extra row, walks the same.

A frame that shows an account's name is painted out with `tools/png-blackout`
before it is filed: the RETROACHIEVEMENTS SETTINGS frame's USERNAME row, on a
signed-in guest.

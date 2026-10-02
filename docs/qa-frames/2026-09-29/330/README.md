# #330: the phone keyboard page

`before-01-iphone.png`: the maintainer's screenshot, RC1 (`5b5005879e`) on the Retroid Pocket Nova, 2026-09-29 17:19 of their clock: `Checking…` under the title, the Show button cut off at the right edge, a VPN badge in the status bar. Their LAN address is on it and nothing else.

`before-02-firefox-390-js-error.png`: the page served by a diagnostic copy of the script with a `window.onerror` hook, headless Firefox at 390 px through an ssh tunnel to guest d (`b38d6fdadc`, `proofs-307/phone-page-d.sh`), 21:59 UTC: `JS error: TypeError: EventTarget.addEventListener: Argument 2 is not an object. at 296` -- the page's script declared `var up = false` for the window's state over the pad's `function up(e)`, and died at the `touchend` binding before `poll()` ran. (The button row is already the fixed stylesheet's: one row of five.)

`after-*`: the fixed script (the commit after `db975efd01`), the same run, 22:01-22:02 UTC: Firefox at 390 px with the row fitting; guest d's own WebKit window on the page beside the Dropbox sign-in window (tiled by sway, a phone-like width) reading `Connected.`; the same window fourteen seconds after the server was stopped reading `Your phone can't reach your handheld. Both need to be on the same Wi-Fi, and a VPN on your phone can get in the way.`; the sign-in window itself. From the host through the tunnel: `GET /<pin>?probe=1` answered `open <token>` in 1.4 ms, `POST click=1` and `POST key=tab` 204.

The guest's on-screen keyboard is up in the WebKit frames because the page's box has the focus; it is the guest's, not the page's. No account name or PIN is on these frames.

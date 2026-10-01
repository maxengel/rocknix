# #351 the sign-in surfaces -- guest d (640x480) on GENERIC_X64 run 97 (`d9493fe339`), 2026-10-01

The phone keyboard page served by `cloud_oauth serve` on guest d, rendered
on the host by headless Firefox at 390 px through an ssh tunnel, and shown
in the guest's own WebKit window; the window's finishing page; the user
agent the window sends, read from the request by a page the guest served
itself. No cloud and no account: the page is served by the guest, and the
echo page is the guest's own. Scripts: `proofs-351/phone-page-351.sh` and
`phone-page-351b.sh` in the session's scratch (`/workspace/tmp/rocknix-session/`).

| Frame | Shows | Decision |
| --- | --- | --- |
| 01 | run 97's page at 390 px: the Close question drawn beside a squeezed Close page button before anything was pressed -- `hidden` lost to the class rule's `display:flex`, and the control laid out as a row of keys | the defect, D-CLOUD-163 |
| 02 | the fixed page (`cloud_oauth` with `[hidden]{display:none!important}`, the control out of the keys row) served from /tmp on guest d: Close page alone, full width, under the note with 2rem above it | D-CLOUD-163, string 12 |
| 03 | the same page with Close page pressed (a copy with one line that clicks it on load, rendered from a file, so the state line reads Checking...): the question with Keep first and Close second, the button gone | D-CLOUD-163 |
| 04 | the page in the guest's WebKit window at the panel's width, the window's on-screen keyboard off | #351 |
| 05 | the window's finishing page: Connected / Finishing up on your handheld... in the page's own style | D-CLOUD-164 string 13 |
| 06 | the window on a page that prints `navigator.userAgent`: WebKit's mobile string, `Mozilla/5.0 (Linux; like Android 4.4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/60.5 Mobile Safari/605.1.15`, the same string as the request's header in the guest's log; `/etc/machine-info` reads `CHASSIS=handset`. The window's loading card is still drawn over the page at the moment of the frame | D-NET-016 |

Not shown here: Dropbox's own sign-in and trust pages through the window,
before and after. The trust page needs a signed-in Dropbox account, and the
fork has no QA Dropbox account; the checkbox's own "re-read on the next
staging" is where that frame comes from.

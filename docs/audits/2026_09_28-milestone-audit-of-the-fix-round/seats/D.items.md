# The punch items stream D owned (with the acceptance text each carries; #307)

- **PL-013** (High) A cancel during the scan's image pass downloads everything already queued first -- CANCEL during the image pass ends the run inside two seconds on the guest (a frame series shows the page close)
- **PL-055** (Medium) The offline index's marker is consumed before the listing succeeds -- the scripts test: a listing that fails leaves the marker
- **PL-057** (Medium) The bulk summary reads only `patch:` rows and turns unreadable unlocks into none -- the scripts test seeds an achievementsets-only game and a bad unlock row
- **PL-058** (Medium) The refresh helper reports success over a failed drop -- the helper's test: a failing drop is in `M failed`
- **PL-059** (Medium) The scan cap has no cursor past files that cannot be cached, and truncation is not on the page -- the scripts test with 5,001 uncacheable files reaches the 5,001st on the second run; the page's frame reads the note
- **PL-060** (Medium) Image-pass failures are dropped and a scan with nothing new never repairs them -- the scripts test: a failing image pass ends the scan `COULDN'T FINISH`

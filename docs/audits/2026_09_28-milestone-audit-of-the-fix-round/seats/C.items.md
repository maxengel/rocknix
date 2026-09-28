# The punch items stream C owned (with the acceptance text each carries; #307)

- **PL-015** (High) A root-level saves path nests the settings and content folders inside it -- `cloud_setup --set-saves-remote /` is refused with the reason, or the derived paths are `/ROCKNIX/Settings` beside `/ROCKNIX/Saves`; the scripts test covers both
- **PL-016** (High) Text typed on the phone before the window is up is never delivered -- typing on the phone page before the window opens reaches the field after it opens (a guest run with the page driven by curl and the window's log)
- **PL-017** (High) The phone page's Back button bypasses the box's text model -- typing `abc`, Back, `d` on the phone page leaves `abd` in the field on guest d (the sign-in window's log); a doctest of the page's script if it is testable, else the guest run
- **PL-018** (High) `wait` returns at a successful sign-in while the bridge still holds the pad's grab -- on the guest with a uinput gamepad; a device fact, when one is taken, is a row in `docs/releases/device-facts.md`
- **PL-030** (High) Cloud folder names reach the shell unquoted -- a cloud folder named `a$(touch /tmp/x)b` picked on the guest leaves no `/tmp/x`; the script's refusal is in the scripts test
- **PL-047** (Medium) A failed README probe overwrites the owner's note -- the scripts test: a listing that fails writes nothing
- **PL-048** (Medium) `self.configured` is set before the remote is created and verified -- a unit test of the session's state transitions
- **PL-049** (Medium) `cancel`'s SIGTERM skips the serve's `finally`, orphaning the window -- `cloud_oauth cancel` with the page up closes the window (the guest's window log)
- **PL-050** (Medium) An rclone that exits without a token leaves the on-device session `waiting`; a serve whose port is taken dies with a traceback and status `starting` -- a unit test of `_collect` with a process that exits early; the status reads failed
- **PL-051** (Medium) Paths are written into the conf through an unescaped `sed` replacement, and the conf is sourced -- the scripts test: a path with `&` round-trips
- **PL-074** (Low) rclone's stderr excerpt is logged verbatim on a failed remote creation -- the log line after a failed create carries no rclone text

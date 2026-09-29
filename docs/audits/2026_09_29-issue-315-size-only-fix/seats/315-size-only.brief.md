# Second look at one fix before the release candidate is built -- #315, the same-size save

You are one of two independent auditors (the other is a different model; neither sees the other's work). The fork's full upstream audit is done (ten packets, two seats, 2026-09-25 to 27) and its fixes were audited in turn. One change has landed since and is bound upstream: this packet. Your task is an adversarial, evidence-bound review of it -- a second engineer trying to break it before it ships.

## The project and the defect

ROCKNIX is an immutable Linux distribution for handheld gaming devices. Its cloud sync moves a player's game saves with rclone: an automatic sync at game exit (`cloud_backup --yes --saves-only --recent --automatic`), a startup pair (`cloud_restore --yes --method=copy --update --saves-only --automatic` then `cloud_backup` with `--update`), and deliberate rows on a transfer page (`cloud_backup --yes --saves-only`, `cloud_restore --yes --saves-only`). rclone decides whether a file moves by size, then modtime, then hash.

On a WebDAV remote rclone cannot set modtimes on -- every vendor but nextcloud, owncloud, sharepoint and rclone's own serve -- rclone's precision is "not supported" (`backend features` reports `Precision: 3153600000000000000`, `Hashes: []`) and the comparison never reaches the mtime; a plain WebDAV server offers no hash. So two files of one size are equal to it whatever their bytes: at `-vv`, `size = 65536 OK` then `Sizes identical`. A battery save (`.srm`) is the same size every time it is written, so after its first upload it never moved again, in either direction, while the interface's cards said COMPLETED. Measured on the release-candidate tree with rclone v1.75.1 (issue #315). Dropbox, Google Drive, OneDrive, Nextcloud, S3, SFTP, SMB and FTP keep modtimes or hashes and were never affected.

## The fix in the packet (decision D-CLOUD-153, the maintainer's "A and B, scoped")

- `remote_compares_by_size`, the same function in `cloud_backup` and `cloud_restore`: reads the configured remote's `type` and `vendor` from `/storage/.config/rclone/rclone.conf` (never starting rclone, which costs a second on a handheld); true for `type = webdav` with any vendor but the four above; false for a remote it cannot read.
- **A**: on such a remote the exit sync's recent set (`--max-age <since the last backup that worked> --no-traverse`) goes with `--ignore-times`. The set is newer than the cloud by construction; `--backup-dir` already keeps the replaced cloud copy.
- **B**: every other saves pass on such a remote, both scripts, gets `--update --modify-window 1s` (`--update` added only if the command line did not already carry it): rclone then compares the local mtime with the cloud's upload time. Backup sends what is newer locally; restore fetches what was uploaded after the local copy and keeps a local copy that is newer.
- Any other remote gets neither flag; the manual RESTORE SAVES row keeps its `--update`-less shape there.
- The harness (`tools/last-good-scripts-test`, section S315) records every rclone command line the scripts issue in a sandbox and asserts where the flags land per remote; the round trip (`tools/cloud-round-trip`) gains a same-size save step read back from the bucket.

Measured on the host with the image's rclone v1.75.1 against the QA WebDAV (`vendor = other`), a 64 KiB file uploaded then rewritten with new bytes of the same size two seconds later, `--dry-run -vv`:

```
plain copy:                          size = 65536 OK / Sizes identical            (skipped -- the defect)
--update --modify-window 1s:         size = 65536 OK / Skipped copy as --dry-run   (would transfer)
--ignore-times --max-age 600s --no-traverse:  Transferring unconditionally          (would transfer)
restore, cloud uploaded after the local mtime, --update --modify-window 1s:  would transfer
restore, local newer than the upload, --update --modify-window 1s:  Destination is newer than source, skipping
```

Known and accepted by the decision: a save written while the device's clock was wrong (no RTC, before NTP) is "older" than its cloud copy and is not sent by the full pass on these remotes (the content-based transport, #317, is the next release's answer); after an upload, the next startup restore fetches that save once more, which sets its local mtime to the upload time -- one small transfer per changed save, then quiet.

## What to attack

Everything, but in particular:

1. The detection: the `sed` section read (a remote name with a regex character, a section that is not first, `[qa]` versus `[qa-cloud]`, a `vendor` line with trailing spaces or comments, a config with Windows line endings), the vendor list (which vendors rclone v1.75 can set modtimes on that the list excludes, or includes wrongly -- `fastmail`?), and the fail-safe direction (a remote it cannot read gets no flags: is that the right default?).
2. The flags' interactions: `--ignore-times` beside `--max-age`, `--no-traverse` and `--backup-dir`; `--update --modify-window 1s` beside `BACKUPMETHOD=sync` (the recent block forces copy; the full pass does not), beside a player's own `RCLONEOPTS`, and with `--update` already on the command line; the ordering of `all_opts`; anything in `cloud_restore`'s pass that `--update` changes for the manual RESTORE SAVES row on these remotes only.
3. Time: what a device clock set to 1970 or to the wrong year does under A and under B, in each direction; what a server clock far from the device's does; whether the 1 s window is right (rclone's own precision for WebDAV, the guest's evidence).
4. What the harness section does and does not prove (it records command lines; nothing there moves a file), and whether the round-trip step's read-back is sound.
5. Upgrade path: a device updating from an image without this change, whose cloud already holds same-size stale copies; a device whose `rclone.conf` was written by the wizard with no `vendor` line.
6. Upstream fit: what a ROCKNIX maintainer reviewing this as part of the cloud-sync pull request would push back on.

## What to produce

A Markdown document with these sections, in this order:

1. **Summary**: three to eight sentences -- what the change does, its soundness, and the findings that matter most.
2. **Findings**: every defect, risk or gap you can support from the packet, each as an item in this exact shape:

```
### F-SS-NN: <short title>
- **Severity:** Critical | High | Medium | Low
- **Category:** Correctness | Data loss | Concurrency | Resource | Build/packaging | Security | Upgrade path | Player text | Convention | Test gap | Documentation | Upstream fit
- **Where:** <file path>:<line or hunk>, one per line
- **What:** the defect, in one or two sentences
- **Failure scenario:** concrete input or state -> wrong output, crash, or loss; or "none demonstrated" for a convention finding
- **Evidence:** the lines of the diff that show it (quote briefly); what you looked for that would have refuted it and did not find
- **Fix:** the change that would resolve it
- **Confidence:** high | medium | low, and why
```

   Severity: Critical is data loss, a device left unbootable, a credential leaving the device, or a crash on a common path; High is a wrong outcome on a common path or a silent failure that reports success; Medium is a wrong outcome on an uncommon path or a cost the player notices; Low is convention, wording or a test gap with no wrong outcome.
3. **Refutations**: the attacks you tried that failed, one line each -- these are worth as much as the findings.
4. **Coverage boundary**: what you could not judge from this packet and would need to see.

## Rules of evidence

- Cite only what is in the packet and the rule file embedded with it. Do not invent line numbers, functions or rclone behaviour; where rclone's behaviour matters, say what version and what you rely on.
- A name is not a behaviour; read the hunk.
- Prefer a failing input to an adjective.
- A finding that survives your own attempt to refute it is worth more than three that do not; say what you tried.
- Plain English, no hedging chains, no praise. Length is not quality.

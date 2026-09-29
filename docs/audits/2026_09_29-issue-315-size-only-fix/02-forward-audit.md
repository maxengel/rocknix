# Forward audit -- #315's fix, read by two seats before the release candidate

**Auditor:** Code Auditor skill (issue tier; orchestrator: Claude Fable 5.1 in the session; the seats: `anthropic/claude-fable-5.1` xhigh and `openai/gpt-6-astra` max through the council Facilitator on OpenRouter, dispatched 2026-09-29 00:13 UTC, both `outcome=success`)
**Date:** 2026-09-29 00:33 UTC
**Subject:** the diff `320d2b2bea..286759eb6d` (the two cloud scripts, the harness section, the round trip's step) -- `seats/315-size-only.diff`, brief and manifest beside it; the seats' outputs `seats/315-size-only-{claude,gpt}.md`
**Spec:** #315's acceptance criteria; D-CLOUD-153

---

## Verdicts, one per finding (claude 12, gpt 5), each re-read against the tree and, where rclone's behaviour was the question, measured on the host with the image's rclone v1.75.1 against the QA WebDAV

| Finding | Severity (seat) | Verdict | Outcome |
| --- | --- | --- | --- |
| claude F-SS-03 | Low | **Confirmed by measurement**: `--update` alone transfers the same-size change in both directions (`copy -vv --dry-run --update`: "Skipped copy as --dry-run is set"; the plain copy: "Sizes identical"); `--modify-window 1s` alone changes nothing. rclone substitutes a one-second window where precision is unsupported. | **Taken**: `--modify-window` dropped; `--update` alone (D-CLOUD-154). The rule file's sentence corrected. |
| gpt F-SS-01 | High | **Confirmed as a consequence of `--ignore-times` on the ten-minute slack**: an untouched save whose mtime falls inside the slack is re-sent unconditionally and can replace another device's newer cloud copy in a sequential two-device use (A stays running while B plays). On every other remote today's plain copy does the same in that scenario (it replaces whatever differs), which the serial-play model (D-CLOUD-102/103) tolerates; on these remotes the fix must not add it. | **Taken**: the recent set gets `--update` instead (dst newer -> skipped; a save written after its upload -> sent). Also closes claude F-SS-07. |
| claude F-SS-01 | Medium | **Confirmed, narrow**: with `--update`, a size-differing save whose mtime predates the cloud's upload time (a wrong clock at the time of writing) is skipped where the plain copy sent it. With the recent set on `--update` too, the same holds there -- but the recent window already excludes a wrong-clock file (`--max-age` reads the same clock), so the exit sync loses nothing it had. | **Accepted**, written beside the code and in D-CLOUD-154: a save written under a wrong clock waits for its next write under a right one; the every-write case it fixes outweighs it. #317 is the answer. |
| gpt F-SS-02 | High | **Confirmed, narrow**: a same-size local save with further progress and a pre-NTP mtime, never uploaded by the old comparison, can be replaced at the first startup after the update by the cloud's older copy (`cloud_restore --update` runs first). The replaced copy is kept under `--backup-dir` (`/storage/.cache/cloud_sync/replaced/<stamp>`) for one cycle. Requires the wrong clock at the time of that save. | **Accepted with the note** in the row, the rule and the change log; graded Medium (the clock case; the copy is kept). #317. |
| claude F-SS-02 | Medium | **Confirmed against rclone's documentation** ("Modification times and hashes": Fastmail Files, ownCloud, Nextcloud, and `rclone serve`); SharePoint is not among them, so the first list left SharePoint size-only-but-unflagged. | **Taken**: the list inverted to the documented capable vendors (nextcloud, owncloud, infinitescale, fastmail, rclone); everything else is size-only. Harness rows for sharepoint and fastmail. |
| claude F-SS-04 | Medium | **Confirmed**: a crypt or alias over such a WebDAV inherits the comparison and was not detected. | **Taken**: one hop through `remote =` for crypt and alias (three at most; a self-alias ends). Harness rows. union/combine left as capable (multiple upstreams; noted). |
| gpt F-SS-03 / claude F-SS-05 | Medium / Low | **Confirmed**: `.` in a remote name was a sed metacharacter, so `[qa.prod]` could read `[qaxprod]`'s vendor. | **Taken**: the section is matched as a string by an awk reader (`_rclone_conf_key`); the harness's dotted-name pair. |
| claude F-SS-06 / gpt F-SS-04 | Low | **Confirmed**: the round trip's read-back took `paths[0]` from a suffix match that includes `Saves-replaced/<stamp>/...`. | **Taken**: replaced paths excluded, the shortest remaining path read. |
| gpt F-SS-05 | Low | **Confirmed**: the "no flag on this remote" assertions passed vacuously when no copy command was issued. | **Taken**: `sz_run` fails the case when the copy line is empty. |
| claude F-SS-10 | Low | **Confirmed in part**: the scripts hardcode the config path everywhere (`first_remote` too); rclone's own `RCLONE_CONFIG` is a real override. | **Taken** for this function (`RCLONE_CONFIG` honoured after `RCLONE_CONF_FILE`); the other readers are pre-existing and out of scope. |
| claude F-SS-08 | Low | **Confirmed**: the negative path logged nothing. | **Taken**: one log line either way. |
| claude F-SS-07 | Low | **Confirmed** as a cost of `--ignore-times` on the slack. | **Closed by the `--update` refinement**. |
| claude F-SS-09 | Low | **Confirmed**: a device clock in the future makes the restore fetch nothing over existing local saves. | **Accepted**: the clock family, #317. |
| claude F-SS-11 | Low | **Confirmed**: the two scripts' comment lines differ outside the compared function text. | **Accepted**: the harness compares the function bodies (now both functions), which is the contract. |
| claude F-SS-12 | Low | **Confirmed**: S315 proves command lines only. | **Accepted**: by design; the bytes are `X-size-same` on the guest (both directions) and the round trip's step on the pair. |

## What the refinement changed in the packet's terms

`--update` alone on every saves pass of a size-only remote (recent set included, both scripts, both directions); the awk section reader; the inverted vendor list; the crypt/alias hop; the round trip's live-path read; the harness's vacuous-pass guard, the sharepoint/fastmail/dotted/crypt/alias/loop/RCLONE_CONFIG rows. Re-proven: the harness whole (see the running notes below), its positive against `320d2b2bea` again, `X-size-same` on guest d by path.

## Running notes

- 2026-09-29 00:33 UTC: verdicts written; the harness re-run started with the refined section; the seats' packets for the fixes to #313's items are with the seats in parallel (`docs/audits/2026_09_29-milestone-audit-of-the-313-fixes`).

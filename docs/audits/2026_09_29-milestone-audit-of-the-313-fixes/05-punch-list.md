# Punch list -- the audit of the fixes to #313's items and #315

**Auditor:** Code Auditor skill
**Date:** 2026-09-29 00:58 UTC
**Subject:** the 31 findings of `02-forward-audit.md`; the 17 of #315's packet are in `../2026_09_29-issue-315-size-only-fix/`
**Spec:** the items' acceptance text; #313; #315

---

## Instructions for Executing Agent

Every item below was fixed in the same pass by the orchestrator (no streams; the fixes are a few lines each) and is proven by the named check. The Phase 7 gate records the commit once it exists.

## High Priority

## PL-001: the configuration grammar sourced a name the shell evaluates
- **Source Finding:** gpt G3-D-01 (High)
- **Where:** `cloud_backup`, `cloud_restore`, `cloud_sync_helper` -- `conf_valid`
- **Acceptance:** a sourced `RANDOM=`, `SECONDS=`, `PATH=` or `IFS=` line is refused as a name the shell owns; a backslash-dollar before (, [ or { is refused; PL-015's other escapes still pass; harness S3F's canaries never run.

## PL-002: the settings sorter installed a truncated copy
- **Source Finding:** gpt G3-D-04 (High)
- **Where:** `001-functions` `sort_settings`
- **Acceptance:** a producer that fails after the hostname line installs nothing and leaves no temporary (S3F).

## PL-003: the interface's masker ended a value at the second single-quote splice
- **Source Finding:** gpt G3-E-01 (High)
- **Where:** `es-core/src/utils/StringUtil.cpp` `maskInnerChar`
- **Acceptance:** `sh -c 'tool --password '"'"'front back'"'"''` masks the whole password (`MaskSecretsTests`).

## Medium Priority

## PL-004: a NUL byte hid the rest of a configuration line from the grammar
- **Source Finding:** claude G3-D-02 -- refused before awk reads the file, three copies (S3F).

## PL-005: the migration read a single-quoted or bare pointer as the whole line
- **Source Finding:** claude G3-D-05 -- the shared `conf_get`; every pointer read first in `main` (S3F).

## PL-006: the pending marker's acknowledgement removed a newer marker
- **Source Finding:** gpt G3-D-03 -- rename aside, compare, remove or put back (S3F).

## PL-007: the capture's seal removal had no argument-size fallback
- **Source Finding:** gpt G3-D-05 -- `xargs -0 rm -f`.

## PL-008: the sign-in's cleanup said removed without checking
- **Source Finding:** gpt G3-D-06 -- the return code checked, the log truthful.

## PL-009: the restore gate proceeded on a mount state it had not read
- **Source Finding:** gpt G3-D-07 -- `was=no` proceeds only while still not a mount (S3F reads the branch).

## PL-010: the scrubber left a truncated config line's quoted tail readable
- **Source Finding:** gpt G3-D-09 -- the whole tail redacted when the suffix is missing (S3F).

## PL-011: the hooks' added-line scan blanked paths and dropped lines silently
- **Source Finding:** claude G3-E-01, gpt G3-E-06 -- prefixes forced, headers only after `---`, quoted paths read, unread headers refuse; both repositories; `hooks-test` (38 ok), the ES `pre-push-test` (22 ok).

## PL-012: the message hook passed an unreadable message
- **Source Finding:** claude G3-E-02, gpt G3-E-05 -- refused; both repositories; `hooks-test`.

## PL-013: the selection read-back took a failed read as an empty selection
- **Source Finding:** gpt G3-E-03 -- the reader reports its own success; a directory or a bad read refuses.

## PL-014: a damaged reload dropped the pending changes
- **Source Finding:** claude G3-E-06 -- a damaged reading counts as nothing read for the pending set (`es-conf-tests`).

## Low Priority

## PL-015: the ZIP member check trusted a listing that might have no CRC column
- **Source Finding:** claude G3-D-01 (refuted on the image; taken as a guard) -- the column asserted (S3F).

## PL-016: the folder check refused the conf's own trailing slash that the migration accepts
- **Source Finding:** claude G3-D-07 -- one trailing slash stripped before the check.

## PL-017: the push hook left its temporaries behind when killed
- **Source Finding:** claude G3-E-07 -- an EXIT trap, both repositories.

## Accepted, with the reason beside the code or in 02

claude G3-D-03 (the writer's newline recorded), claude G3-D-06, claude G3-D-09, gpt G3-D-02, gpt G3-D-08, claude G3-E-05, gpt G3-E-04.

## Deferred, with a follow-up

- **gpt G3-E-02** (the recovery record published outside the settings lock): a millisecond window needing a damaged live file and a concurrent script write; the record ends older, not lost -- and older can matter when recovery is next needed, so it is tracked as an unresolved Medium, not accepted: **#320** (filed 2026-09-29, the interface fork as owner, a deterministic interleaving test in its criteria; with #317's release).

## Refuted, with the artifact

claude G3-D-04 (F2-autoslot 9 PASS on the guest), claude G3-D-08 (the Osk is the user data), claude G3-E-03 (the French exists), claude G3-E-04 (no other reader), claude G3-D-01's premise (the image's busybox prints the column).

## Phase 7 resolution gate

Recorded per item as it is resolved: the outcome (resolved / deferred / rejected), the commit, the evidence. Open until then.

| Item | Severity | Outcome | Evidence |
| --- | --- | --- | --- |
| PL-001 | High | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-002 | High | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-003 | High | Resolved | ES `893a81403` (StringUtil, two MaskSecretsTests cases; 176 cases / 1856 assertions pass) |
| PL-004 | Medium | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-005 | Medium | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-006 | Medium | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-007 | Medium | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-008 | Medium | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-009 | Medium | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-010 | Medium | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-011 | Medium | Resolved | ES `db5fc6954` (the hooks; pre-push-test 22 ok); `eb4fbe9b2c` (hooks-test 38 ok) |
| PL-012 | Medium | Resolved | ES `db5fc6954`; `eb4fbe9b2c` |
| PL-013 | Medium | Resolved | ES `03ebb50a1` (GuiMenu: the reader reports its success; es-syntax-check PASS); the case, ES `0a02c71ea` (`tests/cloud-content-selection.py`: a directory where the selection file should be, nothing ticked, refuses -- 13 of 14 against the reader without its checks, 14 of 14 with them; the test had compiled nothing since the signature changed, 2026-09-29) |
| PL-014 | Medium | Resolved | ES `812bc2f75` (SystemConf; es-conf-tests 8 cases / 105 assertions, the new case seen to fail on the code before it) |
| PL-015 | Low | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-016 | Low | Resolved | `eb4fbe9b2c` (the harness PASSED, 1254 checks, `harness-s3f2`; the run before it, `harness-s3f`, 1251 PASS and 2 FAIL of the pass's own shape, corrected; section S3F, 18 red under `--old` at `286759eb6d`) |
| PL-017 | Low | Resolved | ES `db5fc6954`; `eb4fbe9b2c` |

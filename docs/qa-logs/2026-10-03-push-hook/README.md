# M7.P2 push history controls — #371

The hook now excludes history already published to the actual destination
remote when scanning newly pushed commits. Whole-file tip checks remain;
unknown remotes retain conservative history scanning. Excluding *all*
remotes would allow an unpublished credential commit merely because another
remote held it, so the exclusion is scoped to the push destination.

`check-history.py <hook> <support-hooks-dir>` makes local repositories and
performs actual local pushes using synthetic credential-shaped fixtures.
Before:5 pass,2 fail. After:7 pass, including published-history merges,
new credentials at the tip, removed credentials in unpublished history,
commit-message credentials, unrelated remotes and unreadable ranges.
`real-blocked-merge.log` runs the corrected hook over the actual previously
blocked bbb2c635fe merge and tracked destination tip: exit0.

An actual distribution push is still required to close #371; these controls
do not claim that it happened. No real credentials or external remote are
used by the constructed controls.

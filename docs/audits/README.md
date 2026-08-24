# Audits

Output of the `code-auditor` skill, one directory per audit:

```
docs/audits/YYYY_MM_DD-{scope}-{item-name}/
  00-running-log.md     (milestone scope only)
  01-research-notes.md
  02-forward-audit.md
  03-retrospective.md
  04-analysis.md
  05-punch-list.md
```

`{scope}` is `milestone`, `epic` or `issue`. Each audit ends in a punch-list
issue on `maxengel/rocknix` — Issues are disabled on `ROCKNIX/distribution`.

The skill grounds work against this project's own doctrine rather than a single
rubric file: the instruction files whose `applyTo` matches the changed paths,
`docs/blindspot-register.md`, and the invariants those files state.

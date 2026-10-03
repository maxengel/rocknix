# Sign-in memory help — #405

The old --help split selected Python imports instead of its comment header.
Both help flags now return the documented port/URL/seconds/key/JSON usage,
exit0, and no import statements. Before/after output is retained. Only help
selection changed; runtime measurement is unaffected.

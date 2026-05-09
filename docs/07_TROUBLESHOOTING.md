# 07 — Troubleshooting

> Symptom + Cause + Resolution log for reproducible bugs that took non-trivial effort to debug. Anything that took us more than 30 minutes to figure out belongs here so we never re-debug it.

---

## Format

Each entry follows this structure:

```markdown
## YYYY-MM-DD — short title

**Symptom**
What we observed. Be specific: error message, what failed, where, on which platform.

**Cause**
Root cause once understood. If it took multiple wrong hypotheses to find, list the dead-ends briefly.

**Resolution**
What fixed it. Code change, config change, dependency bump, etc.

**Prevention**
What we changed to prevent recurrence: a test, a lint rule, a doc note, an `expo-doctor` check.

**Affected modules / releases:** [e.g. R1-M3, breed-identify edge function]
**Time spent:** [rough hours]
```

---

## Entries

*(Empty. Will be populated as bugs are encountered.)*

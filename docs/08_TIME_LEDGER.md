# 08 — Time Ledger

> Per-session and per-release wall-clock data. Canonical source for the project's pace. Anton plans calendar from this; Claude refines estimates from this.

---

## Pace observations (refreshed at every session close)

*(To be populated after the first session.)*

---

## Per-release totals

| Release | Estimate (h) | Actual (h) | Variance | Notes |
|---|---|---|---|---|
| R0 — Infra spine | ~14 | — | — | — |
| R1 — Breed ID | ~12 | — | — | — |
| R2 — Medcard OCR | ~10.5 | — | — | — |
| R3 — Survey + plan | ~15 | — | — | — |
| R4 — Paywall + signin | ~12 | — | — | — |
| R5 — Localization | ~9 | — | — | — |
| **MVP total** | **~73** | — | — | — |

---

## Per-session log

| Session | Start (local TZ) | End (local TZ) | Wall-clock (h) | Modules touched | Notes |
|---|---|---|---|---|---|
| 001 — Architecture & doc set | 2026-05-09 03:17 UTC | *(in progress)* | — | All foundation docs (00–08, README, CLAUDE.md) | Project kickoff. Stack locked, validation ladder locked, D-001..D-011 logged. |

---

## Per-module breakdown (populated as work progresses)

| Module | Estimate (h) | Architect-side (h) | Implementation (h) | Total actual (h) | Variance | Reason |
|---|---|---|---|---|---|---|
| *(empty)* | — | — | — | — | — | — |

---

## How to update this ledger

At every session close:

1. Run `date "+%Y-%m-%d %H:%M %Z"` via bash to capture session end
2. Compute wall-clock total
3. Append a row to "Per-session log"
4. If a release closed, update "Per-release totals" with the actual
5. If multi-module session, append rows to "Per-module breakdown"
6. Refresh "Pace observations" at the top with any new patterns (e.g. "OCR work consistently takes 1.4x estimate", "edge function setup faster than expected once adapter pattern is in place")

For backfill of prior sessions, use:
```
git log --pretty=format:'%h %ad %s' --date=iso-local --reverse
```
to compute commit-spreads.

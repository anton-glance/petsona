# 08 — Time Ledger

> Per-session and per-release wall-clock data. Canonical source for the project's pace. Anton plans calendar from this; Claude refines estimates from this.

---

## Pace observations (refreshed at every session close)

After session 001 (R0-M0 + R0-M1):

- **Plan-review round-trips are cheap insurance.** The R0-M1 Phase 1 plan caught two architectural mistakes baked into the original docs (D-012 repo layout, D-013 Jest vs Vitest). Cost: one extra round-trip (~30 min). Saving: not refactoring 50+ files later. Repeat the discipline at R0-M2+.
- **Toolchain setup absorbs more than estimated.** R0-M0 was estimated at 1h, took ~1.5h, mostly because of fnm permission issues with `~/.local/state` (root-owned from a prior gem install) and Node 25 needing to be displaced by Node 20. Worth flagging the fnm-state-dir gotcha for any future mac setup; logged in the R0-M0 milestone notes.
- **Disk space is a real risk on dev machines.** Mid-R0-M1 the agent hit ENOSPC during commit. Recovery (clear DerivedData) freed 9.8 GB. Worth running `df -h /` and clearing DerivedData before any session involving builds.
- **Agent reports occasionally misalign with diffs.** The R0-M1 report said `expo-env.d.ts` was checked in; the actual diff shows it gitignored. Implementation was correct; the report wording was stale. Confirms the value of spot-checking diffs in addition to reading the agent's self-review.

---

## Per-release totals

| Release | Estimate (h) | Actual (h) | Variance | Notes |
|---|---|---|---|---|
| R0 — Infra spine | ~14 | *(in progress)* | — | M0 + M1 closed at ~4.5h vs ~3h estimate (+50%) — see milestone notes |
| R1 — Breed ID | ~12 | — | — | — |
| R2 — Medcard OCR | ~10.5 | — | — | — |
| R3 — Survey + plan | ~15 | — | — | — |
| R4 — Paywall + signin | ~12 | — | — | — |
| R5 — Localization | ~9 | — | — | — |
| **MVP total** | **~73** | — | — | — |

---

## Per-session log

| Session | Start (UTC) | End (UTC) | Wall-clock (h) | Active (h, est.) | Modules touched | Notes |
|---|---|---|---|---|---|---|
| 001 — Architecture, doc set, R0-M0, R0-M1 | 2026-05-09 03:17 | 2026-05-09 15:24 | 12.1 | ~5–6 | All foundation docs (00–08, README, CLAUDE.md), R0-M0 toolchain, R0-M1 scaffold | Project kickoff. Stack locked, validation ladder locked, D-001..D-014 logged. R0-M1 PR #1 merged as squash `39a3133`. Wall-clock includes async time (Anton sleep / parallel work) — active session time substantially less. |

---

## Per-module breakdown (populated as work progresses)

| Module | Estimate (h) | Architect-side (h) | Implementation (h) | Total actual (h) | Variance | Reason |
|---|---|---|---|---|---|---|
| R0-M0 — Local environment | 1.0 | 0.3 | 1.2 (Anton) | ~1.5 | +50% | fnm `~/.local/state` permissions, Node 25 displacement |
| R0-M1 — Repo and tooling scaffold | 2.0 | 0.5 | ~2.5 (agent) | ~3.0 | +50% | Plan-review round-trip caught D-012/D-013 (~30 min); CI fix commit; disk-pressure recovery |

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

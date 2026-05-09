# 05 — History

> Append-only frozen verdicts and lessons learned. Per-release detail lives in `JOURNAL_R{N}.md` files.

---

## Project start — 2026-05-09 03:17 UTC

Repo scaffolding and doc set produced by Claude.ai (Chief of Engineering). Anton (Chief of Product) confirmed:

- Single cross-platform codebase (Expo + React Native + TypeScript)
- Supabase backend with anonymous-first auth and AI gateway pattern
- Multi-provider AI abstraction (Claude + Mistral OCR initially; Whisper / Parakeet later)
- North American launch targeting US, Canada, Mexico
- Three locales by R5: English, Spanish, Russian
- Free-tier infra throughout R0–R5 (~$33/mo at 1,000 MAU steady state)
- R0–R5 validation ladder, end-to-end testing as the quality gate
- Chief of Engineering / Chief of Product / Claude Code Implementer role split

Foundational decisions logged as D-001 through D-011 in `06_DECISIONS.md`.

Time ledger initialized in `08_TIME_LEDGER.md`.

---

## R0 — `[in progress]`

R0 verdict pending. Detailed record will be in `JOURNAL_R0.md` when all R0 milestones close.

### Milestone checkpoints

**R0-M0 — Local environment** ✅ shipped 2026-05-09. Anton's machine has Node 20 LTS via fnm, pnpm, EAS CLI, Deno, Supabase CLI (2.72.7 — upgrade pending CLT update). One follow-up logged: macOS Command Line Tools out of date, blocks Supabase CLI upgrade until R0-M3.

**R0-M1 — Repo and tooling** ✅ shipped 2026-05-09 via PR #1, squash-merged as `39a3133`. Expo SDK 55 + TypeScript strict + NativeWind v4 + Expo Router + i18next + Zustand + Jest scaffold at the repo root. CI (typecheck + test + lint) green at 28s on the PR. 12/12 tests pass across 4 suites. `expo-doctor` 18/18. `expo export` produced 3.9 MB Hermes bundle, 1410 modules, 0 errors. Two ADRs surfaced during plan review: D-012 (repo root as Expo project root, replacing the originally-documented `/app/` wrapper) and D-013 (Jest, replacing Vitest). One ADR surfaced during implementation: D-014 (bundle ID collapsed to `com.antonglance.mypet`).

**R0-M2 onward — pending.**

---

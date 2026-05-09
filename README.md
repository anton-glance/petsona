# Petsona

Cross-platform mobile app (iOS + Android) for dog and cat owners. The pet's medical card, photo-based breed identification, and an AI-generated weekly care plan, all in one place.

**Status:** Pre-R0. Repo scaffolding only.
**Project started:** 2026-05-09 03:17 UTC.
**Working name:** Petsona (subject to product naming review before R3).
**Repo:** https://github.com/anton-glance/petsona

---

## What this product is

The user opens the app, snaps a photo of their pet, the app recognizes the species and breed, then scans the medical card from the vet to extract name, age, weight, vaccinations. A short survey collects location and behavior. The app generates a week-by-week, actionable plan tailored to the pet. The medical card becomes the source of truth the owner brings to vet visits.

For the full product description, see `docs/02_PRODUCT_SPEC.md`.

---

## How this repo is organized

The Expo project lives at the **repo root**. There is no `/app/` wrapper — the `app/` directory at the root contains expo-router screens.

```
package.json, app.json, etc.   Expo project root
app/                           expo-router screens (file-based routing)
components/                    shared UI components
features/                      feature folders (onboarding/, plan/, medcard/, …)
lib/                           supabase, logger, env, store
locales/                       en.json, es.json, ru.json
i18n.ts                        i18next setup
supabase/                      Backend: Deno-based edge functions + Postgres migrations
  functions/
    breed-identify/            Vision AI for breed recognition
    medcard-ocr/               OCR for medical cards
    plan-generate/             Streaming weekly plan generation
    _shared/                   Provider adapters (claude, mistral, …) + logging + auth
  migrations/
shared/                        TypeScript types shared client ↔ functions
docs/                          Project documentation (read these first)
CLAUDE.md                      Root-level instructions for the Claude Code agent
```

---

## Read these in order before doing anything

| # | File | Purpose |
|---|---|---|
| 1 | `docs/00_CLAUDE_INSTRUCTIONS.md` | How Claude.ai (architect) and Anton (product) work together |
| 2 | `docs/01_AGENT_INSTRUCTIONS.md` | How the Claude Code agent works on this repo |
| 3 | `docs/02_PRODUCT_SPEC.md` | What Petsona is. Single-source product description |
| 4 | `docs/03_ARCHITECTURE.md` | Stack, tools, infrastructure, AI gateway pattern |
| 5 | `docs/04_BACKLOG.md` | R0–R5 validation ladder with milestones and quality gates |
| 6 | `docs/05_HISTORY.md` | Frozen verdicts and lessons learned per release |
| 7 | `docs/06_DECISIONS.md` | Architecture decision log (ADRs), seeded with D-001..D-011 |
| 8 | `docs/07_TROUBLESHOOTING.md` | Known issues, workarounds, debug recipes |
| 9 | `docs/08_TIME_LEDGER.md` | Per-session and per-release wall-clock tracking |
| 10 | `CLAUDE.md` (root) | Lean agent context loaded on every Claude Code session |

Per-release journals (`docs/JOURNAL_R0.md`, `JOURNAL_R1.md`, …) are added as each release closes.

---

## Roles

- **Anton** — Chief of Product. Defines features, sequences, UI/UX, release priorities. Runs the Claude Code agent. Decides "done."
- **Claude.ai (this conversation)** — Chief of Engineering. Architecture, stack, repo, data model, AI gateway, prompts for the agent, code review, release sequencing pushback. Does not write production code unless explicitly asked.
- **Claude Code agent** — Implementer. Reads `CLAUDE.md` + the prompt; writes code; verifies via tests, typecheck, lint; reports with proof.

---

## Local setup

Repo lives at `~/coding/petsona/`. Tooling and full setup steps in `docs/04_BACKLOG.md` under R0.

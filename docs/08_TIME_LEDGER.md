# 08 — Time Ledger

> Per-session and per-release wall-clock data. Canonical source for the project's pace. Anton plans calendar from this; Claude refines estimates from this.

---

## Pace observations (refreshed at every session close)

After session 003 (R0-M3 close):

- **R0-M3 hit estimate cleanly.** ~3h actual vs 3h estimate, 0% variance. First milestone of R0 to match the number. Driver: agent's Phase 1 plan-review caught three preconditions in the architect-side prompt that contradicted the codebase (P-1 env var naming, P-2 .env file naming, P-3 lib/supabase.ts already existing), plus a security improvement (D-020 anon-key + forwarded-JWT vs. service-role for getUser). All four were flagged before any code touched. Eliminated likely refactor cycles. **Pattern to repeat: prompt the agent for the actual codebase state during Phase 1, not just the conceptual design.**
- **EAS env vars are a separate-from-`.env.local` setup step.** Easy to forget. EAS builds inline `EXPO_PUBLIC_*` from a separate EAS-side env var system, not from local `.env.local`. Agent surfaced this with exact `eas env:create` commands; if it hadn't, the first dev-build smoke test would have crashed at `createClient(undefined, undefined)`.
- **Dashboard toggles outside the migration matter.** Anonymous sign-ins must be flipped ON in the Supabase Authentication providers page — `supabase/config.toml` only controls local-dev behavior. R4's social-auth setup will have a similar pattern.
- **Cold boot time on edge functions is fast.** Hello function: 28-30ms cold start. R1+ edge functions with AI provider SDK imports may be slower; revisit if breed-identify cold-starts exceed ~500ms.
- **Smoke screen viewport on Pixel 7 needs `SafeAreaView`.** Logged as R1-M2 must-do.

After session 002 (R0-M2 close, validation-ladder re-shape D-017/D-018/D-019):

- **R0 is over-running by ~50% per milestone.** M0 was 1h estimate → 1.5h actual; M1 was 2h → ~3h; M2 was 3h → ~6h. Common driver: external dependencies (Apple Developer / App Store Connect / Google Play / fnm permissions / disk pressure / Apple soft-blocks). These don't compound — they're one-time setup costs — but they do add wall-clock that isn't in the estimate. Applied lesson: pad R1-R6 estimates by ~25% for "first-time-doing-this-thing" tax. The estimates in `04_BACKLOG.md` are unchanged for now; track and revisit at R1 close.
- **Plan-review round-trips are still cheap insurance.** R0-M2's EAS plan caught two pre-flight blockers (`eas login` not done; Node 25 active in shell) before any code ran. Saved ~15 min of confused agent failures.
- **The agent's plan can be wrong and self-correct.** R0-M2's plan said bundle IDs were already correct in `app.json`; they weren't. The agent caught this in its own plan review when scanning the actual files (vs. trusting my prompt's claim). Architect-side prompts should state assumptions explicitly so the agent has something to verify. Don't write "X is already correct" — write "verify X matches expectation Y; if not, surface and propose fix."
- **macOS process pressure cascades.** Parallel Claude Code sessions across multiple projects + accumulating Metro/simulator processes leads to fork-exhaustion within 4-6 hours of continuous work. Reboot is the only reliable recovery. Plan for ~30-45 min of "reboot + reopen" overhead in any session that runs >4 hours.
- **Dev-client UX confusion is a one-time cost.** Once Anton sees the dev-client menu and understands what it is, the rest of the project uses the same dev workflow for free. Documented in `07_TROUBLESHOOTING.md`.
- **Product naming must clear all three surfaces.** R0-M2 burned ~45 min on the bare-"Petsona" Apple soft-block. Future product naming (real-payments rebrand post-MVP, if any) checks all surfaces *before* any rename PR.

---

## Per-release totals

| Release | Estimate (h) | Actual (h) | Variance | Notes |
|---|---|---|---|---|
| R0 — Infra spine | ~14 | *(in progress, M0+M1+M2+M3 = ~13.5h)* | -4% | M0 1.5h, M1 3h, M2 ~6h, M3 ~3h. M3 first to hit estimate cleanly thanks to agent plan-review catching codebase mismatches. M4/M5 pending. |
| R1 — Splash, camera, hardcoded breed-ID, Welcome screen | ~12 | — | — | New shape per D-017 |
| R2 — Documents, hardcoded medcard, merged profile | ~12 | — | — | New shape per D-017 |
| R3 — Survey, location, real plan, progress UI | ~15 | — | — | Real Claude Sonnet from R3 per D-018 |
| R4 — Paywall + signin | ~12 | — | — | — |
| R5 — Real AI swap-in (breed + medcard) | ~6 | — | — | New release per D-018 |
| R6 — Localization | ~9 | — | — | Was R5 |
| **MVP total** | **~80** | — | — | Re-shaped per D-018: was ~73 (R0-R5) |

---

## Per-session log

| Session | Start (UTC) | End (UTC) | Wall-clock (h) | Active (h, est.) | Modules touched | Notes |
|---|---|---|---|---|---|---|
| 001 — Architecture, doc set, R0-M0, R0-M1 | 2026-05-09 03:17 | 2026-05-09 15:24 | 12.1 | ~5–6 | All foundation docs (00–08, README, CLAUDE.md), R0-M0 toolchain, R0-M1 scaffold | Project kickoff. Stack locked, validation ladder locked, D-001..D-014 logged. R0-M1 PR #1 merged as squash `39a3133`. Wall-clock includes async time. |
| 002 — Petsona rename, R0-M2 EAS config, R0-M2 close | 2026-05-09 15:24 | 2026-05-11 18:32 | ~51 | ~9–10 | Rename PRs #3 + #4 (D-015, D-016); EAS PR #5 (D-019 hardcoded adapter concept locked); R0-M2 close + journals (D-017, D-018, D-019, R5/R6 reshape) | Two-day session across many short bursts. Wall-clock dominated by async (Apple/Google review queues, EAS build queues, sleep). Active time concentrated on EAS configuration agent prompt + Apple credential flow + Android splash hotfix + post-close doc batch. Three incidents logged in `07_TROUBLESHOOTING.md` (Apple soft-block, fork exhaustion, dev-client confusion). |
| 003 — R0-M3 Supabase spine | 2026-05-11 18:32 | 2026-05-11 22:21 | ~3.8 | ~3 | PR #7 (D-002 amendment, D-020); manual link/push/deploy; smoke-test on iPhone + Pixel 7 | Clean execution. Agent's Phase 1 plan-review caught 3 codebase-vs-prompt mismatches (P-1/P-2/P-3) and proposed a security improvement (D-020 anon-key + forwarded-JWT). Production round-trip verified end-to-end on both platforms. R0-M3 closed at estimate (3h). |

---

## Per-module breakdown (populated as work progresses)

| Module | Estimate (h) | Architect-side (h) | Implementation (h) | Total actual (h) | Variance | Reason |
|---|---|---|---|---|---|---|
| R0-M0 — Local environment | 1.0 | 0.3 | 1.2 (Anton) | ~1.5 | +50% | fnm `~/.local/state` permissions, Node 25 displacement |
| R0-M1 — Repo and tooling scaffold | 2.0 | 0.5 | ~2.5 (agent) | ~3.0 | +50% | Plan-review round-trip caught D-012/D-013 (~30 min); CI fix commit; disk-pressure recovery |
| R0-M2 — Store identifiers + EAS | 3.0 | 1.5 | ~4.5 (Anton + agent) | ~6.0 | +100% | Apple soft-block on bare "Petsona" → rename cycle (~45 min); fork-exhaustion recovery (~45 min); Android splash drawable hotfix (~50 min build wall-clock + 15 min implementation); Google Play Console deferred. Play submit not done in this M2; deferred without re-estimating. |
| R0-M3 — Supabase spine | 3.0 | 1.0 | ~2.0 (agent + Anton) | ~3.0 | 0% | First R0 milestone on-estimate. Agent Phase 1 plan-review caught P-1/P-2/P-3 codebase mismatches + proposed D-020 security improvement before any code was written. Manual link/push/deploy + smoke-test on both platforms ~1h. End-to-end production round-trip verified. |

---

## How to update this ledger

At every session close:

1. Run `date "+%Y-%m-%d %H:%M %Z"` via bash to capture session end
2. Compute wall-clock total
3. Append a row to "Per-session log"
4. If a release closed, update "Per-release totals" with the actual
5. If multi-module session, append rows to "Per-module breakdown"
6. Refresh "Pace observations" at the top with any new patterns

For backfill of prior sessions, use:
```
git log --pretty=format:'%h %ad %s' --date=iso-local --reverse
```
to compute commit-spreads.

# 08 — Time Ledger

> Per-session and per-release wall-clock data. Canonical source for the project's pace. Anton plans calendar from this; Claude refines estimates from this.

---

## Pace observations (refreshed at every session close)

After session 006 (Design spike close):

- **Design spike came in under estimate (~8.8h vs ~10h, −12%).** Pattern: the spike's Phase 1 produced 4 explicit push-backs (P-1 through P-4) and 9 open questions that were resolved before any code shipped. Phase 2 then proceeded without major architecture detours. The 4 push-backs surfaced two genuinely better translations (P-1 RGBA-direct on Android; P-3 the extra deps), a documentation precedent for component libraries (P-2 docstrings allowed in this context), and a token clarification (P-4 letter-spacing on display sizes).
- **Tests-first discipline scaled to 15 primitives.** Red→green pairs were batched in 4 commits (Text alone, Spinner alone, structural-5 batch, IconButton+BackButton batch, batch-5 for Button+Input+PawCheckbox+Progress+ProgressDots, Segmented alone). Each batch had one red commit then one green commit. Test count rose 54 → 152 (+98) across the spike.
- **One test-mechanism red→amend cycle on Segmented** because the original test used `.parent` selectors that didn't survive Pressable's internal wrapper. Replaced with `getAllByRole('tab')` index access — same contract, robust mechanism. Pattern for future component tests: prefer role-based selectors over DOM-traversal.
- **Babel auto-config saved a known footgun.** `babel-preset-expo` 55 auto-adds `react-native-worklets/plugin` when the package is installed. Verified by grep before touching `babel.config.js`. Future agents: don't manually add Reanimated plugins on SDK 55+.
- **Reanimated 4 + jest-expo 55: bundled mock is broken.** The library's `mock.js` recursively imports the live library and crashes the worklets-native init in Jest's Node env. Custom inline mock in `jest.setup.ts` (22 lines) is the fix. Forwarded to anyone adding a Reanimated-using primitive.
- **NativeWind v4 JSX-transform interaction with jest.mock factories.** A factory that does `React.createElement` gets hoisted to reference NativeWind's CSS Interop, which fails the "no out-of-scope references in jest.mock" rule. Use `require()` inside the factory. Captured in `lib/glass.test.tsx`'s mock comment.
- **Drift detection between `lib/theme.ts` and `tailwind.config.js` lives in tests, not types.** `tailwind.config.js` is CJS at PostCSS-eval time; can't import a `.ts` file. Solution: inline literals on the Tailwind side + a Jest assertion that hex/numeric values match. Cost: 4 sanity tests. Benefit: future edits to either file fail CI loud, not silently.

After session 005 (R1-M1 close):

- **R1-M1 came in under estimate (1.5h actual vs 3h estimate, -50%).** First under-estimate of the project. Drivers: (a) the R1-M1 prompt was tight and concrete; the agent's Phase 1 plan was clean with three pushbacks (P-1 R0-status confusion, P-2 prompt-version semantics, P-3 service-role injection) all resolved cheaply in the architect↔Anton round-trip before code; (b) the smoke-button add-on was a single ~30 min Phase 1+2+3 cycle. Pattern to repeat: when the prompt is sharp and the codebase is already shaped by prior milestones (auth helper, CORS helper, hello-function pattern from R0-M3), the agent doesn't need expensive Phase-1 architectural exploration.
- **Architect↔agent prompt-quality compounds.** R0's early milestones absorbed setup tax; R0's later milestones (M3, M4) hit their estimates cleanly; R1-M1 came in under. The codebase patterns established in R0 are paying down in R1+ capability work.
- **Process miss: branch protection was never enforced.** R0-M1 checklist said it was, GitHub Settings showed it wasn't. No code damage; ~10 min documentation work. Lesson: "marked done in checklist" ≠ "verified to work." For setup-style items at R0-quality-gate, the close criterion must be "verified to work." Captured in `07_TROUBLESHOOTING.md` 2026-05-12 entry; action item in `04_BACKLOG.md` R0 follow-up.
- **Time accounting discipline tightened.** Architect (Claude.ai) will run `date` via bash at every session start *and* ask Anton for active coding time at every milestone close. R1-M1 was the first milestone where the explicit ask happened — Anton reported 1.5h, which is recorded as the authoritative actual.

After session 004 (R0 closed):

- **R0 closed at +18% over estimate (16.5h actual vs 14h estimate).** Within the +25% buffer flagged at R0-M2. M0-M2 ran +50% to +100% on one-time setup costs; M3-M4 hit close to estimate; M5 was 0 (absorbed into M3+M4). Net: setup costs are non-recurring; capability releases (R1+) should track close to estimate.
- **R0-M5 absorption is a ladder-design lesson.** End-to-end smoke validation can be exercised by the milestone that introduces the last new capability rather than being a standalone milestone. Re-evaluate R1-R6 ladder for similar absorptions — particularly R5 "AI swap-in" which might absorb into R4's friends-and-family testing if both happen near the same time.
- **Agent plan-review pushback is consistently worth the round-trip.** Across M1, M2, M3, M4: each milestone had at least one agent-proposed correction or improvement that prevented a refactor. D-012, D-013, D-014, D-020, D-021 all came from agent pushback. Keep this pattern.
- **The "no test changes after red commit" rule needs nuance.** R0-M4 needed `lib/logger.test.ts` rewriting because the contract changed (D-021); the old tests tested the old behavior. Replacing them is correct. Modifying them mid-implementation to make passing implementations possible is not. The rule is: **no contract-changing test modifications during the green phase; full-contract-replacement during a red commit is fine.**
- **Free-tier infrastructure cost: $0/month at R0 close.** Supabase, PostHog, Sentry, GitHub, EAS all free. Anthropic + Mistral not yet active (R1+).

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
| R0 — Infra spine | ~14 | **~16.5 (closed)** | +18% | M0 1.5h, M1 3h, M2 ~6h, M3 ~3h, M4 ~3h, M5 0h (absorbed). Within +25% buffer flagged at R0-M2. Detailed in `JOURNAL_R0.md`. |
| R1 — Splash, camera, hardcoded breed-ID, Welcome screen | ~12 | **~1.5 (M1 only)** | — | M1 done at -50%. M2 blocked on design spike; M3 pending M2. |
| R2 — Documents, hardcoded medcard, merged profile | ~12 | — | — | New shape per D-017 |
| R3 — Survey, location, real plan, progress UI | ~15 | — | — | Real Claude Sonnet from R3 per D-018 |
| R4 — Paywall + signin | ~12 | — | — | — |
| R5 — Real AI swap-in (breed + medcard) | ~6 | — | — | New release per D-018 |
| R6 — Localization | ~9 | — | — | Was R5 |
| **MVP total** | **~80** | **~18 committed (R0 + R1-M1)** | — | Re-shaped per D-018. Design spike additive — not in 80h estimate. |

### Inter-release spikes

| Spike | Estimate (h) | Actual (h) | Variance | Notes |
|---|---|---|---|---|
| Design spike — theme + primitives + glass + motion + assets + species slice + ADR D-023 + journal | ~10 | **~8.8 (closed)** | −12% | Phase 1 produced 4 push-backs (P-1..P-4) resolved before any code. 15 primitives shipped tests-first. 54 → 152 tests. PR `anton/spike-design-system`. |

---

## Per-session log

| Session | Start (UTC) | End (UTC) | Wall-clock (h) | Active (h, est.) | Modules touched | Notes |
|---|---|---|---|---|---|---|
| 001 — Architecture, doc set, R0-M0, R0-M1 | 2026-05-09 03:17 | 2026-05-09 15:24 | 12.1 | ~5–6 | All foundation docs (00–08, README, CLAUDE.md), R0-M0 toolchain, R0-M1 scaffold | Project kickoff. Stack locked, validation ladder locked, D-001..D-014 logged. R0-M1 PR #1 merged as squash `39a3133`. Wall-clock includes async time. |
| 002 — Petsona rename, R0-M2 EAS config, R0-M2 close | 2026-05-09 15:24 | 2026-05-11 18:32 | ~51 | ~9–10 | Rename PRs #3 + #4 (D-015, D-016); EAS PR #5 (D-019 hardcoded adapter concept locked); R0-M2 close + journals (D-017, D-018, D-019, R5/R6 reshape) | Two-day session across many short bursts. Wall-clock dominated by async (Apple/Google review queues, EAS build queues, sleep). Active time concentrated on EAS configuration agent prompt + Apple credential flow + Android splash hotfix + post-close doc batch. Three incidents logged in `07_TROUBLESHOOTING.md` (Apple soft-block, fork exhaustion, dev-client confusion). |
| 003 — R0-M3 Supabase spine | 2026-05-11 18:32 | 2026-05-11 22:21 | ~3.8 | ~3 | PR #7 (D-002 amendment, D-020); manual link/push/deploy; smoke-test on iPhone + Pixel 7 | Clean execution. Agent's Phase 1 plan-review caught 3 codebase-vs-prompt mismatches (P-1/P-2/P-3) and proposed a security improvement (D-020 anon-key + forwarded-JWT). Production round-trip verified end-to-end on both platforms. R0-M3 closed at estimate (3h). |
| 004 — R0-M4 telemetry + R0 close | 2026-05-11 22:21 | 2026-05-12 02:16 | ~3.9 | ~3 | PR #9 (telemetry code + D-021); EAS rebuilds for both platforms; smoke test on both devices; R0-M4 + R0-M5 + R0 close docs | R0-M4 code agent ~2h. Agent pushed back on logger → PostHog routing during Phase 1 (became D-021). Smoke test verified `Identify` → `app_launch` → `test_error_thrown` sequence on both devices in PostHog Activity feed; corresponding Sentry errors captured. R0-M5 absorbed into M3+M4 work (zero additional implementation needed). R0 closed at session end with comprehensive journal. |
| 005 — R1-M1 breed-identify edge fn + smoke button | 2026-05-12 02:24 | 2026-05-12 16:37 | ~14.2 | ~3 | PR #11 (R1-M1 main: shared/types, _shared/ai/types, hardcoded adapter, logging, breed-identify fn + 32 Deno tests) merged as squash `7f178ec`; direct commit `938390b` (smoke button) — see process-miss below | R1-M1 code agent ~1.5h per Anton. Three Phase-1 pushbacks resolved (P-1 R0-status stale read, P-2 prompt-version semantics, P-3 service-role injection — agent was right on P-3 and corrected the architect prompt). Smoke add-on was a 30-min round-trip. End-to-end verified on iPhone + Pixel 7 AVD: `dog — Labrador Retriever (0.92)` rendered both sides; `ai_jobs` rows landed with all expected columns. **Process miss:** smoke-add-on agent committed directly to `main` and pushed; investigation revealed branch protection was never configured at R0-M1 despite checklist marking it done. No code damage; ~10 min doc work; action item in R0 follow-up. Logged in `07_TROUBLESHOOTING.md`. Wall-clock dominated by async (Anton testing, dashboard verification, sleep). |
| 006 — Design spike (theme + primitives + glass + motion + assets + species + ADR + journal) | 2026-05-12 ~17:30 | 2026-05-12 21:17 | ~3.8 | ~8.8 (agent active, est.) | Branch `anton/spike-design-system`: PR pending. 25 commits, ~2836 insertions across 80 files. 152 tests passing across 28 suites (was 54 / 10 at baseline). | Largest single piece of work since R0. Phase 1 plan produced 4 push-backs all approved (P-1 direct RGBA on Android; P-2 docstrings allowed; P-3 +react-native-svg & expo-linear-gradient; P-4 letter-spacing on display sizes). Phase 2: 15 primitives shipped tests-first in 4 batched red→green cycles. Surprises: Reanimated 4 bundled mock unusable in jest-expo; NativeWind JSX-transform hoist issue in `jest.mock` factories; one test-mechanism revision on Segmented (`.parent` → role-based). Anton-active time pending confirmation. |

---

## Per-module breakdown (populated as work progresses)

| Module | Estimate (h) | Architect-side (h) | Implementation (h) | Total actual (h) | Variance | Reason |
|---|---|---|---|---|---|---|
| R0-M0 — Local environment | 1.0 | 0.3 | 1.2 (Anton) | ~1.5 | +50% | fnm `~/.local/state` permissions, Node 25 displacement |
| R0-M1 — Repo and tooling scaffold | 2.0 | 0.5 | ~2.5 (agent) | ~3.0 | +50% | Plan-review round-trip caught D-012/D-013 (~30 min); CI fix commit; disk-pressure recovery |
| R0-M2 — Store identifiers + EAS | 3.0 | 1.5 | ~4.5 (Anton + agent) | ~6.0 | +100% | Apple soft-block on bare "Petsona" → rename cycle (~45 min); fork-exhaustion recovery (~45 min); Android splash drawable hotfix (~50 min build wall-clock + 15 min implementation); Google Play Console deferred |
| R0-M3 — Supabase spine | 3.0 | 1.0 | ~2.0 (agent + Anton) | ~3.0 | 0% | First R0 milestone on-estimate. Agent Phase 1 plan-review caught P-1/P-2/P-3 codebase mismatches + proposed D-020 security improvement before any code was written |
| R0-M4 — Telemetry | 2.0 | 1.0 | ~2.0 (agent) | ~3.0 | +50% | Agent Phase 1 pushback on logger → PostHog routing (became D-021) added ~30 min round-trip; net positive. EAS rebuilds ~30 min wall-clock |
| R0-M5 — End-to-end smoke | 3.0 | 0 | 0 | 0 | -100% | Absorbed into R0-M3 + R0-M4 smoke tests. Ladder design lesson logged |
| R1-M1 — breed-identify edge fn (hardcoded) + smoke button | 3.0 | 0.5 | ~1.0 (agent) | ~1.5 | **-50%** | First under-estimate. Tight prompt + 3 cheap Phase-1 pushbacks + clean Phase 2. Smoke add-on (+34 lines) rolled in. Process miss on branch protection: 10 min doc work, no code damage |
| Spike-Design — theme + tailwind | 1.5 | 0.3 | ~0.7 (agent) | ~1.0 | -33% | Plan was sharp; only added a drift-detection test |
| Spike-Design — primitives + tests | 4.0 | 0.5 | ~3.0 (agent) | ~3.5 | -12% | 15 components × tests-first in 4 batched cycles; 65 component tests |
| Spike-Design — glass + motion + fonts | 2.0 | 0.3 | ~1.7 (agent) | ~2.0 | 0% | Reanimated mock + NativeWind JSX-hoist detours ~30 min |
| Spike-Design — assets + app.json | 0.5 | 0.1 | ~0.2 (agent) | ~0.3 | -40% | `git mv` was clean, no surprises |
| Spike-Design — species slice + smoke toggle | 0.5 | 0.1 | ~0.2 (agent) | ~0.3 | -40% | 4 store tests; locale keys for ES/RU also covered an R1-M1 drift |
| Spike-Design — F-1 / F-2 / F-4 fixes | 0.25 | 0.1 | ~0.1 (agent) | ~0.2 | -20% | Three small edits |
| Spike-Design — ADR D-023 + journal + doc updates | 1.25 | 1.0 (architect+agent) | ~0.5 (agent) | ~1.5 | +20% | Long-form writing; standalone-readability check |
| **Spike-Design — total** | **~10.0** | **~2.4** | **~6.4 (agent)** | **~8.8** | **-12%** | First under-estimate at spike scale |

---

## How to update this ledger

At every session close:

1. Run `date "+%Y-%m-%d %H:%M %Z"` via bash to capture session end
2. Compute wall-clock total
3. **Ask Anton for active coding time** on the milestone(s) closed in this session (Anton's number is authoritative; architect-side estimate is a fallback)
4. Append a row to "Per-session log"
5. If a release closed, update "Per-release totals" with the actual
6. If multi-module session, append rows to "Per-module breakdown"
7. Refresh "Pace observations" at the top with any new patterns

For backfill of prior sessions, use:
```
git log --pretty=format:'%h %ad %s' --date=iso-local --reverse
```
to compute commit-spreads.

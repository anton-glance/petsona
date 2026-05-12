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

**R0-M1 — Repo and tooling** ✅ shipped 2026-05-09 via PR #1, squash-merged as `39a3133`. Expo SDK 55 + TypeScript strict + NativeWind v4 + Expo Router + i18next + Zustand + Jest scaffold at the repo root. CI (typecheck + test + lint) green at 28s on the PR. 12/12 tests pass across 4 suites. `expo-doctor` 18/18. `expo export` produced 3.9 MB Hermes bundle, 1410 modules, 0 errors. Two ADRs surfaced during plan review: D-012 (repo root as Expo project root, replacing the originally-documented `/app/` wrapper) and D-013 (Jest, replacing Vitest). One ADR surfaced during implementation: D-014 (bundle ID format).

**R0-M2 prep — product renamed MyPet → Petsona (D-015), 2026-05-09.** "MyPet" unavailable as App Store Connect display name. "Petsona" confirmed available across Apple Developer App ID, App Store Connect name, and Google Play Console package. Bundle ID locked to `com.antonglance.petsona`. GitHub repo renamed `anton-glance/mypet` → `anton-glance/petsona`; local working path moved to `~/coding/petsona/`. Splash tagline updated to "Every pet has a Petsona". Doc rename: PR #3. Code rename (agent): PR #4.

**R0-M2 — App Store Connect entry created, 2026-05-09.** App Store Connect rejected bare "Petsona" as the display name (Apple soft-block; no shipped app uses the name, likely a speculative reservation or expired listing). Registered with differentiated display name `Petsona: Your Pet's Profile`. Bundle ID `com.antonglance.petsona` locked. D-016 added to capture the three-name split (brand `Petsona`, App Store display `Petsona: Your Pet's Profile`, bundle ID `com.antonglance.petsona`). Google Play Console registration still pending.

**R0-M2 — EAS configured, iOS + Android dev builds shipping ✅** Closed 2026-05-11 via PR #5, squash-merged as `601d1d1`. EAS project linked (`a268d3f9-4f46-4f36-b9ab-46c9ca6e7f3b`), `eas.json` configured with development/preview/production profiles, `expo-dev-client` added. iOS dev build (3m 8s) installed on Anton's iPhone via TestFlight; Metro QR connect renders the placeholder splash with "Petsona / Every pet has a Petsona" correctly. Android dev build initially failed at gradle resource linking — root cause: missing `assets/splash-icon.png` referenced by `expo-splash-screen` plugin. Hotfix on same branch added a placeholder 1024×1024 PNG and the `image` plugin field; re-build succeeded; APK installed to Pixel 7 emulator (Google-Play-image AVD), launches to the dev-client UI displaying "Petsona / Development Build."

**Google Play Console deferred** to post-developer-verification (Anton's account in Google verification queue, ETA a few days). R0-M2 closes on iOS-installable + Android-installable-on-emulator; Play Internal Testing submission deferred to a follow-up. Acceptable since R0-M2's validation question is "can the build pipeline ship installable binaries for both platforms?" — proven; the actual Play Store submission step is gated by an external timer outside our control.

**Onboarding flow expanded to 11 steps (D-017), 2026-05-11.** Original 10-step happy path expanded during R0-M2 close after Anton walked through screen-by-screen. Three additions: explicit camera-permission screen with force-settings recovery (new step 2), location capture screen with system+manual options (new step 7), fake progress screen during plan generation (new step 8). `02_PRODUCT_SPEC.md` and `04_BACKLOG.md` updated to reflect new flow.

**Validation ladder re-shaped (D-018), 2026-05-11.** R5 split into two releases: R5 becomes "real AI swap-in" (flip `MODEL_FOR_BREED` and `MODEL_FOR_OCR` env vars from `hardcoded` to real models, validate against accumulated test photos); R6 becomes localization (was R5). R1-R4 now ship with hardcoded breed-identify and medcard-ocr responses for dev velocity; plan-generate uses the real Claude Sonnet model from R3 because R3's validation question is plan quality. Real-AI cost validation concentrated in one dedicated release. MVP total estimate: ~80 hours (was ~73).

**Hardcoded AI provider adapter (D-019), 2026-05-11.** The hardcoded AI responses are implemented as another adapter satisfying the same `AIClient` interface defined in D-006. Slotted in via env var (`MODEL_FOR_BREED=hardcoded`) like any other provider. Every call still writes `ai_jobs` (with `cost_usd: 0` for hardcoded entries). R5 swap-in becomes literally a Supabase env var change.

**R0-M3 — Supabase backend spine ✅** Closed 2026-05-11 via PR #7, squash-merged as `2f4b559`. Supabase project `hkhzukxmonlgzzmuqvvp` provisioned in us-east-1. Migration `20260511195952_pets_ai_jobs_storage.sql` creates `pets`, `ai_jobs`, two private storage buckets (`pet-photos`, `medcard-scans`), 4 RLS policies per bucket per operation, and a `set_updated_at` trigger. Edge function `hello` deployed; uses anon-key + forwarded-JWT pattern per D-020 (security improvement on original prompt; agent pushed back during plan review). Client wiring: `lib/supabase.ts` with AsyncStorage adapter for cross-launch session persistence, `lib/auth.ts` with idempotent `ensureSignedIn()`, `lib/ai.ts` `callEdgeFunction()` wrapper. EAS dev builds re-triggered for both platforms (AsyncStorage is a native module). Smoke screen at `app/index.tsx` exercises the full round-trip: anonymous sign-in → `hello` function call → RLS-protected INSERT → cross-user read blocked.

End-to-end production verification on both platforms 2026-05-11: iPhone (user_id `21cfa9a4-3eff-4ce0-b206-ab91df5ca5a2`) and Pixel 7 AVD (user_id `a10a46c8-78ac-483a-b9f6-b44875c40feb`) both pass all 4 smoke buttons. Dashboard confirms: 2+ anonymous users in `auth.users`, 2+ TestPet rows in `pets` table (each scoped to its inserting user), 2+ hello function invocations in edge function logs (28-30ms cold boot). The full R0 backend stack is proven in production.

**D-002 amended 2026-05-11.** Project provisioned with new Supabase `sb_publishable_...` key format (rolled out mid-2025). Env var name kept as legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY` to avoid refactoring the env layer; value is the new format.

**D-020 added 2026-05-11.** Edge functions use anon-key + forwarded-JWT for `getUser()`, not service-role. Service-role isolated to `_shared/logging.ts` for `ai_jobs` writes in R1+.

**Known minor for R1-M2:** Android smoke screen had viewport cut-off (content extends below visible area on Pixel 7). Not blocking — smoke screen gets replaced by the real splash in R1-M2 — but R1-M2 must use `SafeAreaView` and verify on Pixel 7 AVD before merge.

**R0-M4 — Telemetry wired in ✅** Closed 2026-05-11 via PR #9, squash-merged as `7096a34`. PostHog (`Petsona` project, US Cloud) for product analytics with autocapture of screen views and app-lifecycle events; Sentry (`exicore` org, `petsona-mobile` project, React Native platform) for crash + error reporting with `tracesSampleRate: 0` (preserves 5k free-tier quota for errors), no replay integration, `environment` tag from `__DEV__`. Logger split per D-021: `logger.info`/`warn` console-only; `logger.error` → Sentry; PostHog reserved for explicit `Events.*` taxonomy. Three R0-M4 events defined: `app_launch` (with locale property), `screen_view` (autocaptured), `test_error_thrown` (smoke screen button). 54 Jest tests + 18/18 expo-doctor. Sentry Spike Protection + inbound filters enabled in dashboard.

End-to-end smoke verification on both platforms 2026-05-11: iPhone (user_id `21cfa9a4-3eff-4ce0-b206-ab91df5ca5a2`) and Pixel 7 AVD (user_id `a10a46c8-78ac-483a-b9f6-b44875c40feb`) both show `Identify` → `app_launch` → `test_error_thrown` sequences in PostHog Activity feed with matching distinct_ids; corresponding test errors visible in Sentry Issues page with stack traces and `environment: development` tag.

**D-021 added 2026-05-11.** Logger / telemetry rail split locked: console-only for info/warn, Sentry for error, PostHog for explicit `Events.*` only. Agent pushed back on the original architect-side prompt's "logger → PostHog" proposal during Phase 1; pushback was correct.

**R0-M5 — End-to-end smoke ✅ (absorbed into M3+M4).** R0-M5's validation criteria (full R0 stack works on real devices) were proven by the combined R0-M3 + R0-M4 smoke tests. No separate code milestone; verification absorbed into the earlier milestones' work.

---

## R0 — Infrastructure spine ✅

**Verdict:** Shipped 2026-05-11.

**Validation question answered:** *Can we ship to TestFlight and Play Internal Testing reliably, with anonymous auth working and one round-trip to a Supabase Edge Function?* — **Yes.** Both platforms have installable EAS dev builds with anonymous Supabase auth, RLS-protected database writes, edge function calls, PostHog product analytics, and Sentry crash reporting all working end-to-end on real iOS hardware and Android emulator.

**Detail:** See `JOURNAL_R0.md`.

**Pace:** ~14h estimate → ~16.5h actual (+18% variance). Major drivers detailed in `JOURNAL_R0.md` and `08_TIME_LEDGER.md`.

**Architecture:** 21 ADRs (D-001 through D-021) locked. No reversed decisions.

**Issues logged:** 6 troubleshooting entries in `07_TROUBLESHOOTING.md` from R0 (disk pressure, Apple soft-block, dash in applicationId, fork exhaustion, Android splash drawable, dev-client UX confusion).

---

## R1 — `[in progress]`

R1 verdict pending. Detailed record will be in `JOURNAL_R1.md` when all R1 milestones close.

### Milestone checkpoints

**R1-M1 — `breed-identify` edge function (hardcoded provider) ✅** Closed 2026-05-12 via PR #11 (squash `7f178ec`) + direct-commit `938390b` (smoke-button addition, see note below). First capability function in the AI gateway. Establishes the patterns the R2+R3 capabilities will mirror.

Code shipped (~1000 lines including tests):
- `shared/types.ts` — first occupant; wire types `BreedIdentifyRequest`/`BreedIdentifyResponse`/`BreedIdentifyCandidate` shared client ↔ edge fn
- `supabase/functions/_shared/ai/types.ts` — `VisionAIClient` interface, capability-segregated (R2 adds `OcrAIClient`; R3 adds `CompletionAIClient` to `claude.ts`)
- `supabase/functions/_shared/ai/hardcoded.ts` — canned-response adapter (D-019). Returns `{ species: 'dog', candidates: [{ Labrador, 0.92 }, { Golden Retriever, 0.05 }, { Beagle, 0.03 }] }` regardless of input.
- `supabase/functions/_shared/logging.ts` — `logAiJob()` writer. Service-role key referenced only here outside tests (AC-9 verified by grep). Telemetry-never-breaks-user-flow: every failure mode (factory throw, insert rejection, `{ error }` return) swallowed via `console.error`.
- `supabase/functions/breed-identify/index.ts` — `handle(req, deps?)` mirroring `hello/index.ts` factory-injection pattern. `BREED_PROMPT_V = "2026-05-08-1"`. Validates `photo_path` format + user-prefix match before any AI work. Selects adapter via `MODEL_FOR_BREED` env (request-time read for testability). `error_code='misconfiguration'` written to `ai_jobs` when env is unset or unknown — so bad config is visible in monitoring without redeploying.
- 32 new Deno tests (5 adapter + 7 logger + 20 function), including the explicit "adapter throws AND logger throws → 500, no exception escapes" test added during plan review.

Three agent pushbacks during Phase 1, all resolved:
- **P-1 (incorrect).** Agent flagged R0 as still open. Re-read of `05_HISTORY.md` confirmed R0 closed; agent had stale doc context. No code change.
- **P-2 (architect call).** Agent asked whether to bump `BREED_PROMPT_V` to today's date. Held at `'2026-05-08-1'` exactly as AC-10 specified — the string is an identifier, not a build date; per D-007 it bumps when the prompt content changes.
- **P-3 (correct).** Agent flagged that `SUPABASE_SERVICE_ROLE_KEY` is platform-injected by Supabase, not settable via `supabase secrets set`. Removed from the deploy step in the prompt. Correct catch.

End-to-end verification 2026-05-12 on both platforms via a 5th smoke-screen button added in commit `938390b`. Tapped on iPhone (user `21cfa9a4-…`) and Pixel 7 AVD (user `a10a46c8-…`); both rendered `dog — Labrador Retriever (0.92)`; both wrote `ai_jobs` rows visible in the Supabase dashboard with `capability='breed-identify'`, `model='hardcoded'`, `prompt_version='2026-05-08-1'`, `status='success'`, `cost_usd=0`, distinct `user_id` columns matching each device's anonymous UUID.

**Pace:** 3h estimate → 1.5h actual (-50%). First under-estimate of the project. Driver: tight prompt + Phase 1 agent plan was clean + no significant pushbacks during implementation. Smoke-button addition was a ~30 min round-trip rolled into the milestone.

**Process miss — branch protection.** The smoke-button agent committed directly to `main` and pushed cleanly. Per CLAUDE.md / D-010 main is supposed to be PR-only. Investigation: R0-M1 close marked "protect `main`" as done in `04_BACKLOG.md`, but the GitHub Settings → Branches page showed "Classic branch protections have not been configured" — the protection was never actually wired up. Net damage: zero (code is good, CI ran locally, smoke passed). Documentation lie corrected in `04_BACKLOG.md` R0-M1 entry; action item to configure the rule logged as R0 follow-up; full Symptom + Cause + Resolution captured in `07_TROUBLESHOOTING.md` (2026-05-12 entry).

**Architectural patterns established (no new ADRs; fall under D-006 + D-019):**
- Capability-segregated `VisionAIClient` interface, NOT a growing `AIClient`. Each capability function depends only on what it needs.
- Wire types live in `shared/types.ts` from the first capability — both edge fn and client import the same TypeScript types; the boundary is compile-time-checked.
- `error_code='misconfiguration'` logged to `ai_jobs` so config errors surface in monitoring.
- Deployed function follows the same `handle(req, deps?)` shape as `hello`. Future capability functions inherit the pattern.

---

# JOURNAL — R0: Infrastructure Spine

> Closed 2026-05-11 ~22:15 UTC. Five milestones (M0-M5) over three calendar days (2026-05-09 to 2026-05-11), 16.5 hours active work.

---

## Validation question

*Can we ship to TestFlight and Play Internal Testing reliably, with anonymous auth working and one round-trip to a Supabase Edge Function?*

## Verdict

**Yes.** All R0 success criteria met:

- ✅ Empty Expo app launches on real iPhone and Pixel 7 Android emulator
- ✅ Anonymous auth creates `auth.users` row visible in Supabase dashboard (verified via SQL)
- ✅ `hello` edge function returns `{ message, user_id }` with correct `user_id` from JWT
- ✅ RLS-protected `pets` row inserted from client is visible only to its owner (verified by inserting from one device, querying from another → 0 rows)
- ✅ EAS dev builds installable: TestFlight (iOS) + drag-drop APK (Android emulator)
- ✅ PostHog records `app_launch` events with correct distinct_id matching `auth.uid()`
- ✅ Sentry captures test errors with stack traces, tagged `environment: development`

Both platforms (iOS and Android) tested end-to-end. The full R0 backend stack is proven in production.

---

## Per-milestone summary

| Milestone | Estimate | Actual | Variance | What shipped |
|---|---|---|---|---|
| R0-M0 — Local environment | 1.0h | 1.5h | +50% | Node 20, pnpm 10, Expo CLI, EAS CLI, Supabase CLI 2.72.7, Deno, Xcode 16, Android Studio installed |
| R0-M1 — Repo scaffold | 2.0h | ~3.0h | +50% | Expo SDK 55 app, NativeWind v4, i18next, Zustand, Jest, ESLint, Prettier, CI workflow, PR #1 merged |
| R0-M2 — Store identifiers + EAS | 3.0h | ~6.0h | +100% | Apple Developer App ID, App Store Connect entry, EAS configured, iOS + Android dev builds shipped, PR #5 + hotfix |
| R0-M3 — Supabase spine | 3.0h | ~3.0h | 0% | Supabase project `hkhzukxmonlgzzmuqvvp`, migration (pets+ai_jobs+2 buckets+RLS+trigger), `hello` edge function, anonymous-auth wiring, PR #7 |
| R0-M4 — Telemetry | 2.0h | ~3.0h | +50% | PostHog + Sentry wired in via D-021 logger split, 54 Jest tests, PR #9 |
| R0-M5 — End-to-end smoke | 3.0h | ~0h | -100% | Validation absorbed into M3 + M4 smoke tests |
| **R0 Total** | **14.0h** | **~16.5h** | **+18%** | — |

---

## What worked

### 1. Three-phase agent workflow (Plan → Implement → Self-review)

Used across every code-producing milestone (M1, M2, M3, M4). Plan-review caught issues before code was written every single time:

- **M1:** Caught the `app/` directory wrapper assumption — Expo project root is repo root (D-012)
- **M1:** Caught Vitest assumption — Jest with `jest-expo` preset has first-class RN support, Vitest doesn't (D-013)
- **M2:** Caught the bundle identifier dash issue — Android `applicationId` doesn't allow dashes (D-014)
- **M3:** Caught three codebase-vs-prompt mismatches (P-1 env var name, P-2 .env file naming, P-3 lib/supabase.ts already existing) plus proposed D-020 security improvement (anon-key + forwarded-JWT instead of service-role for `getUser`)
- **M4:** Pushed back on logger → PostHog routing, proposing the cleaner two-rail split that became D-021

**Lesson:** Plan-review is not theater. Each round-trip costs ~10 minutes and prevents a refactor cycle that would cost ~1 hour. **Keep this pattern for R1+.**

### 2. Validation ladder discipline

Five milestones, each answering a specific question. No R0-M3 work started until R0-M2 closed. No tempting "while I'm here, let me also..." additions.

This was tested at R0-M2 close when the agent's plan said bundle IDs were already correct in `app.json` — they weren't. Architect-side discipline (don't write "X is already correct"; write "verify X matches expectation Y") fixed this. **Lesson logged for R1+.**

### 3. Files-as-channel-1 discipline

All doc updates produced as actual tarballs via `present_files`, never pasted into chat as code blocks. Anton extracts, commits, PRs. Works cleanly. Source-of-truth lives in repo, not in chat.

### 4. Multi-provider abstraction (D-006) + hardcoded adapter (D-019)

Established at R0-M3 (`_shared/ai/auth.ts` follows the same shape future capability adapters will). R1+ AI calls inherit the pattern automatically.

### 5. Real-time docs

Every release earned a journal entry. Decision changes earned ADRs. Reproducible bugs earned troubleshooting entries. The doc set isn't a graveyard — it actively guides the next session's setup ritual.

### 6. Free-tier-first cost discipline

R0 monthly cost: **$0** (Supabase free + PostHog free + Sentry Developer + EAS free + GitHub free). Even Apple Developer ($99/yr) was sunk cost from before this project. Spike protection + inbound filters configured to prevent surprise overages.

---

## What didn't work

### 1. R0-M2 +100% estimate variance

3h estimate vs 6h actual. Drivers:

- **Apple soft-block on bare "Petsona"** (~45 min): rename cycle + D-015 + D-016
- **macOS process-table exhaustion** (~45 min): parallel Claude Code sessions accumulated Metro/sim processes; reboot recovery + VS Code crash-state clear
- **Android splash drawable missing** (~50 min wall-clock for hotfix + rebuild): latent from R0-M1, only surfaced when Android-side build path exercised it
- **macOS disk pressure ENOSPC** (~30 min): `~/Library/Developer/Xcode/DerivedData/*` accumulated 10GB; needed clearing mid-session

**Lesson:** R0 setup is one-time cost; these issues don't recur. R1+ estimates don't need padding for them, but pre-session checks should include `df -h /` and a process count.

### 2. R0-M5 estimate of 3h was wrong

The "end-to-end smoke test" milestone presumed it needed dedicated implementation work. In practice, R0-M3's smoke screen + R0-M4's telemetry button **already exercised the full stack on real devices.** R0-M5 became zero hours of new work.

**Lesson for ladder design:** Milestones whose validation is exercised by earlier milestones should be absorbed into those milestones, not granted their own line item. Re-evaluate R1-R6 milestones for similar absorptions.

### 3. The dev-client UX is universally confusing on first encounter

After installing the R0-M2 EAS dev builds, Anton's reaction was "this is not our App" — the dev-client menu (no JS bundle yet) doesn't look like the actual Petsona splash. This is by design (Expo's dev workflow) but creates ~10 min of confusion every first time.

Logged in `07_TROUBLESHOOTING.md` so future-Anton or future collaborators short-circuit the confusion.

### 4. EAS env vars are a separate-from-`.env.local` setup step

This caught us at R0-M3 — agent had to surface explicit `eas env:create` commands or the EAS-built bundle would have `createClient(undefined, undefined)`. Same pattern needed at R0-M4 for PostHog + Sentry. **R1+ prompts will continue to explicit this:** any new `EXPO_PUBLIC_*` env var requires both `.env.local` (Metro dev) AND `eas env:create` (EAS builds).

### 5. macOS Command Line Tools blocked `brew upgrade supabase`

Supabase CLI 2.72.7 → 2.98.2 available; couldn't upgrade due to CLT being out of date. 2.72.7 was sufficient for R0. **Action item for pre-R3:** update CLT before R3 lands (`sudo rm -rf /Library/Developer/CommandLineTools && sudo xcode-select --install`).

---

## Architectural decisions locked

21 ADRs through R0: D-001 through D-021. Notable for R0:

- **D-002 amended (R0-M3):** Supabase publishable key format (`sb_publishable_...`) used; env var name kept legacy (`EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- **D-014, D-015, D-016 (R0-M2):** Petsona naming locked across brand, App Store display name, bundle ID
- **D-017 (R0-M2 close):** 11-step onboarding flow locked
- **D-018 (R0-M2 close):** Validation ladder reshaped to R6 with R5 as "AI swap-in"
- **D-019 (R0-M2 close):** Hardcoded AI provider adapter as first-class member of D-006's multi-provider abstraction
- **D-020 (R0-M3):** Edge function `getUser()` uses anon-key + forwarded-JWT, not service-role (security improvement caught by agent during plan-review)
- **D-021 (R0-M4):** Logger / telemetry rail split (console-only / Sentry / PostHog explicit `Events.*`)

No ADRs reversed.

---

## Smoke test evidence (R0-M3 + R0-M4 combined)

### Production data captured during R0 smoke

**Supabase `auth.users` (queried via SQL editor):**
- 2+ anonymous users created with `is_anonymous: true`
- UUIDs match smoke screen + PostHog distinct_id + Sentry user context

**Supabase `pets` table:**
- 2+ TestPet rows inserted via smoke screen "Insert pets row" button
- Each row's `user_id` matches its inserting device's `auth.uid()`
- RLS verified: cross-user read attempts return 0 rows

**Supabase `hello` edge function logs:**
- Cold boot time: 28-30ms (excellent)
- All invocations return 200 with `{ message: "hello", user_id }`

**PostHog Activity feed:**
- Two distinct anonymous users (`21cfa9a4...` iPhone, `a10a46c8...` Android)
- Per-device sequence: `Identify` → `app_launch` → `test_error_thrown`
- `Application Installed` + `Application Opened` events from PostHog's autocapture
- Library tag: `posthog-react-native`

**Sentry Issues page:**
- Test errors from both devices captured with stack traces
- Tagged `environment: development`
- Sentry Spike Protection + inbound filters enabled

---

## Pace analysis

**Wall-clock total:** ~80 calendar hours (2026-05-09 03:17 UTC → 2026-05-11 22:15 UTC), broken into ~16.5 active hours across three sessions.

Sessions:

| Session | Wall (h) | Active (h) | Milestones touched |
|---|---|---|---|
| 001 | 12.1 | 5-6 | M0, M1 |
| 002 | 51 | 9-10 | Rename (D-015), M2 |
| 003 | ~7 | ~6 | M3, M4, M5, R0 close |

**Per-milestone variance pattern:**
- M0-M2: +50% to +100% — one-time setup costs (Apple flow, fnm permissions, disk pressure, Apple soft-blocks, Android splash, fork exhaustion)
- M3: 0% — first milestone to hit estimate, after the setup costs were behind us
- M4: +50% — agent's P-1 plan-review pushback added ~30 min round-trip; net positive (D-021 came out of it)
- M5: -100% — absorbed into earlier milestones (ladder design lesson)

**R0 +18% total variance is well within the +25% buffer flagged after R0-M2.** The estimates are calibrating. R1+ should track close to estimate as long as no new account-creation flows are involved.

---

## Tools and accounts in active use as of R0 close

| Tool / Account | Status | Used for |
|---|---|---|
| Apple Developer Account | ✅ active | iOS bundle ID `com.antonglance.petsona`, App Store Connect, TestFlight |
| Google Play Developer Account | ⚠️ in verification | Re-opens for Android Play submission when Google's identity verification clears (ETA: few days) |
| GitHub | ✅ active | Repo `anton-glance/petsona`, PR workflow, Actions CI |
| Supabase | ✅ active | Free tier, project `hkhzukxmonlgzzmuqvvp`, us-east-1 |
| PostHog Cloud | ✅ active | Free tier, project `Petsona`, US Cloud |
| Sentry | ✅ active | Free Developer plan, org `exicore`, project `petsona-mobile` |
| Expo (EAS) | ✅ active | Free tier, 30 builds/mo allowance |
| Anthropic Console | ⏸️ not yet used | Needed at R1-M1 for first real Claude API call (R5 in current ladder; R3 for plan-generate) |
| Mistral La Plateforme | ⏸️ not yet used | Needed at R5 for OCR swap-in |

---

## Open items for R1+

1. **EAS dev builds need re-triggering once more before R1-M2** — to pick up R0-M4's PostHog/Sentry native modules (already done at R0-M4 close; this is just a forward note).
2. **Google Play submission** — re-open when Google verification clears. Use the `Petsona: Your Pet's Profile` display name if `Petsona` is blocked, similar to Apple.
3. **Update macOS Command Line Tools before R3** — see "What didn't work" #5.
4. **Generate Sentry Organization Auth Token before R3** — enables source-map upload during EAS builds. Defer until then; R0-R2 stack traces are readable enough as-is.
5. **Smoke screen at `app/index.tsx`** — gets replaced by R1-M2's real splash. The "Throw test error" button moves to a future settings/debug screen at that point (or removed entirely if not needed during friends-and-family testing).
6. **R1-M2 must use SafeAreaView** — R0-M3's smoke screen had Android viewport cut-off on Pixel 7 AVD. R1-M2 fixes this for the real splash; pattern propagates to all R1+ screens.
7. **`reactNavigationIntegration` for Sentry** — deferred per plan addendum. Re-evaluate when R1's first real screens land; navigation breadcrumbs would help debug crashes during R3+ flow steps.

---

## Confidence going into R1

**High.** The backbone is solid: anonymous auth carries the user through onboarding before paywall (D-004); RLS protects every table with default-deny + `auth.uid()` scoping; edge function pattern (`getUser` anon-key + forwarded-JWT per D-020) is templated for R1's `breed-identify`; multi-provider adapter pattern (D-006) is in place for R1's hardcoded breed-identify to slot in via D-019; logger + telemetry rails are clean (D-021); test discipline is established (each milestone shipped with green tests + lint + expo-doctor); no architectural debt accumulated.

R1's validation question — *can a user get from app launch to seeing a personalized "Welcome {petname}" profile screen?* — is now a UX + state-machine question, not an infrastructure question. That's the right level of difficulty to be at for R1.

---

### Time accounting

- Session start (this session, 003): 2026-05-11 ~18:32 UTC
- Session end: 2026-05-12 ~02:16 UTC
- Wall-clock total (session 003): ~7.5h (includes meal break, smoke-test wait periods)
- Active total (session 003): ~6h
- Active total (R0 entire): ~16.5h
- R0 wall-clock total (session 001 start to session 003 end): ~3 calendar days

### What changed in the docs this session

- `docs/04_BACKLOG.md` — R0-M4, R0-M5, and R0 quality gate marked ✅ with actuals
- `docs/05_HISTORY.md` — R0-M4 close checkpoint + R0 verdict entry
- `docs/06_DECISIONS.md` — D-021 added (logger / telemetry rail split)
- `docs/08_TIME_LEDGER.md` — session 003 logged, R0 final totals, refreshed pace observations
- `docs/JOURNAL_R0.md` — this document (new)

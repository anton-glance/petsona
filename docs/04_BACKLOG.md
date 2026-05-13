# 04 — Backlog

> Forward-looking work queue. R0–R6 validation ladder per D-018. Each release answers one question; no R(N+1) starts until R(N) earns a verdict.

---

## How this document works

- **Releases (R0–R6)** are the validation rungs.
- **Milestones (R0-M1, R0-M2, …)** are the work units inside a release.
- **Quality gates** sit between releases. Anton tests end-to-end per the Test Plan; both Anton and Claude.ai must be comfortable proceeding.
- Estimates are wall-clock hours. Actuals tracked in `08_TIME_LEDGER.md`.

---

## R0 — Infrastructure spine

**Validation question:** *Can we ship to TestFlight and Play Internal Testing reliably, with anonymous auth working and one round-trip to a Supabase Edge Function?*

**Why this is R0:** every later release assumes this works. Failing here cheaply is much better than failing here at R3 with a paywall to debug.

**Definition of done:**
- An empty Expo app launches on real iOS and real Android device
- Anonymous auth creates an `auth.users` row visible in Supabase
- A "Hello" edge function returns `{ message, user_id }` with the correct `user_id` from the JWT
- An RLS-protected `pets` row inserted from the client is visible only to its owner
- TestFlight build + Play Internal Testing build are installable from the respective beta links
- PostHog records the app launch event; Sentry catches an intentionally-thrown test error

### Milestones

#### R0-M0 — Local environment (Anton) ✅ shipped 2026-05-09
- [x] Install Node 20 LTS via `fnm` (`.node-version` pins it per-project)
- [x] pnpm 10.x installed
- [x] Expo CLI not installed globally (modern Expo uses `npx`; `npx expo` and `npx create-expo-app` are the canonical entry points)
- [x] EAS CLI 18.11.0 installed globally
- [x] Supabase CLI installed (currently 2.72.7; upgrade to 2.98.x deferred — see "Known issues" below)
- [x] Deno 2.7.14 installed
- [x] Xcode 16+ verified (`xcode-select -p`)
- [x] Android Studio installed (emulator only; not used for daily work per D-001)
- [x] `~/coding/petsona/` exists

**Known issues from R0-M0** (track for later):
- macOS Command Line Tools out of date (CLT for Xcode 26.3 needed). Blocks `brew upgrade supabase`. Not blocking until R0-M3 (Supabase project setup). Fix before R0-M3: `sudo rm -rf /Library/Developer/CommandLineTools && sudo xcode-select --install`.
- `~/.local/state` was owned by `root` from a prior gem install; reclaimed via `sudo chown`. Captured here in case fnm or another tool surfaces a similar permission issue.

**Estimate:** 1h. **Actual: ~1.5h** (toolchain debug for fnm/state-dir permissions + Node-25-vs-Node-20 cleanup).

#### R0-M1 — Repo and tooling ✅ shipped 2026-05-09 (PR #1, squash `39a3133`)
- [x] Confirm GitHub repo `anton-glance/petsona` exists and is empty (public)
- [x] Clone to `~/coding/petsona/`
- [x] Run `npx create-expo-app@latest --template default-typescript` *(skipped — agent scaffolded directly with the correct deps; equivalent outcome)*
- [x] Initialize: NativeWind v4, Expo Router, i18next, Zustand, ESLint, Prettier, Jest with `jest-expo` preset
- [x] Add a `.gitignore` that excludes `.env*`, `node_modules`, `.expo`, `dist`, build artifacts, and any local `*-key.json` files
- [x] Add the doc set to `docs/` (already on `main` from the project-start session)
- [x] Add `CLAUDE.md` to repo root (already present)
- [x] Add `.github/workflows/ci.yml` running typecheck + test + lint on PR
- [x] First commit on `main`
- [ ] ~~Protect `main` (require PR + passing CI)~~ — **R0-M1 documentation lie discovered 2026-05-12 during R1-M1 close.** GitHub Settings → Branches showed "Classic branch protections have not been configured." Item moved to **R0 follow-up below**. Logged in `07_TROUBLESHOOTING.md` (2026-05-12 entry).

**Estimate:** 2h. **Actual: ~3h** (agent implementation + plan-review round-trip + CI fix commit + disk-pressure recovery).

#### R0-M2 — Store identifiers and EAS ✅ shipped 2026-05-11
- [x] Apple Developer: register App ID `com.antonglance.petsona`
- [x] App Store Connect: create the iOS app entry — display name registered as `Petsona: Your Pet's Profile` per D-016 (bare "Petsona" Apple-soft-blocked)
- [ ] Google Play Console: create the Android app entry — **deferred** (Anton's developer account in Google verification queue; ETA a few days). Re-opens when verification clears.
- [x] `eas init` to link the repo to EAS (project ID `a268d3f9-4f46-4f36-b9ab-46c9ca6e7f3b`)
- [x] `eas build:configure` (creates `eas.json` with development/preview/production profiles per D-006 forward-compatibility)
- [x] `eas build --profile development --platform ios` — built (3m 8s) and installed on Anton's iPhone; Metro QR connect renders the placeholder splash
- [x] `eas build --profile development --platform android` — initially failed (missing `assets/splash-icon.png`); hotfixed with placeholder PNG on same branch; built and installed on Pixel 7 AVD (Google Play emulator image)
- [ ] Submit a placeholder build to TestFlight; submit to Play Internal Testing track — **deferred** (Play submit gated on Google verification; TestFlight submit deferred to closer to R4 when friends-and-family testing starts)

**Estimate:** 3h. **Actual: ~6h** spread over 2 days.

#### R0-M3 — Supabase project ✅ shipped 2026-05-11
- [x] Create Supabase project (free tier, region: AWS US-East — `hkhzukxmonlgzzmuqvvp`)
- [x] `supabase init` in repo
- [x] First migration: `pets` + `ai_jobs` + 2 storage buckets (`pet-photos`, `medcard-scans`) + RLS policies (default-deny, scoped to `auth.uid()`) + `set_updated_at` trigger
- [x] First edge function: `_shared/auth.ts` (`getUser` helper using anon-key + forwarded-JWT pattern per D-020), `_shared/cors.ts`, `hello/index.ts` (returns `{ message, user_id }`)
- [x] Deploy: `supabase db push`, `supabase functions deploy hello`
- [ ] Configure Apple sign-in provider, Google sign-in provider (credentials only — flow wired in R4) — **deferred to R4-M1** where the full sign-in flow lands
- [x] Confirm anonymous sign-in is enabled (toggled in dashboard 2026-05-11)
- [x] Client-side wiring: `lib/supabase.ts` with AsyncStorage adapter, `lib/auth.ts` idempotent `ensureSignedIn()`, `lib/ai.ts` `callEdgeFunction()` wrapper
- [x] Smoke screen at `app/index.tsx` validates: anon sign-in → hello function round-trip → RLS-protected INSERT → cross-user read blocked
- [x] EAS env vars set for `EXPO_PUBLIC_SUPABASE_URL` (plain text) and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (sensitive)
- [x] EAS dev builds re-triggered, installed on iPhone + Pixel 7 AVD, all 4 smoke buttons pass on both platforms

**Estimate:** 3h. **Actual: ~3h**.

#### R0-M4 — Telemetry ✅ shipped 2026-05-11
- [x] PostHog account, project `Petsona` (US Cloud) created
- [x] Sentry account, organization `exicore`, project `petsona-mobile` (React Native platform) created
- [x] Install `posthog-react-native` (+ peer deps `expo-file-system`, `expo-application`, `expo-device`, `expo-localization`)
- [x] Install `@sentry/react-native` with Expo config plugin in `app.json` (`organization: exicore`, `project: petsona-mobile`)
- [x] Wire up: `app_launch` event with locale property, autocapture of screen views, `identify(userId)` after anon sign-in, `test_error_thrown` event + Sentry capture on smoke screen button
- [x] Logger split per D-021: `logger.info`/`warn` console-only, `logger.error` routes to Sentry; PostHog reserved for explicit `Events.*` taxonomy
- [x] Sentry config: `tracesSampleRate: 0`, `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 0`, `beforeSend` drops stackless events, `environment: __DEV__ ? 'development' : 'production'`, empty `integrations: []` (no replay)
- [x] PostHog config: US host, `disableSessionRecording: true`, `captureAppLifecycleEvents: true`, `flushAt: 1` in `__DEV__`
- [x] Sentry Spike Protection + inbound filters enabled in dashboard
- [x] EAS env vars: `EXPO_PUBLIC_POSTHOG_API_KEY` (sensitive), `EXPO_PUBLIC_SENTRY_DSN` (sensitive)
- [x] EAS dev builds re-triggered for both platforms; installed and verified on iPhone + Pixel 7 AVD
- [x] PostHog Activity feed shows `Identify` → `app_launch` → `test_error_thrown` events from both devices
- [x] Sentry Issues page shows test errors from both devices, tagged `environment: development`
- [ ] Source-map upload via `SENTRY_AUTH_TOKEN` — **deferred to R3** (errors flow without it; stack traces are minified but readable for current test cases)

**Estimate:** 2h. **Actual: ~3h**.

#### R0-M5 — End-to-end smoke test ✅ shipped 2026-05-11 (absorbed into M3+M4)
- [x] Splash placeholder + smoke screen exercises the full R0 stack
- [x] On launch: anonymous sign-in fires; `auth.uid()` displayed on smoke screen
- [x] "Hello function" button + "Insert pets row" + "Cross-user read" buttons all pass
- [x] EAS dev builds installed on iPhone + Pixel 7 AVD across both R0-M3 and R0-M4 rebuilds

**Estimate:** 3h. **Actual: ~0h** (absorbed).

### R0 quality gate ✅
- [x] All R0 milestones checked (with exceptions logged in `JOURNAL_R0.md`)
- [x] `JOURNAL_R0.md` written with verdict + lessons + actuals
- [x] `05_HISTORY.md` updated
- [x] `08_TIME_LEDGER.md` updated with R0 actuals vs estimate
- [x] Both Anton and Claude.ai comfortable proceeding to R1

**R0 estimate total:** ~14 hours. **Actual: ~16.5 hours** (+18%). Detailed breakdown in `JOURNAL_R0.md` + `08_TIME_LEDGER.md`.

### R0 follow-up items (not gating any release)

These leaked out of R0 close. Captured here so they're not lost. Should clear before R2 ships.

- [ ] **Configure GitHub branch protection rule for `main`.** R0-M1 close marked this done but it wasn't actually wired up — discovered 2026-05-12 when the R1-M1 agent's commit pushed cleanly to main via direct push. Required settings: Settings → Branches → Add classic branch protection rule (or ruleset) for `main` → require pull request before merging, require status checks (CI typecheck/test/lint) before merging, include administrators. Documented in `07_TROUBLESHOOTING.md`. **Estimate: 5 min Anton-side, browser-only.**
- [ ] **Submit a placeholder build to TestFlight + Play Internal Testing** (originally R0-M2). Gated on Google Play verification clearing; TestFlight is unblocked but deferred to closer to R4 friends-and-family testing.
- [ ] **kidem42 contributor onboarding.** Per D-022. One-time setup (Anton clicks): (a) add kidem42 as repo collaborator at https://github.com/anton-glance/petsona/settings/access, (b) toggle "Require review from Code Owners" in the main-protection ruleset, (c) invite kidem42 to Supabase project hkhzukxmonlgzzmuqvvp as member, (d) add kidem42 to the EAS team, (e) add kidem42 to Apple Developer team (after kidem42 has an Apple Developer account), (f) add kidem42 to Google Play Console once Anton's account clears Google verification, (g) invite to PostHog project Petsona, (h) invite to Sentry org exicore. Estimate: 20-30 min total once kidem42's accounts are ready.

---

## R1 — Splash, camera, pet face capture, "Welcome {petname}" (hardcoded breed-ID)

**Validation question:** *Can a user go from app launch to seeing a personalized "Welcome {petname}" profile screen?*

**Flow steps covered:** 1 (splash + Get Started), 2 (camera permission + force-settings), 3 (pet face capture), 5 (AI-extracted profile screen — partial; merged with R2 documents data in R2).

**Definition of done:**
- Splash screen with [Get Started] button renders the Petsona brand
- Camera permission screen explains why; on deny, force-settings recovery screen prevents progression until user grants permission via iOS/Android Settings
- Photo capture screen (camera + gallery access) returns a usable image
- Hardcoded `breed-identify` edge function (D-019) returns canned `{ species: "dog", breed: "Labrador Retriever", confidence: 0.92, candidates: [...] }` regardless of input image
- "Welcome {petname}" screen displays the extracted profile (name, breed, species) with all fields editable; user confirms or edits
- Result persists to `pets` for the anonymous user
- Cost-per-call logged in `ai_jobs` (`cost_usd: 0` for hardcoded entries per D-019)
- `JOURNAL_R1.md` records UX test results across at least 5 onboarding runs

### Milestones

#### R1-M1 — `breed-identify` edge function (hardcoded provider) ✅ shipped 2026-05-12 [agent]
- [x] `supabase/functions/_shared/ai/types.ts` — `VisionAIClient` interface, capability-segregated per D-006 (no growing `AIClient`)
- [x] `supabase/functions/_shared/ai/hardcoded.ts` — `VisionAIClient` adapter returning canned `Labrador / Golden / Beagle` payload (D-019)
- [x] `supabase/functions/_shared/logging.ts` — `ai_jobs` writer; service-role key referenced only in this file (AC-9); telemetry-never-breaks-user-flow (swallows all failures via `console.error`)
- [x] `supabase/functions/breed-identify/index.ts` — accepts `{ photo_path }`; validates format + user-prefix; selects adapter via `MODEL_FOR_BREED` (request-time); writes `ai_jobs` row on success and every error path
- [x] `BREED_PROMPT_V = "2026-05-08-1"` constant exported, flows into every `ai_jobs.prompt_version` write
- [x] Deno tests for the adapter (5), the logger (7), and the function (20). 32 new Deno tests; full suite at 40 (incl. 8 prior hello + auth tests)
- [x] `ai_jobs` table confirmed from R0-M3 migration (no new migration)
- [x] `shared/types.ts` first-occupant — `BreedIdentifyRequest` / `BreedIdentifyResponse` / `BreedIdentifyCandidate`; client (R1-M3) imports the same types the function returns
- [x] PR #11 merged as squash `7f178ec`; deployed via `supabase functions deploy breed-identify`; `MODEL_FOR_BREED=hardcoded` set
- [x] Smoke-screen verification button added (`feat(smoke): add breed-identify button to R0 smoke screen`, commit `938390b`) — calls the edge function from the client and renders `dog — Labrador Retriever (0.92)` on success
- [x] End-to-end verification 2026-05-12: button tapped on iPhone (user `21cfa9a4-…`) and Pixel 7 AVD (user `a10a46c8-…`); both rendered the canned payload; both wrote `ai_jobs` rows visible in the Supabase dashboard with `capability='breed-identify'`, `model='hardcoded'`, `prompt_version='2026-05-08-1'`, `status='success'`, `cost_usd=0`

**Estimate:** 3h. **Actual: ~1.5h** (-50%). First under-estimate of the project. Drivers: tight prompt → fast Phase 1 agent plan → no significant pushbacks during implementation; smoke-button addition was a ~30 min round-trip rolled into the same milestone. One process miss surfaced (agent committed to main; branch protection was never enforced from R0-M1) — captured in `07_TROUBLESHOOTING.md`, no code damage.

**Architectural notes from R1-M1** (no new ADRs; falls under D-006 + D-019):
- Capability-segregated interfaces (one interface per capability — `VisionAIClient` now, `OcrAIClient` at R2-M1, `CompletionAIClient` at R3) rather than a single growing `AIClient`. Adapters implement whichever subsets they support.
- `error_code = 'misconfiguration'` is logged to `ai_jobs` when `MODEL_FOR_BREED` is unset or unknown. The bad config is visible in monitoring without redeploying. R5 swap-in inherits this safety.
- Service-role isolation verified: `grep -rn SERVICE_ROLE supabase/ shared/ lib/ app/` returns only two lines in `_shared/logging.ts`.

#### R1-M2 — Splash, camera permission, photo capture [agent]

**Design substrate now in place.** Spike-Design closed 2026-05-12 (see `JOURNAL_SPIKE_DESIGN.md` and D-023). R1-M2 builds against `lib/theme.ts` typed tokens + `tailwind.config.js` extension, `components/ui/` (15 primitives: Button / Input / Card / Segmented / Pill / PawCheckbox / IconButton / BackButton / Progress / ProgressDots / Spinner / TopRow / ScreenContainer / CtaStack / Text), `lib/glass.tsx` (platform-split Liquid Glass), `lib/motion.ts` (durations + easings + `useReducedMotion()`), DM Sans loaded at boot, brand assets at `assets/brand/`. The 11 HTML mockups at `docs/design/01_splash.html` … `12_signin.html` are the visual spec.

- [ ] Splash screen with [Get Started] (against real brand tokens + components)
- [ ] Camera permission explanation screen → [Allow access] → iOS/Android system dialog → recovery screen with "Open Settings" deep-link if denied
- [ ] Photo capture screen using `expo-camera` with gallery picker fallback (`expo-image-picker`)
- [ ] Client-side compression with `expo-image-manipulator` (max 2048px long edge, JPEG quality 0.8)
- [ ] Upload to `pet-photos` bucket at `{user_id}/{uuid}.jpg`
- [ ] All strings through `t('...')` in `locales/en.json`
- [ ] Replace the R0 smoke screen at `app/index.tsx` (the breed-identify smoke button goes with it)
- [ ] Fix the SafeAreaView issue on Pixel 7 (R0-M3 follow-up)

**Estimate:** 5h (separate from the design spike — which earns its own `JOURNAL_SPIKE_DESIGN.md`).

#### R1-M3 — "Welcome {petname}" profile screen [agent]
- [ ] Result screen showing photo, species, breed, editable name field
- [ ] User confirms or edits any field
- [ ] On confirm: insert/update `pets` row with collected fields
- [ ] All strings in `en.json`
- [ ] `@testing-library/react-native` added; first component tests land here (per CLAUDE.md note)

**Estimate:** 4h.

### R1 quality gate
- [ ] Anton runs at least 5 onboarding flows on the dev-client build, all complete without crash
- [ ] Force-settings recovery branch tested (deny permission, then re-grant via Settings, then continue)
- [ ] At least 2 photo upload variations: portrait and landscape, both compressed and uploaded successfully
- [ ] `JOURNAL_R1.md` written with UX verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R2

**R1 estimate total:** ~12 hours. **Progress: ~1.5h of 12h committed (R1-M1 done).**

---

## R2 — Document capture, hardcoded medcard OCR, merged profile

**Validation question:** *Does the document scan + merged profile UI feel useful enough for the user to continue?*

**Flow steps covered:** 4 (side photo + documents capture), 5 (merged profile completion — pet name + breed + DOB + weight + vaccinations).

**Definition of done:**
- User can capture a side photo of their pet (camera + gallery picker, reusing R1's camera component)
- User can capture a vet passport / DNA test / other document (optional — "Skip" allowed)
- Hardcoded `medcard-ocr` edge function returns canned `{ raw_text, fields: { name, dob, weight_kg, vaccinations[] } }` regardless of input document
- Merged profile screen displays all collected fields (name, breed, gender, age, color, document data) — all editable
- User confirms; result persists to `medical_records` and updates `pets` with merged data
- Cost-per-call logged in `ai_jobs`
- `JOURNAL_R2.md` records UX verdict across at least 5 runs

### Milestones

#### R2-M1 — `medcard-ocr` edge function (hardcoded provider) [agent]
- [ ] Extend `supabase/functions/_shared/ai/hardcoded.ts` with `ocr()` method returning canned medcard fields (adds `OcrAIClient` interface to `_shared/ai/types.ts`)
- [ ] `supabase/functions/medcard-ocr/index.ts` — accepts Storage path; calls the adapter selected by `MODEL_FOR_OCR` env var; writes `ai_jobs` row
- [ ] `OCR_PROMPT_V` and `MEDCARD_SCHEMA_PROMPT_V` constants
- [ ] Deno tests against the hardcoded adapter
- [ ] Migration: `medical_records` table + RLS policies

**Estimate:** 3h.

#### R2-M2 — Document capture screen [agent]
- [ ] Capture screen reusing R1's camera component, switched to document mode
- [ ] [Skip] button for users without a document
- [ ] Side photo capture step (separate from document; both feed the same upload flow)
- [ ] Loading screen during OCR (typically <500ms with hardcoded; we still build the loading UI for the R5 real-AI swap-in)
- [ ] All strings in `en.json`

**Estimate:** 4h.

#### R2-M3 — Merged profile review UI [agent]
- [ ] Form combining R1's breed-identify results + R2's medcard fields
- [ ] Editable: name, breed, gender, age, color, weight, vaccinations[]
- [ ] On confirm: insert `medical_records` row; update `pets` with merged extracted fields
- [ ] All strings in `en.json`

**Estimate:** 5h.

### R2 quality gate
- [ ] Anton runs at least 5 onboarding flows through merged profile, all complete
- [ ] "Skip document" branch tested
- [ ] Edit-friction measured: subjective "would I tap through this happily?"
- [ ] `JOURNAL_R2.md` written with UX verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R3

**R2 estimate total:** ~12 hours.

---

## R3 — Survey, location, plan generation (real Claude Sonnet), progress UI

**Validation question:** *Is the AI-generated plan good enough that someone would pay for it?*

**Flow steps covered:** 6 (two survey screens), 7 (location screen), 8 (fake progress), 9 (plan snippet preview).

**Definition of done:**
- User completes 2 survey screens covering pet behavior/lifestyle
- User captures location via system permission OR types ZIP/city manually (North America: US/CA/MX)
- Real Claude Sonnet 4.6 generates a 7-day plan, streamed via SSE
- First day visible in under 15s; full plan in under 30s
- Plan snippet (first 2 days) revealed in the UI; full plan persisted to `weekly_plans` but gated behind paywall in R4
- Plan generation cost logged in `ai_jobs` (real cost; target <$0.05/plan per D-005)
- `JOURNAL_R3.md` records plan quality assessment across at least 3 distinct (species, breed, age) profiles

### Milestones

#### R3-M1 — Survey screens [agent]
- [ ] 2 question screens (final question set TBD by Anton as Chief of Product)
- [ ] Persists `survey_responses` row
- [ ] All strings in `en.json`
- [ ] Migration: `survey_responses` table + RLS

**Estimate:** 3h.

#### R3-M2 — Location screen [agent]
- [ ] System geolocation permission flow + recovery
- [ ] Manual fallback: ZIP code (US/CA/MX) or city/country search
- [ ] Persists `pets.location` JSON column (or new table; TBD)
- [ ] All strings in `en.json`

**Estimate:** 3h.

#### R3-M3 — Edge function: `plan-generate` (streaming, real Claude Sonnet) [agent]
- [ ] `supabase/functions/_shared/ai/claude.ts` — Claude adapter implementing `CompletionAIClient` interface (added to `_shared/ai/types.ts`)
- [ ] `plan-generate/index.ts` — SSE-streaming endpoint; prompt assembled from `pets` + `medical_records` + `survey_responses` + locale
- [ ] `PLAN_PROMPT_V = "2026-05-08-1"`
- [ ] On completion, persist `weekly_plans` row
- [ ] Deno tests with mocked Anthropic streaming response
- [ ] `ANTHROPIC_API_KEY` set in Supabase secrets; `MODEL_FOR_PLAN=claude-sonnet-4-6` set

**Estimate:** 5h.

#### R3-M4 — Progress UI + streaming plan reveal [agent]
- [ ] Fake progress screen with milestone messages ("Analyzing your pet's breed...", "Tailoring activities to {petname}'s age...")
- [ ] Client SSE consumer
- [ ] Plan snippet UI (first 2 days revealed; remainder gated)
- [ ] All strings in `en.json`

**Estimate:** 4h.

### R3 quality gate
- [ ] At least 3 distinct (species, breed, age) profiles tested — plans recorded in `JOURNAL_R3.md`
- [ ] Anton subjective rating: would I pay for this plan?
- [ ] First-day-visible time under 15 seconds, full-plan time under 30 seconds
- [ ] Cost per plan under $0.05, logged
- [ ] `JOURNAL_R3.md` written with verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R4

**R3 estimate total:** ~15 hours.

---

## R4 — Fake paywall + sign-in + persistence

**Validation question:** *Do users convert past the paywall and complete sign-in?*

**Flow steps covered:** 10 (fake paywall), 11 (sign-in via Apple / Google / email magic link).

**Definition of done:**
- After plan snippet reveal, paywall screen appears
- "Unlock" button advances to sign-in (no charge in MVP)
- Sign-in via Apple, Google, or email magic link calls `linkIdentity` and upgrades the anonymous user
- Full plan revealed post-signin, persisted profile + medcard + plan visible
- PostHog funnel: photo → breed → medcard → survey → plan reveal → paywall tap → signin → completed
- `JOURNAL_R4.md` records funnel data from Anton + 5–10 friends/family testing

### Milestones

#### R4-M1 — Sign-in providers [agent]
- [ ] Apple sign-in: configure capability in Apple Developer, add to Expo config
- [ ] Google sign-in: configure OAuth credentials, add to Supabase auth providers
- [ ] Email magic link: Supabase auth email template, deep link handling
- [ ] Test all three on iOS and Android

**Estimate:** 5h.

#### R4-M2 — Paywall screen + linkIdentity flow [agent]
- [ ] Paywall UI (copy and price by Anton; current placeholder $5.99/mo)
- [ ] On "Unlock" tap: navigate to sign-in
- [ ] On sign-in success: call `linkIdentity`, verify same `auth.uid()` preserved
- [ ] Reveal full plan
- [ ] Show "Pet profile" tab with photo, breed, medcard, plan

**Estimate:** 5h.

#### R4-M3 — Funnel events in PostHog [agent]
- [ ] Event for each onboarding step
- [ ] PostHog funnel chart configured
- [ ] Verify with Anton's own session

**Estimate:** 2h.

### R4 quality gate
- [ ] 5–10 friends/family complete onboarding (TestFlight + Play Internal); funnel data in PostHog
- [ ] Anonymous-to-real account upgrade verified by Anton on both platforms
- [ ] Magic link deep link works on both platforms
- [ ] `JOURNAL_R4.md` written with funnel verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R5

**R4 estimate total:** ~12 hours.

---

## R5 — Real AI swap-in (breed + medcard)

**Validation question:** *Do real models perform well enough across accumulated test data?*

**Definition of done:**
- `MODEL_FOR_BREED` env var flipped from `hardcoded` to `claude-haiku-4-5-20251001`
- `MODEL_FOR_OCR` env var flipped from `hardcoded` to `mistral-ocr-2512`
- `supabase/functions/_shared/ai/claude.ts` adapter extended with `vision()` method (was R3 with only `complete()`)
- `supabase/functions/_shared/ai/mistral.ts` adapter added
- Accumulated test photos from R1-R4 onboardings validated against real Claude vision; accuracy verdict logged
- Accumulated test medcards from R1-R4 validated against real Mistral OCR; accuracy verdict logged
- Cost-per-onboarding within the $0.10 cap (target ~$0.042 per D-005)
- `JOURNAL_R5.md` records the swap verdict + a calibrated confidence threshold for low-confidence escalation

### Milestones

#### R5-M1 — Claude vision adapter [agent]
- [ ] Extend `supabase/functions/_shared/ai/claude.ts` with `vision()` method
- [ ] Real `BREED_PROMPT` text constant (currently `''` placeholder in R1)
- [ ] Deno tests against a small fixture set
- [ ] `MODEL_FOR_BREED=claude-haiku-4-5-20251001` flipped via `supabase secrets set`

**Estimate:** 2h.

#### R5-M2 — Mistral OCR adapter [agent]
- [ ] `supabase/functions/_shared/ai/mistral.ts` adapter implementing `ocr()` method
- [ ] Two-stage pipeline: Mistral OCR → Claude Haiku for schema mapping (per D-005)
- [ ] Deno tests against committed medcard fixtures
- [ ] `MODEL_FOR_OCR=mistral-ocr-2512` flipped via `supabase secrets set`

**Estimate:** 2h.

#### R5-M3 — Validation pass [Anton + Claude.ai]
- [ ] Pull all photos from `pet-photos` bucket accumulated through R1-R4
- [ ] Run the real breed-identify against each; record accuracy ("correct top breed", "correct top-3", "wrong but defensible", "wrong")
- [ ] Pull all medcards from `medcard-scans` bucket; run real OCR; record field-level accuracy
- [ ] Cost analysis: actual per-onboarding $ vs. $0.10 cap target
- [ ] If accuracy is insufficient: escalation plan (Haiku → Sonnet for breed; alternative OCR providers)

**Estimate:** 2h.

### R5 quality gate
- [ ] Breed-ID accuracy ≥ 80% top-1 on accumulated photos OR clear escalation plan documented
- [ ] OCR field accuracy ≥ 90% on accumulated medcards OR clear next-step plan
- [ ] Cost per onboarding ≤ $0.10 (with real-model rows in `ai_jobs`)
- [ ] `JOURNAL_R5.md` written with verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R6

**R5 estimate total:** ~6 hours.

---

## R6 — Localization (Spanish + Russian)

**Validation question:** *Do non-English users complete onboarding at parity with English users?*

**Definition of done:**
- All UI strings in `es.json` and `ru.json`; no English fallback visible to non-English users
- AI-generated content (plan in particular) returned in the user's locale by passing the locale as a prompt parameter (per D-008)
- Locale auto-detected on first launch from device settings, manual override in settings
- Funnel split by locale in PostHog shows comparable completion rates
- `JOURNAL_R6.md` records native-speaker review verdict for both languages

### Milestones

#### R6-M1 — Translation pass [Anton + translator]
- [ ] Export all keys from `en.json` for translation (DeepL or human)
- [ ] Native-speaker review for Spanish (Mexico variant)
- [ ] Native-speaker review for Russian
- [ ] Commit `es.json` and `ru.json`

**Estimate:** 4h.

#### R6-M2 — Locale propagation to AI prompts [agent]
- [ ] Pass user's locale to `breed-identify`, `medcard-ocr` (for schema-mapping prompt), and `plan-generate`
- [ ] Test plan output in Spanish and Russian
- [ ] Verify date/number formatting in all three locales via native `Intl`

**Estimate:** 3h.

#### R6-M3 — Locale switcher in settings [agent]
- [ ] Settings screen with locale picker
- [ ] On change: app re-renders with new locale; user's `app_locale` preference saved

**Estimate:** 2h.

### R6 quality gate
- [ ] Native speakers review both `es.json` and `ru.json`; no obvious mistranslations
- [ ] At least one onboarding completed in Spanish and one in Russian; plans reviewed for naturalness
- [ ] PostHog funnel comparison shows non-English completion within 10% of English
- [ ] `JOURNAL_R6.md` written with verdict

**R6 estimate total:** ~9 hours.

---

## Inter-release spikes (not part of the validation ladder)

These are bounded, off-ladder tracks earning their own `JOURNAL_SPIKE_*.md` entries.

### Design spike ✅ shipped 2026-05-12

Design package landed via PR #13 (squash `424a435`). Spike implementation shipped on branch `anton/spike-design-system`. See [`JOURNAL_SPIKE_DESIGN.md`](JOURNAL_SPIKE_DESIGN.md) for the full record and D-023 for the lock.

**Outputs:**
- `lib/theme.ts` — typed tokens (colors raw + semantic, typography pair-tokens, spacing, radii, glass materials, shadow helper, font family + i18n slack)
- `tailwind.config.js` — `theme.extend` mirror with drift detection in `lib/theme.test.ts`
- `components/ui/` — 15 primitives + barrel: Button, Input, Card, Segmented, Pill, PawCheckbox, IconButton, BackButton, Progress, ProgressDots, Spinner, TopRow, ScreenContainer, CtaStack, Text
- `lib/glass.tsx` — `<Glass>` (platform-split iOS BlurView / Android RGBA fill, reduce-transparency honored)
- `lib/motion.ts` — duration + easing tokens, `useReducedMotion()` hook
- `assets/brand/` — curated brand asset subset moved via `git mv` (history preserved)
- `app.json` — brand icon, splash, adaptive icon wired
- `app/_layout.tsx` — DM Sans loaded via `useFonts`, render gates on fonts ready
- `lib/store.ts` — `species` slice with `setSpecies` + `useSpecies()` for R1-M3+ adaptive theming
- F-1 / F-2 / F-4 findings fixed

**Pace:** ~10h estimate → ~8.8h actual (-12%, pending Anton confirmation). 152 tests passing across 28 suites (was 54 / 10).

---

## Backlog (post-MVP)

These are out of scope for the MVP validation ladder. Added here so they're not lost. Will be re-prioritized after R6.

- Real payments (RevenueCat integration, paywall conversion → revenue)
- Multi-pet support (UI/flow; schema is already 1:N)
- Multi-user-per-pet (shared pet across owners)
- Vet magic-link share (vet opens a read-only view of the pet's data)
- Vet QR code share (same, scannable)
- PDF export of medical card
- Photo-based triage (symptom recognition from photos)
- Text-based triage (symptom description → triage advice)
- Voice notes ("she didn't eat today" → transcribed + categorized)
- Receipt parsing (expense tracking)
- Push notifications (plan reminders, vaccination due)
- Activity tracking integration (Apple Health, wearables)
- Plan adaptation over time (week 2 personalized based on week 1 feedback)
- Vet directory / appointment booking
- Insurance integration

---

## Total MVP estimate

**~80 hours of focused work, R0–R6.** Calendar time will be longer due to Apple/Google review cycles, friend/family testing windows, real-AI validation in R5, design spike wall-clock, and translation lead time in R6.

**Progress: ~18 of 80 hours committed.** R0 (16.5h) + R1-M1 (1.5h). Design spike is additive (not in the 80h estimate) — currently estimated at 2-4h.

Reality check: this is an aggressive estimate assuming the validation ladder produces clean "yes" verdicts and no major rework. Track actuals in `08_TIME_LEDGER.md` and adjust the remaining estimates after each release closes.

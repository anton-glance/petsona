# 04 — Backlog

> Forward-looking work queue. R0–R5 validation ladder. Each release answers one question; no R(N+1) starts until R(N) earns a verdict.

---

## How this document works

- **Releases (R0–R5)** are the validation rungs.
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
- [x] First commit on `main`; protect `main` (require PR + passing CI)

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

**Estimate:** 3h. **Actual: ~6h** spread over 2 days (Apple Developer registration + ASC name flow + EAS config agent prompt + iOS build wall-clock + Apple credentials/device-registration flow + Android build + splash-asset hotfix + emulator install validation). Wall-clock was inflated by: (a) macOS fork-exhaustion incident requiring reboot mid-build, (b) Apple display-name soft-block requiring re-naming work, (c) Android splash asset missing (latent from R0-M1).

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

**Estimate:** 3h. **Actual: ~3h** (agent Phase 1+2+3 ~2h, manual link/push/deploy + smoke test ~1h). On estimate — first milestone of R0 to hit the number cleanly. Driver: agent's plan-review caught the env-var-name issue (P-1) before any code was written, eliminating an otherwise-likely refactor cycle.

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
- [x] EAS env vars: `EXPO_PUBLIC_POSTHOG_API_KEY` (sensitive), `EXPO_PUBLIC_SENTRY_DSN` (sensitive) — both alongside Supabase vars from R0-M3
- [x] EAS dev builds re-triggered for both platforms; installed and verified on iPhone + Pixel 7 AVD
- [x] PostHog Activity feed shows `Identify` → `app_launch` → `test_error_thrown` events from both devices with distinct_ids matching their `auth.uid()` UUIDs
- [x] Sentry Issues page shows test errors from both devices, tagged `environment: development`
- [ ] Source-map upload via `SENTRY_AUTH_TOKEN` — **deferred to R3** (errors flow without it; stack traces are minified but readable for current test cases)

**Estimate:** 2h. **Actual: ~3h** (agent Phase 1+2 ~2h, EAS rebuilds ~30 min wall-clock, dashboard setup + smoke-test ~30 min). +50% variance driven by an extra round-trip in Phase 1 plan-review (P-1 logger semantics: agent pushed back on architect's prompt; agent's proposal was adopted — led to D-021).

#### R0-M5 — End-to-end smoke test ✅ shipped 2026-05-11
**Note:** The validation criteria for R0-M5 were proven by the combined R0-M3 + R0-M4 smoke tests. Listing the criteria here for completeness; no additional implementation needed.

- [x] Splash placeholder + smoke screen at `app/index.tsx` exercises the full R0 stack (verified by R0-M3 + R0-M4 smoke tests on iPhone + Pixel 7 AVD)
- [x] On launch: anonymous sign-in fires; `auth.uid()` displayed on smoke screen (R0-M3, confirmed by user_id matching across smoke screen + hello function response + PostHog distinct_id)
- [x] "Hello function" button: calls `hello` edge function and shows `user_id` (R0-M3)
- [x] "Insert pets row" button: insert succeeds, returns row id (R0-M3); cross-user read attempt blocked by RLS, returns 0 rows (R0-M3)
- [x] EAS dev builds installed on iPhone + Pixel 7 AVD across both R0-M3 and R0-M4 rebuilds (4 dev builds total during R0)
- [x] Test plan: combined R0-M3 + R0-M4 smoke tests serve as the R0 acceptance test plan (documented in `JOURNAL_R0.md`)

**Estimate:** 3h. **Actual: ~0h** (proven by R0-M3 + R0-M4 work; no additional milestone-specific implementation required). Variance: -100% because R0-M5's validation was absorbed into earlier milestones. Lesson logged for future ladder planning.

### R0 quality gate ✅
- [x] All R0 milestones checked
- [x] `JOURNAL_R0.md` written with verdict + lessons + actuals
- [x] `05_HISTORY.md` updated
- [x] `08_TIME_LEDGER.md` updated with R0 actuals vs estimate
- [x] Both Anton and Claude.ai comfortable proceeding to R1

**R0 estimate total:** ~14 hours. **Actual: ~16.5 hours** (+18% over estimate). Detailed breakdown in `JOURNAL_R0.md` + `08_TIME_LEDGER.md`. The +18% lands well within the +25% buffer flagged after R0-M2; the validation ladder is calibrating.

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

#### R1-M1 — `breed-identify` edge function (hardcoded provider) [agent]
- [ ] `supabase/functions/_shared/ai/types.ts` — common `AIClient` interface (D-006)
- [ ] `supabase/functions/_shared/ai/hardcoded.ts` — `AIClient` adapter returning canned breed responses (D-019)
- [ ] `supabase/functions/_shared/logging.ts` — `ai_jobs` writer
- [ ] `supabase/functions/breed-identify/index.ts` — accepts Storage path; calls the adapter selected by `MODEL_FOR_BREED` env var; writes `ai_jobs` row
- [ ] `BREED_PROMPT_V = "2026-05-08-1"` constant
- [ ] Deno tests for the adapter, the logger, and the function
- [ ] Migration: `ai_jobs` table created (or confirmed from R0-M3)

**Estimate:** 3h.

#### R1-M2 — Splash, camera permission, photo capture [agent]
- [ ] Splash screen with [Get Started] (placeholder visual design — NativeWind defaults; final design swaps in at R3 or later when Anton's designs land)
- [ ] Camera permission explanation screen → [Allow access] → iOS/Android system dialog → recovery screen with "Open Settings" deep-link if denied
- [ ] Photo capture screen using `expo-camera` with gallery picker fallback (`expo-image-picker`)
- [ ] Client-side compression with `expo-image-manipulator` (max 2048px long edge, JPEG quality 0.8)
- [ ] Upload to `pet-photos` bucket at `{user_id}/{uuid}.jpg`
- [ ] All strings through `t('...')` in `locales/en.json`

**Estimate:** 5h.

#### R1-M3 — "Welcome {petname}" profile screen [agent]
- [ ] Result screen showing photo, species, breed, editable name field
- [ ] User confirms or edits any field
- [ ] On confirm: insert/update `pets` row with collected fields
- [ ] All strings in `en.json`

**Estimate:** 4h.

### R1 quality gate
- [ ] Anton runs at least 5 onboarding flows on TestFlight build, all complete without crash
- [ ] Force-settings recovery branch tested (deny permission, then re-grant via Settings, then continue)
- [ ] At least 2 photo upload variations: portrait and landscape, both compressed and uploaded successfully
- [ ] `JOURNAL_R1.md` written with UX verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R2

**R1 estimate total:** ~12 hours.

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
- [ ] Extend `supabase/functions/_shared/ai/hardcoded.ts` with `ocr()` method returning canned medcard fields
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
- Fake progress screen displays milestone messages during plan generation
- Plan-generate edge function streams real Claude Sonnet 4.6 output back via SSE
- Plan content references the pet by name, breed, age, weight, and is locale-aware
- First-day-of-plan visible in under 15 seconds from "Generate" tap; full plan in under 30 seconds
- Plan persists to `weekly_plans`
- Cost-per-plan logged
- `JOURNAL_R3.md` records plan quality verdict across at least 3 different (species, breed, age, location) profiles

### Milestones

#### R3-M1 — Survey screens [agent]
- [ ] 2 survey screens (question set defined by Anton)
- [ ] Persists `survey_responses` row
- [ ] All strings in `en.json`

**Estimate:** 3h.

#### R3-M2 — Location capture screen [agent]
- [ ] Location explanation screen → [Use my location] (system dialog via `expo-location`) OR [Type manually]
- [ ] Manual ZIP/city search supporting US, Canada, Mexico (using `react-native-google-places-autocomplete` or `expo-location` reverse-geocoding; pick one in Phase 1)
- [ ] Persists `pet_location` field on `pets` (city, region/state, country, optional lat/lon)
- [ ] All strings in `en.json`

**Estimate:** 4h.

#### R3-M3 — `plan-generate` edge function (streaming, real Claude Sonnet) [agent]
- [ ] Add `supabase/functions/_shared/ai/claude.ts` adapter implementing the `AIClient.complete()` streaming method
- [ ] Server-Sent Events from edge function back to client
- [ ] Prompt assembled from full pet profile bundle: species, breed, age, weight, color, location, survey answers, locale (per D-017 — model resolves climate context)
- [ ] `PLAN_PROMPT_V = "2026-05-08-1"` constant
- [ ] `MODEL_FOR_PLAN=claude-sonnet-4-6` env var set (real model, not hardcoded — plan quality matters for R3's validation question)
- [ ] On stream completion, persist `weekly_plans` row
- [ ] Deno tests with mocked Anthropic streaming response

**Estimate:** 5h.

#### R3-M4 — Fake progress screen + plan reveal UI [agent]
- [ ] Progress screen with milestone messages: "Analyzing your pet's breed...", "Reviewing medical history...", "Tailoring activities to {petname}'s age...", "Adapting for your local climate..."
- [ ] Messages are fake-timed for R3 (hooked to real streaming events at R5 if needed; Anton's design intent is to validate the UI first per D-017)
- [ ] Plan reveal: first 2 days fully revealed (the paywall preview at R4)
- [ ] Day-by-day card layout
- [ ] All strings in `en.json`

**Estimate:** 3h.

### R3 quality gate
- [ ] At least 3 distinct (species, breed, age, location) profiles tested — plans recorded in `JOURNAL_R3.md`
- [ ] Anton subjective rating: would I pay for this plan? (this is the gate)
- [ ] First-day-visible time under 15 seconds, full-plan time under 30 seconds
- [ ] Cost per plan under $0.05, logged
- [ ] Both Anton and Claude.ai comfortable proceeding to R4

**R3 estimate total:** ~15 hours. This remains the heaviest release.

---

## R4 — Fake paywall + sign-in + persistence

**Validation question:** *Do users tap through the paywall and complete sign-in?*

**Flow steps covered:** 10 (paywall), 11 (sign-in).

**Definition of done:**
- After 2 days of plan reveal, paywall screen appears with $5.99/month price (no charge in MVP)
- "Unlock" button advances to sign-in
- Sign-in via Apple, Google, or email magic link calls `linkIdentity` and upgrades the anonymous user
- Full plan revealed post-signin; profile + medcard + plan visible
- PostHog funnel: photo → breed → medcard → survey → location → plan reveal → paywall tap → signin → completed
- `JOURNAL_R4.md` records funnel data from Anton + 5-10 friends/family testing

### Milestones

#### R4-M1 — Sign-in providers [agent]
- [ ] Apple sign-in: configure capability in Apple Developer, add to Expo config
- [ ] Google sign-in: configure OAuth credentials, add to Supabase auth providers
- [ ] Email magic link: Supabase auth email template, deep link handling
- [ ] Test all three on iOS and (if Play verification cleared) Android

**Estimate:** 5h.

#### R4-M2 — Paywall + linkIdentity flow [agent]
- [ ] Paywall UI ($5.99/month displayed; copy per D-015 / Anton-final)
- [ ] On [Unlock] tap: navigate to sign-in
- [ ] On sign-in success: call `linkIdentity`, verify same `auth.uid()` preserved (no data migration)
- [ ] Reveal full plan
- [ ] Show "Pet profile" tab with photo, breed, medcard, plan

**Estimate:** 5h.

#### R4-M3 — Funnel events in PostHog [agent]
- [ ] Event per step: `onboarding_*` events covering all 11 flow steps + paywall + signin
- [ ] PostHog funnel chart configured
- [ ] Verify with Anton's own session

**Estimate:** 2h.

### R4 quality gate
- [ ] 5-10 friends/family complete onboarding (TestFlight + Play Internal if Google verification cleared)
- [ ] Anonymous-to-real account upgrade verified by Anton on both platforms
- [ ] Magic link deep link works on both platforms
- [ ] `JOURNAL_R4.md` written with funnel verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R5

**R4 estimate total:** ~12 hours.

---

## R5 — Real AI swap-in (breed-identify + medcard-ocr)

**Validation question:** *Do the real models perform well enough on accumulated test data to ship?*

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
- [ ] Extend `supabase/functions/_shared/ai/claude.ts` with `vision(imagePath, prompt)` method
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

**~80 hours of focused work, R0–R6.** Calendar time will be longer due to Apple/Google review cycles, friend/family testing windows, real-AI validation in R5, and translation lead time in R6.

Reality check: this is an aggressive estimate assuming the validation ladder produces clean "yes" verdicts and no major rework. Track actuals in `08_TIME_LEDGER.md` and adjust the remaining estimates after each release closes.

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
- [x] `~/coding/mypet/` exists

**Known issues from R0-M0** (track for later):
- macOS Command Line Tools out of date (CLT for Xcode 26.3 needed). Blocks `brew upgrade supabase`. Not blocking until R0-M3 (Supabase project setup). Fix before R0-M3: `sudo rm -rf /Library/Developer/CommandLineTools && sudo xcode-select --install`.
- `~/.local/state` was owned by `root` from a prior gem install; reclaimed via `sudo chown`. Captured here in case fnm or another tool surfaces a similar permission issue.

**Estimate:** 1h. **Actual: ~1.5h** (toolchain debug for fnm/state-dir permissions + Node-25-vs-Node-20 cleanup).

#### R0-M1 — Repo and tooling ✅ shipped 2026-05-09 (PR #1, squash `39a3133`)
- [x] Confirm GitHub repo `anton-glance/mypet` exists and is empty (public)
- [x] Clone to `~/coding/mypet/`
- [x] Run `npx create-expo-app@latest --template default-typescript` *(skipped — agent scaffolded directly with the correct deps; equivalent outcome)*
- [x] Initialize: NativeWind v4, Expo Router, i18next, Zustand, ESLint, Prettier, Jest with `jest-expo` preset
- [x] Add a `.gitignore` that excludes `.env*`, `node_modules`, `.expo`, `dist`, build artifacts, and any local `*-key.json` files
- [x] Add the doc set to `docs/` (already on `main` from the project-start session)
- [x] Add `CLAUDE.md` to repo root (already present)
- [x] Add `.github/workflows/ci.yml` running typecheck + test + lint on PR
- [x] First commit on `main`; protect `main` (require PR + passing CI)

**Estimate:** 2h. **Actual: ~3h** (agent implementation + plan-review round-trip + CI fix commit + disk-pressure recovery).

#### R0-M2 — Store identifiers and EAS
- [ ] Apple Developer: register App ID `com.antonglance.mypet`
- [ ] App Store Connect: create the iOS app entry with bundle ID `com.antonglance.mypet`
- [ ] Google Play Console: create the Android app entry with application ID `com.antonglance.mypet` (placeholder icon and screenshots are fine)
- [ ] `eas init` to link the repo to EAS
- [ ] `eas build:configure` (creates `eas.json`)
- [ ] `eas build --profile development --platform ios` and install on Anton's iPhone
- [ ] `eas build --profile development --platform android` and install on a real Android device or emulator
- [ ] Submit a placeholder build to TestFlight; submit to Play Internal Testing track

**Estimate:** 3h. Apple/Google review delays may extend wall-clock.

#### R0-M3 — Supabase project
- [ ] Create Supabase project (free tier, region: AWS US-East)
- [ ] `supabase init` in repo
- [ ] First migration: create `pets` table + RLS policies (default-deny, scoped to `auth.uid()`)
- [ ] First edge function: `_shared/auth.ts` (`getUser` helper), `hello/index.ts` (returns `{ message, user_id }`)
- [ ] Deploy: `supabase db push`, `supabase functions deploy hello`
- [ ] Configure Apple sign-in provider, Google sign-in provider (credentials only — flow wired in R4)
- [ ] Confirm anonymous sign-in is enabled

**Estimate:** 3h.

#### R0-M4 — Telemetry
- [ ] PostHog account, project for MyPet, install `posthog-react-native`
- [ ] Sentry account, project for MyPet (separate iOS / Android / functions), install `@sentry/react-native`
- [ ] Wire up: app launch event, screen view auto-capture, intentional test error
- [ ] Verify events in PostHog dashboard, errors in Sentry dashboard

**Estimate:** 2h.

#### R0-M5 — End-to-end smoke test
- [ ] Splash screen renders the MyPet logo (placeholder OK)
- [ ] On launch: anonymous sign-in fires; `auth.uid()` printed via logger
- [ ] One screen with a "Hello" button that calls the `hello` edge function and shows `user_id`
- [ ] One screen that inserts a `pets` row and reads it back, displaying RLS in action (try inserting a row with a wrong `user_id` and confirm it's rejected)
- [ ] Build both platforms via EAS, install, run end-to-end on real devices
- [ ] Anton runs the test plan (will be provided by Claude.ai before this milestone starts)

**Estimate:** 3h.

### R0 quality gate
- [ ] All R0 milestones checked
- [ ] `JOURNAL_R0.md` written with verdict + lessons + actuals
- [ ] `05_HISTORY.md` updated
- [ ] `08_TIME_LEDGER.md` updated with R0 actuals vs estimate
- [ ] Both Anton and Claude.ai comfortable proceeding to R1

**R0 estimate total:** ~14 hours. This will likely run longer due to Apple/Google review wall-clock — plan for 3–5 calendar days.

---

## R1 — Breed identification

**Validation question:** *Does Claude vision identify dog and cat breeds accurately enough that users trust the result?*

**Definition of done:**
- User can launch the app, snap a photo of their pet, and see the species + top breed candidate with a confidence score.
- The user can confirm or pick from up to 3 alternatives.
- The result is persisted to `pets` for the anonymous user.
- Cost per call logged in `ai_jobs`.
- `JOURNAL_R1.md` records test results across at least 10 photos (dogs, cats, mixed lighting, mixed breeds) with verdict.

### Milestones

#### R1-M1 — Anthropic API key
- [ ] Add billing / API key in Anthropic Console
- [ ] Set in Supabase: `supabase secrets set ANTHROPIC_API_KEY=...`
- [ ] Set: `MODEL_FOR_BREED=claude-haiku-4-5-20251001`

**Estimate:** 0.5h.

#### R1-M2 — Edge function: `breed-identify`
- [ ] `supabase/functions/_shared/ai/types.ts` — common interface
- [ ] `supabase/functions/_shared/ai/claude.ts` — Anthropic adapter
- [ ] `supabase/functions/_shared/logging.ts` — `ai_jobs` writer
- [ ] `supabase/functions/breed-identify/index.ts` — accepts a Storage path; returns `{ species, candidates: [{breed, confidence}], chosen }`
- [ ] `BREED_PROMPT_V = "2026-05-08-1"` constant
- [ ] Deno tests for the adapter and the function
- [ ] Migration: `ai_jobs` table created if not yet from R0

**Estimate:** 4h.

#### R1-M3 — Camera and photo upload
- [ ] Onboarding screen: camera permission request
- [ ] Capture screen using `expo-camera`
- [ ] Client-side compression with `expo-image-manipulator` (max 2048px long edge, JPEG quality 0.8)
- [ ] Upload to `pet-photos` bucket at `{user_id}/{uuid}.jpg`
- [ ] Loading state with cancellation

**Estimate:** 4h.

#### R1-M4 — Breed result UI
- [ ] Result screen showing photo, species, top breed, confidence, alternatives
- [ ] User confirms or picks alternative
- [ ] On confirm: insert/update `pets` row
- [ ] All strings in `en.json`

**Estimate:** 3h.

### R1 quality gate
- [ ] At least 10 test photos by Anton, mix of breeds, lighting, indoor/outdoor — results recorded in `JOURNAL_R1.md`
- [ ] At least 2 deliberately-bad photos (non-pet, blurry) handled gracefully
- [ ] Cost-per-call within $0.01 ceiling, logged in `ai_jobs`
- [ ] Test plan delivered by Claude.ai before testing
- [ ] `JOURNAL_R1.md` written with verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R2

**R1 estimate total:** ~12 hours.

---

## R2 — Medical card OCR

**Validation question:** *Does OCR of vet medical cards extract enough useful structure to be worth the user's time vs. typing manually?*

**Definition of done:**
- User can snap a photo of a medical card and see a pre-filled form (name, DOB, weight, vaccination history).
- Every field is editable. User confirms.
- Result persists to `medical_records`.
- Best-effort across English, Spanish, and Russian medical cards (common North American formats prioritized).
- Cost per call logged.
- `JOURNAL_R2.md` records OCR accuracy across at least 5 real medical cards.

### Milestones

#### R2-M1 — Mistral API key
- [ ] Add billing / API key in Mistral La Plateforme
- [ ] Set in Supabase: `supabase secrets set MISTRAL_API_KEY=...`
- [ ] Set: `MODEL_FOR_OCR=mistral-ocr-2512`

**Estimate:** 0.5h.

#### R2-M2 — Edge function: `medcard-ocr`
- [ ] `_shared/ai/mistral.ts` — Mistral adapter (OCR API)
- [ ] `medcard-ocr/index.ts` — accepts a Storage path; runs Mistral OCR; passes raw text to Claude Haiku for schema mapping; returns structured fields
- [ ] Two-stage prompt versioning: `OCR_PROMPT_V` and `MEDCARD_SCHEMA_PROMPT_V`
- [ ] Deno tests with sample PDFs/images of medical cards (committed to a test fixtures folder)

**Estimate:** 5h.

#### R2-M3 — Card capture and review UI
- [ ] Capture screen reusing R1's camera component
- [ ] Loading screen during OCR (typically 2–5s)
- [ ] Review form: editable fields for name, DOB, weight, vaccinations[]
- [ ] On confirm: insert `medical_records` row, update `pets` with extracted name/DOB/weight if present
- [ ] All strings in `en.json`

**Estimate:** 5h.

### R2 quality gate
- [ ] At least 5 real medical cards (mix of US/Canada/Mexico formats, ideally including one Russian-language card if available) — results in `JOURNAL_R2.md`
- [ ] Edit-friction measured: how many fields needed correction on average
- [ ] OCR cost per card under $0.005, logged
- [ ] Graceful handling of an unreadable card (clear retry message)
- [ ] Test plan delivered by Claude.ai before testing
- [ ] Both Anton and Claude.ai comfortable proceeding to R3

**R2 estimate total:** ~10.5 hours.

---

## R3 — Survey + plan generation (full happy path, no auth)

**Validation question:** *Is the AI-generated weekly plan good enough that someone would pay for it?*

**Definition of done:**
- User completes onboarding: photo → breed → medcard → survey → streaming plan reveal
- The plan is clearly tailored to species/breed/age/weight/survey answers
- The plan streams in via SSE; first day of plan visible in under 15 seconds from "Generate" tap
- Plan persists to `weekly_plans`
- Cost per plan logged
- `JOURNAL_R3.md` records plan quality assessment for at least 3 different (species, breed, age) profiles

### Milestones

#### R3-M1 — Survey screens
- [ ] 3–5 question screens (final question set TBD by Anton as Chief of Product)
- [ ] Persists `survey_responses` row
- [ ] All strings in `en.json`

**Estimate:** 4h.

#### R3-M2 — Edge function: `plan-generate` (streaming)
- [ ] Server-Sent Events from edge function back to client
- [ ] Prompt assembled from pet + medical_records + survey_responses + locale
- [ ] `PLAN_PROMPT_V = "2026-05-08-1"`
- [ ] On completion, persist `weekly_plans` row
- [ ] Deno tests with mocked Anthropic streaming response

**Estimate:** 6h.

#### R3-M3 — Streaming plan UI
- [ ] Loading screen with partial reveal as days stream in
- [ ] First two days fully revealed (this is the paywall preview at R4)
- [ ] Day-by-day card layout
- [ ] All strings in `en.json`

**Estimate:** 5h.

### R3 quality gate
- [ ] At least 3 distinct (species, breed, age) profiles tested — plans recorded in `JOURNAL_R3.md`
- [ ] Anton subjective rating: would I pay for this plan? (this is the gate)
- [ ] First-day-visible time under 15 seconds, full-plan time under 30 seconds
- [ ] Cost per plan under $0.05, logged
- [ ] Test plan delivered by Claude.ai before testing
- [ ] Both Anton and Claude.ai comfortable proceeding to R4

**R3 estimate total:** ~15 hours. This is the heaviest release.

---

## R4 — Fake paywall + sign-in + persistence

**Validation question:** *Do users tap through the paywall and complete sign-in?*

**Definition of done:**
- After 2 days of plan reveal, paywall screen appears
- "Unlock" button advances to sign-in (no charge in MVP)
- Sign-in via Apple, Google, or email magic link calls `linkIdentity` and upgrades the anonymous user
- Full plan revealed post-signin, persisted profile + medcard + plan visible
- PostHog funnel: photo → breed → medcard → survey → plan reveal → paywall tap → signin → completed
- `JOURNAL_R4.md` records funnel data from Anton + 5–10 friends/family testing

### Milestones

#### R4-M1 — Sign-in providers
- [ ] Apple sign-in: configure capability in Apple Developer, add to Expo config
- [ ] Google sign-in: configure OAuth credentials, add to Supabase auth providers
- [ ] Email magic link: Supabase auth email template, deep link handling
- [ ] Test all three on iOS and Android

**Estimate:** 5h.

#### R4-M2 — Paywall screen + linkIdentity flow
- [ ] Paywall UI (copy and price by Anton)
- [ ] On "Unlock" tap: navigate to sign-in
- [ ] On sign-in success: call `linkIdentity`, verify same `auth.uid()` preserved
- [ ] Reveal full plan
- [ ] Show "Pet profile" tab with photo, breed, medcard, plan

**Estimate:** 5h.

#### R4-M3 — Funnel events in PostHog
- [ ] Event for each step: `onboarding_photo_taken`, `onboarding_breed_confirmed`, `onboarding_medcard_confirmed`, `onboarding_survey_completed`, `onboarding_plan_revealed`, `paywall_shown`, `paywall_tapped`, `signin_started`, `signin_completed`
- [ ] PostHog funnel chart configured
- [ ] Verify with Anton's own session

**Estimate:** 2h.

### R4 quality gate
- [ ] 5–10 friends/family complete onboarding (TestFlight + Play Internal); funnel data in PostHog
- [ ] Anonymous-to-real account upgrade verified by Anton on both platforms
- [ ] Magic link deep link works on both platforms
- [ ] Test plan delivered by Claude.ai before testing
- [ ] `JOURNAL_R4.md` written with funnel verdict
- [ ] Both Anton and Claude.ai comfortable proceeding to R5

**R4 estimate total:** ~12 hours.

---

## R5 — Localization (Spanish + Russian)

**Validation question:** *Do non-English users complete onboarding at parity with English users?*

**Definition of done:**
- All UI strings in `es.json` and `ru.json`, no English fallback visible to non-English users
- AI-generated content (breed result narrative, plan) returned in the user's locale
- Locale auto-detected on first launch from device settings, with manual override in settings
- Funnel split by locale in PostHog shows comparable completion rates
- `JOURNAL_R5.md` records native-speaker review verdict for both languages

### Milestones

#### R5-M1 — Translation pass
- [ ] Export all keys from `en.json` for translation (DeepL or human)
- [ ] Native-speaker review for Spanish (Mexico variant)
- [ ] Native-speaker review for Russian
- [ ] Commit `es.json` and `ru.json`

**Estimate:** 4h (assuming machine translation + native review; human translation would be more).

#### R5-M2 — Locale propagation to AI prompts
- [ ] Pass user's locale to `breed-identify`, `medcard-ocr` (for schema-mapping prompt), and `plan-generate`
- [ ] Test plan output in Spanish and Russian
- [ ] Verify date/number formatting in all three locales

**Estimate:** 3h.

#### R5-M3 — Locale switcher in settings
- [ ] Settings screen with locale picker
- [ ] On change: app re-renders with new locale; user's `app_locale` preference saved

**Estimate:** 2h.

### R5 quality gate
- [ ] Native speakers review both `es.json` and `ru.json`; no obvious mistranslations
- [ ] At least one onboarding completed in Spanish and one in Russian; plans reviewed for naturalness
- [ ] PostHog funnel comparison shows non-English completion within 10% of English
- [ ] Test plan delivered by Claude.ai before testing
- [ ] `JOURNAL_R5.md` written with verdict

**R5 estimate total:** ~9 hours.

---

## Backlog (post-MVP)

These are out of scope for the MVP validation ladder. Added here so they're not lost. Will be re-prioritized after R5.

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

**~73 hours of focused work, R0–R5.** Calendar time will be longer due to Apple/Google review cycles, friend/family testing windows, and translation lead time.

Reality check: this is an aggressive estimate assuming the validation ladder produces clean "yes" verdicts and no major rework. Track actuals in `08_TIME_LEDGER.md` and adjust the remaining estimates after each release closes.

# 03 — Architecture

> Owned by Claude.ai (Chief of Engineering). Locked architecture. Changes require an ADR in `06_DECISIONS.md`.

---

## High-level picture

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile Client                        │
│           Expo SDK 55 + React Native + TS               │
│       NativeWind · Expo Router · i18next · Zustand      │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS (anon key + JWT)
                  ▼
┌─────────────────────────────────────────────────────────┐
│                      Supabase                           │
│  ┌──────────┬─────────────┬──────────┬──────────────┐  │
│  │   Auth   │  Postgres   │ Storage  │ Edge Funcs   │  │
│  │ anon +   │  + RLS      │ photos,  │ (Deno + TS)  │  │
│  │ Apple/   │             │ medcards │              │  │
│  │ Google/  │             │          │  AI gateway  │  │
│  │ magic    │             │          │  layer       │  │
│  └──────────┴─────────────┴──────────┴──────┬───────┘  │
└─────────────────────────────────────────────┼──────────┘
                                              │
                            ┌─────────────────┼─────────────────┐
                            ▼                 ▼                 ▼
                       ┌────────┐       ┌──────────┐      ┌──────────┐
                       │ Claude │       │ Mistral  │      │ (future) │
                       │  API   │       │ OCR API  │      │ Whisper, │
                       │        │       │          │      │ Parakeet │
                       └────────┘       └──────────┘      └──────────┘
```

---

## Stack and why

### Client: Expo SDK 55 + React Native + TypeScript

**Why:** Single codebase for iOS and Android. Anton is comfortable in iOS but unfamiliar with Android — Expo abstracts the Android toolchain entirely. Claude Code is dramatically more productive in TypeScript than in parallel Swift+Kotlin. EAS Build handles the entire native toolchain in the cloud, no Android Studio operation required for normal work. iOS native debugging via Xcode remains available when needed.

**Versions:**
- Expo SDK 55 (ships with React Native 0.83)
- TypeScript 5.x in strict mode
- pnpm as package manager

**Libraries:**
- `expo-router` — file-based routing
- `nativewind` — Tailwind-style styling for RN
- `i18next` + `react-i18next` — localization (en, es, ru)
- `zustand` — lightweight client state
- `@supabase/supabase-js` — Supabase client (anon key)
- `expo-camera` — photo capture
- `expo-image-manipulator` — client-side compression before upload
- `react-native-mmkv` — persistent local storage (faster than AsyncStorage)
- `posthog-react-native` — analytics
- `@sentry/react-native` — crash reporting

### Backend: Supabase

**Why:** Postgres + Auth + Storage + Edge Functions in one product. Free tier comfortably covers the 0–1000 MAU target (50,000 MAU on free tier, 1 GB storage, 500,000 edge function invocations/mo, 500 MB DB). Anonymous auth + RLS gives us authenticated access from session start without forcing signup. No vendor-locked compute model — Postgres is portable.

**What we use:**
- **Auth:** Anonymous sign-in from app launch. `linkIdentity` after paywall upgrades to Apple / Google / email magic link.
- **Postgres + RLS:** All user data scoped to `auth.uid()`. Default-deny policies. No service role key in the client — ever.
- **Storage:** Two buckets — `pet-photos` and `medcard-scans`. Both private with RLS-equivalent storage policies.
- **Edge Functions:** Deno + TypeScript. The AI gateway layer. Three functions at MVP: `breed-identify`, `medcard-ocr`, `plan-generate`.

**Compute size:** Free tier (shared, 500 MB RAM). No upgrade needed for 0–1000 users. Re-evaluate at 5,000 MAU.

### AI providers (all called only from edge functions)

| Capability | Initial model | API ID | Cost (per MTok or per page) | Why |
|---|---|---|---|---|
| Breed ID (vision) | Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1 in / $5 out | Cheap, fast, vision-capable, accurate enough for common breeds. Escalate to Sonnet if accuracy insufficient. |
| Medical card OCR | Mistral OCR 3 | `mistral-ocr-2512` | $1 / 1,000 pages | Best-in-class for forms, receipts, handwriting. Multilingual. |
| OCR → schema mapping | Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1 in / $5 out | Maps Mistral's raw OCR text into our `medical_records` schema. |
| Plan generation | Claude Sonnet 4.6 | `claude-sonnet-4-6` | $3 in / $15 out | Best balance of reasoning quality, multilingual, streaming. |
| Voice (later) | Whisper or Parakeet | TBD | TBD | Added via the same gateway pattern. |

**Estimated cost per full onboarding (one breed ID + one OCR + one plan):**
- Breed ID: ~$0.001
- OCR (1 page) + schema mapping: ~$0.002
- Plan generation (~3k input, 2k output tokens): ~$0.039
- **Total: ~$0.042 per onboarding.** Well under the $0.10 cap.

### AI gateway pattern (D-003, D-006)

Every AI call flows through this pipeline:

```
Client → Edge Function → Provider Adapter → Model API
                ↓
         ai_jobs table (logging)
```

Each edge function:
1. Verifies the caller's JWT (`getUser()` from `_shared/auth.ts`)
2. Reads model selection from env: `MODEL_FOR_BREED`, `MODEL_FOR_OCR`, `MODEL_FOR_PLAN`
3. Loads the prompt with a versioned constant (`BREED_PROMPT_V = "2026-05-08-1"`)
4. Calls the appropriate provider adapter (`_shared/ai/claude.ts`, `_shared/ai/mistral.ts`)
5. Writes a row to `ai_jobs` with model, prompt version, input/output token counts, latency, USD cost
6. Returns the result (or streams it for `plan-generate`)

**Provider abstraction:**
```
supabase/functions/_shared/ai/
  types.ts       Common interface (AIClient, ChatRequest, etc.)
  claude.ts      Anthropic adapter
  mistral.ts     Mistral adapter
  openai.ts      Stub for future
```

**Model swap = env var change**, not code change. This is the discipline that keeps "best of breed" achievable without refactoring.

---

## Data model (MVP)

```sql
-- Pets: 1:N from day one for forward compatibility
create table pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text,
  species text check (species in ('dog','cat')),
  breed text,
  breed_confidence numeric,
  birthdate date,
  weight_kg numeric,
  photo_path text,                  -- key into pet-photos bucket
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table medical_records (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  source text check (source in ('ocr','manual')),
  scan_path text,                   -- key into medcard-scans bucket
  raw_ocr_text text,
  fields jsonb,                     -- {name, dob, weight, vaccinations[]}
  confirmed_at timestamptz,         -- when user finished editing
  created_at timestamptz default now()
);

create table survey_responses (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  answers jsonb,
  locale text not null,
  created_at timestamptz default now()
);

create table weekly_plans (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  week_start date not null,
  days jsonb,                       -- [{day, actions: [...]}]
  locale text not null,
  model text not null,              -- 'claude-sonnet-4-6'
  prompt_version text not null,
  created_at timestamptz default now()
);

create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  capability text not null,         -- 'breed-identify' | 'medcard-ocr' | 'plan-generate'
  model text not null,
  prompt_version text not null,
  input_tokens int,
  output_tokens int,
  pages int,                        -- for OCR
  latency_ms int,
  cost_usd numeric(10,6),
  status text not null,             -- 'success' | 'error'
  error_code text,
  input_hash text,                  -- sha256 of input for dedup analysis
  created_at timestamptz default now()
);
```

**RLS pattern (applied to every table):**
```sql
alter table <table> enable row level security;

create policy "users see only their rows"
  on <table> for select
  using (auth.uid() = user_id);

create policy "users insert their own rows"
  on <table> for insert
  with check (auth.uid() = user_id);

create policy "users update their own rows"
  on <table> for update
  using (auth.uid() = user_id);

create policy "users delete their own rows"
  on <table> for delete
  using (auth.uid() = user_id);
```

`ai_jobs` has a slightly looser policy: users can read their own rows; only the service role (used by edge functions) can insert.

**Storage policies** mirror this: object path is `{user_id}/{filename}` and policies restrict access to the matching `auth.uid()`.

---

## Authentication flow

1. **App launch:** Client calls `supabase.auth.signInAnonymously()`. User now has a real `auth.uid()`. All writes go through normal RLS.
2. **Onboarding:** Photo, OCR, survey, plan generation all happen against the anonymous user's rows.
3. **Paywall:** Shown after partial plan reveal. Fake paywall in MVP (button labeled "Unlock" but no charge).
4. **Sign-in:** `supabase.auth.linkIdentity({ provider: 'apple' | 'google' })` or email magic link. The same `auth.uid()` is preserved — anonymous user is upgraded in place. No data migration needed.
5. **Full plan reveal + persistence.**

This is the cleanest path for "do everything, then paywall, then sign in." Documented in D-004.

---

## Localization

- **UI strings:** i18next with three resource files: `app/locales/en.json`, `es.json`, `ru.json`. Every user-facing string goes through `t('namespace.key')`. R5 is a localization-only release; the discipline of putting all strings in `en.json` from R0 is what makes that release fast.
- **AI-generated content:** Locale is passed as a prompt parameter. The model writes in the target language directly. We do not translate after generation.
- **Date / number formatting:** Native `Intl.DateTimeFormat` and `Intl.NumberFormat` with the active locale.
- **Plurals and gender:** Handled by i18next's pluralization (Russian has more plural forms than English/Spanish).

---

## Telemetry

- **PostHog (free tier, 1M events/mo):** Funnel analytics, screen views, feature flags. Wired in at R0 so we have a baseline before R1 ships.
- **Sentry (free tier, 5k errors/mo):** Crash and error reporting on both client and edge functions.
- **Supabase logs:** Edge function logs and Postgres logs in the dashboard. Free tier sufficient.

Both PostHog and Sentry are infra, not features. They're set up in R0 and never disabled.

---

## CI / CD

- **GitHub** for source. Branches: `main` (protected), feature branches via PR.
- **GitHub Actions:** On every PR, run `pnpm install && pnpm typecheck && pnpm test && pnpm lint`. On `main` push, run the same plus an EAS Build trigger.
- **EAS Build (free tier):** 30 builds/mo, 15 iOS + 15 Android. Sufficient for R0–R5. iOS builds go to TestFlight; Android builds go to Play Internal Testing.
- **EAS Update:** Optional. Skip in MVP; revisit after R4.
- **Supabase:** Migrations applied via Supabase CLI from local. Edge functions deployed via `supabase functions deploy`. CI integration deferred to post-MVP.

---

## Tools and accounts checklist

Anton's existing accounts and tools, mapped to what they're used for:

| Tool / Account | Used for | Required by | Setup in |
|---|---|---|---|
| Apple Developer Account | iOS bundle ID `com.anton-glance.mypet`, App Store Connect, TestFlight | R0 | R0-M2 |
| Google Play Developer Account | Android app `com.anton-glance.mypet`, Play Internal Testing | R0 | R0-M2 |
| GitHub | Source at `anton-glance/mypet` (public), PRs, Actions CI | R0 | R0-M1 |
| Supabase Account | Backend (DB, auth, storage, functions) | R0 | R0-M3 |
| Anthropic Console (paid API key) | Claude API | R1 | R1-M1 |
| Mistral La Plateforme (paid API key) | Mistral OCR API | R2 | R2-M1 |
| PostHog Cloud (free tier) | Analytics | R0 | R0-M4 |
| Sentry (free tier) | Crash reporting | R0 | R0-M4 |
| Expo Account | EAS Build, EAS Submit | R0 | R0-M2 |
| Local: Xcode 16+ | iOS simulator, native debugging | R0 (installed only) | R0-M0 |
| Local: Android Studio | Android emulator | R0 (installed only) | R0-M0 |
| Local: Node 20 LTS, pnpm, Expo CLI, Supabase CLI, Deno | Dev environment | R0 | R0-M0 |

---

## Cost projection (steady state at 1,000 monthly active users)

Assuming 1,000 MAU with 60% completing onboarding (600 onboardings/mo):

| Item | Cost |
|---|---|
| Supabase (free tier) | $0 |
| EAS Build (free tier) | $0 |
| PostHog (free tier) | $0 |
| Sentry (free tier) | $0 |
| GitHub (free tier) | $0 |
| Anthropic API (~$0.04 × 600) | ~$24 |
| Mistral OCR (~$0.001 × 600) | ~$1 |
| Apple Developer | $99/yr (~$8/mo) |
| Google Play Developer | $25 one-time |
| **Total monthly** | **~$33** |

If we hit limits earlier than expected:
- Supabase Pro ($25/mo) is the first upgrade — at ~5k MAU or when project pausing risks bite.
- EAS Starter ($19/mo) if we exceed 30 builds/mo.

---

## Out of scope for current architecture

The following are deliberately not in the MVP architecture and will be added via ADR when needed:

- Push notifications (Expo Notifications, post-R4)
- Real payments (RevenueCat, post-MVP)
- Background tasks (Expo TaskManager, post-MVP)
- Vet-side magic-link share (added when productized)
- PDF export of medical card (added when productized)
- Multi-pet (schema is already 1:N; UI/flow added later)
- Multi-user-per-pet sharing (requires `pet_members` join table; add via ADR)
- Wearable / activity integration (post-MVP)

---

## Reference architecture decisions

All foundational decisions are captured in `06_DECISIONS.md` as D-001 through D-011. Read that file alongside this one.

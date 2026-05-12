# 06 — Decisions

> ADR-style decision log. Every choice that's expensive to reverse, affects multiple modules, or constrains future work earns an entry. Reversed decisions stay in history, marked "REVERSED by D-NNN".

---

## D-001 — Cross-platform via Expo + React Native + TypeScript

**Date:** 2026-05-09
**Status:** Accepted

**Context.** Anton wants iOS + Android in days, is comfortable in iOS but unfamiliar with Android development. Owns Xcode and Android Studio but no Kotlin experience. Claude Code's productivity is highest in TypeScript / React.

**Options considered.**
1. Native iOS (Swift) + Native Android (Kotlin) — two codebases, two skills.
2. Flutter (Dart) — single codebase but Anton doesn't know Dart and Claude Code is less proficient.
3. Capacitor / Ionic — single codebase but weaker camera/native API story.
4. **Expo + React Native + TypeScript — single codebase, abstracts the Android toolchain, strong Claude Code productivity.**

**Decision.** Option 4. Xcode remains available for iOS native debugging; Android Studio installed only for the emulator.

**Consequences.** Speed wins; we accept some performance ceiling vs. native. The performance ceiling is far above what Petsona needs (no real-time audio, no graphics workload).

---

## D-002 — Backend on Supabase

**Date:** 2026-05-09
**Status:** Accepted

**Context.** Need Postgres + Auth + Storage + serverless compute. 0–1000 user target. Bootstrapping; cost matters.

**Options considered.**
1. Firebase — proven, but operations-per-row pricing is unpredictable; less SQL.
2. AWS (Cognito + RDS + S3 + Lambda) — most flexible but the heaviest setup; not justified at this scale.
3. **Supabase — Postgres + Auth + Storage + Edge Functions in one product. Free tier covers 50k MAU, 500k function invocations/mo, 1 GB storage. Postgres + RLS + JWT is the cleanest model for our data.**
4. Pocketbase — single-binary alternative; less mature.

**Decision.** Option 3.

**Consequences.** Free-tier constraints (project pauses after 1 week of inactivity, 500 MB DB). Acceptable for MVP. Upgrade to Pro ($25/mo) when MAU grows past 5k or before the project pause becomes a risk.

**Amended 2026-05-11 (R0-M3 close):** Supabase rolled out a new API key model in mid-2025 — projects can use `sb_publishable_...` (new format) instead of the legacy `anon` JWT key. Both work identically with `@supabase/supabase-js`'s `createClient`. Petsona's project (`hkhzukxmonlgzzmuqvvp`) was provisioned with the new key format. The env variable name in the codebase is `EXPO_PUBLIC_SUPABASE_ANON_KEY` (legacy-naming) but holds an `sb_publishable_...` value. Naming kept legacy to avoid a refactor of the env layer already shipped through R0-M1 CI; the key format is what's modern. Legacy keys remain supported until late 2026 per Supabase's deprecation timeline.

---

## D-003 — AI gateway pattern (no client-side model calls)

**Date:** 2026-05-09
**Status:** Accepted

**Context.** Multiple AI providers, model-swap flexibility, cost monitoring, security (API keys must never reach the client).

**Decision.** Every model call goes through a Supabase Edge Function. Each capability (`breed-identify`, `medcard-ocr`, `plan-generate`) is its own function. Each function reads its model selection from env vars. Each function writes a row to `ai_jobs` on every call (model id, prompt version, tokens, cost, latency).

**Consequences.** Slight extra latency vs. direct calls (one network hop). Justified by: zero key exposure, switchable models, full cost visibility, prompt regression debugging via `ai_jobs`.

---

## D-004 — Anonymous-first auth, link-on-paywall

**Date:** 2026-05-09
**Status:** Accepted

**Context.** Anton wants users to complete the entire flow before signing in (paywall sits before signin in the funnel). But all data writes need a user identity for RLS to work.

**Decision.** Use Supabase anonymous auth. From app launch, every user has a real `auth.uid()`. All onboarding writes go through normal RLS. After paywall, call `linkIdentity` to upgrade the anonymous user to Apple / Google / email-magic-link. The same `auth.uid()` is preserved — no data migration.

**Consequences.** Some abandoned anonymous users will accumulate. They count toward MAU only if they re-authenticate; orphaned anonymous users are pruned periodically (cron via edge function, post-MVP).

---

## D-005 — Initial model selection

**Date:** 2026-05-09
**Status:** Accepted (will be revisited after R1, R2, R3 actuals)

**Decision.**
- **Breed ID:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) with vision. ~$0.001/call.
- **Medical card OCR:** Mistral OCR 3 (`mistral-ocr-2512`). ~$0.001/page. Two-stage: Mistral OCR → Claude Haiku for schema mapping.
- **Plan generation:** Claude Sonnet 4.6 (`claude-sonnet-4-6`) with streaming. ~$0.04/plan.
- **Total per onboarding:** ~$0.042. Under the $0.10 cap.

**Rationale.** Haiku is good enough for breed ID (common breeds) and saves ~3x vs Sonnet. Mistral OCR is best-in-class for forms/receipts/handwriting and 5–10x cheaper than passing the image to a general LLM. Sonnet for plan generation because reasoning quality matters most here.

**Reassess at:**
- R1 verdict — if Haiku breed accuracy is insufficient, escalate to Sonnet.
- R2 verdict — if Mistral OCR struggles with North American medical cards, swap to alternative (Google Document AI, Anthropic vision, Tesseract for cheap+fallback).
- R3 verdict — if Sonnet's plan quality justifies more expense, consider Opus for premium tier later.

---

## D-006 — Multi-provider abstraction

**Date:** 2026-05-09
**Status:** Accepted

**Context.** Best-of-breed model selection is a moving target. We need to swap models without refactoring.

**Decision.** Provider adapters in `supabase/functions/_shared/ai/`. Common interface (`AIClient`) implemented by `claude.ts`, `mistral.ts`, etc. Each edge function reads its model selection from env (`MODEL_FOR_BREED`, `MODEL_FOR_OCR`, `MODEL_FOR_PLAN`). Adding a new provider = new adapter file + env var change. No changes to capability functions.

**Consequences.** A small upfront cost (build adapters before the first capability) buys easy provider swaps later. We pay this once.

---

## D-007 — Prompt versioning in code

**Date:** 2026-05-09
**Status:** Accepted

**Decision.** Every prompt has a version constant in code: `BREED_PROMPT_V = "2026-05-08-1"`. Format: ISO date + sequence. The version is stored in `ai_jobs.prompt_version` on every call. When a prompt changes, the version bumps.

**Consequences.** Enables regression analysis (did costs spike after the new prompt? did accuracy drop?). Enables A/B testing later (route a percentage of traffic to a new version).

---

## D-008 — i18n strategy: i18next + locale-aware AI prompts

**Date:** 2026-05-09
**Status:** Accepted

**Decision.** UI strings via i18next with `locales/en.json`, `es.json`, `ru.json` (at repo root, per D-012). From R0 onward, every user-facing string goes through `t('...')` even though only English is shipping until R5. AI-generated content (breed narrative, plan content) is generated in the user's locale by passing the locale to the prompt; we do not post-translate.

**Consequences.** R5 becomes a translation pass + native review pass, not a re-engineering of the codebase. Any string added without `t('...')` is a defect that will surface at R5.

---

## D-009 — Telemetry from R0 (PostHog + Sentry, free tiers)

**Date:** 2026-05-09
**Status:** Accepted

**Decision.** PostHog for product analytics + funnel tracking. Sentry for crash and error reporting. Both free tiers (PostHog 1M events/mo, Sentry 5k errors/mo). Wired in at R0, never disabled.

**Rationale.** R4's validation question ("do users convert past the paywall?") is unanswerable without funnel analytics. Adding telemetry late means losing the early baseline.

---

## D-010 — Source on GitHub, CI via GitHub Actions, builds via EAS

**Date:** 2026-05-09
**Status:** Accepted

**Decision.** GitHub for repo and PR workflow. GitHub Actions runs typecheck + test + lint on every PR. EAS Build (free tier: 30 builds/mo, 15 iOS + 15 Android) handles native builds and submission to TestFlight + Play Internal Testing.

**Consequences.** Free tier sufficient for R0–R5. If we exceed 30 builds/mo we either upgrade EAS Starter ($19/mo) or rate-limit our own builds.

---

## D-011 — Single repo (not monorepo)

**Date:** 2026-05-09
**Status:** Accepted

**Decision.** One repo with `/app`, `/supabase`, `/shared`, `/docs` as top-level folders. No npm workspaces, no Turborepo, no Nx.

**Rationale.** Solo developer, MVP timeline, no separate frontend/backend teams. Monorepo overhead unjustified at this scale. Revisit if we add a web app or separate admin dashboard.

**Note (2026-05-09):** Superseded in part by D-012 — the Expo project root is the repo root itself, not a nested `/app/` directory. D-011's no-monorepo intent stands; D-012 is its concrete realization.

---

## D-012 — Repo root IS the Expo project root

**Date:** 2026-05-09
**Status:** Accepted (during R0-M1 Phase 1 plan review)

**Context.** Initial layout in `03_ARCHITECTURE.md` placed the Expo project at `/app/` with `/app/app/` for expo-router screens. The Claude Code agent flagged this in its R0-M1 plan: it requires `working-directory: app` plumbing in CI, `cd app` before every dev command, and the `/app/app/` path is genuinely confusing.

**Decision.** The Expo project lives at the repo root. `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `app/` (expo-router screens), `components/`, `features/`, `lib/`, `locales/`, and `i18n.ts` all live at the repo root. `supabase/` remains a sibling directory (separate Deno ecosystem); `shared/` and `docs/` remain siblings (non-JS). No nested wrapper.

**Consequences.** Cleaner DX, no working-directory plumbing in CI, no `/app/app/` confusion, matches what `npx create-expo-app` produces by default. The doc set was updated in this same session before any code was written. No code refactor cost.

---

## D-013 — Jest with `jest-expo` preset (not Vitest)

**Date:** 2026-05-09
**Status:** Accepted (during R0-M1 Phase 1 plan review)

**Context.** Initial `03_ARCHITECTURE.md` and `01_AGENT_INSTRUCTIONS.md` specified Vitest for unit tests. The agent's R0-M1 plan correctly flagged that Vitest has no first-class React Native support: at R1-M4 (camera component tests) we'd need either an unmaintained third-party preset (`vitest-react-native`) or extensive `vi.mock('react-native', ...)` boilerplate.

**Decision.** Use Jest with the `jest-expo` preset for both unit and component tests. Use `@testing-library/react-native` (added at R1) for component tests. Edge function tests continue to use `deno test` (separate runtime).

**Consequences.** Slightly slower test execution vs Vitest. Battle-tested RN compatibility. Avoid the technical debt that would have surfaced at R1-M4. Switched before any test was written, so no migration cost.

---

## D-014 — Bundle ID / applicationId is `com.antonglance.petsona` (collapsed, no dash)

**Date:** 2026-05-09
**Status:** Accepted (during R0-M1 implementation); amended by D-015 (renamed from `mypet` to `petsona`)

**Context.** Original docs specified `com.anton-glance.mypet` (dashed, matching the GitHub username). `expo-doctor` rejects this for the Android `applicationId` because Android's applicationId must be a valid Java package name — letters, digits, underscores only, no dashes. iOS bundle IDs do allow dashes but matching iOS to Android keeps store registration symmetric.

**Decision.** Use `com.antonglance.<slug>` (collapsed, no separator) for both `ios.bundleIdentifier` and `android.package`. The GitHub repo URL stays at `anton-glance/<slug>` (URLs allow dashes).

**Consequences.** App Store Connect (iOS) and Google Play Console (Android) both register under the same identifier. The slug component (`<slug>`) was originally `mypet`; renamed to `petsona` per D-015 before any store registration occurred.

**Reversal cost.** High after R0-M2 (would require unregistering the App ID from Apple and the application from Google Play and starting over). Lock now; never change.

---

## D-015 — Product renamed from MyPet to Petsona (pre-store-registration)

**Date:** 2026-05-09
**Status:** Accepted (during R0-M2 prep, before any Apple Developer / App Store Connect / Play Console registration)

**Context.** Working name "MyPet" was unavailable for App Store Connect display name registration. Anton (Chief of Product) selected "Petsona" as the replacement after confirming availability across all three required surfaces:
- Apple Developer App ID `com.antonglance.petsona` — available
- App Store Connect display name "Petsona" — available
- Google Play Console package `com.antonglance.petsona` — available

**Decision.** All product-facing references rename from "MyPet" to "Petsona". Bundle ID / applicationId follow per D-014: `com.antonglance.petsona`. GitHub repo renamed from `anton-glance/mypet` to `anton-glance/petsona` (GitHub auto-redirects the old URL). Local working path renamed from `~/coding/mypet/` to `~/coding/petsona/`. Splash tagline updated from "Loading your pet's plan..." to "Every pet has a Petsona" (brand-tied; ties the name to the product's job of capturing each pet's profile).

**Why now.** Before R0-M2 (store registration) — registering `mypet` and unregistering it later would burn an Apple Developer App ID slot and create a stale entry in Play Console. Renaming pre-registration is free.

**Affected.** All 9 doc files, plus `app.json`, `package.json`, `locales/{en,es,ru}.json`, and `i18n.test.ts` in the codebase. Code-side rename happens in PR #4 (agent work) after this doc PR (#3) merges.

**Reversal cost.** High after R0-M2 (same as D-014). Lock now.

**Amended 2026-05-09:** App Store Connect display-name check on bare "Petsona" returned "not available" despite no shipped app using the name (typical Apple soft-block from a speculative reservation or expired listing). Differentiated display name `Petsona: Your Pet's Profile` was used to register the App Store Connect entry. Brand name (in repo, code, marketing) remains "Petsona". See D-016 for the brand-vs-display-name split.

---

## D-016 — Brand name vs App Store display name split

**Date:** 2026-05-09
**Status:** Accepted (during R0-M2 store registration)

**Context.** App Store Connect rejected bare "Petsona" as a display name despite no shipped app using it (typical of Apple's soft-block from speculative reservations or expired listings). The display name field is Apple-side metadata, separate from bundle ID and brand. Differentiated longer form `Petsona: Your Pet's Profile` was accepted on first try.

**Decision.** Three names coexist with distinct roles:

| Surface | Value | Where it lives |
|---|---|---|
| **Brand** (marketing, in-app, repo, code) | `Petsona` | `app.json` `name`, `package.json` `name`, `locales/*.json` `app.name`, splash screen, all docs |
| **Apple App Store display name** | `Petsona: Your Pet's Profile` | App Store Connect web UI only — *not* in the repo |
| **Google Play display name** | TBD at Play Console registration; default to `Petsona` if available, else fall back to `Petsona: Your Pet's Profile` for parity | Play Console web UI only — *not* in the repo |
| **Bundle ID / applicationId** (technical, never user-visible) | `com.antonglance.petsona` | `app.json` `ios.bundleIdentifier` and `android.package` |
| **Bundle Display Name** (the label under the icon on the home screen) | `Petsona` | Apple-side: `app.json` `ios.infoPlist.CFBundleDisplayName` if we want it different from the App Store name; otherwise iOS uses the bundle name. Default for now: `Petsona`. |

**Consequences.**
- The repo never sees "Petsona: Your Pet's Profile". That string is App Store metadata that we type into the App Store Connect web form (and later Play Console) directly.
- The user who downloads the app sees the display name in the App Store listing, but once installed, the home-screen icon label is the *Bundle Display Name* — which we'll set to `Petsona`. The longer form lives only in the App Store discovery surface.
- App Store SEO benefits from the longer form (keyword "pet" appears in the discoverable name). Acceptable side effect.
- If Apple ever frees up the bare "Petsona" name (Apple does periodically reclaim abandoned reservations after 180 days), we can request a name change in App Store Connect. Low priority.

**Reassess at:** Play Console registration (within R0-M2). If `Petsona` is available there, take it; if not, use `Petsona: Your Pet's Profile` for parity.

---
## D-017 — Onboarding flow expanded to 11 steps

**Date:** 2026-05-11
**Status:** Accepted (closing R0-M2)

**Context.** Original product spec (`02_PRODUCT_SPEC.md`) described a 10-step happy path. While planning R1, Anton walked through the flow at the screen-by-screen level and surfaced three additions that materially change the funnel:

1. **Explicit camera permission screen with force-settings branch** (new step 2). Originally implicit. Without a dedicated screen + force-settings handling, denied-permission users hit a dead-end with no recovery.
2. **Location capture screen** (new step 7). Originally implicit. Climate-aware plan generation requires location data; a dedicated capture screen with system-permission + manual ZIP/city fallback is needed.
3. **Fake progress screen** (new step 8). UX polish. Plan generation will take 10-30 seconds even with streaming; a progress screen with milestone messages ("Analyzing your pet's breed...", "Tailoring activities to {petname}'s age...") converts "this is too slow" into "this is doing real work." The fake progress can later be hooked to actual streaming events as plan content arrives.

**Decision.** The locked happy path is 11 steps:

1. Splash with [Get Started] button
2. Camera permission explanation screen → [Allow access] → system dialog → force-settings recovery if denied
3. Pet face capture screen [camera + gallery access]
4. Side photo + documents capture (vet passport, DNA test, or other; documents optional)
5. AI-extracted profile screen: "Welcome {petname}" — pre-filled fields (name, breed, gender, age, color, document data) — all editable
6. Survey screens (2 screens with pet behavior/lifestyle questions)
7. Location screen — [Use my location] (system dialog) OR manual ZIP/city search across North America
8. Fake progress screen showing "creating profile..." with milestone messages
9. Plan snippet preview (first 2 days revealed)
10. Fake paywall ($5.99/month displayed; no charge)
11. Sign-in (Apple / Google / email magic link) — `linkIdentity` upgrades the anonymous user

**Plan generation prompt input.** The full pet profile bundle is passed to the plan-generation prompt — species, breed, age, weight, color, location (city/zip/country), survey answers, locale. The plan-generation model resolves climate context and personalization. No client-side reverse-geocoding or climate-zone lookups. Removes a moving part.

**Affected.** `02_PRODUCT_SPEC.md` updated to reflect the 11-step flow. `04_BACKLOG.md` re-organized so each release's milestones map to specific flow steps. R1 picks up steps 1-3 and 5 (the breed-identification path); R2 picks up step 4; R3 picks up steps 6-9; R4 picks up steps 10-11.

**Reversal cost.** Low pre-R3. Reordering screens before R3 is cheap. After R3 ships, screen order is locked because the persisted state machine references step IDs.

---

## D-018 — Validation ladder re-shaped: R5 = AI swap-in, R6 = localization

**Date:** 2026-05-11
**Status:** Accepted (closing R0-M2)

**Context.** Original ladder put localization at R5 and finished MVP there. During R0-M2 close, Anton requested that R1-R4 ship with **hardcoded AI provider responses** (canned outputs for breed-identify and medcard-ocr) to maximize development velocity. Real AI quality validation moves to a dedicated release where accumulated real-world test photos and medical cards (collected through R1-R4) are evaluated against the real models in one focused pass.

**Decision.** Validation ladder is now seven releases (R0-R6), not six (R0-R5):

| Release | Question | What ships |
|---|---|---|
| R0 | Can we ship to stores reliably? | Infra spine |
| R1 | Can users get from launch to "Welcome {petname}"? | Splash, camera perms, breed-identify edge fn (**hardcoded**), profile UI |
| R2 | Does the medcard scan + merged profile feel useful? | Documents capture, medcard-ocr edge fn (**hardcoded**), merged profile UI |
| R3 | Is the plan good enough to convert past paywall? | Survey, location capture, plan-generate (**real Claude Sonnet** — plan quality matters most for conversion), progress UI |
| R4 | Do users convert past paywall + sign in? | Fake paywall + sign-in + persistence |
| **R5 (new)** | **Do real models perform well enough across accumulated test data?** | **Flip `MODEL_FOR_BREED` and `MODEL_FOR_OCR` env vars from `hardcoded` to real models; validate against R1-R4 test photos.** |
| R6 (was R5) | Do non-English users complete onboarding at parity? | Localization (Spanish + Russian) |

**Plan generation is real AI from R3.** Hardcoded plan output would be useless for the validation question "is the plan good enough?" — the entire point of R3 is to test plan quality with the real model. Breed-ID and medcard-OCR can be hardcoded because R1's question is "does the UI work?" and R2's is "does the merged-profile experience feel useful?" — neither requires real ML accuracy at that stage.

**Why R5 is a dedicated release, not "swap inside R1/R2".** Doing the swap inside each capability release means accumulating test data is gated by that release shipping, and real-AI debugging blocks UI iteration. Pulling it out gives R1-R4 a clean dev-velocity story, lets test data accumulate during friends-and-family testing in R4, and concentrates the real-AI validation into one focused pass.

**R5 estimate.** ~6 hours. Most of the work is validation (testing accumulated photos against the real models, measuring cost-per-call, calibrating confidence thresholds), not coding — the swap itself is env var changes per D-019.

**Total MVP estimate revised.** ~80 hours (was ~73). +6h for new R5; +1h overhead for R6 re-numbering and localization-of-real-AI-outputs validation. Net cost: 7 hours of additional ladder work in exchange for shipping R1-R4 measurably faster (estimated 4-8 hours saved across those releases by not chasing model accuracy in parallel with UI work).

**Affected.** `04_BACKLOG.md` re-organized end-to-end with R5 as the AI swap-in and R6 as localization.

**Reversal cost.** Medium. Reverting to "real AI from R1" requires re-doing R1 and R2's `ai_jobs` cost analysis and pushing back delivery. Don't reverse without good reason.

---

## D-019 — `hardcoded` AI provider adapter

**Date:** 2026-05-11
**Status:** Accepted (closing R0-M2)

**Context.** D-006 established the multi-provider adapter pattern in `supabase/functions/_shared/ai/`. D-018 calls for hardcoded AI responses in R1 and R2. Combining the two: the hardcoded responses are implemented as **another adapter** satisfying the same `AIClient` interface, slotted in via env var like any other provider.

**Decision.** The provider abstraction grows by one adapter:

```
supabase/functions/_shared/ai/
  types.ts        Common AIClient interface (unchanged)
  claude.ts       Anthropic adapter (R3+)
  mistral.ts      Mistral adapter (R5)
  openai.ts       Future
  hardcoded.ts    NEW — returns canned responses matching the AIClient interface
```

`hardcoded.ts` exports the same `AIClient` shape as the real adapters: same method signatures, same return types, same error contract. The difference is the implementation:

- `vision(imagePath: string, prompt: string)` → returns a hardcoded `{ species: "dog", breed: "Labrador Retriever", confidence: 0.92, candidates: [...] }` regardless of the image
- `ocr(documentPath: string)` → returns hardcoded `{ raw_text: "...", fields: { name: "Bella", dob: "...", weight: 18.5, vaccinations: [...] } }` regardless of the document
- `complete(prompt: string, options)` → returns hardcoded plan text (or throws "use claude adapter for plans"; we don't hardcode plan output)

**Env var conventions** (consistent across all adapters):
- `MODEL_FOR_BREED=hardcoded` → uses `hardcoded.ts` for breed-identify
- `MODEL_FOR_BREED=claude-haiku-4-5-20251001` → uses `claude.ts` with that model
- `MODEL_FOR_OCR=hardcoded` → uses `hardcoded.ts` for medcard-ocr
- `MODEL_FOR_OCR=mistral-ocr-2512` → uses `mistral.ts`
- `MODEL_FOR_PLAN=claude-sonnet-4-6` → always real model for plan generation

**Every call still writes `ai_jobs`** with `model: "hardcoded"`, prompt_version, token counts (set to 0 for hardcoded), latency, cost ($0). This preserves the cost/latency/regression debugging surface across the hardcoded → real transition.

**Why this matters for D-018.** R5's "AI swap-in" becomes literally an env var change in Supabase + validation: `supabase secrets set MODEL_FOR_BREED=claude-haiku-4-5-20251001`. Zero code change to capability functions. The cost-per-call data is already accumulating in `ai_jobs` from R1 onward (with `cost_usd: 0` for hardcoded entries). After the swap, real-model cost rows start landing; we compare actual against the $0.10/onboarding cap.

**Affected.** All R1-R2 prompts will explicitly require capability functions import the generic `AIClient` from `_shared/ai/types.ts`, never `@anthropic-ai/sdk` directly. `03_ARCHITECTURE.md` updated to reflect `hardcoded` as a first-class provider, not a temporary hack.

**Reversal cost.** Low. Removing `hardcoded.ts` after R5 is one deletion + env var swap (already done in R5). No knock-on changes.

---
## D-020 — Edge function `getUser()` uses anon-key + forwarded-JWT, not service-role

**Date:** 2026-05-11
**Status:** Accepted (during R0-M3 plan review)

**Context.** R0-M3's `_shared/auth.ts` exposes a `getUser(req)` helper that extracts the authenticated user from an incoming request's JWT. The original architect-side prompt called for using `SUPABASE_SERVICE_ROLE_KEY` for this. The implementing agent pushed back during Phase 1 plan review with a security improvement.

**The two options.**

| Approach | What it does | Trust boundary | RLS interaction |
|---|---|---|---|
| Service-role key + verify the JWT | Function uses service-role privileges; calls `supabase.auth.getUser(jwt)` to extract user | Function code is fully trusted with database-bypass access | Bypasses RLS (service-role role) |
| **Anon-key + forwarded JWT** | Function uses anon-key privileges, forwards the user's `Authorization` header through to Supabase Auth | Function code is scoped to anon + the user's permissions | Operates under RLS as the authenticated user |

**Decision.** Option 2 — anon-key + forwarded JWT. Pattern:

```typescript
const client = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
);
const { data: { user } } = await client.auth.getUser();
```

**Why.** Service-role is the right tool only when the function legitimately needs to bypass RLS (e.g., writing to `ai_jobs`, which has a service-role-only INSERT policy — see R1-M1). For functions that operate as the user — like `hello`, and like every future capability function (`breed-identify`, `medcard-ocr`, `plan-generate`) — anon-key + forwarded JWT is the principle-of-least-privilege choice. Service-role is database-bypass; you don't grant it where it's not needed.

**Function-by-function pattern (for R1+):**
- Capability functions calling `auth.getUser()` and reading/writing user data → anon-key + forwarded JWT (this ADR)
- Logging to `ai_jobs` (the cost/latency record) → service-role required because `ai_jobs.INSERT` policy is service-role-only; isolated in `_shared/logging.ts` so the elevated privilege boundary is single-file and audit-able

**Gateway JWT verification stays on.** `verify_jwt = true` in `supabase/config.toml` for every function. The platform gateway rejects unauthenticated requests before they reach function code. `getUser()` then extracts the **already-verified** user. Defense in depth.

**Affected.** All R1+ edge function prompts. Agent pushed back correctly and prevented a security regression in the original prompt. Locked in by R0-M3's `_shared/auth.ts`.

**Reversal cost.** Low pre-R1. After R1+ functions start using the pattern, reversing means rewriting each function. Don't reverse.

---
## D-021 — Logger / telemetry rail split: console-only for info/warn, Sentry for error, PostHog for explicit Events.* only

**Date:** 2026-05-11
**Status:** Accepted (during R0-M4 plan review)

**Context.** R0-M4's original architect-side prompt proposed routing `logger.info` calls to PostHog as `log_info` events. The implementing agent pushed back during Phase 1 with cost-shape and conceptual-clarity arguments. The pushback was correct.

**The two rails.**

| Rail | Purpose | Source of writes |
|---|---|---|
| **Sentry** | "What broke" | `logger.error()` and uncaught exceptions |
| **PostHog** | "What did the user do" | Explicit `track(Events.X)` calls only |
| **Console** | "What's the developer trying to understand" | `logger.info`/`logger.warn` (dev console only, no telemetry) |

**Decision.** Three discipline rules:

1. **`logger.info(msg, ctx?)`** — `console.log` in dev; no-op in prod (console output is dropped on production builds; we don't ship logger.info to telemetry).
2. **`logger.warn(msg, ctx?)`** — `console.warn` in dev; no-op in prod.
3. **`logger.error(msg, errOrCtx?)`** — `console.error` in dev; **Sentry.captureException** in prod. No PostHog event for errors — Sentry is the error rail; PostHog is the product analytics rail.

**Why.** Routing every info-level log line through PostHog would:
- Burn 5-10x the event quota at scale (50k+ events/mo from logs at 1k MAU)
- Pollute funnel/analytics streams so every product-event filter requires `NOT log_*` prefixes
- Conflate operational logging (debug context) with product analytics (user behavior)

If we later need cross-rail operational breadcrumbs (e.g., "user clicked X → API call took N ms → response had property Y"), Sentry provides `Sentry.addBreadcrumb()` for exactly that — it attaches to error reports without burning PostHog quota. We add that pattern when there's a real debugging need; R0-M4 deliberately doesn't.

**Affected.**
- `lib/logger.ts` — three-method signature, prod behavior per above
- `lib/events.ts` — exports `Events` taxonomy; only product analytics events go here
- `lib/telemetry.ts` — facade with `track()`, `captureException()`, `identify()`; the only file (outside `lib/posthog.ts` and `lib/sentry.ts`) that imports the SDKs
- All R1+ feature code uses `logger.*` for diagnostics and `track(Events.X)` for product events; never imports PostHog/Sentry SDKs directly

**Reversal cost.** Low pre-R3. Adding `log_info` → PostHog would be a 5-line change to `lib/logger.ts`; tests would need updating. Don't reverse without a real cross-rail debugging need.

---

## D-022 — Two-contributor model (Anton + kidem42)

**Date:** 2026-05-12
**Status:** Accepted

**Context.** Petsona is gaining a second contributor as of 2026-05-12: kidem42 (GitHub handle). Until now, Anton has been the sole human contributor on the repo, working with the Claude Code agent and Claude.ai. The validation ladder, hard rules, and ADRs were designed under a single-contributor assumption (see D-010 on tooling, D-011 on single-repo). With two humans now committing, we need an explicit role split so review routing, branch naming, and merge expectations don't collide.

The split is locked before any of kidem42's code lands. Roles are based on Anton's existing strengths (client UI/UX, product) and kidem42 being full-stack but scoped to the AI gateway layer (edge functions, prompts, `ai_jobs`) — exactly where Anton has the least desire to own day-to-day.

**Decision.**

**Role split by path:**

| Area | Owner | Paths |
|---|---|---|
| Client UI/UX | anton-glance | `/app/`, `/components/`, `/lib/`, `/locales/`, `/assets/` |
| AI pipeline | kidem42 | `/supabase/functions/` (edge functions, prompts, `_shared/ai/`, `_shared/logging.ts`) |
| Shared infrastructure | both | `/supabase/migrations/`, `/shared/`, `/docs/`, `/.github/`, `/CLAUDE.md` |

**CODEOWNERS routes review automatically.** `.github/CODEOWNERS` (added in this change) auto-requests the right reviewer on every PR based on which paths the PR touches. PRs touching multiple areas request multiple reviewers; PRs touching only one area request only that area's owner.

**Branch protection: required approvals = 0, CODEOWNERS auto-request enabled.** Anton and kidem42 work in the same timezone window but asynchronously; requiring approvals up-front would create idle blocking time. CODEOWNERS still auto-requests review on every PR, so the right person sees it — but the PR author can merge after CI passes without waiting for a review-button click. This is a deliberate trust-the-three-phase-workflow choice; flip to required-1 later if a PR merges without genuine review. The "Require review from Code Owners" toggle in the main-protection ruleset must be on for CODEOWNERS auto-request to work (Anton's post-merge click — see R0 follow-up in `04_BACKLOG.md`).

**Branch naming: `{handle}/{module-id}-{slug}`.** The handle is whoever ran the current agent session: `anton-glance` shortens to `anton`; `kidem42` stays `kidem42`. Examples: `anton/r1-m2-camera`, `kidem42/r2-m1-medcard-ocr`, `anton/r0-followup-two-contributor` (this change). Never commit directly to `main` — branch protection (once enforced, per the R0-M1 → R0 follow-up item) rejects direct pushes. Documented in `01_AGENT_INSTRUCTIONS.md` and the 2026-05-12 entry in `07_TROUBLESHOOTING.md`.

**Both contributors run Claude Code agents under the existing workflow.** The three-phase plan/implement/self-review process in `01_AGENT_INSTRUCTIONS.md` is unchanged. Both Anton and kidem42 run the agent under those rules and review each other's agent output. Architecture decisions still gate through Claude.ai via either contributor. Product decisions remain Anton's call as Chief of Product.

**Consequences.**

- The "Require review from Code Owners" toggle on the main-protection ruleset is the one extra click that makes CODEOWNERS auto-request actionable. Listed as a sub-item under the kidem42 onboarding checklist in `04_BACKLOG.md`.
- kidem42 needs collaborator access on the repo plus invites to every service that holds production credentials: Supabase project `hkhzukxmonlgzzmuqvvp`, EAS org, Apple Developer team (once kidem42 has an Apple Developer account), Google Play Console (once Anton's developer account clears Google verification), PostHog project `Petsona`, Sentry org `exicore`. Tracked as a single onboarding checklist item in `04_BACKLOG.md` under R0 follow-up.
- The agent's verification rule (run `pnpm typecheck && pnpm test && pnpm lint` after every meaningful change) is unchanged — both contributors' agent sessions hit the same gate.
- Release quality gates per `04_BACKLOG.md` are unchanged: each contributor signs off on their own work, and both Anton and Claude.ai must be comfortable proceeding to the next release. Adding a second human doesn't loosen the gate; it just means review of in-progress milestones is naturally distributed by area.
- Service-role isolation precedent from D-020 stays load-bearing: kidem42's AI-pipeline work routinely touches the elevated-privilege boundary in `_shared/logging.ts`, so the audit-able single-file pattern matters more, not less, with a second contributor.

**Reversal cost.** Low. To revert: delete `.github/CODEOWNERS`, remove kidem42 from the repo collaborators, undo the "Require review from Code Owners" toggle. None of these are baked into code or migrations. Branch-naming convention has no enforcement — it's a discipline rule, not a hook.

---

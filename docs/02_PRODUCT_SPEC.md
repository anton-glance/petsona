# 02 — Product Spec

> Anton owns this document as Chief of Product. This is a draft seeded from the architecture conversation on 2026-05-09. It will be refined as Anton confirms scope, copy, and screen flows. Sections marked `[NEEDS PRODUCT INPUT]` await Anton's decisions.

---

## What Petsona is

Petsona is a cross-platform mobile app for dog and cat owners. The owner snaps a photo of their pet, the app recognizes species and breed, scans the medical card from the vet to extract structured records, asks a short survey about the pet's life, and generates a week-by-week, actionable care plan. The medical card becomes the owner's source of truth — to consult between vet visits and to share when visiting a new vet.

## Audience

North America first: US, Canada, Mexico. Three locales at launch: English, Spanish, Russian. Targeting the pet owner who:
- Wants a single place for their pet's information
- Forgets things between vet visits
- Wants actionable guidance, not generic articles

## What Petsona is not

- Not a regulated medical app (no HIPAA, no integration with clinical systems)
- Not a vet replacement
- Not a marketplace, social network, or product-buying app
- Not a multi-pet or multi-user product in MVP — single pet, single account

## Core value proposition

> *"In five minutes, I have a personalized week-by-week plan for my pet, and I'll never lose its medical history again."*

## MVP scope (locked for R0–R6)

The MVP answers two validation questions in sequence: *will users complete the onboarding flow and convert past a paywall (R0-R4)?* and *do the real models perform well enough to ship and do non-English users complete at parity (R5-R6)?*

In scope:
1. Splash + camera permission with force-settings recovery (steps 1-2)
2. Photo-based species + breed identification (dog/cat) — hardcoded responses R1-R4, real Claude vision at R5 per D-018/D-019
3. Side photo + optional document capture; medical card OCR → structured fields → user edits — hardcoded R1-R4, real Mistral OCR at R5
4. Two-screen survey covering pet behavior/lifestyle
5. Location capture (system permission OR manual ZIP/city across North America)
6. Fake progress screen during plan generation
7. Streaming AI-generated weekly plan (7 days, real Claude Sonnet from R3) with locale-aware output
8. Fake paywall at $5.99/month after partial plan reveal (steps 9-10)
9. Sign-in (Apple, Google, email magic link) with anonymous-to-real account upgrade (step 11)
10. Persistent profile + medical card + plan post-signup
11. Localization to Spanish and Russian (R6)

Out of scope for MVP (in backlog for later):
- Multi-pet households
- Multiple users per pet (sharing)
- Photo-based or text-based triage
- Receipt parsing
- Voice input
- Vet integration (QR code, magic link share, PDF export)
- Real payments (RevenueCat integration)
- Push notifications
- Wearables / activity tracking

## The onboarding flow (happy path)

Locked at 11 steps per D-017 (2026-05-11). Reordering screens before R3 is cheap; after R3 ships, screen order is locked.

1. **Splash** with `[Get Started]` button — Petsona brand. `[NEEDS PRODUCT INPUT: copy, animation, design]`
2. **Camera permission** — explanation screen → `[Allow access]` → iOS/Android system dialog. On deny: force-settings recovery screen with deep-link to Settings; user cannot progress until permission granted (mitigates FM6).
3. **Pet face capture** — "Take a picture of your pet's face." Camera controls + gallery picker fallback.
4. **Side photo + documents** — Side photo of the pet, plus optional document capture (vet passport, DNA test, or other). `[Skip]` allowed for the document.
5. **"Welcome {petname}"** — AI-extracted profile screen. Pre-filled fields: name, breed, gender, age, color, document data (DOB, weight, vaccinations). All fields editable; user confirms.
6. **Survey** — 2 screens covering pet behavior/lifestyle. `[NEEDS PRODUCT INPUT: exact questions]`
7. **Location** — `[Use my location]` (system dialog explains "we'll detect your area and tune the app to local climate") OR manual ZIP/city search (US, Canada, Mexico).
8. **Fake progress** — "Creating profile..." screen with milestone messages ("Analyzing your pet's breed...", "Tailoring activities to {petname}'s age...", "Adapting for your local climate..."). Smooths perceived latency during plan generation. Currently fake-timed; may be hooked to real streaming events later.
9. **Plan snippet preview** — First 2 days of the weekly plan, fully revealed.
10. **Fake paywall** — $5.99/month displayed; `[Unlock]` button. No charge in MVP.
11. **Sign-in** — Apple / Google / email magic link. `linkIdentity` upgrades the anonymous user; same `auth.uid()` preserved. Full plan revealed post-signin.

## Non-functional expectations

- **Time to value:** First piece of plan visible in under 60 seconds from first tap (target). 90 seconds (acceptable).
- **AI cost cap:** $0.10 per full onboarding (target $0.025–0.045 with current model selection).
- **Offline:** Camera capture must work offline; AI calls require network and surface a clear retry state.
- **Localization:** Every user-facing string available in en/es/ru by R6 launch.
- **Accessibility:** `[NEEDS PRODUCT INPUT: WCAG target, dynamic type support level]`

## Failure modes the product is designed against

- **FM1:** User uploads a blurry or non-pet photo and the app silently returns a wrong breed. Mitigation: confidence threshold + "this doesn't look like a pet" branch (validated at R5 real-AI swap-in per D-018).
- **FM2:** OCR misreads the medical card and writes a wrong birthdate or weight. Mitigation: every field is editable in the merged-profile confirmation step before save.
- **FM3:** Plan generation feels generic / not tied to the pet's specifics. Mitigation: full pet profile bundle is passed to the plan prompt (species, breed, age, weight, color, location, survey answers, locale per D-017); model resolves climate context and personalization.
- **FM4:** Paywall conversion tanks because the partial plan didn't show enough value. Mitigation: stream first 2 days fully (not teasers) before paywall.
- **FM5:** User completes onboarding anonymously, abandons, comes back later — and their data is gone. Mitigation: anonymous auth from session start, every write tied to the anonymous `auth.uid()`, link-on-signin upgrades the same account.
- **FM6:** User denies camera permission and reaches a dead-end. Mitigation: dedicated permission-denied recovery screen with deep-link to iOS/Android Settings; user cannot progress past step 2 until permission granted.

## Naming (locked per D-015, D-016)

- **Brand name:** Petsona (in repo, code, marketing, splash)
- **Apple App Store display name:** `Petsona: Your Pet's Profile` (registered 2026-05-09; bare "Petsona" was Apple-soft-blocked)
- **Google Play display name:** TBD on Play Console registration (pending Anton's developer-account verification)
- **Bundle Display Name** (the icon label on the home screen): `Petsona`
- **Bundle ID iOS / applicationId Android:** `com.antonglance.petsona` (collapsed; locked)
- **Repo:** https://github.com/anton-glance/petsona
- **Splash tagline:** "Every pet has a Petsona"

## Paywall (R4 fake paywall; real payments post-R6)

- Displayed price at MVP: **$5.99 / month**
- No real charge in MVP; the paywall validates conversion behavior, not revenue.
- When real payments are wired in (post-R6), this becomes the launch price subject to product review.

## Design

In-progress designs accumulate in `docs/design/` as Anton produces them (logo SVG/PNG variants, brand colors, screen mockups). R1-R3 ship with NativeWind defaults; real design swaps in at R3 or later when designs are ready. The architecture intentionally separates styling from logic so design swaps are token/stylesheet changes, not refactors.

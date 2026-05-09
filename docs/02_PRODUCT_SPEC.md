# 02 — Product Spec

> Anton owns this document as Chief of Product. This is a draft seeded from the architecture conversation on 2026-05-09. It will be refined as Anton confirms scope, copy, and screen flows. Sections marked `[NEEDS PRODUCT INPUT]` await Anton's decisions.

---

## What MyPet is

MyPet is a cross-platform mobile app for dog and cat owners. The owner snaps a photo of their pet, the app recognizes species and breed, scans the medical card from the vet to extract structured records, asks a short survey about the pet's life, and generates a week-by-week, actionable care plan. The medical card becomes the owner's source of truth — to consult between vet visits and to share when visiting a new vet.

## Audience

North America first: US, Canada, Mexico. Three locales at launch: English, Spanish, Russian. Targeting the pet owner who:
- Wants a single place for their pet's information
- Forgets things between vet visits
- Wants actionable guidance, not generic articles

## What MyPet is not

- Not a regulated medical app (no HIPAA, no integration with clinical systems)
- Not a vet replacement
- Not a marketplace, social network, or product-buying app
- Not a multi-pet or multi-user product in MVP — single pet, single account

## Core value proposition

> *"In five minutes, I have a personalized week-by-week plan for my pet, and I'll never lose its medical history again."*

## MVP scope (locked for R0–R4)

The MVP answers: *will users complete the onboarding flow and convert past a paywall?*

In scope:
1. Photo-based species + breed identification (dog/cat)
2. Medical card scan with OCR → structured fields (name, age, weight, vaccinations) → user edits
3. Short survey (location, activity level, behavior flags)
4. Streaming AI-generated weekly plan (7 days, day-by-day actions)
5. Fake paywall after partial plan reveal
6. Sign-in (Apple, Google, email magic link) post-paywall, with anonymous-to-real account upgrade
7. Persistent medical card view post-signup

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

1. **Splash** — `[NEEDS PRODUCT INPUT: copy, animation]`
2. **Photo capture** — Camera screen. User snaps photo of pet.
3. **Breed identification** — App returns species + breed candidates with confidence. User confirms or picks alternative.
4. **Medical card capture** — Camera screen. User photographs card.
5. **Medical card review** — Form pre-filled from OCR. User edits.
6. **Survey** — `[NEEDS PRODUCT INPUT: 3–5 question screens, exact questions]`
7. **Generating plan** — Loading screen with streaming partial plan reveal (first 1–2 days).
8. **Fake paywall** — `[NEEDS PRODUCT INPUT: copy, price displayed]`
9. **Sign-in** — Apple / Google / email magic link.
10. **Full plan** — Persistent. Pet profile + medical card + week-by-week plan.

## Non-functional expectations

- **Time to value:** First piece of plan visible in under 60 seconds from first tap (target). 90 seconds (acceptable).
- **AI cost cap:** $0.10 per full onboarding (target $0.025–0.045 with current model selection).
- **Offline:** Camera capture must work offline; AI calls require network and surface a clear retry state.
- **Localization:** Every user-facing string available in en/es/ru by R5 launch.
- **Accessibility:** `[NEEDS PRODUCT INPUT: WCAG target, dynamic type support level]`

## Failure modes the product is designed against

- **FM1:** User uploads a blurry or non-pet photo and the app silently returns a wrong breed. Mitigation: confidence threshold + "this doesn't look like a pet" branch.
- **FM2:** OCR misreads the medical card and writes a wrong birthdate or weight. Mitigation: every field is editable in a confirmation step before save.
- **FM3:** Plan generation feels generic / not tied to the pet's specifics. Mitigation: prompt includes breed + age + weight + survey answers explicitly; week 1 actions reference the pet by name.
- **FM4:** Paywall conversion tanks because the partial plan didn't show enough value. Mitigation: stream first 2 days fully (not teasers) before paywall.
- **FM5:** User completes onboarding anonymously, abandons, comes back later — and their data is gone. Mitigation: anonymous auth from session start, every write tied to the anonymous `auth.uid()`, link-on-signin upgrades the same account.

## Naming

- Working name: **MyPet**
- App display name in stores: `[NEEDS PRODUCT INPUT — final naming review before R3]`
- Bundle ID iOS: `com.anton-glance.mypet`
- Application ID Android: `com.anton-glance.mypet`
- Repo: https://github.com/anton-glance/mypet

## Paywall (R4 fake paywall, R5+ real paywall)

- Displayed price at MVP: **$5.99 / month**
- No real charge in MVP; the paywall validates conversion behavior, not revenue.
- When real payments are wired in (post-R5), this becomes the launch price subject to product review.

## Design

`[NEEDS PRODUCT INPUT: link to Figma or design HTML in docs/design/]`

When mockups are available, place them in `docs/design/` (HTML or Figma export) and reference from this file.

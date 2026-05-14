# JOURNAL — R0 client foundation in native iOS (post-pivot)

> Opened 2026-05-14 after D-024 (pivot from RN/Expo to native iOS). Closes when all 13 onboarding frames render on Anton's iPhone with design fidelity matching `docs/design/*.html`, no backend wiring.
>
> Supersedes the earlier `JOURNAL_SPIKE_iOS_UI.md` draft, which framed this work as a spike. Per D-024 it isn't — Anton's 3-day empirical evidence on RN/Expo productivity made the pivot a locked direction. This is R0 client foundation.

---

## Validation question

Can the 11-step onboarding flow (13 design frames including the camera-denied edge case and the three states of the photo-collection screen) be rendered in native SwiftUI with full design fidelity to `docs/design/*.html`, including Liquid Glass effects, DM Sans typography, AVFoundation camera capture, and all interactive behaviors (swipe-to-dismiss, segmented controls, single/multi-select option cards, location request, paywall plan selection)?

## Why this isn't a spike

The earlier "iOS UI shell spike" framing assumed the pivot itself was provisional. Per D-024 it isn't. The work bundle here is R0 client foundation in the new stack, with R0's original validation question ("ship to TestFlight with anonymous auth + one Supabase round-trip") preserved minus its Android half. Backend integration is sequenced after the visual flow is complete — same flow as the original plan, just on the new stack.

## Scope — all 13 frames

| D-017 step | Design frame | SwiftUI view |
|---|---|---|
| 1 — Splash | `01_splash.html` | `WelcomeView` |
| 2 — Camera permission | `02_camera_permission.html` | `CameraExplainerView` |
| 2 edge | `02b_permission_denied.html` | `CameraPermissionDeniedView` |
| 3 — Pet face capture | `03_camera_capture.html` | `CameraCaptureView` (parameterized for front / side / vet doc) |
| 4 — Side + docs collection | `04_photo_collection.html` (3 states) | `PhotoCollectionView` (3 states driven by which slots are filled) |
| 5 — AI-extracted profile (WOW) | `05_ai_review.html` | `ProfileReviewView` |
| 6 — Survey #1 (personality) | `06_personality.html` | `PersonalityView` |
| 6 — Survey #2 (goals) | `07_goals.html` | `GoalsView` |
| 7 — Location | `08_location.html` | `LocationView` |
| 8 — Fake progress | `09_generating.html` | `GeneratingView` |
| 9 — Plan snippet preview | `10_petsona_ready.html` | `PetsonaReadyView` |
| 10 — Fake paywall | `11_paywall.html` | `PaywallView` |
| 11 — Sign-in | `12_signin.html` | `SignInView` |

D-017 collapses the two survey screens (personality + goals) into "step 6"; the design has them as separate frames. 11 logical steps over 13 rendered frames.

## Phase plan — incremental commits with pause points

Anton can pause and ship between phases. Each phase has a clean stopping point with its own visual diff.

### Phase 0 — Foundation (1.5–2h)
- Xcode project at `ios/Petsona/`, bundle ID `com.antonglance.petsona`, iOS 17 deployment target, Swift 6
- DM Sans 400/500/600/700 embedded
- `DesignSystem/Colors.swift` — every token from `docs/design/tokens.css` ported to `Color` extensions
- `DesignSystem/Typography.swift` — six pair-typography variants (displayXl, displayLg, displayMd, bodyLg, body, caption)
- `DesignSystem/Spacing.swift`, `BorderRadius.swift`
- `DesignSystem/GlassMaterial.swift` — SwiftUI Material wrapper with brand-tint overlay; reduce-transparency aware
- `DesignSystem/Motion.swift` — duration + easing tokens; reduce-motion aware
- `Components/` — primitive ports:
  - `PrimaryButton`, `OutlineButton`, `TextButton`, `DarkButton`, `SecondaryButton`
  - `IconButton`, `BackButton`, `ShutterButton`
  - `Pill`, `SmallCap`
  - `ProgressDots`, `Progress` (linear bar with paw-end), `Spinner`
  - `Card`, `ScreenContainer`, `CtaStack`
  - `PawCheckbox` (circular + square variants)
  - `Segmented`
  - `Input` (text), `NumberInput` (number-only with unit dropdown)
- `Resources/Localizable.xcstrings` with en filled, es/ru placeholder
- `Resources/Assets.xcassets` populated from `assets/brand/`
- Tests: unit tests for every token + every primitive's variants
- **Pause point.** Anton reviews, confirms tokens and components are right, commits.

### Phase 1 — Onboarding flow part A (screens 01-05, 3-4h)
- `Features/Onboarding/OnboardingCoordinator.swift` (`@Observable`, `NavigationPath`-driven)
- `Models/` — `PhotoSlot`, `CapturedPhotos`, `PetProfile`, `Gender`, `WeightUnit`, `VetRecord`, `VetRecordKind`, mock data (`PetProfile.mochi`)
- Screen views:
  - `WelcomeView` — splash with logo, copy, primary CTA, terms footnote
  - `CameraExplainerView` — two benefit rows, camera preview placeholder, primary CTA triggering real `AVCaptureDevice.requestAccess(for: .video)`
  - `CameraPermissionDeniedView` — slash-camera SVG, 3-step instructions, Settings deep-link via `UIApplication.shared.open(URL(string: UIApplication.openSettingsURLString)!)`, "Already granted. Try again" re-check
  - `CameraCaptureView` — AVFoundation `AVCaptureSession` real on device, `#if targetEnvironment(simulator)` placeholder. Parameterized: `.front` / `.side` / `.document`. Top pill reflects "Photo N of 3 · {label}"
  - `PhotoCollectionView` — 3 states driven by `CapturedPhotos`. Front-captured → side row active. Side-captured → vet doc row active. All-captured → processing spinner replaces "Meet Mochi" button for 2.5s, auto-advances to ProfileReview. Each photo row tappable AND primary CTA both navigate to camera with correct slot.
  - `ProfileReviewView` — front photo as hero background, profile card with swipe-to-dismiss (DragGesture honoring the body content), Hey {name} headline, editable fields (Breed text, Name text, Gender Segmented, Age Picker, Weight NumberInput + unit dropdown, Color dropdown), vet records section with row-delete X
- Tests: `OnboardingCoordinator` state transitions, photo slot routing, profile edit mutation, vet record removal. XCUITest happy path + permission-denied path.
- Visual diff: 8 simulator screenshots placed under `ios/Petsona/Petsona/Resources/SpikeScreenshots/`
- **Pause point.** Anton tests on device (the camera path needs device), confirms fidelity vs `docs/design/01_splash.html` through `05_ai_review.html`, commits.

### Phase 2 — Onboarding flow part B (screens 06-09, 2-3h)
- `Features/Onboarding/PersonalityView.swift` — single-select option cards with circular paw-checkbox, primary CTA enabled when one option selected
- `Features/Onboarding/GoalsView.swift` — multi-select option cards with square paw-checkbox, CTA label updates to "Continue · N selected" dynamically
- `Features/Onboarding/LocationView.swift` — "Use my location" tappable row triggers `CLLocationManager.requestWhenInUseAuthorization` and `requestLocation` (no reverse-geocoding; capture coordinate to coordinator). "or enter manually" divider + Input for city/ZIP. Primary CTA active when either path provides a value.
- `Features/Onboarding/GeneratingView.swift` — cat/dog silhouette in photo-round (driven by species mock), Building {name}'s Petsona headline, lede with species-aware copy, progress bar at 60% with paw-end glyph, 4-item gen-list (2 stamped complete, 2 pending, last with dashed border at 0.5 opacity). Total duration ~6s, auto-advances to PetsonaReady.
- Survey state persists in coordinator across navigation (back-button preserves selections)
- Visual diff: 4 more screenshots
- **Pause point.** Anton confirms.

### Phase 3 — Onboarding flow part C (screens 10-12, 2h)
- `Features/Onboarding/PetsonaReadyView.swift` — insight hero card with climate-aware headline (species-mock driven), watch-chips row with hairball-patterns vs joint-health swapping on species, primary CTA
- `Features/Onboarding/PaywallView.swift` — benefit lines with paw-icon marks, two plan cards (Monthly $5.99 / Yearly TBD) with selection state on tap, primary CTA "Start now" + text CTA "Continue limited but free"
- `Features/Onboarding/SignInView.swift` — pet-pattern background, photo-round with species silhouette, headline, three sign-in buttons (Apple dark, Google outline with multi-color logo, email secondary), "Already have an account? Log in" link, footnote
- Visual diff: 3 more screenshots
- **Verdict point.** Full 13-frame flow runs end-to-end on Anton's iPhone. Anton records verdict in this file.

## Out of scope

- No Supabase. No backend. No edge function calls. (Comes after this work bundle, sequenced per the updated R0/R1 plan.)
- No real auth. Sign-in buttons fire stub closures.
- No reverse-geocoding. CoreLocation coordinate captured raw.
- No persistence to disk. In-memory `@Observable` only.
- No real AI. Generating screen is a timed animation; the profile is hardcoded `PetProfile.mochi`.
- No analytics, no Sentry. Wired in post-pivot R0 work.
- No es/ru translations. Keys present, values empty.
- No App Store submission. Direct install via Xcode + TestFlight from Anton's machine.
- No Android.

## Test plan — Anton runs on his iPhone

After Phase 3 only (or earlier per-phase if Anton wants intermediate device tests):

1. App installs via Xcode direct-install. Launch on real iPhone, iOS 17+.
2. Welcome → "Get started" → CameraExplainer
3. CameraExplainer → "Allow access" → real iOS permission dialog. Deny.
4. CameraPermissionDenied renders. "Open Settings" opens iOS Settings at Petsona. "Already granted. Try again" re-checks.
5. Reset, allow camera.
6. CameraCapture (Front pill). Shutter. → PhotoCollection state 1 (front thumbnail filled, side row active).
7. Tap "Side photo" row OR "Capture side photo" CTA. Both → CameraCapture (Side pill).
8. Shutter. → PhotoCollection state 2 (front + side filled, vet doc row active).
9. "Capture document" → CameraCapture (Document pill).
10. Shutter. → PhotoCollection state 3 (all filled, spinner runs 2.5s) → ProfileReview.
11. ProfileReview: front photo as background. Swipe down on card → photo revealed. Swipe up → card restored.
12. Edit Breed, Name. Toggle Gender. Open Age picker. Type Weight, switch unit. Open Color dropdown. Delete one vet row.
13. "Welcome Mochi" → Personality. Select an option. Continue → Goals.
14. Multi-select on Goals; CTA label updates "Continue · N selected". Continue → Location.
15. "Use my location" → system dialog. Allow OR manually enter "98101". Continue → Generating.
16. Generating animates ~6s → PetsonaReady.
17. "Let's go" → Paywall. Tap Yearly card; selection state moves. Tap Monthly. → Sign-in.
18. Tap each sign-in button; verify each fires a stub (logs to console or shows a toast).

## Acceptance criteria per phase

- **Phase 0:** `xcodebuild build && xcodebuild test` green; design-system unit tests cover every token + every component primitive's documented variants
- **Phase 1:** 8 frames render with design fidelity (visual diff vs `docs/design/*.html`); coordinator state transitions correct; permission-denied path works; XCUITest covers happy + denied
- **Phase 2:** 4 frames render and navigate; survey selection persists across navigation; location request flow works; generating animation auto-advances
- **Phase 3:** 3 frames render; full 13-frame flow runs end-to-end on Anton's iPhone; visual-diff screenshots present for all 13

## Verdict

- [ ] Phase 0 complete
- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Full flow tested on Anton's iPhone with design fidelity matching `docs/design/*.html`

## Time accounting

| Phase | Estimate | Actual | Variance + reason |
|---|---|---|---|
| Phase 0 — Foundation | 1.5–2h | — | — |
| Phase 1 — Screens 01-05 | 3–4h | — | — |
| Phase 2 — Screens 06-09 | 2–3h | — | — |
| Phase 3 — Screens 10-12 | 2h | — | — |
| **Total** | **8.5–11h** | — | — |

Architect-side session start: 2026-05-14 15:34 UTC.
Filled per phase by the agent at session close.

## Lessons learned

*(Filled at flow close.)*

## What changed in the docs this session

- Created `D-024_pivot_to_native_ios.md` (standalone; supersedes the earlier draft `D-014_pivot_to_native_ios.md`, which is removed from the branch in the same commit)
- Created `docs/JOURNAL_R0_PIVOT.md` (this file; supersedes the earlier draft `docs/JOURNAL_SPIKE_iOS_UI.md`, which is removed from the branch in the same commit)
- Created `prompts/Petsona-iOS-Foundation_agent_prompt.md` (supersedes the earlier draft `prompts/Spike-iOS-UI_agent_prompt.md`, which is removed from the branch in the same commit)
- Pending next session: full rewrites of `02_PRODUCT_SPEC.md`, `03_ARCHITECTURE.md`, `04_BACKLOG.md`, `06_DECISIONS.md` (splice D-024, amend D-001/D-022/D-023), `CLAUDE.md`, `01_AGENT_INSTRUCTIONS.md`, `05_HISTORY.md`, `08_TIME_LEDGER.md`, `README.md`, and `.github/CODEOWNERS`

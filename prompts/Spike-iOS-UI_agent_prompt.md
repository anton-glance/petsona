# Spike-iOS-UI: First 8 onboarding screens, native SwiftUI

> Paste this prompt into Claude Code in Xcode after `git checkout -b ios-native-spike` from `main`.

---

## Context (read first, in this order)

Read these files before writing anything. Do not skim. If any file is missing or empty, stop and report.

1. `/Users/antonglance/coding/petsona/CLAUDE.md` — your full operating instructions
2. `/Users/antonglance/coding/petsona/docs/06_DECISIONS.md` — read **D-014** in particular (the pivot to native iOS). If D-014 is not yet in this file, also read `/Users/antonglance/coding/petsona/D-014_pivot_to_native_ios.md` at the repo root, which is the new ADR awaiting merge.
3. `/Users/antonglance/coding/petsona/docs/JOURNAL_SPIKE_iOS_UI.md` — this spike's scope and test plan. Authoritative for what's in and out of scope.
4. `/Users/antonglance/coding/petsona/docs/design/index.html` — the full design board, all 12 onboarding screens + edge case + 3 collection states
5. `/Users/antonglance/coding/petsona/docs/design/tokens.css` — design tokens
6. `/Users/antonglance/coding/petsona/docs/design/components.css` — component styles
7. `/Users/antonglance/coding/petsona/docs/design/screens.css` — per-screen layout rules
8. Individual screen HTMLs under `/Users/antonglance/coding/petsona/docs/design/`: `01_splash.html`, `02_camera_permission.html`, `02b_permission_denied.html`, `03_camera_capture.html`, `04_photo_collection.html`, `05_ai_review.html` — read each before implementing its SwiftUI equivalent
9. Brand assets under `/Users/antonglance/coding/petsona/docs/design/brand/` — wordmark + monochrome icon SVGs/PNGs

**What this is.** A spike to validate that the native iOS path delivers design fidelity at acceptable productivity. No backend, no AI, no auth, no persistence. Mocked data only. Verdict determines whether R0 is rewritten to commit to native iOS.

**Stack (locked by D-014):**
- Xcode 16+, Swift 6, SwiftUI
- iOS 17+ minimum deployment target
- AVFoundation for camera (no third-party camera wrapper)
- Native String Catalog (`Localizable.xcstrings`) for localization with `String(localized:)`
- No third-party SPM dependencies for the spike. If you believe one is unavoidable, flag it in Phase 1 and wait for approval.

**Branch.** `ios-native-spike`, branched from `main`. Do not touch the Expo scaffold files at the repo root. All new content goes under a new top-level `/ios/` folder.

**Bundle ID:** `com.anton-glance.petsona` (note: not `com.anton-glance.mypet`; the project was renamed)

**Stakes if this is wrong:** wasted spike, plus a misled call on whether to commit to native iOS for R0–R5. Not catastrophic, but not free.

---

## Phase 1 — Plan (DO NOT IMPLEMENT YET)

Read every file listed above. Then produce a written plan covering all of the following. Stop after the plan. No code yet.

### 1. Xcode project setup
- Project name: `Petsona`
- Bundle ID: `com.anton-glance.petsona`
- Team-less profile for the spike (Anton will set his team when he opens the project)
- Deployment target: iOS 17.0
- Swift language version: 6
- App icon source: derive a placeholder from `docs/design/brand/` for the spike (Anton will replace before TestFlight)
- DM Sans font embedding: download from Google Fonts (regular, medium, semibold, bold), commit `.ttf` files under `ios/Petsona/Resources/Fonts/`, register via `UIAppFonts` in `Info.plist`

### 2. Files you will create
Exact paths under `ios/Petsona/`. Group by:
- `Petsona.xcodeproj`
- `Petsona/PetsonaApp.swift`
- `Petsona/ContentView.swift` (root container hosting the `OnboardingCoordinator`-driven NavigationStack)
- `Petsona/Features/Onboarding/` (one file per view)
- `Petsona/Features/Onboarding/OnboardingCoordinator.swift`
- `Petsona/Components/` (reusable views)
- `Petsona/DesignSystem/Colors.swift`
- `Petsona/DesignSystem/Typography.swift`
- `Petsona/DesignSystem/Spacing.swift`
- `Petsona/DesignSystem/BorderRadius.swift`
- `Petsona/Models/`
- `Petsona/Resources/Fonts/`
- `Petsona/Resources/Localizable.xcstrings`
- `Petsona/Resources/Assets.xcassets`
- `PetsonaTests/` (XCTest)
- `PetsonaUITests/` (XCUITest)

List every file. Do not list directories without files.

### 3. Design system mapping
Read `tokens.css`. List every CSS custom property (`--honey`, `--honey-dk`, `--honey-tint`, `--forest`, `--forest-dk`, `--ink`, `--muted`, `--rule`, `--ivory`, `--ivory-dim`, `--error`, etc.). For each, record the hex value and the planned `Color` extension name (e.g. `Color.tokenHoney`, `Color.tokenForest`).

For font weights: every weight/size combination used in `components.css` and `screens.css` becomes a `Font` extension (e.g. `Font.displayLarge`, `Font.bodyRegular`, `Font.smallCap`).

For spacing and radii: extract every numeric token (e.g. `--r-pill`) into typed constants.

### 4. Screen-by-screen plan
For each of the 8 screens, list:
- View name (e.g. `WelcomeView`, `CameraExplainerView`, `CameraPermissionDeniedView`, `CameraCaptureView`, `PhotoCollectionView`, `ProfileReviewView`)
- The design HTML it maps to
- Navigation pattern: `NavigationStack` driven by an `@Observable OnboardingCoordinator` (one `OnboardingPath` enum, `coordinator.path: [OnboardingPath]`)
- Specific SwiftUI components needed (call out the non-trivial ones: segmented control on screen 5's Gender field, photo-hero swipe-to-dismiss on screen 5, progress dots on screen 4, dim status bar on screen 3 over the camera preview)

Note: the three states of `PhotoCollectionView` (state 1 = side row active, state 2 = vet doc row active, state 3 = all captured + processing) are a single view driven by which slots in `CapturedPhotos` are filled. Not three separate views.

### 5. Camera plan
- `AVCaptureSession` setup, preview via `UIViewRepresentable`
- Permission flow: `AVCaptureDevice.requestAccess(for: .video)` on first tap of "Allow access"
- Capture flow: `AVCapturePhotoOutput` → delegate → `UIImage`
- Settings deep-link via `UIApplication.shared.open(URL(string: UIApplication.openSettingsURLString)!)`
- Simulator handling: `#if targetEnvironment(simulator)` — show a placeholder rectangle with "Camera unavailable in simulator" text and a "Use mock photo" button that injects a bundled placeholder image. This is the only way to test navigation in the simulator.
- Permission abstraction: a `CameraPermissionProviding` protocol so the UI layer doesn't depend on AVFoundation directly. Real implementation wraps AVFoundation; test double returns canned grant/deny.

### 6. Models
- `PhotoSlot` enum: `.front`, `.side`, `.document`
- `CapturedPhotos` struct: `front: UIImage?`, `side: UIImage?`, `document: UIImage?`
- `PetProfile` struct: `name: String`, `breed: String`, `breedConfidence: Int`, `gender: Gender`, `ageMonths: Int`, `weight: Double`, `weightUnit: WeightUnit`, `color: String`, `vetRecords: [VetRecord]`
- `Gender` enum: `.female`, `.male`
- `WeightUnit` enum: `.kg`, `.lb`
- `VetRecord` struct: `id: UUID`, `kind: VetRecordKind`, `label: String`, `subtitle: String`
- `VetRecordKind` enum: `.vaccination`, `.microchip`, `.other`

### 7. Mock data
Hardcoded `PetProfile.mochi` static instance matching the design (Tabby / Mochi / Female / 4 months / 4.2 kg / Brown tabby / 2 vet rows: "Rabies · Apr 2025 · next Apr 2026" with `.vaccination` kind, and "Microchip · 985 121 047 992 384" with `.microchip` kind).

### 8. Localization
`Localizable.xcstrings` with three locales: en (filled), es (empty values), ru (empty values). Every user-facing string keyed. List the key namespacing convention you'll use (e.g. `onboarding.welcome.title`, `onboarding.camera.allowAccess`).

### 9. Tests
**Unit tests** under `PetsonaTests/`:
- `ColorTokenTests.testHexValuesMatchCSS` — every color extension matches its CSS hex
- `OnboardingCoordinatorTests.testInitialState`
- `OnboardingCoordinatorTests.testFrontPhotoCapturedAdvancesActiveSlotToSide`
- `OnboardingCoordinatorTests.testSidePhotoCapturedAdvancesActiveSlotToDocument`
- `OnboardingCoordinatorTests.testAllThreePhotosCapturedAdvancesToReview`
- `OnboardingCoordinatorTests.testRetakeFrontResetsFrontSlot`
- `OnboardingCoordinatorTests.testProfileEditingMutatesProfile`
- `OnboardingCoordinatorTests.testRemoveVetRecordReducesListByOne`
- `CameraPermissionTests.testGrantedFlowProceeds`
- `CameraPermissionTests.testDeniedFlowRoutesToEdgeCase`

**UI tests** under `PetsonaUITests/`:
- `OnboardingFlowUITests.testHappyPathFromWelcomeToReview` — uses mock-grant permission provider; steps all 8 screens; asserts final screen contains "Hey Mochi"
- `OnboardingFlowUITests.testPermissionDeniedShowsEdgeCase` — uses mock-deny; asserts edge-case view appears and "Open Settings" button exists
- `OnboardingFlowUITests.testSidePhotoRowAndCTABothNavigateToCamera` — covers the spec requirement that the row tap and the CTA produce the same navigation

### 10. Open questions / assumptions
List anything ambiguous in the designs or spec. Examples to consider:
- Vet doc capture: does the camera show the silhouette overlay or not? (Probably not — it's a document, not a pet)
- Screen 5 swipe-to-dismiss: is it the whole card that swipes, or just the photo background? How far down before it commits? (Suggest your default and flag for confirmation.)
- Age picker on screen 5: month-resolution only, or years+months? (Design shows "4 months"; suggest month-only and flag.)
- Color dropdown on screen 5: hardcoded list of common breed colors? Suggest a starter list (e.g. Black, White, Brown tabby, Orange tabby, Tortoiseshell, Calico, Gray, …).
- Vet card section: are there empty/zero states (no vet records)? The spec only shows the populated state.

### 11. Risks / edge cases
List risks. Examples:
- AVFoundation on simulator (covered above with `#if targetEnvironment(simulator)`)
- DM Sans not loading on first build if `UIAppFonts` not registered correctly
- SwiftUI `Picker` behavior across iOS 17 styles
- Swipe-to-dismiss gesture conflicting with the form's vertical scroll
- Camera preview orientation on first launch
- Status-bar dim-overlay on screen 3 (camera screen has a dark background; the 9:41 mock should be white text)

---

**STOP HERE.** Hand the plan to Anton. Do not write implementation code until Anton replies with explicit go-ahead.

---

## Phase 2 — Implement (only after Anton approves the plan)

1. **Branch and tests first.** On `ios-native-spike`:
   - Create the Xcode project structure.
   - Write the failing tests listed in Phase 1 section 9. Run `xcodebuild test`. Confirm they fail for the right reason (compile failure or assertion failure, not setup failure).
   - Commit: `test(ios-spike): add failing tests for onboarding flow`

2. **Implement.** Do NOT modify the tests committed in step 1.
   - Set up Xcode project, deployment target, Swift version, bundle ID.
   - Download and embed DM Sans; register in `Info.plist` via `UIAppFonts`.
   - Build `DesignSystem/` (Colors, Typography, Spacing, BorderRadius).
   - Build reusable components in `Components/`.
   - Build models in `Models/`.
   - Build `OnboardingCoordinator` (`@Observable`).
   - Build each of the 8 screens. Use `Localizable.xcstrings` for every string.
   - Wire `AVCaptureSession` in `CameraCaptureView`, with simulator-conditional placeholder.
   - Wire permission flow with the `CameraPermissionProviding` abstraction.
   - Implement swipe-to-dismiss gesture on the photo hero in `ProfileReviewView`.
   - Implement vet record row deletion (X button → `coordinator.removeVetRecord(id:)`).

3. **Run after every meaningful change:**
   - `xcodebuild -scheme Petsona -destination "platform=iOS Simulator,name=iPhone 16" build`
   - `xcodebuild -scheme Petsona -destination "platform=iOS Simulator,name=iPhone 16" test`
   - If SwiftLint is installed: `swiftlint --strict`. If not, flag it in your report — installing SwiftLint isn't required for the spike but is desirable.

4. Iterate until both build and test pass.

5. **Visual diff:** Take a screenshot of each of the 8 screens from the running simulator (iPhone 16 destination). Place under `ios/Petsona/Resources/SpikeScreenshots/`, named `01_welcome.png`, `02_camera_explainer.png`, `02b_permission_denied.png`, `03_camera_capture_front.png`, `03_camera_capture_side.png`, `04a_collection_state1.png`, `04b_collection_state2.png`, `04c_collection_state3.png`, `05_profile_review.png`.

6. **Commit the implementation in logical chunks:**
   - `feat(ios-spike): xcode project, design system, dm sans`
   - `feat(ios-spike): models + onboarding coordinator`
   - `feat(ios-spike): welcome, camera explainer, permission denied`
   - `feat(ios-spike): camera capture with avfoundation + simulator placeholder`
   - `feat(ios-spike): photo collection (3 states)`
   - `feat(ios-spike): profile review with editable fields and vet records`
   - `feat(ios-spike): localizable.xcstrings (en filled, es/ru placeholder)`
   - `chore(ios-spike): visual-diff screenshots`

---

## Phase 3 — Self-review (mandatory before reporting done)

Re-read the implementation against this checklist and answer in writing:

- [ ] All tests pass on the latest commit on `ios-native-spike`
- [ ] No tests were modified after the initial test commit
- [ ] Acceptance criteria 1–10 below all met (quote each one and explain how)
- [ ] Bundle ID is `com.anton-glance.petsona`
- [ ] Deployment target is iOS 17.0
- [ ] No force-unwraps in app code (`!` only in test fixtures and only with a clear comment justifying it)
- [ ] No `Any`, no `as!` without justification
- [ ] No `print()` in app code (use `os.Logger` if needed, but for this spike there should be no need)
- [ ] No commented-out code
- [ ] All user-facing strings via `String(localized:)` from `Localizable.xcstrings`
- [ ] All color values come from `Color.token...` accessors — no inline hex strings in view code
- [ ] All fonts come from `Font.display...` / `Font.body...` accessors — no inline `.system(size:)` in view code
- [ ] Camera permission flow tested in simulator (mock-grant and mock-deny); noted explicitly that real-device test is required for full sign-off
- [ ] Settings deep-link uses `UIApplication.openSettingsURLString`
- [ ] No Supabase, Anthropic, Mistral, or networking imports added
- [ ] No analytics SDK added
- [ ] No third-party SPM dependencies added (or, if any, flagged with reason)
- [ ] Visual-diff screenshots for all 8 screens present under `ios/Petsona/Resources/SpikeScreenshots/`
- [ ] The Expo scaffold files at the repo root are untouched

---

## Acceptance Criteria

1. App builds cleanly: `xcodebuild -scheme Petsona -destination "platform=iOS Simulator,name=iPhone 16" build` succeeds with no errors and no warnings beyond standard SwiftUI lifecycle ones.
2. All tests green: `xcodebuild -scheme Petsona -destination "platform=iOS Simulator,name=iPhone 16" test`.
3. Happy navigation works in simulator using the mock-grant permission provider: Welcome → Camera explainer → (mock allow) → Camera capture (Front) → Photo collection 4a → Camera capture (Side) → Photo collection 4b → Camera capture (Document) → Photo collection 4c → (2.5s processing) → Profile review.
4. Permission-denied path works in simulator using the mock-deny provider: Welcome → Camera explainer → (mock deny) → Permission denied view, with both CTAs ("Open Settings" and "Already granted. Try again") functional.
5. On Photo collection screens 4a/4b/4c, tapping a not-yet-captured row routes to the camera with the correct slot parameter — identical to tapping the primary CTA.
6. Screen 4c shows a spinner replacing the "Meet Mochi" button for ~2.5s (simulated processing), then auto-advances to screen 5 with no user tap required at that point.
7. Screen 5: front photo appears as the background hero. Profile card hovers over it. Swipe down on the card dismisses it and reveals the full photo. Swipe up restores the card. Every field is editable per spec — Breed (text), Name (text), Gender (segmented), Age (picker), Weight (number-only + lb/kg dropdown), Color (dropdown). Vet rows have a tappable X that removes the row from the in-memory list.
8. All copy comes from `Localizable.xcstrings`. No literal user-facing strings in view bodies.
9. DM Sans renders correctly — confirmed visually on at least the Welcome screen and screen 5.
10. Visual-diff screenshots present under `ios/Petsona/Resources/SpikeScreenshots/` for all 8 screens so Anton can compare side-by-side against `docs/design/*.html` rendered in a browser.

---

## Test Plan (your tests, names and what they verify)

- `ColorTokenTests.testHexValuesMatchCSS` — every token color extension produces the hex matching `docs/design/tokens.css`, via round-trip through `UIColor`
- `OnboardingCoordinatorTests.testInitialState` — coordinator starts at `.welcome`
- `OnboardingCoordinatorTests.testFrontPhotoCapturedAdvancesActiveSlotToSide`
- `OnboardingCoordinatorTests.testSidePhotoCapturedAdvancesActiveSlotToDocument`
- `OnboardingCoordinatorTests.testAllThreePhotosCapturedAdvancesToReview`
- `OnboardingCoordinatorTests.testRetakeFrontResetsFrontSlot`
- `OnboardingCoordinatorTests.testProfileEditingMutatesProfile`
- `OnboardingCoordinatorTests.testRemoveVetRecordReducesListByOne`
- `CameraPermissionTests.testGrantedFlowProceeds`
- `CameraPermissionTests.testDeniedFlowRoutesToEdgeCase`
- `OnboardingFlowUITests.testHappyPathFromWelcomeToReview` — mocked grant
- `OnboardingFlowUITests.testPermissionDeniedShowsEdgeCase` — mocked deny
- `OnboardingFlowUITests.testSidePhotoRowAndCTABothNavigateToCamera`

Mock permission grant/deny via a `CameraPermissionProviding` protocol and a `MockCameraPermissionProvider` in the test target. Inject via `EnvironmentValues`. Do not spelunk private APIs.

---

## Out of Scope (DO NOT do these)

- No Supabase. No `supabase-swift` package. No edge function calls.
- No Anthropic. No Mistral. No AI calls of any kind.
- No anonymous auth. No `linkIdentity`. No sign-in screens.
- No paywall.
- No persistence to disk, Keychain, UserDefaults, Core Data, or SwiftData. In-memory `@Observable` only.
- No PostHog. No Sentry. No analytics events.
- No Spanish or Russian translations. Keys present, values empty.
- No App Store metadata, no TestFlight upload.
- No accessibility audit beyond Dynamic Type basics (use scalable fonts via the `Font` extensions; don't hardcode point sizes).
- No screens beyond the 8 listed. Steps 06–12 from the design board are deferred.
- No removal of the Expo scaffold files at the repo root — that happens later when this spike merges.

---

## Definition of Done

1. Phase 3 self-review fully checked
2. `xcodebuild ... build` and `xcodebuild ... test` both green on the latest commit on `ios-native-spike`
3. Acceptance criteria 1–10 demonstrably met (build/test output, screenshots, or test logs in the report)
4. Final report posted back per the `01_AGENT_INSTRUCTIONS.md` "Reporting back" structure

---

## Report back format

When you're done with Phase 1 (plan), reply with the plan only — no code.
When you're done with Phase 2+3, reply per the `01_AGENT_INSTRUCTIONS.md` "Reporting back" structure: what you built, tests, self-review checklist filled, verification proof, and anything you'd flag for Anton's review.

# JOURNAL — Spike: iOS UI Shell (Screens 01–05 + edge case + 3 collection states)

> Spike opened on 2026-05-14 after Anton confirmed the native-iOS pivot. Locked by ADR D-014 in `06_DECISIONS.md`.

---

## Validation question

Do the first 8 onboarding screens (5 screens + permission-denied edge case + 3 photo-collection states) render correctly, navigate correctly, and visually match the approved designs on a real iPhone running iOS 17+?

## Why this is a spike, not R0

R0's original validation question (D-001 era) was *"can we ship to TestFlight and Play Internal Testing reliably with anonymous auth and a round-trip to a Supabase Edge Function?"* — superseded by D-014. This spike answers the lower-level question: does the native iOS path deliver design fidelity at acceptable productivity? A successful spike folds into the rewritten R0 plan; it does not skip R0. Telemetry, anonymous auth, and one Supabase round-trip still need to land before R0 closes.

## Scope (in)

Screens, mapped to `docs/design/index.html` board steps:

| App screen | Board step | Notes |
|---|---|---|
| 1. Welcome | Step 01 (`01_splash.html`) | Static |
| 2. Camera explainer | Step 02 (`02_camera_permission.html`) | Triggers real permission request |
| 2b. Permission denied (edge case) | Step 02b (`02b_permission_denied.html`) | Settings deep-link |
| 3. Camera capture | Step 03 (`03_camera_capture.html`) | Parameterized for Front / Side / Vet doc — single view, three invocations |
| 4a. Photo collection state 1 | Step 04 state 1 (`04_photo_collection.html`) | After front captured — side row active |
| 4b. Photo collection state 2 | Step 04 state 2 | After side captured — vet doc row active |
| 4c. Photo collection state 3 | Step 04 state 3 | All captured — processing spinner, auto-advances |
| 5. AI review · "Hey Mochi" | Step 05 (`05_ai_review.html`) | Front photo as background; profile card with editable fields; vet records table with row-delete |

Design system import:
- `docs/design/tokens.css` → `Colors.swift`, `Spacing.swift`, `BorderRadius.swift`
- `docs/design/components.css` → reusable SwiftUI components (PrimaryButton, TextButton, OutlineButton, ProgressDots, SmallCap)
- `docs/design/screens.css` → per-screen layout dimensions
- `docs/design/brand/` → `Assets.xcassets`
- DM Sans embedded as a custom font

Real `AVCaptureSession` on screen 3. Real permission flow. Real Settings deep-link.

All user-facing strings in `Localizable.xcstrings` with en/es/ru keys (en filled, es and ru placeholder).

Mocked profile data on screen 5: Mochi / Tabby / Female / 4 months / 4.2 kg / Brown tabby / 2 vet rows (Rabies + Microchip), exactly matching the design HTML.

XCUITest covering the happy navigation path + the permission-denied path.

## Scope (out)

- No backend. No Supabase, no Anthropic, no Mistral, no networking layer beyond AVFoundation.
- No auth. No anonymous sign-in. No `linkIdentity`.
- No persistence beyond in-memory `@State` / `@Observable`. No UserDefaults, no Keychain, no Core Data, no SwiftData.
- No analytics (PostHog). No Sentry. Added in R0 post-pivot.
- No App Store / TestFlight submission. Direct install via Xcode to Anton's iPhone.
- No accessibility audit beyond Dynamic Type basics.
- No Spanish or Russian translations. Keys present, values empty.
- No screens beyond the 8 listed. Steps 06–12 from the design board are deferred.

## Verdict

- [ ] Pass — fold into R0 plan
- [ ] Pass with caveats — list, then fold into R0 plan
- [ ] Fail — alternative path needed (note what)

To be filled in after Anton tests on his iPhone per the Test Plan below.

## Test plan (Anton runs end-to-end on a real iPhone)

1. App installs via Xcode direct-install. Launch on real iPhone, iOS 17+.
2. Welcome screen renders, "Get started" navigates to screen 2.
3. Screen 2 renders both benefit rows. "Allow access" triggers the real iOS permission dialog.
4. Deny camera in the dialog. Screen 2b renders. "Open Settings" opens the iOS Settings app at Petsona. "Already granted. Try again" re-checks permission state.
5. Reset by re-installing or toggling permission in Settings. Re-launch, allow camera this time.
6. Screen 3 launches with "Photo 1 of 3 · Front" pill. Shutter captures. Returns to screen 4a with the front photo as the thumbnail (replacing the paw placeholder).
7. The "Side photo" row is tappable AND the "Capture side photo" CTA both lead to screen 3 with "Photo 2 of 3 · Side" pill.
8. Capture side photo → screen 4b. "Capture document" → screen 3 with "Photo 3 of 3 · Document" pill.
9. Capture document → screen 4c "Everything captured." Spinner replaces the "Meet Mochi" button for ~2.5s, then auto-navigates to screen 5.
10. Screen 5 renders with the front-captured photo as the background hero. Profile card hovers over it. Swipe down on the card dismisses it and reveals the full photo. Swipe back up restores the card.
11. All editable fields work per spec: Breed (text), Name (text), Gender (segmented switch), Age (picker), Weight (number-only field + lb/kg dropdown), Color (dropdown). Vet rows have a tappable X that removes the row.
12. "Retake" on any photo row in 4a/4b/4c jumps to screen 3 for that specific slot.

## Acceptance criteria

- All 12 test steps pass on Anton's device.
- Design fidelity: brand colors and DM Sans match. Reasonable SwiftUI approximation of the design HTML — not pixel-perfect, but no jarring layout misses.
- Visual diff captured: simulator screenshot of each of the 8 screens placed under `ios/Petsona/Resources/SpikeScreenshots/`; Anton diffs against `docs/design/*.html` rendered locally.
- `xcodebuild -scheme Petsona -destination "platform=iOS Simulator,name=iPhone 16" test` is green.
- No `print`, no force-unwraps in app code, no `Any`, no `as!` without justification.
- All user-facing strings in `Localizable.xcstrings`.

## Time accounting

- Session start: 2026-05-14 15:34 UTC (architect-side, this conversation)
- Spike open commit: *(filled when Phase 2 begins)*
- Spike close commit: *(filled when verdict recorded)*
- Wall-clock total (architect + agent): *(filled)*
- Estimate: 8–12h agent + 2–3 calendar days incl Anton testing
- Variance + reason: *(filled)*

## Lessons learned

*(Filled at spike close.)*

## What changed in the docs this session

- Created `docs/06_DECISIONS.md` entry D-014 (delivered standalone in this session as `D-014_pivot_to_native_ios.md`, to be folded into `06_DECISIONS.md` next session when current state is available)
- Created `docs/JOURNAL_SPIKE_iOS_UI.md` (this file)
- Created `prompts/Spike-iOS-UI_agent_prompt.md` (the agent prompt for Claude Code in Xcode)
- Pending next session: full rewrites of `02_PRODUCT_SPEC.md`, `03_ARCHITECTURE.md`, `04_BACKLOG.md`, `CLAUDE.md`, `01_AGENT_INSTRUCTIONS.md`, `05_HISTORY.md`, `08_TIME_LEDGER.md`, `README.md`, plus the splice of D-014 into `06_DECISIONS.md` and the flip of D-001 status to `REVERSED by D-014`.

## D-014 — Pivot from cross-platform Expo to native iOS (Swift + SwiftUI)

**Date:** 2026-05-14
**Status:** Accepted
**Supersedes:** D-001 (Cross-platform via Expo + React Native + TypeScript) — mark D-001 status as `REVERSED by D-014`
**Partial impact on:**
- D-008 (i18n strategy) — i18next replaced with native iOS String Catalog (`Localizable.xcstrings`) + `String(localized:)`. The locale-aware-AI-prompts half of D-008 stands unchanged.
- D-010 (CI/CD via GitHub Actions + EAS Build) — EAS Build path is dead. CI on PR remains (xcodebuild build + test). TestFlight distribution path TBD in a follow-up ADR at R0 closure (Xcode Cloud vs GitHub Actions + xcodebuild + fastlane).

### Context

R0 was mid-flight on the Expo + React Native + TypeScript stack (D-001). At the doc-set state of 2026-05-09 the rationale for D-001 rested on: (a) Anton wanting iOS + Android in days, (b) Anton's iOS comfort and Android unfamiliarity, (c) Claude Code's TypeScript productivity advantage. Two of those three premises shifted by 2026-05-14:

- Designs landed at production fidelity: 12 onboarding screens + 1 edge case + 3 collection states, with a CSS token system (`tokens.css`, `components.css`, `screens.css`). Matching them in SwiftUI is cheaper than approximating them in NativeWind.
- Anton's iOS comfort + Claude Code's improved Swift/SwiftUI fluency narrow the productivity gap on UI work to near zero.
- R1–R2 (breed ID, OCR) are camera-heavy. Native AVFoundation removes a class of `expo-camera` quirks (HEIC, orientation EXIF, simulator vs device behavior).

Anton's explicit instruction: native iOS, start fresh, iOS-first. Android revisit after R5 verdict.

### Decision

1. **Client platform:** iOS only at MVP. Native Swift + SwiftUI. Xcode 16+, iOS 17+ minimum deployment target.
2. **Camera:** AVFoundation. No third-party camera wrapper.
3. **Localization:** Native iOS String Catalog (`Localizable.xcstrings`) with `String(localized:)`. Three locales from R0 onward: en, es, ru. Replaces i18next as referenced in D-008.
4. **Build & distribution:** Xcode archive → TestFlight for the spike-and-R0 phase. Decision on CI (Xcode Cloud vs GitHub Actions + xcodebuild + fastlane) deferred to a separate ADR at R0 closure.
5. **Backend:** Untouched. Supabase + edge functions + AI gateway pattern (D-002, D-003, D-005, D-006, D-007, D-011) stand. iOS client uses `supabase-swift` when wiring R1 backend.
6. **Telemetry:** PostHog iOS SDK + Sentry Cocoa SDK replace their React Native equivalents. D-009 intent unchanged; only the SDK changes.
7. **Android:** Deferred. Re-evaluated as a separate ADR after R5 verdict. Decision space at that point: native Android in Kotlin/Compose, or cross-platform reconsidered with hard data on iOS conversion.
8. **Repo:** Single repo continues. New top-level `ios/` for the Xcode project. The Expo scaffold (`app.json`, `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `nativewind-env.d.ts`, `i18n.ts`, `i18n.test.ts`, `i18n-resources.d.ts`, `jest.config.js`, `jest.setup.ts`, `eslint.config.js`, `eas.json`, `tsconfig.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.prettierrc`, `.prettierignore`, root `app/`, root `components/`, root `lib/`, root `locales/`, `global.css`, `nativewind-env.d.ts`) is removed from `main` when the iOS-UI spike merges. `supabase/`, `shared/`, `docs/`, `assets/brand/` stay.

### Consequences

- Loses Android coverage at MVP. ~40–50% US Android share, higher in Mexico. R4's paywall-conversion validation runs on iOS-only data. Accepted in exchange for design fidelity, native camera quality, and removal of one platform's worth of edge cases per release.
- ~2–4 hours of Expo scaffold work in R0-M1 sunk. Acceptable.
- R0-M2 Android setup cancelled. iOS portion of R0-M2 stands.
- Backlog (R0–R5) needs a platform refresh — addressed in a follow-up `04_BACKLOG.md` rewrite, not in this ADR.

### Reassess at

- R5 verdict: decide Android path.
- Any time native-iOS productivity drops below estimated rates by more than 25% sustained — would trigger a re-look.

### Follow-up rewrites required (next session)

- `02_PRODUCT_SPEC.md` — drop Android references, note iOS-first
- `03_ARCHITECTURE.md` — client stack section rewritten for SwiftUI; AI gateway and Supabase sections unchanged
- `04_BACKLOG.md` — R0-M2 Android items removed; R1-M3 / R2-M3 / R3-M3 client UI tasks reframed in SwiftUI; estimates adjusted
- `CLAUDE.md` (root) — stack list updated
- `01_AGENT_INSTRUCTIONS.md` — verification commands updated (`xcodebuild test` replaces `pnpm test`, etc); repo layout updated
- `05_HISTORY.md` — pivot entry pointing to D-014 and `JOURNAL_SPIKE_iOS_UI.md`
- `08_TIME_LEDGER.md` — pivot note in pace observations
- `06_DECISIONS.md` — D-001 status flipped to `REVERSED by D-014`; this ADR appended
- `README.md` — stack reference updated

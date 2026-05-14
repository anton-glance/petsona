## D-024 — Pivot from RN/Expo to native iOS (Swift + SwiftUI)

**Date:** 2026-05-14
**Status:** Accepted
**Reverses:** D-001 (Cross-platform via Expo + React Native + TypeScript) — mark D-001 status as `REVERSED by D-024`
**Amends:** D-022 (Two-contributor model — Anton's CODEOWNERS paths shift; kidem42's unchanged), D-023 (Brand identity locked — the RN-side "app-side typed token mirror," "app-side component library," `lib/glass.tsx`, `lib/motion.ts`, `tailwind.config.js` authority lines are superseded by their SwiftUI equivalents; the design-package authorities at `docs/design/` and the brand asset library at `assets/brand/` remain canonical and unchanged), D-010 (EAS Build path dies; TestFlight stays via Xcode archive)

### Context — what changed since D-001 and D-023

D-001 (2026-05-09) was drafted assuming Expo + RN + TypeScript would yield design fidelity at acceptable productivity. D-023 (2026-05-12) appeared to validate that assumption: the design spike shipped a 15-primitive RN component library with 152 passing tests and a clean "yes" verdict.

**D-023's verdict was on the substrate, not on the screens.** That nuance is the load-bearing fact behind this ADR.

Over the three days following D-023 (2026-05-12 through 2026-05-14), Anton (Chief of Product) attempted to build the actual onboarding screens (01-08) in Expo + RN against `docs/design/*.html`. The output was materially off-design. Iterations with the Claude Code agent and the Claude.ai architect did not close the gap. Compounding the problem: Expo's 60-90 minute build/iteration cycle. Every fidelity check costs an hour, multiplied across the dozens of cycles a complex screen needs.

By empirical contrast, Anton's other product (a separate Xcode-native codebase) produces design-faithful screens in a single agent prompt cycle. The productivity asymmetry is observed, not theoretical.

D-023's verdict reflected substrate quality, which is real. It did not — could not, given the spike's scope — capture downstream screen-building productivity in this design system on this platform. That data only became available through Anton's three days of attempted screen work. **Re-running D-001's cost/benefit with the new data, the pivot is correct.**

The architect (Claude.ai) initially pushed back on this pivot on the basis of D-022/D-023/D-017 contradictions. The pushback was based on documented state. It missed the productivity data that hadn't been written down. Recording that here so the same mistake isn't repeated.

### Decision

1. **Client platform.** iOS only at MVP. Native Swift + SwiftUI. Xcode 16+, iOS 17 minimum deployment target. AVFoundation for camera.
2. **Design system.** Re-implemented natively in SwiftUI. Tokens are read from `docs/design/tokens.css` (which remains the canonical authority per D-023, unchanged). The 17 component primitives are ported to SwiftUI equivalents.
3. **Liquid Glass.** SwiftUI `Material` APIs (`.ultraThinMaterial`, `.regularMaterial`, `.thickMaterial`) handle the bulk of the design's glass surfaces in iOS 17. Where the design specifies brand-tinted glass with high saturation (WOW screen hero, paywall card backdrop), a brand-color overlay layers above the Material — same conceptual recipe as the RN `lib/glass.tsx` solution, expressed in SwiftUI. `UIVisualEffectView` via `UIViewRepresentable` is the fallback where Material is insufficient. Reduce-transparency support honored via `@Environment(\.accessibilityReduceTransparency)`.
4. **Motion.** SwiftUI `withAnimation`, `Animation.timingCurve(...)` with the same cubic-bezier coefficients from `tokens.css --motion-ease-*`, and durations from `tokens.css --motion-*`. Reduce-motion support honored via `@Environment(\.accessibilityReduceMotion)`.
5. **Localization.** Native iOS String Catalog (`Localizable.xcstrings`) with `String(localized:)`. Three locales scaffolded from project open: en (filled), es (empty), ru (empty). Replaces i18next as referenced in D-008. The locale-aware-AI-prompts half of D-008 stands.
6. **Hardcoded AI providers (D-019) are unchanged.** Those adapters live in `supabase/functions/_shared/ai/` (Deno, backend) and are platform-agnostic. The iOS client consumes them via the same edge function endpoints.
7. **kidem42's CODEOWNERS paths unchanged.** AI pipeline (`/supabase/functions/`) is platform-agnostic. The two-contributor model survives intact; Anton's CODEOWNERS paths update from `/app/`, `/components/`, `/lib/`, `/locales/`, `/assets/` to `/ios/Petsona/...`.
8. **The RN substrate at `lib/`, `components/`, `app/`, `tailwind.config.js`, `i18n.ts`, `i18n-resources.d.ts`, `i18n.test.ts`, `jest.config.js`, `jest.setup.ts`, `babel.config.js`, `metro.config.js`, `nativewind-env.d.ts`, `eslint.config.js`, `tsconfig.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `eas.json`, `app.json`, `global.css`, `.prettierrc`, `.prettierignore`, root `locales/`, root `package.json` is removed from main** when this branch merges. The brand asset library at `assets/brand/` stays — SwiftUI reads PNG/SVG from the same location, copied into `ios/Petsona/Petsona/Resources/Assets.xcassets`. `supabase/`, `shared/`, `docs/` are unaffected.
9. **Android.** Off-roadmap for MVP. Re-evaluated as a separate ADR after R5 verdict.

### Consequences

- **~8.8h of design-spike substrate work on the RN client side is sunk.** Backend, docs, design-package authority, and 26 brand assets are unaffected.
- **R0's validation question shifts.** Original R0 verdict was "ship to TestFlight + Play Internal Testing with anonymous auth + one Supabase round-trip." Play Internal drops with Android. TestFlight stays. Anonymous auth + Supabase round-trip stays — wired via `supabase-swift` when the client integrates the backend post-pivot.
- **Android coverage lost at MVP.** ~40-50% US share, higher in Mexico. Accepted as the cost of shipping faithful designs on the platform Anton can iterate on fastest. Revisit at R5.
- **D-017's 11-step flow is preserved exactly.** Screen IDs and the persisted state machine continue to reference the same logical steps; only the rendering technology changes.
- **D-022 amendment is mechanical** — CODEOWNERS file edit; no review-process change. kidem42 reviews `/supabase/functions/`; Anton reviews `/ios/`.
- **kidem42 should be informed** — their review surface narrows in scope (no more client-side review requests). Suggest a heads-up message before this branch merges.

### Reassess at

- R5 verdict — decide Android path. Options: native Android in Kotlin/Compose, Flutter, Kotlin Multiplatform with shared SwiftUI/Compose, or accept iOS-only.
- Any time SwiftUI productivity drops below estimated rates by >25% sustained — would trigger a re-look.

### Follow-up rewrites required (next session)

- `02_PRODUCT_SPEC.md` — drop Android references, note iOS-first
- `03_ARCHITECTURE.md` — client stack section rewritten for SwiftUI; AI gateway, Supabase, edge functions unchanged
- `04_BACKLOG.md` — R0-M2 Android items removed; R1-R4 client UI tasks reframed in SwiftUI; estimates adjusted
- `06_DECISIONS.md` — splice in D-024; flip D-001 to `REVERSED by D-024`; amend D-022 entry; amend D-023 entry
- `CLAUDE.md` (root) — stack list updated
- `01_AGENT_INSTRUCTIONS.md` — verification commands updated (`xcodebuild test` replaces `pnpm test`); repo layout updated
- `05_HISTORY.md` — pivot entry pointing to D-024 + `JOURNAL_R0_PIVOT.md`
- `08_TIME_LEDGER.md` — pivot note in pace observations
- `README.md` — stack reference updated
- `.github/CODEOWNERS` — path-routing update

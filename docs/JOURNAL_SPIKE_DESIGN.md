# JOURNAL — Spike: Design system

> Closed 2026-05-12. Inter-release spike between R1-M1 (closed 2026-05-12)
> and R1-M2 (now unblocked).

---

## Validation question

*Does the design package translate cleanly into typed theme + primitives + glass + motion + assets, with no design-vs-implementation gaps that block R1-M2?*

## Verdict

**Yes.** All acceptance criteria from the spike prompt are met:

- ✅ `lib/theme.ts` exists with seven sections (`colors`, `typography`, `spacing`, `radii`, `shadow`, `glass`, plus `fontFamily` and `i18nSlack` helpers), each JSDoc'd, exporting typed values mirrored from `docs/design/tokens.css` (commit `424a435`).
- ✅ `tailwind.config.js` extends the Tailwind theme with the same values. Drift detection lives in `lib/theme.test.ts` (4 parity assertions: `primary`, `surface`, `honey`, `s4`).
- ✅ `components/ui/` contains 15 primitives: `Button`, `Input`, `Card`, `Segmented`, `Pill`, `PawCheckbox`, `IconButton`, `BackButton`, `Progress`, `ProgressDots`, `Spinner`, `TopRow`, `ScreenContainer`, `CtaStack`, `Text` + a barrel `index.ts`. Each has a JSDoc block on the export naming variants, default values, intended use, and tokens consumed.
- ✅ DM Sans 400/500/600/700 loads via `useFonts` in `app/_layout.tsx`. Render gates on `appReady = ready && (fontsLoaded || fontError !== null)`. On font-load failure we render with the system fallback and log the error to Sentry per D-021.
- ✅ `lib/glass.tsx` implements platform-split rendering: iOS real `<BlurView>`, Android opaque RGBA fill (no BlurView), both honoring `AccessibilityInfo.isReduceTransparencyEnabled()`.
- ✅ `lib/motion.ts` exports duration constants + `Easing.bezier(...)`-constructed easings + `useReducedMotion()` hook. `babel.config.js` is verified-unchanged (`git diff babel.config.js` shows zero diff).
- ✅ `assets/brand/` exists at repo root via `git mv` (history preserved). `app.json` references brand icon + splash + adaptive icon + favicon per `docs/design/README.md` §5.
- ✅ `lib/store.ts` has the `species` slice with default `'unknown'`, `setSpecies` setter, `useSpecies()` selector. Smoke screen at `app/index.tsx` has Cat / Dog / Unknown debug toggle that round-trips through the store.
- ✅ ADR D-023 appended to `docs/06_DECISIONS.md`, standalone-readable.
- ✅ F-1 / F-2 / F-4 findings fixed.
- ✅ `04_BACKLOG.md`, `05_HISTORY.md`, `08_TIME_LEDGER.md` reflect the spike's close.
- ✅ Final verification: `pnpm typecheck && pnpm test && pnpm lint && npx expo-doctor` all green. **152 tests across 28 suites pass** (up from 54 tests across 10 suites at baseline — net +98 tests).

---

## What shipped

**Code (lines added, approximate, per `git diff --stat origin/main..HEAD`):** 80 files changed, +2836 insertions, −251 deletions.

**New lib modules:**
- [lib/theme.ts](../lib/theme.ts) — ~250 lines. Tokens + JSDoc + `shadow()` helper.
- [lib/glass.tsx](../lib/glass.tsx) — ~110 lines. `<Glass>` + `useReduceTransparency()`.
- [lib/motion.ts](../lib/motion.ts) — ~70 lines. Tokens + `useReducedMotion()`.

**New component primitives (15):** each is `<Name>.tsx` + `<Name>.test.tsx` at [components/ui/](../components/ui/), plus an [index.ts](../components/ui/index.ts) barrel re-exporting all 15 components and their public types.

**Modified files:**
- [app/_layout.tsx](../app/_layout.tsx) — fonts gate added.
- [app/index.tsx](../app/index.tsx) — species debug toggle appended.
- [app.json](../app.json) — brand icon, splash, adaptive icon wired.
- [lib/store.ts](../lib/store.ts) — species slice + `useSpecies()`.
- [lib/store.test.ts](../lib/store.test.ts) — 4 new species tests.
- [tailwind.config.js](../tailwind.config.js) — `theme.extend` mirrors `lib/theme.ts`.
- [jest.setup.ts](../jest.setup.ts) — inline reanimated mock.
- [locales/en.json](../locales/en.json), [locales/es.json](../locales/es.json), [locales/ru.json](../locales/ru.json) — `smoke.species*` + `common.back` keys.

**Assets moved:** 26 files from `docs/design/assets/brand/` to `assets/brand/` via `git mv` (history preserved). Placeholder `assets/splash-icon.png` deleted.

**Doc updates:**
- ADR D-023 — Brand identity locked — appended to [docs/06_DECISIONS.md](./06_DECISIONS.md).
- F-1 fix: [docs/design/brand/identity.md](./design/brand/identity.md) replaced with 3-line pointer.
- F-2 fixes: stale D-013 → D-023 references in [docs/design/identity.md](./design/identity.md) and [docs/design/README.md](./design/README.md).
- F-4 fix: `--ui` variable comment in [docs/design/tokens.css](./design/tokens.css).
- README §5 location-update sentence.

**New deps (4):**
- `@expo-google-fonts/dm-sans@^0.4.2` — DM Sans 400/500/600/700.
- `expo-blur@~55.0.14` — iOS Liquid Glass blur.
- `expo-linear-gradient@~55.0.13` — brand-gradient progress fill.
- `react-native-svg@15.15.3` — paw glyph and future pet-pattern / icons.
- `@testing-library/react-native@^13.3.3` (devDep) — component tests.

---

## Glass strategy

**iOS path.** Real `<BlurView>` from `expo-blur` with `intensity` and `tint` mapped from theme tokens. An optional brand-tint overlay (`honey` / `forest` / `terra`) and a translucent fill render above the blur. Intensities: thin = 35, regular = 70, thick = 95 (calibrated empirically against the CSS `blur(18/34/48px) saturate(160/180/190%)` recipes in `tokens.css`).

**Android path.** **No BlurView.** A plain `<View>` with the RGBA fill rendered directly via `backgroundColor`. RN's compositor handles alpha — the result is pixel-equivalent to a pre-blend when the parent surface is ivory, and correctly carries through forest/night-tinted parents (e.g. the paywall hero or step-05 WOW moment). No flat-color pre-blend is computed; this is a quiet correction to the Phase 1 prompt's framing (P-1) — direct RGBA on RN handles the case cleanly without manual color math.

**Reduce-transparency handling.** `useReduceTransparency()` subscribes to `AccessibilityInfo.reduceTransparencyChanged`. When it returns `true`:
- iOS suppresses BlurView and renders the opaque-fill code path (same as Android).
- Both platforms use the values from `glass.fillReduced` (`rgba(255,255,255,0.94)` for thin/regular; `0.96` for thick; `rgba(20,19,15,0.92)` for `onDark`).

This matches the CSS `@media (prefers-reduced-transparency: reduce)` block in `tokens.css` exactly.

**`<BlurTargetView>` (the SDK 55 Android-12+ true-blur API) is deliberately NOT adopted.** Reasons: Petsona's design intent under reduced-transparency is already opaque (no design loss); the per-surface wrapper overhead isn't justified at this stage; the `<Glass>` API surface lets us adopt later without breaking any consumer. Future-us: change `lib/glass.tsx`'s Android path; no other file touches.

---

## Motion strategy

**Durations.** Five constants matching `tokens.css --motion-*` exactly: `instant 60` / `fast 150` / `medium 260` / `slow 420` / `languid 700` ms.

**Easings.** Two `Easing.bezier(...)` values built from `react-native-reanimated`'s `Easing`:
- `primary` = `Easing.bezier(0.32, 0.72, 0.0, 1)` — matches `cubic-bezier(0.32, 0.72, 0.0, 1)` from `tokens.css`.
- `out` = `Easing.bezier(0.5, 0.0, 0.4, 1)` — matches `cubic-bezier(0.50, 0.00, 0.4, 1)`.

**Reduce-motion handling.** `useReducedMotion()` subscribes to `AccessibilityInfo.reduceMotionChanged`. Consumers branch on the boolean and either skip the animation or set durations to 0. Button's press-scale and Segmented's pressed-opacity both honor it.

**Babel auto-config (verified).** `babel-preset-expo` auto-adds `react-native-worklets/plugin` when the `react-native-worklets` package is installed. The relevant code is at `node_modules/babel-preset-expo/build/index.js` lines 313-320:

```js
// Automatically add `react-native-reanimated/plugin` when the package is installed.
hasModule('react-native-worklets') && platformOptions.worklets !== false && …
  ? [require('react-native-worklets/plugin')]
  : (hasModule('react-native-reanimated') && … && [require('react-native-reanimated/plugin')])
```

Since `react-native-worklets@0.7.4` is in `package.json`, the plugin is auto-included. **`babel.config.js` is NOT modified** by this spike (`git diff babel.config.js` returns empty). Future contributors: do not add the plugin manually — `babel-preset-expo` warns about duplicates.

**Jest mock.** Reanimated's official `mock.js` recursively imports the live library and crashes in Jest's Node env because worklets-native init fails. We supply an inline mock in `jest.setup.ts` covering the surface that `lib/motion.ts` + components consume: `Easing`, `useSharedValue`, `useAnimatedStyle`, `useDerivedValue`, `withTiming`, `withSpring`, `withDelay`, `runOnJS`, `runOnUI`, `cancelAnimation`. Twenty-two lines, lives next to the existing PostHog and Sentry mocks.

---

## Theme structure

**Two-layer color split.** Raw palette and semantic aliases coexist in one `colors` object:

- **Raw** (21 entries): `honey`, `honeyDark`, `honeySoft`, `honeyTint`, `forest`, `forestDark`, `forestSoft`, `terracotta`, `terracottaDark`, `terracottaSoft`, `ivory`, `ivoryDim`, `night`, `nightElev`, `ink`, `inkSoft`, `muted`, `mutedSoft`, `rule`, `ruleSoft`, `error`, `errorBg`, `white`.
- **Semantic** (~14 entries): `primary`, `primaryPressed`, `primaryOnDark`, `accent`, `accentPressed`, `accentOnDark`, `surface`, `surfaceElev`, `surfaceDim`, `surfaceInverse`, `textDefault`, `textSoft`, `textMuted`, `textInverse`, `textOnPrimary`, `border`, `borderSoft`, `statusDanger`, `statusDangerBg`.

Semantic aliases duplicate hex literals (not `var(--raw)` references) because `as const` preserves literal types only when values are literal. If a brand color ever shifts, both layers move together in one find/replace — a one-line ADR amendment cost we accept.

**Pair typography.** Six variants: `displayXl` (32/38 @600, ls −0.48), `displayLg` (24/30 @600, ls −0.36), `displayMd` (19/26 @600, ls −0.285), `bodyLg` (16/24 @400), `body` (14/21 @400), `caption` (12/16 @600, uppercase, ls +0.72). Letter-spacing values are pre-converted from `em` (CSS) to RN pixels at theme-build time. Each variant is spreadable as a single `style` prop.

**Spacing scale.** `s1 = 4`, `s2 = 8`, `s3 = 12`, `s4 = 16`, `s5 = 24`, `s6 = 32`, `s7 = 48`. Straight mirror of `tokens.css --s1..--s7`.

**Radii.** `xs = 6`, `sm = 10`, `md = 14`, `lg = 20`, `xl = 28`, `pill = 999`.

**Shadows — the design-vs-implementation gap.** CSS multi-layer box-shadows (e.g. `.btn` has 4 layered shadows: inset top-highlight, inset bottom-shadow, outer cast lg, outer cast sm) cannot be reproduced node-by-node in RN. iOS supports one shadow per node; Android supports only `elevation`. **We collapse to a single outer cast per level** (`shadow('sm' | 'md' | 'lg')`) — the inset specular highlight from the design recipes is dropped on Android and approximated via a 0.5px top-border on iOS only when a primitive needs it visibly (none in this spike's component set). This gap is unavoidable given RN's API; documented here so future-us doesn't re-debate it.

---

## Component library conventions

**Variant pattern.** Each primitive that has visual variants exposes them via a single string-enum prop (e.g. `Button.variant: 'primary' | 'secondary' | …`). Tokens drive the variant table:

```ts
const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: { bg: colors.primary, fg: colors.textOnPrimary, shadowKey: 'md', … },
  secondary: { bg: 'transparent', fg: colors.primary, showGlass: true, … },
  …
};
```

A consumer never picks a token; they pick a variant.

**Prop typing pattern.** Every primitive exports its `Props` interface and the variant enum types. The barrel `index.ts` re-exports them so consumer imports stay flat (`import { Button, type ButtonVariant } from '@/components/ui'`). No `any` types in the spike; no `// @ts-ignore`. Compile-time-checked everywhere.

**Docstring pattern.** Each component file opens with a JSDoc block on the export. The block names: (a) the variants and their intended use, (b) which CSS class from `components.css` it mirrors, (c) the tokens consumed. CLAUDE.md's general "no comments" rule is overridden by the spike prompt's documentation principle (P-2 in the plan) — these docstrings exist to serve kidem42's team reading the library cold.

**Test pattern.** Per primitive: (1) renders without crashing with default props; (2) accepts every documented variant; (3) passes through interactive handlers (`onPress`, `onChangeText`, `onChange`); (4) honors disabled state where applicable. Coverage exceeds the floor in several primitives (Button has 11 tests; Text has 12).

---

## Cat/dog adaptive groundwork

**Store slice.** `lib/store.ts` carries `species: 'cat' | 'dog' | 'unknown'` (default `'unknown'`), `setSpecies(s: Species)`, and a `useSpecies()` selector hook. Tested via 4 new tests in `lib/store.test.ts` (default unknown, set to cat, set to dog, set back to unknown).

**Smoke-screen toggle.** Three buttons (Cat / Dog / Unknown) appended to `app/index.tsx` below the existing R0-M4 test-error button. Tapping each one fires `setSpecies(...)` and the current value renders below. Goes away with the rest of the smoke screen at R1-M2.

**Future consumers (not in this spike — handoff for R1-M3+):**
- **R1-M3** sets `species` from the breed-identify response's `species` field after the user confirms the AI extraction on screen 05 (the WOW moment).
- **R2-M2** consumes it in the camera screen's silhouette graphic per step 03's overlay.
- **R3-M4** consumes it for the generating screen's photo round silhouette.
- **R4-M2** consumes it on step 10's species-specific text + watch chip and on step 12's photo round silhouette.
- A future R1-M2 (or later) "pet-pattern background" component reads it and renders cat-mode (fish + cat-head) or dog-mode (bones + dog-head) decoration.

---

## Findings F-1 / F-2 / F-4

**F-1.** `docs/design/brand/identity.md` was byte-identical to `docs/design/identity.md`. Replaced with a 3-line pointer-file. The pointer remains at `docs/design/brand/` so any tooling looking there still finds something authoritative. Commit: `89ef4a1`.

**F-2a.** `docs/design/identity.md` line 223 referenced D-013 ("the locked direction"). D-013 is the Jest framework ADR — the wrong reference. Rewritten to D-023. Date in the line also bumped from `2026-05-11` → `2026-05-12` to reflect the lock date.

**F-2b.** `docs/design/README.md` had two stale D-013 references: §7 step 8 and §8's last line. Both rewritten to D-023.

**F-4.** `docs/design/tokens.css` lines 94-95 had a comment on the `--ui` variable claiming "matches Tailwind/RN spacing convention." The variable is a font-family alias. Comment corrected to "Short alias for the UI font family; retained for legacy template strings."

---

## Phase 1 push-backs and how they resolved

**P-1 (correction to prompt §5 "Android glass-fill colors").** The prompt asked for pre-blended flat-hex Android fallbacks. RN's compositor handles RGBA fills natively over any parent surface; pre-blending would produce wrong colors over forest/night parents (paywall hero, step-05 WOW). **Resolution: render RGBA fill directly on Android via `<View>` with `backgroundColor`. No pre-blend.** Documented in the journal's Glass strategy section; future-us knows the prompt's framing was based on an unnecessary assumption.

**P-2 (documentation tension with CLAUDE.md).** CLAUDE.md says "default to writing no comments"; the spike prompt requires docstrings on every component file. **Resolution: spike prompt overrides for this spike specifically.** Every primitive carries a JSDoc block on the export. The pattern is consistent and minimal; if future component additions follow it, it scales without becoming clutter.

**P-3 (extra deps).** Two Expo modules beyond the prompt's explicit three: `react-native-svg` for the paw glyph + future pet-pattern + icons; `expo-linear-gradient` for the `.progress > span` brand-gradient fill. **Approved as part of plan acceptance; both pinned via `npx expo install`.** Without them, `<PawCheckbox>` would have no check glyph and `<Progress>` would have a flat fill — neither acceptable for the WOW-screen experience R3 needs.

**P-4 (`display-md` letter-spacing).** `tokens.css` was ambiguous on per-size letter-spacing; `components.css` applied `−0.015em` uniformly across the three display sizes. **Resolution: encode `−0.015em` on `displayXl / displayLg / displayMd`; 0 on body sizes; `+0.06em` on caption.** Pre-converted from `em` to RN pixels at theme-build time (e.g. `−0.015 × 32 = −0.48`).

---

## Surprises during implementation

These weren't in the plan but cost time and shape future work:

- **NativeWind v4's JSX-transform hoist.** A `jest.mock('expo-blur', () => { … React.createElement(...) … })` factory crashes because NativeWind compiles `React.createElement` into a CSS Interop wrapper, which the factory hoists as an out-of-scope reference. Fix: use `require()` inside the factory rather than imports. Captured in `lib/glass.test.tsx`'s mock comment.
- **`lib/glass.ts` had to be `.tsx`** because it contains JSX. The plan listed `.ts`; Jest's babel transform rejected it. Renamed during impl.
- **Reanimated's bundled Jest mock recursively imports the live library** and crashes Jest's Node env on worklets-native init. The "official mock" path documented in the Reanimated docs doesn't work in Reanimated 4 + jest-expo 55. Inline mock in `jest.setup.ts` (22 lines) is the fix. Forwarded to anyone who adds a Reanimated-using primitive: extend that mock with the new API surface as you need it.
- **RNTL `getByRole('progressbar')` requires `accessible: true`** on a plain View — the role attribute alone isn't enough. Set on `<Progress>` so the role is matched.
- **`Pressable`'s internal wrapping** means `getByText('foo').parent` doesn't reliably reach the Pressable with `accessibilityState`. Pattern: use `getByRole('tab')` (or similar) and index into the result instead. Applied to Segmented test; future component tests should mirror.
- **`Easing.bezier` returns a function** (not a number / not an object). For type-check purposes the export is `unknown`-shaped through our mock; in real code it's `(t: number) => number`. The token table type is `as const` so consumers see the literal type.
- **`splash-icon.png` orphan.** R0-M2's hotfix added a placeholder splash; the rewire orphaned it. Deletion was straightforward (one `grep` to confirm no other references).

---

## Standalone-readability map

Per the spike's Documentation principle ("every artifact produced is readable as a standalone document by a contributor with no prior context on this project"), here is what a cold reader learns from each artifact alone:

| Artifact | What a cold reader learns from it alone |
|---|---|
| **ADR D-023** (`docs/06_DECISIONS.md`) | The brand-identity lock points, the canonical files, the visual-system summary (color/typography/spacing/shadows/glass/motion/adaptive), what's deferred, and how D-023 relates to D-006/D-008/D-012/D-013/D-021/D-022. |
| **JOURNAL_SPIKE_DESIGN.md** (this file) | The glass strategy (iOS path, Android path, reduce-transparency), the motion strategy (durations, easings, reduce-motion, verified babel auto-config), the theme structure (incl. shadow gap), the component library conventions, the cat/dog adaptive groundwork with R1-M3+ handoff, and the implementation surprises. |
| **`lib/theme.ts`** | The two-layer color model, pair-typography rationale, shadow gap and helper, glass fill semantics, and the drift-detection mechanism. |
| **`lib/glass.tsx`** | iOS path / Android path / reduce-transparency flip / why `<BlurTargetView>` is deferred — all on the export's JSDoc. |
| **`lib/motion.ts`** | Each duration constant's intended use, the bezier curves with source values, the verified babel auto-config. |
| **Each `components/ui/*.tsx` file** | Its variants, intended use per variant, tokens consumed, and the CSS class from `components.css` it mirrors. |

This table is the durable record of standalone-readability — the equivalent verification in the PR description is dropped by squash-merge.

---

## Time accounting

| Module | Estimate | Actual | Notes |
|---|---|---|---|
| Theme + Tailwind | 1.5h | ~1.0h | Plan was sharp; one drift-detection test |
| Primitives + tests | 4.0h | ~3.5h | 15 components, 65 tests, 3 batched red→green cycles |
| Glass + motion + fonts | 2.0h | ~2.0h | Reanimated mock detour ate ~30 min |
| Assets + app.json | 0.5h | ~0.3h | `git mv` was clean |
| Species slice + smoke toggle | 0.5h | ~0.3h | |
| F-1 / F-2 / F-4 fixes | 0.25h | ~0.2h | |
| ADR D-023 + journal + doc updates | 1.25h | ~1.5h | Long-form writing |
| **Spike total** | **~10.0h** | **~8.8h (-12%)** | Under estimate |

Anton-provided active time will replace these per the time-accounting discipline at session close.

---

## What changed in the docs this session

- [docs/06_DECISIONS.md](./06_DECISIONS.md) — appended D-023 (~80 lines including the visual-system summary, deferred-scope notes, and cross-references).
- [docs/JOURNAL_SPIKE_DESIGN.md](./JOURNAL_SPIKE_DESIGN.md) — this file (NEW).
- [docs/04_BACKLOG.md](./04_BACKLOG.md) — "Design spike" entry in "Inter-release spikes" marked ✅; R1-M2 entry's `⏸ BLOCKED on design spike` header removed and replaced with a one-line "spike shipped" note listing the primitives now available.
- [docs/05_HISTORY.md](./05_HISTORY.md) — added a "Design spike ✅" entry under R1 in-progress.
- [docs/08_TIME_LEDGER.md](./08_TIME_LEDGER.md) — new "Inter-release spikes" row in per-release totals, per-session row, 7 per-module rows, refreshed pace observations.
- [docs/design/identity.md](./design/identity.md) — D-013 → D-023 reference fix (F-2a), date bumped to 2026-05-12.
- [docs/design/README.md](./design/README.md) — D-013 → D-023 in §7 step 8 and §8 last line (F-2b); §5 "Expected destination" sentence updated to reflect the asset move.
- [docs/design/brand/identity.md](./design/brand/identity.md) — replaced with a 3-line pointer (F-1).
- [docs/design/tokens.css](./design/tokens.css) — `--ui` comment corrected (F-4).

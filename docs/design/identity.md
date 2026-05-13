# Petsona — Brand identity

> Every pet has a Petsona.

This document is the source of truth for Petsona's visual identity. Source asset (the locked logo) is `docs/design/logo_mockup.png`; all SVG/PNG derivatives in this folder were produced from it.

---

## 1. The brand

**Name.** Petsona (pet + persona).
**Tagline (locked).** _Every pet has a Petsona._
**Voice.** Premium-clean meets playful-quirky. Friendly and modern, never scholarly or fashion-y.
**Animation principle.** Animated everywhere — micro-states, screen transitions, splash. Tokens in `lib/theme.ts`; presets in `lib/motion.ts`.

---

## 2. Logo

The locked Petsona logo is a continuous-line composition: a dog sitting on the left, a cat sitting on the right, their backs touching. Hand-drawn outline style with brush-painted edges.

**Files (brand-colored, transparent bg).**
- `logo-forest.svg` — forest line (default for light surfaces)
- `logo-ivory.svg` — ivory line (use over dark surfaces)
- `logo-honey.svg` — honey line (use over forest)
- `logo-ink.svg` — brand-ink line (single-color print fallback)

**Files (with background, ready-to-place).**
- `logo-on-ivory.svg` / `.png` — forest line on ivory (default)
- `logo-on-forest.svg` / `.png` — ivory line on forest (icon-surface use)
- `logo-on-night.svg` / `.png` — honey line on night (dark-mode hero)

**Files (monochrome, transparent bg — `monochrome/` subfolder).**

Full logo (natural rectangle):
- `monochrome/logo-black.svg` / `.png` — pure #000000
- `monochrome/logo-white.svg` / `.png` — pure #FFFFFF
- `monochrome/logo-forest.svg` / `.png` — brand forest #2D4F3C
- `monochrome/logo-honey.svg` / `.png` — brand honey #D4A248

Square icon (centered with 10% padding):
- `monochrome/icon-black.svg` / `.png`
- `monochrome/icon-white.svg` / `.png`
- `monochrome/icon-forest.svg` / `.png`
- `monochrome/icon-honey.svg` / `.png`

**When to use which.**
- **Forest** on ivory or honey — the default brand mark.
- **Ivory / white** on dark surfaces — forest, night, deep imagery.
- **Honey** on night or deep forest — accent and dark-mode hero use.
- **Black** for print fallback, fax, single-color photocopying.
- **White** on dark print collateral, laser-cutting, embossing.

**Clear space.** Half the height of the dog's head on every side. Below 24px height, drop the cat detail (out of scope for this iteration).

**Min size.** 32px height for the full logo. Below that, use the app icon (the logo cropped + padded on forest).

---

## 3. Wordmark lockup

The logo on the left, "Petsona" in DM Sans SemiBold on the right, baseline aligned with the cap-height of the *P*.

**Files.**
- `wordmark-light.svg` / `.png` — forest logo + forest Petsona on ivory
- `wordmark-dark.svg` / `.png` — honey logo + ivory Petsona on night
- `wordmark-on-forest.svg` / `.png` — ivory logo + ivory Petsona on forest
- `wordmark-honey-bg.svg` / `.png` — forest logo + forest Petsona on honey-soft
- `wordmark-transparent.svg` — forest line + forest Petsona, no background

**Gap between logo and wordmark.** 6% of the wordmark's cap-height. Don't tighten further — the logo needs breathing room.

---

## 4. App icon

Forest backdrop, ivory logo, 14% padding inside the canvas.

**iOS.** `app-icon/icon-master.png` is the 1024 master. Pre-rendered sizes are in the same folder (180, 167, 152, 120, 87, 80, 76, 60, 40, 29, 20).

**Android adaptive.**
- Foreground: `app-icon/android-adaptive-foreground-432.png` (logo only, inside 264dp safe zone)
- Background: `app-icon/android-adaptive-background-432.png` (solid forest)
- Monochrome (Android 13+ themed icons): `app-icon/android-monochrome-432.png`

**Legacy launcher.** `app-icon/android-legacy-512.png`.

**Forbidden.**
- Don't add gradients to the icon.
- Don't add a wordmark to the icon — logo only.
- Don't use ivory as the icon background. The icon backdrop is ALWAYS forest.

---

## 5. Color

### Light mode

| Token | Hex | Use |
|---|---|---|
| `honey` | `#D4A248` | Brand accent. Tags, chips, the logo line in dark mode. |
| `honey-dark` | `#A77E2F` | Honey hover/pressed. |
| `honey-soft` | `#EAD6A0` | Honey-tinted backgrounds. |
| `forest` | `#2D4F3C` | Primary CTA, text emphasis, logo line in light mode. |
| `forest-dark` | `#1F3A2A` | Forest hover/pressed. |
| `forest-soft` | `#79A38A` | Dark-mode primary CTA. |
| `ivory` | `#FBF7EE` | App background. |
| `ivory-dim` | `#F4EEDE` | Subtle surface. |
| `ink` | `#262522` | Primary text. |
| `muted` | `#6E6A5F` | Secondary text. |
| `rule` | `#EAE2CE` | Borders. |
| `error` | `#A8442A` | Error state. |

### Dark mode

| Token | Hex | Use |
|---|---|---|
| `night` | `#15130E` | App background (warm near-black). |
| `night-elev` | `#1E1B14` | Card surface. |
| `forest-soft` | `#79A38A` | **Primary CTA in dark.** |
| `honey` | `#E0B25E` | Brand accent in dark, slightly brighter. |
| `ink-inverse` | `#F1EBDC` | Primary text. |
| `muted-dark` | `#9B9583` | Secondary text. |
| `rule-dark` | `#38332A` | Borders. |

### AA contrast pairs (verified)

**Light:** ink on ivory 13.6:1 (AAA), forest on ivory 8.4:1 (AAA), muted on ivory 5.1:1 (AA Large+), honey-dark on ivory 4.6:1 (AA).
**Dark:** ink-inverse on night 14.1:1 (AAA), forest-soft on night 5.4:1 (AA), honey-dark-mode on night 8.9:1 (AAA).

**Don't:** honey-default on ivory (2.8:1, fails AA — only for decoration or 24px+ bold).

---

## 6. Typography

**Family.** DM Sans (single family, SIL OFL).
**Weights shipped.** 400 Regular · 500 Medium · 600 SemiBold · 700 Bold.
**Loading.** `assets/fonts/DMSans-{weight}.ttf` → `lib/fonts.ts` (`fontMap`) → `useFonts` in `app/_layout.tsx`.

**Scale (5 sizes + caption).**

| Token | Size / lh | Weight | NW class |
|---|---|---|---|
| `display-xl` | 32 / 38 | 600 | `font-display text-[32px] leading-[38px]` |
| `display-lg` | 24 / 30 | 600 | `font-display text-2xl leading-[30px]` |
| `display-md` | 19 / 26 | 600 | `font-display text-[19px] leading-[26px]` |
| `body-lg` | 16 / 24 | 400 | `font-body text-base leading-6` |
| `body` | 14 / 21 | 400 | `font-body text-sm leading-[21px]` |
| `caption` | 12 / 16 | 600 | `font-display text-xs leading-4 uppercase tracking-[0.06em]` |

**Localization slack.** Reserve 30% extra horizontal space on every text container for ES / RU.

---

## 7. Motion

| Token | Duration | Use |
|---|---|---|
| `instant` | 60ms | Tap feedback |
| `fast` | 150ms | Toggles, chips, color shifts |
| `medium` | 260ms | Sheet entrances, screen transitions, card reveals |
| `slow` | 420ms | Splash → app, plan-day reveal |
| `languid` | 700ms | Loading shimmers, decorative motion |

**Easing.**
- Primary: `cubic-bezier(0.32, 0.72, 0.0, 1)` (`motion.easing.petsona`)
- Out: `cubic-bezier(0.5, 0.0, 0.4, 1)` (`motion.easing.petsonaOut`)

**Reduce motion** is respected — every animation drops to instant when the user has it on.

---

## 8. Spacing & radii

Spacing: `4 / 8 / 12 / 16 / 24 / 32 / 48`.
Radii: `xs 6 / sm 10 / md 14 / lg 20 / xl 28 / pill 999`.

---

## 9. Icons

Lucide. Line weight 1.8–2px. Use the React component, not a font file.

---

## 10. File map

```
docs/design/
├── logo_mockup.png                       ← source (locked)
├── identity.md                           ← this doc (mirror at docs/brand/ if needed)
└── brand/
    ├── logo-{forest,ivory,honey,ink}.svg
    ├── logo-on-{ivory,forest,night}.svg + .png
    ├── wordmark-{light,dark,on-forest,honey-bg,transparent}.svg + .png
    ├── app-icon/
    │   ├── icon-master.{svg,png}            (1024)
    │   ├── ios-icon-{1024,180,167,152,120,87,80,76,60,40,29,20}.svg + .png
    │   ├── android-adaptive-foreground-{432,1024}.png + .svg
    │   ├── android-adaptive-background-{432,1024}.png + .svg
    │   ├── android-monochrome-{432}.png + .svg
    │   └── android-legacy-{512}.png + .svg
    ├── splash/
    │   ├── splash.svg + .png + @2x.png
    │   └── splash-dark.svg + .png + @2x.png
    └── favicon/
        ├── favicon.svg
        ├── favicon-{16,32,48,64,180}.png
        └── apple-touch-icon-180.svg + .png
```

---

## 11. License

- DM Sans — SIL Open Font License 1.1.
- Lucide icons — ISC License.
- Petsona logo, wordmark, and app icon — © Petsona. All rights reserved.

---

_Last updated: 2026-05-12. See `docs/06_DECISIONS.md` D-023 for the locked direction._

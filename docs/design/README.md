# Petsona — Onboarding Design Handoff

Locked design package for engineering. Read this file in full before
implementing — it maps every artifact to the code it should produce
and calls out interaction details that aren't visible in the mockups.

Brand identity is the authority: see `identity.md` and `brand-book.html`.
Do not redesign — implement what is here.

---

## 1 · What's in this folder

```
docs/design/
├── README.md                    ← you are here
├── identity.md                  ← brand identity (locked, read-only)
├── brand-book.html              ← visual brand book (locked, read-only)
├── tokens.css                   ← design tokens (colors, type, spacing, radii, shadows, motion, glass)
├── components.css               ← component primitives (Button, Input, Card, Seg, Pill, Checkbox, Progress, Spinner, …)
├── components.html              ← live showcase of every primitive with variants
├── screens.css                  ← per-screen layouts (used by 01-12 files below)
├── 01_splash.html
├── 02_camera_permission.html
├── 02b_permission_denied.html   ← edge case
├── 03_camera_capture.html
├── 04_photo_collection.html     ← shows all 3 states side-by-side (state 1 / 2 / 3)
├── 05_ai_review.html            ← "Hey Mochi" — the WOW moment
├── 06_personality.html
├── 07_goals.html
├── 08_location.html
├── 09_generating.html
├── 10_petsona_ready.html
├── 11_paywall.html
├── 12_signin.html
├── brand/                       ← full brand asset library (source of truth)
└── assets/brand/                ← curated subset for the build (see §5)
```

Every HTML mockup opens directly in the browser — no build step.

---

## 2 · Flow map

| # | File | Step | Purpose / outcome | Routes to |
|---|------|------|-------------------|-----------|
| 01 | `01_splash.html` | Welcome | First impression + Get started CTA | → 02 |
| 02 | `02_camera_permission.html` | Camera permission rationale | Pre-permission explainer **before** the OS prompt | Allow → 03 · Deny → 02b |
| 02b | `02b_permission_denied.html` | OS permission denied (edge) | Settings deep-link + retry | Settings deep-link → out of app · Try again → 03 (if granted) |
| 03 | `03_camera_capture.html` | Photo capture | One UI for all 3 photos (front / side / vet card). Top pill rotates and the silhouette changes per shot. | → 04 |
| 04 | `04_photo_collection.html` | Photo collection list | Shows captured + upcoming photos as glass rows. 3 states. | → 03 (capture next) or → 05 (when all done or vet skipped) |
| 05 | `05_ai_review.html` | AI review (WOW) | Confirms breed + identity from photos; edit fields. **Single most important moment of onboarding.** | → 06 |
| 06 | `06_personality.html` | Personality (single-select) | One personality from 5 options | → 07 |
| 07 | `07_goals.html` | Goals (multi-select) | Multiple goals; CTA shows count | → 08 |
| 08 | `08_location.html` | Location | Device GPS or manual ZIP entry | → 09 |
| 09 | `09_generating.html` | Generating | LLM builds the Petsona profile; auto-advances on completion | → 10 (auto) |
| 10 | `10_petsona_ready.html` | Petsona ready | Personalised insight + watch areas | → 11 |
| 11 | `11_paywall.html` | Paywall | Subscription choice + free path | Start now → IAP → 12 · Free path → 12 with paid features locked |
| 12 | `12_signin.html` | Sign-in | Anonymous-to-account upgrade (D-004) | → app home |

**About step counts.** D-017 references 11 onboarding screens. This handoff
delivers all 11 plus the camera-denied edge case. Step numbering matches the
mockup file numbers (01-12) for traceability.

---

## 3 · Design tokens — `tokens.css`

Single source of truth for visual design. Every primitive is built from these
variables. Mirror them into:

- `lib/theme.ts` — TypeScript object for React Native
- `tailwind.config.js` — Tailwind theme (extends `colors`, `spacing`, `borderRadius`, `boxShadow`, `fontFamily`, `fontSize`, `lineHeight`)

### What's tokenized

| Group | Variables | Notes |
|---|---|---|
| **Color · raw** | `--honey, --honey-dk, --honey-soft, --honey-tint`, `--forest, --forest-dk, --forest-soft`, `--terracotta, --terracotta-dk, --terracotta-soft`, `--ivory, --ivory-dim`, `--night, --night-elev`, `--ink, --ink-soft, --muted, --muted-soft`, `--rule, --rule-soft`, `--error, --error-bg` | All hex values verified against `identity.md` |
| **Color · semantic** | `--color-primary, --color-accent, --color-surface, --color-surface-elev, --color-text-default, --color-text-soft, --color-text-muted, --color-text-inverse, --color-text-on-primary, --color-border, --color-status-danger, …` | Reference raw tokens; use these in components |
| **Typography** | `--font-family-ui` (DM Sans); `--font-weight-{regular,medium,semi,bold}`; type scale: `--type-display-{xl,lg,md}-{size,lh}`, `--type-body-{lg,size}-{size,lh}`, `--type-caption-{size,lh}` | 5 sizes + caption · explicit line-heights for cross-platform parity |
| **Spacing** | `--s1`…`--s7` = 4 / 8 / 12 / 16 / 24 / 32 / 48 | RN spacing scale |
| **Radii** | `--r-xs, --r-sm, --r-md, --r-lg, --r-xl, --r-pill` = 6 / 10 / 14 / 20 / 28 / 999 | Concentric: outer container radius − inner content radius = padding |
| **Shadows** | `--shadow-sm, --shadow-md, --shadow-lg` | Cast-only (no inset) |
| **Motion** | `--motion-{instant,fast,medium,slow,languid}`, `--easing-primary, --easing-out` | Per identity.md §7 |
| **Liquid Glass** | `--glass-blur-{thin,regular,thick}`, `--glass-fill-{thin,regular,thick,on-dark}`, `--glass-tint-{honey,forest,terra}`, `--glass-stroke{,-dim,-dark}`, `--glass-specular`, `--glass-cast-{sm,md,lg}` | Apple Liquid Glass material per `developer.apple.com/documentation/TechnologyOverviews/liquid-glass` |
| **i18n** | `--i18n-slack` = 1.30 | Reserve 30% extra horizontal space for ES/RU per identity.md §6 |

### Accessibility fallbacks

`tokens.css` includes `@media (prefers-reduced-transparency: reduce)` that
collapses glass to opaque ivory, and `@media (prefers-reduced-motion: reduce)`
that drops transitions to ~0ms. Both are Apple's recommended behaviors for
Liquid Glass. Mirror these in React Native via `AccessibilityInfo`.

### Dark mode

`tokens.css` also includes a `@media (prefers-color-scheme: dark)` block that
re-aliases the semantic colors. The raw palette stays the same; only the
mapping shifts.

---

## 4 · Component primitives — `components.css` + `components.html`

Every primitive listed below is shown live in `components.html` with each
variant and a code snippet. Open that file to verify rendering, then mirror
each component in `src/components/ui/`.

| Primitive | Variants | CSS class(es) | Notes |
|---|---|---|---|
| **Button** | primary · secondary · text (ghost) · dark · outline · honey-text | `.btn`, `.btn.secondary`, `.btn.text`, `.btn.dark`, `.btn.outline`, `.btn.honey-text` | Primary is a forest glass capsule (pill radius). `:active` shrinks to 0.985. `:disabled` drops opacity to 0.5. |
| **Input** | default · with label · error state | `.input`, `.input-label`, `.field-row.has-error`, `.input-error` | Wrap in `.field-row`; pair with `.input-label`. |
| **Card** | default · selected · compact | `.card`, `.card.selected`, `.card.compact` | Selection uses honey-tint fill — no border line. |
| **Screen container** | with safe-area + statusbar | `.phone .screen-canvas .screen` + `.statusbar` (`.dim` over dark) | Maps to `<SafeAreaView>` in RN with a custom header for the status bar zone. |
| **Loading spinner** | default · large · on-dark | `.spinner`, `.spinner.lg`, `.spinner.dim` | Plain CSS animation; in RN use `<ActivityIndicator>` with `--color-primary`. |
| **Segmented control** | default · tight · with floating thumb | `.seg`, `.seg.tight`, `button.is-active` | Pill radii; thumb has the same specular recipe as other glass surfaces. |
| **Pill / chip** | inline indicator | `.pill` | Honey-tinted glass. |
| **Checkbox · paw** | round · square · checked | `.checkbox-paw`, `.checkbox-paw-square`, `.checked` | Visual check is the paw glyph (`.paw-icon`). |
| **Progress** | bar · dots | `.progress > span`, `.progress-dots > span.done/.is-active` | Bar fill is a brand-gradient (honey → honey-dark). Dots: 22px inactive, 34px active. |
| **Top-row** | back + dots + counter | `.top-row` (or `.collect .header`, `.survey .top`, `.location .top`) | Grid `1fr auto 1fr` so dots are always at true horizontal centre. |
| **Icon button** | glass capsule | `.iconbtn`, `.back-arrow` | Use `.iconbtn-dark` over dark surfaces (camera screen). |

### Naming map for React Native

Each CSS primitive maps to a single RN component:

| CSS | RN component |
|---|---|
| `.btn`, `.btn.secondary`, etc. | `<Button variant="primary|secondary|text|dark|outline">` |
| `.input` + `.input-label` + `.input-error` | `<Input label="…" error="…" />` |
| `.card`, `.card.selected` | `<Card selected={bool}>` |
| `.seg` | `<Segmented options={[…]} value={…} onChange={…} />` |
| `.spinner` | `<Spinner size="default|lg" tone="default|dim" />` |
| `.checkbox-paw` / `.checkbox-paw-square` | `<PawCheckbox shape="round|square" checked={bool} />` |
| `.pill`, `.watch-chip` | `<Pill>` / `<Chip>` |
| `.iconbtn`, `.back-arrow` | `<IconButton>` / `<BackButton>` |

---

## 5 · Brand assets — `assets/brand/`

Curated subset of the full brand library (which lives in `docs/design/brand/`).
The full library has every iOS size, every Android density, every locale
variant — the agent doesn't need all of them yet.

**Expected destination in the repo:** the Expo standard `/assets/` directory
at the project root (i.e., `petsona/assets/brand/`). Move or symlink this
folder there.

### Contents

| File | Use |
|---|---|
| `logo.svg` | Default brand mark · forest line on transparent (light surfaces) |
| `logo-ivory.svg` | Ivory line · for dark surfaces (forest, night) |
| `logo-honey.svg` | Honey line · dark-mode hero use |
| `logo-ink.svg` | Single-color print fallback |
| `logo-icon-{forest,ivory,honey,ink}.svg` | Square icon variants (centered with padding) |
| `logo-on-ivory.png` / `logo-on-forest.png` / `logo-on-night.png` | Ready-to-place logo + backdrop combos |
| `wordmark.svg` + `.png` | Logo + "Petsona" wordmark · forest on ivory (default) |
| `wordmark-dark.svg` + `.png` | Honey + ivory on night (dark-mode hero) |
| `app-icon-1024.svg` + `.png` | iOS app icon master (1024×1024) — feed to Expo's `app.json` |
| `android-adaptive-foreground-1024.png` | Android adaptive icon foreground layer |
| `android-adaptive-background-1024.png` | Android adaptive icon background layer (solid forest) |
| `android-monochrome-432.png` | Android 13+ themed icon |
| `splash.svg` / `splash-1024.png` | Splash (light mode) |
| `splash-dark.svg` / `splash-dark-1024.png` | Splash (dark mode) |
| `favicon.svg` | SVG favicon (for the web build, if any) |
| `apple-touch-icon-180.png` | iOS home-screen-bookmark icon (web) |

If the agent needs additional sizes (e.g. iOS 20, 29, 40, 60, 76, 80, 87, 120,
152, 167, 180; Android 432×432, 512×512), pull them from `docs/design/brand/`.
They're already pre-rendered and named consistently.

### Expo `app.json` wiring

```jsonc
{
  "expo": {
    "icon": "./assets/brand/app-icon-1024.png",
    "splash": {
      "image": "./assets/brand/splash-1024.png",
      "backgroundColor": "#FBF7EE",
      "resizeMode": "contain"
    },
    "ios": {
      "icon": "./assets/brand/app-icon-1024.png"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/brand/android-adaptive-foreground-1024.png",
        "backgroundImage": "./assets/brand/android-adaptive-background-1024.png",
        "monochromeImage": "./assets/brand/android-monochrome-432.png",
        "backgroundColor": "#2D4F3C"
      }
    }
  }
}
```

---

## 6 · Interaction details — what the mockups don't show

These are the moments where pixels alone aren't enough. The agent should
implement these behaviors.

### Step 01 · Splash
- The Petsona icon performs a brief `medium` (260ms) scale-in from 0.92→1.0 on first paint, then settles. `easing-primary`.
- Subtitle paragraph fades in 100ms after the icon.

### Step 02 · Camera permission
- "Allow access" triggers the OS permission prompt via `expo-camera`.
- On approval → route to 03.
- On denial → route to 02b.
- If permission is `undetermined` and the user backgrounds the app then returns, re-check on focus.

### Step 02b · Permission denied (edge)
- `camera-slash-icon` scales down from 1.0 to ~0.92 on screen mount (`fast`, 150ms) to draw attention to the corrective action below.
- "Open Settings" deep-links via `Linking.openSettings()`.
- "Already granted. Try again" re-checks `Camera.getCameraPermissionsAsync()`. If granted, route to 03. If still denied, shake the camera-slash icon (`fast` translate-X cycle) to signal nothing changed.

### Step 03 · Camera capture
- A single screen renders all 3 photo prompts. The top pill ("Photo 1 of 3 · Front") and the silhouette graphic change per shot.
- The flip-camera button toggles between rear and front cameras (front is rare for pet shots but supported).
- Photo library button opens the system picker via `expo-image-picker`.
- The shutter is a single circle. **No REC indicator, no video.**
- Captured image transitions to step 04 via shared-element animation (the photo morphs into its row in the collection).

### Step 04 · Photo collection
- State 1: front captured, side active. CTA = "Capture side photo".
- State 2: front + side captured, vet card active. CTA = "Capture document". Secondary text-button = "Skip vet docs".
- State 3: all captured. CTA = "Meet Mochi". No skip button.
- Each card's "Retake" link returns to step 03 with the appropriate prompt state.
- "Skip vet docs" appears **only in state 2** — once skipped, the user goes straight to step 05.

### Step 05 · AI review — the WOW moment
- This is the **single most important screen of onboarding**. Treat it with care.
- The photo + paws are confined to the top 1/3 of the screen, tinted forest.
- Title and description ("Hey Mochi 👋 / Here's what we read from your photos.") sit directly on the ivory below the photo, not inside any card.
- Form fields are hairline rows on ivory — no borders, no chrome.
- The form is the **only scrollable region**; status bar and CTA stay pinned.
- The breed value carries an "AI 91%" pill — show actual confidence from the model. If < 60%, hide the pill and prompt the user to verify.
- "From vet card" rows appear only if vet doc was captured/skipped flag is `false`. Otherwise the section is hidden.
- Tapping any field opens the appropriate editor (text input for Name/Weight, segmented for Gender, picker for Age/Color, edit modal for Breed).
- CTA "Welcome Mochi" → step 06.

### Step 06 / 07 · Personality + Goals
- Step 06 is single-select; step 07 is multi-select.
- Round paw-checkbox = single, square paw-checkbox = multi.
- Step 07's CTA shows the running count: "Continue · N selected". Disabled when N = 0.
- The Back button on step 06 routes to step 05.

### Step 08 · Location
- "Use my location" requests OS permission via `expo-location` then resolves to a region-level name only — no precise coordinates persist.
- Manual entry accepts city name OR a 5-digit ZIP code (NA-only initially per i18n scope: US, Canada, Mexico).
- On submit, validate and resolve to climate zone (mild & rainy, coastal humid, etc.). This drives step 10's insight text.

### Step 09 · Generating
- **No CTA.** The screen auto-advances on completion.
- 4 list items: `Identifying breed traits`, `Cross-referencing local climate`, `Generating week 1 care plan…`, `Setting up vet reminders`.
- Each item transitions from `pending` (spinner) to `done` (forest paw stamp).
- Progress bar runs in parallel — width updates per stage completion, with the paw token at the end of the active fill.
- Total wall-time target: 6-10 seconds. If it takes longer than 12s, show a "Hold on, taking longer than usual…" message under the progress bar (don't change layout, just append text).
- On error: surface inline error state with retry; don't navigate away.

### Step 10 · Petsona ready
- The insight hero (terracotta card) carries **one** personalised insight per pet — backend-driven, climate × age × species × breed signature.
- The body text and one watch-chip swap based on species (`.cat-only` vs `.dog-only`). Keep both DOM nodes; toggle display.
- CTA "Let's go ›" routes to step 11.

### Step 11 · Paywall
- The forest backdrop extends through the safe-area zone. Implementation: paint `--forest` from `top: 0` down to ~158px (statusbar + title content), with the radial honey highlight baked into the same paint. Single seamless surface — no seam at the statusbar boundary.
- Status bar text and icons are ivory (`.statusbar.dim`).
- Both plan cards are present. Default selection: Monthly (per D-???). Yearly carries a "Save more" pill — actual savings % is TBD.
- "Continue limited but free" is `.btn.text` styled like "Skip vet docs". Free path routes to step 12 with paid features locked in app state.

### Step 12 · Sign-in
- Anonymous-first per D-004: the user has been using the app since step 01 without an account. This is the upgrade-to-account moment.
- Three providers in order: Apple, Google, Email.
- "Continue with Apple" is `.btn.dark` (true black per Apple HIG); Google is `.btn.outline` (white capsule with brand-colored "G").
- "Already have an account? Log in" routes to a **separate** sign-in flow (existing user, not this onboarding).
- Terms and Privacy are real links — agent: hook them to `expo-web-browser` `openBrowserAsync()` with the legal URLs from `06_DECISIONS.md` D-??? (or env-config).

### Global · cat/dog adaptive theming
- The app stores a `species` flag (cat | dog | unknown). Several elements respect this:
  - **Background pattern** (`.pet-pattern`): cat mode shows fish + cat-head; dog mode shows bones + dog-head. Common to both: paws + hearts.
  - **Step 05 hero silhouette**, **Step 09 photo round silhouette**, **Step 10 species-specific text + watch chip**, **Step 12 photo round silhouette**.
- Default to cat-mode until the user confirms the species (typically inferred from the AI at step 05, otherwise asked).
- Toggling species mode is silent: it changes UI only, no labels, no animations.

### Global · animation principles
- Animate everywhere. Tokens in `tokens.css` (`--motion-*`, `--easing-*`).
- Screen transitions: `medium` (260ms) with `easing-primary`.
- Tap feedback: `instant` (60ms).
- Loading shimmers: `languid` (700ms).
- All animations respect `prefers-reduced-motion`.

### Global · CTA position consistency
- Every primary green CTA sits **16px from the screen edges** — except step 01 (splash) which has a 48px footer for the terms text.
- This is enforced by `padding: 0 var(--s4) var(--s4)` on the screen container (or explicit `bottom: var(--s4)` on absolute-positioned CTAs).
- When implementing in RN, use a shared `<CtaStack>` component to enforce this.

---

## 7 · What to do next

1. **Read `identity.md`** — the brand identity is the constraint. Don't redesign.
2. **Open `components.html`** — confirm primitives render as expected in your browser.
3. **Walk through `01_splash.html` → `12_signin.html`** — confirm visual parity. Note any deltas before starting code.
4. **Mirror `tokens.css` into `lib/theme.ts` and `tailwind.config.js`** — this is the foundation; everything else depends on it.
5. **Build the primitives** in `src/components/ui/` per the map in §4.
6. **Move `assets/brand/`** to the repo's `/assets/` directory and wire `app.json` per §5.
7. **Implement screens 01–12 + 02b** consuming the primitives. Use the interaction notes in §6 — they are the spec.
8. **D-013 in `docs/06_DECISIONS.md`** confirms the locked direction. Update that decision when the implementation is complete.

---

## 8 · License + provenance

- DM Sans — SIL Open Font License 1.1.
- Lucide / Phosphor icon glyphs (only the paw, fish, bone, heart, cat-head, dog-head shapes are used) — open-source.
- Logo, wordmark, app icon, splash — © Petsona. All rights reserved. Source: `logo_mockup.png`. Locked direction: D-013.

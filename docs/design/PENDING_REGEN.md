# Design — pending asset regenerations

> Brand / app assets that need design-side regeneration before they can replace what engineering currently ships. Each entry: what's wrong, what engineering did instead, what design needs to produce.

---

## Splash — dark mode square logo

**What's wrong**
`assets/brand/splash-dark-1024.png` is a 2484×5376 portrait phone mockup, not a square 1024×1024 logo. With `imageWidth: 200` on the `expo-splash-screen` plugin it rendered as a tiny floating logo inside a phone-frame illustration.

**What engineering did instead**
`app.json` drops the `dark` block from the splash plugin (2026-05-13 fixup commit). SDK 55 falls back to the light-mode splash for dark-mode devices: ivory background (`#FBF7EE`) with the forest logo (`app-icon-1024.png`). Functionally fine; visually a brief ivory flash on dark-mode devices before the app renders.

**What design needs to produce**
A square 1024×1024 logo asset suitable for a dark-mode splash. Forest or honey logo over a `colors.night` (`#15130E`) background works; the constraint is that it has to be the same shape as the light-mode square asset so the `imageWidth: 240` setting renders consistently.

Once produced, drop into `docs/design/brand/` first, then `git mv` the relevant size into `assets/brand/splash-dark-1024.png` (or equivalent name) and restore the `dark` block in `app.json`'s splash plugin config.

**Affected releases:** R1 close. Dark-mode-device users see the light splash through R1; not blocking the validation question.

---

## Android adaptive icon — foreground silhouette undersized

**What's wrong**
`assets/brand/android-adaptive-foreground-1024.png` renders the brand silhouette at ~54% of the 1024×1024 canvas (alpha bounding box approximately `(238, 204, 786, 820)` — i.e. the visible mark occupies the central 548×616 region inside the 1024-wide canvas). Per the brand-book reference, the silhouette should fill closer to ~70% of the canvas. On a Pixel 7 the launcher icon reads as a small mark inside an oversized field of green.

**What engineering did instead**
Nothing. This is a raster source-of-truth issue. Engineering can't increase the silhouette size by editing the bytes — the original mark exists at a fixed pixel resolution inside the larger canvas, and naively up-scaling would alias the edges.

**What design needs to produce**
A regenerated `android-adaptive-foreground-1024.png` where the silhouette fills ~70% of the canvas (alpha bounding box closer to `(154, 154, 870, 870)`), centered, with the same transparent background. Adaptive icon spec requires this asset to be 432×432 dp in the rendered launcher, with the OS cropping to circle/squircle/etc.; the 1024×1024 source is what gets bundled.

Once produced, `git mv` into `assets/brand/android-adaptive-foreground-1024.png` (filename stays the same; the asset just gets replaced). No `app.json` change needed — the adaptive-icon config already points at the right path.

**Affected releases:** R1+. Visible on every Android install after the next EAS build. Not blocking R1's validation question but worth fixing before any external testing.

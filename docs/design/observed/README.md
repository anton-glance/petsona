# Observed screenshots

> Side-by-side comparison gate for the R1 visual redo and every visual-touching milestone after it.

For each screen the design team ships in `docs/design/<N>_<screen>.html`, capture a screenshot of the rendered React Native build under this directory. Pair it with the mockup file path in the milestone's Phase 3 report so the visual delta is auditable.

## Capture commands

### iOS simulator
```bash
# Boot the sim and start Expo
npx expo start
# in another terminal — when the screen is rendered:
xcrun simctl io booted screenshot docs/design/observed/01_splash_ios.png
```

### Android (Pixel 7 AVD)
```bash
# With the AVD running and dev build installed
adb exec-out screencap -p > docs/design/observed/01_splash_android.png
```

## Naming convention

`<step>_<name>_<platform>.png`

Examples:
- `01_splash_ios.png` / `01_splash_android.png`
- `02_camera_permission_ios.png` / `02_camera_permission_android.png`
- `02b_permission_denied_ios.png` / `02b_permission_denied_android.png`
- `03_capture_front_ios.png` / `03_capture_front_android.png`
- `03_capture_side_ios.png` / `03_capture_side_android.png`
- `03_capture_document_ios.png` / `03_capture_document_android.png`
- `04_photo_collection_state_1_ios.png` (front captured, side active)
- `04_photo_collection_state_2_ios.png` (front + side captured, document active)
- `04_photo_collection_state_3_ios.png` (all three captured)
- `05_welcome_ios.png` (initial state)
- `05_welcome_saved_ios.png` (after CTA tap → Saved ✓)

## When a screenshot doesn't match the mockup

Phase 3 report calls out the delta in the comparison table: `matches` / `differs in: [specific delta]`. The author either:
1. Fixes the delta in-loop and re-captures, OR
2. Flags it for the reviewer's call with rationale (e.g. "RN can't render the inset specular highlight per CSS recipe — single cast on Android per `lib/theme.ts` `shadow()` helper")

Either way, every "differs in" line is a triable item, not a silent skip.

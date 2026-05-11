# 07 — Troubleshooting

> Symptom + Cause + Resolution log for reproducible bugs that took non-trivial effort to debug. Anything that took us more than 30 minutes to figure out belongs here so we never re-debug it.

---

## Format

Each entry follows this structure:

```markdown
## YYYY-MM-DD — short title

**Symptom**
What we observed. Be specific: error message, what failed, where, on which platform.

**Cause**
Root cause once understood. If it took multiple wrong hypotheses to find, list the dead-ends briefly.

**Resolution**
What fixed it. Code change, config change, dependency bump, etc.

**Prevention**
What we changed to prevent recurrence: a test, a lint rule, a doc note, an `expo-doctor` check.

**Affected modules / releases:** [e.g. R1-M3, breed-identify edge function]
**Time spent:** [rough hours]
```

---

## Entries

## 2026-05-09 — macOS disk pressure cascades to git/build failures

**Symptom**
Mid-R0-M1 implementation, `git commit` failed with `ENOSPC: no space left on device` errors. The Bash tool itself stopped producing output. `df -h /` returned `/dev/disk3s1s1 460Gi 428Gi 139Mi 100%` — system data volume at 100% with ~140Mi free on a 460GB disk. Subsequent shell commands hung or returned nothing.

**Cause**
macOS Xcode `DerivedData/` had accumulated ~10GB across the user's projects. Combined with Claude Code's `/private/tmp/claude-{uid}/` tasks directory (a few hundred MB) and Metro / simulator caches, the data volume hit 100%. Below ~200Mi free, even tiny syscalls (process spawns, lock files, write-output files) fail with ENOSPC.

**Resolution**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```
Freed 9.8 GB. Bash recovered. `git commit --amend` succeeded.

**Prevention**
Pre-flight `df -h /` before any session likely to involve native builds (EAS, simulator, Xcode). Anything under 5Gi available should trigger a `DerivedData/*` clear before proceeding.

**Affected modules / releases:** R0-M1 implementation; recurred in R0-M2 mid-EAS build.
**Time spent:** ~30 min recovery + ~15 min subsequent reorg.

---

## 2026-05-09 — Apple soft-blocks bare "Petsona" as App Store display name

**Symptom**
App Store Connect → My Apps → New App → Name field rejected `Petsona` with the standard "Name unavailable" error, despite no app named "Petsona" appearing in App Store search.

**Cause**
Apple's display-name uniqueness check is global across the App Store and includes historically-reserved names (developers can hold names for up to 180 days via speculative registration; some names linger longer post-delisting). The name lookup is opaque — Apple does not tell you which existing app or reservation holds it.

**Resolution**
Used a differentiated longer form: `Petsona: Your Pet's Profile`. Accepted on first try. Brand name in marketing and the in-app icon label remains `Petsona`; the longer form lives only in App Store listing metadata (separate field from bundle name and Bundle Display Name).

**Prevention**
Before committing to a product name in docs, attempt registration on all three surfaces (Apple Dev App ID, App Store Connect Name, Google Play package) *before* writing docs against the name. D-015's amendment and D-016 document this split.

**Affected modules / releases:** R0-M2 product registration; D-015, D-016 in `06_DECISIONS.md`.
**Time spent:** ~45 min (one round-trip of name selection + retry; bulk of time was Apple's UI walk-through).

---

## 2026-05-09 — Android applicationId rejects dashes

**Symptom**
`npx expo-doctor` failed with `Field: android/package - 'android/package' should be a reverse DNS notation unique name... The name may only contain lowercase and uppercase letters (a-z, A-Z), numbers (0-9) and underscores (_)...` when `app.json` had `"package": "com.anton-glance.petsona"`.

**Cause**
Android's `applicationId` must be a valid Java package name. Hyphens are not allowed in Java identifiers. iOS bundle IDs *do* allow hyphens, but Android's strictness forces parity.

**Resolution**
Collapsed both `ios.bundleIdentifier` and `android.package` to `com.antonglance.petsona`. The GitHub repo URL keeps its dash (`anton-glance/petsona`) because URLs allow them.

**Prevention**
Use Anton's GitHub username minus dashes (or any account-without-dashes namespace) for both bundle ID and applicationId from project setup. Documented in D-014.

**Affected modules / releases:** R0-M1 close; D-014 in `06_DECISIONS.md`.
**Time spent:** ~10 min once diagnosed; the catch by `expo-doctor` was immediate.

---

## 2026-05-09 — macOS process-table exhaustion (`forkpty: Resource temporarily unavailable`)

**Symptom**
Terminal commands returned `__vsc_command_output_start:1: fork failed: resource temporarily unavailable` / `zsh: fork failed: resource temporarily unavailable`. VS Code crashed at launch with an `EXC_BREAKPOINT (SIGTRAP)` in `NSPersistentUIRestorer promptToIgnorePersistentStateWithCrashHistory:`. New Terminal tabs failed to spawn. Activity Monitor's force-quit failed (it spawns helper processes). The system was running but unable to fork any new process.

**Cause**
Anton was running multiple parallel Claude Code sessions across three projects (Petsona, plus two other iOS/macOS apps). Each session leaves Metro bundlers, simulator processes, bun/bunfs workers, and inspector threads. Across hours of work, the process count crept toward macOS's `kern.maxprocperuid` limit. Once at the limit, *any* attempt to fork — including `df`, `kill`, Activity Monitor's UI updates — fails. The system enters a recoverable-but-frozen state.

**Resolution**
The only reliable fix is a reboot. Apple menu → Restart (if the menu is responsive); otherwise hold the power button for 5 seconds, wait 10, power on. Local work-in-progress on disk (git commits, files) survives reboot intact.

After reboot, on first VS Code launch: macOS detected the crash and tried to restore the previous window state, which crashed VS Code again. The recovery for *that* is:
```bash
rm -rf ~/Library/Saved\ Application\ State/com.microsoft.VSCode.savedState
```
This clears VS Code's crash-recovery cache without touching settings, extensions, or workspace state. VS Code launches cleanly.

**Prevention**
1. Periodic restarts when running parallel Claude Code sessions for >4 hours.
2. Between sessions on a given project, kill leftover Metro / Expo processes targeted to that project's path (not blanket-kill — that hurts the other projects' sessions):
   ```bash
   ps -ef | grep -E "(petsona|metro)" | grep -v grep
   # Kill matching PIDs by hand
   ```
3. If `df -h /` or `ps -ef` hangs and won't respond, stop trying terminal commands and reboot. Don't waste 20 minutes trying to recover via UI.

**Affected modules / releases:** R0-M2 EAS configuration session; lost ~30 min to diagnosis and reboot.
**Time spent:** ~45 min including reboot wall-clock.

---

## 2026-05-11 — Android EAS build fails on missing splash drawable

**Symptom**
EAS Android build failed at gradle resource linking phase with:
```
error: resource drawable/splashscreen_logo (aka com.antonglance.petsona:drawable/splashscreen_logo) not found.
error: failed linking references.
FAILURE: Build failed with an exception.
* What went wrong: Execution failed for task ':app:processDebugResources'.
```
iOS build had succeeded on the same commit. R0-M1 verifications (typecheck/test/lint/expo-doctor) all green; the issue was latent and only Android exercised the path.

**Cause**
The `expo-splash-screen` plugin's `withAndroidSplashStyles` always emits `<item name="windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>` in the merged Android `styles.xml`. But `withAndroidSplashImages` only writes the actual `splashscreen_logo.png` drawables (across mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi densities) when the plugin config provides an `image` field. Our `app.json` plugin config had `backgroundColor` and `resizeMode` but no `image`. The XML referenced a drawable that was never written → aapt failed resource linking.

iOS doesn't care because Apple's splash uses a separate storyboard launch-screen mechanism, not Android's drawable system.

**Resolution**
Added `assets/splash-icon.png` (1024×1024 placeholder, mid-gray solid fill) and updated `app.json` `expo-splash-screen` plugin config:
```json
[
  "expo-splash-screen",
  {
    "backgroundColor": "#ffffff",
    "image": "./assets/splash-icon.png",
    "imageWidth": 200,
    "resizeMode": "contain",
    "dark": { "backgroundColor": "#000000" }
  }
]
```
The plugin then generates all required Android density drawables automatically via `@expo/image-utils`. Real splash design lands later (R3 or with broader visual identity work); the placeholder is throwaway.

**Prevention**
When configuring any Expo SDK plugin, check the plugin's TypeScript definition in `node_modules/<plugin>/plugin/build/*.d.ts` to confirm required vs. optional fields. `expo-splash-screen`'s `image` is technically optional in the type signature but practically required for Android. `expo-doctor` does not catch this — flagged for the Expo team in a future bug report.

**Affected modules / releases:** R0-M2 (Android EAS build); fixed in same PR #5.
**Time spent:** ~20 min diagnosis + ~15 min fix + ~15 min re-build wall-clock.

---

## 2026-05-11 — Dev-client app installs but shows "Looking for dev server" instead of splash

**Symptom**
After installing the iOS development build via EAS, opening Petsona on the iPhone showed a screen with the Petsona icon at the top, "Development Build" subtitle, "DEVELOPMENT SERVERS / Start a local development server with: `npx expo start` / Then, select the local server when it appears here." Anton's reaction: "this is not our App."

**Cause**
The `expo-dev-client` package was added in R0-M2 per D-019's adapter-pattern intent. Apps built with `expo-dev-client` are *development builds* — they include the dev-client runtime, which by default shows a menu allowing the user to connect to a Metro server (yours or someone else's). The Petsona splash screen does not appear until the dev-client successfully connects to a Metro server and loads the JS bundle.

This is by design and is the canonical Expo dev workflow — the same dev-client binary supports hot reload across thousands of branch/commit/PR JS bundles without re-building the native binary.

**Resolution**
On the Mac:
```bash
cd ~/coding/petsona && fnm use && npx expo start --dev-client
```
This starts Metro on `exp://<lan-ip>:8081`. On the iPhone, open the Camera app, scan the QR code Metro prints in the terminal. The Petsona dev-client auto-launches, connects to Metro, loads the JS bundle, and renders the actual splash with "Petsona" + "Every pet has a Petsona."

If Mac and iPhone are not on the same Wi-Fi (or LAN access is firewalled), use `--tunnel`:
```bash
npx expo start --dev-client --tunnel
```

**Prevention**
First-time Anton reaction to a dev-client build is universally "is this broken?" — documented now so future-Anton and any future collaborator can shortcut the confusion. The R0-M2 journal entry references this troubleshooting entry. When a production-style preview is needed (no Metro), use the `preview` EAS profile instead of `development`.

**Affected modules / releases:** R0-M2 iOS install validation.
**Time spent:** ~10 min Anton confusion + ~5 min explanation; <1 hour total but worth logging.

---

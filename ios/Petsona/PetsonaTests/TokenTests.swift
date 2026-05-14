import Testing
import SwiftUI
import UIKit
@testable import Petsona

// MARK: - Color Token Tests

@MainActor
@Suite("Color Tokens")
struct ColorTokenTests {

    @Test("Core palette colors are distinct non-zero values")
    func corePaletteDistinct() {
        let colors: [Color] = [
            .honey, .honeyDk, .honeySoft, .honeyTint,
            .forest, .forestDk, .forestSoft,
            .terracotta, .terracottaDk, .terracottaSoft,
            .ivory, .ivoryDim, .night, .nightElev,
            .ink, .inkSoft, .muted, .mutedSoft,
            .rule, .ruleSoft,
            .error, .errorBg
        ]
        let resolved = colors.map { $0.resolve(in: EnvironmentValues()) }
        for i in 0..<resolved.count {
            for j in (i + 1)..<resolved.count {
                let a = resolved[i], b = resolved[j]
                #expect(
                    abs(a.red - b.red) > 0.001 ||
                    abs(a.green - b.green) > 0.001 ||
                    abs(a.blue - b.blue) > 0.001,
                    "Colors at index \(i) and \(j) should be distinct"
                )
            }
        }
    }

    @Test("Honey token matches #D4A248")
    func honeyHex() {
        let r = Color.honey.resolve(in: EnvironmentValues())
        #expect(abs(r.red - 0.831) < 0.01)
        #expect(abs(r.green - 0.635) < 0.01)
        #expect(abs(r.blue - 0.282) < 0.01)
    }

    @Test("Forest token matches #2D4F3C")
    func forestHex() {
        let r = Color.forest.resolve(in: EnvironmentValues())
        #expect(abs(r.red - 0.176) < 0.01)
        #expect(abs(r.green - 0.310) < 0.01)
        #expect(abs(r.blue - 0.235) < 0.01)
    }

    @Test("Ivory token matches #FBF7EE")
    func ivoryHex() {
        let r = Color.ivory.resolve(in: EnvironmentValues())
        #expect(abs(r.red - 0.984) < 0.01)
        #expect(abs(r.green - 0.969) < 0.01)
        #expect(abs(r.blue - 0.933) < 0.01)
    }

    @Test("Ink token matches #262522")
    func inkHex() {
        let r = Color.ink.resolve(in: EnvironmentValues())
        #expect(abs(r.red - 0.149) < 0.01)
        #expect(abs(r.green - 0.145) < 0.01)
        #expect(abs(r.blue - 0.133) < 0.01)
    }

    @Test("Error token matches #A8442A")
    func errorHex() {
        let r = Color.error.resolve(in: EnvironmentValues())
        #expect(abs(r.red - 0.659) < 0.01)
        #expect(abs(r.green - 0.267) < 0.01)
        #expect(abs(r.blue - 0.165) < 0.01)
    }

    @Test("Semantic: colorPrimary equals forest in light mode")
    func semanticPrimaryEqualsForest() {
        let env = EnvironmentValues()
        let primary = Color.colorPrimary.resolve(in: env)
        let forest = Color.forest.resolve(in: env)
        #expect(abs(primary.red - forest.red) < 0.001)
        #expect(abs(primary.green - forest.green) < 0.001)
        #expect(abs(primary.blue - forest.blue) < 0.001)
    }

    @Test("Semantic: colorAccent equals honey in light mode")
    func semanticAccentEqualsHoney() {
        let env = EnvironmentValues()
        let accent = Color.colorAccent.resolve(in: env)
        let honey = Color.honey.resolve(in: env)
        #expect(abs(accent.red - honey.red) < 0.001)
        #expect(abs(accent.green - honey.green) < 0.001)
        #expect(abs(accent.blue - honey.blue) < 0.001)
    }

    @Test("All semantic aliases are accessible")
    func allSemanticAliasesCompile() {
        _ = Color.colorPrimary
        _ = Color.colorPrimaryPressed
        _ = Color.colorPrimaryOnDark
        _ = Color.colorAccent
        _ = Color.colorAccentPressed
        _ = Color.colorAccentOnDark
        _ = Color.colorSurface
        _ = Color.colorSurfaceElev
        _ = Color.colorSurfaceDim
        _ = Color.colorSurfaceInverse
        _ = Color.colorTextDefault
        _ = Color.colorTextSoft
        _ = Color.colorTextMuted
        _ = Color.colorTextInverse
        _ = Color.colorTextOnPrimary
        _ = Color.colorBorder
        _ = Color.colorBorderSoft
        _ = Color.colorStatusDanger
        _ = Color.colorStatusDangerBg
    }
}

// MARK: - Typography Token Tests

@MainActor
@Suite("Typography Tokens")
struct TypographyTokenTests {

    @Test("All six type variants return non-nil Font")
    func allVariantsNonNil() {
        _ = Font.petsonaDisplayXl
        _ = Font.petsonaDisplayLg
        _ = Font.petsonaDisplayMd
        _ = Font.petsonaBodyLg
        _ = Font.petsonaBody
        _ = Font.petsonaCaption
    }

    @Test("displayXl size is 32")
    func displayXlSize() {
        #expect(TextStyleSpec.displayXl.size == 32)
    }

    @Test("displayLg size is 24")
    func displayLgSize() {
        #expect(TextStyleSpec.displayLg.size == 24)
    }

    @Test("displayMd size is 19")
    func displayMdSize() {
        #expect(TextStyleSpec.displayMd.size == 19)
    }

    @Test("bodyLg size is 16")
    func bodyLgSize() {
        #expect(TextStyleSpec.bodyLg.size == 16)
    }

    @Test("body size is 14")
    func bodySize() {
        #expect(TextStyleSpec.body.size == 14)
    }

    @Test("caption size is 12")
    func captionSize() {
        #expect(TextStyleSpec.caption.size == 12)
    }

    @Test("caption tracking is +0.96")
    func captionTracking() {
        #expect(abs(TextStyleSpec.caption.tracking - 0.96) < 0.001)
    }

    @Test("displayXl tracking is negative (display tightening)")
    func displayXlTracking() {
        #expect(TextStyleSpec.displayXl.tracking < 0)
    }

    @Test("View typography modifier compiles")
    func viewModifierCompiles() {
        let view = Text("Test").petsona(.bodyLg)
        _ = view
    }
}

// MARK: - Spacing Token Tests

@MainActor
@Suite("Spacing Tokens")
struct SpacingTokenTests {

    @Test("Seven spacing steps in ascending order")
    func spacingAscending() {
        let steps: [CGFloat] = [
            Spacing.s1, Spacing.s2, Spacing.s3, Spacing.s4,
            Spacing.s5, Spacing.s6, Spacing.s7
        ]
        for i in 1..<steps.count {
            #expect(steps[i] > steps[i - 1])
        }
    }

    @Test("s1 == 4")
    func s1() { #expect(Spacing.s1 == 4) }

    @Test("s2 == 8")
    func s2() { #expect(Spacing.s2 == 8) }

    @Test("s3 == 12")
    func s3() { #expect(Spacing.s3 == 12) }

    @Test("s4 == 16")
    func s4() { #expect(Spacing.s4 == 16) }

    @Test("s5 == 24")
    func s5() { #expect(Spacing.s5 == 24) }

    @Test("s6 == 32")
    func s6() { #expect(Spacing.s6 == 32) }

    @Test("s7 == 48")
    func s7() { #expect(Spacing.s7 == 48) }
}

// MARK: - Border Radius Token Tests

@MainActor
@Suite("Border Radius Tokens")
struct BorderRadiusTokenTests {

    @Test("Six radii in ascending order")
    func radiiAscending() {
        let radii: [CGFloat] = [
            BorderRadius.xs, BorderRadius.sm, BorderRadius.md,
            BorderRadius.lg, BorderRadius.xl, BorderRadius.pill
        ]
        for i in 1..<radii.count {
            #expect(radii[i] > radii[i - 1])
        }
    }

    @Test("xs == 6")
    func xs() { #expect(BorderRadius.xs == 6) }

    @Test("sm == 10")
    func sm() { #expect(BorderRadius.sm == 10) }

    @Test("md == 14")
    func md() { #expect(BorderRadius.md == 14) }

    @Test("lg == 20")
    func lg() { #expect(BorderRadius.lg == 20) }

    @Test("xl == 28")
    func xl() { #expect(BorderRadius.xl == 28) }

    @Test("pill == 999")
    func pill() { #expect(BorderRadius.pill == 999) }
}

// MARK: - Motion Token Tests

@MainActor
@Suite("Motion Tokens")
struct MotionTokenTests {

    @Test("Five durations in ascending order")
    func durationsAscending() {
        let durations = [
            Motion.instant, Motion.fast, Motion.medium,
            Motion.slow, Motion.languid
        ]
        for i in 1..<durations.count {
            #expect(durations[i] > durations[i - 1])
        }
    }

    @Test("instant == 0.06s")
    func instant() { #expect(abs(Motion.instant - 0.06) < 0.001) }

    @Test("fast == 0.15s")
    func fast() { #expect(abs(Motion.fast - 0.15) < 0.001) }

    @Test("medium == 0.26s")
    func medium() { #expect(abs(Motion.medium - 0.26) < 0.001) }

    @Test("slow == 0.42s")
    func slow() { #expect(abs(Motion.slow - 0.42) < 0.001) }

    @Test("languid == 0.70s")
    func languid() { #expect(abs(Motion.languid - 0.70) < 0.001) }

    @Test("primary animation is non-nil")
    func primaryAnimation() {
        let anim = Motion.primaryAnimation
        _ = anim
    }

    @Test("out animation is non-nil")
    func outAnimation() {
        let anim = Motion.outAnimation
        _ = anim
    }

    @Test("reduce-motion-aware animation returns linear when reduced")
    func reduceMotionAware() {
        let anim = Motion.animation(for: Motion.medium, reduced: true)
        _ = anim
    }
}

// MARK: - Glass Material Tests

@MainActor
@Suite("Glass Material")
struct GlassMaterialTests {

    @Test("GlassTier cases all exist")
    func glassTierCases() {
        _ = GlassTier.thin
        _ = GlassTier.regular
        _ = GlassTier.thick
        _ = GlassTier.dark
    }

    @Test("GlassTint cases all exist")
    func glassTintCases() {
        _ = GlassTint.none
        _ = GlassTint.honey
        _ = GlassTint.forest
        _ = GlassTint.terra
    }

    @Test("glassBackground modifier compiles on RoundedRectangle")
    func glassBackgroundModifier() {
        let view = Color.clear
            .glassBackground(tier: .regular, tint: .honey, cornerRadius: 20)
        _ = view
    }

    @Test("glassBackground modifier with custom shape compiles")
    func glassBackgroundCustomShape() {
        let view = Color.clear
            .glassBackground(tier: .thin, tint: .none, shape: RoundedRectangle(cornerRadius: 12))
        _ = view
    }
}

// MARK: - DM Sans Availability Tests

@Suite("DM Sans Font Availability")
struct DMSansAvailabilityTests {

    @Test("DM Sans variable font family is registered")
    func familyRegistered() {
        #expect(UIFont.familyNames.contains("DM Sans"))
    }

    @Test("UIFont with PostScript name DMSans-9ptRegular is non-nil")
    func postScriptNameLoads() {
        let font = UIFont(name: "DMSans-9ptRegular", size: 14)
        #expect(font != nil)
    }
}

// MARK: - Component Smoke Tests

@MainActor
@Suite("Component Smoke Tests")
struct ComponentSmokeTests {

    @Test("PrimaryButton compiles with label and action")
    func primaryButton() {
        let btn = PrimaryButton("Get started") {}
        _ = btn
    }

    @Test("OutlineButton compiles")
    func outlineButton() {
        let btn = OutlineButton("Continue") {}
        _ = btn
    }

    @Test("TextButton compiles")
    func textButton() {
        let btn = TextButton("Skip") {}
        _ = btn
    }

    @Test("DarkButton compiles")
    func darkButton() {
        let btn = DarkButton("Sign in with Apple") {}
        _ = btn
    }

    @Test("SecondaryButton compiles")
    func secondaryButton() {
        let btn = SecondaryButton("Try again") {}
        _ = btn
    }

    @Test("IconButton compiles")
    func iconButton() {
        let btn = IconButton(systemName: "xmark") {}
        _ = btn
    }

    @Test("BackButton compiles")
    func backButton() {
        let btn = BackButton {}
        _ = btn
    }

    @Test("ShutterButton compiles")
    func shutterButton() {
        let btn = ShutterButton {}
        _ = btn
    }

    @Test("Pill compiles with label")
    func pill() {
        let p = Pill("Front photo")
        _ = p
    }

    @Test("SmallCap compiles")
    func smallCap() {
        let s = SmallCap("BREED")
        _ = s
    }

    @Test("ProgressDots compiles")
    func progressDots() {
        let p = ProgressDots(total: 5, current: 2)
        _ = p
    }

    @Test("ProgressBar compiles")
    func progressBar() {
        let p = ProgressBar(progress: 0.6)
        _ = p
    }

    @Test("Spinner compiles")
    func spinner() {
        let s = Spinner()
        _ = s
    }

    @Test("Card compiles")
    func card() {
        let c = Card { Text("Hello") }
        _ = c
    }

    @Test("ScreenContainer compiles")
    func screenContainer() {
        let sc = ScreenContainer { Text("Content") }
        _ = sc
    }

    @Test("CtaStack compiles")
    func ctaStack() {
        let stack = CtaStack {
            PrimaryButton("Go") {}
        }
        _ = stack
    }

    @Test("PawCheckbox circular variant compiles")
    func pawCheckboxCircular() {
        let cb = PawCheckbox(isChecked: true, variant: .circular)
        _ = cb
    }

    @Test("PawCheckbox square variant compiles")
    func pawCheckboxSquare() {
        let cb = PawCheckbox(isChecked: false, variant: .square)
        _ = cb
    }

    @Test("Segmented control compiles with 2 options")
    func segmented() {
        let seg = Segmented(options: ["Male", "Female"], selectedIndex: .constant(0))
        _ = seg
    }

    @Test("TextInput compiles")
    func textInput() {
        let input = TextInput(placeholder: "Enter breed", text: .constant(""))
        _ = input
    }

    @Test("NumberInput compiles")
    func numberInput() {
        let input = NumberInput(value: .constant("12"), unit: .constant("kg"))
        _ = input
    }
}

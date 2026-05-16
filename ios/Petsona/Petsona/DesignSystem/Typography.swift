import SwiftUI

// MARK: - TextStyleSpec — data class for each type variant

public struct TextStyleSpec {
    public let size: CGFloat
    public let lineHeight: CGFloat
    public let weight: Font.Weight
    public let tracking: CGFloat  // points (not em)

    public var font: Font {
        Font.custom("DM Sans", size: size).weight(weight)
    }

    // display variants: letter-spacing: -0.015em → tracking = size * -0.015
    // caption: letter-spacing: 0.08em → tracking = size * 0.08

    public static let displayXl = TextStyleSpec(
        size: 34, lineHeight: 40, weight: .bold,
        tracking: 34 * -0.015  // -0.51
    )
    // 28px bold / -0.02em — the profile review "WOW moment" title (hey Mochi 👋)
    public static let displayWow = TextStyleSpec(
        size: 28, lineHeight: 34, weight: .bold,
        tracking: 28 * -0.02
    )
    public static let displayLg = TextStyleSpec(
        size: 26, lineHeight: 32, weight: .semibold,
        tracking: 26 * -0.015  // -0.39
    )
    public static let displayMd = TextStyleSpec(
        size: 21, lineHeight: 28, weight: .semibold,
        tracking: 21 * -0.015  // -0.315
    )
    public static let bodyLg = TextStyleSpec(
        size: 18, lineHeight: 26, weight: .regular, tracking: 0
    )
    public static let body = TextStyleSpec(
        size: 16, lineHeight: 23, weight: .regular, tracking: 0
    )
    public static let caption = TextStyleSpec(
        size: 13, lineHeight: 18, weight: .medium,
        tracking: 13 * 0.08  // 1.04
    )
}

// MARK: - Font shortcuts (petsona prefix avoids shadowing SwiftUI built-ins)

public extension Font {
    static let petsonaDisplayXl  = TextStyleSpec.displayXl.font
    static let petsonaDisplayWow = TextStyleSpec.displayWow.font
    static let petsonaDisplayLg  = TextStyleSpec.displayLg.font
    static let petsonaDisplayMd  = TextStyleSpec.displayMd.font
    static let petsonaBodyLg     = TextStyleSpec.bodyLg.font
    static let petsonaBody       = TextStyleSpec.body.font
    static let petsonaCaption    = TextStyleSpec.caption.font
}

// MARK: - View modifier

public extension View {
    func petsona(_ style: TextStyleSpec) -> some View {
        self
            .font(style.font)
            .tracking(style.tracking)
            .lineSpacing(style.lineHeight - style.size)
    }
}

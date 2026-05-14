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
    // caption: letter-spacing: 0.08em → tracking = 12 * 0.08 = 0.96

    public static let displayXl = TextStyleSpec(
        size: 32, lineHeight: 38, weight: .bold,
        tracking: 32 * -0.015
    )
    // 28px bold / -0.02em — the profile review "WOW moment" title (hey Mochi 👋)
    public static let displayWow = TextStyleSpec(
        size: 28, lineHeight: 34, weight: .bold,
        tracking: 28 * -0.02
    )
    public static let displayLg = TextStyleSpec(
        size: 24, lineHeight: 30, weight: .semibold,
        tracking: 24 * -0.015
    )
    public static let displayMd = TextStyleSpec(
        size: 19, lineHeight: 26, weight: .semibold,
        tracking: 19 * -0.015
    )
    public static let bodyLg = TextStyleSpec(
        size: 16, lineHeight: 24, weight: .regular, tracking: 0
    )
    public static let body = TextStyleSpec(
        size: 14, lineHeight: 21, weight: .regular, tracking: 0
    )
    public static let caption = TextStyleSpec(
        size: 12, lineHeight: 16, weight: .medium,
        tracking: 12 * 0.08
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

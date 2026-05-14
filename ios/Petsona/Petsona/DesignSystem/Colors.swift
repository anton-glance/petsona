import SwiftUI

// MARK: - Core Palette (from tokens.css)

public extension Color {

    // Honey
    static let honey        = Color(hex: "#D4A248")
    static let honeyDk      = Color(hex: "#A77E2F")
    static let honeySoft    = Color(hex: "#EAD6A0")
    static let honeyTint    = Color(hex: "#F5E8C4")

    // Forest
    static let forest       = Color(hex: "#2D4F3C")
    static let forestDk     = Color(hex: "#1F3A2A")
    static let forestSoft   = Color(hex: "#79A38A")

    // Terracotta
    static let terracotta     = Color(hex: "#C97B5C")
    static let terracottaDk   = Color(hex: "#A35E42")
    static let terracottaSoft = Color(hex: "#E5B8A6")

    // Ivory / Night
    static let ivory        = Color(hex: "#FBF7EE")
    static let ivoryDim     = Color(hex: "#F4EEDE")
    static let night        = Color(hex: "#15130E")
    static let nightElev    = Color(hex: "#1E1B14")

    // Ink / Muted
    static let ink          = Color(hex: "#262522")
    static let inkSoft      = Color(hex: "#45433D")
    static let muted        = Color(hex: "#6E6A5F")
    static let mutedSoft    = Color(hex: "#93907F")

    // Rule
    static let rule         = Color(hex: "#EAE2CE")
    static let ruleSoft     = Color(hex: "#F2EBD8")

    // Status
    static let error        = Color(hex: "#A8442A")
    static let errorBg      = Color(hex: "#FBEFE7")
}

// MARK: - Semantic Aliases

public extension Color {

    static let colorPrimary          = Color.forest
    static let colorPrimaryPressed   = Color.forestDk
    static let colorPrimaryOnDark    = Color.forestSoft

    static let colorAccent           = Color.honey
    static let colorAccentPressed    = Color.honeyDk
    static let colorAccentOnDark     = Color(hex: "#E0B25E")

    static let colorSurface          = Color.ivory
    static let colorSurfaceElev      = Color.white
    static let colorSurfaceDim       = Color.ivoryDim
    static let colorSurfaceInverse   = Color.night

    static let colorTextDefault      = Color.ink
    static let colorTextSoft         = Color.inkSoft
    static let colorTextMuted        = Color.muted
    static let colorTextInverse      = Color.ivory
    static let colorTextOnPrimary    = Color.ivory

    static let colorBorder           = Color.rule
    static let colorBorderSoft       = Color.ruleSoft

    static let colorStatusDanger     = Color.error
    static let colorStatusDangerBg   = Color.errorBg
}

// MARK: - Hex initialiser

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: .init(charactersIn: "#"))
        let int = UInt64(hex, radix: 16) ?? 0
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >>  8) & 0xFF) / 255
        let b = Double( int        & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

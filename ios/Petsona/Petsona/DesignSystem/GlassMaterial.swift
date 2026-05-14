import SwiftUI

// MARK: - Glass tier (maps to --glass-blur-* / --glass-fill-*)

public enum GlassTier {
    case thin      // blur 18px, fill 0.32
    case regular   // blur 34px, fill 0.58
    case thick     // blur 48px, fill 0.78
    case dark      // on-dark fill rgba(20,19,15,0.42)

    var material: Material {
        switch self {
        case .thin:    return .ultraThinMaterial
        case .regular: return .regularMaterial
        case .thick:   return .thickMaterial
        case .dark:    return .ultraThinMaterial
        }
    }

    // Fallback fill when reduce-transparency is on
    var opaqueFill: Color {
        switch self {
        case .thin, .regular, .thick: return Color.white.opacity(0.94)
        case .dark:                   return Color(red: 20/255, green: 19/255, blue: 15/255).opacity(0.92)
        }
    }
}

// MARK: - Brand tint overlay

public enum GlassTint {
    case none
    case honey   // rgba(212,162,72,0.22)
    case forest  // rgba(45,79,60,0.30)
    case terra   // rgba(201,123,92,0.24)

    var color: Color? {
        switch self {
        case .none:   return nil
        case .honey:  return Color(red: 212/255, green: 162/255, blue: 72/255).opacity(0.22)
        case .forest: return Color(red: 45/255, green: 79/255, blue: 60/255).opacity(0.30)
        case .terra:  return Color(red: 201/255, green: 123/255, blue: 92/255).opacity(0.24)
        }
    }
}

// MARK: - View extensions (Option B: overloaded methods)

public extension View {

    // Default: RoundedRectangle with given cornerRadius
    func glassBackground(
        tier: GlassTier = .regular,
        tint: GlassTint = .none,
        cornerRadius: CGFloat = 18
    ) -> some View {
        glassBackground(
            tier: tier,
            tint: tint,
            shape: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        )
    }

    // Explicit shape variant
    func glassBackground<S: Shape>(
        tier: GlassTier = .regular,
        tint: GlassTint = .none,
        shape: S
    ) -> some View {
        modifier(GlassBackgroundModifier(tier: tier, tint: tint, shape: shape))
    }
}

// MARK: - Modifier implementation

private struct GlassBackgroundModifier<S: Shape>: ViewModifier {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    let tier: GlassTier
    let tint: GlassTint
    let shape: S

    func body(content: Content) -> some View {
        content
            .background {
                if reduceTransparency {
                    shape.fill(tier.opaqueFill)
                } else {
                    shape
                        .fill(tier.material)
                        .overlay {
                            if let tintColor = tint.color {
                                shape.fill(tintColor)
                            }
                        }
                        .overlay {
                            // Specular highlight: inset top edge
                            shape.stroke(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.85),
                                        Color.white.opacity(0.0)
                                    ],
                                    startPoint: .top,
                                    endPoint: .center
                                ),
                                lineWidth: 0.6
                            )
                        }
                }
            }
    }
}

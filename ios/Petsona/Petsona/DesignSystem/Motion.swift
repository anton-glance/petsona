import SwiftUI

public enum Motion {

    // MARK: - Durations (seconds, from tokens.css --motion-*)
    public static let instant: Double = 0.06
    public static let fast:    Double = 0.15
    public static let medium:  Double = 0.26
    public static let slow:    Double = 0.42
    public static let languid: Double = 0.70

    // MARK: - Easing (cubic-bezier from tokens.css --easing-*)
    // --easing-primary: cubic-bezier(0.32, 0.72, 0.0, 1)
    public static let primaryAnimation = Animation.timingCurve(0.32, 0.72, 0.0, 1, duration: medium)

    // --easing-out: cubic-bezier(0.50, 0.00, 0.4, 1)
    public static let outAnimation = Animation.timingCurve(0.50, 0.00, 0.4, 1, duration: medium)

    // MARK: - Reduce-motion-aware helper
    public static func animation(for duration: Double, reduced: Bool) -> Animation {
        reduced
            ? .linear(duration: 0.001)
            : .timingCurve(0.32, 0.72, 0.0, 1, duration: duration)
    }
}

// MARK: - View modifier for reduce-motion-aware animations

public extension View {
    func petsonaAnimation<V: Equatable>(
        _ value: V,
        duration: Double = Motion.medium
    ) -> some View {
        modifier(ReduceMotionAnimation(value: value, duration: duration))
    }
}

private struct ReduceMotionAnimation<V: Equatable>: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let value: V
    let duration: Double

    func body(content: Content) -> some View {
        content.animation(
            Motion.animation(for: duration, reduced: reduceMotion),
            value: value
        )
    }
}

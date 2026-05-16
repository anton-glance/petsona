import SwiftUI

/// Stepping-paw animation for the photo-collection processing state (04c).
/// Four pawprints appear sequentially at 625ms intervals, then all fade out
/// at 2500ms — matching the `collectionAdvanceDelay` in `OnboardingCoordinator`.
///
/// Reduce-motion: all four paws appear simultaneously as a single fade-in.
public struct SteppingPawsLoader: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var visiblePaws: Set<Int> = []
    @State private var fadedOut = false

    // Vertical walking pattern: right-back, left-back, right-front, left-front
    private let offsets: [(CGFloat, CGFloat)] = [
        ( 8, 48),
        (-8, 16),
        ( 8,-16),
        (-8,-48)
    ]

    public init() {}

    public var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { i in
                Image(systemName: "pawprint.fill")
                    .font(.system(size: 24))
                    .foregroundStyle(Color.muted.opacity(0.6))
                    .offset(x: offsets[i].0, y: offsets[i].1)
                    .scaleEffect(visiblePaws.contains(i) ? 1.0 : 0.8)
                    .opacity(fadedOut ? 0 : (visiblePaws.contains(i) ? 1 : 0))
                    .animation(
                        reduceMotion
                            ? .linear(duration: 0.001)
                            : .easeOut(duration: Motion.medium),
                        value: visiblePaws.contains(i)
                    )
                    .animation(.easeOut(duration: Motion.medium), value: fadedOut)
            }
        }
        .frame(width: 48, height: 112)
        .task {
            do { try await runAnimation() } catch {}
        }
    }

    private func runAnimation() async throws {
        if reduceMotion {
            visiblePaws = [0, 1, 2, 3]
            return
        }
        // Stagger: paw 1 at t=0, paw 2 at 625ms, paw 3 at 1250ms, paw 4 at 1875ms
        for i in 0..<4 {
            if i > 0 { try await Task.sleep(for: .milliseconds(625)) }
            visiblePaws.insert(i)
        }
        // All fade out at t=2500ms
        try await Task.sleep(for: .milliseconds(625))
        fadedOut = true
    }
}

#Preview {
    SteppingPawsLoader()
        .padding()
        .background(Color.colorSurface)
}

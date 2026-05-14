import SwiftUI

/// Pill-shaped step indicators used in multi-step screens.
/// Indices before `current` are "done" (forestSoft); `current` is active (colorPrimary, wider);
/// indices after are inactive (ink @ 10%). Pass `current >= total` to mark all done.
public struct ProgressDots: View {
    let total: Int
    let current: Int  // 0-indexed; use total to mark all done

    public init(total: Int, current: Int) {
        self.total = total
        self.current = current
    }

    public var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<total, id: \.self) { index in
                let isActive = index == current
                let isDone   = index < current
                Capsule(style: .continuous)
                    .fill(isDone ? Color.forestSoft : isActive ? Color.colorPrimary : Color.ink.opacity(0.10))
                    .frame(width: isActive ? 34 : 22, height: 4)
                    .shadow(color: isActive ? Color.colorPrimary.opacity(0.35) : .clear, radius: 4)
                    .animation(.easeInOut(duration: Motion.fast), value: current)
            }
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        ProgressDots(total: 3, current: 0)
        ProgressDots(total: 3, current: 1)
        ProgressDots(total: 3, current: 2)
        ProgressDots(total: 3, current: 3)
    }
    .padding()
    .background(Color.colorSurface)
}

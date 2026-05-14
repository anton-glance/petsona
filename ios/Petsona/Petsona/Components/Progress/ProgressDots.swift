import SwiftUI

public struct ProgressDots: View {
    let total: Int
    let current: Int  // 0-indexed

    public init(total: Int, current: Int) {
        self.total = total
        self.current = current
    }

    public var body: some View {
        HStack(spacing: Spacing.s2) {
            ForEach(0..<total, id: \.self) { index in
                Circle()
                    .fill(index == current ? Color.colorPrimary : Color.colorBorder)
                    .frame(width: index == current ? 8 : 6, height: index == current ? 8 : 6)
                    .animation(.easeInOut(duration: Motion.fast), value: current)
            }
        }
    }
}

#Preview {
    ProgressDots(total: 5, current: 2)
        .padding()
}

import SwiftUI

public struct Pill: View {
    private let label: String

    public init(_ label: String) {
        self.label = label
    }

    public var body: some View {
        Text(label)
            .petsona(.caption)
            .foregroundStyle(Color.colorTextInverse)
            .padding(.horizontal, Spacing.s3)
            .padding(.vertical, Spacing.s1)
            .background(
                Capsule()
                    .fill(Color.colorSurfaceInverse.opacity(0.6))
            )
    }
}

#Preview {
    Pill("Front photo · 1 of 3")
        .padding()
        .background(Color.black)
}

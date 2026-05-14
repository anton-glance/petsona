import SwiftUI

public struct SecondaryButton: View {
    private let label: String
    private let action: () -> Void

    public init(_ label: String, action: @escaping () -> Void) {
        self.label = label
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Text(label)
                .petsona(.body)
                .fontWeight(.medium)
                .foregroundStyle(Color.colorTextDefault)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.s4)
                .padding(.horizontal, Spacing.s5)
        }
        .background(
            RoundedRectangle(cornerRadius: BorderRadius.xl, style: .continuous)
                .fill(Color.colorSurfaceDim)
        )
    }
}

#Preview {
    SecondaryButton("Try again") {}
        .padding()
        .background(Color.colorSurface)
}

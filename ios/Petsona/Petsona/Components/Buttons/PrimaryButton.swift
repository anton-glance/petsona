import SwiftUI

public struct PrimaryButton: View {
    private let label: String
    private let action: () -> Void
    private let isEnabled: Bool

    public init(_ label: String, isEnabled: Bool = true, action: @escaping () -> Void) {
        self.label = label
        self.isEnabled = isEnabled
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Text(label)
                .petsona(.body)
                .fontWeight(.semibold)
                .foregroundStyle(Color.colorTextOnPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.s4)
                .padding(.horizontal, Spacing.s5)
        }
        .background(
            RoundedRectangle(cornerRadius: BorderRadius.xl, style: .continuous)
                .fill(isEnabled ? Color.colorPrimary : Color.colorTextMuted)
        )
        .disabled(!isEnabled)
    }
}

#Preview {
    VStack(spacing: 16) {
        PrimaryButton("Get started") {}
        PrimaryButton("Disabled", isEnabled: false) {}
    }
    .padding()
    .background(Color.colorSurface)
}

import SwiftUI

public struct DarkButton: View {
    private let label: String
    private let icon: String?
    private let action: () -> Void

    public init(_ label: String, icon: String? = nil, action: @escaping () -> Void) {
        self.label = label
        self.icon = icon
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.s2) {
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Color.colorTextInverse)
                }
                Text(label)
                    .petsona(.body)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.colorTextInverse)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Spacing.s4)
            .padding(.horizontal, Spacing.s5)
        }
        .background(
            RoundedRectangle(cornerRadius: BorderRadius.xl, style: .continuous)
                .fill(Color.colorSurfaceInverse)
        )
    }
}

#Preview {
    DarkButton("Sign in with Apple", icon: "apple.logo") {}
        .padding()
        .background(Color.colorSurface)
}

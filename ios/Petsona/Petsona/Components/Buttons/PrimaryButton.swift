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
                .font(.custom("DM Sans", size: 15).weight(.semibold))
                .foregroundStyle(Color.colorTextOnPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .padding(.horizontal, 22)
        }
        .background {
            Capsule(style: .continuous)
                .fill(isEnabled ? Color.colorPrimary : Color.colorTextMuted)
                .overlay {
                    // Specular top-edge gloss
                    Capsule(style: .continuous)
                        .fill(LinearGradient(
                            colors: [Color.white.opacity(0.22), .clear],
                            startPoint: .top,
                            endPoint: .center
                        ))
                }
        }
        .shadow(color: Color.forestDk.opacity(0.55), radius: 15, x: 0, y: 8)
        .shadow(color: Color.forestDk.opacity(0.30), radius: 3, x: 0, y: 1)
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

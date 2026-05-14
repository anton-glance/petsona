import SwiftUI

public struct BackButton: View {
    private let action: () -> Void

    public init(action: @escaping () -> Void) {
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: "chevron.left")
                    .font(.system(size: 12, weight: .medium))
                Text("Back")
                    .font(.custom("DM Sans", size: 14).weight(.medium))
            }
            .foregroundStyle(Color.inkSoft)
            .padding(.leading, 8)
            .padding(.trailing, 12)
            .padding(.vertical, 6)
            .glassBackground(tier: .thin, shape: Capsule(style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    BackButton {}
        .padding()
        .background(Color.colorSurface)
}

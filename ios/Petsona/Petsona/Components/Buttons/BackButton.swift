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
                    .font(.petsonaBody)
                    .fontWeight(.medium)
            }
            .foregroundStyle(Color.colorTextMuted)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
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

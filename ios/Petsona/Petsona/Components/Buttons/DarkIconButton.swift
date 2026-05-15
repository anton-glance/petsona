import SwiftUI

/// 44×44 circular icon button with dark glass fill — for use over dark/photo backgrounds.
/// Matches the `.iconbtn-dark` design token.
public struct DarkIconButton: View {
    private let systemName: String
    private let action: () -> Void

    public init(systemName: String, action: @escaping () -> Void) {
        self.systemName = systemName
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 17, weight: .medium))
                .foregroundStyle(Color.ivory)
                .frame(width: 44, height: 44)
        }
        .glassBackground(tier: .dark, shape: Circle())
    }
}

#Preview {
    HStack(spacing: 16) {
        DarkIconButton(systemName: "xmark") {}
        DarkIconButton(systemName: "bolt.slash.fill") {}
        DarkIconButton(systemName: "photo.on.rectangle") {}
    }
    .padding()
    .background(Color.black)
}

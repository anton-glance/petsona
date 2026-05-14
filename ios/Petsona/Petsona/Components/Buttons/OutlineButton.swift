import SwiftUI

public struct OutlineButton: View {
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
                .fontWeight(.semibold)
                .foregroundStyle(Color.colorPrimary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.s4)
                .padding(.horizontal, Spacing.s5)
                .overlay {
                    RoundedRectangle(cornerRadius: BorderRadius.xl, style: .continuous)
                        .stroke(Color.colorPrimary, lineWidth: 1.5)
                }
        }
    }
}

#Preview {
    OutlineButton("Continue with Google") {}
        .padding()
        .background(Color.colorSurface)
}

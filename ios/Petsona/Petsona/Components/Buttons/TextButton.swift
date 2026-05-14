import SwiftUI

public struct TextButton: View {
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
                .foregroundStyle(Color.colorPrimary)
        }
    }
}

#Preview {
    TextButton("Continue limited but free") {}
        .padding()
}

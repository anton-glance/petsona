import SwiftUI

public struct IconButton: View {
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
                .foregroundStyle(Color.colorTextDefault)
                .frame(width: 44, height: 44)
                .background(
                    Circle().fill(Color.colorSurfaceDim)
                )
        }
    }
}

#Preview {
    HStack(spacing: 12) {
        IconButton(systemName: "xmark") {}
        IconButton(systemName: "arrow.right") {}
    }
    .padding()
}

import SwiftUI

public struct BackButton: View {
    private let action: () -> Void

    public init(action: @escaping () -> Void) {
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            Image(systemName: "chevron.left")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Color.colorTextDefault)
                .frame(width: 44, height: 44)
                .background(
                    Circle().fill(Color.colorSurfaceDim)
                )
        }
    }
}

#Preview {
    BackButton {}
        .padding()
}

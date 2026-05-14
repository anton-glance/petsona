import SwiftUI

public struct ShutterButton: View {
    private let action: () -> Void

    public init(action: @escaping () -> Void) {
        self.action = action
    }

    public var body: some View {
        Button(action: action) {
            ZStack {
                Circle()
                    .fill(Color.white)
                    .frame(width: 72, height: 72)
                Circle()
                    .stroke(Color.white.opacity(0.4), lineWidth: 3)
                    .frame(width: 84, height: 84)
            }
        }
    }
}

#Preview {
    ShutterButton {}
        .padding()
        .background(Color.black)
}

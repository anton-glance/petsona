import SwiftUI

public struct ScreenContainer<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        ZStack {
            Color.colorSurface.ignoresSafeArea()
            content
        }
    }
}

#Preview {
    ScreenContainer {
        Text("Screen content")
    }
}

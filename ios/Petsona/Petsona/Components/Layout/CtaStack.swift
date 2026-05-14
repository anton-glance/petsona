import SwiftUI

public struct CtaStack<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        VStack(spacing: Spacing.s3) {
            content
        }
        .padding(.horizontal, Spacing.s5)
        .padding(.bottom, Spacing.s5)
    }
}

#Preview {
    VStack {
        Spacer()
        CtaStack {
            PrimaryButton("Get started") {}
            TextButton("Already have an account?") {}
        }
    }
    .background(Color.colorSurface)
}

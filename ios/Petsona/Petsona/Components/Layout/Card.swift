import SwiftUI

public struct Card<Content: View>: View {
    private let content: Content

    public init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    public var body: some View {
        content
            .padding(Spacing.s5)
            .background(
                RoundedRectangle(cornerRadius: BorderRadius.lg, style: .continuous)
                    .fill(Color.colorSurfaceElev)
                    .shadow(color: .black.opacity(0.08), radius: 18, x: 0, y: 6)
            )
    }
}

#Preview {
    Card {
        VStack(alignment: .leading, spacing: 8) {
            Text("Mochi").petsona(.displayMd)
            Text("Golden Retriever · 3yr").petsona(.body)
        }
    }
    .padding()
    .background(Color.colorSurface)
}

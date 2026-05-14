import SwiftUI

/// Bottom-border-only field container used in the AI profile review form.
/// Label at 9.5px/600/uppercase/0.06em; a 1pt rule separates each row.
public struct CompactField<Content: View>: View {
    private let label: String
    @ViewBuilder private let content: () -> Content

    public init(_ label: String, @ViewBuilder content: @escaping () -> Content) {
        self.label = label
        self.content = content
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(label)
                .font(.custom("DM Sans", size: 9.5).weight(.semibold))
                .tracking(0.06 * 9.5)
                .textCase(.uppercase)
                .foregroundStyle(Color.colorTextMuted)
            content()
        }
        .padding(.vertical, 9)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.rule)
                .frame(height: 1)
        }
    }
}

#Preview {
    VStack(spacing: 0) {
        CompactField("Breed") {
            Text("Tabby")
                .font(.custom("DM Sans", size: 14).weight(.medium))
                .foregroundStyle(Color.colorTextDefault)
        }
        CompactField("Name") {
            Text("Mochi")
                .font(.custom("DM Sans", size: 14).weight(.medium))
                .foregroundStyle(Color.colorTextDefault)
        }
    }
    .padding()
    .background(Color.colorSurface)
}

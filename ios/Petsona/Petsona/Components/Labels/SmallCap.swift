import SwiftUI

public struct SmallCap: View {
    private let label: String
    private let color: Color

    public init(_ label: String, color: Color = Color.colorTextMuted) {
        self.label = label
        self.color = color
    }

    public var body: some View {
        // .textCase preserves the original string for accessibility; .uppercased() would not
        Text(label)
            .petsona(.caption)
            .fontWeight(.semibold)
            .textCase(.uppercase)
            .foregroundStyle(color)
    }
}

#Preview {
    SmallCap("Breed")
        .padding()
}

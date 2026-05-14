import SwiftUI

public struct SmallCap: View {
    private let label: String

    public init(_ label: String) {
        self.label = label
    }

    public var body: some View {
        // .textCase preserves the original string for accessibility; .uppercased() would not
        Text(label)
            .petsona(.caption)
            .fontWeight(.semibold)
            .textCase(.uppercase)
            .foregroundStyle(Color.colorTextMuted)
    }
}

#Preview {
    SmallCap("Breed")
        .padding()
}

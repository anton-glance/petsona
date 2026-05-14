import SwiftUI

public struct SmallCap: View {
    private let label: String

    public init(_ label: String) {
        self.label = label
    }

    public var body: some View {
        Text(label.uppercased())
            .petsona(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(Color.colorTextMuted)
    }
}

#Preview {
    SmallCap("Breed")
        .padding()
}

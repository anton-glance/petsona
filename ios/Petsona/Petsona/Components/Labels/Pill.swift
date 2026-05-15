import SwiftUI

/// Glass-thick pill label — readable over both dark (camera) and light surfaces.
/// Text in colorTextDefault (ink), background is thick glass capsule.
public struct Pill: View {
    private let label: String

    public init(_ label: String) {
        self.label = label
    }

    public var body: some View {
        Text(label)
            .petsona(.caption)
            .foregroundStyle(Color.colorTextDefault)
            .padding(.horizontal, 14)
            .padding(.vertical, 7)
            .glassBackground(tier: .thick, shape: Capsule(style: .continuous))
    }
}

#Preview {
    VStack(spacing: 16) {
        Pill("Photo 1 of 3 · Front")
        Pill("Photo 2 of 3 · Side")
    }
    .padding()
    .background(Color.black)
}

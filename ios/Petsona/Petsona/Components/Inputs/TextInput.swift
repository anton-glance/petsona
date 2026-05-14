import SwiftUI

public struct TextInput: View {
    let placeholder: String
    @Binding var text: String

    public init(placeholder: String, text: Binding<String>) {
        self.placeholder = placeholder
        self._text = text
    }

    public var body: some View {
        TextField(placeholder, text: $text)
            .petsona(.body)
            .foregroundStyle(Color.colorTextDefault)
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s3)
            .background(
                RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous)
                    .fill(Color.colorSurfaceElev)
                    .overlay {
                        RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous)
                            .stroke(Color.colorBorder, lineWidth: 1)
                    }
            )
    }
}

#Preview {
    @Previewable @State var text = ""
    TextInput(placeholder: "Enter breed", text: $text)
        .padding()
        .background(Color.colorSurface)
}

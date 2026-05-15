import SwiftUI

/// Bottom-border-only field container used in the AI profile review form.
/// Label at caption scale / uppercase. A 1pt rule separates each row.
/// Adds a keyboard Done toolbar so every descendant TextField gets a dismiss button.
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
                .petsona(.caption)
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
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Done") {
                    UIApplication.shared.endEditing()
                }
                .fontWeight(.semibold)
            }
        }
    }
}

#Preview {
    VStack(spacing: 0) {
        CompactField("Breed") {
            Text("Tabby")
                .font(.petsonaBody)
                .fontWeight(.medium)
                .foregroundStyle(Color.colorTextDefault)
        }
        CompactField("Name") {
            TextField("Name", text: .constant("Mochi"))
                .font(.petsonaBody)
                .fontWeight(.medium)
                .foregroundStyle(Color.colorTextDefault)
        }
    }
    .padding()
    .background(Color.colorSurface)
}

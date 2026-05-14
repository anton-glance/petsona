import SwiftUI

public struct Segmented: View {
    let options: [String]
    @Binding var selectedIndex: Int

    public init(options: [String], selectedIndex: Binding<Int>) {
        self.options = options
        self._selectedIndex = selectedIndex
    }

    public var body: some View {
        HStack(spacing: 0) {
            ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                Button {
                    selectedIndex = index
                } label: {
                    Text(option)
                        .petsona(.body)
                        .fontWeight(selectedIndex == index ? .semibold : .regular)
                        .foregroundStyle(
                            selectedIndex == index ? Color.colorTextOnPrimary : Color.colorTextDefault
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, Spacing.s3)
                        .background {
                            if selectedIndex == index {
                                RoundedRectangle(cornerRadius: BorderRadius.sm, style: .continuous)
                                    .fill(Color.colorPrimary)
                            }
                        }
                }
                .animation(.easeInOut(duration: Motion.fast), value: selectedIndex)
            }
        }
        .padding(Spacing.s1)
        .background(
            RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous)
                .fill(Color.colorSurfaceDim)
        )
    }
}

#Preview {
    @Previewable @State var selected = 0
    Segmented(options: ["Male", "Female", "Other"], selectedIndex: $selected)
        .padding()
        .background(Color.colorSurface)
}

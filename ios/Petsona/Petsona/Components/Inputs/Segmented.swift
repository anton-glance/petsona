import SwiftUI

public enum SegmentedStyle {
    case primary  // forest active fill — default CTA-style
    case subtle   // honeySoft/honeyTint fills, md radius — for form fields
}

public struct Segmented: View {
    let options: [String]
    @Binding var selectedIndex: Int
    var style: SegmentedStyle = .primary

    public init(options: [String], selectedIndex: Binding<Int>, style: SegmentedStyle = .primary) {
        self.options = options
        self._selectedIndex = selectedIndex
        self.style = style
    }

    private var activeBackground: Color {
        switch style {
        case .primary: Color.colorPrimary
        case .subtle:  Color.honeySoft
        }
    }

    private var trackBackground: Color {
        switch style {
        case .primary: Color.colorSurfaceDim
        case .subtle:  Color.honeyTint
        }
    }

    private var activeTextColor: Color {
        switch style {
        case .primary: Color.colorTextOnPrimary
        case .subtle:  Color.colorTextDefault
        }
    }

    private var inactiveTextColor: Color {
        switch style {
        case .primary: Color.colorTextDefault
        case .subtle:  Color.colorTextMuted
        }
    }

    private var tabCornerRadius: CGFloat {
        switch style {
        case .primary: BorderRadius.sm
        case .subtle:  BorderRadius.md
        }
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
                        .foregroundStyle(selectedIndex == index ? activeTextColor : inactiveTextColor)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, style == .subtle ? 10 : Spacing.s3)
                        .background {
                            if selectedIndex == index {
                                RoundedRectangle(cornerRadius: tabCornerRadius, style: .continuous)
                                    .fill(activeBackground)
                            }
                        }
                }
                .animation(.easeInOut(duration: Motion.fast), value: selectedIndex)
            }
        }
        .padding(3)
        .background(
            RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous)
                .fill(trackBackground)
        )
    }
}

#Preview {
    @Previewable @State var selected = 0
    VStack(spacing: 20) {
        Segmented(options: ["Male", "Female", "Other"], selectedIndex: $selected, style: .primary)
        Segmented(options: ["kg", "lb"], selectedIndex: $selected, style: .subtle)
    }
    .padding()
    .background(Color.colorSurface)
}

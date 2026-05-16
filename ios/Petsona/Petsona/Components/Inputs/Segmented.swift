import SwiftUI

public enum SegmentedStyle {
    case primary  // forest-tinted glass active indicator
    case subtle   // untinted glass active indicator — for form fields
}

public struct Segmented: View {
    let options: [String]
    @Binding var selectedIndex: Int
    var style: SegmentedStyle = .primary
    @Namespace private var glassNamespace

    public init(options: [String], selectedIndex: Binding<Int>, style: SegmentedStyle = .primary) {
        self.options = options
        self._selectedIndex = selectedIndex
        self.style = style
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

    // Legacy active background used as fallback on pre-iOS 26
    private var legacyActiveBackground: Color {
        switch style {
        case .primary: Color.colorPrimary
        case .subtle:  Color.honeySoft
        }
    }

    public var body: some View {
        if #available(iOS 26.0, *) {
            liquidGlassBody
        } else {
            legacyBody
        }
    }

    @available(iOS 26.0, *)
    private var liquidGlassBody: some View {
        GlassEffectContainer(spacing: 4) {
            HStack(spacing: 4) {
                ForEach(Array(options.enumerated()), id: \.offset) { index, option in
                    if selectedIndex == index {
                        Button {
                            withAnimation(.spring(duration: 0.3, bounce: 0.1)) { selectedIndex = index }
                        } label: {
                            Text(option)
                                .petsona(.body)
                                .fontWeight(.semibold)
                                .foregroundStyle(activeTextColor)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, style == .subtle ? 10 : Spacing.s3)
                                .padding(.horizontal, Spacing.s2)
                        }
                        .buttonStyle(.plain)
                        .glassEffect(
                            style == .primary
                                ? .regular.tint(Color.forest).interactive()
                                : .regular.interactive(),
                            in: .rect(cornerRadius: tabCornerRadius)
                        )
                        .glassEffectID("active", in: glassNamespace)
                        .glassEffectTransition(.matchedGeometry)
                    } else {
                        Button {
                            withAnimation(.spring(duration: 0.3, bounce: 0.1)) { selectedIndex = index }
                        } label: {
                            Text(option)
                                .petsona(.body)
                                .fontWeight(.regular)
                                .foregroundStyle(inactiveTextColor)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, style == .subtle ? 10 : Spacing.s3)
                                .padding(.horizontal, Spacing.s2)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(4)
        }
        .background(
            RoundedRectangle(cornerRadius: BorderRadius.md + 4, style: .continuous)
                .fill(trackBackground)
        )
    }

    private var legacyBody: some View {
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
                                    .fill(legacyActiveBackground)
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

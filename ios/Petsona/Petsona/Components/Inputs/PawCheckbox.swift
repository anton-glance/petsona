import SwiftUI

public enum CheckboxVariant {
    case circular
    case square
}

public struct PawCheckbox: View {
    let isChecked: Bool
    let variant: CheckboxVariant

    public init(isChecked: Bool, variant: CheckboxVariant = .circular) {
        self.isChecked = isChecked
        self.variant = variant
    }

    public var body: some View {
        ZStack {
            shape
                .fill(isChecked ? Color.colorPrimary : Color.clear)
                .overlay { shape.stroke(isChecked ? Color.colorPrimary : Color.colorBorder, lineWidth: 1.5) }
            if isChecked {
                Image(systemName: "pawprint.fill")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.colorTextOnPrimary)
            }
        }
        .frame(width: 24, height: 24)
        .animation(.easeInOut(duration: Motion.fast), value: isChecked)
    }

    private var shape: AnyShape {
        switch variant {
        case .circular: AnyShape(Circle())
        case .square:   AnyShape(RoundedRectangle(cornerRadius: BorderRadius.xs, style: .continuous))
        }
    }
}

#Preview {
    HStack(spacing: 16) {
        PawCheckbox(isChecked: false, variant: .circular)
        PawCheckbox(isChecked: true, variant: .circular)
        PawCheckbox(isChecked: false, variant: .square)
        PawCheckbox(isChecked: true, variant: .square)
    }
    .padding()
}

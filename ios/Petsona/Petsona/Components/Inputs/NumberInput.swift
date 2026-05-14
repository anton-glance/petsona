import SwiftUI

public struct NumberInput: View {
    @Binding var value: String
    @Binding var unit: String

    let availableUnits: [String]

    public init(
        value: Binding<String>,
        unit: Binding<String>,
        availableUnits: [String] = ["kg", "lbs"]
    ) {
        self._value = value
        self._unit = unit
        self.availableUnits = availableUnits
    }

    public var body: some View {
        HStack(spacing: 0) {
            TextField("0", text: $value)
                .keyboardType(.decimalPad)
                .petsona(.body)
                .foregroundStyle(Color.colorTextDefault)
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s3)
                .frame(maxWidth: .infinity)

            Divider()
                .frame(height: 24)
                .background(Color.colorBorder)

            Picker("Unit", selection: $unit) {
                ForEach(availableUnits, id: \.self) { u in
                    Text(u).tag(u)
                }
            }
            .pickerStyle(.menu)
            .padding(.horizontal, Spacing.s3)
        }
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
    @Previewable @State var value = "12"
    @Previewable @State var unit = "kg"
    NumberInput(value: $value, unit: $unit)
        .padding()
        .background(Color.colorSurface)
}

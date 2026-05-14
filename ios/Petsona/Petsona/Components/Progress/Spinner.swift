import SwiftUI

public struct Spinner: View {
    @State private var rotation: Double = 0

    public init() {}

    public var body: some View {
        Circle()
            .trim(from: 0.1, to: 0.9)
            .stroke(Color.colorPrimary, style: StrokeStyle(lineWidth: 3, lineCap: .round))
            .frame(width: 32, height: 32)
            .rotationEffect(.degrees(rotation))
            .onAppear {
                withAnimation(.linear(duration: 0.9).repeatForever(autoreverses: false)) {
                    rotation = 360
                }
            }
    }
}

#Preview {
    Spinner()
        .padding()
}

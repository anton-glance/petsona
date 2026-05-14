import SwiftUI

public struct ProgressBar: View {
    let progress: CGFloat  // 0.0 – 1.0

    public init(progress: CGFloat) {
        self.progress = progress
    }

    public var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.colorBorder)
                    .frame(height: 6)
                Capsule()
                    .fill(Color.colorPrimary)
                    .frame(width: geo.size.width * min(max(progress, 0), 1), height: 6)
                // Paw glyph at the end of the filled portion
                Image(systemName: "pawprint.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.colorPrimary)
                    .offset(x: geo.size.width * min(max(progress, 0), 1) - 5, y: -10)
            }
        }
        .frame(height: 6)
        .padding(.top, 12)  // room for paw glyph above
    }
}

#Preview {
    VStack(spacing: 20) {
        ProgressBar(progress: 0.3)
        ProgressBar(progress: 0.6)
        ProgressBar(progress: 1.0)
    }
    .padding()
}

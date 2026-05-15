import SwiftUI

struct CameraExplainerView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator
    @State private var isRequesting = false

    var body: some View {
        ScreenContainer {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s5) {
                        VStack(alignment: .leading, spacing: Spacing.s2) {
                            SmallCap("Step 1 of 3", color: Color.honeyDk)
                            // V3: displayMd prevents wrapping on iPhone SE
                            Text("Petsona needs your camera.")
                                .petsona(.displayMd)
                                .foregroundStyle(Color.colorPrimary)
                            Text("Two ways your camera makes Petsona work:")
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextMuted)
                        }
                        .padding(.top, Spacing.s6)

                        // V2: neutral ivoryDim block with viewfinder brackets + radial highlight
                        ZStack {
                            RoundedRectangle(cornerRadius: BorderRadius.lg, style: .continuous)
                                .fill(Color.ivoryDim)
                                .aspectRatio(1.3, contentMode: .fit)
                            // Soft radial highlight at centre
                            RadialGradient(
                                colors: [Color.white.opacity(0.18), .clear],
                                center: .center,
                                startRadius: 0,
                                endRadius: 90
                            )
                            .clipShape(RoundedRectangle(cornerRadius: BorderRadius.lg, style: .continuous))
                            // Viewfinder corner brackets in honeyDk
                            ViewfinderBrackets()
                                .stroke(Color.honeyDk, lineWidth: 2.5)
                                .padding(24)
                        }
                        .aspectRatio(1.3, contentMode: .fit)

                        // V1: checkmark icon in dark-forest rounded square
                        BenefitRow(
                            symbol: "checkmark",
                            title: "Quick check-up of anything off",
                            description: "Snap a photo when something looks wrong. We tell you if it's calm, watch, or urgent."
                        )
                        // V1: list icon matching the design's three-lines SVG
                        BenefitRow(
                            symbol: "list.bullet",
                            title: "A timeline that builds itself",
                            description: "Photos, receipts, vet documents — all auto-filed to your pet's story."
                        )
                    }
                    .padding(.horizontal, Spacing.s5)
                }

                CtaStack {
                    PrimaryButton("Allow access", isEnabled: !isRequesting) {
                        isRequesting = true
                        Task {
                            await coordinator.requestCameraPermission()
                            isRequesting = false
                        }
                    }
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

// MARK: - Benefit row (V1: dark-forest rounded square container, ivory icon)

private struct BenefitRow: View {
    let symbol: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.s4) {
            // Dark-forest rounded square container matching .icon-mark.forest
            ZStack {
                RoundedRectangle(cornerRadius: BorderRadius.sm, style: .continuous)
                    .fill(Color.forestDk)
                    .frame(width: 36, height: 36)
                Image(systemName: symbol)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.ivory)
            }
            .padding(.top, 1)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.petsonaBodyLg)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.colorTextDefault)
                Text(description)
                    .petsona(.body)
                    .foregroundStyle(Color.colorTextMuted)
            }
        }
    }
}

// MARK: - Viewfinder corner brackets shape (V2)

private struct ViewfinderBrackets: Shape {
    func path(in rect: CGRect) -> Path {
        let len: CGFloat = 20
        var p = Path()
        // Top-left
        p.move(to: CGPoint(x: rect.minX, y: rect.minY + len))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.minX + len, y: rect.minY))
        // Top-right
        p.move(to: CGPoint(x: rect.maxX - len, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + len))
        // Bottom-right
        p.move(to: CGPoint(x: rect.maxX, y: rect.maxY - len))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.maxX - len, y: rect.maxY))
        // Bottom-left
        p.move(to: CGPoint(x: rect.minX + len, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - len))
        return p
    }
}

#Preview {
    CameraExplainerView()
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized)
        ))
}

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
                            Text("Petsona needs your camera.")
                                .petsona(.displayLg)
                                .foregroundStyle(Color.colorPrimary)
                            Text("Two ways your camera makes Petsona work:")
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextMuted)
                        }
                        .padding(.top, Spacing.s6)

                        // Camera preview placeholder with dog-warm gradient
                        ZStack {
                            RoundedRectangle(cornerRadius: BorderRadius.lg, style: .continuous)
                                .fill(
                                    LinearGradient(
                                        colors: [
                                            Color(red: 107/255, green: 73/255, blue: 38/255),
                                            Color(red: 184/255, green: 133/255, blue: 66/255),
                                            Color(red: 240/255, green: 194/255, blue: 128/255)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .aspectRatio(1.3, contentMode: .fit)
                            Image(systemName: "camera.viewfinder")
                                .font(.system(size: 32))
                                .foregroundStyle(Color.white.opacity(0.6))
                        }

                        // Benefit rows
                        BenefitRow(
                            symbol: "camera",
                            title: "Quick check-up of anything off",
                            description: "Snap a photo when something looks wrong. We tell you if it's calm, watch, or urgent."
                        )
                        BenefitRow(
                            symbol: "text.page.badge.magnifyingglass",
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

private struct BenefitRow: View {
    let symbol: String
    let title: String
    let description: String

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.s4) {
            // 22×22 filled circle icon container matching design
            ZStack {
                Circle()
                    .fill(Color.colorPrimary)
                    .frame(width: 22, height: 22)
                Image(systemName: symbol)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Color.ivory)
            }
            .padding(.top, 2)

            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.custom("DM Sans", size: 13.5).weight(.semibold))
                    .foregroundStyle(Color.colorTextDefault)
                Text(description)
                    .font(.custom("DM Sans", size: 12))
                    .foregroundStyle(Color.colorTextMuted)
                    .lineSpacing(4)
            }
        }
    }
}

#Preview {
    CameraExplainerView()
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized)
        ))
}

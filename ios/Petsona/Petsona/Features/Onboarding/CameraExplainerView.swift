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
                            SmallCap("Step 1 of 3")
                            Text("Petsona needs your camera.")
                                .petsona(.displayMd)
                                .foregroundStyle(Color.colorTextDefault)
                            Text("Two ways your camera makes Petsona work:")
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextSoft)
                        }
                        .padding(.top, Spacing.s6)

                        // Photo placeholder block
                        ZStack {
                            RoundedRectangle(cornerRadius: BorderRadius.lg, style: .continuous)
                                .fill(Color.colorBorderSoft)
                                .frame(height: 180)
                            VStack(spacing: Spacing.s2) {
                                Image(systemName: "camera.viewfinder")
                                    .font(.system(size: 40))
                                    .foregroundStyle(Color.colorTextMuted)
                                Text("Camera preview")
                                    .petsona(.caption)
                                    .foregroundStyle(Color.colorTextMuted)
                            }
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
            Image(systemName: symbol)
                .font(.system(size: 22))
                .foregroundStyle(Color.colorPrimary)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: Spacing.s1) {
                Text(title)
                    .petsona(.bodyLg)
                    .foregroundStyle(Color.colorTextDefault)
                Text(description)
                    .petsona(.body)
                    .foregroundStyle(Color.colorTextSoft)
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

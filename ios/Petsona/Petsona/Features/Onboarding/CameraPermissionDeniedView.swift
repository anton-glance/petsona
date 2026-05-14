import SwiftUI

struct CameraPermissionDeniedView: View {
    @Environment(OnboardingCoordinator.self) private var coordinator

    private let steps = [
        "Open Settings",
        "Find Petsona in the app list",
        "Toggle Camera on"
    ]

    var body: some View {
        ScreenContainer {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(spacing: Spacing.s5) {
                        // Icon: 130×130 circle, ivoryDim bg, mutedSoft icon
                        ZStack {
                            Circle()
                                .fill(Color.ivoryDim)
                                .frame(width: 130, height: 130)
                            Image(systemName: "camera.slash")
                                .font(.system(size: 130 * 0.42, weight: .regular))
                                .foregroundStyle(Color.mutedSoft)
                        }
                        .padding(.top, Spacing.s7)

                        VStack(spacing: Spacing.s3) {
                            // Error-colored small cap
                            SmallCap("Camera access needed", color: Color.colorStatusDanger)
                            Text("Petsona can't continue without camera.")
                                .petsona(.displayMd)
                                .foregroundStyle(Color.colorTextDefault)
                                .multilineTextAlignment(.center)
                            Text("Enable camera in Settings — Petsona needs it to identify your pet and digitize records.")
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextSoft)
                                .multilineTextAlignment(.center)
                        }

                        // Instruction steps with glass card styling
                        VStack(spacing: Spacing.s4) {
                            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                                HStack(alignment: .top, spacing: Spacing.s3) {
                                    // Forest-filled number badge
                                    ZStack {
                                        Circle()
                                            .fill(Color.colorPrimary)
                                            .frame(width: 22, height: 22)
                                        Text("\(index + 1)")
                                            .font(.custom("DM Sans", size: 11).weight(.bold))
                                            .foregroundStyle(Color.ivory)
                                    }
                                    Text(step)
                                        .font(.custom("DM Sans", size: 12.5))
                                        .foregroundStyle(Color.inkSoft)
                                        .lineSpacing(3)
                                        .padding(.top, 2)
                                    Spacer()
                                }
                                .padding(Spacing.s3)
                                .glassBackground(tier: .regular, cornerRadius: 16)
                            }
                        }
                    }
                    .padding(.horizontal, Spacing.s5)
                }

                CtaStack {
                    PrimaryButton("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    TextButton("Already granted. Try again") {
                        Task { await coordinator.requestCameraPermission() }
                    }
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
    }
}

#Preview {
    CameraPermissionDeniedView()
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .denied)
        ))
}

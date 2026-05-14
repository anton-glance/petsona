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
                        Image(systemName: "camera.slash")
                            .font(.system(size: 64))
                            .foregroundStyle(Color.colorStatusDanger)
                            .padding(.top, Spacing.s7)

                        VStack(spacing: Spacing.s3) {
                            SmallCap("Camera access needed")
                            Text("Petsona can't continue without camera.")
                                .petsona(.displayMd)
                                .foregroundStyle(Color.colorTextDefault)
                                .multilineTextAlignment(.center)
                            Text("Enable camera in Settings — Petsona needs it to identify your pet and digitize records.")
                                .petsona(.body)
                                .foregroundStyle(Color.colorTextSoft)
                                .multilineTextAlignment(.center)
                        }

                        VStack(alignment: .leading, spacing: Spacing.s3) {
                            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                                HStack(alignment: .top, spacing: Spacing.s3) {
                                    ZStack {
                                        Circle()
                                            .fill(Color.colorAccent.opacity(0.15))
                                            .frame(width: 28, height: 28)
                                        Text("\(index + 1)")
                                            .petsona(.caption)
                                            .foregroundStyle(Color.colorAccent)
                                    }
                                    Text(step)
                                        .petsona(.body)
                                        .foregroundStyle(Color.colorTextDefault)
                                        .padding(.top, 4)
                                }
                            }
                        }
                        .padding(.horizontal, Spacing.s2)
                    }
                    .padding(.horizontal, Spacing.s5)
                }

                CtaStack {
                    PrimaryButton("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                    SecondaryButton("Already granted. Try again") {
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

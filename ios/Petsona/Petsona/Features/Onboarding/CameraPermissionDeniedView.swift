import SwiftUI
import UIKit

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
                        // V4: camera.slash.fill at visible size + muted color
                        ZStack {
                            Circle()
                                .fill(Color.ivoryDim)
                                .frame(width: 130, height: 130)
                            Image(systemName: "camera.slash.fill")
                                .font(.system(size: 54, weight: .regular))
                                .foregroundStyle(Color.muted)
                        }
                        .padding(.top, Spacing.s7)

                        VStack(spacing: Spacing.s3) {
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

                        // V5: solid white pills with dark ink text — readable on any background
                        VStack(spacing: Spacing.s2) {
                            ForEach(Array(steps.enumerated()), id: \.offset) { index, step in
                                HStack(alignment: .center, spacing: Spacing.s3) {
                                    // Forest-filled number badge with ivory number
                                    ZStack {
                                        Circle()
                                            .fill(Color.colorPrimary)
                                            .frame(width: 24, height: 24)
                                        Text("\(index + 1)")
                                            .font(.petsonaCaption)
                                            .fontWeight(.bold)
                                            .foregroundStyle(Color.ivory)
                                    }
                                    Text(step)
                                        .petsona(.body)
                                        .foregroundStyle(Color.colorTextDefault)
                                    Spacer()
                                }
                                .padding(.vertical, Spacing.s3)
                                .padding(.horizontal, Spacing.s4)
                                .background(
                                    RoundedRectangle(cornerRadius: BorderRadius.md, style: .continuous)
                                        .fill(Color.colorSurfaceElev)
                                        .shadow(color: Color.ink.opacity(0.06), radius: 2, x: 0, y: 1)
                                )
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
        .onReceive(
            NotificationCenter.default.publisher(for: UIApplication.willEnterForegroundNotification)
        ) { _ in
            coordinator.foregroundResumed()
        }
    }
}

#Preview {
    CameraPermissionDeniedView()
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .denied)
        ))
}

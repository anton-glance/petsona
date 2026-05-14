import SwiftUI
import AVFoundation

struct CameraCaptureView: View {
    let slot: PhotoSlot
    @Environment(OnboardingCoordinator.self) private var coordinator
    @State private var cameraSession = CameraSession()

    private var pillText: String {
        switch slot {
        case .front:    "Photo 1 of 3 · Front"
        case .side:     "Photo 2 of 3 · Side"
        case .document: "Photo 3 of 3 · Document"
        }
    }

    private var tipText: String {
        switch slot {
        case .front:    "Front-facing photo · face and chest visible"
        case .side:     "Side photo · full body if possible"
        case .document: "Vet document · any record with vitals"
        }
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // Real AVFoundation preview is only wired when not using mock.
            // Runtime check (not #if targetEnvironment) so tests pass on macOS test runners.
            if !coordinator.useMockCamera {
                CameraPreviewView(cameraSession: cameraSession)
                    .ignoresSafeArea()
                    .task {
                        defer { Task { await cameraSession.stop() } }
                        try? await cameraSession.configure()
                        await cameraSession.start()
                        try? await Task.sleep(for: .seconds(3600))
                    }
            }

            VStack {
                // Top chrome — always shown
                HStack {
                    IconButton(systemName: "xmark") {
                        coordinator.path.removeLast()
                    }
                    .accessibilityLabel("Close camera")
                    Spacer()
                    Pill(pillText)
                    Spacer()
                    IconButton(systemName: "camera.rotate") {}
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.top, Spacing.s3)

                Spacer()

                if coordinator.useMockCamera {
                    // Mock content is part of the VStack (not behind a Spacer layer)
                    // so XCUITest can find the "Use mock photo" button in the accessibility tree.
                    mockContent
                    Spacer()
                } else {
                    Text(tipText)
                        .petsona(.caption)
                        .foregroundStyle(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.s5)
                        .padding(.bottom, Spacing.s3)

                    HStack {
                        IconButton(systemName: "photo.on.rectangle") {}
                        Spacer()
                        ShutterButton {
                            Task { await captureAndAdvance() }
                        }
                        Spacer()
                        IconButton(systemName: "camera.rotate") {}
                    }
                    .padding(.horizontal, Spacing.s5)
                    .padding(.bottom, Spacing.s5)
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .preferredColorScheme(.dark)
    }

    // MARK: - Mock content (shown when coordinator.useMockCamera == true)

    private var mockContent: some View {
        VStack(spacing: Spacing.s5) {
            ZStack {
                RoundedRectangle(cornerRadius: BorderRadius.lg, style: .continuous)
                    .fill(Color.colorBorder.opacity(0.3))
                    .frame(height: 240)
                VStack(spacing: Spacing.s3) {
                    Image(systemName: "camera.slash")
                        .font(.system(size: 48))
                        .foregroundStyle(.white.opacity(0.5))
                    Text("Camera unavailable in simulator")
                        .petsona(.body)
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .padding(.horizontal, Spacing.s5)

            Button("Use mock photo") {
                let mockImage = UIImage(named: "splash-1024") ?? UIImage()
                coordinator.capturePhoto(slot: slot, image: mockImage)
            }
            .petsona(.bodyLg)
            .foregroundStyle(.white)
            .padding(.horizontal, Spacing.s5)
            .padding(.vertical, Spacing.s3)
            .background(
                RoundedRectangle(cornerRadius: BorderRadius.xl, style: .continuous)
                    .fill(Color.colorPrimary)
            )
        }
    }

    // MARK: - Capture (real device path)

    private func captureAndAdvance() async {
        if let image = try? await cameraSession.capturePhoto() {
            coordinator.capturePhoto(slot: slot, image: image)
        }
    }
}

#Preview("Front (mock)") {
    CameraCaptureView(slot: .front)
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized),
            useMockCamera: true
        ))
}

#Preview("Side (mock)") {
    CameraCaptureView(slot: .side)
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized),
            useMockCamera: true
        ))
}

#Preview("Document (mock)") {
    CameraCaptureView(slot: .document)
        .environment(OnboardingCoordinator(
            permissionProvider: MockCameraPermissionProvider(state: .authorized),
            useMockCamera: true
        ))
}

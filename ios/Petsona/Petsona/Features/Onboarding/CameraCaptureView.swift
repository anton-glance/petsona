import SwiftUI
import AVFoundation
import PhotosUI

struct CameraCaptureView: View {
    let slot: PhotoSlot
    @Environment(OnboardingCoordinator.self) private var coordinator
    @State private var cameraSession = CameraSession()
    @State private var flashEnabled = false
    @State private var selectedLibraryItem: PhotosPickerItem?

    // S03.1: plain text replaces the pill capsule
    private var slotText: String {
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

            // S03.3: viewfinder corner brackets framing the composition area
            CaptureViewfinderBrackets()
                .stroke(Color.honeyDk, lineWidth: 3)
                .padding(80)
                .ignoresSafeArea()

            VStack {
                // S03.1: text label directly on dark preview, no pill capsule
                HStack {
                    DarkIconButton(systemName: "xmark") {
                        coordinator.path.removeLast()
                    }
                    .accessibilityLabel("Close camera")
                    Spacer()
                    Text(slotText)
                        .petsona(.bodyLg)
                        .foregroundStyle(Color.ivory)
                        .shadow(color: Color.black.opacity(0.5), radius: 2, x: 0, y: 1)
                    Spacer()
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.top, Spacing.s3)

                Spacer()

                if coordinator.useMockCamera {
                    mockContent
                    Spacer()
                } else {
                    // S03.4: bodyLg (now 18pt per G1) for tip text
                    Text(tipText)
                        .petsona(.bodyLg)
                        .foregroundStyle(.white.opacity(0.85))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.s5)
                        .padding(.bottom, Spacing.s3)

                    // S03.6: fixed 36pt gap between shutter and side buttons
                    HStack(spacing: 0) {
                        Spacer()
                        PhotosPicker(
                            selection: $selectedLibraryItem,
                            matching: .images,
                            photoLibrary: .shared()
                        ) {
                            CameraControlIcon(systemName: "photo.on.rectangle")
                        }
                        Spacer().frame(width: 36)
                        ShutterButton {
                            Task { await captureAndAdvance() }
                        }
                        Spacer().frame(width: 36)
                        let hasFlash = AVCaptureDevice.default(for: .video)?.hasFlash ?? false
                        DarkIconButton(
                            systemName: flashEnabled ? "bolt.fill" : "bolt.slash.fill"
                        ) {
                            flashEnabled.toggle()
                        }
                        .disabled(!hasFlash)
                        .opacity(hasFlash ? 1.0 : 0.4)
                        Spacer()
                    }
                    .padding(.horizontal, Spacing.s5)
                    .padding(.bottom, Spacing.s5)
                }
            }
        }
        .toolbar(.hidden, for: .navigationBar)
        .preferredColorScheme(.dark)
        .onChange(of: selectedLibraryItem) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    coordinator.capturePhoto(slot: slot, image: image)
                }
                selectedLibraryItem = nil
            }
        }
    }

    // MARK: - Mock content

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

    // MARK: - Capture

    private func captureAndAdvance() async {
        if let image = try? await cameraSession.capturePhoto(flashMode: flashEnabled ? .on : .off) {
            coordinator.capturePhoto(slot: slot, image: image)
        }
    }
}

// MARK: - Camera control icon

private struct CameraControlIcon: View {
    let systemName: String
    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: 17, weight: .medium))
            .foregroundStyle(Color.ivory)
            .frame(width: 44, height: 44)
            .glassBackground(tier: .dark, shape: Circle())
    }
}

// MARK: - S03.3: L-shaped viewfinder corner brackets

private struct CaptureViewfinderBrackets: Shape {
    func path(in rect: CGRect) -> Path {
        let arm: CGFloat = 24
        var p = Path()
        // Top-left
        p.move(to: CGPoint(x: rect.minX, y: rect.minY + arm))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.minX + arm, y: rect.minY))
        // Top-right
        p.move(to: CGPoint(x: rect.maxX - arm, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + arm))
        // Bottom-right
        p.move(to: CGPoint(x: rect.maxX, y: rect.maxY - arm))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.maxX - arm, y: rect.maxY))
        // Bottom-left
        p.move(to: CGPoint(x: rect.minX + arm, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - arm))
        return p
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

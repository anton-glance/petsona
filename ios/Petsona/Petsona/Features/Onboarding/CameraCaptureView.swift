import SwiftUI
import AVFoundation
import PhotosUI

struct CameraCaptureView: View {
    let slot: PhotoSlot
    @Environment(OnboardingCoordinator.self) private var coordinator
    @State private var cameraSession = CameraSession()

    // B2: flash toggle state (view-local — per-session intent)
    @State private var flashEnabled = false
    // B3: photo library picker
    @State private var selectedLibraryItem: PhotosPickerItem?

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

    // V8: show silhouette only for pet shots, not document
    private var showSilhouette: Bool {
        slot == .front || slot == .side
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // Real AVFoundation preview (runtime flag, not #if, so macOS test runners pass)
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

            // V8: honey silhouette overlay centered in viewfinder
            if showSilhouette && !coordinator.useMockCamera {
                Image("logo-icon-honey")
                    .resizable()
                    .renderingMode(.template)
                    .foregroundStyle(Color.honey)
                    .scaledToFit()
                    .frame(height: 280)
                    .opacity(0.55)
            }

            VStack {
                // Top chrome — V6: glass pill; V7: DarkIconButton close
                HStack {
                    DarkIconButton(systemName: "xmark") {
                        coordinator.path.removeLast()
                    }
                    .accessibilityLabel("Close camera")
                    Spacer()
                    // V6: Pill now uses thick glass with ink text (updated in Pill.swift)
                    Pill(pillText)
                    Spacer()
                    // Balance the close button
                    Color.clear.frame(width: 44, height: 44)
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.top, Spacing.s3)

                Spacer()

                if coordinator.useMockCamera {
                    mockContent
                    Spacer()
                } else {
                    Text(tipText)
                        .petsona(.caption)
                        .foregroundStyle(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, Spacing.s5)
                        .padding(.bottom, Spacing.s3)

                    // B2/B3/B4: flash + library + 4-spacer layout
                    HStack {
                        Spacer()
                        // B3: photo library picker
                        PhotosPicker(
                            selection: $selectedLibraryItem,
                            matching: .images,
                            photoLibrary: .shared()
                        ) {
                            // Appearance extracted to a View struct so glassBackground
                            // is called from a @MainActor body (Swift 6 Sendable requirement)
                            CameraControlIcon(systemName: "photo.on.rectangle")
                        }
                        Spacer()
                        ShutterButton {
                            Task { await captureAndAdvance() }
                        }
                        Spacer()
                        // B2: flash toggle (replaces flip-camera)
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
        // B3: handle library selection
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

    // MARK: - Mock content (XCUITest / macOS runner path)

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
        if let image = try? await cameraSession.capturePhoto(flashMode: flashEnabled ? .on : .off) {
            coordinator.capturePhoto(slot: slot, image: image)
        }
    }
}

// MARK: - Camera control icon appearance (separate View so glassBackground is @MainActor)

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

import SwiftUI
import OSLog

// MARK: - Navigation step enum

enum OnboardingStep: Hashable {
    case cameraExplainer
    case cameraPermissionDenied
    case cameraCapture(PhotoSlot)
    case photoCollection
    case profileReview
    // Phase 2+ placeholders — not navigated to in Phase 1
    case personality
    case goals
    case location
    case generating
    case petsonaReady
    case paywall
    case signIn
}

// MARK: - Coordinator

@Observable @MainActor
final class OnboardingCoordinator {
    var path: [OnboardingStep] = []
    var capturedPhotos = CapturedPhotos()
    var profile: PetProfile = .mochi
    var permissionState: CameraPermissionState = .notDetermined
    var isDocumentSkipped = false

    // Runtime flag: true when launched with mock camera args (XCUITest / macOS test runner).
    // Views check this instead of #if targetEnvironment(simulator) so tests pass on macOS.
    let useMockCamera: Bool

    private let permissionProvider: any CameraPermissionProviding
    private let collectionAdvanceDelay: Duration

    init(
        permissionProvider: any CameraPermissionProviding = CameraPermissionProvider(),
        collectionAdvanceDelay: Duration = .seconds(2.5),
        useMockCamera: Bool = false
    ) {
        self.permissionProvider = permissionProvider
        self.collectionAdvanceDelay = collectionAdvanceDelay
        self.useMockCamera = useMockCamera
    }

    // MARK: - Computed

    /// Derived from capturedPhotos; not stored. Lives in the coordinator, not in views.
    var activeSlot: PhotoSlot? {
        if capturedPhotos.front == nil { return .front }
        if capturedPhotos.side == nil  { return .side }
        if capturedPhotos.document == nil && !isDocumentSkipped { return .document }
        return nil
    }

    // MARK: - Navigation

    func start() {
        path = [.cameraExplainer]
    }

    func requestCameraPermission() async {
        let state = await permissionProvider.requestAccess()
        permissionState = state
        switch state {
        case .authorized:
            path.removeAll { $0 == .cameraPermissionDenied }
            // Push photoCollection first so camera sits on top; after capture we pop back to it.
            if !path.contains(.photoCollection) {
                path.append(.photoCollection)
            }
            path.append(.cameraCapture(activeSlot ?? .front))
        case .denied, .restricted:
            if !path.contains(.cameraPermissionDenied) {
                path.append(.cameraPermissionDenied)
            }
        case .notDetermined:
            break
        }
    }

    func capturePhoto(slot: PhotoSlot, image: UIImage) {
        capturedPhotos[slot] = image
        path.removeAll { $0 == .cameraCapture(slot) }
    }

    func retake(slot: PhotoSlot) {
        capturedPhotos[slot] = nil
        path.append(.cameraCapture(slot))
    }

    func navigateToCamera(slot: PhotoSlot) {
        path.append(.cameraCapture(slot))
    }

    func advanceFromCollection() async {
        if collectionAdvanceDelay > .zero {
            try? await Task.sleep(for: collectionAdvanceDelay)
        }
        path.append(.profileReview)
    }

    func skipDocument() {
        isDocumentSkipped = true
        Task { await advanceFromCollection() }
    }

    /// Called when the app returns to the foreground from Settings.
    /// If the user granted camera access while away, pops the denied screen and pushes camera.
    func foregroundResumed() {
        guard path.contains(.cameraPermissionDenied) else { return }
        let currentState = permissionProvider.status
        if currentState == .authorized {
            permissionState = .authorized
            path.removeAll { $0 == .cameraPermissionDenied }
            path.append(.cameraCapture(activeSlot ?? .front))
        }
    }

    // MARK: - Profile setters (typed; avoids generic KeyPath complexity for 7 fields)

    func setBreed(_ value: String)           { profile.breed = value }
    func setName(_ value: String)            { profile.name = value }
    func setGender(_ value: Gender)          { profile.gender = value }
    func setAgeMonths(_ value: Int)          { profile.ageMonths = value }
    func setWeight(_ value: Double)          { profile.weight = value }
    func setWeightUnit(_ value: WeightUnit)  { profile.weightUnit = value }
    func setColor(_ value: String)           { profile.color = value }

    func removeVetRecord(id: UUID) {
        profile.vetRecords.removeAll { $0.id == id }
    }
}

// MARK: - Factory for environment injection

extension OnboardingCoordinator {
    static func forCurrentEnvironment() -> OnboardingCoordinator {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        if args.contains("-MockCameraPermission") {
            let state: CameraPermissionState = args.contains("grant") ? .authorized : .denied
            return OnboardingCoordinator(
                permissionProvider: MockCameraPermissionProvider(state: state),
                collectionAdvanceDelay: .zero,
                useMockCamera: true
            )
        }
        #endif
        return OnboardingCoordinator()
    }
}

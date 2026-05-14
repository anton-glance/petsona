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

    private let permissionProvider: any CameraPermissionProviding
    private let collectionAdvanceDelay: Duration

    init(
        permissionProvider: any CameraPermissionProviding = CameraPermissionProvider(),
        collectionAdvanceDelay: Duration = .seconds(2.5)
    ) {
        self.permissionProvider = permissionProvider
        self.collectionAdvanceDelay = collectionAdvanceDelay
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
                collectionAdvanceDelay: .zero
            )
        }
        #endif
        return OnboardingCoordinator()
    }
}
